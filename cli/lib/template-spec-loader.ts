/**
 * Template specification loader for loading and parsing template-spec.yaml files.
 */
import * as fs from 'node:fs';
import YAML from 'yaml';

export interface FrameworkConfig {
  name: string;
  rendering?: string;
  language: string;
  data_access?: string;
}

export interface StateManagementConfig {
  server_state: string;
  client_state: string;
  form_state: string;
  guidance?: string[];
}

export interface StylingConfig {
  framework: string;
  config: string;
  guidance?: string[];
}

export interface LoggingConfig {
  client?: string;
  logger?: string;
  guidance?: string[];
}

export interface RequiredConventions {
  state_management?: string;
  styling?: string;
  testing?: string;
  logging?: string;
}

export interface CiCommandContract {
  stack_key: string;
  slots: Record<string, string>;
}

export interface TestingConfig {
  slot: string;
  command: string;
  framework?: string;
  mode?: string;
  semantics?: string;
  sample_target?: string;
}

export interface TestingStarter {
  unit?: TestingConfig;
  e2e?: TestingConfig;
}

export interface TemplateSpec {
  version: string;
  template: string;
  purpose: string;
  framework: FrameworkConfig;
  state_management?: StateManagementConfig;
  styling?: StylingConfig;
  logging?: LoggingConfig;
  required_conventions?: RequiredConventions;
  skill_families?: string[];
  implementation_guidance?: Record<string, string>;
  required_capabilities: string[];
  required_routes?: string[];
  required_integrations?: string[];
  ci_command_contract: CiCommandContract;
  testing_starter: TestingStarter;
  wiki_update?: {
    enabled: boolean;
    contract_ref: string;
    output_mode_default: string;
    human_approval_default: boolean;
  };
}

export function loadTemplateSpec(specPath: string): TemplateSpec {
  if (!fs.existsSync(specPath)) {
    throw new Error(`Template spec not found: ${specPath}`);
  }

  const raw = fs.readFileSync(specPath, 'utf8');
  const parsed = YAML.parse(raw) as any;

  if (!parsed.version || !parsed.template) {
    throw new Error(`Invalid template spec at ${specPath}: missing required fields (version, template)`);
  }

  if (parsed.stack && !parsed.framework) {
    parsed.framework = {
      name: parsed.stack.preferred_framework || parsed.stack.framework || 'Unknown',
      language: parsed.stack.language || 'Unknown',
    };
  }

  if (!parsed.framework) {
    throw new Error(`Invalid template spec at ${specPath}: missing framework or stack configuration`);
  }

  if (!parsed.required_capabilities || !Array.isArray(parsed.required_capabilities)) {
    throw new Error(`Invalid template spec at ${specPath}: required_capabilities must be an array`);
  }

  if (!parsed.ci_command_contract || !parsed.ci_command_contract.stack_key) {
    throw new Error(`Invalid template spec at ${specPath}: missing ci_command_contract.stack_key`);
  }

  return parsed as TemplateSpec;
}

export function loadPlatformContracts(contractsPath: string): Record<string, unknown> {
  if (!fs.existsSync(contractsPath)) {
    throw new Error(`Platform contracts not found: ${contractsPath}`);
  }

  const raw = fs.readFileSync(contractsPath, 'utf8');
  const parsed = YAML.parse(raw) as Record<string, unknown>;

  if (!parsed.version || !parsed.name) {
    throw new Error(`Invalid platform contracts at ${contractsPath}: missing required fields (version, name)`);
  }

  return parsed;
}
