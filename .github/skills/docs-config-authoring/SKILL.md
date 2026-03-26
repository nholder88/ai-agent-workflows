---
name: docs-config-authoring
description: 'Write or edit non-code documentation and configuration files. USE FOR: Markdown, YAML, JSON, TOML, INI, agent files, README, CONTRIBUTING, repo guidance, workflow docs, config schemas, .env templates. DO NOT USE FOR: source code editing, in-code documentation comments (use code-documentation), architecture planning (use architecture-backlog-planning).'
argument-hint: 'Point me at docs, agent files, or config files and I will rewrite them clearly and correctly.'
---

# Docs And Config Authoring

## When to Use

- The target files are Markdown or configuration, not source code.
- Agent files, repo guidance, workflow docs, YAML, JSON, TOML, or INI need clear technical edits.
- The main work is correctness and clarity in non-code assets.

## Procedure

1. Confirm the target is a non-code file.
2. Preserve required structure such as YAML frontmatter, keys, headings, and schema-sensitive layout.
3. Tighten wording while keeping technical meaning intact.
4. Keep terminology consistent with nearby docs and config files.
5. Validate syntax-sensitive files after editing.

## Guardrails

- Do not edit source code in this mode.
- Keep correctness first, clarity second, brevity third.
- Use code-documentation instead for in-code documentation comments.
