import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RailState {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

export const useRailStore = create<RailState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (value: boolean) => set({ isCollapsed: value }),
    }),
    {
      name: 'rail-collapse-state',
    }
  )
);
