"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// ── Types ──────────────────────────────────────────────────────────

export type UserStatus = "online" | "away" | "offline" | "typing";

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: UserStatus;
  lastSeen: string; // ISO date
  cursor?: { x: number; y: number } | null;
  currentDocument?: string | null;
  typingIn?: string | null; // document/field ID
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  type:
    | "joined"
    | "left"
    | "typing"
    | "edited"
    | "commented"
    | "viewed"
    | "cursor_move";
  documentId?: string;
  documentName?: string;
  message?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PresenceState {
  currentUser: PresenceUser | null;
  users: PresenceUser[];
  activities: ActivityEvent[];
  isConnected: boolean;
  pendingCursor: { x: number; y: number } | null;
  typingTimeouts: Record<string, ReturnType<typeof setTimeout>>;
}

interface PresenceActions {
  setCurrentUser: (user: PresenceUser) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserCursor: (userId: string, cursor: { x: number; y: number }) => void;
  addOrUpdateUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  setTyping: (userId: string, documentId: string) => void;
  clearTyping: (userId: string) => void;
  addActivity: (event: ActivityEvent) => void;
  setConnectionStatus: (connected: boolean) => void;
  setPendingCursor: (cursor: { x: number; y: number } | null) => void;
}

// ── Zustand Store ──────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#14b8a6", // teal
];

export const usePresenceStore = create<PresenceState & PresenceActions>()(
  immer((set) => ({
    // State
    currentUser: null,
    users: [],
    activities: [],
    isConnected: false,
    pendingCursor: null,
    typingTimeouts: {},

    // Actions
    setCurrentUser: (user) =>
      set((state) => {
        state.currentUser = user;
      }),

    updateUserStatus: (userId, status) =>
      set((state) => {
        const user = state.users.find((u) => u.id === userId);
        if (user) {
          user.status = status;
          user.lastSeen = new Date().toISOString();
        }
        if (state.currentUser?.id === userId) {
          state.currentUser.status = status;
        }
      }),

    updateUserCursor: (userId, cursor) =>
      set((state) => {
        const user = state.users.find((u) => u.id === userId);
        if (user) {
          user.cursor = cursor;
          user.lastSeen = new Date().toISOString();
        }
      }),

    addOrUpdateUser: (user) =>
      set((state) => {
        const idx = state.users.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          state.users[idx] = { ...state.users[idx], ...user, lastSeen: new Date().toISOString() };
        } else {
          state.users.push({ ...user, lastSeen: new Date().toISOString() });
        }
      }),

    removeUser: (userId) =>
      set((state) => {
        state.users = state.users.filter((u) => u.id !== userId);
      }),

    setTyping: (userId, documentId) =>
      set((state) => {
        const user = state.users.find((u) => u.id === userId);
        if (user) {
          user.status = "typing";
          user.typingIn = documentId;
          user.lastSeen = new Date().toISOString();
        }
        // Clear existing timeout for this user
        if (state.typingTimeouts[userId]) {
          clearTimeout(state.typingTimeouts[userId]);
        }
        // Auto-clear typing after 3s
        const timeout = setTimeout(() => {
          usePresenceStore.getState().clearTyping(userId);
        }, 3000);
        state.typingTimeouts[userId] = timeout;
      }),

    clearTyping: (userId) =>
      set((state) => {
        const user = state.users.find((u) => u.id === userId);
        if (user && user.status === "typing") {
          user.status = "online";
          user.typingIn = null;
        }
        if (state.typingTimeouts[userId]) {
          clearTimeout(state.typingTimeouts[userId]);
          delete state.typingTimeouts[userId];
        }
      }),

    addActivity: (event) =>
      set((state) => {
        state.activities.unshift(event);
        // Keep last 100 activities
        if (state.activities.length > 100) {
          state.activities = state.activities.slice(0, 100);
        }
      }),

    setConnectionStatus: (connected) =>
      set((state) => {
        state.isConnected = connected;
      }),

    setPendingCursor: (cursor) =>
      set((state) => {
        state.pendingCursor = cursor;
      }),
  }))
);

// ── API Helpers ────────────────────────────────────────────────────

const fetchRoomPresence = async (roomId: string): Promise<PresenceUser[]> => {
  const res = await fetch(`/api/collaboration/rooms/${roomId}/presence`);
  if (!res.ok) throw new Error("Failed to fetch presence");
  return res.json();
};

const postHeartbeat = async ({
  roomId,
  status,
  cursor,
  documentId,
}: {
  roomId: string;
  status: UserStatus;
  cursor?: { x: number; y: number } | null;
  documentId?: string | null;
}) => {
  const res = await fetch(`/api/collaboration/rooms/${roomId}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, cursor, documentId }),
  });
  if (!res.ok) throw new Error("Heartbeat failed");
  return res.json();
};

const fetchActivities = async (roomId: string): Promise<ActivityEvent[]> => {
  const res = await fetch(`/api/collaboration/rooms/${roomId}/activities`);
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
};

// ── Hook ───────────────────────────────────────────────────────────

export interface UsePresenceOptions {
  roomId: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  enabled?: boolean;
  heartbeatIntervalMs?: number;
  staleTimeoutMs?: number;
}

export function usePresence({
  roomId,
  currentUser: currentUserProp,
  enabled = true,
  heartbeatIntervalMs = 10000,
  staleTimeoutMs = 30000,
}: UsePresenceOptions) {
  const queryClient = useQueryClient();
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const store = usePresenceStore();
  const { currentUser, users, activities, isConnected } = store;

  // Initialize current user with a color
  useEffect(() => {
    if (currentUserProp && !store.currentUser) {
      const colorIndex =
        Math.abs(
          currentUserProp.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        ) % AVATAR_COLORS.length;

      store.setCurrentUser({
        ...currentUserProp,
        color: AVATAR_COLORS[colorIndex],
        status: "online",
        lastSeen: new Date().toISOString(),
        cursor: null,
        currentDocument: roomId,
        typingIn: null,
      });
    }
  }, [currentUserProp, roomId, store]);

  // Fetch initial presence data
  const presenceQuery = useQuery({
    queryKey: ["presence", roomId],
    queryFn: () => fetchRoomPresence(roomId),
    enabled: enabled && !!roomId,
    refetchInterval: heartbeatIntervalMs * 2,
    staleTime: heartbeatIntervalMs,
  });

  // Fetch activities
  const activitiesQuery = useQuery({
    queryKey: ["activities", roomId],
    queryFn: () => fetchActivities(roomId),
    enabled: enabled && !!roomId,
    refetchInterval: heartbeatIntervalMs * 3,
  });

  // Heartbeat mutation
  const heartbeatMutation = useMutation({
    mutationFn: postHeartbeat,
    onSuccess: () => {
      store.setConnectionStatus(true);
    },
    onError: () => {
      store.setConnectionStatus(false);
    },
  });

  // Populate users from query
  useEffect(() => {
    if (presenceQuery.data) {
      presenceQuery.data.forEach((user) => {
        if (user.id !== currentUser?.id) {
          store.addOrUpdateUser(user);
        }
      });
    }
  }, [presenceQuery.data, currentUser?.id, store]);

  // Populate activities from query
  useEffect(() => {
    if (activitiesQuery.data) {
      activitiesQuery.data.forEach((activity) => {
        const exists = store.activities.some((a) => a.id === activity.id);
        if (!exists) {
          store.addActivity(activity);
        }
      });
    }
  }, [activitiesQuery.data, store]);

  // Heartbeat interval
  useEffect(() => {
    if (!enabled || !currentUser) return;

    const sendHeartbeat = () => {
      heartbeatMutation.mutate({
        roomId,
        status: currentUser.status,
        cursor: currentUser.cursor,
        documentId: currentUser.currentDocument,
      });
    };

    // Send immediately
    sendHeartbeat();

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatIntervalMs);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [enabled, currentUser, roomId, heartbeatIntervalMs, heartbeatMutation]);

  // Mark stale users as offline
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      store.users.forEach((user) => {
        const lastSeen = new Date(user.lastSeen).getTime();
        if (now - lastSeen > staleTimeoutMs && user.status !== "offline") {
          store.updateUserStatus(user.id, "offline");
        }
      });
    }, heartbeatIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, store, staleTimeoutMs, heartbeatIntervalMs]);

  // ── User Actions ────────────────────────────────────────────────

  const setStatus = useCallback(
    (status: UserStatus) => {
      if (!currentUser) return;
      store.updateUserStatus(currentUser.id, status);
    },
    [currentUser, store]
  );

  const setTyping = useCallback(
    (documentId: string) => {
      if (!currentUser) return;
      store.setTyping(currentUser.id, documentId);
    },
    [currentUser, store]
  );

  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!currentUser) return;
      store.updateUserCursor(currentUser.id, { x, y });
    },
    [currentUser, store]
  );

  const setCurrentDocument = useCallback(
    (documentId: string | null) => {
      if (!store.currentUser) return;
      store.setCurrentUser({
        ...store.currentUser,
        currentDocument: documentId,
      });
    },
    [store]
  );

  // ── Activity Logging ────────────────────────────────────────────

  const logActivity = useCallback(
    (event: Omit<ActivityEvent, "id" | "timestamp" | "userId" | "userName" | "userColor">) => {
      if (!currentUser) return;
      const fullEvent: ActivityEvent = {
        ...event,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userColor: currentUser.color,
      };
      store.addActivity(fullEvent);
    },
    [currentUser, store]
  );

  // ── Cleanup on unmount ──────────────────────────────────────────

  useEffect(() => {
    return () => {
      // Clear all typing timeouts
      Object.values(store.typingTimeouts).forEach((t) => clearTimeout(t));
    };
  }, [store.typingTimeouts]);

  // ── Derived state ───────────────────────────────────────────────

  const onlineUsers = users.filter(
    (u) => u.status !== "offline" && u.id !== currentUser?.id
  );

  const typingUsers = users.filter((u) => u.status === "typing");

  const isLoading = presenceQuery.isLoading || activitiesQuery.isLoading;
  const isError = presenceQuery.isError || activitiesQuery.isError;

  return {
    // Current user
    currentUser,

    // Other users in the room
    users,
    onlineUsers,
    onlineCount: onlineUsers.length,

    // Typing
    typingUsers,
    isAnyoneTyping: typingUsers.length > 0,

    // Activities
    activities,
    recentActivities: activities.slice(0, 20),

    // Connection
    isConnected,
    isLoading,
    isError,

    // Actions
    setStatus,
    setTyping,
    updateCursor,
    setCurrentDocument,
    logActivity,
  };
}

export default usePresence;
