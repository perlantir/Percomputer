/**
 * API contract types for the Multi-Model Agent Orchestration Platform.
 *
 * Defines request DTOs, response DTOs, SSE event streams, and WebSocket
 * message envelopes.  All shapes are designed to mirror the OpenAPI spec
 * exactly.
 */

import type {
  WorkflowStatus,
  TaskStatus,
  ArtifactKind,
  ClarificationStatus,
  MemoryKind,
  SafetyClass,
  ModelTier,
} from './enums';
import type {
  WorkflowId,
  TaskId,
  ArtifactId,
  ClarificationId,
  SpaceId,
  ConnectorId,
  AuditEventId,
  UsageId,
  OrgId,
  UserId,
  PlanRevisionId,
  Workflow,
  Task,
  TaskEdge,
  Artifact,
  Clarification,
  Connector,
  AuditEvent,
  Usage,
  TokenUsage,
} from './entities';

// ════════════════════════════════════════════════════════════════════════════
// Workflow API
// ════════════════════════════════════════════════════════════════════════════

/** POST /workflows request body. */
export interface CreateWorkflowRequest {
  /** User prompt or objective that drives the workflow. */
  readonly prompt: string;
  /** Target workspace. */
  readonly spaceId: SpaceId;
  /** Optional explicit safety classification. */
  readonly safetyClass?: SafetyClass;
  /** Optional model tier hint for the orchestrator plan step. */
  readonly preferredModelTier?: ModelTier;
  /** Whether to require explicit user approval before executing the plan. */
  readonly requireApproval?: boolean;
}

/** POST /workflows response. */
export interface CreateWorkflowResponse {
  readonly workflowId: WorkflowId;
  readonly status: WorkflowStatus;
  readonly createdAt: string;
}

/** GET /workflows/:id response. */
export interface WorkflowDetailResponse {
  readonly workflow: Workflow;
  readonly tasks: readonly Task[];
  readonly edges: readonly TaskEdge[];
  readonly artifacts: readonly Artifact[];
  readonly clarifications: readonly Clarification[];
}

/** Single item in the workflow list. */
export interface WorkflowListItem {
  readonly id: WorkflowId;
  readonly prompt: string;
  readonly status: WorkflowStatus;
  readonly spaceId: SpaceId;
  readonly taskCount: number;
  readonly succeededTaskCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** GET /workspaces/:spaceId/workflows response. */
export interface WorkflowListResponse {
  readonly items: readonly WorkflowListItem[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** PATCH /workflows/:id/amend request body. */
export interface AmendWorkflowRequest {
  /** Updated user prompt (optional — may keep original). */
  readonly prompt?: string;
  /** Explicit instruction to add, remove, or modify tasks. */
  readonly instruction: string;
}

// ════════════════════════════════════════════════════════════════════════════
// SSE — Workflow Events (§9.1)
// ════════════════════════════════════════════════════════════════════════════

/** Base fields shared by every SSE event. */
interface WorkflowEventBase {
  readonly workflowId: WorkflowId;
  readonly emittedAt: string;
}

/** The workflow has been queued for planning. */
export interface WorkflowQueuedEvent extends WorkflowEventBase {
  readonly type: 'workflow_queued';
  readonly positionInQueue: number;
}

/** The orchestrator has started generating a plan. */
export interface WorkflowPlanningEvent extends WorkflowEventBase {
  readonly type: 'workflow_planning';
  readonly modelId: string;
}

/** The plan has been generated and is awaiting approval or execution. */
export interface WorkflowPlannedEvent extends WorkflowEventBase {
  readonly type: 'workflow_planned';
  readonly planRevisionId: PlanRevisionId;
  readonly taskCount: number;
}

/** The workflow has been explicitly paused by the user. */
export interface WorkflowPausedEvent extends WorkflowEventBase {
  readonly type: 'workflow_paused';
  readonly reason: string;
}

/** The workflow has resumed after a pause. */
export interface WorkflowResumedEvent extends WorkflowEventBase {
  readonly type: 'workflow_resumed';
}

/** The workflow completed successfully. */
export interface WorkflowCompletedEvent extends WorkflowEventBase {
  readonly type: 'workflow_completed';
  readonly durationMs: number;
}

/** The workflow failed and will not continue. */
export interface WorkflowFailedEvent extends WorkflowEventBase {
  readonly type: 'workflow_failed';
  readonly reason: string;
  readonly failingTaskId: TaskId | null;
}

/** The workflow is being cancelled. */
export interface WorkflowCancellingEvent extends WorkflowEventBase {
  readonly type: 'workflow_cancelling';
}

/** The workflow has been fully cancelled. */
export interface WorkflowCancelledEvent extends WorkflowEventBase {
  readonly type: 'workflow_cancelled';
  readonly reason: string;
}

/** A clarification has been requested from the user. */
export interface WorkflowClarificationEvent extends WorkflowEventBase {
  readonly type: 'workflow_clarification';
  readonly clarificationId: ClarificationId;
  readonly question: string;
}

/** Budget threshold has been breached. */
export interface WorkflowBudgetEvent extends WorkflowEventBase {
  readonly type: 'workflow_budget';
  readonly thresholdPercent: number;
  readonly currentCostCents: number;
  readonly budgetCents: number;
}

/** Discriminated union of all workflow-level SSE events. */
export type WorkflowEvent =
  | WorkflowQueuedEvent
  | WorkflowPlanningEvent
  | WorkflowPlannedEvent
  | WorkflowPausedEvent
  | WorkflowResumedEvent
  | WorkflowCompletedEvent
  | WorkflowFailedEvent
  | WorkflowCancellingEvent
  | WorkflowCancelledEvent
  | WorkflowClarificationEvent
  | WorkflowBudgetEvent;

/** Convenience alias — the full SSE envelope for workflows. */
export type WorkflowEventsSSE = WorkflowEvent;

// ════════════════════════════════════════════════════════════════════════════
// SSE — Task Events
// ════════════════════════════════════════════════════════════════════════════

/** A task changed status. */
export interface TaskStatusEvent {
  readonly type: 'task_status';
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly status: TaskStatus;
  readonly previousStatus: TaskStatus;
  readonly reason: string | null;
  readonly emittedAt: string;
}

/** A task is being executed by a specific model. */
export interface TaskRunningEvent {
  readonly type: 'task_running';
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly modelId: string;
  readonly attemptNumber: number;
  readonly emittedAt: string;
}

/** A task has produced a log / progress message. */
export interface TaskLogEvent {
  readonly type: 'task_log';
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly message: string;
  readonly emittedAt: string;
}

/** Discriminated union of all task-level SSE events. */
export type TaskEvent =
  | TaskStatusEvent
  | TaskRunningEvent
  | TaskLogEvent;

// ════════════════════════════════════════════════════════════════════════════
// SSE — Artifact Events
// ════════════════════════════════════════════════════════════════════════════

/** A new artifact has been generated by a task. */
export interface ArtifactCreatedEvent {
  readonly type: 'artifact_created';
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly artifactId: ArtifactId;
  readonly kind: ArtifactKind;
  readonly name: string;
  readonly previewUrl: string | null;
  readonly emittedAt: string;
}

/** An artifact preview has been updated (e.g. incremental markdown render). */
export interface ArtifactUpdatedEvent {
  readonly type: 'artifact_updated';
  readonly workflowId: WorkflowId;
  readonly artifactId: ArtifactId;
  readonly delta: string;
  readonly emittedAt: string;
}

/** Discriminated union of all artifact-level SSE events. */
export type ArtifactEvent =
  | ArtifactCreatedEvent
  | ArtifactUpdatedEvent;

// ════════════════════════════════════════════════════════════════════════════
// SSE — Clarification Events
// ════════════════════════════════════════════════════════════════════════════

/** Clarification status changed (e.g. user answered). */
export interface ClarificationStatusEvent {
  readonly type: 'clarification_status';
  readonly workflowId: WorkflowId;
  readonly clarificationId: ClarificationId;
  readonly status: ClarificationStatus;
  readonly answer: string | null;
  readonly emittedAt: string;
}

/** Discriminated union of all clarification SSE events. */
export type ClarificationEvent = ClarificationStatusEvent;

// ════════════════════════════════════════════════════════════════════════════
// SSE — Budget Events
// ════════════════════════════════════════════════════════════════════════════

/** Real-time budget consumption update. */
export interface BudgetEvent {
  readonly type: 'budget';
  readonly workflowId: WorkflowId;
  readonly currentCostCents: number;
  readonly budgetCents: number;
  readonly percentUsed: number;
  readonly emittedAt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// SSE — Synthesis Token Streaming
// ════════════════════════════════════════════════════════════════════════════

/** Incremental token stream for the final synthesis / report generation step. */
export interface SynthesisTokenEvent {
  readonly type: 'synthesis_token';
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly token: string;
  readonly emittedAt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// SSE — Unified Event Union
// ════════════════════════════════════════════════════════════════════════════

/** Every possible event type that may flow over the SSE channel. */
export type ServerSentEvent =
  | WorkflowEvent
  | TaskEvent
  | ArtifactEvent
  | ClarificationEvent
  | BudgetEvent
  | SynthesisTokenEvent;

// ════════════════════════════════════════════════════════════════════════════
// Artifact API
// ════════════════════════════════════════════════════════════════════════════

/** GET /artifacts/:id response. */
export interface ArtifactResponse {
  readonly id: ArtifactId;
  readonly name: string;
  readonly kind: ArtifactKind;
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly storageUrl: string;
  readonly sizeBytes: number;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Space API
// ════════════════════════════════════════════════════════════════════════════

/** GET /spaces/:id response. */
export interface SpaceResponse {
  readonly id: SpaceId;
  readonly name: string;
  readonly orgId: OrgId;
  readonly description: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** GET /spaces response. */
export interface SpaceListResponse {
  readonly items: readonly SpaceResponse[];
  readonly total: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Connector API
// ════════════════════════════════════════════════════════════════════════════

/** GET /connectors/:id response. */
export interface ConnectorResponse {
  readonly id: ConnectorId;
  readonly name: string;
  readonly type: string;
  readonly orgId: OrgId;
  readonly spaceId: SpaceId | null;
  readonly healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  readonly lastTestedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** GET /connectors response. */
export interface ConnectorListResponse {
  readonly items: readonly ConnectorResponse[];
  readonly total: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Memory API
// ════════════════════════════════════════════════════════════════════════════

/** GET /memory/:id response. */
export interface MemoryEntryResponse {
  readonly id: string;
  readonly kind: MemoryKind;
  readonly orgId: OrgId;
  readonly spaceId: SpaceId | null;
  readonly content: string;
  readonly context: Record<string, unknown> | null;
  readonly createdAt: string;
}

/** GET /memory response. */
export interface MemoryListResponse {
  readonly items: readonly MemoryEntryResponse[];
  readonly total: number;
  readonly query: string;
  readonly similarityThreshold: number;
}

// ════════════════════════════════════════════════════════════════════════════
// Usage API
// ════════════════════════════════════════════════════════════════════════════

/** GET /usage response item. */
export interface UsageResponse {
  readonly id: UsageId;
  readonly orgId: OrgId;
  readonly workflowId: WorkflowId | null;
  readonly taskId: TaskId | null;
  readonly modelId: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly estimatedCostCents: number;
  readonly recordedAt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Audit API
// ════════════════════════════════════════════════════════════════════════════

/** GET /audit response item. */
export interface AuditEventResponse {
  readonly id: AuditEventId;
  readonly orgId: OrgId;
  readonly actorId: UserId | 'system';
  readonly category: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly description: string;
  readonly occurredAt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// WebSocket Messages
// ════════════════════════════════════════════════════════════════════════════

/** Base envelope for every WebSocket message sent by the client. */
interface WebSocketMessageBase {
  readonly messageId: string;
  readonly sentAt: string;
}

/** Client provides an answer to a pending clarification request. */
export interface ClarificationAnswerMessage extends WebSocketMessageBase {
  readonly type: 'clarification_answer';
  readonly workflowId: WorkflowId;
  readonly clarificationId: ClarificationId;
  readonly answer: string;
}

/** Client approves a plan revision, allowing execution to proceed. */
export interface ApprovalMessage extends WebSocketMessageBase {
  readonly type: 'approval';
  readonly workflowId: WorkflowId;
  readonly planRevisionId: PlanRevisionId;
  readonly approved: boolean;
  readonly reason?: string;
}

/** Client requests cancellation of a running workflow. */
export interface CancelMessage extends WebSocketMessageBase {
  readonly type: 'cancel';
  readonly workflowId: WorkflowId;
  readonly reason?: string;
}

/** Client requests an in-flight workflow amendment (re-planning). */
export interface AmendMessage extends WebSocketMessageBase {
  readonly type: 'amend';
  readonly workflowId: WorkflowId;
  readonly instruction: string;
}

/** Client overrides the model selection for a specific task. */
export interface ModelOverrideMessage extends WebSocketMessageBase {
  readonly type: 'model_override';
  readonly workflowId: WorkflowId;
  readonly taskId: TaskId;
  readonly modelId: string;
}

/** Discriminated union of all client-to-server WebSocket messages. */
export type WebSocketMessage =
  | ClarificationAnswerMessage
  | ApprovalMessage
  | CancelMessage
  | AmendMessage
  | ModelOverrideMessage;
