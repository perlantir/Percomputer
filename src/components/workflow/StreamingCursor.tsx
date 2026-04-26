"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface StreamingCursorProps {
  /** Color of the cursor (default uses accent-primary). */
  color?: string;
  /** Width in pixels (default 2). */
  width?: number;
  /** Height relative to line height or in pixels (default "1.2em"). */
  height?: string | number;
  /** Blink speed in ms per half-cycle (default 530). */
  blinkSpeed?: number;
  /** Shape of the cursor: "bar" | "block" | "underscore" (default "bar"). */
  shape?: "bar" | "block" | "underscore";
  /** Whether the cursor is actively streaming (default true). */
  active?: boolean;
  /** Additional classes. */
  className?: string;
  /** Vertical alignment offset in em (default 0.1). */
  offsetY?: number;
}

/**
 * StreamingCursor
 *
 * A blinking cursor used at the end of streaming / typewriter text.
 * Respects `prefers-reduced-motion` by dimming instead of blinking when
 * reduced motion is preferred.
 *
 * Usage:
 *   <div>
 *     {streamedText}
 *     <StreamingCursor active={isStreaming} />
 *   </div>
 */
export const StreamingCursor = React.memo(function StreamingCursor({
  color = "var(--accent-primary)",
  width = 2,
  height = "1.1em",
  blinkSpeed = 530,
  shape = "bar",
  active = true,
  className,
  offsetY = 0.1,
}: StreamingCursorProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const isReduced = prefersReducedMotion || !active;

  const baseStyle: React.CSSProperties = {
    display: "inline-block",
    verticalAlign: "text-bottom",
    marginBottom: `${offsetY}em`,
    background: color,
    width: shape === "block" ? "0.6em" : shape === "underscore" ? "0.7em" : `${width}px`,
    height: shape === "underscore" ? 2 : height,
    borderRadius: shape === "block" ? 1 : 0,
  };

  if (isReduced) {
    return (
      <span
        className={cn("inline-block", className)}
        style={{
          ...baseStyle,
          opacity: active ? 0.5 : 0,
          transition: "opacity 150ms ease",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.span
      className={cn("inline-block", className)}
      style={baseStyle}
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{
        duration: blinkSpeed / 1000,
        repeat: Infinity,
        repeatType: "loop",
        ease: "steps(1)",
      }}
    />
  );
});

/**
 * StreamingCursorBlock
 *
 * A taller variant that visually occupies a full character cell — useful
 * inside monospaced code blocks or terminal-style output.
 */
interface StreamingCursorBlockProps {
  color?: string;
  active?: boolean;
  className?: string;
}

export const StreamingCursorBlock = React.memo(function StreamingCursorBlock({
  color = "var(--accent-primary)",
  active = true,
  className,
}: StreamingCursorBlockProps) {
  return (
    <StreamingCursor
      color={color}
      shape="block"
      height="1.15em"
      active={active}
      className={className}
    />
  );
});
