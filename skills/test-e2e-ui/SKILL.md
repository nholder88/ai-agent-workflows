---
name: test-e2e-ui
description: >-
  End-to-end and UI testing with Playwright BDD (Gherkin/Cucumber), visual
  regression via screenshot comparison, and user workflow verification for
  modern web applications.
  USE FOR: end-to-end tests, Playwright BDD scenarios, visual regression
  testing, user flow testing, acceptance tests.
  DO NOT USE FOR: backend unit tests (test-backend-unit), frontend component
  tests (test-frontend-unit).
argument-hint: 'Point me at a component, page, or workflow and I will write Playwright BDD and visual regression tests.'
phase: 5c
phase-family: testing
---

# E2E and UI Testing with Playwright BDD

## When to Use

- Writing end-to-end tests for user workflows and acceptance scenarios.
- Writing Playwright BDD tests with Gherkin `.feature` files.
- Adding visual regression tests with screenshot comparison.
- Verifying user flows across multiple pages.
- Testing responsive layouts at different viewport sizes.
- Testing loading, empty, and error states in full application context.

## When Not to Use

- Backend unit or integration tests — use `test-backend-unit`.
- Frontend component, hook, or store tests — use `test-frontend-unit`.
- Full frontend implementation — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.

## Procedure

1. **Detect framework** — Identify the project's UI framework (via `package.json`, config files, or file structure) and Playwright configuration.
2. **Analyze the target** — Read the component, page, or workflow being tested to understand its behavior, user interactions, and expected outcomes.
3. **Identify test categories** — Determine which are needed:
   - **Functionality tests** — Does the feature work correctly?
   - **Styling/visual tests** — Does it render correctly? Use `toHaveScreenshot()` for visual regression.
   - **User workflow tests** — Can a user complete an end-to-end flow?
4. **Write the tests** — Generate feature files, step definitions, and/or Playwright test files following the patterns below.
5. **Run and verify** — Execute the tests and fix any failures before reporting results.
6. **Produce the output contract** — Write the Test Completion Report (see Output Contract below).

## Standards

### Framework Support

Supports React, Next.js, Angular, SvelteKit, Vue, and similar frameworks. Detect the project's UI framework and adapt test setup, selectors, and project structure accordingly.

### Tech Stack

- **Integration Tests:** Playwright with playwright-bdd (Gherkin/Cucumber BDD syntax)
- **Language:** TypeScript (strict mode)

### Project Structure

Infer the actual structure from the project. A generic layout:

```
tests/
  acceptance/
    features/         # .feature files (Gherkin scenarios)
    stepDefinitions/  # Step definition TypeScript files
```

### BDD Feature Files

Write Gherkin `.feature` files in `tests/acceptance/features/`. Use business-readable language.

```gherkin
Feature: Deck Management

  Scenario: User creates a new deck
    Given a user is logged in
    And they are on the deck management page
    When they click the "New Deck" button
    And they enter the deck name "Burn Deck"
    And they confirm the creation
    Then they should see "Burn Deck" in their deck list

  Scenario: User adds cards to a deck
    Given a user is logged in
    And they have a deck named "Burn Deck"
    When they search for "Lightning Bolt"
    And they add the card to "Burn Deck"
    Then the deck should contain "Lightning Bolt"
    And the deck card count should increase by 1
```

### Step Definitions

Write step definitions in `tests/acceptance/stepDefinitions/`. Import from `playwright-bdd`:

```typescript
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();
```

**Step definition rules:**
- Use `page.getByRole()`, `page.getByText()`, `page.getByTestId()` over CSS selectors when possible.
- Use `await expect(page).toHaveScreenshot()` for visual regression at key UI states.
- Use `page.waitForLoadState()` or `page.waitForSelector()` before assertions on dynamic content.
- Parameterize steps with `{string}`, `{int}` placeholders for reusability.
- Keep steps atomic — one action or assertion per step.
- **Routing/navigation:** Use semantic selectors (`getByRole`, `getByText`) and avoid framework-specific URL assumptions; infer routing from the project structure.

### Playwright Config

The project uses `playwright.config.ts` at the root. When adding new feature files, update the `paths` array in `defineBddConfig` to include them, or use a glob pattern.

### Visual Regression Testing

Use Playwright's built-in screenshot comparison:

```typescript
await expect(page).toHaveScreenshot('descriptive-name.png');
await expect(page.locator('.card-grid')).toHaveScreenshot('card-grid-loaded.png');
```

**Visual test rules:**
- Capture screenshots at meaningful UI states (loaded, empty, error, hover).
- Use descriptive screenshot names that indicate the state being captured.
- Test responsive layouts at common breakpoints if relevant.
- Wait for animations/transitions to complete before capturing.

### Page Object Model

For complex workflows, use page object model to encapsulate page interactions:

```typescript
class DeckPage {
  constructor(private page: Page) {}

  async navigateTo() {
    await this.page.goto('/decks');
    await this.page.waitForLoadState('networkidle');
  }

  async createDeck(name: string) {
    await this.page.getByRole('button', { name: 'New Deck' }).click();
    await this.page.getByLabel('Deck name').fill(name);
    await this.page.getByRole('button', { name: 'Create' }).click();
  }

  async getDeckNames(): Promise<string[]> {
    return this.page.getByTestId('deck-name').allTextContents();
  }
}
```

### Assertion Patterns

- Use Playwright's built-in assertions (`expect(locator).toBeVisible()`, `toHaveText()`, `toHaveCount()`).
- Prefer `toBeVisible()` over `toBeInTheDocument()` for presence checks.
- Use `toHaveScreenshot()` for visual regression — not just functional correctness.
- Assert on user-facing text and roles, not implementation details.

### Test Quality Checklist

For every test suite, verify coverage of:

- [ ] **Happy path** — The expected user flow works
- [ ] **Empty states** — UI handles no data gracefully
- [ ] **Error states** — UI handles API failures, validation errors
- [ ] **Loading states** — Spinners/skeletons appear during async operations
- [ ] **Edge cases** — Boundary values, special characters, long strings
- [ ] **Accessibility** — Interactive elements are keyboard-navigable and have ARIA labels
- [ ] **Visual regression** — Key UI states have screenshot assertions
- [ ] **Responsive** — Layout adapts to different viewport sizes (when applicable)

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

- Detect the UI framework before writing tests. Do not assume Next.js when the project uses SvelteKit or Angular.
- Use semantic selectors (`getByRole`, `getByText`, `getByTestId`) over CSS selectors.
- Do not hard-code framework-specific URLs in step definitions — infer routes from project structure.
- Wait for dynamic content before asserting — use `waitForLoadState()` or `waitForSelector()`.
- Use `test-backend-unit` for backend controller, service, or repository tests.
- Use `test-frontend-unit` for frontend component, hook, or store tests.
