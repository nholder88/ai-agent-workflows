---
name: impl-python
description: >-
  Implement or refactor Python backend code from a spec, task, or architecture
  document. Covers Django, FastAPI, Flask, and Celery with full production
  standards inline (structured logging, DB connection management, health
  endpoints, retry logic, seeding, graceful shutdown, config validation).
  USE FOR: Python spec-to-code, refactoring, backend feature implementation,
  production-hardening Python services.
  DO NOT USE FOR: frontend UI work (use impl-nextjs, impl-sveltekit,
  impl-angular, or impl-typescript-frontend), routing decisions (use
  implementation-routing), architecture planning (use architecture-planning),
  other languages (use impl-typescript-backend, impl-csharp, impl-rust,
  impl-go, impl-java).
argument-hint: 'Point me at a spec, task, or file and I will implement or refactor it in Python.'
phase: '4'
phase-family: implementation
---

# Python Implementation

## When to Use

- A requirement is implementation-ready and the target stack is Python.
- The project uses Django, FastAPI, Flask, or Celery.
- The task is spec-to-code delivery, refactoring, or production-hardening an existing Python service.

## When Not to Use

- Frontend UI work — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.
- Architecture or planning — use `architecture-planning`.
- Requirements are vague — use `requirements-clarification` first.
- Routing a mixed-scope task — use `implementation-routing`.

## Procedure

1. **Detect framework and structure** — Read `pyproject.toml`, `requirements.txt`, `setup.py`, and folder layout to identify Django, FastAPI, Flask, or Celery.
2. **Read the spec or target** — Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** — Read neighboring modules for naming, error handling, logging, and test conventions before writing code.
4. **Implement or refactor** — Write or modify code following project conventions. Use type hints. Match existing docstring style (Google, NumPy, or Sphinx).
5. **Apply production standards** — Enforce every standard in the Standards section below. These are not optional.
6. **Run build, lint, and tests** — Run pytest (or unittest) and linters (ruff, mypy). Fix failures before finishing.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

Every Python backend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Structured Logging

**Never use `print()` or bare `logging.basicConfig()`.** Use `structlog` or `python-json-logger` for JSON output.

Required fields in every log entry: `timestamp` (ISO 8601 UTC), `level`, `message`, `correlationId` (from request header or generated), `service`, `context` (module/function name).

Error logs must additionally include: `error.message`, `error.stack`, `error.code`.

**Never log:** passwords, secrets, API keys, PII, auth tokens.

```python
# logging_config.py
import structlog
import logging

def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(level=level, format="%(message)s")
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.BoundLogger,
        logger_factory=structlog.PrintLoggerFactory(),
    )

# Usage
log = structlog.get_logger(__name__)
log.info("Order created", order_id=order.id, user_id=user.id)
log.error("Payment failed", error=str(e), order_id=order.id)
```

### 2. Database Connection Management

All database connections must use connection pooling, implement retry-on-startup, and release cleanly on shutdown.

- **Pool config:** Always set `pool_size` and `max_overflow` explicitly — never rely on defaults. Set connection timeout (5s acquire, 30s idle) and statement timeout.
- **Startup retry:** Do not crash on first connection failure. Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10. Log each attempt. After max attempts, log fatal and exit code 1.
- **Health verification:** After connecting, run `SELECT 1`. Only mark service ready after verification passes.

**FastAPI + SQLAlchemy:**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from tenacity import retry, stop_after_attempt, wait_exponential, before_sleep_log
import structlog

log = structlog.get_logger(__name__)

@retry(
    stop=stop_after_attempt(10),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=30),
    before_sleep=before_sleep_log(log, "warning"),
    reraise=True,
)
async def create_engine_with_retry():
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=int(settings.DB_POOL_MAX),
        max_overflow=0,
        pool_timeout=int(settings.DB_CONNECT_TIMEOUT) / 1000,
        pool_recycle=1800,
        connect_args={"command_timeout": int(settings.DB_STATEMENT_TIMEOUT) / 1000},
    )
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    log.info("Database connection established")
    return engine
```

**Django:** Use `CONN_MAX_AGE`, configure `OPTIONS` with pool settings, use `django-health-check` for dependency verification.

### 3. Health and Readiness Endpoints

Every backend service must expose `/health` (liveness) and `/ready` (readiness). These are not optional.

- `/health` — Returns 200 if the process is running. No dependency checks. Must respond in < 100ms.
- `/ready` — Checks all critical dependencies (DB, cache, required services). Returns 200 only when ALL pass. Returns 503 with failure details when any fail. Should respond in < 500ms.

Register health routes before any auth middleware so they are always accessible.

**FastAPI:**

```python
from fastapi import APIRouter, Response, Depends
from datetime import datetime, UTC
import json, time

router = APIRouter(tags=["health"])

@router.get("/health")
async def liveness():
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}

@router.get("/ready")
async def readiness(db: AsyncSession = Depends(get_db)):
    checks = {}
    all_ok = True

    try:
        start = time.monotonic()
        await db.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok", "latency_ms": round((time.monotonic() - start) * 1000)}
    except Exception as e:
        checks["database"] = {"status": "error", "error": str(e)}
        all_ok = False

    status_code = 200 if all_ok else 503
    return Response(
        content=json.dumps({
            "status": "ready" if all_ok else "not_ready",
            "timestamp": datetime.now(UTC).isoformat(),
            "checks": checks,
        }),
        status_code=status_code,
        media_type="application/json",
    )
```

### 4. Retry Logic

Use `tenacity` for all retry logic. Do not write custom retry loops.

**Policy:** max 3 attempts, base delay 200ms, backoff factor 2, max delay 10s, jitter enabled. Retry on network errors, 429, 502, 503, 504. Do not retry 400, 401, 403, 404, 422.

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import httpx

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.2, min=0.2, max=10),
    retry=retry_if_exception_type((httpx.TransportError, httpx.TimeoutException)),
    reraise=True,
)
async def call_external_api(client: httpx.AsyncClient, url: str) -> dict:
    response = await client.get(url, timeout=10.0)
    response.raise_for_status()
    return response.json()
```

Log retries: `warn: "Retry attempt {n}/{max} for {operation} after {delay}ms — {error.message}"`. Log exhaustion: `error: "All {max} retry attempts failed for {operation}"`.

### 5. Database Seeding

Seed scripts must be **idempotent**, **environment-gated**, and **separate from migrations**.

- **Idempotent:** Use upsert / `INSERT ... ON CONFLICT DO NOTHING` / `findOrCreate`. Running twice = same result.
- **Environment-gated:** Only run in development, test, or staging. Never production.
- **Separate:** Migrations change schema (`db:migrate`). Seeds add data (`db:seed`). Different directories and commands.

```python
import os, sys

ALLOWED_ENVS = {"development", "test", "staging"}

async def main():
    env = os.getenv("APP_ENV", "development")
    if env not in ALLOWED_ENVS:
        print(f"Seeding not allowed in environment: {env}", file=sys.stderr)
        sys.exit(0)

    async with AsyncSessionLocal() as session:
        await seed_reference_data(session)
        if env in {"development", "staging"}:
            await seed_demo_data(session)
        await session.commit()

async def seed_demo_data(session: AsyncSession):
    stmt = pg_insert(User).values(email="demo@example.com", name="Demo User")
    stmt = stmt.on_conflict_do_nothing(index_elements=["email"])
    await session.execute(stmt)
```

Seed file structure: `db/migrations/` (schema, all envs), `db/seeds/reference/` (lookup data, all envs), `db/seeds/demo/` (dev/staging only), `db/seeds/test/` (test only).

### 6. Configuration and Secrets

All configuration from environment variables. Secrets never hardcoded or committed. Validate on startup — fail fast with a clear error listing every missing variable.

Use `pydantic-settings`:

```python
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, field_validator

class Settings(BaseSettings):
    APP_ENV: str
    DATABASE_URL: PostgresDsn
    JWT_SECRET: str
    LOG_LEVEL: str = "info"
    DB_POOL_MAX: int = 10
    DB_CONNECT_TIMEOUT: int = 5000
    DB_STATEMENT_TIMEOUT: int = 30000

    @field_validator("JWT_SECRET")
    @classmethod
    def jwt_secret_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    class Config:
        env_file = ".env"

settings = Settings()  # raises ValidationError on startup if any var is missing
```

Variable naming: `<SERVICE>_<COMPONENT>_<SETTING>` (e.g., `DB_HOST`, `REDIS_URL`, `JWT_SECRET`).

### 7. Graceful Shutdown

Handle `SIGTERM` and `SIGINT`. Stop accepting connections, drain in-flight requests (10s timeout), close DB pool, close cache, exit code 0.

If drain timeout exceeded, log warning and force-exit code 0 (not 1 — intentional shutdown). Do not close DB pool before draining requests. Do not ignore SIGTERM.

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_engine.connect_with_retry()
    yield
    await db_engine.dispose()
    log.info("Database pool closed")

app = FastAPI(lifespan=lifespan)
```

### Framework Conventions

| Framework | Detect Via | Project Layout |
|-----------|-----------|----------------|
| Django | `manage.py`, `settings/`, `asgi.py`/`wsgi.py` | `apps/<name>/` with models, views, urls, serializers |
| FastAPI | `main.py` with `FastAPI()`, `routers/` | `app/` or `src/`, `routers/`, `schemas/`, `services/` |
| Flask | `__init__.py` with `Flask()`, blueprints | `app/` or package name, blueprints, `models/`, `services/` |
| Celery | `celery_app/`, `tasks.py` | Align with project layout |

### Implementation Patterns

- **Type hints** — Use for all function parameters and return types. Use `TypedDict`, `Protocol`, or Pydantic models for structured data.
- **Async** — Use `async`/`await` where the project already uses it (FastAPI, async Django views).
- **Data validation** — Pydantic for request/response and config when present; otherwise dataclasses or typed dicts.
- **Error handling** — Use specific exceptions; avoid bare `except`. Follow project conventions for HTTP or domain errors.
- **Context managers** — Use for resources (files, connections). Prefer `with`.

### Refactor Patterns

- Incremental changes — small, testable steps. Run tests after each logical change.
- Preserve behavior — do not change observable behavior unless the task asks for it.
- Extract and reuse — move shared logic into modules or mixins; reduce duplication.
- Add or improve type hints when touching code.

### Tooling

| Tool | Detect Via |
|------|-----------|
| Package manager | `requirements.txt` (pip), `pyproject.toml` (uv/poetry), `setup.py` |
| Lint/format | ruff, black, isort, mypy — run and fix |
| Tests | pytest — run for affected code |
| Virtual env | Use the project's venv or tooling before running commands |

### Quality Checklist

- [ ] No `print()` or bare `logging.basicConfig()` in `src/` — use structlog
- [ ] DB connection uses pooling with explicit pool_size
- [ ] DB connection retries with tenacity on startup
- [ ] `/health` endpoint returns 200 with no dep checks
- [ ] `/ready` endpoint checks all critical deps, returns 503 on failure
- [ ] Retry logic uses tenacity — no hand-rolled retry loops
- [ ] Seed scripts environment-gated; all inserts idempotent (upsert)
- [ ] Config validated with pydantic-settings at startup; fails fast on missing vars
- [ ] Graceful shutdown via lifespan (FastAPI) or signal handlers
- [ ] No hardcoded credentials or secrets in source
- [ ] Type hints on public functions and non-obvious parameters
- [ ] Errors handled with specific exceptions; no bare `except`
- [ ] Code follows project style and existing patterns
- [ ] Tests and lint pass

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

_Use `N/A — [reason]` if no formal AC list exists._

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [one line] |

**Verification**
- [command] — [result: pass/fail/skip]
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
- Use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend` when the task is primarily UI or design-system work.
- Use `architecture-planning` when design decisions are needed before implementation can begin.
- Use `requirements-clarification` when the spec is vague or has unresolved questions.
