"use client";

import { useEffect, useCallback, useRef } from "react";
import { useCommandPalette } from "./CommandPaletteProvider";
import { useKeyboardShortcutsStore } from "@/src/components/layout/KeyboardShortcutsStore";

const isMac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
export const modKey = isMac ? "Meta" : "Control";

interface UseKeyboardShortcutsOptions {
  /** Callback when Cmd+Enter is pressed (composer submit) */
  onSubmit?: () => void;
  /** Callback when j/k is pressed for list navigation */
  onNavigateList?: (direction: "up" | "down") => void;
  /** Whether j/k navigation is currently active (e.g., when a list is focused) */
  listNavigationActive?: boolean;
  /** Ref to the element that should receive j/k navigation */
  listRef?: React.RefObject<HTMLElement | null>;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onSubmit, onNavigateList, listNavigationActive = false } = options;
  const { setOpen } = useCommandPalette();
  const { setOpen: setShortcutsOpen } = useKeyboardShortcutsStore();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape: close modals / defocus inputs
      if (e.key === "Escape") {
        // If any modal is open, let the modal handle it
        // Otherwise blur active input
        if (!isInput) return;
        if (target instanceof HTMLElement) {
          target.blur();
        }
        e.preventDefault();
        return;
      }

      // Command Palette: Cmd+K or /
      if ((e.key === "k" && e.getModifierState(modKey)) || (e.key === "/" && !isInput)) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      // Shortcuts help: ?
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Composer submit: Cmd+Enter (only when in input)
      if (e.key === "Enter" && e.getModifierState(modKey) && isInput) {
        e.preventDefault();
        optionsRef.current.onSubmit?.();
        return;
      }

      // j/k list navigation (vim-style) — only when active and not in input
      if ((e.key === "j" || e.key === "k") && !isInput && listNavigationActive) {
        e.preventDefault();
        optionsRef.current.onNavigateList?.(e.key === "j" ? "down" : "up");
        return;
      }
    },
    [setOpen, setShortcutsOpen, listNavigationActive]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    /** Manually trigger the command palette */
    openCommandPalette: () => setOpen(true),
    /** Manually trigger the shortcuts modal */
    openShortcuts: () => setShortcutsOpen(true),
    /** Whether the current platform uses Cmd (Mac) or Ctrl */
    isMac,
    /** The modifier key name for display */
    modKeyLabel: isMac ? "⌘" : "Ctrl",
  };
}
