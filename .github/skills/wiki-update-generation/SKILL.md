---
name: wiki-update-generation
description: 'Generate or skip a user-facing wiki update artifact after a completed task. USE FOR: post-task release notes, user-facing wiki pages, deterministic eligibility rules, host-scope checks, PR-ready documentation, changelog entries, how-to guides for shipped features. DO NOT USE FOR: internal developer docs (use docs-config-authoring), in-code documentation (use code-documentation), architecture docs (use architecture-backlog-planning).'
argument-hint: 'Provide completed-task context and repo host details and I will determine whether a wiki update should be produced.'
---

# Wiki Update Generation

## When to Use

- A task has passed its review gate and may need user-facing documentation.
- The repo is on `github.com` or an allowlisted GHES host.
- A workflow needs deterministic rules for deciding whether to write a wiki/update artifact.

## Procedure

1. Normalize the repository host and verify it is in scope.
2. Verify the triggering stage completed successfully.
3. Classify the task as user-visible, how-to relevant, internal-only, or not doc-worthy.
4. If eligible, produce a PR-mode markdown payload with human approval required.
5. If not eligible or out of scope, emit a non-blocking skip or warning outcome with audit metadata.

## Required Sections For Eligible Output

- What changed for users
- How to use
- Out of scope or internal details

## Guardrails

- Do not fail the main workflow if wiki generation fails.
- Keep internal-only refactors out of user-facing output.
- The same normalized input should produce the same eligibility result.
