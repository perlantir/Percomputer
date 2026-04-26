"use client";

import { useEffect, useCallback } from "react";
import { useNotificationStore } from "@/src/store/notificationStore";
import { DEMO_NOTIFICATIONS } from "@/src/data/demo-notifications";
import type { Notification } from "@/src/types/frontend";

const POLL_INTERVAL_MS = 30000; // 30 s

export interface UseNotificationsReturn {
  /** All notifications, newest first. */
  items: Notification[];
  /** Currently-unread notifications. */
  unreadItems: Notification[];
  /** Number of unread notifications. */
  unreadCount: number;
  /** Whether a fetch is in flight. */
  isLoading: boolean;
  /** Last error message, if any. */
  error: string | null;
  /** Mark a single notification as read. */
  markAsRead: (id: string) => void;
  /** Mark every notification as read. */
  markAllAsRead: () => void;
  /** Remove a notification from the list. */
  deleteNotification: (id: string) => void;
  /** Manually refetch notifications. */
  refetch: () => void;
}

/**
 * Hook that manages the notification lifecycle:
 * - Hydrates the store with demo data on first mount (client-only).
 * - Polls every 30 s (stubbed for future API integration).
 * - Provides derived state and actions from the Zustand store.
 */
export function useNotifications(): UseNotificationsReturn {
  const store = useNotificationStore();

  // Simulate a fetch (replace with real API call when backend is ready)
  const fetchNotifications = useCallback(() => {
    store.setLoading(true);
    store.setError(null);

    // Artificial network delay for realism
    setTimeout(() => {
      try {
        store.setItems(DEMO_NOTIFICATIONS);
        store.markFetched();
      } catch (err) {
        store.setError(
          err instanceof Error ? err.message : "Failed to load notifications"
        );
      } finally {
        store.setLoading(false);
      }
    }, 400);
  }, [store]);

  // Initial hydration
  useEffect(() => {
    if (store.items.length === 0 && !store.isLoading) {
      fetchNotifications();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling
  useEffect(() => {
    const timer = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  return {
    items: store.items,
    unreadItems: store.unreadItems(),
    unreadCount: store.unreadCount(),
    isLoading: store.isLoading,
    error: store.error,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    deleteNotification: store.deleteItem,
    refetch: fetchNotifications,
  };
}
