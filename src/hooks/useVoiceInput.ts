"use client";

import * as React from "react";

export interface VoiceInputState {
  isRecording: boolean;
  transcript: string;
  error: string | null;
}

export interface UseVoiceInputReturn extends VoiceInputState {
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
}

const SIMULATION_WORDS = [
  "create",
  "a",
  "detailed",
  "workflow",
  "that",
  "analyzes",
  "user",
  "feedback",
  "and",
  "generates",
  "actionable",
  "insights",
  "with",
  "charts",
  "and",
  "summaries",
  "include",
  "sentiment",
  "scoring",
  "and",
  "trend",
  "detection",
];

const WORD_INTERVAL_MS = 350;

/**
 * Simulates voice recording with a typing-like transcript animation.
 *
 * In production this would wrap the Web Speech API:
 *   const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
 */
export function useVoiceInput(): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const wordIndexRef = React.useRef(0);

  const clearSimulation = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRecording = React.useCallback(() => {
    setError(null);
    setTranscript("");
    wordIndexRef.current = 0;
    setIsRecording(true);

    intervalRef.current = setInterval(() => {
      const next = SIMULATION_WORDS[wordIndexRef.current];
      if (next === undefined) {
        clearSimulation();
        setIsRecording(false);
        return;
      }
      setTranscript((prev) => (prev ? `${prev} ${next}` : next));
      wordIndexRef.current += 1;
    }, WORD_INTERVAL_MS);
  }, [clearSimulation]);

  const stopRecording = React.useCallback(() => {
    clearSimulation();
    setIsRecording(false);
  }, [clearSimulation]);

  const reset = React.useCallback(() => {
    clearSimulation();
    setIsRecording(false);
    setTranscript("");
    setError(null);
    wordIndexRef.current = 0;
  }, [clearSimulation]);

  /* Cleanup on unmount */
  React.useEffect(() => {
    return () => clearSimulation();
  }, [clearSimulation]);

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
