"use client";

import { useEffect, useRef, useState } from "react";
import {
  SynthesisTokenEvent,
  StreamingWorkflowEvent,
} from "@/types/workflow";

export interface UseWorkflowStreamReturn {
  /** Accumulated Markdown string from all synthesis.token events. */
  markdown: string;
  /** Number of tokens received so far. */
  tokenCount: number;
  /** Whether any synthesis tokens have arrived yet. */
  hasStarted: boolean;
}

/**
 * Hook that listens to a raw event stream and accumulates `synthesis.token`
 * events into a growing Markdown string.
 *
 * Features
 * --------
 * - Accumulates tokens in order (using the `index` field for safety)
 * - Provides `tokenCount` for progress estimation
 * - Optionally simulates a typing effect for demo / storybook usage
 *
 * @param events        Array of workflow events (from useWorkflowEvents)
 * @param simulateDelay Delay between token chunks in ms when simulating.
 *                      Set to 0 (default) for real-time passthrough.
 */
export function useWorkflowStream(
  events: StreamingWorkflowEvent[],
  simulateDelay = 0
): UseWorkflowStreamReturn {
  const [markdown, setMarkdown] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const hasStarted = tokenCount > 0;

  // Refs for the simulation loop so we don't re-create intervals
  const pendingTokensRef = useRef<SynthesisTokenEvent[]>([]);
  const currentTextRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ------------------------------------------------------------------
  // Phase 1: collect *new* synthesis.token events into pending buffer
  // ------------------------------------------------------------------
  useEffect(() => {
    const incoming = events.filter(
      (e): e is SynthesisTokenEvent => e.type === "synthesis.token"
    );

    if (simulateDelay <= 0) {
      // Real-time path: flush immediately
      const sorted = incoming.sort((a, b) => a.data.index - b.data.index);
      const text = sorted.map((e) => e.data.token).join("");
      setMarkdown(text);
      setTokenCount(sorted.length);
      return;
    }

    // Simulation path: enqueue tokens we haven't seen yet
    const existingIds = new Set(
      pendingTokensRef.current.map((e) => e.id)
    );
    const novel = incoming.filter((e) => !existingIds.has(e.id));

    if (novel.length > 0) {
      pendingTokensRef.current.push(...novel);
      pendingTokensRef.current.sort((a, b) => a.data.index - b.data.index);
    }
  }, [events, simulateDelay]);

  // ------------------------------------------------------------------
  // Phase 2: typing simulation loop (only when simulateDelay > 0)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (simulateDelay <= 0) return;

    // Drain pending tokens at simulateDelay intervals
    timerRef.current = setInterval(() => {
      const pending = pendingTokensRef.current;
      if (pending.length === 0) return;

      // Emit one token at a time for the typing effect
      const next = pending.shift();
      if (!next) return;

      currentTextRef.current += next.data.token;
      setMarkdown(currentTextRef.current);
      setTokenCount((prev) => prev + 1);
    }, simulateDelay);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [simulateDelay]);

  return { markdown, tokenCount, hasStarted };
}
