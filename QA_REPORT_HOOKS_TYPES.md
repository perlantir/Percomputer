# Type Safety Audit Report — Hooks, Data & Mock Utilities

**Audited directories:**
- `src/hooks/*.ts` (14 files)
- `src/data/*.ts` (9 files)
- `src/mock/*.ts` (5 files)

**Audit date:** 2025-01-15
**Auditor:** TypeScript Quality Auditor

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical / High | 14 |
| 🟡 Medium | 7 |
| 🟢 Low | 6 |

**Key themes:**
1. **Unchecked `JSON.parse()` casts** are the most dangerous pattern — 4 instances where arbitrary JSON is cast to domain types without validation.
2. **Explicit `any` usage** in 8 locations weakens the type system and hides potential bugs.
3. **Missing hook return type annotations** on 4 hooks reduces IDE support and weakens contract enforcement.
4. **Redundant/unsafe type assertions** (`as WorkflowEvent`, `as RunStatus`) could fail silently if backend contracts drift.

---

## 🔴 Critical / High Severity Issues

### 1. `useWorkflowRun.ts:151` — Explicit `any` on AbortController extension
```ts
(abortRef.current as any).__es = esRef;
```
**Issue:** Attaches an arbitrary property to `AbortController` via `any` cast, bypassing type safety entirely. Same pattern at line 268.
**Fix:** Declare an extended interface:
```ts
interface AbortControllerWithES extends AbortController {
  __es?: { current: EventSource };
}
```

### 2. `useWorkflowRun.ts:268` — Explicit `any` on AbortController read
```ts
const es = (abort as any).__es?.current;
```
**Issue:** Reads an untyped property. If the property name changes, no compile-time error occurs.
**Fix:** Use the branded interface from issue #1.

### 3. `useWorkflowRun.ts:140` — Unchecked `RunStatus` cast from API response
```ts
status: created.status as RunStatus,
```
**Issue:** Backend may return an unexpected status string. The cast silences the type checker and propagates invalid data.
**Fix:** Add a runtime validator:
```ts
const validStatus = (s: string): s is RunStatus =>
  ["idle","submitting","queued","planning","running","paused",
   "succeeded","failed","cancelling","cancelled"].includes(s);
```

### 4. `useWorkflowRun.ts:144` — Same unchecked `RunStatus` cast
```ts
setStatus(created.status as RunStatus);
```
**Fix:** Same as issue #3 — validate before casting.

### 5. `useWorkflowRun.ts:160` — `JSON.parse()` result assigned without validation
```ts
const event: ServerSentEvent = JSON.parse(msg.data);
```
**Issue:** `JSON.parse` returns `any`. Assigning directly to `ServerSentEvent` is an unchecked type assertion. Malformed SSE data could crash downstream logic.
**Fix:** Use a validation function or schema check (e.g., Zod, io-ts) before assigning.

### 6. `useWorkflowEvents.ts:120` — Unchecked `WorkflowEvent` cast on JSON.parse
```ts
parsed = JSON.parse(evt.data) as WorkflowEvent;
```
**Issue:** Same pattern as #5. The try/catch only catches JSON syntax errors, not schema mismatches.
**Fix:** Validate the parsed object shape before casting, or use a runtime type guard:
```ts
function isWorkflowEvent(obj: unknown): obj is WorkflowEvent {
  return typeof obj === "object" && obj !== null &&
    "type" in obj && typeof (obj as Record<string,unknown>).type === "string";
}
```

### 7. `data/index.ts:143–158` — Multiple explicit `any` types in `getDemoStats`
```ts
const allTasks = DEMO_WORKFLOWS.flatMap((w: any) => w.tasks);
const allEdges = DEMO_WORKFLOWS.flatMap((w: any) => w.edges);
const allArtifacts = DEMO_WORKFLOWS.flatMap((w: any) => w.artifacts);
const allSources = DEMO_WORKFLOWS.flatMap((w: any) => w.sources);
```
**Issue:** `DEMO_WORKFLOWS` is already typed as `DemoWorkflow[]`. The `any` annotations defeat the type system.
**Fix:** Remove all `: any` annotations — TypeScript infers correctly from `DemoWorkflow`.

### 8. `data/index.ts:148–155` — More `any` in reducer callbacks
```ts
const totalCreditsSpent = DEMO_WORKFLOWS.reduce(
  (sum: number, w: any) => sum + w.workflow.spentCredits, 0
);
const totalTokensProcessed = allTasks.reduce(
  (sum: number, t: any) => sum + t.inputTokens + t.outputTokens, 0
);
```
**Fix:** Use `DemoWorkflow` and `Task` types instead of `any`.

### 9. `data/mock-data.ts:934` — `any[]` in public function return type
```ts
export function generateWorkflowDAG(...): { version: number; nodes: any[]; edges: any[] }
```
**Issue:** Public utility function exposes `any[]` arrays, leaking untyped data to consumers.
**Fix:** Define explicit node/edge interfaces:
```ts
interface DAGNode { id: string; task_id: string; label: string; status: TaskStatus; ... }
interface DAGEdge { from: string; to: string; label: string; }
```

### 10. `data/mock-data.ts:946` — `any[]` array declaration inside function
```ts
const edges: any[] = [];
```
**Fix:** Same as #9 — use `DAGEdge[]`.

---

## 🟡 Medium Severity Issues

### 11. `useWebSocketControl.ts:64` — Unchecked API response cast
```ts
const data = (await res.json()) as { clarifications: PendingClarification[] };
```
**Issue:** `res.json()` returns `Promise<any>`. Casting assumes the backend contract is always honored.
**Fix:** Validate with a type guard or use a fetch wrapper that validates responses.

### 12. `useWorkflowSimulation.ts:200` — Partial object cast to full type
```ts
const evt = { ...step.payload, type: step.type, workflowId: "sim-demo" } as WorkflowEvent;
```
**Issue:** `step.payload` is `Partial<WorkflowEvent>`. The `as` assertion pretends the object is complete, but runtime may be missing required fields.
**Fix:** Build a proper `WorkflowEvent` factory function that guarantees all required fields are present, or use a stricter payload builder.

### 13. `useTheme.ts:29` — `resolvedTheme` cast from external library
```ts
resolvedTheme: resolvedTheme as "light" | "dark" | undefined,
```
**Issue:** If `next-themes` ever returns a new value (e.g., `"system"`), the cast silently hides it.
**Fix:** Use a type guard or accept the library's type and map it:
```ts
resolvedTheme: resolvedTheme === "light" || resolvedTheme === "dark" ? resolvedTheme : undefined,
```

### 14. `useComposer.ts:154` — Unsafe `res.json()` access
```ts
const body = await res.json().catch(() => ({}));
throw new Error(body.error || `Failed to start workflow (${res.status})`);
```
**Issue:** `body` is `any`. If `body` is not an object, `body.error` may throw at runtime.
**Fix:** Check `typeof body === "object" && body !== null && "error" in body`.

### 15. `useWorkflowRun.ts:174` — Redundant cast of already-typed variable
```ts
const newStatus = eventToRunStatus(event as WorkflowEvent);
```
**Issue:** `event` is already `ServerSentEvent`. The cast is a workaround because `event.type.startsWith("workflow_")` doesn't narrow the union. While pragmatic, it's fragile.
**Fix:** Define a type predicate:
```ts
function isWorkflowEvent(e: ServerSentEvent): e is WorkflowEvent {
  return e.type.startsWith("workflow_");
}
```

### 16. `mock/index.ts` — Structural type mismatch between `MemoryEntry` and `@/src/types`
**Issue:** `mock/index.ts` imports `MemoryEntry` from `@/src/types` with fields like `key`, `value`, `scope`, `expiresAt`. But `data/demo-memory.ts` defines its own `MemoryEntry` with fields like `content`, `tags`, `importance`, `decay`. Both have the same name but incompatible shapes. If a module imports both, subtle bugs occur.
**Fix:** Rename one of them (e.g., `DemoMemoryEntry` in `demo-memory.ts`) or ensure they share a single source of truth.

### 17. `hooks/index.ts` — Incomplete public API surface
**Issue:** `hooks/index.ts` only re-exports 7 hooks, but 13 hook files exist. Missing: `useWorkflowEvents`, `useWebSocketControl`, `useWorkflowSimulation`, `useWorkflowStream`, `useLockBodyScroll`, `useRailStore`.
**Fix:** Add missing re-exports so consumers don't import from deep file paths.

---

## 🟢 Low Severity Issues

### 18. `useInterval.ts:3` — Missing explicit return type
```ts
export function useInterval(callback: () => void, delay: number | null) {
```
**Fix:** Add `: void` return type annotation for clarity.

### 19. `useInterval.ts:17` — Missing explicit return type on generic hook
```ts
export function useDebounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
```
**Fix:** Add explicit return type: `: (...args: Parameters<T>) => void`.

### 20. `useLockBodyScroll.ts:7` — Missing explicit return type
```ts
export function useLockBodyScroll(locked: boolean) {
```
**Fix:** Add `: void` return type annotation.

### 21. `useKeyboardShortcuts.ts:31` — DOM event target cast
```ts
const target = e.target as HTMLElement;
```
**Issue:** In a keyboard event, `e.target` could theoretically be `null` or a non-HTMLElement. The cast is safe in practice but not formally guaranteed.
**Fix:** Use a type guard: `if (!(e.target instanceof HTMLElement)) return;`

### 22. `useWorkflowEvents.ts:83` — `connect` function return type is implicit
```ts
const connect = useCallback(() => { ... return es; }, [scheduleReconnect]);
```
**Fix:** Add explicit return type `: EventSource | undefined` to the inner function.

---

## Positive Findings

The following files demonstrate **exemplary type safety practices**:

- ✅ `useCitations.ts` — Every parameter, return type, and local variable is explicitly typed. No casts.
- ✅ `useRailStore.ts` — Zustand store interface is fully typed; persist middleware is correctly generic.
- ✅ `useComposer.ts` — Large hook with explicit `UseComposerReturn` interface, typed state setters, and no `any`.
- ✅ `data/demo-models.ts` — `ModelCard` interface is comprehensive; `DEMO_MODELS` array is explicitly typed.
- ✅ `data/demo-workflows.ts` — Strong domain types (`Task`, `TaskEdge`, `Workflow`, `DemoWorkflow`) with no `any` leakage.
- ✅ `mock/generators.ts` — Generics (`pick<T>`, `pickN<T>`) are properly constrained; all utility functions have explicit return types.
- ✅ `mock/search-results.ts` — Interfaces and functions are fully typed; no implicit `any`.
- ✅ `data/demo-users.ts`, `data/demo-spaces.ts`, `data/demo-connectors.ts` — Clean typed exports with lookup functions returning `| undefined` (null-safe).

---

## Recommended Remediation Priority

| Priority | Action | Files |
|----------|--------|-------|
| **P0** | Remove all `any` casts from AbortController and API JSON parsing | `useWorkflowRun.ts`, `useWorkflowEvents.ts`, `useWebSocketControl.ts`, `data/index.ts`, `data/mock-data.ts` |
| **P1** | Add runtime validators for external API responses | `useWorkflowRun.ts`, `useWebSocketControl.ts`, `useWorkflowEvents.ts` |
| **P2** | Fix `MemoryEntry` naming collision | `mock/index.ts`, `data/demo-memory.ts` |
| **P3** | Complete `hooks/index.ts` re-exports | `hooks/index.ts` |
| **P4** | Add missing explicit return types | `useInterval.ts`, `useLockBodyScroll.ts`, `useWorkflowEvents.ts` |

---

## Appendix: File-by-File Quick Reference

| File | Issues | Grade |
|------|--------|-------|
| `useWorkflowRun.ts` | #1, #3, #4, #5, #15 | C |
| `useWorkflowEvents.ts` | #6, #22 | B |
| `useWebSocketControl.ts` | #11 | B+ |
| `useWorkflowSimulation.ts` | #12 | B |
| `useTheme.ts` | #13 | B+ |
| `useInterval.ts` | #18, #19 | A- |
| `useLockBodyScroll.ts` | #20 | A- |
| `useComposer.ts` | #14 | A- |
| `useKeyboardShortcuts.ts` | #21 | A- |
| `useCitations.ts` | — | A+ |
| `useRailStore.ts` | — | A+ |
| `useWorkflowStream.ts` | — | A+ |
| `hooks/index.ts` | #17 | B |
| `data/index.ts` | #7, #8 | C |
| `data/mock-data.ts` | #9, #10 | C |
| `data/demo-workflows.ts` | — | A+ |
| `data/demo-memory.ts` | #16 | B |
| `data/demo-models.ts` | — | A+ |
| `data/demo-users.ts` | — | A+ |
| `data/demo-spaces.ts` | — | A+ |
| `data/demo-connectors.ts` | — | A+ |
| `data/models.ts` | — | A |
| `mock/generators.ts` | — | A+ |
| `mock/index.ts` | #16 | B |
| `mock/llm-responses.ts` | — | A+ |
| `mock/sse-events.ts` | — | A+ |
| `mock/search-results.ts` | — | A+ |
