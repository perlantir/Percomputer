"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Calendar,
  CalendarDays,
  BarChart3,
  Globe,
  Database,
  Radio,
  Zap,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
  Layers,
  RotateCcw,
  Filter,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill, MiniSparkline } from "@/src/components/console/ConsoleTable";
import { Card } from "@/src/components/ui/card";

/* ── Types ── */
type HealthStatus = "operational" | "degraded" | "down";
type Severity = "critical" | "warning" | "info";
type IncidentStatus = "open" | "investigating" | "resolved";

interface HistoricalIncident {
  id: string;
  date: Date;
  service: string;
  severity: Severity;
  title: string;
  description: string;
  status: IncidentStatus;
  duration: number; // minutes
  resolvedAt?: Date;
  impact: string;
  rootCause: string;
}

interface DailyUptime {
  date: string; // YYYY-MM-DD
  day: string; // Mon, Tue, etc.
  operational: boolean;
  uptimePercent: number;
  incidents: number;
  avgResponseMs: number;
}

interface ServiceHistory {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: HealthStatus;
  uptime30d: number;
  uptime90d: number;
  uptime1y: number;
  dailyUptime: DailyUptime[];
  incidents30d: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  trend: number[];
}

interface MonthlySummary {
  month: string;
  uptimeAvg: number;
  incidents: number;
  totalDowntime: number; // minutes
  mttr: number; // minutes
}

/* ── Demo Data Generators ── */
const DAYS = 30;

const generateDailyUptime = (baseUptime: number): DailyUptime[] => {
  const days: DailyUptime[] = [];
  const now = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const incidentChance = isWeekend ? 0.03 : 0.01;
    const hasIncident = Math.random() < incidentChance;
    const incidentCount = hasIncident ? (Math.random() < 0.5 ? 1 : 2) : 0;
    const dayUptime = hasIncident ? baseUptime - Math.random() * 0.005 : baseUptime + Math.random() * 0.0005;
    days.push({
      date: d.toISOString().split("T")[0],
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      operational: dayUptime >= 0.999,
      uptimePercent: Math.min(1, Math.max(0.995, dayUptime)),
      incidents: incidentCount,
      avgResponseMs: Math.round(15 + Math.random() * 80),
    });
  }
  return days;
};

const generateTrend = (base: number, variance: number, length = 12): number[] =>
  Array.from({ length }, (_, i) =>
    Math.max(10, Math.round(base + (Math.sin(i * 0.8) + Math.random() - 0.5) * variance))
  );

const serviceHistories: ServiceHistory[] = [
  {
    id: "api",
    name: "API Gateway",
    icon: <Globe size={16} />,
    status: "operational",
    uptime30d: 0.9998,
    uptime90d: 0.9995,
    uptime1y: 0.9992,
    dailyUptime: generateDailyUptime(0.9998),
    incidents30d: 1,
    avgResponseMs: 42,
    p95ResponseMs: 89,
    trend: generateTrend(42, 15),
  },
  {
    id: "db",
    name: "Database",
    icon: <Database size={16} />,
    status: "operational",
    uptime30d: 1.0,
    uptime90d: 0.9999,
    uptime1y: 0.9998,
    dailyUptime: generateDailyUptime(1.0),
    incidents30d: 0,
    avgResponseMs: 18,
    p95ResponseMs: 34,
    trend: generateTrend(18, 5),
  },
  {
    id: "sse",
    name: "SSE Events",
    icon: <Radio size={16} />,
    status: "operational",
    uptime30d: 0.9995,
    uptime90d: 0.9993,
    uptime1y: 0.9990,
    dailyUptime: generateDailyUptime(0.9995),
    incidents30d: 1,
    avgResponseMs: 8,
    p95ResponseMs: 18,
    trend: generateTrend(8, 3),
  },
  {
    id: "ws",
    name: "WebSocket",
    icon: <Zap size={16} />,
    status: "degraded",
    uptime30d: 0.984,
    uptime90d: 0.992,
    uptime1y: 0.995,
    dailyUptime: generateDailyUptime(0.984),
    incidents30d: 2,
    avgResponseMs: 145,
    p95ResponseMs: 320,
    trend: generateTrend(145, 60),
  },
];

const historicalIncidents: HistoricalIncident[] = [
  {
    id: "inc-2024-001",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    service: "API Gateway",
    severity: "warning",
    title: "Elevated latency on east-coast edge",
    description: "Requests through us-east edge nodes experienced p95 latency of 2.3s for 18 minutes. Root cause: upstream CDN cache invalidation spike causing cache stampede.",
    status: "resolved",
    duration: 18,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 18),
    impact: "~8% of API requests affected",
    rootCause: "CDN cache stampede during config rollout",
  },
  {
    id: "inc-2024-002",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    service: "WebSocket",
    severity: "critical",
    title: "WebSocket connection pool exhausted",
    description: "Connection pool maxed out at 50k concurrent connections. New connections were rejected for 23 minutes. Failover to secondary cluster partially mitigated impact.",
    status: "resolved",
    duration: 23,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 23),
    impact: "~15% of real-time connections dropped",
    rootCause: "Connection leak in v2.4.0 rollout; fixed in v2.4.1",
  },
  {
    id: "inc-2024-003",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    service: "Database",
    severity: "info",
    title: "Brief replica lag spike",
    description: "Read replica lag reached 4.2s for ~3 minutes during automated vacuum job. Write path was unaffected. Lag normalized after vacuum completion.",
    status: "resolved",
    duration: 3,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8 + 1000 * 60 * 3),
    impact: "Read queries served slightly stale data",
    rootCause: "Long-running vacuum on large table",
  },
  {
    id: "inc-2024-004",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    service: "API Gateway",
    severity: "warning",
    title: "Rate limiting misconfiguration",
    description: "New rate limit rules deployed with incorrect tier mapping, causing legitimate enterprise-tier traffic to be throttled. Rolled back within 9 minutes.",
    status: "resolved",
    duration: 9,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 9),
    impact: "Enterprise customers saw 429 responses",
    rootCause: "Config mapping error in deployment pipeline",
  },
  {
    id: "inc-2024-005",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    service: "SSE Events",
    severity: "info",
    title: "Event stream delay during deploy",
    description: "Rolling deployment caused a ~45s gap in SSE event delivery for subscribers on the canary pool. Events were queued and delivered after rollout.",
    status: "resolved",
    duration: 1,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15 + 1000 * 60),
    impact: "Minor event delay, no data loss",
    rootCause: "Canary pool switchover gap",
  },
  {
    id: "inc-2024-006",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
    service: "WebSocket",
    severity: "warning",
    title: "Message delivery degradation",
    description: "Intermittent message delivery failures (0.3% drop rate) for 35 minutes. Traced to a misconfigured load balancer health check timeout.",
    status: "resolved",
    duration: 35,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18 + 1000 * 60 * 35),
    impact: "0.3% of WebSocket messages not delivered",
    rootCause: "LB health check timeout too aggressive",
  },
  {
    id: "inc-2024-007",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22),
    service: "API Gateway",
    severity: "critical",
    title: "Complete API outage — region failover",
    description: "Primary us-east API cluster experienced complete network partition. Automatic failover to us-west succeeded after 4 minutes. All requests served from west during recovery.",
    status: "resolved",
    duration: 4,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22 + 1000 * 60 * 4),
    impact: "Multi-region failover activated; no data loss",
    rootCause: "Network partition in primary DC",
  },
  {
    id: "inc-2024-008",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
    service: "Database",
    severity: "info",
    title: "Scheduled maintenance window",
    description: "Planned database upgrade from PostgreSQL 15.4 to 15.6. ~6 minutes read-only mode during final migration step.",
    status: "resolved",
    duration: 6,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25 + 1000 * 60 * 6),
    impact: "Read-only mode for 6 minutes",
    rootCause: "Planned maintenance — PostgreSQL upgrade",
  },
];

const monthlySummaries: MonthlySummary[] = [
  { month: "Jan 2024", uptimeAvg: 0.9991, incidents: 3, totalDowntime: 28, mttr: 9 },
  { month: "Feb 2024", uptimeAvg: 0.9997, incidents: 2, totalDowntime: 12, mttr: 6 },
  { month: "Mar 2024", uptimeAvg: 0.9994, incidents: 4, totalDowntime: 22, mttr: 5 },
  { month: "Apr 2024", uptimeAvg: 0.9998, incidents: 1, totalDowntime: 5, mttr: 5 },
  { month: "May 2024", uptimeAvg: 0.9996, incidents: 3, totalDowntime: 15, mttr: 5 },
  { month: "Jun 2024", uptimeAvg: 0.9992, incidents: 5, totalDowntime: 32, mttr: 6 },
  { month: "Jul 2024", uptimeAvg: 0.9999, incidents: 0, totalDowntime: 0, mttr: 0 },
  { month: "Aug 2024", uptimeAvg: 0.9995, incidents: 2, totalDowntime: 18, mttr: 9 },
  { month: "Sep 2024", uptimeAvg: 0.9993, incidents: 3, totalDowntime: 25, mttr: 8 },
  { month: "Oct 2024", uptimeAvg: 0.9996, incidents: 2, totalDowntime: 14, mttr: 7 },
  { month: "Nov 2024", uptimeAvg: 0.9994, incidents: 3, totalDowntime: 20, mttr: 7 },
  { month: "Dec 2024", uptimeAvg: 0.9988, incidents: 6, totalDowntime: 45, mttr: 8 },
];

/* ── Helpers ── */
const statusColor = (status: HealthStatus) => {
  switch (status) {
    case "operational":
      return "bg-[var(--success)]";
    case "degraded":
      return "bg-[var(--warning)]";
    case "down":
      return "bg-[var(--danger)]";
  }
};

const statusBg = (status: HealthStatus) => {
  switch (status) {
    case "operational":
      return "bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]";
    case "degraded":
      return "bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]";
    case "down":
      return "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]";
  }
};

const severityIcon = (severity: Severity) => {
  switch (severity) {
    case "critical":
      return <ShieldAlert size={14} className="text-[var(--danger)]" />;
    case "warning":
      return <AlertTriangle size={14} className="text-[var(--warning)]" />;
    case "info":
      return <CheckCircle2 size={14} className="text-[var(--semantic-info)]" />;
  }
};

const severityBorder = (severity: Severity) => {
  switch (severity) {
    case "critical":
      return "border-l-[var(--danger)]";
    case "warning":
      return "border-l-[var(--warning)]";
    case "info":
      return "border-l-[var(--semantic-info)]";
  }
};

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
};

const uptimePercent = (v: number) => `${(v * 100).toFixed(3)}%`;

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatDateShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ── Uptime Bar Chart ── */
function UptimeBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  return (
    <div className="flex items-end gap-[2px] h-10 w-full">
      {data.map((v, i) => {
        const h = ((v - min) / (max - min || 1)) * 100;
        return (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.015, duration: 0.3 }}
            className="flex-1 rounded-t-[1px] origin-bottom"
            style={{
              height: `${Math.max(4, h)}%`,
              backgroundColor: color,
              opacity: 0.4 + (h / 100) * 0.6,
            }}
            title={`${(v * 100).toFixed(3)}%`}
          />
        );
      })}
    </div>
  );
}

/* ── Daily Uptime Strip ── */
function DailyUptimeStrip({ days }: { days: DailyUptime[] }) {
  return (
    <div className="flex items-center gap-[3px]">
      {days.map((day, i) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02, duration: 0.2 }}
          className={cn(
            "flex-1 h-5 rounded-[2px] cursor-help transition-transform hover:scale-125",
            day.operational && day.incidents === 0
              ? "bg-[var(--success)]"
              : day.operational && day.incidents > 0
              ? "bg-[var(--warning)]"
              : "bg-[var(--danger)]"
          )}
          title={`${day.date}: ${uptimePercent(day.uptimePercent)} · ${day.incidents} incident(s)`}
        />
      ))}
    </div>
  );
}

/* ── Timeline Item ── */
function TimelineItem({
  incident,
  index,
}: {
  incident: HistoricalIncident;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
      className="relative flex gap-4"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-3 h-3 rounded-full border-2 z-10 flex-shrink-0 mt-1.5",
            incident.severity === "critical"
              ? "bg-[var(--danger)] border-[var(--danger)]"
              : incident.severity === "warning"
              ? "bg-[var(--warning)] border-[var(--warning)]"
              : "bg-[var(--semantic-info)] border-[var(--semantic-info)]"
          )}
        />
        {index < historicalIncidents.length - 1 && (
          <div className="w-px flex-1 bg-[var(--border-subtle)] mt-1" />
        )}
      </div>

      {/* Card */}
      <Card
        variant="ghost"
        className={cn(
          "flex-1 mb-4 border-l-3 overflow-hidden",
          severityBorder(incident.severity)
        )}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-3.5"
          aria-expanded={expanded}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {severityIcon(incident.severity)}
                <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                  {incident.title}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium",
                    incident.status === "resolved" && statusBg("operational"),
                    incident.status === "open" && statusBg("down"),
                    incident.status === "investigating" && statusBg("degraded")
                  )}
                >
                  {incident.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-tertiary)]">
                <span className="font-mono">{formatDate(incident.date)}</span>
                <span>·</span>
                <span>{incident.service}</span>
                <span>·</span>
                <span className="font-mono">{formatDuration(incident.duration)}</span>
              </div>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                "text-[var(--text-tertiary)] flex-shrink-0 transition-transform mt-1",
                expanded && "rotate-180"
              )}
            />
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-[var(--border-subtle)] pt-2.5">
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {incident.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-md bg-[var(--bg-canvas)] p-2">
                    <span className="text-[9px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">
                      Impact
                    </span>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{incident.impact}</p>
                  </div>
                  <div className="rounded-md bg-[var(--bg-canvas)] p-2">
                    <span className="text-[9px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">
                      Root Cause
                    </span>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{incident.rootCause}</p>
                  </div>
                </div>
                {incident.resolvedAt && (
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                    Resolved: {formatDate(incident.resolvedAt)}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/* ── Service History Card ── */
function ServiceHistoryCard({
  service,
  index,
}: {
  service: ServiceHistory;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
    >
      <Card variant="default" className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">{service.icon}</span>
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
              {service.name}
            </span>
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                statusColor(service.status),
                service.status !== "operational" && "animate-pulse"
              )}
            />
          </div>
          <StatusPill
            status={
              service.status === "operational"
                ? "healthy"
                : service.status === "degraded"
                ? "warning"
                : "critical"
            }
            className="text-[10px]"
          />
        </div>

        {/* Uptime strip */}
        <div className="px-4 pt-3">
          <DailyUptimeStrip days={service.dailyUptime} />
          <div className="flex items-center justify-between mt-1.5 mb-1">
            <span className="text-[9px] text-[var(--text-tertiary)]">
              {formatDateShort(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))}
            </span>
            <span className="text-[9px] text-[var(--text-tertiary)]">
              {formatDateShort(new Date())}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-0 border-t border-[var(--border-subtle)]">
          {[
            { label: "30d", value: uptimePercent(service.uptime30d) },
            { label: "90d", value: uptimePercent(service.uptime90d) },
            { label: "1y", value: uptimePercent(service.uptime1y) },
            { label: "Incidents", value: service.incidents30d.toString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-0.5 py-2.5 px-1 border-r border-[var(--border-subtle)] last:border-r-0"
            >
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">
                {stat.label}
              </span>
              <span className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Response time */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)]">p50</span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                {service.avgResponseMs}ms
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)]">p95</span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                {service.p95ResponseMs}ms
              </span>
            </div>
          </div>
          <MiniSparkline
            data={service.trend}
            width={80}
            height={20}
            color={
              service.status === "operational"
                ? "var(--success)"
                : service.status === "degraded"
                ? "var(--warning)"
                : "var(--danger)"
            }
          />
        </div>
      </Card>
    </motion.div>
  );
}

/* ── Monthly Trend Chart ── */
function MonthlyTrendChart({ data }: { data: MonthlySummary[] }) {
  const maxDowntime = Math.max(...data.map((d) => d.totalDowntime), 1);
  return (
    <div className="space-y-2">
      {data.map((month, i) => (
        <motion.div
          key={month.month}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <span className="text-[10px] text-[var(--text-secondary)] w-20 text-right font-mono flex-shrink-0">
            {month.month}
          </span>
          <div className="flex-1 h-4 bg-[var(--bg-canvas)] rounded-sm overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(month.uptimeAvg * 100)}%` }}
              transition={{ delay: 0.2 + i * 0.04, duration: 0.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-sm",
                month.uptimeAvg >= 0.999
                  ? "bg-[var(--success)]"
                  : month.uptimeAvg >= 0.999
                  ? "bg-[var(--warning)]"
                  : "bg-[var(--danger)]"
              )}
            />
            <span className="absolute inset-0 flex items-center pl-1.5 text-[9px] font-mono text-[var(--text-secondary)]">
              {uptimePercent(month.uptimeAvg)}
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] w-12 text-right font-mono">
            {month.totalDowntime}m
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function StatusHistoryPage() {
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("30d");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  /* Filtered incidents */
  const filteredIncidents = useMemo(() => {
    let filtered = [...historicalIncidents];
    if (serviceFilter !== "all") {
      filtered = filtered.filter((i) => i.service === serviceFilter);
    }
    const days = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * days;
    return filtered.filter((i) => i.date.getTime() >= cutoff);
  }, [timeRange, serviceFilter]);

  /* Aggregates */
  const totalDowntime30d = useMemo(
    () => serviceHistories.reduce((sum, s) => sum + s.dailyUptime.reduce((ds, d) => ds + (d.operational ? 0 : 1) * 24 * 60, 0), 0),
    []
  );

  const avgUptime = useMemo(
    () => serviceHistories.reduce((sum, s) => sum + s.uptime30d, 0) / serviceHistories.length,
    []
  );

  const totalIncidents30d = useMemo(
    () => serviceHistories.reduce((sum, s) => sum + s.incidents30d, 0),
    []
  );

  const mttr = useMemo(() => {
    const resolved = filteredIncidents.filter((i) => i.status === "resolved");
    if (!resolved.length) return 0;
    return Math.round(resolved.reduce((sum, i) => sum + i.duration, 0) / resolved.length);
  }, [filteredIncidents]);

  /* Summary columns for table */
  const monthlyColumns = useMemo(
    () => [
      {
        key: "month",
        header: "Month",
        width: 100,
        sortable: true,
        render: (row: MonthlySummary) => (
          <span className="text-[11px] font-mono text-[var(--text-primary)]">{row.month}</span>
        ),
      },
      {
        key: "uptimeAvg",
        header: "Uptime",
        width: 100,
        align: "right" as const,
        sortable: true,
        render: (row: MonthlySummary) => (
          <span
            className={cn(
              "text-[11px] font-mono font-semibold",
              row.uptimeAvg >= 0.999
                ? "text-[var(--success)]"
                : row.uptimeAvg >= 0.999
                ? "text-[var(--warning)]"
                : "text-[var(--danger)]"
            )}
          >
            {uptimePercent(row.uptimeAvg)}
          </span>
        ),
      },
      {
        key: "incidents",
        header: "Incidents",
        width: 80,
        align: "right" as const,
        sortable: true,
        render: (row: MonthlySummary) => (
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            {row.incidents}
          </span>
        ),
      },
      {
        key: "totalDowntime",
        header: "Downtime",
        width: 90,
        align: "right" as const,
        sortable: true,
        render: (row: MonthlySummary) => (
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            {formatDuration(row.totalDowntime)}
          </span>
        ),
      },
      {
        key: "mttr",
        header: "MTTR",
        width: 80,
        align: "right" as const,
        sortable: true,
        render: (row: MonthlySummary) => (
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            {row.mttr > 0 ? `${row.mttr}m` : "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* ── Header ── */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center">
                <Activity size={18} className="text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  Status History
                </h1>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Historical uptime, incidents, and service performance
                </p>
              </div>
            </div>

            {/* Time range toggle */}
            <div className="flex items-center bg-[var(--bg-canvas)] rounded-lg border border-[var(--border-subtle)] p-0.5">
              {(["30d", "90d", "1y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1 text-[11px] font-medium rounded-md transition-colors",
                    timeRange === range
                      ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <CheckCircle2 size={15} className="text-[var(--success)]" />,
              iconBg: "bg-[var(--success)]/10",
              label: "Avg Uptime (30d)",
              value: uptimePercent(avgUptime),
              trend: "up" as const,
            },
            {
              icon: <AlertTriangle size={15} className="text-[var(--warning)]" />,
              iconBg: "bg-[var(--warning)]/10",
              label: "Incidents (30d)",
              value: totalIncidents30d.toString(),
              trend: "down" as const,
            },
            {
              icon: <Clock size={15} className="text-[var(--accent-primary)]" />,
              iconBg: "bg-[var(--accent-primary)]/10",
              label: "Total Downtime",
              value: formatDuration(totalDowntime30d),
              trend: "flat" as const,
            },
            {
              icon: <RotateCcw size={15} className="text-[var(--semantic-info)]" />,
              iconBg: "bg-[var(--semantic-info)]/10",
              label: "Avg MTTR",
              value: formatDuration(mttr),
              trend: "up" as const,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card variant="default" className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.iconBg)}>
                    {stat.icon}
                  </div>
                  {stat.trend === "up" && <TrendingUp size={12} className="text-[var(--success)]" />}
                  {stat.trend === "down" && <TrendingDown size={12} className="text-[var(--warning)]" />}
                  {stat.trend === "flat" && <Minus size={12} className="text-[var(--text-tertiary)]" />}
                </div>
                <div className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                  {stat.value}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Service History with Uptime Strips ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Server size={14} className="text-[var(--text-tertiary)]" />
            <h2 className="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
              Status by Service (30 Days)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceHistories.map((service, i) => (
              <ServiceHistoryCard key={service.id} service={service} index={i} />
            ))}
          </div>
        </section>

        {/* ── Two Column Layout: Timeline + Monthly Trend ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Incident Timeline ── */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-[var(--text-tertiary)]" />
                <h2 className="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
                  Incident Timeline
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Service filter */}
                <div className="flex items-center gap-1">
                  <Filter size={11} className="text-[var(--text-tertiary)]" />
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="text-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-[var(--text-secondary)] outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="all">All Services</option>
                    {serviceHistories.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {filteredIncidents.length} incidents
                </span>
              </div>
            </div>

            <Card variant="default" className="p-4">
              {filteredIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]">
                  <CheckCircle2 size={28} className="mb-2 text-[var(--success)]/50" />
                  <p className="text-xs font-medium">No incidents in the selected period</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredIncidents.map((incident, i) => (
                    <TimelineItem key={incident.id} incident={incident} index={i} />
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* ── Monthly Trend ── */}
          <section className="lg:col-span-2 space-y-6">
            {/* Uptime Graph */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-[var(--text-tertiary)]" />
                <h2 className="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
                  Uptime Trend (12 Months)
                </h2>
              </div>
              <Card variant="default" className="p-4">
                <MonthlyTrendChart data={monthlySummaries} />
              </Card>
            </div>

            {/* Monthly Data Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-[var(--text-tertiary)]" />
                <h2 className="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
                  Historical Data
                </h2>
              </div>
              <Card variant="default" className="overflow-hidden">
                <ConsoleTable
                  columns={monthlyColumns}
                  data={monthlySummaries}
                  density="compact"
                  maxHeight={340}
                  stickyHeader
                  emptyText="No historical data available"
                />
              </Card>
            </div>
          </section>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-[var(--text-tertiary)] py-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[var(--success)]" />
            Operational
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[var(--warning)]" />
            Degraded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[var(--danger)]" />
            Down
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--success)]" />
            Resolved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] border-2 border-[var(--warning)]" />
            Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] border-2 border-[var(--danger)]" />
            Critical
          </span>
        </div>
      </main>
    </div>
  );
}
