# ai-agent-workflows

> Installable pack of 32 custom AI agents, stack templates, and a skills library for Cursor and VS Code.

## Problem

Using AI coding assistants across many projects means redefining the same agents (orchestrator, implementer, reviewer, tester) and the same stack templates every time. That is repetitive, drifts between projects, and makes it hard to keep a consistent quality bar. This pack installs a curated, versioned set into any project with one command.

## Goal

A published npm package / CLI (`ai-agent-pack-install`) that installs a curated agent / skill / template set into any project, backed by a multi-IDE adapter system and a template parity validator that stops framework variants from drifting.

## Approach

Node 20 + TypeScript CLI built on `@inquirer/prompts` and `ajv`. Agents are plain `.agent.md` files with YAML frontmatter defining handoffs. Ten stack templates (Next.js, SvelteKit, Angular, backend Node, .NET, Python, Go, Java, Rust, web) share a parity validator. IDE targets are pluggable via an adapter registry (`cli/tools.registry.json` + `cli/lib/adapters.ts`), currently with VS Code and Cursor adapters.

## Implemented features

- 32 `*.agent.md` agent definitions covering orchestrator, implementers, reviewers, and specialists
- Embedded OpenSpec command workflow in the agent pipeline (`openspec propose` then `openspec apply`)
- 10 stack templates (frontend + backend variants) with shared contracts and CI workflow templates
- Deduplicated skills library organized by category
- `ai-agent-pack-install` CLI with an interactive wizard and non-interactive `--yes` mode
- Tool registry and adapter system (`adapters.ts`, `paths.ts`, `pipeline.ts`, `registry.ts`)
- Template parity validator (`templates/tools/validate-parity.ts`) with its own test suite
- Windows PowerShell + macOS shell installers with uninstall manifests
- Companion docs folders (Database, Deploy, Design, Testing, Strategy, etc.)

## What's left to reach the goal

- [ ] Publish the package to npm (currently installed only from a local path or `npm link`)
- [ ] Build the "optional" MSI / PKG installers the README mentions
- [ ] Add cross-IDE integration test evidence

## Getting started

This package has **two modes**: **install mode** (installs agents/skills into your IDE) and **create mode** (scaffolds new projects with opinionated starters).

### Install Mode — Add agents & skills to existing projects

Install the curated agent pack and skills into VS Code, Cursor, or Claude Code.

**From npm (recommended):**

```bash
# Interactive — prompts for IDE targets
npx @nholder88/ai-agent-workflows-tools

# Non-interactive — specify targets directly
npx @nholder88/ai-agent-workflows-tools --yes --targets vscode,cursor

# Or install globally
npm install -g @nholder88/ai-agent-workflows-tools
ai-agent-pack-install
```

**From a clone (development):**

```bash
npm install

# Interactive
npm run pack:install

# Non-interactive
npm run pack:install -- --yes --targets vscode,cursor
```

### Create Mode — Scaffold new projects from templates

Generate new projects with complete scaffolds, real starter code, and project-local standards artifacts.

**Interactive — wizard guides you through options:**

```bash
# Start the wizard
npx @nholder88/ai-agent-workflows-tools create

# Or with global install
ai-agent-pack-install create
```

**Non-interactive — specify archetype and stacks:**

```bash
# Frontend — Next.js with TanStack Query + Zustand
npx @nholder88/ai-agent-workflows-tools create frontend my-nextjs-app
# Output: src/app/ with layouts, providers, pages, features/, AGENTS.md, .cursor/rules

# Frontend — SvelteKit with Skeleton UI + TanStack Query
npx @nholder88/ai-agent-workflows-tools create frontend my-sveltekit-app --stack sveltekit
# Output: src/routes/ with Svelte components, features/, AGENTS.md, .cursor/rules

# Backend — NestJS API with TypeORM
npx @nholder88/ai-agent-workflows-tools create backend api-service --stack node_nestjs
# Output: src/modules with controllers/services/DTOs, tests/, AGENTS.md, .cursor/rules

# Backend — FastAPI Python service
npx @nholder88/ai-agent-workflows-tools create backend api-service --stack python
# Output: src/api/ with routers, pytest tests, AGENTS.md, .cursor/rules

# Fullstack — Next.js frontend + Python backend
npx @nholder88/ai-agent-workflows-tools create fullstack customer-portal --frontend nextjs --backend python
# Output: Combined frontend + backend scaffolds with shared standards
```

**What gets generated:**

All scaffolds include:
- ✅ Real starter code (not empty directories)
- ✅ `AGENTS.md` — Project-local agent manifest with stack-specific agents
- ✅ `.cursor/rules` — Project conventions (state management, testing, capabilities)
- ✅ `docs/conventions.md` — Stack choices and contract version traceability
- ✅ Unit + E2E test setup with sample tests
- ✅ CI workflow template

**Available Stacks:**

| Archetype | Stack Key | Framework | Status |
|-----------|-----------|-----------|--------|
| `frontend` | `nextjs` | Next.js 15 + TanStack Query + Zustand | ✅ Full scaffold |
| `frontend` | `sveltekit` | SvelteKit 2 + Skeleton UI + TanStack Query | ✅ Full scaffold |
| `frontend` | `angular` | Angular 17+ + NgRx | ⏳ Deferred |
| `backend` | `node_nestjs` | NestJS 10 + TypeORM | ✅ Full scaffold |
| `backend` | `python` | FastAPI + Pydantic | ✅ Full scaffold |
| `backend` | `go` | Fiber | ⏳ Minimal scaffold |
| `backend` | `dotnet` | .NET 8 | ⏳ Minimal scaffold |
| `backend` | `java` | Spring Boot | ⏳ Minimal scaffold |
| `backend` | `rust` | Axum | ⏳ Minimal scaffold |
| `fullstack` | Mix of above | Combines frontend + backend | ✅ Functional |

See `docs/scaffolding-guide.md` for detailed usage and `templates/shared/stack-catalog.yaml` for the complete allowlist.

## Status

**Current:** working - 85% complete

Core installer, agents, templates, and tests are in place. Create-project scaffolding with template materialization engine and real scaffold starters functional (issues #32-#33, #48). Primary remaining work is preset system (#35), documentation polish (#36), first npm release, and optional platform installers.
