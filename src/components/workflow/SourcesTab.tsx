"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { SourceCard } from "./SourceCard";
import type { SourceCard as SourceCardType } from "@/src/mock/generators";

export interface SourcesTabProps {
  sources: SourceCardType[];
  onSelectSource?: (source: SourceCardType) => void;
  scrollToSourceId?: string;
}

export function SourcesTab({ sources, onSelectSource, scrollToSourceId }: SourcesTabProps) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [minCited, setMinCited] = useState(0);
  const sourceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const domains = useMemo(
    () => Array.from(new Set(sources.map((s) => s.domain))).sort(),
    [sources]
  );

  const filtered = useMemo(() => {
    let out = sources;
    if (domainFilter) {
      out = out.filter((s) => s.domain === domainFilter);
    }
    if (minCited > 0) {
      out = out.filter((s) => s.cited >= minCited);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q)
      );
    }
    return out;
  }, [sources, domainFilter, minCited, query]);

  /* Scroll to highlighted source */
  useEffect(() => {
    if (scrollToSourceId && sourceRefs.current[scrollToSourceId]) {
      const el = sourceRefs.current[scrollToSourceId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        /* Brief highlight flash */
        el.style.transition = "box-shadow 0.3s ease";
        el.style.boxShadow = "0 0 0 2px var(--accent-primary)";
        const timer = setTimeout(() => {
          el.style.boxShadow = "";
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [scrollToSourceId]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Domain filter */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-[var(--text-tertiary)]" />
          <select
            value={domainFilter ?? ""}
            onChange={(e) => setDomainFilter(e.target.value || null)}
            className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Cited filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-tertiary)]">Min cited:</span>
          <select
            value={minCited}
            onChange={(e) => setMinCited(Number(e.target.value))}
            className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={5}>5+</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-[var(--text-tertiary)]">
        Showing {filtered.length} of {sources.length} sources
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((source) => (
            <div
              key={source.id}
              ref={(el) => { sourceRefs.current[source.id] = el; }}
              className="rounded-lg"
            >
              <SourceCard
                source={source}
                onClick={onSelectSource}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
          <Search className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">No sources match your filters.</p>
        </div>
      )}
    </div>
  );
}
