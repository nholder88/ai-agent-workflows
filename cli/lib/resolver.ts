/**
 * Archetype and stack resolver - maps user choices to concrete template specifications.
 */
import * as path from 'node:path';
import { loadStackCatalog, findFrontendStack, findBackendStack, type StackCatalog, type StackDefinition } from './create-project-catalog.js';
import { loadTemplateSpec, loadPlatformContracts, type TemplateSpec } from './template-spec-loader.js';
import type { CreateContext } from '../create-project.js';
import { logger } from './logger.js';

export interface ResolvedStack {
  stackDef: StackDefinition;
  spec: TemplateSpec;
  templateDir: string;
}

export interface ResolvedContext {
  frontend?: ResolvedStack;
  backend?: ResolvedStack;
  contracts: Record<string, unknown>;
  contractsVersion: string;
  createContext: CreateContext;
}

export function resolveArchetype(ctx: CreateContext): ResolvedContext {
  logger.info('resolution_start', {
    archetype: ctx.archetype,
    frontendStack: ctx.frontendStack,
    backendStack: ctx.backendStack,
  });

  const catalogPath = path.join(ctx.repoRoot, 'templates', 'shared', 'stack-catalog.yaml');
  const contractsPath = path.join(ctx.repoRoot, 'templates', 'shared', 'platform-contracts.yaml');

  const catalog = loadStackCatalog(catalogPath);
  const contracts = loadPlatformContracts(contractsPath);

  const resolved: ResolvedContext = {
    contracts,
    contractsVersion: (contracts.version as string) || '1.0.0',
    createContext: ctx,
  };

  if (ctx.frontendStack) {
    const stackDef = findFrontendStack(catalog, ctx.frontendStack);
    if (!stackDef) {
      throw new Error(`Frontend stack "${ctx.frontendStack}" not found in catalog`);
    }

    const specPath = path.join(ctx.repoRoot, stackDef.spec);
    const spec = loadTemplateSpec(specPath);

    const templateDir = path.dirname(specPath);

    resolved.frontend = {
      stackDef,
      spec,
      templateDir,
    };

    logger.info('resolved_frontend', {
      stack: ctx.frontendStack,
      framework: spec.framework.name,
      capabilities: spec.required_capabilities.length,
    });
  }

  if (ctx.backendStack) {
    const stackDef = findBackendStack(catalog, ctx.backendStack);
    if (!stackDef) {
      throw new Error(`Backend stack "${ctx.backendStack}" not found in catalog`);
    }

    const specPath = path.join(ctx.repoRoot, stackDef.spec);
    const spec = loadTemplateSpec(specPath);

    const templateDir = path.dirname(specPath);

    resolved.backend = {
      stackDef,
      spec,
      templateDir,
    };

    logger.info('resolved_backend', {
      stack: ctx.backendStack,
      framework: spec.framework.name,
      capabilities: spec.required_capabilities.length,
    });
  }

  if (!resolved.frontend && !resolved.backend) {
    throw new Error('No stacks resolved - at least one of frontend or backend is required');
  }

  logger.info('resolution_complete', {
    hasFrontend: !!resolved.frontend,
    hasBackend: !!resolved.backend,
    contractsVersion: resolved.contractsVersion,
  });

  return resolved;
}
