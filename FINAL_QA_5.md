# Final Security Audit Report — Multi-Model Agent Platform

**Auditor:** Security Auditor  
**Scope:** `/mnt/agents/output/multi-model-agent-platform`  
**Date:** 2025-04-26  
**Checks:** Auth coverage, CORS config, secrets in client code, input validation, XSS/CSRF, injection risks

---

## Executive Summary

| Category | Status | Critical Issues | High Issues | Medium Issues | Low Issues |
|----------|--------|-----------------|-------------|---------------|------------|
| API Auth | ⚠️ Partial | 0 | 1 | 1 | 0 |
| CORS | ❌ Fail | 1 | 1 | 0 | 0 |
| Client Secrets | ✅ Pass | 0 | 0 | 0 | 0 |
| Input Validation | ⚠️ Partial | 0 | 0 | 2 | 0 |
| XSS / Rendering | ✅ Pass | 0 | 0 | 0 | 0 |
| CSRF | ❌ Fail | 0 | 0 | 0 | 1 |
| **Overall** | **⚠️ Needs Remediation** | **1** | **2** | **2** | **1** |

---

## 1. API Route Authentication

### 1.1 Auth Coverage Matrix

| Route | Method(s) | `withAuth` | Org Isolation | Role Gate | Status |
|-------|-----------|------------|---------------|-----------|--------|
| `/api/artifacts` | GET | ✅ | ✅ | — | ✅ |
| `/api/artifacts/[id]` | GET | ✅ | ✅ | — | ✅ |
| `/api/audit` | GET | ✅ | ✅ | `auditor` | ✅ |
| `/api/billing` | GET | ✅ | ✅ | — | ✅ |
| `/api/clarifications` | GET | ✅ | ✅ | — | ✅ |
| `/api/clarifications/[id]` | GET | ✅ | ✅ | — | ✅ |
| `/api/clarifications/[id]/answer` | POST | ✅ | ✅ | — | ✅ |
| `/api/connectors` | GET, POST | ✅ | ✅ | — | ✅ |
| `/api/connectors/[name]` | GET, DELETE | ✅ | ✅ | — | ✅ |
| `/api/health` | GET | ❌ (public) | N/A | N/A | ✅ Expected |
| `/api/healthcheck` | GET | ❌ (public) | N/A | N/A | ✅ Expected |
| `/api/memory` | GET, DELETE | ✅ | ✅ | — | ✅ |
| `/api/models` | GET | ✅ | — | — | ✅ |
| `/api/run` | POST | ✅ | ✅ | — | ✅ |
| `/api/search` | POST | ✅ | — | — | ✅ |
| `/api/spaces` | GET, POST | ✅ | ✅ | — | ✅ |
| `/api/spaces/[id]` | GET, PATCH, DELETE | ✅ | ✅ | — | ✅ |
| `/api/spaces/[id]/workflows` | GET | ✅ | ✅ | — | ✅ |
| `/api/usage` | GET | ✅ | ✅ | — | ✅ |
| `/api/workflows` | GET, POST | ✅ | ✅ | — | ✅ |
| `/api/workflows/[id]` | GET, PATCH, DELETE | ✅ | ✅ | — | ✅ |
| `/api/workflows/[id]/artifacts` | GET | ✅ | ✅ | — | ✅ |
| `/api/workflows/[id]/events` | GET (SSE) | ✅ | ✅ | — | ✅ |
| `/api/workflows/[id]/ws` | GET, POST | ✅ | ✅ | — | ✅ |

**Result:** All non-public API routes are wrapped with `withAuth`. Org isolation checks are present on resource-level routes. Role-based access is enforced for `/api/audit` (`auditor` role required).

### 1.2 Auth Mechanism Analysis

The auth system uses a **mock token scheme** (`tok_{userId}`) in `src/lib/api-utils.ts`:

```ts
const token = req.headers.get("authorization")?.replace("Bearer ", "");
if (!token || !token.startsWith("tok_")) {
  return jsonResponse({ error: "Unauthorized" }, 401);
}
```

**Findings:**
- **HIGH:** The client-side React components (hooks) make `fetch()` calls **without any `Authorization` header**. Every client fetch only sets `Content-Type: application/json`. This means the UI cannot actually authenticate against its own API in the current wiring. Either the auth middleware is bypassed in development, or the app is non-functional from an auth perspective. **This is a significant architectural gap.**
- `EventSource` (for SSE at `/api/workflows/[id]/events`) also cannot send custom headers natively, meaning SSE would fail auth checks in a real deployment.
- There is **no middleware.ts** to enforce auth globally or inject headers.
- The `src/lib/auth.ts` file (JWT + bcrypt) exists but is **not wired into any API route** — it is dead code relative to the `app/api` handlers.

**Severity: HIGH** — Auth guards exist on the server, but the client does not send credentials, breaking end-to-end security.

---

## 2. CORS Configuration

### 2.1 `next.config.ts` — Critical Misconfiguration

```ts
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },   // ❌ CRITICAL
        { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
      ],
    },
  ];
}
```

**CRITICAL:** `Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` is a **CORS spec violation** and allows **any malicious website** to make authenticated cross-origin requests to the API if the user has a session cookie.

**Severity: CRITICAL**

### 2.2 SSE Stream CORS Bypass

In `/api/workflows/[id]/events/route.ts` (line 248–256):

```ts
return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",   // ❌ HIGH
    "X-Accel-Buffering": "no",
  },
});
```

The SSE endpoint **hardcodes** `Access-Control-Allow-Origin: *`, completely bypassing the `getCorsOrigin()` allowlist function used elsewhere.

**Severity: HIGH**

### 2.3 `getCorsOrigin()` Logic

In `src/lib/api-utils.ts`:

```ts
export function getCorsOrigin(req: NextRequest): string {
  const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,https://localhost:3000").split(",").map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  if (allowed.includes(origin)) return origin;
  return allowed[0] || "";
}
```

The fallback logic returns `allowed[0]` for non-matching origins rather than rejecting the request. This is permissive but not critical. The real problem is the `next.config.ts` and SSE headers overriding this logic entirely.

---

## 3. Secrets in Client Code

### 3.1 Scan Results

- **No hardcoded API keys** found in any `src/components/**` or client-side `src/hooks/**` files.
- **No `NEXT_PUBLIC_*` env vars** exposing secrets to the browser bundle.
- **No AWS, OpenAI, or database credentials** in client code.
- `.env.example` contains placeholder values (`sk-your-openai-key`, `your-secret-key-here-change-in-production`).
- `.env.production` contains **only `<PLACEHOLDER>` values** — no real secrets committed.

### 3.2 JWT Secret Weakness

`src/lib/auth.ts`:
```ts
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
```

**MEDIUM:** A weak fallback secret is present in source code. If the app is deployed without setting `JWT_SECRET`, tokens can be forged with the known string `dev-secret-change-me`.

Also `.env.example` ships with `NEXTAUTH_SECRET="your-secret-key-here-change-in-production"` which could be copy-pasted into production.

**Severity: MEDIUM**

---

## 4. Input Validation

### 4.1 Zod Schema Coverage

| Route | Schema | Coverage | Status |
|-------|--------|----------|--------|
| POST `/api/workflows` | `createWorkflowSchema` | Extensive (objective, space_id, budget, deadline, deliverables, policy_overrides, context) | ✅ |
| POST `/api/run` | `runSchema` | prompt, model, tools, workflow_id, max_tokens, temperature | ✅ |
| POST `/api/search` | `searchSchema` | query, limit, recency_days | ✅ |
| POST `/api/clarifications/[id]/answer` | `answerSchema` | answer (1–5000 chars) | ✅ |
| POST `/api/connectors` | `installConnectorSchema` | name enum (10 values) | ✅ |
| POST `/api/spaces` | `createSpaceSchema` | name, description, memory_enabled, members | ✅ |
| PATCH `/api/spaces/[id]` | `patchSpaceSchema` | name, description, memory_enabled, members | ✅ |
| PATCH `/api/workflows/[id]` | `patchWorkflowSchema` | objective, status, budget, deadline, policy_overrides | ✅ |
| DELETE `/api/memory` | `deleteMemorySchema` | id | ✅ |
| POST `/api/workflows/[id]/ws` | `wsMessageSchema` | action enum, payload `z.record(z.any())` | ⚠️ Partial |

### 4.2 Validation Gaps

**MEDIUM — Permissive WS Payload:**

```ts
const wsMessageSchema = z.object({
  action: z.enum([...]),
  payload: z.record(z.any()),   // ❌ accepts ANY nested object
});
```

In `/api/workflows/[id]/ws/route.ts`, the `workflow.amend` action directly concatenates `objective_patch` into the workflow objective without further validation or sanitization:

```ts
objective: objective_patch
  ? `${workflow.objective} [amended: ${objective_patch}]`
  : workflow.objective,
```

While this is stored in memory (not SQL), and React would escape it on render, the lack of length/type validation on `payload` fields means:
- Extremely large strings could be injected (DoS on mock DB)
- Nested objects could overwrite `policy_overrides` unexpectedly

**Severity: MEDIUM**

**MEDIUM — Query Param Parsing:**

```ts
export function parseQueryParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
```

Query parameters are passed as raw strings to downstream functions. No length limits or type enforcement on query strings. `safeParseInt` handles pagination params but other params (e.g., `workflow_id`, `kind`) are used directly without validation.

**Severity: MEDIUM** (mitigated by mock DB lookups returning undefined for bad IDs)

---

## 5. XSS & HTML Rendering Safety

### 5.1 `dangerouslySetInnerHTML` Usages

| File | Line | Context | Sanitized? |
|------|------|---------|------------|
| `SearchResultItem.tsx` | 95, 104 | `highlightedTitle`, `highlightedSubtitle` | ✅ Yes — `highlightMatches()` calls `escapeHtml()` before injecting `<mark>` tags |
| `DiffViewer.tsx` | 656, 708 | Diff line content | ✅ Yes — `escapeHtml()` is called on all tokens before `<ins>` / `<del>` wrapping |
| `LiveActivityRail.tsx` | 274 | CSS `@keyframes` | ✅ Yes — static string, no user input |

**Result:** All `dangerouslySetInnerHTML` usages are properly escaped. No XSS vectors found.

### 5.2 User-Generated Content Rendering

Clarification answers, workflow objectives, search results, and artifact names are all rendered through standard React JSX (which auto-escapes). No raw HTML injection paths identified.

---

## 6. CSRF Protection

**Finding:** No CSRF tokens, `SameSite` cookie policies, or `X-CSRF-Token` header validation found anywhere in the codebase.

- `next.config.ts` lists `X-CSRF-Token` in allowed headers but never validates it.
- No `<meta name="csrf-token">` tags.
- No CSRF middleware.
- All state-changing endpoints (POST, PATCH, DELETE) rely solely on the `Authorization` header, which is immune to simple CSRF if properly implemented. However, if cookie-based auth is added later without CSRF protection, the CORS misconfiguration (`*` + credentials) makes CSRF attacks trivial.

**Severity: LOW** (current mock auth uses Bearer tokens which are CSRF-immune, but future cookie-based auth would be at risk)

---

## 7. Injection Risks

### 7.1 SQL / NoSQL Injection

The app uses an **in-memory mock DB** (`Map` objects). No SQL queries are constructed. No injection risk exists in the current implementation.

### 7.2 Command Injection

No `exec`, `spawn`, or shell command execution found.

### 7.3 Path Traversal

No file system read/write operations found in API routes.

---

## 8. Other Security Observations

### 8.1 Fake Rate Limiting

```ts
"X-RateLimit-Limit": "1000",
"X-RateLimit-Remaining": "998",
"X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
```

These headers are **hardcoded** in `jsonResponse()`. No actual rate limiting logic exists. The API is vulnerable to brute-force and enumeration attacks.

**Severity: LOW**

### 8.2 Presigned URL Generation

In `/api/artifacts/[id]/route.ts`:
```ts
const presignedUrl = `https://mock-cdn.example.com/${artifact.id}/${encodeURIComponent(artifact.name)}?token=${Date.now().toString(36)}&expires=${Date.now() + 3600 * 1000}`;
```

`encodeURIComponent(artifact.name)` is used correctly. No URL injection risk.

### 8.3 Audit Logging

Most mutating operations (create, update, delete, install, revoke) create audit events via `db.createAuditEvent()`. This is good practice.

---

## 9. Remediation Checklist

### Critical
- [ ] **Fix CORS in `next.config.ts`**: Remove `Access-Control-Allow-Origin: *` when `Access-Control-Allow-Credentials: true` is set. Use the `getCorsOrigin()` allowlist instead.
- [ ] **Fix SSE CORS in `/api/workflows/[id]/events/route.ts`**: Replace hardcoded `*` with `getCorsOrigin(req)`.

### High
- [ ] **Wire client auth**: Add an `Authorization: Bearer <token>` header to all client `fetch()` calls, or implement a cookie/session-based auth system that the browser sends automatically.
- [ ] **Add middleware.ts**: Implement a global auth middleware or use Next.js middleware to enforce auth on `/api/*` routes.

### Medium
- [ ] **Remove JWT fallback secret**: Change `src/lib/auth.ts` to `process.env.JWT_SECRET!` and throw if missing in production.
- [ ] **Tighten WS payload schema**: Replace `z.record(z.any())` with explicit per-action schemas for `workflow.amend`, `model.override`, etc.
- [ ] **Add query param validation**: Validate `workflow_id`, `space_id`, and other query parameters with Zod before use.

### Low
- [ ] **Implement real rate limiting**: Use Redis or in-memory sliding window rate limiting instead of fake headers.
- [ ] **Add CSRF protection**: If transitioning to cookie-based auth, implement CSRF token validation.
- [ ] **Add `Content-Security-Policy` headers** in `next.config.ts`.

---

## 10. Conclusion

The Multi-Model Agent Platform has **solid route-level auth wrappers** and **good org isolation** on API endpoints, but suffers from:

1. A **critical CORS misconfiguration** that allows cross-origin credentialed requests from any domain.
2. A **broken auth pipeline** where the client does not send credentials that the server requires.
3. **Medium-severity validation gaps** in the WebSocket-style control endpoint.

**XSS is properly mitigated**, **no secrets leak in client bundles**, and **no injection vulnerabilities** exist in the mock DB layer. The codebase is architecturally sound but requires CORS fixes and auth wiring before production deployment.

**Overall Recommendation: BLOCK production deployment until CORS and auth wiring are fixed.**
