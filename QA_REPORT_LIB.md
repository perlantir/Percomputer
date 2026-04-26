# TypeScript Quality Audit Report — `src/lib/`

**Audited Files:** 10  
**Date:** 2024  
**Auditor:** TypeScript Quality Auditor  
**Severity Legend:**
- 🔴 **Critical** — Runtime crash, data corruption, or security vulnerability likely
- 🟠 **High** — Type safety broken, silent failures possible, or significant maintenance burden
- 🟡 **Medium** — Poor type hygiene, unnecessary casts, or missing contracts
- 🟢 **Low** — Style/strictness issues, cosmetic fixes recommended

---

## 1. `utils.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 4 | 🟢 Low | `cn(...)` has implicit return type `string` | Add explicit return type `: string` for clarity |

**Verdict:** Clean. No unsafe casts, no `any`, no `unknown`. Minor style issue only.

---

## 2. `workflow-simulator.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 132 | 🟠 High | `planRevisionId: revisionId as any` — branded ID cast to `any` | Cast to `PlanRevisionId` instead: `revisionId as PlanRevisionId` |
| 140 | 🟠 High | `failingTaskId: failingTaskId as any` — branded ID cast to `any` | Cast to `TaskId` instead: `failingTaskId as TaskId` |
| 186 | 🟠 High | `artifactId: artifactId as any` — branded ID cast to `any` | Cast to `ArtifactId` instead: `artifactId as ArtifactId` |
| 207 | 🟡 Medium | `buildSimulation()` lacks return type annotation | Add `: SimState` return type |
| 253 | 🟡 Medium | `runSimulation()` parameters `onEvent` and `cfg` are optional but default is used internally without null-check | Consider making `onEvent` required or adding `?? () => {}` fallback |
| 326 | 🟠 High | Non-null assertion `state.taskMap.get(state.failedTaskId)!` | Use proper null check; throw descriptive error if task missing |
| 329–404 | 🟡 Medium | `suggestResearchPlan()`, `suggestDataAnalysisPlan()`, `suggestCodePlan()`, `autoSuggestPlan()` lack return types | Add explicit return types (e.g., `{ tasks: Omit<TaskSpec, 'input'>[]; edges: TaskEdgeSpec[] }`) |
| 362 | 🟡 Medium | `const taskId = id(...)` returns `string` but is cast to `TaskId` in event builders via `as TaskId` | Use a branded ID helper or accept that simulation uses plain strings internally |
| 415 | 🟡 Medium | Retry logic uses `task.attemptNumber + 1 < task.maxAttempts` — maxAttempts can be `null` per `TaskConstraints` | Ensure `maxAttempts` defaults to a number before comparison; currently template guarantees it but type allows null |
| 433 | 🟡 Medium | `task.finishedAt - (task.startedAt ?? task.finishedAt)` — fallback is slightly confusing | Add comment or use explicit null-safe calculation |
| 654 | 🟡 Medium | `simulateWorkflowStream` generator has `AsyncGenerator<ServerSentEvent, void, unknown>` — `unknown` is unused | Use `AsyncGenerator<ServerSentEvent>` if no yield input needed |
| 668 | 🟡 Medium | Magic number `10000` as safety limit without constant | Extract as `MAX_STREAM_EVENTS = 10000` |
| 217 | 🟢 Low | `t.constraints.preferredTier ?? null` — `preferredTier` is typed `ModelTier \| null`, unnecessary nullish coalescing | Remove `?? null`; the type already allows `null` |

**Verdict:** Multiple `as any` casts on branded IDs, missing return types, and a non-null assertion. Core logic is sound but type discipline is weakened.

---

## 3. `task-templates.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 16 | 🟡 Medium | `config?: Record<string, unknown>` — `unknown` is acceptable but could be more specific | If tool configs are known, define per-tool config interfaces; otherwise document why `unknown` is intentional |
| 286 | 🟡 Medium | `getTaskTemplate(kind: TaskKind): TaskTemplate` — throws `Error` instead of returning a result type | Consider `TaskTemplate \| undefined` or a branded error for callers that want to handle missing templates |
| 298 | 🟡 Medium | `buildTaskSpec` return type `Omit<TaskSpec, 'input'>` does not include the required `input` field | Either add `input: { fromArtifacts: [], fromTasks: [], fromMemory: [] }` to the return, or change return type to `Partial<TaskSpec>` |
| 329–404 | 🟡 Medium | `suggestResearchPlan`, `suggestDataAnalysisPlan`, `suggestCodePlan`, `autoSuggestPlan` all lack return type annotations | Add explicit return types for plan structure |
| 41 | 🟢 Low | `TEMPLATES` is `Record<TaskKind, TaskTemplate>` but no exhaustiveness check at compile time | Fine as-is since `TASK_KIND` array is const; add `satisfies` if using TS 4.9+ for extra safety |

**Verdict:** Missing return types and a partial `TaskSpec` being returned without the required `input` field. Otherwise clean.

---

## 4. `model-router.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 367 | 🟡 Medium | `MODEL_ROSTER` ends with `as const` but type is `readonly ModelDefinition[]` — the `as const` narrows strings but then is widened by the explicit type | Remove explicit type annotation and let `as const` infer, or use `satisfies readonly ModelDefinition[]` |
| 386 | 🟡 Medium | `resolveTier` parameter `hint?: ModelTier \| null` — optional + null is redundant | Use `hint?: ModelTier` and handle undefined; or use `hint: ModelTier \| null` without optional |
| 469 | 🟡 Medium | `getModelById(id: string)` — takes plain `string` instead of branded model ID | If model IDs are ever branded, use the branded type; otherwise document |
| 491–494 | 🟡 Medium | `estimateCost` takes `modelId: string`, `promptTokens: number`, `completionTokens: number` — no validation that tokens are non-negative | Add runtime validation or at least document expectations |
| 542 | 🟡 Medium | `simulateLatency` takes `modelId: string` and `speedMultiplier = 1.0` — no validation | Document parameter constraints |
| 430–453 | 🟢 Low | `rankModels` scoring uses inline arithmetic with magic numbers | Extract scoring weights as named constants |
| 25–38 | 🟢 Low | `caps(partial: Partial<ModelCapabilities>)` — `Partial` allows omitting every field | Acceptable since all fields default to `false`; add comment confirming intent |

**Verdict:** Well-structured. Minor issues with parameter branding and redundant optionality. No `any` or `unknown` abuse.

---

## 5. `tool-gateway.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 14 | 🟡 Medium | `ToolResult<T = unknown>` — default generic is `unknown` | Acceptable but document that callers should specify `T`; consider `T = never` to force explicit typing |
| 321 | 🟠 High | `new URL(url)` in `webFetch` can throw if `url` is malformed | Wrap in `try/catch` and return `fail(...)` with URL parse error |
| 339 | 🟠 High | `r.data as WebFetchResult` — unchecked cast after `r.success && r.data` check | `r.data` is typed `T \| null`; after `r.success`, it should be `T`, but `r.success` does not narrow `data` in the type system | Redesign `ToolResult` as a discriminated union so success narrows `data` to non-null `T` |
| 446 | 🟠 High | `invokeTool` arguments cast without validation: `args.urls as string[]`, `args.runtime as ...`, `args.operation as ...` | Add runtime validation before casting (e.g., `Array.isArray`, runtime enum check) |
| 454 | 🟠 High | `args.urls as string[]` — no validation that all elements are strings | Use `Array.isArray(args.urls) && args.urls.every(u => typeof u === 'string')` |
| 456 | 🟠 High | `args.runtime as 'python' \| 'node' \| 'bash'` — unchecked cast from `unknown` | Validate against allowed runtime values before casting |
| 460 | 🟠 High | `args.operation as 'read' \| 'write' \| 'append'` — unchecked cast from `unknown` | Validate against allowed operations before casting |
| 473–487 | 🟡 Medium | `formatToolResult` uses `result.data` directly without null check in `JSON.stringify(result.data, null, 2)` | Add null check: `result.data !== null ? JSON.stringify(result.data, null, 2) : ''` |
| 229 | 🟡 Medium | `globalConfig` is mutable module-level state | Consider making it immutable or wrapping in a class/singleton with controlled mutation |

**Verdict:** Significant type-safety issues around unchecked casts from `Record<string, unknown>` and missing runtime validation in `invokeTool`. The `ToolResult` type design prevents proper narrowing.

---

## 6. `api-utils.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 54 | 🟠 High | `context: { params: any }` — explicit `any` usage | Replace with `context: { params: Record<string, string \| string[]> }` or Next.js native `SegmentConfig` type |
| 17 | 🟡 Medium | `getAuthContext` returns union `AuthContext \| NextResponse` — callers must `instanceof` check | Consider using a Result/Either type or throwing to force error handling at the call site |
| 64 | 🟡 Medium | `withErrorHandler<T>` — `error` is typed `unknown` but only checked with `instanceof Error` | Good practice; but `catch (error: unknown)` is redundant in TS — `catch` already binds `unknown` |
| 78 | 🟡 Medium | `jsonResponse(body: unknown, ...)` — `unknown` is acceptable for generic JSON but could allow anything | Add `body: JsonValue` or use `zod` to validate if strictness is required |
| 92 | 🟡 Medium | `sseStream` generator callback receives `send` and `close` without error handling for `send` after `close` | `send` checks `closed` flag, which is good; document the contract |
| 136 | 🟢 Low | `validateRequest<T>` — generic `T` is well bounded by `ZodSchema<T>` | No issue; good generic usage |
| 161 | 🟢 Low | `parseQueryParams` returns `Record<string, string>` — query params can be arrays | Document that this function coalesces or only returns first occurrence |

**Verdict:** The `any` in `withAuth` is the critical issue. Otherwise well-structured with good error handling and generic usage.

---

## 7. `mock-db.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 29–37 | 🟠 High | Map key types are `string` instead of branded ID types (`WorkflowId`, `TaskId`, etc.) | Use branded types for keys to prevent cross-entity assignment bugs |
| 41–49 | 🟠 High | Entity property names use `snake_case` (e.g., `w.id`, `w.org_id`, `w.space_id`) but `entities.ts` defines `camelCase` (`orgId`, `spaceId`, `createdById`, etc.) | **Schema mismatch:** Align mock data with entity types, or create a separate DB entity interface if snake_case is required |
| 70 | 🟠 High | `w.org_id === opts.orgId` — comparing `string` to `OrgId` branded type (may fail at runtime or type-check inconsistently) | Ensure mock data and entity types use consistent casing and branding |
| 79 | 🟡 Medium | `opts.kind as any` — unnecessary cast | Remove cast; if `kind` is `string`, use `kind: string` in filter or validate against `ArtifactKind` |
| 101 | 🟡 Medium | `createWorkflow` takes `Omit<Workflow, "id" | "created_at" | "updated_at" | "current_plan_version">` but entity type uses `camelCase` (`createdAt`, `updatedAt`) | Fix property names to match entity types |
| 393 | 🟡 Medium | `appendWorkflowEvent(workflowId: string, event: WorkflowEvent)` — `workflowId` is plain `string` | Use `WorkflowId` branded type |
| 399 | 🟡 Medium | `getWorkflowEvents` returns `WorkflowEvent[]` but the type from `api.ts` is a discriminated union; the stored list might mix types | This is acceptable as a union, but consider if the map should be `Map<WorkflowId, ServerSentEvent[]>` instead |
| 232 | 🟡 Medium | `installConnector` sets `revoked_at: undefined, error_message: undefined` — explicit `undefined` is unusual | Use `null` or omit properties to match `Connector` type |
| 28 | 🟢 Low | `class MockDB` is not exported | Fine if only `db` instance is exported; document the singleton pattern |

**Verdict:** **Critical schema mismatch** between entity types (camelCase) and mock DB (snake_case). This will cause type errors and runtime issues when the mock data is used with typed interfaces. Branded ID types are not used consistently.

---

## 8. `auth.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 10 | 🟡 Medium | `JWT_SECRET` falls back to hardcoded `"dev-secret-change-me"` | Add runtime warning when fallback is used; consider throwing in production |
| 24 | 🟡 Medium | `parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10)` — `NaN` possible if env var is non-numeric | Validate with `z.coerce.number().min(4).max(20).default(12)` or similar |
| 36 | 🟢 Low | `verifyToken` returns `TokenPayload \| null` — `null` is acceptable sentinel | Consider returning a `Result<TokenPayload, TokenError>` for richer error info |
| 33 | 🟢 Low | `expiresIn: JWT_EXPIRES_IN` — string value not validated against JWT expected format | Use `z.enum(["1h", "7d", "30d"]).default("7d")` or validate format |

**Verdict:** Clean, well-typed. Good use of zod for token payload validation. Minor env var validation issues.

---

## 9. `db.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 3 | 🟡 Medium | `globalThis as unknown as { prisma: PrismaClient \| undefined }` — `unknown` cast is necessary but avoidable | Add a `global.d.ts` declaration file to extend `globalThis` with `prisma` instead of casting |
| 7 | 🟢 Low | No `PrismaClient` configuration options (logging, connection pooling) | Document that defaults are intentional or add configuration object |

**Verdict:** Very short file. The `unknown` cast is standard for Next.js Prisma pattern but can be improved with a declaration file.

---

## 10. `cytoscape-config.ts`

| Line | Severity | Issue | Fix Recommendation |
|------|----------|-------|-------------------|
| 7 | 🟡 Medium | `TASK_KIND_SHAPES: Record<string, string>` instead of `Record<TaskKind, string>` | Use `Record<TaskKind, string>` for compile-time exhaustiveness checking |
| 20 | 🟡 Medium | `STATUS_COLORS: Record<string, ...>` instead of `Record<TaskStatus, ...>` | Use `Record<TaskStatus, ...>` to ensure all statuses are styled |
| 28 | 🟡 Medium | `EDGE_STYLES: Record<string, ...>` instead of `Record<EdgeType, ...>` | Use `Record<EdgeType, ...>` for type safety |
| 215 | 🟡 Medium | `DAGRE_LAYOUT_OPTIONS as unknown as cytoscape.LayoutOptions` — unnecessary `unknown` + `as` | Check if `dagre.DagreLayoutOptions` is structurally compatible; if so, the cast might be unnecessary with proper typing |
| 251–279 | 🟠 High | `TaskNode`, `TaskEdge`, `ToolCall` interfaces use multiple `any` fields | Replace `any` with proper types: `result?: TaskResult`, `input: ToolInput`, `output?: ToolOutput`, `metadata?: Record<string, JsonValue>` |
| 260 | 🟠 High | `result?: any` in `TaskNode` | Replace with a proper result type from the orchestrator types |
| 262 | 🟠 High | `metadata?: Record<string, any>` | Replace `any` with `unknown` or a specific metadata interface |
| 275 | 🟠 High | `input: any` in `ToolCall` | Replace with `Record<string, unknown>` or a specific tool input interface |
| 276 | 🟠 High | `output?: any` in `ToolCall` | Replace with `ToolResult<unknown>` or specific output type |
| 291–317 | 🟡 Medium | `nodesToCytoscape` accesses `STATUS_COLORS[task.status]` and `TASK_KIND_SHAPES[task.kind]` with `||` fallback | Fine at runtime, but using branded types for `TaskNode` fields would catch issues earlier |
| 7–18 | 🟡 Medium | `image_edit` is missing from `TASK_KIND_SHAPES` | Add `image_edit: 'rectangle'` (or appropriate shape) to ensure all task kinds are mapped |

**Verdict:** Heavy use of `any` in data model interfaces. Record key types are too loose. Missing `image_edit` shape mapping.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 14 |
| 🟡 Medium | 28 |
| 🟢 Low | 13 |
| **Total Issues** | **55** |

### Files Ranked by Risk

| Rank | File | High | Medium | Risk Level |
|------|------|------|--------|------------|
| 1 | `mock-db.ts` | 3 | 5 | **🔴 Severe** — Schema mismatch (snake_case vs camelCase) |
| 2 | `cytoscape-config.ts` | 5 | 4 | **🟠 High** — Multiple `any` fields in public interfaces |
| 3 | `tool-gateway.ts` | 4 | 4 | **🟠 High** — Unchecked casts from `unknown` |
| 4 | `workflow-simulator.ts` | 3 | 7 | **🟠 High** — Branded ID `as any` casts |
| 5 | `api-utils.ts` | 1 | 4 | **🟡 Moderate** — `params: any` in auth wrapper |
| 6 | `task-templates.ts` | 0 | 4 | **🟡 Moderate** — Missing return types, partial TaskSpec |
| 7 | `model-router.ts` | 0 | 6 | **🟡 Low** — Minor type hygiene issues |
| 8 | `auth.ts` | 0 | 2 | **🟢 Low** — Env var validation |
| 9 | `db.ts` | 0 | 1 | **🟢 Low** — Standard Prisma pattern |
| 10 | `utils.ts` | 0 | 0 | **🟢 Clean** — No issues of note |

### Top Priority Fixes

1. **Fix `mock-db.ts` entity property names** — The snake_case vs camelCase mismatch will cause cascading type errors across the entire application.
2. **Remove `any` from `cytoscape-config.ts` interfaces** — `TaskNode`, `ToolCall`, and related interfaces are used in the frontend; `any` defeats strict mode.
3. **Redesign `ToolResult` as discriminated union** — This would enable proper type narrowing and eliminate the need for unchecked casts in `tool-gateway.ts`.
4. **Add runtime validation in `invokeTool`** — All arguments from `Record<string, unknown>` must be validated before casting.
5. **Replace `as any` with proper branded casts in `workflow-simulator.ts`** — Lines 132, 140, 186.
6. **Fix `params: any` in `withAuth`** — Use Next.js proper param types.
