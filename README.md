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

### From npm (recommended)

The package is published as a **private** scoped module (`@nholder88/ai-agent-workflows-tools`). Installers need npm login and access to that scope (or a token with read access).

```bash
# Interactive install into VS Code / Cursor / Claude Code user paths
npx @nholder88/ai-agent-workflows-tools

# Or install globally
npm install -g @nholder88/ai-agent-workflows-tools
ai-agent-pack-install

# Non-interactive
npx @nholder88/ai-agent-workflows-tools --yes --targets vscode,cursor

# Help
ai-agent-pack-install --help
```

### From a clone (development)

```bash
npm install

# Interactive (same CLI as above)
npm run pack:install

# Non-interactive
npm run pack:install -- --yes --targets vscode,cursor

# Validate template parity after editing templates/**
npm run templates:test-parity
npm run templates:validate-parity
```

## Two Modes: Install vs Create

This CLI operates in two distinct modes:

### Install Mode (Default)
Installs agents, skills, and templates into **existing** IDE configurations (VS Code, Cursor).

```bash
# Interactive install into VS Code / Cursor prompts folders
npx @nholder88/ai-agent-workflows-tools

# Non-interactive install
npx @nholder88/ai-agent-workflows-tools --yes --targets vscode,cursor
```

**What it does:** Copies agent definitions, skills, and template references into your IDE's prompts directory. No project files are created.

### Create Mode (Project Scaffolding)
Scaffolds **new projects** from templates with real application code, standards artifacts, and stack-specific agent configurations.

```bash
# Interactive wizard
ai-agent-pack-install create

# Scaffold specific project types (see examples below)
ai-agent-pack-install create <archetype> <name> [options]
```

**What it does:** Creates a complete project directory with source code, tests, configuration, and generated standards artifacts (`AGENTS.md`, `.cursor/rules`, conventions).

## Create Mode Examples

### Frontend Projects

```bash
# Next.js frontend (default)
ai-agent-pack-install create frontend my-app

# SvelteKit frontend
ai-agent-pack-install create frontend my-app --stack sveltekit

# With Nigel's React preset (coming in #35)
ai-agent-pack-install create frontend my-app --preset nigel-react
```

**Generated artifacts:**
- Complete Next.js or SvelteKit app with App Router / SvelteKit routing
- Zustand + TanStack Query state management (Next.js) or Svelte stores + TanStack Query (SvelteKit)
- Sample features: reports, admin/feature-flags
- Vitest unit tests + Playwright e2e tests
- `AGENTS.md` with stack-specific agents
- `.cursor/rules` encoding state management conventions

### Backend Projects

```bash
# NestJS backend (default)
ai-agent-pack-install create backend api-service

# FastAPI Python backend
ai-agent-pack-install create backend api-service --stack python

# Golang Fiber backend
ai-agent-pack-install create backend api-service --stack go

# .NET Core backend
ai-agent-pack-install create backend api-service --stack dotnet

# Spring Boot Java backend
ai-agent-pack-install create backend api-service --stack java

# Rust Axum backend
ai-agent-pack-install create backend api-service --stack rust
```

**Generated artifacts:**
- Complete backend service with health, reports, and admin endpoints
- TypeORM (NestJS), Pydantic (FastAPI), or equivalent for other stacks
- Unit and e2e tests
- `AGENTS.md` with backend-specific agents
- `.cursor/rules` with API conventions

### Fullstack Projects

```bash
# Next.js frontend + FastAPI backend
ai-agent-pack-install create fullstack customer-portal --frontend nextjs --backend python

# SvelteKit frontend + NestJS backend
ai-agent-pack-install create fullstack customer-portal --frontend sveltekit --backend node_nestjs
```

**Generated artifacts:**
- Both frontend and backend scaffolds in one project
- Shared `AGENTS.md` referencing both frontend and backend agents
- Unified `.cursor/rules` with full-stack conventions

### Available Stacks

**Frontend:**
- `nextjs` — Next.js 15 with Zustand + TanStack Query (✅ Full scaffold)
- `sveltekit` — SvelteKit 2 with Skeleton UI + TanStack Query (✅ Full scaffold)
- `angular` — Angular 17+ with NgRx (⏳ Deferred)

**Backend:**
- `node_nestjs` — NestJS with TypeORM (✅ Full scaffold)
- `python` — FastAPI with Pydantic (✅ Full scaffold)
- `go` — Fiber framework (✅ Catalog entry)
- `dotnet` — ASP.NET Core (✅ Catalog entry)
- `java` — Spring Boot (✅ Catalog entry)
- `rust` — Axum framework (✅ Catalog entry)

**Note:** Stacks marked "Catalog entry" have standards defined but scaffold implementation is pending. Interactive mode will show only fully implemented stacks.

### Stack Catalog Contract

Available stack options are loaded from `templates/shared/stack-catalog.yaml` (the single source of truth). A stack appears in the CLI **only if** it has complete standards and templates in this repo.

**To add a new stack:**
1. Create templates and standards in `templates/{stack}/`
2. Add catalog entry in `templates/shared/stack-catalog.yaml`
3. CLI automatically picks up the new option

See `docs/create-project-catalog-contract.md` for the complete contract.

### Scaffolding vs Hermes Boundary

**This repo owns:**
- Engineering standards (state management, testing, conventions)
- Template specifications and platform contracts
- Skills and agent definitions
- Generated project-local rules

**Hermes (separate system) owns:**
- OpenRouter API keys and credentials
- Model routing policy
- Provider selection

Generated projects reference Hermes at runtime but never embed credentials or model configuration. See `docs/create-project-architecture.md` for the complete architecture.

### Current Status

✅ Command surface (issue #32)  
✅ Template materialization engine (issue #33)  
✅ Real scaffold starters for nextjs, sveltekit, node_nestjs, python (issues #48, #51)  
✅ Template variable rendering and generated standards artifacts  
⏳ Nigel React preset system (issue #35)  
⏳ Documentation and e2e tests (issue #36)

## Status

**Current:** working - 85% complete

Core installer, agents, templates, and tests are in place. Create-project scaffolding with template materialization engine and real scaffold starters functional (issues #32-#33, #48). Primary remaining work is preset system (#35), documentation polish (#36), first npm release, and optional platform installers.
