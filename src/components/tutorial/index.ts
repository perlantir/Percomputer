/**
 * Interactive tutorial / walkthrough system components.
 *
 * Provides a full-featured onboarding experience with element highlighting,
 * tooltip explanations, step navigation, and progress persistence.
 *
 * Quick start:
 *   <TutorialProvider tutorials={[myTutorial]}>
 *     <App />
 *   </TutorialProvider>
 *
 *   const { start, isRunning, next, skip } = useTutorial();
 */

export { TutorialProvider } from "./TutorialProvider";
export { TutorialStepOverlay } from "./TutorialStep";
export { TutorialProgress, TutorialProgressInline } from "./TutorialProgress";
export { useTutorialStore } from "./tutorialStore";

// Types
export type {
  Tutorial,
  TutorialStep,
  TutorialProgress,
  TutorialSessionState,
  TutorialProviderProps,
  TutorialStepOverlayProps,
  TutorialProgressProps,
  TooltipPlacement,
} from "./tutorialTypes";
