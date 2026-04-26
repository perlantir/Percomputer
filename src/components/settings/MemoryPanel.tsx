"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/src/lib/utils";
import { DEMO_MEMORY, type MemoryEntry } from "@/src/data/demo-memory";
import { DEMO_USERS } from "@/src/data/demo-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Search, Brain, Trash2, X, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/src/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";

const CURRENT_USER_ID = DEMO_USERS[0].id;

function fetchMemory(): Promise<MemoryEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DEMO_MEMORY.filter((m) => m.userId === CURRENT_USER_ID)), 200);
  });
}

export function MemoryPanel() {
  const [search, setSearch] = useState("");
  const [revokedIds, setRevokedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"bulk" | "single" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: memoryEntries, isLoading } = useQuery({
    queryKey: ["settings-memory", CURRENT_USER_ID],
    queryFn: fetchMemory,
    initialData: DEMO_MEMORY.filter((m) => m.userId === CURRENT_USER_ID),
  });

  const filtered = (memoryEntries ?? []).filter((m) => {
    if (revokedIds.has(m.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q)) ||
      m.modelId.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((m) => m.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const openBulkRevokeConfirm = () => {
    if (selectedIds.size === 0) return;
    setConfirmMode("bulk");
    setPendingId(null);
    setConfirmOpen(true);
  };

  const openRevokeOneConfirm = (id: string) => {
    setConfirmMode("single");
    setPendingId(id);
    setConfirmOpen(true);
  };

  const executeRevoke = () => {
    if (confirmMode === "bulk") {
      setRevokedIds((prev) => {
        const next = new Set(prev);
        selectedIds.forEach((id) => next.add(id));
        return next;
      });
      setSelectedIds(new Set());
    } else if (confirmMode === "single" && pendingId) {
      setRevokedIds((prev) => {
        const next = new Set(prev);
        next.add(pendingId);
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(pendingId);
        return next;
      });
    }
    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingId(null);
  };

  const cancelRevoke = () => {
    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Bulk Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
          <Input
            placeholder="Search memory by content, tags, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-foreground-tertiary">
                {selectedIds.size} selected
              </span>
              <Button variant="danger" size="sm" onClick={openBulkRevokeConfirm}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Revoke
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deselect
              </Button>
            </>
          )}
          {selectedIds.size === 0 && filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select all
            </Button>
          )}
        </div>
      </div>

      {/* Memory List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-skeleton rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          variant="search"
          icon={Brain}
          title="No memory entries found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => {
            const isSelected = selectedIds.has(entry.id);
            return (
              <Card
                key={entry.id}
                className={cn(
                  "transition-all duration-fast ease-out",
                  isSelected ? "border-accent-primary/40 bg-accent-primary/5" : "border-border-subtle"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(entry.id)}
                      className="mt-1 h-4 w-4 rounded border-border-default accent-accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-2xs font-medium capitalize text-foreground-secondary">
                          <Brain className="h-3 w-3" />
                          {entry.type}
                        </span>
                        <span className="text-2xs text-foreground-tertiary">
                          {entry.modelId}
                        </span>
                        <span className="text-2xs text-foreground-tertiary">
                          · {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-primary leading-relaxed">
                        {entry.content}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-foreground-tertiary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-foreground-tertiary hover:text-[var(--semantic-danger)]"
                      onClick={() => openRevokeOneConfirm(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revoke confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-danger)]/10">
              <AlertTriangle className="h-6 w-6 text-[var(--semantic-danger)]" />
            </div>
            <DialogTitle className="text-center">
              {confirmMode === "bulk"
                ? `Revoke ${selectedIds.size} Memory Entries?`
                : "Revoke Memory Entry?"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {confirmMode === "bulk"
                ? `This will permanently remove ${selectedIds.size} selected memory entries. This action cannot be undone.`
                : "This memory entry will be permanently removed. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="secondary" onClick={cancelRevoke}>
              <X className="h-4 w-4" />
              Keep
            </Button>
            <Button variant="danger" onClick={executeRevoke}>
              <Trash2 className="h-4 w-4" />
              Yes, Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
