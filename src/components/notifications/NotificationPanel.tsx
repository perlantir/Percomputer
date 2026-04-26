"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Bell, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/src/types/frontend";

interface NotificationPanelProps {
  /** Whether the panel is visible. */
  open: boolean;
  /** Array of notifications to display. */
  items: Notification[];
  /** Loading state. */
  isLoading: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Number of unread notifications (for the empty-state copy). */
  unreadCount: number;
  /** Close the panel. */
  onClose: () => void;
  /** Mark a single notification as read. */
  onMarkAsRead: (id: string) => void;
  /** Mark all notifications as read. */
  onMarkAllAsRead: () => void;
  /** Delete a notification. */
  onDelete: (id: string) => void;
  /** Ref for the trigger element (used for focus return). */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Dropdown panel listing all notifications.
 *
 * Features:
 * - Animated open/close with Framer Motion
 * - Scrollable list with Radix ScrollArea
 * - Empty state with illustration placeholder
 * - "Mark all as read" bulk action
 * - Focus trap and Escape-to-close
 * - Click-outside to dismiss
 */
export function NotificationPanel({
  open,
  items,
  isLoading,
  error,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  triggerRef,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, triggerRef]);

  // Escape → close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Return focus to trigger on close
  useEffect(() => {
    if (!open && triggerRef?.current) {
      const timer = setTimeout(() => triggerRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open, triggerRef]);

  const unreadItems = items.filter((i) => !i.read);
  const canMarkAll = unreadItems.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute right-0 top-full z-[var(--z-dropdown)] mt-2",
            "w-96 max-w-[calc(100vw-2rem)]",
            "overflow-hidden rounded-xl border border-[var(--border-subtle)]",
            "bg-[var(--bg-surface)] shadow-lg shadow-black/10 dark:shadow-black/20"
          )}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-inverse)]">
                  {unreadCount}
                </span>
              )}
            </div>
            {canMarkAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllAsRead();
                }}
                className="h-7 text-xs"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[420px]">
            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center py-12" role="status" aria-label="Loading notifications">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" aria-hidden="true" />
                <span className="sr-only">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--semantic-danger)]">{error}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Try refreshing the page.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-2)]">
                  <Bell className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  When workflows finish, need clarifications, or approvals, you&apos;ll see them here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full max-h-[420px]">
                <div className="flex flex-col gap-1 p-2" role="list">
                  <AnimatePresence initial={false}>
                    {items.map((item, idx) => (
                      <NotificationItem
                        key={item.id}
                        notification={item}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                        index={idx}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] px-4 py-2 text-center">
              <span className="text-xs text-[var(--text-tertiary)]">
                {items.length} total · {unreadItems.length} unread
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
