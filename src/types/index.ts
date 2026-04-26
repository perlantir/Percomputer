/**
 * Barrel export for the Multi-Model Agent Orchestration Platform types.
 *
 * Import from this file to access the complete type surface:
 *
 *   import type { Workflow, TaskEvent, ModelDefinition } from './types';
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export {
  WORKFLOW_STATUS,
  TASK_STATUS,
  TASK_KIND,
  EDGE_TYPE,
  ATTEMPT_STATUS,
  ARTIFACT_KIND,
  CLARIFICATION_STATUS,
  MEMORY_KIND,
  SAFETY_CLASS,
  USER_ROLE,
  MODEL_TIER,
  TOOL_NAME,
  AUDIT_EVENT_TYPE,
} from './enums';

export type {
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
  ModelTier,
  ToolName,
  AuditEventType,
} from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// Entities
// ─────────────────────────────────────────────────────────────────────────────

export type {
  UserId,
  OrgId,
  SpaceId,
  WorkflowId,
  TaskId,
  TaskEdgeId,
  AttemptId,
  ArtifactId,
  PlanRevisionId,
  ClarificationId,
  EpisodicMemoryId,
  SemanticMemoryId,
  AuditEventId,
  ConnectorId,
  UsageId,
  User,
  Org,
  Space,
  Workflow,
  Task,
  TaskEdge,
  TaskAttempt,
  TokenUsage,
  Artifact,
  PlanRevision,
  Clarification,
  EpisodicMemory,
  SemanticMemory,
  AuditEvent,
  Connector,
  Usage,
  Agent,
  UsageMetrics,
  BillingInfo,
  MemoryEntry,
  SearchResult,
  HealthStatus,
  UsageMetric,
  ConnectorName,
  ConnectorStatus,
  ModelCapability,
  DeliverableKind,
} from './entities';

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

export type {
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  WorkflowDetailResponse,
  WorkflowListItem,
  WorkflowListResponse,
  AmendWorkflowRequest,
  WorkflowQueuedEvent,
  WorkflowPlanningEvent,
  WorkflowPlannedEvent,
  WorkflowPausedEvent,
  WorkflowResumedEvent,
  WorkflowCompletedEvent,
  WorkflowFailedEvent,
  WorkflowCancellingEvent,
  WorkflowCancelledEvent,
  WorkflowClarificationEvent,
  WorkflowBudgetEvent,
  WorkflowEvent,
  WorkflowEventsSSE,
  TaskStatusEvent,
  TaskRunningEvent,
  TaskLogEvent,
  TaskEvent,
  ArtifactCreatedEvent,
  ArtifactUpdatedEvent,
  ArtifactEvent,
  ClarificationStatusEvent,
  ClarificationEvent,
  BudgetEvent,
  SynthesisTokenEvent,
  ServerSentEvent,
  ArtifactResponse,
  SpaceResponse,
  SpaceListResponse,
  ConnectorResponse,
  ConnectorListResponse,
  MemoryEntryResponse,
  MemoryListResponse,
  UsageResponse,
  AuditEventResponse,
  ClarificationAnswerMessage,
  ApprovalMessage,
  CancelMessage,
  AmendMessage,
  ModelOverrideMessage,
  WebSocketMessage,
} from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export type {
  TaskSpec,
  TaskInput,
  TaskExpectedOutput,
  TaskConstraints,
  ArtifactRef,
  TaskRef,
  MemoryRef,
  PlanCreateDAG,
  PlanAmend,
  PlanFinalize,
  PlanAction,
  TaskEdgeSpec,
  SubAgentInput,
  SubAgentOutput,
  ModelBinding,
  ToolBinding,
  Budgets,
  MemoryScope,
  VerifierSignal,
  VerifierAnnotation,
} from './orchestrator';

// ─────────────────────────────────────────────────────────────────────────────
// Model Plane
// ─────────────────────────────────────────────────────────────────────────────

export type {
  ModelDefinition,
  ModelCapabilities,
  CostProfile,
  LatencyProfile,
  ProviderAdapter,
  StreamChunk,
  RouterRequest,
  RouterMessage,
  RouterContentPart,
  RouterTool,
  RouterToolCall,
  RouterResponse,
  TokenBudget,
  ProviderHealth,
  ModelInfo,
} from './model';

// ─────────────────────────────────────────────────────────────────────────────
// Frontend
// ─────────────────────────────────────────────────────────────────────────────

export type {
  ThemeMode,
  ComposerState,
  FileAttachment,
  LiveActivityRailState,
  ActivityRailItem,
  TaskTimelineItem,
  SourceCard,
  ArtifactPreview,
  DAGNode,
  DAGNodeData,
  DAGEdge,
  Citation,
  NavigationItem,
  SettingsTab,
  ConsolePage,
  ToastMessage,
  NotificationCategory,
  Notification,
  NotificationPanelState,
  NotificationSummary,
  SearchResultItem,
  ExportFormat,
  CompareMode,
  VoiceState,
  TemplateCategory,
} from './frontend';

// ─────────────────────────────────────────────────────────────────────────────
// Workflow (streaming & live activity)
// ─────────────────────────────────────────────────────────────────────────────

export type {
  ModelName,
  CompletedTask,
  ActiveTask,
  ModelInFlight,
  WorkflowEventBase,
  WorkflowEventType,
  WorkflowStartedEvent,
  TaskStartedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskCancelledEvent,
  ModelProgressEvent,
  SynthesisTokenEvent as StreamingSynthesisTokenEvent,
  CreditSpendEvent,
  ClarificationRequestedEvent,
  ClarificationAnsweredEvent,
  StreamingWorkflowEvent,
  ConnectionStatus,
  PendingClarification,
} from './workflow';

export {
  MODEL_COLORS,
} from './workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────────────────────

export type {
  TeamInvitation,
  TeamMember,
  SendInviteInput,
  AcceptInviteInput,
} from './team';
