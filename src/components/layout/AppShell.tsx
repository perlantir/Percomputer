'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRailStore } from "@/src/hooks/useRailStore";
import { useSmoothScroll } from "@/src/hooks/useSmoothScroll";
import { cn } from "@/src/lib/utils";
import { LeftRail } from './LeftRail';
import { MainPane } from './MainPane';
import { MobileNav } from './MobileNav';

/* ─────────────────────── Animation Tokens ─────────────────────── */

const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: EASE_OUT,
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit:    { opacity: 0, y: -8, scale: 0.995 },
};

const childVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 26 },
  },
};

/* ─────────────────────── Component ─────────────────────── */

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function AppShell({ children, header, className }: AppShellProps) {
  const { isCollapsed } = useRailStore();
  const pathname = usePathname();

  /* smooth scroll for all anchor links */
  useSmoothScroll(16);

  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  /* respect a11y motion preference */
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  /* loading pulse on every route change */
  useEffect(() => {
    setIsRouteChanging(true);
    const t = setTimeout(() => setIsRouteChanging(false), 300);
    return () => clearTimeout(t);
  }, [pathname]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: EASE_OUT };

  return (
    <div className={cn('flex min-h-screen bg-[var(--bg-canvas)]', className)}>
      {/* ── Skip to main content link ── */}
      {/* WCAG 2.2 AA: Bypass Block (2.4.1) — first focusable element, visually hidden until focused */}
      <a
        href="#main-content"
        aria-label="Skip to main content"
        className={cn(
          "fixed left-4 top-4 z-[9999]",
          "glass px-4 py-2 text-sm font-medium text-[var(--text-primary)]",
          "transform -translate-y-[150%] transition-transform duration-fast",
          "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]",
          "motion-reduce:transition-none"
        )}
      >
        Skip to main content
      </a>

      {/* ── Desktop Left Rail ── */}
      <div className="hidden sm:block">
        <LeftRail />
      </div>

      {/* ── Spacer for fixed rail ── */}
      <div
        className={cn(
          'hidden shrink-0 transition-all duration-[240ms] ease-out sm:block',
          isCollapsed ? 'w-16' : 'w-60'
        )}
        aria-hidden="true"
      />

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {header}
        <MainPane className="relative">
          {/* Loading overlay between pages */}
          <AnimatePresence>
            {isRouteChanging && (
              <motion.div
                key="page-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                className="absolute inset-0 z-40 flex items-start justify-center pt-32 bg-[var(--bg-canvas)]/50 backdrop-blur-xl saturate-[1.2] pointer-events-none"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--border-subtle)]" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-primary)] animate-spin" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-tertiary)]">
                    Loading page…
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page content with fade-in + slide-up + staggered children */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              style={{ willChange: 'transform, opacity' }}
            >
              <motion.div variants={childVariants}>
                {children}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </MainPane>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <MobileNav />
    </div>
  );
}
