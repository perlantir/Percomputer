"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home, Bug } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 bg-[var(--bg-canvas)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex max-w-md w-full flex-col items-center gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-xl text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--danger)]/10"
        >
          <AlertTriangle className="h-10 w-10 text-[var(--danger)]" />
        </motion.div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {error.message || "An unexpected error occurred. We've logged the issue and our team will investigate."}
          </p>
          {error.digest && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-surface-2)] px-2.5 py-1 mt-2">
              <Bug size={12} className="text-[var(--text-tertiary)]" />
              <p className="text-[11px] text-[var(--text-tertiary)] font-mono">
                Error ID: {error.digest}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-primary)]/90 hover:shadow-lg"
          >
            <RotateCcw size={16} />
            Try again
          </motion.button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)]"
          >
            <Home size={16} />
            Go home
          </Link>
        </div>

        {/* Stack trace (dev only) */}
        {process.env.NODE_ENV === "development" && error.stack && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full text-left"
          >
            <summary className="cursor-pointer text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Stack trace
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--bg-surface-2)] p-3 text-[11px] text-[var(--danger)] font-mono leading-relaxed">
              {error.stack}
            </pre>
          </motion.details>
        )}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-[var(--text-tertiary)]"
      >
        If this keeps happening, please contact support.
      </motion.p>
    </div>
  );
}
