---
name: test-backend-unit
description: >-
  Backend unit and integration testing for controllers, services, repositories,
  middleware, and server-side logic. Covers test generation, mocking strategies,
  database mocking, external API mocking, and coverage expectations across
  Node.js, Python, C#, Go, and Java.
  USE FOR: backend unit tests, integration tests, API endpoint tests, service
  tests, repository tests, middleware tests.
  DO NOT USE FOR: frontend component tests (test-frontend-unit), E2E/UI tests
  (test-e2e-ui), Playwright BDD scenarios (test-e2e-ui).
argument-hint: 'Point me at a controller, service, or repository and I will write unit tests.'
phase: 5a
phase-family: testing
---

# Backend Unit and Integration Testing

## When to Use

- Writing unit tests for controllers, services, repositories, middleware, or utilities.
- Writing integration tests for API endpoints or data access layers.
- Creating test suites for background jobs, workers, or task processors.
- Reviewing existing backend tests for completeness and correctness.
- Setting up mocking for databases, external APIs, or auth.

## When Not to Use

- Frontend component, hook, or store tests — use `test-frontend-unit`.
- End-to-end UI tests or Playwright BDD scenarios — use `test-e2e-ui`.
- Architecture or planning decisions — use `architecture-planning`.
- Full backend implementation — use `impl-*` skills.

## Procedure

1. **Detect runtime and framework** — Identify the backend stack from project files (`package.json`, `requirements.txt`, `*.csproj`, `go.mod`, `pom.xml`) and the test framework (Vitest, Jest, pytest, xUnit, NUnit, Go `testing`, JUnit 5).
2. **Analyze the target** — Read the controller, service, or module being tested to understand its inputs, outputs, dependencies, and edge cases.
3. **Identify test categories** — Determine which are needed:
   - **Controller / handler tests** — Request handling, status codes, error responses.
   - **Service tests** — Business logic, orchestration, validation.
   - **Repository tests** — Data access, mocking DB or using in-memory DB.
   - **Middleware tests** — Auth, logging, error handling, request transformation.
   - **Validator / DTO tests** — Input validation, schema enforcement.
   - **Utility tests** — Helpers, formatters, parsers.
   - **Background job tests** — Task processing, retries, failure handling.
4. **Write the tests** — Generate test files following the patterns and standards below.
5. **Run and verify** — Execute the tests and fix any failures before reporting results.
6. **Produce the output contract** — Write the Test Completion Report (see Output Contract below).

## Standards

### Framework Support

Supports Express, Fastify, NestJS, Django, FastAPI, Flask, ASP.NET Core, Go net/http / Gin / Fiber, Spring Boot, and similar frameworks. Detect the backend framework and adapt test setup, mocking patterns, and project structure accordingly.

### Test File Placement

- **Node.js:** Co-located `*.test.ts` or `*.spec.ts`, or `__tests__/` directory
- **Python:** `tests/unit/` or co-located `test_*.py`
- **C#:** Separate test project, e.g. `MyApp.Tests/`
- **Go:** Co-located `*_test.go` in same package

### Service / Controller Test Patterns

**Node.js (Vitest):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyService } from './myService';

describe('MyService', () => {
  let service: MyService;
  const mockRepo = {
    findById: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(() => {
    service = new MyService(mockRepo);
    vi.clearAllMocks();
  });

  it('should return entity when found', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1', name: 'Test' });
    const result = await service.getById('1');
    expect(result).toEqual({ id: '1', name: 'Test' });
    expect(mockRepo.findById).toHaveBeenCalledWith('1');
  });
});
```

**Python (pytest):**
```python
import pytest
from unittest.mock import Mock, patch
from app.services.my_service import MyService

def test_get_by_id_returns_entity():
    mock_repo = Mock()
    mock_repo.find_by_id.return_value = {"id": "1", "name": "Test"}
    service = MyService(mock_repo)
    result = service.get_by_id("1")
    assert result == {"id": "1", "name": "Test"}
    mock_repo.find_by_id.assert_called_once_with("1")
```

**Go:**
```go
func TestMyService_GetByID(t *testing.T) {
    mockRepo := &MockRepository{}
    mockRepo.On("FindByID", "1").Return(&Entity{ID: "1", Name: "Test"}, nil)
    svc := NewMyService(mockRepo)
    result, err := svc.GetByID(context.Background(), "1")
    require.NoError(t, err)
    assert.Equal(t, "Test", result.Name)
}
```

### Database Mocking

- **Node.js:** Mock Prisma with `vi.mock('@prisma/client')`, or use repository pattern and mock the repository. For integration tests, use in-memory SQLite or testcontainers.
- **Python:** Use `unittest.mock` for repository mocks. For integration tests, use SQLite in-memory or pytest fixtures with test DB.
- **C#:** Mock `DbContext` or repository interfaces with Moq/NSubstitute. Use in-memory provider for integration tests.
- **Go:** Mock repository interfaces with testify/mock or gomock. Use sqlmock for DB integration tests.

### External API Mocking

- **Node.js:** nock, MSW, or `vi.mock()` for fetch/axios
- **Python:** `responses`, `httpx` mocking, or `unittest.mock.patch`
- **C#:** Mock `HttpClient` with Moq or use WireMock
- **Go:** httptest.Server or mock HTTP client

### Auth / Middleware Test Patterns

- Mock auth tokens, sessions, or user context.
- Test unauthorized (401), forbidden (403), and valid auth flows.
- Test middleware chain order and early-exit behavior.

### Test Quality Checklist

For every test suite, verify coverage of:

- [ ] **Happy path** — The expected behavior works with valid inputs
- [ ] **Error handling** — Exceptions, validation errors, not-found cases
- [ ] **Validation** — Invalid input, missing required fields, boundary values
- [ ] **Auth / authorization** — Unauthorized, forbidden, role-based access
- [ ] **Edge cases** — Empty collections, null, boundary values, special characters
- [ ] **Concurrency / idempotency** — When relevant (e.g., duplicate requests, race conditions)

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

- Detect the runtime and test framework before writing tests. Do not assume Vitest when the project uses pytest or xUnit.
- Follow the project's existing test conventions for file placement, naming, and assertion style.
- Do not modify source code to make it testable unless the task explicitly asks for refactoring.
- Mock at the boundary (database, HTTP, filesystem) — do not mock internal implementation details.
- Use `test-frontend-unit` for frontend component, hook, or store tests.
- Use `test-e2e-ui` for Playwright BDD, visual regression, or end-to-end workflow tests.
