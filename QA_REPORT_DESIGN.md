# Design System Audit Report
## Multi-Model Agent Platform

**Audit Date:** 2024
**Auditor:** Design System Auditor
**Scope:** `tailwind.config.ts`, `globals.css`, UI primitives (`src/components/ui/*.tsx`), workflow components (`src/components/workflow/*.tsx`), console components (`src/components/console/*.tsx`)

---

## Executive Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Colors / Tokens | 0 | 8 | 12 | 3 | 23 |
| Duplication | 2 | 3 | 0 | 0 | 5 |
| Tailwind Config | 0 | 2 | 2 | 1 | 5 |
| Dark Mode | 0 | 3 | 5 | 2 | 10 |
| Animations | 0 | 1 | 3 | 0 | 4 |
| Spacing / Layout | 0 | 0 | 4 | 2 | 6 |
| Typography | 0 | 0 | 3 | 1 | 4 |
| Shadows | 0 | 1 | 2 | 0 | 3 |
| Focus / A11y | 0 | 0 | 2 | 0 | 2 |
| Inline Styles | 0 | 1 | 8 | 4 | 13 |
| **TOTAL** | **2** | **19** | **41** | **13** | **75** |

---

## 1. CRITICAL ISSUES (2)

### C1: Duplicate Component Files — Conflicting Implementations
**Severity:** CRITICAL  
**Files:**
- `src/components/ui/Badge.tsx` vs `src/components/ui/badge.tsx`
- `src/components/ui/Button.tsx` vs `src/components/ui/button.tsx`
- `src/components/ui/Input.tsx` vs `src/components/ui/input.tsx`
- `src/components/ui/Textarea.tsx` vs `src/components/ui/textarea.tsx`
- `src/components/ui/Separator.tsx` vs `src/components/ui/separator.tsx`
- `src/components/ui/Skeleton.tsx` vs `src/components/ui/skeleton.tsx`

**Description:**  
There are **6 pairs of duplicate UI primitives** with different file casing (PascalCase vs kebab-case). The implementations diverge significantly:

| File | Token Style | Variants | Notes |
|------|-------------|----------|-------|
| `Badge.tsx` | Tailwind tokens (`bg-accent-primary`, `text-text-inverse`) | default, secondary, outline, success, warning, danger, ghost | Missing `size` variant |
| `badge.tsx` | CSS vars (`bg-[var(--semantic-success)]`) | default, success, warning, danger, info, accent | Has `size` variant, uses `rounded-pill` |
| `Button.tsx` | Tailwind tokens | default, secondary, ghost, outline, danger, link | Missing `warning`, `fullWidth` |
| `button.tsx` | CSS vars | primary, secondary, ghost, danger, warning | Has `fullWidth`, `active:scale-[0.98]` |

**Impact:**  
- Import ambiguity depending on filesystem case-sensitivity.
- Inconsistent API surface (some components have `size`, others don't).
- Token strategy split: half use Tailwind mapped tokens, half use raw CSS variables.

**Fix:**  
Consolidate each pair into a single canonical file (recommend kebab-case for Radix/shadcn parity). Adopt ONE token strategy (recommend CSS variables via Tailwind mapped tokens for type safety).

---

### C2: Undefined Shadow Tokens Used Across Components
**Severity:** CRITICAL  
**File:** `tailwind.config.ts`  
**Description:**  
The Tailwind config does **not** define `shadow-low`, `shadow-medium`, or `shadow-high`, yet these classes are used extensively in components:

**Usage count:**
- `shadow-low`: 3 occurrences (`card.tsx`, `tabs.tsx`, `RecentWorkflowCard.tsx`)
- `shadow-medium`: 8 occurrences (`dropdown-menu.tsx`, `popover.tsx`, `select.tsx`, `slider.tsx`, `switch.tsx`, `tooltip.tsx`, `SourceCard.tsx`)
- `shadow-high`: 4 occurrences (`dialog.tsx`, `command.tsx`, `toast.tsx`, `CitationPopover.tsx`)

**Fix:**  
Add to `tailwind.config.ts` > `theme.extend.boxShadow`:
```ts
"shadow-low": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
"shadow-medium": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
"shadow-high": "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
```
Or use the existing `sm`/`md`/`lg` shadows and rename component usage.

---

## 2. HIGH SEVERITY ISSUES (19)

### H1: Hardcoded `text-white` / `bg-white` in Console Components
**Severity:** HIGH  
**Files & Lines:**
- `src/components/console/ConsoleNav.tsx:169` — `text-white`
- `src/components/console/ConsoleNav.tsx:176` — `text-white`
- `src/components/console/ConsoleNav.tsx:183` — `bg-white/60`
- `src/components/console/ConsoleTable.tsx:240` — `text-white`
- `src/components/console/RoutingPolicyEditor.tsx:111` — `text-white`
- `src/components/console/WorkflowInspector.tsx:260` — `text-white`
- `src/components/console/WorkflowInspector.tsx:269` — `text-white`

**Description:**  
These components use hardcoded `text-white` when `bg-accent-primary` is active. This will break in light mode where the accent-primary background is cyan (`#20B8CD`) and white text has insufficient contrast. They should use `text-inverse` token instead.

**Fix:**  
Replace all `text-white` with `text-foreground-inverse` (or `text-[var(--text-inverse)]`).

---

### H2: Extensive Hardcoded Gray Scale in `LiveActivityRail.tsx`
**Severity:** HIGH  
**File:** `src/components/workflow/LiveActivityRail.tsx`  
**Lines:** 227, 238, 277, 298, 324, 340, 343, 348, 357, 363, 367, 373, 405, 419–420, 425, 446, 450, 460

**Description:**  
This file uses 19+ hardcoded Tailwind gray scale colors that do NOT adapt to dark mode:
- `text-gray-400`, `text-gray-500`, `text-gray-200`, `text-gray-300`, `text-gray-600`
- `hover:bg-white/5`, `hover:text-gray-200`
- `bg-white/5`

These colors are static and will look incorrect when the theme switches. For example, `text-gray-200` is very light and becomes invisible on a light canvas.

**Fix:**  
Map semantic equivalents:
| Current | Replacement |
|---------|-------------|
| `text-gray-400` (inactive) | `text-[var(--text-tertiary)]` |
| `text-gray-300` (secondary) | `text-[var(--text-secondary)]` |
| `text-gray-200` (primary) | `text-[var(--text-primary)]` |
| `text-gray-500` (disabled) | `text-[var(--text-tertiary)] opacity-60` |
| `bg-white/5` | `bg-[var(--bg-surface-2)]` or `bg-[var(--bg-surface-3)]` |

---

### H3: Hardcoded `gray` Colors in `StatusPill.tsx`
**Severity:** HIGH  
**File:** `src/components/workflow/StatusPill.tsx`  
**Lines:** 82, 86, 109

**Description:**  
Uses `bg-gray-400`, `text-gray-400`, `text-gray-400` for neutral/cancelled states. Not dark-mode aware.

**Fix:**  
Use `text-[var(--text-tertiary)]` / `bg-[var(--bg-surface-3)]`.

---

### H4: Hardcoded Tailwind Colors in `StepsTab.tsx`
**Severity:** HIGH  
**File:** `src/components/workflow/StepsTab.tsx`  
**Lines:** 49–61

**Description:**  
Phase badges use hardcoded Tailwind palette colors:
```tsx
"bg-blue-500/10 text-blue-600 border-blue-500/20"
"bg-amber-500/10 text-amber-600 border-amber-500/20"
...
"bg-gray-500/10 text-gray-600 border-gray-500/20"
```

These do not adapt to dark mode and are not from the design token palette.

**Fix:**  
Replace with semantic token equivalents. Since phases need distinct colors, extend the design token palette with `phase-research`, `phase-analysis`, etc., or use the existing accent colors (`accent-primary`, `accent-secondary`, `accent-tertiary`, `success`, `warning`, `danger`, `info`) with opacity modifiers.

---

### H5: Undefined `--text-muted` CSS Variable Referenced
**Severity:** HIGH  
**Files & Lines:**
- `src/components/workflow/AmendWorkflowDialog.tsx:121` — `placeholder:text-[var(--text-muted)]`
- `src/components/workflow/ShareWorkflowDialog.tsx:190` — `placeholder:text-[var(--text-muted)]`
- `src/components/workflow/ShareWorkflowDialog.tsx:217` — `text-[var(--text-muted)]`

**Description:**  
`--text-muted` is referenced in 3 files but is **not defined** in `globals.css`. This will cause placeholder text to inherit default color unpredictably.

**Fix:**  
Add to `globals.css` `:root` and `.dark`:
```css
--text-muted: var(--text-tertiary); /* or define separately */
```
Or replace all references with `text-[var(--text-tertiary)]`.

---

### H6: Hardcoded Hex Colors in `PlanDiffViewer.tsx`
**Severity:** HIGH  
**File:** `src/components/console/PlanDiffViewer.tsx`  
**Lines:** 199–202

**Description:**  
```tsx
llm: "#20B8CD",
tool: "#22c55e",
guardrail: "#f59e0b",
code: "#8b5cf6",
```
These colors are hardcoded and bypass the design token system. `llm` happens to match `--accent-primary`, but the others are arbitrary Tailwind palette colors.

**Fix:**  
Map to design tokens:
```tsx
llm: "var(--accent-primary)",
tool: "var(--success)",
guardrail: "var(--warning)",
code: "var(--accent-secondary)",
```

---

### H7: Duplicate `pill` Key in `tailwind.config.ts`
**Severity:** HIGH  
**File:** `tailwind.config.ts`  
**Lines:** 127, 129

**Description:**  
```ts
pill: "9999px",
full: "9999px",
pill: "9999px",   // ← DUPLICATE
```
JavaScript objects with duplicate keys silently overwrite the earlier value. This is a bug.

**Fix:**  
Remove the duplicate `pill: "9999px"` on line 129.

---

### H8: `shadow-glow-*` Uses Invalid CSS Syntax
**Severity:** HIGH  
**File:** `tailwind.config.ts`  
**Lines:** 137–139

**Description:**  
```ts
"glow-sm": "0 0 8px var(--accent-primary) / 0.25",
```
The `var() / 0.25` syntax is **not valid CSS**. Custom properties in `box-shadow` must use `rgba()` or `color-mix()` for alpha.

**Fix:**  
```ts
"glow-sm": "0 0 8px color-mix(in srgb, var(--accent-primary) 25%, transparent)",
```

---

### H9: `text-gray-200` in `TokenStream.tsx`
**Severity:** HIGH  
**File:** `src/components/workflow/TokenStream.tsx`  
**Line:** 89

**Description:**  
```tsx
<pre className="... text-gray-200">
```
Hardcoded gray that won't work in light mode.

**Fix:**  
Replace with `text-[var(--text-primary)]`.

---

### H10: Hardcoded `bg-white/5` in Dark-Only Context
**Severity:** HIGH (Dark mode fragility)  
**File:** `src/components/workflow/LiveActivityRail.tsx`  
**Lines:** 277, 373

**Description:**  
`hover:bg-white/5` is used on a dark-themed rail. While it "works" visually, it is a hardcoded value that should use a token (`bg-[var(--bg-surface-2)]` or `bg-[var(--bg-surface-3)]`).

---

### H11: `duration-base` is Not a Defined Token
**Severity:** HIGH  
**File:** `src/components/workflow/RecentWorkflowCard.tsx`  
**Line:** 109

**Description:**  
```tsx
transition-all duration-base ease-out
```
`duration-base` is not defined in `tailwind.config.ts`. Tailwind will silently fall back to a default or ignore it. All defined duration tokens are `50`, `150`, `250`, `350`, `450`, `600`, `800`.

**Fix:**  
Replace with `duration-normal` (250ms) or `duration-slow` (350ms), or add `base` to the config.

---

### H12: `toast.tsx` Uses Hardcoded `z-[100]`
**Severity:** HIGH  
**File:** `src/components/ui/toast.tsx`  
**Line:** 18

**Description:**  
```tsx
"fixed top-0 z-[100] ..."
```
The design system defines a comprehensive z-index scale (`--z-toast: 600`), but the Toast primitive ignores it.

**Fix:**  
Replace with `z-[var(--z-toast)]` (or `z-toast` if mapped in Tailwind).

---

### H13: `ConsoleTable.tsx` Inline Width Styles
**Severity:** HIGH  
**File:** `src/components/console/ConsoleTable.tsx`  
**Lines:** 182, 206, 280, 294, 360, 369, 372

**Description:**  
Virtualized table uses extensive inline `style={{ width: col.width || 120, height: rowHeight, ... }}`. These are layout-critical and cannot be easily overridden with classes. The `col.width` values come from column definitions and may be arbitrary.

**Fix:**  
This is a data-table virtualization concern; some inline styles are unavoidable for virtual scrollers. However, the fallback `120` should be a tokenized spacing value (`w-30` = 120px). Consider wrapping in a style-utility that maps to CSS custom properties.

---

### H14: DAG Components Use Extensive Inline Styles
**Severity:** HIGH  
**Files:**
- `src/components/workflow/DAGMiniMap.tsx` — lines 201, 217, 229
- `src/components/workflow/DAGNode.tsx` — lines 177, 192
- `src/components/workflow/DAGVisualization.tsx` — lines 301, 312, 321, 352, 384

**Description:**  
DAG rendering requires dynamic positioning (x/y coordinates), which justifies some inline styles. However, some properties (colors, transitions, border-radius) could be extracted to CSS classes with custom properties.

**Fix:**  
Audit each inline `style` block. Move static styling (colors, transitions, hover states) to Tailwind classes. Keep only dynamic geometry (left/top/width/height) inline.

---

### H15: `Badge.tsx` (PascalCase) Uses Tailwind Tokens Not Mapped to Dark Mode
**Severity:** HIGH  
**File:** `src/components/ui/Badge.tsx`  
**Lines:** 13–25

**Description:**  
The PascalCase `Badge.tsx` uses token names like `bg-accent-primary`, `text-text-inverse`, etc. These rely on the Tailwind config mapping. However, the file is the **legacy duplicate** and may still be imported in places. The danger variant uses `bg-danger` which is a color name that maps to `var(--danger)`, but the file does NOT use the newer opacity-based approach of `badge.tsx`.

**Fix:**  
Delete `Badge.tsx` and migrate all imports to `badge.tsx`.

---

### H16: `Button.tsx` (PascalCase) Missing `ring-offset-[var(--bg-canvas)]`
**Severity:** HIGH  
**File:** `src/components/ui/Button.tsx`  
**Line:** 8

**Description:**  
The PascalCase `Button.tsx` focus ring does not offset against the canvas background variable, meaning the focus ring may be invisible on certain backgrounds.

**Fix:**  
Delete `Button.tsx` and migrate all imports to `button.tsx` which has the correct `focus-visible:ring-offset-[var(--bg-canvas)]`.

---

### H17: `AnswerTab.tsx` Inline Animation Delays
**Severity:** MEDIUM-HIGH  
**File:** `src/components/workflow/AnswerTab.tsx`  
**Lines:** 99–101

**Description:**  
```tsx
style={{ animationDelay: "0ms" }}
style={{ animationDelay: "150ms" }}
style={{ animationDelay: "300ms" }}
```
Animation delays are inline styles. Should use CSS custom properties or Tailwind arbitrary values (`delay-0`, `delay-150`, `delay-300` if configured).

**Fix:**  
Add `delay-0`, `delay-150`, `delay-300` to `transitionDuration` in `tailwind.config.ts`, or use `style` with a design-token-aligned delay scale.

---

### H18: `badge.tsx` Arbitrary `text-[11px]`
**Severity:** MEDIUM-HIGH  
**File:** `src/components/ui/badge.tsx`  
**Line:** 24

**Description:**  
```tsx
sm: "px-2 py-0.5 text-[11px] leading-4",
```
11px is not part of the typography scale. The Tailwind config only adds `2xs: 0.625rem` (10px). 11px is an arbitrary value.

**Fix:**  
Use `text-2xs` (10px) or add `text-xs` (12px) to the badge size variant. Do not use arbitrary font sizes.

---

### H19: `Input.tsx` / `Textarea.tsx` (PascalCase) Use Legacy Token Names
**Severity:** HIGH  
**Files:** `src/components/ui/Input.tsx`, `src/components/ui/Textarea.tsx`

**Description:**  
The PascalCase duplicates use token names like `border-border-default`, `bg-surface`, `text-foreground-primary` — which are mapped Tailwind tokens. However, they are the **older** implementation. The kebab-case versions (`input.tsx`, `textarea.tsx`) use raw CSS variables (`border-[var(--border-default)]`) and have more complete focus ring styling.

**Fix:**  
Delete PascalCase duplicates and standardize on kebab-case.

---

## 3. MEDIUM SEVERITY ISSUES (41)

### M1–M5: `bg-[var(--xxx)]` vs Tailwind Token Inconsistency
**Severity:** MEDIUM  
**Description:**  
Many components mix two token strategies:
- **Strategy A:** Tailwind mapped tokens (`bg-surface`, `text-foreground-primary`)
- **Strategy B:** Raw CSS variables (`bg-[var(--bg-surface)]`, `text-[var(--text-primary)]`)

**Occurrence count:**
- Raw CSS var strategy (`bg-[var(`, `text-[var(`, `border-[var(`): ~340 usages
- Tailwind mapped tokens (`bg-surface`, `text-foreground`, etc.): ~423 usages

**Fix:**  
Standardize on ONE strategy. Recommendation: use Tailwind mapped tokens for type safety and IDE autocompletion, but use raw CSS variables for dynamic/conditional values. Do not mix arbitrarily within the same component.

---

### M6: `toast.tsx` Arbitrary `md:max-w-[420px]`
**Severity:** MEDIUM  
**File:** `src/components/ui/toast.tsx`  
**Line:** 18

**Description:**  
`md:max-w-[420px]` is an arbitrary value. The spacing scale does not include 420px. The config has `88: 22rem` (352px) and `128: 32rem` (512px).

**Fix:**  
Use `max-w-88` (352px) or add `105: 26.25rem` (420px) to `spacing`.

---

### M7: `scroll-area.tsx` Uses `rounded-[inherit]`
**Severity:** MEDIUM  
**File:** `src/components/ui/scroll-area.tsx`  
**Line:** 16

**Description:**  
```tsx
rounded-[inherit]
```
This is an arbitrary value that passes `inherit` directly. It works but bypasses the token system.

**Fix:**  
Acceptable in this specific case since `inherit` is a CSS keyword. No action needed unless strict token purity is required.

---

### M8: `dialog.tsx` Arbitrary Positioning Values
**Severity:** MEDIUM  
**File:** `src/components/ui/dialog.tsx`  
**Lines:** 40–41

**Description:**  
```tsx
"fixed left-[50%] top-[50%] ... translate-x-[-50%] translate-y-[-50%]"
```
These are centering tricks. Acceptable since 50% is a CSS intrinsic value.

**Fix:**  
No action needed; centering requires percentage values.

---

### M9: `WorkflowHeader.tsx` Arbitrary `max-w-[1400px]`
**Severity:** MEDIUM  
**File:** `src/components/workflow/WorkflowHeader.tsx`  
**Line:** 66

**Fix:**  
Add `140: 35rem` / `350: 87.5rem` to spacing config, or use a container query.

---

### M10: `AuditExplorer.tsx` / `WorkflowInspector.tsx` Fixed Width Panels
**Severity:** MEDIUM  
**Files:**
- `src/components/console/AuditExplorer.tsx:384` — `w-[420px]`
- `src/components/console/WorkflowInspector.tsx:456` — `w-[480px]`

**Fix:**  
Add to spacing config or use responsive width classes (`w-96`, `w-[28rem]`, etc.).

---

### M11: `Separator.tsx` / `separator.tsx` Arbitrary `h-[1px]` / `w-[1px]`
**Severity:** MEDIUM  
**Files:** `src/components/ui/Separator.tsx:21`, `src/components/ui/separator.tsx:21`

**Fix:**  
Use `h-px` and `w-px` (Tailwind's built-in 1px utilities).

---

### M12: `ClarificationCard.tsx` Arbitrary `max-w-[72ch]`
**Severity:** MEDIUM  
**File:** `src/components/workflow/ClarificationCard.tsx`  
**Line:** 55

**Fix:**  
Use `max-w-prose` (65ch) or add `max-w-reading: 72ch` to Tailwind config.

---

### M13: `AnswerTab.tsx` Arbitrary `max-w-[72ch]`
**Severity:** MEDIUM  
**File:** `src/components/workflow/AnswerTab.tsx`  
**Line:** 335

**Fix:**  
Same as M12.

---

### M14: `TaskRow.tsx` Arbitrary `pl-[60px]` and `left-[19px]`
**Severity:** MEDIUM  
**File:** `src/components/workflow/TaskRow.tsx`  
**Lines:** 106, 176

**Fix:**  
Use `pl-15` (60px) if added to spacing config. `left-[19px]` is a visual offset; consider `left-5` (20px) or define a task-indent token.

---

### M15: `Textarea.tsx` (PascalCase) Arbitrary `min-h-[80px]`
**Severity:** MEDIUM  
**File:** `src/components/ui/Textarea.tsx`  
**Line:** 14

**Fix:**  
Use `min-h-20` (80px) if added to spacing config.

---

### M16: `command.tsx` Arbitrary `max-h-[300px]`
**Severity:** MEDIUM  
**File:** `src/components/ui/command.tsx`  
**Line:** 65

**Fix:**  
Use `max-h-72` (288px) or `max-h-80` (320px), or add `75: 18.75rem` to spacing.

---

### M17: `ArtifactViewer.tsx` Arbitrary `max-h-[600px]`
**Severity:** MEDIUM  
**File:** `src/components/workflow/ArtifactViewer.tsx`  
**Line:** 266

**Fix:**  
Use `max-h-150` (600px = 37.5rem) if added to spacing config.

---

### M18: `dropdown-menu.tsx` / `select.tsx` Arbitrary `min-w-[8rem]`
**Severity:** MEDIUM  
**File:** `src/components/ui/dropdown-menu.tsx:49`, `src/components/ui/select.tsx:77`

**Fix:**  
Use `min-w-32` (128px ≈ 8rem) — Tailwind already has `w-32`.

---

### M19: `ConsoleTable.tsx` Tooltip `min-w-[140px]`
**Severity:** MEDIUM  
**File:** `src/components/console/ConsoleTable.tsx`  
**Line:** 253

**Fix:**  
Use `min-w-36` (144px).

---

### M20: `LiveActivityRail.tsx` Inline `style={{ width: 40 }}` and `style={{ width: 320 }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/LiveActivityRail.tsx`  
**Lines:** 219, 262

**Fix:**  
Use Tailwind classes `w-10` (40px) and `w-80` (320px). These are static widths.

---

### M21: `LiveActivityRail.tsx` Inline `style={{ height: 6 }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/LiveActivityRail.tsx`  
**Line:** 307

**Fix:**  
Use `h-1.5` (6px).

---

### M22: `ProgressBar.tsx` Inline `style={{ height }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/ProgressBar.tsx`  
**Lines:** 67, 100

**Fix:**  
If `height` is dynamic, pass as a prop and use a mapped class. If static, use Tailwind height utility.

---

### M23: `StatusPill.tsx` Inline `style={{ animationDuration: "1.4s" }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/StatusPill.tsx`  
**Line:** 51

**Fix:**  
Use CSS custom property `--animation-duration` or add `1400` to `transitionDuration` config.

---

### M24: `TokenStream.tsx` Inline `style={{ maxHeight }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/TokenStream.tsx`  
**Line:** 87

**Fix:**  
If dynamic, acceptable. If static, use Tailwind `max-h-*` utility.

---

### M25: `AmendWorkflowDialog.tsx` / `ShareWorkflowDialog.tsx` / `SourcesTab.tsx` Focus Ring Inconsistency
**Severity:** MEDIUM  
**Files:**
- `AmendWorkflowDialog.tsx:121` — `focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]`
- `ShareWorkflowDialog.tsx:190` — same
- `SourcesTab.tsx:72,89` — `outline-none focus:ring-2 focus:ring-[var(--accent-primary)]`

**Description:**  
These focus rings are missing `focus-visible:` prefix, meaning they show on mouse click (undesired). Also missing `ring-offset` and `ring-offset-[var(--bg-canvas)]`.

**Fix:**  
Replace with:
```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]
```

---

### M26: `WorkflowInspector.tsx` `hover:brightness-95` Not a Token
**Severity:** MEDIUM  
**File:** `src/components/console/WorkflowInspector.tsx`  
**Line:** 417

**Fix:**  
`brightness-95` is a Tailwind utility, not a token issue per se. However, for consistency with other hover states (which use `hover:brightness-110` or `hover:bg-[var(--bg-surface-3)]`), standardize.

---

### M27–M31: Missing `--text-muted`, `--text-placeholder`, `--text-disabled` Variables
**Severity:** MEDIUM  
**File:** `app/globals.css`

**Description:**  
The CSS variable set lacks aliases for common semantic text states:
- `text-muted` → used in 3 files
- `text-placeholder` → could alias `text-tertiary`
- `text-disabled` → could alias `text-tertiary opacity-50`

**Fix:**  
Add semantic aliases to `globals.css`:
```css
--text-muted: var(--text-tertiary);
--text-placeholder: var(--text-tertiary);
--text-disabled: var(--text-tertiary);
```

---

### M32: `Button.tsx` (PascalCase) `hover:opacity-90` for Danger
**Severity:** MEDIUM  
**File:** `src/components/ui/Button.tsx`  
**Line:** 21

**Description:**  
Danger button hover uses `hover:opacity-90` instead of `hover:brightness-110` like the canonical `button.tsx`. Inconsistent hover effect across the codebase.

**Fix:**  
Delete `Button.tsx`.

---

### M33: `SourceCard.tsx` Uses `hover:shadow-sm`
**Severity:** MEDIUM  
**File:** `src/components/workflow/SourceCard.tsx`  
**Line:** 39

**Description:**  
Uses `hover:shadow-sm` which is a valid Tailwind shadow, but the card component system uses `shadow-low` / `shadow-medium` / `shadow-high`. Inconsistent shadow vocabulary.

**Fix:**  
Use `hover:shadow-low` or standardize all cards to use `shadow-sm` and remove `shadow-low` from the token vocabulary entirely.

---

### M34: `AnswerTab.tsx` Uses `shadow-lg` Instead of Token
**Severity:** MEDIUM  
**File:** `src/components/workflow/AnswerTab.tsx`  
**Line:** 61

**Description:**  
```tsx
className="... shadow-lg"
```
Uses Tailwind's built-in `shadow-lg` instead of `shadow-high`.

**Fix:**  
Use `shadow-high` for consistency.

---

### M35: `CitationPopover.tsx` Uses `shadow-high` (Undefined)
**Severity:** MEDIUM  
**File:** `src/components/workflow/CitationPopover.tsx`  
**Line:** 16

**Fix:**  
Will be resolved when H2 (shadow tokens) is fixed.

---

### M36: `badge.tsx` Size Variant `text-[11px]` Not in Scale
**Severity:** MEDIUM  
**File:** `src/components/ui/badge.tsx`  
**Line:** 24

**Fix:**  
Replace with `text-2xs` (10px) or `text-xs` (12px). 11px is not a standard scale step.

---

### M37: `scroll-area.tsx` Uses `p-[1px]`
**Severity:** MEDIUM  
**File:** `src/components/ui/scroll-area.tsx`  
**Line:** 35

**Fix:**  
Use `p-px` (Tailwind's built-in 1px padding utility).

---

### M38: `TaskDetailDrawer.tsx` Inline `style={{ marginTop: 16 }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/TaskDetailDrawer.tsx`  
**Line:** 255

**Fix:**  
Use Tailwind `mt-4` (16px).

---

### M39: `DAGControls.tsx` Inline `style={{ fontSize: '11px', fontWeight: 'bold' }}`
**Severity:** MEDIUM  
**File:** `src/components/workflow/DAGControls.tsx`  
**Line:** 76

**Fix:**  
Use Tailwind `text-2xs font-bold`.

---

### M40: `globals.css` Hardcoded `box-shadow` in `.card` and `.surface-elevated`
**Severity:** MEDIUM  
**File:** `app/globals.css`  
**Lines:** 152, 157, 165

**Description:**  
```css
.card {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04);
}
.card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
}
.surface-elevated {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.04);
}
```
These shadow values are hardcoded in CSS instead of referencing the Tailwind shadow tokens. They should use the tokenized shadow scale.

**Fix:**  
Replace with CSS custom properties that mirror the Tailwind config:
```css
--shadow-low: 0 1px 2px 0 rgb(0 0 0 / 0.04);
--shadow-medium: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
--shadow-high: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
```

---

### M41: `globals.css` Hardcoded Keyframe `translateY(12px)`
**Severity:** LOW-MEDIUM  
**File:** `app/globals.css`  
**Lines:** 201, 202

**Description:**  
```css
@keyframes slideUp {
  from { transform: translateY(12px); }
}
```
12px is not a standard spacing token step (Tailwind scale uses 2px, 4px, 6px, 8px, 12px, 16px, 20px...). 12px maps to `space-3` which IS in the scale, so this is acceptable. However, for strict token adherence, it could use a custom property.

**Fix:**  
No action needed; 12px = `space-3` is a valid Tailwind step.

---

## 4. LOW SEVERITY ISSUES (13)

### L1: `borderRadius.sm` = `0.375rem` (6px) vs Token `--radius-sm` = `0.375rem`
**Severity:** LOW  
**File:** `tailwind.config.ts`  
**Line:** 121

**Description:**  
The Tailwind `borderRadius.sm` is `0.375rem` (6px), but the CSS variable `--radius-sm` is also `0.375rem`. The naming is consistent, but `xs` (`0.25rem` = 4px) might have been intended as the smallest step. No functional issue.

---

### L2: `button.tsx` Variant Name Mismatch (`default` → `primary`)
**Severity:** LOW  
**File:** `src/components/ui/button.tsx`

**Description:**  
The canonical `button.tsx` renames the default variant from `default` to `primary`. This is a breaking API change for any code using `variant="default"`.

**Fix:**  
Add `default` as an alias for `primary` in the CVA config to maintain backward compatibility.

---

### L3: `button.tsx` `icon` Size Changed from `h-9 w-9` to `h-10 w-10`
**Severity:** LOW  
**File:** `src/components/ui/button.tsx`

**Description:**  
Icon button size increased from 36px to 40px. This may cause minor layout shifts.

---

### L4: `badge.tsx` Missing `outline` and `ghost` Variants
**Severity:** LOW  
**File:** `src/components/ui/badge.tsx`

**Description:**  
The canonical `badge.tsx` removed `outline` and `ghost` variants that exist in `Badge.tsx`. Any code using these variants will break after migration.

**Fix:**  
Add `outline` and `ghost` variants to `badge.tsx` before deleting `Badge.tsx`.

---

### L5: `input.tsx` Error State Uses `border-[var(--semantic-danger)]`
**Severity:** LOW  
**File:** `src/components/ui/input.tsx`  
**Line:** 14

**Description:**  
The error state uses `semantic-danger` which is defined as a duplicate alias of `danger`. Having two variables for the same color is redundant.

**Fix:**  
Remove `--semantic-danger` and use `--danger` directly. Update all references.

---

### L6: `button.tsx` `active:scale-[0.98]` Arbitrary Value
**Severity:** LOW  
**File:** `src/components/ui/button.tsx`

**Description:**  
`active:scale-[0.98]` is an arbitrary transform value. The Tailwind scale utilities are `scale-95`, `scale-90`, `scale-75`, etc. 0.98 is not a standard step.

**Fix:**  
Use `active:scale-95` (0.95) or add `scale-98` to the config.

---

### L7: `slider.tsx` `hover:scale-110 active:scale-95` — Easing Not Tokenized
**Severity:** LOW  
**File:** `src/components/ui/slider.tsx`  
**Line:** 25

**Description:**  
The thumb hover/active scale transitions do not specify a `transition-timing-function`, so they fall back to `ease`. The design system standardizes on `ease-out-expo`.

**Fix:**  
Add `transition-transform duration-fast ease-spring` to the thumb className.

---

### L8: `Input.tsx` (PascalCase) Missing `focus-visible:ring-offset-[var(--bg-canvas)]`
**Severity:** LOW  
**File:** `src/components/ui/Input.tsx`  
**Line:** 15

**Description:**  
Focus ring offset uses the default Tailwind offset color instead of the canvas variable. Minor visual inconsistency.

**Fix:**  
Delete `Input.tsx`.

---

### L9: `Separator.tsx` / `separator.tsx` Both Use `data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px`
**Severity:** LOW  
**Files:** `src/components/ui/Separator.tsx`, `src/components/ui/separator.tsx`

**Description:**  
Both implementations are nearly identical. The only difference is the import path and whether `orientation` is passed through.

**Fix:**  
Delete `Separator.tsx`.

---

### L10: `Skeleton.tsx` / `skeleton.tsx` Duplication
**Severity:** LOW  
**Files:** `src/components/ui/Skeleton.tsx`, `src/components/ui/skeleton.tsx`

**Description:**  
Both implementations exist. Need to verify which is canonical.

**Fix:**  
Audit imports, then delete the non-canonical file.

---

### L11: `Toaster.tsx` / `toast.tsx` / `Toaster.tsx` in `layout/`
**Severity:** LOW  
**Files:**
- `src/components/ui/Toaster.tsx`
- `src/components/ui/toast.tsx`
- `src/components/layout/Toaster.tsx`

**Description:**  
There may be a third `Toaster` in `layout/`. Verify if it's a wrapper or a duplicate.

**Fix:**  
Audit and consolidate.

---

### L12: `globals.css` `--radius-sm` = `0.375rem` vs Tailwind `rounded-sm` = `0.125rem`
**Severity:** LOW  
**File:** `app/globals.css`  
**Line:** 78

**Description:**  
Tailwind's default `rounded-sm` is `0.125rem` (2px), but the CSS variable `--radius-sm` is `0.375rem` (6px). This naming mismatch could confuse developers.

**Fix:**  
Rename CSS variable to `--radius-xs: 0.25rem` (4px) and `--radius-sm: 0.375rem` (6px) to match Tailwind config. Or, override `rounded-sm` in Tailwind config to `0.25rem`.

---

### L13: `globals.css` `--font-body` and `--font-ui` Are Identical
**Severity:** LOW  
**File:** `app/globals.css`  
**Lines:** 74, 75 (implied)

**Description:**  
Both `--font-body` and `--font-ui` map to the same font stack (`FK Grotesk Neue`...). The Tailwind config defines both `fontFamily.sans` and `fontFamily.ui` with identical stacks. This redundancy is harmless but adds confusion.

**Fix:**  
Remove `--font-ui` and use `--font-body` for both, or differentiate them if a distinct UI font is planned.

---

## 5. DESIGN TOKEN COVERAGE MATRIX

| Token Category | CSS Variable | Tailwind Mapped | Usage Count | Notes |
|----------------|-------------|-----------------|-------------|-------|
| Canvas bg | `--bg-canvas` | `canvas` | Low | Used in `body` |
| Surface bg | `--bg-surface` | `surface` | High | ~200 refs |
| Surface-2 bg | `--bg-surface-2` | `surface-2` | Medium | ~80 refs |
| Surface-3 bg | `--bg-surface-3` | `surface-3` | Low | ~30 refs |
| Border subtle | `--border-subtle` | `border-subtle` | High | ~150 refs |
| Border default | `--border-default` | `border-default` | High | ~100 refs |
| Text primary | `--text-primary` | `foreground-primary` | High | ~200 refs |
| Text secondary | `--text-secondary` | `foreground-secondary` | High | ~150 refs |
| Text tertiary | `--text-tertiary` | `foreground-tertiary` | Medium | ~80 refs |
| Text inverse | `--text-inverse` | `foreground-inverse` | Low | ~20 refs |
| Accent primary | `--accent-primary` | `accent-primary` | High | ~100 refs |
| Accent hover | `--accent-primary-hover` | `accent-primary-hover` | Low | ~10 refs |
| Danger | `--danger` | `danger` | Medium | ~20 refs |
| Success | `--success` | `success` | Low | ~10 refs |
| Warning | `--warning` | `warning` | Low | ~5 refs |
| Info | `--info` | `info` | Low | ~5 refs |
| **Text muted** | **MISSING** | **MISSING** | **3 refs** | **Undefined!** |
| **Text placeholder** | **MISSING** | **MISSING** | **0 refs** | **Undefined** |
| **Text disabled** | **MISSING** | **MISSING** | **0 refs** | **Undefined** |
| **Shadow low** | **MISSING** | **MISSING** | **3 refs** | **Undefined!** |
| **Shadow medium** | **MISSING** | **MISSING** | **8 refs** | **Undefined!** |
| **Shadow high** | **MISSING** | **MISSING** | **4 refs** | **Undefined!** |

---

## 6. RECOMMENDED PRIORITY FIX ORDER

### Phase 1 — Token Foundation (Critical)
1. Define `shadow-low`, `shadow-medium`, `shadow-high` in `tailwind.config.ts`.
2. Fix `glow-sm/md/lg` invalid CSS syntax.
3. Remove duplicate `pill` key in `tailwind.config.ts`.
4. Add `--text-muted` (or alias to `--text-tertiary`) in `globals.css`.
5. Remove redundant `--semantic-*` aliases and use base semantic tokens.

### Phase 2 — Component Consolidation (Critical)
6. Delete all PascalCase UI duplicates: `Badge.tsx`, `Button.tsx`, `Input.tsx`, `Textarea.tsx`, `Separator.tsx`, `Skeleton.tsx`.
7. Migrate all imports to kebab-case canonical versions.
8. Add missing variants (`outline`, `ghost`) to `badge.tsx` before migration.
9. Add `default` alias to `button.tsx` for backward compatibility.

### Phase 3 — Dark Mode & Color Fixes (High)
10. Replace all `text-white` in console components with `text-[var(--text-inverse)]`.
11. Replace all `text-gray-*` in `LiveActivityRail.tsx` with semantic tokens.
12. Replace all `text-gray-*` in `StatusPill.tsx` and `TokenStream.tsx`.
13. Replace hardcoded phase colors in `StepsTab.tsx` with design tokens.
14. Replace hardcoded hex in `PlanDiffViewer.tsx` with tokens.
15. Replace `bg-white/5` in `LiveActivityRail.tsx` with surface tokens.

### Phase 4 — Arbitrary Value Cleanup (Medium)
16. Replace `duration-base` with `duration-normal`.
17. Replace `z-[100]` with `z-[var(--z-toast)]`.
18. Replace `md:max-w-[420px]` with tokenized width.
19. Replace `min-w-[8rem]` with `min-w-32`.
20. Replace `text-[11px]` with `text-2xs`.
21. Replace `h-[1px]` with `h-px`.
22. Replace `p-[1px]` with `p-px`.

### Phase 5 — Inline Style Cleanup (Medium)
23. Move static inline styles in `LiveActivityRail.tsx` to Tailwind classes.
24. Move `animationDelay` inline styles to CSS custom properties.
25. Move `fontSize: 11px` inline style to Tailwind class.
26. Audit DAG components for inline style reduction.

### Phase 6 — Consistency Polish (Low)
27. Standardize focus ring pattern across all primitives.
28. Standardize hover effect vocabulary (`brightness` vs `opacity` vs `bg-color`).
29. Unify token strategy (prefer Tailwind mapped tokens over raw CSS vars).
30. Document the shadow token vocabulary in the design system README.

---

## 7. FILES REQUIRING NO ACTION

The following files were audited and found to be **fully compliant** with the design token system:

- `src/components/ui/avatar.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/accordion.tsx`
- `src/components/ui/card.tsx` (after shadow token fix)
- `src/components/ui/slider.tsx` (minor easing note only)
- `src/components/ui/select.tsx` (minor width note only)

---

## 8. CONCLUSION

The codebase has a **well-structured token foundation** in `globals.css` and `tailwind.config.ts`, but suffers from:

1. **Shadow token gap** — the most impactful missing token, used in 15+ locations.
2. **Component duplication** — 6 pairs of diverging UI primitives create import ambiguity and API inconsistency.
3. **Gray-scale hardcoding** — `LiveActivityRail.tsx` is the biggest offender with ~19 hardcoded gray colors that break dark mode.
4. **Console `text-white` hardcoding** — breaks contrast in light mode.
5. **Inline style proliferation** — primarily in DAG and table virtualization components.
6. **Undefined `text-muted` variable** — referenced but never declared.

**Estimated remediation effort:** 2–3 days for a single developer to complete Phases 1–4.

---

*End of Report*
