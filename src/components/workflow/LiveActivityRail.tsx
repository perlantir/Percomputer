"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  StreamingWorkflowEvent,
  ModelName,
  CompletedTask,
  ActiveTask,
  ModelInFlight,
  MODEL_COLORS,
} from "../../types/workflow";
import { StatusPill } from "./StatusPill";
import { ProgressBar } from "./ProgressBar";

interface LiveActivityRailProps {
  /** All events for the current workflow (from useWorkflowEvents). */
  events: StreamingWorkflowEvent[];
  /** Whether the panel starts collapsed (default false). */
  defaultCollapsed?: boolean;
  /** Called when a model bar or task row is clicked. */
  onTaskClick?: (taskId: string) => void;
}

/**
 * Right-hand live-activity rail (320 px, collapsible).
 *
 * Sections
 * --------
 * 1. Header with collapse toggle + status pill
 * 2. Credit spend progress bar
 * 3. "Now" – active task with model name & artifact count
 * 4. "Just done" – last 3-5 completed / failed / cancelled tasks
 * 5. "Models in flight" – segmented progress bars per active model
 *
 * Updates in real time as new WorkflowEvents arrive.
 */
export const LiveActivityRail = React.memo(function LiveActivityRail({
  events,
  defaultCollapsed = false,
  onTaskClick,
}: LiveActivityRailProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => setCollapsed((s) => !s), []);

  // ------------------------------------------------------------------
  // Derive state from event stream
  // ------------------------------------------------------------------
  const {
    workflowStatus,
    credits,
    activeTask,
    completedTasks,
    modelsInFlight,
  } = useMemo(() => {
    let workflowStatus: "idle" | "running" | "succeeded" | "failed" = "idle";
    let credits = { spent: 0, total: 5000 };
    const activeTasksMap = new Map<string, ActiveTask>();
    const completed: CompletedTask[] = [];
    const progressMap = new Map<
      string,
      { model: ModelName; taskName: string; progress: number }
    >();

    for (const evt of events) {
      switch (evt.type) {
        case "workflow.started":
          workflowStatus = "running";
          credits = { spent: 0, total: evt.data.budget };
          break;
        case "workflow.completed":
          workflowStatus = "succeeded";
          break;
        case "task.started": {
          activeTasksMap.set(evt.data.taskId, {
            id: evt.data.taskId,
            name: evt.data.name,
            model: evt.data.model,
            startedAt: evt.timestamp,
            artifactCount: evt.data.artifactCount,
          });
          break;
        }
        case "task.completed": {
          const at = activeTasksMap.get(evt.data.taskId);
          if (at) {
            completed.push({
              id: at.id,
              name: at.name,
              model: at.model,
              durationMs: evt.data.durationMs,
              status: "succeeded",
              completedAt: evt.timestamp,
            });
            activeTasksMap.delete(evt.data.taskId);
          }
          break;
        }
        case "task.failed": {
          const atf = activeTasksMap.get(evt.data.taskId);
          if (atf) {
            completed.push({
              id: atf.id,
              name: atf.name,
              model: atf.model,
              durationMs: evt.data.durationMs,
              status: "failed",
              completedAt: evt.timestamp,
            });
            activeTasksMap.delete(evt.data.taskId);
          }
          break;
        }
        case "task.cancelled": {
          const atc = activeTasksMap.get(evt.data.taskId);
          if (atc) {
            completed.push({
              id: atc.id,
              name: atc.name,
              model: atc.model,
              durationMs: evt.data.durationMs,
              status: "cancelled",
              completedAt: evt.timestamp,
            });
            activeTasksMap.delete(evt.data.taskId);
          }
          break;
        }
        case "model.progress": {
          progressMap.set(evt.data.taskId, {
            model: evt.data.model,
            taskName: evt.data.taskName,
            progress: evt.data.progress,
          });
          break;
        }
        case "credit.spend": {
          credits = { spent: evt.data.spent, total: evt.data.total };
          break;
        }
      }
    }

    // Active task = the one with the most recent start time
    let activeTask: ActiveTask | undefined;
    for (const [, at] of activeTasksMap) {
      if (!activeTask || at.startedAt > activeTask.startedAt) {
        activeTask = at;
      }
    }

    // Models in flight = dedupe by model name, keep latest progress
    const modelLatest = new Map<
      ModelName,
      { taskId: string; taskName: string; progress: number }
    >();
    for (const [taskId, p] of progressMap) {
      const existing = modelLatest.get(p.model);
      if (!existing || p.progress > existing.progress) {
        modelLatest.set(p.model, {
          taskId,
          taskName: p.taskName,
          progress: p.progress,
        });
      }
    }

    const modelsInFlight: ModelInFlight[] = Array.from(modelLatest).map(
      ([model, data]) => ({
        model,
        taskId: data.taskId,
        taskName: data.taskName,
        progress: data.progress,
        color: MODEL_COLORS[model] ?? "#94a3b8",
      })
    );

    // Completed tasks: last 5, newest first
    const justDone = completed
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5);

    return {
      workflowStatus,
      credits,
      activeTask,
      completedTasks: justDone,
      modelsInFlight,
    };
  }, [events]);

  const creditPct = Math.min(100, (credits.spent / credits.total) * 100);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.round(ms / 100) / 10;
    return `${s}s`;
  };

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const transitionStyle = prefersReducedMotion
    ? "none"
    : "all 240ms ease-out";

  // ------------------------------------------------------------------
  // Animated number helper (count-up / count-down)
  // ------------------------------------------------------------------
  function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(value);
    const rafRef = useRef<number>();
    const startRef = useRef<number>();
    const fromRef = useRef(value);

    useEffect(() => {
      fromRef.current = display;
      const from = fromRef.current;
      const to = value;
      if (from === to) return;

      const duration = 600;
      const step = (ts: number) => {
        if (!startRef.current) startRef.current = ts;
        const progress = Math.min((ts - startRef.current) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(from + (to - from) * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          startRef.current = undefined;
        }
      };
      rafRef.current = requestAnimationFrame(step);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        startRef.current = undefined;
      };
    }, [value]);

    return <span className="tabular-nums">{display.toLocaleString()}</span>;
  }

  // ------------------------------------------------------------------
  // Keyframe animations (injected once)
  // ------------------------------------------------------------------
  const keyframes = `
    @keyframes checkmark-draw {
      from { stroke-dashoffset: 24; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes avatar-pulse {
      0% { transform: scale(1); opacity: 0.6; }
      70% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }
    @keyframes credit-flash {
      0% { filter: brightness(1); }
      50% { filter: brightness(1.4); }
      100% { filter: brightness(1); }
    }
    @keyframes task-enter {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const StyleBlock = () => (
    <style dangerouslySetInnerHTML={{ __html: keyframes }} />
  );

  // ------------------------------------------------------------------
  // Render collapsed chip
  // ------------------------------------------------------------------
  if (collapsed) {
    return (
      <>
        <StyleBlock />
        <div
          className="h-full bg-surface border-l border-subtle flex flex-col items-center py-4 cursor-pointer select-none"
          style={{ width: 40, transition: transitionStyle }}
          onClick={toggle}
          title="Expand live activity"
          aria-label="Expand live activity panel"
          role="button"
        >
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-4 h-4 text-foreground-tertiary rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span
            className="text-xs font-semibold tracking-wider text-foreground-tertiary"
            style={{ writingMode: "vertical-rl" }}
          >
            LIVE
          </span>
          {workflowStatus === "running" && (
            <span
              className={`w-2 h-2 rounded-full bg-emerald-500 ${
                prefersReducedMotion ? "" : "animate-pulse"
              }`}
              style={prefersReducedMotion ? {} : { animationDuration: "1.4s" }}
            />
          )}
        </div>
      </div>
      </>
    );
  }

  // ------------------------------------------------------------------
  // Render full rail
  // ------------------------------------------------------------------
  return (
    <>
      <StyleBlock />
      <div
        className="h-full bg-surface border-l border-subtle flex flex-col overflow-hidden"
        style={{ width: 320, transition: transitionStyle }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle/50">
        <div className="flex items-center gap-2">
          {workflowStatus === "running" ? (
            <StatusPill status="running" showLabel />
          ) : workflowStatus === "succeeded" ? (
            <StatusPill status="succeeded" showLabel />
          ) : (
            <StatusPill status="pending" showLabel />
          )}
        </div>
        <button
          onClick={toggle}
          className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          aria-label="Collapse live activity panel"
          title="Collapse"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Credit spend */}
        <div>
          <div className="flex items-center justify-between text-xs text-foreground-tertiary mb-1.5">
            <span>
              Spent <AnimatedNumber value={credits.spent} /> /{" "}
              {credits.total.toLocaleString()}
            </span>
            <span className="tabular-nums">{Math.round(creditPct)}%</span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 6, background: "rgba(148,163,184,0.12)" }}
          >
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${creditPct}%`,
                transition: prefersReducedMotion ? "none" : "width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-subtle/30" />

        {/* Now */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
            Now
          </h3>
          {activeTask ? (
            <button
              className="w-full text-left group"
              onClick={() => onTaskClick?.(activeTask.id)}
            >
              <div className="flex items-start gap-2">
                <span className="relative mt-1 shrink-0">
                  <span
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: MODEL_COLORS[activeTask.model] ?? "#94a3b8",
                    }}
                  />
                  {workflowStatus === "running" && !prefersReducedMotion && (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: MODEL_COLORS[activeTask.model] ?? "#94a3b8",
                        animation: "avatar-pulse 1.8s ease-out infinite",
                      }}
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground-primary truncate">
                    {activeTask.name}
                  </div>
                  <div className="text-xs text-foreground-tertiary mt-0.5">
                    <span style={{ color: MODEL_COLORS[activeTask.model] }}>
                      {activeTask.model}
                    </span>
                    {activeTask.artifactCount !== undefined && (
                      <span className="ml-1.5 text-foreground-tertiary">
                        reading {activeTask.artifactCount} artifacts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <p className="text-xs text-foreground-tertiary italic">Waiting…</p>
          )}
        </div>

        {/* Just done */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
            Just done
          </h3>
          {completedTasks.length === 0 ? (
            <p className="text-xs text-foreground-tertiary italic">Nothing yet</p>
          ) : (
            <ul className="space-y-1.5">
              {completedTasks.map((task, idx) => (
                <li
                  key={task.id}
                  style={
                    prefersReducedMotion
                      ? undefined
                      : {
                          animation: "task-enter 300ms ease-out forwards",
                          animationDelay: `${idx * 60}ms`,
                          opacity: 0,
                        }
                  }
                >
                  <button
                    className="w-full text-left group flex items-center gap-2 py-0.5 rounded hover:bg-white/5 px-1 -mx-1"
                    onClick={() => onTaskClick?.(task.id)}
                  >
                    {task.status === "succeeded" && (
                      <svg
                        className="w-3 h-3 text-emerald-500 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          strokeDasharray: 24,
                          strokeDashoffset: 0,
                          animation: prefersReducedMotion
                            ? "none"
                            : "checkmark-draw 350ms ease-out forwards",
                        }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {task.status === "failed" && (
                      <svg
                        className="w-3 h-3 text-red-500 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    {task.status === "cancelled" && (
                      <svg
                        className="w-3 h-3 text-foreground-tertiary shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="4" y1="12" x2="20" y2="12" />
                      </svg>
                    )}
                    <span
                      className={`text-xs truncate ${
                        task.status === "cancelled"
                          ? "line-through text-foreground-tertiary"
                          : "text-foreground-secondary"
                      }`}
                    >
                      {task.name}
                    </span>
                    <span className="text-xs text-foreground-tertiary ml-0.5">
                      · {formatDuration(task.durationMs)}
                    </span>
                    <span
                      className="text-xs ml-auto shrink-0"
                      style={{ color: MODEL_COLORS[task.model] }}
                    >
                      {task.model.split(" ").pop()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-subtle/30" />

        {/* Models in flight */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2.5">
            Models in flight
          </h3>
          {modelsInFlight.length === 0 ? (
            <p className="text-xs text-foreground-tertiary italic">None active</p>
          ) : (
            <ul className="space-y-2.5">
              {modelsInFlight.map((m) => (
                <li key={m.model}>
                  <button
                    className="w-full text-left group"
                    onClick={() => onTaskClick?.(m.taskId)}
                  >
                    <div
                    className="flex items-center justify-between mb-1"
                  >
                    <span className="text-xs font-medium text-foreground-secondary truncate pr-2">
                      {m.model}
                    </span>
                  </div>
                  <ProgressBar
                    progress={m.progress}
                    model={m.model}
                    segments={6}
                  />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </div>
    </>
  );
});
