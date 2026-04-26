"use client";

/**
 * MemberList — Team members list with roles and remove functionality.
 *
 * Features:
 * - Lists all team members with avatars, names, emails, and roles
 * - Role badges with color coding
 * - Remove member action with confirmation dialog
 * - Loading skeleton state
 * - Empty state
 */

import * as React from "react";
import {
  Users,
  UserX,
  Shield,
  UserCheck,
  Eye,
  ScrollText,
  Loader2,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTeamMembers, useRemoveMember } from "@/src/hooks/useTeam";
import type { TeamMember } from "@/src/types/team";
import type { UserRole } from "@/src/types/enums";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from "@/src/components/ui/avatar";

const ROLE_CONFIG: Record<
  UserRole,
  {
    icon: React.ReactNode;
    variant: "accent" | "info" | "default" | "warning" | "success";
    label: string;
  }
> = {
  owner: { icon: <Crown className="h-3 w-3" />, variant: "accent", label: "Owner" },
  admin: { icon: <Shield className="h-3 w-3" />, variant: "accent", label: "Admin" },
  member: { icon: <UserCheck className="h-3 w-3" />, variant: "info", label: "Member" },
  viewer: { icon: <Eye className="h-3 w-3" />, variant: "default", label: "Viewer" },
  auditor: { icon: <ScrollText className="h-3 w-3" />, variant: "warning", label: "Auditor" },
};

function MemberCard({ member }: { member: TeamMember }) {
  const remove = useRemoveMember();
  const [confirming, setConfirming] = React.useState(false);

  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;

  const handleRemove = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await remove.mutateAsync(member.id);
    setConfirming(false);
  };

  const handleCancel = () => setConfirming(false);

  const initials = getInitials(member.name);

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-lg border bg-[var(--bg-surface)] px-4 py-3 transition-all duration-fast",
        "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-low"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9 shrink-0">
          {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} size={36} />}
          <AvatarFallback className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
            {member.name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="truncate text-xs text-[var(--text-tertiary)]">
              {member.email}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Badge variant={roleConfig.variant} size="sm">
          <span className="flex items-center gap-1">
            {roleConfig.icon}
            {roleConfig.label}
          </span>
        </Badge>

        {confirming ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs text-[var(--semantic-warning)]">
              <AlertTriangle className="h-3 w-3" />
              <span>Remove?</span>
            </div>
            <Button size="sm" variant="danger" onClick={handleRemove} loading={remove.isPending}>
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
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--semantic-danger)] hover:text-[var(--semantic-danger)] hover:bg-[var(--semantic-danger)]/10"
            aria-label={`Remove ${member.name}`}
          >
            <UserX className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--bg-surface-2)] animate-pulse" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="h-4 w-40 rounded bg-[var(--bg-surface-2)] animate-pulse" />
            <div className="h-3 w-56 rounded bg-[var(--bg-surface-2)] animate-pulse" />
          </div>
          <div className="h-6 w-16 rounded bg-[var(--bg-surface-2)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

interface MemberListProps {
  className?: string;
}

export function MemberList({ className }: MemberListProps) {
  const { data: members, isLoading, error } = useTeamMembers();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Team members
        </h3>
        {members && members.length > 0 && (
          <Badge variant="default" size="sm">
            {members.length}
          </Badge>
        )}
      </div>

      {isLoading && <LoadingSkeleton />}

      {error && (
        <div className="rounded-lg border border-[var(--semantic-danger)]/25 bg-[var(--semantic-danger)]/8 p-4 text-sm text-[var(--semantic-danger)]">
          Failed to load team members: {error.message}
        </div>
      )}

      {!isLoading && !error && members?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
          <Users className="h-8 w-8 text-[var(--text-tertiary)]" />
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No team members
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Invite people to join your team
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && members && members.length > 0 && (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
