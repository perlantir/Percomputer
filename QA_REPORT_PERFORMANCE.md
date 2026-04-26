# Frontend Performance Audit Report

**Project:** multi-model-agent-platform  
**Date:** 2025-01-09  
**Auditor:** AI Performance Auditor  
**Scope:** Core pages (`app/page.tsx`, `app/w/[id]/page.tsx`, `app/console/page.tsx`, `app/library/page.tsx`) and heavy components (`DAGVisualization.tsx`, `AnswerTab.tsx`, `WorkflowInspector.tsx`, `LiveActivityRail.tsx`)

---

## Executive Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| Dynamic / Lazy Loading | 🔴 Critical | 0 `next/dynamic` imports; all heavy components eagerly loaded |
| Image Optimization | 🟡 Warning | `next/image` never used; raw `<img>` tags or SVG icons only |
| Cytoscape Loading | 🔴 Critical | Static import; ~150KB+ gzipped added to initial bundle |
| Dependency Hygiene | 🔴 Critical | Unused packages; `@types/*` & `typescript` in `dependencies` |
| React-Markdown Efficiency | 🔴 Critical | `components` recreated per render; multiple ReactMarkdown mounts |
| List Virtualization | 🟡 Warning | No virtualization library; pagination only at 20 items/page |
| SSE Throttling | 🔴 Critical | State updated on every SSE message; no throttle/debounce |
| Re-render Control | 🔴 Critical | Inline component definitions, unmemoized columns, filter re-runs |
| Font Loading | 🟢 Good | `next/font/google` with `display: swap` |
| Bundle Size Estimate | 🔴 Critical | Likely **350–500KB+ initial JS** (well over 220KB target) |

**Overall Verdict:** The application will significantly exceed the 220KB initial JS budget. Multiple critical issues around eager loading of heavy libraries, absence of lazy loading, and inefficient React patterns are present. Priority fixes are dynamic imports for Cytoscape and console components, memoization of React-Markdown components, and SSE throttling.

---

## Critical Issues

### 1. Cytoscape & cytoscape-dagre loaded statically — adds ~150KB+ to initial bundle

- **File:** `src/components/workflow/DAGVisualization.tsx`
- **Lines:** 8–9
- **Severity:** 🔴 Critical
- **Description:** `cytoscape` and `cytoscape-dagre` are imported statically at the top of `DAGVisualization.tsx`. Cytoscape is a large graph-visualization library (~500KB raw, ~150KB+ gzipped). Because `DAGVisualization` is likely imported by `WorkflowInspector` (DAG mode) or other pages, this weight is pulled into the initial bundle even if the user never views a DAG.
- **Fix Recommendation:**
  1. Move `cytoscape` and `cytoscape-dagre` to a dynamic import inside a `useEffect`.
  2. Alternatively, wrap `DAGVisualization` in `next/dynamic` with `ssr: false`:
     ```tsx
     import dynamic from 'next/dynamic';
     const DAGVisualization = dynamic(() => import('./DAGVisualization'), {
       ssr: false,
       loading: () => <div className="h-full animate-skeleton" />,
     });
     ```
  3. If only the console page needs it, ensure the parent `WorkflowInspector` is also lazy-loaded.

---

### 2. No `next/dynamic` anywhere — every heavy component eagerly bundled

- **File:** `app/console/page.tsx`, `app/w/[id]/page.tsx`, `app/library/page.tsx`
- **Lines:** N/A (missing pattern)
- **Severity:** 🔴 Critical
- **Description:** A global grep for `next/dynamic` returned zero results. Heavy sub-components are all imported statically:
  - **Console page** (`app/console/page.tsx` lines 5–14) imports 8 distinct console views (`WorkflowInspector`, `PlanDiffViewer`, `CostQualityLeaderboard`, `RoutingPolicyEditor`, `SandboxPool`, `ProviderHealth`, `AuditExplorer`, `TenantAdmin`). Even though only one is active at a time, **all eight are bundled into the console page chunk**.
  - **Workflow detail page** (`app/w/[id]/page.tsx` lines 14–19) imports all four tabs (`AnswerTab`, `StepsTab`, `SourcesTab`, `ArtifactsTab`) statically. The `AnswerTab` alone pulls in `react-markdown`, `rehype-highlight`, and `framer-motion`.
- **Fix Recommendation:**
  - For `app/console/page.tsx`:
    ```tsx
    const pageComponents: Record<ConsolePage, React.ComponentType> = {
      'workflow-inspector': dynamic(() => import('@/src/components/console/WorkflowInspector')),
      'plan-diff':          dynamic(() => import('@/src/components/console/PlanDiffViewer')),
      'cost-quality':       dynamic(() => import('@/src/components/console/CostQualityLeaderboard')),
      // …etc
    };
    ```
  - For `app/w/[id]/page.tsx`, dynamically import the non-default tabs (especially `StepsTab` if it ever uses Cytoscape, and `AnswerTab` because of `react-markdown`/`framer-motion`).

---

### 3. `react-markdown` components recreated on every render — full tree remount

- **File:** `src/components/workflow/AnswerTab.tsx`
- **Lines:** 108–254 (`createMarkdownComponents` function)
- **Severity:** 🔴 Critical
- **Description:** `createMarkdownComponents()` is called inside `renderMarkdownWithCitations()` (line 257), which is called on every render of `AnswerTab`. Each call returns a fresh object with **new function references** for every markdown element (`code`, `a`, `h2`, `p`, `ul`, etc.). React uses component identity to decide whether to re-use DOM nodes; because the component references change every render, React **unmounts and remounts the entire markdown DOM tree** on every update. This is catastrophic for performance during streaming answer updates.
- **Fix Recommendation:**
  1. Define the markdown components object **once** outside the render path, and memoize it with `useMemo`:
     ```tsx
     const markdownComponents = useMemo(
       () => createMarkdownComponents(sources, onCitationClick),
       [sources, onCitationClick]
     );
     ```
  2. Better: move the static mappings (e.g., `h2`, `p`, `ul`) to a module-level constant and only inject `CitationChip`-related logic where needed.
  3. Consider replacing `framer-motion` citation tooltip (line 56–85) with a pure CSS `:hover` + `transition` tooltip to remove the `framer-motion` dependency from this component entirely.

---

### 4. `renderMarkdownWithCitations` splits text into multiple `ReactMarkdown` mounts

- **File:** `src/components/workflow/AnswerTab.tsx`
- **Lines:** 257–322
- **Severity:** 🔴 Critical
- **Description:** The function splits the markdown string at every `[^N]` citation and renders each fragment as a separate `<ReactMarkdown>` instance. A markdown document with 20 citations creates **21 `ReactMarkdown` component trees**. Each tree instantiates its own `rehype-highlight` pipeline and `components` mapping. This is extremely inefficient.
- **Fix Recommendation:**
  - Use a **single** `ReactMarkdown` pass with a custom `remark` plugin that transforms `[^N]` syntax into custom JSX nodes, or pre-process the AST with `remark-parse` and render citations as children inside a unified tree. Alternatively, wrap the entire output in one `ReactMarkdown` and use a lightweight string-replace that inserts placeholder span IDs, then map over the final nodes.

---

### 5. SSE state updates on every event — no throttling or `requestAnimationFrame` batching

- **File:** `src/hooks/useWorkflowEvents.ts`
- **Lines:** 113–141 (`es.onmessage`)
- **Severity:** 🔴 Critical
- **Description:** On every SSE message, the hook calls `setEvents([...buf])` and `setConnection(...)`. If a workflow emits 50 events per second, React re-renders all consumers 50 times per second. The buffer cap is 500 events, but the state update frequency is unbounded. This causes cascading re-renders of `LiveActivityRail`, `WorkflowDetailPage`, and any component subscribed to events.
- **Fix Recommendation:**
  1. **Throttle** state updates with `requestAnimationFrame` or a `setTimeout` batch (e.g., 100–200ms):
     ```tsx
     const pendingRef = useRef<WorkflowEvent[]>([]);
     const rafRef = useRef<number | null>(null);

     const flush = useCallback(() => {
       rafRef.current = null;
       setEvents([...eventBufferRef.current]);
     }, []);

     es.onmessage = (evt) => {
       // …parse…
       buf.push(parsed);
       if (!rafRef.current) {
         rafRef.current = requestAnimationFrame(flush);
       }
     };
     ```
  2. In `useWorkflowRun.ts` (lines 158–220), similarly batch the multiple `setStatus`, `setWorkflow`, `setEvents`, `setBudget`, `setSynthesisTokenCount` calls that fire on a single message.

---

### 6. Console page bundles all 8 sub-views into one chunk

- **File:** `app/console/page.tsx`
- **Lines:** 5–24
- **Severity:** 🔴 Critical
- **Description:** The console page is an operator dashboard. Each sub-view (`WorkflowInspector`, `PlanDiffViewer`, `CostQualityLeaderboard`, `RoutingPolicyEditor`, `SandboxPool`, `ProviderHealth`, `AuditExplorer`, `TenantAdmin`) is imported statically and mapped in a `pageComponents` record. Because only one is ever rendered at a time, the other seven are dead code for that render, but they all end up in the **same JS chunk** sent to the browser. This likely adds 100KB+ to the console page bundle.
- **Fix Recommendation:** Replace the static record with dynamic imports as shown in Issue #2. Each view will then become a separate webpack / Turbopack chunk, loaded on demand when the operator clicks the nav item.

---

### 7. `AnswerTab` uses `framer-motion` for a simple hover tooltip

- **File:** `src/components/workflow/AnswerTab.tsx`
- **Lines:** 54–85 (`CitationChip` hover tooltip)
- **Severity:** 🟡 Warning
- **Description:** `framer-motion` is imported (line 6) and used only for a tooltip fade-in/out animation in the citation chip. `framer-motion` is ~40–60KB gzipped. A CSS-only tooltip with `opacity` + `transform` + `transition` can achieve the same effect at zero JS cost.
- **Fix Recommendation:** Replace `motion.div` + `AnimatePresence` with:
  ```tsx
  <div className="opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0">
    {/* tooltip content */}
  </div>
  ```
  Then remove the `framer-motion` import from `AnswerTab.tsx` (and evaluate removing it from the project if unused elsewhere).

---

### 8. Unused / misplaced dependencies in `package.json`

- **File:** `package.json`
- **Lines:** 21–70 (`dependencies`)
- **Severity:** 🔴 Critical
- **Description:** Several dependencies bloat the bundle or are misplaced:
  1. **`react-cytoscapejs`** (line 39) — never imported in any audited file. `DAGVisualization.tsx` uses raw `cytoscape`, not the React wrapper. **~20KB+ dead weight.**
  2. **`@types/react-cytoscapejs`** (line 40) — only needed if `react-cytoscapejs` is used.
  3. **`typescript`** (line 25), **`@types/node`** (line 26), **`@types/react`** (line 27), **`@types/react-dom`** (line 28) — these are **development-only** packages but listed under `dependencies`. Next.js does not tree-shake `@types/*` from client bundles automatically; they may leak into server builds and increase install size.
  4. **`remark`** (line 51) and **`rehype`** (line 52) — imported directly? A grep shows they are not directly imported in the audited files. `react-markdown` bundles its own unified pipeline. These may be dead weight unless used in other files.
  5. **`bcryptjs`**, **`jsonwebtoken`** — server-side libraries. Ensure no client component imports them transitively (e.g., through a shared `types` barrel). If they end up in a client chunk, they add significant weight.
  6. **`tailwindcss`**, **`postcss`**, **`autoprefixer`** — build tools that should be in `devDependencies`.
- **Fix Recommendation:**
  - Move all `@types/*`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer` to `devDependencies`.
  - Audit whether `react-cytoscapejs` and `remark`/`rehype` are used anywhere; remove if not.
  - Ensure server-only packages (`bcryptjs`, `jsonwebtoken`) are never imported by client components. Use a `server-only` marker or separate server/client entry points.

---

### 9. No `next/image` usage anywhere in audited components

- **File:** All audited pages/components
- **Severity:** 🟡 Warning
- **Description:** A grep for `next/image` across the entire `app/` and `src/` tree returned zero results. The project configures `formats: ["image/avif", "image/webp"]` in `next.config.ts` (line 6) but no components leverage `next/image` for automatic format negotiation, lazy loading, or sizing. Any images used (e.g., source favicons, avatars, artifact previews) will be served as unoptimized `<img>` tags.
- **Fix Recommendation:** Replace all `<img>` tags with `next/image` where possible. For external images, add the relevant `remotePatterns` (already wildcard-enabled, so this is easy). Use `priority` for above-the-fold images and `loading="lazy"` for the rest.

---

### 10. `WorkflowInspector.tsx` columns array recreated on every render

- **File:** `src/components/console/WorkflowInspector.tsx`
- **Lines:** 178–249 (`columns` array)
- **Severity:** 🟡 Warning
- **Description:** The `columns` array (containing JSX renderers) is declared inline inside the component body. React sees new function references for every `render` cell on each render. While `ConsoleTable` may not react to this, it wastes memory and forces potential child re-renders if `ConsoleTable` does shallow prop comparison.
- **Fix Recommendation:** Move `columns` definition outside the component (module scope) or memoize it with `useMemo`.

---

### 11. `DAGVisualization` status-bar filters re-run on every render

- **File:** `src/components/workflow/DAGVisualization.tsx`
- **Lines:** 362–378 (status bar JSX)
- **Severity:** 🟡 Warning
- **Description:** The status bar JSX contains inline `.filter()` calls:
  ```tsx
  {plan.tasks.filter((t) => t.status === 'running').length} running
  {plan.tasks.filter((t) => t.status === 'succeeded').length} done
  ```
  These run on every React render (which could be frequent if parent re-renders). With large DAGs, this becomes O(n × 4) per render.
- **Fix Recommendation:** Pre-compute counts in `useMemo`:
  ```tsx
  const counts = useMemo(() => {
    let running = 0, succeeded = 0, failed = 0;
    for (const t of plan.tasks) {
      if (t.status === 'running') running++;
      else if (t.status === 'succeeded') succeeded++;
      else if (t.status === 'failed') failed++;
    }
    return { running, succeeded, failed, total: plan.tasks.length };
  }, [plan.tasks]);
  ```

---

### 12. `WorkflowInspector` DAG SVG not virtualized — will choke on large task lists

- **File:** `src/components/console/WorkflowInspector.tsx`
- **Lines:** 354–432 (`DAGPlaceholder`)
- **Severity:** 🟡 Warning
- **Description:** `DAGPlaceholder` renders every task as an SVG `<g>` node. The demo has 24 tasks; real-world workflows could have hundreds. SVG DOM nodes are expensive, and the component lacks virtualization or canvas rendering. Switching to the real `DAGVisualization` (Cytoscape) would help, but that itself is not lazy loaded.
- **Fix Recommendation:** If real DAGs can exceed ~50 nodes, either keep using Cytoscape (it is optimized for this) but lazy-load it, or implement a canvas-based mini-DAG. For the table view, consider `react-window` or `@tanstack/react-virtual` when row counts exceed 100.

---

### 13. `useWorkflowEvents` ring buffer splice mutates shared array in place

- **File:** `src/hooks/useWorkflowEvents.ts`
- **Lines:** 129–134
- **Severity:** 🟡 Warning
- **Description:**
  ```ts
  buf.push(parsed);
  if (buf.length > EVENT_BUFFER_LIMIT) {
    buf.splice(0, buf.length - EVENT_BUFFER_LIMIT);
  }
  eventBufferRef.current = buf;
  ```
  The `buf` is the same array reference held in `eventBufferRef.current`. The `splice` mutates it in place. While this is a ref (not state), the pattern is fragile. More importantly, `setEvents([...buf])` clones the array on every message, which is O(n) where n=500.
- **Fix Recommendation:** Use a proper ring buffer with head/tail indices to avoid `splice` re-indexing and full array clones. Or, better yet, keep events in a ref and only expose a throttled slice to React state.

---

### 14. `app/page.tsx` imports large demo data file for fake API call

- **File:** `app/page.tsx`
- **Lines:** 8–10, 12–18
- **Severity:** 🟡 Warning
- **Description:** The home page imports `DEMO_WORKFLOWS` from `@/src/data/demo-workflows` and includes a fake `fetchRecentWorkflows` that returns a slice after a 300ms `setTimeout`. `demo-workflows.ts` is 656 lines long. Because `page.tsx` is a client component ("use client"), this data file is bundled into the client JS and evaluated at runtime.
- **Fix Recommendation:**
  1. Remove the fake delay; it harms perceived performance.
  2. If the demo data is large, fetch it from an API route or use `fetch` so the data is not embedded in the JS bundle.
  3. Or, at minimum, move `DEMO_WORKFLOWS` to a server-side API route and have `page.tsx` fetch it.

---

### 15. `app/library/page.tsx` filter logic runs on every render without memoization guards

- **File:** `app/library/page.tsx`
- **Lines:** 82–92
- **Severity:** 🟡 Warning
- **Description:** `allKinds` (line 82) and `filtered`/`sortWorkflows` (line 88) are wrapped in `useMemo`, which is good. However, `sortWorkflows` and `filterWorkflows` allocate new arrays on every dependency change. The `filterWorkflows` function (line 43) also calls `w.tasks.some()` for every workflow when a `kind` filter is active, which is O(m × n). For large libraries this is heavy.
- **Fix Recommendation:** For production, move filtering/sorting to the server (API route with query params) so the client only receives the paginated result set.

---

### 16. `next.config.ts` enables `cacheComponents` experimental flag

- **File:** `next.config.ts`
- **Lines:** 12–14
- **Severity:** 🟢 Info
- **Description:** The `experimental.cacheComponents` flag is enabled. This is a positive signal for performance in Next.js 15, allowing React Server Components to be cached. However, most audited pages are "use client" and therefore won't benefit from RSC caching.
- **Note:** Keep this flag, but focus on converting non-interactive parts of pages to Server Components to leverage it.

---

## Positive Findings

1. **Font loading is optimal** — `layout.tsx` uses `next/font/google` with `Inter`, `subsets: ["latin"]`, `display: "swap"`, and CSS variable (`--font-inter`). No flash of invisible text (FOIT).
2. **`LiveActivityRail` is wrapped in `React.memo`** — The component correctly uses `React.memo` and derives expensive state via `useMemo`, preventing unnecessary re-renders when parent updates.
3. **`useCallback` used in key handlers** — `app/w/[id]/page.tsx` uses `useCallback` for `handleCitationClick`, `handleCancel`, `handleAmend`, `handleShare`.
4. **`next.config.ts` image formats configured** — AVIF and WebP are enabled; just needs components to use `next/image`.

---

## Recommended Action Plan (Priority Order)

| Priority | Action | Estimated Bundle Impact |
|----------|--------|------------------------|
| **P0** | Wrap `DAGVisualization` in `next/dynamic` with `ssr: false` | −150KB+ initial |
| **P0** | Convert console sub-views to dynamic imports | −100KB+ initial |
| **P0** | Memoize `createMarkdownComponents` in `AnswerTab`; unify to single `ReactMarkdown` | Eliminates DOM thrashing |
| **P0** | Throttle SSE state updates in `useWorkflowEvents` / `useWorkflowRun` | Reduces re-render cascade |
| **P1** | Remove `framer-motion` from `AnswerTab` (CSS tooltip) | −40KB+ gzipped |
| **P1** | Clean up `package.json`: move types to devDeps, remove unused `react-cytoscapejs` / `remark` / `rehype` | −30KB+ install & client |
| **P1** | Move `DEMO_WORKFLOWS` data out of client bundle (API route) | −Data bloat |
| **P2** | Memoize `DAGVisualization` status counts | Micro-optimization |
| **P2** | Move `WorkflowInspector` columns to module scope | Micro-optimization |
| **P2** | Adopt `next/image` for any images | Better LCP & format negotiation |
| **P3** | Add list virtualization for large tables / DAGs | Future-proofing |

---

## Appendix: Bundle Size Estimate

| Library / Component | Estimated Raw | Estimated Gzipped |
|---------------------|--------------|-------------------|
| Cytoscape + dagre | ~500KB | ~150KB |
| react-markdown + rehype-highlight | ~300KB | ~80KB |
| framer-motion | ~130KB | ~40KB |
| @radix-ui/* (8 packages) | ~150KB | ~40KB |
| lucide-react (tree-shaken) | ~50KB | ~15KB |
| tanstack react-query | ~40KB | ~12KB |
| date-fns | ~30KB | ~10KB |
| next-themes + cmdk | ~40KB | ~12KB |
| Demo data (workflows, memory, spaces) | ~50KB | ~15KB |
| Console views (8×) | ~100KB | ~30KB |
| **Total estimate** | **~1.4MB** | **~400KB+** |

With all critical fixes applied, the initial JS for a given route should drop closer to the 220KB target:
- Lazy-loading Cytoscape + console views → **~−200KB gzipped**
- Removing framer-motion → **~−40KB gzipped**
- Cleaning dead deps → **~−20KB gzipped**
- **Result:** ~140–180KB gzipped initial JS per route (within target).

---

*End of report*
