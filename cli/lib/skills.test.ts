import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSkillFamilies, parseAgentSkillMap, getRequiredSkills, loadAgentSkillMap } from './skills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const skillsDir = path.join(repoRoot, 'skills');

describe('listSkillFamilies', () => {
  it('returns an entry for every skill family directory', async () => {
    const families = await listSkillFamilies(skillsDir);
    assert.ok(families.length > 0, 'should find at least one skill family');
    for (const f of families) {
      assert.ok(f.dirname.length > 0);
      assert.ok(f.label.length > 0);
    }
  });

  it('converts dirname to title-cased label', async () => {
    const families = await listSkillFamilies(skillsDir);
    const wf = families.find((f) => f.dirname === 'code-review');
    assert.ok(wf, 'code-review should exist');
    assert.equal(wf.label, 'Code Review');
  });

  it('returns sorted results', async () => {
    const families = await listSkillFamilies(skillsDir);
    const names = families.map((f) => f.dirname);
    assert.deepEqual(names, [...names].sort());
  });

  it('returns empty array when skillsDir does not exist', async () => {
    const result = await listSkillFamilies('/nonexistent/path/skills');
    assert.deepEqual(result, []);
  });
});

describe('parseAgentSkillMap', () => {
  it('extracts agent → skill mappings from markdown table', () => {
    const content = `
| Source agent | Extracted skills |
|---|---|
| \`system-reverse-engineer\` | \`system-reconstruction\` |
| \`architect-planner\` | \`architecture-backlog-planning\` |
| \`python-implementer\` | \`implementation-from-spec\` |
`;
    const map = parseAgentSkillMap(content);
    assert.deepEqual(map.get('system-reverse-engineer'), ['system-reconstruction']);
    assert.deepEqual(map.get('architect-planner'), ['architecture-backlog-planning']);
    assert.deepEqual(map.get('python-implementer'), ['implementation-from-spec']);
  });

  it('handles agents that map to the same skill', () => {
    const content = `
| \`go-implementer\` | \`implementation-from-spec\` |
| \`java-implementer\` | \`implementation-from-spec\` |
`;
    const map = parseAgentSkillMap(content);
    assert.deepEqual(map.get('go-implementer'), ['implementation-from-spec']);
    assert.deepEqual(map.get('java-implementer'), ['implementation-from-spec']);
  });

  it('returns empty map for content with no valid rows', () => {
    const map = parseAgentSkillMap('# No table here\n\nJust some text.\n');
    assert.equal(map.size, 0);
  });
});

describe('getRequiredSkills', () => {
  it('returns skills required by selected agents', () => {
    const map = new Map([
      ['system-reverse-engineer', ['system-reconstruction']],
      ['architect-planner', ['architecture-backlog-planning']],
      ['python-implementer', ['implementation-from-spec']],
    ]);
    const required = getRequiredSkills(['system-reverse-engineer.agent.md', 'python-implementer.agent.md'], map);
    assert.ok(required.has('system-reconstruction'));
    assert.ok(required.has('implementation-from-spec'));
    assert.ok(!required.has('architecture-backlog-planning'));
  });

  it('returns empty set when no agents match the map', () => {
    const map = new Map([['system-reverse-engineer', ['system-reconstruction']]]);
    const required = getRequiredSkills(['unknown-agent.agent.md'], map);
    assert.equal(required.size, 0);
  });

  it('deduplicates skills when multiple agents share one', () => {
    const map = new Map([
      ['go-implementer', ['implementation-from-spec']],
      ['java-implementer', ['implementation-from-spec']],
    ]);
    const required = getRequiredSkills(
      ['go-implementer.agent.md', 'java-implementer.agent.md'],
      map,
    );
    assert.equal(required.size, 1);
    assert.ok(required.has('implementation-from-spec'));
  });
});

describe('loadAgentSkillMap', () => {
  it('loads and parses the real agent-to-skill-map.md', async () => {
    const map = await loadAgentSkillMap(skillsDir);
    assert.ok(map.size > 0, 'should have entries');
    assert.ok(map.has('architect-planner'), 'architect-planner should be mapped');
  });

  it('returns empty map when skillsDir does not exist', async () => {
    const map = await loadAgentSkillMap('/nonexistent/path/skills');
    assert.equal(map.size, 0);
  });
});

describe('adaptSkills (integration)', () => {
  it('filters to only selected skill family dirs', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-adapter-'));
    try {
      // Build a minimal fake skills dir
      const familyA = path.join(tmp, 'family-a');
      const familyB = path.join(tmp, 'family-b');
      await fs.mkdir(familyA);
      await fs.mkdir(familyB);
      await fs.writeFile(path.join(familyA, 'SKILL.md'), '# Family A\n', 'utf8');
      await fs.writeFile(path.join(familyB, 'SKILL.md'), '# Family B\n', 'utf8');
      await fs.writeFile(path.join(tmp, 'README.md'), '# Skills\n', 'utf8');

      const { createPassthroughAdapter } = await import('./adapters.js');
      const { resolveRepoPaths } = await import('./paths.js');
      const adapter = createPassthroughAdapter('vscode-agent');
      const ctx = {
        repoRoot,
        ...resolveRepoPaths(repoRoot),
        skillsSourceDir: tmp,
        workspaceRoot: tmp,
        selectedSkillFamilies: ['family-a'],
      };
      const arts = await adapter.adaptSkills!(ctx);
      const targets = arts.map((a) => a.targetSubpath.replace(/\\/g, '/'));
      assert.ok(targets.some((t) => t.includes('family-a')), 'family-a should be included');
      assert.ok(!targets.some((t) => t.includes('family-b')), 'family-b should be excluded');
      assert.ok(targets.some((t) => t.endsWith('README.md')), 'top-level files always included');
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
