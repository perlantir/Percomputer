"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieDataPoint[];
  width?: number;
  height?: number;
  className?: string;
  donut?: boolean;
  donutThickness?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  animate?: boolean;
  title?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const PIE_COLORS = [
  "var(--accent-primary)",
  "var(--accent-secondary)",
  "var(--accent-tertiary)",
  "var(--success)",
  "var(--info)",
  "var(--warning)",
  "var(--danger)",
  "#A78BFA",
  "#F472B6",
];

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  percent: string;
  color: string;
}

function PieTooltip({ state }: { state: TooltipState }) {
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
            transform: "translate(-50%, -120%)",
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
          <div className="mt-0.5 flex items-baseline gap-1.5 pl-5">
            <span className="font-semibold text-[var(--text-primary)]">
              {state.value}
            </span>
            <span className="text-[var(--text-tertiary)]">({state.percent})</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  PieChart                                                           */
/* ------------------------------------------------------------------ */

export function PieChart({
  data,
  width = 320,
  height = 320,
  className,
  donut = false,
  donutThickness = 0.55,
  showLegend = true,
  showLabels = false,
  showValues = false,
  animate = true,
  title,
  description,
}: PieChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    value: 0,
    percent: "",
    color: "",
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  /* Geometry */
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 32;
  const innerRadius = donut ? radius * donutThickness : 0;

  /* Build arc segments */
  const segments = useMemo(() => {
    let startAngle = -Math.PI / 2; // Start from top
    return data.map((d, i) => {
      const sweep = total > 0 ? (d.value / total) * Math.PI * 2 : 0;
      const endAngle = startAngle + sweep;
      const midAngle = startAngle + sweep / 2;

      const largeArcFlag = sweep > Math.PI ? 1 : 0;

      const color = d.color || PIE_COLORS[i % PIE_COLORS.length];

      // Outer arc points
      const x1o = cx + radius * Math.cos(startAngle);
      const y1o = cy + radius * Math.sin(startAngle);
      const x2o = cx + radius * Math.cos(endAngle);
      const y2o = cy + radius * Math.sin(endAngle);

      // Inner arc points (for donut)
      const x1i = cx + innerRadius * Math.cos(endAngle);
      const y1i = cy + innerRadius * Math.sin(endAngle);
      const x2i = cx + innerRadius * Math.cos(startAngle);
      const y2i = cy + innerRadius * Math.sin(startAngle);

      let path: string;
      if (donut) {
        path = [
          `M ${x1o} ${y1o}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2o} ${y2o}`,
          `L ${x1i} ${y1i}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2i} ${y2i}`,
          "Z",
        ].join(" ");
      } else {
        const xTip = cx + radius * Math.cos(endAngle);
        const yTip = cy + radius * Math.sin(endAngle);
        path = [
          `M ${cx} ${cy}`,
          `L ${x1o} ${y1o}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${xTip} ${yTip}`,
          "Z",
        ].join(" ");
      }

      // Label position
      const labelR = radius * 0.7;
      const labelX = cx + labelR * Math.cos(midAngle);
      const labelY = cy + labelR * Math.sin(midAngle);

      // Explode offset for hover
      const explodeDist = 6;
      const explodeX = Math.cos(midAngle) * explodeDist;
      const explodeY = Math.sin(midAngle) * explodeDist;

      const segment = { startAngle, endAngle, midAngle, sweep, path, color, labelX, labelY, explodeX, explodeY };
      startAngle = endAngle;
      return segment;
    });
  }, [data, total, cx, cy, radius, innerRadius, donut]);

  /* Interaction */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, d: PieDataPoint, i: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: d.label,
        value: d.value,
        percent: total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : "0%",
        color: d.color || PIE_COLORS[i % PIE_COLORS.length],
      });
      setHoveredIdx(i);
    },
    [total]
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
      <div className="relative flex items-center justify-center">
        <PieTooltip state={tooltip} />

        <svg
          role="img"
          aria-label={title || "Pie chart"}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full overflow-visible"
        >
          {segments.map((seg, i) => {
            const d = data[i];
            const isHovered = hoveredIdx === i;

            return (
              <g key={`seg-${i}`}>
                {/* Segment path */}
                <motion.path
                  d={seg.path}
                  fill={seg.color}
                  stroke="var(--bg-surface)"
                  strokeWidth={2}
                  opacity={hoveredIdx !== null && !isHovered ? 0.55 : 0.9}
                  initial={animate ? { scale: 0, opacity: 0 } : undefined}
                  animate={{
                    scale: 1,
                    opacity: hoveredIdx !== null && !isHovered ? 0.55 : 0.9,
                    translateX: isHovered ? seg.explodeX : 0,
                    translateY: isHovered ? seg.explodeY : 0,
                  }}
                  transition={{
                    scale: { duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.3 },
                    translateX: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                    translateY: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                  }}
                  onMouseMove={(e: any) => handleMouseMove(e, d, i)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: "pointer" }}
                />

                {/* Labels inside slices */}
                {showLabels && seg.sweep > 0.15 && (
                  <motion.text
                    x={seg.labelX}
                    y={seg.labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-white"
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      pointerEvents: "none",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    {showValues
                      ? `${d.value}`
                      : `${((d.value / total) * 100).toFixed(0)}%`}
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* Donut center */}
          {donut && (
            <motion.text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[var(--text-primary)]"
              style={{
                fontSize: "18px",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                pointerEvents: "none",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
            </motion.text>
          )}
          {donut && (
            <motion.text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[var(--text-tertiary)]"
              style={{
                fontSize: "9px",
                fontFamily: "var(--font-body)",
                pointerEvents: "none",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Total
            </motion.text>
          )}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          {data.map((d, i) => {
            const color = d.color || PIE_COLORS[i % PIE_COLORS.length];
            const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
            return (
              <motion.div
                key={i}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.3 }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-[var(--text-tertiary)]">
                  {d.label}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {percent}%
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
