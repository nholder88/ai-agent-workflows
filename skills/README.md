# Skill Library

This folder contains the skill library for the agent pipeline. Each skill is a self-contained definition with inline standards, a phase-specific output contract, and guardrails.

## Design Rules

- Skills are the **authoritative source of truth** for procedures, standards, and output contracts. Agents reference skills — not the other way around.
- Every skill contains **all standards inline**. No external document references for procedures or production standards.
- All skills in the same **phase family** share an **identical output contract** template (e.g., all implementation skills use the same Implementation Complete Report).
- Skills do not carry agent-only orchestration: `handoffs`, `model`, `color`, or `tools` stay in agent files.
- Each SKILL.md has YAML frontmatter with: `name`, `description` (with USE FOR / DO NOT USE FOR), `argument-hint`, `phase`, `phase-family`.
- Each SKILL.md body follows: When to Use, When Not to Use, Procedure, Standards, Output Contract, Guardrails.

## Phase Families

| Phase Family | Phase | Skills |
|---|---|---|
| Intake & discovery | 0, 0.5 | `system-reconstruction` |
| Assumption & risk | 1 | `assumption-review` |
| Architecture & planning | 2 | `architecture-planning` |
| Clarification & spec | 3 | `requirements-clarification` |
| Implementation spec | 3.5 | `implementation-spec` |
| Implementation | 4 | `impl-python`, `impl-typescript-backend`, `impl-csharp`, `impl-rust`, `impl-go`, `impl-java`, `impl-nextjs`, `impl-sveltekit`, `impl-angular`, `impl-typescript-frontend`, `implementation-routing` |
| UI quality | 4.5 | `ui-ux-review` |
| Testing | 5 | `test-backend-unit`, `test-frontend-unit`, `test-e2e-ui` |
| Documentation | 6 | `code-documentation`, `docs-config-authoring` |
| Security | 7a | `appsec-audit` |
| Code review | 7b | `code-review` |
| Wiki update | 7.5 | `wiki-update` |
| Infrastructure | infra | `containerization` |
| Pre-pipeline | — | `business-idea-validation` |

See `agent-to-skill-map.md` for traceability from agents to skills.
