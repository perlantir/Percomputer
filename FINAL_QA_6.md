# FINAL QA REPORT #6 — Design System Consistency Audit

**Project:** Multi-Model Agent Platform
**Date:** 2025-04-26
**Auditor:** Design System Auditor
**Scope:** All React components, CSS files, Tailwind config, and pages under `/mnt/agents/output/multi-model-agent-platform/`

---

## Executive Summary

| Category | Status | Score |
|----------|--------|-------|
| Design Token Usage | Mostly Compliant | B+ |
| Dark Mode Support | Compliant with Minor Gaps | B+ |
| Responsive Breakpoints | Compliant | A- |
| Animation Consistency | Partially Compliant | B |
| **Overall** | **Needs Minor Cleanup** | **B+** |

The project has a **well-structured design token foundation** with CSS custom properties, Tailwind theme extensions, and Framer Motion integration. However, several inconsistencies were identified: hardcoded color values, duplicate CSS files with diverging token definitions, mixed shorthand vs. explicit `var(--*)` usage in console components, and a wide variety of animation durations/easings that bypass the declared token system.

---

## 1. Design Token Usage

### 1.1 Token Architecture Overview

| Layer | File | Status |
|-------|------|--------|
| Tailwind Config | `tailwind.config.ts` | Well-defined custom colors, fonts, spacing, radii, shadows, easing, durations, keyframes |
| Global CSS (App) | `app/globals.css` | Comprehensive light/dark token definitions |
| Global CSS (Src) | `src/styles/globals.css` | **Divergent duplicate — different values** |
| Component CSS | `src/components/workflow/dag-styles.css` | **Completely separate hardcoded scheme** |

### 1.2 Tailwind Config Audit (`tailwind.config.ts`)

**Strengths:**
- Custom colors map to CSS variables: `canvas`, `surface`, `border`, `foreground`, `accent`, `success`, `warning`, `danger`, `info`, `syntax`
- Custom fonts: `display`, `sans`, `body`, `ui`, `mono`
- Custom spacing: `18`, `88`, `128`
- Custom border radius: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `pill`, `full`
- Custom easing functions: `ease-out-expo`, `ease-in-out-quart`, `ease-out-quart`, `ease-in-quart`, `spring`
- Custom durations: `50`, `150`, `250`, `350`, `450`, `600`, `800`
- Custom animations: `fade-in`, `slide-in`, `slide-up`, `slide-down`, `pulse-glow`, `shimmer`, `spin-slow`, `ping`, `ripple`
- `darkMode: "class"` correctly set

**Issues:**
- **Duplicate key** in `borderRadius`: `pill: "9999px"` appears twice (lines 127 and 129). The second overwrites the first; harmless but sloppy.

### 1.3 UI Primitive Components — Token Compliance

All UI primitives correctly use CSS variables via `var(--*)` syntax:

| Component | Token Usage | Status |
|-----------|-------------|--------|
| `button.tsx` | `var(--accent-primary)`, `var(--bg-surface-2)`, etc. | PASS |
| `badge.tsx` | `var(--semantic-success)`, `var(--accent-primary)`, etc. | PASS |
| `card.tsx` | `var(--bg-surface)`, `var(--border-subtle)`, `shadow-low/medium/high` | PASS |
| `dialog.tsx` | `var(--bg-canvas)`, `var(--bg-surface)`, `var(--border-subtle)` | PASS |
| `input.tsx` | `var(--bg-surface)`, `var(--text-primary)`, `var(--semantic-danger)` | PASS |
| `toast.tsx` | `var(--semantic-success)`, `var(--semantic-danger)`, `var(--bg-surface)` | PASS |
| `popover.tsx` | `var(--border-subtle)`, `var(--bg-surface)`, `var(--text-primary)` | PASS |
| `skeleton.tsx` | `var(--bg-surface-3)`, `shimmer-bg` | PASS |
| `switch.tsx` | `var(--accent-primary)`, `var(--bg-surface-3)`, `duration-fast`, `ease-spring` | PASS |
| `loading-skeleton.tsx` | `var(--border-subtle)`, `var(--bg-surface)`, `shimmer-bg` | PASS |

### 1.4 Hardcoded Values Found (Should Use Tokens)

#### 1.4.1 Backdrop Overlays

| File | Line | Hardcoded Value | Issue |
|------|------|-----------------|-------|
| `src/components/layout/KeyboardShortcuts.tsx` | 224 | `bg-black/50` | Should use `var(--bg-canvas)` or a dedicated backdrop token |
| `src/components/layout/CommandPalette.tsx` | 269 | `bg-black/40` | Same — inconsistent with Dialog overlay which uses `bg-[var(--bg-canvas)]/80` |
| `src/components/onboarding/WelcomeModal.tsx` | 77 | `bg-black/50 backdrop-blur-sm` | Same |

**Recommendation:** Define `--backdrop-bg: rgba(0,0,0,0.4)` and `--backdrop-bg-strong: rgba(0,0,0,0.5)` tokens, or standardize all overlays to use `bg-[var(--bg-canvas)]/80` like `dialog.tsx`.

#### 1.4.2 White/Black Color Literals

| File | Line | Hardcoded Value | Issue |
|------|------|-----------------|-------|
| `src/components/ui/button.tsx` | 121 | `bg-white/30` (ripple) | Should use `var(--text-inverse)` with opacity |
| `src/components/layout/LeftRail.tsx` | 82 | `text-white` (logo "M") | Should use `var(--text-inverse)` |
| `src/components/onboarding/OnboardingChecklist.tsx` | 212 | `text-white` (success check) | Should use `var(--text-inverse)` |
| `src/components/notifications/NotificationBell.tsx` | 69 | `text-white` (badge count) | Should use `var(--text-inverse)` |
| `src/components/templates/TemplateLibrary.tsx` | 185 | `bg-white/20` | Should use `var(--bg-surface)` with opacity |
| `src/components/workflow/LiveActivityRail.tsx` | 347, 465 | `hover:bg-white/5` | Should use `var(--bg-hover)` or tokenized overlay |
| `src/components/layout/LeftRail.tsx` | 281-284 | `bg-emerald-400`, `bg-emerald-500` | Should use `var(--success)` token |

#### 1.4.3 Console Components — Mixed Token Conventions

Console components use a **hybrid convention** that is inconsistent with the rest of the app:

```tsx
// ConsoleNav.tsx — shorthand Tailwind tokens (NOT defined in tailwind.config.ts)
border-border-subtle      // ❌ Not a Tailwind token — only works if it compiles to border-color: var(--border-subtle)
bg-surface                // ❌ Not a Tailwind token
text-foreground-primary   // ❌ Not a Tailwind token
```

These shorthand classes are **NOT defined in `tailwind.config.ts`**. They rely on CSS variables being injected by some other mechanism (likely a separate CSS file or plugin). This is fragile and inconsistent with the explicit `var(--*)` approach used everywhere else.

**Recommendation:** Standardize all console components to use `bg-[var(--bg-surface)]`, `border-[var(--border-subtle)]`, `text-[var(--text-primary)]` to match the rest of the codebase.

#### 1.4.4 Workflow DAG Styles — Separate Color Scheme

`src/components/workflow/dag-styles.css` defines a **completely separate hardcoded color system**:

```css
.dag-visualization--dark {
  --bg-surface: #0f1115;        /* Different from app dark mode: #202222 */
  --accent-primary: #8ab4f8;    /* Different from app: #20B8CD */
  --success: #81c995;           /* Different from app: #2A9D8F */
  --danger: #f28b82;            /* Different from app: #E76F51 */
}

.dag-visualization--light {
  --bg-surface: #ffffff;        /* Different from app: #FFFFFF (same) */
  --accent-primary: #1a73e8;    /* Different from app: #20B8CD */
  --success: #34a853;           /* Different from app: #2A9D8F */
  --danger: #ea4335;            /* Different from app: #E76F51 */
}
```

**Issue:** The DAG visualization uses a Google-Material-style color palette that diverges from the app's Perplexity-inspired palette. This creates a visual disconnect.

**Recommendation:** Align DAG colors with the app's token system, or document the intentional deviation.

#### 1.4.5 ProgressBar Hardcoded Fallback

```tsx
// src/components/workflow/ProgressBar.tsx:41
const color = MODEL_COLORS[model] ?? "#94a3b8";
// Line 71: background: "rgba(148,163,184,0.15)"
// Line 122: background: "rgba(148,163,184,0.12)"
```

**Recommendation:** Use `var(--text-tertiary)` or a dedicated `--progress-track` token for the fallback track color.

#### 1.4.6 PlanDiffViewer Hardcoded Colors

```tsx
// src/components/console/PlanDiffViewer.tsx:199-202
llm: "#20B8CD",       /* Should use var(--accent-primary) */
tool: "#22c55e",      /* Should use var(--success) */
guardrail: "#f59e0b", /* Should use var(--warning) */
code: "#8b5cf6",      /* No token equivalent */
```

And background tints:
```tsx
// Lines 247-251
"rgba(239,68,68,0.06)"   /* Should use var(--danger) with opacity */
"rgba(34,197,94,0.06)"   /* Should use var(--success) with opacity */
"rgba(245,158,11,0.06)"  /* Should use var(--warning) with opacity */
```

---

## 2. Dark Mode Support

### 2.1 Dark Mode Architecture

| Aspect | Status | Notes |
|--------|--------|-------|
| Tailwind darkMode config | PASS | `darkMode: "class"` |
| next-themes integration | PASS | `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem` |
| suppressHydrationWarning | PASS | Set on `<html>` element |
| CSS variable overrides | PASS | `.dark` block in `app/globals.css` |
| Viewport theme-color | PASS | Both light (`#FBF8F4`) and dark (`#191A1A`) defined |

### 2.2 Explicit `dark:` Modifier Usage

Some components use explicit `dark:` Tailwind modifiers, which is unnecessary when using CSS variables but does provide extra control:

| File | dark: Usage | Assessment |
|------|-------------|------------|
| `QuickActions.tsx` | `dark:shadow-[...]` | Shadows need separate dark values; acceptable |
| `TemplateCard.tsx` | `dark:hover:border-[...]` | Acceptable for hover shadow tuning |
| `TemplateLibrary.tsx` | `dark:hover:shadow-[...]` | Acceptable |
| `ExportArtifact.tsx` | `dark:text-red-400` | Uses arbitrary Tailwind color — **should use `var(--semantic-danger)`** |
| `NotificationPanel.tsx` | `dark:shadow-black/20` | Acceptable |

### 2.3 Components With Missing Dark Mode Considerations

| File | Issue |
|------|-------|
| `src/components/workflow/dag-styles.css` | Has its own `.dag-visualization--dark` but uses different colors from app dark mode |
| `src/components/console/PlanDiffViewer.tsx` | Hardcoded hex colors do not adapt to dark mode |
| `src/components/workflow/ProgressBar.tsx` | Hardcoded fallback `#94a3b8` may not look ideal in dark mode |

### 2.4 Duplicate CSS File Risk

**Critical Finding:** Two `globals.css` files exist:
- `app/globals.css` — used by the app (imported in `app/layout.tsx`)
- `src/styles/globals.css` — may be unused or may conflict

The `src/styles/globals.css` defines `--bg-hover: rgba(0,0,0,0.04)` which is referenced by many components. If both files are loaded, the second to load wins. If only `app/globals.css` is loaded, `--bg-hover` is **not defined there**, which could cause missing hover backgrounds.

**Verification:**
- `app/globals.css` does **NOT** define `--bg-hover`
- `src/styles/globals.css` **DOES** define `--bg-hover`
- Many components reference `var(--bg-hover)`

This means either:
1. `src/styles/globals.css` is being loaded somehow (via an import we haven't found), OR
2. The hover backgrounds are silently falling back to transparent

**Recommendation:** Consolidate to a single `globals.css` file. Either move `--bg-hover` into `app/globals.css`, or import `src/styles/globals.css` from `app/globals.css`.

---

## 3. Responsive Breakpoints

### 3.1 Breakpoint Usage Overview

The project uses **Tailwind's default breakpoint system** (`sm`, `md`, `lg`, `xl`, `2xl`) consistently:

| Component | Responsive Pattern | Status |
|-----------|-------------------|--------|
| `loading-skeleton.tsx` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4` | PASS |
| `dialog.tsx` | `sm:flex-row`, `sm:text-left`, `sm:space-x-2` | PASS |
| `toast.tsx` | `sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]` | PASS |
| `AppShell.tsx` | `hidden sm:block` for desktop rail, mobile nav handled separately | PASS |
| `BillingPanel.tsx` | `grid-cols-1 sm:grid-cols-3` | PASS |
| `ExportWorkflow.tsx` | `grid-cols-2 sm:grid-cols-4` | PASS |
| `Onboarding/WelcomeModal.tsx` | `grid-cols-1 sm:grid-cols-2` | PASS |
| `SpaceArtifactsTab.tsx` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | PASS |

### 3.2 Fixed/Hardcoded Widths

Some components use fixed pixel widths that may cause overflow on small screens:

| File | Width | Concern |
|------|-------|---------|
| `ConsoleTable.tsx` | `min-w-[140px]` tooltip | Minor — tooltip only |
| `ConnectorDrawer.tsx` | `max-w-md` | Standard drawer width |
| `ExportWorkflow.tsx` | `max-w-2xl` | Standard dialog width |
| `Popover.tsx` | `w-72` | Acceptable for popover |
| `ConsoleNav.tsx` | `w-52` | Fixed sidebar width — OK for desktop console |
| `WorkflowInspector.tsx` | `w-[480px]` | Fixed inspector panel — OK for desktop |
| `AuditExplorer.tsx` | `w-[420px]` | Fixed panel — OK for desktop |
| `CostQualityLeaderboard.tsx` | `w-64` | Fixed panel — OK for desktop |
| `RoutingPolicyEditor.tsx` | `w-80` | Fixed panel — OK for desktop |

**Assessment:** Console and workflow pages are desktop-optimized; the fixed widths are acceptable for their use case. Main user-facing pages (Home, Discover, Library, Settings) are fully responsive.

---

## 4. Animation Consistency

### 4.1 Declared Animation Tokens

**Tailwind Config (`tailwind.config.ts`):**
- Easing: `ease-out-expo` `[0.16, 1, 0.3, 1]`, `ease-in-out-quart` `[0.76, 0, 0.24, 1]`, `ease-out-quart` `[0.25, 1, 0.5, 1]`, `ease-in-quart` `[0.5, 0, 0.75, 1]`, `spring` `[0.34, 1.56, 0.64, 1]`
- Durations: `50` (instant), `150` (fast), `250` (normal), `350` (slow), `450` (slower), `600` (emphasis), `800` (dramatic)
- Keyframe animations: `fade-in`, `slide-in`, `slide-up`, `slide-down`, `pulse-glow`, `shimmer`, `spin-slow`, `ping`, `ripple`

**CSS Custom Properties (`app/globals.css`):**
- `--ease-out-expo`, `--ease-in-out-quart`, `--ease-out-quart`, `--ease-in-quart`, `--ease-spring`
- `--duration-instant` (50ms), `--duration-fast` (150ms), `--duration-normal` (250ms), `--duration-slow` (350ms), `--duration-slower` (450ms), `--duration-emphasis` (600ms), `--duration-dramatic` (800ms)

### 4.2 Animation Token Adoption

**Components Using Token Durations Correctly:**

| Component | Duration Token | Status |
|-----------|---------------|--------|
| `button.tsx` | `duration-fast` | PASS |
| `badge.tsx` | `duration-fast` | PASS |
| `input.tsx` | `duration-fast` | PASS |
| `card.tsx` | `duration-fast` | PASS |
| `switch.tsx` | `duration-fast`, `ease-spring` | PASS |
| `dialog.tsx` | `duration-300` (arbitrary), `duration-fast` | MIXED |
| `CategoryChip.tsx` | `duration-fast` | PASS |
| `TemplateCard.tsx` | `duration-fast` | PASS |
| `WorkflowListItem.tsx` | `duration-fast` | PASS |
| `SpaceArtifactsTab.tsx` | `duration-fast` | PASS |
| `Composer.tsx` | `duration-350`, `ease-spring` | MIXED |

**Components Using Arbitrary Durations (Inconsistent):**

| Component | Arbitrary Value | Token Equivalent |
|-----------|-----------------|------------------|
| `dialog.tsx` overlay | `duration-300` | `duration-normal` (250ms) or `duration-slow` (350ms) |
| `dialog.tsx` close button | `duration-200` | `duration-fast` (150ms) |
| `LeftRail.tsx` sidebar | `duration-[240ms]` | `duration-normal` (250ms) |
| `AppShell.tsx` spacer | `duration-[240ms]` | `duration-normal` (250ms) |
| `TemplateCard.tsx` | `duration-300` | `duration-slow` (350ms) |
| `QuickActions.tsx` | `duration-300`, `duration-200` | `duration-slow`, `duration-fast` |
| `TemplateLibrary.tsx` | `duration-200` | `duration-fast` |
| `TourStep.tsx` | `duration-300` | `duration-slow` |
| `ConsoleTable.tsx` | `duration-200` | `duration-fast` |
| `UsageDashboard.tsx` | `duration-300` | `duration-slow` |

### 4.3 Framer Motion Animation Inconsistencies

Framer Motion transitions are widely used (216 occurrences) but durations are **arbitrary and not aligned with tokens**:

| Duration | Count | Token Gap |
|----------|-------|-----------|
| `0.15` | 3 | Closest: `duration-fast` (150ms) — OK |
| `0.18` | 4 | No token equivalent |
| `0.2` | 8 | No token equivalent |
| `0.25` | 9 | Closest: `duration-normal` (250ms) — OK |
| `0.28` | 1 | No token equivalent |
| `0.3` | 4 | No token equivalent |
| `0.4` | 1 | Closest: `duration-slower` (450ms) |
| `0.5` | 1 | No token equivalent |
| `0.6` | 1 | Closest: `duration-emphasis` (600ms) — OK |
| `0.8` | 1 | No token equivalent |
| `1.0` | 1 | No token equivalent |
| `1.2` | 2 | No token equivalent |
| `1.4` | 2 | No token equivalent |
| `2.0` | 2 | No token equivalent |

**Easing Inconsistencies:**

| Easing Used | Count | Token Equivalent |
|-------------|-------|-----------------|
| `[0.16, 1, 0.3, 1]` | 5 | `ease-out-expo` — matches |
| `[0.25, 1, 0.5, 1]` | 5 | `ease-out-quart` — matches |
| `[0.34, 1.56, 0.64, 1]` | 2 | `spring` — matches |
| `"easeOut"` | 12 | Should use `ease-out-expo` or `ease-out-quart` |
| `"easeInOut"` | 2 | Should use `ease-in-out-quart` |
| `"easeOut"` (Tailwind string) | Many | Inconsistent |

### 4.4 Reduced Motion Support

**Components Respecting `prefers-reduced-motion`:**

| Component | Method | Status |
|-----------|--------|--------|
| `AppShell.tsx` | `window.matchMedia('(prefers-reduced-motion: reduce)')` | PASS |
| `ProgressBar.tsx` | `window.matchMedia('(prefers-reduced-motion: reduce)')` | PASS |
| `Composer.tsx` | `window.matchMedia('(prefers-reduced-motion: reduce)')` | PASS |
| `ConnectorDrawer.tsx` | `prefersReducedMotion` prop | PASS |
| `dialog.tsx` | `motion-reduce:transition-none` | PASS |
| `LeftRail.tsx` | Conditional `animate-ping` | PASS |
| `ProviderHealth.tsx` | Conditional `animate-ping` | PASS |
| `SourceCard.tsx` | Conditional transition class | PASS |

**Components Missing Reduced Motion Support:**

| Component | Animation | Risk |
|-----------|-----------|------|
| `button.tsx` ripple | `animate-ripple` (600ms) | Low — purely decorative |
| `shimmer-bg` | `animate-shimmer` (2s infinite) | Low — loading state |
| `animate-skeleton` | `skeleton` (2s infinite) | Low — loading state |
| `OnboardingTour.tsx` | `transition={{ duration: 2, repeat: Infinity }}` | Low — decorative pulse |
| `NotificationBell.tsx` | `transition={{ duration: 2, repeat: Infinity }}` | Low — decorative ring |

---

## 5. Typography Scale

### 5.1 Font Stack Compliance

| Token | Definition | Usage |
|-------|-----------|-------|
| `--font-display` | `FK Display, ui-sans-serif, ...` | Card titles, page headings |
| `--font-body` | `FK Grotesk Neue, ui-sans-serif, ...` | Body text, UI elements |
| `--font-mono` | `Berkeley Mono, ui-monospace, ...` | Code, mono text |

**Issue:** `app/layout.tsx` imports `Inter` from Google Fonts and applies it as `--font-inter`, but the CSS custom properties reference `FK Display` and `FK Grotesk Neue` which are **not imported or loaded**. This means the font stack falls back to system fonts.

**Recommendation:** Either load the FK fonts via `@font-face` or `next/font/local`, or update the font stack to use `Inter` consistently.

### 5.2 Typography Scale Usage

The project uses a mix of Tailwind font sizes and custom sizes:

| Size | Usage | Consistency |
|------|-------|-------------|
| `text-[10px]` | Console labels, tags, badges | Frequent — acceptable for dense UI |
| `text-[11px]` | Console secondary text | Frequent |
| `text-xs` | Small UI text | Standard Tailwind |
| `text-sm` | Body/UI text | Standard Tailwind |
| `text-base` | Default body | Standard Tailwind |
| `text-lg` | Card titles, headings | Standard Tailwind |
| `font-display` | Card titles | Token-based |
| `font-ui` | Badge text | Token-based |

**Finding:** `text-[10px]` and `text-[11px]` are used extensively in console components. Consider adding `text-2xs` (0.625rem/10px) and `text-3xs` to the Tailwind config to avoid arbitrary values.

---

## 6. Detailed File-by-File Issues

### `tailwind.config.ts`
- **Line 127, 129:** Duplicate `pill: "9999px"` in `borderRadius`
- **Line 140-142:** Glow shadows use `var(--accent-primary) / 0.25` syntax which may not work in all browsers — prefer `rgba()` or `color-mix()`

### `app/globals.css`
- **Missing:** `--bg-hover` variable (referenced by many components)
- **Missing:** `--accent-primary-rgb` variable (referenced in `dag-styles.css` and `LeftRail.tsx`)
- **Line 243-262:** Search highlight uses hardcoded `rgba(32, 184, 205, ...)` — should reference `var(--accent-primary)` via `color-mix()` or `oklch()`

### `src/styles/globals.css`
- **Critical:** Duplicate and divergent from `app/globals.css`
- `--text-primary: #111111` vs app `#13343B`
- `--success: #22c55e` vs app `#2A9D8F`
- `--danger: #ef4444` vs app `#E76F51`
- This file may not even be loaded, causing silent failures for `--bg-hover`

### `src/components/workflow/dag-styles.css`
- **Lines 16-38:** Entirely separate hardcoded color scheme
- **Lines 61, 116, 186, 266, 326, 339:** Hardcoded `rgba(0,0,0,...)` shadows
- **Lines 150, 156, 211, 443, 449, 453, 640, 741, 746, 751:** Hardcoded `rgba(...)` status backgrounds

### `src/components/layout/LeftRail.tsx`
- **Line 82:** `text-white` should be `text-[var(--text-inverse)]`
- **Lines 281-284:** `bg-emerald-400`, `bg-emerald-500` should use `var(--success)`
- **Line 123:** `rgba(var(--accent-primary-rgb,59,130,246),0.12)` — fallback RGB is wrong color; also `--accent-primary-rgb` is not defined in `app/globals.css`

### `src/components/ui/button.tsx`
- **Line 121:** `bg-white/30` ripple should use `bg-[var(--text-inverse)]/30`

### `src/components/layout/CommandPalette.tsx`
- **Line 269:** `bg-black/40` should use `bg-[var(--bg-canvas)]/80` (like dialog)

### `src/components/layout/KeyboardShortcuts.tsx`
- **Line 224:** `bg-black/50` should use backdrop token

### `src/components/onboarding/WelcomeModal.tsx`
- **Line 77:** `bg-black/50` should use backdrop token

### `src/components/onboarding/OnboardingChecklist.tsx`
- **Line 212:** `text-white` should use `text-[var(--text-inverse)]`

### `src/components/notifications/NotificationBell.tsx`
- **Line 69:** `text-white` should use `text-[var(--text-inverse)]`

### `src/components/templates/TemplateLibrary.tsx`
- **Line 185:** `bg-white/20` should use `bg-[var(--bg-surface)]/20` or similar

### `src/components/workflow/LiveActivityRail.tsx`
- **Lines 347, 465:** `hover:bg-white/5` should use `hover:bg-[var(--bg-hover)]`

### `src/components/console/PlanDiffViewer.tsx`
- **Lines 199-202:** Hardcoded hex colors for node types
- **Lines 247-251:** Hardcoded rgba backgrounds for diff highlighting

### `src/components/export/ExportArtifact.tsx`
- **Line 232:** `dark:text-red-400` should use `text-[var(--semantic-danger)]`

---

## 7. Recommendations & Action Items

### High Priority

1. **Consolidate CSS files** — Merge `src/styles/globals.css` into `app/globals.css` and delete the duplicate. Ensure `--bg-hover` and `--accent-primary-rgb` are defined.
2. **Fix console component token conventions** — Replace `border-border-subtle`, `bg-surface`, `text-foreground-primary` with explicit `var(--*)` syntax to match the rest of the app.
3. **Replace hardcoded backdrop colors** — Standardize all modal/palette backdrops to use `bg-[var(--bg-canvas)]/80` with `backdrop-blur-sm`.
4. **Replace hardcoded white/black** — Convert `text-white`, `bg-white/30`, `bg-black/50`, `bg-white/5`, `bg-white/20` to use `var(--text-inverse)` or dedicated overlay tokens.

### Medium Priority

5. **Align DAG styles with app tokens** — Update `dag-styles.css` to use the app's CSS variables instead of a separate Google-Material palette.
6. **Standardize animation durations** — Replace `duration-200`, `duration-300`, `duration-[240ms]` with Tailwind token equivalents (`duration-fast`, `duration-normal`, `duration-slow`).
7. **Standardize Framer Motion durations** — Create a `motion.ts` utility that maps animation tokens to Framer Motion transition objects.
8. **Fix `tailwind.config.ts` duplicate key** — Remove duplicate `pill` entry.
9. **Fix font loading** — Either load `FK Display` / `FK Grotesk Neue` fonts or update token definitions to use `Inter`.

### Low Priority

10. **Add `text-2xs` to Tailwind config** — Replace `text-[10px]` and `text-[11px]` with named tokens.
11. **Document intentional color deviations** — If DAG or ProgressBar colors must differ, document why in a `DESIGN_TOKENS.md` file.
12. **Replace hardcoded search highlight rgba** — Use `color-mix()` with `var(--accent-primary)`.

---

## 8. Summary Matrix

| File | Token Issues | Dark Mode Issues | Animation Issues | Responsive Issues |
|------|-------------|------------------|------------------|-------------------|
| `app/globals.css` | Missing `--bg-hover`, `--accent-primary-rgb` | PASS | N/A | N/A |
| `tailwind.config.ts` | Duplicate `pill` key | PASS | Well-defined tokens | Default breakpoints |
| `src/styles/globals.css` | **Divergent duplicate** | Divergent values | N/A | N/A |
| `button.tsx` | `bg-white/30` | N/A | `animate-ripple` OK | N/A |
| `badge.tsx` | PASS | PASS | `duration-fast` | N/A |
| `card.tsx` | PASS | PASS | `duration-fast` | N/A |
| `dialog.tsx` | PASS | PASS | `duration-300` arbitrary | `sm:flex-row` OK |
| `input.tsx` | PASS | PASS | `duration-fast` | N/A |
| `toast.tsx` | PASS | PASS | Built-in Radix | `sm:` / `md:` OK |
| `switch.tsx` | PASS | PASS | `duration-fast`, `ease-spring` | N/A |
| `skeleton.tsx` | PASS | PASS | `animate-skeleton` | N/A |
| `LeftRail.tsx` | `text-white`, `bg-emerald-*` | N/A | `duration-[240ms]` | `hidden sm:block` OK |
| `AppShell.tsx` | PASS | PASS | `duration-[240ms]` | Mobile nav OK |
| `CommandPalette.tsx` | `bg-black/40` | N/A | `duration-200` arbitrary | `max-w-2xl` OK |
| `KeyboardShortcuts.tsx` | `bg-black/50` | N/A | `duration-200` arbitrary | N/A |
| `WelcomeModal.tsx` | `bg-black/50` | N/A | `duration-200` arbitrary | `sm:grid-cols-2` OK |
| `TemplateLibrary.tsx` | `bg-white/20` | N/A | `duration-200` arbitrary | N/A |
| `QuickActions.tsx` | Hardcoded shadow rgba | `dark:shadow` OK | `duration-300` arbitrary | N/A |
| `TemplateCard.tsx` | Hardcoded shadow rgba | `dark:hover:` OK | `duration-300` arbitrary | N/A |
| `LiveActivityRail.tsx` | `bg-white/5` | N/A | Various | N/A |
| `DAGMiniMap.tsx` | `box-shadow` hardcoded | N/A | `transition: all 0.1s` | N/A |
| `dag-styles.css` | **Separate color scheme** | `.dag-visualization--dark` | Hardcoded durations | N/A |
| `PlanDiffViewer.tsx` | Hardcoded hex + rgba | **No dark adaptation** | N/A | N/A |
| `ProgressBar.tsx` | `#94a3b8` fallback | May look off in dark | `400ms` / `300ms` arbitrary | N/A |
| `ConsoleTable.tsx` | Mixed shorthand tokens | N/A | `duration-200` arbitrary | `min-w-[140px]` OK |
| `ConsoleNav.tsx` | Mixed shorthand tokens | N/A | `duration-150` | `w-52` fixed OK |
| `UsageDashboard.tsx` | PASS | PASS | `duration-300` arbitrary | `hover:shadow-md` OK |
| `Composer.tsx` | PASS | PASS | `duration-350` arbitrary | N/A |
| `ExportArtifact.tsx` | `dark:text-red-400` | **Uses Tailwind arbitrary color** | N/A | `max-w-xl` OK |

---

## 9. Conclusion

The Multi-Model Agent Platform has a **solid design token foundation** with good coverage of colors, typography, spacing, shadows, and animations. The UI primitives are exemplary in their token usage. Dark mode is properly architected with `next-themes` and CSS variable switching.

The main areas needing attention are:
1. **Console components** using a different token convention (`border-border-subtle` vs `border-[var(--border-subtle)]`)
2. **Hardcoded color literals** (`text-white`, `bg-black/50`, `bg-emerald-500`) scattered across ~15 files
3. **Animation duration inconsistency** — too many arbitrary values bypassing the token system
4. **Duplicate/divergent CSS files** that could cause silent token failures
5. **DAG workflow styles** using an entirely separate color palette

Addressing the High and Medium priority items would elevate the project to an **A-grade design system consistency rating**.
