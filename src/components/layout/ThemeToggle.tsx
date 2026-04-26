"use client";

import { useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else if (resolvedTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  if (!mounted) {
    return (
      <button
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)]",
          className
        )}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const shouldReduceMotion = useReducedMotion();

  const iconMotionProps = shouldReduceMotion
    ? {
        initial: false,
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { y: 20, rotate: -90, opacity: 0 },
        exit: { y: -20, rotate: 90, opacity: 0 },
        transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] as const },
      };

  return (
    <button
      onClick={toggle}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode · T" : "Switch to dark mode · T"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={iconMotionProps.initial}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={iconMotionProps.exit}
            transition={iconMotionProps.transition}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={iconMotionProps.initial}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={iconMotionProps.exit}
            transition={iconMotionProps.transition}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
