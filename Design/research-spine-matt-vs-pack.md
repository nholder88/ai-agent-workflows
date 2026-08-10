# Research: Spine internals — Matt skills vs Pack skills

**Ticket:** [Spine internals: Matt skills vs Pack skills](https://github.com/nholder88/ai-agent-workflows/issues/15) (map: [#14](https://github.com/nholder88/ai-agent-workflows/issues/14))  
**Branch:** `research/spine-matt-vs-pack`  
**Scope:** Pipeline spine only — fog/idea → reviewed code. No Demarcation lock; facts for the grilling ticket that follows.  
**Primary sources:** Matt skill trees under `C:\Users\nhold\.claude\skills\` (mirrored at `C:\Users\nhold\.agents\skills\`); Pack under `C:\Users\nhold\Code\cuddly-robot\` (`agents/`, `skills/`, `templates/pi/orchestrator.md`, root `CONTEXT.md`).

---

## Name resolution (ticket aliases → current Pack tree)

Issue #15 names some Pack units that **do not exist as directories on current `main`**. The live tree documents the rename/split:

| Ticket / legacy name | Current Pack owner (on disk) | Evidence |
|---|---|---|
| `orchestrator` / `workflow-orchestration` | `agents/orchestrator.agent.md` (standalone; **no skill**). `skills/implementation-routing/SKILL.md` still *names* `workflow-orchestration`, but that skill path is absent. | [`skills/agent-to-skill-map.md`](../skills/agent-to-skill-map.md) L9, L44–45; [`agents/orchestrator.agent.md`](../agents/orchestrator.agent.md); [`skills/implementation-routing/SKILL.md`](../skills/implementation-routing/SKILL.md) L30, L134 |
| `architecture-backlog-planning` | `architecture-planning` (+ agent `architect-planner`) | [`skills/architecture-planning/SKILL.md`](../skills/architecture-planning/SKILL.md); map L11 |
| `implementation-from-spec` | Split: propose → `implementation-spec`; apply → language `impl-*` skills (orchestrator Stage 4). Map notes prior consolidated name. | map L48; [`skills/implementation-spec/SKILL.md`](../skills/implementation-spec/SKILL.md); orchestrator Stages 3.5–4 |
| `test-generation` | Split: `test-backend-unit`, `test-frontend-unit`, `test-e2e-ui` | map L48, L27–29; skills README phase family Testing |
| `code-review-gate` | `code-review` (+ agent `code-review-sentinel`) | [`skills/code-review/SKILL.md`](../skills/code-review/SKILL.md); map L33 |

Pack vocabulary for Composition is defined in root [`CONTEXT.md`](../CONTEXT.md) (Pack, Matt skills, Pipeline spine, Handoff point, Demarcation — terms only; no ownership lock).

---

## Stage-by-stage spine map

Spine stages below follow Pack’s orchestrator diagram ([`agents/orchestrator.agent.md`](../agents/orchestrator.agent.md) L51–101) aligned to Matt’s main flow / on-ramps ([`ask-matt/SKILL.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md) L13–46).

### Fog / mega-idea (pre-pipeline)

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | `/wayfinder` — charts a shared **map** (`wayfinder:map`) of **decision** tickets; plan-by-default, decisions not deliverables. On-ramp when effort is too large for one session. | No equivalent fog-map skill. Intake is Stage 0 **classification** of an already-stated task (`NEW_PROJECT` / `NEW_FEATURE` / …). Optional pre-pipeline: `business-idea-validation` (phase `—`, outside spine sequencing). |
| **Procedure** | Chart destination via grilling + domain-modeling; breadth-first fog; create map + child tickets; fire research subagents; later resolve one ticket per session. | Stage 0: workspace mode, inventory, task type, complexity, context available; decide skips. |
| **Gates** | Ticket claim (assignee); frontier = open + unblocked + unclaimed; HITL tickets require live human answers. Map done when way is clear. | Classification recorded in pipeline log; skip decisions must be logged (never silent). |
| **Artifacts** | Map issue body (Destination, Notes, Decisions so far, Not yet specified, Out of scope); child issues; research files on throwaway `research/*` branches. | `agent-progress/runs/pipeline-[task-slug].md` created at Stage 0; todo list `Pipeline: [task-slug]`. |

**Sources:** Matt [`wayfinder/SKILL.md`](file:///C:/Users/nhold/.claude/skills/wayfinder/SKILL.md); Pack orchestrator Stage 0; [`skills/README.md`](../skills/README.md) Pre-pipeline row; [`skills/business-idea-validation/SKILL.md`](../skills/business-idea-validation/SKILL.md).

---

### Sharpen idea / interview (HITL)

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | `/grilling` primitive; wrappers `/grill-with-docs` (stateful: `CONTEXT.md` + ADRs via `/domain-modeling`) and `/grill-me` (stateless). `/ask-matt` routes “working in a repo → grill-with-docs first”. | No interview-orchestrated grilling skill. Closest: Stage 1 `assumption-review` (artifact risk review) and Stage 3 `requirements-clarification` (vagueness detectors → questions then PBI spec). Clarification gates may use Cursor `AskQuestion` when available. |
| **Procedure** | Design-tree rounds; ask whole frontier with recommended answers; agent finds facts via subagents; decisions wait on user. Done when frontier empty + user confirms shared understanding. | Assumption-review: six-category scan, severity tags, specific questions; **does not edit** the artifact. Requirements-clarification: four detectors, then Mode 1/2 spec production; questions before spec if blocked. |
| **Gates** | Session not done until frontier empty and user confirms. Wayfinder grilling tickets are HITL (agent must not answer for the human). | Stage 1: no `Blocker` findings. Stage 3: Functional AC (happy/error/edge), technical AC, ordered steps, non-empty Out of scope; open questions → `STAGE_3_WAITING`. |
| **Artifacts** | `CONTEXT.md` glossary; `docs/adr/*` when ADR criteria met; conversation as primary source until `/to-spec`. | Assumption Review Report (chat + progress log). PBI Specification report (sections 1–8). |

**Sources:** Matt [`grilling/SKILL.md`](file:///C:/Users/nhold/.claude/skills/grilling/SKILL.md), [`grill-with-docs/SKILL.md`](file:///C:/Users/nhold/.claude/skills/grill-with-docs/SKILL.md), [`domain-modeling/SKILL.md`](file:///C:/Users/nhold/.claude/skills/domain-modeling/SKILL.md), [`ask-matt/SKILL.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md); Pack [`assumption-review/SKILL.md`](../skills/assumption-review/SKILL.md), [`requirements-clarification/SKILL.md`](../skills/requirements-clarification/SKILL.md); orchestrator Stages 1 & 3.

---

### Docs / codebase readiness before design

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | Implicit: explore repo inside `/to-spec` / `/to-tickets`; domain-modeling cross-checks code vs language. No dedicated Stage 0.5. | Stage 0.5 Documentation Discovery Preflight; optional `system-reconstruction` via handoff “Reverse engineer first”. |
| **Gates** | (none as a named stage) | Do not proceed to Stage 1/2/4 until docs found, reverse-engineer completed, or user confirms continue without docs. |
| **Artifacts** | Glossary/ADRs as above. | `DOC_COVERAGE`, `DOC_PATHS_FOUND`, reverse-engineer flags in pipeline log; reconstruction outputs under Design/docs patterns. |

**Sources:** Pack orchestrator Stage 0.5; [`skills/system-reconstruction/SKILL.md`](../skills/system-reconstruction/SKILL.md); Matt [`to-spec/SKILL.md`](file:///C:/Users/nhold/.claude/skills/to-spec/SKILL.md) step 1.

---

### Architecture & backlog

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | Not a dedicated spine skill. Architecture decisions appear as ADRs via domain-modeling; implementation decisions land inside `/to-spec` “Implementation Decisions” (no file paths). Large structural fog → wayfinder tickets / grilling. Related but off-spine: `/improve-codebase-architecture`, `/codebase-design` vocabulary. | Stage 2 `architecture-planning` / `architect-planner`. |
| **Procedure** | (distributed across grill → to-spec) | Gather context → analyze → optional feasibility gate → clarify → produce architecture/design/backlog → self-review checklist. |
| **Gates** | User approval of seams before `/to-spec` proceeds past seam check. | Orchestrator: ≥1 Mermaid diagram; backlog ≥1 task per affected component; each task has AC + completion checklist. Retry once then escalate. |
| **Artifacts** | Spec sections; ADRs; wayfinder decisions. | Architecture doc path, optional design doc, backlog table, ADR list, Mermaid diagrams; Architecture & Planning Report. |

**Sources:** Matt [`to-spec/SKILL.md`](file:///C:/Users/nhold/.claude/skills/to-spec/SKILL.md), [`ask-matt/SKILL.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md); Pack [`architecture-planning/SKILL.md`](../skills/architecture-planning/SKILL.md); orchestrator Stage 2.

---

### Spec / tickets (buildable plan)

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | `/to-spec` then `/to-tickets`. Wayfinder **hands off** here when the map clears (explicitly: do not loop map into `/implement`). | Stage 3 `requirements-clarification` → Stage 3.5 `implementation-spec` (`openspec propose`). |
| **Procedure** | to-spec: synthesize conversation (no interview); check test seams with user; publish issue with `ready-for-agent`. to-tickets: vertical tracer-bullet slices + blocking edges; quiz user; publish. Context hygiene: keep grill→spec→tickets in one window; clear between implements. | Stage 3.5 produces three artifacts: Delta Specs, Design Decisions (conditional), Task Breakdown + AC traceability; OpenSpec state machine fields on orchestrator. |
| **Gates** | User confirms seams (to-spec); user approves ticket granularity/edges (to-tickets). | Every PBI AC ↔ ≥1 delta requirement; each requirement has WHEN/THEN; task breakdown covers requirements; open questions resolved or surfaced; design decisions when cross-cutting. Max 2 propose iterations then escalate. |
| **Artifacts** | Tracker issue (Problem/Solution/User Stories/Implementation Decisions/Testing Decisions/Out of Scope); tickets with AC + Blocked by (local `.scratch/...` or native tracker links). | PBI Specification; Implementation Spec Report; OpenSpec artifact paths in pipeline flags. |

**Sources:** Matt [`to-spec/SKILL.md`](file:///C:/Users/nhold/.claude/skills/to-spec/SKILL.md), [`to-tickets/SKILL.md`](file:///C:/Users/nhold/.claude/skills/to-tickets/SKILL.md), [`ask-matt/SKILL.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md) L42–46; Pack [`implementation-spec/SKILL.md`](../skills/implementation-spec/SKILL.md); orchestrator Stage 3.5.

---

### Implementation

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | `/implement` (thin): use `/tdd` at pre-agreed seams; typecheck; full suite once; then `/code-review`; commit. | Stage 4 `openspec apply` via `implementation-spec` agent dispatching `impl-*` / specialists; TypeScript mixed scope may go through `implementation-routing`. |
| **Procedure** | TDD red→green at confirmed seams only; one slice per cycle; refactor deferred to review. | Apply task breakdown in order; language table selects implementer; build/lint/AC mapping; template parity validator if `templates/**` touched. |
| **Gates** | Seams confirmed before tests; failing test before green; `/implement` ends with `/code-review`. | Build passes; no new lint errors; AC coverage; parity validator when templates change; apply completion report. Retry once then escalate. |
| **Artifacts** | Code + tests on current branch; commits. | Implementation Complete Report (phase family); checked-off task breakdown; progress log entries. |

**Sources:** Matt [`implement/SKILL.md`](file:///C:/Users/nhold/.claude/skills/implement/SKILL.md), [`tdd/SKILL.md`](file:///C:/Users/nhold/.claude/skills/tdd/SKILL.md); Pack orchestrator Stage 4; [`implementation-routing/SKILL.md`](../skills/implementation-routing/SKILL.md); [`implementation-spec/SKILL.md`](../skills/implementation-spec/SKILL.md).

---

### UI quality (conditional)

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | No dedicated spine UI-gate skill (prototype detour via `/prototype` + `/handoff` for design questions). | Stage 4.5 `ui-ux-review` / `ui-ux-sentinel` when UI files changed. |
| **Gates** | — | Zero Blockers; Theme Compliance Pass/Conditional; UX pillars ≥ 3/5; zero a11y Blockers. Fix loop max 2 then escalate. Ordered **before** tests. |
| **Artifacts** | Prototype branch `prototype/<name>` as primary source. | UI/UX review report; findings table for fix routing. |

**Sources:** Matt [`ask-matt/SKILL.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md) prototype branch; Pack orchestrator Stage 4.5; [`ui-ux-review/SKILL.md`](../skills/ui-ux-review/SKILL.md).

---

### Testing

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | Embedded in `/tdd` (+ to-spec “Testing Decisions”). No separate post-implement test-generation skill on the main flow. | Stages 5a/5b/5c: `test-backend-unit`, `test-frontend-unit`, `test-e2e-ui` (parallel tracks where applicable). |
| **Procedure** | Behavior at public seams; anti-patterns listed; confirm seams with user first. | Detect stack → write → run → Test Completion Report. E2E: Playwright BDD + visual regression. |
| **Gates** | Red before green; no unconfirmed seams. | All new tests pass; AC scenario coverage; E2E covers primary workflow when run. Fix loop max 2 via implementer. |
| **Artifacts** | Tests co-located / project convention; seam list agreed in session. | Test Completion Reports; `.feature` files under acceptance layout for E2E. |

**Sources:** Matt [`tdd/SKILL.md`](file:///C:/Users/nhold/.claude/skills/tdd/SKILL.md); Pack test skills + orchestrator Stage 5.

---

### Documentation (in-code)

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | Not on main flow spine (glossary/ADRs are earlier). | Stage 6 `code-documentation` / `code-documenter` (conditional). |
| **Gates** | — | Every exported/public symbol documented; no docs removed. Skip for trivial/bugfix. |
| **Artifacts** | — | Language-native doc comments; optional `docs/api/`; Documentation Completion Report. |

**Sources:** Pack orchestrator Stage 6; [`code-documentation/SKILL.md`](../skills/code-documentation/SKILL.md).

---

### Code review (end of spine)

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | `/code-review` — two parallel sub-agents: **Standards** (repo docs + Fowler smell baseline) and **Spec** (originating issue/spec). Invoked by `/implement` or standalone. | Stage 7b `code-review` / `code-review-sentinel`; Stage 7a `appsec-audit` in parallel; merged Stage 7 gate; then optional non-blocking 7.5 wiki. |
| **Procedure** | Pin fixed point → identify spec + standards → spawn both axes → aggregate under separate headings (no cross-axis rerank). | Four pillars (Completeness, Correctness, Conciseness, Readability); severity Critical/Recommendation/Nitpick; **does not edit code**. Orchestrator fix loop up to 3. |
| **Gates** | No numeric PASS/FAIL table in Matt skill; report findings per axis. | Skill PASS: 0 Critical, all pillars ≥ 3/5, no unaddressed regressions. **Orchestrator Stage 7b raises the bar:** Completeness ≥ 4, Correctness ≥ 4, Overall ≥ 4, 0 Critical — then merge with AppSec. |
| **Artifacts** | Side-by-side Standards + Spec reports in chat. | Code Review Report + gate verdict; AppSec `Review/security-audit-report.md`; pipeline completion report. |

**Sources:** Matt [`code-review/SKILL.md`](file:///C:/Users/nhold/.claude/skills/code-review/SKILL.md); Pack [`code-review/SKILL.md`](../skills/code-review/SKILL.md) L110–121; orchestrator Stage 7 L485–513 (score thresholds).

---

### Cross-cutting: routing & session handoff

| | **Matt** | **Pack** |
|---|---|---|
| **Owner** | `/ask-matt` — flow router (main flow, on-ramps, vocabulary, phase boundaries). `/handoff` — portable markdown to OS temp dir for new harness/directory/colleague/mid-phase fork. | `orchestrator` — multi-stage controller with context packages, fix loops, escalation protocol. Agent frontmatter `handoffs:` between specialists. `implementation-routing` for TS scope split. |
| **Artifacts** | Handoff file outside workspace; suggested skills section. | Lean Context Package per stage; agent-progress append templates; specialist handoff prompts. |

**Sources:** Matt [`ask-matt/SKILL.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md), [`handoff/SKILL.md`](file:///C:/Users/nhold/.claude/skills/handoff/SKILL.md), [`ask-matt/PHASE-BOUNDARIES.md`](file:///C:/Users/nhold/.claude/skills/ask-matt/PHASE-BOUNDARIES.md); Pack orchestrator Context Package + Escalation; agent files under `agents/`.

---

## Overlaps

Facts where both systems claim similar spine work (potential toe-stepping if composed naively):

1. **Idea sharpening / risk surfacing** — Matt `/grilling` (+ docs) vs Pack Stage 1 assumption-review + Stage 3 clarification questions. Both produce specific questions; Matt is conversational design-tree HITL; Pack is severity-tagged artifact review + AC engine. Same *job class*, different procedures and outputs.  
   Sources: grilling; assumption-review; requirements-clarification.

2. **Spec production** — Matt `/to-spec` (user stories, implementation/testing decisions, tracker issue) vs Pack Stage 3 PBI Specification + Stage 3.5 OpenSpec delta/design/tasks. Both aim at an implementable contract; templates and normative language differ; Pack forbids inventing requirements; Matt synthesizes conversation without interviewing.  
   Sources: to-spec; requirements-clarification Output Contract; implementation-spec.

3. **Work breakdown with dependencies** — Matt `/to-tickets` (vertical tracer bullets + blocking edges, user quiz) vs Pack architecture backlog (foundation-first, component tasks) + Stage 3.5 numbered task breakdown with file paths. Overlap in “slice the work”; slicing heuristics differ (vertical demoable vs component/foundation-first).  
   Sources: to-tickets; architecture-planning Backlog Generation; implementation-spec Task Breakdown.

4. **Implementation** — Matt `/implement`+`/tdd` vs Pack Stage 4 `impl-*` + routing. Both write production code and run tests; Pack adds multi-agent language dispatch, OpenSpec apply state, build/parity gates; Matt mandates seam-confirmed TDD and ends with its own review skill.  
   Sources: implement; tdd; orchestrator Stage 4.

5. **Code review** — Both named `code-review`. Axes differ (Matt Standards∥Spec vs Pack four pillars + scores). Pack skill embeds a PASS/FAIL gate and orchestrator adds AppSec + fix loops; Matt does not own fix loops.  
   Sources: both code-review skills; orchestrator Stage 7.

6. **Orchestration / routing** — Matt `/ask-matt` routes humans through skills; Pack `orchestrator` routes agents through stages. Both are “who runs next”; one is skill-flow, one is pipeline controller.  
   Sources: ask-matt; orchestrator.agent.md; skills README (orchestrator has no skill).

7. **Stale Pack cross-link** — `implementation-routing` tells agents to use `workflow-orchestration` for multi-stage work, but that skill is not present; the live controller is `orchestrator.agent.md`. Fact of naming drift inside Pack.  
   Sources: implementation-routing L30/L134; agent-to-skill-map L9, L44–45.

---

## Handoff candidates

Named places where one system’s documented exit matches the other’s documented entry (composition seams — **not** a Demarcation decision):

| Candidate Handoff point | From (finishes) | Into (starts) | Why the sources line up |
|---|---|---|---|
| **H1 — Map clears → buildable plan** | Matt `/wayfinder` (map done; decisions indexed) | Matt `/to-spec` *or* Pack Stage 2/3/3.5 | ask-matt: wayfinder “hands off, it doesn’t build”; merge at `/to-spec`. Pack stages consume a task/spec, not a decision map. |
| **H2 — Shared understanding → Pack assumption gate** | Matt `/grill-with-docs` (frontier empty, CONTEXT/ADRs written) | Pack Stage 1 `assumption-review` on the resulting docs | Grill produces durable glossary/ADRs; assumption-review reviews artifacts without rewriting them. |
| **H3 — Matt spec/tickets → Pack propose/apply** | Matt `/to-spec` + `/to-tickets` (`ready-for-agent`) | Pack Stage 3.5 propose / Stage 4 apply | Matt tickets are agent-grabbable; Pack OpenSpec expects PBI/AC inputs and produces delta+tasks. |
| **H4 — Pack OpenSpec artifacts → Matt `/implement`+`/tdd`** | Pack Stage 3.5 task breakdown + delta scenarios | Matt `/implement` (TDD at seams from Testing Decisions / scenarios) | implement takes “spec or tickets”; Pack scenarios are WHEN/THEN test cases. |
| **H5 — Matt `/implement` → Pack UI / test / review stages** | Matt implement+tdd (code exists) | Pack 4.5 → 5 → 7 (and optional 6) | Pack UI/test/review stages are post-implementation gates Matt main flow does not sequence. |
| **H6 — Either implementer → Matt `/code-review` *or* Pack 7b** | Code on a branch vs a fixed point | Review skill/agent | Both review diffs; choosing which review (or stacking) is a Demarcation question for #17, not settled here. |
| **H7 — Session / harness boundary** | Matt `/handoff` or phase-boundary `/compact`/`/clear` | Pack orchestrator resume / specialist agent | handoff is portable markdown; orchestrator resumes from pipeline progress file + context package. Different mechanisms. |
| **H8 — Pack Stage 0 classification → skip Matt fog tools** | Pack Stage 0 when task is already precise / TRIVIAL | (skip wayfinder/grill) | Orchestrator skip rules already omit Stages 1–3 for precise/trivial work — factual alignment with ask-matt “well-scoped feature ≠ wayfinder”. |

---

## Gaps

### Pack-strong (present in Pack spine; absent or thin in Matt spine)

- Multi-stage **automated** pipeline controller with skip matrix, fix-loop budgets, escalation template, and append-only `agent-progress/runs/pipeline-*.md` ([`orchestrator.agent.md`](../agents/orchestrator.agent.md)).
- Stage 0.5 **documentation preflight** + reverse-engineer gate.
- Structured **assumption severity** (Blocker/Risk/Observation) as a stage gate.
- Heavy **architecture doc + ADR + threat model + observability + backlog** package ([`architecture-planning/SKILL.md`](../skills/architecture-planning/SKILL.md)).
- **OpenSpec propose/apply** contract (delta specs, design decisions, AC traceability, apply dispatch) ([`implementation-spec/SKILL.md`](../skills/implementation-spec/SKILL.md)).
- Language/framework **specialist implementers** and `implementation-routing`.
- Dedicated **UI/UX quality gate** before tests ([`ui-ux-review/SKILL.md`](../skills/ui-ux-review/SKILL.md)).
- Split **test generation** specialists (backend / frontend / E2E BDD) as post-implement stages.
- Stage 6 **in-code documentation** specialist.
- Parallel **AppSec** gate with wiki post-hook (7a / 7.5) — adjacent to spine end.

### Matt-strong (present in Matt spine; absent or thin in Pack spine)

- **Wayfinding** for foggy multi-session decision maps ([`wayfinder/SKILL.md`](file:///C:/Users/nhold/.claude/skills/wayfinder/SKILL.md)).
- Relentless **HITL grilling** as the default sharpening primitive ([`grilling/SKILL.md`](file:///C:/Users/nhold/.claude/skills/grilling/SKILL.md)).
- Stateful **glossary + ADR discipline** while interviewing ([`grill-with-docs`](file:///C:/Users/nhold/.claude/skills/grill-with-docs/SKILL.md) + [`domain-modeling`](file:///C:/Users/nhold/.claude/skills/domain-modeling/SKILL.md)).
- Explicit **main-flow router** and phase-boundary decision tree ([`ask-matt`](file:///C:/Users/nhold/.claude/skills/ask-matt/SKILL.md), `PHASE-BOUNDARIES.md`).
- **Tracer-bullet tickets** with user quiz and blocking edges as the default decomposition ([`to-tickets`](file:///C:/Users/nhold/.claude/skills/to-tickets/SKILL.md)).
- **Seam-confirmed TDD** rules and anti-patterns as the implementation method ([`tdd`](file:///C:/Users/nhold/.claude/skills/tdd/SKILL.md)).
- **Two-axis** Standards∥Spec review with smell baseline ([Matt `code-review`](file:///C:/Users/nhold/.claude/skills/code-review/SKILL.md)).
- Portable **`/handoff`** document for harness/directory/colleague boundaries ([`handoff`](file:///C:/Users/nhold/.claude/skills/handoff/SKILL.md)).
- Prototype detour wired into the main flow for questions that need runnable answers.

### Internal consistency notes (facts, not recommendations)

- Pack **code-review skill** PASS thresholds (pillars ≥ 3) vs **orchestrator** Stage 7b thresholds (Completeness/Correctness/Overall ≥ 4) differ in the same repo.  
  Sources: [`skills/code-review/SKILL.md`](../skills/code-review/SKILL.md) L110–115; [`agents/orchestrator.agent.md`](../agents/orchestrator.agent.md) L485–491.
- Pack agents reference skills under `.github/skills/...` while the repo library lives at `skills/` (installer may copy; path in agent files is not the workspace path).  
  Sources: e.g. [`agents/assumption-reviewer.agent.md`](../agents/assumption-reviewer.agent.md) L30.
- Matt `.claude/skills` and `.agents/skills` copies of compared skills are present in parallel install locations; this research cited `.claude/skills` paths after verifying `wayfinder` content matches across both.

---

## Out of scope for this file

- Locking **Demarcation** (owned by map ticket #17).
- Specialist-layer comparison (language/DB/UI/container) beyond noting Pack’s Stage 4 specialist table exists.
- Loop-host Seam contract (#19).
- Orchestrator fate after Demarcation (#18).
