---
name: containerization
description: >-
  Analyze a project and create containerization assets: Dockerfiles, Docker
  Compose, dev containers, .devcontainer config, environment variable extraction,
  multi-stage builds, and deployment configurations.
  USE FOR: Docker setup, Docker Compose, dev containers, environment inventory,
  deployment config.
  DO NOT USE FOR: application code implementation (use impl-* skills),
  architecture planning (use architecture-planning), CI/CD pipeline design.
argument-hint: 'Point me at a project and I will create Docker and deployment configurations.'
phase: 'infra'
phase-family: infrastructure
---

# Containerization

## When to Use

- A project needs to be dockerized or containerized for the first time.
- Docker Compose, dev containers, or `.devcontainer` configs are needed.
- Environment variables need to be extracted from a codebase and documented.
- Deployment configurations are needed for cloud platforms (Azure, AWS, GCP).
- Existing Docker setup needs improvement (multi-stage builds, security, layer caching).

## When Not to Use

- Application code implementation — use the appropriate `impl-*` skill.
- Architecture planning or design decisions — use `architecture-planning`.
- CI/CD pipeline design without containerization — out of scope.

## Procedure

### Analysis Phase (do this first)

1. **Detect runtime and version** — Identify the primary language and framework. Read package manifests (`package.json`, `*.csproj`, `requirements.txt`, `pyproject.toml`, `Pipfile`, `Gemfile`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`). Determine the latest stable/LTS version of the runtime:
   - Node.js: latest LTS version (check `engines` field but target latest LTS).
   - .NET: latest .NET version (check `TargetFramework` but recommend upgrading to latest).
   - Python: latest stable 3.x version.
   - Java: latest LTS version (17, 21, etc.).
   - Go, Ruby, Rust: latest stable version.

2. **Extract environment variables** — Scan the entire codebase for:
   - Direct references: `process.env.*`, `os.environ`, `Environment.GetEnvironmentVariable`, `System.getenv()`.
   - Configuration files: `.env`, `appsettings.json`, `application.yml`, `config/*.js`.
   - Hardcoded values that should be environment variables: database connection strings, API keys, secrets, service URLs, port numbers, feature flags, SMTP config, cloud storage credentials, JWT secrets, third-party credentials, environment identifiers.
   - Create a comprehensive `.env.example` with clear documentation for each variable, grouped by category.

3. **Identify dependencies** — Find ALL infrastructure dependencies:
   - Databases: PostgreSQL, MySQL/MariaDB, MongoDB, SQL Server, SQLite, Redis (as primary store), CockroachDB.
   - Caching: Redis, Memcached, Varnish.
   - Message queues: RabbitMQ, Kafka, AWS SQS, Azure Service Bus.
   - Search engines: Elasticsearch, OpenSearch, Meilisearch.
   - Object storage: MinIO (as S3-compatible local dev), Azure Blob emulator.
   - Other: SMTP servers (MailHog/Mailpit for dev), Nginx/Traefik reverse proxies.

4. **Analyze application architecture** — Determine monolith vs microservices vs monorepo. Detect multiple services needing separate containers. Identify build steps vs runtime steps, static asset compilation, background workers, scheduled jobs, and health check endpoints.

### Generation Phase

Generate files in this order:

1. `.dockerignore`
2. `.env.example` (with comprehensive documentation)
3. `Dockerfile` (production-optimized)
4. `docker-compose.yml` (production)
5. `docker-compose.override.yml` (development overrides)
6. `.devcontainer/devcontainer.json`
7. `.devcontainer/Dockerfile` (dev container specific)
8. `.devcontainer/docker-compose.yml` (dev container orchestration)
9. Cloud deployment files (only when requested)
10. CI/CD pipeline files (only when requested)

## Dockerfile Best Practices

- Use **multi-stage builds** to minimize final image size.
- Use **specific version tags** for base images — never `latest`.
- Use **official images** from Docker Hub.
- Use **slim/alpine** variants where possible and compatible.
- Order instructions for **optimal layer caching** (dependencies before source code).
- Set a **non-root user** for running the application.
- Include proper **HEALTHCHECK** instructions.
- Use **COPY** instead of ADD.
- Minimize the number of layers.
- Include `.dockerignore` to exclude `node_modules`, `.git`, build artifacts, etc.
- Set proper **EXPOSE** directives.
- Use **ENTRYPOINT** with **CMD** appropriately.
- Add **labels** for metadata (`org.opencontainers.image.*`).

## Docker Compose Patterns

Generate `docker-compose.yml` (and `docker-compose.override.yml` for dev) with:

- Proper service definitions for the app and all dependencies.
- **Named volumes** for data persistence (databases, caches).
- **Networks** for service isolation.
- **Depends_on** with health checks for proper startup order.
- Environment variable management via `.env` file references.
- **Resource limits** (memory, CPU) as comments/suggestions.
- Development overrides: volume mounts for hot-reload, debug ports, verbose logging.
- Proper **restart policies**.

## Dev Container Setup

Generate a complete `.devcontainer/` setup:

- `devcontainer.json` with appropriate base image or Dockerfile reference, required VS Code extensions, port forwarding, post-create commands, environment variable references, Docker Compose integration when multiple services are needed.
- `Dockerfile` (dev-specific, with dev tools included).
- `docker-compose.yml` for multi-service dev environments.

## Cloud Deployment Configurations (When Requested)

### Azure
- Azure Container Apps or Azure App Service configuration.
- GitHub Actions for Azure deployment.
- Azure Container Registry (ACR) push configuration.
- Key Vault references for secrets.

### AWS
- ECS Task Definitions or EKS manifests.
- GitHub Actions for ECR/ECS.
- SSM Parameter Store or Secrets Manager for env vars.

### GCP
- Cloud Run or GKE configurations.
- GitHub Actions for GCR/Cloud Run.

### General Cloud
- Kubernetes manifests (Deployment, Service, ConfigMap, Secret, Ingress) when appropriate.
- Helm charts for complex deployments.

## Security Scanning

- Never hardcode secrets in any Docker or compose file — always use environment variables.
- Set a non-root user in production Dockerfiles.
- Use minimal base images to reduce attack surface.
- Pin base image versions for reproducible builds.
- Exclude sensitive files via `.dockerignore`.

## Quality Checklist

Before finishing, verify:

- [ ] All identified environment variables are in `.env.example`
- [ ] All infrastructure dependencies have corresponding Docker Compose services
- [ ] Dockerfile builds successfully in logical steps (no missing COPY sources)
- [ ] Port mappings are consistent across all configuration files
- [ ] Volume mounts do not conflict or expose sensitive data
- [ ] Health checks are configured for all services
- [ ] Dev container configuration includes all necessary extensions and tools
- [ ] Network configuration allows proper inter-service communication
- [ ] `.dockerignore` excludes all unnecessary files
- [ ] No secrets are hardcoded anywhere
- [ ] Non-root user is set in production Dockerfiles
- [ ] Multi-stage builds are used for compiled languages and frontend builds

## Output Contract

All skills in the **infrastructure** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Infrastructure Report

**Summary**
[What was created or configured.]

**Changes**
| Path | Purpose |
|------|---------|
| `Dockerfile` | [one line] |
| `docker-compose.yml` | [one line] |

**Environment variables**
- [List extracted/documented env vars, or reference .env.example]

**Verification**
- [docker build / docker-compose up command] — [result]

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Never hardcode secrets in any Docker or compose file.
- Never use `latest` tags for base images.
- Always create `.env.example`, never `.env` with real values.
- Always verify file paths by reading the project structure before referencing paths in Dockerfiles.
- If unsure about a dependency or configuration, state the assumption clearly and ask for confirmation rather than guessing.
- When the latest runtime version might introduce breaking changes, note this and provide the current version as a commented alternative.
