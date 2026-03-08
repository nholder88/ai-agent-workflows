# Template Projects Baseline

This folder defines reusable, opinionated project templates so new applications start with consistent architecture, security, observability, feature flags, and admin/reporting hooks.

## Goal

Create repeatable projects where:
- Frontend apps start with the same core component model.
- Backend services start with the same environment, security, logging, and mapping patterns.
- Cross-cutting capabilities (feature flags, reporting, admin dashboards) are designed in from day one.

## Files

- `frontend-web/template-spec.yaml`: Generic frontend baseline.
- `frontend-nextjs/template-spec.yaml`: Next.js-specific baseline.
- `frontend-sveltekit/template-spec.yaml`: SvelteKit-specific baseline.
- `frontend-angular/template-spec.yaml`: Angular-specific baseline.
- `backend-service/template-spec.yaml`: Generic Node/NestJS backend baseline.
- `backend-dotnet/template-spec.yaml`: ASP.NET Core backend baseline.
- `backend-python/template-spec.yaml`: FastAPI backend baseline.
- `backend-go/template-spec.yaml`: Go/Fiber backend baseline.
- `backend-java/template-spec.yaml`: Spring Boot backend baseline.
- `backend-rust/template-spec.yaml`: Axum backend baseline.
- `*/.env.example`: Stack-specific environment baselines.
- `shared/platform-contracts.yaml`: Contracts shared across frontend/backend.
- `shared/capability-parity-matrix.yaml`: Required functionality parity across stacks.
- `shared/stack-catalog.yaml`: Canonical stack-to-template mapping.
- `shared/wiki-update-contract.yaml`: Shared policy defaults for post-Stage-7 wiki update behavior.
- `shared/ci-command-contract.yaml`: Canonical CI/CD slot contract (`install`, `lint`, `build`, `unit_test`, `e2e_test`, `package`, `deploy`).
- `shared/ci-stack-command-matrix.yaml`: Per-stack commands for each slot in the CI/CD contract.
- `shared/workflows/ci-pr.yaml`: Reusable PR CI template with deterministic slot execution order.
- `shared/workflows/ci-main.yaml`: Reusable main-branch CI template.
- `shared/workflows/cd-release.yaml`: Reusable release/package template.
- `shared/workflows/cd-deploy.yaml`: Reusable deploy template with environment and secret-name placeholders.
- `scaffold-prompt.md`: Prompt template for running these standards through the agents.

## Operating Model

1. Start with `shared/platform-contracts.yaml` as source of truth.
2. Instantiate frontend and backend specs for the project.
	Frontend state management is framework-specific:
	- Next.js: Zustand + TanStack Query
	- SvelteKit: Svelte stores + TanStack Query
	- Angular: NgRx + RxJS
3. Use `scaffold-prompt.md` with `architect-planner` or `orchestrator` to generate concrete files.
4. Enforce drift checks in code review: reject PRs that remove required baseline capabilities without explicit approval.
5. Enforce capability parity with `shared/capability-parity-matrix.yaml` so functionality is equivalent across language choices.
6. Enforce CI/CD and test-template parity with `shared/ci-command-contract.yaml`, `shared/ci-stack-command-matrix.yaml`, and `shared/workflows/*.yaml`.
7. Enforce wiki-update parity with `shared/wiki-update-contract.yaml` and per-stack `wiki_update` fields.

Testing baseline guidance:

- Frontend stacks use browser E2E starter coverage and map to slot `e2e_test`.
- Backend stacks use API smoke/integration starter coverage and map to slot `e2e_test`.

## Governance

- Update template specs first, then project implementations.
- Version template changes in git and tag breaking changes.
- Keep required keys stable; add new keys as optional before promoting to required.

Validation commands from repository root:

```bash
npm install
npm run templates:test-parity
npm run templates:validate-parity
```

## Wiki Update Workflow Defaults

Wiki update automation is scaffolded for all stack specs and validated for parity.

- Trigger: runs only after Stage 7 code-review PASS
- Host scope: `github.com` and GHES hosts from `policy.scope.ghesAllowlist`
- Output mode default: `pr`
- Human approval default: `true`
- Failure mode: non-blocking warning plus audit

Required stack metadata keys:

- `wiki_update.enabled`
- `wiki_update.contract_ref`
- `wiki_update.output_mode_default`
- `wiki_update.human_approval_default`

## Governance and Troubleshooting

- Keep GHES allowlist updates in `Templates/shared/wiki-update-contract.yaml` under change control.
- Re-run parity commands after any contract or stack-spec wiki metadata change.
- For unsupported hosts, wiki generation is skipped by design and an audit warning should be recorded.
