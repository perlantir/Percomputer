"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  ArrowLeft,
  Compass,
  MapPinOff,
  Sparkles,
  Command,
} from "lucide-react";

/* ── staggered container children ────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const illustrationVariants = {
  hidden: { opacity: 0, scale: 0.85, rotate: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

/* ── quick-link destinations ─────────────────────────────────── */
const quickLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Discover", href: "/discover", icon: Sparkles },
  { label: "Library", href: "/library", icon: Command },
];

/* ═══════════════════════════════════════════════════════════════
   Not Found Page
   ═══════════════════════════════════════════════════════════════ */
export default function NotFoundPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  /* Open command palette via keyboard shortcut */
  const openCommandPalette = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      })
    );
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-4 py-16 bg-[var(--bg-canvas)]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex w-full max-w-lg flex-col items-center text-center gap-6"
      >
        {/* ── Friendly illustration ───────────────────────────── */}
        <motion.div
          variants={illustrationVariants}
          animate={floatAnimation}
          className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] bg-[var(--accent-primary)]/8 border border-[var(--accent-primary)]/15 shadow-glow-sm"
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-[2rem] border border-[var(--accent-primary)]/10" />
          {/* Decorative dots */}
          <motion.span
            className="absolute top-3 right-5 h-2 w-2 rounded-full bg-[var(--accent-secondary)]/40"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute bottom-4 left-5 h-1.5 w-1.5 rounded-full bg-[var(--accent-tertiary)]/50"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          {/* Main icon */}
          <Compass
            className="h-16 w-16 text-[var(--accent-primary)]"
            strokeWidth={1.4}
          />
          {/* Orbiting spark */}
          <motion.div
            className="absolute -right-1 -top-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center" }}
          >
            <Sparkles className="h-5 w-5 text-[var(--accent-tertiary)]" strokeWidth={1.8} />
          </motion.div>
        </motion.div>

        {/* ── Error code ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <MapPinOff
              className="h-5 w-5 text-[var(--text-tertiary)]"
              strokeWidth={1.6}
            />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Error 404
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
            Page not found
          </h1>
        </motion.div>

        {/* ── Friendly message ────────────────────────────────── */}
        <motion.p
          variants={itemVariants}
          className="max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]"
        >
          The page you are looking for does not exist or has been moved.
          Try searching for something else, or head back home.
        </motion.p>

        {/* ── Search suggestion ───────────────────────────────── */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSearchSubmit}
          className="w-full max-w-sm"
        >
          <div className="group relative flex items-center">
            <Search
              className="absolute left-3.5 h-4 w-4 text-[var(--text-tertiary)] transition-colors group-focus-within:text-[var(--accent-primary)]"
              strokeWidth={1.8}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows, agents, docs..."
              className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-10 pr-20 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all focus:border-[var(--accent-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 hover:border-[var(--border-medium)]"
              aria-label="Search for workflows, agents, or documentation"
            />
            {/* Keyboard shortcut hint + submit */}
            <div className="absolute right-2 flex items-center gap-1.5">
              <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-1.5 text-[10px] font-medium text-[var(--text-tertiary)] font-mono">
                /
              </kbd>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
            Press{" "}
            <kbd className="inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-1 py-0.5 text-[10px] font-mono">
              <Command size={9} className="mr-0.5" />
              K
            </kbd>{" "}
            to open the command palette
          </p>
        </motion.form>

        {/* ── Actions ─────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-3 pt-1"
        >
          {/* Primary: Go home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-[var(--accent-primary-hover)] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] focus-visible:outline-offset-2"
          >
            <Home size={16} strokeWidth={2} />
            Go home
          </Link>

          {/* Secondary: Go back */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] focus-visible:outline-offset-2"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Go back
          </button>

          {/* Tertiary: Command palette */}
          <button
            onClick={openCommandPalette}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] focus-visible:outline-offset-2"
          >
            <Search size={16} strokeWidth={2} />
            Search
          </button>
        </motion.div>

        {/* ── Quick links ─────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
        >
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] focus-visible:outline-offset-2"
              >
                <Icon size={14} strokeWidth={1.8} />
                {link.label}
              </Link>
            );
          })}
        </motion.div>

        {/* ── Help text ───────────────────────────────────────── */}
        <motion.p
          variants={itemVariants}
          className="text-xs text-[var(--text-tertiary)] pt-2"
        >
          Need help? Visit the{" "}
          <Link
            href="/help"
            className="underline underline-offset-2 decoration-[var(--border-default)] hover:decoration-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            Help Center
          </Link>{" "}
          or{" "}
          <Link
            href="/changelog"
            className="underline underline-offset-2 decoration-[var(--border-default)] hover:decoration-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            Changelog
          </Link>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}
