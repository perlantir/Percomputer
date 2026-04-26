"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
  maxRows?: number;
  minRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow = false, maxRows = 10, minRows = 2, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = useCombinedRefs(ref, textareaRef);

    const adjustHeight = React.useCallback(() => {
      if (!autoGrow || !textareaRef.current) return;
      const el = textareaRef.current;
      el.style.height = "auto";
      const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
      el.style.height = `${newHeight}px`;
    }, [autoGrow, maxRows, minRows]);

    React.useEffect(() => {
      if (autoGrow) {
        adjustHeight();
      }
    }, [autoGrow, adjustHeight]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoGrow) {
        adjustHeight();
      }
      props.onInput?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors duration-fast ease-out placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          autoGrow && "overflow-hidden",
          className
        )}
        ref={combinedRef}
        onInput={handleInput}
        rows={minRows}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

function useCombinedRefs<T>(...refs: React.Ref<T>[]) {
  return React.useCallback(
    (value: T) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(value);
        } else if (ref && "current" in ref) {
          (ref as React.MutableRefObject<T>).current = value;
        }
      });
    },
    [refs]
  );
}

export { Textarea };
