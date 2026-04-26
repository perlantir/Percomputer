"use client";

/**
 * InviteForm — Email invitation form with role selector.
 *
 * Features:
 * - Email input with validation
 * - Role selector (owner/admin/member/viewer/auditor)
 * - Submit with loading state
 * - Success/error toast feedback
 */

import * as React from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useSendInvite } from "@/src/hooks/useTeam";
import type { UserRole } from "@/src/types/enums";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access to manage team, billing, and settings" },
  { value: "member", label: "Member", description: "Can create and run workflows, manage spaces" },
  { value: "viewer", label: "Viewer", description: "Read-only access to workflows and reports" },
  { value: "auditor", label: "Auditor", description: "Access audit logs and compliance data only" },
];

interface InviteFormProps {
  className?: string;
}

export function InviteForm({ className }: InviteFormProps) {
  const sendInvite = useSendInvite();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("member");
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError("Email address is required");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    await sendInvite.mutateAsync({ email: email.trim(), role });
    setEmail("");
    setRole("member");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-low",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-primary)]/10">
          <Mail className="h-4 w-4 text-[var(--accent-primary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Invite team member
        </h3>
      </div>

      {/* Email input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="invite-email"
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          Email address
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={() => email && validateEmail(email)}
            placeholder="colleague@company.com"
            className={cn(
              "flex w-full rounded-md border bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-2 text-sm shadow-sm transition-colors duration-fast ease-out placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:cursor-not-allowed disabled:opacity-50",
              "pl-10",
              emailError
                ? "border-[var(--semantic-danger)]"
                : "border-[var(--border-default)]"
            )}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "invite-email-error" : undefined}
          />
        </div>
        {emailError && (
          <p id="invite-email-error" className="text-xs text-[var(--semantic-danger)]">
            {emailError}
          </p>
        )}
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Role
        </label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        loading={sendInvite.isPending}
        disabled={!email.trim()}
        className="mt-1 w-full"
      >
        {sendInvite.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send invitation
      </Button>
    </form>
  );
}
