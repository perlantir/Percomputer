'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, LayoutGrid, User } from 'lucide-react';
import { cn } from "@/src/lib/utils";

const tabs = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Library', href: '/library', icon: BookOpen },
  { label: 'Spaces', href: '/spaces/engineering', icon: LayoutGrid },
  { label: 'You', href: '/settings', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/75 backdrop-blur-xl saturate-[1.4] sm:hidden"
      aria-label="Mobile navigation"
      style={{ boxShadow: '0 -1px 0 0 var(--glass-border), 0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      <ul className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
                  active
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-tertiary)]'
                )}
              >
                <tab.icon size={20} className={cn(active && 'text-[var(--accent-primary)]')} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
