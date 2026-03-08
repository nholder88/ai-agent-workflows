# Wiki Update PBIs (Implementation-Ready, Stage 3)

## 1. Summary
This feature adds a post-task wiki update flow that runs after Stage 7 PASS, applies only to `github.com` and allowlisted GHES hosts, and emits PR-mode user-facing documentation artifacts that require human approval. The goal is consistent scaffold and parity support across all template stacks while reducing noisy or internal-only wiki updates through deterministic classification and explicit audit behavior.

## 2. Assumptions Log
| # | Assumption | Status | Notes |
|---|-----------|--------|-------|
| A1 | Trigger point is Stage 7 PASS only. | Confirmed | Required by context package and `Design/wiki-update-architecture.md`. |
| A2 | Default failure behavior is warning plus audit, with no pipeline failure. | Confirmed | Required by context package and WU-06 scope. |
| A3 | Default output mode is `pr` and default approval is human-gated. | Confirmed | Required by context package and architecture defaults. |
| A4 | Wiki content scope is end-user functional changes plus how-to guidance. | Confirmed | Required by context package and architecture classification include list. |
| A5 | Low-level technical internals are excluded from generated wiki content. | Confirmed | Required by context package and architecture classification exclude list. |
| A6 | GHES allowlist source is `Templates/shared/wiki-update-contract.yaml`. | Needs Clarification | Architecture implies this source; runtime loading path is implementation-dependent. |
| A7 | PR-mode output destination is a deterministic artifact format consumed by orchestrator. | Needs Clarification | Exact artifact path and naming convention are not defined in current docs. |
| A8 | Duplicate Stage 7 retry handling uses idempotent wiki-flow execution keyed by task context. | Needs Clarification | Backlog requires no duplicate generation on retries; key strategy is not yet specified. |

## 3. Open Questions
Functional:
1. What exact reason-code vocabulary is approved for classifier decisions, and which codes are mandatory for reporting?
2. For mixed-change tasks, does one valid end-user functional change always force `eligible: true` even when most diffs are internal?

Technical:
1. Which file and schema define the PR-mode artifact payload consumed by orchestrator after wiki generation?
2. What idempotency key fields define a unique wiki-flow run for Stage 7 reruns: `taskId`, `commitSha`, `pipelineRunId`, or another combination?
3. Which location stores audit events in this repo context: stage progress markdown only, structured JSON artifact, or both?

Scope:
1. Is WU-09 limited to maintainer documentation in `README.md` and `Templates/README.md`, or does it include a dedicated runbook file under `Documentation/`?
2. Does GHES allowlist governance include approval workflow requirements, or only file-level change control guidance?

## 4. Functional Acceptance Criteria

### PBI-WU-01: Shared Wiki Update Policy Contract
AC-1: Contract creation with approved defaults (happy path)
  Given repository templates under `Templates/shared/`
  When `Templates/shared/wiki-update-contract.yaml` is added
  Then the file parses as valid YAML
  And it contains `version`, `name`, `policy`, and `classification`
  And `policy` defaults are exactly `scope.githubDotCom: true`, `scope.ghesAllowlist: []`, `trigger: stage7_pass`, `failureMode: non_blocking_warning_audit`, `outputMode: pr`, `humanApproval: true`.

AC-2: Invalid or missing required keys (error path)
  Given the contract file omits any required top-level or policy key
  When parity validation runs
  Then validation fails
  And the error message identifies the missing key and file path.

AC-3: Empty GHES allowlist with github.com enabled (edge case)
  Given `scope.ghesAllowlist` is empty and `scope.githubDotCom` is true
  When host policy evaluation runs for `github.com`
  Then `github.com` remains in scope
  And non-GitHub hosts remain out of scope.

### PBI-WU-02: Stage 7 Post-Task Orchestrator Hook
AC-1: Stage 7 PASS trigger only (happy path)
  Given a pipeline run reaches Stage 7 with result PASS
  When orchestrator evaluates post-task actions
  Then wiki flow executes once
  And the invocation includes policy contract context.

AC-2: Non-PASS stage outcome skip behavior (error path)
  Given Stage 7 result is FAIL or INCOMPLETE
  When orchestrator evaluates post-task actions
  Then wiki flow is skipped
  And skip reason is recorded in stage audit output.

AC-3: Stage 7 retry without explicit wiki rerun intent (edge case)
  Given Stage 7 is retried for the same task context
  When orchestrator post-task evaluation executes
  Then duplicate wiki flow does not execute
  And audit output records idempotent skip metadata.

### PBI-WU-03: GitHub Host Scope and GHES Allowlist Enforcement
AC-1: In-scope host routing (happy path)
  Given repository metadata host is `github.com` or an allowlisted GHES hostname
  When host policy evaluation executes
  Then the task proceeds to classifier evaluation
  And host normalization is applied before matching.

AC-2: Out-of-scope host handling (error path)
  Given repository metadata host is not `github.com` and not allowlisted GHES
  When host policy evaluation executes
  Then wiki flow is skipped
  And a non-blocking warning plus audit record is emitted.

AC-3: Hostname normalization variants (edge case)
  Given host metadata includes case differences, trailing dots, or explicit port values
  When host policy evaluation executes
  Then normalized host comparison remains deterministic
  And allowlist matching outcome is stable.

### PBI-WU-04: Candidate Classification Rubric
AC-1: User-facing eligible classification (happy path)
  Given a completed task includes end-user functional change and actionable how-to implications
  When classifier evaluates the task package
  Then classifier returns `eligible: true`
  And output includes `reasonCode` and `summaryHints`.

AC-2: Internal-only change exclusion (error path)
  Given a completed task contains only internal refactor or low-level technical details
  When classifier evaluates the task package
  Then classifier returns `eligible: false`
  And reason code maps to exclusion taxonomy.

AC-3: Mixed-change deterministic fallback (edge case)
  Given a task includes both functional and internal changes
  When classifier evaluates the task package
  Then classifier returns deterministic eligibility based on rubric precedence
  And the same input set yields the same result across runs.

### PBI-WU-05: Wiki Update Agent Spec and Output Contract
AC-1: Required user-facing sections in generated artifact (happy path)
  Given classifier marks a task as eligible
  When wiki update agent generates output
  Then output includes `What changed for users`, `How to use`, and `Out of scope/internal details`
  And output mode metadata is `pr`
  And approval metadata indicates human approval required.

AC-2: Generation failure behavior (error path)
  Given classifier marks a task as eligible and content generation fails
  When wiki update generation completes with error
  Then wiki path reports non-blocking warning and audit record
  And pipeline stage outcome remains unchanged.

AC-3: Non-eligible candidate bypass (edge case)
  Given classifier marks a task as not eligible
  When wiki flow executes
  Then content generation is bypassed
  And bypass reason is recorded in audit output.

### PBI-WU-06: Non-Blocking Failure and Audit Trail
AC-1: Failure does not block pipeline (happy path for resilience)
  Given any wiki sub-step returns an error
  When failure policy executes
  Then pipeline completion status remains based on core stage outcomes only
  And warning output is emitted.

AC-2: Missing audit payload field handling (error path)
  Given failure handling attempts to emit audit payload with missing required field
  When audit emission executes
  Then payload construction fails closed for that event schema
  And fallback warning includes minimal context `taskId`, `stage`, and error summary.

AC-3: Repeated transient failures across retries (edge case)
  Given multiple retry attempts each hit a transient wiki error
  When failure policy executes each attempt
  Then each attempt emits an audit record
  And no attempt flips pipeline to failed due to wiki path alone.

### PBI-WU-07: Stack Template Scaffold Support Fields
AC-1: Stack-wide wiki_update section parity (happy path)
  Given all stack `template-spec.yaml` files in `Templates/frontend-*` and `Templates/backend-*`
  When wiki scaffold fields are added
  Then each stack contains `wiki_update.enabled`, `wiki_update.contract_ref`, `wiki_update.output_mode_default`, and `wiki_update.human_approval_default`
  And each stack uses identical default values and contract path.

AC-2: Single stack omission (error path)
  Given one stack omits any required `wiki_update` key
  When parity validation runs
  Then validation fails
  And output identifies the exact stack spec path and missing key.

AC-3: Divergent defaults in one stack (edge case)
  Given one stack has different output mode or approval default
  When parity validation runs
  Then validation fails
  And output identifies mismatch against shared contract defaults.

### PBI-WU-08: Parity Validator Coverage for Wiki Contract
AC-1: Compliant wiki fields pass parity validation (happy path)
  Given shared wiki contract and all stack specs are compliant
  When `npm run templates:test-parity` and `npm run templates:validate-parity` run
  Then both commands pass
  And existing non-wiki parity checks remain passing.

AC-2: Missing or malformed wiki contract file (error path)
  Given `Templates/shared/wiki-update-contract.yaml` is missing or malformed
  When parity validation runs
  Then validation fails
  And output provides actionable remediation guidance.

AC-3: Partial stack updates and unknown stack keys (edge case)
  Given only subset stack updates exist or unknown stack keys appear in wiki checks
  When parity validation runs
  Then validation fails
  And output enumerates each non-compliant item.

### PBI-WU-09: Operator Workflow and Governance Documentation
AC-1: Deterministic operator workflow documentation (happy path)
  Given wiki update feature defaults are implemented
  When docs are updated
  Then `README.md` and `Templates/README.md` describe trigger timing, host scope, output mode, approval flow, and failure behavior
  And instructions include parity validation commands.

AC-2: Broken doc references or commands (error path)
  Given documentation references non-existent files or scripts
  When doc verification runs
  Then validation fails
  And references are corrected before merge.

AC-3: Unsupported host troubleshooting path (edge case)
  Given maintainers troubleshoot non-GitHub repositories
  When they follow documented steps
  Then docs explain skip behavior and audit interpretation
  And docs include GHES allowlist governance path.

## 5. Technical Acceptance Criteria

### PBI-WU-01 Technical AC
- Create `Templates/shared/wiki-update-contract.yaml`.
- Use top-level keys `version`, `name`, `policy`, `classification`.
- Include policy schema keys `scope.githubDotCom`, `scope.ghesAllowlist`, `trigger`, `failureMode`, `outputMode`, `humanApproval`.
- Include classification lists with include values for user-visible functional change and end-user how-to, plus exclude values for internal refactor and low-level framework details.

### PBI-WU-02 Technical AC
- Update `VS Code/agents/orchestrator.agent.md` with a post-Stage-7 branch that runs only on PASS.
- Update stage trace docs under `agent-progress/` that describe stage order and post-task behavior, including wiki-flow skip reasons.
- Maintain existing stage sequencing and avoid changing pre-Stage-7 logic.

### PBI-WU-03 Technical AC
- Implement host policy evaluation logic in orchestrator/wiki integration docs and associated runtime entry points referenced by orchestrator.
- Use `Templates/shared/wiki-update-contract.yaml` as source of truth for host scope values.
- Normalize host input for case, trailing dot, and optional port before policy comparison.

### PBI-WU-04 Technical AC
- Extend wiki design/prompt assets in `Design/wiki-update-architecture.md` and agent spec artifacts under `VS Code/agents/` with deterministic rubric outputs.
- Rubric output shape includes `eligible`, `reasonCode`, and `summaryHints`.
- Define deterministic precedence rules for mixed-change inputs and document examples.

### PBI-WU-05 Technical AC
- Add wiki update agent spec under `VS Code/agents/` and reference it from orchestrator stage flow docs.
- Output payload includes required user-facing sections and output metadata fields for PR routing and approval gate.
- Exclude low-level internals by explicit filtering guidance in agent instructions.

### PBI-WU-06 Technical AC
- Add failure handler definition to orchestrator and wiki-flow docs with non-blocking policy semantics.
- Audit payload fields include `taskId`, `stage`, `host`, `reasonCode`, `errorType`, `timestamp`, `result`.
- Ensure audit emission path preserves pipeline status independent of wiki-path failures.

### PBI-WU-07 Technical AC
- Modify these files:
  - `Templates/frontend-nextjs/template-spec.yaml`
  - `Templates/frontend-sveltekit/template-spec.yaml`
  - `Templates/frontend-angular/template-spec.yaml`
  - `Templates/backend-service/template-spec.yaml`
  - `Templates/backend-dotnet/template-spec.yaml`
  - `Templates/backend-python/template-spec.yaml`
  - `Templates/backend-go/template-spec.yaml`
  - `Templates/backend-java/template-spec.yaml`
  - `Templates/backend-rust/template-spec.yaml`
- Add `wiki_update` object with `enabled`, `contract_ref`, `output_mode_default`, `human_approval_default`.
- Keep `required_capabilities` and current stack metadata structure intact.

### PBI-WU-08 Technical AC
- Extend `Templates/tools/validate-parity.ts` with wiki-update validation functions and actionable error messages.
- Extend `Templates/tools/validate-parity.test.ts` with pass/fail coverage for missing contract, malformed contract, missing stack wiki fields, and default mismatch cases.
- Update `Templates/shared/capability-parity-matrix.yaml` only if a new capability identifier is required for governance tracking.

### PBI-WU-09 Technical AC
- Update `README.md` and `Templates/README.md` with operator workflow and governance guidance.
- Add or update runbook docs if selected by resolution of Open Question Scope-1.
- Ensure every documented command exists in `package.json` scripts, including `templates:test-parity` and `templates:validate-parity`.

## 6. Test Criteria

### PBI-WU-01 Test Criteria
Unit tests:
- [ ] Validate YAML parse and required keys for `Templates/shared/wiki-update-contract.yaml`.
- [ ] Validate exact policy default values.

Integration tests:
- [ ] Validate parity loader resolves wiki contract path from stack specs.

E2E tests:
- [ ] Validate full parity run passes when contract exists and is valid.

Edge case tests:
- [ ] Empty `ghesAllowlist` remains valid with `githubDotCom: true`.
- [ ] Malformed classification blocks fail validation.

### PBI-WU-02 Test Criteria
Unit tests:
- [ ] Stage outcome branch test for PASS invoking wiki flow.
- [ ] Stage outcome branch test for FAIL/INCOMPLETE skipping wiki flow.

Integration tests:
- [ ] Simulated pipeline run confirms one post-task invocation on Stage 7 PASS.

E2E tests:
- [ ] End-to-end pipeline trace confirms no wiki flow before Stage 7 completes.

Edge case tests:
- [ ] Retry flow does not duplicate wiki invocation without explicit rerun flag.
- [ ] Missing policy contract blocks wiki invocation and emits warning/audit.

### PBI-WU-03 Test Criteria
Unit tests:
- [ ] Host normalization tests for case, trailing dot, and explicit port.
- [ ] Allowlist matching tests for in-scope and out-of-scope hosts.

Integration tests:
- [ ] `github.com` route proceeds to classifier.
- [ ] Allowlisted GHES route proceeds to classifier.
- [ ] Unsupported host route skips with warning/audit.

E2E tests:
- [ ] Pipeline run for unsupported host completes without wiki generation and with recorded audit skip.

Edge case tests:
- [ ] Unicode or malformed hostname input fails safely to skip plus audit.
- [ ] Empty host metadata fails safely to skip plus audit.

### PBI-WU-04 Test Criteria
Unit tests:
- [ ] Decision table tests for include and exclude rules.
- [ ] Reason-code presence test for every classification result.

Integration tests:
- [ ] Classifier consumes Stage 7 task context and emits structured output payload.

E2E tests:
- [ ] Eligible task path continues to wiki generation.
- [ ] Non-eligible task path bypasses generation with audit reason.

Edge case tests:
- [ ] Mixed-change input yields deterministic eligibility.
- [ ] Missing summary hints still returns valid structured output with empty array.

### PBI-WU-05 Test Criteria
Unit tests:
- [ ] Output payload schema test for required sections and metadata.
- [ ] Exclusion filter test for low-level internal content.

Integration tests:
- [ ] Orchestrator passes classifier output to wiki agent and receives PR-mode artifact payload.

E2E tests:
- [ ] Full eligible flow generates artifact and awaits human approval.

Edge case tests:
- [ ] Non-eligible classification bypasses generator with no artifact body.
- [ ] Generator timeout emits warning/audit and preserves pipeline completion.

### PBI-WU-06 Test Criteria
Unit tests:
- [ ] Failure policy branch emits warning without flipping pipeline status.
- [ ] Audit payload field completeness tests.

Integration tests:
- [ ] Simulated wiki generation error leaves pipeline PASS and emits audit record.

E2E tests:
- [ ] Consecutive failures across retries produce one audit event per attempt.

Edge case tests:
- [ ] Missing optional error details still emits minimal audit payload.
- [ ] Audit sink write failure emits fallback warning path.

### PBI-WU-07 Test Criteria
Unit tests:
- [ ] Parse each stack `template-spec.yaml` for required `wiki_update` keys.
- [ ] Assert consistent default values and contract path across all stacks.

Integration tests:
- [ ] Scaffold metadata read path consumes wiki_update fields for frontend and backend templates.

E2E tests:
- [ ] Full parity run validates all stack specs after wiki_update additions.

Edge case tests:
- [ ] Single stack missing `wiki_update` fails parity.
- [ ] Single stack default mismatch fails parity with targeted error.

### PBI-WU-08 Test Criteria
Unit tests:
- [ ] Validator test: missing `Templates/shared/wiki-update-contract.yaml` fails.
- [ ] Validator test: malformed contract schema fails.
- [ ] Validator test: missing `wiki_update` key in one stack fails.
- [ ] Validator test: output mode and approval default mismatch fails.

Integration tests:
- [ ] Full `templates:test-parity` and `templates:validate-parity` pass on compliant fixtures.

E2E tests:
- [ ] CI invocation of parity commands gates merge on wiki parity failures.

Edge case tests:
- [ ] Unknown stack key in wiki checks produces actionable error.
- [ ] Partial stack updates produce one error per non-compliant stack.

### PBI-WU-09 Test Criteria
Unit tests:
- [ ] N/A for code-level unit testing.

Integration tests:
- [ ] Documentation command verification checks every referenced npm script exists.
- [ ] Documentation path verification checks every referenced file path exists.

E2E tests:
- [ ] Maintainer walkthrough follows docs from Stage 7 PASS to approval with expected outcomes.

Edge case tests:
- [ ] Troubleshooting section covers unsupported-host skip path and audit interpretation.
- [ ] Governance section covers GHES allowlist update control and parity re-validation.

## 7. Implementation Steps
1. **Create shared policy contract (WU-01)** -- Add `Templates/shared/wiki-update-contract.yaml` with approved defaults and classification include/exclude taxonomy. Acceptance: YAML parses and parity load path resolves.
2. **Add orchestrator post-task hook (WU-02)** -- Update `VS Code/agents/orchestrator.agent.md` with Stage 7 PASS gate and explicit skip/audit paths for non-PASS. Acceptance: orchestrator docs show one PASS-only entry point.
3. **Implement host scope enforcement (WU-03)** -- Add host normalization and allowlist evaluation logic in orchestrator/wiki integration definitions referencing `Templates/shared/wiki-update-contract.yaml`. Acceptance: host policy cases map deterministically to proceed or skip.
4. **Define classifier rubric outputs (WU-04)** -- Add deterministic decision table and reason-code outputs in wiki design and agent assets. Acceptance: rubric supports include/exclude and mixed-change precedence.
5. **Add wiki update agent and output contract (WU-05)** -- Create a wiki update agent file under `VS Code/agents/` and document output contract fields for PR routing and approval metadata. Acceptance: required user-facing sections and metadata are present.
6. **Wire non-blocking failures and audit trail (WU-06)** -- Define warning and structured audit behavior for all wiki failures without altering core pipeline status. Acceptance: failure path logs warnings plus audit payloads.
7. **Propagate scaffold fields across stacks (WU-07)** -- Update nine stack `template-spec.yaml` files with consistent `wiki_update` defaults and contract reference. Acceptance: each stack spec includes identical wiki_update schema and values.
8. **Extend parity validator and tests (WU-08)** -- Update `Templates/tools/validate-parity.ts` and `Templates/tools/validate-parity.test.ts` for wiki contract and stack wiki field coverage. Acceptance: parity commands pass on compliant fixtures and fail with actionable messages on drift.
9. **Document operator workflow and governance (WU-09)** -- Update `README.md` and `Templates/README.md` with trigger, scope, failure, output, approval, and governance procedures plus validation commands. Acceptance: docs pass command/path verification and support deterministic maintainer workflow.
10. **Record Stage 3 traceability** -- Append Stage 3 completion evidence in `agent-progress/` with links to this spec and implementation artifacts. Acceptance: stage gate evidence references every WU PBI.

## 8. Out of Scope
- Direct wiki publication API implementation to GitHub or GHES wiki endpoints.
- Historical backfill of prior completed tasks into wiki artifacts.
- Changes to non-wiki parity capabilities in `Templates/shared/capability-parity-matrix.yaml` outside required linkage updates.
- Changes to template stack catalog composition in `Templates/shared/stack-catalog.yaml`.
- Runtime feature additions outside Stage 7 post-task wiki flow.

## Stage 3 Gate Decision
Status: **PASS with clarifications pending**.

Rationale:
- All nine WU backlog items now have implementation-ready PBIs with functional AC, technical AC, test criteria, ordered steps, and out-of-scope boundaries.
- Defaults are locked to required values from the context package.
- Open questions are precise and non-ambiguous; implementation can start on contract, scaffold, and parity paths while finalizing artifact and idempotency details.

## Backlog Traceability
- Source backlog: `Design/wiki-update-backlog.md`
- Source architecture: `Design/wiki-update-architecture.md`
- This implementation-ready Stage 3 spec: `Design/wiki-update-pbi.md`
