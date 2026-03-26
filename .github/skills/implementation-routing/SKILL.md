---
name: implementation-routing
description: 'Route TypeScript and mixed-scope work to the correct implementation path. USE FOR: deciding between backend, frontend, Next.js, SvelteKit, Angular, full-stack splits, specialist delegation, task classification, verification follow-up coordination. DO NOT USE FOR: writing code directly (use implementation-from-spec or frontend-ui-delivery), multi-stage pipeline orchestration (use workflow-orchestration).'
argument-hint: 'Describe the TypeScript or mixed-scope task and I will determine the right implementation path.'
---

# Implementation Routing

## When to Use

- The task is in TypeScript or JavaScript and the main question is who should implement it.
- The change could be backend, frontend, full-stack, or split across surfaces.
- A specialist exists and direct implementation should not be the first move.

## Routing Policy

- Backend-only work: route to the backend implementation path.
- Frontend-only work: prefer framework-specific paths first.
- Frontend precedence: Next.js, then SvelteKit, then Angular, then generic frontend.
- Full-stack work: split backend and frontend streams and coordinate both.
- Shared contracts and cross-cutting changes: split by execution surface instead of treating them as one blob.

## Procedure

1. Classify the task as backend, frontend, full-stack, or shared.
2. Detect the frontend framework before choosing a generic path.
3. If requirements are vague, clarify before routing.
4. If architecture is missing, plan before routing.
5. After routing, ensure testing, review, and documentation follow-ups are triggered for the touched surfaces.

## Routing Output

- Task classification: backend, frontend, full-stack, or shared.
- Detected framework when frontend is involved.
- Recommended specialist path with rationale.
- Split plan when full-stack: backend scope vs frontend scope.
- Follow-up triggers: testing, review, and documentation surfaces to cover.

## Guardrails

- Do not implement directly when a clear specialist path exists.
- Do not send backend runtime work to a frontend path or vice versa.
- If the task also needs planning gates, multi-phase coordination, or assumption review before routing is meaningful, use `workflow-orchestration` first.
- Use this skill for routing and coordination, not as a substitute for implementation itself.
