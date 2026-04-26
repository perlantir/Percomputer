"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { MODEL_COLORS, ModelName } from "@/src/types/workflow";

interface ModelAvatarProps {
  /** The model name driving the colour ring and initials. */
  model: ModelName;
  /** Visual size (default "md"). */
  size?: "sm" | "md" | "lg";
  /** Show a subtle pulsing ring when the model is actively running. */
  isRunning?: boolean;
  /** Additional wrapper classes. */
  className?: string;
  /** Override the colour ring (defaults to MODEL_COLORS[model]). */
  ringColor?: string;
  /** Disable tooltip. */
  noTooltip?: boolean;
  /** Callback on click. */
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { avatar: "h-7 w-7", text: "text-[0.65rem]", ring: 2, ringGap: 1 },
  md: { avatar: "h-9 w-9", text: "text-xs", ring: 2.5, ringGap: 1.5 },
  lg: { avatar: "h-11 w-11", text: "text-sm", ring: 3, ringGap: 2 },
};

/**
 * ModelAvatar
 *
 * A compact avatar component that shows a model's initials inside a
 * circular badge surrounded by a colour-matched ring. The ring colour is
 * pulled from the global MODEL_COLORS map.
 *
 * When `isRunning` is true a gentle pulsing animation is applied to the
 * ring (disabled for `prefers-reduced-motion`).
 *
 * A tooltip displays the full model name on hover.
 *
 * Usage:
 *   <ModelAvatar model="Claude Opus 4.7" size="md" isRunning />
 */
export const ModelAvatar = React.memo(function ModelAvatar({
  model,
  size = "md",
  isRunning = false,
  className,
  ringColor,
  noTooltip = false,
  onClick,
}: ModelAvatarProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const color = ringColor ?? MODEL_COLORS[model] ?? "var(--text-tertiary)";
  const initials = getModelInitials(model);
  const s = SIZE_MAP[size];

  const ringStyle: React.CSSProperties = {
    boxShadow: `0 0 0 ${s.ringGap}px var(--bg-canvas), 0 0 0 calc(${s.ringGap}px + ${s.ring}px) ${color}`,
  };

  const avatar = (
    <motion.div
      className={cn("relative inline-flex", className)}
      whileHover={prefersReducedMotion ? {} : { scale: 1.06 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
    >
      <Avatar
        className={cn(
          s.avatar,
          "rounded-full transition-shadow duration-300",
          isRunning && !prefersReducedMotion && "anim-ring-pulse"
        )}
        style={{
          ...ringStyle,
          ...(isRunning && !prefersReducedMotion
            ? { "--ring-color": `${color}66` } as React.CSSProperties
            : {}),
        }}
      >
        <AvatarFallback
          className={cn(
            "rounded-full font-ui font-semibold select-none",
            s.text
          )}
          style={{
            background: `${color}18`,
            color,
          }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Active dot */}
      {isRunning && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2",
            prefersReducedMotion ? "opacity-100" : "anim-pulse-dot"
          )}
          style={{
            width: size === "sm" ? 8 : size === "md" ? 10 : 12,
            height: size === "sm" ? 8 : size === "md" ? 10 : 12,
            background: "var(--success)",
            borderColor: "var(--bg-canvas)",
          }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );

  if (noTooltip) return avatar;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="anim-tooltip-float"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                background: color,
              }}
            />
            <span className="text-sm font-medium">{model}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

/* ── helpers ── */

function getModelInitials(name: ModelName): string {
  // Extract the first letter of each word in the first part (before version)
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* ── ModelAvatarGroup (stacked avatars for multi-model summaries) ── */

interface ModelAvatarGroupProps {
  models: ModelName[];
  size?: "sm" | "md" | "lg";
  limit?: number;
  runningModels?: ModelName[];
  className?: string;
  onModelClick?: (model: ModelName) => void;
}

const AvatarItem = React.memo(function AvatarItem({
  model,
  size,
  isRunning,
  onModelClick,
}: {
  model: ModelName;
  size: "sm" | "md" | "lg";
  isRunning: boolean;
  onModelClick?: (model: ModelName) => void;
}) {
  const handleClick = React.useCallback(() => {
    onModelClick?.(model);
  }, [onModelClick, model]);

  return (
    <ModelAvatar
      model={model}
      size={size}
      isRunning={isRunning}
      noTooltip
      onClick={onModelClick ? handleClick : undefined}
    />
  );
});

export const ModelAvatarGroup = React.memo(function ModelAvatarGroup({
  models,
  size = "sm",
  limit = 4,
  runningModels = [],
  className,
  onModelClick,
}: ModelAvatarGroupProps) {
  const visible = models.slice(0, limit);
  const remaining = Math.max(0, models.length - limit);

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((model) => (
        <AvatarItem
          key={model}
          model={model}
          size={size}
          isRunning={runningModels.includes(model)}
          onModelClick={onModelClick}
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface-3)] text-xs font-medium text-[var(--text-secondary)]",
            SIZE_MAP[size].avatar
          )}
          style={{
            boxShadow: `0 0 0 2px var(--bg-canvas)`,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
});
