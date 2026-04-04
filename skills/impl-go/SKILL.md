---
name: impl-go
description: >-
  Implement or refactor Go backend code from a spec, task, or architecture
  document. Covers net/http, Gin, Fiber, Echo, and GORM with full production
  standards inline (slog/zerolog structured logging, database/sql connection
  pooling, health endpoints, retry with backoff, seeding, graceful shutdown,
  config validation).
  USE FOR: Go spec-to-code, refactoring, production-hardening Go services,
  Gin/Fiber/Echo web backends, GORM/sqlx data access.
  DO NOT USE FOR: frontend UI (use impl-nextjs, impl-sveltekit, impl-angular,
  impl-typescript-frontend), other languages (use impl-python,
  impl-typescript-backend, impl-csharp, impl-rust, impl-java).
argument-hint: 'Point me at a spec, task, or file and I will implement or refactor it in Go.'
phase: '4'
phase-family: implementation
---

# Go Implementation

## When to Use

- A requirement is implementation-ready and the target stack is Go.
- The project uses net/http, Gin, Fiber, Echo, GORM, or sqlx.
- The task is spec-to-code delivery, refactoring, or production-hardening an existing Go service.

## When Not to Use

- Frontend UI work — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.
- Architecture or planning — use `architecture-planning`.
- Requirements are vague — use `requirements-clarification` first.
- Routing a mixed-scope task — use `implementation-routing`.

## Procedure

1. **Detect framework and structure** — Read `go.mod`, `main.go`, `cmd/` directory, and imports to identify net/http, Gin, Fiber, Echo, GORM, or similar.
2. **Read the spec or target** — Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** — Read neighboring packages for naming, error handling, logging, and test conventions before writing code.
4. **Implement or refactor** — Write or modify code following project conventions. Use interfaces for dependencies, return errors explicitly, pass `context.Context` where appropriate. Add GoDoc comments for exported items.
5. **Apply production standards** — Enforce every standard in the Standards section below. These are not optional.
6. **Run build, lint, and tests** — Run `go build ./...`, `go test ./...`, `golangci-lint run`, and `gofmt`. Fix failures before finishing.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

Every Go backend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Structured Logging

**Never use `fmt.Println`, `fmt.Printf`, or `log.Println` in production code.** Use `slog` (Go 1.21+) or `zerolog` for JSON output.

Required fields in every log entry: `time` (ISO 8601 UTC), `level`, `msg`, `service`, `correlationId` (from request header or generated).

Error logs must additionally include: `error` (message), `stack` (if available).

**Never log:** passwords, secrets, API keys, PII, auth tokens.

```go
// logging/logging.go
package logging

import (
    "log/slog"
    "os"
)

func Init(level string) *slog.Logger {
    var lvl slog.Level
    switch level {
    case "debug":
        lvl = slog.LevelDebug
    case "warn":
        lvl = slog.LevelWarn
    case "error":
        lvl = slog.LevelError
    default:
        lvl = slog.LevelInfo
    }

    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: lvl,
    })
    logger := slog.New(handler)
    slog.SetDefault(logger)
    return logger
}

// Usage
slog.Info("Order created", "order_id", order.ID, "user_id", user.ID)
slog.Error("Payment failed", "error", err, "order_id", order.ID)
```

### 2. Database Connection Management

All database connections must use connection pooling, implement retry-on-startup, and release cleanly on shutdown.

- **Pool config:** Always set `SetMaxOpenConns`, `SetMaxIdleConns`, and `SetConnMaxLifetime` explicitly — never rely on defaults. Set connect timeout (5s) and idle lifetime (5min).
- **Startup retry:** Do not crash on first connection failure. Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10. Log each attempt. After max attempts, log fatal and exit code 1.
- **Health verification:** After connecting, run `db.PingContext(ctx)`. Only mark service ready after verification passes.

```go
// db/db.go
package db

import (
    "context"
    "database/sql"
    "fmt"
    "log/slog"
    "math"
    "os"
    "time"

    _ "github.com/lib/pq"
)

func ConnectWithRetry(ctx context.Context, dsn string) *sql.DB {
    maxAttempts := 10
    baseDelay := 500 * time.Millisecond

    for attempt := 1; attempt <= maxAttempts; attempt++ {
        db, err := sql.Open("postgres", dsn)
        if err == nil {
            db.SetMaxOpenConns(10)
            db.SetMaxIdleConns(5)
            db.SetConnMaxLifetime(5 * time.Minute)

            pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
            defer cancel()
            if err = db.PingContext(pingCtx); err == nil {
                slog.Info("Database connection established")
                return db
            }
            db.Close()
        }

        if attempt == maxAttempts {
            slog.Error("Database connection failed after max attempts", "error", err)
            os.Exit(1)
        }
        delay := time.Duration(float64(baseDelay) * math.Pow(2, float64(attempt-1)))
        if delay > 30*time.Second {
            delay = 30 * time.Second
        }
        slog.Warn("DB connection failed, retrying",
            "attempt", attempt, "max_attempts", maxAttempts,
            "delay_ms", delay.Milliseconds(), "error", err)
        time.Sleep(delay)
    }
    panic("unreachable")
}
```

### 3. Health and Readiness Endpoints

Every backend service must expose `/health` (liveness) and `/ready` (readiness). These are not optional.

- `/health` — Returns 200 if the process is running. No dependency checks. Must respond in < 100ms.
- `/ready` — Checks all critical dependencies (DB, cache, required services). Returns 200 only when ALL pass. Returns 503 with failure details when any fail. Should respond in < 500ms.

Register health routes before any auth middleware so they are always accessible.

```go
// handler/health.go
package handler

import (
    "context"
    "database/sql"
    "encoding/json"
    "net/http"
    "time"
)

func Liveness(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":    "ok",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
    })
}

func Readiness(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        checks := map[string]interface{}{}
        allOK := true

        ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
        defer cancel()

        start := time.Now()
        if err := db.PingContext(ctx); err != nil {
            checks["database"] = map[string]interface{}{"status": "error", "error": err.Error()}
            allOK = false
        } else {
            checks["database"] = map[string]interface{}{
                "status":     "ok",
                "latency_ms": time.Since(start).Milliseconds(),
            }
        }

        status := http.StatusOK
        statusText := "ready"
        if !allOK {
            status = http.StatusServiceUnavailable
            statusText = "not_ready"
        }
        w.WriteHeader(status)
        json.NewEncoder(w).Encode(map[string]interface{}{
            "status":    statusText,
            "timestamp": time.Now().UTC().Format(time.RFC3339),
            "checks":    checks,
        })
    }
}

// Register in main:
// mux.HandleFunc("/health", handler.Liveness)
// mux.HandleFunc("/ready", handler.Readiness(db))
```

### 4. Retry Logic

Use `cenkalti/backoff/v4` for all retry logic. Do not write custom retry loops.

**Policy:** max 3 attempts, base delay 200ms, backoff factor 2, max delay 10s, randomization factor 0.5. Retry on network errors, 429, 502, 503, 504. Do not retry 400, 401, 403, 404, 422.

```go
// retry/retry.go
package retry

import (
    "context"
    "fmt"
    "log/slog"
    "time"

    "github.com/cenkalti/backoff/v4"
)

func WithBackoff(ctx context.Context, operation string, fn func() error) error {
    b := backoff.NewExponentialBackOff()
    b.InitialInterval = 200 * time.Millisecond
    b.Multiplier = 2
    b.MaxInterval = 10 * time.Second
    b.MaxElapsedTime = 30 * time.Second

    attempt := 0
    err := backoff.Retry(func() error {
        attempt++
        if err := fn(); err != nil {
            slog.Warn(fmt.Sprintf("Retry attempt %d for %s", attempt, operation), "error", err)
            return err
        }
        return nil
    }, backoff.WithContext(b, ctx))

    if err != nil {
        slog.Error(fmt.Sprintf("All retry attempts failed for %s", operation), "error", err)
    }
    return err
}
```

Log retries: `warn: "Retry attempt {n} for {operation} — {error}"`. Log exhaustion: `error: "All retry attempts failed for {operation}"`.

### 5. Database Seeding

Seed scripts must be **idempotent**, **environment-gated**, and **separate from migrations**.

- **Idempotent:** Use upsert / `INSERT ... ON CONFLICT DO NOTHING`. Running twice = same result.
- **Environment-gated:** Only run in development, test, or staging. Never production.
- **Separate:** Migrations change schema. Seeds add data. Different packages and commands.

```go
// db/seed.go
package db

import (
    "context"
    "database/sql"
    "log/slog"
    "os"
)

var allowedEnvs = map[string]bool{
    "development": true,
    "test":        true,
    "staging":     true,
}

func RunSeeds(ctx context.Context, db *sql.DB) error {
    appEnv := os.Getenv("APP_ENV")
    if appEnv == "" {
        appEnv = "development"
    }
    if !allowedEnvs[appEnv] {
        slog.Warn("Seeding skipped — not allowed in this environment", "env", appEnv)
        return nil
    }

    if err := seedReferenceData(ctx, db); err != nil {
        return err
    }
    if appEnv != "test" {
        if err := seedDemoData(ctx, db); err != nil {
            return err
        }
    }
    return nil
}

func seedDemoData(ctx context.Context, db *sql.DB) error {
    // Always upsert — never unconditional INSERT
    _, err := db.ExecContext(ctx,
        `INSERT INTO users (email, name) VALUES ($1, $2)
         ON CONFLICT (email) DO NOTHING`,
        "demo@example.com", "Demo User",
    )
    return err
}
```

Seed file structure: `db/migrations/` (schema, all envs), `db/seeds/reference/` (lookup data, all envs), `db/seeds/demo/` (dev/staging only), `db/seeds/test/` (test only).

### 6. Configuration and Secrets

All configuration from environment variables. Secrets never hardcoded or committed. Validate on startup — fail fast with a clear error listing every missing variable.

Use `envconfig`, `viper`, or custom struct parsing:

```go
// config/config.go
package config

import (
    "fmt"
    "log/slog"
    "os"
    "strconv"
    "strings"
)

type Config struct {
    DatabaseURL string
    JWTSecret   string
    LogLevel    string
    Port        int
    DBPoolMax   int
}

func Load() *Config {
    var missing []string

    get := func(key string) string {
        v := os.Getenv(key)
        if v == "" {
            missing = append(missing, key)
        }
        return v
    }
    getDefault := func(key, def string) string {
        if v := os.Getenv(key); v != "" {
            return v
        }
        return def
    }
    getIntDefault := func(key string, def int) int {
        if v := os.Getenv(key); v != "" {
            if n, err := strconv.Atoi(v); err == nil {
                return n
            }
        }
        return def
    }

    cfg := &Config{
        DatabaseURL: get("DATABASE_URL"),
        JWTSecret:   get("JWT_SECRET"),
        LogLevel:    getDefault("LOG_LEVEL", "info"),
        Port:        getIntDefault("PORT", 8080),
        DBPoolMax:   getIntDefault("DB_POOL_MAX", 10),
    }

    if len(missing) > 0 {
        slog.Error("Missing required configuration", "vars", strings.Join(missing, ", "))
        os.Exit(1)
    }
    if len(cfg.JWTSecret) < 32 {
        fmt.Fprintln(os.Stderr, "FATAL: JWT_SECRET must be at least 32 characters")
        os.Exit(1)
    }
    return cfg
}
```

Variable naming: `<SERVICE>_<COMPONENT>_<SETTING>` (e.g., `DB_HOST`, `REDIS_URL`, `JWT_SECRET`).

### 7. Graceful Shutdown

Handle `SIGTERM` and `SIGINT`. Stop accepting connections, drain in-flight requests (10s timeout), close DB pool, close cache, exit code 0.

If drain timeout exceeded, log warning and force-exit code 0 (not 1 — intentional shutdown). Do not close DB pool before draining requests. Do not ignore SIGTERM.

```go
// main.go
package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    // ... setup ...

    srv := &http.Server{Addr: ":8080", Handler: mux}

    // Start server in goroutine
    go func() {
        slog.Info("Server starting", "addr", srv.Addr)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            slog.Error("Server failed", "error", err)
            os.Exit(1)
        }
    }()

    // Wait for shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    sig := <-quit
    slog.Info("Shutdown signal received", "signal", sig)

    // Drain with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := srv.Shutdown(ctx); err != nil {
        slog.Warn("Server forced to shutdown", "error", err)
    }

    // Close DB after draining
    db.Close()
    slog.Info("Database pool closed, exiting")
}
```

### Framework Conventions

| Framework | Detect Via | Project Layout |
|-----------|-----------|----------------|
| net/http | `http.HandleFunc`, `http.ListenAndServe` | `cmd/<app>/main.go`, `internal/handler/`, `internal/service/` |
| Gin | `go.mod` dep `github.com/gin-gonic/gin`, `gin.Default()` | `cmd/<app>/`, `internal/handler/`, `internal/service/` |
| Fiber | `go.mod` dep `github.com/gofiber/fiber`, `fiber.New()` | `cmd/<app>/`, `internal/handler/`, `internal/service/` |
| Echo | `go.mod` dep `github.com/labstack/echo`, `echo.New()` | `cmd/<app>/`, `internal/handler/`, `internal/service/` |
| GORM | `go.mod` dep `gorm.io/gorm`, `gorm.Open` | `internal/repository/`, `internal/model/` |

### Implementation Patterns

- **Interfaces** — Define small interfaces for dependencies; accept interfaces, return concrete types where appropriate.
- **Errors** — Return errors; use `errors.Is`/`errors.As` for checks. Wrap with context (e.g., `fmt.Errorf("...: %w", err)`).
- **Context** — Pass `context.Context` as first parameter for request-scoped and cancellable operations.
- **Goroutines** — Use when the spec requires concurrency; prefer `errgroup` for structured concurrency.
- **No panics in library code** — Panic only in main or init when unrecoverable.

### Refactor Patterns

- Incremental changes — small, testable steps. Run tests after each logical change.
- Preserve behavior — do not change observable behavior unless the task asks for it.
- Interfaces — introduce or use interfaces to decouple; keep interfaces small.
- Error handling — improve error wrapping and handling when touching code.

### Tooling

| Tool | Detect Via |
|------|-----------|
| Modules | `go mod tidy` after adding imports |
| Lint | `golangci-lint run` or `staticcheck` — run and fix |
| Format | `gofmt` or `goimports` — apply before finishing |
| Tests | `go test ./...` — run for affected packages |

### Quality Checklist

- [ ] No `fmt.Println` or `log.Println` in `internal/` or `pkg/` — use `slog` or `zerolog`
- [ ] DB connection uses pooling with explicit `SetMaxOpenConns`/`SetMaxIdleConns`/`SetConnMaxLifetime`
- [ ] DB connection retries with exponential backoff on startup; exits code 1 after max attempts
- [ ] `/health` (liveness) and `/ready` (readiness with DB ping) both registered
- [ ] External calls use `cenkalti/backoff` with backoff — no hand-rolled retry loops
- [ ] Seed functions environment-gated; all inserts use `ON CONFLICT DO NOTHING` or upsert
- [ ] Config loaded and validated at startup; fails fast on missing required vars
- [ ] Graceful shutdown with `os/signal` and `http.Server.Shutdown`; DB closed after drain
- [ ] No hardcoded credentials or secrets in source
- [ ] Interfaces used for dependencies; small and focused
- [ ] Errors returned and handled; no silent ignores unless documented
- [ ] Context passed where appropriate (HTTP, DB, timeouts)
- [ ] Exported types and functions have GoDoc comments
- [ ] Code follows project style and Go idioms
- [ ] Build and tests pass

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
