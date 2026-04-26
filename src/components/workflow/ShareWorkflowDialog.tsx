/**
 * ShareWorkflowDialog.tsx
 *
 * Share dialog:
 * - Link copy
 * - Permission selector (view/edit)
 * - Member invite
 * - Public/private toggle
 */

"use client";

import React, { useState, useCallback } from "react";
import { Link2, Copy, Check, Globe, Lock, UserPlus, Eye, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

type Permission = "view" | "edit";

export interface ShareWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowTitle?: string;
}

export function ShareWorkflowDialog({
  open,
  onOpenChange,
  workflowId,
  workflowTitle = "Workflow",
}: ShareWorkflowDialogProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [permission, setPermission] = useState<Permission>("view");
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invited, setInvited] = useState<string[]>([]);

  const [isCopying, setIsCopying] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/w/${workflowId}`
    : `https://app.example.com/w/${workflowId}`;

  const handleCopy = useCallback(async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    } finally {
      setIsCopying(false);
    }
  }, [shareUrl]);

  const handleInvite = useCallback(() => {
    const email = inviteEmail.trim();
    if (email && !invited.includes(email)) {
      setInvited((prev) => [...prev, email]);
      setInviteEmail("");
    }
  }, [inviteEmail, invited]);

  const removeInvite = useCallback((email: string) => {
    setInvited((prev) => prev.filter((e) => e !== email));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[var(--accent-primary)]" />
            Share {workflowTitle}
          </DialogTitle>
          <DialogDescription>
            Choose who can access this workflow and what they can do.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Public / Private toggle */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isPublic ? "bg-[var(--semantic-info)]/15" : "bg-[var(--bg-surface-3)]"
                )}
              >
                {isPublic ? (
                  <Globe className="h-4 w-4 text-[var(--semantic-info)]" />
                ) : (
                  <Lock className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {isPublic ? "Public link" : "Private"}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isPublic
                    ? "Anyone with the link can view this workflow."
                    : "Only invited members can access."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                isPublic ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-surface-3)]"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--bg-surface)] shadow transition-transform",
                  isPublic && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Link copy */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] truncate">
                {shareUrl}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={isCopying}
                className="shrink-0"
              >
                {isCopying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="h-4 w-4 text-[var(--semantic-success)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>

          {/* Permission selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Default permission
            </label>
            <div className="flex gap-2">
              <PermissionChip
                active={permission === "view"}
                icon={<Eye className="h-3.5 w-3.5" />}
                label="Can view"
                onClick={() => setPermission("view")}
              />
              <PermissionChip
                active={permission === "edit"}
                icon={<Pencil className="h-3.5 w-3.5" />}
                label="Can edit"
                onClick={() => setPermission("edit")}
              />
            </div>
          </div>

          {/* Member invite */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Invite by email
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="colleague@example.com"
                className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
              >
                <UserPlus className="h-4 w-4" />
                <span className="sr-only">Invite</span>
              </Button>
            </div>

            {invited.length > 0 && (
              <ul className="mt-2 space-y-1">
                {invited.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between rounded-md bg-[var(--bg-surface-2)] px-3 py-1.5 text-sm"
                  >
                    <span className="text-[var(--text-primary)]">{email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                        {permission}
                      </span>
                      <button
                        onClick={() => removeInvite(email)}
                        className="text-[var(--text-muted)] hover:text-[var(--semantic-danger)]"
                        aria-label={`Remove ${email}`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PermissionChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-