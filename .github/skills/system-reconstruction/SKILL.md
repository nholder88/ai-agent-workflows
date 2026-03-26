---
name: system-reconstruction
description: 'Reverse engineer an existing codebase into a reconstruction-ready system specification. USE FOR: onboarding, codebase audits, handoff documentation, documentation preflight, rebuilding a system from code, understanding unfamiliar repos, generating architecture docs from existing code. DO NOT USE FOR: designing new architecture (use architecture-backlog-planning), code changes or refactoring (use implementation-from-spec).'
argument-hint: 'Point me at a codebase and I will produce a reconstruction-ready system spec.'
---

# System Reconstruction

## When to Use

- Documentation is partial or missing.
- A repo needs onboarding material or a rebuild-ready specification.
- Planning must be grounded in the current implementation rather than assumptions.

## Procedure

1. Scan the repo root, manifests, entry points, build files, and top-level folders.
2. Detect languages, frameworks, databases, deployment style, and testing stack.
3. Catalog features, rules, APIs, data model, environment/config, and integration points.
4. Build architecture, sequence, user-flow, and data-model diagrams from observed code.
5. Separate confirmed facts from assumptions and open questions.
6. Write a reconstruction-ready spec set with stable sections and filenames rather than an ad hoc summary.

## Expected Artifacts

Write all artifacts to `docs/system-spec/` by default, or to a caller-specified directory.

- `00-index.md` or equivalent index
- `01-system-overview.md`
- `02-architecture.md`
- `03-features-and-rules.md`
- `04-api-and-interfaces.md`
- `05-data-model.md`
- `06-diagrams-and-flows.md`
- `07-environment-and-config.md`
- `08-technology-analysis.md`
- `09-areas-of-improvement.md`
- `10-assumptions-and-unknowns.md`

## Guardrails

- Verify from code when possible; do not guess.
- Keep assumptions in their own section.
- Make each artifact usable on its own.
