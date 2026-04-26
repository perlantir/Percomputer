"use client";

/**
 * Invite acceptance page — handles team invitation token from URL.
 *
 * Features:
 * - Reads invitation token from URL search params
 * - Validates token with API
 * - Shows invitation details (org name, role)
 * - Accept invitation flow
 * - Success/error states with redirect
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  Shield,
  LogIn,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAcceptInvite } from "@/src/hooks/useTeam";

import { Button } from "@/src/components/ui/button";

/**
 * Inner component that uses useSearchParams, wrapped in Suspense.
 */
function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const accept = useAcceptInvite();
  const [status, setStatus] = React.useState<"idle" | "checking" | "valid" | "invalid" | "accepted">(
    "idle"
  );
  const [inviteDetails, setInviteDetails] = React.useState<{
    orgName: string;
    role: string;
  } | null>(null);

  React.useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");

    fetch(`/api/team/invites/validate?token=${encodeURIComponent(token)}`, {
      method: "GET",
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setInviteDetails(data);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    await accept.mutateAsync(token);
    setStatus("accepted");
  };

  // ── No token ──
  if (status === "invalid" && !token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center shadow-medium">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
            <AlertCircle className="h-6 w-6 text-[var(--semantic-danger)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Invalid invitation link
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              The invitation link is missing or malformed. Please check your email for a valid link.
            </p>
          </div>
          <Link href="/">
            <Button variant="secondary" className="mt-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Checking / Loading ──
  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center shadow-medium">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Validating your invitation...
          </p>
        </div>
      </div>
    );
  }

  // ── Accepted ──
  if (status === "accepted") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--semantic-success)]/25 bg-[var(--bg-surface)] p-8 text-center shadow-medium">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-success)]/10">
            <CheckCircle className="h-6 w-6 text-[var(--semantic-success)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Welcome to {inviteDetails?.orgName || "the team"}!
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your invitation has been accepted successfully. You can now access the workspace.
            </p>
          </div>
          <Link href="/">
            <Button className="mt-2">
              <LogIn className="h-4 w-4 mr-1" />
              Go to workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Valid invitation ──
  if (status === "valid" && inviteDetails) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col gap-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-medium">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)]/10">
              <Mail className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Team invitation
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                You have been invited to join a team workspace.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                <Users className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {inviteDetails.orgName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="h-3 w-3 text-[var(--text-tertiary)]" />
                  <span className="text-xs text-[var(--text-tertiary)] capitalize">
                    {inviteDetails.role} access
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAccept}
              loading={accept.isPending}
              fullWidth
            >
              {accept.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Accept invitation
            </Button>
            {accept.isError && (
              <p className="text-xs text-[var(--semantic-danger)] text-center">
                {accept.error?.message || "Failed to accept invitation"}
              </p>
            )}
            <Link href="/" className="w-full">
              <Button variant="ghost" fullWidth>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Decline and go back
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid / expired token ──
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center shadow-medium">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
          <AlertCircle className="h-6 w-6 text-[var(--semantic-danger)]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Invitation expired
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            This invitation link has expired or been revoked. Please ask your team admin to send a new invitation.
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Invite page — wraps InviteContent in Suspense for useSearchParams.
 */
export default function InvitePage() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      <React.Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center shadow-medium">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
            </div>
          </div>
        }
      >
        <InviteContent />
      </React.Suspense>
    </main>
  );
}
