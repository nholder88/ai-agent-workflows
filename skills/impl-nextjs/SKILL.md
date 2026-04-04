---
name: impl-nextjs
description: >-
  Implement or refactor Next.js frontend features with Tailwind and Skeleton UI.
  Covers App Router, Server Components, Server Actions, Skeleton themes and
  components, layout patterns, and theme token compliance.
  USE FOR: Next.js + Skeleton UI setup, feature implementation, theming,
  component development with App Router patterns.
  DO NOT USE FOR: SvelteKit (use impl-sveltekit), Angular (use impl-angular),
  generic React/Vue (use impl-typescript-frontend), backend (use
  impl-typescript-backend).
argument-hint: 'Describe a Next.js + Skeleton setup or feature and I will implement it.'
phase: '4'
phase-family: implementation
---

# Next.js + Skeleton UI Implementation

## When to Use

- A requirement is implementation-ready and the target stack is Next.js with Skeleton UI and Tailwind.
- The task is project setup, feature implementation, theming, or component development using Skeleton's design system with Next.js App Router.
- The project uses (or will use) `@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-react`.

## When Not to Use

- SvelteKit + Skeleton -- use `impl-sveltekit`.
- Angular -- use `impl-angular`.
- Generic React/Vue/Nuxt frontend without Skeleton -- use `impl-typescript-frontend`.
- Backend work -- use `impl-typescript-backend`.
- Architecture or planning -- use `architecture-planning`.
- Requirements are vague -- use `requirements-clarification` first.
- Routing a mixed-scope task -- use `implementation-routing`.

## Procedure

1. **Detect context** -- Check for existing Next.js + Skeleton setup (`package.json`, `app/globals.css`, `data-theme` in layout) or assume greenfield. Read `package.json` and `tsconfig.json` to identify versions and structure.
2. **Read the spec or task** -- Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Fetch latest Skeleton docs** -- Before implementing or changing Skeleton layout or components, fetch `https://www.skeleton.dev/llms-react.txt` and use it as the source of truth for component names, props, layout patterns, and code samples.
4. **Setup or inspect existing patterns** -- For greenfield projects, follow the Project Setup section below. For existing projects, read neighboring modules for naming, error handling, styling, and test conventions before writing code.
5. **Implement or refactor** -- Write or modify code following project conventions, Skeleton's design system, and Next.js App Router patterns. Enforce all standards in the Standards section below.
6. **Build and verify** -- Run `npm run build` and `npm run dev`; fix failures. Ensure theme and components render correctly.
7. **Produce the output contract** -- Write the Implementation Complete Report (see Output Contract below).

## Standards

Every Next.js + Skeleton implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Project Setup (Next.js + Tailwind + Skeleton)

Use this sequence for new projects or when adding Skeleton to an existing Next.js app:

1. **Create Next.js project** (if greenfield):
   ```bash
   npm create next-app@latest <project-name>
   cd <project-name>
   ```
   Use TypeScript, ESLint, Tailwind, `app/` router, and src directory if the project prefers it.

2. **Install Skeleton**:
   ```bash
   npm i -D @skeletonlabs/skeleton @skeletonlabs/skeleton-react
   ```

3. **Configure Tailwind and Skeleton in CSS** -- In `app/globals.css` (or `src/app/globals.css`):
   - Import Tailwind: `@import 'tailwindcss';`
   - Import Skeleton: `@import '@skeletonlabs/skeleton';`
   - Import optional presets: `@import '@skeletonlabs/skeleton/optional/presets';`
   - Import a theme (e.g. cerberus, hamlindigo): `@import '@skeletonlabs/skeleton/themes/cerberus';`
   - Source Skeleton React components: `@source '../../node_modules/@skeletonlabs/skeleton-react/dist';` (adjust path if not using `src/`).

4. **Set active theme** -- In `app/layout.tsx`, set `data-theme` on the `<html>` element, e.g. `<html data-theme="cerberus">`.

5. **Verify** -- Run `npm run dev` and confirm the app loads with Skeleton styles.

**Compatibility:** Do not integrate Flowbite React, Flowbite Svelte, or Daisy UI; they conflict with Skeleton's Tailwind usage. Skeleton works with headless libraries (Bits UI, Melt UI, Radix, Zag.js) and Tailwind utility-based components.

### 2. Skeleton Integration

- **Requirements:** Next.js 15+, React 18+, Tailwind 4+.
- **Themes and presets:** Choose a theme from Skeleton's theme list (e.g. cerberus, hamlindigo, rocket). Use `data-theme` on `<html>` or a wrapper to switch themes. Optional presets adjust spacing and typography.
- **Components:** Use Skeleton's React components from `@skeletonlabs/skeleton-react` -- Accordion, App Bar, Avatar, Buttons, Cards, Chips, Forms/Inputs, Dialog, Menu, Navigation, Tabs, Toast, and others. See [Framework Components](https://www.skeleton.dev/docs/components).
- **Styling:** Components accept `className` for Tailwind utilities. Skeleton uses CSS custom properties and Tailwind; follow the design system (Themes, Colors, Typography) from the docs.
- **Theme switching:** If the app needs multiple themes, add a theme provider or script that sets `data-theme` on the root element; document the chosen approach.

### 3. Layout Components (Skeleton UI)

Before implementing layouts or changing layout structure, fetch `https://www.skeleton.dev/llms-react.txt` and use the latest Layouts guide, App Bar, and Navigation sections as the source of truth.

- **Custom page layouts** -- Skeleton does not provide an AppShell; use the Layouts guide: semantic HTML (`<header>`, `<main>`, `<footer>`, `<aside>`, `<article>`) and Tailwind utilities (grid, flex, gap, `min-h-screen`, `sticky`, `h-screen`). Prefer body scroll (scroll on `<body>`) for correct mobile behavior and accessibility. Use `html, body { @apply h-full; }` when using full-height grid layouts.
- **App Bar** -- For the top-of-page header use the App Bar component from `@skeletonlabs/skeleton-react`: `<AppBar>`, `<AppBar.Toolbar>`, `<AppBar.Lead>`, `<AppBar.Headline>`, `<AppBar.Trail>`. Control toolbar layout with `grid-cols-*` (e.g. `grid-cols-[auto_1fr_auto]` for lead/headline/trail).
- **Navigation** -- For nav/sidebar use the Navigation component with `layout="bar"` (horizontal), `layout="rail"` (vertical rail), or `layout="sidebar"` (vertical sidebar). Use `Navigation.Trigger`, `Navigation.List`, and list items as in the docs. For a sticky sidebar use `sticky top-0 h-screen`.

When building app shells, combine: root layout with theme + optional App Bar; then semantic `<main>` (and optional `<aside>` for sidebar) with Tailwind grid/flex. Reference the Layouts guide for one-column, two-column, three-column, sticky header, and sticky sidebar patterns.

### 4. Theme Token Rules (Non-Negotiable)

These rules are enforced by the `ui-ux-sentinel` agent after implementation. Violations will be sent back as Blocker findings. Follow them the first time.

#### NEVER use hardcoded Tailwind palette colors

Hardcoded palette classes (`text-blue-500`, `bg-gray-900`, `border-red-200`, etc.) bypass the Skeleton theme system. They break dark mode, theme switching, and brand consistency.

```tsx
// NEVER -- these will be flagged as Blocker violations
<div className="bg-blue-500 text-white">
<p className="text-gray-700 dark:text-gray-300">
<button className="bg-emerald-600 hover:bg-emerald-700 text-white">
<div className="border-gray-200 bg-white shadow-sm">
```

```tsx
// ALWAYS -- use Skeleton semantic tokens
<div className="bg-primary-500 text-on-primary-token">
<p className="text-surface-950-50-token">
<button className="btn preset-filled-primary-500">
<div className="border-surface-300-600-token card preset-outlined">
```

#### NEVER use manual dark: variants for color

Pairing `text-gray-900 dark:text-gray-100` manually duplicates what Skeleton's adaptive tokens do automatically and will break if the theme changes.

```tsx
// NEVER
<p className="text-zinc-800 dark:text-zinc-200">
<div className="bg-white dark:bg-gray-900">

// ALWAYS -- adaptive tokens handle both modes automatically
<p className="text-surface-950-50-token">
<div className="bg-surface-100-900-token">
```

#### NEVER use hardcoded hex, rgb, or hsl values

```tsx
// NEVER
<div style={{ color: '#334155', backgroundColor: '#f8fafc' }}>
<div className="[color:#1e293b]">

// ALWAYS -- define custom values in globals.css as CSS custom properties
// and reference via the Tailwind theme config or Skeleton token classes
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

### 5. Next.js App Router Patterns

- **App Router** -- Use the `app/` directory. Prefer Server Components; add `"use client"` only for interactivity, hooks, or browser APIs.
- **Server Components** -- Default for pages and layouts. Fetch data directly in components or via async page/layout; avoid client-side fetch for initial data when server fetch is possible.
- **Server Actions** -- Use for mutations (forms, updates). Define in server modules and call from Client or Server Components as appropriate.
- **Routing and layouts** -- Use `app/page.tsx`, `app/layout.tsx`, route groups, and dynamic segments. Share layout via `layout.tsx`; use `loading.tsx` and `error.tsx` for streaming and error boundaries.
- **Metadata** -- Export `metadata` or `generateMetadata` from layouts and pages for title, description, and Open Graph.
- **API routes** -- Use `app/api/.../route.ts` for REST endpoints when needed. Prefer Server Actions for form and mutation flows from the UI.
- **Caching** -- Use `fetch` cache options, `revalidate`, or `unstable_cache` when appropriate; avoid over-caching dynamic data.
- **Middleware** -- Use for auth redirects, rewrites, or headers when the app requires it.

### 6. Accessibility and UX

- **Visual hierarchy** -- Clear H1/H2 structure, primary action is visually dominant.
- **Loading states** -- Every async operation has a spinner, skeleton, or progress indicator.
- **Empty states** -- Every list or data surface has an empty state component.
- **Error states** -- API failures and validation errors surface a message to the user.
- **Success feedback** -- Mutations confirm success via toast or banner.
- **Accessibility** -- All interactive elements are keyboard accessible with visible focus styles.
- **Semantic HTML** -- `<button>`, `<nav>`, `<main>`, `<section>` used where appropriate; no `<div onClick>` without ARIA.
- **ARIA labels** -- Icon-only buttons and controls have `aria-label`.
- **Responsive** -- Layout adapts correctly at mobile (375px), tablet (768px), and desktop (1280px).
- **Consistency** -- Same component variant used for same purpose across all pages in scope.

### 7. Project Structure

- **app/** -- App Router: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, route segments, `api/`. Use Skeleton layout patterns in root layout: semantic regions and, when needed, App Bar and Navigation.
- **components/** -- Reusable UI: Skeleton-based components (including layout pieces such as App Bar or Navigation wrappers), wrappers, and feature components. Colocate when small.
- **lib/** -- Utilities, theme helpers, shared config. Optional: Skeleton theme switcher or config here.

Place new Skeleton-backed components in `components/`. Keep layout structure (semantic regions, App Bar, optional Navigation) and root theme configuration in `app/layout.tsx`.

### Reference Documentation

- **Skeleton React (LLM-oriented, full reference):** https://www.skeleton.dev/llms-react.txt
- **Skeleton docs (browser):** https://www.skeleton.dev/docs
- **Next.js docs:** https://nextjs.org/docs

### Quality Checklist

#### Code Quality
- [ ] TypeScript strict mode; no unnecessary `any`.
- [ ] Server Components by default; Client Components only where needed (`"use client"`).
- [ ] Build passes (`npm run build`); dev server runs without errors.
- [ ] No conflicting UI libraries (Flowbite, DaisyUI) in the stack.

#### Theme Compliance (all must be true before handing off)
- [ ] Zero hardcoded Tailwind palette colors (`text-blue-500`, `bg-gray-900`, etc.) -- use Skeleton tokens
- [ ] Zero hardcoded hex, rgb, or hsl values in `className` or `style`
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
- Do not integrate Flowbite, DaisyUI, or other Tailwind UI libraries that conflict with Skeleton.
- Use `impl-sveltekit` for SvelteKit + Skeleton work, `impl-angular` for Angular work, `impl-typescript-frontend` for generic React/Vue work.
- Use `architecture-planning` when design decisions are needed before implementation can begin.
- Use `requirements-clarification` when the spec is vague or has unresolved questions.
