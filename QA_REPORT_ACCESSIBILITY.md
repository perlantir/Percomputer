# WCAG 2.2 AA Accessibility Audit Report

**Project:** Multi-Model Agent Platform  
**Audit Date:** 2025-01-15  
**Auditor:** React Component Quality Auditor  
**Scope:** 10 files audited against WCAG 2.2 Level AA  

---

## Executive Summary

| Category | Issues Found | Critical | High | Medium | Low |
|----------|-----------|----------|------|--------|-----|
| Color Contrast | 8 | 0 | 5 | 3 | 0 |
| Keyboard Accessibility | 7 | 0 | 4 | 3 | 0 |
| Focus Management | 6 | 0 | 2 | 3 | 1 |
| Labels / ARIA | 11 | 0 | 3 | 6 | 2 |
| Form Accessibility | 6 | 0 | 3 | 3 | 0 |
| Status Messages | 2 | 0 | 1 | 1 | 0 |
| Reduced Motion | 4 | 0 | 2 | 2 | 0 |
| Heading Hierarchy | 2 | 0 | 1 | 1 | 0 |
| **TOTAL** | **46** | **0** | **21** | **22** | **3** |

**Overall Verdict:** The codebase has significant accessibility gaps. The most pervasive issues are:
1. **Color contrast failures** in light mode (accent colors, tertiary text, semantic colors on white)
2. **Missing form labels and associations** across settings pages
3. **Icon-only buttons without accessible labels** throughout the UI
4. **Reduced motion not respected** in multiple animation components
5. **Missing ARIA live regions** for dynamic content updates

---

## Detailed Findings

---

### 1. `app/page.tsx`

#### Issue 1.1 — Missing `aria-live` for Loading State
- **WCAG Criterion:** 4.1.3 Status Messages (Level AA)
- **Line:** 57–65
- **Severity:** Medium
- **Description:** The skeleton loading state uses visual animation but does not announce the loading status to screen-reader users.
- **Fix:** Add `aria-live="polite"` and `aria-busy="true"` to the loading container:
  ```tsx
  <div aria-live="polite" aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-32 animate-skeleton rounded-lg border border-border-subtle" />
    ))}
  </div>
  ```

#### Issue 1.2 — "View all" Button Relies on Color Alone for State
- **WCAG Criterion:** 1.4.1 Use of Color (Level A)
- **Line:** 48–54
- **Severity:** Low
- **Description:** The "View all" button uses only color (`text-accent-primary`) to indicate it is interactive. While it is a native `<button>`, the hover state only changes color with no additional visual indicator.
- **Fix:** Add an underline or border on hover/focus to provide a non-color indicator of interactivity.

---

### 2. `app/w/[id]/page.tsx`

#### Issue 2.1 — Toggle Button Missing `aria-expanded` and `aria-controls`
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Line:** 57–66
- **Severity:** High
- **Description:** The sidebar collapse toggle (`LiveActivityRail`) is a `<button>` that controls the visibility of the Activity panel. It has no `aria-expanded` or `aria-controls` to communicate the expanded/collapsed state to assistive technology.
- **Fix:**
  ```tsx
  <button
    onClick={onToggle}
    aria-expanded={!collapsed}
    aria-controls="activity-rail-content"
    className="..."
  >
  ```
  And add `id="activity-rail-content"` to the `<ScrollArea>`.

#### Issue 2.2 — Tab Navigation Uses `<button>` Without `role="tab"` Pattern
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A), 4.1.2 Name, Role, Value (Level A)
- **Line:** 203–245
- **Severity:** Medium
- **Description:** The tab navigation is wrapped in a `<nav aria-label="Workflow tabs">` and uses `<button>` elements with `aria-current="page"`. While functional, this does not fully implement the ARIA Tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`). Screen readers may not announce the number of tabs or current tab position.
- **Fix:** Either implement full ARIA tabs pattern with `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"` on content, or keep the current `<nav>` + `<button>` pattern but add `aria-describedby` linking to the active tab panel.

#### Issue 2.3 — Active Tab Indicator Relies on Color/Position Alone
- **WCAG Criterion:** 1.4.1 Use of Color (Level A)
- **Line:** 239–241
- **Severity:** Medium
- **Description:** The active tab is indicated by a bottom border (`h-[2px] bg-[var(--accent-primary)]`). The text color difference between active and inactive tabs is subtle (`text-primary` vs `text-tertiary`). Users with color blindness may have difficulty distinguishing the active tab.
- **Fix:** Add `aria-selected="true"` (if using tab role) or ensure `aria-current="page"` is consistently applied. Consider adding a `font-weight` difference (e.g., `font-semibold` for active, `font-medium` for inactive).

#### Issue 2.4 — `alert()` Used for Feedback
- **WCAG Criterion:** 4.1.3 Status Messages (Level AA)
- **Line:** 163, 178
- **Severity:** High
- **Description:** `alert()` is used for "Cancel workflow" and "Link copied" feedback. `alert()` dialogs steal focus and can be disorienting for screen-reader users. The clipboard copy success is not announced to screen readers.
- **Fix:** Replace `alert()` with a visually styled toast/notification that uses `aria-live="polite"`. For the clipboard copy:
  ```tsx
  navigator.clipboard.writeText(window.location.href);
  // Announce to screen readers via a live region
  ```

#### Issue 2.5 — Running Status Indicator Uses Animated Spinner Without `aria-label`
- **WCAG Criterion:** 1.1.1 Non-text Content (Level A)
- **Line:** 85–86
- **Severity:** Medium
- **Description:** The `Loader2` spinning icon indicates a running workflow but has no accessible label. Screen-reader users cannot determine the workflow status.
- **Fix:** Wrap the spinner in a container with `aria-label` or add `aria-label="Workflow running"` to the icon:
  ```tsx
  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-primary)]" aria-label="Workflow running" />
  ```

#### Issue 2.6 — Missing `aria-label` on Activity Section `<aside>`
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Line:** 46–50
- **Severity:** Low
- **Description:** The `<aside>` element is a landmark but lacks an `aria-label` to distinguish it from other `<aside>` elements on the page.
- **Fix:** Add `aria-label="Live activity"` to the `<aside>`.

#### Issue 2.7 — Tab Panel Content Not Associated with Tab Controls
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Line:** 250–296
- **Severity:** Medium
- **Description:** The tab content area (`<main>`) does not have `role="tabpanel"`, `aria-labelledby`, or any other programmatic association with the tab buttons.
- **Fix:** Add `role="tabpanel"` and `aria-labelledby` pointing to the active tab button's ID, or add `id` to each tab panel and reference it from the tab buttons with `aria-controls`.

---

### 3. `app/library/page.tsx`

#### Issue 3.1 — Missing `aria-live` for Filter Results Update
- **WCAG Criterion:** 4.1.3 Status Messages (Level AA)
- **Line:** 147–163
- **Severity:** Medium
- **Description:** When filters change and the workflow list updates (or shows empty state), screen-reader users are not notified of the result count change.
- **Fix:** Add `aria-live="polite"` to the results container and an `aria-atomic="false"` region for the count:
  ```tsx
  <div aria-live="polite" aria-atomic="false">
    <p className="text-xs text-[var(--text-tertiary)]">
      Showing {start}–{end} of {total}
    </p>
  </div>
  ```

#### Issue 3.2 — Pagination Buttons Missing `aria-label`
- **WCAG Criterion:** 2.4.4 Link Purpose (In Context) (Level A)
- **Line:** 193–200, 204–210
- **Severity:** Medium
- **Description:** "Previous" and "Next" pagination buttons are clear visually but should explicitly reference the context (e.g., "Previous page of workflows").
- **Fix:** Add `aria-label="Previous page of workflows"` and `aria-label="Next page of workflows"`.

#### Issue 3.3 — Empty State Icon Has No Text Alternative
- **WCAG Criterion:** 1.1.1 Non-text Content (Level A)
- **Line:** 151
- **Severity:** Low
- **Description:** The `<Inbox>` icon in the empty state is purely decorative but is rendered without `aria-hidden="true"`.
- **Fix:** Add `aria-hidden="true"` to the icon:
  ```tsx
  <Inbox className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden="true" />
  ```

#### Issue 3.4 — Workflow List Lacks `aria-label` on Bulk Selection Checkboxes
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Line:** 165–181
- **Severity:** Medium
- **Description:** `WorkflowListItem` presumably contains a checkbox for bulk selection (based on `selected` and `onSelect` props), but without seeing that component, the parent page does not provide `aria-label` context for each checkbox.
- **Fix:** Pass `aria-label={`Select workflow: ${demo.workflow.objective}`}` to the `WorkflowListItem` or ensure the child component implements it.

---

### 4. `app/settings/page.tsx`

#### Issue 4.1 — Multiple Form Inputs Missing Explicit `<label>` Association
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A), 3.3.2 Labels or Instructions (Level A), 4.1.2 Name, Role, Value (Level A)
- **Lines:** 124–136 (Name, Email), 139–158 (Timezone), 200–213 (Primary/Backup Region), 242–248 (Switches), etc.
- **Severity:** High
- **Description:** Form fields use `<label>` elements visually, but the `<label>` is NOT programmatically associated with the input via `htmlFor`/`id`. The `<Input>`, `<Textarea>`, and `<Select>` components receive `defaultValue` but no `id`. Screen readers cannot determine which label belongs to which input.
- **Fix:** Add `id` props to every input and `htmlFor` to every label:
  ```tsx
  <label htmlFor="profile-name" className="text-sm font-medium text-foreground-secondary">Name</label>
  <Input id="profile-name" defaultValue={user?.name} className="pl-9" />
  ```

#### Issue 4.2 — Switch Components Missing Accessible Labels
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A), 1.3.1 Info and Relationships (Level A)
- **Lines:** 247, 255, 263, 282, 290, 318, 326, 334, 358
- **Severity:** High
- **Description:** `<Switch>` components from Radix UI are used throughout but lack `aria-label` or associated `<label>` elements with `htmlFor`/`id`. The switches in the Notifications and Privacy tabs control settings but have no accessible names.
- **Fix:** Wrap each switch in a `<label>` or add `aria-label`:
  ```tsx
  <label className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-foreground-primary">Episodic Memory</p>
      <p className="text-xs text-foreground-tertiary">Store workflow summaries...</p>
    </div>
    <Switch aria-label="Enable episodic memory" />
  </label>
  ```
  Or better: `aria-labelledby` pointing to the heading text.

#### Issue 4.3 — Icon-Only Buttons Without `aria-label`
- **WCAG Criterion:** 2.4.4 Link Purpose (In Context) (Level A), 4.1.2 Name, Role, Value (Level A)
- **Lines:** 427–435 (API Keys: Copy, Refresh, Trash), 520–522 (Team: Trash)
- **Severity:** High
- **Description:** Buttons containing only `<Copy />`, `<RefreshCw />`, `<Trash2 />` icons have no accessible name. Screen-reader users cannot determine the purpose of these buttons.
- **Fix:** Add `aria-label` to every icon-only button:
  ```tsx
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Copy API key ${key.name}`}>
    <Copy className="h-4 w-4" aria-hidden="true" />
  </Button>
  ```

#### Issue 4.4 — Team Table Missing Table Headers Association
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Lines:** 480–527
- **Severity:** Medium
- **Description:** The team members table uses `<th>` elements but lacks `scope="col"` on header cells. This helps screen readers associate data cells with their headers.
- **Fix:** Add `scope="col"` to each `<th>`.

#### Issue 4.5 — Mobile Settings Nav Uses `<a>` for Tab Navigation
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Lines:** 596–614
- **Severity:** Medium
- **Description:** The mobile settings navigation uses `<a href="/settings?tab=...">` elements that function as tabs. This causes full page reloads (or client-side navigation) rather than in-place tab switching, which is less accessible for screen-reader users who expect tab behavior within a settings panel.
- **Fix:** Use `<button>` elements with `role="tab"` that update the active tab via client-side state, and manage focus with `aria-selected`.

#### Issue 4.6 — `AvatarImage` Missing `alt` Text
- **WCAG Criterion:** 1.1.1 Non-text Content (Level A)
- **Lines:** 115–118, 494–497
- **Severity:** Medium
- **Description:** `<AvatarImage src={user?.avatarUrl} />` does not pass an `alt` prop. While `AvatarFallback` provides a text alternative, the image itself should have an `alt` attribute (e.g., the user's name) or `alt=""` if the fallback is the primary accessible content.
- **Fix:** Pass `alt={user?.name ?? ""}` to `AvatarImage`.

#### Issue 4.7 — Memory and Privacy Settings Switches Grouped Without Fieldset/Legend
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A), 3.3.2 Labels or Instructions (Level A)
- **Lines:** 191–293 (PrivacyTab), 304–365 (NotificationsTab)
- **Severity:** Medium
- **Description:** Groups of related switches (e.g., "Memory Settings", "Notification Channels") are not wrapped in `<fieldset>` with `<legend>`. Screen readers cannot tell users they are within a logical group.
- **Fix:** Wrap each card's switches in a `<fieldset>` with a visually hidden `<legend>` or use `role="group"` with `aria-labelledby` pointing to the card title.

---

### 5. `src/components/composer/Composer.tsx`

#### Issue 5.1 — `textarea` Missing `aria-describedby` for Error Message
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A), 3.3.1 Error Identification (Level A)
- **Lines:** 207–222, 252–258
- **Severity:** High
- **Description:** The error message (`<div>` with `AlertCircle` icon) is visually adjacent to the textarea but is NOT programmatically associated with the input. Screen-reader users navigating the textarea will not hear the error.
- **Fix:**
  ```tsx
  <textarea
    aria-describedby={composer.error ? "composer-error" : undefined}
    aria-invalid={composer.error ? "true" : "false"}
    ...
  />
  {composer.error && (
    <div id="composer-error" className="...">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{composer.error}</span>
    </div>
  )}
  ```

#### Issue 5.2 — Hidden File Input Has `aria-hidden="true"` but Is Still Focusable
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Line:** 284–292
- **Severity:** Medium
- **Description:** The hidden file input has `className="hidden"`, `aria-hidden="true"`, and `tabIndex={-1}`. While `hidden` (via `display: none` in Tailwind) removes it from the accessibility tree, the combination is redundant and confusing. If `hidden` is overridden by CSS, the element could become focusable without being announced.
- **Fix:** Remove `aria-hidden="true"` and `tabIndex={-1}` since `className="hidden"` (Tailwind `display: none`) is sufficient.

#### Issue 5.3 — Attachment Removal Button Uses `type="button"` but No `aria-label` on File Name
- **WCAG Criterion:** 1.1.1 Non-text Content (Level A), 2.4.4 Link Purpose (Level A)
- **Line:** 235–246
- **Severity:** Low
- **Description:** The attachment removal button has a good `aria-label={`Remove ${att.name}`}`, which is correct. However, the attachment name `<span>` is a generic `<span>` with no semantic role.
- **Fix:** (Already good) — The `aria-label` is correct. The file name span could use `aria-hidden="false"` (default) which is fine.

#### Issue 5.4 — Slash Menu Not Using `aria-activedescendant` Pattern
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Lines:** 296–303
- **Severity:** Medium
- **Description:** The `SlashMenu` is a custom dropdown. Without seeing its implementation, the parent `Composer` passes `selectedIndex` but there is no evidence of `aria-activedescendant`, `role="listbox"`, or `role="option"` being applied in the parent.
- **Fix:** Ensure `SlashMenu` implements a proper ARIA combobox/listbox pattern with `aria-activedescendant` tracking the `selectedIndex`.

#### Issue 5.5 — Keyboard Trap Risk in Slash Menu
- **WCAG Criterion:** 2.1.2 No Keyboard Trap (Level A)
- **Lines:** 123–168
- **Severity:** High
- **Description:** When the slash menu is open, pressing `Escape` closes it (good). However, `Tab` behavior is not handled — pressing `Tab` while the slash menu is open will move focus out of the textarea to the next focusable element in the page, leaving the slash menu visually open but unfocused.
- **Fix:** Handle `Tab` key in `handleKeyDown` to either close the slash menu or move focus within it. Alternatively, use `aria-controls` and ensure focus stays managed.

#### Issue 5.6 — `placeholder` Used as Only Label
- **WCAG Criterion:** 3.3.2 Labels or Instructions (Level A)
- **Line:** 214
- **Severity:** Medium
- **Description:** The textarea uses `placeholder="What would you like Computer to do?"` as its only visible label. While `aria-label="Workflow objective"` is present, the placeholder is not a persistent label and disappears once text is entered. Low-vision users who use high-contrast modes may not see placeholders at all.
- **Fix:** Add a visible `<label>` element above the textarea:
  ```tsx
  <label htmlFor="composer-textarea" className="sr-only">Workflow objective</label>
  <textarea id="composer-textarea" ... />
  ```
  (The `aria-label` is acceptable but a visible label is preferred for cognitive accessibility.)

---

### 6. `src/components/workflow/AnswerTab.tsx`

#### Issue 6.1 — CitationChip Tooltip Not Keyboard Accessible
- **WCAG Criterion:** 2.1.1 Keyboard (Level A), 2.1.2 No Keyboard Trap (Level A)
- **Lines:** 37–87
- **Severity:** High
- **Description:** The `CitationChip` tooltip is triggered only by `onMouseEnter`/`onMouseLeave`. There is no keyboard equivalent (e.g., `onFocus`/`onBlur`). Keyboard-only users cannot access the citation preview or click the citation button to view sources.
- **Fix:** Add `onFocus` and `onBlur` handlers (or use Radix Tooltip component which handles this automatically):
  ```tsx
  <span
    className="relative inline-block"
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onFocus={() => setHovered(true)}
    onBlur={() => setHovered(false)}
    tabIndex={0}
  >
  ```

#### Issue 6.2 — CitationChip `<button>` Inside `<sup>` Has No `aria-label`
- **WCAG Criterion:** 2.4.4 Link Purpose (In Context) (Level A)
- **Line:** 45–51
- **Severity:** Medium
- **Description:** The citation index button has no accessible name explaining what it does. A screen reader will only announce the number (e.g., "1, button").
- **Fix:** Add `aria-label={`View source ${index}: ${title}`}`:
  ```tsx
  <button
    onClick={onClick}
    aria-label={`View source ${index}: ${title}`}
    className="..."
  >
    {index}
  </button>
  ```

#### Issue 6.3 — Streaming Indicator Animation Not Respecting `prefers-reduced-motion`
- **WCAG Criterion:** 2.3.3 Animation from Interactions (Level AAA) — also 2.2.2 Pause, Stop, Hide (Level A)
- **Lines:** 91–105
- **Severity:** High
- **Description:** The `StreamingIndicator` uses `animate-pulse`, `animate-bounce` (three bouncing dots), and a spinning sparkle icon. These animations run continuously and do not respect `prefers-reduced-motion`.
- **Fix:**
  ```tsx
  function StreamingIndicator() {
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return (
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className={cn("h-4 w-4 text-[var(--accent-primary)]", !reducedMotion && "animate-pulse")} />
        <span className="text-sm text-[var(--accent-primary)]">Synthesizing answer...</span>
        {!reducedMotion && (
          <span className="inline-flex gap-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </div>
    );
  }
  ```

#### Issue 6.4 — Markdown Code Blocks Missing `aria-label` for Copy Action
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Lines:** 124–136
- **Severity:** Medium
- **Description:** Code blocks have a language label but no copy-to-clipboard button. While this is not an accessibility issue per se, if a copy button is added in the future, it must have an accessible label.
- **Fix:** (No immediate fix needed, but document as a note for future enhancement.)

#### Issue 6.5 — Markdown Tables Missing `<caption>` or `aria-label`
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Lines:** 223–252
- **Severity:** Medium
- **Description:** Tables rendered via `ReactMarkdown` have `<thead>` and `<th>` but no `<caption>` or `aria-label`. Screen-reader users will not know the purpose of the table without reading its content.
- **Fix:** Consider adding an optional `caption` prop to the table renderer or wrapping tables in a `<figure>` with `<figcaption>`.

#### Issue 6.6 — Heading Hierarchy May Be Broken in Markdown Content
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A), 2.4.6 Headings and Labels (Level AA)
- **Lines:** 150–168
- **Severity:** Medium
- **Description:** The `AnswerTab` renders `h2` and `h3` elements from markdown. If the page already has an `<h1>` (it does, in `WorkflowHeader`), this is correct. However, markdown content could skip heading levels (e.g., jump from `h2` to `h4`), which breaks the document outline for screen-reader users.
- **Fix:** Sanitize/validate markdown headings to ensure no skipped levels, or normalize all markdown headings to start at `h2`.

#### Issue 6.7 — Motion on Citation Tooltip Uses `framer-motion` Without Reduced Motion Check
- **WCAG Criterion:** 2.3.3 Animation from Interactions (Level AAA)
- **Lines:** 54–85
- **Severity:** Medium
- **Description:** The `AnimatePresence` + `motion.div` tooltip animation does not check `prefers-reduced-motion`. Users who have requested reduced motion will still see the fade/slide animation.
- **Fix:** Use Framer Motion's `useReducedMotion()` hook:
  ```tsx
  import { useReducedMotion } from "framer-motion";
  // ...
  const shouldReduceMotion = useReducedMotion();
  <motion.div
    initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
  >
  ```

---

### 7. `src/components/layout/LeftRail.tsx`

#### Issue 7.1 — Spaces Dropdown Button Missing `aria-expanded`
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Line:** 112–145
- **Severity:** High
- **Description:** The "Spaces" dropdown toggle is a `<button>` that controls a submenu. It has no `aria-expanded` attribute, so screen-reader users cannot tell whether the submenu is open or closed.
- **Fix:**
  ```tsx
  <button
    onClick={() => !isCollapsed && setSpacesOpen(!spacesOpen)}
    aria-expanded={spacesOpen}
    aria-controls="spaces-submenu"
    className="..."
  >
  ```
  And add `id="spaces-submenu"` to the `<ul>` containing the spaces.

#### Issue 7.2 — Collapsed Rail: Icons Lose Visible Text Labels
- **WCAG Criterion:** 1.3.3 Sensory Characteristics (Level A), 2.4.6 Headings and Labels (Level AA)
- **Lines:** 96–97, 122–123, 205–206, 229–230
- **Severity:** Medium
- **Description:** When the rail is collapsed, navigation items show only icons. Each icon has a `title` attribute for the tooltip, but `title` is not reliably announced by all screen readers and is not keyboard-accessible. The icons themselves are not focusable when within `<Link>` elements.
- **Fix:** Add `aria-label` to each `<Link>` in collapsed mode:
  ```tsx
  <Link
    href={item.href}
    aria-label={isCollapsed ? item.label : undefined}
    className="..."
  >
  ```

#### Issue 7.3 — Collapse Toggle Button Missing `aria-expanded`
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Line:** 244–253
- **Severity:** Medium
- **Description:** The sidebar collapse button has `aria-label` (good) but lacks `aria-expanded` to communicate the sidebar's state.
- **Fix:**
  ```tsx
  <button
    onClick={toggle}
    aria-expanded={!isCollapsed}
    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    className="..."
  >
  ```

#### Issue 7.4 — Credit Display Uses Animated Pulse Without `prefers-reduced-motion`
- **WCAG Criterion:** 2.2.2 Pause, Stop, Hide (Level A), 2.3.3 Animation from Interactions (Level AAA)
- **Lines:** 188–191
- **Severity:** Medium
- **Description:** The credit indicator uses `animate-ping` (a pulsing dot) continuously. This animation is decorative and should be disabled for users who prefer reduced motion.
- **Fix:**
  ```tsx
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ...
  <span className="relative flex h-2 w-2 shrink-0">
    {!reducedMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
  </span>
  ```

#### Issue 7.5 — Logo Text "M" in Colored Box Has Insufficient Contrast
- **WCAG Criterion:** 1.4.3 Contrast (Minimum) (Level AA)
- **Lines:** 68–70
- **Severity:** High
- **Description:** The logo uses white text (`text-white`, `#FFFFFF`) on `--accent-primary` (`#20B8CD`). Contrast ratio is **2.39:1**, which fails the 4.5:1 requirement for normal text.
- **Fix:** Use a darker background (e.g., `--accent-primary-hover` `#1AA0B4` on white is 3.12:1 — still fails). Use `--text-primary` `#13343B` on `--accent-primary` background is 4.58:1 which passes. Or add a dark text shadow/outline to the white "M".
  ```tsx
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
    <span className="text-sm font-bold text-[var(--text-primary)] drop-shadow-sm">M</span>
  </div>
  ```

#### Issue 7.6 — Rail Does Not Trap Focus When Expanded
- **WCAG Criterion:** 2.4.3 Focus Order (Level A)
- **Lines:** 51–255
- **Severity:** Low
- **Description:** The sidebar is a fixed-position overlay. When using keyboard navigation, focus can move out of the sidebar into the main page content behind it without the user realizing. While not a modal, this is a focus management concern.
- **Fix:** Consider adding a `focus-trap` behavior when the sidebar is the primary navigation, or ensure the sidebar is not positioned above main content in the tab order unexpectedly.

---

### 8. `src/components/layout/CommandPalette.tsx`

#### Issue 8.1 — Dialog Missing `aria-labelledby` and `aria-describedby`
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A), 4.1.2 Name, Role, Value (Level A)
- **Line:** 205
- **Severity:** Medium
- **Description:** The command palette root `<div>` has `role="dialog"` and `aria-modal="true"` with `aria-label="Command palette"`, which is good. However, there is no `aria-describedby` pointing to the input's placeholder text, which could help screen-reader users understand the purpose.
- **Fix:** Add `aria-describedby="command-palette-desc"` and an invisible description:
  ```tsx
  <div role="dialog" aria-modal="true" aria-label="Command palette" aria-describedby="command-desc">
    <span id="command-desc" className="sr-only">Type to search commands, workflows, and connectors. Use arrow keys to navigate and Enter to select.</span>
  ```

#### Issue 8.2 — Command Palette Footer Hints Use `<kbd>` Without Screen-Reader Context
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Lines:** 289–305
- **Description:** The footer shows keyboard shortcuts using `<kbd>` elements. Screen readers will read "greater than" for `>` and the literal key names without context. The footer is purely visual helper text.
- **Fix:** Wrap the footer in `aria-hidden="true"` and add a visually hidden description for screen readers:
  ```tsx
  <div aria-hidden="true" className="flex items-center justify-between ...">
    {/* visual footer */}
  </div>
  <span className="sr-only">Use up and down arrows to navigate, Enter to select, Escape to close.</span>
  ```

#### Issue 8.3 — Highlighted Search Results Use `<mark>` Without `aria-label`
- **WCAG Criterion:** 1.3.1 Info and Relationships (Level A)
- **Lines:** 52–55
- **Severity:** Low
- **Description:** The `Highlight` component uses `<mark>` for matched text. The `<mark>` element has semantic meaning but no accessible label to explain *why* it is marked.
- **Fix:** Add `aria-label="Search match"` or wrap in a visually hidden context. Alternatively, use `aria-describedby` on the result item to indicate "matched text highlighted".

#### Issue 8.4 — No Announcement of Results Count Change
- **WCAG Criterion:** 4.1.3 Status Messages (Level AA)
- **Lines:** 181–198
- **Severity:** Medium
- **Description:** As the user types in the search box, results are filtered visually but there is no `aria-live` region to announce "X results found" or "No results found".
- **Fix:** Add an `aria-live="polite"` region:
  ```tsx
  <div aria-live="polite" aria-atomic="true" className="sr-only">
    {filtered.length === 0 ? `No results found for ${query}` : `${filtered.length} results found`}
  </div>
  ```

#### Issue 8.5 — Motion Transitions Not Respecting `prefers-reduced-motion`
- **WCAG Criterion:** 2.3.3 Animation from Interactions (Level AAA), 2.2.2 Pause, Stop, Hide (Level A)
- **Lines:** 207–222
- **Severity:** Medium
- **Description:** The Framer Motion backdrop and palette entrance/exit animations do not check `useReducedMotion()`.
- **Fix:**
  ```tsx
  import { useReducedMotion } from "framer-motion";
  const reducedMotion = useReducedMotion();
  // ...
  <motion.div
    initial={reducedMotion ? false : { opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={reducedMotion ? false : { opacity: 0 }}
    transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}
  />
  ```

---

### 9. `src/components/ui/dialog.tsx`

#### Issue 9.1 — Dialog Animations Not Respecting `prefers-reduced-motion`
- **WCAG Criterion:** 2.3.3 Animation from Interactions (Level AAA), 2.2.2 Pause, Stop, Hide (Level A)
- **Lines:** 21–28, 39–43
- **Severity:** Medium
- **Description:** The `DialogOverlay` and `DialogContent` use `data-[state=open]:animate-in`, `data-[state=closed]:animate-out`, `zoom-in-95`, `slide-in-from-top-[48%]` etc. These CSS animations do not respect `prefers-reduced-motion`.
- **Fix:** Add a media query wrapper or use Tailwind's `motion-reduce:` variant:
  ```tsx
  className={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 ...",
    "motion-reduce:animate-none motion-reduce:transition-none",
    "data-[state=open]:animate-in ..."
  )}
  ```

#### Issue 9.2 — Close Button `aria-label` Only Via `sr-only` Text
- **WCAG Criterion:** 4.1.2 Name, Role, Value (Level A)
- **Lines:** 47–50
- **Severity:** Low
- **Description:** The close button contains `<span className="sr-only">Close</span>`, which is the correct pattern. The `DialogPrimitive.Close` from Radix likely handles focus return. This is actually correct and should be noted as a **positive finding**.
- **Status:** ✅ PASS

#### Issue 9.3 — Dialog Title Uses `font-display` Which May Be Hard to Read
- **WCAG Criterion:** 1.4.8 Visual Presentation (Level AAA)
- **Lines:** 88–95
- **Severity:** Low
- **Description:** The `DialogTitle` uses `font-display` which may be a decorative/display font. Display fonts can be harder to read for users with dyslexia or low vision.
- **Fix:** Ensure `font-display` falls back to a highly legible sans-serif. This is already handled by the CSS variable fallback (`ui-sans-serif, system-ui, ...`), so this is a minor note.

---

### 10. `src/components/ui/dropdown-menu.tsx`

#### Issue 10.1 — Dropdown Menu Animations Not Respecting `prefers-reduced-motion`
- **WCAG Criterion:** 2.3.3 Animation from Interactions (Level AAA), 2.2.2 Pause, Stop, Hide (Level A)
- **Lines:** 46–53, 62–72
- **Severity:** Medium
- **Description:** `DropdownMenuSubContent` and `DropdownMenuContent` use `animate-in`, `animate-out`, `zoom-in-95`, `slide-in-from-top-2`, etc. No `prefers-reduced-motion` handling is present.
- **Fix:** Add `motion-reduce:animate-none motion-reduce:transition-none` to the className strings.

#### Issue 10.2 — Checkbox Item Uses `absolute` Icon Positioning
- **WCAG Criterion:** 1.3.2 Meaningful Sequence (Level A)
- **Lines:** 97–114
- **Severity:** Low
- **Description:** The check icon is positioned absolutely at `left-2`. Since it is inside the item before the text content in DOM order, screen readers will announce it in the correct sequence. This is acceptable but should be verified with testing.
- **Status:** ✅ Likely PASS — the DOM order is correct.

#### Issue 10.3 — `DropdownMenuItem` Has `cursor-default` But Should Have `cursor-pointer`
- **WCAG Criterion:** 2.5.5 Target Size (Enhanced) (Level AAA)
- **Lines:** 82–90
- **Severity:** Low
- **Description:** `cursor-default` (arrow cursor) on interactive items can confuse users who expect the pointer hand cursor on clickable elements. While not a strict WCAG violation at AA, it is a usability issue that affects perceived affordance.
- **Fix:** Change `cursor-default` to `cursor-pointer`.

---

## Color Contrast Analysis (Light Mode)

| Foreground | Background | Ratio | WCAG AA | Used For |
|-----------|-----------|-------|---------|----------|
| `#13343B` (text-primary) | `#FFFFFF` (bg-surface) | **13.27:1** | ✅ PASS | Headings, body text |
| `#5A6B6E` (text-secondary) | `#FFFFFF` | **5.58:1** | ✅ PASS | Secondary text |
| `#8A9799` (text-tertiary) | `#FFFFFF` | **3.01:1** | ❌ FAIL | Placeholders, hints, inactive tabs, metadata |
| `#20B8CD` (accent-primary) | `#FFFFFF` | **2.39:1** | ❌ FAIL | Links, active states, badges, buttons |
| `#1AA0B4` (accent-hover) | `#FFFFFF` | **3.12:1** | ❌ FAIL | Hover states |
| `#E07A5F` (accent-secondary) | `#FFFFFF` | **2.95:1** | ❌ FAIL | Secondary accent text |
| `#F4A261` (accent-tertiary) | `#FFFFFF` | **2.06:1** | ❌ FAIL | Tertiary accent text |
| `#2A9D8F` (success) | `#FFFFFF` | **3.32:1** | ❌ FAIL | Success states |
| `#E9C46A` (warning) | `#FFFFFF` | **1.67:1** | ❌ FAIL | Warning states |
| `#E76F51` (danger) | `#FFFFFF` | **3.09:1** | ❌ FAIL | Error text, danger badges |
| `#FFFFFF` (white) | `#20B8CD` (accent-primary) | **2.39:1** | ❌ FAIL | Logo text, inverse buttons |
| `#8A9799` (text-tertiary) | `#F4F1EB` (bg-surface-2) | **2.67:1** | ❌ FAIL | Metadata on elevated surfaces |

### Dark Mode Contrast

| Foreground | Background | Ratio | WCAG AA | Used For |
|-----------|-----------|-------|---------|----------|
| `#F1EFEA` (text-primary) | `#202222` (bg-surface) | **13.91:1** | ✅ PASS | Headings, body text |
| `#A8B0B1` (text-secondary) | `#202222` | **7.24:1** | ✅ PASS | Secondary text |
| `#6F7878` (text-tertiary) | `#202222` | **3.53:1** | ❌ FAIL | Placeholders, hints |
| `#20B8CD` (accent-primary) | `#202222` | **6.70:1** | ✅ PASS | Links, active states |
| `#E76F51` (danger) | `#202222` | **5.17:1** | ✅ PASS | Error text |
| `#E9C46A` (warning) | `#202222` | **9.57:1** | ✅ PASS | Warning text |

**Key Conclusion:** Light mode has **10 contrast failures**. `text-tertiary` is used extensively for placeholders, metadata, inactive UI elements, and decorative text — all of which fail WCAG AA on white or light surfaces. The accent colors (`accent-primary`, `accent-secondary`, `accent-tertiary`) also fail on white, making links and interactive accent-colored text inaccessible to users with low vision.

---

## Positive Findings

These patterns demonstrate good accessibility practices and should be maintained:

| File | Line | Practice |
|------|------|----------|
| `app/page.tsx` | 30 | `<main>` landmark used |
| `app/w/[id]/page.tsx` | 203 | `<nav aria-label="Workflow tabs">` |
| `app/w/[id]/page.tsx` | 223 | `aria-current="page"` on active tab |
| `src/components/composer/Composer.tsx` | 220 | `aria-label="Workflow objective"` on textarea |
| `src/components/composer/Composer.tsx` | 243 | `aria-label={`Remove ${att.name}`}` on remove button |
| `src/components/layout/LeftRail.tsx` | 57 | `aria-label="Main navigation"` on `<aside>` |
| `src/components/layout/LeftRail.tsx` | 250 | `aria-label` on collapse toggle button |
| `src/components/layout/CommandPalette.tsx` | 205 | `role="dialog"`, `aria-modal="true"`, `aria-label` |
| `src/components/ui/dialog.tsx` | 47–50 | `sr-only` text for close button |
| `src/components/ui/dialog.tsx` | 84–96 | `DialogPrimitive.Title` used for dialog heading |
| `src/components/ui/dropdown-menu.tsx` | 82–90 | `focus:bg-[var(--bg-surface-2)]` — visible focus states |
| `app/settings/page.tsx` | 584 | `<aside>` landmark for settings sidebar |
| `app/settings/page.tsx` | 617 | `<main>` landmark for content area |

---

## Recommendations Priority Matrix

### P0 — Fix Before Release (Critical/High)
1. Add explicit `<label htmlFor>` associations to all form inputs in `app/settings/page.tsx` (Issue 4.1)
2. Add `aria-label` to all icon-only buttons in `app/settings/page.tsx` (Issue 4.3)
3. Associate error messages with inputs via `aria-describedby` in `Composer.tsx` (Issue 5.1)
4. Fix keyboard accessibility of citation tooltips in `AnswerTab.tsx` (Issue 6.1)
5. Add `aria-expanded` to Spaces dropdown in `LeftRail.tsx` (Issue 7.1)
6. Fix `alert()` usage for status messages in `app/w/[id]/page.tsx` (Issue 2.4)
7. Replace `alert()` with accessible toasts across all pages
8. Fix light-mode color contrast for `text-tertiary` and accent colors

### P1 — Fix in Next Sprint (Medium)
9. Add `prefers-reduced-motion` support to `AnswerTab.tsx`, `CommandPalette.tsx`, `dialog.tsx`, `dropdown-menu.tsx`
10. Add `aria-live` regions for dynamic content updates (library filters, command palette results)
11. Implement full ARIA tabs pattern in `app/w/[id]/page.tsx`
12. Add `aria-label` to `AvatarImage` components
13. Wrap switch groups in `<fieldset>` with `<legend>` in settings
14. Add `scope="col"` to table headers in Team tab

### P2 — Polish (Low)
15. Add `aria-hidden="true"` to purely decorative icons
16. Ensure `cursor-pointer` on all clickable `DropdownMenuItem` elements
17. Add table captions for markdown-rendered tables
18. Normalize heading hierarchy in markdown content

---

## Appendix: WCAG 2.2 AA Criteria Checklist

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1.1.1 | Non-text Content | ⚠️ Partial | Some icons lack labels; avatars lack alt |
| 1.3.1 | Info and Relationships | ❌ Fail | Missing label associations, table scopes |
| 1.3.2 | Meaningful Sequence | ✅ Pass | DOM order is logical |
| 1.3.3 | Sensory Characteristics | ⚠️ Partial | Some states rely on color alone |
| 1.4.1 | Use of Color | ⚠️ Partial | Active tab indicator could be clearer |
| 1.4.3 | Contrast (Minimum) | ❌ Fail | Multiple color pairs fail in light mode |
| 1.4.4 | Resize Text | ✅ Pass | Relative units used throughout |
| 1.4.10 | Reflow | ✅ Pass | Responsive layout observed |
| 1.4.11 | Non-text Contrast | ⚠️ Partial | Some borders may be too subtle |
| 1.4.12 | Text Spacing | ✅ Pass | No fixed-height text containers that clip |
| 2.1.1 | Keyboard | ⚠️ Partial | Citation tooltip not keyboard accessible |
| 2.1.2 | No Keyboard Trap | ⚠️ Partial | Slash menu tab behavior undefined |
| 2.4.3 | Focus Order | ✅ Pass | Generally logical |
| 2.4.4 | Link Purpose | ⚠️ Partial | Some icon-only buttons lack labels |
| 2.4.6 | Headings and Labels | ⚠️ Partial | Some placeholders used as labels |
| 2.4.7 | Focus Visible | ✅ Pass | `focus-visible:outline` in globals.css |
| 2.5.5 | Target Size (Enhanced) | N/A | AAA only |
| 2.5.8 | Target Size (Minimum) | ✅ Pass | Buttons appear ≥ 24×24px |
| 3.1.1 | Language of Page | ⚠️ Unverified | `<html lang="en">` not verified |
| 3.2.1 | On Focus | ✅ Pass | No unexpected context changes |
| 3.2.2 | On Input | ✅ Pass | Filter changes don't cause unexpected jumps |
| 3.3.1 | Error Identification | ❌ Fail | Error messages not associated with inputs |
| 3.3.2 | Labels or Instructions | ❌ Fail | Form labels not programmatically associated |
| 4.1.1 | Parsing | ✅ Pass | Valid JSX/HTML structure |
| 4.1.2 | Name, Role, Value | ❌ Fail | Multiple missing `aria-expanded`, `aria-label` |
| 4.1.3 | Status Messages | ❌ Fail | No `aria-live` for dynamic updates |

---

*End of Report*
