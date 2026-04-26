"use client";

import { useCallback } from "react";

/**
 * Placeholder component for the Workflow Canvas using Cytoscape.
 * Will be wired up with real Cytoscape rendering in a later step.
 */
export function WorkflowCanvas() {
  const handleNodeClick = useCallback((nodeId: string) => {
    // eslint-disable-next-line no-console
    console.log("Node clicked:", nodeId);
  }, []);

  return (
    <div className="relative h-full w-full rounded-lg border border-border-subtle bg-surface">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-foreground-tertiary text-sm">
          Workflow canvas (Cytoscape integration pending)
        </p>
      </div>
      {/* Hidden node IDs for future wiring */}
      <div className="sr-only">{handleNodeClick("noop")}</div>
    </div>
  );
}
