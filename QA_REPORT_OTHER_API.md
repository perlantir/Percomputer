# API Quality Audit Report — Other API Routes
## Multi-Model Agent Orchestration Platform

**Audit Date:** 2025-01-13
**Auditor:** Backend API Quality Auditor
**Scope:** 18 API route files under `app/api/`

---

## Executive Summary

| Category | Count |
|---|---|
| Critical Issues | 5 |
| High Issues | 8 |
| Medium Issues | 12 |
| Low Issues | 5 |
| **Total** | **30** |

**Top-line findings:**
- **1 route lacks exception handling** (`/api/health`) — unhandled errors will crash or return non-JSON responses.
- **2 routes lack org-scoped isolation** (`/api/memory`, `/api/connectors`) — cross-tenant data leakage risk.
- **13+ routes use `as any` casts** on exported Next.js route handlers, defeating TypeScript compile-time safety.
- **CORS headers are overly permissive** (`Access-Control-Allow-Origin: *`) and unsafe if credentials are ever enabled.
- **Rate-limit headers are hardcoded** to static fake values (`998` remaining), misleading API consumers.
- **Mock auth fallback allows unauthenticated access** by defaulting to `user-1` when no token is provided.

---

## Critical Issues

### C-1: `/api/health/route.ts` — Missing `withErrorHandler`
- **File:** `app/api/health/route.ts`
- **Lines:** 8–15
- **Severity:** Critical
- **Description:** The `GET` handler is a raw async function without `withErrorHandler`. Any unhandled exception (e.g., `mockHealth` import failure, timestamp arithmetic error) will propagate as a non-JSON Next.js error page or a 500 with HTML body, violating API consistency. Additionally, the route is **not wrapped with `withAuth`**, making it publicly accessible (acceptable for health checks but should be an explicit documented decision).
- **Fix:** Wrap with `withErrorHandler`. If public health check is intentional, add an explicit comment and ensure error responses remain JSON.

```typescript
export const GET = withErrorHandler(async (_req: NextRequest) => { ... });
```

---

### C-2: `/api/memory/route.ts` — No Org Isolation on GET or DELETE
- **File:** `app/api/memory/route.ts`
- **Lines:** 21–40 (GET), 43–64 (DELETE)
- **Severity:** Critical
- **Description:** The GET endpoint filters memory entries by `kind`, `query`, `spaceId`, `userId`, and `workflowId`, but **never filters by `orgId`**. An attacker from `org-2` can enumerate memory entries from `org-1` by iterating `space_id` or `user_id` query parameters. The DELETE endpoint fetches a memory entry by ID and deletes it without verifying it belongs to the caller's org. `db.getMemory()` and `db.deleteMemory()` have no org-scoping logic.
- **Fix:** Add `orgId: ctx.orgId` to `db.listMemory()` and `db.getMemory()` calls. Update `MockDB` to enforce org filtering, or filter in the route after retrieval.

```typescript
// GET: add orgId filter
const { data, total } = db.listMemory({
  ...params,
  orgId: ctx.orgId,  // <-- missing
});

// DELETE: verify ownership
const entry = db.getMemory(id);
if (!entry) return jsonResponse({ error: "Memory entry not found" }, 404);
if (entry.org_id !== ctx.orgId) return jsonResponse({ error: "Forbidden" }, 403);
```

---

### C-3: `/api/connectors/route.ts` GET — No Org Isolation
- **File:** `app/api/connectors/route.ts`
- **Lines:** 31–36
- **Severity:** Critical
- **Description:** `db.listConnectors()` returns **all** connectors from the global Map without filtering by `orgId`. A user in one organisation can see connectors installed by another organisation. The `Connector` entity type has an `orgId` field (per `src/types/entities.ts`), but `listConnectors()` in `mock-db.ts` ignores it.
- **Fix:** Pass `orgId: ctx.orgId` to `db.listConnectors()` and update `MockDB.listConnectors` to accept and apply the filter.

---

### C-4: `src/lib/api-utils.ts` — CORS Wildcard with Credentials Header
- **File:** `src/lib/api-utils.ts`
- **Lines:** 81–84
- **Severity:** Critical
- **Description:** `jsonResponse` sets `Access-Control-Allow-Origin: *`. If the frontend ever sends cookies or `Authorization` credentials with `credentials: 'include'`, browsers will reject the response per the CORS spec (`*` cannot be used with credentials). This is a ticking time-bomb for authentication regressions.
- **Fix:** Dynamically reflect the request's `Origin` header when it matches an allow-list, or explicitly use `Access-Control-Allow-Origin: *` **only** when credentials are not in use. Add `Access-Control-Allow-Credentials: true` conditionally.

---

### C-5: `src/lib/api-utils.ts` — Fake Rate-Limit Headers
- **File:** `src/lib/api-utils.ts`
- **Lines:** 84–86
- **Severity:** Critical
- **Description:** Rate limit headers (`X-RateLimit-Limit: 1000`, `X-RateLimit-Remaining: 998`, `X-RateLimit-Reset`) are hardcoded to static values. API consumers may build retry logic based on these headers, leading to incorrect client behavior. The headers are lies — there is no actual rate limiting in the codebase.
- **Fix:** Either (a) remove the fake headers until real rate limiting is implemented, or (b) implement a real rate-limiting middleware (e.g., token bucket per API key) and emit accurate headers.

---

## High Issues

### H-1: Widespread `as any` Casts on Route Exports
- **Files:** 13 files across the audit scope
- **Severity:** High
- **Description:** The following routes cast their exported handler to `as any`, bypassing Next.js App Router type checking:
  - `artifacts/[id]/route.ts` line 30
  - `spaces/route.ts` lines 28, 48
  - `spaces/[id]/route.ts` lines 34, 52, 79
  - `spaces/[id]/workflows/route.ts` line 36
  - `connectors/route.ts` lines 35, 74
  - `connectors/[name]/route.ts` lines 16, 42
  - `memory/route.ts` lines 40, 64
  - `usage/route.ts` line 17
  - `audit/route.ts` line 31
  - `clarifications/[id]/answer/route.ts` line 47
  - `models/route.ts` line 24
  - `search/route.ts` line 38
  - `run/route.ts` line 63
  - `billing/route.ts` line 15
- **Root cause:** `withAuth` signature `(req: NextRequest, context: { params: any })` does not align with Next.js App Router's expected `({ params }: { params: Promise<any> })` or the legacy `{ params: any }` context shape, forcing developers to cast.
- **Fix:** Refactor `withAuth` to be fully typed:

```typescript
export function withAuth<T>(
  handler: (req: NextRequest, ctx: AuthContext, context: { params: Record<string, string> }) => Promise<T>,
  requiredRole?: UserRole
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<T | NextResponse>
```

Then remove all `as any` casts. For dynamic route segments, type `params` as `Promise<{ id: string }>` for Next.js 15+ or `{ params: { id: string } }` for Next.js 14.

---

### H-2: `parseInt` Without Validation on Pagination Params
- **Files:** `artifacts/route.ts`, `spaces/[id]/workflows/route.ts`, `audit/route.ts`, `memory/route.ts`, `clarifications/route.ts`
- **Severity:** High
- **Description:** Query parameters `limit` and `offset` are parsed with `parseInt(value, 10)` without checking for `NaN`. A request like `?limit=abc` produces `NaN`, which propagates to `Array.slice(NaN, NaN + NaN)` returning an empty array silently. This is a poor developer experience and can mask bugs.
- **Fix:** Create a `parsePositiveInt` utility that validates and falls back to defaults:

```typescript
function parsePositiveInt(value: string | undefined, defaultVal: number, maxVal?: number): number {
  const n = value ? parseInt(value, 10) : NaN;
  if (isNaN(n) || n < 0) return defaultVal;
  return maxVal ? Math.min(n, maxVal) : n;
}
```

Apply it in all routes that paginate.

---

### H-3: `/api/run/route.ts` — No Org Validation on Linked Workflow
- **File:** `app/api/run/route.ts`
- **Lines:** 35–51
- **Severity:** High
- **Description:** When `workflow_id` is provided, the route creates a task record linked to that workflow without verifying the workflow belongs to the caller's org. An attacker can pollute another org's workflow history by supplying arbitrary `workflow_id` values.
- **Fix:** Before creating the task, validate ownership:

```typescript
if (workflow_id) {
  const wf = db.getWorkflow(workflow_id);
  if (!wf || wf.org_id !== ctx.orgId) {
    return jsonResponse({ error: "Workflow not found or access denied" }, 404);
  }
  db.createTask({ ... });
}
```

---

### H-4: `/api/connectors/[name]/route.ts` GET — No Org Ownership Check
- **File:** `app/api/connectors/[name]/route.ts`
- **Lines:** 9–17
- **Severity:** High
- **Description:** The GET handler fetches a connector by name and returns it without checking `connector.org_id === ctx.orgId`. Cross-tenant connector enumeration is possible.
- **Fix:** Add org check:

```typescript
if (!connector || connector.org_id !== ctx.orgId) {
  return jsonResponse({ error: "Connector not found" }, 404);
}
```

---

### H-5: `/api/models/route.ts` — `capability` Query Param Unvalidated
- **File:** `app/api/models/route.ts`
- **Lines:** 19–21
- **Severity:** High
- **Description:** The `capability` query parameter is cast to `any` and passed directly to `Array.includes()`. While this won't crash, invalid capability values silently return no results instead of a `400 Bad Request` with a clear validation error.
- **Fix:** Validate against a known set of capabilities before filtering, or use a Zod schema for query params.

---

### H-6: `/api/search/route.ts` — No Credit Quota Enforcement
- **File:** `app/api/search/route.ts`
- **Lines:** 31–37
- **Severity:** High
- **Description:** The endpoint always returns `credits_used: 0.5` but never checks whether the org or user has sufficient quota, never deducts from a balance, and never rejects the request when the quota is exhausted.
- **Fix:** Implement a `checkAndDeductCredits(ctx.orgId, ctx.user.id, 0.5)` helper that returns `402 Payment Required` or `429` when quota is exhausted.

---

### H-7: `/api/usage/route.ts` — Returns Global Mock Data, Not User/Org Usage
- **File:** `app/api/usage/route.ts`
- **Lines:** 8–18
- **Severity:** High
- **Description:** Returns `mockUsage` (a static object shared across all requests) with only `user_id` and `org_id` overwritten. All other fields (token counts, cost, history) are identical for every caller. In a real system this leaks other users' data patterns or returns completely fabricated numbers.
- **Fix:** Replace with per-user/per-org aggregation from actual usage records, or clearly mark the endpoint as mock-only in the response.

---

### H-8: `/api/billing/route.ts` — Returns Global Mock Data, Not Org Billing
- **File:** `app/api/billing/route.ts`
- **Lines:** 8–16
- **Severity:** High
- **Description:** Returns `mockBilling` (static object) with only `org_id` overwritten. The billing data (plan, credits, invoices) is identical for every org. Cross-tenant data leakage risk if real billing data were plugged in.
- **Fix:** Query billing records by `orgId` from a real data store, or clearly mark as mock-only.

---

## Medium Issues

### M-1: `/api/artifacts/route.ts` — `NaN` Pagination
- **File:** `app/api/artifacts/route.ts`
- **Lines:** 31–33
- **Severity:** Medium
- **Description:** `limit` and `offset` parsed via `parseInt` without NaN guard. Same pattern as H-2 but scoped to this route.
- **Fix:** Use shared `parsePositiveInt` utility.

---

### M-2: `/api/clarifications/route.ts` — `NaN` Pagination
- **File:** `app/api/clarifications/route.ts`
- **Lines:** 32–34
- **Severity:** Medium
- **Description:** Same NaN issue for `limit` and `offset`.
- **Fix:** Use shared `parsePositiveInt` utility.

---

### M-3: `/api/spaces/route.ts` POST — `members` Not Validated
- **File:** `app/api/spaces/route.ts`
- **Lines:** 36
- **Severity:** Medium
- **Description:** The `members` array from the request body is spread into the new space without validating the strings are valid user IDs within the org. Invalid or malicious user IDs can be stored.
- **Fix:** Validate each member ID against `mockUsers` (or real user store) and ensure they belong to `ctx.orgId`.

---

### M-4: `/api/connectors/route.ts` POST — No Org Scoping on Install
- **File:** `app/api/connectors/route.ts`
- **Lines:** 44–57
- **Severity:** Medium
- **Description:** Connector is retrieved and installed without org check. `db.getConnector(name)` and `db.installConnector(name)` operate on a global namespace. In a multi-tenant system, connector names may collide across orgs.
- **Fix:** Store connectors with a composite key `(orgId, name)` or add `orgId` filtering to connector lookups.

---

### M-5: `/api/connectors/[name]/route.ts` DELETE — No Org Check on Revoke
- **File:** `app/api/connectors/[name]/route.ts`
- **Lines:** 19–42
- **Severity:** Medium
- **Description:** DELETE checks if connector exists and is installed, but never verifies `connector.org_id === ctx.orgId`. An attacker can revoke another org's connector.
- **Fix:** Add org ownership check before revocation.

---

### M-6: `api-utils.ts` — Mock Auth Falls Back to Default User
- **File:** `src/lib/api-utils.ts`
- **Lines:** 21–27
- **Severity:** Medium
- **Description:** `getAuthContext` defaults to `userId = "user-1"` when no valid `Bearer tok_*` header is present. This means requests without any `Authorization` header are authenticated as `user-1`. In a mock environment this is convenient but dangerous — it makes the API accidentally permissive and can hide auth bugs in client code.
- **Fix:** Return `401 Unauthorized` when no token is provided. Reserve the fallback for an explicit `X-Mock-User` debug header behind an environment guard.

---

### M-7: `api-utils.ts` — No Content-Type Validation in `validateRequest`
- **File:** `src/lib/api-utils.ts`
- **Lines:** 136–159
- **Severity:** Medium
- **Description:** `validateRequest` immediately calls `req.json()` without checking `Content-Type: application/json`. A client sending `text/plain` or `multipart/form-data` will receive `Invalid JSON body` (400), which is correct, but a more helpful error would distinguish format mismatch from malformed JSON.
- **Fix:** Check `req.headers.get("content-type")?.includes("application/json")` and return `415 Unsupported Media Type` if not.

---

### M-8: `/api/models/route.ts` — Static Data Should Be Cached
- **File:** `app/api/models/route.ts`
- **Lines:** 8–25
- **Description:** `mockModels` is static data. Every request re-filters and re-serializes it. No caching headers are emitted, forcing clients to re-fetch unnecessarily.
- **Fix:** Add `Cache-Control: public, max-age=3600` or `stale-while-revalidate` headers since model data changes infrequently.

---

### M-9: `/api/health/route.ts` — Should Have `no-store` Cache Header
- **File:** `app/api/health/route.ts`
- **Severity:** Medium
- **Description:** Health check responses are cached by default by some CDNs/proxies. The timestamp is dynamic, but downstream systems may cache a stale "healthy" response.
- **Fix:** Add `Cache-Control: no-store, no-cache, must-revalidate` headers.

---

### M-10: `/api/audit/route.ts` — No Admin Role Check Commented
- **File:** `app/api/audit/route.ts`
- **Lines:** 8–32
- **Severity:** Medium
- **Description:** Uses `withAuth(..., "auditor")` which is correct, but there is no explicit check that the `auditor` role in the token actually maps to the role hierarchy in `api-utils.ts`. The role hierarchy (`admin: 3, operator: 2, auditor: 1, user: 0`) does not include `owner` from the `UserRole` enum (`src/types/enums.ts`). An `owner` role user (highest privilege) would fail the `auditor` check because `owner` is missing from the hierarchy.
- **Fix:** Add `owner: 4` to the role hierarchy, or map `owner` → `admin` equivalence.

---

### M-11: `/api/spaces/[id]/route.ts` PATCH — `updated` Could Be `undefined`
- **File:** `app/api/spaces/[id]/route.ts`
- **Lines:** 50–51
- **Severity:** Medium
- **Description:** `db.updateSpace()` can return `undefined` if the space was deleted between the GET check and the update (TOCTOU race in a real DB). The route returns `jsonResponse(updated)` which would serialize `undefined` as an empty response body with status 200.
- **Fix:** Add a guard:

```typescript
const updated = db.updateSpace(params.id, validated.data);
if (!updated) return jsonResponse({ error: "Space not found" }, 404);
return jsonResponse(updated);
```

---

### M-12: `/api/clarifications/[id]/answer/route.ts` — `updated` Could Be `undefined`
- **File:** `app/api/clarifications/[id]/answer/route.ts`
- **Lines:** 33–46
- **Severity:** Medium
- **Description:** `db.answerClarification()` can return `undefined`. The route then calls `db.updateWorkflow()` and `db.createAuditEvent()` using `clarification.workflow_id` regardless. If the clarification was deleted after the initial `getClarification` check, the workflow update may operate on stale data.
- **Fix:** Guard the `updated` result before side effects:

```typescript
const updated = db.answerClarification(params.id, answer);
if (!updated) return jsonResponse({ error: "Clarification not found" }, 404);
```

---

## Low Issues

### L-1: `api-utils.ts` — Missing `Vary: Origin` Header
- **File:** `src/lib/api-utils.ts`
- **Lines:** 78–90
- **Severity:** Low
- **Description:** When serving CORS responses, the `Vary: Origin` header is missing. If a CDN or proxy caches a response with `Access-Control-Allow-Origin: *`, it may serve the same cached response to a different origin, which can cause issues when credentials are toggled.
- **Fix:** Add `Vary: Origin` to `jsonResponse` headers.

---

### L-2: `api-utils.ts` — CORS Preflight Missing `Max-Age`
- **File:** `src/lib/api-utils.ts`
- **Lines:** 170–179
- **Severity:** Low
- **Description:** The `OPTIONS` preflight response does not include `Access-Control-Max-Age`, forcing browsers to re-issue preflight requests for every cross-origin call.
- **Fix:** Add `Access-Control-Max-Age: 86400` (24h) to `corsPreflight()`.

---

### L-3: `api-utils.ts` — SSE Stream Missing `X-Accel-Buffering: no`
- **File:** `src/lib/api-utils.ts`
- **Lines:** 126–134
- **Severity:** Low
- **Description:** The `sseStream` helper does not include the `X-Accel-Buffering: no` header, which is required to disable buffering in Nginx and some AWS ALB configurations. Without it, SSE events may be batched and delayed.
- **Fix:** Add the header:

```typescript
headers: {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "Access-Control-Allow-Origin": "*",
  "X-Accel-Buffering": "no",
}
```

---

### L-4: Inconsistent Error Field Naming for Validation Errors
- **File:** `src/lib/api-utils.ts`
- **Lines:** 148–155
- **Severity:** Low
- **Description:** Zod validation failures return `{ error: "Validation failed", issues: [...] }` while most other routes return `{ error: "..." }`. Clients must handle two shapes. Additionally, some routes return `{ success: true, id: ... }` on DELETE (spaces, connectors) while others return the raw object.
- **Fix:** Standardize on a unified error envelope:

```typescript
{ error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }
```

---

### L-5: No Request ID / Trace ID in Responses
- **File:** `src/lib/api-utils.ts` (global)
- **Severity:** Low
- **Description:** No `X-Request-Id` or trace ID is generated or returned in headers. Debugging production issues across logs is difficult without correlation IDs.
- **Fix:** Generate a UUID at request entry and attach it as `X-Request-Id` to all responses and log statements.

---

## Route-by-Route Compliance Matrix

| Route | Typed | Validation | Auth | Org Scope | CORS OK | Error Handler | Cache OK |
|---|---|---|---|---|---|---|---|
| `GET /api/artifacts` | Yes* | Partial | Yes | Yes | Yes | Yes | No |
| `GET /api/artifacts/[id]` | Yes* | No | Yes | Yes | Yes | Yes | No |
| `GET /api/spaces` | Yes* | Yes (POST) | Yes | Yes | Yes | Yes | No |
| `GET/PATCH/DEL /api/spaces/[id]` | Yes* | Yes (PATCH) | Yes | Yes | Yes | Yes | No |
| `GET /api/spaces/[id]/workflows` | Yes* | Partial | Yes | Yes | Yes | Yes | No |
| `GET/POST /api/connectors` | Yes* | Yes (POST) | Yes | **No** | Yes | Yes | No |
| `GET/DEL /api/connectors/[name]` | Yes* | No | Yes | **No** | Yes | Yes | No |
| `GET/DEL /api/memory` | Yes* | Yes (DEL) | Yes | **No** | Yes | Yes | No |
| `GET /api/usage` | Yes* | N/A | Yes | Partial | Yes | Yes | No |
| `GET /api/audit` | Yes* | Partial | Yes (role) | Yes | Yes | Yes | No |
| `GET /api/clarifications` | Yes | Partial | Yes | Yes | Yes | Yes | No |
| `GET /api/clarifications/[id]` | Yes | No | Yes | Yes | Yes | Yes | No |
| `POST /api/clarifications/[id]/answer` | Yes* | Yes | Yes | Yes | Yes | Yes | No |
| `GET /api/models` | Yes* | Partial | Yes | N/A | Yes | Yes | No |
| `GET /api/health` | Yes | N/A | **No** | N/A | Yes | **No** | No |
| `POST /api/search` | Yes* | Yes | Yes | N/A | Yes | Yes | No |
| `POST /api/run` | Yes* | Yes | Yes | **Partial** | Yes | Yes | No |
| `GET /api/billing` | Yes* | N/A | Yes | Partial | Yes | Yes | No |

**Yes*** = Has `as any` cast defeating type safety.

---

## Recommendations (Prioritized)

1. **Immediate (Critical):**
   - Add `withErrorHandler` to `/api/health`.
   - Add `orgId` filtering to `/api/memory`, `/api/connectors`, and their sub-routes.
   - Fix CORS wildcard or explicitly document the no-credentials constraint.
   - Remove fake rate-limit headers or implement real rate limiting.

2. **Short-term (High):**
   - Remove all `as any` casts by fixing `withAuth` typing.
   - Add `parsePositiveInt` utility and apply across all paginated routes.
   - Validate `workflow_id` org ownership in `/api/run`.
   - Add org checks to connector GET/DELETE.
   - Validate query params (tier, capability) in `/api/models`.
   - Implement credit/quota enforcement in `/api/search`.

3. **Medium-term (Medium):**
   - Validate `members` array in space creation.
   - Close TOCTOU gaps in PATCH/DELETE routes with null guards.
   - Add `owner` to role hierarchy.
   - Add cache headers (`no-store` for health, `max-age` for models).
   - Make auth fallback explicit (no token → 401).
   - Add `Content-Type` validation in `validateRequest`.

4. **Nice-to-have (Low):**
   - Add `Vary: Origin` to CORS responses.
   - Add `Max-Age` to preflight.
   - Add `X-Accel-Buffering: no` to SSE.
   - Standardize error envelope shape.
   - Generate and return `X-Request-Id` headers.

---

## Appendix: Files Audited

1. `/mnt/agents/output/multi-model-agent-platform/app/api/artifacts/route.ts`
2. `/mnt/agents/output/multi-model-agent-platform/app/api/artifacts/[id]/route.ts`
3. `/mnt/agents/output/multi-model-agent-platform/app/api/spaces/route.ts`
4. `/mnt/agents/output/multi-model-agent-platform/app/api/spaces/[id]/route.ts`
5. `/mnt/agents/output/multi-model-agent-platform/app/api/spaces/[id]/workflows/route.ts`
6. `/mnt/agents/output/multi-model-agent-platform/app/api/connectors/route.ts`
7. `/mnt/agents/output/multi-model-agent-platform/app/api/connectors/[name]/route.ts`
8. `/mnt/agents/output/multi-model-agent-platform/app/api/memory/route.ts`
9. `/mnt/agents/output/multi-model-agent-platform/app/api/usage/route.ts`
10. `/mnt/agents/output/multi-model-agent-platform/app/api/audit/route.ts`
11. `/mnt/agents/output/multi-model-agent-platform/app/api/clarifications/route.ts`
12. `/mnt/agents/output/multi-model-agent-platform/app/api/clarifications/[id]/route.ts`
13. `/mnt/agents/output/multi-model-agent-platform/app/api/clarifications/[id]/answer/route.ts`
14. `/mnt/agents/output/multi-model-agent-platform/app/api/models/route.ts`
15. `/mnt/agents/output/multi-model-agent-platform/app/api/health/route.ts`
16. `/mnt/agents/output/multi-model-agent-platform/app/api/search/route.ts`
17. `/mnt/agents/output/multi-model-agent-platform/app/api/run/route.ts`
18. `/mnt/agents/output/multi-model-agent-platform/app/api/billing/route.ts`

Supporting files read:
- `/mnt/agents/output/multi-model-agent-platform/src/lib/api-utils.ts`
- `/mnt/agents/output/multi-model-agent-platform/src/lib/mock-db.ts`
- `/mnt/agents/output/multi-model-agent-platform/src/types/entities.ts`
- `/mnt/agents/output/multi-model-agent-platform/src/types/api.ts`
- `/mnt/agents/output/multi-model-agent-platform/src/types/enums.ts`
