import { Skeleton } from "@/src/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Title area */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-1/2 max-w-sm" />
          </div>

          {/* Card skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="grid grid-cols-4 gap-4 border-b border-[var(--border-subtle)] px-4 py-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, row) => (
              <div
                key={row}
                className="grid grid-cols-4 gap-4 px-4 py-3"
              >
                {Array.from({ length: 4 }).map((_, col) => (
                  <Skeleton key={col} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>

          {/* Workflow / DAG skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-0.5 w-8" />
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-0.5 w-8" />
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
