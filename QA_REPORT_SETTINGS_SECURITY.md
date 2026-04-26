# Security & Privacy Audit Report — Settings, Spaces, Connectors

**Audit Date:** 2025-01-15  
**Scope:**  
- `app/settings/page.tsx`  
- `src/components/settings/ModelsTable.tsx`  
- `src/components/settings/BillingPanel.tsx`  
- `src/components/settings/MemoryPanel.tsx`  
- `app/spaces/[id]/page.tsx`  
- `src/components/spaces/SpaceSettingsTab.tsx`  
- `app/connectors/page.tsx`  
- `src/components/connectors/ConnectorDrawer.tsx`  
- `src/components/connectors/ConnectorTile.tsx`  

---

## Executive Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 3 | Cross-user data leakage (memory, connectors, spaces) |
| **HIGH** | 5 | Non-functional privacy controls, missing RBAC, missing auth checks |
| **MEDIUM** | 3 | Missing validation, missing audit logging, info disclosure in demo data |
| **LOW** | 3 | External avatar leakage, test card display, missing PII redaction |
| **INFO** | 2 | Non-functional data residency UI, non-functional save buttons |

---

## CRITICAL Issues

### C1. MemoryPanel leaks all users' memory entries across organizations
- **File:** `src/components/settings/MemoryPanel.tsx`  
- **Lines:** 12-16, 23-27, 29-38  
- **Description:** `fetchMemory()` resolves the entire `DEMO_MEMORY` array (20 entries belonging to 3 distinct users across 2 organizations). The component filters only by `search` text and local `revokedIds` — it never scopes by `userId` or `orgId`. A logged-in user can search and view every other user's memory content, including proprietary research notes, scraping techniques, and workflow patterns.  
- **Impact:** Complete loss of memory privacy; cross-tenant data leakage.  
- **Fix:** Fetch memory from an authenticated endpoint that returns `userId === currentUser.id` scoped data, or filter client-side against the authenticated user's ID as a defense-in-depth layer.  
```tsx
// Recommended filter addition
const currentUserId = useCurrentUser()?.id;
const filtered = (memoryEntries ?? [])
  .filter((m) => m.userId === currentUserId)   // ← add
  .filter((m) => {
    if (revokedIds.has(m.id)) return false;
    if (!search.trim()) return true;
    ...
  });
```

### C2. Connectors page exposes all organization connectors without scoping
- **File:** `app/connectors/page.tsx`  
- **Lines:** 39, 42-51, 63-88  
- **Description:** `DEMO_CONNECTORS` contains connectors for `org_acme_001` **and** `org_indie_002`. The page initializes state with the full array (`setConnectors(DEMO_CONNECTORS)`) and never filters by the current user's `orgId`. Any user can see connector names, scopes, sync status, last errors, and configuration objects for every organization. The `handleConnect` / `handleRevoke` callbacks also operate on the unscoped array.  
- **Impact:** Cross-tenant connector enumeration; potential for social-engineering or targeted abuse.  
- **Fix:** Scope the connector list server-side by `orgId`, or at minimum filter client-side:  
```tsx
const currentOrgId = useCurrentUser()?.orgId;
const scoped = DEMO_CONNECTORS.filter((c) => c.orgId === currentOrgId);
```

### C3. Space page lacks authentication / membership check
- **File:** `app/spaces/[id]/page.tsx`  
- **Lines:** 14-24, 27-28, 56-87  
- **Description:** `useSpaceQuery()` resolves the space purely by `id` param with zero authentication or membership verification. A user who is not a `memberId` and does not belong to the space's `orgId` can navigate directly to `/spaces/spc_acme_research` and view all tabs (workflows, memory, artifacts, settings). No 403/401 handling is present.  
- **Impact:** Unauthorized access to private spaces, workflows, and memory.  
- **Fix:** Gate the query with an auth check:  
```tsx
const { data: space, isError } = useSpaceQuery(spaceId, {
  enabled: !!currentUser,
});
// In queryFn:
if (!space.memberIds.includes(currentUser.id) && space.orgId !== currentUser.orgId) {
  throw new Error("Forbidden");
}
```

---

## HIGH Issues

### H1. Privacy toggles are non-functional and do not persist state
- **File:** `app/settings/page.tsx`  
- **Lines:** 247, 255, 263, 282, 290  
- **Description:** Every Switch in the Privacy tab uses `defaultChecked` instead of `checked` + `onCheckedChange`. This means toggling a switch updates the DOM but the value is never captured, saved to an API, or stored in React state. Users may believe they have enabled "Zero Data Retention" or disabled "Episodic Memory" when in fact nothing changes on the backend.  
- **Impact:** False privacy assurance; compliance violations (GDPR, CCPA) if shipped.  
- **Fix:** Convert all Switches to controlled components wired to React state and a backend mutation.  
```tsx
const [zdrEnabled, setZdrEnabled] = useState(false);
<Switch checked={zdrEnabled} onCheckedChange={setZdrEnabled} />
```

### H2. API key actions lack role-based access control
- **File:** `app/settings/page.tsx`  
- **Lines:** 381-444  
- **Description:** The `ApiKeysTab` is visible and functional for any user who navigates to `?tab=api`. There is no check that the current user has the `owner` or `admin` role required to view, copy, or regenerate API keys. The Copy, Refresh, and Trash buttons are rendered unconditionally.  
- **Impact:** A low-privilege `member` or compromised session could exfiltrate or revoke production API keys.  
- **Fix:** Gate the tab with an RBAC wrapper:  
```tsx
{currentUser.role === "owner" || currentUser.role === "admin" ? <ApiKeysTab /> : <Forbidden />}
```

### H3. Team member deletion has no confirmation, no RBAC, and no audit log
- **File:** `app/settings/page.tsx`  
- **Lines:** 519-522  
- **Description:** The trash icon button next to every team member fires immediately (the handler is not wired, but the UI intent is clear). There is no confirmation dialog, no role check (an `owner` can be removed by anyone), and no audit trail.  
- **Impact:** Accidental or malicious removal of organization owners; irrecoverable loss of admin access.  
- **Fix:** (1) Show a confirmation modal, (2) Block self-removal and owner removal for non-owners, (3) POST to an audit-logged API endpoint.  

### H4. Billing panel exposes org-level credit balance without auth gating
- **File:** `src/components/settings/BillingPanel.tsx`  
- **Lines:** 45-54  
- **Description:** `fetchBillingData()` returns a hard-coded balance (`48760`) and plan (`Pro`) without any parameterization by user or org. In a real implementation, the absence of a `orgId` query parameter or auth header means any user could request any org's billing data.  
- **Impact:** Financial data leakage across tenants.  
- **Fix:** Pass the current user's `orgId` to the billing API and validate server-side.  

### H5. Memory "revoke" is client-side only and not persisted
- **File:** `src/components/settings/MemoryPanel.tsx`  
- **Lines:** 57-77, 142-201  
- **Description:** The `bulkRevoke()` and `revokeOne()` functions only mutate local React state (`revokedIds`). No API call is made. On page reload, all "revoked" memory entries reappear. Users believe they have deleted sensitive memories when the data remains intact server-side.  
- **Impact:** Privacy violation; users cannot actually exercise their right to erasure.  
- **Fix:** Replace state mutation with a `useMutation` hook that calls `DELETE /api/memory/:id` and invalidates the `settings-memory` query key.  

---

## MEDIUM Issues

### M1. Team member invite flow has zero validation
- **File:** `app/settings/page.tsx`  
- **Lines:** 462-468, 532-548  
- **Description:** The "Invite Member" button opens no form in the audited code, but the intended flow (pending invitations card) contains no email validation regex, no duplicate-member check, no role assignment UI, and no rate limiting. If wired up as-is, it would accept arbitrary strings and spam invites.  
- **Impact:** Invite spam; enumeration of registered emails via error messages; privilege escalation if role parameter is tampered.  
- **Fix:** Implement server-side validation: RFC-5322 email regex, check for existing membership, restrict role assignment to <= inviter's role, rate-limit 5 invites/hour.  

### M2. No audit logging for any settings mutation
- **Files:** `app/settings/page.tsx`, `app/spaces/[id]/page.tsx`, `app/connectors/page.tsx`  
- **Lines:** Multiple  
- **Description:** Every mutation path — profile update, API key generation, team member removal, connector revoke/connect, space settings update — logs only to `console.log` (e.g., `page.tsx:51` in SpacePage) or has no logging at all. There is no structured audit log capturing **who** did **what** and **when**.  
- **Impact:** Impossible to detect account takeover, insider threats, or compliance breaches.  
- **Fix:** Integrate an audit-log service. Every mutating API call should record `{actorId, action, targetId, timestamp, ip, userAgent, before, after}`.  

### M3. Connector demo configs leak real-world asset names
- **File:** `src/data/demo-connectors.ts`  
- **Lines:** 72-73, 100, 114-115, 128  
- **Description:** The `config` objects contain specific repository names (`alexpatel/saas-dashboard`, `alexpatel/sec-scraper`), Salesforce objects, Snowflake warehouse/database names, and Notion database titles. While this is demo data, it establishes a pattern that could be copied into production configs, leading to information disclosure if the config object is ever rendered or logged.  
- **Impact:** Attackers can enumerate internal infrastructure names from connector configs.  
- **Fix:** In production, store connector configs server-side encrypted at rest (AES-256). Never return the full `config` object to the client; only return user-facing fields such as `status` and `scope`.  

---

## LOW Issues

### L1. External avatar service leaks user presence to third party
- **File:** `src/data/demo-users.ts`  
- **Lines:** 24, 41, 58  
- **Description:** `avatarUrl` points to `https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah` etc. Loading these avatars sends the user's browser IP, Referer header, and org context to an external service. If Dicebear logs requests, this creates a third-party data processor relationship that may violate GDPR/SCC requirements.  
- **Fix:** Self-host avatar generation or use initials-only fallbacks. Add `referrerPolicy="no-referrer"` to `<img>` tags if external avatars are retained.  

### L2. Billing panel displays well-known Stripe test card
- **File:** `src/components/settings/BillingPanel.tsx`  
- **Line:** 163  
- **Description:** The placeholder payment method shows "Card ending in 4242" — the universally known Stripe test card (`4242 4242 4242 4242`). This is not a live card, but displaying it in a production-facing UI may confuse users or imply test-mode operation.  
- **Fix:** In production, mask to "Card ending in ****" or the actual last-4 from a tokenized source such as Stripe's `PaymentMethod` object.  

### L3. Memory content has no PII redaction layer
- **File:** `src/components/settings/MemoryPanel.tsx`  
- **Line:** 174  
- **Description:** `entry.content` is rendered verbatim. The demo data is clean, but in production memory entries may contain user-generated text with emails, phone numbers, SSNs, or credit card numbers. There is no regex-based or ML-based PII redaction before display.  
- **Fix:** Apply a server-side redaction pipeline (e.g., Presidio, AWS Macie, or regex rules) before persisting memory. Alternatively, redact on read with a utility:  
```tsx
function redactPii(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_REDACTED]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]");
}
```

---

## INFO Issues

### I1. Data residency UI is non-functional
- **File:** `app/settings/page.tsx`  
- **Lines:** 202-229  
- **Description:** The Primary Region and Backup Region `<Select>` components use `defaultValue` only. Changing the region dropdown does not call an API, update React state, or show a save button. Users may believe their data residency preference is recorded when it is not.  
- **Fix:** Convert to controlled selects, add a "Save Residency" button, and POST to `/api/org/residency`.  

### I2. Profile save button is non-functional
- **File:** `app/settings/page.tsx`  
- **Lines:** 159-161  
- **Description:** The "Save Changes" button in `ProfileTab` has no `onClick` handler. All inputs use `defaultValue` instead of controlled state.  
- **Fix:** Wire to a `useMutation` that PATCHes `/api/users/me`.  

---

## Detailed Checklist Mapping

| # | Checklist Item | Status | Key Findings |
|---|----------------|--------|--------------|
| 1 | API keys displayed securely | **PASS** | Only prefixes shown (`sk_live_...7f3a`). Full keys never rendered. |
| 2 | Billing data handled securely | **PARTIAL** | Last-4 masking used, but balance is hard-coded and unauthenticated. |
| 3 | Memory entries scoped to user | **FAIL** | CRITICAL — all 20 demo memories from all users visible to everyone. |
| 4 | PII redacted in memory display | **FAIL** | No redaction utility or pipeline exists. |
| 5 | Connector OAuth tokens treated securely | **PASS** | No tokens exposed in UI; config objects should be server-side only. |
| 6 | Role-based access in settings | **FAIL** | No role checks on API keys tab, team deletion, or space editing. |
| 7 | Team member invites validated | **FAIL** | Invite UI has no validation, no rate limit, no duplicate check. |
| 8 | Data residency displayed correctly | **PARTIAL** | Regions are accurate, but UI is non-functional (defaultValue only). |
| 9 | Privacy toggles functional | **FAIL** | All Switches use `defaultChecked`; no state persistence or API wiring. |
| 10 | Impersonation audit logged | **FAIL** | No impersonation feature found, and no audit logging anywhere. |

---

## Recommendations Summary

1. **Add authentication gates** to every page and tab in scope (`/settings`, `/spaces/:id`, `/connectors`). Verify the current user's role and org membership before rendering sensitive data.
2. **Scope all data fetches** by `userId` / `orgId` on the server. Client-side filtering is defense-in-depth, not the primary control.
3. **Make all privacy toggles controlled** and persist them via authenticated API calls. Return the saved values on page load.
4. **Implement audit logging** for every mutating action: key generation, team changes, connector revoke, memory delete, privacy toggle changes.
5. **Encrypt connector configs at rest** and never return the full config blob to the client. Scope connectors by `orgId`.
6. **Add confirmation dialogs and RBAC checks** for destructive actions (team member removal, API key deletion, memory revocation).
7. **Introduce PII redaction** in the memory pipeline before storage and/or before display.
8. **Replace external avatar URLs** with self-hosted or generated initials to eliminate third-party data leakage.

---

*End of Report*
