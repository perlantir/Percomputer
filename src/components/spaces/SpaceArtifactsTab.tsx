"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Image, BarChart3, Code, Table, Box } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { EmptyState } from "@/src/components/ui/empty-state";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";
import type { ArtifactMeta } from "@/src/mock/generators";

function artifactIcon(category: string) {
  switch (category) {
    case "memo":
      return <FileText className="h-5 w-5" />;
    case "deck":
      return <Image className="h-5 w-5" />;
    case "viz":
      return <BarChart3 className="h-5 w-5" />;
    case "code":
      return <Code className="h-5 w-5" />;
    case "data":
      return <Table className="h-5 w-5" />;
    default:
      return <Box className="h-5 w-5" />;
  }
}

function artifactColor(category: string): string {
  switch (category) {
    case "memo":
      return "bg-blue-500/10 text-blue-500";
    case "deck":
      return "bg-purple-500/10 text-purple-500";
    case "viz":
      return "bg-amber-500/10 text-amber-500";
    case "code":
      return "bg-emerald-500/10 text-emerald-500";
    case "data":
      return "bg-cyan-500/10 text-cyan-500";
    default:
      return "bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SpaceArtifactsTabProps {
  spaceId: string;
}

export function SpaceArtifactsTab({ spaceId }: SpaceArtifactsTabProps) {
  const { data: workflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => DEMO_WORKFLOWS,
    initialData: DEMO_WORKFLOWS,
  });

  const artifacts = React.useMemo(() => {
    if (!workflows) return [];
    const result: Array<ArtifactMeta & { workflowId: string; workflowObjective: string }> = [];
    for (const w of workflows) {
      if (w.workflow.spaceId !== spaceId) continue;
      for (const a of w.artifacts) {
        result.push({
          ...a,
          workflowId: w.workflow.id,
          workflowObjective: w.workflow.objective,
        });
      }
    }
    return result;
  }, [workflows, spaceId]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--text-secondary)]">
        {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""} from workflows in this space
      </p>

      {artifacts.length === 0 ? (
        <EmptyState
          variant="no-data"
          icon={Box}
          title="No artifacts yet"
          description="Artifacts are generated as workflows complete their tasks."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "card flex flex-col gap-3 p-4 transition-all duration-fast ease-out",
                "hover:shadow-[0_10px_15px_-3px_rgb(0_0_0_/0.05)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    artifactColor(a.category)
                  )}
                >
                  {artifactIcon(a.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {a.title}
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {a.category} · {formatDate(a.createdAt)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                {a.workflowObjective}
              </p>

              <div className="mt-auto flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                <span>{a.tokens.toLocaleString()} tokens</span>
                <span>{a.tasks.toLocaleString()} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
