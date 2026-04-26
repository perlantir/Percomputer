"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/src/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  Shield,
  ShieldCheck,
  Clock,
  Calendar,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

/* ─── Types ─── */
export type Permission = "read" | "write" | "admin";

export interface ApiKeyUsage {
  requestsThisMonth: number;
  totalRequests: number;
  last24h: number;
  avgLatencyMs: number;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  fullKey?: string;
  createdAt: string;
  lastUsed: string | null;
  permissions: Permission[];
  scopes: string[];
  status: "active" | "revoked";
  usage: ApiKeyUsage;
}

/* ─── Zustand Store (UI State) ─── */
interface ApiKeysUIState {
  generateOpen: boolean;
  setGenerateOpen: (open: boolean) => void;
  revokeTarget: ApiKey | null;
  setRevokeTarget: (key: ApiKey | null) => void;
  usageTarget: ApiKey | null;
  setUsageTarget: (key: ApiKey | null) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
}

const useApiKeysStore = create<ApiKeysUIState>((set) => ({
  generateOpen: false,
  setGenerateOpen: (open) => set({ generateOpen: open }),
  revokeTarget: null,
  setRevokeTarget: (key) => set({ revokeTarget: key }),
  usageTarget: null,
  setUsageTarget: (key) => set({ usageTarget: key }),
  copiedId: null,
  setCopiedId: (id) => set({ copiedId: id }),
}));

/* ─── Demo Data ─── */
const DEMO_API_KEYS: ApiKey[] = [
  {
    id: "key_001",
    name: "Production API",
    prefix: "sk_live_a1b2",
    createdAt: "2024-11-01T10:00:00Z",
    lastUsed: "2025-01-15T08:30:00Z",
    permissions: ["read", "write"],
    scopes: ["workflows", "models"],
    status: "active",
    usage: {
      requestsThisMonth: 124_580,
      totalRequests: 892_340,
      last24h: 4_230,
      avgLatencyMs: 142,
    },
  },
  {
    id: "key_002",
    name: "Staging Test",
    prefix: "sk_test_c3d4",
    createdAt: "2024-12-10T14:20:00Z",
    lastUsed: "2025-01-14T16:45:00Z",
    permissions: ["read", "write"],
    scopes: ["workflows", "models", "artifacts"],
    status: "active",
    usage: {
      requestsThisMonth: 8_420,
      totalRequests: 56_780,
      last24h: 312,
      avgLatencyMs: 98,
    },
  },
  {
    id: "key_003",
    name: "CI/CD Deploy",
    prefix: "sk_live_e5f6",
    createdAt: "2024-09-05T09:15:00Z",
    lastUsed: "2025-01-15T11:00:00Z",
    permissions: ["read"],
    scopes: ["workflows", "artifacts"],
    status: "active",
    usage: {
      requestsThisMonth: 2_150,
      totalRequests: 18_920,
      last24h: 45,
      avgLatencyMs: 205,
    },
  },
  {
    id: "key_004",
    name: "Analytics Pipeline",
    prefix: "sk_live_g7h8",
    createdAt: "2024-10-22T13:40:00Z",
    lastUsed: "2025-01-10T09:20:00Z",
    permissions: ["read", "admin"],
    scopes: ["models", "billing"],
    status: "active",
    usage: {
      requestsThisMonth: 45_200,
      totalRequests: 312_500,
      last24h: 0,
      avgLatencyMs: 178,
    },
  },
  {
    id: "key_005",
    name: "Legacy Integration",
    prefix: "sk_test_i9j0",
    createdAt: "2024-06-15T08:00:00Z",
    lastUsed: "2024-12-20T14:10:00Z",
    permissions: ["read"],
    scopes: ["workflows"],
    status: "revoked",
    usage: {
      requestsThisMonth: 0,
      totalRequests: 45_600,
      last24h: 0,
      avgLatencyMs: 0,
    },
  },
];

/* ─── Data Fetching ─── */
function fetchApiKeys(): Promise<ApiKey[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...DEMO_API_KEYS]), 300);
  });
}

function generateApiKey(
  name: string,
  permissions: Permission[],
  scopes: string[]
): Promise<ApiKey> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `key_${Math.random().toString(36).slice(2, 8)}`;
      const prefix = `sk_live_${Math.random().toString(36).slice(2, 6)}`;
      const fullKey = `${prefix}${Math.random().toString(36).slice(2, 30)}`;
      const now = new Date().toISOString();
      resolve({
        id,
        name,
        prefix,
        fullKey,
        createdAt: now,
        lastUsed: null,
        permissions,
        scopes,
        status: "active",
        usage: {
          requestsThisMonth: 0,
          totalRequests: 0,
          last24h: 0,
          avgLatencyMs: 0,
        },
      });
    }, 500);
  });
}

function revokeApiKey(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 400);
  });
}

/* ─── Formatters ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ─── Permission Badge ─── */
function PermissionBadge({ perm }: { perm: Permission }) {
  const config: Record<
    Permission,
    { variant: "default" | "success" | "warning" | "danger" | "info" | "accent"; icon: React.ReactNode }
  > = {
    read: { variant: "info", icon: <Eye className="h-3 w-3" /> },
    write: { variant: "success", icon: <Shield className="h-3 w-3" /> },
    admin: { variant: "danger", icon: <ShieldCheck className="h-3 w-3" /> },
  };
  const c = config[perm];
  return (
    <Badge variant={c.variant} size="sm" className="gap-1 capitalize">
      {c.icon}
      {perm}
    </Badge>
  );
}

/* ─── Scope Badge ─── */
function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-flex rounded-md bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
      {scope}
    </span>
  );
}

/* ─── Key Cell with Masked/Show Toggle ─── */
function KeyCell({ apiKey }: { apiKey: ApiKey }) {
  const [show, setShow] = useState(false);
  const full = apiKey.fullKey;
  const display = show && full ? full : `${apiKey.prefix}****************************`;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <code className="font-mono text-xs text-[var(--text-secondary)] truncate">
        {display}
      </code>
      {full && (
        <button
          onClick={() => setShow((s) => !s)}
          className="shrink-0 rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={show ? "Hide key" : "Show key"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

/* ─── Usage Statistics Card ─── */
function UsageStatsPanel({ apiKey }: { apiKey: ApiKey }) {
  const { usage } = apiKey;
  const stats = [
    {
      label: "This Month",
      value: formatNumber(usage.requestsThisMonth),
      icon: <BarChart3 className="h-4 w-4 text-[var(--accent-primary)]" />,
    },
    {
      label: "Total Requests",
      value: formatNumber(usage.totalRequests),
      icon: <TrendingUp className="h-4 w-4 text-[var(--semantic-success)]" />,
    },
    {
      label: "Last 24h",
      value: formatNumber(usage.last24h),
      icon: <Clock className="h-4 w-4 text-[var(--semantic-info)]" />,
    },
    {
      label: "Avg Latency",
      value: usage.avgLatencyMs > 0 ? `${usage.avgLatencyMs}ms` : "—",
      icon: <RefreshCw className="h-4 w-4 text-[var(--semantic-warning)]" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} variant="ghost" className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            {stat.icon}
            <span className="text-xs text-[var(--text-tertiary)]">{stat.label}</span>
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}

/* ─── Generate Key Dialog ─── */
function GenerateKeyDialog() {
  const queryClient = useQueryClient();
  const { generateOpen, setGenerateOpen } = useApiKeysStore();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(["read"]);
  const [scopes, setScopes] = useState<string[]>(["workflows"]);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => generateApiKey(name, permissions, scopes),
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["api-keys"] });

      // Snapshot previous value for rollback
      const previousKeys = queryClient.getQueryData<ApiKey[]>(["api-keys"]);

      // Optimistically add a placeholder key with "generating" status
      const optimisticKey: ApiKey = {
        id: `optimistic_${Date.now()}`,
        name,
        prefix: "sk_live_...",
        createdAt: new Date().toISOString(),
        lastUsed: null,
        permissions,
        scopes,
        status: "active",
        usage: {
          requestsThisMonth: 0,
          totalRequests: 0,
          last24h: 0,
          avgLatencyMs: 0,
        },
      };
      queryClient.setQueryData<ApiKey[]>(["api-keys"], (old) =>
        old ? [optimisticKey, ...old] : [optimisticKey]
      );

      return { previousKeys, optimisticId: optimisticKey.id };
    },
    onSuccess: (key, _variables, context) => {
      setNewKey(key);
      // Replace optimistic entry with the real generated key
      queryClient.setQueryData<ApiKey[]>(["api-keys"], (old) => {
        if (!old) return [key];
        return old.map((k) =>
          k.id === context?.optimisticId ? key : k
        );
      });
      toast.success("API key generated", `${key.name} has been created successfully.`);
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous value
      if (context?.previousKeys) {
        queryClient.setQueryData<ApiKey[]>(["api-keys"], context.previousKeys);
      }
      toast.error("Failed to generate key", "Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleClose = useCallback(() => {
    setGenerateOpen(false);
    setTimeout(() => {
      setName("");
      setPermissions(["read"]);
      setScopes(["workflows"]);
      setNewKey(null);
    }, 300);
  }, [setGenerateOpen]);

  const canGenerate = name.trim().length > 0 && permissions.length > 0 && scopes.length > 0;

  return (
    <Dialog open={generateOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[var(--accent-primary)]" />
            Generate API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key with specific permissions and scopes.
          </DialogDescription>
        </DialogHeader>

        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--semantic-success)]/25 bg-[var(--semantic-success)]/8 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-[var(--semantic-success)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Key generated successfully
                </p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Copy this key now — it will not be shown again.
              </p>
              <div className="flex items-center gap-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
                <code className="font-mono text-xs text-[var(--text-primary)] flex-1 break-all">
                  {newKey.fullKey}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(newKey.fullKey ?? "");
                    toast.success("Copied", "API key copied to clipboard.");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Key Name
              </label>
              <Input
                placeholder="e.g. Production API"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Permissions
              </label>
              <div className="flex flex-wrap gap-2">
                {(["read", "write", "admin"] as Permission[]).map((perm) => (
                  <button
                    key={perm}
                    onClick={() => togglePermission(perm)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                      permissions.includes(perm)
                        ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/25 text-[var(--accent-primary)]"
                        : "bg-[var(--bg-surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {permissions.includes(perm) && (
                      <Check className="h-3 w-3" />
                    )}
                    <span className="capitalize">{perm}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Scopes
              </label>
              <div className="flex flex-wrap gap-2">
                {["workflows", "models", "artifacts", "billing", "team"].map((scope) => (
                  <button
                    key={scope}
                    onClick={() => toggleScope(scope)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                      scopes.includes(scope)
                        ? "bg-[var(--semantic-info)]/10 border-[var(--semantic-info)]/25 text-[var(--semantic-info)]"
                        : "bg-[var(--bg-surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {scopes.includes(scope) && <Check className="h-3 w-3" />}
                    <span className="capitalize">{scope}</span>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                loading={generateMutation.isPending}
                disabled={!canGenerate}
                onClick={() => generateMutation.mutate()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Generate Key
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Revoke Confirmation Dialog ─── */
function RevokeDialog() {
  const queryClient = useQueryClient();
  const { revokeTarget, setRevokeTarget } = useApiKeysStore();

  const revokeMutation = useMutation({
    mutationFn: () => revokeApiKey(revokeTarget?.id ?? ""),
    onMutate: async () => {
      if (!revokeTarget) return { previousKeys: undefined as ApiKey[] | undefined };

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["api-keys"] });

      // Snapshot previous value for rollback
      const previousKeys = queryClient.getQueryData<ApiKey[]>(["api-keys"]);

      // Optimistically update the key status to "revoked"
      queryClient.setQueryData<ApiKey[]>(["api-keys"], (old) =>
        old?.map((k) =>
          k.id === revokeTarget.id ? { ...k, status: "revoked" as const } : k
        ) ?? []
      );

      return { previousKeys };
    },
    onSuccess: () => {
      toast.success("Key revoked", `${revokeTarget?.name} has been revoked.`);
      setRevokeTarget(null);
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousKeys) {
        queryClient.setQueryData<ApiKey[]>(["api-keys"], context.previousKeys);
      }
      toast.error("Failed to revoke", "Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  if (!revokeTarget) return null;

  return (
    <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--semantic-danger)]">
            <AlertTriangle className="h-5 w-5" />
            Revoke API Key
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {revokeTarget.name}
            </span>
            ? This action cannot be undone. Any services using this key will immediately lose
            access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setRevokeTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={revokeMutation.isPending}
            onClick={() => revokeMutation.mutate()}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Revoke Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Usage Stats Dialog ─── */
function UsageDialog() {
  const { usageTarget, setUsageTarget } = useApiKeysStore();

  if (!usageTarget) return null;

  return (
    <Dialog open={!!usageTarget} onOpenChange={(open) => !open && setUsageTarget(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />
            Usage Statistics
          </DialogTitle>
          <DialogDescription>
            Activity for{" "}
            <span className="font-medium text-[var(--text-primary)]">{usageTarget.name}</span>
          </DialogDescription>
        </DialogHeader>
        <UsageStatsPanel apiKey={usageTarget} />
        <div className="mt-4 rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">
                  Endpoint
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--text-secondary)]">
                  Calls
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--text-secondary)]">
                  Errors
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--text-secondary)]">
                  Avg Latency
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { endpoint: "/v1/workflows", calls: 8420, errors: 12, latency: 145 },
                { endpoint: "/v1/models", calls: 3200, errors: 3, latency: 89 },
                { endpoint: "/v1/artifacts", calls: 1500, errors: 0, latency: 210 },
                { endpoint: "/v1/billing", calls: 430, errors: 1, latency: 67 },
              ].map((row) => (
                <tr
                  key={row.endpoint}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-2)]/30 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--text-secondary)]">
                    {row.endpoint}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">
                    {formatNumber(row.calls)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={cn(
                        "text-xs",
                        row.errors > 0
                          ? "text-[var(--semantic-danger)]"
                          : "text-[var(--semantic-success)]"
                      )}
                    >
                      {row.errors}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">
                    {row.latency}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button onClick={() => setUsageTarget(null)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Empty State ─── */
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-[var(--bg-surface-2)] p-4 mb-4">
        <KeyRound className="h-8 w-8 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
        No API keys yet
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
        Generate an API key to start making programmatic requests to the platform.
      </p>
      <Button onClick={onGenerate}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Generate First Key
      </Button>
    </Card>
  );
}

/* ─── Table Skeleton ─── */
function TableSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <div className="bg-[var(--bg-surface-2)]/50 border-b border-[var(--border-subtle)]">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_140px] gap-4 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_140px] gap-4 px-4 py-4 items-center"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-28 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ApiKeysPage() {
  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: fetchApiKeys,
    initialData: DEMO_API_KEYS,
  });

  const { setGenerateOpen, setRevokeTarget, setUsageTarget, copiedId, setCopiedId } =
    useApiKeysStore();

  const activeKeys = keys?.filter((k) => k.status === "active") ?? [];
  const revokedKeys = keys?.filter((k) => k.status === "revoked") ?? [];

  const handleCopy = useCallback(
    (key: ApiKey) => {
      const text = key.fullKey ?? `${key.prefix}****************************`;
      navigator.clipboard.writeText(text);
      setCopiedId(key.id);
      toast.success("Copied", `${key.name} API key copied to clipboard.`);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [setCopiedId]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
              API Keys
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Manage API keys for programmatic access to the platform.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 transition-transform active:scale-95"
            onClick={() => setGenerateOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Generate New Key
          </Button>
        </div>

        {/* Stats Overview */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card variant="ghost" className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Active Keys</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {activeKeys.length}
              </p>
            </Card>
            <Card variant="ghost" className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-[var(--semantic-success)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Total Requests</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {formatNumber(
                  activeKeys.reduce((sum, k) => sum + k.usage.totalRequests, 0)
                )}
              </p>
            </Card>
            <Card variant="ghost" className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-[var(--semantic-info)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Last 24h</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {formatNumber(
                  activeKeys.reduce((sum, k) => sum + k.usage.last24h, 0)
                )}
              </p>
            </Card>
            <Card variant="ghost" className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-[var(--semantic-warning)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Revoked</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {revokedKeys.length}
              </p>
            </Card>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : activeKeys.length === 0 ? (
          <EmptyState onGenerate={() => setGenerateOpen(true)} />
        ) : (
          <>
            {/* Active Keys Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--semantic-success)]" />
                  Active Keys
                </CardTitle>
                <CardDescription>
                  {activeKeys.length} active key{activeKeys.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Scopes</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {activeKeys.map((key, index) => (
                          <motion.tr
                            key={key.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{
                              delay: index * 0.04,
                              duration: 0.25,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-2)]/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                  {key.name}
                                </span>
                                <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Created {formatDate(key.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <KeyCell apiKey={key} />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {key.permissions.map((perm) => (
                                  <PermissionBadge key={perm} perm={perm} />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {key.scopes.map((scope) => (
                                  <ScopeBadge key={scope} scope={scope} />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-[var(--text-secondary)]">
                                {formatRelative(key.lastUsed)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 transition-transform active:scale-95"
                                      onClick={() => handleCopy(key)}
                                      aria-label={`Copy ${key.name}`}
                                    >
                                      {copiedId === key.id ? (
                                        <Check className="h-4 w-4 text-[var(--semantic-success)]" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Copy key</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 transition-transform active:scale-95"
                                      onClick={() => setUsageTarget(key)}
                                      aria-label={`Usage for ${key.name}`}
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">View usage</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-[var(--text-tertiary)] hover:text-[var(--semantic-danger)] transition-transform active:scale-95"
                                      onClick={() => setRevokeTarget(key)}
                                      aria-label={`Revoke ${key.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Revoke key</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Revoked Keys Table */}
            {revokedKeys.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <X className="h-4 w-4 text-[var(--semantic-danger)]" />
                    Revoked Keys
                  </CardTitle>
                  <CardDescription>
                    {revokedKeys.length} revoked key{revokedKeys.length !== 1 ? "s" : ""} —
                    these keys no longer have access
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden opacity-70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Used</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revokedKeys.map((key) => (
                          <TableRow
                            key={key.id}
                            className="border-b border-[var(--border-subtle)] last:border-0"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[var(--text-primary)] line-through">
                                  {key.name}
                                </span>
                                <Badge variant="danger" size="sm">
                                  Revoked
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="font-mono text-xs text-[var(--text-tertiary)]">
                                {key.prefix}****************************
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {key.permissions.map((perm) => (
                                  <PermissionBadge key={perm} perm={perm} />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-[var(--text-secondary)]">
                                {formatDate(key.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-[var(--text-secondary)]">
                                {formatRelative(key.lastUsed)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Dialogs */}
        <GenerateKeyDialog />
        <RevokeDialog />
        <UsageDialog />
      </div>
    </TooltipProvider>
  );
}
