/**
 * Materialization orchestrator - generates physical project files from resolved specs.
 * 
 * Materialization strategy:
 * 1. Check for scaffold/ subdirectory in template dir (future extensibility)
 * 2. Copy .env.example and other static files from template dir
 * 3. Generate stack-aware manifest files (package.json for frontend, requirements.txt for Python, etc.)
 * 4. Generate standards artifacts (AGENTS.md, .cursor/rules, conventions.md)
 * 5. Write to temp directory first, then move atomically (no partial output on failure)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { resolveArchetype, type ResolvedContext } from './resolver.js';
import { buildTemplateVariables, renderTemplate, type TemplateVariables } from './template-renderer.js';
import { generateAgentsMdContent, generateCursorRulesContent, generateConventionsMdContent } from './standards-templates.js';
import { logger } from './logger.js';
import type { CreateContext } from '../create-project.js';

export interface MaterializationResult {
  projectPath: string;
  filesCreated: number;
  directoriesCreated: number;
}

/**
 * Orchestrates the materialization of a project from template specs.
 * 
 * Phases:
 * 1. Resolve - Get resolved context with template specs
 * 2. Prepare - Create temp directory
 * 3. Materialize - Generate all files in temp
 * 4. Move - Atomically move temp to final location
 * 5. Cleanup - Remove temp on success or failure
 */
export async function materializeProject(ctx: CreateContext): Promise<MaterializationResult> {
  logger.info('materialization_start', {
    projectName: ctx.projectName,
    outputPath: ctx.outputPath,
  });

  validateOutputPath(ctx.outputPath);

  const resolved = resolveArchetype(ctx);
  const variables = buildTemplateVariables(resolved);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-project-'));
  let filesCreated = 0;
  let directoriesCreated = 0;

  try {
    const result = await materializeInTemp(tempDir, resolved, variables);
    filesCreated = result.filesCreated;
    directoriesCreated = result.directoriesCreated;

    if (fs.existsSync(ctx.outputPath)) {
      fs.rmSync(ctx.outputPath, { recursive: true, force: true });
    }

    fs.mkdirSync(path.dirname(ctx.outputPath), { recursive: true });
    fs.renameSync(tempDir, ctx.outputPath);

    logger.info('materialization_complete', {
      projectPath: ctx.outputPath,
      filesCreated,
      directoriesCreated,
    });

    return {
      projectPath: ctx.outputPath,
      filesCreated,
      directoriesCreated,
    };
  } catch (err) {
    logger.error('materialization_failed', {
      error: err instanceof Error ? err.message : String(err),
    });

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    throw err;
  }
}

function validateOutputPath(outputPath: string): void {
  if (fs.existsSync(outputPath)) {
    const files = fs.readdirSync(outputPath);
    if (files.length > 0) {
      throw new Error(`Output directory is not empty: ${outputPath}. Please choose an empty directory or remove existing files.`);
    }
  }
}

async function materializeInTemp(
  tempDir: string,
  resolved: ResolvedContext,
  variables: TemplateVariables
): Promise<{ filesCreated: number; directoriesCreated: number }> {
  let filesCreated = 0;
  const directoriesCreated = 0;

  const directories = determineDirectories(resolved);
  for (const dir of directories) {
    const fullPath = path.join(tempDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  if (resolved.frontend) {
    filesCreated += await materializeFrontendStack(tempDir, resolved.frontend, variables);
  }

  if (resolved.backend) {
    filesCreated += await materializeBackendStack(tempDir, resolved.backend, variables);
  }

  filesCreated += await generateStandardsArtifacts(tempDir, variables);

  return { filesCreated, directoriesCreated: directories.length };
}

function determineDirectories(resolved: ResolvedContext): string[] {
  const dirs: Set<string> = new Set(['docs', '.cursor', '.github', '.github/workflows']);

  if (resolved.frontend) {
    dirs.add('src');
    dirs.add('src/app');
    dirs.add('src/features');
    dirs.add('src/lib');
    dirs.add('src/components');
    dirs.add('tests');
    dirs.add('tests/unit');
    dirs.add('tests/e2e');
    dirs.add('public');

    const spec = resolved.frontend.spec;
    if (spec.required_routes) {
      for (const route of spec.required_routes) {
        const routePath = route.replace(/^\//, '').replace(/\//g, path.sep);
        if (routePath) {
          dirs.add(path.join('src', 'app', routePath));
        }
      }
    }

    const featureFolders = extractFeatureFolders(spec.required_capabilities);
    for (const feature of featureFolders) {
      dirs.add(path.join('src', 'features', feature));
    }
  }

  if (resolved.backend) {
    if (!resolved.frontend) {
      dirs.add('src');
      dirs.add('tests');
      dirs.add('tests/unit');
      dirs.add('tests/e2e');
    }

    dirs.add('src/api');
    dirs.add('src/models');
    dirs.add('src/services');

    const spec = resolved.backend.spec;
    const serviceFolders = extractFeatureFolders(spec.required_capabilities);
    for (const service of serviceFolders) {
      dirs.add(path.join('src', 'services', service));
    }
  }

  return Array.from(dirs).sort();
}

function extractFeatureFolders(capabilities: string[]): Set<string> {
  const folders = new Set<string>();
  for (const cap of capabilities) {
    if (cap.startsWith('CAP-REP-')) {
      folders.add('reports');
    } else if (cap.startsWith('CAP-FF-') || cap.startsWith('CAP-ADM-')) {
      folders.add('admin');
    }
  }
  return folders;
}

async function materializeFrontendStack(
  tempDir: string,
  stack: { stackDef: any; spec: any; templateDir: string },
  variables: TemplateVariables
): Promise<number> {
  let filesCreated = 0;

  const scaffoldDir = path.join(stack.templateDir, 'scaffold');
  if (fs.existsSync(scaffoldDir)) {
    filesCreated += await copyScaffoldAssets(scaffoldDir, tempDir, variables);
  }

  if (stack.stackDef.env) {
    const envPath = path.join(variables.createContext.repoRoot, stack.stackDef.env);
    if (!fs.existsSync(envPath)) {
      throw new Error(`Required template file not found: ${stack.stackDef.env}`);
    }
    fs.copyFileSync(envPath, path.join(tempDir, '.env.example'));
    filesCreated++;
  }

  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    generateFrontendPackageJson(variables),
    'utf8'
  );
  filesCreated++;

  fs.writeFileSync(
    path.join(tempDir, 'tsconfig.json'),
    generateTsConfig(variables),
    'utf8'
  );
  filesCreated++;

  const ciPath = path.join(variables.createContext.repoRoot, 'templates', 'shared', 'workflows', 'ci-pr.yaml');
  if (fs.existsSync(ciPath)) {
    fs.copyFileSync(ciPath, path.join(tempDir, '.github', 'workflows', 'ci-pr.yaml'));
    filesCreated++;
  }

  return filesCreated;
}

async function materializeBackendStack(
  tempDir: string,
  stack: { stackDef: any; spec: any; templateDir: string },
  variables: TemplateVariables
): Promise<number> {
  let filesCreated = 0;

  const scaffoldDir = path.join(stack.templateDir, 'scaffold');
  if (fs.existsSync(scaffoldDir)) {
    filesCreated += await copyScaffoldAssets(scaffoldDir, tempDir, variables);
  }

  if (stack.stackDef.env && !variables.createContext.frontendStack) {
    const envPath = path.join(variables.createContext.repoRoot, stack.stackDef.env);
    if (!fs.existsSync(envPath)) {
      throw new Error(`Required template file not found: ${stack.stackDef.env}`);
    }
    fs.copyFileSync(envPath, path.join(tempDir, '.env.example'));
    filesCreated++;
  }

  if (variables.stackKey === 'python') {
    fs.writeFileSync(
      path.join(tempDir, 'requirements.txt'),
      generatePythonRequirements(variables),
      'utf8'
    );
    filesCreated++;
  } else if (variables.stackKey === 'go') {
    fs.writeFileSync(
      path.join(tempDir, 'go.mod'),
      generateGoMod(variables),
      'utf8'
    );
    filesCreated++;
  } else if (variables.stackKey === 'rust') {
    fs.writeFileSync(
      path.join(tempDir, 'Cargo.toml'),
      generateCargoToml(variables),
      'utf8'
    );
    filesCreated++;
  } else if (variables.stackKey === 'dotnet') {
    fs.writeFileSync(
      path.join(tempDir, `${variables.projectName}.csproj`),
      generateCsProj(variables),
      'utf8'
    );
    filesCreated++;
  } else if (variables.stackKey === 'java') {
    fs.writeFileSync(
      path.join(tempDir, 'pom.xml'),
      generatePomXml(variables),
      'utf8'
    );
    filesCreated++;
  }

  if (!variables.createContext.frontendStack) {
    const ciPath = path.join(variables.createContext.repoRoot, 'templates', 'shared', 'workflows', 'ci-pr.yaml');
    if (fs.existsSync(ciPath)) {
      fs.copyFileSync(ciPath, path.join(tempDir, '.github', 'workflows', 'ci-pr.yaml'));
      filesCreated++;
    }
  }

  return filesCreated;
}

async function copyScaffoldAssets(
  scaffoldDir: string,
  targetDir: string,
  variables: TemplateVariables
): Promise<number> {
  let filesCreated = 0;
  const entries = fs.readdirSync(scaffoldDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(scaffoldDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      filesCreated += await copyScaffoldAssets(sourcePath, targetPath, variables);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.template')) {
        const content = fs.readFileSync(sourcePath, 'utf8');
        const rendered = renderTemplate(content, variables);
        const finalPath = targetPath.replace(/\.template$/, '');
        fs.writeFileSync(finalPath, rendered, 'utf8');
        filesCreated++;
      } else {
        fs.copyFileSync(sourcePath, targetPath);
        filesCreated++;
      }
    }
  }

  return filesCreated;
}

async function generateStandardsArtifacts(
  tempDir: string,
  variables: TemplateVariables
): Promise<number> {
  let filesCreated = 0;

  fs.writeFileSync(
    path.join(tempDir, 'AGENTS.md'),
    generateAgentsMdContent(variables),
    'utf8'
  );
  filesCreated++;

  fs.writeFileSync(
    path.join(tempDir, '.cursor', 'rules'),
    generateCursorRulesContent(variables),
    'utf8'
  );
  filesCreated++;

  fs.writeFileSync(
    path.join(tempDir, 'docs', 'conventions.md'),
    generateConventionsMdContent(variables),
    'utf8'
  );
  filesCreated++;

  return filesCreated;
}

function generateFrontendPackageJson(variables: TemplateVariables): string {
  const pkg: Record<string, any> = {
    name: variables.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {},
    dependencies: {},
    devDependencies: {
      'typescript': '^5.0.0',
    },
  };

  if (variables.stackKey === 'nextjs') {
    pkg.scripts = {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'test:unit': variables.unitTestCommand || 'vitest',
      'test:e2e': variables.e2eTestCommand || 'playwright test',
    };
    pkg.dependencies = {
      'next': '^14.0.0',
      'react': '^18.3.0',
      'react-dom': '^18.3.0',
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
    };
  } else if (variables.stackKey === 'sveltekit') {
    pkg.scripts = {
      dev: 'vite dev',
      build: 'vite build',
      preview: 'vite preview',
      'test:unit': variables.unitTestCommand || 'vitest',
      'test:e2e': variables.e2eTestCommand || 'playwright test',
    };
    pkg.dependencies = {
      'svelte': '^4.0.0',
      '@sveltejs/kit': '^2.0.0',
    };
  } else if (variables.stackKey === 'angular') {
    pkg.scripts = {
      dev: 'ng serve',
      build: 'ng build',
      'test:unit': variables.unitTestCommand || 'ng test',
      'test:e2e': variables.e2eTestCommand || 'ng e2e',
    };
    pkg.dependencies = {
      '@angular/core': '^17.0.0',
      '@angular/common': '^17.0.0',
      '@angular/platform-browser': '^17.0.0',
    };
  } else {
    pkg.scripts = {
      dev: 'vite dev',
      build: 'vite build',
      preview: 'vite preview',
      'test:unit': variables.unitTestCommand || 'vitest',
      'test:e2e': variables.e2eTestCommand || 'playwright test',
    };
    pkg.dependencies = {
      'react': '^18.3.0',
      'react-dom': '^18.3.0',
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
    };
  }

  return JSON.stringify(pkg, null, 2);
}

function generateTsConfig(variables: TemplateVariables): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      jsx: 'preserve',
      module: 'ESNext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowJs: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      incremental: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*', 'tests/**/*'],
    exclude: ['node_modules'],
  };

  return JSON.stringify(config, null, 2);
}

function generatePythonRequirements(variables: TemplateVariables): string {
  return `fastapi==0.104.0
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
alembic==1.12.1
structlog==23.2.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.1
`;
}

function generateGoMod(variables: TemplateVariables): string {
  return `module ${variables.projectName}

go 1.21

require (
	github.com/gofiber/fiber/v2 v2.51.0
	github.com/stretchr/testify v1.8.4
)
`;
}

function generateCargoToml(variables: TemplateVariables): string {
  return `[package]
name = "${variables.projectName}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[dev-dependencies]
reqwest = "0.11"
`;
}

function generateCsProj(variables: TemplateVariables): string {
  return `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>
</Project>
`;
}

function generatePomXml(variables: TemplateVariables): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>${variables.projectName}</artifactId>
    <version>0.1.0</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
`;
}
