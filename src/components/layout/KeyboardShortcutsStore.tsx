"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface KeyboardShortcutsContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <KeyboardShortcutsContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcutsStore() {
  const ctx = useContext(KeyboardShortcutsContext);
  if (!ctx) {
    throw new Error("useKeyboardShortcutsStore must be used within KeyboardShortcutsProvider");
  }
  return ctx;
}
