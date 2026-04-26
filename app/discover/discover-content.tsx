"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "@/src/components/layout/Toaster";
import { CategoryChip } from "@/src/components/discover/CategoryChip";
import { TemplateCard, type Template } from "@/src/components/discover/TemplateCard";
import { GridSkeleton } from "@/src/components/ui/loading-skeleton";
import { EmptyState } from "@/src/components/ui/empty-state";

const TEMPLATES: Template[] = [
  {
    id: "tmpl_competitive_research",
    title: "Competitive Research",
    description: "Deep-dive into a competitor's product, pricing, and positioning with automated source gathering.",
    category: "Research",
    tags: ["research", "analysis", "synthesis"],
    estimatedCost: "$0.60",
    estimatedTime: "5-8 min",
    objective: "Research competitor landscape and produce a comparative analysis memo",
  },
  {
    id: "tmpl_valuation_memo",
    title: "Valuation Memo",
    description: "Generate a structured investment memo with market sizing, comps, and risk analysis.",
    category: "Research",
    tags: ["research", "analysis", "write"],
    estimatedCost: "$0.80",
    estimatedTime: "8-12 min",
    objective: "Draft an investment memo for a target company",
  },
  {
    id: "tmpl_sec_scraper",
    title: "SEC Filing Scraper",
    description: "Build a Python tool that scrapes SEC EDGAR filings and extracts structured data.",
    category: "Build",
    tags: ["code", "scrape", "extract"],
    estimatedCost: "$0.45",
    estimatedTime: "4-6 min",
    objective: "Build a Python script that scrapes SEC filings and extracts executive compensation",
  },
  {
    id: "tmpl_react_tests",
    title: "React Test Suite",
    description: "Generate comprehensive unit tests for a React hook or component with mocked dependencies.",
    category: "Build",
    tags: ["code", "test"],
    estimatedCost: "$0.35",
    estimatedTime: "3-5 min",
    objective: "Write unit tests for a React authentication hook",
  },
  {
    id: "tmpl_sentiment_pipeline",
    title: "Sentiment Pipeline",
    description: "Build a financial sentiment analysis pipeline using FinBERT or DistilBERT.",
    category: "Build",
    tags: ["code", "data-processing", "test"],
    estimatedCost: "$0.50",
    estimatedTime: "4-6 min",
    objective: "Generate Python code for a sentiment analysis pipeline",
  },
  {
    id: "tmpl_earnings_compare",
    title: "Earnings Comparison",
    description: "Compare quarterly earnings across two companies with margin and guidance analysis.",
    category: "Analyze",
    tags: ["research", "analysis", "synthesis"],
    estimatedCost: "$0.55",
    estimatedTime: "5-7 min",
    objective: "Analyze Q3 earnings for two companies and produce a comparative memo",
  },
  {
    id: "tmpl_onchain_metrics",
    title: "On-Chain Analysis",
    description: "Analyze Bitcoin on-chain metrics: exchange flows, holder behavior, and network health.",
    category: "Analyze",
    tags: ["research", "analysis", "visualize"],
    estimatedCost: "$0.65",
    estimatedTime: "6-9 min",
    objective: "Analyze Bitcoin on-chain metrics for the last 30 days",
  },
  {
    id: "tmpl_regulatory_monitor",
    title: "Regulatory Monitor",
    description: "Set up automated monitoring of regulatory filings with keyword alerts and anomaly detection.",
    category: "Automate",
    tags: ["monitor", "scrape", "research"],
    estimatedCost: "$0.40",
    estimatedTime: "3-5 min",
    objective: "Monitor regulatory filings for a company and alert on changes",
  },
  {
    id: "tmpl_saas_dashboard",
    title: "SaaS Metrics Dashboard",
    description: "Create an interactive D3/React dashboard for SaaS KPIs with CSV upload and drill-down.",
    category: "Build",
    tags: ["code", "visualize", "test"],
    estimatedCost: "$0.70",
    estimatedTime: "6-10 min",
    objective: "Create a data visualization dashboard for SaaS metrics",
  },
  {
    id: "tmpl_data_dedup",
    title: "Data Deduplication",
    description: "Clean and deduplicate a large dataset with fuzzy matching, normalization, and export.",
    category: "Automate",
    tags: ["data-processing", "extract"],
    estimatedCost: "$0.30",
    estimatedTime: "2-4 min",
    objective: "Transform a CSV into a clean dataset with deduplication",
  },
  {
    id: "tmpl_pm_tools_compare",
    title: "Tools Comparison",
    description: "Research and compare project management or SaaS tools with feature matrices and pricing.",
    category: "Analyze",
    tags: ["research", "compare", "analysis"],
    estimatedCost: "$0.50",
    estimatedTime: "4-6 min",
    objective: "Research and compare 5 project management tools",
  },
  {
    id: "tmpl_climate_summary",
    title: "Climate Summary",
    description: "Summarize a climate or policy report into actionable investor takeaways with sector mapping.",
    category: "Research",
    tags: ["research", "analysis", "write"],
    estimatedCost: "$0.35",
    estimatedTime: "3-5 min",
    objective: "Summarize the latest climate report into key takeaways for investors",
  },
];

const CATEGORIES = ["All", "Research", "Build", "Analyze", "Automate"] as const;

function useTemplatesQuery() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      // Simulate network latency for skeleton demo
      await new Promise((r) => setTimeout(r, 600));
      return TEMPLATES;
    },
    initialData: TEMPLATES,
  });
}

interface CategoryFilterChipsProps {
  categories: readonly string[];
  activeCategory: string;
  categoryCounts: Record<string, number>;
  onSelect: (category: string) => void;
}

const CategoryChipItem = React.memo(function CategoryChipItem({
  label,
  active,
  count,
  onSelect,
}: {
  label: string;
  active: boolean;
  count: number;
  onSelect: (label: string) => void;
}) {
  const handleClick = React.useCallback(() => onSelect(label), [onSelect, label]);

  return <CategoryChip label={label} active={active} count={count} onClick={handleClick} />;
});

function CategoryFilterChips({
  categories,
  activeCategory,
  categoryCounts,
  onSelect,
}: CategoryFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <CategoryChipItem
          key={cat}
          label={cat}
          active={activeCategory === cat}
          count={categoryCounts[cat] ?? 0}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useTemplatesQuery();
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [isForking, setIsForking] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!templates) return [];
    if (activeCategory === "All") return templates;
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  const categoryCounts = React.useMemo(() => {
    if (!templates) return {} as Record<string, number>;
    const counts: Record<string, number> = { All: templates.length };
    for (const cat of CATEGORIES.slice(1)) {
      counts[cat] = templates.filter((t) => t.category === cat).length;
    }
    return counts;
  }, [templates]);

  const handleFork = async (template: Template) => {
    setIsForking(true);

    const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const previousWorkflows = queryClient.getQueryData<unknown[]>(["recent-workflows"]);

    // Optimistically add workflow to recent list
    const optimisticWorkflow = {
      workflow: {
        id: optimisticId,
        objective: template.objective,
        status: "running",
        startedAt: new Date().toISOString(),
        completedAt: null,
        taskCount: 0,
        succeededTasks: 0,
        failedTasks: 0,
        spentCredits: 0,
        budgetCredits: 100,
        spaceId: "default",
      },
      tasks: [],
      edges: [],
      sources: [],
      artifacts: [],
    };
    queryClient.setQueryData(["recent-workflows"], (old: unknown[] | undefined) => {
      if (!old) return [optimisticWorkflow];
      return [optimisticWorkflow, ...old];
    });

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: template.objective,
          context: {
            memory_scope: "default",
            attached_artifacts: [],
            web_search: false,
            connectors: [],
          },
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to create workflow (${res.status})`);
      }
      const body = await res.json().catch(() => ({}));
      const id = body.id ?? body.workflow_id ?? body.workflowId;
      if (id) {
        // Replace optimistic entry with real one
        queryClient.setQueryData(["recent-workflows"], (old: unknown[] | undefined) => {
          if (!old) return [];
          return old.map((w: any) =>
            w?.workflow?.id === optimisticId
              ? { ...w, workflow: { ...w.workflow, id, status: "running" } }
              : w
          );
        });
        router.push(`/w/${id}`);
        toast.success("Workflow created", `Started from "${template.title}" template.`);
      } else {
        throw new Error("No workflow ID returned");
      }
    } catch {
      // Rollback optimistic update
      queryClient.setQueryData(["recent-workflows"], previousWorkflows);
      toast.error("Failed to create workflow", "Please try again.");
      router.push("/");
    } finally {
      setIsForking(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-canvas)] overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(var(--accent-primary-rgb), 0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 5%, rgba(var(--accent-tertiary), 0.03) 0%, transparent 50%)`,
        }}
      />

      {/* Forking overlay */}
      {isForking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas)]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Creating workflow...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-2)]">
            <Compass className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
              Discover
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Curated workflows to get you started
            </p>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="mx-auto max-w-7xl px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              count={categoryCounts[cat] ?? 0}
              onClick={React.useCallback(() => setActiveCategory(cat), [cat])}
            />
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="mx-auto max-w-7xl px-6 pb-12">
        {isLoading ? (
          <GridSkeleton items={6} columns={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="search"
            icon={Compass}
            title="No templates match this category"
            description="Try selecting a different category to discover available templates."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filt