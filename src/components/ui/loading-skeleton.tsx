"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Skeleton, SkeletonText } from "@/src/components/ui/skeleton";

/* ────────────────────────── Shimmer Skeleton ────────────────────────── */

/** Enhanced Skeleton with a sweeping shimmer gradient. */
function ShimmerSkeleton({
  className,
  style,
  delayMs = 0,
}: {
  className?: string;
  style?: React.CSSProperties;
  delayMs?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-md shimmer-bg animate-shimmer",
        className
      )}
      style={{
        animationDelay: `${delayMs}ms`,
        ...style,
      }}
    />
  );
}

/* ────────────────────────── Card Skeleton ────────────────────────── */

interface CardSkeletonProps {
  rows?: number;
  className?: string;
  shimmer?: boolean;
  delayMs?: number;
}

export function CardSkeleton({
  rows = 3,
  className,
  shimmer = true,
  delayMs = 0,
}: CardSkeletonProps) {
  const Bone = shimmer ? ShimmerSkeleton : Skeleton;
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 anim-fade-in",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Bone className="h-10 w-10 rounded-md" delayMs={delayMs} />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-2/3" delayMs={delayMs + 30} />
          <Bone className="h-3 w-1/2" delayMs={delayMs + 60} />
        </div>
      </div>
      <SkeletonText
        lines={rows}
        lineHeight="h-3"
        lastLineWidth="w-3/4"
        shimmer={shimmer}
      />
    </div>
  );
}

/* ────────────────────────── List Skeleton ────────────────────────── */

interface ListSkeletonProps {
  items?: number;
  className?: string;
  shimmer?: boolean;
  staggerDelay?: number;
}

export function ListSkeleton({
  items = 5,
  className,
  shimmer = true,
  staggerDelay = 60,
}: ListSkeletonProps) {
  const Bone = shimmer ? ShimmerSkeleton : Skeleton;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 anim-fade-in"
          style={{ animationDelay: `${i * staggerDelay}ms` }}
        >
          <Bone className="h-8 w-8 rounded-md" delayMs={i * staggerDelay} />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-1/3" delayMs={i * staggerDelay + 20} />
            <Bone className="h-3 w-1/4" delayMs={i * staggerDelay + 40} />
          </div>
          <Bone className="h-8 w-20 rounded-md" delayMs={i * staggerDelay + 60} />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────── Table Skeleton ────────────────────────── */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  shimmer?: boolean;
  staggerDelay?: number;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  shimmer = true,
  staggerDelay = 50,
}: TableSkeletonProps) {
  const Bone = shimmer ? ShimmerSkeleton : Skeleton;
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50 px-4 py-3 anim-fade-in">
        {Array.from({ length: columns }).map((_, i) => (
          <Bone
            key={`h-${i}`}
            className={cn("h-3", i === 0 ? "w-1/3" : "w-20")}
            delayMs={i * 30}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0 anim-fade-in"
          style={{ animationDelay: `${r * staggerDelay}ms` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Bone
              key={`r${r}-c${c}`}
              className={cn("h-3", c === 0 ? "w-1/3" : "w-20")}
              delayMs={r * staggerDelay + c * 20}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────── Grid Skeleton ────────────────────────── */

interface GridSkeletonProps {
  items?: number;
  columns?: number;
  className?: string;
  staggerDelay?: number;
}

export function GridSkeleton({
  items = 6,
  columns = 3,
  className,
  staggerDelay = 80,
}: GridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} delayMs={i * staggerDelay} />
      ))}
    </div>
  );
}

/* ────────────────────────── Dashboard Skeleton ────────────────────────── */

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 anim-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <ShimmerSkeleton className="h-3 w-16 mb-3" delayMs={i * 60} />
            <ShimmerSkeleton className="h-8 w-20" delayMs={i * 60 + 40} />
          </div>
        ))}
      </div>
      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardSkeleton rows={4} delayMs={240} />
        <CardSkeleton rows={4} delayMs={300} />
      </div>
      {/* Table */}
      <TableSkeleton rows={4} columns={5} />
    </div>
  );
}

/* ────────────────────────── Settings Skeleton ────────────────────────── */

interface SettingsSkeletonProps {
  cards?: number;
  className?: string;
  staggerDelay?: number;
}

export function SettingsSkeleton({
  cards = 3,
  className,
  staggerDelay = 80,
}: SettingsSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-6 max-w-xl", className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 anim-fade-in"
          style={{ animationDelay: `${i * staggerDelay}ms` }}
        >
          <ShimmerSkeleton className="h-5 w-1/3 mb-2" delayMs={i * staggerDelay} />
          <ShimmerSkeleton className="h-3 w-2/3 mb-5" delayMs={i * staggerDelay + 30} />
          <div className="space-y-4">
            <ShimmerSkeleton className="h-10 w-full" delayMs={i * staggerDelay + 60} />
            <ShimmerSkeleton className="h-10 w-full" delayMs={i * staggerDelay + 90} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────── Pulsing Dots ────────────────────────── */

interface PulsingDotsProps {
  count?: number;
  className?: string;
  dotClassName?: string;
}

/** Three pulsing dots — useful for inline loading states. */
export function PulsingDots({
  count = 3,
  className,
  dotClassName,
}: PulsingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "block rounded-full bg-[var(--text-tertiary)] anim-pulse-dot",
            "w-2 h-2",
            dotClassName
          )}
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────── Wave Skeleton ────────────────────────── */

interface WaveSkeletonProps {
  bars?: number;
  className?: string;
  barHeight?: string;
  gap?: string;
}

/** A wave-like shimmer that sweeps across multiple bars. */
export function WaveSkeleton({
  bars = 5,
  className,
  barHeight = "h-3",
  gap = "gap-3",
}: WaveSkeletonProps) {
  return (
    <div className={cn("flex flex-col", gap, className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-md shimmer-bg animate-shimmer w-full",
            barHeight
          )}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
