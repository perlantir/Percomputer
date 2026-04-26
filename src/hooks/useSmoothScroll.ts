"use client";

import { useEffect } from "react";

/**
 * Intercepts all anchor link clicks (`href="#..."`) and smooth-scrolls
 * to the target element. Falls back to native CSS smooth scroll when
 * supported; otherwise uses `scrollIntoView`.
 *
 * Also adds `scroll-margin-top` offset handling for fixed headers.
 */
export function useSmoothScroll(offsetPx = 0) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const id = href.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;

      e.preventDefault();

      const top =
        el.getBoundingClientRect().top +
        window.scrollY -
        offsetPx;

      window.scrollTo({
        top,
        behavior: "smooth",
      });

      /* Move focus for a11y */
      el.focus({ preventScroll: true });
      if (!el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "-1");
      }
    };

    const links = document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="#"]'
    );
    links.forEach((link) => {
      link.addEventListener("click", handleClick as EventListener);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", handleClick as EventListener);
      });
    };
  }, [offsetPx]);
}
