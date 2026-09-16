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

This pack operates in **two distinct modes**:

### Install Mode — Add agents/templates/skills to existing projects

**Use when:** You have an existing project and want to add AI agents, templates, and skills to your workspace.

```bash
# Interactive install into VS Code / Cursor user paths
npx @nholder88/ai-agent-workflows-tools

# Non-interactive
npx @nholder88/ai-agent-workflows-tools --yes --targets vscode,cursor
```

**What it does:**
- Installs 32 agent definitions to your IDE's prompts folder
- Copies skills library to `.github/skills/` in your workspace
- Adds template references for your stack
- Does NOT modify your existing code

### Create Mode — Scaffold new projects from templates

**Use when:** You're starting a new project and want a complete scaffold with agents, standards, and working starter code.

```bash
# Interactive wizard (recommended for first-time use)
ai-agent-pack-install create

# Scaffold a Next.js frontend
ai-agent-pack-install create frontend my-nextjs-app
# or explicit stack:
ai-agent-pack-install create frontend my-app --stack nextjs

# Scaffold a SvelteKit frontend
ai-agent-pack-install create frontend my-sveltekit-app --stack sveltekit

# Scaffold a NestJS backend
ai-agent-pack-install create backend api-service --stack node_nestjs

# Scaffold a Python/FastAPI backend
ai-agent-pack-install create backend api-service --stack python

# Scaffold fullstack (Next.js + Python)
ai-agent-pack-install create fullstack customer-portal --frontend nextjs --backend python

# Scaffold fullstack (SvelteKit + NestJS)
ai-agent-pack-install create fullstack my-app --frontend sveltekit --backend node_nestjs
```

**What it creates:**
- Complete project structure with working code
- Framework-specific configuration (tsconfig.json, vite.config.ts, etc.)
- State management setup (Zustand + TanStack Query for frontend)
- Testing framework configuration (Vitest + Playwright for frontend, Jest for NestJS, pytest for Python)
- Generated `AGENTS.md` with project-specific agents
- Generated `.cursor/rules` encoding your stack conventions
- Generated `docs/conventions.md` with detailed patterns
- Sample features (reports, admin/feature-flags) with tests

**Available Archetypes:**
- `frontend` — Browser-based UI application
- `backend` — API service or backend application
- `fullstack` — Combined frontend + backend

**Implemented Frontend Stacks:**
- ✅ `nextjs` — Next.js 15 with App Router, Zustand + TanStack Query, Vitest + Playwright
- ✅ `sveltekit` — SvelteKit 2 with Skeleton UI, TanStack Query, Vitest + Playwright

**Implemented Backend Stacks:**
- ✅ `node_nestjs` — NestJS 10 with TypeORM, Swagger, Jest
- ✅ `python` — FastAPI with Pydantic, pytest
- ✅ `go` — Fiber (minimal scaffold)

**Deferred/Not Implemented:**
- ⏳ `angular` — Angular 17+ (frontend, deferred to future release)
- ⏳ `lib` — Reusable package archetype (not yet implemented)
- ⏳ `cli` — Command-line tool archetype (not yet implemented)

**Stack Catalog Contract:**  
Available stack options are loaded from `templates/shared/stack-catalog.yaml` (the single allowlist). A stack appears in the CLI **only if** it has complete standards and templates in this repo. See `docs/create-project-catalog-contract.md` for the contract and `docs/scaffolding-guide.md` for full documentation.

## Status

**Current:** working - 90% complete

Core installer, agents, templates, and tests are in place. Create-project scaffolding with template materialization engine and real scaffold starters functional (issues #32-#33, #48). Documentation and E2E testing complete (issue #36). Primary remaining work is preset system (#35), first npm release, and optional platform installers.
