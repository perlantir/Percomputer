"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { useComposer } from "@/src/hooks/useComposer";
import { ComposerToolbar } from "./ComposerToolbar";
import { SlashMenu, type SlashCommand, SLASH_COMMANDS } from "./SlashMenu";
import { AdvancedOptions } from "./AdvancedOptions";
import { StarterChips } from "./StarterChips";
import { X, AlertCircle } from "lucide-react";

const MIN_ROWS = 2;
const MAX_ROWS = 6;
const LINE_HEIGHT = 20; // approximate line-height in px

/**
 * The main Composer — auto-growing prompt input with attachments,
 * slash commands, advanced options, and a primary Run CTA.
 */
export function Composer() {
  const composer = useComposer();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ── Auto-grow ── */
  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      el.style.transition = "height var(--duration-fast) var(--ease-spring)";
    } else {
      el.style.transition = "none";
    }

    el.style.height = "auto";
    const minHeight = LINE_HEIGHT * MIN_ROWS;
    const maxHeight = LINE_HEIGHT * MAX_ROWS;
    const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${newHeight}px`;

    if (el.scrollHeight > maxHeight) {
      el.style.overflowY = "auto";
    } else {
      el.style.overflowY = "hidden";
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [composer.text, adjustHeight]);

  /* ── Slash menu logic ── */
  const handleTextChange = (value: string) => {
    composer.setText(value);

    const lastSlashIndex = value.lastIndexOf("/");
    if (lastSlashIndex >= 0) {
      const afterSlash = value.slice(lastSlashIndex + 1);
      const beforeSlash = value.slice(0, lastSlashIndex);
      // Only trigger if / is at start or preceded by whitespace, and no newline after
      const charBefore = beforeSlash.slice(-1);
      if (
        (beforeSlash === "" || /\s/.test(charBefore)) &&
        !afterSlash.includes("\n") &&
        !afterSlash.includes(" ")
      ) {
        composer.setSlashFilter(afterSlash);
        composer.setSlashMenuOpen(true);
        composer.setSelectedSlashIndex(0);
        return;
      }
    }
    composer.setSlashMenuOpen(false);
    composer.setSlashFilter("");
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    const el = textareaRef.current;
    if (!el) return;

    const value = composer.text;
    const lastSlashIndex = value.lastIndexOf("/");
    const before = value.slice(0, lastSlashIndex);

    let replacement = "";
    switch (cmd.id) {
      case "space":
        replacement = `${before}[space: ]`.trimStart();
        break;
      case "budget":
        replacement = `${before}[budget: 100 credits]`.trimStart();
        break;
      case "deadline":
        replacement = `${before}[deadline: ]`.trimStart();
        break;
      case "format":
        replacement = `${before}[format: report]`.trimStart();
        break;
      case "connector":
        replacement = `${before}[connector: ]`.trimStart();
        break;
      default:
        replacement = before;
    }

    composer.setText(replacement + " ");
    composer.setSlashMenuOpen(false);
    composer.setSlashFilter("");
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(replacement.length + 1, replacement.length + 1);
    });
  };

  /* ── Keyboard shortcuts ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (composer.slashMenuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const q = composer.slashFilter.toLowerCase().replace(/^\//, "");
        const filtered = !q
          ? SLASH_COMMANDS
          : SLASH_COMMANDS.filter(
              (c) =>
                c.id.includes(q) ||
                c.label.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q)
            );
        composer.setSelectedSlashIndex((prev) =>
          Math.min(prev + 1, filtered.length - 1)
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        composer.setSelectedSlashIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const q = composer.slashFilter.toLowerCase().replace(/^\//, "");
        const filtered = !q
          ? SLASH_COMMANDS
          : SLASH_COMMANDS.filter(
              (c) =>
                c.id.includes(q) ||
                c.label.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q)
            );
        const selected = filtered[composer.selectedSlashIndex];
        if (selected) {
          handleSlashSelect(selected);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        composer.setSlashMenuOpen(false);
        return;
      }
    }

    // Cmd/Ctrl + Enter to submit
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      composer.submit();
      return;
    }
  };

  /* ── File attachments ── */
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(composer.addAttachment);
    e.target.value = "";
  };

  /* ── Starter chip select ── */
  const handleChipSelect = (template: string) => {
    composer.setText(template);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* Composer card */}
      <div
        ref={containerRef}
        className={cn(
          "w-full rounded-xl border bg-[var(--bg-surface)] shadow-medium origin-center transition-all duration-350 ease-spring",
          "border-[var(--border-default)]",
          "scale-[0.985] focus-within:scale-100",
          "focus-within:border-[var(--accent-primary)] focus-within:shadow-high",
          "focus-within:bg-[var(--bg-surface-2)]"
        )}
      >
        <div className="flex flex-col p-4">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={composer.text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => composer.setIsFocused(true)}
            onBlur={() => composer.setIsFocused(false)}
            placeholder="What would you like Computer to do?"
            rows={MIN_ROWS}
            className={cn(
              "w-full resize-none bg-transparent text-base leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
              "focus-visible:outline-none"
            )}
            aria-label="Workflow objective"
            aria-invalid={!!composer.error}
            aria-describedby={composer.error ? "composer-error" : undefined}
            disabled={composer.isSubmitting}
          />

          {/* Attachment pills */}
          {composer.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {composer.attachments.map((att) => (
                <div
                  key={att.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                  )}
                >
                  <span className="max-w-[12rem] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => composer.removeAttachment(att.id)}
                    className={cn(
                      "rounded p-0.5 text-[var(--text-tertiary)] transition-colors",
                      "hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]"
                    )}
                    aria-label={`Remove ${att.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error message */}
          {composer.error && (
            <div id="composer-error" className="mt-2 flex items-center gap-1.5 rounded-md bg-[var(--semantic-danger)]/10 px-2.5 py-1.5 text-xs text-[var(--semantic-danger)]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{composer.error}</span>
            </div>
          )}

          {/* Toolbar */}
          <ComposerToolbar
            onAttach={handleFileSelect}
            webSearchEnabled={composer.webSearchEnabled}
            onToggleWebSearch={composer.setWebSearchEnabled}
            selectedConnectors={composer.selectedConnectors}
            onToggleConnector={composer.toggleConnector}
            fileSource={null}
            onSetFileSource={() => {}}
            canSubmit={composer.canSubmit}
            isSubmitting={composer.isSubmitting}
            onSubmit={composer.submit}
          />

          {/* Advanced options */}
          <AdvancedOptions
            open={composer.advancedOpen}
            onToggle={() => composer.setAdvancedOpen((o) => !o)}
            options={composer.options}
            onChange={composer.setOptions}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Slash command menu */}
      <SlashMenu
        open={composer.slashMenuOpen}
        filter={composer.slashFilter}
        selectedIndex={composer.selectedSlashIndex}
        onSelect={handleSlashSelect}
        onClose={() => composer.setSlashMenuOpen(false)}
        anchorRef={containerRef}
      />

      {/* Starter chips */}
      <StarterChips onSelect={handleChipSelect} />
    </div>
  );
}
