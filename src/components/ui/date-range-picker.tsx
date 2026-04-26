"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  subDays,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isBefore,
} from "date-fns";
import { cn } from "@/src/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PresetRange {
  label: string;
  value: string;
  getRange: () => DateRange;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "center" | "end";
  presets?: PresetRange[];
  disabled?: boolean;
  numberOfMonths?: number;
}

/* ─────────────────────────────────────────────────────────────
   Default Presets
   ───────────────────────────────────────────────────────────── */

const defaultPresets: PresetRange[] = [
  {
    label: "Today",
    value: "today",
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This Week",
    value: "this-week",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: "This Month",
    value: "this-month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last 7 Days",
    value: "last-7",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 Days",
    value: "last-30",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
];

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ─────────────────────────────────────────────────────────────
   Calendar Grid Component
   ───────────────────────────────────────────────────────────── */

interface CalendarProps {
  month: Date;
  range: DateRange | undefined;
  hoverDate: Date | null;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  secondMonth?: boolean;
}

function CalendarGrid({
  month,
  range,
  hoverDate,
  onDayClick,
  onDayHover,
  onMonthChange,
  secondMonth = false,
}: CalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getDayState = (day: Date) => {
    const inMonth = isSameMonth(day, month);
    const selected =
      (range?.from && isSameDay(day, range.from)) ||
      (range?.to && isSameDay(day, range.to));
    const isInRange =
      range?.from &&
      range?.to &&
      isWithinInterval(day, { start: range.from, end: range.to });

    // Preview range while hovering (before 'to' is set)
    let previewInRange = false;
    if (range?.from && !range.to && hoverDate && secondMonth === false) {
      const start = isBefore(range.from, hoverDate) ? range.from : hoverDate;
      const end = isBefore(range.from, hoverDate) ? hoverDate : range.from;
      previewInRange = isWithinInterval(day, { start, end });
    }

    return { inMonth, selected, isInRange, previewInRange };
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header with month label + nav */}
      <div className="flex items-center justify-between px-1">
        {!secondMonth ? (
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-[var(--text-tertiary)] transition-all duration-150 ease-out",
              "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
              "active:scale-90 focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--accent-primary)]"
            )}
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </button>
        ) : (
          <div className="h-7 w-7" />
        )}

        <motion.span
          key={format(month, "yyyy-MM")}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-semibold text-[var(--text-primary)] select-none"
        >
          {format(month, "MMMM yyyy")}
        </motion.span>

        {secondMonth ? (
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-[var(--text-tertiary)] transition-all duration-150 ease-out",
              "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
              "active:scale-90 focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--accent-primary)]"
            )}
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </button>
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="flex h-8 items-center justify-center text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-tertiary)]"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const { inMonth, selected, isInRange, previewInRange } =
            getDayState(day);
          const isCurrentDay = isToday(day);

          return (
            <motion.button
              key={day.toISOString()}
              type="button"
              whileHover={{ scale: inMonth ? 1.1 : 1 }}
              whileTap={{ scale: inMonth ? 0.92 : 1 }}
              onClick={() => inMonth && onDayClick(day)}
              onMouseEnter={() => inMonth && onDayHover(day)}
              onMouseLeave={() => onDayHover(null)}
              disabled={!inMonth}
              className={cn(
                "relative flex h-8 w-full items-center justify-center rounded-md",
                "text-xs font-medium transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",

                /* Out of month */
                !inMonth && "pointer-events-none text-transparent",

                /* In month — default */
                inMonth &&
                  !selected &&
                  !isInRange &&
                  !previewInRange &&
                  "text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]",

                /* Today highlight */
                inMonth &&
                  isCurrentDay &&
                  !selected &&
                  "font-bold text-[var(--accent-primary)]",

                /* In-range fill */
                inMonth &&
                  (isInRange || previewInRange) &&
                  !selected &&
                  "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",

                /* Selected day */
                inMonth &&
                  selected &&
                  "bg-[var(--accent-primary)] text-[var(--text-inverse)] font-semibold shadow-sm",

                /* Range start */
                range?.from &&
                  isSameDay(day, range.from) &&
                  "rounded-r-none rounded-l-md",

                /* Range end */
                range?.to &&
                  isSameDay(day, range.to) &&
                  "rounded-l-none rounded-r-md"
              )}
            >
              {inMonth && format(day, "d")}
              {inMonth && isCurrentDay && !selected && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className,
  align = "start",
  presets = defaultPresets,
  disabled = false,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(value);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const [leftMonth, setLeftMonth] = React.useState(new Date());
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  // Keep internal state in sync with external value
  React.useEffect(() => {
    setRange(value);
  }, [value]);

  const rightMonth = addMonths(leftMonth, 1);

  // Detect if a preset is currently active
  React.useEffect(() => {
    if (!range) {
      setActivePreset(null);
      return;
    }
    const match = presets.find((p) => {
      const pr = p.getRange();
      return (
        isSameDay(pr.from, range.from) && isSameDay(pr.to, range.to)
      );
    });
    setActivePreset(match?.value ?? null);
  }, [range, presets]);

  const handleDayClick = React.useCallback(
    (day: Date) => {
      setRange((prev) => {
        // No existing range or both from & to set → start fresh
        if (!prev || (prev.from && prev.to)) {
          return { from: startOfDay(day), to: startOfDay(day) };
        }
        // Only 'from' is set → complete the range
        if (prev.from) {
          if (isBefore(day, prev.from)) {
            return { from: startOfDay(day), to: endOfDay(prev.from) };
          }
          return { from: prev.from, to: endOfDay(day) };
        }
        return prev;
      });
    },
    []
  );

  const handlePresetClick = React.useCallback(
    (preset: PresetRange) => {
      const newRange = preset.getRange();
      setRange(newRange);
      setActivePreset(preset.value);
      setLeftMonth(newRange.from);
    },
    []
  );

  const handleApply = React.useCallback(() => {
    if (range?.from && range?.to) {
      onChange(range);
      setOpen(false);
    }
  }, [range, onChange]);

  const handleClear = React.useCallback(() => {
    setRange(undefined);
    setActivePreset(null);
    onChange(undefined);
    setOpen(false);
  }, [onChange]);

  const formattedLabel = React.useMemo(() => {
    if (!range?.from) return placeholder;
    if (!range.to || isSameDay(range.from, range.to)) {
      return format(range.from, "MMM d, yyyy");
    }
    return `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`;
  }, [range, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm",
            "transition-all duration-fast ease-out-expo",
            "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
            "hover:border-[var(--accent-primary)]/40 hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border-default)] disabled:hover:shadow-none",
            range && "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5",
            className
          )}
        >
          <CalendarIcon className="text-[var(--text-tertiary)] transition-colors duration-fast group-hover:text-[var(--accent-primary)]" />
          <span className={cn(!range && "text-[var(--text-tertiary)]")}>
            {formattedLabel}
          </span>
          {range && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[10px] text-[var(--text-inverse)]"
            >
              <CheckIcon />
            </motion.span>
          )}
          <ChevronDownIcon
            className={cn(
              "ml-auto text-[var(--text-tertiary)] transition-transform duration-fast ease-out-expo",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-auto min-w-[540px] p-0 shadow-high"
        sideOffset={6}
      >
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex"
        >
          {/* ── Sidebar: Presets ── */}
          <div className="flex w-40 flex-col gap-0.5 border-r border-[var(--border-subtle)] p-3">
            <span className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Quick Select
            </span>
            {presets.map((preset, i) => (
              <motion.button
                key={preset.value}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "relative flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium",
                  "transition-all duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
                  activePreset === preset.value
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                )}
              >
                {activePreset === preset.value && (
                  <motion.span
                    layoutId="preset-indicator"
                    className="absolute inset-0 rounded-md bg-[var(--accent-primary)]/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{preset.label}</span>
              </motion.button>
            ))}

            <div className="my-2 border-t border-[var(--border-subtle)]" />

            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: presets.length * 0.04 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClear}
              className={cn(
                "flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium",
                "text-[var(--text-tertiary)] transition-all duration-150 ease-out",
                "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              )}
            >
              <ResetIcon className="mr-1.5 h-3 w-3" />
              Clear
            </motion.button>
          </div>

          {/* ── Main: Calendar(s) ── */}
          <div className="flex flex-col gap-4 p-4">
            <div className="flex gap-6">
              <CalendarGrid
                month={leftMonth}
                range={range}
                hoverDate={hoverDate}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
                onMonthChange={setLeftMonth}
              />

              {numberOfMonths >= 2 && (
                <CalendarGrid
                  month={rightMonth}
                  range={range}
                  hoverDate={hoverDate}
                  onDayClick={handleDayClick}
                  onDayHover={setHoverDate}
                  onMonthChange={(m) => setLeftMonth(subMonths(m, 1))}
                  secondMonth
                />
              )}
            </div>

            {/* ── Footer: Selected range display + actions ── */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="rounded bg-[var(--bg-surface-2)] px-2 py-1 font-mono text-[var(--text-primary)]">
                  {range?.from ? format(range.from, "MMM d, yyyy") : "—"}
                </span>
                <span className="text-[var(--text-tertiary)]">to</span>
                <span className="rounded bg-[var(--bg-surface-2)] px-2 py-1 font-mono text-[var(--text-primary)]">
                  {range?.to ? format(range.to, "MMM d, yyyy") : "—"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium",
                    "text-[var(--text-secondary)] transition-all duration-150",
                    "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  )}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleApply}
                  disabled={!range?.from || !range?.to}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-xs font-semibold",
                    "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
                    "transition-all duration-150",
                    "hover:bg-[var(--accent-primary-hover)] hover:brightness-110",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                  )}
                >
                  Apply
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────────────────────── */

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-2.5 w-2.5", className)}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Re-exports
   ───────────────────────────────────────────────────────────── */

export { defaultPresets };
