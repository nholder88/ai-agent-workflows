import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadStackCatalog,
  getArchetypes,
  getPresets,
  getDefaultStacks,
  findArchetype,
  findFrontendStack,
  findBackendStack,
  getAvailablePresets,
  getFrontendStackKeys,
  getBackendStackKeys,
} from './create-project-catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const catalogPath = path.join(repoRoot, 'templates', 'shared', 'stack-catalog.yaml');

describe('create-project-catalog', () => {
  it('loads stack catalog from YAML', () => {
    const catalog = loadStackCatalog(catalogPath);
    assert.ok(catalog.frontend);
    assert.ok(catalog.backend);
    assert.ok(Array.isArray(catalog.frontend));
    assert.ok(Array.isArray(catalog.backend));
    assert.ok(catalog.frontend.length > 0);
    assert.ok(catalog.backend.length > 0);
  });

  it('returns valid archetypes', () => {
    const archetypes = getArchetypes();
    assert.ok(archetypes.length > 0);
    assert.ok(archetypes.find((a) => a.value === 'frontend'));
    assert.ok(archetypes.find((a) => a.value === 'backend'));
    assert.ok(archetypes.find((a) => a.value === 'fullstack'));
    assert.ok(archetypes.find((a) => a.value === 'lib'));
    assert.ok(archetypes.find((a) => a.value === 'cli'));
  });

  it('returns valid presets', () => {
    const presets = getPresets();
    assert.ok(presets.length > 0);
    assert.ok(presets.find((p) => p.value === 'nigel-react'));
  });

  it('returns default stacks', () => {
    const defaults = getDefaultStacks();
    assert.strictEqual(defaults.frontend.frontend, 'nextjs');
    assert.strictEqual(defaults.backend.backend, 'node_nestjs');
    assert.strictEqual(defaults.fullstack.frontend, 'nextjs');
    assert.strictEqual(defaults.fullstack.backend, 'node_nestjs');
  });

  it('finds archetype by value', () => {
    const archetype = findArchetype('frontend');
    assert.ok(archetype);
    assert.strictEqual(archetype.value, 'frontend');
    assert.strictEqual(archetype.category, 'frontend');
  });

  it('finds frontend stack from catalog', () => {
    const catalog = loadStackCatalog(catalogPath);
    const stack = findFrontendStack(catalog, 'nextjs');
    assert.ok(stack);
    assert.strictEqual(stack.key, 'nextjs');
    assert.strictEqual(stack.framework, 'Next.js');
  });

  it('finds backend stack from catalog', () => {
    const catalog = loadStackCatalog(catalogPath);
    const stack = findBackendStack(catalog, 'node_nestjs');
    assert.ok(stack);
    assert.strictEqual(stack.key, 'node_nestjs');
    assert.strictEqual(stack.framework, 'NestJS');
  });

  it('returns available presets for stack', () => {
    const presets = getAvailablePresets('nextjs');
    assert.ok(presets.length > 0);
    assert.ok(presets.find((p) => p.value === 'nigel-react'));
  });

  it('returns empty presets for non-applicable stack', () => {
    const presets = getAvailablePresets('node_nestjs');
    assert.strictEqual(presets.length, 0);
  });

  it('returns frontend stack keys', () => {
    const catalog = loadStackCatalog(catalogPath);
    const keys = getFrontendStackKeys(catalog);
    assert.ok(keys.includes('nextjs'));
    assert.ok(keys.includes('sveltekit'));
    assert.ok(keys.includes('angular'));
  });

  it('returns backend stack keys', () => {
    const catalog = loadStackCatalog(catalogPath);
    const keys = getBackendStackKeys(catalog);
    assert.ok(keys.includes('node_nestjs'));
    assert.ok(keys.includes('python'));
    assert.ok(keys.includes('go'));
  });

  it('catalog includes required fields for each stack', () => {
    const catalog = loadStackCatalog(catalogPath);
    for (const stack of catalog.frontend) {
      assert.ok(stack.key, `Frontend stack missing key: ${JSON.stringify(stack)}`);
      assert.ok(stack.framework, `Frontend stack missing framework: ${stack.key}`);
      assert.ok(stack.spec, `Frontend stack missing spec: ${stack.key}`);
    }
    for (const stack of catalog.backend) {
      assert.ok(stack.key, `Backend stack missing key: ${JSON.stringify(stack)}`);
      assert.ok(stack.framework, `Backend stack missing framework: ${stack.key}`);
      assert.ok(stack.spec, `Backend stack missing spec: ${stack.key}`);
    }
  });
});
