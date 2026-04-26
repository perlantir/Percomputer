"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { SettingsNav, SETTINGS_TABS } from "@/src/components/settings/SettingsNav";
import { ModelsTable } from "@/src/components/settings/ModelsTable";
import { BillingPanel } from "@/src/components/settings/BillingPanel";
import { MemoryPanel } from "@/src/components/settings/MemoryPanel";
import { DEMO_USERS, type DemoUser } from "@/src/data/demo-users";
import { DEMO_MODELS } from "@/src/data/demo-models";
import { DEMO_MEMORY } from "@/src/data/demo-memory";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";
import { toast } from "@/src/components/layout/Toaster";
import { EmptyState } from "@/src/components/ui/empty-state";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from "@/src/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { DashboardSkeleton, SettingsSkeleton } from "@/src/components/ui/loading-skeleton";
import { Separator } from "@/src/components/ui/separator";
import {
  User,
  Mail,
  Globe,
  CreditCard,
  Cpu,
  Shield,
  Brain,
  Bell,
  KeyRound,
  Users,
  Copy,
  RefreshCw,
  Plus,
  Check,
  Trash2,
  ShieldCheck,
  Server,
  Zap,
} from "lucide-react";

/* ─── Animated Switch ─── */
function AnimatedSwitch({ checked, onCheckedChange, ...props }: React.ComponentPropsWithoutRef<typeof Switch>) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleChange = (value: boolean) => {
    setIsAnimating(true);
    onCheckedChange?.(value);
    setTimeout(() => setIsAnimating(false), 350);
  };

  return (
    <motion.div
      animate={isAnimating ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Switch checked={checked} onCheckedChange={handleChange} {...props} />
    </motion.div>
  );
}

/* ─── Data Fetching ─── */
function fetchCurrentUser(): Promise<DemoUser> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DEMO_USERS[0]), 150);
  });
}

function fetchApiKeys(): Promise<Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsed: string; permissions: string[] }>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "key_001", name: "Production API", prefix: "sk_live_...7f3a", createdAt: "2024-11-01T10:00:00Z", lastUsed: "2025-01-15T08:30:00Z", permissions: ["workflows:write", "models:read"] },
        { id: "key_002", name: "Staging Test", prefix: "sk_test_...9b2c", createdAt: "2024-12-10T14:20:00Z", lastUsed: "2025-01-14T16:45:00Z", permissions: ["workflows:write", "workflows:read", "models:read"] },
        { id: "key_003", name: "CI/CD Deploy", prefix: "sk_live_...4d1e", createdAt: "2024-09-05T09:15:00Z", lastUsed: "2025-01-15T11:00:00Z", permissions: ["workflows:read", "artifacts:read"] },
      ]);
    }, 150);
  });
}

function fetchTeamMembers(): Promise<Array<{ id: string; name: string; email: string; role: string; avatarUrl: string; joinedAt: string }>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "usr_7a3f9e2b1c4d", name: "Sarah Chen", email: "sarah.chen@acme-research.com", role: "owner", avatarUrl: DEMO_USERS[0].avatarUrl, joinedAt: "2024-06-12T09:00:00Z" },
        { id: "usr_b8e5d1a4f7c2", name: "Marcus Johnson", email: "marcus.johnson@acme-research.com", role: "admin", avatarUrl: DEMO_USERS[1].avatarUrl, joinedAt: "2024-08-03T11:30:00Z" },
        { id: "usr_2f6c8d3e5b9a", name: "Alex Patel", email: "alex.patel@indie.dev", role: "member", avatarUrl: DEMO_USERS[2].avatarUrl, joinedAt: "2024-09-20T14:15:00Z" },
      ]);
    }, 150);
  });
}

/* ─── Profile Tab ─── */
function ProfileTab() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["settings-user"],
    queryFn: fetchCurrentUser,
    initialData: DEMO_USERS[0],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card className="transition-all duration-fast hover:shadow-medium">
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(user?.name ?? "U")}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="text-sm font-medium text-foreground-secondary">Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary transition-colors duration-fast group-focus-within:text-accent-primary" />
                <Input id="profile-name" defaultValue={user?.name} className="pl-9 transition-all duration-fast ease-out focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="text-sm font-medium text-foreground-secondary">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary transition-colors duration-fast group-focus-within:text-accent-primary" />
                <Input id="profile-email" defaultValue={user?.email} className="pl-9 transition-all duration-fast ease-out focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-timezone" className="text-sm font-medium text-foreground-secondary">Timezone</label>
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary transition-colors duration-fast group-focus-within:text-accent-primary z-10" />
              <Select defaultValue="UTC">
                <SelectTrigger className="pl-9 transition-all duration-fast ease-out focus:ring-2 focus:ring-[var(--accent-primary)]/20" id="profile-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="transition-transform active:scale-95" onClick={() => toast.success("Profile saved", "Your profile changes have been saved successfully.")}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Billing Tab ─── */
function BillingTab() {
  return <BillingPanel />;
}

/* ─── Models Tab ─── */
function ModelsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-secondary">
          Manage model routing and per-kind overrides
        </p>
      </div>
      <ModelsTable />
    </div>
  );
}

/* ─── Privacy Tab ─── */
function PrivacyTab() {
  const [primaryRegion, setPrimaryRegion] = useState("us-east");
  const [backupRegion, setBackupRegion] = useState("us-west");
  const [episodicMemory, setEpisodicMemory] = useState(true);
  const [semanticMemory, setSemanticMemory] = useState(true);
  const [autoDecay, setAutoDecay] = useState(true);
  const [zdrMode, setZdrMode] = useState(false);
  const [auditRetention, setAuditRetention] = useState(true);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card className="transition-all duration-fast hover:shadow-medium">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-accent-primary" />
            Data Residency
          </CardTitle>
          <CardDescription>Choose where your data is stored and processed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="privacy-primary-region" className="text-sm font-medium text-foreground-secondary">Primary Region</label>
            <Select value={primaryRegion} onValueChange={setPrimaryRegion}>
              <SelectTrigger id="privacy-primary-region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west">US West (Oregon)</SelectItem>
                <SelectItem value="eu-west">EU West (Ireland)</SelectItem>
                <SelectItem value="eu-central">EU Central (Frankfurt)</SelectItem>
                <SelectItem value="ap-south">Asia Pacific (Singapore)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="privacy-backup-region" className="text-sm font-medium text-foreground-secondary">Backup Region</label>
            <Select value={backupRegion} onValueChange={setBackupRegion}>
              <SelectTrigger id="privacy-backup-region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west">US West (Oregon)</SelectItem>
                <SelectItem value="eu-west">EU West (Ireland)</SelectItem>
                <SelectItem value="eu-central">EU Central (Frankfurt)</SelectItem>
                <SelectItem value="ap-south">Asia Pacific (Singapore)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-fast hover:shadow-medium">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent-primary" />
            Memory Settings
          </CardTitle>
          <CardDescription>Control how your agent retains context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p id="label-episodic-memory" className="text-sm font-medium text-foreground-primary">Episodic Memory</p>
              <p className="text-xs text-foreground-tertiary">Store workflow summaries for context retrieval</p>
            </div>
            <AnimatedSwitch checked={episodicMemory} onCheckedChange={setEpisodicMemory} aria-labelledby="label-episodic-memory" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p id="label-semantic-memory" className="text-sm font-medium text-foreground-primary">Semantic Memory</p>
              <p className="text-xs text-foreground-tertiary">Extract and store factual knowledge from outputs</p>
            </div>
            <AnimatedSwitch checked={semanticMemory} onCheckedChange={setSemanticMemory} aria-labelledby="label-semantic-memory" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p id="label-auto-decay" className="text-sm font-medium text-foreground-primary">Auto-decay Old Memories</p>
              <p className="text-xs text-foreground-tertiary">Gradually reduce importance of unused memories</p>
            </div>
            <AnimatedSwitch checked={autoDecay} onCheckedChange={setAutoDecay} aria-labelledby="label-auto-decay" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-fast hover:shadow-medium">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent-primary" />
            Zero Data Retention (ZDR)
          </CardTitle>
          <CardDescription>Request that providers delete data immediately after processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p id="label-zdr-mode" className="text-sm font-medium text-foreground-primary">Enable ZDR Mode</p>
              <p className="text-xs text-foreground-tertiary">Supported by OpenAI and Anthropic enterprise tiers</p>
            </div>
            <AnimatedSwitch checked={zdrMode} onCheckedChange={setZdrMode} aria-labelledby="label-zdr-mode" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p id="label-audit-retention" className="text-sm font-medium text-foreground-primary">Audit Data Retention</p>
              <p className="text-xs text-foreground-tertiary">Keep compliance logs for 90 days</p>
            </div>
            <AnimatedSwitch checked={auditRetention} onCheckedChange={setAuditRetention} aria-labelledby="label-audit-retention" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Memory Tab ─── */
function MemoryTab() {
  return <MemoryPanel />;
}

/* ─── Notifications Tab ─── */
function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [eventSwitches, setEventSwitches] = useState<Record<string, boolean>>({
    "Workflow succeeded": true,
    "Workflow failed": true,
    "Budget threshold reached": true,
    "New team member": false,
    "Security alert": false,
  });

  const toggleEvent = (label: string) => {
    setEventSwitches((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card className="transition-all duration-fast hover:shadow-medium">
        <CardHeader>
          <CardTitle className="text-base">Notification Channels</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p id="label-email-notifications" className="text-sm font-medium text-foreground-primary">Email Notifications</p>
              <p className="text-xs text-foreground-tertiary">Workflow completions, failures, and weekly summaries</p>
            </div>
            <AnimatedSwitch checked={emailNotifications} onCheckedChange={setEmailNotifications} aria-labelledby="label-email-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p id="label-push-notifications" className="text-sm font-medium text-foreground-primary">Push Notifications</p>
              <p className="text-xs text-foreground-tertiary">Browser push for critical workflow events</p>
            </div>
            <AnimatedSwitch checked={pushNotifications} onCheckedChange={setPushNotifications} aria-labelledby="label-push-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p id="label-inapp-notifications" className="text-sm font-medium text-foreground-primary">In-App Notifications</p>
              <p className="text-xs text-foreground-tertiary">Real-time toasts and activity feed updates</p>
            </div>
            <AnimatedSwitch checked={inAppNotifications} onCheckedChange={setInAppNotifications} aria-labelledby="label-inapp-notifications" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-fast hover:shadow-medium">
        <CardHeader>
          <CardTitle className="text-base">Notification Events</CardTitle>
          <CardDescription>Fine-tune which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Workflow succeeded", desc: "When a workflow completes successfully" },
            { label: "Workflow failed", desc: "When a workflow fails or is cancelled" },
            { label: "Budget threshold reached", desc: "When 80% of credit budget is consumed" },
            { label: "New team member", desc: "When someone joins your organization" },
            { label: "Security alert", desc: "Unusual login or API key usage detected" },
          ].map((event, i, arr) => (
            <div key={event.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p id={`label-event-${event.label.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium text-foreground-primary">{event.label}</p>
                  <p className="text-xs text-foreground-tertiary">{event.desc}</p>
                </div>
                <AnimatedSwitch checked={!!eventSwitches[event.label]} onCheckedChange={() => toggleEvent(event.label)} aria-labelledby={`label-event-${event.label.toLowerCase().replace(/\s+/g, '-')}`} />
              </div>
              {i < arr.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── API Keys Tab ─── */
function ApiKeysTab() {
  const { data: keys, isLoading } = useQuery({
    queryKey: ["settings-api-keys"],
    queryFn: fetchApiKeys,
    initialData: [
      { id: "key_001", name: "Production API", prefix: "sk_live_...7f3a", createdAt: "2024-11-01T10:00:00Z", lastUsed: "2025-01-15T08:30:00Z", permissions: ["workflows:write", "models:read"] },
      { id: "key_002", name: "Staging Test", prefix: "sk_test_...9b2c", createdAt: "2024-12-10T14:20:00Z", lastUsed: "2025-01-14T16:45:00Z", permissions: ["workflows:write", "workflows:read", "models:read"] },
      { id: "key_003", name: "CI/CD Deploy", prefix: "sk_live_...4d1e", createdAt: "2024-09-05T09:15:00Z", lastUsed: "2025-01-15T11:00:00Z", permissions: ["workflows:read", "artifacts:read"] },
    ],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-secondary">
          Manage API keys for programmatic access
        </p>
        <Button size="sm" className="transition-transform active:scale-95" onClick={() => toast.info("Generate Key", "API key generation modal would open here.")}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Generate Key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : keys && keys.length > 0 ? (
        <div className="flex flex-col gap-3">
          {keys?.map((key, index) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className="transition-shadow duration-fast hover:shadow-medium">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-accent-primary" />
                        <span className="text-sm font-medium text-foreground-primary">{key.name}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-mono text-foreground-tertiary">{key.prefix}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {key.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-foreground-tertiary"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-2xs text-foreground-tertiary">
                        Created {new Date(key.createdAt).toLocaleDateString()} · Last used{" "}
                        {new Date(key.lastUsed).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 transition-transform active:scale-95" aria-label={`Copy ${key.name}`} onClick={() => toast.success("Copied to clipboard", `${key.name} API key copied.`)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 transition-transform active:scale-95" aria-label={`Refresh ${key.name}`}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground-tertiary hover:text-[var(--semantic-danger)] transition-transform active:scale-95" aria-label={`Delete ${key.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          variant="no-data"
          icon={KeyRound}
          title="No API keys"
          description="Generate your first API key to enable programmatic access."
          actionLabel="Generate Key"
          onAction={() => toast.info("Generate Key", "API key generation modal would open here.")}
        />
      )}
    </div>
  );
}

/* ─── Team Tab ─── */
function TeamTab() {
  const { data: members, isLoading } = useQuery({
    queryKey: ["settings-team"],
    queryFn: fetchTeamMembers,
    initialData: [
      { id: "usr_7a3f9e2b1c4d", name: "Sarah Chen", email: "sarah.chen@acme-research.com", role: "owner", avatarUrl: DEMO_USERS[0].avatarUrl, joinedAt: "2024-06-12T09:00:00Z" },
      { id: "usr_b8e5d1a4f7c2", name: "Marcus Johnson", email: "marcus.johnson@acme-research.com", role: "admin", avatarUrl: DEMO_USERS[1].avatarUrl, joinedAt: "2024-08-03T11:30:00Z" },
      { id: "usr_2f6c8d3e5b9a", name: "Alex Patel", email: "alex.patel@indie.dev", role: "member", avatarUrl: DEMO_USERS[2].avatarUrl, joinedAt: "2024-09-20T14:15:00Z" },
    ],
  });

  const currentUserId = DEMO_USERS[0].id;
  const currentUserRole = members?.find((m) => m.id === currentUserId)?.role ?? "member";

  const canDelete = (targetRole: string) => {
    if (currentUserRole === "owner") return targetRole !== "owner";
    if (currentUserRole === "admin") return targetRole === "member";
    return false;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-secondary">
          Manage team members and invitations
        </p>
        <Button size="sm" className="transition-transform active:scale-95" onClick={() => toast.info("Invite Member", "Team invitation modal would open here.")}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Invite Member
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : members && members.length > 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface shadow-low overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-subtle bg-surface-2/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-foreground-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => (
                  <tr key={member.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground-primary">{member.name}</p>
                          <p className="text-xs text-foreground-tertiary">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-2xs font-medium capitalize",
                        member.role === "owner"
                          ? "bg-accent-primary/10 text-accent-primary"
                          : member.role === "admin"
                          ? "bg-accent-tertiary/10 text-accent-tertiary"
                          : "bg-surface-2 text-foreground-secondary"
                      )}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete(member.role) && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground-tertiary hover:text-foreground-primary" aria-label={`Remove ${member.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          variant="no-data"
          icon={Users}
          title="No team members"
          description="Invite your first team member to collaborate on workflows."
          actionLabel="Invite Member"
          onAction={() => toast.info("Invite Member", "Team invitation modal would open here.")}
        />
      )}

      {/* Pending Invites */}
      <Card className="bg-surface-2/40 transition-all duration-fast hover:shadow-medium hover:bg-surface-2/60">
        <CardHeader>
          <CardTitle className="text-base">Pending Invitations</CardTitle>
          <CardDescription>Invites awaiting acceptance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Users className="h-6 w-6 text-foreground-tertiary" />
            <p className="text-sm text-foreground-tertiary">No pending invitations</p>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Invite someone
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Tab Content Router ─── */
function TabContent({ tab }: { tab: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.995 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <TabInnerContent tab={tab} />
      </motion.div>
    </AnimatePresence>
  );
}

function TabInnerContent({ tab }: { tab: string }) {
  switch (tab) {
    case "profile":
      return <ProfileTab />;
    case "billing":
      return <BillingTab />;
    case "models":
      return <ModelsTab />;
    case "privacy":
      return <PrivacyTab />;
    case "memory":
      return <MemoryTab />;
    case "notifications":
      return <NotificationsTab />;
    case "api":
      return <ApiKeysTab />;
    case "team":
      return <TeamTab />;
    default:
      return <ProfileTab />;
  }
}

/* ─── Main Settings Page ─── */
function SettingsPageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "profile";
  const currentTabLabel = SETTINGS_TABS.find((t) => t.id === activeTab)?.label ?? "Profile";

  return (
    <div className="flex min-h-[100dvh]">
      {/* Sidebar Nav */}
      <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-surface lg:block">
        <div className="sticky top-0 p-4">
          <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
            Settings
          </h2>
          <SettingsNav activeTab={activeTab} />
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden w-full border-b border-border-subtle bg-surface px-4 py-2">
        <div className="flex gap-2 overflow-x-auto relative">
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={`/settings?tab=${tab.id}`}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-accent-primary"
                    : "text-foreground-secondary hover:text-foreground-primary"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-tab-pill"
                    className="absolute inset-0 rounded-full bg-surface-2"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
      <main className="relative flex-1 p-4 sm:p-6 lg:p-8 bg-canvas overflow-hidden">
        {/* Subtle gradient background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 35% at 70% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 25% at 10% 20%, rgba(var(--accent-secondary), 0.025) 0%, transparent 50%)`,
          }}
        />
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-2xl font-semibold text-foreground-primary">
            {currentTabLabel}
          </h1>
          <TabContent tab={activeTab} />
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh]">
          <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-surface lg:block">
            <div className="sticky top-0 p-4 space-y-3">
              <Skeleton className="h-4 w-20 mb-6" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </aside>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-canvas">
            <Skeleton className="h-8 w-48 mb-6" />
            <SettingsSkeleton cards={3} />
          </main>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
