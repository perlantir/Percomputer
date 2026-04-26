# Data Consistency Audit Report
## Multi-Model Agent Orchestration Platform

**Audit Date:** 2025-01-15  
**Auditor:** Data Integrity Auditor  
**Scope:** Prisma schema, TypeScript types, mock data generators, demo datasets  
**Files Audited:** 12 files across `prisma/`, `src/types/`, `src/data/`, `src/mock/`

---

## Executive Summary

| Checklist Item | Result | Severity |
|---|---|---|
| 1. Mock data matches TypeScript interfaces | **FAIL** | Critical |
| 2. TypeScript entities.ts matches Prisma schema | **FAIL** | Critical |
| 3. All required fields present in mock data | **FAIL** | High |
| 4. Enum values consistent across schema, types, data | **FAIL** | High |
| 5. ID formats consistent (UUID) | **FAIL** | Medium |
| 6. Dates properly formatted | **PASS** | — |
| 7. Relationships correctly wired | **MIXED** | High |
| 8. Task edges form valid DAGs (no cycles) | **PASS** | — |
| 9. Model definitions complete (19 models) | **MIXED** | Medium |
| 10. Search result data plausible | **PASS** | — |

**Overall Verdict:** The codebase has significant data integrity issues. The Prisma schema, TypeScript types, and demo data are largely **independent, incompatible implementations** rather than aligned layers of a single system. Mock data does not conform to either the Prisma schema or the entities.ts interfaces. Enum definitions diverge across all layers.

---

## Critical Issues

### 1. Prisma Schema / TypeScript Type Misalignment

**Severity: CRITICAL**

The Prisma schema defines only **8 models**, while `entities.ts` defines **16 interfaces**. More importantly, the fields within shared models diverge significantly. The two files describe fundamentally different data shapes for the same conceptual entities.

#### 1.1 User
- **File:** `prisma/schema.prisma` line 11, `src/types/entities.ts` line 78
- **Prisma fields:** `id, email, name, avatar, createdAt, updatedAt, workflows, spaces`
- **TypeScript fields:** `id, name, email, orgId, role, avatarUrl, mfaEnabled, createdAt, updatedAt, deletedAt`
- **Issue:** Prisma has `avatar` (string?), TypeScript has `avatarUrl` (string|null). TypeScript adds `orgId, role, mfaEnabled, deletedAt` which Prisma lacks. Prisma has relational arrays `workflows, spaces`; TypeScript has none.
- **Fix:** Align Prisma schema to include `orgId`, `role`, `avatarUrl`, `mfaEnabled`, `deletedAt`. Add `Org` model.

#### 1.2 Workflow
- **File:** `prisma/schema.prisma` line 23, `src/types/entities.ts` line 143
- **Prisma fields:** `id, name, description, status, nodes, edges, spaceId, userId, createdAt, updatedAt, user, artifacts, memories, events, usages`
- **TypeScript fields:** `id, prompt, status, spaceId, createdById, activePlanRevisionId, safetyClass, statusReason, startedAt, finishedAt, createdAt, updatedAt`
- **Issue:** Prisma has `name, description, nodes, edges, userId` as top-level string/JSON fields. TypeScript has `prompt` instead of `name`/`description`, `createdById` instead of `userId`, plus `safetyClass`, `statusReason`, `startedAt`, `finishedAt`, `activePlanRevisionId`. Prisma uses JSON arrays for `nodes`/`edges`; TypeScript expects separate `Task`/`TaskEdge` relations.
- **Fix:** Decide canonical shape. Either add `prompt`, `safetyClass`, `statusReason`, etc. to Prisma, or remove them from types. Add Task/TaskEdge models to Prisma.

#### 1.3 Space
- **File:** `prisma/schema.prisma` line 86, `src/types/entities.ts` line 122
- **Prisma fields:** `id, name, description, icon, userId, createdAt, updatedAt, user`
- **TypeScript fields:** `id, name, orgId, createdById, description, createdAt, updatedAt`
- **Issue:** Prisma has `userId` (single owner) and `icon`. TypeScript has `orgId, createdById` (no `icon`). Prisma lacks `orgId` entirely.
- **Fix:** Add `orgId` to Prisma Space. Rename `userId` to `createdById` or align TypeScript.

#### 1.4 Artifact
- **File:** `prisma/schema.prisma` line 45, `src/types/entities.ts` line 272
- **Prisma fields:** `id, workflowId, type, title, content, mimeType, createdAt, workflow`
- **TypeScript fields:** `id, name, kind, taskId, workflowId, storageUrl, sizeBytes, checksum, metadata, createdAt`
- **Issue:** Almost zero overlap. Prisma stores `title, content, mimeType` (inline text). TypeScript expects `name, kind, storageUrl, checksum, sizeBytes, metadata` with `taskId` reference.
- **Fix:** Complete redesign required. Choose whether artifacts are file references (TypeScript) or inline content blobs (Prisma).

#### 1.5 Connector
- **File:** `prisma/schema.prisma` line 75, `src/types/entities.ts` line 422
- **Prisma fields:** `id, name, type, config, status, lastUsedAt, createdAt, updatedAt`
- **TypeScript fields:** `id, name, type, orgId, spaceId, config, healthStatus, lastTestedAt, createdAt, updatedAt`
- **Issue:** Prisma has `status` (string) and `lastUsedAt`. TypeScript has `healthStatus` (union type), `orgId`, `spaceId`, `lastTestedAt`. No `orgId`/`spaceId` in Prisma means connectors are global, not scoped.
- **Fix:** Add `orgId`, `spaceId` to Prisma Connector. Rename `status` to `healthStatus` with enum.

#### 1.6 Memory
- **File:** `prisma/schema.prisma` line 60, `src/types/entities.ts` line 345/366
- **Prisma fields:** `id, workflowId, key, value, scope, createdAt, expiresAt, workflow`
- **TypeScript fields (EpisodicMemory):** `id, kind, orgId, spaceId, content, embedding, workflowId, context, createdAt`
- **TypeScript fields (SemanticMemory):** `id, kind, orgId, spaceId, subject, predicate, object, embedding, confidence, createdAt`
- **Issue:** Prisma models a simple key/value scoped store. TypeScript models a cognitive memory system with embeddings, episodic/semantic split, triples (subject/predicate/object), and org/space scoping.
- **Fix:** Split Prisma Memory into `EpisodicMemory` and `SemanticMemory` models, or add optional fields for both patterns.

#### 1.7 Usage
- **File:** `prisma/schema.prisma` line 113, `src/types/entities.ts` line 449
- **Prisma fields:** `id, workflowId, model, tokensIn, tokensOut, costUsd, latencyMs, timestamp, workflow`
- **TypeScript fields:** `id, orgId, workflowId, taskId, modelId, promptTokens, completionTokens, estimatedCostCents, recordedAt`
- **Issue:** Field names differ (`tokensIn` vs `promptTokens`, `costUsd` vs `estimatedCostCents`, `timestamp` vs `recordedAt`). TypeScript adds `orgId`, `taskId`. Prisma has `latencyMs` which TypeScript lacks.
- **Fix:** Align field names. Add `orgId`, `taskId` to Prisma.

#### 1.8 Missing Prisma Models
- **File:** `prisma/schema.prisma`
- **Missing:** `Org`, `Task`, `TaskEdge`, `TaskAttempt`, `PlanRevision`, `Clarification`, `AuditEvent`
- **Issue:** The Prisma schema implements only 8 of the 19 concepts defined across the system. Critical orchestration entities (Task, TaskEdge, TaskAttempt, PlanRevision) have no database representation.
- **Fix:** Add all missing models to Prisma schema, or remove unused interfaces from `entities.ts`.

---

### 2. Mock Data / TypeScript Interface Misalignment

**Severity: CRITICAL**

All demo data files define their **own local interfaces** rather than importing from `entities.ts`. None of the demo data objects conform to the canonical TypeScript types.

#### 2.1 demo-workflows.ts defines incompatible Task, TaskEdge, Workflow, PlanRevision
- **File:** `src/data/demo-workflows.ts` lines 24-88
- **Task mismatch:**
  - Demo has: `index, name, description, assignedModel, inputTokens, outputTokens, creditsUsed, durationMs, completedAt, dependencies, toolCalls, retryCount`
  - TypeScript expects: `title, instruction, kind, status, dagLevel, modelAttempts, resolvedModelId, maxAttempts, statusReason, finishedAt, createdAt, updatedAt`
  - **Zero field names match** except `id, workflowId, status, kind, startedAt`
- **TaskEdge mismatch:**
  - Demo has: `{ from, to }` (2 fields)
  - TypeScript expects: `{ id, fromTaskId, toTaskId, workflowId, edgeType, dataMapping, condition, createdAt }` (8 fields)
  - **No overlap in field names** (Demo uses `from/to`, TypeScript uses `fromTaskId/toTaskId`)
- **Workflow mismatch:**
  - Demo has: `objective, budgetCredits, spentCredits, remainingCredits, taskCount, succeededTasks, failedTasks, pendingTasks, modelUsage, planRevisions`
  - TypeScript expects: `prompt, safetyClass, statusReason, startedAt, finishedAt, activePlanRevisionId, createdById`
  - **Only overlap:** `id, spaceId, status, createdAt, startedAt`
- **PlanRevision mismatch:**
  - Demo has: `version, createdAt, reason, addedTasks, removedTasks` (no `id`)
  - TypeScript expects: `id, workflowId, version, dagJson, plannedByModelId, createdAt`
- **Fix:** Make `demo-workflows.ts` import interfaces from `entities.ts` and refactor data to match.

#### 2.2 demo-users.ts defines DemoUser incompatible with entities.ts User
- **File:** `src/data/demo-users.ts` line 1, `src/types/entities.ts` line 78
- **DemoUser has:** `preferences` (object), `orgName` (string), `lastActiveAt` (string)
- **entities.ts User expects:** `mfaEnabled` (boolean), `updatedAt` (string), `deletedAt` (string|null)
- **Missing in demo:** `mfaEnabled`, `updatedAt`, `deletedAt`
- **Extra in demo:** `preferences`, `orgName`, `lastActiveAt`
- **Role enum conflict:** Demo uses `"admin"|"analyst"|"engineer"`; types expect `"owner"|"admin"|"member"|"viewer"|"auditor"`
- **Fix:** Import `User` from `entities.ts`. Add missing fields. Align role enum.

#### 2.3 demo-spaces.ts defines DemoSpace incompatible with entities.ts Space
- **File:** `src/data/demo-spaces.ts` line 1, `src/types/entities.ts` line 122
- **DemoSpace has:** `ownerId, memberIds, workflowIds, connectorIds, color, icon`
- **entities.ts Space expects:** `createdById` (not `ownerId`)
- **Missing in demo:** No field-level issues beyond naming, but demo adds denormalized arrays (`memberIds, workflowIds, connectorIds`, `color`) not in types.
- **Fix:** Rename `ownerId` to `createdById`. Remove denormalized arrays if types don't support them, or add to types.

#### 2.4 demo-connectors.ts defines DemoConnector incompatible with entities.ts Connector
- **File:** `src/data/demo-connectors.ts` line 3, `src/types/entities.ts` line 422
- **DemoConnector has:** `provider, icon, status, spaceIds, connectedAt, lastSyncedAt, lastError, scope`
- **entities.ts Connector expects:** `type` (not `provider`), `healthStatus` (not `status`), `spaceId` (singular, not `spaceIds`), `lastTestedAt` (not `lastSyncedAt`), `orgId`
- **Missing in demo:** `orgId`, `lastTestedAt`
- **Extra in demo:** `provider, icon, spaceIds, connectedAt, lastSyncedAt, lastError, scope`
- **Fix:** Rename fields to match types. Add `orgId`. Make `spaceId` singular or update types to `spaceIds`.

#### 2.5 demo-memory.ts defines MemoryEntry incompatible with EpisodicMemory/SemanticMemory
- **File:** `src/data/demo-memory.ts` line 1, `src/types/entities.ts` line 345/366
- **MemoryEntry has:** `userId, type, tags, importance, decay, tokensUsed, modelId`
- **TypeScript expects:** `kind` (not `type`), `spaceId`, `embedding`, `context` (episodic) OR `subject, predicate, object, confidence` (semantic)
- **No `type` field in TypeScript:** TypeScript uses `kind` with values `'working'|'episodic'|'semantic'`. Demo uses `"episodic"|"semantic"|"procedural"` — `'procedural'` is not in types!
- **Fix:** Rename `type` to `kind`. Remove `'procedural'` or add to `MEMORY_KIND`. Add missing fields from types.

#### 2.6 demo-models.ts has no corresponding type in entities.ts
- **File:** `src/data/demo-models.ts` line 1
- **ModelCard fields:** `id, name, provider, tier, contextWindow, maxOutputTokens, supportsVision, supportsToolUse, supportsJson, supportsStreaming, costPer1kInput, costPer1kOutput, avgLatencyMs, successRate, totalCalls, description, tags`
- **Issue:** No `ModelCard` or `Model` interface exists in `entities.ts`. The `ModelTier` enum is defined in `enums.ts` but no model entity interface exists.
- **Fix:** Add `Model` interface to `entities.ts`.

#### 2.7 SourceCard has no corresponding type in entities.ts
- **File:** `src/mock/generators.ts` line 241
- **Issue:** `SourceCard` is defined in `generators.ts` but never exported to `entities.ts`. The demo workflows embed `SourceCard[]` but the canonical type system knows nothing about sources.
- **Fix:** Add `Source` interface to `entities.ts` or remove from `DemoWorkflow`.

---

### 3. Enum Inconsistencies

**Severity: HIGH**

No enum is fully consistent across `enums.ts`, Prisma schema (implicit strings), and demo data (inline unions).

#### 3.1 TaskStatus
- **enums.ts:** `'pending'|'ready'|'running'|'succeeded'|'failed'|'cancelled'|'skipped'`
- **demo-workflows.ts:** `'pending'|'running'|'succeeded'|'failed'|'cancelled'`
- **Missing in demo:** `'ready'`, `'skipped'`
- **Fix:** Add missing values to demo, or decide they are not needed for demo data.

#### 3.2 TaskKind
- **enums.ts:** `'research'|'extract'|'synthesize'|'code_author'|'code_review'|'data_analyze'|'image_gen'|'image_edit'|'video_gen'|'transform'|'verify'|'summarize'|'connector_read'|'connector_write'`
- **demo-workflows.ts:** `'research'|'code'|'synthesis'|'analysis'|'data-processing'|'monitor'|'extract'|'visualize'|'test'|'write'|'compare'|'scrape'`
- **Overlap:** Only `'research'`, `'extract'`
- **Missing in demo:** 12 values including `synthesize` (note: demo has `synthesis` which is different string)
- **Missing in enums.ts:** 10 values including `code`, `analysis`, `visualize`, `scrape`
- **Fix:** **Complete enum reconciliation required.** The two lists describe different taxonomies.

#### 3.3 WorkflowStatus
- **enums.ts:** `'queued'|'planning'|'running'|'paused'|'succeeded'|'failed'|'cancelling'|'cancelled'`
- **demo-workflows.ts:** `'pending'|'running'|'succeeded'|'failed'|'cancelled'`
- **Missing in demo:** `'queued'`, `'planning'`, `'paused'`, `'cancelling'`
- **Also:** Demo uses `'pending'` which is NOT in `enums.ts` WorkflowStatus — but IS in TaskStatus. This is a semantic collision.
- **Fix:** Add `'pending'` to WorkflowStatus or replace with `'queued'` in demo.

#### 3.4 UserRole
- **enums.ts:** `'owner'|'admin'|'member'|'viewer'|'auditor'`
- **demo-users.ts:** `'admin'|'analyst'|'engineer'`
- **Overlap:** Only `'admin'`
- **Fix:** Align to one canonical role system.

#### 3.5 MemoryKind
- **enums.ts:** `'working'|'episodic'|'semantic'`
- **demo-memory.ts:** `'episodic'|'semantic'|'procedural'`
- **Missing in demo:** `'working'`
- **Missing in enums.ts:** `'procedural'`
- **Fix:** Add `'procedural'` to `MEMORY_KIND` or remove from demo.

#### 3.6 ModelTier
- **enums.ts:** `'orchestrator'|'reasoning'|'balanced'|'small'|'long_context'|'image_specialist'|'video_specialist'|'code_specialist'|'medical_specialist'|'cheap_bulk'`
- **demo-models.ts:** `'orchestrator'|'reasoning'|'balanced'|'small'|'specialist'`
- **Missing in demo:** 5 values
- **Missing in enums.ts:** `'specialist'`
- **Fix:** Add `'specialist'` to `MODEL_TIER`.

#### 3.7 Connector Status
- **enums.ts:** No `ConnectorStatus` enum defined
- **demo-connectors.ts:** `'connected'|'disconnected'|'error'|'pending'|'degraded'`
- **Prisma:** Uses plain `String @default("disconnected")`
- **TypeScript Connector:** Uses `'healthy'|'degraded'|'unhealthy'|'unknown'` for `healthStatus`
- **Issue:** Three different status vocabularies for the same entity!
- **Fix:** Define single `ConnectorStatus` enum in `enums.ts` and use everywhere.

#### 3.8 EdgeType
- **enums.ts:** `'data'|'ordering'|'conditional'`
- **demo-workflows.ts:** No `EdgeType` defined; edges are simple `{ from, to }`
- **Fix:** Add `edgeType` to demo edges or remove from types.

---

### 4. ID Format Inconsistency

**Severity: MEDIUM**

The Prisma schema uses `@default(cuid())` for IDs. `entities.ts` uses branded `string` types (not enforcing UUID). Demo data uses **multiple custom formats**, none of which are UUIDs or CUIDs.

| Entity | ID Format | Example | UUID? | CUID? |
|---|---|---|---|---|
| User | `usr_` + 13 hex chars | `usr_7a3f9e2b1c4d` | No | No |
| Workflow | `wf_` + descriptive slug | `wf_lithium_miners` | No | No |
| Org | `org_` + slug + number | `org_acme_001` | No | No |
| Space | `spc_` + slug | `spc_acme_research` | No | No |
| Connector | `conn_` + provider | `conn_slack` | No | No |
| Memory | `mem_` + 3-digit number | `mem_001` | No | No |
| Task | `tsk_` + 8 hex chars (generated) | `tsk_a1b2c3d4` | No | No |
| Artifact | `art_` + 8 hex chars (generated) | `art_1a2b3c4d` | No | No |
| Source | `src_` + 8 hex chars (generated) | `src_9f8e7d6c` | No | No |

**The `uuid()` generator in `generators.ts`** produces deterministic RFC4122-lookalike strings, but:
- Uses a seeded LCG PRNG (not cryptographically random)
- The variant nibble is hardcoded to `a` instead of random `8-b`
- These are **not genuine UUID v4** values
- However, the generator is only used in `sse-events.ts` and `llm-responses.ts`, not in demo data

**Fix:** Either standardize all IDs to CUID (matching Prisma) or UUID (matching types comment), or document the custom prefixes as intentional.

---

### 5. Relationship Wiring Issues

**Severity: HIGH**

#### 5.1 Space/workflowIds Mismatch
- **File:** `src/data/demo-spaces.ts` line 25
- **Issue:** `spc_acme_research` lists `wf_pm_tools_compare` in its `workflowIds`, but `wf_pm_tools_compare` has `spaceId = "spc_competitive_intel"` in `demo-workflows.ts`.
- **Result:** Bidirectional relationship is **broken**.
- **Fix:** Move `wf_pm_tools_compare` to `spc_competitive_intel` in `demo-spaces.ts`, or change its `spaceId` to `spc_acme_research`.

#### 5.2 Memory taskId Orphans
- **File:** `src/data/demo-memory.ts` lines 17-337
- **Issue:** All `taskId` values use format `t_001`, `t_002`, etc. But actual task IDs in `demo-workflows.ts` are generated via `shortId("tsk")` producing `tsk_xxxxxxxx` format.
- **Result:** **No memory entry references a real task ID.**
- **Fix:** Use actual `shortId("tsk")` generated IDs for memory `taskId` references, or set `taskId: null` for workflow-level memories.

#### 5.3 Memory userId Consistency
- **File:** `src/data/demo-memory.ts`
- **Result:** All `userId` values match existing users. **PASS.**

#### 5.4 Memory workflowId Consistency
- **File:** `src/data/demo-memory.ts`
- **Result:** All `workflowId` values match existing workflows. **PASS.**

#### 5.5 Workflow -> User Consistency
- **File:** `src/data/demo-workflows.ts`
- **Result:** All `userId` values match existing users. **PASS.**

#### 5.6 Workflow -> Space Consistency
- **File:** `src/data/demo-workflows.ts`
- **Result:** All `spaceId` values match existing spaces. **PASS.**

#### 5.7 Connector -> Space Bidirectional
- **File:** `src/data/demo-spaces.ts`, `src/data/demo-connectors.ts`
- **Result:** All `spaceIds` in connectors match space `connectorIds`. **PASS.**

#### 5.8 DemoWorkflow.ArtifactMeta has no taskId/workflowId
- **File:** `src/data/demo-workflows.ts` line 86, `src/mock/generators.ts` line 426
- **Issue:** `ArtifactMeta` interface lacks `taskId` and `workflowId` required by `entities.ts Artifact`.
- **Fix:** Add required foreign keys to `ArtifactMeta` or change `entities.ts` to make them optional.

---

### 6. Missing Required Fields in Mock Data

**Severity: HIGH**

#### 6.1 DemoUser missing `mfaEnabled`, `updatedAt`, `deletedAt`
- **File:** `src/data/demo-users.ts`
- **Fix:** Add fields or make them optional in `entities.ts User`.

#### 6.2 DemoSpace missing `createdById` (has `ownerId` instead)
- **File:** `src/data/demo-spaces.ts`
- **Fix:** Rename or align interfaces.

#### 6.3 DemoConnector missing `orgId`
- **File:** `src/data/demo-connectors.ts`
- **Fix:** Add `orgId` to all connectors.

#### 6.4 MemoryEntry missing `spaceId`, `embedding`, `context` (episodic) / `subject,predicate,object,confidence` (semantic)
- **File:** `src/data/demo-memory.ts`
- **Fix:** Add missing fields based on `kind`, or create separate memory types.

#### 6.5 PlanRevision in demo missing `id`, `workflowId`, `dagJson`, `plannedByModelId`
- **File:** `src/data/demo-workflows.ts` line 52
- **Fix:** Add required fields or make them optional in types.

---

## Passing Checks

### 7.1 DAG Validity — **PASS**
- **File:** `src/data/demo-workflows.ts`
- All 15 workflow edge definitions were tested for cycles using DFS.
- **Result:** No cycles detected in any workflow. All edge indices within bounds.
- Edge counts range from 2 (WF9) to 18 (WF5), all forming valid DAGs.

### 7.2 Date Format — **PASS**
- **Files:** All demo data files
- All hardcoded dates use ISO-8601 format (`YYYY-MM-DDTHH:MM:SSZ`).
- All generated dates use `Date.toISOString()`.
- **Plausibility:** `createdAt < updatedAt` for all spaces, `createdAt < lastActiveAt` for all users, `connectedAt < lastSyncedAt` for all connectors with both values.

### 7.3 Search Result Plausibility — **PASS**
- **File:** `src/mock/search-results.ts`
- All URLs contain their declared domain.
- All `publishedAt` dates are plausible (2019-2024, none in the future).
- No duplicate domains within a single query result set.
- Content snippets are topically relevant.
- Fallback query returns generic placeholder.

### 7.4 Model Definition Count — **MIXED PASS**
- **Result:** There are exactly 19 unique entity concepts when combining Prisma + TypeScript interfaces.
- However, only 8 are implemented in the database schema. The remaining 11 exist as TypeScript types with no persistence layer.

---

## Summary Table of All Issues

| # | File | Line | Description | Severity | Fix |
|---|---|---|---|---|---|
| 1 | `prisma/schema.prisma` | 11 | Prisma User missing `orgId, role, mfaEnabled, avatarUrl, deletedAt` | Critical | Add fields + Org model |
| 2 | `prisma/schema.prisma` | 23 | Prisma Workflow shape incompatible with types (`name` vs `prompt`, `userId` vs `createdById`, JSON nodes/edges vs Task/TaskEdge relations) | Critical | Refactor to match types or vice versa |
| 3 | `prisma/schema.prisma` | 45 | Prisma Artifact stores inline content; types expect file metadata (`storageUrl`, `checksum`, `taskId`) | Critical | Redesign Artifact model |
| 4 | `prisma/schema.prisma` | 60 | Prisma Memory is key/value store; types expect episodic/semantic split with embeddings | Critical | Split Memory model or add optional fields |
| 5 | `prisma/schema.prisma` | 75 | Prisma Connector missing `orgId`, `spaceId`, `healthStatus` enum | High | Add missing fields |
| 6 | `prisma/schema.prisma` | 113 | Prisma Usage field names differ from types (`tokensIn` vs `promptTokens`, `costUsd` vs `estimatedCostCents`) | High | Rename to match |
| 7 | `prisma/schema.prisma` | — | Missing models: Org, Task, TaskEdge, TaskAttempt, PlanRevision, Clarification, AuditEvent | Critical | Add all missing models |
| 8 | `src/types/entities.ts` | 78 | User interface incompatible with Prisma (extra fields: `orgId`, `role`, `mfaEnabled`, `deletedAt`) | Critical | Sync with Prisma |
| 9 | `src/data/demo-workflows.ts` | 24-88 | Local type definitions instead of importing from `entities.ts`; zero field compatibility for Task, TaskEdge, Workflow, PlanRevision | Critical | Import from `entities.ts` and refactor data |
| 10 | `src/data/demo-users.ts` | 1 | DemoUser defines local interface incompatible with `entities.ts User`; missing `mfaEnabled`, `updatedAt`, `deletedAt` | High | Import `User` from `entities.ts` |
| 11 | `src/data/demo-spaces.ts` | 1 | DemoSpace uses `ownerId` instead of `createdById`; adds denormalized arrays not in types | Medium | Rename field; add arrays to types if needed |
| 12 | `src/data/demo-connectors.ts` | 3 | DemoConnector field names differ (`provider` vs `type`, `status` vs `healthStatus`, `spaceIds` vs `spaceId`, `lastSyncedAt` vs `lastTestedAt`) | High | Align field names to `entities.ts` |
| 13 | `src/data/demo-memory.ts` | 1 | MemoryEntry uses `type` instead of `kind`; includes `'procedural'` not in `MEMORY_KIND`; missing `spaceId`, `embedding` | High | Rename to `kind`; reconcile enum; add missing fields |
| 14 | `src/data/demo-models.ts` | 1 | ModelCard has no corresponding interface in `entities.ts` | Medium | Add `Model` interface to `entities.ts` |
| 15 | `src/mock/generators.ts` | 241 | SourceCard has no corresponding interface in `entities.ts` | Medium | Add `Source` interface or remove from types |
| 16 | `src/types/enums.ts` | 51 | `TASK_KIND` values incompatible with demo-workflows.ts TaskKind | High | Reconcile both enum lists |
| 17 | `src/types/enums.ts` | 14 | `WorkflowStatus` missing `'pending'` used in demo | Medium | Add `'pending'` or replace in demo |
| 18 | `src/types/enums.ts` | 165 | `USER_ROLE` values incompatible with demo-users.ts roles | High | Reconcile role systems |
| 19 | `src/types/enums.ts` | 137 | `MEMORY_KIND` missing `'procedural'` used in demo-memory.ts | Low | Add `'procedural'` to enum |
| 20 | `src/types/enums.ts` | 181 | `MODEL_TIER` missing `'specialist'` used in demo-models.ts | Low | Add `'specialist'` to enum |
| 21 | `src/types/enums.ts` | — | No `ConnectorStatus` enum defined; demo and types use different vocabularies | Medium | Define canonical `ConnectorStatus` enum |
| 22 | `src/data/demo-spaces.ts` | 25 | `spc_acme_research.workflowIds` includes `wf_pm_tools_compare` which belongs to `spc_competitive_intel` | High | Fix workflow assignment |
| 23 | `src/data/demo-memory.ts` | 17-337 | All `taskId` values use `t_###` format but actual task IDs are `tsk_xxxxxxxx` | High | Replace with real task IDs or null |
| 24 | `prisma/schema.prisma` | 12 | IDs use `@default(cuid())` but demo data uses custom prefixed IDs | Medium | Standardize to CUID or document custom format |
| 25 | `src/mock/generators.ts` | 19 | `uuid()` generator produces non-cryptographic, deterministic pseudo-UUIDs | Low | Replace with genuine UUID v4 if used for production |
| 26 | `src/data/demo-workflows.ts` | 65 | Workflow status `'pending'` is not in `enums.ts` `WorkflowStatus` | Medium | Add to enum or change to `'queued'` |
| 27 | `src/data/demo-workflows.ts` | 40 | Task status values are subset of `enums.ts` but missing `'ready'` and `'skipped'` | Low | Add to demo or document intentional exclusion |
| 28 | `src/types/entities.ts` | — | `Org` interface has no Prisma model | Medium | Add `Org` to Prisma or remove if unused |
| 29 | `src/types/entities.ts` | — | `Task`, `TaskEdge`, `TaskAttempt`, `TokenUsage` have no Prisma models | Critical | Add to Prisma schema |
| 30 | `src/data/demo-workflows.ts` | 86 | `ArtifactMeta` lacks `taskId`, `workflowId`, `checksum`, `storageUrl`, `kind` required by `entities.ts Artifact` | High | Add fields or make optional in types |

---

## Recommendations

1. **Single Source of Truth:** Make `entities.ts` the canonical type definition. Remove all local interface redefinitions from demo data files and import from `entities.ts`.
2. **Prisma Schema Migration:** Add all missing models (Org, Task, TaskEdge, TaskAttempt, PlanRevision, Clarification, AuditEvent) to the Prisma schema. Align field names with `entities.ts`.
3. **Enum Unification:** Merge all enum definitions into `enums.ts` and import them in both Prisma (via `@map` or custom scripts) and demo data.
4. **ID Standardization:** Choose one ID format (CUID recommended since Prisma already uses it) and apply consistently across all demo data.
5. **Relationship Validation:** Add a runtime validation script that checks all foreign key references in demo data before application startup.
6. **Mock Data Refactor:** The `demo-workflows.ts` file needs the most work — its types, enums, and field names are almost entirely disconnected from the rest of the system.

---

*Report generated by automated data integrity audit.*
