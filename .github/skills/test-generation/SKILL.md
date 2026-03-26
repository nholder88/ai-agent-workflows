---
name: test-generation
description: 'Generate and verify tests across all layers. USE FOR: backend unit tests for controllers, services, repositories; frontend unit and component tests for components, hooks, stores, utilities; UI end-to-end tests with Playwright BDD; visual regression; acceptance-criteria coverage; test plans, mocking, assertions, edge cases. DO NOT USE FOR: code review (use code-review-gate), test infrastructure setup, CI/CD pipeline configuration.'
argument-hint: 'Point me at the changed code or workflow and I will design and write the right tests.'
---

# Test Generation

## When to Use

- A change affects server-side behavior, data access, UI components, or user workflows.
- Acceptance criteria need explicit test coverage.
- A review found missing tests or weak regression protection.

## Procedure

1. Detect the target layer: backend, frontend unit/component, or UI workflow.
2. Detect runtime and test framework from project files.
3. Read the changed behavior and build a test plan covering happy path, failure paths, and edge cases.
4. Write tests in the repository's established locations and conventions.
5. Run the relevant test commands and fix failures before declaring the test pass complete.

## Coverage Rules

- Backend: request handling, business logic, validation, authorization, data access, retries, and error paths.
- Frontend unit/component: render, props, events, state transitions, accessibility, loading/empty/error states.
- UI end-to-end: primary workflow, failure recovery, and visual regression for critical states when applicable.

## Guardrails

- Match the project's runner and mocking patterns.
- Prefer semantic selectors in UI tests.
- Do not stop at writing tests; run them.
