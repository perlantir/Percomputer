"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { cn } from "@/src/lib/utils";
import { DEMO_USERS } from "@/src/data/demo-users";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";
import { DEMO_SPACES } from "@/src/data/demo-spaces";
import { toast } from "@/src/components/layout/Toaster";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Separator } from "@/src/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/src/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/src/components/ui/tooltip";
import {
  Users,
  Building2,
  Activity,
  ToggleLeft,
  Gauge,
  Search,
  MoreHorizontal,
  Shield,
  Mail,
  Clock,
  Cpu,
  Database,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Ban,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Layers,
  Globe,
  Server,
  Trash2,
  Edit3,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
  status: "active" | "suspended" | "pending";
  createdAt: string;
  lastActiveAt: string;
  workflowCount: number;
}

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  memberCount: number;
  workflowCount: number;
  status: "active" | "suspended" | "trial";
  createdAt: string;
  ownerEmail: string;
}

interface SystemStat {
  label: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: "global" | "org" | "user";
  rolloutPct: number;
  modifiedAt: string;
}

interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  requestsPerMinute: number;
  burstLimit: number;
  scope: "global" | "org" | "user";
  status: "active" | "disabled";
}

/* ═══════════════════════════════════════════════════════════════
   Zustand Store — Admin UI State
   ═══════════════════════════════════════════════════════════════ */

interface AdminStore {
  userSearch: string;
  userRoleFilter: string;
  userStatusFilter: string;
  orgSearch: string;
  orgPlanFilter: string;
  featureSearch: string;
  selectedUserIds: string[];
  setUserSearch: (v: string) => void;
  setUserRoleFilter: (v: string) => void;
  setUserStatusFilter: (v: string) => void;
  setOrgSearch: (v: string) => void;
  setOrgPlanFilter: (v: string) => void;
  setFeatureSearch: (v: string) => void;
  toggleUserSelection: (id: string) => void;
  selectAllUsers: (ids: string[]) => void;
  clearUserSelection: () => void;
}

const useAdminStore = create<AdminStore>((set) => ({
  userSearch: "",
  userRoleFilter: "all",
  userStatusFilter: "all",
  orgSearch: "",
  orgPlanFilter: "all",
  featureSearch: "",
  selectedUserIds: [],
  setUserSearch: (v) => set({ userSearch: v }),
  setUserRoleFilter: (v) => set({ userRoleFilter: v }),
  setUserStatusFilter: (v) => set({ userStatusFilter: v }),
  setOrgSearch: (v) => set({ orgSearch: v }),
  setOrgPlanFilter: (v) => set({ orgPlanFilter: v }),
  setFeatureSearch: (v) => set({ featureSearch: v }),
  toggleUserSelection: (id) =>
    set((s) => ({
      selectedUserIds: s.selectedUserIds.includes(id)
        ? s.selectedUserIds.filter((x) => x !== id)
        : [...s.selectedUserIds, id],
    })),
  selectAllUsers: (ids) => set({ selectedUserIds: ids }),
  clearUserSelection: () => set({ selectedUserIds: [] }),
}));

/* ═══════════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════════ */

const ADMIN_USERS: AdminUser[] = DEMO_USERS.map((u) => ({
  ...u,
  status: u.id === "usr_2f6c8d3e5b9a" ? "pending" : "active",
  workflowCount: DEMO_WORKFLOWS.filter((w) => w.userId === u.id).length,
}));

const ORGS: Org[] = [
  {
    id: "org_acme_001",
    name: "Acme Research Partners",
    slug: "acme-research",
    plan: "enterprise",
    memberCount: 12,
    workflowCount: 48,
    status: "active",
    createdAt: "2023-11-15T08:00:00Z",
    ownerEmail: "sarah.chen@acme-research.com",
  },
  {
    id: "org_indie_002",
    name: "Indie Dev Collective",
    slug: "indie-dev",
    plan: "pro",
    memberCount: 5,
    workflowCount: 16,
    status: "active",
    createdAt: "2024-02-20T14:30:00Z",
    ownerEmail: "alex.patel@indie.dev",
  },
  {
    id: "org_starter_003",
    name: "StartupXYZ",
    slug: "startup-xyz",
    plan: "free",
    memberCount: 2,
    workflowCount: 4,
    status: "trial",
    createdAt: "2025-01-05T10:00:00Z",
    ownerEmail: "founder@startupxyz.io",
  },
  {
    id: "org_tech_004",
    name: "TechGlobal Inc",
    slug: "techglobal",
    plan: "enterprise",
    memberCount: 34,
    workflowCount: 156,
    status: "active",
    createdAt: "2023-05-10T09:15:00Z",
    ownerEmail: "admin@techglobal.com",
  },
  {
    id: "org_suspend_005",
    name: "DataVault Corp",
    slug: "datavault",
    plan: "pro",
    memberCount: 8,
    workflowCount: 23,
    status: "suspended",
    createdAt: "2024-06-01T11:00:00Z",
    ownerEmail: "ops@datavault.io",
  },
];

const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: "ff_001",
    name: "multi_model_chat",
    description: "Enable multi-model parallel chat comparison",
    enabled: true,
    scope: "global",
    rolloutPct: 100,
    modifiedAt: "2025-01-10T12:00:00Z",
  },
  {
    id: "ff_002",
    name: "agent_memory_v2",
    description: "Next-generation episodic memory with vector search",
    enabled: true,
    scope: "org",
    rolloutPct: 75,
    modifiedAt: "2025-01-12T09:30:00Z",
  },
  {
    id: "ff_003",
    name: "web_search",
    description: "Grounded web search for all agents",
    enabled: true,
    scope: "global",
    rolloutPct: 100,
    modifiedAt: "2024-12-20T15:00:00Z",
  },
  {
    id: "ff_004",
    name: "code_interpreter",
    description: "In-browser code execution for Python & JS",
    enabled: false,
    scope: "user",
    rolloutPct: 25,
    modifiedAt: "2025-01-14T11:00:00Z",
  },
  {
    id: "ff_005",
    name: "billing_v2",
    description: "New billing dashboard with usage analytics",
    enabled: true,
    scope: "org",
    rolloutPct: 50,
    modifiedAt: "2025-01-13T08:45:00Z",
  },
  {
    id: "ff_006",
    name: "sso_login",
    description: "Enterprise SSO via SAML 2.0 / OIDC",
    enabled: false,
    scope: "org",
    rolloutPct: 0,
    modifiedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "ff_007",
    name: "workflow_marketplace",
    description: "Publish and discover community workflows",
    enabled: false,
    scope: "global",
    rolloutPct: 10,
    modifiedAt: "2025-01-14T16:20:00Z",
  },
];

const RATE_LIMITS: RateLimitRule[] = [
  {
    id: "rl_001",
    name: "Workflow Create",
    endpoint: "POST /api/workflows",
    requestsPerMinute: 30,
    burstLimit: 10,
    scope: "user",
    status: "active",
  },
  {
    id: "rl_002",
    name: "Chat Completion",
    endpoint: "POST /api/chat",
    requestsPerMinute: 120,
    burstLimit: 20,
    scope: "user",
    status: "active",
  },
  {
    id: "rl_003",
    name: "Model List",
    endpoint: "GET /api/models",
    requestsPerMinute: 60,
    burstLimit: 15,
    scope: "global",
    status: "active",
  },
  {
    id: "rl_004",
    name: "File Upload",
    endpoint: "POST /api/upload",
    requestsPerMinute: 20,
    burstLimit: 5,
    scope: "org",
    status: "active",
  },
  {
    id: "rl_005",
    name: "Export Artifacts",
    endpoint: "POST /api/artifacts/export",
    requestsPerMinute: 10,
    burstLimit: 3,
    scope: "user",
    status: "disabled",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Data Fetching Helpers
   ═══════════════════════════════════════════════════════════════ */

function fetchSystemStats(): Promise<SystemStat[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          label: "Total Users",
          value: 1_247,
          change: 12.5,
          changeLabel: "vs last month",
          icon: Users,
        },
        {
          label: "Active Orgs",
          value: 89,
          change: 8.2,
          changeLabel: "vs last month",
          icon: Building2,
        },
        {
          label: "Workflows Run",
          value: "48.2K",
          change: 23.1,
          changeLabel: "vs last month",
          icon: Zap,
        },
        {
          label: "API Requests",
          value: "1.2M",
          change: -4.3,
          changeLabel: "vs last month",
          icon: Activity,
        },
        {
          label: "Avg Latency",
          value: "142ms",
          change: -18.5,
          changeLabel: "vs last month",
          icon: Gauge,
        },
        {
          label: "System Health",
          value: "99.97%",
          change: 0.02,
          changeLabel: "uptime",
          icon: Server,
        },
      ]);
    }, 300);
  });
}

function fetchUsers(): Promise<AdminUser[]> {
  return new Promise((resolve) => setTimeout(() => resolve(ADMIN_USERS), 250));
}

function fetchOrgs(): Promise<Org[]> {
  return new Promise((resolve) => setTimeout(() => resolve(ORGS), 250));
}

function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  return new Promise((resolve) => setTimeout(() => resolve(FEATURE_FLAGS), 200));
}

function fetchRateLimits(): Promise<RateLimitRule[]> {
  return new Promise((resolve) => setTimeout(() => resolve(RATE_LIMITS), 200));
}

/* ═══════════════════════════════════════════════════════════════
   Section Components
   ═══════════════════════════════════════════════════════════════ */

/* ── Stat Card ── */
function StatCard({ stat }: { stat: SystemStat }) {
  const isPositive = stat.change >= 0;
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        variant="elevated"
        className="group cursor-default transition-all duration-fast hover:shadow-high"
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {stat.value}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface-2)] p-2.5 group-hover:bg-[var(--accent-primary)]/10 transition-colors duration-fast">
              <Icon className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors duration-fast" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--semantic-success)]" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-[var(--semantic-danger)]" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive
                  ? "text-[var(--semantic-success)]"
                  : "text-[var(--semantic-danger)]"
              )}
            >
              {isPositive ? "+" : ""}
              {stat.change}%
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {stat.changeLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Stats Loading Skeleton ── */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── System Stats Section ── */
function SystemStatsSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchSystemStats,
  });

  if (isLoading || !stats) return <StatsSkeleton />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

/* ── User Status Badge ── */
function UserStatusBadge({ status }: { status: AdminUser["status"] }) {
  const variantMap = {
    active: "success" as const,
    suspended: "danger" as const,
    pending: "warning" as const,
  };
  return (
    <Badge variant={variantMap[status]} size="sm">
      {status}
    </Badge>
  );
}

/* ── Role Badge ── */
function RoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();
  if (normalized === "admin")
    return <Badge variant="accent" size="sm">{role}</Badge>;
  if (normalized === "analyst")
    return <Badge variant="info" size="sm">{role}</Badge>;
  return <Badge variant="default" size="sm">{role}</Badge>;
}

/* ── Users Section ── */
function UsersSection() {
  const queryClient = useQueryClient();
  const {
    userSearch,
    userRoleFilter,
    userStatusFilter,
    selectedUserIds,
    setUserSearch,
    setUserRoleFilter,
    setUserStatusFilter,
    toggleUserSelection,
    selectAllUsers,
    clearUserSelection,
  } = useAdminStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const suspendMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await new Promise((r) => setTimeout(r, 300));
      return userIds;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      clearUserSelection();
      toast.success(
        ids.length === 1 ? "User suspended" : `${ids.length} users suspended`,
        "The selected accounts have been suspended."
      );
    },
  });

  const filteredUsers = (users ?? []).filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.orgName.toLowerCase().includes(q);
    const matchesRole =
      userRoleFilter === "all" || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === "all" || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const allSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={userStatusFilter}
            onValueChange={setUserStatusFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedUserIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {selectedUserIds.length} selected
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => suspendMutation.mutate(selectedUserIds)}
              loading={suspendMutation.isPending}
            >
              <Ban className="mr-1 h-3.5 w-3.5" />
              Suspend
            </Button>
          </motion.div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        allSelected
                          ? clearUserSelection()
                          : selectAllUsers(filteredUsers.map((u) => u.id))
                      }
                      className="rounded border-[var(--border-default)]"
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflows</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.03,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-surface-2)]/50"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-[var(--border-default)]"
                          aria-label={`Select ${user.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-xs font-semibold text-[var(--accent-primary)]">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {user.name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-secondary)]">
                        {user.orgName}
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                          <Layers className="h-3.5 w-3.5" />
                          {user.workflowCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-tertiary)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(user.lastActiveAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Edit User", `Editing ${user.name}`)
                              }
                            >
                              <Edit3 className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(
                                  "Send Email",
                                  `Opening email to ${user.email}`
                                )
                              }
                            >
                              <Mail className="mr-2 h-3.5 w-3.5" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-[var(--semantic-danger)]"
                              onClick={() =>
                                suspendMutation.mutate([user.id])
                              }
                            >
                              <Ban className="mr-2 h-3.5 w-3.5" />
                              Suspend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No users found
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ── Org Plan Badge ── */
function PlanBadge({ plan }: { plan: Org["plan"] }) {
  const map = {
    free: "default" as const,
    pro: "info" as const,
    enterprise: "accent" as const,
  };
  return <Badge variant={map[plan]} size="sm">{plan}</Badge>;
}

/* ── Orgs Section ── */
function OrgsSection() {
  const { orgSearch, orgPlanFilter, setOrgSearch, setOrgPlanFilter } =
    useAdminStore();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["admin-orgs"],
    queryFn: fetchOrgs,
  });

  const filteredOrgs = (orgs ?? []).filter((o) => {
    const q = orgSearch.toLowerCase();
    const matchesSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.ownerEmail.toLowerCase().includes(q);
    const matchesPlan =
      orgPlanFilter === "all" || o.plan === orgPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search organizations..."
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={orgPlanFilter} onValueChange={setOrgPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Workflows</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredOrgs.map((org, index) => (
                    <motion.tr
                      key={org.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.03,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-surface-2)]/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface-2)]">
                            <Building2 className="h-4 w-4 text-[var(--text-secondary)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {org.name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              @{org.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanBadge plan={org.plan} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            org.status === "active"
                              ? "success"
                              : org.status === "suspended"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {org.memberCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {org.workflowCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-secondary)]">
                        {org.ownerEmail}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-tertiary)]">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Edit Org", `Editing ${org.name}`)
                              }
                            >
                              <Edit3 className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("View Members", org.name)
                              }
                            >
                              <Users className="mr-2 h-3.5 w-3.5" />
                              View Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-[var(--semantic-danger)]"
                              onClick={() =>
                                toast.warning(
                                  "Org Suspended",
                                  `${org.name} has been suspended.`
                                )
                              }
                            >
                              <Ban className="mr-2 h-3.5 w-3.5" />
                              Suspend Org
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          {filteredOrgs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No organizations found
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ── Feature Flags Section ── */
function FeatureFlagsSection() {
  const queryClient = useQueryClient();
  const { featureSearch, setFeatureSearch } = useAdminStore();

  const { data: flags, isLoading } = useQuery({
    queryKey: ["admin-features"],
    queryFn: fetchFeatureFlags,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id, enabled };
    },
    onSuccess: ({ id, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-features"] });
      const flag = flags?.find((f) => f.id === id);
      toast.success(
        enabled ? "Flag Enabled" : "Flag Disabled",
        flag
          ? `"${flag.name}" is now ${enabled ? "enabled" : "disabled"}.`
          : ""
      );
    },
  });

  const updateRolloutMutation = useMutation({
    mutationFn: async ({ id, pct }: { id: string; pct: number }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id, pct };
    },
    onSuccess: ({ pct }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-features"] });
      toast.success("Rollout Updated", `Percentage set to ${pct}%`);
    },
  });

  const filteredFlags = (flags ?? []).filter((f) => {
    const q = featureSearch.toLowerCase();
    return (
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          placeholder="Search feature flags..."
          value={featureSearch}
          onChange={(e) => setFeatureSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {filteredFlags.map((flag, index) => (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Card className="group transition-all duration-fast hover:shadow-medium">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {flag.name}
                        </p>
                        <Badge variant="default" size="sm">
                          {flag.scope}
                        </Badge>
                        {flag.enabled ? (
                          <Badge variant="success" size="sm">
                            enabled
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {flag.description}
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            Rollout:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-20 rounded-full bg-[var(--bg-surface-2)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-fast"
                                style={{ width: `${flag.rolloutPct}%` }}
                              />
                            </div>
                            <Select
                              value={String(flag.rolloutPct)}
                              onValueChange={(v) =>
                                updateRolloutMutation.mutate({
                                  id: flag.id,
                                  pct: Number(v),
                                })
                              }
                            >
                              <SelectTrigger className="h-6 w-[72px] text-xs border-0 bg-transparent p-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 10, 25, 50, 75, 100].map((pct) => (
                                  <SelectItem
                                    key={pct}
                                    value={String(pct)}
                                    className="text-xs"
                                  >
                                    {pct}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          Modified{" "}
                          {new Date(flag.modifiedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: flag.id,
                          enabled: checked,
                        })
                      }
                      aria-label={`Toggle ${flag.name}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredFlags.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ToggleLeft className="h-8 w-8 text-[var(--text-tertiary)]" />
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            No feature flags found
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Rate Limiting Section ── */
function RateLimitsSection() {
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["admin-rate-limits"],
    queryFn: fetchRateLimits,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: number;
    }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id, field, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rate-limits"] });
      toast.success("Rate Limit Updated", "The rule has been updated.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id, status };
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-rate-limits"] });
      toast.success(
        status === "active" ? "Rule Enabled" : "Rule Disabled",
        `The rate limit rule has been ${status}.`
      );
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Req/Min</TableHead>
                <TableHead className="text-right">Burst</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {rules?.map((rule, index) => (
                  <motion.tr
                    key={rule.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.03,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-surface-2)]/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-[var(--accent-primary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {rule.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)]">
                        {rule.endpoint}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm">
                        {rule.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={String(rule.requestsPerMinute)}
                        onValueChange={(v) =>
                          updateMutation.mutate({
                            id: rule.id,
                            field: "rpm",
                            value: Number(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-20 text-xs ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 30, 60, 120, 240, 500].map((v) => (
                            <SelectItem
                              key={v}
                              value={String(v)}
                              className="text-xs"
                            >
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={String(rule.burstLimit)}
                        onValueChange={(v) =>
                          updateMutation.mutate({
                            id: rule.id,
                            field: "burst",
                            value: Number(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-16 text-xs ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 3, 5, 10, 15, 20, 50].map((v) => (
                            <SelectItem
                              key={v}
                              value={String(v)}
                              className="text-xs"
                            >
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.status === "active"}
                        onCheckedChange={(checked) =>
                          toggleStatusMutation.mutate({
                            id: rule.id,
                            status: checked ? "active" : "disabled",
                          })
                        }
                        aria-label={`Toggle ${rule.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          toast.info("Edit Rule", `Editing ${rule.name}`)
                        }
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Admin Page
   ═══════════════════════════════════════════════════════════════ */

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "orgs", label: "Organizations", icon: Building2 },
  { id: "features", label: "Feature Flags", icon: ToggleLeft },
  { id: "rate-limits", label: "Rate Limits", icon: Gauge },
];

function AdminPageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";
  const currentTabLabel =
    TABS.find((t) => t.id === activeTab)?.label ?? "Overview";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-[100dvh]">
        {/* Sidebar Nav — Desktop */}
        <aside className="hidden w-60 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:block">
          <div className="sticky top-0 p-4">
            <div className="mb-6 flex items-center gap-2 px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                <Shield className="h-4 w-4 text-[var(--text-inverse)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Admin
                </h2>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Platform Management
                </p>
              </div>
            </div>
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <a
                    key={tab.id}
                    href={`/admin?tab=${tab.id}`}
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast",
                      isActive
                        ? "text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="admin-nav-pill"
                        className="absolute inset-0 rounded-md bg-[var(--accent-primary)]/10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <tab.icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{tab.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2">
          <div className="flex gap-2 overflow-x-auto relative">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`/admin?tab=${tab.id}`}
                  className={cn(
                    "relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobile-admin-tab"
                      className="absolute inset-0 rounded-full bg-[var(--bg-surface-2)]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)]">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {currentTabLabel}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {activeTab === "overview" &&
                    "Platform health and key metrics"}
                  {activeTab === "users" && "Manage platform users"}
                  {activeTab === "orgs" && "Manage organizations"}
                  {activeTab === "features" && "Control feature rollouts"}
                  {activeTab === "rate-limits" && "Configure API throttling"}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  All Systems OK
                </Badge>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <SystemStatsSection />
                    {/* Quick Sections */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--accent-primary)]" />
                            Recent Users
                          </CardTitle>
                          <CardDescription>
                            Last 3 users who joined
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {ADMIN_USERS.slice(0, 3).map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between rounded-md bg-[var(--bg-surface-2)]/40 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[10px] font-semibold text-[var(--accent-primary)]">
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-[var(--text-primary)]">
                                    {user.name}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-tertiary)]">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              <UserStatusBadge status={user.status} />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[var(--accent-primary)]" />
                            Feature Flags at a Glance
                          </CardTitle>
                          <CardDescription>
                            Quick overview of enabled features
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {FEATURE_FLAGS.slice(0, 4).map((flag) => (
                            <div
                              key={flag.id}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="text-xs font-medium text-[var(--text-primary)]">
                                  {flag.name}
                                </p>
                                <p className="text-[10px] text-[var(--text-tertiary)]">
                                  {flag.scope} · {flag.rolloutPct}% rollout
                                </p>
                              </div>
                              <Switch
                                checked={flag.enabled}
                                disabled
                                className="scale-75"
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {activeTab === "users" && <UsersSection />}
                {activeTab === "orgs" && <OrgsSection />}
                {activeTab === "features" && <FeatureFlagsSection />}
                {activeTab === "rate-limits" && <RateLimitsSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh]">
          <aside className="hidden w-60 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:block">
            <div className="sticky top-0 p-4 space-y-3">
              <Skeleton className="h-8 w-32 mb-6" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </aside>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)]">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-6" />
            <StatsSkeleton />
          </main>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
