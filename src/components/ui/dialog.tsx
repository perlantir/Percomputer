"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/src/lib/utils";

/* ── shared spring presets ── */
const overlaySpring = { type: "spring" as const, stiffness: 500, damping: 38, mass: 0.8 };
const contentSpring  = { type: "spring" as const, stiffness: 380, damping: 30, mass: 0.9 };
const reducedSpring  = { type: "spring" as const, stiffness: 500, damping: 50, mass: 0.5 };

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  return (
    <DialogPrimitive.Overlay ref={ref} asChild forceMount {...props}>
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={shouldReduce ? reducedSpring : overlaySpring}
        className={cn(
          "fixed inset-0 z-50 bg-[var(--bg-canvas)]/80 will-change-[opacity,backdrop-filter]",
          className
        )}
      />
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const shouldReduce = useReducedMotion();
  return (
    <DialogPortal>
      <AnimatePresence>
        <div className="contents" key="dialog-wrapper">
          <DialogOverlay />
          <DialogPrimitive.Content
            ref={ref}
            asChild
            forceMount
            {...props}
          >
            <motion.div
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: "-48%", scale: 0.94, x: "-50%" }}
              animate={{ opacity: 1, y: "-50%", scale: 1, x: "-50%" }}
              exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: "-48%", scale: 0.96, x: "-50%" }}
              transition={shouldReduce ? reducedSpring : contentSpring}
              className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg gap-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-high rounded-lg will-change-transform",
                className
              )}
            >
              {children}
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-[var(--bg-canvas)] transition-all duration-fast ease-out hover:opacity-100 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:transition-shadow focus:duration-fast disabled:pointer-events-none data-[state=open]:bg-[var(--bg-surface-2)] data-[state=open]:text-[var(--text-secondary)]">
                <X className="h-4 w-4 text-[var(--text-secondary)] transition-transform duration-fast ease-out" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </div>
      </AnimatePresence>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-lg font-semibold leading-none tracking-tight text-[var(--text-primary)]",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
