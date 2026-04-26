"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Plug,
  Shield,
  MessageSquare,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";
import { type DemoSpace } from "@/src/data/demo-spaces";
import { DEMO_CONNECTORS, type DemoConnector } from "@/src/data/demo-connectors";
import { DEMO_USERS } from "@/src/data/demo-users";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";

function connectorStatusBadge(status: DemoConnector["status"]) {
  switch (status) {
    case "connected":
      return <Badge variant="success">Connected</Badge>;
    case "disconnected":
      return <Badge variant="secondary">Disconnected</Badge>;
    case "error":
      return <Badge variant="danger">Error</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "degraded":
      return <Badge variant="warning">Degraded</Badge>;
  }
}

const MOCK_USERS: Record<string, { name: string; initials: string; color: string; email: string }> = {
  usr_7a3f9e2b1c4d: { name: "Alice Chen", initials: "AC", color: "#3B82F6", email: "alice@acme.com" },
  usr_b8e5d1a4f7c2: { name: "Bob Miller", initials: "BM", color: "#F59E0B", email: "bob@acme.com" },
  usr_2f6c8d3e5b9a: { name: "Charlie Park", initials: "CP", color: "#10B981", email: "charlie@indie.dev" },
};

interface SpaceSettingsTabProps {
  space: DemoSpace;
  onUpdate?: (patch: Partial<DemoSpace>) => void;
}

export function SpaceSettingsTab({ space, onUpdate }: SpaceSettingsTabProps) {
  const { data: connectors } = useQuery({
    queryKey: ["connectors"],
    queryFn: async () => DEMO_CONNECTORS,
    initialData: DEMO_CONNECTORS,
  });

  const [promptOpen, setPromptOpen] = React.useState(false);
  const [promptText, setPromptText] = React.useState(
    space.systemPromptAugmentation ?? ""
  );

  const spaceConnectors = connectors.filter((c) => c.spaceIds.includes(space.id));
  const members = space.memberIds.map((id) => MOCK_USERS[id]).filter(Boolean);

  const handleSavePrompt = () => {
    onUpdate?.({ systemPromptAugmentation: promptText });
    setPromptOpen(false);
    toast.success("Prompt saved", "System prompt augmentation has been updated.");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Description */}
      <section>
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--text-tertiary)]" />
          System Prompt Augmentation
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Additional context injected into every workflow running in this space
        </p>
        {promptOpen ? (
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={4}
              placeholder="e.g., Always prioritize sources from Bloomberg and WSJ. Use conservative estimates for valuation multiples."
              className={cn(
                "w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]",
                "placeholder:text-[var(--text-tertiary)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              )}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSavePrompt}>
                <Check className="mr-1 h-4 w-4" />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPromptOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            {space.systemPromptAugmentation || promptText ? (
              <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  {promptText || space.systemPromptAugmentation}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={() => setPromptOpen(true)}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setPromptOpen(true)}>
                Add prompt augmentation
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
          Members
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          People with access to workflows and memory in this space
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {members.length > 0 ? (
            members.map((m) => (
              <div
                key={m.email}
                className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      style={{ backgroundColor: m.color, color: "#fff" }}
                      className="text-xs font-medium"
                    >
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{m.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{m.email}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {m.email === DEMO_USERS.find((u) => u.id === space.ownerId)?.email
                    ? "Owner"
                    : "Member"}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState
              variant="no-data"
              icon={Users}
              title="No members"
              description="Members will appear here once they are added to this space."
              className="py-6"
            />
          )}
        </div>
      </section>

      {/* Connectors */}
      <section>
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Plug className="h-4 w-4 text-[var(--text-tertiary)]" />
          Connector Grants
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Data sources available to workflows in this space
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {spaceConnectors.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]">
                  <Plug className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {c.scope.join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.lastError && (
                  <AlertCircle className="h-4 w-4 text-[var(--danger)]" title={c.lastError} />
                )}
                {connectorStatusBadge(c.status)}
              </div>
            </div>
          ))}
          {spaceConnectors.length === 0 && (
            <EmptyState
              variant="no-data"
              icon={Plug}
              title="No connectors granted"
              description="Connectors granted to this space will appear here."
              className="py-6"
            />
          )}
        </div>
      </section>

      {/* Permissions */}
      <section>
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--text-tertiary)]" />
          Permissions
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Access controls for this space
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="text-sm text-[var(--text-primary)]">Allow members to fork workflows</span>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="text-sm text-[var(--text-primary)]">Share artifacts externally</span>
            <Badge variant="secondary">Disabled</Badge>
          </div>
          <div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="text-sm text-[var(--text-primary)]">Auto-archive completed workflows</span>
            <Badge variant="secondary">Disabled</Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
