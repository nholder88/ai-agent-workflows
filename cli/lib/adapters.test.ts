import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPassthroughAdapter, createPiAdapter } from './adapters.js';
import { resolveRepoPaths } from './paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

describe('passthrough adapter', () => {
  it('emits one artifact per agent file with basename target', async () => {
    const ctx = { repoRoot, ...resolveRepoPaths(repoRoot) };
    const adapter = createPassthroughAdapter('vscode-agent');
    const arts = await adapter.adaptAgents(ctx);
    assert.ok(arts.length > 0);
    for (const a of arts) {
      assert.equal(a.kind, 'copy');
      if (a.kind === 'copy') {
        assert.equal(path.basename(a.targetSubpath), a.targetSubpath);
        assert.ok(fs.existsSync(a.sourceAbsolute));
      }
    }
  });

  it('returns all agents when selectedAgentFiles is undefined', async () => {
    const ctx = { repoRoot, ...resolveRepoPaths(repoRoot) };
    const adapter = createPassthroughAdapter('vscode-agent');
    const all = await adapter.adaptAgents(ctx);
    const withUndefined = await adapter.adaptAgents({
      ...ctx,
      selectedAgentFiles: undefined,
    });
    assert.equal(all.length, withUndefined.length);
  });

  it('returns only selected agents when selectedAgentFiles is provided', async () => {
    const ctx = {
      repoRoot,
      ...resolveRepoPaths(repoRoot),
      selectedAgentFiles: ['orchestrator.agent.md'],
    };
    const adapter = createPassthroughAdapter('vscode-agent');
    const arts = await adapter.adaptAgents(ctx);
    assert.equal(arts.length, 1);
    if (arts[0]?.kind === 'copy') {
      assert.equal(
        path.basename(arts[0].sourceAbsolute),
        'orchestrator.agent.md'
      );
    }
  });

  it('returns empty array when selectedAgentFiles is an empty array', async () => {
    const ctx = {
      repoRoot,
      ...resolveRepoPaths(repoRoot),
      selectedAgentFiles: [],
    };
    const adapter = createPassthroughAdapter('vscode-agent');
    const arts = await adapter.adaptAgents(ctx);
    assert.equal(arts.length, 0);
  });

  it('emits templates/ prefixed paths for template files', async () => {
    const ctx = { repoRoot, ...resolveRepoPaths(repoRoot) };
    const adapter = createPassthroughAdapter('vscode-agent');
    const arts = await adapter.adaptTemplates(ctx);
    assert.ok(arts.length > 0);
    const first = arts[0];
    assert.equal(first?.kind, 'copy');
    if (first?.kind === 'copy') {
      const norm = first.targetSubpath.replace(/\//g, path.sep);
      assert.ok(norm.startsWith(`templates${path.sep}`));
    }
  });
});

describe('pi adapter', () => {
  it('emits one .md artifact per .agent.md file (no .agent. in name)', async () => {
    const ctx = { repoRoot, ...resolveRepoPaths(repoRoot) };
    const adapter = createPiAdapter();
    const arts = await adapter.adaptAgents(ctx);
    assert.ok(arts.length > 0, 'should find agents');
    for (const a of arts) {
      assert.equal(a.kind, 'file');
      assert.ok(a.targetSubpath.endsWith('.md'), `expected .md suffix: ${a.targetSubpath}`);
      assert.ok(!a.targetSubpath.includes('.agent.'), `no .agent. in name: ${a.targetSubpath}`);
    }
  });

  it('strips Claude Code-specific frontmatter fields', async () => {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'pi-adapter-'));
    try {
      const src = path.join(tmp, 'test.agent.md');
      await fsp.writeFile(
        src,
        [
          '---',
          'name: test-agent',
          'description: A test agent.',
          'model: opus',
          'color: purple',
          'argument-hint: Do something.',
          'tools:',
          '  - read',
          '  - agent',
          'handoffs:',
          '  - label: Plan',
          '    agent: planner',
          '    prompt: Make a plan.',
          '---',
          '',
          'You are a test agent.',
        ].join('\n'),
        'utf8',
      );
      const ctx = {
        repoRoot,
        agentsSourceDir: tmp,
        templatesSourceDir: path.join(repoRoot, 'templates'),
        skillsSourceDir: path.join(repoRoot, 'skills'),
      };
      const adapter = createPiAdapter();
      const arts = await adapter.adaptAgents(ctx);
      assert.equal(arts.length, 1);
      const art = arts[0]!;
      assert.equal(art.kind, 'file');
      if (art.kind === 'file') {
        assert.ok(!art.body.includes('color:'), 'color should be stripped');
        assert.ok(!art.body.includes('argument-hint:'), 'argument-hint should be stripped');
        assert.ok(!art.body.includes('handoffs:'), 'handoffs should be stripped');
      }
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  });

  it('maps model alias to provider-qualified PI model ID', async () => {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'pi-adapter-'));
    try {
      const src = path.join(tmp, 'test.agent.md');
      await fsp.writeFile(
        src,
        '---\nname: m\ndescription: d\nmodel: opus\n---\nBody.\n',
        'utf8',
      );
      const ctx = {
        repoRoot,
        agentsSourceDir: tmp,
        templatesSourceDir: path.join(repoRoot, 'templates'),
        skillsSourceDir: path.join(repoRoot, 'skills'),
      };
      const arts = await createPiAdapter().adaptAgents(ctx);
      const art = arts[0]!;
      assert.equal(art.kind, 'file');
      if (art.kind === 'file') {
        assert.ok(art.body.includes('anthropic/claude-opus-4'), 'opus maps to provider-qualified ID');
      }
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  });

  it('maps Claude Code tool names to PI tool names', async () => {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'pi-adapter-'));
    try {
      await fsp.writeFile(
        path.join(tmp, 'test.agent.md'),
        '---\nname: t\ndescription: d\ntools:\n  - read\n  - agent\n  - execute\n  - vscode\n---\nBody.\n',
        'utf8',
      );
      const ctx = {
        repoRoot,
        agentsSourceDir: tmp,
        templatesSourceDir: path.join(repoRoot, 'templates'),
        skillsSourceDir: path.join(repoRoot, 'skills'),
      };
      const arts = await createPiAdapter().adaptAgents(ctx);
      const art = arts[0]!;
      assert.equal(art.kind, 'file');
      if (art.kind === 'file') {
        assert.ok(art.body.includes('read'), 'read is kept');
        assert.ok(art.body.includes('subagent'), 'agent maps to subagent');
        assert.ok(art.body.includes('bash'), 'execute maps to bash');
        assert.ok(!art.body.match(/\bvscode\b/), 'vscode is dropped');
      }
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  });

  it('adds PI-specific fields (systemPromptMode, inheritProjectContext, inheritSkills)', async () => {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'pi-adapter-'));
    try {
      await fsp.writeFile(
        path.join(tmp, 'test.agent.md'),
        '---\nname: t\ndescription: d\n---\nBody.\n',
        'utf8',
      );
      const ctx = {
        repoRoot,
        agentsSourceDir: tmp,
        templatesSourceDir: path.join(repoRoot, 'templates'),
        skillsSourceDir: path.join(repoRoot, 'skills'),
      };
      const arts = await createPiAdapter().adaptAgents(ctx);
      const art = arts[0]!;
      assert.equal(art.kind, 'file');
      if (art.kind === 'file') {
        assert.ok(art.body.includes('systemPromptMode'), 'systemPromptMode added');
        assert.ok(art.body.includes('append'), 'systemPromptMode: append');
        assert.ok(art.body.includes('inheritProjectContext'), 'inheritProjectContext added');
        assert.ok(art.body.includes('inheritSkills'), 'inheritSkills added');
      }
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  });

  it('adaptTemplates returns empty array (PI has no templates system)', async () => {
    const ctx = { repoRoot, ...resolveRepoPaths(repoRoot) };
    const arts = await createPiAdapter().adaptTemplates(ctx);
    assert.deepEqual(arts, []);
  });

  it('adaptSkills places files under .pi/skills/ prefix', async () => {
    const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'pi-skills-'));
    try {
      const familyDir = path.join(tmp, 'code-review');
      await fsp.mkdir(familyDir);
      await fsp.writeFile(path.join(familyDir, 'SKILL.md'), '---\nname: code-review\ndescription: Review.\n---\n', 'utf8');
      const ctx = {
        repoRoot,
        agentsSourceDir: path.join(repoRoot, 'agents'),
        templatesSourceDir: path.join(repoRoot, 'templates'),
        skillsSourceDir: tmp,
        workspaceRoot: tmp,
      };
      const arts = await createPiAdapter().adaptSkills!(ctx);
      assert.ok(arts.length > 0, 'should emit skill artifacts');
      for (const a of arts) {
        const norm = a.targetSubpath.replace(/\\/g, '/');
        assert.ok(norm.startsWith('.pi/skills/'), `expected .pi/skills/ prefix: ${norm}`);
      }
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  });

  it('filters selectedAgentFiles for PI adapter', async () => {
    const ctx = {
      repoRoot,
      ...resolveRepoPaths(repoRoot),
      selectedAgentFiles: ['orchestrator.agent.md'],
    };
    const arts = await createPiAdapter().adaptAgents(ctx);
    assert.equal(arts.length, 1);
    assert.ok(arts[0]!.targetSubpath === 'orchestrator.md');
  });
});
