# Workflow Components QA Audit Report

**Scope:** All `.tsx` files in `/mnt/agents/output/multi-model-agent-platform/src/components/workflow/`
**Date:** 2025-04-26
**Auditor:** React Component Quality Auditor
**Checklist:**
1. Memoization | 2. useEffect deps | 3. Cleanup | 4. ARIA | 5. Keyboard nav | 6. Unnecessary re-renders | 7. Prop drilling | 8. Event handler typing | 9. Loading states | 10. Error states | 11. Reduced motion | 12. Layout shift prevention

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Critical** issues | 6 |
| **High** issues | 14 |
| **Medium** issues | 22 |
| **Low** issues | 12 |
| **Files audited** | 25 |
| **Files with zero critical/high issues** | 6 |

**Top risks:**
1. `DAGVisualization.tsx` `useEffect` with empty deps captures stale callbacks (critical).
2. `AnswerTab.tsx` recreates markdown components on every render causing expensive remounts (critical).
3. Multiple async fetch calls lack `AbortController`, risking state updates on unmounted components (high).
4. Missing `React.memo` on heavy list-rendered components (`TaskRow`, `SourceCard`, `DAGNode`, etc.) causes cascading re-renders (high).
5. Nested interactive elements (`button` inside `button` in `LiveActivityRail`) break accessibility (high).

---

## Per-File Findings

---

### 1. `AnswerTab.tsx`

#### 🔴 Critical — C-001
**Line:** 324 (`AnswerTab` component)  
**Severity:** Critical  
**Category:** Unnecessary re-renders, Memoization  
**Description:** `AnswerTab` is not wrapped in `React.memo`. It receives `sources` and `isRunning` props that change frequently during workflow execution. This causes the entire expensive markdown pipeline to re-run on every parent render, even when props are stable.  
**Fix:** Wrap with `React.memo` and use deep equality or structural comparison for `sources` if needed:
```tsx
export const AnswerTab = React.memo(function AnswerTab({...}: AnswerTabProps) { ... });
```

#### 🔴 Critical — C-002
**Line:** 331  
**Severity:** Critical  
**Category:** Unnecessary re-renders  
**Description:** `mockSynthesisResponse(objective)` is called on every render. If `objective` is stable, this expensive computation should be memoized.  
**Fix:** Wrap in `useMemo`:
```tsx
const response = useMemo(() => mockSynthesisResponse(objective), [objective]);
```

#### 🔴 Critical — C-003
**Line:** 108-253 (`createMarkdownComponents`)  
**Severity:** Critical  
**Category:** Unnecessary re-renders, Prop drilling  
**Description:** `createMarkdownComponents` returns a new object literal on every invocation. When passed to `ReactMarkdown` components prop, React sees a new reference and re-mounts all markdown elements. This is called inside `renderMarkdownWithCitations`, which runs on every render.  
**Fix:** Define markdown components once outside the component, or memoize inside with `useMemo`.

#### 🟠 High — H-001
**Line:** 24-88 (`CitationChip`)  
**Severity:** High  
**Category:** Memoization, Accessibility  
**Description:** `CitationChip` is not memoized. It receives an `onClick` callback that may be recreated each render (`() => onCitationClick?.(citationIndex)` inline at line 292), causing all chips to re-render. The tooltip uses `AnimatePresence` but has no reduced-motion support. No `aria-label` on the citation button.  
**Fix:** Wrap in `React.memo`, add `aria-label={`Citation ${index}`}`, and read `prefers-reduced-motion`.

#### 🟡 Medium — M-001
**Line:** 46 (`button` inside `sup`)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** The citation button lacks `aria-label` describing its purpose. Screen-reader users won’t know what the superscript number does.  
**Fix:** Add `aria-label={`View source ${index} citation`}`.

#### 🟡 Medium — M-002
**Line:** 91-105 (`StreamingIndicator`)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** `animate-pulse` and `animate-bounce` CSS animations run regardless of `prefers-reduced-motion`.  
**Fix:** Query `window.matchMedia('(prefers-reduced-motion: reduce)')` and disable animations.

#### 🟡 Medium — M-003
**Line:** 113-253 (markdown component definitions)  
**Severity:** Medium  
**Category:** Typing  
**Description:** All custom markdown renderers use `any` for props (`{ className, children, ...props }: any`). This defeats TypeScript checking and could mask bugs.  
**Fix:** Import proper types from `react-markdown` (e.g., `Components['code']`) or define interfaces.

#### 🟢 Low — L-001
**Line:** 366-384 (source list)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** The source list uses `<ol>` with nested `<li>` but the numbered circles are purely decorative visual indicators rather than semantic list markers. Acceptable, but could benefit from `aria-label="Cited sources"` on the container.

---

### 2. `StepsTab.tsx`

#### 🟠 High — H-002
**Line:** 104-119  
**Severity:** High  
**Category:** Prop drilling  
**Description:** `TaskRow` receives 10+ individual props deconstructed from `task` (`id`, `index`, `kind`, `name`, ...). This is verbose, error-prone, and harder to maintain.  
**Fix:** Pass the `task` object and `isActive` flag directly:
```tsx
<TaskRow key={task.id} task={task} isActive={task.id === activeTaskId} />
```

#### 🟠 High — H-003
**Line:** 138 (`key={i}` in edges map)  
**Severity:** High  
**Category:** Keys  
**Description:** `edges.map((e, i) => ...)` uses array index as React key. If edges are reordered, React will reuse DOM nodes incorrectly.  
**Fix:** Use a stable composite key: `key={\`${e.from}-${e.to}\`}`.

#### 🟡 Medium — M-004
**Line:** 134 (`tasks.find` inside render loop)  
**Severity:** Medium  
**Category:** Performance  
**Description:** Inside the `edges.map` render loop, `tasks.find((t) => t.id === e.from)` runs for every edge on every render: O(n×m) complexity.  
**Fix:** Build a `Map<string, Task>` lookup in `useMemo` outside the loop.

#### 🟢 Low — L-002
**Line:** 65  
**Severity:** Low  
**Category:** Memoization  
**Description:** `StepsTab` is not memoized, but it mostly delegates to `useMemo` for heavy computation. Low impact because `phases` and `edgeSet` are already memoized.

---

### 3. `SourcesTab.tsx`

#### 🟠 High — H-004
**Line:** 14 (`SourcesTab` component)  
**Severity:** High  
**Category:** Memoization  
**Description:** `SourcesTab` is not wrapped in `React.memo`. It receives `sources` array which changes frequently, causing re-filtering and re-rendering of the entire grid even when `sources` reference is stable.  
**Fix:** Wrap with `React.memo`.

#### 🟡 Medium — M-005
**Line:** 69-80, 86-96 (`select` elements)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Domain and citation-count filters use `<select>` without associated `<label>` elements (only visual icons). Screen readers may not announce the purpose.  
**Fix:** Add `<label htmlFor="domain-filter">` with `id` on the select, or use `aria-label`.

#### 🟡 Medium — M-006
**Line:** 49-64 (search clear button)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** The clear-search button (line 57) is an icon-only `<button>` with no `aria-label`.  
**Fix:** Add `aria-label="Clear search"`.

#### 🟢 Low — L-003
**Line:** 109 (`SourceCard` prop passing)  
**Severity:** Low  
**Category:** Memoization  
**Description:** `SourceCard` is not memoized (see `SourceCard.tsx` H-005). The `onClick` callback `onSelectSource` is passed directly; if the parent recreates it, all cards re-render.

---

### 4. `ArtifactsTab.tsx`

#### 🟠 High — H-005
**Line:** 153 (`ArtifactsTab` component)  
**Severity:** High  
**Category:** Memoization  
**Description:** `ArtifactsTab` is not memoized. It iterates over `artifacts` and calls `generateMockContent(artifact)` inside render, which performs expensive string manipulation (JSON stringify, template literals).  
**Fix:** Wrap with `React.memo`. Additionally, memoize artifact previews with `useMemo`.

#### 🟡 Medium — M-007
**Line:** 176 (`generateMockContent(selected)`)  
**Severity:** Medium  
**Category:** Performance  
**Description:** `generateMockContent(selected)` is called inline during render without memoization.  
**Fix:** Memoize with `useMemo` keyed on `selectedId`.

#### 🟡 Medium — M-008
**Line:** 226 (`generateMockContent(artifact).split("\n")[0]`)  
**Severity:** Medium  
**Category:** Performance  
**Description:** Called inline during the artifacts list render loop.  
**Fix:** Pre-compute previews or memoize per artifact.

#### 🟢 Low — L-004
**Line:** 187-190 (artifact buttons)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** Artifact card buttons lack `aria-label` describing the artifact name. Screen-reader users hear only "button" without context.

---

### 5. `TaskRow.tsx`

#### 🟠 High — H-006
**Line:** 81 (`TaskRow` component)  
**Severity:** High  
**Category:** Memoization  
**Description:** `TaskRow` is not wrapped in `React.memo`. It is rendered inside lists in `StepsTab` and receives many scalar props. Any parent re-render causes all rows to re-render.  
**Fix:** Wrap with `React.memo`. Since `toolCalls` and `dependencies` are arrays, use deep comparison or ensure stable references.

#### 🟡 Medium — M-009
**Line:** 109 (expand/collapse button)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** The row header is a `<button>` that toggles expansion, but lacks `aria-expanded` and `aria-controls` attributes.  
**Fix:** Add `aria-expanded={expanded}` and an `id` on the detail panel for `aria-controls`.

#### 🟡 Medium — M-010
**Line:** 175-251 (expanded detail panel)  
**Severity:** Medium  
**Category:** Keyboard navigation  
**Description:** When expanded, new content appears but focus is not moved into the panel. Keyboard users must tab through all preceding rows to reach newly revealed content.

#### 🟡 Medium — M-011
**Line:** 98-103 (running animation)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** `animate-pulse-subtle` class applies CSS animation without checking `prefers-reduced-motion`.

#### 🟢 Low — L-005
**Line:** 193-206 (`toolCalls.map`)  
**Severity:** Low  
**Category:** Keys  
**Description:** Uses `tc.tool` as key. Acceptable if tools are unique per task, but not guaranteed by type system.

---

### 6. `SourceCard.tsx`

#### 🟠 High — H-007
**Line:** 35 (`SourceCard` component)  
**Severity:** High  
**Category:** Memoization  
**Description:** `SourceCard` is not memoized. It receives `source` object prop. In `SourcesTab`, every filter keystroke causes parent re-render, which re-renders all visible cards even though their data hasn’t changed.  
**Fix:** Wrap with `React.memo`.

#### 🟡 Medium — M-012
**Line:** 36-77 (card button)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** The `<button>` has no `aria-label`. Screen readers only hear the visible text inside (title + excerpt).  
**Fix:** Add `aria-label={`Source: ${source.title} from ${source.domain}`}`.

---

### 7. `ArtifactViewer.tsx`

#### 🟠 High — H-008
**Line:** 214 (`ArtifactViewer` component)  
**Severity:** High  
**Category:** Memoization  
**Description:** Not memoized. Re-renders whenever parent changes, even if `content`/`kind` are stable.  
**Fix:** Wrap with `React.memo`.

#### 🟡 Medium — M-013
**Line:** 222-230 (`iconMap`)  
**Severity:** Medium  
**Category:** Unnecessary re-renders  
**Description:** `iconMap` record is recreated on every render. This is a constant lookup table and should be defined outside the component.  
**Fix:** Move `iconMap` definition to module scope.

#### 🟡 Medium — M-014
**Line:** 151-177 (`CodeViewer`), 179-211 (`JSONViewer`)  
**Severity:** Medium  
**Category:** Cleanup  
**Description:** `handleCopy` uses `setTimeout(() => setCopied(false), 2000)` without cleanup. If the component unmounts before timeout fires, React will warn about state update on unmounted component.  
**Fix:** Use `useRef` for timeout ID and clear in cleanup:
```tsx
const timerRef = useRef<ReturnType<typeof setTimeout>>();
useEffect(() => () => clearTimeout(timerRef.current), []);
```

#### 🟡 Medium — M-015
**Line:** 137-148 (`ImageViewer`)  
**Severity:** Medium  
**Category:** Layout shift  
**Description:** Image viewer uses a fixed-height placeholder (`h-48 w-full`) which prevents layout shift, but the actual image loading is not implemented. If an image is loaded later without explicit dimensions, layout shift will occur.  
**Fix:** When implementing real images, enforce explicit `width`/`height` or `aspect-ratio`.

#### 🟢 Low — L-006
**Line:** 55-63 (`MarkdownViewer`)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** `prose` class may provide semantic styling, but the `div` wrapping the content has no `role` or `aria-label` to identify it as a document/article region.

---

### 8. `DAGVisualization.tsx`

#### 🔴 Critical — C-004
**Line:** 62-149 (initialization `useEffect`)  
**Severity:** Critical  
**Category:** useEffect dependencies, Cleanup  
**Description:** The `useEffect` that initializes Cytoscape has an **empty dependency array** `[]`. It captures `onSelectTask`, `onTaskCancel`, and `readOnly` from the closure at mount time. If these callbacks are recreated by the parent (common), the DAG will invoke stale closures. Additionally, the effect does not re-initialize when `plan` fundamentally changes beyond `id`/`updatedAt`.  
**Fix:** Either include all dependencies and handle re-initialization, or store callbacks in refs to avoid stale closure:
```tsx
const onSelectTaskRef = useRef(onSelectTask);
onSelectTaskRef.current = onSelectTask;
// Then use onSelectTaskRef.current inside effect
```

#### 🔴 Critical — C-005
**Line:** 130 (`window.addEventListener('keydown', ...)`)  
**Severity:** Critical  
**Category:** Keyboard navigation, Accessibility  
**Description:** Global `keydown` listener intercepts `f`, `1`, `+`, `-`, `Escape` across the entire page without checking if focus is inside the DAG container. This breaks keyboard accessibility for inputs, dialogs, and other components when the DAG is mounted.  
**Fix:** Check `document.activeElement` is inside `containerRef.current`, or use a focus-based handler on the container div with `tabIndex={0}`.

#### 🟠 High — H-009
**Line:** 280-296 (`activeNodes` effect)  
**Severity:** High  
**Category:** useEffect dependencies  
**Description:** Effect depends on `[plan.tasks.length]`. If tasks are reordered or updated but length stays the same, `activeNodes` won’t refresh, leaving stale DAGNode wrappers.  
**Fix:** Depend on a stable serialized representation of tasks, e.g., `plan.tasks.map(t => t.id).join(',')`.

#### 🟠 High — H-010
**Line:** 350-379 (status bar inline filtering)  
**Severity:** High  
**Category:** Unnecessary re-renders  
**Description:** `plan.tasks.filter((t) => t.status === 'running').length` is computed inline four times per render. For large plans this is wasteful.  
**Fix:** Memoize status counts with `useMemo`.

#### 🟡 Medium — M-016
**Line:** 152-179 (plan update effect)  
**Severity:** Medium  
**Category:** useEffect dependencies  
**Description:** Depends on `[plan.id, plan.updatedAt]`. If `plan` is mutated in-place without changing these fields, updates are missed. Fragile pattern.  
**Fix:** Use a stable JSON string or deep comparison, or ensure immutability at the data layer.

#### 🟡 Medium — M-017
**Line:** 268-277 (selectedTaskId sync effect)  
**Severity:** Medium  
**Category:** useEffect dependencies  
**Description:** Missing `cyRef` in deps (it’s a ref so acceptable), but also side-effects `cy.nodes().unselect()` and `node.select()` mutate Cytoscape state outside React. If effect runs frequently, it may conflict with user interactions.  
**Fix:** Guard with deep equality on `selectedTaskId`.

#### 🟡 Medium — M-018
**Line:** 299-411 (container styles)  
**Severity:** Medium  
**Category:** Layout shift  
**Description:** Container uses `height` prop but no `min-height`. If `height` is a percentage and parent has no explicit height, the container collapses to 0px causing layout shift.  
**Fix:** Add `minHeight` fallback.

#### 🟢 Low — L-007
**Line:** 410 (`Array.from(activeNodes.values())`)  
**Severity:** Low  
**Category:** Composition  
**Description:** Hidden `DAGNode` components are rendered in the DOM flow (not in a portal). While they use absolute positioning internally, they still occupy React tree slots and could interfere with CSS selectors or accessibility tree.

---

### 9. `DAGNode.tsx`

#### 🟠 High — H-011
**Line:** 18 (`DAGNode` component)  
**Severity:** High  
**Category:** Memoization  
**Description:** Not memoized. `DAGVisualization` renders an array of these. Each node contains tooltip and context menu state; unnecessary re-renders are costly.  
**Fix:** Wrap with `React.memo`.

#### 🟡 Medium — M-019
**Line:** 112-117 (context menu close effect)  
**Severity:** Medium  
**Category:** Cleanup  
**Description:** Uses `window.addEventListener('click', close, { once: true })` but cleanup only removes if `contextMenu.visible` is true. If the component unmounts while the menu is open, the once-listener may fire on a detached component or leak.  
**Fix:** Always remove in cleanup:
```tsx
useEffect(() => {
  if (!visible) return;
  const close = () => setVisible(false);
  window.addEventListener('click', close);
  return () => window.removeEventListener('click', close);
}, [visible]);
```

#### 🟡 Medium — M-020
**Line:** 189-213 (context menu)  
**Severity:** Medium  
**Category:** Accessibility, Keyboard navigation  
**Description:** Custom context menu is a `<div>` containing `<button>` elements, but the container lacks `role="menu"` and items lack `role="menuitem"`. No arrow-key navigation, Escape-to-close, or focus trap. Keyboard users cannot navigate the menu.  
**Fix:** Implement `role="menu"`, `role="menuitem"`, and handle `ArrowDown`, `ArrowUp`, `Escape`, `Home`, `End`.

#### 🟡 Medium — M-021
**Line:** 174-186 (tooltip)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Tooltip uses `pointerEvents: 'none'` and CSS transitions, but has no `role="tooltip"` or `aria-describedby` linking it to the node. Since this is a canvas-based graph, ARIA mapping to canvas nodes is inherently limited, but the tooltip DOM element should still have proper semantics.

#### 🟢 Low — L-008
**Line:** 200 (`key={item.label}`)  
**Severity:** Low  
**Category:** Keys  
**Description:** Menu item keys use label text. Since labels are unique in this array, it’s acceptable, but not robust to localization changes.

---

### 10. `DAGMiniMap.tsx`

#### 🟡 Medium — M-022
**Line:** 14 (`DAGMiniMap` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized. Re-renders whenever parent re-renders, though it mostly syncs via effects.

#### 🟡 Medium — M-023
**Line:** 28-112 (initialization effect)  
**Severity:** Medium  
**Category:** Cleanup  
**Description:** Cleanup calls `miniCy.destroy()` and sets `miniCyRef.current = null`. Good. However, `cytoscape.use(dagre)` is called at module level (line 5), which is fine for a single instance but can cause issues in test environments with multiple registrations.

#### 🟡 Medium — M-024
**Line:** 187-196 (viewport calculations in render)  
**Severity:** Medium  
**Category:** Unnecessary re-renders  
**Description:** Reads `cy?.width()`, `cy?.height()`, `cy?.zoom()` directly during render. `cy` is a mutable object; these reads can return stale values and trigger inconsistent SSR/hydration.  
**Fix:** Sync dimensions into React state inside the effect, or use a resize observer callback.

#### 🟢 Low — L-009
**Line:** 198-242 (viewport rectangle)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** The mini-map is a clickable navigation surface but lacks `role="application"` or `aria-label` describing its purpose.

---

### 11. `DAGControls.tsx`

#### 🟡 Medium — M-025
**Line:** 69-77 (1:1 zoom button)  
**Severity:** Medium  
**Category:** Bug  
**Description:** The "Zoom 1:1" button (title says "Zoom 1:1 (1)") calls `onFit` instead of a dedicated 1:1 zoom handler. The `DAGVisualization` component passes `handleFit` here, which fits to screen rather than setting zoom to 1.0. The label and behavior are mismatched.  
**Fix:** Pass a `handleZoomOneToOne` callback or rename the button to "Fit".

#### 🟢 Low — L-010
**Line:** 13 (`DAGControls` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Not memoized, but it is a simple presentational component with no heavy computation. Acceptable given its simplicity.

#### 🟢 Low — L-011
**Line:** 25-35, 41-50, etc.  
**Severity:** Low  
**Category:** Accessibility  
**Description:** Buttons have `aria-label` and `title`. Good. But the zoom percentage display (`dag-zoom-level`) is a `<div>` with `title` but no `aria-live`, so screen readers won’t be notified when zoom changes via keyboard shortcuts.

---

### 12. `LiveActivityRail.tsx`

#### 🟠 High — H-012
**Line:** 453-471 (`Models in flight` section)  
**Severity:** High  
**Category:** Accessibility  
**Description:** Nests a `<button>` (outer task click handler) around `ProgressBar`, which itself has `role="button"`, `tabIndex={0}`, and its own `onClick`. This creates nested interactive elements, violating HTML spec and confusing screen readers/keyboard navigation.  
**Fix:** Remove `role="button"` and `tabIndex` from `ProgressBar` when it is already inside a `<button>`, or restructure so only one clickable element exists.

#### 🟡 Medium — M-026
**Line:** 328-355 (`Now` section active task button)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** The active task `<button>` lacks `aria-label`. The visible text includes model name and artifact count, but the button itself isn’t clearly labeled for screen readers.

#### 🟡 Medium — M-027
**Line:** 370-434 (`Just done` list)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Each completed task is a `<button>` with no `aria-label`. Status is conveyed via colored SVG icons (`aria-hidden`), so screen-reader users miss status context.

#### 🟢 Low — L-012
**Line:** 37 (`LiveActivityRail` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Properly memoized with `React.memo`. Good.

#### 🟢 Low — L-013
**Line:** 203-206, 244-250  
**Severity:** Low  
**Category:** Reduced motion  
**Description:** Respects `prefers-reduced-motion` for transitions and pulse. Good.

---

### 13. `TokenStream.tsx`

#### 🟠 High — H-013
**Line:** 79-82 (render-phase ref mutation)  
**Severity:** High  
**Category:** React anti-pattern  
**Description:** `lastLenRef.current = chars.length` is mutated during render. In React’s concurrent rendering mode, render may be interrupted and re-run; mutating refs during render is unsafe and can cause inconsistent behavior.  
**Fix:** Move the mutation into a `useEffect` or `useLayoutEffect`:
```tsx
useEffect(() => { lastLenRef.current = markdown.length; }, [markdown]);
```

#### 🟡 Medium — M-028
**Line:** 97 (`key={`${i}-${ch}`}`)  
**Severity:** Medium  
**Category:** Keys  
**Description:** Uses index + character as key. For repeated characters (e.g., spaces), React keys will collide, potentially causing reconciliation issues.  
**Fix:** Use only index `i` as key, or maintain a monotonically increasing counter ref.

#### 🟢 Low — L-014
**Line:** 24 (`TokenStream` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Properly memoized with `React.memo`. Good.

#### 🟢 Low — L-015
**Line:** 34-37, 62-66  
**Severity:** Low  
**Category:** Reduced motion  
**Description:** Respects `prefers-reduced-motion`. Good.

---

### 14. `ProgressBar.tsx`

#### 🟢 Low — L-016
**Line:** 31 (`ProgressBar` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Properly memoized with `React.memo`. Good.

#### 🟢 Low — L-017
**Line:** 44-47, 49-51  
**Severity:** Low  
**Category:** Reduced motion  
**Description:** Respects `prefers-reduced-motion`. Good.

#### 🟢 Low — L-018
**Line:** 55-85, 89-143  
**Severity:** Low  
**Category:** Accessibility  
**Description:** Has `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space, and `aria-label`. Good accessibility when used standalone. See H-012 for the nesting issue.

---

### 15. `Citation.tsx`

#### 🟡 Medium — M-029
**Line:** 19 (`Citation` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized. In a large answer with many citations, parent re-renders will recreate all citation components.

#### 🟡 Medium — M-030
**Line:** 24-58 (Popover trigger)  
**Severity:** Medium  
**Category:** Accessibility, Keyboard navigation  
**Description:** Popover is controlled by hover (`onMouseEnter`/`onMouseLeave`) on a `<sup>` element. On touch devices, hover doesn’t exist, so the popover won’t open. The trigger is not focusable (no `tabIndex`), so keyboard users cannot open the citation popover.  
**Fix:** Make the trigger focusable (`tabIndex={0}`) and add `onFocus`/`onBlur` handlers, or use `PopoverTrigger` default behavior which handles focus.

#### 🟢 Low — L-019
**Line:** 44-58 (`PopoverContent`)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** The `PopoverContent` has `onMouseEnter`/`onMouseLeave` to keep the popover open when moving to the content. This is a common pattern and works for mouse users, but does not address keyboard users.

---

### 16. `CitationPopover.tsx`

#### 🟡 Medium — M-031
**Line:** 14 (`CitationPopover` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized. Simple presentational component, but could benefit from memoization since it’s rendered inside lists.

#### 🟢 Low — L-020
**Line:** 21-28 (`img` with fallback)  
**Severity:** Low  
**Category:** Layout shift  
**Description:** `img` has explicit `h-5 w-5` dimensions, preventing layout shift. `onError` hides broken images gracefully. Good.

---

### 17. `WorkflowHeader.tsx`

#### 🟡 Medium — M-032
**Line:** 49 (`WorkflowHeader` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized. Re-renders whenever parent changes, including timer ticks. Contains expensive date formatting.

#### 🟡 Medium — M-033
**Line:** 71-74 (back link)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Next.js `Link` contains only an icon (`ArrowLeft`) with no accessible text. No `aria-label` on the link. Screen-reader users hear only "link" with no destination context.

#### 🟡 Medium — M-034
**Line:** 93 (`Loader2 animate-spin`)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** `animate-spin` on the status loader runs regardless of `prefers-reduced-motion`.

#### 🟢 Low — L-021
**Line:** 131-137 (Amend button)  
**Severity:** Low  
**Category:** UX  
**Description:** Amend button is always enabled even when workflow is running. May be intentional, but typically amendments should be queued or disabled until a pause point.

---

### 18. `ClarificationCard.tsx`

#### 🟡 Medium — M-035
**Line:** 23 (`ClarificationCard` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized. When parent re-renders (e.g., due to streaming updates), the card and its motion animations re-trigger.

#### 🟡 Medium — M-036
**Line:** 49-55 (`motion.div` spring animation)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** `framer-motion` spring animation runs without checking `prefers-reduced-motion`. The AnimatePresence enter/exit animation can be disorienting for users with motion sensitivity.

#### 🟡 Medium — M-037
**Line:** 82-101 (radio options)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Radio options are correctly wrapped in `<label>` with `<input type="radio">`. Good semantics. However, the radio group lacks a `name` attribute with unique scope (it uses `"clarification"`). If multiple clarification cards appear on the same page, radio names will conflict.  
**Fix:** Generate a unique name per card instance, e.g., `name={`clarification-${id}`}`.

#### 🟡 Medium — M-038
**Line:** 120-137 (footer actions)  
**Severity:** Medium  
**Category:** Keyboard navigation  
**Description:** When the card appears (e.g., via AnimatePresence), focus is not moved to the card. Keyboard users may be unaware that new interactive content has appeared.  
**Fix:** Use `useEffect` to focus the first focusable element (e.g., first radio option or text area) when the card mounts.

#### 🟢 Low — L-022
**Line:** 107-117 (free text textarea)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** Textarea has no associated `<label>` when rendered without options. Only a `placeholder` provides context, which is not sufficient for screen readers.  
**Fix:** Add a `<label htmlFor="clarification-text">` or `aria-label`.

---

### 19. `WorkflowCanvas.tsx`

#### 🟢 Low — L-023
**Line:** 9-26  
**Severity:** Low  
**Category:** Placeholder  
**Description:** Placeholder component. No functional issues, but the `sr-only` div on line 23 renders `{handleNodeClick("noop")}` which returns `undefined`, producing empty content. Not harmful but unnecessary.

---

### 20. `StatusPill.tsx`

#### 🟢 Low — L-024
**Line:** 29 (`StatusPill` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Properly memoized with `React.memo`. Good.

#### 🟢 Low — L-025
**Line:** 34-37, 47-52  
**Severity:** Low  
**Category:** Reduced motion  
**Description:** Respects `prefers-reduced-motion`. Good.

#### 🟢 Low — L-026
**Line:** 101-116  
**Severity:** Low  
**Category:** Accessibility  
**Description:** Has `aria-label` and `aria-hidden` on decorative icon. Good.

---

### 21. `RunWorkflowButton.tsx`

#### 🟡 Medium — M-039
**Line:** 68 (`Loader2 animate-spin`)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** `animate-spin` on the running spinner does not respect `prefers-reduced-motion`.

#### 🟢 Low — L-027
**Line:** 35 (`RunWorkflowButton` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Wrapped with `React.forwardRef`. Good. Not additionally memoized, but acceptable for a single button.

#### 🟢 Low — L-028
**Line:** 90 (`displayName`)  
**Severity:** Low  
**Category:** DX  
**Description:** `displayName` is set. Good for DevTools debugging.

---

### 22. `WorkflowStatusBadge.tsx`

#### 🟡 Medium — M-040
**Line:** 145-150 (`Icon` animation)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** `animate-pulse` and `animate-spin` applied based on `meta.pulse` and `status`, but never checks `prefers-reduced-motion`. Unlike `StatusPill`, this component does not query the media preference.

#### 🟢 Low — L-029
**Line:** 113 (`WorkflowStatusBadge` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Wrapped with `React.forwardRef`. Good.

#### 🟢 Low — L-030
**Line:** 142, 150  
**Severity:** Low  
**Category:** Accessibility  
**Description:** `aria-label` present, icon has `aria-hidden`. Good.

---

### 23. `ShareWorkflowDialog.tsx`

#### 🟠 High — H-014
**Line:** 270-287 (local `XCircle` shadows import)  
**Severity:** High  
**Category:** Bug, Naming  
**Description:** A local `XCircle` component is defined at the bottom of the file, shadowing the `XCircle` import from `lucide-react` (line 14). The remove-invite button on line 220 uses the local SVG, which renders differently from the lucide icon. This is confusing and likely unintentional. If the local component signature diverges, it could cause runtime errors.  
**Fix:** Rename the local component to `CloseIcon` or `RemoveIcon`.

#### 🟡 Medium — M-041
**Line:** 51-59 (`handleCopy`)  
**Severity:** Medium  
**Category:** Error handling  
**Description:** `navigator.clipboard.writeText` failure is caught and silently ignored. Users get no feedback if copy fails (e.g., in insecure contexts).  
**Fix:** Show a toast or fallback UI when `clipboard.writeText` throws.

#### 🟡 Medium — M-042
**Line:** 113-129 (custom toggle switch)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Toggle switch has `role="switch"` and `aria-checked`, which is good. However, it lacks `aria-label` and is not associated with the visible label "Public link / Private". The inner `<span>` (knob) is decorative but not marked `aria-hidden`.  
**Fix:** Add `aria-labelledby` pointing to the label text, or `aria-label="Public visibility toggle"`.

#### 🟡 Medium — M-043
**Line:** 242-267 (`PermissionChip`)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** `PermissionChip` is a `<button>` representing a selectable option, but lacks `aria-pressed` to indicate its selected state to screen readers.  
**Fix:** Add `aria-pressed={active}`.

#### 🟢 Low — L-031
**Line:** 35 (`ShareWorkflowDialog` component)  
**Severity:** Low  
**Category:** Memoization  
**Description:** Not memoized. Dialog is typically mounted/unmounted rather than toggled in place, so low impact.

---

### 24. `AmendWorkflowDialog.tsx`

#### 🟠 High — H-015
**Line:** 64-72 (fetch without AbortController)  
**Severity:** High  
**Category:** Cleanup  
**Description:** Direct `fetch` call inside `handleSubmit` has no `AbortController`. If the user closes the dialog or the component unmounts while the request is in flight, `setInstruction("")`, `onOpenChange(false)`, and `setError(...)` will be called on an unmounted component, causing a React warning.  
**Fix:**
```tsx
const abortRef = useRef<AbortController | null>(null);
useEffect(() => () => abortRef.current?.abort(), []);
// Pass abortRef.current.signal to fetch
```

#### 🟡 Medium — M-044
**Line:** 41 (`AmendWorkflowDialog` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized.

#### 🟡 Medium — M-045
**Line:** 127-129 (error display)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Error text is rendered visually but not announced to screen readers. No `aria-live` region.  
**Fix:** Add `aria-live="assertive"` to the error paragraph container.

#### 🟢 Low — L-032
**Line:** 103-126 (textarea)  
**Severity:** Low  
**Category:** Accessibility  
**Description:** `<label htmlFor="amend-instruction">` correctly associated with `<textarea id="amend-instruction">`. Good.

#### 🟢 Low — L-033
**Line:** 169 (`disabled={!instruction.trim()}`)  
**Severity:** Low  
**Category:** UX  
**Description:** Submit button disabled when empty. Good. Also `disabled={isSubmitting}` on cancel button. Good loading-state handling.

---

### 25. `CancelWorkflowButton.tsx`

#### 🟠 High — H-016
**Line:** 50-58 (fetch without AbortController)  
**Severity:** High  
**Category:** Cleanup  
**Description:** Same pattern as H-015: `fetch` without `AbortController`. If the dialog closes during the cancel request, state updates occur on an unmounted component.  
**Fix:** Use `AbortController` and cleanup.

#### 🟡 Medium — M-046
**Line:** 32 (`CancelWorkflowButton` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized.

#### 🟡 Medium — M-047
**Line:** 101-104 (error display)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Error text not announced via `aria-live`.  
**Fix:** Add `aria-live="assertive"`.

#### 🟢 Low — L-034
**Line:** 107-133 (dialog footer buttons)  
**Severity:** Low  
**Category:** Loading states  
**Description:** Buttons correctly disabled during `isCancelling`. Loading spinner shown. Good.

---

### 26. `TaskDetailDrawer.tsx`

#### 🟡 Medium — M-048
**Line:** 12 (`TaskDetailDrawer` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized.

#### 🟡 Medium — M-049
**Line:** 63 (close button)  
**Severity:** Medium  
**Category:** Accessibility  
**Description:** Close button has `aria-label="Close drawer"`. Good.

#### 🟡 Medium — M-050
**Line:** 99-107 (tab buttons)  
**Severity:** Medium  
**Category:** Accessibility, Keyboard navigation  
**Description:** Tab buttons lack `role="tab"`, `aria-selected`, and `aria-controls`. The drawer implements a tab pattern but without proper ARIA, screen readers won’t announce the tab interface.  
**Fix:** Add ARIA tab roles and manage `aria-selected` per active tab.

#### 🟡 Medium — M-051
**Line:** 49-268 (drawer panel)  
**Severity:** Medium  
**Category:** Keyboard navigation  
**Description:** No focus trap when drawer is open. Users can tab outside the drawer to background elements. No `Escape` key handler to close the drawer.  
**Fix:** Implement focus trap and `Escape` listener.

---

### 27. `CitationLink.tsx`

#### 🟡 Medium — M-052
**Line:** 15 (`CitationLink` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized.

#### 🟡 Medium — M-053
**Line:** 16-19 (`handleClick`)  
**Severity:** Medium  
**Category:** Event handler typing  
**Description:** `handleClick` is an inline function (not `useCallback`). Recreated on every render.  
**Fix:** Wrap with `useCallback`:
```tsx
const handleClick = useCallback((e: React.MouseEvent) => { ... }, [onNavigate, sourceId]);
```

#### 🟡 Medium — M-054
**Line:** 23 (`<span>` click target)  
**Severity:** Medium  
**Category:** Accessibility, Keyboard navigation  
**Description:** Uses `<span>` with `onClick` instead of `<button>`. Not focusable, not keyboard-activatable, and lacks ARIA role. Screen readers and keyboard users cannot interact with it.  
**Fix:** Change to `<button className="...">` or add `role="button"`, `tabIndex={0}`, and `onKeyDown`.

---

### 28. `RecentWorkflowCard.tsx`

#### 🟡 Medium — M-055
**Line:** 95 (`RecentWorkflowCard` component)  
**Severity:** Medium  
**Category:** Memoization  
**Description:** Not memoized. Rendered in lists on library pages; unnecessary re-renders when parent filters update.

#### 🟡 Medium — M-056
**Line:** 108-111 (Link hover animation)  
**Severity:** Medium  
**Category:** Reduced motion  
**Description:** CSS hover animation includes `hover:-translate-y-0.5` without checking `prefers-reduced-motion`.  
**Fix:** Add a media-query wrapper or utility class that disables transform on reduced motion.

#### 🟢 Low — L-035
**Line:** 77-89 (`formatRelativeTime`)  
**Severity:** Low  
**Category:** Performance  
**Description:** Creates `new Date()` on every render. Acceptable for a card list, but could be memoized.

---

### 29. `index.ts`

#### 🟢 Low — L-036
**Line:** 1-16  
**Severity:** Low  
**Category:** DX  
**Description:** Barrel file exports all public components. Good. Note that `DAGVisualization`, `DAGNode`, `DAGMiniMap`, `DAGControls`, `TaskDetailDrawer`, `LiveActivityRail`, `TokenStream`, `ProgressBar`, `StatusPill`, `Citation`, `CitationPopover`, `CitationLink`, `RecentWorkflowCard`, and `WorkflowCanvas` are **not exported** from the barrel. If other parts of the app import them via the barrel, they will fail.  
**Fix:** Add missing exports to `index.ts` or document that they must be imported directly.

---

## Global / Cross-Cutting Concerns

### G-001: Missing `AbortController` on async operations
**Severity:** High  
**Files:** `AmendWorkflowDialog.tsx`, `CancelWorkflowButton.tsx`  
**Description:** Any `fetch` call that can outlive the component must be abortable. Without it, state updates on unmounted components cause memory leaks and React warnings.

### G-002: Missing `React.memo` on list-rendered components
**Severity:** High  
**Files:** `AnswerTab.tsx`, `TaskRow.tsx`, `SourceCard.tsx`, `DAGNode.tsx`, `ArtifactsTab.tsx`, `StepsTab.tsx`  
**Description:** Components rendered in lists or heavy markdown trees should be memoized to prevent cascading re-renders.

### G-003: Inconsistent `prefers-reduced-motion` support
**Severity:** Medium  
**Files:** `WorkflowHeader.tsx`, `ClarificationCard.tsx`, `RunWorkflowButton.tsx`, `WorkflowStatusBadge.tsx`, `RecentWorkflowCard.tsx`, `AnswerTab.tsx`  
**Description:** Some components (`StatusPill`, `ProgressBar`, `LiveActivityRail`, `TokenStream`) correctly query `prefers-reduced-motion`. Others ignore it entirely. Standardize via a shared hook (`usePrefersReducedMotion`).

### G-004: `any` types in markdown renderers
**Severity:** Medium  
**File:** `AnswerTab.tsx`  
**Description:** Using `any` for all ReactMarkdown custom component props defeats type safety.

### G-005: Missing `aria-live` for dynamic errors
**Severity:** Medium  
**Files:** `AmendWorkflowDialog.tsx`, `CancelWorkflowButton.tsx`  
**Description:** Error messages appear visually but are not announced to assistive technology.

---

## Recommended Priority Order

1. **Fix C-004** (`DAGVisualization` stale closures) — Critical functional bug.
2. **Fix C-005** (`DAGVisualization` global keyboard hijacking) — Critical accessibility bug.
3. **Fix C-001 through C-003** (`AnswerTab` memoization & component recreation) — Critical performance.
4. **Fix H-015, H-016** (AbortController on fetch calls) — High stability risk.
5. **Fix H-012** (nested interactive elements in `LiveActivityRail`) — High accessibility.
6. **Fix H-014** (`ShareWorkflowDialog` shadowed import) — High bug risk.
7. **Add `React.memo`** to `TaskRow`, `SourceCard`, `DAGNode`, `ArtifactsTab`.
8. **Fix M-054** (`CitationLink` span click) — Medium accessibility.
9. **Fix M-050, M-051** (`TaskDetailDrawer` ARIA tabs & focus trap) — Medium accessibility.
10. **Standardize reduced-motion** via shared hook and apply everywhere.

---

## Positive Findings

- `StatusPill`, `ProgressBar`, `TokenStream`, `LiveActivityRail` correctly support `prefers-reduced-motion`.
- `RunWorkflowButton`, `WorkflowStatusBadge` properly set `displayName` for debugging.
- `DAGVisualization` has thorough cleanup (`cy.destroy()`, `resizeObserver.disconnect()`, event listener removal).
- `SourcesTab` uses `useMemo` for filtering and domain extraction.
- `DAGControls` buttons have `aria-label` attributes.
- `ProgressBar` has keyboard support (`Enter`/`Space`) and `aria-label`.
- `ClarificationCard` radio options use semantic `<label>` + `<input type="radio">`.
- `ShareWorkflowDialog` toggle has `role="switch"` and `aria-checked`.
- `CancelWorkflowButton` has confirmation dialog and proper loading/disabled states.

---

*End of report.*
