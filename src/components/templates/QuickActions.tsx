"use client";

import * as React from "react";
import {
  Plus,
  Zap,
  Search,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  WORKFLOW_TEMPLATES,
  type WorkflowTemplate,
} from "@/src/data/templates";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

interface QuickActionsProps {
  /** Called when a quick-action template is chosen. */
  onForkTemplate: (template: WorkflowTemplate) => void;
  /** Called for generic "new workflow" action. */
  onNewWorkflow?: () => void;
  /** Called for generic "search" action. */
  onSearch?: () => void;
  className?: string;
}

const HOT_TEMPLATES = [
  "tmpl-python-scraper",
  "tmpl-security-audit",
  "tmpl-unit-tests",
  "tmpl-data-viz-dashboard",
  "tmpl-competitive-analysis",
  "tmpl-sentiment-pipeline",
];

export function QuickActions({
  onForkTemplate,
  onNewWorkflow,
  onSearch,
  className,
}: QuickActionsProps) {
  const [expanded, setExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  /* Close on outside click or Escape */
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [expanded]);

  /* Shortcut: Cmd/Ctrl + Shift + A */
  React.useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setExpanded((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const hotTemplates = React.useMemo(
    () =>
      HOT_TEMPLATES.map((id) => WORKFLOW_TEMPLATES.find((t) => t.id === id)).filter(
        Boolean
      ) as WorkflowTemplate[],
    []
  );

  const quickActions: QuickAction[] = [
    {
      id: "new",
      label: "New workflow",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "N",
      onClick: () => {
        onNewWorkflow?.();
        setExpanded(false);
      },
      variant: "primary",
    },
    {
      id: "search",
      label: "Search templates",
      icon: <Search className="h-4 w-4" />,
      shortcut: "/",
      onClick: () => {
        onSearch?.();
        setExpanded(false);
      },
      variant: "secondary",
    },
  ];

  return (
    <div
      ref={containerRef}
      className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3", className)}
    >
      {/* Expanded menu */}
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300 ease-out",
          expanded
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Quick actions */}
        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                action.variant === "primary"
                  ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary-hover)]"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
              )}
            >
              {action.icon}
              <span className="flex-1 text-left">{action.label}</span>
              {action.shortcut && (
                <kbd className="hidden sm:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-surface)] border border-[var(--border-default)]">
                  {action.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>

        {/* Hot templates */}
        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 px-2 pt-1 pb-1">
            <Zap className="h-3.5 w-3.5 text-[var(--accent-tertiary)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Hot templates
            </span>
          </div>
          {hotTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onForkTemplate(template);
                setExpanded(false);
              }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-2)]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-2)]">
                <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium leading-tight">{template.title}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {template.estimatedCost} · {template.estimatedTime}
                </span>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* FAB toggle */}
      <Button
        variant="primary"
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-[0_4px_16px_-4px_rgba(32,184,205,0.4)]",
          "transition-all duration-300 ease-out",
          "hover:scale-105 hover:shadow-[0_6px_20px_-4px_rgba(32,184,205,0.5)]",
          expanded && "rotate-45"
        )}
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={expanded ? "Close quick actions" : "Open quick actions"}
        aria-expanded={expanded}
      >
        {expanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}

/** ── Inline quick-action bar (non-floating) ──────────────────────────────── */

interface QuickActionBarProps {
  onForkTemplate: (template: WorkflowTemplate) => void;
  onNewWorkflow?: () => void;
  className?: string;
}

export function QuickActionBar({
  onForkTemplate,
  onNewWorkflow,
  className,
}: QuickActionBarProps) {
  const hotTemplates = React.useMemo(
    () =>
      HOT_TEMPLATES.slice(0, 4).map((id) =>
        WORKFLOW_TEMPLATES.find((t) => t.id === id)
      ).filter(Boolean) as WorkflowTemplate[],
    []
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 overflow-x-auto",
        className
      )}
    >
      <Button
        variant="primary"
        size="sm"
        className="shrink-0 rounded-lg"
        onClick={onNewWorkflow}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New
      </Button>

      <div className="h-6 w-px bg-[var(--border-default)] shrink-0" />

      {hotTemplates.map((template) => (
        <button
          key={template.id}
          onClick={() => onForkTemplate(template)}
          className={cn(
            "shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)]",
            "transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          )}
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
          {template.title}
        </button>
      ))}
    </div>
  );
}
