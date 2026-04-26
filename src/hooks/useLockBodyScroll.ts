import { useEffect } from "react";

/**
 * Hook that locks body scroll when `locked` is true.
 * Useful for modals, drawers, and overlays.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [locked]);
}
