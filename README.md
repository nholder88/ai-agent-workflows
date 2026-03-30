# AI Agent Workflows

This repository contains a curated pack of custom AI agents, workflow docs, and template governance tooling for VS Code and Cursor.

## What this repo contains

- `VS Code/agents/`: 30 custom `*.agent.md` definitions (orchestrator, implementers, reviewers, testers, specialists)
- `Templates/`: 10 stack templates plus shared contracts/workflows and parity validator tooling
- `Implementation/`, `Design/`, `Review/`, `Testing/`, `Documentation/`, `Database/`, `Deploy/`, `Strategy/`: companion docs for each specialist domain
- `installer/`: Windows PowerShell installer/update/uninstall scripts, macOS shell equivalents, and optional MSI/PKG builders
- `cli/`: Node/TypeScript **pack installer** (`npm run pack:install`) with a tool registry and pluggable adapters (see below)

## Quick start

1. Clone this repo.
2. Run the installer for your OS (PowerShell/shell scripts) **or** the Node CLI.
3. Open VS Code or Cursor and use the installed agents/prompts.

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\Setup.ps1
```

macOS:

```bash
bash ./installer/mac/setup.sh
```

## CLI installer (Node)

Cross-platform installer with an **interactive wizard** (default) or scripted flags with `--yes`. Requires Node.js 20+ and `npm install` in this repo.

**Interactive** (no `--yes`): run `npm run pack:install` and step through:

1. Select editors (VS Code, Cursor, …) — all selected by default; CLI `--targets` pre-checks those ids when provided.
2. Optionally copy **skills** and/or **Templates** into a project workspace (separate checkboxes).
3. Workspace folder path when any workspace option is chosen.
4. Dry-run preview on/off.
5. Final confirmation before writing files.

**Non-interactive examples:**

```bash
npm run pack:install -- --yes --targets vscode,cursor
npm run pack:install -- --yes --targets vscode --workspace /path/to/project
npm run pack:install -- --yes --targets cursor --workspace /path/to/project --workspace-templates
npm run pack:install -- --yes --targets vscode --workspace /path/to/project --no-workspace-skills --workspace-templates
npm run pack:install -- --dry-run --yes --targets vscode
```

- **Registry**: [cli/tools.registry.json](cli/tools.registry.json) lists each tool (`id`, `label`, `adapterId`, per-OS `agentsRootByPlatform` with `{HOME}`, `{APPDATA}`, `{LOCALAPPDATA}` tokens).
- **Adapters**: [cli/lib/adapters.ts](cli/lib/adapters.ts) maps `adapterId` → `vscode-agent` / `cursor-agent` (passthrough: flat agents + `Templates/**` under the tool root). Add a new tool row and adapter implementation for other assistants.
- **Manifest**: writes `install-manifest.json` at the managed install root with `schemaVersion: 3`. Per-target `installedFiles` cover IDE paths only; optional `workspace` records skills and/or workspace `Templates/` when used. Windows [Uninstall.ps1](installer/Uninstall.ps1) and macOS [uninstall.sh](installer/mac/uninstall.sh) remove `workspace.installedFiles` when present.

To install **skills** into a project (`.github/skills/`) or **Templates** next to that project, use the CLI; the macOS shell setup script does not copy skills.

## Quick Windows Installer

If you want a one-time install that places this pack directly into the Windows prompts folders used by VS Code and Cursor, use the scripts in `installer/`.

- `installer/Setup.ps1`: install or refresh the local pack
- `installer/Update.ps1`: update using the local repo beside the script (fallback: recorded manifest source repo)
- `installer/Uninstall.ps1`: remove installed payload and settings references

Default managed install root (manifest + metadata):

`%LOCALAPPDATA%\ai-agent-workflows-pack`

Default payload target paths:

- VS Code: `%APPDATA%\Code\User\prompts`
- Cursor: `%APPDATA%\Cursor\User\prompts`

What gets installed per target:

- `VS Code/agents/*.agent.md` -> `<prompts-path>`
- `Templates/**` -> `<prompts-path>/Templates/**`

The installer writes `<install-root>/install-manifest.json` with source repo path, install root, package version, timestamp metadata, and a per-target file inventory for safe uninstall.

### Usage

Run from PowerShell in repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\Setup.ps1
powershell -ExecutionPolicy Bypass -File .\installer\Update.ps1
powershell -ExecutionPolicy Bypass -File .\installer\Uninstall.ps1
```

Optional flags:

- `-InstallRoot "C:\some\custom\path"`
- `-SourceRepoPath "D:\ai-agent-workflows"` (Setup/Update)
- `-VSCodePromptsPath "C:\Users\<user>\AppData\Roaming\Code\User\prompts"` (Setup)
- `-CursorPromptsPath "C:\Users\<user>\AppData\Roaming\Cursor\User\prompts"` (Setup)
- `-SkipVSCode` (Setup)
- `-SkipCursor` (Setup)
- `-RemoveInstallRoot` (Uninstall, remove empty root folder)
- `-Force` (override safety checks where applicable)

### Build MSI Bundle

You can generate a bundled MSI (WiX v4+) that installs this pack and runs the quick setup script:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\msi\Build-Msi.ps1
```

Output is written to `installer/msi/out/AI-Agent-Workflows-Pack.msi` by default.

### Caveats

- Installer copies directly into prompts folders and does not edit editor settings JSON.
- Uninstall removes only files tracked in the manifest file inventory.
- MSI build requires WiX CLI (`wix`) available on `PATH`.

## Quick macOS Installer

If you want the same workflow on macOS, use scripts in `installer/mac/`.

- `installer/mac/setup.sh`: install or refresh agents/templates into prompts folders
- `installer/mac/update.sh`: re-run setup using the local repo beside the script (fallback: manifest source path)
- `installer/mac/uninstall.sh`: remove files recorded by installer metadata

Default managed install root:

- `~/Library/Application Support/ai-agent-workflows-pack`

Default prompts target paths:

- VS Code: `~/Library/Application Support/Code/User/prompts`
- Cursor: `~/Library/Application Support/Cursor/User/prompts`

What gets installed per target:

- `VS Code/agents/*.agent.md` -> `<prompts-path>`
- `Templates/**` -> `<prompts-path>/Templates/**`

Usage:

```bash
bash ./installer/mac/setup.sh
bash ./installer/mac/update.sh
bash ./installer/mac/uninstall.sh
```

Optional flags:

- `--install-root "/custom/path"`
- `--source-repo-path "/path/to/ai-agent-workflows"` (setup/update)
- `--vscode-prompts-path "/Users/<user>/Library/Application Support/Code/User/prompts"` (setup)
- `--cursor-prompts-path "/Users/<user>/Library/Application Support/Cursor/User/prompts"` (setup)
- `--skip-vscode` (setup)
- `--skip-cursor` (setup)
- `--remove-install-root` (uninstall)
- `--force` (setup/update/uninstall compatibility flag)

### Build macOS PKG Bundle

You can build a `.pkg` installer on macOS:

```bash
bash ./installer/mac/pkg/build-pkg.sh
```

Output path:

- `installer/mac/pkg/out/AI-Agent-Workflows-Pack-macOS.pkg`

Note: `pkgbuild` must be available (Xcode command line tools).

## Using agents in VS Code and Cursor

### Recommended: install to user paths

This repo ships install scripts that copy agents and templates into user-level paths so they are available across projects.

Windows default targets:

- VS Code: `%APPDATA%\Code\User\prompts`
- Cursor: `%APPDATA%\Cursor\User\prompts`

macOS default targets:

- VS Code: `~/Library/Application Support/Code/User/prompts`
- Cursor: `~/Library/Application Support/Cursor/User/prompts`

What gets copied:

- `VS Code/agents/*.agent.md` -> target prompts/agents path
- `Templates/**` -> `<target>/Templates/**`

Use these commands after pulling repo changes:

- Windows: `powershell -ExecutionPolicy Bypass -File .\installer\Update.ps1`
- macOS: `bash ./installer/mac/update.sh`

### Manual use (no installer)

If you do not want to run installers, you can manually copy:

- All files from `VS Code/agents/` into your desired agent/prompts folder
- The `Templates/` directory into the same target root as `Templates/`

### Workspace authoring

When editing or creating agents in this repo, author files in `VS Code/agents/` and then run update to push changes to your installed location(s).

---

## Flows

### 1. Specialist handoffs (agent-to-agent)

Agents can hand off to other agents via the **handoffs** defined in each agent’s YAML frontmatter. The diagram below summarizes **outbound** handoffs between specialists (strategy → design → review → implementation → testing → deploy/doc). Use the handoff buttons that appear after a response to move to the next agent with context and a pre-filled prompt.

Frontend implementation routing is specialist-first: Next.js routes to `nextjs-skeleton-expert`, SvelteKit routes to `sveltekit-skeleton-expert`, and Angular routes to `angular-implementer`. `typescript-frontend-implementer` is the generic fallback for other frontend TypeScript stacks (for example React, Vue, and Nuxt).

Documentation scope is split intentionally:

- `code-documenter` handles in-code and API reference documentation.
- `markdown-technical-writer` handles non-code docs/config/agent files.

### 2. Full pipeline (orchestrator)

The **orchestrator** agent runs the full pipeline for a task: validate → plan → clarify → implement → test → document → review → fix. It delegates to specialist agents in sequence and enforces quality gates. For the full stage-by-stage flow, gates, and escalation rules, see **[Implementation/orchestrator.md](Implementation/orchestrator.md)**.

Pipeline timing note:

- Pipeline run timing is tracked as the duration of the orchestration session (from the first stage entry to the final stage entry).
- It is not intended as a benchmark of command execution speed at each individual step.

---

## Agent Handoffs (Logical Flow)

Handoffs are defined in the YAML frontmatter (`handoffs:`) of each agent file. The diagram summarizes **outbound** handoffs between agents:

```mermaid
flowchart LR
  subgraph strategy [Strategy]
    ideaValidator[idea-validator]
  end
  subgraph design [Design]
    architect[architect-planner]
    pbiClarifier[pbi-clarifier]
    systemRev[system-reverse-engineer]
  end
  subgraph review [Review]
    codeReview[code-review-sentinel]
    assumptionRev[assumption-reviewer]
  end
  subgraph impl [Implementation]
    tsImpl[typescript-implementer]
    tsBackendImpl[typescript-backend-implementer]
    tsFrontendImpl[typescript-frontend-implementer]
    nextjsExpert[nextjs-skeleton-expert]
    sveltekitExpert[sveltekit-skeleton-expert]
    angularImpl[angular-implementer]
  end
  subgraph test [Testing]
    backendTest[backend-unit-test-specialist]
    frontendTest[frontend-unit-test-specialist]
    uiTest[ui-test-specialist]
  end
  subgraph other [Deploy / Doc / DB]
    docker[docker-architect]
    doc[code-documenter]
    mdWriter[markdown-technical-writer]
  end

  ideaValidator -->|Plan architecture| architect
  ideaValidator -->|Write spec| pbiClarifier
  ideaValidator -->|Blind spots| assumptionRev

  architect -->|Review code| codeReview
  architect -->|Reverse engineer| systemRev
  architect -->|Containerize| docker

  pbiClarifier -->|Consult architect| architect
  pbiClarifier -->|Review spec| codeReview
  pbiClarifier -->|Understand codebase| systemRev

  assumptionRev -->|Clarify spec| pbiClarifier
  assumptionRev -->|Consult architect| architect
  assumptionRev -->|Understand codebase| systemRev

  systemRev -->|Review spec| codeReview
  systemRev -->|Plan reconstruction| architect
  systemRev -->|Analyze Docker| docker

  codeReview -->|Plan improvements| architect
  codeReview -->|Add E2E| uiTest
  codeReview -->|Add unit frontend| frontendTest
  codeReview -->|Add unit backend| backendTest

  tsImpl -->|Review code| codeReview
  tsImpl -->|Clarify spec| pbiClarifier
  tsImpl -->|Backend TS implementation| tsBackendImpl
  tsImpl -->|Frontend TS fallback| tsFrontendImpl
  tsImpl -->|Next.js specialist| nextjsExpert
  tsImpl -->|SvelteKit specialist| sveltekitExpert
  tsImpl -->|Angular specialist| angularImpl
  tsImpl -->|Unit frontend| frontendTest
  tsImpl -->|Unit backend| backendTest
  tsImpl -->|Add docs| doc
  tsImpl -->|Edit non-code docs| mdWriter
  tsImpl -->|Plan architecture| architect

  tsBackendImpl -->|Review code| codeReview
  tsBackendImpl -->|Unit backend| backendTest
  tsBackendImpl -->|Add docs| doc

  tsFrontendImpl -->|Review code| codeReview
  tsFrontendImpl -->|Unit frontend| frontendTest
  tsFrontendImpl -->|E2E| uiTest
  tsFrontendImpl -->|Add docs| doc
  tsFrontendImpl -->|Delegate Next.js| nextjsExpert
  tsFrontendImpl -->|Delegate SvelteKit| sveltekitExpert
  tsFrontendImpl -->|Delegate Angular| angularImpl

  nextjsExpert -->|Review code| codeReview
  nextjsExpert -->|Unit frontend| frontendTest
  nextjsExpert -->|E2E| uiTest
  nextjsExpert -->|Add docs| doc

  sveltekitExpert -->|Review code| codeReview
  sveltekitExpert -->|Unit frontend| frontendTest
  sveltekitExpert -->|E2E| uiTest
  sveltekitExpert -->|Add docs| doc

  angularImpl -->|Review code| codeReview
  angularImpl -->|Unit frontend| frontendTest
  angularImpl -->|E2E| uiTest
  angularImpl -->|Add docs| doc

  docker -->|Review configs| codeReview
  docker -->|Reverse engineer| systemRev

  backendTest -->|Review tests| codeReview
  backendTest -->|Containerize| docker
  frontendTest -->|Review tests| codeReview
  frontendTest -->|E2E| uiTest
  uiTest -->|Review tests| codeReview
  uiTest -->|Unit tests| frontendTest

  doc -->|Review docs| codeReview
  doc -->|Check assumptions| assumptionRev
  doc -->|Add tests| frontendTest

  mdWriter -->|Review docs| codeReview
  mdWriter -->|Check assumptions| assumptionRev
  mdWriter -->|In-code/API docs| doc
```

SQL, MongoDB, Redis, and GraphQL specialists follow the same pattern (→ code-review-sentinel, backend-unit-test-specialist, docker-architect or ui-test-specialist).

---

## Template Projects Baseline

If you want repeatable, consistent project starts, use the template system in `Templates/`:

- `Templates/frontend-web/template-spec.yaml`
- `Templates/frontend-nextjs/template-spec.yaml`
- `Templates/frontend-sveltekit/template-spec.yaml`
- `Templates/frontend-angular/template-spec.yaml`
- `Templates/backend-service/template-spec.yaml`
- `Templates/backend-dotnet/template-spec.yaml`
- `Templates/backend-python/template-spec.yaml`
- `Templates/backend-go/template-spec.yaml`
- `Templates/backend-java/template-spec.yaml`
- `Templates/backend-rust/template-spec.yaml`
- `Templates/shared/platform-contracts.yaml`
- `Templates/shared/capability-parity-matrix.yaml`
- `Templates/shared/stack-catalog.yaml`
- `Templates/shared/wiki-update-contract.yaml`
- `Templates/shared/ci-command-contract.yaml`
- `Templates/shared/ci-stack-command-matrix.yaml`
- `Templates/shared/workflows/ci-pr.yaml`
- `Templates/shared/workflows/ci-main.yaml`
- `Templates/shared/workflows/cd-release.yaml`
- `Templates/shared/workflows/cd-deploy.yaml`
- `VS Code/agents/wiki-update-agent.agent.md`
- `Templates/scaffold-prompt.md`

This provides a common baseline for env vars, security, logging, data mapping, feature flags, reporting hooks, and admin dashboard integration points so teams stop re-solving the same setup per project.

### Template Parity Validator

The file `Templates/tools/validate-parity.ts` is repository tooling, not an application definition. It validates template governance across:

- Stack coverage between `Templates/shared/stack-catalog.yaml` and `Templates/shared/capability-parity-matrix.yaml`
- Required capability coverage in each stack template spec
- CI command contract completeness from `Templates/shared/ci-command-contract.yaml`
- Stack command matrix coverage from `Templates/shared/ci-stack-command-matrix.yaml`
- Required reusable workflow templates in `Templates/shared/workflows/`
- Unit and E2E starter metadata presence/alignment in stack template specs
- Parity evidence schema compliance (`Templates/shared/parity-evidence-schema.yaml`)

Reusable workflow templates resolve stack commands through slot names:

- CI order is fixed: `install -> lint -> build -> unit_test -> e2e_test`
- CD templates use `package` and `deploy` slots
- Backend E2E baseline is API smoke/integration (not browser-only)

### Wiki Update Post-Task Flow

The orchestrator includes a post-review hook for wiki updates after Stage 7 PASS.

- Scope defaults: `github.com` plus GHES allowlist in `Templates/shared/wiki-update-contract.yaml`
- Trigger default: `stage7_pass`
- Output mode default: `pr`
- Approval default: `humanApproval: true`
- Failure semantics: non-blocking warning + audit (does not fail pipeline)

The `wiki-update-agent` generates user-facing content only:

- Include: functional changes and end-user how-to guidance
- Exclude: low-level technical internals and refactor-only details

When host is unsupported or the candidate is not documentation-worthy, the wiki flow is skipped with audit metadata.

Run it from the repo root:

```bash
npm install
npm run templates:test-parity
npm run templates:validate-parity
```

Use this check whenever `Templates/**` files change to prevent parity drift across framework and language variants.
