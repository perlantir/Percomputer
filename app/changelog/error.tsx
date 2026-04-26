"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function ChangelogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Changelog page error:", error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)]/10">
            <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Failed to load changelog
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Something went wrong while loading the version history. This could be
            a temporary issue.
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--text-tertiary)] font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="secondary"
            asChild
            className="w-full sm:w-auto gap-2"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
