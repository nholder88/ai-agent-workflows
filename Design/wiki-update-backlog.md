# Wiki Update Agent Backlog (Stage 2)

This backlog covers all components in `Design/wiki-update-architecture.md` and is ordered as a dependency-safe DAG.

Implementation-ready Stage 3 refinement: `Design/wiki-update-pbi.md`.

## Task WU-01: Define Shared Wiki Update Policy Contract

**Priority**: P0-Critical
**Estimated Complexity**: Small
**Dependencies**: None
**Component**: Repository Host Policy Contract

### Description
Create a shared YAML policy contract for wiki update scope, trigger, failure handling, and output defaults.

### Requirements
- [ ] Create `Templates/shared/wiki-update-contract.yaml`.
- [ ] Encode defaults: `scope` (`github.com` + GHES allowlist), `trigger: stage7_pass`, `failureMode: non_blocking_warning_audit`, `outputMode: pr`, `humanApproval: true`.
- [ ] Add classification include/exclude taxonomy for user-facing content.

### Technical Specification
- File to create: `Templates/shared/wiki-update-contract.yaml`.
- Required top-level keys: `version`, `name`, `policy`, `classification`.
- `policy.scope` must include `githubDotCom` boolean and `ghesAllowlist` array.
- Classification schema must separate `include` and `exclude` criteria.

### Acceptance Criteria
- [ ] Contract file exists and is valid YAML.
- [ ] All approved defaults are represented exactly.
- [ ] Classification rules explicitly include functional changes/how-to and exclude technical internals.

### Testing Requirements
- [ ] Unit tests covering: YAML parse and required key presence.
- [ ] Integration tests covering: validator can load and reference contract path.
- [ ] Edge case tests: empty/missing `ghesAllowlist` remains valid while non-GitHub hosts are excluded.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-02: Add Stage 7 Post-Task Hook in Orchestrator

**Priority**: P0-Critical
**Estimated Complexity**: Medium
**Dependencies**: WU-01
**Component**: Orchestrator Post-Task Trigger

### Description
Add orchestrator logic to invoke wiki update flow after Stage 7 PASS only, with policy contract gating.

### Requirements
- [ ] Define post-Stage-7 invocation path for wiki update flow.
- [ ] Ensure trigger is constrained to Stage 7 PASS.
- [ ] Ensure policy contract is loaded before any wiki action.

### Technical Specification
- Modify orchestration definitions and stage flow references:
  - `VS Code/agents/orchestrator.agent.md`
  - Pipeline stage docs under `agent-progress/` where required.
- Add explicit branch: if Stage 7 PASS then evaluate wiki flow, else skip.
- Include stage label and audit hook references for non-blocking failure path.

### Acceptance Criteria
- [ ] Stage 7 PASS is the only trigger path for wiki flow.
- [ ] No wiki flow runs for failed/incomplete Stage 7 outcomes.
- [ ] Orchestrator documentation clearly shows post-task hook and skip behavior.

### Testing Requirements
- [ ] Unit tests covering: trigger condition evaluation logic (pass/fail).
- [ ] Integration tests covering: end-to-end simulated pipeline with Stage 7 PASS invokes wiki flow once.
- [ ] Edge case tests: reruns/retries do not duplicate wiki flow without explicit rerun intent.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-03: Implement GitHub Host Scope and GHES Allowlist Enforcement

**Priority**: P0-Critical
**Estimated Complexity**: Medium
**Dependencies**: WU-01, WU-02
**Component**: Repository Host Policy Contract

### Description
Enforce repository host checks so wiki updates run only on `github.com` and allowlisted GHES hosts.

### Requirements
- [ ] Detect repository host from pipeline/repo metadata.
- [ ] Normalize hostnames before matching.
- [ ] Enforce allowlist rules for GHES.
- [ ] Skip and audit when scope check fails.

### Technical Specification
- Add policy evaluation logic in orchestrator/runtime integration points.
- Reference `Templates/shared/wiki-update-contract.yaml` as source of truth.
- Create deterministic host matching behavior:
  - `github.com` always allowed when `githubDotCom: true`.
  - GHES host must match `ghesAllowlist`.
  - All other hosts are skipped.

### Acceptance Criteria
- [ ] `github.com` repositories proceed to classification.
- [ ] Allowlisted GHES repositories proceed to classification.
- [ ] Non-allowlisted/non-GitHub hosts skip with warning/audit event.

### Testing Requirements
- [ ] Unit tests covering: host normalization and allowlist match rules.
- [ ] Integration tests covering: sample `github.com`, allowlisted GHES, and unsupported host cases.
- [ ] Edge case tests: case-insensitive hostnames and trailing dot/port variants.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-04: Define Candidate Classification Rubric for Wiki Worthiness

**Priority**: P1-High
**Estimated Complexity**: Medium
**Dependencies**: WU-01, WU-02
**Component**: Wiki Candidate Classifier

### Description
Design and codify deterministic rules that decide whether completed work is worth end-user wiki documentation.

### Requirements
- [ ] Include functional changes and how-to guidance as positive criteria.
- [ ] Exclude purely technical internals and refactor-only noise.
- [ ] Emit machine-readable reason codes for every decision.

### Technical Specification
- Update wiki-related agent/design docs and contract annotations.
- Define rubric outputs:
  - `eligible: boolean`
  - `reasonCode: string`
  - `summaryHints: string[]`
- Add explicit decision table examples for common cases.

### Acceptance Criteria
- [ ] Rubric includes clear include/exclude logic.
- [ ] Every classification decision returns a reason code.
- [ ] Ambiguous cases have deterministic fallback behavior.

### Testing Requirements
- [ ] Unit tests covering: classification decision table for happy path and exclusion path.
- [ ] Integration tests covering: classifier receives Stage 7 task context and returns structured output.
- [ ] Edge case tests: mixed changes (functional plus internal) still produce stable decisions.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-05: Author Wiki Update Agent Spec and Output Contract

**Priority**: P1-High
**Estimated Complexity**: Medium
**Dependencies**: WU-03, WU-04
**Component**: Wiki Update Agent

### Description
Create the dedicated wiki update agent instructions and output schema for user-facing wiki content generation.

### Requirements
- [ ] Produce markdown output focused on functional change summary and actionable how-to.
- [ ] Exclude deep implementation details and internal architecture internals.
- [ ] Support default `outputMode: pr` content packaging.
- [ ] Enforce `humanApproval: true` flow metadata.

### Technical Specification
- Add new agent spec file in `VS Code/agents/` (name finalized during implementation).
- Define required output sections:
  - `What changed for users`
  - `How to use`
  - `Migration/rollout notes` (if applicable)
  - `Out of scope/internal details`
- Define output metadata contract fields consumed by output adapter.

### Acceptance Criteria
- [ ] Agent spec exists and is wired for post-task use.
- [ ] Output includes required user-facing sections.
- [ ] Internal-only details are filtered out or redirected.

### Testing Requirements
- [ ] Unit tests covering: output contract shape validation.
- [ ] Integration tests covering: orchestrator passes classified context and receives PR-mode artifact payload.
- [ ] Edge case tests: no-doc-worthy classification bypasses content generation safely.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-06: Implement Non-Blocking Failure and Audit Trail

**Priority**: P0-Critical
**Estimated Complexity**: Small
**Dependencies**: WU-03, WU-05
**Component**: Output Adapter and Approval Gate

### Description
Guarantee that wiki update failures produce warnings and audit records without failing the delivery pipeline.

### Requirements
- [ ] Implement non-blocking failure policy for wiki update path.
- [ ] Emit structured warning and audit event on every failure.
- [ ] Preserve normal pipeline completion semantics.

### Technical Specification
- Add failure handler hooks in orchestrator/wiki integration docs and implementation.
- Define audit event fields: `taskId`, `stage`, `host`, `reasonCode`, `errorType`, `timestamp`, `result`.
- Ensure approval gate remains active for successful candidate runs.

### Acceptance Criteria
- [ ] Wiki path failures do not fail overall pipeline.
- [ ] Warning output and audit event are always emitted on failures.
- [ ] Successful runs still require human approval by default.

### Testing Requirements
- [ ] Unit tests covering: failure path policy behavior and audit payload generation.
- [ ] Integration tests covering: simulated wiki generation failure leaves pipeline PASS with warning.
- [ ] Edge case tests: repeated transient failures do not suppress audit logs.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-07: Add Scaffold Support Fields Across Stack Template Specs

**Priority**: P0-Critical
**Estimated Complexity**: Medium
**Dependencies**: WU-01
**Component**: Scaffold Contract Propagation

### Description
Add consistent wiki-update scaffold fields to all stack template specs so generated projects carry the same defaults and contract link.

### Requirements
- [ ] Update frontend and backend `template-spec.yaml` files with `wiki_update` support section.
- [ ] Reference shared wiki contract path from each stack spec.
- [ ] Keep defaults aligned with approved policy values.

### Technical Specification
- Modify files:
  - `Templates/frontend-nextjs/template-spec.yaml`
  - `Templates/frontend-sveltekit/template-spec.yaml`
  - `Templates/frontend-angular/template-spec.yaml`
  - `Templates/backend-service/template-spec.yaml`
  - `Templates/backend-dotnet/template-spec.yaml`
  - `Templates/backend-python/template-spec.yaml`
  - `Templates/backend-go/template-spec.yaml`
  - `Templates/backend-java/template-spec.yaml`
  - `Templates/backend-rust/template-spec.yaml`
- Add keys under stack spec metadata:
  - `wiki_update.enabled`
  - `wiki_update.contract_ref`
  - `wiki_update.output_mode_default`
  - `wiki_update.human_approval_default`

### Acceptance Criteria
- [ ] All stack template specs include `wiki_update` section.
- [ ] Every stack references the same shared contract path.
- [ ] Defaults are consistent across all stacks.

### Testing Requirements
- [ ] Unit tests covering: spec parsing includes wiki update fields for every stack.
- [ ] Integration tests covering: scaffold generation reads wiki fields consistently across frontend/backend stacks.
- [ ] Edge case tests: missing wiki fields in any single stack fail parity validation.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-08: Extend Parity Validator for Wiki Contract Coverage

**Priority**: P0-Critical
**Estimated Complexity**: Medium
**Dependencies**: WU-01, WU-07
**Component**: Parity Validation and Governance

### Description
Extend parity tooling to enforce wiki update contract presence, field completeness, and stack-wide consistency.

### Requirements
- [ ] Validate existence and schema shape of `Templates/shared/wiki-update-contract.yaml`.
- [ ] Validate every stack spec has required `wiki_update` keys.
- [ ] Validate defaults and contract references are identical across stacks where required.
- [ ] Add regression tests in Node built-in test runner.

### Technical Specification
- Modify:
  - `Templates/tools/validate-parity.ts`
  - `Templates/tools/validate-parity.test.ts`
  - `Templates/shared/capability-parity-matrix.yaml` (if new capability ID is introduced)
- Add wiki-specific validation functions and actionable error messages.
- Keep existing parity behavior unchanged for unrelated capabilities.

### Acceptance Criteria
- [ ] Validator fails when wiki contract file is missing or malformed.
- [ ] Validator fails when any stack omits required wiki fields.
- [ ] Validator fails on inconsistent defaults/contract references across stacks.
- [ ] Existing parity checks continue to pass when wiki fields are compliant.

### Testing Requirements
- [ ] Unit tests covering: each wiki validation rule pass/fail scenarios.
- [ ] Integration tests covering: full parity run with compliant and non-compliant fixtures.
- [ ] Edge case tests: partial stack updates and unknown stack keys.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end

## Task WU-09: Document Operator Workflow and Governance

**Priority**: P2-Medium
**Estimated Complexity**: Small
**Dependencies**: WU-05, WU-06, WU-08
**Component**: Output Adapter and Approval Gate

### Description
Document how maintainers review, approve, and monitor wiki update artifacts and warnings.

### Requirements
- [ ] Update docs with operator steps for PR-mode wiki output and approval workflow.
- [ ] Document non-blocking warning behavior and audit event interpretation.
- [ ] Document GHES allowlist governance and change control.

### Technical Specification
- Modify docs in:
  - `README.md`
  - `Templates/README.md`
  - Any wiki-update-specific runbook added during implementation.
- Add quick-start section and troubleshooting section.
- Cross-reference parity validation commands.

### Acceptance Criteria
- [ ] Docs clearly explain defaults, trigger point, and failure behavior.
- [ ] Maintainers can follow a deterministic approval process.
- [ ] Governance expectations for allowlist and drift control are explicit.

### Testing Requirements
- [ ] Unit tests covering: N/A (documentation-only task).
- [ ] Integration tests covering: docs links and referenced file paths are valid.
- [ ] Edge case tests: include non-GitHub repository behavior in troubleshooting examples.
- [ ] All tests pass with no regressions.

### Completion Checklist
- [ ] Implementation complete per requirements
- [ ] All acceptance criteria met
- [ ] All testing requirements satisfied and tests passing
- [ ] Code review agent has reviewed and approved
- [ ] No linting errors or warnings
- [ ] Documentation updated if applicable
- [ ] Confirmed working end-to-end
