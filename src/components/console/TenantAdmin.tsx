"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable } from "./ConsoleTable";
import { useConsoleRole, confirmAction } from "@/src/hooks/useConsoleRole";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Shield } from "lucide-react";

interface OrgOverride {
  id: string;
  orgId: string;
  orgName: string;
  residency: string;
  allowedProviders: string[];
  creditBalance: number;
  creditMonthlyLimit: number;
  impersonationEnabled: boolean;
  maxConcurrentWorkflows: number;
  piiRedactionLevel: "strict" | "standard" | "none";
}

const demoOrgs: OrgOverride[] = [
  {
    id: "o1",
    orgId: "org-acme",
    orgName: "Acme Corp",
    residency: "us-east-1",
    allowedProviders: ["openai", "anthropic", "google"],
    creditBalance: 45230.50,
    creditMonthlyLimit: 100000,
    impersonationEnabled: false,
    maxConcurrentWorkflows: 100,
    piiRedactionLevel: "standard",
  },
  {
    id: "o2",
    orgId: "org-stark",
    orgName: "Stark Industries",
    residency: "us-west-2",
    allowedProviders: ["openai", "anthropic", "google", "mistral", "groq", "deepseek"],
    creditBalance: 128900.00,
    creditMonthlyLimit: 250000,
    impersonationEnabled: true,
    maxConcurrentWorkflows: 500,
    piiRedactionLevel: "strict",
  },
  {
    id: "o3",
    orgId: "org-wayne",
    orgName: "Wayne Enterprises",
    residency: "eu-west-1",
    allowedProviders: ["openai", "anthropic"],
    creditBalance: 8920.30,
    creditMonthlyLimit: 50000,
    impersonationEnabled: false,
    maxConcurrentWorkflows: 50,
    piiRedactionLevel: "strict",
  },
  {
    id: "o4",
    orgId: "org-oscorp",
    orgName: "Oscorp",
    residency: "us-east-1",
    allowedProviders: ["google", "mistral", "deepseek"],
    creditBalance: 12340.80,
    creditMonthlyLimit: 75000,
    impersonationEnabled: true,
    maxConcurrentWorkflows: 200,
    piiRedactionLevel: "none",
  },
  {
    id: "o5",
    orgId: "org-daily-bugle",
    orgName: "Daily Bugle",
    residency: "us-east-1",
    allowedProviders: ["groq", "deepseek"],
    creditBalance: 2100.00,
    creditMonthlyLimit: 10000,
    impersonationEnabled: false,
    maxConcurrentWorkflows: 20,
    piiRedactionLevel: "standard",
  },
];

const allProviders = ["openai", "anthropic", "google", "mistral", "groq", "deepseek", "azure-openai"];

export default function TenantAdmin() {
  const [orgs, setOrgs] = useState(demoOrgs);
  const [editingCredit, setEditingCredit] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState("");
  const [impersonateLog, setImpersonateLog] = useState<string[]>([]);
  const { isAdmin } = useConsoleRole();

  const toggleProvider = (orgId: string, provider: string) => {
    if (!isAdmin) return;
    const org = orgs.find((o) => o.orgId === orgId);
    if (!org) return;
    const has = org.allowedProviders.includes(provider);
    if (!confirmAction(`${has ? "Remove" : "Add"} provider "${provider}" for ${org.orgName}?`)) {
      return;
    }
    setOrgs((prev) =>
      prev.map((o) => {
        if (o.orgId !== orgId) return o;
        return {
          ...o,
          allowedProviders: has
            ? o.allowedProviders.filter((p) => p !== provider)
            : [...o.allowedProviders, provider],
        };
      })
    );
  };

  const handleCreditSave = (orgId: string) => {
    if (!isAdmin) return;
    const val = parseFloat(creditInput);
    const org = orgs.find((o) => o.orgId === orgId);
    if (!isNaN(val) && org) {
      if (!confirmAction(`Update credit balance for ${org.orgName} to $${val.toFixed(2)}?`)) {
        setEditingCredit(null);
        setCreditInput("");
        return;
      }
      setOrgs((prev) =>
        prev.map((o) => (o.orgId === orgId ? { ...o, creditBalance: val } : o))
      );
    }
    setEditingCredit(null);
    setCreditInput("");
  };

  const handleImpersonate = (orgName: string) => {
    if (!isAdmin) return;
    if (!confirmAction(`Impersonate organization "${orgName}"? This will be logged.`)) {
      return;
    }
    const log = `[${new Date().toISOString()}] Impersonated ${orgName} — logged for audit`;
    setImpersonateLog((prev) => [log, ...prev].slice(0, 20));
  };

  const columns = [
    {
      key: "orgName",
      header: "Organization",
      width: 130,
      sortable: true,
      render: (row: OrgOverride) => (
        <div>
          <div className="text-[11px] font-semibold text-[var(--text-primary)]">{row.orgName}</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{row.orgId}</div>
        </div>
      ),
    },
    {
      key: "residency",
      header: "Residency",
      width: 90,
      sortable: true,
      render: (row: OrgOverride) => (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] font-mono">
          {row.residency}
        </span>
      ),
    },
    {
      key: "allowedProviders",
      header: "Providers",
      width: 260,
      render: (row: OrgOverride) => (
        <div className="flex flex-wrap gap-1">
          {allProviders.map((p) => (
            <button
              key={p}
              onClick={() => toggleProvider(row.orgId, p)}
              disabled={!isAdmin}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                row.allowedProviders.includes(p)
                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/25"
                  : "bg-transparent border-[var(--border-subtle)] text-[var(--text-tertiary)]",
                !isAdmin && "opacity-50 cursor-not-allowed"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: "creditBalance",
      header: "Credits",
      width: 100,
      align: "right" as const,
      sortable: true,
      render: (row: OrgOverride) => {
        if (editingCredit === row.orgId) {
          return (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={creditInput}
                onChange={(e) => setCreditInput(e.target.value)}
                className="w-16 px-1 py-0.5 text-[10px] font-mono bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreditSave(row.orgId);
                  if (e.key === "Escape") setEditingCredit(null);
                }}
              />
              <button
                onClick={() => handleCreditSave(row.orgId)}
                className="text-[10px] text-[var(--accent-primary)] hover:underline"
              >
                save
              </button>
            </div>
          );
        }
        return (
          <button
            onClick={() => {
              if (!isAdmin) return;
              setEditingCredit(row.orgId);
              setCreditInput(String(row.creditBalance));
            }}
            disabled={!isAdmin}
            className={cn(
              "font-mono text-[var(--text-secondary)] hover:text-[var(--accent-primary)] text-right w-full",
              !isAdmin && "opacity-50 cursor-not-allowed hover:text-[var(--text-secondary)]"
            )}
          >
            ${row.creditBalance.toFixed(2)}
          </button>
        );
      },
    },
    {
      key: "creditMonthlyLimit",
      header: "Monthly",
      width: 70,
      align: "right" as const,
      sortable: true,
      render: (row: OrgOverride) => (
        <span className="font-mono text-[var(--text-secondary)]">
          ${row.creditMonthlyLimit.toLocaleString()}
        </span>
      ),
    },
    {
      key: "maxConcurrentWorkflows",
      header: "Concurrent",
      width: 55,
      align: "right" as const,
      sortable: true,
      render: (row: OrgOverride) => (
        <span className="font-mono">{row.maxConcurrentWorkflows}</span>
      ),
    },
    {
      key: "piiRedactionLevel",
      header: "PII",
      width: 65,
      sortable: true,
      render: (row: OrgOverride) => (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border",
            row.piiRedactionLevel === "strict" && "bg-danger/15 text-danger border-danger/25",
            row.piiRedactionLevel === "standard" && "bg-warning/15 text-warning border-warning/25",
            row.piiRedactionLevel === "none" && "bg-success/15 text-success border-success/25"
          )}
        >
          {row.piiRedactionLevel}
        </span>
      ),
    },
    {
      key: "impersonation",
      header: "Impersonate",
      width: 70,
      render: (row: OrgOverride) => (
        <button
          onClick={() => handleImpersonate(row.orgName)}
          disabled={!isAdmin || !row.impersonationEnabled}
          className={cn(
            "text-[10px] px-2 py-0.5 rounded border transition-colors",
            row.impersonationEnabled
              ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/25 hover:bg-[var(--accent-primary)]/25"
              : "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)] border-[var(--text-tertiary)]/20 cursor-not-allowed",
            !isAdmin && "opacity-50 cursor-not-allowed"
          )}
        >
          {row.impersonationEnabled ? "login as" : "disabled"}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Orgs:</span>{" "}
          <span className="font-mono text-[var(--text-secondary)]">{orgs.length}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Total credits:</span>{" "}
          <span className="font-mono text-[var(--text-secondary)]">
            ${orgs.reduce((a, o) => a + o.creditBalance, 0).toFixed(2)}
          </span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Impersonation enabled:</span>{" "}
          <span className="font-mono text-[var(--accent-primary)]">
            {orgs.filter((o) => o.impersonationEnabled).length}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <ConsoleTable columns={columns} data={orgs} maxHeight={800} />
        </div>

        {/* Impersonation log */}
        <div className="w-56 flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">
              Impersonation Log
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {impersonateLog.length === 0 ? (
              <EmptyState
                variant="no-data"
                icon={Shield}
                title="No impersonation events"
                description="Impersonation actions will appear here when performed."
                className="py-6 px-1"
              />
            ) : (
              impersonateLog.map((log, i) => (
                <div
                  key={i}
                  className="text-[9px] font-mono text-[var(--text-secondary)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded px-1.5 py-1"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
