import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-2 text-sm shadow-sm transition-colors duration-fast ease-out placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[var(--border-default)]",
        ghost:
          "border-transparent bg-[var(--bg-surface-2)] focus-visible:bg-[var(--bg-surface)]",
        error:
          "border-[var(--semantic-danger)] text-[var(--semantic-danger)] placeholder:text-[var(--semantic-danger)]/50 focus-visible:ring-[var(--semantic-danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      label,
      helperText,
      errorMessage,
      iconLeft,
      iconRight,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconLeft && (
            <div className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none">
              {iconLeft}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              inputVariants({ variant: variant || (errorMessage ? "error" : "default") }),
              iconLeft && "pl-10",
              iconRight && "pr-10",
              className
            )}
            aria-invalid={!!errorMessage}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 text-[var(--text-tertiary)] pointer-events-none">
              {iconRight}
            </div>
          )}
        </div>
        {errorMessage && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[var(--semantic-danger)]"
          >
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-[var(--text-secondary)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
