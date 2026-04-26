"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MoreHorizontal,
  Wifi,
  WifiOff,
  MessageSquareText,
  Clock,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { PresenceUser, UserStatus } from "@/hooks/usePresence";

/* ── Blur data URL for placeholder (1x1 transparent pixel) ── */
const AVATAR_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=";

// ── Status Badge Variants ──────────────────────────────────────────

const statusBadgeVariants = cva(
  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
  {
    variants: {
      status: {
        online: "bg-emerald-500",
        away: "bg-amber-500",
        offline: "bg-slate-400",
        typing: "bg-blue-500 animate-pulse",
      },
    },
    defaultVariants: {
      status: "offline",
    },
  }
);

const statusLabelVariants = cva("text-xs font-medium", {
  variants: {
    status: {
      online: "text-emerald-600",
      away: "text-amber-600",
      offline: "text-slate-400",
      typing: "text-blue-600",
    },
  },
  defaultVariants: {
    status: "offline",
  },
});

// ── Helper Functions ───────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function statusLabel(status: UserStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "away":
      return "Away";
    case "offline":
      return "Offline";
    case "typing":
      return "Typing...";
  }
}

// ── Sub-Components ─────────────────────────────────────────────────

interface AvatarProps {
  user: PresenceUser;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}

export function PresenceAvatar({
  user,
  size = "md",
  showStatus = true,
  className,
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  };

  const pixelSize = size === "sm" ? 28 : size === "md" ? 36 : 44;

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.name}
          width={pixelSize}
          height={pixelSize}
          className={cn(
            "rounded-full object-cover ring-2 ring-background",
            sizeClasses[size]
          )}
          loading="lazy"
          placeholder="blur"
          blurDataURL={AVATAR_BLUR_DATA_URL}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-[var(--text-inverse)] font-semibold ring-2 ring-[var(--bg-canvas)]",
            sizeClasses[size]
          )}
          style={{ backgroundColor: user.color }}
        >
          {getInitials(user.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={statusBadgeVariants({ status: user.status })}
          aria-label={`${user.name} is ${statusLabel(user.status)}`}
          role="status"
        />
      )}
    </div>
  );
}

// ── Typing Indicator ───────────────────────────────────────────────

interface TypingIndicatorProps {
  users: PresenceUser[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.name.split(" ")[0]).join(", ");
  const isMultiple = users.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5",
        className
      )}
    >
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-current"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span className="truncate max-w-[200px]">
        {names} {isMultiple ? "are" : "is"} typing
      </span>
    </motion.div>
  );
}

// ── User Tooltip Content ───────────────────────────────────────────

interface UserTooltipProps {
  user: PresenceUser;
}

function UserTooltip({ user }: UserTooltipProps) {
  return (
    <div className="flex items-start gap-3 p-1">
      <PresenceAvatar user={user} size="lg" showStatus={false} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-semibold text-sm truncate">{user.name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {user.email}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={statusLabelVariants({ status: user.status })}>
            {statusLabel(user.status)}
          </span>
          {user.currentDocument && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {user.currentDocument}
              </span>
            </>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          <Clock className="inline w-3 h-3 mr-0.5 -mt-0.5" />
          Last seen {getRelativeTime(user.lastSeen)}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export interface PresenceIndicatorProps {
  users: PresenceUser[];
  currentUser?: PresenceUser | null;
  typingUsers?: PresenceUser[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  showTyping?: boolean;
  onUserClick?: (user: PresenceUser) => void;
  className?: string;
  isConnected?: boolean;
}

export function PresenceIndicator({
  users,
  currentUser,
  typingUsers = [],
  maxVisible = 4,
  size = "md",
  showCount = true,
  showTyping = true,
  onUserClick,
  className,
  isConnected = true,
}: PresenceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const sortedUsers = useMemo(() => {
    const statusOrder: Record<UserStatus, number> = {
      typing: 0,
      online: 1,
      away: 2,
      offline: 3,
    };
    return [...users].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );
  }, [users]);

  const visibleUsers = expanded ? sortedUsers : sortedUsers.slice(0, maxVisible);
  const hiddenCount = sortedUsers.length - maxVisible;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Main avatar stack */}
      <div className="flex items-center gap-2">
        {/* Current user */}
        {currentUser && (
          <div className="flex items-center gap-2 pr-3 border-r border-border">
            <PresenceAvatar user={currentUser} size={size} />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-medium leading-tight">
                {currentUser.name.split(" ")[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">You</span>
            </div>
          </div>
        )}

        {/* Other users */}
        <div className="flex items-center">
          <div className="flex -space-x-2 hover:space-x-1 transition-all duration-200">
            <AnimatePresence mode="popLayout">
              {visibleUsers.map((user) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative"
                  onMouseEnter={() => setShowTooltip(user.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <button
                    onClick={() => onUserClick?.(user)}
                    className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                    aria-label={`${user.name} - ${statusLabel(user.status)}`}
                  >
                    <PresenceAvatar user={user} size={size} />
                  </button>

                  {/* Inline tooltip */}
                  <AnimatePresence>
                    {showTooltip === user.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-max"
                      >
                        <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-3 min-w-[200px]">
                          <UserTooltip user={user} />
                        </div>
                        {/* Arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* +N more */}
            {hiddenCount > 0 && !expanded && (
              <motion.button
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setExpanded(true)}
                className={cn(
                  "relative flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background hover:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  size === "sm" && "w-7 h-7 text-[10px]",
                  size === "md" && "w-9 h-9 text-xs",
                  size === "lg" && "w-11 h-11 text-sm"
                )}
                aria-label={`${hiddenCount} more users`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* User count & connection status */}
        <div className="flex items-center gap-2 ml-1">
          {showCount && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="font-medium">{users.length + (currentUser ? 1 : 0)}</span>
            </div>
          )}

          {/* Connection dot */}
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isConnected ? "bg-emerald-500" : "bg-red-500"
            )}
            title={isConnected ? "Connected" : "Disconnected"}
          />

          {/* Connection icon (visible when disconnected) */}
          {!isConnected && (
            <WifiOff className="w-4 h-4 text-red-500" aria-label="Disconnected" />
          )}
        </div>
      </div>

      {/* Typing indicator */}
      {showTyping && <TypingIndicator users={typingUsers} />}
    </div>
  );
}

// ── Compact Variant ────────────────────────────────────────────────

export interface PresenceDotProps {
  user: PresenceUser;
  className?: string;
}

export function PresenceDot({ user, className }: PresenceDotProps) {
  return (
    <div
      className={cn(
        "w-2.5 h-2.5 rounded-full border-2 border-background",
        user.status === "online" && "bg-emerald-500",
        user.status === "away" && "bg-amber-500",
        user.status === "offline" && "bg-slate-400",
        user.status === "typing" && "bg-blue-500 animate-pulse",
        className
      )}
      title={`${user.name} - ${statusLabel(user.status)}`}
    />
  );
}

// ── Status Badge (inline) ──────────────────────────────────────────

export interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-background border",
        status === "online" && "border-emerald-200 text-emerald-700",
        status === "away" && "border-amber-200 text-amber-700",
        status === "offline" && "border-slate-200 text-slate-500",
        status === "typing" && "border-blue-200 text-blue-700",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "online" && "bg-emerald-500",
          status === "away" && "bg-amber-500",
          status === "offline" && "bg-slate-400",
          status === "typing" && "bg-blue-500 animate-pulse"
        )}
      />
      {label || statusLabel(status ?? "offline")}
    </span>
  );
}

export default PresenceIndicator;
