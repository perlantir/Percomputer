"use client";

/**
 * AmbientBackground — Floating gradient orbs for the home page
 *
 * Pure CSS-driven ambient animation for optimal performance.
 * Creates a subtle, living backdrop with soft gradient orbs that
 * drift, pulse, and rotate slowly. Respects prefers-reduced-motion.
 *
 * Design notes:
 *   - Orbs use accent colors at very low opacity so they harmonize
 *     with both light (paper) and dark (slate) themes.
 *   - Each orb has a unique drift path, scale pulse, and rotation
 *     to create organic, non-repetitive movement.
 *   - A fine noise texture overlay adds tactile depth.
 *   - blur() ensures edges are soft and never harsh.
 */

import React from "react";

interface OrbConfig {
  /** Background gradient string */
  gradient: string;
  /** Initial size in pixels (orb scales via animation) */
  size: number;
  /** Horizontal position percentage */
  x: string;
  /** Vertical position percentage */
  y: string;
  /** Animation duration in seconds */
  duration: number;
  /** Delay before animation starts */
  delay: number;
  /** blur() radius in pixels */
  blur: number;
  /** CSS custom property name for the drift path */
  driftVar: string;
  /** Maximum scale during pulse */
  scaleMax: number;
  /** Opacity of the orb */
  opacity: number;
}

const ORBS: OrbConfig[] = [
  // Primary accent orb — large, slow, upper-left
  {
    gradient:
      "radial-gradient(circle, rgba(32, 184, 205, 0.35) 0%, rgba(32, 184, 205, 0.08) 40%, transparent 70%)",
    size: 520,
    x: "15%",
    y: "20%",
    duration: 22,
    delay: 0,
    blur: 80,
    driftVar: "--drift-1",
    scaleMax: 1.08,
    opacity: 0.7,
  },
  // Secondary warm orb — medium, lower-right
  {
    gradient:
      "radial-gradient(circle, rgba(224, 122, 95, 0.22) 0%, rgba(244, 162, 97, 0.06) 45%, transparent 70%)",
    size: 420,
    x: "75%",
    y: "65%",
    duration: 18,
    delay: -6,
    blur: 70,
    driftVar: "--drift-2",
    scaleMax: 1.06,
    opacity: 0.6,
  },
  // Tertiary accent orb — smaller, center-bottom
  {
    gradient:
      "radial-gradient(circle, rgba(42, 157, 143, 0.2) 0%, rgba(32, 184, 205, 0.05) 40%, transparent 70%)",
    size: 360,
    x: "50%",
    y: "80%",
    duration: 25,
    delay: -12,
    blur: 90,
    driftVar: "--drift-3",
    scaleMax: 1.1,
    opacity: 0.5,
  },
  // Subtle highlight orb — very faint, upper-right
  {
    gradient:
      "radial-gradient(circle, rgba(32, 184, 205, 0.15) 0%, rgba(233, 196, 106, 0.04) 35%, transparent 65%)",
    size: 300,
    x: "85%",
    y: "15%",
    duration: 20,
    delay: -4,
    blur: 100,
    driftVar: "--drift-4",
    scaleMax: 1.12,
    opacity: 0.45,
  },
];

/**
 * Individual ambient orb with its own drift + pulse + rotation cycle.
 * Uses CSS custom properties for drift coordinates and inline styles
 * for orb-specific configuration.
 */
function AmbientOrb({
  gradient,
  size,
  x,
  y,
  duration,
  delay,
  blur,
  driftVar,
  scaleMax,
  opacity,
}: OrbConfig) {
  return (
    <div
      className="ambient-orb pointer-events-none absolute rounded-full will-change-transform"
      style={{
        background: gradient,
        width: size,
        height: size,
        left: x,
        top: y,
        filter: `blur(${blur}px)`,
        opacity,
        // Each orb gets a unique animation combining drift, scale pulse, and rotation
        animation: `${driftVar.replace("--", "drift-")} ${duration}s ease-in-out infinite alternate, orb-pulse ${duration * 0.7}s ease-in-out infinite alternate, orb-rotate ${duration * 1.3}s linear infinite`,
        animationDelay: `${delay}s, ${delay + 2}s, ${delay + 1}s`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

export function AmbientBackground() {
  return (
    <>
      {/* Ambient layer: fixed behind all content */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {ORBS.map((orb, i) => (
          <AmbientOrb key={i} {...orb} />
        ))}

        {/* Subtle noise texture overlay for tactile depth */}
        <div
          className="ambient-noise absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
      </div>

      {/* Keyframes injected via style tag (scoped to this component) */}
      <style>{`
        /* ── Drift paths ──
           Each orb drifts in a unique figure-8 / oval pattern
           to create organic, non-overlapping movement.         */

        @keyframes drift-1 {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          25%  { transform: translate(-50%, -50%) translate(30px, -20px) scale(1.03); }
          50%  { transform: translate(-50%, -50%) translate(-10px, 25px) scale(1.01); }
          75%  { transform: translate(-50%, -50%) translate(20px, 15px) scale(1.04); }
          100% { transform: translate(-50%, -50%) translate(-15px, -10px) scale(1.02); }
        }

        @keyframes drift-2 {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          25%  { transform: translate(-50%, -50%) translate(-25px, 18px) scale(1.02); }
          50%  { transform: translate(-50%, -50%) translate(15px, -22px) scale(1.04); }
          75%  { transform: translate(-50%, -50%) translate(-20px, -12px) scale(1.01); }
          100% { transform: translate(-50%, -50%) translate(10px, 20px) scale(1.03); }
        }

        @keyframes drift-3 {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          25%  { transform: translate(-50%, -50%) translate(18px, 22px) scale(1.03); }
          50%  { transform: translate(-50%, -50%) translate(-22px, -8px) scale(1.01); }
          75%  { transform: translate(-50%, -50%) translate(12px, -18px) scale(1.05); }
          100% { transform: translate(-50%, -50%) translate(-8px, 12px) scale(1.02); }
        }

        @keyframes drift-4 {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          25%  { transform: translate(-50%, -50%) translate(-18px, -15px) scale(1.02); }
          50%  { transform: translate(-50%, -50%) translate(22px, 10px) scale(1.04); }
          75%  { transform: translate(-50%, -50%) translate(-12px, 20px) scale(1.01); }
          100% { transform: translate(-50%, -50%) translate(15px, -8px) scale(1.03); }
        }

        /* ── Orb pulse ── subtle breathing effect */
        @keyframes orb-pulse {
          0%   { opacity: var(--orb-opacity-start, 0.45); }
          100% { opacity: var(--orb-opacity-end, 0.7); }
        }

        /* ── Orb rotation ── very slow rotation of the gradient itself */
        @keyframes orb-rotate {
          0%   { filter: blur(80px) hue-rotate(0deg); }
          100% { filter: blur(80px) hue-rotate(8deg); }
        }

        /* ── Reduced motion ── disable all ambient movement */
        @media (prefers-reduced-motion: reduce) {
          .ambient-orb {
            animation: none !important;
            opacity: 0.15 !important;
            transform: translate(-50%, -50%) !important;
          }
          .ambient-noise {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
