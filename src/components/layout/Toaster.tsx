"use client";

import * as React from "react";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/src/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Omit<Toast, "id">>) => void;
}

let toastIdCounter = 0;
const listeners = new Set<() => void>();
let toastMemoryState: ToastStore = {
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    toastMemoryState = {
      ...toastMemoryState,
      toasts: [...toastMemoryState.toasts, { ...toast, id }],
    };
    listeners.forEach((l) => l());
    return id;
  },
  removeToast: (id) => {
    toastMemoryState = {
      ...toastMemoryState,
      toasts: toastMemoryState.toasts.filter((t) => t.id !== id),
    };
    listeners.forEach((l) => l());
  },
  updateToast: (id, update) => {
    toastMemoryState = {
      ...toastMemoryState,
      toasts: toastMemoryState.toasts.map((t) =>
        t.id === id ? { ...t, ...update } : t
      ),
    };
    listeners.forEach((l) => l());
  },
};

function useToastStore(): ToastStore {
  const [, setState] = React.useState({});
  React.useEffect(() => {
    const listener = () => setState({});
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  return toastMemoryState;
}

/** Imperative API for showing toasts from anywhere (including outside React) */
export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    toastMemoryState.addToast({ title, description, type: "success", duration }),
  error: (title: string, description?: string, duration?: number) =>
    toastMemoryState.addToast({ title, description, type: "error", duration }),
  warning: (title: string, description?: string, duration?: number) =>
    toastMemoryState.addToast({ title, description, type: "warning", duration }),
  info: (title: string, description?: string, duration?: number) =>
    toastMemoryState.addToast({ title, description, type: "info", duration }),
  custom: (toastData: Omit<Toast, "id">) => toastMemoryState.addToast(toastData),
  dismiss: (id: string) => toastMemoryState.removeToast(id),
};

const typeConfig: Record<
  ToastType,
  { icon: React.ReactNode; border: string; bg: string; text: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    border: "border-[var(--success)]/25",
    bg: "bg-[var(--success)]/8",
    text: "text-[var(--success)]",
    iconColor: "text-[var(--success)]",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    border: "border-[var(--danger)]/25",
    bg: "bg-[var(--danger)]/8",
    text: "text-[var(--danger)]",
    iconColor: "text-[var(--danger)]",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    border: "border-[var(--warning)]/25",
    bg: "bg-[var(--warning)]/8",
    text: "text-[var(--warning)]",
    iconColor: "text-[var(--warning)]",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    border: "border-[var(--info)]/25",
    bg: "bg-[var(--info)]/8",
    text: "text-[var(--info)]",
    iconColor: "text-[var(--info)]",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = typeConfig[toast.type];
  const duration = toast.duration ?? 5000;
  const [isPaused, setIsPaused] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 120, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 120, scale: 0.92 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-lg border shadow-lg",
        "glass",
        config.border
      )}
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Progress bar - CSS animation instead of setInterval */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[var(--border-subtle)]">
        <div
          className={cn("h-full")}
          style={{
            width: shouldReduceMotion ? "0%" : "100%",
            backgroundColor: "var(--" + toast.type + ")",
            boxShadow: `0 0 6px var(--${toast.type})`,
            animationName: shouldReduceMotion ? "none" : "toast-progress",
            animationDuration: `${duration}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>

      <div className="flex items-start gap-3 p-4 pb-3">
        <motion.div
          initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 15, delay: 0.08 }}
          className={cn("shrink-0", config.iconColor)}
        >
          {config.icon}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onRemove(toast.id);
              }}
              className="mt-2 text-sm font-medium text-[var(--accent-primary)] hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 rounded p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="toast-progress"] {
            animation: none !important;
            width: 0% !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

export function Toaster({ className }: { className?: string }) {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[var(--z-toast)] flex w-full max-w-[400px] flex-col gap-3 p-4 sm:bottom-6 sm:right-6",
        className
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
