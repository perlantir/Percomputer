"use client";

import * as React from "react";
import {
  Mail,
  HardDrive,
  MessageSquare,
  Github,
  FileText,
  Cloud,
  Target,
  Database,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
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

function formatLastUsed(iso: string | null): string {
  if (!iso) return "Never used";
  const date = new Date(iso);
  const now = new Date("2025-01-15T14:30:00Z");
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffHrs < 1) return "Used just now";
  if (diffHrs < 24) return `Used ${diffHrs}h ago`;
  if (diffDays === 1) return "Used 1 day ago";
  return `Used ${diffDays} days ago`;
}

function isRecentlyUsed(iso: string | null): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date("2025-01-15T14:30:00Z");
  const diffHrs = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffHrs < 24;
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

interface ConnectorTileProps {
  connector: DemoConnector;
  onClick: (connector: DemoConnector) => void;
}

export const ConnectorTile = React.memo(function ConnectorTile({ connector, onClick }: ConnectorTileProps) {
  const Icon = getIcon(connector.icon);
  const recentlyUsed = isRecentlyUsed(connector.lastSyncedAt);
  const connected = connector.status === "connected";

  return (
    <button
      onClick={() => onClick(connector)}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-lg bg-surface p-6 text-left transition-shadow",
        "border border-border-subtle",
        "hover:shadow-md hover:border-border-default"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2">
            <Icon className="h-5 w-5 text-foreground-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground-primary">
              {connector.name}
            </h3>
            <p className="text-xs text-foreground-tertiary capitalize">
              {connector.provider}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {recentlyUsed && connected && (
            <span className="relative flex h-2 w-2">
              {typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          )}
          <span
            className={cn("h-2 w-2 rounded-full", statusColor(connector.status))}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs text-foreground-secondary">
          {formatLastUsed(connector.lastSyncedAt)}
        </p>
        {connected && connector.scope.length > 0 && (
          <p className="text-xs text-foreground-tertiary">
            {connector.scope.length} scope{connector.scope.length > 1 ? "s" : ""} granted
          </p>
        )}
      </div>
    </button>
  );
});
