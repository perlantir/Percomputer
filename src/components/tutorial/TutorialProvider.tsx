"use client";

import { useEffect, useRef } from "react";
import { useTutorialStore } from "./tutorialStore";
import { TutorialStepOverlay } from "./TutorialStep";
import type { TutorialProviderProps } from "./tutorialTypes";

/**
 * TutorialProvider — Context/wrapper that hydrates the tutorial store
 * and renders the active step overlay when a tutorial is running.
 *
 * Usage:
 *   <TutorialProvider tutorials={[gettingStartedTut, advancedTut]}>
 *     <App />
 *   </TutorialProvider>
 */
export function TutorialProvider({
  children,
  tutorials = [],
  zIndex = 9999,
}: TutorialProviderProps) {
  const isHydrated = useTutorialStore((s) => s.isHydrated);
  const _hydrate = useTutorialStore((s) => s._hydrate);
  const registerTutorials = useTutorialStore((s) => s.registerTutorials);

  const session = useTutorialStore((s) => s.session);
  const activeTutorial = useTutorialStore((s) => s.activeTutorial);
  const currentStep = useTutorialStore((s) => s.currentStep);

  const hasPrevious =
    activeTutorial !== null && session.currentStepIndex > 0;
  const hasNext =
    activeTutorial !== null &&
    session.currentStepIndex < activeTutorial.steps.length - 1;

  const nextStep = useTutorialStore((s) => s.nextStep);
  const previousStep = useTutorialStore((s) => s.previousStep);
  const skipTutorial = useTutorialStore((s) => s.skipTutorial);

  // Hydrate once on mount
  useEffect(() => {
    if (!isHydrated) {
      _hydrate();
    }
  }, [isHydrated, _hydrate]);

  // Register initial tutorials
  useEffect(() => {
    if (tutorials.length > 0) {
      registerTutorials(tutorials);
    }
  }, [tutorials, registerTutorials]);

  // Sync localStorage changes across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "agent-platform-tutorials") {
        useTutorialStore.getState().restoreProgress();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const overlayVisible = session.isRunning && session.isVisible && currentStep;

  return (
    <>
      {children}

      {overlayVisible && currentStep && activeTutorial && (
        <TutorialStepOverlay
          step={currentStep}
          stepNumber={session.currentStepIndex + 1}
          totalSteps={activeTutorial.steps.length}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={previousStep}
          onNext={nextStep}
          onSkip={skipTutorial}
          zIndex={zIndex}
        />
      )}
    </>
  );
}
