"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Shield,
  CreditCard,
  LogOut,
  ChevronDown,
  Zap,
  Crown,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/src/lib/utils";

/* ── Blur data URL for avatar placeholder (1x1 transparent pixel) ── */
const AVATAR_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=";

/** Role badge config */
const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  admin: {
    label: "Admin",
    icon: <Shield className="h-3 w-3" />,
    color: "bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]",
  },
  owner: {
    label: "Owner",
    icon: <Crown className="h-3 w-3" />,
    color: "bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)]",
  },
  member: {
    label: "Member",
    icon: <Bot className="h-3 w-3" />,
    color: "bg-[var(--bg-surface-3)] text-[var(--text-secondary)]",
  },
  viewer: {
    label: "Viewer",
    icon: <User className="h-3 w-3" />,
    color: "bg-[var(--bg-surface-3)] text-[var(--text-tertiary)]",
  },
};

interface UserMenuProps {
  /** User display name */
  name: string;
  /** User email */
  email: string;
  /** Avatar image URL (optional) */
  avatarUrl?: string | null;
  /** User role */
  role: string;
  /** Credit balance (e.g. "$47.50 remaining") */
  creditText?: string;
  /** Whether user has admin access */
  isAdmin?: boolean;
  /** Callback on logout */
  onLogout?: () => void;
  /** Additional CSS classes */
  className?: string;
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => {
    const style = window.getComputedStyle(el as HTMLElement);
    return style.display !== "none" && style.visibility !== "hidden";
  }) as HTMLElement[];
}

export function UserMenu({
  name,
  email,
  avatarUrl,
  role,
  creditText,
  isAdmin = false,
  onLogout,
  className,
}: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Return focus to trigger after menu closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Focus first menu item when opening
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const focusable = getFocusableElements(menuRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  // Focus trap within dropdown
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusableElements(menuRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;

  const menuItems: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    adminOnly?: boolean;
    danger?: boolean;
    separator?: boolean;
  }[] = [
    { label: "Profile", icon: <User className="h-4 w-4" />, onClick: () => router.push("/profile") },
    { label: "Settings", icon: <Settings className="h-4 w-4" />, onClick: () => router.push("/settings") },
    { label: "Console", icon: <Shield className="h-4 w-4" />, onClick: () => router.push("/console"), adminOnly: true },
    { label: "Billing", icon: <CreditCard className="h-4 w-4" />, onClick: () => router.push("/billing") },
    { label: "Logout", icon: <LogOut className="h-4 w-4" />, onClick: () => { onLogout?.(); closeMenu(); }, danger: true },
  ];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
          open ? "bg-[var(--bg-surface-2)]" : "hover:bg-[var(--bg-surface-2)]"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-3)]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              fill
              sizes="32px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={AVATAR_BLUR_DATA_URL}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[var(--text-tertiary)]">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
        </div>

        {/* Name + chevron (hidden on very small screens) */}
        <div className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
            {name}
          </span>
          <span className="truncate text-xs text-[var(--text-tertiary)]">
            {email}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "hidden h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-64 overflow-hidden rounded-lg shadow-lg"
            role="menu"
          >
            {/* User header */}
            <div className="flex items-start gap-3 border-b border-[var(--border-subtle)] p-4">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-3)] shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    sizes="40px"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={AVATAR_BLUR_DATA_URL}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--text-tertiary)]">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {name}
                </p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">
                  {email}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      roleConfig.color
                    )}
                  >
                    {roleConfig.icon}
                    {roleConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit indicator */}
            {creditText && (
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-4 py-2 text-xs text-[var(--text-secondary)]">
                <Zap className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                <span className="truncate">{creditText}</span>
              </div>
            )}

            {/* Menu items */}
            <div className="p-1.5">
              {menuItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      item.onClick();
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      item.danger
                        ? "text-[var(--danger)] hover:bg-[var(--danger)]/10"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
                    )}
                    role="menuitem"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center",
                        item.danger && "text-[var(--danger)]"
 