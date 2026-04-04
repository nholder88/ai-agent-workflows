---
name: business-idea-validation
description: >-
  Interrogate a product or business idea across problem-solution fit, target
  audience, market analysis, business model, and growth strategy. Produces a
  structured validation report with MVP definition and risk assessment.
  USE FOR: product idea validation, business model analysis, MVP scoping,
  market assessment.
  DO NOT USE FOR: technical architecture (use architecture-planning),
  requirements specification (use requirements-clarification), implementation
  (use impl-* skills).
argument-hint: 'Describe your product or business idea and I will pressure-test it.'
phase: 'pre-pipeline'
phase-family: validation
---

# Business Idea Validation

## When to Use

- An idea is still being shaped and needs structured pressure-testing.
- A founder or product owner needs an MVP definition instead of broad aspiration.
- A plan needs facts separated from hopes and assumptions.
- Market analysis, competitive landscape, or business model validation is needed.

## When Not to Use

- Technical architecture design — use `architecture-planning`.
- Requirements specification with acceptance criteria — use `requirements-clarification`.
- Implementation of any kind — use the appropriate `impl-*` skill.
- Marketing copy or pitch decks — out of scope.

## Procedure

1. **Receive the idea** — Read or listen to the user's description of their business or product idea.
2. **Ask, don't assume** — Use the seven validation lenses (below) to ask targeted questions. Fill in the report as answers emerge.
3. **Iterate** — If the user gives partial answers, note "[To be answered by user]" or "[Needs research]" and continue the conversation or produce the report with gaps clearly marked.
4. **Produce the report** — Output the full Business Validation Report using the template in Required Sections below.
5. **Suggest next steps** — Recommend `architecture-planning` for technical design, `requirements-clarification` for MVP specs, or human review for blind spots.

## Questioning Framework

Use these seven lenses to interrogate the idea. Ask questions before advising; challenge assumptions; push for specificity.

### 1. Problem Validation

- What specific problem does this solve?
- Who experiences this problem today? How do they solve it (or suffer) today?
- How painful is the problem? (Frequency, cost, emotional weight)
- How do you know the problem is real? (Evidence: interviews, data, personal experience)
- What happens if the problem is never solved?

### 2. Target Audience

- Who does this serve? (Demographics, role, industry, geography)
- What are their behaviors, goals, and constraints?
- What are their current alternatives? Why are they unsatisfied?
- How will you reach them? Where do they spend time and attention?
- Can you name three specific people (or companies) who would be early adopters?

### 3. Market Analysis

- What is the addressable market size? (TAM, SAM, SOM if applicable)
- Who are the direct and indirect competitors?
- What substitutes exist (including "do nothing")?
- What is your differentiation? Why would someone switch to you?
- Are there regulatory, platform, or ecosystem dependencies?

### 4. Value Proposition

- Why would someone choose this over alternatives?
- What is the one thing you do better than anyone else?
- How do you articulate the value in one sentence?
- What proof or signal would make a skeptic believe?

### 5. Business Model

- How does this make money? (Subscription, transaction, usage, license, etc.)
- What are the unit economics? (CAC, LTV, margin per customer/product)
- What are the main cost drivers?
- When do you expect to break even or become profitable (rough)?

### 6. Growth Strategy

- How do you acquire the first 10 users? The first 100?
- What is the primary growth loop? (Viral, content, sales, partnership, etc.)
- How do you scale from early adopters to a broader market?
- What channels will you use and why those?

### 7. Risks and Assumptions

- What must be true for this to work? List every assumption.
- What could kill this idea? (Technology, market, competition, regulation, execution)
- What are you most uncertain about? How will you de-risk it?
- What would convince you to stop or pivot?

## Required Sections in Business Validation Report

### 1. Idea Summary

One paragraph: what the product or business is, who it serves, and what problem it solves. Plain language, no jargon.

### 2. Problem-Solution Fit

- **Problem statement:** Clear description of the problem and evidence it is real.
- **Solution hypothesis:** How the idea addresses the problem.
- **Fit assessment:** Strong / Moderate / Weak — with justification.

### 3. Target Customer Profile

- Primary persona: role, goals, pains, current alternatives, how you reach them.
- Optional: secondary persona or early-adopter segment.
- Specificity over generality: "B2B product managers at Series A SaaS companies" not "business users."

### 4. Competitive Landscape

- Direct competitors and how they position.
- Indirect competitors and substitutes (including doing nothing).
- Differentiation in one or two sentences.

### 5. Value Proposition Canvas

- **Core promise:** The one thing you do better than alternatives.
- **Key benefits:** What the customer gains (outcomes, emotions, savings).
- **Proof points:** What evidence or validation supports the promise (even if planned).

### 6. Revenue Model

- How you make money (pricing type and model).
- Unit economics (if known): CAC, LTV, margin, or "To be validated."
- Main cost drivers.
- Break-even or profitability (rough timeline or "To be validated").

### 7. Risks and Assumptions Log

| # | Assumption or risk | Type (Assumption / Risk) | Mitigation or validation approach |
|---|--------------------|--------------------------|-----------------------------------|
| 1 | [item] | Assumption | [approach] |
| 2 | [item] | Risk | [approach] |

Every assumption that must hold for the idea to work; every material risk and how the user might address it.

### 8. MVP Definition

The smallest thing to build to validate the core hypothesis. Be ruthless: if it does not validate the main assumption, it is out of scope for the MVP.

- **Scope:** What is in the MVP. What is explicitly out (v2 or later).
- **Core features:** 3-5 features max. Each tied to a validation question.
- **Success metrics:** How you will know if the MVP is working (signups, retention, revenue, feedback).
- **Rough timeline:** Weeks or months to build and run the first validation cycle.
- **Core hypothesis:** One sentence: "We believe that [target customer] will [do X] because [value]."

### 9. Next Steps

Concrete actions the user can take before or right after building the MVP:

- Validate: interviews, surveys, landing page, pre-sales.
- Build: scope the MVP and hand off to an architect or dev team.
- Measure: define success metrics and how to collect them.
- Decide: what would trigger a pivot or a full commitment.

## MVP Scoping Rules

- **Ruthlessly small.** If a feature does not test the core hypothesis, it does not belong in the MVP.
- **One core hypothesis.** The MVP should answer one main question (e.g., "Will users pay?" or "Will they use it weekly?").
- **Measurable.** Define success in numbers or clear criteria, not vague "user satisfaction."
- **Time-boxed.** Give a rough timeline so the user knows when to review and decide.

## Questioning Style

- **Socratic:** Ask before advising. "Who exactly experiences this problem?" before "You should target SMBs."
- **Challenge assumptions.** "You're assuming users will pay monthly — what if they prefer one-time?"
- **Push for specificity.** "Business users" -> "Which role? Which industry? Which company size?"
- **Separate facts from hopes.** "Have you talked to 10 users?" vs "We think users want this."
- **Be direct but constructive.** You can say an idea is weak on a dimension and then ask how to strengthen it.

## Output Contract

All skills in the **validation** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Business Validation Report

**Verdict:** Viable / Viable with caveats / Not viable as described

**Problem-solution fit**
[Assessment with score or rating.]

**Target audience**
[Definition and validation.]

**Market analysis**
[Size, competition, positioning.]

**Business model**
[Revenue model, unit economics if applicable.]

**MVP definition**
[Core features, scope, timeline estimate.]

**Risks and assumptions**
| # | Risk/Assumption | Severity | Mitigation |
|---|----------------|----------|------------|
| 1 | [item] | High/Med/Low | [action] |

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Never validate a bad idea just to be nice. If the problem is vague, the market is unclear, or the differentiation is weak, say so and ask the questions that force clarity.
- Always push for specificity. Vague ideas get vague reports; specific answers get actionable plans.
- Separate facts from hopes. Mark what is evidenced vs assumed.
- MVP is minimal. Resist feature creep; the user's job is to validate quickly, not to build the full product.
- Output is a document. Produce the full Business Validation Report so the user (or another agent) can use it for architecture, specs, or assumption review.
