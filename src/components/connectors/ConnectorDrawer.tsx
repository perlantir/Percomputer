"use client";

import * as React from "react";
import { useState } from "react";
import {
  X,
  Check,
  Mail,
  HardDrive,
  MessageSquare,
  Github,
  FileText,
  Cloud,
  Target,
  Database,
  type LucideIcon,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import type { DemoConnector, ConnectorStatus } from "@/src/data/demo-connectors";

const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  "hard-drive": HardDrive,
  "message-square": MessageSquare,
  github: Github,
  "file-text": FileText,
  cloud: Cloud,
  target: Target,
  database: Database,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Cloud;
}

function statusColor(status: ConnectorStatus): string {
  switch (status) {
    case "connected":
      return "bg-success";
    case "disconnected":
      return "bg-foreground-tertiary";
    case "error":
      return "bg-danger";
    case "pending":
      return "bg-warning";
    case "degraded":
      return "bg-warning";
    default:
      return "bg-foreground-tertiary";
  }
}

function statusLabel(status: ConnectorStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Error";
    case "pending":
      return "Pending";
    case "degraded":
      return "Degraded";
    default:
      return "Unknown";
  }
}

interface MockCall {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  timestamp: string;
}

function generateMockCalls(connectorId: string, count: number): MockCall[] {
  const endpoints: Record<string, string[]> = {
    conn_gmail: ["/users/me/messages", "/users/me/labels", "/users/me/threads"],
    conn_drive: ["/files", "/files/list", "/files/search", "/drives"],
    conn_slack: ["/conversations.list", "/chat.postMessage", "/users.info", "/channels.info"],
    conn_github: ["/repos/owner/repo/issues", "/repos/owner/repo/commits", "/user/repos"],
    conn_notion: ["/pages", "/databases", "/blocks/children"],
    conn_salesforce: ["/sobjects/Account", "/sobjects/Opportunity", "/query"],
    conn_hubspot: ["/contacts", "/deals", "/companies"],
    conn_snowflake: ["/queries", "/tables", "/warehouses"],
  };

  const methods = ["GET", "GET", "GET", "POST", "POST", "PUT", "PATCH"];
  const now = new Date("2025-01-15T14:30:00Z").getTime();

  return Array.from({ length: count }, (_, i) => {
    const delay = Math.floor(Math.random() * 48 * 60 * 60 * 1000);
    const ts = new Date(now - delay);
    const pool = endpoints[connectorId] || ["/api/resource"];
    return {
      id: `call_${i}_${connectorId}`,
      method: methods[Math.floor(Math.random() * methods.length)],
      endpoint: pool[Math.floor(Math.random() * pool.length)],
      status: Math.random() > 0.9 ? 429 : Math.random() > 0.95 ? 500 : 200,
      timestamp: ts.toISOString(),
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function formatCallTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date("2025-01-15T14:30:00Z");
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

interface ConnectorDrawerProps {
  connector: DemoConnector | null;
  open: boolean;
  onClose: () => void;
  onRevoke: (id: string) => void;
  onConnect: (id: string) => void;
}

export function ConnectorDrawer({
  connector,
  open,
  onClose,
  onRevoke,
  onConnect,
}: ConnectorDrawerProps) {
  const [connecting, setConnecting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  if (!connector) return null;

  if (!connector) return null;

  const Icon = getIcon(connector.icon);
  const isConnected = connector.status === "connected";
  const calls = React.useMemo(() => generateMockCalls(connector.id, 20), [connector.id]);

  // Focus trap + initial focus
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      onConnect(connector.id);
    }, 2000);
  };

  const handleRevokeClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmRevoke = () => {
    setRevoking(true);
    setTimeout(() => {
      setRevoking(false);
      setConfirmOpen(false);
      onRevoke(connector.id);
    }, 800);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[var(--z-modal)] transition-opacity duration-fast",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`${connector.name} connector details`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-canvas)]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md bg-surface shadow-high border-l border-border-subtle",
          "flex flex-col",
          open ? "translate-x-0" : "translate-x-full",
          prefersReducedMotion ? "transition-none" : "transition-transform duration-normal ease-out-expo"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2">
              <Icon className="h-5 w-5 text-foreground-primary" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground-primary">
                {connector.name}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", statusColor(connector.status))} />
                <span className="text-xs text-foreground-secondary">{statusLabel(connector.status)}</span>
              </div>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-md p-1.5 text-foreground-tertiary hover:bg-surface-2 hover:text-foreground-secondary transition-colors"
            aria-label="Close connector drawer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Scopes */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary mb-3">
              Scopes Granted
            </h3>
            {connector.scope.length > 0 ? (
              <ul className="space-y-2">
                {connector.scope.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <Check className="h-3.5 w-3.5 text-success" />
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-mono">{s}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground-tertiary">No scopes granted yet.</p>
            )}
          </section>

          {/* Last 20 calls */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary mb-3">
              Last 20 Calls
            </h3>
            <div className="rounded-md border border-border-subtle overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-2">
                    <th className="px-3 py-2 text-left text-xs font-medium text-foreground-tertiary">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-foreground-tertiary">Endpoint</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr
                      key={call.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 text-xs font-mono font-medium",
                            call.method === "GET"
                              ? "bg-info/10 text-info"
                              : call.method === "POST"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          )}
                        >
                          {call.method}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground-secondary font-mono truncate max-w-[140px]">
                        {call.endpoint}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            call.status >= 200 && call.status < 300
                              ? "text-success"
                              : "text-danger"
                          )}
                        >
                          {call.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-foreground-tertiary">
                        {formatCallTime(call.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Last error */}
          {connector.lastError && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary mb-2">
                Last Error
              </h3>
              <div className="rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
                {connector.lastError}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border-subtle px-6 py-4 flex items-center justify-between gap-3">
          {isConnected ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevokeClick}
                disabled={revoking}
                className="gap-2"
              >
                {revoking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Revoke Access
              </Button>
              <span className="text-xs text-foreground-tertiary">
                Connected {new Date(connector.connectedAt!).toLocaleDateString()}
              </span>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConnect}
              disabled={connecting}
              className="gap-2 w-full"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Redirecting to OAuth...
                </>
              ) : (
                <>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Connect
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Revoke confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
              <ShieldAlert className="h-6 w-6 text-[var(--semantic-danger)]" />
            </div>
            <DialogTitle className="text-center">Revoke Access?</DialogTitle>
            <DialogDescription className="text-center">
              This will immediately disconnect <strong>{connector.name}</strong> and
              invalidate all active tokens. Any workflows using this connector will
              fail until it is reconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={revoking}
            >
              <X className="h-4 w-4" />
              Keep Connected
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmRevoke}
              disabled={revoking}
            >
              {revoking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Yes, Revoke
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
