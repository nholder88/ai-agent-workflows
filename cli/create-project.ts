/**
 * Create-project command handler for scaffolding new projects from templates.
 */
import * as path from 'node:path';
import { input, select, confirm, checkbox } from '@inquirer/prompts';

export interface CreateContext {
  archetype: string;
  projectName: string;
  outputPath: string;
  stack?: string;
  frontendStack?: string;
  backendStack?: string;
  preset?: string;
  skipSkills: boolean;
  repoRoot: string;
}

export interface CreateArgs {
  archetype: string | null;
  projectName: string | null;
  outputPath: string | null;
  stack: string | null;
  frontendStack: string | null;
  backendStack: string | null;
  preset: string | null;
  skipSkills: boolean;
  yes: boolean;
  repoRoot: string;
}

const ARCHETYPES = [
  { value: 'react', name: 'React — Frontend application with React framework', category: 'frontend' },
  { value: 'api', name: 'API — Backend service or REST/GraphQL API', category: 'backend' },
  { value: 'fullstack', name: 'Fullstack — Combined frontend + backend application', category: 'both' },
  { value: 'library', name: 'Library — Reusable package or module', category: 'library' },
] as const;

const FRONTEND_STACKS = [
  { value: 'nextjs', name: 'Next.js — React framework with SSR/SSG' },
  { value: 'sveltekit', name: 'SvelteKit — Svelte framework' },
  { value: 'angular', name: 'Angular — Full-featured framework' },
] as const;

const BACKEND_STACKS = [
  { value: 'node_nestjs', name: 'Node.js (NestJS) — TypeScript backend framework' },
  { value: 'python', name: 'Python — FastAPI or Django' },
  { value: 'go', name: 'Go — High-performance backend' },
  { value: 'dotnet', name: '.NET — C# backend' },
  { value: 'java', name: 'Java — Spring Boot' },
  { value: 'rust', name: 'Rust — Systems-level backend' },
] as const;

const PRESETS = [
  { value: 'nigel-react', name: 'Nigel React — Zustand + TanStack Query + Tailwind + Vitest', appliesTo: ['nextjs', 'sveltekit'] },
] as const;

const DEFAULT_STACKS: Record<string, { frontend?: string; backend?: string }> = {
  react: { frontend: 'nextjs' },
  api: { backend: 'node_nestjs' },
  fullstack: { frontend: 'nextjs', backend: 'node_nestjs' },
  library: {},
};

function validateProjectName(name: string): boolean | string {
  if (!name || name.trim() === '') {
    return 'Project name is required';
  }
  if (name.includes(' ')) {
    return 'Project name cannot contain spaces';
  }
  if (!/^[a-z0-9-_]+$/i.test(name)) {
    return 'Project name must contain only letters, numbers, hyphens, and underscores';
  }
  return true;
}

function getAvailablePresets(stackKey: string): Array<{ value: string; name: string }> {
  return PRESETS.filter((p) => p.appliesTo.includes(stackKey as any)).map((p) => ({
    value: p.value,
    name: p.name,
  }));
}

export async function runCreateInteractive(args: CreateArgs): Promise<CreateContext> {
  console.log('');
  console.log('  AI Agent Workflows — Project Scaffolding');
  console.log('  Create a new project with stack-specific agents and standards.');
  console.log('');

  const archetype = args.archetype ?? await select({
    message: 'What type of project?',
    choices: ARCHETYPES.map((a) => ({ value: a.value, name: a.name })),
  });

  if (!ARCHETYPES.find((a) => a.value === archetype)) {
    throw new Error(`Invalid archetype: ${archetype}. Valid: ${ARCHETYPES.map((a) => a.value).join(', ')}`);
  }

  const projectName = args.projectName ?? await input({
    message: 'Project name:',
    validate: (val) => validateProjectName(val),
  });

  const outputPath = args.outputPath ?? path.resolve(process.cwd(), projectName);

  let frontendStack: string | undefined;
  let backendStack: string | undefined;
  let stack: string | undefined;

  const archetypeMeta = ARCHETYPES.find((a) => a.value === archetype)!;

  if (archetypeMeta.category === 'frontend' || archetype === 'react') {
    frontendStack = args.frontendStack ?? args.stack ?? await select({
      message: 'Choose frontend stack:',
      choices: FRONTEND_STACKS,
      default: DEFAULT_STACKS[archetype]?.frontend,
    });
    stack = frontendStack;
  } else if (archetypeMeta.category === 'backend' || archetype === 'api') {
    backendStack = args.backendStack ?? args.stack ?? await select({
      message: 'Choose backend stack:',
      choices: BACKEND_STACKS,
      default: DEFAULT_STACKS[archetype]?.backend,
    });
    stack = backendStack;
  } else if (archetypeMeta.category === 'both' || archetype === 'fullstack') {
    frontendStack = args.frontendStack ?? await select({
      message: 'Choose frontend stack:',
      choices: FRONTEND_STACKS,
      default: DEFAULT_STACKS.fullstack.frontend,
    });
    backendStack = args.backendStack ?? await select({
      message: 'Choose backend stack:',
      choices: BACKEND_STACKS,
      default: DEFAULT_STACKS.fullstack.backend,
    });
  }

  let preset: string | undefined;
  const primaryStack = frontendStack || backendStack || stack;
  if (primaryStack) {
    const availablePresets = getAvailablePresets(primaryStack);
    if (availablePresets.length > 0 && !args.yes) {
      const presetChoices = [
        { value: 'none', name: 'None — Use base template defaults' },
        ...availablePresets,
      ];
      const presetChoice = args.preset ?? await select({
        message: 'Apply preset? (optional)',
        choices: presetChoices,
        default: 'none',
      });
      preset = presetChoice === 'none' ? undefined : presetChoice;
    } else if (args.preset) {
      const validPreset = availablePresets.find((p) => p.value === args.preset);
      if (!validPreset) {
        throw new Error(`Preset "${args.preset}" is not available for stack "${primaryStack}"`);
      }
      preset = args.preset;
    }
  }

  const skipSkills = args.skipSkills || (!args.yes ? await confirm({
    message: 'Skip copying workspace skills?',
    default: false,
  }) : false);

  if (!args.yes) {
    console.log('');
    console.log('  Summary:');
    console.log(`    Archetype: ${archetype}`);
    console.log(`    Project: ${projectName}`);
    console.log(`    Output: ${outputPath}`);
    if (frontendStack) console.log(`    Frontend: ${frontendStack}`);
    if (backendStack) console.log(`    Backend: ${backendStack}`);
    if (stack && !frontendStack && !backendStack) console.log(`    Stack: ${stack}`);
    if (preset) console.log(`    Preset: ${preset}`);
    console.log(`    Skills: ${skipSkills ? 'skip' : 'include'}`);
    console.log('');

    const proceed = await confirm({
      message: 'Create project with these settings?',
      default: true,
    });

    if (!proceed) {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  return {
    archetype,
    projectName,
    outputPath,
    stack,
    frontendStack,
    backendStack,
    preset,
    skipSkills,
    repoRoot: args.repoRoot,
  };
}

export function validateCreateArgs(args: CreateArgs): CreateContext {
  if (!args.archetype) {
    throw new Error(`archetype is required in non-interactive mode. Valid: ${ARCHETYPES.map((a) => a.value).join(', ')}`);
  }

  const archetypeMeta = ARCHETYPES.find((a) => a.value === args.archetype);
  if (!archetypeMeta) {
    throw new Error(`Unknown archetype "${args.archetype}". Valid: ${ARCHETYPES.map((a) => a.value).join(', ')}`);
  }

  if (!args.projectName) {
    throw new Error('project name is required in non-interactive mode');
  }

  const nameValidation = validateProjectName(args.projectName);
  if (nameValidation !== true) {
    throw new Error(nameValidation);
  }

  const outputPath = args.outputPath ?? path.resolve(process.cwd(), args.projectName);

  let frontendStack: string | undefined;
  let backendStack: string | undefined;
  let stack: string | undefined;

  if (archetypeMeta.category === 'frontend' || args.archetype === 'react') {
    frontendStack = args.frontendStack ?? args.stack ?? DEFAULT_STACKS[args.archetype]?.frontend;
    if (!frontendStack) {
      throw new Error(`frontend stack is required for frontend/react archetype. Valid: ${FRONTEND_STACKS.map((s) => s.value).join(', ')}`);
    }
    const validStack = FRONTEND_STACKS.find((s) => s.value === frontendStack);
    if (!validStack) {
      throw new Error(`Unknown frontend stack "${frontendStack}". Valid: ${FRONTEND_STACKS.map((s) => s.value).join(', ')}`);
    }
    stack = frontendStack;
  } else if (archetypeMeta.category === 'backend' || args.archetype === 'api') {
    backendStack = args.backendStack ?? args.stack ?? DEFAULT_STACKS[args.archetype]?.backend;
    if (!backendStack) {
      throw new Error(`backend stack is required for backend/api archetype. Valid: ${BACKEND_STACKS.map((s) => s.value).join(', ')}`);
    }
    const validStack = BACKEND_STACKS.find((s) => s.value === backendStack);
    if (!validStack) {
      throw new Error(`Unknown backend stack "${backendStack}". Valid: ${BACKEND_STACKS.map((s) => s.value).join(', ')}`);
    }
    stack = backendStack;
  } else if (archetypeMeta.category === 'both' || args.archetype === 'fullstack') {
    frontendStack = args.frontendStack ?? DEFAULT_STACKS.fullstack.frontend;
    backendStack = args.backendStack ?? DEFAULT_STACKS.fullstack.backend;

    if (!FRONTEND_STACKS.find((s) => s.value === frontendStack)) {
      throw new Error(`Unknown frontend stack "${frontendStack}". Valid: ${FRONTEND_STACKS.map((s) => s.value).join(', ')}`);
    }
    if (!BACKEND_STACKS.find((s) => s.value === backendStack)) {
      throw new Error(`Unknown backend stack "${backendStack}". Valid: ${BACKEND_STACKS.map((s) => s.value).join(', ')}`);
    }
  }

  const preset = args.preset;
  if (preset) {
    const primaryStack = frontendStack || backendStack || stack;
    if (primaryStack) {
      const availablePresets = getAvailablePresets(primaryStack);
      const validPreset = availablePresets.find((p) => p.value === preset);
      if (!validPreset) {
        throw new Error(`Preset "${preset}" is not available for stack "${primaryStack}". Available: ${availablePresets.map((p) => p.value).join(', ') || 'none'}`);
      }
    }
  }

  return {
    archetype: args.archetype,
    projectName: args.projectName,
    outputPath,
    stack,
    frontendStack,
    backendStack,
    preset,
    skipSkills: args.skipSkills,
    repoRoot: args.repoRoot,
  };
}

export async function runCreate(args: CreateArgs): Promise<void> {
  let ctx: CreateContext;
  try {
    ctx = args.yes ? validateCreateArgs(args) : await runCreateInteractive(args);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    console.error('Usage: ai-agent-pack-install create <archetype> <name> [options]');
    console.error('Run with --help for more information.');
    process.exit(1);
  }

  console.log('');
  console.log(`Creating project: ${ctx.projectName}`);
  console.log(`  Location: ${ctx.outputPath}`);
  console.log(`  Archetype: ${ctx.archetype}`);
  if (ctx.frontendStack) console.log(`  Frontend: ${ctx.frontendStack}`);
  if (ctx.backendStack) console.log(`  Backend: ${ctx.backendStack}`);
  if (ctx.stack && !ctx.frontendStack && !ctx.backendStack) console.log(`  Stack: ${ctx.stack}`);
  if (ctx.preset) console.log(`  Preset: ${ctx.preset}`);
  console.log('');

  console.log('[stub] Template materialization engine not yet implemented (issue #33).');
  console.log('[stub] This is the hook point for future scaffolding logic.');
  console.log('');
  console.log('When implemented, this will:');
  console.log('  1. Resolve template specs from templates/ directory');
  console.log('  2. Materialize project structure with selected stacks');
  console.log('  3. Generate AGENTS.md and .cursor/rules');
  console.log('  4. Copy workspace skills (if not skipped)');
  console.log('  5. Apply preset modifications (if selected)');
  console.log('');
  console.log(`[stub] Would create: ${ctx.outputPath}`);
  console.log('[ok] Command surface validation complete. See issue #33 for materialization implementation.');
}
