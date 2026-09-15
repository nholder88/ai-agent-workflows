/**
 * Template materialization engine for create-project scaffolding.
 * 
 * Materialization follows the architecture defined in docs/create-project-architecture.md:
 * 1. Copy scaffold assets from templates/{stack}/scaffold/ to output directory
 * 2. Render template variables ({{projectName}}, etc.)
 * 3. Generate project-local standards artifacts (AGENTS.md, .cursor/rules)
 * 4. Copy .env.example from template root
 * 
 * Scaffold assets take precedence over generated manifests — if a scaffold
 * file exists, use it; otherwise generate from template spec.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { logger } from './logger.js';
import type { CreateContext } from '../create-project.js';
import type { StackDefinition } from './create-project-catalog.js';

export interface MaterializationContext {
  projectName: string;
  outputPath: string;
  frontendStack?: StackDefinition;
  backendStack?: StackDefinition;
  preset?: string;
  skipSkills: boolean;
  repoRoot: string;
}

/**
 * Materialize a new project from resolved template specs.
 */
export async function materializeProject(ctx: CreateContext): Promise<void> {
  logger.info('materialize_start', {
    projectName: ctx.projectName,
    outputPath: ctx.outputPath,
    frontendStack: ctx.frontendStack,
    backendStack: ctx.backendStack,
  });

  await ensureOutputDirectory(ctx.outputPath);

  if (ctx.frontendStack) {
    await materializeStack(ctx, 'frontend', ctx.frontendStack);
  }

  if (ctx.backendStack) {
    await materializeStack(ctx, 'backend', ctx.backendStack);
  }

  await generateStandardsArtifacts(ctx);

  logger.info('materialize_complete', { projectName: ctx.projectName });
}

/**
 * Ensure output directory exists and is empty (or create it).
 */
async function ensureOutputDirectory(outputPath: string): Promise<void> {
  try {
    const stat = await fs.stat(outputPath);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(outputPath);
      if (entries.length > 0) {
        throw new Error(`Output directory ${outputPath} already exists and is not empty`);
      }
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(outputPath, { recursive: true });
      logger.info('output_directory_created', { outputPath });
    } else {
      throw err;
    }
  }
}

/**
 * Materialize a single stack (frontend or backend).
 */
async function materializeStack(
  ctx: CreateContext,
  stackType: 'frontend' | 'backend',
  stackKey: string,
): Promise<void> {
  logger.info('materialize_stack_start', { stackType, stackKey });

  const templateDir = resolveTemplateDir(ctx.repoRoot, stackType, stackKey);
  const scaffoldDir = path.join(templateDir, 'scaffold');
  const envExamplePath = path.join(templateDir, '.env.example');

  const scaffoldExists = await directoryExists(scaffoldDir);
  if (!scaffoldExists) {
    logger.warn('scaffold_dir_not_found', {
      stackKey,
      scaffoldDir,
      message: 'Scaffold directory not found — project will be minimal',
    });
    return;
  }

  await copyScaffoldAssets(scaffoldDir, ctx.outputPath, ctx.projectName);

  if (await fileExists(envExamplePath)) {
    const envDest = path.join(ctx.outputPath, '.env.example');
    await fs.copyFile(envExamplePath, envDest);
    logger.info('env_example_copied', { from: envExamplePath, to: envDest });
  }

  logger.info('materialize_stack_complete', { stackType, stackKey });
}

/**
 * Resolve template directory for a given stack.
 */
function resolveTemplateDir(
  repoRoot: string,
  stackType: 'frontend' | 'backend',
  stackKey: string,
): string {
  if (stackType === 'frontend') {
    return path.join(repoRoot, 'templates', `frontend-${stackKey}`);
  } else {
    if (stackKey === 'node_nestjs') {
      return path.join(repoRoot, 'templates', 'backend-service');
    }
    return path.join(repoRoot, 'templates', `backend-${stackKey}`);
  }
}

/**
 * Copy scaffold assets from template to output directory, rendering template variables.
 */
async function copyScaffoldAssets(
  scaffoldDir: string,
  outputDir: string,
  projectName: string,
): Promise<void> {
  await copyDirectoryRecursive(scaffoldDir, outputDir, projectName);
  logger.info('scaffold_assets_copied', { scaffoldDir, outputDir });
}

/**
 * Recursively copy directory contents with template variable rendering.
 */
async function copyDirectoryRecursive(
  sourceDir: string,
  destDir: string,
  projectName: string,
): Promise<void> {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectoryRecursive(sourcePath, destPath, projectName);
    } else if (entry.isFile()) {
      const content = await fs.readFile(sourcePath, 'utf-8');
      const rendered = renderTemplate(content, projectName);
      await fs.writeFile(destPath, rendered, 'utf-8');
    }
  }
}

/**
 * Render template variables in content.
 * Currently supports: {{projectName}}
 */
function renderTemplate(content: string, projectName: string): string {
  return content.replace(/\{\{projectName\}\}/g, projectName);
}

/**
 * Generate project-local standards artifacts (AGENTS.md, .cursor/rules).
 */
async function generateStandardsArtifacts(ctx: CreateContext): Promise<void> {
  logger.info('generate_standards_artifacts_start', { projectName: ctx.projectName });

  await generateAgentsMd(ctx);
  await generateCursorRules(ctx);

  logger.info('generate_standards_artifacts_complete', { projectName: ctx.projectName });
}

/**
 * Generate AGENTS.md in the project root.
 */
async function generateAgentsMd(ctx: CreateContext): Promise<void> {
  const stacks = [ctx.frontendStack, ctx.backendStack]
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join('\n');

  const content = `# ${ctx.projectName} — Agents

This project was scaffolded with ai-agent-workflows.

## Stack

${stacks}

## Available Agents

This project includes the following AI agents from ai-agent-workflows:

- **Orchestrator** — Coordinates work across agents
- **Implementer** — Implements features per stack conventions
- **Reviewer** — Reviews code for quality and standards
- **Tester** — Writes and runs tests

## State Management

${ctx.frontendStack ? `Frontend uses ${ctx.frontendStack === 'nextjs' ? 'Zustand + TanStack Query' : 'framework-specific state management'}.` : ''}

## Testing

${ctx.frontendStack ? `Frontend: Vitest (unit) + Playwright (e2e)\n` : ''}${ctx.backendStack ? `Backend: ${ctx.backendStack === 'node_nestjs' ? 'Jest' : ctx.backendStack === 'python' ? 'pytest' : 'framework-specific testing'}` : ''}

## Platform Contracts

This project implements platform contracts from ai-agent-workflows templates.

Required capabilities:
- Feature flags (CAP-FF-001, CAP-FF-002)
- Reporting (CAP-REP-001, CAP-REP-002)
- Admin dashboard (CAP-ADM-001)
- Observability (CAP-OBS-001)
- Security (CAP-SEC-001)
${ctx.backendStack ? '- Data access (CAP-DATA-001)\n- Operations (CAP-OPS-001)' : ''}

---

Generated by ai-agent-workflows on ${new Date().toISOString()}
`;

  const agentsMdPath = path.join(ctx.outputPath, 'AGENTS.md');
  await fs.writeFile(agentsMdPath, content, 'utf-8');
  logger.info('agents_md_generated', { path: agentsMdPath });
}

/**
 * Generate .cursor/rules in the project root.
 */
async function generateCursorRules(ctx: CreateContext): Promise<void> {
  const cursorDir = path.join(ctx.outputPath, '.cursor');
  await fs.mkdir(cursorDir, { recursive: true });

  const stackDescriptions = [];
  if (ctx.frontendStack) {
    stackDescriptions.push(
      `Frontend: ${ctx.frontendStack} — ${ctx.frontendStack === 'nextjs' ? 'Next.js App Router with Zustand + TanStack Query' : 'See stack documentation'}`
    );
  }
  if (ctx.backendStack) {
    stackDescriptions.push(
      `Backend: ${ctx.backendStack} — ${ctx.backendStack === 'node_nestjs' ? 'NestJS with TypeORM' : ctx.backendStack === 'python' ? 'FastAPI with SQLAlchemy' : 'See stack documentation'}`
    );
  }

  const content = `# ${ctx.projectName} — Project Rules

Generated by ai-agent-workflows. These rules encode the project's stack choices and conventions.

## Stack

${stackDescriptions.join('\n')}

## State Management (Frontend)

${ctx.frontendStack === 'nextjs' ? `- Server state: TanStack Query
- Client state: Zustand (feature-local stores)
- Form state: React Hook Form + Zod
- Keep server state in query cache
- Keep UI state in feature-local Zustand stores` : 'See framework documentation'}

## Testing

${ctx.frontendStack ? `Frontend:
- Unit tests: ${ctx.frontendStack === 'nextjs' ? 'Vitest' : 'framework-specific'}
- E2E tests: ${ctx.frontendStack === 'nextjs' ? 'Playwright' : 'framework-specific'}
- Run: npm run test:unit, npm run test:e2e
` : ''}
${ctx.backendStack ? `Backend:
- Unit tests: ${ctx.backendStack === 'node_nestjs' ? 'Jest' : ctx.backendStack === 'python' ? 'pytest' : 'framework-specific'}
- E2E tests: API smoke tests
- Run: ${ctx.backendStack === 'python' ? 'pytest -m "not e2e" (unit), pytest -m "e2e or smoke" (e2e)' : 'npm run test:unit, npm run test:e2e'}
` : ''}

## Required Capabilities

This project must maintain implementations of:
- Feature flags (provider adapter interface)
- Reporting endpoints (definitions, run, status)
- Admin dashboard endpoints (feature-flags, audit)
- Health and readiness checks
${ctx.backendStack ? '- Database access layer\n- Graceful shutdown' : ''}

## Platform Contracts

Changes to feature flags, reporting, or admin APIs must maintain contract compatibility.
Contract version: templates/shared/platform-contracts.yaml (from scaffold time)

---

Generated: ${new Date().toISOString()}
Template: ai-agent-workflows v1.0.0
`;

  const rulesPath = path.join(cursorDir, 'rules');
  await fs.writeFile(rulesPath, content, 'utf-8');
  logger.info('cursor_rules_generated', { path: rulesPath });
}

/**
 * Check if a directory exists.
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}
