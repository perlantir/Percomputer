"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Mic, Square, AudioLines } from "lucide-react";

export interface VoiceInputProps {
  isRecording: boolean;
  transcript: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

/**
 * Voice recording button with pulse animation and live transcript display.
 */
export function VoiceInput({
  isRecording,
  transcript,
  onStartRecording,
  onStopRecording,
  disabled,
}: VoiceInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Record button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={disabled}
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-fast ease-out",
            isRecording
              ? "bg-[var(--semantic-danger)] text-[var(--text-inverse)] hover:bg-[var(--semantic-danger)]/90"
              : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-label={isRecording ? "Stop recording" : "Start voice input"}
          title={isRecording ? "Stop recording" : "Start voice input"}
        >
          {/* Pulse ring when recording */}
          {isRecording && (
            <>
              {typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--semantic-danger)]/40" />
              )}
            </>
          )}

          {isRecording ? (
            <Square className="relative z-10 h-4 w-4 fill-current" />
          ) : (
            <Mic className="relative z-10 h-4 w-4" />
          )}
        </button>

        {/* Status label */}
        <span
          className={cn(
            "text-xs font-medium transition-colors duration-fast",
            isRecording
              ? "text-[var(--semantic-danger)]"
              : "text-[var(--text-tertiary)]"
          )}
        >
          {isRecording ? "Listening…" : "Tap to speak"}
        </span>

        {/* Audio visualizer dots */}
        {isRecording && (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]"
                style={{
                  animation:
                    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "none"
                      : `voice-bar 0.6s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live transcript */}
      {transcript.length > 0 && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2 transition-all duration-fast",
            isRecording && "border-[var(--accent-primary)]/30"
          )}
        >
          <AudioLines className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" />
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {transcript}
            {isRecording && (
              <span
                className="ml-0.5 inline-block h-3.5 w-0.5 bg-[var(--accent-primary)] align-middle"
                style={{
                  animation:
                    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "none"
                      : "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            )}
          </p>
        </div>
      )}

      {/* Keyframes for voice visualizer */}
      <style jsx>{`
        @keyframes voice-bar {
          0% {
            transform: scaleY(0.4);
            opacity: 0.5;
          }
          100% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
