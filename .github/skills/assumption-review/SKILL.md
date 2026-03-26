---
name: assumption-review
description: 'Review a request, plan, PBI, ADR, architecture doc, proposal, or decision for hidden assumptions, unknowns, logical gaps, missing sections, stakeholder omissions, and risk. USE FOR: reviewing plans, specs, proposals, design docs, decisions before work starts. DO NOT USE FOR: code review (use code-review-gate), UI review (use ui-ux-review), turning vague requests into specs (use requirements-clarification).'
argument-hint: 'Point me at a plan, spec, request, or design document and I will identify the blind spots.'
---

# Assumption Review

## When to Use

- Before architecture or implementation when the request is vague.
- After a spec is drafted but before the team treats it as complete.
- When a proposal seems reasonable on the surface but may be hiding risk.

## Procedure

1. Identify the artifact being reviewed and its intended decision or outcome.
2. Separate facts in the document from implied assumptions.
3. Review six categories: hidden assumptions, unknowns, logical gaps, overlooked stakeholders, risk, and completeness.
4. Write one finding per row or bullet. Each finding needs a severity and a concrete question or recommendation.
5. Treat authorization, failure handling, rollback, and non-functional requirements as default review targets.

## Severity Rules

- `Blocker`: must be answered before implementation proceeds.
- `Risk`: likely rework, instability, or ambiguity if left unresolved.
- `Observation`: worth clarifying but not a stop condition.

## Output

- Short summary of readiness.
- Structured findings with category, severity, finding, and question/recommendation.
- Optional note on whether the artifact is ready as-is, ready with caveats, or blocked.

## Guardrails

- Do not rewrite the artifact as part of the review.
- Do not collapse multiple concerns into one generic note.
- If uncertain whether something is a gap or an assumption, say so explicitly.
