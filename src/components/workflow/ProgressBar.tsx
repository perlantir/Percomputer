"use client";

import React, { useMemo } from "react";
import { MODEL_COLORS, ModelName } from "../../types/workflow";

interface ProgressBarProps {
  /** Progress fraction 0 → 1. */
  progress: number;
  /** Model name (drives bar colour). */
  model: ModelName;
  /** Optional label text shown to the right of the bar. */
  label?: string;
  /** Number of segments to render (default 6). */
  segments?: number;
  /** If true the bar is a single smooth fill rather than segmented. */
  smooth?: boolean;
  /** Callback fired when the user clicks the bar (link to task detail). */
  onClick?: () => void;
  /** Height in pixels (default 8). */
  height?: number;
}

/**
 * Segmented (or smooth) progress indicator for a model in flight.
 *
 * - Each model gets a distinct colour from MODEL_COLORS.
 * - Segmented mode renders a set of pill-shaped chunks that fill left-to-right.
 * - Smooth mode renders a single rounded bar with an inner fill.
 * - Clicking the bar bubbles up to the parent for task-detail navigation.
 */
export const ProgressBar = React.memo(function ProgressBar({
  progress,
  model,
  label,
  segments = 6,
  smooth = false,
  onClick,
  height = 8,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const color = MODEL_COLORS[model] ?? "#94a3b8";
  const pctLabel = `${Math.round(clamped * 100)}%`;

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const interactive = Boolean(onClick);

  const transition = prefersReducedMotion
    ? "none"
    : "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out";

  const glowShadow = `0 0 6px ${color}40, 0 0 12px ${color}20`;

  if (smooth) {
    return (
      <div
        className={`flex items-center gap-3 w-full group ${interactive ? "cursor-pointer" : ""}`}
        onClick={onClick}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) onClick?.();
        }}
        aria-label={`${model} progress ${pctLabel}`}
      >
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height, background: "rgba(148,163,184,0.15)" }}
        >
          <div
            className="h-full rounded-full origin-left"
            style={{
              width: "100%",
              transform: `scaleX(${clamped})`,
              background: color,
              transition,
              boxShadow: clamped > 0 ? glowShadow : "none",
            }}
          />
        </div>
        <span
          className="text-xs font-medium tabular-nums shrink-0"
          style={{ color }}
        >
          {label ?? pctLabel}
        </span>
      </div>
    );
  }

  // Segmented mode
  return (
    <div
      className={`flex items-center gap-3 w-full group ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) onClick?.();
      }}
      aria-label={`${model} progress ${pctLabel}`}
    >
      <div className="flex-1 flex gap-1" style={{ height }}>
        {Array.from({ length: segments }).map((_, i) => {
          const threshold = (i + 1) / segments;
          const isFilled = clamped >= threshold;
          const isPartial =
            !isFilled && clamped >= i / segments && clamped < threshold;
          const partialWidth = isPartial
            ? ((clamped - i / segments) / (1 / segments)) * 100
            : 0;

          return (
            <div
              key={i}
              className="flex-1 rounded-sm overflow-hidden"
              style={{
                height,
                background: "rgba(148,163,184,0.12)",
              }}
            >
              <div
                className="h-full rounded-sm origin-left"
                style={{
                  width: "100%",
                  transform: isFilled
                    ? "scaleX(1)"
                    : isPartial
                    ? `scaleX(${partialWidth / 100})`
                    : "scaleX(0)",
                  background: color,
                  opacity: isFilled || isPartial ? 1 : 0.3,
                  transition,
                  boxShadow: isFilled || isPartial ? glowShadow : "none",
                }}
              />
            </div>
          );
        })}
      </div>
      <span
        className="text-xs font-medium tabular-nums shrink-0"
        style={{ color }}
      >
        {label ?? pctLabel}
      </span>
    </div>
  );
});
