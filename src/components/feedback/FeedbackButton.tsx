"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useFeedbackStore } from "./feedbackStore";

export interface FeedbackButtonProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offsetX?: number;
  offsetY?: number;
}

const POSITION_STYLES: Record<string, string> = {
  "bottom-right": "right-6 bottom-6",
  "bottom-left": "left-6 bottom-6",
  "top-right": "right-6 top-6",
  "top-left": "left-6 top-6",
};

export function FeedbackButton({
  className,
  position = "bottom-right",
  offsetX,
  offsetY,
}: FeedbackButtonProps) {
  const { isOpen, open, close } = useFeedbackStore();

  const isActive = isOpen;
  const posClass = POSITION_STYLES[position] ?? POSITION_STYLES["bottom-right"];

  const customStyle: React.CSSProperties = {};
  if (offsetX !== undefined) {
    const isRight = position.includes("right");
    customStyle[isRight ? "right" : "left"] = offsetX;
  }
  if (offsetY !== undefined) {
    const isBottom = position.includes("bottom");
    customStyle[isBottom ? "bottom" : "top"] = offsetY;
  }

  return (
    <button
      onClick={isActive ? close : open}
      className={cn(
        // Position
        "fixed z-50",
        posClass,
        // Size
        "h-14 w-14 rounded-full",
        // Appearance
        "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
        "shadow-lg shadow-[var(--accent-primary)]/25",
        // Interaction
        "hover:bg-[var(--accent-primary-hover)] hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 hover:scale-105",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
        // Animation
        "transition-all duration-fast ease-out",
        "animate-in fade-in zoom-in slide-in-from-bottom-4",
        // Tooltip hint on hover
        "group",
        className
      )}
      style={customStyle}
      aria-label={isActive ? "Close feedback" : "Open feedback"}
      title={isActive ? "Close feedback" : "Send feedback"}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-fast ease-out",
          isActive
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50"
        )}
      >
        <X className="w-6 h-6" />
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-fast ease-out",
          isActive
            ? "opacity-0 rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
        )}
      >
        <MessageSquarePlus className="w-6 h-6" />
      </span>

      {/* Tooltip label */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] shadow-md whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-fast ease-out origin-right hidden sm:block">
        Send feedback
      </span>
    </button>
  );
}

