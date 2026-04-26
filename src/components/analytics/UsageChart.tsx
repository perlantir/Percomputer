"use client";

import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

// ── types ───────────────────────────────────────────────────────────────────

export interface UsageChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export type UsageChartType = "bar" | "line" | "dual";

interface UsageChartProps {
  data: UsageChartDataPoint[];
  type?: UsageChartType;
  title?: string;
  subtitle?: string;
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  formatValue?: (v: number) => string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function defaultFormat(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
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

export const UsageChart = React.memo(function UsageChart({
  data,
  type = "bar",
  title,
  subtitle,
  height = 280,
  primaryLabel = "Primary",
  secondaryLabel = "Secondary",
  formatValue = defaultFormat,
  className,
  showGrid = true,
  showLegend = true,
  animate = true,
}: UsageChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const margin = { top: 24, right: 16, bottom: 48, left: 56 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const allValues = useMemo(() => {
    const vals: number[] = [];
    data.forEach((d) => {
      vals.push(d.value);
      if (d.secondaryValue != null) vals.push(d.secondaryValue);
    });
    return vals;
  }, [data]);

  const maxValue = useMemo(() => Math.max(...allValues, 1), [allValues]);
  const yMax = niceMax(maxValue * 1.1);
  const yTicks = useMemo(() => niceTicks(yMax, 5), [yMax]);

  const barWidth = useMemo(() => {
    const groupCount = data.length;
    const padding = 0.3;
    const step = innerWidth / groupCount;
    return step * (1 - padding);
  }, [data.length, innerWidth]);

  const barSpacing = useMemo(() => {
    const groupCount = data.length;
    const step = innerWidth / groupCount;
    return step;
  }, [data.length, innerWidth]);

  const yScale = useCallback(
    (v: number) => innerHeight - (v / yMax) * innerHeight,
    [innerHeight, yMax]
  );

  const xScale = useCallback(
    (i: number) => i * barSpacing + barSpacing / 2,
    [barSpacing]
  );

  const primaryColor = "var(--accent-primary)";
  const secondaryColor = "var(--accent-secondary)";
  const textPrimary = "var(--text-primary)";
  const textSecondary = "var(--text-secondary)";
  const textTertiary = "var(--text-tertiary)";
  const borderSubtle = "var(--border-subtle)";

  // Build line path for line/dual charts
  const linePath = useMemo(() => {
    if (type === "bar") return "";
    return data
      .map((d, i) => {
        const x = margin.left + xScale(i);
        const y = margin.top + yScale(d.value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data, type, margin.left, margin.top, xScale, yScale]);

  // Build area path for line/dual charts
  const areaPath = useMemo(() => {
    if (type === "bar") return "";
    const points = data.map((d, i) => {
      const x = margin.left + xScale(i);
      const y = margin.top + yScale(d.value);
      return `${x} ${y}`;
    });
    const firstX = margin.left + xScale(0);
    const lastX = margin.left + xScale(data.length - 1);
    const bottomY = margin.top + innerHeight;
    return `M ${firstX} ${bottomY} L ${points.join(" L ")} L ${lastX} ${bottomY} Z`;
  }, [data, type, margin.left, margin.top, xScale, yScale, innerHeight]);

  // Secondary line path
  const secondaryLinePath = useMemo(() => {
    if (type !== "dual") return "";
    return data
      .filter((d) => d.secondaryValue != null)
      .map((d, i) => {
        const x = margin.left + xScale(i);
        const y = margin.top + yScale(d.secondaryValue ?? 0);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data, type, margin.left, margin.top, xScale, yScale]);

  const handleBarEnter = (i: number, e: React.MouseEvent) => {
    setHoveredIndex(i);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleBarMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleBarLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const showDual = type === "dual";
  const showLine = type === "line" || showDual;

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
          onMouseLeave={handleBarLeave}
        >
          {/* Background grid */}
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

          {/* Y-axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke={borderSubtle}
            strokeWidth={1}
          />

          {/* X-axis */}
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke={borderSubtle}
            strokeWidth={1}
          />

          {/* Y-axis labels */}
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
                {formatValue(tick)}
              </text>
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = margin.left + xScale(i);
            const showLabel = data.length <= 14 || i % Math.ceil(data.length / 14) === 0;
            if (!showLabel) return null;
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
                {d.label}
              </text>
            );
          })}

          {/* Bars */}
          {type === "bar" &&
            data.map((d, i) => {
              const x = margin.left + xScale(i) - barWidth / 2;
              const y = margin.top + yScale(d.value);
              const h = innerHeight - yScale(d.value);
              const isHovered = hoveredIndex === i;

              return (
                <g key={`bar-${i}`}>
                  <motion.rect
                    x={x}
                    width={Math.max(barWidth * 0.6, barWidth)}
                    rx={4}
                    fill={primaryColor}
                    fillOpacity={isHovered ? 0.9 : 0.7}
                    initial={animate ? { y: margin.top + innerHeight, height: 0 } : false}
                    animate={{
                      y,
                      height: Math.max(h, 0),
                      fillOpacity: isHovered ? 0.9 : 0.7,
                    }}
                    transition={{
                      y: { duration: 0.6, ease: [0.25, 1, 0.5, 1], delay: i * 0.02 },
                      height: { duration: 0.6, ease: [0.25, 1, 0.5, 1], delay: i * 0.02 },
                      fillOpacity: { duration: 0.15 },
                    }}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => handleBarEnter(i, e)}
                    onMouseMove={handleBarMove}
                    onMouseLeave={handleBarLeave}
                  />
                  {isHovered && (
                    <rect
                      x={x - 2}
                      y={Math.max(y - 2, 0)}
                      width={Math.max(barWidth * 0.6, barWidth) + 4}
                      height={Math.max(h + 4, 0)}
                      rx={6}
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}

          {/* Dual bars (side by side) */}
          {showDual &&
            data.map((d, i) => {
              const groupX = margin.left + xScale(i);
              const halfW = Math.max(barWidth * 0.6, barWidth) / 2;

              const bar1H = innerHeight - yScale(d.value);
              const bar1Y = margin.top + yScale(d.value);

              return (
                <g key={`dual-${i}`}>
                  <motion.rect
                    x={groupX - halfW - 1}
                    width={halfW}
                    rx={3}
                    fill={primaryColor}
                    fillOpacity={hoveredIndex === i ? 0.9 : 0.75}
                    initial={animate ? { y: margin.top + innerHeight, height: 0 } : false}
                    animate={{
                      y: bar1Y,
                      height: Math.max(bar1H, 0),
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 1, 0.5, 1],
                      delay: i * 0.02,
                    }}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => handleBarEnter(i, e)}
                    onMouseMove={handleBarMove}
                    onMouseLeave={handleBarLeave}
                  />
                  {d.secondaryValue != null && (
                    <motion.rect
                      x={groupX + 1}
                      width={halfW}
                      rx={3}
                      fill={secondaryColor}
                      fillOpacity={hoveredIndex === i ? 0.9 : 0.75}
                      initial={animate ? { y: margin.top + innerHeight, height: 0 } : false}
                      animate={{
                        y: margin.top + yScale(d.secondaryValue),
                        height: Math.max(innerHeight - yScale(d.secondaryValue), 0),
                      }}
                      transition={{
                        duration: 0.5,
                        ease: [0.25, 1, 0.5, 1],
                        delay: i * 0.02 + 0.05,
                      }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => handleBarEnter(i, e)}
                      onMouseMove={handleBarMove}
                      onMouseLeave={handleBarLeave}
                    />
                  )}
                </g>
              );
            })}

          {/* Line area fill */}
          {showLine && (
            <motion.path
              d={areaPath}
              fill={primaryColor}
              fillOpacity={0.1}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              pointerEvents="none"
            />
          )}

          {/* Line path */}
          {showLine && (
            <motion.path
              d={linePath}
              fill="none"
              stroke={primaryColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
              pointerEvents="none"
            />
          )}

          {/* Secondary line */}
          {secondaryLinePath && (
            <motion.path
              d={secondaryLinePath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 4"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
              pointerEvents="none"
            />
          )}

          {/* Line points */}
          {showLine &&
            data.map((d, i) => {
              const x = margin.left + xScale(i);
              const y = margin.top + yScale(d.value);
              const isHovered = hoveredIndex === i;

              return (
                <g key={`point-${i}`} style={{ cursor: "pointer" }}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="var(--bg-surface)"
                    stroke={primaryColor}
                    strokeWidth={2}
                    onMouseEnter={(e) => handleBarEnter(i, e)}
                    onMouseMove={handleBarMove}
                    onMouseLeave={handleBarLeave}
                  />
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={10}
                      fill={primaryColor}
                      fillOpacity={0.15}
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}

          {/* Secondary line points */}
          {showDual &&
            data.map((d, i) => {
              if (d.secondaryValue == null) return null;
              const x = margin.left + xScale(i);
              const y = margin.top + yScale(d.secondaryValue);
              const isHovered = hoveredIndex === i;

              return (
                <g key={`spoint-${i}`} style={{ cursor: "pointer" }}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="var(--bg-surface)"
                    stroke={secondaryColor}
                    strokeWidth={2}
                    onMouseEnter={(e) => handleBarEnter(i, e)}
                    onMouseMove={handleBarMove}
                    onMouseLeave={handleBarLeave}
                  />
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
                top: tooltipPos.y - 48,
                background: "var(--bg-surface)",
              }}
            >
              <div className="text-xs font-medium text-foreground-primary whitespace-nowrap">
                {data[hoveredIndex].label}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: primaryColor }} />
                <span className="text-xs text-foreground-secondary">
                  {primaryLabel}: {formatValue(data[hoveredIndex].value)}
                </span>
              </div>
              {showDual && data[hoveredIndex].secondaryValue != null && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: secondaryColor }} />
                  <span className="text-xs text-foreground-secondary">
                    {secondaryLabel}: {formatValue(data[hoveredIndex].secondaryValue!)}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: primaryColor }} />
            <span className="text-xs text-foreground-secondary">{primaryLabel}</span>
          </div>
          {(showDual || (type === "line" && secondaryLinePath)) && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: secondaryColor }} />
              <span className="text-xs text-foreground-secondary">{secondaryLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default UsageChart;
