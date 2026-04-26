import React from 'react';
import { cn } from "@/src/lib/utils";

interface MainPaneProps {
  children: React.ReactNode;
  className?: string;
  hasMobileNav?: boolean;
}

export function MainPane({ children, className, hasMobileNav = true }: MainPaneProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        'relative min-h-screen flex-1 overflow-y-auto bg-[var(--bg-canvas)]',
        hasMobileNav && 'pb-16 sm:pb-0',
        className
      )}
    >
      {children}
    </main>
  );
}
