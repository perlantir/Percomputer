"use client";

import React, { useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useNotificationStore } from "@/src/store/notificationStore";
import { NotificationPanel } from "./NotificationPanel";

interface NotificationBellProps {
  /** Additional CSS class on the outer container. */
  className?: string;
}

/**
 * Header bell icon with unread badge.
 *
 * - Click opens the notification dropdown panel.
 * - Shows a red pulse dot when there are unread items.
 * - Accessible: has aria-label, aria-expanded, aria-live region for count.
 */
export function NotificationBell({ className }: NotificationBellProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { isOpen, toggleOpen, setOpen } = useNotificationStore();

  const {
    items,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const hasUnread = unreadCount > 0;

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => toggleOpen()}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg",
          "text-[var(--text-secondary)] transition-colors duration-fast",
          "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        )}
        aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-[18px] w-[18px]" />

        {/* Unread badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center",
                "rounded-full border-2 border-[var(--bg-surface)] bg-[var(--semantic-danger)]",
                "px-1 text-[10px] font-bold leading-none text-[var(--text-inverse)]"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Subtle pulse ring for new unread items */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              key="pulse"
              initial={{ opacity: 0.6, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-lg ring-2 ring-[var(--semantic-danger)]/30"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Live region for screen readers */}
      <span aria-live="polite" className="sr-only">
        {hasUnread ? `${unreadCount} unread notifications` : "No unread notifications"}
      </span>

      {/* Dropdown panel */}
      <NotificationPanel
        open={isOpen}
        items={items}
        isLoading={isLoading}
        error={error}
        unreadCount={unreadCount}
        onClose={() => setOpen(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
        triggerRef={triggerRef}
      />
    </div>
  );
}
