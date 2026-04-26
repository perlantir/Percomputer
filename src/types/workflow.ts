/**
 * Shared types for workflow streaming and live activity components.
 */

import type { TaskStatus, WorkflowStatus } from "./enums";

export type ModelName =
  | "Claude Opus 4.7"
  | "Claude Sonnet 4.6"
  | "Gemini 2.5 Pro"
  | "GPT-5.2"
  | "O1 Pro"
  | "DeepSeek-V3";

export interface CompletedTask {
  id: string;
  name: string;
  model: ModelName;
  durationMs: number;
  status: Extract<TaskStatus, "succeeded" | "failed" | "cancelled">;
  completedAt: number; // timestamp
}

export interface ActiveTask {
  id: string;
  name: string;
  model: ModelName;
  startedAt: number; // timestamp
  artifactCount?: number;
}

export interface ModelInFlight {
  model: ModelName;
  taskId: string;
  taskName: string;
  progress: number; // 0–1
  color: string;
}

export interface WorkflowEventBase {
  id: string;
  type: WorkflowEventType;
  timestamp: number;
  workflowId: string;
}

export type WorkflowEventType =
  | "workflow.started"
  | "workflow.completed"
  | "task.started"
  | "task.completed"
  | "task.failed"
  | "task.cancelled"
  | "model.progress"
  | "synthesis.token"
  | "credit.spend"
  | "clarification.requested"
  | "clarification.answered";

export interface WorkflowStartedEvent extends WorkflowEventBase {
  type: "workflow.started";
  data: { budget: number };
}

export interface TaskStartedEvent extends WorkflowEventBase {
  type: "task.started";
  data: { taskId: string; name: string; model: ModelName; artifactCount?: number };
}

export interface TaskCompletedEvent extends WorkflowEventBase {
  type: "task.completed";
  data: { taskId: string; durationMs: number };
}

export interface TaskFailedEvent extends WorkflowEventBase {
  type: "task.failed";
  data: { taskId: string; durationMs: number; error: string };
}

export interface TaskCancelledEvent extends WorkflowEventBase {
  type: "task.cancelled";
  data: { taskId: string; durationMs: number };
}

export interface ModelProgressEvent extends WorkflowEventBase {
  type: "model.progress";
  data: { model: ModelName; taskId: string; taskName: string; progress: number };
}

export interface SynthesisTokenEvent extends WorkflowEventBase {
  type: "synthesis.token";
  data: { token: string; index: number };
}

export interface CreditSpendEvent extends WorkflowEventBase {
  type: "credit.spend";
  data: { spent: number; total: number };
}

export interface ClarificationRequestedEvent extends WorkflowEventBase {
  type: "clarification.requested";
  data: { question: string; options?: string[]; clarificationId: string };
}

export interface ClarificationAnsweredEvent extends WorkflowEventBase {
  type: "clarification.answered";
  data: { clarificationId: string; answer: string };
}

export type StreamingWorkflowEvent =
  | WorkflowStartedEvent
  | TaskStartedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskCancelledEvent
  | ModelProgressEvent
  | SynthesisTokenEvent
  | CreditSpendEvent
  | ClarificationRequestedEvent
  | ClarificationAnsweredEvent;

export interface ConnectionStatus {
  state: "connecting" | "open" | "closed" | "error";
  lastEventId: string | null;
  reconnectAttempt: number;
}

export interface PendingClarification {
  id: string;
  question: string;
  options?: string[];
  requestedAt: number;
}

export const MODEL_COLORS: Record<ModelName, string> = {
  "Claude Opus 4.7": "#d97757",   // warm terracotta
  "Claude Sonnet 4.6": "#e5a158", // amber
  "Gemini 2.5 Pro": "#4f8ef7",    // blue
  "GPT-5.2": "#10a37f",           // green
  "O1 Pro": "#a855f7",            // purple
  "DeepSeek-V3": "#6366f1",       // indigo
};
