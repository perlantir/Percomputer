"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Notification, NotificationCategory } from "@/src/types/frontend";

interface NotificationStore {
  // ── State ──
  items: Notification[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // ── Derived (getters) ──
  unreadCount: () => number;
  unreadItems: () => Notification[];
  readItems: () => Notification[];

  // ── Actions ──
  setItems: (items: Notification[]) => void;
  appendItems: (items: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteItem: (id: string) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markFetched: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,
      error: null,
      lastFetchedAt: null,

      unreadCount: () => get().items.filter((n) => !n.read).length,
      unreadItems: () => get().items.filter((n) => !n.read),
      readItems: () => get().items.filter((n) => n.read),

      setItems: (items) =>
        set({ items: sortByDate(items) }, false, "setItems"),

      appendItems: (items) =>
        set(
          (state) => {
            const existingIds = new Set(state.items.map((i) => i.id));
            const newItems = items.filter((i) => !existingIds.has(i.id));
            return { items: sortByDate([...state.items, ...newItems]) };
          },
          false,
          "appendItems"
        ),

      markAsRead: (id) =>
        set(
          (state) => ({
            items: state.items.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          }),
          false,
          "markAsRead"
        ),

      markAllAsRead: () =>
        set(
          (state) => ({
            items: state.items.map((n) => ({ ...n, read: true })),
          }),
          false,
          "markAllAsRead"
        ),

      deleteItem: (id) =>
        set(
          (state) => ({
            items: state.items.filter((n) => n.id !== id),
          }),
          false,
          "deleteItem"
        ),

      setOpen: (open) => set({ isOpen: open }, false, "setOpen"),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen }), false, "toggleOpen"),
      setLoading: (loading) => set({ isLoading: loading }, false, "setLoading"),
      setError: (error) => set({ error }, false, "setError"),
      markFetched: () => set({ lastFetchedAt: Date.now() }, false, "markFetched"),
    }),
    { name: "notification-store" }
  )
);

function sortByDate(items: Notification[]): Notification[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
