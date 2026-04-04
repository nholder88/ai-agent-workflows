---
name: implementation-routing
description: >-
  Route TypeScript and mixed-scope implementation tasks to the correct
  specialist skill or agent. Classifies backend vs frontend vs full-stack
  scope, identifies framework, and delegates to the right implementer.
  USE FOR: routing mixed TypeScript work, splitting full-stack tasks, choosing
  between frontend framework specialists.
  DO NOT USE FOR: actual implementation (use impl-* skills), architecture
  (use architecture-planning), requirements (use requirements-clarification).
argument-hint: 'Point me at a TypeScript task and I will route it to the right implementation path.'
phase: '4'
phase-family: implementation
---

# Implementation Routing

## When to Use

- The task is in TypeScript or JavaScript and the main question is who should implement it.
- The change could be backend, frontend, full-stack, or split across surfaces.
- A specialist exists and direct implementation should not be the first move.
- A multi-scope task needs to be split into backend and frontend streams before delegation.

## When Not to Use

- You already know the correct specialist -- call `impl-nextjs`, `impl-sveltekit`, `impl-angular`, `impl-typescript-frontend`, `impl-typescript-backend`, `impl-python`, or another `impl-*` skill directly.
- Architecture or design decisions are needed first -- use `architecture-planning`.
- Requirements are vague -- use `requirements-clarification`.
- Multi-stage pipeline orchestration is needed -- use `workflow-orchestration`.

## Procedure

1. **Identify scope** -- Determine whether work is backend, frontend (Next.js, SvelteKit, Angular, or other), full-stack, or shared. Read `package.json`, `tsconfig.json`, and folder structure to classify.
2. **Detect frontend framework** -- Before choosing a generic path, identify the specific framework. Check for Next.js (`next` in dependencies), SvelteKit (`@sveltejs/kit`), Angular (`@angular/core`), Vue/Nuxt (`vue`/`nuxt`), or plain React.
3. **Clarify if needed** -- If requirements are unclear, route to `requirements-clarification` before delegation.
4. **Plan if needed** -- If architecture, boundaries, or sequencing are missing, route to `architecture-planning` before delegation.
5. **Delegate implementation** -- Route to specialized implementers using the Delegation Policy below. For full-stack tasks, split into backend and frontend streams and delegate each.
6. **Request verification** -- Trigger test and review follow-ups based on touched areas: `frontend-unit-test-specialist`, `backend-unit-test-specialist`, `code-review-sentinel`, `code-documenter` as appropriate.
7. **Consolidate status** -- Return a clear summary of what was delegated, verified, and what remains. Produce the Output Contract below.

## Standards

### Delegation Policy

- **Backend-only changes:** Delegate to `impl-typescript-backend`.
- **Frontend-only changes:** Route by framework in this precedence order:
  1. `impl-nextjs` for Next.js
  2. `impl-sveltekit` for SvelteKit
  3. `impl-angular` for Angular
  4. `impl-typescript-frontend` for React, Vue, Nuxt, or other
- **Full-stack changes:** Split into backend and frontend streams; delegate each stream to its specialist. For frontend scope, use the same framework precedence order above.
- **Shared contracts and cross-cutting concerns:** Split by execution surface. Backend runtime impacts go to `impl-typescript-backend`; UI/client impacts use the framework routing order above.
- **Unclear architecture or design:** Delegate first to `architecture-planning`, then route implementation.

### Framework Routing Order

When frontend work is involved, always check frameworks in this order before falling back to the generic skill:

1. Next.js (`next` in dependencies) -- `impl-nextjs`
2. SvelteKit (`@sveltejs/kit` in dependencies) -- `impl-sveltekit`
3. Angular (`@angular/core` in dependencies) -- `impl-angular`
4. React / Vue / Nuxt / other -- `impl-typescript-frontend`

### Split Patterns for Full-Stack Tasks

- Identify the API contract (endpoints, DTOs, response shapes) as the boundary between streams.
- Delegate backend first when frontend depends on API shape; delegate in parallel when both sides can work against a shared contract.
- Ensure delegated outputs follow existing contracts, naming, and repository conventions.

### Coordination Patterns

- **Delegation-first:** Do not implement directly when a specialist path exists.
- **Parallel routing:** For full-stack tasks, delegate backend and frontend streams in parallel when possible.
- **Consistency checks:** Ensure delegated outputs follow existing contracts, naming, and repository conventions.
- **Verification gates:** Require tests and review follow-ups for meaningful code changes.

### Framework Support

- **Frontend:** React, Next.js, Vue, Nuxt, SvelteKit, Angular.
- **Backend:** NestJS, Express, Fastify, Node service layers.
- **Shared:** DTOs, API contracts, utility libraries, and integration boundaries.

### Completion Criteria

- [ ] Correct implementation skill was used for each scope
- [ ] Frontend routing used framework-specific specialist first (Next.js, SvelteKit, Angular)
- [ ] Backend and frontend tests were requested where applicable
- [ ] Code review follow-up was requested for non-trivial changes
- [ ] Documentation follow-up was requested for changed public contracts or APIs

## Output Contract

All skills in the **implementation** phase family use this identical report. The coordinator consolidates delegated work into one report. Present it in chat before logging progress.

```markdown
### Implementation Complete Report

**Implementation summary**
[2-4 sentences: what was delivered and how it matches the request.]

**Scope**
- In scope: [bullets or "As specified in task"]
- Out of scope / deferred: [bullets or "None"]

**Acceptance criteria mapping**
| AC / criterion | Evidence |
|----------------|----------|
| [AC-1 or description] | [file path, test name, or behavior] |

_Use `N/A -- [reason]` if no formal AC list exists._

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [one line] |

**Verification**
- [command] -- [result: pass/fail/skip]
- _If not run, state why._

**Risks and follow-ups**
- [concrete items] or **None**

**Suggested next step**
[Handoff target agent name or human action.]
```

## Guardrails

- Do not implement directly when a clear specialist path exists. This skill is for routing and coordination only.
- Do not send backend runtime work to a frontend skill or vice versa.
- Do not skip framework detection -- always check `package.json` before choosing a generic path.
- If the task also needs planning gates, multi-phase coordination, or assumption review before routing is meaningful, use `workflow-orchestration` first.
- Use `requirements-clarification` when acceptance criteria are ambiguous.
- Use `architecture-planning` when design, boundaries, or sequencing are missing.
