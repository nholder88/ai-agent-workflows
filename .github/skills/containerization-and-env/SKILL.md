---
name: containerization-and-env
description: 'Analyze a project and create containerization assets. USE FOR: Dockerfiles, Docker Compose, dev containers, .devcontainer, environment variable extraction, dependency identification, multi-stage builds, container deployment prep. DO NOT USE FOR: CI/CD pipeline authoring, Kubernetes manifests, cloud infrastructure provisioning, application code changes.'
argument-hint: 'Point me at a project and I will containerize it and document the environment it needs.'
---

# Containerization And Environment

## When to Use

- A project needs Docker, Compose, or dev container support.
- Runtime dependencies and environment variables need to be extracted systematically.
- Local development or deployment workflows need container-based standardization.

## Procedure

1. Detect languages, runtimes, build tools, and application structure.
2. Scan for environment-variable usage, hardcoded config, infrastructure dependencies, and startup requirements.
3. Identify databases, caches, queues, storage, and auxiliary services.
4. Generate `.dockerignore`, `.env.example`, Dockerfiles, Compose files, and optional `.devcontainer` assets.
5. Use multi-stage builds, pinned images, health checks, non-root users, and named volumes by default.

## Output Expectations

- A documented environment-variable inventory.
- Production-aware container files.
- Development workflow guidance for local startup and build verification.

## Guardrails

- Never hardcode real secrets.
- Never use `latest` tags.
- Include health checks and reasonable startup ordering.
