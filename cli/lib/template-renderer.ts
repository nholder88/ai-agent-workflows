/**
 * Template renderer for variable substitution in template files.
 */
import type { ResolvedContext } from './resolver.js';
import type { CreateContext } from '../create-project.js';
import { logger } from './logger.js';

/**
 * Builds preset override information based on preset name and stack.
 */
function buildPresetOverride(presetName: string, stackKey: string): PresetOverride {
  if (presetName === 'nigel-react') {
    const override: PresetOverride = {
      name: 'Nigel React',
      serverState: 'TanStack Query',
      styling: 'Tailwind CSS',
      unitTesting: 'Vitest',
      e2eTesting: 'Playwright',
    };

    if (stackKey === 'nextjs') {
      override.clientState = 'Zustand';
    } else if (stackKey === 'sveltekit') {
      override.clientState = 'Svelte Stores + TanStack Query';
    }

    return override;
  }

  return { name: presetName };
}

export interface PresetOverride {
  name: string;
  serverState?: string;
  clientState?: string;
  styling?: string;
  unitTesting?: string;
  e2eTesting?: string;
}

export interface TemplateVariables {
  projectName: string;
  stackKey: string;
  framework: string;
  language: string;
  stateManagement?: {
    serverState: string;
    clientState: string;
    formState: string;
  };
  preset?: PresetOverride;
  requiredCapabilities: string[];
  requiredRoutes: string[];
  requiredIntegrations: string[];
  timestamp: string;
  contractsVersion: string;
  templateVersion: string;
  unitTestCommand?: string;
  e2eTestCommand?: string;
  unitTestFramework?: string;
  e2eTestFramework?: string;
  createContext: CreateContext;
}

export function buildTemplateVariables(resolved: ResolvedContext): TemplateVariables {
  const ctx = resolved.createContext;
  const primaryStack = resolved.frontend || resolved.backend;

  if (!primaryStack) {
    throw new Error('No primary stack resolved');
  }

  const spec = primaryStack.spec;
  const stackKey = primaryStack.stackDef.key;

  const variables: TemplateVariables = {
    projectName: ctx.projectName,
    stackKey,
    framework: spec.framework.name,
    language: spec.framework.language,
    requiredCapabilities: spec.required_capabilities || [],
    requiredRoutes: spec.required_routes || [],
    requiredIntegrations: spec.required_integrations || [],
    timestamp: new Date().toISOString(),
    contractsVersion: resolved.contractsVersion,
    templateVersion: spec.version,
    createContext: resolved.createContext,
  };

  if (spec.state_management) {
    variables.stateManagement = {
      serverState: spec.state_management.server_state,
      clientState: spec.state_management.client_state,
      formState: spec.state_management.form_state,
    };
  }

  if (spec.testing_starter?.unit) {
    variables.unitTestCommand = spec.testing_starter.unit.command;
    variables.unitTestFramework = spec.testing_starter.unit.framework;
  }

  if (spec.testing_starter?.e2e) {
    variables.e2eTestCommand = spec.testing_starter.e2e.command;
    variables.e2eTestFramework = spec.testing_starter.e2e.framework;
  }

  if (ctx.preset) {
    variables.preset = buildPresetOverride(ctx.preset, stackKey);
  }

  logger.info('template_variables_built', {
    projectName: variables.projectName,
    framework: variables.framework,
    stackKey: variables.stackKey,
    preset: ctx.preset,
  });

  return variables;
}

/**
 * Simple template renderer using Mustache-style syntax.
 * Supports:
 * - {{variable}} - simple substitution
 * - {{#if variable}}...{{/if}} - conditionals
 * - {{#each array}}{{this}}{{/each}} - loops
 */
export function renderTemplate(content: string, variables: TemplateVariables): string {
  let result = content;

  result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
    const value = resolveVariable(key, variables);
    return value !== undefined ? String(value) : match;
  });

  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, body) => {
    const value = resolveVariable(key, variables);
    return value ? body : '';
  });

  result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, itemTemplate) => {
    const array = resolveVariable(key, variables);
    if (!Array.isArray(array)) {
      return '';
    }
    return array.map((item) => {
      return itemTemplate.replace(/\{\{this\}\}/g, String(item));
    }).join('');
  });

  return result;
}

function resolveVariable(key: string, variables: TemplateVariables): unknown {
  const parts = key.split('.');
  let value: unknown = variables;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}
