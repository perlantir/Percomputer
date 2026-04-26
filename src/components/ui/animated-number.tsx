"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface AnimatedNumberProps {
  /** Target value to animate toward. */
  value: number;
  /** Duration of the animation in seconds (default 1.2). */
  duration?: number;
  /** Number of decimal places to display (default 0). */
  decimals?: number;
  /** Prefix rendered before the number (e.g. "$"). */
  prefix?: string;
  /** Suffix rendered after the number (e.g. "%"). */
  suffix?: string;
  /** Easing style for the spring animation. */
  stiffness?: number;
  /** Damping for the spring animation (default 30). */
  damping?: number;
  /** Minimum visual value (used for clamping). */
  min?: number;
  /** Maximum visual value (used for clamping). */
  max?: number;
  /** Custom formatter — if provided, overrides prefix/suffix/decimals. */
  formatter?: (n: number) => string;
  /** Additional classes for the container. */
  className?: string;
  /** Render as a different element (default "span"). */
  as?: "span" | "div" | "p";
  /** Callback fired when animation completes. */
  onComplete?: () => void;
}

/**
 * Animated counter that smoothly counts up or down using a Framer Motion
 * spring. Respects `prefers-reduced-motion` by snapping instantly when
 * the user prefers reduced motion.
 *
 * Usage:
 *   <AnimatedNumber value={totalTokens} suffix=" tokens" />
 *   <AnimatedNumber value={progress} decimals={2} suffix="%" />
 */
export const AnimatedNumber = React.memo(function AnimatedNumber({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = "",
  suffix = "",
  stiffness = 60,
  damping = 30,
  min,
  max,
  formatter,
  className,
  as: Tag = "span",
  onComplete,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const spring = useSpring(0, {
    stiffness,
    damping,
    duration: prefersReducedMotion ? 0 : duration,
  });

  const [display, setDisplay] = useState(
    formatter ? formatter(0) : formatNumber(0, decimals, prefix, suffix)
  );

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (prefersReducedMotion) {
      const clamped = clamp(value, min, max);
      setDisplay(
        formatter
          ? formatter(clamped)
          : formatNumber(clamped, decimals, prefix, suffix)
      );
      onCompleteRef.current?.();
      return;
    }

    const target = clamp(value, min, max);
    spring.set(target);

    const unsubscribe = spring.on("change", (latest: number) => {
      setDisplay(
        formatter
          ? formatter(latest)
          : formatNumber(latest, decimals, prefix, suffix)
      );
    });

    const doneTimer = setTimeout(() => {
      onCompleteRef.current?.();
    }, duration * 1000);

    return () => {
      unsubscribe();
      clearTimeout(doneTimer);
    };
  }, [value, spring, prefersReducedMotion, duration, decimals, prefix, suffix, formatter, min, max]);

  const MotionTag = motion.create(Tag as React.ElementType);

  return (
    <MotionTag
      className={cn("tabular-nums tracking-tight", className)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
    >
      {display}
    </MotionTag>
  );
});

/* ── helpers ── */

function clamp(v: number, min?: number, max?: number): number {
  let n = v;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}

function formatNumber(
  n: number,
  decimals: number,
  prefix: string,
  suffix: string
): string {
  const rounded = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  // Remove trailing zeros for cleaner display
  const clean = decimals > 0 ? rounded.replace(/\.?0+$/, "") : rounded;
  return `${prefix}${clean}${suffix}`;
}

/**
 * AnimatedBar — a thin horizontal bar whose width animates proportionally
 * to a numeric value. Useful for mini charts / progress summaries.
 */
interface AnimatedBarProps {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  className?: string;
  duration?: number;
}

export const AnimatedBar = React.memo(function AnimatedBar({
  value,
  max = 100,
  height = 6,
  color = "var(--accent-primary)",
  className,
  duration = 0.8,
}: AnimatedBarProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const pct = Math.max(0, Math.min(1, value / max)) * 100;

  return (
    <div
      className={cn("w-full rounded-full overflow-hidden", className)}
      style={{ height, background: "var(--bg-surface-3)" }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration, ease: [0.25, 1, 0.5, 1] }
        }
        style={{ background: color }}
      />
    </div>
  );
});
