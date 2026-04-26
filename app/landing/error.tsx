"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function LandingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Landing route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
          <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Failed to load landing
          </h2>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            {error.message || "An unexpected error occurred while loading the landing page."}
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--text-tertiary)] font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-primary)]/90 hover:shadow-md active:scale-[0.98]"
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98]"
          >
            <Home size={16} />
            Go home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
