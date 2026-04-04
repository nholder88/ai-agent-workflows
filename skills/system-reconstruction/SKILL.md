---
name: system-reconstruction
description: >-
  Reverse engineer an existing codebase into a complete, reconstruction-ready
  specification. Produces stable artifacts: system overview, architecture,
  features and rules, APIs, data model, diagrams, environment/config,
  technology analysis, improvements, and assumptions.
  USE FOR: understanding unfamiliar codebases, producing system documentation,
  reconstruction-ready specs for legacy systems.
  DO NOT USE FOR: implementation (use impl-* skills), architecture planning
  for new systems (use architecture-planning), code review (use code-review).
argument-hint: 'Point me at a codebase and I will reverse engineer it into a full system specification.'
phase: '0.5'
phase-family: discovery
---

# System Reconstruction

## When to Use

- Documentation is partial or missing for an existing codebase.
- A repo needs onboarding material or a rebuild-ready specification.
- Planning must be grounded in the current implementation rather than assumptions.
- Auditing a system, creating a handoff spec, or understanding an unfamiliar codebase.

## When Not to Use

- Designing new architecture from scratch — use `architecture-planning`.
- Code changes or refactoring — use the appropriate `impl-*` skill.
- Code review — use `code-review`.
- Reviewing a plan or spec for risk — use `assumption-review`.

## Procedure

### Phase 1: Project Scan

- Read the project root: `package.json`, `requirements.txt`, `*.csproj`, `go.mod`, `pom.xml`, `Cargo.toml`, or equivalent.
- Identify the directory structure and file organization.
- Read README, CONTRIBUTING, CLAUDE.md, or any existing documentation.
- Identify entry points (main files, server startup, CLI commands).

### Phase 2: Technology Detection

- Identify languages, frameworks, and versions.
- Identify build tools, bundlers, linters, test frameworks.
- Catalog dependencies and their roles.
- Check for configuration files (`.env`, `appsettings.json`, `application.yml`, etc.).
- Determine the architecture style (monolith, microservices, monorepo, serverless).

### Phase 3: Feature and Rule Extraction

- Trace every user-facing feature from entry point to data store.
- Extract business rules, validation logic, and authorization rules.
- Identify state machines and lifecycle transitions.
- Document computed/derived values and their formulas.
- Map feature boundaries and cross-cutting concerns.

### Phase 4: Interface and Contract Mapping

- Catalog all API endpoints with methods, paths, request/response shapes.
- Identify WebSocket events, CLI commands, background jobs.
- Document third-party API integrations (what's called, what's sent/received).
- Map authentication and authorization mechanisms.
- Note error response formats, pagination patterns, rate limits.

### Phase 5: Data Model Extraction

- Identify all entities/models with fields, types, and constraints.
- Map relationships (one-to-many, many-to-many, polymorphic).
- Identify databases and data stores (SQL, NoSQL, cache, file storage, search).
- Document data access patterns (ORM, raw queries, repository pattern).
- Check for migrations, seeds, and data lifecycle.

### Phase 6: Flow and Diagram Construction

- Build Mermaid architecture diagrams from component relationships.
- Build user flow diagrams for each major feature.
- Build sequence diagrams for critical multi-component interactions.
- Build state machine diagrams for entities with lifecycles.
- Build data flow diagrams showing how data moves through the system.

### Phase 7: Quality and Risk Assessment

- Identify code smells, duplication, and inconsistent patterns.
- Flag potential bugs (unhandled errors, race conditions, missing validation).
- Note dead code and unused dependencies.
- Assess security (hardcoded secrets, missing auth, injection risks).
- Check dependency currency (outdated versions).

### Phase 8: Assumption Separation

- Review every finding and separate facts from inferences.
- Document every assumption with rationale.
- List open questions that need human clarification.
- Flag ambiguous or contradictory areas in the codebase.

## Standards

### Output Directory

Write all spec files to `docs/system-spec/` (or a user-specified path). Create the directory if it doesn't exist.

### Stable Naming Convention

Use the numbered naming convention for predictable ordering. Files reference each other via relative links.

| File | Purpose |
|------|---------|
| `00-index.md` | Spec index, reading guide, reconstruction instructions |
| `01-system-overview.md` | Technology-agnostic description of what the system does |
| `02-architecture.md` | Components, relationships, communication patterns |
| `03-features-and-rules.md` | Every feature and business rule described as behavior |
| `04-api-and-interfaces.md` | All API contracts, endpoints, integrations |
| `05-data-model.md` | Every entity, field, relationship, ER diagrams |
| `06-diagrams-and-flows.md` | User flows, data flows, sequence diagrams, state machines |
| `07-environment-and-config.md` | Environment variables, config, deployment topology |
| `08-technology-analysis.md` | Tech stack and how it shapes the design |
| `09-areas-of-improvement.md` | Code smells, technical debt, security risks |
| `10-assumptions-and-unknowns.md` | All assumptions and open questions (separate from spec) |

### Artifact Content Requirements

- **01-system-overview.md** — Purpose, user personas, domain glossary, system boundaries, key workflows. Written so a non-technical stakeholder could understand the entire system.
- **02-architecture.md** — Architecture style, component inventory, dependency graph, communication patterns, entry points, architecture diagram.
- **03-features-and-rules.md** — Feature catalog (every user-facing feature as behavior), business rules, authorization rules, state machines, computed values. For each feature: trigger, inputs/validation, processing logic, outputs/side effects, error conditions.
- **04-api-and-interfaces.md** — API endpoints, WebSocket events, CLI commands, third-party integrations, authentication, error format, pagination.
- **05-data-model.md** — Entity catalog (all fields, types, constraints, defaults), relationships with cardinality, ER diagram, storage, access patterns, migrations, data lifecycle.
- **06-diagrams-and-flows.md** — All diagrams in Mermaid syntax: architecture, user flows, data flows, sequence diagrams, state machines.
- **07-environment-and-config.md** — Environment variables, configuration files, build commands, deployment topology, external dependencies, secrets management.
- **08-technology-analysis.md** — Languages/frameworks with versions, build tools, key dependencies and roles, architecture impact, version currency, constraints, idiomatic patterns.
- **09-areas-of-improvement.md** — Each item with severity (Critical/Warning/Info), description, affected files/modules, suggested remediation. Categories: code smells, potential bugs, security concerns, dead code, performance concerns, inconsistent patterns.
- **10-assumptions-and-unknowns.md** — Assumptions with rationale, unknowns, open questions, ambiguities, verification gaps. This file keeps all uncertainty **separate** from the factual spec.

### Inferred vs Verified Distinction

- **Verify before documenting** — Read the actual code, don't infer from file names alone.
- **Never mix assumptions into the spec** — If you're not certain, put it in `10-assumptions-and-unknowns.md`.
- **Flag uncertainty explicitly** — "Unknown" is better than a wrong guess presented as fact.

### Quality Checklist

Before presenting the spec, verify:

- [ ] Every user-facing feature is documented in `03-features-and-rules.md`.
- [ ] Every entity/model is cataloged in `05-data-model.md`.
- [ ] Every API endpoint is listed in `04-api-and-interfaces.md`.
- [ ] Every environment variable is documented in `07-environment-and-config.md`.
- [ ] All Mermaid diagrams use valid syntax and render correctly.
- [ ] Cross-references between files use correct relative links.
- [ ] Assumptions are in `10-assumptions-and-unknowns.md`, not mixed into other files.
- [ ] Business rules are specific and testable, not vague.
- [ ] The spec is sufficient for an LLM to rebuild the system without the original code.

### Critical Rules

- **Do NOT modify source code** — Only write spec files in the output directory.
- **Verify before documenting** — Read the actual code, don't infer from file names alone.
- **Never mix assumptions into the spec** — If uncertain, put it in `10-assumptions-and-unknowns.md`.
- **Be specific** — Reference actual file paths, function names, and line ranges when citing code.
- **Be complete** — A missing feature in the spec means a missing feature in the reconstruction.
- **Be technology-agnostic in files 01-07** — Describe behavior, not implementation details.
- **Flag uncertainty explicitly** — "Unknown" is better than a wrong guess presented as fact.

## Output Contract

All skills in the **discovery** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Discovery Executive Summary

**Spec location:** [root path of generated spec, e.g. `docs/system-spec/`]

**Artifacts produced**
- [List of spec files generated, e.g. 01-system-overview.md, 02-architecture.md, ...]

**Verified vs inferred**
- Verified from code: [short bullet list]
- Documented as unknown: see assumptions file — [top 1-3 items]

**Suggested next step**
[Architect, implementer, or human review.]
```

## Guardrails

- Do not modify source code. Only write spec files in the output directory.
- Verify from code when possible; do not guess.
- Keep assumptions in their own section (`10-assumptions-and-unknowns.md`).
- Make each artifact usable on its own with cross-references to related files.
- Use `architecture-planning` for designing new systems, not reverse engineering existing ones.
- Use `assumption-review` when a completed spec needs a risk review.
