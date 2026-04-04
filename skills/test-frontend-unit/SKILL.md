---
name: test-frontend-unit
description: >-
  Frontend unit and component testing for React, Vue, Svelte, Angular, and
  similar frameworks. Covers component rendering, props, events, hooks,
  composables, stores, utilities, mocking, and snapshot/visual testing.
  USE FOR: component tests, hook tests, store tests, utility tests, client-side
  routing tests, API client mocking.
  DO NOT USE FOR: backend unit tests (test-backend-unit), E2E/UI tests
  (test-e2e-ui), Playwright BDD scenarios (test-e2e-ui).
argument-hint: 'Point me at a component, hook, store, or utility and I will write unit tests.'
phase: 5b
phase-family: testing
---

# Frontend Unit and Component Testing

## When to Use

- Writing unit tests for UI components (render, props, events, slots, conditional rendering).
- Testing hooks, composables, runes, or signals (state transitions, side effects).
- Testing state management (stores, reducers, context, services).
- Testing utility functions (formatters, validators, helpers, type guards).
- Testing client-side routing (route matching, navigation helpers).
- Mocking API clients and fetch wrappers.

## When Not to Use

- Backend controller, service, or repository tests — use `test-backend-unit`.
- End-to-end UI tests or Playwright BDD scenarios — use `test-e2e-ui`.
- Full frontend implementation — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.

## Procedure

1. **Detect framework** — Identify the project's UI framework and test runner from `package.json`, config files, or file structure (Vitest primary, Jest when project uses it).
2. **Analyze the target** — Read the component, hook, store, or utility being tested to understand its inputs, outputs, side effects, and edge cases.
3. **Identify test categories** — Determine which are needed:
   - **Component tests** — Render, props, events, conditional rendering, accessibility.
   - **Hook / composable tests** — State transitions, side effects, cleanup.
   - **Store / state tests** — Actions, mutations, selectors.
   - **Utility tests** — Pure functions, edge cases, boundary values.
4. **Write the tests** — Generate test files following the patterns and standards below.
5. **Run and verify** — Execute the tests and fix any failures before reporting results.
6. **Produce the output contract** — Write the Test Completion Report (see Output Contract below).

## Standards

### Framework Support

Supports React, Next.js, Angular, SvelteKit, Vue, Nuxt, and similar frameworks. Detect the project's UI framework (via `package.json`, config files, or file structure) and adapt imports, render setup, and mocking patterns accordingly.

### Test Runner and Libraries

- **Test runner:** Vitest (primary), Jest (when project uses it)
- **Component testing:** `@testing-library/react`, `@testing-library/angular`, `@testing-library/svelte`, `@testing-library/vue`
- **Mocking:** `vi.mock()` / `jest.mock()`, MSW for API mocking
- **Language:** TypeScript (strict mode)

### Test File Placement

Place co-located test files next to source files with `.test.ts` or `.spec.ts` suffix.

### Component Test Patterns

**Component testing libraries (use the appropriate setup for the detected framework):**

- **React:** `@testing-library/react` with `render()`, `screen`, `fireEvent` / `userEvent`
- **Angular:** `@angular/core/testing` or `@testing-library/angular` with `TestBed`, `fixture`
- **Svelte:** `@testing-library/svelte` with `render()`, `fireEvent`
- **Vue:** `@testing-library/vue` with `render()`, `fireEvent`

**Component test rules:**
- Use `getByRole`, `getByLabelText`, `getByText`, `getByTestId` over CSS selectors.
- Test user interactions (click, type, submit) via `fireEvent` or `userEvent`.
- Assert on emitted events, callbacks, and DOM updates.
- Mock child components or external dependencies when needed.
- Test conditional rendering (loading, empty, error states).

### Hook / Composable Test Patterns

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('should update when action is called', () => {
    const { result } = renderHook(() => useMyHook());
    act(() => {
      result.current.action();
    });
    expect(result.current.value).toBe(updatedValue);
  });
});
```

**Hook test rules:**
- Use `renderHook` from `@testing-library/react` or `@testing-library/vue`.
- Wrap state updates in `act()` when testing React.
- Test cleanup (e.g., effect cleanup on unmount).
- Mock timers, `IntersectionObserver`, `ResizeObserver` when needed.

### Store / State Management Test Patterns

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from './myStore';

describe('myStore', () => {
  beforeEach(() => {
    store.reset();
  });

  it('should add item when action is dispatched', () => {
    store.addItem({ id: '1', name: 'Item' });
    expect(store.items).toHaveLength(1);
  });
});
```

**Store test rules:**
- Reset store state between tests in `beforeEach`.
- Test actions, mutations, and selectors in isolation.
- Mock external dependencies (API, localStorage).

### Mocking Guidance

**API calls:**
- Use `vi.mock()` for module-level mocks.
- Use MSW (Mock Service Worker) for fetch/API mocking when the project uses it.
- Mock return values and error responses.

**Browser APIs:**
- `localStorage`, `sessionStorage` — Mock or use `Object.defineProperty`.
- `IntersectionObserver`, `ResizeObserver` — Mock with `vi.stubGlobal` or polyfill.
- `setTimeout`, `setInterval` — Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`.

**External modules:**
- Mock router, auth, or third-party modules with `vi.mock('module-path')`.

### Test Quality Checklist

For every test suite, verify coverage of:

- [ ] **Happy path** — The expected behavior works with valid inputs
- [ ] **Props / inputs** — All props and inputs are exercised
- [ ] **Events / callbacks** — User interactions trigger correct handlers
- [ ] **Conditional rendering** — Loading, empty, error states render correctly
- [ ] **Edge cases** — Boundary values, empty strings, null, undefined
- [ ] **Accessibility** — Interactive elements have roles and labels

## Output Contract

All skills in the **testing** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Test Completion Report

**Summary**
[What test areas were added or updated.]

**Scope**
- Covered: [modules, behaviors]
- Not covered (and why): [...] or **None**

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/test` | [one line] |

**Verification**
- [test command] — [result]

**Known gaps**
[items] or **None**

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Detect the UI framework and test runner before writing tests. Do not assume React when the project uses Vue or Svelte.
- Follow the project's existing test conventions for file placement, naming, and assertion style.
- Do not modify source components to make them testable unless the task explicitly asks for refactoring.
- Use semantic queries (`getByRole`, `getByLabelText`) over CSS selectors.
- Use `test-backend-unit` for backend controller, service, or repository tests.
- Use `test-e2e-ui` for Playwright BDD, visual regression, or end-to-end workflow tests.
