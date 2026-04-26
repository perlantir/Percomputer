"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

// ── types ───────────────────────────────────────────────────────────────────

export interface CostTrendPoint {
  date: string;
  creditsSpent: number;
  cumulativeCredits: number;
  projectedCredits: number;
}

interface CostTrendProps {
  data: CostTrendPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  showProjection?: boolean;
  showGrid?: boolean;
  budgetLimit?: number;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCredits(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

function niceTicks(max: number, count: number): number[] {
  const step = niceMax(max / count);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    const v = i * step;
    if (v > max * 1.1) break;
    ticks.push(v);
  }
  return ticks;
}

// ── component ───────────────────────────────────────────────────────────────

export const CostTrend = React.memo(function CostTrend({
  data,
  title,
  subtitle,
  height = 260,
  className,
  showProjection = true,
  showGrid = true,
  budgetLimit,
}: CostTrendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const margin = { top: 24, right: 24, bottom: 48, left: 64 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const allValues = useMemo(() => {
    const vals = data.flatMap((d) => [d.creditsSpent, d.cumulativeCredits]);
    if (showProjection) vals.push(...data.map((d) => d.projectedCredits));
    if (budgetLimit != null) vals.push(budgetLimit);
    return vals;
  }, [data, showProjection, budgetLimit]);

  const maxValue = useMemo(() => Math.max(...allValues, 1), [allValues]);
  const yMax = niceMax(maxValue * 1.1);
  const yTicks = useMemo(() => niceTicks(yMax, 5), [yMax]);

  const xStep = innerWidth / (data.length - 1 || 1);

  const yScale = (v: number) => innerHeight - (v / yMax) * innerHeight;
  const xScale = (i: number) => i * xStep;

  const primaryColor = "var(--accent-primary)";
  const secondaryColor = "var(--accent-secondary)";
  const tertiaryColor = "var(--accent-tertiary)";
  const textTertiary = "var(--text-tertiary)";
  const borderSubtle = "var(--border-subtle)";
  const dangerColor = "var(--danger)";

  // Cumulative area path
  const cumulativeAreaPath = useMemo(() => {
    const points = data.map((d, i) => {
      const x = margin.left + xScale(i);
      const y = margin.top + yScale(d.cumulativeCredits);
      return `${x} ${y}`;
    });
    const firstX = margin.left + xScale(0);
    const lastX = margin.left + xScale(data.length - 1);
    const bottomY = margin.top + innerHeight;
    return `M ${firstX} ${bottomY} L ${points.join(" L ")} L ${lastX} ${bottomY} Z`;
  }, [data, margin.left, margin.top, xScale, yScale, innerHeight]);

  // Cumulative line path
  const cumulativeLinePath = useMemo(() => {
    return data
      .map((d, i) => {
        const x = margin.left + xScale(i);
        const y = margin.top + yScale(d.cumulativeCredits);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data, margin.left, margin.top, xScale, yScale]);

  // Daily spend bars
  const barWidth = Math.max(xStep * 0.5, 4);

  // Projection line path
  const projectionPath = useMemo(() => {
    if (!showProjection) return "";
    return data
      .map((d, i) => {
        const x = margin.left + xScale(i);
        const y = margin.top + yScale(d.projectedCredits);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data, showProjection, margin.left, margin.top, xScale, yScale]);

  const handlePointEnter = (i: number, e: React.MouseEvent) => {
    setHoveredIndex(i);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-foreground-primary">{title}</h3>}
          {subtitle && <p className="text-xs text-foreground-tertiary mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          style={{ minHeight: height }}
          onMouseLeave={handlePointLeave}
        >
          {/* Budget limit line */}
          {budgetLimit != null && (
            <>
              <line
                x1={margin.left}
                y1={margin.top + yScale(budgetLimit)}
                x2={margin.left + innerWidth}
                y2={margin.top + yScale(budgetLimit)}
                stroke={dangerColor}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                opacity={0.6}
              />
              <text
                x={margin.left + innerWidth - 4}
                y={margin.top + yScale(budgetLimit) - 6}
                textAnchor="end"
                fontSize={10}
                fill={dangerColor}
                opacity={0.8}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                Budget: {formatCredits(budgetLimit)}
              </text>
            </>
          )}

          {/* Grid */}
          {showGrid &&
            yTicks.map((tick, i) => {
              const y = margin.top + yScale(tick);
              return (
                <line
                  key={`grid-${i}`}
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + innerWidth}
                  y2={y}
                  stroke={borderSubtle}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}

          {/* Axes */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke={borderSubtle}
            strokeWidth={1}
          />
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke={borderSubtle}
            strokeWidth={1}
          />

          {/* Y ticks */}
          {yTicks.map((tick, i) => {
            const y = margin.top + yScale(tick);
            return (
              <text
                key={`ytick-${i}`}
                x={margin.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill={textTertiary}
                fontFamily="ui-monospace, monospace"
              >
                {formatCredits(tick)}
              </text>
            );
          })}

          {/* X ticks */}
          {data.map((d, i) => {
            const showLabel = data.length <= 14 || i % Math.ceil(data.length / 14) === 0;
            if (!showLabel) return null;
            const x = margin.left + xScale(i);
            return (
              <text
                key={`xtick-${i}`}
                x={x}
                y={margin.top + innerHeight + 20}
                textAnchor="middle"
                fontSize={11}
                fill={textTertiary}
                fontFamily="ui-monospace, monospace"
              >
                {formatDateShort(d.date)}
              </text>
            );
          })}

          {/* Daily spend bars */}
          {data.map((d, i) => {
            const x = margin.left + xScale(i) - barWidth / 2;
            const y = margin.top + yScale(d.creditsSpent);
            const h = innerHeight - yScale(d.creditsSpent);
            const isHovered = hoveredIndex === i;

            return (
              <motion.rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, 0)}
                rx={2}
                fill={tertiaryColor}
                fillOpacity={isHovered ? 0.8 : 0.4}
                initial={{ y: margin.top + innerHeight, height: 0 }}
                animate={{ y, height: Math.max(h, 0) }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 1, 0.5, 1],
                  delay: i * 0.015,
                }}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handlePointEnter(i, e)}
                onMouseMove={handlePointMove}
                onMouseLeave={handlePointLeave}
              />
            );
          })}

          {/* Cumulative area */}
          <motion.path
            d={cumulativeAreaPath}
            fill={primaryColor}
            fillOpacity={0.12}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            pointerEvents="none"
          />

          {/* Cumulative line */}
          <motion.path
            d={cumulativeLinePath}
            fill="none"
            stroke={primaryColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
            pointerEvents="none"
          />

          {/* Projection line */}
          {showProjection && projectionPath && (
            <motion.path
              d={projectionPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
              pointerEvents="none"
            />
          )}

          {/* Cumulative points */}
          {data.map((d, i) => {
            const x = margin.left + xScale(i);
            const y = margin.top + yScale(d.cumulativeCredits);
            const isHovered = hoveredIndex === i;

            return (
              <g key={`point-${i}`} style={{ cursor: "pointer" }}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5 : 3.5}
                  fill="var(--bg-surface)"
                  stroke={primaryColor}
                  strokeWidth={2}
                  onMouseEnter={(e) => handlePointEnter(i, e)}
                  onMouseMove={handlePointMove}
                  onMouseLeave={handlePointLeave}
                />
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill={primaryColor}
                    fillOpacity={0.12}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredIndex !== null && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-md border border-border-subtle"
              style={{
                left: tooltipPos.x + 12,
                top: tooltipPos.y - 56,
                background: "var(--bg-surface)",
              }}
            >
              <div className="text-xs font-medium text-foreground-primary whitespace-nowrap">
                {formatDateShort(data[hoveredIndex].date)}
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: tertiaryColor }} />
                  <span className="text-[11px] text-foreground-secondary">
                    Spent: {data[hoveredIndex].creditsSpent.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: primaryColor }} />
                  <span className="text-[11px] text-foreground-secondary">
                    Cumulative: {data[hoveredIndex].cumulativeCredits.toFixed(1)}
                  </span>
                </div>
                {showProjection && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: secondaryColor }} />
                    <span className="text-[11px] text-foreground-secondary">
                      Projected: {data[hoveredIndex].projectedCredits.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: primaryColor }} />
          <span className="text-xs text-foreground-secondary">Cumulative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded-sm" style={{ background: tertiaryColor }} />
          <span className="text-xs text-foreground-secondary">Daily Spend</span>
        </div>
        {showProjection && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded-sm" style={{ background: secondaryColor }} />
            <span className="text-xs text-foreground-secondary">Projected</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default CostTrend;
