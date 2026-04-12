import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketTab }           from '../../../services/ticket.service';
import type { AggregationDimension } from '../../../services/dashboard.service';

export interface DashboardFilters {
  projectCode:     string;
  services:        string[];
  escalationTypes: string[];
  centreCodes:     string[];
}

const DEFAULT_FILTERS: DashboardFilters = {
  projectCode: '', services: [], escalationTypes: [], centreCodes: [],
};

interface DashboardStore {
  // ── Persisted ──
  filters:    DashboardFilters;
  dimension:  AggregationDimension;
  activeTab:  TicketTab;
  pagination: { page: number; size: number };

  setProjectCode:     (v: string) => void;
  setServices:        (v: string[]) => void;
  setEscalationTypes: (v: string[]) => void;
  setCentreCodes:     (v: string[]) => void;
  clearFilters:       (keepProject?: string) => void;
  setDimension:       (d: AggregationDimension) => void;
  setActiveTab:       (t: TicketTab) => void;
  setPage:            (p: number) => void;
  setSize:            (s: number) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      filters:    DEFAULT_FILTERS,
      dimension:  'centreCode',
      activeTab:  'OPEN',
      pagination: { page: 0, size: 20 },

      setProjectCode: (v) =>
        set((s) => ({
          filters: { ...s.filters, projectCode: v, centreCodes: [] },
          pagination: { ...s.pagination, page: 0 },
        })),

      setServices: (v) =>
        set((s) => ({
          filters: { ...s.filters, services: v, escalationTypes: [] },
          pagination: { ...s.pagination, page: 0 },
        })),

      setEscalationTypes: (v) =>
        set((s) => ({
          filters: { ...s.filters, escalationTypes: v },
          pagination: { ...s.pagination, page: 0 },
        })),

      setCentreCodes: (v) =>
        set((s) => ({
          filters: { ...s.filters, centreCodes: v },
          pagination: { ...s.pagination, page: 0 },
        })),

      clearFilters: (keepProject) =>
        set((s) => ({
          filters: { ...DEFAULT_FILTERS, projectCode: keepProject ?? s.filters.projectCode },
          pagination: { ...s.pagination, page: 0 },
        })),

      setDimension: (d) => set({ dimension: d }),

      setActiveTab: (t) =>
        set((s) => ({ activeTab: t, pagination: { ...s.pagination, page: 0 } })),

      setPage: (p) => set((s) => ({ pagination: { ...s.pagination, page: p } })),
      setSize: (s) => set((prev) => ({ pagination: { page: 0, size: s } })),
    }),
    {
      name: 'innoticket-dashboard',
      partialize: (s) => ({
        filters:    s.filters,
        dimension:  s.dimension,
        activeTab:  s.activeTab,
        pagination: s.pagination,
      }),
    },
  ),
);
