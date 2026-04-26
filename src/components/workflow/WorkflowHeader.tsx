"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Coins,
  ListChecks,
  Share2,
  Pencil,
  XCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

export interface WorkflowHeaderProps {
  workflowId: string;
  objective: string;
  status: string;
  startedAt: string | null;
  credits: { spent: number; total: number };
  taskCount: number;
  succeededTasks: number;
  onCancel?: () => void;
  onAmend?: () => void;
  onShare?: () => void;
}

const statusVariantMap: Record<string, string> = {
  succeeded: "success",
  running: "info",
  pending: "default",
  failed: "danger",
  cancelled: "warning",
};

function formatDuration(from: string | null): string {
  if (!from) return "—";
  const ms = Date.now() - new Date(from).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export const WorkflowHeader = React.memo(function WorkflowHeader({
  workflowId,
  objective,
  status,
  startedAt,
  credits,
  taskCount,
  succeededTasks,
  onCancel,
  onAmend,
  onShare,
}: WorkflowHeaderProps) {
  const router = useRouter();
  const isRunning = status === "running" || status === "pending";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-[1400px] px-6 py-5">
        {/* Top row: back + title + status */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
                {objective}
              </h1>
              <Badge
                variant={
                  (statusVariantMap[status] as
                    | "success"
                    | "info"
                    | "default"
                    | "danger"
                    | "warning") ?? "default"
                }
                size="sm"
              >
                {isRunning && (
                  <Loader2 className={`mr-1 h-3 w-3 ${prefersReducedMotion ? "" : "animate-spin"}`} />
                )}
                {statusLabel}
              </Badge>
            </div>

            {/* Meta line */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Started {startedAt ? new Date(startedAt).toLocaleString() : "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {credits.spent.toFixed(2)} / {credits.total} credits
              </span>
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                {succeededTasks} / {taskCount} tasks completed
              </span>
            </div>
          </div>

          {/* Actions */}
          {(onCancel || onAmend || onShare) && (
            <div className="flex shrink-0 items-center gap-2">
              {isRunning && onCancel && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onCancel}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              {onAmend && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAmend}
                  className="gap-1.5"
                >
                  <Pencil className="h-4 w-4" />
                  Amend
                </Button>
              )}
              {onShare && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onShare}
                  className="gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
