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

    const packageJson = JSON.parse(fs.readFileSync(path.join(ctx.outputPath, 'package.json'), 'utf8'));
    assert.strictEqual(packageJson.name, 'test-frontend-app');
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
