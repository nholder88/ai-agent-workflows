# Research: UWL designed vs built in Autocode

**Ticket:** [UWL designed vs built in Autocode](https://github.com/nholder88/ai-agent-workflows/issues/23) (map: [#21](https://github.com/nholder88/ai-agent-workflows/issues/21))  
**Branch:** `research/uwl-designed-vs-built`  
**Scope:** For Autocode’s Unified Work Loop, what is designed (PRD, CONTEXT, ADRs) versus what is actually built and wired (Feature Bundle, Feature Run, Agent Runner, Iteration Context Pack, Test Baseline, Spiral Exit, HTTP routes, glue orchestrator). Facts only; no Pack↔Autocode coupling design.  
**Primary sources:** `C:\Users\nhold\Code\pocketDev_Autocode` — `CONTEXT.md`, `docs/prd/unified-work-loop.md`, `docs/adr/0003`–`0005`, `src/orchestrator/services/*`, `src/orchestrator/ports/*`, `src/orchestrator/runners/*`, `src/orchestrator/routes/*`, `src/orchestrator/api/app.ts`, `features.yaml`, `agent-progress/pipeline-uwl-*`.

---

## Design corpus (what “designed” means)

| Artifact | Role |
|---|---|
| [`CONTEXT.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/CONTEXT.md) | Canonical glossary: Unified Work Loop, Feature Bundle, Feature Run, Iteration, Agent Runner, Test Baseline, Spiral Exit / Recovery / Escalation, Iteration Context Pack, Usage Record, etc. |
| [`docs/prd/unified-work-loop.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/docs/prd/unified-work-loop.md) | PRD: replace Task Bundle execution with Feature Bundle → Feature Run; lists modules, ADRs, user stories, out of scope. |
| [`docs/adr/0003-effort-runner-agnostic-usage-record.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/docs/adr/0003-effort-runner-agnostic-usage-record.md) | Effort runner-agnostic; adapters map models; one Usage Record shape. |
| [`docs/adr/0004-same-repo-sequential-cross-repo-parallel.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/docs/adr/0004-same-repo-sequential-cross-repo-parallel.md) | Same-repo sequential; cross-repo always parallel; no cross-repo dispatch `depends_on`. |
| [`docs/adr/0005-spiral-exit-reset-recovery-pbi.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/docs/adr/0005-spiral-exit-reset-recovery-pbi.md) | Spiral Exit → Last Good Tip reset; Recovery PBI + failure knowledge; one Escalation then hard-stop. |

PRD-named modules (implementation decisions): Feature Bundle service; Unified Work Loop orchestrator; Agent Runner ports (Claude/Copilot/Cursor); Test Baseline service; Iteration Context Pack assembler; Feature Run web UI + thin CLI; Bootstrap migrator (`prd.json` → Feature Bundles).

**Sources:** [`docs/prd/unified-work-loop.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/docs/prd/unified-work-loop.md) L54–68; ADRs 0003–0005; [`CONTEXT.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/CONTEXT.md) glossary sections.

`features.yaml` (root) is a greenfield OpenSpec list with `last_updated: 2026-05-13` and features largely `status: planned`; it does not enumerate UWL modules by name. UWL slice delivery notes live under `agent-progress/pipeline-uwl-*.md` instead.

**Sources:** [`features.yaml`](file:///C:/Users/nhold/Code/pocketDev_Autocode/features.yaml) L1–7; `agent-progress/pipeline-uwl-12` … `pipeline-uwl-25`.

---

## Gap map (designed vs built vs wired)

Status legend:

- **Designed** — present in CONTEXT / PRD / ADR.
- **Built** — TypeScript module exists with tests (or clear persistence) under `src/orchestrator/`.
- **Wired** — registered in Fastify `buildApp()` and/or called by a loop orchestrator / UI / CLI that drives an Iteration.

| Capability | Designed | Built | Wired | Evidence |
|---|---|---|---|---|
| Feature Bundle persist + approve | Yes | Yes | Partial | Service: create/get/approve/updatePbi/reorder; idle edit clears approval when no feature-run file. HTTP: only `PATCH /api/feature-bundles/:featureId/approve`. No create/update/reorder routes. |
| Approve ≠ start agents | Yes | Yes (approve does not start run) | Yes for approve path | Approve route persists `approved: true` only; test asserts no `.sdlc/feature-runs` created. |
| Idle edit clears approval | Yes | Yes | Service-only | `applyIdleEditApprovalReset` in Feature Bundle service; no HTTP for update/reorder. |
| Feature Run start (runner + base + branch) | Yes | Partial | No | `FeatureRunService.start` asserts approval, creates `feature/{id}` via `GitRunnerPort.createBranch`, writes `.sdlc/feature-runs/{id}.json` with `status: 'started'`. No HTTP route; not registered in `app.ts`. Does not walk PBIs. |
| Default Agent Runner (project settings) | Yes | Yes | Yes | `GET`/`PUT /api/projects/:name/settings/default-agent-runner` in projects routes; Feature Run reads `default_agent_runner` from `.sdlc/project.json`. |
| Agent Runner port | Yes (ADR-0003) | Yes | No loop caller | `AgentRunnerPort` + `UsageRecord` / `buildUsageRecord`. |
| Claude / Copilot / Cursor runners | Yes | Yes | No loop caller | `ClaudeAgentRunner`, `CopilotAgentRunner`, `CursorAgentRunner` (+ `FakeAgentRunner` for tests). Effort→model tables match ADR-0003 (Cursor → `composer-1` for all Efforts). |
| Test Baseline capture + compare | Yes | Yes | No | `TestBaselineService.capture` / `compare`; Vitest `FAIL` fingerprint parse. No routes; not invoked by a run loop. |
| Iteration Context Pack | Yes | Yes | No | `IterationContextPackService.assemble` / `formatPack`; inlines Caveman + TDD constants; optional failure knowledge; prior summaries from `progress.txt`. No routes; not invoked by a run loop. |
| Model Router (backfill Effort only) | Yes | Yes | No | `ModelRouterService.backfillEffort` reads `.sdlc/model-routing.json`. Not wired to Feature Bundle create/approve. |
| Unified Work Loop / Sequential Dispatch glue | Yes | **No** | **No** | No `unified-work-loop` / `sequential-dispatch` / `spiral-exit` service under `src/orchestrator/services/`. No caller chains Feature Run → baseline → context pack → agent runner → commit → next PBI. |
| Spiral Exit state machine | Yes (ADR-0005) | **No** | **No** | No Spiral Exit / Recovery Escalation / Last Good Tip / Loop Failure Snapshot implementation in `src/`. Only `FailureKnowledge` input shape on Iteration Context Pack for Recovery PBIs. |
| Recovery PBI draft + approval gate | Yes | **No** (pack can *consume* failure knowledge if supplied) | **No** | Pack supports `is_recovery` / `failure_knowledge`; no service drafts Recovery PBIs or reopens Human Review Gate. |
| Iteration Budget + safety ceiling | Yes | **No** | **No** | No Iteration Budget type/service in orchestrator sources (grep over `src/` empty for SpiralExit/IterationBudget loop types). |
| Parallel Fleet (cross-repo) | Yes (ADR-0004) | **No** | **No** | No multi-repo scheduler; Feature Run is single-`repoPath`. |
| One PR per repo on success | Yes | **No** | **No** | `GitRunnerPort` only exposes `createBranch`. |
| Feature Run web UI | Yes (primary control plane) | **No** | **No** | No matches for Feature Run / Feature Bundle / default agent runner in `src/web`. |
| Thin Feature Run CLI | Yes | **No** | **No** | No matches under `cli/` or `bin/`. |
| Bootstrap migrator (`prd.json` → Feature Bundles) | Yes | **No** | **No** | PRD lists migrator; no migrator module found; Bootstrap Loop still designed as legacy path to retire after dogfood. |
| OpenSpec `features.yaml` as UWL inventory | N/A (PRD says intake stays) | Stale vs UWL code | N/A | Root `features.yaml` still phase-1–N planned greenfield; UWL progress tracked in `agent-progress/pipeline-uwl-*`. |

---

## Built pieces (detail)

### Feature Bundle

- Persist under `{repo}/.sdlc/feature-bundles/feat-NNNN.json`.
- PBI Effort union: `XS | S | M | L`.
- `approve` sets `bundle.approved = true`.
- `updatePbi` / `reorderPbis` clear approval when bundle is idle (no `{repo}/.sdlc/feature-runs/{featureId}.json`).
- `assertApprovedForFeatureRun` used by Feature Run start.

**Sources:** [`feature-bundle.service.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/services/feature-bundle.service.ts); [`routes/feature-bundles.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/routes/feature-bundles.ts); [`api/feature-bundles.test.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/api/feature-bundles.test.ts).

### Feature Run (start only)

- Requires approved bundle; refuses second start (`FeatureRunAlreadyStartedError`).
- Resolves Agent Runner from options or project `default_agent_runner` (else `claude`).
- Resolves Feature Base from options or project `default_branch` (else `main`).
- Creates branch `feature/{featureId}` from base; persists run record `status: 'started'`.
- Does **not** select next PBI, run baselines, invoke runners, commit, open PRs, or manage Spiral Exit.

**Sources:** [`feature-run.service.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/services/feature-run.service.ts); [`git-runner.port.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/ports/git-runner.port.ts).

### Agent Runner port + adapters

- Port: `mapEffortToModel`, `invoke`, `emitUsageRecord`.
- Shared `UsageRecord` shape: `runner_id`, `resolved_model`, `pbi_id`, `feature_id`, tokens, duration, credits.
- Claude: Haiku/Sonnet/Opus by Effort; Copilot: GPT-4.1-mini / GPT-4.1; Cursor: Composer for all Efforts.

**Sources:** [`agent-runner.port.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/ports/agent-runner.port.ts); [`usage-record.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/ports/usage-record.ts); runners under [`src/orchestrator/runners/`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/runners/); ADR-0003.

### Test Baseline

- Full-suite command default `npm test` (or `.sdlc/project.json` → `test_baseline.full_suite_command`).
- Capture returns exit code + failure fingerprints; compare diffs new failures as regressions.

**Sources:** [`test-baseline.service.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/services/test-baseline.service.ts).

### Iteration Context Pack

- Fixed pack: Caveman Directive, mandatory TDD rules, PBI + OpenSpec delta, instruction files, accumulated loop context, optional Recovery failure knowledge.
- `formatPack` produces the string intended for `AgentRunnerInvokeRequest.contextPack`.
- No production caller assembles then invokes a runner.

**Sources:** [`iteration-context-pack.service.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/services/iteration-context-pack.service.ts); [`iteration-context-pack.constants.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/services/iteration-context-pack.constants.ts); [`agent-progress/pipeline-uwl-25-recovery-failure-knowledge.md`](file:///C:/Users/nhold/Code/pocketDev_Autocode/agent-progress/pipeline-uwl-25-recovery-failure-knowledge.md).

---

## HTTP surface actually registered

From [`api/app.ts`](file:///C:/Users/nhold/Code/pocketDev_Autocode/src/orchestrator/api/app.ts):

| Route module | UWL-relevant endpoints |
|---|---|
| `featureBundleRoutes` | `PATCH /api/feature-bundles/:featureId/approve` |
| `projectRoutes` | `GET`/`PUT .../settings/default-agent-runner` |
| health / pricing / validate | Unrelated to Feature Run walk |

Not registered: Feature Bundle create/update/reorder; Feature Run start/monitor; Test Baseline; Iteration Context Pack; Agent Runner invoke; Spiral Exit / Recovery approve.

---

## Glue orchestrator (absent)

PRD testing decisions require a “Unified Work Loop orchestrator (including Spiral Exit state machine).” Under `src/orchestrator/services/` the UWL-related files present are:

- `feature-bundle.service.ts`
- `feature-run.service.ts`
- `test-baseline.service.ts`
- `iteration-context-pack.service.ts`
- `model-router.service.ts`

plus unrelated services (`project`, `pricing`, `area-scanner`, `claudemd-validator`, `health`).

There is no module that sequences: approved Feature Run → per-PBI Iteration (pre-baseline → context pack → Agent Runner → commit → post-baseline → Accumulated Loop Context) → Spiral Exit / Recovery → PR open.

**Sources:** PRD L56–57, L74; directory listing of `src/orchestrator/services/`; ripgrep over `src/` for `SpiralExit` / `UnifiedWorkLoop` / `SequentialDispatch` / `IterationBudget` (no production matches; only a test string mentioning “spiral” in context-pack tests).

---

## ADR coverage vs code

| ADR | Design claim | Code reality |
|---|---|---|
| 0003 | Effort agnostic; three runners; Usage Record | Port + three adapters + Fake + shared Usage Record **built**; not driven by a Feature Run loop. |
| 0004 | Same-repo sequential; cross-repo parallel; no cross-repo `depends_on` | **Not implemented** as a scheduler; Feature Run is single-repo start-only. |
| 0005 | Spiral Exit, Last Good Tip, Recovery PBI, Escalation, hard-stop, Loop Failure Snapshot | **Not implemented** as state machine; Context Pack can format failure knowledge if a caller supplies it. |

---

## Verdict (facts)

Autocode has a **complete design** for Unified Work Loop (CONTEXT + PRD + ADR-0003/0004/0005) and a **partial component library** (Feature Bundle, Feature Run start, Agent Runner adapters, Test Baseline, Iteration Context Pack, Model Router backfill, Default Agent Runner settings API).  

What is **missing** for an executable loop: the glue orchestrator, Spiral Exit/Recovery machinery, Iteration Budget, Parallel Fleet, success PR open, Bootstrap migrator, Feature Run HTTP/CLI/UI, and wiring of the built services into one Iteration walk. Approve-at-gate is the only Feature Bundle HTTP path; Feature Run exists as a service that stops after branch creation + `started` persistence.

---

## Source index

| Path | Used for |
|---|---|
| `pocketDev_Autocode/CONTEXT.md` | Glossary / designed terms |
| `pocketDev_Autocode/docs/prd/unified-work-loop.md` | PRD modules, stories, out of scope |
| `pocketDev_Autocode/docs/adr/0003-effort-runner-agnostic-usage-record.md` | Runner/Usage design |
| `pocketDev_Autocode/docs/adr/0004-same-repo-sequential-cross-repo-parallel.md` | Dispatch design |
| `pocketDev_Autocode/docs/adr/0005-spiral-exit-reset-recovery-pbi.md` | Spiral Exit design |
| `pocketDev_Autocode/src/orchestrator/services/feature-bundle.service.ts` | Bundle built behavior |
| `pocketDev_Autocode/src/orchestrator/services/feature-run.service.ts` | Run start built behavior |
| `pocketDev_Autocode/src/orchestrator/services/test-baseline.service.ts` | Baseline built behavior |
| `pocketDev_Autocode/src/orchestrator/services/iteration-context-pack.service.ts` | Pack built behavior |
| `pocketDev_Autocode/src/orchestrator/services/model-router.service.ts` | Effort backfill built behavior |
| `pocketDev_Autocode/src/orchestrator/ports/agent-runner.port.ts` | Runner port |
| `pocketDev_Autocode/src/orchestrator/ports/usage-record.ts` | Usage Record shape |
| `pocketDev_Autocode/src/orchestrator/ports/git-runner.port.ts` | Git ops currently limited to createBranch |
| `pocketDev_Autocode/src/orchestrator/runners/*.ts` | Claude/Copilot/Cursor/Fake adapters |
| `pocketDev_Autocode/src/orchestrator/routes/feature-bundles.ts` | Approve HTTP |
| `pocketDev_Autocode/src/orchestrator/routes/projects.ts` | Default Agent Runner HTTP |
| `pocketDev_Autocode/src/orchestrator/api/app.ts` | Route registration |
| `pocketDev_Autocode/features.yaml` | OpenSpec inventory (no UWL module list) |
| `pocketDev_Autocode/agent-progress/pipeline-uwl-*.md` | Slice completion notes for built pieces |
