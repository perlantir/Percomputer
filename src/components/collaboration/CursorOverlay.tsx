"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PresenceUser } from "@/hooks/usePresence";

// ── Types ──────────────────────────────────────────────────────────

export interface CursorOverlayProps {
  users: PresenceUser[];
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  showLabels?: boolean;
  smoothFactor?: number;
  labelOffset?: { x: number; y: number };
}

// ── Individual Remote Cursor ───────────────────────────────────────

interface RemoteCursorProps {
  user: PresenceUser;
  showLabel?: boolean;
  smoothFactor?: number;
  labelOffset?: { x: number; y: number };
}

function RemoteCursor({
  user,
  showLabel = true,
  smoothFactor = 0.15,
  labelOffset = { x: 10, y: -6 },
}: RemoteCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [displayPos, setDisplayPos] = useState({ x: 0, y: 0 });

  // Initialize position when cursor first appears
  useEffect(() => {
    if (user.cursor) {
      positionRef.current = { ...user.cursor };
      targetRef.current = { ...user.cursor };
      setDisplayPos(user.cursor);
    }
  }, []);

  // Update target when user cursor changes
  useEffect(() => {
    if (user.cursor) {
      targetRef.current = { ...user.cursor };
    }
  }, [user.cursor]);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      const pos = positionRef.current;
      const target = targetRef.current;

      // Linear interpolation for smooth movement
      pos.x += (target.x - pos.x) * smoothFactor;
      pos.y += (target.y - pos.y) * smoothFactor;

      // Snap if very close
      if (Math.abs(target.x - pos.x) < 0.5) pos.x = target.x;
      if (Math.abs(target.y - pos.y) < 0.5) pos.y = target.y;

      setDisplayPos({ ...pos });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [smoothFactor]);

  if (!user.cursor) return null;

  return (
    <motion.div
      ref={cursorRef}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none absolute z-[100]"
      style={{
        left: displayPos.x,
        top: displayPos.y,
      }}
    >
      {/* SVG Cursor Pointer */}
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
        style={{ filter: `drop-shadow(0 1px 2px ${user.color}40)` }}
      >
        <path
          d="M2.5 2L2.5 18.5L6.5 14.5L10.5 21.5L13 20.5L9 13.5L15 13.5L2.5 2Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name Label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute whitespace-nowrap px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shadow-sm"
          style={{
            backgroundColor: user.color,
            left: labelOffset.x,
            top: labelOffset.y,
          }}
        >
          {user.name}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Click Ripple Effect ────────────────────────────────────────────

interface ClickRipple {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

function ClickRippleEffect({
  ripples,
}: {
  ripples: ClickRipple[];
}) {
  return (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none absolute z-[99] w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            left: ripple.x,
            top: ripple.y,
            borderColor: ripple.color,
          }}
        />
      ))}
    </AnimatePresence>
  );
}

// ── Main Cursor Overlay ────────────────────────────────────────────

export function CursorOverlay({
  users,
  containerRef,
  className,
  showLabels = true,
  smoothFactor = 0.15,
  labelOffset = { x: 10, y: -6 },
}: CursorOverlayProps) {
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ripplesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track local cursor for broadcasting (optional)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef?.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Could emit cursor position here via callback
      // onCursorMove?.({ x, y });
    },
    [containerRef]
  );

  // Simulate click ripples for remote users
  const handleRemoteClick = useCallback(
    (userId: string, x: number, y: number) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const ripple: ClickRipple = {
        id: `${userId}-${Date.now()}`,
        x,
        y,
        color: user.color,
        timestamp: Date.now(),
      };

      setRipples((prev) => [...prev, ripple]);

      // Clean up old ripples
      if (ripplesTimeoutRef.current) clearTimeout(ripplesTimeoutRef.current);
      ripplesTimeoutRef.current = setTimeout(() => {
        setRipples((prev) => prev.filter((r) => Date.now() - r.timestamp < 1000));
      }, 700);
    },
    [users]
  );

  // Attach mouse move listener
  useEffect(() => {
    const container = containerRef?.current ?? window;
    const target = container === window ? window : container;

    target.addEventListener("mousemove", handleMouseMove as EventListener);
    return () => {
      target.removeEventListener("mousemove", handleMouseMove as EventListener);
    };
  }, [containerRef, handleMouseMove]);

  // Cleanup ripples interval
  useEffect(() => {
    const interval = setInterval(() => {
      setRipples((prev) => prev.filter((r) => Date.now() - r.timestamp < 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter to only users with active cursors
  const activeUsers = users.filter(
    (u) => u.cursor && u.status !== "offline"
  );

  if (activeUsers.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
    >
      {/* Click ripples */}
      <ClickRippleEffect ripples={ripples} />

      {/* Remote cursors */}
      <AnimatePresence>
        {activeUsers.map((user) => (
          <RemoteCursor
            key={user.id}
            user={user}
            showLabel={showLabels}
            smoothFactor={smoothFactor}
            labelOffset={labelOffset}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Cursor Tracker Hook ────────────────────────────────────────────

export interface UseCursorTrackerOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  throttleMs?: number;
  onCursorMove?: (pos: { x: number; y: number }) => void;
}

export function useCursorTracker({
  containerRef,
  enabled = true,
  throttleMs = 50,
  onCursorMove,
}: UseCursorTrackerOptions) {
  const lastUpdateRef = useRef(0);
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Clamp to container bounds
      const clampedX = Math.max(0, Math.min(x, rect.width));
      const clampedY = Math.max(0, Math.min(y, rect.height));

      positionRef.current = { x: clampedX, y: clampedY };
      onCursorMove?.(positionRef.current);
    };

    const handleMouseLeave = () => {
      onCursorMove?.({ x: -1, y: -1 }); // Signal cursor left
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, containerRef, throttleMs, onCursorMove]);

  return positionRef;
}

// ── Collaborative Selection Highlight ──────────────────────────────

export interface SelectionHighlightProps {
  user: PresenceUser;
  range: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  className?: string;
}

export function SelectionHighlight({
  user,
  range,
  className,
}: SelectionHighlightProps) {
  const { startX, startY, endX, endY } = range;
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.25 }}
      exit={{ opacity: 0 }}
      className={cn("absolute pointer-events-none rounded-sm", className)}
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: user.color,
        border: `1px solid ${user.color}`,
      }}
    >
      {/* Selection handles */}
      <div
        className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-white border-2"
        style={{ borderColor: user.color }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-white border-2"
        style={{ borderColor: user.color }}
      />
    </motion.div>
  );
}

export default CursorOverlay;
