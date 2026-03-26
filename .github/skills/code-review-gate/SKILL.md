---
name: code-review-gate
description: 'Review changed code for completeness, correctness, conciseness, readability, regressions, missing tests, and standards compliance. USE FOR: post-implementation code review, final quality gate, PR review, diff review, finding bugs, missing edge cases, standards violations. DO NOT USE FOR: UI/UX design review (use ui-ux-review), fixing code (use implementation-from-spec), reviewing plans or specs (use assumption-review).'
argument-hint: 'Point me at changed files, a diff, or a task outcome and I will review it.'
---

# Code Review Gate

## When to Use

- After any meaningful code change.
- Before merging or handing work back as complete.
- When a fix loop needs a precise list of remaining defects or risks.

## Review Procedure

1. Gather intent, changed files, and relevant project conventions.
2. Inspect the actual diff or touched files.
3. Review against four pillars: completeness, correctness, conciseness, and readability.
4. Check for missing tests, incomplete edge cases, unsafe assumptions, and standards violations.
5. Produce findings ordered by severity with concrete fixes.

## Review Output

- Critical issues that must be fixed.
- Recommendations that should be fixed.
- Optional nitpicks.
- Score card for the four pillars.

## Guardrails

- Findings must reference real files and concrete issues.
- Do not fix the code as part of the review unless explicitly asked.
- Prioritize bugs, regressions, and missing verification over stylistic preferences.
