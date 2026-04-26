# Workflow API Audit Report
**Project:** multi-model-agent-platform  
**Audited Files:** 5 route files under `app/api/workflows/`  
**Date:** Auto-generated  
**Auditor:** Backend API Quality Auditor  

---

## Executive Summary

| Checklist Item | Status | Notes |
|----------------|--------|-------|
| POST validates body with Zod | ✅ PASS | `createWorkflowSchema` well-structured; uses `validateRequest` helper |
| GET handles pagination | ⚠️ PARTIAL | Uses `limit`/`offset` but lacks bounds validation, NaN guards, and pagination links |
| SSE events properly formatted | ✅ PASS | `id:\n...\nevent:\n...\ndata:\n...\n\n` format correct |
| SSE supports Last-Event-ID | ⚠️ PARTIAL | Header read and passed to DB; demo fallback ignores `afterId` |
| WebSocket messages properly typed | ⚠️ PARTIAL | Zod envelope validated, but `payload: z.record(z.any())` is too loose; doesn't match API `WebSocketMessage` discriminated union |
| PATCH handles amendments safely | ⚠️ PARTIAL | Status transition matrix exists but `amending` entry incomplete; no `current_plan_version` bump on PATCH amend |
| DELETE handles cancellation | ⚠️ PARTIAL | Guards terminal states but doesn't return 409; no task cleanup |
| Proper HTTP status codes | ⚠️ PARTIAL | Mostly correct; a few semantically off codes |
| Auth checked on every route | ✅ PASS | All routes wrapped in `withAuth` |
| Rate limit headers | ⚠️ PARTIAL | Hardcoded mock values in `jsonResponse`; missing from SSE stream |

---

## Detailed Findings

### 1. POST /api/workflows — Request Body Validation

**File:** `app/api/workflows/route.ts`  
**Lines:** 18–59, 61–65  
**Severity:** Info

The `createWorkflowSchema` is comprehensive and correctly uses Zod primitives:
- `objective`: `z.string().min(1).max(5000)` ✅
- `space_id`: `z.string().min(1)` ✅
- `budget_credits`: `z.number().positive().max(1000).optional()` ✅
- `deadline`: `z.string().datetime().optional()` ✅
- `deliverable_kinds`: enum array with valid artifact types ✅
- `policy_overrides`: nested object with constrained numeric fields ✅
- `context`: nested object with message_history and attachments ✅

**Validation flow:**
```ts
const validated = await validateRequest(req, createWorkflowSchema);
if (!validated.success) return validated.response;
```
This pattern is clean and returns 400 with detailed Zod issues.

**Minor Issue — Hard-coded Audit Metadata**  
`ip_address: "127.0.0.1"` and `user_agent: "Mozilla/5.0"` are hardcoded (lines 111–112). This makes audit events unreliable in production.

> **Recommendation:** Read `req.headers.get("x-forwarded-for")` or `req.ip` and `req.headers.get("user-agent")` instead of hardcoding.

---

### 2. GET /api/workflows — Pagination

**File:** `app/api/workflows/route.ts`  
**Lines:** 120–141  
**Severity:** Medium

**Issues Found:**

#### 2a. No `limit` bounds validation
```ts
limit: params.limit ? parseInt(params.limit, 10) : 20,
```
A client can send `?limit=999999` and receive an unbounded result set. No maximum limit is enforced.

> **Recommendation:** Clamp `limit` to a reasonable maximum (e.g., `Math.min(parseInt(params.limit, 10), 100)`).

#### 2b. No NaN / negative validation
```ts
parseInt(params.limit, 10)
```
`parseInt("abc", 10)` returns `NaN`, which passes through to `db.listWorkflows()`. The mock DB may or may not handle this gracefully.

> **Recommendation:** Add `Number.isFinite()` and `> 0` checks. Return 400 for invalid pagination parameters.

#### 2c. Missing pagination metadata (next/prev links)
The response returns only `data`, `total`, `limit`, `offset`. There are no `hasMore`, `nextOffset`, or link-based pagination fields, making client navigation harder.

> **Recommendation:** Add `hasMore: offset + data.length < total` and optionally `nextOffset` / `prevOffset`.

#### 2d. Default limit of 20 is not documented in response
Clients must infer the default. The response should echo the effective limit.

> **Recommendation:** Already echoes — this is fine, but document it in the API contract.

---

### 3. SSE /api/workflows/[id]/events — Event Formatting

**File:** `app/api/workflows/[id]/events/route.ts`  
**Lines:** 164–250  
**Severity:** Medium

#### 3a. SSE format is correct ✅
```ts
const chunk = `id: ${event.id}\nevent: ${event.event}\ndata: ${payload}\n\n`;
```
This follows the W3C Server-Sent Events spec: each field terminated by `\n`, message by `\n\n`.

#### 3b. `stream.close` event type is not in `EVENT_TYPES`
**Line:** 223  
The `EVENT_TYPES` constant (lines 10–22) does not include `"stream.close"`. While this is only used as a terminal signal, it creates an inconsistency.

> **Recommendation:** Add `"stream.close"` to `EVENT_TYPES` or document it as a meta-event.

#### 3c. Missing rate-limit headers on SSE response
The SSE `Response` at line 240–248 does not include `X-RateLimit-*` headers. Because `jsonResponse` is not used, the helper's hardcoded headers are absent.

> **Recommendation:** Add rate-limit headers to the SSE `Response` headers object.

#### 3d. Abort signal listener might leak
**Line:** 229–232
```ts
req.signal.addEventListener("abort", () => {
  clearInterval(interval);
  controller.close();
});
```
The `abort` listener is never removed. If the stream completes naturally (tick >= 6), the listener stays attached until GC. In a long-running server, this can accumulate.

> **Recommendation:** Store the listener in a variable and call `req.signal.removeEventListener("abort", listener)` in the interval cleanup path.

---

### 4. SSE — Last-Event-ID / Reconnection Support

**File:** `app/api/workflows/[id]/events/route.ts`  
**Lines:** 174, 179, 24–162  
**Severity:** High

#### 4a. Header is correctly read ✅
```ts
const lastEventId = req.headers.get("last-event-id") || undefined;
```
Next.js normalizes headers to lowercase, so this works.

#### 4b. **CRITICAL BUG: Demo events ignore `afterId`**
**Lines:** 28–29
```ts
const stored = db.getWorkflowEvents(workflowId, afterId);
if (stored.length > 0) return stored;
```
If no stored events exist (common for new workflows), the function falls through to generate **demo events** (lines 32–161). These generated events do **not** filter by `afterId`. On reconnect, a client that already received `evt-abc-1` will receive all demo events again, including duplicates.

> **Recommendation:** Apply `afterId` filtering to generated demo events:
> ```ts
> const filtered = afterId ? events.filter(e => e.id > afterId) : events;
> return filtered;
> ```
> Or, for deterministic ordering, sort by `timestamp` and slice after the matching ID.

#### 4c. Duplicate event IDs in demo data
The same event ID `evt-${workflowId}-plan` is generated for both `queued/planning` status and `running` status (lines 37 and 47). If a workflow moves through both states, duplicate IDs exist in the demo stream, confusing `lastEventId` tracking.

> **Recommendation:** Ensure every generated demo event has a unique ID, perhaps by suffixing the workflow status.

---

### 5. WebSocket /api/workflows/[id]/ws — Message Typing

**File:** `app/api/workflows/[id]/ws/route.ts`  
**Lines:** 18–29, 31–165  
**Severity:** Medium

#### 5a. Zod envelope is validated ✅
```ts
const wsMessageSchema = z.object({
  action: z.enum([...]),
  payload: z.record(z.any()),
});
```
The outer envelope passes validation.

#### 5b. **`payload` is untyped — type safety lost**
`z.record(z.any())` means the server accepts **any** payload shape. The API contract in `src/types/api.ts` defines a strict discriminated union:

```ts
export type WebSocketMessage =
  | ClarificationAnswerMessage  // { type, workflowId, clarificationId, answer }
  | ApprovalMessage             // { type, workflowId, planRevisionId, approved }
  | CancelMessage               // { type, workflowId, reason? }
  | AmendMessage                // { type, workflowId, instruction }
  | ModelOverrideMessage;       // { type, workflowId, taskId, modelId }
```

The route's action names (e.g., `"clarification.answer"`, `"approval.grant"`) do **not** match the API type names (`"clarification_answer"`, `"approval"`). The response envelope shape `{ type: "ack", action, data }` is also not present in the API types.

> **Recommendation:** Create per-action Zod schemas (e.g., `clarificationAnswerSchema`) and use a discriminated union parser. Align action names with the API contract or vice versa.

#### 5c. Manual payload validation is inconsistent
Some actions manually validate payload fields (e.g., `clarification.answer` checks `clarification_id` and `answer`), but others like `approval.grant` do not validate `gate_id` at all. `workflow.amend` does not validate that `objective_patch` is a string.

> **Recommendation:** Replace manual checks with Zod sub-schemas for each action.

#### 5d. Missing `messageId` / `sentAt` in schema
The API contract `WebSocketMessageBase` requires `messageId` and `sentAt` on every message. The route's `wsMessageSchema` does not include these fields.

> **Recommendation:** Add `messageId: z.string().uuid()` and `sentAt: z.string().datetime()` to the schema.

---

### 6. PATCH /api/workflows/[id] — Amendment Safety

**File:** `app/api/workflows/[id]/route.ts`  
**Lines:** 57–121  
**Severity:** Medium

#### 6a. Status transition matrix exists ✅
```ts
const validTransitions: Record<string, string[]> = {
  queued: ["running", "cancelled"],
  planning: ["cancelled"],
  running: ["paused", "amending", "cancelled"],
  paused: ["running", "amending", "cancelled"],
  amending: ["running", "cancelled"],
  awaiting_clarification: ["running", "cancelled"],
  awaiting_approval: ["running", "cancelled"],
  synthesizing: ["cancelled"],
};
```
This is a solid foundation for safe state transitions.

#### 6b. **Missing `completed` and `failed` entries**
The matrix has no entries for `completed` or `failed`. While the code doesn't crash (it returns `[]` via `|| []`), the error message says "Invalid status transition" which is misleading — those states are terminal and should be explicitly listed as empty arrays.

> **Recommendation:** Add `completed: []` and `failed: []` to make the state machine explicit.

#### 6c. **PATCH does not bump `current_plan_version` on amendment**
When `PATCH` sets status to `amending`, it does **not** increment `current_plan_version`. The WebSocket `workflow.amend` action **does** increment it (line 111 in `ws/route.ts`). This inconsistency means amendments via PATCH and WS behave differently.

> **Recommendation:** On status transition to `amending` in PATCH, increment `current_plan_version` and set `amended_at` timestamp.

#### 6d. `policy_overrides` merge is shallow
```ts
updates.policy_overrides = { ...workflow.policy_overrides, ...body.policy_overrides };
```
This is a shallow merge. If `policy_overrides` has nested objects, they will be overwritten entirely rather than merged.

> **Recommendation:** Use a deep-merge utility (e.g., `lodash.merge` or a custom recursive merge) if nested policy overrides are expected.

---

### 7. DELETE /api/workflows/[id] — Cancellation

**File:** `app/api/workflows/[id]/route.ts`  
**Lines:** 123–149  
**Severity:** Low

#### 7a. Terminal state guard ✅
```ts
if (workflow.status === "completed" || workflow.status === "cancelled" || workflow.status === "failed") {
  return jsonResponse({ error: "Cannot cancel a finished workflow" }, 400);
}
```
This prevents cancelling already-finished workflows.

#### 7b. **Wrong status code for already-finished workflows**
HTTP 400 implies a malformed request. For a workflow that is already completed/cancelled, a more appropriate code is **409 Conflict** or **422 Unprocessable Entity**.

> **Recommendation:** Return 409 with `error: "Workflow already terminated"`.

#### 7c. **No running task cleanup**
When a workflow is cancelled, running tasks are not updated. Their status remains `"running"` in the database.

> **Recommendation:** On cancellation, cascade status changes to all tasks belonging to the workflow:
> ```ts
db.listTasksByWorkflow(params.id)
  .filter(t => t.status === "running")
  .forEach(t => db.updateTask(t.id, { status: "cancelled" }));
```

#### 7d. **DELETE returns 200 instead of 202 or 204**
For a deletion/cancellation of a background process, 202 Accepted is often more appropriate. The current response returns `{ success: true, id, status: "cancelled" }` with status 200.

> **Recommendation:** Consider 202 for async cancellation, or keep 200 if the cancellation is synchronous.

---

### 8. HTTP Status Code Audit

| Route | Scenario | Current Code | Recommended | Severity |
|-------|----------|------------|-------------|----------|
| `POST /workflows` | Space not found | 404 | 404 ✅ | — |
| `GET /workflows/:id` | Not found | 404 | 404 ✅ | — |
| `GET /workflows/:id` | Wrong org | 403 | 403 ✅ | — |
| `PATCH /workflows/:id` | Invalid transition | 400 | 422 | Low |
| `DELETE /workflows/:id` | Already finished | 400 | 409 | Low |
| `WS POST` | Unknown action | 400 | 400 ✅ | — |
| `WS POST` | Missing fields | 400 | 400 ✅ | — |

**Global Issue:** `withErrorHandler` returns 500 with the raw error message:
```ts
return jsonResponse({ error: message }, 500);
```
This could leak internal implementation details in production (e.g., database connection strings, stack traces if the error message includes them).

> **Recommendation:** In production, return a generic `{ error: "Internal server error" }` for 500, and log the detailed error server-side.

---

### 9. Authentication Checks

**File:** `src/lib/api-utils.ts`  
**Lines:** 17–46  
**Severity:** High

#### 9a. All routes use `withAuth` ✅
Every workflow route (`POST`, `GET`, `PATCH`, `DELETE`, SSE, WS) is wrapped in `withAuth`.

#### 9b. **CRITICAL: Mock auth fallback allows unauthenticated access**
```ts
let userId = "user-1";
if (token && token.startsWith("tok_")) {
  const extracted = token.split("_")[1];
  if (extracted) userId = extracted;
}
```
If no `Authorization` header is provided, `token` is undefined, and `userId` defaults to `"user-1"` — the first mock user. This means **the API is effectively unauthenticated**.

> **Recommendation:** Remove the fallback. Return 401 when the header is missing:
> ```ts
> const token = req.headers.get("authorization")?.replace("Bearer ", "");
> if (!token) return jsonResponse({ error: "Unauthorized" }, 401);
> ```

#### 9c. Token format is weak
The token extraction `token.split("_")[1]` produces a user ID from `tok_123`. This is a toy implementation and not secure for production.

> **Recommendation:** Integrate a real JWT or session validation library (e.g., `jose`, `next-auth`).

#### 9d. No RBAC on workflow endpoints
All authenticated users in the same org can cancel, amend, or delete any workflow. There is no check that the requesting user is the `owner_id` or an admin.

> **Recommendation:** Add owner/admin checks for destructive operations:
> ```ts
> if (workflow.owner_id !== ctx.user.id && ctx.user.role !== "admin") {
>   return jsonResponse({ error: "Forbidden" }, 403);
> }
> ```

---

### 10. Rate Limiting Headers

**File:** `src/lib/api-utils.ts`  
**Lines:** 78–90  
**Severity:** Medium

#### 10a. `jsonResponse` includes hardcoded mock headers
```ts
"X-RateLimit-Limit": "1000",
"X-RateLimit-Remaining": "998",
"X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
```
These values are **static** and do not reflect actual rate limiting. Clients cannot trust them.

> **Recommendation:** Implement a real rate limiter (e.g., `rate-limiter-flexible` with Redis or in-memory store) and populate these headers dynamically.

#### 10b. SSE response lacks rate limit headers
The SSE `Response` in `events/route.ts` does not include `X-RateLimit-*` headers at all.

> **Recommendation:** Add the same rate limit headers to SSE responses.

#### 10c. No `Retry-After` header on rate-limited responses
If a real rate limiter is added later, there is no infrastructure for returning `429 Too Many Requests` with `Retry-After`.

> **Recommendation:** Prepare `jsonResponse` to accept an optional `retryAfter` field when status is 429.

---

### 11. CORS Handling

**File:** All workflow routes  
**Severity:** Info

#### 11a. `OPTIONS` handler present on all routes ✅
Each route exports an `OPTIONS` function that calls `corsPreflight()`.

#### 11b. `Access-Control-Allow-Origin: *` is overly permissive
`jsonResponse` and `corsPreflight` both set `Access-Control-Allow-Origin: *`. For a production API handling sensitive workflow data, this should be restricted to known origins.

> **Recommendation:** Use an allow-list of origins and validate `req.headers.get("origin")` against it.

---

### 12. Type Consistency Issues

#### 12a. `events/route.ts` uses incompatible `WorkflowEvent` type
**File:** `app/api/workflows/[id]/events/route.ts`  
**Line:** 8  
The import `WorkflowEvent` from `@/src/types` resolves to the API contract union (e.g., `WorkflowQueuedEvent`, `WorkflowCompletedEvent`, etc.) which has shape `{ type, workflowId, emittedAt, ... }`.  
However, the route constructs objects with shape `{ id, event, workflow_id, data, timestamp }`.  
This is a **type mismatch** that would fail TypeScript strict checking if the event objects were typed explicitly.

> **Recommendation:** Define a dedicated `SseWorkflowEvent` type for the events route and use it consistently. Align with the API contract or update the contract.

#### 12b. `as any` casts suppress type safety
**Files:** All route files (e.g., `route.ts` line 117, `ws/route.ts` line 165)  
The `withAuth` + `withErrorHandler` wrappers require `as any` casts. This indicates a typing mismatch in the wrapper signatures.

> **Recommendation:** Fix the wrapper type signatures so they conform to Next.js App Router route handler types without `as any`.

---

### 13. GET /api/workflows/[id]/artifacts

**File:** `app/api/workflows/[id]/artifacts/route.ts`  
**Lines:** 1–25  
**Severity:** Low

#### 13a. No pagination
A workflow could theoretically have hundreds of artifacts. The route returns all of them in a single array.

> **Recommendation:** Add `limit`/`offset` query parameter support, mirroring the main workflows list.

#### 13b. Response shape is `{ data, total }`
This is inconsistent with `GET /api/workflows` which returns `{ data, total, limit, offset }`. Also, the API contract `WorkflowDetailResponse` embeds artifacts directly in the detail GET, so a separate artifacts endpoint returning a different shape is acceptable but should be documented.

---

## Fix Priority Matrix

| Priority | Issue | File(s) | Line(s) |
|----------|-------|---------|---------|
| 🔴 **Critical** | Mock auth fallback allows unauthenticated access | `src/lib/api-utils.ts` | 23–27 |
| 🔴 **Critical** | SSE demo events ignore `Last-Event-ID` | `events/route.ts` | 28–161 |
| 🟡 **High** | Duplicate event IDs in generated SSE events | `events/route.ts` | 37, 47, 119 |
| 🟡 **High** | WS payload is untyped (`z.record(z.any())`) | `ws/route.ts` | 28 |
| 🟡 **High** | No RBAC on destructive workflow operations | All `[id]` routes | Various |
| 🟡 **High** | Hard-coded rate limit headers | `src/lib/api-utils.ts` | 84–86 |
| 🟡 **Medium** | No pagination bounds on GET /workflows | `route.ts` | 129–130 |
| 🟡 **Medium** | PATCH doesn't bump plan version on amend | `route.ts` | 98 |
| 🟡 **Medium** | 500 responses may leak error details | `src/lib/api-utils.ts` | 72–73 |
| 🟡 **Medium** | SSE stream lacks rate limit headers | `events/route.ts` | 240–248 |
| 🟢 **Low** | Wrong status code for already-finished DELETE | `route.ts` | 134 |
| 🟢 **Low** | Wrong status code for invalid PATCH transition | `route.ts` | 93–96 |
| 🟢 **Low** | Abort listener leak in SSE | `events/route.ts` | 229–232 |
| 🟢 **Low** | No task cleanup on cancellation | `route.ts` | 137 |
| 🟢 **Low** | Hard-coded audit IP / UA | `route.ts` | 111–112 |
| 🟢 **Low** | CORS `*` is overly permissive | `src/lib/api-utils.ts` | 81, 174 |
| 🟢 **Low** | No pagination on artifacts list | `artifacts/route.ts` | 18–19 |
| 🟢 **Low** | `stream.close` not in `EVENT_TYPES` | `events/route.ts` | 10–22 |
| 🟢 **Low** | Missing `messageId`/`sentAt` in WS schema | `ws/route.ts` | 18–29 |

---

## Recommendations Summary

1. **Authentication:** Remove the `userId = "user-1"` fallback immediately. Require a valid bearer token on every request.
2. **SSE Reconnection:** Filter generated demo events by `afterId` and ensure all event IDs are unique.
3. **WebSocket Typing:** Replace `z.record(z.any())` with discriminated Zod schemas per action type.
4. **Rate Limiting:** Implement a real rate limiter; remove hardcoded headers.
5. **Pagination:** Clamp `limit` to a maximum, validate offset/limit are positive integers, and add pagination links.
6. **State Machine:** Complete the `validTransitions` matrix with terminal states; synchronize PATCH and WS amendment behavior.
7. **Error Handling:** Do not send raw error messages in 500 responses; log them server-side.
8. **RBAC:** Add owner/admin checks for PATCH and DELETE.
9. **Type Alignment:** Fix the `WorkflowEvent` type mismatch between the events route and the API contract.

---

*End of Report*
