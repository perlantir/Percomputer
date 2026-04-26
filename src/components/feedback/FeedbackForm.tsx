"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import {
  Star,
  Camera,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Bug,
  Lightbulb,
  Gauge,
  MousePointerClick,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { useFeedbackStore, type FeedbackCategory } from "./feedbackStore";
import { useSubmitFeedback } from "./useFeedback";

const CATEGORIES: { value: FeedbackCategory; label: string; icon: typeof Bug }[] = [
  { value: "general", label: "General", icon: MessageSquare },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "performance", label: "Performance", icon: Gauge },
  { value: "usability", label: "Usability", icon: MousePointerClick },
];

const RATING_LABELS: Record<number, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

export interface FeedbackFormProps {
  className?: string;
}

export function FeedbackForm({ className }: FeedbackFormProps) {
  const store = useFeedbackStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mutation = useSubmitFeedback();

  const {
    rating,
    comment,
    category,
    screenshot,
    isSubmitting,
    submitError,
    submitSuccess,
    setRating,
    setComment,
    setCategory,
    setScreenshot,
    reset,
  } = store;

  // ── Screenshot capture ──

  const handleCaptureScreenshot = useCallback(async () => {
    try {
      // Try using the native Screen Capture API first
      if (typeof navigator !== "undefined" && "mediaDevices" in navigator) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" },
          audio: false,
        } as DisplayMediaStreamOptions);

        const video = document.createElement("video");
        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          setScreenshot(dataUrl);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      // Fallback: trigger file input for manual upload
      fileInputRef.current?.click();
    }
  }, [setScreenshot]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        store.setSubmitError("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        store.setSubmitError("Image must be smaller than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          setScreenshot(result);
        }
      };
      reader.readAsDataURL(file);

      // Reset input
      e.target.value = "";
    },
    [setScreenshot, store]
  );

  const handleRemoveScreenshot = useCallback(() => {
    setScreenshot(null);
  }, [setScreenshot]);

  // ── Submit ──

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (rating === 0) {
        store.setSubmitError("Please select a rating");
        return;
      }

      if (comment.trim().length < 3) {
        store.setSubmitError("Please enter at least 3 characters");
        return;
      }

      store.setSubmitError(null);

      await mutation.mutateAsync({
        rating,
        comment: comment.trim(),
        category,
        screenshot: screenshot ?? undefined,
      });
    },
    [rating, comment, category, screenshot, mutation, store]
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // ── Success State ──

  if (submitSuccess) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-5 py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300",
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Thank you!
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-[16rem]">
            Your feedback has been submitted successfully. We appreciate your help
            in making our platform better.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          className="mt-2"
        >
          <RotateCcw className="w-4 h-4" />
          Send another
        </Button>
      </div>
    );
  }

  // ── Form ──

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-5", className)}
    >
      {/* Category selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ease-out border",
                category === value
                  ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                  : "bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          How would you rate your experience?
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                "p-0.5 rounded transition-all duration-150 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:rounded-md",
                star <= rating
                  ? "text-amber-400"
                  : "text-[var(--text-tertiary)] hover:text-amber-300"
              )}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <Star
                className={cn(
                  "w-7 h-7 transition-all duration-150",
                  star <= rating && "fill-current"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-[var(--text-secondary)] animate-in fade-in slide-in-from-left-1">
              {RATING_LABELS[rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label
          htmlFor="feedback-comment"
          className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
        >
          Comments
          <span className="text-[var(--semantic-danger)] ml-0.5">*</span>
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          rows={4}
          maxLength={2000}
          className={cn(
            "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5",
            "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
            "resize-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:border-transparent",
            "transition-all duration-150 ease-out"
          )}
        />
        <div className="flex justify-end">
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {comment.length}/2000
          </span>
        </div>
      </div>

      {/* Screenshot attachment */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Screenshot
          <span className="normal-case font-normal text-[var(--text-quaternary)] ml-1">
            (optional)
          </span>
        </label>

        {screenshot ? (
          <div className="relative rounded-lg border border-[var(--border-subtle)] overflow-hidden group">
            <Image
              src={screenshot}
              alt="Attached screenshot preview"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleRemoveScreenshot}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--bg-surface)]/90 text-[var(--semantic-danger)] text-xs font-medium hover:bg-[var(--bg-surface)] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
            <button
              type="button"
              onClick={handleRemoveScreenshot}
              className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-[var(--text-inverse)] hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove screenshot"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCaptureScreenshot}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-6 rounded-lg",
              "border border-dashed border-[var(--border-default)]",
              "text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              "hover:bg-[var(--bg-surface-2)] hover:border-[var(--accent-primary)]/40",
              "transition-all duration-150 ease-out"
            )}
          >
            <Camera className="w-4 h-4" />
            <span>Take screenshot or upload image</span>
          </button>
        )}

        {/* Hidden file input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Error message */}
      {submitError && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/20 px-3 py-2.5",
            "animate-in fade-in slide-in-from-top-1"
          )}
        >
          <AlertCircle className="w-4 h-4 text-[var(--semantic-danger)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--semantic-danger)]">{submitError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => store.close()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isSubmitting || mutation.isPending}
          disabled={rating === 0 || comment.trim().length < 3}
        >
          <Send className="w-3.5 h-3.5" />
          {isSubmitting || mutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
}
