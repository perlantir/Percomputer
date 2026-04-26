"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Columns2, RotateCcw } from "lucide-react";

export default function CompareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Compare route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--warning)]/10">
          <Columns2 className="h-8 w-8 text-[var(--warning)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Compare failed to load
          </h2>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            {error.message || "Could not load the comparison page."}
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--text-tertiary)] font-mono">ID: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-primary)]/90 hover:shadow-md active:scale-[0.98]"
        >
          <RotateCcw size={16} />
          Try again
        </button>
      </motion.div>
    </div>
  );
}
