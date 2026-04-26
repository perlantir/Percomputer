"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import {
  Search,
  Hammer,
  BarChart3,
  Zap,
  Pencil,
  Globe,
  Bug,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface TemplateItem {
  id: string;
  label: string;
  icon: LucideIcon;
  template: string;
  color: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "research",
    label: "Research",
    icon: Search,
    template:
      "Research the following topic thoroughly and compile a detailed report with sources: ",
    color: "var(--accent-primary)",
  },
  {
    id: "build",
    label: "Build",
    icon: Hammer,
    template:
      "Build a complete solution for the following requirement. Include code, tests, and documentation: ",
    color: "var(--semantic-success)",
  },
  {
    id: "analyze",
    label: "Analyze",
    icon: BarChart3,
    template:
      "Analyze the following data or problem. Provide insights, visual summaries, and actionable recommendations: ",
    color: "var(--semantic-info)",
  },
  {
    id: "automate",
    label: "Automate",
    icon: Zap,
    template:
      "Automate the following workflow. Define the steps, triggers, and expected outputs: ",
    color: "var(--semantic-warning)",
  },
  {
    id: "write",
    label: "Write",
    icon: Pencil,
    template:
      "Write polished content for the following topic or brief. Adjust tone and length as needed: ",
    color: "var(--semantic-success)",
  },
  {
    id: "debug",
    label: "Debug",
    icon: Bug,
    template:
      "Debug the following issue. Provide root cause analysis and a step-by-step fix: ",
    color: "var(--semantic-danger)",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: FileText,
    template:
      "Summarize the following content concisely while preserving key details and context: ",
    color: "var(--accent-primary)",
  },
  {
    id: "compare",
    label: "Compare",
    icon: Globe,
    template:
      "Compare the following options side-by-side. Highlight pros, cons, and a recommendation: ",
    color: "var(--semantic-info)",
  },
];

export interface TemplatePickerProps {
  onSelect: (template: string) => void;
  visible?: boolean;
}

/**
 * Inline template chips rendered below the composer textarea.
 */
export function TemplatePicker({
  onSelect,
  visible = true,
}: TemplatePickerProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  if (!visible) return null;

  const handleClick = (item: TemplateItem) => {
    setSelectedId(item.id);
    onSelect(item.template);
    // Reset visual selection after a short delay
    setTimeout(() => setSelectedId((prev) => (prev === item.id ? null : prev)), 400);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        Templates
      </span>
      {TEMPLATES.map((item) => {
        const Icon = item.icon;
        const isActive = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-fast ease-out",
              isActive
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-low"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]",
              "hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] hover:shadow-low",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
            )}
            style={isActive ? { color: item.color } : undefined}
            aria-label={`Apply ${item.label} template`}
            title={item.template.slice(0, 60) + "…"}
          >
            <Icon
              className="h-3 w-3"
              style={isActive ? { color: item.color } : undefined}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
