---
description: Run the full agent pipeline (intake → plan → spec → implement → test → review → wiki)
argument-hint: "<task description>"
---

Run the full multi-stage development pipeline for the following task:

> $ARGUMENTS

Work through the stages below in order. Skip stages where the conditional skip rule applies. For each stage, run the specified subagent, evaluate the gate, and do not advance until the gate passes or you escalate to the user. Track stage outcomes as you go.

---

## STAGE 0 — Intake & Classification

Do this yourself before spawning any subagents:

- Detect workspace mode: single-repo or multi-folder
- Inventory top-level directories and key root artifacts (package.json, Cargo.toml, *.csproj, go.mod, pyproject.toml, etc.)
- Classify the task:
  - **Type:** `NEW_PROJECT` | `NEW_FEATURE` | `BUG_FIX` | `REFACTOR` | `SPEC_ONLY`
  - **Complexity:** `TRIVIAL` | `MODERATE` | `COMPLEX`
- Note which stages to skip based on classification

---

## STAGE 0.5 — Documentation Discovery

Use `scout` to scan for existing documentation artifacts:

```
Use scout to check for documentation in Documentation/, docs/, README.md, Design/, and any *architecture*.md or *adr*.md files. Report what exists and what is missing.
```

- If documentation is missing or insufficient, run `system-reverse-engineer` before continuing
- Gate: proceed only when docs exist, reverse engineering completed, or user confirms continue without docs

---

## STAGE 1 — Assumption Review

**Skip when:** task is `TRIVIAL` or already a precise spec with acceptance criteria.

```
Use assumption-reviewer to review this task for hidden assumptions and blockers: [paste task description and any context from Stage 0]
```

- Gate: no `Blocker`-severity findings
- On Blocker: surface to user, wait for resolution before continuing

---

## STAGE 2 — Architecture & Planning

**Skip when:** complete architecture doc and task backlog already exist, or task is `TRIVIAL` or `BUG_FIX`.

```
Use architect-planner to produce an architecture doc and backlog for: [task description + Stage 0 context + Stage 1 findings]
```

- Gate: output includes at least one Mermaid diagram, a backlog with tasks per affected component, and acceptance criteria per task
- On gate failure: retry once with specific feedback, then escalate

---

## STAGE 3 — PBI Clarification

**Skip when:** task is already a precise PBI with Given/When/Then AC, technical AC, and implementation steps. Also skip for `TRIVIAL`.

```
Use pbi-clarifier to refine these backlog items into precise PBIs: [backlog from Stage 2 or raw task + architecture doc + tech stack context]
```

- Gate: each PBI has functional AC (happy path, error path, edge case), technical AC, ordered implementation steps, and an explicit out-of-scope section
- On open questions: surface to user and wait before proceeding

---

## STAGE 3.5 — Implementation Spec (OpenSpec Propose)

**Skip when:** task is `TRIVIAL`, or `BUG_FIX` touching ≤ 3 files with a clear root cause.

```
Use implementation-spec to run openspec propose for: [PBIs from Stage 3 + architecture doc + risk flags + OPENSPEC_COMMAND: propose]
```

The agent produces: delta specs, design decisions, and a task breakdown with AC traceability.

- Gate: every PBI AC maps to a delta spec requirement; every requirement has a testable scenario; AC traceability table is complete; no unresolved open questions
- On gate failure: retry up to 2 times with specific gaps, then escalate

---

## STAGE 4 — Implementation (OpenSpec Apply)

**Skip only for `SPEC_ONLY` tasks.**

```
Use implementation-spec to run openspec apply with these artifacts: [delta specs + design decisions + task breakdown + OPENSPEC_COMMAND: apply]. Dispatch implementers based on the detected language/framework.
```

Implementer routing (implementation-spec handles dispatch, but confirm the right agent is selected):

| Stack | Agent |
|---|---|
| Next.js | `nextjs-skeleton-expert` |
| SvelteKit | `sveltekit-skeleton-expert` |
| Angular | `angular-implementer` |
| TS/JS backend | `typescript-backend-implementer` |
| TS/JS frontend | `typescript-frontend-implementer` |
| TS/JS general | `typescript-implementer` |
| Python | `python-implementer` |
| C# / .NET | `csharp-implementer` |
| Rust | `rust-implementer` |
| Go | `go-implementer` |
| Java | `java-implementer` |
| GraphQL | `graphql-specialist` |
| SQL | `sql-specialist` |
| MongoDB | `mongodb-specialist` |
| Redis | `redis-specialist` |

- Gate: build passes, no new lint errors, all AC covered, parity check passes if templates were modified
- On gate failure: retry once, then escalate

---

## STAGE 4.5 — UI/UX Review

**Skip when:** no UI components, pages, or client-side views were created or modified.

```
Use ui-ux-sentinel to review these UI files: [list of .tsx/.jsx/.svelte/.vue/.html modified in Stage 4]. Framework: [detected framework + design system]. Check all six pillars; report every Blocker and Risk.
```

- Gate: zero Blocker findings; Theme Compliance Score is Pass or Conditional; UX Quality Score ≥ 3/5 per pillar; zero accessibility Blockers
- On failure: route fixes back to the implementer, re-run Stage 4.5; max 2 fix loops then escalate

---

## STAGE 5 — Tests (run in parallel when both apply)

**Backend tests — run when:** controllers, services, repositories, middleware, or utilities were modified.

```
Use backend-unit-test-specialist to generate tests for: [list of modified backend files + implementation spec]
```

**Frontend tests — run when:** components, hooks, stores, or client-side logic were modified.

```
Use frontend-unit-test-specialist to generate tests for: [list of modified frontend files + implementation spec]
```

- Gate: all generated tests pass; no existing tests broken

---

## STAGE 6 — Documentation

**Skip for:** `BUG_FIX` and `TRIVIAL` tasks.

```
Use code-documenter to document the public API surface of these files: [list of modified files with public exports]
```

- Gate: all exported symbols have JSDoc/docstrings; no undocumented public functions remain

---

## STAGE 7 — Parallel Review (run both simultaneously)

Run these two in parallel:

```
Run parallel subagents: use appsec-sentinel to audit security, and use code-review-sentinel to review code quality. Pass both the full list of changed files and the implementation spec.
```

- Gate (both must PASS):
  - `code-review-sentinel`: no Blocker findings (bugs, security holes, logic errors)
  - `appsec-sentinel`: no critical or high severity findings unmitigated
- On FAIL: enter fix loop — route issues back to the implementer, re-run Stage 7; max 3 iterations then escalate

---

## STAGE 7.5 — Wiki Update

**Run when:** Stage 7 PASSes and the task has user-facing changes.

```
Use wiki-update-agent to generate wiki update artifacts for these changes: [summary of what was built + list of modified files]
```

---

## Pipeline Complete

When all applicable stages PASS:
1. Report a pipeline summary: stages run, stages skipped (with reason), overall status
2. List any open follow-ups or risks noted during the pipeline
3. Confirm the task is complete or escalate any unresolved blockers to the user
