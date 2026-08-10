# Research: pocketDev substrate expectations for Pack

**Ticket:** [#16](https://github.com/nholder88/ai-agent-workflows/issues/16)  
**Map:** [#14](https://github.com/nholder88/ai-agent-workflows/issues/14)  
**Question:** What does pocketDev_Autocode already assume about the Pack (`ai-agent-workflows` / cuddly-robot) as substrate — invocation shape, required agents/skills, governance, cost/logging hooks, OpenSpec/intake interfaces — that a Loop-host Seam contract must respect or deliberately diverge from?  
**Sources:** read-only against `C:\Users\nhold\Code\pocketDev_Autocode` and this Pack repo (as of research branch creation).  
**Constraint:** facts and observed assumptions only — does **not** lock Seam contract fields (that is [#19](https://github.com/nholder88/ai-agent-workflows/issues/19)).

---

## Verdict

pocketDev treats Pack as the **agent foundation / substrate** for specialist agents, skills, and stack templates, while treating **orchestration, cost ledger, hooks, OpenSpec Propose, and runner adapters as host-owned novel build**. There is **no runtime import or call into Pack in pocketDev `src/` today**; the assumptions live in product docs (`project-context.md`, `docs/SPEC.md` §17) and are partly superseded in language by the Unified Work Loop glossary (`CONTEXT.md`, `docs/prd/unified-work-loop.md`). A Seam contract must therefore reconcile three layers: (1) SPEC’s Pack-as-substrate plan, (2) Pack’s actual installable surface today, (3) UWL’s runner-agnostic Iteration Context Pack + Usage Record that do not name Pack agents.

---

## 1. Invocation / substrate assumptions

### 1.1 Named role of Pack

| Claim | Source |
|-------|--------|
| “The agent foundation (`ai-agent-workflows` repo) is the substrate.” Novel pieces listed as host work: Python hooks, OpenSpec Propose stack, model routing skill, cost ledger, container architecture. | `pocketDev_Autocode/project-context.md` (Strategic Direction) |
| Prefer Pack over third-party agent frameworks where Pack can do the job. | `pocketDev_Autocode/project-context.md` (Priority Order #3) |
| Path A recommendation: use Pack as agent foundation rather than autonomous-dev; wrap novel pieces around it. | `pocketDev_Autocode/docs/SPEC.md` §16 Path A / Recommendation; §17 intro |
| Pack supplies agents, `system-reverse-engineer`, skills (incl. `system-reconstruction`), 10 stack templates, phase output contracts, Node CLI installer. It does **not** yet supply hooks, OpenSpec Propose resolution, model-routing skill, cost-ledger skill, UI recording, Impeccable onboarding. | `pocketDev_Autocode/docs/SPEC.md` §16 Path A table row for `ai-agent-workflows`; §17.1 / §17.8 |

### 1.2 Distribution / resolution shape (host plan)

SPEC assumes the container resolves Pack once at startup, then every agent spawn reads definitions from that path:

| Mechanism | Detail | Source |
|-----------|--------|--------|
| Option A (preferred long-term) | `npm install -g @nholder/ai-agent-workflows`; `AGENT_WORKFLOWS_PATH=$(npm root -g)/@nholder/ai-agent-workflows` | `docs/SPEC.md` §17.2 |
| Option B (start here) | Clone `AGENT_WORKFLOWS_REPO=https://github.com/nholder88/ai-agent-workflows` (+ optional `AGENT_WORKFLOWS_REF`) to `/opt/agent-workflows/` | `docs/SPEC.md` §17.2 |
| Package contents assumed | `agents/`, `skills/`, `templates/` | `docs/SPEC.md` §17.2 |
| Installer role | Pack’s Node CLI installer “becomes the container’s agent deployment mechanism” | `docs/SPEC.md` §17.1, §17.8 |

**Pack reality (drift):** published / intended package name is `@nholder88/ai-agent-workflows-tools` with bin `ai-agent-pack-install` (`cuddly-robot/package.json`, `README.md`). Install targets are IDE/user paths via `cli/tools.registry.json` (Claude Code, VS Code, Cursor, Pi) — not a documented `AGENT_WORKFLOWS_PATH` runtime contract. No Pack code path implements container startup install.

### 1.3 Spawn / invoke shape (host plan vs host code)

**SPEC fleet spawn (legacy execution atom — Task Bundle):**

- Orchestrator creates a git worktree per task, then spawns headless Claude Code with model + **task-context-bundle** + workdir (`docs/SPEC.md` §12.6).
- Agent receives at spawn: task description + AC, `instruction_file`, `openspec_file`, PBI ID, `openspec_delta` (`docs/SPEC.md` §7.5).
- UI agents additionally get `PRODUCT.md` / `DESIGN.md` injected; missing `DESIGN.md` blocks dispatch (`docs/SPEC.md` §6.4).

**Unified Work Loop (current domain language):**

- Host owns lifecycle; **Agent Runner** only maps Effort → model, invokes CLI, emits Usage Record (`pocketDev_Autocode/CONTEXT.md` Agent Runner; `docs/prd/unified-work-loop.md`).
- Every Iteration gets a fixed **Iteration Context Pack** (PBI + OpenSpec delta + instruction files + Accumulated Loop Context + inlined TDD rules + Caveman Directive) — adapters must not invent their own pack (`CONTEXT.md` Iteration Context Pack; implemented in `src/orchestrator/services/iteration-context-pack.service.ts`).
- Port shape today: `AgentRunnerInvokeRequest { effort, pbiId, featureId, contextPack, repoPath }` — **no Pack agent id, skill id, or workflows path field** (`src/orchestrator/ports/agent-runner.port.ts`).

**Observed code fact:** `rg` over `pocketDev_Autocode/src` finds **zero** references to `ai-agent-workflows`, `AGENT_WORKFLOWS`, Pack agent filenames, or Pack skill paths. Substrate coupling is documentary, not implemented.

### 1.4 Agents / skills Pack is assumed to provide

SPEC §17.1 enumerates Pack agents mapped into the Autocode pipeline (orchestrator, pbi-clarifier, idea-validator, assumption-reviewer, architect-planner, system-reverse-engineer, implementers, test specialists, appsec/code-review sentinels, docker-architect, docs/wiki agents, etc.).

SPEC §17.6 lists **nine skills to add into Pack** (not yet claimed as present): `openspec-propose`, `openspec-decompose`, `antipattern-check`, `model-router`, `cost-ledger`, `ui-recording`, `impeccable-onboard`, `project-context-interview`, `features-yaml-sync`.

**Pack inventory at research time:**

| Item | Count / status |
|------|----------------|
| `agents/*.agent.md` | 32 (SPEC text still says “31”) |
| Skills present that SPEC relies on | `system-reconstruction`, `requirements-clarification`, `implementation-spec`, plus impl/test/review/data skills per `skills/agent-to-skill-map.md` |
| SPEC §17.6 “skills to add” | **all nine missing** under `skills/` |
| `Documentation/phase-output-contracts.md` | **absent** (SPEC §17.1 / §17.8 still cites it as Pack-owned ledger foundation) |

Pack’s own OpenSpec bridge is the `implementation-spec` agent/skill (`openspec propose` / `openspec apply` embedded commands) — a different surface than Autocode’s conversational OpenSpec Propose engine (`docs/SPEC.md` §4.2).

---

## 2. Governance assumptions

| Assumption | Who owns it in pocketDev docs | Source |
|------------|-------------------------------|--------|
| Root + per-area `CLAUDE.md` with required sections; no dispatch without approved instruction file | Host policy; content may be seeded from Pack templates | `docs/SPEC.md` §1 invariants, §3; openspec `agent-governance-baseline` |
| `.sdlc/project.json`, `.sdlc/model-routing.json`, PR body template, `claude-review.yml` | Host bootstrap / governance baseline | openspec `agent-governance-baseline`, `repo-bootstrap-scaffold` |
| Orchestrator pipeline `validate → plan → clarify → implement → test → document → [AppSec + review] → fix → wiki` exists on Pack and must be **enhanced** with Propose check, anti-pattern intersection, model routing, tooling gaps, TDD gate, Impeccable polish/harden, cost emission, features.yaml sync | Pack agent enhanced by host wiring | `docs/SPEC.md` §17.3; Pack `agents/orchestrator.agent.md` (current stages include OpenSpec Propose/Apply and parallel reviews — not identical to SPEC’s enhancement list) |
| Python Claude Code hooks (`enforce_tdd`, `enforce_storybook`, `enforce_antipatterns`, `enforce_project_context`, `emit_usage_event`, `stop_quality_gate`, `unified_pre_tool`) are the **primary gap** Pack does not have; host builds them | Explicitly **not** Pack today | `docs/SPEC.md` §17.4; `project-context.md` Known Constraints (hooks only cover Claude Code lifecycle) |
| Anti-patterns never auto-fixed; Critical patterns inject scoped refactor tasks | Host policy | `docs/SPEC.md` §1, §5 |
| YOLO / auto-merge off by default | Host policy | `project-context.md` |

Pack-side governance that already exists independently: agent YAML handoffs, agent↔skill map, thin agent wrappers + skill-owned procedures (`skills/agent-to-skill-map.md`), template parity tooling (`templates/`).

---

## 3. Cost / token / logging assumptions

### 3.1 What SPEC assigns to Pack

- `cost-ledger` skill to append JSONL with the §8 schema (`docs/SPEC.md` §17.6).
- `emit_usage_event.py` hook on `SubagentStop` writing `.sdlc/usage/{pbi-id}.jsonl` (`docs/SPEC.md` §17.4).
- Phase output contracts in Pack as “foundation of the cost ledger event schema” (`docs/SPEC.md` §17.1) — **file missing in Pack**.

### 3.2 What host already owns (implemented / specified)

| Concern | Host location |
|---------|----------------|
| Normalized **Usage Record** (`event: iteration_usage`, runner_id, resolved_model, pbi_id, feature_id, tokens_in/out, duration_seconds, credits) | `src/orchestrator/ports/usage-record.ts`; glossary `CONTEXT.md` Usage Record |
| Effort-agnostic model mapping inside runners | ADR-0003 via `docs/prd/unified-work-loop.md`; `AgentRunnerPort.mapEffortToModel` |
| Pricing fetch/cache/fallback (7-day cache, estimates labeled) | `docs/SPEC.md` §9; openspec archive `pricing-cache` / `PricingService` |
| Broad step taxonomy for ledger events (propose turns, onboarding, decomposition, agents, review, UI recording, …) | `docs/SPEC.md` §8.1–8.4 |
| Structured logging for orchestrator API | openspec archive `fastify-structured-logging` |

**Implication for Seam (observation only):** host cost rollups are already runner-normalized and Iteration/Feature-keyed. SPEC’s older plan for Pack-owned `cost-ledger` skill + phase-output contracts is **aspirational and currently inconsistent** with UWL code. A Seam may need a host-owned usage emit surface whether or not Pack ever ships `cost-ledger`.

---

## 4. Intake / OpenSpec assumptions

| Layer | Assumption | Source |
|-------|------------|--------|
| Intake paths | Backlog files under `.sdlc/backlog/`, web UI, optional GH/ADO — not Pack | `docs/SPEC.md` §13; overview §1 |
| Propose engine | Conversational, role-aware (Director/PM/Dev), resolution stack reading `features.yaml`, `CLAUDE.md`, `PRODUCT.md`/`DESIGN.md`, `project-context.md`; output `.sdlc/proposals/{id}.json` with `openspec_delta_preview`, `ready_for_decomposition` | `docs/SPEC.md` §4.2 |
| Pack seed for Propose | `pbi-clarifier` → enhance to OpenSpec Propose; `idea-validator` → director-level Propose | `docs/SPEC.md` §17.5 |
| Pack OpenSpec command path | Pack `implementation-spec` runs embedded `openspec propose` / `openspec apply` with artifact/state envelopes | Pack `agents/implementation-spec.agent.md`, `skills/implementation-spec/SKILL.md` |
| Per-area features | `.sdlc/openspec/{area}/features.yaml`; task/PBI records `openspec_delta` (modifies/adds); post-merge sync | `docs/SPEC.md` §4, §7.3, §4.5 |
| Brownfield seed | Parallel `system-reverse-engineer` + `system-reconstruction` → CLAUDE.md + features.yaml + anti-pattern registry | `docs/SPEC.md` §3; Pack skill `system-reconstruction` |
| UWL Iteration pack | PBI carries `openspec_delta`; assembled into prompt text by host | `iteration-context-pack.service.ts` |
| UWL out of scope note | “Full OpenSpec Propose redesign (intake stays; execution atom changes)” | `docs/prd/unified-work-loop.md` Out of Scope |

**Tension:** SPEC wants Pack agents enhanced into Propose; Pack already embeds a different OpenSpec propose/apply workflow in `implementation-spec`; UWL Iteration packing only needs delta fields on the PBI, not a Pack skill invoke.

---

## 5. Implied Seam-relevant fields (not locked)

These are **recurring data/control points** pocketDev already talks about when wrapping Pack or running Iterations. Listed for grilling (#19), not as a contract:

1. **Substrate location** — how the host resolves Pack content (`AGENT_WORKFLOWS_PATH` / repo clone / npm package id + version / IDE install root).
2. **Agent identity at invoke** — Pack agent name (SPEC) vs anonymous Iteration + context pack (UWL port today).
3. **Skill identity / whether skills are invoked** — SPEC adds Pack skills; UWL inlines Caveman/TDD and tests that packs do not mention skill invoke (`iteration-context-pack.service.test.ts`).
4. **Context bundle contents** — instruction file(s), openspec file/delta, AC, PBI/Feature ids, optional PRODUCT/DESIGN, accumulated loop context, failure knowledge.
5. **Gate predicates** — instruction file present; UI DESIGN/PRODUCT present; TDD/Storybook/anti-pattern hooks (host).
6. **Effort** — runner-agnostic XS–L on PBI; Model Router backfill only (`CONTEXT.md`).
7. **Resolved model + runner_id** — emitted on Usage Record after adapter mapping.
8. **Usage Record / ledger event** — at least Iteration-normalized fields; SPEC also wants finer step taxonomy and propose-session trees.
9. **OpenSpec delta** — `modifies[]` / `adds[]` (and proposal preview equivalents).
10. **Repo / functional-area scope** — one area per task/PBI; path to area `CLAUDE.md`.
11. **Handoff / pipeline stage** — Pack orchestrator stages vs host Feature Run stages (approve ≠ start).
12. **Artifacts paths** — `.sdlc/usage/`, `.sdlc/proposals/`, `.sdlc/openspec/`, recordings, progress summaries.

---

## 6. pocketDev-specific vs generalizable

### More pocketDev-specific (reference host choices)

- Container + host mount + Portainer-style long-running orchestrator (`docs/SPEC.md` §12).
- `.sdlc/**` layout, backlog watcher, Sprint rollup CLI, YOLO/cancellation/5-sprint nudge policies.
- Impeccable + Storybook + Playwright UI recording as first-class gates/tasks.
- Anti-pattern registry file intersection at decomposition.
- Dual history: SPEC Task Bundle / worktree fleet vs UWL Feature Bundle / sequential same-repo Feature Branch.
- Caveman Directive inlined by host (product-specific prompt policy).
- Pricing cache against Anthropic API inside the container.

### More generalizable to any Loop host

- Treat Pack as **installable agent/skill/template substrate**, not the loop engine.
- Need a defined **resolution path** for agent/skill definitions (version pin).
- Need a **context package** at each coding run (instructions + work unit + delta + priors).
- Need **normalized usage** (tokens/time/cost proxy) keyed to work-unit ids.
- Need **governance gates** before dispatch (instruction files / equivalent).
- Need an **OpenSpec or equivalent delta** handoff between planning and implementation.
- Need clarity on **who owns Propose** vs who owns Apply/implement (Pack `implementation-spec` vs host Propose).
- Need demarcation: host = lifecycle/runners/ledger; Pack = specialist procedures and templates — matching Pack `CONTEXT.md` definitions of Loop host vs Pack.

### Documented drifts a Seam must not paper over

| Topic | SPEC / older plan | Current Pack or UWL |
|-------|-------------------|---------------------|
| Agent count | “31” | 32 agent files |
| Package name | `@nholder/ai-agent-workflows` | `@nholder88/ai-agent-workflows-tools` |
| Phase output contracts | Cited on Pack | File not in Pack |
| Cost ledger skill | To be added to Pack | Host `UsageRecord` already defined |
| Execution atom | Task Bundle + worktrees | Feature Bundle + PBI Iteration |
| Runtime Pack coupling | Assumed at spawn | Not present in `src/` |
| OpenSpec | Host Propose + Pack enhancements | Pack `implementation-spec` propose/apply already |

---

## Sources index

**pocketDev_Autocode**

- `project-context.md`
- `CONTEXT.md`
- `docs/SPEC.md` (§1, §3–4, §6–9, §12, §16–17)
- `docs/prd/unified-work-loop.md`
- `openspec/specs/agent-governance-baseline/spec.md`
- `openspec/specs/repo-bootstrap-scaffold/spec.md`
- `openspec/specs/container-runtime-baseline/spec.md`
- `openspec/changes/archive/2026-05-16-pricing-cache/specs/pricing-service/spec.md`
- `src/orchestrator/ports/agent-runner.port.ts`
- `src/orchestrator/ports/usage-record.ts`
- `src/orchestrator/services/iteration-context-pack.service.ts` (+ tests/constants)

**Pack (cuddly-robot / ai-agent-workflows)**

- `CONTEXT.md` (Pack / Loop host / Seam vocabulary)
- `README.md`, `package.json`
- `agents/orchestrator.agent.md`, `agents/implementation-spec.agent.md`
- `skills/agent-to-skill-map.md`, `skills/implementation-spec/SKILL.md`
- `cli/pack-install.ts`, `cli/lib/adapters.ts`, `cli/tools.registry.json`
- Inventory check of `agents/` and `skills/` on research branch

---

## Non-goals of this note

- Locking Seam field names or schemas (#19).
- Deciding orchestrator fate (#18) or spine demarcation (#17).
- Implementing Pack or pocketDev changes.
