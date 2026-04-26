"use client";

/**
 * TanStack Query hooks for feedback submission.
 */

import { useMutation } from "@tanstack/react-query";
import { useFeedbackStore, type FeedbackCategory } from "./feedbackStore";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackPayload {
  rating: number;
  comment: string;
  category: FeedbackCategory;
  screenshot?: string; // base64 data URL
  email?: string;
  pageUrl: string;
  userAgent: string;
  timestamp: string;
}

export interface FeedbackResponse {
  id: string;
  message: string;
}

// ── API helper ───────────────────────────────────────────────────────────────

async function submitFeedbackApi(
  payload: FeedbackPayload
): Promise<FeedbackResponse> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${process.env.NEXT_PUBLIC_FEEDBACK_API_TOKEN || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to submit feedback");
  }

  return res.json();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSubmitFeedback() {
  const store = useFeedbackStore();

  return useMutation<FeedbackResponse, Error, Omit<FeedbackPayload, "pageUrl" | "userAgent" | "timestamp">>({
    mutationFn: async (input) => {
      const payload: FeedbackPayload = {
        ...input,
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      };

      store.setIsSubmitting(true);
      store.setSubmitError(null);

      try {
        const result = await submitFeedbackApi(payload);
        return result;
      } finally {
        store.setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      store.setSubmitSuccess(true);
    },
    onError: (error) => {
      store.setSubmitError(error.message);
    },
  });
}
