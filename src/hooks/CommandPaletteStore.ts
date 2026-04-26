"use client";

/**
 * CommandPaletteStore — Zustand store for global command-palette (search) open state.
 *
 * Used by useKeyboardShortcuts to toggle with Cmd+K or /.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface CommandPaletteStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteStore>()(
  devtools(
    (set) => ({
      open: false,
      setOpen: (open) => set({ open }, false, "setOpen"),
      toggle: () => set((state) => ({ open: !state.open }), false, "toggle"),
    }),
    { name: "command-palette-store" }
  )
);
