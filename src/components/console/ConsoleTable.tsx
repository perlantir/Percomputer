"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Inbox } from "lucide-react";
import { cn } from "@/src/lib/utils";

export type Density = "compact" | "cozy" | "comfortable";
export type ColumnAlign = "left" | "right" | "center";

export interface ConsoleColumn<T> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  align?: ColumnAlign;
  sortable?: boolean;
  visible?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

interface ConsoleTableProps<T> {
  columns: ConsoleColumn<T>[];
  data: T[];
  density?: Density;
  rowHeight?: number;
  maxHeight?: number;
  onRowClick?: (row: T, index: number) => void;
  selectedRowId?: string | number;
  rowIdKey?: keyof T;
  emptyText?: string;
  className?: string;
  stickyHeader?: boolean;
}

const densityHeights: Record<Density, number> = {
  compact: 28,
  cozy: 36,
  comfortable: 44,
};

const densityPadding: Record<Density, string> = {
  compact: "px-2 py-0.5",
  cozy: "px-2.5 py-1.5",
  comfortable: "px-3 py-2.5",
};

const densityText: Record<Density, string> = {
  compact: "text-[11px] leading-3",
  cozy: "text-xs leading-4",
  comfortable: "text-sm leading-5",
};

const densityHeaderText: Record<Density, string> = {
  compact: "text-[10px] leading-3 font-semibold tracking-wide uppercase",
  cozy: "text-[11px] leading-3 font-semibold tracking-wide uppercase",
  comfortable: "text-xs leading-4 font-semibold tracking-wide uppercase",
};

export function ConsoleTable<T extends Record<string, any>>({
  columns: initialColumns,
  data,
  density: initialDensity = "compact",
  maxHeight = 600,
  onRowClick,
  selectedRowId,
  rowIdKey = "id" as keyof T,
  emptyText = "No data",
  className,
  stickyHeader = true,
}: ConsoleTableProps<T>) {
  const [density, setDensity] = useState<Density>(initialDensity);
  const [columns, setColumns] = useState<ConsoleColumn<T>[]>(
    initialColumns.map((c) => ({ ...c, visible: c.visible !== false }))
  );
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [resizing, setResizing] = useState<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible !== false),
    [columns]
  );

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortable) return data;
    const sorted = [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortKey, sortDir, columns]);

  const handleSort = useCallback(
    (key: string) => {
      const col = columns.find((c) => c.key === key);
      if (!col?.sortable) return;
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, columns]
  );

  const handleResizeStart = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const col = visibleColumns[index];
      setResizing({
        index,
        startX: e.clientX,
        startWidth: col.width || 120,
      });
    },
    [visibleColumns]
  );

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(
        visibleColumns[resizing.index].minWidth || 60,
        resizing.startWidth + delta
      );
      setColumns((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex(
          (c) => c.key === visibleColumns[resizing.index].key
        );
        if (idx >= 0) updated[idx] = { ...updated[idx], width: newWidth };
        return updated;
      });
    };
    const handleUp = () => setResizing(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizing, visibleColumns]);

  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  }, []);

  const rowHeight = densityHeights[density];
  const padding = densityPadding[density];
  const textClass = densityText[density];
  const headerTextClass = densityHeaderText[density];

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = sortedData[index];
      const id = row[rowIdKey];
      const isSelected = selectedRowId !== undefined && String(selectedRowId) === String(id);
      return (
        <div
          style={{
            ...style,
            display: "flex",
            alignItems: "center",
          }}
          className={cn(
            "w-full border-b border-[var(--border-subtle)] transition-all duration-200 ease-out",
            onRowClick && "cursor-pointer",
            isSelected
              ? "bg-[var(--accent-primary)]/10"
              : "hover:bg-[var(--bg-hover)] hover:shadow-sm hover:translate-x-[1px]"
          )}
          onClick={() => onRowClick?.(row, index)}
        >
          {visibleColumns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap",
                padding,
                textClass,
                col.align === "right" && "text-right font-mono",
                col.align === "center" && "text-center"
              )}
              style={{ width: col.width || 120 }}
            >
              {col.render
                ? col.render(row, index)
                : row[col.key] != null
                ? String(row[col.key])
                : "—"}
            </div>
          ))}
        </div>
      );
    },
    [sortedData, visibleColumns, onRowClick, selectedRowId, rowIdKey, padding, textClass]
  );

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {data.length.toLocaleString()} rows
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Density toggle */}
          <div className="flex items-center bg-[var(--bg-canvas)] rounded-md border border-[var(--border-subtle)]">
            {(["compact", "cozy", "comfortable"] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors",
                  density === d
                    ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                {d[0].toUpperCase()}
              </button>
            ))}
          </div>
          {/* Column visibility */}
          <div className="relative group">
            <button className="px-2 py-0.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)]">
              Columns
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-md p-1 min-w-[140px]">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] hover:bg-[var(--bg-hover)] rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={col.visible !== false}
                    onChange={() => toggleColumn(col.key)}
                    className="w-3 h-3 accent-[var(--accent-primary)]"
                  />
                  <span className="text-[var(--text-secondary)]">{col.header}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div
        ref={headerRef}
        className={cn(
          "flex items-center border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]",
          stickyHeader && "sticky top-0 z-10"
        )}
        style={{ height: rowHeight }}
      >
        {visibleColumns.map((col, i) => (
          <div
            key={col.key}
            className={cn(
              "flex-shrink-0 relative select-none group",
              padding,
              headerTextClass,
              "text-[var(--text-tertiary)]",
              col.align === "right" && "text-right",
              col.align === "center" && "text-center",
              col.sortable && "cursor-pointer hover:text-[var(--text-secondary)]",
              sortKey === col.key && "text-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            )}
            style={{ width: col.width || 120 }}
            onClick={() => handleSort(col.key)}
          >
            <div className="flex items-center gap-1">
              <span className="truncate">{col.header}</span>
              {col.sortable && (
                <motion.span
                  className={cn(
                    "text-[var(--accent-primary)] inline-flex",
                    sortKey !== col.key && "opacity-0 group-hover:opacity-40"
                  )}
                  animate={{
                    rotate: sortKey === col.key ? (sortDir === "asc" ? 0 : 180) : 0,
                    scale: sortKey === col.key ? 1 : 0.8,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ArrowUpDown size={12} />
                </motion.span>
              )}
            </div>
            {/* Resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent-primary)]/30"
              onMouseDown={(e) => handleResizeStart(i, e)}
            />
          </div>
        ))}
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {data.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            >
              <Inbox size={32} className="mb-3 text-[var(--text-tertiary)]/50" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-medium"
            >
              {emptyText}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key={`table-${sortKey}-${sortDir}-${data.length}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <VirtualTable
              data={sortedData}
              rowHeight={rowHeight}
              maxHeight={maxHeight}
              renderRow={Row}
              overscan={5}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Simple virtualized table using native scroll */
function VirtualTable<T>({
  data,
  rowHeight,
  maxHeight,
  renderRow,
  overscan = 5,
}: {
  data: T[];
  rowHeight: number;
  maxHeight: number;
  renderRow: (props: { index: number; style: React.CSSProperties }) => React.ReactElement;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = data.length * rowHeight;
  const visibleHeight = Math.min(maxHeight, totalHeight);

  const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIdx = Math.min(
    data.length - 1,
    Math.ceil((scrollTop + visibleHeight) / rowHeight) + overscan
  );

  const visibleRows = [];
  for (let i = startIdx; i <= endIdx; i++) {
    visibleRows.push(
      <div key={i} style={{ position: "absolute", top: i * rowHeight, left: 0, right: 0, height: rowHeight }}>
        {renderRow({ index: i, style: {} })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ maxHeight, overflow: "auto", position: "relative" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleRows}
      </div>
    </div>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const statusStyles: Record<string, string> = {
    success: "bg-success/15 text-success border-success/25",
    completed: "bg-success/15 text-success border-success/25",
    running: "bg-info/15 text-info border-info/25",
    pending: "bg-warning/15 text-warning border-warning/25",
    failed: "bg-danger/15 text-danger border-danger/25",
    error: "bg-danger/15 text-danger border-danger/25",
    cancelled: "bg-[var(--text-tertiary)]/15 text-[var(--text-tertiary)] border-[var(--text-tertiary)]/25",
    open: "bg-danger/15 text-danger border-danger/25",
    closed: "bg-success/15 text-success border-success/25",
    "half-open": "bg-warning/15 text-warning border-warning/25",
    healthy: "bg-success/15 text-success border-success/25",
    warning: "bg-warning/15 text-warning border-warning/25",
    critical: "bg-danger/15 text-danger border-danger/25",
    drained: "bg-[var(--text-tertiary)]/15 text-[var(--text-tertiary)] border-[var(--text-tertiary)]/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium",
        "px-2 py-0 text-[10px] leading-4 h-4",
        statusStyles[status] || statusStyles.pending,
        className
      )}
    >
      {status}
    </span>
  );
}

export function MiniSparkline({
  data,
  width = 60,
  height = 20,
  color = "var(--accent-primary)",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r={2}
        fill={color}
      />
    </svg>
  );
}
