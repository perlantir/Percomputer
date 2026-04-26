"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "agent-platform-onboarding";

export interface OnboardingState {
  /** Has the user completed or dismissed the welcome modal */
  welcomeDismissed: boolean;
  /** Has the user explicitly opted out of the tour forever */
  tourOptedOut: boolean;
  /** Has the user completed the full tour */
  tourCompleted: boolean;
  /** Current step index (0-based); -1 means not started */
  currentStep: number;
  /** Track which checklist items are done */
  checklist: {
    createWorkflow: boolean;
    exploreLibrary: boolean;
    connectConnector: boolean;
    inviteTeam: boolean;
  };
  /** When the user first visited (timestamp) */
  firstVisitAt: number | null;
}

const DEFAULT_STATE: OnboardingState = {
  welcomeDismissed: false,
  tourOptedOut: false,
  tourCompleted: false,
  currentStep: -1,
  checklist: {
    createWorkflow: false,
    exploreLibrary: false,
    connectConnector: false,
    inviteTeam: false,
  },
  firstVisitAt: null,
};

function readState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      checklist: {
        ...DEFAULT_STATE.checklist,
        ...parsed.checklist,
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

function useOnboardingStorage(): OnboardingState {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);

  useEffect(() => {
    setState(readState());

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setState(readState());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return state;
}

/* ───────────────────────────────────────── */

export function useOnboarding() {
  const state = useOnboardingStorage();

  const dismissWelcome = useCallback(() => {
    const next = {
      ...readState(),
      welcomeDismissed: true,
      firstVisitAt: readState().firstVisitAt ?? Date.now(),
    };
    writeState(next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const startTour = useCallback(() => {
    const next = {
      ...readState(),
      welcomeDismissed: true,
      currentStep: 0,
      firstVisitAt: readState().firstVisitAt ?? Date.now(),
    };
    writeState(next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const nextStep = useCallback(() => {
    const prev = readState();
    const nextStepIndex = prev.currentStep + 1;
    const next = {
      ...prev,
      currentStep: nextStepIndex,
      tourCompleted: nextStepIndex >= TOUR_STEP_COUNT,
    };
    writeState(next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const prevStep = useCallback(() => {
    const prev = readState();
    const next = {
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    };
    writeState(next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const skipTour = useCallback(() => {
    const prev = readState();
    const next = { ...prev, currentStep: -1, tourCompleted: false };
    writeState(next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const optOut = useCallback(() => {
    const prev = readState();
    const next = {
      ...prev,
      welcomeDismissed: true,
      tourOptedOut: true,
      currentStep: -1,
    };
    writeState(next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const completeChecklistItem = useCallback(
    (key: keyof OnboardingState["checklist"]) => {
      const prev = readState();
      const next = {
        ...prev,
        checklist: { ...prev.checklist, [key]: true },
      };
      writeState(next);
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    },
    []
  );

  const resetOnboarding = useCallback(() => {
    writeState(DEFAULT_STATE);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const isNewUser =
    !state.welcomeDismissed &&
    !state.tourOptedOut &&
    !state.tourCompleted &&
    state.firstVisitAt === null;

  const checklistProgress = Object.values(state.checklist).filter(Boolean)
    .length;
  const checklistTotal = Object.keys(state.checklist).length;

  return {
    state,
    isNewUser,
    checklistProgress,
    checklistTotal,
    dismissWelcome,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    optOut,
    completeChecklistItem,
    resetOnboarding,
  };
}

/** Number of tour steps defined in the UI */
export const TOUR_STEP_COUNT = 6;
