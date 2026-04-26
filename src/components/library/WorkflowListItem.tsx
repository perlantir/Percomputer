"use client";

import * as React from "react";
import Link from "next/link";
import { GitFork, Archive, ExternalLink, Clock, DollarSign, Box, CheckSquare } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { Workflow, TaskKind } from "@/src/data/demo-workflows";

function statusVariant(status: Workflow["status"]): "default" | "success" | "warning" | "danger" | "secondary" {
  switch (status) {
    case "running":
      return "warning";
    case "succeeded":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
      return "secondary";
    default:
      return "default";
  }
}

function statusLabel(status: Workflow["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface WorkflowListItemProps {
  workflow: Workflow;
  spaceName: string;
  artifactCount: number;
  taskKinds: TaskKind[];
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onFork?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export const WorkflowListItem = React.memo(function WorkflowListItem({
  workflow,
  spaceName,
  artifactCount,
  taskKinds,
  selected,
  onSelect,
  onFork,
  onArchive,
}: WorkflowListItemProps) {
  const durationMs = workflow.completedAt
    ? new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()
    : Date.now() - new Date(workflow.startedAt).getTime();

  return (
    <div
      className={cn(
        "group card relative flex flex-col gap-3 p-4 transition-all duration-fast ease-out",
        "hover:shadow-[0_10px_15px_-3px_rgb(0_0_0_/0.05)]"
      )}
    >
      {/* Top row: checkbox + status + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onSelect && (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect(workflow.id, e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
            </label>
          )}
          <Badge variant={statusVariant(workflow.status)} className="shrink-0">
            {statusLabel(workflow.status)}
          </Badge>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
            {workflow.objective}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onFork?.(workflow.id)}
            aria-label={`Fork workflow: ${workflow.objective}`}
          >
            <GitFork className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onArchive?.(workflow.id)}
            aria-label={`Archive workflow: ${workflow.objective}`}
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Link href={`/w/${workflow.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`View workflow: ${workflow.objective}`}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Kind chips */}
      <div className="flex flex-wrap gap-1">
        {Array.from(new Set(taskKinds)).map((kind) => (
          <span
            key={kind}
            className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]"
          >
            {kind}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)]">
        <span className="text-[var(--text-secondary)] font-medium">{spaceName}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(workflow.startedAt)}
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3" />
          {formatDuration(durationMs)}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          ${workflow.spentCredits.toFixed(2)}
        </span>
        <span className="flex items-center gap-1">
          <Box className="h-3 w-3" />
          {artifactCount} {artifactCount === 1 ? "artifact" : "artifacts"}
        </span>
      </div>
    </div>
  );
});
