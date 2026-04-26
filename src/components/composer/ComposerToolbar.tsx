"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Switch } from "@/src/components/ui/switch";
import {
  Paperclip,
  Globe,
  Link2,
  FolderOpen,
  Play,
} from "lucide-react";

export interface ComposerToolbarProps {
  onAttach: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  selectedConnectors: string[];
  onToggleConnector: (id: string) => void;
  fileSource: string | null;
  onSetFileSource: (source: string | null) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const CONNECTORS = [
  { id: "slack", label: "Slack" },
  { id: "notion", label: "Notion" },
  { id: "jira", label: "Jira" },
  { id: "github", label: "GitHub" },
];

const FILE_SOURCES = [
  { id: "drive", label: "Drive" },
  { id: "dropbox", label: "Dropbox" },
  { id: "s3", label: "S3" },
];

export function ComposerToolbar({
  onAttach,
  webSearchEnabled,
  onToggleWebSearch,
  selectedConnectors,
  onToggleConnector,
  fileSource,
  onSetFileSource,
  canSubmit,
  isSubmitting,
  onSubmit,
}: ComposerToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-2">
      {/* Left cluster: attachments & toggles */}
      <div className="flex items-center gap-1">
        {/* Attach */}
        <button
          type="button"
          onClick={onAttach}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-fast ease-out",
            "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
          )}
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Attach</span>
        </button>

        {/* Web search toggle */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-fast ease-out",
            webSearchEnabled
              ? "bg-[var(--bg-surface-2)] text-[var(--accent-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Web</span>
          <Switch
            checked={webSearchEnabled}
            onCheckedChange={onToggleWebSearch}
            className="ml-0.5 scale-75"
            aria-label="Toggle web search"
          />
        </div>

        {/* Connector selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-fast ease-out",
                selectedConnectors.length > 0
                  ? "bg-[var(--bg-surface-2)] text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
              )}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {selectedConnectors.length > 0
                  ? `${selectedConnectors.length} connector${selectedConnectors.length > 1 ? "s" : ""}`
                  : "Slack"}
              </span>
              <span className="sm:hidden">
                {selectedConnectors.length > 0
                  ? `${selectedConnectors.length}`
                  : "Connect"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {CONNECTORS.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={selectedConnectors.includes(c.id)}
                onCheckedChange={() => onToggleConnector(c.id)}
              >
                {c.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* File source */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-fast ease-out",
                fileSource
                  ? "bg-[var(--bg-surface-2)] text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {fileSource
                  ? FILE_SOURCES.find((s) => s.id === fileSource)?.label ?? "Files"
                  : "Drive"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {FILE_SOURCES.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.id}
                checked={fileSource === s.id}
                onCheckedChange={(checked) =>
                  onSetFileSource(checked ? s.id : null)
                }
              >
                {s.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Run button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-fast ease-out",
          "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-medium",
          "hover:bg-[var(--accent-primary-hover)] hover:shadow-high hover:scale-105",
          "active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--accent-primary)] disabled:hover:shadow-medium disabled:hover:scale-100 disabled:active:scale-100",
          canSubmit && !isSubmitting && "anim-button-ready-pulse"
        )}
        aria-label={isSubmitting ? "Starting workflow…" : "Run workflow"}
        title={isSubmitting ? "Starting workflow…" : "Run workflow · Ctrl+Enter"}
      >
        {isSubmitting ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--text-inverse)] border-t-transparent" />
            Starting…
          </>
        ) : (
          <>
            Run
            <Play className="h-3.5 w-3.5 fill-current" />
          </>
        )}
      </button>
    </div>
  );
}
