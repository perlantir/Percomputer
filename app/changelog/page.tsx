import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";
import ChangelogContent from "./changelog-content";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Track new features, improvements, and bug fixes across all versions of the Multi-Model Agent Platform.",
  alternates: {
    types: {
      "application/rss+xml": "/changelog/rss.xml",
    },
  },
  openGraph: {
    title: "Changelog | Computer",
    description:
      "Track new features, improvements, and bug fixes across all versions of the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Changelog | Computer",
    description:
      "Track new features, improvements, and bug fixes across all versions of the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

function ChangelogSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
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
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </main>
  );
}

export default function ChangelogPage() {
  return (
    <Suspense fallback={<ChangelogSkeleton />}>
      <JsonLdServer
        data={webPageSchema(
          "Changelog",
          "Track new features, improvements, and bug fixes across all versions of the Multi-Model Agent Platform.",
          "/changelog"
        )}
      />
      <ChangelogContent />
    </Suspense>
  );
}
