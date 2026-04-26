"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PanelLeft, PanelRight, GripVertical } from "lucide-react";
import { cn } from "@/src/lib/utils";

/* ─────────────────────── Types ─────────────────────── */

interface PanelSizes {
  left: number;
  right: number;
}

interface PanelCollapseState {
  left: boolean;
  right: boolean;
}

interface ResizablePanelsState {
  sizes: PanelSizes;
  collapsed: PanelCollapseState;
  isDragging: boolean;
  setSizes: (sizes: PanelSizes) => void;
  setCollapsed: (panel: "left" | "right", value: boolean) => void;
  toggleCollapsed: (panel: "left" | "right") => void;
  setIsDragging: (value: boolean) => void;
  resetSizes: () => void;
}

/* ─────────────────────── Zustand Store ─────────────────────── */

const DEFAULT_SIZES: PanelSizes = { left: 280, right: 320 };
const MIN_WIDTH = 180;
const MAX_WIDTH = 600;
const COLLAPSED_WIDTH = 0;

export const useResizablePanelsStore = create<ResizablePanelsState>()(
  persist(
    (set) => ({
      sizes: { ...DEFAULT_SIZES },
      collapsed: { left: false, right: false },
      isDragging: false,
      setSizes: (sizes) => set({ sizes }),
      setCollapsed: (panel, value) =>
        set((state) => ({
          collapsed: { ...state.collapsed, [panel]: value },
        })),
      toggleCollapsed: (panel) =>
        set((state) => ({
          collapsed: { ...state.collapsed, [panel]: !state.collapsed[panel] },
        })),
      setIsDragging: (value) => set({ isDragging: value }),
      resetSizes: () =>
        set({ sizes: { ...DEFAULT_SIZES }, collapsed: { left: false, right: false } }),
    }),
    {
      name: "resizable-panels-state",
      partialize: (state) => ({
        sizes: state.sizes,
        collapsed: state.collapsed,
      }),
    }
  )
);

/* ─────────────────────── Context ─────────────────────── */

interface ResizablePanelsContextValue {
  leftRef: React.RefObject<HTMLDivElement | null>;
  rightRef: React.RefObject<HTMLDivElement | null>;
  mainRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ResizablePanelsContext = createContext<ResizablePanelsContextValue | null>(null);

function useResizablePanelsContext() {
  const ctx = useContext(ResizablePanelsContext);
  if (!ctx) {
    throw new Error(
      "useResizablePanelsContext must be used within a ResizablePanels provider"
    );
  }
  return ctx;
}

/* ─────────────────────── Animation Tokens ─────────────────────── */

const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;
const SPRING_CONFIG = { type: "spring" as const, stiffness: 320, damping: 28 };

/* ─────────────────────── Resize Handle ─────────────────────── */

interface ResizeHandleProps {
  side: "left" | "right";
  onResize: (delta: number) => void;
  minWidth?: number;
  maxWidth?: number;
  currentWidth: number;
  className?: string;
}

function ResizeHandle({
  side,
  onResize,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
  currentWidth,
  className,
}: ResizeHandleProps) {
  const { setIsDragging } = useResizablePanelsStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(currentWidth);
  const isLeft = side === "left";

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = currentWidth;
      setIsDragging(true);

      const handlePointerMove = (ev: PointerEvent) => {
        const deltaX = ev.clientX - startXRef.current;
        const multiplier = isLeft ? 1 : -1;
        const newWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startWidthRef.current + deltaX * multiplier)
        );
        onResize(newWidth);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.body.style.pointerEvents = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.body.style.pointerEvents = "none";
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [currentWidth, onResize, setIsDragging, isLeft, minWidth, maxWidth]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 20 : 4;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const newWidth = Math.max(minWidth, currentWidth - step);
        onResize(newWidth);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const newWidth = Math.min(maxWidth, currentWidth + step);
        onResize(newWidth);
      } else if (e.key === "Home") {
        e.preventDefault();
        onResize(minWidth);
      } else if (e.key === "End") {
        e.preventDefault();
        onResize(maxWidth);
      }
    },
    [currentWidth, onResize, minWidth, maxWidth]
  );

  const showIndicator = isHovered || isFocused;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${side} panel`}
      aria-valuenow={Math.round(currentWidth)}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "group relative z-20 flex shrink-0 cursor-col-resize items-center justify-center",
        "w-4 -mx-2 focus:outline-none",
        className
      )}
    >
      {/* Hit area — invisible but captures pointer */}
      <div className="absolute inset-0" />

      {/* Visible indicator line */}
      <motion.div
        className={cn(
          "relative h-full w-[2px] rounded-full transition-colors duration-150",
          showIndicator
            ? "bg-[var(--accent-primary)]"
            : "bg-[var(--border-subtle)] group-hover:bg-[var(--border-default)]"
        )}
        animate={{
          scaleY: showIndicator ? 1 : 0.6,
          opacity: showIndicator ? 1 : 0.3,
        }}
        transition={{ duration: 0.15 }}
      >
        {/* Glow effect on active */}
        <AnimatePresence>
          {showIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: `0 0 8px 2px var(--accent-primary)`,
                opacity: 0.3,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Grip dots */}
      <motion.div
        className={cn(
          "pointer-events-none absolute flex flex-col items-center gap-[3px]",
          isLeft ? "right-[2px]" : "left-[2px]"
        )}
        animate={{
          opacity: showIndicator ? 1 : 0,
          scale: showIndicator ? 1 : 0.8,
        }}
        transition={{ duration: 0.15 }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[2px] w-[2px] rounded-full bg-[var(--accent-primary)]"
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Panel Toggle Button ─────────────────────── */

interface PanelToggleProps {
  panel: "left" | "right";
  className?: string;
}

export function PanelToggle({ panel, className }: PanelToggleProps) {
  const { collapsed, toggleCollapsed } = useResizablePanelsStore();
  const isCollapsed = collapsed[panel];
  const Icon = panel === "left" ? PanelLeft : PanelRight;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => toggleCollapsed(panel)}
      aria-label={isCollapsed ? `Expand ${panel} panel` : `Collapse ${panel} panel`}
      aria-expanded={!isCollapsed}
      title={isCollapsed ? `Expand ${panel} panel` : `Collapse ${panel} panel`}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "h-7 w-7 text-[var(--text-tertiary)]",
        "transition-colors duration-150",
        "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-1",
        isCollapsed && "bg-[var(--bg-surface-2)] text-[var(--accent-primary)]",
        className
      )}
    >
      <motion.div
        animate={{ rotate: isCollapsed ? (panel === "left" ? -180 : 180) : 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
    </motion.button>
  );
}

/* ─────────────────────── Resizable Panel Wrapper ─────────────────────── */

interface ResizablePanelProps {
  side: "left" | "right";
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  innerClassName?: string;
}

export function ResizablePanel({
  side,
  children,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
  className,
  innerClassName,
}: ResizablePanelProps) {
  const { leftRef, rightRef } = useResizablePanelsContext();
  const { sizes, collapsed } = useResizablePanelsStore();
  const isLeft = side === "left";
  const ref = isLeft ? leftRef : rightRef;
  const isCollapsed = collapsed[side];
  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : sizes[side];

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative shrink-0 overflow-hidden",
        "border-[var(--border-subtle)]",
        isLeft ? "border-r" : "border-l",
        className
      )}
      initial={false}
      animate={{
        width: currentWidth,
        opacity: isCollapsed ? 0 : 1,
      }}
      transition={SPRING_CONFIG}
      style={{
        minWidth: isCollapsed ? 0 : minWidth,
        maxWidth: isCollapsed ? 0 : maxWidth,
        willChange: "width",
      }}
      hidden={isCollapsed ? true : undefined}
    >
      <div
        className={cn(
          "h-full w-full overflow-y-auto overflow-x-hidden",
          isCollapsed && "invisible",
          innerClassName
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Main ResizablePanels ─────────────────────── */

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  mainContent: React.ReactNode;
  rightPanel: React.ReactNode;
  leftMinWidth?: number;
  leftMaxWidth?: number;
  rightMinWidth?: number;
  rightMaxWidth?: number;
  className?: string;
  mainClassName?: string;
}

export function ResizablePanels({
  leftPanel,
  mainContent,
  rightPanel,
  leftMinWidth = MIN_WIDTH,
  leftMaxWidth = MAX_WIDTH,
  rightMinWidth = MIN_WIDTH,
  rightMaxWidth = MAX_WIDTH,
  className,
  mainClassName,
}: ResizablePanelsProps) {
  const { sizes, collapsed, setSizes, setCollapsed, isDragging } =
    useResizablePanelsStore();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  /* Respect reduced-motion preference */
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  /* Keyboard shortcut: Ctrl/Cmd + B to toggle left, Ctrl/Cmd + Shift + B to toggle right */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (e.shiftKey) {
          setCollapsed("right", !collapsed.right);
        } else {
          setCollapsed("left", !collapsed.left);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [collapsed.left, collapsed.right, setCollapsed]);

  /* Persist collapse animation: auto-close on narrow viewports */
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setCollapsed("right", true);
      }
    };
    handle(mql);
    mql.addEventListener("change", handle);
    return () => mql.removeEventListener("change", handle);
  }, [setCollapsed]);

  const handleLeftResize = useCallback(
    (newWidth: number) => {
      if (collapsed.left && newWidth > 40) {
        setCollapsed("left", false);
      }
      setSizes({ ...sizes, left: Math.round(newWidth) });
    },
    [sizes, collapsed.left, setSizes, setCollapsed]
  );

  const handleRightResize = useCallback(
    (newWidth: number) => {
      if (collapsed.right && newWidth > 40) {
        setCollapsed("right", false);
      }
      setSizes({ ...sizes, right: Math.round(newWidth) });
    },
    [sizes, collapsed.right, setSizes, setCollapsed]
  );

  /* Double-click handle to collapse/expand */
  const handleLeftDoubleClick = useCallback(() => {
    toggleWithAnimation("left");
  }, [collapsed.left]);

  const handleRightDoubleClick = useCallback(() => {
    toggleWithAnimation("right");
  }, [collapsed.right]);

  const toggleWithAnimation = (panel: "left" | "right") => {
    const newCollapsed = !collapsed[panel];
    setCollapsed(panel, newCollapsed);
  };

  const springConfig = prefersReducedMotion
    ? { type: "tween" as const, duration: 0 }
    : SPRING_CONFIG;

  return (
    <ResizablePanelsContext.Provider
      value={{ leftRef, rightRef, mainRef, containerRef }}
    >
      <div
        ref={containerRef}
        className={cn(
          "flex h-full w-full overflow-hidden",
          isDragging && "select-none",
          className
        )}
      >
        {/* ── Left Panel ── */}
        <AnimatePresence initial={false}>
          {!collapsed.left && (
            <motion.div
              initial={prefersReducedMotion ? false : { width: 0, opacity: 0 }}
              animate={{ width: sizes.left, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={springConfig}
              className={cn(
                "relative shrink-0 overflow-hidden",
                "border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              )}
              style={{ willChange: "width" }}
            >
              <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                {leftPanel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed-left indicator tab */}
        {collapsed.left && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex shrink-0 items-start pt-3"
          >
            <PanelToggle panel="left" />
          </motion.div>
        )}

        {/* ── Left Resize Handle ── */}
        {!collapsed.left && (
          <div onDoubleClick={handleLeftDoubleClick}>
            <ResizeHandle
              side="left"
              currentWidth={sizes.left}
              onResize={handleLeftResize}
              minWidth={leftMinWidth}
              maxWidth={leftMaxWidth}
            />
          </div>
        )}

        {/* ── Main Content ── */}
        <div
          ref={mainRef}
          className={cn(
            "flex-1 min-w-0 overflow-y-auto bg-[var(--bg-canvas)]",
            "transition-opacity duration-150",
            isDragging && "opacity-95",
            mainClassName
          )}
        >
          {mainContent}
        </div>

        {/* ── Right Resize Handle ── */}
        {!collapsed.right && (
          <div onDoubleClick={handleRightDoubleClick}>
            <ResizeHandle
              side="right"
              currentWidth={sizes.right}
              onResize={handleRightResize}
              minWidth={rightMinWidth}
              maxWidth={rightMaxWidth}
            />
          </div>
        )}

        {/* Collapsed-right indicator tab */}
        {collapsed.right && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex shrink-0 items-start pt-3"
          >
            <PanelToggle panel="right" />
          </motion.div>
        )}

        {/* ── Right Panel ── */}
        <AnimatePresence initial={false}>
          {!collapsed.right && (
            <motion.div
              initial={prefersReducedMotion ? false : { width: 0, opacity: 0 }}
              animate={{ width: sizes.right, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={springConfig}
              className={cn(
                "relative shrink-0 overflow-hidden",
                "border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              )}
              style={{ willChange: "width" }}
            >
              <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                {rightPanel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ResizablePanelsContext.Provider>
  );
}

/* ─────────────────────── Panel Header (helper) ─────────────────────── */

interface PanelHeaderProps {
  title: string;
  panel: "left" | "right";
  children?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, panel, children, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        "border-b border-[var(--border-subtle)]",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
        {title}
      </h3>
      <div className="flex items-center gap-1">
        {children}
        <PanelToggle panel={panel} />
      </div>
    </div>
  );
}

/* ─────────────────────── Reset Button (helper) ─────────────────────── */

export function ResetPanelsButton({ className }: { className?: string }) {
  const { resetSizes, sizes, collapsed } = useResizablePanelsStore();
  const isDefault =
    sizes.left === DEFAULT_SIZES.left &&
    sizes.right === DEFAULT_SIZES.right &&
    !collapsed.left &&
    !collapsed.right;

  if (isDefault) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={resetSizes}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
        "text-xs font-medium text-[var(--text-secondary)]",
        "bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)]",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]",
        className
      )}
    >
      <GripVertical className="h-3 w-3" />
      Reset Layout
    </motion.button>
  );
}

/* ─────────────────────── Re-exports ─────────────────────── */

export { useResizablePanelsContext };
export type { PanelSizes, PanelCollapseState, ResizablePanelsProps };
