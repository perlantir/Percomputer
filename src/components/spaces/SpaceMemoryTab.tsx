"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Bookmark, Tag, Clock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { EmptyState } from "@/src/components/ui/empty-state";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";
import { DEMO_MEMORY, type MemoryEntry } from "@/src/data/demo-memory";

function typeIcon(type: MemoryEntry["type"]) {
  switch (type) {
    case "episodic":
      return <Clock className="h-3.5 w-3.5" />;
    case "semantic":
      return <Brain className="h-3.5 w-3.5" />;
    case "procedural":
      return <Bookmark className="h-3.5 w-3.5" />;
  }
}

function typeColor(type: MemoryEntry["type"]): string {
  switch (type) {
    case "episodic":
      return "text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10";
    case "semantic":
      return "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10";
    case "procedural":
      return "text-[var(--success)] bg-[var(--success)]/10";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWorkflowObjective(workflowId: string): string {
  const wf = DEMO_WORKFLOWS.find((w) => w.workflow.id === workflowId);
  return wf?.workflow.objective ?? "Unknown workflow";
}

interface SpaceMemoryTabProps {
  spaceId: string;
}

export function SpaceMemoryTab({ spaceId }: SpaceMemoryTabProps) {
  const { data: allMemory } = useQuery({
    queryKey: ["memory"],
    queryFn: async () => DEMO_MEMORY,
    initialData: DEMO_MEMORY,
  });

  const { data: workflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => DEMO_WORKFLOWS,
    initialData: DEMO_WORKFLOWS,
  });

  const spaceWorkflowIds = React.useMemo(() => {
    return new Set(workflows?.filter((w) => w.workflow.spaceId === spaceId).map((w) => w.workflow.id) ?? []);
  }, [workflows, spaceId]);

  const entries = React.useMemo(() => {
    return allMemory.filter((m) => spaceWorkflowIds.has(m.workflowId));
  }, [allMemory, spaceWorkflowIds]);

  return (
    <div className="flex flex-col gap-3">
      {entries.length === 0 ? (
        <EmptyState
          variant="no-data"
          icon={Brain}
          title="No memory entries yet"
          description="Memory is captured as workflows run and learn from tasks."
        />
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="card flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    typeColor(entry.type)
                  )}
                >
                  {typeIcon(entry.type)}
                  {entry.type}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">
                {entry.tokensUsed.toLocaleString()} tokens
              </span>
            </div>

            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {entry.content}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-[var(--text-tertiary)] truncate max-w-[200px]" title={getWorkflowObjective(entry.workflowId)}>
                From: {getWorkflowObjective(entry.workflowId)}
              </span>
              <span className="text-[var(--text-tertiary)]">{entry.modelId}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Importance bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                Importance
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)]"
                  style={{ width: `${entry.importance * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                {Math.round(entry.importance * 100)}%
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
