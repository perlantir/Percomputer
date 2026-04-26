"use client";

/**
 * Examples page — showcases pre-built workflow templates and prompt examples
 * that users can browse, filter by category, and run with one click.
 *
 * Features:
 * - Browse 15+ demo workflow examples across categories
 * - Filter by category (Research, Code, Data, Analysis, etc.)
 * - Search by keyword
 * - One-click to run any example
 * - Responsive grid layout
 * - Loading skeletons
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  BarChart3,
  Code2,
  Database,
  FileText,
  LineChart,
  Globe,
  Shield,
  Workflow,
  Sparkles,
  X,
  ArrowRight,
  Clock,
  Layers,
  Cpu,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  DEMO_WORKFLOWS,
  type DemoWorkflow,
} from "@/src/data/demo-workflows";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { EmptyState } from "@/src/components/ui/empty-state";
import { HomePageSkeleton } from "@/src/components/ui/page-skeletons";

/* ──────────────────────────── Types ──────────────────────────── */

type ExampleCategory =
  | "all"
  | "research"
  | "code"
  | "data"
  | "analysis"
  | "writing"
  | "monitoring"
  | "engineering";

interface CategoryConfig {
  id: ExampleCategory;
  label: string;
  icon: React.ElementType;
}

/* ──────────────────────────── Constants ──────────────────────────── */

const CATEGORIES: CategoryConfig[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "research", label: "Research", icon: Globe },
  { id: "code", label: "Code", icon: Code2 },
  { id: "data", label: "Data", icon: Database },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "writing", label: "Writing", icon: FileText },
  { id: "monitoring", label: "Monitoring", icon: Shield },
  { id: "engineering", label: "Engineering", icon: Cpu },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

function getCategoryFromWorkflow(dw: DemoWorkflow): ExampleCategory {
  const prompt = dw.workflow.prompt.toLowerCase();
  const tasks = dw.tasks.map((t) => t.kind);

  if (tasks.some((t) => t === "code" || t === "test")) return "code";
  if (tasks.some((t) => t === "scrape" || t === "extract")) return "engineering";
  if (tasks.some((t) => t === "monitor")) return "monitoring";
  if (tasks.some((t) => t === "data-processing")) return "data";
  if (prompt.includes("write") || prompt.includes("draft") || prompt.includes("summarize"))
    return "writing";
  if (
    prompt.includes("analyze") ||
    prompt.includes("compare") ||
    prompt.includes("valuation")
  )
    return "analysis";
  return "research";
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

function formatTokens(dw: DemoWorkflow): string {
  const totalIn = dw.tasks.reduce((s, t) => s + (t.inputTokens ?? 0), 0);
  const totalOut = dw.tasks.reduce((s, t) => s + (t.outputTokens ?? 0), 0);
  const totalK = Math.round((totalIn + totalOut) / 1000);
  return `${totalK}K tokens`;
}

/* ──────────────────────────── API ──────────────────────────── */

function fetchExamples(): Promise<DemoWorkflow[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(DEMO_WORKFLOWS);
    }, 400);
  });
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function ExamplesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] =
    React.useState<ExampleCategory>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  /* Keyboard shortcut: / to focus search */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        )
          return;
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data: examples, isLoading } = useQuery({
    queryKey: ["examples"],
    queryFn: fetchExamples,
    initialData: DEMO_WORKFLOWS,
  });

  const filtered = React.useMemo(() => {
    if (!examples) return [];
    return examples.filter((ex) => {
      const catMatch =
        activeCategory === "all" ||
        getCategoryFromWorkflow(ex) === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        ex.workflow.prompt.toLowerCase().includes(q) ||
        ex.tasks.some((t) => t.title.toLowerCase().includes(q)) ||
        ex.workflow.modelUsage.some((m) =>
          m.modelId.toLowerCase().includes(q)
        );
      return catMatch && searchMatch;
    });
  }, [examples, activeCategory, searchQuery]);

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-canvas)] overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 35% at 20% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 25% at 80% 10%, rgba(var(--accent-secondary), 0.03) 0%, transparent 50%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  Examples
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Browse and run pre-built workflow templates
                </p>
              </div>
            </div>

            {/* ── Search ── */}
            <div className="sm:ml-auto relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 py-2 w-full bg-[var(--bg-surface)] border-[var(--border-subtle)] text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {!searchQuery && (
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 py-0 text-[10px] font-semibold text-[var(--text-tertiary)]">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Filter ── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
                  isActive
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/25"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                {cat.id === "all" && examples && (
                  <span className="ml-0.5 text-[10px] text-[var(--text-tertiary)]">
                    ({examples.length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Results Count ── */}
        {searchQuery && (
          <div className="mb-4 text-sm text-[var(--text-secondary)]">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;
            <span className="font-medium text-[var(--text-primary)]">
              {searchQuery}
            </span>
            &rdquo;
          </div>
        )}

        {/* ── Examples Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((ex, index) => (
                <ExampleCard
                  key={ex.workflow.id}
                  example={ex}
                  index={index}
                  onRun={() => router.push(`/w/${ex.workflow.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            variant="search"
            title="No examples found"
            description="Try adjusting your search terms or filter to find what you are looking for."
            onAction={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            actionLabel="Clear filters"
          />
        )}

        {/* ── Bottom CTA ── */}
        {filtered.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Have a custom workflow in mind?
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--text-inverse)] transition-all hover:bg-[var(--accent-primary-hover)] hover:shadow-md"
            >
              <Workflow className="h-4 w-4" />
              Create your own workflow
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ──────────────────────────── Sub-components ──────────────────────────── */

function ExampleCard({
  example,
  index,
  onRun,
}: {
  example: DemoWorkflow;
  index: number;
  onRun: () => void;
}) {
  const category = getCategoryFromWorkflow(example);
  const categoryConfig = CATEGORIES.find((c) => c.id === category);
  const CategoryIcon = categoryConfig?.icon ?? Workflow;

  const uniqueModels = React.useMemo(
    () => [...new Set(example.tasks.map((t) => t.resolvedModelId).filter(Boolean))],
    [example]
  );

  const totalDuration = example.tasks.reduce(
    (s, t) => s + (t.durationMs ?? 0),
    0
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.04, 0.4),
        ease: "easeOut",
      }}
    >
      <Card
        variant="default"
        className="group flex h-full cursor-pointer flex-col transition-all duration-fast hover:-translate-y-0.5 hover:shadow-glow"
        onClick={onRun}
      >
        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          {/* ── Top row: category + status ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-primary)]/10">
                <CategoryIcon className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-xs font-medium capitalize text-[var(--text-secondary)]">
                {category}
              </span>
            </div>
            <StatusBadge status={example.workflow.status} />
          </div>

          {/* ── Prompt ── */}
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-fast">
            {example.workflow.prompt}
          </p>

          {/* ── Task preview ── */}
          <div className="flex flex-wrap gap-1">
            {example.tasks.slice(0, 4).map((task) => (
              <Badge
                key={task.id}
                variant="default"
                size="sm"
                className="text-[10px]"
              >
                {task.title}
              </Badge>
            ))}
            {example.tasks.length > 4 && (
              <Badge variant="default" size="sm" className="text-[10px]">
                +{example.tasks.length - 4} more
              </Badge>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="mt-auto border-t border-[var(--border-subtle)] pt-3">
            {/* ── Stats row ── */}
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(totalDuration)}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {formatTokens(example)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {example.tasks.length} tasks
              </span>
            </div>

            {/* ── Models row ── */}
            {uniqueModels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {uniqueModels.slice(0, 3).map((model) => (
                  <span
                    key={model}
                    className="inline-flex items-center rounded bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]"
                  >
                    {model}
                  </span>
                ))}
                {uniqueModels.length > 3 && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    +{uniqueModels.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* ── Run CTA ── */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--accent-primary)] opacity-0 transition-opacity duration-fast group-hover:opacity-100 flex items-center gap-1">
                Run workflow
                <ArrowRight className="h-3 w-3" />
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {example.artifacts.length} artifact
                {example.artifacts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({
  status,
}: {
  status: "queued" | "planning" | "running" | "paused" | "succeeded" | "failed" | "cancelling" | "cancelled";
}) {
  const config: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
    succeeded: { label: "Succeeded", variant: "success" },
    running: { label: "Running", variant: "warning" },
    failed: { label: "Failed", variant: "danger" },
    queued: { label: "Queued", variant: "default" },
    planning: { label: "Planning", variant: "default" },
    paused: { label: "Paused", variant: "default" },
    cancelling: { label: "Cancelling", variant: "warning" },
    cancelled: { label: "Cancelled", variant: "default" },
  };

  const c = config[status] ?? config.queued;
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}
