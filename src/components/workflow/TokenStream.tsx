"use client";

import React, { useEffect, useRef, useMemo } from "react";

interface TokenStreamProps {
  /** Accumulated Markdown text to render. */
  markdown: string;
  /** Optional callback when user scrolls manually (to pause auto-scroll). */
  onUserScroll?: () => void;
  /** Maximum height of the scrollable area (default 100%). */
  maxHeight?: string;
  /** CSS class applied to the outer container. */
  className?: string;
}

/**
 * Renders a stream of tokens with an opacity ramp on each new chunk.
 *
 * - Each character / chunk fades from opacity 0 → 1 over 80 ms.
 * - Auto-scrolls to bottom unless the user has manually scrolled up.
 * - Respects `prefers-reduced-motion`: disables the fade ramp and snaps
 *   scroll instantly.
 */
export const TokenStream = React.memo(function TokenStream({
  markdown,
  onUserScroll,
  maxHeight = "100%",
  className = "",
}: TokenStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const lastLenRef = useRef(0);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Detect manual scroll to pause auto-scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!el) return;
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      userScrolledRef.current = !nearBottom;
      if (!nearBottom) onUserScroll?.();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [onUserScroll]);

  // Smooth scroll to bottom on new content
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (userScrolledRef.current) return;

    if (prefersReducedMotion) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [markdown, prefersReducedMotion]);

  // Reset user-scrolled flag when markdown resets
  useEffect(() => {
    if (markdown.length === 0) {
      userScrolledRef.current = false;
      lastLenRef.current = 0;
    }
  }, [markdown]);

  // Split into per-character spans so each char can fade in.
  // In production you may want to chunk by token boundary instead.
  const chars = markdown.split("");
  const newStart = lastLenRef.current;
  lastLenRef.current = chars.length;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
        {chars.map((ch, i) => {
          const isNew = i >= newStart;
          const delay = isNew && !prefersReducedMotion ? 0 : 0;
          const opacity = isNew && !prefersReducedMotion ? 0 : 1;

          return (
            <span
              key={`${i}-${ch}`}
              style={{
                opacity,
                transition: prefersReducedMotion
                  ? "none"
                  : "opacity 80ms ease-out",
                animation:
                  isNew && !prefersReducedMotion
                    ? "tokenFadeIn 80ms ease-out forwards"
                    : undefined,
                animationDelay: `${delay}ms`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </pre>
      <style>{`
        @keyframes tokenFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
});
