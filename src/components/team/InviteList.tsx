"use client";

/**
 * InviteList — Pending invitations list with revoke action.
 *
 * Features:
 * - Lists all pending team invitations
 * - Shows email, role, inviter, and expiry
 * - Revoke invitation action with confirmation
 * - Loading skeleton state
 * - Empty state
 */

import * as React from "react";
import {
  Mail,
  Clock,
  UserX,
  Loader2,
  Shield,
  Eye,
  UserCheck,
  ScrollText,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTeamInvites, useRevokeInvite } from "@/src/hooks/useTeam";
import type { TeamInvitation } from "@/src/types/team";
import type { UserRole } from "@/src/types/enums";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

const ROLE_CONFIG: Record<
  UserRole,
  { icon: React.ReactNode; variant: "accent" | "info" | "default" | "warning" }
> = {
  owner: { icon: <Shield className="h-3 w-3" />, variant: "accent" },
  admin: { icon: <Shield className="h-3 w-3" />, variant: "accent" },
  member: { icon: <UserCheck className="h-3 w-3" />, variant: "info" },
  viewer: { icon: <Eye className="h-3 w-3" />, variant: "default" },
  auditor: { icon: <ScrollText className="h-3 w-3" />, variant: "warning" },
};

function InviteCard({ invite }: { invite: TeamInvitation }) {
  const revoke = useRevokeInvite();
  const [confirming, setConfirming] = React.useState(false);

  const roleConfig = ROLE_CONFIG[invite.role] || ROLE_CONFIG.member;
  const expiresIn = getDaysUntilExpiry(invite.expiresAt);
  const isExpiringSoon = expiresIn <= 3 && expiresIn > 0;

  const handleRevoke = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await revoke.mutateAsync(invite.id);
    setConfirming(false);
  };

  const handleCancel = () => setConfirming(false);

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-lg border bg-[var(--bg-surface)] px-4 py-3 transition-all duration-fast",
        "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-low"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/10">
          <Mail className="h-4 w-4 text-[var(--accent-primary)]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
            {invite.email}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={roleConfig.variant} size="sm">
              <span className="flex items-center gap-1">
                {roleConfig.icon}
                {invite.role}
              </span>
            </Badge>
            <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Clock className="h-3 w-3" />
              {isExpiringSoon ? (
                <span className="text-[var(--semantic-warning)] font-medium">
                  Expires in {expiresIn}d
                </span>
              ) : expiresIn <= 0 ? (
                <span className="text-[var(--semantic-danger)]">Expired</span>
              ) : (
                <span>Expires in {expiresIn}d</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {confirming ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[var(--semantic-warning)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Revoke?</span>
            </div>
            <Button size="sm" variant="danger" onClick={handleRevoke} loading={revoke.isPending}>
              Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRevoke}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Revoke invitation for ${invite.email}`}
          >
            <UserX className="h-4 w-4" />
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

function getDaysUntilExpiry(expiresAt: string): number {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--bg-surface-2)] animate-pulse" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="h-4 w-48 rounded bg-[var(--bg-surface-2)] animate-pulse" />
            <div className="h-3 w-24 rounded bg-[var(--bg-surface-2)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface InviteListProps {
  className?: string;
}

export function InviteList({ className }: InviteListProps) {
  const { data: invites, isLoading, error } = useTeamInvites();

  const pendingInvites = invites?.filter((i) => !i.accepted && !i.revoked) ?? [];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Pending invitations
        </h3>
        {pendingInvites.length > 0 && (
          <Badge variant="accent" size="sm">
            {pendingInvites.length}
          </Badge>
        )}
      </div>

      {isLoading && <LoadingSkeleton />}

      {error && (
        <div className="rounded-lg border border-[var(--semantic-danger)]/25 bg-[var(--semantic-danger)]/8 p-4 text-sm text-[var(--semantic-danger)]">
          Failed to load invitations: {error.message}
        </div>
      )}

      {!isLoading && !error && pendingInvites.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
          <Mail className="h-8 w-8 text-[var(--text-tertiary)]" />
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No pending invitations
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Send an invitation to add team members
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && pendingInvites.length > 0 && (
        <div className="flex flex-col gap-2">
          {pendingInvites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </div>
  );
}
