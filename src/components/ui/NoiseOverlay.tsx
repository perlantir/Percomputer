"use client";

/**
 * NoiseOverlay — Subtle grain texture for premium tactile feel
 *
 * Uses an inline SVG feTurbulence filter rendered as a fixed pseudo-element.
 * - CSS-only: zero JS overhead, no animation frames
 * - pointer-events: none: fully non-interactive
 * - Subtle opacity: adds texture without visual distraction
 * - Theme-aware: adjusts intensity per mode
 *
 * The noise is rendered via an SVG data URI background image that creates
 * a fine grain pattern across the entire canvas. This mimics the subtle
 * paper/grain texture found in premium editorial and product design.
 */

export function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="noise-overlay"
      data-testid="noise-overlay"
    />
  );
}
