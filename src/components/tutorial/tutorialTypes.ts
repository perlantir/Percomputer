/**
 * Type definitions for the interactive tutorial / walkthrough system.
 */

/** Placement of the tooltip relative to the highlighted element */
export type TooltipPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end";

/** A single step inside a tutorial */
export interface TutorialStep {
  /** Unique step id (unique within the tutorial) */
  id: string;
  /** CSS selector for the target element to highlight */
  target: string;
  /** Step title shown in the tooltip */
  title: string;
  /** Body content / explanation */
  content: string;
  /** Tooltip placement preference */
  placement?: TooltipPlacement;
  /** Optional: action button text (defaults to "Next") */
  actionLabel?: string;
  /** Optional: secondary action label (defaults to "Skip") */
  secondaryLabel?: string;
  /** Optional: whether to show the previous button */
  showPrevious?: boolean;
  /** Optional: fixed position instead of attaching to a target element */
  position?: { top: string; left: string };
  /** Optional: custom offset from the target element */
  offset?: { x: number; y: number };
  /** Optional: callback fired when step is shown */
  onShow?: () => void;
  /** Optional: callback fired when step advances */
  onNext?: () => void;
  /** Optional: if true, user must click the target element to advance */
  waitForClick?: boolean;
}

/** A tutorial definition */
export interface Tutorial {
  /** Unique tutorial id */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this tutorial covers */
  description?: string;
  /** Ordered list of steps */
  steps: TutorialStep[];
  /** Optional: category for grouping */
  category?: string;
  /** Optional: whether the tutorial can be replayed */
  allowReplay?: boolean;
}

/** Persisted progress for a single tutorial */
export interface TutorialProgress {
  tutorialId: string;
  /** Index of the current step (0-based); -1 means not started */
  currentStep: number;
  /** Whether the tutorial has been completed */
  completed: boolean;
  /** Whether the tutorial was dismissed/skipped */
  dismissed: boolean;
  /** ISO timestamp of last interaction */
  lastUpdated: string;
}

/** Internal state for the active tutorial session */
export interface TutorialSessionState {
  /** Currently active tutorial id, or null */
  activeTutorialId: string | null;
  /** Index of the currently displayed step */
  currentStepIndex: number;
  /** Whether a tutorial is actively running */
  isRunning: boolean;
  /** Whether the overlay is visible */
  isVisible: boolean;
}

/** Props for the TutorialProvider */
export interface TutorialProviderProps {
  children: React.ReactNode;
  /** Optional: tutorials to register at mount time */
  tutorials?: Tutorial[];
  /** Optional: storage key prefix for localStorage */
  storageKey?: string;
  /** Optional: z-index for the overlay */
  zIndex?: number;
}

/** Props for the TutorialStep overlay component */
export interface TutorialStepOverlayProps {
  /** The step definition to render */
  step: TutorialStep;
  /** Current step number (1-based) */
  stepNumber: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether there is a previous step */
  hasPrevious: boolean;
  /** Whether there is a next step */
  hasNext: boolean;
  /** Callback to go to previous step */
  onPrevious: () => void;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to skip the tutorial */
  onSkip: () => void;
  /** Z-index for the overlay */
  zIndex?: number;
}

/** Props for the TutorialProgress component */
export interface TutorialProgressProps {
  /** The tutorial to show progress for */
  tutorial: Tutorial;
  /** Current step index (0-based) */
  currentStep: number;
  /** Optional: variant style */
  variant?: "dots" | "bar" | "steps";
  /** Optional: additional className */
  className?: string;
}
