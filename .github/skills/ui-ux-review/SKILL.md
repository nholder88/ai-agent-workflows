---
name: ui-ux-review
description: 'Review frontend code for design-system compliance and UX quality. USE FOR: theme-token compliance, hardcoded color detection, accessibility audit, visual hierarchy, spacing consistency, feedback states, loading/error/empty states, keyboard navigation, ARIA labels, design-system violations. DO NOT USE FOR: code correctness or logic review (use code-review-gate), implementing UI changes (use frontend-ui-delivery).'
argument-hint: 'Point me at UI files or a frontend diff and I will review the UX and design-system quality.'
---

# UI UX Review

## When to Use

- After frontend components, pages, or styles changed.
- When a design-system or theme layer may have been bypassed.
- When the UI needs a quality gate distinct from code correctness.

## Review Pillars

1. Theme token compliance
2. Visual hierarchy
3. Spacing consistency
4. Accessibility
5. Feedback and state completeness
6. Consistency across similar surfaces

## Procedure

1. Scan the changed UI files for hardcoded palette classes, inline colors, arbitrary spacing, and manual dark-mode duplication.
2. Inspect semantics, labels, focus styles, and keyboard access.
3. Verify loading, empty, error, success, disabled, hover, and active states.
4. Check whether repeated patterns use the same component variants and layout rules.
5. Report findings as `Blocker`, `Risk`, or `Observation`.

## Output Format

- Summary of design-system and UX readiness.
- Findings table: pillar, severity (`Blocker` / `Risk` / `Observation`), file, finding, and recommendation.
- Blockers first, then risks, then observations.
- Overall assessment: pass, pass with caveats, or blocked.

## Guardrails

- Accessibility blockers are never optional.
- Theme and token bypass should be called out explicitly.
- This skill reviews design quality, not business logic correctness.
