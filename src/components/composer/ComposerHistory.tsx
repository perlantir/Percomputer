"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { History, Clock, Trash2, X, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "composer:objective-history";
const MAX_HISTORY = 10;

export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface ComposerHistoryProps {
  onSelect: (text: string) => void;
  currentText?: string;
}

/**
 * Load recent objectives from localStorage.
 */
function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save objectives to localStorage.
 */
function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY))
    );
  } catch {
    // Storage quota exceeded or private mode
  }
}

/**
 * Dropdown of the last 10 workflow objectives from localStorage.
 */
export function ComposerHistory({
  onSelect,
  currentText,
}: ComposerHistoryProps) {
  const [history, setHistory] = React.useState<HistoryItem[]>(loadHistory);
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmMode, setConfirmMode] = React.useState<"clear" | "remove" | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  /* Sync on mount and when window regains focus */
  React.useEffect(() => {
    const sync = () => setHistory(loadHistory());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  /* Add current text to history when it changes meaningfully */
  React.useEffect(() => {
    if (!currentText || currentText.trim().length < 3) return;
    setHistory((prev) => {
      const trimmed = currentText.trim();
      // Avoid duplicates at top
      if (prev[0]?.text === trimmed) return prev;
      const filtered = prev.filter((h) => h.text !== trimmed);
      const next: HistoryItem[] = [
        { id: `hist_${Date.now()}`, text: trimmed, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, [currentText]);

  const handleSelect = (item: HistoryItem) => {
    onSelect(item.text);
    setOpen(false);
  };

  const handleClear = () => {
    setConfirmMode("clear");
    setPendingId(null);
    setConfirmOpen(true);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmMode("remove");
    setPendingId(id);
    setConfirmOpen(true);
  };

  const executeConfirm = () => {
    if (confirmMode === "clear") {
      setHistory([]);
      saveHistory([]);
      setOpen(false);
    } else if (confirmMode === "remove" && pendingId) {
      setHistory((prev) => {
        const next = prev.filter((h) => h.id !== pendingId);
        saveHistory(next);
        return next;
      });
    }
    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingId(null);
  };

  const cancelConfirm = () => {
    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingId(null);
  };

  if (history.length === 0) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]",
          "cursor-default opacity-50"
        )}
        aria-label="No history yet"
        title="No history yet"
      >
        <History className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">History</span>
      </button>
    );
  }

  return (
    <>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-fast ease-out",
            "hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
          )}
          aria-label="Recent objectives"
          title="Recent objectives"
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
          <span className="rounded-full bg-[var(--bg-surface-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
            {history.length}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">
            Recent objectives
          </span>
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)] transition-colors",
              "hover:bg-[var(--bg-surface-3)] hover:text-[var(--semantic-danger)]"
            )}
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {history.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleSelect(item)}
              className="flex items-start gap-2 px-2 py-2"
            >
              <Clock className="mt-0.5 h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs text-[var(--text-primary)]">
                  {item.text}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleRemove(item.id, e)}
                className={cn(
                  "rounded p-0.5 text-[var(--text-tertiary)] opacity-0 transition-all",
                  "hover:text-[var(--semantic-danger)]",
                  "group-hover:opacity-100 focus-visible:opacity-100"
                )}
                aria-label="Remove from history"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Confirmation dialog */}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
            <AlertTriangle className="h-6 w-6 text-[var(--semantic-danger)]" />
          </div>
          <DialogTitle className="text-center">
            {confirmMode === "clear"
              ? "Clear All History?"
              : "Remove History Item?"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {confirmMode === "clear"
              ? "This will permanently delete all recent objectives from history. This action cannot be undone."
              : "This objective will be removed from your history."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="secondary" onClick={cancelConfirm}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button variant="danger" onClick={executeConfirm}>
            <Trash2 className="h-4 w-4" />
            {confirmMode === "clear" ? "Yes, Clear All" : "Yes, Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
