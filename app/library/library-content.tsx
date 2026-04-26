"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { LibraryPageSkeleton } from "@/src/components/ui/page-skeletons";
import { DEMO_WORKFLOWS, type DemoWorkflow } from "@/src/data/demo-workflows";
import { DEMO_SPACES } from "@/src/data/demo-spaces";
import { FilterBar, type FilterState, type SortOption } from "@/src/components/library/FilterBar";
import { WorkflowListItem } from "@/src/components/library/WorkflowListItem";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";

const noop = () => {};

const PAGE_SIZE = 20;

function getDurationMs(w: DemoWorkflow): number {
  if (w.workflow.completedAt) {
    return new Date(w.workflow.completedAt).getTime() - new Date(w.workflow.startedAt).getTime();
  }
  return Date.now() - new Date(w.workflow.startedAt).getTime();
}

function sortWorkflows(workflows: DemoWorkflow[], sort: SortOption): DemoWorkflow[] {
  const arr = [...workflows];
  switch (sort) {
    case "recent":
      arr.sort((a, b) => new Date(b.workflow.startedAt).getTime() - new Date(a.workflow.startedAt).getTime());
      break;
    case "cost-high":
      arr.sort((a, b) => b.workflow.spentCredits - a.workflow.spentCredits);
      break;
    case "cost-low":
      arr.sort((a, b) => a.workflow.spentCredits - b.workflow.spentCredits);
      break;
    case "duration-long":
      arr.sort((a, b) => getDurationMs(b) - getDurationMs(a));
      break;
    case "duration-short":
      arr.sort((a, b) => getDurationMs(a) - getDurationMs(b));
      break;
  }
  return arr;
}

function filterWorkflows(workflows: DemoWorkflow[], filters: FilterState): DemoWorkflow[] {
  return workflows.filter((w) => {
    const { workflow } = w;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!workflow.objective.toLowerCase().includes(q)) return false;
    }
    if (filters.status !== "all" && workflow.status !== filters.status) return false;
    if (filters.spaceId !== "all" && workflow.workflow.spaceId !== filters.spaceId) return false;
    if (filters.kind !== "all" && !w.tasks.some((t) => t.kind === filters.kind)) return false;
    return true;
  });
}

function useWorkflowsQuery() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: async () => DEMO_WORKFLOWS,
    initialData: DEMO_WORKFLOWS,
  });
}

/* ──────────────────────── Infinite Scroll Hook ──────────────────────── */

function useInfiniteScroll({
  totalCount,
  pageSize,
  hasMore,
  onLoadMore,
  enabled = true,
}: {
  totalCount: number;
  pageSize: number;
  hasMore: boolean;
  onLoadMore: () => void;
  enabled?: boolean;
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enabled || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, onLoadMore]);

  return { sentinelRef };
}

/* ────────────────────────── Load More Skeleton ────────────────────────── */

function LoadMoreSkeleton() {
  return (
    <div className="flex flex-col gap-3 mt-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 animate-pulse"
        >
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────── Library Page ────────────────────────── */

export default function LibraryPage() {
  const { data: workflows, isLoading } = useWorkflowsQuery();
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>({
    search: "",
    status: "all",
    spaceId: "all",
    kind: "all",
    sort: "recent",
  });
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  /* Simulate initial loading for skeleton UX */
  React.useEffect(() => {
    const timer = setTimeout(() => setInitialLoadComplete(true), 400);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !initialLoadComplete) {
    return <LibraryPageSkeleton />;
  }

  const spaces = React.useMemo(
    () => DEMO_SPACES.map((s) => ({ id: s.id, name: s.name })),
    []
  );

  const allKinds = React.useMemo(() => {
    const kinds = new Set<string>();
    workflows?.forEach((w) => w.tasks.forEach((t) => kinds.add(t.kind)));
    return Array.from(kinds).sort();
  }, [workflows]);

  const filtered = React.useMemo(() => {
    if (!workflows) return [];
    const f = filterWorkflows(workflows, filters);
    return sortWorkflows(f, filters.sort);
  }, [workflows, filters]);

  const hasMore = visibleCount < filtered.length;

  const displayed = filtered.slice(0, visibleCount);

  // Reset visible count when filters change
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setIsLoadingMore(false);
  }, [filters.search, filters.status, filters.spaceId, filters.kind, filters.sort]);

  // Simulate async loading for a more realistic feel
  const handleLoadMore = React.useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    // Small delay to prevent jank and show loading state
    requestAnimationFrame(() => {
      setTimeout(() => {
        setVisibleCount((prev) => prev + PAGE_SIZE);
        setIsLoadingMore(false);
      }, 150);
    });
  }, [isLoadingMore]);

  const { sentinelRef } = useInfiniteScroll({
    totalCount: filtered.length,
    pageSize: PAGE_SIZE,
    hasMore,
    onLoadMore: handleLoadMore,
    enabled: filtered.length > PAGE_SIZE,
  });

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkArchive = () => {
    setSelected(new Set());
  };
  const handleBulkShare = () => {
    setSelected(new Set());
  };
  const handleBulkFork = () => {
    setSelected(new Set());
  };

  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-canvas)] overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 30% at 20% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 25% at 90% 10%, rgba(var(--accent-secondary), 0.03) 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
          Library
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Browse, search, and manage all your workflows
        </p>
      </div>

      {/* Sticky Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        spaces={spaces}
        kinds={allKinds}
        resultCount={filtered.length}
        selectedCount={selected.size}
        onBulkArchive={handleBulkArchive}
        onBulkShare={handleBulkShare}
        onBulkFork={handleBulkFork}
      />

      {/* Workflow List */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        {displayed.length === 0 ? (
          <EmptyState
            variant="search"
            icon={Inbox}
            title="No workflows match your filters"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setFilters({
                    search: "",
                    status: "all",
                    spaceId: "all",
                    kind: "all",
                    sort: filters.sort,
                  })
                }
              >
                Clear all filters
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map((demo) => {
              const space = DEMO_SPACES.find((s) => s.id === demo.workflow.spaceId);
              const kinds = demo.tasks.map((t) => t.kind);
              return (
                <WorkflowListItem
                  key={demo.workflow.id}
                  workflow={demo.workflow}
                  spaceName={space?.name ?? "Unknown"}
                  artifactCount={demo.artifacts.length}
                  taskKinds={kinds}
                  selected={selected.has(demo.workflow.id)}
                  onSelect={toggleSelect}
                  onFork={noop}
                  onArchive={noop}
                />
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {filtered.length > PAGE_SIZE && (
          <>
            {/* Sentinel element — invisible trigger for IntersectionObserver */}
            <div ref={sentinelRef} aria-hidden="true" className="h-4 mt-4" />

            {/* Loading state when fetching more items */}
            {isLoadingMore && hasMore && <LoadMoreSkeleton />}

            {/* End of list indicator */}
            {!hasMore && displayed.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="h-px flex-1 max-w-[60px] bg-[var(--border-subtle)]" />
                <span>End of list — {filtered.length} workflows</span>
                <span className="h-px flex-1 max-w-[60px] bg-[var(--border-subtle)]" />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
