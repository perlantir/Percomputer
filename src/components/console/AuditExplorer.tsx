"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill } from "./ConsoleTable";
import { useDebounceValue } from "@/src/hooks/useInterval";
import { useConsoleRole } from "@/src/hooks/useConsoleRole";

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  orgId: string;
  orgName: string;
  userId: string;
  userEmail: string;
  workflowId?: string;
  workflowName?: string;
  taskId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  hash: string;
  prevHash: string;
  verified: boolean;
  ip: string;
  userAgent: string;
}

function generateHashChain(count: number): AuditEvent[] {
  const events: AuditEvent[] = [];
  const eventTypes = [
    "workflow.start", "workflow.complete", "workflow.fail", "task.retry",
    "auth.login", "auth.logout", "policy.change", "pii.access",
    "model.dispatch", "sandbox.create", "sandbox.destroy", "tenant.config",
    "user.impersonate", "billing.charge", "api.key.rotate",
  ];
  const actions = ["created", "updated", "deleted", "accessed", "executed", "approved", "rejected"];
  const resources = ["workflow", "task", "policy", "tenant", "user", "api_key", "sandbox", "model_route"];
  const orgs = [
    { id: "org-acme", name: "Acme Corp" },
    { id: "org-stark", name: "Stark Industries" },
    { id: "org-wayne", name: "Wayne Enterprises" },
    { id: "org-oscorp", name: "Oscorp" },
  ];
  const users = [
    { id: "u-1", email: "admin@acme.com" },
    { id: "u-2", email: "ops@stark.com" },
    { id: "u-3", email: "engineer@wayne.com" },
    { id: "u-4", email: "auditor@oscorp.com" },
    { id: "u-5", email: "support@platform.internal" },
  ];

  let prevHash = "0" + "a".repeat(63);

  for (let i = 0; i < count; i++) {
    const ts = new Date(Date.now() - i * 1000 * 60 * (Math.random() * 30 + 5));
    const org = orgs[i % orgs.length];
    const user = users[i % users.length];
    const type = eventTypes[i % eventTypes.length];
    const hash = "sha256:" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

    events.push({
      id: `evt-${String(i).padStart(5, "0")}`,
      timestamp: ts.toISOString(),
      eventType: type,
      orgId: org.id,
      orgName: org.name,
      userId: user.id,
      userEmail: user.email,
      workflowId: type.startsWith("workflow") || type.startsWith("task") || type.startsWith("model")
        ? `wf-${String(Math.floor(Math.random() * 1000)).padStart(4, "0")}`
        : undefined,
      workflowName: type.startsWith("workflow") || type.startsWith("task")
        ? ["search", "analytics", "support", "code-review", "deploy"][i % 5]
        : undefined,
      taskId: type.startsWith("task")
        ? `task-${String(Math.floor(Math.random() * 100)).padStart(3, "0")}`
        : undefined,
      action: actions[i % actions.length],
      resource: resources[i % resources.length],
      details: { reason: "automated", source: "orchestrator" },
      hash,
      prevHash,
      verified: Math.random() > 0.05, // 95% verified
      ip: `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      userAgent: "Mozilla/5.0 (internal-agent)",
    });

    prevHash = hash;
  }

  return events;
}

const allEvents = generateHashChain(50);

export default function AuditExplorer() {
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [orgFilter, setOrgFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [workflowFilter, setWorkflowFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const { isAdmin } = useConsoleRole();

  const debouncedSearch = useDebounceValue(search, 200);
  const debouncedWorkflowFilter = useDebounceValue(workflowFilter, 200);

  const eventTypes = useMemo(() => Array.from(new Set(allEvents.map((e) => e.eventType))), []);
  const orgs = useMemo(() => Array.from(new Set(allEvents.map((e) => e.orgId))), []);
  const users = useMemo(() => Array.from(new Set(allEvents.map((e) => e.userEmail))), []);

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match =
          e.id.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q) ||
          e.userEmail.toLowerCase().includes(q) ||
          e.orgName.toLowerCase().includes(q) ||
          (e.workflowName && e.workflowName.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (eventTypeFilter.length && !eventTypeFilter.includes(e.eventType)) return false;
      if (orgFilter.length && !orgFilter.includes(e.orgId)) return false;
      if (userFilter.length && !userFilter.includes(e.userEmail)) return false;
      if (debouncedWorkflowFilter && (!e.workflowName || !e.workflowName.includes(debouncedWorkflowFilter))) return false;
      if (dateFrom && new Date(e.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.timestamp) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [debouncedSearch, eventTypeFilter, orgFilter, userFilter, debouncedWorkflowFilter, dateFrom, dateTo]);

  const exportCSV = () => {
    if (!isAdmin) return;
    const headers = ["id", "timestamp", "eventType", "org", "user", "action", "resource", "hash", "verified"];
    const rows = filtered.map((e) =>
      [e.id, e.timestamp, e.eventType, e.orgName, e.userEmail, e.action, e.resource, e.hash, e.verified].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "verified",
      header: "",
      width: 24,
      render: (row: AuditEvent) => (
        <div className="flex justify-center">
          {row.verified ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
      ),
    },
    {
      key: "id",
      header: "ID",
      width: 70,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="font-mono text-[10px] text-[var(--accent-primary)]">{row.id}</span>
      ),
    },
    {
      key: "timestamp",
      header: "Time",
      width: 130,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="font-mono text-[10px] text-[var(--text-secondary)]">
          {row.timestamp.slice(0, 19).replace("T", " ")}
        </span>
      ),
    },
    {
      key: "eventType",
      header: "Type",
      width: 100,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] font-mono">
          {row.eventType}
        </span>
      ),
    },
    {
      key: "orgName",
      header: "Org",
      width: 100,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="text-[11px] text-[var(--text-secondary)]">{row.orgName}</span>
      ),
    },
    {
      key: "userEmail",
      header: "User",
      width: 130,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="text-[11px] text-[var(--text-secondary)]">{row.userEmail}</span>
      ),
    },
    {
      key: "workflowName",
      header: "Workflow",
      width: 80,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="text-[11px] text-[var(--text-tertiary)]">{row.workflowName || "—"}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      width: 60,
      sortable: true,
      render: (row: AuditEvent) => <StatusPill status={row.action === "deleted" ? "failed" : row.action === "created" ? "success" : "running"} />,
    },
    {
      key: "resource",
      header: "Resource",
      width: 80,
      sortable: true,
      render: (row: AuditEvent) => (
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{row.resource}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <input
          type="text"
          placeholder="Search audit events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 text-[11px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-md w-48 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        />
        <button
          onClick={exportCSV}
          disabled={!isAdmin}
          className={cn(
            "px-3 py-1 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors",
            !isAdmin && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          Export CSV
        </button>
        <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">
          Showing <span className="font-mono text-[var(--text-secondary)]">{filtered.length}</span> of{" "}
          <span className="font-mono text-[var(--text-secondary)]">{allEvents.length}</span>
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-auto p-2 space-y-3">
          {/* Event type */}
          <div>
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-1">Event Type</div>
            <div className="space-y-0.5">
              {eventTypes.map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer hover:bg-[var(--bg-hover)] rounded px-1 py-0.5">
                  <input
                    type="checkbox"
                    checked={eventTypeFilter.includes(t)}
                    onChange={() =>
                      setEventTypeFilter((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                    }
                    className="w-3 h-3 accent-[var(--accent-primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Org */}
          <div>
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-1">Organization</div>
            <div className="space-y-0.5">
              {orgs.map((o) => (
                <label key={o} className="flex items-center gap-1.5 cursor-pointer hover:bg-[var(--bg-hover)] rounded px-1 py-0.5">
                  <input
                    type="checkbox"
                    checked={orgFilter.includes(o)}
                    onChange={() =>
                      setOrgFilter((prev) =>
                        prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
                      )
                    }
                    className="w-3 h-3 accent-[var(--accent-primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)]">{allEvents.find((e) => e.orgId === o)?.orgName || o}</span>
                </label>
              ))}
            </div>
          </div>

          {/* User */}
          <div>
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-1">User</div>
            <div className="space-y-0.5">
              {users.map((u) => (
                <label key={u} className="flex items-center gap-1.5 cursor-pointer hover:bg-[var(--bg-hover)] rounded px-1 py-0.5">
                  <input
                    type="checkbox"
                    checked={userFilter.includes(u)}
                    onChange={() =>
                      setUserFilter((prev) =>
                        prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
                      )
                    }
                    className="w-3 h-3 accent-[var(--accent-primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)]">{u}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-1">Date Range</div>
            <div className="space-y-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-1.5 py-0.5 text-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)]"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-1.5 py-0.5 text-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Workflow */}
          <div>
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-1">Workflow</div>
            <input
              type="text"
              placeholder="Filter…"
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 flex flex-col min-w-0">
          <ConsoleTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => {
              setSelectedEvent(row);
              setShowDrawer(true);
            }}
            selectedRowId={selectedEvent?.id}
            rowIdKey="id"
            maxHeight={800}
          />
        </div>

        {/* Detail drawer */}
        {showDrawer && selectedEvent && (
          <div className="w-[420px] flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col h-full animate-slide-in">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-subtle)]">
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-primary)]">{selectedEvent.eventType}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">{selectedEvent.id}</div>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs p-1">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Timestamp</div>
                  <div className="font-mono text-[var(--text-secondary)]">{selectedEvent.timestamp}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Action</div>
                  <div className="text-[var(--text-secondary)]">{selectedEvent.action}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">User</div>
                  <div className="text-[var(--text-secondary)]">{selectedEvent.userEmail}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">IP</div>
                  <div className="font-mono text-[var(--text-secondary)]">{selectedEvent.ip}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Org</div>
                  <div className="text-[var(--text-secondary)]">{selectedEvent.orgName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Resource</div>
                  <div className="font-mono text-[var(--text-secondary)]">{selectedEvent.resource}</div>
                </div>
              </div>

              {selectedEvent.workflowName && (
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase mb-0.5">Workflow</div>
                  <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded px-2 py-1 font-mono">
                    {selectedEvent.workflowName} ({selectedEvent.workflowId})
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase mb-0.5">Hash Chain</div>
                <div className="text-[10px] font-mono bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded p-2 space-y-1">
                  <div className="text-[var(--text-tertiary)]">
                    prev: <span className="text-[var(--text-secondary)]">{selectedEvent.prevHash.slice(0, 24)}…</span>
                  </div>
                  <div className={selectedEvent.verified ? "text-success" : "text-warning"}>
                    hash: {selectedEvent.hash.slice(0, 24)}…{" "}
                    {selectedEvent.verified ? "✓ verified" : "⚠ chain broken"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase mb-0.5">Details</div>
                <pre className="text-[10px] font-mono bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded p-2 text-[var(--text-secondary)]">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
