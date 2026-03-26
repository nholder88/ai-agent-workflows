---
name: requirements-clarification
description: 'Turn a vague feature request, user story, backlog item, or PBI into a precise specification. USE FOR: PBI clarification, user story refinement, acceptance criteria writing, Given/When/Then format, open questions, implementation steps, scope definition, ambiguous requirements. DO NOT USE FOR: reviewing existing specs for risk (use assumption-review), architecture planning (use architecture-backlog-planning), code implementation (use implementation-from-spec).'
argument-hint: 'Paste a PBI, feature request, or rough requirement and I will turn it into a precise spec.'
---

# Requirements Clarification

## When to Use

- A feature request contains vague words like fast, simple, robust, or user-friendly.
- The request is missing actor, trigger, input, output, failure behavior, or scope boundaries.
- A backlog item needs a spec another engineer or agent can implement without follow-up.

## Procedure

1. Read the request and mark vague language, undefined terms, and hidden assumptions.
2. If inside a repo, inspect relevant models, routes, tests, and existing patterns first.
3. Produce specific open questions grouped by functional, technical, and scope concerns.
4. Write functional acceptance criteria in Given/When/Then format.
5. Add technical acceptance criteria tied to real files, APIs, models, or conventions when repo context exists.
6. Add unit, integration, end-to-end, and edge-case test criteria.
7. Finish with ordered implementation steps and an explicit out-of-scope section.

## Output Contract

- Summary
- Assumptions log
- Open questions
- Functional AC
- Technical AC
- Test criteria
- Implementation steps
- Out of scope

## Guardrails

- Ask targeted questions, not generic clarification requests.
- Do not skip failure states, permissions, or empty states.
- Mark context-dependent items clearly when repo context is missing.
