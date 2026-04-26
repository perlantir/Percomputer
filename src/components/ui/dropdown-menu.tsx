"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ── Item stagger context ── */
const StaggerContext = React.createContext<{ register: () => number; reset: () => void }>({
  register: () => 0,
  reset: () => {},
});

function useStagger() {
  return React.useContext(StaggerContext);
}

const dropdownSpring = { type: "spring" as const, stiffness: 480, damping: 30, mass: 0.65 };
const reducedSpring  = { type: "spring" as const, stiffness: 500, damping: 50, mass: 0.5 };

const sideOffsetMap: Record<string, { x: number; y: number }> = {
  bottom: { x: 0,  y: -8 },
  top:    { x: 0,  y: 8 },
  left:   { x: 8,  y: 0 },
  right:  { x: -8, y: 0 },
};

function useSideObserver(elRef: React.RefObject<HTMLDivElement | null>) {
  const [side, setSide] = React.useState("bottom");
  React.useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-side") {
          setSide(el.getAttribute("data-side") ?? "bottom");
        }
      }
    });
    observer.observe(el, { attributes: true });
    setSide(el.getAttribute("data-side") ?? "bottom");
    return () => observer.disconnect();
  }, [elRef]);
  return side;
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors duration-fast ease-out focus:bg-[var(--bg-surface-2)] data-[state=open]:bg-[var(--bg-surface-2)]",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  const sideRef = React.useRef<HTMLDivElement>(null);
  const side = useSideObserver(sideRef);
  const offset = sideOffsetMap[side] ?? sideOffsetMap.bottom;

  return (
    <DropdownMenuPrimitive.SubContent
      ref={mergeRefs(ref, sideRef)}
      {...props}
      asChild
      forceMount
    >
      <motion.div
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x, y: offset.y, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x * 0.5, y: offset.y * 0.5, scale: 0.98 }}
        transition={shouldReduce ? reducedSpring : dropdownSpring}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-[var(--text-primary)] shadow-medium will-change-transform",
          className
        )}
      />
    </DropdownMenuPrimitive.SubContent>
  );
});
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, children, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  const sideRef = React.useRef<HTMLDivElement>(null);
  const side = useSideObserver(sideRef);
  const offset = sideOffsetMap[side] ?? sideOffsetMap.bottom;
  const counterRef = React.useRef(0);

  const ctx = React.useMemo(() => ({
    register: () => counterRef.current++,
    reset: () => { counterRef.current = 0; },
  }), []);

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={mergeRefs(ref, sideRef)}
        sideOffset={sideOffset}
        {...props}
        asChild
        forceMount
      >
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x, y: offset.y, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: offset.x * 0.5, y: offset.y * 0.5, scale: 0.98 }}
          transition={shouldReduce ? reducedSpring : dropdownSpring}
          onAnimationStart={() => ctx.reset()}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-[var(--text-primary)] shadow-medium will-change-transform",
            className
          )}
        >
          <StaggerContext.Provider value={ctx}>
            {children}
          </StaggerContext.Provider>
        </motion.div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const itemStaggerDelay = 0.025;
const maxStaggerItems = 12;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  const { register } = useStagger();
  const index = React.useMemo(() => register(), [register]);
  const delay = Math.min(index, maxStaggerItems) * itemStaggerDelay;

  return (
    <motion.div
      initial={shouldReduce ? {} : { opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={shouldReduce ? {} : { duration: 0.2, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors duration-fast ease-out focus:bg-[var(--bg-surface-2)] focus:text-[var(--text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          inset && "pl-8",
          className
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Item>
    </motion.div>
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors duration-fast ease-out focus:bg-[var(--bg-surface-2)] focus:text-[var(--text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--accent-primary)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors duration-fast ease-out focus:bg-[var(--bg-surface-2)] focus:text-[var(--text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-semibold text-[var(--text-tertiary)]",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--border-subtle)]", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName =
  DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-[var(--text-tertiary)]",
        className
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
