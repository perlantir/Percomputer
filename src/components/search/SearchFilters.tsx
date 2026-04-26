"use client";

/**
 * SearchFilters — Filter chips for result types (workflow, space, artifact, memory, connector).
 *
 * Usage:
 *   <SearchFilters
 *     activeFilters={["workflow", "space"]}
 *     onToggle={(type) => ...}
 *     onClear={() => ...}
 *   />
 */

import React from "react";
import { cn } from "@/src/lib/utils";
import {
  Workflow,
  LayoutGrid,
  FileText,
  Brain,
  Plug,
  X,
} from "lucide-react";
import type { SearchResultType } from "@/src/lib/search-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_CONFIG: {
  type: SearchResultType;
  label: string;
  icon: React.ElementType;
  colorClass: string; // tailwind bg/text classes for the active state
}[] = [
  {
    type: "workflow",
    label: "Workflows",
    icon: Workflow,
    colorClass:
      "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30",
  },
  {
    type: "space",
    label: "Spaces",
    icon: LayoutGrid,
    colorClass:
      "bg-[var(--semantic-info)]/15 text-[var(--semantic-info)] border-[var(--semantic-info)]/30",
  },
  {
    type: "artifact",
    label: "Artifacts",
    icon: FileText,
    colorClass:
      "bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border-[var(--semantic-success)]/30",
  },
  {
    type: "memory",
    label: "Memory",
    icon: Brain,
    colorClass:
      "bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/30",
  },
  {
    type: "connector",
    label: "Connectors",
    icon: Plug,
    colorClass:
      "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)] border-[var(--semantic-danger)]/30",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchFiltersProps {
  activeFilters: SearchResultType[];
  onToggle: (type: SearchResultType) => void;
  onClear: () => void;
  className?: string;
  counts?: Partial<Record<SearchResultType, number>>;
}

export function SearchFilters({
  activeFilters,
  onToggle,
  onClear,
  className,
  counts,
}: SearchFiltersProps) {
  const hasFilters = activeFilters.length > 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {FILTER_CONFIG.map(({ type, label, icon: Icon, colorClass }) => {
        const active = activeFilters.includes(type);
        const count = counts?.[type];

        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium transition-all duration-fast ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",
              active
                ? colorClass
                : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]"
            )}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{label}</span>
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "ml-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-[var(--bg-surface)]/50 text-current"
                    : "bg-[var(--bg-surface-3)] text-[var(--text-tertiary)]"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "inline-flex items-center gap-1 rounded-pill border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-medium",
            "text-[var(--text-tertiary)] transition-colors duration-fast ease-out",
            "hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}

export default SearchFilters;
