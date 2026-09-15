/**
 * Tests for template materialization engine.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { materializeProject } from './materializer.js';
import type { CreateContext } from '../create-project.js';

describe('materializer', () => {
  let tempDir: string;
  let testOutputDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'materializer-test-'));
    testOutputDir = path.join(tempDir, 'test-project');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('materializeProject', () => {
    it('creates project directory structure for nextjs frontend', async () => {
      const ctx: CreateContext = {
        archetype: 'frontend',
        projectName: 'my-next-app',
        outputPath: testOutputDir,
        stack: 'nextjs',
        frontendStack: 'nextjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const files = [
        'package.json',
        'tsconfig.json',
        'next.config.js',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/features/reports/report-service.ts',
        'AGENTS.md',
        '.cursor/rules',
        '.env.example',
      ];

      for (const file of files) {
        const filePath = path.join(testOutputDir, file);
        const exists = await fileExists(filePath);
        assert.ok(exists, `Expected file ${file} to exist`);
      }
    });

    it('renders projectName template variable in files', async () => {
      const ctx: CreateContext = {
        archetype: 'frontend',
        projectName: 'awesome-app',
        outputPath: testOutputDir,
        stack: 'nextjs',
        frontendStack: 'nextjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const packageJsonPath = path.join(testOutputDir, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      assert.equal(packageJson.name, 'awesome-app', 'package.json name should be rendered');
    });

    it('creates project directory structure for node_nestjs backend', async () => {
      const ctx: CreateContext = {
        archetype: 'backend',
        projectName: 'my-api',
        outputPath: testOutputDir,
        stack: 'node_nestjs',
        backendStack: 'node_nestjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const files = [
        'package.json',
        'tsconfig.json',
        'nest-cli.json',
        'src/main.ts',
        'src/app.module.ts',
        'src/health/health.controller.ts',
        'src/reports/reports.service.ts',
        'src/admin/admin.service.ts',
        'AGENTS.md',
        '.cursor/rules',
        '.env.example',
      ];

      for (const file of files) {
        const filePath = path.join(testOutputDir, file);
        const exists = await fileExists(filePath);
        assert.ok(exists, `Expected file ${file} to exist`);
      }
    });

    it('creates project directory structure for python backend', async () => {
      const ctx: CreateContext = {
        archetype: 'backend',
        projectName: 'my-api',
        outputPath: testOutputDir,
        stack: 'python',
        backendStack: 'python',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const files = [
        'main.py',
        'requirements.txt',
        'requirements-dev.txt',
        'src/app.py',
        'src/config.py',
        'src/api/health.py',
        'src/api/reports.py',
        'src/api/admin.py',
        'tests/unit/test_reporting_service.py',
        'tests/e2e/test_api_smoke.py',
        'AGENTS.md',
        '.cursor/rules',
        '.env.example',
      ];

      for (const file of files) {
        const filePath = path.join(testOutputDir, file);
        const exists = await fileExists(filePath);
        assert.ok(exists, `Expected file ${file} to exist`);
      }
    });

    it('creates project directory structure for fullstack project', async () => {
      const ctx: CreateContext = {
        archetype: 'fullstack',
        projectName: 'my-fullstack',
        outputPath: testOutputDir,
        frontendStack: 'nextjs',
        backendStack: 'node_nestjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const frontendFiles = ['src/app/layout.tsx', 'src/app/page.tsx'];
      const backendFiles = ['src/main.ts', 'src/app.module.ts'];

      for (const file of frontendFiles) {
        const filePath = path.join(testOutputDir, file);
        const exists = await fileExists(filePath);
        assert.ok(exists, `Expected frontend file ${file} to exist`);
      }

      for (const file of backendFiles) {
        const filePath = path.join(testOutputDir, file);
        const exists = await fileExists(filePath);
        assert.ok(exists, `Expected backend file ${file} to exist`);
      }
    });

    it('generates AGENTS.md with stack information', async () => {
      const ctx: CreateContext = {
        archetype: 'frontend',
        projectName: 'test-app',
        outputPath: testOutputDir,
        stack: 'nextjs',
        frontendStack: 'nextjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const agentsMdPath = path.join(testOutputDir, 'AGENTS.md');
      const content = await fs.readFile(agentsMdPath, 'utf-8');

      assert.ok(content.includes('test-app'), 'AGENTS.md should include project name');
      assert.ok(content.includes('nextjs'), 'AGENTS.md should include stack');
      assert.ok(content.includes('Zustand + TanStack Query'), 'AGENTS.md should include state management');
    });

    it('generates .cursor/rules with project conventions', async () => {
      const ctx: CreateContext = {
        archetype: 'backend',
        projectName: 'test-api',
        outputPath: testOutputDir,
        stack: 'python',
        backendStack: 'python',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const rulesPath = path.join(testOutputDir, '.cursor', 'rules');
      const content = await fs.readFile(rulesPath, 'utf-8');

      assert.ok(content.includes('test-api'), '.cursor/rules should include project name');
      assert.ok(content.includes('python'), '.cursor/rules should include stack');
      assert.ok(content.includes('pytest'), '.cursor/rules should include testing framework');
    });

    it('throws error if output directory exists and is not empty', async () => {
      await fs.mkdir(testOutputDir, { recursive: true });
      await fs.writeFile(path.join(testOutputDir, 'existing.txt'), 'content');

      const ctx: CreateContext = {
        archetype: 'frontend',
        projectName: 'test-app',
        outputPath: testOutputDir,
        stack: 'nextjs',
        frontendStack: 'nextjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await assert.rejects(
        async () => await materializeProject(ctx),
        /already exists and is not empty/,
        'Should throw error for non-empty directory'
      );
    });

    it('includes unit test files in scaffolded projects', async () => {
      const ctx: CreateContext = {
        archetype: 'frontend',
        projectName: 'test-app',
        outputPath: testOutputDir,
        stack: 'nextjs',
        frontendStack: 'nextjs',
        skipSkills: true,
        repoRoot: process.cwd(),
      };

      await materializeProject(ctx);

      const testFile = path.join(testOutputDir, 'src/features/reports/report-service.test.ts');
      const exists = await fileExists(testFile);
      assert.ok(exists, 'Expected test file to exist');

      const content = await fs.readFile(testFile, 'utf-8');
      assert.ok(content.includes('describe'), 'Test file should contain test code');
    });
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
