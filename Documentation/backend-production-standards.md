# Backend Production Standards

This document defines the mandatory patterns that every backend implementation must follow, regardless of language or framework. These are enforced as quality gates by `code-review-sentinel` and `backend-unit-test-specialist`.

---

## 1. Structured Logging

**Rule:** Every backend service must use structured (JSON) logging. No `console.log`, `print()`, `Console.WriteLine()`, or equivalent raw output in production code paths.

### What structured logging must include

Every log entry must carry:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 UTC |
| `level` | `debug` / `info` / `warn` / `error` |
| `message` | Human-readable summary |
| `correlationId` | Request-scoped trace ID (from header or generated) |
| `service` | Service name |
| `context` | Module / class / function name |

Error logs must additionally include:
- `error.message`
- `error.stack`
- `error.code` (if applicable)

**Never log:** passwords, secrets, API keys, PII (email, SSN, card numbers), auth tokens.

### Framework defaults

| Language | Preferred library |
|----------|-------------------|
| TypeScript / Node.js | `pino` (NestJS via `nestjs-pino`) |
| Python | `structlog` or `python-json-logger` |
| C# / .NET | `Serilog` with JSON sink |
| Rust | `tracing` with `tracing-subscriber` JSON format |

---

## 2. Database Connection Management

**Rule:** All database connections must use connection pooling, implement retry-on-startup, and release cleanly on shutdown.

### Required behaviors

**Connection pooling:**
- Always configure min/max pool size explicitly — never rely on defaults
- Set connection timeout (recommended: 5s acquire, 30s idle)
- Set statement timeout to prevent runaway queries

**Startup retry:**
- Do not crash on first connection failure at startup
- Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10
- Log each attempt with attempt number and next retry delay
- After max attempts, log a fatal error and exit with code 1

**Graceful shutdown:**
- On `SIGTERM` / `SIGINT`, stop accepting new requests, drain in-flight requests, then close the pool
- Set a drain timeout (recommended: 10s) — force-close after timeout

**Health verification:**
- After connecting, run a lightweight verification query (`SELECT 1`, `db.command({ ping: 1 })`, etc.)
- Only mark the service ready after verification passes

### Environment variables (required for every backend)

```
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
DB_POOL_MIN        # default: 2
DB_POOL_MAX        # default: 10
DB_CONNECT_TIMEOUT # default: 5000 (ms)
DB_IDLE_TIMEOUT    # default: 30000 (ms)
DB_STATEMENT_TIMEOUT # default: 30000 (ms)
```

---

## 3. Retry Logic

**Rule:** All calls to external services (databases, caches, third-party APIs, message queues) must be wrapped in retry logic for transient failures.

### Retry policy

```
maxAttempts:     3  (configurable per call site)
baseDelayMs:     200
backoffFactor:   2
maxDelayMs:      10000
jitter:          true  (add ±20% randomness to prevent thundering herd)
retryOn:         network errors, 429, 502, 503, 504, connection reset
doNotRetryOn:    400, 401, 403, 404, 422 (client errors — retrying won't help)
```

### What to log on retry

```
warn: "Retry attempt {n}/{max} for {operation} after {delay}ms — {error.message}"
error: "All {max} retry attempts failed for {operation} — {error.message}"
```

### Circuit breaker (for high-traffic paths)

For calls made on every request (DB queries, cache reads), add a circuit breaker:
- **Closed** (normal): pass all requests through
- **Open** (tripped): fail fast for 30s after 5 consecutive failures
- **Half-open**: allow one probe request; close if it succeeds

---

## 4. Health & Readiness Endpoints

**Rule:** Every backend service must expose `/health` (liveness) and `/ready` (readiness) endpoints. These are not optional.

### `/health` — liveness probe

- **Purpose:** Tells the orchestrator (Kubernetes, Docker, load balancer) "the process is alive and not deadlocked"
- **Response time:** Must respond in < 100ms
- **Logic:** Return 200 if the process is running. No dependency checks.
- **Response:**
  ```json
  { "status": "ok", "timestamp": "2024-01-01T00:00:00Z" }
  ```

### `/ready` — readiness probe

- **Purpose:** Tells the orchestrator "this instance can accept traffic"
- **Response time:** Should respond in < 500ms
- **Logic:** Check all critical dependencies. Return 200 only when ALL pass.
- **Dependencies to check:** Database (ping), Redis/cache (ping), any required external services
- **Response (healthy):**
  ```json
  {
    "status": "ready",
    "timestamp": "2024-01-01T00:00:00Z",
    "checks": {
      "database": { "status": "ok", "latencyMs": 4 },
      "cache": { "status": "ok", "latencyMs": 1 }
    }
  }
  ```
- **Response (unhealthy — HTTP 503):**
  ```json
  {
    "status": "not_ready",
    "timestamp": "2024-01-01T00:00:00Z",
    "checks": {
      "database": { "status": "error", "error": "Connection timeout" },
      "cache": { "status": "ok", "latencyMs": 1 }
    }
  }
  ```

### Startup sequencing

```
1. Application starts
2. DB connection pool established (with retry)
3. Cache connection established (with retry)
4. /health starts returning 200
5. Dependency checks pass → /ready starts returning 200
6. Load balancer/orchestrator begins routing traffic
```

Do not serve application traffic before `/ready` returns 200.

---

## 5. Database Seeding

**Rule:** Seed scripts must be idempotent, environment-gated, and separate from migrations.

### Requirements

**Idempotent:** Running a seed script twice must produce the same result as running it once. Use upsert, `INSERT ... ON CONFLICT DO NOTHING`, `findOrCreate`, or equivalent.

**Environment-gated:** Seed scripts that create test/demo data must check the environment before running. They must never run against a production database.

```typescript
// ❌ NEVER — unconditional seed
await seedDemoUsers();

// ✅ ALWAYS — environment-gated
if (!['development', 'test', 'staging'].includes(process.env.NODE_ENV ?? '')) {
  logger.warn('Seed script skipped — not running in development/test/staging');
  process.exit(0);
}
await seedDemoUsers();
```

**Separate from migrations:** Migrations change schema. Seeds add reference/test data. Keep them in separate directories and commands:
- Migrations: `db:migrate` — runs in all environments
- Seeds: `db:seed` — runs only in dev/test/staging, never in prod

**Required seed categories:**
- `reference-data` — Lookup tables, enums, roles, permissions (safe for all environments)
- `demo-data` — Sample users, sample records (dev/staging only, never prod)
- `test-fixtures` — Data for test runs (test environment only)

### Seed file structure

```
db/
  migrations/     # Schema changes — run in all envs
  seeds/
    reference/    # Reference data — safe everywhere
    demo/         # Demo data — dev/staging only
    test/         # Test fixtures — test env only
```

---

## 6. Graceful Shutdown

**Rule:** Every backend service must handle `SIGTERM` and `SIGINT` and shut down cleanly.

### Shutdown sequence

```
1. Receive SIGTERM / SIGINT
2. Stop accepting new connections / mark as not ready
3. Wait for in-flight requests to complete (drain timeout: 10s)
4. Close database connection pool
5. Close cache connections
6. Close any open file handles or streams
7. Exit with code 0
```

If drain timeout is exceeded, log a warning and force-exit with code 0 (not 1 — the process is shutting down intentionally).

### What NOT to do

- Do not call `process.exit(1)` on SIGTERM — that signals a crash
- Do not close the DB pool before draining in-flight requests
- Do not ignore SIGTERM (default behavior in some runtimes is to ignore it)

---

## 7. Configuration & Secrets

**Rule:** All configuration must come from environment variables. Secrets must never be hardcoded or committed.

### Required validation

On startup, validate that all required environment variables are present and have valid types/formats. Fail fast with a clear error if any are missing:

```
FATAL: Missing required environment variables:
  - DB_PASSWORD (required)
  - JWT_SECRET (required, min length 32)
  - REDIS_URL (required, must be valid URL)
Service cannot start without these values.
```

Do not start the service with missing required config. This prevents silent failures where defaults are used instead of the real values.

### Variable naming convention

```
<SERVICE>_<COMPONENT>_<SETTING>

Examples:
  DB_HOST, DB_PORT, DB_NAME
  REDIS_URL, REDIS_TTL_SECONDS
  JWT_SECRET, JWT_EXPIRES_IN
  LOG_LEVEL, LOG_FORMAT
  PORT, NODE_ENV
```

---

## Quality Gate Checklist (applies to all backends)

The `code-review-sentinel` must flag the following as **Critical Issues** (`🔴`):

- [ ] Any `console.log` / `print` / raw output in production code (not test code)
- [ ] Database client instantiated without connection pooling
- [ ] No retry logic on DB or external service connection at startup
- [ ] No `/health` endpoint
- [ ] No `/ready` endpoint with dependency checks
- [ ] Seed scripts that do not check environment before running
- [ ] Missing `SIGTERM` / `SIGINT` handler
- [ ] Required env vars not validated at startup
- [ ] Hardcoded credentials, secrets, or connection strings anywhere in source

The following are **Recommendations** (`🟡`):

- [ ] No circuit breaker on high-traffic external calls
- [ ] Log entries missing `correlationId`
- [ ] Pool min/max not explicitly configured (relying on defaults)
- [ ] Drain timeout not set (shutdown may cut in-flight requests)
