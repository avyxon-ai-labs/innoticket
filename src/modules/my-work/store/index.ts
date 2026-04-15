import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketTab } from '../../../services/ticket.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MyWorkTab = 'ASSIGNED' | 'RAISED' | 'MY_TEAM';

export interface MyWorkFiltersState {
  search:      string;
  projectCode: string;
  centerCodes: string[];
  services:    string[];
}

export interface MyWorkPagination {
  page: number;
  size: number;
}

const DEFAULT_FILTERS: MyWorkFiltersState = {
  search: '', projectCode: '', centerCodes: [], services: [],
};

// ── Store interface ───────────────────────────────────────────────────────────

interface MyWorkUIStore {
  // ── Persisted ──
  workTab:    MyWorkTab;   // "Assigned to Me" vs "Raised by Me"
  activeTab:  TicketTab;   // status tab (OPEN, IN_PROGRESS, …)
  filters:    MyWorkFiltersState;
  pagination: MyWorkPagination;

  setWorkTab:      (t: MyWorkTab) => void;
  setActiveTab:    (tab: TicketTab) => void;
  setSearch:       (v: string) => void;
  setProjectCode:  (v: string) => void;
  setCenterCodes:  (v: string[]) => void;
  setServices:     (v: string[]) => void;
  clearFilters:    () => void;
  setPage:         (p: number) => void;
  setSize:         (s: number) => void;

  // ── Volatile ──
  statusDialogId:    string | null;
  openStatusDialog:  (id: string) => void;
  closeStatusDialog: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMyWorkStore = create<MyWorkUIStore>()(
  persist(
    (set) => ({
      workTab:    'ASSIGNED',
      activeTab:  'OPEN',
      filters:    DEFAULT_FILTERS,
      pagination: { page: 0, size: 20 },

      setWorkTab: (t) =>
        set((s) => ({ workTab: t, pagination: { ...s.pagination, page: 0 } })),

      setActiveTab: (tab) =>
        set((s) => ({ activeTab: tab, pagination: { ...s.pagination, page: 0 } })),

      setSearch: (v) =>
        set((s) => ({
          filters:    { ...s.filters, search: v },
          pagination: { ...s.pagination, page: 0 },
        })),

      setProjectCode: (v) =>
        set((s) => ({
          filters:    { ...s.filters, projectCode: v, centerCodes: [], services: [] },
          pagination: { ...s.pagination, page: 0 },
        })),

      setCenterCodes: (v) =>
        set((s) => ({
          filters:    { ...s.filters, centerCodes: v },
          pagination: { ...s.pagination, page: 0 },
        })),

      setServices: (v) =>
        set((s) => ({
          filters:    { ...s.filters, services: v },
          pagination: { ...s.pagination, page: 0 },
        })),

      clearFilters: () =>
        set((s) => ({
          filters:    DEFAULT_FILTERS,
          pagination: { ...s.pagination, page: 0 },
        })),

      setPage: (p) => set((s) => ({ pagination: { ...s.pagination, page: p } })),
      setSize: (s) => set((prev) => ({ pagination: { page: 0, size: s } })),

      statusDialogId:    null,
      openStatusDialog:  (id) => set({ statusDialogId: id }),
      closeStatusDialog: () => set({ statusDialogId: null }),
    }),
    {
      name:       'innoticket-my-work',
      partialize: (s) => ({
        workTab:    s.workTab,
        activeTab:  s.activeTab,
        filters:    s.filters,
        pagination: s.pagination,
      }),
    },
  ),
);
