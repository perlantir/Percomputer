"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import {
  User,
  CreditCard,
  Cpu,
  Shield,
  Brain,
  Bell,
  KeyRound,
  Users,
} from "lucide-react";

export interface SettingsTabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  { id: "profile", label: "Profile", icon: User, href: "/settings?tab=profile" },
  { id: "billing", label: "Billing", icon: CreditCard, href: "/settings?tab=billing" },
  { id: "models", label: "Models", icon: Cpu, href: "/settings?tab=models" },
  { id: "privacy", label: "Privacy", icon: Shield, href: "/settings?tab=privacy" },
  { id: "memory", label: "Memory", icon: Brain, href: "/settings?tab=memory" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/settings?tab=notifications" },
  { id: "api", label: "API Keys", icon: KeyRound, href: "/settings?tab=api" },
  { id: "team", label: "Team", icon: Users, href: "/settings?tab=team" },
];

export interface SettingsNavProps {
  activeTab?: string;
}

export function SettingsNav({ activeTab }: SettingsNavProps) {
  const searchParams = useSearchParams();
  const currentTab = activeTab ?? searchParams.get("tab") ?? "profile";

  return (
    <nav className="flex flex-col gap-1">
      {SETTINGS_TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast ease-out",
              isActive
                ? "bg-surface-2 text-accent-primary"
                : "text-foreground-secondary hover:bg-surface-2/60 hover:text-foreground-primary"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
