"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";

export type ConsolePage =
  | "workflow-inspector"
  | "plan-diff"
  | "cost-quality"
  | "routing-policy"
  | "sandbox-pool"
  | "provider-health"
  | "audit-explorer"
  | "tenant-admin";

interface ConsoleNavProps {
  active: ConsolePage;
  onChange: (page: ConsolePage) => void;
}

interface NavItem {
  id: ConsolePage;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  {
    id: "workflow-inspector",
    label: "Workflow Inspector",
    section: "Execution",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: "plan-diff",
    label: "Plan Diff",
    section: "Execution",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11l2.5 2.5L8 16"/><path d="M16 11l-2.5 2.5L16 16"/>
      </svg>
    ),
  },
  {
    id: "cost-quality",
    label: "Cost & Quality",
    section: "Optimization",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
      </svg>
    ),
  },
  {
    id: "routing-policy",
    label: "Routing Policy",
    section: "Optimization",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: "sandbox-pool",
    label: "Sandbox Pool",
    section: "Infrastructure",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/><path d="M2 12h20"/>
      </svg>
    ),
  },
  {
    id: "provider-health",
    label: "Provider Health",
    section: "Infrastructure",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    id: "audit-explorer",
    label: "Audit Explorer",
    section: "Compliance",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    id: "tenant-admin",
    label: "Tenant Admin",
    section: "Compliance",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const sections = Array.from(new Set(navItems.map((i) => i.section).filter(Boolean)));

export default function ConsoleNav({ active, onChange }: ConsoleNavProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <nav className="w-52 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col h-full">
      <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
        <div className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
          Console
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => {
          const items = navItems.filter((i) => i.section === section);
          const isCollapsed = collapsed[section || ""];

          return (
            <div key={section} className="mb-1">
              <button
                onClick={() => toggleSection(section || "")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] w-full"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "transition-transform duration-150",
                    isCollapsed && "-rotate-90"
                  )}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {section}
              </button>

              {!isCollapsed && (
                <div className="mt-0.5">
                  {items.map((item) => {
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium transition-colors duration-fast",
                          isActive
                            ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0",
                            isActive ? "text-[var(--text-inverse)]" : "text-[var(--text-tertiary)]"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1 h-1 rounded-full bg-[var(--text-inverse)]/60 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
        <div className="text-[10px] text-[var(--text-tertiary)]">
          v2.4.1-console
        </div>
      </div>
    </nav>
  );
}
