"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "cmdk";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/src/components/ui/accordion";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  Search,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Zap,
  Keyboard,
  HelpCircle,
  FileText,
  Layers,
  Plug,
  Settings,
  Compass,
  Library,
  Home,
  TrendingUp,
  Send,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";
import { FAQ_ITEMS } from "@/src/data/help-faq";

/* ─────────────────────────── Data ─────────────────────────── */

const CATEGORIES = [
  { id: "getting-started", label: "Getting Started", icon: Zap },
  { id: "workflows", label: "Workflows", icon: Layers },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "contact", label: "Contact Support", icon: MessageSquare },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const GETTING_STARTED_STEPS = [
  {
    number: "01",
    title: "Write your objective",
    description:
      "Start on the Home page and describe what you want to accomplish in natural language. The more specific, the better the results.",
    icon: FileText,
    tips: ["Be specific about the output format you want", "Mention constraints or requirements", "Include context about your data sources"],
  },
  {
    number: "02",
    title: "Review the task plan",
    description:
      "The platform decomposes your objective into a directed acyclic graph (DAG) of subtasks. Review and amend the plan before execution.",
    icon: Layers,
    tips: ["Check that all necessary steps are included", "Reorder tasks if needed", "Add clarifications for ambiguous requirements"],
  },
  {
    number: "03",
    title: "Watch it execute",
    description:
      "Tasks execute in parallel where possible. Monitor progress in real-time, view intermediate results, and cancel or amend at any time.",
    icon: Zap,
    tips: ["Watch the DAG visualization for progress", "Check intermediate outputs for quality", "Use the live activity rail for status"],
  },
  {
    number: "04",
    title: "Export & iterate",
    description:
      "Review the final answer with citations. Export artifacts, share results, or fork the workflow to iterate on your solution.",
    icon: TrendingUp,
    tips: ["Check all citations for accuracy", "Export in your preferred format", "Save successful workflows as templates"],
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ["Cmd", "K"], action: "Open command palette", global: true },
  { keys: ["?"], action: "Show keyboard shortcuts", global: true },
  { keys: ["N"], action: "New workflow", global: true },
  { keys: ["G", "H"], action: "Go to Home", global: true },
  { keys: ["G", "D"], action: "Go to Discover", global: true },
  { keys: ["G", "L"], action: "Go to Library", global: true },
  { keys: ["G", "S"], action: "Go to Settings", global: true },
  { keys: ["G", "C"], action: "Go to Connectors", global: true },
  { keys: ["Esc"], action: "Close modal / Cancel", global: false },
  { keys: ["Enter"], action: "Submit / Confirm", global: false },
  { keys: ["↑", "↓"], action: "Navigate items", global: false },
  { keys: ["Cmd", "Enter"], action: "Run workflow", global: false },
  { keys: ["Cmd", "."], action: "Toggle theme", global: true },
  { keys: ["/"], action: "Focus search", global: true },
];

const SEARCH_ITEMS = [
  ...FAQ_ITEMS.map((item, i) => ({
    id: `faq-${i}`,
    label: item.question,
    category: "FAQ",
    keywords: [item.question.toLowerCase(), item.category, "faq", "question"],
  })),
  ...GETTING_STARTED_STEPS.map((step, i) => ({
    id: `step-${i}`,
    label: `${step.number}: ${step.title}`,
    category: "Getting Started",
    keywords: [step.title.toLowerCase(), "getting started", "guide", "tutorial"],
  })),
  {
    id: "nav-home",
    label: "Home Page",
    category: "Navigation",
    keywords: ["home", "dashboard", "start"],
  },
  {
    id: "nav-discover",
    label: "Discover Templates",
    category: "Navigation",
    keywords: ["discover", "templates", "browse", "explore"],
  },
  {
    id: "nav-library",
    label: "Workflow Library",
    category: "Navigation",
    keywords: ["library", "workflows", "history", "saved"],
  },
  {
    id: "nav-settings",
    label: "Settings",
    category: "Navigation",
    keywords: ["settings", "preferences", "config", "account"],
  },
  {
    id: "nav-connectors",
    label: "Connectors",
    category: "Navigation",
    keywords: ["connectors", "integrations", "sources", "data"],
  },
  {
    id: "help-shortcuts",
    label: "Keyboard Shortcuts Reference",
    category: "Help",
    keywords: ["keyboard", "shortcuts", "hotkeys", "commands"],
  },
  {
    id: "help-contact",
    label: "Contact Support",
    category: "Help",
    keywords: ["support", "contact", "help", "issue", "bug"],
  },
  {
    id: "help-models",
    label: "Supported AI Models",
    category: "Help",
    keywords: ["models", "ai", "llm", "gpt", "claude", "gemini"],
  },
  {
    id: "help-spaces",
    label: "Working with Spaces",
    category: "Help",
    keywords: ["spaces", "projects", "organizations", "team"],
  },
];

/* ─────────────────────── Search Component ─────────────────────── */

function HelpSearch({
  onSelectCategory,
}: {
  onSelectCategory: (id: CategoryId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const toggleOpen = useCallback(() => setOpen((v) => !v), []);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS;
    const q = query.toLowerCase();
    return SEARCH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof SEARCH_ITEMS> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const handleSelect = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      if (id.startsWith("faq-")) {
        onSelectCategory("faq");
      } else if (id.startsWith("step-")) {
        onSelectCategory("getting-started");
      } else if (id === "nav-home") {
        router.push("/");
      } else if (id === "nav-discover") {
        router.push("/discover");
      } else if (id === "nav-library") {
        router.push("/library");
      } else if (id === "nav-settings") {
        router.push("/settings");
      } else if (id === "nav-connectors") {
        router.push("/connectors");
      } else if (id === "help-shortcuts") {
        onSelectCategory("shortcuts");
      } else if (id === "help-contact") {
        onSelectCategory("contact");
      } else if (id === "help-models" || id === "help-spaces") {
        onSelectCategory("faq");
      }
    },
    [router, onSelectCategory]
  );

  return (
    <>
      {/* Search Trigger Bar */}
      <button
        onClick={toggleOpen}
        className={cn(
          "group flex w-full max-w-2xl items-center gap-3 rounded-lg border border-[var(--border-subtle)]",
          "bg-[var(--bg-surface)] px-4 py-3 text-left shadow-sm transition-all duration-fast ease-out",
          "hover:border-[var(--border-default)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
        <span className="flex-1 text-sm text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
          Search help articles, FAQ, guides...
        </span>
        <kbd className="hidden rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 py-0.5 text-xs font-medium text-[var(--text-tertiary)] sm:inline-block">
          Cmd K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[var(--z-command)]"
            role="dialog"
            aria-modal="true"
            aria-label="Help search"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />

            {/* Palette */}
            <div className="fixed inset-0 flex items-start justify-center pt-[15vh] px-4">
              <motion.div
                initial={{ opacity: 0, y: -24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[640px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.25)]"
              >
                <Command label="Help search" loop shouldFilter={false}>
                  {/* Search input */}
                  <div className="flex items-center border-b border-[var(--border-subtle)] px-4">
                    <Search className="mr-3 h-5 w-5 shrink-0 text-[var(--text-tertiary)]" />
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Search help articles, FAQ, guides..."
                      className="flex h-14 w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                      autoFocus
                    />
                    <button
                      onClick={() => setOpen(false)}
                      className="ml-2 rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Results */}
                  <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
                    {filtered.length === 0 && (
                      <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
                        No results found for &quot;{query}&quot;
                      </div>
                    )}

                    {Object.entries(grouped).map(([category, items]) => (
                      <Command.Group
                        key={category}
                        heading={category}
                        className="mb-2"
                      >
                        <div className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                          {category}
                        </div>
                        {items.map((item) => (
                          <Command.Item
                            key={item.id}
                            onSelect={() => handleSelect(item.id)}
                            className={cn(
                              "group relative flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-sm",
                              "text-[var(--text-primary)] transition-colors duration-150",
                              "aria-selected:bg-[var(--bg-surface-2)] aria-selected:text-[var(--text-primary)]"
                            )}
                          >
                            <div className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-[var(--accent-primary)] opacity-0 scale-y-0 transition-all duration-200 ease-out group-aria-selected:opacity-100 group-aria-selected:scale-y-100" />
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors group-aria-selected:bg-[var(--bg-surface-3)] group-aria-selected:text-[var(--accent-primary)]">
                              {category === "FAQ" ? (
                                <HelpCircle className="h-4 w-4" />
                              ) : category === "Getting Started" ? (
                                <Zap className="h-4 w-4" />
                              ) : category === "Navigation" ? (
                                <Compass className="h-4 w-4" />
                              ) : (
                                <BookOpen className="h-4 w-4" />
                              )}
                            </span>
                            <span className="flex-1 truncate">{item.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-aria-selected:opacity-100" />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ))}
                  </Command.List>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5 text-xs text-[var(--text-tertiary)]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">
                          ↑
                        </kbd>
                        <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">
                          ↓
                        </kbd>
                        to navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">
                          ↵
                        </kbd>
                        to select
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px]">
                        Esc
                      </kbd>
                      to close
                    </span>
                  </div>
                </Command>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────── Category Navigation ─────────────────── */

function CategoryNav({
  active,
  onSelect,
}: {
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Help categories"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-fast ease-out",
              isActive
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            aria-current={isActive ? "true" : undefined}
          >
            {isActive && (
              <motion.span
                layoutId="help-category-pill"
                className="absolute inset-0 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─────────────────── Getting Started Section ─────────────────── */

function GettingStartedSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Getting Started
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Follow these steps to create your first AI-powered workflow
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GETTING_STARTED_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Card variant="elevated" className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-2)]">
                      <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                          {step.number}
                        </span>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        {step.description}
                      </p>
                      <ul className="space-y-1">
                        {step.tips.map((tip) => (
                          <li
                            key={tip}
                            className="flex items-start gap-1.5 text-xs text-[var(--text-tertiary)]"
                          >
                            <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent-primary)]" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────── FAQ Section ─────────────────── */

function FAQSection({ searchQuery }: { searchQuery?: string }) {
  const filteredFaqs = useMemo(() => {
    if (!searchQuery?.trim()) return FAQ_ITEMS;
    const q = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(filteredFaqs.map((f) => f.category));
    return Array.from(cats);
  }, [filteredFaqs]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Quick answers to common questions
        </p>
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <HelpCircle className="h-8 w-8 text-[var(--text-tertiary)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            No matching questions found
          </p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-2">
            <Badge variant="default" className="mb-2 text-xs capitalize">
              {category}
            </Badge>
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs
                .filter((f) => f.category === category)
                .map((item, i) => (
                  <AccordionItem key={`${category}-${i}`} value={`${category}-${i}`}>
                    <AccordionTrigger className="text-sm text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────── Shortcuts Section ─────────────────── */

function ShortcutsSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Keyboard Shortcuts
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Speed up your workflow with these keyboard commands
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Global Shortcuts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--accent-primary)]" />
              Global Shortcuts
            </CardTitle>
            <CardDescription>Work across the entire app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {KEYBOARD_SHORTCUTS.filter((s) => s.global).map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {shortcut.action}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={key}>
                      <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 text-xs font-medium text-[var(--text-primary)]">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-[var(--text-tertiary)] text-xs mx-0.5">
                          +
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Context Shortcuts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--accent-secondary)]" />
              Context Shortcuts
            </CardTitle>
            <CardDescription>Available in specific contexts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {KEYBOARD_SHORTCUTS.filter((s) => !s.global).map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {shortcut.action}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={key}>
                      <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1.5 text-xs font-medium text-[var(--text-primary)]">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-[var(--text-tertiary)] text-xs mx-0.5">
                          +
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────── Contact Support Section ─────────────────── */

function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Missing fields", "Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
    toast.success("Message sent", "We'll get back to you within 24 hours.");
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10">
              <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">
              Message sent!
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[var(--text-secondary)]">
              Thank you for reaching out. Our support team will get back to you
              within 24 hours.
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: "",
                  email: "",
                  category: "general",
                  subject: "",
                  message: "",
                });
              }}
            >
              Send another message
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Contact Support
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Need help? Send us a message and we&apos;ll respond within 24 hours.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>
              <Input
                label="Subject"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, subject: e.target.value }))
                }
              />
              <div className="space-y-1.5">
                <label
                  htmlFor="support-message"
                  className="text-sm font-medium text-[var(--text-primary)]"
                >
                  Message
                </label>
                <Textarea
                  id="support-message"
                  placeholder="Describe your issue or question in detail..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, message: e.target.value }))
                  }
                  rows={5}
                  required
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-[var(--text-tertiary)]">
                  We typically respond within 24 hours.
                </p>
                <Button
                  type="submit"
                  className="gap-2 transition-transform active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </motion.div>

      {/* Alternative contact methods */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg">
        {[
          {
            icon: BookOpen,
            title: "Documentation",
            desc: "Browse detailed guides",
            action: () => toast.info("Coming soon", "Documentation site launching soon."),
          },
          {
            icon: MessageSquare,
            title: "Community",
            desc: "Join our Discord",
            action: () => toast.info("Coming soon", "Community Discord launching soon."),
          },
          {
            icon: FileText,
            title: "Status Page",
            desc: "Check system status",
            action: () => toast.info("Coming soon", "Status page launching soon."),
          },
        ].map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.title}
              onClick={method.action}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border border-[var(--border-subtle)]",
                "bg-[var(--bg-surface)] p-4 text-center transition-all duration-fast ease-out",
                "hover:border-[var(--border-default)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              )}
            >
              <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {method.title}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                {method.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────── Workflows Help Section ─────────────────── */

function WorkflowsSection() {
  const router = useRouter();

  const topics = [
    {
      icon: Layers,
      title: "Creating Workflows",
      description:
        "Describe your objective and let the platform break it into actionable tasks.",
      action: () => router.push("/"),
    },
    {
      icon: Compass,
      title: "Discover Templates",
      description:
        "Browse pre-built workflow templates for common use cases and industries.",
      action: () => router.push("/discover"),
    },
    {
      icon: Library,
      title: "Managing Your Library",
      description:
        "Organize, search, and filter all your past and current workflows.",
      action: () => router.push("/library"),
    },
    {
      icon: Plug,
      title: "Data Connectors",
      description:
        "Connect external data sources like databases, APIs, and cloud storage.",
      action: () => router.push("/connectors"),
    },
    {
      icon: Settings,
      title: "Model Configuration",
      description:
        "Configure model routing, API keys, and per-kind model overrides.",
      action: () => router.push("/settings?tab=models"),
    },
    {
      icon: Home,
      title: "Spaces & Organization",
      description:
        "Create spaces to organize workflows by project, team, or environment.",
      action: () => toast.info("Coming soon", "Spaces page launching soon."),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Workflows
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Everything you need to know about creating and managing workflows
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, index) => {
          const Icon = topic.icon;
          return (
            <motion.button
              key={topic.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.06,
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={topic.action}
              className={cn(
                "flex flex-col items-start gap-3 rounded-lg border border-[var(--border-subtle)]",
                "bg-[var(--bg-surface)] p-5 text-left transition-all duration-fast ease-out",
                "hover:border-[var(--border-default)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-2)]">
                <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {topic.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {topic.description}
                </p>
              </div>
              <ArrowRight className="mt-auto h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)]" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────── Section Router ─────────────────── */

function SectionContent({
  category,
  searchQuery,
}: {
  category: CategoryId;
  searchQuery?: string;
}) {
  switch (category) {
    case "getting-started":
      return <GettingStartedSection />;
    case "workflows":
      return <WorkflowsSection />;
    case "faq":
      return <FAQSection searchQuery={searchQuery} />;
    case "shortcuts":
      return <ShortcutsSection />;
    case "contact":
      return <ContactSection />;
    default:
      return <GettingStartedSection />;
  }
}

/* ─────────────────── Quick Links Bar ─────────────────── */

function QuickLinks() {
  const router = useRouter();

  const links = [
    { icon: Zap, label: "New Workflow", href: "/" },
    { icon: Compass, label: "Templates", href: "/discover" },
    { icon: Library, label: "Library", href: "/library" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button
            key={link.label}
            onClick={() => router.push(link.href)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)]",
              "bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]",
              "transition-all duration-fast ease-out hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────── Main Help Page ─────────────────── */

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSelect = useCallback(
    (id: CategoryId) => {
      setActiveCategory(id);
      // Small delay to let the category switch animate
      setTimeout(() => {
        const el = document.getElementById("help-content");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    []
  );

  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-canvas)] overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 35% at 50% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%)`,
        }}
      />

      {/* Hero Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Title */}
            <div className="space-y-2 text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
                How can we help?
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Search our documentation, browse FAQs, or get in touch with support
              </p>
            </div>

            {/* Search */}
            <div className="flex justify-center">
              <HelpSearch onSelectCategory={handleSearchSelect} />
            </div>

            {/* Quick Links */}
            <div className="flex justify-center">
              <QuickLinks />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-4 space-y-4">
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Topics
              </h2>
              <nav className="space-y-1" aria-label="Help topics">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast ease-out",
                        isActive
                          ? "bg-[var(--bg-surface-2)] text-[var(--accent-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]/50 hover:text-[var(--text-primary)]"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isActive
                            ? "text-[var(--accent-primary)]"
                            : "text-[var(--text-tertiary)]"
                        )}
                      />
                      {cat.label}
                      {isActive && (
                        <motion.div
                          layoutId="help-sidebar-indicator"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Mini card */}
              <Card className="mt-6 bg-[var(--bg-surface-2)]/50">
                <CardContent className="p-4 space-y-3">
                  <MessageSquare className="h-5 w-5 text-[var(--accent-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Still need help?
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      Our support team is here for you.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => setActiveCategory("contact")}
                  >
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Mobile Category Nav */}
          <div className="lg:hidden">
            <CategoryNav
              active={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>

          {/* Main Content Area */}
          <div id="help-content" className="flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <SectionContent
                  category={activeCategory}
                  searchQuery={searchQuery}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Workaround for missing Globe icon in some lucide versions ─── */
function Globe({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
