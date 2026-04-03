# Phase output contracts

Single source of truth for **chat-visible completion reports** and **append-only agent progress logs**. Agents in this repository should follow these contracts so outputs are consistent, auditable, and easy to hand off.

**Related:** Orchestrator pipeline stages and gates are defined in [`../agents/orchestrator.agent.md`](../agents/orchestrator.agent.md).

---

## Path conventions

| Artifact | Path | Notes |
|----------|------|--------|
| Per-task agent log (most agents) | `agent-progress/[task-slug].md` | Append-only; create `agent-progress/` if missing. |
| Orchestrator pipeline run log | `agent-progress/runs/pipeline-[task-slug].md` | Created in Stage 0; see orchestrator agent. Legacy `agent-progress/pipeline-[task-slug].md` is deprecated—prefer `runs/`. |
| Durable decision docs | `agent-progress/*.md` (root of folder) | Tracked in VCS when appropriate (architecture, remediation). |
| Transient run logs | `agent-progress/runs/` | Typically gitignored. |

---

## Phase families (orchestrator alignment)

| Phase family | Typical stages | Primary agents | Chat output contract |
|--------------|----------------|----------------|----------------------|
| Intake & discovery | 0, 0.5 | orchestrator, system-reverse-engineer | Stage log snippet + **Discovery executive summary** (reverse-engineer) |
| Assumption & risk | 1 | assumption-reviewer | Existing review template + **AskQuestion** policy below |
| Architecture & planning | 2 | architect-planner | Output Standards in agent file + **AskQuestion** policy |
| Clarification & spec | 3 | pbi-clarifier | PBI output template + **AskQuestion** policy |
| Implementation | 4 | `*-implementer`, framework experts | **Implementation Complete Report** below |
| UI quality | 4.5 | ui-ux-sentinel | Existing structured review in agent file |
| Testing | 5a, 5b | `*-unit-test-specialist`, ui-test-specialist | **Test completion report** below |
| Documentation | 6 | code-documenter | **Documentation completion report** below |
| Security & review | 7a, 7b | appsec-sentinel, code-review-sentinel | Persisted reports + structured review (see each agent) |
| Post-task wiki | 7.5 | wiki-update-agent | YAML + markdown payload per [`../templates/shared/wiki-update-contract.yaml`](../templates/shared/wiki-update-contract.yaml) and [`../agents/wiki-update-agent.agent.md`](../agents/wiki-update-agent.agent.md) |

**Cross-phase alignment:** Implementation reports should reference **AC IDs** from `pbi-clarifier` when present. Code review and AppSec findings should reference **file paths** consistent with the implementer’s change list.

---

## Structured clarification: `AskQuestion` (Cursor) vs fallback

**When the session is Cursor** and the **`AskQuestion`** tool is available, the **orchestrator (parent session)** should use it for **bounded choices**: task type, skip/continue, priority, mutually exclusive tech options, severity of a blocker, doc-discovery gate, etc. Prefer **1–2 questions per turn**; use **`allow_multiple`** when the user may select more than one option.

**Specialist agents** (markdown-only definitions invoked via subagents) may **not** have the same tool surface. They should phrase outputs as **explicit option sets** (numbered or labeled A/B/C) so the parent can convert them into `AskQuestion` calls.

**When `AskQuestion` is not available** (plain VS Code, CLI, or other hosts), use the **fallback**: numbered options or `A / B / C` choices in markdown, with a single line instructing the user to reply with the label.

---

## Implementation Complete Report (mandatory chat — implementers & framework experts)

Use this structure in the **chat** before appending the agent progress log. Replace bracketed placeholders.

```markdown
### Implementation Complete Report

**Implementation summary**
[2–4 sentences: what was delivered and how it matches the request.]

**Scope**
- In scope: [bullets or "As specified in task"]
- Out of scope / deferred: [bullets or "None"]

**Acceptance criteria mapping**
| AC / criterion | Evidence |
|----------------|----------|
| [AC-1 or description] | [file path, test name, or behavior] |
| … | … |

_Use `N/A — [reason]` if no formal AC list exists._

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [one line] |

**Verification**
- [command] — [result: pass/fail/skip]
- _If not run, state why._

**Risks and follow-ups**
- [concrete items] or **None**

**Suggested next step**
[Handoff target agent name or human action.]
```

**Agents:** All `*-implementer.agent.md` agents, `nextjs-skeleton-expert`, `sveltekit-skeleton-expert`, and `typescript-implementer` (coordinator: consolidate delegated work into one report when acting as coordinator).

---

## Test completion report (mandatory chat — test specialists)

```markdown
### Test Completion Report

**Summary**
[What test areas were added or updated.]

**Scope**
- Covered: [modules, behaviors]
- Not covered (and why): […] or **None**

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/test` | [one line] |

**Verification**
- [test command] — [result]

**Known gaps**
[items] or **None**

**Suggested next step**
[Agent or action.]
```

**Agents:** `frontend-unit-test-specialist`, `backend-unit-test-specialist`, `ui-test-specialist`.

---

## Documentation completion report (mandatory chat — code-documenter)

```markdown
### Documentation Completion Report

**Summary**
[What was documented: symbols, modules, or pages.]

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [doc added/updated] |

**Public API / exported symbols**
- [List key symbols documented] or **N/A**

**Verification**
- [build or doc check if any] — [result] or **N/A**

**Suggested next step**
[Typically `code-review-sentinel` or human review.]
```

**Agents:** `code-documenter`, `markdown-technical-writer` (for non-code docs, adapt the **Public API** row to the sections or files covered).

---

## Discovery executive summary (mandatory chat — system-reverse-engineer)

After writing the spec tree to disk, add:

```markdown
### Discovery executive summary

**Spec location:** [root path of generated spec, e.g. `docs/system-spec/`]

**Verified vs inferred**
- Verified from code: [short bullet list]
- Documented as unknown: see `10-assumptions-and-unknowns.md` — [top 1–3 items]

**Suggested next step**
[Architect, implementer, or human review.]
```

---

## Agent progress log (append template)

Append **one section per run** to `agent-progress/[task-slug].md`. Use the agent’s **actual `name`** from its frontmatter for the heading.

```markdown
## <agent-name> — [ISO timestamp]

**Task:** [one-line description]
**Status:** Complete | Blocked | Partial
**Stage (if in pipeline):** [e.g. Stage 4 — Implementation]

### Actions Taken

- [what you did]

### Files Created or Modified

- `path/to/file` — [what changed]

### Outcome

[what was achieved, pass/fail for gates, key metrics]

### Blockers / Open Questions

[items or "None"]

### Suggested Next Step

[next agent/action]
```

**Orchestrator** uses the template in [`../agents/orchestrator.agent.md`](../agents/orchestrator.agent.md) for `agent-progress/runs/pipeline-[task-slug].md` (includes pipeline-specific fields).

**code-review-sentinel** and **appsec-sentinel:** set **Stage** to Stage 7 as appropriate; appsec lists `Review/security-audit-report.md` under Files Created when applicable.

---

## Stage 0 / 0.5 structured log (orchestrator)

When classifying or completing documentation preflight, append or record a snippet that includes at minimum:

- `WORKSPACE_MODE: single-repo|multi-folder`
- `DOC_COVERAGE: complete|partial|missing`
- `DOC_PATHS_FOUND:` [paths]
- `REVERSE_ENGINEER_SUGGESTED: true|false` and whether reverse-engineer ran
- Skip/continue decisions with reason

See orchestrator **Tracking** section for the canonical todo-line pattern.
