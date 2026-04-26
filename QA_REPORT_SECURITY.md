# Security Audit Report — Multi-Model Agent Platform

**Scope:** API routes (`app/api/`) and frontend components (`src/components/`)  
**Date:** 2025-01-28  
**Auditor:** Security Audit Agent  
**Risk Model:** Critical / High / Medium / Low

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **Critical** | 3 |
| **High** | 4 |
| **Medium** | 8 |
| **Low** | 3 |
| **Total** | 18 |

The application is currently configured as a **simulated/demo system** with intentionally weak authentication and no real rate limiting. Three **Critical** issues exist: a hardcoded JWT secret fallback, a mock authentication system that can be trivially bypassed, and a dangerous CORS policy (`Allow-Credentials: true` + `Allow-Origin: *`). Several XSS vectors exist in markdown rendering and link href handling. No actual rate limiting is enforced despite deceptive headers claiming otherwise.

---

## Critical Issues

### C-1 — Hardcoded JWT Secret Fallback
- **File:** `src/lib/auth.ts`  
- **Line:** 10  
- **Description:** `JWT_SECRET` falls back to a predictable string (`"dev-secret-change-me"`) when the environment variable is absent. In production, if `JWT_SECRET` is not set, an attacker can forge valid JWTs because the signing key is publicly known (found in source code).  
- **Severity:** Critical  
- **Fix:** Remove the fallback entirely and throw at startup if `JWT_SECRET` is missing.

```ts
// BEFORE (vulnerable)
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

// AFTER (fixed)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
```

---

### C-2 — Trivial Authentication Bypass (Mock Auth)
- **File:** `src/lib/api-utils.ts`  
- **Lines:** 17–46  
- **Description:** `getAuthContext()` implements a simulated authentication scheme that does **no cryptographic verification**. It parses the `Authorization` header with a naive `replace("Bearer ", "")`, then if the token starts with `tok_`, extracts a user ID by splitting on `_`. There is no signature check, no expiration check, and no JWT verification. Worse, if the header is missing or malformed, the function defaults to `userId = "user-1"`, meaning **unauthenticated requests are treated as authenticated**.  
- **Severity:** Critical  
- **Fix:** Replace with real JWT verification using `verifyToken()` from `src/lib/auth.ts`, reject requests with missing/invalid tokens with HTTP 401, and remove the hardcoded default user.

```ts
// BEFORE (vulnerable)
let userId = "user-1";
if (token && token.startsWith("tok_")) {
  const extracted = token.split("_")[1];
  if (extracted) userId = extracted;
}

// AFTER (fixed)
import { verifyToken } from "./auth";
if (!token) return jsonResponse({ error: "Unauthorized" }, 401);
const decoded = verifyToken(token);
if (!decoded) return jsonResponse({ error: "Unauthorized" }, 401);
const user = mockUsers.find((u) => u.id === decoded.sub);
if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
```

---

### C-3 — Dangerous CORS Configuration (Credentials + Wildcard Origin)
- **File:** `next.config.ts`  
- **Lines:** 27–38  
- **Description:** The Next.js headers config sets `Access-Control-Allow-Origin: *` **and** `Access-Control-Allow-Credentials: true` on all `/api/:path*` routes. While modern browsers block credentialed requests with wildcard origins, this is a dangerous anti-pattern that can lead to CSRF or credential leakage on older/specialized clients or if the server-side CORS logic diverges from the browser. The `jsonResponse()` helper and SSE responses also redundantly emit `Access-Control-Allow-Origin: *`.  
- **Severity:** Critical  
- **Fix:** Remove `Access-Control-Allow-Credentials: true` from the wildcard-origin config, or replace the wildcard with an explicit allow-list of trusted origins. Ensure server-side `jsonResponse()` and `sseStream()` do not echo `*` when credentials are enabled.

```ts
// BEFORE (dangerous)
{ key: "Access-Control-Allow-Credentials", value: "true" },
{ key: "Access-Control-Allow-Origin", value: "*" },

// AFTER (fixed)
{ key: "Access-Control-Allow-Origin", value: "https://your-domain.com" },
// Only include Allow-Credentials if origin is NOT *
```

---

## High Issues

### H-1 — Permissive CORS on All API / SSE Responses
- **File:** `src/lib/api-utils.ts` and `app/api/workflows/[id]/events/route.ts`  
- **Lines:** `api-utils.ts` 78–90, 170–179; `events/route.ts` 245  
- **Description:** `jsonResponse()`, `corsPreflight()`, and the SSE stream all hard-code `Access-Control-Allow-Origin: *`. This allows any malicious website to call the API from the browser, increasing the attack surface for CSRF and data exfiltration (even if the auth is weak).  
- **Severity:** High  
- **Fix:** Read the allowed origin(s) from an environment variable (e.g., `CORS_ORIGIN`) and validate the `Origin` header against it before reflecting it.

---

### H-2 — Fake Rate-Limiting Headers (No Actual Enforcement)
- **File:** `src/lib/api-utils.ts`  
- **Lines:** 84–86  
- **Description:** Every JSON response includes `X-RateLimit-Limit: 1000`, `X-RateLimit-Remaining: 998`, and a static reset timestamp. These are purely cosmetic. There is **zero actual rate limiting** on any endpoint, opening the door to brute-force attacks, resource exhaustion, and denial of service.  
- **Severity:** High  
- **Fix:** Implement a real rate-limiting middleware using Redis / Upstash / in-memory store with per-IP and per-user buckets. Remove the fake headers.

```ts
// BEFORE (deceptive)
"X-RateLimit-Limit": "1000",
"X-RateLimit-Remaining": "998",

// AFTER (fixed)
// Implement with @upstash/ratelimit or similar
```

---

### H-3 — Missing Workflow Ownership Check in /api/run
- **File:** `app/api/run/route.ts`  
- **Lines:** 35–50  
- **Description:** The `POST /api/run` endpoint accepts an optional `workflow_id`. When provided, it creates a task record linked to that workflow **without verifying that the caller owns the workflow**. An attacker can link malicious sub-agent tasks to arbitrary workflows by guessing or enumerating workflow IDs.  
- **Severity:** High  
- **Fix:** Before creating the task, fetch the workflow and assert `workflow.org_id === ctx.orgId`.

```ts
if (workflow_id) {
  const wf = db.getWorkflow(workflow_id);
  if (!wf || wf.org_id !== ctx.orgId) {
    return jsonResponse({ error: "Workflow not found or access denied" }, 403);
  }
  db.createTask({ ... });
}
```

---

### H-4 — ReactMarkdown Renders Unsafe href (javascript: URLs)
- **File:** `src/components/workflow/AnswerTab.tsx`  
- **Lines:** 138–148  
- **Description:** The custom `a` component in `createMarkdownComponents` spreads `...props` directly onto an `<a>` tag without sanitizing the `href`. `ReactMarkdown` without `rehype-sanitize` does not strip `javascript:` URLs. A malicious synthesis response or user-supplied markdown containing `[click](javascript:alert(1))` will execute JavaScript in the user's browser.  
- **Severity:** High  
- **Fix:** Install and configure `rehype-sanitize` on the `ReactMarkdown` instances, and explicitly filter `href` in the custom `a` component.

```tsx
import rehypeSanitize from "rehype-sanitize";

// In createMarkdownComponents:
a({ children, href, ...props }: any) {
  const safeHref =
    typeof href === "string" &&
    (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("#"))
      ? href
      : "#";
  return (
    <a
      href={safeHref}
      className="..."
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}

// Also add rehypeSanitize to ReactMarkdown:
<ReactMarkdown rehypePlugins={[rehypeHighlight, rehypeSanitize]}>
```

---

## Medium Issues

### M-1 — Error Messages Leaked to Client
- **File:** `src/lib/api-utils.ts`  
- **Line:** 72  
- **Description:** `withErrorHandler` returns `error.message` directly in the JSON body. If an upstream database or library throws an exception containing connection strings, query details, or stack traces, this sensitive information is exposed to the client.  
- **Severity:** Medium  
- **Fix:** Return a generic message to the client and log the real error server-side.

```ts
return jsonResponse({ error: "Internal server error" }, 500);
```

---

### M-2 — SSE Event Injection via Unescaped User Input
- **File:** `app/api/workflows/[id]/events/route.ts`  
- **Lines:** 189, 198, 207, 216, 223  
- **Description:** SSE chunks are built with template-string concatenation: `` `id: ${event.id}\nevent: ${event.event}\ndata: ${payload}\n\n` ``. The live event ID embeds `params.id` directly: `` `evt-live-${params.id}-${tick}-${Date.now()}` ``. If `params.id` contains newline characters (`\n`) or carriage returns, an attacker can inject fake SSE events or terminate the stream prematurely. Although `params.id` comes from the URL path, Next.js may not fully sanitize control characters.  
- **Severity:** Medium  
- **Fix:** Sanitize/escape any value placed into SSE lines. Strip `\n`, `\r`, and null bytes. Better yet, encode `params.id` with `encodeURIComponent` or a base-64 safe representation before embedding.

```ts
function sanitizeSSE(val: string): string {
  return val.replace(/[\r\n\0]/g, "");
}
const eventId = `evt-live-${sanitizeSSE(params.id)}-${tick}-${Date.now()}`;
```

---

### M-3 — User Input Stored Without Sanitization (Clarification Answer)
- **File:** `app/api/workflows/[id]/ws/route.ts`  
- **Lines:** 47–68  
- **Description:** The `clarification.answer` action stores the `answer` payload field directly in the mock DB via `db.answerClarification()`. While this is later rendered in `<pre>` tags (which React escapes), if any future component switches to `dangerouslySetInnerHTML` or server-side rendering, this stored value becomes a stored XSS payload.  
- **Severity:** Medium  
- **Fix:** Apply an HTML-escape or DOMPurify pass before storing, or ensure all downstream renderers treat it as text only.

---

### M-4 — Workflow Amend Allows Unstructured Payload Mutation
- **File:** `app/api/workflows/[id]/ws/route.ts`  
- **Lines:** 103–111  
- **Description:** The `workflow.amend` action accepts `objective_patch` (concatenated into the objective string without escaping) and `policy_overrides` (spread with `as any`). The `z.record(z.any())` schema on line 28 allows any shape in `payload`. An attacker could send unexpected keys that overwrite internal workflow fields if the spread order changes or if downstream code relies on specific shapes.  
- **Severity:** Medium  
- **Fix:** Replace `z.record(z.any())` with strict per-action Zod schemas (e.g., `z.object({ objective_patch: z.string().max(2000).optional(), policy_overrides: z.record(z.string()).optional() })`). Escape `objective_patch` before concatenation.

---

### M-5 — Overly Permissive WebSocket Payload Schema
- **File:** `app/api/workflows/[id]/ws/route.ts`  
- **Line:** 28  
- **Description:** `payload: z.record(z.any())` accepts any key/value types. Combined with multiple `as any` casts inside the switch cases (lines 52, 105, 108, 141, 145), this disables both runtime and compile-time validation of nested fields.  
- **Severity:** Medium  
- **Fix:** Define per-action Zod discriminated unions instead of a single catch-all record.

---

### M-6 — No Rate Limiting on Search Endpoint
- **File:** `app/api/search/route.ts`  
- **Line:** 15  
- **Description:** No rate limiting allows attackers to spam the search API, causing unnecessary compute and potential data-scraping.  
- **Severity:** Medium  
- **Fix:** Apply the same real rate-limiting middleware recommended in **H-2**.

---

### M-7 — No Rate Limiting on Sub-Agent Run Endpoint
- **File:** `app/api/run/route.ts`  
- **Line:** 19  
- **Description:** The `POST /api/run` endpoint has no rate limiting. An attacker can submit arbitrarily large prompts (up to 10,000 chars) in rapid succession, leading to resource exhaustion or mock-DB bloat.  
- **Severity:** Medium  
- **Fix:** Apply per-user rate limiting (e.g., 10 requests/minute).

---

### M-8 — Unvalidated External URLs in ArtifactViewer
- **File:** `src/components/workflow/ArtifactViewer.tsx`  
- **Lines:** 248, 256  
- **Description:** `permalink` and `downloadUrl` are passed directly to `<a href={permalink}>` and `<a href={downloadUrl}>` without validating the URL scheme. If an attacker can manipulate these props to inject `javascript:alert(1)`, clicking the Open/Download buttons triggers XSS.  
- **Severity:** Medium  
- **Fix:** Validate URLs before rendering.

```tsx
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
```

---

## Low Issues

### L-1 — Hardcoded PII in Demo Data
- **File:** `src/components/console/WorkflowInspector.tsx`  
- **Lines:** 125–127  
- **Description:** Mock demo data contains a fake SSN pattern (`1234`) and a 10-digit account number (`9876543210`). Although synthetic, this trains the system to store and display PII-like patterns.  
- **Severity:** Low  
- **Fix:** Replace with obviously fake placeholders (e.g., `XXX-XX-XXXX`) or remove entirely.

---

### L-2 — Weak PII Redaction Regex
- **File:** `src/components/console/WorkflowInspector.tsx`  
- **Lines:** 449–453  
- **Description:** The redaction regex `/\d{3}-?\d{2}-?\d{4}/g` (SSN) and `/\d{10,}/g` (account numbers) are trivial and miss many real-world PII patterns (e.g., international phone numbers, email addresses, credit cards, TINs, passport numbers).  
- **Severity:** Low  
- **Fix:** Adopt a comprehensive PII detection library (e.g., `presidio` or `microsoft/presidio`) for production use.

---

### L-3 — Unvalidated traceLink href
- **File:** `src/components/console/WorkflowInspector.tsx`  
- **Line:** 599  
- **Description:** `span.traceLink` is used as an `href` without validation. In the current demo data it is a safe hash link, but if fed from an external API, a `javascript:` URL would execute.  
- **Severity:** Low  
- **Fix:** Apply the same `isSafeUrl` validation described in **M-8**.

---

## Positive Security Observations

1. **Zod Validation Present:** `/api/search`, `/api/run`, and `/api/workflows/[id]/ws` all use Zod schemas for body validation, which limits malformed inputs.
2. **Org-Based Authorization:** Workflow endpoints check `workflow.org_id !== ctx.orgId` before returning data, providing a basic multi-tenant boundary.
3. **No `eval()` or `dangerouslySetInnerHTML`:** None of the audited components use `eval`, `Function`, or React's `dangerouslySetInnerHTML`, which eliminates an entire class of XSS vectors.
4. **Abort Signal Handled:** The SSE route listens to `req.signal` and cleans up the interval on disconnect, preventing resource leaks.
5. **Image Wildcard in next.config.ts is Limited to HTTPS:** `remotePatterns` only matches `https` or `localhost`, reducing the SSRF surface compared to allowing `http` anywhere.

---

## Remediation Roadmap

| Priority | Action | Files |
|----------|--------|-------|
| **P0** | Replace mock auth with real JWT verification | `src/lib/api-utils.ts`, `src/lib/auth.ts` |
| **P0** | Remove hardcoded JWT secret fallback | `src/lib/auth.ts` |
| **P0** | Fix CORS to disallow `*` when credentials are enabled | `next.config.ts`, `src/lib/api-utils.ts` |
| **P1** | Implement real rate limiting | All API routes |
| **P1** | Add `rehype-sanitize` and validate `href` in markdown | `src/components/workflow/AnswerTab.tsx` |
| **P1** | Validate `workflow_id` ownership in `/api/run` | `app/api/run/route.ts` |
| **P2** | Sanitize SSE line values | `app/api/workflows/[id]/events/route.ts` |
| **P2** | Harden `workflow.amend` payload schema | `app/api/workflows/[id]/ws/route.ts` |
| **P2** | Validate `permalink`/`downloadUrl` hrefs | `src/components/workflow/ArtifactViewer.tsx` |
| **P2** | Redact error messages in API responses | `src/lib/api-utils.ts` |

---

*End of Report*
