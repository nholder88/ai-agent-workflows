---
name: implementation-from-spec
description: 'Implement or refactor code from a spec, task, or architecture document. USE FOR: spec-to-code work across TypeScript backend, Java, C#, Python, Go, Rust; framework detection; build-and-test verification; backend production standards like structured logging, health checks, retry logic, graceful shutdown. DO NOT USE FOR: frontend UI work (use frontend-ui-delivery), routing decisions (use implementation-routing), architecture planning (use architecture-backlog-planning).'
argument-hint: 'Point me at a spec, task, or code area and I will implement or refactor it.'
---

# Implementation From Spec

## When to Use

- A requirement is implementation-ready and the main task is writing or refactoring code.
- The stack could be TypeScript backend, Java, C#, Python, Go, or Rust.
- The task needs framework detection, targeted changes, and verification before completion.

## Procedure

1. Detect stack and framework from manifests and structure.
2. Read the spec, extract acceptance criteria, and identify files in scope.
3. Inspect existing patterns before writing code.
4. Implement in small verifiable steps and preserve behavior unless change is requested.
5. Run build, lint, and tests relevant to the touched area.
6. If the work is backend-facing, enforce production basics: structured logging, config validation, health/readiness, retry policy, graceful shutdown, and safe secret handling.

## Language And Framework Cues

- TypeScript backend: NestJS preferred for new services, then Fastify, then existing Express.
- Java: Spring Boot or Jakarta EE via `pom.xml` or `build.gradle`.
- C#: ASP.NET Core, Blazor, EF Core, MediatR via `*.csproj` and startup files.
- Python: Django, FastAPI, Flask, Celery via `pyproject.toml`, `requirements.txt`, and app layout.
- Go: net/http, Gin, Fiber, Echo, GORM via `go.mod` and imports.
- Rust: Axum, Actix, Rocket, tokio via `Cargo.toml`.

## Completion Gate

- Acceptance criteria in scope are implemented.
- No new lint or type errors introduced.
- Build passes.
- Tests for changed behavior pass or a concrete limitation is surfaced.

## Guardrails

- Use existing conventions and naming.
- Avoid speculative architecture changes during focused implementation.
- Use `frontend-ui-delivery` instead when the task is primarily UI or design-system work.
