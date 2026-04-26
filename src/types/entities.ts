/**
 * Core entity types for the Multi-Model Agent Orchestration Platform.
 *
 * These interfaces mirror the Prisma database schema but are expressed as
 * pure TypeScript types for use across the stack (API, frontend, workers).
 *
 * All timestamp fields use ISO-8601 strings.  IDs are branded strings
 * to prevent accidental cross-table assignment.
 */

import type {
  WorkflowStatus,
  TaskStatus,
  TaskKind,
  EdgeType,
  AttemptStatus,
  ArtifactKind,
  ClarificationStatus,
  MemoryKind,
  SafetyClass,
  UserRole,
} from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// Branded ID types
// ─────────────────────────────────────────────────────────────────────────────

/** Unique identifier for a user record. */
export type UserId = string & { readonly __brand: 'UserId' };

/** Unique identifier for an organisation record. */
export type OrgId = string & { readonly __brand: 'OrgId' };

/** Unique identifier for a workspace / space record. */
export type SpaceId = string & { readonly __brand: 'SpaceId' };

/** Unique identifier for a workflow record. */
export type WorkflowId = string & { readonly __brand: 'WorkflowId' };

/** Unique identifier for a task record. */
export type TaskId = string & { readonly __brand: 'TaskId' };

/** Unique identifier for a task edge (DAG edge) record. */
export type TaskEdgeId = string & { readonly __brand: 'TaskEdgeId' };

/** Unique identifier for a task attempt record. */
export type AttemptId = string & { readonly __brand: 'AttemptId' };

/** Unique identifier for an artifact record. */
export type ArtifactId = string & { readonly __brand: 'ArtifactId' };

/** Unique identifier for a plan revision record. */
export type PlanRevisionId = string & { readonly __brand: 'PlanRevisionId' };

/** Unique identifier for a clarification request record. */
export type ClarificationId = string & { readonly __brand: 'ClarificationId' };

/** Unique identifier for an episodic memory record. */
export type EpisodicMemoryId = string & { readonly __brand: 'EpisodicMemoryId' };

/** Unique identifier for a semantic memory record. */
export type SemanticMemoryId = string & { readonly __brand: 'SemanticMemoryId' };

/** Unique identifier for an audit event record. */
export type AuditEventId = string & { readonly __brand: 'AuditEventId' };

/** Unique identifier for a connector configuration record. */
export type ConnectorId = string & { readonly __brand: 'ConnectorId' };

/** Unique identifier for a usage / billing record. */
export type UsageId = string & { readonly __brand: 'UsageId' };

// ─────────────────────────────────────────────────────────────────────────────
// User & Organisation
// ─────────────────────────────────────────────────────────────────────────────

/** Platform user account. */
export interface User {
  readonly id: UserId;
  /** Human-readable display name. */
  readonly name: string;
  /** Unique email address used for authentication. */
  readonly email: string;
  /** Organisation this user belongs to. */
  readonly orgId: OrgId;
  /** Role determining permissions within the org. */
  readonly role: UserRole;
  /** Avatar image URL (optional). */
  readonly avatarUrl: string | null;
  /** Whether MFA is enabled for this account. */
  readonly mfaEnabled: boolean;
  /** ISO-8601 timestamp of account creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last account update. */
  readonly updatedAt: string;
  /** Soft-delete timestamp, null if active. */
  readonly deletedAt: string | null;
}

/** Organisation (tenant) boundary for data isolation. */
export interface Org {
  readonly id: OrgId;
  /** Display name of the organisation. */
  readonly name: string;
  /** Unique slug used in URLs. */
  readonly slug: string;
  /** Billing tier or plan identifier. */
  readonly plan: string;
  /** Per-org feature flags (e.g. "beta_dag_viz"). */
  readonly featureFlags: readonly string[];
  /** ISO-8601 timestamp of org creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last org update. */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Space (Workspace)
// ─────────────────────────────────────────────────────────────────────────────

/** A workspace (project) within an organisation. */
export interface Space {
  readonly id: SpaceId;
  /** Human-readable space name. */
  readonly name: string;
  /** Parent organisation. */
  readonly orgId: OrgId;
  /** User who created the space. */
  readonly createdById: UserId;
  /** Optional description. */
  readonly description: string | null;
  /** ISO-8601 timestamp of space creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last space update. */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow
// ─────────────────────────────────────────────────────────────────────────────

/** Top-level orchestration unit — a user request translated into a DAG of tasks. */
export interface Workflow {
  readonly id: WorkflowId;
  /** User-supplied prompt or objective that initiated the workflow. */
  readonly prompt: string;
  /** Current lifecycle state. */
  readonly status: WorkflowStatus;
  /** Space that owns this workflow. */
  readonly spaceId: SpaceId;
  /** User who created the workflow. */
  readonly createdById: UserId;
  /** Currently active plan revision, if any. */
  readonly activePlanRevisionId: PlanRevisionId | null;
  /** Safety classification governing review gates. */
  readonly safetyClass: SafetyClass;
  /** Reason for failure or cancellation, if terminal. */
  readonly statusReason: string | null;
  /** ISO-8601 timestamp when execution started. */
  readonly startedAt: string | null;
  /** ISO-8601 timestamp when execution finished (success or failure). */
  readonly finishedAt: string | null;
  /** ISO-8601 timestamp of workflow creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last workflow update. */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task
// ─────────────────────────────────────────────────────────────────────────────

/** Single node in the workflow DAG representing an agent invocation. */
export interface Task {
  readonly id: TaskId;
  /** Human-readable title summarising the task objective. */
  readonly title: string;
  /** Detailed instructions or prompt sent to the model. */
  readonly instruction: string;
  /** Taxonomic kind determining tool and model selection. */
  readonly kind: TaskKind;
  /** Current execution status. */
  readonly status: TaskStatus;
  /** Parent workflow. */
  readonly workflowId: WorkflowId;
  /** Position in the DAG for visual layout. */
  readonly dagLevel: number;
  /** Ordered list of model IDs attempted (for routing history). */
  readonly modelAttempts: readonly string[];
  /** Model ID that produced the successful result, if any. */
  readonly resolvedModelId: string | null;
  /** Maximum attempts before escalation. */
  readonly maxAttempts: number;
  /** Reason for terminal status (failure, skip, etc.). */
  readonly statusReason: string | null;
  /** Prompt tokens consumed by this task. */
  readonly inputTokens: number;
  /** Completion tokens produced by this task. */
  readonly outputTokens: number;
  /** Credits billed for this task execution. */
  readonly creditsUsed: number;
  /** Wall-clock duration in milliseconds. */
  readonly durationMs: number;
  /** IDs of tasks this task depends on (derived from edges). */
  readonly dependencies: readonly string[];
  /** Tool calls emitted during execution. */
  readonly toolCalls: readonly Record<string, unknown>[];
  /** ISO-8601 timestamp when task execution started. */
  readonly startedAt: string | null;
  /** ISO-8601 timestamp when task execution finished. */
  readonly finishedAt: string | null;
  /** ISO-8601 timestamp of task creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last task update. */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskEdge
// ─────────────────────────────────────────────────────────────────────────────

/** Directed edge connecting two tasks in the workflow DAG. */
export interface TaskEdge {
  readonly id: TaskEdgeId;
  /** Source task (producer / predecessor). */
  readonly fromTaskId: TaskId;
  /** Target task (consumer / successor). */
  readonly toTaskId: TaskId;
  /** Parent workflow. */
  readonly workflowId: WorkflowId;
  /** Semantics of the dependency. */
  readonly edgeType: EdgeType;
  /** JSONPath or key expression for data routing (when edgeType === 'data'). */
  readonly dataMapping: string | null;
  /** Conditional predicate in JSON Logic format (when edgeType === 'conditional'). */
  readonly condition: Record<string, unknown> | null;
  /** ISO-8601 timestamp of edge creation. */
  readonly createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskAttempt
// ─────────────────────────────────────────────────────────────────────────────

/** A single invocation (possibly one of many retries) of a task. */
export interface TaskAttempt {
  readonly id: AttemptId;
  /** Parent task. */
  readonly taskId: TaskId;
  /** Attempt sequence number (1-based). */
  readonly attemptNumber: number;
  /** Model identifier used for this attempt. */
  readonly modelId: string;
  /** Current status of this attempt. */
  readonly status: AttemptStatus;
  /** Raw model output (truncated for large responses). */
  readonly output: string | null;
  /** Structured tool calls emitted by the model. */
  readonly toolCalls: readonly Record<string, unknown>[];
  /** Error message if the attempt failed. */
  readonly errorMessage: string | null;
  /** Error code for programmatic handling. */
  readonly errorCode: string | null;
  /** Token usage for this attempt. */
  readonly tokenUsage: TokenUsage | null;
  /** ISO-8601 timestamp when the attempt started. */
  readonly startedAt: string;
  /** ISO-8601 timestamp when the attempt finished. */
  readonly finishedAt: string | null;
}

/** Token consumption breakdown for a model invocation. */
export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artifact
// ─────────────────────────────────────────────────────────────────────────────

/** Generated deliverable produced by a task (report, image, dataset, etc.). */
export interface Artifact {
  readonly id: ArtifactId;
  /** Human-readable name. */
  readonly name: string;
  /** MIME-like kind for rendering strategy. */
  readonly kind: ArtifactKind;
  /** Task that produced this artifact. */
  readonly taskId: TaskId | null;
  /** Workflow this artifact belongs to. */
  readonly workflowId: WorkflowId;
  /** Publicly accessible URL (signed, time-limited). */
  readonly storageUrl: string;
  /** File size in bytes. */
  readonly sizeBytes: number;
  /** SHA-256 checksum for integrity verification. */
  readonly checksum: string | null;
  /** Optional metadata (dimensions for images, rows for CSV, etc.). */
  readonly metadata: Record<string, unknown> | null;
  /** MIME type for the artifact content. */
  readonly mimeType: string;
  /** ISO-8601 timestamp of artifact creation. */
  readonly createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanRevision
// ─────────────────────────────────────────────────────────────────────────────

/** Snapshot of the DAG plan at a specific version (allows replanning / amending). */
export interface PlanRevision {
  readonly id: PlanRevisionId;
  /** Parent workflow. */
  readonly workflowId: WorkflowId;
  /** Monotonically increasing version number. */
  readonly version: number;
  /** Human-readable reason for this revision. */
  readonly reason: string;
  /** Number of tasks added in this revision. */
  readonly addedTasks: number;
  /** Number of tasks removed in this revision. */
  readonly removedTasks: number;
  /** JSON representation of the DAG (nodes + edges). */
  readonly dagJson: Record<string, unknown>;
  /** Model identifier used to generate this plan. */
  readonly plannedByModelId: string;
  /** ISO-8601 timestamp when this revision was created. */
  readonly createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clarification
// ─────────────────────────────────────────────────────────────────────────────

/** Question posed to the user when the plan is ambiguous or underspecified. */
export interface Clarification {
  readonly id: ClarificationId;
  /** Parent workflow. */
  readonly workflowId: WorkflowId;
  /** Task that requested clarification (null if workflow-level). */
  readonly taskId: TaskId | null;
  /** Question text shown to the user. */
  readonly question: string;
  /** Current lifecycle state. */
  readonly status: ClarificationStatus;
  /** User's answer, once provided. */
  readonly answer: string | null;
  /** Number of minutes before the clarification expires. */
  readonly expiresInMinutes: number;
  /** ISO-8601 timestamp when the clarification was requested. */
  readonly createdAt: string;
  /** ISO-8601 timestamp when the user answered. */
  readonly answeredAt: string | null;
  /** ISO-8601 timestamp when the clarification expired. */
  readonly expiredAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory
// ─────────────────────────────────────────────────────────────────────────────

/** Record of a specific agent session or episode for retrieval-augmented context. */
export interface EpisodicMemory {
  readonly id: EpisodicMemoryId;
  /** Memory layer classification — always 'episodic' here. */
  readonly kind: MemoryKind;
  /** Org-scoped namespace for memory isolation. */
  readonly orgId: OrgId;
  /** Space-scoped namespace for finer isolation. */
  readonly spaceId: SpaceId | null;
  /** Free-text query / summary of the episode. */
  readonly content: string;
  /** Embedding vector for semantic search (optional, may be lazy-loaded). */
  readonly embedding: readonly number[] | null;
  /** Source workflow that produced this memory. */
  readonly workflowId: WorkflowId | null;
  /** JSON-serialisable context payload. */
  readonly context: Record<string, unknown> | null;
  /** ISO-8601 timestamp of memory creation. */
  readonly createdAt: string;
}

/** Long-term factual knowledge extracted from workflows and external sources. */
export interface SemanticMemory {
  readonly id: SemanticMemoryId;
  /** Memory layer classification — always 'semantic' here. */
  readonly kind: MemoryKind;
  /** Org-scoped namespace for memory isolation. */
  readonly orgId: OrgId;
  /** Space-scoped namespace for finer isolation. */
  readonly spaceId: SpaceId | null;
  /** Canonical subject or entity name. */
  readonly subject: string;
  /** Predicate or relation. */
  readonly predicate: string;
  /** Object or value of the relation. */
  readonly object: string;
  /** Embedding vector for semantic search. */
  readonly embedding: readonly number[] | null;
  /** Confidence score (0–1). */
  readonly confidence: number;
  /** ISO-8601 timestamp of memory creation. */
  readonly createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit & Governance
// ─────────────────────────────────────────────────────────────────────────────

/** Immutable log entry for compliance, security review, and debugging. */
export interface AuditEvent {
  readonly id: AuditEventId;
  /** Organisation scope. */
  readonly orgId: OrgId;
  /** Actor who triggered the event (user ID or 'system'). */
  readonly actorId: UserId | 'system';
  /** High-level category for filtering. */
  readonly category: string;
  /** Specific action that occurred. */
  readonly action: string;
  /** Affected resource type. */
  readonly resourceType: string;
  /** Affected resource identifier. */
  readonly resourceId: string;
  /** Human-readable description. */
  readonly description: string;
  /** Full event payload. */
  readonly metadata: Record<string, unknown>;
  /** Client IP address (hashed for GDPR compliance). */
  readonly ipHash: string | null;
  /** ISO-8601 timestamp of the event. */
  readonly occurredAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event
// ─────────────────────────────────────────────────────────────────────────────

/** Discrete event emitted during workflow execution for observability. */
export interface Event {
  readonly id: string;
  /** Parent workflow. */
  readonly workflowId: WorkflowId;
  /** Event type discriminator (e.g. 'task_started', 'artifact_created'). */
  readonly type: string;
  /** Event payload (schema depends on type). */
  readonly payload: Record<string, unknown>;
  /** ISO-8601 timestamp when the event was emitted. */
  readonly createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector (External Integrations)
// ─────────────────────────────────────────────────────────────────────────────

/** Configuration for an external data source or destination. */
export interface Connector {
  readonly id: ConnectorId;
  /** Human-readable name. */
  readonly name: string;
  /** Connector type slug (e.g. 'postgres', 's3', 'slack'). */
  readonly type: string;
  /** Parent organisation. */
  readonly orgId: OrgId;
  /** Space scope, if restricted. */
  readonly spaceId: SpaceId | null;
  /** Encrypted connection parameters (schema depends on type). */
  readonly config: Record<string, unknown>;
  /** Whether the connector is currently healthy. */
  readonly healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  /** Last successful connection test timestamp. */
  readonly lastTestedAt: string | null;
  /** ISO-8601 timestamp of connector creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last connector update. */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent
// ─────────────────────────────────────────────────────────────────────────────

/** Configurable agent persona that drives task execution. */
export interface Agent {
  readonly id: string;
  /** Human-readable agent name. */
  readonly name: string;
  /** One-line description of the agent's purpose. */
  readonly description: string;
  /** Default model identifier used by this agent. */
  readonly model: string;
  /** System prompt that defines the agent's behaviour. */
  readonly systemPrompt: string;
  /** Tool identifiers the agent is allowed to invoke. */
  readonly tools: readonly string[];
  /** Sampling temperature (0–2). */
  readonly temperature: number;
  /** Maximum tokens per invocation. */
  readonly maxTokens: number;
  /** ISO-8601 timestamp of agent creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of last agent update. */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage & Billing
// ─────────────────────────────────────────────────────────────────────────────

/** Metered consumption record for cost tracking and billing. */
export interface Usage {
  readonly id: UsageId;
  /** Organisation to bill. */
  readonly orgId: OrgId;
  /** Associated workflow, if any. */
  readonly workflowId: WorkflowId | null;
  /** Associated task, if any. */
  readonly taskId: TaskId | null;
  /** Model that consumed tokens. */
  readonly modelId: string;
  /** Number of prompt tokens billed. */
  readonly promptTokens: number;
  /** Number of completion tokens billed. */
  readonly completionTokens: number;
  /** Actual cost in USD (from provider invoice). */
  readonly costUsd: number;
  /** Estimated cost in the org's billing currency (e.g. USD cents). */
  readonly estimatedCostCents: number;
  /** Wall-clock latency in milliseconds. */
  readonly latencyMs: number;
  /** ISO-8601 timestamp when the usage was recorded. */
  readonly timestamp: string;
}

/** Aggregate usage metrics for a billing period. */
export interface UsageMetrics {
  /** User these metrics belong to. */
  readonly userId: string;
  /** Organisation scope. */
  readonly orgId: string;
  /** Period start (ISO-8601). */
  readonly periodStart: string;
  /** Period end (ISO-8601). */
  readonly periodEnd: string;
  /** Total prompt tokens consumed. */
  readonly totalInputTokens: number;
  /** Total completion tokens consumed. */
  readonly totalOutputTokens: number;
  /** Total platform credits consumed. */
  readonly totalCredits: number;
  /** Breakdown per model. */
  readonly byModel: Record<string, { readonly input: number; readonly output: number; readonly credits: number }>;
  /** Breakdown per workflow. */
  readonly byWorkflow: Record<string, { readonly tasks: number; readonly credits: number }>;
}

/** Single usage metric entry (row-level). */
export interface UsageMetric {
  readonly id: string;
  /** Parent workflow, if any. */
  readonly workflowId: string | null;
  /** Model that consumed tokens. */
  readonly model: string;
  /** Prompt tokens billed. */
  readonly tokensIn: number;
  /** Completion tokens billed. */
  readonly tokensOut: number;
  /** Actual cost in USD. */
  readonly costUsd: number;
  /** Wall-clock latency in milliseconds. */
  readonly latencyMs: number;
  /** ISO-8601 timestamp when the usage was recorded. */
  readonly timestamp: string;
}

/** Billing snapshot for an organisation. */
export interface BillingInfo {
  /** Organisation scope. */
  readonly orgId: string;
  /** Subscription plan slug. */
  readonly plan: string;
  /** Remaining platform credits. */
  readonly creditsRemaining: number;
  /** Total credits in the current cycle. */
  readonly creditsTotal: number;
  /** Billing cycle start (ISO-8601). */
  readonly billingCycleStart: string;
  /** Billing cycle end (ISO-8601). */
  readonly billingCycleEnd: string;
  /** Credits consumed so far this cycle. */
  readonly usageThisCycle: number;
  /** Estimated next invoice amount. */
  readonly estimatedNextInvoice: number;
  /** Stripe customer identifier. */
  readonly stripeCustomerId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory Entry
// ─────────────────────────────────────────────────────────────────────────────

/** Lightweight memory row used in mock data and UI lists. */
export interface MemoryEntry {
  readonly id: string;
  /** Memory classification. */
  readonly kind: string;
  /** Lookup key. */
  readonly key: string;
  /** Stored value (JSON-serialised). */
  readonly value: string;
  /** Parent workflow, if any. */
  readonly workflowId: string | null;
  /** Space scope, if any. */
  readonly spaceId: string | null;
  /** User scope, if any. */
  readonly userId: string | null;
  /** Confidence score (0–1). */
  readonly confidence: number;
  /** ISO-8601 timestamp of creation. */
  readonly createdAt: string;
  /** Organisation scope. */
  readonly orgId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Result
// ─────────────────────────────────────────────────────────────────────────────

/** External search result returned by web search tools. */
export interface SearchResult {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly source: string;
  readonly publishedAt: string;
  readonly relevanceScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Status
// ─────────────────────────────────────────────────────────────────────────────

/** System health telemetry returned by the healthcheck endpoint. */
export interface HealthStatus {
  /** Overall status. */
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  /** Semantic version of the platform. */
  readonly version: string;
  /** Uptime in seconds. */
  readonly uptimeSeconds: number;
  /** Per-service status map. */
  readonly services: Record<string, string>;
  /** ISO-8601 timestamp of the health check. */
  readonly timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector & Model Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Union of supported connector identifiers. */
export type ConnectorName = string;

/** Connector lifecycle status. */
export type ConnectorStatus = 'connected' | 'disconnected' | 'pending' | 'error';

/** Union of model capability tags. */
export type ModelCapability = string;

/** Union of deliverable kinds for artifact classification. */
export type DeliverableKind = string;
