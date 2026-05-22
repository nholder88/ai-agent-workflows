import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type InstallArtifact =
  | { kind: 'file'; targetSubpath: string; body: string }
  | { kind: 'copy'; targetSubpath: string; sourceAbsolute: string };

export interface AdapterContext {
  repoRoot: string;
  agentsSourceDir: string;
  templatesSourceDir: string;
  skillsSourceDir: string;
  /** When set, only these agent filenames (basenames) will be installed. */
  selectedAgentFiles?: string[];
}

export interface SkillsAdapterContext extends AdapterContext {
  workspaceRoot: string;
  /** When set, only these skill family dirnames are installed. */
  selectedSkillFamilies?: string[];
}

export interface PackAdapter {
  readonly id: string;
  adaptAgents(ctx: AdapterContext): Promise<InstallArtifact[]>;
  adaptTemplates(ctx: AdapterContext): Promise<InstallArtifact[]>;
  adaptSkills?(ctx: SkillsAdapterContext): Promise<InstallArtifact[]>;
}

function listFilesRecursive(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

/**
 * Passthrough: agents copied flat by basename; templates under templates/<rel>.
 */
export function createPassthroughAdapter(id: string): PackAdapter {
  return {
    id,
    async adaptAgents(ctx: AdapterContext): Promise<InstallArtifact[]> {
      const files = listFilesRecursive(ctx.agentsSourceDir);
      const filtered = ctx.selectedAgentFiles
        ? files.filter((f) =>
            ctx.selectedAgentFiles!.includes(path.basename(f))
          )
        : files;
      return filtered.map((abs) => ({
        kind: 'copy' as const,
        targetSubpath: path.basename(abs),
        sourceAbsolute: abs,
      }));
    },
    async adaptTemplates(ctx: AdapterContext): Promise<InstallArtifact[]> {
      const files = listFilesRecursive(ctx.templatesSourceDir);
      const base = path.resolve(ctx.templatesSourceDir);
      return files.map((abs) => {
        const rel = path.relative(base, abs);
        return {
          kind: 'copy' as const,
          targetSubpath: path.join('templates', rel),
          sourceAbsolute: abs,
        };
      });
    },
    async adaptSkills(ctx: SkillsAdapterContext): Promise<InstallArtifact[]> {
      if (!fs.existsSync(ctx.skillsSourceDir)) {
        return [];
      }
      const base = path.resolve(ctx.skillsSourceDir);
      const entries = fs.readdirSync(ctx.skillsSourceDir, {
        withFileTypes: true,
      });
      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) =>
          ctx.selectedSkillFamilies
            ? ctx.selectedSkillFamilies.includes(name)
            : true
        );

      const artifacts: InstallArtifact[] = [];
      for (const dir of dirs) {
        const files = listFilesRecursive(path.join(base, dir));
        for (const abs of files) {
          const rel = path.relative(base, abs);
          artifacts.push({
            kind: 'copy' as const,
            targetSubpath: path.join('.github', 'skills', rel),
            sourceAbsolute: abs,
          });
        }
      }
      // Also copy top-level files (README.md, agent-to-skill-map.md, etc.)
      for (const e of entries) {
        if (e.isFile()) {
          artifacts.push({
            kind: 'copy' as const,
            targetSubpath: path.join('.github', 'skills', e.name),
            sourceAbsolute: path.join(base, e.name),
          });
        }
      }
      return artifacts;
    },
  };
}

const passthroughClaude = createPassthroughAdapter('claude-agent');
const passthroughVscode = createPassthroughAdapter('vscode-agent');
const passthroughCursor = createPassthroughAdapter('cursor-agent');

// ── PI adapter ────────────────────────────────────────────────────────────────

/** Maps Claude Code tool names to their PI equivalents. */
const PI_TOOL_MAP: Record<string, string[]> = {
  read: ['read'],
  search: ['grep', 'find'],
  edit: ['write'],
  execute: ['bash'],
  vscode: [],
  agent: ['subagent'],
  todo: [],
  'web/fetch': ['fetch_content'],
  mcp: ['mcp'],
};

/** Maps Claude Code bare model aliases to PI provider-qualified model IDs. */
const PI_MODEL_MAP: Record<string, string> = {
  opus: 'anthropic/claude-opus-4',
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4-5',
};

/**
 * Transforms an .agent.md file's YAML frontmatter into PI-compatible format.
 * Strips Claude Code-specific fields (color, argument-hint, handoffs) and adds
 * PI-specific fields (systemPromptMode, inheritProjectContext, inheritSkills).
 */
function transformFrontmatterForPi(content: string): string {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  if (!fmMatch) return content;

  const rawFm = fmMatch[1]!;
  const body = fmMatch[2]!;

  let fm: Record<string, unknown>;
  try {
    fm = (parseYaml(rawFm) as Record<string, unknown>) ?? {};
  } catch {
    return content;
  }

  const piFm: Record<string, unknown> = {};

  if (typeof fm.name === 'string') {
    piFm.name = fm.name;
  }

  if (fm.description !== undefined) {
    const raw = typeof fm.description === 'string' ? fm.description : String(fm.description);
    piFm.description = raw.replace(/\n/g, ' ').trim();
  }

  // Map model name to PI provider-qualified ID
  if (typeof fm.model === 'string') {
    const model = fm.model.trim();
    if (model.includes('/')) {
      piFm.model = model;
    } else {
      const mapped = PI_MODEL_MAP[model.toLowerCase()];
      if (mapped) piFm.model = mapped;
    }
  }

  // Map Claude Code tool names to PI tool names
  const claudeTools = Array.isArray(fm.tools) ? fm.tools.map(String) : [];
  const piTools: string[] = [];
  const seen = new Set<string>();
  for (const t of claudeTools) {
    for (const mapped of PI_TOOL_MAP[t] ?? []) {
      if (!seen.has(mapped)) {
        seen.add(mapped);
        piTools.push(mapped);
      }
    }
  }
  if (piTools.length > 0) {
    piFm.tools = piTools.join(', ');
  }

  // PI-specific: append base prompt, inherit project context and skills catalog
  piFm.systemPromptMode = 'append';
  piFm.inheritProjectContext = true;
  piFm.inheritSkills = true;

  const newFm = stringifyYaml(piFm, { lineWidth: 0 }).trimEnd();
  return `---\n${newFm}\n---\n${body}`;
}

export function createPiAdapter(): PackAdapter {
  return {
    id: 'pi-agent',
    async adaptAgents(ctx: AdapterContext): Promise<InstallArtifact[]> {
      const files = listFilesRecursive(ctx.agentsSourceDir);
      const agentFiles = files.filter((f) => path.basename(f).endsWith('.agent.md'));
      const filtered = ctx.selectedAgentFiles
        ? agentFiles.filter((f) => ctx.selectedAgentFiles!.includes(path.basename(f)))
        : agentFiles;

      return filtered.map((abs) => {
        const content = fs.readFileSync(abs, 'utf8');
        const transformed = transformFrontmatterForPi(content);
        const basename = path.basename(abs, '.agent.md') + '.md';
        return { kind: 'file' as const, targetSubpath: basename, body: transformed };
      });
    },

    async adaptTemplates(_ctx: AdapterContext): Promise<InstallArtifact[]> {
      // PI has no templates system equivalent
      return [];
    },

    async adaptSkills(ctx: SkillsAdapterContext): Promise<InstallArtifact[]> {
      if (!fs.existsSync(ctx.skillsSourceDir)) {
        return [];
      }
      const base = path.resolve(ctx.skillsSourceDir);
      const entries = fs.readdirSync(ctx.skillsSourceDir, { withFileTypes: true });
      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) =>
          ctx.selectedSkillFamilies ? ctx.selectedSkillFamilies.includes(name) : true,
        );

      const artifacts: InstallArtifact[] = [];
      for (const dir of dirs) {
        const files = listFilesRecursive(path.join(base, dir));
        for (const abs of files) {
          const rel = path.relative(base, abs);
          artifacts.push({
            kind: 'copy' as const,
            targetSubpath: path.join('.pi', 'skills', rel),
            sourceAbsolute: abs,
          });
        }
      }
      return artifacts;
    },
  };
}

const piAdapter = createPiAdapter();

const adapterById: Record<string, PackAdapter> = {
  'claude-agent': passthroughClaude,
  'vscode-agent': passthroughVscode,
  'cursor-agent': passthroughCursor,
  'pi-agent': piAdapter,
};

export function getAdapter(adapterId: string): PackAdapter {
  const adapter = adapterById[adapterId];
  if (!adapter) {
    throw new Error(
      `Unknown adapterId "${adapterId}". Valid: ${Object.keys(adapterById).sort().join(', ')}`
    );
  }
  return adapter;
}
