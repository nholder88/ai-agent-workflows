#!/usr/bin/env node
/**
 * Multi-IDE pack installer (VS Code / Cursor / Claude Code). See README "CLI installer".
 */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { defaultInstallRoot, getNodePlatform } from './lib/paths.js';
import { loadToolsRegistry, listToolIds } from './lib/registry.js';
import { runInstall, type InstallManifestV3 } from './lib/pipeline.js';
import { listAgents } from './lib/agents.js';
import { listSkillFamilies, loadAgentSkillMap, getRequiredSkills } from './lib/skills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultRepoRoot(): string {
  return path.resolve(__dirname, '..');
}

interface ParsedArgs {
  targets: string[] | null;
  workspace: string | undefined;
  workspaceTemplates: boolean;
  noWorkspaceSkills: boolean;
  source: string;
  installRoot: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
  registryPath: string | null;
  scope: 'global' | 'local';
  agents: string[] | null;
  allAgents: boolean;
  localRoot: string | null;
  skillFamilies: string[] | null;
  allSkills: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    targets: null,
    workspace: undefined,
    workspaceTemplates: false,
    noWorkspaceSkills: false,
    source: defaultRepoRoot(),
    installRoot: defaultInstallRoot(),
    dryRun: false,
    yes: false,
    help: false,
    registryPath: null,
    scope: 'global',
    agents: null,
    allAgents: false,
    localRoot: null,
    skillFamilies: null,
    allSkills: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '-h' || a === '--help') {
      out.help = true;
    } else if (a === '--targets' && argv[i + 1]) {
      out.targets = argv[++i]!.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a === '--target' && argv[i + 1]) {
      const t = argv[++i]!.trim();
      out.targets = out.targets ?? [];
      out.targets.push(t);
    } else if (a === '--workspace' && argv[i + 1]) {
      out.workspace = argv[++i]!;
    } else if (a === '--workspace-templates') {
      out.workspaceTemplates = true;
    } else if (a === '--no-workspace-skills') {
      out.noWorkspaceSkills = true;
    } else if (a === '--source' && argv[i + 1]) {
      out.source = path.resolve(argv[++i]!);
    } else if (a === '--install-root' && argv[i + 1]) {
      out.installRoot = path.resolve(argv[++i]!);
    } else if (a === '--registry' && argv[i + 1]) {
      out.registryPath = path.resolve(argv[++i]!);
    } else if (a === '--dry-run') {
      out.dryRun = true;
    } else if (a === '--yes' || a === '-y') {
      out.yes = true;
    } else if (a === '--scope' && argv[i + 1]) {
      const s = argv[++i]!.trim();
      if (s !== 'global' && s !== 'local') {
        console.error(`--scope must be "global" or "local", got "${s}"`);
        process.exit(1);
      }
      out.scope = s;
    } else if (a === '--agents' && argv[i + 1]) {
      out.agents = argv[++i]!.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a === '--all-agents') {
      out.allAgents = true;
    } else if (a === '--local-root' && argv[i + 1]) {
      out.localRoot = path.resolve(argv[++i]!);
    } else if (a === '--skill-families' && argv[i + 1]) {
      out.skillFamilies = argv[++i]!.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a === '--all-skills') {
      out.allSkills = true;
    } else if (!a.startsWith('-')) {
      continue;
    } else {
      console.error(`Unknown option: ${a}`);
      printHelp();
      process.exit(1);
    }
  }

  return out;
}

function printHelp(): void {
  console.log(`Usage: ai-agent-pack-install [options]
       npm run pack:install -- [options]   (from a clone of this repo)

Install agents + templates into selected IDE prompt folders; optionally copy
skills and templates into a project workspace.

After \`npm install -g @nholder88/ai-agent-workflows-tools\`, run \`ai-agent-pack-install\`.
With npx: \`npx @nholder88/ai-agent-workflows-tools\` (same command; package is private on npm).

Run without --yes for an interactive wizard (select editors, scope, agents,
workspace options, dry-run, confirm).

Options:
  --targets <id,id>     Comma-separated tool ids (e.g. claude,vscode,cursor)
  --target <id>         Add one target (repeatable)
  --scope local|global  Install scope: local (project folder) or global (OS user dirs) [default: global]
  --agents <name,name>  Agent names to install (e.g. orchestrator,architect-planner)
  --all-agents          Install all agents without prompting (non-interactive shortcut)
  --local-root <path>   Project root for local scope installs (default: cwd)
  --skill-families <f>  Comma-separated skill family dirnames to install with workspace skills
  --all-skills          Install all skill families without prompting
  --workspace <path>    Project root for optional workspace copies
  --workspace-templates Copy templates/ into <workspace>/templates/
  --no-workspace-skills Skip copying .github/skills when using --workspace
  --source <path>       Pack repo root (default: parent of cli/)
  --install-root <path> Manifest folder (default: OS-specific pack metadata root)
  --registry <path>     Override cli/tools.registry.json
  --dry-run             Print actions without writing files
  --yes, -y             Non-interactive (use with --targets; optional --workspace)
  -h, --help            Show help
`);
}

async function warnSkillsNotInstalled(
  skillsSourceDir: string,
  agentsDir: string,
  selectedAgentFiles: string[] | undefined,
  toolIds: string[],
): Promise<void> {
  const agentSkillMap = await loadAgentSkillMap(skillsSourceDir);
  if (agentSkillMap.size === 0) return;
  const allAgentFilenames = (await listAgents(agentsDir)).map((a) => a.filename);
  const effectiveAgents = selectedAgentFiles ?? allAgentFilenames;
  const required = getRequiredSkills(effectiveAgents, agentSkillMap);
  if (required.size === 0) return;
  const isPi = toolIds.includes('pi');
  const skillsPath = isPi ? '.pi/skills/<family>/SKILL.md' : '.github/skills/<family>/SKILL.md';
  console.log('');
  console.log('  Warning: workspace skills are not being installed.');
  console.log('  The following skill families are referenced by your selected agents:');
  for (const s of [...required].sort()) {
    console.log(`    • ${s}`);
  }
  console.log(`  Agents reference ${skillsPath} — those files will not exist.`);
  console.log('  Re-run with --workspace <path> to install skills alongside agents.');
  console.log('');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.yes && args.workspaceTemplates && args.workspace === undefined) {
    console.error('--workspace-templates requires --workspace when using --yes');
    process.exit(1);
  }

  const registry = loadToolsRegistry(args.registryPath ?? undefined);
  const validIds = listToolIds(registry);
  const interactive = !args.yes;
  const repoRoot = args.source;

  if (interactive) {
    console.log('');
    console.log('  AI Agent Workflows — pack installer');
    console.log('  Select where to install agents, templates, and optional workspace files.');
    console.log('');
  }

  // ── IDE target selection ──────────────────────────────────────────────────

  let toolIds: string[] = args.targets ?? [];

  if (interactive) {
    toolIds = await checkbox({
      message: 'Which editors should receive agents + templates?',
      choices: registry.tools.map((t) => ({
        name: t.label,
        value: t.id,
        checked: args.targets == null ? true : args.targets.includes(t.id),
      })),
      required: true,
    });
  }

  if (toolIds.length === 0) {
    console.error('No targets selected. Use --targets or run interactively without --yes.');
    process.exit(1);
  }

  for (const id of toolIds) {
    if (!validIds.includes(id)) {
      console.error(`Invalid tool id "${id}". Valid: ${validIds.join(', ')}`);
      process.exit(1);
    }
  }

  // ── Install scope ─────────────────────────────────────────────────────────

  let scope: 'global' | 'local' = args.scope;
  let localInstallRoot: string | null = args.localRoot;

  if (interactive) {
    scope = await select({
      message: 'Install scope?',
      choices: [
        {
          name: 'Global — available in all projects (OS user directories)',
          value: 'global' as const,
        },
        {
          name: 'Local  — this project only (installs into project folder)',
          value: 'local' as const,
        },
      ],
      default: args.scope,
    });

    if (scope === 'local') {
      const localRootInput = await input({
        message: 'Project root for local install',
        default: args.localRoot ?? process.cwd(),
      });
      localInstallRoot = localRootInput.trim() ? path.resolve(localRootInput.trim()) : null;
    }
  }

  // ── Agent selection ───────────────────────────────────────────────────────

  const { agentsSourceDir } = { agentsSourceDir: path.join(repoRoot, 'agents') };
  const allAgentMeta = await listAgents(agentsSourceDir);

  let selectedAgentFiles: string[] | undefined;

  if (!interactive) {
    if (args.agents) {
      // Map provided names to filenames (support both bare name and full filename)
      const nameSet = new Set(args.agents.map((n) => n.toLowerCase()));
      selectedAgentFiles = allAgentMeta
        .filter(
          (a) =>
            nameSet.has(a.name.toLowerCase()) ||
            nameSet.has(a.filename.toLowerCase()) ||
            nameSet.has(path.basename(a.filename, '.agent.md').toLowerCase()),
        )
        .map((a) => a.filename);

      if (selectedAgentFiles.length === 0) {
        console.error(`No agents matched: ${args.agents.join(', ')}`);
        console.error(`Available: ${allAgentMeta.map((a) => a.name).join(', ')}`);
        process.exit(1);
      }
    }
    // --all-agents or --yes without --agents → selectedAgentFiles stays undefined (install all)
  } else {
    // Build checkbox choices grouped by category
    const categoryOrder = ['Orchestration', 'Implementers', 'Specialists', 'Review & QA', 'Utilities'];
    const grouped = new Map<string, typeof allAgentMeta>();
    for (const cat of categoryOrder) grouped.set(cat, []);
    for (const agent of allAgentMeta) {
      const bucket = grouped.get(agent.category) ?? grouped.set(agent.category, []).get(agent.category)!;
      bucket.push(agent);
    }

    type CheckboxChoice =
      | { type: 'separator'; separator: string }
      | { name: string; value: string; checked: boolean };

    const choices: CheckboxChoice[] = [];
    for (const [cat, agents] of grouped) {
      if (agents.length === 0) continue;
      choices.push({ type: 'separator', separator: `── ${cat} ──` });
      for (const agent of agents) {
        const label = agent.description
          ? `${agent.name.padEnd(32)} ${agent.description.slice(0, 60)}`
          : agent.name;
        choices.push({ name: label, value: agent.filename, checked: true });
      }
    }

    const picked = await checkbox({
      message: 'Which agents to install?',
      choices,
    });

    selectedAgentFiles = picked.length === allAgentMeta.length ? undefined : picked;
  }

  // ── Workspace options ─────────────────────────────────────────────────────

  let workspaceRoot: string | null = args.workspace != null ? path.resolve(args.workspace) : null;
  let workspaceTemplates = args.workspaceTemplates;
  let workspaceSkills = true;
  let selectedSkillFamilies: string[] | undefined;

  const skillsSourceDir = path.join(repoRoot, 'skills');
  const allSkillFamilies = await listSkillFamilies(skillsSourceDir);

  if (interactive) {
    const defaultSkills = args.workspace !== undefined ? !args.noWorkspaceSkills : false;
    const defaultTemplates = args.workspaceTemplates;

    const wsChoices = await checkbox({
      message: 'Optional: also copy pack files into a project workspace?',
      choices: [
        {
          name: 'Copy .github/skills → workspace/.github/skills',
          value: 'skills' as const,
          checked: defaultSkills,
        },
        {
          name: 'Copy templates/ → workspace/templates/',
          value: 'templates' as const,
          checked: defaultTemplates,
        },
      ],
    });

    workspaceSkills = wsChoices.includes('skills');
    workspaceTemplates = wsChoices.includes('templates');

    if (workspaceSkills || workspaceTemplates) {
      const ws = await input({
        message: 'Workspace root (project folder)',
        default: args.workspace ?? process.cwd(),
      });
      workspaceRoot = ws.trim() ? path.resolve(ws.trim()) : null;
      if (!workspaceRoot) {
        workspaceSkills = false;
        workspaceTemplates = false;
      }
    } else {
      workspaceRoot = null;
    }

    // ── Skill family selection (only if installing skills to workspace) ───────
    if (workspaceSkills && allSkillFamilies.length > 0) {
      const pickedFamilies = await checkbox({
        message: 'Which skill families to install into workspace?',
        choices: allSkillFamilies.map((f) => ({ name: f.label, value: f.dirname, checked: true })),
      });

      if (pickedFamilies.length < allSkillFamilies.length) {
        selectedSkillFamilies = pickedFamilies;

        // Warn about missing skills needed by selected agents
        if (selectedAgentFiles !== undefined || true) {
          const agentSkillMap = await loadAgentSkillMap(skillsSourceDir);
          const agentFileList = selectedAgentFiles ?? allSkillFamilies.map((f) => f.dirname);
          // Use all agent files when no agent filter was set
          const allAgentFilenames = (await listAgents(path.join(repoRoot, 'agents'))).map(
            (a) => a.filename,
          );
          const effectiveAgents = selectedAgentFiles ?? allAgentFilenames;
          const required = getRequiredSkills(effectiveAgents, agentSkillMap);
          const missing = [...required].filter((s) => !pickedFamilies.includes(s));
          if (missing.length > 0) {
            console.log('');
            console.log(
              `  Warning: the following skill families are used by your selected agents but were not selected:`,
            );
            for (const m of missing) {
              console.log(`    • ${m}`);
            }
            console.log('  Agents may reference skills that are not installed. This is non-blocking.');
            console.log('');
          }
        }
      }
      // pickedFamilies.length === allSkillFamilies.length → undefined (install all)
    }

    if (!workspaceSkills) {
      await warnSkillsNotInstalled(skillsSourceDir, path.join(repoRoot, 'agents'), selectedAgentFiles, toolIds);    }

    const dryRunInteractive = await confirm({
      message: 'Preview only (dry-run, no files written)?',
      default: args.dryRun,
    });

    const proceed = await confirm({
      message: 'Run installation with these choices?',
      default: true,
    });
    if (!proceed) {
      console.log('Cancelled.');
      process.exit(0);
    }

    const { manifest, manifestPath } = await runInstall({
      repoRoot: args.source,
      installRoot: args.installRoot,
      toolIds,
      registry,
      workspaceRoot,
      workspaceSkills: workspaceRoot ? workspaceSkills : false,
      workspaceTemplates,
      dryRun: dryRunInteractive,
      selectedAgentFiles,
      scope,
      localInstallRoot: localInstallRoot ?? undefined,
      selectedSkillFamilies,
    });

    printSummary(manifestPath, manifest, dryRunInteractive);
    return;
  }

  // ── Non-interactive skill family resolution ───────────────────────────────
  workspaceSkills = !args.noWorkspaceSkills && args.workspace !== undefined;
  if (args.workspaceTemplates && workspaceRoot === null) {
    console.error('--workspace-templates requires --workspace');
    process.exit(1);
  }

  if (workspaceSkills && args.skillFamilies) {
    selectedSkillFamilies = args.skillFamilies;
    // Validate names
    const validFamilies = new Set(allSkillFamilies.map((f) => f.dirname));
    const invalid = selectedSkillFamilies.filter((f) => !validFamilies.has(f));
    if (invalid.length > 0) {
      console.error(`Unknown skill families: ${invalid.join(', ')}`);
      console.error(`Valid: ${[...validFamilies].join(', ')}`);
      process.exit(1);
    }
  }
  // --all-skills or no --skill-families → selectedSkillFamilies stays undefined (install all)

  if (!workspaceSkills) {
    await warnSkillsNotInstalled(skillsSourceDir, path.join(repoRoot, 'agents'), selectedAgentFiles, toolIds);
  }

  const { manifest, manifestPath } = await runInstall({
    repoRoot: args.source,
    installRoot: args.installRoot,
    toolIds,
    registry,
    workspaceRoot,
    workspaceSkills,
    workspaceTemplates,
    dryRun: args.dryRun,
    selectedAgentFiles,
    scope,
    localInstallRoot: localInstallRoot ?? undefined,
    selectedSkillFamilies,
  });

  printSummary(manifestPath, manifest, args.dryRun);
}

function printSummary(manifestPath: string, manifest: InstallManifestV3, dryRun: boolean): void {
  if (dryRun) {
    console.log('[dry-run] Would write manifest to:', manifestPath);
  } else {
    console.log('[ok] Manifest:', manifestPath);
  }

  const platform = getNodePlatform();
  console.log(`Platform: ${platform}`);
  for (const t of manifest.targets) {
    console.log(`Target [${t.target}] prompts: ${t.promptsPath}`);
    console.log(`  Agents: ${t.agentFileCount}  Templates: ${t.templateFileCount}`);
  }
  if (manifest.workspace) {
    console.log(`Workspace: ${manifest.workspace.root}`);
    if (manifest.workspace.skillsFileCount > 0) {
      console.log(`  Skills: ${manifest.workspace.skillsFileCount} → ${manifest.workspace.skillsPath}`);
    }
    if (manifest.workspace.templatesFileCount > 0) {
      console.log(`  Templates: ${manifest.workspace.templatesFileCount} → ${manifest.workspace.templatesPath}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
