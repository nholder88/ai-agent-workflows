---
name: impl-rust
description: >-
  Implement or refactor Rust backend code from a spec, task, or architecture
  document. Covers Actix, Axum, Rocket, and tokio with full production
  standards inline (tracing structured logging, sqlx connection management,
  health endpoints, tokio-retry, seeding, graceful shutdown, config validation
  with envy).
  USE FOR: Rust spec-to-code, refactoring, production-hardening Rust services,
  Actix/Axum/Rocket web backends.
  DO NOT USE FOR: frontend UI (use impl-nextjs, impl-sveltekit, impl-angular,
  impl-typescript-frontend), other languages (use impl-python,
  impl-typescript-backend, impl-csharp, impl-go, impl-java).
argument-hint: 'Point me at a spec, task, or file and I will implement or refactor it in Rust.'
phase: '4'
phase-family: implementation
---

# Rust Implementation

## When to Use

- A requirement is implementation-ready and the target stack is Rust.
- The project uses Actix Web, Axum, Rocket, or tokio.
- The task is spec-to-code delivery, refactoring, or production-hardening an existing Rust service.

## When Not to Use

- Frontend UI work — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.
- Architecture or planning — use `architecture-planning`.
- Requirements are vague — use `requirements-clarification` first.
- Routing a mixed-scope task — use `implementation-routing`.

## Procedure

1. **Detect framework and structure** — Read `Cargo.toml`, `src/lib.rs`, `src/main.rs`, and dependencies to identify Actix, Axum, Rocket, or tokio.
2. **Read the spec or target** — Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** — Read neighboring modules for naming, error handling, logging, and test conventions before writing code.
4. **Implement or refactor** — Write or modify code following project conventions. Use Result/Option, avoid `unwrap()` in library code, follow ownership idioms. Add `///` doc comments for public items.
5. **Apply production standards** — Enforce every standard in the Standards section below. These are not optional.
6. **Run build, lint, and tests** — Run `cargo build`, `cargo test`, `cargo clippy`, and `cargo fmt`. Fix failures before finishing.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

Every Rust backend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Structured Logging

**Never use `println!` or `eprintln!` in production code.** Use `tracing` with JSON output.

Required fields in every log entry: `timestamp` (ISO 8601 UTC), `level`, `message`, span context. Use `#[tracing::instrument]` on async functions with structured fields.

Error logs must additionally include: error message, error source chain.

**Never log:** passwords, secrets, API keys, PII, auth tokens. Use `%` (Display) for scalars, `?` (Debug) only for safe types.

```rust
// main.rs
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    let fmt_layer = tracing_subscriber::fmt::layer()
        .json()  // JSON in production
        .with_current_span(true)
        .with_span_list(false);

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .init();
}

// Usage — instrument functions, use structured fields
#[tracing::instrument(skip(db), fields(order_id = %dto.id))]
async fn create_order(db: &Pool<Postgres>, dto: CreateOrderDto) -> Result<Order, AppError> {
    tracing::info!(user_id = %dto.user_id, "Creating order");
    // ...
}
```

### 2. Database Connection Management

All database connections must use connection pooling (sqlx), implement retry-on-startup, and release cleanly on shutdown.

- **Pool config:** Always set `min_connections` and `max_connections` explicitly — never rely on defaults. Set acquire timeout (5s) and idle timeout (30s).
- **Startup retry:** Do not crash on first connection failure. Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10. Log each attempt. After max attempts, log fatal and exit code 1.
- **Health verification:** After connecting, run `SELECT 1`. Only mark service ready after verification passes.

```rust
// db/mod.rs
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;
use tracing::{error, info, warn};

pub async fn create_pool_with_retry(database_url: &str) -> PgPool {
    let max_attempts: u32 = 10;
    let base_delay_ms: u64 = 500;

    for attempt in 1..=max_attempts {
        match PgPoolOptions::new()
            .min_connections(std::env::var("DB_POOL_MIN")
                .ok().and_then(|v| v.parse().ok()).unwrap_or(2))
            .max_connections(std::env::var("DB_POOL_MAX")
                .ok().and_then(|v| v.parse().ok()).unwrap_or(10))
            .acquire_timeout(Duration::from_millis(
                std::env::var("DB_CONNECT_TIMEOUT")
                    .ok().and_then(|v| v.parse().ok()).unwrap_or(5000)))
            .idle_timeout(Duration::from_millis(
                std::env::var("DB_IDLE_TIMEOUT")
                    .ok().and_then(|v| v.parse().ok()).unwrap_or(30_000)))
            .connect(database_url)
            .await
        {
            Ok(pool) => {
                // Verify connection
                sqlx::query("SELECT 1").execute(&pool).await
                    .expect("DB ping failed after connect");
                info!("Database pool established");
                return pool;
            }
            Err(e) => {
                if attempt == max_attempts {
                    error!(error = %e, "Database connection failed after max attempts");
                    std::process::exit(1);
                }
                let delay_ms = (base_delay_ms * 2u64.pow(attempt - 1)).min(30_000);
                warn!(attempt, max_attempts, delay_ms, error = %e,
                    "DB connection failed, retrying");
                tokio::time::sleep(Duration::from_millis(delay_ms)).await;
            }
        }
    }
    unreachable!()
}
```

### 3. Health and Readiness Endpoints

Every backend service must expose `/health` (liveness) and `/ready` (readiness). These are not optional.

- `/health` — Returns 200 if the process is running. No dependency checks. Must respond in < 100ms.
- `/ready` — Checks all critical dependencies (DB, cache, required services). Returns 200 only when ALL pass. Returns 503 with failure details when any fail. Should respond in < 500ms.

Register health routes before any auth middleware so they are always accessible.

**Axum:**

```rust
// routes/health.rs
use axum::{extract::State, http::StatusCode, response::Json};
use serde_json::{json, Value};
use std::time::Instant;

pub async fn liveness() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": chrono::Utc::now().to_rfc3339() }))
}

pub async fn readiness(State(pool): State<PgPool>) -> (StatusCode, Json<Value>) {
    let start = Instant::now();
    match sqlx::query("SELECT 1").execute(&pool).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "status": "ready",
                "timestamp": chrono::Utc::now().to_rfc3339(),
                "checks": {
                    "database": { "status": "ok", "latency_ms": start.elapsed().as_millis() }
                }
            })),
        ),
        Err(e) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "not_ready",
                "timestamp": chrono::Utc::now().to_rfc3339(),
                "checks": {
                    "database": { "status": "error", "error": e.to_string() }
                }
            })),
        ),
    }
}

// Register before auth middleware in router:
// Router::new()
//   .route("/health", get(health::liveness))
//   .route("/ready", get(health::readiness))
//   .layer(auth_layer)  // auth after health routes
```

### 4. Retry Logic

Use `tokio-retry` for all retry logic. Do not write custom retry loops.

**Policy:** max 3 attempts, base delay 200ms, backoff factor 2, max delay 10s, jitter enabled. Retry on network errors, 429, 502, 503, 504. Do not retry 400, 401, 403, 404, 422.

```toml
# Cargo.toml
tokio-retry = "0.3"
```

```rust
use tokio_retry::{strategy::{ExponentialBackoff, jitter}, Retry};

let retry_strategy = ExponentialBackoff::from_millis(200)
    .factor(2)
    .max_delay(Duration::from_secs(10))
    .map(jitter)
    .take(3);

let result = Retry::spawn(retry_strategy, || async {
    call_external_api(&client, &url).await
}).await?;
```

Log retries: `warn: "Retry attempt {n}/{max} for {operation} after {delay}ms — {error.message}"`. Log exhaustion: `error: "All {max} retry attempts failed for {operation}"`.

### 5. Database Seeding

Seed scripts must be **idempotent**, **environment-gated**, and **separate from migrations**.

- **Idempotent:** Use upsert / `INSERT ... ON CONFLICT DO NOTHING`. Running twice = same result.
- **Environment-gated:** Only run in development, test, or staging. Never production.
- **Separate:** Migrations change schema. Seeds add data. Different modules and commands.

```rust
// db/seed.rs
use std::env;

pub async fn run_seeds(pool: &PgPool) -> Result<(), sqlx::Error> {
    let allowed_envs = ["development", "test", "staging"];
    let app_env = env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());

    if !allowed_envs.contains(&app_env.as_str()) {
        tracing::warn!(env = %app_env, "Seeding skipped — not allowed in this environment");
        return Ok(());
    }

    seed_reference_data(pool).await?;
    if app_env != "test" {
        seed_demo_data(pool).await?;
    }
    Ok(())
}

async fn seed_demo_data(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Always upsert — never unconditional INSERT
    sqlx::query!(
        "INSERT INTO users (email, name) VALUES ($1, $2)
         ON CONFLICT (email) DO NOTHING",
        "demo@example.com", "Demo User"
    )
    .execute(pool)
    .await?;
    Ok(())
}
```

Seed file structure: `db/migrations/` (schema, all envs), `db/seeds/reference/` (lookup data, all envs), `db/seeds/demo/` (dev/staging only), `db/seeds/test/` (test only).

### 6. Configuration and Secrets

All configuration from environment variables. Secrets never hardcoded or committed. Validate on startup — fail fast with a clear error listing every missing variable.

Use `envy` or a custom `Config` struct with validation:

```rust
// config.rs
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub log_level: Option<String>,
    pub port: Option<u16>,
    pub db_pool_min: Option<u32>,
    pub db_pool_max: Option<u32>,
}

impl Config {
    pub fn from_env() -> Result<Self, envy::Error> {
        let config = envy::from_env::<Config>()?; // returns Err if any required var missing
        if config.jwt_secret.len() < 32 {
            panic!("JWT_SECRET must be at least 32 characters");
        }
        Ok(config)
    }
}

// main.rs — call before anything else
let config = Config::from_env().unwrap_or_else(|e| {
    eprintln!("FATAL: Missing required configuration: {e}");
    std::process::exit(1);
});
```

Variable naming: `<SERVICE>_<COMPONENT>_<SETTING>` (e.g., `DB_HOST`, `REDIS_URL`, `JWT_SECRET`).

### 7. Graceful Shutdown

Handle `SIGTERM` and `SIGINT` (Ctrl+C). Stop accepting connections, drain in-flight requests, close DB pool, exit code 0.

If drain timeout exceeded, log warning and force-exit code 0 (not 1 — intentional shutdown). Do not close DB pool before draining requests. Do not ignore SIGTERM.

```rust
// main.rs (Axum)
use tokio::signal;

async fn shutdown_signal() {
    let ctrl_c = async { signal::ctrl_c().await.expect("failed to install Ctrl+C handler") };
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };
    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    tracing::info!("Shutdown signal received, draining connections");
}

// Attach to Axum server:
axum::serve(listener, app)
    .with_graceful_shutdown(shutdown_signal())
    .await?;

// Pool closes automatically when it drops at end of main
```

### Framework Conventions

| Framework | Detect Via | Project Layout |
|-----------|-----------|----------------|
| Axum | `Cargo.toml` dep `axum`, handler functions with extractors | `src/routes/`, `src/handlers/`, `src/services/` |
| Actix Web | `Cargo.toml` dep `actix-web`, `HttpServer::new` | `src/routes/`, `src/handlers/`, `src/services/` |
| Rocket | `Cargo.toml` dep `rocket`, `#[rocket::main]` | `src/routes/`, `src/handlers/` |
| tokio | `Cargo.toml` dep `tokio`, async runtime | Align with project layout |

### Implementation Patterns

- **Result and Option** — Prefer returning Result/Option over panics in library code. Use `?` for error propagation; map errors with `map_err` or `context` when needed.
- **Ownership and borrowing** — Prefer borrowing when a reference is sufficient; avoid unnecessary clones. Follow existing patterns for owned vs ref.
- **Traits** — Use traits for abstraction and testing (e.g., inject dependencies via trait impls).
- **Async** — Use async/await with tokio (or project runtime). Use `spawn` and channels when the spec requires concurrency.
- **Doc comments** — Add `///` docs for public items; include Examples section for non-trivial APIs.

### Refactor Patterns

- Incremental changes — small, testable steps. Run `cargo test` and `cargo clippy` after each logical change.
- Preserve behavior — do not change observable behavior unless the task asks for it.
- Reduce cloning — prefer references or Cow where it makes sense; avoid unnecessary allocations.
- Error handling — improve error types and context when touching code; use thiserror/anyhow if the project does.

### Tooling

| Tool | Detect Via |
|------|-----------|
| Build | `cargo build` — ensure it compiles |
| Tests | `cargo test` — run for affected crates |
| Lint | `cargo clippy` — fix warnings before finishing |
| Format | `cargo fmt` — apply before finishing |

### Quality Checklist

- [ ] No `println!` or `eprintln!` in `src/` — use `tracing`
- [ ] sqlx pool configured with explicit min/max connections and timeouts
- [ ] Pool creation retries with exponential backoff; exits with code 1 after max attempts
- [ ] `/health` (liveness) and `/ready` (readiness with sqlx ping) both registered
- [ ] External calls use `tokio-retry` with backoff — no hand-rolled retry loops
- [ ] Seed functions environment-gated; all inserts use `ON CONFLICT DO NOTHING` or upsert
- [ ] Config loaded with `envy` or equivalent; panics at startup on missing required vars
- [ ] `with_graceful_shutdown` attached to server; pool drops cleanly on shutdown
- [ ] No hardcoded credentials or secrets in source; no `.unwrap()` on env reads in lib code
- [ ] No unnecessary `unwrap()` or `expect()` in library code; handle or propagate errors
- [ ] Public API has doc comments
- [ ] Code follows project style and Rust idioms
- [ ] Tests, build, and clippy pass

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
