"use client";

/**
 * SearchResultItem — Single result row with icon, title, subtitle, and highlighted matching text.
 *
 * Supports keyboard navigation (active / selected state), dark mode, and accessible markup.
 */

import React from "react";
import { cn } from "@/src/lib/utils";
import {
  Workflow,
  LayoutGrid,
  FileText,
  Brain,
  Plug,
  ChevronRight,
} from "lucide-react";
import type { SearchResult, SearchResultType } from "@/src/lib/search-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Icon map
// ─────────────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<SearchResultType, React.ElementType> = {
  workflow: Workflow,
  space: LayoutGrid,
  artifact: FileText,
  memory: Brain,
  connector: Plug,
};

const ICON_COLORS: Record<SearchResultType, string> = {
  workflow: "text-[var(--accent-primary)]",
  space: "text-[var(--semantic-info)]",
  artifact: "text-[var(--semantic-success)]",
  memory: "text-[var(--semantic-warning)]",
  connector: "text-[var(--semantic-danger)]",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchResultItemProps {
  result: SearchResult;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  className?: string;
}

export function SearchResultItem({
  result,
  isActive = false,
  isSelected = false,
  onClick,
  onMouseEnter,
  className,
}: SearchResultItemProps) {
  const Icon = ICON_MAP[result.type];
  const iconColor = ICON_COLORS[result.type];

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors duration-fast ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
        isActive
          ? "bg-[var(--bg-surface-2)]"
          : "hover:bg-[var(--bg-surface-2)]/60",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--bg-surface-3)]",
          iconColor
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Text content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Title with highlights */}
        <p className="text-sm font-medium text-[var(--text-primary)]">
          <span
            dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
            className="search-result-title"
          />
        </p>

        {/* Subtitle with highlights */}
        {result.highlightedSubtitle && (
          <p className="text-xs text-[var(--text-secondary)]">
            <span
              dangerouslySetInnerHTML={{
                __html: result.highlightedSubtitle,
              }}
            />
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
          <span className="capitalize">{result.type}</span>
          {result.meta && "status" in result.meta && (
            <>
              <span className="text-[var(--border-subtle)]">·</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-sm px-1 py-0.5 font-medium",
                  getStatusStyle(result.meta.status as string)
                )}
              >
                {String(result.meta.status)}
              </span>
            </>
          )}
          {result.meta && "importance" in result.meta && (
            <>
              <span className="text-[var(--border-subtle)]">·</span>
              <span>Importance {(result.meta.importance as number) * 100}%</span>
            </>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        className={cn(
          "mt-1.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-fast ease-out",
          isActive && "translate-x-0.5 text-[var(--text-secondary)]"
        )}
        aria-hidden="true"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStatusStyle(status: string): string {
  switch (status) {
    case "succeeded":
    case "connected":
    case "healthy":
      return "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]";
    case "running":
    case "pending":
    case "degraded":
      return "bg-[var(--semantic-warning)]/10 text-[var(--semantic-warning)]";
    case "failed":
    case "error":
    case "unhealthy":
      return "bg-[var(--semantic-danger)]/10 text-[var(--semantic-danger)]";
    case "cancelled":
    case "disconnected":
      return "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]";
    default:
      return "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]";
  }
}

export default SearchResultItem;
