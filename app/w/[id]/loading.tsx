import { Fragment } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function WorkflowLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-[var(--border-subtle)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-t-lg" />
            ))}
          </div>

          {/* Workflow DAG skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Fragment key={i}>
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  {i < 4 && <Skeleton className="h-0.5 w-8" />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Content sections */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
