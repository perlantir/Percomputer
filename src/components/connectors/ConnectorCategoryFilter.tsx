"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

const CATEGORIES = [
  "All",
  "Google",
  "Microsoft",
  "Communication",
  "Storage",
  "CRM",
  "Database",
  "Development",
  "Finance",
  "Other",
];

interface ConnectorCategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
}

export function ConnectorCategoryFilter({
  value,
  onChange,
}: ConnectorCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === category
              ? "bg-accent-primary text-text-inverse"
              : "bg-surface-2 text-foreground-secondary hover:bg-surface-3 hover:text-foreground-primary border border-border-subtle"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
