import { Skeleton } from "@/src/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
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
          {/* Hero prompt skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 max-w-lg" />
            <Skeleton className="h-4 w-1/2 max-w-sm" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
              <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
          </div>

          {/* Quick actions skeleton */}
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-40 shrink-0 rounded-lg" />
            ))}
          </div>

          {/* Recent workflows skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
