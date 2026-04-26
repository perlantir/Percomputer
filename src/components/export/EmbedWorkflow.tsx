"use client";

import * as React from "react";
import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  RefreshCw,
  Monitor,
  Moon,
  Sun,
  Maximize2,
  Hand,
  Square,
  RoundedCorner,
  Loader2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Switch } from "@/src/components/ui/switch";
import { Slider } from "@/src/components/ui/slider";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  generateEmbedCode,
  generateResponsiveEmbed,
  copyToClipboard,
  type EmbedOptions,
} from "@/src/lib/export-utils";
import { toast } from "@/src/components/layout/Toaster";

interface EmbedWorkflowProps {
  workflowId: string;
  baseUrl?: string;
  children?: React.ReactNode;
}

const PRESET_SIZES = [
  { label: "Small", w: 480, h: 320 },
  { label: "Medium", w: 720, h: 480 },
  { label: "Large", w: 960, h: 640 },
  { label: "Full", w: 1200, h: 800 },
];

export function EmbedWorkflow({
  workflowId,
  baseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "",
  children,
}: EmbedWorkflowProps) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(720);
  const [height, setHeight] = useState(480);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [showHeader, setShowHeader] = useState(true);
  const [allowInteraction, setAllowInteraction] = useState(true);
  const [borderRadius, setBorderRadius] = useState(8);
  const [embedType, setEmbedType] = useState<"iframe" | "responsive">("iframe");
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const options: EmbedOptions = {
    workflowId,
    width,
    height,
    theme,
    showHeader,
    allowInteraction,
    borderRadius,
  };

  const embedCode =
    embedType === "iframe"
      ? generateEmbedCode(baseUrl, options)
      : generateResponsiveEmbed(baseUrl, { ...options, minHeight: height });

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      const ok = await copyToClipboard(embedCode);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const applyPreset = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Code2 className="h-4 w-4" />
            Embed
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 dark:bg-[var(--bg-surface)]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[var(--text-primary)]">
            Embed Workflow
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Copy the embed code and paste it into your website or blog.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          {/* Preset sizes */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Size Presets
            </label>
            <div className="flex gap-2">
              {PRESET_SIZES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.w, preset.h)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs transition-colors",
                    width === preset.w && height === preset.h
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                <Maximize2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                Width ({width}px)
              </label>
              <Slider
                value={[width]}
                onValueChange={([v]) => setWidth(v)}
                min={320}
                max={1600}
                step={10}
                className="py-1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                <Maximize2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                Height ({height}px)
              </label>
              <Slider
                value={[height]}
                onValueChange={([v]) => setHeight(v)}
                min={240}
                max={1200}
                step={10}
                className="py-1"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Appearance
            </label>

            {/* Theme */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">Theme</span>
              <div className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-0.5">
                {([
                  { key: "light", icon: Sun },
                  { key: "dark", icon: Moon },
                  { key: "auto", icon: Monitor },
                ] as const).map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs transition-colors",
                      theme === key
                        ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                    aria-pressed={theme === key}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {key === "auto" ? "Auto" : key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Border radius */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">Corner radius</span>
              <div className="flex items-center gap-3">
                <RoundedCorner className="h-4 w-4 text-[var(--text-tertiary)]" />
                <Slider
                  value={[borderRadius]}
                  onValueChange={([v]) => setBorderRadius(v)}
                  min={0}
                  max={24}
                  step={1}
                  className="w-40 py-1"
                />
                <span className="w-8 text-right text-xs text-[var(--text-tertiary)]">
                  {borderRadius}px
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Show header</span>
                </div>
                <Switch checked={showHeader} onCheckedChange={setShowHeader} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Hand className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Allow interaction</span>
                </div>
                <Switch checked={allowInteraction} onCheckedChange={setAllowInteraction} />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Live preview
            </p>
            <div
              className={cn(
                "mx-auto overflow-hidden border border-[var(--border-subtle)] transition-all",
                theme === "dark" && "bg-[#0f0f0f]",
                theme === "light" && "bg-white",
                theme === "auto" && "bg-[var(--bg-surface-2)]"
              )}
              style={{
                width: Math.min(width, 520),
                height: Math.min(height, 280),
                borderRadius: `${borderRadius}px`,
              }}
            >
              <div className="flex h-full flex-col">
                {showHeader && (
                  <div
                    className={cn(
                      "flex items-center justify-between border-b px-3 py-2 text-xs",
                      theme === "dark"
                        ? "border-neutral-800 text-neutral-400"
                        : "border-neutral-200 text-neutral-500",
                      theme === "auto" && "border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                    )}
                  >
                    <span className="font-medium">Workflow Embed</span>
                    <span>ID: {workflowId.slice(-8)}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center text-xs",
                    theme === "dark" && "text-neutral-500",
                    theme === "light" && "text-neutral-400",
                    theme === "auto" && "text-[var(--text-tertiary)]"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Monitor className="h-5 w-5 opacity-50" />
                    <span>{width} × {height} embed preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
              <Tabs
                value={embedType}
                onValueChange={(v) => setEmbedType(v as "iframe" | "responsive")}
              >
                <TabsList className="h-7 bg-[var(--bg-surface-2)]">
                  <TabsTrigger value="iframe" className="px-2 py-0.5 text-xs">
                    iframe
                  </TabsTrigger>
                  <TabsTrigger value="responsive" className="px-2 py-0.5 text-xs">
                    Responsive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={isCopying}
                className={cn(
                  "h-7 gap-1.5 px-2 text-xs",
                  copied && "text-emerald-500"
                )}
              >
                {isCopying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {isCopying ? "Copying..." : copied ? "Copied" : "Copy code"}
              </Button>
            </div>
            <pre className="max-h-40 overflow-auto p-3 text-xs leading-relaxed text-[var(--text-primary)]">
              <code>{embedCode}</code>
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-[var(--text-secondary)]"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              disabled={isCopying}
              className="gap-1.5 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]/90"
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {isCopying ? "Copying..." : copied ? "Copied to clipboard" : "Copy embed code"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
