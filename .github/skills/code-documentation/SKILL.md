---
name: code-documentation
description: 'Add or improve in-code documentation for public symbols using language-native formats. USE FOR: JSDoc, Python docstrings, C# XML docs, GoDoc, Javadoc, Rust doc comments, IntelliSense-friendly documentation, API reference generation, documenting parameters, return values, and error behavior. DO NOT USE FOR: Markdown docs, README, YAML, config files, or agent files (use docs-config-authoring), prose documentation or guides.'
argument-hint: 'Point me at source files or public symbols and I will document them in the project style.'
---

# Code Documentation

## When to Use

- Public or exported symbols need better IntelliSense documentation.
- API behavior changed and the source-level docs no longer match reality.
- A code review found missing doc comments on public surfaces.

## Procedure

1. Detect the language and the existing doc style already used nearby.
2. Prioritize exported functions, classes, types, interfaces, enums, and public methods.
3. Document what the symbol does, its parameters, return values, error behavior, and notable edge cases.
4. Add examples for non-trivial APIs when the project style supports them.
5. Preserve existing useful documentation instead of rewriting it blindly.

## Guardrails

- Match the local documentation convention before inventing a new one.
- Do not add noisy comments to trivial code.
- Use docs-config-authoring instead for Markdown or configuration files.
