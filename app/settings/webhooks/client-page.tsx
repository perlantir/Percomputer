"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";

import {
  ConsoleTable,
  ConsoleColumn,
  StatusPill,
} from "@/src/components/console/ConsoleTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { Skeleton } from "@/src/components/ui/skeleton";

import {
  Webhook,
  Plus,
  Trash2,
  RotateCcw,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  ExternalLink,
  Zap,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type WebhookId = string & { readonly __brand: "WebhookId" };
type DeliveryId = string & { readonly __brand: "DeliveryId" };

type DeliveryStatus = "delivered" | "failed" | "pending" | "retrying";

interface WebhookItem {
  readonly id: WebhookId;
  readonly url: string;
  readonly events: string[];
  readonly secret: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface DeliveryRecord {
  readonly id: DeliveryId;
  readonly webhookId: WebhookId;
  readonly eventType: string;
  readonly status: DeliveryStatus;
  readonly statusCode: number | null;
  readonly responseBody: string | null;
  readonly durationMs: number;
  readonly createdAt: string;
  readonly attempts: number;
  readonly nextRetryAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data & API
// ─────────────────────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  "workflow.started",
  "workflow.completed",
  "workflow.failed",
  "task.started",
  "task.completed",
  "task.failed",
  "artifact.created",
  "artifact.updated",
  "budget.threshold_reached",
  "user.invited",
];

const INITIAL_WEBHOOKS: WebhookItem[] = [
  {
    id: "wh_001" as WebhookId,
    url: "https://hooks.slack.com/services/acme/webhook/abc123",
    events: ["workflow.completed", "workflow.failed"],
    secret: "sk_wh_abc123xyz",
    isActive: true,
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-01-14T10:30:00Z",
  },
  {
    id: "wh_002" as WebhookId,
    url: "https://api.acme-research.com/v1/webhooks/platform",
    events: [
      "workflow.started",
      "workflow.completed",
      "workflow.failed",
      "artifact.created",
    ],
    secret: null,
    isActive: true,
    createdAt: "2025-01-08T14:20:00Z",
    updatedAt: "2025-01-12T09:15:00Z",
  },
  {
    id: "wh_003" as WebhookId,
    url: "https://discord.com/api/webhooks/998877665544/xyz",
    events: ["budget.threshold_reached", "user.invited"],
    secret: "sk_wh_discord_999",
    isActive: false,
    createdAt: "2025-01-05T11:00:00Z",
    updatedAt: "2025-01-11T16:45:00Z",
  },
];

const INITIAL_DELIVERIES: DeliveryRecord[] = [
  {
    id: "dlv_001" as DeliveryId,
    webhookId: "wh_001" as WebhookId,
    eventType: "workflow.completed",
    status: "delivered",
    statusCode: 200,
    responseBody: "{\"ok\":true}",
    durationMs: 234,
    createdAt: "2025-01-15T09:12:00Z",
    attempts: 1,
    nextRetryAt: null,
  },
  {
    id: "dlv_002" as DeliveryId,
    webhookId: "wh_001" as WebhookId,
    eventType: "workflow.failed",
    status: "failed",
    statusCode: 500,
    responseBody: "Internal Server Error",
    durationMs: 1200,
    createdAt: "2025-01-15T08:45:00Z",
    attempts: 3,
    nextRetryAt: null,
  },
  {
    id: "dlv_003" as DeliveryId,
    webhookId: "wh_002" as WebhookId,
    eventType: "artifact.created",
    status: "delivered",
    statusCode: 204,
    responseBody: null,
    durationMs: 89,
    createdAt: "2025-01-15T07:30:00Z",
    attempts: 1,
    nextRetryAt: null,
  },
  {
    id: "dlv_004" as DeliveryId,
    webhookId: "wh_002" as WebhookId,
    eventType: "workflow.completed",
    status: "failed",
    statusCode: 0,
    responseBody: "Connection timeout",
    durationMs: 5000,
    createdAt: "2025-01-15T06:15:00Z",
    attempts: 3,
    nextRetryAt: null,
  },
  {
    id: "dlv_005" as DeliveryId,
    webhookId: "wh_001" as WebhookId,
    eventType: "workflow.completed",
    status: "delivered",
    statusCode: 200,
    responseBody: "{\"ok\":true}",
    durationMs: 156,
    createdAt: "2025-01-14T22:00:00Z",
    attempts: 1,
    nextRetryAt: null,
  },
  {
    id: "dlv_006" as DeliveryId,
    webhookId: "wh_003" as WebhookId,
    eventType: "budget.threshold_reached",
    status: "pending",
    statusCode: null,
    responseBody: null,
    durationMs: 0,
    createdAt: "2025-01-15T09:00:00Z",
    attempts: 0,
    nextRetryAt: "2025-01-15T09:05:00Z",
  },
  {
    id: "dlv_007" as DeliveryId,
    webhookId: "wh_002" as WebhookId,
    eventType: "workflow.started",
    status: "delivered",
    statusCode: 200,
    responseBody: "{\"received\":true}",
    durationMs: 112,
    createdAt: "2025-01-14T20:30:00Z",
    attempts: 1,
    nextRetryAt: null,
  },
  {
    id: "dlv_008" as DeliveryId,
    webhookId: "wh_001" as WebhookId,
    eventType: "workflow.completed",
    status: "retrying",
    statusCode: 429,
    responseBody: "Rate limited",
    durationMs: 340,
    createdAt: "2025-01-15T09:20:00Z",
    attempts: 2,
    nextRetryAt: "2025-01-15T09:25:00Z",
  },
];

function fetchWebhooks(): Promise<WebhookItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...INITIAL_WEBHOOKS]), 200);
  });
}

function fetchDeliveries(): Promise<DeliveryRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...INITIAL_DELIVERIES]), 200);
  });
}

function createWebhook(data: {
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}): Promise<WebhookItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      resolve({
        id: `wh_${Math.random().toString(36).slice(2, 8)}` as WebhookId,
        url: data.url,
        events: data.events,
        secret: data.secret || null,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      });
    }, 400);
  });
}

function deleteWebhook(id: WebhookId): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 300);
  });
}

function testWebhook(id: WebhookId): Promise<{ success: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.3;
      resolve({
        success,
        latencyMs: Math.round(50 + Math.random() * 800),
      });
    }, 600);
  });
}

function retryDelivery(deliveryId: DeliveryId): Promise<DeliveryRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const delivery = INITIAL_DELIVERIES.find((d) => d.id === deliveryId);
      if (!delivery) return reject(new Error("Delivery not found"));
      const success = Math.random() > 0.2;
      const now = new Date().toISOString();
      resolve({
        ...delivery,
        status: success ? "delivered" : "failed",
        statusCode: success ? 200 : 500,
        durationMs: Math.round(50 + Math.random() * 500),
        attempts: delivery.attempts + 1,
        nextRetryAt: null,
        createdAt: now,
      });
    }, 800);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Status Helpers
// ─────────────────────────────────────────────────────────────────────────────

function deliveryStatusToPill(status: DeliveryStatus): string {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
      return "failed";
    case "pending":
      return "pending";
    case "retrying":
      return "running";
    default:
      return "pending";
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function EventBadge({ event }: { event: string }) {
  return (
    <Badge size="sm" variant="default" className="font-mono text-[10px]">
      {event}
    </Badge>
  );
}

function EventsCell({ events, max = 2 }: { events: string[]; max?: number }) {
  const visible = events.slice(0, max);
  const remaining = events.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((e) => (
        <EventBadge key={e} event={e} />
      ))}
      {remaining > 0 && (
        <Badge size="sm" variant="accent" className="text-[10px]">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

function ActiveSwitch({
  webhook,
  onToggle,
}: {
  webhook: WebhookItem;
  onToggle: (id: WebhookId, active: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={webhook.isActive}
        onCheckedChange={(v) => onToggle(webhook.id, v)}
        aria-label={`Toggle ${webhook.url}`}
      />
      <span
        className={cn(
          "text-[10px] font-medium uppercase tracking-wide",
          webhook.isActive
            ? "text-[var(--semantic-success)]"
            : "text-[var(--text-tertiary)]"
        )}
      >
        {webhook.isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

/* ─── Add Webhook Dialog ─── */
function AddWebhookDialog({ onAdded }: { onAdded: (w: WebhookItem) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [urlError, setUrlError] = useState("");

  const mutation = useMutation({
    mutationFn: createWebhook,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["webhooks"] });
      const previousWebhooks = queryClient.getQueryData<WebhookItem[]>(["webhooks"]);

      // Optimistically add the new webhook before the API call
      const optimisticWebhook: WebhookItem = {
        id: `optimistic_${Date.now()}` as WebhookId,
        url: data.url,
        events: data.events,
        secret: data.secret || null,
        isActive: data.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<WebhookItem[]>(["webhooks"], (old) =>
        old ? [optimisticWebhook, ...old] : [optimisticWebhook]
      );

      return { previousWebhooks, optimisticId: optimisticWebhook.id };
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic entry with real one
      queryClient.setQueryData<WebhookItem[]>(["webhooks"], (old) => {
        if (!old) return [data];
        return old.map((w) => (w.id === context?.optimisticId ? data : w));
      });
      onAdded(data);
      setOpen(false);
      resetForm();
      toast.success("Webhook created", `Webhook to ${data.url} is now active.`);
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWebhooks) {
        queryClient.setQueryData<WebhookItem[]>(["webhooks"], context.previousWebhooks);
      }
      toast.error("Failed to create webhook", "Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  function resetForm() {
    setUrl("");
    setSecret("");
    setSelectedEvents([]);
    setIsActive(true);
    setUrlError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setUrlError("URL is required");
      return;
    }
    try {
      new URL(url);
    } catch {
      setUrlError("Please enter a valid URL");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("No events selected", "Select at least one event to subscribe to.");
      return;
    }
    mutation.mutate({
      url: url.trim(),
      events: selectedEvents,
      secret: secret.trim(),
      isActive,
    });
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="transition-transform active:scale-95">
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-[var(--accent-primary)]" />
            Add Webhook
          </DialogTitle>
          <DialogDescription>
            Subscribe to platform events by registering an HTTPS endpoint.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Endpoint URL"
            placeholder="https://api.example.com/webhooks/platform"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError("");
            }}
            errorMessage={urlError}
            iconLeft={<ExternalLink className="h-4 w-4" />}
          />

          <Input
            label="Secret (optional)"
            type="password"
            placeholder="whsec_xxxxxxxxxxxxxxxx"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            helperText="Used to sign webhook payloads for verification"
            iconLeft={<ShieldCheck className="h-4 w-4" />}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Events to subscribe
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2">
              {WEBHOOK_EVENTS.map((event) => {
                const selected = selectedEvents.includes(event);
                return (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-mono font-medium transition-all duration-fast",
                      selected
                        ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)]"
                    )}
                  >
                    {event}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Start receiving events immediately
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={mutation.isPending}>
              Create Webhook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Webhook List ─── */
function WebhookList({
  webhooks,
  isLoading,
  selectedWebhookId,
  onSelectWebhook,
  onToggleActive,
  onDelete,
  onTest,
}: {
  webhooks: WebhookItem[];
  isLoading: boolean;
  selectedWebhookId: WebhookId | null;
  onSelectWebhook: (id: WebhookId | null) => void;
  onToggleActive: (id: WebhookId, active: boolean) => void;
  onDelete: (id: WebhookId) => void;
  onTest: (id: WebhookId) => void;
}) {
  const columns: ConsoleColumn<WebhookItem>[] = useMemo(
    () => [
      {
        key: "url",
        header: "Endpoint URL",
        width: 280,
        minWidth: 200,
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-1.5 min-w-0">
            <Webhook className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
            <span
              className={cn(
                "truncate font-mono",
                row.isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] line-through"
              )}
              title={row.url}
            >
              {row.url}
            </span>
          </div>
        ),
      },
      {
        key: "events",
        header: "Events",
        width: 200,
        minWidth: 120,
        render: (row) => <EventsCell events={row.events} />,
      },
      {
        key: "status",
        header: "Status",
        width: 110,
        sortable: true,
        align: "center",
        render: (row) => (
          <StatusPill
            status={row.isActive ? "success" : "cancelled"}
          />
        ),
      },
      {
        key: "secret",
        header: "Secret",
        width: 80,
        align: "center",
        render: (row) => (
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {row.secret ? (
              <ShieldCheck className="h-3.5 w-3.5 mx-auto text-[var(--semantic-success)]" />
            ) : (
              <span>—</span>
            )}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        width: 130,
        sortable: true,
        render: (row) => (
          <span className="text-[var(--text-tertiary)]">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: 160,
        align: "center",
        render: (row) => (
          <div className="flex items-center justify-center gap-1">
            <ActiveSwitch webhook={row} onToggle={onToggleActive} />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
              onClick={(e) => {
                e.stopPropagation();
                onTest(row.id);
              }}
              title="Test webhook"
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[var(--text-tertiary)] hover:text-[var(--semantic-danger)]"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.id);
              }}
              title="Delete webhook"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onToggleActive, onDelete, onTest]
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-4 w-4 text-[var(--accent-primary)]" />
              Registered Webhooks
            </CardTitle>
            <CardDescription>
              {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <ConsoleTable
          columns={columns}
          data={webhooks}
          density="compact"
          maxHeight={320}
          onRowClick={(row) =>
            onSelectWebhook(
              selectedWebhookId === row.id ? null : (row.id as WebhookId)
            )
          }
          selectedRowId={selectedWebhookId ?? undefined}
          rowIdKey="id"
          emptyText="No webhooks configured"
        />
      </CardContent>
    </Card>
  );
}

/* ─── Delivery History ─── */
function DeliveryHistory({
  deliveries,
  isLoading,
  webhookId,
  onRetry,
}: {
  deliveries: DeliveryRecord[];
  isLoading: boolean;
  webhookId: WebhookId | null;
  onRetry: (id: DeliveryId) => void;
}) {
  const filtered = useMemo(() => {
    if (!webhookId) return deliveries;
    return deliveries.filter((d) => d.webhookId === webhookId);
  }, [deliveries, webhookId]);

  const columns: ConsoleColumn<DeliveryRecord>[] = useMemo(
    () => [
      {
        key: "status",
        header: "Status",
        width: 90,
        sortable: true,
        align: "center",
        render: (row) => (
          <div className="flex items-center justify-center gap-1">
            {row.status === "delivered" && (
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--semantic-success)]" />
            )}
            {row.status === "failed" && (
              <XCircle className="h-3.5 w-3.5 text-[var(--semantic-danger)]" />
            )}
            {row.status === "pending" && (
              <Clock className="h-3.5 w-3.5 text-[var(--semantic-warning)]" />
            )}
            {row.status === "retrying" && (
              <RotateCcw className="h-3.5 w-3.5 text-[var(--semantic-info)] animate-spin" />
            )}
            <StatusPill status={deliveryStatusToPill(row.status)} />
          </div>
        ),
      },
      {
        key: "eventType",
        header: "Event",
        width: 180,
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="font-mono text-[11px]">{row.eventType}</span>
          </div>
        ),
      },
      {
        key: "statusCode",
        header: "HTTP",
        width: 70,
        sortable: true,
        align: "center",
        render: (row) => (
          <span
            className={cn(
              "text-[11px] font-mono font-medium",
              row.statusCode == null
                ? "text-[var(--text-tertiary)]"
                : row.statusCode >= 200 && row.statusCode < 300
                ? "text-[var(--semantic-success)]"
                : "text-[var(--semantic-danger)]"
            )}
          >
            {row.statusCode ?? "—"}
          </span>
        ),
      },
      {
        key: "durationMs",
        header: "Duration",
        width: 80,
        sortable: true,
        align: "right",
        render: (row) => (
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {formatDuration(row.durationMs)}
          </span>
        ),
      },
      {
        key: "attempts",
        header: "Attempts",
        width: 80,
        sortable: true,
        align: "center",
        render: (row) => (
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {row.attempts}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Time",
        width: 130,
        sortable: true,
        render: (row) => (
          <span className="text-[var(--text-tertiary)]">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        width: 60,
        align: "center",
        render: (row) =>
          row.status === "failed" || row.status === "retrying" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
              onClick={(e) => {
                e.stopPropagation();
                onRetry(row.id);
              }}
              title="Retry delivery"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          ) : null,
      },
    ],
    [onRetry]
  );

  const failedCount = filtered.filter((d) => d.status === "failed").length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--accent-primary)]" />
              Delivery History
            </CardTitle>
            <CardDescription>
              {webhookId ? "Filtered by selected webhook" : "All deliveries"}
              {" · "}
              {filtered.length} delivery{filtered.length !== 1 ? "ies" : ""}
              {failedCount > 0 && (
                <span className="text-[var(--semantic-danger)]">
                  {" "}({failedCount} failed)
                </span>
              )}
            </CardDescription>
          </div>
          {webhookId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text-tertiary)]"
              onClick={() => {}}
            >
              Clear filter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <ConsoleTable
          columns={columns}
          data={filtered}
          density="compact"
          maxHeight={400}
          emptyText="No delivery history"
          rowIdKey="id"
        />
      </CardContent>
    </Card>
  );
}

/* ─── Stats Row ─── */
function WebhookStats({
  webhooks,
  deliveries,
}: {
  webhooks: WebhookItem[];
  deliveries: DeliveryRecord[];
}) {
  const activeCount = webhooks.filter((w) => w.isActive).length;
  const failedCount = deliveries.filter((d) => d.status === "failed").length;
  const deliveredCount = deliveries.filter((d) => d.status === "delivered").length;
  const avgLatency =
    deliveries.length > 0
      ? Math.round(
          deliveries.reduce((sum, d) => sum + d.durationMs, 0) / deliveries.length
        )
      : 0;

  const stats = [
    {
      label: "Active Webhooks",
      value: activeCount,
      icon: Webhook,
      color: "text-[var(--semantic-success)]",
    },
    {
      label: "Delivered",
      value: deliveredCount,
      icon: CheckCircle2,
      color: "text-[var(--semantic-success)]",
    },
    {
      label: "Failed",
      value: failedCount,
      icon: XCircle,
      color: "text-[var(--semantic-danger)]",
    },
    {
      label: "Avg Latency",
      value: formatDuration(avgLatency),
      icon: Clock,
      color: "text-[var(--semantic-info)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={cn("h-4 w-4", stat.color)} />
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
          <p className="text-xl font-semibold text-[var(--text-primary)]">
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [selectedWebhookId, setSelectedWebhookId] = useState<WebhookId | null>(null);
  const queryClient = useQueryClient();

  const {
    data: webhooks,
    isLoading: webhooksLoading,
  } = useQuery({
    queryKey: ["webhooks"],
    queryFn: fetchWebhooks,
    initialData: INITIAL_WEBHOOKS,
  });

  const {
    data: deliveries,
    isLoading: deliveriesLoading,
  } = useQuery({
    queryKey: ["webhook-deliveries"],
    queryFn: fetchDeliveries,
    initialData: INITIAL_DELIVERIES,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["webhooks"] });
      const previousWebhooks = queryClient.getQueryData<WebhookItem[]>(["webhooks"]);

      // Optimistically remove the webhook
      queryClient.setQueryData<WebhookItem[]>(["webhooks"], (old) =>
        old?.filter((w) => w.id !== id) ?? []
      );
      if (selectedWebhookId === id) setSelectedWebhookId(null);

      return { previousWebhooks };
    },
    onSuccess: () => {
      toast.success("Webhook deleted", "The webhook has been removed.");
    },
    onError: (_err, _id, context) => {
      if (context?.previousWebhooks) {
        queryClient.setQueryData<WebhookItem[]>(["webhooks"], context.previousWebhooks);
      }
      toast.error("Failed to delete webhook", "Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess: (result, id) => {
      const webhook = webhooks?.find((w) => w.id === id);
      if (result.success) {
        toast.success(
          "Test successful",
          `Webhook to ${webhook?.url ?? ""} responded in ${result.latencyMs}ms.`
        );
      } else {
        toast.error(
          "Test failed",
          `Webhook to ${webhook?.url ?? ""} returned an error after ${result.latencyMs}ms.`
        );
      }
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryDelivery,
    onMutate: async (deliveryId) => {
      await queryClient.cancelQueries({ queryKey: ["webhook-deliveries"] });
      const previousDeliveries = queryClient.getQueryData<DeliveryRecord[]>(["webhook-deliveries"]);

      // Optimistically mark the delivery as retrying
      queryClient.setQueryData<DeliveryRecord[]>(["webhook-deliveries"], (old) =>
        old?.map((d) =>
          d.id === deliveryId ? { ...d, status: "retrying" as const } : d
        ) ?? []
      );

      return { previousDeliveries, deliveryId };
    },
    onSuccess: (updated, _deliveryId, context) => {
      queryClient.setQueryData<DeliveryRecord[]>(["webhook-deliveries"], (old) =>
        old?.map((d) => (d.id === context?.deliveryId ? updated : d)) ?? []
      );
      if (updated.status === "delivered") {
        toast.success("Retry successful", `Delivery ${updated.id} succeeded.`);
      } else {
        toast.error("Retry failed", `Delivery ${updated.id} failed again.`);
      }
    },
    onError: (_err, _deliveryId, context) => {
      if (context?.previousDeliveries) {
        queryClient.setQueryData<DeliveryRecord[]>(["webhook-deliveries"], context.previousDeliveries);
      }
      toast.error("Retry failed", "Could not retry delivery.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-deliveries"] });
    },
  });

  const handleAddWebhook = useCallback(
    (newWebhook: WebhookItem) => {
      queryClient.setQueryData<WebhookItem[]>(["webhooks"], (old) => [
        ...(old ?? []),
        newWebhook,
      ]);
    },
    [queryClient]
  );

  const handleToggleActive = useCallback(
    (id: WebhookId, active: boolean) => {
      queryClient.setQueryData<WebhookItem[]>(["webhooks"], (old) =>
        old?.map((w) =>
          w.id === id ? { ...w, isActive: active, updatedAt: new Date().toISOString() } : w
        ) ?? []
      );
      toast.success(
        active ? "Webhook activated" : "Webhook deactivated",
        active ? "Events will now be delivered." : "Events are paused."
      );
    },
    [queryClient]
  );

  const handleDelete = useCallback(
    (id: WebhookId) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleTest = useCallback(
    (id: WebhookId) => {
      testMutation.mutate(id);
    },
    [testMutation]
  );

  const handleRetry = useCallback(
    (id: DeliveryId) => {
      retryMutation.mutate(id);
    },
    [retryMutation]
  );

  return (
    <div className="flex min-h-[100dvh]">
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)]">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Webhook className="h-6 w-6 text-[var(--accent-primary)]" />
                Webhooks
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Manage event subscriptions and monitor delivery health
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AddWebhookDialog onAdded={handleAddWebhook} />
            </div>
          </div>

          {/* Stats */}
          <WebhookStats webhooks={webhooks ?? []} deliveries={deliveries ?? []} />

          {/* Webhook List */}
          <WebhookList
            webhooks={webhooks ?? []}
            isLoading={webhooksLoading}
            selectedWebhookId={selectedWebhookId}
            onSelectWebhook={setSelectedWebhookId}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onTest={handleTest}
          />

          {/* Delivery History */}
          <DeliveryHistory
            deliveries={deliveries ?? []}
            isLoading={deliveriesLoading}
            webhookId={selectedWebhookId}
            onRetry={handleRetry}
          />
        </div>
      </main>
    </div>
  );
}
