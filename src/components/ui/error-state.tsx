"use client";

import * as React from "react";
import {
  AlertTriangle,
  AlertCircle,
  WifiOff,
  FileX2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

export type ErrorVariant = "not-found" | "generic" | "network" | "permission";

interface ErrorStateProps {
  variant?: ErrorVariant;
  title?: string;
  message?: string;
  retry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

const variantConfig: Record<
  ErrorVariant,
  { icon: LucideIcon; defaultTitle: string; defaultMessage: string }
> = {
  "not-found": {
    icon: FileX2,
    defaultTitle: "Not found",
    defaultMessage:
      "The resource you’re looking for doesn’t exist or has been removed.",
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "Something went wrong",
    defaultMessage:
      "We encountered an unexpected error. Please try again later.",
  },
  network: {
    icon: WifiOff,
    defaultTitle: "Connection failed",
    defaultMessage:
      "Unable to reach the server. Check your network and try again.",
  },
  permission: {
    icon: AlertTriangle,
    defaultTitle: "Access denied",
    defaultMessage:
      "You don’t have permission to view this resource.",
  },
};

export function ErrorState({
  variant = "generic",
  title,
  message,
  retry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-16",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--semantic-danger)]/[0.08]">
        <Icon className="h-7 w-7 text-[var(--semantic-danger)]" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">
        {title ?? config.defaultTitle}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-[var(--text-secondary)]">
        {message ?? config.defaultMessage}
      </p>
      {(retry || action) && (
        <div className="mt-5 flex items-center gap-3">
          {retry && (
            <Button onClick={retry} className="gap-1.5">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/* ─── Page-level wrapper ─── */
interface ErrorPageProps extends Omit<ErrorStateProps, "className"> {
  minHeight?: string;
}

export function ErrorPage({ minHeight = "min-h-[100dvh]", ...props }: ErrorPageProps) {
  return (
    <main className={cn("flex items-center justify-center bg-[var(--bg-canvas)]", minHeight)}>
      <ErrorState {...props} />
    </main>
  );
}
