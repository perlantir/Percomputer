# Design Token Audit Report — BUILD_VERIFICATION_3

**Project:** `multi-model-agent-platform`  
**Scope:** `src/components/**/*.tsx`, `src/**/*.tsx`, `app/**/*.tsx`, `app/globals.css`, `tailwind.config.ts`  
**Files Audited:** 139 `.tsx` component files  
**Date:** 2025-01-20

---

## Executive Summary

| Category | Findings | Severity |
|---|---|---|
| Hardcoded hex colors | **35+ occurrences** across 17 files | 🔴 High |
| Hardcoded `rgba()` colors | **16+ occurrences** across 9 files | 🔴 High |
| Hardcoded shadows (not using `shadow-*` tokens) | **14 occurrences** across 8 files | 🟡 Medium |
| Hardcoded pixel dimensions | **40+ occurrences** across 25 files | 🟡 Medium |
| Hardcoded `text-[Npx]` font sizes | **45+ occurrences** across 12 files | 🟡 Medium |
| Hardcoded z-index values | **16 occurrences** across 13 files | 🟡 Medium |
| Hardcoded transition durations (Framer Motion) | **15 occurrences** across 10 files | 🟡 Medium |
| `tailwind.config.ts` issues | **2 issues** (duplicate keys, shadow naming) | 🟡 Medium |
| `globals.css` syntax | **No syntax errors** | 🟢 Clean |
| Token-compliant patterns | Majority of UI uses `var(--*)`, `rounded-*`, `shadow-*` | 🟢 Good |

---

## 1. Hardcoded Hex Colors (`#...`)

### 1.1 Data / mock files (acceptable — color swatches for charts & avatars)
These are **acceptable** because they represent external/chart color palettes that are not part of the theme surface system.

| File | Lines | Colors |
|---|---|---|
| `src/types/workflow.ts` | 138–143 | `#d97757`, `#e5a158`, `#4f8ef7`, `#10a37f`, `#a855f7`, `#6366f1` — model avatar colors |
| `src/data/demo-spaces.ts` | 27, 42, 57, 72 | `#3B82F6`, `#10B981`, `#8B5CF6`, `#F59E0B` — space colors |
| `src/data/templates.ts` | 51, 57, 63, 69, 75, 81, 87 | `#3B82F6`, `#8B5CF6`, `#F59E0B`, `#10B981`, `#EF4444`, `#06B6D4`, `#EC4899` — template category colors |
| `src/data/demo-analytics.ts` | 65–74 | 10 hex colors — chart palette |
| `src/components/spaces/SpaceHeader.tsx` | 11–13 | `#3B82F6`, `#F59E0B`, `#10B981` — member avatar colors |
| `src/components/spaces/SpaceSettingsTab.tsx` | 37–39 | `#3B82F6`, `#F59E0B`, `#10B981` — member avatar colors |

### 1.2 UI components (should use tokens)

| File | Line | Hardcoded Value | Context | Recommendation |
|---|---|---|---|---|
| `src/components/export/EmbedWorkflow.tsx` | 256 | `bg-[#0f0f0f]` | dark theme background | Use `bg-canvas` or `bg-[var(--bg-canvas)]` |
| `src/components/settings/BillingPanel.tsx` | 158 | `bg-[#635BFF]/10` | Stripe brand color | Acceptable (3rd-party brand) |
| `src/components/settings/BillingPanel.tsx` | 159 | `text-[#635BFF]` | Stripe brand text | Acceptable (3rd-party brand) |
| `src/components/workflow/ProgressBar.tsx` | 41 | `#94a3b8` | fallback model color | Should use `--text-tertiary` token |
| `src/components/workflow/LiveActivityRail.tsx` | 174 | `#94a3b8` | fallback model color | Should use `--text-tertiary` token |
| `src/components/workflow/LiveActivityRail.tsx` | 336 | `#94a3b8` | fallback model color | Should use `--text-tertiary` token |
| `src/components/console/PlanDiffViewer.tsx` | 199 | `#20B8CD` | LLM badge color | Should use `accent-primary` token |
| `src/components/console/PlanDiffViewer.tsx` | 200 | `#22c55e` | tool badge color | Should use `success` token |
| `src/components/console/PlanDiffViewer.tsx` | 201 | `#f59e0b` | guardrail badge color | Should use `warning` token |
| `src/components/console/PlanDiffViewer.tsx` | 202 | `#8b5cf6` | code badge color | Should use `accent-tertiary` or add token |
| `src/components/discover/TemplateCard.tsx` | 26–29 | `#3B82F6`, `#8B5CF6`, `#F59E0B`, `#10B981` | category colors | Consider mapping to design tokens |
| `src/components/discover/TemplateCard.tsx` | 33 | `#20B8CD` | fallback category color | Should use `accent-primary` token |
| `src/components/spaces/SpaceHeader.tsx` | 117 | `color: "#fff"` | inline style for avatar text | Should use `var(--text-inverse)` |
| `src/components/spaces/SpaceSettingsTab.tsx` | 144 | `color: "#fff"` | inline style for avatar text | Should use `var(--text-inverse)` |
| `app/layout.tsx` | 57–58 | `#FBF8F4`, `#191A1A` | `<meta theme-color>` | Acceptable (PWA meta tags) |

**Total UI component hardcoded hex colors needing remediation: 12**

---

## 2. Hardcoded `rgba()` / `rgb()` Colors

| File | Line | Value | Context | Recommendation |
|---|---|---|---|---|
| `src/lib/export-utils.ts` | 467 | `rgba(128,128,128,0.25)` | iframe border in export | Use `var(--border-default)` |
| `src/lib/export-utils.ts` | 492 | `rgba(128,128,128,0.25)` | iframe border in export | Use `var(--border-default)` |
| `src/components/console/PlanDiffViewer.tsx` | 247 | `rgba(239,68,68,0.06)` | diff background | Use `danger` token with opacity |
| `src/components/console/PlanDiffViewer.tsx` | 249 | `rgba(34,197,94,0.06)` | diff background | Use `success` token with opacity |
| `src/components/console/PlanDiffViewer.tsx` | 251 | `rgba(245,158,11,0.06)` | diff background | Use `warning` token with opacity |
| `src/components/workflow/ProgressBar.tsx` | 69 | `rgba(148,163,184,0.15)` | progress track | Use `var(--text-tertiary)` with opacity |
| `src/components/workflow/ProgressBar.tsx` | 118 | `rgba(148,163,184,0.12)` | progress segment | Use `var(--text-tertiary)` with opacity |
| `src/components/workflow/LiveActivityRail.tsx` | 307 | `rgba(148,163,184,0.12)` | activity rail track | Use `var(--text-tertiary)` with opacity |
| `src/components/onboarding/OnboardingTour.tsx` | 142 | `rgba(0,0,0,0.55)` | SVG overlay fill | Use `var(--bg-canvas)` with opacity or `rgba(0,0,0,0.55)` as tour dim is acceptable |
| `src/components/onboarding/TourStep.tsx` | 172 | `rgb(0 0 0 / 0.25)` | boxShadow inline | Should use shadow token |
| `src/components/onboarding/WelcomeModal.tsx` | 97 | `rgb(0 0 0 / 0.35)` | boxShadow inline | Should use shadow token |
| `src/components/workflow/DAGMiniMap.tsx` | 212 | `rgba(0,0,0,0.15)` | boxShadow inline | Should use shadow token |
| `src/components/templates/QuickActions.tsx` | 196 | `rgba(32,184,205,0.4)` | shadow arbitrary | Should use `glow-sm` / `glow-md` tokens |
| `src/components/templates/QuickActions.tsx` | 198 | `rgba(32,184,205,0.5)` | shadow arbitrary | Should use `glow-sm` / `glow-md` tokens |
| `src/components/compare/DiffViewer.tsx` | 249 | `rgba(42,157,143,0.25)` | `<ins>` background | Use `success` token |
| `src/components/compare/DiffViewer.tsx` | 252 | `rgba(231,111,81,0.25)` | `<del>` background | Use `danger` token |

**Total `rgba()` hardcoded colors needing remediation: 15**

---

## 3. Shadow Token Compliance

### 3.1 Custom shadow tokens in `tailwind.config.ts`

```ts
boxShadow: {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.06), ...",
  md: "...",
  lg: "...",
  xl: "...",
  "shadow-low":    "...",   // ⚠️  produces `shadow-shadow-low` class
  "shadow-medium": "...",   // ⚠️  produces `shadow-shadow-medium` class
  "shadow-high":   "...",   // ⚠️  produces `shadow-shadow-high` class
  "glow-sm": "0 0 8px var(--accent-primary) / 0.25",
  "glow-md": "0 0 16px var(--accent-primary) / 0.20",
  "glow-lg": "0 0 32px var(--accent-primary) / 0.15",
  inset: "inset 0 2px 4px 0 rgb(0 0 0 / 0.04)",
  float: "0 8px 24px rgb(0 0 0 / 0.08)",
}
```

**Issue:** Keys `"shadow-low"`, `"shadow-medium"`, `"shadow-high"` have a redundant `shadow-` prefix. Tailwind already prepends `shadow-` to boxShadow keys, so the generated class names become:
- `shadow-shadow-low` ❌
- `shadow-shadow-medium` ❌
- `shadow-shadow-high` ❌

**Fix:** Rename to `"low"`, `"medium"`, `"high"` so classes become `shadow-low`, `shadow-medium`, `shadow-high`.

### 3.2 Hardcoded shadow values in components (not using tokens)

| File | Lines | Hardcoded Shadow |
|---|---|---|
| `src/components/discover/TemplateCard.tsx` | 39 | `hover:shadow-[0_10px_15px_-3px_rgb(0_0_0_/0.08)]` |
| `src/components/spaces/SpaceArtifactsTab.tsx` | 99 | `hover:shadow-[0_10px_15px_-3px_rgb(0_0_0_/0.05)]` |
| `src/components/library/WorkflowListItem.tsx` | 73 | `hover:shadow-[0_10px_15px_-3px_rgb(0_0_0_/0.05)]` |
| `src/components/layout/CommandPalette.tsx` | 280 | `shadow-[0_16px_48px_-8px_rgba(0,0,0,0.25)]` |
| `src/components/templates/QuickActions.tsx` | 136, 160 | `shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]` / `dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]` |
| `src/components/templates/QuickActions.tsx` | 196, 198 | `shadow-[0_4px_16px_-4px_rgba(32,184,205,0.4)]` / `hover:shadow-[0_6px_20px_-4px_rgba(32,184,205,0.5)]` |
| `src/components/templates/TemplateCard.tsx` | 89–90 | `hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)]` / `dark:hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)]` |
| `src/components/templates/TemplateLibrary.tsx` | 274–275 | `hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]` / `dark:hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)]` |
| `src/components/onboarding/WelcomeModal.tsx` | 96–97 | `boxShadow: "0 24px 48px -12px rgb(0 0 0 / 0.35), 0 12px 24px -8px rgb(0 0 0 / 0.2)"` |
| `src/components/onboarding/TourStep.tsx` | 171–172 | `boxShadow: "0 20px 40px -10px rgb(0 0 0 / 0.25), 0 8px 16px -6px rgb(0 0 0 / 0.1)"` |
| `src/components/onboarding/OnboardingTour.tsx` | 198 | `boxShadow: "0 0 0 2px var(--accent-primary)"` |
| `src/components/workflow/DAGMiniMap.tsx` | 212 | `boxShadow: '0 2px 12px rgba(0,0,0,0.15)'` |
| `src/components/workflow/ModelAvatar.tsx` | 72 | `boxShadow: \`0 0 0 ${s.ringGap}px var(--bg-canvas), 0 0 0 calc(...) ${color}\`` |
| `src/components/workflow/ModelAvatar.tsx` | 214 | `boxShadow: \`0 0 0 2px var(--bg-canvas)\`` |

**Recommendation:** Create additional shadow tokens in `tailwind.config.ts` for:
- Card hover elevations (low/medium/high with dark variants)
- Command palette / modal elevations
- Glow/accent shadows (`shadow-glow-sm` already exists — use it)
- Tour/modal overlay shadows

---

## 4. Border-Radius Token Compliance

### 4.1 Custom radius tokens in `tailwind.config.ts`

```ts
borderRadius: {
  xs:   "0.25rem",
  sm:   "0.375rem",
  md:   "0.5rem",
  lg:   "0.75rem",
  xl:   "1rem",
  "2xl":"1.25rem",
  "3xl":"1.5rem",
  pill: "9999px",
  full: "9999px",
  pill: "9999px",   // ⚠️ DUPLICATE KEY
}
```

**Issue:** `pill` is declared twice. The second declaration overwrites the first. JavaScript objects silently accept duplicate keys, but this is a maintenance risk.

**Fix:** Remove the duplicate `pill` line (line 129).

### 4.2 Hardcoded border-radius values

| File | Lines | Hardcoded Value | Context |
|---|---|---|---|
| `src/components/compare/DiffViewer.tsx` | 249, 252 | `border-radius:2px` | inline HTML style for diff highlights |
| `src/components/workflow/TaskRow.tsx` | 107–108 | `border-l-[3px]` | arbitrary border-left width |
| `src/components/ui/scroll-area.tsx` | 35, 37 | `p-[1px]` | 1px padding for scrollbar thumb |
| `src/components/ui/separator.tsx` | 21 | `h-[1px]`, `w-[1px]` | 1px separator line |

Most `rounded-2xl`, `rounded-xl`, `rounded-lg`, `rounded-md`, `rounded-sm`, `rounded-full` usage is **token-compliant** ✅.

---

## 5. Hardcoded Pixel Dimensions

### 5.1 Width / Height / Max-width / Max-height (arbitrary px values)

| File | Lines | Value | Context |
|---|---|---|---|
| `src/components/notifications/NotificationBell.tsx` | 55, 67 | `h-[18px]`, `w-[18px]`, `min-w-[18px]` | icon & badge sizing |
| `src/components/notifications/NotificationPanel.tsx` | 144, 169 | `max-h-[420px]` | panel max height |
| `src/components/layout/Toaster.tsx` | 157 | `h-[2px]` | progress bar height |
| `src/components/layout/Toaster.tsx` | 226 | `max-w-[400px]` | toast max width |
| `src/components/layout/CommandPalette.tsx` | 280 | `max-w-[640px]` | command palette width |
| `src/components/layout/KeyboardShortcuts.tsx` | 95 | `min-w-[24px]` | kbd shortcut min width |
| `src/components/library/FilterBar.tsx` | 107, 141, 155 | `w-[180px]`, `min-w-[120px]`, `min-w-[100px]` | filter inputs |
| `src/components/workflow/AnswerTab.tsx` | 62, 307 | `min-w-[16px]` | badge sizing |
| `src/components/workflow/WorkflowHeader.tsx` | 72 | `max-w-[1400px]` | header container |
| `src/components/workflow/ArtifactViewer.tsx` | 266 | `max-h-[600px]` | artifact scroll |
| `src/components/workflow/SourcesTab.tsx` | 48 | `min-w-[200px]` | source item |
| `src/components/analytics/ModelBreakdown.tsx` | 146 | `w-[220px]`, `h-[220px]`, `w-[260px]`, `h-[260px]` | donut chart |
| `src/components/analytics/UsageDashboard.tsx` | 190 | `max-w-[1280px]` | dashboard container |
| `src/components/analytics/TopWorkflows.tsx` | 195 | `max-w-[140px]`, `sm:max-w-[200px]` | table cell |
| `src/components/console/ConsoleTable.tsx` | 253 | `min-w-[140px]` | column menu |
| `src/components/console/AuditExplorer.tsx` | 395 | `w-[420px]` | side panel |
| `src/components/console/WorkflowInspector.tsx` | 463 | `w-[480px]` | side panel |
| `src/components/compare/SelectWorkflow.tsx` | 145–146 | `w-[320px]`, `max-h-[360px]` | dropdown |
| `src/components/compare/ArtifactCompare.tsx` | 156, 228 | `max-w-[120px]`, `max-w-[160px]` | checksum & label |
| `src/components/spaces/SpaceMemoryTab.tsx` | 107 | `max-w-[200px]` | memory entry |
| `src/components/connectors/ConnectorDrawer.tsx` | 262 | `max-w-[140px]` | table cell |
| `src/components/ui/toast.tsx` | 18 | `md:max-w-[420px]` | toast container |
| `src/components/ui/command.tsx` | 65 | `max-h-[300px]` | command list |

**Note:** Many of these are **one-off layout constraints** (e.g., `max-w-[640px]` for a modal, `w-[480px]` for a side panel) that are intentionally specific and don't map well to a spacing scale. These are **acceptable** as arbitrary values.

However, small repeated values like `h-[18px]`, `min-w-[18px]`, `min-w-[16px]`, `min-w-[24px]` should be standardized to `h-5` (20px), `h-4` (16px), etc. where close enough, or added to the Tailwind spacing scale.

---

## 6. Hardcoded Font Sizes (`text-[Npx]`)

The project defines a custom `2xs` font size in `tailwind.config.ts` (`0.625rem` = 10px). However, `text-[10px]`, `text-[11px]`, and `text-[12px]` are used extensively as arbitrary values.

| File | Count | Sizes Used |
|---|---|---|
| `src/components/console/*.tsx` | 15+ | `text-[10px]`, `text-[11px]` |
| `src/components/analytics/*.tsx` | 20+ | `text-[10px]`, `text-[11px]` |
| `src/components/compare/*.tsx` | 6+ | `text-[10px]`, `text-[11px]`, `text-[12px]` |
| `src/components/layout/*.tsx` | 5+ | `text-[10px]`, `text-[11px]` |
| `src/components/workflow/*.tsx` | 4+ | `text-[10px]` |
| `src/components/notifications/*.tsx` | 4+ | `text-[10px]`, `text-[11px]` |
| `src/components/library/*.tsx` | 2+ | `text-[10px]` |

**Recommendation:** Extend `tailwind.config.ts` fontSize scale with:
```ts
fontSize: {
  "3xs": ["0.625rem", { lineHeight: "0.875rem" }],  // 10px
  "2xs": ["0.6875rem", { lineHeight: "1rem" }],     // 11px
  "xs":  ["0.75rem",   { lineHeight: "1rem" }],     // 12px (already exists)
}
```

Then replace all `text-[10px]` → `text-3xs`, `text-[11px]` → `text-2xs`.

---

## 7. Hardcoded Z-Index Values

The project defines a comprehensive z-index token scale in `globals.css`:
```css
--z-base: 0; --z-dropdown: 100; --z-sticky: 200; --z-modal-backdrop: 300;
--z-modal: 400; --z-popover: 500; --z-toast: 600; --z-tooltip: 700;
--z-command: 800;
```

However, many components use Tailwind's built-in z-index utilities (`z-10`, `z-30`, `z-40`, `z-50`) instead of `z-[var(--z-*)]`.

| File | Lines | Value | Context |
|---|---|---|---|
| `src/components/console/ConsoleTable.tsx` | 253 | `z-50` | column action menu |
| `src/components/workflow/AnswerTab.tsx` | 75 | `z-50` | citation popover |
| `src/components/workflow/TaskRow.tsx` | 121 | `z-10` | step icon |
| `src/components/search/GlobalSearch.tsx` | 269 | `z-10` | search header |
| `src/components/layout/LeftRail.tsx` | 54 | `z-40` | sidebar |
| `src/components/layout/Header.tsx` | 29 | `z-30` | header |
| `src/components/layout/MobileNav.tsx` | 26 | `z-50` | mobile nav |
| `src/components/templates/QuickActions.tsx` | 124 | `z-50` | FAB |
| `src/components/analytics/*.tsx` | 3 files | `z-50` | chart tooltips |
| `src/components/compare/ArtifactCompare.tsx` | 174 | `z-10` | sticky header |
| `src/components/onboarding/*.tsx` | 3 files | `z-10` | tour overlay elements |
| `src/components/ui/*.tsx` | select, dialog, tooltip, popover, dropdown, command, table | `z-50`, `z-10` | Radix UI primitives |

**Recommendation:** Map `z-10` → `z-[var(--z-sticky)]` or `z-[var(--z-base)]`, `z-30` → `z-[var(--z-sticky)]`, `z-40` → `z-[var(--z-modal)]`, `z-50` → `z-[var(--z-popover)]` or `z-[var(--z-toast)]` depending on semantic intent. For Radix UI primitives, consider adding `zIndex` tokens to `tailwind.config.ts`:
```ts
zIndex: {
  dropdown: "var(--z-dropdown)",
  sticky: "var(--z-sticky)",
  modal: "var(--z-modal)",
  popover: "var(--z-popover)",
  toast: "var(--z-toast)",
  tooltip: "var(--z-tooltip)",
  command: "var(--z-command)",
}
```

---

## 8. Hardcoded Transition Durations (Framer Motion)

Framer Motion `transition={{ duration: ... }}` values are hardcoded throughout:

| File | Lines | Duration (s) | Token Equivalent |
|---|---|---|---|
| `src/components/layout/UserMenu.tsx` | 244 | 0.15 | `duration-fast` (150ms) ✅ close match |
| `src/components/layout/ThemeToggle.tsx` | 60, 70 | 0.25 | `duration-normal` (250ms) ✅ exact match |
| `src/components/layout/CommandPalette.tsx` | 268 | 0.15 | `duration-fast` (150ms) ✅ exact match |
| `src/components/layout/CommandPalette.tsx` | 279 | 0.20 | No exact token — use `duration-fast` or `duration-normal` |
| `src/components/layout/AppShell.tsx` | 27 | `duration-200` (200ms) | No exact token — between `fast` and `normal` |
| `src/components/layout/Toaster.tsx` | 142–143 | 0.2, 0.3 | Close to `duration-fast` / `duration-normal` |
| `src/components/layout/AnnouncementBanner.tsx` | 97 | 0.3 | `duration-normal` (250ms) ✅ close match |
| `src/components/layout/KeyboardShortcuts.tsx` | 223, 234 | 0.2 | `duration-fast` (150ms) ✅ close match |
| `src/components/onboarding/*.tsx` | 6 occurrences | 0.15–0.5 | Mix of `fast`/`normal`/`slow` |
| `src/components/templates/*.tsx` | 4 occurrences | `duration-200`, `duration-300` | Arbitrary Tailwind values |
| `src/components/notifications/*.tsx` | 3 occurrences | 0.15, 0.2, 2.0 | `fast`, `normal`, `emphasis` |
| `src/components/analytics/*.tsx` | 1 occurrence | 0.3 | `duration-normal` |

**Recommendation:** Define a Framer Motion duration helper or constants file:
```ts
export const DURATION = {
  instant: 0.05,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.45,
  emphasis: 0.60,
  dramatic: 0.80,
} as const;
```

---

## 9. `globals.css` Syntax Check

**Result: ✅ PASS**

- All braces balanced (`{` = `}`)
- All parentheses balanced (`(` = `)`)
- No missing semicolons detected before closing braces
- No duplicate CSS custom properties in `:root`
- No malformed `@layer`, `@tailwind`, or `@keyframes` rules

Minor notes:
- The `search-highlight` rule uses hardcoded `rgba(32, 184, 205, 0.18)` (line 234). This color is the accent primary (`#20B8CD`). Consider using `var(--accent-primary)` with CSS `color-mix()` once browser support is sufficient, or document the hardcoded value as intentional.
- The `.card` and `.surface-elevated` component classes (lines 148–166) use hardcoded `rgb(0 0 0 / 0.04)` shadows. These are in the CSS layer, not Tailwind, and serve as base component definitions. They are acceptable but could reference a `var(--shadow-sm)` custom property if one were added.

---

## 10. `tailwind.config.ts` Configuration Issues

| Issue | Severity | Location | Fix |
|---|---|---|---|
| Duplicate `pill` key in `borderRadius` | Medium | Lines 127 & 129 | Remove line 129 |
| Shadow token naming double-prefix | Medium | Lines 137–139 | Rename `"shadow-low"` → `"low"`, `"shadow-medium"` → `"medium"`, `"shadow-high"` → `"high"` |

---

## Summary of Remediation Actions

### 🔴 High Priority
1. **Replace hardcoded hex colors in UI components** (`#94a3b8`, `#20B8CD`, `#22c55e`, `#f59e0b`, `#8b5cf6`, `#fff`) with design token equivalents.
2. **Replace hardcoded `rgba()` colors** in diff backgrounds, progress bars, and activity rails with token-based colors.

### 🟡 Medium Priority
3. **Fix `tailwind.config.ts`** — remove duplicate `pill` key; rename shadow keys to remove `shadow-` prefix.
4. **Create additional shadow tokens** for card hover states, modals, and command palette.
5. **Standardize font size tokens** — add `text-3xs` (10px) and `text-2xs` (11px) to config.
6. **Create z-index token map** in `tailwind.config.ts` so components can use `z-dropdown`, `z-modal`, etc.
7. **Create Framer Motion duration constants** referencing the CSS duration tokens.
8. **Refactor hardcoded boxShadow inline styles** in `WelcomeModal`, `TourStep`, `DAGMiniMap` to use tokens.

### 🟢 Low Priority / Acceptable
9. Data/mock color palettes (charts, avatars, categories) — these are semantic colors for data visualization and are acceptable as hardcoded values.
10. PWA `<meta>` theme colors — acceptable.
11. Third-party brand colors (Stripe `#635BFF`) — acceptable.
12. One-off layout dimensions (`max-w-[640px]`, `w-[480px]`) — acceptable as arbitrary values.

---

*End of report.*
