/**
 * End-to-end tests for create-project workflow.
 * 
 * These tests verify the complete scaffolding flow from CLI invocation
 * to generated project structure and artifacts.
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
const TEST_OUTPUT_DIR = path.join(repoRoot, '.test-output-e2e');

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

describe('create-project end-to-end', () => {
  it('should scaffold a complete Next.js project with all required artifacts', async () => {
    // Arrange: Create context for Next.js frontend
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'e2e-nextjs-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'e2e-nextjs-app'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    // Act: Materialize the project
    const result = await materializeProject(ctx);

    // Assert: Verify result metadata
    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 25, `Expected >25 files, got ${result.filesCreated}`);
    assert.ok(result.directoriesCreated > 15, `Expected >15 dirs, got ${result.directoriesCreated}`);

    // Assert: Verify core project files exist
    const assertFileExists = (filePath: string, description: string) => {
      const fullPath = path.join(ctx.outputPath, filePath);
      assert.ok(fs.existsSync(fullPath), `${description} should exist: ${filePath}`);
    };

    // Package configuration
    assertFileExists('package.json', 'Package manifest');
    assertFileExists('tsconfig.json', 'TypeScript config');
    assertFileExists('.env.example', 'Environment template');

    // Next.js App Router structure
    assertFileExists('src/app/layout.tsx', 'Root layout');
    assertFileExists('src/app/page.tsx', 'Home page');
    assertFileExists('src/app/providers.tsx', 'Provider setup');

    // Feature modules with services and tests
    assertFileExists('src/features/reports/report-service.ts', 'Report service');
    assertFileExists('src/features/reports/report-service.test.ts', 'Report service unit test');
    assertFileExists('src/features/admin/feature-flag-service.ts', 'Feature flag service');

    // Test configuration
    assertFileExists('vitest.config.ts', 'Vitest config');
    assertFileExists('playwright.config.ts', 'Playwright config');
    assertFileExists('tests/e2e/reporting-admin.spec.ts', 'E2E test example');

    // Standards artifacts
    assertFileExists('AGENTS.md', 'Agent manifest');
    assertFileExists('.cursor/rules', 'Cursor rules');
    assertFileExists('docs/conventions.md', 'Conventions doc');

    // CI workflow
    assertFileExists('.github/workflows/ci-pr.yaml', 'CI workflow');

    // Assert: Verify package.json content
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8')
    );
    assert.strictEqual(packageJson.name, 'e2e-nextjs-app', 'Package name should match project name');
    assert.ok(packageJson.scripts.dev, 'Should have dev script');
    assert.ok(packageJson.scripts.build, 'Should have build script');
    assert.ok(packageJson.scripts['test:unit'], 'Should have test:unit script');
    assert.ok(packageJson.scripts['test:e2e'], 'Should have test:e2e script');
    assert.ok(packageJson.dependencies.next, 'Should have Next.js dependency');
    assert.ok(packageJson.dependencies.react, 'Should have React dependency');

    // Assert: Verify AGENTS.md content includes stack info
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('Next.js'), 'AGENTS.md should mention Next.js');
    assert.ok(agentsMd.includes('TanStack Query'), 'AGENTS.md should mention TanStack Query');
    assert.ok(agentsMd.includes('Zustand'), 'AGENTS.md should mention Zustand');
    assert.ok(agentsMd.includes('CAP-FF-001'), 'AGENTS.md should list feature flag capability');
    assert.ok(agentsMd.includes('CAP-REP-001'), 'AGENTS.md should list reporting capability');

    // Assert: Verify .cursor/rules content includes conventions
    const cursorRules = fs.readFileSync(path.join(ctx.outputPath, '.cursor/rules'), 'utf8');
    assert.ok(cursorRules.includes('State Management'), 'Rules should include state management section');
    assert.ok(cursorRules.includes('TanStack Query'), 'Rules should mention TanStack Query');
    assert.ok(cursorRules.includes('Zustand'), 'Rules should mention Zustand');
    assert.ok(cursorRules.includes('Testing'), 'Rules should include testing section');
    assert.ok(cursorRules.includes('Vitest'), 'Rules should mention Vitest');
    assert.ok(cursorRules.includes('test:e2e'), 'Rules should mention e2e test command');
    assert.ok(cursorRules.includes('Required Capabilities'), 'Rules should list required capabilities');

    // Assert: Verify docs/conventions.md includes traceability
    const conventionsMd = fs.readFileSync(path.join(ctx.outputPath, 'docs/conventions.md'), 'utf8');
    assert.ok(conventionsMd.includes('Generated:'), 'Conventions should include generation timestamp');
    assert.ok(conventionsMd.includes('Stack Conventions:'), 'Conventions should have title');
    assert.ok(conventionsMd.includes('Required Capabilities'), 'Conventions should list required capabilities');
    assert.ok(conventionsMd.includes('Next.js'), 'Conventions should mention Next.js');

    // Assert: Verify scaffold source files have proper structure
    const reportService = fs.readFileSync(
      path.join(ctx.outputPath, 'src/features/reports/report-service.ts'),
      'utf8'
    );
    assert.ok(reportService.length > 100, 'Report service should have real implementation');
    assert.ok(reportService.includes('export'), 'Report service should export symbols');

    const reportTest = fs.readFileSync(
      path.join(ctx.outputPath, 'src/features/reports/report-service.test.ts'),
      'utf8'
    );
    assert.ok(reportTest.includes('describe'), 'Test should use describe blocks');
    assert.ok(reportTest.includes('it(') || reportTest.includes('test('), 'Test should have test cases');
  });

  it('should scaffold a complete NestJS backend with all required artifacts', async () => {
    // Arrange: Create context for NestJS backend
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'e2e-nestjs-api',
      outputPath: path.join(TEST_OUTPUT_DIR, 'e2e-nestjs-api'),
      backendStack: 'node_nestjs',
      skipSkills: true,
      repoRoot,
    };

    // Act: Materialize the project
    const result = await materializeProject(ctx);

    // Assert: Verify result metadata
    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 25, `Expected >25 files, got ${result.filesCreated}`);

    // Assert: Verify NestJS structure
    const assertFileExists = (filePath: string, description: string) => {
      const fullPath = path.join(ctx.outputPath, filePath);
      assert.ok(fs.existsSync(fullPath), `${description} should exist: ${filePath}`);
    };

    assertFileExists('package.json', 'Package manifest');
    assertFileExists('nest-cli.json', 'NestJS CLI config');
    assertFileExists('src/main.ts', 'Main entry point');
    assertFileExists('src/app.module.ts', 'Root module');
    assertFileExists('src/health/health.controller.ts', 'Health controller');
    assertFileExists('src/reports/reports.controller.ts', 'Reports controller');
    assertFileExists('src/reports/reports.service.ts', 'Reports service');
    assertFileExists('src/reports/reports.service.spec.ts', 'Reports service test');
    assertFileExists('src/admin/admin.controller.ts', 'Admin controller');
    assertFileExists('test/api-smoke.e2e-spec.ts', 'E2E smoke test');
    assertFileExists('AGENTS.md', 'Agent manifest');
    assertFileExists('.cursor/rules', 'Cursor rules');

    // Assert: Verify package.json content
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8')
    );
    assert.strictEqual(packageJson.name, 'e2e-nestjs-api');
    assert.ok(packageJson.dependencies['@nestjs/core'], 'Should have NestJS core');
    assert.ok(packageJson.dependencies['@nestjs/common'], 'Should have NestJS common');
    assert.ok(packageJson.devDependencies.jest, 'Should have Jest for testing');

    // Assert: Verify AGENTS.md mentions NestJS
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('NestJS'), 'AGENTS.md should mention NestJS');
  });

  it('should scaffold a complete Python FastAPI backend with all required artifacts', async () => {
    // Arrange: Create context for Python backend
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'e2e-python-api',
      outputPath: path.join(TEST_OUTPUT_DIR, 'e2e-python-api'),
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    // Act: Materialize the project
    const result = await materializeProject(ctx);

    // Assert: Verify result metadata
    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 15, `Expected >15 files, got ${result.filesCreated}`);

    // Assert: Verify Python structure
    const assertFileExists = (filePath: string, description: string) => {
      const fullPath = path.join(ctx.outputPath, filePath);
      assert.ok(fs.existsSync(fullPath), `${description} should exist: ${filePath}`);
    };

    assertFileExists('requirements.txt', 'Requirements file');
    assertFileExists('main.py', 'Main entry point');
    assertFileExists('src/app.py', 'FastAPI app');
    assertFileExists('src/config.py', 'Configuration');
    assertFileExists('src/api/health.py', 'Health router');
    assertFileExists('src/api/reports.py', 'Reports router');
    assertFileExists('src/api/admin.py', 'Admin router');
    assertFileExists('tests/unit/test_reporting_service.py', 'Unit test');
    assertFileExists('tests/e2e/test_api_smoke.py', 'E2E smoke test');
    assertFileExists('AGENTS.md', 'Agent manifest');
    assertFileExists('.cursor/rules', 'Cursor rules');

    // Assert: Verify requirements.txt content
    const requirements = fs.readFileSync(path.join(ctx.outputPath, 'requirements.txt'), 'utf8');
    assert.ok(requirements.includes('fastapi'), 'Should have FastAPI');
    assert.ok(requirements.includes('uvicorn'), 'Should have Uvicorn');
    assert.ok(requirements.includes('pytest'), 'Should have pytest');

    // Assert: Verify AGENTS.md mentions Python/FastAPI
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('FastAPI') || agentsMd.includes('Python'), 'AGENTS.md should mention FastAPI or Python');
  });

  it('should scaffold a fullstack project combining frontend and backend', async () => {
    // Arrange: Create context for fullstack project
    const ctx: CreateContext = {
      archetype: 'fullstack',
      projectName: 'e2e-fullstack-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'e2e-fullstack-app'),
      frontendStack: 'nextjs',
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    // Act: Materialize the project
    const result = await materializeProject(ctx);

    // Assert: Verify result metadata
    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.filesCreated > 40, `Expected >40 files for fullstack, got ${result.filesCreated}`);

    // Assert: Verify both frontend and backend files exist
    const assertFileExists = (filePath: string, description: string) => {
      const fullPath = path.join(ctx.outputPath, filePath);
      assert.ok(fs.existsSync(fullPath), `${description} should exist: ${filePath}`);
    };

    // Frontend files
    assertFileExists('package.json', 'Package manifest (frontend)');
    assertFileExists('src/app/layout.tsx', 'Next.js layout');
    assertFileExists('src/features/reports/report-service.ts', 'Frontend report service');

    // Backend files
    assertFileExists('requirements.txt', 'Requirements (backend)');
    assertFileExists('main.py', 'Python main');
    assertFileExists('src/api/health.py', 'Backend health router');
    assertFileExists('src/api/reports.py', 'Backend reports router');

    // Shared standards
    assertFileExists('AGENTS.md', 'Agent manifest');
    assertFileExists('.cursor/rules', 'Cursor rules');

    // Assert: Verify AGENTS.md mentions frontend stack
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('Next.js'), 'AGENTS.md should mention Next.js');
    assert.ok(agentsMd.includes('Implementer'), 'AGENTS.md should mention implementer agent');
  });
});
