"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Search, Plug } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/input";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ConnectorCategoryFilter } from "@/src/components/connectors/ConnectorCategoryFilter";
import { ConnectorTile } from "@/src/components/connectors/ConnectorTile";
import { ConnectorDrawer } from "@/src/components/connectors/ConnectorDrawer";
import {
  DEMO_CONNECTORS,
  type DemoConnector,
} from "@/src/data/demo-connectors";
import { DEMO_USERS } from "@/src/data/demo-users";

function getCategory(provider: string): string {
  const map: Record<string, string> = {
    google: "Google",
    slack: "Communication",
    github: "Development",
    notion: "Storage",
    salesforce: "CRM",
    hubspot: "CRM",
    snowflake: "Database",
  };
  return map[provider] || "Other";
}

function matchesCategory(connector: DemoConnector, category: string): boolean {
  if (category === "All") return true;
  return getCategory(connector.provider) === category;
}

export default function ConnectorsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedConnector, setSelectedConnector] = useState<DemoConnector | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [connectors, setConnectors] = useState(
    DEMO_CONNECTORS.filter((c) => c.orgId === DEMO_USERS[0].orgId)
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return connectors.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q);
      const matchesCat = matchesCategory(c, category);
      return matchesSearch && matchesCat;
    });
  }, [connectors, search, category]);

  const handleTileClick = (connector: DemoConnector) => {
    setSelectedConnector(connector);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedConnector(null), 300);
  };

  const handleRevoke = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "disconnected" as const,
              connectedAt: null,
              lastSyncedAt: null,
              lastError: null,
            }
          : c
      )
    );
    setSelectedConnector((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "disconnected",
            connectedAt: null,
            lastSyncedAt: null,
            lastError: null,
          }
        : prev
    );
  };

  const handleConnect = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "connected" as const,
              connectedAt: new Date().toISOString(),
              lastSyncedAt: new Date().toISOString(),
              lastError: null,
            }
          : c
      )
    );
    setSelectedConnector((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "connected",
            connectedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
            lastError: null,
          }
        : prev
    );
  };

  const connectedCount = connectors.filter((c) => c.status === "connected").length;

  return (
    <main className="min-h-[100dvh] bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="h-6 w-6 text-accent-primary" />
            <h1 className="font-display text-2xl font-semibold text-foreground-primary">
              Connectors
            </h1>
          </div>
          <p className="text-sm text-foreground-secondary">
            Manage integrations with external services. {connectedCount} of {connectors.length} connected.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
            <Input
              placeholder="Search connectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ConnectorCategoryFilter value={category} onChange={setCategory} />
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((connector) => (
              <ConnectorTile
                key={connector.id}
                connector={connector}
                onClick={handleTileClick}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="search"
            icon={Plug}
            title="No connectors found"
            description="Try adjusting your search or filters to find available connectors."
            actionLabel="Clear filters"
            onAction={() => {
              setSearch("");
              setCategory("All");
            }}
          />
        )}
      </div>

      {/* Drawer */}
      <ConnectorDrawer
        connector={selectedConnector}
        open={drawerOpen}
        onClose={handleClose}
        onRevoke={handleRevoke}
        onConnect={handleConnect}
      />
    </main>
  );
}
