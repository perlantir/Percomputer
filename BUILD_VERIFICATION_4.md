# Build Verification Report 4 - Mock Data Integrity

## Overview
This report verifies that all mock/demo data in the multi-model-agent-platform project is complete, consistent, and conforms to the TypeScript type definitions. The audit covers 9 demo data files, 3 mock generator files, type definitions, and API contracts.

**Date**: Build Verification 4
**Scope**: `src/data/*`, `src/mock/*`, `src/types/*`
**Result**: 52 issues found across 6 severity levels

---

## 1. Demo Data Exports - CHECKED

### Status: PASS (with notes)

All 9 demo data files properly export their data:

| File | Export | Count | Status |
|------|--------|-------|--------|
| `demo-users.ts` | `DEMO_USERS` | 6 | OK |
| `demo-spaces.ts` | `DEMO_SPACES` | 4 | OK |
| `demo-workflows.ts` | `DEMO_WORKFLOWS` | 5 | OK |
| `demo-models.ts` | `DEMO_MODELS` | 12 | OK |
| `demo-connectors.ts` | `DEMO_CONNECTORS` | 8 | OK |
| `demo-notifications.ts` | `DEMO_NOTIFICATIONS` | 9 | OK |
| `demo-memory.ts` | `DEMO_MEMORY_ENTRIES` | 5 | OK |
| `demo-analytics.ts` | `ALL_DEMO` | 1 | OK |
| `templates.ts` | `WORKFLOW_TEMPLATES` | 16 | OK |

All exports are re-exported through `data/index.ts`.

### Note
- `demo-analytics.ts` also exports `Budget` and `AlertLevel` interfaces alongside `ALL_DEMO`.

---

## 2. Entity Coverage - CHECKED

### Status: FAIL - 5 entity types have NO demo data; 7 have partial/incorrect data

From `types/entities.ts`, there are **16 core entity types**.

| Entity | Demo File | Status | Issues |
|--------|-----------|--------|--------|
| **User** | `demo-users.ts` | Partial | Shape mismatch (see below) |
| **Org** | NONE | **MISSING** | No demo data at all |
| **Space** | `demo-spaces.ts` | Partial | Uses `ownerId` instead of `createdById`; extra fields |
| **Workflow** | `demo-workflows.ts` | Good | Matches core type with valid extensions |
| **Task** | `demo-workflows.ts` | Good | Built by `buildWorkflow()`, matches core type |
| **TaskEdge** | `demo-workflows.ts` | Good | Built by `buildWorkflow()`, matches core type |
| **TaskAttempt** | NONE | **MISSING** | No demo data at all |
| **Artifact** | `demo-workflows.ts` | Partial | `ArtifactMeta` is not a valid `Artifact` |
| **PlanRevision** | `demo-workflows.ts` | Good | Matches core type |
| **Clarification** | NONE | **MISSING** | No demo data at all |
| **EpisodicMemory** | `demo-memory.ts` | Partial | `MemoryEntry` differs from core type |
| **SemanticMemory** | `demo-memory.ts` | Partial | `MemoryEntry` differs from core type |
| **AuditEvent** | NONE | **MISSING** | No demo data at all |
| **Event** | NONE | **MISSING** | No demo data at all |
| **Connector** | `demo-connectors.ts` | Partial | Shape mismatch (see below) |
| **Usage** | `demo-analytics.ts` | Partial | `Budget`/`Analytics` shapes, not `Usage` entity |

### Coverage Summary
- **Fully conforming**: 4/16 (Workflow, Task, TaskEdge, PlanRevision)
- **Partial / incorrect**: 7/16
- **Completely missing**: 5/16 (Org, TaskAttempt, Clarification, AuditEvent, Event)

---

## 3. Demo Data Type Conformance - DETAILED

### 3.1 `demo-users.ts` - DemoUser vs User

**User type fields**: `id`, `name`, `email`, `orgId`, `role`, `avatarUrl`, `mfaEnabled`, `createdAt`, `updatedAt`, `deletedAt`

**DemoUser fields**: `id`, `email`, `name`, `avatarUrl`, `role`, `orgId`, `orgName`, `preferences`, `createdAt`, `lastActiveAt`

**Issues**:
- `HIGH` - Missing `mfaEnabled` (required boolean)
- `HIGH` - Missing `updatedAt` (required string)
- `HIGH` - Missing `deletedAt` (required string, though can be null)
- `MEDIUM` - Extra `orgName` (not in User type)
- `MEDIUM` - Extra `preferences` object (not in User type)
- `MEDIUM` - Extra `lastActiveAt` (not in User type)
- `MEDIUM` - Field order differs from type definition

### 3.2 `demo-spaces.ts` - DemoSpace vs Space

**Space type fields**: `id`, `name`, `orgId`, `createdById`, `description`, `createdAt`, `updatedAt`

**DemoSpace fields**: `id`, `name`, `description`, `orgId`, `ownerId`, `memberIds`, `workflowIds`, `connectorIds`, `color`, `icon`, `createdAt`, `updatedAt`

**Issues**:
- `HIGH` - Uses `ownerId` instead of `createdById` (different field name)
- `LOW` - Extra `memberIds`, `workflowIds`, `connectorIds`, `color`, `icon` (convenience fields for UI)

### 3.3 `demo-connectors.ts` - DemoConnector vs Connector

**Connector type fields**: `id`, `name`, `type`, `orgId`, `spaceId`, `config`, `healthStatus`, `lastTestedAt`, `createdAt`, `updatedAt`

**DemoConnector fields**: `id`, `name`, `provider`, `icon`, `status`, `orgId`, `spaceIds`, `connectedAt`, `lastSyncedAt`, `lastError`, `config`, `scope`

**Issues**:
- `HIGH` - Field `type` renamed to `provider`
- `HIGH` - Field `spaceId` (single string) replaced by `spaceIds` (string array)
- `HIGH` - `healthStatus` replaced by `status` with completely different enum values:
  - Core: `'healthy' | 'degraded' | 'unhealthy' | 'unknown'`
  - Demo: `'installed' | 'available' | 'error' | 'revoked'`
- `HIGH` - `lastTestedAt` replaced by `lastSyncedAt`
- `HIGH` - Missing `createdAt`, `updatedAt`
- `MEDIUM` - Extra `icon`, `connectedAt`, `lastError`, `scope`
- `CRITICAL` - This is essentially a different type, not a valid Connector

### 3.4 `demo-memory.ts` - MemoryEntry vs EpisodicMemory / SemanticMemory

**EpisodicMemory fields**: `id`, `kind`, `orgId`, `spaceId`, `content`, `embedding`, `workflowId`, `context`, `createdAt`
**SemanticMemory fields**: `id`, `kind`, `orgId`, `spaceId`, `subject`, `predicate`, `object`, `embedding`, `confidence`, `createdAt`

**MemoryEntry fields**: `id`, `userId`, `orgId`, `workflowId`, `taskId`, `type`, `content`, `tags`, `modelId`, `tokensUsed`, `createdAt`, `importance`, `decay`

**Issues**:
- `HIGH` - Uses `type` instead of `kind` field
- `HIGH` - Has `userId`, `taskId`, `tags`, `modelId`, `tokensUsed`, `importance`, `decay` - none in core types
- `HIGH` - Missing `spaceId` (not present in MemoryEntry)
- `HIGH` - `kind`/`type` value `'procedural'` is **NOT** in `MEMORY_KIND` enum (`'working'|'episodic'|'semantic'`)
- `CRITICAL` - MemoryEntry does not conform to either EpisodicMemory or SemanticMemory

### 3.5 `demo-workflows.ts` - ArtifactMeta vs Artifact

**Artifact type fields**: `id`, `name`, `kind`, `taskId`, `workflowId`, `storageUrl`, `sizeBytes`, `checksum`, `metadata`, `mimeType`, `createdAt`

**ArtifactMeta fields**: `id`, `name`, `type`, `sizeBytes`, `description`, `createdAt`

**Issues**:
- `HIGH` - Missing `kind`, `taskId`, `workflowId`, `storageUrl`, `checksum`, `metadata`, `mimeType`
- `HIGH` - Has `type` (wrong field name, should be `kind` or `mimeType`)
- `MEDIUM` - Extra `description` (not in core type)
- `MEDIUM` - `type` values (`'markdown'`, `'csv'`, `'code'`, `'pdf'`) do NOT match `ARTIFACT_KIND` enum:
  - Enum: `'report_md'`, `'dataset_csv'`, `'image_png'`, `'image_jpg'`, `'code_diff'`, `'text_txt'`, `'json'`

### 3.6 `demo-models.ts` - ModelCard vs ModelDefinition

**ModelDefinition fields**: `id`, `displayName`, `provider`, `tier`, `capabilities`, `cost`, `latency`, `contextWindow`, `supportsStreaming`, `supportsTools`, `supportsVision`, `maxOutputTokens`, `safetyClass`, `enabled`

**ModelCard fields**: `id`, `name`, `provider`, `tier`, `contextWindow`, `maxOutputTokens`, `supportsVision`, `supportsToolUse`, `supportsJson`, `supportsStreaming`, `costPer1kInput`, `costPer1kOutput`, `avgLatencyMs`, `successRate`, `totalCalls`, `description`, `tags`

**Issues**:
- `HIGH` - `name` vs `displayName` (different field name)
- `HIGH` - `costPer1kInput`/`costPer1kOutput` vs nested `CostProfile` object with `perInputToken`, `perOutputToken`, `currency`, `effectiveDate`
- `HIGH` - `avgLatencyMs` vs nested `LatencyProfile` object with `ttftMs`, `interTokenLatencyMs`, `p95TotalMs`, `measuredAt`
- `HIGH` - Missing `capabilities` (complex object), `safetyClass`, `enabled`
- `MEDIUM` - `supportsToolUse` vs `supportsTools` (naming mismatch)
- `MEDIUM` - Extra `supportsJson`, `successRate`, `totalCalls`, `description`, `tags`
- `MEDIUM` - `tier` values in ModelCard (`'fast'`, `'balanced'`, `'quality'`, `'premium'`) - `MODEL_TIER` enum has `'light'`, `'balanced'`, `'powerful'`, `'custom'`
  - `'fast'` not in enum, `'quality'` not in enum, `'premium'` not in enum
  - `'light'` not used, `'powerful'` not used

### 3.7 `demo-analytics.ts` - Analytics shapes vs Usage entity

**Usage type fields**: `creditsBudget`, `spent`, `remaining`, `percent`, `alerts`, `periodStart`, `periodEnd`

**Analytics/Budget fields**: `creditsBudget`, `spent`, `remaining`, `percent`, `alerts` (no `periodStart`, `periodEnd`)

**Issues**:
- `MEDIUM` - `ALL_DEMO` is not a `Usage` entity; it aggregates multiple usage records
- `LOW` - Missing `periodStart`/`periodEnd` in `Budget` interface (but has `period` string in ALL_DEMO)
- `INFO` - This is more of an analytics dashboard shape than a core entity

---

## 4. `mock-data.ts` Type Conformance - DETAILED

The file `src/data/mock-data.ts` contains data that is meant to mock API responses but has significant divergences from the core types.

### 4.1 `mockUsers`

**Issues**:
- `HIGH` - `role` values: `'admin'`, `'operator'`, `'user'`
- `CRITICAL` - `'operator'` is **NOT** in `USER_ROLE` enum (`'owner'|'admin'|'member'|'viewer'|'auditor'`)
- `CRITICAL` - `'user'` is **NOT** in `USER_ROLE` enum
- `MEDIUM` - Missing `mfaEnabled`, `updatedAt`, `deletedAt`

### 4.2 `mockWorkflows`

**Issues**:
- `HIGH` - `status` value `'completed'` is **NOT** in `WORKFLOW_STATUS` enum (`'draft'|'queued'|'planning'|'running'|'paused'|'succeeded'|'failed'|'cancelling'|'cancelled'`)
- `HIGH` - `status` value `'awaiting_clarification'` is **NOT** in `WORKFLOW_STATUS` enum
- `HIGH` - Missing `prompt` (has `objective` instead), `createdById` (has `ownerId`)
- `MEDIUM` - Missing `safetyClass`, `statusReason`, `activePlanRevisionId`
- `MEDIUM` - Extra fields: `budgetCredits`, `spentCredits`, `deliverableKinds`, `policyOverrides`, `currentPlanVersion`, `completedAt`, `errorMessage`, `deadline`

### 4.3 `mockTasks`

**Issues**:
- `CRITICAL` - Missing `kind` field entirely (required by `Task` type)
- `HIGH` - `status` value `'completed'` is **NOT** in `TASK_STATUS` enum (`'pending'|'ready'|'running'|'succeeded'|'failed'|'cancelled'|'skipped'`)
- `HIGH` - `title` replaced by `name`
- `HIGH` - `instruction` replaced by `description`
- `MEDIUM` - `creditsUsed` replaced by `costCredits`
- `MEDIUM` - `toolCalls` replaced by `toolsUsed` (different shape)
- `MEDIUM` - Missing `dagLevel`, `modelAttempts`, `resolvedModelId`, `maxAttempts`, `statusReason`, `updatedAt`
- `MEDIUM` - Extra: `assignedModel`, `actualModel`, `depth`, `retryCount`, `completedAt`, `errorMessage`

### 4.4 `mockArtifacts`

**Issues**:
- `HIGH` - `kind` values (`'markdown'`, `'csv'`, `'code'`) do NOT match `ARTIFACT_KIND` enum
- `HIGH` - Missing `kind` (field is `type` instead), `taskId`, `workflowId`, `storageUrl`, `checksum`, `metadata`, `mimeType`
- `MEDIUM` - Extra `contentPreview`

### 4.5 `mockClarifications`

**Issues**:
- `CRITICAL` - Shape is completely different from `Clarification` type
- `HIGH` - Missing `taskId`, `status`, `answer`, `expiresInMinutes`, `answeredAt`, `expiredAt`
- `HIGH` - Uses `answered` (boolean) instead of `status` (`'pending'|'answered'|'expired'`)
- `MEDIUM` - Extra `context`

### 4.6 `mockConnectors`

**Issues**:
- `CRITICAL` - Missing `id`, `spaceId`, `config`, `healthStatus`, `lastTestedAt`, `createdAt`, `updatedAt`
- `CRITICAL` - Uses `name` as primary identifier instead of `id`
- `HIGH` - `status` values (`'installed'`, `'available'`, `'error'`, `'revoked'`) do NOT match core `Connector` health status (`'healthy'|'degraded'|'unhealthy'|'unknown'`)
- `MEDIUM` - Extra: `displayName`, `description`, `scopes`, `installedAt`, `revokedAt`, `errorMessage`, `iconUrl`

### 4.7 `mockMemoryEntries`

**Issues**:
- `HIGH` - Shape uses `key`/`value` instead of `content`/`context`
- `HIGH` - `kind` value `'user_preference'` is **NOT** in `MEMORY_KIND` enum
- `MEDIUM` - Extra `userId`, `confidence`

---

## 5. SSE Events Verification - CHECKED

### Status: FAIL - Significant divergence between API types and mock SSE events

### 5.1 Event Type Naming Mismatch

The API uses **snake_case** naming (`workflow_planned`, `task_status`), while the mock uses **dot notation** (`workflow.planned`, `task.started`). These are completely different event vocabularies.

### 5.2 Event Type Coverage Comparison

| API Event Type | Mock Equivalent | Status |
|----------------|-----------------|--------|
| `workflow_queued` | NONE | **MISSING** |
| `workflow_planning` | NONE | **MISSING** |
| `workflow_planned` | `workflow.planned` | Exists (different name) |
| `workflow_paused` | NONE | **MISSING** |
| `workflow_resumed` | NONE | **MISSING** |
| `workflow_completed` | `workflow.completed` | Exists (different name) |
| `workflow_failed` | `workflow.failed` | Exists (different name) |
| `workflow_cancelling` | NONE | **MISSING** |
| `workflow_cancelled` | NONE | **MISSING** |
| `workflow_clarification` | NONE | **MISSING** |
| `workflow_budget` | `budget.warn`, `budget.exceeded` | Different granularity |
| `task_status` | `task.started`, `task.completed`, `task.failed` | Different granularity |
| `task_running` | `task.started` | Partial match |
| `task_log` | NONE | **MISSING** |
| `artifact_created` | `artifact.created` | Exists (different name) |
| `artifact_updated` | NONE | **MISSING** |
| `clarification_status` | NONE | **MISSING** |
| `budget` | `budget.warn`, `budget.exceeded` | Exists (different name) |
| `synthesis_token` | `synthesis.token` | Exists (different name) |

### 5.3 Mock-only Event Types (Not in API)

- `workflow.amended` - **NOT** in API types
- `task.tokens` - **NOT** in API types
- `source.discovered` - **NOT** in API types
- `memory.stored` - **NOT** in API types

### 5.4 API-only Event Types (Not in Mock)

- `workflow_queued`, `workflow_planning`, `workflow_paused`, `workflow_resumed`, `workflow_cancelling`, `workflow_cancelled`, `workflow_clarification`, `task_log`, `artifact_updated`, `clarification_status`

### 5.5 SSE Event Shape Mismatch

| Field | API Type | Mock Type |
|-------|----------|-----------|
| Base fields | `workflowId`, `emittedAt` (string) | `id`, `type`, `timestamp`, `workflowId`, `taskId?` |
| Timestamp | `emittedAt` (ISO string) | `timestamp` (Date object) |
| Pattern | Discriminated union (`eventType` + typed payload) | Single interface with `payload: Record<string, unknown>` |
| Type field | `eventType` | `type` |

**Issues**:
- `HIGH` - Field `timestamp` vs `emittedAt` (different name and type)
- `HIGH` - Mock uses untyped `payload: Record<string, unknown>` instead of discriminated union
- `MEDIUM` - Mock includes `taskId` on event types where it doesn't belong (not in API types)
- `MEDIUM` - Mock event `id` field is not in API base type

### 5.6 Generator Functions

The `generators.ts` functions that produce API-compliant events are actually correct:

- `generateBudgetEvent()` produces valid `BudgetExceededEvent` with `type: 'budget'`
- `generateSynthesisToken()` produces valid `SynthesisTokenEvent` with `type: 'synthesis'`
- `generateArtifactEvent()` produces valid `ArtifactCreatedEvent` with `type: 'artifact_created'`

These match the `api.ts` types exactly.

### 5.7 LLM Stream Generator Bug

**`generateLLMChunk()` has a critical logic flaw**:

```typescript
const response = llmResponses[i] || '';
return {
  index: i,
  delta: response,
  finishReason: i >= responseArray.length ? 'stop' : null,
  done: i >= responseArray.length,
};
```

`responseArray` is declared as `const responseArray = Object.values(llmResponses);`. Since `llmResponses` is an object with keys `'0'` through `'7'`, `Object.values(llmResponses).length` is always 8.

However, the function receives `i` as an index. When `i < 8`, it returns a valid chunk. When `i >= 8`, it returns `{ done: true, finishReason: 'stop' }`.

The bug: **for any index `i` where `llmResponses[i]` is undefined** (e.g., if `llmResponses` had gaps), the delta would be `''` and the function would still return `done: false` (as long as `i < 8`). This means empty chunks would stream before the actual content.

Additionally, `generateStreamBuffer(5)` calls `generateChatChunk(0..5)`, and `generateChatChunk` calls `generateLLMChunk`. Since indices 0-5 have entries in `llmResponses`, they return valid chunks. This works for indices 0-5 but would break for indices > 7.

**Severity**: MEDIUM - Works for expected use cases but breaks on edge cases.

---

## 6. Search Results Plausibility - CHECKED

### Status: PASS (with limitations)

### 6.1 Query Coverage

`generateSearchResults()` supports exactly **9 hardcoded queries**:

1. `lithium miners` - 5 results
2. `Tesla earnings Q3 2024` - 4 results
3. `quantum computing funding` - 4 results
4. `Bitcoin on-chain metrics` - 4 results
5. `project management tools` - 4 results
6. `IPCC climate report` - 3 results
7. `SaaS metrics dashboard` - 2 results
8. `sentiment analysis pipeline` - 2 results
9. `SEC filings executive compensation` - 2 results

### 6.2 Result Quality Assessment

| Query | Sources | Plausible? |
|-------|---------|------------|
| `lithium miners` | investingnews.com, ft.com, reuters.com, bloomberg.com, pilbaraminerals.com.au | Yes - mix of news, financial, and primary |
| `Tesla earnings Q3 2024` | ir.tesla.com, reuters.com, cnbc.com, benzinga.com | Yes - includes investor relations primary source |
| `quantum computing funding` | techcrunch.com, ionq.com, nature.com, rigetti.com | Yes - trade + primary + peer-reviewed |
| `Bitcoin on-chain metrics` | glassnode.com, coinmetrics.io, coingecko.com, bloomberg.com | Yes - specialist analytics + mainstream |
| `project management tools` | g2.com, capterra.com, stackoverflow.com, notion.so | Yes - reviews + community + vendor |
| `IPCC climate report` | ipcc.ch, msci.com, carbonbrief.org | Yes - primary + investor + explainer |
| `SaaS metrics dashboard` | bessemervc.com, observablehq.com | Yes - VC insight + technical resource |
| `sentiment analysis pipeline` | arxiv.org, huggingface.co | Yes - academic + practical tutorial |
| `SEC filings executive compensation` | sec.gov, github.com | Yes - official + developer resource |

### 6.3 Issues

- `MEDIUM` - `totalResults` is fabricated: `results.length * 12 + random(0, 50)`
- `LOW` - Only 9 queries supported; any other query falls back to a generic Google result
- `LOW` - Some result dates span 2019-2024; older results (e.g., FinBERT paper 2019) may be stale for current queries
- `INFO` - No mock results for common developer queries (React, Python, AI, etc.)

---

## 7. Other Findings

### 7.1 `mock-data.ts` Workflow-Task Consistency

In `mock-data.ts`, `mockWorkflows[0]` (sentiment analysis) has `taskIds: ['ta-101', 'ta-102', 'ta-103']` but `mockTasks` has IDs like `'t-101'` through `'t-112'`. The workflow references `'ta-101'` but tasks are `'t-101'`.

Wait - re-reading: `mockWorkflows[0].taskIds` has `['ta-101', 'ta-102', 'ta-103']` but checking `mockTasks`:
- `t-101`, `t-102`, `t-103` belong to workflow `wf-001` (web extraction)
- `t-104`, `t-105`, `t-106` belong to `wf-002` (legal contract analysis)
- `t-107`, `t-108` belong to `wf-003` (vendor risk assessment)
- `t-109`, `t-110`, `t-111`, `t-112` belong to `wf-004` (compliance gap analysis)

So `mockWorkflows[0]` (which is `wf-001`, sentiment analysis) claims taskIds `['ta-101', 'ta-102', 'ta-103']` but the actual tasks for `wf-001` are `['t-101', 't-102', 't-103']`.

**Issue**: `CRITICAL` - Task ID mismatch in mock data! Workflow `wf-001` references non-existent task IDs.

### 7.2 Task-Workflow Referential Integrity

Checking referential integrity between `mockWorkflows` and `mockTasks`:

| Workflow ID | Claimed Task IDs | Actual Task IDs in mockTasks | Match? |
|-------------|------------------|------------------------------|--------|
| `wf-001` | `ta-101`, `ta-102`, `ta-103` | `t-101`, `t-102`, `t-103` | **NO** - prefix mismatch |
| `wf-002` | `ta-104`, `ta-105`, `ta-106` | `t-104`, `t-105`, `t-106` | **NO** - prefix mismatch |
| `wf-003` | `ta-107`, `ta-108` | `t-107`, `t-108` | **NO** - prefix mismatch |
| `wf-004` | `ta-109`..`ta-112` | `t-109`..`t-112` | **NO** - prefix mismatch |
| `wf-005` | (no taskIds listed) | (no tasks for this WF) | N/A |

All workflows in `mock-data.ts` use `'ta-'` prefix for taskIds but actual tasks use `'t-'` prefix.

### 7.3 `demo-workflows.ts` Cross-Reference Integrity

In `demo-workflows.ts`, `buildWorkflow()` properly links tasks, edges, artifacts, and plan revisions to the workflow ID. This file maintains referential integrity correctly.

### 7.4 `DEMO_USERS` Org ID Consistency

- `DEMO_USERS[0]` (Michael Scott): `orgId: 'org-001'` but name references "Dunder Mifflin"
- `DEMO_USERS[1]` (Dwight Schrute): `orgId: 'org-001'`
- `DEMO_USERS[2]` (Jim Halpert): `orgId: 'org-001'`
- `DEMO_USERS[3]` (Elon Musk): `orgId: 'org-002'` but name references "Tesla, Inc."
- `DEMO_USERS[4]` (Bill Gates): `orgId: 'org-003'` but name references "Microsoft"
- `DEMO_USERS[5]` (Melinda Gates): `orgId: 'org-003'`

The user names reference real companies but the `orgId` values are fictional. This is fine for mock data but the `orgName` field in DemoUser (`'Acme Corporation'` for org-001) doesn't match the fictional company references.

### 7.5 `DEMO_SPACES` Owner ID Consistency

- `DEMO_SPACES[0]` (General workspace): `ownerId: 'usr-001'` (Michael Scott)
- `DEMO_SPACES[1]` (Research projects): `ownerId: 'usr-004'` (Elon Musk)
- `DEMO_SPACES[2]` (Product analytics): `ownerId: 'usr-004'` (Elon Musk)
- `DEMO_SPACES[3]` (Knowledge base): `ownerId: 'usr-005'` (Bill Gates)

All `ownerId` values match existing user IDs. Referential integrity is maintained.

### 7.6 `DEMO_CONNECTORS` Space ID Consistency

- `DEMO_CONNECTORS[0]` (Google Drive): `spaceIds: ['spc-001']` - General workspace exists
- `DEMO_CONNECTORS[1]` (Slack): `spaceIds: ['spc-001', 'spc-002']` - Both exist
- `DEMO_CONNECTORS[2]` (GitHub): `spaceIds: ['spc-002', 'spc-003']` - Both exist
- `DEMO_CONNECTORS[3]` (Salesforce): `spaceIds: ['spc-003']` - Product analytics exists
- `DEMO_CONNECTORS[4]` (Notion): `spaceIds: ['spc-001']` - General workspace exists
- `DEMO_CONNECTORS[5]` (Airtable): `spaceIds: ['spc-002']` - Research projects exists
- `DEMO_CONNECTORS[6]` (SharePoint): `spaceIds: ['spc-001', 'spc-004']` - Both exist
- `DEMO_CONNECTORS[7]` (Jira): `spaceIds: ['spc-003']` - Product analytics exists

All spaceIds in connectors reference existing spaces. Referential integrity is maintained.

### 7.7 `DEMO_MEMORY_ENTRIES` Referential Integrity

- Memory entries reference `workflowId: 'wf-001'` through `'wf-004'` - these exist in demo workflows
- `userId` values `'usr-001'`, `'usr-002'`, `'usr-004'` - these exist in demo users
- `orgId: 'org-001'` - referenced by Michael Scott and Dwight Schrute

All references are valid. Referential integrity is maintained.

### 7.8 Type Import Check

In `src/data/index.ts`, the import `import { User, Space, Workflow, Connector, Task, Artifact, PlanRevision, MemoryEntry, MemoryKind } from '../types'` attempts to import from `../types` (which resolves to `../types/index.ts`).

Checking `types/index.ts` exports:
- Exports: `LLMModel`, `ModelTier`, `Message`, `LLMRequestBody`, `SSEMessage`, `SearchResult`, `SearchFilters`
- Does NOT export `User`, `Space`, `Workflow`, `Connector`, `Task`, `Artifact`, `PlanRevision`, `MemoryEntry`, `MemoryKind`

**Issue**: `CRITICAL` - `data/index.ts` imports types that are NOT exported from `types/index.ts`! These types are defined in `types/entities.ts` and `types/enums.ts` but not re-exported from the barrel file.

The data files import from `../types` which will fail at compile time because:
- `User` is in `types/entities.ts` (not in `types/index.ts`)
- `Space` is in `types/entities.ts` (not in `types/index.ts`)
- `Workflow` is in `types/entities.ts` (not in `types/index.ts`)
- `Connector` is in `types/entities.ts` (not in `types/index.ts`)
- `Task` is in `types/entities.ts` (not in `types/index.ts`)
- `Artifact` is in `types/entities.ts` (not in `types/index.ts`)
- `PlanRevision` is in `types/entities.ts` (not in `types/index.ts`)
- `MemoryEntry` is in `types/entities.ts` (not in `types/index.ts`)
- `MemoryKind` is in `types/enums.ts` (not in `types/index.ts`)

---

## 8. Summary of Issues by Severity

### CRITICAL (5 issues)
1. `data/index.ts` imports types (`User`, `Space`, `Workflow`, etc.) from `../types` that are NOT exported from `types/index.ts` - **will cause compilation errors**
2. `mock-data.ts`: Task ID prefix mismatch - workflows reference `'ta-xxx'` but tasks have `'t-xxx'` IDs
3. `demo-connectors.ts`: `DemoConnector` is essentially a different type from `Connector` - field names, types, and enums all differ
4. `demo-memory.ts`: `MemoryEntry` does not conform to `EpisodicMemory` or `SemanticMemory`; `kind` value `'procedural'` is not in `MEMORY_KIND` enum
5. `mock-data.ts`: `mockClarifications` shape is completely different from `Clarification` type; uses `answered` boolean instead of `status` enum

### HIGH (18 issues)
1. `demo-users.ts`: Missing `mfaEnabled`, `updatedAt`, `deletedAt`
2. `demo-spaces.ts`: Uses `ownerId` instead of `createdById`
3. `demo-connectors.ts`: `type` renamed to `provider`; `spaceId` (single) replaced by `spaceIds` (array)
4. `demo-connectors.ts`: `status` enum values completely different from core type (`'installed'/'available'/'error'/'revoked'` vs `'healthy'/'degraded'/'unhealthy'/'unknown'`)
5. `demo-connectors.ts`: Missing `createdAt`, `updatedAt`
6. `demo-memory.ts`: Uses `type` instead of `kind`
7. `demo-memory.ts`: Missing `spaceId`
8. `demo-workflows.ts`: `ArtifactMeta` missing `kind`, `taskId`, `workflowId`, `storageUrl`, `checksum`, `metadata`, `mimeType`
9. `demo-models.ts`: `name` vs `displayName` mismatch
10. `demo-models.ts`: `costPer1kInput`/`costPer1kOutput` vs nested `CostProfile` object
11. `demo-models.ts`: `avgLatencyMs` vs nested `LatencyProfile` object
12. `demo-models.ts`: Missing `capabilities`, `safetyClass`, `enabled`
13. `mock-data.ts`: `mockUsers` role `'operator'` not in `USER_ROLE` enum
14. `mock-data.ts`: `mockUsers` role `'user'` not in `USER_ROLE` enum
15. `mock-data.ts`: `mockWorkflows` status `'completed'` not in `WORKFLOW_STATUS` enum
16. `mock-data.ts`: `mockWorkflows` status `'awaiting_clarification'` not in `WORKFLOW_STATUS` enum
17. `mock-data.ts`: `mockTasks` missing required `kind` field
18. `mock-data.ts`: `mockTasks` status `'completed'` not in `TASK_STATUS` enum

### MEDIUM (16 issues)
1. `demo-users.ts`: Extra `orgName`, `preferences`, `lastActiveAt`
2. `demo-spaces.ts`: Extra `memberIds`, `workflowIds`, `connectorIds`, `color`, `icon`
3. `demo-connectors.ts`: Extra `icon`, `connectedAt`, `lastError`, `scope`
4. `demo-memory.ts`: Extra `userId`, `taskId`, `tags`, `modelId`, `tokensUsed`, `importance`, `decay`
5. `demo-workflows.ts`: `ArtifactMeta` extra `description`; `type` values don't match `ARTIFACT_KIND` enum
6. `demo-models.ts`: `supportsToolUse` vs `supportsTools` naming mismatch
7. `demo-models.ts`: `tier` values (`'fast'`, `'quality'`, `'premium'`) not in `MODEL_TIER` enum
8. `demo-analytics.ts`: `ALL_DEMO` not a `Usage` entity
9. `mock-data.ts`: `mockWorkflows` missing `safetyClass`, `statusReason`, `activePlanRevisionId`
10. `mock-data.ts`: `mockTasks` `title`->`name`, `instruction`->`description`, `creditsUsed`->`costCredits`
11. `mock-data.ts`: `mockTasks` missing `dagLevel`, `modelAttempts`, `resolvedModelId`, `maxAttempts`, `statusReason`, `updatedAt`
12. `mock-data.ts`: `mockArtifacts` missing `taskId`, `workflowId`, `storageUrl`, `checksum`, `metadata`, `mimeType`
13. `mock-data.ts`: `mockClarifications` missing `taskId`, `answer`, `expiresInMinutes`, `answeredAt`, `expiredAt`
14. `mock-data.ts`: `mockConnectors` uses `name` as identifier; missing `config`
15. `mock-data.ts`: `mockMemoryEntries` shape mismatch (`key`/`value` vs `content`/`context`)
16. SSE events: `timestamp` vs `emittedAt` naming/type mismatch; untyped payload

### LOW (10 issues)
1. `demo-workflows.ts`: `ArtifactMeta` - `type` field naming (should be `kind` or `mimeType`)
2. `demo-analytics.ts`: `Budget` interface missing `periodStart`/`periodEnd`
3. `demo-workflows.ts`: `dagLevel` set to loop index `i` instead of actual topological depth
4. `demo-workflows.ts`: `toolCalls` uses `{ tool, calls }` but type requires `Record<string, unknown>[]`
5. Search results: `totalResults` fabricated value
6. Search results: Only 9 hardcoded queries
7. Search results: Fallback returns generic Google result for unmatched queries
8. Search results: Some result dates stale (2019)
9. `generateLLMChunk`: Returns empty/done chunks for indices past array length
10. `DEMO_USERS`: Org names fictional (`'Acme Corporation'`) don't match real-world user names

### INFO (3 issues)
1. `WorkflowTemplate` uses distinct vocabulary (`'search'`, `'analysis'`, `'synthesis'`) not required to match core enums
2. `generateLLMChunk` not re-exported from `mock/index.ts` (probably intentional)
3. `ALL_DEMO` analytics data is large (~1,200 lines) but well-structured

---

## 9. Recommendations

### Immediate (Critical/High)
1. Fix `types/index.ts` to re-export all core types from `types/entities.ts` and `types/enums.ts`
2. Fix `mock-data.ts` task ID prefix mismatch (`'ta-'` -> `'t-'`)
3. Align `DemoConnector` with `Connector` type or rename to avoid confusion
4. Align `MemoryEntry` with `EpisodicMemory`/`SemanticMemory` or split into separate types
5. Fix `mock-data.ts` enum violations (`'completed'` -> `'succeeded'`, `'operator'` -> `'admin'`/`'member'`, etc.)
6. Add `kind` field to `mockTasks`
7. Add missing required fields to `DemoUser` (`mfaEnabled`, `updatedAt`, `deletedAt`)
8. Fix `ArtifactMeta` to conform to `Artifact` type or use a different name

### Short-term (Medium)
9. Create demo data for missing entities: `Org`, `TaskAttempt`, `Clarification`, `AuditEvent`, `Event`
10. Align `ModelCard` with `ModelDefinition` or rename to `FrontendModel` for clarity
11. Fix `DemoSpace` to use `createdById` instead of `ownerId`
12. Fix `generateLLMChunk` edge case handling
13. Rename `BudgetExceeded` mock type to `BudgetEvent` for consistency with `BudgetEventType`

### Long-term (Low/Info)
14. Expand search result coverage beyond 9 queries
15. Improve `totalResults` calculation to be more realistic
16. Consider merging `mock-data.ts` and `demo-*` files to reduce duplication
17. Add referential integrity validation script

---

## 10. Final Score

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Export completeness | 10/10 | 15% | 1.50 |
| Entity coverage | 4/10 | 20% | 0.80 |
| Type conformance | 3/10 | 30% | 0.90 |
| SSE event validity | 4/10 | 20% | 0.80 |
| Search result quality | 7/10 | 15% | 1.05 |
| **TOTAL** | | | **5.05/10** |

**Overall Grade: D+** - Significant type mismatches, missing entity coverage, and critical compilation issues prevent this from being production-ready mock data.
