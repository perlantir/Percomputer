/**
 * AmendWorkflowDialog.tsx
 *
 * Amend dialog:
 * - Text input for additional instructions
 * - "Also include EU competitors" example
 * - Submit → sends amendment request
 */

"use client";

import React, { useState, useCallback } from "react";
import { PencilLine, Send, Lightbulb } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

export interface AmendWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  onAmend?: (instruction: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

const QUICK_HINTS = [
  "Also include EU competitors",
  "Focus on pricing strategy only",
  "Add a risk assessment section",
  "Compare with Q3 results",
  "Make it more technical",
];

export function AmendWorkflowDialog({
  open,
  onOpenChange,
  workflowId,
  onAmend,
  isSubmitting = false,
}: AmendWorkflowDialogProps) {
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = instruction.trim();
    if (!trimmed) {
      setError("Please enter an amendment instruction.");
      return;
    }
    setError(null);

    try {
      // If no external handler provided, call the API directly
      if (onAmend) {
        await onAmend(trimmed);
      } else {
        const res = await fetch(`/api/workflows/${workflowId}/amend`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction: trimmed }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          throw new Error(`Amendment failed: ${res.status} ${text}`);
        }
      }

      toast.success("Amendment submitted", "Your amendment has been sent to the orchestrator.");
      setInstruction("");
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("Amendment failed", msg);
    }
  }, [instruction, workflowId, onAmend, onOpenChange]);

  const applyHint = useCallback((hint: string) => {
    setInstruction(hint);
    setError(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-5 w-5 text-[var(--accent-primary)]" />
            Amend Workflow
          </DialogTitle>
          <DialogDescription>
            Add instructions to refine or extend the current workflow.
            The orchestrator will replan and continue execution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Text input */}
          <div className="space-y-1.5">
            <label
              htmlFor="amend-instruction"
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Additional instruction
            </label>
            <textarea
              id="amend-instruction"
              rows={4}
              value={instruction}
              onChange={(e) => {
                setInstruction(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Also include EU competitors, add a comparison table, focus on 2025 projections..."
              disabled={isSubmitting}
              className={cn(
                "w-full resize-none rounded-md border bg-[var(--bg-surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]",
                error
                  ? "border-[var(--semantic-danger)]"
                  : "border-[var(--border-subtle)]"
              )}
            />
            {error && (
              <p className="text-xs text-[var(--semantic-danger)]">{error}</p>
            )}
          </div>

          {/* Quick hints */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Quick hints</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_HINTS.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => applyHint(hint)}
                  disabled={isSubmitting}
                  className={cn(
                    "rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]",
                    instruction === hint &&
                      "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  )}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !instruction.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Amendment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
