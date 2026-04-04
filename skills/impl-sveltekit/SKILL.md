---
name: impl-sveltekit
description: >-
  Implement or refactor SvelteKit frontend features with Tailwind and Skeleton UI.
  Covers file-based routing, load functions, form actions, SSR/CSR, Skeleton
  Svelte components and themes, and layout patterns.
  USE FOR: SvelteKit + Skeleton UI setup, feature implementation, theming,
  component development with SvelteKit patterns.
  DO NOT USE FOR: Next.js (use impl-nextjs), Angular (use impl-angular),
  generic React/Vue (use impl-typescript-frontend), backend (use
  impl-typescript-backend).
argument-hint: 'Describe a SvelteKit + Skeleton setup or feature and I will implement it.'
phase: '4'
phase-family: implementation
---

# SvelteKit + Skeleton UI Implementation

## When to Use

- A requirement is implementation-ready and the target stack is SvelteKit with Skeleton UI and Tailwind.
- The task is project setup, feature implementation, theming, or component development using Skeleton's design system with SvelteKit.
- The project uses (or will use) `@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-svelte`.

## When Not to Use

- Next.js + Skeleton -- use `impl-nextjs`.
- Angular -- use `impl-angular`.
- Generic React/Vue/Nuxt frontend without Skeleton -- use `impl-typescript-frontend`.
- Backend work -- use `impl-typescript-backend`.
- Architecture or planning -- use `architecture-planning`.
- Requirements are vague -- use `requirements-clarification` first.
- Routing a mixed-scope task -- use `implementation-routing`.

## Procedure

1. **Detect context** -- Check for existing SvelteKit + Skeleton setup: `package.json` includes `@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-svelte`; global stylesheet imports Tailwind and Skeleton; `src/app.html` uses `data-theme` on `<html>`.
2. **Read the spec or task** -- Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Fetch latest Skeleton docs** -- Before implementing or changing Skeleton layout or components, fetch `https://www.skeleton.dev/llms-svelte.txt` and use it as the source of truth for component names, props/slots, layout patterns, and code samples.
4. **Setup or inspect existing patterns** -- For greenfield projects, follow the Project Setup section below. For existing projects, read neighboring modules for naming, error handling, styling, and test conventions before writing code.
5. **Implement or refactor** -- Write or modify code following project conventions, Skeleton's design system, and SvelteKit patterns. Enforce all standards in the Standards section below.
6. **Build and verify** -- Run `npm run check` and `npm run build`; fix failures. Ensure theme and components render correctly at runtime.
7. **Produce the output contract** -- Write the Implementation Complete Report (see Output Contract below).

## Standards

Every SvelteKit + Skeleton implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Project Setup (SvelteKit + Tailwind + Skeleton)

Use this sequence for new projects or when adding Skeleton to an existing SvelteKit app:

1. **Create SvelteKit project** (if greenfield):
   ```bash
   npx sv create --types ts my-skeleton-app
   cd my-skeleton-app
   ```
   If Tailwind was not selected during creation, add it:
   ```bash
   npx sv add tailwindcss
   ```

2. **Install Skeleton**:
   ```bash
   npm i -D @skeletonlabs/skeleton @skeletonlabs/skeleton-svelte
   ```

3. **Configure Tailwind and Skeleton in CSS** -- In `src/routes/layout.css` (or the project's global stylesheet):
   - Import Tailwind: `@import 'tailwindcss';`
   - Import Skeleton core: `@import '@skeletonlabs/skeleton';`
   - Import Skeleton Svelte layer: `@import '@skeletonlabs/skeleton-svelte';`
   - Import a theme (e.g. cerberus): `@import '@skeletonlabs/skeleton/themes/cerberus';`

4. **Set active theme** -- In `src/app.html`, set `data-theme` on the `<html>` element:
   ```html
   <html data-theme="cerberus">
   ```

5. **Verify** -- Run `npm run dev` and confirm the app loads with Skeleton styles.

**Compatibility:** Do not integrate Flowbite Svelte or DaisyUI; they conflict with Skeleton's Tailwind usage. Skeleton works well with headless libraries (Bits UI, Melt UI, Radix UI, Zag.js) and Tailwind utility-based components.

### 2. Skeleton Integration

- **Requirements:** SvelteKit 2+, Svelte 5+, Tailwind 4+.
- **Themes and presets:** Choose a theme from Skeleton's theme list (e.g. cerberus, hamlindigo, rocket). Use `data-theme` on `<html>` or a wrapper to switch themes. Optional presets adjust spacing and typography.
- **Components:** Use Skeleton's Svelte components from `@skeletonlabs/skeleton-svelte` -- buttons, forms/inputs, dialogs, menus, navigation, tabs, toast, and others. Follow the patterns from `llms-svelte.txt` for imports, props, and slots.
- **Styling:** Components accept Tailwind utility classes via `class`. Skeleton uses CSS custom properties and Tailwind; follow the design system (themes, colors, typography) from the docs instead of ad-hoc styling.
- **Theme switching:** If the app needs multiple themes, implement a theme switcher that updates `data-theme` on the root element and persists choice (e.g. in `localStorage`). Document the chosen approach.

### 3. Layout and Routing (SvelteKit)

Use SvelteKit's routing and layout system together with Skeleton's layout guidance.

- **Routes and layouts:**
  - `src/routes/+layout.svelte` -- root layout; apply Skeleton layout patterns, set up top-level regions (`<header>`, `<main>`, `<footer>`, optional `<aside>`).
  - `src/routes/+page.svelte` -- root page or feature pages.
  - Nested layouts and pages use `+layout.svelte`, `+page.svelte` in folders under `src/routes`.
- **Data loading:**
  - Use `+page.ts`/`+page.server.ts` with `load`/`loadServer` for data-fetching.
  - Prefer server-side `loadServer` for initial data when possible; fall back to client-side fetch only when necessary.
- **Actions and forms:**
  - Use `+page.server.ts` actions for mutations (forms, updates).
  - Provide user-visible success and error messages and wire them into the UI.
- **Error and loading states:**
  - Use `+error.svelte` and layout/page-level error handling.
  - Provide Skeleton-based loading indicators (skeleton loaders, spinners) for async content.

When building app shells, combine: root layout with theme + header/navigation; then semantic `<main>` (and optional `<aside>`) with Tailwind grid/flex. Reference Skeleton's layout patterns for one-column, two-column, sticky header, and sticky sidebar layouts.

### 4. Theme Token Rules (Non-Negotiable)

These rules are enforced by the `ui-ux-sentinel` agent after implementation. Violations will be sent back as Blocker findings. Follow them the first time.

#### NEVER use hardcoded Tailwind palette colors

Hardcoded palette classes (`text-blue-500`, `bg-gray-900`, `border-red-200`, etc.) bypass the Skeleton theme system. They break dark mode, theme switching, and brand consistency.

```svelte
<!-- NEVER -- these will be flagged as Blocker violations -->
<div class="bg-blue-500 text-white">
<p class="text-gray-700 dark:text-gray-300">
<button class="bg-emerald-600 hover:bg-emerald-700 text-white">
<div class="border-gray-200 bg-white shadow-sm">
```

```svelte
<!-- ALWAYS -- use Skeleton semantic tokens -->
<div class="bg-primary-500 text-on-primary-token">
<p class="text-surface-950-50-token">
<button class="btn preset-filled-primary-500">
<div class="border-surface-300-600-token card preset-outlined">
```

#### NEVER use manual dark: variants for color

Pairing `text-gray-900 dark:text-gray-100` manually duplicates what Skeleton's adaptive tokens do automatically and will break if the theme changes.

```svelte
<!-- NEVER -->
<p class="text-zinc-800 dark:text-zinc-200">
<div class="bg-white dark:bg-gray-900">

<!-- ALWAYS -- adaptive tokens handle both modes automatically -->
<p class="text-surface-950-50-token">
<div class="bg-surface-100-900-token">
```

#### NEVER use hardcoded hex, rgb, or hsl values

```svelte
<!-- NEVER -->
<div style="color: #334155; background-color: #f8fafc;">
<div class="[color:#1e293b]">

<!-- ALWAYS -- define custom values in the global stylesheet as CSS custom properties
     and reference via the Tailwind theme config or Skeleton token classes -->
```

#### Skeleton Token Reference

Use this table for every styling decision. When in doubt, prefer the semantic token over a palette shade.

| Use Case | Class to Use |
|----------|-------------|
| Primary button (filled) | `btn preset-filled-primary-500` |
| Primary button (outlined) | `btn preset-outlined-primary-500` |
| Primary button (tonal) | `btn preset-tonal-primary-500` |
| Destructive / error button | `btn preset-filled-error-500` |
| Surface background (card, panel) | `bg-surface-100-900-token` or `card` |
| Page / app background | `bg-surface-50-950-token` |
| Primary text | `text-surface-950-50-token` |
| Secondary / muted text | `text-surface-700-300-token` |
| On-primary text | `text-on-primary-token` |
| Border (default) | `border-surface-300-600-token` |
| Border (emphasis) | `border-surface-400-500-token` |
| Error / validation message | `text-error-500` |
| Success message | `text-success-500` |
| Warning message | `text-warning-500` |
| Input background | `input` class from Skeleton |
| Badge / chip | `chip` with `preset-filled-[color]-[shade]` |
| Ring / focus | `ring-primary-500` |

#### Spacing Rules

- Use Tailwind's 4px scale only. No arbitrary values like `p-[13px]`, `mt-[7px]`, `gap-[11px]`.
- Prefer spacing tokens from the scale: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- Be consistent -- if cards use `p-4`, all cards use `p-4`. Do not mix `p-3` and `p-5` for the same component type.

### 5. Accessibility and UX

- **Visual hierarchy** -- Clear H1/H2 structure, primary action is visually dominant.
- **Loading states** -- Every async operation has a spinner, skeleton, or progress indicator.
- **Empty states** -- Every list or data surface has an empty state component.
- **Error states** -- API failures and validation errors surface a message to the user.
- **Success feedback** -- Mutations confirm success via toast or banner.
- **Accessibility** -- All interactive elements are keyboard accessible with visible focus styles. Skeleton/Zag.js components include a11y; ensure focus and semantics are preserved in custom markup.
- **Semantic HTML** -- `<button>`, `<nav>`, `<main>`, `<section>` used where appropriate; no `<div on:click>` without ARIA.
- **ARIA labels** -- Icon-only buttons and controls have `aria-label`.
- **Responsive** -- Layout adapts correctly at mobile (375px), tablet (768px), and desktop (1280px).
- **Consistency** -- Same component variant used for same purpose across all pages in scope.

### 6. Project Structure

Follow the project's existing structure. If establishing conventions, use:

```text
src/
  lib/
    components/   # Reusable components (Skeleton-based and generic)
    stores/       # Svelte stores
    utils/        # Shared utilities
  routes/
    +layout.svelte
    +layout.ts           # load functions (optional)
    +page.svelte
    (feature)/
      +page.svelte
      +page.server.ts    # actions / server load
      +layout.svelte     # feature layout when needed
  routes/layout.css      # global Tailwind + Skeleton imports
```

Place new Skeleton-backed components in `src/lib/components/`. Keep layout structure (semantic regions, header, navigation) and root theme configuration in `src/routes/+layout.svelte` and `src/app.html`.

### Reference Documentation

- **Skeleton Svelte (LLM-oriented, full reference):** https://www.skeleton.dev/llms-svelte.txt
- **Skeleton docs (browser):** https://www.skeleton.dev/docs
- **SvelteKit docs:** https://svelte.dev/docs/kit

### Quality Checklist

#### Code Quality
- [ ] TypeScript strict mode; no unnecessary `any` in load functions, actions, or component props.
- [ ] SvelteKit routing and layouts used idiomatically; no manual history hacks.
- [ ] Skeleton components used per docs; theme applied via `data-theme`.
- [ ] No conflicting UI libraries (Flowbite Svelte, DaisyUI) in the stack.
- [ ] `npm run check` and `npm run build` pass; dev server runs without errors.

#### Theme Compliance (all must be true before handing off)
- [ ] Zero hardcoded Tailwind palette colors -- use Skeleton tokens
- [ ] Zero hardcoded hex, rgb, or hsl values in `class` or `style`
- [ ] Zero manual `dark:` color variants -- use adaptive tokens instead
- [ ] Zero arbitrary color values (`[color:...]`, `[background:...]`)
- [ ] Spacing uses Tailwind scale only -- no arbitrary `p-[Xpx]` or `mt-[Xpx]` values

#### UX Principles (all must be true before handing off)
- [ ] Visual hierarchy -- Clear H1/H2 structure, primary action is visually dominant
- [ ] Loading states -- Every async operation has a spinner, skeleton, or progress indicator
- [ ] Empty states -- Every list or data surface has an empty state component
- [ ] Error states -- API failures and validation errors surface a message to the user
- [ ] Success feedback -- Mutations confirm success via toast or banner
- [ ] Accessibility -- All interactive elements keyboard accessible with visible focus styles
- [ ] Semantic HTML -- `<button>`, `<nav>`, `<main>`, `<section>` used where appropriate
- [ ] ARIA labels -- Icon-only buttons and controls have `aria-label`
- [ ] Responsive -- Layout adapts correctly at mobile (375px), tablet (768px), and desktop (1280px)
- [ ] Consistency -- Same component variant used for same purpose across all pages in scope

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
- Do not integrate Flowbite Svelte, DaisyUI, or other Tailwind UI libraries that conflict with Skeleton.
- Use `impl-nextjs` for Next.js + Skeleton work, `impl-angular` for Angular work, `impl-typescript-frontend` for generic React/Vue work.
- Use `architecture-planning` when design decisions are needed before implementation can begin.
- Use `requirements-clarification` when the spec is vague or has unresolved questions.
