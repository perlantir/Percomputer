"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill, MiniSparkline } from "./ConsoleTable";
import { useConsoleRole, confirmAction } from "@/src/hooks/useConsoleRole";

interface ProviderMetrics {
  id: string;
  adapter: string;
  provider: string;
  successRate: number; // 0-1
  latencyP50: number;
  latencyP95: number;
  costPerMtok: number;
  circuitBreaker: "open" | "closed" | "half-open";
  requestsLastHour: number;
  errorsLastHour: number;
  latencyTrend: number[];
  alertLevel: "none" | "warning" | "critical";
}

const demoProviders: ProviderMetrics[] = [
  {
    id: "p1",
    adapter: "openai-v1",
    provider: "OpenAI",
    successRate: 0.994,
    latencyP50: 890,
    latencyP95: 3400,
    costPerMtok: 5.00,
    circuitBreaker: "closed",
    requestsLastHour: 12400,
    errorsLastHour: 74,
    latencyTrend: [800, 850, 900, 920, 890, 870, 890],
    alertLevel: "none",
  },
  {
    id: "p2",
    adapter: "anthropic-v1",
    provider: "Anthropic",
    successRate: 0.987,
    latencyP50: 1200,
    latencyP95: 4200,
    costPerMtok: 5.50,
    circuitBreaker: "closed",
    requestsLastHour: 8100,
    errorsLastHour: 105,
    latencyTrend: [1100, 1150, 1250, 1300, 1200, 1180, 1200],
    alertLevel: "none",
  },
  {
    id: "p3",
    adapter: "google-v1beta",
    provider: "Google",
    successRate: 0.978,
    latencyP50: 650,
    latencyP95: 2800,
    costPerMtok: 2.10,
    circuitBreaker: "closed",
    requestsLastHour: 5300,
    errorsLastHour: 117,
    latencyTrend: [600, 620, 700, 680, 650, 660, 650],
    alertLevel: "none",
  },
  {
    id: "p4",
    adapter: "deepseek-v1",
    provider: "DeepSeek",
    successRate: 0.912,
    latencyP50: 1800,
    latencyP95: 8900,
    costPerMtok: 0.80,
    circuitBreaker: "half-open",
    requestsLastHour: 4200,
    errorsLastHour: 370,
    latencyTrend: [1200, 1500, 2000, 2500, 2200, 1900, 1800],
    alertLevel: "warning",
  },
  {
    id: "p5",
    adapter: "groq-v1",
    provider: "Groq",
    successRate: 0.965,
    latencyP50: 320,
    latencyP95: 1200,
    costPerMtok: 0.50,
    circuitBreaker: "closed",
    requestsLastHour: 9800,
    errorsLastHour: 343,
    latencyTrend: [300, 310, 340, 350, 330, 320, 320],
    alertLevel: "none",
  },
  {
    id: "p6",
    adapter: "mistral-v1",
    provider: "Mistral",
    successRate: 0.981,
    latencyP50: 750,
    latencyP95: 3100,
    costPerMtok: 1.80,
    circuitBreaker: "closed",
    requestsLastHour: 3600,
    errorsLastHour: 68,
    latencyTrend: [700, 720, 780, 800, 760, 740, 750],
    alertLevel: "none",
  },
  {
    id: "p7",
    adapter: "azure-openai-v1",
    provider: "Azure OpenAI",
    successRate: 0.856,
    latencyP50: 2100,
    latencyP95: 9500,
    costPerMtok: 4.80,
    circuitBreaker: "open",
    requestsLastHour: 1200,
    errorsLastHour: 173,
    latencyTrend: [1500, 2000, 3000, 5000, 8000, 6000, 2100],
    alertLevel: "critical",
  },
];

export default function ProviderHealth() {
  const [providers, setProviders] = useState(demoProviders);
  const { isAdmin } = useConsoleRole();

  const toggleBreaker = (id: string) => {
    if (!isAdmin) return;
    const provider = providers.find((p) => p.id === id);
    if (!provider) return;
    const nextState =
      provider.circuitBreaker === "closed"
        ? "half-open"
        : provider.circuitBreaker === "half-open"
        ? "open"
        : "closed";
    if (!confirmAction(`Toggle circuit breaker for ${provider.provider} to "${nextState}"?`)) {
      return;
    }
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const states: Array<"open" | "closed" | "half-open"> = ["closed", "half-open", "open"];
        const idx = states.indexOf(p.circuitBreaker);
        return { ...p, circuitBreaker: states[(idx + 1) % 3] };
      })
    );
  };

  const columns = [
    {
      key: "alert",
      header: "",
      width: 24,
      render: (row: ProviderMetrics) =>
        row.alertLevel !== "none" && (
          <span
            className={cn(
              "w-2 h-2 rounded-full block",
              row.alertLevel === "critical"
                ? cn(
                    "bg-danger",
                    typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "animate-ping"
                  )
                : "bg-warning"
            )}
          />
        ),
    },
    {
      key: "provider",
      header: "Provider",
      width: 110,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <div>
          <div className="text-[11px] font-semibold text-[var(--text-primary)]">{row.provider}</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{row.adapter}</div>
        </div>
      ),
    },
    {
      key: "successRate",
      header: "Success",
      width: 55,
      align: "right" as const,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <span
          className={cn(
            "font-mono",
            row.successRate >= 0.99
              ? "text-success"
              : row.successRate >= 0.95
              ? "text-[var(--text-secondary)]"
              : "text-danger"
          )}
        >
          {(row.successRate * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: "latencyP50",
      header: "p50",
      width: 55,
      align: "right" as const,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <span className="font-mono">{row.latencyP50}ms</span>
      ),
    },
    {
      key: "latencyP95",
      header: "p95",
      width: 55,
      align: "right" as const,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <span
          className={cn(
            "font-mono",
            row.latencyP95 > 5000 ? "text-danger" : row.latencyP95 > 3000 ? "text-warning" : "text-[var(--text-secondary)]"
          )}
        >
          {row.latencyP95}ms
        </span>
      ),
    },
    {
      key: "costPerMtok",
      header: "$/1MT",
      width: 50,
      align: "right" as const,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <span className="font-mono">${row.costPerMtok.toFixed(2)}</span>
      ),
    },
    {
      key: "circuitBreaker",
      header: "Breaker",
      width: 80,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <button
          onClick={() => toggleBreaker(row.id)}
          disabled={!isAdmin}
          className={cn(
            "text-[10px] px-2 py-0.5 rounded border transition-colors",
            row.circuitBreaker === "closed" && "bg-success/15 text-success border-success/25",
            row.circuitBreaker === "half-open" && "bg-warning/15 text-warning border-warning/25",
            row.circuitBreaker === "open" && "bg-danger/15 text-danger border-danger/25",
            !isAdmin && "opacity-50 cursor-not-allowed"
          )}
        >
          {row.circuitBreaker}
        </button>
      ),
    },
    {
      key: "requestsLastHour",
      header: "RPH",
      width: 55,
      align: "right" as const,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <span className="font-mono">{(row.requestsLastHour / 1000).toFixed(1)}k</span>
      ),
    },
    {
      key: "errorsLastHour",
      header: "Err",
      width: 40,
      align: "right" as const,
      sortable: true,
      render: (row: ProviderMetrics) => (
        <span
          className={cn(
            "font-mono",
            row.errorsLastHour > 300 ? "text-danger" : row.errorsLastHour > 100 ? "text-warning" : "text-[var(--text-secondary)]"
          )}
        >
          {row.errorsLastHour}
        </span>
      ),
    },
    {
      key: "latencyTrend",
      header: "Trend",
      width: 70,
      render: (row: ProviderMetrics) => (
        <MiniSparkline
          data={row.latencyTrend}
          width={60}
          height={18}
          color={
            row.alertLevel === "critical"
              ? "var(--danger)"
              : row.alertLevel === "warning"
              ? "var(--warning)"
              : "var(--accent-primary)"
          }
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Providers:</span>{" "}
          <span className="font-mono text-[var(--text-secondary)]">{providers.length}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Open breakers:</span>{" "}
          <span className="font-mono text-danger">
            {providers.filter((p) => p.circuitBreaker === "open").length}
          </span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Half-open:</span>{" "}
          <span className="font-mono text-warning">
            {providers.filter((p) => p.circuitBreaker === "half-open").length}
          </span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Alerts:</span>{" "}
          <span className="font-mono text-danger">
            {providers.filter((p) => p.alertLevel !== "none").length}
          </span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">RPH total:</span>{" "}
          <span className="font-mono text-[var(--text-secondary)]">
            {(providers.reduce((a, p) => a + p.requestsLastHour, 0) / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <ConsoleTable columns={columns} data={providers} maxHeight={800} />
      </div>
    </div>
  );
}
