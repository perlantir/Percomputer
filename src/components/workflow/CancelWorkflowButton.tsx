/**
 * CancelWorkflowButton.tsx
 *
 * Cancel button with confirmation:
 * - Danger style
 * - Confirm dialog
 * - Calls DELETE /api/workflows/{id}
 */

"use client";

import React, { useState, useCallback } from "react";
import { OctagonAlert, X, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";

export interface CancelWorkflowButtonProps {
  workflowId: string;
  onCancel?: () => Promise<void> | void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CancelWorkflowButton({
  workflowId,
  onCancel,
  size = "md",
  className,
}: CancelWorkflowButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setIsCancelling(true);
    setError(null);

    try {
      if (onCancel) {
        await onCancel();
      } else {
        const res = await fetch(`/api/workflows/${workflowId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          throw new Error(`Cancel failed: ${res.status} ${text}`);
        }
      }
      toast.info("Workflow cancelled", "The workflow has been cancelled successfully.");
      setConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("Cancel failed", msg);
    } finally {
      setIsCancelling(false);
    }
  }, [workflowId, onCancel]);

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <>
      <Button
        variant="danger"
        size={size}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
        className={cn(className)}
      >
        <OctagonAlert className="h-4 w-4" />
        <span>Cancel</span>
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
              <OctagonAlert className="h-6 w-6 text-[var(--semantic-danger)]" />
            </div>
            <DialogTitle className="text-center">Cancel Workflow?</DialogTitle>
            <DialogDescription className="text-center">
              This will immediately stop all running tasks. Any partial results
              may be lost. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="rounded-md bg-[var(--semantic-danger)]/10 px-3 py-2 text-sm text-[var(--semantic-danger)]">
              {error}
            </p>
          )}

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={isCancelling}
            >
              <X className="h-4 w-4" />
              Keep Running
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <OctagonAlert className="h-4 w-4" />
                  Yes, Cancel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
