"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import type { SourceCard } from "@/src/mock/generators";

/* ── Blur data URL for placeholder (1x1 transparent pixel) ── */
const ICON_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=";

interface CitationPopoverProps {
  source: SourceCard;
  number: number;
  onViewSource?: (sourceId: string) => void;
}

const citationSpring = { type: "spring" as const, stiffness: 480, damping: 28, mass: 0.6 };

export function CitationPopover({ source, number, onViewSource }: CitationPopoverProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={shouldReduce ? { duration: 0.1 } : citationSpring}
      className="w-72 rounded-md bg-surface border border-border-subtle shadow-high p-4 will-change-transform"
    >
      <div className="flex items-start gap-3">
        {/* Favicon placeholder */}
        <div className="flex-shrink-0">
          {source.favicon ? (
            <Image
              src={source.favicon}
              alt=""
              width={20}
              height={20}
              className="rounded-sm"
              loading="lazy"
              placeholder="blur"
              blurDataURL={ICON_BLUR_DATA_URL}
            />
          ) : (
            <div className="h-5 w-5 rounded-sm bg-surface-2 flex items-center justify-center">
              <span className="text-[8px] font-bold text-foreground-tertiary uppercase">
                {source.domain.slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground-secondary truncate">
            {source.domain}
          </p>
          <h4 className="text-sm font-semibold text-foreground-primary leading-tight mt-0.5 line-clamp-2">
            {source.title}
          </h4>
        </div>
      </div>

      <p className="mt-3 text-xs text-foreground-secondary leading-relaxed line-clamp-3">
        {source.excerpt}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-2xs text-foreground-tertiary">
          Cited in answer
        </span>
        <button
          onClick={() => onViewSource?.(source.id)}
          className="inline-flex items-center gap-1 text-2xs font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
        >
          View source
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
