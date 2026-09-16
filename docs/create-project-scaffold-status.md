# Create-Project Real Scaffolds — Status

## Overview

Issue #48 implements real scaffold starters that extend the thin materialization baseline from #33 / PR #47.

## What Changed

### Before (#33 / PR #47)
- Thin materialization created project directories and generated manifests
- Projects started with only `package.json`, `.env.example`, `AGENTS.md`, and `.cursor/rules`
- No real source code — agents had to generate all boilerplate

### After (#48 — This PR)
- Real scaffold starters under `templates/{stack}/scaffold/` directories
- Projects start with functional application code:
  - **Next.js**: App Router structure, TanStack Query setup, sample features (reports, admin)
  - **NestJS**: Complete backend service with modules, controllers, services, tests
  - **FastAPI**: Python backend with routers, models, endpoints, pytest setup
- Materializer copies scaffold assets and renders template variables
- Generated artifacts (AGENTS.md, .cursor/rules) remain as before

## Implemented Stacks

### Priority Stacks (Fully Implemented)

#### Frontend: Next.js (`nextjs`)
- **Location**: `templates/frontend-nextjs/scaffold/`
- **Contents**:
  - Complete Next.js 15 App Router setup
  - TypeScript configuration
  - Vitest + Playwright test setup
  - Zustand + TanStack Query state management
  - Sample features: reports, admin/feature-flags
  - Real service layer with unit tests
  - E2E test examples

#### Backend: NestJS (`node_nestjs`)
- **Location**: `templates/backend-service/scaffold/`
- **Contents**:
  - NestJS 10 application structure
  - TypeORM database integration
  - Swagger/OpenAPI documentation
  - Health, Reports, and Admin modules
  - Unit tests (Jest) and E2E tests
  - DTOs, entities, controllers, services

#### Backend: FastAPI (`python`)
- **Location**: `templates/backend-python/scaffold/`
- **Contents**:
  - FastAPI application structure
  - Pydantic models and settings
  - Health, reports, and admin endpoints
  - pytest setup (unit + e2e markers)
  - Requirements files for dependencies

## Materialization Precedence

As documented in the materializer:

1. **Scaffold assets** (templates/{stack}/scaffold/) — preferred source
2. **Generated manifests** — fallback only where no scaffold file exists
3. **Template variables** rendered in all files: `{{projectName}}`

The materializer:
- Recursively copies scaffold directories
- Renders template variables (`{{projectName}}`)
- Copies `.env.example` from template root
- Generates `AGENTS.md` and `.cursor/rules` based on selected stacks

## Testing

Added comprehensive materialization tests (`cli/lib/materializer.test.ts`):
- ✅ Next.js project structure verification
- ✅ NestJS project structure verification
- ✅ FastAPI project structure verification
- ✅ Fullstack project materialization
- ✅ Template variable rendering
- ✅ AGENTS.md generation
- ✅ .cursor/rules generation
- ✅ Error handling for existing directories

## Catalog Contract Compliance

✅ All stacks are in `templates/shared/stack-catalog.yaml`  
✅ No stacks invented outside the catalog  
✅ Standards (template-spec.yaml, platform contracts) remain authoritative

## Out of Scope

As specified in issue #48:
- ❌ Nigel React preset overlay (#35)
- ❌ Full e2e docs polish (#36)
- ❌ Replacing materializer with Yeoman/Plop

## Next Steps

### Remaining Work (Per Issue #48)
1. ✅ Create scaffold starters (nextjs, node_nestjs, python)
2. ✅ Implement materializer with scaffold copying
3. ✅ Add tests for materialization
4. ✅ Update docs to reflect real starters
5. ⏳ Run existing test suite and fix failures
6. ⏳ Commit, push, and create PR

### Follow-On Issues
- Issue #35: Nigel React preset system
- Issue #36: E2E docs and polish
- Issue #49+: Starters for other stacks (sveltekit, angular, go, dotnet, java, rust)

## Usage Examples

### Create Next.js Frontend
```bash
ai-agent-pack-install create frontend my-app

# Output includes:
# - src/app/ with layout, providers, pages
# - features/ with reports and admin samples
# - Real TanStack Query + Zustand setup
# - Unit tests (Vitest) and E2E tests (Playwright)
```

### Create NestJS Backend
```bash
ai-agent-pack-install create backend api-service --stack node_nestjs

# Output includes:
# - src/ with modules, controllers, services
# - TypeORM entities and DTOs
# - Jest unit tests and E2E tests
# - Swagger API documentation setup
```

### Create FastAPI Backend
```bash
ai-agent-pack-install create backend api-service --stack python

# Output includes:
# - src/api/ with routers for health, reports, admin
# - Pydantic models and settings
# - pytest tests (unit + e2e markers)
# - requirements.txt with dependencies
```

### Create Fullstack Project
```bash
ai-agent-pack-install create fullstack my-project --frontend nextjs --backend python

# Output includes both frontend and backend scaffolds
```

## Verification

To verify the implementation works:

```bash
# Create a test project
ai-agent-pack-install create frontend test-nextjs

# Verify structure
cd test-nextjs
npm install
npm run test:unit  # Should pass
npm run build      # Should build successfully
```

## Related Documentation

- `docs/create-project-architecture.md` — Full architecture
- `docs/create-project-catalog-contract.md` — Catalog contract
- `cli/lib/materializer.ts` — Implementation
- `cli/lib/materializer.test.ts` — Test suite

## Completion Checklist

- [x] Real scaffold starters for nextjs
- [x] Real scaffold starters for node_nestjs
- [x] Real scaffold starters for python
- [x] Materializer implementation with template rendering
- [x] Tests for nextjs, node_nestjs, python materialization
- [x] AGENTS.md generation with stack info
- [x] .cursor/rules generation with conventions
- [x] Update README with current status
- [ ] Run existing test suite (`npm run pack:test`)
- [ ] Fix any test failures
- [ ] Commit and push changes
- [ ] Create PR linked to issue #48
