"use client";

import { useEffect, useState } from "react";
import { useTheme as useNextTheme, type UseThemeProps } from "next-themes";

export interface ThemeHook {
  /** Active theme value ('light' | 'dark' | 'system') */
  theme: UseThemeProps["theme"];
  /** Resolved theme accounting for system preference ('light' | 'dark') */
  resolvedTheme: "light" | "dark" | undefined;
  /** Set theme explicitly */
  setTheme: (theme: "light" | "dark" | "system") => void;
  /** Whether the theme has been resolved (avoids hydration mismatch) */
  mounted: boolean;
  /** Whether the system prefers dark mode */
  systemPrefersDark: boolean | undefined;
}

export function useTheme(): ThemeHook {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme,
    resolvedTheme: resolvedTheme as "light" | "dark" | undefined,
    setTheme,
    mounted,
    systemPrefersDark: systemTheme === "dark",
  };
}
