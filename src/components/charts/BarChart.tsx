"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarDataPoint[];
  width?: number;
  height?: number;
  className?: string;
  barRadius?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  animate?: boolean;
  title?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  Default colour palette (drawn from project CSS variables)          */
/* ------------------------------------------------------------------ */

const DEFAULT_COLORS = [
  "var(--accent-primary)",
  "var(--accent-secondary)",
  "var(--accent-tertiary)",
  "var(--success)",
  "var(--info)",
  "var(--warning)",
  "var(--danger)",
];

/* ------------------------------------------------------------------ */
/*  Tooltip component                                                  */
/* ------------------------------------------------------------------ */

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  color: string;
}

function ChartTooltip({ state }: { state: TooltipState }) {
  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "pointer-events-none absolute z-[var(--z-tooltip)] rounded-md px-3 py-2 shadow-md",
            "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs"
          )}
          style={{
            left: state.x,
            top: state.y,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: state.color }}
            />
            <span className="font-medium text-[var(--text-secondary)]">
              {state.label}
            </span>
          </div>
          <div className="mt-0.5 pl-5 font-semibold text-[var(--text-primary)]">
            {typeof state.value === "number" && state.value % 1 !== 0
              ? state.value.toFixed(2)
              : state.value}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  BarChart component                                                  */
/* ------------------------------------------------------------------ */

export const BarChart = React.memo(function BarChart({
  data,
  width = 600,
  height = 320,
  className,
  barRadius = 4,
  showGrid = true,
  showLabels = true,
  showValues = false,
  animate = true,
  title,
  description,
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    value: 0,
    color: "",
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  /* Layout maths */
  const margin = useMemo(
    () => ({ top: 24, right: 24, bottom: 48, left: 56 }),
    []
  );

  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = Math.max(0, height - margin.top - margin.bottom);

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 0),
    [data]
  );
  const yMax = maxValue === 0 ? 1 : maxValue * 1.12; // head-room

  const barSlotW = data.length > 0 ? innerW / data.length : 0;
  const barPad = barSlotW * 0.25;
  const barW = Math.max(4, barSlotW - barPad);

  /* Scale helpers */
  const yScale = useCallback(
    (v: number) => innerH - (v / yMax) * innerH,
    [innerH, yMax]
  );

  const xScale = useCallback(
    (i: number) => i * barSlotW + barPad / 2,
    [barSlotW, barPad]
  );

  /* Grid lines */
  const gridTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => (yMax / count) * i);
  }, [yMax]);

  /* Format helpers */
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

  /* Tooltip handler */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, d: BarDataPoint, i: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTooltip({
        visible: true,
        x,
        y,
        label: d.label,
        value: d.value,
        color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      });
      setHoveredIdx(i);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
    setHoveredIdx(null);
  }, []);

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
      <div className="relative">
        <ChartTooltip state={tooltip} />

        <svg
          ref={svgRef}
          role="img"
          aria-label={title || "Bar chart"}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full overflow-visible"
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
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
                    {/* Y-axis labels */}
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

            {/* Bars */}
            {data.map((d, i) => {
              const x = xScale(i);
              const barH = innerH - yScale(d.value);
              const y = yScale(d.value);
              const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              const isHovered = hoveredIdx === i;

              return (
                <g key={`bar-${i}`}>
                  {/* Invisible wider hit-area */}
                  <rect
                    x={x - barPad / 4}
                    y={0}
                    width={barW + barPad / 2}
                    height={innerH}
                    fill="transparent"
                    onMouseMove={(e) => handleMouseMove(e, d, i)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: "pointer" }}
                  />

                  {/* Animated bar */}
                  <motion.rect
                    x={x}
                    y={animate ? innerH : y}
                    width={barW}
                    height={animate ? 0 : barH}
                    rx={barRadius}
                    ry={barRadius}
                    fill={color}
                    opacity={isHovered ? 1 : 0.85}
                    animate={
                      animate
                        ? { y, height: barH, opacity: isHovered ? 1 : 0.85 }
                        : undefined
                    }
                    transition={{
                      duration: 0.6,
                      delay: i * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onMouseMove={(e: any) => handleMouseMove(e, d, i)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: "pointer", transition: "opacity 150ms" }}
                  />

                  {/* Hover glow */}
                  {isHovered && (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      x={x - 2}
                      y={y - 2}
                      width={barW + 4}
                      height={barH + 4}
                      rx={barRadius + 2}
                      ry={barRadius + 2}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      style={{ pointerEvents: "none" }}
                    />
                  )}

                  {/* Value labels */}
                  {showValues && (
                    <motion.text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-[var(--text-secondary)]"
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        pointerEvents: "none",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                    >
                      {typeof d.value === "number" && d.value % 1 !== 0
                        ? d.value.toFixed(1)
                        : d.value}
                    </motion.text>
                  )}

                  {/* X-axis labels */}
                  {showLabels && (
                    <text
                      x={x + barW / 2}
                      y={innerH + 18}
                      textAnchor="middle"
                      className="fill-[var(--text-tertiary)]"
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {d.label.length > 10
                        ? `${d.label.slice(0, 10)}...`
                        : d.label}
                    </text>
                  )}
                </g>
              );
            })}

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
    </div>
  );
});
