"use client";

import * as React from "react";
import {
  Inbox,
  Search,
  Box,
  FileQuestion,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

export type EmptyVariant =
  | "default"
  | "search"
  | "no-data"
  | "not-found"
  | "custom";

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantConfig: Record<
  EmptyVariant,
  { icon: LucideIcon; defaultTitle: string; defaultDescription: string }
> = {
  default: {
    icon: Inbox,
    defaultTitle: "Nothing here yet",
    defaultDescription: "Items will appear once they’re created or imported.",
  },
  search: {
    icon: Search,
    defaultTitle: "No results found",
    defaultDescription:
      "Try adjusting your search terms or filters to find what you’re looking for.",
  },
  "no-data": {
    icon: Box,
    defaultTitle: "No data available",
    defaultDescription: "There’s nothing to show right now.",
  },
  "not-found": {
    icon: FileQuestion,
    defaultTitle: "Nothing matched your query",
    defaultDescription: "We couldn’t find anything that matches your criteria.",
  },
  custom: {
    icon: Inbox,
    defaultTitle: "Nothing here yet",
    defaultDescription: "Items will appear once they’re created or imported.",
  },
};

export function EmptyState({
  variant = "default",
  icon: CustomIcon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon ?? config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-16",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-surface-2)]">
        <Icon
          className="h-7 w-7 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">
        {title ?? config.defaultTitle}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-[var(--text-secondary)]">
        {description ?? config.defaultDescription}
      </p>
      {(action || onAction) && (
        <div className="mt-5">
          {action ?? (
            <Button variant="secondary" onClick={onAction}>
              {actionLabel ?? "Get started"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page-level wrapper ─── */
interface EmptyPageProps extends Omit<EmptyStateProps, "className"> {
  minHeight?: string;
}

export function EmptyPage({ minHeight = "min-h-[100dvh]", ...props }: EmptyPageProps) {
  return (
    <main
      className={cn("flex items-center justify-center bg-[var(--bg-canvas)]", minHeight)}
    >
      <EmptyState {...props} />
    </main>
  );
}
