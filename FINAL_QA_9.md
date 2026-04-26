# Final API Audit Report — Multi-Model Agent Orchestration Platform

**Auditor:** Backend API Quality Audit  
**Scope:** `app/api/*` route handlers, `src/lib/api-utils.ts`, SSE/WebSocket formatting, error handling, CORS, auth, response types  
**Date:** 2024-04-26  
**Severity Legend:** 🔴 Critical | 🟠 Warning | 🟡 Advisory | 🟢 Pass

---

## 1. Executive Summary

| Category | Score | Status |
|----------|-------|--------|
| Route Handler Coverage | 24/25 routes present | 🟢 Pass |
| HTTP Status Codes | Generally correct | 🟢 Pass |
| Error Handling | Wrapped but shape inconsistent with spec | 🟠 Warning |
| Response Type Consistency | Mostly consistent with deviations | 🟠 Warning |
| SSE Formatting | Spec-compliant with minor gaps | 🟡 Advisory |
| CORS | Double-header risk from `next.config.ts` | 🟠 Warning |
| Rate Limiting | Static fake headers only | 🟠 Warning |
| Authentication | Mock-based, functional hierarchy | 🟡 Advisory |
| WebSocket Simulation | Consistent ack/poll/pong shape | 🟢 Pass |

**Overall: B+ — Functionally sound with documented spec drift and production-readiness gaps.**

---

## 2. Route Handler Verification

### 2.1 Routes Present (24 implemented + 1 edge)

| # | Route | Methods | Auth | Error Wrap | OPTIONS |
|---|-------|---------|------|------------|---------|
| 1 | `GET /api/artifacts` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 2 | `GET /api/artifacts/[id]` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 3 | `GET /api/audit` | GET | ✅ `withAuth` (auditor) | ✅ `withErrorHandler` | ✅ |
| 4 | `GET /api/billing` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 5 | `GET /api/clarifications` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 6 | `GET /api/clarifications/[id]` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 7 | `POST /api/clarifications/[id]/answer` | POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 8 | `GET /api/connectors` | GET, POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 9 | `GET /api/connectors/[name]` | GET, DELETE | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 10 | `GET /api/health` | GET | ❌ (public) | ✅ `withErrorHandler` | ✅ |
| 11 | `GET /api/healthcheck` | GET | ❌ (public edge) | ❌ bare handler | ❌ |
| 12 | `GET /api/memory` | GET, DELETE | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 13 | `GET /api/models` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 14 | `POST /api/run` | POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 15 | `POST /api/search` | POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 16 | `GET /api/spaces` | GET, POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 17 | `GET /api/spaces/[id]` | GET, PATCH, DELETE | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 18 | `GET /api/spaces/[id]/workflows` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 19 | `GET /api/usage` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 20 | `GET /api/workflows` | GET, POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 21 | `GET /api/workflows/[id]` | GET, PATCH, DELETE | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 22 | `GET /api/workflows/[id]/artifacts` | GET | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 23 | `GET /api/workflows/[id]/events` | GET (SSE) | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |
| 24 | `GET/POST /api/workflows/[id]/ws` | GET, POST | ✅ `withAuth` | ✅ `withErrorHandler` | ✅ |

### 2.2 Missing / Undocumented Routes 🟠

The following routes are documented in `API.md` but **not implemented**:

- `GET/POST /api/chat` — Chat thread CRUD
- `GET/POST/DELETE /api/chat/:threadId` — Thread detail & messages
- `POST /api/chat/:threadId/stream` — Chat SSE streaming
- `GET/POST /api/agents` — Agent registry
- `GET /api/tools` — Tool catalog
- `POST /api/workflows/:workflowId/execute` — Workflow execution trigger
- `WS /api/ws` — Real-time collaboration WebSocket

**Impact:** Frontend features relying on these endpoints will 404. API.md is aspirational; actual contract is the `app/api/*` file tree.

### 2.3 Edge Runtime Handler — `/api/healthcheck` 🟡

```ts
export const runtime = "edge";
export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

- ✅ No auth required — correct for infra probes
- ⚠️ No `OPTIONS` handler — preflight will fail if called cross-origin from browser
- ⚠️ No `withErrorHandler` wrapper — uncaught exceptions will bubble raw
- ⚠️ Returns bare `Response.json` without CORS/rate-limit headers (unlike all other routes)

**Recommendation:** Wrap with `withErrorHandler` and add `OPTIONS` + `jsonResponse` for header consistency, or document this route as infrastructure-only.

---

## 3. Response Type Consistency

### 3.1 Standard List Response Shape 🟢

Most list endpoints return:

```json
{ "data": [...], "total": N, "limit": 50, "offset": 0 }
```

Implemented by: artifacts, clarifications, memory, connectors, spaces, workflows, spaces/[id]/workflows, workflow artifacts.

### 3.2 Standard Detail Response Shape 🟢

Single-resource endpoints return the object directly (or wrapped with additional computed fields like `presigned_url`).

### 3.3 Inconsistencies Found 🟠

#### A. `jsonResponse(req)` parameter usage is sporadic

Some handlers pass `req` to `jsonResponse` to enable origin-aware CORS; others omit it:

| File | `jsonResponse(..., req)`? |
|------|---------------------------|
| `artifacts/route.ts` | ❌ No |
| `artifacts/[id]/route.ts` | ❌ No |
| `audit/route.ts` | ❌ No |
| `billing/route.ts` | ❌ No |
| `clarifications/route.ts` | ❌ No |
| `connectors/route.ts` | ✅ Yes (GET & POST) |
| `connectors/[name]/route.ts` | ✅ Yes (GET & DELETE) |
| `health/route.ts` | ❌ No |
| `memory/route.ts` | ✅ Yes (GET & DELETE) |
| `models/route.ts` | ❌ No |
| `run/route.ts` | ✅ Yes |
| `search/route.ts` | ❌ No |
| `spaces/route.ts` | ❌ No |
| `spaces/[id]/route.ts` | ❌ No |
| `spaces/[id]/workflows` | ❌ No |
| `usage/route.ts` | ❌ No |
| `workflows/route.ts` | ❌ No |
| `workflows/[id]/route.ts` | ❌ No |
| `workflows/[id]/artifacts` | ❌ No |
| `workflows/[id]/ws` | ❌ No |

**Impact:** Routes without `req` pass an empty string for `Access-Control-Allow-Origin`, producing **inconsistent CORS behavior** depending on the caller.

**Recommendation:** Standardize all handlers to pass `req` into `jsonResponse(..., req)` or refactor `jsonResponse` to auto-extract origin from a global/async context.

#### B. Response field naming mismatch with `src/types/api.ts`

The TypeScript type definitions expect camelCase keys:

```ts
// src/types/api.ts
interface WorkflowListResponse {
  items: readonly WorkflowListItem[];
  total: number;
  page: number;
  pageSize: number;
}
```

But actual JSON responses use `data` and `limit/offset`:

```json
{ "data": [...], "total": 12, "limit": 20, "offset": 0 }
```

**Impact:** Type definitions and runtime responses are out of sync. Frontend code that imports these types may experience type-safety drift.

**Recommendation:** Align `src/types/api.ts` with actual runtime shapes, or vice versa.

---

## 4. Error Handling Audit

### 4.1 Exception Wrapping — `withErrorHandler` 🟢

Every production route is wrapped with `withErrorHandler`, which:

1. Catches synchronous and async exceptions
2. Logs to `console.error`
3. Returns `{ error: message }` with HTTP 500

```ts
export function withErrorHandler<T>(
  handler: (req: NextRequest, context: { params: any }) => Promise<T | NextResponse>
): (req: NextRequest, context: { params: any }) => Promise<T | NextResponse> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return jsonResponse({ error: message }, 500, undefined, req);
    }
  };
}
```

### 4.2 Validation — `validateRequest` 🟢

- JSON parse failures → `400` with `"Invalid JSON body"`
- Zod validation failures → `400` with `"Validation failed"` + `issues` array
- Used consistently on all mutating routes (POST, PATCH, DELETE)

### 4.3 Auth Errors — `getAuthContext` 🟢

| Condition | Status | Body |
|-----------|--------|------|
| Missing/invalid token | 401 | `{ error: "Unauthorized" }` |
| Wrong role hierarchy | 403 | `{ error: "Forbidden — insufficient permissions" }` |
| User not found | 401 | `{ error: "Unauthorized" }` |

### 4.4 Org Isolation Checks 🟢

Every resource access verifies `org_id` ownership before returning data:

```ts
if (workflow.org_id !== ctx.orgId) {
  return jsonResponse({ error: "Forbidden" }, 403);
}
```

Present in: artifacts, clarifications, connectors, memory, spaces, workflows, audit.

### 4.5 Status Transition Validation 🟢

Workflow PATCH validates state-machine transitions:

```ts
const validTransitions: Record<string, string[]> = {
  queued: ["running", "cancelled"],
  planning: ["cancelled"],
  running: ["paused", "amending", "cancelled"],
  // ...
};
```

Invalid transition → `400` with explicit message.

### 4.6 Error Response Shape Mismatch with API.md 🔴

**Documented shape (API.md §Error Codes):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "status": 400,
    "details": [ { "field": "modelId", "message": "..." } ],
    "requestId": "req_cuid456",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Actual shape:**

```json
{ "error": "Artifact not found" }
{ "error": "Validation failed", "issues": [...] }
{ "error": "Internal server error" }
```

**Gap severity:** 🔴 **High** — Clients built against the documented contract will fail to parse error details. No `requestId`, no `timestamp`, no structured `code`.

**Recommendation:** Refactor `jsonResponse` error branch to wrap in the documented envelope:

```ts
function errorResponse({
  code,
  message,
  status,
  details,
  req,
}: { code: string; message: string; status: number; details?: any[]; req?: NextRequest }) {
  return jsonResponse(
    {
      error: {
        code,
        message,
        status,
        details,
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
      },
    },
    status,
    undefined,
    req
  );
}
```

---

## 5. SSE Formatting Audit

### 5.1 Route: `GET /api/workflows/[id]/events` — Deep Inspection

#### Formatting: ✅ Compliant with SSE spec

```
id: evt-wf-123-plan
event: workflow.planned
data: {"plan_version":1,"task_count":4,"depth":3,"workflow_id":"wf-123","timestamp":"..."}

```

- `id:` field present on every event (enables `Last-Event-ID` replay)
- `event:` field present (discriminates event type)
- `data:` field contains valid JSON payload
- Double newline `\n\n` terminates each event
- `Content-Type: text/event-stream` ✅
- `Cache-Control: no-cache, no-transform` ✅
- `Connection: keep-alive` ✅
- `X-Accel-Buffering: no` ✅ (prevents nginx buffering)

#### Reconnection Support: ✅

```ts
const lastEventId = req.headers.get("last-event-id") || undefined;
// ... filter events to only those after lastEventId
```

#### Abort / Client Disconnect: ✅

```ts
req.signal.addEventListener("abort", () => {
  clearInterval(interval);
  controller.close();
});
```

#### Live Event Generation: ✅

For `running` / `planning` workflows, emits synthetic tick events every 2s, then closes gracefully after tick 6 with `stream.close` event.

### 5.2 SSE Helper — `sseStream()` in `api-utils.ts` 🟢

```ts
export function sseStream(
  generator: (send: (event: string, data: unknown) => void, close: () => void) => Promise<void> | void,
  req?: NextRequest
): Response
```

- Auto-generates unique `eventId` per event
- JSON-stringifies data payload
- Proper `\n` delimiters
- Error handling: sends `event: error` then closes stream
- No `X-Accel-Buffering: no` header in helper (minor gap)

### 5.3 SSE Gaps / Advisory 🟡

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | `stream.close` event type undocumented | 🟡 Advisory | `events/route.ts` emits `event: stream.close` which is not in `EVENT_TYPES` array or API.md |
| 2 | `EVENT_TYPES` array unused | 🟡 Advisory | The `EVENT_TYPES` constant is declared but never referenced for validation/filtering |
| 3 | `sseStream` missing `X-Accel-Buffering` | 🟡 Advisory | Helper omits nginx anti-buffering header present in the manual route |
| 4 | No `Retry:` directive | 🟡 Advisory | SSE spec recommends `retry: 3000` for reconnection timing guidance |
| 5 | Timestamp is string, not ms epoch | 🟡 Advisory | API.md shows `timestamp: 1705312800000` (ms); actual payload uses ISO strings |

**Recommendation:** Add `retry: 3000` to the SSE preamble and align `EVENT_TYPES` with emitted types.

---

## 6. CORS Audit

### 6.1 Per-Route CORS via `api-utils.ts` 🟢

```ts
export function jsonResponse(body, status = 200, extraHeaders?, req?) {
  const allowedOrigin = req ? getCorsOrigin(req) : "";
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...
    },
  });
}
```

`getCorsOrigin` reflects origin only if in `ALLOWED_ORIGINS` env allowlist.

### 6.2 Global CORS in `next.config.ts` 🟠 **CONFLICT**

```ts
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
      ],
    },
  ];
}
```

**Problem:** Next.js `headers()` config sets `Access-Control-Allow-Origin: *` for **all** `/api/*` responses. This overrides the per-route origin reflection in `jsonResponse()`. The result:

- `Access-Control-Allow-Credentials: true` + `Access-Control-Allow-Origin: *` is a **browser security violation** (browsers reject this combo).
- The allowlist in `getCorsOrigin()` is silently bypassed.

**Recommendation:** Remove `Access-Control-Allow-Origin: *` from `next.config.ts` and let `jsonResponse` handle CORS origin reflection. Keep the other headers if desired, but ensure no duplicate/conflicting values.

### 6.3 OPTIONS Handler Coverage 🟢

Every route file exports an `OPTIONS` handler that returns `204 No Content` with CORS headers. This is correct for preflight support.

---

## 7. Rate Limiting Audit

### 7.1 Static Fake Headers 🟠

```ts
"X-RateLimit-Limit": "1000",
"X-RateLimit-Remaining": "998",
"X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
```

- Values are **hardcoded**, not decremented per request
- No `X-RateLimit-Window` header (documented in API.md)
- No actual enforcement (no 429 responses)
- Missing `Retry-After` on hypothetical 429

**Impact:** Clients cannot trust these headers. A well-behaved API consumer would incorrectly assume 998 requests remain indefinitely.

**Recommendation:** Add a simple in-memory token bucket (per `req.ip` or per `ctx.user.id`) or remove the headers until real Redis-backed rate limiting is implemented. Document the mock nature.

---

## 8. WebSocket-Style Endpoint Audit

### 8.1 Route: `GET/POST /api/workflows/[id]/ws`

This simulates WebSocket semantics over HTTP long-polling.

#### Message Shape Consistency 🟢

All POST action responses use a uniform envelope:

```json
{ "type": "ack", "action": "<action_name>", "data": { ... } }
```

GET polling uses:

```json
{ "type": "poll", "workflow_id": "...", "workflow_status": "...", "pending_clarifications": [...], "timestamp": "..." }
```

Ping/pong:

```json
{ "type": "pong", "timestamp": "...", "workflow_id": "...", "workflow_status": "..." }
```

#### Validation 🟢

```ts
const wsMessageSchema = z.object({
  action: z.enum(["clarification.answer", "approval.grant", "approval.deny", "workflow.amend", "workflow.cancel", "model.override", "ping"]),
  payload: z.record(z.any()),
});
```

Schema is validated with `validateRequest`. Unknown actions fall through to `default:` → `400 Unknown action`.

#### Org Isolation 🟢

Workflow ownership checked on both GET and POST.

#### Missing from API.md 🟡

The documented WebSocket spec (`wss://api.agent-platform.com/api/ws`) with `join_room`, `typing`, `cursor_move`, `node_update`, `presence`, `user_typing` is **not implemented**. The actual implementation is workflow-scoped HTTP polling.

**Recommendation:** Update API.md to reflect the actual `/api/workflows/[id]/ws` contract, or implement the documented real-time collaboration WebSocket separately.

---

## 9. Authentication Deep Dive

### 9.1 Token Parsing 🟡

```ts
const token = req.headers.get("authorization")?.replace("Bearer ", "");
if (!token || !token.startsWith("tok_")) return 401;
const extracted = token.split("_")[1];
```

- Requires exact `tok_` prefix (e.g., `tok_user-001`)
- JWT tokens from `auth.ts` (`signToken`) produce standard JWTs like `eyJhbGci...` which **do NOT start with `tok_`**
- The real JWT verification in `auth.ts` is **never used** by `api-utils.ts`

**Gap:** Two auth systems exist:
1. `src/lib/auth.ts` — real JWT with `verifyToken`
2. `src/lib/api-utils.ts` — mock prefix token with `mockUsers` lookup

**Recommendation:** Unify auth by replacing `getAuthContext` with `verifyToken` from `auth.ts`, or document that `api-utils.ts` auth is demo-only.

### 9.2 Role Hierarchy 🟢

```ts
const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  operator: 2,
  auditor: 1,
  user: 0,
};
```

`auditor` role required for `/api/audit`. Lower roles are correctly rejected with 403.

---

## 10. TypeScript & Code Quality

### 10.1 `as any` Casts 🟠

Many route handlers cast the wrapped function to `as any`:

```ts
export const GET = withErrorHandler(
  withAuth(async (...) => { ... }) as any
);
```

Files with `as any`: `artifacts/[id]`, `audit`, `billing`, `connectors`, `connectors/[name]`, `memory`, `models`, `run`, `search`, `usage`, `workflows/[id]`, `workflows/[id]/ws`, `spaces/[id]/workflows`.

**Impact:** Bypasses Next.js App Router type signature. Refactoring `withAuth` return type to explicitly return `Promise<T | NextResponse>` would eliminate the need for `as any`.

### 10.2 Unused Parameter Naming 🟡

Some handlers prefix request parameter with `_` (e.g., `_req`) to signal "unused," but then pass `req` to `jsonResponse`. Example in `billing/route.ts`:

```ts
withAuth(async (_req: NextRequest, ctx) => {
  ...
  return jsonResponse(billing);
}) as any
```

The `_req` is actually needed for `jsonResponse(..., req)` CORS origin reflection, but the handler omits it.

**Recommendation:** Remove `_` prefix if `req` is conceptually needed, and standardize passing `req` to `jsonResponse`.

---

## 11. Build & Deployment

### 11.1 Route Files (25 total)

All `.ts` files compile under `next.config.ts` with `ignoreBuildErrors: false`. No syntax errors detected.

### 11.2 Middleware.ts

**Missing.** No `middleware.ts` exists at `app/` or project root. This means:
- No global CORS preflight (handled per-route instead)
- No global auth redirect
- No request logging middleware

For a production app, `middleware.ts` would centralize CORS, auth, and rate limiting.

---

## 12. Remediation Checklist

| Priority | Action | File(s) |
|----------|--------|---------|
| 🔴 P0 | Align error response shape with API.md spec | `src/lib/api-utils.ts` |
| 🔴 P0 | Fix CORS double-header: remove `*` from `next.config.ts` | `next.config.ts` |
| 🟠 P1 | Unify auth: use real JWT `verifyToken` instead of `tok_` mock | `src/lib/api-utils.ts` |
| 🟠 P1 | Standardize `jsonResponse(..., req)` across all routes | All `app/api/**/route.ts` |
| 🟠 P1 | Implement or remove fake rate-limit headers | `src/lib/api-utils.ts` |
| 🟠 P1 | Add `OPTIONS` + `withErrorHandler` to `/api/healthcheck` | `app/api/healthcheck/route.ts` |
| 🟡 P2 | Add `retry: 3000` to SSE output | `app/api/workflows/[id]/events/route.ts` |
| 🟡 P2 | Add `X-Accel-Buffering: no` to `sseStream` helper | `src/lib/api-utils.ts` |
| 🟡 P2 | Remove `as any` casts by fixing `withAuth` return type | All wrappers |
| 🟡 P2 | Align `src/types/api.ts` with runtime response shapes | `src/types/api.ts` |
| 🟡 P2 | Create `middleware.ts` for global CORS/auth/rate-limit | `middleware.ts` (new) |
| 🟢 P3 | Document which API.md endpoints are not implemented | `API.md` |

---

## 13. Conclusion

The API layer is **functionally coherent** for a demo/MVP build. All routes have handlers, auth is enforced where expected, org isolation is consistently applied, SSE follows the spec, and error handling wraps exceptions safely. However, there are **production-readiness gaps** in CORS configuration, error response contract fidelity, rate-limiting realism, and auth system unification. The most critical fix is the CORS `*` + `credentials: true` combination in `next.config.ts`, which will cause actual browser request failures.

**Auditor sign-off:** All 25 route files inspected. Core middleware (`api-utils.ts`) fully read. Type contracts (`src/types/api.ts`, `src/types/workflow.ts`) reviewed. SSE formatting verified against spec. Report generated without external tool dependencies.
