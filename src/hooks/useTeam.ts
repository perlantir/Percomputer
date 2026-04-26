"use client";

/**
 * TanStack Query hooks for team management — invitations and members.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamInvitation, TeamMember, SendInviteInput } from "@/src/types/team";
import { toast } from "@/src/components/layout/Toaster";

const TEAM_INVITES_KEY = "team-invites";
const TEAM_MEMBERS_KEY = "team-members";

// ── API helpers ──────────────────────────────────────────────────────────────

async function fetchInvites(): Promise<TeamInvitation[]> {
  const res = await fetch("/api/team/invites", {
    headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to fetch invitations");
  }
  const data = await res.json();
  return data.data ?? [];
}

async function fetchMembers(): Promise<TeamMember[]> {
  const res = await fetch("/api/team/members", {
    headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to fetch team members");
  }
  const data = await res.json();
  return data.data ?? [];
}

async function sendInviteApi(input: SendInviteInput): Promise<TeamInvitation> {
  const res = await fetch("/api/team/invites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer tok_usr_7a3f9e2b1c4d",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to send invitation");
  }
  return res.json();
}

async function revokeInviteApi(inviteId: string): Promise<void> {
  const res = await fetch(`/api/team/invites/${inviteId}`, {
    method: "DELETE",
    headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to revoke invitation");
  }
}

async function removeMemberApi(memberId: string): Promise<void> {
  const res = await fetch(`/api/team/members/${memberId}`, {
    method: "DELETE",
    headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to remove member");
  }
}

async function acceptInviteApi(token: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/team/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to accept invitation");
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useTeamInvites() {
  return useQuery<TeamInvitation[], Error>({
    queryKey: [TEAM_INVITES_KEY],
    queryFn: fetchInvites,
  });
}

export function useTeamMembers() {
  return useQuery<TeamMember[], Error>({
    queryKey: [TEAM_MEMBERS_KEY],
    queryFn: fetchMembers,
  });
}

export function useSendInvite() {
  const queryClient = useQueryClient();
  return useMutation<TeamInvitation, Error, SendInviteInput>({
    mutationFn: sendInviteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_INVITES_KEY] });
      toast.success("Invitation sent", `The team invitation has been emailed.`);
    },
    onError: (err) => {
      toast.error("Failed to send invitation", err.message);
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: revokeInviteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_INVITES_KEY] });
      toast.success("Invitation revoked", `The invitation has been cancelled.`);
    },
    onError: (err) => {
      toast.error("Failed to revoke invitation", err.message);
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: removeMemberApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_MEMBERS_KEY] });
      toast.success("Member removed", `The team member has been removed.`);
    },
    onError: (err) => {
      toast.error("Failed to remove member", err.message);
    },
  });
}

export function useAcceptInvite() {
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: acceptInviteApi,
    onSuccess: () => {
      toast.success("Welcome aboard!", `You've successfully joined the team.`);
    },
    onError: (err) => {
      toast.error("Failed to accept invitation", err.message);
    },
  });
}
