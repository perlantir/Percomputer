"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Send, SkipForward } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";

export interface ClarificationOption {
  value: string;
  label: string;
}

export interface ClarificationCardProps {
  question: string;
  options?: ClarificationOption[];
  allowFreeText?: boolean;
  onSend: (answer: string) => void;
  onSkip: () => void;
}

export const ClarificationCard = React.memo(function ClarificationCard({
  question,
  options,
  allowFreeText,
  onSend,
  onSkip,
}: ClarificationCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const isTextMode = !options || allowFreeText;
  const shouldReduceMotion = useReducedMotion();

  const canSend = isTextMode
    ? freeText.trim().length > 0
    : selectedOption !== null || freeText.trim().length > 0;

  const handleSend = () => {
    if (isTextMode) {
      onSend(freeText.trim());
    } else if (selectedOption) {
      onSend(selectedOption);
    } else if (freeText.trim()) {
      onSend(freeText.trim());
    }
  };

  const motionProps = shouldReduceMotion
    ? { initial: false, animate: { y: 0, opacity: 1 }, exit: false, transition: { duration: 0 } }
    : {
        initial: { y: 40, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 40, opacity: 0 },
        transition: { type: "spring", damping: 24, stiffness: 300 },
      };

  return (
    <AnimatePresence>
      <motion.div
        {...motionProps}
        className="card mx-auto max-w-[72ch] overflow-hidden border-[var(--accent-primary)]/30 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--accent-primary)]/[0.05] px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)]/15">
            <AlertCircle className="h-4 w-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Computer needs your input
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Your answer will help the agent continue
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {question}
          </p>

          {/* Radio options */}
          {options && options.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                    selectedOption === opt.value
                      ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.06]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50 hover:bg-[var(--bg-surface-2)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="clarification"
                    value={opt.value}
                    checked={selectedOption === opt.value}
                    onChange={() => setSelectedOption(opt.value)}
                    className="h-4 w-4 accent-[var(--accent-primary)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Free text input */}
          {(allowFreeText || !options || options.length === 0) && (
            <div className="mt-3">
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className="bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1.5">
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!canSend}
            className="gap-1.5"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
