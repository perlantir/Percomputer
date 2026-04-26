# Hooks & State Management Performance Audit Report

> **Audited:** 13 source files (+ 2 context providers for cross-file analysis)
> **Audit checklist:** Rules of hooks, useEffect deps, useCallback, useMemo, batching, Zustand selectors, SSR guards, event cleanup, SSE cleanup, state-in-render

---

## Critical Issues

### 1. `useWorkflowEvents.ts` — Ref mutation during render
- **Line:** 56–59
- **Severity:** 🔴 **Critical**
- **Description:** `enabledRef.current = enabled` and `workflowIdRef.current = workflowId` are mutated directly during the render phase. In React's concurrent mode / StrictMode, render may be interrupted or replayed, causing these mutations to happen at unexpected times and produce stale or inconsistent values in event handlers.
- **Fix:** Sync refs inside `useEffect` or `useLayoutEffect`:
  ```ts
  useEffect(() => {
    enabledRef.current = enabled;
    workflowIdRef.current = workflowId;
  }, [enabled, workflowId]);
  ```

### 2. `useWorkflowRun.ts` — No unmount cleanup for EventSource
- **Line:** 147–258 (entire `run` function body)
- **Severity:** 🔴 **Critical**
- **Description:** The EventSource is created inside an async callback (`run`) and attached to `abortRef.current.__es`. If the component unmounts while a workflow is streaming, the SSE connection remains open and `onmessage` / `onerror` callbacks continue calling `setState` on an unmounted component. This causes memory leaks and React warnings. The hook contains **zero** `useEffect` calls.
- **Fix:** Move SSE lifecycle into a `useEffect` that watches `workflowId`, or return a cleanup function from the hook that the consumer must invoke on unmount. Best practice:
  ```ts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      const es = (abortRef.current as any)?.__es?.current;
      if (es && es.readyState !== EventSource.CLOSED) es.close();
    };
  }, []);
  ```

### 3. `useWorkflowRun.ts` — Multiple sequential `setState` calls inside SSE handler
- **Line:** 162–206
- **Severity:** 🟡 **High**
- **Description:** Each SSE message triggers up to 4–5 independent `setState` calls (`setEvents`, `setStatus`, `setWorkflow`, `setPendingClarifications`, `setBudget`, `setSynthesisTokenCount`). React 18 batches updates inside event handlers, but the sheer volume per message (which could be thousands for a token stream) creates unnecessary re-render work.
- **Fix:** Consolidate event processing into a single state object or use a reducer (`useReducer`) to batch all derived state updates atomically. Alternatively, lift event parsing into a Web Worker for very large streams.

### 4. `useWorkflowRun.ts` — Dangerous type assertion & monkey-patching
- **Line:** 150–151
- **Severity:** 🟡 **High**
- **Description:** `const esRef = { current: eventSource }; (abortRef.current as any).__es = esRef;` attaches an unrelated property to an `AbortController`. This breaks type safety and could cause runtime issues if the AbortController shape changes.
- **Fix:** Use a dedicated ref object:
  ```ts
  const esRef = useRef<EventSource | null>(null);
  // inside run()
  esRef.current = eventSource;
  // inside cancel()
  esRef.current?.close();
  ```

---

## High Issues

### 5. `useComposer.ts` — `submit` recreated on every keystroke
- **Line:** 173–181 (dependency array)
- **Severity:** 🟡 **High**
- **Description:** `submit` includes `canSubmit` in its `useCallback` deps. `canSubmit` (line 91) is derived from `text` and `isSubmitting` and changes on every keystroke. Therefore `submit` is recreated on every keystroke, breaking downstream memoization (e.g., if passed to a memoized child button).
- **Fix:** Remove `canSubmit` from the dependency array and inline the guard inside `submit`:
  ```ts
  const submit = useCallback(async () => {
    if (text.trim().length === 0 || isSubmitting) return;
    // ... rest
  }, [text, isSubmitting, /* ... */]);
  ```

### 6. `useComposer.ts` — Blob URL leak on unmount
- **Line:** 94–101 (`addAttachment`), 160–165 (`submit`)
- **Severity:** 🟡 **High**
- **Description:** `URL.createObjectURL(file)` generates blob URLs. They are revoked when an attachment is removed or on successful submit, but if the component unmounts while attachments are still present, those blob URLs leak memory.
- **Fix:** Add a `useEffect` cleanup:
  ```ts
  useEffect(() => {
    return () => {
      attachments.forEach(a => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    };
  }, [attachments]);
  ```

### 7. `useWorkflowSimulation.ts` — Timer leak in `reset` auto-restart
- **Line:** 225
- **Severity:** 🟡 **High**
- **Description:** `reset()` calls `setTimeout(run, 300)` but the returned timer handle is not stored or cleared anywhere. If the component unmounts during that 300 ms window, `run()` fires after unmount and calls `setState` on an unmounted component.
- **Fix:** Store the timer in a ref and clear it on unmount / in `clearTimers`:
  ```ts
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = useCallback(() => {
    clearTimers();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setEvents([]);
    setIsRunning(false);
    resetTimerRef.current = setTimeout(run, 300);
  }, [clearTimers, run]);
  // cleanup
  useEffect(() => {
    return () => {
      clearTimers();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);
  ```

### 8. `useWebSocketControl.ts` — Ref mutation during render
- **Line:** 50–52
- **Severity:** 🟡 **High**
- **Description:** Same pattern as #1: `workflowIdRef.current = workflowId` and `enabledRef.current = enabled` mutated during render.
- **Fix:** Sync via `useEffect`:
  ```ts
  useEffect(() => {
    workflowIdRef.current = workflowId;
    enabledRef.current = enabled;
  }, [workflowId, enabled]);
  ```

### 9. `useWorkflowStream.ts` — Array filter + sort in effect on every `events` change
- **Line:** 48–59
- **Severity:** 🟡 **High**
- **Description:** On every `events` array change, the effect filters the entire event array, then sorts it (`incoming.sort(...)`), then maps and joins. For large event streams (500+ events) this is O(n log n) work on every token.
- **Fix:** Keep a ref-based index of processed events and only process *new* events incrementally. Or use a `Set` of seen token IDs to avoid re-filtering the full history.

---

## Medium Issues

### 10. `useKeyboardShortcuts.ts` — Ref mutation during render
- **Line:** 26–27
- **Severity:** 🟠 **Medium**
- **Description:** `optionsRef.current = options` mutated during render. Same concurrency risk as #1.
- **Fix:**
  ```ts
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  ```

### 11. `useKeyboardShortcuts.ts` — Unused `listRef` option
- **Line:** 18, 71–73
- **Severity:** 🟠 **Medium**
- **Description:** The `listRef` property is declared in the interface but never referenced inside the hook. The j/k navigation logic relies solely on `listNavigationActive` flag.
- **Fix:** Either remove `listRef` from the interface, or implement scroll-into-view behavior when navigating.

### 12. `useWorkflowEvents.ts` — Potential duplicate state in ring buffer
- **Line:** 128–136
- **Severity:** 🟠 **Medium**
- **Description:** `eventBufferRef.current = buf` reassigns the same array reference after `buf.push(...)` and `buf.splice(...)`. The ref already points to `buf`, so this assignment is redundant. More importantly, `setEvents([...buf])` always creates a new array even when no new events were added (e.g., heartbeat lines).
- **Fix:** Only call `setEvents` when `parsed` is truthy and a new event was actually appended. Guard with a boolean:
  ```ts
  let mutated = false;
  // ... after push/splice
  if (mutated) setEvents([...buf]);
  ```

### 13. `useWorkflowStream.ts` — `hasStarted` computed but not memoized
- **Line:** 38
- **Severity:** 🟠 **Medium**
- **Description:** `const hasStarted = tokenCount > 0;` is a cheap derived value, but if this hook is used in a large component tree, returning a new reference-free value on every render could trigger downstream effects if consumers depend on it. (In practice this is low impact.)
- **Fix:** Memoize with `useMemo` for consistency and documentation:
  ```ts
  const hasStarted = useMemo(() => tokenCount > 0, [tokenCount]);
  ```

### 14. `useWorkflowSimulation.ts` — ESLint-disable for exhaustive deps
- **Line:** 232
- **Severity:** 🟠 **Medium**
- **Description:** `// eslint-disable-line react-hooks/exhaustive-deps` suppresses the missing `run` dependency. The intent is "auto-start once on mount", which is valid, but the suppression hides the real dependency and makes refactors risky.
- **Fix:** If truly mount-only, extract `run` into a stable ref, or document the suppression with a detailed comment:
  ```ts
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    runRef.current();
    return clearTimers;
  }, []); // intentional: only on mount
  ```

### 15. `useInterval.ts` — `useDebounce` bundled in same file
- **Line:** 17–30
- **Severity:** 🟠 **Medium**
- **Description:** The `useDebounce` function lives inside `useInterval.ts`, but the project references `useDebounce.ts` which does not exist. This causes confusion and potential broken imports.
- **Fix:** Either rename the file to `useIntervalAndDebounce.ts` or split `useDebounce` into its own `useDebounce.ts` file.

### 16. `useWebSocketControl.ts` — Polling errors silently swallowed
- **Line:** 68–71
- **Severity:** 🟠 **Medium**
- **Description:** Poll failures are caught and ignored with `// Silently swallow polling errors`. If the backend is down or the network is flaky, the UI stays stale indefinitely with no user feedback.
- **Fix:** Surface polling errors at least to `console.error` or an error state:
  ```ts
  } catch (err) {
    console.error("Polling clarifications failed:", err);
    // optionally: setPollError(err);
  }
  ```

---

## Low / Info Issues

### 17. `lib/store.ts` — Zustand store missing selectors
- **Line:** 19–34
- **Severity:** 🟢 **Low**
- **Description:** `useAppStore()` returns the entire store object. Any component subscribing to the store will re-render when **any** property changes (e.g., `isComposing` change causes sidebar components to re-render).
- **Fix:** Provide selector-based API or use Zustand's shallow comparator:
  ```ts
  // consumers
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  // or for multiple values
  const { sidebarOpen, setSidebarOpen } = useAppStore(
    s => ({ sidebarOpen: s.sidebarOpen, setSidebarOpen: s.setSidebarOpen }),
    shallow
  );
  ```

### 18. `store/citationStore.ts` — Zustand store missing selectors
- **Line:** 13–20
- **Severity:** 🟢 **Low**
- **Description:** Same as #17. `useCitationStore()` returns the whole store, causing unnecessary re-renders when unrelated properties change.
- **Fix:** Encourage consumers to use selectors:
  ```ts
  const activeTab = useCitationStore(s => s.activeTab);
  ```

### 19. `useComposer.ts` — Missing error reset on new submission attempt
- **Line:** 122–181
- **Severity:** 🟢 **Low**
- **Description:** `setError(null)` is only called at the start of `submit`. If a previous submission failed and the user edits the text without submitting again, the error remains visible. This is a UX issue, not a React rules violation.
- **Fix:** Clear error when `text` changes:
  ```ts
  useEffect(() => { if (error) setError(null); }, [text]);
  ```

### 20. `useTheme.ts` — `useEffect` for mount flag is correct but could use `useSyncExternalStore`
- **Line:** 23–25
- **Severity:** 🟢 **Low**
- **Description:** The `mounted` state pattern is standard and correct for avoiding hydration mismatch with `next-themes`. However, `useSyncExternalStore` is the modern React-recommended approach for external store subscriptions including theme.
- **Fix:** No urgent fix needed; current pattern is widely accepted.

### 21. `useCitations.ts` — `sources` dependency not stable
- **Line:** 44
- **Severity:** 🟢 **Low**
- **Description:** `citationMap` uses `sources` as a `useMemo` dependency. If the parent passes a new array reference on every render, `buildCitationMap` will rebuild every time.
- **Fix:** Document that callers should memoize the `sources` prop, or internally shallow-compare in the hook.

### 22. `useWorkflowEvents.ts` — `scheduleReconnect` and `connect` circular dependency
- **Line:** 61–160
- **Severity:** 🟢 **Low**
- **Description:** `connect` depends on `scheduleReconnect`, and `scheduleReconnect` calls `connect`. Because both are `useCallback` with stable deps, the circular reference is resolved at closure creation and does not cause infinite re-renders. However, it makes the hook harder to reason about.
- **Fix:** Refactor to a single `useEffect` that manages the entire EventSource lifecycle without callback-to-callback circular references.

### 23. `useWorkflowRun.ts` — `eventToRunStatus` recreated every render
- **Line:** 71–94
- **Severity:** 🟢 **Low**
- **Description:** The top-level `eventToRunStatus` function is not memoized. It is only called inside the SSE handler (not the render path), so impact is minimal.
- **Fix:** If desired, move outside the hook file or memoize with `useCallback`.

### 24. `useLockBodyScroll.ts` — SSR-safe but missing `document` guard
- **Line:** 11
- **Severity:** 🟢 **Low**
- **Description:** `document.body.style.overflow` is accessed only inside `useEffect`, so SSR is safe. Adding an explicit `typeof document !== "undefined"` guard makes the intent clearer.
- **Fix:** Optional guard for clarity:
  ```ts
  if (typeof document === "undefined") return;
  ```

---

## Positive Findings

| File | Observation |
|------|-------------|
| `useWorkflowEvents.ts` | Proper EventSource cleanup on unmount (`es.close()` + `clearTimeout`). |
| `useWorkflowStream.ts` | `setInterval` timer is properly cleared. |
| `useWebSocketControl.ts` | All REST action callbacks are wrapped in `useCallback`. |
| `useKeyboardShortcuts.ts` | `window` keydown listener is added and removed correctly. |
| `useCitations.ts` | `citationMap`, `citations`, and callbacks are properly memoized. |
| `useTheme.ts` | `mounted` pattern correctly avoids hydration mismatch. |
| `useInterval.ts` | Classic ref-pattern for interval callbacks is correctly implemented. |
| `useLockBodyScroll.ts` | Cleanup restores original `overflow` value. |
| `useComposer.ts` | `removeAttachment` correctly revokes `URL.createObjectURL`. |
| `useWorkflowRun.ts` | `cancel()` properly aborts fetch and closes EventSource. |

---

## Summary Table

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|
| 1 | `useWorkflowEvents.ts` | 56–59 | Ref mutation during render | 🔴 Critical |
| 2 | `useWorkflowRun.ts` | 147–258 | No unmount cleanup for EventSource | 🔴 Critical |
| 3 | `useWorkflowRun.ts` | 162–206 | Multiple sequential setState in SSE handler | 🟡 High |
| 4 | `useWorkflowRun.ts` | 150–151 | Dangerous type assertion on AbortController | 🟡 High |
| 5 | `useComposer.ts` | 173–181 | `submit` recreated every keystroke | 🟡 High |
| 6 | `useComposer.ts` | 94–165 | Blob URL leak on unmount | 🟡 High |
| 7 | `useWorkflowSimulation.ts` | 225 | Timer leak in `reset` auto-restart | 🟡 High |
| 8 | `useWebSocketControl.ts` | 50–52 | Ref mutation during render | 🟡 High |
| 9 | `useWorkflowStream.ts` | 48–59 | Filter+sort full events array every change | 🟡 High |
| 10 | `useKeyboardShortcuts.ts` | 26–27 | Ref mutation during render | 🟠 Medium |
| 11 | `useKeyboardShortcuts.ts` | 18, 71 | Unused `listRef` option | 🟠 Medium |
| 12 | `useWorkflowEvents.ts` | 128–136 | Redundant ref assignment + unnecessary setEvents | 🟠 Medium |
| 13 | `useWorkflowStream.ts` | 38 | `hasStarted` not memoized | 🟠 Medium |
| 14 | `useWorkflowSimulation.ts` | 232 | ESLint-disable for exhaustive deps | 🟠 Medium |
| 15 | `useInterval.ts` | 17–30 | `useDebounce` in wrong file | 🟠 Medium |
| 16 | `useWebSocketControl.ts` | 68–71 | Polling errors silently swallowed | 🟠 Medium |
| 17 | `lib/store.ts` | 19–34 | Missing Zustand selectors | 🟢 Low |
| 18 | `store/citationStore.ts` | 13–20 | Missing Zustand selectors | 🟢 Low |
| 19 | `useComposer.ts` | 122–181 | Error not cleared on text change | 🟢 Low |
| 20 | `useTheme.ts` | 23–25 | Could use useSyncExternalStore | 🟢 Low |
| 21 | `useCitations.ts` | 44 | `sources` dependency not stable | 🟢 Low |
| 22 | `useWorkflowEvents.ts` | 61–160 | Circular callback dependency | 🟢 Low |
| 23 | `useWorkflowRun.ts` | 71–94 | `eventToRunStatus` not memoized | 🟢 Low |
| 24 | `useLockBodyScroll.ts` | 11 | Missing explicit document guard | 🟢 Low |

---

## Missing File

`/mnt/agents/output/multi-model-agent-platform/src/hooks/useDebounce.ts` — **File does not exist**. The `useDebounce` implementation is located inside `useInterval.ts` (lines 17–30). Verify that no imports are broken and either split the file or update import paths.
