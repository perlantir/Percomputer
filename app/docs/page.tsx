import { Suspense } from "react";
import { Metadata } from "next";
import { Skeleton } from "@/src/components/ui/skeleton";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";
import DocsContent from "./docs-content";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Complete REST API reference for the Multi-Model Agent Platform. Endpoints for workflows, agents, artifacts, spaces, models, billing, team management, and more.",
  openGraph: {
    title: "API Documentation | Computer",
    description:
      "Complete REST API reference — authenticate, create workflows, run agents, manage spaces, and access artifacts programmatically.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "API Documentation | Computer",
    description: "REST API reference for the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

function DocsSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-3xl space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-10 w-72 sm:w-96" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <div className="flex flex-wrap gap-3 mt-4">
              <Skeleton className="h-10 w-56 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DocsPage() {
  return (
    <Suspense fallback={<DocsSkeleton />}>
      <JsonLdServer
        data={[
          webPageSchema(
            "API Documentation",
            "Complete REST API reference for the Multi-Model Agent Platform including workflows, agents, artifacts, spaces, models, billing, and team management endpoints.",
            "/docs"
          ),
        ]}
      />
      <DocsContent />
    </Suspense>
  );
}
