"use client";

import { useEffect, useState } from "react";
import { X, Megaphone, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface AnnouncementBannerProps {
  /** Banner message text */
  message: string;
  /** Optional link URL */
  linkUrl?: string;
  /** Optional link label */
  linkLabel?: string;
  /** Optional link target */
  linkTarget?: string;
  /** Optional localStorage key for dismissal persistence */
  storageKey?: string;
  /** Banner style variant */
  variant?: "info" | "warning" | "success" | "promotion";
  /** Additional classes */
  className?: string;
}

const variantStyles = {
  info: {
    bg: "bg-[var(--info)]/10",
    border: "border-[var(--info)]/20",
    text: "text-[var(--info)]",
    icon: "text-[var(--info)]",
    link: "hover:bg-[var(--info)]/20",
  },
  warning: {
    bg: "bg-[var(--warning)]/10",
    border: "border-[var(--warning)]/20",
    text: "text-[var(--warning)]",
    icon: "text-[var(--warning)]",
    link: "hover:bg-[var(--warning)]/20",
  },
  success: {
    bg: "bg-[var(--success)]/10",
    border: "border-[var(--success)]/20",
    text: "text-[var(--success)]",
    icon: "text-[var(--success)]",
    link: "hover:bg-[var(--success)]/20",
  },
  promotion: {
    bg: "bg-[var(--accent-primary)]/10",
    border: "border-[var(--accent-primary)]/20",
    text: "text-[var(--accent-primary)]",
    icon: "text-[var(--accent-primary)]",
    link: "hover:bg-[var(--accent-primary)]/20",
  },
};

export function AnnouncementBanner({
  message,
  linkUrl,
  linkLabel = "Learn more",
  linkTarget = "_blank",
  storageKey,
  variant = "info",
  className,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!storageKey) return;
    try {
      const dismissed = localStorage.getItem(`banner-dismissed-${storageKey}`);
      if (dismissed) setVisible(false);
    } catch {
      // localStorage unavailable
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setVisible(false);
    if (storageKey) {
      try {
        localStorage.setItem(`banner-dismissed-${storageKey}`, "true");
      } catch {
        // localStorage unavailable
      }
    }
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn("overflow-hidden", className)}
        >
          <div
            className={cn(
              "relative flex items-center justify-center gap-3 border-b px-4 py-2.5 text-sm",
              styles.bg,
              styles.border
            )}
            role="banner"
          >
            <Megaphone className={cn("h-4 w-4 shrink-0", styles.icon)} />

            <span className={cn("font-medium", styles.text)}>
              {message}
            </span>

            {linkUrl && (
              <a
                href={linkUrl}
                target={linkTarget}
                rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-semibold transition-colors",
                  styles.text,
                  styles.link
                )}
              >
                {linkLabel}
                <ArrowRight className="h-3 w-3" />
              </a>
            )}

            <button
              onClick={handleDismiss}
              className={cn(
                "absolute right-3 rounded-md p-1 transition-colors",
                styles.text,
                "hover:bg-[var(--bg-hover)]"
              )}
              aria-label="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
