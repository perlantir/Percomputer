# Responsive Design & Mobile Adaptation Audit Report

**Project:** Multi-Model Agent Platform
**Audit Date:** 2025-01-15
**Auditor:** Design System Auditor
**Scope:** All page components and key layout/composite components

---

## Executive Summary

| Checklist Item | Status | Critical Issues |
|----------------|--------|-----------------|
| 1. Responsive breakpoints | ⚠️ PARTIAL | 4 pages have zero breakpoints |
| 2. Composer usable on mobile | ✅ PASS | Textarea uses `text-base` (prevents iOS zoom) |
| 3. Tables scroll horizontally | ⚠️ PARTIAL | ConnectorDrawer table lacks `overflow-x-auto` |
| 4. Left rail hidden on mobile | ✅ PASS | Properly replaced with `MobileNav` |
| 5. Touch targets ≥44px | ❌ FAIL | 15+ buttons/icons below 44px across 8 files |
| 6. Text readable | ⚠️ PARTIAL | Console page uses `text-[10px]`; some headings lack mobile scaling |
| 7. Cards stack on mobile | ✅ PASS | All grid layouts use responsive column classes |
| 8. DAG visualization mobile | ✅ PASS | No canvas DAG exists; text-based dependency list wraps |
| 9. Modals full-screen on mobile | ✅ PASS | ConnectorDrawer uses `w-full max-w-md` |
| 10. Horizontal overflow | ❌ FAIL | Multiple overflow risks on workflow, library, spaces, console pages |

**Overall Rating: 5/10 — Needs significant mobile improvements**

---

## 1. Responsive Breakpoints (sm:, md:, lg:, xl:)

### ❌ Critical: `/app/w/[id]/page.tsx` — Zero responsive breakpoints
- **Line 30–307:** The entire workflow detail page has no Tailwind responsive prefixes.
- **Line 202:** `max-w-[1400px] px-6` — fixed padding and max-width on all viewports.
- **Line 46–48:** Right rail (`LiveActivityRail`) uses fixed `w-[320px]` or `w-12` with no mobile collapsing. On a 375px phone, the rail consumes 85% of viewport width.
- **Line 201–247:** Tab navigation has no `overflow-x-auto` or wrapping — tabs will overflow horizontally on small screens.
- **Severity:** HIGH
- **Fix:**
  ```tsx
  // Add responsive behavior to right rail
  <aside className={`hidden lg:block shrink-0 ... ${collapsed ? "w-12" : "w-[320px]"}`}>
  
  // Add horizontal scroll to tabs
  <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Workflow tabs">
  
  // Use responsive padding
  <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
  ```

### ❌ Critical: `/app/library/page.tsx` — Zero responsive breakpoints
- **Line 122–217:** No `sm:`, `md:`, `lg:` prefixes anywhere.
- **Line 124:** `max-w-7xl px-6 pt-8 pb-4` — fixed padding regardless of viewport.
- **Line 147:** `max-w-7xl px-6 py-6` — same fixed padding for workflow list.
- **Severity:** MEDIUM
- **Fix:** Change `px-6` to `px-4 sm:px-6` on all containers. Consider reducing `pt-8` to `pt-4 sm:pt-8` on mobile.

### ❌ Critical: `/app/spaces/[id]/page.tsx` — Zero responsive breakpoints
- **Line 57–87:** No responsive prefixes.
- **Line 60:** `max-w-7xl px-6 py-6` — fixed padding.
- **Line 62:** `<TabsList className="mb-6">` — default TabsList renders horizontally. On mobile, 4 tabs will overflow with no `overflow-x-auto` wrapper.
- **Severity:** MEDIUM
- **Fix:**
  ```tsx
  <div className="overflow-x-auto">
    <TabsList className="mb-6 w-full sm:w-auto">...</TabsList>
  </div>
  ```

### ❌ Critical: `/app/console/page.tsx` — Zero responsive breakpoints
- **Line 40–96:** Entire console page is desktop-only.
- **Line 40:** `h-screen w-screen flex flex-col` — uses viewport units without mobile consideration.
- **Line 42:** Dense header with `h-10`, `text-[10px]`, `text-[11px]` — not readable on mobile.
- **Line 90:** `<ConsoleNav>` is `w-52` fixed sidebar with no mobile adaptation.
- **Severity:** HIGH
- **Fix:** Either hide console behind auth/role gate with mobile warning, or add responsive nav collapse (`hidden md:block`), hamburger menu, and reflow main content to full width. Reduce information density on small screens.

### ✅ Good Examples
- `/app/page.tsx` — Uses `md:text-5xl` (line 33) and `sm:grid-cols-2` (lines 58, 67)
- `/app/discover/page.tsx` — Uses `md:grid-cols-2 lg:grid-cols-3` (line 203)
- `/app/connectors/page.tsx` — Uses `sm:grid-cols-2 lg:grid-cols-4` (line 151)
- `/app/settings/page.tsx` — Uses `lg:block`/`lg:hidden` for sidebar nav (lines 586, 596) and `sm:p-6 lg:p-8` (line 617)

---

## 2. Composer Usable on Mobile

### ✅ `/src/components/composer/Composer.tsx` — Mobile-friendly
- **Line 217:** `text-base` on textarea — **Critical:** Prevents iOS Safari zoom-on-focus behavior.
- **Line 196:** `w-full` container — adapts to viewport width.
- **Line 205:** `p-4` padding — reasonable on mobile.
- **Line 234:** Attachment pills use `max-w-[12rem] truncate` — prevents overflow.
- **Line 171:** `Cmd/Ctrl + Enter` keyboard shortcut — works on mobile with external keyboards; tap-based submission via toolbar button is assumed present.
- **Severity:** NONE (Good)
- **Note:** `StarterChips` and `SlashMenu` positioning were not fully audited. Verify `SlashMenu` is positioned with `fixed` or `absolute` within viewport bounds and doesn't overflow off-screen on narrow devices.

---

## 3. Tables Scroll Horizontally on Small Screens

### ✅ `/src/components/settings/ModelsTable.tsx` — Properly wrapped
- **Line 106:** `<div className="overflow-x-auto">` correctly wraps the table. **PASS.**

### ✅ `/app/settings/page.tsx` Team Tab — Properly wrapped
- **Line 479:** `<div className="overflow-x-auto">` correctly wraps the team members table. **PASS.**

### ❌ `/src/components/connectors/ConnectorDrawer.tsx` — Missing overflow wrapper
- **Line 232–284:** "Last 20 Calls" table has **no** `overflow-x-auto` wrapper.
- The table has 4 columns (Method, Endpoint, Status, Time) with `text-xs` content. On a 375px device, the `max-w-md` (448px) drawer leaves minimal space; the table will overflow its container.
- **Severity:** MEDIUM
- **Fix:**
  ```tsx
  <div className="rounded-md border border-border-subtle overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">...</table>
    </div>
  </div>
  ```

---

## 4. Left Rail Hidden/Replaced on Mobile

### ✅ `/src/components/layout/AppShell.tsx` — Correct implementation
- **Line 22:** `<div className="hidden sm:block">` — LeftRail hidden below 640px.
- **Line 27–33:** Spacer div also `hidden sm:block` — correct paired behavior.
- **Line 42:** `<MobileNav />` rendered unconditionally (uses internal `sm:hidden`).
- **Severity:** NONE (Good)

### ✅ `/src/components/layout/MainPane.tsx` — Correct mobile padding
- **Line 15:** `hasMobileNav && 'pb-16 sm:pb-0'` — adds bottom padding for mobile nav on small screens only.
- **Severity:** NONE (Good)

### ✅ `/src/components/layout/LeftRail.tsx` — Desktop-only, correct
- **Line 52:** Uses `fixed left-0 top-0 z-40` — positioned correctly for desktop.
- **Line 54:** `hidden` is applied by parent `AppShell`, not the rail itself — acceptable pattern.
- **Severity:** NONE (Good)

### ⚠️ `/src/components/layout/MobileNav.tsx` — Functional but has issues
- **Line 12:** Hardcoded Spaces href: `href: '/s/engineering'` — should be dynamic or link to spaces list.
- **Line 29:** `h-16` nav height with `justify-around` — touch targets are roughly `w-1/4` of viewport width each, adequate.
- **Line 43:** `size={20}` icon (20px) — small but surrounded by large tap area.
- **Severity:** LOW (href issue)
- **Fix:** Change Spaces href to `/spaces` or make it dynamic based on current space.

---

## 5. Touch Targets Large Enough (≥44px)

### ❌ `/src/components/workflow/WorkflowHeader.tsx`
- **Line 71:** Back button: `h-8 w-8` = **32px** (needs 44px minimum)
- **Severity:** MEDIUM
- **Fix:** `h-9 w-9 sm:h-8 sm:w-8` or `h-11 w-11`

### ❌ `/app/w/[id]/page.tsx` (LiveActivityRail)
- **Line 57:** Toggle button: `h-7 w-7` = **28px**
- **Severity:** LOW (desktop-only component, but still fails WCAG)
- **Fix:** `h-9 w-9`

### ❌ `/app/settings/page.tsx` (API Keys Tab)
- **Line 427:** Copy button: `h-8 w-8 p-0` = **32px**
- **Line 430:** Refresh button: `h-8 w-8 p-0` = **32px**
- **Line 433:** Trash button: `h-8 w-8 p-0` = **32px**
- **Severity:** MEDIUM
- **Fix:** Use `h-9 w-9` or `h-10 w-10` minimum

### ❌ `/app/settings/page.tsx` (Team Tab)
- **Line 520:** Delete member button: `h-8 w-8 p-0` = **32px**
- **Severity:** MEDIUM
- **Fix:** `h-9 w-9`

### ❌ `/src/components/library/WorkflowListItem.tsx`
- **Line 97–119:** All action buttons (`Fork`, `Archive`, `View`): `h-8 w-8` = **32px**
- **Severity:** MEDIUM
- **Fix:** `h-9 w-9` minimum

### ❌ `/src/components/spaces/SpaceHeader.tsx`
- **Line 93:** Edit button: `h-7 w-7` = **28px**
- **Severity:** LOW
- **Fix:** `h-9 w-9`

### ❌ `/src/components/connectors/ConnectorDrawer.tsx`
- **Line 198:** Close button: `p-1.5` around `h-4 w-4` icon = **~26px total**
- **Severity:** MEDIUM
- **Fix:** `h-9 w-9 flex items-center justify-center` with `p-0`

### ❌ `/src/components/library/FilterBar.tsx`
- **Line 125:** Filter chip buttons: `px-3 py-1` = ~**26px height**
- **Line 169:** "Clear filters" button: `h-7` = **28px**
- **Severity:** LOW
- **Fix:** `py-1.5` (minimum 36px) or `h-8` for chips

### ⚠️ `/src/components/layout/LeftRail.tsx`
- **Line 88–95:** Nav links: `px-3 py-2` with 18px icon = ~**34px height**
- **Line 244:** Collapse toggle: `h-10` = **40px** (close to 44px)
- **Severity:** LOW
- **Fix:** `py-2.5` on links for ~38px; `h-11` on toggle

---

## 6. Text Readable at All Breakpoints

### ⚠️ `/app/console/page.tsx` — Very small text throughout
- **Line 47:** `text-[13px]` — header title
- **Line 54:** `text-[10px]` — "Org" label
- **Line 55–58:** `text-[11px]` — select dropdown
- **Line 71:** `text-[11px]` — role badge
- **Line 77:** `text-[10px]` — version
- **Line 80:** `text-[10px]` — status text
- **Line 83:** `text-[10px]` — avatar initials
- **Severity:** MEDIUM (console is likely desktop-only, but no mobile gate exists)
- **Fix:** Add mobile gate or increase text to `text-xs` (12px) minimum on small screens.

### ⚠️ `/src/components/console/ConsoleNav.tsx` — Very small text
- **Line 123:** `text-[10px]` — section headers
- **Line 137:** `text-[10px]` — section toggle button
- **Line 167:** `text-[11px]` — nav items
- **Severity:** MEDIUM
- **Fix:** `text-xs` minimum for mobile accessibility

### ✅ Most user-facing pages adequate
- `/app/page.tsx`: `text-4xl md:text-5xl` scales appropriately
- `/app/discover/page.tsx`: `text-2xl` heading is readable
- `/app/library/page.tsx`: `text-2xl` heading, `text-sm` body — acceptable
- `/app/settings/page.tsx`: `text-2xl` heading with responsive padding

### ⚠️ Headings lack mobile-down scaling
- `/app/library/page.tsx` Line 125: `text-2xl` — could be `text-xl sm:text-2xl`
- `/app/discover/page.tsx` Line 176: `text-2xl` — could be `text-xl sm:text-2xl`
- `/app/spaces/[id]/page.tsx` Line 37: `text-xl` — adequate
- `/app/settings/page.tsx` Line 619: `text-2xl` — could be `text-xl sm:text-2xl`

---

## 7. Cards Stack on Mobile

### ✅ `/app/page.tsx` — Recent Workflows
- **Lines 58, 67:** `grid-cols-1 gap-4 sm:grid-cols-2` — single column on mobile, 2 columns on ≥640px. **PASS.**

### ✅ `/app/discover/page.tsx` — Template Cards
- **Line 203:** `grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3` — single column on mobile, 2 on ≥768px, 3 on ≥1024px. **PASS.**

### ✅ `/app/connectors/page.tsx` — Connector Tiles
- **Line 151:** `grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4` — single column on mobile, 2 on ≥640px, 4 on ≥1024px. **PASS.**

### ✅ `/app/library/page.tsx` — Workflow List Items
- **Line 164:** `flex flex-col gap-3` — always vertical stack. **PASS.**

### ✅ `/src/components/discover/TemplateCard.tsx`
- Uses `flex flex-col` internally. Works within parent grid. **PASS.**

---

## 8. DAG Visualization Usable on Mobile

### ✅ No canvas-based DAG exists
- `/src/components/workflow/StepsTab.tsx` implements a **text-based** dependency visualization, not a graphical node-edge diagram.
- **Lines 83–122:** Tasks are displayed as a vertical list grouped by phase — inherently mobile-friendly.
- **Lines 126–149:** The "Dependency Graph" is a `flex-wrap gap-2` list of text pills (`from.name → to.name`). It wraps naturally on small screens.
- **Severity:** NONE (Good — text-based approach is more mobile-friendly than a canvas DAG)
- **Note:** If a true canvas/graph visualization is planned for the future, it will need pinch-to-zoom, pan, and responsive canvas sizing.

---

## 9. Modals Full-Screen on Mobile

### ✅ `/src/components/connectors/ConnectorDrawer.tsx`
- **Line 175:** `w-full max-w-md` — On viewports <448px, the drawer fills the full width. On larger screens, it caps at 448px.
- **Line 176:** `absolute right-0 top-0 h-full` — Full height, slides from right.
- **Severity:** NONE (Good)
- **Note:** No other modals/drawers were found in the audited page files. If `ClarificationCard` or other overlays exist, they should be verified separately.

---

## 10. Horizontal Overflow Issues

### ❌ `/app/w/[id]/page.tsx` — Multiple overflow risks
- **Line 46–48:** `LiveActivityRail` at `w-[320px]` is **always visible** with no responsive hiding. On a 375px iPhone, the rail + main content will force horizontal overflow or make content unreadable.
  - **Fix:** Hide rail on mobile: `hidden md:block` or collapse to icon-only `w-12` with `hidden sm:block`.
- **Line 201–247:** Tab navigation has `flex items-center gap-1` with no `overflow-x-auto`. Four tabs with badges on a narrow screen will overflow.
  - **Fix:** `<nav className="flex items-center gap-1 overflow-x-auto">`
- **Line 66:** WorkflowHeader uses `max-w-[1400px] px-6` inside a container that may be narrower than 1400px due to the right rail. Content may squish but `min-w-0` on flex children helps.
- **Severity:** HIGH

### ❌ `/src/components/library/FilterBar.tsx` — Search + Sort row doesn't wrap
- **Line 80:** `flex items-center gap-3` — The search input and `w-[180px]` sort Select are on a single row with no wrapping.
- On a 375px screen, 180px + ~150px search + gap = ~330px. The sort Select may shrink or overflow.
- **Severity:** MEDIUM
- **Fix:**
  ```tsx
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
  ```

### ❌ `/app/spaces/[id]/page.tsx` — TabsList overflow
- **Line 62:** `<TabsList className="mb-6">` — Default shadcn TabsList renders as a horizontal flex row. Four tabs ("Workflows", "Memory", "Artifacts", "Settings") will overflow on small screens.
- **Severity:** MEDIUM
- **Fix:** Wrap in `overflow-x-auto` or use vertical tabs on mobile.

### ❌ `/app/console/page.tsx` — Console overflow
- **Line 40:** `h-screen w-screen` with `overflow-hidden` on body but no responsive handling.
- **Line 90:** `<ConsoleNav>` is `w-52` fixed. The main content area gets `flex-1` which on mobile is viewport width minus 0 (if nav were hidden) or viewport width minus 208px (if nav shown). Since nav has no mobile hiding, content area is extremely narrow on mobile.
- **Severity:** HIGH
- **Fix:** Add `hidden md:block` to ConsoleNav, add hamburger toggle, or redirect mobile users to a "desktop only" message.

### ⚠️ `/app/library/page.tsx` — Filter chips may overflow
- **Line 122:** `flex flex-wrap items-center gap-2` — chips wrap, so no overflow.
- **Line 175:** `ml-auto flex items-center gap-2` result count — on very small screens with many active filters, the `ml-auto` element may wrap to next line. Acceptable behavior.
- **Severity:** LOW

### ⚠️ `/src/components/workflow/WorkflowHeader.tsx` — Actions may overflow
- **Line 117:** `flex shrink-0 items-center gap-2` — Cancel/Amend/Share buttons don't wrap. On small screens with long titles, the actions may be pushed off-screen or the title gets truncated (mitigated by `min-w-0`).
- **Severity:** MEDIUM
- **Fix:**
  ```tsx
  <div className="flex shrink-0 flex-wrap items-center gap-2">
  ```

---

## Issue Summary Table

| File | Line | Issue | Severity | Fix |
|------|------|-------|----------|-----|
| `/app/w/[id]/page.tsx` | 46–48 | LiveActivityRail always 320px wide, no mobile hiding | HIGH | Add `hidden md:block` or responsive collapse |
| `/app/w/[id]/page.tsx` | 201–247 | Tab nav has no `overflow-x-auto` | HIGH | Add `overflow-x-auto` to `<nav>` |
| `/app/w/[id]/page.tsx` | 30–307 | Zero responsive breakpoints on entire page | HIGH | Add `sm:`, `md:`, `lg:` prefixes throughout |
| `/app/library/page.tsx` | 122–217 | Zero responsive breakpoints | MEDIUM | Add responsive padding `px-4 sm:px-6` |
| `/app/spaces/[id]/page.tsx` | 57–87 | Zero responsive breakpoints | MEDIUM | Add responsive padding, wrap TabsList |
| `/app/console/page.tsx` | 40–96 | Zero responsive breakpoints; console unusable on mobile | HIGH | Add mobile nav collapse or desktop-only gate |
| `/src/components/connectors/ConnectorDrawer.tsx` | 232–284 | "Last 20 Calls" table lacks `overflow-x-auto` | MEDIUM | Wrap table in `overflow-x-auto` div |
| `/src/components/library/FilterBar.tsx` | 80 | Search + Sort row doesn't wrap on mobile | MEDIUM | Use `flex-col sm:flex-row` |
| `/src/components/workflow/WorkflowHeader.tsx` | 117 | Action buttons don't wrap | MEDIUM | Add `flex-wrap` |
| `/src/components/workflow/WorkflowHeader.tsx` | 71 | Back button 32px (below 44px) | MEDIUM | `h-9 w-9` minimum |
| `/app/w/[id]/page.tsx` | 57 | Rail toggle 28px (below 44px) | LOW | `h-9 w-9` |
| `/app/settings/page.tsx` | 427, 430, 433 | API key action buttons 32px | MEDIUM | `h-9 w-9` |
| `/app/settings/page.tsx` | 520 | Team delete button 32px | MEDIUM | `h-9 w-9` |
| `/src/components/library/WorkflowListItem.tsx` | 97–119 | Action buttons 32px | MEDIUM | `h-9 w-9` |
| `/src/components/spaces/SpaceHeader.tsx` | 93 | Edit button 28px | LOW | `h-9 w-9` |
| `/src/components/connectors/ConnectorDrawer.tsx` | 198 | Close button ~26px | MEDIUM | `h-9 w-9` |
| `/src/components/library/FilterBar.tsx` | 125 | Filter chips ~26px height | LOW | `py-1.5` or `h-8` |
| `/src/components/layout/LeftRail.tsx` | 88–95 | Nav links ~34px height | LOW | `py-2.5` |
| `/src/components/layout/MobileNav.tsx` | 12 | Spaces href hardcoded to `/s/engineering` | LOW | Make dynamic or link to `/spaces` |
| `/app/console/page.tsx` | 42–83 | Text sizes 10px–13px (very small) | MEDIUM | `text-xs` minimum |
| `/src/components/console/ConsoleNav.tsx` | 123, 137, 167 | Text sizes 10px–11px | MEDIUM | `text-xs` minimum |
| `/app/library/page.tsx` | 125 | Heading `text-2xl` with no mobile scaling | LOW | `text-xl sm:text-2xl` |
| `/app/discover/page.tsx` | 176 | Heading `text-2xl` with no mobile scaling | LOW | `text-xl sm:text-2xl` |
| `/app/settings/page.tsx` | 619 | Heading `text-2xl` with no mobile scaling | LOW | `text-xl sm:text-2xl` |

---

## Positive Patterns to Replicate

1. **`/app/settings/page.tsx` sidebar pattern:**
   - Desktop sidebar: `hidden lg:block` (line 586)
   - Mobile nav: `lg:hidden` with horizontal scroll chips (line 596)
   - Responsive padding: `p-4 sm:p-6 lg:p-8` (line 617)

2. **`/app/page.tsx` responsive heading:**
   - `text-4xl md:text-5xl` (line 33) — scales up on larger screens

3. **`/src/components/settings/ModelsTable.tsx` table wrapper:**
   - `overflow-x-auto` correctly wraps tables (line 106)

4. **`/src/components/layout/AppShell.tsx` rail replacement:**
   - `hidden sm:block` on rail + `<MobileNav />` with `sm:hidden` is the correct pattern

5. **`/src/components/layout/MainPane.tsx` mobile nav padding:**
   - `pb-16 sm:pb-0` compensates for bottom nav only on mobile

---

## Recommended Priority Order for Fixes

### P0 (Critical — Breaks Mobile Experience)
1. Add responsive breakpoints to `/app/w/[id]/page.tsx` (hide right rail, add tab scroll)
2. Add responsive breakpoints to `/app/console/page.tsx` (mobile nav collapse or gate)
3. Fix `/src/components/library/FilterBar.tsx` search/sort row wrapping

### P1 (High — Poor Mobile UX)
4. Add `overflow-x-auto` to ConnectorDrawer table
5. Add responsive padding to `/app/library/page.tsx`
6. Add responsive padding + TabsList scroll to `/app/spaces/[id]/page.tsx`
7. Enlarge touch targets below 44px across all components (batch fix)

### P2 (Medium — Polish)
8. Add mobile-down heading scaling (`text-xl sm:text-2xl`) to pages
9. Increase console text sizes to `text-xs` minimum
10. Fix MobileNav Spaces hardcoded href

---

*End of Audit Report*
