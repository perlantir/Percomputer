'use client';

import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/src/lib/utils';

/* ─────────────────────── Types ─────────────────────── */

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  /** Spring stiffness — higher = snappier (default: 150) */
  stiffness?: number;
  /** Spring damping — higher = less oscillation (default: 15) */
  damping?: number;
  /** Mass of the spring — higher = more inertia (default: 0.1) */
  mass?: number;
  /** Scale factor on hover (default: 1.02) */
  hoverScale?: number;
  as?: 'button' | 'div' | 'a';
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

/* ─────────────────────── Component ─────────────────────── */

/**
 * MagneticButton — A button that subtly follows the cursor with a
 * spring-based magnetic pull effect.
 *
 * The button's center is attracted toward the mouse position within
 * a radius around the element. Uses Framer Motion's spring physics
 * for natural, premium-feeling motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.3,
  stiffness = 150,
  damping = 15,
  mass = 0.1,
  hoverScale = 1.02,
  as: Tag = 'button',
  onClick,
  disabled = false,
  href,
  type = 'button',
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  /* Raw motion values — fed directly by mouse move */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  /* Spring-animated transforms — smooth follow-through */
  const springConfig = { stiffness, damping, mass };
  const smoothX = useSpring(rawX, springConfig);
  const smoothY = useSpring(rawY, springConfig);

  /* Derive rotation from offset for extra organic feel */
  const rotateX = useTransform(smoothY, (v) => -v * 0.5);
  const rotateY = useTransform(smoothX, (v) => v * 0.5);

  /* Inner content counter-motion — the text/icons move slightly less
     than the container, creating a parallax depth effect */
  const innerX = useTransform(smoothX, (v) => -v * 0.2);
  const innerY = useTransform(smoothY, (v) => -v * 0.2);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || disabled) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      rawX.set(distanceX * strength);
      rawY.set(distanceY * strength);
    },
    [rawX, rawY, strength, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  const MotionTag = motion.create(Tag as React.ElementType);

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', disabled && 'opacity-50 pointer-events-none')}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 600 }}
    >
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          rotateX,
          rotateY,
        }}
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <MotionTag
          className={cn(
            'relative overflow-hidden cursor-pointer select-none',
            className
          )}
          onClick={onClick}
          disabled={disabled}
          href={href}
          type={Tag === 'button' ? type : undefined}
          aria-label={ariaLabel}
        >
          <motion.span
            className="relative z-10 inline-flex items-center justify-center gap-2"
            style={{ x: innerX, y: innerY }}
          >
            {children}
          </motion.span>
        </MotionTag>
      </motion.div>
    </motion.div>
  );
}

export default MagneticButton;
