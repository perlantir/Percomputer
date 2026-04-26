# End-to-End Flow Audit Report

**Project:** Multi-Model Agent Platform  
**Auditor:** Integration Auditor  
**Date:** Current Session  
**Scope:** 4 primary user flows across 15+ source files

---

## Executive Summary

| Flow | Status | Critical Issues | High Issues | Medium Issues | Low Issues |
|------|--------|-----------------|-------------|---------------|------------|
| Flow 1: Home → Composer → Submit → Workflow Detail | 🔴 Broken | 2 | 1 | 2 | 0 |
| Flow 2: Library → View Workflow → Share/Amend/Cancel | 🔴 Broken | 1 | 2 | 2 | 1 |
| Flow 3: Discover → Fork Template → New Workflow | 🔴 Broken | 2 | 1 | 0 | 1 |
| Flow 4: Console → Workflow Inspector → Task Detail | 🟡 Partial | 0 | 1 | 3 | 2 |
| **Cross-cutting** | - | 1 | 1 | 1 | 0 |

**Overall Assessment:** The application has **critical disconnects between implemented components and the pages that should consume them**. Several fully-built dialog/button components exist but are never imported by the workflow detail page. The composer submission flow does not navigate to the created workflow. The fork flow creates non-existent workflow IDs. The console inspector uses hardcoded data only.

---

## Flow 1: Home → Composer → Submit → Workflow Detail

### Trace Path
```
app/page.tsx → Composer.tsx → useComposer.ts → [POST /api/workflows] → app/w/[id]/page.tsx
```

### Issues

#### F1-001: No post-submit navigation to workflow detail
- **Step:** Submit (useComposer.ts → submit())
- **Severity:** 🔴 **Critical**
- **Description:** After a successful POST to `/api/workflows`, `useComposer.submit()` resets the composer state (`setText("")`, clears attachments) and sets `isSubmitting = false`. It does **not** extract the created `workflowId` from the API response and does **not** navigate to `/w/{id}`. The user stays on the home page with no indication that a workflow was created.
- **File:** `src/hooks/useComposer.ts`, lines 122-181
- **Impact:** Users cannot complete the core "create workflow" flow. The app appears broken.
- **Fix Recommendation:**
  1. In `submit()`, parse the response to get the created workflow ID: `const { workflowId } = await res.json()`
  2. Use `useRouter()` inside `useComposer` (or accept a callback prop) to navigate: `router.push(\`/w/${workflowId}\`)`
  3. Alternatively, have `submit()` return the workflow ID and let `Composer.tsx` handle navigation.

#### F1-002: useWorkflowRun hook is completely orphaned
- **Step:** Submission / SSE streaming
- **Severity:** 🔴 **Critical**
- **Description:** `src/hooks/useWorkflowRun.ts` is a fully-implemented hook that creates workflows, subscribes to SSE events, tracks status, handles clarifications, and manages cancellation. It is exported from `src/hooks/index.ts` but **never imported or used by any page or component**. The Composer uses its own inferior `submit()` in `useComposer.ts` that has no SSE support and no real-time status tracking.
- **File:** `src/hooks/useWorkflowRun.ts` (entire file)
- **Impact:** Dead code. The application lacks real-time workflow execution feedback. Users cannot see live status updates.
- **Fix Recommendation:** Replace `useComposer.ts`'s `submit()` with `useWorkflowRun().run()`. Wire the Composer to use `useWorkflowRun` for submission and display live status. Or remove `useWorkflowRun` if it's truly not needed.

#### F1-003: Workflow detail silently falls back to wrong data for unknown IDs
- **Step:** Workflow Detail (`app/w/[id]/page.tsx`)
- **Severity:** 🟠 **High**
- **Description:** The page calls `getWorkflowById(workflowId)` and if the result is `undefined`, it silently falls back to `DEMO_WORKFLOWS[0]` (line 138). The user sees a completely different workflow without any error message or "not found" state.
- **File:** `app/w/[id]/page.tsx`, lines 135-138
- **Impact:** Users are misled about which workflow they're viewing. Forked workflows and new workflows will always show the first demo workflow.
- **Fix Recommendation:**
  ```tsx
  const demo = getWorkflowById(workflowId);
  if (!demo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh]">
        <h1>Workflow not found</h1>
        <p>The workflow ID "{workflowId}" does not exist.</p>
        <Link href="/library">Go to Library</Link>
      </div>
    );
  }
  ```

#### F1-004: Back button always routes to /library regardless of entry point
- **Step:** Workflow Detail → Back navigation
- **Severity:** 🟡 **Medium**
- **Description:** `WorkflowHeader.tsx` hardcodes the back link to `href="/library"` (line 70). If the user navigated to the workflow detail from Home, Discover, or Console, clicking back goes to Library instead of the previous page.
- **File:** `src/components/workflow/WorkflowHeader.tsx`, line 70
- **Impact:** Confusing navigation UX. Breaks browser back button mental model.
- **Fix Recommendation:** Use `router.back()` or pass an `onBack` prop/context to allow callers to specify the back destination. Consider using `document.referrer` or a breadcrumb context.

#### F1-005: No loading transition between submit and detail page
- **Step:** Submit → Navigation
- **Severity:** 🟡 **Medium**
- **Description:** After clicking submit, the composer textarea is disabled and shows `isSubmitting` state. However, once the API call completes and navigation should happen, there is no visual feedback during the navigation transition. The page just switches.
- **File:** `src/components/composer/Composer.tsx`, `src/hooks/useComposer.ts`
- **Impact:** Users may think the app is frozen or didn't respond.
- **Fix Recommendation:** Show a full-screen or inline loading overlay during the submit-to-navigate transition, or use Next.js `loading.tsx` for the `/w/[id]` route.

---

## Flow 2: Library → View Workflow → Share/Amend/Cancel

### Trace Path
```
app/library/page.tsx → WorkflowListItem.tsx → Link to /w/{id} → app/w/[id]/page.tsx → [Share/Amend/Cancel actions]
```

### Issues

#### F2-001: Share/Amend/Cancel components are NOT used in workflow detail page
- **Step:** Workflow Detail → Share/Amend/Cancel actions
- **Severity:** 🔴 **Critical**
- **Description:** The workflow detail page (`app/w/[id]/page.tsx`) does NOT import or use `ShareWorkflowDialog`, `AmendWorkflowDialog`, or `CancelWorkflowButton`. These three components are:
  - Fully implemented with proper UX (dialogs, confirmation, API calls)
  - Exported from `src/components/workflow/index.ts`
  - **Completely disconnected** from the actual UI
  
  Instead, the page uses inline mock implementations:
  - **Share:** `handleShare` uses `navigator.share` or `clipboard.writeText` + `alert("Link copied!")` — no dialog
  - **Amend:** `handleAmend` sets `showClarification = true` which renders a hardcoded `ClarificationCard` with a mock question — not the `AmendWorkflowDialog`
  - **Cancel:** `handleCancel` calls `alert("Cancel workflow (mock)")` — no confirmation dialog, no API call, does not use `CancelWorkflowButton`
- **Files:** `app/w/[id]/page.tsx` (lines 161-180), `src/components/workflow/ShareWorkflowDialog.tsx`, `src/components/workflow/AmendWorkflowDialog.tsx`, `src/components/workflow/CancelWorkflowButton.tsx`
- **Impact:** The fully-built share, amend, and cancel features are inaccessible. Users get sub-par inline mock behavior.
- **Fix Recommendation:** Import and use the three dialog/button components in `app/w/[id]/page.tsx`:
  ```tsx
  import { ShareWorkflowDialog } from "@/src/components/workflow/ShareWorkflowDialog";
  import { AmendWorkflowDialog } from "@/src/components/workflow/AmendWorkflowDialog";
  import { CancelWorkflowButton } from "@/src/components/workflow/CancelWorkflowButton";
  
  // Replace inline handlers with dialog state management
  const [shareOpen, setShareOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  
  // Use components instead of inline alerts
  ```

#### F2-002: Fork and Archive actions in WorkflowListItem are no-ops
- **Step:** Library → Workflow List Item actions
- **Severity:** 🟠 **High**
- **Description:** `WorkflowListItem` accepts `onFork` and `onArchive` props, but in `app/library/page.tsx` these are passed as empty functions: `onFork={() => {}}` and `onArchive={() => {}}` (lines 177-178). The buttons are visible and clickable but do nothing.
- **File:** `app/library/page.tsx`, lines 177-178
- **Impact:** Users click fork/archive and nothing happens. Appears broken.
- **Fix Recommendation:** Implement actual fork/archive handlers, or hide the buttons if not yet implemented.

#### F2-003: Bulk actions in Library are no-ops
- **Step:** Library → Bulk selection actions
- **Severity:** 🟡 **Medium**
- **Description:** The `handleBulkArchive`, `handleBulkShare`, and `handleBulkFork` functions (lines 111-119) only clear the selection set. They do not perform any actual bulk operations.
- **File:** `app/library/page.tsx`, lines 111-119
- **Impact:** Bulk selection UI is present but non-functional.
- **Fix Recommendation:** Either implement the bulk operations or disable/hide the bulk action buttons.

#### F2-004: No error state for workflow data fetch in Library
- **Step:** Library → Data loading
- **Severity:** 🟡 **Medium**
- **Description:** `useWorkflowsQuery` uses `initialData: DEMO_WORKFLOWS`, so the query never shows an error state. If a real API were used and failed, there is no `error` handling in the component.
- **File:** `app/library/page.tsx`, lines 57-63
- **Impact:** If the backend fails, users see stale demo data without knowing it's stale.
- **Fix Recommendation:** Add `error` state handling: show an error banner with a retry button when `useQuery` returns an error.

#### F2-005: Back button from workflow detail always goes to Library
- **Step:** Workflow Detail → Back navigation  
- **Severity:** 🟢 **Low**
- **Description:** Same as F1-004. When coming from Library this is correct, but for other entry points it's wrong.
- **Fix Recommendation:** See F1-004.

---

## Flow 3: Discover → Fork Template → New Workflow

### Trace Path
```
app/discover/page.tsx → TemplateCard.tsx → onFork → handleFork → router.push(`/w/${id}?objective=...`)
```

### Issues

#### F3-001: Fork creates non-existent workflow ID
- **Step:** Fork → Navigation to workflow detail
- **Severity:** 🔴 **Critical**
- **Description:** `handleFork` in `app/discover/page.tsx` (line 162-164) creates a fake ID: `const id = \`wf_fork_${template.id}\`` and navigates to `/w/${id}?objective=...`. This ID does not exist in `DEMO_WORKFLOWS`. When the workflow detail page loads, `getWorkflowById` returns `undefined` and falls back to `DEMO_WORKFLOWS[0]` — the user sees the Lithium Miners workflow instead of the forked template!
- **File:** `app/discover/page.tsx`, lines 162-164
- **Impact:** Forking a template shows the completely wrong workflow. The user is confused and the feature is broken.
- **Fix Recommendation:** 
  1. Call the real API to create a workflow from the template: `POST /api/workflows` with the template objective
  2. Use the returned workflow ID for navigation
  3. Or, at minimum, show a "Workflow not found" error page for unknown IDs instead of falling back

#### F3-002: objective query parameter is ignored by workflow detail page
- **Step:** Workflow Detail (after fork)
- **Severity:** 🔴 **Critical**
- **Description:** The fork navigation passes `?objective=${encodeURIComponent(template.objective)}` as a query parameter. However, `app/w/[id]/page.tsx` does not use `useSearchParams()` or read any query parameters. The `objective` is completely ignored.
- **File:** `app/w/[id]/page.tsx`
- **Impact:** Even if the forked workflow existed, its objective wouldn't be displayed from the query param.
- **Fix Recommendation:** Use `useSearchParams()` in the workflow detail page to read `objective` when the workflow is not found in demo data, and display it as a "pending" or "draft" workflow state.

#### F3-003: No actual workflow creation on fork
- **Step:** Fork action
- **Severity:** 🟠 **High**
- **Description:** The `handleFork` function does not call any API to create a workflow. It immediately redirects with a fabricated ID. There is no loading state, no error handling, and no confirmation.
- **File:** `app/discover/page.tsx`, lines 161-165
- **Impact:** Users think they forked a template but nothing was actually created.
- **Fix Recommendation:** 
  1. Add a loading state during fork
  2. Call `POST /api/workflows` with template data
  3. Navigate to the returned workflow ID on success
  4. Show error state on failure

#### F3-004: No loading state during fork
- **Step:** Fork action
- **Severity:** 🟢 **Low**
- **Description:** The fork is an instant `router.push()` with no visual feedback. Users don't know if the action is processing.
- **File:** `app/discover/page.tsx`, `src/components/discover/TemplateCard.tsx`
- **Fix Recommendation:** Add a loading spinner or disabled state to the Fork button during the creation/navigation process.

---

## Flow 4: Console → Workflow Inspector → Task Detail

### Trace Path
```
app/console/page.tsx → ConsoleNav → WorkflowInspector.tsx → [row click] → TaskDrawer (inline) or DAGVisualization.tsx → TaskDetailDrawer.tsx
```

### Issues

#### F4-001: TaskDetailDrawer is NOT used in console inspector
- **Step:** Console → Workflow Inspector → Task Detail
- **Severity:** 🟠 **High**
- **Description:** The `WorkflowInspector.tsx` component defines its own inline `TaskDrawer` component (lines 436-613) instead of using the exported `TaskDetailDrawer.tsx` from `src/components/workflow/TaskDetailDrawer.tsx`. The exported `TaskDetailDrawer` has a different design system (CSS class-based vs. Tailwind-based), different tabs (overview/prompt/tools/result/trace vs. prompt/completion/attempts/tools/spans), and different PII redaction patterns. `TaskDetailDrawer` IS used by `DAGVisualization.tsx`, so it's not completely dead code, but the console inspector does not use it.
- **File:** `src/components/console/WorkflowInspector.tsx` (inline `TaskDrawer`), `src/components/workflow/TaskDetailDrawer.tsx`
- **Impact:** Two different task detail UIs exist with different features. The console inspector's task drawer has no "overview" or "trace replay" tabs that the exported `TaskDetailDrawer` has. Maintenance is duplicated.
- **Fix Recommendation:** Refactor to use the shared `TaskDetailDrawer` component in the console inspector, or consolidate the two implementations into one.

#### F4-002: All console inspector data is hardcoded
- **Step:** Console → Workflow Inspector
- **Severity:** 🟡 **Medium**
- **Description:** `WorkflowInspector.tsx` uses a hardcoded `demoTasks` array (lines 55-132). There are no API calls, no loading states, and no error handling for data fetching.
- **File:** `src/components/console/WorkflowInspector.tsx`, lines 55-132
- **Impact:** The console inspector is a visual mock only. It cannot display real workflow data.
- **Fix Recommendation:** Replace `demoTasks` with a `useQuery` hook that fetches from `/api/console/workflows/{id}/tasks` or similar. Add loading skeletons and error states.

#### F4-003: DAG mode is a simple grid, not a real DAG layout
- **Step:** Console → Workflow Inspector → DAG view
- **Severity:** 🟡 **Medium**
- **Description:** The `DAGPlaceholder` component (lines 354-432) renders nodes in a simple grid layout (`col = i % cols`, `row = Math.floor(i / cols)`). The edges are drawn as straight horizontal/vertical lines that don't reflect actual task dependencies. There is no real DAG layout algorithm.
- **File:** `src/components/console/WorkflowInspector.tsx`, lines 354-432
- **Impact:** The DAG view is misleading. It does not show the actual workflow graph structure.
- **Fix Recommendation:** Use a proper DAG layout library like `cytoscape-dagre` (already imported in `DAGVisualization.tsx`) to compute node positions based on the actual edge graph.

#### F4-004: Trace links are hash-based and don't navigate
- **Step:** Console → Workflow Inspector → Task Detail → Spans tab
- **Severity:** 🟡 **Medium**
- **Description:** Span trace links use `#/traces/trace-${i}-a` (line 104). These are hash-based non-routing URLs that don't actually load a trace view page.
- **File:** `src/components/console/WorkflowInspector.tsx`, line 104
- **Impact:** Users click trace links and nothing happens.
- **Fix Recommendation:** Use real routing URLs like `/traces/${traceId}` or remove the links if the trace viewer doesn't exist yet.

#### F4-005: Replay Task button is non-functional
- **Step:** Console → Workflow Inspector → Task Detail → Trace tab
- **Severity:** 🟢 **Low**
- **Description:** In the `TaskDetailDrawer` component (used by `DAGVisualization.tsx`), the "Replay Task" button (line 259) has no `onClick` handler.
- **File:** `src/components/workflow/TaskDetailDrawer.tsx`, line 259
- **Impact:** Button is present but does nothing.
- **Fix Recommendation:** Add an `onReplay` prop and handler, or hide the button if the feature is not implemented.

---

## Cross-Cutting Issues

### CC-001: Duplicate UI component files with different implementations
- **Severity:** 🔴 **Critical**
- **Description:** The project has duplicate component files with different casing:
  - `src/components/ui/Button.tsx` AND `src/components/ui/button.tsx` (different implementations)
  - `src/components/ui/Badge.tsx` AND `src/components/ui/badge.tsx` (different implementations)
  
  Some files import from one (`@/src/components/ui/Button`), others from the other (`@/src/components/ui/button`). On case-sensitive file systems (Linux), this causes build confusion and bundler issues. The implementations differ:
  - `Button.tsx`: variant `"default"`, size `"default"`, no `asChild` prop
  - `button.tsx`: variant `"primary"`, size `"md"`, has `asChild` prop with `@radix-ui/react-slot`, has `fullWidth` prop
  - `Badge.tsx`: variants `"default"|"secondary"|"outline"|"success"|"warning"|"danger"|"ghost"`, no size prop
  - `badge.tsx`: variants `"default"|"success"|"warning"|"danger"|"info"|"accent"`, has `size` prop (`sm`/`md`/`lg`)
- **Files:** `src/components/ui/Button.tsx`, `src/components/ui/button.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/badge.tsx`
- **Impact:** 
  - Build bloat (two copies bundled)
  - Import path confusion
  - Inconsistent UI behavior depending on which file a component imports
  - Potential build failures on case-sensitive systems
- **Fix Recommendation:** 
  1. Decide on canonical naming convention (kebab-case files is recommended)
  2. Merge the best features from both implementations
  3. Update all imports to use the canonical file
  4. Delete the duplicate files

### CC-002: Inconsistent import paths for UI components
- **Severity:** 🟠 **High**
- **Description:** Throughout the codebase, UI components are imported inconsistently:
  - `app/library/page.tsx`: `import { Button } from "@/src/components/ui/Button"` (PascalCase path)
  - `src/components/workflow/ShareWorkflowDialog.tsx`: `import { Button } from "@/src/components/ui/button"` (kebab-case path)
  - `src/components/discover/TemplateCard.tsx`: `import { Button } from "@/src/components/ui/Button"` (PascalCase path)
  - `src/components/workflow/WorkflowHeader.tsx`: `import { Badge } from "@/src/components/ui/badge"` (kebab-case path)
  - `src/components/library/WorkflowListItem.tsx`: `import { Badge } from "@/src/components/ui/Badge"` (PascalCase path)
- **Impact:** On case-sensitive systems (Linux production builds), incorrect casing causes `Module not found` errors. This is a ticking time bomb for production builds.
- **Fix Recommendation:** Standardize on one casing convention (kebab-case is standard for Next.js). Run a find/replace across the codebase. Add an ESLint rule (`unicorn/filename-case`) to enforce consistency.

### CC-003: Orphaned barrel exports for unused components
- **Severity:** 🟡 **Medium**
- **Description:** `src/components/workflow/index.ts` exports `ShareWorkflowDialog`, `AmendWorkflowDialog`, and `CancelWorkflowButton`, but these are not used by `app/w/[id]/page.tsx`. `src/hooks/index.ts` exports `useWorkflowRun` but it's not used by any component.
- **Impact:** Codebase appears more complete than it actually is. Developers may think features are wired up when they're not.
- **Fix Recommendation:** Either wire up the exported components/hooks, or add TODO comments in the barrel files documenting that they are not yet integrated. Consider using a dead-code detection tool.

---

## Positive Findings

1. **Composer UX is well-built:** Auto-growing textarea, slash commands, keyboard navigation, file attachments, error display with `AlertCircle`, starter chips — all implemented nicely.
2. **Library filtering and pagination work:** Search, status filter, space filter, kind filter, sort, and pagination are all functional with proper empty state.
3. **Discover category filtering works:** Category chips correctly filter the template grid.
4. **ShareWorkflowDialog is fully implemented:** Link copy, public/private toggle, permission selector, email invite — all working as a standalone component.
5. **AmendWorkflowDialog is fully implemented:** Text input, quick hints, API integration, loading state — all working as a standalone component.
6. **CancelWorkflowButton is fully implemented:** Danger style, confirmation dialog, API call, error display, loading state — all working as a standalone component.
7. **WorkflowInspector has good UX:** Table/DAG toggle, search, multi-select filters, row selection, inline task drawer with tabs.
8. **PII redaction is implemented with audit logging:** The inspector logs when PII is unredacted (`console.log("[AUDIT] PII unredacted...")`).
9. **Console page has good nav structure:** Org selector, role display, version info, system status indicator.
10. **Loading states present on Home page:** Skeleton cards shown while fetching recent workflows.

---

## Fix Priority Matrix

| Priority | Issue | Files to Change |
|----------|-------|-----------------|
| **P0** | F1-001: Add post-submit navigation | `src/hooks/useComposer.ts`, `src/components/composer/Composer.tsx` |
| **P0** | F2-001: Wire up Share/Amend/Cancel components | `app/w/[id]/page.tsx` |
| **P0** | F3-001: Fix fork to create real workflow | `app/discover/page.tsx`, `app/w/[id]/page.tsx` |
| **P0** | CC-001: Remove duplicate UI component files | `src/components/ui/Button.tsx`, `src/components/ui/button.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/badge.tsx` |
| **P1** | F1-003: Show "not found" for unknown workflow IDs | `app/w/[id]/page.tsx` |
| **P1** | F2-002: Implement Fork/Archive in Library | `app/library/page.tsx` |
| **P1** | CC-002: Standardize import casing | All files importing from `src/components/ui/*` |
| **P1** | F4-001: Consolidate TaskDetailDrawer usage | `src/components/console/WorkflowInspector.tsx`, `src/components/workflow/TaskDetailDrawer.tsx` |
| **P2** | F1-004 / F2-005: Fix back button behavior | `src/components/workflow/WorkflowHeader.tsx` |
| **P2** | F2-003: Implement or hide bulk actions | `app/library/page.tsx` |
| **P2** | F3-003: Add API call and loading state for fork | `app/discover/page.tsx` |
| **P2** | F4-002: Replace hardcoded demo data with API | `src/components/console/WorkflowInspector.tsx` |
| **P3** | F1-005: Add transition loading overlay | `src/components/composer/Composer.tsx` |
| **P3** | F4-003: Implement real DAG layout | `src/components/console/WorkflowInspector.tsx` |
| **P3** | F4-004: Fix trace links | `src/components/console/WorkflowInspector.tsx` |
| **P3** | F4-005: Wire up Replay Task button | `src/components/workflow/TaskDetailDrawer.tsx` |

---

## Appendix: Import/Export Verification

| Component/Hook | Exported From | Used By | Status |
|----------------|--------------|---------|--------|
| `Composer` | `src/components/composer/Composer.tsx` | `app/page.tsx` | ✅ Connected |
| `useComposer` | `src/hooks/useComposer.ts` | `Composer.tsx` | ✅ Connected |
| `useWorkflowRun` | `src/hooks/index.ts` | **Nowhere** | 🔴 Orphaned |
| `ShareWorkflowDialog` | `src/components/workflow/index.ts` | **Nowhere** | 🔴 Orphaned |
| `AmendWorkflowDialog` | `src/components/workflow/index.ts` | **Nowhere** | 🔴 Orphaned |
| `CancelWorkflowButton` | `src/components/workflow/index.ts` | **Nowhere** | 🔴 Orphaned |
| `TaskDetailDrawer` | `src/components/workflow/TaskDetailDrawer.tsx` | `DAGVisualization.tsx` | ✅ Connected (but not in console) |
| `WorkflowListItem` | `src/components/library/WorkflowListItem.tsx` | `app/library/page.tsx` | ✅ Connected |
| `TemplateCard` | `src/components/discover/TemplateCard.tsx` | `app/discover/page.tsx` | ✅ Connected |
| `WorkflowInspector` | `src/components/console/WorkflowInspector.tsx` | `app/console/page.tsx` | ✅ Connected |
| `RecentWorkflowCard` | `src/components/workflow/RecentWorkflowCard.tsx` | `app/page.tsx` | ✅ Connected |
| `WorkflowHeader` | `src/components/workflow/WorkflowHeader.tsx` | `app/w/[id]/page.tsx` | ✅ Connected |
