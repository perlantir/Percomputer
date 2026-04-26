"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useServiceWorker, useServiceWorkerMessages } from "@/src/hooks/useServiceWorker";
import type { SyncPayload } from "@/src/hooks/useServiceWorker";
import { useNotificationStore } from "@/src/store/notificationStore";
import { Button } from "@/src/components/ui/button";
import { X, RefreshCw, WifiOff, Wifi } from "lucide-react";
import { cn } from "@/src/lib/utils";

// ── Context ────────────────────────────────────────────────

interface PWAContextValue {
  /** True if the app is running as an installed PWA */
  isStandalone: boolean;
  /** True when device is offline */
  isOffline: boolean;
  /** True when a SW update is waiting */
  updateAvailable: boolean;
  /** Trigger the waiting SW to activate */
  applyUpdate: () => void;
  /** Queue an action for background sync when offline */
  queueForSync: (payload: SyncPayload) => Promise<void>;
  /** Whether background sync is supported */
  syncSupported: boolean;
}

const PWAContext = createContext<PWAContextValue>({
  isStandalone: false,
  isOffline: false,
  updateAvailable: false,
  applyUpdate: () => {},
  queueForSync: async () => {},
  syncSupported: false,
});

export const usePWA = () => useContext(PWAContext);

// ── Provider ───────────────────────────────────────────────

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const sw = useServiceWorker();
  const [isOffline, setIsOffline] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const appendItems = useNotificationStore((s) => s.appendItems);

  // Detect standalone PWA mode
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mq.matches || (window.navigator as any).standalone === true);

    const onChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      setShowOfflineToast(false);
    };
    const onOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Show update banner when SW has update
  useEffect(() => {
    if (sw.updateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [sw.updateAvailable]);

  // Handle SW messages
  useServiceWorkerMessages((event) => {
    const { type, ...data } = event.data || {};

    switch (type) {
      case "SYNC_SUCCESS":
        // Notify user that queued action was synced
        appendItems([
          {
            id: `sync-${Date.now()}`,
            title: "Action synced",
            body: "Your offline action was successfully synchronized.",
            category: "system",
            read: false,
            createdAt: new Date().toISOString(),
            link: data.item?.url || undefined,
          },
        ]);
        break;

      case "SYNC_FAILED":
        appendItems([
          {
            id: `sync-fail-${Date.now()}`,
            title: "Sync failed",
            body: "An offline action could not be synchronized.",
            category: "system",
            read: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        break;
    }
  });

  const ctx: PWAContextValue = {
    isStandalone,
    isOffline,
    updateAvailable: sw.updateAvailable,
    applyUpdate: () => {
      sw.update();
      setShowUpdateBanner(false);
    },
    queueForSync: sw.queueForSync,
    syncSupported: sw.syncSupported,
  };

  return (
    <PWAContext.Provider value={ctx}>
      {children}

      {/* ── Update Banner ────────────────────────────────── */}
      {showUpdateBanner && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-[100]",
            "flex items-center justify-center gap-3",
            "px-4 py-3",
            "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white",
            "shadow-lg",
            "animate-in slide-in-from-top-full duration-300"
          )}
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            A new version is available
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 bg-white/20 text-white hover:bg-white/30 border-0 text-xs"
            onClick={ctx.applyUpdate}
          >
            Update Now
          </Button>
          <button
            onClick={() => setShowUpdateBanner(false)}
            className="absolute right-3 p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Offline Toast ────────────────────────────────── */}
      {showOfflineToast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]",
            "flex items-center gap-3",
            "px-5 py-3 rounded-xl",
            "bg-gray-900/90 backdrop-blur-sm text-white",
            "shadow-xl",
            "animate-in slide-in-from-bottom-8 duration-300"
          )}
        >
          <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-sm">
            You are offline. Actions will sync when you reconnect.
          </span>
          <button
            onClick={() => setShowOfflineToast(false)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Online Indicator ─────────────────────────────── */}
      {!showOfflineToast && isOffline === false && (
        <OnlineIndicator />
      )}
    </PWAContext.Provider>
  );
}

// ── Online Indicator (shows briefly when coming back online) ──

function OnlineIndicator() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onOnline = () => setShow(true);
    window.addEventListener("online", onOnline);

    if (show) {
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("online", onOnline);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]",
        "flex items-center gap-2",
        "px-4 py-2 rounded-full",
        "bg-green-500/90 backdrop-blur-sm text-white",
        "shadow-lg",
        "animate-in slide-in-from-bottom-8 duration-300"
      )}
    >
      <Wifi className="h-3.5 w-3.5" />
      <span className="text-sm font-medium">Back online</span>
    </div>
  );
}
