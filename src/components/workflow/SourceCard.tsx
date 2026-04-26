"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ExternalLink, Quote } from "lucide-react";
import type { SourceCard as SourceCardType } from "@/src/mock/generators";

export interface SourceCardProps {
  source: SourceCardType;
  onClick?: (source: SourceCardType) => void;
}

function domainInitial(domain: string): string {
  return domain.charAt(0).toUpperCase();
}

function domainColor(domain: string): string {
  // Deterministic color based on domain
  const colors = [
    "bg-red-500/15 text-red-600",
    "bg-blue-500/15 text-blue-600",
    "bg-green-500/15 text-green-600",
    "bg-amber-500/15 text-amber-600",
    "bg-purple-500/15 text-purple-600",
    "bg-pink-500/15 text-pink-600",
    "bg-cyan-500/15 text-cyan-600",
    "bg-orange-500/15 text-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export const SourceCard = React.memo(function SourceCard({ source, onClick }: SourceCardProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const cardRef = useRef<HTMLButtonElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [iconReady, setIconReady] = useState(false);
  const [citeKey, setCiteKey] = useState(0);

  // Favicon entrance animation on mount
  useEffect(() => {
    const t = setTimeout(() => setIconReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Citation count change animation
  useEffect(() => {
    setCiteKey((k) => k + 1);
  }, [source.cited]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: Date.now(),
      });
      onClick?.(source);
    },
    [onClick, source]
  );

  // Clean up ripple after animation
  useEffect(() => {
    if (!ripple) return;
    const t = setTimeout(() => setRipple(null), 600);
    return () => clearTimeout(t);
  }, [ripple]);

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      className={`group card relative flex w-full flex-col items-start gap-2 overflow-hidden p-4 text-left hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm ${
        prefersReducedMotion ? "" : "transition-all duration-fast ease-out-quart"
      }`}
    >
      {/* Ripple */}
      {ripple && !prefersReducedMotion && (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-[var(--accent-primary)]/20"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 4,
            height: 4,
            marginLeft: -2,
            marginTop: -2,
            animation: "ripple 500ms ease-out forwards",
          }}
        />
      )}

      {/* Header: favicon + domain + link */}
      <div className="flex w-full items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold ${domainColor(
            source.domain
          )} ${
            iconReady && !prefersReducedMotion
              ? "anim-scale-in"
              : iconReady
                ? "opacity-100"
                : "opacity-0"
          }`}
        >
          {domainInitial(source.domain)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-[var(--text-secondary)]">
            {source.domain}
          </div>
          <div className={`truncate text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] ${prefersReducedMotion ? "" : "transition-colors"}`}>
            {source.title}
          </div>
        </div>
        <ExternalLink className={`h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] opacity-0 ${prefersReducedMotion ? "group-hover:opacity-100" : "transition-opacity group-hover:opacity-100"}`} />
      </div>

      {/* Excerpt */}
      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {source.excerpt}
      </p>

      {/* Footer: cited count */}
      <div className="mt-auto flex w-full items-center justify-between pt-1">
        <span
          key={citeKey}
          className={`inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] ${
            !prefersReducedMotion && citeKey > 0 ? "anim-bounce-in" : ""
          }`}
        >
          <Quote className="h-3 w-3" />
          Cited {source.cited} time{source.cited !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {new Date(source.accessedAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
});
