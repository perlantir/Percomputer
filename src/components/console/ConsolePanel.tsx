"use client";

import { Terminal } from "lucide-react";

/**
 * Placeholder for the Operator Console — live logs, agent status, and controls.
 */
export function ConsolePanel() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-[var(--accent-primary)]" />
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
          Operator Console
        </h3>
      </div>
      <div className="flex-1 overflow-auto rounded-md bg-[var(--bg-surface-2)] p-3 font-mono text-2xs text-[var(--text-secondary)]">
        <p>[12:00:00] System initialized</p>
        <p>[12:00:01] Waiting for workflow...</p>
      </div>
    </div>
  );
}
