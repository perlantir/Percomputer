'use client';

import React, { useState, useCallback } from 'react';
import { PrefetchLink } from '@/src/components/PrefetchLink';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Home,
  Compass,
  LayoutGrid,
  BookOpen,
  Plug,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  User,
} from 'lucide-react';
import { useRailStore } from "@/src/hooks/useRailStore";
import { cn } from "@/src/lib/utils";

const isMac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
const MOD = isMac ? "⌘" : "Ctrl";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home, shortcut: 'G H' },
  { label: 'Discover', href: '/discover', icon: Compass, shortcut: 'G D' },
  { label: 'Library', href: '/library', icon: BookOpen, shortcut: `${MOD} L` },
  { label: 'Connectors', href: '/connectors', icon: Plug },
  { label: 'Examples', href: '/examples', icon: Sparkles, shortcut: 'G E' },
];

const spaceItems = [
  { label: 'Engineering', href: '/spaces/engineering' },
  { label: 'Product', href: '/spaces/product' },
  { label: 'Design', href: '/spaces/design' },
];

function Tooltip({ children, content, shortcut, show }: { children: React.ReactNode; content: string; shortcut?: string; show: boolean }) {
  if (!show) return <>{children}</>;
  return (
    <div className="group/tooltip relative flex items-center justify-center">
      {children}
      <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md glass-subtle px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 transition-all duration-fast group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 -translate-x-1">
        <div className="flex items-center gap-2">
          <span>{content}</span>
          {shortcut && (
            <kbd className="inline-flex items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-1 py-0 text-[10px] font-semibold text-[var(--text-tertiary)]">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeftRail() {
  const { isCollapsed, toggle } = useRailStore();
  const pathname = usePathname();
  const [spacesOpen, setSpacesOpen] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const isSpaceActive = useCallback(() => {
    return pathname.startsWith('/spaces/');
  }, [pathname]);
  const shouldReduceMotion = useReducedMotion();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-[240ms] ease-out',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <PrefetchLink
          href="/"
          className={cn(
            'flex items-center gap-3 text-[var(--text-primary)]',
            isCollapsed && 'justify-center'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)] transition-transform duration-fast hover:scale-105">
            <span className="text-sm font-bold text-[var(--text-inverse)]">M</span>
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                className="text-sm font-semibold tracking-tight whitespace-nowrap"
              >
                MultiModel
              </motion.span>
            )}
          </AnimatePresence>
        </PrefetchLink>
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 h-px bg-[var(--border-subtle)]" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Tooltip content={item.label} shortcut={item.shortcut} show={isCollapsed}>
                  <PrefetchLink
                    href={item.href}
                    className={cn(
                      'group/nav relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[var(--accent-primary)]/8 text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                      isCollapsed && 'justify-center px-2'
                    )}
                  >
                    {/* Active glow backdrop */}
                    {active && (
                      <span className="absolute inset-0 rounded-md bg-[var(--accent-primary)]/5 shadow-[0_0_12px_rgba(var(--accent-primary-rgb,59,130,246),0.12)]" />
                    )}
                    {/* Hover slide-in indicator */}
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-out',
                        active ? 'opacity-100' : 'opacity-0 -translate-x-full group-hover/nav:translate-x-0 group-hover/nav:opacity-100'
                      )}
                    />
                    <item.icon
                      size={18}
                      className={cn(
                        'relative z-10 shrink-0 transition-transform duration-fast group-hover/nav:scale-110',
                        active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)] group-hover/nav:text-[var(--text-secondary)]'
                      )}
                    />
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          key={`label-${item.label}`}
                          initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                          className="relative z-10 whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </PrefetchLink>
                </Tooltip>
              </li>
            );
          })}

          {/* Spaces Dropdown */}
          <li>
            <Tooltip content="Spaces" show={isCollapsed}>
              <button
                onClick={() => !isCollapsed && setSpacesOpen(!spacesOpen)}
                className={cn(
                  'group/nav relative flex w-full items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isSpaceActive()
                    ? 'bg-[var(--accent-primary)]/8 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                  isCollapsed && 'justify-center px-2 cursor-default'
                )}
                aria-expanded={spacesOpen}
              >
                {/* Active glow backdrop */}
                {isSpaceActive() && (
                  <span className="absolute inset-0 rounded-md bg-[var(--accent-primary)]/5 shadow-[0_0_12px_rgba(var(--accent-primary-rgb,59,130,246),0.12)]" />
                )}
                {/* Hover slide-in indicator */}
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-out',
                    isSpaceActive() ? 'opacity-100' : 'opacity-0 -translate-x-full group-hover/nav:translate-x-0 group-hover/nav:opacity-100'
                  )}
                />
                <LayoutGrid
                  size={18}
                  className={cn(
                    'relative z-10 shrink-0 transition-transform duration-fast group-hover/nav:scale-110',
                    isSpaceActive()
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-tertiary)] group-hover/nav:text-[var(--text-secondary)]'
                  )}
                />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      key="spaces-label"
                      initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                      className="relative z-10 flex-1 text-left whitespace-nowrap"
                    >
                      Spaces
                    </motion.span>
                  )}
                </AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    animate={{ rotate: spacesOpen ? 180 : 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeInOut' }}
                  >
                    <ChevronDown
                      size={14}
                      className="relative z-10 shrink-0 text-[var(--text-tertiary)]"
                    />
                  </motion.div>
                )}
              </button>
            </Tooltip>

            {/* Spaces Submenu */}
            <AnimatePresence initial={false}>
              {!isCollapsed && spacesOpen && (
                <motion.ul
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
                  className="mt-1 space-y-0.5 pl-4 overflow-hidden"
                >
                  {spaceItems.map((space) => {
                    const active = pathname === space.href;
                    return (
                      <li key={space.href}>
                        <PrefetchLink
                          href={space.href}
                          className={cn(
                            'group/space relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                            active
                              ? 'text-[var(--accent-primary)]'
                              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'
                          )}
                        >
                          {/* Space hover indicator */}
                          <span
                            className={cn(
                              'absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-out',
                              active ? 'opacity-100 scale-125' : 'opacity-0 scale-0 group-hover/space:scale-100 group-hover/space:opacity-100'
                            )}
                          />
                          <span className={cn(
                            'h-1.5 w-1.5 rounded-full bg-current transition-all duration-fast',
                            active && 'ring-2 ring-[var(--accent-primary)]/30'
                          )} />
                          <span className="relative z-10">{space.label}</span>
                        </PrefetchLink>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-4 my-2 h-px bg-[var(--border-subtle)]" />

      {/* Bottom Section: Credits + User */}
      <div className="px-2 pb-3">
        {/* Credit Display */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-tertiary)]',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? '8,420 / 10,000 credits' : undefined}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {!shouldReduceMotion && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
                className="whitespace-nowrap"
              >
                8,420 / 10,000
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Link */}
        <Tooltip content="Settings" shortcut="G S" show={isCollapsed}>
          <PrefetchLink
            href="/settings"
            className={cn(
              'group/nav relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive('/settings')
                ? 'bg-[var(--accent-primary)]/8 text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {isActive('/settings') && (
              <span className="absolute inset-0 rounded-md bg-[var(--accent-primary)]/5 shadow-[0_0_12px_rgba(var(--accent-primary-rgb,59,130,246),0.12)]" />
            )}
            <span
              className={cn(
                'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-out',
                isActive('/settings') ? 'opacity-100' : 'opacity-0 -translate-x-full group-hover/nav:translate-x-0 group-hover/nav:opacity-100'
              )}
            />
            <Settings
              size={18}
              className={cn(
                'relative z-10 shrink-0 transition-transform duration-fast group-hover/nav:scale-110',
                isActive('/settings')
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)] group-hover/nav:text-[var(--text-secondary)]'
              )}
            />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                  className="relative z-10 whitespace-nowrap"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </PrefetchLink>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip content="Operator Console" show={isCollapsed}>
          <PrefetchLink
            href="/console"
            className={cn(
              'group/nav relative mt-1 flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive('/console')
                ? 'bg-[var(--accent-primary)]/8 text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {isActive('/console') && (
              <span className="absolute inset-0 rounded-md bg-[var(--accent-primary)]/5 shadow-[0_0_12px_rgba(var(--accent-primary-rgb,59,130,246),0.12)]" />
            )}
            <span
              className={cn(
                'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-out',
                isActive('/console') ? 'opacity-100' : 'opacity-0 -translate-x-full group-hover/nav:translate-x-0 group-hover/nav:opacity-100'
              )}
            />
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-transform duration-fast group-hover/nav:scale-110">
              <User size={14} />
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                  className="relative z-10 flex flex-col whitespace-nowrap"
                >
                  <span className="text-sm">Alex Chen</span>
                  <span className="text-xs text-[var(--text-tertiary)]">Operator</span>
                </motion.div>
              )}
            </AnimatePresence>
          </PrefetchLink>
        </Tooltip>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggle}
        className={cn(
          'group/toggle relative flex h-10 items-center overflow-hidden border-t border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]',
          isCollapsed ? 'justify-center' : 'justify-end px-4'
        )}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="absolute inset-y-0 left-0 w-0 bg-[var(--accent-primary)]/8 transition-all duration-300 ease-out group-hover/toggle:w-full" />
        <motion.div
          className="relative z-10"
          initial={false}
          animate={{ rotate: isCollapsed ? 0 : 0 }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </motion.div>
      </button>
    </aside>
  );
}
