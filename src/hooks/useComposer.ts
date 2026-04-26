"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/src/components/layout/Toaster";
import type { SpaceId } from "@/src/types/entities";
import type { ModelTier } from "@/src/types/enums";
import type { FileAttachment } from "@/src/types/frontend";

export interface ComposerOptions {
  budgetCredits: number;
  deadline: string | null;
  deliverableKinds: string[];
  modelPolicy: ModelTier | null;
}

export interface UseComposerReturn {
  /* ── Text & focus ── */
  text: string;
  setText: (text: string) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;

  /* ── Attachments ── */
  attachments: FileAttachment[];
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;

  /* ── Web search toggle ── */
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;

  /* ── Connectors ── */
  selectedConnectors: string[];
  toggleConnector: (id: string) => void;

  /* ── Space ── */
  selectedSpace: SpaceId | null;
  setSelectedSpace: (space: SpaceId | null) => void;

  /* ── Slash menu ── */
  slashMenuOpen: boolean;
  setSlashMenuOpen: (open: boolean) => void;
  slashFilter: string;
  setSlashFilter: (filter: string) => void;
  selectedSlashIndex: number;
  setSelectedSlashIndex: React.Dispatch<React.SetStateAction<number>>;

  /* ── Advanced options ── */
  advancedOpen: boolean;
  setAdvancedOpen: React.Dispatch<React.SetStateAction<boolean>>;
  options: ComposerOptions;
  setOptions: React.Dispatch<React.SetStateAction<ComposerOptions>>;

  /* ── Submission ── */
  isSubmitting: boolean;
  error: string | null;
  submit: () => Promise<void>;
  canSubmit: boolean;
  /** Optimistic workflow ID shown while creating. */
  optimisticWorkflowId: string | null;
}

const DEFAULT_OPTIONS: ComposerOptions = {
  budgetCredits: 100,
  deadline: null,
  deliverableKinds: [],
  modelPolicy: null,
};

const DRAFT_STORAGE_KEY = "composer:draft";
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Hook managing the complete state of the Composer component.
 */
export function useComposer(): UseComposerReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  /* Restore draft from localStorage on mount */
  const [text, setText] = React.useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [isFocused, setIsFocused] = React.useState(false);
  const [attachments, setAttachments] = React.useState<FileAttachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
  const [selectedConnectors, setSelectedConnectors] = React.useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = React.useState<SpaceId | null>(null);

  /* Slash menu state */
  const [slashMenuOpen, setSlashMenuOpen] = React.useState(false);
  const [slashFilter, setSlashFilter] = React.useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = React.useState(0);

  /* Advanced options */
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ComposerOptions>(DEFAULT_OPTIONS);

  /* Submission */
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [optimisticWorkflowId, setOptimisticWorkflowId] = React.useState<string | null>(null);

  /* Track all active blob URLs for cleanup on unmount */
  const blobUrlsRef = React.useRef<Set<string>>(new Set());

  /* Auto-save draft to localStorage (debounced) */
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  React.useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (text.trim().length > 0) {
          window.localStorage.setItem(DRAFT_STORAGE_KEY, text);
        } else {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        // localStorage may be unavailable in private mode
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [text]);

  const canSubmit = text.trim().length > 0 && !isSubmitting;

  const addAttachment = React.useCallback((file: File) => {
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const previewUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(previewUrl);
    const attachment: FileAttachment = {
      id,
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      previewUrl,
      uploadProgress: null,
    };
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
        blobUrlsRef.current.delete(removed.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const toggleConnector = React.useCallback((id: string) => {
    setSelectedConnectors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const submit = React.useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setOptimisticWorkflowId(optimisticId);

    // Snapshot previous cache for rollback
    const previousWorkflows = queryClient.getQueryData<unknown[]>(["recent-workflows"]);

    try {
      // Optimistically add a pending workflow to the recent list
      const optimisticWorkflow = {
        workflow: {
          id: optimisticId,
          objective: text,
          status: "running",
          startedAt: new Date().toISOString(),
          completedAt: null,
          taskCount: 0,
          succeededTasks: 0,
          failedTasks: 0,
          spentCredits: 0,
          budgetCredits: options.budgetCredits,
          spaceId: selectedSpace ?? "default",
        },
        tasks: [],
        edges: [],
        sources: [],
        artifacts: [],
      };
      queryClient.setQueryData(["recent-workflows"], (old: unknown[] | undefined) => {
        if (!old) return [optimisticWorkflow];
        return [optimisticWorkflow, ...old];
      });

      const payload = {
        objective: text,
        space_id: selectedSpace,
        budget_credits: options.budgetCredits,
        deadline: options.deadline,
        deliverable_kinds: options.deliverableKinds,
        context: {
          memory_scope: "default" as const,
          attached_artifacts: attachments.map((a) => ({
            name: a.name,
            size: a.sizeBytes,
            mime_type: a.mimeType,
          })),
          web_search: webSearchEnabled,
          connectors: selectedConnectors,
          model_policy: options.modelPolicy,
        },
      };

      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to start workflow (${res.status})`);
      }

      const body = await res.json().catch(() => ({}));
      const id = body.id ?? body.workflow_id ?? body.workflowId;
      if (id) {
        // Replace optimistic entry with real one
        queryClient.setQueryData(["recent-workflows"], (old: unknown[] | undefined) => {
          if (!old) return [];
          return old.map((w: any) =>
            w?.workflow?.id === optimisticId
              ? { ...w, workflow: { ...w.workflow, id, status: "running" } }
              : w
          );
        });
        router.push(`/w/${id}`);
      }

      toast.success("Workflow created", "Your workflow has been started successfully.");

      /* Reset on success */
      setText("");
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // noop
      }
      setAttachments((prev) => {
        prev.forEach((a) => {
          if (a.previewUrl) {
            URL.revokeObjectURL(a.previewUrl);
            blobUrlsRef.current.delete(a.previewUrl);
          }
        });
        return [];
      });
      setSlashFilter("");
      setSlashMenuOpen(false);
    } catch (err) {
      // Rollback optimistic update
      queryClient.setQueryData(["recent-workflows"], previousWorkflows);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error("Failed to create workflow", msg);
    } finally {
      setIsSubmitting(false);
      setOptimisticWorkflowId(null);
    }
  }, [
    canSubmit,
    text,
    selectedSpace,
    options,
    attachments,
    webSearchEnabled,
    selectedConnectors,
    router,
    queryClient,
  ]);

  return {
    text,
    setText,
    isFocused,
    setIsFocused,
    attachments,
    addAttachment,
    removeAttachment,
    webSearchEnabled,
    setWebSearchEnabled,
    selectedConnectors,
    toggleConnector,
    selectedSpace,
    setSelectedSpace,
    slashMenuOpen,
    setSlashMenuOpen,
    slashFilter,
    setSlashFilter,
    selectedSlashIndex,
    setSelectedSlashIndex,
    advancedOpen,
    setAdvancedOpen,
    options,
    setOptions,
    isSubmitting,
    error,
    submit,
    canSubmit,
    optimisticWorkflowId,
  };
}
