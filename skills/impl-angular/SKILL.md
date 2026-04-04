---
name: impl-angular
description: >-
  Implement or refactor Angular frontend features. Covers standalone components,
  Signals, control flow, Angular Material theming, Tailwind integration, version
  migration, and Material-to-Tailwind style conversion.
  USE FOR: Angular feature implementation, version migration, Material theming,
  Tailwind conversion, component development with modern Angular patterns.
  DO NOT USE FOR: Next.js (use impl-nextjs), SvelteKit (use impl-sveltekit),
  generic React/Vue (use impl-typescript-frontend), backend (use
  impl-typescript-backend).
argument-hint: 'Point me at an Angular app, spec, or component and I will implement, migrate, or convert styles.'
phase: '4'
phase-family: implementation
---

# Angular Implementation

## When to Use

- A requirement is implementation-ready and the target stack is Angular.
- The task involves implementing features, migrating Angular versions, working with Angular Material theming, or converting Material styles to Tailwind.
- The project uses Angular standalone components, Signals, and modern control flow patterns.

## When Not to Use

- Next.js + Skeleton -- use `impl-nextjs`.
- SvelteKit + Skeleton -- use `impl-sveltekit`.
- Generic React/Vue/Nuxt frontend -- use `impl-typescript-frontend`.
- Backend work (NestJS, Express, API routes, database) -- use `impl-typescript-backend`.
- Architecture or planning -- use `architecture-planning`.
- Requirements are vague -- use `requirements-clarification` first.
- Routing a mixed-scope task -- use `implementation-routing`.

## Procedure

1. **Detect Angular version and stack** -- Read `package.json` and optionally run `ng version` to identify Angular and Angular Material versions. Check for `@angular/material` and Tailwind (`tailwindcss`, `@tailwindcss/postcss` in `package.json`; `styles.css` or `angular.json` styles).
2. **Read the spec or task** -- Extract acceptance criteria, component contracts, state, and edge cases. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** -- Read neighboring modules for naming, error handling, styling, and test conventions before writing code.
4. **Implement, migrate, or convert** -- Implement features using modern Angular patterns, run version migrations using official guides, or convert Material styles to Tailwind as requested. Enforce all standards in the Standards section below.
5. **Self-check** -- Run through the quality checklist. Do not report complete with failing checks.
6. **Build and test** -- Run `ng build` (or `npm run build`) and relevant tests. Fix failures before finishing.
7. **Produce the output contract** -- Write the Implementation Complete Report (see Output Contract below).

## Standards

Every Angular implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Angular Patterns

- **Standalone components** -- Use standalone components by default. Do not set `standalone: true` in decorators in Angular v20+ (it is the default).
- **Signals** -- Use `signal()`, `computed()`, and `effect()` for state. Do not use `mutate` on signals; use `update` or `set`.
- **Inputs and outputs** -- Use `input()` and `output()` functions instead of `@Input()` and `@Output()` decorators.
- **Control flow** -- Use native `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- **Injection** -- Use `inject()` instead of constructor injection where appropriate.
- **Change detection** -- Set `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component` decorator.
- **Templates** -- Use `class` and `style` bindings; do not use `ngClass` or `ngStyle`. Use the async pipe for observables. Do not write arrow functions in templates.
- **Images** -- Use `NgOptimizedImage` for static images (not for inline base64).
- **Accessibility** -- Pass AXE checks and follow WCAG AA (focus management, color contrast, ARIA). Put host bindings in the `host` object of the decorator; do not use `@HostBinding` or `@HostListener`.

Align with Angular's LLM best practices: https://angular.dev/ai/develop-with-ai and https://angular.dev/context/llms-files/llms-full.txt.

### 2. Version Migration

- Use `ng update` to upgrade Angular and Angular Material. Run one major version step at a time when crossing majors.
- Before migrating, fetch or read the official migration guide for the target version (e.g. from angular.dev or material.angular.io).
- Account for breaking changes: standalone migration, signals, new control flow, Material API and theming changes.
- Do not guess; look up or cite migration docs. Run the build and tests after each major migration step.

### 3. Angular Material Awareness

- Match Angular Material version to the Angular version (check compatibility on material.angular.io).
- Know theme structure: palette, typography, density. Prefer theme tokens and documented customization over ad-hoc component overrides.
- When customizing components, use theme extensions or documented APIs (e.g. `MatFormFieldAppearance`, slot props) rather than deep SCSS overrides when possible.
- Be aware of component API and CSS variable changes across Material versions when migrating or refactoring.

### 4. Style Analysis and Visual Fidelity

When updating styles (e.g. during migration or refactor):

1. **Capture current state** -- Note spacing, colors, typography, breakpoints, transitions, and shadows used in the existing UI.
2. **Produce equivalent styles** -- Use theme tokens, Tailwind utilities, or minimal custom CSS so the result looks and behaves the same.
3. **Document intentional changes** -- If any visual change is deliberate, document it (e.g. in a comment or migration note).
4. Prefer design tokens or Tailwind theme configuration over one-off values when possible.

### 5. Material to Tailwind Conversion

When converting Angular Material component styles to Tailwind:

- **Palette** -- Map Material palette (primary, accent, warn, etc.) to Tailwind theme colors in `tailwind.config` or `@theme` (Tailwind v4).
- **Spacing and typography** -- Map Material spacing/typography scale to Tailwind `spacing` and `fontSize`/`fontFamily` utilities.
- **Component overrides** -- Replace component-specific SCSS/CSS with Tailwind utility classes on the component template or host, or use `@apply` in a single global/layer file to avoid scattering deep overrides.
- **Coexistence** -- If both Material and Tailwind are used, follow coexistence patterns: consider Tailwind preflight (e.g. `preflight: false` if Material provides baseline), `important` selector strategy if needed, and CSS injection order. Use concepts from MUI + Tailwind docs adapted for Angular (e.g. global styles order in `angular.json` and component encapsulation).

### 6. Required Component States

#### States for data surfaces

- `loading` -- skeleton or spinner while fetching
- `error` -- user-visible error message (not only console)
- `empty` -- explicit empty state component
- `populated` -- main content

#### States for mutations

- `idle` -- initial
- `loading` -- button disabled, spinner
- `success` -- confirmation or navigation
- `error` -- inline error near the trigger

### 7. Accessibility Baseline

- Use semantic HTML (`<button>`, `<a>`, `<input>`, `<select>`); no `<div (click)>`
- Visible focus indicator; no bare `outline-none` without a replacement
- Icon-only controls have `aria-label`
- Form inputs have `<label>` or `aria-label`
- Images have meaningful `alt` (or empty string if decorative)
- Color is not the only way to convey information

### 8. Type Safety

- No `any` on public component props or service contracts. Use explicit interfaces and `unknown` when type is dynamic.

### 9. Project Structure

Infer from the repo. Typical Angular layout:

- `src/app/` -- app component, routing, feature areas
- `src/app/components/` or `src/app/core/`, `shared/` -- shared components and services
- `angular.json` -- build and style configuration
- `styles.css` or `src/styles.css` -- global styles, Tailwind import

Match existing naming and folder conventions.

### 10. Tooling

- **Package manager:** npm, pnpm, or yarn -- use the one in the repo
- **Lint/format:** ESLint + Prettier; run and fix before reporting complete
- **Build:** `ng build` or `npm run build` -- ensure it passes
- **Tests:** Run affected unit and e2e tests; fix failures before finishing

### Reference Documentation

- **Angular:** https://angular.dev (essentials, best practices, guides), https://angular.dev/context/llms-files/llms-full.txt (LLM-oriented), https://angular.dev/ai/develop-with-ai (custom prompts / system instructions)
- **Angular Material:** https://material.angular.io (component API, theming, version compatibility)
- **Tailwind CSS:** https://tailwindcss.com/docs/installation/framework-guides/angular (Angular setup)
- **CSS:** https://developer.mozilla.org/en-US/docs/Web/CSS/Guides (MDN)

### Quality Checklist

#### Required states (block completion if missing)
- [ ] Loading state on every async data surface
- [ ] Error state on every async data surface
- [ ] Empty state on every list, table, or data grid
- [ ] Button/form disabled + spinner during mutation
- [ ] Success feedback after every mutation

#### Accessibility (block completion if any fail)
- [ ] No `<div (click)>` -- semantic HTML used
- [ ] All interactive elements keyboard accessible
- [ ] Icon-only controls have `aria-label`
- [ ] Form inputs have labels
- [ ] Focus indicators visible (no bare `outline-none`)
- [ ] `alt` text on all `<img>` elements

#### Code quality
- [ ] No `any` on public component props or service APIs
- [ ] Component interfaces defined and exported
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
- Do not guess at migration steps; look up or cite official migration docs.
- Use `impl-nextjs` for Next.js work, `impl-sveltekit` for SvelteKit work, `impl-typescript-frontend` for generic React/Vue work.
- Use `architecture-planning` when design decisions are needed before implementation can begin.
- Use `requirements-clarification` when the spec is vague or has unresolved questions.
