import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  /** mobile drawer open */
  sidebarOpen: boolean;
  /** desktop icon-only collapse */
  sidebarCollapsed: boolean;
  /** which nav groups are expanded */
  expandedGroups: string[];

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
  toggleGroup: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      expandedGroups: [],

      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      toggleCollapse: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      toggleGroup: (id) =>
        set((s) => ({
          expandedGroups: s.expandedGroups.includes(id)
            ? s.expandedGroups.filter((g) => g !== id)
            : [...s.expandedGroups, id],
        })),
    }),
    {
      name: 'innoticket-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        expandedGroups: s.expandedGroups,
      }),
    },
  ),
);
