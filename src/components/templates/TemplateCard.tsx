"use client";

import * as React from "react";
import {
  GitFork,
  Clock,
  DollarSign,
  Zap,
  ArrowRight,
  Search,
  TrendingUp,
  Code,
  GitCompare,
  Target,
  FileText,
  ShieldAlert,
  CheckCircle,
  BarChart3,
  FileSignature,
  BookOpen,
  Activity,
  Users,
  Link,
  Calendar,
  PieChart,
  Plug,
  Lightbulb,
  Newspaper,
  Shield,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  CATEGORY_META,
  type WorkflowTemplate,
} from "@/src/data/templates";

interface TemplateCardProps {
  template: WorkflowTemplate;
  onFork: (template: WorkflowTemplate) => void;
  onPreview?: (template: WorkflowTemplate) => void;
  index?: number;
}

/** Static icon map for template category icons. */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  TrendingUp,
  Code,
  GitCompare,
  Target,
  FileText,
  ShieldAlert,
  CheckCircle,
  BarChart3,
  FileSignature,
  BookOpen,
  Activity,
  Users,
  Link,
  Calendar,
  PieChart,
  Plug,
  Lightbulb,
  Newspaper,
  Shield,
};

function TemplateIcon({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  const Icon = iconMap[name] ?? iconMap["Search"];
  if (!Icon) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg shrink-0",
        size === "md" ? "h-12 w-12" : "h-10 w-10"
      )}
      style={{ backgroundColor: `${color}18` }}
    >
      <Icon className={cn(size === "md" ? "h-6 w-6" : "h-5 w-5")} style={{ color }} />
    </div>
  );
}

export function TemplateCard({
  template,
  onFork,
  onPreview,
  index = 0,
}: TemplateCardProps) {
  const meta = CATEGORY_META[template.category];
  const color = meta.color;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5",
        "transition-all duration-300 ease-out",
        "hover:border-[var(--accent-primary)]/30 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)]",
        "dark:hover:border-[var(--accent-primary)]/20 dark:hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)]",
        "focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/40"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <TemplateIcon name={template.icon} color={color} />

        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">
            {template.title}
          </h3>
          <span
            className="inline-flex items-center self-start rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: meta.bg,
              color: meta.color,
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
        {template.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {template.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]"
          >
            {tag}
          </span>
        ))}
        {template.tags.length > 3 && (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]">
            +{template.tags.length - 3}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
        <span className="inline-flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {template.estimatedCost}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {template.estimatedTime}
        </span>
        {template.forks > 0 && (
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {template.forks.toLocaleString()}
          </span>
        )}
      </div>

      {/* CTA row */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onFork(template)}
          aria-label={`Fork template: ${template.title}`}
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          Fork
        </Button>
        {onPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => onPreview(template)}
            aria-label={`Preview template: ${template.title}`}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hover accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />
    </article>
  );
}
