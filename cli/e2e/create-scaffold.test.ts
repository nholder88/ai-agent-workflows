/**
 * End-to-end tests for project scaffolding via CLI.
 * 
 * These tests actually invoke the CLI binary and verify complete project creation,
 * unlike unit tests which test internal APIs.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const TEST_OUTPUT_DIR = path.join(repoRoot, '.test-output-e2e');
const CLI_PATH = path.join(repoRoot, 'cli', 'pack-install.ts');

/**
 * Run the CLI with given arguments and return output.
 */
function runCLI(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(
      `node --import tsx "${CLI_PATH}" ${args.join(' ')}`,
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      }
    );
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || err.message || '',
      exitCode: err.status || 1,
    };
  }
}

/**
 * Verify a project directory has expected scaffold files.
 */
function verifyProjectStructure(
  projectPath: string,
  expectedFiles: string[]
): void {
  for (const file of expectedFiles) {
    const filePath = path.join(projectPath, file);
    assert.ok(
      fs.existsSync(filePath),
      `Expected file not found: ${file} (checked ${filePath})`
    );
  }
}

/**
 * Verify package.json has expected project name.
 */
function verifyPackageJson(projectPath: string, expectedName: string): void {
  const packageJsonPath = path.join(projectPath, 'package.json');
  assert.ok(fs.existsSync(packageJsonPath), 'package.json should exist');
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert.strictEqual(
    packageJson.name,
    expectedName,
    `package.json name should be ${expectedName}`
  );
}

/**
 * Verify Python project has expected requirements.txt.
 */
function verifyRequirementsTxt(projectPath: string): void {
  const reqPath = path.join(projectPath, 'requirements.txt');
  assert.ok(fs.existsSync(reqPath), 'requirements.txt should exist');
  
  const content = fs.readFileSync(reqPath, 'utf8');
  assert.ok(content.includes('fastapi'), 'requirements.txt should include fastapi');
  assert.ok(content.includes('uvicorn'), 'requirements.txt should include uvicorn');
}

/**
 * Verify generated standards artifacts exist and have content.
 */
function verifyStandardsArtifacts(projectPath: string): void {
  const agentsMd = path.join(projectPath, 'AGENTS.md');
  const cursorRules = path.join(projectPath, '.cursor', 'rules');
  const conventions = path.join(projectPath, 'docs', 'conventions.md');
  
  assert.ok(fs.existsSync(agentsMd), 'AGENTS.md should exist');
  assert.ok(fs.existsSync(cursorRules), '.cursor/rules should exist');
  assert.ok(fs.existsSync(conventions), 'docs/conventions.md should exist');
  
  const agentsContent = fs.readFileSync(agentsMd, 'utf8');
  assert.ok(agentsContent.includes('Project Agents'), 'AGENTS.md should have header');
  assert.ok(agentsContent.includes('Orchestrator'), 'AGENTS.md should list Orchestrator');
  
  const rulesContent = fs.readFileSync(cursorRules, 'utf8');
  assert.ok(rulesContent.includes('Cursor Rules'), '.cursor/rules should have header');
  
  const convContent = fs.readFileSync(conventions, 'utf8');
  assert.ok(convContent.includes('Stack Conventions'), 'conventions.md should have header');
}

beforeEach(() => {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
});

describe('E2E: Project Scaffolding via CLI', () => {
  it('should scaffold a Next.js frontend project', () => {
    const projectName = 'test-nextjs-e2e';
    const projectPath = path.join(TEST_OUTPUT_DIR, projectName);
    
    const result = runCLI([
      'create',
      'frontend',
      projectName,
      '--output',
      projectPath,
      '--stack',
      'nextjs',
      '--yes',
    ]);
    
    assert.strictEqual(result.exitCode, 0, `CLI should exit successfully. stderr: ${result.stderr}`);
    
    // Verify project directory was created
    assert.ok(fs.existsSync(projectPath), 'Project directory should exist');
    
    // Verify key scaffold files from templates/frontend-nextjs/scaffold/
    verifyProjectStructure(projectPath, [
      'package.json',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/app/providers.tsx',
      'src/features/reports/report-service.ts',
      'src/features/reports/report-service.test.ts',
      'src/features/reports/use-reports.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'tailwind.config.ts',
      'next.config.js',
    ]);
    
    // Verify package.json has correct name
    verifyPackageJson(projectPath, projectName);
    
    // Verify standards artifacts
    verifyStandardsArtifacts(projectPath);
  });

  it('should scaffold a SvelteKit frontend project', () => {
    const projectName = 'test-sveltekit-e2e';
    const projectPath = path.join(TEST_OUTPUT_DIR, projectName);
    
    const result = runCLI([
      'create',
      'frontend',
      projectName,
      '--output',
      projectPath,
      '--stack',
      'sveltekit',
      '--yes',
    ]);
    
    assert.strictEqual(result.exitCode, 0, `CLI should exit successfully. stderr: ${result.stderr}`);
    assert.ok(fs.existsSync(projectPath), 'Project directory should exist');
    
    verifyProjectStructure(projectPath, [
      'package.json',
      'src/app.html',
      'src/routes/+layout.svelte',
      'src/routes/+page.svelte',
      'src/routes/layout.css',
      'src/features/reports/report-service.ts',
      'src/features/reports/report-service.test.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'svelte.config.js',
    ]);
    
    verifyPackageJson(projectPath, projectName);
    verifyStandardsArtifacts(projectPath);
  });

  it('should scaffold a Python/FastAPI backend project', () => {
    const projectName = 'test-python-e2e';
    const projectPath = path.join(TEST_OUTPUT_DIR, projectName);
    
    const result = runCLI([
      'create',
      'backend',
      projectName,
      '--output',
      projectPath,
      '--stack',
      'python',
      '--yes',
    ]);
    
    assert.strictEqual(result.exitCode, 0, `CLI should exit successfully. stderr: ${result.stderr}`);
    assert.ok(fs.existsSync(projectPath), 'Project directory should exist');
    
    verifyProjectStructure(projectPath, [
      'requirements.txt',
      'requirements-dev.txt',
      'main.py',
      'src/app.py',
      'src/config.py',
      'src/api/health.py',
      'src/api/reports.py',
      'src/api/admin.py',
      'tests/unit/test_reporting_service.py',
      'tests/e2e/test_api_smoke.py',
    ]);
    
    verifyRequirementsTxt(projectPath);
    verifyStandardsArtifacts(projectPath);
  });

  it('should scaffold a NestJS backend project', () => {
    const projectName = 'test-nestjs-e2e';
    const projectPath = path.join(TEST_OUTPUT_DIR, projectName);
    
    const result = runCLI([
      'create',
      'backend',
      projectName,
      '--output',
      projectPath,
      '--stack',
      'node_nestjs',
      '--yes',
    ]);
    
    assert.strictEqual(result.exitCode, 0, `CLI should exit successfully. stderr: ${result.stderr}`);
    assert.ok(fs.existsSync(projectPath), 'Project directory should exist');
    
    verifyProjectStructure(projectPath, [
      'package.json',
      'nest-cli.json',
      'tsconfig.json',
      'src/main.ts',
      'src/app.module.ts',
      'src/health/health.controller.ts',
      'src/reports/reports.controller.ts',
      'src/reports/reports.service.ts',
      'src/reports/reports.service.spec.ts',
      'test/api-smoke.e2e-spec.ts',
    ]);
    
    verifyPackageJson(projectPath, projectName);
    verifyStandardsArtifacts(projectPath);
  });

  it('should scaffold a fullstack project (Next.js + Python)', () => {
    const projectName = 'test-fullstack-e2e';
    const projectPath = path.join(TEST_OUTPUT_DIR, projectName);
    
    const result = runCLI([
      'create',
      'fullstack',
      projectName,
      '--output',
      projectPath,
      '--frontend',
      'nextjs',
      '--backend',
      'python',
      '--yes',
    ]);
    
    assert.strictEqual(result.exitCode, 0, `CLI should exit successfully. stderr: ${result.stderr}`);
    assert.ok(fs.existsSync(projectPath), 'Project directory should exist');
    
    // Fullstack creates a single monolithic project with both frontend and backend files
    verifyProjectStructure(projectPath, [
      // Frontend files (Next.js)
      'package.json',
      'next.config.js',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'vitest.config.ts',
      'playwright.config.ts',
      // Backend files (Python/FastAPI)
      'requirements.txt',
      'requirements-dev.txt',
      'main.py',
      'src/api/health.py',
      'src/api/reports.py',
      'tests/unit/test_reporting_service.py',
    ]);
    
    // Verify standards artifacts
    verifyStandardsArtifacts(projectPath);
    
    // Verify package.json has correct name
    verifyPackageJson(projectPath, projectName);
  });

  it('should fail gracefully with invalid stack', () => {
    const projectPath = path.join(TEST_OUTPUT_DIR, 'test-invalid');
    const result = runCLI([
      'create',
      'frontend',
      'test-invalid',
      '--output',
      projectPath,
      '--stack',
      'invalid-framework',
      '--yes',
    ]);
    
    assert.notStrictEqual(result.exitCode, 0, 'CLI should exit with error');
    assert.ok(
      result.stderr.includes('invalid') || result.stdout.includes('invalid'),
      'Error message should mention invalid stack'
    );
  });

  it('should fail gracefully when output directory is not empty', () => {
    const projectName = 'test-nonempty';
    const projectPath = path.join(TEST_OUTPUT_DIR, projectName);
    
    // Create directory with a file
    fs.mkdirSync(projectPath, { recursive: true });
    fs.writeFileSync(path.join(projectPath, 'existing-file.txt'), 'content');
    
    const result = runCLI([
      'create',
      'frontend',
      projectName,
      '--output',
      projectPath,
      '--stack',
      'nextjs',
      '--yes',
    ]);
    
    assert.notStrictEqual(result.exitCode, 0, 'CLI should exit with error');
    assert.ok(
      result.stderr.includes('not empty') || result.stdout.includes('not empty'),
      'Error message should mention non-empty directory'
    );
  });
});
