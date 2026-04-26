import { Suspense } from "react";
import { Metadata } from "next";
import { Skeleton } from "@/src/components/ui/skeleton";
import { JsonLdServer } from "@/src/components/JsonLd";
import {
  webPageSchema,
  faqPageSchema,
} from "@/src/lib/structured-data";
import { FAQ_ITEMS } from "@/src/data/help-faq";
import HelpPage from "./help-content";

export const metadata: Metadata = {
  title: "Help & Documentation",
  description:
    "Search help articles, browse FAQs, view keyboard shortcuts, and get support for the Multi-Model Agent Platform.",
  openGraph: {
    title: "Help & Documentation | Computer",
    description:
      "Search help articles, browse FAQs, view keyboard shortcuts, and get support for the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Help & Documentation | Computer",
    description:
      "Search help articles, browse FAQs, view keyboard shortcuts, and get support for the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

function HelpPageSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-8 w-64" />
              <Skeleton className="mx-auto h-4 w-80" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-12 w-full max-w-2xl rounded-lg" />
            </div>
            <div className="flex justify-center gap-2">
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-8">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
              <Skeleton className="h-32 w-full mt-6" />
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HelpPageWrapper() {
  return (
    <Suspense fallback={<HelpPageSkeleton />}>
      <JsonLdServer
        data={[
          webPageSchema(
            "Help & Documentation",
            "Search help articles, browse FAQs, view keyboard shortcuts, and get support for the Multi-Model Agent Platform.",
            "/help"
          ),
          faqPageSchema(
            FAQ_ITEMS.map((item) => ({
              question: item.question,
              answer: item.answer,
            }))
          ),
        ]}
      />
      <HelpPage />
    </Suspense>
  );
}
