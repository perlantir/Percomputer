# Composer & Layout Components QA Audit Report

**Project:** multi-model-agent-platform  
**Scope:** `src/components/composer/*` + `src/components/layout/*`  
**Date:** Auto-generated  
**Auditor:** React Component Quality Auditor  
**Methodology:** Static code analysis against React best practices, WCAG 2.1 AA, and performance guidelines.

---

## Executive Summary

| Category | Score | Notes |
|----------|-------|-------|
| Accessibility (a11y) | 6.5 / 10 | Good foundations (labels, roles, focus rings) but missing focus traps, `aria-current`, live regions, and focus-return patterns. |
| Keyboard Navigation | 7 / 10 | Slash menu and command palette work, but focus management is incomplete (no trap, no return). |
| Performance | 6 / 10 | Several unmemoized callbacks, duplicated filtering logic, and inefficient toast re-render pattern. |
| Prop Typing / Composition | 8 / 10 | Well-typed interfaces; minor leakage of implementation types. |
| Error Handling | 8 / 10 | ErrorBoundary is solid but production telemetry is a stub. |

---

## 1. Composer Components

### 1.1 Composer.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| C-01 | 60, 84, 122, 179, 181, 189 | **Medium** | `handleTextChange`, `handleSlashSelect`, `handleKeyDown`, `handleFileSelect`, `handleFileChange`, `handleChipSelect` are not wrapped in `useCallback`. Every keystroke or state change recreates them, causing child re-renders if those callbacks are ever used in dependency arrays. | Wrap all handler functions in `useCallback` with correct dependency arrays. |
| C-02 | 122–176 | **Low** | Slash command filtering logic (`q`, `filtered`) is duplicated inline inside `handleKeyDown`. The same logic exists in `SlashMenu.tsx`. | Extract a shared `filterSlashCommands(filter)` utility to eliminate duplication and reduce bundle size. |
| C-03 | 213 | **Medium** | `onBlur={() => composer.setIsFocused(false)}` on the textarea. If the user opens the slash menu and clicks inside it, the textarea loses blur and `isFocused` becomes `false`. If any UI depends on `isFocused`, it may flicker or hide prematurely. | Use `relatedTarget` checks or a container-level focus listener to distinguish internal vs. external blur. |
| C-04 | 253–258 | **Medium** | Error message div has no `aria-live` region and no `aria-describedby` / `aria-errormessage` linkage to the textarea. Screen reader users are not notified when `composer.error` appears. | Add `aria-live="polite"` to the error container and link it to the textarea via `aria-errormessage`. |
| C-05 | 207 | **Low** | Textarea does not set `aria-invalid` when `composer.error` is non-null. | Add `aria-invalid={!!composer.error}` to the textarea. |
| C-06 | 261–272 | **Low** | `fileSource` is hardcoded to `null` and `onSetFileSource` is an empty function. Dead props passed to `ComposerToolbar`. | Either wire these up to real state or remove them from `ComposerToolbarProps` to clean the API. |
| C-07 | 295–303 | **High** | No focus trap when `SlashMenu` is open. Users can Tab out of the composer into browser chrome without closing the menu. | Implement a focus trap (or use a headless UI library) when `slashMenuOpen` is true, returning focus to the textarea on close. |

#### Positive Findings
- `aria-label` on textarea and attachment remove buttons.
- Keyboard shortcuts for slash navigation (ArrowDown/Up, Enter, Escape) and submit (Cmd/Ctrl+Enter).
- `requestAnimationFrame` used to restore cursor position after slash command insertion.
- `prefers-reduced-motion` respected for height transitions.

---

### 1.2 ComposerToolbar.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| CT-01 | 56–57 | **Low** | Component receives `fileSource` and `onSetFileSource` props that are not meaningfully used by parent (`Composer.tsx`). | Remove unused props from interface or wire them to real state. |

#### Positive Findings
- Every interactive element has an `aria-label` or visible text.
- `focus-visible` rings are present on all buttons.
- `disabled` states and `aria-label` for the Run button adapt to `isSubmitting`.

---

### 1.3 SlashMenu.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| SM-01 | 76–86 | **High** | Menu position is computed once on open via `getBoundingClientRect`. No scroll or resize listener means the menu can detach from the composer if the user scrolls or resizes the window while it is open. | Add a `useEffect` with `window.addEventListener('scroll', ..., true)` and `window.addEventListener('resize', ...)` to reposition the menu. Consider using a Popper-style positioning library. |
| SM-02 | 89–102 | **Medium** | Duplicate Escape listener. `SlashMenu` adds a global `keydown` listener for Escape, but `Composer.tsx` *also* handles Escape for the same purpose. Two listeners fire for the same event, which is redundant and could lead to race conditions. | Remove the Escape handler from `SlashMenu` and let the parent `Composer` exclusively control open/close state, or vice versa. |
| SM-03 | 120–154 | **Medium** | No click-outside handler. Clicking anywhere outside the slash menu does not close it. | Add a `mousedown` listener on `document` (or use a `useClickOutside` hook) to call `onClose()` when the user clicks outside the menu. |
| SM-04 | 115 | **Low** | `safeIndex` uses modulo (`%`) which causes wrap-around when the filter list shrinks. While not a crash, it can cause the selection to jump unexpectedly from the last item back to the first. | Cap the index with `Math.min(selectedIndex, filtered.length - 1)` or reset to 0 when filter changes. |
| SM-05 | 68–75 | **Low** | `anchorRef` is typed as `React.RefObject<HTMLElement | null>`. The code accesses `anchorRef.current` unconditionally in `useEffect`, but the ref could be `null` briefly during fast unmount/remount cycles. | Add an explicit null-check before calling `getBoundingClientRect`, even though one exists in the effect guard. |

#### Positive Findings
- Uses `Command` / `CommandList` / `CommandGroup` / `CommandItem` from shadcn/ui, which provide built-in ARIA roles.
- `filtered` array is memoized with `useMemo`.
- Animates with `animate-slide-up`.

---

### 1.4 AdvancedOptions.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| AO-01 | 52–57 | **Low** | `onChange` prop type leaks implementation detail: `React.Dispatch<React.SetStateAction<ComposerOptions>>`. Consumers must know the state shape to call it correctly. | Change to `(options: Partial<ComposerOptions>) => void` or `(updater: (prev: ComposerOptions) => ComposerOptions) => void` for a cleaner boundary. |
| AO-02 | 60–77 | **Low** | The toggle button expands/collapses advanced options, but there is no focus management into the panel when it opens, and focus is not trapped inside the panel. | On open, move focus to the first focusable control in the panel, or at least ensure Tab order flows naturally into it. |
| AO-03 | 90–115 | **Low** | The budget `Slider` and `number` input are not programmatically linked. Screen readers do not know they control the same value. | Add `aria-labelledby` on both pointing to a shared `<label>` id, or use `aria-describedby` to clarify the relationship. |
| AO-04 | 148–184 | **Low** | DropdownMenu for deliverable kinds and model policy are not memoized; callbacks and arrays are recreated each render. | Wrap inline callbacks in `useCallback` or extract constant arrays outside the component. |

#### Positive Findings
- `aria-expanded` and `aria-controls` on the toggle button.
- Panel has matching `id`.
- Inputs have `aria-label` and `focus-visible` rings.

---

### 1.5 StarterChips.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| SC-01 | 51 | **Low** | Container `<div>` has no `role="group"` or `aria-label`, so screen reader users may not understand these chips are related starter templates. | Add `role="group"` and `aria-label="Quick start templates"` to the container. |

#### Positive Findings
- Each chip is a real `<button>` with `aria-label`.
- Focus visible rings are present.
- Static `CHIPS` array prevents unnecessary re-renders.

---

## 2. Layout Components

### 2.1 AppShell.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| AS-01 | 20–43 | **Medium** | No "Skip to content" link is provided. Keyboard users must tab through the entire LeftRail before reaching the main content on every page load. | Add a visually-hidden "Skip to main content" link as the first focusable element that targets `<main>`. |
| AS-02 | 36–39 | **Low** | The main content wrapper is a generic `<div>`; the semantic `<main>` is inside `MainPane`. That is acceptable, but the outer wrapper could benefit from `aria-label="Main content"` if it ever becomes focusable. | Minor — current structure is fine, but document the intent. |

#### Positive Findings
- Spacer div is `aria-hidden`.
- Responsive: LeftRail hidden on mobile, `MobileNav` rendered conditionally via CSS.
- `useRailStore` state is persisted to `localStorage`.

---

### 2.2 LeftRail.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| LR-01 | 83–106 | **Medium** | Active navigation links do not declare `aria-current="page"`. Screen readers cannot inform users which page they are on. | Add `aria-current={active ? "page" : undefined}` to each `<Link>` in the rail. |
| LR-02 | 112–145 | **Medium** | Spaces button does not have `aria-expanded`, and the submenu does not have `role="region"` or `aria-label`. Screen readers cannot tell whether the submenu is open or closed. | Add `aria-expanded={spacesOpen}` to the Spaces button and `aria-label="Spaces submenu"` to the `<ul>`. |
| LR-03 | 181–193 | **Low** | Credit indicator uses a purely visual dot (`animate-ping`) with no screen-reader-accessible text describing the status (e.g., "Credits healthy"). | Add a `<span className="sr-only">` describing the credit status. |
| LR-04 | 234–237 | **Low** | User name "Alex Chen" and role "Operator" are hardcoded. | Accept `userName` and `userRole` as props (or from a user context). |
| LR-05 | 188–191 | **Low** | Credit amount "8,420 / 10,000" is hardcoded. | Accept `creditsUsed` and `creditsTotal` as props. |

#### Positive Findings
- `aside` has `aria-label="Main navigation"`.
- `nav` semantic element is used.
- `title` tooltips on collapsed icons.
- Collapse toggle has dynamic `aria-label`.
- Responsive: collapsible with smooth width transition; hidden on mobile.

---

### 2.3 MainPane.tsx

#### Issues
| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| MP-01 | 12–21 | **Low** | No `id="main-content"` to pair with a skip-link. | Add `id="main-content"` so `AppShell` can link to it. |

#### Positive Findings
- Uses semantic `<main>`.
- Handles mobile bottom padding via `hasMobileNav`.

---

### 2.4 MobileNav.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| MN-01 | 24–51 | **Medium** | Active state uses color only (`text-[var(--accent-primary)]`). No additional indicator (underline, icon badge, `aria-current`) is provided for colorblind users. | Add `aria-current={active ? "page" : undefined}` to each `<Link>`, and consider adding an `aria-label` that includes "current page" or a visual underline. |
| MN-02 | 19–22 | **Low** | `isActive` is not memoized. | Minor — wrap in `useCallback` if `pathname` changes frequently. |

#### Positive Findings
- `nav` has `aria-label="Mobile navigation"`.
- Uses semantic `<nav>` and `<ul>` / `<li>` structure.

---

### 2.5 Header.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| HD-01 | 47–60 | **Low** | Breadcrumb links lack `aria-current` on the last (current) item. | Add `aria-current={idx === breadcrumbs.length - 1 ? "page" : undefined}` to the last breadcrumb link. |

#### Positive Findings
- `header` semantic element.
- Back button has `aria-label`.
- Breadcrumbs wrapped in `<nav aria-label="Breadcrumb">`.
- `h1` for page title.

---

### 2.6 CommandPalette.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| CP-01 | 205–312 | **High** | No explicit focus trap. The component relies on `cmdk`'s internal behavior, but there is no programmatic guarantee that focus stays inside the modal while open. | Add a focus trap (e.g., `focus-trap-react` or a custom hook) around the palette content, and return focus to the trigger element on close. |
| CP-02 | 75–81 | **Medium** | `run(action)` uses `setTimeout(action, 150)` to delay navigation. This is a brittle race condition—if the modal close animation takes longer, focus may land on the wrong element. | Use a callback on `AnimatePresence`'s `onExitComplete` (or similar) to run the action after the exit animation finishes. |
| CP-03 | 34–44 | **Medium** | `recentWorkflows` and `recentConnectors` are hardcoded mock data. In a production app, this should come from props/context/API. | Accept `recentWorkflows` and `recentConnectors` as props, or fetch from a store. |
| CP-04 | 226–235 | **Low** | `autoFocus` on `Command.Input` is good, but if the palette is opened via a global shortcut (e.g., `Cmd+K`), focus should be moved to the input. `autoFocus` alone may not work reliably across all browsers if the element mounts asynchronously. | Explicitly call `.focus()` on the input ref in a `useEffect` when `open` transitions to `true`. |

#### Positive Findings
- `role="dialog"`, `aria-modal="true"`, `aria-label="Command palette"`.
- Backdrop click closes.
- `cmdk` provides arrow-key navigation, Enter selection, and Escape close.
- Footer shows keyboard hints.
- `shouldFilter={false}` with manual filtering avoids double-filtering bugs.
- `useMemo` for `items`, `filtered`, `grouped`.

---

### 2.7 KeyboardShortcuts.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| KS-01 | 153–223 | **High** | No focus trap inside the modal. Users can Tab out of the shortcuts dialog into the background page. | Implement a focus trap when `open === true`. |
| KS-02 | 153–223 | **Medium** | Opening the dialog does not move focus into the dialog. Focus remains on the page, forcing screen reader users to manually navigate into the modal. | Move focus to the close button (or the heading) via a ref when the dialog opens. |
| KS-03 | 44–89 | **Medium** | The "?" shortcut is documented as opening this dialog, but the actual global keybinding is not implemented in this file (or any file in scope). The shortcuts are purely documentation. | Wire up a global `keydown` listener (e.g., in a provider or hook) that listens for `?` (outside inputs) and calls `toggle()`. |
| KS-04 | 143–151 | **Low** | Body scroll lock mutates `document.body.style.overflow` directly. If another component also locks scroll, they can overwrite each other. | Use a counter-based or className-based scroll lock utility. |
| KS-05 | 213–215 | **Low** | Footer text about modifier keys is not linked to the dialog via `aria-describedby`. | Add `aria-describedby` on the dialog pointing to the footer text. |

#### Positive Findings
- Escape closes the dialog.
- Overlay click closes.
- Close button has `aria-label`.
- `role="dialog"`, `aria-modal="true"`, `aria-label`.
- `isMac` detection is SSR-safe.

---

### 2.8 ThemeToggle.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| TT-01 | 44–52 | **Low** | Toggle button lacks `aria-pressed`, so screen readers cannot communicate the current on/off state (even though the label changes, `aria-pressed` is the standard pattern for toggle buttons). | Add `aria-pressed={isDark}` to the button. |

#### Positive Findings
- Dynamic `aria-label` and `title` based on resolved theme.
- SSR-safe `mounted` guard prevents hydration mismatch.
- Animated icon swap with `AnimatePresence`.
- Focus ring present.

---

### 2.9 UserMenu.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| UM-01 | 171–263 | **High** | No focus trap inside the dropdown. Tabbing past the last menuitem moves focus into the page background. | Trap focus within the dropdown when open; return focus to the trigger button on close. |
| UM-02 | 171–263 | **Medium** | No focus return to trigger on menu close ( Escape, click outside, or item select ). Keyboard users lose their place in the tab sequence. | After `setOpen(false)`, call `triggerRef.current?.focus()`. |
| UM-03 | 135–151 | **Low** | Fallback avatar (initials) has no `aria-label` on its container. Screen readers may read just the raw text (e.g., "AC") without context. | Add `aria-label={name}` to the initials container. |
| UM-04 | 233–259 | **Low** | `menuItems` array is recreated on every render. If this component re-renders frequently, the anonymous functions in `onClick` are new references each time, which can hurt child memoization if `menuItems` were ever passed to a memoized list. | Define `menuItems` inside `useMemo` or hoist the array outside the component and pass dependencies as a closure. |
| UM-05 | 80–91 | **Low** | Click-outside uses `mousedown`. Some screen reader / switch users may trigger the menu with non-mouse input. `focusout` or a combined event strategy is more robust. | Consider also handling `focusout` on the container: `if (!containerRef.current?.contains(e.relatedTarget)) setOpen(false);` |

#### Positive Findings
- Click-outside and Escape both close the menu.
- Trigger has `aria-haspopup="menu"` and `aria-expanded`.
- Menu has `role="menu"`; items have `role="menuitem"`.
- Avatar `alt` text is the user's name.
- Admin-only filtering works correctly.

---

### 2.10 Toaster.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| T-01 | 124–198 | **High** | `ToastItem` is not memoized, and the parent `Toaster` re-renders every 50 ms for every active toast (due to `setInterval` progress updates). This means **all** toast items re-render continuously, not just the one whose progress changed. | Wrap `ToastItem` in `React.memo`. Also, consider replacing per-toast `setInterval` with a single `requestAnimationFrame` loop in the parent, or use CSS `@keyframes` for the progress bar to avoid React re-renders entirely. |
| T-02 | 124–141 | **High** | Each toast spawns its own `setInterval(..., 50)`. With 5 toasts, that's 100 state updates per second across the tree. | Use a single global interval or `setTimeout` per toast for dismissal only, and drive the progress bar via CSS transition/animation rather than React state. |
| T-03 | 143–157 | **Medium** | Both the container `<div>` and each `ToastItem` declare `aria-live="polite"`. The container's live region is sufficient; the per-item duplication can cause double-announcements or interrupt previous announcements. | Remove `aria-live="polite"` from `ToastItem` (keep it on the container). Add `aria-atomic="true"` on the container so each toast is announced fully. |
| T-04 | 169–173 | **Medium** | Toast type (success, error, warning, info) is communicated only by color/icon. Screen readers do not announce whether a toast is an error or success. | Add `aria-label` or visually-hidden prefix to the title: e.g., `<span className="sr-only">[Success]</span> {toast.title}`. |
| T-05 | 160–165 | **Low** | Progress bar styling uses fragile string manipulation: `config.text.replace("text-", "")` and inline `backgroundColor: "var(--" + toast.type + ")"`. If Tailwind classes change or CSS variable names diverge, this silently breaks. | Use an explicit mapping object from `ToastType` to CSS variable names and background class names. |
| T-06 | 124–198 | **Low** | No pause-on-hover or pause-on-focus behavior. A toast may dismiss while the user is reading it or interacting with its action button. | Pause the dismissal timer when the toast (or the toaster container) receives mouseenter / focus, and resume on leave. |

#### Positive Findings
- External store pattern (`toastMemoryState`) allows imperative API from anywhere.
- Container has `aria-live="polite"` and `aria-label="Notifications"`.
- Dismiss button has `aria-label`.
- `AnimatePresence` for smooth enter/exit.
- `motion.div` `layout` prop for auto-reordering animation.

---

### 2.11 ErrorBoundary.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| EB-01 | 38–44 | **Medium** | Production error logging only calls `console.error`. The comment says "send to error tracking service" but the code does nothing. Errors are silently lost in production. | Integrate Sentry, Datadog, or another error tracking service in the `componentDidCatch` block. |
| EB-02 | 47–53 | **Low** | `handleReset` always calls `window.location.reload()`. In a single-page app, a full reload is heavy; consider also offering a "Try again" button that resets local component state without reloading. | Provide a secondary "Try again" button that only calls `this.setState({ hasError: false, ... })` so the app can recover without losing session state. |

#### Positive Findings
- `getDerivedStateFromError` and `componentDidCatch` correctly implemented.
- Fallback UI has `role="alert"` and `aria-live="assertive"`.
- Clean, informative error display with truncated stack trace.
- "Refresh Page", "Go Home", and "Report Issue" actions are all provided.
- Issue URL pre-fills title and body with error details.

---

### 2.12 AnnouncementBanner.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| AB-01 | 90–145 | **Low** | Banner appearance is not announced to screen readers (no `aria-live` region). If the banner renders after initial page load, users may not know it appeared. | Add `aria-live="polite"` on the banner container so it is announced when it enters the DOM. |
| AB-02 | 90–145 | **Low** | When the banner appears dynamically, focus is not moved to it. If the banner contains important information, users may tab past it without knowing. | If the banner is critical, add `tabIndex={-1}` and move focus to it on mount. Otherwise, rely on `aria-live`. |

#### Positive Findings
- `role="banner"`.
- Dismiss button has `aria-label`.
- `localStorage` persistence with try/catch.
- External links have `rel="noopener noreferrer"`.
- `AnimatePresence` for smooth dismiss animation.

---

### 2.13 Footer.tsx

#### Issues

| # | Line | Severity | Issue | Fix Recommendation |
|---|------|----------|-------|-------------------|
| FT-01 | 76–86 | **Low** | No `aria-current` on the active page link (if any). | Add `aria-current` if the footer ever highlights the current docs/status page. |

#### Positive Findings
- Semantic `<footer>` and `<nav>`.
- `aria-label="Footer navigation"`.
- External links get `target="_blank"` + `rel="noopener noreferrer"`.
- GitHub link has explicit `aria-label`.

---

## 3. Cross-Cutting Concerns

### 3.1 Hooks & Memoization

- **Missing `useCallback` on handlers** is the most widespread performance issue. Affected files: `Composer.tsx` (6 handlers), `AdvancedOptions.tsx` (multiple inline `onChange` lambdas), `UserMenu.tsx` (`menuItems` array).
- **Duplicated slash filtering** in `Composer.tsx` and `SlashMenu.tsx` violates DRY.
- **Toast progress intervals** cause excessive re-renders.

### 3.2 Accessibility Patterns

- **Focus traps** are absent in: `SlashMenu`, `CommandPalette`, `KeyboardShortcuts`, `UserMenu`.
- **Focus return** after modal/dropdown close is absent everywhere.
- **`aria-current="page"`** is missing on: `LeftRail` nav links, `MobileNav` tabs, `Header` breadcrumbs.
- **`aria-expanded`** is missing on: `LeftRail` Spaces button.
- **Live regions** are missing for: `Composer` error message, `AnnouncementBanner`, `Toaster` (needs `aria-atomic`).

### 3.3 Prop Typing

- Overall excellent TypeScript coverage.
- Minor leakage of `React.Dispatch<React.SetStateAction<T>>` in `AdvancedOptionsProps`.
- Hardcoded data in `LeftRail` (user name, credits), `CommandPalette` (recent workflows/connectors).

---

## 4. Prioritized Fix Backlog

### Critical (Fix Immediately)
1. **T-01 / T-02** — Toast re-render storm: memoize `ToastItem` and replace per-toast intervals with CSS animations or a single loop.
2. **SM-01** — SlashMenu does not reposition on scroll/resize.
3. **CP-01 / KS-01 / UM-01** — Add focus traps to all modals, palettes, and dropdowns.

### High (Fix This Sprint)
4. **C-07 / SM-03** — Add focus trap and click-outside to slash menu.
5. **UM-02** — Return focus to trigger after closing `UserMenu`.
6. **C-04 / C-05** — Announce composer errors to screen readers.
7. **SM-02** — Remove duplicate Escape listener in `SlashMenu`.
8. **T-03 / T-04** — Remove redundant `aria-live` on toasts; add toast type announcement.

### Medium (Fix Next Sprint)
9. **C-01** — Memoize handler functions in `Composer.tsx`.
10. **AS-01** — Add skip-to-content link in `AppShell`.
11. **LR-01 / MN-01 / HD-01** — Add `aria-current="page"` to navigation.
12. **LR-02** — Add `aria-expanded` to Spaces button.
13. **CP-02** — Replace `setTimeout` navigation with animation-end callback.
14. **EB-01** — Integrate production error tracking service.

### Low (Polish)
15. **TT-01** — Add `aria-pressed` to `ThemeToggle`.
16. **SC-01** — Add `role="group"` to `StarterChips`.
17. **AO-01** — Clean up `AdvancedOptionsProps` `onChange` type.
18. **T-05** — Replace fragile string manipulation in toast progress styling.
19. **KS-03** — Wire up global `?` shortcut listener.
20. **AO-02 / CP-04** — Improve focus management on open for advanced panel and command palette.

---

*End of Report*
