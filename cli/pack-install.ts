#!/usr/bin/env node
/**
 * Multi-IDE pack installer (VS Code / Cursor). See README "CLI installer".
 */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkbox, confirm, input } from '@inquirer/prompts';
import { defaultInstallRoot, getNodePlatform } from './lib/paths.js';
import { loadToolsRegistry, listToolIds } from './lib/registry.js';
import { runInstall, type InstallManifestV3 } from './lib/pipeline.js';

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
  console.log(`Usage: node --import tsx cli/pack-install.ts [options]

Install agents + Templates into selected IDE prompt folders; optionally copy
skills and Templates into a project workspace.

Run without --yes for an interactive wizard (select editors, workspace options,
dry-run, confirm).

Options:
  --targets <id,id>     Comma-separated tool ids (e.g. vscode,cursor)
  --target <id>         Add one target (repeatable)
  --workspace <path>    Project root for optional workspace copies
  --workspace-templates Copy Templates/ into <workspace>/Templates/
  --no-workspace-skills Skip copying .github/skills when using --workspace
  --source <path>       Pack repo root (default: parent of cli/)
  --install-root <path> Manifest folder (default: OS-specific pack metadata root)
  --registry <path>     Override cli/tools.registry.json
  --dry-run             Print actions without writing files
  --yes, -y             Non-interactive (use with --targets; optional --workspace)
  -h, --help            Show help
`);
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

  if (interactive) {
    console.log('');
    console.log('  AI Agent Workflows — pack installer');
    console.log('  Select where to install agents, Templates, and optional workspace files.');
    console.log('');
  }

  let toolIds: string[] = args.targets ?? [];

  if (interactive) {
    toolIds = await checkbox({
      message: 'Which editors should receive agents + Templates?',
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

  let workspaceRoot: string | null = args.workspace != null ? path.resolve(args.workspace) : null;
  let workspaceTemplates = args.workspaceTemplates;
  let workspaceSkills = true;

  if (interactive) {
    const defaultSkills =
      args.workspace !== undefined ? !args.noWorkspaceSkills : false;
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
          name: 'Copy Templates/ → workspace/Templates/',
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
    });

    printSummary(manifestPath, manifest, dryRunInteractive);
    return;
  }

  workspaceSkills = !args.noWorkspaceSkills && args.workspace !== undefined;
  if (args.workspaceTemplates && workspaceRoot === null) {
    console.error('--workspace-templates requires --workspace');
    process.exit(1);
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
