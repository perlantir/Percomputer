# Performance Verification Report — Build Verification 7

> **Project:** Multi-Model Agent Platform  
> **Date:** 2024-06-01  
> **Auditor:** Frontend Performance Audit  
> **Scope:** Dynamic imports, framer-motion usage, image optimization, bundle bloat, font loading

---

## Executive Summary

| Category | Status | Issues |
|----------|--------|--------|
| Dynamic Imports | ✅ Mostly Good | 4 files use `next/dynamic` correctly |
| framer-motion | ⚠️ Overused | 21 components import it; always in main bundle |
| next/image | ❌ Missing | 0 usage; `<img>` tags used instead |
| Bundle Bloat | ⚠️ Concerns | All pages are `"use client"`; 108KB+ demo data |
| Font Loading | ⚠️ Partial | Inter loaded correctly; custom fonts never loaded |

**Critical Issues:** 2  
**Warnings:** 5  
**Recommendations:** 8

---

## 1. Dynamic Imports Verification

### ✅ Correctly Dynamic-Imported Components

| File | Dynamic Import | SSR | Notes |
|------|---------------|-----|-------|
| `app/console/page.tsx` | 8 console panels (WorkflowInspector, PlanDiffViewer, CostQualityLeaderboard, RoutingPolicyEditor, SandboxPool, ProviderHealth, AuditExplorer, TenantAdmin) | `false` | ✅ Only loads the active tab |
| `app/w/[id]/page.tsx` | AnswerTab, StepsTab, SourcesTab, ArtifactsTab | `false` | ✅ Tab content split into chunks |
| `src/components/workflow/DAGVisualization.tsx` | DAGVisualizationCore | `false` | ✅ Cytoscape only loads when needed |
| `src/components/templates/TemplateCard.tsx` | 20 Lucide icons individually | `false` | ⚠️ Overly granular; `optimizePackageImports` already handles lucide |

### ⚠️ Cytoscape Import Chain

The heavy `cytoscape` + `cytoscape-dagre` libraries are imported in:
- `src/lib/cytoscape-config.ts`
- `src/components/workflow/DAGVisualizationCore.tsx`
- `src/components/workflow/DAGMiniMap.tsx`
- `src/components/workflow/DAGNode.tsx`

These are **indirectly** lazy-loaded because `DAGVisualizationCore` is wrapped in `next/dynamic` in `DAGVisualization.tsx`. The dynamic boundary is one layer above. This is acceptable but fragile—if someone imports `DAGVisualizationCore` directly, cytoscape enters the main bundle.

**Recommendation:** Add a code comment or ESLint rule to prevent direct imports of `DAGVisualizationCore`.

### ⚠️ AnswerTab with react-markdown

`AnswerTab.tsx` imports `react-markdown` + `rehype-highlight` (significant weight: ~50KB+ gzipped). It **is** dynamically imported from `app/w/[id]/page.tsx`, so it does not bloat the main bundle. ✅

---

## 2. framer-motion Usage Audit

framer-motion is imported in **21 components**. Since **every page is a Client Component** (`"use client"`), framer-motion is unconditionally included in the initial JS bundle.

### Always-Mounted Layout Components (Justified)

| Component | Motion Usage | Justification |
|-----------|-------------|---------------|
| `Toaster.tsx` | `motion`, `AnimatePresence`, `useReducedMotion` | Toast enter/exit animations |
| `CommandPalette.tsx` | `motion`, `AnimatePresence` | Modal open/close |
| `UserMenu.tsx` | `motion`, `AnimatePresence` | Dropdown animation |
| `ThemeToggle.tsx` | `motion`, `AnimatePresence` | Icon morph |
| `AnnouncementBanner.tsx` | `motion`, `AnimatePresence` | Banner dismiss |
| `KeyboardShortcuts.tsx` | `motion`, `AnimatePresence` | Modal animation |

### Analytics Components (Can Be Lazy-Loaded)

| Component | Motion Usage |
|-----------|-------------|
| `UsageChart.tsx` | `motion.rect`, `motion.path`, `motion.div`, `AnimatePresence` |
| `CostTrend.tsx` | `motion`, `AnimatePresence` |
| `ModelBreakdown.tsx` | `motion`, `AnimatePresence` |
| `TopWorkflows.tsx` | `motion` |
| `UsageDashboard.tsx` | `motion` |

These are **dead code** — `UsageDashboard` and its children are not imported by any page in `app/` or any other component outside `src/components/analytics/`. They were likely intended for a `/usage` or `/analytics` page that does not exist.

**Critical Recommendation:** Remove or dynamically import the entire `src/components/analytics/` folder. The components are unused and pull framer-motion into the build verification graph even if tree-shaken.

### Workflow Components (Justified but Heavy)

| Component | Motion Usage |
|-----------|-------------|
| `AnswerTab.tsx` | `motion`, `AnimatePresence` |
| `ClarificationCard.tsx` | `motion`, `AnimatePresence`, `useReducedMotion` |
| `ModelAvatar.tsx` | `motion` |
| `StreamingCursor.tsx` | `motion` |

These are fine since `AnswerTab` is already lazy-loaded. The others are small UI flourishes.

### Onboarding Components (Conditionally Mounted)

| Component | Motion Usage |
|-----------|-------------|
| `WelcomeModal.tsx` | `motion`, `AnimatePresence` |
| `OnboardingChecklist.tsx` | `motion`, `AnimatePresence` |
| `OnboardingTour.tsx` | `AnimatePresence`, `motion` |
| `TourStep.tsx` | `motion`, `AnimatePresence` |

These only render during onboarding. Justified.

### Notification Components (Justified)

| Component | Motion Usage |
|-----------|-------------|
| `NotificationBell.tsx` | `motion`, `AnimatePresence` |
| `NotificationPanel.tsx` | `motion`, `AnimatePresence` |
| `NotificationItem.tsx` | `motion` |

### UI Primitives

| Component | Motion Usage |
|-----------|-------------|
| `animated-number.tsx` | `motion`, `useSpring` |
| `animated-list.tsx` | `motion`, `AnimatePresence`, `Variants` |

These are shared primitives. Justified.

---

## 3. Image Optimization (next/image)

### ❌ Critical: No `next/image` Usage Anywhere

Zero imports of `next/image` were found in the entire codebase. The project uses raw `<img>` tags instead.

### Offending Files

| File | Line | Issue |
|------|------|-------|
| `src/components/workflow/CitationPopover.tsx` | 21 | `<img src={source.favicon}>` — no width/height, no optimization |
| `src/components/layout/UserMenu.tsx` | 202, 252 | `<img src={avatarUrl}>` — avatar images unoptimized |

### Impact

- No automatic WebP/AVIF conversion
- No responsive sizing
- No lazy loading by default
- No blur placeholder
- Layout shift risk (no explicit dimensions in CitationPopover)

**Critical Recommendation:** Replace all `<img>` tags with `next/image` and configure `next.config.ts` domains. At minimum:

```tsx
// CitationPopover.tsx
import Image from "next/image";

<Image src={source.favicon} alt="" width={20} height={20} className="rounded-sm" />
```

---

## 4. Bundle Bloat Audit

### ❌ All Pages Are Client Components

Every page in `app/` has `"use client"`:
- `app/page.tsx`
- `app/discover/page.tsx`
- `app/library/page.tsx`
- `app/w/[id]/page.tsx`
- `app/compare/page.tsx`
- `app/settings/page.tsx`
- `app/spaces/[id]/page.tsx`
- `app/connectors/page.tsx`
- `app/console/page.tsx`

**Impact:** Server Components are one of Next.js App Router's primary performance benefits. By marking every page as a Client Component, the entire React tree for each page is shipped as JavaScript. Static markup, SEO, and initial paint performance are all degraded.

**Recommendation:** Remove `"use client"` from pages that do not directly use browser APIs or React hooks. Push the boundary down to the specific component that needs it (e.g., `Composer`, `CommandPalette`, etc.).

### ⚠️ Large Mock Data Files

| File | Size |
|------|------|
| `src/data/demo-workflows.ts` | 44 KB |
| `src/data/demo-memory.ts` | 16 KB |
| `src/data/demo-analytics.ts` | 12 KB |
| `src/data/demo-models.ts` | 12 KB |
| `src/data/demo-connectors.ts` | 8 KB |
| `src/data/demo-spaces.ts` | 4 KB |
| `src/data/demo-users.ts` | 4 KB |
| **Total** | **~108 KB** |

These files are imported by multiple pages. While they are tree-shaken reasonably well (pages import specific files, not the barrel file), the `demo-workflows.ts` (44KB) is imported by `page.tsx`, `library/page.tsx`, `w/[id]/page.tsx`, and several settings components.

**Mitigation:** Demo data is acceptable for a prototype, but for production, move mock data to API routes or server-only modules.

### ✅ Barrel File Not Abused

`src/data/index.ts` re-exports the entire mock layer, but no page imports from it. All imports are direct file imports. Good.

### ✅ No Heavy External Libraries

| Library | Status |
|---------|--------|
| Charting (recharts, d3, chart.js) | ❌ Not used — `UsageChart` uses raw SVG |
| Diff engine (diff-match-patch, etc.) | ❌ Not used — `DiffViewer` is custom LCS |
| Code editor (monaco, codemirror) | ❌ Not used |
| Date library (date-fns) | ✅ Used, listed in `optimizePackageImports` |
| Markdown (react-markdown) | ✅ Used, but lazy-loaded |

### ✅ Package Import Optimization

`next.config.ts` correctly lists:
```ts
optimizePackageImports: [
  "lucide-react",
  "@radix-ui/react-dialog",
  // ... all radix packages
  "date-fns",
]
```

### ✅ Bundle Analyzer Available

`@next/bundle-analyzer` is installed as a devDependency. Not currently configured in `next.config.ts`.

**Recommendation:** Enable it for CI:
```ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
```

---

## 5. Font Loading Verification

### ✅ Inter Font (Correctly Loaded)

```tsx
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
```

- Uses `next/font/google` ✅
- Subset to Latin only ✅
- `display: "swap"` prevents FOIT ✅
- CSS variable exported ✅

### ⚠️ Custom Fonts Referenced But Never Loaded

`globals.css` declares:
```css
--font-display: "FK Display", ui-sans-serif, system-ui, ...;
--font-body: "FK Grotesk Neue", ui-sans-serif, system-ui, ...;
--font-mono: "Berkeley Mono", ui-monospace, ...;
```

These are **commercial/proprietary fonts** that are never imported or loaded. Browsers will immediately fall back to system fonts. There is no `@font-face` declaration, no `next/font/local` setup, and no CDN link.

**Recommendation:** Either:
1. Load them via `next/font/local` if you have the font files
2. Remove the custom font references from CSS to avoid confusion
3. Document that they are intentionally placeholders

---

## Findings Summary

| # | Severity | Finding | File(s) |
|---|----------|---------|---------|
| 1 | 🔴 Critical | No `next/image` usage anywhere | `CitationPopover.tsx`, `UserMenu.tsx` |
| 2 | 🔴 Critical | Every page is `"use client"` | All `app/**/page.tsx` |
| 3 | 🟡 Warning | Unused analytics components pull framer-motion | `src/components/analytics/*.tsx` |
| 4 | 🟡 Warning | 108KB+ of mock data in client bundle | `src/data/demo-*.ts` |
| 5 | 🟡 Warning | Custom fonts declared but never loaded | `globals.css` |
| 6 | 🟡 Warning | TemplateCard dynamic-imports each Lucide icon individually | `TemplateCard.tsx` |
| 7 | 🟢 Good | Console tabs dynamically imported | `app/console/page.tsx` |
| 8 | 🟢 Good | Workflow tabs dynamically imported | `app/w/[id]/page.tsx` |
| 9 | 🟢 Good | Cytoscape DAG visualization lazy-loaded | `DAGVisualization.tsx` |
| 10 | 🟢 Good | react-markdown lazy-loaded via AnswerTab | `app/w/[id]/page.tsx` |
| 11 | 🟢 Good | `optimizePackageImports` configured | `next.config.ts` |
| 12 | 🟢 Good | Inter font optimally loaded | `app/layout.tsx` |

---

## Action Items (Prioritized)

1. **Replace `<img>` with `next/image`** — CitationPopover and UserMenu
2. **Refactor pages to Server Components** — Remove `"use client"` from pages; push boundary to leaf components
3. **Remove or lazy-load analytics components** — They are unused dead code
4. **Enable bundle analyzer** — Add `@next/bundle-analyzer` to `next.config.ts`
5. **Load custom fonts or remove declarations** — Add `next/font/local` or clean up CSS
6. **Simplify TemplateCard icon imports** — `optimizePackageImports` already deduplicates lucide; individual dynamic imports add HTTP overhead for marginal gain
7. **Consider moving mock data to API routes** — Reduces client bundle by ~50-100KB
8. **Add ESLint rule** — Prevent direct import of `DAGVisualizationCore` (enforce via `DAGVisualization` wrapper)

---

*End of Performance Verification Report*
