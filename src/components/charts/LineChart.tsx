"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LineDataPoint {
  label: string;
  value: number;
}

export interface LineSeries {
  name: string;
  data: LineDataPoint[];
  color?: string;
}

export interface LineChartProps {
  series: LineSeries[];
  width?: number;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  title?: string;
  description?: string;
  curved?: boolean;
  areaFill?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const SERIES_COLORS = [
  "var(--accent-primary)",
  "var(--accent-secondary)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--accent-tertiary)",
  "var(--info)",
];

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  items: { name: string; value: number; color: string }[];
  label: string;
}

function LineTooltip({ state }: { state: TooltipState }) {
  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "pointer-events-none absolute z-[var(--z-tooltip)] min-w-[120px] rounded-md px-3 py-2 shadow-md",
            "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs"
          )}
          style={{
            left: state.x,
            top: state.y,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="mb-1 font-medium text-[var(--text-secondary)]">
            {state.label}
          </div>
          {state.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[var(--text-tertiary)]">{item.name}</span>
              </div>
              <span className="font-semibold text-[var(--text-primary)]">
                {typeof item.value === "number" && item.value % 1 !== 0
                  ? item.value.toFixed(2)
                  : item.value}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  LineChart                                                          */
/* ------------------------------------------------------------------ */

export const LineChart = React.memo(function LineChart({
  series,
  width = 600,
  height = 320,
  className,
  showGrid = true,
  showLabels = true,
  showLegend = true,
  animate = true,
  title,
  description,
  curved = true,
  areaFill = false,
}: LineChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
    label: "",
  });

  const [hoveredX, setHoveredX] = useState<number | null>(null);

  /* Flatten all data points to find ranges */
  const allValues = useMemo(
    () => series.flatMap((s) => s.data.map((d) => d.value)),
    [series]
  );
  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => labels.add(d.label)));
    return Array.from(labels);
  }, [series]);

  const margin = useMemo(
    () => ({ top: 24, right: 24, bottom: 48, left: 56 }),
    []
  );

  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = Math.max(0, height - margin.top - margin.bottom);

  const maxValue = Math.max(...allValues, 0);
  const yMax = maxValue === 0 ? 1 : maxValue * 1.12;

  const xStep = allLabels.length > 1 ? innerW / (allLabels.length - 1) : innerW;

  /* Scale helpers */
  const xScale = useCallback(
    (i: number) => (allLabels.length > 1 ? i * xStep : innerW / 2),
    [allLabels.length, xStep, innerW]
  );

  const yScale = useCallback(
    (v: number) => innerH - (v / yMax) * innerH,
    [innerH, yMax]
  );

  /* Grid */
  const gridTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => (yMax / count) * i);
  }, [yMax]);

  /* Path generators */
  const buildPath = useCallback(
    (data: LineDataPoint[]) => {
      if (data.length === 0) return "";

      const points = data.map((d, i) => {
        const labelIdx = allLabels.indexOf(d.label);
        return {
          x: xScale(labelIdx >= 0 ? labelIdx : i),
          y: yScale(d.value),
        };
      });

      if (points.length === 0) return "";

      if (!curved || points.length < 3) {
        return points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
      }

      // Catmull-Rom spline -> cubic bezier
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return path;
    },
    [allLabels, xScale, yScale, curved]
  );

  const buildAreaPath = useCallback(
    (data: LineDataPoint[]) => {
      const linePath = buildPath(data);
      if (!linePath) return "";

      const lastIdx = data.length - 1;
      const lastLabelIdx = allLabels.indexOf(data[lastIdx].label);
      const endX = xScale(lastLabelIdx >= 0 ? lastLabelIdx : lastIdx);

      const firstLabelIdx = allLabels.indexOf(data[0].label);
      const startX = xScale(firstLabelIdx >= 0 ? firstLabelIdx : 0);

      return `${linePath} L ${endX} ${innerH} L ${startX} ${innerH} Z`;
    },
    [buildPath, allLabels, xScale, innerH]
  );

  /* Tooltip interaction */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left - margin.left;
      const closestIdx = Math.max(
        0,
        Math.min(allLabels.length - 1, Math.round(mouseX / xStep))
      );

      const label = allLabels[closestIdx];
      const items = series
        .map((s, si) => {
          const pt = s.data.find((d) => d.label === label);
          return pt
            ? {
                name: s.name,
                value: pt.value,
                color: s.color || SERIES_COLORS[si % SERIES_COLORS.length],
              }
            : null;
        })
        .filter(Boolean) as TooltipState["items"];

      if (items.length > 0) {
        setTooltip({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          items,
          label,
        });
        setHoveredX(closestIdx);
      }
    },
    [margin.left, allLabels, xStep, series]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
    setHoveredX(null);
  }, []);

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full", className)}
      style={{ maxWidth: width }}
    >
      {/* Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      <div
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <LineTooltip state={tooltip} />

        <svg
          role="img"
          aria-label={title || "Line chart"}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full overflow-visible"
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid */}
            {showGrid &&
              gridTicks.map((tick, i) => {
                const y = yScale(tick);
                return (
                  <g key={`grid-${i}`}>
                    <line
                      x1={0}
                      x2={innerW}
                      y1={y}
                      y2={y}
                      stroke="var(--border-subtle)"
                      strokeWidth={1}
                      strokeDasharray={i === 0 ? "none" : "3,3"}
                      opacity={0.6}
                    />
                    <text
                      x={-10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[var(--text-tertiary)]"
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {fmt(tick)}
                    </text>
                  </g>
                );
              })}

            {/* Crosshair */}
            {hoveredX !== null && (
              <motion.line
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x1={xScale(hoveredX)}
                x2={xScale(hoveredX)}
                y1={0}
                y2={innerH}
                stroke="var(--border-default)"
                strokeWidth={1}
                strokeDasharray="4,4"
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Area fills (behind lines) */}
            {areaFill &&
              series.map((s, si) => {
                const color = s.color || SERIES_COLORS[si % SERIES_COLORS.length];
                const areaPath = buildAreaPath(s.data);
                if (!areaPath) return null;

                return (
                  <motion.path
                    key={`area-${si}`}
                    d={areaPath}
                    fill={color}
                    opacity={0.08}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.08 }}
                    transition={{ duration: 0.8, delay: si * 0.1 }}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}

            {/* Lines */}
            {series.map((s, si) => {
              const color = s.color || SERIES_COLORS[si % SERIES_COLORS.length];
              const pathD = buildPath(s.data);
              if (!pathD) return null;

              return (
                <motion.path
                  key={`line-${si}`}
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    pathLength: { duration: 1, delay: si * 0.15, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.3, delay: si * 0.15 },
                  }}
                  style={{ pointerEvents: "none" }}
                />
              );
            })}

            {/* Data points */}
            {series.map((s, si) => {
              const color = s.color || SERIES_COLORS[si % SERIES_COLORS.length];
              return s.data.map((d, di) => {
                const labelIdx = allLabels.indexOf(d.label);
                const cx = xScale(labelIdx >= 0 ? labelIdx : di);
                const cy = yScale(d.value);
                const isActive = hoveredX !== null && labelIdx === hoveredX;

                return (
                  <motion.circle
                    key={`pt-${si}-${di}`}
                    cx={cx}
                    cy={cy}
                    r={isActive ? 5 : 3.5}
                    fill={isActive ? color : "var(--bg-surface)"}
                    stroke={color}
                    strokeWidth={2}
                    initial={animate ? { scale: 0, opacity: 0 } : undefined}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.6 + di * 0.04 + si * 0.05,
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      pointerEvents: "none",
                      transition: "r 150ms, fill 150ms",
                    }}
                  />
                );
              });
            })}

            {/* X-axis labels */}
            {showLabels &&
              allLabels.map((label, i) => (
                <text
                  key={`xlab-${i}`}
                  x={xScale(i)}
                  y={innerH + 18}
                  textAnchor="middle"
                  className="fill-[var(--text-tertiary)]"
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {label.length > 10 ? `${label.slice(0, 10)}...` : label}
                </text>
              ))}

            {/* Axes */}
            <line
              x1={0}
              x2={innerW}
              y1={innerH}
              y2={innerH}
              stroke="var(--border-default)"
              strokeWidth={1}
            />
            <line
              x1={0}
              x2={0}
              y1={0}
              y2={innerH}
              stroke="var(--border-default)"
              strokeWidth={1}
            />
          </g>
        </svg>
      </div>

      {/* Legend */}
      {showLegend && series.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
          {series.map((s, i) => {
            const color = s.color || SERIES_COLORS[i % SERIES_COLORS.length];
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-[var(--text-tertiary)]">{s.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
