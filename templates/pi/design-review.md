---
description: Audit architecture and design, scout the codebase, implement improvements, then re-audit
argument-hint: "<area or feature to design-review — e.g. 'auth module' or 'data layer'>"
---

Run a design review and improvement cycle on:

> $ARGUMENTS

Work through the steps in order. Each step's output feeds the next.

---

## STEP 1 — Initial Design Audit

Run both review agents in parallel to establish a baseline:

```
Run parallel subagents:
1. Use appsec-sentinel to audit the design and implementation of [$ARGUMENTS] for security architecture issues, threat model gaps, auth/authz weaknesses, data exposure risks, and supply-chain concerns. Write a full report to Review/security-audit-report.md with severities and remediation steps.
2. Use code-review-sentinel to audit [$ARGUMENTS] for architectural weaknesses, design anti-patterns, coupling issues, incorrect abstractions, and correctness problems. Report only findings that genuinely matter.
```

Collect the full findings from both agents. Categorise each finding as:
- **Critical** — must be fixed before proceeding
- **High** — should be fixed in this cycle
- **Medium/Low** — noted for the summary, not blocking

---

## STEP 2 — Codebase Scout

Use scout to build deep context before planning fixes:

```
Use scout to map the [$ARGUMENTS] implementation: entry points, data flow, key abstractions, dependencies, and the specific files flagged in the Step 1 audit. Build enough context to plan targeted fixes without unnecessary edits elsewhere.
```

Carry scout's file map and context into the next step.

---

## STEP 3 — Architecture Planning

Use the audit findings and scout context to plan the improvements:

```
Use architect-planner to produce a targeted improvement plan for [$ARGUMENTS] based on these audit findings: [Critical and High findings from Step 1] and this codebase context: [scout output from Step 2]. The plan should address every Critical and High finding with minimal blast radius. Include a Mermaid diagram of the improved design where relevant.
```

Review the plan. If it introduces new risks or scope creep, trim it back. Confirm the plan covers every Critical and High finding before continuing.

---

## STEP 4 — Implementation

Implement the improvement plan using the correct agent for the stack:

```
Use [implementer] to implement this improvement plan: [plan from Step 3]. Address every Critical and High finding from the audit. For each change, note which finding ID it resolves. Do not change behaviour outside the plan scope.
```

| Stack | Agent |
|---|---|
| Next.js | `nextjs-skeleton-expert` |
| SvelteKit | `sveltekit-skeleton-expert` |
| Angular | `angular-implementer` |
| TS/JS backend | `typescript-backend-implementer` |
| TS/JS frontend | `typescript-frontend-implementer` |
| TS/JS general | `typescript-implementer` |
| Python | `python-implementer` |
| C# / .NET | `csharp-implementer` |
| Rust | `rust-implementer` |
| Go | `go-implementer` |
| Java | `java-implementer` |

Gate: build must pass, no new lint errors.

---

## STEP 5 — Re-Audit

Re-run both review agents on the changed files to confirm the findings are resolved:

```
Run parallel subagents:
1. Use appsec-sentinel to re-audit the files changed in Step 4: [list of changed files]. Confirm all Critical and High findings from the initial audit are resolved. Flag any new issues introduced by the changes.
2. Use code-review-sentinel to re-review the files changed in Step 4: [list of changed files]. Confirm all Blocker findings from the initial audit are resolved. Flag any regressions or new issues.
```

### Re-Audit Gate

- **PASS** — All Critical/High/Blocker findings from Step 1 are resolved; no new Critical/High/Blocker findings introduced
- **FAIL** — Repeat Steps 4–5 (max 2 additional iterations, then escalate to user)

---

## STEP 6 — Summary

Report:
- Original findings (Critical / High / Medium / Low counts)
- Findings resolved vs. remaining
- New findings introduced (should be zero)
- Improvement plan coverage (every Critical and High addressed)
- Build and lint status
- Any Medium/Low findings deferred for a follow-up cycle
