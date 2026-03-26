---
name: workflow-orchestration
description: 'Run a multi-stage delivery workflow from idea to reviewed code. USE FOR: end-to-end task orchestration, multi-stage pipelines, task classification, assumption validation, architecture planning, requirements clarification, implementation, test generation, documentation, code review, fix loops, quality gates. DO NOT USE FOR: single isolated tasks that only need one skill, quick edits, simple queries.'
argument-hint: 'Describe the task and I will break it into stages with gates and recovery loops.'
---

# Workflow Orchestration

## When to Use

- A task crosses planning, implementation, testing, and review.
- Multiple specialists or phases need coordination.
- The work needs explicit gates and retry behavior rather than informal sequencing.

## Core Stages

1. Intake and classification
2. Documentation preflight
3. Assumption review
4. Architecture and planning
5. Requirements clarification
6. Implementation
7. UI/UX review when UI changed
8. Test tracks
9. Documentation
10. Code review
11. Optional post-task wiki update

## Operating Procedure

1. Classify task type, complexity, UI scope, and existing documentation.
2. Build a lean context package for each stage instead of forwarding the full world.
3. Apply a gate at the end of each stage and log pass, skip, blocked, fail, or escalate.
4. When a gate fails, run a bounded fix loop with explicit failure reasons.
5. End with a concise report of artifacts produced, verification completed, and remaining risks.

## Final Report Format

- Stages executed with pass/skip/fail status.
- Artifacts produced with file paths.
- Verification summary: build, lint, test outcomes.
- Remaining risks or deferred items.
- Total fix-loop iterations if any.

## Guardrails

- Keep context stage-scoped.
- Do not silently rerun failed stages.
- Escalate with specific questions if retry limits are exceeded.
- Use `implementation-routing` when the core problem is deciding which specialist implementation path should own the work.
