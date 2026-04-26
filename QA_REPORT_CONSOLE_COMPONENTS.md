# Console Components QA Audit Report

**Audit Date:** 2025-06-26  
**Scope:** `/mnt/agents/output/multi-model-agent-platform/src/components/console/`  
**Files Audited:** 11 files (ConsoleNav.tsx, ConsoleTable.tsx, WorkflowInspector.tsx, PlanDiffViewer.tsx, CostQualityLeaderboard.tsx, RoutingPolicyEditor.tsx, SandboxPool.tsx, ProviderHealth.tsx, AuditExplorer.tsx, TenantAdmin.tsx, ConsolePanel.tsx)

---

## Executive Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security & Access Control | 2 | 4 | 2 | 0 |
| Performance & Memoization | 0 | 3 | 4 | 2 |
| Accessibility (a11y) | 0 | 1 | 5 | 3 |
| Data Integrity & PII | 0 | 3 | 2 | 1 |
| **Total** | **2** | **11** | **13** | **6** |

**Top Concerns:**
1. **No RBAC checks** anywhere in the console — any authenticated user can toggle circuit breakers, drain sandbox hosts, impersonate tenants, export audit logs, and edit routing policies.
2. **PII is exported unredacted** in AuditExplorer CSV export (emails, IPs, user agents).
3. **No confirmation dialogs** for destructive admin actions (impersonation, credit edits, circuit breaker toggles, host draining, policy saves).
4. **Search/filter is not debounced** in WorkflowInspector and AuditExplorer, causing unnecessary re-renders on every keystroke.
5. **Audit log tamper-evidence is fake** — hashes are randomly generated, not cryptographically chained.

---

## Detailed Findings

---

### ConsoleNav.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| NAV-01 | 113-201 | **Medium** | Collapsible section buttons lack `aria-expanded` state. Screen readers cannot tell if a section is open or closed. | Add `aria-expanded={!isCollapsed}` to section toggle `<button>` elements. |
| NAV-02 | 163-185 | **Medium** | Active nav item uses a visual dot indicator but lacks `aria-current="page"`. | Add `aria-current={isActive ? "page" : undefined}` to active nav button. |
| NAV-03 | 134-191 | **Low** | No keyboard shortcut support for navigating between console pages. | Consider adding `Accesskey` or a keyboard shortcut handler for power users. |
| NAV-04 | 28-109 | **Low** | `navItems` array is recreated on every module load but never changes. Could be moved outside component (already is), but SVG icons are inline and not memoized, causing React to treat them as new references on parent re-renders. | Extract icons to separate `React.memo` components or use an icon library. |

---

### ConsoleTable.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| TBL-01 | 315-327 | **High** | Table virtualization (`VirtualTable`) only handles vertical scroll. It does **not** virtualize columns or support horizontal virtualization. Wide tables with many columns will still suffer performance issues. | Consider adding horizontal virtualization or a `horizontalScroll` prop with column pinning for very wide tables. |
| TBL-02 | 175-219 | **Medium** | `Row` callback is recreated whenever `sortedData`, `visibleColumns`, `onRowClick`, `selectedRowId`, `rowIdKey`, `padding`, or `textClass` changes. `sortedData` is a new array on every sort, so `Row` is re-created frequently, defeating memoization of `renderRow` prop inside `VirtualTable`. | Memoize `sortedData` (already done), but also wrap `Row` in `useMemo(() => React.memo(RowComponent), deps)` or refactor to a stable `React.memo` component outside `ConsoleTable`. |
| TBL-03 | 282-310 | **Medium** | Sortable column headers are `<div>` elements with `onClick` but lack `role="button"`, `tabIndex={0}`, and keyboard handlers (`Enter`/`Space`). | Replace with `<button>` or add `role="button"`, `tabIndex={0}`, and `onKeyDown` for `Enter`/`Space` activation. |
| TBL-04 | 306-309 | **Medium** | Column resize handle has no `aria-label` and is not keyboard accessible. | Add `aria-label="Resize column"` and support keyboard resizing (e.g., arrow keys with modifier). |
| TBL-05 | 252-269 | **Low** | Column visibility dropdown uses CSS `group-hover` to show/hide. Not keyboard accessible (cannot tab to checkboxes). | Add `tabIndex` management or use a popover component with focus trapping and `Escape` to close. |
| TBL-06 | 417-457 | **Low** | `MiniSparkline` recalculates `min`, `max`, `points` on every render. Should memoize. | Wrap calculations in `useMemo`. |
| TBL-07 | 58-69 | **Low** | Generic type `T extends Record<string, any>` is overly permissive and loses type safety for `rowIdKey`. | Use `T extends Record<string, unknown>` or stricter typing. |

---

### WorkflowInspector.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| WF-01 | 276-281 | **High** | Search input is **not debounced**. Every keystroke triggers `setSearch`, which triggers `filtered` re-computation and full table re-render. | Wrap `setSearch` with `useDebounce` (e.g., 200-300ms). |
| WF-02 | 146-152 | **Medium** | `filtered` is computed inline on every render (not memoized with `useMemo`). For 24 demo items it's fine, but for large datasets this is expensive. | Wrap `filtered` in `useMemo(() => demoTasks.filter(...), [search, statusFilter, kindFilter, modelFilter])`. |
| WF-03 | 449-453 | **High** | PII redaction regex is naive and incomplete. Only matches `SSN` (`\d{3}-?\d{2}-?\d{4}`) and 10+ digit numbers (`\d{10,}`). Misses credit cards, phone numbers, names, addresses. Also, redaction only applies if `containsPII` flag is set — no dynamic detection. | Implement a comprehensive PII detection engine or use a library like `presidio`. Add regex for credit cards, phone numbers, emails. |
| WF-04 | 159-168 | **High** | PII unredaction is logged to `console.log` only — no persistent audit trail, no server-side logging, no user identity captured. | Send an authenticated audit event to a backend logging endpoint before revealing PII. |
| WF-05 | 136-349 | **Critical** | No role-based access control (RBAC). Any user can view workflow tasks, toggle PII visibility, and inspect prompts/completions. | Wrap the component with an RBAC check. Require `workflow:read` and `pii:read` permissions. |
| WF-06 | 339-346 | **Medium** | Side drawer (`TaskDrawer`) has no focus trap and no `Escape` key handler to close. Keyboard users can tab out of the drawer into the background. | Implement focus trapping with `react-focus-lock` or a custom focus trap, and add `Escape` key listener to close. |
| WF-07 | 463-465 | **Low** | Close button uses "✕" character with no `aria-label`. | Add `aria-label="Close drawer"`. |
| WF-08 | 354-432 | **Medium** | `DAGPlaceholder` SVG has fixed dimensions and is not responsive. On smaller viewports it will overflow or require horizontal scrolling. | Use `viewBox` and percentage-based sizing, or make SVG responsive with CSS. |
| WF-09 | 125-128 | **Medium** | Demo PII data uses fake SSN/account numbers but could trigger real security scanners. Add a `/* DEMO DATA — NOT REAL PII */` comment. | Add explicit comment marking demo data as synthetic. |

---

### PlanDiffViewer.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| PDV-01 | 92-99 | **High** | `computeDiff(left, right)` is called on every render without `useMemo`. Plan diffs can be expensive for large graphs. | Wrap `computeDiff` result in `useMemo(() => computeDiff(left, right), [left, right])`. |
| PDV-02 | 208-289 | **Medium** | `PlanCanvas` SVG has hardcoded `width={360} height={520}`. Not responsive to container size. | Use `viewBox`, percentage width/height, or a resize observer to make the canvas responsive. |
| PDV-03 | 111-136 | **Medium** | `<select>` dropdowns for revision selection have no `aria-label`. | Add `aria-label="Select before revision"` and `aria-label="Select after revision"`. |
| PDV-04 | 253-305 | **Medium** | `DiffView` recalculates line-by-line diff on every render. Should be memoized. | Wrap `lines` in `useMemo(() => computeLines(oldYaml, newYaml), [oldYaml, newYaml])`. |
| PDV-05 | 78-90 | **Low** | `computeDiff` only compares `id`, `label`, and `kind`. Does not detect edge changes, node position changes, or metadata changes. | Extend diff logic to include edges, coordinates, and metadata fields. |

---

### CostQualityLeaderboard.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| CQL-01 | 253-259 | **High** | `scatterData` is recalculated on every render. Creates a new array reference, which could cause downstream chart re-renders. | Wrap in `useMemo(() => scored.map(...), [scored])`. |
| CQL-02 | 261-264 | **Medium** | `maxCostVal`, `minCostVal`, `maxQVal`, `minQVal` are recalculated on every render. | Derive from `scatterData` inside the same `useMemo` block. |
| CQL-03 | 119-148 | **Low** | `scored` is properly memoized with `useMemo` — good practice. | N/A (positive finding). |
| CQL-04 | 337-387 | **Low** | SVG scatter chart uses `viewBox` and `className="w-full"` — responsive by default. Positive finding. | N/A (positive finding). |

---

### RoutingPolicyEditor.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| RPE-01 | 96-99 | **Critical** | `handleSave` is a no-op — it only simulates a 1.2s loading state with `setTimeout`. No actual API call, no confirmation dialog, and no validation that the user has permission to save policy. | Implement a real save mutation with backend API. Add a confirmation modal: "Save routing policy? This will affect live traffic." |
| RPE-02 | 117-119 | **High** | "Rollback" button has **no `onClick` handler** at all. It renders but does nothing. | Either implement rollback logic or disable/hide the button. |
| RPE-03 | 60-249 | **Critical** | No RBAC check. Any user can edit routing policy, change canary percentage, and view dry-run results. | Require `routing-policy:write` permission. Disable editing for read-only users. |
| RPE-04 | 70-89 | **Medium** | `validate` callback is memoized with `useCallback`, but `handleYamlChange` (line 91-94) is not, causing `validate` to be called synchronously on every keystroke. For large YAML this blocks the main thread. | Debounce validation (e.g., 300ms) or run it in a Web Worker. |
| RPE-05 | 253-305 | **Medium** | `DiffView` recalculates diff on every render. Should be memoized. | Wrap `lines` in `useMemo`. |
| RPE-06 | 40-57 | **Medium** | `dryRunResults` and `dryRunSummary` are hardcoded demo data. The summary does not actually derive from `dryRunResults`. | If this is production code, remove demo data or clearly mark with `/* DEMO */`. |
| RPE-07 | 132-142 | **Low** | Canary slider (`<input type="range">`) lacks `aria-label` and does not announce value changes to screen readers. | Add `aria-label="Canary percentage"` and `aria-valuenow` (or use a proper slider component). |

---

### SandboxPool.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| SP-01 | 120-124 | **High** | `toggleDrain` toggles the draining state with **zero confirmation**. Draining a host evicts all active VMs. This is a destructive infrastructure operation. | Add a confirmation dialog: "Drain sandbox-pool-04.eu-west.internal? This will evict 0 active VMs." |
| SP-02 | 116-323 | **Critical** | No RBAC check. Any user can drain/undrain sandbox hosts. | Require `infrastructure:write` or `sandbox:admin` permission. Show read-only view for unauthorized users. |
| SP-03 | 254-269 | **Medium** | Drain toggle button inside a table row uses `onClick` but the entire row is not a button. The button is small and may be hard to target. | Consider making the action more prominent or requiring an explicit "Actions" dropdown with confirmation. |
| SP-04 | 116-323 | **Medium** | `hosts` state is local only. Changes to draining state are not persisted to a backend. | Wire up to a real API or add a `/* DEMO — NOT PERSISTED */` comment. |

---

### ProviderHealth.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| PH-01 | 126-135 | **High** | `toggleBreaker` cycles circuit breaker state with **zero confirmation**. Manually opening a circuit breaker stops all traffic to a provider. | Add a confirmation modal explaining the impact: "Open circuit breaker for Azure OpenAI? All requests will fail over immediately." |
| PH-02 | 123-328 | **Critical** | No RBAC check. Any user can toggle circuit breakers, which is a production-critical action. | Require `provider:admin` or `infrastructure:write` permission. |
| PH-03 | 137-287 | **Medium** | `columns` array is recreated on every render. This causes `ConsoleTable` to see new column references and re-render headers unnecessarily. | Wrap `columns` in `useMemo(() => [...], [])` or define outside the component. |
| PH-04 | 123-328 | **Medium** | Provider metrics are local demo data. `setProviders` updates local state only — changes do not persist or propagate to the actual routing layer. | Wire to a real backend or mark as demo. |
| PH-05 | 142-150 | **Low** | Critical alert indicator uses `animate-ping` which can be distracting for users with vestibular disorders. | Respect `prefers-reduced-motion` media query. |

---

### AuditExplorer.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| AE-01 | 247-252 | **High** | Search input is **not debounced**. Six filter inputs (search, event type, org, user, workflow, date range) all trigger immediate re-renders. | Apply `useDebounce` to `search` (200ms). Date range changes are discrete and OK without debounce. |
| AE-02 | 133-146 | **High** | `exportCSV` exports **raw PII data** including `userEmail`, `ip`, and `userAgent` with **no redaction and no access logging**. | Redact PII in exports (e.g., hash emails, mask IPs). Log the export action to the audit trail with the requesting user's identity. |
| AE-03 | 28-92 | **High** | `generateHashChain` creates **fake cryptographic hashes**. `hash` is a random hex string, not a real SHA-256 of event data. `prevHash` is not cryptographically linked. `verified` is randomly set to `false` for 5% of events. | Replace with real hash chain computation: `hash = H(prevHash + serializedEvent)`. Provide a verification function. |
| AE-04 | 96-455 | **Critical** | No RBAC check. Any user can view all audit events across all organizations, impersonate users, and export audit logs. | Require `audit:read` permission. Scope queries to the user's organization (unless they have `audit:cross-org`). |
| AE-05 | 382-453 | **Medium** | Detail drawer has no focus trap and no `Escape` key handler. | Implement focus trapping and `Escape` to close. |
| AE-06 | 390-391 | **Low** | Close button uses "✕" with no `aria-label`. | Add `aria-label="Close event details"`. |
| AE-07 | 111-131 | **Low** | `filtered` is properly memoized with `useMemo` — positive finding. | N/A (positive finding). |
| AE-08 | 107-109 | **Low** | `eventTypes`, `orgs`, `users` are memoized — positive finding. | N/A (positive finding). |

---

### TenantAdmin.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| TA-01 | 117-120 | **High** | `handleImpersonate` initiates impersonation with **zero confirmation**. This is a high-risk admin action that lets an admin act as another organization. | Add a confirmation modal: "Impersonate Stark Industries? This will be logged." Require MFA or re-authentication. |
| TA-02 | 106-115 | **High** | `handleCreditSave` changes credit balance with **zero confirmation** and no validation beyond `!isNaN`. Negative credits, extreme values, and non-finite numbers are accepted. | Add confirmation dialog. Validate with `Number.isFinite(val) && val >= 0 && val <= MAX_CREDIT`. |
| TA-03 | 91-104 | **High** | `toggleProvider` removes provider access with **zero confirmation**. Removing the last provider could break all workflows for an org. | Add confirmation: "Remove 'anthropic' from Stark Industries? This may break active workflows." |
| TA-04 | 85-325 | **Critical** | No RBAC check. Any user can edit tenant credits, toggle providers, and impersonate organizations. | Require `tenant:admin` permission. Disable actions for read-only users. |
| TA-05 | 122-271 | **Medium** | `columns` array is recreated on every render, causing unnecessary re-renders in `ConsoleTable`. | Move `columns` outside the component or wrap in `useMemo`. |
| TA-06 | 301-322 | **Medium** | Impersonation log is stored in local React state only (`useState`). It is lost on page refresh and is not shared with other admin sessions. | Persist impersonation log to a backend audit trail. |
| TA-07 | 176-196 | **Low** | Credit edit input handles `Enter` and `Escape` keys — positive accessibility finding. | N/A (positive finding). |
| TA-08 | 256-268 | **Medium** | Impersonate button is disabled when `impersonationEnabled` is false, but there is no visual tooltip or explanation for why it's disabled. | Add a `title` attribute or tooltip explaining "Impersonation is disabled for this organization." |

---

### ConsolePanel.tsx

| # | Line | Severity | Issue | Recommendation |
|---|------|----------|-------|----------------|
| CP-01 | 8-23 | **Low** | Component is a placeholder with hardcoded log lines. No live log streaming, no WebSocket connection, no auto-scroll. | If this is intentional for the current milestone, add a `// TODO: wire to log stream` comment. |
| CP-02 | 8-23 | **Low** | `Terminal` icon from `lucide-react` is imported but the component has no props interface. | If this component will accept props in the future, define `interface ConsolePanelProps` now. |

---

## Cross-Cutting Issues

### 1. Missing Role-Based Access Control (RBAC) — CRITICAL
**Affected:** All 11 console components  
**Severity: CRITICAL**  
No component checks user permissions before rendering admin features or allowing destructive actions. Every authenticated user can:
- Toggle circuit breakers (`ProviderHealth`)
- Drain sandbox hosts (`SandboxPool`)
- Impersonate tenants (`TenantAdmin`)
- Export audit logs with PII (`AuditExplorer`)
- Edit routing policies (`RoutingPolicyEditor`)
- Toggle PII redaction (`WorkflowInspector`)

**Fix:** Implement a `<RequirePermission permission="...">` wrapper or HOC. Gate each action behind a permission check. Render read-only views for unauthorized users.

### 2. Missing Confirmation Dialogs for Destructive Actions — HIGH
**Affected:** `SandboxPool`, `ProviderHealth`, `TenantAdmin`, `RoutingPolicyEditor`  
**Severity: HIGH**  
The following actions execute immediately with no confirmation:
- Drain/undrain host
- Open/close/half-open circuit breaker
- Impersonate organization
- Save routing policy
- Remove provider access
- Change credit balance

**Fix:** Add a reusable `<ConfirmActionModal>` component. Require explicit confirmation for all destructive or high-risk actions.

### 3. Search/Filter Not Debounced — HIGH
**Affected:** `WorkflowInspector` (line 276), `AuditExplorer` (line 247)  
**Severity: HIGH**  
Every keystroke in the search input immediately triggers state updates, re-filtering, and table re-renders. For large datasets this causes jank and unnecessary CPU usage.

**Fix:** Use a `useDebounce` hook (e.g., from `use-debounce` library or custom implementation):
```tsx
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 200);
const filtered = useMemo(() => data.filter(...debouncedSearch...), [debouncedSearch, ...]);
```

### 4. PII Redaction & Export — HIGH
**Affected:** `WorkflowInspector`, `AuditExplorer`  
**Severity: HIGH**  
- WorkflowInspector uses naive regex that misses many PII patterns (credit cards, phone numbers, names, addresses).
- AuditExplorer exports `userEmail`, `ip`, and `userAgent` in CSV without redaction.
- There is no audit trail for who exported what data.

**Fix:**
- Use a dedicated PII redaction library or service.
- Redact/hash PII fields in CSV exports.
- Log every export action with user ID, timestamp, and filter criteria.

### 5. Fake Audit Log Tamper-Evidence — HIGH
**Affected:** `AuditExplorer`  
**Severity: HIGH**  
The `generateHashChain` function generates random hex strings for `hash` and `prevHash`. There is no real cryptographic linkage. The `verified` flag is randomly set. This gives a false sense of security.

**Fix:** Compute hashes on the server using `H(prevHash + canonicalEventJSON)`. Verify client-side by re-computing or checking a server-signed signature.

### 6. Missing Accessibility (a11y) — MEDIUM
**Affected:** `ConsoleTable`, `WorkflowInspector`, `AuditExplorer`, `PlanDiffViewer`  
**Severity: MEDIUM**  
- Sortable headers are `<div>` elements, not focusable buttons.
- Column resize handles have no labels and no keyboard support.
- Side drawers have no focus traps or `Escape` handlers.
- Several icon-only buttons lack `aria-label`.
- No `aria-live` regions for dynamic updates (e.g., filter counts, validation errors).

**Fix:**
- Use semantic HTML (`<button>`) for interactive elements.
- Add `aria-label` to all icon-only buttons.
- Implement focus trapping in drawers/modals.
- Add `aria-live="polite"` regions for status updates.

### 7. Performance: Unnecessary Re-renders — MEDIUM
**Affected:** `ConsoleTable`, `ProviderHealth`, `TenantAdmin`, `CostQualityLeaderboard`, `PlanDiffViewer`, `RoutingPolicyEditor`  
**Severity: MEDIUM**  
Several components recreate objects/arrays on every render:
- `columns` arrays inside `ProviderHealth`, `TenantAdmin`
- `scatterData` in `CostQualityLeaderboard`
- `computeDiff` in `PlanDiffViewer`
- `DiffView` line computation in `RoutingPolicyEditor`

**Fix:** Move static `columns` definitions outside components. Wrap dynamic computations in `useMemo`.

---

## Recommendations Summary

| Priority | Action |
|----------|--------|
| **P0 — Critical** | Implement RBAC permission checks across all console components. |
| **P0 — Critical** | Add confirmation dialogs for all destructive admin actions. |
| **P0 — Critical** | Fix AuditExplorer CSV export to redact PII and log the export event. |
| **P1 — High** | Debounce search inputs in WorkflowInspector and AuditExplorer. |
| **P1 — High** | Replace fake audit hashes with real cryptographic hash chain. |
| **P1 — High** | Improve PII redaction patterns (credit cards, phone numbers, emails, addresses). |
| **P2 — Medium** | Memoize `columns`, `scatterData`, `computeDiff`, and `DiffView` computations. |
| **P2 — Medium** | Add focus traps and `Escape` handlers to all drawers. |
| **P2 — Medium** | Make sortable headers keyboard accessible (`<button>` or `role="button"`). |
| **P3 — Low** | Add `aria-label`, `aria-expanded`, and `aria-current` to navigation and interactive elements. |
| **P3 — Low** | Respect `prefers-reduced-motion` for animated alert indicators. |

---

*End of Report*
