"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Home,
  Compass,
  Library,
  Settings,
  Layers,
  Zap,
  Plug,
  Plus,
  ArrowRight,
  FileText,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCommandPalette } from "./CommandPaletteProvider";
import { cn } from "@/src/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  section: string;
  keywords: string[];
}

const recentWorkflows: { id: string; title: string }[] = [
  { id: "wf-1", title: "Customer churn analysis" },
  { id: "wf-2", title: "Q3 revenue forecast" },
  { id: "wf-3", title: "API schema migration" },
];

const recentConnectors: { id: string; name: string; type: string }[] = [
  { id: "conn-1", name: "Production DB", type: "postgres" },
  { id: "conn-2", name: "Analytics S3", type: "s3" },
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-transparent font-semibold text-[var(--accent-primary)]"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
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

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Store previously focused element and restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      // Return focus to trigger when closing
      const timer = setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
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

  const run = useCallback(
    (action: () => void) => {
      setOpen(false);
      setTimeout(action, 150);
    },
    [setOpen]
  );

  const items = useMemo<CommandItem[]>(() => {
    const navigateItems: CommandItem[] = [
      {
        id: "nav-home",
        label: "Home",
        icon: <Home className="h-4 w-4" />,
        action: () => run(() => router.push("/")),
        section: "Navigate",
        keywords: ["home", "dashboard", "start"],
        shortcut: "G H",
      },
      {
        id: "nav-discover",
        label: "Discover",
        icon: <Compass className="h-4 w-4" />,
        action: () => run(() => router.push("/discover")),
        section: "Navigate",
        keywords: ["discover", "explore", "browse", "templates"],
        shortcut: "G D",
      },
      {
        id: "nav-library",
        label: "Library",
        icon: <Library className="h-4 w-4" />,
        action: () => run(() => router.push("/library")),
        section: "Navigate",
        keywords: ["library", "saved", "bookmarks", "history"],
        shortcut: "G L",
      },
      {
        id: "nav-settings",
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
        action: () => run(() => router.push("/settings")),
        section: "Navigate",
        keywords: ["settings", "preferences", "config"],
        shortcut: "G S",
      },
      {
        id: "nav-connectors",
        label: "Connectors",
        icon: <Plug className="h-4 w-4" />,
        action: () => run(() => router.push("/connectors")),
        section: "Navigate",
        keywords: ["connectors", "integrations", "sources"],
        shortcut: "G C",
      },
    ];

    const workflowItems: CommandItem[] = recentWorkflows.map((wf) => ({
      id: `wf-${wf.id}`,
      label: wf.title,
      icon: <Layers className="h-4 w-4" />,
      action: () => run(() => router.push(`/w/${wf.id}`)),
      section: "Workflows",
      keywords: ["workflow", wf.title.toLowerCase()],
    }));

    const actionItems: CommandItem[] = [
      {
        id: "act-new",
        label: "New Workflow",
        icon: <Plus className="h-4 w-4" />,
        action: () => run(() => router.push("/")),
        section: "Actions",
        keywords: ["new", "create", "workflow", "start"],
        shortcut: "N",
      },
      {
        id: "act-new-space",
        label: "New Space",
        icon: <FileText className="h-4 w-4" />,
        action: () => run(() => router.push("/spaces/new")),
        section: "Actions",
        keywords: ["new", "create", "space", "project", "workspace"],
      },
      {
        id: "act-console",
        label: "Admin Console",
        icon: <TrendingUp className="h-4 w-4" />,
        action: () => run(() => router.push("/console")),
        section: "Actions",
        keywords: ["admin", "console", "dashboard", "monitoring"],
      },
    ];

    const connectorItems: CommandItem[] = recentConnectors.map((conn) => ({
      id: `conn-${conn.id}`,
      label: `${conn.name} (${conn.type})`,
      icon: <Plug className="h-4 w-4" />,
      action: () => run(() => router.push(`/connectors?highlight=${conn.id}`)),
      section: "Connectors",
      keywords: ["connector", conn.name.toLowerCase(), conn.type.toLowerCase()],
    }));

    return [...navigateItems, ...workflowItems, ...actionItems, ...connectorItems];
  }, [router, run]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    }
    return groups;
  }, [filtered]);

  const sectionOrder = ["Navigate", "Workflows", "Actions", "Connectors"];

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[var(--z-command)]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Backdrop */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px) saturate(1.2)" }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-black/35"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <div className="fixed inset-0 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong w-full max-w-[640px] overflow-hidden rounded-lg shadow-[0_16px_48px_-8px_rgba(0,0,0,0.25)]"
            >
              <Command label="Command palette" loop shouldFilter={false}>
                {/* Search input */}
                <div className="flex items-center border-b border-[var(--glass-border)] bg-[var(--bg-surface)]/[0.03] px-4">
                  <Search className="mr-3 h-5 w-5 shrink-0 text-[var(--text-tertiary)]" />
                  <Command.Input
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search commands, workflows, connectors..."
                    className="flex h-14 w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                    autoFocus
                  />
                  <kbd className="hidden rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-xs font-medium text-[var(--text-tertiary)] sm:inline-block">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
                  {filtered.length === 0 && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                      className="py-8 text-center text-sm text-[var(--text-tertiary)]"
                    >
                      No results found for &quot;{query}&quot;
                    </motion.div>
                  )}

                  {sectionOrder.map(
                    (section, sectionIndex) =>
                      grouped[section]?.length > 0 && (
                        <motion.div
                          key={section}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : {
                                  duration: 0.25,
                                  delay: sectionIndex * 0.04,
                                  ease: [0.16, 1, 0.3, 1],
                                }
                          }
                          layout
                        >
                          <Command.Group heading={section} className="mb-2">
                            <div className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                              {section}
                            </div>
                            {grouped[section].map((item, itemIndex) => (
                              <motion.div
                                key={item.id}
                                initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={
                                  shouldReduceMotion
                                    ? { duration: 0 }
                                    : {
                                        duration: 0.2,
                                        delay: sectionIndex * 0.04 + itemIndex * 0.02,
                                        ease: [0.16, 1, 0.3, 1],
                                      }
                                }
                                layout
                              >
                                <Command.Item
                                  onSelect={item.action}
                                  className={cn(
                                    "group relative flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-150",
                                    "aria-selected:bg-[var(--bg-surface-2)] aria-selected:text-[var(--text-primary)]"
                                  )}
                                >
                                  {/* Selected accent indicator */}
                                  <div
                                    className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-[var(--accent-primary)] opacity-0 scale-y-0 transition-all duration-fast ease-out group-aria-selected:opacity-100 group-aria-selected:scale-y-100"
                                    style={{ originY: 0.5 }}
                                  />
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors duration-150 group-aria-selected:bg-[var(--bg-surface-3)] group-aria-selected:text-[var(--accent-primary)]">
                                    {item.icon}
                                  </span>
                                  <span className="flex-1 truncate">
                                    <Highlight text={item.label} query={query} />
                                  </span>
                                  {item.shortcut && (
                                    <kbd className="hidden shrink-0 rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-[var(--text-tertiary)] sm:inline-block">
                                      {item.shortcut}
                                    </kbd>
                                  )}
                                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity duration-150 group-aria-selected:opacity-100" />
                                </Command.Item>
                              </motion.div>
                            ))}
                          </Command.Group>
                        </motion.div>
                      )
                  )}
                </Command.List>

                {/* Footer hint */}
                <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-4 py-2.5 text-xs text-[var(--text-tertiary)]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">↑</kbd>
                      <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">↓</kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">↵</kbd>
                      to select
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">Esc</kbd>
                    to close
                  </span>
                </div>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
