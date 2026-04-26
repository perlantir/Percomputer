"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import {
  ChevronDown,
  Search,
  GitBranch,
  Clock,
  Check,
  Filter,
} from "lucide-react";

export interface WorkflowOption {
  id: string;
  name: string;
  prompt: string;
  status: string;
  createdAt: string;
  version?: number;
  spaceName?: string;
}

interface SelectWorkflowProps {
  workflows: WorkflowOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder?: string;
  label?: string;
  side?: "left" | "right";
  disabledIds?: string[];
  className?: string;
}

export default function SelectWorkflow({
  workflows,
  selectedId,
  onSelect,
  placeholder = "Select workflow…",
  label,
  side = "left",
  disabledIds = [],
  className,
}: SelectWorkflowProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<WorkflowOption[]>(workflows);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFiltered(workflows);
      return;
    }
    setFiltered(
      workflows.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.prompt.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q) ||
          (w.spaceName && w.spaceName.toLowerCase().includes(q))
      )
    );
  }, [search, workflows]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = workflows.find((w) => w.id === selectedId);

  const getStatusColor = React.useCallback((status: string): string => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base: Record<string, string> = {
      completed: "bg-[var(--success)]",
      failed: "bg-[var(--danger)]",
      running: prefersReducedMotion ? "bg-[var(--accent-primary)]" : "bg-[var(--accent-primary)] animate-pulse",
      paused: "bg-[var(--warning)]",
      cancelled: "bg-[var(--text-tertiary)]",
      queued: "bg-[var(--info)]",
      planning: prefersReducedMotion ? "bg-[var(--accent-tertiary)]" : "bg-[var(--accent-tertiary)] animate-pulse",
    };
    return base[status] || "bg-[var(--text-tertiary)]";
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
          {label}
        </label>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left",
          "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30",
          open && "border-[var(--accent-primary)]/40 ring-2 ring-[var(--accent-primary)]/20"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            side === "left" ? "bg-[var(--danger)]" : "bg-[var(--success)]"
          )}
        />
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                {selected.name}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                {selected.prompt.slice(0, 60)}
                {selected.prompt.length > 60 ? "…" : ""}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-[var(--text-tertiary)]">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-[var(--z-dropdown)] mt-1 w-[320px] max-w-[90vw] rounded-xl border border-[var(--border-subtle)]",
            "bg-[var(--bg-surface)] shadow-lg overflow-hidden flex flex-col max-h-[360px]"
          )}
          role="listbox"
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter workflows…"
              className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Count */}
          <div className="px-3 py-1 border-b border-[var(--border-subtle)] flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {filtered.length} of {workflows.length}
            </span>
          </div>

          {/* List */}
          <div className="overflow-auto flex-1 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                No workflows match your search
              </div>
            ) : (
              filtered.map((workflow) => {
                const disabled = disabledIds.includes(workflow.id);
                const isSelected = workflow.id === selectedId;
                return (
                  <button
                    key={workflow.id}
                    role="option"
                    aria-selected={isSelected}
                    disabled={disabled}
                    onClick={() => {
                      onSelect(workflow.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 transition-colors flex items-start gap-2.5",
                      disabled && "opacity-40 cursor-not-allowed",
                      !disabled && "hover:bg-[var(--bg-surface-2)] cursor-pointer",
                      isSelected && "bg-[var(--accent-primary)]/8"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getStatusColor(workflow.status)
                        )}
                      />
                      {isSelected && (
                        <Check className="w-3 h-3 text-[var(--accent-primary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                          {workflow.name}
                        </span>
                        {workflow.version !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface-3)] text-[var(--text-tertiary)] font-mono">
                            v{workflow.version}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                        {workflow.prompt.slice(0, 70)}
                        {workflow.prompt.length > 70 ? "…" : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {workflow.spaceName && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                            <GitBranch className="w-3 h-3" />
                            {workflow.spaceName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                          <Clock className="w-3 h-3" />
                          {formatDate(workflow.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
