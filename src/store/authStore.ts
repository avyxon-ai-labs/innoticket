import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { authService, type LoginRequest } from '../services/auth.service';

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
  username: string;
  /** Human-readable display name derived from username */
  fullName: string;
  /** Email — same as username */
  email:    string;
  /** Role from API e.g. ADMIN, USER */
  role:     string;
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
              email:    username,
              fullName: deriveFullName(username),
              role,
            },
            isAuthenticated: true,
            isLoading:       false,
            error:           null,
          });

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
        set({ user: null, token: null, isAuthenticated: false, error: null });
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
