"use client";

import React, { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/src/lib/utils";
import { ConsoleErrorBoundary } from "@/src/components/console/ConsoleErrorBoundary";
import { ConsolePageSkeleton } from "@/src/components/ui/page-skeletons";
import ConsoleNav, { ConsolePage } from "@/src/components/console/ConsoleNav";

const WorkflowInspector = dynamic(
  () => import("@/src/components/console/WorkflowInspector"),
  { ssr: false }
);
const PlanDiffViewer = dynamic(
  () => import("@/src/components/console/PlanDiffViewer"),
  { ssr: false }
);
const CostQualityLeaderboard = dynamic(
  () => import("@/src/components/console/CostQualityLeaderboard"),
  { ssr: false }
);
const RoutingPolicyEditor = dynamic(
  () => import("@/src/components/console/RoutingPolicyEditor"),
  { ssr: false }
);
const SandboxPool = dynamic(
  () => import("@/src/components/console/SandboxPool"),
  { ssr: false }
);
const ProviderHealth = dynamic(
  () => import("@/src/components/console/ProviderHealth"),
  { ssr: false }
);
const AuditExplorer = dynamic(
  () => import("@/src/components/console/AuditExplorer"),
  { ssr: false }
);
const TenantAdmin = dynamic(
  () => import("@/src/components/console/TenantAdmin"),
  { ssr: false }
);

const pageComponents: Record<ConsolePage, React.ComponentType> = {
  "workflow-inspector": WorkflowInspector,
  "plan-diff": PlanDiffViewer,
  "cost-quality": CostQualityLeaderboard,
  "routing-policy": RoutingPolicyEditor,
  "sandbox-pool": SandboxPool,
  "provider-health": ProviderHealth,
  "audit-explorer": AuditExplorer,
  "tenant-admin": TenantAdmin,
};

const pageLabels: Record<ConsolePage, string> = {
  "workflow-inspector": "Workflow Inspector",
  "plan-diff": "Plan Diff Viewer",
  "cost-quality": "Cost & Quality Leaderboard",
  "routing-policy": "Routing Policy Editor",
  "sandbox-pool": "Sandbox Pool",
  "provider-health": "Provider Health",
  "audit-explorer": "Audit Explorer",
  "tenant-admin": "Tenant Admin",
};

const orgs = [
  { id: "org-acme", name: "Acme Corp" },
  { id: "org-stark", name: "Stark Industries" },
  { id: "org-wayne", name: "Wayne Enterprises" },
  { id: "org-oscorp", name: "Oscorp" },
];

export default function ConsolePage() {
  const [activePage, setActivePage] = useState<ConsolePage>("workflow-inspector");
  const [selectedOrg, setSelectedOrg] = useState(orgs[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ActiveComponent = pageComponents[activePage];

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-foreground-primary overflow-hidden">
      {/* Dense header */}
      <header className="h-10 flex-shrink-0 flex items-center px-3 border-b border-border-subtle bg-surface z-20">
        <div className="flex items-center gap-2 mr-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span className="text-[13px] font-semibold tracking-tight text-foreground-primary">
            Operator Console
          </span>
        </div>

        {/* Mobile nav toggle */}
        <button
          onClick={() => setMobileNavOpen((s) => !s)}
          className="lg:hidden mr-3 p-1 rounded hover:bg-[var(--bg-hover)] text-foreground-tertiary"
          aria-label="Toggle navigation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Org selector */}
        <div className="hidden md:flex items-center gap-1.5 mr-6">
          <span className="text-[10px] text-foreground-tertiary uppercase font-semibold">Org</span>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="text-[11px] bg-[var(--bg-canvas)] border border-border-subtle rounded px-2 py-0.5 text-foreground-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* User role */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-[10px] text-foreground-tertiary uppercase font-semibold">Role</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-accent-primary/15 text-accent-primary border border-accent-primary/25 font-medium">
            operator
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-foreground-tertiary">v2.4.1</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full bg-success",
              typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "animate-pulse"
            )} />
            <span className="text-[10px] text-foreground-tertiary">All systems operational</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center text-[10px] font-semibold text-accent-primary">
            OP
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-shrink-0", mobileNavOpen ? "block" : "hidden", "lg:block")}>
          <ConsoleNav active={activePage} onChange={(page) => { setActivePage(page); setMobileNavOpen(false); }} />
        </div>
        <main className="flex-1 overflow-hidden bg-canvas">
          <ConsoleErrorBoundary key={activePage} label={pageLabels[activePage]}>
            <Suspense fallback={<ConsolePageSkeleton />}>
              <ActiveComponent />
            </Suspense>
          </ConsoleErrorBoundary>
        </main>
      </div>
    </div>
  );
}
