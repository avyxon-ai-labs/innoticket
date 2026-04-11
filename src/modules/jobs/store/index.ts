import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JobType, JobStatus } from '../../../services/job.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JobFiltersState {
  jobTypes: JobType[];
  statuses: JobStatus[];
}

export interface JobPagination {
  page: number;
  size: number;
}

interface JobUIState {
  // Filters (persisted)
  filters:      JobFiltersState;
  setJobTypes:  (v: JobType[]) => void;
  setStatuses:  (v: JobStatus[]) => void;
  clearFilters: () => void;

  // Pagination (persisted)
  pagination: JobPagination;
  setPage:    (p: number) => void;
  setSize:    (s: number) => void;

  // Live tracking — volatile
  liveTracking: boolean;
  toggleLive:   () => void;

  // Selected rows — volatile
  selectedIds:    Set<number>;
  toggleSelect:   (id: number) => void;
  selectAll:      (ids: number[]) => void;
  clearSelection: () => void;

  // Polling panel — volatile
  pollingJobId: number | null;
  openPolling:  (id: number) => void;
  closePolling: () => void;
}

const DEFAULT_FILTERS: JobFiltersState = { jobTypes: [], statuses: [] };

// ── Store ─────────────────────────────────────────────────────────────────────

export const useJobStore = create<JobUIState>()(
  persist(
    (set) => ({
      filters:      DEFAULT_FILTERS,
      setJobTypes:  (v) =>
        set((s) => ({ filters: { ...s.filters, jobTypes: v }, pagination: { ...s.pagination, page: 0 } })),
      setStatuses:  (v) =>
        set((s) => ({ filters: { ...s.filters, statuses: v }, pagination: { ...s.pagination, page: 0 } })),
      clearFilters: () =>
        set((s) => ({ filters: DEFAULT_FILTERS, pagination: { ...s.pagination, page: 0 } })),

      pagination: { page: 0, size: 20 },
      setPage:    (p) => set((s) => ({ pagination: { ...s.pagination, page: p } })),
      setSize:    (s) => set((prev) => ({ pagination: { ...prev.pagination, size: s, page: 0 } })),

      liveTracking: false,
      toggleLive:   () => set((s) => ({ liveTracking: !s.liveTracking })),

      selectedIds:    new Set<number>(),
      toggleSelect:   (id) =>
        set((s) => {
          const next = new Set(s.selectedIds);
          next.has(id) ? next.delete(id) : next.add(id);
          return { selectedIds: next };
        }),
      selectAll:      (ids) => set({ selectedIds: new Set(ids) }),
      clearSelection: ()    => set({ selectedIds: new Set<number>() }),

      pollingJobId: null,
      openPolling:  (id) => set({ pollingJobId: id }),
      closePolling: ()   => set({ pollingJobId: null }),
    }),
    {
      name:       'innoticket-jobs',
      partialize: (s) => ({ filters: s.filters, pagination: s.pagination }),
    },
  ),
);
