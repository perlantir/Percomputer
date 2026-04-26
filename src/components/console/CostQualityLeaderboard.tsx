"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill, MiniSparkline } from "./ConsoleTable";

interface ModelMetrics {
  id: string;
  model: string;
  tier: "premium" | "standard" | "economy";
  tasksRun: number;
  successRate: number; // 0-1
  avgCost: number; // cents
  avgLatency: number; // ms
  qualityScore: number; // 0-100
  latencyHistory: number[];
  costHistory: number[];
}

const demoModels: ModelMetrics[] = [
  {
    id: "m1",
    model: "gpt-4o",
    tier: "premium",
    tasksRun: 48231,
    successRate: 0.992,
    avgCost: 4.82,
    avgLatency: 1240,
    qualityScore: 94.2,
    latencyHistory: [1100, 1200, 1150, 1300, 1240, 1180, 1240],
    costHistory: [4.5, 4.7, 4.6, 5.1, 4.9, 4.8, 4.82],
  },
  {
    id: "m2",
    model: "claude-3.5-sonnet",
    tier: "premium",
    tasksRun: 35102,
    successRate: 0.987,
    avgCost: 5.12,
    avgLatency: 1380,
    qualityScore: 95.1,
    latencyHistory: [1400, 1350, 1420, 1380, 1360, 1390, 1380],
    costHistory: [5.0, 5.2, 5.1, 5.3, 5.15, 5.08, 5.12],
  },
  {
    id: "m3",
    model: "gemini-1.5-pro",
    tier: "standard",
    tasksRun: 28450,
    successRate: 0.978,
    avgCost: 2.31,
    avgLatency: 980,
    qualityScore: 89.5,
    latencyHistory: [900, 950, 1000, 980, 960, 990, 980],
    costHistory: [2.1, 2.2, 2.35, 2.3, 2.25, 2.32, 2.31],
  },
  {
    id: "m4",
    model: "o3-mini",
    tier: "premium",
    tasksRun: 18200,
    successRate: 0.995,
    avgCost: 6.45,
    avgLatency: 2100,
    qualityScore: 97.8,
    latencyHistory: [1800, 1900, 2000, 2200, 2050, 2150, 2100],
    costHistory: [5.8, 6.0, 6.2, 6.8, 6.5, 6.6, 6.45],
  },
  {
    id: "m5",
    model: "deepseek-chat",
    tier: "economy",
    tasksRun: 42100,
    successRate: 0.961,
    avgCost: 0.89,
    avgLatency: 1560,
    qualityScore: 82.3,
    latencyHistory: [1400, 1500, 1600, 1550, 1580, 1540, 1560],
    costHistory: [0.8, 0.85, 0.92, 0.9, 0.88, 0.87, 0.89],
  },
  {
    id: "m6",
    model: "llama-3.1-70b",
    tier: "standard",
    tasksRun: 12500,
    successRate: 0.972,
    avgCost: 1.45,
    avgLatency: 1800,
    qualityScore: 86.7,
    latencyHistory: [1700, 1750, 1820, 1780, 1810, 1790, 1800],
    costHistory: [1.3, 1.4, 1.5, 1.48, 1.46, 1.44, 1.45],
  },
  {
    id: "m7",
    model: "mistral-large",
    tier: "standard",
    tasksRun: 9800,
    successRate: 0.975,
    avgCost: 1.92,
    avgLatency: 1100,
    qualityScore: 88.1,
    latencyHistory: [1050, 1080, 1120, 1100, 1090, 1110, 1100],
    costHistory: [1.8, 1.85, 2.0, 1.95, 1.93, 1.9, 1.92],
  },
  {
    id: "m8",
    model: "gpt-4o-mini",
    tier: "economy",
    tasksRun: 67300,
    successRate: 0.968,
    avgCost: 0.62,
    avgLatency: 420,
    qualityScore: 78.4,
    latencyHistory: [380, 400, 450, 430, 410, 440, 420],
    costHistory: [0.55, 0.6, 0.65, 0.63, 0.61, 0.64, 0.62],
  },
];

export default function CostQualityLeaderboard() {
  const [costWeight, setCostWeight] = useState(0.33);
  const [qualityWeight, setQualityWeight] = useState(0.33);
  const [latencyWeight, setLatencyWeight] = useState(0.34);
  const [tierFilter, setTierFilter] = useState<string[]>([]);

  // Normalize weights
  const total = costWeight + qualityWeight + latencyWeight;
  const cw = costWeight / total;
  const qw = qualityWeight / total;
  const lw = latencyWeight / total;

  const scored = useMemo(() => {
    const maxCost = Math.max(...demoModels.map((m) => m.avgCost));
    const maxLatency = Math.max(...demoModels.map((m) => m.avgLatency));
    const filtered = tierFilter.length ? demoModels.filter((m) => tierFilter.includes(m.tier)) : demoModels;

    return filtered
      .map((m) => {
        // Composite score: higher is better
        // cost score: inverted (lower cost = higher score)
        // latency score: inverted (lower latency = higher score)
        // quality score: direct
        const costScore = (1 - m.avgCost / maxCost) * 100;
        const latencyScore = (1 - m.avgLatency / maxLatency) * 100;
        const composite = costScore * cw + m.qualityScore * qw + latencyScore * lw;
        return { ...m, compositeScore: composite };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [cw, qw, lw, tierFilter]);

  const toggleTier = (t: string) => {
    setTierFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const columns = [
    {
      key: "rank",
      header: "#",
      width: 32,
      align: "right" as const,
      render: (_: any, i: number) => <span className="font-mono text-[var(--text-tertiary)]">{i + 1}</span>,
    },
    { key: "model", header: "Model", width: 130, sortable: true },
    {
      key: "tier",
      header: "Tier",
      width: 70,
      sortable: true,
      render: (row: typeof scored[0]) => (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border",
            row.tier === "premium" && "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/25",
            row.tier === "standard" && "bg-info/15 text-info border-info/25",
            row.tier === "economy" && "bg-success/15 text-success border-success/25"
          )}
        >
          {row.tier}
        </span>
      ),
    },
    {
      key: "tasksRun",
      header: "Tasks",
      width: 60,
      align: "right" as const,
      sortable: true,
      render: (row: typeof scored[0]) => (
        <span className="font-mono">{row.tasksRun.toLocaleString()}</span>
      ),
    },
    {
      key: "successRate",
      header: "Success",
      width: 60,
      align: "right" as const,
      sortable: true,
      render: (row: typeof scored[0]) => (
        <span className={cn("font-mono", row.successRate >= 0.99 ? "text-success" : row.successRate >= 0.97 ? "text-[var(--text-secondary)]" : "text-warning")}>
          {(row.successRate * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: "avgCost",
      header: "Avg Cost",
      width: 65,
      align: "right" as const,
      sortable: true,
      render: (row: typeof scored[0]) => (
        <span className="font-mono">{row.avgCost.toFixed(2)}¢</span>
      ),
    },
    {
      key: "avgLatency",
      header: "Latency",
      width: 60,
      align: "right" as const,
      sortable: true,
      render: (row: typeof scored[0]) => (
        <span className="font-mono">{row.avgLatency}ms</span>
      ),
    },
    {
      key: "qualityScore",
      header: "Quality",
      width: 55,
      align: "right" as const,
      sortable: true,
      render: (row: typeof scored[0]) => (
        <span className={cn("font-mono", row.qualityScore >= 90 ? "text-success" : row.qualityScore >= 80 ? "text-[var(--text-secondary)]" : "text-warning")}>
          {row.qualityScore.toFixed(1)}
        </span>
      ),
    },
    {
      key: "compositeScore",
      header: "Score",
      width: 55,
      align: "right" as const,
      render: (row: typeof scored[0]) => (
        <span className="font-mono font-semibold text-[var(--accent-primary)]">{row.compositeScore.toFixed(1)}</span>
      ),
    },
    {
      key: "latencyHistory",
      header: "Trend",
      width: 70,
      render: (row: typeof scored[0]) => <MiniSparkline data={row.latencyHistory} width={60} height={18} />,
    },
  ];

  // Scatter chart data
  const scatterData = scored.map((m) => ({
    x: m.avgCost,
    y: m.qualityScore,
    r: m.successRate * 20,
    model: m.model,
    tier: m.tier,
  }));

  const maxCostVal = Math.max(...scatterData.map((d) => d.x)) * 1.1;
  const minCostVal = Math.min(...scatterData.map((d) => d.x)) * 0.9;
  const maxQVal = 100;
  const minQVal = 70;

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] w-14">Cost</span>
            <input
              type="range"
              min={0}
              max={100}
              value={costWeight * 100}
              onChange={(e) => setCostWeight(Number(e.target.value) / 100)}
              className="flex-1 accent-[var(--accent-primary)] h-1"
            />
            <span className="text-[10px] font-mono w-8 text-right">{(cw * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] w-14">Quality</span>
            <input
              type="range"
              min={0}
              max={100}
              value={qualityWeight * 100}
              onChange={(e) => setQualityWeight(Number(e.target.value) / 100)}
              className="flex-1 accent-[var(--accent-primary)] h-1"
            />
            <span className="text-[10px] font-mono w-8 text-right">{(qw * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] w-14">Latency</span>
            <input
              type="range"
              min={0}
              max={100}
              value={latencyWeight * 100}
              onChange={(e) => setLatencyWeight(Number(e.target.value) / 100)}
              className="flex-1 accent-[var(--accent-primary)] h-1"
            />
            <span className="text-[10px] font-mono w-8 text-right">{(lw * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {["premium", "standard", "economy"].map((t) => (
            <button
              key={t}
              onClick={() => toggleTier(t)}
              className={cn(
                "px-2 py-0.5 text-[10px] rounded border transition-colors capitalize",
                tierFilter.includes(t)
                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30"
                  : "bg-transparent border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <ConsoleTable columns={columns} data={scored} maxHeight={800} />
        </div>

        {/* Scatter chart sidebar */}
        <div className="w-64 flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-2">
            Cost vs Quality
          </div>
          <svg viewBox="0 0 220 200" className="w-full">
            {/* Grid */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`h${i}`}
                x1={30}
                y1={20 + i * 36}
                x2={210}
                y2={20 + i * 36}
                stroke="var(--border-subtle)"
                strokeWidth={0.5}
              />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={`v${i}`}
                x1={30 + i * 30}
                y1={20}
                x2={30 + i * 30}
                y2={200}
                stroke="var(--border-subtle)"
                strokeWidth={0.5}
              />
            ))}
            {/* Axes labels */}
            <text x={120} y={198} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)" fontFamily="monospace">
              avg cost (¢)
            </text>
            <text x={10} y={110} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)" fontFamily="monospace" transform="rotate(-90, 10, 110)">
              quality
            </text>
            {/* Points */}
            {scatterData.map((d) => {
              const x = 30 + ((d.x - minCostVal) / (maxCostVal - minCostVal)) * 180;
              const y = 200 - ((d.y - minQVal) / (maxQVal - minQVal)) * 180;
              const color =
                d.tier === "premium"
                  ? "var(--accent-primary)"
                  : d.tier === "standard"
                  ? "var(--info)"
                  : "var(--success)";
              return (
                <g key={d.model}>
                  <circle cx={x} cy={y} r={Math.max(4, d.r)} fill={color} opacity={0.6} stroke={color} strokeWidth={1} />
                  <text x={x} y={y - d.r - 3} textAnchor="middle" fontSize={7} fill="var(--text-secondary)" fontFamily="monospace">
                    {d.model.length > 10 ? d.model.slice(0, 8) + "…" : d.model}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]/60" /> premium
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)]">
              <span className="w-2 h-2 rounded-full bg-info/60" /> standard
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)]">
              <span className="w-2 h-2 rounded-full bg-success/60" /> economy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
