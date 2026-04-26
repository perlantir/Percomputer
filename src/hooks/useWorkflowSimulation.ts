"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  StreamingWorkflowEvent,
  WorkflowEventType,
  ModelName,
  TaskStatus,
} from "@/types/workflow";

export interface UseWorkflowSimulationReturn {
  /** Synthetic events generated so far. */
  events: StreamingWorkflowEvent[];
  /** Reset and restart the simulation from scratch. */
  reset: () => void;
  /** Whether the sim is still producing new events. */
  isRunning: boolean;
}

const SYNTHESIS_TOKENS = [
  "# ", "Synthesis\n\n", "Based ", "on ", "the ", "research, ", "I ",
  "can ", "conclude ", "that ", "**multi-model ", "orchestration** ",
  "delivers ", "a ", "**32% ", "improvement** ", "in ", "task ",
  "accuracy \n\n", "1. ", "Claude ", "Opus ", "excelled ", "at ",
  "deep ", "reasoning \n", "2. ", "Gemini ", "2.5 ", "Pro ", "provided ",
  "the ", "broadest ", "context \n", "3. ", "Sonnet ", "balanced ",
  "speed ", "and ", "cost \n\n", "> ", "Recommend ", "adopting ",
  "a ", "tiered ", "routing ", "strategy. \n",
];

const MODELS: ModelName[] = [
  "Claude Opus 4.7",
  "Claude Sonnet 4.6",
  "Gemini 2.5 Pro",
  "GPT-5.2",
];

const TASKS: Array<{ name: string; model: ModelName; duration: number }> = [
  { name: "extract", model: "Claude Sonnet 4.6", duration: 4100 },
  { name: "research", model: "Gemini 2.5 Pro", duration: 28000 },
  { name: "research", model: "Claude Sonnet 4.6", duration: 31000 },
  { name: "synthesize", model: "Claude Opus 4.7", duration: 47000 },
];

interface SimStep {
  type: WorkflowEventType;
  delay: number; // ms after previous step
  payload: Partial<StreamingWorkflowEvent>;
}

/**
 * Generates a deterministic sequence of synthetic workflow events that
 * mimics a real multi-model execution.
 *
 * Use this in storybook / demo mode when viewing a "running" workflow.
 */
export function useWorkflowSimulation(): UseWorkflowSimulationReturn {
  const [events, setEvents] = useState<StreamingWorkflowEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stepIndexRef = useRef(0);
  const taskProgressRef = useRef<Record<string, number>>({});
  const creditSpentRef = useRef(0);

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  }, []);

  const buildPlan = useCallback((): SimStep[] => {
    const plan: SimStep[] = [];
    const now = Date.now();
    let offset = 0;

    // 1. Workflow started
    plan.push({
      type: "workflow.started",
      delay: 0,
      payload: {
        id: `evt-${now}-start`,
        timestamp: now,
        data: { budget: 5000 },
      },
    });

    // 2. Task lifecycle
    TASKS.forEach((task, i) => {
      const taskId = `task-${i}`;
      const startedAt = now + offset;

      // task.started
      plan.push({
        type: "task.started",
        delay: Math.random() * 1500 + 500,
        payload: {
          id: `evt-${startedAt}-start-${i}`,
          timestamp: startedAt,
          data: {
            taskId,
            name: task.name,
            model: task.model,
            artifactCount: i === 3 ? 8 : undefined,
          },
        },
      });

      // Periodic model.progress bumps
      const progressSteps = 5;
      for (let p = 1; p <= progressSteps; p++) {
        plan.push({
          type: "model.progress",
          delay: task.duration / progressSteps,
          payload: {
            id: `evt-${startedAt}-prog-${i}-${p}`,
            timestamp: startedAt + (task.duration / progressSteps) * p,
            data: {
              model: task.model,
              taskId,
              taskName: task.name,
              progress: p / progressSteps,
            },
          },
        });
      }

      // credit.spend bump at completion
      plan.push({
        type: "credit.spend",
        delay: 0,
        payload: {
          id: `evt-${startedAt}-credit-${i}`,
          timestamp: startedAt + task.duration,
          data: { spent: 1240 + i * 900, total: 5000 },
        },
      });

      // task.completed (or .failed for demo variety)
      const finalStatus: TaskStatus =
        i === 3 ? "running" : i === 1 ? "succeeded" : i === 2 ? "succeeded" : "succeeded";

      if (finalStatus === "succeeded") {
        plan.push({
          type: "task.completed",
          delay: 0,
          payload: {
            id: `evt-${startedAt}-done-${i}`,
            timestamp: startedAt + task.duration,
            data: { taskId, durationMs: task.duration },
          },
        });
      }
    });

    // 3. Synthesis tokens stream in while last task is "running"
    SYNTHESIS_TOKENS.forEach((token, idx) => {
      plan.push({
        type: "synthesis.token",
        delay: 180,
        payload: {
          id: `evt-synth-${idx}`,
          timestamp: now + offset + idx * 180,
          data: { token, index: idx },
        },
      });
    });

    // 4. Workflow completed
    plan.push({
      type: "workflow.completed",
      delay: 800,
      payload: {
        id: `evt-${now}-end`,
        timestamp: now + offset + 800,
        data: { budget: 5000 },
      },
    });

    return plan;
  }, []);

  const run = useCallback(() => {
    clearTimers();
    setEvents([]);
    setIsRunning(true);
    stepIndexRef.current = 0;
    taskProgressRef.current = {};
    creditSpentRef.current = 0;

    const plan = buildPlan();
    let accumulatedDelay = 0;

    plan.forEach((step) => {
      accumulatedDelay += step.delay;
      const t = setTimeout(() => {
        const evt = {
          ...step.payload,
          type: step.type,
          workflowId: "sim-demo",
        } as StreamingWorkflowEvent;

        setEvents((prev) => {
          // dedupe by id
          if (prev.some((p) => p.id === evt.id)) return prev;
          const next = [...prev, evt];
          return next;
        });
      }, accumulatedDelay);

      timerRefs.current.push(t);
    });

    // Mark simulation as finished after last event
    const finishTimer = setTimeout(() => {
      setIsRunning(false);
    }, accumulatedDelay + 200);
    timerRefs.current.push(finishTimer);
  }, [buildPlan, clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setEvents([]);
    setIsRunning(false);
    // Auto-restart after a brief pause so the UI feels responsive
    const t = setTimeout(run, 300);
    timerRefs.current.push(t);
  }, [clearTimers, run]);

  // Auto-start on mount
  useEffect(() => {
    run();
    return clearTimers;
  }, [run, clearTimers]);

  return { events, reset, isRunning };
}
