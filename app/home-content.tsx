"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RecentWorkflowCard } from "@/src/components/workflow/RecentWorkflowCard";
import { Composer } from "@/src/components/composer/Composer";
import { EmptyState } from "@/src/components/ui/empty-state";
import { HomePageSkeleton } from "@/src/components/ui/page-skeletons";
import { AmbientBackground } from "@/src/components/ui/AmbientBackground";
import {
  DEMO_WORKFLOWS,
  type DemoWorkflow,
} from "@/src/data/demo-workflows";

function fetchRecentWorkflows(): Promise<DemoWorkflow[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(DEMO_WORKFLOWS.slice(0, 4));
    }, 300);
  });
}

export default function HomePage() {
  const router = useRouter();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["recent-workflows"],
    queryFn: fetchRecentWorkflows,
    initialData: DEMO_WORKFLOWS.slice(0, 4),
  });

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <>
      <AmbientBackground />
      <main className="relative z-[1] flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-4 py-12 bg-canvas">
        {/* Composer Section */}
        <div className="flex w-full max-w-2xl flex-col items-center gap-6">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-foreground-primary text-center">
            What can I do for you?
          </h1>

          {/* Real Composer */}
          <Composer />
        </div>

        {/* Recent Workflows Section */}
        <div className="w-full max-w-4xl">
          <div className="mb-4 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">
              Recent Workflows
            </h2>
            {workflows && workflows.length > 0 && (
              <button
                onClick={() => router.push("/library")}
                className="text-xs font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
              >
                View all
              </button>
            )}
          </div>

          {workflows && workflows.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {workflows.map((w) => (
                <RecentWorkflowCard
                  key={w.workflow.id}
                  id={w.workflow.id}
                  status={w.workflow.status}
                  objective={w.workflow.objective}
                  startedAt={w.workflow.startedAt}
                  taskCount={w.workflow.taskCount}
                  succeededTasks={w.workflow.succeededTasks}
                  spentCredits={w.workflow.spentCredits}
                  budgetCredits={w.workflow.budgetCredits}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="default"
              title="No recent workflows"
              description="Your recent workflows will appear here once you start creating them."
              actionLabel="Create workflow"
              onAction={() => router.push("/")}
            />
          )}
        </div>
      </main>
    </>
  );
}
