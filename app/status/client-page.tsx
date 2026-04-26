"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Database,
  Radio,
  Zap,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldAlert,
  ChevronRight,
  Layers,
  History,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill, MiniSparkline } from "@/src/components/console/ConsoleTable";
import { useInterval } from "@/src/hooks/useInterval";
import { Card } from "@/src/components/ui/card";

/* ── Types ── */
type HealthStatus = "operational" | "degraded" | "down";

interface SystemHealth {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: HealthStatus;
  responseTime: number; // ms
  uptime24h: number; // 0-1
  uptime30d: number; // 0-1
  lastChecked: Date;
  trend: number[]; // response time sparkline data
}

interface ProviderStatus {
  id: string;
  name: string;
  adapter: string;
  status: HealthStatus;
  responseTime: number;
  uptime24h: number;
  uptime30d: number;
  requestsLastHour: number;
  errorsLastHour: number;
  trend: number[];
  regions: string[];
}

interface Incident {
  id: string;
  provider: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  startedAt: Date;
  resolvedAt?: Date;
  duration?: number; // minutes
}

/* ── Demo data generators ── */
const generateTrend = (base: number, variance: number, length = 12): number[] => {
  return Array.from({ length }, (_, i) => {
    const noise = (Math.sin(i * 0.8) + Math.random() - 0.5) * variance;
    return Math.max(10, Math.round(base + noise));
  });
};

const initialHealthServices: SystemHealth[] = [
  {
    id: "api",
    name: "API Gateway",
    icon: <Globe size={16} />,
    status: "operational",
    responseTime: 42,
    uptime24h: 0.9998,
    uptime30d: 0.9995,
    lastChecked: new Date(),
    trend: generateTrend(42, 15),
  },
  {
    id: "db",
    name: "Database",
    icon: <Database size={16} />,
    status: "operational",
    responseTime: 18,
    uptime24h: 1.0,
    uptime30d: 0.9999,
    lastChecked: new Date(),
    trend: generateTrend(18, 5),
  },
  {
    id: "sse",
    name: "SSE Events",
    icon: <Radio size={16} />,
    status: "operational",
    responseTime: 8,
    uptime24h: 0.9995,
    uptime30d: 0.9992,
    lastChecked: new Date(),
    trend: generateTrend(8, 3),
  },
  {
    id: "ws",
    name: "WebSocket",
    icon: <Zap size={16} />,
    status: "degraded",
    responseTime: 145,
    uptime24h: 0.984,
    uptime30d: 0.997,
    lastChecked: new Date(),
    trend: generateTrend(145, 60),
  },
];

const initialProviders: ProviderStatus[] = [
  {
    id: "openai",
    name: "OpenAI",
    adapter: "openai-v1",
    status: "operational",
    responseTime: 890,
    uptime24h: 0.999,
    uptime30d: 0.998,
    requestsLastHour: 12400,
    errorsLastHour: 74,
    trend: generateTrend(890, 200),
    regions: ["us-east", "us-west", "eu-west"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    adapter: "anthropic-v1",
    status: "operational",
    responseTime: 1200,
    uptime24h: 0.998,
    uptime30d: 0.997,
    requestsLastHour: 8100,
    errorsLastHour: 105,
    trend: generateTrend(1200, 300),
    regions: ["us-east", "us-west"],
  },
  {
    id: "google",
    name: "Google",
    adapter: "google-v1beta",
    status: "operational",
    responseTime: 650,
    uptime24h: 0.997,
    uptime30d: 0.996,
    requestsLastHour: 5300,
    errorsLastHour: 117,
    trend: generateTrend(650, 150),
    regions: ["us-central", "eu-west", "asia-east"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    adapter: "deepseek-v1",
    status: "degraded",
    responseTime: 1800,
    uptime24h: 0.942,
    uptime30d: 0.981,
    requestsLastHour: 4200,
    errorsLastHour: 370,
    trend: generateTrend(1800, 500),
    regions: ["asia-east"],
  },
  {
    id: "groq",
    name: "Groq",
    adapter: "groq-v1",
    status: "operational",
    responseTime: 320,
    uptime24h: 0.995,
    uptime30d: 0.994,
    requestsLastHour: 9800,
    errorsLastHour: 343,
    trend: generateTrend(320, 80),
    regions: ["us-east", "us-west"],
  },
  {
    id: "mistral",
    name: "Mistral",
    adapter: "mistral-v1",
    status: "operational",
    responseTime: 750,
    uptime24h: 0.998,
    uptime30d: 0.995,
    requestsLastHour: 3600,
    errorsLastHour: 68,
    trend: generateTrend(750, 200),
    regions: ["eu-west"],
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    adapter: "azure-openai-v1",
    status: "down",
    responseTime: 0,
    uptime24h: 0.856,
    uptime30d: 0.972,
    requestsLastHour: 1200,
    errorsLastHour: 173,
    trend: generateTrend(2100, 600),
    regions: ["us-east", "us-west", "eu-north"],
  },
];

const initialIncidents: Incident[] = [
  {
    id: "inc-1",
    provider: "Azure OpenAI",
    severity: "critical",
    title: "Elevated error rates in us-east",
    description: "Connection timeouts affecting ~40% of requests to Azure OpenAI us-east endpoint. Investigating root cause.",
    status: "open",
    startedAt: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: "inc-2",
    provider: "DeepSeek",
    severity: "warning",
    title: "Increased latency observed",
    description: "p95 latency has risen to 8.9s over the past 30 minutes. Traffic partially rerouted to fallback.",
    status: "investigating",
    startedAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "inc-3",
    provider: "Groq",
    severity: "info",
    title: "Brief rate-limit spike",
    description: "Temporary 429 rate-limit responses between 11:42-11:47 UTC. Service has recovered.",
    status: "resolved",
    startedAt: new Date(Date.now() - 1000 * 60 * 180),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 175),
    duration: 5,
  },
  {
    id: "inc-4",
    provider: "OpenAI",
    severity: "warning",
    title: "gpt-4o model degradation",
    description: "Slower-than-usual response generation on gpt-4o. Resolved after 12 minutes.",
    status: "resolved",
    startedAt: new Date(Date.now() - 1000 * 60 * 360),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 348),
    duration: 12,
  },
  {
    id: "inc-5",
    provider: "Anthropic",
    severity: "info",
    title: "Scheduled maintenance window",
    description: "Brief unavailability during provider-side maintenance. No user impact due to failover.",
    status: "resolved",
    startedAt: new Date(Date.now() - 1000 * 60 * 720),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 715),
    duration: 5,
  },
];

/* ── Helpers ── */
const statusColor = (status: HealthStatus) => {
  switch (status) {
    case "operational":
      return "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20";
    case "degraded":
      return "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20";
    case "down":
      return "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20";
  }
};

const statusDot = (status: HealthStatus) => {
  switch (status) {
    case "operational":
      return "bg-[var(--success)]";
    case "degraded":
      return "bg-[var(--warning)]";
    case "down":
      return "bg-[var(--danger)]";
  }
};

const statusLabel = (status: HealthStatus) => {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
  }
};

const severityIcon = (severity: Incident["severity"]) => {
  switch (severity) {
    case "critical":
      return <ShieldAlert size={14} className="text-[var(--danger)]" />;
    case "warning":
      return <AlertTriangle size={14} className="text-[var(--warning)]" />;
    case "info":
      return <CheckCircle2 size={14} className="text-[var(--semantic-info)]" />;
  }
};

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
};

const uptimePercent = (v: number) => `${(v * 100).toFixed(2)}%`;

/* ── Sub-components ── */
function HealthCard({ service, index }: { service: SystemHealth; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
    >
      <Card
        variant="default"
        className={cn(
          "flex flex-col gap-2 p-3.5 border-l-4",
          service.status === "operational" && "border-l-[var(--success)]",
          service.status === "degraded" && "border-l-[var(--warning)]",
          service.status === "down" && "border-l-[var(--danger)]"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("text-[var(--text-tertiary)]", service.status === "down" && "opacity-50")}>
              {service.icon}
            </span>
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">{service.name}</span>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              statusColor(service.status)
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", statusDot(service.status))} />
            {statusLabel(service.status)}
          </span>
        </div>

        <div className="flex items-end justify-between mt-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--text-tertiary)]">Response</span>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                service.status === "down"
                  ? "text-[var(--danger)]"
                  : service.status === "degraded"
                  ? "text-[var(--warning)]"
                  : "text-[var(--text-primary)]"
              )}
            >
              {service.status === "down" ? "—" : `${service.responseTime}ms`}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[10px] text-[var(--text-tertiary)]">Uptime (24h)</span>
            <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
              {uptimePercent(service.uptime24h)}
            </span>
          </div>
        </div>

        <div className="mt-1">
          <MiniSparkline
            data={service.trend}
            width={220}
            height={28}
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

function ProviderCard({ provider, index }: { provider: ProviderStatus; index: number }) {
  const trendDirection =
    provider.trend[provider.trend.length - 1] > provider.trend[0]
      ? "up"
      : provider.trend[provider.trend.length - 1] < provider.trend[0]
      ? "down"
      : "flat";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.35, ease: "easeOut" }}
    >
      <Card
        variant="ghost"
        className={cn(
          "flex flex-col gap-2.5 p-3.5 transition-shadow hover:shadow-md",
          provider.status === "down" && "opacity-80"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                statusDot(provider.status),
                provider.status !== "operational" &&
                  typeof window !== "undefined" &&
                  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
                  "animate-pulse"
              )}
            />
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">{provider.name}</span>
          </div>
          <StatusPill
            status={
              provider.status === "operational"
                ? "healthy"
                : provider.status === "degraded"
                ? "warning"
                : "critical"
            }
            className="text-[10px]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-tertiary)]">{provider.adapter}</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {provider.regions.join(" · ")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--text-tertiary)]">Response</span>
            <span
              className={cn(
                "text-xs font-mono font-semibold",
                provider.status === "down"
                  ? "text-[var(--danger)]"
                  : provider.responseTime > 1500
                  ? "text-[var(--warning)]"
                  : "text-[var(--text-primary)]"
              )}
            >
              {provider.status === "down" ? "—" : `${provider.responseTime}ms`}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--text-tertiary)]">Uptime</span>
            <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
              {uptimePercent(provider.uptime30d)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--text-tertiary)]">RPH</span>
            <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
              {(provider.requestsLastHour / 1000).toFixed(1)}k
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <MiniSparkline
            data={provider.trend}
            width={140}
            height={22}
            color={
              provider.status === "operational"
                ? "var(--accent-primary)"
                : provider.status === "degraded"
                ? "var(--warning)"
                : "var(--danger)"
            }
          />
          <div className="flex items-center gap-1">
            {trendDirection === "up" && (
              <ArrowUpRight size={12} className="text-[var(--warning)]" />
            )}
            {trendDirection === "down" && (
              <ArrowDownRight size={12} className="text-[var(--success)]" />
            )}
            {trendDirection === "flat" && <Minus size={12} className="text-[var(--text-tertiary)]" />}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── Main page ── */
export default function StatusPage() {
  const [healthServices, setHealthServices] = useState<SystemHealth[]>(initialHealthServices);
  const [providers, setProviders] = useState<ProviderStatus[]>(initialProviders);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const overallStatus = useMemo<HealthStatus>(() => {
    if (healthServices.some((s) => s.status === "down")) return "down";
    if (healthServices.some((s) => s.status === "degraded")) return "degraded";
    return "operational";
  }, [healthServices]);

  const overallUptime = useMemo(() => {
    const avg =
      healthServices.reduce((sum, s) => sum + s.uptime30d, 0) /
      healthServices.length;
    return avg;
  }, [healthServices]);

  const openIncidents = useMemo(
    () => incidents.filter((i) => i.status === "open" || i.status === "investigating"),
    [incidents]
  );

  const refresh = useCallback(() => {
    setIsRefreshing(true);

    // Simulate data refresh with slight variations
    setHealthServices((prev) =>
      prev.map((s) => {
        if (s.status === "down") return { ...s, lastChecked: new Date() };
        const jitter = (Math.random() - 0.5) * 20;
        const newResponse = Math.max(5, Math.round(s.responseTime + jitter));
        const newTrend = [...s.trend.slice(1), newResponse];
        return {
          ...s,
          responseTime: newResponse,
          trend: newTrend,
          lastChecked: new Date(),
        };
      })
    );

    setProviders((prev) =>
      prev.map((p) => {
        if (p.status === "down") return { ...p, trend: [...p.trend.slice(1), 0] };
        const jitter = (Math.random() - 0.5) * (p.status === "degraded" ? 400 : 150);
        const newResponse = Math.max(50, Math.round(p.responseTime + jitter));
        return {
          ...p,
          responseTime: newResponse,
          trend: [...p.trend.slice(1), newResponse],
        };
      })
    );

    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  useInterval(refresh, 30000);

  /* Incident table columns */
  const incidentColumns = useMemo(
    () => [
      {
        key: "severity",
        header: "",
        width: 28,
        render: (row: Incident) => severityIcon(row.severity),
      },
      {
        key: "title",
        header: "Incident",
        width: 260,
        sortable: true,
        render: (row: Incident) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
              {row.title}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] truncate">{row.provider}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: 100,
        sortable: true,
        render: (row: Incident) => (
          <StatusPill
            status={
              row.status === "resolved"
                ? "completed"
                : row.status === "investigating"
                ? "running"
                : "failed"
            }
          />
        ),
      },
      {
        key: "startedAt",
        header: "Started",
        width: 80,
        sortable: true,
        render: (row: Incident) => (
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            {formatDuration(Date.now() - row.startedAt.getTime())} ago
          </span>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        width: 70,
        align: "right" as const,
        sortable: true,
        render: (row: Incident) =>
          row.duration ? (
            <span className="text-[11px] text-[var(--text-secondary)] font-mono">
              {row.duration}m
            </span>
          ) : (
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">ongoing</span>
          ),
      },
      {
        key: "description",
        header: "Details",
        width: 320,
        render: (row: Incident) => (
          <span className="text-[11px] text-[var(--text-secondary)] truncate block">
            {row.description}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  overallStatus === "operational"
                    ? "bg-[var(--success)]/15"
                    : overallStatus === "degraded"
                    ? "bg-[var(--warning)]/15"
                    : "bg-[var(--danger)]/15"
                )}
              >
                <Activity
                  size={18}
                  className={cn(
                    overallStatus === "operational"
                      ? "text-[var(--success)]"
                      : overallStatus === "degraded"
                      ? "text-[var(--warning)]"
                      : "text-[var(--danger)]"
                  )}
                />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  System Status
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      statusDot(overallStatus),
                      overallStatus !== "operational" &&
                        typeof window !== "undefined" &&
                        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
                        "animate-pulse"
                    )}
                  />
                  <span>
                    {overallStatus === "operational"
                      ? "All systems operational"
                      : overallStatus === "degraded"
                      ? "Some services degraded"
                      : "Service outage detected"}
                  </span>
                  <span className="mx-1">·</span>
                  <span>Last updated {formatDuration(Date.now() - lastUpdated.getTime())} ago</span>
                </div>
              </div>
            </div>

            <button
              onClick={refresh}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]",
                "px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)]",
                "hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors",
                isRefreshing && "opacity-70"
              )}
              aria-label="Refresh status"
            >
              <RefreshCw
                size={13}
                className={cn(isRefreshing && "animate-spin")}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Health Summary Banner ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <HealthCard service={healthServices[0]} index={0} />
          <HealthCard service={healthServices[1]} index={1} />
          <HealthCard service={healthServices[2]} index={2} />
          <HealthCard service={healthServices[3]} index={3} />
        </div>

        {/* ── Provider Cards ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-[var(--text-tertiary)]" />
              <h2 className="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
                Provider Health
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                {providers.filter((p) => p.status === "operational").length} up
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--warning)]" />
                {providers.filter((p) => p.status === "degraded").length} degraded
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
                {providers.filter((p) => p.status === "down").length} down
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {providers.map((provider, i) => (
              <ProviderCard key={provider.id} provider={provider} index={i} />
            ))}
          </div>
        </section>

        {/* ── Incidents ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-[var(--text-tertiary)]" />
              <h2 className="text-xs font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
                Recent Incidents
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {openIncidents.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
                  {openIncidents.length} open
                </span>
              )}
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {incidents.length} total (30d)
              </span>
            </div>
          </div>

          <Card variant="default" className="overflow-hidden">
            <ConsoleTable
              columns={incidentColumns}
              data={incidents}
              density="cozy"
              maxHeight={380}
              stickyHeader
              emptyText="No incidents in the last 30 days"
            />
          </Card>
        </section>

        {/* ── Footer Stats ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card variant="ghost" className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
              <Server size={15} className="text-[var(--success)]" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Overall Uptime (30d)</div>
              <div className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                {uptimePercent(overallUptime)}
              </div>
            </div>
          </Card>

          <Card variant="ghost" className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--semantic-info)]/10 flex items-center justify-center flex-shrink-0">
              <Wifi size={15} className="text-[var(--semantic-info)]" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Active Connections</div>
              <div className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                {Math.floor(
                  providers.reduce((sum, p) => sum + p.requestsLastHour, 0) / 60
                ).toLocaleString()}
                <span className="text-[10px] text-[var(--text-tertiary)] ml-1">/min</span>
              </div>
            </div>
          </Card>

          <Card variant="ghost" className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-[var(--accent-primary)]" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Avg Response (p50)</div>
              <div className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                {Math.round(
                  providers.filter((p) => p.status !== "down").reduce((sum, p) => sum + p.responseTime, 0) /
                    Math.max(1, providers.filter((p) => p.status !== "down").length)
                )}
                <span className="text-[10px] text-[var(--text-tertiary)] ml-1">ms</span>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Auto-refresh indicator ── */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)] py-2">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full bg-[var(--success)]",
              typeof window !== "undefined" &&
                !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
                "animate-pulse"
            )}
          />
          Auto-refreshing every 30 seconds
          <span className="mx-1">·</span>
          <span className="font-mono">v2.4.1-status</span>
        </div>
      </main>
    </div>
  );
}
