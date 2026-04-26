"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import {
  useOnboarding,
  TOUR_STEP_COUNT,
} from "@/src/hooks/useOnboarding";
import { WelcomeModal } from "./WelcomeModal";
import { TourStep, type TourStepData } from "./TourStep";

const TOUR_STEPS: TourStepData[] = [
  {
    id: "welcome",
    title: "Welcome to Computer",
    description:
      "Your multi-model, multi-agent orchestration platform. Let's take a quick tour to get you started.",
    placement: "center",
  },
  {
    id: "composer",
    title: "This is your composer",
    description:
      "Describe what you want Computer to do. Use slash commands (/) for advanced options like spaces, budgets, and connectors.",
    targetSelector: "[data-tour='composer']",
    placement: "bottom",
  },
  {
    id: "run",
    title: "Run your first workflow",
    description:
      "Press Cmd+Enter or click the Run button to execute. Computer will orchestrate the best models and agents for your task.",
    targetSelector: "[data-tour='run-button']",
    placement: "top",
  },
  {
    id: "library",
    title: "View your workflows",
    description:
      "All your past and current workflows live in the Library. Filter by status, search objectives, and inspect results.",
    targetSelector: "[data-tour='nav-library']",
    placement: "right",
  },
  {
    id: "connectors",
    title: "Connect your tools",
    description:
      "Integrate databases, APIs, and SaaS tools so agents can read and write real data during execution.",
    targetSelector: "[data-tour='nav-connectors']",
    placement: "right",
  },
  {
    id: "discover",
    title: "Explore templates",
    description:
      "Browse pre-built workflow templates from the community. Deploy them in one click and customize to your needs.",
    targetSelector: "[data-tour='nav-discover']",
    placement: "right",
  },
];

/**
 * Spotlight overlay that dims the entire page except a cut-out around
 * the active tour target.
 */
function SpotlightOverlay({
  targetSelector,
  visible,
}: {
  targetSelector?: string;
  visible: boolean;
}) {
  const [cutout, setCutout] = React.useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    if (!visible || !targetSelector) {
      setCutout(null);
      return;
    }
    const compute = () => {
      const el = document.querySelector(targetSelector);
      if (!el) {
        setCutout(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setCutout({
        x: rect.left - 8,
        y: rect.top - 8,
        w: rect.width + 16,
        h: rect.height + 16,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    const id = setInterval(compute, 400);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
      clearInterval(id);
    };
  }, [visible, targetSelector]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[var(--z-modal-backdrop)] pointer-events-none"
        >
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {cutout && (
                  <rect
                    x={cutout.x}
                    y={cutout.y}
                    width={cutout.w}
                    height={cutout.h}
                    rx={12}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.55)"
              mask="url(#tour-spotlight-mask)"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Pulsing ring around the active target element to draw attention.
 */
function TargetPulse({
  targetSelector,
  visible,
}: {
  targetSelector?: string;
  visible: boolean;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  useEffect(() => {
    if (!visible || !targetSelector) {
      setRect(null);
      return;
    }
    const compute = () => {
      const el = document.querySelector(targetSelector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    const id = setInterval(compute, 400);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
      clearInterval(id);
    };
  }, [visible, targetSelector]);

  if (!rect) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed z-[var(--z-modal-backdrop)] pointer-events-none"
      style={{
        left: rect.left - 6,
        top: rect.top - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        borderRadius: 12,
        boxShadow: "0 0 0 2px var(--accent-primary)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-[var(--accent-primary)]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/**
 * OnboardingTour
 *
 * Renders the welcome modal (step 0) and floating tooltips for the remaining
 * tour steps. Includes a spotlight overlay and target pulse for the active step.
 */
export function OnboardingTour() {
  const {
    state,
    isNewUser,
    dismissWelcome,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    optOut,
  } = useOnboarding();

  // Show welcome modal for new users or users who haven't dismissed it yet
  const showWelcome =
    isNewUser || (!state.welcomeDismissed && !state.tourOptedOut);

  // Tour is active when currentStep >= 0 and not completed
  const tourActive =
    state.currentStep >= 0 &&
    state.currentStep < TOUR_STEP_COUNT &&
    !state.tourOptedOut;

  // Active step data
  const activeStep = tourActive ? TOUR_STEPS[state.currentStep] : null;

  // When the welcome modal is dismissed without starting the tour,
  // mark it as dismissed but don't start the tour steps.
  const handleDismiss = () => {
    dismissWelcome();
  };

  const handleStartTour = () => {
    startTour();
  };

  const handleSkip = () => {
    skipTour();
  };

  const handleOptOut = () => {
    optOut();
  };

  return (
    <>
      {/* Welcome modal */}
      <WelcomeModal
        open={showWelcome}
        onStartTour={handleStartTour}
        onDismiss={handleDismiss}
        onOptOut={handleOptOut}
      />

      {/* Spotlight + pulse behind tooltip */}
      <SpotlightOverlay
        targetSelector={activeStep?.targetSelector}
        visible={tourActive && !!activeStep?.targetSelector}
      />
      <TargetPulse
        targetSelector={activeStep?.targetSelector}
        visible={tourActive && !!activeStep?.targetSelector}
      />

      {/* Tour steps */}
      {TOUR_STEPS.map((step, index) => (
        <TourStep
          key={step.id}
          step={step}
          stepIndex={index}
          totalSteps={TOUR_STEPS.length}
          isActive={tourActive && state.currentStep === index}
          onNext={
            index === TOUR_STEPS.length - 1
              ? skipTour // finish = dismiss
              : nextStep
          }
          onPrev={prevStep}
          onSkip={handleSkip}
        />
      ))}
    </>
  );
}

/**
 * A lightweight button that can be placed anywhere to restart the tour.
 */
export function RestartTourButton({
  className,
}: {
  className?: string;
}) {
  const { startTour, state } = useOnboarding();

  if (state.tourOptedOut) return null;

  return (
    <button
      onClick={startTour}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
        "border border-[var(--border-default)] text-[var(--text-secondary)]",
        "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
        "transition-colors",
        className
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      Restart Tour
    </button>
  );
}
