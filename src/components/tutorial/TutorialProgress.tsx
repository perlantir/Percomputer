"use client";

import { memo } from "react";
import { Check } from "lucide-react";
import type { TutorialProgressProps } from "./tutorialTypes";

/**
 * TutorialProgress — Visual progress indicator for a tutorial.
 *
 * Variants:
 *   dots   — Row of dots, current step highlighted
 *   bar    — Linear progress bar
 *   steps  — Numbered step indicators with connector lines
 */
export const TutorialProgress = memo(function TutorialProgress({
  currentStep,
  totalSteps,
  variant = "dots",
  className = "",
}: Omit<TutorialProgressProps, "tutorial"> & { currentStep: number; totalSteps: number }) {
  if (totalSteps <= 0) return null;

  const progress = Math.min(currentStep / Math.max(totalSteps - 1, 1), 1);

  switch (variant) {
    case "bar":
      return (
        <div className={`w-full ${className}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-foreground-tertiary">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-[11px] font-medium text-foreground-tertiary">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-primary transition-all duration-350 ease-out-expo"
              style={{ width: `${progress * 100}%` }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
            />
          </div>
        </div>
      );

    case "steps":
      return (
        <div className={`w-full ${className}`}>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;
              const isLast = i === totalSteps - 1;

              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`
                        flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold
                        transition-all duration-250 ease-out-expo
                        ${
                          isCompleted
                            ? "bg-accent-primary text-foreground-inverse"
                            : isActive
                              ? "bg-accent-primary/15 text-accent-primary ring-2 ring-accent-primary/30"
                              : "bg-surface-3 text-foreground-tertiary"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        i + 1
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-px mx-1 bg-border-subtle relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-accent-primary transition-all duration-350 ease-out-expo"
                        style={{
                          width: i < currentStep ? "100%" : "0%",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case "dots":
    default:
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;

            return (
              <div
                key={i}
                className={`
                  rounded-full transition-all duration-250 ease-out-expo
                  ${
                    isCompleted
                      ? "w-2 h-2 bg-accent-primary"
                      : isActive
                        ? "w-5 h-2 bg-accent-primary rounded-pill"
                        : "w-2 h-2 bg-surface-3"
                  }
                `}
                role="progressbar"
                aria-label={`Step ${i + 1}${isActive ? " (current)" : isCompleted ? " (completed)" : ""}`}
              />
            );
          })}
        </div>
      );
  }
});

/** Compact inline progress used inside the tooltip */
export function TutorialProgressInline({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <TutorialProgress
      currentStep={currentStep}
      totalSteps={totalSteps}
      variant="dots"
    />
  );
}
