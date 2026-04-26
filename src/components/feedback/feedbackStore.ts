"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type FeedbackCategory =
  | "general"
  | "bug"
  | "feature"
  | "performance"
  | "usability";

export interface FeedbackState {
  // ── UI State ──
  isOpen: boolean;
  isMinimized: boolean;

  // ── Form State ──
  rating: number;
  comment: string;
  category: FeedbackCategory;
  screenshot: string | null; // base64 data URL
  email: string;

  // ── Submission ──
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  // ── Actions ──
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  restore: () => void;

  setRating: (rating: number) => void;
  setComment: (comment: string) => void;
  setCategory: (category: FeedbackCategory) => void;
  setScreenshot: (screenshot: string | null) => void;
  setEmail: (email: string) => void;

  setIsSubmitting: (value: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setSubmitSuccess: (value: boolean) => void;

  reset: () => void;
}

const DEFAULT_STATE = {
  isOpen: false,
  isMinimized: false,
  rating: 0,
  comment: "",
  category: "general" as FeedbackCategory,
  screenshot: null,
  email: "",
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,
};

export const useFeedbackStore = create<FeedbackState>()(
  devtools(
    (set) => ({
      ...DEFAULT_STATE,

      open: () =>
        set(
          { isOpen: true, isMinimized: false, submitSuccess: false, submitError: null },
          false,
          "feedback/open"
        ),

      close: () => set({ isOpen: false }, false, "feedback/close"),

      toggle: () =>
        set((state) => ({ isOpen: !state.isOpen }), false, "feedback/toggle"),

      minimize: () =>
        set({ isMinimized: true }, false, "feedback/minimize"),

      restore: () =>
        set({ isMinimized: false }, false, "feedback/restore"),

      setRating: (rating) =>
        set({ rating }, false, "feedback/setRating"),

      setComment: (comment) =>
        set({ comment }, false, "feedback/setComment"),

      setCategory: (category) =>
        set({ category }, false, "feedback/setCategory"),

      setScreenshot: (screenshot) =>
        set({ screenshot }, false, "feedback/setScreenshot"),

      setEmail: (email) =>
        set({ email }, false, "feedback/setEmail"),

      setIsSubmitting: (value) =>
        set({ isSubmitting: value }, false, "feedback/setIsSubmitting"),

      setSubmitError: (error) =>
        set({ submitError: error }, false, "feedback/setSubmitError"),

      setSubmitSuccess: (value) =>
        set({ submitSuccess: value }, false, "feedback/setSubmitSuccess"),

      reset: () => set(DEFAULT_STATE, false, "feedback/reset"),
    }),
    { name: "feedback-store" }
  )
);
