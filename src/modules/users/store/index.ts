import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse, UserStatus, UserRole } from '../../../services/user.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserFiltersState {
  search?:    string;
  status?:    UserStatus | '';
  roleCodes?: UserRole[];
}

export interface UserPagination {
  page: number; // 0-indexed (API)
  size: number;
}

type ModalMode = 'create' | 'edit';

interface UserUIState {
  // Filters (persisted)
  filters:      UserFiltersState;
  setFilter:    <K extends keyof UserFiltersState>(key: K, value: UserFiltersState[K]) => void;
  clearFilters: () => void;

  // Pagination (persisted)
  pagination: UserPagination;
  setPage:    (page: number) => void;
  setSize:    (size: number) => void;

  // Sorting (persisted)
  sortKey: string;
  sortDir: 'asc' | 'desc';
  setSort: (key: string, dir: 'asc' | 'desc') => void;

  // Modal (volatile)
  modalOpen:   boolean;
  modalMode:   ModalMode;
  editTarget:  UserResponse | null;
  openCreate:  () => void;
  openEdit:    (user: UserResponse) => void;
  closeModal:  () => void;

  // Delete confirm (volatile)
  deleteTarget: UserResponse | null;
  openDelete:   (user: UserResponse) => void;
  closeDelete:  () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useUserStore = create<UserUIState>()(
  persist(
    (set) => ({
      // Filters
      filters:      {},
      setFilter:    (key, value) =>
        set((s) => ({
          filters:    { ...s.filters, [key]: value || undefined },
          pagination: { ...s.pagination, page: 0 },
        })),
      clearFilters: () =>
        set((s) => ({ filters: {}, pagination: { ...s.pagination, page: 0 } })),

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
      openEdit:   (user) => set({ modalOpen: true, modalMode: 'edit', editTarget: user }),
      closeModal: () => set({ modalOpen: false, editTarget: null }),

      // Delete
      deleteTarget: null,
      openDelete:   (user) => set({ deleteTarget: user }),
      closeDelete:  () => set({ deleteTarget: null }),
    }),
    {
      name:       'innoticket-users',
      partialize: (s) => ({
        filters:    s.filters,
        pagination: s.pagination,
        sortKey:    s.sortKey,
        sortDir:    s.sortDir,
      }),
    },
  ),
);
