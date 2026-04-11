import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectStatus } from '../../../../services/project.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectFiltersState {
  status?:     ProjectStatus | '';
  searchText?: string;
}

export interface ProjectPagination {
  page: number;   // 0-indexed (API)
  size: number;
}

type ModalMode = 'create' | 'edit';

interface ProjectUIState {
  // Filters (persisted)
  filters:      ProjectFiltersState;
  setFilter:    <K extends keyof ProjectFiltersState>(key: K, value: ProjectFiltersState[K]) => void;
  clearFilters: () => void;

  // Pagination (persisted)
  pagination:       ProjectPagination;
  setPage:          (page: number) => void;
  setSize:          (size: number) => void;

  // Sorting (persisted)
  sortKey: string;
  sortDir: 'asc' | 'desc';
  setSort: (key: string, dir: 'asc' | 'desc') => void;

  // Modal (NOT persisted — volatile)
  modalOpen:   boolean;
  modalMode:   ModalMode;
  editTarget:  Project | null;
  openCreate:  () => void;
  openEdit:    (item: Project) => void;
  closeModal:  () => void;

  // Delete confirm (NOT persisted)
  deleteTarget: Project | null;
  openDelete:   (item: Project) => void;
  closeDelete:  () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectUIState>()(
  persist(
    (set) => ({
      // Filters
      filters:      {},
      setFilter:    (key, value) =>
        set((s) => ({
          filters:    { ...s.filters, [key]: value || undefined },
          pagination: { ...s.pagination, page: 0 }, // reset page on filter change
        })),
      clearFilters: () => set((s) => ({ filters: {}, pagination: { ...s.pagination, page: 0 } })),

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
      name:    'innoticket-projects',
      partialize: (s) => ({
        filters:    s.filters,
        pagination: s.pagination,
        sortKey:    s.sortKey,
        sortDir:    s.sortDir,
      }),
    },
  ),
);
