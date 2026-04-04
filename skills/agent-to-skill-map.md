# Agent to Skill Map

This map records which skill each agent references for its procedure, standards, and output contract.

## Mapping

| Agent | Skill | Phase |
|---|---|---|
| `orchestrator` | _(standalone agent — no skill)_ | all |
| `assumption-reviewer` | `assumption-review` | 1 |
| `architect-planner` | `architecture-planning` | 2 |
| `pbi-clarifier` | `requirements-clarification` | 3 |
| `implementation-spec` | `implementation-spec` | 3.5 |
| `system-reverse-engineer` | `system-reconstruction` | 0.5 |
| `typescript-implementer` | `implementation-routing` | 4 |
| `typescript-backend-implementer` | `impl-typescript-backend` | 4 |
| `python-implementer` | `impl-python` | 4 |
| `csharp-implementer` | `impl-csharp` | 4 |
| `rust-implementer` | `impl-rust` | 4 |
| `go-implementer` | `impl-go` | 4 |
| `java-implementer` | `impl-java` | 4 |
| `nextjs-skeleton-expert` | `impl-nextjs` | 4 |
| `sveltekit-skeleton-expert` | `impl-sveltekit` | 4 |
| `angular-implementer` | `impl-angular` | 4 |
| `typescript-frontend-implementer` | `impl-typescript-frontend` | 4 |
| `ui-ux-sentinel` | `ui-ux-review` | 4.5 |
| `backend-unit-test-specialist` | `test-backend-unit` | 5a |
| `frontend-unit-test-specialist` | `test-frontend-unit` | 5b |
| `ui-test-specialist` | `test-e2e-ui` | 5c |
| `code-documenter` | `code-documentation` | 6 |
| `markdown-technical-writer` | `docs-config-authoring` | 6 |
| `appsec-sentinel` | `appsec-audit` | 7a |
| `code-review-sentinel` | `code-review` | 7b |
| `wiki-update-agent` | `wiki-update` | 7.5 |
| `docker-architect` | `containerization` | infra |
| `idea-validator` | `business-idea-validation` | — |
| `graphql-specialist` | `data-graphql` | 4 |
| `sql-specialist` | `data-sql` | 4 |
| `mongodb-specialist` | `data-mongodb` | 4 |
| `redis-specialist` | `data-redis` | 4 |

## Design Notes

- The **orchestrator** is the only agent without a skill — it is the pipeline controller, not a specialist.
- Each agent file is a **thin wrapper** (~30-40 lines): frontmatter (name, tools, handoffs, model, color) + role identity + skill reference link + progress log instructions.
- All procedure, standards, and output contracts live in skills. Agents do not duplicate them.
- Skills in the same phase family share an **identical output contract** template.
- Previous consolidated skills (`implementation-from-spec`, `frontend-ui-delivery`, `data-query-specialists`, `test-generation`) have been split into language/framework/engine-specific skills where standards differ materially.
