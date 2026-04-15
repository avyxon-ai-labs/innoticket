import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CenterGridResponse } from '../../../../services/center-grid.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CenterGridFiltersState {
  search:       string;
  projectCodes: string[];
  centerCodes:  string[];
  serviceNames: string[];
}

export interface CenterGridPagination {
  page: number; // 0-indexed
  size: number;
}

type ModalMode = 'create' | 'edit';

interface CenterGridUIState {
  // Filters — persisted, named setters for type safety
  filters:          CenterGridFiltersState;
  setSearch:        (v: string) => void;
  setProjectCodes:  (v: string[]) => void;
  setCenterCodes:   (v: string[]) => void;
  setServiceNames:  (v: string[]) => void;
  clearFilters:     () => void;

  // Pagination (persisted)
  pagination: CenterGridPagination;
  setPage:    (page: number) => void;
  setSize:    (size: number) => void;

  // Sorting (persisted)
  sortKey: string;
  sortDir: 'asc' | 'desc';
  setSort: (key: string, dir: 'asc' | 'desc') => void;

  // Modal (volatile)
  modalOpen:   boolean;
  modalMode:   ModalMode;
  editTarget:  CenterGridResponse | null;
  openCreate:  () => void;
  openEdit:    (item: CenterGridResponse) => void;
  closeModal:  () => void;

  // Delete (volatile)
  deleteTarget: CenterGridResponse | null;
  openDelete:   (item: CenterGridResponse) => void;
  closeDelete:  () => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: CenterGridFiltersState = {
  search:       '',
  projectCodes: [],
  centerCodes:  [],
  serviceNames: [],
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCenterGridStore = create<CenterGridUIState>()(
  persist(
    (set) => ({
      // Filters
      filters:         DEFAULT_FILTERS,
      setSearch:       (v) =>
        set((s) => ({ filters: { ...s.filters, search: v },       pagination: { ...s.pagination, page: 0 } })),
      setProjectCodes: (v) =>
        set((s) => ({ filters: { ...s.filters, projectCodes: v, centerCodes: [], serviceNames: [] }, pagination: { ...s.pagination, page: 0 } })),
      setCenterCodes:  (v) =>
        set((s) => ({ filters: { ...s.filters, centerCodes: v },  pagination: { ...s.pagination, page: 0 } })),
      setServiceNames: (v) =>
        set((s) => ({ filters: { ...s.filters, serviceNames: v }, pagination: { ...s.pagination, page: 0 } })),
      clearFilters:    () =>
        set((s) => ({ filters: DEFAULT_FILTERS, pagination: { ...s.pagination, page: 0 } })),

      // Pagination
      pagination: { page: 0, size: 10 },
      setPage:    (page) => set((s) => ({ pagination: { ...s.pagination, page } })),
      setSize:    (size) => set((s) => ({ pagination: { ...s.pagination, size, page: 0 } })),

      // Sorting
      sortKey: 'createdAt',
      sortDir: 'desc',
      setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),

      // Modal
      modalOpen:  false,
      modalMode:  'create',
      editTarget: null,
      openCreate: () => set({ modalOpen: true, modalMode: 'create', editTarget: null }),
      openEdit:   (item) => set({ modalOpen: true, modalMode: 'edit', editTarget: item }),
      closeModal: () => set({ modalOpen: false, editTarget: null }),

      // Delete
      deleteTarget: null,
      openDelete:   (item) => set({ deleteTarget: item }),
      closeDelete:  () => set({ deleteTarget: null }),
    }),
    {
      name:       'innoticket-center-grid',
      partialize: (s) => ({
        filters:    s.filters,
        pagination: s.pagination,
        sortKey:    s.sortKey,
        sortDir:    s.sortDir,
      }),
    },
  ),
);
