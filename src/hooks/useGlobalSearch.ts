"use client";

/**
 * Global search hook — debounced fuzzy search across workflows, spaces,
 * artifacts, memory, and connectors.
 */

import { useMemo, useState, useCallback } from "react";
import { useDebounceValue } from "./useInterval";
import {
  searchItems,
  fuzzyMatch,
  type SearchableItem,
  type SearchResult,
  type SearchResultType,
} from "@/src/lib/search-utils";

import {
  DEMO_WORKFLOWS,
  DEMO_SPACES,
  DEMO_MEMORY,
  DEMO_CONNECTORS,
  type DemoWorkflow,
  type DemoSpace,
  type MemoryEntry,
  type DemoConnector,
} from "@/src/data";

// ─────────────────────────────────────────────────────────────────────────────
// Build the static search index from demo data
// ─────────────────────────────────────────────────────────────────────────────

function buildSearchIndex(): SearchableItem[] {
  const items: SearchableItem[] = [];

  // ── Workflows ──
  DEMO_WORKFLOWS.forEach((dw: DemoWorkflow) => {
    items.push({
      id: dw.workflow.id,
      type: "workflow",
      title: dw.workflow.prompt,
      subtitle: `${dw.workflow.status} • ${dw.tasks.length} tasks`,
      searchableText: `${dw.workflow.prompt} ${dw.workflow.status} ${dw.tasks.map((t) => t.title).join(" ")}`,
      href: `/workflows/${dw.workflow.id}`,
      icon: "workflow",
      meta: {
        status: dw.workflow.status,
        taskCount: dw.tasks.length,
        spaceId: dw.workflow.spaceId,
      },
    });
  });

  // ── Spaces ──
  DEMO_SPACES.forEach((s: DemoSpace) => {
    items.push({
      id: s.id,
      type: "space",
      title: s.name,
      subtitle: s.description ?? undefined,
      searchableText: `${s.name} ${s.description ?? ""}`,
      href: `/spaces/${s.id}`,
      icon: s.icon,
      meta: {
        color: s.color,
        workflowCount: s.workflowIds.length,
        connectorCount: s.connectorIds.length,
      },
    });
  });

  // ── Artifacts ── (from workflows)
  DEMO_WORKFLOWS.forEach((dw: DemoWorkflow) => {
    dw.artifacts.forEach((a) => {
      items.push({
        id: a.id,
        type: "artifact",
        title: a.name,
        subtitle: a.category,
        searchableText: `${a.name} ${a.category} ${a.mimeType ?? ""}`,
        href: `/workflows/${dw.workflow.id}/artifacts/${a.id}`,
        icon: "file",
        meta: {
          workflowId: dw.workflow.id,
          sizeBytes: a.sizeBytes,
          mimeType: a.mimeType,
        },
      });
    });
  });

  // ── Memory ──
  DEMO_MEMORY.forEach((m: MemoryEntry) => {
    items.push({
      id: m.id,
      type: "memory",
      title: m.content.slice(0, 60) + (m.content.length > 60 ? "…" : ""),
      subtitle: `Importance: ${Math.round(m.importance * 100)}% • ${m.type}`,
      searchableText: `${m.content} ${m.tags.join(" ")}`,
      href: `/memory/${m.id}`,
      icon: "brain",
      meta: {
        workflowId: m.workflowId,
        importance: m.importance,
        modelId: m.modelId,
        tags: m.tags,
      },
    });
  });

  // ── Connectors ──
  DEMO_CONNECTORS.forEach((c: DemoConnector) => {
    items.push({
      id: c.id,
      type: "connector",
      title: c.name,
      subtitle: c.provider,
      searchableText: `${c.name} ${c.provider} ${c.scope.join(" ")}`,
      href: `/connectors/${c.id}`,
      icon: c.icon,
      meta: {
        status: c.status,
        provider: c.provider,
        spaceIds: c.spaceIds,
      },
    });
  });

  return items;
}

/** Singleton index — demo data is static so we build once. */
const SEARCH_INDEX = buildSearchIndex();

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseGlobalSearchOptions {
  /** Initial query value. */
  initialQuery?: string;
  /** Pre-selected result types filter. */
  initialFilters?: SearchResultType[];
  /** Debounce delay in ms. */
  debounceMs?: number;
  /** Max number of results to return. */
  limit?: number;
  /** Minimum score threshold (lower = stricter). */
  minScoreThreshold?: number;
}

export interface UseGlobalSearchReturn {
  /** Current raw query string. */
  query: string;
  /** Debounced query string (use this for side-effects). */
  debouncedQuery: string;
  /** Update query. */
  setQuery: (q: string) => void;
  /** Active result-type filters. */
  activeFilters: SearchResultType[];
  /** Toggle a filter on/off. */
  toggleFilter: (type: SearchResultType) => void;
  /** Clear all filters. */
  clearFilters: () => void;
  /** Set all filters at once. */
  setFilters: (types: SearchResultType[]) => void;
  /** Computed search results. */
  results: SearchResult[];
  /** Whether a search is "in flight" (debouncing). */
  isSearching: boolean;
  /** Total number of items in the index. */
  totalIndexSize: number;
  /** Grouped results by type. */
  groupedResults: Record<SearchResultType, SearchResult[]>;
  /** Check if a single text matches the debounced query (for inline highlighting). */
  matchesQuery: (text: string) => boolean;
}

export function useGlobalSearch(
  options: UseGlobalSearchOptions = {}
): UseGlobalSearchReturn {
  const {
    initialQuery = "",
    initialFilters = [],
    debounceMs = 150,
    limit = 20,
    minScoreThreshold = 0.3,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [activeFilters, setActiveFilters] = useState<SearchResultType[]>(initialFilters);

  const debouncedQuery = useDebounceValue(query, debounceMs);
  const isSearching = query !== debouncedQuery;

  const toggleFilter = useCallback((type: SearchResultType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const clearFilters = useCallback(() => setActiveFilters([]), []);
  const setFilters = useCallback((types: SearchResultType[]) => setActiveFilters(types), []);

  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery.trim()) return [];

    const raw = searchItems(debouncedQuery, SEARCH_INDEX, {
      limit,
      minScoreThreshold,
    });

    if (activeFilters.length === 0) return raw;

    return raw.filter((r) => activeFilters.includes(r.type));
  }, [debouncedQuery, activeFilters, limit, minScoreThreshold]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResultType, SearchResult[]> = {
      workflow: [],
      space: [],
      artifact: [],
      memory: [],
      connector: [],
    };
    for (const r of results) {
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  const matchesQuery = useCallback(
    (text: string) => {
      if (!debouncedQuery.trim()) return false;
      return fuzzyMatch(debouncedQuery, text) !== null;
    },
    [debouncedQuery]
  );

  return {
    query,
    debouncedQuery,
    setQuery,
    activeFilters,
    toggleFilter,
    clearFilters,
    setFilters,
    results,
    isSearching,
    totalIndexSize: SEARCH_INDEX.length,
    groupedResults,
    matchesQuery,
  };
}
