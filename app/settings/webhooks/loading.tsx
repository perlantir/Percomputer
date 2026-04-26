import { Skeleton } from "@/src/components/ui/skeleton";

export default function WebhooksLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-12" />
              </div>
            ))}
          </div>

          {/* Webhooks table */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2">
              {/* Table header */}
              <div className="rounded-lg bg-[var(--bg-surface-2)]/50 border-b border-[var(--border-subtle)] px-4 py-3">
                <div className="flex gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-24" />
                  ))}
                </div>
              </div>
              {/* Table rows */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] px-4 py-3"
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex gap-1 flex-1">
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3.5 w-3.5" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-1 flex-1 justify-end">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery History table */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2">
              {/* Table header */}
              <div className="rounded-lg bg-[var(--bg-surface-2)]/50 border-b border-[var(--border-subtle)] px-4 py-3">
                <div className="flex gap-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-20" />
                  ))}
                </div>
              </div>
              {/* Table rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] px-4 py-3"
                >
                  <div className="flex items-center gap-1 w-[90px] justify-center">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-7 rounded-md ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
