import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { authService, type LoginRequest } from '../services/auth.service';
import { userService } from '../services/user.service';
import { useDashboardStore } from '../modules/dashboard/store';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the JWT has not expired */
export function isTokenValid(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const TOKEN_KEY = 'auth_token';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a display name from an email address.
 * "john.doe@company.com" → "John Doe"
 * "mis@avyxon.ai"        → "Mis"
 */
export function deriveFullName(email: string): string {
  const prefix = email.split('@')[0] ?? email;
  return prefix
    .split(/[._\-+]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  /** Login identifier returned by API (email address) */
  username:        string;
  /** Human-readable display name derived from username */
  fullName:        string;
  /** Email — same as username */
  email:           string;
  /** Role from API e.g. ADMIN, USER, CLIENT */
  role:            string;
  // Extended profile fields populated by /users/me
  id?:                  number;
  contact?:             string;
  post?:                string;
  managerUsername?:     string | null;
  status?:              string;
  lastLogin?:           string | null;
  projectCode?:         string | null;
  isTemporaryPassword?: boolean;
}

interface AuthState {
  user:            AuthUser | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;

  /** Call /login, persist token, update state */
  login:    (credentials: LoginRequest) => Promise<{ isTemporaryPassword: boolean }>;
  /** Clear all auth state + localStorage */
  logout:   () => void;
  /** Called on app boot — invalidates expired token */
  validate: () => boolean;
  /** Silently refresh profile from /users/me — no-op on error */
  fetchMe:  () => Promise<void>;

  setUser:  (user: AuthUser) => void;
  setToken: (token: string)  => void;
  clearError: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(credentials);
          const { token, username, role, isTemporaryPassword } = res.data.data;

          // Persist token for the Axios interceptor
          localStorage.setItem(TOKEN_KEY, token);

          set({
            token,
            user: {
              username,
              email:               username,
              fullName:            deriveFullName(username),
              role,
              isTemporaryPassword,
            },
            isAuthenticated: true,
            isLoading:       false,
            error:           null,
          });

          // Enrich profile silently — skip when temporary password is active
          // to avoid a race that could wipe the isTemporaryPassword flag.
          if (!isTemporaryPassword) {
            get().fetchMe().catch(() => {});
          }

          return { isTemporaryPassword };
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Invalid credentials. Please try again.';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        // Reset session-only dashboard live mode so it doesn't persist across logins
        useDashboardStore.getState().setIsLive(false);
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      fetchMe: async () => {
        try {
          const res = await userService.getMe();
          const p = res.data.data;
          set((s) => ({
            user: s.user
              ? {
                  ...s.user,
                  fullName:            p.fullName,
                  role:                p.roleCode,
                  id:                  p.id,
                  contact:             p.contact,
                  post:                p.post,
                  managerUsername:     p.managerUsername,
                  status:              p.status,
                  lastLogin:           p.lastLogin,
                  projectCode:         p.projectCode,
                  // Preserve an existing `true` flag if the API omits the field
                  // (some endpoints don't return it, avoid clearing it with undefined)
                  isTemporaryPassword: p.isTemporaryPassword ?? s.user?.isTemporaryPassword,
                }
              : s.user,
          }));
        } catch {
          // Silent — never surface profile-refresh errors to the user
        }
      },

      validate: () => {
        const { token, logout } = get();
        if (!token || !isTokenValid(token)) {
          logout();
          return false;
        }
        return true;
      },

      setUser:  (user)  => set({ user }),
      setToken: (token) => {
        localStorage.setItem(TOKEN_KEY, token);
        set({ token });
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'innoticket-auth',
      // Only persist the essentials — never persist loading/error
      partialize: (s) => ({
        token:           s.token,
        user:            s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
