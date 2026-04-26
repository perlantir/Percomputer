/**
 * Enums module for the Multi-Model Agent Orchestration Platform.
 *
 * All enums are defined as const arrays with derived TypeScript union types.
 * This pattern ensures runtime validation compatibility while preserving
 * strict compile-time checking.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Workflow execution states. */
export const WORKFLOW_STATUS = [
  'draft',
  'queued',
  'planning',
  'running',
  'paused',
  'succeeded',
  'failed',
  'cancelling',
  'cancelled',
] as const;

/** Union type of all possible workflow statuses. */
export type WorkflowStatus = (typeof WORKFLOW_STATUS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Task Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Individual task execution states. */
export const TASK_STATUS = [
  'pending',
  'ready',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'skipped',
] as const;

/** Union type of all possible task statuses. */
export type TaskStatus = (typeof TASK_STATUS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Task Taxonomy
// ─────────────────────────────────────────────────────────────────────────────

/** Discriminated task kinds representing domain-specialised operations. */
export const TASK_KIND = [
  'research',
  'code',
  'synthesis',
  'analysis',
  'data-processing',
  'monitor',
  'extract',
  'visualize',
  'test',
  'write',
  'compare',
  'scrape',
] as const;

/** Union type of all task kinds an agent may perform. */
export type TaskKind = (typeof TASK_KIND)[number];

// ─────────────────────────────────────────────────────────────────────────────
// DAG Edge Semantics
// ─────────────────────────────────────────────────────────────────────────────

/** Relationship type between two tasks in the execution DAG. */
export const EDGE_TYPE = [
  'data',
  'ordering',
  'conditional',
] as const;

/** Union type of edge types connecting DAG nodes. */
export type EdgeType = (typeof EDGE_TYPE)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Attempt Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Status of a single execution attempt (retry) of a task. */
export const ATTEMPT_STATUS = [
  'running',
  'succeeded',
  'failed',
  'cancelled',
] as const;

/** Union type of attempt statuses. */
export type AttemptStatus = (typeof ATTEMPT_STATUS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Taxonomy
// ─────────────────────────────────────────────────────────────────────────────

/** MIME-like classification for generated artifacts. */
export const ARTIFACT_KIND = [
  'report_md',
  'dataset_csv',
  'image_png',
  'image_jpg',
  'code_diff',
  'text_txt',
  'json',
] as const;

/** Union type of artifact kinds. */
export type ArtifactKind = (typeof ARTIFACT_KIND)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Clarification Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** States for user-clarification requests that gate workflow progress. */
export const CLARIFICATION_STATUS = [
  'pending',
  'answered',
  'expired',
] as const;

/** Union type of clarification request statuses. */
export type ClarificationStatus = (typeof CLARIFICATION_STATUS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Memory Taxonomy
// ─────────────────────────────────────────────────────────────────────────────

/** Cognitive memory layer classifications per the three-store model. */
export const MEMORY_KIND = [
  'working',
  'episodic',
  'semantic',
] as const;

/** Union type of memory kinds. */
export type MemoryKind = (typeof MEMORY_KIND)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Safety & Governance
// ─────────────────────────────────────────────────────────────────────────────

/** Safety classification tier governing review gates and model routing. */
export const SAFETY_CLASS = [
  'default',
  'sensitive',
  'high_stakes',
] as const;

/** Union type of safety classes. */
export type SafetyClass = (typeof SAFETY_CLASS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control
// ─────────────────────────────────────────────────────────────────────────────

/** Organisation-level user roles. */
export const USER_ROLE = [
  'owner',
  'admin',
  'member',
  'viewer',
  'auditor',
] as const;

/** Union type of user roles within an organisation. */
export type UserRole = (typeof USER_ROLE)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Model Plane
// ─────────────────────────────────────────────────────────────────────────────

/** Functional tier used by the router to match requests to model capabilities. */
export const MODEL_TIER = [
  'orchestrator',
  'reasoning',
  'balanced',
  'small',
  'long_context',
  'image_specialist',
  'video_specialist',
  'code_specialist',
  'medical_specialist',
  'cheap_bulk',
] as const;

/** Union type of model capability tiers. */
export type ModelTier = (typeof MODEL_TIER)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Tool Registry
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical tool identifiers available to agents in the sandbox. */
export const TOOL_NAME = [
  'web_search',
  'web_fetch',
  'web_browse',
  'code_exec',
  'files_rw',
  'image_gen',
  'image_edit',
  'video_gen',
  'memory_read',
  'memory_write',
  'agent_fanout',
  'submit_result',
  'clarify',
] as const;

/** Union type of tool names exposed in the agent tool registry. */
export type ToolName = (typeof TOOL_NAME)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Audit Event Taxonomy
// ─────────────────────────────────────────────────────────────────────────────

/** Audit event type values used in compliance logs. */
export const AUDIT_EVENT_TYPE = [
  'workflow.created',
  'workflow.started',
  'workflow.completed',
  'workflow.failed',
  'workflow.cancelled',
  'task.started',
  'task.completed',
  'task.failed',
  'artifact.created',
  'artifact.updated',
  'clarification.raised',
  'clarification.answered',
  'budget.threshold',
  'user.login',
  'user.logout',
  'connector.configured',
  'connector.removed',
] as const;

/** Union type of all audit event categories. */
export type AuditEventType = (typeof AUDIT_EVENT_TYPE)[number];
