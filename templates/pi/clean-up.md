---
description: Scout for AI slop and duplication, fix issues, verify test coverage, add missing tests, then run code review
argument-hint: "[path or module to clean up — defaults to the whole repo]"
---

Run a full clean-up cycle on:

> $ARGUMENTS

Work through each phase in order. Do not skip phases. Each phase's output feeds the next.

---

## PHASE 1 — Scout for AI Slop & Duplication

Use scout to audit the code for quality issues that commonly accumulate during AI-assisted development:

```
Use scout to audit [$ARGUMENTS] for the following issues and produce a prioritised findings list:

1. AI slop patterns: overly verbose code, unnecessary abstraction layers, redundant comments that restate obvious code, dead code that was generated but never integrated, placeholder implementations left in place, hallucinated API calls or library usage, over-engineered solutions to simple problems
2. Duplication: copy-pasted logic that should be extracted, near-identical functions differing only in minor ways, repeated constants or config values that should be centralised
3. Structural issues: inconsistent naming conventions, files doing too many unrelated things, circular dependencies, unused exports

For each finding, include: file path, line range, category (slop / duplication / structural), and a brief description of the recommended fix.
```

Review scout's output. Group findings into:
- **Must fix** — duplications with diverging logic, dead code, hallucinated APIs
- **Should fix** — extractable logic, naming inconsistencies
- **Optional** — minor verbosity, style

---

## PHASE 2 — Fix AI Slop & Duplication

Implement all Must-fix and Should-fix findings using the correct agent for the stack:

```
Use [implementer] to address these code quality findings: [Must-fix and Should-fix findings from Phase 1 with file paths and line ranges]. For each change: remove dead code outright, extract duplicated logic into shared utilities, replace hallucinated API calls with correct ones, and consolidate repeated constants. Do not change external behaviour or public interfaces. Keep changes minimal and targeted.
```

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

Gate: build passes, no new lint errors, all existing tests still pass.

---

## PHASE 3 — Scout for Test Coverage Gaps

Use scout to map the test coverage landscape after Phase 2:

```
Use scout to map test coverage for [$ARGUMENTS] after the Phase 2 changes. Identify:

1. Public functions and exported symbols with no test at all
2. Functions with tests only for the happy path but no error paths or edge cases
3. Files modified in Phase 2 that have no corresponding test update
4. Critical paths (auth, data mutation, error handling) with weak or absent coverage

For each gap, include: file path, the untested function or behaviour, and the category (no test / happy-path only / modified with no test update / critical path gap).
```

---

## PHASE 4 — Add Missing Tests

Implement tests for all coverage gaps found in Phase 3:

```
Use [test agent] to write tests covering these gaps: [all findings from Phase 3]. Write tests only — do not change production code. For each test, reference the gap ID it covers. Use the project's existing test framework and conventions.
```

Select the test agent by what was modified:

| Scope | Agent |
|---|---|
| Backend (controllers, services, repos, middleware) | `backend-unit-test-specialist` |
| Frontend (components, hooks, stores, client logic) | `frontend-unit-test-specialist` |
| Both | Run both agents in parallel on their respective scopes |

Gate: all new and existing tests pass.

---

## PHASE 5 — Code Review

Run the code review workflow on everything changed in Phases 2 and 4:

```
Use code-review-sentinel and appsec-sentinel in parallel to review all files changed in this clean-up cycle: [combined list of files modified in Phases 2 and 4].
- code-review-sentinel: check for bugs, regressions, or new correctness issues introduced by the clean-up or test additions
- appsec-sentinel: check that no security issues were introduced by the refactoring (e.g. extraction of auth logic, changes to input handling)
```

### Review Gate

- **PASS** — No Blocker (code-review) or Critical/High (appsec) findings
- **FAIL** — Fix findings and re-run Phase 5 (max 2 rounds, then escalate)

---

## PHASE 6 — Summary

Report:
- Phase 1: findings by category (slop / duplication / structural), counts must-fix / should-fix / optional
- Phase 2: changes made, build/lint/test status
- Phase 3: coverage gaps found (counts by category)
- Phase 4: tests added, final test pass/fail status
- Phase 5: review result, any findings resolved in the fix loop
- Overall: files touched, net lines removed (as a rough signal of slop eliminated), deferred items
