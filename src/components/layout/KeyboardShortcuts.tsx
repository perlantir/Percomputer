"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Command,
  Search,
  HelpCircle,
  Zap,
  X,
  Home,
  Compass,
  Library,
  Settings,
  Layers,
  Plus,
  Keyboard,
  Type,
  Send,
} from "lucide-react";
import { useKeyboardShortcutsStore } from "./KeyboardShortcutsStore";
import { cn } from "@/src/lib/utils";

const isMac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
const MOD = isMac ? "⌘" : "Ctrl";

interface ShortcutDef {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutSection {
  title: string;
  icon: React.ReactNode;
  shortcuts: ShortcutDef[];
}

const sections: ShortcutSection[] = [
  {
    title: "Navigation",
    icon: <Home className="h-4 w-4" />,
    shortcuts: [
      { keys: ["?"], description: "Open keyboard shortcuts", icon: <HelpCircle className="h-3.5 w-3.5" /> },
      { keys: ["/"], description: "Search / command palette", icon: <Search className="h-3.5 w-3.5" /> },
      { keys: [MOD, "K"], description: "Command palette (alternative)", icon: <Command className="h-3.5 w-3.5" /> },
      { keys: ["Esc"], description: "Close modal / defocus input", icon: <X className="h-3.5 w-3.5" /> },
      { keys: [MOD, "←"], description: "Go back", icon: <ArrowLeft className="h-3.5 w-3.5" /> },
      { keys: ["G", "H"], description: "Go to Home", icon: <Home className="h-3.5 w-3.5" /> },
      { keys: ["G", "D"], description: "Go to Discover", icon: <Compass className="h-3.5 w-3.5" /> },
      { keys: ["G", "S"], description: "Go to Settings", icon: <Settings className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "Composer",
    icon: <Type className="h-4 w-4" />,
    shortcuts: [
      { keys: [MOD, "Enter"], description: "Submit prompt", icon: <Send className="h-3.5 w-3.5" /> },
      { keys: ["Tab"], description: "Accept autocomplete suggestion", icon: <CornerDownLeft className="h-3.5 w-3.5" /> },
      { keys: ["Shift", "Enter"], description: "Insert new line", icon: <CornerDownLeft className="h-3.5 w-3.5" /> },
      { keys: ["Esc"], description: "Cancel / close composer", icon: <X className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "Workflow",
    icon: <Layers className="h-4 w-4" />,
    shortcuts: [
      { keys: ["N"], description: "New workflow", icon: <Plus className="h-3.5 w-3.5" /> },
      { keys: ["J"], description: "Next workflow in list", icon: <ArrowDown className="h-3.5 w-3.5" /> },
      { keys: ["K"], description: "Previous workflow in list", icon: <ArrowUp className="h-3.5 w-3.5" /> },
      { keys: ["R"], description: "Re-run workflow", icon: <Zap className="h-3.5 w-3.5" /> },
      { keys: ["Space"], description: "Expand / collapse node", icon: <CornerDownLeft className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "Global",
    icon: <Zap className="h-4 w-4" />,
    shortcuts: [
      { keys: ["T"], description: "Toggle theme (if enabled)", icon: <Keyboard className="h-3.5 w-3.5" /> },
      { keys: [MOD, "/"], description: "Focus search", icon: <Search className="h-3.5 w-3.5" /> },
      { keys: [MOD, "L"], description: "Go to Library", icon: <Library className="h-3.5 w-3.5" /> },
    ],
  },
];

function KeyCap({ keyLabel }: { keyLabel: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-[24px] items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)] shadow-sm",
        keyLabel.length === 1 && "uppercase"
      )}
    >
      {keyLabel === "Command" ? "⌘" : keyLabel === "Meta" ? "⌘" : keyLabel}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
        {shortcut.icon && (
          <span className="text-[var(--text-tertiary)]">{shortcut.icon}</span>
        )}
        <span>{shortcut.description}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            <KeyCap keyLabel={key} />
            {i < shortcut.keys.length - 1 && (
              <span className="text-[var(--text-tertiary)]">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => {
    const style = window.getComputedStyle(el as HTMLElement);
    return style.display !== "none" && style.visibility !== "hidden";
  }) as HTMLElement[];
}

export function KeyboardShortcuts() {
  const { open, setOpen } = useKeyboardShortcutsStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Save previous focus and restore on close
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus close button when opening
      timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      timer = setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[var(--z-modal)]"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          {/* Overlay */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                  aria-label="Close shortcuts"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {sections.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        {section.icon}
                        {section.title}
                      </div>
                      <div className="space-y-0.5">
                        {section.shortcuts.map((shortcut, i) => (
                          <ShortcutRow key={i} shortcut={shortcut} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-6 py-3 text-xs text-[var(--text-tertiary)]">
                <p>
                  Modifier key shown as {MOD}. Shortcuts may vary based on your
                  operating system.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
