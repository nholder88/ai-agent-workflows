/**
 * Create-project command handler for scaffolding new projects from templates.
 */
import * as path from 'node:path';
import { input, select, confirm } from '@inquirer/prompts';
import { logger } from './lib/logger.js';
import {
  loadStackCatalog,
  getArchetypes,
  getDefaultStacks,
  findArchetype,
  findFrontendStack,
  findBackendStack,
  getAvailablePresets,
  formatFrontendStackChoices,
  formatBackendStackChoices,
  getFrontendStackKeys,
  getBackendStackKeys,
  type StackCatalog,
} from './lib/create-project-catalog.js';

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

export async function runCreateInteractive(args: CreateArgs): Promise<CreateContext> {
  const catalogPath = path.join(args.repoRoot, 'templates', 'shared', 'stack-catalog.yaml');
  const catalog = loadStackCatalog(catalogPath);
  const archetypes = getArchetypes();
  const defaultStacks = getDefaultStacks();

  logger.info('create_wizard_start', { mode: 'interactive' });

  console.log('');
  console.log('  AI Agent Workflows — Project Scaffolding');
  console.log('  Create a new project with stack-specific agents and standards.');
  console.log('');

  const archetype = args.archetype ?? await select({
    message: 'What type of project?',
    choices: archetypes.map((a) => ({ value: a.value, name: a.name })),
  });

  const archetypeMeta = findArchetype(archetype);
  if (!archetypeMeta) {
    throw new Error(`Invalid archetype: ${archetype}. Valid: ${archetypes.map((a) => a.value).join(', ')}`);
  }

  const projectName = args.projectName ?? await input({
    message: 'Project name:',
    validate: (val) => validateProjectName(val),
  });

  const outputPath = args.outputPath ?? path.resolve(process.cwd(), projectName);

  let frontendStack: string | undefined;
  let backendStack: string | undefined;
  let stack: string | undefined;

  if (archetypeMeta.requiresFrontendStack && !archetypeMeta.requiresBackendStack) {
    frontendStack = args.frontendStack ?? args.stack ?? await select({
      message: 'Choose frontend stack:',
      choices: formatFrontendStackChoices(catalog),
      default: defaultStacks[archetype]?.frontend,
    });
    stack = frontendStack;
  } else if (archetypeMeta.requiresBackendStack && !archetypeMeta.requiresFrontendStack) {
    backendStack = args.backendStack ?? args.stack ?? await select({
      message: 'Choose backend stack:',
      choices: formatBackendStackChoices(catalog),
      default: defaultStacks[archetype]?.backend,
    });
    stack = backendStack;
  } else if (archetypeMeta.requiresFrontendStack && archetypeMeta.requiresBackendStack) {
    frontendStack = args.frontendStack ?? await select({
      message: 'Choose frontend stack:',
      choices: formatFrontendStackChoices(catalog),
      default: defaultStacks[archetype]?.frontend,
    });
    backendStack = args.backendStack ?? await select({
      message: 'Choose backend stack:',
      choices: formatBackendStackChoices(catalog),
      default: defaultStacks[archetype]?.backend,
    });
  }

  let preset: string | undefined;
  const primaryStack = frontendStack || backendStack || stack;
  if (primaryStack) {
    const availablePresets = getAvailablePresets(primaryStack);
    if (availablePresets.length > 0 && !args.yes) {
      const presetChoices = [
        { value: 'none', name: 'None — Use base template defaults' },
        ...availablePresets.map((p) => ({ value: p.value, name: p.name })),
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
      logger.info('create_wizard_cancelled', { archetype, projectName });
      process.exit(0);
    }
  }

  logger.info('create_wizard_complete', {
    archetype,
    projectName,
    outputPath,
    frontendStack,
    backendStack,
    preset,
    skipSkills,
  });

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
  const catalogPath = path.join(args.repoRoot, 'templates', 'shared', 'stack-catalog.yaml');
  const catalog = loadStackCatalog(catalogPath);
  const archetypes = getArchetypes();
  const defaultStacks = getDefaultStacks();

  logger.info('create_validation_start', { mode: 'non-interactive' });

  if (!args.archetype) {
    throw new Error(`archetype is required in non-interactive mode. Valid: ${archetypes.map((a) => a.value).join(', ')}`);
  }

  const archetypeMeta = findArchetype(args.archetype);
  if (!archetypeMeta) {
    throw new Error(`Unknown archetype "${args.archetype}". Valid: ${archetypes.map((a) => a.value).join(', ')}`);
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

  if (archetypeMeta.requiresFrontendStack && !archetypeMeta.requiresBackendStack) {
    frontendStack = args.frontendStack ?? args.stack ?? defaultStacks[args.archetype]?.frontend;
    if (!frontendStack) {
      throw new Error(`frontend stack is required for frontend archetype. Valid: ${getFrontendStackKeys(catalog).join(', ')}`);
    }
    if (!findFrontendStack(catalog, frontendStack)) {
      throw new Error(`Unknown frontend stack "${frontendStack}". Valid: ${getFrontendStackKeys(catalog).join(', ')}`);
    }
    stack = frontendStack;
  } else if (archetypeMeta.requiresBackendStack && !archetypeMeta.requiresFrontendStack) {
    backendStack = args.backendStack ?? args.stack ?? defaultStacks[args.archetype]?.backend;
    if (!backendStack) {
      throw new Error(`backend stack is required for backend archetype. Valid: ${getBackendStackKeys(catalog).join(', ')}`);
    }
    if (!findBackendStack(catalog, backendStack)) {
      throw new Error(`Unknown backend stack "${backendStack}". Valid: ${getBackendStackKeys(catalog).join(', ')}`);
    }
    stack = backendStack;
  } else if (archetypeMeta.requiresFrontendStack && archetypeMeta.requiresBackendStack) {
    frontendStack = args.frontendStack ?? defaultStacks[args.archetype]?.frontend;
    backendStack = args.backendStack ?? defaultStacks[args.archetype]?.backend;

    if (!frontendStack || !findFrontendStack(catalog, frontendStack)) {
      throw new Error(`Unknown frontend stack "${frontendStack}". Valid: ${getFrontendStackKeys(catalog).join(', ')}`);
    }
    if (!backendStack || !findBackendStack(catalog, backendStack)) {
      throw new Error(`Unknown backend stack "${backendStack}". Valid: ${getBackendStackKeys(catalog).join(', ')}`);
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

  logger.info('create_validation_complete', {
    archetype: args.archetype,
    projectName: args.projectName,
    outputPath,
    frontendStack,
    backendStack,
    preset,
  });

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
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('create_validation_failed', { error: errorMessage });
    console.error(`Error: ${errorMessage}`);
    console.error('Usage: ai-agent-pack-install create <archetype> <name> [options]');
    console.error('Run with --help for more information.');
    process.exit(1);
  }

  logger.info('create_start', {
    projectName: ctx.projectName,
    outputPath: ctx.outputPath,
    archetype: ctx.archetype,
    frontendStack: ctx.frontendStack,
    backendStack: ctx.backendStack,
    preset: ctx.preset,
    skipSkills: ctx.skipSkills,
  });

  console.log('');
  console.log(`Creating project: ${ctx.projectName}`);
  console.log(`  Location: ${ctx.outputPath}`);
  console.log(`  Archetype: ${ctx.archetype}`);
  if (ctx.frontendStack) console.log(`  Frontend: ${ctx.frontendStack}`);
  if (ctx.backendStack) console.log(`  Backend: ${ctx.backendStack}`);
  if (ctx.stack && !ctx.frontendStack && !ctx.backendStack) console.log(`  Stack: ${ctx.stack}`);
  if (ctx.preset) console.log(`  Preset: ${ctx.preset}`);
  console.log('');

  try {
    const { materializeProject } = await import('./lib/materializer.js');
    const result = await materializeProject(ctx);

    console.log('');
    console.log('✓ Project created successfully!');
    console.log('');
    console.log(`  Location: ${result.projectPath}`);
    console.log(`  Directories: ${result.directoriesCreated}`);
    console.log(`  Files: ${result.filesCreated}`);
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${ctx.projectName}`);
    console.log('  npm install');
    console.log('  npm run dev');
    console.log('');

    logger.info('create_complete', {
      status: 'success',
      projectName: ctx.projectName,
      outputPath: ctx.outputPath,
      directoriesCreated: result.directoriesCreated,
      filesCreated: result.filesCreated,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('materialization_failed', { error: errorMessage });
    console.error('');
    console.error(`Error: ${errorMessage}`);
    console.error('');
    process.exit(1);
  }
}
