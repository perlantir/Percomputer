"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ── animation presets ── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
};

const presetMap: Record<string, Variants> = {
  fadeUp,
  fadeDown,
  fadeLeft,
  fadeRight,
  scaleIn,
};

type Preset = keyof typeof presetMap;

/* ── types ── */

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  preset?: Preset;
  /** Stagger delay between items in seconds (default 0.05). */
  staggerDelay?: number;
  /** Delay before the list starts animating in seconds (default 0). */
  initialDelay?: number;
  /** Framer Motion transition overrides. */
  transition?: {
    duration?: number;
    ease?: number[];
  };
  /** Whether items should animate out when removed. */
  animateExit?: boolean;
  /** Tag for the list wrapper (default "ul"). */
  as?: "ul" | "ol" | "div";
  /** Empty state rendered when items is empty. */
  emptyState?: React.ReactNode;
}

/**
 * AnimatedList
 *
 * Renders a collection with staggered entrance animations using Framer Motion.
 * Supports exit animations when items are removed (via AnimatePresence).
 *
 * Usage:
 *   <AnimatedList
 *     items={tasks}
 *     keyExtractor={(t) => t.id}
 *     renderItem={(t, i) => <TaskRow task={t} />}
 *     preset="fadeUp"
 *     staggerDelay={0.06}
 *   />
 */
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
  preset = "fadeUp",
  staggerDelay = 0.05,
  initialDelay = 0,
  transition,
  animateExit = true,
  as: Tag = "ul",
  emptyState,
}: AnimatedListProps<T>) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const variants = presetMap[preset] ?? fadeUp;

  const container: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
      },
    },
  };

  const itemVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : variants;

  const MotionTag = motion.create(Tag as React.ElementType);

  return (
    <MotionTag
      className={cn("list-none", className)}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {items.length === 0 && emptyState ? (
          <motion.div
            key="__empty__"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={itemClassName}
          >
            {emptyState}
          </motion.div>
        ) : (
          items.map((item, index) => (
            <motion.li
              key={keyExtractor(item, index)}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={animateExit ? "exit" : undefined}
              transition={
                transition
                  ? {
                      duration: transition.duration ?? 0.35,
                      ease: transition.ease ?? [0.16, 1, 0.3, 1],
                    }
                  : undefined
              }
              layout={!prefersReducedMotion}
              className={cn("will-change-transform", itemClassName)}
            >
              {renderItem(item, index)}
            </motion.li>
          ))
        )}
      </AnimatePresence>
    </MotionTag>
  );
}

/* ── AnimatedListItem (standalone, for manual use) ── */

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  preset?: Preset;
  index?: number;
  staggerDelay?: number;
}

/**
 * Standalone list item that can be used outside of AnimatedList when
 * you need to wrap an existing component with entrance motion.
 */
export function AnimatedListItem({
  children,
  className,
  preset = "fadeUp",
  index = 0,
  staggerDelay = 0.05,
}: AnimatedListItemProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const variants = presetMap[preset] ?? fadeUp;

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      variants={prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : variants}
      initial="hidden"
      animate="visible"
      transition={
        prefersReducedMotion
          ? undefined
          : {
              delay: index * staggerDelay,
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      {children}
    </motion.div>
  );
}

/* ── FadeIn (simple wrapper for single-element entrance) ── */

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.4,
}: FadeInProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const offset =
    direction === "up"
      ? { y: 12, x: 0 }
      : direction === "down"
      ? { y: -12, x: 0 }
      : direction === "left"
      ? { y: 0, x: -16 }
      : direction === "right"
      ? { y: 0, x: 16 }
      : { y: 0, x: 0 };

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, ...offset }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
