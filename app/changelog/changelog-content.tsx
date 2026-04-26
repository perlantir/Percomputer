"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";

import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

import {
  Search,
  Rss,
  Sparkles,
  Wrench,
  Bug,
  GitCommit,
  Zap,
  Layers,
  Shield,
  Gauge,
  Palette,
  Terminal,
  Cloud,
  Cpu,
  ExternalLink,
  ChevronDown,
  Filter,
  X,
  Calendar,
  Tag,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

type ChangeCategory = "new" | "improved" | "fixed";

type ChangeTag =
  | "workflows"
  | "models"
  | "ui"
  | "performance"
  | "security"
  | "connectors"
  | "api"
  | "memory"
  | "billing";

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  changes: Change[];
  highlights: string[];
  breaking?: boolean;
  deprecated?: boolean;
}

interface Change {
  type: ChangeCategory;
  description: string;
  tag: ChangeTag;
  pr?: string;
  docsLink?: string;
}

/* ─────────────────────────── Data ─────────────────────────── */

const TAG_META: Record<ChangeTag, { label: string; icon: typeof Zap }> = {
  workflows: { label: "Workflows", icon: Layers },
  models: { label: "Models", icon: Cpu },
  ui: { label: "UI/UX", icon: Palette },
  performance: { label: "Performance", icon: Gauge },
  security: { label: "Security", icon: Shield },
  connectors: { label: "Connectors", icon: Cloud },
  api: { label: "API", icon: Terminal },
  memory: { label: "Memory", icon: Sparkles },
  billing: { label: "Billing", icon: Tag },
};

const CHANGE_LOG: ChangelogEntry[] = [
  {
    id: "v2-3-0",
    version: "2.3.0",
    date: "2025-04-24",
    title: "Parallel Execution Engine & Enterprise SSO",
    description:
      "Major runtime upgrade introducing true parallel task execution, enterprise SSO support, and significant memory improvements.",
    changes: [
      {
        type: "new",
        description:
          "Parallel execution engine for independent tasks — up to 8x faster workflow completion",
        tag: "workflows",
      },
      {
        type: "new",
        description: "Enterprise SSO via SAML 2.0 and OIDC providers",
        tag: "security",
      },
      {
        type: "new",
        description:
          "Workflow snapshots — save and restore execution state at any checkpoint",
        tag: "workflows",
      },
      {
        type: "improved",
        description:
          "Memory system now auto-compacts vectors with 40% faster retrieval",
        tag: "memory",
      },
      {
        type: "improved",
        description:
          "Reduced cold-start latency for containerized model runtimes by 60%",
        tag: "performance",
      },
      {
        type: "fixed",
        description:
          "Fixed race condition in concurrent connector access during high-load scenarios",
        tag: "connectors",
      },
      {
        type: "fixed",
        description:
          "Resolved memory leak in long-running episodic memory sweeps",
        tag: "memory",
      },
    ],
    highlights: ["parallel-execution", "enterprise-sso", "snapshots"],
    breaking: false,
  },
  {
    id: "v2-2-1",
    version: "2.2.1",
    date: "2025-04-10",
    title: "Hotfix: Connector Stability",
    description: "Critical stability fixes for database and API connectors.",
    changes: [
      {
        type: "fixed",
        description:
          "PostgreSQL connector timeout handling for queries exceeding 30s",
        tag: "connectors",
      },
      {
        type: "fixed",
        description: "Webhook payload validation failing on nested JSON arrays",
        tag: "api",
      },
      {
        type: "improved",
        description: "Better error messages for connector authentication failures",
        tag: "connectors",
      },
    ],
    highlights: [],
    breaking: false,
  },
  {
    id: "v2-2-0",
    version: "2.2.0",
    date: "2025-04-03",
    title: "Multi-Agent Orchestration & Model Marketplace",
    description:
      "New multi-agent collaboration framework and a curated model marketplace for discovering specialized models.",
    changes: [
      {
        type: "new",
        description:
          "Multi-agent orchestration — coordinate multiple agents with shared context and task delegation",
        tag: "workflows",
        pr: "#892",
      },
      {
        type: "new",
        description:
          "Model Marketplace — browse, test, and deploy specialized fine-tuned models",
        tag: "models",
        pr: "#901",
      },
      {
        type: "new",
        description: "Zero Data Retention mode for OpenAI and Anthropic enterprise tiers",
        tag: "security",
        pr: "#885",
      },
      {
        type: "new",
        description:
          "Workflow diff/compare tool — see exactly what changed between versions",
        tag: "ui",
        pr: "#867",
      },
      {
        type: "improved",
        description: "DAG visualization now supports zoom, pan, and minimap navigation",
        tag: "ui",
      },
      {
        type: "improved",
        description:
          "Token usage tracking with per-model cost breakdown in billing dashboard",
        tag: "billing",
      },
      {
        type: "improved",
        description:
          "API key scopes now support fine-grained resource-level permissions",
        tag: "api",
      },
      {
        type: "fixed",
        description:
          "Fixed UI flickering during theme transitions on Safari",
        tag: "ui",
      },
      {
        type: "fixed",
        description:
          "Corrected cost estimation for Claude 3.5 Sonnet streaming responses",
        tag: "models",
      },
    ],
    highlights: ["multi-agent", "model-marketplace", "zdr"],
    breaking: false,
  },
  {
    id: "v2-1-0",
    version: "2.1.0",
    date: "2025-03-15",
    title: "Semantic Memory & Custom Connectors",
    description:
      "Long-term memory system for workflows and a framework for building custom data connectors.",
    changes: [
      {
        type: "new",
        description:
          "Semantic Memory — persistent knowledge extraction and retrieval across sessions",
        tag: "memory",
      },
      {
        type: "new",
        description:
          "Custom Connector SDK — build and publish your own data connectors",
        tag: "connectors",
      },
      {
        type: "new",
        description: "Workflow templates gallery with community submissions",
        tag: "workflows",
      },
      {
        type: "improved",
        description:
          "Model routing accuracy improved by 15% with new task complexity heuristic",
        tag: "models",
      },
      {
        type: "improved",
        description: "Export workflows as PNG/SVG diagrams for documentation",
        tag: "ui",
      },
      {
        type: "fixed",
        description:
          "OAuth token refresh race condition in Google Drive connector",
        tag: "connectors",
      },
      {
        type: "fixed",
        description:
          "Pagination cursor inconsistency in workflow history API",
        tag: "api",
      },
    ],
    highlights: ["semantic-memory", "custom-connectors"],
    breaking: false,
  },
  {
    id: "v2-0-0",
    version: "2.0.0",
    date: "2025-02-28",
    title: "Platform 2.0 — New Architecture",
    description:
      "Complete platform rewrite with new execution engine, redesigned UI, and enterprise features.",
    changes: [
      {
        type: "new",
        description: "Next-gen execution engine with sub-100ms task scheduling",
        tag: "performance",
      },
      {
        type: "new",
        description: "Real-time collaboration — multiple users editing same workflow",
        tag: "workflows",
      },
      {
        type: "new",
        description: "Spaces — isolated project environments with team access controls",
        tag: "workflows",
      },
      {
        type: "new",
        description: "Audit log with tamper-proof event history",
        tag: "security",
      },
      {
        type: "improved",
        description: "Complete UI redesign with dark mode support",
        tag: "ui",
      },
      {
        type: "improved",
        description: "3x throughput improvement with connection pooling overhaul",
        tag: "performance",
      },
      {
        type: "fixed",
        description: "Resolved all known memory leaks in long-running sessions",
        tag: "performance",
      },
    ],
    highlights: ["v2-architecture", "collaboration", "spaces"],
    breaking: true,
  },
  {
    id: "v1-9-0",
    version: "1.9.0",
    date: "2025-02-10",
    title: "Advanced Analytics & Usage Dashboards",
    description:
      "Comprehensive usage analytics, team management, and billing enhancements.",
    changes: [
      {
        type: "new",
        description: "Usage analytics dashboard with per-workflow cost breakdown",
        tag: "billing",
      },
      {
        type: "new",
        description: "Team member roles — Owner, Admin, Member, Viewer",
        tag: "workflows",
      },
      {
        type: "improved",
        description: "Budget alerts with configurable thresholds per space",
        tag: "billing",
      },
      {
        type: "fixed",
        description: "Fixed export format for large artifact downloads (>100MB)",
        tag: "workflows",
      },
    ],
    highlights: [],
    breaking: false,
  },
  {
    id: "v1-8-0",
    version: "1.8.0",
    date: "2025-01-25",
    title: "Connector Ecosystem v1",
    description:
      "First-class data connector system with pre-built integrations for popular services.",
    changes: [
      {
        type: "new",
        description: "Pre-built connectors: PostgreSQL, MySQL, MongoDB, Redis",
        tag: "connectors",
      },
      {
        type: "new",
        description: "Cloud storage connectors: AWS S3, GCS, Azure Blob",
        tag: "connectors",
      },
      {
        type: "new",
        description: "REST API connector with automatic schema inference",
        tag: "connectors",
      },
      {
        type: "improved",
        description: "Workflow input validation with JSON Schema support",
        tag: "workflows",
      },
      {
        type: "fixed",
        description: "Corrected time zone handling in scheduled workflows",
        tag: "api",
      },
    ],
    highlights: ["connectors-v1"],
    breaking: false,
  },
  {
    id: "v1-7-0",
    version: "1.7.0",
    date: "2025-01-08",
    title: "Public API & Webhooks",
    description: "Full REST API and webhook system for external integrations.",
    changes: [
      {
        type: "new",
        description: "REST API v1 with OpenAPI 3.0 specification",
        tag: "api",
      },
      {
        type: "new",
        description: "Webhook system for workflow events and triggers",
        tag: "api",
      },
      {
        type: "new",
        description: "SDK packages for Python and TypeScript",
        tag: "api",
      },
      {
        type: "improved",
        description: "Webhook delivery retry with exponential backoff",
        tag: "api",
      },
      {
        type: "fixed",
        description: "Fixed pagination offset in /workflows/list endpoint",
        tag: "api",
      },
    ],
    highlights: ["rest-api", "webhooks"],
    breaking: false,
  },
  {
    id: "v1-6-0",
    version: "1.6.0",
    date: "2024-12-20",
    title: "Model Router & Multi-Model Support",
    description:
      "Intelligent model routing with support for all major LLM providers.",
    changes: [
      {
        type: "new",
        description: "Support for GPT-4o, Claude 3.5 Sonnet, Gemini Pro, Mistral Large",
        tag: "models",
      },
      {
        type: "new",
        description: "Intelligent model routing based on task type and complexity",
        tag: "models",
      },
      {
        type: "new",
        description: "Model fallback chains for resilience against provider outages",
        tag: "models",
      },
      {
        type: "improved",
        description: "Streaming response handling with real-time token display",
        tag: "ui",
      },
      {
        type: "fixed",
        description: "Rate limit handling across all supported providers",
        tag: "models",
      },
    ],
    highlights: ["model-router", "multi-model"],
    breaking: false,
  },
  {
    id: "v1-5-0",
    version: "1.5.0",
    date: "2024-12-01",
    title: "Initial Public Release",
    description: "The first public release of the Multi-Model Agent Platform.",
    changes: [
      {
        type: "new",
        description: "Natural language to workflow decomposition",
        tag: "workflows",
      },
      {
        type: "new",
        description: "Visual DAG editor for workflow design",
        tag: "workflows",
      },
      {
        type: "new",
        description: "Real-time execution monitoring with live progress",
        tag: "ui",
      },
      {
        type: "new",
        description: "Artifact generation and export (Markdown, JSON, PDF)",
        tag: "workflows",
      },
      {
        type: "new",
        description: "Command palette with keyboard shortcuts",
        tag: "ui",
      },
      {
        type: "new",
        description: "Multi-model support with OpenAI and Anthropic",
        tag: "models",
      },
    ],
    highlights: ["launch"],
    breaking: false,
  },
];

const CATEGORY_FILTERS: {
  id: "all" | ChangeCategory;
  label: string;
  icon: typeof Sparkles;
  variant: "default" | "success" | "info" | "warning";
}[] = [
  { id: "all", label: "All Changes", icon: Filter, variant: "default" },
  { id: "new", label: "New", icon: Sparkles, variant: "success" },
  { id: "improved", label: "Improved", icon: Wrench, variant: "info" },
  { id: "fixed", label: "Fixed", icon: Bug, variant: "warning" },
];

/* ─────────────────────────── Helpers ─────────────────────────── */

function getCategoryColor(type: ChangeCategory) {
  switch (type) {
    case "new":
      return {
        bg: "bg-[var(--success)]/10",
        border: "border-[var(--success)]/30",
        text: "text-[var(--success)]",
        dot: "bg-[var(--success)]",
      };
    case "improved":
      return {
        bg: "bg-[var(--info)]/10",
        border: "border-[var(--info)]/30",
        text: "text-[var(--info)]",
        dot: "bg-[var(--info)]",
      };
    case "fixed":
      return {
        bg: "bg-[var(--warning)]/10",
        border: "border-[var(--warning)]/30",
        text: "text-[var(--warning)]",
        dot: "bg-[var(--warning)]",
      };
  }
}

function getCategoryLabel(type: ChangeCategory) {
  switch (type) {
    case "new":
      return "New";
    case "improved":
      return "Improved";
    case "fixed":
      return "Fixed";
  }
}

/* ─────────────────────────── Components ─────────────────────────── */

function SearchBar({
  value,
  onChange,
  resultCount,
}: {
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
}) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
      <Input
        type="text"
        placeholder="Search changelog by version, feature, or tag..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-[var(--bg-surface)] border-[var(--border-subtle)] pl-10 pr-20 py-2.5",
          "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
          "focus-visible:ring-[var(--accent-primary)] focus-visible:border-[var(--accent-primary)]",
          "transition-all duration-fast ease-out"
        )}
      />
      {value ? (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
            {resultCount}
          </span>
          <button
            onClick={() => onChange("")}
            className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CategoryFilter({
  active,
  onChange,
  counts,
}: {
  active: "all" | ChangeCategory;
  onChange: (c: "all" | ChangeCategory) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORY_FILTERS.map((cat) => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-fast ease-out",
              isActive
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            aria-current={isActive ? "true" : undefined}
          >
            {isActive && (
              <motion.span
                layoutId="changelog-category-pill"
                className="absolute inset-0 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
              <span className="tabular-nums text-[var(--text-tertiary)]">
                ({counts[cat.id] ?? 0})
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function VersionTimelineDot({
  isLatest,
  isBreaking,
}: {
  isLatest: boolean;
  isBreaking?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {isLatest && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)]/40" />
      )}
      <div
        className={cn(
          "relative flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-[var(--bg-canvas)]",
          isLatest
            ? "bg-[var(--accent-primary)]"
            : isBreaking
              ? "bg-[var(--danger)]"
              : "bg-[var(--border-default)]"
        )}
      >
        {isLatest && (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-inverse)]" />
        )}
      </div>
    </div>
  );
}

function ChangeRow({ change }: { change: Change }) {
  const colors = getCategoryColor(change.type);
  const TagIcon = TAG_META[change.tag].icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-all duration-fast ease-out",
        "hover:shadow-sm",
        colors.bg,
        colors.border
      )}
    >
      {/* Category dot */}
      <div className="mt-1.5 shrink-0">
        <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={change.type === "new" ? "success" : change.type === "improved" ? "info" : "warning"} size="sm">
            {getCategoryLabel(change.type)}
          </Badge>
          <Badge variant="default" size="sm" className="gap-1">
            <TagIcon className="h-3 w-3" />
            {TAG_META[change.tag].label}
          </Badge>
          {change.pr && (
            <a
              href={`https://github.com/org/repo/pull/${change.pr.replace("#", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              <GitCommit className="h-3 w-3" />
              {change.pr}
            </a>
          )}
        </div>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
          {change.description}
        </p>
      </div>

      {/* Actions */}
      {change.docsLink ? (
        <a
          href={change.docsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="View documentation"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  );
}

function VersionCard({
  entry,
  isLatest,
  index,
}: {
  entry: ChangelogEntry;
  isLatest: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(isLatest);
  const date = parseISO(entry.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative"
    >
      {/* Timeline connector */}
      <div className="absolute left-[22px] top-[42px] bottom-[-20px] w-[2px] bg-[var(--border-subtle)] last:hidden" />

      <Card
        variant="elevated"
        className={cn(
          "ml-10 transition-all duration-fast",
          isLatest && "ring-1 ring-[var(--accent-primary)]/20"
        )}
      >
        <CardContent className="p-0">
          {/* Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center justify-between w-full px-5 py-4 text-left",
              "hover:bg-[var(--bg-hover)] transition-colors duration-fast",
              "rounded-t-lg"
            )}
          >
            <div className="flex items-center gap-3">
              <VersionTimelineDot
                isLatest={isLatest}
                isBreaking={entry.breaking}
              />
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  v{entry.version}
                </h3>
                {isLatest && (
                  <Badge variant="accent" size="sm">
                    Latest
                  </Badge>
                )}
                {entry.breaking && (
                  <Badge variant="danger" size="sm">
                    Breaking
                  </Badge>
                )}
                {entry.deprecated && (
                  <Badge variant="warning" size="sm">
                    Deprecated
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <time
                dateTime={entry.date}
                className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] tabular-nums"
              >
                <Calendar className="h-3.5 w-3.5" />
                {format(date, "MMM d, yyyy")}
              </time>
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
              </motion.div>
            </div>
          </button>

          {/* Expandable Content */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <Separator />
                <div className="px-5 py-4 space-y-4">
                  {/* Title & description */}
                  <div className="space-y-1.5">
                    <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                      {entry.title}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {entry.description}
                    </p>
                  </div>

                  {/* Mobile date */}
                  <time
                    dateTime={entry.date}
                    className="sm:hidden flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] tabular-nums"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {format(date, "MMM d, yyyy")}
                  </time>

                  {/* Changes list */}
                  <div className="space-y-2">
                    {entry.changes.map((change, i) => (
                      <ChangeRow key={i} change={change} />
                    ))}
                  </div>

                  {/* Highlights badges */}
                  {entry.highlights.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Highlights:
                      </span>
                      {entry.highlights.map((h) => (
                        <Badge key={h} variant="default" size="sm" className="capitalize">
                          {h.replace(/-/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VersionStats({
  log,
}: {
  log: ChangelogEntry[];
}) {
  const stats = useMemo(() => {
    const s = { new: 0, improved: 0, fixed: 0, total: 0 };
    for (const entry of log) {
      for (const change of entry.changes) {
        s.total++;
        s[change.type]++;
      }
    }
    return s;
  }, [log]);

  const latestVersion = log[0]?.version ?? "";
  const totalReleases = log.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Latest Version"
        value={`v${latestVersion}`}
        icon={Tag}
        accent="var(--accent-primary)"
      />
      <StatCard
        label="Total Releases"
        value={String(totalReleases)}
        icon={GitCommit}
        accent="var(--text-secondary)"
      />
      <StatCard
        label="New Features"
        value={String(stats.new)}
        icon={Sparkles}
        accent="var(--success)"
      />
      <StatCard
        label="Improvements"
        value={String(stats.improved)}
        icon={Wrench}
        accent="var(--info)"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Tag;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border-subtle)]",
        "bg-[var(--bg-surface)] p-3 transition-all duration-fast ease-out",
        "hover:border-[var(--border-default)] hover:shadow-sm"
      )}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: accent + "15" }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-[var(--text-primary)] leading-tight tabular-nums truncate">
          {value}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] truncate">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-surface-2)]">
        <Search className="h-6 w-6 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="mt-4 font-display text-sm font-semibold text-[var(--text-primary)]">
        No matching entries
      </h3>
      <p className="mt-1 max-w-xs text-sm text-[var(--text-secondary)]">
        No changelog entries match &quot;{query}&quot;. Try adjusting your search or
        filters.
      </p>
      <button
        onClick={onClear}
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
          "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]",
          "hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)] transition-colors"
        )}
      >
        <X className="h-3.5 w-3.5" />
        Clear filters
      </button>
    </motion.div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function ChangelogContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | ChangeCategory>(
    "all"
  );
  // Filter logic
  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return CHANGE_LOG.filter((entry) => {
      // Category filter
      if (activeCategory !== "all") {
        const hasMatchingChange = entry.changes.some(
          (c) => c.type === activeCategory
        );
        if (!hasMatchingChange) return false;
      }

      // Search filter
      if (!query) return true;
      const searchable = [
        entry.version,
        entry.title,
        entry.description,
        ...entry.changes.map((c) => c.description),
        ...entry.highlights,
        TAG_META[entry.changes[0]?.tag]?.label ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [searchQuery, activeCategory]);

  // Category counts (considering search query only, not category filter)
  const categoryCounts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const counts: Record<string, number> = { all: 0, new: 0, improved: 0, fixed: 0 };

    for (const entry of CHANGE_LOG) {
      if (query) {
        const searchable = [
          entry.version,
          entry.title,
          entry.description,
          ...entry.changes.map((c) => c.description),
          ...entry.highlights,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(query)) continue;
      }

      counts.all++;
      for (const change of entry.changes) {
        counts[change.type]++;
      }
    }

    return counts;
  }, [searchQuery]);

  const handleDownloadRSS = useCallback(() => {
    window.open("/changelog/rss.xml", "_blank");
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("all");
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* ── Header ── */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-6">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
                    Changelog
                  </h1>
                  <Badge variant="accent" size="md">
                    v{CHANGE_LOG[0]?.version}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] max-w-lg">
                  Track new features, improvements, and bug fixes across all
                  versions of the platform.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadRSS}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)]",
                    "bg-[var(--bg-surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]",
                    "hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all"
                  )}
                >
                  <Rss className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">RSS Feed</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <VersionStats log={CHANGE_LOG} />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={filteredEntries.length}
              />
              <CategoryFilter
                active={activeCategory}
                onChange={setActiveCategory}
                counts={categoryCounts}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        {filteredEntries.length === 0 ? (
          <EmptyState query={searchQuery} onClear={clearFilters} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry, index) => (
                <VersionCard
                  key={entry.id}
                  entry={entry}
                  isLatest={index === 0 && !searchQuery && activeCategory === "all"}
                  index={index}
                />
              ))}
            </AnimatePresence>

            {/* End of timeline */}
            <div className="flex items-center justify-center gap-3 py-6 text-xs text-[var(--text-tertiary)]">
              <div className="h-px flex-1 max-w-[100px] bg-[var(--border-subtle)]" />
              <span>End of release history</span>
              <div className="h-px flex-1 max-w-[100px] bg-[var(--border-subtle)]" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
/div>
        )}
      </div>
    </main>
  );
}
