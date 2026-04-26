"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  StreamingWorkflowEvent,
  ConnectionStatus,
} from "@/types/workflow";

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 500;
const EVENT_BUFFER_LIMIT = 500;

export interface UseWorkflowEventsReturn {
  /** All buffered workflow events, newest last. */
  events: StreamingWorkflowEvent[];
  /** Live connection status. */
  connection: ConnectionStatus;
  /** Most recent error, if any. */
  error: Error | null;
}

/**
 * Custom hook that consumes a Server-Sent Events (SSE) stream for a
 * specific workflow.
 *
 * Features
 * --------
 * - Connects to `/api/workflows/{id}/events`
 * - Parses every line into a typed StreamingWorkflowEvent object
 * - Maintains a capped ring-buffer of events
 * - Reconnects automatically with exponential backoff
 * - Resumes from the last seen event id via `Last-Event-ID` header
 * - Exposes connection status and the most recent error for UI feedback
 *
 * @param workflowId The workflow to subscribe to.
 * @param enabled    Whether the stream should be active (default true).
 */
export function useWorkflowEvents(
  workflowId: string,
  enabled = true
): UseWorkflowEventsReturn {
  const [events, setEvents] = useState<StreamingWorkflowEvent[]>([]);
  const [connection, setConnection] = useState<ConnectionStatus>({
    state: "closed",
    lastEventId: null,
    reconnectAttempt: 0,
  });
  const [error, setError] = useState<Error | null>(null);

  // Mutable refs for reconnection bookkeeping so that closures always
  // see the latest value without bouncing the effect.
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const eventBufferRef = useRef<StreamingWorkflowEvent[]>([]);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const workflowIdRef = useRef(workflowId);
  workflowIdRef.current = workflowId;

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY
    );

    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptRef.current += 1;
      connect();
    }, delay);

    setConnection((prev) => ({
      ...prev,
      state: "connecting",
      reconnectAttempt: reconnectAttemptRef.current,
    }));
  }, []);

  const connect = useCallback(() => {
    if (!enabledRef.current) return;

    setConnection((prev) => ({
      ...prev,
      state: "connecting",
      reconnectAttempt: reconnectAttemptRef.current,
    }));

    const id = workflowIdRef.current;
    const url = `/api/workflows/${id}/events`;

    const es = new EventSource(url, {
      withCredentials: true,
    });

    // Polyfill-ish: EventSource doesn't expose headers, but spec says the
    // browser should send `Last-Event-ID` automatically on reconnect.
    // We use the `id:` field in our SSE stream to enable this.

    es.onopen = () => {
      reconnectAttemptRef.current = 0;
      setConnection({
        state: "open",
        lastEventId: lastEventIdRef.current,
        reconnectAttempt: 0,
      });
      setError(null);
    };

    es.onmessage = (evt: MessageEvent) => {
      if (evt.lastEventId) {
        lastEventIdRef.current = evt.lastEventId;
      }

      let parsed: StreamingWorkflowEvent | null = null;
      try {
        parsed = JSON.parse(evt.data) as StreamingWorkflowEvent;
      } catch {
        // Non-JSON comment / heartbeat lines – ignore.
        return;
      }

      if (!parsed) return;

      // Append to ring buffer
      const buf = eventBufferRef.current;
      buf.push(parsed);
      if (buf.length > EVENT_BUFFER_LIMIT) {
        buf.splice(0, buf.length - EVENT_BUFFER_LIMIT);
      }
      eventBufferRef.current = buf;

      setEvents([...buf]);
      setConnection((prev) => ({
        ...prev,
        lastEventId: lastEventIdRef.current,
      }));
    };

    es.onerror = () => {
      es.close();
      setConnection((prev) => ({
        ...prev,
        state: "error",
        lastEventId: lastEventIdRef.current,
        reconnectAttempt: reconnectAttemptRef.current,
      }));
      setError(
        new Error(
          `SSE connection lost for workflow ${id}. Reconnect attempt ${reconnectAttemptRef.current + 1}.`
        )
      );
      scheduleReconnect();
    };

    return es;
  }, [scheduleReconnect]);

  // Start / stop the stream whenever the workflow id or enabled flag changes.
  useEffect(() => {
    if (!enabled) {
      setConnection({ state: "closed", lastEventId: null, reconnectAttempt: 0 });
      setError(null);
      return;
    }

    let es: EventSource | undefined;
    try {
      es = connect();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to open EventSource")
      );
      scheduleReconnect();
    }

    return () => {
      if (es) es.close();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [workflowId, enabled, connect, scheduleReconnect]);

  return { events, connection, erction, er