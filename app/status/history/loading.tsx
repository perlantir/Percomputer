import { Skeleton } from "@/src/components/ui/skeleton";

export default function StatusHistoryLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--bg-canvas)]">
      {/* Header skeleton */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48 mt-1" />
              </div>
            </div>
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-3 h-3" />
              </div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Service history cards */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden space-y-3">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="px-4">
                  <Skeleton className="h-5 w-full" />
                </div>
                <div className="grid grid-cols-4 gap-0 border-t border-[var(--border-subtle)]">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex flex-col items-center gap-1 py-2.5 border-r border-[var(--border-subtle)] last:border-r-0">
                      <Skeleton className="h-2 w-6" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline + Chart skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 pb-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
