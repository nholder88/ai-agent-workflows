import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

type ValidationError = {
  filePath: string;
  message: string;
  hint?: string;
};

type ValidationOptions = {
  rootDir: string;
};

const REQUIRED_DESIGN_FILES = [
  'Design/composition.md',
  'Design/composition-demarcation.md',
  'Design/composition-seam.md',
] as const;

const REQUIRED_DEMARCATION_HEADINGS = [
  'Stage Ownership',
  'Context-First',
  'Named Handoffs',
] as const;

const REQUIRED_DEMARCATION_PHRASES = [
  'Stage 0.5',
  'reverse-engineer',
  'Context kit',
  'context-first',
] as const;

const REQUIRED_SEAM_USAGE_FIELDS = [
  'tokens_in',
  'tokens_out',
  'tokens_cache_read',
  'tokens_cache_write',
  'credits',
  'duration_seconds',
  'runner_id',
  'resolved_model',
] as const;

const SEAM_CACHE_GUIDANCE_PHRASES = [
  'cache read/write fields are required even when the values are zero',
  'cache tokens',
] as const;

const SEAM_CREDITS_GUIDANCE_PHRASES = [
  'credits field may be null',
  'credits or null',
] as const;

export function validateDesignFilesExist(
  rootDir: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const relativePath of REQUIRED_DESIGN_FILES) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push({
        filePath: absolutePath,
        message: `Required Design Composition file is missing: ${relativePath}.`,
        hint: `Create ${relativePath} to satisfy the Composition contract.`,
      });
    }
  }

  return errors;
}

export function validateDemarcationContent(
  rootDir: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const demarcationPath = path.join(
    rootDir,
    'Design/composition-demarcation.md'
  );

  if (!existsSync(demarcationPath)) {
    return errors;
  }

  const content = readFileSync(demarcationPath, 'utf8');

  for (const heading of REQUIRED_DEMARCATION_HEADINGS) {
    if (!content.includes(heading)) {
      errors.push({
        filePath: demarcationPath,
        message: `Demarcation file is missing required heading: "${heading}".`,
        hint: `Add a section with heading "${heading}" to ${path.basename(demarcationPath)}.`,
      });
    }
  }

  for (const phrase of REQUIRED_DEMARCATION_PHRASES) {
    if (!content.includes(phrase)) {
      errors.push({
        filePath: demarcationPath,
        message: `Demarcation file is missing required phrase: "${phrase}".`,
        hint: `Include "${phrase}" in the context-first flow description in ${path.basename(demarcationPath)}.`,
      });
    }
  }

  return errors;
}

export function validateSeamContent(rootDir: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const seamPath = path.join(rootDir, 'Design/composition-seam.md');

  if (!existsSync(seamPath)) {
    return errors;
  }

  const content = readFileSync(seamPath, 'utf8');

  for (const field of REQUIRED_SEAM_USAGE_FIELDS) {
    if (!content.includes(field)) {
      errors.push({
        filePath: seamPath,
        message: `Seam contract is missing required usage field: "${field}".`,
        hint: `Add "${field}" to the Required Usage Fields section in ${path.basename(seamPath)}.`,
      });
    }
  }

  const hasCacheGuidance = SEAM_CACHE_GUIDANCE_PHRASES.some((phrase) =>
    content.toLowerCase().includes(phrase.toLowerCase())
  );
  if (!hasCacheGuidance) {
    errors.push({
      filePath: seamPath,
      message:
        'Seam contract must document that cache token fields are required even when zero.',
      hint: 'Add guidance explaining that cache_read and cache_write fields must be present even when values are 0.',
    });
  }

  const normalizedContent = content.toLowerCase().replace(/`/g, '');
  const hasCreditsGuidance = SEAM_CREDITS_GUIDANCE_PHRASES.some((phrase) =>
    normalizedContent.includes(phrase.toLowerCase())
  );
  if (!hasCreditsGuidance) {
    errors.push({
      filePath: seamPath,
      message:
        'Seam contract must document that credits field may be null.',
      hint: 'Add guidance explaining that the credits field can be null when cost is unavailable.',
    });
  }

  return errors;
}

export function validateReadmeLink(rootDir: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const readmePath = path.join(rootDir, 'README.md');

  if (!existsSync(readmePath)) {
    errors.push({
      filePath: readmePath,
      message: 'README.md does not exist.',
      hint: 'Create a README.md in the repository root.',
    });
    return errors;
  }

  const content = readFileSync(readmePath, 'utf8');
  const hasCompositionLink =
    content.includes('Design/composition.md') ||
    content.includes('./Design/composition.md') ||
    (content.includes('## Composition') &&
      (content.includes('[Design/composition') ||
        content.includes('(Design/composition')));

  if (!hasCompositionLink) {
    errors.push({
      filePath: readmePath,
      message:
        'README does not link to the Composition index (Design/composition.md).',
      hint: 'Add a Composition section linking to Design/composition.md.',
    });
  }

  return errors;
}

export function validateOrchestratorContent(
  rootDir: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const orchestratorPath = path.join(
    rootDir,
    'agents/orchestrator.agent.md'
  );

  if (!existsSync(orchestratorPath)) {
    errors.push({
      filePath: orchestratorPath,
      message: 'orchestrator.agent.md does not exist.',
      hint: 'Create agents/orchestrator.agent.md.',
    });
    return errors;
  }

  const content = readFileSync(orchestratorPath, 'utf8');

  const hasStage05 = content.includes('Stage 0.5') || content.includes('STAGE 0.5');
  if (!hasStage05) {
    errors.push({
      filePath: orchestratorPath,
      message:
        'Orchestrator must reference Stage 0.5 (context/reverse-engineer).',
      hint: 'Ensure Stage 0.5 / reverse-engineer / Context kit is documented in the orchestrator pipeline.',
    });
  }

  const hasReverseEngineer = content.includes('reverse-engineer');
  if (!hasReverseEngineer) {
    errors.push({
      filePath: orchestratorPath,
      message:
        'Orchestrator must reference reverse-engineer in the context stage.',
      hint: 'Include reverse-engineer language in the Stage 0.5 description.',
    });
  }

  const hasContextKit =
    content.includes('Context kit') || content.includes('context kit');
  if (!hasContextKit) {
    errors.push({
      filePath: orchestratorPath,
      message:
        'Orchestrator must reference Context kit in the Stage 0.5 description.',
      hint: 'Document Context kit as the output of Stage 0.5.',
    });
  }

  const claimsMattOwnership =
    (/orchestrator.*is.*default.*Matt.*fog/i.test(content) &&
      !/does not present itself as the default/i.test(content)) ||
    /orchestrator.*owns.*Matt.*grilling/i.test(content) ||
    (/orchestrator.*routes.*fog.*grill/i.test(content) &&
      !/does not.*route/i.test(content));

  if (claimsMattOwnership) {
    errors.push({
      filePath: orchestratorPath,
      message:
        'Orchestrator must not claim default Matt fog/grill ownership.',
      hint: 'Clarify that Matt skills own interactive fog/grill/decide, not the orchestrator.',
    });
  }

  const disclaimsMattOwnership =
    content.includes('Matt skills own interactive fog/grill/decide') ||
    content.includes('does not present itself as the default Matt fog/grill router');

  if (!disclaimsMattOwnership) {
    errors.push({
      filePath: orchestratorPath,
      message:
        'Orchestrator must explicitly disclaim Matt fog/grill ownership.',
      hint: 'Add a Role and Ownership section clarifying that Matt skills own interactive decide stages.',
    });
  }

  return errors;
}

export function runValidation(options: ValidationOptions): {
  ok: boolean;
  errors: ValidationError[];
} {
  const rootDir = options.rootDir;
  const errors: ValidationError[] = [];

  errors.push(...validateDesignFilesExist(rootDir));
  errors.push(...validateDemarcationContent(rootDir));
  errors.push(...validateSeamContent(rootDir));
  errors.push(...validateReadmeLink(rootDir));
  errors.push(...validateOrchestratorContent(rootDir));

  return {
    ok: errors.length === 0,
    errors,
  };
}

function formatErrors(rootDir: string, errors: ValidationError[]): string {
  return errors
    .map((error, index) => {
      const relativePath =
        path.relative(rootDir, error.filePath) || error.filePath;
      const hintSuffix = error.hint ? ` Hint: ${error.hint}` : '';
      return `${index + 1}. ${relativePath}: ${error.message}${hintSuffix}`;
    })
    .join('\n');
}

function parseArgs(argv: string[]): ValidationOptions {
  const options: ValidationOptions = {
    rootDir: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--root') {
      options.rootDir = path.resolve(argv[i + 1] ?? process.cwd());
      i += 1;
    }
  }

  return options;
}

export function main(): number {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = runValidation(options);

    if (!result.ok) {
      console.error(
        `[composition] Validation failed with ${result.errors.length} issue(s).`
      );
      console.error(formatErrors(options.rootDir, result.errors));
      return 1;
    }

    console.log(
      '[composition] Validation passed. Design Composition files, README link, and orchestrator content are aligned.'
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[composition] Fatal error: ${message}`);
    return 1;
  }
}

const thisModulePath = process.argv[1]
  ? path.resolve(process.argv[1]).replace(/\\/g, '/')
  : '';
const thisModuleUrl = thisModulePath ? `file:///${thisModulePath}` : '';

if (
  import.meta.url === thisModuleUrl ||
  process.argv[1]?.endsWith('validate-composition.ts')
) {
  process.exitCode = main();
}
