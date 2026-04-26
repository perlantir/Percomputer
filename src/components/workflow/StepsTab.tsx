"use client";

import React, { useMemo } from "react";
import { TaskRow } from "./TaskRow";
import type { Task, TaskEdge } from "@/src/data/demo-workflows";

export interface StepsTabProps {
  tasks: Task[];
  edges: TaskEdge[];
  activeTaskId?: string | null;
}

type Phase =
  | "Research"
  | "Analysis"
  | "Synthesis"
  | "Code"
  | "Data"
  | "Monitoring"
  | "Other";

function phaseForKind(kind: Task["kind"]): Phase {
  switch (kind) {
    case "research":
    case "scrape":
    case "extract":
      return "Research";
    case "analysis":
    case "compare":
    case "visualize":
      return "Analysis";
    case "synthesis":
    case "write":
      return "Synthesis";
    case "code":
      return "Code";
    case "data-processing":
      return "Data";
    case "monitor":
      return "Monitoring";
    default:
      return "Other";
  }
}

function phaseColor(phase: Phase): string {
  switch (phase) {
    case "Research":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Analysis":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Synthesis":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "Code":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "Data":
      return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
    case "Monitoring":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
}

export function StepsTab({ tasks, edges, activeTaskId }: StepsTabProps) {
  const phases = useMemo(() => {
    const map = new Map<Phase, Task[]>();
    for (const t of tasks) {
      const p = phaseForKind(t.kind);
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(t);
    }
    const order: Phase[] = ["Research", "Analysis", "Synthesis", "Code", "Data", "Monitoring", "Other"];
    return order.filter((p) => map.has(p)).map((p) => ({ phase: p, tasks: map.get(p)! }));
  }, [tasks]);

  const edgeSet = useMemo(() => {
    const s = new Set<string>();
    for (const e of edges) s.add(`${e.from}->${e.to}`);
    return s;
  }, [edges]);

  return (
    <div className="space-y-8">
      {phases.map(({ phase, tasks: phaseTasks }) => (
        <section key={phase}>
          {/* Phase header */}
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${phaseColor(
                phase
              )}`}
            >
              {phase}
            </span>
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="text-xs text-[var(--text-tertiary)]">
              {phaseTasks.length} task{phaseTasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Task rows */}
          <div className="relative space-y-0">
            {phaseTasks.map((task) => (
              <TaskRow
                key={task.id}
                id={task.id}
                index={task.index}
                kind={task.kind}
                name={task.name}
                description={task.description}
                status={task.status}
                assignedModel={task.assignedModel}
                durationMs={task.durationMs}
                toolCalls={task.toolCalls}
                retryCount={task.retryCount}
                dependencies={task.dependencies}
                isActive={task.id === activeTaskId}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Mini DAG legend */}
      {edges.length > 0 && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/30 p-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Dependency Graph
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {edges.map((e, i) => {
              const from = tasks.find((t) => t.id === e.from);
              const to = tasks.find((t) => t.id === e.to);
              if (!from || !to) return null;
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-md bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                >
                  <span className="font-mono text-[var(--accent-primary)]">{from.name}</span>
                  <span className="text-[var(--text-tertiary)]">→</span>
                  <span className="font-mono text-[var(--accent-secondary)]">{to.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
