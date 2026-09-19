import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync as fsMkdtempSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  runValidation,
  validateDemarcationContent,
  validateDesignFilesExist,
  validateOrchestratorContent,
  validateReadmeLink,
  validateSeamContent,
} from './validate-composition';

function createTempRepo(): string {
  const rootDir = fsMkdtempSync(
    path.join(os.tmpdir(), 'composition-validator-')
  );
  return rootDir;
}

function writeFile(
  rootDir: string,
  relativePath: string,
  content: string
): void {
  const absolutePath = path.join(rootDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, 'utf8');
}

test('validateDesignFilesExist fails when composition.md is missing', () => {
  const rootDir = createTempRepo();

  writeFile(rootDir, 'Design/composition-demarcation.md', '# Demarcation');
  writeFile(rootDir, 'Design/composition-seam.md', '# Seam');

  const errors = validateDesignFilesExist(rootDir);

  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Design\/composition\.md/i);
});

test('validateDesignFilesExist fails when demarcation.md is missing', () => {
  const rootDir = createTempRepo();

  writeFile(rootDir, 'Design/composition.md', '# Composition');
  writeFile(rootDir, 'Design/composition-seam.md', '# Seam');

  const errors = validateDesignFilesExist(rootDir);

  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /composition-demarcation\.md/i);
});

test('validateDesignFilesExist fails when seam.md is missing', () => {
  const rootDir = createTempRepo();

  writeFile(rootDir, 'Design/composition.md', '# Composition');
  writeFile(rootDir, 'Design/composition-demarcation.md', '# Demarcation');

  const errors = validateDesignFilesExist(rootDir);

  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /composition-seam\.md/i);
});

test('validateDesignFilesExist passes when all files exist', () => {
  const rootDir = createTempRepo();

  writeFile(rootDir, 'Design/composition.md', '# Composition');
  writeFile(rootDir, 'Design/composition-demarcation.md', '# Demarcation');
  writeFile(rootDir, 'Design/composition-seam.md', '# Seam');

  const errors = validateDesignFilesExist(rootDir);

  assert.equal(errors.length, 0);
});

test('validateDemarcationContent fails when required headings are missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-demarcation.md',
    [
      '# Composition Demarcation',
      '',
      '## Some Other Heading',
      '',
      'Some content without required headings.',
    ].join('\n')
  );

  const errors = validateDemarcationContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required heading: "Stage Ownership"')
    )
  );
  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required heading: "Named Handoffs"')
    )
  );
});

test('validateDemarcationContent fails when required phrases are missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-demarcation.md',
    [
      '# Composition Demarcation',
      '',
      '## Stage Ownership',
      '## Context-First',
      '## Named Handoffs',
      '',
      'Some content without required phrases.',
    ].join('\n')
  );

  const errors = validateDemarcationContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required phrase: "Stage 0.5"')
    )
  );
  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required phrase: "reverse-engineer"')
    )
  );
  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required phrase: "Context kit"')
    )
  );
});

test('validateDemarcationContent passes when all headings and phrases exist', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-demarcation.md',
    [
      '# Composition Demarcation',
      '',
      '## Stage Ownership',
      '',
      'Stage 0.5 Context Kit owned by Pack.',
      '',
      '## Context-First',
      '',
      'The context-first approach uses reverse-engineer to build the Context kit.',
      '',
      '## Named Handoffs',
      '',
      'H1: Pack Context Kit → Matt Grilling',
    ].join('\n')
  );

  const errors = validateDemarcationContent(rootDir);

  assert.equal(errors.length, 0);
});

test('validateSeamContent fails when required usage fields are missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-seam.md',
    [
      '# Loop-Host Seam Contract',
      '',
      '## Required Usage Fields',
      '',
      '- tokens_in',
      '- tokens_out',
    ].join('\n')
  );

  const errors = validateSeamContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required usage field: "tokens_cache_read"')
    )
  );
  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required usage field: "tokens_cache_write"')
    )
  );
  assert.ok(
    errors.some((error) =>
      error.message.includes('missing required usage field: "credits"')
    )
  );
});

test('validateSeamContent fails when cache token guidance is missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-seam.md',
    [
      '# Loop-Host Seam Contract',
      '',
      '## Required Usage Fields',
      '',
      '- tokens_in',
      '- tokens_out',
      '- tokens_cache_read',
      '- tokens_cache_write',
      '- credits',
      '- duration_seconds',
      '- runner_id',
      '- resolved_model',
    ].join('\n')
  );

  const errors = validateSeamContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes(
        'cache token fields are required even when zero'
      )
    )
  );
});

test('validateSeamContent fails when credits-or-null guidance is missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-seam.md',
    [
      '# Loop-Host Seam Contract',
      '',
      '## Required Usage Fields',
      '',
      '- tokens_in',
      '- tokens_out',
      '- tokens_cache_read',
      '- tokens_cache_write',
      '- credits',
      '- duration_seconds',
      '- runner_id',
      '- resolved_model',
      '',
      '**Note on cache tokens:** Cache read/write fields are required even when the values are zero.',
    ].join('\n')
  );

  const errors = validateSeamContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('credits field may be null')
    )
  );
});

test('validateSeamContent passes when all fields and guidance exist', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition-seam.md',
    [
      '# Loop-Host Seam Contract',
      '',
      '## Required Usage Fields',
      '',
      '- tokens_in',
      '- tokens_out',
      '- tokens_cache_read',
      '- tokens_cache_write',
      '- credits',
      '- duration_seconds',
      '- runner_id',
      '- resolved_model',
      '',
      '**Note on cache tokens:** Cache read/write fields are required even when the values are zero.',
      '',
      '**Note on credits:** The credits field may be null if cost is unavailable.',
    ].join('\n')
  );

  const errors = validateSeamContent(rootDir);

  assert.equal(errors.length, 0);
});

test('validateReadmeLink fails when README does not exist', () => {
  const rootDir = createTempRepo();

  const errors = validateReadmeLink(rootDir);

  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /README\.md does not exist/i);
});

test('validateReadmeLink fails when README does not link to composition.md', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'README.md',
    [
      '# ai-agent-workflows',
      '',
      'Some content without a Composition link.',
    ].join('\n')
  );

  const errors = validateReadmeLink(rootDir);

  assert.equal(errors.length, 1);
  assert.match(
    errors[0].message,
    /README does not link to the Composition index/i
  );
});

test('validateReadmeLink passes when README links to composition.md', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'README.md',
    [
      '# ai-agent-workflows',
      '',
      '## Composition',
      '',
      'See [Design/composition.md](./Design/composition.md) for details.',
    ].join('\n')
  );

  const errors = validateReadmeLink(rootDir);

  assert.equal(errors.length, 0);
});

test('validateOrchestratorContent fails when orchestrator.agent.md does not exist', () => {
  const rootDir = createTempRepo();

  const errors = validateOrchestratorContent(rootDir);

  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /orchestrator\.agent\.md does not exist/i);
});

test('validateOrchestratorContent fails when Stage 0.5 is missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      'Matt skills own interactive fog/grill/decide.',
      'This orchestrator does not present itself as the default Matt fog/grill router.',
      '',
      'Includes reverse-engineer and Context kit.',
    ].join('\n')
  );

  const errors = validateOrchestratorContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('must reference Stage 0.5')
    )
  );
});

test('validateOrchestratorContent fails when reverse-engineer is missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      'Matt skills own interactive fog/grill/decide.',
      'This orchestrator does not present itself as the default Matt fog/grill router.',
      '',
      'Stage 0.5 Context Kit.',
    ].join('\n')
  );

  const errors = validateOrchestratorContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('must reference reverse-engineer')
    )
  );
});

test('validateOrchestratorContent fails when Context kit is missing', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      'Matt skills own interactive fog/grill/decide.',
      'This orchestrator does not present itself as the default Matt fog/grill router.',
      '',
      'Stage 0.5 reverse-engineer.',
    ].join('\n')
  );

  const errors = validateOrchestratorContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('must reference Context kit')
    )
  );
});

test('validateOrchestratorContent fails when orchestrator claims Matt ownership', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      'Stage 0.5 reverse-engineer Context kit.',
      '',
      'The orchestrator is the default Matt fog/grill router.',
    ].join('\n')
  );

  const errors = validateOrchestratorContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('must not claim default Matt fog/grill ownership')
    )
  );
});

test('validateOrchestratorContent fails when orchestrator does not disclaim Matt ownership', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      'Stage 0.5 reverse-engineer Context kit.',
    ].join('\n')
  );

  const errors = validateOrchestratorContent(rootDir);

  assert.ok(
    errors.some((error) =>
      error.message.includes('must explicitly disclaim Matt fog/grill ownership')
    )
  );
});

test('validateOrchestratorContent passes when all requirements are met', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      '## Role and Ownership',
      '',
      'This orchestrator is the Pack delivery controller for post-ready-for-agent stages',
      'and the keeper of early context stages (Stage 0.5 / reverse-engineer / Context kit).',
      '',
      'Matt skills own interactive fog/grill/decide.',
      'This orchestrator does not present itself as the default Matt fog/grill router.',
    ].join('\n')
  );

  const errors = validateOrchestratorContent(rootDir);

  assert.equal(errors.length, 0);
});

test('runValidation passes with complete valid fixture', () => {
  const rootDir = createTempRepo();

  writeFile(
    rootDir,
    'Design/composition.md',
    [
      '# Pack Composition',
      '',
      'This document describes the Composition.',
    ].join('\n')
  );

  writeFile(
    rootDir,
    'Design/composition-demarcation.md',
    [
      '# Composition Demarcation',
      '',
      '## Stage Ownership',
      '',
      'Stage 0.5 Context Kit owned by Pack.',
      '',
      '## Context-First',
      '',
      'The context-first approach uses reverse-engineer to build the Context kit.',
      '',
      '## Named Handoffs',
      '',
      'H1: Pack Context Kit → Matt Grilling',
    ].join('\n')
  );

  writeFile(
    rootDir,
    'Design/composition-seam.md',
    [
      '# Loop-Host Seam Contract',
      '',
      '## Required Usage Fields',
      '',
      '- tokens_in',
      '- tokens_out',
      '- tokens_cache_read',
      '- tokens_cache_write',
      '- credits',
      '- duration_seconds',
      '- runner_id',
      '- resolved_model',
      '',
      '**Note on cache tokens:** Cache read/write fields are required even when the values are zero.',
      '',
      '**Note on credits:** The credits field may be null if cost is unavailable.',
    ].join('\n')
  );

  writeFile(
    rootDir,
    'README.md',
    [
      '# ai-agent-workflows',
      '',
      '## Composition',
      '',
      'See [Design/composition.md](./Design/composition.md) for details.',
    ].join('\n')
  );

  writeFile(
    rootDir,
    'agents/orchestrator.agent.md',
    [
      '---',
      'name: orchestrator',
      '---',
      '',
      '# Orchestrator',
      '',
      '## Role and Ownership',
      '',
      'This orchestrator is the Pack delivery controller for post-ready-for-agent stages',
      'and the keeper of early context stages (Stage 0.5 / reverse-engineer / Context kit).',
      '',
      'Matt skills own interactive fog/grill/decide.',
      'This orchestrator does not present itself as the default Matt fog/grill router.',
    ].join('\n')
  );

  const result = runValidation({ rootDir });

  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test('runValidation fails when multiple issues exist', () => {
  const rootDir = createTempRepo();

  writeFile(rootDir, 'Design/composition.md', '# Composition');
  writeFile(rootDir, 'Design/composition-demarcation.md', '# Demarcation');
  writeFile(rootDir, 'README.md', '# Project');

  const result = runValidation({ rootDir });

  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});
