import { create } from 'zustand';

/**
 * In-page view state — the core navigation primitive.
 *
 * Usage:
 *   pushView({ module: 'tickets', subView: 'detail', selectedId: 'T123' })
 *   popView()   → restores previous view + its filters/pagination/tab
 *
 * ❌ Never use route navigation for sub-views.
 * ✅ Always use pushView / popView for in-module navigation.
 */
export interface ViewState {
  module:      string;
  subView:     string;
  selectedId?: string;
  // Persisted per-view state that gets restored on back
  filters?:    Record<string, unknown>;
  pagination?: { page: number; pageSize: number };
  activeTab?:  string;
  scrollY?:    number;
  // Allow arbitrary extra keys
  [key: string]: unknown;
}

interface NavigationStore {
  /** Full view stack — top is current */
  stack: ViewState[];

  /** Shortcut to top of stack */
  current: ViewState | null;

  /** Push a new sub-view (enables back navigation) */
  pushView: (view: ViewState) => void;

  /** Go back one level */
  popView: () => void;

  /** Replace current without adding to stack (no back entry) */
  setView: (view: ViewState) => void;

  /** Reset stack to a single root view */
  resetStack: (root?: ViewState) => void;

  /** Patch the current view's state without a new stack entry */
  updateCurrent: (partial: Partial<ViewState>) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  stack:   [],
  current: null,

  pushView: (view) =>
    set((s) => {
      const stack = [...s.stack, view];
      return { stack, current: view };
    }),

  popView: () =>
    set((s) => {
      if (s.stack.length <= 1) return s;
      const stack = s.stack.slice(0, -1);
      return { stack, current: stack.at(-1) ?? null };
    }),

  setView: (view) =>
    set((s) => {
      // Replace top of stack, keep history below
      const stack = s.stack.length > 0
        ? [...s.stack.slice(0, -1), view]
        : [view];
      return { stack, current: view };
    }),

  resetStack: (root) => {
    const stack = root ? [root] : [];
    set({ stack, current: root ?? null });
  },

  updateCurrent: (partial) =>
    set((s) => {
      if (!s.current || s.stack.length === 0) return s;
      const updated = { ...s.current, ...partial };
      const stack   = [...s.stack.slice(0, -1), updated];
      return { stack, current: updated };
    }),

  // canGoBack derived value (not in store — use stack.length > 1)
}));

/** Helper: read whether back navigation is available */
export const canGoBack = () =>
  useNavigationStore.getState().stack.length > 1;
