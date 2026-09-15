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

## Create-Project Scaffolding (Preview)

The CLI now includes a `create` mode for scaffolding new projects from templates:

```bash
# Interactive wizard
ai-agent-pack-install create

# Scaffold a frontend project
ai-agent-pack-install create frontend my-app

# Scaffold a backend API
ai-agent-pack-install create backend api-service --stack python

# Scaffold fullstack application
ai-agent-pack-install create fullstack customer-portal --frontend nextjs --backend python

# Scaffold CLI tool or library
ai-agent-pack-install create cli my-tool
ai-agent-pack-install create lib my-package
```

**Archetypes:**
- `frontend` — Browser-based UI application (choose from nextjs, sveltekit, angular)
- `backend` — API service or backend (choose from node_nestjs, python, go, dotnet, java, rust)
- `fullstack` — Combined frontend + backend
- `lib` — Reusable package or module
- `cli` — Command-line tool or utility

**Stack Catalog Contract:**  
Available stack options are loaded from `templates/shared/stack-catalog.yaml` (the single allowlist). A stack appears in the CLI **only if** it has complete standards and templates in this repo. To add new options: create templates and standards first, then add a catalog entry. See `docs/create-project-catalog-contract.md` for details.

**Current Status:**  
Command surface (issue #32) and template materialization engine (issue #33) implemented. Preset system and documentation polish coming in issues #35-#36.

## Status

**Current:** working - 85% complete

Core installer, agents, templates, and tests are in place. Create-project scaffolding with template materialization engine functional (issues #32-#33). Primary remaining work is preset system (#35), documentation polish (#36), first npm release, and optional platform installers.
