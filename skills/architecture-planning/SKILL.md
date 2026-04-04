---
name: architecture-planning
description: >-
  Create architecture documents, design documents, and implementable task
  backlogs from an idea, feature, or system request. Produces system overview,
  component breakdown, deployment topology, API contracts, data model, ADRs,
  threat model, observability architecture, and backlog with acceptance criteria.
  USE FOR: architecture design, feature decomposition, backlog generation,
  system planning.
  DO NOT USE FOR: implementation (use impl-* skills), requirements
  clarification (use requirements-clarification), code review (use code-review).
argument-hint: 'Describe your application idea, feature, or system to get architecture docs and a task backlog.'
phase: '2'
phase-family: architecture
---

# Architecture Planning

## When to Use

- A new application, feature, or system needs architecture and design before implementation.
- A feature request needs decomposition into an implementable task backlog.
- Architecture documents, design documents, or ADRs need to be created.
- A complex task requires feasibility assessment before committing to a plan.

## When Not to Use

- Implementation of code — use the appropriate `impl-*` skill.
- Requirements are vague and need clarification — use `requirements-clarification` first.
- Reviewing an existing spec for risk — use `assumption-review`.
- Code review — use `code-review`.
- Reverse engineering an existing codebase — use `system-reconstruction`.

## Procedure

1. **Gather context** — Read memory banks, existing documentation, project files, and CLAUDE.md for project standards and patterns.
2. **Analyze requirements** — Parse the request, identify explicit and implicit requirements, and note any gaps.
3. **Feasibility gate (complex tasks)** — If the task is complex, first produce a short feasibility assessment covering unknowns, highest-risk assumptions, likely constraints, and a go/no-go recommendation. If critical unknowns block a safe plan, ask targeted clarifying questions before proceeding.
4. **Clarify if needed** — If critical information is missing (e.g., target platform, key constraints, user types), ask targeted clarifying questions before proceeding.
5. **Produce artifacts** — Generate the requested documents following the Standards below.
6. **Cross-reference** — Ensure all outputs are consistent with each other and with existing project documentation.
7. **Self-review** — Verify completeness using the quality checklist before finalizing.

## Standards

### Architecture Documents

When creating architecture documents, include:

- **System Overview** — High-level description of the system purpose and scope.
- **Architecture Diagram** — Use Mermaid diagram syntax to illustrate components and their relationships.
- **Component Breakdown** — Each component described with its responsibility, interfaces, dependencies, and technology choices.
- **Deployment Topology** — How components run in production (processes/containers, hosting model, network boundaries, external dependencies).
- **API Contract Specification** — Explicit service boundaries with contracts (OpenAPI 3.1 for HTTP APIs and/or GraphQL schema for GraphQL boundaries). Include request/response examples for critical paths.
- **Data Model** — Entity relationships, key data structures, and storage strategies.
- **Integration Points** — External services, APIs, and communication patterns.
- **Non-Functional Requirements** — Performance, scalability, security, and reliability considerations.
- **Security Threat Model** — Identify trust boundaries and threats using STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege). Include mitigations and residual risk.
- **Observability Architecture** — Logging (structured fields, redaction), metrics (SLIs/SLOs candidates), tracing (span boundaries, correlation IDs), and alert anchors.
- **Dependency Risk Analysis** — Risks from third-party packages/services (lock-in, licensing, reliability, supportability) and planned mitigations.
- **Architecture Decisions (ADRs)** — Numbered ADR entries (`ADR-001`, `ADR-002`, ...) with context, decision, consequences, and alternatives considered.

### Design Documents

When creating design documents, include:

- **User Flows** — Step-by-step flows using numbered sequences and clear decision points. Use Mermaid flowchart syntax for visual representation.
- **Screen/View Descriptions** — What the user sees at each step, key UI elements, and interaction behaviors.
- **State Management** — How application state changes through each flow.
- **Error Handling** — What happens when things go wrong at each step.
- **Edge Cases** — Unusual scenarios and how they are handled.

### Backlog Generation

When creating application specs, output a structured backlog where each item includes:

- **Task ID and descriptive title**
- **Priority** (P0-Critical, P1-High, P2-Medium, P3-Low)
- **Estimated Complexity** (Small, Medium, Large)
- **Dependencies** (list of task IDs or "None")
- **Component** (which architectural component)
- **Description** — Clear, concise description of what needs to be built.
- **Requirements** — Specific, checkable requirements.
- **Technical Specification** — Files to create/modify, functions/classes, data structures, API endpoints, integration points.
- **Acceptance Criteria** — Testable criteria.
- **Testing Requirements** — Unit, integration, and edge case test scenarios.
- **Completion Checklist** — Implementation, AC met, tests passing, code review, lint clean, docs updated, working E2E.

### Task Decomposition Principles

1. **Atomic Units** — Each task completable in a single focused session. Break further if too large.
2. **Clear Dependencies** — Explicitly state which tasks must complete first. Order naturally.
3. **Foundation First** — Data models and config before business logic before UI.
4. **Testability Built-In** — Every task includes testing requirements.
5. **Review Gate** — Every completion checklist includes code review approval.
6. **Self-Contained Context** — Each task contains enough context for independent execution. Reference specific files, functions, and patterns.
7. **Incremental Value** — Arrange tasks so each adds demonstrable, verifiable value.

### Dual-Audience Output

All output must be readable by humans for review and approval, and structured for agent consumption and execution.

### Quality Checklist

Before finalizing, verify:

- [ ] All components in the architecture are covered by backlog items.
- [ ] All backlog items trace back to architectural components.
- [ ] Dependencies form a valid DAG (no circular dependencies).
- [ ] Every task has testable acceptance criteria.
- [ ] Every task includes the completion checklist with testing and review gates.
- [ ] Diagrams are syntactically correct Mermaid and visually clear.
- [ ] Naming conventions and patterns align with project standards.
- [ ] Every ADR includes consequences and at least one alternative considered.
- [ ] Threat model covers every trust boundary and includes mitigations.
- [ ] Deployment topology is consistent with the architecture diagram and contracts.
- [ ] Cross-cutting concerns (auth, rate limiting, idempotency, data retention) are explicitly addressed or marked out-of-scope.

### Handling Ambiguity

When faced with ambiguous requirements:

1. State your interpretation explicitly.
2. Document the assumption you are making.
3. Note alternative interpretations that were considered.
4. Flag the ambiguity for human review with a clear question.
5. Proceed with the most reasonable interpretation rather than blocking entirely.

### Critical Rules

- **Consistency** — Use consistent terminology throughout all documents. Define terms in a glossary if the domain is complex.
- **Traceability** — Every backlog item traces to a requirement; every requirement is covered by backlog items.
- **Clarity Over Cleverness** — Write for the least-experienced reader. Be explicit rather than implicit.
- **Diagram Quality** — All diagrams must use proper Mermaid syntax, have descriptive labels, and be readable without additional context.
- **Completeness** — Do not leave placeholder text or TODO markers in final output. If something cannot be determined, explicitly state the assumption made.

## Output Contract

All skills in the **architecture** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Architecture & Planning Report

**Architecture document**
[Location: path to generated architecture doc]

**Design document** (if applicable)
[Location: path to generated design doc, or "N/A — not required for this scope"]

**Backlog**
| # | Task | AC Summary | Complexity |
|---|------|-----------|------------|
| 1 | [task title] | [AC summary] | S/M/L |

**Diagrams**
- [List Mermaid diagrams produced: system, component, sequence, etc.]

**ADRs**
- [List ADR IDs and titles, e.g. ADR-001: Choice of message broker]

**Suggested next step**
[Agent or action — typically pbi-clarifier or implementation-spec.]
```

## Guardrails

- Do not implement code as part of architecture planning.
- Do not leave placeholder text or TODO markers in final output.
- Use `requirements-clarification` when requirements are too vague to architect against.
- Use `assumption-review` when an existing plan needs risk review rather than new architecture.
- Use `system-reconstruction` when needing to understand an existing codebase before designing.
- Respect existing CLAUDE.md, architecture documents, tech stack constraints, and team conventions.
