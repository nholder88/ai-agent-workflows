/**
 * Template renderer for variable substitution in template files.
 */
import type { ResolvedContext } from './resolver.js';
import { logger } from './logger.js';

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

  logger.info('template_variables_built', {
    projectName: variables.projectName,
    framework: variables.framework,
    stackKey: variables.stackKey,
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

/**
 * Generate a minimal package.json for a frontend project.
 */
export function generatePackageJson(variables: TemplateVariables): string {
  const pkg = {
    name: variables.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: variables.stackKey === 'nextjs' ? 'next dev' : 'vite dev',
      build: variables.stackKey === 'nextjs' ? 'next build' : 'vite build',
      start: variables.stackKey === 'nextjs' ? 'next start' : 'vite preview',
      'test:unit': variables.unitTestCommand || 'vitest',
      'test:e2e': variables.e2eTestCommand || 'playwright test',
    },
    dependencies: {
      'react': '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      'typescript': '^5.0.0',
    },
  };

  if (variables.stackKey === 'nextjs') {
    pkg.dependencies = {
      ...pkg.dependencies,
      'next': '^14.0.0',
    };
  }

  return JSON.stringify(pkg, null, 2);
}

/**
 * Generate a minimal tsconfig.json.
 */
export function generateTsConfig(variables: TemplateVariables): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      jsx: 'preserve',
      module: 'ESNext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowJs: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      incremental: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*', 'tests/**/*'],
    exclude: ['node_modules'],
  };

  return JSON.stringify(config, null, 2);
}
