/**
 * Centralized Zustand store for global application state.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;

  isComposing: boolean;
  setIsComposing: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      activeWorkflowId: null,
      setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),

      isComposing: false,
      setIsComposing: (v) => set({ isComposing: v }),
    }),
    { name: "app-store" }
  )
);
