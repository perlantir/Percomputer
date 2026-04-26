/**
 * WorkflowStatusBadge.tsx
 *
 * Status badge with all workflow states:
 * - Queued, Planning, Running, Paused, Succeeded, Failed, Cancelling, Cancelled
 * - Each with appropriate color and icon
 * - Animated pulse for active states
 */

"use client";

import React, { useMemo } from "react";
import {
  Clock,
  BrainCircuit,
  Loader2,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Ban,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { WorkflowStatus } from "@/src/types";

export interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  /** Show label text alongside icon. */
  showLabel?: boolean;
  /** Badge size. */
  size?: "sm" | "md" | "lg";
  /** Additional className. */
  className?: string;
}

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  pulse: boolean;
}

const STATUS_META: Record<WorkflowStatus, StatusMeta> = {
  queued: {
    label: "Queued",
    icon: Clock,
    colorClass: "text-[var(--text-secondary)]",
    bgClass: "bg-[var(--bg-surface-2)]",
    borderClass: "border-[var(--border-subtle)]",
    pulse: false,
  },
  planning: {
    label: "Planning",
    icon: BrainCircuit,
    colorClass: "text-[var(--semantic-info)]",
    bgClass: "bg-[var(--semantic-info)]/10",
    borderClass: "border-[var(--semantic-info)]/20",
    pulse: true,
  },
  running: {
    label: "Running",
    icon: Loader2,
    colorClass: "text-[var(--accent-primary)]",
    bgClass: "bg-[var(--accent-primary)]/10",
    borderClass: "border-[var(--accent-primary)]/20",
    pulse: true,
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    colorClass: "text-[var(--semantic-warning)]",
    bgClass: "bg-[var(--semantic-warning)]/10",
    borderClass: "border-[var(--semantic-warning)]/20",
    pulse: false,
  },
  succeeded: {
    label: "Succeeded",
    icon: CheckCircle2,
    colorClass: "text-[var(--semantic-success)]",
    bgClass: "bg-[var(--semantic-success)]/10",
    borderClass: "border-[var(--semantic-success)]/20",
    pulse: false,
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    colorClass: "text-[var(--semantic-danger)]",
    bgClass: "bg-[var(--semantic-danger)]/10",
    borderClass: "border-[var(--semantic-danger)]/20",
    pulse: false,
  },
  cancelling: {
    label: "Cancelling",
    icon: OctagonAlert,
    colorClass: "text-[var(--semantic-warning)]",
    bgClass: "bg-[var(--semantic-warning)]/10",
    borderClass: "border-[var(--semantic-warning)]/20",
    pulse: true,
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    colorClass: "text-[var(--text-secondary)]",
    bgClass: "bg-[var(--bg-surface-2)]",
    borderClass: "border-[var(--border-subtle)]",
    pulse: false,
  },
};

export const WorkflowStatusBadge = React.forwardRef<HTMLSpanElement, WorkflowStatusBadgeProps>(
  ({ status, showLabel = true, size = "md", className }, ref) => {
    const meta = STATUS_META[status] ?? STATUS_META.queued;
    const Icon = meta.icon;

    const sizeClasses = {
      sm: "px-1.5 py-0.5 text-[11px] gap-1",
      md: "px-2.5 py-1 text-xs gap-1.5",
      lg: "px-3 py-1.5 text-sm gap-2",
    };

    const iconSizes = {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    };

    const prefersReducedMotion = useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-medium transition-colors",
          sizeClasses[size],
          meta.colorClass,
          meta.bgClass,
          meta.borderClass,
          meta.pulse && !prefersReducedMotion && "animate-pulse",
          className
        )}
        aria-label={`Workflow status: ${meta.label}`}
      >
        <Icon
          className={cn(
            iconSizes[size],
            meta.pulse && !prefersReducedMotion && status === "running" && "animate-spin",
            meta.pulse && !prefersReducedMotion && status === "planning" && "animate-pulse"
          )}
          aria-hidden="true"
        />
        {showLabel && <span>{meta.label}</span>}
      </span>
    );
  }
);

WorkflowStatusBadge.displayName = "WorkflowStatusBadge";
