"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/components/ui/select";

export type FilterStatus = "all" | "running" | "succeeded" | "failed" | "cancelled";
export type SortOption = "recent" | "cost-high" | "cost-low" | "duration-long" | "duration-short";

export interface FilterState {
  search: string;
  status: FilterStatus;
  spaceId: string;
  kind: string;
  sort: SortOption;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  spaces: Array<{ id: string; name: string }>;
  kinds: string[];
  resultCount: number;
  selectedCount: number;
  onBulkArchive?: () => void;
  onBulkShare?: () => void;
  onBulkFork?: () => void;
}

const statusOptions: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "cost-high", label: "Cost: High to Low" },
  { value: "cost-low", label: "Cost: Low to High" },
  { value: "duration-long", label: "Duration: Long to Short" },
  { value: "duration-short", label: "Duration: Short to Long" },
];

export function FilterBar({
  filters,
  onChange,
  spaces,
  kinds,
  resultCount,
  selectedCount,
  onBulkArchive,
  onBulkShare,
  onBulkFork,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.spaceId !== "all" || filters.kind !== "all";

  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const clearAll = () => {
    onChange({ search: "", status: "all", spaceId: "all", kind: "all", sort: filters.sort });
  };

  return (
    <div className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-4">
        {/* Search + Sort Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className={cn(
                "h-10 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] pl-10 pr-4 text-sm text-[var(--text-primary)]",
                "placeholder:text-[var(--text-tertiary)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-canvas)]"
              )}
            />
            {filters.search && (
              <button
                onClick={() => update({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[var(--text-tertiary)]" />
            <Select value={filters.sort} onValueChange={(v) => update({ sort: v as SortOption })}>
              <SelectTrigger className="h-10 w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ status: opt.value })}
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filters.status === opt.value
                  ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]"
              )}
            >
              {opt.label}
            </button>
          ))}

          <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />

          <Select value={filters.spaceId} onValueChange={(v) => update({ spaceId: v })}>
            <SelectTrigger className="h-7 w-auto min-w-[120px] rounded-full px-3 text-xs">
              <SelectValue placeholder="Space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All spaces</SelectItem>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.kind} onValueChange={(v) => update({ kind: v })}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] rounded-full px-3 text-xs">
              <SelectValue placeholder="Kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              {kinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              <X className="mr-1 h-3 w-3" />
              Clear filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            {selectedCount > 0 ? (
              <>
                <span className="text-[var(--text-secondary)]">
                  {selectedCount} selected
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onBulkFork}>
                    Fork
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onBulkShare}>
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onBulkArchive}>
                    Archive
                  </Button>
                </div>
              </>
            ) : (
              <span>{resultCount} workflows</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
