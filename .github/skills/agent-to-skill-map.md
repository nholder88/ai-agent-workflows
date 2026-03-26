# Agent To Skill Map

This map records which reusable skills were extracted from each existing agent.

## Skill Coverage

| Source agent | Extracted skills |
|---|---|
| `architect-planner` | `architecture-backlog-planning` |
| `assumption-reviewer` | `assumption-review` |
| `pbi-clarifier` | `requirements-clarification` |
| `system-reverse-engineer` | `system-reconstruction` |
| `typescript-implementer` | `implementation-routing` |
| `typescript-backend-implementer` | `implementation-from-spec` |
| `typescript-frontend-implementer` | `frontend-ui-delivery` |
| `angular-implementer` | `frontend-ui-delivery` |
| `nextjs-skeleton-expert` | `frontend-ui-delivery` |
| `sveltekit-skeleton-expert` | `frontend-ui-delivery` |
| `java-implementer` | `implementation-from-spec` |
| `csharp-implementer` | `implementation-from-spec` |
| `python-implementer` | `implementation-from-spec` |
| `go-implementer` | `implementation-from-spec` |
| `rust-implementer` | `implementation-from-spec` |
| `backend-unit-test-specialist` | `test-generation` |
| `frontend-unit-test-specialist` | `test-generation` |
| `ui-test-specialist` | `test-generation` |
| `code-review-sentinel` | `code-review-gate` |
| `ui-ux-sentinel` | `ui-ux-review` |
| `code-documenter` | `code-documentation` |
| `markdown-technical-writer` | `docs-config-authoring` |
| `docker-architect` | `containerization-and-env` |
| `graphql-specialist` | `data-query-specialists` |
| `sql-specialist` | `data-query-specialists` |
| `mongodb-specialist` | `data-query-specialists` |
| `redis-specialist` | `data-query-specialists` |
| `idea-validator` | `business-idea-validation` |
| `orchestrator` | `workflow-orchestration` |
| `wiki-update-agent` | `wiki-update-generation` |

## Intentionally Excluded From Skills

The following agent features were not copied into skill frontmatter because they are orchestration concerns rather than reusable procedures:

- `handoffs`
- `tools`
- `model`
- `color`
- repo-specific progress logging templates in `agent-progress/`

## Notes

- The map records behaviors extracted from agent body content and companion docs. It does not treat handoffs as extracted skill behavior.
- Frontend framework specialization was deduplicated into one `frontend-ui-delivery` skill, but that skill preserves explicit Angular, Next.js, and SvelteKit subsections instead of flattening them into generic UI advice.
- Language implementers were deduplicated into `implementation-routing` plus `implementation-from-spec`: one skill for specialist routing policy, one for multi-language spec-to-code delivery.
- Documentation was split back into `code-documentation` and `docs-config-authoring` so source-code docs and non-code authoring remain separate discovery surfaces.
- Database specialists were merged into one `data-query-specialists` skill with engine detection and performance-review workflow.