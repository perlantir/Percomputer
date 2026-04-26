"use client";

import React, { useMemo } from "react";
import { TaskStatus } from "../../types/workflow";

interface StatusPillProps {
  status: TaskStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  ready: "Ready",
  running: "Running",
  succeeded: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
  skipped: "Skipped",
};

/**
 * Animated status indicator with model-specific iconography.
 *
 * - `running`  → pulsing green/accent dot
 * - `succeeded`→ checkmark
 * - `failed`   → X mark
 * - `pending`  → gray dot
 * - `cancelled`→ strikethrough
 */
export const StatusPill = React.memo(function StatusPill({
  status,
  size = "sm",
  showLabel = true,
}: StatusPillProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const sizeClasses = size === "md" ? "w-3 h-3" : "w-2 h-2";

  const dot = (
    <span
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses} shrink-0`}
      aria-hidden="true"
    >
      {status === "running" && (
        <span
          className={`block w-full h-full rounded-full bg-[var(--semantic-success)] ${
            prefersReducedMotion ? "" : "animate-pulse"
          }`}
          style={prefersReducedMotion ? {} : { animationDuration: "1.4s" }}
        />
      )}
      {status === "succeeded" && (
        <svg
          className="w-full h-full text-[var(--semantic-success)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {status === "failed" && (
        <svg
          className="w-full h-full text-[var(--semantic-danger)]"
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
      {status === "pending" && (
        <span className="block w-full h-full rounded-full bg-[var(--text-tertiary)]" />
      )}
      {status === "ready" && (
        <span className="block w-full h-full rounded-full bg-[var(--accent-primary)]" />
      )}
      {status === "cancelled" && (
        <svg
          className="w-full h-full text-[var(--text-tertiary)]"
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
      {status === "skipped" && (
        <svg
          className="w-full h-full text-[var(--text-tertiary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
        </svg>
      )}
    </span>
  );

  return (
    <span
      className="inline-flex items-center gap-2 text-sm"
      aria-label={STATUS_LABELS[status]}
    >
      {dot}
      {showLabel && (
        <span
          className={`${
            status === "cancelled" || status === "skipped" ? "line-through text-[var(--text-tertiary)]" : ""
          } ${status === "failed" ? "text-[var(--semantic-danger)]" : ""}`}
        >
          {STATUS_LABELS[status]}
        </span>
      )}
    </span>
  );
});
