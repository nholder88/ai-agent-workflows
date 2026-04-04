---
name: impl-java
description: >-
  Implement or refactor Java backend code from a spec, task, or architecture
  document. Covers Spring Boot, Jakarta EE, Maven, and Gradle with full
  production standards inline (SLF4J/Logback structured logging, HikariCP
  connection pooling, Spring Actuator health endpoints, Spring Retry, seeding,
  graceful shutdown, config validation).
  USE FOR: Java spec-to-code, refactoring, production-hardening Spring Boot
  services, Jakarta EE backends, JPA/Spring Data repositories.
  DO NOT USE FOR: frontend UI (use impl-nextjs, impl-sveltekit, impl-angular,
  impl-typescript-frontend), other languages (use impl-python,
  impl-typescript-backend, impl-csharp, impl-rust, impl-go).
argument-hint: 'Point me at a spec, task, or file and I will implement or refactor it in Java.'
phase: '4'
phase-family: implementation
---

# Java Implementation

## When to Use

- A requirement is implementation-ready and the target stack is Java.
- The project uses Spring Boot, Jakarta EE, Maven, or Gradle.
- The task is spec-to-code delivery, refactoring, or production-hardening an existing Java service.

## When Not to Use

- Frontend UI work — use `impl-nextjs`, `impl-sveltekit`, `impl-angular`, or `impl-typescript-frontend`.
- Architecture or planning — use `architecture-planning`.
- Requirements are vague — use `requirements-clarification` first.
- Routing a mixed-scope task — use `implementation-routing`.

## Procedure

1. **Detect framework and structure** — Read `pom.xml`, `build.gradle`, package layout, and annotations to identify Spring Boot, Jakarta EE, or plain Java.
2. **Read the spec or target** — Extract acceptance criteria and implementation steps. If a Stage 3.5 task breakdown exists, follow it checkbox-by-checkbox.
3. **Inspect existing patterns** — Read neighboring classes for naming, error handling, logging, and test conventions before writing code.
4. **Implement or refactor** — Write or modify code following project conventions. Use DI (constructor injection), streams, Optionals, and records where the project uses them. Add Javadoc for public APIs.
5. **Apply production standards** — Enforce every standard in the Standards section below. These are not optional.
6. **Run build, lint, and tests** — Run `mvn verify` or `./gradlew build`. Fix failures before finishing.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

Every Java backend implementation must comply with the following. These are enforced by `code-review` as Critical Issues.

### 1. Structured Logging

**Never use `System.out.println`, `System.err.println`, or `e.printStackTrace()`.** Use SLF4J + Logback with JSON encoder (`logstash-logback-encoder`).

Required fields in every log entry: `timestamp` (ISO 8601 UTC), `level`, `message`, `logger`, `correlationId` (from MDC, set by request filter).

Error logs must additionally include: `stack_trace`, `error_message`.

**Never log:** passwords, secrets, API keys, PII, auth tokens.

```xml
<!-- logback-spring.xml -->
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdcKeyName>correlationId</includeMdcKeyName>
      <includeMdcKeyName>userId</includeMdcKeyName>
      <timeZone>UTC</timeZone>
    </encoder>
  </appender>

  <root level="${LOG_LEVEL:-INFO}">
    <appender-ref ref="JSON" />
  </root>
</configuration>
```

```java
// Usage
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public Order createOrder(CreateOrderDto dto) {
        MDC.put("correlationId", RequestContext.getCorrelationId());
        log.info("Creating order for user={}", dto.getUserId());
        try {
            // ...
        } catch (Exception e) {
            log.error("Order creation failed for orderId={}", dto.getId(), e);
            throw e;
        }
    }
}
```

### 2. Database Connection Management

All database connections must use connection pooling (HikariCP, Spring Boot default), implement retry-on-startup, and release cleanly on shutdown.

- **Pool config:** Always set `maximumPoolSize`, `minimumIdle`, `connectionTimeout`, and `idleTimeout` explicitly — never rely on defaults.
- **Startup retry:** Do not crash on first connection failure. Retry with exponential backoff: base 500ms, factor 2, max 30s, max attempts 10. Log each attempt. After max attempts, log fatal and exit code 1.
- **Health verification:** After connecting, run validation query. Only mark service ready after verification passes.

```yaml
# application.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: ${DB_POOL_MAX:10}
      minimum-idle: ${DB_POOL_MIN:2}
      connection-timeout: ${DB_CONNECT_TIMEOUT:5000}
      idle-timeout: ${DB_IDLE_TIMEOUT:300000}
      max-lifetime: ${DB_MAX_LIFETIME:1800000}
      connection-test-query: SELECT 1
      initialization-fail-timeout: -1  # allow startup retry
```

```java
// config/DatabaseRetryConfig.java
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class DatabaseRetryConfig {
    private static final Logger log = LoggerFactory.getLogger(DatabaseRetryConfig.class);

    @EventListener(ApplicationReadyEvent.class)
    public void verifyDatabaseConnection(DataSource dataSource) {
        int maxAttempts = 10;
        long baseDelay = 500;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try (Connection conn = dataSource.getConnection()) {
                conn.createStatement().execute("SELECT 1");
                log.info("Database connection verified");
                return;
            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    log.error("Database connection failed after {} attempts", maxAttempts, e);
                    System.exit(1);
                }
                long delay = Math.min(baseDelay * (long) Math.pow(2, attempt - 1), 30_000);
                log.warn("DB connection attempt {}/{} failed, retrying in {}ms",
                    attempt, maxAttempts, delay, e);
                try { Thread.sleep(delay); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }
}
```

### 3. Health and Readiness Endpoints

Every backend service must expose health and readiness endpoints. These are not optional.

- **Liveness** (`/actuator/health/liveness`) — Returns 200 if the process is running. No dependency checks. Must respond in < 100ms.
- **Readiness** (`/actuator/health/readiness`) — Checks all critical dependencies (DB, cache, required services). Returns 200 only when ALL pass. Returns 503 with failure details when any fail. Should respond in < 500ms.

Use Spring Boot Actuator with liveness/readiness groups:

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState,db,redis
  health:
    db:
      enabled: true
    redis:
      enabled: true
```

Register health endpoints before security filters:

```java
// config/SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health/**").permitAll()
        .anyRequest().authenticated()
    );
    return http.build();
}
```

### 4. Retry Logic

Use Spring Retry (`@Retryable`) or Resilience4j for all retry logic. Do not write custom retry loops.

**Policy:** max 3 attempts, base delay 200ms, backoff multiplier 2, max delay 10s. Retry on network errors, 429, 502, 503, 504. Do not retry 400, 401, 403, 404, 422.

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
```

```java
// Enable in config
@Configuration
@EnableRetry
public class RetryConfig {}

// Usage
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Recover;

@Service
public class ExternalApiClient {
    private static final Logger log = LoggerFactory.getLogger(ExternalApiClient.class);

    @Retryable(
        retryFor = {RestClientException.class, HttpServerErrorException.class},
        noRetryFor = {HttpClientErrorException.BadRequest.class, HttpClientErrorException.NotFound.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 200, multiplier = 2, maxDelay = 10000)
    )
    public ResponseDto callExternalApi(String url) {
        log.info("Calling external API: {}", url);
        return restTemplate.getForObject(url, ResponseDto.class);
    }

    @Recover
    public ResponseDto recover(RestClientException e, String url) {
        log.error("All retry attempts failed for {}", url, e);
        throw new ServiceUnavailableException("External service unavailable", e);
    }
}
```

Log retries: `warn: "Retry attempt {n}/{max} for {operation} after {delay}ms — {error.message}"`. Log exhaustion: `error: "All {max} retry attempts failed for {operation}"`.

### 5. Database Seeding

Seed scripts must be **idempotent**, **environment-gated**, and **separate from migrations**.

- **Idempotent:** Use upsert / `INSERT ... ON CONFLICT DO NOTHING` / merge. Running twice = same result.
- **Environment-gated:** Only run in development, test, or staging. Never production.
- **Separate:** Migrations change schema (Flyway/Liquibase). Seeds add data (CommandLineRunner). Different directories and commands.

```java
// seed/DataSeeder.java
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Profile({"development", "test", "staging"})
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final JdbcTemplate jdbc;

    public DataSeeder(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        log.info("Running database seeds");
        seedReferenceData();
        String profile = System.getProperty("spring.profiles.active", "development");
        if (!"test".equals(profile)) {
            seedDemoData();
        }
    }

    private void seedDemoData() {
        // Always upsert — never unconditional INSERT
        jdbc.update(
            "INSERT INTO users (email, name) VALUES (?, ?) " +
            "ON CONFLICT (email) DO NOTHING",
            "demo@example.com", "Demo User"
        );
    }

    private void seedReferenceData() {
        // lookup tables, enum data, etc.
    }
}
```

Seed file structure: `src/main/resources/db/migration/` (Flyway, schema, all envs), `src/main/java/.../seed/` (data seeders, profile-gated).

### 6. Configuration and Secrets

All configuration from environment variables or externalized config. Secrets never hardcoded or committed. Validate on startup — fail fast with a clear error listing every missing property.

Use `@ConfigurationProperties` with `@Validated`:

```java
// config/AppProperties.java
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    @NotBlank String databaseUrl,
    @NotBlank @Size(min = 32, message = "JWT secret must be at least 32 characters") String jwtSecret,
    @NotBlank String logLevel,
    @Min(1) int port,
    @Min(1) int dbPoolMax
) {}
```

```yaml
# application.yml
app:
  database-url: ${DATABASE_URL}
  jwt-secret: ${JWT_SECRET}
  log-level: ${LOG_LEVEL:info}
  port: ${PORT:8080}
  db-pool-max: ${DB_POOL_MAX:10}
```

```java
// Enable in main class
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Validation errors cause startup failure automatically
    }
}
```

Variable naming: `<SERVICE>_<COMPONENT>_<SETTING>` (e.g., `DB_HOST`, `REDIS_URL`, `JWT_SECRET`).

### 7. Graceful Shutdown

Spring Boot handles graceful shutdown natively. Configure it and ensure resources close in the correct order.

Stop accepting connections, drain in-flight requests (30s timeout), close DB pool, exit code 0.

```yaml
# application.yml
server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

For custom cleanup (e.g., closing non-Spring resources):

```java
// config/ShutdownConfig.java
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ShutdownConfig {
    private static final Logger log = LoggerFactory.getLogger(ShutdownConfig.class);

    @PreDestroy
    public void onShutdown() {
        log.info("Shutdown signal received, cleaning up resources");
        // Close non-Spring-managed resources here
        // DB pool (HikariCP) is closed automatically by Spring
    }
}
```

Do not close DB pool before draining requests. Do not ignore SIGTERM. Spring handles the signal and drain order automatically when `server.shutdown=graceful` is set.

### Framework Conventions

| Framework | Detect Via | Project Layout |
|-----------|-----------|----------------|
| Spring Boot | `pom.xml`/`build.gradle` with `spring-boot-starter`, `@SpringBootApplication` | `controller/`, `service/`, `repository/`, `model/`, `config/` |
| Jakarta EE | `pom.xml` with `jakarta.` deps, `@Path`, `@Inject` | `resource/`, `service/`, `repository/`, `entity/` |
| Maven | `pom.xml` | `src/main/java`, `src/test/java` |
| Gradle | `build.gradle` or `build.gradle.kts` | `src/main/java`, `src/test/java` |

### Implementation Patterns

- **Dependency injection** — Constructor injection for required dependencies. Use `@Autowired` only if the project already does.
- **Streams and Optionals** — Use for collections and optional values where it improves readability.
- **Records (Java 16+)** — Use for immutable DTOs or value types when the project uses them.
- **Exception handling** — Use specific exceptions; avoid swallowing. Follow project style (checked vs unchecked).
- **Javadoc** — Add for public types and methods: description, `@param`, `@return`, `@throws`.

### Refactor Patterns

- Incremental changes — small, testable steps. Run tests after each logical change.
- Preserve behavior — do not change observable behavior unless the task asks for it.
- Extract and reuse — extract shared logic into services or utilities; reduce duplication.
- Modernize — use records, switch expressions, pattern matching, or improved APIs when refactoring and when consistent with project style.

### Tooling

| Tool | Detect Via |
|------|-----------|
| Build (Maven) | `pom.xml` — `mvn compile`, `mvn verify` |
| Build (Gradle) | `build.gradle` — `./gradlew build` |
| Format/lint | Checkstyle, Spotless, or project config — fix reported issues |
| Tests | `mvn test` or `./gradlew test` — run for affected code |

### Quality Checklist

- [ ] No `System.out.println` or `e.printStackTrace()` in `src/main/` — use SLF4J
- [ ] HikariCP configured with explicit pool size, timeout, and idle settings
- [ ] DB connection verified on startup with retry and exponential backoff
- [ ] `/actuator/health/liveness` and `/actuator/health/readiness` configured and accessible
- [ ] External calls use Spring Retry or Resilience4j — no hand-rolled retry loops
- [ ] Seed data profile-gated (`@Profile`); all inserts idempotent (upsert / ON CONFLICT)
- [ ] Config validated with `@ConfigurationProperties` + `@Validated`; fails fast on missing props
- [ ] Graceful shutdown configured (`server.shutdown=graceful` + timeout)
- [ ] No hardcoded credentials or secrets in source
- [ ] Constructor injection for required dependencies
- [ ] Public types and methods have Javadoc
- [ ] Exceptions handled with specific types; no swallowing
- [ ] Code follows project style and Java conventions
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
