"use client";

import React, { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import {
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  X,
  Compass,
} from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onDismiss: () => void;
  onOptOut: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Workflows",
    description: "Describe what you need and let the agent orchestration layer handle the rest.",
  },
  {
    icon: Layers,
    title: "Multi-Model & Multi-Agent",
    description: "Route tasks across GPT-4, Claude, Gemini, and custom agents automatically.",
  },
  {
    icon: Zap,
    title: "Connect Your Tools",
    description: "Integrate with databases, APIs, and SaaS tools via connectors.",
  },
  {
    icon: Compass,
    title: "Discover Templates",
    description: "Browse pre-built workflows and deploy them in seconds.",
  },
];

export function WelcomeModal({
  open,
  onStartTour,
  onDismiss,
  onOptOut,
}: WelcomeModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onDismiss()}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
                onClick={onDismiss}
              />

              {/* Modal */}
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    "fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2",
                    "rounded-2xl border shadow-2xl",
                    "bg-[var(--bg-surface)] border-[var(--border-subtle)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  )}
                  style={{
                    boxShadow:
                      "0 24px 48px -12px rgb(0 0 0 / 0.35), 0 12px 24px -8px rgb(0 0 0 / 0.2)",
                  }}
                >
                  <div className="relative flex flex-col max-h-[90vh]">
                    {/* Close button */}
                    <button
                      onClick={onDismiss}
                      className={cn(
                        "absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-tertiary)]",
                        "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-secondary)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
                        "transition-colors z-10"
                      )}
                      aria-label="Close welcome dialog"
                    >
                      <X size={18} />
                    </button>

                    {/* Header */}
                    <div className="px-6 pt-8 pb-4">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10">
                        <Sparkles
                          size={24}
                          className="text-[var(--accent-primary)]"
                        />
                      </div>
                      <Dialog.Title className="text-2xl font-semibold text-[var(--text-primary)]">
                        Welcome to Computer
                      </Dialog.Title>
                      <Dialog.Description className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                        Your multi-model, multi-agent orchestration platform.
                        Build, run, and scale autonomous AI workflows in
                        minutes.
                      </Dialog.Description>
                    </div>

                    {/* Feature grid */}
                    <div className="flex-1 overflow-y-auto px-6 py-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {features.map((f) => (
                          <div
                            key={f.title}
                            className={cn(
                              "flex flex-col gap-2 rounded-xl border p-4",
                              "border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50",
                              "hover:border-[var(--border-default)] transition-colors"
                            )}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                              <f.icon
                                size={16}
                                className="text-[var(--accent-primary)]"
                              />
                            </div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                              {f.title}
                            </h4>
                            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                              {f.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="px-6 py-6 flex flex-col gap-3">
                      <button
                        onClick={onStartTour}
                        className={cn(
                          "w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3",
                          "text-sm font-semibold",
                          "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
                          "hover:bg-[var(--accent-primary-hover)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
                          "transition-colors shadow-lg shadow-[var(--accent-primary)]/20"
                        )}
                      >
                        Start Quick Tour
                        <ArrowRight size={16} />
                      </button>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={onDismiss}
                          className={cn(
                            "flex-1 rounded-lg px-4 py-2 text-sm font-medium",
                            "border border-[var(--border-default)] text-[var(--text-secondary)]",
                            "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
                            "transition-colors"
                          )}
                        >
                          Explore on my own
                        </button>
                        <button
                          onClick={onOptOut}
                          className={cn(
                            "flex-1 rounded-lg px-4 py-2 text-sm font-medium",
                            "text-[var(--text-tertiary)]",
                            "hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
                            "transition-colors"
                          )}
                        >
                          Don&apos;t show again
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
