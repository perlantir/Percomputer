"use client";

import React, { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

import { UsageChart } from "./UsageChart";
import { ModelBreakdown } from "./ModelBreakdown";
import { CostTrend } from "./CostTrend";
import { TopWorkflows } from "./TopWorkflows";
import {
  DEMO_DAILY_USAGE,
  DEMO_MODEL_BREAKDOWN,
  DEMO_COST_TREND,
  DEMO_TOP_WORKFLOWS,
  DEMO_ANALYTICS_SUMMARY,
} from "@/src/data/demo-analytics";

// ── stat card component ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  delay?: number;
}

const StatCard = React.memo(function StatCard({
  label,
  value,
  subtext,
  icon,
  accentColor = "var(--accent-primary)",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-4",
        "hover:shadow-md transition-shadow duration-300"
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-semibold text-foreground-primary tabular-nums tracking-tight">
            {value}
          </p>
          {subtext && (
            <p className="mt-1 text-[11px] text-foreground-tertiary">{subtext}</p>
          )}
        </div>
        {icon && (
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}15` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40"
        style={{ background: accentColor }}
      />
    </motion.div>
  );
});

// ── range selector ──────────────────────────────────────────────────────────

type TimeRange = "7d" | "14d" | "30d";

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "14d", label: "14 Days" },
  { value: "30d", label: "30 Days" },
];

// ── icons ─────────────────────────────────────────────────────────────────

const IconWorkflow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const IconTask = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconToken = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const IconCredit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSuccess = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── main dashboard ──────────────────────────────────────────────────────────

export interface UsageDashboardProps {
  className?: string;
}

export const UsageDashboard = React.memo(function UsageDashboard({
  className,
}: UsageDashboardProps) {
  const [range, setRange] = useState<TimeRange>("30d");

  const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;

  const filteredDaily = useMemo(() => {
    return DEMO_DAILY_USAGE.slice(-days);
  }, [days]);

  const filteredCost = useMemo(() => {
    return DEMO_COST_TREND.slice(-days);
  }, [days]);

  const summary = DEMO_ANALYTICS_SUMMARY;

  // Format summary stats
  const totalWorkflowsStr = summary.totalWorkflows.toLocaleString();
  const totalTasksStr = summary.totalTasks.toLocaleString();
  const totalTokensStr =
    summary.totalTokens >= 1_000_000
      ? `${(summary.totalTokens / 1_000_000).toFixed(1)}M`
      : `${(summary.totalTokens / 1_000).toFixed(1)}K`;
  const totalCreditsStr = summary.totalCredits.toFixed(1);
  const successRateStr = `${summary.successRate}%`;
  const avgDurationStr = `${Math.round(summary.avgWorkflowDurationMs / 60000)}m`;

  // Chart data prep
  const dailyWorkflowChart = useMemo(
    () =>
      filteredDaily.map((d) => ({
        label: d.date.slice(5), // "MM-DD"
        value: d.workflowsStarted,
        secondaryValue: d.workflowsCompleted,
      })),
    [filteredDaily]
  );

  const dailyTokenChart = useMemo(
    () =>
      filteredDaily.map((d) => ({
        label: d.date.slice(5),
        value: d.tokensIn,
        secondaryValue: d.tokensOut,
      })),
    [filteredDaily]
  );

  const dailyTaskChart = useMemo(
    () =>
      filteredDaily.map((d) => ({
        label: d.date.slice(5),
        value: d.tasksExecuted,
      })),
    [filteredDaily]
  );

  /* Stable formatters for memoized UsageChart children */
  const formatValueToString = useCallback((v: number) => v.toString(), []);
  const formatValueWithK = useCallback(
    (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()),
    []
  );

  return (
    <div className={cn("w-full max-w-[1280px] mx-auto px-4 py-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground-primary">Usage Analytics</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            Workflow usage, model breakdown, and cost trends across your organization.
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-2 border border-border-subtle">
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  active
                    ? "bg-accent-primary text-text-inverse"
                    : "text-foreground-secondary hover:text-foreground-primary hover:bg-[var(--bg-hover)]"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Workflows"
          value={totalWorkflowsStr}
          subtext={`${summary.totalWorkflows > 0 ? summary.totalWorkflows : 0} total`}
          icon={<IconWorkflow />}
          accentColor="var(--accent-primary)"
          delay={0}
        />
        <StatCard
          label="Tasks Executed"
          value={totalTasksStr}
          subtext="Across all workflows"
          icon={<IconTask />}
          accentColor="var(--accent-secondary)"
          delay={0.05}
        />
        <StatCard
          label="Tokens Processed"
          value={totalTokensStr}
          subtext="Input + output"
          icon={<IconToken />}
          accentColor="var(--info)"
          delay={0.1}
        />
        <StatCard
          label="Credits Spent"
          value={totalCreditsStr}
          subtext={`Peak: ${summary.peakDay}`}
          icon={<IconCredit />}
          accentColor="var(--accent-tertiary)"
          delay={0.15}
        />
        <StatCard
          label="Success Rate"
          value={successRateStr}
          subtext="Completed workflows"
          icon={<IconSuccess />}
          accentColor="var(--success)"
          delay={0.2}
        />
        <StatCard
          label="Avg Duration"
          value={avgDurationStr}
          subtext="Per workflow"
          icon={<IconClock />}
          accentColor="var(--warning)"
          delay={0.25}
        />
      </div>

      {/* Charts row 1: Usage + Model breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
          <UsageChart
            data={dailyWorkflowChart}
            type="dual"
            title="Workflows Started vs Completed"
            subtitle={`Last ${days} days`}
            height={260}
            primaryLabel="Started"
            secondaryLabel="Completed"
            formatValue={formatValueToString}
            showGrid
            showLegend
          />
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
          <ModelBreakdown
            data={DEMO_MODEL_BREAKDOWN}
            title="Model Usage Breakdown"
            subtitle="Credits spent by model"
            maxItems={8}
            showLegend
          />
        </div>
      </div>

      {/* Charts row 2: Cost trend + Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
          <CostTrend
            data={filteredCost}
            title="Cost Trend"
            subtitle="Daily spend vs cumulative"
            height={240}
            showProjection
            showGrid
          />
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
          <UsageChart
            data={dailyTokenChart}
            type="dual"
            title="Token Usage"
            subtitle="Input vs output tokens"
            height={240}
            primaryLabel="Input"
            secondaryLabel="Output"
            formatValue={formatValueWithK}
            showGrid
            showLegend
          />
        </div>
      </div>

      {/* Row 3: Task executions line chart */}
      <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 mb-4">
        <UsageChart
          data={dailyTaskChart}
          type="line"
          title="Task Executions"
          subtitle="Daily tasks across all workflows"
          height={200}
          primaryLabel="Tasks"
          formatValue={formatValueToString}
          showGrid
          showLegend
        />
      </div>

      {/* Top workflows table */}
      <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
        <TopWorkflows
          data={DEMO_TOP_WORKFLOWS}
          title="Top Workflows"
          subtitle="Most resource-intensive workflows by credits spent"
          maxRows={10}
        />
      </div>
    </div>
  );
});

export default UsageDashboard;
