---
name: impl-typescript-frontend
description: >-
  Implement or refactor TypeScript frontend features for React, Vue, Nuxt, and
  general client-side work. Covers components, hooks, stores, routing, data
  fetching, state management, accessibility, and required UI states (loading,
  error, empty, populated).
  USE FOR: React, Vue, Nuxt frontend implementation, component development,
  client-side state management, generic TypeScript frontend work.
  DO NOT USE FOR: Next.js + Skeleton (use impl-nextjs), SvelteKit + Skeleton
  (use impl-sveltekit), Angular (use impl-angular), backend (use
  impl-typescript-backend).
argument-hint: 'Point me at a spec, task, or frontend file and I will implement or refactor it.'
phase: '4'
phase-family: implementation
---

# TypeScript Frontend Implementation

## When to Use

- A requirement is implementation-ready and the target stack is React, Vue, Nuxt, or general TypeScript frontend.
- The task is component development, client-side state management, data fetching, routing, or form handling.
- The project does not use Next.js + Skeleton, SvelteKit + Skeleton, or Angular (those have dedicated skills).

## When Not to Use

- Next.js + Skeleton -- use `impl-nextjs`.
- SvelteKit + Skeleton -- use `impl-sveltekit`.
- Angular -- use `impl-angular`.
- Backend work (NestJS, Express, Fastify, API routes, database, workers) -- use `impl-typescript-backend`.
- Architecture or planning -- use `architecture-planning`.
- Requirements are vague -- use `requirements-clarification` first.
- Routing a mixed-scope task -- use `implementation-routing`.

## Procedure

1. **Detect framework** -- Read `package.json`, `tsconfig.json`, and folder structure to identify React, Vue/Nuxt, SvelteKit, or other frontend framework. If framework is Next.js, SvelteKit, or Angular, route to the specialist skill instead of continuing here.
2. **Read the spec or task** -- Extract acceptance criteria, component props, state, interactions, and edge cases. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Check for design system** -- Does the project use Skeleton UI, shadcn, Tailwind only, or a custom system? Apply the detected design system conventions.
4. **Inspect existing patterns** -- Read neighboring modules for naming, error handling, styling, and test conventions before writing code.
5. **Implement or refactor** -- Write or modify components and logic following the framework's conventions and the standards below. Enforce all required states and accessibility patterns.
6. **Build and test** -- Run `npm run build` or equivalent. Fix failures before finishing.
7. **Produce the output contract** -- Write the Implementation Complete Report (see Output Contract below).

## Standards

Every TypeScript frontend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Framework Patterns

#### React

**Component structure:**

```typescript
// Prefer named exports for components
export interface CardProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function Card({ title, description, onAction }: CardProps) {
  return (
    <article className="...">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onAction && (
        <button type="button" onClick={onAction}>
          Action
        </button>
      )}
    </article>
  );
}
```

**Data fetching (Next.js App Router, reference only):**

- Fetch data in Server Components by default
- Use `async`/`await` directly in page or layout components
- Use `loading.tsx` for streaming suspense boundaries
- Use `error.tsx` for error boundaries
- Move to client-side fetch (`swr`, `react-query`) only when data must update without navigation

When Next.js is in scope, prefer routing to `impl-nextjs`.

**State management:**

- Local state: `useState`, `useReducer`
- Shared across subtree: `useContext` with a typed context
- Global / cross-cutting: Zustand or Jotai (detect from `package.json`)
- Server cache: React Query / SWR for data that mirrors server state

#### Vue / Nuxt

**Composition API (always preferred over Options API):**

```typescript
<script setup lang="ts">
interface Props {
  title: string
  items: Item[]
}
const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: Item] }>()

const selected = ref<Item | null>(null)

function handleSelect(item: Item) {
  selected.value = item
  emit('select', item)
}
</script>
```

**State:** Pinia for shared state (detect from `package.json`).

#### SvelteKit (reference)

```typescript
<script lang="ts">
  export let title: string;
  export let items: Item[] = [];

  let selected: Item | null = null;

  function handleSelect(item: Item) {
    selected = item;
  }
</script>
```

**State:** Svelte stores (`writable`, `readable`, `derived`) or Svelte 5 runes (`$state`, `$derived`).

### 2. Required States for Every Component / Page

This is the most common source of quality issues. Before marking any component complete, verify:

```typescript
// INCOMPLETE -- no loading, empty, or error states
export function ItemList() {
  const { data } = useSWR<Item[]>('/api/items');
  return <ul>{data?.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}

// COMPLETE -- all states handled
export function ItemList() {
  const { data, error, isLoading } = useSWR<Item[]>('/api/items');

  if (isLoading) return <ItemListSkeleton />;
  if (error) return <ErrorBanner message="Failed to load items. Please try again." />;
  if (!data?.length) return <EmptyState message="No items yet." action={<CreateItemButton />} />;

  return (
    <ul role="list">
      {data.map(item => <ItemRow key={item.id} item={item} />)}
    </ul>
  );
}
```

**States to handle for every data surface:**

- `loading` -- skeleton or spinner while fetching
- `error` -- user-visible error message (not just a console.log)
- `empty` -- explicit empty state component, not a blank area
- `populated` -- the main happy path

**States to handle for every mutation (form submit, button action):**

- `idle` -- initial state
- `loading` -- button disabled, shows spinner
- `success` -- confirmation message or navigation
- `error` -- inline error near the trigger

### 3. Accessibility Baseline

Every component must meet this baseline before completion:

```typescript
// VIOLATION -- not keyboard accessible, no ARIA
<div onClick={handleDelete} className="cursor-pointer text-red-500">
  <TrashIcon />
</div>

// CORRECT
<button
  type="button"
  onClick={handleDelete}
  aria-label={`Delete ${item.name}`}
  className="btn-icon text-error-500"
>
  <TrashIcon aria-hidden="true" />
</button>
```

Checklist for every interactive element:

- Uses semantic HTML (`<button>`, `<a>`, `<input>`, `<select>`) -- no `<div onClick>`
- Has visible focus indicator (do not use `outline-none` without a replacement)
- Icon-only controls have `aria-label`
- Form inputs have `<label>` or `aria-label`
- Images have meaningful `alt` text (empty string for decorative)
- Color is not the only way information is conveyed

### 4. Type Safety

```typescript
// LOOSE types -- avoid
function processItems(items: any[]) { ... }
const [data, setData] = useState<any>(null);

// EXPLICIT types -- required
interface Item { id: string; name: string; status: 'active' | 'archived' }
function processItems(items: Item[]) { ... }
const [data, setData] = useState<Item[]>([]);
```

- No `any` on public component props or hook return values.
- Props interfaces defined and exported.

### 5. Project Structure

Infer from the repo. Match existing conventions exactly.

**React (Vite):**

```
src/
  components/
  hooks/
  stores/
  services/     # API client layer
  utils/
```

**Next.js (App Router, reference):**

```
app/
  layout.tsx
  page.tsx
  (feature)/
    page.tsx
    loading.tsx
    error.tsx
components/
  ui/           # Primitive, reusable components
  features/     # Feature-specific components
hooks/
lib/
  api.ts        # API client / fetch wrappers
```

**SvelteKit (reference):**

```
src/
  lib/
    components/
    stores/
    utils/
  routes/
```

### 6. Tooling

- **Package manager:** npm, pnpm, or yarn -- use whichever is in the repo
- **Lint/format:** ESLint + Prettier -- run and fix before reporting complete
- **Build:** `npm run build` -- ensure it passes
- **Tests:** Vitest -- run affected tests before reporting complete

### Quality Checklist

#### Required states (block completion if missing)
- [ ] Loading state on every async data surface
- [ ] Error state on every async data surface
- [ ] Empty state on every list, table, or data grid
- [ ] Button/form disabled + spinner during mutation
- [ ] Success feedback after every mutation

#### Accessibility (block completion if any fail)
- [ ] No `<div onClick>` -- semantic HTML used
- [ ] All interactive elements keyboard accessible
- [ ] Icon-only controls have `aria-label`
- [ ] Form inputs have labels
- [ ] Focus indicators visible (no bare `outline-none`)
- [ ] `alt` text on all `<img>` elements

#### Code quality
- [ ] No `any` types on public component props or hook return values
- [ ] Props interfaces defined and exported
- [ ] No `console.log` left in component code
- [ ] Responsive at 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Build and lint pass

## Output Contract

All skills in the **implementation** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Implementation Complete Report

**Implementation summary**
[2-4 sentences: what was delivered and how it matches the request.]

**Scope**
- In scope: [bullets or "As specified in task"]
- Out of scope / deferred: [bullets or "None"]

**Acceptance criteria mapping**
| AC / criterion | Evidence |
|----------------|----------|
| [AC-1 or description] | [file path, test name, or behavior] |

_Use `N/A -- [reason]` if no formal AC list exists._

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [one line] |

**Verification**
- [command] -- [result: pass/fail/skip]
- _If not run, state why._

**Risks and follow-ups**
- [concrete items] or **None**

**Suggested next step**
[Handoff target agent name or human action.]
```

## Guardrails

- Use existing conventions and naming. Do not introduce new patterns when the project already has established ones.
- Avoid speculative architecture changes during focused implementation.
- Do not add features, refactor code, or make improvements beyond what the spec asks for.
- Route to `impl-nextjs` for Next.js + Skeleton, `impl-sveltekit` for SvelteKit + Skeleton, `impl-angular` for Angular.
- Use `architecture-planning` when design decisions are needed before implementation can begin.
- Use `requirements-clarification` when the spec is vague or has unresolved questions.
