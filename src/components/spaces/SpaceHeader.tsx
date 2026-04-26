"use client";

import * as React from "react";
import { Pencil, Check, X, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/components/layout/Toaster";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import type { DemoSpace } from "@/src/data/demo-spaces";

const MOCK_USERS: Record<string, { name: string; initials: string; color: string }> = {
  usr_7a3f9e2b1c4d: { name: "Alice Chen", initials: "AC", color: "#3B82F6" },
  usr_b8e5d1a4f7c2: { name: "Bob Miller", initials: "BM", color: "#F59E0B" },
  usr_2f6c8d3e5b9a: { name: "Charlie Park", initials: "CP", color: "#10B981" },
};

interface SpaceHeaderProps {
  space: DemoSpace;
  onUpdate?: (patch: Partial<DemoSpace>) => void;
}

export function SpaceHeader({ space, onUpdate }: SpaceHeaderProps) {
  const [editing, setEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState(space.name);
  const [draftDescription, setDraftDescription] = React.useState(space.description);

  const handleSave = () => {
    onUpdate?.({ name: draftName, description: draftDescription });
    setEditing(false);
    toast.success("Space updated", "Space details have been saved.");
  };

  const handleCancel = () => {
    setDraftName(space.name);
    setDraftDescription(space.description);
    setEditing(false);
  };

  const members = space.memberIds.map((id) => MOCK_USERS[id]).filter(Boolean);

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Space icon */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-[var(--text-inverse)]"
              style={{ backgroundColor: space.color }}
            >
              {space.name.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">
              {editing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className={cn(
                      "h-9 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 text-lg font-display font-semibold text-[var(--text-primary)]",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    )}
                  />
                  <textarea
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    rows={2}
                    className={cn(
                      "rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSave}>
                      <Check className="mr-1 h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                      {space.name}
                    </h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 hover:opacity-100 focus:opacity-100"
                      onClick={() => setEditing(true)}
                      aria-label="Edit space name and description"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {space.description}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <Users className="h-3.5 w-3.5" />
              <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center -space-x-2">
              {members.map((m, i) => (
                <Avatar key={i} className="h-8 w-8 ring-2 ring-[var(--bg-surface)]">
                  <AvatarFallback
                    style={{ backgroundColor: m.color, color: "#fff" }}
                    className="text-xs font-medium"
                  >
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
