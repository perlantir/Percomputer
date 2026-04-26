"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Search, Hammer, BarChart3, Zap } from "lucide-react";

export interface StarterChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  template: string;
}

const CHIPS: StarterChip[] = [
  {
    id: "research",
    label: "Research",
    icon: <Search className="h-3.5 w-3.5" />,
    template:
      "Research the following topic thoroughly and compile a detailed report with sources: ",
  },
  {
    id: "build",
    label: "Build",
    icon: <Hammer className="h-3.5 w-3.5" />,
    template:
      "Build a complete solution for the following requirement. Include code, tests, and documentation: ",
  },
  {
    id: "analyze",
    label: "Analyze",
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    template:
      "Analyze the following data or problem. Provide insights, visual summaries, and actionable recommendations: ",
  },
  {
    id: "automate",
    label: "Automate",
    icon: <Zap className="h-3.5 w-3.5" />,
    template:
      "Automate the following workflow. Define the steps, triggers, and expected outputs: ",
  },
];

export interface StarterChipsProps {
  onSelect: (template: string) => void;
}

export function StarterChips({ onSelect }: StarterChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-5">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onSelect(chip.template)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-fast ease-out",
            "hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] hover:shadow-low",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
          )}
          aria-label={`Start with ${chip.label}`}
        >
          {chip.icon}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
