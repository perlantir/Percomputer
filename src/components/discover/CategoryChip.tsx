"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

export const CategoryChip = React.memo(function CategoryChip({ label, active, onClick, count }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-fast ease-out",
        active
          ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
          : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]"
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
            active ? "bg-[var(--text-inverse)]/20 text-[var(--text-inverse)]" : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
});
