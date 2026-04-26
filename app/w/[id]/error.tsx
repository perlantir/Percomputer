"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { GitBranch, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WorkflowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workflow route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
          <GitBranch className="h-8 w-8 text-[var(--danger)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Workflow unavailable
          </h2>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            {error.message || "Could not load this workflow. It may have been deleted or you may not have access."}
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--text-tertiary)] font-mono">ID: {error.digest}</p>
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
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            Back to library
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
