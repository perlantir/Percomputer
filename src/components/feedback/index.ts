"use client";

/**
 * Feedback Widget
 *
 * A floating feedback collection widget with:
 * - Floating trigger button
 * - 1-5 star rating
 * - Comment textarea
 * - Screenshot capture/upload
 * - Category selection
 * - Submit to API via TanStack Query
 *
 * @example
 * ```tsx
 * // Place once in your layout/app
 * <FeedbackWidget />
 *
 * // Or use components individually
 * <FeedbackButton />
 * <FeedbackForm />
 * ```
 */

export { FeedbackWidget } from "./FeedbackWidget";
export { FeedbackButton } from "./FeedbackButton";
export { FeedbackForm } from "./FeedbackForm";

export { useFeedbackStore } from "./feedbackStore";
export { useSubmitFeedback } from "./useFeedback";

export type {
  FeedbackState,
  FeedbackCategory,
} from "./feedbackStore";

export type {
  FeedbackPayload,
  FeedbackResponse,
} from "./useFeedback";
