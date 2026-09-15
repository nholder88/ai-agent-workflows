/**
 * Domain models and catalog for create-project scaffolding.
 * Loads stack definitions from templates/shared/stack-catalog.yaml.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

export interface ArchetypeDefinition {
  readonly value: string;
  readonly name: string;
  readonly category: 'frontend' | 'backend' | 'both' | 'library' | 'cli';
  readonly requiresFrontendStack?: boolean;
  readonly requiresBackendStack?: boolean;
}

export interface StackDefinition {
  readonly key: string;
  readonly framework: string;
  readonly spec: string;
  readonly env?: string;
  readonly state_management?: string;
}

export interface PresetDefinition {
  readonly value: string;
  readonly name: string;
  readonly appliesTo: readonly string[];
}

export interface StackCatalog {
  version: string;
  name: string;
  frontend: StackDefinition[];
  backend: StackDefinition[];
}

const ARCHETYPES: readonly ArchetypeDefinition[] = [
  { value: 'frontend', name: 'Frontend — Browser-based UI application', category: 'frontend', requiresFrontendStack: true },
  { value: 'backend', name: 'Backend — API service or backend application', category: 'backend', requiresBackendStack: true },
  { value: 'fullstack', name: 'Fullstack — Combined frontend + backend application', category: 'both', requiresFrontendStack: true, requiresBackendStack: true },
  { value: 'lib', name: 'Library — Reusable package or module', category: 'library' },
  { value: 'cli', name: 'CLI — Command-line tool or utility', category: 'cli' },
] as const;

const PRESETS: readonly PresetDefinition[] = [
  { value: 'nigel-react', name: 'Nigel React — Zustand + TanStack Query + Tailwind + Vitest', appliesTo: ['nextjs', 'sveltekit'] },
] as const;

const DEFAULT_STACKS: Readonly<Record<string, { frontend?: string; backend?: string }>> = {
  frontend: { frontend: 'nextjs' },
  backend: { backend: 'node_nestjs' },
  fullstack: { frontend: 'nextjs', backend: 'node_nestjs' },
  lib: {},
  cli: {},
} as const;

export function loadStackCatalog(catalogPath: string): StackCatalog {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const parsed = YAML.parse(raw) as StackCatalog;
  
  if (!parsed.frontend || !parsed.backend) {
    throw new Error(`Invalid stack catalog: missing frontend or backend stacks at ${catalogPath}`);
  }
  
  return parsed;
}

export function getArchetypes(): readonly ArchetypeDefinition[] {
  return ARCHETYPES;
}

export function getPresets(): readonly PresetDefinition[] {
  return PRESETS;
}

export function getDefaultStacks(): Readonly<Record<string, { frontend?: string; backend?: string }>> {
  return DEFAULT_STACKS;
}

export function findArchetype(value: string): ArchetypeDefinition | undefined {
  return ARCHETYPES.find((a) => a.value === value);
}

export function findPreset(value: string): PresetDefinition | undefined {
  return PRESETS.find((p) => p.value === value);
}

export function findFrontendStack(catalog: StackCatalog, key: string): StackDefinition | undefined {
  return catalog.frontend.find((s) => s.key === key);
}

export function findBackendStack(catalog: StackCatalog, key: string): StackDefinition | undefined {
  return catalog.backend.find((s) => s.key === key);
}

export function getAvailablePresets(stackKey: string): PresetDefinition[] {
  return PRESETS.filter((p) => p.appliesTo.includes(stackKey));
}

export function getFrontendStackKeys(catalog: StackCatalog): string[] {
  return catalog.frontend.map((s) => s.key);
}

export function getBackendStackKeys(catalog: StackCatalog): string[] {
  return catalog.backend.map((s) => s.key);
}

export function formatFrontendStackChoices(catalog: StackCatalog): Array<{ value: string; name: string }> {
  return catalog.frontend.map((s) => ({
    value: s.key,
    name: `${s.framework} — ${s.state_management || 'Backend framework'}`,
  }));
}

export function formatBackendStackChoices(catalog: StackCatalog): Array<{ value: string; name: string }> {
  return catalog.backend.map((s) => ({
    value: s.key,
    name: s.framework,
  }));
}
