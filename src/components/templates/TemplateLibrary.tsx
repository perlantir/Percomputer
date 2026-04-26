"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  X,
  GitFork,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  WORKFLOW_TEMPLATES,
  CATEGORY_META,
  type WorkflowTemplate,
  type TemplateCategory,
  getAllCategories,
  searchTemplates,
} from "@/src/data/templates";
import { TemplateCard } from "./TemplateCard";

interface TemplateLibraryProps {
  onFork: (template: WorkflowTemplate) => void;
  onPreview?: (template: WorkflowTemplate) => void;
  className?: string;
}

type ViewMode = "grid" | "list";

export function TemplateLibrary({
  onFork,
  onPreview,
  className,
}: TemplateLibraryProps) {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<TemplateCategory | "All">("All");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [isSearching, setIsSearching] = React.useState(false);

  const allCategories = React.useMemo(() => getAllCategories(), []);

  const filtered = React.useMemo(() => {
    let results = WORKFLOW_TEMPLATES;

    if (activeCategory !== "All") {
      results = results.filter((t) => t.category === activeCategory);
    }

    if (query.trim()) {
      results = searchTemplates(query).filter((t) =>
        activeCategory === "All" ? true : t.category === activeCategory
      );
    }

    return results;
  }, [query, activeCategory]);

  const handleClearSearch = () => {
    setQuery("");
    setIsSearching(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Template Library
          </h2>
          <span className="rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)]">
            {WORKFLOW_TEMPLATES.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search templates..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearching(e.target.value.length > 0);
              }}
              className={cn(
                "h-9 pl-9 pr-8 text-sm",
                "bg-[var(--bg-surface-2)] border-[var(--border-default)]",
                "focus-visible:ring-[var(--accent-primary)]/40"
              )}
            />
            {isSearching && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="hidden sm:flex items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-2)] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        <Button
          variant={activeCategory === "All" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveCategory("All")}
          className={cn(
            "shrink-0 rounded-full h-8 px-3 text-xs",
            activeCategory === "All"
              ? ""
              : "border-[var(--border-default)] bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)]"
          )}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          All
        </Button>

        {allCategories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? "All" : cat)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-medium transition-all duration-200",
                "border",
                isActive
                  ? "text-[var(--text-inverse)] border-transparent"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]"
              )}
              style={
                isActive
                  ? { backgroundColor: meta.color, borderColor: meta.color }
                  : undefined
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isActive ? "currentColor" : meta.color }}
              />
              {meta.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0 text-[10px] font-semibold",
                  isActive ? "bg-white/20" : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
                )}
              >
                {WORKFLOW_TEMPLATES.filter((t) => t.category === cat).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span>
          {query.trim() ? (
            <>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;
              <span className="font-medium text-[var(--text-secondary)]">{query}</span>&rdquo;
            </>
          ) : activeCategory === "All" ? (
            <>Showing all {filtered.length} templates</>
          ) : (
            <>
              {filtered.length} template{filtered.length !== 1 ? "s" : ""} in{" "}
              <span className="font-medium text-[var(--text-secondary)]">{activeCategory}</span>
            </>
          )}
        </span>
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] py-16">
          <Search className="h-8 w-8 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No templates match your search
          </p>
          <Button variant="secondary" size="sm" onClick={handleClearSearch}>
            Clear filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              onFork={onFork}
              onPreview={onPreview}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((template, i) => (
            <TemplateListRow
              key={template.id}
              template={template}
              onFork={onFork}
              onPreview={onPreview}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** ── List row variant ─────────────────────────────────────────────────────── */

const TemplateListRow = React.memo(function TemplateListRow({
  template,
  onFork,
  onPreview,
  index = 0,
}: {
  template: WorkflowTemplate;
  onFork: (template: WorkflowTemplate) => void;
  onPreview?: (template: WorkflowTemplate) => void;
  index?: number;
}) {
  const meta = CATEGORY_META[template.category];

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-center sm:gap-4",
        "transition-all duration-200 ease-out",
        "hover:border-[var(--accent-primary)]/30 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]",
        "dark:hover:border-[var(--accent-primary)]/20 dark:hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)]"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Icon + Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          <span className="text-lg" style={{ color: meta.color }}>
            {template.icon.charAt(0)}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {template.title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {template.description}
          </p>
        </div>
      </div>

      {/* Category badge */}
      <span
        className="self-start sm:self-center inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider shrink-0"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] shrink-0">
        <span>{template.estimatedCost}</span>
        <span className="text-[var(--border-default)]">|</span>
        <span>{template.estimatedTime}</span>
        <span className="text-[var(--border-default)]">|</span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          {template.forks.toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          className="h-8"
          onClick={() => onFork(template)}
        >
          Fork
        </Button>
        {onPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onPreview(template)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

