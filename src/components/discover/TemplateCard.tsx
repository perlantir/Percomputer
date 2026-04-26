"use client";

import * as React from "react";
import { GitFork, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

export interface Template {
  id: string;
  title: string;
  description: string;
  category: "Research" | "Build" | "Analyze" | "Automate";
  icon?: string;
  tags: string[];
  estimatedCost: string;
  estimatedTime: string;
  objective: string;
}

interface TemplateCardProps {
  template: Template;
  onFork: (template: Template) => void;
}

const categoryColors: Record<string, string> = {
  Research: "#3B82F6",
  Build: "#8B5CF6",
  Analyze: "#F59E0B",
  Automate: "#10B981",
};

export const TemplateCard = React.memo(function TemplateCard({ template, onFork }: TemplateCardProps) {
  const color = categoryColors[template.category] ?? "#20B8CD";

  return (
    <div
      className={cn(
        "card flex flex-col gap-4 p-6 transition-all duration-fast ease-out",
        "hover:shadow-[0_10px_15px_-3px_rgb(0_0_0_/0.08)]"
      )}
    >
      {/* Icon placeholder */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Sparkles className="h-6 w-6" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
          {template.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Estimated meta */}
      <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
        <span>~{template.estimatedCost}</span>
        <span className="mx-1">·</span>
        <span>{template.estimatedTime}</span>
      </div>

      {/* Fork button */}
      <Button
        variant="secondary"
        className="mt-auto w-full"
        onClick={() => onFork(template)}
      >
        <GitFork className="mr-2 h-4 w-4" />
        Fork
      </Button>
    </div>
  );
});
