'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Slash } from 'lucide-react';
import { cn } from "@/src/lib/utils";

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  breadcrumbs?: { label: string; href: string }[];
  statusIndicator?: React.ReactNode;
}

export function Header({
  title,
  actions,
  showBack = false,
  backHref = '/',
  breadcrumbs,
  statusIndicator,
}: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="glass-header sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          {showBack && (
            <Link
              href={backHref}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
            </Link>
          )}

          <div className="flex flex-col gap-0.5 min-w-0">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.href}>
                    {idx > 0 && (
                      <Slash size={10} className="text-[var(--border-subtle)]" />
                    )}
                    <Link
                      href={crumb.href}
                      className="truncate transition-colors hover:text-[var(--text-secondary)]"
                    >
                      {crumb.label}
                    </Link>
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Title */}
            <h1 className="truncate text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
          </div>
        </div>

        {/* Right side: actions + status */}
        <div className="flex items-center gap-3 shrink-0">
          {statusIndicator && (
            <div className="hidden sm:flex">{statusIndicator}</div>
          )}
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}
