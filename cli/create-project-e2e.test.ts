/**
 * End-to-end verification tests for project scaffolding workflow.
 * 
 * These tests verify that scaffolding creates usable projects with expected
 * artifacts and structure, focusing on the primary React (Next.js) path as
 * specified in issue #36.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { materializeProject } from './lib/materializer.js';
import type { CreateContext } from './create-project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const E2E_OUTPUT_DIR = path.join(repoRoot, '.test-e2e-output');

beforeEach(() => {
  if (fs.existsSync(E2E_OUTPUT_DIR)) {
    fs.rmSync(E2E_OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(E2E_OUTPUT_DIR, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(E2E_OUTPUT_DIR)) {
    fs.rmSync(E2E_OUTPUT_DIR, { recursive: true, force: true });
  }
});

describe('E2E: Next.js Frontend Scaffolding', () => {
  it('should create a complete Next.js project with all expected artifacts', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-nextjs-e2e',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-nextjs-e2e'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    // Verify basic materialization result
    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 0, 'Files should be created');
    assert.ok(result.directoriesCreated > 0, 'Directories should be created');

    // Core scaffold entrypoints
    assertFileExists(ctx.outputPath, 'package.json', 'package.json');
    assertFileExists(ctx.outputPath, 'tsconfig.json', 'tsconfig.json');
    assertFileExists(ctx.outputPath, 'next.config.js', 'next.config.js');
    assertFileExists(ctx.outputPath, '.env.example', '.env.example');

    // App Router structure
    assertFileExists(ctx.outputPath, 'src/app/layout.tsx', 'App Router layout');
    assertFileExists(ctx.outputPath, 'src/app/page.tsx', 'App Router page');
    assertFileExists(ctx.outputPath, 'src/app/providers.tsx', 'React Query providers');

    // Sample features from scaffold
    assertFileExists(ctx.outputPath, 'src/features/reports/report-service.ts', 'Reports service');
    assertFileExists(ctx.outputPath, 'src/features/reports/report-service.test.ts', 'Reports service test');
    assertFileExists(ctx.outputPath, 'src/features/admin/feature-flag-service.ts', 'Feature flag service');

    // Testing configuration
    assertFileExists(ctx.outputPath, 'vitest.config.ts', 'Vitest config');
    assertFileExists(ctx.outputPath, 'playwright.config.ts', 'Playwright config');

    // Standards artifacts
    assertFileExists(ctx.outputPath, 'AGENTS.md', 'AGENTS.md');
    assertFileExists(ctx.outputPath, '.cursor/rules', '.cursor/rules');
    assertFileExists(ctx.outputPath, 'docs/conventions.md', 'conventions.md');

    // Verify package.json contents
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8')
    );
    assert.strictEqual(packageJson.name, 'test-nextjs-e2e', 'Project name in package.json');
    assert.ok(packageJson.dependencies?.['react'], 'React dependency');
    assert.ok(packageJson.dependencies?.['next'], 'Next.js dependency');
    assert.ok(packageJson.dependencies?.['@tanstack/react-query'], 'TanStack Query dependency');
    assert.ok(packageJson.dependencies?.['zustand'], 'Zustand dependency');
    assert.ok(packageJson.devDependencies?.['vitest'], 'Vitest dev dependency');
    assert.ok(packageJson.devDependencies?.['@playwright/test'], 'Playwright dev dependency');

    // Verify AGENTS.md contents
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('test-nextjs-e2e'), 'Project name in AGENTS.md');
    assert.ok(agentsMd.includes('Next.js'), 'Framework name in AGENTS.md');
    assert.ok(agentsMd.includes('nextjs'), 'Stack key in AGENTS.md');
    assert.ok(agentsMd.includes('TanStack Query'), 'State management in AGENTS.md');
    assert.ok(agentsMd.includes('Zustand'), 'Client state in AGENTS.md');
    assert.ok(agentsMd.includes('CAP-FF-001'), 'Feature flag capability in AGENTS.md');
    assert.ok(agentsMd.includes('CAP-REP-001'), 'Reporting capability in AGENTS.md');

    // Verify .cursor/rules contents
    const cursorRules = fs.readFileSync(path.join(ctx.outputPath, '.cursor', 'rules'), 'utf8');
    assert.ok(cursorRules.includes('Next.js'), 'Framework in .cursor/rules');
    assert.ok(cursorRules.includes('TanStack Query'), 'Server state in .cursor/rules');
    assert.ok(cursorRules.includes('Zustand'), 'Client state in .cursor/rules');
    assert.ok(cursorRules.includes('Vitest'), 'Test framework in .cursor/rules');
    assert.ok(cursorRules.includes('Playwright'), 'E2E framework in .cursor/rules');

    // Verify conventions.md contents
    const conventionsMd = fs.readFileSync(
      path.join(ctx.outputPath, 'docs', 'conventions.md'),
      'utf8'
    );
    assert.ok(conventionsMd.includes('test-nextjs-e2e'), 'Project name in conventions.md');
    assert.ok(conventionsMd.includes('Next.js'), 'Framework in conventions.md');
    assert.ok(conventionsMd.includes('nextjs'), 'Stack key in conventions.md');
  });

  it('should create valid TypeScript configuration', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-ts-config',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-ts-config'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    const tsconfigPath = path.join(ctx.outputPath, 'tsconfig.json');
    assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json should exist');

    // Verify it's valid JSON
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    assert.ok(tsconfig.compilerOptions, 'tsconfig should have compilerOptions');
    assert.ok(tsconfig.include, 'tsconfig should have include');
  });

  it('should create valid Next.js configuration', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-next-config',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-next-config'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    const nextConfigPath = path.join(ctx.outputPath, 'next.config.js');
    assert.ok(fs.existsSync(nextConfigPath), 'next.config.js should exist');

    // Verify it's valid JavaScript (basic syntax check)
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    assert.ok(nextConfig.includes('export default') || nextConfig.includes('module.exports'), 'next.config.js should export config');
  });

  it('should create valid Vitest configuration', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-vitest-config',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-vitest-config'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    const vitestConfigPath = path.join(ctx.outputPath, 'vitest.config.ts');
    assert.ok(fs.existsSync(vitestConfigPath), 'vitest.config.ts should exist');

    const vitestConfig = fs.readFileSync(vitestConfigPath, 'utf8');
    assert.ok(vitestConfig.includes('defineConfig'), 'vitest.config.ts should use defineConfig');
  });

  it('should create valid Playwright configuration', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-playwright-config',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-playwright-config'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    const playwrightConfigPath = path.join(ctx.outputPath, 'playwright.config.ts');
    assert.ok(fs.existsSync(playwrightConfigPath), 'playwright.config.ts should exist');

    const playwrightConfig = fs.readFileSync(playwrightConfigPath, 'utf8');
    assert.ok(
      playwrightConfig.includes('defineConfig'),
      'playwright.config.ts should use defineConfig'
    );
  });

  it('should render project name in all key files', async () => {
    const projectName = 'test-project-name-rendering';
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName,
      outputPath: path.join(E2E_OUTPUT_DIR, projectName),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    // Verify project name is rendered (not {{projectName}})
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8')
    );
    assert.strictEqual(packageJson.name, projectName, 'package.json should have rendered name');
    assert.ok(!packageJson.name.includes('{{'), 'No unrendered template variables in package.json');

    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes(projectName), 'AGENTS.md should include project name');
    assert.ok(!agentsMd.includes('{{projectName}}'), 'No unrendered template variables in AGENTS.md');
  });
});

describe('E2E: SvelteKit Frontend Scaffolding', () => {
  it('should create a complete SvelteKit project with expected artifacts', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-sveltekit-e2e',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-sveltekit-e2e'),
      frontendStack: 'sveltekit',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 0);

    // Core SvelteKit files
    assertFileExists(ctx.outputPath, 'package.json', 'package.json');
    assertFileExists(ctx.outputPath, 'svelte.config.js', 'svelte.config.js');
    assertFileExists(ctx.outputPath, 'src/app.html', 'app.html');
    assertFileExists(ctx.outputPath, 'src/routes/+layout.svelte', '+layout.svelte');
    assertFileExists(ctx.outputPath, 'src/routes/+page.svelte', '+page.svelte');

    // Standards artifacts
    assertFileExists(ctx.outputPath, 'AGENTS.md', 'AGENTS.md');
    assertFileExists(ctx.outputPath, '.cursor/rules', '.cursor/rules');

    // Verify package.json
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8')
    );
    assert.strictEqual(packageJson.name, 'test-sveltekit-e2e');
    assert.ok(packageJson.dependencies?.['svelte'], 'Svelte dependency');
    assert.ok(packageJson.dependencies?.['@sveltejs/kit'], 'SvelteKit dependency');
  });
});

describe('E2E: Backend Scaffolding', () => {
  it('should create a Python FastAPI backend with expected artifacts', async () => {
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'test-python-e2e',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-python-e2e'),
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 0);

    // Core Python files
    assertFileExists(ctx.outputPath, 'main.py', 'main.py');
    assertFileExists(ctx.outputPath, 'requirements.txt', 'requirements.txt');
    assertFileExists(ctx.outputPath, 'src/app.py', 'src/app.py');
    assertFileExists(ctx.outputPath, 'src/config.py', 'src/config.py');
    assertFileExists(ctx.outputPath, 'src/api/health.py', 'health endpoint');
    assertFileExists(ctx.outputPath, 'src/api/reports.py', 'reports endpoint');

    // Standards artifacts
    assertFileExists(ctx.outputPath, 'AGENTS.md', 'AGENTS.md');
    assertFileExists(ctx.outputPath, '.cursor/rules', '.cursor/rules');

    // Verify requirements.txt
    const requirements = fs.readFileSync(path.join(ctx.outputPath, 'requirements.txt'), 'utf8');
    assert.ok(requirements.includes('fastapi'), 'FastAPI should be in requirements');
    assert.ok(requirements.includes('uvicorn'), 'Uvicorn should be in requirements');
  });
});

describe('E2E: Fullstack Scaffolding', () => {
  it('should create a fullstack project with frontend and backend artifacts', async () => {
    const ctx: CreateContext = {
      archetype: 'fullstack',
      projectName: 'test-fullstack-e2e',
      outputPath: path.join(E2E_OUTPUT_DIR, 'test-fullstack-e2e'),
      frontendStack: 'nextjs',
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 0);

    // Frontend files
    assertFileExists(ctx.outputPath, 'package.json', 'Frontend package.json');
    assertFileExists(ctx.outputPath, 'src/app/layout.tsx', 'Next.js layout');

    // Backend files
    assertFileExists(ctx.outputPath, 'requirements.txt', 'Backend requirements.txt');
    assertFileExists(ctx.outputPath, 'main.py', 'Backend main.py');

    // Shared standards artifacts
    assertFileExists(ctx.outputPath, 'AGENTS.md', 'Shared AGENTS.md');
    assertFileExists(ctx.outputPath, '.cursor/rules', 'Shared .cursor/rules');

    // Verify AGENTS.md includes frontend stack (backend stack support is a known limitation)
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('Next.js') || agentsMd.includes('nextjs'), 'Should mention Next.js');
    // Note: Fullstack AGENTS.md currently only shows frontend stack
    // Backend stack integration is tracked separately
  });
});

/**
 * Helper to assert a file exists with clear error message.
 */
function assertFileExists(projectPath: string, relativePath: string, description: string): void {
  const fullPath = path.join(projectPath, relativePath);
  assert.ok(
    fs.existsSync(fullPath),
    `${description} should exist at ${relativePath}`
  );
}
