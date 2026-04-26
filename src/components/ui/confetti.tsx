"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* ── types ── */

export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle" | "triangle";
  decay: number;
  gravityScale: number;
}

export interface ConfettiOptions {
  /** Number of particles (default 150). */
  count?: number;
  /** Animation duration in ms (default 3000). */
  duration?: number;
  /** Color palette (default brand + celebration palette). */
  colors?: string[];
  /** Origin x position (0–1, default 0.5 = center). */
  originX?: number;
  /** Origin y position (0–1, default 0.4 = slightly above center). */
  originY?: number;
  /** Spread angle in degrees (default 60). */
  spread?: number;
  /** Initial velocity range (default 12–22). */
  velocityRange?: [number, number];
  /** Particle size range (default 4–10). */
  sizeRange?: [number, number];
  /** Z-index for the canvas (default 9999). */
  zIndex?: number;
}

export interface ConfettiState {
  isActive: boolean;
  fire: (options?: ConfettiOptions) => void;
}

/* ── defaults ── */

const DEFAULT_COLORS = [
  "#FFD700",
  "#FF6B35",
  "#F7931E",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#EF4444",
  "#22C55E",
];

const DEFAULT_OPTIONS: Required<ConfettiOptions> = {
  count: 150,
  duration: 3000,
  colors: DEFAULT_COLORS,
  originX: 0.5,
  originY: 0.4,
  spread: 60,
  velocityRange: [12, 22],
  sizeRange: [4, 10],
  zIndex: 9999,
};

/* ── particle factory ── */

let particleIdCounter = 0;

function createParticles(opts: Required<ConfettiOptions>): ConfettiParticle[] {
  const { count, colors, originX, originY, spread, velocityRange, sizeRange } =
    opts;
  const particles: ConfettiParticle[] = [];
  const canvasW = window.innerWidth;
  const canvasH = window.innerHeight;
  const startX = originX * canvasW;
  const startY = originY * canvasH;
  const spreadRad = (spread * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad;
    const velocity =
      velocityRange[0] + Math.random() * (velocityRange[1] - velocityRange[0]);
    const shapes: ConfettiParticle["shape"][] = ["rect", "circle", "triangle"];

    particles.push({
      id: particleIdCounter++,
      x: startX + (Math.random() - 0.5) * 40,
      y: startY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      decay: 0.003 + Math.random() * 0.005,
      gravityScale: 0.25 + Math.random() * 0.35,
    });
  }

  return particles;
}

/* ── canvas rendering ── */

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: ConfettiParticle,
  _progress: number
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = Math.max(0, p.opacity);
  ctx.fillStyle = p.color;

  switch (p.shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
      break;

    case "rect":
    default:
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      break;
  }

  ctx.restore();
}

/* ── ConfettiCanvas (internal renderer) ── */

interface ConfettiCanvasProps {
  particles: ConfettiParticle[];
  duration: number;
  zIndex: number;
  onComplete: () => void;
}

function ConfettiCanvas({
  particles,
  duration,
  zIndex,
  onComplete,
}: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>(particles);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        // Physics update
        p.vy += p.gravityScale;
        p.vx *= 0.985; // air resistance
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        // Fade near end of duration
        if (progress > 0.6) {
          p.opacity -= 0.008;
        }

        if (p.opacity <= 0 || p.y > canvas.height + 20) return false;

        drawParticle(ctx, p, progress);
        return true;
      });

      if (progress < 1 && particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [duration, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── useConfetti hook ── */

export function useConfetti(): ConfettiState {
  const [instanceKey, setInstanceKey] = useState<number>(0);
  const optionsRef = useRef<ConfettiOptions | null>(null);

  const fire = useCallback((options?: ConfettiOptions) => {
    if (typeof window === "undefined") return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    optionsRef.current = options ?? {};
    setInstanceKey((k) => k + 1);
  }, []);

  const instance = useMemo(() => {
    if (instanceKey === 0) return null;

    const opts = optionsRef.current || {};
    const merged: Required<ConfettiOptions> = {
      ...DEFAULT_OPTIONS,
      ...opts,
      colors: opts.colors ?? DEFAULT_OPTIONS.colors,
    };

    return {
      key: instanceKey,
      particles: createParticles(merged),
      duration: merged.duration,
      zIndex: merged.zIndex,
    };
  }, [instanceKey]);

  const handleComplete = useCallback(() => {
    setInstanceKey(0);
    optionsRef.current = null;
  }, []);

  return {
    isActive: instanceKey > 0,
    fire,
    // Internal: rendered via portal
    _instance: instance,
    _onComplete: handleComplete,
  } as ConfettiState & {
    _instance: { key: number; particles: ConfettiParticle[]; duration: number; zIndex: number } | null;
    _onComplete: () => void;
  };
}

/* ── ConfettiProvider (mounts the canvas portal) ── */

interface ConfettiProviderProps {
  children: React.ReactNode;
  state: ConfettiState;
}

export function ConfettiProvider({ children, state }: ConfettiProviderProps) {
  const s = state as ConfettiState & {
    _instance: { key: number; particles: ConfettiParticle[]; duration: number; zIndex: number } | null;
    _onComplete: () => void;
  };

  return (
    <>
      {children}
      {s._instance &&
        createPortal(
          <ConfettiCanvas
            key={s._instance.key}
            particles={s._instance.particles}
            duration={s._instance.duration}
            zIndex={s._instance.zIndex}
            onComplete={s._onComplete}
          />,
          document.body
        )}
    </>
  );
}

/* ── Confetti (declarative trigger component) ── */

interface ConfettiProps {
  /** When true, confetti fires once then auto-resets. */
  trigger: boolean;
  /** Options for the confetti burst. */
  options?: ConfettiOptions;
  /** Called after confetti completes and resets. */
  onComplete?: () => void;
}

export function Confetti({ trigger, options, onComplete }: ConfettiProps) {
  const confetti = useConfetti();
  const prevTriggerRef = useRef(false);

  useEffect(() => {
    if (trigger && !prevTriggerRef.current) {
      confetti.fire(options);
    }
    prevTriggerRef.current = trigger;
  }, [trigger, confetti, options]);

  return (
    <ConfettiProvider state={confetti}>
      <React.Fragment />
    </ConfettiProvider>
  );
}

/* ── QuickFireConfetti (imperative wrapper for one-off use) ── */

interface QuickFireConfettiProps extends ConfettiOptions {
  /** Children to render alongside the confetti canvas. */
  children?: React.ReactNode;
}

/**
 * Wrap children with confetti capability.
 * Uses a render-prop style to expose the fire function to children.
 *
 * Usage:
 *   <QuickFireConfetti>
 *     {({ fire }) => (
 *       <button onClick={() => fire()}>Celebrate!</button>
 *     )}
 *   </QuickFireConfetti>
 */
export function QuickFireConfetti({
  children,
  ...options
}: QuickFireConfettiProps & {
  children: ((props: { fire: () => void }) => React.ReactNode) | React.ReactNode;
}) {
  const confetti = useConfetti();

  const fire = useCallback(() => {
    confetti.fire(options);
  }, [confetti, options]);

  return (
    <ConfettiProvider state={confetti}>
      {typeof children === "function" ? children({ fire }) : children}
    </ConfettiProvider>
  );
}
