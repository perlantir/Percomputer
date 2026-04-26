"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import {
  Check,
  Play,
  BookOpen,
  Plug,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";

interface ChecklistItem {
  key: "createWorkflow" | "exploreLibrary" | "connectConnector" | "inviteTeam";
  label: string;
  description: string;
  icon: React.ElementType;
  cta: string;
  href?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: "createWorkflow",
    label: "Create your first workflow",
    description: "Describe a task in the composer and run it.",
    icon: Play,
    cta: "Open Composer",
    href: "/",
  },
  {
    key: "exploreLibrary",
    label: "Explore the library",
    description: "Browse your workflows and inspect results.",
    icon: BookOpen,
    cta: "Go to Library",
    href: "/library",
  },
  {
    key: "connectConnector",
    label: "Connect a tool",
    description: "Add a database, API, or SaaS integration.",
    icon: Plug,
    cta: "Open Connectors",
    href: "/connectors",
  },
  {
    key: "inviteTeam",
    label: "Invite your team",
    description: "Share spaces and collaborate on workflows.",
    icon: Users,
    cta: "Coming soon",
  },
];

function ProgressBar({
  progress,
  total,
}: {
  progress: number;
  total: number;
}) {
  const pct = Math.round((progress / total) * 100);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Getting started
        </span>
        <span className="text-xs font-semibold text-[var(--accent-primary)]">
          {progress}/{total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--bg-surface-3)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[var(--accent-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function OnboardingChecklist({
  className,
  collapsible = true,
  defaultOpen = true,
}: {
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const {
    state,
    checklistProgress,
    checklistTotal,
    completeChecklistItem,
    resetOnboarding,
    startTour,
  } = useOnboarding();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allDone = checklistProgress === checklistTotal;

  const handleCheck = (key: ChecklistItem["key"]) => {
    if (!state.checklist[key]) {
      completeChecklistItem(key);
      if (checklistProgress + 1 === checklistTotal) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          collapsible && "cursor-pointer select-none"
        )}
        onClick={() => collapsible && setIsOpen((o) => !o)}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              allDone
                ? "bg-[var(--success)]/10"
                : "bg-[var(--accent-primary)]/10"
            )}
          >
            <Sparkles
              size={14}
              className={cn(
                allDone
                  ? "text-[var(--success)]"
                  : "text-[var(--accent-primary)]"
              )}
            />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {allDone ? "You're all set!" : "Getting Started"}
          </h3>
        </div>
        {collapsible && (
          <button
            className={cn(
              "rounded p-1 text-[var(--text-tertiary)] transition-colors",
              "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-secondary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            )}
            aria-label={isOpen ? "Collapse checklist" : "Expand checklist"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <ProgressBar progress={checklistProgress} total={checklistTotal} />

              {/* Items */}
              <div className="flex flex-col gap-2">
                {CHECKLIST_ITEMS.map((item) => {
                  const done = state.checklist[item.key];
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.key}
                      className={cn(
                        "group flex items-start gap-3 rounded-lg border p-3 transition-all",
                        done
                          ? "border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/40"
                          : "border-[var(--border-subtle)] bg-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-2)]/30"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleCheck(item.key)}
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          done
                            ? "border-[var(--success)] bg-[var(--success)] text-[var(--text-inverse)]"
                            : "border-[var(--border-default)] bg-transparent hover:border-[var(--accent-primary)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                        )}
                        aria-checked={done}
                        role="checkbox"
                        aria-label={`Mark ${item.label} as complete`}
                      >
                        {done && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon
                            size={14}
                            className={cn(
                              "shrink-0",
                              done
                                ? "text-[var(--text-tertiary)]"
                                : "text-[var(--accent-primary)]"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              done
                                ? "text-[var(--text-tertiary)] line-through"
                                : "text-[var(--text-primary)]"
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-relaxed",
                            done
                              ? "text-[var(--text-tertiary)]"
                              : "text-[var(--text-secondary)]"
                          )}
                        >
                          {item.description}
                        </p>

                        {/* CTA link */}
                        {item.href && !done && (
                          <a
                            href={item.href}
                            className={cn(
                              "mt-1.5 inline-block text-xs font-medium text-[var(--accent-primary)]",
                              "hover:text-[var(--accent-primary-hover)] transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-sm"
                            )}
                            onClick={(e) => {
                              // If navigating away, mark as done after a delay
                              setTimeout(() => completeChecklistItem(item.key), 500);
                            }}
                          >
                            {item.cta} →
                          </a>
                        )}
                        {!item.href && !done && (
                          <span className="mt-1.5 inline-block text-xs text-[var(--text-tertiary)]">
                            {item.cta}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={startTour}
                  className={cn(
                    "text-xs font-medium text-[var(--text-tertiary)]",
                    "hover:text-[var(--accent-primary)] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-sm"
                  )}
                >
                  Restart tour
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]",
                    "hover:text-[var(--text-secondary)] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-sm"
                  )}
                >
                  <RotateCcw size={12} />
                  Reset progress
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--bg-surface)]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)]/15">
                <Check size={24} className="text-[var(--success)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                All done!
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                You&apos;re ready to build with Computer.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
              <AlertTriangle className="h-6 w-6 text-[var(--semantic-danger)]" />
            </div>
            <DialogTitle className="text-center">Reset Onboarding?</DialogTitle>
            <DialogDescription className="text-center">
              This will reset all onboarding progress, checklist items, and tour
              state. You will see the onboarding experience again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              <X className="h-4 w-4" />
              Keep Progress
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetOnboarding();
                setConfirmOpen(false);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Yes, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
