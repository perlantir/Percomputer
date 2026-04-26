"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  waiting: ServiceWorker | null;
  updateAvailable: boolean;
  offlineReady: boolean;
  syncSupported: boolean;
  pushSupported: boolean;
  subscription: PushSubscription | null;
  swVersion: string | null;
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  /** Register the service worker */
  register: () => Promise<void>;
  /** Skip waiting and activate the new service worker */
  update: () => void;
  /** Request push notification permission and subscribe */
  subscribePush: (vapidPublicKey: string, userId?: string) => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribePush: () => Promise<boolean>;
  /** Queue an action for background sync */
  queueForSync: (payload: SyncPayload) => Promise<void>;
  /** Clear all caches */
  clearCaches: () => Promise<boolean>;
  /** Check for SW updates */
  checkForUpdate: () => Promise<void>;
}

export interface SyncPayload {
  url: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body: string;
}

// ── Constants ──────────────────────────────────────────────

const SW_PATH = "/sw.js";
const SYNC_TAG = "agent-platform-sync";

// ── Hook ───────────────────────────────────────────────────

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    waiting: null,
    updateAvailable: false,
    offlineReady: false,
    syncSupported: false,
    pushSupported: false,
    subscription: null,
    swVersion: null,
  });

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check browser support
  useEffect(() => {
    const swSupported = "serviceWorker" in navigator;
    const syncSupported = swSupported && "sync" in ServiceWorkerRegistration.prototype;
    const pushSupported = swSupported && "pushManager" in ServiceWorkerRegistration.prototype;

    setState((prev) => ({
      ...prev,
      isSupported: swSupported,
      syncSupported,
      pushSupported,
    }));
  }, []);

  // ── Register ─────────────────────────────────────────────

  const register = useCallback(async () => {
    if (!state.isSupported) {
      console.warn("[SW] Service workers not supported");
      return;
    }

    if (registrationRef.current) return;

    setState((prev) => ({ ...prev, isInstalling: true }));

    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: "/",
        updateViaCache: "imports",
      });

      registrationRef.current = registration;

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New version waiting
            setState((prev) => ({
              ...prev,
              updateAvailable: true,
              waiting: newWorker,
            }));
          }

          if (newWorker.state === "activated") {
            setState((prev) => ({
              ...prev,
              offlineReady: true,
              isRegistered: true,
              isInstalling: false,
              updateAvailable: false,
            }));
          }
        });
      });

      // Check initial state
      if (registration.active) {
        setState((prev) => ({
          ...prev,
          isRegistered: true,
          isInstalling: false,
          offlineReady: true,
        }));

        // Get SW version
        sendMessageToSW({ type: "GET_VERSION" }).then((response) => {
          if (response?.version) {
            setState((prev) => ({ ...prev, swVersion: response.version }));
          }
        });
      }

      // Listen for controller changes (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setState((prev) => ({
          ...prev,
          updateAvailable: false,
          waiting: null,
        }));
      });

      // Check existing push subscription
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        setState((prev) => ({ ...prev, subscription: existingSub }));
      }
    } catch (error) {
      console.error("[SW] Registration failed:", error);
      setState((prev) => ({ ...prev, isInstalling: false }));
    }
  }, [state.isSupported]);

  // Auto-register on mount
  useEffect(() => {
    if (state.isSupported) {
      register();
    }
  }, [state.isSupported, register]);

  // ── Update (skip waiting) ────────────────────────────────

  const update = useCallback(() => {
    if (state.waiting) {
      sendMessageToSW({ type: "SKIP_WAITING" });
      // Reload after a short delay to let the new SW take over
      setTimeout(() => window.location.reload(), 500);
    }
  }, [state.waiting]);

  // ── Push Subscription ────────────────────────────────────

  const subscribePush = useCallback(
    async (vapidPublicKey: string, userId?: string): Promise<boolean> => {
      if (!registrationRef.current || !state.pushSupported) return false;

      try {
        const result = await sendMessageToSW({
          type: "SUBSCRIBE_PUSH",
          payload: { vapidPublicKey, userId },
        });

        if (result?.success && result?.subscription) {
          setState((prev) => ({
            ...prev,
            subscription: result.subscription,
          }));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [state.pushSupported]
  );

  const unsubscribePush = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await registrationRef.current?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Notify server
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
      }
      setState((prev) => ({ ...prev, subscription: null }));
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Background Sync ──────────────────────────────────────

  const queueForSync = useCallback(
    async (payload: SyncPayload): Promise<void> => {
      if (!state.syncSupported || !registrationRef.current) {
        // Fallback: try direct fetch
        try {
          await fetch(payload.url, {
            method: payload.method || "POST",
            headers: payload.headers,
            body: payload.body,
          });
        } catch (error) {
          console.error("[SW] Direct fetch failed, action lost:", error);
        }
        return;
      }

      // Queue via SW
      await sendMessageToSW({ type: "QUEUE_SYNC", payload });

      // Register background sync
      try {
        await registrationRef.current.sync.register(SYNC_TAG);
      } catch (error) {
        console.warn("[SW] Background sync registration failed:", error);
      }
    },
    [state.syncSupported]
  );

  // ── Clear Caches ─────────────────────────────────────────

  const clearCaches = useCallback(async (): Promise<boolean> => {
    try {
      const result = await sendMessageToSW({ type: "CLEAR_CACHES" });
      return result?.success || false;
    } catch {
      return false;
    }
  }, []);

  // ── Check for Updates ────────────────────────────────────

  const checkForUpdate = useCallback(async (): Promise<void> => {
    if (!registrationRef.current) return;
    await registrationRef.current.update();
  }, []);

  return {
    ...state,
    register,
    update,
    subscribePush,
    unsubscribePush,
    queueForSync,
    clearCaches,
    checkForUpdate,
  };
}

// ── Helper: Send message to SW and await response ──────────

function sendMessageToSW(message: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    channel.port1.onmessageerror = () => {
      reject(new Error("Message channel error"));
    };

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);

    // Timeout after 5 seconds
    setTimeout(() => reject(new Error("SW message timeout")), 5000);
  });
}

// ── Utility: Listen for SW messages in components ──────────

export function useServiceWorkerMessages(handler: (message: MessageEvent) => void) {
  useEffect(() => {
    if (!"serviceWorker" in navigator) return;

    const onMessage = (event: MessageEvent) => {
      handler(event);
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [handler]);
}
