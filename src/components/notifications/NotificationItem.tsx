"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  Unplug,
  FileText,
  BrainCircuit,
  XCircle,
  UserPlus,
  X,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import type { Notification, NotificationCategory } from "@/src/types/frontend";

// ─────────────────────────────────────────────────────────────────────────────
// Category config: icon + colour tokens
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryConfig {
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
  unreadRing: string;
}

const CATEGORY_CONFIG: Record<NotificationCategory, CategoryConfig> = {
  workflow_complete: {
    icon: <CheckCircle className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-success)]/15",
    accentText: "text-[var(--semantic-success)]",
    unreadRing: "ring-[var(--semantic-success)]/40",
  },
  clarification_needed: {
    icon: <HelpCircle className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-warning)]/15",
    accentText: "text-[var(--semantic-warning)]",
    unreadRing: "ring-[var(--semantic-warning)]/40",
  },
  approval_required: {
    icon: <ShieldCheck className="h-4 w-4" />,
    accentBg: "bg-[var(--accent-primary)]/15",
    accentText: "text-[var(--accent-primary)]",
    unreadRing: "ring-[var(--accent-primary)]/40",
  },
  credit_low: {
    icon: <Wallet className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-danger)]/15",
    accentText: "text-[var(--semantic-danger)]",
    unreadRing: "ring-[var(--semantic-danger)]/40",
  },
  system_alert: {
    icon: <AlertTriangle className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-info)]/15",
    accentText: "text-[var(--semantic-info)]",
    unreadRing: "ring-[var(--semantic-info)]/40",
  },
  connector_error: {
    icon: <Unplug className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-danger)]/15",
    accentText: "text-[var(--semantic-danger)]",
    unreadRing: "ring-[var(--semantic-danger)]/40",
  },
  artifact_ready: {
    icon: <FileText className="h-4 w-4" />,
    accentBg: "bg-[var(--accent-tertiary)]/15",
    accentText: "text-[var(--accent-tertiary)]",
    unreadRing: "ring-[var(--accent-tertiary)]/40",
  },
  memory_stored: {
    icon: <BrainCircuit className="h-4 w-4" />,
    accentBg: "bg-[var(--accent-secondary)]/15",
    accentText: "text-[var(--accent-secondary)]",
    unreadRing: "ring-[var(--accent-secondary)]/40",
  },
  task_failed: {
    icon: <XCircle className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-danger)]/15",
    accentText: "text-[var(--semantic-danger)]",
    unreadRing: "ring-[var(--semantic-danger)]/40",
  },
  member_joined: {
    icon: <UserPlus className="h-4 w-4" />,
    accentBg: "bg-[var(--semantic-success)]/15",
    accentText: "text-[var(--semantic-success)]",
    unreadRing: "ring-[var(--semantic-success)]/40",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Relative-time formatter
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationItem = React.memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  index = 0,
}: NotificationItemProps) {
  const router = useRouter();
  const config = CATEGORY_CONFIG[notification.category];
  const isUnread = !notification.read;

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionHref) {
      router.push(notification.actionHref);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-fast",
        isUnread
          ? "border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm hover:bg-[var(--bg-surface-2)]"
          : "border-transparent bg-transparent hover:bg-[var(--bg-surface-2)]"
      )}
      onClick={handleClick}
      role="listitem"
      aria-label={notification.title}
    >
      {/* Unread indicator dot */}
      {isUnread && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
          <span
            className={cn(
              "block h-1.5 w-1.5 rounded-full",
              config.accentText.replace("text-", "bg-")
            )}
          />
        </div>
      )}

      {/* Icon badge */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          config.accentBg,
          config.accentText
        )}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm leading-5",
              isUnread
                ? "font-semibold text-[var(--text-primary)]"
                : "font-medium text-[var(--text-secondary)]"
            )}
          >
            {notification.title}
          </h4>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-[var(--text-tertiary)] opacity-0 transition-all hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-secondary)] group-hover:opacity-100 focus:opacity-100"
            aria-label={`Dismiss ${notification.title}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <p className="mt-0.5 text-xs leading-4 text-[var(--text-secondary)] line-clamp-2">
          {notification.message}
        </p>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(notification.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
});
