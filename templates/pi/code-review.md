---
description: Run a parallel code quality + security review with a fix loop (max 3 rounds)
argument-hint: "[branch or file list — defaults to current staged/unstaged changes]"
---

Run a thorough code review on the following scope:

> $ARGUMENTS

Work through the steps below. Do not advance past a gate until it passes.

---

## STEP 1 — Scope

Identify what to review:

- If `$ARGUMENTS` names a branch or commit range, list the changed files with `git diff --name-only $ARGUMENTS`
- If `$ARGUMENTS` names specific files, use those
- If `$ARGUMENTS` is empty, use `git diff --name-only HEAD` (uncommitted changes) or the most recent commit

Carry the final file list into every subsequent step.

---

## STEP 2 — Parallel Review

Run both reviewers simultaneously:

```
Run parallel subagents:
1. Use appsec-sentinel to audit these files for security vulnerabilities, supply-chain risks, secrets, and auth/authz issues: [file list from Step 1]. Write findings to Review/security-audit-report.md with severities and remediation steps.
2. Use code-review-sentinel to review these files for bugs, logic errors, correctness issues, and dangerous patterns: [file list from Step 1]. Report only findings that genuinely matter — no style comments.
```

---

## STEP 3 — Gate

Evaluate findings:

- **PASS** — `appsec-sentinel` has no Critical or High severity findings AND `code-review-sentinel` has no Blocker findings
- **FAIL** — proceed to Step 4

If PASS on the first run, skip to Step 6 (Summary).

---

## STEP 4 — Fix Loop

Repeat up to **3 rounds**. Each round:

1. Collect all Blocker (code-review) and Critical/High (appsec) findings into a single prioritised list
2. Select the correct implementer based on the affected files' language/framework and fix all findings:

   ```
   Use [implementer] to fix these review findings: [findings list with file paths]. For each fix, note the finding ID it resolves. Do not introduce new issues while fixing.
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

3. Re-run the parallel review from Step 2 on the changed files only
4. Re-evaluate the gate (Step 3)

After 3 failed rounds, escalate to the user with the persistent findings table and a specific question for each unresolved item.

---

## STEP 5 — Build & Test Verification

After the fix loop clears the gate, confirm nothing is broken:

```
Run the build and test suite to confirm the fixes did not introduce regressions.
```

- Build must pass
- No previously-passing tests may now fail

If regressions are found, fix them and re-run this step before continuing.

---

## STEP 6 — Summary

Report:

- Overall result: PASS or ESCALATED
- Number of fix rounds taken
- Findings resolved (by ID)
- Any remaining Medium/Low findings noted (not blocking)
- Build and test status
