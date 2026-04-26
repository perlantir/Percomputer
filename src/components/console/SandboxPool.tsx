"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill } from "./ConsoleTable";
import { useConsoleRole } from "@/src/hooks/useConsoleRole";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { AlertTriangle, X, PowerOff, Power } from "lucide-react";

interface SandboxHost {
  id: string;
  hostname: string;
  region: string;
  vmsInFlight: number;
  vmsCapacity: number;
  avgLifetimeSec: number;
  kernelVersion: string;
  lastImageBuild: string;
  cveStatus: "clean" | "pending" | "critical";
  draining: boolean;
  healthy: boolean;
  cpuUtil: number;
  memUtil: number;
}

const demoHosts: SandboxHost[] = [
  {
    id: "sb-01",
    hostname: "sandbox-pool-01.us-east.internal",
    region: "us-east-1",
    vmsInFlight: 42,
    vmsCapacity: 120,
    avgLifetimeSec: 186,
    kernelVersion: "6.8.0-31-generic",
    lastImageBuild: "2024-06-01T04:23:00Z",
    cveStatus: "clean",
    draining: false,
    healthy: true,
    cpuUtil: 34,
    memUtil: 52,
  },
  {
    id: "sb-02",
    hostname: "sandbox-pool-02.us-east.internal",
    region: "us-east-1",
    vmsInFlight: 98,
    vmsCapacity: 120,
    avgLifetimeSec: 210,
    kernelVersion: "6.8.0-31-generic",
    lastImageBuild: "2024-06-01T04:23:00Z",
    cveStatus: "clean",
    draining: false,
    healthy: true,
    cpuUtil: 71,
    memUtil: 68,
  },
  {
    id: "sb-03",
    hostname: "sandbox-pool-03.us-west.internal",
    region: "us-west-2",
    vmsInFlight: 31,
    vmsCapacity: 80,
    avgLifetimeSec: 154,
    kernelVersion: "6.8.0-30-generic",
    lastImageBuild: "2024-05-28T02:15:00Z",
    cveStatus: "pending",
    draining: false,
    healthy: true,
    cpuUtil: 28,
    memUtil: 41,
  },
  {
    id: "sb-04",
    hostname: "sandbox-pool-04.eu-west.internal",
    region: "eu-west-1",
    vmsInFlight: 0,
    vmsCapacity: 80,
    avgLifetimeSec: 0,
    kernelVersion: "6.8.0-29-generic",
    lastImageBuild: "2024-05-20T12:00:00Z",
    cveStatus: "critical",
    draining: true,
    healthy: false,
    cpuUtil: 5,
    memUtil: 12,
  },
  {
    id: "sb-05",
    hostname: "sandbox-pool-05.ap-south.internal",
    region: "ap-south-1",
    vmsInFlight: 57,
    vmsCapacity: 100,
    avgLifetimeSec: 245,
    kernelVersion: "6.8.0-31-generic",
    lastImageBuild: "2024-06-01T04:23:00Z",
    cveStatus: "clean",
    draining: false,
    healthy: true,
    cpuUtil: 45,
    memUtil: 55,
  },
  {
    id: "sb-06",
    hostname: "sandbox-pool-06.us-east.internal",
    region: "us-east-1",
    vmsInFlight: 12,
    vmsCapacity: 120,
    avgLifetimeSec: 320,
    kernelVersion: "6.8.0-31-generic",
    lastImageBuild: "2024-06-01T04:23:00Z",
    cveStatus: "clean",
    draining: false,
    healthy: true,
    cpuUtil: 15,
    memUtil: 22,
  },
];

export default function SandboxPool() {
  const [hosts, setHosts] = useState(demoHosts);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingHostId, setPendingHostId] = useState<string | null>(null);
  const { isAdmin } = useConsoleRole();

  const openDrainConfirm = (id: string) => {
    if (!isAdmin) return;
    setPendingHostId(id);
    setConfirmOpen(true);
  };

  const executeToggleDrain = () => {
    if (!pendingHostId) return;
    setHosts((prev) =>
      prev.map((h) => (h.id === pendingHostId ? { ...h, draining: !h.draining } : h))
    );
    setPendingHostId(null);
    setConfirmOpen(false);
  };

  const cancelToggleDrain = () => {
    setPendingHostId(null);
    setConfirmOpen(false);
  };

  const getPendingHost = () => hosts.find((h) => h.id === pendingHostId) ?? null;

  const filtered = regionFilter === "all" ? hosts : hosts.filter((h) => h.region === regionFilter);
  const regions = Array.from(new Set(hosts.map((h) => h.region)));

  const columns = [
    {
      key: "hostname",
      header: "Host",
      width: 200,
      sortable: true,
      render: (row: SandboxHost) => (
        <div>
          <div className="text-[11px] text-[var(--text-primary)]">{row.hostname}</div>
          <div className="text-[10px] text-[var(--text-tertiary)] font-mono">{row.id}</div>
        </div>
      ),
    },
    {
      key: "region",
      header: "Region",
      width: 90,
      sortable: true,
      render: (row: SandboxHost) => (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] font-mono">
          {row.region}
        </span>
      ),
    },
    {
      key: "vmsInFlight",
      header: "VMs",
      width: 70,
      align: "right" as const,
      sortable: true,
      render: (row: SandboxHost) => (
        <div className="text-right">
          <span className="font-mono text-[var(--text-secondary)]">{row.vmsInFlight}</span>
          <span className="text-[var(--text-tertiary)] text-[10px]"> /{row.vmsCapacity}</span>
        </div>
      ),
    },
    {
      key: "utilization",
      header: "Util",
      width: 80,
      align: "right" as const,
      render: (row: SandboxHost) => (
        <div className="text-right space-y-0.5">
          <div className="text-[10px] font-mono">
            <span className="text-[var(--text-tertiary)]">C</span>{" "}
            <span className={row.cpuUtil > 70 ? "text-warning" : "text-[var(--text-secondary)]"}>
              {row.cpuUtil}%
            </span>
          </div>
          <div className="text-[10px] font-mono">
            <span className="text-[var(--text-tertiary)]">M</span>{" "}
            <span className={row.memUtil > 70 ? "text-warning" : "text-[var(--text-secondary)]"}>
              {row.memUtil}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "avgLifetimeSec",
      header: "Avg Life",
      width: 60,
      align: "right" as const,
      sortable: true,
      render: (row: SandboxHost) => (
        <span className="font-mono">{Math.round(row.avgLifetimeSec / 60)}m</span>
      ),
    },
    {
      key: "kernelVersion",
      header: "Kernel",
      width: 110,
      sortable: true,
      render: (row: SandboxHost) => (
        <span className="font-mono text-[10px] text-[var(--text-secondary)]">{row.kernelVersion}</span>
      ),
    },
    {
      key: "lastImageBuild",
      header: "Image",
      width: 100,
      sortable: true,
      render: (row: SandboxHost) => (
        <span className="font-mono text-[10px] text-[var(--text-secondary)]">
          {row.lastImageBuild.slice(0, 10)}
        </span>
      ),
    },
    {
      key: "cveStatus",
      header: "CVE",
      width: 60,
      sortable: true,
      render: (row: SandboxHost) => (
        <StatusPill
          status={
            row.cveStatus === "clean"
              ? "success"
              : row.cveStatus === "pending"
              ? "warning"
              : "failed"
          }
        />
      ),
    },
    {
      key: "health",
      header: "Health",
      width: 60,
      render: (row: SandboxHost) => (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              row.healthy ? "bg-success" : "bg-danger"
            )}
          />
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {row.healthy ? "ok" : "down"}
          </span>
        </div>
      ),
    },
    {
      key: "drain",
      header: "Drain",
      width: 60,
      render: (row: SandboxHost) => (
        <button
          onClick={() => openDrainConfirm(row.id)}
          disabled={!isAdmin}
          className={cn(
            "text-[10px] px-2 py-0.5 rounded border transition-colors",
            row.draining
              ? "bg-warning/15 text-warning border-warning/25"
              : "bg-success/15 text-success border-success/25",
            !isAdmin && "opacity-50 cursor-not-allowed"
          )}
        >
          {row.draining ? "draining" : "active"}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Hosts:</span>{" "}
          <span className="font-mono text-[var(--text-secondary)]">{hosts.length}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">VMs:</span>{" "}
          <span className="font-mono text-[var(--text-secondary)]">
            {hosts.reduce((a, h) => a + h.vmsInFlight, 0)}
          </span>
          <span className="text-[var(--text-tertiary)]">
            /{hosts.reduce((a, h) => a + h.vmsCapacity, 0)}
          </span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Draining:</span>{" "}
          <span className="font-mono text-warning">
            {hosts.filter((h) => h.draining).length}
          </span>
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--text-tertiary)]">Critical CVEs:</span>{" "}
          <span className="font-mono text-danger">
            {hosts.filter((h) => h.cveStatus === "critical").length}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="text-[11px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <ConsoleTable columns={columns} data={filtered} maxHeight={800} />
      </div>

      {/* Drain confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-warning)]/10">
              {(() => {
                const host = getPendingHost();
                return host?.draining ? (
                  <Power className="h-6 w-6 text-[var(--semantic-success)]" />
                ) : (
                  <PowerOff className="h-6 w-6 text-[var(--semantic-warning)]" />
                );
              })()}
            </div>
            <DialogTitle className="text-center">
              {(() => {
                const host = getPendingHost();
                return host?.draining
                  ? `Resume ${host?.hostname}?`
                  : `Drain ${getPendingHost()?.hostname}?`;
              })()}
            </DialogTitle>
            <DialogDescription className="text-center">
              {(() => {
                const host = getPendingHost();
                return host?.draining
                  ? "This host will start accepting new VMs again. Existing workloads are unaffected."
                  : `This will prevent ${host?.hostname} from accepting new VMs. Existing workloads will continue until completion.`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="secondary" onClick={cancelToggleDrain}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant={getPendingHost()?.draining ? "primary" : "warning"}
              onClick={executeToggleDrain}
            >
              {(() => {
                const host = getPendingHost();
                return host?.draining ? (
                  <>
                    <Power className="h-4 w-4" />
                    Resume Host
                  </>
                ) : (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Start Draining
                  </>
                );
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
