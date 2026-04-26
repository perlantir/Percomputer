"use client";

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  SkipForward,
  MousePointerClick,
} from "lucide-react";
import { TutorialProgress } from "./TutorialProgress";
import type { TutorialStepOverlayProps } from "./tutorialTypes";

/** Padding around the highlighted element */
const HIGHLIGHT_PADDING = 8;

/** Distance between tooltip and highlight box */
const TOOLTIP_OFFSET = 16;

/**
 * TutorialStepOverlay — Renders a full-page dark overlay with a "spotlight"
 * cutout around the target element, plus a floating tooltip.
 *
 * Uses a React portal to render at document.body level.
 */
export function TutorialStepOverlay({
  step,
  stepNumber,
  totalSteps,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onSkip,
  zIndex = 9999,
}: TutorialStepOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [tooltipPlacement, setTooltipPlacement] = useState<string>(
    step.placement ?? "bottom"
  );
  const [isEntering, setIsEntering] = useState(true);
  const [clickWaitMode, setClickWaitMode] = useState(step.waitForClick ?? false);
  const [clicked, setClicked] = useState(false);

  /* ── Find and observe target element ── */
  useEffect(() => {
    const findTarget = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        setIsEntering(true);

        // Scroll target into view if needed
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } else if (step.position) {
        // Fixed position mode — no target element
        setTargetRect(null);
      }
    };

    findTarget();

    // Re-check on resize/scroll
    const onResize = () => findTarget();
    window.addEventListener("resize", onResize);

    // Watch for DOM changes that might affect target position
    const observer = new MutationObserver(() => {
      findTarget();
    });
    observer.observe(document.body, { subtree: true, attributes: true });

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [step.target, step.position]);

  /* ── Position tooltip ── */
  useLayoutEffect(() => {
    if (!tooltipRef.current) return;

    const ttEl = tooltipRef.current;
    const ttRect = ttEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // If using fixed position (no target)
    if (step.position && !targetRect) {
      setTooltipPos({
        top: parseInt(step.position.top, 10),
        left: parseInt(step.position.left, 10),
      });
      return;
    }

    if (!targetRect) return;

    const pad = HIGHLIGHT_PADDING;
    const off = TOOLTIP_OFFSET;

    // Preferred placement
    const placement = step.placement ?? "bottom";
    let top = 0;
    let left = 0;
    let finalPlacement = placement;

    const computePos = (p: string) => {
      switch (p) {
        case "top":
          return {
            top: targetRect.top - off - ttRect.height - pad,
            left: targetRect.left + targetRect.width / 2 - ttRect.width / 2,
          };
        case "top-start":
          return {
            top: targetRect.top - off - ttRect.height - pad,
            left: targetRect.left - pad,
          };
        case "top-end":
          return {
            top: targetRect.top - off - ttRect.height - pad,
            left: targetRect.right - ttRect.width + pad,
          };
        case "bottom":
          return {
            top: targetRect.bottom + off + pad,
            left: targetRect.left + targetRect.width / 2 - ttRect.width / 2,
          };
        case "bottom-start":
          return {
            top: targetRect.bottom + off + pad,
            left: targetRect.left - pad,
          };
        case "bottom-end":
          return {
            top: targetRect.bottom + off + pad,
            left: targetRect.right - ttRect.width + pad,
          };
        case "left":
          return {
            top: targetRect.top + targetRect.height / 2 - ttRect.height / 2,
            left: targetRect.left - off - ttRect.width - pad,
          };
        case "right":
          return {
            top: targetRect.top + targetRect.height / 2 - ttRect.height / 2,
            left: targetRect.right + off + pad,
          };
        default:
          return {
            top: targetRect.bottom + off + pad,
            left: targetRect.left + targetRect.width / 2 - ttRect.width / 2,
          };
      }
    };

    const tryPositions = [
      placement,
      "bottom",
      "top",
      "right",
      "left",
      "bottom-start",
      "top-start",
    ];

    for (const pos of tryPositions) {
      const candidate = computePos(pos);
      if (
        candidate.top >= 8 &&
        candidate.left >= 8 &&
        candidate.top + ttRect.height <= vh - 8 &&
        candidate.left + ttRect.width <= vw - 8
      ) {
        top = candidate.top;
        left = candidate.left;
        finalPlacement = pos;
        break;
      }
    }

    // Fallback: center on screen
    if (top === 0 && left === 0) {
      top = vh / 2 - ttRect.height / 2;
      left = vw / 2 - ttRect.width / 2;
      finalPlacement = "center";
    }

    // Apply custom offset
    top += step.offset?.y ?? 0;
    left += step.offset?.x ?? 0;

    setTooltipPos({ top: Math.round(top), left: Math.round(left) });
    setTooltipPlacement(finalPlacement);
  }, [targetRect, step.placement, step.position, step.offset]);

  /* ── Animation end handler ── */
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 350);
    return () => clearTimeout(timer);
  }, [stepNumber]);

  /* ── Wait-for-click handler ── */
  useEffect(() => {
    if (!step.waitForClick) return;
    setClickWaitMode(true);
    setClicked(false);

    const el = document.querySelector(step.target);
    if (!el) return;

    const handleClick = () => {
      setClicked(true);
      setTimeout(() => onNext(), 250);
    };

    el.addEventListener("click", handleClick);
    // Add a visual pulse to the target element
    el.classList.add("tutorial-target-pulse");

    return () => {
      el.removeEventListener("click", handleClick);
      el.classList.remove("tutorial-target-pulse");
    };
  }, [step.waitForClick, step.target, onNext]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      } else if (e.key === "ArrowRight" && hasNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && hasPrevious) {
        onPrevious();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasNext, hasPrevious, onNext, onPrevious, onSkip]);

  /* ── Spotlight geometry ── */
  const pad = HIGHLIGHT_PADDING;
  const spotlight = targetRect
    ? {
        x: Math.round(targetRect.left - pad),
        y: Math.round(targetRect.top - pad),
        w: Math.round(targetRect.width + pad * 2),
        h: Math.round(targetRect.height + pad * 2),
      }
    : null;

  const entryTransform = isEntering ? "scale(0.96)" : "scale(1)";
  const entryOpacity = isEntering ? 0 : 1;

  const tooltip = (
    <div
      ref={tooltipRef}
      className="fixed z-[99999] w-[22rem] max-w-[calc(100vw-2rem)] animate-slide-up"
      style={{
        top: tooltipPos.top,
        left: tooltipPos.left,
        opacity: entryOpacity,
        transform: entryTransform,
        transition: "opacity 350ms ease-out-expo, transform 350ms ease-out-expo",
      }}
    >
      <div className="rounded-xl border border-border-subtle bg-surface shadow-shadow-high overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-semibold">
              {stepNumber}
            </span>
            <h3 className="text-sm font-semibold text-foreground-primary">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onSkip}
            className="p-1 rounded-md text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-2 transition-colors"
            aria-label="Skip tutorial"
            title="Skip (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="px-4 pb-2">
          <TutorialProgress
            currentStep={stepNumber - 1}
            totalSteps={totalSteps}
            variant="dots"
          />
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {step.content}
          </p>

          {clickWaitMode && !clicked && (
            <div className="mt-3 flex items-center gap-2 text-xs text-accent-primary animate-pulse">
              <MousePointerClick className="w-4 h-4" />
              <span>Click the highlighted element to continue</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border-subtle bg-surface-2">
          <div className="flex items-center gap-1">
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-foreground-secondary hover:text-foreground-primary hover:bg-surface-3 transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onSkip}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-foreground-tertiary hover:text-foreground-secondary hover:bg-surface-3 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {step.secondaryLabel ?? "Skip"}
            </button>

            <button
              onClick={onNext}
              disabled={clickWaitMode && !clicked}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-accent-primary text-foreground-inverse hover:bg-accent-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {step.actionLabel ?? (hasNext ? "Next" : "Finish")}
              {hasNext && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Overlay SVG ── */
  const overlay = (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex }}
      aria-hidden="false"
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial step ${stepNumber} of ${totalSteps}: ${step.title}`}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: isEntering ? 0 : 1,
          transition: "opacity 300ms ease-out-expo",
        }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.w}
                height={spotlight.h}
                rx="8"
                ry="8"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dark backdrop with spotlight cutout */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.55)"
          mask="url(#tutorial-spotlight-mask)"
        />

        {/* Animated border around spotlight */}
        {spotlight && (
          <rect
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.w}
            height={spotlight.h}
            rx="8"
            ry="8"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="2"
            strokeOpacity="0.6"
            className="animate-pulse-glow"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.4;0.8;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </rect>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip}
    </div>
  );

  return createPortal(overlay, document.body);
}
