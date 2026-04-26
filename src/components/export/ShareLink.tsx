"use client";

import * as React from "react";
import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  Clock,
  Shield,
  Globe,
  Lock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Switch } from "@/src/components/ui/switch";
import {
  generateShareLink,
  expirationLabel,
  copyToClipboard,
  type ShareLinkOptions,
} from "@/src/lib/export-utils";
import { toast } from "@/src/components/layout/Toaster";

interface ShareLinkProps {
  entityType: ShareLinkOptions["entityType"];
  entityId: string;
  baseUrl?: string;
  children?: React.ReactNode;
  onShare?: (url: string) => void;
}

const EXPIRATION_OPTIONS: { hours: number | null; label: string }[] = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "1 day" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
  { hours: null, label: "Never expires" },
];

export function ShareLink({
  entityType,
  entityId,
  baseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "",
  children,
  onShare,
}: ShareLinkProps) {
  const [open, setOpen] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState<number | null>(24);
  const [requireAuth, setRequireAuth] = useState(false);
  const [generated, setGenerated] = useState<{
    url: string;
    token: string;
    expiresAt: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate a brief network round-trip
    await new Promise((res) => setTimeout(res, 400));
    const result = generateShareLink(baseUrl, {
      entityType,
      entityId,
      expiresInHours,
      requireAuth,
    });
    setGenerated(result);
    setLoading(false);
    onShare?.(result.url);
    toast.success("Share link generated", "The link is ready to be shared.");
  };

  const handleCopy = async () => {
    if (!generated) return;
    const ok = await copyToClipboard(generated.url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard", "Share link copied.");
    } else {
      toast.error("Copy failed", "Could not copy to clipboard.");
    }
  };

  const handleReset = () => {
    setGenerated(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Link2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md gap-0 overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 dark:bg-[var(--bg-surface)]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[var(--text-primary)]">
            Share Link
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Generate a link others can use to view this {entityType}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          {/* Expiration */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Expiration
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EXPIRATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setExpiresInHours(opt.hours);
                    setGenerated(null);
                    setCopied(false);
                  }}
                  disabled={!!generated}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs transition-colors",
                    expiresInHours === opt.hours && !generated
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : generated
                        ? "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth toggle */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              {requireAuth ? (
                <Lock className="h-4 w-4 text-[var(--text-secondary)]" />
              ) : (
                <Globe className="h-4 w-4 text-[var(--text-secondary)]" />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {requireAuth ? "Require sign-in" : "Public link"}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {requireAuth
                    ? "Only signed-in users can access"
                    : "Anyone with the link can view"}
                </p>
              </div>
            </div>
            <Switch
              checked={requireAuth}
              onCheckedChange={(v) => {
                setRequireAuth(v);
                setGenerated(null);
                setCopied(false);
              }}
              disabled={!!generated}
            />
          </div>

          {/* Generated link */}
          {generated && (
            <div className="flex flex-col gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Link ready
                </span>
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-[var(--bg-surface-2)] px-2 py-1 text-xs text-[var(--text-primary)]">
                  {generated.url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className={cn(
                    "shrink-0 gap-1.5 border-[var(--border-subtle)]",
                    copied && "border-emerald-500 text-emerald-500"
                  )}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {generated.expiresAt
                    ? `Expires ${new Date(generated.expiresAt).toLocaleString()}`
                    : "Never expires"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Token: {generated.token}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {generated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-[var(--text-secondary)]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New link
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]/90"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-[var(--text-secondary)]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={handleGenerate}
                  className="gap-1.5 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]/90"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {loading ? "Generating…" : "Generate link"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
