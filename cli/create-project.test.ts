import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCreateArgs, type CreateArgs } from './create-project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

describe('create-project argument validation', () => {
  const baseArgs: CreateArgs = {
    archetype: null,
    projectName: null,
    outputPath: null,
    stack: null,
    frontendStack: null,
    backendStack: null,
    preset: null,
    skipSkills: false,
    yes: true,
    repoRoot,
  };

  it('validates frontend archetype with defaults', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my-app',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.archetype, 'frontend');
    assert.strictEqual(ctx.projectName, 'my-app');
    assert.strictEqual(ctx.frontendStack, 'nextjs');
    assert.strictEqual(ctx.stack, 'nextjs');
  });

  it('validates backend archetype with defaults', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'backend',
      projectName: 'my-service',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.archetype, 'backend');
    assert.strictEqual(ctx.projectName, 'my-service');
    assert.strictEqual(ctx.backendStack, 'node_nestjs');
    assert.strictEqual(ctx.stack, 'node_nestjs');
  });

  it('validates fullstack archetype with defaults', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'fullstack',
      projectName: 'my-project',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.archetype, 'fullstack');
    assert.strictEqual(ctx.frontendStack, 'nextjs');
    assert.strictEqual(ctx.backendStack, 'node_nestjs');
  });

  it('validates frontend archetype with explicit stack', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my-app',
      stack: 'sveltekit',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.frontendStack, 'sveltekit');
    assert.strictEqual(ctx.stack, 'sveltekit');
  });

  it('validates fullstack with explicit stacks', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'fullstack',
      projectName: 'my-project',
      frontendStack: 'sveltekit',
      backendStack: 'python',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.frontendStack, 'sveltekit');
    assert.strictEqual(ctx.backendStack, 'python');
  });

  it('fails with missing archetype', () => {
    const args: CreateArgs = {
      ...baseArgs,
      projectName: 'my-app',
    };

    assert.throws(() => validateCreateArgs(args), (err: Error) => {
      return err.message.includes('archetype is required');
    });
  });

  it('fails with invalid archetype', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'invalid',
      projectName: 'my-app',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('fails with missing project name', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'react',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('fails with invalid project name (spaces)', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my app',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('fails with invalid project name (special chars)', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my@app',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('fails with invalid frontend stack', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my-app',
      stack: 'invalid-stack',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('fails with invalid backend stack', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'backend',
      projectName: 'my-service',
      stack: 'invalid-stack',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('validates preset for applicable stack', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my-app',
      preset: 'nigel-react',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.preset, 'nigel-react');
  });

  it('fails with preset for non-applicable stack', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'backend',
      projectName: 'my-service',
      preset: 'nigel-react',
    };

    assert.throws(() => validateCreateArgs(args));
  });

  it('validates lib archetype without stacks', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'lib',
      projectName: 'my-lib',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.archetype, 'lib');
    assert.strictEqual(ctx.projectName, 'my-lib');
    assert.strictEqual(ctx.frontendStack, undefined);
    assert.strictEqual(ctx.backendStack, undefined);
  });

  it('validates cli archetype without stacks', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'cli',
      projectName: 'my-tool',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.archetype, 'cli');
    assert.strictEqual(ctx.projectName, 'my-tool');
    assert.strictEqual(ctx.frontendStack, undefined);
    assert.strictEqual(ctx.backendStack, undefined);
  });

  it('resolves output path from project name', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my-app',
    };

    const ctx = validateCreateArgs(args);
    assert.ok(ctx.outputPath.endsWith('my-app'));
  });

  it('uses explicit output path', () => {
    const args: CreateArgs = {
      ...baseArgs,
      archetype: 'frontend',
      projectName: 'my-app',
      outputPath: '/custom/path',
    };

    const ctx = validateCreateArgs(args);
    assert.strictEqual(ctx.outputPath, '/custom/path');
  });
});
