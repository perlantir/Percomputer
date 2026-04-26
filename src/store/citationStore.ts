"use client";

import { create } from "zustand";

interface CitationStore {
  activeTab: string;
  highlightedSourceId: string | null;
  setActiveTab: (tab: string) => void;
  highlightSource: (sourceId: string) => void;
  clearHighlight: () => void;
}

export const useCitationStore = create<CitationStore>((set) => ({
  activeTab: "answer",
  highlightedSourceId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  highlightSource: (sourceId) =>
    set({ highlightedSourceId: sourceId, activeTab: "sources" }),
  clearHighlight: () => set({ highlightedSourceId: null }),
}));
