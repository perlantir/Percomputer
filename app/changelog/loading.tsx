import { Skeleton } from "@/src/components/ui/skeleton";

export default function ChangelogLoading() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg hidden sm:block" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
              <div className="hidden sm:flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[72px] rounded-lg"
            style={{ marginLeft: i % 2 === 0 ? "0" : "0", opacity: 1 - i * 0.12 }}
          />
        ))}
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="h-px flex-1 max-w-[100px] bg-[var(--border-subtle)]" />
          <Skeleton className="h-3 w-32" />
          <div className="h-px flex-1 max-w-[100px] bg-[var(--border-subtle)]" />
        </div>
      </div>
    </main>
  );
}
