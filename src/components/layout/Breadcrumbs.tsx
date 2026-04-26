"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ── types ── */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Render a home icon for the first item. Default true. */
  showHomeIcon?: boolean;
  /** Custom home href when first item has no href. Default "/". */
  homeHref?: string;
  className?: string;
  /** Limit visible items on mobile; truncates middle items with ellipsis. Default 3. */
  mobileVisibleCount?: number;
}

/* ── animation presets ── */

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const separatorVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.04 + 0.02,
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

/* ── sub-components ── */

function BreadcrumbLink({
  item,
  isLast,
  index,
  showHomeIcon,
  homeHref,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
  index: number;
  showHomeIcon: boolean;
  homeHref: string;
}) {
  const isFirst = index === 0;
  const href = item.href ?? (isFirst ? homeHref : undefined);
  const hasHref = !!href && !isLast;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-sm transition-colors",
        isLast
          ? "font-medium text-[var(--text-primary)] cursor-default"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-surface)]",
        isFirst && showHomeIcon && "pl-0.5"
      )}
      aria-current={isLast ? "page" : undefined}
    >
      {isFirst && showHomeIcon && (
        <Home size={14} className="shrink-0" aria-hidden="true" />
      )}
      <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">
        {item.label}
      </span>
    </span>
  );

  if (!hasHref) {
    return (
      <motion.span
        custom={index}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="inline-flex"
      >
        {content}
      </motion.span>
    );
  }

  return (
    <motion.span
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="inline-flex"
    >
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    </motion.span>
  );
}

function BreadcrumbSeparator({ index }: { index: number }) {
  return (
    <motion.span
      custom={index}
      variants={separatorVariants}
      initial="hidden"
      animate="visible"
      className="inline-flex items-center px-0.5 text-[var(--border-subtle)]"
      aria-hidden="true"
    >
      <ChevronRight size={14} className="shrink-0" />
    </motion.span>
  );
}

/* ── main component ── */

/**
 * Breadcrumbs
 *
 * Accessible breadcrumb navigation with chevron separators,
 * hover micro-interactions, staggered entrance animation,
 * and responsive truncation for long labels.
 *
 * Usage:
 *   <Breadcrumbs
 *     items={[
 *       { label: "Home", href: "/" },
 *       { label: "Settings", href: "/settings" },
 *       { label: "Profile" },          // current page, no href
 *     ]}
 *   />
 */
export function Breadcrumbs({
  items,
  showHomeIcon = true,
  homeHref = "/",
  className,
  mobileVisibleCount = 3,
}: BreadcrumbsProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Hide middle items on mobile when list exceeds threshold
  const visibleItems = useMemo(() => {
    if (items.length <= mobileVisibleCount) return items.map((item, i) => ({ ...item, index: i }));
    // Show first, ellipsis, last N-1 items
    const lastItems = items.slice(-(mobileVisibleCount - 1));
    const mapped = [
      { label: items[0].label, href: items[0].href, index: 0, isEllipsis: false },
      { label: "…", href: undefined, index: -1, isEllipsis: true },
      ...lastItems.map((item, i) => ({
        ...item,
        index: items.length - lastItems.length + i,
        isEllipsis: false,
      })),
    ];
    return mapped;
  }, [items, mobileVisibleCount]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center",
        className
      )}
    >
      <ol
        className="flex flex-wrap items-center gap-0.5"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {visibleItems.map((item, i) => {
          const isLast = i === visibleItems.length - 1;
          const position = (item.index >= 0 ? item.index : i) + 1;

          if ("isEllipsis" in item && item.isEllipsis) {
            return (
              <li key="ellipsis" className="flex items-center">
                <BreadcrumbSeparator index={i} />
                <span className="px-1 text-sm text-[var(--text-tertiary)] select-none">
                  …
                </span>
              </li>
            );
          }

          return (
            <li
              key={item.index >= 0 ? item.index : `ellipsis-${i}`}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {i > 0 && <BreadcrumbSeparator index={i} />}
              <BreadcrumbLink
                item={item}
                isLast={isLast}
                index={prefersReducedMotion ? 0 : i}
                showHomeIcon={showHomeIcon}
                homeHref={homeHref}
              />
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
