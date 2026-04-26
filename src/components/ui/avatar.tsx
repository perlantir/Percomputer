"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import Image from "next/image";
import { cn } from "@/src/lib/utils";

/* ── Blur data URL for placeholder (1x1 transparent pixel) ── */
const AVATAR_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/* ── AvatarImage with next/image optimization ── */
interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  /** Pixel size for the avatar (default: 40) */
  size?: number;
  /** Whether to use blur placeholder while loading (default: true) */
  blurPlaceholder?: boolean;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, size = 40, blurPlaceholder = true, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    asChild
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  >
    <Image
      src={props.src as string}
      alt={(props.alt as string) ?? ""}
      width={size}
      height={size}
      loading="lazy"
      placeholder={blurPlaceholder ? "blur" : undefined}
      blurDataURL={blurPlaceholder ? AVATAR_BLUR_DATA_URL : undefined}
      className={cn("aspect-square h-full w-full object-cover", className)}
      style={{ width: "100%", height: "100%" }}
    />
  </AvatarPrimitive.Image>
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[var(--bg-surface-2)] text-[var(--text-secondary)] font-ui font-medium",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, limit, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visible = limit ? childrenArray.slice(0, limit) : childrenArray;
    const remaining = limit ? childrenArray.length - limit : 0;

    return (
      <div
        ref={ref}
        className={cn("flex items-center -space-x-2", className)}
        {...props}
      >
        {visible}
        {remaining > 0 && (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface-3)] text-xs font-medium text-[var(--text-secondary)] ring-2 ring-[var(--bg-canvas)]">
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AvatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  getInitials,
  AvatarSizes,
};
