"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { Clock, Zap } from "lucide-react";

export interface RecentWorkflowCardProps {
  id: string;
  status: "queued" | "planning" | "running" | "paused" | "succeeded" | "failed" | "cancelling" | "cancelled";
  objective: string;
  startedAt: string;
  taskCount: number;
  succeededTasks: number;
  spentCredits: number;
  budgetCredits: number;
}

function StatusPill({ status }: { status: RecentWorkflowCardProps["status"] }) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const statusConfig = {
    running: {
      label: "Running",
      dotClass: cn("bg-accent-primary", !prefersReducedMotion && "animate-pulse-subtle"),
      glowClass: "group-hover:shadow-[0_0_8px_var(--accent-primary)]",
      bgClass: "bg-accent-primary/10 text-accent-primary",
    },
    succeeded: {
      label: "Succeeded",
      dotClass: "bg-[var(--semantic-success)]",
      glowClass: "group-hover:shadow-[0_0_8px_var(--semantic-success)]",
      bgClass: "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]",
    },
    failed: {
      label: "Failed",
      dotClass: "bg-[var(--semantic-danger)]",
      glowClass: "group-hover:shadow-[0_0_8px_var(--semantic-danger)]",
      bgClass: "bg-[var(--semantic-danger)]/10 text-[var(--semantic-danger)]",
    },
    queued: {
      label: "Queued",
      dotClass: "bg-foreground-tertiary",
      glowClass: "group-hover:shadow-[0_0_8px_var(--foreground-tertiary)]",
      bgClass: "bg-surface-2 text-foreground-secondary",
    },
    planning: {
      label: "Planning",
      dotClass: cn("bg-accent-tertiary", !prefersReducedMotion && "animate-pulse-subtle"),
      glowClass: "group-hover:shadow-[0_0_8px_var(--accent-tertiary)]",
      bgClass: "bg-accent-tertiary/10 text-accent-tertiary",
    },
    paused: {
      label: "Paused",
      dotClass: "bg-foreground-tertiary",
      glowClass: "group-hover:shadow-[0_0_8px_var(--foreground-tertiary)]",
      bgClass: "bg-surface-2 text-foreground-secondary",
    },
    cancelling: {
      label: "Cancelling",
      dotClass: cn("bg-foreground-tertiary", !prefersReducedMotion && "animate-pulse-subtle"),
      glowClass: "group-hover:shadow-[0_0_8px_var(--foreground-tertiary)]",
      bgClass: "bg-surface-2 text-foreground-secondary",
    },
    cancelled: {
      label: "Cancelled",
      dotClass: "bg-foreground-tertiary",
      glowClass: "group-hover:shadow-[0_0_8px_var(--foreground-tertiary)]",
      bgClass: "bg-surface-2 text-foreground-secondary",
    },
  };

  const config = statusConfig[status] ?? statusConfig.queued;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        config.bgClass
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full transition-shadow duration-fast", config.dotClass, config.glowClass)} />
      {config.label}
    </span>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatCredits(n: number): string {
  return n.toLocaleString();
}

export const RecentWorkflowCard = React.memo(function RecentWorkflowCard({
  id,
  status,
  objective,
  startedAt,
  taskCount,
  succeededTasks,
  spentCredits,
  budgetCredits,
}: RecentWorkflowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link
        href={`/w/${id}`}
        className={cn(
          "group flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-low transition-all duration-fast ease-out",
          "hover:shadow-medium hover:-translate-y-0.5 hover:border-accent-primary/30"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <StatusPill status={status} />
          <span className="flex items-center gap-1 text-2xs text-foreground-tertiary">
            <Zap className="h-3 w-3" />
            {formatCredits(spentCredits)} / {formatCredits(budgetCredits)} cr
          </span>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground-primary">
          {objective}
        </p>

        <div className="flex items-center gap-1.5 text-2xs text-foreground-tertiary">
          <Clock className="h-3 w-3" />
          <span>Started {formatRelativeTime(startedAt)}</span>
          <span className="mx-1">·</span>
          <span>
            {succeededTasks} of {taskCount} tasks
          </span>
        </div>
      </Link>
    </motion.div>
  );
});
