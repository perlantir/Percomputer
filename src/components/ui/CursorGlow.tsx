'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/src/lib/utils';

/* ─────────────────────── Types ─────────────────────── */

type GlowMode = 'spotlight' | 'trail' | 'ring' | 'dot';

interface CursorGlowProps {
  /** Visual style of the cursor effect */
  mode?: GlowMode;
  /** Size of the glow in pixels */
  size?: number;
  /** Color of the glow (supports CSS vars) */
  color?: string;
  /** Opacity of the glow (0-1) */
  opacity?: number;
  /** Blur amount in pixels */
  blur?: number;
  /** Spring stiffness — higher = snappier follow (default: 500) */
  stiffness?: number;
  /** Spring damping — higher = less bounce (default: 28) */
  damping?: number;
  /** Enable on mobile (default: false) */
  enableOnMobile?: boolean;
  /** CSS class for the glow element */
  className?: string;
  /** Show only when hovering interactive elements */
  hoverOnly?: boolean;
}

/* ─────────────────────── Component ─────────────────────── */

/**
 * CursorGlow — A premium cursor glow effect that follows the mouse
 * with smooth spring physics.
 *
 * Modes:
 *  - spotlight: Soft radial glow that illuminates the area under the cursor
 *  - trail: A trailing dot that follows with slight delay
 *  - ring: An outline ring that follows the cursor
 *  - dot: A small accent dot that follows precisely
 *
 * @example
 * <CursorGlow mode="spotlight" size={280} opacity={0.08} />
 * <CursorGlow mode="ring" size={40} hoverOnly />
 */
export function CursorGlow({
  mode = 'spotlight',
  size = 280,
  color = 'var(--accent-primary)',
  opacity = 0.08,
  blur = 60,
  stiffness = 500,
  damping = 28,
  enableOnMobile = false,
  className,
  hoverOnly = false,
}: CursorGlowProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Mouse position motion values */
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  /* Spring-smoothed position for the glow */
  const springConfig = { stiffness, damping };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  /* Detect reduced motion preference */
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  /* Track mouse movement */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      if (hoverOnly) {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest(
          'a, button, [role="button"], input, textarea, select, [contenteditable], [data-cursor-hover]'
        );
        setIsHoveringInteractive(!!isInteractive);
      }
    },
    [mouseX, mouseY, hoverOnly]
  );

  const handleMouseEnter = useCallback(() => setIsVisible(true), []);
  const handleMouseLeave = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    /* Hide on mobile/touch devices unless explicitly enabled */
    if (!enableOnMobile && 'ontouchstart' in window) return;
    if (prefersReducedMotion) return;

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    /* Initial visibility */
    setIsVisible(true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, enableOnMobile, prefersReducedMotion]);

  /* Don't render if reduced motion is preferred or on mobile (unless enabled) */
  if (prefersReducedMotion) return null;
  if (!enableOnMobile && typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  const shouldShow = hoverOnly ? isHoveringInteractive && isVisible : isVisible;

  /* ── Spotlight Mode ── */
  if (mode === 'spotlight') {
    return (
      <div
        ref={containerRef}
        className={cn(
          'pointer-events-none fixed inset-0 z-[9998]',
          'hidden md:block' /* hide on small screens */
        )}
        aria-hidden="true"
      >
        <motion.div
          className={cn('absolute rounded-full', className)}
          style={{
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
            width: size,
            height: size,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            opacity: shouldShow ? opacity : 0,
            filter: `blur(${blur}px)`,
            willChange: 'transform, opacity',
          }}
          animate={{ opacity: shouldShow ? opacity : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    );
  }

  /* ── Trail Mode ── */
  if (mode === 'trail') {
    return (
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-[9998]',
          'hidden md:block'
        )}
        aria-hidden="true"
      >
        <motion.div
          className={cn('absolute rounded-full', className)}
          style={{
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
            width: size,
            height: size,
            backgroundColor: color,
            opacity: shouldShow ? opacity : 0,
            filter: `blur(${blur}px)`,
            willChange: 'transform, opacity',
          }}
          animate={{ opacity: shouldShow ? opacity : 0 }}
          transition={{ duration: 0.2 }}
        />
        {/* Secondary inner dot for sharper center */}
        <motion.div
          className="absolute rounded-full"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%',
            width: Math.max(size * 0.15, 4),
            height: Math.max(size * 0.15, 4),
            backgroundColor: color,
            opacity: shouldShow ? Math.min(opacity * 3, 0.6) : 0,
            willChange: 'transform',
          }}
        />
      </div>
    );
  }

  /* ── Ring Mode ── */
  if (mode === 'ring') {
    return (
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-[9998]',
          'hidden md:block'
        )}
        aria-hidden="true"
      >
        <motion.div
          className={cn('absolute rounded-full border-2', className)}
          style={{
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
            width: size,
            height: size,
            borderColor: color,
            opacity: shouldShow ? opacity * 4 : 0,
            willChange: 'transform, opacity',
          }}
          animate={{
            opacity: shouldShow ? opacity * 4 : 0,
            scale: isHoveringInteractive ? 1.15 : 1,
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </div>
    );
  }

  /* ── Dot Mode ── */
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-[9998]',
        'hidden md:block'
      )}
      aria-hidden="true"
    >
      <motion.div
        className={cn('absolute rounded-full', className)}
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: size,
          height: size,
          backgroundColor: color,
          opacity: shouldShow ? opacity : 0,
          willChange: 'transform, opacity',
        }}
        animate={{ opacity: shouldShow ? opacity : 0 }}
        transition={{ duration: 0.15 }}
      />
    </div>
  );
}

/* ─────────────────────── CursorHoverZone ─────────────────────── */

interface CursorHoverZoneProps {
  children: React.ReactNode;
  className?: string;
  /** Scale factor on hover near the zone */
  scale?: number;
}

/**
 * CursorHoverZone — A wrapper that makes its children attract the
 * cursor glow effect more strongly. Place around cards, buttons, etc.
 */
export function CursorHoverZone({
  children,
  className,
}: CursorHoverZoneProps) {
  return (
    <div className={cn('cursor-hover-zone', className)} data-cursor-hover>
      {children}
    </div>
  );
}

export default CursorGlow;
