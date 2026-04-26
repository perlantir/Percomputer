"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";
import { DEMO_SPACES } from "@/src/data/demo-spaces";
import { WorkflowListItem } from "@/src/components/library/WorkflowListItem";
import type { SortOption } from "@/src/components/library/FilterBar";

const noop = () => {};

function getDurationMs(w: typeof DEMO_WORKFLOWS[0]): number {
  if (w.workflow.completedAt) {
    return new Date(w.workflow.completedAt).getTime() - new Date(w.workflow.startedAt).getTime();
  }
  return Date.now() - new Date(w.workflow.startedAt).getTime();
}

function sortWorkflows(workflows: typeof DEMO_WORKFLOWS, sort: SortOption) {
  const arr = [...workflows];
  switch (sort) {
    case "recent":
      arr.sort((a, b) => new Date(b.workflow.startedAt).getTime() - new Date(a.workflow.startedAt).getTime());
      break;
    case "cost-high":
      arr.sort((a, b) => b.workflow.spentCredits - a.workflow.spentCredits);
      break;
    case "cost-low":
      arr.sort((a, b) => a.workflow.spentCredits - b.workflow.spentCredits);
      break;
    case "duration-long":
      arr.sort((a, b) => getDurationMs(b) - getDurationMs(a));
      break;
    case "duration-short":
      arr.sort((a, b) => getDurationMs(a) - getDurationMs(b));
      break;
  }
  return arr;
}

interface SpaceWorkflowsTabProps {
  spaceId: string;
}

export function SpaceWorkflowsTab({ spaceId }: SpaceWorkflowsTabProps) {
  const { data: allWorkflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => DEMO_WORKFLOWS,
    initialData: DEMO_WORKFLOWS,
  });

  const [sort, setSort] = React.useState<SortOption>("recent");

  const space = DEMO_SPACES.find((s) => s.id === spaceId);

  const workflows = React.useMemo(() => {
    if (!allWorkflows) return [];
    const filtered = allWorkflows.filter((w) => w.workflow.spaceId === spaceId);
    return sortWorkflows(filtered, sort);
  }, [allWorkflows, spaceId, sort]);

  return (
    <div className="flex flex-col gap-4">
      {/* Sort bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        >
          <option value="recent">Recent</option>
          <option value="cost-high">Cost: High to Low</option>
          <option value="cost-low">Cost: Low to High</option>
          <option value="duration-long">Duration: Long to Short</option>
          <option value="duration-short">Duration: Short to Long</option>
        </select>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          variant="no-data"
          icon={Inbox}
          title="No workflows in this space"
          description="Workflows created in this space will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {workflows.map((demo) => (
            <WorkflowListItem
              key={demo.workflow.id}
              workflow={demo.workflow}
              spaceName={space?.name ?? "Unknown"}
              artifactCount={demo.artifacts.length}
              taskKinds={demo.tasks.map((t) => t.kind)}
              onFork={noop}
              onArchive={noop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
