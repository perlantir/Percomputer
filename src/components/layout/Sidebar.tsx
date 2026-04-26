"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import {
  LayoutDashboard,
  Library,
  Compass,
  Boxes,
  Plug,
  Settings,
  Terminal,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/spaces/default", label: "Spaces", icon: Boxes },
  { href: "/connectors", label: "Connectors", icon: Plug },
  { href: "/console", label: "Console", icon: Terminal },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-[var(--z-sticky)] flex h-[100dvh] w-64 flex-col border-r border-border-subtle bg-surface">
      <div className="flex h-14 items-center border-b border-border-subtle px-4">
        <Link href="/" className="font-display text-lg font-semibold text-gradient">
          Agent Platform
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-surface-2 text-accent-primary"
                      : "text-foreground-secondary hover:bg-surface-2 hover:text-foreground-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
