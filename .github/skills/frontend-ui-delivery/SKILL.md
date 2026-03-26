---
name: frontend-ui-delivery
description: 'Implement or refactor frontend features with design-system compliance. USE FOR: React, Vue, Angular, Next.js, SvelteKit components, pages, routing, forms, loading and error states, accessibility, Tailwind, Skeleton UI, Angular Material, responsive layout, state management, client-side data fetching. DO NOT USE FOR: backend APIs or services (use implementation-from-spec), database queries (use data-query-specialists), UI review without code changes (use ui-ux-review).'
argument-hint: 'Point me at a frontend feature, component, page, or UI flow and I will implement it cleanly.'
---

# Frontend UI Delivery

## When to Use

- The task is primarily client-side UI, state, forms, routing, or data presentation.
- A framework-specific frontend needs consistent patterns rather than ad hoc implementation.
- The code must respect Tailwind, Skeleton UI, Angular Material, or an existing design system.

## Procedure

1. Detect framework and design system from `package.json`, folder layout, and styling files.
2. Route mentally by specialist pattern: Next.js, SvelteKit, and Angular have stronger framework rules than generic React or Vue.
3. Extract component contracts, interaction states, and edge cases from the spec.
4. Implement the UI with semantic HTML, accessible controls, and existing state-management patterns.
5. For every async or interactive surface, handle loading, empty, error, success, and disabled states.
6. Verify responsive behavior, keyboard access, and design-system compliance.

## Framework-Specific Requirements

- Next.js plus Skeleton UI: fetch the latest Skeleton React docs before changing layout or component patterns, prefer App Router and Server Components, and do not mix conflicting Tailwind UI libraries.
- SvelteKit plus Skeleton UI: fetch the latest Skeleton Svelte and SvelteKit docs before changing layout or component patterns, use file-based routing and `load` or action conventions, and keep theme behavior rooted at the app shell.
- Angular: detect Angular and Material versions, use signals and modern control flow where the project supports them, and preserve the migration/material-to-tailwind behaviors called out by the source agent set.
- Generic React, Vue, and Nuxt: follow existing state, routing, and component conventions without importing framework-specific assumptions from other stacks.

## Frontend Defaults

- Prefer server-aware patterns when the framework supports them.
- Avoid hardcoded colors when a token or theme system exists.
- Prefer typed props/contracts and explicit state handling.
- Use framework-native routing and composition patterns rather than custom hacks.

## Guardrails

- Do not mix conflicting UI libraries into Skeleton UI or Material-based stacks.
- Do not leave a blank area instead of an empty state.
- Use `ui-ux-review` and `test-generation` for formal quality and verification passes.
