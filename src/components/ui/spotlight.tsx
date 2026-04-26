"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ── types ── */

export interface SpotlightStep {
  /** CSS selector for the target element, or a ref to it. */
  target: string | React.RefObject<HTMLElement | null>;
  /** Optional label / description displayed near the target. */
  label?: string;
  /** Extra padding (px) around the target highlight (default: 8). */
  padding?: number;
  /** Border radius (px) of the highlight hole (default: 8). */
  radius?: number;
}

export interface SpotlightProps {
  /** Array of steps to highlight in sequence. */
  steps: SpotlightStep[];
  /** Index of the currently active step. */
  activeIndex?: number;
  /** Whether the spotlight is visible. */
  open?: boolean;
  /** Called when the user clicks the overlay background (dismiss). */
  onDismiss?: () => void;
  /** Global default padding around each target (default: 8). */
  padding?: number;
  /** Global default border radius of the cutout (default: 8). */
  radius?: number;
  /** Opacity of the dark overlay (0–1, default: 0.65). */
  overlayOpacity?: number;
  /** Animation duration in seconds (default: 0.45). */
  transitionDuration?: number;
  /** CSS z-index for the overlay (default: 9999). */
  zIndex?: number;
  /** Custom class for the overlay layer. */
  className?: string;
  /**
   * Whether clicks pass through the dark overlay (default: true).
   * When true, the user can still interact with the page.
   * Set to false if you want to force them to acknowledge the spotlight.
   */
  clickThrough?: boolean;
}

export interface SpotlightApi {
  /** Move to the next step. */
  next: () => void;
  /** Move to the previous step. */
  prev: () => void;
  /** Jump to a specific step index. */
  goTo: (index: number) => void;
  /** Current active step index. */
  index: number;
  /** Total number of steps. */
  total: number;
  /** Whether the spotlight is open. */
  isOpen: boolean;
  /** Open the spotlight. */
  open: () => void;
  /** Close the spotlight. */
  close: () => void;
  /** Toggle open/closed. */
  toggle: () => void;
}

/* ── easing ── */

const EASE = [0.16, 1, 0.3, 1] as const; /* ease-out-expo */

/* ── helpers ── */

function getTargetRect(
  step: SpotlightStep,
  defaultPadding: number
): DOMRect | null {
  let el: HTMLElement | null = null;

  if (typeof step.target === "string") {
    el = document.querySelector(step.target) as HTMLElement | null;
  } else if (step.target?.current) {
    el = step.target.current;
  }

  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const pad = step.padding ?? defaultPadding;

  /* Return a padded rect */
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
    x: rect.x - pad,
    y: rect.y - pad,
    toJSON: () => ({}),
  };
}

/* ── component ── */

/**
 * Spotlight
 *
 * Onboarding spotlight overlay that darkens the entire page except for a
 * highlighted cutout around a target element. Supports multi-step flows
 * with smooth animated transitions between targets.
 *
 * Features:
 *   - Full-page darkened overlay with configurable opacity
 *   - Animated cutout that smoothly morphs between target elements
 *   - Click-through overlay so users can still interact with the UI
 *   - Configurable padding & border radius per step
 *   - Reduced-motion support
 *
 * Usage:
 *   <Spotlight
 *     steps={[
 *       { target: "#sidebar", label: "Navigation lives here" },
 *       { target: "#search-bar", label: "Search across all agents" },
 *     ]}
 *     open={spotlightOpen}
 *     activeIndex={step}
 *     onDismiss={() => setSpotlightOpen(false)}
 *     padding={12}
 *     radius={12}
 *   />
 */
export function Spotlight({
  steps,
  activeIndex = 0,
  open = true,
  onDismiss,
  padding = 8,
  radius = 8,
  overlayOpacity = 0.65,
  transitionDuration = 0.45,
  zIndex = 9999,
  className,
  clickThrough = true,
}: SpotlightProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const [rect, setRect] = useState<DOMRect | null>(null);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [isVisible, setIsVisible] = useState(false);

  /* Sync visibility with open prop */
  useEffect(() => {
    if (open) {
      /* Small delay to let the browser paint before measuring */
      const timer = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(timer);
    }
    setIsVisible(false);
  }, [open]);

  /* Measure target on mount, resize, scroll and activeIndex changes */
  const measure = useCallback(() => {
    if (!open || !steps.length) return;
    const step = steps[Math.min(activeIndex, steps.length - 1)];
    if (!step) return;

    const measured = getTargetRect(step, padding);
    if (measured) {
      setRect(measured);
      setLabel(step.label);
      setCurrentRadius(step.radius ?? radius);
    }
  }, [open, steps, activeIndex, padding, radius]);

  useEffect(() => {
    measure();

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;

    const step = steps[Math.min(activeIndex, steps.length - 1)];
    if (step && ro) {
      const el =
        typeof step.target === "string"
          ? document.querySelector(step.target)
          : step.target.current;
      if (el) ro.observe(el);
    }

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      ro?.disconnect();
    };
  }, [measure, steps, activeIndex]);

  /* Viewport dimensions for SVG coordinate system */
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* Compute label position (below target by default) */
  const labelPos = useMemo(() => {
    if (!rect) return null;
    return {
      x: rect.left + rect.width / 2,
      y: rect.bottom + 16,
    };
  }, [rect]);

  const { w: vw, h: vh } = viewport;

  /* Reduced motion = instant transition */
  const dur = prefersReducedMotion ? 0 : transitionDuration;

  if (!open || !isVisible) return null;

  return (
    <div
      className={cn(
        "spotlight-overlay fixed inset-0",
        clickThrough && "pointer-events-none",
        className
      )}
      style={{ zIndex }}
      onClick={onDismiss}
      role="presentation"
      aria-hidden="true"
      data-testid="spotlight-overlay"
    >
      {/* ── SVG mask overlay ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="none"
        style={{ pointerEvents: clickThrough ? "none" : "auto" }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* Everything white = fully visible */}
            <rect x="0" y="0" width={vw} height={vh} fill="white" />

            {/* Cutout = black hole reveals the target beneath */}
            {rect && (
              <motion.rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={currentRadius}
                fill="black"
                initial={false}
                animate={{
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  rx: currentRadius,
                }}
                transition={{ duration: dur, ease: EASE }}
                style={{ willChange: "x, y, width, height" }}
              />
            )}
          </mask>
        </defs>

        {/* Dark overlay with mask applied */}
        <motion.rect
          x="0"
          y="0"
          width={vw}
          height={vh}
          fill="black"
          mask="url(#spotlight-mask)"
          initial={false}
          animate={{ opacity: overlayOpacity }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ willChange: "opacity" }}
        />
      </svg>

      {/* ── Optional label ── */}
      <AnimatePresence mode="wait">
        {label && labelPos && (
          <motion.div
            key={activeIndex}
            className="absolute left-0 pointer-events-none"
            style={{
              top: labelPos.y,
              transform: "translateX(-50%)",
              left: labelPos.x,
            }}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: dur * 0.6, ease: EASE }}
          >
            <div className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-high whitespace-nowrap">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── hook ── */

/**
 * useSpotlight
 *
 * Manages spotlight state and provides imperative navigation.
 *
 * Usage:
 *   const spotlight = useSpotlight([
 *     { target: "#step-1", label: "First, go here" },
 *     { target: "#step-2", label: "Then, go here" },
 *   ]);
 *
 *   // Open
 *   spotlight.open();
 *
 *   // Advance manually
 *   spotlight.next();
 */
export function useSpotlight(
  steps: SpotlightStep[],
  initialIndex = 0
): SpotlightApi {
  const [index, setIndex] = useState(initialIndex);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);

  const next = useCallback(() => {
    setIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  }, [steps.length]);

  const prev = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goTo = useCallback((i: number) => {
    setIndex(Math.max(0, i));
  }, []);

  return useMemo(
    () => ({
      index,
      total: steps.length,
      isOpen,
      open,
      close,
      toggle,
      next,
      prev,
      goTo,
    }),
    [index, steps.length, isOpen, open, close, toggle, next, prev, goTo]
  );
}

/* ── step indicator ── */

interface SpotlightStepIndicatorProps {
  /** Total number of steps. */
  total: number;
  /** Index of the currently active step (0-based). */
  activeIndex: number;
  /** Called when a dot is clicked. */
  onChange?: (index: number) => void;
  /** Custom class for the container. */
  className?: string;
  /** Size of each dot in px (default: 8). */
  dotSize?: number;
  /** Gap between dots in px (default: 8). */
  gap?: number;
}

/**
 * SpotlightStepIndicator
 *
 * Dot-style progress indicator for multi-step onboarding flows.
 * Animates smoothly between active states. Clickable to jump steps.
 *
 * Usage:
 *   <SpotlightStepIndicator
 *     total={4}
 *     activeIndex={spotlight.index}
 *     onChange={spotlight.goTo}
 *   />
 */
export function SpotlightStepIndicator({
  total,
  activeIndex,
  onChange,
  className,
  dotSize = 8,
  gap = 8,
}: SpotlightStepIndicatorProps) {
  return (
    <div
      className={cn("flex items-center", className)}
      style={{ gap }}
      role="tablist"
      aria-label="Onboarding steps"
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <motion.button
            key={i}
            role="tab"
            aria-selected={isActive}
            aria-label={`Step ${i + 1}${isActive ? " (current)" : ""}`}
            onClick={() => onChange?.(i)}
            className={cn(
              "relative rounded-full transition-colors duration-fast",
              onChange ? "cursor-pointer" : "cursor-default"
            )}
            style={{ width: dotSize, height: dotSize }}
            animate={{
              scale: isActive ? 1.35 : 1,
              backgroundColor: isActive
                ? "var(--accent-primary, #6366f1)"
                : "var(--border-default, rgba(255,255,255,0.25))",
            }}
            transition={{ duration: 0.3, ease: EASE }}
            whileHover={onChange ? { scale: 1.5 } : undefined}
            whileTap={onChange ? { scale: 0.9 } : undefined}
          >
            {isActive && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: "var(--accent-primary, #6366f1)",
                }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
