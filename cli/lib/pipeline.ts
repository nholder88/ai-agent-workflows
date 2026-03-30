import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { getAdapter, type InstallArtifact } from './adapters.js';
import { assertRepoLayout, resolveRepoPaths, getNodePlatform } from './paths.js';
import { getToolById, resolveToolAgentsRoot, type ToolDefinition, type ToolRegistryFile } from './registry.js';

export interface RunInstallOptions {
  repoRoot: string;
  installRoot: string;
  toolIds: string[];
  registry: ToolRegistryFile;
  workspaceRoot: string | null;
  /** When workspace is set, copy `.github/skills` (default true). */
  workspaceSkills: boolean;
  workspaceTemplates: boolean;
  dryRun: boolean;
}

export interface ManifestTarget {
  target: string;
  promptsPath: string;
  templatesPath: string;
  skillsPath: string | null;
  installedFiles: string[];
  agentFileCount: number;
  templateFileCount: number;
  skillFileCount: number;
}

export interface ManifestWorkspace {
  root: string;
  skillsPath: string | null;
  skillsFileCount: number;
  templatesPath: string | null;
  templatesFileCount: number;
  installedFiles: string[];
}

export interface InstallManifestV3 {
  schemaVersion: 3;
  packageVersion: string;
  installedAtUtc: string;
  installRoot: string;
  sourceRepoPath: string;
  managedMarker: string;
  targets: ManifestTarget[];
  workspace: ManifestWorkspace | null;
}

async function writeArtifact(baseDir: string, artifact: InstallArtifact, dryRun: boolean): Promise<string> {
  const dest = path.join(baseDir, artifact.targetSubpath);
  if (dryRun) {
    return path.normalize(dest);
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  if (artifact.kind === 'copy') {
    await fs.copyFile(artifact.sourceAbsolute, dest);
  } else {
    await fs.writeFile(dest, artifact.body, 'utf8');
  }
  return path.normalize(dest);
}

function readPackageVersion(repoRoot: string): string {
  try {
    const p = path.join(repoRoot, 'package.json');
    const raw = fsSync.readFileSync(p, 'utf8');
    const j = JSON.parse(raw) as { version?: string };
    return typeof j.version === 'string' && j.version.trim() ? j.version.trim() : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function emitForTool(
  tool: ToolDefinition,
  ctx: { repoRoot: string; agentsSourceDir: string; templatesSourceDir: string; skillsSourceDir: string },
  dryRun: boolean,
): Promise<{ target: ManifestTarget; installedFiles: string[] }> {
  const platform = getNodePlatform();
  const agentsRoot = resolveToolAgentsRoot(tool, platform);
  const adapter = getAdapter(tool.adapterId);

  const agentArts = await adapter.adaptAgents(ctx);
  const templateArts = await adapter.adaptTemplates(ctx);

  const installedFiles: string[] = [];
  for (const a of agentArts) {
    installedFiles.push(await writeArtifact(agentsRoot, a, dryRun));
  }
  for (const a of templateArts) {
    installedFiles.push(await writeArtifact(agentsRoot, a, dryRun));
  }

  const templatesPath = path.join(agentsRoot, 'Templates');
  const target: ManifestTarget = {
    target: tool.id,
    promptsPath: path.normalize(agentsRoot),
    templatesPath: path.normalize(templatesPath),
    skillsPath: null,
    installedFiles,
    agentFileCount: agentArts.length,
    templateFileCount: templateArts.length,
    skillFileCount: 0,
  };
  return { target, installedFiles };
}

async function emitWorkspaceSkills(
  workspaceRoot: string,
  ctx: { agentsSourceDir: string; templatesSourceDir: string; skillsSourceDir: string; repoRoot: string },
  adapterId: string,
  dryRun: boolean,
): Promise<{ paths: string[]; skillsPath: string; count: number }> {
  const adapter = getAdapter(adapterId);
  if (!adapter.adaptSkills) {
    return { paths: [], skillsPath: path.join(workspaceRoot, '.github', 'skills'), count: 0 };
  }
  const skillsCtx = { ...ctx, workspaceRoot };
  const arts = await adapter.adaptSkills(skillsCtx);
  const paths: string[] = [];
  for (const a of arts) {
    paths.push(await writeArtifact(workspaceRoot, a, dryRun));
  }
  return {
    paths,
    skillsPath: path.normalize(path.join(workspaceRoot, '.github', 'skills')),
    count: arts.length,
  };
}

async function emitWorkspaceTemplates(
  workspaceRoot: string,
  templatesSourceDir: string,
  dryRun: boolean,
): Promise<{ paths: string[]; templatesPath: string; count: number }> {
  const base = path.resolve(templatesSourceDir);
  const listFilesRecursive = (root: string): string[] => {
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const e of fsSync.readdirSync(dir, { withFileTypes: true })) {
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
  };
  const files = listFilesRecursive(templatesSourceDir);
  const paths: string[] = [];
  for (const abs of files) {
    const rel = path.relative(base, abs);
    const artifact: InstallArtifact = {
      kind: 'copy',
      targetSubpath: path.join('Templates', rel),
      sourceAbsolute: abs,
    };
    paths.push(await writeArtifact(workspaceRoot, artifact, dryRun));
  }
  return {
    paths,
    templatesPath: path.normalize(path.join(workspaceRoot, 'Templates')),
    count: files.length,
  };
}

export async function runInstall(opts: RunInstallOptions): Promise<{ manifest: InstallManifestV3; manifestPath: string }> {
  const repoRoot = path.resolve(opts.repoRoot);
  assertRepoLayout(repoRoot);

  const installRoot = path.resolve(opts.installRoot);
  const managedMarkerPath = path.join(installRoot, '.managed-by-ai-agent-workflows');
  const manifestPath = path.join(installRoot, 'install-manifest.json');

  if (!opts.dryRun) {
    await fs.mkdir(installRoot, { recursive: true });
    await fs.writeFile(managedMarkerPath, 'managed=true\n', 'ascii');
  }

  const { agentsSourceDir, templatesSourceDir, skillsSourceDir } = resolveRepoPaths(repoRoot);
  const ctx = { repoRoot, agentsSourceDir, templatesSourceDir, skillsSourceDir };

  const targets: ManifestTarget[] = [];
  for (const toolId of opts.toolIds) {
    const tool = getToolById(opts.registry, toolId);
    const { target } = await emitForTool(tool, ctx, opts.dryRun);
    targets.push(target);
  }

  let workspace: ManifestWorkspace | null = null;
  if (opts.workspaceRoot) {
    const workspaceRoot = path.resolve(opts.workspaceRoot);
    const workspaceInstalled: string[] = [];
    let skillsPath: string | null = null;
    let skillsFileCount = 0;
    let templatesPath: string | null = null;
    let templatesFileCount = 0;

    if (opts.workspaceSkills && fsSync.existsSync(skillsSourceDir)) {
      const firstTool = getToolById(opts.registry, opts.toolIds[0]!);
      const skillsResult = await emitWorkspaceSkills(workspaceRoot, ctx, firstTool.adapterId, opts.dryRun);
      workspaceInstalled.push(...skillsResult.paths);
      if (skillsResult.count > 0) {
        skillsPath = skillsResult.skillsPath;
        skillsFileCount = skillsResult.count;
      }
    }

    if (opts.workspaceTemplates) {
      const wt = await emitWorkspaceTemplates(workspaceRoot, templatesSourceDir, opts.dryRun);
      workspaceInstalled.push(...wt.paths);
      templatesPath = wt.templatesPath;
      templatesFileCount = wt.count;
    }

    if (workspaceInstalled.length > 0) {
      workspace = {
        root: path.normalize(workspaceRoot),
        skillsPath,
        skillsFileCount,
        templatesPath,
        templatesFileCount,
        installedFiles: workspaceInstalled,
      };
    }
  }

  const manifest: InstallManifestV3 = {
    schemaVersion: 3,
    packageVersion: readPackageVersion(repoRoot),
    installedAtUtc: new Date().toISOString(),
    installRoot: path.normalize(installRoot),
    sourceRepoPath: path.normalize(repoRoot),
    managedMarker: path.normalize(managedMarkerPath),
    targets,
    workspace,
  };

  if (!opts.dryRun) {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  return { manifest, manifestPath };
}
