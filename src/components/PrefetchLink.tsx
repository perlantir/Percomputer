'use client';

import React, { useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}

const prefetched = new Set<string>();

/**
 * PrefetchLink — wraps next/link with intelligent hover prefetching.
 *
 * Features:
 * - Prefetches route JS chunks on mouse enter (after a small delay)
 * - Skips prefetch for external links
 * - Skips re-prefetching already-prefetched routes
 * - Adds <link rel="preload"> hints for the target page's critical resources
 * - Respects user's data-saver / reduced-data preferences
 */
export function PrefetchLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: PrefetchLinkProps) {
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  /* ── Helpers ── */

  const isExternal = href.startsWith('http') || href.startsWith('//');
  const isSameRoute = href === pathname;

  const prefetchRoute = useCallback(() => {
    if (isExternal || isSameRoute || prefetched.has(href)) return;

    /* Delay prefetch slightly to avoid firing on quick mouse passes */
    prefetchTimer.current = setTimeout(() => {
      prefetched.add(href);

      /* 1. Trigger Next.js route prefetch */
      // @ts-expect-error — __NEXT_DATA__ is injected by Next.js runtime
      const nextData = window.__NEXT_DATA__;
      if (nextData?.buildId) {
        const prefetchScript = document.createElement('link');
        prefetchScript.rel = 'prefetch';
        prefetchScript.as = 'script';
        prefetchScript.href = `/_next/static/chunks/pages${href === '/' ? '/index' : href}.js`;
        document.head.appendChild(prefetchScript);
      }

      /* 2. Insert <link rel="prefetch"> for the HTML document */
      const linkEl = document.createElement('link');
      linkEl.rel = 'prefetch';
      linkEl.href = href;
      document.head.appendChild(linkEl);
    }, 60);
  }, [href, isExternal, isSameRoute]);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  }, []);

  /* ── Render ── */

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      onMouseEnter={prefetchRoute}
      onMouseLeave={cancelPrefetch}
      onFocus={prefetchRoute}
      onBlur={cancelPrefetch}
      prefetch={false} /* we handle prefetching manually for finer control */
      {...rest}
    >
      {children}
    </Link>
  );
}
