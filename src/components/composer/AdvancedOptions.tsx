"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Slider } from "@/src/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  Coins,
  CalendarClock,
  FileType,
  Cpu,
} from "lucide-react";
import type { ComposerOptions } from "@/src/hooks/useComposer";
import { MODEL_TIER } from "@/src/types/enums";

export interface AdvancedOptionsProps {
  open: boolean;
  onToggle: () => void;
  options: ComposerOptions;
  onChange: React.Dispatch<React.SetStateAction<ComposerOptions>>;
}

const DELIVERABLE_KINDS = [
  { id: "report_md", label: "Report (Markdown)" },
  { id: "dataset_csv", label: "Dataset (CSV)" },
  { id: "image_png", label: "Image (PNG)" },
  { id: "code_diff", label: "Code / Diff" },
  { id: "json", label: "JSON" },
  { id: "text_txt", label: "Plain Text" },
];

const MODEL_TIER_LABELS: Record<string, string> = {
  orchestrator: "Orchestrator",
  reasoning: "Reasoning",
  balanced: "Balanced",
  small: "Small / Fast",
  long_context: "Long Context",
  image_specialist: "Image Specialist",
  video_specialist: "Video Specialist",
  code_specialist: "Code Specialist",
  medical_specialist: "Medical Specialist",
  cheap_bulk: "Cheap Bulk",
};

export function AdvancedOptions({
  open,
  onToggle,
  options,
  onChange,
}: AdvancedOptionsProps) {
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors duration-fast ease-out",
          "hover:text-[var(--text-secondary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
        )}
        aria-expanded={open}
        aria-controls="advanced-options-panel"
      >
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {open ? "Hide advanced" : "Show advanced"}
      </button>

      {open && (
        <div
          id="advanced-options-panel"
          className="mt-3 grid animate-fade-in grid-cols-1 gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-4 sm:grid-cols-2"
        >
          {/* Budget */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Coins className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Budget (credits)
            </label>
            <div className="flex items-center gap-3">
              <Slider
                value={[options.budgetCredits]}
                min={10}
                max={1000}
                step={10}
                onValueChange={([v]) =>
                  onChange((prev) => ({ ...prev, budgetCredits: v }))
                }
                className="flex-1"
              />
              <input
                type="number"
                min={10}
                max={10000}
                value={options.budgetCredits}
                onChange={(e) => {
                  const v = Math.max(10, parseInt(e.target.value || "0", 10));
                  onChange((prev) => ({ ...prev, budgetCredits: v }));
                }}
                className={cn(
                  "w-20 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-right text-xs text-[var(--text-primary)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                )}
                aria-label="Budget in credits"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <CalendarClock className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Deadline
            </label>
            <input
              type="datetime-local"
              value={options.deadline ?? ""}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  deadline: e.target.value || null,
                }))
              }
              className={cn(
                "rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              )}
              aria-label="Deadline"
            />
          </div>

          {/* Deliverable kinds */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <FileType className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Output formats
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex w-full items-center justify-between rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors duration-fast",
                    "hover:border-[var(--border-default)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  )}
                >
                  <span>
                    {options.deliverableKinds.length > 0
                      ? `${options.deliverableKinds.length} selected`
                      : "Select formats…"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {DELIVERABLE_KINDS.map((k) => (
                  <DropdownMenuCheckboxItem
                    key={k.id}
                    checked={options.deliverableKinds.includes(k.id)}
                    onCheckedChange={(checked) => {
                      onChange((prev) => ({
                        ...prev,
                        deliverableKinds: checked
                          ? [...prev.deliverableKinds, k.id]
                          : prev.deliverableKinds.filter((id) => id !== k.id),
                      }));
                    }}
                  >
                    {k.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Model policy override */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Cpu className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Model policy
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex w-full items-center justify-between rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors duration-fast",
                    "hover:border-[var(--border-default)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  )}
                >
                  <span>
                    {options.modelPolicy
                      ? MODEL_TIER_LABELS[options.modelPolicy] ?? options.modelPolicy
                      : "Auto-route…"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem
                  checked={options.modelPolicy === null}
                  onCheckedChange={() =>
                    onChange((prev) => ({ ...prev, modelPolicy: null }))
                  }
                >
                  Auto-route
                </DropdownMenuCheckboxItem>
                {MODEL_TIER.map((tier) => (
                  <DropdownMenuCheckboxItem
                    key={tier}
                    checked={options.modelPolicy === tier}
                    onCheckedChange={(checked) =>
                      onChange((prev) => ({
                        ...prev,
                        modelPolicy: checked ? tier : null,
                      }))
                    }
                  >
                    {MODEL_TIER_LABELS[tier] ?? tier}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
