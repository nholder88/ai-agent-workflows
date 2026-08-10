# Research: SPEC §17 Pack integration plan vs reality

**Ticket:** [#24](https://github.com/nholder88/ai-agent-workflows/issues/24)  
**Map:** [#21](https://github.com/nholder88/ai-agent-workflows/issues/21)  
**Delta from:** [#16](https://github.com/nholder88/ai-agent-workflows/issues/16) → [`Design/research-pocketdev-pack-substrate.md`](https://github.com/nholder88/ai-agent-workflows/blob/research/pocketdev-pack-substrate/Design/research-pocketdev-pack-substrate.md) on `research/pocketdev-pack-substrate`  
**Question:** Building on #16, what does `docs/SPEC.md` §17 still require for Pack integration (npm vs git clone, `AGENT_WORKFLOWS_*`, orchestrator enhancements, hooks, skills) versus what exists in Pack install surface and Autocode container/runtime today — and which gaps are Pack-owned vs Autocode-owned?  
**Sources:** read-only against `C:\Users\nhold\Code\pocketDev_Autocode` and this Pack repo (branch creation time).  
**Constraint:** facts only — does **not** lock Seam fields or Demarcation (#25+).

---

## Verdict

§17 still describes a **container-resolved Pack substrate** (npm Option A or git-clone Option B → `AGENT_WORKFLOWS_*`, then spawn-time agent/skill resolution) plus Pack content work (orchestrator stage additions, nine skills, agent enhancements, CLAUDE.md-from-templates) and a Python hook layer. **None of the §17.2 distribution/runtime wiring exists in Autocode today** (`docker-compose.yml`, `.env.example`, `Dockerfile`/`start.sh`, `package.json`, and `src/` have zero `AGENT_WORKFLOWS_*` / Pack package references). Pack’s real install surface remains the **IDE-path CLI** (`ai-agent-pack-install` → Claude/VS Code/Cursor/Pi user dirs), package name **`@nholder88/ai-agent-workflows-tools`**, and **no public npm package** (registry 404 for both SPEC and Pack names). Hooks named in §17.4 exist in Autocode as **placeholders that always return 0**, contradicting `features.yaml`’s claim they are “Installed by agent-workflows npm package.” Prefer this note as a **delta on #16**; substrate assumptions already covered there are not re-derived.

---

## Delta from #16 (what changed / what this ticket adds)

| Topic | #16 finding (still true unless noted) | §17 gap focus here |
|-------|--------------------------------------|--------------------|
| Pack = documentary substrate; no `src/` coupling | Still true: `rg` over Autocode `src/` finds zero Pack / `AGENT_WORKFLOWS` refs | Confirms container/env also unwired |
| Package name drift SPEC `@nholder/ai-agent-workflows` vs Pack `@nholder88/ai-agent-workflows-tools` | Still true | Adds: neither name resolves on public npm (404); README still says private scoped publish pending |
| Installer targets IDE paths, not `AGENT_WORKFLOWS_PATH` | Still true (`cli/tools.registry.json`, `cli/pack-install.ts`) | Maps each §17.2 option to ownership |
| Nine §17.6 skills missing; phase-output contracts missing | Still true | Ownership column: Pack content gaps |
| Hooks “host builds / not in Pack” | **Updated:** Autocode `hooks/*.py` now exist but are stubs (`return 0`); Pack still has no hook implementation; Autocode `features.yaml` still says hooks installed by Pack npm package | Ownership tension documented below |
| UWL `AgentRunnerInvokeRequest` has no Pack agent/skill path | Still true (`agent-runner.port.ts`) | §17.3 “orchestrator.agent.md enhancements” vs host UWL gates remain dual tracks |
| Host already has Usage Record / model routing services | Still true (`usage-record.ts`, `model-router.service.ts`) | Conflicts with §17.6 Pack-owned `cost-ledger` / `model-router` skills |

---

## 1. What §17 still requires (checklist)

| § | Requirement (SPEC text) | Source |
|---|-------------------------|--------|
| 17 intro | Publish agents/skills as npm package; enhance orchestrator pipeline; add Python hooks; wire agents into decomposition/dispatch | `pocketDev_Autocode/docs/SPEC.md` §17 |
| 17.1 | Treat Pack agents, skills (incl. `system-reconstruction`), 10 stack templates, phase-output contracts, Node CLI installer as already-have substrate | §17.1 |
| 17.2 A | Publish as `@nholder/ai-agent-workflows` (or similar); container `npm install -g`; set `AGENT_WORKFLOWS_PATH=$(npm root -g)/…`; package ships `agents/`, `skills/`, `templates/` | §17.2 Option A |
| 17.2 B | Clone `AGENT_WORKFLOWS_REPO` (+ optional `AGENT_WORKFLOWS_REF`) to `/opt/agent-workflows/` at startup; start here, move to A later | §17.2 Option B |
| 17.3 | Inject Propose check, anti-pattern intersection, model routing, tooling gaps, Storybook/DESIGN injection, TDD gate, Impeccable polish/harden, Playwright recording, cost emission, features.yaml / anti-pattern / CLAUDE.md / sprint ledger updates into Pack `orchestrator` stages | §17.3 |
| 17.4 | Implement seven Claude Code lifecycle hooks (`enforce_tdd`, `enforce_storybook`, `enforce_antipatterns`, `enforce_project_context`, `emit_usage_event`, `stop_quality_gate`, `unified_pre_tool`) | §17.4 |
| 17.5 | Enhance `pbi-clarifier`, `idea-validator`, unit-test specialists (failing-test), `code-review-sentinel` (spec-aware checklist) | §17.5 |
| 17.6 | Add nine skills under Pack `skills/`, published with npm package | §17.6 |
| 17.7 | Map stack templates → area `CLAUDE.md` via `project-context-interview` + brownfield merge with `system-reconstruction` | §17.7 |
| 17.8 | Build path: Pack substrate free; add hooks, Propose enhancement, 9 skills, CLAUDE.md generator, **container/compose/UI**, **cost ledger + sprint rollup** | §17.8 |

---

## 2. Reality today

### 2.1 Pack install / publish surface

| Fact | Source |
|------|--------|
| Package `name`: `@nholder88/ai-agent-workflows-tools`; bin `ai-agent-pack-install` → `./bin/pack-install.mjs` | Pack `package.json` |
| `files` published contents: `agents`, `templates`, `skills`, `cli`, `bin` | Pack `package.json` |
| `publishConfig.access`: `restricted`; README: “Publish the package to npm” still unchecked; “private scoped module” | Pack `package.json`, `README.md` |
| Public registry lookup for `@nholder88/ai-agent-workflows-tools` and `@nholder/ai-agent-workflows`: **404 Not Found** | `npm view` against registry.npmjs.org (research time) |
| Installer copies agents into IDE/user paths (Claude `~/.claude/agents`, VS Code/Cursor User prompts, Pi agents) or local project relatives; optional `--workspace` for skills/templates | `cli/tools.registry.json`, `cli/pack-install.ts` help text |
| No Pack CLI flag or code path for `AGENT_WORKFLOWS_PATH`, `/opt/agent-workflows/`, or container startup install | `cli/pack-install.ts`, `cli/` (no matches) |
| 32 `agents/*.agent.md`; 10 stack template dirs under `templates/`; skills present do **not** include the nine §17.6 names | Pack tree inventory |
| `Documentation/phase-output-contracts.md`: **absent** | Pack tree |

### 2.2 Autocode container / runtime

| Fact | Source |
|------|--------|
| `docker-compose.yml` env: Anthropic/GitHub/ADO tokens, `REPOS_DIR`, agent concurrency, `VITE_API_BASE`, `LOG_LEVEL` — **no** `AGENT_WORKFLOWS_*` | Autocode `docker-compose.yml` |
| `.env.example`: same — **no** Pack env vars | Autocode `.env.example` |
| `package.json` dependencies: Fastify/React/Vite stack only — **no** Pack package dep | Autocode `package.json` |
| `Dockerfile`: Node 20 Alpine, Chromium, git/gh, `npm ci`, build, pip installs anthropic/pyyaml/dotenv; **does not** clone Pack or `npm install -g` Pack | Autocode `Dockerfile` |
| `start.sh`: privilege drop then `node dist/orchestrator/api/index.js` — **no** Pack resolve step | Autocode `start.sh` |
| Orchestrator invoke port: `{ effort, pbiId, featureId, contextPack, repoPath }` — no workflows path / agent id | `src/orchestrator/ports/agent-runner.port.ts` |
| Host already implements model-routing + usage-record + pricing services (UWL-oriented) | `model-router.service.ts`, `usage-record.ts`, `pricing.service.ts` |
| All seven §17.4 hook filenames exist under `hooks/` as placeholders returning `0` | Autocode `hooks/*.py` |
| Product feature text still claims hooks installed by “agent-workflows npm package” into `.hooks/` in managed repos | Autocode `features.yaml` (hook feature entry_points) |
| Iteration context pack inlines TDD rules naming `enforce_tdd.py` | `iteration-context-pack.constants.ts` |

---

## 3. Gap table — Pack-owned vs Autocode-owned

Ownership = who must ship the artifact for §17’s stated plan to become true. Where docs disagree, both sides are marked and the conflict noted. This is **not** Demarcation locking (#25).

| Gap | §17 expectation | Reality | Owner | Notes |
|-----|-----------------|---------|-------|-------|
| npm package identity + publish | `@nholder/ai-agent-workflows` (or similar) on npm with `agents/` `skills/` `templates/` | Name is `@nholder88/ai-agent-workflows-tools`; public npm 404; `publishConfig.access: restricted` | **Pack** | Align name + first publish; #26 may refine host-facing publish path |
| Package contents usable as runtime root | Spawns resolve definitions from installed package path | Package `files` include agents/skills/templates; no host consumes them | **Pack** (ship) + **Autocode** (consume) | Content ready enough for path resolution; consumption missing |
| IDE installer as “container agent deployment” | §17.1/§17.8: Node CLI becomes container deployment | CLI only installs to IDE/user/workspace paths | **Pack** if CLI grows a host/container mode; else **Autocode** uses clone/npm path without IDE install | Current CLI does not satisfy §17.2 |
| Option A: global npm install at container start + `AGENT_WORKFLOWS_PATH` | Dockerfile/compose/startup | Absent | **Autocode** | Depends on Pack publish existing |
| Option B: `AGENT_WORKFLOWS_REPO` / `AGENT_WORKFLOWS_REF` → `/opt/agent-workflows/` | compose env + startup clone | Absent from compose/env/start.sh | **Autocode** | SPEC recommended start path |
| Spawn-time resolution from Pack path | Every agent spawn reads definitions from resolved path | UWL runners take `contextPack` string only; no Pack path | **Autocode** | May diverge from §17 if UWL stays agent-anonymous (#23/#25) |
| Phase output contracts file | Pack `Documentation/phase-output-contracts.md` | Missing | **Pack** | Cited as cost-ledger foundation in §17.1 |
| §17.3 orchestrator stage injections | Enhance Pack `orchestrator.agent.md` pipeline | Pack orchestrator exists; SPEC addition list not implemented as listed | **Pack** (agent text) | Host may instead enforce via UWL Feature Run — dual track, not decided here |
| §17.5 agent enhancements | Propose stack, director Propose, failing-test, spec-aware review | Agent files exist; §17.5 enhancements not verified as present (no matching skill names; enhancement text is SPEC-side) | **Pack** | Content work on Pack agents |
| §17.6 nine skills | Under Pack `skills/`, published with package | **None** of the nine directory names present | **Pack** | Host already has TS `model-router` + Usage Record — skill vs host-service overlap |
| §17.7 template → `CLAUDE.md` | `project-context-interview` skill + template map | Skill missing; templates exist on Pack | **Pack** (skill + mapping) + **Autocode** (onboarding invoke) | Templates alone do not generate area CLAUDE.md |
| §17.4 hook **implementations** | Blocking/warning Claude Code hooks | Autocode stubs only; Pack has no hooks | **Autocode** per `project-context.md` / #16; **conflict:** `features.yaml` says Pack npm installs them | Treat stub→real as Autocode until Demarcation says otherwise |
| Hook **distribution into managed repos** | `.hooks/` in managed repos via Pack npm (features.yaml) | Not implemented either side | **Conflict** Pack vs Autocode | Resolve under #25/#26/#27 — not locked here |
| Container + compose + web UI | §17.8 host build | Partial: image/compose/API/UI exist; Pack wiring absent | **Autocode** | |
| Cost ledger + sprint rollup | §17.8 host build; §17.6 also lists Pack `cost-ledger` skill | Host Usage Record port exists; Pack skill absent; hook emitter stub | **Autocode** for ledger runtime; Pack skill optional/duplicate per #16 | |
| Python deps in image for hooks | Dockerfile pip installs | Present | **Autocode** | Ready for real hook code |

---

## 4. Ownership summary (for #25 grilling)

**Clearly Pack-owned gaps**

1. Publishable package (name, access, registry presence).  
2. Missing §17.6 skills and §17.1 phase-output contracts.  
3. §17.5 agent definition enhancements.  
4. §17.3 additions *if* they remain edits to Pack `orchestrator.agent.md`.  
5. Any host-mode install contract beyond IDE paths (only if Pack keeps owning “deployment mechanism”).

**Clearly Autocode-owned gaps**

1. `AGENT_WORKFLOWS_REPO` / `REF` / `PATH` env + startup resolve (Option B then A).  
2. Wiring spawn/Iteration path to resolved Pack content (or deliberate non-use under UWL).  
3. Turning `hooks/*.py` placeholders into real gates; container already has Python.  
4. Cost ledger / sprint rollup / runner usage emission beyond stubs.  
5. Onboarding flow that invokes template→CLAUDE.md generation.

**Documented ownership conflicts (do not resolve in this ticket)**

| Conflict | Pack-leaning source | Autocode-leaning source |
|----------|--------------------|-------------------------|
| Who ships hooks into managed repos | `features.yaml`: “Installed by agent-workflows npm package” | `project-context.md` + SPEC §17.4 “new build” / primary gap; stubs live in Autocode `hooks/` |
| Who owns `model-router` / `cost-ledger` | §17.6 Pack skills | Autocode `model-router.service.ts` + `UsageRecord` |
| Who owns pipeline gates in §17.3 | Pack orchestrator stage list | UWL Feature Run + Iteration Context Pack (agent-anonymous) |

---

## 5. Sources index

**Prior research**

- `Design/research-pocketdev-pack-substrate.md` on `origin/research/pocketdev-pack-substrate` (#16)

**Autocode (`C:\Users\nhold\Code\pocketDev_Autocode`)**

- `docs/SPEC.md` §17 (and §17.1–§17.8)
- `project-context.md` (Strategic Direction — substrate vs novel pieces)
- `Dockerfile`, `docker-compose.yml`, `.env.example`, `package.json`, `start.sh`
- `hooks/*.py` (seven placeholders)
- `features.yaml` (hook entry_points / “Installed by agent-workflows npm package”)
- `src/orchestrator/ports/agent-runner.port.ts`, `usage-record.ts`
- `src/orchestrator/services/model-router.service.ts`, `iteration-context-pack.constants.ts`

**Pack (this repo)**

- `package.json`, `README.md`
- `cli/pack-install.ts`, `cli/tools.registry.json`
- Inventory: `agents/` (32), `skills/` (no §17.6 names), `templates/` (10 stacks), missing `Documentation/phase-output-contracts.md`
- `npm view` registry checks for `@nholder88/ai-agent-workflows-tools` and `@nholder/ai-agent-workflows`

---

## Non-goals of this note

- Locking Pack↔Autocode Demarcation (#25) or publish path decision (#26).
- Seam field locking / Matt spine work.
- Implementing either repo’s change list.
- Re-deriving full substrate assumptions already in #16.
