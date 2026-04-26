"use client";

import React from "react";
import {
  EnhancedTooltip,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  TooltipProvider,
  DelayedTooltipProvider,
} from "./tooltip";
import { Button } from "./button";

/* ── placement variants ── */
const placements: Array<{ side: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end" }> = [
  { side: "top", align: "center" },
  { side: "bottom", align: "center" },
  { side: "left", align: "center" },
  { side: "right", align: "center" },
  { side: "top", align: "start" },
  { side: "top", align: "end" },
];

/* ── delay presets ── */
const delayPresets: Array<{ label: string; preset: "instant" | "fast" | "default" | "slow" | "hover"; desc: string }> = [
  { label: "instant", preset: "instant", desc: "0ms / 0ms" },
  { label: "fast", preset: "fast", desc: "100ms / 50ms" },
  { label: "default", preset: "default", desc: "200ms / 100ms" },
  { label: "slow", preset: "slow", desc: "500ms / 200ms" },
  { label: "hover", preset: "hover", desc: "50ms / 300ms" },
];

export function TooltipDemo() {
  return (
    <div className="flex flex-col gap-12 p-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">
          EnhancedTooltip — All-in-One Wrapper
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Arrow, configurable delay, placement, hover micro-interactions, and keyboard dismissal.
        </p>

        {/* Placement grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {placements.map((p) => (
            <EnhancedTooltip
              key={`${p.side}-${p.align}`}
              side={p.side}
              align={p.align}
              content={
                <span>
                  side=<b>{p.side}</b>, align=<b>{p.align}</b>
                </span>
              }
              delay="instant"
            >
              <Button variant="outline" size="sm" className="w-full capitalize">
                {p.side} {p.align && `(${p.align})`}
              </Button>
            </EnhancedTooltip>
          ))}
        </div>

        {/* Delay presets */}
        <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Delay Presets</h3>
        <div className="flex flex-wrap gap-3 mb-10">
          {delayPresets.map((d) => (
            <EnhancedTooltip
              key={d.preset}
              delay={d.preset}
              content={
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{d.label}</span>
                  <span className="text-xs opacity-75">open / close: {d.desc}</span>
                </div>
              }
            >
              <Button variant="secondary" size="sm">
                {d.label}
              </Button>
            </EnhancedTooltip>
          ))}
        </div>

        {/* No arrow */}
        <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Without Arrow</h3>
        <div className="flex gap-3 mb-10">
          <EnhancedTooltip arrow={false} content="Clean, minimal tooltip">
            <Button variant="ghost" size="sm">
              No Arrow
            </Button>
          </EnhancedTooltip>
        </div>

        {/* Rich content */}
        <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Rich Content</h3>
        <div className="flex gap-3 mb-10">
          <EnhancedTooltip
            maxWidth={280}
            content={
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">Keyboard Shortcuts</span>
                <div className="flex justify-between text-xs opacity-80">
                  <span>Copy</span>
                  <kbd className="bg-[var(--bg-surface-1)] px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+C</kbd>
                </div>
                <div className="flex justify-between text-xs opacity-80">
                  <span>Paste</span>
                  <kbd className="bg-[var(--bg-surface-1)] px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+V</kbd>
                </div>
                <div className="flex justify-between text-xs opacity-80">
                  <span>Close</span>
                  <kbd className="bg-[var(--bg-surface-1)] px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd>
                </div>
              </div>
            }
          >
            <Button variant="outline" size="sm">
              Rich Content
            </Button>
          </EnhancedTooltip>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-[var(--border-subtle)]" />

      {/* Primitive API demo */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">
          Primitive API (Backward-Compatible)
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Original Tooltip, TooltipTrigger, TooltipContent, TooltipArrow components still work.
        </p>

        <TooltipProvider delayDuration={150}>
          <div className="flex flex-wrap gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  With Arrow
                </Button>
              </TooltipTrigger>
              <TooltipContent showArrow>
                TooltipContent now supports showArrow
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Without Arrow
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Default usage — no changes needed
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Divider */}
      <hr className="border-[var(--border-subtle)]" />

      {/* Delayed provider demo */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">
          DelayedTooltipProvider
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Apply consistent delay behavior across a tree of tooltips.
        </p>

        <DelayedTooltipProvider delay="slow">
          <TooltipProvider delayDuration={500}>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm">
                      Delayed {i}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent showArrow>
                    Opens after 500ms (slow preset)
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </DelayedTooltipProvider>
      </div>
    </div>
  );
}
