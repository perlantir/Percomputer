"use client";

import * as React from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  FolderOpen,
  Coins,
  CalendarClock,
  FileType,
  Plug,
} from "lucide-react";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "space",
    label: "/space",
    description: "Select a workspace to run in",
    icon: <FolderOpen className="h-4 w-4" />,
  },
  {
    id: "budget",
    label: "/budget",
    description: "Set credit budget for this run",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    id: "deadline",
    label: "/deadline",
    description: "Add a deadline for completion",
    icon: <CalendarClock className="h-4 w-4" />,
  },
  {
    id: "format",
    label: "/format",
    description: "Choose output format(s)",
    icon: <FileType className="h-4 w-4" />,
  },
  {
    id: "connector",
    label: "/connector",
    description: "Pick a connector to use",
    icon: <Plug className="h-4 w-4" />,
  },
];

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

export interface SlashMenuProps {
  open: boolean;
  filter: string;
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function SlashMenu({
  open,
  filter,
  selectedIndex,
  onSelect,
  anchorRef,
}: SlashMenuProps) {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + 16,
      });
    }
  }, [open, anchorRef]);

  /* Focus first item when menu opens */
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [open]);

  /* Focus trap: Tab cycles within the menu */
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusableElements(containerRef.current);
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

  const filtered = React.useMemo(() => {
    const q = filter.toLowerCase().replace(/^\//, "");
    if (!q) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(
      (c) =>
        c.id.includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [filter]);

  const safeIndex = filtered.length > 0 ? selectedIndex % filtered.length : 0;

  if (!open || filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] animate-slide-up"
      style={{ top: position.top, left: position.left }}
      role="menu"
      aria-label="Slash commands"
    >
      <Command className="w-64 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-high">
        <CommandList>
          <CommandGroup heading="Commands">
            {filtered.map((cmd, i) => (
              <CommandItem
                key={cmd.id}
                onSelect={() => onSelect(cmd)}
                className={
                  i === safeIndex
                    ? "bg-[var(--bg-surface-2)] aria-selected:bg-[var(--bg-surface-2)]"
                    : ""
                }
              >
                <span className="mr-2 text-[var(--accent-primary)]">
                  {cmd.icon}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {cmd.label}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {cmd.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
