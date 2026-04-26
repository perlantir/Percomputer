/**
 * RunWorkflowButton.tsx
 *
 * Run button with states:
 * - Ready → "Run"
 * - Running → "Running..." with spinner
 * - Disabled while running
 * - Positioned in composer toolbar
 */

"use client";

import React from "react";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button, type ButtonProps } from "@/src/components/ui/button";

export type RunButtonState = "ready" | "running" | "disabled";

export interface RunWorkflowButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Current visual state of the button. */
  state?: RunButtonState;
  /** Called when user clicks Run. */
  onRun?: () => void;
  /** Custom label for the ready state. */
  readyLabel?: string;
  /** Custom label for the running state. */
  runningLabel?: string;
  /** Whether to show the play icon in ready state. */
  showIcon?: boolean;
  /** Extra classes for the root. */
  className?: string;
}

export const RunWorkflowButton = React.forwardRef<HTMLButtonElement, RunWorkflowButtonProps>(
  (
    {
      state = "ready",
      onRun,
      readyLabel = "Run",
      runningLabel = "Running...",
      showIcon = true,
      className,
      size = "md",
      ...props
    },
    ref
  ) => {
    const isRunning = state === "running";
    const isDisabled = state === "disabled" || isRunning;

    return (
      <Button
        ref={ref}
        variant="primary"
        size={size}
        disabled={isDisabled}
        onClick={onRun}
        className={cn(
          "relative overflow-hidden",
          isRunning && "cursor-not-allowed opacity-90",
          className
        )}
        {...props}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{runningLabel}</span>
          </>
        ) : (
          <>
            {showIcon && <Play className="h-4 w-4" />}
            <span>{readyLabel}</span>
          </>
        )}

        {/* Subtle progress shimmer when running */}
        {isRunning && (
          <span
            className={cn(
              "absolute inset-0 bg-[var(--accent-primary)]/10",
              typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "animate-pulse"
            )}
            aria-hidden="true"
          />
        )}
      </Button>
    );
  }
);

RunWorkflowButton.displayName = "RunWorkflowButton";
