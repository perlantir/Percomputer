import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-pill font-ui font-medium transition-colors duration-fast ease-out",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)]",
        success:
          "bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border border-[var(--semantic-success)]/25",
        warning:
          "bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/25",
        danger:
          "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/25",
        info:
          "bg-[var(--semantic-info)]/15 text-[var(--semantic-info)] border border-[var(--semantic-info)]/25",
        accent:
          "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] leading-4",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
