import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketTab } from '../../../services/ticket.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TicketFiltersState {
  search:       string;
  projectCodes: string[];
  centerCodes:  string[];
  services:     string[];
}

export interface TicketPagination {
  page: number;
  size: number;
}

const DEFAULT_FILTERS: TicketFiltersState = {
  search: '', projectCodes: [], centerCodes: [], services: [],
};

// ── Store interface ───────────────────────────────────────────────────────────

interface TicketUIStore {
  // ── Persisted ──
  activeTab:  TicketTab;
  filters:    TicketFiltersState;
  pagination: TicketPagination;

  setActiveTab:    (tab: TicketTab) => void;
  setSearch:       (v: string) => void;
  setProjectCodes: (v: string[]) => void;
  setCenterCodes:  (v: string[]) => void;
  setServices:     (v: string[]) => void;
  clearFilters:    () => void;
  setPage:         (p: number) => void;
  setSize:         (s: number) => void;

  // ── Volatile ──
  createOpen:  boolean;
  openCreate:  () => void;
  closeCreate: () => void;

  statusDialogId:    string | null;
  openStatusDialog:  (id: string) => void;
  closeStatusDialog: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTicketStore = create<TicketUIStore>()(
  persist(
    (set) => ({
      activeTab:  'OPEN',
      filters:    DEFAULT_FILTERS,
      pagination: { page: 0, size: 20 },

      setActiveTab: (tab) =>
        set((s) => ({ activeTab: tab, pagination: { ...s.pagination, page: 0 } })),

      setSearch: (v) =>
        set((s) => ({
          filters:    { ...s.filters, search: v },
          pagination: { ...s.pagination, page: 0 },
        })),

      setProjectCodes: (v) =>
        set((s) => ({
          filters:    { ...s.filters, projectCodes: v, centerCodes: [] },
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

      createOpen:  false,
      openCreate:  () => set({ createOpen: true }),
      closeCreate: () => set({ createOpen: false }),

      statusDialogId:    null,
      openStatusDialog:  (id) => set({ statusDialogId: id }),
      closeStatusDialog: () => set({ statusDialogId: null }),
    }),
    {
      name:       'innoticket-tickets',
      partialize: (s) => ({
        activeTab:  s.activeTab,
        filters:    s.filters,
        pagination: s.pagination,
      }),
    },
  ),
);
