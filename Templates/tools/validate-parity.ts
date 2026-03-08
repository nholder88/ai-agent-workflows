import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { AnySchema } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

type StackEntry = {
  key: string;
  spec: string;
  wiki_update?: {
    enabled?: boolean;
    contract_ref?: string;
    output_mode_default?: string;
    human_approval_default?: boolean;
  };
};

type StackCatalog = {
  frontend?: StackEntry[];
  backend?: StackEntry[];
};

type ParityMatrix = {
  required_capabilities?: Array<{ id: string }>;
  parity_gate?: {
    parity_evidence_schema?: string;
  };
  frontend_stack_mapping?: Record<string, string[]>;
  backend_stack_mapping?: Record<string, string[]>;
};

type ValidationOptions = {
  rootDir: string;
  evidencePath?: string;
};

type CiCommandContract = {
  slots?: Record<string, { required?: boolean }>;
};

type CiStackCommandMatrix = {
  stacks?: Record<string, Record<string, string>>;
};

type TemplateSpec = {
  required_capabilities?: string[];
  ci_command_contract?: {
    stack_key?: string;
    slots?: Record<string, string>;
  };
  testing_starter?: {
    unit?: {
      slot?: string;
      command?: string;
    };
    e2e?: {
      slot?: string;
      command?: string;
      mode?: string;
      semantics?: string;
    };
  };
  wiki_update?: {
    enabled?: boolean;
    contract_ref?: string;
    output_mode_default?: string;
    human_approval_default?: boolean;
  };
};

type WikiUpdateContract = {
  version?: string;
  name?: string;
  policy?: {
    scope?: {
      githubDotCom?: boolean;
      ghesAllowlist?: string[];
    };
    trigger?: string;
    failureMode?: string;
    outputMode?: string;
    humanApproval?: boolean;
  };
  classification?: {
    include?: string[];
    exclude?: string[];
  };
};

type WikiDefaults = {
  enabled: boolean;
  contractRef: string;
  outputMode: string;
  humanApproval: boolean;
};

type WorkflowTemplate = {
  inputs?: Record<string, unknown>;
  slot_tokens?: string[];
  steps?: Array<{ slot?: string }>;
  required_placeholders?: string[];
};

const REQUIRED_CI_SLOTS = [
  'install',
  'lint',
  'build',
  'unit_test',
  'e2e_test',
  'package',
  'deploy',
] as const;

const REQUIRED_WORKFLOW_FILES = [
  'Templates/shared/workflows/ci-pr.yaml',
  'Templates/shared/workflows/ci-main.yaml',
  'Templates/shared/workflows/cd-release.yaml',
  'Templates/shared/workflows/cd-deploy.yaml',
] as const;

const CI_WORKFLOW_STEP_ORDER = [
  'install',
  'lint',
  'build',
  'unit_test',
  'e2e_test',
] as const;

const WIKI_CONTRACT_RELATIVE_PATH =
  'Templates/shared/wiki-update-contract.yaml';
const REQUIRED_WIKI_INCLUDE_TAGS = [
  'user_visible_functional_change',
  'end_user_how_to',
] as const;
const REQUIRED_WIKI_EXCLUDE_TAGS = [
  'internal_refactor_only',
  'low_level_framework_details',
] as const;
const BASELINE_WIKI_DEFAULTS: WikiDefaults = {
  enabled: true,
  contractRef: WIKI_CONTRACT_RELATIVE_PATH,
  outputMode: 'pr',
  humanApproval: true,
};

/**
 * Represents a single parity validation issue with an optional remediation hint.
 */
export type ValidationError = {
  filePath: string;
  message: string;
  hint?: string;
};

/**
 * Loads and parses a YAML document from disk.
 * @param filePath Absolute or relative path to the YAML file.
 * @returns Parsed YAML payload cast to the requested type.
 * @throws Error When the file does not exist or YAML parsing fails.
 */
export function loadYaml<T>(filePath: string): T {
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  const fileContents = readFileSync(filePath, 'utf8');
  try {
    return YAML.parse(fileContents) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse YAML ${filePath}: ${message}`);
  }
}

function getKnownCapabilityIds(matrix: ParityMatrix): Set<string> {
  return new Set((matrix.required_capabilities ?? []).map((item) => item.id));
}

function getStackEntries(
  catalog: StackCatalog
): Array<{ area: 'frontend' | 'backend'; entry: StackEntry }> {
  const frontend = (catalog.frontend ?? []).map((entry) => ({
    area: 'frontend' as const,
    entry,
  }));
  const backend = (catalog.backend ?? []).map((entry) => ({
    area: 'backend' as const,
    entry,
  }));
  return [...frontend, ...backend];
}

/**
 * Validates that stack keys are aligned between stack catalog and parity matrix mappings.
 */
export function validateStackCoverage(
  catalog: StackCatalog,
  matrix: ParityMatrix,
  catalogPath: string,
  matrixPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const frontendMapping = matrix.frontend_stack_mapping ?? {};
  const backendMapping = matrix.backend_stack_mapping ?? {};

  const frontendCatalogKeys = new Set(
    (catalog.frontend ?? []).map((entry) => entry.key)
  );
  const backendCatalogKeys = new Set(
    (catalog.backend ?? []).map((entry) => entry.key)
  );

  for (const key of frontendCatalogKeys) {
    if (!(key in frontendMapping)) {
      errors.push({
        filePath: matrixPath,
        message: `Missing frontend stack mapping for '${key}'.`,
        hint: `Add '${key}' to frontend_stack_mapping in ${path.basename(matrixPath)}.`,
      });
    }
  }

  for (const key of backendCatalogKeys) {
    if (!(key in backendMapping)) {
      errors.push({
        filePath: matrixPath,
        message: `Missing backend stack mapping for '${key}'.`,
        hint: `Add '${key}' to backend_stack_mapping in ${path.basename(matrixPath)}.`,
      });
    }
  }

  for (const key of Object.keys(frontendMapping)) {
    if (!frontendCatalogKeys.has(key)) {
      errors.push({
        filePath: matrixPath,
        message: `Unknown frontend stack mapping '${key}' is not declared in stack catalog.`,
        hint: `Add '${key}' to ${path.basename(catalogPath)} frontend list or remove the mapping.`,
      });
    }
  }

  for (const key of Object.keys(backendMapping)) {
    if (!backendCatalogKeys.has(key)) {
      errors.push({
        filePath: matrixPath,
        message: `Unknown backend stack mapping '${key}' is not declared in stack catalog.`,
        hint: `Add '${key}' to ${path.basename(catalogPath)} backend list or remove the mapping.`,
      });
    }
  }

  return errors;
}

/**
 * Validates template capability declarations against matrix mappings and known capability IDs.
 */
export function validateTemplateCapabilities(
  rootDir: string,
  catalog: StackCatalog,
  matrix: ParityMatrix
): ValidationError[] {
  const errors: ValidationError[] = [];
  const knownCapabilities = getKnownCapabilityIds(matrix);

  for (const { area, entry } of getStackEntries(catalog)) {
    const mapping =
      area === 'frontend'
        ? (matrix.frontend_stack_mapping ?? {})
        : (matrix.backend_stack_mapping ?? {});
    const mappedCapabilityIds = mapping[entry.key];

    if (!Array.isArray(mappedCapabilityIds)) {
      errors.push({
        filePath: path.join(rootDir, entry.spec),
        message: `No mapped capabilities found for '${entry.key}'.`,
        hint: `Add '${entry.key}' mapping to capability-parity-matrix.yaml before validating templates.`,
      });
      continue;
    }

    const specPath = path.join(rootDir, entry.spec);
    if (!existsSync(specPath)) {
      errors.push({
        filePath: specPath,
        message: `Template spec file does not exist for stack '${entry.key}'.`,
        hint: `Fix stack-catalog spec path for '${entry.key}'.`,
      });
      continue;
    }

    const spec = loadYaml<{ required_capabilities?: string[] }>(specPath);
    if (!Array.isArray(spec.required_capabilities)) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing required_capabilities array.`,
        hint: `Add required_capabilities with parity IDs from the matrix mapping.`,
      });
      continue;
    }

    const required = spec.required_capabilities;
    const duplicates = required.filter(
      (id, index) => required.indexOf(id) !== index
    );
    if (duplicates.length > 0) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' has duplicate capability IDs: ${Array.from(new Set(duplicates)).join(', ')}.`,
        hint: 'Keep each capability ID only once in required_capabilities.',
      });
    }

    const unknownTemplateCapabilities = required.filter(
      (id) => !knownCapabilities.has(id)
    );
    if (unknownTemplateCapabilities.length > 0) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' uses unknown capability IDs: ${unknownTemplateCapabilities.join(', ')}.`,
        hint: 'Use IDs declared in required_capabilities of capability-parity-matrix.yaml.',
      });
    }

    const missing = mappedCapabilityIds.filter((id) => !required.includes(id));
    if (missing.length > 0) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing mapped capabilities: ${missing.join(', ')}.`,
        hint: 'Add the missing IDs to required_capabilities in this template spec.',
      });
    }
  }

  return errors;
}

/**
 * Validates parity evidence against schema and additional evidence integrity rules.
 */
export function validateParityEvidence(
  evidence: unknown,
  schema: unknown,
  evidencePath: string,
  schemaPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema as AnySchema);
  const isValid = validate(evidence);

  if (!isValid) {
    for (const issue of validate.errors ?? []) {
      const location = issue.instancePath || '/';
      errors.push({
        filePath: evidencePath,
        message: `Schema validation failed at '${location}': ${issue.message ?? 'unknown schema error'}.`,
        hint: `Align parity evidence structure with ${path.basename(schemaPath)}.`,
      });
    }
  }

  const evidenceDoc = evidence as {
    parity_evidence?: Array<{
      capability_id?: string;
      implementation_location?: string | string[];
      verification_method?: string;
    }>;
  };
  const entries = evidenceDoc.parity_evidence ?? [];

  if (Array.isArray(entries)) {
    const seen = new Set<string>();
    for (const [index, item] of entries.entries()) {
      const capabilityId = item.capability_id;
      if (capabilityId && seen.has(capabilityId)) {
        errors.push({
          filePath: evidencePath,
          message: `Duplicate capability_id '${capabilityId}' found in parity_evidence at index ${index}.`,
          hint: 'Keep one parity evidence entry per capability_id.',
        });
      }

      if (capabilityId) {
        seen.add(capabilityId);
      }

      if (
        typeof item.implementation_location === 'string' &&
        item.implementation_location.trim().length === 0
      ) {
        errors.push({
          filePath: evidencePath,
          message: `Empty implementation_location for capability '${capabilityId ?? 'unknown'}'.`,
          hint: 'Use a non-empty file path or a non-empty array of file paths.',
        });
      }

      if (
        Array.isArray(item.implementation_location) &&
        item.implementation_location.some(
          (location) => location.trim().length === 0
        )
      ) {
        errors.push({
          filePath: evidencePath,
          message: `implementation_location array for capability '${capabilityId ?? 'unknown'}' contains empty values.`,
          hint: 'Remove blank entries from implementation_location.',
        });
      }
    }
  }

  return errors;
}

/**
 * Validates CI command contract slots and required flags for baseline compliance.
 */
export function validateCiCommandContract(
  contract: CiCommandContract,
  contractPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const slots = contract.slots;

  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
    errors.push({
      filePath: contractPath,
      message: 'CI command contract must define a slots object.',
      hint: `Add slots for: ${REQUIRED_CI_SLOTS.join(', ')}.`,
    });
    return errors;
  }

  for (const slot of REQUIRED_CI_SLOTS) {
    if (!(slot in slots)) {
      errors.push({
        filePath: contractPath,
        message: `Missing required CI command slot '${slot}'.`,
        hint: `Add '${slot}: { required: true }' to ${path.basename(contractPath)}.`,
      });
      continue;
    }

    const slotConfig = slots[slot];
    if (
      !slotConfig ||
      typeof slotConfig !== 'object' ||
      Array.isArray(slotConfig)
    ) {
      errors.push({
        filePath: contractPath,
        message: `Slot '${slot}' must be an object definition.`,
        hint: `Use '${slot}: { required: true }' format.`,
      });
      continue;
    }

    if (slotConfig.required !== true) {
      errors.push({
        filePath: contractPath,
        message: `Slot '${slot}' must declare required: true.`,
        hint: `Set '${slot}.required' to true to match the baseline contract.`,
      });
    }
  }

  return errors;
}

/**
 * Validates that each catalog stack has command mappings for all required CI slots.
 */
export function validateCiStackCommandMatrix(
  catalog: StackCatalog,
  commandMatrix: CiStackCommandMatrix,
  requiredSlots: readonly string[],
  catalogPath: string,
  matrixPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const stacks = commandMatrix.stacks ?? {};
  const catalogStackKeys = new Set(getStackEntries(catalog).map((item) => item.entry.key));

  for (const stackKey of catalogStackKeys) {
    const mapping = stacks[stackKey];
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
      errors.push({
        filePath: matrixPath,
        message: `Missing command mapping for stack '${stackKey}'.`,
        hint: `Add '${stackKey}' under stacks in ${path.basename(matrixPath)}.`,
      });
      continue;
    }

    for (const slot of requiredSlots) {
      const command = mapping[slot];
      if (typeof command !== 'string' || command.trim().length === 0) {
        errors.push({
          filePath: matrixPath,
          message: `Stack '${stackKey}' is missing command for slot '${slot}'.`,
          hint: `Add a non-empty '${slot}' command for '${stackKey}'.`,
        });
      }
    }
  }

  for (const stackKey of Object.keys(stacks)) {
    if (!catalogStackKeys.has(stackKey)) {
      errors.push({
        filePath: matrixPath,
        message: `Unknown stack key '${stackKey}' in CI command matrix.`,
        hint: `Add '${stackKey}' to ${path.basename(catalogPath)} or remove the matrix entry.`,
      });
    }
  }

  return errors;
}

function safeLoadYaml<T>(
  filePath: string
): { value?: T; error?: ValidationError } {
  try {
    return { value: loadYaml<T>(filePath) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      error: {
        filePath,
        message,
        hint: 'Fix YAML syntax or file path before running parity validation.',
      },
    };
  }
}

/**
 * Validates reusable CI/CD workflow templates, placeholders, slot usage, and command resolution.
 */
export function validateWorkflowTemplates(
  rootDir: string,
  catalog: StackCatalog,
  commandMatrix: CiStackCommandMatrix,
  knownSlots: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const catalogStackKeys = getStackEntries(catalog).map((item) => item.entry.key);

  for (const relativePath of REQUIRED_WORKFLOW_FILES) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push({
        filePath: absolutePath,
        message: `Required workflow template file is missing: ${relativePath}.`,
        hint: `Create ${relativePath} to satisfy CI/CD template baseline.`,
      });
      continue;
    }

    const parseResult = safeLoadYaml<WorkflowTemplate>(absolutePath);
    if (parseResult.error) {
      errors.push(parseResult.error);
      continue;
    }

    const workflow = parseResult.value as WorkflowTemplate;
    const slotTokens = workflow.slot_tokens ?? [];
    const stepSlots = (workflow.steps ?? [])
      .map((step) => step.slot)
      .filter((slot): slot is string => typeof slot === 'string');

    if (!('stack_key' in (workflow.inputs ?? {}))) {
      errors.push({
        filePath: absolutePath,
        message: 'Workflow template is missing required input placeholder "stack_key".',
        hint: 'Add stack_key to inputs so commands can resolve per stack.',
      });
    }

    if (
      (relativePath.endsWith('ci-pr.yaml') ||
        relativePath.endsWith('ci-main.yaml')) &&
      !('working_directory' in (workflow.inputs ?? {}))
    ) {
      errors.push({
        filePath: absolutePath,
        message: 'CI workflow template is missing required input placeholder "working_directory".',
        hint: 'Add working_directory to CI workflow inputs.',
      });
    }

    for (const slot of slotTokens) {
      if (!knownSlots.has(slot)) {
        errors.push({
          filePath: absolutePath,
          message: `Workflow references unsupported slot token '${slot}'.`,
          hint: `Use only canonical slots: ${Array.from(knownSlots).join(', ')}.`,
        });
      }
    }

    if (
      relativePath.endsWith('ci-pr.yaml') ||
      relativePath.endsWith('ci-main.yaml')
    ) {
      if (stepSlots.join('|') !== CI_WORKFLOW_STEP_ORDER.join('|')) {
        errors.push({
          filePath: absolutePath,
          message:
            'CI workflow steps must follow install -> lint -> build -> unit_test -> e2e_test order.',
          hint: 'Update workflow steps to the canonical CI execution sequence.',
        });
      }
    }

    if (relativePath.endsWith('cd-release.yaml') && !slotTokens.includes('package')) {
      errors.push({
        filePath: absolutePath,
        message: 'CD release workflow must reference the package slot.',
        hint: 'Add package to slot_tokens and release execution steps.',
      });
    }

    if (relativePath.endsWith('cd-deploy.yaml')) {
      if (!slotTokens.includes('package') || !slotTokens.includes('deploy')) {
        errors.push({
          filePath: absolutePath,
          message: 'CD deploy workflow must reference both package and deploy slots.',
          hint: 'Include package and deploy in slot_tokens for cd-deploy.yaml.',
        });
      }

      const placeholders = new Set(workflow.required_placeholders ?? []);
      for (const placeholder of [
        'artifact_name',
        'deploy_environment',
        'secrets_namespace',
      ]) {
        if (!placeholders.has(placeholder)) {
          errors.push({
            filePath: absolutePath,
            message: `Deploy workflow is missing required placeholder '${placeholder}'.`,
            hint: 'Add the placeholder to required_placeholders and inputs.',
          });
        }
      }

      const rawContent = readFileSync(absolutePath, 'utf8');
      const looksLikeLiteralSecret =
        /(?:secret|token|password|api[_-]?key)\s*:\s*["']?(?!\{\{)(?!\$\{\{)[A-Za-z0-9_\-]{8,}/i.test(
          rawContent
        );
      if (looksLikeLiteralSecret) {
        errors.push({
          filePath: absolutePath,
          message: 'Deploy workflow appears to include a literal secret value.',
          hint: 'Use secret-name placeholders only (for example {{ secrets_namespace }}_DEPLOY_TOKEN).',
        });
      }
    }

    for (const stackKey of catalogStackKeys) {
      for (const slot of slotTokens) {
        const command = commandMatrix.stacks?.[stackKey]?.[slot];
        if (typeof command !== 'string' || command.trim().length === 0) {
          errors.push({
            filePath: absolutePath,
            message: `Command resolution failed for stack '${stackKey}' and slot '${slot}'.`,
            hint: `Add '${slot}' command mapping for '${stackKey}' in ci-stack-command-matrix.yaml.`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validates per-template testing metadata and its alignment with CI command mappings.
 */
export function validateTemplateTestingMetadata(
  rootDir: string,
  catalog: StackCatalog,
  commandMatrix: CiStackCommandMatrix
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const { area, entry } of getStackEntries(catalog)) {
    const specPath = path.join(rootDir, entry.spec);
    const parseResult = safeLoadYaml<TemplateSpec>(specPath);
    if (parseResult.error) {
      errors.push(parseResult.error);
      continue;
    }

    const spec = parseResult.value as TemplateSpec;
    const mappedCommands = commandMatrix.stacks?.[entry.key] ?? {};
    const ciContract = spec.ci_command_contract;
    const testing = spec.testing_starter;

    if (!ciContract || typeof ciContract !== 'object') {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing ci_command_contract metadata.`,
        hint: 'Add ci_command_contract with stack_key and unit/e2e slots.',
      });
      continue;
    }

    if (ciContract.stack_key !== entry.key) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' has mismatched ci_command_contract.stack_key '${ciContract.stack_key ?? 'undefined'}'.`,
        hint: `Set ci_command_contract.stack_key to '${entry.key}'.`,
      });
    }

    const contractUnit = ciContract.slots?.unit_test;
    const contractE2E = ciContract.slots?.e2e_test;
    if (typeof contractUnit !== 'string' || contractUnit.trim().length === 0) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing ci_command_contract slot 'unit_test'.`,
        hint: 'Provide a non-empty unit_test command in ci_command_contract.slots.',
      });
    }
    if (typeof contractE2E !== 'string' || contractE2E.trim().length === 0) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing ci_command_contract slot 'e2e_test'.`,
        hint: 'Provide a non-empty e2e_test command in ci_command_contract.slots.',
      });
    }

    if (!testing || typeof testing !== 'object') {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing testing_starter metadata.`,
        hint: 'Add testing_starter.unit and testing_starter.e2e sections.',
      });
      continue;
    }

    const unit = testing.unit;
    const e2e = testing.e2e;

    if (!unit || typeof unit !== 'object') {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing unit test starter metadata.`,
        hint: 'Add testing_starter.unit with slot and command.',
      });
    }

    if (!e2e || typeof e2e !== 'object') {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing E2E test starter metadata.`,
        hint: 'Add testing_starter.e2e with slot, command, and semantics.',
      });
    }

    if (unit) {
      if (unit.slot !== 'unit_test') {
        errors.push({
          filePath: specPath,
          message: `Template '${entry.key}' unit test slot must be 'unit_test'.`,
          hint: 'Set testing_starter.unit.slot to unit_test.',
        });
      }

      const expected = mappedCommands.unit_test;
      if (unit.command !== expected) {
        errors.push({
          filePath: specPath,
          message: `Template '${entry.key}' unit test command does not match matrix command.`,
          hint: `Expected '${expected}' from ci-stack-command-matrix.yaml.`,
        });
      }

      if (contractUnit !== expected) {
        errors.push({
          filePath: specPath,
          message: `Template '${entry.key}' ci_command_contract unit_test command does not match matrix command.`,
          hint: `Expected '${expected}' from ci-stack-command-matrix.yaml.`,
        });
      }
    }

    if (e2e) {
      if (e2e.slot !== 'e2e_test') {
        errors.push({
          filePath: specPath,
          message: `Template '${entry.key}' E2E slot must be 'e2e_test'.`,
          hint: 'Set testing_starter.e2e.slot to e2e_test.',
        });
      }

      const expected = mappedCommands.e2e_test;
      if (e2e.command !== expected) {
        errors.push({
          filePath: specPath,
          message: `Template '${entry.key}' E2E command does not match matrix command.`,
          hint: `Expected '${expected}' from ci-stack-command-matrix.yaml.`,
        });
      }

      if (contractE2E !== expected) {
        errors.push({
          filePath: specPath,
          message: `Template '${entry.key}' ci_command_contract e2e_test command does not match matrix command.`,
          hint: `Expected '${expected}' from ci-stack-command-matrix.yaml.`,
        });
      }

      if (area === 'frontend' && e2e.mode !== 'browser') {
        errors.push({
          filePath: specPath,
          message: `Frontend template '${entry.key}' must define browser E2E mode.`,
          hint: 'Set testing_starter.e2e.mode to browser.',
        });
      }

      if (area === 'backend') {
        if (e2e.mode === 'browser') {
          errors.push({
            filePath: specPath,
            message: `Backend template '${entry.key}' cannot define browser-only E2E mode.`,
            hint: 'Use API smoke/integration semantics for backend E2E.',
          });
        }

        const semantics = e2e.semantics ?? '';
        if (!/(api|smoke|integration)/i.test(semantics)) {
          errors.push({
            filePath: specPath,
            message: `Backend template '${entry.key}' E2E semantics must mention API smoke/integration behavior.`,
            hint: 'Document API smoke/integration semantics in testing_starter.e2e.semantics.',
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validates shared wiki update policy contract existence, shape, and required defaults.
 */
export function validateWikiUpdateContract(
  rootDir: string,
  contractRelativePath: string
): {
  errors: ValidationError[];
  defaults: WikiDefaults;
} {
  const defaults: WikiDefaults = {
    ...BASELINE_WIKI_DEFAULTS,
    contractRef: contractRelativePath,
  };
  const contractPath = path.join(rootDir, contractRelativePath);
  const parseResult = safeLoadYaml<WikiUpdateContract>(contractPath);

  if (parseResult.error) {
    return {
      errors: [
        {
          filePath: contractPath,
          message: `Wiki update policy contract is missing or malformed at '${contractRelativePath}'.`,
          hint: `Create a valid YAML file with top-level keys version, name, policy, and classification at ${contractRelativePath}.`,
        },
      ],
      defaults,
    };
  }

  const contract = parseResult.value as WikiUpdateContract;
  const errors: ValidationError[] = [];

  if (!contract || typeof contract !== 'object') {
    errors.push({
      filePath: contractPath,
      message: 'Wiki contract must be a YAML object.',
      hint: 'Define the contract as a top-level object with version, name, policy, and classification.',
    });
    return { errors, defaults };
  }

  for (const key of ['version', 'name', 'policy', 'classification'] as const) {
    if (!(key in contract)) {
      errors.push({
        filePath: contractPath,
        message: `Wiki contract is missing required key '${key}'.`,
        hint: `Add '${key}' to ${path.basename(contractPath)}.`,
      });
    }
  }

  if (contract.name !== 'wiki-update-contract') {
    errors.push({
      filePath: contractPath,
      message: "Wiki contract 'name' must be 'wiki-update-contract'.",
      hint: "Set name: wiki-update-contract.",
    });
  }

  const policy = contract.policy;
  if (!policy || typeof policy !== 'object') {
    errors.push({
      filePath: contractPath,
      message: "Wiki contract must define a 'policy' object.",
      hint: 'Add policy with scope, trigger, failureMode, outputMode, and humanApproval.',
    });
  } else {
    const scope = policy.scope;
    if (!scope || typeof scope !== 'object') {
      errors.push({
        filePath: contractPath,
        message: "Wiki contract policy must define a 'scope' object.",
        hint: 'Add policy.scope.githubDotCom and policy.scope.ghesAllowlist.',
      });
    } else {
      if (scope.githubDotCom !== true) {
        errors.push({
          filePath: contractPath,
          message:
            "Wiki contract policy.scope.githubDotCom must be true for the baseline.",
          hint: 'Set policy.scope.githubDotCom to true.',
        });
      }
      if (!Array.isArray(scope.ghesAllowlist)) {
        errors.push({
          filePath: contractPath,
          message:
            'Wiki contract policy.scope.ghesAllowlist must be an array (can be empty).',
          hint: 'Set policy.scope.ghesAllowlist to an array of GHES hostnames.',
        });
      }
    }

    if (policy.trigger !== 'stage7_pass') {
      errors.push({
        filePath: contractPath,
        message: "Wiki contract policy.trigger must be 'stage7_pass'.",
        hint: 'Set policy.trigger to stage7_pass.',
      });
    }

    if (policy.failureMode !== 'non_blocking_warning_audit') {
      errors.push({
        filePath: contractPath,
        message:
          "Wiki contract policy.failureMode must be 'non_blocking_warning_audit'.",
        hint: 'Set policy.failureMode to non_blocking_warning_audit.',
      });
    }

    if (policy.outputMode !== 'pr') {
      errors.push({
        filePath: contractPath,
        message: "Wiki contract policy.outputMode must be 'pr'.",
        hint: 'Set policy.outputMode to pr.',
      });
    }

    if (policy.humanApproval !== true) {
      errors.push({
        filePath: contractPath,
        message: 'Wiki contract policy.humanApproval must be true.',
        hint: 'Set policy.humanApproval to true.',
      });
    }

    defaults.outputMode =
      typeof policy.outputMode === 'string' ? policy.outputMode : defaults.outputMode;
    defaults.humanApproval =
      typeof policy.humanApproval === 'boolean'
        ? policy.humanApproval
        : defaults.humanApproval;
  }

  const classification = contract.classification;
  if (!classification || typeof classification !== 'object') {
    errors.push({
      filePath: contractPath,
      message: "Wiki contract must define a 'classification' object.",
      hint: 'Add classification.include and classification.exclude arrays.',
    });
  } else {
    const include = classification.include;
    const exclude = classification.exclude;
    if (!Array.isArray(include)) {
      errors.push({
        filePath: contractPath,
        message: 'Wiki contract classification.include must be an array.',
        hint: `Include required tags: ${REQUIRED_WIKI_INCLUDE_TAGS.join(', ')}.`,
      });
    }
    if (!Array.isArray(exclude)) {
      errors.push({
        filePath: contractPath,
        message: 'Wiki contract classification.exclude must be an array.',
        hint: `Include required tags: ${REQUIRED_WIKI_EXCLUDE_TAGS.join(', ')}.`,
      });
    }

    if (Array.isArray(include)) {
      for (const tag of REQUIRED_WIKI_INCLUDE_TAGS) {
        if (!include.includes(tag)) {
          errors.push({
            filePath: contractPath,
            message: `Wiki contract classification.include is missing '${tag}'.`,
            hint: `Add '${tag}' to classification.include.`,
          });
        }
      }
    }

    if (Array.isArray(exclude)) {
      for (const tag of REQUIRED_WIKI_EXCLUDE_TAGS) {
        if (!exclude.includes(tag)) {
          errors.push({
            filePath: contractPath,
            message: `Wiki contract classification.exclude is missing '${tag}'.`,
            hint: `Add '${tag}' to classification.exclude.`,
          });
        }
      }
    }
  }

  return { errors, defaults };
}

/**
 * Validates wiki_update metadata in stack catalog entries and per-stack template specs.
 */
export function validateTemplateWikiUpdateMetadata(
  rootDir: string,
  catalog: StackCatalog,
  expectedDefaults: WikiDefaults,
  catalogPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const { entry } of getStackEntries(catalog)) {
    const expectedContractRef = expectedDefaults.contractRef;
    const expectedOutputMode = expectedDefaults.outputMode;
    const expectedApproval = expectedDefaults.humanApproval;

    const catalogWiki = entry.wiki_update;
    if (!catalogWiki || typeof catalogWiki !== 'object') {
      errors.push({
        filePath: catalogPath,
        message: `Stack '${entry.key}' is missing wiki_update metadata in stack-catalog.yaml.`,
        hint: `Add wiki_update.enabled, contract_ref, output_mode_default, and human_approval_default for '${entry.key}'.`,
      });
    } else {
      if (catalogWiki.enabled !== expectedDefaults.enabled) {
        errors.push({
          filePath: catalogPath,
          message: `Stack '${entry.key}' has wiki_update.enabled='${String(catalogWiki.enabled)}' but expected '${String(expectedDefaults.enabled)}'.`,
          hint: `Set stack-catalog wiki_update.enabled for '${entry.key}' to ${String(expectedDefaults.enabled)}.`,
        });
      }
      if (catalogWiki.contract_ref !== expectedContractRef) {
        errors.push({
          filePath: catalogPath,
          message: `Stack '${entry.key}' has wiki_update.contract_ref='${catalogWiki.contract_ref ?? 'undefined'}' but expected '${expectedContractRef}'.`,
          hint: `Set stack-catalog wiki_update.contract_ref for '${entry.key}' to '${expectedContractRef}'.`,
        });
      }
      if (catalogWiki.output_mode_default !== expectedOutputMode) {
        errors.push({
          filePath: catalogPath,
          message: `Stack '${entry.key}' has wiki_update.output_mode_default='${catalogWiki.output_mode_default ?? 'undefined'}' but expected '${expectedOutputMode}'.`,
          hint: `Set stack-catalog wiki_update.output_mode_default for '${entry.key}' to '${expectedOutputMode}'.`,
        });
      }
      if (catalogWiki.human_approval_default !== expectedApproval) {
        errors.push({
          filePath: catalogPath,
          message: `Stack '${entry.key}' has wiki_update.human_approval_default='${String(catalogWiki.human_approval_default)}' but expected '${String(expectedApproval)}'.`,
          hint: `Set stack-catalog wiki_update.human_approval_default for '${entry.key}' to ${String(expectedApproval)}.`,
        });
      }
    }

    const specPath = path.join(rootDir, entry.spec);
    const parseResult = safeLoadYaml<TemplateSpec>(specPath);
    if (parseResult.error) {
      errors.push(parseResult.error);
      continue;
    }

    const spec = parseResult.value as TemplateSpec;
    const wiki = spec.wiki_update;
    if (!wiki || typeof wiki !== 'object') {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' is missing wiki_update metadata.`,
        hint: 'Add wiki_update.enabled, wiki_update.contract_ref, wiki_update.output_mode_default, and wiki_update.human_approval_default.',
      });
      continue;
    }

    if (wiki.enabled !== expectedDefaults.enabled) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' has wiki_update.enabled='${String(wiki.enabled)}' but expected '${String(expectedDefaults.enabled)}'.`,
        hint: `Set wiki_update.enabled to ${String(expectedDefaults.enabled)}.`,
      });
    }

    if (wiki.contract_ref !== expectedContractRef) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' has wiki_update.contract_ref='${wiki.contract_ref ?? 'undefined'}' but expected '${expectedContractRef}'.`,
        hint: `Set wiki_update.contract_ref to '${expectedContractRef}'.`,
      });
    }

    if (wiki.output_mode_default !== expectedOutputMode) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' has wiki_update.output_mode_default='${wiki.output_mode_default ?? 'undefined'}' but expected '${expectedOutputMode}'.`,
        hint: `Set wiki_update.output_mode_default to '${expectedOutputMode}'.`,
      });
    }

    if (wiki.human_approval_default !== expectedApproval) {
      errors.push({
        filePath: specPath,
        message: `Template '${entry.key}' has wiki_update.human_approval_default='${String(wiki.human_approval_default)}' but expected '${String(expectedApproval)}'.`,
        hint: `Set wiki_update.human_approval_default to ${String(expectedApproval)}.`,
      });
    }
  }

  return errors;
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
      continue;
    }

    if (token === '--evidence') {
      options.evidencePath = path.resolve(options.rootDir, argv[i + 1] ?? '');
      i += 1;
    }
  }

  return options;
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

/**
 * Runs the full parity validation suite for templates, workflows, and evidence.
 */
export function runValidation(options: ValidationOptions): {
  ok: boolean;
  errors: ValidationError[];
} {
  const rootDir = options.rootDir;
  const matrixPath = path.join(
    rootDir,
    'Templates/shared/capability-parity-matrix.yaml'
  );
  const catalogPath = path.join(rootDir, 'Templates/shared/stack-catalog.yaml');

  const matrix = loadYaml<ParityMatrix>(matrixPath);
  const catalog = loadYaml<StackCatalog>(catalogPath);
  const wikiContractValidation = validateWikiUpdateContract(
    rootDir,
    WIKI_CONTRACT_RELATIVE_PATH
  );

  const ciContractPath = path.join(rootDir, 'Templates/shared/ci-command-contract.yaml');
  const ciMatrixPath = path.join(
    rootDir,
    'Templates/shared/ci-stack-command-matrix.yaml'
  );

  const ciContract = loadYaml<CiCommandContract>(ciContractPath);
  const ciCommandMatrix = loadYaml<CiStackCommandMatrix>(ciMatrixPath);

  const schemaRelativePath = matrix.parity_gate?.parity_evidence_schema;
  const schemaPath = schemaRelativePath
    ? path.join(rootDir, schemaRelativePath)
    : path.join(rootDir, 'Templates/shared/parity-evidence-schema.yaml');

  const evidencePath = options.evidencePath
    ? path.resolve(options.evidencePath)
    : path.join(rootDir, 'Templates/shared/capability-evidence.example.yaml');

  const errors: ValidationError[] = [];

  errors.push(...validateCiCommandContract(ciContract, ciContractPath));
  errors.push(...wikiContractValidation.errors);
  errors.push(
    ...validateTemplateWikiUpdateMetadata(
      rootDir,
      catalog,
      wikiContractValidation.defaults,
      catalogPath
    )
  );
  errors.push(
    ...validateCiStackCommandMatrix(
      catalog,
      ciCommandMatrix,
      REQUIRED_CI_SLOTS,
      catalogPath,
      ciMatrixPath
    )
  );
  errors.push(
    ...validateWorkflowTemplates(
      rootDir,
      catalog,
      ciCommandMatrix,
      new Set(REQUIRED_CI_SLOTS)
    )
  );
  errors.push(...validateTemplateTestingMetadata(rootDir, catalog, ciCommandMatrix));

  errors.push(
    ...validateStackCoverage(catalog, matrix, catalogPath, matrixPath)
  );
  errors.push(...validateTemplateCapabilities(rootDir, catalog, matrix));

  const schema = loadYaml<unknown>(schemaPath);
  const evidence = loadYaml<unknown>(evidencePath);
  errors.push(
    ...validateParityEvidence(evidence, schema, evidencePath, schemaPath)
  );

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * CLI entry point for parity validation.
 * @returns Process exit code compatible status (0 for pass, 1 for failure).
 */
export function main(): number {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = runValidation(options);

    if (!result.ok) {
      console.error(
        `[parity] Validation failed with ${result.errors.length} issue(s).`
      );
      console.error(formatErrors(options.rootDir, result.errors));
      return 1;
    }

    console.log(
      '[parity] Validation passed. Stack mappings, wiki metadata, template capabilities, and parity evidence are aligned.'
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[parity] Fatal error: ${message}`);
    return 1;
  }
}

const thisModulePath = process.argv[1]
  ? path.resolve(process.argv[1]).replace(/\\/g, '/')
  : '';
const thisModuleUrl = thisModulePath ? `file:///${thisModulePath}` : '';

if (
  import.meta.url === thisModuleUrl ||
  process.argv[1]?.endsWith('validate-parity.ts')
) {
  process.exitCode = main();
}
