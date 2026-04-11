import { create } from 'zustand';
import type { ServiceEscalation } from '../../../../services/service-escalation.service';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Filters {
  serviceName?:    string;
  escalationType?: string;
  search?:         string;
}

type ModalMode = 'create' | 'edit';

interface ServiceEscalationUIState {
  // Filters
  filters:       Filters;
  setFilter:     (key: keyof Filters, value: string) => void;
  clearFilters:  () => void;

  // Modal
  modalOpen:   boolean;
  modalMode:   ModalMode;
  editTarget:  ServiceEscalation | null;
  openCreate:  () => void;
  openEdit:    (item: ServiceEscalation) => void;
  closeModal:  () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useServiceEscalationStore = create<ServiceEscalationUIState>((set) => ({
  // Filters
  filters:      {},
  setFilter:    (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value || undefined } })),
  clearFilters: () => set({ filters: {} }),

  // Modal
  modalOpen:  false,
  modalMode:  'create',
  editTarget: null,
  openCreate: () => set({ modalOpen: true, modalMode: 'create', editTarget: null }),
  openEdit:   (item) => set({ modalOpen: true, modalMode: 'edit',   editTarget: item }),
  closeModal: () => set({ modalOpen: false, editTarget: null }),
}));
