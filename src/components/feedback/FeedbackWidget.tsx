"use client";

import { useEffect } from "react";
import {
  MessageSquarePlus,
  X,
  ChevronDown,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useFeedbackStore } from "./feedbackStore";
import { FeedbackForm } from "./FeedbackForm";

export interface FeedbackWidgetProps {
  className?: string;
  position?: "bottom-right" | "bottom-left";
  title?: string;
  subtitle?: string;
}

export function FeedbackWidget({
  className,
  position = "bottom-right",
  title = "Send Feedback",
  subtitle = "Help us improve your experience",
}: FeedbackWidgetProps) {
  const { isOpen, isMinimized, open, close, minimize, restore, submitSuccess } =
    useFeedbackStore();

  // ── Keyboard shortcut ──

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === "Escape" && isOpen && !isMinimized) {
        close();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isMinimized, close]);

  // ── Position styles ──

  const isRight = position === "bottom-right";
  const widgetPosClass = isRight ? "right-6" : "left-6";

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      {!isOpen && (
        <button
          onClick={open}
          className={cn(
            "fixed bottom-6 z-50",
            isRight ? "right-6" : "left-6",
            // Size
            "h-14 w-14 rounded-full",
            // Appearance
            "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
            "shadow-lg shadow-[var(--accent-primary)]/25",
            // Interaction
            "hover:bg-[var(--accent-primary-hover)] hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 hover:scale-105",
            "active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
            // Animation
            "transition-all duration-fast ease-out",
            "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
            // Tooltip
            "group"
          )}
          aria-label="Open feedback widget"
          title="Send feedback"
        >
          <MessageSquarePlus className="w-6 h-6" />

          {/* Tooltip */}
          <span
            className={cn(
              "absolute bottom-full mb-2 px-3 py-1.5 rounded-lg",
              "glass-subtle",
              "text-xs font-medium text-[var(--text-primary)] whitespace-nowrap",
              "opacity-0 scale-95 pointer-events-none",
              "group-hover:opacity-100 group-hover:scale-100",
              "transition-all duration-fast ease-out",
              isRight ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"
            )}
          >
            Send feedback
          </span>
        </button>
      )}

      {/* ── Feedback Panel ── */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 z-50",
            widgetPosClass,
            // Size
            "w-[22rem] max-w-[calc(100vw-3rem)]",
            // Appearance
            "rounded-xl glass-strong",
            "shadow-xl shadow-black/10",
            // Animation
            "transition-all duration-fast ease-out",
            isMinimized ? "animate-none" : "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          {/* ── Header ── */}
          <div
            className={cn(
              "flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]",
              !isMinimized && "rounded-t-xl",
              isMinimized && "rounded-xl border-b-0"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div className="min-w-0">
                <h3
                  id="feedback-title"
                  className="text-sm font-semibold text-[var(--text-primary)] leading-tight"
                >
                  {submitSuccess ? "Feedback Sent" : title}
                </h3>
                {!isMinimized && !submitSuccess && (
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-tight truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {/* Minimize/Restore */}
              <button
                onClick={isMinimized ? restore : minimize}
                className={cn(
                  "p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                )}
                aria-label={isMinimized ? "Restore feedback form" : "Minimize feedback form"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Close */}
              <button
                onClick={close}
                className={cn(
                  "p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                )}
                aria-label="Close feedback widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          {!isMinimized && (
            <div className="px-4 py-4 max-h-[32rem] overflow-y-auto scrollbar-thin">
              <FeedbackForm />
            </div>
          )}

          {/* ── Footer hint ── */}
          {!isMinimized && (
            <div className="px-4 py-2.5 border-t border-[var(--glass-border)] bg-[var(--bg-surface-2)]/50 rounded-b-xl">
              <p className="text-[11px] text-[var(--text-quaternary)] text-center">
                Your feedback helps us improve the platform
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
