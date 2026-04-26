"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Search,
  ChevronDown,
  ListChecks,
  ListX,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Separator } from "@/src/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  maxCount?: number;
  searchable?: boolean;
  clearable?: boolean;
  selectAll?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info" | "accent";
  /** Renders custom content inside each dropdown item (right side) */
  renderItemSuffix?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
  /** Custom filter function for search */
  filterFn?: (option: MultiSelectOption, searchTerm: string) => boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const defaultFilterFn = (option: MultiSelectOption, searchTerm: string) =>
  option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
  option.value.toLowerCase().includes(searchTerm.toLowerCase());

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Select items…",
      searchPlaceholder = "Search…",
      label,
      disabled = false,
      maxCount = 3,
      searchable = true,
      clearable = true,
      selectAll = true,
      className,
      triggerClassName,
      dropdownClassName,
      badgeVariant = "default",
      renderItemSuffix,
      filterFn = defaultFilterFn,
    },
    ref
  ) => {
    /* Controlled / uncontrolled state */
    const [internalValue, setInternalValue] = React.useState<string[]>(
      defaultValue ?? []
    );
    const isControlled = value !== undefined;
    const selectedValues = isControlled ? value! : internalValue;

    const setValues = React.useCallback(
      (next: string[]) => {
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
      },
      [isControlled, onChange]
    );

    /* Popover open state */
    const [open, setOpen] = React.useState(false);

    /* Search term */
    const [search, setSearch] = React.useState("");

    /* Reset search when closing */
    React.useEffect(() => {
      if (!open) setSearch("");
    }, [open]);

    /* Filtered options */
    const filteredOptions = React.useMemo(
      () =>
        searchable && search
          ? options.filter((o) => filterFn(o, search))
          : options,
      [options, searchable, search, filterFn]
    );

    /* Selection helpers */
    const toggleOption = React.useCallback(
      (optionValue: string) => {
        if (disabled) return;
        const next = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        setValues(next);
      },
      [disabled, selectedValues, setValues]
    );

    const selectAllAvailable = React.useCallback(() => {
      const available = filteredOptions
        .filter((o) => !o.disabled)
        .map((o) => o.value);
      const next = Array.from(new Set([...selectedValues, ...available]));
      setValues(next);
    }, [filteredOptions, selectedValues, setValues]);

    const deselectAll = React.useCallback(() => {
      const availableSet = new Set(
        filteredOptions.filter((o) => !o.disabled).map((o) => o.value)
      );
      const next = selectedValues.filter((v) => !availableSet.has(v));
      setValues(next);
    }, [filteredOptions, selectedValues, setValues]);

    const clearAll = React.useCallback(() => {
      setValues([]);
    }, [setValues]);

    const allFilteredSelected =
      filteredOptions.filter((o) => !o.disabled).length > 0 &&
      filteredOptions
        .filter((o) => !o.disabled)
        .every((o) => selectedValues.includes(o.value));

    /* Selected option objects for chip rendering */
    const selectedOptions = React.useMemo(
      () =>
        selectedValues
          .map((v) => options.find((o) => o.value === v))
          .filter(Boolean) as MultiSelectOption[],
      [selectedValues, options]
    );

    /* Keyboard handler for the trigger */
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
        }
      },
      [open]
    );

    /* Animation variants */
    const listVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.015 },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, x: -6 },
      show: { opacity: 1, x: 0 },
    };

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {label}
          </span>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              disabled={disabled}
              onKeyDown={handleKeyDown}
              className={cn(
                "group flex w-full min-h-[2.5rem] items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-all duration-fast ease-out",
                "hover:border-[var(--accent-primary)]/40 hover:shadow-low",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-canvas)]",
                "data-[state=open]:border-[var(--accent-primary)]/50 data-[state=open]:ring-2 data-[state=open]:ring-[var(--accent-primary)]/20",
                disabled && "cursor-not-allowed opacity-50",
                triggerClassName
              )}
            >
              {/* Selected chips / placeholder */}
              <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  {selectedOptions.length === 0 ? (
                    <motion.span
                      key="placeholder"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[var(--text-tertiary)]"
                    >
                      {placeholder}
                    </motion.span>
                  ) : (
                    selectedOptions.slice(0, maxCount).map((option) => (
                      <motion.div
                        key={option.value}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Badge
                          variant={badgeVariant}
                          size="sm"
                          className="max-w-[140px] cursor-default gap-1 pr-1"
                        >
                          <span className="truncate">{option.label}</span>
                          {!disabled && clearable && (
                            <span
                              role="button"
                              tabIndex={0}
                              className="ml-0.5 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(option.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.stopPropagation();
                                  toggleOption(option.value);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>

                {selectedOptions.length > maxCount && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-medium text-[var(--accent-primary)]"
                  >
                    +{selectedOptions.length - maxCount}
                  </motion.span>
                )}
              </div>

              {/* Right side: clear + chevron */}
              <div className="ml-2 flex shrink-0 items-center gap-1">
                <AnimatePresence>
                  {clearable && selectedValues.length > 0 && !disabled && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                    >
                      <button
                        type="button"
                        className="inline-flex rounded-sm p-0.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAll();
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-fast ease-out",
                    open && "rotate-180 text-[var(--accent-primary)]"
                  )}
                />
              </div>
            </button>
          </PopoverTrigger>

          <PopoverContent
            className={cn(
              "w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden",
              dropdownClassName
            )}
            align="start"
            sideOffset={4}
          >
            <div className="flex flex-col">
              {/* ── Search ── */}
              {searchable && (
                <div className="flex items-center border-b border-[var(--border-subtle)] px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="flex h-10 w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  {search && (
                    <button
                      type="button"
                      className="ml-1 inline-flex rounded-sm p-0.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                      onClick={() => setSearch("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* ── Select all / none ── */}
              {selectAll && filteredOptions.length > 0 && (
                <>
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={
                        allFilteredSelected ? deselectAll : selectAllAvailable
                      }
                      className={cn(
                        "flex flex-1 items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-fast ease-out",
                        "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {allFilteredSelected ? (
                        <>
                          <ListX className="h-3.5 w-3.5" />
                          Deselect all
                        </>
                      ) : (
                        <>
                          <ListChecks className="h-3.5 w-3.5" />
                          Select all
                        </>
                      )}
                    </button>
                  </div>
                  <Separator />
                </>
              )}

              {/* ── Options list ── */}
              <ScrollArea className="max-h-[260px]">
                {filteredOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                    <Search className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No results found</p>
                    {search && (
                      <p className="mt-0.5 text-xs opacity-70">
                        Try a different search term
                      </p>
                    )}
                  </div>
                ) : (
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="p-1"
                  >
                    {filteredOptions.map((option) => {
                      const isSelected = selectedValues.includes(option.value);
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          variants={itemVariants}
                          transition={{ duration: 0.12 }}
                          disabled={option.disabled}
                          onClick={() => toggleOption(option.value)}
                          className={cn(
                            "group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[var(--text-primary)] transition-all duration-fast ease-out",
                            "hover:bg-[var(--bg-surface-2)]",
                            isSelected && "bg-[var(--accent-primary)]/5 font-medium",
                            option.disabled &&
                              "pointer-events-none cursor-not-allowed opacity-50"
                          )}
                        >
                          {/* Checkbox indicator */}
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-fast ease-out",
                              isSelected
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] group-hover:border-[var(--accent-primary)]/50"
                            )}
                          >
                            <AnimatePresence initial={false}>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                >
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>

                          {/* Label */}
                          <span className="flex-1 truncate text-left">
                            {option.label}
                          </span>

                          {/* Custom suffix */}
                          {renderItemSuffix?.(option, isSelected)}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </ScrollArea>

              {/* ── Footer ── */}
              {selectedValues.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {selectedValues.length} selected
                    </span>
                    {clearable && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-primary-hover)] hover:underline underline-offset-2"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
