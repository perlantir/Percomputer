"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/src/lib/utils";

const popoverSpring = { type: "spring" as const, stiffness: 450, damping: 28, mass: 0.7 };
const reducedSpring  = { type: "spring" as const, stiffness: 500, damping: 50, mass: 0.5 };

const sideOffsetMap: Record<string, { x: number; y: number }> = {
  bottom: { x: 0, y: -10 },
  top:    { x: 0, y: 10 },
  left:   { x: 10, y: 0 },
  right:  { x: -10, y: 0 },
};

const transformOriginMap: Record<string, string> = {
  bottom: "top center",
  top:    "bottom center",
  left:   "center right",
  right:  "center left",
};

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  // Radix may flip the side to fit the viewport; read it from the data attribute
  const sideRef = React.useRef<HTMLDivElement>(null);
  const [side, setSide] = React.useState<string>("bottom");
  const offset = sideOffsetMap[side] ?? sideOffsetMap.bottom;
  const origin = transformOriginMap[side] ?? "center";

  // Merge refs
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      sideRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref]
  );

  React.useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    // Radix sets data-side on the element
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-side") {
          setSide(el.getAttribute("data-side") ?? "bottom");
        }
      }
    });
    observer.observe(el, { attributes: true });
    // initial
    setSide(el.getAttribute("data-side") ?? "bottom");
    return () => observer.disconnect();
  }, []);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={setRefs}
        align={align}
        sideOffset={sideOffset}
        {...props}
        asChild
        forceMount
      >
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x, y: offset.y, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x * 0.4, y: offset.y * 0.4, scale: 0.97 }}
          transition={shouldReduce ? reducedSpring : popoverSpring}
          style={{ transformOrigin: origin }}
          className={cn(
            "z-50 w-72 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-medium outline-none will-change-transform",
            className
          )}
        />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
