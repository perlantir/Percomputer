"use client";

/**
 * GlobalSearch — Command palette-style fuzzy search across the entire app.
 *
 * Features:
 *   • Opens with Cmd+K or / (via useKeyboardShortcuts)
 *   • Searches workflows, spaces, artifacts, memory, connectors
 *   • Debounced query with fuzzy matching
 *   • Filter chips by result type
 *   • Keyboard navigation (↑ ↓ Enter Esc)
 *   • Dark mode support
 *   • Accessible (role=listbox, aria-activedescendant pattern)
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useCommandPalette } from "@/src/hooks/CommandPaletteStore";
import { useGlobalSearch } from "@/src/hooks/useGlobalSearch";
import { cn } from "@/src/lib/utils";
import { Search, X, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";

import { SearchFilters } from "./SearchFilters";
import { SearchResultItem } from "./SearchResultItem";

import type { SearchResult, SearchResultType } from "@/src/lib/search-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_ORDER: SearchResultType[] = [
  "workflow",
  "space",
  "artifact",
  "memory",
  "connector",
];

const GROUP_LABELS: Record<SearchResultType, string> = {
  workflow: "Workflows",
  space: "Spaces",
  artifact: "Artifacts",
  memory: "Memory",
  connector: "Connectors",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const { open, setOpen } = useCommandPalette();

  const {
    query,
    setQuery,
    debouncedQuery,
    activeFilters,
    toggleFilter,
    clearFilters,
    results,
    isSearching,
    groupedResults,
  } = useGlobalSearch({ debounceMs: 120, limit: 30 });

  const inputRef = useRef<HTMLInputElement>(null);

  // Active index tracks which result is currently keyboard-selected
  const [activeIndex, setActiveIndex] = useState(0);

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo<SearchResult[]>(() => {
    const ordered: SearchResult[] = [];
    for (const type of GROUP_ORDER) {
      ordered.push(...groupedResults[type]);
    }
    return ordered;
  }, [groupedResults]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, activeFilters.join(",")]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      // Small delay to allow dialog animation to start
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard handler: arrow navigation, Enter to select, Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!flatResults.length) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : prev
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        }
        case "Enter": {
          e.preventDefault();
          const result = flatResults[activeIndex];
          if (result?.href) {
            window.location.href = result.href;
            setOpen(false);
          }
          break;
        }
        case "Escape": {
          // Let the dialog handle Escape, but clear query first if present
          if (query) {
            e.stopPropagation();
            setQuery("");
          }
          break;
        }
        default:
          break;
      }
    },
    [flatResults, activeIndex, query, setQuery, setOpen]
  );

  // Scroll active item into view
  useEffect(() => {
    const viewport = document.querySelector(
      '[role="listbox"]'
    )?.closest('[class*="ScrollAreaViewport"]') as HTMLElement | null;
    const el = viewport?.querySelector(`[data-index="${activeIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIndex]);

  const hasResults = flatResults.length > 0;
  const isEmpty = debouncedQuery.trim() !== "" && !hasResults && !isSearching;

  // Build counts per type for filter badges
  const counts = React.useMemo(() => {
    const c: Partial<Record<SearchResultType, number>> = {};
    for (const type of GROUP_ORDER) {
      c[type] = groupedResults[type].length;
    }
    return c;
  }, [groupedResults]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 shadow-high",
          "max-w-2xl gap-0",
          className
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden accessible title */}
        <DialogTitle className="sr-only">Search across the platform</DialogTitle>

        {/* ── Search input ── */}
        <div className="flex items-center border-b border-[var(--border-subtle)] px-4">
          <Search className="mr-3 h-5 w-5 shrink-0 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workflows, spaces, artifacts, memory, connectors…"
            className={cn(
              "h-14 w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            )}
            aria-label="Search query"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={
              hasResults ? `search-result-${activeIndex}` : undefined
            }
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="ml-2 rounded-sm p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="ml-3 hidden items-center gap-1 text-xs text-[var(--text-tertiary)] sm:flex">
            <kbd className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-1.5 py-0.5 font-mono text-[10px]">
              ESC
            </kbd>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="border-b border-[var(--border-subtle)] px-4 py-2.5">
          <SearchFilters
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={clearFilters}
            counts={counts}
          />
        </div>

        {/* ── Results area ── */}
        <ScrollArea className="max-h-[60vh]">
          <div
            id="search-results-list"
            role="listbox"
            className="py-2"
          >
            {/* Searching spinner */}
            {isSearching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
                <span className="ml-2 text-sm text-[var(--text-tertiary)]">
                  Searching…
                </span>
              </div>
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  No results found
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Try a different query or clear filters
                </p>
              </div>
            )}

            {/* Grouped results */}
            {hasResults &&
              GROUP_ORDER.map((type) => {
                const group = groupedResults[type];
                if (!group.length) return null;

                return (
                  <div key={type} role="group" aria-label={GROUP_LABELS[type]}>
                    <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--bg-surface)] px-4 py-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        {GROUP_LABELS[type]}
                      </span>
                      <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">
                        {group.length}
                      </span>
                    </div>
                    <div className="px-2">
                      {group.map((result, idxInGroup) => {
                        // Compute flat index for keyboard nav
                        let flatIdx = 0;
                        for (const t of GROUP_ORDER) {
                          if (t === type) break;
                          flatIdx += groupedResults[t].length;
                        }
                        flatIdx += idxInGroup;

                        return (
                          <div
                            key={result.id}
                            id={`search-result-${flatIdx}`}
                            data-index={flatIdx}
                            role="option"
                            aria-selected={flatIdx === activeIndex}
                          >
                            <SearchResultItem
                              result={result}
                              isActive={flatIdx === activeIndex}
                              isSelected={flatIdx === activeIndex}
                              onClick={() => {
                                if (result.href) {
                                  window.location.href = result.href;
                                  setOpen(false);
                                }
                              }}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="my-1 bg-[var(--border-subtle)]" />
                  </div>
                );
              })}

            {/* No query yet — show hint */}
            {!debouncedQuery.trim() && !isSearching && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Type to search across the platform
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <span className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-2 py-1">
                    ↑↓ to navigate
                  </span>
                  <span className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-2 py-1">
                    Enter to select
                  </span>
                  <span className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-2 py-1">
                    Esc to close
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        {hasResults && (
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2 text-[11px] text-[var(--text-tertiary)]">
            <span>
              {flatResults.length} result{flatResults.length !== 1 ? "s" : ""}
              {activeFilters.length > 0 && " · filtered"}
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-1 font-mono text-[10px]">
                  ↑
                </kbd>
                <kbd className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-1 font-mono text-[10px]">
                  ↓
                </kbd>
                <span>navigate</span>
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-1 font-mono text-[10px]">
                  Enter
                </kbd>
                <span>select</span>
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default GlobalSearch;
