import * as React from "react";
import { cn } from "@/src/lib/utils";

/* ── Types ── */

type SpinnerVariant = "default" | "orbit" | "pulse-ring" | "dots" | "wave";
type SpinnerSize = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the spinner */
  variant?: SpinnerVariant;
  /** Size preset */
  size?: SpinnerSize;
  /** Optional text label shown below the spinner */
  label?: string;
  /** Whether to render as a full-screen overlay */
  fullscreen?: boolean;
  /** Custom pixel size (overrides size preset) */
  pixelSize?: number;
  /** Custom color (overrides brand accent) */
  color?: string;
  /** Delay before spinner appears (ms) — prevents flash on fast loads */
  delayMs?: number;
}

/* ── Size presets (px) ── */
const sizeMap: Record<SpinnerSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

/* ── Stroke width presets ── */
const strokeMap: Record<SpinnerSize, number> = {
  sm: 2.5,
  md: 3,
  lg: 4,
  xl: 5,
};

/* ──────────────────────────────────────────────────────────────
   Default variant — animated SVG arc with brand accent
   A single circular arc that rotates smoothly with a trailing
   gradient effect created via stroke-dasharray animation.
   ────────────────────────────────────────────────────────────── */
function DefaultSpinner({
  pixelSize,
  strokeWidth,
  color,
}: {
  pixelSize: number;
  strokeWidth: number;
  color: string;
}) {
  const center = pixelSize / 2;
  const radius = (pixelSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox={`0 0 ${pixelSize} ${pixelSize}`}
      className="spinner-rotate"
      aria-hidden="true"
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-[var(--border-subtle)] opacity-40"
      />
      {/* Animated arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        className="spinner-arc"
        style={
          {
            "--circumference": circumference,
            transformOrigin: "center",
          } as React.CSSProperties
        }
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   Orbit variant — dual counter-rotating rings
   Two rings rotating in opposite directions for a dynamic,
   planetary feel. The inner ring uses the secondary accent.
   ────────────────────────────────────────────────────────────── */
function OrbitSpinner({
  pixelSize,
  strokeWidth,
  color,
}: {
  pixelSize: number;
  strokeWidth: number;
  color: string;
}) {
  const center = pixelSize / 2;
  const outerR = (pixelSize - strokeWidth) / 2;
  const innerR = outerR * 0.6;
  const outerCircumference = 2 * Math.PI * outerR;
  const innerCircumference = 2 * Math.PI * innerR;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox={`0 0 ${pixelSize} ${pixelSize}`}
      aria-hidden="true"
    >
      {/* Outer ring — rotates clockwise */}
      <g className="spinner-rotate">
        <circle
          cx={center}
          cy={center}
          r={outerR}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.75}
          className="text-[var(--border-subtle)] opacity-30"
        />
        <circle
          cx={center}
          cy={center}
          r={outerR}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 0.75}
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          className="spinner-arc"
          style={
            { "--circumference": outerCircumference } as React.CSSProperties
          }
        />
      </g>
      {/* Inner ring — rotates counter-clockwise, offset timing */}
      <g
        className="spinner-rotate-reverse"
        style={{ transformOrigin: `${center}px ${center}px` }}
      >
        <circle
          cx={center}
          cy={center}
          r={innerR}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.65}
          className="text-[var(--border-subtle)] opacity-20"
        />
        <circle
          cx={center}
          cy={center}
          r={innerR}
          fill="none"
          stroke="var(--accent-secondary)"
          strokeWidth={strokeWidth * 0.65}
          strokeLinecap="round"
          strokeDasharray={innerCircumference}
          className="spinner-arc-reverse"
          style={
            { "--circumference": innerCircumference } as React.CSSProperties
          }
        />
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   Pulse-ring variant — expanding/contracting ring with glow
   A single ring that pulses in scale and opacity, creating a
   "radar" or "sonar" effect. Uses the accent glow shadow.
   ────────────────────────────────────────────────────────────── */
function PulseRingSpinner({
  pixelSize,
  color,
}: {
  pixelSize: number;
  color: string;
}) {
  return (
    <div
      className="relative"
      style={{ width: pixelSize, height: pixelSize }}
      aria-hidden="true"
    >
      {/* Static center dot */}
      <div
        className="absolute inset-0 m-auto rounded-full"
        style={{
          width: pixelSize * 0.18,
          height: pixelSize * 0.18,
          backgroundColor: color,
        }}
      />
      {/* Pulsing ring 1 */}
      <div
        className="absolute inset-0 rounded-full border-2 spinner-pulse-ring"
        style={{
          borderColor: color,
          boxShadow: `0 0 ${pixelSize * 0.25}px rgba(var(--accent-primary-rgb), 0.25)`,
        }}
      />
      {/* Pulsing ring 2 — offset delay */}
      <div
        className="absolute inset-0 rounded-full border-2 spinner-pulse-ring spinner-pulse-ring-delay"
        style={{
          borderColor: color,
          opacity: 0.5,
          boxShadow: `0 0 ${pixelSize * 0.18}px rgba(var(--accent-primary-rgb), 0.15)`,
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Dots variant — three bouncing dots
   Classic three-dot loading indicator with staggered bounce
   animation. Each dot uses a brand accent color.
   ────────────────────────────────────────────────────────────── */
function DotsSpinner({
  pixelSize,
  color,
}: {
  pixelSize: number;
  color: string;
}) {
  const dotSize = pixelSize * 0.22;
  const gap = pixelSize * 0.08;

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: pixelSize,
        height: pixelSize,
        gap,
      }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full spinner-bounce-dot spinner-bounce-dot-${i + 1}`}
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Wave variant — vertical bars with staggered height animation
   Five vertical bars that animate in a wave pattern. Creates a
   more organic, audio-visualizer feel.
   ────────────────────────────────────────────────────────────── */
function WaveSpinner({
  pixelSize,
  color,
}: {
  pixelSize: number;
  color: string;
}) {
  const barWidth = Math.max(3, pixelSize * 0.1);
  const gap = pixelSize * 0.06;

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: pixelSize,
        height: pixelSize,
        gap,
      }}
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`rounded-full spinner-wave-bar spinner-wave-bar-${i + 1}`}
          style={{
            width: barWidth,
            height: "100%",
            backgroundColor: color,
            opacity: 0.8 + i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main LoadingSpinner component
   ────────────────────────────────────────────────────────────── */

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      variant = "default",
      size = "md",
      label,
      fullscreen = false,
      pixelSize: customPixelSize,
      color: customColor,
      delayMs = 0,
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(delayMs === 0);

    /* Delayed appearance — prevents flash on fast loads */
    React.useEffect(() => {
      if (delayMs <= 0) return;
      const timer = setTimeout(() => setVisible(true), delayMs);
      return () => clearTimeout(timer);
    }, [delayMs]);

    const pixelSize = customPixelSize ?? sizeMap[size];
    const strokeWidth = strokeMap[size];
    const color = customColor ?? "var(--accent-primary)";

    const spinnerContent = (
      <div
        ref={ref}
        className={cn(
          "inline-flex flex-col items-center justify-center gap-3",
          !visible && "opacity-0",
          visible && "anim-fade-in",
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
        {...props}
      >
        {variant === "default" && (
          <DefaultSpinner
            pixelSize={pixelSize}
            strokeWidth={strokeWidth}
            color={color}
          />
        )}
        {variant === "orbit" && (
          <OrbitSpinner
            pixelSize={pixelSize}
            strokeWidth={strokeWidth}
            color={color}
          />
        )}
        {variant === "pulse-ring" && (
          <PulseRingSpinner pixelSize={pixelSize} color={color} />
        )}
        {variant === "dots" && (
          <DotsSpinner pixelSize={pixelSize} color={color} />
        )}
        {variant === "wave" && (
          <WaveSpinner pixelSize={pixelSize} color={color} />
        )}

        {label && (
          <span
            className={cn(
              "text-[var(--text-secondary)] font-body select-none",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base",
              size === "xl" && "text-lg"
            )}
          >
            {label}
          </span>
        )}

        {/* Screen-reader only text when no visible label */}
        {!label && (
          <span className="sr-only">Loading...</span>
        )}
      </div>
    );

    if (fullscreen) {
      return (
        <div
          className={cn(
            "fixed inset-0 z-[var(--z-modal-backdrop)] flex flex-col items-center justify-center",
            "bg-[var(--bg-canvas)]/80 backdrop-blur-sm",
            "transition-opacity duration-250",
            !visible && "opacity-0 pointer-events-none",
            visible && "opacity-100"
          )}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {spinnerContent}
        </div>
      );
    }

    return spinnerContent;
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

/* ──────────────────────────────────────────────────────────────
   Inline spinner — compact variant for buttons/forms
   A thin wrapper that renders a small default spinner with
   sensible defaults for inline usage.
   ────────────────────────────────────────────────────────────── */

interface InlineSpinnerProps
  extends Omit<LoadingSpinnerProps, "size" | "fullscreen" | "variant"> {
  size?: "sm" | "md";
}

const InlineSpinner = React.forwardRef<HTMLDivElement, InlineSpinnerProps>(
  ({ size = "sm", className, ...props }, ref) => (
    <LoadingSpinner
      ref={ref}
      variant="default"
      size={size}
      className={cn("inline-flex", className)}
      {...props}
    />
  )
);
InlineSpinner.displayName = "InlineSpinner";

/* ──────────────────────────────────────────────────────────────
   PageLoader — full-page loading state with centered spinner
   and optional message. Replaces skeleton screens for initial
   page loads where content structure is unknown.
   ────────────────────────────────────────────────────────────── */

interface PageLoaderProps {
  variant?: SpinnerVariant;
  message?: string;
  submessage?: string;
  delayMs?: number;
}

function PageLoader({
  variant = "orbit",
  message = "Loading...",
  submessage,
  delayMs = 150,
}: PageLoaderProps) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6 px-4">
      <LoadingSpinner
        variant={variant}
        size="lg"
        delayMs={delayMs}
      />
      <div className="flex flex-col items-center gap-1 text-center">
        {message && (
          <p className="text-base font-medium text-[var(--text-primary)]">
            {message}
          </p>
        )}
        {submessage && (
          <p className="text-sm text-[var(--text-tertiary)]">{submessage}</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SectionLoader — inline section-level loading state
   For card contents, table data, or widget placeholders.
   ────────────────────────────────────────────────────────────── */

interface SectionLoaderProps {
  variant?: SpinnerVariant;
  message?: string;
  className?: string;
  minHeight?: string;
  delayMs?: number;
}

function SectionLoader({
  variant = "default",
  message,
  className,
  minHeight = "200px",
  delayMs = 100,
}: SectionLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg",
        "border border-[var(--border-subtle)] bg-[var(--bg-surface)]",
        className
      )}
      style={{ minHeight }}
    >
      <LoadingSpinner
        variant={variant}
        size="md"
        label={message}
        delayMs={delayMs}
      />
    </div>
  );
}

export {
  LoadingSpinner,
  InlineSpinner,
  PageLoader,
  SectionLoader,
};
export type { LoadingSpinnerProps, InlineSpinnerProps, PageLoaderProps, SectionLoaderProps };
