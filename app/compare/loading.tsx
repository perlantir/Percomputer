import { Skeleton } from "@/src/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Compare toolbar */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-full max-w-sm rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-12 w-full max-w-sm rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-md ml-auto" />
          </div>

          {/* Side-by-side diff skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, side) => (
              <div
                key={side}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden"
              >
                <div className="border-b border-[var(--border-subtle)] px-4 py-3">
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="p-4 space-y-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-4 w-full"
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
