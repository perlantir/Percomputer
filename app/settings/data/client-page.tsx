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
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

import {
  Download,
  FileJson,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Shield,
  Clock,
  Calendar,
  Check,
  X,
  HardDrive,
  MessageSquare,
  Brain,
  Users,
  CreditCard,
  Settings,
  Activity,
  Lock,
  Eye,
  ChevronRight,
  FileArchive,
  RefreshCw,
  ExternalLink,
  FileText,
  Zap,
  Server,
  Globe,
} from "lucide-react";

/* ─── Types ─── */
export type ExportFormat = "json" | "csv" | "zip";
export type ExportStatus = "pending" | "processing" | "ready" | "expired";

export interface DataCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  sizeEstimate: string;
  recordCount: number;
}

export interface ExportJob {
  id: string;
  format: ExportFormat;
  categories: string[];
  status: ExportStatus;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  fileSize: string | null;
}

export interface RetentionRule {
  category: string;
  period: string;
  description: string;
  icon: React.ReactNode;
}

/* ─── Zustand Store (UI State) ─── */
interface DataExportUIState {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  confirmText: string;
  setConfirmText: (text: string) => void;
}

const useDataExportStore = create<DataExportUIState>((set) => ({
  deleteDialogOpen: false,
  setDeleteDialogOpen: (open) => set({ deleteDialogOpen: open }),
  confirmText: "",
  setConfirmText: (text) => set({ confirmText: text }),
}));

/* ─── Demo Data ─── */
const DATA_CATEGORIES: DataCategory[] = [
  {
    id: "profile",
    label: "Profile Data",
    description: "Name, email, avatar, timezone preferences",
    icon: <Shield className="h-4 w-4 text-[var(--accent-primary)]" />,
    sizeEstimate: "12 KB",
    recordCount: 1,
  },
  {
    id: "workflows",
    label: "Workflows & Runs",
    description: "All workflows, executions, logs, and outputs",
    icon: <Zap className="h-4 w-4 text-[var(--semantic-warning)]" />,
    sizeEstimate: "3.4 MB",
    recordCount: 147,
  },
  {
    id: "memory",
    label: "Memory & Context",
    description: "Episodic and semantic memory entries",
    icon: <Brain className="h-4 w-4 text-[var(--accent-tertiary)]" />,
    sizeEstimate: "892 KB",
    recordCount: 324,
  },
  {
    id: "conversations",
    label: "Conversations",
    description: "Chat history and message threads",
    icon: <MessageSquare className="h-4 w-4 text-[var(--semantic-info)]" />,
    sizeEstimate: "1.8 MB",
    recordCount: 58,
  },
  {
    id: "billing",
    label: "Billing & Usage",
    description: "Invoices, payment methods, usage logs",
    icon: <CreditCard className="h-4 w-4 text-[var(--semantic-success)]" />,
    sizeEstimate: "156 KB",
    recordCount: 24,
  },
  {
    id: "api_keys",
    label: "API Keys & Access",
    description: "Key metadata, permissions, access logs",
    icon: <Lock className="h-4 w-4 text-[var(--text-tertiary)]" />,
    sizeEstimate: "8 KB",
    recordCount: 5,
  },
  {
    id: "team",
    label: "Team Data",
    description: "Team memberships, roles, invitations",
    icon: <Users className="h-4 w-4 text-[var(--accent-primary)]" />,
    sizeEstimate: "4 KB",
    recordCount: 3,
  },
  {
    id: "activity",
    label: "Activity Logs",
    description: "Audit trail of all account activity",
    icon: <Activity className="h-4 w-4 text-[var(--semantic-info)]" />,
    sizeEstimate: "2.1 MB",
    recordCount: 2156,
  },
];

const DEMO_EXPORT_HISTORY: ExportJob[] = [
  {
    id: "exp_001",
    format: "json",
    categories: ["profile", "workflows", "memory", "conversations", "billing", "api_keys", "team", "activity"],
    status: "ready",
    createdAt: "2025-01-10T14:30:00Z",
    completedAt: "2025-01-10T14:32:15Z",
    expiresAt: "2025-02-10T14:32:15Z",
    fileSize: "8.2 MB",
  },
  {
    id: "exp_002",
    format: "zip",
    categories: ["profile", "workflows", "conversations"],
    status: "expired",
    createdAt: "2024-12-01T09:00:00Z",
    completedAt: "2024-12-01T09:03:42Z",
    expiresAt: "2025-01-01T09:03:42Z",
    fileSize: "5.1 MB",
  },
  {
    id: "exp_003",
    format: "csv",
    categories: ["billing", "activity"],
    status: "expired",
    createdAt: "2024-11-15T16:20:00Z",
    completedAt: "2024-11-15T16:21:08Z",
    expiresAt: "2024-12-15T16:21:08Z",
    fileSize: "1.9 MB",
  },
];

const RETENTION_RULES: RetentionRule[] = [
  {
    category: "Workflow Data",
    period: "90 days",
    description: "Execution logs and outputs retained for 90 days. Archived data available on request.",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    category: "Conversations",
    period: "1 year",
    description: "Chat history retained for 1 year. You can delete individual conversations at any time.",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    category: "Memory Entries",
    period: "Until deletion",
    description: "Memory persists until you delete it or disable the memory feature.",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    category: "Billing Records",
    period: "7 years",
    description: "Invoices and payment records kept for tax and accounting compliance.",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    category: "API Access Logs",
    period: "90 days",
    description: "API request logs retained for security monitoring and troubleshooting.",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    category: "Activity/Audit Logs",
    period: "1 year",
    description: "Account activity logs kept for compliance and security auditing.",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    category: "Deleted Account Data",
    period: "30 days",
    description: "After account deletion, residual data is purged within 30 days per GDPR requirements.",
    icon: <Trash2 className="h-4 w-4" />,
  },
];

/* ─── Data Fetching ─── */
function fetchDataCategories(): Promise<DataCategory[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...DATA_CATEGORIES]), 250);
  });
}

function fetchExportHistory(): Promise<ExportJob[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...DEMO_EXPORT_HISTORY]), 300);
  });
}

function createDataExport(
  format: ExportFormat,
  categories: string[]
): Promise<ExportJob> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `exp_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      resolve({
        id,
        format,
        categories,
        status: "processing",
        createdAt: now.toISOString(),
        completedAt: null,
        expiresAt: expiresAt.toISOString(),
        fileSize: null,
      });
    }, 600);
  });
}

function deleteAccount(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 800);
  });
}

/* ─── Formatters ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "—";
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

function getFormatIcon(format: ExportFormat) {
  switch (format) {
    case "json":
      return <FileJson className="h-4 w-4 text-[var(--semantic-warning)]" />;
    case "csv":
      return <FileSpreadsheet className="h-4 w-4 text-[var(--semantic-success)]" />;
    case "zip":
      return <FileArchive className="h-4 w-4 text-[var(--accent-primary)]" />;
  }
}

function getFormatLabel(format: ExportFormat): string {
  return format.toUpperCase();
}

function getStatusBadge(status: ExportStatus) {
  switch (status) {
    case "ready":
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <Check className="h-3 w-3" />
          Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="info" size="sm" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="warning" size="sm" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="default" size="sm" className="gap-1">
          <X className="h-3 w-3" />
          Expired
        </Badge>
      );
  }
}

/* ─── Export Format Selector ─── */
function FormatSelector({
  value,
  onChange,
}: {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}) {
  const formats: { value: ExportFormat; label: string; description: string }[] = [
    { value: "json", label: "JSON", description: "Machine-readable, structured format" },
    { value: "csv", label: "CSV", description: "Spreadsheet-compatible tabular format" },
    { value: "zip", label: "ZIP Archive", description: "Combined archive of all data files" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {formats.map((fmt) => (
        <button
          key={fmt.value}
          onClick={() => onChange(fmt.value)}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-fast",
            value === fmt.value
              ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/8"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)]/60"
          )}
        >
          <div className="mt-0.5 shrink-0">{getFormatIcon(fmt.value)}</div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{fmt.label}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{fmt.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Data Category Selector ─── */
function CategorySelector({
  categories,
  selected,
  onToggle,
}: {
  categories: DataCategory[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const isSelected = selected.includes(cat.id);
        return (
          <motion.button
            key={cat.id}
            onClick={() => onToggle(cat.id)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-all duration-fast",
              isSelected
                ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5"
                : "border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)]/40"
            )}
            whileTap={{ scale: 0.995 }}
          >
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors duration-fast",
                isSelected
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                  : "border-[var(--border-default)]"
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
            </div>
            <div className="shrink-0">{cat.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">{cat.label}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{cat.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-[var(--text-secondary)]">{cat.sizeEstimate}</p>
              <p className="text-2xs text-[var(--text-tertiary)]">{cat.recordCount.toLocaleString()} records</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Data Export Card ─── */
function DataExportCard() {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DATA_CATEGORIES.map((c) => c.id)
  );

  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["data-categories"],
    queryFn: fetchDataCategories,
    initialData: DATA_CATEGORIES,
  });

  const exportMutation = useMutation({
    mutationFn: () => createDataExport(format, selectedCategories),
    onSuccess: (job) => {
      queryClient.setQueryData<ExportJob[]>(["export-history"], (old) => {
        if (!old) return [job];
        return [job, ...old];
      });
      toast.success(
        "Export started",
        `Your data export (${getFormatLabel(job.format)}) is being prepared. You'll be notified when it's ready.`
      );
    },
    onError: () => {
      toast.error("Export failed", "Please try again.");
    },
  });

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedCategories((prev) =>
      prev.length === DATA_CATEGORIES.length ? [] : DATA_CATEGORIES.map((c) => c.id)
    );
  }, []);

  const totalRecords = categories
    ?.filter((c) => selectedCategories.includes(c.id))
    .reduce((sum, c) => sum + c.recordCount, 0);

  return (
    <Card className="transition-all duration-fast hover:shadow-medium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-[var(--accent-primary)]" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download a copy of your personal data under GDPR Article 20 (Data Portability)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Export Format
          </label>
          <FormatSelector value={format} onChange={setFormat} />
        </div>

        <Separator />

        {/* Category Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Data Categories
            </label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAll}>
              {selectedCategories.length === DATA_CATEGORIES.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
          <CategorySelector
            categories={categories ?? []}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />
        </div>

        <Separator />

        {/* Export Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-[var(--bg-surface-2)]/50 p-3">
          <div className="flex items-center gap-4">
            <div className="text-xs text-[var(--text-secondary)]">
              <span className="font-medium">{selectedCategories.length}</span> of{" "}
              {DATA_CATEGORIES.length} categories selected
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              <span className="font-medium">{totalRecords?.toLocaleString() ?? 0}</span> records
            </div>
          </div>
          <Button
            size="sm"
            loading={exportMutation.isPending}
            disabled={selectedCategories.length === 0}
            onClick={() => exportMutation.mutate()}
            className="transition-transform active:scale-95"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Request Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Export History Card ─── */
function ExportHistoryCard() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["export-history"],
    queryFn: fetchExportHistory,
    initialData: DEMO_EXPORT_HISTORY,
  });

  return (
    <Card className="transition-all duration-fast hover:shadow-medium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--semantic-info)]" />
          Export History
        </CardTitle>
        <CardDescription>
          Previous data exports are available for 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence>
              {history.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    delay: index * 0.04,
                    duration: 0.25,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-3 transition-colors",
                    job.status === "expired"
                      ? "border-[var(--border-subtle)] opacity-60"
                      : "border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)]/30"
                  )}
                >
                  <div className="shrink-0">{getFormatIcon(job.format)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Full Data Export
                      </span>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-2xs text-[var(--text-tertiary)] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelative(job.createdAt)}
                      </span>
                      <span className="text-2xs text-[var(--text-tertiary)]">
                        {job.categories.length} categories
                      </span>
                      {job.fileSize && (
                        <span className="text-2xs text-[var(--text-tertiary)]">
                          {job.fileSize}
                        </span>
                      )}
                    </div>
                  </div>
                  {job.status === "ready" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 transition-transform active:scale-95"
                      onClick={() => {
                        toast.success("Download started", `Export ${job.id} is being downloaded.`);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <FileText className="h-6 w-6 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-tertiary)]">No export history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Data Categories Card ─── */
function DataCategoriesCard() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["data-categories"],
    queryFn: fetchDataCategories,
    initialData: DATA_CATEGORIES,
  });

  const totalRecords = categories?.reduce((sum, c) => sum + c.recordCount, 0) ?? 0;
  const totalSize = "~8.4 MB";

  return (
    <Card className="transition-all duration-fast hover:shadow-medium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-[var(--accent-primary)]" />
          Your Data Overview
        </CardTitle>
        <CardDescription>
          Summary of data stored in your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[var(--bg-surface-2)]/50 p-3">
              <p className="text-2xs text-[var(--text-tertiary)] uppercase tracking-wider">Total Records</p>
              <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                {totalRecords.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface-2)]/50 p-3">
              <p className="text-2xs text-[var(--text-tertiary)] uppercase tracking-wider">Est. Size</p>
              <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">{totalSize}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface-2)]/50 p-3">
              <p className="text-2xs text-[var(--text-tertiary)] uppercase tracking-wider">Data Categories</p>
              <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                {categories?.length ?? 0}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Category List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="space-y-1">
              {categories?.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.03,
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[var(--bg-surface-2)]/30 transition-colors"
                >
                  <div className="shrink-0">{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{cat.label}</p>
                    <p className="text-2xs text-[var(--text-tertiary)]">{cat.description}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-right shrink-0 cursor-default">
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          {cat.recordCount.toLocaleString()}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{cat.sizeEstimate}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Retention Policy Card ─── */
function RetentionPolicyCard() {
  return (
    <Card className="transition-all duration-fast hover:shadow-medium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--semantic-info)]" />
          Data Retention Policy
        </CardTitle>
        <CardDescription>
          How long different types of data are retained
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {RETENTION_RULES.map((rule, index) => (
            <motion.div
              key={rule.category}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.04,
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] p-3"
            >
              <div className="mt-0.5 shrink-0 text-[var(--text-tertiary)]">
                {rule.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {rule.category}
                  </p>
                  <Badge variant="info" size="sm">
                    {rule.period}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {rule.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-[var(--semantic-info)]/20 bg-[var(--semantic-info)]/5 p-3 flex items-start gap-3">
          <Globe className="h-4 w-4 text-[var(--semantic-info)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              GDPR Compliance
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Under the General Data Protection Regulation (GDPR), you have the right to
              access, rectify, erase, and port your personal data. We respond to all
              requests within 30 days. Contact{" "}
              <a
                href="mailto:privacy@platform.com"
                className="text-[var(--accent-primary)] hover:underline"
              >
                privacy@platform.com
              </a>{" "}
              for data subject requests.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Delete Account Dialog ─── */
function DeleteAccountDialog() {
  const queryClient = useQueryClient();
  const { deleteDialogOpen, setDeleteDialogOpen, confirmText, setConfirmText } =
    useDataExportStore();

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success(
        "Account deletion scheduled",
        "Your account and all associated data will be permanently deleted within 30 days."
      );
      setDeleteDialogOpen(false);
      setConfirmText("");
    },
    onError: () => {
      toast.error("Request failed", "Please try again.");
    },
  });

  const isConfirmed = confirmText.toLowerCase() === "delete my account";

  return (
    <Dialog
      open={deleteDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogOpen(false);
          setTimeout(() => setConfirmText(""), 300);
        }
      }}
    >
      <DialogContent className="max-w-lg border-[var(--semantic-danger)]/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--semantic-danger)]">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action is <span className="font-semibold text-[var(--text-primary)]">irreversible</span>.
            All your data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Consequences */}
          <div className="rounded-lg border border-[var(--semantic-danger)]/15 bg-[var(--semantic-danger)]/5 p-3 space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              You will lose:
            </p>
            <ul className="space-y-1">
              {[
                "All workflows and execution history",
                "Memory entries and contextual data",
                "Conversations and chat history",
                "API keys and integrations",
                "Team memberships and roles",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <X className="h-3 w-3 text-[var(--semantic-danger)] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Retention notice */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/30 p-3 flex items-start gap-2">
            <Clock className="h-4 w-4 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-secondary)]">
              Per GDPR requirements, your data will be queued for deletion and fully
              purged within 30 days. Billing records are retained for 7 years per
              tax regulations.
            </p>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Type <span className="font-mono text-[var(--semantic-danger)]">delete my account</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--semantic-danger)]/30 focus:border-[var(--semantic-danger)]/50 transition-all"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteDialogOpen(false);
              setConfirmText("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            disabled={!isConfirmed}
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Danger Zone Card ─── */
function DangerZoneCard() {
  const { setDeleteDialogOpen } = useDataExportStore();

  return (
    <Card className="border-[var(--semantic-danger)]/20 bg-[var(--semantic-danger)]/[0.02] transition-all duration-fast hover:shadow-medium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-[var(--semantic-danger)]">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-[var(--text-secondary)]">
          Destructive actions that cannot be undone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delete Account */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[var(--semantic-danger)]/15 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Delete Account
            </p>
            <p className="text-xs text-[var(--text-tertiary)] max-w-md">
              Permanently delete your account and all associated data. This action
              cannot be reversed. Your data will be queued for deletion per GDPR
              requirements.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            className="shrink-0 transition-transform active:scale-95"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── GDPR Rights Quick Reference ─── */
function GDPRRightsCard() {
  const rights = [
    {
      label: "Right to Access",
      description: "Request a copy of all personal data we hold about you",
      icon: <Eye className="h-4 w-4" />,
      action: "Use the export tool above",
    },
    {
      label: "Right to Erasure",
      description: "Request deletion of your personal data",
      icon: <Trash2 className="h-4 w-4" />,
      action: "Use Delete Account in Danger Zone",
    },
    {
      label: "Right to Portability",
      description: "Receive your data in a structured, machine-readable format",
      icon: <Download className="h-4 w-4" />,
      action: "Choose JSON format for export",
    },
    {
      label: "Right to Rectification",
      description: "Correct inaccurate or incomplete data",
      icon: <Settings className="h-4 w-4" />,
      action: "Update in Profile settings",
    },
  ];

  return (
    <Card className="transition-all duration-fast hover:shadow-medium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--semantic-success)]" />
          Your Privacy Rights
        </CardTitle>
        <CardDescription>
          Quick reference to your data protection rights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rights.map((right, index) => (
            <motion.div
              key={right.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-lg border border-[var(--border-subtle)] p-3 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                {right.icon}
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {right.label}
                </p>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {right.description}
              </p>
              <p className="text-2xs text-[var(--text-tertiary)] flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {right.action}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function DataExportPage() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Data &amp; Privacy
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your data exports, understand what we store, and exercise your privacy rights.
          </p>
        </div>

        {/* GDPR Rights Quick Reference */}
        <GDPRRightsCard />

        {/* Data Export Tool */}
        <DataExportCard />

        {/* Data Overview */}
        <DataCategoriesCard />

        {/* Export History */}
        <ExportHistoryCard />

        {/* Retention Policy */}
        <RetentionPolicyCard />

        {/* Danger Zone */}
        <DangerZoneCard />

        {/* Contact Info */}
        <div className="text-center py-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            Questions about your data? Contact us at{" "}
            <a
              href="mailto:privacy@platform.com"
              className="text-[var(--accent-primary)] hover:underline"
            >
              privacy@platform.com
            </a>{" "}
            or review our{" "}
            <a href="#" className="text-[var(--accent-primary)] hover:underline">
              Privacy Policy
            </a>
            .
          </p>
          <p className="text-2xs text-[var(--text-tertiary)] mt-1">
            Data requests are processed within 30 days per GDPR requirements.
          </p>
        </div>

        {/* Delete Account Dialog */}
        <DeleteAccountDialog />
      </div>
    </TooltipProvider>
  );
}
