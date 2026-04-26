'use client';

import React from 'react';
import { motion, Variants, Transition } from 'framer-motion';
import { cn } from '@/src/lib/utils';

/* ─────────────────────── Animation Variants ─────────────────────── */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      mass: 0.5,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 22,
    },
  },
};

const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 22,
    },
  },
};

const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 22,
    },
  },
};

/* ─────────────────────── Preset Map ─────────────────────── */

const presetMap = {
  fadeUp: fadeUpVariants,
  fadeScale: fadeScaleVariants,
  slideInLeft: slideInLeftVariants,
  slideInRight: slideInRightVariants,
  default: itemVariants,
};

/* ─────────────────────── Types ─────────────────────── */

type AnimationPreset = keyof typeof presetMap;

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Stagger delay between children (seconds) */
  staggerDelay?: number;
  /** Whether to trigger animation on mount */
  animateOnMount?: boolean;
  /** Whether to trigger animation when scrolled into view */
  animateOnView?: boolean;
  /** Root margin for viewport trigger */
  viewportMargin?: string;
  /** Only animate once */
  once?: boolean;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  /** Animation preset to use */
  preset?: AnimationPreset;
  /** Custom animation variants */
  variants?: Variants;
}

/* ─────────────────────── StaggerContainer ─────────────────────── */

/**
 * StaggerContainer — Wraps a group of children that should animate in
 * with staggered timing. Each child should be wrapped in a StaggerItem.
 *
 * @example
 * <StaggerContainer staggerDelay={0.08}>
 *   <StaggerItem><Card /></StaggerItem>
 *   <StaggerItem><Card /></StaggerItem>
 *   <StaggerItem preset="fadeScale"><Card /></StaggerItem>
 * </StaggerContainer>
 */
export function StaggerContainer({
  children,
  className,
  delay = 0.05,
  staggerDelay = 0.06,
  animateOnMount = true,
  animateOnView = false,
  viewportMargin = '-50px',
  once = true,
}: StaggerContainerProps) {
  const transition: Transition = {
    staggerChildren: staggerDelay,
    delayChildren: delay,
  };

  const variants: Variants = {
    hidden: { opacity: animateOnMount ? 0 : undefined },
    visible: {
      opacity: 1,
      transition,
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate={animateOnMount && !animateOnView ? 'visible' : undefined}
      whileInView={animateOnView ? 'visible' : undefined}
      viewport={animateOnView ? { once, margin: viewportMargin } : undefined}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────── StaggerItem ─────────────────────── */

/**
 * StaggerItem — Individual animated item within a StaggerContainer.
 * Pick a preset or provide custom variants.
 */
export function StaggerItem({
  children,
  className,
  preset = 'default',
  variants: customVariants,
}: StaggerItemProps) {
  const variants = customVariants ?? presetMap[preset] ?? itemVariants;

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────── FadeInView ─────────────────────── */

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  preset?: AnimationPreset;
  delay?: number;
  duration?: number;
  viewportMargin?: string;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * FadeInView — A self-contained component that fades in its children
 * when scrolled into view. Uses IntersectionObserver under the hood.
 *
 * @example
 * <FadeInView preset="fadeUp" delay={0.1}>
 *   <YourContent />
 * </FadeInView>
 */
export function FadeInView({
  children,
  className,
  preset = 'fadeUp',
  delay = 0,
  duration,
  viewportMargin = '-60px',
  once = true,
}: FadeInViewProps) {
  const baseVariants = presetMap[preset] ?? fadeUpVariants;

  const variants: Variants = {
    hidden: baseVariants.hidden,
    visible: {
      ...baseVariants.visible,
      transition: {
        ...(baseVariants.visible as Record<string, unknown>)?.transition,
        delay,
        ...(duration ? { duration } : {}),
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={variants}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

export default StaggerContainer;
