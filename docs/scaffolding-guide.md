# Project Scaffolding Guide

## Overview

The `ai-agent-pack-install create` command scaffolds complete new projects from validated templates. Unlike install mode (which adds agents to existing projects), create mode generates a full project structure with working starter code, testing setup, and AI agent configuration.

## When to Use Create vs Install

**Use Create Mode When:**
- Starting a new project from scratch
- You want a complete scaffold with starter code
- You want project-specific agents and conventions baked in

**Use Install Mode When:**
- Adding agents to an existing project
- You want to install skills and templates into your workspace
- Your project structure is already established

## Quick Start

### Interactive Mode (Recommended)

```bash
ai-agent-pack-install create
```

The wizard will guide you through:
1. **Archetype** — frontend, backend, or fullstack
2. **Project Name** — validates for directory safety
3. **Stack Selection** — framework/platform for your archetype
4. **Output Path** — where to create the project (default: current directory)

### Non-Interactive Mode

```bash
# Frontend projects
ai-agent-pack-install create frontend my-app                    # defaults to nextjs
ai-agent-pack-install create frontend my-app --stack nextjs
ai-agent-pack-install create frontend my-app --stack sveltekit

# Backend projects
ai-agent-pack-install create backend api-service --stack python
ai-agent-pack-install create backend api-service --stack node_nestjs
ai-agent-pack-install create backend api-service --stack go

# Fullstack projects
ai-agent-pack-install create fullstack my-project --frontend nextjs --backend python
ai-agent-pack-install create fullstack my-project --frontend sveltekit --backend node_nestjs
```

## Archetypes and Stacks

### Frontend Archetype

Browser-based UI applications.

#### Next.js (nextjs) — ✅ Fully Implemented
- **Framework:** Next.js 15 with App Router
- **State Management:** Zustand (client state) + TanStack Query (server state)
- **Styling:** Tailwind CSS
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Structure:** Feature-based modules under `src/features/`
- **Sample Features:** Reports and Admin/Feature Flags with tests

**Created Files:**
```
my-nextjs-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Home page
│   │   ├── reports/page.tsx          # Reports feature
│   │   └── admin/feature-flags/page.tsx
│   ├── features/                     # Feature modules
│   │   ├── reports/
│   │   │   ├── report-service.ts     # Business logic
│   │   │   ├── report-service.test.ts
│   │   │   └── use-reports.ts        # TanStack Query hook
│   │   └── admin/
│   │       ├── feature-flag-service.ts
│   │       └── use-feature-flags.ts
│   └── test/
│       └── setup.ts                  # Vitest configuration
├── tests/
│   └── e2e/
│       └── reporting-admin.spec.ts   # Playwright E2E tests
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── package.json
├── AGENTS.md                         # Project-specific agents
├── .cursor/rules                     # Stack conventions
└── docs/conventions.md               # Detailed patterns
```

#### SvelteKit (sveltekit) — ✅ Fully Implemented
- **Framework:** SvelteKit 2
- **UI Library:** Skeleton UI (Tailwind + Cerberus theme)
- **State Management:** Svelte Stores + TanStack Query
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Structure:** Routes under `src/routes/`, features under `src/features/`

**Created Files:**
```
my-sveltekit-app/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── layout.css
│   │   ├── reports/+page.svelte
│   │   └── admin/feature-flags/+page.svelte
│   ├── features/
│   │   ├── reports/
│   │   │   ├── report-service.ts
│   │   │   └── report-service.test.ts
│   │   └── admin/
│   │       ├── feature-flag-service.ts
│   │       └── feature-flag-service.test.ts
│   ├── app.html
│   └── test/setup.ts
├── tests/e2e/
├── svelte.config.js
├── vitest.config.ts
└── package.json
```

#### Angular (angular) — ⏳ Deferred
Not yet implemented. Planned for future release with NgRx state management.

### Backend Archetype

API services and backend applications.

#### Python/FastAPI (python) — ✅ Fully Implemented
- **Framework:** FastAPI with Pydantic
- **Testing:** pytest with unit and e2e markers
- **Structure:** API routers under `src/api/`
- **Sample Endpoints:** Health, Reports, Admin

**Created Files:**
```
api-service/
├── src/
│   ├── api/
│   │   ├── health.py                 # Health check endpoint
│   │   ├── reports.py                # Reports API
│   │   └── admin.py                  # Admin API
│   ├── app.py                        # FastAPI application
│   └── config.py                     # Application configuration
├── tests/
│   ├── unit/
│   │   └── test_reporting_service.py
│   └── e2e/
│       └── test_api_smoke.py
├── requirements.txt                  # Runtime dependencies
├── requirements-dev.txt              # Development dependencies
├── pyproject.toml                    # Python project config
├── main.py                           # Application entry point
├── AGENTS.md
├── .cursor/rules
└── docs/conventions.md
```

#### NestJS (node_nestjs) — ✅ Fully Implemented
- **Framework:** NestJS 10 with TypeScript
- **Database:** TypeORM ready (connection configured via env)
- **API Docs:** Swagger/OpenAPI auto-generated
- **Testing:** Jest (unit) + E2E tests
- **Structure:** Module-based with controllers, services, entities

**Created Files:**
```
api-service/
├── src/
│   ├── main.ts                       # Bootstrap application
│   ├── app.module.ts                 # Root module
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── reports/
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   ├── reports.service.spec.ts
│   │   ├── reports.module.ts
│   │   ├── entities/report.entity.ts
│   │   └── dto/run-report.dto.ts
│   └── admin/
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       └── admin.module.ts
├── test/
│   ├── api-smoke.e2e-spec.ts
│   └── jest-e2e.json
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

#### Go/Fiber (go) — ✅ Minimal Scaffold
- **Framework:** Fiber web framework
- **Structure:** Basic project structure (minimal scaffold)
- **Status:** Basic scaffold only; full implementation planned

### Fullstack Archetype

Combined frontend and backend in a single project.

**Structure Options:**
1. **Separate directories** — `frontend/` and `backend/` as independent projects
2. **Shared root** — Both projects share root `package.json` and `AGENTS.md`

**Example:** Next.js + Python
```bash
ai-agent-pack-install create fullstack customer-portal --frontend nextjs --backend python
```

**Created Structure:**
```
customer-portal/
├── frontend/                         # Next.js project
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/                          # FastAPI project
│   ├── src/
│   ├── requirements.txt
│   └── ...
├── AGENTS.md                         # Shared agents
├── .cursor/rules                     # Both frontend and backend conventions
└── docs/conventions.md               # Comprehensive guide
```

## Generated Artifacts

Every scaffolded project includes these standard artifacts:

### AGENTS.md

Project-specific agent manifest that defines which agents are available and how they work together.

**Contents:**
- **Orchestrator** — Project coordination and task breakdown
- **Stack Implementer** — Framework-specific implementation agent (e.g., Next.js Implementer, Python Implementer)
- **Code Reviewer** — Reviews implementations for quality and standards
- **Tester** — Writes and runs tests

**Example Snippet:**
```markdown
## Stack Implementer (Next.js)
- Role: Implementation for Next.js stack
- Patterns:
  - State: Server state via TanStack Query, Client state via Zustand
  - Testing: Vitest for unit tests, Playwright for E2E

## Testing Commands
- Unit: `npm run test:unit`
- E2E: `npm run test:e2e`
```

### .cursor/rules

Encodes stack-specific conventions and patterns so AI agents don't re-decide standards at runtime.

**Contents:**
- Stack identification (framework, version, language)
- State management patterns (for frontend)
- Testing conventions and commands
- Required capabilities (feature flags, reporting, admin)
- Code style patterns

**Example Snippet:**
```markdown
## State Management (Frontend)
- Server State: TanStack Query
  - Keep server state in query cache
  - Use TanStack Query hooks for API data
- Client State: Zustand
  - Keep UI state in feature-local stores
  - Avoid global state for feature-specific UI

## Testing
- Unit Tests: `npm run test:unit` via Vitest
- E2E Tests: `npm run test:e2e` via Playwright
```

### docs/conventions.md

Detailed conventions document explaining patterns and best practices for the stack.

**Contents:**
- Technology stack overview
- Project structure explanation
- State management patterns with examples
- Testing conventions and strategies
- Required capabilities documentation
- Code style guidelines

## The Stack Catalog Contract

The scaffolder **only** offers stacks that have complete templates and standards backing in this repository. This prevents "best effort" scaffolds.

**Single Source of Truth:** `templates/shared/stack-catalog.yaml`

**Contract Rules:**
1. **Standards Before Scaffolds** — A stack appears in the CLI only if:
   - Template spec exists (`templates/{stack}/template-spec.yaml`)
   - Scaffold directory exists with real code (`templates/{stack}/scaffold/`)
   - Platform contracts are implemented
   - Parity validation passes

2. **No Hardcoded Lists** — CLI loads stack choices from the catalog at runtime, not from hardcoded arrays

3. **Validated Templates** — All templates must pass parity validation (`npm run templates:validate-parity`)

**To Add a New Stack:**
1. Create `templates/{stack}/template-spec.yaml`
2. Implement scaffold in `templates/{stack}/scaffold/`
3. Ensure all required capabilities from `platform-contracts.yaml` are implemented
4. Run `npm run templates:validate-parity` — must pass
5. Add entry to `stack-catalog.yaml`
6. CLI automatically picks up new stack

See `docs/create-project-catalog-contract.md` for complete contract details.

## Materialization Precedence

When generating a project, files are sourced in this order:

1. **Scaffold Assets** — `templates/{stack}/scaffold/` (preferred source)
   - Real starter code, pre-configured and tested
   - Template variables rendered: `{{projectName}}`, etc.

2. **Environment Templates** — `templates/{stack}/.env.example`
   - Copied to project root

3. **Generated Manifests** — Fallback only where no scaffold file exists
   - `package.json` (for frontend/node stacks)
   - `requirements.txt` (for Python stacks)

4. **Generated Standards Artifacts** — Always generated fresh
   - `AGENTS.md`
   - `.cursor/rules`
   - `docs/conventions.md`

**Template Variables:**
- `{{projectName}}` — Your project name
- `{{framework}}` — Framework display name (e.g., "Next.js")
- `{{stackKey}}` — Stack identifier (e.g., "nextjs")

**Example:** `templates/frontend-nextjs/scaffold/package.json` contains:
```json
{
  "name": "{{projectName}}",
  "version": "0.1.0"
}
```

Which renders to:
```json
{
  "name": "my-nextjs-app",
  "version": "0.1.0"
}
```

## Parity Validation

Ensures all templates implement the same platform capabilities consistently.

**What It Checks:**
- All stacks implement required capabilities from `platform-contracts.yaml`
- Capability IDs in template specs exist in contracts
- No drift between frontend/backend stacks

**Run Validation:**
```bash
npm run templates:validate-parity
```

**CI Integration:** Validation runs automatically on every PR. Failed validation blocks merge.

**Why It Matters:**
- Prevents incomplete templates
- Ensures consistent project structure across stacks
- Catches template drift early

## Hermes Boundary (Provider/Model Configuration)

**What This Repo Owns:**
✅ Project engineering standards (state management, testing, conventions)  
✅ Template specifications and scaffold code  
✅ Agent definitions and skills  
✅ Generated project-local rules (`.cursor/rules`)

**What Hermes Owns:**
❌ OpenRouter API keys and credentials  
❌ Model routing policy (which model for which task)  
❌ Provider selection (OpenRouter, Anthropic, OpenAI, etc.)  
❌ Model-specific parameters (temperature, max tokens, etc.)

**Integration:**
- Generated projects **may** reference Hermes client libraries at runtime
- No API keys, credentials, or model names embedded in templates
- Documentation may link to Hermes setup but doesn't embed configuration

**Example — OK:**
```typescript
// Generated project file
import { openRouterClient } from '@/lib/openrouter';
const response = await openRouterClient.chat({ ... });
```

**Example — NOT OK:**
```typescript
// ❌ DO NOT EMBED in templates:
const client = new OpenRouterClient({
  apiKey: 'sk-or-v1-...',
  defaultModel: 'anthropic/claude',
});
```

See `docs/create-project-architecture.md` § "Hermes Boundary" for complete separation of concerns.

## Post-Scaffolding Steps

After creating a project:

### 1. Install Dependencies

**Frontend (Next.js, SvelteKit):**
```bash
cd my-app
npm install
```

**Backend (Python):**
```bash
cd api-service
pip install -r requirements.txt
pip install -r requirements-dev.txt  # for testing
```

**Backend (NestJS):**
```bash
cd api-service
npm install
```

### 2. Configure Environment

Copy and customize `.env.example`:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Tests (Verify Scaffold Works)

**Frontend (Next.js, SvelteKit):**
```bash
npm run test:unit         # Should pass
npm run test:e2e          # Should pass (requires built app)
```

**Backend (Python):**
```bash
pytest -m unit            # Unit tests
pytest -m e2e             # E2E tests
```

**Backend (NestJS):**
```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
```

### 4. Start Development Server

**Frontend:**
```bash
npm run dev               # Next.js or SvelteKit dev server
```

**Backend (Python):**
```bash
python main.py            # Starts FastAPI with Uvicorn
```

**Backend (NestJS):**
```bash
npm run start:dev         # Starts NestJS in watch mode
```

### 5. Review Generated Standards

- Read `AGENTS.md` to understand available agents
- Read `.cursor/rules` to see stack conventions
- Read `docs/conventions.md` for detailed patterns

## Troubleshooting

### Output Directory Not Empty

**Error:** `Output directory is not empty: /path/to/project`

**Solution:** The scaffolder refuses to overwrite existing projects. Either:
- Choose a different directory: `--output /path/to/new-dir`
- Remove the existing directory: `rm -rf /path/to/project`
- Use the existing directory if it's truly empty

### Invalid Stack Choice

**Error:** `Unknown stack "invalid". Available: nextjs, sveltekit`

**Solution:** Check available stacks for your archetype:
- Frontend: `nextjs`, `sveltekit`
- Backend: `python`, `node_nestjs`, `go`

Use `ai-agent-pack-install create` (interactive) to see all options with descriptions.

### Template File Not Found

**Error:** `Template file not found: templates/frontend-nextjs/scaffold/layout.tsx`

**Solution:** Your local repo may be outdated or corrupt. Try:
```bash
# If installed globally
npm update -g @nholder88/ai-agent-workflows-tools

# If using npx
npx @nholder88/ai-agent-workflows-tools@latest create
```

### Missing Capabilities in Generated Project

**Symptom:** Expected features (reports, admin) missing from scaffold.

**Cause:** Template spec doesn't declare required capabilities, or scaffold is incomplete.

**Solution:** This indicates a template bug. Check:
```bash
npm run templates:validate-parity
```

If validation fails, the template needs repair. If it passes, file a bug report.

## Advanced: Extending Templates

To add a new stack to the catalog:

1. **Create Template Spec**
   ```yaml
   # templates/frontend-vue/template-spec.yaml
   version: "1.0.0"
   template: vue
   purpose: Vue 3 frontend application
   framework:
     name: Vue
     rendering: SPA
     language: TypeScript
   state_management:
     server_state: TanStack Query
     client_state: Pinia
   required_capabilities:
     - CAP-FF-001    # Feature flags
     - CAP-REP-001   # Reporting
     - CAP-ADM-001   # Admin dashboard
   ```

2. **Create Scaffold**
   ```
   templates/frontend-vue/scaffold/
   ├── src/
   ├── package.json
   ├── vite.config.ts
   └── ...
   ```

3. **Validate**
   ```bash
   npm run templates:validate-parity
   ```

4. **Add to Catalog**
   ```yaml
   # templates/shared/stack-catalog.yaml
   frontend:
     - key: vue
       framework: Vue
       spec: templates/frontend-vue/template-spec.yaml
       env: templates/frontend-vue/.env.example
       state_management: Pinia + TanStack Query
   ```

5. **Test**
   ```bash
   ai-agent-pack-install create frontend test-vue --stack vue
   ```

## Related Documentation

- **Architecture:** `docs/create-project-architecture.md` — Full system design
- **Catalog Contract:** `docs/create-project-catalog-contract.md` — Stack catalog rules
- **Scaffold Status:** `docs/create-project-scaffold-status.md` — Implementation status per stack
- **Backlog:** `docs/create-project-backlog.md` — Task breakdown

## FAQ

**Q: Can I customize the generated scaffold?**  
A: Yes. The scaffold is a starting point. After generation, it's your code — modify as needed.

**Q: Will my changes be overwritten if I regenerate?**  
A: No. The scaffolder only generates once. There's no "regenerate" command that would overwrite your work.

**Q: Can I use create mode for an existing project?**  
A: No. Create mode is for new projects only. For existing projects, use install mode to add agents and skills.

**Q: What if I want a stack that isn't implemented yet?**  
A: You can fork this repo, create the template, and use your fork. Or wait for the official implementation. See "Advanced: Extending Templates" above.

**Q: Do I need Hermes to use scaffolded projects?**  
A: No. Hermes is a separate system for model routing. Scaffolded projects work standalone. If you want AI-powered model routing, you can optionally integrate Hermes at runtime.

**Q: Why are lib and cli archetypes deferred?**  
A: They require different project structures (no frontend/backend distinction). They're planned but not prioritized for initial release.
