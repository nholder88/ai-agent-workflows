---
name: wiki-update
description: >-
  Generate or skip a user-facing wiki update artifact after a completed task.
  Applies deterministic eligibility rules, host-scope checks, and produces
  PR-ready documentation including changelog entries and how-to guides.
  USE FOR: post-task wiki/docs generation, changelog entries, user-facing
  documentation updates.
  DO NOT USE FOR: in-code documentation (use code-documentation), non-code
  config docs (use docs-config-authoring), code review (use code-review).
argument-hint: 'Point me at a completed task and I will generate wiki update artifacts if eligible.'
phase: '7.5'
phase-family: wiki-update
---

# Wiki Update

## When to Use

- A task has completed Stage 7 with a PASS result and may need user-facing wiki documentation.
- Changelog entries or how-to guides need to be generated from completed work.
- Post-task documentation artifacts are required for PR review.

## When Not to Use

- In-code documentation (JSDoc, docstrings, etc.) — use `code-documentation`.
- Non-code config docs (README, YAML, agent files) — use `docs-config-authoring`.
- Code review or quality feedback — use `code-review`.

## Defaults (treated as policy)

- Scope: `github.com` and allowlisted GHES hosts only.
- Trigger: Stage 7 PASS only.
- Failure mode: `non_blocking_warning_audit`.
- Output mode default: `pr`.
- Human approval default: `true`.
- Include: user-facing functional changes and end-user how-to guidance.
- Exclude: low-level technical internals and refactor-only details.

Policy source of truth: `templates/shared/wiki-update-contract.yaml`.

## Procedure

### 1. Validate Input

Expect a context package with at least:

- `taskId: string`
- `stageResult: PASS|FAIL|INCOMPLETE`
- `repoHost: string`
- `allowlistedHosts: string[]`
- `taskSummary: string`
- `userFacingChanges: string[]`
- `howToNotes: string[]`
- `internalOnlyChanges: string[]`
- `retryContext`: `idempotencyKey: string`, `alreadyProcessed: boolean`

### 2. Normalize Host

1. Lowercase.
2. Strip trailing dot.
3. Remove explicit port (e.g., `:443`).

Scope decision:

- Allow when normalized host is `github.com` and `policy.scope.githubDotCom == true`.
- Allow when normalized host matches an entry in the normalized GHES allowlist.
- Otherwise skip and emit warning + audit.

### 3. Classify Eligibility (deterministic)

Return shape:

```yaml
eligible: boolean
reasonCode: string
summaryHints: string[]
```

Precedence rules:

1. If no user-facing functional change and no end-user how-to implication: `eligible=false`, `reasonCode=not_doc_worthy`.
2. If only internal refactor / low-level details: `eligible=false`, `reasonCode=internal_only`.
3. If mixed changes include at least one user-facing functional change: `eligible=true`, `reasonCode=user_visible_change`.
4. If primarily how-to relevance without major behavior change: `eligible=true`, `reasonCode=how_to_guidance`.

Determinism rule: same normalized input must always produce the same `eligible/reasonCode/summaryHints`.

### 4. Skip Cases

Skip wiki generation and emit audit reason when:

- Stage result is not PASS.
- Host is out of scope.
- Idempotency indicates already processed.
- Classifier returns `eligible=false`.

### 5. Generate Payload (when eligible)

Emit markdown payload with required sections:

1. **What changed for users** — User-facing functional changes only.
2. **How to use** — End-user guidance and instructions.
3. **Out of scope/internal details** — What was excluded and why.

Optional section:

- **Migration/rollout notes** — When applicable.

Also emit metadata block:

```yaml
outputMode: pr
humanApprovalRequired: true
taskId: <taskId>
reasonCode: <reasonCode>
```

### 6. Handle Failures (non-blocking)

If any step fails, do not request pipeline failure. Emit warning and audit payload.

Audit payload fields:

- `taskId`
- `stage`
- `host`
- `reasonCode`
- `errorType`
- `timestamp`
- `result`

Fallback: if audit payload cannot be fully constructed, emit minimal warning with `taskId`, `stage`, and error summary.

## Writing Style

- Prefer concise, user-oriented language.
- Focus on behavior and usage, not implementation internals.
- Do not include stack internals, framework plumbing, or code-level refactor detail.

## Output Contract

All skills in the **wiki-update** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Wiki Update Report

**Eligibility:** Eligible / Not eligible
[Reason if not eligible.]

**Payload** (if eligible)
- Changelog entry: [summary]
- Wiki pages: [list of pages created/updated]
- Approval required: yes/no

**Suggested next step**
[Human review of wiki content, or "N/A — not eligible".]
```

## Guardrails

- Same normalized input must always produce the same classification result.
- Never include low-level technical internals or refactor-only details in user-facing wiki content.
- Always require human approval for wiki updates (default policy).
- Non-blocking failure mode: never halt the pipeline on wiki generation failure.
- Only generate wiki artifacts after Stage 7 PASS.
