"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Clock, Wrench, RotateCcw, Terminal } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import type { TaskKind, TaskStatus } from "@/src/data/demo-workflows";

export interface TaskRowProps {
  id: string;
  index: number;
  kind: TaskKind;
  name: string;
  description: string;
  status: TaskStatus;
  assignedModel: string;
  durationMs: number;
  toolCalls: Array<{ tool: string; calls: number }>;
  retryCount: number;
  dependencies: string[];
  isActive?: boolean;
}

const kindIcon: Record<TaskKind, string> = {
  research: "🔍",
  code: "💻",
  synthesis: "📝",
  analysis: "📊",
  "data-processing": "🗄️",
  monitor: "📡",
  extract: "📤",
  visualize: "📈",
  test: "🧪",
  write: "✍️",
  compare: "⚖️",
  scrape: "🕸️",
};

const kindLabel: Record<TaskKind, string> = {
  research: "Research",
  code: "Code",
  synthesis: "Synthesis",
  analysis: "Analysis",
  "data-processing": "Data",
  monitor: "Monitor",
  extract: "Extract",
  visualize: "Visualize",
  test: "Test",
  write: "Write",
  compare: "Compare",
  scrape: "Scrape",
};

const statusColor: Record<TaskStatus, string> = {
  pending: "text-[var(--text-tertiary)]",
  running: "text-[var(--accent-primary)]",
  succeeded: "text-[var(--success)]",
  failed: "text-[var(--danger)]",
  cancelled: "text-[var(--warning)]",
};

function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function sanitizeArgs(args: Record<string, unknown>): string {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (k.toLowerCase().includes("key") || k.toLowerCase().includes("token") || k.toLowerCase().includes("password") || k.toLowerCase().includes("secret")) {
      safe[k] = "***";
    } else {
      safe[k] = v;
    }
  }
  return JSON.stringify(safe, null, 2);
}

export const TaskRow = React.memo(function TaskRow({
  kind,
  name,
  description,
  status,
  assignedModel,
  durationMs,
  toolCalls,
  retryCount,
  isActive,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isRunning = status === "running";
  const totalToolCalls = toolCalls.reduce((s, t) => s + t.calls, 0);

  return (
    <div
      className={`relative transition-all ${
        isActive
          ? "border-l-[3px] border-l-[var(--accent-primary)] bg-[var(--accent-primary)]/[0.03]"
          : "border-l-[3px] border-l-transparent"
      } ${isRunning && !prefersReducedMotion ? "animate-pulse-subtle" : ""}`}
    >
      {/* Timeline connector line */}
      <div className="absolute left-[19px] top-0 h-full w-px bg-[var(--border-subtle)]" />

      {/* Row header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]/50"
      >
        {/* Icon */}
        <div
          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-lg ${
            isActive ? "ring-2 ring-[var(--accent-primary)]/30" : ""
          }`}
        >
          {kindIcon[kind]}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              {kindLabel[kind]}
            </span>
            <span className="text-xs text-[var(--border-default)]">·</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {assignedModel}
            </span>
          </div>

          <div className="mt-0.5 font-medium text-[var(--text-primary)]">
            {name}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">{description}</div>

          {/* Stats row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(durationMs)}
            </span>
            {totalToolCalls > 0 && (
              <span className="inline-flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                {totalToolCalls} tool{totalToolCalls !== 1 ? "s" : ""}
              </span>
            )}
            {retryCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                {retryCount} retry
              </span>
            )}
            <span className={`inline-flex items-center gap-1 ${statusColor[status]}`}>
              <span className="inline-block h-px w-6 bg-current opacity-40" />
              {status}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div className="mt-1 shrink-0 text-[var(--text-tertiary)]">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pl-[60px]">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50 p-4">
            {/* Prompt summary */}
            <div className="mb-3">
              <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Objective
              </h4>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
            </div>

            {/* Tool calls */}
            {toolCalls.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Tool Calls
                </h4>
                <div className="mt-1 space-y-1">
                  {toolCalls.map((tc) => (
                    <div
                      key={tc.tool}
                      className="flex items-center gap-2 rounded-md bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm"
                    >
                      <Terminal className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <code className="font-mono text-xs text-[var(--text-primary)]">
                        {tc.tool}
                      </code>
                      <Badge variant="default" size="sm">
                        {tc.calls} call{tc.calls !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attempt history */}
            {retryCount > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Attempt History
                </h4>
                <div className="mt-1 space-y-1">
                  {Array.from({ length: retryCount + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                    >
                      <span className="font-mono">Attempt {i + 1}</span>
                      <span className="text-[var(--border-default)]">—</span>
                      <span className={i === retryCount ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                        {i === retryCount ? "succeeded" : "failed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status transitions */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Status
              </h4>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">pending</span>
                <span className="text-[var(--border-default)]">→</span>
                <span className={status === "running" ? "text-[var(--accent-primary)] font-medium" : "text-[var(--text-tertiary)]"}>
                  running
                </span>
                <span className="text-[var(--border-default)]">→</span>
                <span className={`font-medium ${statusColor[status]}`}>{status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
