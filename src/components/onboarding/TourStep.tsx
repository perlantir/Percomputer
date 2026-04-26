"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, SkipForward } from "lucide-react";

export type Placement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStepData {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement: Placement;
}

interface TourStepProps {
  step: TourStepData;
  stepIndex: number;
  totalSteps: number;
  isActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function getElementRect(selector: string): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function computePosition(
  placement: Placement,
  targetRect: DOMRect | null,
  tooltipWidth: number,
  tooltipHeight: number,
  gap = 16
): { x: number; y: number; arrowX: number; arrowY: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Centered modal (no target)
  if (placement === "center" || !targetRect) {
    return {
      x: Math.max(16, (vw - tooltipWidth) / 2),
      y: Math.max(16, (vh - tooltipHeight) / 2),
      arrowX: 0.5,
      arrowY: 0.5,
    };
  }

  let x = 0;
  let y = 0;
  let arrowX = 0.5;
  let arrowY = 0.5;

  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  switch (placement) {
    case "top": {
      x = centerX - tooltipWidth / 2;
      y = targetRect.top - tooltipHeight - gap;
      arrowX = 0.5;
      arrowY = 1;
      break;
    }
    case "bottom": {
      x = centerX - tooltipWidth / 2;
      y = targetRect.bottom + gap;
      arrowX = 0.5;
      arrowY = 0;
      break;
    }
    case "left": {
      x = targetRect.left - tooltipWidth - gap;
      y = centerY - tooltipHeight / 2;
      arrowX = 1;
      arrowY = 0.5;
      break;
    }
    case "right": {
      x = targetRect.right + gap;
      y = centerY - tooltipHeight / 2;
      arrowX = 0;
      arrowY = 0.5;
      break;
    }
  }

  // Clamp to viewport
  x = Math.max(12, Math.min(x, vw - tooltipWidth - 12));
  y = Math.max(12, Math.min(y, vh - tooltipHeight - 12));

  return { x, y, arrowX, arrowY };
}

export const TourStep = React.memo(function TourStep({
  step,
  stepIndex,
  totalSteps,
  isActive,
  onNext,
  onPrev,
  onSkip,
}: TourStepProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, arrowX: 0.5, arrowY: 0.5 });
  const [size, setSize] = useState({ width: 320, height: 160 });

  const recalc = useCallback(() => {
    if (!isActive) return;
    const rect = step.targetSelector ? getElementRect(step.targetSelector) : null;
    const pos = computePosition(
      step.placement,
      rect,
      size.width,
      size.height
    );
    setPosition(pos);
  }, [isActive, step.placement, step.targetSelector, size.width, size.height]);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    const id = setInterval(recalc, 500); // periodic re-check for dynamic layouts
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
      clearInterval(id);
    };
  }, [recalc]);

  useEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      setSize((prev) => {
        if (prev.width !== offsetWidth || prev.height !== offsetHeight) {
          return { width: offsetWidth, height: offsetHeight };
        }
        return prev;
      });
    }
  });

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const showArrow = step.placement !== "center";

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "fixed z-[var(--z-tooltip)] w-[min(92vw,360px)] rounded-xl border shadow-xl",
            "bg-[var(--bg-surface)] border-[var(--border-subtle)]",
            "text-[var(--text-primary)]"
          )}
          style={{
            left: position.x,
            top: position.y,
            boxShadow:
              "0 20px 40px -10px rgb(0 0 0 / 0.25), 0 8px 16px -6px rgb(0 0 0 / 0.1)",
          }}
          role="dialog"
          aria-label={`Onboarding step ${stepIndex + 1} of ${totalSteps}`}
        >
          {/* Arrow pointer */}
          {showArrow && (
            <div
              className={cn(
                "absolute w-3 h-3 rotate-45 border",
                "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
              )}
              style={{
                left:
                  position.arrowX === 0.5
                    ? "50%"
                    : position.arrowX === 0
                    ? "-6px"
                    : "calc(100% - 6px)",
                top:
                  position.arrowY === 0.5
                    ? "50%"
                    : position.arrowY === 0
                    ? "-6px"
                    : "calc(100% - 6px)",
                transform: "translate(-50%, -50%) rotate(45deg)",
                marginLeft: position.arrowX === 0.5 ? 0 : undefined,
                marginTop: position.arrowY === 0.5 ? 0 : undefined,
              }}
            />
          )}

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Step {stepIndex + 1} of {totalSteps}
                </span>
                <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={onSkip}
                className={cn(
                  "shrink-0 rounded-md p-1 text-[var(--text-tertiary)] transition-colors",
                  "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-secondary)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                )}
                aria-label="Skip tour"
                title="Skip tour"
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-4">
              {step.description}
            </p>

            {/* Footer: progress + navigation */}
            <div className="flex items-center justify-between">
              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === stepIndex
                        ? "w-4 bg-[var(--accent-primary)]"
                        : i < stepIndex
                        ? "w-1.5 bg-[var(--accent-primary)]/50"
                        : "w-1.5 bg-[var(--border-default)]"
                    )}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={onPrev}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium",
                      "border border-[var(--border-default)] text-[var(--text-secondary)]",
                      "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
                      "transition-colors"
                    )}
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                )}
                <button
                  onClick={onNext}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium",
                    "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
                    "hover:bg-[var(--accent-primary-hover)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
                    "transition-colors"
                  )}
                >
                  {isLast ? "Finish" : "Next"}
                  {!isLast && <ChevronRight size={14} />}
                </button>
              </div>
            </div>

            {/* Skip link */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={onSkip}
                className={cn(
                  "inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]",
                  "hover:text-[var(--text-secondary)] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-sm"
                )}
              >
                <SkipForward size={12} />
                Skip tour
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
