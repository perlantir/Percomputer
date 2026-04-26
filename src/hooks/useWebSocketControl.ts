"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/src/components/layout/Toaster";
import {
  PendingClarification,
} from "@/types/workflow";

const POLL_INTERVAL = 3_000; // ms between clarification polls

export interface UseWebSocketControlReturn {
  /** Clarifications awaiting user response. */
  pendingClarifications: PendingClarification[];
  /** Send a free-text answer to a clarification. */
  sendAnswer: (clarificationId: string, answer: string) => Promise<boolean>;
  /** Approve a step / sub-workflow. */
  sendApproval: (stepId: string) => Promise<boolean>;
  /** Request an amendment (e.g. "use a different model"). */
  sendAmendment: (stepId: string, amendment: string) => Promise<boolean>;
  /** Cancel the entire workflow. */
  cancel: () => Promise<boolean>;
  /** True while any control action is in flight. */
  isLoading: boolean;
}

/**
 * Hook that handles interactive control of a running workflow.
 *
 * It provides:
 * - Polling for pending clarifications from the backend.
 * - Sending user answers, approvals, amendments and cancellations.
 *
 * The transport is polling + REST POSTs (works through corporate
 * proxies / restrictive networks where WebSockets are blocked).  If a
 * real WebSocket is available you can swap the POST calls for `ws.send`
 * without changing the return signature.
 *
 * @param workflowId The workflow being controlled.
 * @param enabled    Whether polling & actions should be active.
 */
export function useWebSocketControl(
  workflowId: string,
  enabled = true
): UseWebSocketControlReturn {
  const [pendingClarifications, setPendingClarifications] = useState<
    PendingClarification[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const workflowIdRef = useRef(workflowId);
  workflowIdRef.current = workflowId;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // ------------------------------------------------------------------
  // Polling
  // ------------------------------------------------------------------
  const poll = useCallback(async () => {
    if (!enabledRef.current) return;
    const id = workflowIdRef.current;

    try {
      const res = await fetch(`/api/workflows/${id}/clarifications`);
      if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
      const data = (await res.json()) as {
        clarifications: PendingClarification[];
      };
      setPendingClarifications(data.clarifications);
    } catch {
      // Silently swallow polling errors – the UI stays stale until the
      // next successful poll.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Immediate first poll
    poll();

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled, poll]);

  // ------------------------------------------------------------------
  // Actions (with optimistic updates + rollback on error)
  // ------------------------------------------------------------------
  const sendAnswer = useCallback(
    async (clarificationId: string, answer: string): Promise<boolean> => {
      // Snapshot current pending list for potential rollback
      const prevPending = pendingClarifications;
      // Optimistically remove the answered clarification
      setPendingClarifications((prev) =>
        prev.filter((c) => c.id !== clarificationId)
      );

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/workflows/${workflowIdRef.current}/clarifications/${clarificationId}/answer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer }),
          }
        );
        if (res.ok) {
          toast.success("Answer sent", "Your clarification answer was submitted.");
          return true;
        }
        // Rollback on failure
        setPendingClarifications(prevPending);
        toast.error("Failed to send answer", `Server responded with ${res.status}`);
        return false;
      } catch {
        setPendingClarifications(prevPending);
        toast.error("Failed to send answer", "Network error while submitting answer.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [pendingClarifications]
  );

  const sendApproval = useCallback(
    async (stepId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/workflows/${workflowIdRef.current}/steps/${stepId}/approve`,
          { method: "POST" }
        );
        if (res.ok) {
          toast.success("Step approved", `Step ${stepId.slice(-6)} has been approved.`);
        } else {
          toast.error("Approval failed", `Server responded with ${res.status}`);
        }
        return res.ok;
      } catch {
        toast.error("Approval failed", "Network error while approving step.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendAmendment = useCallback(
    async (stepId: string, amendment: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/workflows/${workflowIdRef.current}/steps/${stepId}/amend`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amendment }),
          }
        );
        if (res.ok) {
          toast.success("Amendment sent", "Your amendment has been submitted.");
        } else {
          toast.error("Amendment failed", `Server responded with ${res.status}`);
        }
        return res.ok;
      } catch {
        toast.error("Amendment failed", "Network error while submitting amendment.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const cancel = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/workflows/${workflowIdRef.current}/cancel`,
        { method: "POST" }
      );
      if (res.ok) {
        toast.info("Workflow cancelled", "The workflow has been cancelled.");
      } else {
        toast.error("Cancel failed", `Server responded with ${res.status}`);
      }
      return res.ok;
    } catch {
      toast.error("Cancel failed", "Network error while cancelling workflow.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    pendingClarifications,
    sendAnswer,
    sendApproval,
    sendAmendment,
    cancel,
    isLoading,
  };
}
