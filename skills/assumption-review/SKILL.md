---
name: assumption-review
description: >-
  Review a request, plan, PBI, ADR, architecture doc, proposal, or decision for
  hidden assumptions, unknowns, logical gaps, missing sections, stakeholder
  omissions, and risk. Produces severity-tagged findings with specific questions.
  USE FOR: reviewing plans, specs, proposals, design docs before work starts.
  DO NOT USE FOR: code review (use code-review), UI review (use ui-ux-review),
  turning vague requests into specs (use requirements-clarification).
argument-hint: 'Point me at a plan, spec, request, or design document and I will identify the blind spots.'
phase: '1'
phase-family: assumption-risk
---

# Assumption Review

## When to Use

- Before architecture or implementation when the request is vague or untested.
- After a spec is drafted but before the team treats it as complete.
- When a proposal seems reasonable on the surface but may be hiding risk.
- When reviewing any artifact: specifications (functional, technical, API), architecture documents, design docs, PBIs, user stories, feature requests, RFCs, proposals, project plans, roadmaps, meeting notes, decision records (ADRs), business plans, or strategy docs.

## When Not to Use

- Code review — use `code-review`.
- UI/UX review — use `ui-ux-review`.
- Turning vague requests into specs — use `requirements-clarification`.
- Architecture planning for new systems — use `architecture-planning`.

## Procedure

1. **Identify the artifact** — Determine what is being reviewed and its intended decision or outcome. If the user points at a file or pastes text, treat it as the artifact to review.
2. **Read the entire artifact** — Do not stop after the first few findings. Review every section.
3. **Apply the six-category review framework** — Systematically scan for issues in each category (see below). Not every document will have findings in every category; report only what applies.
4. **Classify severity** — Assign Blocker, Risk, or Observation to each finding.
5. **Write specific questions** — Every finding must have a concrete question or recommendation. Never produce a generic "please clarify" without saying what to clarify.
6. **Produce the output** — Follow the Output Contract format.

## Standards

### Six-Category Review Framework

#### 1. Hidden Assumptions

Implicit beliefs the author is taking for granted without stating them.

- **Look for:** Unstated preconditions, assumed performance characteristics, assumed availability of services or data, assumed user state or permissions, assumed ordering or timing.
- **Example:** "The document assumes the external API always responds within 200ms; this is never stated or justified."
- **Output:** List each assumption with a specific question or recommendation (e.g., "State the expected SLA for the payment gateway and what happens when it is exceeded.").

#### 2. Unknowns

Things that are not addressed and cannot be inferred from the document.

- **Look for:** Missing failure modes, unspecified behavior under edge conditions, undefined terms, unstated dependencies, open questions that the document does not answer.
- **Example:** "There is no mention of what happens when the third-party identity provider is down."
- **Output:** List each unknown with a specific question the author must answer.

#### 3. Logical Gaps

Steps or reasoning that don't follow, or missing causal links.

- **Look for:** Non sequiturs, missing steps in a process, conclusions that don't follow from premises, inconsistent statements across sections.
- **Output:** Cite the section or sentence and describe the gap, with a suggested fix or clarifying question.

#### 4. Overlooked Stakeholders

Users, systems, teams, or actors that are affected by the proposal but not mentioned.

- **Look for:** Secondary users, support teams, compliance or legal, dependent systems, partners, internal teams that operate or maintain the system.
- **Output:** Name the stakeholder and how they are affected; ask how they are accounted for.

#### 5. Risk Assessment

Potential failure modes, single points of failure, and dependency risks.

- **Look for:** External dependencies, data loss or corruption scenarios, security and privacy exposure, scalability limits, regulatory or compliance exposure.
- **Output:** For each risk, state the risk, likelihood/impact if possible, and a mitigation question or recommendation.

#### 6. Completeness Check

Sections or considerations that are missing entirely.

- **Look for:** Missing rollout or rollback plan, missing success metrics, missing security or privacy section, missing non-functional requirements, missing out-of-scope section.
- **Output:** List missing sections or considerations and why they matter.

### Severity Rules

| Severity | Meaning | Example |
|----------|---------|---------|
| **Blocker** | Must be resolved before proceeding; the document is incomplete or misleading without it. | "The spec does not define who can access this API; authorization is a blocker." |
| **Risk** | Could cause failure, rework, or harm if not addressed. | "No rollback strategy is described; if the release fails, recovery is undefined." |
| **Observation** | Worth clarifying or documenting but not critical. | "The term 'active user' is used but not defined; consider adding a glossary." |

### Review Checklist

Before finalizing, confirm:

- [ ] Every finding has a **specific** question or recommendation (no "please clarify" without saying what to clarify).
- [ ] Severity is assigned to each finding.
- [ ] You did not assume the author is right — you actively looked for what is missing or implied.
- [ ] You did not skip sections — you considered the whole artifact.
- [ ] You distinguished between "the document says X" (fact) and "the document assumes X" (assumption).
- [ ] Hidden assumptions identified and questioned.
- [ ] Unknowns listed with specific questions.
- [ ] Logical gaps cited with locations.
- [ ] Overlooked stakeholders named.
- [ ] Risks enumerated with severity.
- [ ] Missing sections or considerations noted.

### Critical Rules

- **Never assume the author is right.** Your job is to challenge and probe. If something is unclear or unstated, flag it.
- **Never skip sections.** Review the entire artifact; don't stop after the first few findings.
- **Be specific, not generic.** "What happens to in-flight requests when the service restarts?" not "Clarify failure handling."
- **One finding per row.** Do not bundle multiple issues; each gets its own severity and recommendation.
- **Do not edit the artifact.** You only produce a review document; you do not change the original.
- **Flag uncertainty.** If you are not sure whether something is an assumption or a gap, say so and ask the author to confirm.
- **Default review targets.** Always check for authorization, failure handling, rollback, and non-functional requirements even when the artifact does not mention them.

## Output Contract

All skills in the **assumption-risk** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Assumption Review Report

**Summary**
[2-3 sentences: overall readiness assessment of the reviewed artifact.]

**Findings**
| # | Category | Severity | Finding | Question / Recommendation |
|---|----------|----------|---------|---------------------------|
| 1 | Hidden Assumption | Blocker | [finding] | [specific question] |
| 2 | Unknown | Risk | [finding] | [recommendation] |

_None if artifact is ready as-is._

**Verdict:** Ready as-is / Ready with caveats / Blocked
[If Blocked, list items that must be resolved before proceeding.]

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Do not rewrite the artifact as part of the review.
- Do not collapse multiple concerns into one generic note.
- If uncertain whether something is a gap or an assumption, say so explicitly.
- Use `requirements-clarification` when the artifact needs to be turned into a spec, not just reviewed.
- Use `code-review` when the artifact is source code rather than a plan or document.
- Use `architecture-planning` when architectural decisions need to be made rather than reviewed.
