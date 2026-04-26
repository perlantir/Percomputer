import * as React from "react";
import { cn } from "@/src/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  pulse?: boolean;
  shimmer?: boolean;
  delayMs?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, pulse = true, shimmer = false, delayMs = 0, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md",
        shimmer
          ? "shimmer-bg animate-shimmer"
          : ["bg-[var(--bg-surface-3)]", pulse && "animate-skeleton", !pulse && "opacity-60"],
        className
      )}
      style={{
        animationDelay: delayMs ? `${delayMs}ms` : undefined,
        ...style,
      }}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lineHeight?: string;
  lastLineWidth?: string;
  shimmer?: boolean;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      className,
      lines = 3,
      lineHeight = "h-4",
      lastLineWidth = "w-3/4",
      shimmer = false,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shimmer={shimmer}
          className={cn(
            lineHeight,
            i === lines - 1 ? lastLineWidth : "w-full"
          )}
        />
      ))}
    </div>
  )
);
SkeletonText.displayName = "SkeletonText";

export { Skeleton, SkeletonText };
