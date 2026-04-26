/**
 * useWorkflowRun.ts
 *
 * Hook for running a new workflow:
 * - POST to /api/workflows
 * - Subscribe to SSE events
 * - Manage running state
 * - Handle clarifications
 * - Return: workflow, events, status, error, cancel function
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/src/components/layout/Toaster";
import type {
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  ServerSentEvent,
  ClarificationEvent,
  WorkflowEvent,
  TaskEvent,
  ArtifactEvent,
  BudgetEvent,
  SynthesisTokenEvent,
} from "@/src/types";

export type RunStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "planning"
  | "running"
  | "paused"
  | "succeeded"
  | "failed"
  | "cancelling"
  | "cancelled";

export interface RunningWorkflow {
  readonly workflowId: string;
  readonly prompt: string;
  readonly status: RunStatus;
  readonly createdAt: string;
}

export interface UseWorkflowRunReturn {
  /** The workflow currently being run, if any. */
  workflow: RunningWorkflow | null;
  /** All accumulated SSE events. */
  events: ServerSentEvent[];
  /** Current high-level status. */
  status: RunStatus;
  /** Error message if submission or stream failed. */
  error: string | null;
  /** Whether a run is in progress. */
  isRunning: boolean;
  /** Start a new workflow run. */
  run: (request: CreateWorkflowRequest) => Promise<void>;
  /** Cancel the current workflow run. */
  cancel: () => Promise<void>;
  /** Answer a pending clarification. */
  answerClarification: (clarificationId: string, answer: string) => Promise<void>;
  /** Pending clarifications extracted from events. */
  pendingClarifications: ClarificationEvent[];
  /** Latest budget state from events. */
  budget: { currentCostCents: number; budgetCents: number; percentUsed: number } | null;
  /** Total number of synthesis tokens received. */
  synthesisTokenCount: number;
}

function eventToRunStatus(event: WorkflowEvent): RunStatus | null {
  switch (event.type) {
    case "workflow_queued":
      return "queued";
    case "workflow_planning":
      return "planning";
    case "workflow_planned":
      return "running"; // moves straight to execution
    case "workflow_paused":
      return "paused";
    case "workflow_resumed":
      return "running";
    case "workflow_completed":
      return "succeeded";
    case "workflow_failed":
      return "failed";
    case "workflow_cancelling":
      return "cancelling";
    case "workflow_cancelled":
      return "cancelled";
    default:
      return null;
  }
}

export function useWorkflowRun(): UseWorkflowRunReturn {
  const [workflow, setWorkflow] = useState<RunningWorkflow | null>(null);
  const [events, setEvents] = useState<ServerSentEvent[]>([]);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingClarifications, setPendingClarifications] = useState<ClarificationEvent[]>([]);
  const [budget, setBudget] = useState<{ currentCostCents: number; budgetCents: number; percentUsed: number } | null>(null);
  const [synthesisTokenCount, setSynthesisTokenCount] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const workflowIdRef = useRef<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup EventSource and abort fetch on unmount
      if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) {
        esRef.current.close();
      }
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (request: CreateWorkflowRequest) => {
    // Clean up any previous run before starting a new one
    const prevEs = esRef.current;
    if (prevEs && prevEs.readyState !== EventSource.CLOSED) {
      prevEs.close();
    }
    abortRef.current?.abort();

    // Reset state
    setEvents([]);
    setError(null);
    setPendingClarifications([]);
    setBudget(null);
    setSynthesisTokenCount(0);
    setStatus("submitting");

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // 1. Create workflow
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: abort.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to create workflow: ${res.status} ${text}`);
      }

      const created: CreateWorkflowResponse = await res.json();
      workflowIdRef.current = created.workflowId;

      const wf: RunningWorkflow = {
        workflowId: created.workflowId,
        prompt: request.prompt,
        status: created.status as RunStatus,
        createdAt: created.createdAt,
      };
      setWorkflow(wf);
      setStatus(created.status as RunStatus);
      toast.success("Workflow started", `Workflow #${created.workflowId.slice(-6)} is now running.`);

      // 2. Subscribe to SSE
      const eventSource = new EventSource(`/api/workflows/${created.workflowId}/events`);
      esRef.current = eventSource;

      await new Promise<void>((resolve, reject) => {
        eventSource.onopen = () => {
          // connected
        };

        eventSource.onmessage = (msg) => {
          try {
            const event: ServerSentEvent = JSON.parse(msg.data);

            setEvents((prev) => {
              const next = [...prev, event];
              return next;
            });

            // Update status from workflow events
            if (
              event.type.startsWith("workflow_") ||
              event.type === "workflow_completed" ||
              event.type === "workflow_failed" ||
              event.type === "workflow_cancelled"
            ) {
              const newStatus = eventToRunStatus(event as WorkflowEvent);
              if (newStatus) {
                setStatus(newStatus);
                setWorkflow((prev) => (prev ? { ...prev, status: newStatus } : prev));
              }
            }

            // Track clarifications
            if (event.type === "clarification_status") {
              const ce = event as ClarificationEvent;
              if (ce.status === "pending") {
                setPendingClarifications((prev) => [...prev, ce]);
              } else {
                setPendingClarifications((prev) =>
                  prev.filter((c) => c.clarificationId !== ce.clarificationId)
                );
              }
            }

            // Track budget
            if (event.type === "budget") {
              const b = event as BudgetEvent;
              setBudget({
                currentCostCents: b.currentCostCents,
                budgetCents: b.budgetCents,
                percentUsed: b.percentUsed,
              });
            }

            // Count synthesis tokens
            if (event.type === "synthesis_token") {
              setSynthesisTokenCount((n) => n + 1);
            }

            // Terminal events close the stream
            if (
              event.type === "workflow_completed" ||
              event.type === "workflow_failed" ||
              event.type === "workflow_cancelled"
            ) {
              eventSource.close();
              resolve();
            }
          } catch (parseErr) {
            // ignore malformed events
          }
        };

        eventSource.onerror = (err) => {
          if (abort.signal.aborted) {
            eventSource.close();
            resolve();
            return;
          }
          eventSource.close();
          reject(new Error("EventSource connection failed"));
        };

        // Safety timeout
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error("Workflow stream timed out after 10 minutes"));
        }, 10 * 60 * 1000);

        // Cleanup timeout on resolve
        const originalResolve = resolve;
        resolve = () => {
          clearTimeout(timeout);
          originalResolve();
        };
      });
    } catch (err) {
      if (abort.signal.aborted) {
        setStatus("cancelled");
        setWorkflow((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
        toast.info("Workflow cancelled", "The workflow run has been cancelled.");
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("failed");
        setWorkflow((prev) => (prev ? { ...prev, status: "failed" } : prev));
        toast.error("Workflow failed", msg);
      }
    } finally {
      abortRef.current = null;
      esRef.current = null;
    }
  }, []);

  const cancel = useCallback(async () => {
    const workflowId = workflowIdRef.current;
    if (!workflowId) return;

    // Abort SSE
    const abort = abortRef.current;
    if (abort) {
      abort.abort();
    }
    const es = esRef.current;
    if (es && es.readyState !== EventSource.CLOSED) {
      es.close();
    }

    // Call DELETE API
    try {
      setStatus("cancelling");
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.warn("Cancel request failed:", res.status);
        toast.error("Failed to cancel workflow", `Server responded with ${res.status}`);
      } else {
        toast.info("Workflow cancelled", "The workflow has been cancelled successfully.");
      }
    } catch (e) {
      console.warn("Cancel request error:", e);
      toast.error("Failed to cancel workflow", "Network error while cancelling.");
    }
  }, []);

  const answerClarification = useCallback(async (clarificationId: string, answer: string) => {
    const workflowId = workflowIdRef.current;
    if (!workflowId) return;

    // Snapshot pending clarifications for potential rollback
    const previousPending = pendingClarifications;

    // Optimistically remove from pending *before* the network call
    setPendingClarifications((prev) =>
      prev.filter((c) => c.clarificationId !== clarificationId)
    );

    try {
      const res = await fetch(`/api/clarifications/${clarificationId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) {
        throw new Error(`Failed to answer clarification: ${res.status}`);
      }
      toast.success("Answer submitted", "Your clarification answer has been sent.");
    } catch (err) {
      // Rollback on error: restore the previous pending clarifications
      setPendingClarifications(previousPending);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("Failed to submit answer", msg);
    }
  }, [pendingClarifications]);

  return {
    workflow,
    events,
    status,
    error,
    isRunning: status !== "idle" && status !== "succeeded" && status !== "failed" && status !== "cancelled",
    run,
    cancel,
    answerClarification,
    pendingClarifications,
    budget,
    synthesisTokenCount,
  };
}
