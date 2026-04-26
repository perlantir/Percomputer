"use client";

import { Github, BookOpen, Activity, Shield, FileText } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface FooterProps {
  /** Application version string */
  version?: string;
  /** Whether to show in compact mode (minimal links) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const links = [
  {
    label: "Docs",
    href: "https://docs.agentplatform.dev",
    icon: <BookOpen className="h-3.5 w-3.5" />,
  },
  {
    label: "API",
    href: "/api/docs",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
  {
    label: "Status",
    href: "https://status.agentplatform.dev",
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  {
    label: "Privacy",
    href: "/privacy",
    icon: <Shield className="h-3.5 w-3.5" />,
  },
  {
    label: "Terms",
    href: "/terms",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
];

export function Footer({ version, compact = false, className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]",
        compact ? "py-3" : "py-6",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:px-6 lg:px-8",
          compact && "flex-row justify-between gap-4"
        )}
      >
        {/* Left: version + brand */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span className="font-medium text-[var(--text-secondary)]">
            Multi-Model Agent Platform
          </span>
          {version && (
            <>
              <span className="text-[var(--border-default)]">|</span>
              <span>v{version}</span>
            </>
          )}
        </div>

        {/* Center / Right: links */}
        <nav
          className="flex flex-wrap items-center justify-center gap-1"
          aria-label="Footer navigation"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-secondary)]"
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {link.icon}
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/your-org/multi-model-agent-platform"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-secondary)]"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
