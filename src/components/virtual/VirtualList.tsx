"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VirtualItem<T> {
  /** Unique key for React — used for stable identity across renders */
  key: string;
  /** The original data item */
  data: T;
  /** Absolute index in the full data array */
  index: number;
  /** Whether this item is currently in the visible viewport window */
  isInViewport: boolean;
}

interface VirtualListProps<T> {
  /** Full data array */
  items: T[];
  /** Unique key extractor */
  getKey: (item: T, index: number) => string;
  /** Render function for each row */
  renderItem: (item: VirtualItem<T>) => React.ReactNode;
  /** Fixed row height in px (use with `estimateHeight` for dynamic) */
  itemHeight: number;
  /**
   * Optional function to measure dynamic row heights.
   * When provided, the list re-measures visible rows via ResizeObserver.
   * Return undefined to fall back to `itemHeight`.
   */
  estimateHeight?: (item: T, index: number) => number;
  /** Extra rows to render above/below viewport for smoother scrolling */
  overscan?: number;
  /** Container CSS class */
  className?: string;
  /** Row wrapper CSS class */
  rowClassName?: string;
  /** Virtual list height (px). Omit to fill parent container. */
  height?: number;
  /** Called with the currently visible range (start, end) */
  onRangeChange?: (range: { start: number; end: number }) => void;
  /** Enable entry animation for newly-visible rows */
  animateEntries?: boolean;
  /** ARIA role for accessibility */
  role?: string;
  /** ARIA label */
  ariaLabel?: string;
}

interface ScrollState {
  /** Pixels from top of the scroll container */
  scrollTop: number;
  /** Height of the visible area */
  viewportHeight: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function VirtualList<T>({
  items,
  getKey,
  renderItem,
  itemHeight,
  estimateHeight,
  overscan = 4,
  className,
  rowClassName,
  height,
  onRangeChange,
  animateEntries = false,
  role = "list",
  ariaLabel,
}: VirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const measuredHeights = React.useRef<Map<number, number>>(new Map());

  const [scrollState, setScrollState] = React.useState<ScrollState>({
    scrollTop: 0,
    viewportHeight: height ?? 600,
  });

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Measure viewport height ---- */
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setScrollState((prev) => ({
        ...prev,
        viewportHeight: rect.height,
      }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---- Readmeasured dynamic heights ---- */
  React.useEffect(() => {
    if (!estimateHeight) return;

    const ro = new ResizeObserver((entries) => {
      let dirty = false;
      entries.forEach((entry) => {
        const el = entry.target as HTMLDivElement;
        const indexAttr = el.dataset.index;
        if (indexAttr !== undefined) {
          const idx = Number(indexAttr);
          const newHeight = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;
          if (measuredHeights.current.get(idx) !== newHeight) {
            measuredHeights.current.set(idx, newHeight);
            dirty = true;
          }
        }
      });
      if (dirty) {
        // Force re-render to recalculate offsets
        setScrollState((prev) => ({ ...prev }));
      }
    });

    rowRefs.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, estimateHeight]);

  /* ---- Cumulative offset lookup ---- */
  const getItemOffset = React.useCallback(
    (index: number): number => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += measuredHeights.current.get(i) ?? estimateHeight?.(items[i], i) ?? itemHeight;
      }
      return offset;
    },
    [estimateHeight, itemHeight, items]
  );

  const getTotalHeight = React.useCallback((): number => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += measuredHeights.current.get(i) ?? estimateHeight?.(items[i], i) ?? itemHeight;
    }
    return total;
  }, [estimateHeight, itemHeight, items]);

  /* ---- Virtual window calculation ---- */
  const { virtualItems, totalHeight, startIndex, endIndex } = React.useMemo(() => {
    if (items.length === 0) {
      return { virtualItems: [], totalHeight: 0, startIndex: 0, endIndex: 0 };
    }

    const { scrollTop, viewportHeight } = scrollState;
    const totalH = getTotalHeight();

    // Binary-search to find start index for given scrollTop
    let start = 0;
    let offset = 0;
    for (let i = 0; i < items.length; i++) {
      const h = measuredHeights.current.get(i) ?? estimateHeight?.(items[i], i) ?? itemHeight;
      if (offset + h > scrollTop) {
        start = i;
        break;
      }
      offset += h;
    }

    // Find end index
    let end = start;
    let visibleOffset = offset;
    for (let i = start; i < items.length; i++) {
      const h = measuredHeights.current.get(i) ?? estimateHeight?.(items[i], i) ?? itemHeight;
      visibleOffset += h;
      if (visibleOffset >= scrollTop + viewportHeight) {
        end = i;
        break;
      }
      if (i === items.length - 1) end = i;
    }

    // Apply overscan
    const overscanStart = clamp(start - overscan, 0, items.length - 1);
    const overscanEnd = clamp(end + overscan, 0, items.length - 1);

    // Build virtual items
    const vItems: VirtualItem<T>[] = [];
    let runningOffset = getItemOffset(overscanStart);
    for (let i = overscanStart; i <= overscanEnd; i++) {
      const h = measuredHeights.current.get(i) ?? estimateHeight?.(items[i], i) ?? itemHeight;
      vItems.push({
        key: getKey(items[i], i),
        data: items[i],
        index: i,
        isInViewport: i >= start && i <= end,
      });
      runningOffset += h;
    }

    return { virtualItems: vItems, totalHeight: totalH, startIndex: start, endIndex: end };
  }, [items, getKey, scrollState, overscan, estimateHeight, itemHeight, getTotalHeight, getItemOffset]);

  /* ---- Notify range changes ---- */
  React.useEffect(() => {
    onRangeChange?.({ start: startIndex, end: endIndex });
  }, [startIndex, endIndex, onRangeChange]);

  /* ---- Scroll handler (throttled via rAF) ---- */
  const rafRef = React.useRef<number>(0);

  const handleScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrollState((prev) => ({
        ...prev,
        scrollTop: el.scrollTop,
      }));
    });
  }, []);

  /* ---- Track row refs for dynamic measurement ---- */
  const setRowRef = React.useCallback(
    (key: string, index: number, el: HTMLDivElement | null) => {
      if (el) {
        rowRefs.current.set(key, el);
        el.dataset.index = String(index);
      } else {
        rowRefs.current.delete(key);
      }
    },
    []
  );

  /* ---- Empty state ---- */
  if (items.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center overflow-auto",
          height ? "" : "h-full",
          className
        )}
        style={height ? { height } : undefined}
        role={role}
        aria-label={ariaLabel}
      >
        <p className="text-sm text-[var(--text-tertiary)]">No items</p>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto will-change-scroll", height ? "" : "h-full", className)}
      style={height ? { height } : undefined}
      onScroll={handleScroll}
      role={role}
      aria-label={ariaLabel}
      aria-rowcount={items.length}
    >
      {/* Total-height spacer */}
      <div
        className="relative w-full"
        style={{ height: totalHeight }}
        aria-hidden="true"
      >
        <AnimatePresence initial={false}>
          {virtualItems.map((vItem) => {
            const measured = measuredHeights.current.get(vItem.index);
            const estimated = estimateHeight?.(vItem.data, vItem.index);
            const h = measured ?? estimated ?? itemHeight;
            const top = getItemOffset(vItem.index);

            const row = (
              <div
                key={vItem.key}
                ref={(el) => setRowRef(vItem.key, vItem.index, el)}
                className={cn(
                  "absolute left-0 right-0 overflow-hidden",
                  "transition-colors duration-150 ease-out-expo",
                  rowClassName
                )}
                style={{
                  top,
                  height: h,
                }}
                role="listitem"
                aria-rowindex={vItem.index + 1}
              >
                {renderItem(vItem)}
              </div>
            );

            if (animateEntries && !prefersReducedMotion) {
              return (
                <motion.div
                  key={`motion-${vItem.key}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1], // ease-out-expo
                  }}
                  className="absolute left-0 right-0"
                  style={{ top }}
                >
                  <div
                    ref={(el) => setRowRef(vItem.key, vItem.index, el)}
                    className={cn(
                      "overflow-hidden transition-colors duration-150 ease-out-expo",
                      rowClassName
                    )}
                    style={{ height: h }}
                    role="listitem"
                    aria-rowindex={vItem.index + 1}
                  >
                    {renderItem(vItem)}
                  </div>
                </motion.div>
              );
            }

            return row;
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Convenience: useVirtual hook for imperative scroll control         */
/* ------------------------------------------------------------------ */

export interface VirtualListHandle {
  /** Scroll to a specific item by index */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  /** Scroll to a specific pixel offset */
  scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void;
  /** Get current scroll state */
  getScrollState: () => ScrollState;
}

export function VirtualListWithRef<T>(
  {
    items,
    getKey,
    renderItem,
    itemHeight,
    estimateHeight,
    overscan,
    className,
    rowClassName,
    height,
    onRangeChange,
    animateEntries,
    role,
    ariaLabel,
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>
) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const measuredHeights = React.useRef<Map<number, number>>(new Map());

  const getItemOffset = React.useCallback(
    (index: number): number => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset +=
          measuredHeights.current.get(i) ?? estimateHeight?.(items[i], i) ?? itemHeight;
      }
      return offset;
    },
    [estimateHeight, itemHeight, items]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index: number, behavior: ScrollBehavior = "smooth") => {
        const el = containerRef.current;
        if (!el) return;
        const clamped = clamp(index, 0, items.length - 1);
        const offset = getItemOffset(clamped);
        el.scrollTo({ top: offset, behavior });
      },
      scrollToOffset: (offset: number, behavior: ScrollBehavior = "smooth") => {
        containerRef.current?.scrollTo({ top: offset, behavior });
      },
      getScrollState: () => ({
        scrollTop: containerRef.current?.scrollTop ?? 0,
        viewportHeight: containerRef.current?.clientHeight ?? 0,
      }),
    }),
    [getItemOffset, items.length]
  );

  return (
    <VirtualList
      items={items}
      getKey={getKey}
      renderItem={renderItem}
      itemHeight={itemHeight}
      estimateHeight={estimateHeight}
      overscan={overscan}
      className={className}
      rowClassName={rowClassName}
      height={height}
      onRangeChange={onRangeChange}
      animateEntries={animateEntries}
      role={role}
      ariaLabel={ariaLabel}
    />
  );
}

VirtualListWithRef.displayName = "VirtualListWithRef";

export const ForwardedVirtualList = React.forwardRef(VirtualListWithRef) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<VirtualListHandle> }
) => React.ReactElement;

ForwardedVirtualList.displayName = "VirtualList";

/* ------------------------------------------------------------------ */
/*  Re-export types                                                    */
/* ------------------------------------------------------------------ */
export type { VirtualItem, VirtualListProps, ScrollState };
