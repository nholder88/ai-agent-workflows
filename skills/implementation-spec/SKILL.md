---
name: implementation-spec
description: >-
  Produce a structured implementation specification before coding begins.
  Takes refined PBIs and architecture context and produces delta specs
  (ADDED/MODIFIED/REMOVED requirements with WHEN/THEN scenarios), design
  decisions (rationale and trade-offs), and a numbered task breakdown the
  implementer works through.
  USE FOR: bridging PBI clarification to implementation, producing testable
  specs, creating implementation task breakdowns.
  DO NOT USE FOR: requirements clarification (use requirements-clarification),
  architecture planning (use architecture-planning), actual implementation
  (use impl-* skills).
argument-hint: 'Pass refined PBIs and architecture context to get a structured implementation spec.'
phase: '3.5'
phase-family: implementation-spec
---

# Implementation Spec

## When to Use

- A refined PBI with acceptance criteria is ready to bridge into implementation.
- The implementer needs a structured, testable specification contract to code against.
- Cross-cutting changes, new dependencies, or multiple valid approaches require documented design decisions before coding.
- A task breakdown with file paths and AC traceability is needed.

## When Not to Use

- Requirements are still vague — use `requirements-clarification` first.
- Architecture decisions need to be made from scratch — use `architecture-planning`.
- The task is actual code implementation — use the appropriate `impl-*` skill.
- The artifact needs a risk review — use `assumption-review`.

## Procedure

1. **Receive inputs** — PBI spec(s) from Stage 3, architecture doc from Stage 2 (if any), and risk flags from Stage 1.
2. **Determine operating mode** — Check if running in a repo with accessible source code (Mode 1) or standalone (Mode 2).
3. **If in a repo (Mode 1)** — Read project manifests, identify affected files, extract existing patterns (naming, error handling, tests, API conventions), ground specs in actual types/functions/modules, and check for conflicts with existing code or architectural constraints.
4. **If standalone (Mode 2)** — Focus on requirement structure, mark context-dependent items with `[NEEDS CODEBASE]`, produce abstract task descriptions rather than file paths.
5. **Map the delta** — Identify what is new, what changes, and what (if anything) is removed.
6. **Produce the three artifacts** — Delta Specs, Design Decisions, and Task Breakdown (see Standards below).
7. **Self-validate** — Run the completeness checklist before returning.

## Standards

### Artifact 1: Delta Specs

Delta specs describe **what changes** in terms of system requirements. Each capability (a logical unit of functionality) gets its own section.

For each capability in scope:

- **Status:** NEW, MODIFIED, or REMOVED.
- **ADDED Requirements** — Normative description using SHALL/MUST language. Each requirement has scenarios in WHEN/THEN format (happy path required; error and edge-case scenarios required for non-trivial requirements).
- **MODIFIED Requirements** — Include **Was** (current behavior) and **Now** (full updated requirement). Include updated scenarios.
- **REMOVED Requirements** — Include **Reason** and **Migration** (what replaces it, or N/A).

#### Rules for Delta Specs

- Every requirement MUST use normative language: **SHALL**, **MUST**, **MUST NOT**.
- Every requirement MUST have at least one scenario (happy path).
- Scenarios use **WHEN/THEN** format. Each scenario is a potential test case.
- MODIFIED requirements MUST include the full updated content, not just the diff.
- Reference actual types, functions, and API endpoints when codebase context is available.
- Do not invent requirements. If the PBI does not specify something, flag it as an open question.

### Artifact 2: Design Decisions

Design decisions explain **how** the implementation should work. Only produce when needed.

**When to produce:**
- Cross-cutting changes affecting multiple modules or services.
- New dependencies being introduced.
- Security or performance implications.
- Multiple valid approaches exist and a choice must be justified.
- Data model changes or migrations required.
- Breaking changes to existing APIs or interfaces.

**When to skip:**
- Simple, localized changes with an obvious implementation path.
- Bug fixes with a clear root cause.
- Additive changes that follow existing patterns exactly.

**Required sections (when produced):**
- **Context** — Problem space and constraints.
- **Goals** — What the design optimizes for.
- **Non-Goals** — What the design explicitly does NOT optimize for.
- **Decisions** — Each with choice, rationale, alternatives considered (with rejection reasons), and trade-offs.
- **Risks & Mitigations** — Table with risk, likelihood, impact, mitigation.
- **Migration Plan** — How to migrate safely if existing behavior changes. N/A for greenfield.
- **Open Questions** — Design questions needing stakeholder input.

### Artifact 3: Task Breakdown

The task breakdown is the **implementation checklist**. The implementer works through it in order.

- Tasks use exact checkbox format: `- [ ] X.Y Description`
- Tasks are numbered within groups: `1.1`, `1.2`, `2.1`, etc.
- Each task is independently verifiable.
- Tasks within a group are ordered by dependency. Cross-group dependencies noted.
- When codebase context is available, include file paths for each task.
- The final group is always **Verification** — build, lint, test, and manual check steps.
- Every AC from the PBI MUST map to at least one task. Include an **AC Traceability** table after the breakdown.

### Completeness Checklist

Before returning the spec, verify:

- [ ] Every PBI AC maps to at least one delta spec requirement.
- [ ] Every delta spec requirement has at least one WHEN/THEN scenario.
- [ ] Every scenario is testable (a developer could write a test from it).
- [ ] MODIFIED requirements include the full updated content, not just a diff summary.
- [ ] Design decisions are included when cross-cutting, security, performance, or ambiguity is present.
- [ ] Design decisions are omitted when the implementation path is obvious and localized.
- [ ] Task breakdown covers all delta spec requirements.
- [ ] AC traceability table accounts for every PBI AC.
- [ ] No open questions remain unresolved (or they are explicitly flagged for user input).
- [ ] No normative language violations ("should", "might", "could" replaced with "SHALL", "MUST", "MUST NOT").
- [ ] File paths and function references are accurate (verified by reading the codebase).

### Handling Open Questions

If critical information is missing that blocks spec writing:

1. **Do not guess.** Flag the question explicitly.
2. **Present questions grouped by type** — Functional, Technical, Scope.
3. **Provide bounded options** where possible (A/B/C choices rather than open-ended questions).
4. **Partial specs are acceptable** — Write what you can, mark blocked sections with `[BLOCKED: question #N]`, and return the spec with questions.

### Critical Rules

- **Never write code.** You produce specs, not implementations.
- **Never invent requirements.** If the PBI does not say it, do not add it. Flag it as missing instead.
- **Never leave ambiguity.** Every requirement must be specific enough that two developers would implement it the same way.
- **Always ground in codebase reality.** When running in a repo, reference actual files, types, and patterns.
- **Always produce the AC traceability table.** Every AC must map to tasks. No orphan ACs allowed.
- **Delta over full rewrite.** Describe what changes, not the entire system.
- **The spec is the contract.** If the implementer follows the spec and tests validate the scenarios, the feature is complete.

## Output Contract

All skills in the **implementation-spec** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Implementation Spec Report

**Artifact 1: Delta specs**
[Capabilities with ADDED/MODIFIED/REMOVED requirements and WHEN/THEN scenarios. Full content inline or path to generated file.]

**Artifact 2: Design decisions**
[Decisions with rationale, alternatives, trade-offs. Or "N/A — obvious implementation path".]

**Artifact 3: Task breakdown**
[Numbered checkbox groups with file paths. Full content inline or path to generated file.]

**AC traceability**
| AC ID | Task(s) | Scenario Coverage |
|-------|---------|-------------------|
| AC-1 | 1.1, 1.2 | Happy path, error path |

**Open questions**
[Numbered list or "None — spec is complete".]

**Suggested next step**
[Typically the appropriate impl-* skill/agent.]
```

## Guardrails

- Do not write code. Produce the blueprint that makes code predictable.
- Do not invent requirements beyond what the PBI specifies. Flag gaps instead.
- Use `requirements-clarification` when the PBI is too vague to spec against.
- Use `architecture-planning` when design decisions need higher-level architectural work.
- Use `assumption-review` when the spec needs a risk review before implementation.
- Partial specs with explicit `[BLOCKED]` markers are better than specs with silent guesses.
