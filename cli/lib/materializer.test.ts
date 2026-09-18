/**
 * Tests for template materialization engine.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { materializeProject } from './materializer.js';
import type { CreateContext } from '../create-project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const TEST_OUTPUT_DIR = path.join(repoRoot, '.test-output');

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

describe('materializeProject', () => {
  it('should materialize a frontend project successfully', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-frontend-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-frontend-app'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.directoriesCreated > 0);
    assert.ok(result.filesCreated > 0);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'package.json')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, '.cursor', 'rules')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'docs', 'conventions.md')));

    // Verify scaffold files from templates/frontend-nextjs/scaffold/ are present
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'app', 'layout.tsx')), 'layout.tsx from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'app', 'page.tsx')), 'page.tsx from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'app', 'providers.tsx')), 'providers.tsx from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'features', 'reports', 'report-service.ts')), 'report-service.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'features', 'reports', 'report-service.test.ts')), 'report-service.test.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'vitest.config.ts')), 'vitest.config.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'playwright.config.ts')), 'playwright.config.ts from scaffold should exist');

    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.strictEqual(packageJson.name, 'test-frontend-app');
  });

  it('should apply nigel-react preset to nextjs project', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-preset-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-preset-app'),
      frontendStack: 'nextjs',
      preset: 'nigel-react',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);

    // Verify scaffold dependencies are preserved at their ORIGINAL versions
    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.strictEqual(packageJson.dependencies['@tanstack/react-query'], '^5.59.0', 'Query should keep scaffold version');
    assert.strictEqual(packageJson.dependencies['zustand'], '^5.0.0', 'Zustand should keep scaffold version');
    assert.ok(packageJson.devDependencies['tailwindcss'], 'Tailwind should be in devDependencies');
    assert.strictEqual(packageJson.devDependencies['vitest'], '^2.1.0', 'Vitest should keep scaffold version');
    assert.strictEqual(packageJson.devDependencies['@playwright/test'], '^1.48.0', 'Playwright should keep scaffold version');

    // Verify NO duplicate config files (scaffold has .ts/.mjs)
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'tailwind.config.ts')), 'Scaffold tailwind.config.ts should exist');
    assert.ok(!fs.existsSync(path.join(ctx.outputPath, 'tailwind.config.js')), 'Should NOT create duplicate tailwind.config.js');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'postcss.config.mjs')), 'Scaffold postcss.config.mjs should exist');
    assert.ok(!fs.existsSync(path.join(ctx.outputPath, 'postcss.config.js')), 'Should NOT create duplicate postcss.config.js');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'vitest.config.ts')), 'vitest.config.ts should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'playwright.config.ts')), 'playwright.config.ts should exist');

    // Verify preset is documented in AGENTS.md
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('Preset: Nigel React'), 'AGENTS.md should mention the preset');
    assert.ok(agentsMd.includes('TanStack Query'), 'AGENTS.md should mention TanStack Query');
    assert.ok(agentsMd.includes('Zustand'), 'AGENTS.md should mention Zustand');

    // Verify preset is documented in .cursor/rules
    const cursorRules = fs.readFileSync(path.join(ctx.outputPath, '.cursor', 'rules'), 'utf8');
    assert.ok(cursorRules.includes('Nigel React'), 'Cursor rules should mention the preset');
    assert.ok(cursorRules.includes('TanStack Query'), 'Cursor rules should mention TanStack Query');

    // Verify preset is documented in conventions.md
    const conventions = fs.readFileSync(path.join(ctx.outputPath, 'docs', 'conventions.md'), 'utf8');
    assert.ok(conventions.includes('Nigel React'), 'Conventions should mention the preset');
  });

  it('should apply nigel-react preset to sveltekit project', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-sveltekit-preset-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-sveltekit-preset-app'),
      frontendStack: 'sveltekit',
      preset: 'nigel-react',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);

    // Verify scaffold dependencies are preserved
    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.ok(packageJson.dependencies['svelte'], 'Svelte from scaffold should be preserved');
    assert.ok(packageJson.dependencies['@sveltejs/kit'], 'SvelteKit from scaffold should be preserved');
    
    // Scaffold already has TanStack Svelte Query ^5.59 - preset should not downgrade or change
    assert.strictEqual(packageJson.dependencies['@tanstack/svelte-query'], '^5.59.0', 'Query should keep scaffold version ^5.59');
    assert.ok(!packageJson.dependencies['zustand'], 'Zustand should not be in SvelteKit');
    assert.ok(!packageJson.dependencies['@tanstack/react-query'], 'React Query should not be in SvelteKit');

    // Verify preset did NOT add ANY devDependencies (scaffold already has everything)
    // SvelteKit scaffold has Tailwind 4, Vitest ^2.1, Playwright ^1.48
    assert.strictEqual(packageJson.devDependencies['tailwindcss'], '^4.0.0', 'Should have Tailwind 4 from scaffold, not ^3.4 from preset');
    assert.strictEqual(packageJson.devDependencies['vitest'], '^2.1.0', 'Should have Vitest ^2.1 from scaffold, not ^1.0 from preset');
    assert.strictEqual(packageJson.devDependencies['@playwright/test'], '^1.48.0', 'Should have Playwright ^1.48 from scaffold, not ^1.40 from preset');
    
    // Verify no Tailwind 3 tooling was added
    assert.ok(!packageJson.devDependencies['postcss'], 'Should not have postcss from preset');
    assert.ok(!packageJson.devDependencies['autoprefixer'], 'Should not have autoprefixer from preset');

    // Verify preset is documented (documents standards even when deps already exist)
    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('Preset: Nigel React'), 'AGENTS.md should mention the preset');
    assert.ok(agentsMd.includes('TanStack Query'), 'AGENTS.md should mention TanStack Query');
  });

  it('should materialize a SvelteKit frontend project successfully', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-sveltekit-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-sveltekit-app'),
      frontendStack: 'sveltekit',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.directoriesCreated > 0);
    assert.ok(result.filesCreated > 0);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'package.json')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, '.cursor', 'rules')));

    // Verify scaffold files from templates/frontend-sveltekit/scaffold/ are present
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'app.html')), 'app.html from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'routes', '+layout.svelte')), '+layout.svelte from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'routes', '+page.svelte')), '+page.svelte from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'routes', 'layout.css')), 'layout.css from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'features', 'reports', 'report-service.ts')), 'report-service.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'features', 'reports', 'report-service.test.ts')), 'report-service.test.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'vitest.config.ts')), 'vitest.config.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'playwright.config.ts')), 'playwright.config.ts from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'svelte.config.js')), 'svelte.config.js from scaffold should exist');

    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.strictEqual(packageJson.name, 'test-sveltekit-app');
  });

  it('should materialize a backend project successfully', async () => {
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'test-backend-api',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-backend-api'),
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.directoriesCreated > 0);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, '.cursor', 'rules')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'docs', 'conventions.md')));

    // Verify scaffold files from templates/backend-python/scaffold/ are present
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'main.py')), 'main.py from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'app.py')), 'src/app.py from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'config.py')), 'src/config.py from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'api', 'health.py')), 'src/api/health.py from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'src', 'api', 'reports.py')), 'src/api/reports.py from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'tests', 'unit', 'test_reporting_service.py')), 'test_reporting_service.py from scaffold should exist');
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'requirements.txt')), 'requirements.txt from scaffold should exist');
  });

  it('should materialize a fullstack project successfully', async () => {
    const ctx: CreateContext = {
      archetype: 'fullstack',
      projectName: 'test-fullstack-app',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-fullstack-app'),
      frontendStack: 'nextjs',
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    const result = await materializeProject(ctx);

    assert.strictEqual(result.projectPath, ctx.outputPath);
    assert.ok(result.directoriesCreated > 0);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, '.cursor', 'rules')));
  });

  it('should fail when output directory is not empty', async () => {
    const outputPath = path.join(TEST_OUTPUT_DIR, 'non-empty');
    fs.mkdirSync(outputPath, { recursive: true });
    fs.writeFileSync(path.join(outputPath, 'existing-file.txt'), 'content');

    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-app',
      outputPath,
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await assert.rejects(
      async () => await materializeProject(ctx),
      (err: Error) => {
        assert.ok(err.message.includes('Output directory is not empty'));
        return true;
      }
    );
  });

  it('should fail with invalid stack', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-invalid-stack',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-invalid-stack'),
      frontendStack: 'invalid-stack',
      skipSkills: true,
      repoRoot,
    };

    await assert.rejects(
      async () => await materializeProject(ctx),
      (err: Error) => {
        assert.ok(err.message.includes('not found in catalog'));
        return true;
      }
    );
  });

  it('should generate correct required capabilities in AGENTS.md', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-capabilities',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-capabilities'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    const agentsMd = fs.readFileSync(path.join(ctx.outputPath, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('CAP-FF-001'));
    assert.ok(agentsMd.includes('CAP-REP-001'));
  });

  it('should generate correct state management in .cursor/rules', async () => {
    const ctx: CreateContext = {
      archetype: 'frontend',
      projectName: 'test-state-mgmt',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-state-mgmt'),
      frontendStack: 'nextjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    const cursorRules = fs.readFileSync(path.join(ctx.outputPath, '.cursor', 'rules'), 'utf8');
    assert.ok(cursorRules.includes('TanStack Query'));
    assert.ok(cursorRules.includes('Zustand'));
  });

  it('should generate Python requirements.txt for Python backend (not React)', async () => {
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'test-python-backend',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-python-backend'),
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'requirements.txt')));
    assert.ok(!fs.existsSync(path.join(ctx.outputPath, 'package.json')));

    const requirements = fs.readFileSync(path.join(ctx.outputPath, 'requirements.txt'), 'utf8');
    assert.ok(requirements.includes('fastapi'));
    assert.ok(!requirements.includes('react'));
  });

  it('should generate go.mod for Go backend (not React)', async () => {
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'test-go-backend',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-go-backend'),
      backendStack: 'go',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'go.mod')));
    assert.ok(!fs.existsSync(path.join(ctx.outputPath, 'package.json')));

    const goMod = fs.readFileSync(path.join(ctx.outputPath, 'go.mod'), 'utf8');
    assert.ok(goMod.includes('test-go-backend'));
    assert.ok(goMod.includes('fiber'));
  });

  it('should generate package.json for NestJS backend (not React)', async () => {
    const ctx: CreateContext = {
      archetype: 'backend',
      projectName: 'test-nestjs-backend',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-nestjs-backend'),
      backendStack: 'node_nestjs',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'package.json')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'tsconfig.json')));

    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.ok(packageJson.dependencies['@nestjs/core']);
    assert.ok(packageJson.dependencies['@nestjs/common']);
    assert.ok(!packageJson.dependencies['react']);
    assert.ok(!packageJson.dependencies['react-dom']);
  });

  it('should generate both frontend package.json AND backend requirements.txt for fullstack', async () => {
    const ctx: CreateContext = {
      archetype: 'fullstack',
      projectName: 'test-fullstack-complete',
      outputPath: path.join(TEST_OUTPUT_DIR, 'test-fullstack-complete'),
      frontendStack: 'nextjs',
      backendStack: 'python',
      skipSkills: true,
      repoRoot,
    };

    await materializeProject(ctx);

    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'package.json')));
    assert.ok(fs.existsSync(path.join(ctx.outputPath, 'requirements.txt')));

    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.ok(packageJson.dependencies['react']);
    assert.ok(packageJson.dependencies['next']);

    const requirements = fs.readFileSync(path.join(ctx.outputPath, 'requirements.txt'), 'utf8');
    assert.ok(requirements.includes('fastapi'));
    assert.ok(requirements.includes('uvicorn'));
  });
});
