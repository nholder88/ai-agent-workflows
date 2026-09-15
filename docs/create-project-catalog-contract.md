# Create-Project Stack Catalog Contract

## Overview

The stack catalog (`templates/shared/stack-catalog.yaml`) is the **single allowlist** of scaffolds the create-project CLI may offer. This document defines the contract between the catalog, CLI, and template standards.

## Core Contract

### 1. Catalog is the Single Source of Truth

`templates/shared/stack-catalog.yaml` is the canonical allowlist of frontend and backend stacks available for scaffolding.

The create-project CLI:
- **MUST** load stack choices from this catalog at runtime
- **MUST NOT** hardcoded popular-framework lists in code
- **MUST NOT** expose framework options that lack catalog entries

### 2. Standards Before Scaffolds

A stack appears in the CLI **only if** it has complete standards and templates backing in this repository:

**Required for catalog entry:**
- ✅ Template specification file (e.g., `templates/frontend-nextjs/template-spec.yaml`)
- ✅ Platform contracts implementation (capabilities from `templates/shared/platform-contracts.yaml`)
- ✅ Environment template (`.env.example`)
- ✅ Parity validation passing (via `templates/tools/validate-parity.ts`)

**Process for adding new stacks:**
1. **First:** Create standards and templates in `templates/{stack}/`
2. **Second:** Add catalog entry in `templates/shared/stack-catalog.yaml`
3. **Automatic:** CLI picks up the new option on next run

**Never expose frameworks without standards.** The catalog-CLI contract ensures scaffolding consistency and prevents "best effort" templates.

### 3. Archetype-Stack Hierarchy

**Archetypes** are the top-level conceptual categories:
- `frontend` — Browser-based UI application
- `backend` — API service or backend application
- `fullstack` — Combined frontend + backend application
- `lib` — Reusable package or module
- `cli` — Command-line tool or utility

**Stacks** are the concrete subdivisions under frontend/backend/fullstack archetypes, sourced exclusively from the catalog:
- Frontend stacks: nextjs, sveltekit, angular (from `catalog.frontend[]`)
- Backend stacks: node_nestjs, python, go, dotnet, java, rust (from `catalog.backend[]`)

Archetypes are defined in code (`cli/lib/create-project-catalog.ts`). Stack options are loaded from the catalog.

### 4. Ownership Boundaries

**This repository (`ai-agent-workflows`) owns:**
- ✅ Autocode engineering standards for all scaffolds
- ✅ Template specifications and platform contracts
- ✅ Stack catalog and allowlist
- ✅ Skills library and agent definitions
- ✅ Generated project-local standards artifacts

**Hermes (separate system) owns:**
- ❌ OpenRouter API keys and credentials
- ❌ Model routing policy (which model for which task)
- ❌ Provider selection and configuration

See `docs/create-project-architecture.md` § "Hermes Boundary" for the complete separation of concerns.

## Enforcement

### Runtime Enforcement

The CLI enforces the allowlist contract at runtime:

```typescript
// cli/lib/create-project-catalog.ts
export function loadStackCatalog(catalogPath: string): StackCatalog {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const parsed = YAML.parse(raw) as StackCatalog;
  
  if (!parsed.frontend || !parsed.backend) {
    throw new Error(`Invalid stack catalog: missing frontend or backend stacks`);
  }
  
  return parsed;
}
```

Stack validation:
```typescript
// Only catalog stacks are valid
const validFrontendStacks = getFrontendStackKeys(catalog); // from catalog
const validBackendStacks = getBackendStackKeys(catalog);   // from catalog

if (!findFrontendStack(catalog, userChoice)) {
  throw new Error(`Unknown frontend stack "${userChoice}". Valid: ${validFrontendStacks.join(', ')}`);
}
```

### Build-Time Enforcement

Template parity validation (`templates/tools/validate-parity.ts`) ensures:
- All catalog entries have corresponding template directories
- All templates implement required platform capabilities
- Template specs reference valid capability contracts

CI fails if:
- Catalog references non-existent templates
- Templates lack required capabilities
- Parity checks detect drift between stacks

## Examples

### Valid: Adding a New Stack

To add Vue as a frontend stack:

1. **Create template standards:**
   ```
   templates/frontend-vue/
     ├── template-spec.yaml      # declares required_capabilities
     ├── .env.example            # environment template
     └── scaffold/               # scaffold files (for #33)
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

### Invalid: Hardcoding Framework Lists

❌ **Do not do this:**
```typescript
// BAD: Hardcoded framework list bypasses catalog
const FRONTEND_STACKS = ['nextjs', 'vue', 'react', 'svelte'];
```

✅ **Do this instead:**
```typescript
// GOOD: Load from catalog
const catalog = loadStackCatalog(catalogPath);
const frontendStacks = getFrontendStackKeys(catalog);
```

### Invalid: Exposing Unstandardized Frameworks

❌ **Do not add catalog entries without templates:**
```yaml
# BAD: No templates/frontend-blazor/ directory exists
frontend:
  - key: blazor
    framework: Blazor
    spec: templates/frontend-blazor/template-spec.yaml  # ❌ file doesn't exist
```

This will fail validation and break scaffolding. **Standards come first.**

## Catalog Schema

Each stack entry in the catalog includes:

```yaml
frontend:
  - key: string              # Stack identifier (CLI flag value)
    framework: string        # Display name
    spec: string             # Path to template-spec.yaml
    env: string              # Path to .env.example (optional)
    state_management: string # Description for interactive wizard
    wiki_update: object      # Wiki integration config (optional)
```

Required fields:
- `key` — Used in `--stack`, `--frontend`, `--backend` flags
- `framework` — Shown in interactive prompts
- `spec` — Must reference valid template-spec.yaml

## Migration Path

When the catalog changes (new stacks added, old ones removed):

1. **Catalog update** — Edit `templates/shared/stack-catalog.yaml`
2. **No CLI changes needed** — Stack choices load dynamically
3. **Generated projects unaffected** — They have pinned contract versions
4. **Future materializations** — Use updated catalog automatically

## Related Documentation

- `docs/create-project-architecture.md` — Full system architecture
- `docs/create-project-backlog.md` — Implementation task breakdown
- `templates/shared/platform-contracts.yaml` — Capability contracts
- `templates/tools/validate-parity.ts` — Parity validation logic

## Questions?

**Q: Can I add a framework without full template standards?**  
A: No. The catalog contract prevents "best effort" scaffolds. Complete the templates first.

**Q: Why not just hardcode popular frameworks?**  
A: Hardcoding breaks the contract and allows inconsistent scaffolds. The catalog ensures every option has standards backing.

**Q: What if I need a one-off scaffold for an experimental framework?**  
A: Create standards/templates in your fork, add a catalog entry, then propose upstream if it generalizes.

**Q: Does the catalog control model/provider configuration?**  
A: No. This repo owns engineering standards; Hermes owns model policy. See architecture docs § "Hermes Boundary".
