"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, useSpring, useInView } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ─── types ─── */

export type CounterFormat =
  | "number"
  | "currency"
  | "percentage"
  | "compact"
  | "custom";

interface AnimatedCounterProps {
  /** Target value to count toward (can be negative). */
  value: number;
  /**
   * Format preset. Use "custom" with `formatter` for full control.
   * @default "number"
   */
  format?: CounterFormat;
  /** Locale for currency / compact formatting. @default "en-US" */
  locale?: string;
  /** Currency code (e.g. "USD", "EUR"). Only used when format="currency". @default "USD" */
  currency?: string;
  /** Number of decimal places. @default 0 */
  decimals?: number;
  /** Prefix rendered before the number. Ignored when using a built-in format preset. */
  prefix?: string;
  /** Suffix rendered after the number. Ignored when using a built-in format preset. */
  suffix?: string;
  /** Custom formatter — used when format="custom". */
  formatter?: (n: number) => string;
  /** Duration of the count animation in seconds. @default 1.4 */
  duration?: number;
  /**
   * Spring stiffness. Higher = snappier.
   * @default 70
   */
  stiffness?: number;
  /**
   * Spring damping. Lower = more oscillation.
   * @default 25
   */
  damping?: number;
  /**
   * Mass of the spring. Higher = slower, heavier feel.
   * @default 1
   */
  mass?: number;
  /** Minimum visual value (clamp). */
  min?: number;
  /** Maximum visual value (clamp). */
  max?: number;
  /**
   * Whether to enable the slot-machine rolling digit effect.
   * When `true` each digit column rolls individually.
   * When `false` the whole number tweens smoothly.
   * @default false
   */
  digitRoll?: boolean;
  /** Whether to start counting only when the element scrolls into view. @default false */
  startOnView?: boolean;
  /** Manually control when counting starts (overrides startOnView). */
  start?: boolean;
  /** Delay before counting starts (ms). @default 0 */
  delay?: number;
  /** Additional CSS classes for the container. */
  className?: string;
  /** CSS classes for individual digit columns (only when digitRoll=true). */
  digitClassName?: string;
  /** Render as a different element. @default "span" */
  as?: "span" | "div" | "p";
  /** Callback fired when the counter animation completes. */
  onComplete?: () => void;
}

/* ─── component ─── */

/**
 * AnimatedCounter
 *
 * A premium animated counter with spring physics, format presets
 * (number, currency, percentage, compact), and an optional digit-roll
 * (slot-machine) effect. Respects `prefers-reduced-motion`.
 *
 * ── Smooth mode (default) ──
 *   <AnimatedCounter value={1284} format="currency" />
 *
 * ── Digit-roll mode ──
 *   <AnimatedCounter value={1284} digitRoll duration={2} />
 *
 * ── Scroll-triggered ──
 *   <AnimatedCounter value={99.9} format="percentage" startOnView />
 */
export const AnimatedCounter = React.memo(function AnimatedCounter({
  value,
  format = "number",
  locale = "en-US",
  currency = "USD",
  decimals = 0,
  prefix = "",
  suffix = "",
  formatter,
  duration = 1.4,
  stiffness = 70,
  damping = 25,
  mass = 1,
  min,
  max,
  digitRoll = false,
  startOnView = false,
  start: startProp,
  delay = 0,
  className,
  digitClassName,
  as: Tag = "span",
  onComplete,
}: AnimatedCounterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-40px" });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const shouldStart =
    startProp !== undefined
      ? startProp
      : startOnView
        ? isInView
        : true;

  /* spring setup */
  const springConfig = useMemo(
    () => ({
      stiffness,
      damping,
      mass,
      duration: prefersReducedMotion ? 0 : duration,
    }),
    [stiffness, damping, mass, duration, prefersReducedMotion]
  );

  const spring = useSpring(0, springConfig);

  const [display, setDisplay] = useState(() =>
    formatValue(0, format, locale, currency, decimals, prefix, suffix, formatter)
  );
  const [currentValue, setCurrentValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /* kick off animation */
  useEffect(() => {
    if (!shouldStart) return;

    const timer = setTimeout(() => {
      setHasStarted(true);

      const target = clampValue(value, min, max);

      if (prefersReducedMotion) {
        setCurrentValue(target);
        setDisplay(
          formatValue(
            target,
            format,
            locale,
            currency,
            decimals,
            prefix,
            suffix,
            formatter
          )
        );
        onCompleteRef.current?.();
        return;
      }

      spring.set(target);

      const unsubscribe = spring.on("change", (latest: number) => {
        setCurrentValue(latest);
        if (!digitRoll) {
          setDisplay(
            formatValue(
              latest,
              format,
              locale,
              currency,
              decimals,
              prefix,
              suffix,
              formatter
            )
          );
        }
      });

      const doneTimer = setTimeout(() => {
        onCompleteRef.current?.();
      }, duration * 1000 + delay);

      return () => {
        unsubscribe();
        clearTimeout(doneTimer);
      };
    }, delay);

    return () => clearTimeout(timer);
  }, [
    shouldStart,
    value,
    spring,
    prefersReducedMotion,
    duration,
    delay,
    format,
    locale,
    currency,
    decimals,
    prefix,
    suffix,
    formatter,
    min,
    max,
    digitRoll,
  ]);

  /* ── digit-roll mode: derive digit columns ── */
  const digitColumns = useMemo(() => {
    if (!digitRoll) return [];
    const formatted = formatValue(
      currentValue,
      format,
      locale,
      currency,
      decimals,
      prefix,
      suffix,
      formatter
    );
    return parseDigitColumns(formatted);
  }, [digitRoll, currentValue, format, locale, currency, decimals, prefix, suffix, formatter]);

  const MotionTag = motion.create(Tag as React.ElementType);

  return (
    <MotionTag
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={cn(
        "tabular-nums tracking-tight inline-flex items-baseline",
        className
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={hasStarted || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.35, ease: [0.25, 1, 0.5, 1] }
      }
    >
      {digitRoll ? (
        <DigitRollDisplay
          columns={digitColumns}
          digitClassName={digitClassName}
          prefersReducedMotion={prefersReducedMotion}
          spring={spring}
          duration={duration}
        />
      ) : (
        <span className="relative">
          {/* subtle background flash on complete */}
          <motion.span
            className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-sm -z-10"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={hasStarted ? { scaleX: [0, 1, 0], opacity: [0, 0.3, 0] } : {}}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.6, delay: duration * 0.8, ease: "easeOut" }
            }
            style={{ originX: 0 }}
          />
          {display}
        </span>
      )}
    </MotionTag>
  );
});

/* ─── digit-roll sub-component ─── */

interface DigitColumn {
  type: "digit" | "symbol";
  char: string;
  key: string;
}

interface DigitRollDisplayProps {
  columns: DigitColumn[];
  digitClassName?: string;
  prefersReducedMotion: boolean;
  spring: ReturnType<typeof useSpring>;
  duration: number;
}

const DigitRollDisplay = React.memo(function DigitRollDisplay({
  columns,
  digitClassName,
  prefersReducedMotion,
  spring,
  duration,
}: DigitRollDisplayProps) {
  return (
    <span className="inline-flex items-baseline overflow-hidden">
      {columns.map((col, i) =>
        col.type === "symbol" ? (
          <span
            key={col.key}
            className="inline-block text-[inherit] select-none"
          >
            {col.char}
          </span>
        ) : (
          <DigitColumnRoll
            key={col.key}
            targetDigit={col.char}
            index={i}
            total={columns.filter((c) => c.type === "digit").length}
            prefersReducedMotion={prefersReducedMotion}
            spring={spring}
            duration={duration}
            className={digitClassName}
          />
        )
      )}
    </span>
  );
});

/* ─── single rolling digit column ─── */

interface DigitColumnRollProps {
  targetDigit: string;
  index: number;
  total: number;
  prefersReducedMotion: boolean;
  spring: ReturnType<typeof useSpring>;
  duration: number;
  className?: string;
}

const DigitColumnRoll = React.memo(function DigitColumnRoll({
  targetDigit,
  index,
  total,
  prefersReducedMotion,
  spring,
  duration,
  className,
}: DigitColumnRollProps) {
  const targetNum = parseInt(targetDigit, 10);
  const staggerOffset = (index / Math.max(total, 1)) * 0.25;
  const effectiveDuration = prefersReducedMotion ? 0 : duration * 0.7;

  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setSettled(true);
      return;
    }
    const t = setTimeout(() => setSettled(true), (duration - staggerOffset * duration) * 1000);
    return () => clearTimeout(t);
  }, [targetDigit, duration, staggerOffset, prefersReducedMotion]);

  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden",
        "h-[1.2em] w-[0.65em] text-center",
        className
      )}
    >
      <motion.span
        className="absolute inset-0 flex flex-col items-center"
        initial={{ y: "-1000%" }}
        animate={{ y: `-${targetNum * 10}%` }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                duration: effectiveDuration,
                delay: staggerOffset * duration,
                ease: [0.25, 1, 0.5, 1],
              }
        }
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span
            key={d}
            className="inline-flex h-[1.2em] items-center justify-center leading-none shrink-0"
            style={{ height: "1.2em" }}
          >
            {d}
          </span>
        ))}
      </motion.span>
      {/* subtle glow pulse on settle */}
      {settled && !prefersReducedMotion && (
        <motion.span
          className="absolute inset-0 bg-[var(--accent-primary)]/15 rounded-sm -z-10 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.1, 1] }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}
    </span>
  );
});

/* ─── helpers ─── */

function clampValue(v: number, min?: number, max?: number): number {
  let n = v;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}

function formatValue(
  n: number,
  format: CounterFormat,
  locale: string,
  currency: string,
  decimals: number,
  prefix: string,
  suffix: string,
  formatter?: (n: number) => string
): string {
  if (formatter && format === "custom") {
    return formatter(n);
  }

  switch (format) {
    case "currency":
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(n);
      } catch {
        return `${currency} ${n.toFixed(decimals)}`;
      }

    case "percentage":
      return `${n.toFixed(decimals)}%`;

    case "compact": {
      try {
        return new Intl.NumberFormat(locale, {
          notation: "compact",
          compactDisplay: "short",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(n);
      } catch {
        return `${prefix}${n.toFixed(decimals)}${suffix}`;
      }
    }

    case "number":
    default: {
      const rounded =
        decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
      const clean = decimals > 0 ? rounded.replace(/\.?0+$/, "") : rounded;
      return `${prefix}${clean}${suffix}`;
    }
  }
}

/**
 * Parse a formatted number string into digit columns and symbol characters.
 * E.g. "$1,284.50" => [{type:'symbol',char:'$'}, {type:'digit',char:'1'}, {type:'symbol',char:','}, ...]
 */
function parseDigitColumns(str: string): DigitColumn[] {
  return str.split("").map((char, i) => ({
    type: /\d/.test(char) ? ("digit" as const) : ("symbol" as const),
    char,
    key: `${char}-${i}`,
  }));
}

/* ─── convenience wrappers ─── */

/**
 * Pre-configured currency counter.
 */
export function CurrencyCounter({
  value,
  currency = "USD",
  locale = "en-US",
  ...rest
}: Omit<AnimatedCounterProps, "format" | "currency" | "locale"> & {
  currency?: string;
  locale?: string;
}) {
  return (
    <AnimatedCounter
      value={value}
      format="currency"
      currency={currency}
      locale={locale}
      {...rest}
    />
  );
}

/**
 * Pre-configured percentage counter.
 */
export function PercentageCounter({
  value,
  decimals = 1,
  ...rest
}: Omit<AnimatedCounterProps, "format" | "decimals"> & {
  decimals?: number;
}) {
  return (
    <AnimatedCounter
      value={value}
      format="percentage"
      decimals={decimals}
      {...rest}
    />
  );
}

/**
 * Pre-configured compact-number counter (e.g. 1.2K, 3.4M).
 */
export function CompactCounter({
  value,
  locale = "en-US",
  ...rest
}: Omit<AnimatedCounterProps, "format" | "locale"> & {
  locale?: string;
}) {
  return (
    <AnimatedCounter
      value={value}
      format="compact"
      locale={locale}
      {...rest}
    />
  );
}
