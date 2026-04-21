# ai-agent-workflows

> Installable pack of 32 custom AI agents, stack templates, and a skills library for Cursor and VS Code.

## Problem

Using AI coding assistants across many projects means redefining the same agents (orchestrator, implementer, reviewer, tester) and the same stack templates every time. That's repetitive, drifts between projects, and makes it hard to keep a consistent quality bar. Nigel wanted a single reusable pack he could drop into any project with one command.

## Goal

A published npm package / CLI (`ai-agent-pack-install`) that installs a curated agent / skill / template set into any project, backed by a multi-IDE adapter system and a template parity validator that stops framework variants from drifting.

## Approach

Node 20 + TypeScript CLI built on `@inquirer/prompts` and `ajv`. Agents are plain `.agent.md` files with YAML frontmatter defining handoffs. Ten stack templates (Next.js, SvelteKit, Angular, backend Node, .NET, Python, Go, Java, Rust, web) share a parity validator. IDE targets are pluggable via an adapter registry (`cli/tools.registry.json` + `cli/lib/adapters.ts`), currently with VS Code and Cursor adapters.

## Implemented features

- 32 `*.agent.md` agent definitions covering orchestrator, implementers, reviewers, and specialists
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

```bash
# Install deps
npm install

# Interactive install into VS Code / Cursor user paths
npm run pack:install

# Non-interactive
npm run pack:install -- --yes --targets vscode,cursor

# Validate template parity after editing templates/**
npm run templates:test-parity
npm run templates:validate-parity
```

Platform-specific one-shots are also available: `installer/Setup.ps1` (Windows) and `installer/mac/setup.sh` (macOS).

## Status

**Current:** working - 75% complete

Most mature repo in this cleanup batch. Last commit April 2026, 44 commits in the last year. Well-structured, tests present, real personal IP worth keeping. Main gap is npm publication; the code itself is usable today from a local clone.

---

*Part of Nigel's personal project cleanup (April 2026). See problem statement above for what this is supposed to solve.*
