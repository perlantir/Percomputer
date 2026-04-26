"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  UserPlus,
  UserMinus,
  Edit3,
  MessageCircle,
  Eye,
  MousePointerClick,
  Keyboard,
  Clock,
  ChevronDown,
  Filter,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEvent, UserStatus } from "@/hooks/usePresence";

/* ── Blur data URL for placeholder (1x1 transparent pixel) ── */
const AVATAR_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=";

// ── Icon Mapping ───────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<ActivityEvent["type"], React.ReactNode> = {
  joined: <UserPlus className="w-4 h-4" />,
  left: <UserMinus className="w-4 h-4" />,
  typing: <Keyboard className="w-4 h-4" />,
  edited: <Edit3 className="w-4 h-4" />,
  commented: <MessageCircle className="w-4 h-4" />,
  viewed: <Eye className="w-4 h-4" />,
  cursor_move: <MousePointerClick className="w-4 h-4" />,
};

const ACTIVITY_COLORS: Record<ActivityEvent["type"], string> = {
  joined: "bg-emerald-100 text-emerald-700 border-emerald-200",
  left: "bg-slate-100 text-slate-600 border-slate-200",
  typing: "bg-blue-100 text-blue-700 border-blue-200",
  edited: "bg-amber-100 text-amber-700 border-amber-200",
  commented: "bg-violet-100 text-violet-700 border-violet-200",
  viewed: "bg-cyan-100 text-cyan-700 border-cyan-200",
  cursor_move: "bg-pink-100 text-pink-700 border-pink-200",
};

const ACTIVITY_LABELS: Record<ActivityEvent["type"], string> = {
  joined: "joined",
  left: "left",
  typing: "typing",
  edited: "edited",
  commented: "commented on",
  viewed: "viewed",
  cursor_move: "active",
};

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
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function groupActivitiesByDate(activities: ActivityEvent[]) {
  const groups: Record<string, ActivityEvent[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
  });

  return groups;
}

// ── Activity Item ──────────────────────────────────────────────────

export interface ActivityItemProps {
  event: ActivityEvent;
  compact?: boolean;
  className?: string;
}

export function ActivityItem({ event, compact = false, className }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group flex gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors", className)}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
          ACTIVITY_COLORS[event.type]
        )}
      >
        {ACTIVITY_ICONS[event.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Actor name */}
            <span className="font-semibold text-sm">{event.userName}</span>

            {/* Action description */}
            <span className="text-sm text-muted-foreground ml-1">
              {ACTIVITY_LABELS[event.type]}
            </span>

            {/* Document reference */}
            {event.documentName && (
              <span className="text-sm font-medium ml-1 text-foreground truncate">
                {event.documentName}
              </span>
            )}

            {/* Custom message */}
            {event.message && (
              <p
                className={cn(
                  "text-sm text-muted-foreground mt-0.5",
                  !expanded && "line-clamp-2"
                )}
              >
                {event.message}
              </p>
            )}

            {/* Metadata (expandable) */}
            {event.metadata && expanded && (
              <div className="mt-2 p-2 bg-muted rounded-md text-xs font-mono text-muted-foreground">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{getRelativeTime(event.timestamp)}</span>
          </div>
        </div>

        {/* Expand toggle for metadata */}
        {event.metadata && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            <ChevronDown
              className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")}
            />
            {expanded ? "Less" : "Details"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Activity Feed ──────────────────────────────────────────────────

export type ActivityFilter = ActivityEvent["type"] | "all";

export interface ActivityFeedProps {
  activities: ActivityEvent[];
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
  showClearButton?: boolean;
  emptyMessage?: string;
  title?: string;
  onClear?: () => void;
  filterTypes?: ActivityEvent["type"][];
}

export function ActivityFeed({
  activities,
  className,
  maxHeight = "400px",
  showFilters = true,
  showClearButton = true,
  emptyMessage = "No activity yet",
  title = "Activity",
  onClear,
  filterTypes,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(activities.length);

  const availableFilters = useMemo(() => {
    const base: ActivityFilter[] = ["all"];
    const types = filterTypes ?? [
      "joined",
      "left",
      "typing",
      "edited",
      "commented",
      "viewed",
    ];
    return [...base, ...types];
  }, [filterTypes]);

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  const groupedActivities = useMemo(
    () => groupActivitiesByDate(filteredActivities),
    [filteredActivities]
  );

  // Auto-scroll to top on new activity
  useEffect(() => {
    if (isPaused) return;
    if (activities.length > prevLengthRef.current) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevLengthRef.current = activities.length;
  }, [activities.length, isPaused]);

  // Pause auto-scroll on user scroll down
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const isAtTop = el.scrollTop < 20;
      setIsPaused(!isAtTop);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{title}</h3>
          {activities.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {activities.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isPaused && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <BellOff className="w-3 h-3" />
              Paused
            </span>
          )}
          {showClearButton && activities.length > 0 && (
            <button
              onClick={onClear}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Clear activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && availableFilters.length > 1 && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {availableFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize whitespace-nowrap",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Activity list */}
      <div
        ref={scrollRef}
        className="overflow-y-auto scrollbar-thin"
        style={{ maxHeight }}
      >
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="py-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {Object.entries(groupedActivities).map(([date, items]) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="sticky top-0 z-10 px-4 py-1.5 bg-card/95 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {date}
                    </span>
                  </div>
                  {items.map((event) => (
                    <ActivityItem key={event.id} event={event} />
                  ))}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New activity indicator */}
      <AnimatePresence>
        {isPaused && activities.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => {
              scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              setIsPaused(false);
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Bell className="w-3 h-3" />
            New activity
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Live Activity Toast ────────────────────────────────────────────

export interface ActivityToastProps {
  event: ActivityEvent;
  onDismiss?: () => void;
  duration?: number;
  className?: string;
}

export function ActivityToast({
  event,
  onDismiss,
  duration = 4000,
  className,
}: ActivityToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border bg-card shadow-lg min-w-[280px] max-w-[360px]",
        className
      )}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
        style={{ backgroundColor: event.userColor }}
      >
        {event.userAvatar ? (
          <Image
            src={event.userAvatar}
            alt={event.userName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL={AVATAR_BLUR_DATA_URL}
          />
        ) : (
          getInitials(event.userName)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{event.userName}</span>{" "}
          <span className="text-muted-foreground">
            {ACTIVITY_LABELS[event.type]}
          </span>
          {event.documentName && (
            <span className="font-medium"> {event.documentName}</span>
          )}
        </p>
        <span className="text-[11px] text-muted-foreground">
          {getRelativeTime(event.timestamp)}
        </span>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
          <span className="sr-only">Dismiss</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted rounded-b-lg overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// ── Activity Toast Container ───────────────────────────────────────

export interface ActivityToastContainerProps {
  events: ActivityEvent[];
  maxToasts?: number;
  onDismiss?: (eventId: string) => void;
  className?: string;
}

export function ActivityToastContainer({
  events,
  maxToasts = 3,
  onDismiss,
  className,
}: ActivityToastContainerProps) {
  const visibleToasts = events.slice(0, maxToasts);

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-auto",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((event) => (
          <ActivityToast
            key={event.id}
            event={event}
            onDismiss={() => onDismiss?.(event.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ActivityFeed;
