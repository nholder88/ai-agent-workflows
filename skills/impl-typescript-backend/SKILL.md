---
name: impl-typescript-backend
description: >-
  Implement or refactor TypeScript/Node.js backend code from a spec, task, or
  architecture document. Covers NestJS (preferred), Fastify, and Express with
  full production standards inline (structured logging with pino, DB connection
  lifecycle, health endpoints, retry logic, seeding, graceful shutdown, config
  validation).
  USE FOR: TypeScript backend spec-to-code, refactoring, production-hardening
  Node.js services, NestJS/Fastify/Express backend work.
  DO NOT USE FOR: frontend UI (use impl-nextjs, impl-sveltekit, impl-angular,
  impl-typescript-frontend), routing decisions (use implementation-routing),
  architecture planning (use architecture-planning), other languages (use
  impl-python, impl-csharp, impl-rust, impl-go, impl-java).
argument-hint: 'Point me at a spec, task, or backend file and I will implement or refactor it with production-grade TypeScript patterns.'
phase: '4'
phase-family: implementation
---

# TypeScript Backend Implementation

## When to Use

- A requirement is implementation-ready and the target stack is TypeScript/Node.js.
- The project uses NestJS, Fastify, or Express.
- The task is spec-to-code delivery, refactoring, or production-hardening an existing Node.js backend service.

## When Not to Use

- Frontend UI work — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.
- Architecture or planning — use `architecture-planning`.
- Requirements are vague — use `requirements-clarification` first.
- Routing a mixed-scope task — use `implementation-routing`.
- Other languages — use `impl-python`, `impl-csharp`, `impl-rust`, `impl-go`, or `impl-java`.

## Procedure

1. **Detect framework and structure** — Read `package.json`, `tsconfig.json`, `nest-cli.json`, and folder layout to identify NestJS, Fastify, or Express.
2. **Read the spec or target** — Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** — Read neighboring modules for naming, error handling, logging, and test conventions before writing code.
4. **Implement or refactor** — Write or modify code following project conventions. Use typed contracts (interfaces/types) and avoid `any`. Match existing code style.
5. **Apply production standards** — Enforce every standard in the Standards section below. These are not optional.
6. **Run build, lint, and tests** — Run `tsc`, ESLint, and test runner (Jest, Vitest, or Mocha). Fix failures before finishing.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

Every TypeScript backend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Structured Logging

**Never use `console.log`, `console.error`, or `console.warn`.** Use `pino` or `nestjs-pino` for JSON output.

Required fields in every log entry: `timestamp` (ISO 8601 UTC), `level`, `message`, `correlationId` (from request header or generated), `service`, `context` (module/function name).

Error logs must additionally include: `error.message`, `error.stack`, `error.code`.

**Never log:** passwords, secrets, API keys, PII, auth tokens.

```typescript
// logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: { service: process.env.SERVICE_NAME ?? 'backend' },
});

// Usage
logger.info({ orderId: order.id, userId: user.id }, 'Order created');
logger.error({ err, orderId: order.id }, 'Payment failed');

// NestJS — app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Database Connection Management

All database connections must use connection pooling, implement retry-on-startup, and release cleanly on shutdown.

- **Pool config:** Always set `max` pool size explicitly — never rely on defaults. Set connection timeout (5s acquire, 30s idle) and statement timeout.
- **Startup retry:** Do not crash on first connection failure. Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10. Log each attempt. After max attempts, log fatal and exit code 1.
- **Health verification:** After connecting, run `SELECT 1`. Only mark service ready after verification passes.

**TypeORM:**

```typescript
import { DataSource } from 'typeorm';
import pino from 'pino';

const logger = pino({ level: 'info' });

export async function createDataSourceWithRetry(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    extra: {
      max: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT ?? '30000', 10),
    },
    synchronize: false,
  });

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await ds.initialize();
      await ds.query('SELECT 1');
      logger.info('Database connection established');
      return ds;
    } catch (err) {
      if (attempt === 10) {
        logger.fatal({ err }, 'All 10 DB connection attempts failed');
        process.exit(1);
      }
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 30_000);
      logger.warn(
        { err, attempt, delay },
        `DB connection attempt ${attempt}/10 failed. Retrying in ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
```

**Prisma:** Use `datasources.db.url` with `connection_limit` and `connect_timeout` in the URL query string. Wrap `$connect()` in a similar retry loop.

### 3. Health and Readiness Endpoints

Every backend service must expose `/health` (liveness) and `/ready` (readiness). These are not optional.

- `/health` — Returns 200 if the process is running. No dependency checks. Must respond in < 100ms.
- `/ready` — Checks all critical dependencies (DB, cache, required services). Returns 200 only when ALL pass. Returns 503 with failure details when any fail. Should respond in < 500ms.

Register health routes before any auth middleware so they are always accessible.

**NestJS:**

```typescript
// health.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### 4. Retry Logic

Use `axios-retry` or a custom wrapper with exponential backoff. Do not write bare retry loops.

**Policy:** max 3 attempts, base delay 200ms, backoff factor 2, max delay 10s, jitter enabled. Retry on network errors, 429, 502, 503, 504. Do not retry 400, 401, 403, 404, 422.

```typescript
import axios from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';

const client = axios.create({ timeout: 10_000 });

axiosRetry(client, {
  retries: 3,
  retryDelay: (retryCount) =>
    exponentialDelay(retryCount) + Math.random() * 100,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429,
  onRetry: (retryCount, error) => {
    logger.warn(
      { attempt: retryCount, error: error.message },
      `Retry ${retryCount}/3 for external call`,
    );
  },
});
```

Log retries: `warn: "Retry attempt {n}/{max} for {operation} after {delay}ms — {error.message}"`. Log exhaustion: `error: "All {max} retry attempts failed for {operation}"`.

### 5. Database Seeding

Seed scripts must be **idempotent**, **environment-gated**, and **separate from migrations**.

- **Idempotent:** Use upsert / `INSERT ... ON CONFLICT DO NOTHING` / `findOrCreate`. Running twice = same result.
- **Environment-gated:** Only run in development, test, or staging. Never production.
- **Separate:** Migrations change schema (`db:migrate`). Seeds add data (`db:seed`). Different directories and commands.

```typescript
// db/seeds/seed.ts
import { DataSource } from 'typeorm';

const ALLOWED_ENVS = new Set(['development', 'test', 'staging']);

export async function seed(ds: DataSource): Promise<void> {
  const env = process.env.NODE_ENV ?? 'development';
  if (!ALLOWED_ENVS.has(env)) {
    console.error(`Seeding not allowed in environment: ${env}`);
    return;
  }

  await ds.query(`
    INSERT INTO "user" (email, name)
    VALUES ('demo@example.com', 'Demo User')
    ON CONFLICT (email) DO NOTHING
  `);

  if (env === 'development' || env === 'staging') {
    await seedDemoData(ds);
  }
}
```

Seed file structure: `db/migrations/` (schema, all envs), `db/seeds/reference/` (lookup data, all envs), `db/seeds/demo/` (dev/staging only), `db/seeds/test/` (test only).

### 6. Configuration and Secrets

All configuration from environment variables. Secrets never hardcoded or committed. Validate on startup — fail fast with a clear error listing every missing variable.

Use `@nestjs/config` with Joi or a custom validation function, or `envalid` / `zod` for non-NestJS projects:

```typescript
// config.ts
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_CONNECT_TIMEOUT: z.coerce.number().int().positive().default(5000),
  DB_STATEMENT_TIMEOUT: z.coerce.number().int().positive().default(30000),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type AppConfig = z.infer<typeof configSchema>;

export const config: AppConfig = configSchema.parse(process.env);
// Throws ZodError on startup if any var is missing or invalid
```

Variable naming: `<SERVICE>_<COMPONENT>_<SETTING>` (e.g., `DB_HOST`, `REDIS_URL`, `JWT_SECRET`).

### 7. Graceful Shutdown

Handle `SIGTERM` and `SIGINT`. Stop accepting connections, drain in-flight requests (10s timeout), close DB pool, close cache, exit code 0.

If drain timeout exceeded, log warning and force-exit code 0 (not 1 — intentional shutdown). Do not close DB pool before draining requests. Do not ignore SIGTERM.

```typescript
// main.ts (NestJS)
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

// main.ts (Fastify / Express)
import { logger } from './logger';

const server = app.listen(port, () => {
  logger.info({ port }, 'Server started');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(async () => {
    await dataSource.destroy();
    logger.info('Database pool closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn('Shutdown timeout exceeded, forcing exit');
    process.exit(0);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Framework Selection

- Default to **NestJS** for new backend services.
- Use **Fastify** only when the project already uses it with a structured plugin/module layout.
- Use **Express** only in existing Express codebases unless the user explicitly confirms new Express.
- If asked to start plain Express for a new service, flag it as an architectural risk and request confirmation.

### Context Efficiency Rules

- Keep working context stage-scoped and concise.
- Prefer AC IDs plus short bullets over full copied specs.
- Use artifact pointers (`path/to/spec.md#section`) for deep context.
- Target handoff payload: <= 1200 tokens. Hard cap: <= 1800.

### Implementation Patterns

- **Typed contracts** — Use interfaces and types for all data shapes. Avoid `any`; use `unknown` when the type is genuinely unknown.
- **Async/await** — Use for all I/O. Never mix callbacks and promises. Handle rejections explicitly.
- **Error handling** — Use specific exception classes; avoid bare `catch` with no rethrow. Follow project conventions for HTTP or domain errors.
- **Dependency injection** — Use NestJS DI or manual constructor injection. Prefer interfaces for testability.
- **No `any`** — Use generics, `unknown`, or specific types. If `any` exists in the codebase, tighten when touching that code.

### Refactor Patterns

- Incremental changes — small, testable steps. Run tests after each logical change.
- Preserve behavior — do not change observable behavior unless the task asks for it.
- Extract and reuse — move shared logic into modules or services; reduce duplication.
- Add or improve type annotations when touching code.

### Tooling

| Tool | Detect Via |
|------|-----------|
| Package manager | `package-lock.json` (npm), `yarn.lock` (yarn), `pnpm-lock.yaml` (pnpm) |
| Lint/format | ESLint, Prettier — run and fix |
| Tests | Jest, Vitest, or Mocha — run for affected code |
| Build | `tsc` or bundler — ensure compilation passes |

### Quality Checklist

- [ ] Framework choice follows policy (NestJS default for new services)
- [ ] No `console.log` / `console.error` / `console.warn` in `src/` — use pino
- [ ] DB connection uses pooling with explicit max pool size
- [ ] DB connection retries with exponential backoff on startup
- [ ] `/health` endpoint returns 200 with no dep checks
- [ ] `/ready` endpoint checks all critical deps, returns 503 on failure
- [ ] Retry logic uses axios-retry or equivalent — no hand-rolled retry loops
- [ ] Seed scripts environment-gated; all inserts idempotent (upsert)
- [ ] Config validated at startup with zod/joi/envalid; fails fast on missing vars
- [ ] Graceful shutdown via `enableShutdownHooks()` (NestJS) or signal handlers
- [ ] No hardcoded credentials or secrets in source
- [ ] No use of `any` — use specific types, generics, or `unknown`
- [ ] Type annotations on public functions and non-obvious parameters
- [ ] Errors handled with specific exceptions; no bare `catch` with no rethrow
- [ ] Code follows project style and existing patterns
- [ ] Build, lint, and tests pass

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
