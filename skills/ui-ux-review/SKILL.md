---
name: ui-ux-review
description: >-
  Review frontend code for design-system compliance and UX quality. Covers
  theme-token compliance, hardcoded color detection, accessibility audit,
  visual hierarchy, spacing consistency, feedback states, and responsive
  behavior.
  USE FOR: UI/UX quality gate after frontend implementation, theme compliance
  check, accessibility review.
  DO NOT USE FOR: code review (use code-review), security audit (use
  appsec-audit), implementation (use impl-* skills).
argument-hint: 'Point me at frontend files and I will review them for design-system compliance and UX quality.'
phase: '4.5'
phase-family: ui-quality
---

# UI/UX Review

## When to Use

- After frontend components, pages, or styles have been changed.
- When a design-system or theme layer may have been bypassed.
- When the UI needs a quality gate distinct from code correctness.

## When Not to Use

- Code correctness or architecture review -- use `code-review`.
- Security audit -- use `appsec-audit`.
- Implementing UI changes -- use the appropriate `impl-*` skill.

## Procedure

1. **Gather context** -- Read project documentation, design-system config, and Tailwind/theme configuration to understand the token layer.
2. **Scan changed UI files** -- Examine every `.tsx`, `.jsx`, `.svelte`, `.vue`, `.html` file in scope for violations across all six pillars.
3. **Classify findings** -- Assign each finding a severity: `Blocker`, `Risk`, or `Observation`.
4. **Produce the review report** -- Use the Output Contract below.

## Review Pillars

Apply all six pillars systematically to every component and page reviewed.

### Pillar 1 -- Theme Token Compliance

The most common and impactful class of violation. Hardcoded colors tightly couple components to a specific palette, breaking dark mode, theme switching, and brand consistency.

#### What counts as a violation

**Hardcoded Tailwind palette colors** -- using raw palette classes instead of semantic tokens:

```tsx
// VIOLATION -- hardcoded palette color
<div className="bg-blue-500 text-white border-gray-200">
<p className="text-gray-700 dark:text-gray-300">
<button className="bg-emerald-600 hover:bg-emerald-700">
```

```tsx
// CORRECT -- semantic theme tokens (Skeleton UI)
<div className="bg-primary-500 text-on-primary-token border-surface-300-600-token">
<p className="text-surface-950-50-token">
<button className="preset-filled-primary-500">
```

**Hardcoded hex, rgb, or hsl values in className or style:**

```tsx
// VIOLATION
<div style={{ backgroundColor: '#1a1a2e', color: 'rgb(255,255,255)' }}>
<div className="[color:#334155]">
```

**Hardcoded dark mode variants that duplicate light/dark manually:**

```tsx
// VIOLATION -- bypasses the theme system
<p className="text-gray-900 dark:text-gray-100">

// CORRECT -- single adaptive token
<p className="text-surface-950-50-token">
```

#### Skeleton UI token reference

When the project uses Skeleton UI, enforce these semantic token patterns:

| Use case | Correct class pattern |
|----------|----------------------|
| Primary action background | `bg-primary-[shade]` or `preset-filled-primary-[shade]` |
| Surface / card background | `bg-surface-[shade]` |
| Adaptive text (light/dark) | `text-surface-950-50-token` |
| On-primary text | `text-on-primary-token` |
| Border | `border-surface-300-600-token` |
| Outlined button | `preset-outlined-primary-[shade]` |
| Tonal button | `preset-tonal-primary-[shade]` |
| Error / destructive | `bg-error-[shade]` or `preset-filled-error-[shade]` |
| Success | `bg-success-[shade]` or `preset-filled-success-[shade]` |
| Warning | `bg-warning-[shade]` or `preset-filled-warning-[shade]` |

**When the project uses plain Tailwind without a design system**, the fix is to use CSS custom properties via the project's own token layer (e.g. `var(--color-primary)` referenced via Tailwind config), not hardcoded palette classes.

#### Scanning approach

Scan every `.tsx`, `.jsx`, `.svelte`, `.vue`, `.html` file in scope for:
- `className` or `class` attributes containing color utilities (`text-`, `bg-`, `border-`, `ring-`, `shadow-`, `fill-`, `stroke-`) followed by a palette name and shade (e.g. `blue-500`, `gray-200`, `red-700`)
- `style` props or attributes containing color values
- Tailwind arbitrary color values: `[color:...]`, `[background:...]`, `[border-color:...]`
- `dark:` variants paired with light variants that together manually reproduce adaptive behavior

### Pillar 2 -- Visual Hierarchy

Good hierarchy directs the user's eye to what matters. Violations make pages feel flat or chaotic.

**Check for:**

- **Missing heading structure** -- Is there a clear H1 to H2 to H3 progression? Is the primary action or content visually dominant?
- **Competing emphasis** -- Multiple elements at the same visual weight with no clear primary.
- **Underused whitespace** -- Content crammed together with no breathing room between sections.
- **Over-emphasis** -- Too many bold, large, or colored elements diluting the primary message.

```tsx
// VIOLATION -- all text the same size and weight, no hierarchy
<div>
  <p className="text-base">Welcome</p>
  <p className="text-base">Create your first project</p>
  <button className="text-base">Get started</button>
</div>

// CORRECT -- clear hierarchy
<div>
  <h1 className="h1">Welcome</h1>
  <p className="text-surface-700-200-token">Create your first project</p>
  <button className="btn preset-filled-primary-500">Get started</button>
</div>
```

### Pillar 3 -- Spacing Consistency

Inconsistent spacing creates visual noise.

**Check for:**

- **Arbitrary spacing values** -- `p-[13px]`, `mt-[7px]`, `gap-[11px]` alongside scale-based values.
- **Mixing spacing scales** -- Some areas use `space-y-4`, others use `mt-3 mb-5` with no pattern.
- **Absent or inconsistent component spacing** -- Cards, list items, and form fields spaced differently across the same page.
- **Inline style spacing** -- `style={{ marginTop: '10px' }}` instead of Tailwind utilities.

**Rule:** All spacing should use Tailwind's 4px base scale (1 unit = 4px). Arbitrary pixel values are a violation unless there is a documented design exception.

### Pillar 4 -- Accessibility

Accessibility is non-negotiable. Every violation here is at minimum a `Risk`; ARIA violations and keyboard traps are `Blockers`.

| Check | What to look for |
|-------|-----------------|
| Color contrast | Palette color combinations that likely fail WCAG AA (4.5:1 for text, 3:1 for large text/UI). Flag any `text-gray-400` on `bg-white`, `text-white` on light backgrounds, etc. |
| Missing ARIA | Interactive elements without roles, `<div onClick>` without `role="button"` and `tabIndex`, icon-only buttons without `aria-label`. |
| Focus styles | `outline-none` or `focus:outline-none` without a replacement focus indicator. |
| Form labels | `<input>` without a corresponding `<label>` or `aria-label`. |
| Image alt text | `<img>` without `alt`, or decorative images with non-empty `alt`. |
| Keyboard traps | Modal or dropdown implementations that do not restore focus on close. |
| Semantic HTML | `<div>` used where `<button>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` is appropriate. |

```tsx
// BLOCKER -- no label, no ARIA, not keyboard accessible
<div onClick={handleClick} className="cursor-pointer">
  <svg>...</svg>
</div>

// CORRECT
<button
  onClick={handleClick}
  aria-label="Close dialog"
  className="btn-icon"
>
  <svg aria-hidden="true">...</svg>
</button>
```

### Pillar 5 -- Feedback and State Completeness

Every interactive or async surface must communicate its state to the user. Missing states are a `Risk`.

| State | What to verify |
|-------|---------------|
| Loading | Async operations (fetch, form submit, file upload) show a spinner, skeleton, or progress indicator. |
| Empty | Lists, tables, and grids have an empty state component (not just rendering nothing). |
| Error | API errors, form validation errors, and network failures surface a message to the user -- not just a console log. |
| Success | Mutations (create, update, delete) confirm success via toast, banner, or navigation. |
| Disabled | Buttons/inputs that cannot be activated look and feel disabled (`disabled` attribute + `opacity-50 cursor-not-allowed`). |
| Hover / Active | Interactive elements have visible hover and active states. |

```tsx
// RISK -- no loading or error state
const { data } = useSWR('/api/items');
return <ul>{data?.map(item => <li>{item.name}</li>)}</ul>;

// CORRECT
if (isLoading) return <ProgressRing />;
if (error) return <ErrorBanner message={error.message} />;
if (!data?.length) return <EmptyState message="No items yet" />;
return <ul>{data.map(item => <li>{item.name}</li>)}</ul>;
```

### Pillar 6 -- Consistency

Inconsistency creates cognitive load.

**Check for:**

- **Button variant inconsistency** -- Primary actions using different classes across pages (`preset-filled-primary-500` in one place, a custom hand-rolled `bg-blue-500 text-white rounded` in another).
- **Typography inconsistency** -- Headings using `text-2xl font-bold` in one place and `text-xl font-semibold` in another for the same semantic level.
- **Card / panel inconsistency** -- Cards with different border radii, padding, or shadow conventions on the same page.
- **Icon library mixing** -- Using Heroicons on some components and Lucide on others for the same purpose.
- **Pattern divergence** -- The same UX pattern (e.g. a delete confirmation) implemented two different ways in the same app.

## Severity Classification

| Severity | Meaning |
|----------|---------|
| **Blocker** | Breaks accessibility in a way that makes the UI unusable for some users, or completely breaks the theme (e.g. 100% hardcoded colors on a key page). Must be fixed before merging. |
| **Risk** | Degrades user experience in a meaningful way -- missing state, low contrast, inconsistent spacing. Should be fixed before merging. |
| **Observation** | Inconsistency or minor deviation. Recommended fix; acceptable to defer to a polish pass. |

## Pass / Fail Gate

**PASS** -- All of the following are true:
- Zero `Blocker` findings
- Theme Compliance Score is `Pass` or `Conditional` (three or fewer Risk-level token violations)
- All pillar scores >= 3/5
- Zero accessibility Blockers (missing ARIA, keyboard traps, no focus styles)

**FAIL** -- Any of the following are true:
- Any `Blocker` finding exists
- Theme Compliance is `Fail` (widespread hardcoded colors)
- Any pillar scores 1/5
- Any accessibility Blocker

On FAIL, pass the full findings table to the appropriate implementer agent with explicit instruction: "Fix every Blocker and Risk finding. For each fix, note the finding number it addresses."

## Important Guidelines

- **Never fix code yourself.** You only produce reviews; you do not modify source files.
- **Be specific, never generic.** "Replace `bg-blue-500` on line 14 of `Button.tsx` with `preset-filled-primary-500`" -- not "use theme tokens."
- **One finding per row.** Do not bundle multiple violations into one row.
- **Check every file in scope.** Do not stop at the first finding per file.
- **Separate theme violations from UX violations.** They route to different fixes and have different urgency.
- **Flag low contrast specifically.** Name the foreground/background combination; do not just say "check contrast."
- **Context matters.** A decorative background image does not need semantic token compliance the same way a button does. Use judgment.

## Output Contract

All skills in the **ui-quality** phase family use this identical report. Present it in chat before logging progress.

```markdown
### UI/UX Review Report

**Summary**
[2-3 sentences: overall design-system compliance and UX quality assessment.]

**Findings**
| # | Pillar | Severity | File | Finding | Recommendation |
|---|--------|----------|------|---------|----------------|
| 1 | Theme Compliance | Blocker | `path` | [issue] | [fix] |

_None if clean._

**Scores**
| Pillar | Score |
|--------|-------|
| Theme Compliance | Pass / Conditional / Fail |
| Visual Hierarchy | X/5 |
| Accessibility | X/5 |
| Feedback & States | X/5 |
| Consistency | X/5 |
| Responsive | X/5 |

**Gate verdict:** PASS / FAIL
[If FAIL, list blocking items. PASS requires: zero Blockers, Theme >= Pass/Conditional, all pillars >= 3/5, zero a11y Blockers.]

**Suggested next step**
[Agent or action.]
```

## Guardrails

- Accessibility blockers are never optional.
- Theme and token bypass should be called out explicitly.
- This skill reviews design quality, not business logic correctness.
- Use `code-review` for correctness, completeness, conciseness, and readability.
- Use `appsec-audit` for security concerns.
