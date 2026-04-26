"use client";

/**
 * Datadog RUM Provider — React component wrapper for the Datadog RUM SDK.
 *
 * - Initializes RUM once on mount.
 * - Tracks Next.js route changes as RUM views via MutationObserver fallback.
 * - Injects no markup; purely side-effectful.
 *
 * Place high in the tree (inside body, outside main layout chrome) in
 * app/layout.tsx so every route is covered.
 */

import { useEffect, useRef } from "react";
import { initDatadogRUM, isRUMInitialized } from "@/src/lib/monitoring/datadog";

export function DatadogRUMProvider() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Initialize from env vars injected at build time
    initDatadogRUM();

    // SPA route-change view tracking via pathname changes
    // (Next.js App Router lacks a built-in router event system in the same
    // way Pages Router had, so we observe pathname changes via popstate + pushState patching)
    if (!isRUMInitialized()) return;

    let lastPathname = window.location.pathname;

    const handlePathChange = () => {
      const nextPath = window.location.pathname;
      if (nextPath !== lastPathname) {
        lastPathname = nextPath;
        // Dynamically import to avoid pulling datadogRum into the main chunk
        // when already guarded by isRUMInitialized()
        import("@/src/lib/monitoring/datadog").then((mod) => {
          mod.startRUMView(nextPath);
        });
      }
    };

    // Patch history methods to catch programmatic navigations
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function patchedPushState(
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      originalPushState.call(this, data, unused, url);
      handlePathChange();
    };

    window.history.replaceState = function patchedReplaceState(
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      originalReplaceState.call(this, data, unused, url);
      handlePathChange();
    };

    window.addEventListener("popstate", handlePathChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePathChange);
    };
  }, []);

  // No DOM output
  return null;
}
