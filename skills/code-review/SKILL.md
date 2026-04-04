---
name: code-review
description: >-
  Review changed code for completeness, correctness, conciseness, readability,
  regressions, missing tests, and standards compliance. Scores across four
  pillars and produces actionable findings with severity.
  USE FOR: code review after implementation, quality gate before merge, standards
  compliance check.
  DO NOT USE FOR: UI/UX design review (use ui-ux-review), security audit (use
  appsec-audit), requirements clarification (use requirements-clarification).
argument-hint: 'Point me at changed code and I will review it for quality and correctness.'
phase: '7b'
phase-family: code-review
---

# Code Review

## When to Use

- Code has been written or modified by any agent or human.
- A quality gate is needed before merge or handoff.
- Standards compliance verification is required after implementation.

## When Not to Use

- UI/UX design quality review -- use `ui-ux-review`.
- Security audit with threat modeling and CVE research -- use `appsec-audit`.
- Requirements are unclear -- use `requirements-clarification` first.
- Implementation is needed -- use the appropriate `impl-*` skill.

## Procedure

### Step 1: Gather Context

- Read any `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, or similar project documentation files to understand project conventions, coding standards, architecture decisions, and established patterns.
- Identify the project's language, framework, testing conventions, and style guidelines.
- Understand the intent of the changes -- what problem was being solved and what was the expected outcome.

### Step 2: Identify Changed Code

- Use available tools to examine the files that were recently modified or created.
- Use `git diff` or similar mechanisms to see exactly what changed.
- Understand the scope of changes -- which files were touched, what was added, modified, or removed.
- If any changed files are under `templates/**`, run `node templates/tools/validate-parity.ts --root .` and include failures as review findings.

### Step 3: Review Against Four Pillars

For each changed file or logical unit of change, evaluate against these four criteria:

#### Pillar 1 -- Completeness

- Are all requirements addressed? Does the implementation fully solve the stated problem?
- Are edge cases handled (null/undefined values, empty collections, boundary conditions, error states)?
- Are there missing error handlers, missing validation, or incomplete implementations (TODO comments, placeholder logic)?
- If tests were expected or exist for similar code, are tests included or updated?
- Are type definitions, interfaces, or schemas updated to reflect changes?
- Is documentation updated where necessary (inline comments for complex logic, docstrings, API docs)?
- For template changes, verify parity governance artifacts still align: `templates/shared/stack-catalog.yaml`, `templates/shared/capability-parity-matrix.yaml`, and `templates/shared/parity-evidence-schema.yaml`.

#### Pillar 2 -- Correctness

- Is the logic sound? Trace through the code mentally with various inputs.
- Are there off-by-one errors, race conditions, or potential null pointer exceptions?
- Are APIs and library functions used correctly (correct argument order, return value handling)?
- Are async/await patterns, error propagation, and resource cleanup handled properly?
- Does the code match the project's existing patterns and conventions found in documentation?
- Are there security concerns (SQL injection, XSS, unvalidated input, exposed secrets)? For a deep AppSec audit with supply-chain, deployment, and cited CVE research, use `appsec-audit` in parallel.
- Are imports correct and necessary?

#### Pillar 3 -- Conciseness

- Is there duplicated code that could be extracted into shared functions or utilities?
- Are there unnecessary abstractions or over-engineered solutions for simple problems?
- Is there dead code, unused imports, or commented-out code that should be removed?
- Could complex expressions be simplified without sacrificing readability?
- Are there verbose patterns that the language/framework provides shorter idiomatic alternatives for?

#### Pillar 4 -- Readability

- Are variable, function, and class names descriptive and consistent with project conventions?
- Is the code structure logical -- are related things grouped together?
- Are complex algorithms or business logic accompanied by explanatory comments?
- Is the code formatted consistently with the rest of the project?
- Are functions and methods a reasonable length? Should any be broken up?
- Is the control flow easy to follow? Are there deeply nested conditionals that could be flattened?

### Step 4: Classify Findings

Assign each finding a severity:

- **Critical issues** (must fix) -- Problems that would cause bugs, security vulnerabilities, data loss, or crashes.
- **Recommendations** (should fix) -- Improvements for code quality, maintainability, or adherence to project standards.
- **Nitpicks** (optional) -- Minor style or preference items that are not wrong but could be marginally better.

### Step 5: Produce the Review Report

Structure the review using the Output Contract below.

## Important Guidelines

- **Be specific**: Always reference exact files, line numbers, and code snippets. Never give vague feedback like "improve error handling" without pointing to exactly where and how.
- **Be constructive**: Every criticism must come with a suggested fix or alternative approach.
- **Respect project conventions**: If the project uses a particular style or pattern (even if you might prefer another), evaluate against the project's established standards, not personal preferences. The `CLAUDE.md` and project documentation are the source of truth.
- **Prioritize**: Focus most attention on critical and recommendation-level issues. Do not bury important feedback under a mountain of nitpicks.
- **Consider the broader codebase**: Evaluate whether changes are consistent with patterns used elsewhere in the project.
- **Be thorough but efficient**: Review every changed file, but scale depth of review to the complexity and risk of the changes.
- **Flag uncertainty**: If unsure whether something is an issue, say so explicitly rather than presenting speculation as fact.
- **Do NOT make changes yourself**: This skill only produces reviews; it does not modify source files. Present findings so another agent or the user can act on them.

## Pass / Fail Gate

**PASS** -- All of the following are true:
- Zero Critical issues
- All four pillar scores >= 3/5
- No unaddressed regressions

**FAIL** -- Any of the following are true:
- Any Critical issue exists
- Any pillar scores 1/5
- A regression is introduced

On FAIL, pass the full findings to the appropriate implementer agent with explicit instruction: "Fix every Critical issue. For each fix, note the finding number it addresses."

## Output Contract

All skills in the **code-review** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Code Review Report

**Summary**
[2-3 sentences: overall assessment of the changes.]

**What looks good**
- [Positive observations]

**Critical issues**
| # | File | Finding | Recommendation |
|---|------|---------|----------------|
| 1 | `path` | [issue] | [fix] |

_None if clean._

**Recommendations**
| # | File | Finding | Recommendation |
|---|------|---------|----------------|
| 1 | `path` | [suggestion] | [improvement] |

**Nitpicks**
- [Minor style or preference items]

**Score card**
| Pillar | Score |
|--------|-------|
| Completeness | X/5 |
| Correctness | X/5 |
| Conciseness | X/5 |
| Readability | X/5 |
| **Overall** | **X/5** |

**Gate verdict:** PASS / FAIL
[If FAIL, list blocking items.]

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Do not make code changes yourself. You identify issues; you do not fix them.
- Do not add features or refactor code beyond reporting findings.
- Use `ui-ux-review` for design-system and UX quality concerns.
- Use `appsec-audit` for deep security audit, threat modeling, and CVE intelligence.
- Use `requirements-clarification` when the spec is vague or has unresolved questions.
