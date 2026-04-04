---
name: code-documentation
description: >-
  Add or improve in-code documentation for public symbols using language-native
  formats (JSDoc, Python docstrings, C# XML docs, GoDoc, Javadoc, Rust doc
  comments). Produces IntelliSense-ready documentation with examples.
  USE FOR: documenting exported functions, classes, interfaces, types, modules.
  DO NOT USE FOR: non-code docs like README or config files (use
  docs-config-authoring), code review (use code-review), implementation (use
  impl-* skills).
argument-hint: 'Point me at code and I will add or improve its documentation.'
phase: '6'
phase-family: documentation
---

# Code Documentation

## When to Use

- Public or exported symbols need better IntelliSense documentation.
- API behavior changed and source-level docs no longer match reality.
- A code review found missing doc comments on public surfaces.
- A module or file lacks a top-level overview comment.

## When Not to Use

- Non-code docs like README, YAML, config files, or agent files — use `docs-config-authoring`.
- Code review or quality feedback — use `code-review`.
- Implementation or refactoring — use the appropriate `impl-*` skill.

## Two Output Modes

### Mode 1: In-Code Documentation (primary)

Add or improve documentation comments directly in source files using the format appropriate to the language (see Language Support Matrix below).

### Mode 2: Markdown API Reference (optional, on request)

When the user asks for API docs or reference pages:

- Generate files in `docs/api/` (or a path the user specifies).
- One page per module or logical group.
- Include type/interface catalogs, enum and constant references, method signature tables.
- Cross-link to source files and to related types.
- Use consistent headings and structure so the docs are navigable.

## Procedure

1. **Detect language and framework** — Use `package.json`, `tsconfig.json`, `pyproject.toml`, `*.csproj`, `go.mod`, `pom.xml`, `Cargo.toml` to identify the stack.
2. **Detect existing doc conventions** — Check config files (`pyproject.toml` for docstring convention, `tsconfig.json` for strict JSDoc, `.editorconfig`). Scan 2-3 already-documented functions to identify the style in use (Google vs NumPy, JSDoc tag usage, etc.). If no existing style, use the language's most common convention.
3. **Scan target scope** — If pointed at a file, document that file. If pointed at a directory, find undocumented or under-documented exports.
4. **Write documentation** — Add doc comments using the detected conventions. Prioritize public/exported symbols in this order:
   1. Exported functions and methods — parameters, return types, thrown errors, side effects, one example for non-trivial functions.
   2. Exported classes and interfaces — purpose, usage patterns, relationships to other types.
   3. Exported types, enums, and constants — meaning, valid values, when to use.
   4. Complex internal functions — non-obvious logic, algorithms, business rules.
   5. Configuration and environment — what each config option or env var does.
   6. Module-level overviews — one short paragraph describing what the file or module is responsible for.
5. **Generate API reference** — If the user asked for API docs, produce Markdown under `docs/api/` (or specified path).
6. **Produce the output contract** — Write the Documentation Completion Report (see Output Contract below).

## Language Support Matrix

| Language        | Doc format              | Key tags / elements |
|-----------------|-------------------------|----------------------|
| TypeScript/JS   | JSDoc `/** ... */`      | `@param`, `@returns`, `@throws`, `@example`, `@deprecated`, `@see`, `@template` |
| Python          | Docstrings              | Google / NumPy / Sphinx style; Args, Returns, Raises, Examples |
| C# / .NET       | XML `///` comments       | `<summary>`, `<param>`, `<returns>`, `<exception>`, `<example>`, `<remarks>` |
| Go              | GoDoc (comment above)   | First sentence = summary; no formal tags |
| Java/Kotlin     | Javadoc / KDoc `/** */` | `@param`, `@return`, `@throws`, `@see` |
| Rust            | `///` doc comments      | Markdown; `# Examples` section |

## In-Code Doc Patterns

### TypeScript / JavaScript (JSDoc)

```javascript
/**
 * Calculates the total price including tax for the given items.
 * @param {Array<{ price: number, quantity: number }>} items - Line items
 * @param {number} [taxRate=0.1] - Tax rate between 0 and 1
 * @returns {number} Total including tax
 * @throws {RangeError} When taxRate is not between 0 and 1
 * @example
 * getTotalWithTax([{ price: 10, quantity: 2 }], 0.08); // 21.6
 */
function getTotalWithTax(items, taxRate = 0.1) { ... }
```

### Python (Google-style)

```python
def get_total_with_tax(items: list[dict], tax_rate: float = 0.1) -> float:
    """Calculate total price including tax for the given items.

    Args:
        items: List of dicts with 'price' and 'quantity' keys.
        tax_rate: Tax rate between 0 and 1. Defaults to 0.1.

    Returns:
        Total amount including tax.

    Raises:
        ValueError: When tax_rate is not between 0 and 1.

    Example:
        >>> get_total_with_tax([{"price": 10, "quantity": 2}], 0.08)
        21.6
    """
```

### C# (XML documentation)

```csharp
/// <summary>
/// Calculates the total price including tax for the given items.
/// </summary>
/// <param name="items">Line items with price and quantity.</param>
/// <param name="taxRate">Tax rate between 0 and 1. Default 0.1.</param>
/// <returns>Total including tax.</returns>
/// <exception cref="ArgumentOutOfRangeException">When taxRate is not between 0 and 1.</exception>
public decimal GetTotalWithTax(IEnumerable<LineItem> items, decimal taxRate = 0.1m) { ... }
```

### Go (GoDoc)

```go
// GetTotalWithTax calculates the total price including tax for the given items.
// taxRate must be between 0 and 1; otherwise GetTotalWithTax returns an error.
func GetTotalWithTax(items []LineItem, taxRate float64) (float64, error) { ... }
```

### Java (Javadoc)

```java
/**
 * Calculates the total price including tax for the given items.
 * @param items line items with price and quantity
 * @param taxRate tax rate between 0 and 1 (default 0.1)
 * @return total including tax
 * @throws IllegalArgumentException when taxRate is not between 0 and 1
 */
public double getTotalWithTax(List<LineItem> items, double taxRate) { ... }
```

### Rust (doc comments)

```rust
/// Calculates the total price including tax for the given items.
///
/// # Arguments
/// * `items` - Slice of line items with `price` and `quantity`
/// * `tax_rate` - Tax rate in [0.0, 1.0]
///
/// # Returns
/// Total amount including tax.
///
/// # Errors
/// Returns `Err` if `tax_rate` is not in [0.0, 1.0].
///
/// # Examples
/// ```
/// let items = vec![LineItem { price: 10.0, quantity: 2 }];
/// let total = get_total_with_tax(&items, 0.08)?;
/// ```
pub fn get_total_with_tax(items: &[LineItem], tax_rate: f64) -> Result<f64, Error> { ... }
```

## Documentation Quality Rules

- **Describe "why" and "what", not "how"** — "Calculates shipping cost from weight and destination zone" not "Loops through items and adds prices."
- **Document parameters** — Type, description, constraints, defaults, optionality.
- **Document return values** — Type, shape, possible values, null/undefined when relevant.
- **Document exceptions/errors** — Which errors can be thrown and under what conditions.
- **Include examples** — At least one usage example for non-trivial functions.
- **Document edge cases** — Empty input, null, boundary values when behavior is non-obvious.
- **Be concise** — One sentence for simple functions; more only when behavior is subtle.
- **Match existing style** — If the project uses Google-style docstrings, do not switch to NumPy-style.

## Markdown API Reference Generation

When generating API reference pages:

1. **Structure** — Use `docs/api/` (or user-specified path). One Markdown file per module or major namespace. Optionally an `index.md` with links to all modules.
2. **Per-symbol** — For each exported type, function, or constant: name, signature, short description, parameters table, return value, errors/exceptions, and example if non-trivial.
3. **Cross-links** — Link to source file and line where possible. Link to related types and callers.
4. **Format** — Use headings (e.g. `## FunctionName`), tables for parameters/returns, and fenced code blocks for examples. Keep consistent with the rest of the repo's docs.

## Quality Checklist

Before finishing, verify:

- [ ] Every exported/public function, class, or type has a doc comment
- [ ] Parameters and return values are described (and types stated where the format allows)
- [ ] Thrown errors/exceptions are documented
- [ ] Non-trivial functions have at least one example
- [ ] Descriptions focus on "what" and "why", not step-by-step "how"
- [ ] Existing doc style in the file or project is matched
- [ ] No existing documentation was removed or overwritten without preserving useful content

## Output Contract

All skills in the **documentation** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Documentation Completion Report

**Summary**
[What was documented: symbols, modules, or pages.]

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [doc added/updated] |

**Public API / exported symbols**
- [List key symbols documented] or **N/A**

**Verification**
- [build or doc check if any] — [result] or **N/A**

**Suggested next step**
[Typically code-review or human review.]
```

## Guardrails

- Match the local documentation convention before inventing a new one.
- Do not add noisy comments to trivial getters/setters or self-explanatory one-liners unless the project already documents everything.
- Do not remove existing docs — when updating, preserve existing content that is still accurate; only add or refine.
- Do not invent behavior — document only what the code does; if behavior is unclear, note that in the doc or ask for clarification.
- Preserve formatting — match indentation and line length of the surrounding code.
- Use `docs-config-authoring` for Markdown or configuration files.
- Use `code-review` for quality feedback, not documentation.
