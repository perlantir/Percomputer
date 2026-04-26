"use client";

import * as React from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  X,
  Inbox,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./table";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

export type Density = "compact" | "cozy" | "comfortable";
export type ColumnAlign = "left" | "right" | "center";
export type SortDir = "asc" | "desc";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: ColumnAlign;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface UseDataTableOptions<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  initialSort?: { key: string; dir: SortDir } | null;
  globalFilter?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  enableRowSelection?: boolean;
  rowIdKey?: keyof T;
}

export interface UseDataTableReturn<T> {
  sortedData: T[];
  paginatedData: T[];
  columns: DataTableColumn<T>[];
  setColumns: React.Dispatch<React.SetStateAction<DataTableColumn<T>[]>>;
  sort: { key: string; dir: SortDir } | null;
  toggleSort: (key: string) => void;
  globalFilter: string;
  setGlobalFilter: (v: string) => void;
  columnFilters: Record<string, string>;
  setColumnFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalPages: number;
  totalItems: number;
  selectedRows: Set<string>;
  toggleRowSelection: (id: string) => void;
  toggleAllSelection: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  density: Density;
  setDensity: (d: Density) => void;
  rowIdKey: keyof T;
  enableRowSelection: boolean;
}

/* ──────────────────────────────────────────────
   useDataTable hook
   ────────────────────────────────────────────── */

export function useDataTable<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  initialSort = null,
  globalFilter: initialFilter = "",
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  enableRowSelection = false,
  rowIdKey = "id" as keyof T,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  /* Column state */
  const [columns, setColumns] = useState<DataTableColumn<T>[]>(
    initialColumns.map((c) => ({ ...c, visible: c.visible !== false }))
  );

  /* Sorting state */
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(
    initialSort
  );

  /* Filtering state */
  const [globalFilter, setGlobalFilter] = useState(initialFilter);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  /* Pagination state */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  /* Row selection state */
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  /* Density state */
  const [density, setDensity] = useState<Density>("cozy");

  /* ── Sorting ── */
  const toggleSort = useCallback(
    (key: string) => {
      const col = columns.find((c) => c.key === key);
      if (!col?.sortable) return;
      setSort((prev) => {
        if (prev?.key === key) {
          return prev.dir === "asc" ? { key, dir: "desc" } : null;
        }
        return { key, dir: "asc" };
      });
      setPage(0);
    },
    [columns]
  );

  /* ── Column filter setter ── */
  const setColumnFilter = useCallback((key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setGlobalFilter("");
    setColumnFilters({});
    setSort(initialSort);
    setPage(0);
  }, [initialSort]);

  /* ── Row selection ── */
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size > 0) return new Set();
      const allIds = data.map((r) => String(r[rowIdKey]));
      return new Set(allIds);
    });
  }, [data, rowIdKey]);

  /* ── Filtered & sorted data ── */
  const processedData = useMemo(() => {
    let result = [...data];

    // Global filter
    if (globalFilter.trim()) {
      const term = globalFilter.toLowerCase();
      result = result.filter((row) => {
        return columns.some((col) => {
          if (col.visible === false) return false;
          const val = col.accessor
            ? col.accessor(row)
            : row[col.key];
          if (val == null) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // Column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (!filterValue.trim()) return;
      const col = columns.find((c) => c.key === key);
      if (!col || col.filterable === false) return;
      const term = filterValue.toLowerCase();
      result = result.filter((row) => {
        const val = col.accessor ? col.accessor(row) : row[key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(term);
      });
    });

    // Sorting
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        result.sort((a, b) => {
          const aVal = col.accessor ? col.accessor(a) : a[sort.key];
          const bVal = col.accessor ? col.accessor(b) : b[sort.key];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return sort.dir === "asc" ? 1 : -1;
          if (bVal == null) return sort.dir === "asc" ? -1 : 1;
          if (typeof aVal === "number" && typeof bVal === "number") {
            return sort.dir === "asc" ? aVal - bVal : bVal - aVal;
          }
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          if (aStr < bStr) return sort.dir === "asc" ? -1 : 1;
          if (aStr > bStr) return sort.dir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [data, globalFilter, columnFilters, sort, columns]);

  /* ── Pagination ── */
  const totalItems = processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);

  const paginatedData = useMemo(() => {
    const start = clampedPage * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, clampedPage, pageSize]);

  const isAllSelected =
    enableRowSelection &&
    paginatedData.length > 0 &&
    paginatedData.every((r) => selectedRows.has(String(r[rowIdKey])));
  const isSomeSelected =
    enableRowSelection &&
    !isAllSelected &&
    paginatedData.some((r) => selectedRows.has(String(r[rowIdKey])));

  return {
    sortedData: processedData,
    paginatedData,
    columns,
    setColumns,
    sort,
    toggleSort,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilter,
    clearFilters,
    page: clampedPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    selectedRows,
    toggleRowSelection,
    toggleAllSelection,
    isAllSelected,
    isSomeSelected,
    density,
    setDensity,
    rowIdKey,
    enableRowSelection: !!enableRowSelection,
  };
}

/* ──────────────────────────────────────────────
   Density config
   ────────────────────────────────────────────── */

const densityPadding: Record<Density, string> = {
  compact: "px-2 py-1",
  cozy: "px-3 py-2",
  comfortable: "px-4 py-3",
};

const densityText: Record<Density, string> = {
  compact: "text-[11px] leading-4",
  cozy: "text-xs leading-4",
  comfortable: "text-sm leading-5",
};

const densityHeaderText: Record<Density, string> = {
  compact:
    "text-[10px] leading-4 font-semibold tracking-wider uppercase",
  cozy: "text-[11px] leading-4 font-semibold tracking-wider uppercase",
  comfortable: "text-xs leading-4 font-semibold tracking-wider uppercase",
};

/* ──────────────────────────────────────────────
   DataTable Toolbar
   ────────────────────────────────────────────── */

interface DataTableToolbarProps<T> {
  table: UseDataTableReturn<T>;
  title?: string;
  children?: React.ReactNode;
  globalFilterPlaceholder?: string;
}

export function DataTableToolbar<T>({
  table,
  title,
  children,
  globalFilterPlaceholder = "Search all columns...",
}: DataTableToolbarProps<T>) {
  const {
    globalFilter,
    setGlobalFilter,
    columns,
    setColumns,
    density,
    setDensity,
    clearFilters,
    totalItems,
    selectedRows,
  } = table;

  const visibleColumns = columns.filter((c) => c.visible !== false);
  const hiddenCount = columns.length - visibleColumns.length;
  const hasActiveFilters =
    globalFilter.trim().length > 0 ||
    Object.values(table.columnFilters).some((v) => v.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]"
    >
      {/* Top row: title + controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
              {title}
            </h3>
          )}
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono bg-[var(--bg-surface-2)] px-1.5 py-0.5 rounded">
            {totalItems.toLocaleString()} rows
          </span>
          {selectedRows.size > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-[var(--accent-primary)] font-medium bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded"
            >
              {selectedRows.size} selected
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Density toggle */}
          <div className="flex items-center bg-[var(--bg-canvas)] rounded-md border border-[var(--border-subtle)] overflow-hidden">
            {(["compact", "cozy", "comfortable"] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium transition-all duration-fast ease-out",
                  density === d
                    ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
                )}
              >
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 px-2 text-[11px] gap-1",
                  hiddenCount > 0 && "border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                )}
              >
                <Settings2 className="h-3 w-3" />
                Columns
                {hiddenCount > 0 && (
                  <span className="ml-0.5 text-[9px] font-mono bg-[var(--accent-primary)]/10 px-1 rounded">
                    {hiddenCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={col.visible !== false}
                  onCheckedChange={() =>
                    setColumns((prev) =>
                      prev.map((c) =>
                        c.key === col.key ? { ...c, visible: !c.visible } : c
                      )
                    )
                  }
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom row: search + custom content */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              table.setPage(0);
            }}
            placeholder={globalFilterPlaceholder}
            className={cn(
              "w-full rounded-md border bg-[var(--bg-surface)] text-[var(--text-primary)]",
              "pl-8 pr-8 py-1.5 text-xs shadow-sm transition-all duration-fast ease-out",
              "border-[var(--border-default)] placeholder:text-[var(--text-tertiary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
            )}
          />
          {globalFilter && (
            <button
              onClick={() => {
                setGlobalFilter("");
                table.setPage(0);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}

        {children}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   DataTable Component
   ────────────────────────────────────────────── */

interface DataTableProps<T> {
  table: UseDataTableReturn<T>;
  emptyText?: string;
  className?: string;
  stickyHeader?: boolean;
  maxHeight?: number;
  onRowClick?: (row: T, index: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  table,
  emptyText = "No data found",
  className,
  stickyHeader = true,
  onRowClick,
}: DataTableProps<T>) {
  const {
    paginatedData,
    columns,
    setColumns,
    sort,
    toggleSort,
    columnFilters,
    setColumnFilter,
    density,
    enableRowSelection,
    toggleAllSelection,
    toggleRowSelection,
    selectedRows,
    isAllSelected,
    isSomeSelected,
  } = table;

  const visibleColumns = columns.filter((c) => c.visible !== false);
  const hasFilterableCols = columns.some((c) => c.filterable !== false);

  const headerPadding = densityHeaderText[density];
  const cellPadding = densityPadding[density];
  const cellText = densityText[density];

  /* Column resizing state */
  const [resizing, setResizing] = useState<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleResizeStart = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const col = visibleColumns[index];
      setResizing({
        index,
        startX: e.clientX,
        startWidth: col.width || 150,
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
        if (idx >= 0) {
          const maxW = updated[idx].maxWidth;
          updated[idx] = {
            ...updated[idx],
            width: maxW ? Math.min(newWidth, maxW) : newWidth,
          };
        }
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
  }, [resizing, visibleColumns, setColumns]);

  return (
    <div className={cn("flex flex-col", className)}>
      <AnimatePresence mode="wait">
        {paginatedData.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              <Inbox size={36} className="mb-3 text-[var(--text-tertiary)]/40" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium"
            >
              {emptyText}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs mt-1"
            >
              Try adjusting your filters
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-x-auto"
          >
            <Table>
              <TableHeader
                className={cn(
                  stickyHeader && "sticky top-0 z-10"
                )}
              >
                <TableRow className="border-b border-[var(--border-subtle)]">
                  {/* Checkbox column */}
                  {enableRowSelection && (
                    <TableHead
                      className={cn(
                        "w-10 text-center",
                        headerPadding,
                        cellText
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={toggleAllSelection}
                        className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                      />
                    </TableHead>
                  )}
                  {visibleColumns.map((col, i) => (
                    <TableHead
                      key={col.key}
                      className={cn(
                        "relative select-none",
                        headerPadding,
                        cellText,
                        "text-[var(--text-tertiary)]",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.sortable &&
                          "cursor-pointer hover:text-[var(--text-secondary)] transition-colors duration-fast",
                        sort?.key === col.key &&
                          "text-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                      )}
                      style={{ width: col.width || "auto" }}
                      onClick={() => toggleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="truncate">{col.header}</span>
                        {col.sortable && (
                          <motion.span
                            className={cn(
                              "inline-flex shrink-0",
                              sort?.key === col.key
                                ? "text-[var(--accent-primary)]"
                                : "text-[var(--text-tertiary)] opacity-0 group-hover:opacity-40"
                            )}
                            animate={{
                              rotate:
                                sort?.key === col.key
                                  ? sort.dir === "asc"
                                    ? 0
                                    : 180
                                  : 0,
                              scale: sort?.key === col.key ? 1 : 0.8,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            {sort?.key === col.key ? (
                              sort.dir === "asc" ? (
                                <ArrowUp size={12} />
                              ) : (
                                <ArrowDown size={12} />
                              )
                            ) : (
                              <ArrowUpDown size={12} />
                            )}
                          </motion.span>
                        )}
                      </div>
                      {/* Resize handle */}
                      <div
                        className="absolute right-0 top-[15%] bottom-[15%] w-[3px] cursor-col-resize rounded-full transition-colors duration-fast hover:bg-[var(--accent-primary)]/40"
                        onMouseDown={(e) => handleResizeStart(i, e)}
                      />
                    </TableHead>
                  ))}
                </TableRow>
                {/* Filter row */}
                {hasFilterableCols && (
                  <TableRow className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                    {enableRowSelection && (
                      <TableCell
                        className={cn("p-0", cellPadding)}
                      />
                    )}
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn("p-1", cellPadding)}
                      >
                        {col.filterable !== false ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={columnFilters[col.key] || ""}
                              onChange={(e) =>
                                setColumnFilter(col.key, e.target.value)
                              }
                              placeholder={`Filter ${col.header.toLowerCase()}...`}
                              className={cn(
                                "w-full rounded border bg-[var(--bg-surface)] text-[var(--text-primary)]",
                                "px-2 py-0.5 text-[10px] leading-4",
                                "border-[var(--border-subtle)] placeholder:text-[var(--text-tertiary)]/60",
                                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] focus-visible:border-[var(--accent-primary)]",
                                "transition-all duration-fast ease-out"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, rowIndex) => {
                  const rowId = String(row[table.rowIdKey ?? "id"]);
                  const isSelected = selectedRows.has(rowId);
                  return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.15,
                        delay: Math.min(rowIndex * 0.02, 0.2),
                      }}
                      className={cn(
                        "border-b border-[var(--border-subtle)] transition-all duration-fast ease-out",
                        isSelected
                          ? "bg-[var(--accent-primary)]/5"
                          : "hover:bg-[var(--bg-surface-2)]/50",
                        onRowClick && "cursor-pointer hover:shadow-sm"
                      )}
                      onClick={() => onRowClick?.(row, rowIndex)}
                    >
                      {enableRowSelection && (
                        <TableCell
                          className={cn(
                            "text-center",
                            cellPadding,
                            cellText
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(rowId)}
                            className="h-3.5 w-3.5 rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            cellPadding,
                            cellText,
                            col.align === "right" &&
                              "text-right font-mono",
                            col.align === "center" && "text-center"
                          )}
                        >
                          {col.render
                            ? col.render(row, rowIndex)
                            : row[col.key] != null
                            ? String(row[col.key])
                            : "—"}
                        </TableCell>
                      ))}
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────
   DataTable Pagination
   ────────────────────────────────────────────── */

interface DataTablePaginationProps<T> {
  table: UseDataTableReturn<T>;
}

export function DataTablePagination<T>({
  table,
}: DataTablePaginationProps<T>) {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    selectedRows,
  } = table;

  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push("ellipsis");
      const startPage = Math.max(1, page - 1);
      const endPage = Math.min(totalPages - 2, page + 1);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (page < totalPages - 3) pages.push("ellipsis");
      if (totalPages > 1) pages.push(totalPages - 1);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
    >
      {/* Left: row info */}
      <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
        <span>
          Showing{" "}
          <strong className="text-[var(--text-secondary)]">
            {start}
          </strong>{" "}
          to{" "}
          <strong className="text-[var(--text-secondary)]">{end}</strong> of{" "}
          <strong className="text-[var(--text-secondary)]">
            {totalItems.toLocaleString()}
          </strong>
        </span>
        {selectedRows.size > 0 && (
          <span className="text-[var(--accent-primary)]">
            ({selectedRows.size} selected)
          </span>
        )}
      </div>

      {/* Right: pagination controls */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5 mr-2">
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Rows
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-7 w-[64px] text-[11px] px-2 py-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50, 100].map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-0.5">
          <PaginationButton
            onClick={() => setPage(0)}
            disabled={page === 0}
            aria-label="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </PaginationButton>
          <PaginationButton
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PaginationButton>

          {pageNumbers.map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="w-7 h-7 flex items-center justify-center text-[10px] text-[var(--text-tertiary)]"
              >
                ...
              </span>
            ) : (
              <PaginationButton
                key={p}
                onClick={() => setPage(p)}
                active={page === p}
                aria-label={`Page ${p + 1}`}
              >
                {p + 1}
              </PaginationButton>
            )
          )}

          <PaginationButton
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PaginationButton>
          <PaginationButton
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </PaginationButton>
        </div>
      </div>
    </motion.div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 min-w-[28px] px-1.5 rounded-md flex items-center justify-center",
        "text-[11px] font-medium transition-all duration-fast ease-out",
        active
          ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-sm"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[var(--text-tertiary)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────
   Full DataTable with Toolbar + Table + Pagination
   ────────────────────────────────────────────── */

interface DataTableFullProps<T> extends DataTableProps<T> {
  title?: string;
  toolbarChildren?: React.ReactNode;
  globalFilterPlaceholder?: string;
}

export function DataTableFull<T extends Record<string, any>>({
  table,
  title,
  toolbarChildren,
  globalFilterPlaceholder,
  ...tableProps
}: DataTableFullProps<T>) {
  return (
    <div className="flex flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
      <DataTableToolbar
        table={table}
        title={title}
        globalFilterPlaceholder={globalFilterPlaceholder}
      >
        {toolbarChildren}
      </DataTableToolbar>
      <DataTable table={table} {...tableProps} />
      <DataTablePagination table={table} />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Status helpers (used in render functions)
   ────────────────────────────────────────────── */

export function DataTableStatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const statusStyles: Record<string, string> = {
    success: "bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border-[var(--semantic-success)]/25",
    completed: "bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border-[var(--semantic-success)]/25",
    running: "bg-[var(--semantic-info)]/15 text-[var(--semantic-info)] border-[var(--semantic-info)]/25",
    pending: "bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/25",
    failed: "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)] border-[var(--semantic-danger)]/25",
    error: "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)] border-[var(--semantic-danger)]/25",
    cancelled: "bg-[var(--text-tertiary)]/15 text-[var(--text-tertiary)] border-[var(--text-tertiary)]/25",
    healthy: "bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border-[var(--semantic-success)]/25",
    warning: "bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/25",
    critical: "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)] border-[var(--semantic-danger)]/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        "px-2 py-0 text-[10px] leading-4 h-5",
        statusStyles[status.toLowerCase()] || statusStyles.pending,
        className
      )}
    >
      {status}
    </span>
  );
}
