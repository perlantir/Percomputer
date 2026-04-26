# Integration Audit Report

## Multi-Model Agent Platform — Integration Quality Audit

**Audited Files:** Barrel exports (components, hooks, lib, types, data, mock), page files, layout, and end-to-end flows.
**Date:** 2025-01-16
**Auditor:** Integration Auditor

---

## Summary

| Category | Count |
|---|---|
| **Critical** | 2 |
| **High** | 9 |
| **Medium** | 12 |
| **Low** | 8 |
| **Total Issues** | 31 |

---

## 1. Critical Issues

### CR-1: Broken Import Syntax — Mismatched Quotes
- **File:** `src/components/layout/AppShell.tsx`, line 4
- **File:** `src/components/layout/LeftRail.tsx`, line 18
- **Description:** The import statement for `useRailStore` uses a mismatched quote — opens with a double quote (`"`) and closes with a single quote (`'`): `import { useRailStore } from "@/src/hooks/useRailStore';`. This will cause a **compile-time syntax error** in both files.
- **Fix:** Change the closing single quote to a double quote: `import { useRailStore } from "@/src/hooks/useRailStore";`

### CR-2: Route Mismatch — Space Navigation Links to Wrong Path
- **File:** `src/components/layout/LeftRail.tsx`, lines 28-32
- **File:** `src/components/layout/MobileNav.tsx`, line 12
- **Description:** Space navigation links point to `/s/engineering`, `/s/product`, `/s/design` but the actual dynamic route page is at `/spaces/[id]/page.tsx` (route: `/spaces/:id`). The `isSpaceActive()` check also looks for `/s/` prefix which will never match the actual `/spaces/` route. This is a **broken navigation flow** — clicking any space link will result in a 404.
- **Fix:** Change space links from `/s/:id` to `/spaces/:id` and update `isSpaceActive()` to check `pathname.startsWith('/spaces')`.

---

## 2. High Issues

### HI-1: `workflow` Types Barrel Not Exported from `types/index.ts`
- **File:** `src/types/index.ts`
- **Description:** `src/types/workflow.ts` contains 13 exported types (`ModelName`, `TaskStatus`, `WorkflowStatus`, `CompletedTask`, `ActiveTask`, `ModelInFlight`, `WorkflowEventBase`, `WorkflowEventType`, `WorkflowStartedEvent`, `TaskStartedEvent`, `TaskCompletedEvent`, `TaskFailedEvent`, `TaskCancelledEvent`, `ModelProgressEvent`, `SynthesisTokenEvent`, `CreditSpendEvent`, `ClarificationRequestedEvent`, `ClarificationAnsweredEvent`, `WorkflowEvent`, `ConnectionStatus`) but is **completely missing** from the `types/index.ts` barrel. Consumers cannot access these types through the barrel.
- **Fix:** Add a new section in `types/index.ts`:
  ```ts
  export {
    ModelName, TaskStatus, WorkflowStatus, CompletedTask, ActiveTask,
    ModelInFlight, WorkflowEventBase, WorkflowEventType, WorkflowStartedEvent,
    TaskStartedEvent, TaskCompletedEvent, TaskFailedEvent, TaskCancelledEvent,
    ModelProgressEvent, SynthesisTokenEvent, CreditSpendEvent,
    ClarificationRequestedEvent, ClarificationAnsweredEvent, WorkflowEvent,
    ConnectionStatus,
  } from './workflow';
  ```

### HI-2: Layout Barrel Missing 13+ Exports
- **File:** `src/components/layout/index.ts`
- **Description:** The layout barrel only exports 5 items (`AppShell`, `LeftRail`, `MainPane`, `MobileNav`, `Header`). The directory contains 19 total files. Missing from the barrel: `AnnouncementBanner`, `CommandPalette`, `CommandPaletteProvider`, `ErrorBoundary`, `Footer`, `KeyboardShortcuts`, `KeyboardShortcutsStore`, `QueryProvider`, `Sidebar`, `ThemeToggle`, `Toaster`, `UserMenu`, `types.ts` (types).
- **Impact:** Root layout (`app/layout.tsx`) must import directly from individual files, defeating the purpose of the barrel.
- **Fix:** Add exports for all reusable layout components:
  ```ts
  export { AnnouncementBanner } from './AnnouncementBanner';
  export { CommandPalette } from './CommandPalette';
  export { CommandPaletteProvider } from './CommandPaletteProvider';
  export { ErrorBoundary } from './ErrorBoundary';
  export { Footer } from './Footer';
  export { KeyboardShortcuts } from './KeyboardShortcuts';
  export { KeyboardShortcutsProvider } from './KeyboardShortcutsStore';
  export { QueryProvider } from './QueryProvider';
  export { Sidebar } from './Sidebar';
  export { ThemeToggle } from './ThemeToggle';
  export { Toaster } from './Toaster';
  export { UserMenu } from './UserMenu';
  ```

### HI-3: Hooks Barrel Missing 7 Exports
- **File:** `src/hooks/index.ts`
- **Description:** The hooks barrel exports 6 items (including type exports). The directory has 13 hook files. Missing from the barrel: `useLockBodyScroll`, `useRailStore`, `useWebSocketControl`, `useWorkflowEvents`, `useWorkflowSimulation`, `useWorkflowStream`, `useInterval` (only `useDebounce` and `useInterval` are re-exported from `useInterval.ts`, but `useInterval` itself is in the barrel).
- **Impact:** `AppShell.tsx` and `LeftRail.tsx` import `useRailStore` directly; `useWorkflowEvents`, `useWorkflowSimulation`, `useWorkflowStream`, `useWebSocketControl`, `useLockBodyScroll` have no barrel entry.
- **Fix:** Add missing exports:
  ```ts
  export { useLockBodyScroll } from './useLockBodyScroll';
  export { useRailStore } from './useRailStore';
  export { useWebSocketControl } from './useWebSocketControl';
  export { useWorkflowEvents } from './useWorkflowEvents';
  export { useWorkflowSimulation } from './useWorkflowSimulation';
  export { useWorkflowStream } from './useWorkflowStream';
  ```

### HI-4: Workflow Barrel Missing 16+ Exports
- **File:** `src/components/workflow/index.ts`
- **Description:** The workflow barrel exports 15 items but the directory has 31 files. Missing from barrel: `AmendWorkflowDialog`, `CancelWorkflowButton`, `Citation`, `CitationLink`, `CitationPopover`, `DAGControls`, `DAGMiniMap`, `DAGNode`, `DAGVisualization`, `LiveActivityRail`, `ProgressBar`, `RecentWorkflowCard`, `StatusPill`, `TaskDetailDrawer`, `TokenStream`, `WorkflowCanvas` (exported but never imported).
- **Impact:** `app/page.tsx` imports `RecentWorkflowCard` directly from the file path, bypassing the barrel. Other internal workflow components may also need to import directly.
- **Fix:** Add exports for the missing public API:
  ```ts
  export { Citation } from './Citation';
  export { CitationLink } from './CitationLink';
  export { CitationPopover } from './CitationPopover';
  export { DAGControls } from './DAGControls';
  export { DAGMiniMap } from './DAGMiniMap';
  export { DAGNode } from './DAGNode';
  export { DAGVisualization } from './DAGVisualization';
  export { LiveActivityRail } from './LiveActivityRail';
  export { ProgressBar } from './ProgressBar';
  export { RecentWorkflowCard } from './RecentWorkflowCard';
  export { StatusPill } from './StatusPill';
  export { TaskDetailDrawer } from './TaskDetailDrawer';
  export { TokenStream } from './TokenStream';
  ```

### HI-5: UI Barrel Missing `getInitials`, `AvatarGroup`, `AvatarSizes`, Toast Components
- **File:** `src/components/ui/index.ts`
- **Description:** `avatar.tsx` exports `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarGroup`, `getInitials`, `AvatarSizes`. The barrel only exports the first 3. `settings/page.tsx` imports `getInitials` directly from `avatar.tsx`, bypassing the barrel. Additionally, `toast.tsx` exists but is not re-exported — `Toaster` is exported from `Toaster.tsx` but `toast.tsx` (the hook) is missing.
- **Fix:** Add to `ui/index.ts`:
  ```ts
  export { AvatarGroup, getInitials, AvatarSizes } from './avatar';
  export { toast, useToast } from './toast';
  ```
  Also add re-exports for lowercase variants where missing: `input`, `textarea`, `separator`, `badge`, `skeleton`.

### HI-6: Console Barrel Missing `ConsolePanel`
- **File:** `src/components/console/index.ts`
- **Description:** `ConsolePanel.tsx` exists in the console directory but is **not exported** from the barrel. It is also never imported anywhere in the project.
- **Fix:** Add `export { default as ConsolePanel } from './ConsolePanel';` or remove `ConsolePanel.tsx` if dead code.

### HI-7: Data Barrel Missing `models.ts` and `mock-data.ts` Exports
- **File:** `src/data/index.ts`
- **Description:** `models.ts` (exports `demoModels`, `demoTools`) and `mock-data.ts` (exports `mockBilling`, `mockHealth`, `mockModels`, `mockSearchResults`, `generateWorkflowDAG`, `generateId`, `mockUsage`, `mockUsers`) are not exported from `data/index.ts`. Multiple API routes import directly from `mock-data.ts`, bypassing the barrel.
- **Fix:** Add exports for both files in `data/index.ts`.

### HI-8: Unused Imports in `app/settings/page.tsx`
- **File:** `app/settings/page.tsx`, lines 13-14
- **Description:** `DEMO_WORKFLOWS` and `DEMO_MEMORY` are imported but **never used** anywhere in the file. They can be safely removed.
- **Fix:** Remove lines 13-14 (the unused imports).

### HI-9: Unused Imports in `app/console/page.tsx`
- **File:** `app/console/page.tsx`, line 4
- **Description:** `cn` (from `@/src/lib/utils`) is imported but **never used** in the console page.
- **Fix:** Remove the `cn` import on line 4.

---

## 3. Medium Issues

### MI-1: Unused React Import in `app/connectors/page.tsx`
- **File:** `app/connectors/page.tsx`, line 3
- **Description:** `import * as React from "react"` is present alongside `import { useState, useMemo } from "react"` on line 4. The namespace import is never used (all React usage is via named imports).
- **Fix:** Remove line 3 (`import * as React from "react"`).

### MI-2: Console Page Bypasses Console Barrel
- **File:** `app/console/page.tsx`, lines 5-13
- **Description:** All console sub-components are imported directly from their source files (e.g., `@/src/components/console/ConsoleNav`, `@/src/components/console/WorkflowInspector`) instead of through the barrel `@/src/components/console`. This makes the barrel pointless for this page and risks breakage if file paths change.
- **Fix:** Change imports to use the barrel:
  ```ts
  import {
    ConsoleNav, type ConsolePage,
    WorkflowInspector, PlanDiffViewer,
    CostQualityLeaderboard, RoutingPolicyEditor,
    SandboxPool, ProviderHealth,
    AuditExplorer, TenantAdmin,
  } from "@/src/components/console";
  ```
  Note: `ConsolePage` type must also be exported from the barrel for this to work.

### MI-3: `ConsolePage` Type Not Exported from Console Barrel
- **File:** `src/components/console/index.ts`
- **Description:** The `ConsolePage` type is defined in `ConsoleNav.tsx` and imported by `app/console/page.tsx`, but the barrel does not export it. It is imported directly from `ConsoleNav.tsx`.
- **Fix:** Add `export type { ConsolePage } from './ConsoleNav';` to the console barrel.

### MI-4: Mock Barrel Does Not Re-Export Internal Files
- **File:** `src/mock/index.ts`
- **Description:** The mock barrel (`src/mock/index.ts`) is self-contained with inline data (`mockAgents`, `mockWorkflows`, etc.) but does **not** re-export any of the 4 files in its directory (`generators.ts`, `llm-responses.ts`, `search-results.ts`, `sse-events.ts`). The `data/index.ts` barrel directly imports from these mock files (`../mock/generators`, `../mock/llm-responses`, etc.), creating a dependency that bypasses the mock barrel.
- **Fix:** Add re-exports in `mock/index.ts`:
  ```ts
  export * from './generators';
  export * from './llm-responses';
  export * from './search-results';
  export * from './sse-events';
  ```

### MI-5: `data/index.ts` Uses `require()` Inside ESM Export Function
- **File:** `src/data/index.ts`, lines 136-141
- **Description:** `getDemoStats()` function uses `require()` calls (`require("./demo-workflows")`, etc.) to import data. In an ESM-first Next.js project, `require()` may not be available at runtime depending on the bundler configuration. This is a latent bug.
- **Fix:** Replace `require()` with top-level `import` statements and use the already-imported module references.

### MI-6: Home Page Imports `RecentWorkflowCard` Directly, Bypassing Barrel
- **File:** `app/page.tsx`, line 5
- **Description:** `RecentWorkflowCard` is imported from `@/src/components/workflow/RecentWorkflowCard` directly instead of through `@/src/components/workflow`. This is inconsistent with barrel-first patterns.
- **Fix:** Once `RecentWorkflowCard` is added to the workflow barrel, change the import to:
  ```ts
  import { RecentWorkflowCard } from "@/src/components/workflow";
  ```

### MI-7: MobileNav Missing Discover and Connectors Tabs
- **File:** `src/components/layout/MobileNav.tsx`, lines 9-14
- **Description:** Mobile navigation only shows 4 tabs: Home, Library, Spaces, You. It is missing **Discover** and **Connectors** which are present in the desktop LeftRail. This is a navigation inconsistency across breakpoints.
- **Fix:** Add Discover (`/discover`, `Compass`) and Connectors (`/connectors`, `Plug`) tabs to the mobile nav array.

### MI-8: `WorkflowCanvas` Exported but Never Imported
- **File:** `src/components/workflow/index.ts`, line 1
- **Description:** `WorkflowCanvas` is exported from the workflow barrel but never imported anywhere in the project. This may be dead code or a prematurely added export.
- **Fix:** Verify if `WorkflowCanvas` is needed. If not, remove the export and the file.

### MI-9: `WorkflowCanvas` Also Imported but Not Used in `w/[id]/page.tsx`
- **File:** `app/w/[id]/page.tsx` (workflow detail page)
- **Description:** The workflow detail page imports `WorkflowHeader`, `AnswerTab`, `StepsTab`, `SourcesTab`, `ArtifactsTab`, `ClarificationCard` from the workflow barrel but never instantiates `WorkflowCanvas`. The canvas is meant to be the main visual element of the workflow page but is absent from the JSX.
- **Fix:** Either integrate `<WorkflowCanvas />` into the workflow detail page layout, or remove it from the page's imports if not needed.

### MI-10: Settings Page Direct-Imports Avatar `getInitials` Instead of Using UI Barrel
- **File:** `app/settings/page.tsx`, line 26
- **Description:** `getInitials` is imported from `@/src/components/ui/avatar` directly. Once `getInitials` is added to the UI barrel, this should use the barrel.
- **Fix:** Change to `import { Avatar, AvatarImage, AvatarFallback, getInitials } from "@/src/components/ui";`

### MI-11: `data/index.ts` Barrel Name Collision — `Workflow`, `Task`, `TaskKind`, `TaskStatus`
- **File:** `src/data/index.ts`, lines 40-57
- **Description:** The data barrel re-exports `Workflow`, `Task`, `TaskEdge`, `TaskKind`, `TaskStatus` from `demo-workflows.ts`. These type names collide with types of the same name exported from `src/types/index.ts` (from `entities.ts` and `enums.ts`). If a consumer imports from both barrels in the same file, name collisions will occur.
- **Fix:** Consider namespacing data-specific types (e.g., `DemoWorkflow`, `DemoTask`) to avoid collisions.

### MI-12: `useDebounce`/`useInterval` Export Ambiguity
- **File:** `src/hooks/index.ts`, line 7
- **Description:** `export { useDebounce, useInterval } from "./useInterval";` exports two hooks from one file. `useInterval` is also the file name. If `useDebounce` is moved to its own file later, the barrel contract changes silently.
- **Fix:** Consider creating a separate `useDebounce.ts` file for clarity, or keep both in `useInterval.ts` but document the dual-export.

---

## 4. Low Issues

### LI-1: `Toaster` in Layout Could Conflict with UI Barrel `Toaster`
- **File:** `app/layout.tsx`, line 7
- **Description:** The layout imports `Toaster` from `@/src/components/layout/Toaster` (a layout-specific toast renderer). The UI barrel also exports a `Toaster` from `@/src/components/ui/Toaster`. If both are used in different contexts, naming confusion is possible.
- **Fix:** Rename the layout toaster to `AppToaster` or `LayoutToaster` for disambiguation.

### LI-2: Console Page Uses `React.ComponentType` but Imports React as Default
- **File:** `app/console/page.tsx`, line 3
- **Description:** `import React, { useState } from "react"` is used because `React.ComponentType` is referenced on line 15. The default import of React is valid in JSX/TSX but is an older pattern. This is a style concern, not a bug.
- **Fix:** Use `import type { ComponentType } from "react"` and change `React.ComponentType` to `ComponentType`.

### LI-3: `WorkflowCanvas` Import in `w/[id]/page.tsx` — Potential Dead Import
- **File:** `app/w/[id]/page.tsx`
- **Description:** `WorkflowCanvas` is listed in the imports from the workflow barrel but never rendered in the page. This is an unused import (TypeScript may flag it).
- **Fix:** Remove `WorkflowCanvas` from the import list in the workflow detail page.

### LI-4: `ConsolePanel` Exists but Is Unused
- **File:** `src/components/console/ConsolePanel.tsx`
- **Description:** `ConsolePanel.tsx` exists in the console directory, is not exported from the barrel, and is not imported anywhere.
- **Fix:** Remove if dead code, or add to barrel if needed.

### LI-5: `useWorkflowStream` Hook Not Exported and Potentially Unused
- **File:** `src/hooks/useWorkflowStream.ts`
- **Description:** File exists but is not exported from hooks barrel and not imported anywhere in the project.
- **Fix:** Verify if needed; export from barrel if so, otherwise delete.

### LI-6: `KeyboardShortcutsStore` Naming Inconsistency
- **File:** `app/layout.tsx`, line 9
- **Description:** The file is named `KeyboardShortcutsStore.tsx` but it exports `KeyboardShortcutsProvider`. The barrel file name doesn't match its primary export, which is confusing.
- **Fix:** Rename file to `KeyboardShortcutsProvider.tsx` for consistency.

### LI-7: `StatusPill` Exported from Console Barrel but Also Exists in Workflow
- **File:** `src/components/console/index.ts`, line 10
- **Description:** `StatusPill` is exported from the console barrel alongside `ConsoleTable`, but there is also a `StatusPill` component in `src/components/workflow/StatusPill.tsx`. If both are imported in the same scope, a name collision occurs.
- **Fix:** Namespace them: `export { StatusPill as ConsoleStatusPill } from './ConsoleTable';` and `export { StatusPill as WorkflowStatusPill } from './StatusPill';` (the workflow barrel already exports `WorkflowStatusBadge` instead).

### LI-8: Settings Page Imports from `card` and `tabs` via UI Barrel but Also Has Direct UI Imports
- **File:** `app/settings/page.tsx`, lines 16-35
- **Description:** Settings imports `Card`, `Tabs` etc. via the UI barrel but also imports `Button`, `Input`, `Textarea`, `Switch`, `Skeleton`, `Separator` via the UI barrel. Some are imported from PascalCase barrel (`Button`, `Input`) and some from lowercase shadcn barrel (`switch`, `select`). This is inconsistent but functional.
- **Fix:** Consolidate all UI imports to use the barrel for consistency. All listed components are exported from `ui/index.ts`.

---

## 5. End-to-End Flow Analysis

### Flow: Home → Composer → Workflow Detail

```
app/page.tsx (Home)
  └── <Composer />  ──→ submits workflow
  └── <RecentWorkflowCard />  ──→ links to /w/:id
        │
        ▼
app/w/[id]/page.tsx (Workflow Detail)
  ├── <WorkflowHeader />
  ├── <AnswerTab />, <StepsTab />, <SourcesTab />, <ArtifactsTab />
  └── <LiveActivityRail />  ──→ links to other /w/:id
```

**Verdict:** The flow is properly wired. The Composer on the home page submits, and recent workflow cards link to `/w/:id`. The workflow detail page handles tab navigation (answer, steps, sources, artifacts) and has a live activity rail for navigation to other workflows. The page uses `useParams` for dynamic routing and falls back to the first demo workflow if the ID is not found. **PASS** (with the caveat that `WorkflowCanvas` is not actually rendered).

### Flow: Library → Workflow Detail

```
app/library/page.tsx
  ├── <FilterBar /> ──→ filters/sorts
  └── <WorkflowListItem /> ──→ each links to /w/:id
```

**Verdict:** Library page lists workflows with pagination, filtering, and sorting. `WorkflowListItem` renders each workflow with navigation to `/w/:id`. **PASS**.

### Flow: Discover → Fork Workflow

```
app/discover/page.tsx
  ├── <CategoryChip /> ──→ category filtering
  └── <TemplateCard onFork={...} /> ──→ pushes /w/:id?objective=...
```

**Verdict:** Template cards fork into workflow detail pages with query params. **PASS**.

### Flow: Spaces → Space Detail

```
app/spaces/[id]/page.tsx
  ├── <SpaceHeader />
  ├── <SpaceWorkflowsTab />, <SpaceMemoryTab />, <SpaceArtifactsTab />, <SpaceSettingsTab />
  └── Uses Tabs from UI barrel
```

**Verdict:** Dynamic route properly uses `useParams`, handles not-found states, and delegates to tab components. **PASS** (with caveat that LeftRail links to `/s/:id` instead of `/spaces/:id`).

### Root Layout Analysis

```
app/layout.tsx
  └── <ThemeProvider>     (next-themes)
        └── <QueryProvider>    (TanStack Query)
              └── <CommandPaletteProvider>
                    └── <KeyboardShortcutsProvider>
                          └── <AppShell>
                                └── {children}
                          └── <CommandPalette />
                          └── <KeyboardShortcuts />
                          └── <Toaster />
```

**Verdict:** Root layout wraps all pages with `ThemeProvider`, `QueryProvider`, `CommandPaletteProvider`, `KeyboardShortcutsProvider`, and `AppShell` (which provides LeftRail + MainPane + MobileNav). This is a comprehensive context hierarchy. `CommandPalette`, `KeyboardShortcuts`, and `Toaster` are rendered as siblings inside the `KeyboardShortcutsProvider` which may cause z-index issues but functionally works. **PASS**.

---

## 6. Import Cycle Analysis

No direct import cycles were detected between barrel files. The dependency graph is:

- `app/*` → `src/components/*`, `src/hooks/*`, `src/data/*`, `src/types/*`, `src/lib/*`
- `src/components/*` → `src/hooks/*`, `src/lib/*`, `src/types/*`
- `src/hooks/*` → `src/components/layout/*` (e.g., `useKeyboardShortcuts` → `KeyboardShortcutsStore`)
- `src/data/*` → `src/mock/*`, `src/types/*`
- `src/mock/*` → `src/types/*`
- `src/lib/*` → `src/types/*`

**No circular dependencies found. PASS.**

---

## 7. Barrel Completeness Matrix

| Barrel | Files in Dir | Exported | Missing |
|---|---|---|---|
| `components/composer` | 5 + 1 barrel | 5 | 0 |
| `components/connectors` | 3 + 1 barrel | 3 | 0 |
| `components/console` | 11 + 1 barrel | 10 | `ConsolePanel` |
| `components/discover` | 2 + 1 barrel | 2 | 0 |
| `components/layout` | 19 + 1 barrel | 5 | **13** |
| `components/library` | 2 + 1 barrel | 2 | 0 |
| `components/settings` | 4 + 1 barrel | 4 | 0 |
| `components/spaces` | 5 + 1 barrel | 5 | 0 |
| `components/ui` | 30 + 1 barrel | ~30 | `AvatarGroup`, `getInitials`, `AvatarSizes`, `toast`, `useToast` |
| `components/workflow` | 31 + 1 barrel | 15 | **16** |
| `hooks` | 13 + 1 barrel | 6 + types | **7** |
| `lib` | 12 + 1 barrel | 5 + types | `api-utils`, `cytoscape-config`, `mock-db` |
| `types` | 7 + 1 barrel | 6 sections | **`workflow.ts`** |
| `data` | 8 + 1 barrel | 6 sections | `models.ts`, `mock-data.ts` |
| `mock` | 4 + 1 barrel | 6 inline exports | `generators.ts`, `llm-responses.ts`, `search-results.ts`, `sse-events.ts` |

---

## 8. Page Wiring Summary

| Page | Layout Wrapper | Uses AppShell? | Contexts Available | Dynamic Route? |
|---|---|---|---|---|
| `app/page.tsx` (Home) | `<AppShell>` | Yes | All | No |
| `app/w/[id]/page.tsx` (Workflow) | `<AppShell>` | Yes | All | Yes (`[id]`) |
| `app/library/page.tsx` (Library) | `<AppShell>` | Yes | All | No |
| `app/discover/page.tsx` (Discover) | `<AppShell>` | Yes | All | No |
| `app/spaces/[id]/page.tsx` (Spaces) | `<AppShell>` | Yes | All | Yes (`[id]`) |
| `app/connectors/page.tsx` (Connectors) | `<AppShell>` | Yes | All | No |
| `app/settings/page.tsx` (Settings) | `<AppShell>` | Yes | All | No |
| `app/console/page.tsx` (Console) | `<AppShell>` | Yes | All | No |

**All pages are properly wrapped by `<AppShell>` through the root layout. PASS.**

---

## 9. Fix Priority Checklist

### Must Fix (Before Merge)
- [ ] **CR-1**: Fix mismatched quote in `AppShell.tsx` and `LeftRail.tsx` (`useRailStore` import)
- [ ] **CR-2**: Fix space route mismatch (`/s/:id` → `/spaces/:id`)
- [ ] **HI-8**: Remove unused `DEMO_WORKFLOWS` and `DEMO_MEMORY` imports from settings page
- [ ] **HI-9**: Remove unused `cn` import from console page

### Should Fix (High Priority)
- [ ] **HI-1**: Add `workflow.ts` types to `types/index.ts` barrel
- [ ] **HI-2**: Add missing exports to `layout/index.ts` barrel
- [ ] **HI-3**: Add missing exports to `hooks/index.ts` barrel
- [ ] **HI-4**: Add missing exports to `workflow/index.ts` barrel
- [ ] **HI-5**: Add missing `getInitials`, `AvatarGroup`, `toast` to `ui/index.ts` barrel
- [ ] **HI-6**: Export `ConsolePanel` from console barrel or remove it
- [ ] **HI-7**: Add `models.ts` and `mock-data.ts` exports to `data/index.ts`
- [ ] **MI-2**: Console page should use console barrel imports
- [ ] **MI-3**: Export `ConsolePage` type from console barrel
- [ ] **MI-5**: Replace `require()` with ESM imports in `data/index.ts`

### Nice to Fix (Medium/Low Priority)
- [ ] **MI-1**: Remove unused React import in connectors page
- [ ] **MI-4**: Re-export mock internal files from `mock/index.ts`
- [ ] **MI-6**: Use workflow barrel for `RecentWorkflowCard` import in home page
- [ ] **MI-7**: Add Discover + Connectors to MobileNav
- [ ] **MI-9**: Integrate or remove `WorkflowCanvas` from workflow detail page
- [ ] **MI-10**: Use UI barrel for `getInitials` in settings page
- [ ] **MI-11**: Resolve type name collisions in data barrel
- [ ] **LI-1** through **LI-8**: Various code quality improvements

---

*End of Audit Report*
