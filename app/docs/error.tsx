"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service
    console.error("Docs page error:", error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--semantic-danger)]/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-[var(--semantic-danger)]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Failed to load API documentation
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            An error occurred while rendering the docs page. Try refreshing or return home.
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--text-tertiary)] font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
