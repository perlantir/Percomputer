"use client";

import React, { useCallback, useMemo, useState } from "react";
import { cn } from "@/src/lib/utils";
import {
  Columns,
  Rows,
  FileCode,
  FileText,
  BookOpen,
  Check,
  X,
  Minus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type DiffType = "added" | "removed" | "modified" | "unchanged";
type ViewMode = "side-by-side" | "inline";
type ContentType = "code" | "markdown" | "plain";

export interface DiffLine {
  type: DiffType;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
  oldContent?: string;
  newContent?: string;
}

export interface DiffHunk {
  oldStart: number;
  newStart: number;
  oldLength: number;
  newLength: number;
  lines: DiffLine[];
  header?: string;
}

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
  contentType?: ContentType;
  defaultViewMode?: ViewMode;
  className?: string;
  collapsible?: boolean;
}

/* ──────────────────────────── Diff Engine ──────────────────────────── */

function computeLCS(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

function buildDiff(oldText: string, newText: string): DiffHunk[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const dp = computeLCS(oldLines, newLines);

  const diffLines: DiffLine[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffLines.unshift({
        type: "unchanged",
        oldLineNumber: i,
        newLineNumber: j,
        content: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffLines.unshift({
        type: "added",
        oldLineNumber: null,
        newLineNumber: j,
        content: newLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffLines.unshift({
        type: "removed",
        oldLineNumber: i,
        newLineNumber: null,
        content: oldLines[i - 1],
      });
      i--;
    }
  }

  /* Detect modifications: adjacent remove+add pairs with similar content */
  const merged: DiffLine[] = [];
  let idx = 0;
  while (idx < diffLines.length) {
    const curr = diffLines[idx];
    if (
      curr.type === "removed" &&
      idx + 1 < diffLines.length &&
      diffLines[idx + 1].type === "added"
    ) {
      const next = diffLines[idx + 1];
      const similarity = lineSimilarity(curr.content, next.content);
      if (similarity > 0.3) {
        merged.push({
          type: "modified",
          oldLineNumber: curr.oldLineNumber,
          newLineNumber: next.newLineNumber,
          content: next.content,
          oldContent: curr.content,
          newContent: next.content,
        });
        idx += 2;
        continue;
      }
    }
    merged.push(curr);
    idx++;
  }

  return groupIntoHunks(merged);
}

function lineSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function groupIntoHunks(lines: DiffLine[]): DiffHunk[] {
  const context = 3;
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] = [];
  let lastChangeIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type !== "unchanged") {
      if (currentHunk.length === 0) {
        const start = Math.max(0, i - context);
        currentHunk = lines.slice(start, i);
      } else if (lastChangeIndex >= 0 && i - lastChangeIndex > context * 2) {
        const overlap = lines.slice(lastChangeIndex + 1, i - context);
        currentHunk.push(...overlap);
        hunks.push(finishHunk(currentHunk));
        currentHunk = lines.slice(Math.max(0, i - context), i);
      }
      lastChangeIndex = i;
    }
    if (currentHunk.length > 0) {
      currentHunk.push(lines[i]);
    }
  }

  if (currentHunk.length > 0) {
    hunks.push(finishHunk(currentHunk));
  } else if (lines.length > 0) {
    /* No changes: single hunk with all lines */
    hunks.push(finishHunk(lines));
  }

  return hunks;
}

function finishHunk(lines: DiffLine[]): DiffHunk {
  const context = 3;
  /* Trim trailing context beyond the last change */
  let end = lines.length;
  let lastChange = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type !== "unchanged") lastChange = i;
  }
  if (lastChange >= 0) {
    end = Math.min(lines.length, lastChange + context + 1);
  }
  const trimmed = lines.slice(0, end);

  const oldStart = trimmed.find((l) => l.oldLineNumber !== null)?.oldLineNumber ?? 1;
  const newStart = trimmed.find((l) => l.newLineNumber !== null)?.newLineNumber ?? 1;
  const oldLines = trimmed.filter((l) => l.oldLineNumber !== null).length;
  const newLines = trimmed.filter((l) => l.newLineNumber !== null).length;

  return {
    oldStart,
    newStart,
    oldLength: oldLines,
    newLength: newLines,
    lines: trimmed,
    header: `@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`,
  };
}

/* ──────────────────────────── Highlighting ──────────────────────────── */

function highlightInlineDiff(oldContent: string, newContent: string): { oldHtml: string; newHtml: string } {
  const oldWords = tokenize(oldContent);
  const newWords = tokenize(newContent);
  const dp = computeLCS(oldWords, newWords);

  const oldTags: string[] = [];
  const newTags: string[] = [];
  let i = oldWords.length;
  let j = newWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      oldTags.unshift(escapeHtml(oldWords[i - 1]));
      newTags.unshift(escapeHtml(newWords[j - 1]));
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      newTags.unshift(`<ins style="background-color:rgba(42,157,143,0.25);color:var(--text-primary);text-decoration:none;border-radius:2px;padding:0 1px;">${escapeHtml(newWords[j - 1])}</ins>`);
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      oldTags.unshift(`<del style="background-color:rgba(231,111,81,0.25);color:var(--text-primary);text-decoration:line-through;border-radius:2px;padding:0 1px;">${escapeHtml(oldWords[i - 1])}</del>`);
      i--;
    }
  }

  return { oldHtml: oldTags.join(""), newHtml: newTags.join("") };
}

function tokenize(text: string): string[] {
  return text.split(/(\s+|[a-zA-Z0-9_]+|[^\s\w])/g).filter(Boolean);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ──────────────────────────── Component ──────────────────────────── */

export default function DiffViewer({
  oldText,
  newText,
  oldLabel = "Before",
  newLabel = "After",
  contentType = "plain",
  defaultViewMode = "side-by-side",
  className,
  collapsible = false,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [collapsedHunks, setCollapsedHunks] = useState<Set<number>>(new Set());
  const [showWhitespace, setShowWhitespace] = useState(true);

  const hunks = useMemo(() => buildDiff(oldText, newText), [oldText, newText]);

  const toggleHunk = useCallback((idx: number) => {
    setCollapsedHunks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === "added") added++;
        else if (line.type === "removed") removed++;
        else if (line.type === "modified") modified++;
      }
    }
    return { added, removed, modified, total: added + removed + modified };
  }, [hunks]);

  const lineBg: Record<DiffType, string> = {
    added: "bg-[var(--success)]/8 dark:bg-[var(--success)]/12",
    removed: "bg-[var(--danger)]/8 dark:bg-[var(--danger)]/12",
    modified: "bg-[var(--warning)]/8 dark:bg-[var(--warning)]/12",
    unchanged: "bg-transparent",
  };

  const lineBorder: Record<DiffType, string> = {
    added: "border-l-2 border-l-[var(--success)]",
    removed: "border-l-2 border-l-[var(--danger)]",
    modified: "border-l-2 border-l-[var(--warning)]",
    unchanged: "border-l-2 border-l-transparent",
  };

  const lineIcon: Record<DiffType, React.ReactNode> = {
    added: <PlusIcon className="w-3 h-3 text-[var(--success)]" />,
    removed: <MinusIcon className="w-3 h-3 text-[var(--danger)]" />,
    modified: <TildeIcon className="w-3 h-3 text-[var(--warning)]" />,
    unchanged: <span className="w-3 h-3" />,
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-surface)]",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex-wrap">
        <div className="flex items-center gap-1.5 mr-3">
          <FileIcon contentType={contentType} />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Diff Viewer
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[var(--bg-canvas)] rounded-md border border-[var(--border-subtle)] p-0.5">
          <button
            onClick={() => setViewMode("side-by-side")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] transition-colors",
              viewMode === "side-by-side"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
            aria-label="Side-by-side view"
            title="Side-by-side"
          >
            <Columns className="w-3 h-3" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setViewMode("inline")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] transition-colors",
              viewMode === "inline"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
            aria-label="Inline view"
            title="Inline"
          >
            <Rows className="w-3 h-3" />
            <span className="hidden sm:inline">Unified</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Stats */}
          {stats.total > 0 && (
            <div className="flex items-center gap-2 text-[10px]">
              {stats.added > 0 && (
                <span className="flex items-center gap-1 text-[var(--success)]">
                  <Check className="w-3 h-3" />
                  {stats.added}
                </span>
              )}
              {stats.removed > 0 && (
                <span className="flex items-center gap-1 text-[var(--danger)]">
                  <X className="w-3 h-3" />
                  {stats.removed}
                </span>
              )}
              {stats.modified > 0 && (
                <span className="flex items-center gap-1 text-[var(--warning)]">
                  <Minus className="w-3 h-3" />
                  {stats.modified}
                </span>
              )}
            </div>
          )}

          {/* Whitespace toggle */}
          <button
            onClick={() => setShowWhitespace((s) => !s)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border transition-colors",
              showWhitespace
                ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                : "border-[var(--border-subtle)] text-[var(--text-tertiary)]"
            )}
          >
            Whitespace
          </button>
        </div>
      </div>

      {/* Headers */}
      {viewMode === "side-by-side" ? (
        <div className="grid grid-cols-2 border-b border-[var(--border-subtle)]">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-tertiary)] border-r border-[var(--border-subtle)] truncate">
            {oldLabel}
          </div>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-tertiary)] truncate">
            {newLabel}
          </div>
        </div>
      ) : (
        <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] flex items-center gap-2">
          <Minus className="w-3 h-3" /> {oldLabel}
          <span className="text-[var(--border-default)]">→</span>
          <PlusIcon className="w-3 h-3" /> {newLabel}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto font-mono text-[12px] leading-relaxed">
        {hunks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] text-sm">
            No differences found
          </div>
        ) : (
          hunks.map((hunk, hunkIdx) => (
            <div key={hunkIdx}>
              {collapsible && (
                <button
                  onClick={() => toggleHunk(hunkIdx)}
                  className="w-full flex items-center gap-1.5 px-3 py-1 text-[10px] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-2)] transition-colors border-b border-[var(--border-subtle)]"
                >
                  {collapsedHunks.has(hunkIdx) ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span className="font-mono">{hunk.header}</span>
                </button>
              )}
              {!collapsedHunks.has(hunkIdx) && (
                <>
                  {viewMode === "side-by-side"
                    ? renderSideBySideHunk(hunk, lineBg, lineBorder, lineIcon, showWhitespace)
                    : renderInlineHunk(hunk, lineBg, lineBorder, lineIcon, showWhitespace)}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── Renderers ──────────────────────────── */

function renderSideBySideHunk(
  hunk: DiffHunk,
  lineBg: Record<DiffType, string>,
  lineBorder: Record<DiffType, string>,
  lineIcon: Record<DiffType, React.ReactNode>,
  showWhitespace: boolean
) {
  const leftRows: React.ReactNode[] = [];
  const rightRows: React.ReactNode[] = [];

  for (const line of hunk.lines) {
    const display = showWhitespace ? line.content : line.content.replace(/\s+$/g, "");
    const escaped = escapeHtml(display);

    if (line.type === "unchanged") {
      leftRows.push(
        <SideRow
          key={`L-${line.oldLineNumber}`}
          lineNumber={line.oldLineNumber}
          content={escaped}
          bgClass={lineBg.unchanged}
          borderClass={lineBorder.unchanged}
          icon={lineIcon.unchanged}
        />
      );
      rightRows.push(
        <SideRow
          key={`R-${line.newLineNumber}`}
          lineNumber={line.newLineNumber}
          content={escaped}
          bgClass={lineBg.unchanged}
          borderClass={lineBorder.unchanged}
          icon={lineIcon.unchanged}
        />
      );
    } else if (line.type === "removed") {
      leftRows.push(
        <SideRow
          key={`L-${line.oldLineNumber}`}
          lineNumber={line.oldLineNumber}
          content={escaped}
          bgClass={lineBg.removed}
          borderClass={lineBorder.removed}
          icon={lineIcon.removed}
        />
      );
      rightRows.push(
        <EmptyRow key={`R-empty-${line.oldLineNumber}`} />
      );
    } else if (line.type === "added") {
      leftRows.push(
        <EmptyRow key={`L-empty-${line.newLineNumber}`} />
      );
      rightRows.push(
        <SideRow
          key={`R-${line.newLineNumber}`}
          lineNumber={line.newLineNumber}
          content={escaped}
          bgClass={lineBg.added}
          borderClass={lineBorder.added}
          icon={lineIcon.added}
        />
      );
    } else if (line.type === "modified") {
      const { oldHtml, newHtml } = line.oldContent && line.newContent
        ? highlightInlineDiff(line.oldContent, line.newContent)
        : { oldHtml: escaped, newHtml: escaped };

      leftRows.push(
        <SideRow
          key={`L-${line.oldLineNumber}`}
          lineNumber={line.oldLineNumber}
          content={oldHtml}
          bgClass={lineBg.modified}
          borderClass={lineBorder.modified}
          icon={lineIcon.modified}
          isHtml
        />
      );
      rightRows.push(
        <SideRow
          key={`R-${line.newLineNumber}`}
          lineNumber={line.newLineNumber}
          content={newHtml}
          bgClass={lineBg.modified}
          borderClass={lineBorder.modified}
          icon={lineIcon.modified}
          isHtml
        />
      );
    }
  }

  return (
    <div className="grid grid-cols-2">
      <div className="border-r border-[var(--border-subtle)]">{leftRows}</div>
      <div>{rightRows}</div>
    </div>
  );
}

function renderInlineHunk(
  hunk: DiffHunk,
  lineBg: Record<DiffType, string>,
  lineBorder: Record<DiffType, string>,
  lineIcon: Record<DiffType, React.ReactNode>,
  showWhitespace: boolean
) {
  return hunk.lines.map((line, idx) => {
    const display = showWhitespace ? line.content : line.content.replace(/\s+$/g, "");
    const escaped = escapeHtml(display);

    if (line.type === "modified" && line.oldContent && line.newContent) {
      const { newHtml } = highlightInlineDiff(line.oldContent, line.newContent);
      return (
        <InlineRow
          key={idx}
          oldLineNumber={line.oldLineNumber}
          newLineNumber={line.newLineNumber}
          content={newHtml}
          bgClass={lineBg.modified}
          borderClass={lineBorder.modified}
          icon={lineIcon.modified}
          isHtml
        />
      );
    }

    return (
      <InlineRow
        key={idx}
        oldLineNumber={line.oldLineNumber}
        newLineNumber={line.newLineNumber}
        content={escaped}
        bgClass={lineBg[line.type]}
        borderClass={lineBorder[line.type]}
        icon={lineIcon[line.type]}
      />
    );
  });
}

/* ──────────────────────────── Sub-components ──────────────────────────── */

function SideRow({
  lineNumber,
  content,
  bgClass,
  borderClass,
  icon,
  isHtml = false,
}: {
  lineNumber: number | null;
  content: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
  isHtml?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr] items-start group",
        bgClass,
        borderClass
      )}
    >
      <div className="sticky left-0 flex items-center justify-end pr-1.5 py-0.5 select-none bg-inherit border-r border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
          {lineNumber ?? ""}
        </span>
      </div>
      <div className="flex items-start gap-1.5 px-2 py-0.5 overflow-hidden">
        <span className="flex-shrink-0 mt-0.5 opacity-60">{icon}</span>
        {isHtml ? (
          <pre
            className="text-[12px] text-[var(--text-primary)] whitespace-pre-wrap break-all leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <pre className="text-[12px] text-[var(--text-primary)] whitespace-pre-wrap break-all leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function InlineRow({
  oldLineNumber,
  newLineNumber,
  content,
  bgClass,
  borderClass,
  icon,
  isHtml = false,
}: {
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
  isHtml?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_2rem_1fr] items-start group",
        bgClass,
        borderClass
      )}
    >
      <div className="sticky left-0 flex items-center justify-end pr-1.5 py-0.5 select-none bg-inherit border-r border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
          {oldLineNumber ?? ""}
        </span>
      </div>
      <div className="sticky left-8 flex items-center justify-end pr-1.5 py-0.5 select-none bg-inherit border-r border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
          {newLineNumber ?? ""}
        </span>
      </div>
      <div className="flex items-start gap-1.5 px-2 py-0.5 overflow-hidden">
        <span className="flex-shrink-0 mt-0.5 opacity-60">{icon}</span>
        {isHtml ? (
          <pre
            className="text-[12px] text-[var(--text-primary)] whitespace-pre-wrap break-all leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <pre className="text-[12px] text-[var(--text-primary)] whitespace-pre-wrap break-all leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="grid grid-cols-[2rem_1fr] items-start h-[calc(12px*1.5+4px)]">
      <div className="border-r border-[var(--border-subtle)]" />
      <div />
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="6" y1="2" x2="6" y2="10" />
      <line x1="2" y1="6" x2="10" y2="6" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="2" y1="6" x2="10" y2="6" />
    </svg>
  );
}

function TildeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M2 7c2-2 4 0 6-2" />
    </svg>
  );
}

function FileIcon({ contentType }: { contentType: ContentType }) {
  switch (contentType) {
    case "code":
      return <FileCode className="w-4 h-4 text-[var(--accent-primary)]" />;
    case "markdown":
      return <BookOpen className="w-4 h-4 text-[var(--accent-secondary)]" />;
    default:
      return <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />;
  }
}
