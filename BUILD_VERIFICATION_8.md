# Build Verification 8 — Final Security Audit Report

**Project:** Multi-Model Agent Platform  
**Auditor:** Security Auditor Agent  
**Date:** 2024-04-26  
**Scope:** Client-side secrets, auth guards, CORS, input sanitization, dangerous functions  

---

## Executive Summary

| Category | Status | Critical Issues | High Issues | Medium Issues | Low Issues |
|----------|--------|-----------------|-------------|---------------|------------|
| Secrets in Client Code | PASS | 0 | 0 | 0 | 0 |
| Auth Guards on Routes | PARTIAL | 0 | 1 | 1 | 0 |
| CORS Configuration | FAIL | 1 | 0 | 0 | 0 |
| Input Sanitization | PASS | 0 | 0 | 0 | 0 |
| Dangerous Functions | PASS | 0 | 0 | 0 | 0 |

**Overall:** 1 Critical, 2 High, 2 Medium, 0 Low issues found.

---

## Detailed Findings

### CRITICAL-001: CORS Misconfigured — `Access-Control-Allow-Origin: *` with Credentials Enabled

**Severity:** CRITICAL  
**File:** `next.config.ts` (lines 45–57)  
**Status:** FAIL

**Description:**  
The Next.js config sets `Access-Control-Allow-Origin: *` while simultaneously setting `Access-Control-Allow-Credentials: true`. This violates the CORS specification: browsers refuse to allow wildcard origins with credentials, but some legacy clients or misconfigured proxies may still process it. More importantly, this signals a broken security model where any origin is trusted to make authenticated requests.

**Code:**
```typescript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
        ...
      ],
    },
  ];
}
```

**Impact:**  
Any malicious website can make cross-origin authenticated requests to the API, bypassing same-origin policy protections.

**Recommendation:**  
Remove the static CORS headers from `next.config.ts`. The `api-utils.ts` already implements `getCorsOrigin()` which reflects only allow-listed origins from `ALLOWED_ORIGINS`. Rely on that utility exclusively.

---

### HIGH-001: Hardcoded JWT_SECRET Fallback

**Severity:** HIGH  
**File:** `src/lib/auth.ts` (line 12)  
**Status:** FAIL

**Description:**  
The JWT secret falls back to a hardcoded, predictable string `"dev-secret-change-me"` if the `JWT_SECRET` environment variable is not set.

**Code:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
```

**Impact:**  
In production deployments where the environment variable is forgotten, an attacker can forge JWT tokens and impersonate any user.

**Recommendation:**  
Remove the fallback. Throw an error at startup if `JWT_SECRET` is missing:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
```

---

### HIGH-002: Simulated Auth Instead of Real JWT Verification

**Severity:** HIGH  
**File:** `src/lib/api-utils.ts` (lines 28–62)  
**Status:** FAIL

**Description:**  
`getAuthContext()` does **not** use the `verifyToken()` function from `src/lib/auth.ts`. Instead it performs a trivial prefix check (`token.startsWith("tok_")`) and looks up the user in a hardcoded `mockUsers` array. The properly implemented JWT signing/verification utilities (`signToken`, `verifyToken`) exist but are never invoked by the API layer.

**Code:**
```typescript
export function getAuthContext(req: NextRequest, requiredRole?: UserRole): AuthContext | NextResponse {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !token.startsWith("tok_")) {
    return jsonResponse({ error: "Unauthorized" }, 401, undefined, req);
  }
  const extracted = token.split("_")[1];
  const userId = extracted;
  const user = mockUsers.find((u) => u.id === userId);
  ...
}
```

**Impact:**  
The authentication layer is completely bypassable. Any attacker can craft a token like `tok_anything` and gain access if the suffix matches a mock user ID. The JWT library and secret are effectively dead code.

**Recommendation:**  
Replace the mock auth logic with a real JWT verification call:
```typescript
const payload = verifyToken(token);
if (!payload) return jsonResponse({ error: "Unauthorized" }, 401, undefined, req);
// look up user by payload.sub
```

---

### MEDIUM-001: No Client-Side Auth Guards

**Severity:** MEDIUM  
**File:** All `app/**/page.tsx` files  
**Status:** PARTIAL

**Description:**  
None of the client-side pages implement auth guards. Unauthenticated users can fully browse the UI (home, library, settings, workflows, etc.). While API calls will fail with 401, the client experience is broken and sensitive UI surfaces are exposed.

**Impact:**  
Information leakage through UI; degraded user experience; potential for client-side-only feature flags to be inspected.

**Recommendation:**  
Add a server-side or client-side auth check in the root layout or a higher-order component that redirects unauthenticated users to a login page.

---

### MEDIUM-002: `dangerouslySetInnerHTML` Used Without DOMPurify

**Severity:** MEDIUM  
**Files:**
- `src/components/compare/DiffViewer.tsx` (lines 656, 708)
- `src/components/search/SearchResultItem.tsx` (lines 95, 104)

**Description:**  
`dangerouslySetInnerHTML` is used to render HTML diff highlights and search highlights. The content **is** escaped via custom `escapeHtml()` functions before insertion, and `<mark>`/`<ins>`/`<del>` tags are injected only by the trusted highlighting logic.

**Code (Search):**
```typescript
highlightedTitle: highlightMatches(item.title, match.indices, true) // escape=true
```

**Code (Diff):**
```typescript
escapeHtml(oldWords[i - 1]) // user content escaped
`<ins style="...">${escapeHtml(newWords[j - 1])}</ins>` // only style is trusted
```

**Impact:**  
Low immediate risk because escaping is performed. However, `dangerouslySetInnerHTML` is inherently fragile—future refactors could accidentally remove escaping. Defense in depth recommends using DOMPurify or React's native rendering.

**Recommendation:**  
Replace `dangerouslySetInnerHTML` with React fragments that render escaped text and wrap matched ranges in `<mark>` elements natively. If `dangerouslySetInnerHTML` must remain, add a DOMPurify pass as a final safety net.

---

## Positive Findings

### PASS-001: No Secrets in Client-Side Code

Client-side code does not contain hardcoded API keys, JWT secrets, database passwords, or other credentials. The only `process.env` access on the client is `process.env.NODE_ENV` in `ErrorBoundary.tsx`, which is safe.

### PASS-002: No `eval` or Dangerous Functions

No occurrences of:
- `eval()`
- `new Function()` / `Function()` constructor
- `setTimeout` / `setInterval` with string arguments
- `document.write()` / `document.writeln()`

### PASS-003: Input Validation Present on API Routes

All mutation routes use Zod schema validation via `validateRequest()`:
- `POST /api/workflows` — validated
- `POST /api/run` — validated
- `POST /api/search` — validated
- `POST /api/clarifications` — validated
- `PATCH /api/workflows/:id` — validated

### PASS-004: Auth Guards on All Sensitive API Routes

All API routes except health checks (`/api/health`, `/api/healthcheck`) are wrapped with `withAuth`. Confirmed across:
- `/api/workflows/*`
- `/api/spaces/*`
- `/api/artifacts/*`
- `/api/run`
- `/api/search`
- `/api/billing`
- `/api/usage`
- `/api/models`
- `/api/audit`
- `/api/memory`
- `/api/connectors/*`
- `/api/clarifications/*`

### PASS-005: No Raw SQL Injection Vectors

No `$queryRaw`, `$executeRaw`, or template-literal SQL strings found. The application uses an in-memory mock database (`MockDB` with `Map`s) and Prisma is imported but not used for raw queries.

---

## Missing Security Controls (Not Direct Failures)

| Control | Status | Notes |
|---------|--------|-------|
| CSRF Tokens | Not Implemented | Bearer-token auth makes CSRF unlikely, but no formal CSRF mitigation exists. |
| Rate Limiting | Not Implemented | Mock headers (`X-RateLimit-*`) are hardcoded; no actual rate limiting enforced. |
| Content Security Policy | Not Implemented | No CSP meta tag or response header found. |
| Secure Cookies | Not Applicable | App does not appear to use cookie-based auth yet. |
| HTTPS Enforcement | Partial | `next.config.ts` allows `http://localhost` in image patterns. Acceptable for dev. |

---

## Remediation Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | Fix CORS (`*` + credentials) | Small |
| P0 | Replace mock auth with real JWT verification | Medium |
| P1 | Remove hardcoded JWT_SECRET fallback | Small |
| P1 | Add client-side auth guards | Medium |
| P2 | Replace `dangerouslySetInnerHTML` with native React | Medium |
| P2 | Add CSP headers | Small |
| P3 | Implement real rate limiting | Medium |

---

## Files Examined

- `src/lib/auth.ts`
- `src/lib/api-utils.ts`
- `src/lib/mock-db.ts`
- `src/lib/db.ts`
- `src/lib/search-utils.ts`
- `next.config.ts`
- `.env.example`
- `package.json`
- All `app/api/**/route.ts` files
- Key client components: `DiffViewer.tsx`, `SearchResultItem.tsx`, `TaskRow.tsx`
- Client hooks: `useComposer.ts`, `useWorkflowRun.ts`, `useWebSocketControl.ts`
- Layout and page files: `layout.tsx`, `page.tsx`

---

*End of report.*
