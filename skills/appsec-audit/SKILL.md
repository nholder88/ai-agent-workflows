---
name: appsec-audit
description: >-
  Application security audit combining static analysis, STRIDE threat modeling,
  OWASP-aware code review, container/deployment review, and vulnerability
  intelligence from authoritative sources.
  USE FOR: security audit after implementation, threat modeling, OWASP
  compliance check, CVE intelligence gathering.
  DO NOT USE FOR: code quality review (use code-review), UI/UX review (use
  ui-ux-review), implementation (use impl-* skills).
argument-hint: 'Point me at code or infrastructure and I will audit it for security vulnerabilities.'
phase: '7a'
phase-family: security
---

# Application Security Audit

## When to Use

- A security audit is needed after implementation or before release.
- Threat modeling is required for new or changed architecture.
- OWASP compliance or CVE intelligence gathering is needed.
- Container, deployment, or supply-chain security review is requested.

## When Not to Use

- Code quality review (correctness, readability, conciseness) -- use `code-review`.
- UI/UX design quality review -- use `ui-ux-review`.
- Implementation work -- use the appropriate `impl-*` skill.

## Scope and Boundaries

**In scope:** Tech stack inventory; authn/z and session handling; input validation and injection; secrets and crypto usage; SSRF, path traversal, and unsafe deserialization patterns; dependency and supply-chain surface (versions from lockfiles, known-issue research with URLs); Dockerfile, Compose, and image practices; Vercel-oriented static review (`vercel.json`, middleware, server vs edge, env exposure patterns); CI/CD secret patterns where files exist; safe verification suggestions (e.g., header checks in staging).

**Out of scope unless the user explicitly authorizes a bounded, safe activity:** Live exploitation against production; port scanning; credential stuffing; any action that could harm systems or data.

**Not claimed:** Parity with hosted scanning products. Always recommend running deterministic tools in CI (`npm audit` / `pnpm audit`, OSV, `trivy`, `grype`, `hadolint`, `syft`, OWASP Dependency-Check) and ingesting their output.

## Relationship to code-review

| Skill | Role |
|-------|------|
| `code-review` | Completeness, correctness, conciseness, readability; flags obvious security issues under Correctness. |
| `appsec-audit` (this skill) | Severity-tagged security findings, deployment and supply-chain angles, cited CVE/advisory intel, persisted report. |

When both run on the same change set, deduplicate: if an issue appears in both, note in the report: "Also referenced in code-review (section ...)" when known.

## Procedure

### Phase 1 -- Discover Stack and Documentation

- Read manifests: `package.json`, lockfiles, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `*.csproj`, `pom.xml`, etc.
- Note containers: `Dockerfile*`, `docker-compose*.yml`, `Containerfile*`.
- Note deployment: `vercel.json`, Kubernetes manifests, Terraform/OpenTofu, GitHub Actions / other CI under `.github/workflows` or similar.
- Reuse existing docs when present: `README.md`, `docs/**`, `**/architecture*.md`, `**/adr*.md`, `CLAUDE.md`. Summarize or link -- do not duplicate long prose unnecessarily.

### Phase 2 -- Audit

Review systematically:

1. **Application code** -- Authentication/authorization gaps, insecure defaults, injection (SQL, NoSQL, command, LDAP, XSS), unsafe file/path handling, weak crypto, hardcoded secrets, logging of sensitive data, CORS misconfiguration, CSRF where relevant.
2. **STRIDE threat modeling** -- For each component or trust boundary, evaluate: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
3. **OWASP Top 10 awareness** -- Map findings to relevant OWASP Top 10 categories (Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, SSRF).
4. **Containers** -- Base image choices, `USER` directive, minimizing attack surface, secrets in layers, healthchecks, read-only filesystems where applicable.
5. **Deployment** -- Env var handling, secrets in repo, TLS/ingress assumptions, Vercel middleware and runtime boundaries.

### Phase 3 -- External Intelligence

Use web search / fetch to find recent relevant advisories for the specific versions identified. Rules:

- **Every CVE ID or serious claim** must have a markdown link to NVD, GitHub Advisory, vendor bulletin, CWE, or OWASP cheat sheet -- not unsourced lists.
- Record the date of research in the report.
- If you cannot verify a claim, state uncertainty explicitly.

### Phase 4 -- Recommended Automation

List concrete CI-friendly commands or tools (e.g., `trivy image`, `npm audit`) appropriate to the stack, without pretending they were executed unless the user or pipeline provided output.

### Phase 5 -- Write the Report

Create one markdown file in the target workspace (the application under audit):

- Default path: `Review/security-audit-report.md`
- Or: `Review/security-audit-<ISO-date>.md` if the user prefers dated artifacts.

Use the structure defined in the Output Contract below.

## Severity Levels

| Severity | Meaning |
|----------|---------|
| **Critical** | Exploitable vulnerability that could lead to data breach, privilege escalation, or system compromise. Must fix before release. Analogous to code-review Critical. |
| **High** | Significant security weakness that is likely exploitable under realistic conditions. Should fix before release. |
| **Medium** | Security concern that requires specific conditions to exploit or has limited impact. Should fix in near term. |
| **Low** | Minor security hygiene issue or defense-in-depth recommendation. Fix when convenient. |
| **Info** | Observation or best-practice suggestion with no direct exploitability. |

## Output Contract

All skills in the **security** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Security Audit Report

**Executive summary**
[2-4 sentences: overall security posture assessment.]

**Scope**
- Files reviewed: [list or count]
- Areas covered: [STRIDE categories, OWASP categories, container, deps]

**Findings**
| # | Severity | Category | File | Finding | Remediation |
|---|----------|----------|------|---------|-------------|
| 1 | Critical | [STRIDE/OWASP] | `path` | [issue] | [fix] |

_None if clean._

**Dependency / CVE intelligence**
| Package | Version | CVE | Severity | Fix Version |
|---------|---------|-----|----------|-------------|
| [pkg] | [ver] | [CVE-ID] | [sev] | [fix ver] |

_None if clean._

**Gate verdict:** PASS / FAIL
[PASS requires: no unwaivered Critical findings. FAIL lists blocking items.]

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Never perform live exploitation, port scanning, or credential stuffing unless explicitly authorized.
- Every CVE ID or serious claim must have a markdown link to an authoritative source.
- State uncertainty explicitly when a claim cannot be verified.
- Do not claim parity with commercial SAST/DAST scanners; recommend running them in CI.
- Use `code-review` for code quality concerns (correctness, readability, conciseness).
- Use `ui-ux-review` for design-system and UX quality concerns.
