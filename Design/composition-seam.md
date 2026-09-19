# Loop-Host Seam Contract

## Purpose

This Seam contract defines what a **Loop host** must call, receive, and log to plug into the Pack without copying PocketDev internals or requiring a named Pack agent on every run. Adopters building autonomous runners (such as pocketDev_Autocode) can implement this contract to invoke the Pack across coding runs with full observability, while keeping the Pack host-agnostic and avoiding lock-in to a specific Loop-host implementation.

**Audience:** Loop-host authors, Pack maintainers, and adopters integrating autonomous runners with the Pack.

## Invoke Shape
    10|
A Loop host invokes the Pack by supplying a **context package** that includes:

- **Instructions**: Plain-language task description or goal
- **Acceptance criteria** (AC): Observable outcomes that define done
- **Planning delta**: Prior grill docs, spec decisions, or context changes since the last run
- **Priors**: References to earlier work, tickets, or related context
- **Inlined Caveman**: Thrift obligations for autonomous runs (simplicity, no premature abstraction, conservative dependencies)
- **Inlined TDD obligation**: Red → green → refactor. Write or extend a failing functional test BEFORE production code. Minimum per new behavior: happy path, one negative case, one edge case.

    20|The context package is self-contained: Pack agents execute from the package contents without requiring skill-invoke quirks or external Caveman/TDD skill lookups.

## Required Resolve Fields

To resolve and invoke the Pack, a Loop host must supply:

- **`AGENT_WORKFLOWS_PATH`** (environment variable or config): Absolute path to the Pack installation root, so the host can locate Pack agents, skills, and templates without hardcoding paths
- **`repo_path`**: Absolute path to the repository the Pack will operate on
- **Work unit ids**: Identifiers for the work being performed (e.g., ticket id, issue number, or internal run id)
    30|- **Effort**: Estimated or budgeted effort for the run (e.g., story points, hour estimate, or complexity label)
- **Context package**: The full invoke payload described above (instructions, AC, planning delta, priors, inlined Caveman, TDD)

## Required Call Fields

When invoking a Pack agent or skill, the Loop host must provide:

- **Context package** (as above)
- **Work unit ids** (echoed from resolve fields)
- **Effort** (echoed from resolve fields)
    40|
Pack agent/skill ids are **optional** on invoke. If the host does not specify a named agent or skill, the Pack orchestrator or default entry point applies.

## Required Usage Fields

After each Pack run, the Loop host **must** log the following usage fields for observability and spend tracking:

- **`tokens_in`**: Input tokens consumed (LLM requests)
- **`tokens_out`**: Output tokens generated (LLM responses)
- **`tokens_cache_read`**: Cache-hit tokens read (0 if no cache hits; 0 is explicitly allowed)
    50|- **`tokens_cache_write`**: Cache-write tokens written (0 if no cache writes; 0 is explicitly allowed)
- **`credits`**: Cost in credits (or `null` if not applicable or not yet resolved)
- **`duration_seconds`**: Wall-clock duration of the run in seconds
- **`runner_id`**: Identifier for the runner instance or host that executed the run
- **`resolved_model`**: The actual LLM model used (e.g., `claude-sonnet-3.5`, `gpt-4`)
- **`work_unit_ids`**: Echoed work unit ids from the invoke
- **`effort`**: Echoed effort from the invoke

These fields enable spend dashboards, cost attribution, and performance analysis without requiring adopters to reverse-engineer PocketDev logging or invent parallel observability systems.

    60|**Note on cache tokens:** Cache read/write fields are required even when the values are zero. This ensures usage records are complete and adopters can distinguish "no cache activity" from "cache activity not recorded."

**Note on credits:** The `credits` field may be `null` if the cost is not yet available, not applicable to the runner, or billed through a separate system. Loop hosts should emit `null` rather than omitting the field when credits are unavailable.

## Optional v1

The following fields are **optional** for v1 Loop-host implementations:

- **Pack agent/skill id on invoke**: Hosts may invoke the Pack without specifying a named agent or skill. The Pack orchestrator or default entry point handles routing.
    70|- **Artifacts**: Loop hosts may optionally log artifact paths (e.g., generated code, test reports, screenshots) in usage records, but this is not required for v1.
- **Stage outcomes**: Detailed stage-by-stage success/failure tracking (e.g., "spec passed, implement failed") is optional. Hosts may log coarse-grained outcomes (e.g., "run succeeded") in v1.

## Non-Goals

This Seam contract does **not**:

- Require PocketDev_Autocode or any specific Loop-host implementation. The Pack remains usable without Autocode.
- Prescribe how Loop hosts store, aggregate, or visualize usage records. Observability systems are host-owned.
    80|- Dictate Loop-host invoke mechanisms (HTTP, CLI, in-process API, etc.). The contract defines **what** must be passed, not **how** to pass it.
- Replace or extend Matt skills. Loop hosts consume the Pack + Matt skills as separate dependencies; the Seam does not alter Matt skill contracts.
- Vendor or fork TDD. Matt /tdd remains the required implementation method; the Seam requires Loop hosts to inline the TDD obligation in the context package, not to implement TDD themselves.
- Change Pack agent standards or code-review criteria. The Seam is a Loop-host integration contract, not a Pack behavior change.

## Obtain Pack Path

Loop hosts discover the Pack installation via the **`AGENT_WORKFLOWS_PATH`** environment variable:

    90|```bash
export AGENT_WORKFLOWS_PATH=/path/to/ai-agent-workflows
```

This variable points to the Pack installation root (the directory containing `agents/`, `skills/`, `templates/`, and `CONTEXT.md`). Loop hosts read this variable at startup and use it to resolve Pack agent and skill paths.

**Example resolve logic:**

```typescript
const packRoot = process.env.AGENT_WORKFLOWS_PATH;
if (!packRoot) {
  100|  throw new Error('AGENT_WORKFLOWS_PATH environment variable not set');
}
const orchestratorPath = path.join(packRoot, 'agents', 'orchestrator');
```

Loop hosts should validate that `AGENT_WORKFLOWS_PATH` is set and points to a readable directory before attempting to invoke the Pack.

## Caveman and TDD for Loop Hosts

When invoking the Pack for autonomous runs, Loop hosts **must inline** Caveman and TDD obligations in the context package:

  110|**Caveman (thrift for loops):**
- Prefer simplicity over cleverness
- Avoid premature abstraction
- Use conservative dependencies (prefer standard library or well-known packages)
- Implement the simplest solution that meets AC

**TDD obligation:**
- Red → green → refactor
- Write or extend a failing functional test BEFORE production code
- Functional tests assert observable outcomes (state change, API/UI result, business rule), not mocks-only
  120|- Minimum per new behavior: happy path, one negative case, one edge case
- Add or extend E2E when the change is user-visible and the project has an E2E harness

Loop hosts inline these obligations as plain text in the context package's instructions or priors section. Pack agents execute against these obligations without requiring external skill lookups.

**Example context package snippet:**

```json
{
  "instructions": "Implement the user authentication flow",
  "ac": [
  130|    "Users can sign up with email and password",
    "Users can log in with valid credentials",
    "Invalid login attempts return clear error messages"
  ],
  "planning_delta": "...",
  "priors": "...",
  "caveman": "Prefer simplicity. No premature abstraction. Use standard library auth helpers where possible. Implement the simplest solution that meets AC.",
  "tdd": "Red → green → refactor. Write failing tests first. Minimum coverage: happy path (successful login), negative case (invalid credentials), edge case (empty password)."
}
  140|```

## Reference Implementation

**pocketDev_Autocode** is the reference Loop-host implementation for this Seam contract. Adopters building new Loop hosts can consult PocketDev's invoke and usage-logging logic as prior art, but the Pack does not require PocketDev and remains usable without Autocode.

**PocketDev reference points:**
- Context package assembly (inlining Caveman + TDD)
- Usage field extraction (tokens, cache, credits, duration, runner, model, effort, work unit ids)
- `AGENT_WORKFLOWS_PATH` resolution and Pack agent path discovery

  150|Loop-host authors should treat PocketDev as one possible implementation, not a required dependency or the only way to integrate with the Pack.

## Decisions and Sources

This Seam contract encodes the Loop-host integration requirements from the Pack Composition spec (issue #38), grounded in pocketDev substrate research (issue #16) and the Loop-host Seam contract fields exploration (issue #19). The contract keeps the Pack host-agnostic and avoids lock-in to PocketDev while providing a clear integration surface for autonomous runners.

**Key decisions:**
- Context package includes inlined Caveman + TDD obligations (no external skill lookups)
  160|- Pack agent/skill id optional on invoke (host-agnostic routing)
- Cache token fields required even when zero (complete observability)
- Credits field may be `null` (flexible billing integration)
- `AGENT_WORKFLOWS_PATH` as the standard obtain mechanism (no hardcoded paths)

**Sources:**
- Parent spec: [Pack Composition — context-first with Matt skills and Loop-host seam](https://github.com/nholder88/ai-agent-workflows/issues/38)
- Map: [Compose Pack + Matt skills + loop-host seams](https://github.com/nholder88/ai-agent-workflows/issues/14)
- Substrate research: [Research: pocketDev substrate + bi-directional hookup](https://github.com/nholder88/ai-agent-workflows/issues/16)
- Seam fields: [Loop-host Seam contract fields](https://github.com/nholder88/ai-agent-workflows/issues/19)
  170|- This ticket: [Composition: Loop-host Seam contract doc](https://github.com/nholder88/ai-agent-workflows/issues/40)
