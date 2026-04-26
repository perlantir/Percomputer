"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ── animation springs ── */
const tooltipSpring = { type: "spring" as const, stiffness: 500, damping: 28, mass: 0.6 };
const reducedSpring = { type: "spring" as const, stiffness: 500, damping: 50, mass: 0.5 };

/* ── placement offset map for entry/exit motion ── */
const sideOffsetMap: Record<string, { x: number; y: number }> = {
  bottom: { x: 0, y: -6 },
  top:    { x: 0, y: 6 },
  left:   { x: 6, y: 0 },
  right:  { x: -6, y: 0 },
};

/* ── transform origin map for scale-from-anchor effect ── */
const transformOriginMap: Record<string, string> = {
  bottom: "top center",
  top:    "bottom center",
  left:   "center right",
  right:  "center left",
};

/* ── default delay preset map (ms) ── */
const delayPresets = {
  instant:  { open: 0,   close: 0 },
  fast:     { open: 100, close: 50 },
  default:  { open: 200, close: 100 },
  slow:     { open: 500, close: 200 },
  hover:    { open: 50,  close: 300 },
};

/* ═══════════════════════════════════════════════════════════
   Base primitives (backward-compatible)
   ═══════════════════════════════════════════════════════════ */

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

/* ── TooltipArrow ── */
const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  return (
    <TooltipPrimitive.Arrow
      ref={ref}
      asChild
      {...props}
    >
      <motion.svg
        width="12"
        height="6"
        viewBox="0 0 12 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={shouldReduce ? {} : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={shouldReduce ? {} : { opacity: 0, scale: 0.5 }}
        transition={shouldReduce ? reducedSpring : { ...tooltipSpring, delay: 0.02 }}
        className={cn("text-[var(--bg-surface-2)]", className)}
      >
        <path
          d="M0 0L6 6L12 0H0Z"
          fill="currentColor"
          stroke="var(--border-subtle)"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ transform: "translateY(-0.5px)" }}
        />
      </motion.svg>
    </TooltipPrimitive.Arrow>
  );
});
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

/* ── TooltipContent (enhanced with arrow support + placement-aware motion) ── */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean;
    arrowClassName?: string;
  }
>(({ className, sideOffset = 4, showArrow = false, arrowClassName, children, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  const sideRef = React.useRef<HTMLDivElement>(null);
  const [side, setSide] = React.useState("bottom");
  const offset = sideOffsetMap[side] ?? sideOffsetMap.bottom;
  const origin = transformOriginMap[side] ?? "center";

  // Observe data-side attribute so motion follows actual placement
  React.useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-side") {
          setSide(el.getAttribute("data-side") ?? "bottom");
        }
      }
    });
    observer.observe(el, { attributes: true });
    setSide(el.getAttribute("data-side") ?? "bottom");
    return () => observer.disconnect();
  }, []);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      sideRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref]
  );

  return (
    <TooltipPrimitive.Content
      ref={setRefs}
      sideOffset={sideOffset}
      {...props}
      asChild
      forceMount
    >
      <motion.div
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x, y: offset.y, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x * 0.5, y: offset.y * 0.5, scale: 0.97 }}
        transition={shouldReduce ? reducedSpring : tooltipSpring}
        style={{ transformOrigin: origin }}
        className={cn(
          "z-50 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-sm text-[var(--text-primary)] shadow-medium will-change-transform",
          className
        )}
      >
        {children}
        {showArrow && (
          <TooltipArrow className={arrowClassName} />
        )}
      </motion.div>
    </TooltipPrimitive.Content>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/* ═══════════════════════════════════════════════════════════
   Enhanced convenience wrapper — single component with
   arrow, delay, placement & hover micro-interactions
   ═══════════════════════════════════════════════════════════ */

type DelayPreset = keyof typeof delayPresets;

interface EnhancedTooltipProps {
  /** Trigger element */
  children: React.ReactNode;
  /** Tooltip text content */
  content: React.ReactNode;
  /** Placement side */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment on the cross axis */
  align?: "start" | "center" | "end";
  /** Gap between trigger and tooltip (px) */
  sideOffset?: number;
  /** Show decorative arrow */
  arrow?: boolean;
  /** Delay preset or custom object { open, close } in ms */
  delay?: DelayPreset | { open: number; close: number };
  /** Additional content classes */
  contentClassName?: string;
  /** Additional arrow classes */
  arrowClassName?: string;
  /** Root class on the trigger wrapper */
  className?: string;
  /** Max width of tooltip */
  maxWidth?: number;
  /** Disable tooltip entirely */
  disabled?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 6,
  arrow = true,
  delay = "default",
  contentClassName,
  arrowClassName,
  className,
  maxWidth = 240,
  disabled = false,
  onOpenChange,
  open,
  defaultOpen,
}) => {
  const shouldReduce = useReducedMotion();
  const resolvedDelay = typeof delay === "string" ? delayPresets[delay] : delay;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sideRef = React.useRef<HTMLDivElement>(null);
  const [actualSide, setActualSide] = React.useState(side);
  const offset = sideOffsetMap[actualSide] ?? sideOffsetMap.top;
  const origin = transformOriginMap[actualSide] ?? "center";

  // Observe data-side for motion direction
  React.useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-side") {
          setActualSide(el.getAttribute("data-side") as typeof side ?? side);
        }
      }
    });
    observer.observe(el, { attributes: true });
    return () => observer.disconnect();
  }, [side]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const handleMouseEnter = React.useCallback(() => {
    if (disabled) return;
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    openTimer.current = setTimeout(() => {
      handleOpenChange(true);
    }, resolvedDelay.open);
  }, [disabled, resolvedDelay.open, handleOpenChange]);

  const handleMouseLeave = React.useCallback(() => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    closeTimer.current = setTimeout(() => {
      handleOpenChange(false);
    }, resolvedDelay.close);
  }, [resolvedDelay.close, handleOpenChange]);

  // Keyboard accessibility: Escape closes
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, handleOpenChange]);

  if (disabled) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider
      delayDuration={0}
      skipDelayDuration={0}
    >
      <TooltipPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <TooltipPrimitive.Trigger asChild>
          <motion.span
            className={cn("inline-block cursor-pointer", className)}
            whileHover={shouldReduce ? {} : { scale: 1.03 }}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
          >
            {children}
          </motion.span>
        </TooltipPrimitive.Trigger>
        <AnimatePresence>
          {isOpen && (
            <TooltipPrimitive.Content
              ref={sideRef}
              side={side}
              align={align}
              sideOffset={sideOffset}
              asChild
              forceMount
              avoidCollisions
              collisionPadding={8}
            >
              <motion.div
                initial={
                  shouldReduce
                    ? { opacity: 0 }
                    : { opacity: 0, x: offset.x, y: offset.y, scale: 0.92 }
                }
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={
                  shouldReduce
                    ? { opacity: 0 }
                    : { opacity: 0, x: offset.x * 0.5, y: offset.y * 0.5, scale: 0.95 }
                }
                transition={shouldReduce ? reducedSpring : tooltipSpring}
                className={cn(
                  "z-50 overflow-visible rounded-lg border border-[var(--border-subtle)]",
                  "bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)]",
                  "shadow-premium will-change-transform",
                  contentClassName
                )}
                style={{ maxWidth, transformOrigin: origin }}
              >
                <div className="relative">
                  {content}
                  {/* Custom arrow — positioned via Radix */}
                  {arrow && (
                    <TooltipPrimitive.Arrow asChild width={12} height={6}>
                      <motion.svg
                        width="12"
                        height="6"
                        viewBox="0 0 12 6"
                        initial={shouldReduce ? {} : { opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduce ? {} : { opacity: 0, scale: 0.3 }}
                        transition={shouldReduce ? reducedSpring : { ...tooltipSpring, delay: 0.03 }}
                        className={cn(
                          "fill-[var(--bg-surface-2)] stroke-[var(--border-subtle)]",
                          arrowClassName
                        )}
                      >
                        <path
                          d="M0 0L6 6L12 0Z"
                          strokeWidth="1"
                          fill="currentColor"
                          stroke="var(--border-subtle)"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    </TooltipPrimitive.Arrow>
                  )}
                </div>
              </motion.div>
            </TooltipPrimitive.Content>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

/* ═══════════════════════════════════════════════════════════
   DelayedTooltipProvider — wraps children with configurable
   default delay behavior
   ═══════════════════════════════════════════════════════════ */

interface DelayedTooltipProviderProps {
  children: React.ReactNode;
  /** Delay preset or custom ms */
  delay?: DelayPreset | number;
  /** Skip delay after first interaction (ms) */
  skipDelay?: number;
}

const DelayedTooltipProvider: React.FC<DelayedTooltipProviderProps> = ({
  children,
  delay = "default",
  skipDelay = 300,
}) => {
  const resolved = typeof delay === "string" ? delayPresets[delay].open : delay;
  return (
    <TooltipPrimitive.Provider delayDuration={resolved} skipDelayDuration={skipDelay}>
      {children}
    </TooltipPrimitive.Provider>
  );
};

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
  EnhancedTooltip,
  DelayedTooltipProvider,
};

export type { EnhancedTooltipProps, DelayPreset, DelayedTooltipProviderProps };
