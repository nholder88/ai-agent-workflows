---
name: impl-csharp
description: >-
  Implement or refactor C# / .NET backend code from a spec, task, or
  architecture document. Covers ASP.NET Core, Blazor, Entity Framework Core,
  and MediatR with full production standards inline (Serilog structured logging,
  EF Core connection management, health checks, Polly retry, seeding, graceful
  shutdown, config validation).
  USE FOR: C# spec-to-code, .NET refactoring, production-hardening ASP.NET
  Core services, Blazor, EF Core data access.
  DO NOT USE FOR: frontend UI (use impl-nextjs, impl-sveltekit, impl-angular,
  impl-typescript-frontend), other languages (use impl-python,
  impl-typescript-backend, impl-rust, impl-go, impl-java).
argument-hint: 'Point me at a spec, task, or file and I will implement or refactor it in C# / .NET.'
phase: '4'
phase-family: implementation
---

# C# / .NET Implementation

## When to Use

- A requirement is implementation-ready and the target stack is C# / .NET.
- The project uses ASP.NET Core, Blazor, Entity Framework Core, or MediatR.
- The task is spec-to-code delivery, refactoring, or production-hardening an existing .NET service.

## When Not to Use

- Frontend UI work — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.
- Architecture or planning — use `architecture-planning`.
- Requirements are vague — use `requirements-clarification` first.
- Routing a mixed-scope task — use `implementation-routing`.
- Other languages — use `impl-python`, `impl-typescript-backend`, `impl-rust`, `impl-go`, or `impl-java`.

## Procedure

1. **Detect framework and structure** — Read `*.csproj`, `Solution.sln`, `Program.cs`, and namespaces to identify ASP.NET Core, Blazor, EF Core, MediatR, or similar.
2. **Read the spec or target** — Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** — Read neighboring files for naming, error handling, logging, DI registration, and test conventions before writing code.
4. **Implement or refactor** — Write or modify code following project conventions. Use async/await, dependency injection, and nullable reference types. Add XML docs for public APIs.
5. **Apply production standards** — Enforce every standard in the Standards section below. These are not optional.
6. **Run build and tests** — Run `dotnet build` and `dotnet test`. Fix failures before finishing.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

Every C# backend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Structured Logging with Serilog

**Never use `Console.WriteLine` or `Debug.WriteLine`.** Use Serilog with JSON output in production.

Required fields in every log entry: `timestamp` (ISO 8601 UTC), `level`, `message`, `correlationId` (from request header or generated), `service`, `context` (class name).

Error logs must additionally include: `error.message`, `error.stack`, `error.code`.

**Never log:** passwords, secrets, API keys, PII, auth tokens. Use `{@Dto}` destructuring only on safe objects.

```csharp
// Program.cs
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Is(Enum.Parse<LogEventLevel>(
        builder.Configuration["LOG_LEVEL"] ?? "Information"))
    .Enrich.FromLogContext()
    .Enrich.WithCorrelationId()  // Serilog.Enrichers.CorrelationId
    .WriteTo.Console(new JsonFormatter())
    .CreateLogger();

builder.Host.UseSerilog();

// Usage — inject ILogger<T>, never use Log.Logger directly in services
public class OrderService(ILogger<OrderService> logger)
{
    public async Task<Order> CreateOrderAsync(CreateOrderDto dto)
    {
        logger.LogInformation("Creating order {@OrderId} for user {@UserId}",
            dto.Id, dto.UserId);
        // ...
    }
}
```

### 2. Database Connection Management (EF Core)

All database connections must use connection pooling, implement retry-on-startup, and release cleanly on shutdown.

- **Pool config:** EF Core manages pooling via `AddDbContext` / `AddDbContextPool`. Set explicit command timeout and retry policy.
- **Startup retry:** Do not crash on first connection failure. Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10. Log each attempt. After max attempts, log fatal and exit code 1.
- **Health verification:** After connecting, run `SELECT 1`. Only mark service ready after verification passes.

```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 10,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorCodesToAdd: null);
            npgsqlOptions.CommandTimeout(
                int.Parse(builder.Configuration["DB_STATEMENT_TIMEOUT"] ?? "30"));
        })
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)); // default for read-heavy

// Verify connection on startup with retry
public class DatabaseStartupCheck(AppDbContext db, ILogger<DatabaseStartupCheck> logger)
    : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        for (int attempt = 1; attempt <= 10; attempt++)
        {
            try
            {
                await db.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
                logger.LogInformation("Database connection verified");
                return;
            }
            catch (Exception ex)
            {
                if (attempt == 10) throw;
                var delay = TimeSpan.FromMilliseconds(
                    Math.Min(500 * Math.Pow(2, attempt - 1), 30_000));
                logger.LogWarning(ex,
                    "DB connection attempt {Attempt}/10 failed. Retrying in {Delay}ms",
                    attempt, delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
        }
    }
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

### 3. Health and Readiness Endpoints

Every backend service must expose `/health` (liveness) and `/ready` (readiness). These are not optional.

- `/health` — Returns 200 if the process is running. No dependency checks. Must respond in < 100ms.
- `/ready` — Checks all critical dependencies (DB, cache, required services). Returns 200 only when ALL pass. Returns 503 with failure details when any fail. Should respond in < 500ms.

Register health routes before any auth middleware so they are always accessible.

Use `Microsoft.Extensions.Diagnostics.HealthChecks` and `AspNetCore.HealthChecks.*`.

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddRedis(builder.Configuration["REDIS_URL"] ?? "", "cache"); // if Redis used

app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false, // liveness: no dep checks, always 200 if process alive
    ResponseWriter = WriteMinimalResponse,
});

app.MapHealthChecks("/ready", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse, // full dep status
});

// Register before auth middleware:
app.UseHealthChecks("/health");
app.UseHealthChecks("/ready");
app.UseAuthentication();
app.UseAuthorization();
```

### 4. Retry Logic with Polly

Use Polly via `Microsoft.Extensions.Http.Polly`. Do not write custom retry loops.

**Policy:** max 3 attempts, base delay 200ms, backoff factor 2, max delay 10s, jitter enabled. Retry on network errors, 429, 502, 503, 504. Do not retry 400, 401, 403, 404, 422.

```csharp
// Register HttpClient with Polly policy
builder.Services.AddHttpClient<IPaymentService, PaymentService>()
    .AddPolicyHandler(HttpPolicyExtensions
        .HandleTransientHttpError()  // 5xx, network errors
        .OrResult(r => r.StatusCode == HttpStatusCode.TooManyRequests)
        .WaitAndRetryAsync(
            retryCount: 3,
            sleepDurationProvider: attempt =>
                TimeSpan.FromMilliseconds(200 * Math.Pow(2, attempt - 1))
                + TimeSpan.FromMilliseconds(Random.Shared.Next(0, 100)),
            onRetry: (outcome, delay, attempt, _) =>
                Log.Warning("Retry {Attempt}/3 after {Delay}ms: {Error}",
                    attempt, delay.TotalMilliseconds, outcome.Exception?.Message)));
```

Log retries: `warn: "Retry attempt {n}/{max} for {operation} after {delay}ms — {error.message}"`. Log exhaustion: `error: "All {max} retry attempts failed for {operation}"`.

### 5. Database Seeding

Seed scripts must be **idempotent**, **environment-gated**, and **separate from migrations**.

- **Idempotent:** Use upsert / `AnyAsync` check before insert / `ON CONFLICT DO NOTHING`. Running twice = same result.
- **Environment-gated:** Only run in development, test, or staging. Never production.
- **Separate:** Migrations change schema (`dotnet ef migrations`). Seeds add data. Different directories and commands.

```csharp
// db/Seeds/DataSeeder.cs
public class DataSeeder(AppDbContext db, IHostEnvironment env, ILogger<DataSeeder> logger)
{
    private static readonly HashSet<string> AllowedEnvs =
        ["Development", "Staging", "Test"];

    public async Task SeedAsync()
    {
        if (!AllowedEnvs.Contains(env.EnvironmentName))
        {
            logger.LogWarning("Seeding skipped — not allowed in {Env}", env.EnvironmentName);
            return;
        }
        await SeedReferenceDataAsync();
        if (env.IsDevelopment() || env.EnvironmentName == "Staging")
            await SeedDemoDataAsync();
    }

    private async Task SeedDemoDataAsync()
    {
        // Always upsert — never unconditional add
        if (!await db.Users.AnyAsync(u => u.Email == "demo@example.com"))
        {
            db.Users.Add(new User { Email = "demo@example.com", Name = "Demo User" });
            await db.SaveChangesAsync();
        }
    }
}
```

Seed file structure: `db/Migrations/` (schema, all envs), `db/Seeds/Reference/` (lookup data, all envs), `db/Seeds/Demo/` (dev/staging only), `db/Seeds/Test/` (test only).

### 6. Configuration and Secrets

All configuration from environment variables or `appsettings.json`. Secrets never hardcoded or committed. Validate on startup — fail fast with a clear error listing every missing variable.

Use `IOptions<T>` with `ValidateDataAnnotations` and `ValidateOnStart`:

```csharp
// Configuration/AppSettings.cs
public class AppSettings
{
    public required string DatabaseConnectionString { get; init; }
    public required string JwtSecret { get; init; }
    public string LogLevel { get; init; } = "Information";
}

// Program.cs — validate on startup, fail fast
builder.Services.AddOptions<AppSettings>()
    .Bind(builder.Configuration)
    .ValidateDataAnnotations()
    .ValidateOnStart();  // throw at startup, not first use
```

Variable naming: `<SERVICE>_<COMPONENT>_<SETTING>` (e.g., `DB_HOST`, `REDIS_URL`, `JWT_SECRET`).

### 7. Graceful Shutdown

ASP.NET Core handles `SIGTERM` natively when `UseShutdownTimeout` is configured. Ensure it is set.

Handle `SIGTERM` and `SIGINT`. Stop accepting connections, drain in-flight requests (10s timeout), close DB connections, close cache, exit code 0.

If drain timeout exceeded, log warning and force-exit code 0 (not 1 — intentional shutdown). Do not close DB pool before draining requests. Do not ignore SIGTERM.

```csharp
// Program.cs
builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(10);
});

// IHostedService or IAsyncDisposable for cleanup
public class DatabaseStartupCheck : IHostedService, IAsyncDisposable
{
    public Task StopAsync(CancellationToken cancellationToken)
    {
        // Called on SIGTERM — EF Core disposes DbContext automatically via DI
        return Task.CompletedTask;
    }
    public async ValueTask DisposeAsync() => await db.DisposeAsync();
}
```

### Framework Support

- **Web:** ASP.NET Core (Minimal API, controllers), Blazor Server/WASM.
- **Data:** Entity Framework Core — DbContext, migrations, repositories if used.
- **Patterns:** MediatR (CQRS), FluentValidation — follow existing usage.
- **Detect:** Project SDK (`Microsoft.NET.Sdk.Web`, etc.), `Program.cs`, service registration.

### Context Efficiency Rules

- Keep working context stage-scoped and concise.
- Prefer AC IDs plus short bullets over full copied specs.
- Use artifact pointers (`path/to/spec.md#section`) for deep context.
- Target handoff payload: <= 1200 tokens. Hard cap: <= 1800.

### Implementation Patterns

- **Async/await** — Use for I/O and long-running work. Prefer `ValueTask` where appropriate.
- **Dependency injection** — Register services in DI; inject via constructor. Prefer interfaces for testability.
- **Nullable reference types** — Enable and use; annotate reference types correctly.
- **Error handling** — Use exceptions for exceptional cases; return Result or similar if the project uses it.
- **XML documentation** — Add `<summary>`, `<param>`, `<returns>`, `<exception>` for public APIs.

### Refactor Patterns

- Incremental changes — small, testable steps. Run tests after each logical change.
- Preserve behavior — do not change observable behavior unless the task asks for it.
- Extract and reuse — extract shared logic into services or helpers; reduce duplication.
- Improve nullability — tighten nullable annotations when touching code.

### Project Structure

Infer from the repo. Common layouts:

- **ASP.NET Core:** `Controllers/`, `Services/`, `Models/`, `Data/`, `Program.cs` or `Startup.cs`.
- **Clean/vertical:** Feature folders or vertical slices; follow existing structure.
- **Tests:** Separate test project(s) (e.g. `*.Tests`, `*.IntegrationTests`).

Place new types in the same namespaces and folders; match existing naming (PascalCase for types and methods).

### Tooling

| Tool | Detect Via |
|------|-----------|
| Build | `dotnet build` — ensure solution builds |
| Tests | `dotnet test` — run for affected projects |
| Format/lint | EditorConfig, analyzers — fix style and analyzer issues |

### Quality Checklist

- [ ] No `Console.WriteLine` or `Debug.Print` in `src/` — use ILogger<T>
- [ ] EF Core configured with `EnableRetryOnFailure` and explicit command timeout
- [ ] DB connection verified on startup with retry before accepting traffic
- [ ] `/health` (liveness) and `/ready` (readiness with dep checks) both registered
- [ ] HttpClient dependencies use Polly retry policy — no hand-rolled loops
- [ ] Seed scripts environment-gated; all data operations idempotent
- [ ] `AppSettings` validated at startup with `ValidateOnStart()`
- [ ] `ShutdownTimeout` configured; graceful drain on SIGTERM
- [ ] No hardcoded connection strings or secrets in source
- [ ] Code follows project style and .NET conventions
- [ ] Async I/O uses async/await; no blocking calls in async methods
- [ ] Public API has XML documentation
- [ ] New code covered by or compatible with existing tests
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
