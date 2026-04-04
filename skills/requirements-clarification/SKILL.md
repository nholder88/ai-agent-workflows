---
name: requirements-clarification
description: >-
  Turn a vague feature request, user story, backlog item, or PBI into a precise
  specification with functional AC (Given/When/Then), technical AC, test
  criteria, implementation steps, and explicit out-of-scope boundary.
  USE FOR: PBI clarification, user story refinement, spec writing from vague
  requirements.
  DO NOT USE FOR: assumption review (use assumption-review), architecture
  planning (use architecture-planning), implementation (use impl-* skills).
argument-hint: 'Paste a PBI, user story, or feature description and I will turn it into a precise spec.'
phase: '3'
phase-family: clarification
---

# Requirements Clarification

## When to Use

- A feature request contains vague words like "fast", "simple", "robust", or "user-friendly".
- The request is missing actor, trigger, input, output, failure behavior, or scope boundaries.
- A backlog item needs a spec another engineer or agent can implement without follow-up.
- A PBI, user story, or feature description needs Given/When/Then acceptance criteria.

## When Not to Use

- Reviewing an existing spec for risk and blind spots — use `assumption-review`.
- Architecture planning or system design — use `architecture-planning`.
- Actual code implementation — use the appropriate `impl-*` skill.
- Code review — use `code-review`.

## Procedure

### 1. Receive the PBI

Read the user story, feature request, or PBI text provided.

### 2. Run the Clarification Engine

Scan every sentence for vagueness, assumptions, and missing information using the four detectors below.

### 3. Determine operating mode

Check if running in a repo with accessible source code.

### 4. If in a repo (Mode 1 — With Application Context)

1. **Scan the project** — Read `package.json`, project structure, existing models, API routes, and tests to understand the current system.
2. **Map the PBI** — Identify which existing components, modules, and files are affected by the feature.
3. **Ground the spec** — Produce implementation steps that reference actual files, modules, and patterns in the codebase.
4. **Generate technical AC** — Based on real architecture, data models, and API conventions already in use.
5. **Cross-reference tests** — Look at existing test patterns to suggest concrete test criteria.

### 5. If standalone (Mode 2 — Without Application Context)

1. **Focus on functional clarity** — Extract the pure business intent from the PBI.
2. **Surface all assumptions** — Flag every implicit assumption that would need codebase-specific answers.
3. **Produce portable spec** — Write a functional specification that can be applied to any codebase later.
4. **Mark context-dependent items** — Tag sections that will need revisiting once codebase context is available with `[NEEDS CONTEXT]`.

### 6. If architectural questions arise

Hand off to or consult `architecture-planning` for design decisions when the PBI implies a new service, changes to inter-service communication, new data stores, auth architecture changes, performance-critical features needing specific patterns, or breaking API changes.

### 7. Produce the specification

Generate the output document following the Output Contract template. Present open questions first if critical information is missing.

## Standards

### Clarification Engine

This is the defining behavior of the skill. Scan every sentence of the PBI for the following issues. For each issue found, produce a **specific, answerable question** — never a generic "please clarify."

#### Vague Language Detector

Flag and question any instance of:

- **Subjective qualifiers** — "fast", "user-friendly", "intuitive", "clean", "simple", "efficient", "robust"
  - Question: "Define 'fast' — what is the maximum acceptable response time in milliseconds?"
- **Open-ended lists** — "etc.", "and more", "and so on", "various", "multiple"
  - Question: "List every item explicitly. What specifically is included beyond X and Y?"
- **Weasel words** — "should", "might", "could", "possibly", "ideally", "if possible"
  - Question: "Is this a hard requirement or a nice-to-have? What happens if it's not implemented?"
- **Undefined scope** — "handle errors", "support notifications", "manage users"
  - Question: "Which specific errors? What error response format? What recovery behavior?"

#### Missing Information Detector

Flag when the PBI is missing:

- **Actor** — Who performs this action? Which user role or system component?
- **Trigger** — What initiates this? User click, API call, scheduled job, event, system state?
- **Input** — What data does this feature receive? What format? What validation rules?
- **Output** — What does the user see? What does the API return? What side effects occur?
- **Edge cases** — What happens on failure? Empty data? Concurrent access? Partial completion? Timeout?
- **Scope boundary** — Where does this feature start and end? What is explicitly NOT included?
- **Success metric** — How do we know this feature is working correctly in production?

#### Assumption Detector

Flag any implicit assumption, including:

- **State assumptions** — "The user is logged in", "The record exists", "The service is running"
- **Data assumptions** — "The field is populated", "The format is valid", "The list is non-empty"
- **Environment assumptions** — "The API is available", "The database has the table", "The feature flag is on"
- **Permission assumptions** — "The user has access", "The role can perform this action"
- **Ordering assumptions** — "Step A happens before Step B", "The data is already processed"

#### Undefined Terms Detector

Flag any domain-specific term used without definition. Produce: "Define '[term]' — what specifically does this mean in this system's context?"

### Quality Checklist

Before presenting the final specification, verify:

- [ ] Every vague term has been questioned or defined
- [ ] Every assumption is documented in the Assumptions Log
- [ ] Open questions are specific and answerable
- [ ] Functional AC covers happy path, error paths, and edge cases
- [ ] Technical AC references real codebase elements (when context available)
- [ ] Test criteria maps to acceptance criteria (every AC has at least one test)
- [ ] Implementation steps are ordered with dependencies respected
- [ ] Out of Scope section exists and is non-empty
- [ ] No sentence in the spec contains "should", "might", "could", or "etc."

### Critical Rules

- **Never accept vagueness** — If the PBI says "handle errors gracefully", ask exactly which errors and what graceful means.
- **Never invent requirements** — If the PBI doesn't mention it, don't add it. Flag it as missing instead.
- **Never assume context** — If you're unsure whether a feature exists in the codebase, check. If you can't check, flag it as `[NEEDS CONTEXT]`.
- **Always present questions before the spec** — If critical information is missing, the questions come first. Don't write a spec based on guesses.
- **Be specific, not generic** — "What HTTP status code should be returned when the user is not authorized?" not "Clarify error handling."
- **Separate facts from assumptions** — The Assumptions Log exists for a reason. Use it.

## Output Contract

All skills in the **clarification** phase family use this identical report. Present it in chat before logging progress.

```markdown
### PBI Specification

**1. Summary**
[One paragraph: what is being built, why, and for whom.]

**2. Assumptions log**
| # | Assumption | Status | Notes |
|---|-----------|--------|-------|
| A1 | [text] | Confirmed / Needs Clarification / Rejected | [evidence] |

**3. Open questions**
[Numbered, grouped by Functional / Technical / Scope. Each specific and answerable.]

**4. Functional acceptance criteria**
```
AC-1: [Title]
  Given [precondition]
  When [action]
  Then [expected outcome]
```
[Cover happy path, error paths, edge cases.]

**5. Technical acceptance criteria**
[API changes, data model changes, architecture changes, performance, security.]

**6. Test criteria**
- Unit: [scenarios]
- Integration: [scenarios]
- E2E: [scenarios]
- Edge case: [scenarios]

**7. Implementation steps**
[Ordered, independently verifiable. Reference actual files when codebase available.]

**8. Out of scope**
[Explicit exclusions.]

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Ask targeted questions, not generic clarification requests.
- Do not skip failure states, permissions, or empty states.
- Mark context-dependent items clearly with `[NEEDS CONTEXT]` when repo context is missing.
- Use `assumption-review` when the artifact needs a risk review, not a rewrite into a spec.
- Use `architecture-planning` when design decisions are needed before the spec can be completed.
- Use `impl-*` skills when the spec is ready and implementation should begin.
