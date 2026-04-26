"use client";

import { ToastProvider, ToastViewport } from "@radix-ui/react-toast";

export function Toaster() {
  return (
    <ToastProvider swipeDirection="right">
      <ToastViewport className="fixed bottom-4 right-4 z-[var(--z-toast)] flex w-80 flex-col gap-2 p-4" />
    </ToastProvider>
  );
}
