"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Skeleton, SkeletonText } from "@/src/components/ui/skeleton";

/* ─────────────────── Shimmer Bone (local helper) ─────────────────── */

function ShimmerBone({
  className,
  delayMs = 0,
}: {
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn("rounded-md shimmer-bg animate-shimmer", className)}
      style={{ animationDelay: `${delayMs}ms` }}
    />
  );
}

/* ═══════════════════════════ HOME PAGE ═══════════════════════════ */

export function HomePageSkeleton() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-4 py-12 bg-canvas">
      {/* Composer Section Skeleton */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        {/* Title */}
        <ShimmerBone className="h-12 w-3/4 max-w-md rounded-lg" delayMs={0} />

        {/* Composer input */}
        <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-low">
          <div className="space-y-3">
            <ShimmerBone className="h-4 w-full rounded-md" delayMs={40} />
            <ShimmerBone className="h-4 w-2/3 rounded-md" delayMs={70} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShimmerBone className="h-8 w-8 rounded-md" delayMs={100} />
              <ShimmerBone className="h-8 w-8 rounded-md" delayMs={120} />
            </div>
            <ShimmerBone className="h-9 w-24 rounded-lg" delayMs={140} />
          </div>
        </div>
      </div>

      {/* Recent Workflows Section Skeleton */}
      <div className="w-full max-w-4xl">
        {/* Section header */}
        <div className="mb-4 flex items-center justify-between px-1">
          <ShimmerBone className="h-4 w-36 rounded-md" delayMs={60} />
          <ShimmerBone className="h-3 w-16 rounded-md" delayMs={80} />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 anim-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <ShimmerBone
                  className="h-10 w-10 rounded-md"
                  delayMs={i * 80}
                />
                <div className="flex-1 space-y-2">
                  <ShimmerBone
                    className="h-4 w-3/4 rounded-md"
                    delayMs={i * 80 + 20}
                  />
                  <ShimmerBone
                    className="h-3 w-1/2 rounded-md"
                    delayMs={i * 80 + 40}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ShimmerBone
                  className="h-5 w-16 rounded-full"
                  delayMs={i * 80 + 60}
                />
                <ShimmerBone
                  className="h-3 w-20 rounded-md"
                  delayMs={i * 80 + 80}
                />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <ShimmerBone
                  className="h-3 w-16 rounded-md"
                  delayMs={i * 80 + 100}
                />
                <ShimmerBone
                  className="h-3 w-14 rounded-md"
                  delayMs={i * 80 + 120}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════ WORKFLOW DETAIL PAGE ══════════════════════ */

export function WorkflowDetailSkeleton() {
  return (
    <div className="flex min-h-[100dvh] bg-[var(--bg-canvas)]">
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header skeleton */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-[1400px] px-6 py-5">
            <div className="flex items-start gap-4">
              <ShimmerBone className="mt-1 h-8 w-8 rounded-md" delayMs={0} />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <ShimmerBone
                    className="h-7 w-1/2 rounded-md"
                    delayMs={30}
                  />
                  <ShimmerBone
                    className="h-5 w-16 rounded-full"
                    delayMs={50}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <ShimmerBone
                    className="h-3 w-32 rounded-md"
                    delayMs={60}
                  />
                  <ShimmerBone
                    className="h-3 w-28 rounded-md"
                    delayMs={75}
                  />
                  <ShimmerBone
                    className="h-3 w-32 rounded-md"
                    delayMs={90}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions bar skeleton */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-2 flex items-center justify-end gap-2">
            <ShimmerBone className="h-8 w-20 rounded-md" delayMs={100} />
            <ShimmerBone className="h-8 w-20 rounded-md" delayMs={120} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="flex items-center gap-1 py-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerBone
                  key={i}
                  className="h-6 w-24 rounded-md"
                  delayMs={140 + i * 30}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-6 py-6">
            <SkeletonText
              lines={6}
              lineHeight="h-4"
              lastLineWidth="w-2/3"
              shimmer
            />
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3 anim-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <ShimmerBone
                      className="h-8 w-8 rounded-md"
                      delayMs={i * 60}
                    />
                    <div className="flex-1 space-y-1.5">
                      <ShimmerBone
                        className="h-3 w-20 rounded-md"
                        delayMs={i * 60 + 20}
                      />
                      <ShimmerBone
                        className="h-4 w-full rounded-md"
                        delayMs={i * 60 + 40}
                      />
                    </div>
                  </div>
                  <ShimmerBone
                    className="h-3 w-full rounded-md"
                    delayMs={i * 60 + 60}
                  />
                  <ShimmerBone
                    className="h-3 w-3/4 rounded-md"
                    delayMs={i * 60 + 80}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Right rail skeleton */}
      <aside className="shrink-0 w-12 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] hidden sm:block" />
    </div>
  );
}

/* ═════════════════════════ LIBRARY PAGE ═════════════════════════ */

export function LibraryPageSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <ShimmerBone className="h-7 w-32 rounded-md" delayMs={0} />
        <ShimmerBone className="mt-2 h-4 w-64 rounded-md" delayMs={20} />
      </div>

      {/* Filter bar skeleton */}
      <div className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          {/* Search + Sort Row */}
          <div className="flex items-center gap-3">
            <ShimmerBone className="h-10 w-full rounded-md" delayMs={30} />
            <ShimmerBone className="h-10 w-[180px] rounded-md" delayMs={50} />
          </div>

          {/* Filter Chips Row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ShimmerBone
                key={i}
                className="h-7 w-20 rounded-full"
                delayMs={60 + i * 20}
              />
            ))}
            <ShimmerBone className="h-7 w-px rounded-full" delayMs={160} />
            <ShimmerBone className="h-7 w-28 rounded-full" delayMs={180} />
            <ShimmerBone className="h-7 w-24 rounded-full" delayMs={200} />
            <ShimmerBone className="ml-auto h-4 w-24 rounded-md" delayMs={220} />
          </div>
        </div>
      </div>

      {/* Workflow List Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3 anim-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ShimmerBone
                    className="h-4 w-4 rounded-sm"
                    delayMs={i * 50}
                  />
                  <ShimmerBone
                    className="h-5 w-16 rounded-full"
                    delayMs={i * 50 + 20}
                  />
                  <ShimmerBone
                    className="h-4 w-48 sm:w-72 rounded-md"
                    delayMs={i * 50 + 40}
                  />
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <ShimmerBone
                    className="h-8 w-8 rounded-md"
                    delayMs={i * 50 + 60}
                  />
                  <ShimmerBone
                    className="h-8 w-8 rounded-md"
                    delayMs={i * 50 + 80}
                  />
                  <ShimmerBone
                    className="h-8 w-8 rounded-md"
                    delayMs={i * 50 + 100}
                  />
                </div>
              </div>

              {/* Kind chips */}
              <div className="flex flex-wrap gap-1">
                <ShimmerBone
                  className="h-5 w-16 rounded-md"
                  delayMs={i * 50 + 120}
                />
                <ShimmerBone
                  className="h-5 w-14 rounded-md"
                  delayMs={i * 50 + 140}
                />
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <ShimmerBone
                  className="h-3 w-20 rounded-md"
                  delayMs={i * 50 + 160}
                />
                <ShimmerBone
                  className="h-3 w-24 rounded-md"
                  delayMs={i * 50 + 180}
                />
                <ShimmerBone
                  className="h-3 w-16 rounded-md"
                  delayMs={i * 50 + 200}
                />
                <ShimmerBone
                  className="h-3 w-14 rounded-md"
                  delayMs={i * 50 + 220}
                />
                <ShimmerBone
                  className="h-3 w-20 rounded-md"
                  delayMs={i * 50 + 240}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ═════════════════════════ CONSOLE PAGE ═════════════════════════ */

export function ConsolePageSkeleton() {
  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-foreground-primary overflow-hidden">
      {/* Dense header skeleton */}
      <header className="h-10 flex-shrink-0 flex items-center px-3 border-b border-border-subtle bg-surface z-20">
        <div className="flex items-center gap-2 mr-6">
          <ShimmerBone className="h-4 w-4 rounded-sm" delayMs={0} />
          <ShimmerBone className="h-4 w-32 rounded-md" delayMs={10} />
        </div>

        <ShimmerBone className="hidden md:block h-4 w-24 rounded-md mr-6" delayMs={20} />
        <ShimmerBone className="hidden md:block h-5 w-16 rounded-md" delayMs={30} />

        <div className="ml-auto flex items-center gap-3">
          <ShimmerBone className="hidden sm:block h-3 w-12 rounded-md" delayMs={40} />
          <ShimmerBone className="hidden sm:block h-3 w-28 rounded-md" delayMs={50} />
          <ShimmerBone className="h-6 w-6 rounded-full" delayMs={60} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav skeleton */}
        <nav className="hidden lg:flex w-52 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col h-full">
          <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
            <ShimmerBone className="h-3 w-16 rounded-md" delayMs={0} />
          </div>
          <div className="flex-1 py-2 space-y-3 px-3">
            {/* Section 1 */}
            <div className="space-y-1">
              <ShimmerBone className="h-5 w-20 rounded-md" delayMs={20} />
              {Array.from({ length: 2 }).map((_, i) => (
                <ShimmerBone
                  key={i}
                  className="h-6 w-full rounded-md"
                  delayMs={40 + i * 20}
                />
              ))}
            </div>
            {/* Section 2 */}
            <div className="space-y-1">
              <ShimmerBone className="h-5 w-24 rounded-md" delayMs={80} />
              {Array.from({ length: 2 }).map((_, i) => (
                <ShimmerBone
                  key={i}
                  className="h-6 w-full rounded-md"
                  delayMs={100 + i * 20}
                />
              ))}
            </div>
            {/* Section 3 */}
            <div className="space-y-1">
              <ShimmerBone className="h-5 w-24 rounded-md" delayMs={140} />
              {Array.from({ length: 2 }).map((_, i) => (
                <ShimmerBone
                  key={i}
                  className="h-6 w-full rounded-md"
                  delayMs={160 + i * 20}
                />
              ))}
            </div>
            {/* Section 4 */}
            <div className="space-y-1">
              <ShimmerBone className="h-5 w-24 rounded-md" delayMs={200} />
              {Array.from({ length: 2 }).map((_, i) => (
                <ShimmerBone
                  key={i}
                  className="h-6 w-full rounded-md"
                  delayMs={220 + i * 20}
                />
              ))}
            </div>
          </div>
          <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
            <ShimmerBone className="h-3 w-20 rounded-md" delayMs={260} />
          </div>
        </nav>

        {/* Main content skeleton */}
        <main className="flex-1 overflow-auto bg-canvas p-4 sm:p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <ShimmerBone className="h-5 w-48 rounded-md" delayMs={30} />
            <div className="flex items-center gap-2">
              <ShimmerBone className="h-8 w-20 rounded-md" delayMs={50} />
              <ShimmerBone className="h-8 w-20 rounded-md" delayMs={70} />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50 px-4 py-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ShimmerBone
                  key={i}
                  className={cn("h-3", i === 0 ? "w-1/3" : "w-20")}
                  delayMs={60 + i * 20}
                />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 8 }).map((_, r) => (
              <div
                key={r}
                className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0 anim-fade-in"
                style={{ animationDelay: `${r * 40}ms` }}
              >
                {Array.from({ length: 5 }).map((_, c) => (
                  <ShimmerBone
                    key={c}
                    className={cn("h-3", c === 0 ? "w-1/3" : c === 1 ? "w-16" : "w-20")}
                    delayMs={r * 40 + c * 15}
                  />
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════ SETTINGS TAB SKELETONS ══════════════════════ */

export function SettingsProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 anim-fade-in">
        <ShimmerBone className="h-5 w-1/3 mb-1 rounded-md" delayMs={0} />
        <ShimmerBone className="h-3 w-2/3 mb-5 rounded-md" delayMs={20} />
        <div className="flex items-center gap-4 mb-4">
          <ShimmerBone className="h-16 w-16 rounded-full" delayMs={40} />
          <ShimmerBone className="h-8 w-28 rounded-md" delayMs={60} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ShimmerBone className="h-10 w-full rounded-md" delayMs={80} />
            <ShimmerBone className="h-10 w-full rounded-md" delayMs={100} />
          </div>
          <ShimmerBone className="h-10 w-full rounded-md" delayMs={120} />
        </div>
      </div>
    </div>
  );
}

export function SettingsApiKeysSkeleton() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <ShimmerBone className="h-4 w-64 rounded-md" delayMs={0} />
        <ShimmerBone className="h-8 w-28 rounded-md" delayMs={20} />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3 anim-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <ShimmerBone className="h-4 w-4 rounded-sm" delayMs={i * 60} />
                  <ShimmerBone className="h-4 w-32 rounded-md" delayMs={i * 60 + 20} />
                </div>
                <ShimmerBone className="h-3 w-24 rounded-md" delayMs={i * 60 + 40} />
                <div className="flex flex-wrap gap-1">
                  <ShimmerBone className="h-5 w-28 rounded-md" delayMs={i * 60 + 60} />
                  <ShimmerBone className="h-5 w-20 rounded-md" delayMs={i * 60 + 80} />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ShimmerBone className="h-8 w-8 rounded-md" delayMs={i * 60 + 100} />
                <ShimmerBone className="h-8 w-8 rounded-md" delayMs={i * 60 + 120} />
                <ShimmerBone className="h-8 w-8 rounded-md" delayMs={i * 60 + 140} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsTeamSkeleton() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <ShimmerBone className="h-4 w-56 rounded-md" delayMs={0} />
        <ShimmerBone className="h-8 w-32 rounded-md" delayMs={20} />
      </div>
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50 px-4 py-3">
          <ShimmerBone className="h-3 w-1/4 rounded-md" delayMs={30} />
          <ShimmerBone className="h-3 w-16 rounded-md" delayMs={40} />
          <ShimmerBone className="h-3 w-20 rounded-md" delayMs={50} />
          <ShimmerBone className="h-3 w-16 rounded-md ml-auto" delayMs={60} />
        </div>
        {/* Rows */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0 anim-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ShimmerBone className="h-8 w-8 rounded-full" delayMs={i * 50 + 30} />
              <div className="space-y-1.5">
                <ShimmerBone className="h-4 w-28 rounded-md" delayMs={i * 50 + 40} />
                <ShimmerBone className="h-3 w-40 rounded-md" delayMs={i * 50 + 50} />
              </div>
            </div>
            <ShimmerBone className="h-5 w-14 rounded-full" delayMs={i * 50 + 60} />
            <ShimmerBone className="h-3 w-20 rounded-md" delayMs={i * 50 + 70} />
            <ShimmerBone className="h-8 w-8 rounded-md ml-auto" delayMs={i * 50 + 80} />
          </div>
        ))}
      </div>
    </div>
  );
}
