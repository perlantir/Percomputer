"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Tutorial,
  TutorialProgress,
  TutorialSessionState,
} from "./tutorialTypes";

const STORAGE_KEY = "agent-platform-tutorials";

/* ── localStorage helpers ── */

function readProgress(): Record<string, TutorialProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, TutorialProgress>;
  } catch {
    return {};
  }
}

function writeProgress(progress: Record<string, TutorialProgress>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* ignore quota errors */
  }
}

function broadcast() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

/* ── Store interface ── */

interface TutorialStore {
  // ── Registry ──
  tutorials: Record<string, Tutorial>;
  registerTutorial: (tutorial: Tutorial) => void;
  registerTutorials: (tutorials: Tutorial[]) => void;
  unregisterTutorial: (id: string) => void;

  // ── Session ──
  session: TutorialSessionState;

  // ── Progress (persisted) ──
  progress: Record<string, TutorialProgress>;

  // ── Computed ──
  activeTutorial: Tutorial | null;
  currentStep: import("./tutorialTypes").TutorialStep | null;
  currentProgress: TutorialProgress | null;

  // ── Actions ──
  startTutorial: (tutorialId: string, fromStep?: number) => boolean;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  goToStep: (stepIndex: number) => void;
  resetTutorial: (tutorialId: string) => void;
  dismissTutorial: () => void;
  restoreProgress: () => void;

  // ── Hydration ──
  isHydrated: boolean;
  _hydrate: () => void;
}

const DEFAULT_SESSION: TutorialSessionState = {
  activeTutorialId: null,
  currentStepIndex: 0,
  isRunning: false,
  isVisible: false,
};

export const useTutorialStore = create<TutorialStore>()(
  devtools(
    (set, get) => ({
      /* ── initial state ── */
      tutorials: {},
      session: { ...DEFAULT_SESSION },
      progress: {},
      isHydrated: false,

      /* ── computed ── */
      get activeTutorial() {
        const { session, tutorials } = get();
        if (!session.activeTutorialId) return null;
        return tutorials[session.activeTutorialId] ?? null;
      },

      get currentStep() {
        const { activeTutorial, session } = get();
        if (!activeTutorial || session.currentStepIndex < 0) return null;
        return activeTutorial.steps[session.currentStepIndex] ?? null;
      },

      get currentProgress() {
        const { session, progress } = get();
        if (!session.activeTutorialId) return null;
        return progress[session.activeTutorialId] ?? null;
      },

      /* ── registry actions ── */
      registerTutorial: (tutorial) =>
        set(
          (state) => ({
            tutorials: { ...state.tutorials, [tutorial.id]: tutorial },
          }),
          false,
          "registerTutorial"
        ),

      registerTutorials: (tutorials) =>
        set(
          (state) => {
            const next = { ...state.tutorials };
            for (const t of tutorials) {
              next[t.id] = t;
            }
            return { tutorials: next };
          },
          false,
          "registerTutorials"
        ),

      unregisterTutorial: (id) =>
        set(
          (state) => {
            const next = { ...state.tutorials };
            delete next[id];
            return { tutorials: next };
          },
          false,
          "unregisterTutorial"
        ),

      /* ── session actions ── */
      startTutorial: (tutorialId, fromStep = 0) => {
        const state = get();
        const tutorial = state.tutorials[tutorialId];
        if (!tutorial) return false;
        if (tutorial.steps.length === 0) return false;

        const stepIndex = Math.max(0, Math.min(fromStep, tutorial.steps.length - 1));

        set(
          {
            session: {
              activeTutorialId: tutorialId,
              currentStepIndex: stepIndex,
              isRunning: true,
              isVisible: true,
            },
          },
          false,
          "startTutorial"
        );

        // Fire onShow callback for the starting step
        const step = tutorial.steps[stepIndex];
        step?.onShow?.();

        return true;
      },

      nextStep: () => {
        const { activeTutorial, session, progress } = get();
        if (!activeTutorial) return;

        const nextIndex = session.currentStepIndex + 1;

        // Fire onNext for current step
        const currentStep = activeTutorial.steps[session.currentStepIndex];
        currentStep?.onNext?.();

        if (nextIndex >= activeTutorial.steps.length) {
          // Tutorial complete
          const tutorialId = session.activeTutorialId!;
          const nextProgress: TutorialProgress = {
            tutorialId,
            currentStep: activeTutorial.steps.length - 1,
            completed: true,
            dismissed: false,
            lastUpdated: new Date().toISOString(),
          };
          const nextProgressMap = { ...progress, [tutorialId]: nextProgress };
          writeProgress(nextProgressMap);
          broadcast();

          set(
            {
              session: { ...DEFAULT_SESSION },
              progress: nextProgressMap,
            },
            false,
            "nextStep/complete"
          );
        } else {
          const tutorialId = session.activeTutorialId!;
          const nextProgress: TutorialProgress = {
            tutorialId,
            currentStep: nextIndex,
            completed: false,
            dismissed: false,
            lastUpdated: new Date().toISOString(),
          };
          const nextProgressMap = { ...progress, [tutorialId]: nextProgress };
          writeProgress(nextProgressMap);

          set(
            {
              session: {
                ...session,
                currentStepIndex: nextIndex,
              },
              progress: nextProgressMap,
            },
            false,
            "nextStep"
          );

          // Fire onShow for next step
          const nextStep = activeTutorial.steps[nextIndex];
          nextStep?.onShow?.();
        }
      },

      previousStep: () => {
        const { activeTutorial, session } = get();
        if (!activeTutorial || session.currentStepIndex <= 0) return;

        const prevIndex = session.currentStepIndex - 1;
        set(
          {
            session: {
              ...session,
              currentStepIndex: prevIndex,
            },
          },
          false,
          "previousStep"
        );

        // Fire onShow for previous step
        const prevStep = activeTutorial.steps[prevIndex];
        prevStep?.onShow?.();
      },

      skipTutorial: () => {
        const { session, progress } = get();
        if (!session.activeTutorialId) return;

        const tutorialId = session.activeTutorialId;
        const nextProgress: TutorialProgress = {
          tutorialId,
          currentStep: session.currentStepIndex,
          completed: false,
          dismissed: true,
          lastUpdated: new Date().toISOString(),
        };
        const nextProgressMap = { ...progress, [tutorialId]: nextProgress };
        writeProgress(nextProgressMap);
        broadcast();

        set(
          {
            session: { ...DEFAULT_SESSION },
            progress: nextProgressMap,
          },
          false,
          "skipTutorial"
        );
      },

      completeTutorial: () => {
        const { session, progress } = get();
        if (!session.activeTutorialId) return;

        const tutorialId = session.activeTutorialId;
        const nextProgress: TutorialProgress = {
          tutorialId,
          currentStep: session.currentStepIndex,
          completed: true,
          dismissed: false,
          lastUpdated: new Date().toISOString(),
        };
        const nextProgressMap = { ...progress, [tutorialId]: nextProgress };
        writeProgress(nextProgressMap);
        broadcast();

        set(
          {
            session: { ...DEFAULT_SESSION },
            progress: nextProgressMap,
          },
          false,
          "completeTutorial"
        );
      },

      goToStep: (stepIndex) => {
        const { activeTutorial, session } = get();
        if (!activeTutorial) return;
        if (stepIndex < 0 || stepIndex >= activeTutorial.steps.length) return;

        set(
          {
            session: {
              ...session,
              currentStepIndex: stepIndex,
            },
          },
          false,
          "goToStep"
        );

        const step = activeTutorial.steps[stepIndex];
        step?.onShow?.();
      },

      resetTutorial: (tutorialId) => {
        const { progress, session } = get();
        const nextProgress = { ...progress };
        delete nextProgress[tutorialId];
        writeProgress(nextProgress);

        // If this tutorial is currently active, end the session
        const nextSession =
          session.activeTutorialId === tutorialId
            ? { ...DEFAULT_SESSION }
            : session;

        set({ progress: nextProgress, session: nextSession }, false, "resetTutorial");
      },

      dismissTutorial: () => {
        get().skipTutorial();
      },

      restoreProgress: () => {
        const saved = readProgress();
        set({ progress: saved, isHydrated: true }, false, "restoreProgress");
      },

      _hydrate: () => {
        const saved = readProgress();
        set({ progress: saved, isHydrated: true }, false, "_hydrate");
      },
    }),
    { name: "tutorial-store" }
  )
);
