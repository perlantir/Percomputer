"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";

// ── types ───────────────────────────────────────────────────────────────────

export interface TopWorkflowItem {
  workflowId: string;
  workflowName: string;
  spaceId: string;
  tasksCount: number;
  creditsSpent: number;
  durationMs: number;
  tokensTotal: number;
  status: "succeeded" | "failed" | "running" | "partial";
  createdAt: string;
  modelBreakdown: { modelId: string; calls: number; credits: number }[];
}

type SortKey = "credits" | "duration" | "tokens" | "tasks";
type SortDir = "asc" | "desc";

interface TopWorkflowsProps {
  data: TopWorkflowItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  maxRows?: number;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return `${hours}h ${rem}m`;
  }
  return `${minutes}m ${seconds}s`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function statusBadgeVariant(status: TopWorkflowItem["status"]) {
  switch (status) {
    case "succeeded":
      return "success";
    case "failed":
      return "danger";
    case "running":
      return "info";
    case "partial":
      return "warning";
    default:
      return "default";
  }
}

function statusLabel(status: TopWorkflowItem["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── component ───────────────────────────────────────────────────────────────

export const TopWorkflows = React.memo(function TopWorkflows({
  data,
  title,
  subtitle,
  className,
  maxRows = 10,
}: TopWorkflowsProps) {
  const [sortKey, setSortKey] = useState<SortKey>("credits");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sorted = React.useMemo(() => {
    const sortedData = [...data].sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case "credits":
          av = a.creditsSpent;
          bv = b.creditsSpent;
          break;
        case "duration":
          av = a.durationMs;
          bv = b.durationMs;
          break;
        case "tokens":
          av = a.tokensTotal;
          bv = b.tokensTotal;
          break;
        case "tasks":
          av = a.tasksCount;
          bv = b.tasksCount;
          break;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sortedData.slice(0, maxRows);
  }, [data, sortKey, sortDir, maxRows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-foreground-tertiary opacity-0 group-hover:opacity-40 ml-1">↕</span>;
    return (
      <span className="text-accent-primary ml-1 text-[10px]">
        {sortDir === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  const maxCredits = React.useMemo(() => Math.max(...sorted.map((d) => d.creditsSpent), 1), [sorted]);

  return (
    <div className={cn("w-full", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-foreground-primary">{title}</h3>}
          {subtitle && <p className="text-xs text-foreground-tertiary mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="py-2 pr-3 text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">
                Workflow
              </th>
              <th
                className="py-2 px-3 text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider cursor-pointer group select-none whitespace-nowrap"
                onClick={() => toggleSort("credits")}
              >
                Credits <SortIndicator col="credits" />
              </th>
              <th
                className="py-2 px-3 text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider cursor-pointer group select-none whitespace-nowrap"
                onClick={() => toggleSort("tasks")}
              >
                Tasks <SortIndicator col="tasks" />
              </th>
              <th
                className="py-2 px-3 text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider cursor-pointer group select-none whitespace-nowrap hidden md:table-cell"
                onClick={() => toggleSort("duration")}
              >
                Duration <SortIndicator col="duration" />
              </th>
              <th
                className="py-2 px-3 text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider cursor-pointer group select-none whitespace-nowrap hidden lg:table-cell"
                onClick={() => toggleSort("tokens")}
              >
                Tokens <SortIndicator col="tokens" />
              </th>
              <th className="py-2 pl-3 text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => {
              const isExpanded = expandedRow === item.workflowId;
              const creditPct = (item.creditsSpent / maxCredits) * 100;

              return (
                <React.Fragment key={item.workflowId}>
                  <motion.tr
                    className={cn(
                      "border-b border-border-subtle/50 transition-colors cursor-pointer",
                      isExpanded ? "bg-[var(--bg-surface-2)]" : "hover:bg-[var(--bg-hover)]"
                    )}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    onClick={() => setExpandedRow(isExpanded ? null : item.workflowId)}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground-primary truncate max-w-[140px] sm:max-w-[200px]">
                          {item.workflowName}
                        </span>
                        <span className="text-[11px] text-foreground-tertiary mt-0.5">
                          {item.createdAt}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-foreground-primary tabular-nums">
                          {item.creditsSpent.toFixed(1)}
                        </span>
                        <div className="w-full h-1 rounded-full bg-[var(--bg-surface-3)] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-accent-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${creditPct}%` }}
                            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1], delay: i * 0.04 }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-foreground-secondary tabular-nums">
                        {item.tasksCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <span className="text-xs text-foreground-secondary tabular-nums">
                        {formatDuration(item.durationMs)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 hidden lg:table-cell">
                      <span className="text-xs text-foreground-secondary tabular-nums">
                        {formatTokens(item.tokensTotal)}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3">
                      <Badge variant={statusBadgeVariant(item.status)} size="sm">
                        {statusLabel(item.status)}
                      </Badge>
                    </td>
                  </motion.tr>

                  {/* Expanded model breakdown */}
                  {isExpanded && (
                    <tr className="bg-[var(--bg-surface-2)]">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {item.modelBreakdown.map((mb) => (
                            <div
                              key={mb.modelId}
                              className="px-2.5 py-2 rounded-md border border-border-subtle bg-[var(--bg-surface)]"
                            >
                              <div className="text-[11px] font-medium text-foreground-primary truncate">
                                {mb.modelId}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-foreground-tertiary">
                                  {mb.calls} calls
                                </span>
                                <span className="text-[10px] text-foreground-tertiary tabular-nums">
                                  {mb.credits.toFixed(1)} cr
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <EmptyState
          variant="no-data"
          icon={BarChart3}
          title="No workflow data available"
          description="Workflow analytics will appear here once data is collected."
          className="py-8"
        />
      )}
    </div>
  );
});

export default TopWorkflows;
