"use client";

import { useCallback, useMemo } from "react";
import { useTutorialStore } from "../components/tutorial/tutorialStore";
import type { Tutorial, TutorialStep, TutorialProgress } from "../components/tutorial/tutorialTypes";

export interface UseTutorialReturn {
  // ── State ──
  /** Whether the tutorial store has been hydrated from localStorage */
  isReady: boolean;
  /** Whether a tutorial is currently running */
  isRunning: boolean;
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Currently active tutorial, or null */
  activeTutorial: Tutorial | null;
  /** Current step definition, or null */
  currentStep: TutorialStep | null;
  /** 0-based index of the current step */
  currentStepIndex: number;
  /** Total number of steps in the active tutorial */
  totalSteps: number;
  /** Human-readable step label (e.g. "Step 2 of 5") */
  stepLabel: string;
  /** Persisted progress map for all tutorials */
  progress: Record<string, TutorialProgress>;
  /** Whether there is a previous step */
  hasPrevious: boolean;
  /** Whether there is a next step */
  hasNext: boolean;

  // ── Registry ──
  /** Register a tutorial dynamically */
  registerTutorial: (tutorial: Tutorial) => void;
  /** Register multiple tutorials */
  registerTutorials: (tutorials: Tutorial[]) => void;
  /** Unregister a tutorial */
  unregisterTutorial: (id: string) => void;
  /** Get all registered tutorials */
  allTutorials: Tutorial[];

  // ── Actions ──
  /** Start a tutorial by id (optionally from a specific step) */
  start: (tutorialId: string, fromStep?: number) => boolean;
  /** Advance to the next step */
  next: () => void;
  /** Go back to the previous step */
  previous: () => void;
  /** Skip / dismiss the active tutorial */
  skip: () => void;
  /** Mark the active tutorial as completed */
  complete: () => void;
  /** Jump to a specific step */
  goToStep: (index: number) => void;
  /** Reset a tutorial so it can be taken again */
  reset: (tutorialId: string) => void;
  /** Check if a tutorial has been completed */
  isCompleted: (tutorialId: string) => boolean;
  /** Check if a tutorial was dismissed */
  isDismissed: (tutorialId: string) => boolean;
  /** Get the last saved step for a tutorial */
  getSavedStep: (tutorialId: string) => number;
  /** Resume a tutorial from its last saved position */
  resume: (tutorialId: string) => boolean;
  /** Restart a tutorial from the beginning */
  restart: (tutorialId: string) => boolean;
}

/**
 * useTutorial — Primary hook for interacting with the tutorial system.
 *
 * Provides a unified API for starting, navigating, and monitoring tutorials.
 *
 * Example:
 *   const { start, isRunning, currentStep, next, skip } = useTutorial();
 *
 *   // Start a tutorial
 *   start("getting-started");
 *
 *   // Resume from where the user left off
 *   resume("getting-started");
 */
export function useTutorial(): UseTutorialReturn {
  const store = useTutorialStore;

  // ── Direct selectors ──
  const isReady = store((s) => s.isHydrated);
  const isRunning = store((s) => s.session.isRunning);
  const isVisible = store((s) => s.session.isVisible);
  const activeTutorial = store((s) => s.activeTutorial);
  const currentStep = store((s) => s.currentStep);
  const currentStepIndex = store((s) => s.session.currentStepIndex);
  const progress = store((s) => s.progress);
  const allTutorials = store((s) => Object.values(s.tutorials));

  // ── Computed ──
  const totalSteps = activeTutorial?.steps.length ?? 0;
  const stepLabel =
    totalSteps > 0
      ? `Step ${currentStepIndex + 1} of ${totalSteps}`
      : "";
  const hasPrevious = currentStepIndex > 0;
  const hasNext = currentStepIndex < totalSteps - 1;

  // ── Actions ──
  const registerTutorial = store((s) => s.registerTutorial);
  const registerTutorials = store((s) => s.registerTutorials);
  const unregisterTutorial = store((s) => s.unregisterTutorial);
  const startTutorial = store((s) => s.startTutorial);
  const nextStep = store((s) => s.nextStep);
  const previousStep = store((s) => s.previousStep);
  const skipTutorial = store((s) => s.skipTutorial);
  const completeTutorial = store((s) => s.completeTutorial);
  const goToStep = store((s) => s.goToStep);
  const resetTutorial = store((s) => s.resetTutorial);

  // ── Query helpers ──
  const isCompleted = useCallback(
    (tutorialId: string) => {
      return progress[tutorialId]?.completed ?? false;
    },
    [progress]
  );

  const isDismissed = useCallback(
    (tutorialId: string) => {
      return progress[tutorialId]?.dismissed ?? false;
    },
    [progress]
  );

  const getSavedStep = useCallback(
    (tutorialId: string) => {
      return progress[tutorialId]?.currentStep ?? 0;
    },
    [progress]
  );

  // ── Flow helpers ──
  const resume = useCallback(
    (tutorialId: string) => {
      const savedStep = getSavedStep(tutorialId);
      return startTutorial(tutorialId, savedStep);
    },
    [getSavedStep, startTutorial]
  );

  const restart = useCallback(
    (tutorialId: string) => {
      resetTutorial(tutorialId);
      return startTutorial(tutorialId, 0);
    },
    [resetTutorial, startTutorial]
  );

  return useMemo(
    () => ({
      // State
      isReady,
      isRunning,
      isVisible,
      activeTutorial,
      currentStep,
      currentStepIndex,
      totalSteps,
      stepLabel,
      progress,
      hasPrevious,
      hasNext,

      // Registry
      registerTutorial,
      registerTutorials,
      unregisterTutorial,
      allTutorials,

      // Actions
      start: startTutorial,
      next: nextStep,
      previous: previousStep,
      skip: skipTutorial,
      complete: completeTutorial,
      goToStep,
      reset: resetTutorial,

      // Queries
      isCompleted,
      isDismissed,
      getSavedStep,

      // Flow helpers
      resume,
      restart,
    }),
    [
      isReady,
      isRunning,
      isVisible,
      activeTutorial,
      currentStep,
      currentStepIndex,
      totalSteps,
      stepLabel,
      progress,
      hasPrevious,
      hasNext,
      registerTutorial,
      registerTutorials,
      unregisterTutorial,
      allTutorials,
      startTutorial,
      nextStep,
      previousStep,
      skipTutorial,
      completeTutorial,
      goToStep,
      resetTutorial,
      isCompleted,
      isDismissed,
      getSavedStep,
      resume,
      restart,
    ]
  );
}
