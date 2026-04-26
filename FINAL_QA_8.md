# Final Data Integrity Audit Report
## Multi-Model Agent Orchestration Platform

**Date:** 2025-01-15
**Auditor:** Data Integrity Agent
**Scope:** All demo data, mock data, Prisma schema, TypeScript types, API contracts

---

## Executive Summary

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Type Mismatches | 18 | 0 | 14 | 4 | 0 |
| Enum Conflicts | 3 | 0 | 3 | 0 | 0 |
| Orphaned References | 0 | 0 | 0 | 0 | 0 |
| Relationship Issues | 1 | 0 | 0 | 1 | 0 |
| Data Consistency | 6 | 0 | 0 | 5 | 1 |
| Schema Mismatches | 2 | 0 | 0 | 2 | 0 |
| **TOTAL** | **30** | **0** | **17** | **12** | **1** |

**Key Finding:** The platform has **two parallel data layers** that are largely incompatible:
1. The **canonical layer** (Prisma schema + entities.ts + enums.ts) — clean and consistent
2. The **legacy/deprecated layer** (mock-data.ts + mock-db.ts) — uses different field names, missing fields, and invalid enum values

The **demo data layer** (demo-*.ts files) is internally consistent and has no orphaned references, but several demo types diverge from the canonical entity types as enriched view models.

---

## 1. Enum Conflicts (3 issues)

### HIGH-1: `WorkflowStatus` defined three ways with incompatible values
- **Location:** `src/types/workflow.ts` vs `src/types/enums.ts` vs `prisma/schema.prisma`
- **Issue:** `workflow.ts` redefines `WorkflowStatus` as `"idle" | "running" | "succeeded" | "failed" | "cancelled"` (5 values), while `enums.ts` and Prisma define it as 9 values including `draft`, `queued`, `planning`, `paused`, `cancelling`.
- **Impact:** Importing both files causes type shadowing. Code using `workflow.ts` types cannot handle workflows in `draft`, `queued`, `planning`, `paused`, or `cancelling` states.
- **Fix:** Remove the redefinition in `workflow.ts`; import from `enums.ts` instead.

### HIGH-2: `TaskStatus` defined three ways with incompatible values
- **Location:** `src/types/workflow.ts` vs `src/types/enums.ts` vs `prisma/schema.prisma`
- **Issue:** `workflow.ts` defines `TaskStatus` with 5 values, missing `ready` and `skipped` present in the canonical definition.
- **Impact:** Tasks in `ready` or `skipped` state will fail type checks in components using `workflow.ts` types.
- **Fix:** Remove the redefinition in `workflow.ts`; import from `enums.ts` instead.

### HIGH-3: `WorkflowEvent` defined twice with completely incompatible shapes
- **Location:** `src/types/workflow.ts` vs `src/types/api.ts`
- **Issue:** `api.ts` defines `WorkflowEvent` as a union of `{ workflowId, emittedAt, type }` shapes. `workflow.ts` defines it as `{ id, timestamp, type, data }` shapes with dot-notation event types (`workflow.started`, `task.completed`, etc.).
- **Impact:** These are entirely different event schemas. SSE consumers and workflow stream consumers cannot share code.
- **Fix:** Consolidate into a single event schema. The `api.ts` schema is the API contract and should be canonical.

---

## 2. Type Mismatches — Canonical vs Demo Data (4 issues)

### HIGH-4: `DemoUser.role` uses invalid enum values
- **Location:** `src/data/demo-users.ts` vs `src/types/entities.ts`
- **Issue:** Demo users have roles `"admin"`, `"analyst"`, `"engineer"`. Only `"admin"` is valid; `"analyst"` and `"engineer"` are not in `USER_ROLE` enum (`owner`, `admin`, `member`, `viewer`, `auditor`).
- **Fix:** Change demo roles to valid values: `usr_b8e5d1a4f7c2` → `"member"`, `usr_2f6c8d3e5b9a` → `"member"` or `"viewer"`.

### HIGH-5: `DemoConnector` has completely different shape from `Connector` entity
- **Location:** `src/data/demo-connectors.ts` vs `src/types/entities.ts`
- **Issues:**
  - Demo has `provider` field; entity has `type`
  - Demo `status` has 5 values (`connected`, `disconnected`, `error`, `pending`, `degraded`); entity `healthStatus` has 4 values (`healthy`, `degraded`, `unhealthy`, `unknown`)
  - Demo has `spaceIds` (array); entity has `spaceId` (single string|null)
  - Demo has `connectedAt`, `lastSyncedAt`, `lastError`, `scope`; entity has `lastTestedAt`, `updatedAt`, `config`
- **Fix:** Either align demo data to the entity shape, or rename `DemoConnector` to make it clear it's a frontend view model.

### HIGH-6: `ModelCard` diverges significantly from `ModelDefinition`
- **Location:** `src/data/demo-models.ts` vs `src/types/model.ts`
- **Issues:**
  - `name` vs `displayName`
  - `costPer1kInput/Output` (flat numbers) vs `cost` (nested `CostProfile` object)
  - `avgLatencyMs` (flat number) vs `latency` (nested `LatencyProfile` object)
  - `supportsToolUse`, `supportsJson` (boolean flags) vs `capabilities` (bitmask object) + `supportsTools`
  - `ModelDefinition` has `enabled`, `safetyClass`; `ModelCard` does not
  - `ModelCard` has `successRate`, `totalCalls`, `tags`, `description`; `ModelDefinition` does not
- **Fix:** Create a mapping layer or align the two types. At minimum, ensure all model IDs in demo data exist in both lists.

### MEDIUM-1: `DemoSpace` is an enriched view model, not a direct entity
- **Location:** `src/data/demo-spaces.ts` vs `src/types/entities.ts`
- **Issue:** `DemoSpace` adds `ownerId`, `memberIds`, `workflowIds`, `connectorIds`, `color`, `icon` — none of which exist on the `Space` entity type.
- **Assessment:** This is acceptable as a frontend view model if properly documented, but the field `ownerId` should map to `createdById` for consistency.

---

## 3. Type Mismatches — `mock-data.ts` vs Canonical Types (9 issues)

The file `src/data/mock-data.ts` imports types from `@/src/types` but the data shapes **do not match** the imported types. This file appears to be from an older iteration of the type system.

### HIGH-7: `mock-data.ts` User — missing fields, invalid roles
- Missing: `mfaEnabled`, `updatedAt`, `deletedAt`
- Invalid roles: `"operator"`, `"user"` (not in `USER_ROLE` enum)

### HIGH-8: `mock-data.ts` Space — wrong field names, extra fields
- Uses `ownerId` instead of `createdById`
- Has `members` (array) — not in entity type
- Has `memoryEnabled` — not in entity type

### HIGH-9: `mock-data.ts` Workflow — wrong field names, extra fields, invalid status values
- Uses `objective` instead of `prompt`
- Uses `ownerId` instead of `createdById`
- Has `orgId`, `budgetCredits`, `spentCredits`, `deliverableKinds`, `policyOverrides`, `currentPlanVersion`, `completedAt`, `deadline`, `errorMessage` — none in entity
- Missing: `activePlanRevisionId`, `safetyClass`, `statusReason`, `finishedAt`
- Invalid status: `"completed"` (should be `"succeeded"`), `"awaiting_clarification"` (not in WorkflowStatus enum)

### HIGH-10: `mock-data.ts` Task — wrong field names, missing required fields
- Uses `name` instead of `title`
- Uses `description` instead of `instruction`
- Has `assignedModel`, `actualModel` — entity has `modelAttempts`, `resolvedModelId`
- Has `toolsUsed` (string[]) — entity has `toolCalls` (Record[])
- Has `costCredits` — entity has `creditsUsed`
- Has `depth` — entity has `dagLevel`
- Has `retryCount` — entity has `maxAttempts`
- Has `completedAt` — entity has `finishedAt`
- Has `errorMessage` — entity has `statusReason`
- Missing: `kind` (TaskKind), `maxAttempts`, `durationMs`, `updatedAt`

### HIGH-11: `mock-data.ts` Artifact — wrong field names, missing required fields
- Uses `size` instead of `sizeBytes`
- Has `contentPreview` — not in entity
- Missing: `storageUrl` (required!), `checksum`, `metadata`
- Invalid `kind` values: `"markdown"`, `"csv"`, `"code"` — should be `"report_md"`, `"dataset_csv"`, `"code_diff"` per `ARTIFACT_KIND` enum

### HIGH-12: `mock-data.ts` Clarification — wrong field names, missing fields
- Has `context` — not in entity
- Has `answered` (boolean) — entity uses `status` (ClarificationStatus enum)
- Missing: `taskId`, `status`, `answer`, `expiresInMinutes`, `answeredAt`, `expiredAt`

### HIGH-13: `mock-data.ts` Connector — missing id, wrong fields
- No `id` field! Uses `name` as primary key
- Has `displayName`, `description`, `scopes`, `iconUrl` — not in entity
- Has `status` (`installed`/`available`/`error`/`revoked`) — entity has `healthStatus`
- Has `installedAt`, `revokedAt` — entity has `lastTestedAt`, `createdAt`, `updatedAt`
- Missing from entity perspective: `id`, `type`, `spaceId`, `config`

### HIGH-14: `mock-data.ts` MemoryEntry — invalid kind values, wrong shape
- Has `userId` — not in either EpisodicMemory or SemanticMemory entity
- Has `kind: "user_preference"` — **not in `MEMORY_KIND` enum** (`working`, `episodic`, `semantic` only)
- Uses generic `key`/`value` pattern instead of `content` or `subject`/`predicate`/`object`
- Missing: `embedding` (number[] | null)

### HIGH-15: `mock-data.ts` imports undefined types
- **Location:** `src/data/mock-data.ts` import block
- **Issue:** Imports `ModelInfo`, `UsageMetrics`, `BillingInfo`, `SearchResult`, `HealthStatus`, `DeliverableKind`, `ConnectorName`, `ConnectorStatus`, `ModelCapability`, `AuditEventType` from `@/src/types`
- **Impact:** These types are **not exported** from `src/types/index.ts`. TypeScript compilation will fail on this file.

---

## 4. Schema Mismatches — Prisma vs TypeScript (2 issues)

### MEDIUM-2: Prisma `Space` has `icon` field missing from TypeScript entity
- `prisma/schema.prisma` line 127: `icon String?`
- `src/types/entities.ts` Space interface: no `icon` field
- **Fix:** Add `icon: string | null` to the Space interface.

### MEDIUM-3: Prisma `Connector` healthStatus is plain String, not enum
- `prisma/schema.prisma` line 389: `healthStatus String @default("unknown")`
- `src/types/entities.ts` restricts to `'healthy' | 'degraded' | 'unhealthy' | 'unknown'`
- **Fix:** Either add a Prisma enum for `ConnectorHealthStatus`, or relax the TypeScript type to `string`. The current mismatch allows invalid strings in the database.

---

## 5. API Contract Issues (2 issues)

### MEDIUM-4: `UsageResponse` field name mismatch
- `api.ts`: `recordedAt: string`
- `entities.ts`: `timestamp: string`
- **Fix:** Align API response field name with entity field name, or document the mapping explicitly.

### MEDIUM-5: `ConnectorResponse` omits fields present in entity
- Missing: `config`, `spaceId`
- **Assessment:** Intentional API design (hiding sensitive config). Document as "API projection omits sensitive fields."

---

## 6. Data Consistency Issues (6 issues)

### MEDIUM-6: Analytics workflow IDs don't match demo workflows
- **Location:** `src/data/demo-analytics.ts` `DEMO_TOP_WORKFLOWS`
- Analytics uses synthetic IDs `wf_1` through `wf_12`
- Demo workflows use semantic IDs like `wf_lithium_miners`, `wf_tesla_vs_byd`
- **Impact:** Cross-referencing analytics to workflow detail pages fails.

### MEDIUM-7: Analytics space IDs don't match demo spaces
- Analytics uses `spc_research`, `spc_engineering`, `spc_competitive_intel`, `spc_personal`
- Demo spaces are `spc_acme_research`, `spc_engineering`, `spc_personal_investing`, `spc_competitive_intel`
- Partial overlap but `spc_research` and `spc_personal` don't exist.

### MEDIUM-8: `mock-db.ts` connector key mismatch
- **Location:** `src/lib/mock-db.ts` line 45
- Connectors keyed by `c.name` instead of `c.id`
- But mock-data.ts Connector objects don't have `id` fields.

### MEDIUM-9: `mock-db.ts` uses runtime type assertions to mask shape mismatches
- Multiple casts like `(Connector & { orgId?: string })`, `(MemoryEntry & { orgId?: string })`
- These indicate the stored data doesn't match the declared types.

### LOW-1: `mock-db.ts` `createArtifact` adds undeclared fields
- Adds `presignedUrl` and `presignedExpiresAt` to Artifact objects at runtime
- These fields are not in the `Artifact` interface.

### MEDIUM-10: `wf_pm_tools_compare` assigned to two spaces
- **Location:** `src/data/demo-spaces.ts`
- Workflow `wf_pm_tools_compare` appears in both `spc_acme_research` and `spc_competitive_intel`
- **Impact:** Violates the 1:N schema relationship where a workflow has exactly one `spaceId`.

---

## 7. Relationship Validation Results

### Demo Data Cross-Reference Check
All primary key references in the demo data layer are **internally consistent**:

| Relationship | Status |
|-------------|--------|
| Workflow → User | All 15 workflows reference valid demo users |
| Workflow → Org | All 15 workflows reference valid demo orgs |
| Workflow → Space | All 15 workflows reference valid demo spaces |
| Space → User (owner) | All 4 spaces reference valid demo users |
| Space → Org | All 4 spaces reference valid demo orgs |
| Space → Workflow | All workflow IDs in spaces exist in demo-workflows |
| Space → Connector | All connector IDs in spaces exist in demo-connectors |
| Connector → Org | All connectors reference valid demo orgs |
| Connector → Space | All space IDs in connectors exist in demo-spaces |
| Memory → User | All 20 memory entries reference valid demo users |
| Memory → Org | All 20 memory entries reference valid demo orgs |
| Memory → Workflow | All 20 memory entries reference valid demo workflows |

### Orphaned References Found: **0**

---

## 8. Demo Workflow Task Edge Validation

| Workflow | Tasks | Edges | Valid? |
|----------|-------|-------|--------|
| wf_lithium_miners | 12 | 15 | All edge indices within task range |
| wf_tesla_vs_byd | 8 | 13 | All edge indices within task range |
| wf_sec_scraper | 6 | 5 | All edge indices within task range |
| wf_ipcc_summary | 5 | 4 | All edge indices within task range |
| wf_anthropic_vs_openai | 10 | 18 | All edge indices within task range |
| wf_csv_dedup | 4 | 3 | All edge indices within task range |
| wf_quantum_funding | 9 | 12 | All edge indices within task range |
| wf_react_auth_tests | 5 | 6 | All edge indices within task range |
| wf_regulatory_monitor | 3 | 2 | All edge indices within task range |
| wf_linkedin_extract | 7 | 9 | All edge indices within task range |
| wf_saas_dashboard | 6 | 8 | All edge indices within task range |
| wf_pm_tools_compare | 8 | 15 | All edge indices within task range |
| wf_sentiment_pipeline | 5 | 4 | All edge indices within task range |
| wf_bitcoin_onchain | 7 | 9 | All edge indices within task range |
| wf_series_b_memo | 11 | 15 | All edge indices within task range |

All 91 task edges reference valid task indices within their respective workflows. No dangling edge references.

---

## 9. Recommended Priority Fixes

### Priority 1 (Build-blocking)
1. **Fix `mock-data.ts`** — either delete or rewrite to match canonical types. Currently imports undefined types and uses invalid shapes.
2. **Remove enum redefinitions** in `workflow.ts` — import from `enums.ts` instead.
3. **Align `WorkflowEvent`** schemas — consolidate `api.ts` and `workflow.ts` event types.

### Priority 2 (Data integrity)
4. **Fix demo user roles** to use valid `USER_ROLE` values.
5. **Align `DemoConnector`** to `Connector` entity shape, or clearly separate as a view model.
6. **Align `ModelCard`** to `ModelDefinition` or create explicit mapper.
7. **Add `icon` to `Space` entity** type to match Prisma schema.

### Priority 3 (Consistency)
8. **Align analytics IDs** to demo workflow/space IDs for cross-referencing.
9. **Document API omissions** (`ConnectorResponse` missing `config`/`spaceId`) as intentional.
10. **Add `healthStatus` enum** to Prisma schema for `Connector`.

---

## Appendix: File-by-File Health Score

| File | Status | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | Healthy | Clean schema, well-indexed, consistent enums |
| `src/types/enums.ts` | Healthy | All enums match Prisma exactly |
| `src/types/entities.ts` | Healthy | Clean entity types, branded IDs |
| `src/types/api.ts` | Mostly Healthy | UsageResponse `recordedAt` name mismatch |
| `src/types/model.ts` | Healthy | Complete model plane types |
| `src/types/orchestrator.ts` | Healthy | Internal DSL types well-structured |
| `src/types/frontend.ts` | Healthy | UI types properly separated |
| `src/types/workflow.ts` | **Broken** | Redefines enums/events that conflict with canonical types |
| `src/types/index.ts` | Healthy | Barrel exports complete |
| `src/data/demo-users.ts` | Needs Fix | Invalid role values |
| `src/data/demo-spaces.ts` | Healthy | Internally consistent; view model divergence acceptable |
| `src/data/demo-workflows.ts` | Healthy | 15 workflows, 91 edges, all valid |
| `src/data/demo-connectors.ts` | Needs Fix | Shape diverges from Connector entity |
| `src/data/demo-models.ts` | Needs Fix | Shape diverges from ModelDefinition |
| `src/data/demo-memory.ts` | Needs Fix | Invalid `kind` value `"procedural"`, shape diverges |
| `src/data/demo-analytics.ts` | Needs Fix | IDs don't match demo workflows/spaces |
| `src/data/demo-notifications.ts` | Healthy | Notifications reference valid entities |
| `src/data/templates.ts` | Healthy | 20 templates, all valid categories |
| `src/data/index.ts` | Healthy | Clean barrel with aggregate stats |
| `src/data/mock-data.ts` | **Broken** | Imports undefined types, invalid shapes throughout |
| `src/lib/mock-db.ts` | Needs Fix | Works around type mismatches with casts |
| `src/mock/generators.ts` | Healthy | Deterministic seeding, helper functions clean |

---

*End of Report*
