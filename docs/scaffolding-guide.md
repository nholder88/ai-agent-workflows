# Project Scaffolding Guide

## Overview

The `create` mode scaffolds new projects from templates with real application code, tests, and AI-ready standards artifacts. This guide covers how scaffolding works, what gets generated, and how to use it effectively.

## Quick Start

```bash
# Interactive wizard (recommended for first-time users)
ai-agent-pack-install create

# Create a Next.js frontend
ai-agent-pack-install create frontend my-app

# Create a FastAPI backend
ai-agent-pack-install create backend api-service --stack python

# Create a fullstack project
ai-agent-pack-install create fullstack my-project --frontend nextjs --backend python
```

## How Scaffolding Works

### Materialization Process

1. **Resolution Phase**
   - Load stack catalog from `templates/shared/stack-catalog.yaml`
   - Resolve archetype (frontend/backend/fullstack) to concrete stacks
   - Load template specifications and platform contracts

2. **Preparation Phase**
   - Create temporary directory for atomic materialization
   - Build template variables (projectName, stack keys, etc.)

3. **File Generation Phase**
   - Copy scaffold assets from `templates/{stack}/scaffold/` directories
   - Render template variables (`{{projectName}}`, etc.)
   - Copy `.env.example` from template root
   - Generate standards artifacts (see below)

4. **Finalization Phase**
   - Atomically move temp directory to final output path
   - Clean up temporary files on success or failure

### Scaffold Precedence

Files are sourced with the following precedence:

1. **Scaffold assets** (`templates/{stack}/scaffold/`) — Real application code, tests, configs
2. **Generated manifests** — `AGENTS.md`, `.cursor/rules`, `docs/conventions.md`
3. **Template variables** — Rendered in all files matching patterns

This ensures scaffold starters always take precedence over generated boilerplate.

## Generated Standards Artifacts

Every scaffolded project includes AI-ready standards artifacts that make stack choices explicit:

### AGENTS.md

Project-specific agent manifest declaring:
- Which agents are available for this stack
- Stack-specific agent configuration
- Handoff rules between agents
- References to workspace skills

**Example excerpt for Next.js:**
```markdown
## Available Agents

- **orchestrator** — Task planning and agent coordination
- **nextjs-skeleton-expert** — Next.js implementation specialist
- **typescript-frontend-implementer** — TypeScript frontend implementation
- **frontend-unit-test-specialist** — Vitest unit testing
- **ui-test-specialist** — Playwright e2e testing

## Stack Configuration

- Framework: Next.js 15
- Template: nextjs
- State Management: Zustand + TanStack Query
```

### .cursor/rules

Project-local Cursor rules encoding:
- Selected stack conventions
- State management patterns
- Testing frameworks and commands
- Required capabilities (feature flags, reporting, admin)

**Example excerpt:**
```
## State Management
- Server state via TanStack Query
- Client state via Zustand
- Keep query cache as single source of truth for server data
- Use Zustand stores only for UI state local to features

## Testing
- Unit tests: `npm run test:unit` via Vitest
- E2E tests: `npm run test:e2e` via Playwright
```

### docs/conventions.md

Generated markdown documenting:
- Stack and template version
- State management choices
- Testing strategy
- Required capabilities from platform contracts
- Links to relevant skills and agents

## Hermes Boundary

### What This Repo Owns

✅ **Engineering Standards**
- State management patterns (Zustand + TanStack Query for React)
- Testing frameworks (Vitest + Playwright)
- Code organization and conventions
- Platform capabilities (feature flags, reporting, admin)

✅ **Template Specifications**
- Required capabilities per stack
- Environment templates
- Scaffold starter code

✅ **Skills and Agents**
- Implementation skills (impl-nextjs, impl-python)
- Testing skills (test-frontend-unit, test-backend-unit)
- Agent definitions (orchestrator, implementers, reviewers)

### What Hermes Owns

❌ **Runtime Configuration** (NOT in this repo)
- OpenRouter API keys and credentials
- Model routing policy (which model for which task)
- Provider selection (OpenRouter, Anthropic, OpenAI)
- Model parameters (temperature, max tokens)

### Boundary Enforcement

Generated projects:
- **Never** contain API keys or credentials
- **Never** specify model names or provider configuration
- **May** reference Hermes client abstractions at runtime
- **May** include documentation links to Hermes setup

**Example of correct boundary:**

```typescript
// ✅ GOOD: References runtime config abstraction
import { openRouterClient } from '@/lib/openrouter';
const response = await openRouterClient.chat({ ... });

// ❌ BAD: Embeds credentials (never do this)
const client = new OpenRouterClient({
  apiKey: 'sk-or-v1-...',  // ❌ credential
  defaultModel: 'claude',  // ❌ model policy
});
```

## Stack Catalog Contract

### Single Source of Truth

`templates/shared/stack-catalog.yaml` is the **canonical allowlist** of stacks the CLI may offer.

**Contract rules:**

1. **Catalog First** — A stack appears in the CLI only if it has a catalog entry
2. **Standards Before Scaffolds** — Catalog entries require:
   - Template specification (`template-spec.yaml`)
   - Platform contracts implementation
   - Environment template (`.env.example`)
   - Passing parity validation

3. **No Hardcoding** — CLI loads stack choices dynamically from catalog
4. **Traceable Versions** — Generated artifacts embed template version for drift detection

### Adding a New Stack

To add a new stack (example: Vue frontend):

1. **Create template standards:**
   ```
   templates/frontend-vue/
     ├── template-spec.yaml      # declares required_capabilities
     ├── .env.example            # environment template
     └── scaffold/               # scaffold files
         ├── package.json
         ├── src/
         └── ...
   ```

2. **Implement platform contracts:**
   Ensure all `required_capabilities` from `platform-contracts.yaml` are implemented.

3. **Validate parity:**
   ```bash
   npm run templates:validate-parity
   ```

4. **Add catalog entry:**
   ```yaml
   # templates/shared/stack-catalog.yaml
   frontend:
     - key: vue
       framework: Vue
       spec: templates/frontend-vue/template-spec.yaml
       env: templates/frontend-vue/.env.example
       state_management: Pinia + Composables
   ```

5. **Automatic CLI pickup:**
   ```bash
   ai-agent-pack-install create frontend my-app --stack vue
   # ✅ Works immediately - no CLI code changes needed
   ```

### What Gets Loaded from Catalog

For each stack entry:
- `key` — Used in CLI flags (`--stack`, `--frontend`, `--backend`)
- `framework` — Display name in interactive prompts
- `spec` — Path to template specification
- `env` — Path to environment template (optional)
- `state_management` — Description for wizard (optional)

## Template Variable Rendering

Scaffold files can include template variables that are rendered during materialization:

### Available Variables

- `{{projectName}}` — Project name from CLI argument
- `{{frontendStack}}` — Frontend stack key (nextjs, sveltekit)
- `{{backendStack}}` — Backend stack key (node_nestjs, python, go, etc.)
- `{{framework}}` — Display framework name (Next.js, FastAPI, etc.)

### Usage Examples

**package.json:**
```json
{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "{{framework}} application scaffolded by ai-agent-workflows"
}
```

**AGENTS.md:**
```markdown
# {{projectName}} — Agent Configuration

This project uses **{{framework}}** (stack: `{{frontendStack}}`).
```

All variables are replaced during materialization. Files without variables are copied as-is.

## Preset System (Coming in #35)

Presets will allow applying opinionated defaults over base templates without forking:

```bash
# Apply Nigel's React preset
ai-agent-pack-install create frontend my-app --preset nigel-react
```

**What presets will do:**
- Modify materialization context before generation
- Add additional dependencies and configuration
- Include extra standards rules in `.cursor/rules`
- Compose over base templates (not replace them)

**Example preset: nigel-react**
- State: Zustand + TanStack Query + React Hook Form
- Styling: Tailwind CSS
- Testing: Vitest + Playwright
- Additional rules for form validation and error boundaries

Presets remain additive — base templates stay canonical.

## Verification

To verify a scaffolded project works:

```bash
# Create test project
ai-agent-pack-install create frontend test-nextjs

# Install dependencies
cd test-nextjs
npm install

# Run tests
npm run test:unit    # Should pass with sample tests
npm run test:e2e     # Should pass with sample e2e tests

# Build
npm run build        # Should build successfully
```

## Troubleshooting

### Error: "Output directory is not empty"

Scaffolding requires an empty target directory. Either:
- Choose a different project name
- Remove existing files from the target directory
- Use `--output` flag to specify a different path

### Error: "Unknown stack"

The stack is not in the catalog or doesn't have complete templates. Check:
- `templates/shared/stack-catalog.yaml` for available stacks
- Template directory exists: `templates/{stack}/`
- Template spec exists: `templates/{stack}/template-spec.yaml`

### Error: "Invalid project name"

Project names must:
- Contain only letters, numbers, hyphens, and underscores
- Not contain spaces or special characters
- Not be empty

### Missing scaffold files

If expected files are missing:
- Check `templates/{stack}/scaffold/` directory exists
- Verify scaffold files are not ignored by `.gitignore`
- Run `npm run templates:validate-parity` to check for issues

## Related Documentation

- `docs/create-project-architecture.md` — Full system architecture
- `docs/create-project-catalog-contract.md` — Catalog contract details
- `docs/create-project-scaffold-status.md` — Implementation status per stack
- `templates/shared/stack-catalog.yaml` — Stack catalog source
- `templates/shared/platform-contracts.yaml` — Capability contracts
