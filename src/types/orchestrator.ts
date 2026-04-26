/**
 * Orchestrator engine types for the Multi-Model Agent Orchestration Platform.
 *
 * These types describe the internal DSL used by the planning, scheduling,
 * and execution layers.  They are not directly exposed to end-users but
 * serialise cleanly to/from the database and the model prompt context.
 */

import type {
  TaskKind,
  EdgeType,
  ModelTier,
  ToolName,
  SafetyClass,
  ArtifactKind,
} from './enums';
import type {
  WorkflowId,
  TaskId,
  PlanRevisionId,
  ArtifactId,
  Task,
} from './entities';

// ─────────────────────────────────────────────────────────────────────────────
// Task Specification
// ─────────────────────────────────────────────────────────────────────────────

/** Complete specification for a single task node in the execution DAG. */
export interface TaskSpec {
  /** Stable local identifier within the plan (not yet a DB TaskId). */
  readonly localId: string;
  /** Human-readable title. */
  readonly title: string;
  /** Detailed prompt / instruction sent to the agent. */
  readonly instruction: string;
  /** Taxonomic kind driving model and tool selection. */
  readonly kind: TaskKind;
  /** Input routing configuration. */
  readonly input: TaskInput;
  /** Expected output shape for downstream validation. */
  readonly expectedOutput: TaskExpectedOutput;
  /** Hard and soft constraints on execution. */
  readonly constraints: TaskConstraints;
  /** Explicit model binding (overrides router). */
  readonly modelBinding: ModelBinding | null;
  /** Tools this task is permitted to invoke. */
  readonly tools: readonly ToolBinding[];
  /** Whether this task must wait for explicit user approval. */
  readonly requiresApproval: boolean;
}

/** Describes how a task consumes data from upstream sources. */
export interface TaskInput {
  /** Artifacts from prior tasks to inject into context. */
  readonly fromArtifacts: readonly ArtifactRef[];
  /** Direct upstream task results to include. */
  readonly fromTasks: readonly TaskRef[];
  /** Memory entries to retrieve and inject. */
  readonly fromMemory: readonly MemoryRef[];
}

/** Reference to an artifact produced by an upstream task. */
export interface ArtifactRef {
  /** Local ID of the upstream task that produces this artifact. */
  readonly producerTaskLocalId: string;
  /** Specific artifact name expected (optional — accepts first if omitted). */
  readonly artifactName: string | null;
  /** JSONPath or pointer into the artifact content. */
  readonly selector: string | null;
}

/** Reference to a prior task whose result should be included in context. */
export interface TaskRef {
  /** Local ID of the upstream task. */
  readonly taskLocalId: string;
  /** Field or selector to extract from the task result. */
  readonly selector: string | null;
}

/** Reference to a memory entry for retrieval-augmented context. */
export interface MemoryRef {
  /** Semantic query string. */
  readonly query: string;
  /** Memory kind filter. */
  readonly kind: 'episodic' | 'semantic' | 'both';
  /** Maximum entries to retrieve. */
  readonly topK: number;
  /** Similarity threshold (0–1). */
  readonly minSimilarity: number;
}

/** Contract describing what a task is expected to produce. */
export interface TaskExpectedOutput {
  /** MIME-like artifact kinds this task should emit. */
  readonly artifactKinds: readonly ArtifactKind[];
  /** Whether the task must produce at least one artifact. */
  readonly required: boolean;
  /** JSON Schema for structured outputs (code, data analysis, etc.). */
  readonly schema: Record<string, unknown> | null;
}

/** Constraints governing task execution, routing, and retry behaviour. */
export interface TaskConstraints {
  /** Maximum number of retry attempts. */
  readonly maxAttempts: number;
  /** Timeout in seconds for a single attempt. */
  readonly timeoutSeconds: number;
  /** Preferred model tier for the router. */
  readonly preferredTier: ModelTier | null;
  /** Excluded model IDs (e.g. due to prior failures). */
  readonly excludedModels: readonly string[];
  /** Maximum token budget for a single attempt. */
  readonly maxTokens: number | null;
  /** Required safety class (router will reject lower-class models). */
  readonly requiredSafetyClass: SafetyClass | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan DSL
// ─────────────────────────────────────────────────────────────────────────────

/** Action to create a new DAG plan from a user prompt. */
export interface PlanCreateDAG {
  readonly action: 'create';
  readonly workflowId: WorkflowId;
  readonly prompt: string;
  readonly safetyClass: SafetyClass;
  readonly preferredModelTier: ModelTier | null;
}

/** Action to amend an existing plan in-flight. */
export interface PlanAmend {
  readonly action: 'amend';
  readonly workflowId: WorkflowId;
  readonly currentPlanRevisionId: PlanRevisionId;
  readonly instruction: string;
  readonly preserveCompletedTasks: boolean;
}

/** Action to finalise (lock) a plan so it may be executed. */
export interface PlanFinalize {
  readonly action: 'finalize';
  readonly workflowId: WorkflowId;
  readonly planRevisionId: PlanRevisionId;
  readonly approved: boolean;
}

/** Discriminated union of all plan lifecycle actions. */
export type PlanAction = PlanCreateDAG | PlanAmend | PlanFinalize;

// ─────────────────────────────────────────────────────────────────────────────
// Edge Specification
// ─────────────────────────────────────────────────────────────────────────────

/** Lightweight edge description used during plan generation before DB persistence. */
export interface TaskEdgeSpec {
  readonly fromLocalId: string;
  readonly toLocalId: string;
  readonly edgeType: EdgeType;
  readonly dataMapping: string | null;
  readonly condition: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Agent Fan-Out
// ─────────────────────────────────────────────────────────────────────────────

/** Input envelope dispatched to a child (sub) agent during fan-out. */
export interface SubAgentInput {
  readonly parentWorkflowId: WorkflowId;
  readonly parentTaskId: TaskId;
  readonly subWorkflowId: WorkflowId;
  readonly objective: string;
  readonly context: Record<string, unknown>;
  readonly artifacts: readonly ArtifactId[];
  readonly budgets: Budgets;
}

/** Output envelope returned by a child (sub) agent on completion. */
export interface SubAgentOutput {
  readonly subWorkflowId: WorkflowId;
  readonly status: 'succeeded' | 'failed' | 'cancelled';
  readonly artifacts: readonly ArtifactId[];
  readonly resultSummary: string;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Binding
// ─────────────────────────────────────────────────────────────────────────────

/** Explicit or heuristic-driven model assignment for a task. */
export interface ModelBinding {
  /** Exact model identifier to use (mutually exclusive with tierHint). */
  readonly modelId: string | null;
  /** Capability tier hint when exact model is not specified. */
  readonly tierHint: ModelTier | null;
  /** Whether the binding is mandatory or merely a preference. */
  readonly strict: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Binding
// ─────────────────────────────────────────────────────────────────────────────

/** Tool permission entry within a task's sandbox manifest. */
export interface ToolBinding {
  /** Canonical tool identifier. */
  readonly name: ToolName;
  /** Whether the tool is available (false = explicitly revoked). */
  readonly enabled: boolean;
  /** Tool-specific parameter overrides. */
  readonly config: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budgets
// ─────────────────────────────────────────────────────────────────────────────

/** Token and cost ceilings for a workflow or task. */
export interface Budgets {
  /** Total token budget for the entire workflow. */
  readonly maxTotalTokens: number | null;
  /** Token budget for a single task. */
  readonly maxTaskTokens: number | null;
  /** Cost ceiling in billing currency cents. */
  readonly maxCostCents: number | null;
  /** Wall-clock duration limit in minutes. */
  readonly maxDurationMinutes: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory Scope
// ─────────────────────────────────────────────────────────────────────────────

/** Defines the search scope for memory retrieval during task preparation. */
export interface MemoryScope {
  readonly orgId: string;
  readonly spaceId: string | null;
  readonly kinds: readonly ('working' | 'episodic' | 'semantic')[];
  readonly query: string;
  readonly topK: number;
  readonly recencyBias: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Verifier Signal
// ─────────────────────────────────────────────────────────────────────────────

/** Result of a verification / validation pass on a task output. */
export interface VerifierSignal {
  readonly verdict: 'pass' | 'fail' | 'warn' | 'skip';
  /** Human-readable explanation of the verdict. */
  readonly message: string;
  /** Machine-parseable error or warning codes. */
  readonly codes: readonly string[];
  /** Structured diff or annotation data. */
  readonly annotations: readonly VerifierAnnotation[];
}

/** Single annotation produced by a verifier (e.g. lint error, diff hunk). */
export interface VerifierAnnotation {
  readonly severity: 'error' | 'warning' | 'info';
  readonly line: number | null;
  readonly column: number | null;
  readonly message: string;
  readonly suggestion: string | null;
}
