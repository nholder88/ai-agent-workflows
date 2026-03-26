---
name: architecture-backlog-planning
description: 'Create architecture and design artifacts from an idea, feature, or system request. USE FOR: system overview, component breakdown, deployment topology, ADRs, threat model, user flows, backlog of implementable tasks with acceptance criteria, feature decomposition, design documents. DO NOT USE FOR: code implementation (use implementation-from-spec), code review (use code-review-gate), reverse engineering existing code (use system-reconstruction).'
argument-hint: 'Describe the system or feature and I will produce architecture and task breakdown artifacts.'
---

# Architecture And Backlog Planning

## When to Use

- A feature spans multiple components or requires design decisions.
- A new project or substantial refactor needs a system plan before code changes.
- A team needs architecture plus an implementation backlog, not just prose.

## Procedure

1. Gather context from README, existing docs, conventions, and previous decisions.
2. State the system goal, boundaries, and key assumptions.
3. Produce architecture sections: overview, components, interfaces, data model, deployment, integrations, and non-functional requirements.
4. Include security and operability: STRIDE threats, observability, dependency risks, and ADRs.
5. Produce design artifacts for user flows, state changes, error handling, and edge cases.
6. Convert the design into atomic backlog items with dependencies, acceptance criteria, testing requirements, and completion gates.

## Required Outputs

- At least one Mermaid architecture or flow diagram.
- Component inventory with responsibilities and dependencies.
- Backlog items small enough for focused implementation.
- Traceability from components to backlog tasks.

## Guardrails

- Do not leave TODO placeholders in final artifacts.
- Call out assumptions instead of burying them.
- Prefer clear, implementable tasks over broad epics.
