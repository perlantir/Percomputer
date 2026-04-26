"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils";
import type { WorkflowOption } from "./SelectWorkflow";
import {
  GitCompare,
  Layers,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";

export interface WorkflowCompareProps {
  leftWorkflow: WorkflowOption;
  rightWorkflow: WorkflowOption;
  leftArtifacts?: CompareArtifact[];
  rightArtifacts?: CompareArtifact[];
  leftTasks?: CompareTask[];
  rightTasks?: CompareTask[];
  className?: string;
}

export interface CompareArtifact {
  id: string;
  name: string;
  kind: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface CompareTask {
  id: string;
  title: string;
  kind: string;
  status: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  creditsUsed: number;
  modelId?: string;
}

interface DiffResult<T> {
  added: T[];
  removed: T[];
  modified: { item: T; changes: string[] }[];
  unchanged: T[];
}

function computeDiff<T extends { id: string }>(
  left: T[],
  right: T[],
  compareFn?: (a: T, b: T) => string[]
): DiffResult<T> {
  const leftMap = new Map(left.map((x) => [x.id, x]));
  const rightMap = new Map(right.map((x) => [x.id, x]));

  const added: T[] = [];
  const removed: T[] = [];
  const modified: { item: T; changes: string[] }[] = [];
  const unchanged: T[] = [];

  for (const r of right) {
    const l = leftMap.get(r.id);
    if (!l) {
      added.push(r);
    } else if (compareFn) {
      const changes = compareFn(l, r);
      if (changes.length > 0) {
        modified.push({ item: r, changes });
      } else {
        unchanged.push(r);
      }
    } else {
      unchanged.push(r);
    }
  }

  for (const l of left) {
    if (!rightMap.has(l.id)) {
      removed.push(l);
    }
  }

  return { added, removed, modified, unchanged };
}

export default function WorkflowCompare({
  leftWorkflow,
  rightWorkflow,
  leftArtifacts = [],
  rightArtifacts = [],
  leftTasks = [],
  rightTasks = [],
  className,
}: WorkflowCompareProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview", "tasks", "artifacts"])
  );

  const artifactDiff = useMemo(
    () =>
      computeDiff(leftArtifacts, rightArtifacts, (a, b) => {
        const changes: string[] = [];
        if (a.name !== b.name) changes.push(`name: "${a.name}" → "${b.name}"`);
        if (a.kind !== b.kind) changes.push(`kind: ${a.kind} → ${b.kind}`);
        if (a.sizeBytes !== b.sizeBytes)
          changes.push(`size: ${formatBytes(a.sizeBytes)} → ${formatBytes(b.sizeBytes)}`);
        return changes;
      }),
    [leftArtifacts, rightArtifacts]
  );

  const taskDiff = useMemo(
    () =>
      computeDiff(leftTasks, rightTasks, (a, b) => {
        const changes: string[] = [];
        if (a.title !== b.title) changes.push(`title changed`);
        if (a.status !== b.status) changes.push(`status: ${a.status} → ${b.status}`);
        if (a.kind !== b.kind) changes.push(`kind: ${a.kind} → ${b.kind}`);
        if (a.modelId !== b.modelId) changes.push(`model: ${a.modelId} → ${b.modelId}`);
        return changes;
      }),
    [leftTasks, rightTasks]
  );

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />;
      case "failed":
        return <XCircle className="w-3.5 h-3.5 text-[var(--danger)]" />;
      case "running":
        return (
          <Activity
            className={cn(
              "w-3.5 h-3.5 text-[var(--accent-primary)]",
              typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "animate-pulse"
            )}
          />
        );
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />;
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <GitCompare className="w-5 h-5 text-[var(--accent-primary)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Workflow Comparison
        </h2>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" /> {artifactDiff.added.length + taskDiff.added.length} added
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--danger)]" /> {artifactDiff.removed.length + taskDiff.removed.length} removed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--warning)]" /> {artifactDiff.modified.length + taskDiff.modified.length} changed
          </span>
        </div>
      </div>

      {/* Overview cards */}
      <Section
        title="Overview"
        icon={<Layers className="w-4 h-4" />}
        expanded={expandedSections.has("overview")}
        onToggle={() => toggleSection("overview")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OverviewCard
            workflow={leftWorkflow}
            side="left"
            statusIcon={statusIcon}
          />
          <OverviewCard
            workflow={rightWorkflow}
            side="right"
            statusIcon={statusIcon}
          />
        </div>

        {/* Prompt diff preview */}
        <div className="mt-3 rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <div className="px-3 py-2 bg-[var(--bg-surface-2)] border-b border-[var(--border-subtle)] flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">
              Prompt Diff
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
            <div className="p-3">
              <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Before</p>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                {leftWorkflow.prompt}
              </p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-[var(--text-tertiary)] mb-1">After</p>
              <p
                className={cn(
                  "text-[12px] leading-relaxed",
                  leftWorkflow.prompt === rightWorkflow.prompt
                    ? "text-[var(--text-secondary)]"
                    : "text-[var(--text-primary)]"
                )}
              >
                {rightWorkflow.prompt}
              </p>
              {leftWorkflow.prompt !== rightWorkflow.prompt && (
                <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20">
                  Modified
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Tasks comparison */}
      <Section
        title="Tasks"
        icon={<Zap className="w-4 h-4" />}
        badge={`${taskDiff.added.length + taskDiff.removed.length + taskDiff.modified.length} changes`}
        expanded={expandedSections.has("tasks")}
        onToggle={() => toggleSection("tasks")}
      >
        {renderTaskDiff(taskDiff, leftTasks, rightTasks)}
      </Section>

      {/* Artifacts comparison */}
      <Section
        title="Artifacts"
        icon={<FileText className="w-4 h-4" />}
        badge={`${artifactDiff.added.length + artifactDiff.removed.length + artifactDiff.modified.length} changes`}
        expanded={expandedSections.has("artifacts")}
        onToggle={() => toggleSection("artifacts")}
      >
        {renderArtifactDiff(artifactDiff)}
      </Section>
    </div>
  );
}

/* ──────────────────────────── Sub-components ──────────────────────────── */

function Section({
  title,
  icon,
  badge,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--bg-surface-2)] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        )}
        <span className="text-[var(--text-tertiary)]">{icon}</span>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {title}
        </span>
        {badge && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
            {badge}
          </span>
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function OverviewCard({
  workflow,
  side,
  statusIcon,
}: {
  workflow: WorkflowOption;
  side: "left" | "right";
  statusIcon: (s: string) => React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        side === "left"
          ? "border-[var(--danger)]/20 bg-[var(--danger)]/4"
          : "border-[var(--success)]/20 bg-[var(--success)]/4"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            side === "left" ? "bg-[var(--danger)]" : "bg-[var(--success)]"
          )}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {side === "left" ? "Before" : "After"}
        </span>
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
        {workflow.name}
      </h3>
      <div className="flex items-center gap-2 mb-2">
        {statusIcon(workflow.status)}
        <span className="text-[11px] text-[var(--text-secondary)] capitalize">
          {workflow.status}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
        <Clock className="w-3 h-3" />
        {formatDate(workflow.createdAt)}
        {workflow.version !== undefined && (
          <span className="ml-auto font-mono">v{workflow.version}</span>
        )}
      </div>
    </div>
  );
}

function renderTaskDiff(
  diff: DiffResult<CompareTask>,
  leftTasks: CompareTask[],
  rightTasks: CompareTask[]
) {
  const all = [
    ...diff.removed.map((t) => ({ type: "removed" as const, task: t })),
    ...diff.added.map((t) => ({ type: "added" as const, task: t })),
    ...diff.modified.map((m) => ({ type: "modified" as const, task: m.item, changes: m.changes })),
    ...diff.unchanged.map((t) => ({ type: "unchanged" as const, task: t })),
  ];

  if (all.length === 0) {
    return (
      <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
        No tasks to compare
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {all.map(({ type, task, changes }) => (
        <div
          key={task.id}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors",
            type === "added" && "bg-[var(--success)]/5 border-[var(--success)]/15",
            type === "removed" && "bg-[var(--danger)]/5 border-[var(--danger)]/15",
            type === "modified" && "bg-[var(--warning)]/5 border-[var(--warning)]/15",
            type === "unchanged" && "bg-[var(--bg-surface-2)]/50 border-[var(--border-subtle)]"
          )}
        >
          <div className="flex-shrink-0 w-5 flex justify-center">
            {type === "added" && (
              <span className="text-[var(--success)] text-[14px] font-bold">+</span>
            )}
            {type === "removed" && (
              <span className="text-[var(--danger)] text-[14px] font-bold">−</span>
            )}
            {type === "modified" && (
              <span className="text-[var(--warning)] text-[14px] font-bold">~</span>
            )}
            {type === "unchanged" && (
              <span className="text-[var(--text-tertiary)] text-[14px]">=</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                {task.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface-3)] text-[var(--text-tertiary)] font-mono">
                {task.kind}
              </span>
              {task.modelId && (
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">
                  {task.modelId}
                </span>
              )}
            </div>
            {type === "modified" && changes && (
              <div className="flex flex-wrap gap-1 mt-1">
                {changes.map((c, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning)]/8 text-[var(--warning)] border border-[var(--warning)]/15"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {task.durationMs}ms
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {task.inputTokens + task.outputTokens}t
            </span>
            <span className="font-mono">{task.creditsUsed}c</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderArtifactDiff(diff: DiffResult<CompareArtifact>) {
  const all = [
    ...diff.removed.map((a) => ({ type: "removed" as const, artifact: a })),
    ...diff.added.map((a) => ({ type: "added" as const, artifact: a })),
    ...diff.modified.map((m) => ({ type: "modified" as const, artifact: m.item, changes: m.changes })),
    ...diff.unchanged.map((a) => ({ type: "unchanged" as const, artifact: a })),
  ];

  if (all.length === 0) {
    return (
      <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
        No artifacts to compare
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {all.map(({ type, artifact, changes }) => (
        <div
          key={artifact.id}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors",
            type === "added" && "bg-[var(--success)]/5 border-[var(--success)]/15",
            type === "removed" && "bg-[var(--danger)]/5 border-[var(--danger)]/15",
            type === "modified" && "bg-[var(--warning)]/5 border-[var(--warning)]/15",
            type === "unchanged" && "bg-[var(--bg-surface-2)]/50 border-[var(--border-subtle)]"
          )}
        >
          <div className="flex-shrink-0 w-5 flex justify-center">
            {type === "added" && (
              <span className="text-[var(--success)] text-[14px] font-bold">+</span>
            )}
            {type === "removed" && (
              <span className="text-[var(--danger)] text-[14px] font-bold">−</span>
            )}
            {type === "modified" && (
              <span className="text-[var(--warning)] text-[14px] font-bold">~</span>
            )}
            {type === "unchanged" && (
              <span className="text-[var(--text-tertiary)] text-[14px]">=</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
              <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                {artifact.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface-3)] text-[var(--text-tertiary)] font-mono">
                {artifact.kind}
              </span>
            </div>
            {type === "modified" && changes && (
              <div className="flex flex-wrap gap-1 mt-1">
                {changes.map((c, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning)]/8 text-[var(--warning)] border border-[var(--warning)]/15"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
            <span className="font-mono">{formatBytes(artifact.sizeBytes)}</span>
            <span className="font-mono text-[var(--text-tertiary)]">{artifact.mimeType}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────── Utilities ──────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
