"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

// ── types ───────────────────────────────────────────────────────────────────

export interface ModelBreakdownItem {
  modelId: string;
  totalCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCredits: number;
  avgLatencyMs: number;
  color: string;
}

interface ModelBreakdownProps {
  data: ModelBreakdownItem[];
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showLegend?: boolean;
  className?: string;
  innerRadius?: number;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
    `Z`,
  ].join(" ");
}

// ── component ───────────────────────────────────────────────────────────────

export const ModelBreakdown = React.memo(function ModelBreakdown({
  data,
  title,
  subtitle,
  maxItems = 8,
  showLegend = true,
  className,
  innerRadius = 0.55,
}: ModelBreakdownProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = outerR * innerRadius;
  const textPrimary = "var(--text-primary)";
  const textSecondary = "var(--text-secondary)";
  const textTertiary = "var(--text-tertiary)";

  const processed = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.totalCredits - a.totalCredits).slice(0, maxItems);
    const total = sorted.reduce((s, d) => s + d.totalCredits, 0);
    let currentAngle = 0;

    return sorted.map((item) => {
      const angle = (item.totalCredits / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      return { ...item, startAngle, endAngle, pct: Number(((item.totalCredits / total) * 100).toFixed(1)) };
    });
  }, [data, maxItems]);

  const totalCredits = useMemo(() => processed.reduce((s, d) => s + d.totalCredits, 0), [processed]);
  const totalCalls = useMemo(() => processed.reduce((s, d) => s + d.totalCalls, 0), [processed]);

  const hoveredItem = hoveredIndex !== null ? processed[hoveredIndex] : null;

  const handleSegmentEnter = (i: number, e: React.MouseEvent) => {
    setHoveredIndex(i);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleSegmentMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleSegmentLeave = () => {
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

      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="relative flex-shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
            {/* Background ring */}
            <circle
              cx={cx}
              cy={cy}
              r={outerR}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth={outerR - innerR}
              opacity={0.5}
            />

            {/* Segments */}
            {processed.map((item, i) => {
              const isHovered = hoveredIndex === i;
              const d = describeDonutSegment(cx, cy, outerR, innerR, item.startAngle, item.endAngle);

              return (
                <motion.path
                  key={item.modelId}
                  d={d}
                  fill={item.color}
                  fillOpacity={isHovered ? 0.95 : 0.8}
                  stroke="var(--bg-surface)"
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isHovered ? 0.95 : 0.8,
                    scale: isHovered ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  onMouseEnter={(e) => handleSegmentEnter(i, e)}
                  onMouseMove={handleSegmentMove}
                  onMouseLeave={handleSegmentLeave}
                />
              );
            })}

            {/* Center text */}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={18}
              fontWeight={600}
              fill={textPrimary}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {hoveredItem ? hoveredItem.pct : "100"}%
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill={textTertiary}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {hoveredItem ? `${hoveredItem.totalCredits.toFixed(1)} credits` : `${totalCredits.toFixed(1)} total`}
            </text>
          </svg>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 w-full min-w-0">
            <div className="space-y-2">
              {processed.map((item, i) => {
                const isHovered = hoveredIndex === i;
                return (
                  <motion.div
                    key={item.modelId}
                    className={cn(
                      "flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors cursor-pointer",
                      isHovered && "bg-[var(--bg-hover)]"
                    )}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground-primary truncate">
                          {item.modelId}
                        </span>
                        <span className="text-xs text-foreground-tertiary tabular-nums flex-shrink-0">
                          {item.pct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] text-foreground-tertiary">
                          {item.totalCalls.toLocaleString()} calls
                        </span>
                        <span className="text-[11px] text-foreground-tertiary tabular-nums">
                          {item.totalCredits.toFixed(1)} cr
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-6">
        <div>
          <span className="text-[11px] text-foreground-tertiary block">Models Used</span>
          <span className="text-sm font-semibold text-foreground-primary tabular-nums">
            {processed.length}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-foreground-tertiary block">Total Calls</span>
          <span className="text-sm font-semibold text-foreground-primary tabular-nums">
            {totalCalls.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-foreground-tertiary block">Credits</span>
          <span className="text-sm font-semibold text-foreground-primary tabular-nums">
            {totalCredits.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredItem && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-md border border-border-subtle"
            style={{
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 60,
              background: "var(--bg-surface)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: hoveredItem.color }}
              />
              <span className="text-xs font-semibold text-foreground-primary">
                {hoveredItem.modelId}
              </span>
            </div>
            <div className="text-[11px] text-foreground-secondary space-y-0.5">
              <div>{hoveredItem.totalCalls.toLocaleString()} calls ({hoveredItem.pct}%)</div>
              <div>{hoveredItem.totalCredits.toFixed(1)} credits spent</div>
              <div>Avg latency: {hoveredItem.avgLatencyMs}ms</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ModelBreakdown;
