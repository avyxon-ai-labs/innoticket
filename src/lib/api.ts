import axios from 'axios';

/**
 * Single Axios instance.
 * – Attaches Bearer token on every request (reads from localStorage)
 * – On 401: clears auth state via authStore + redirects to /login
 *
 * ⚠️  Never import axios directly in components or modules.
 *     Always use this instance via src/services/*.service.ts
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request — attach token ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response — handle 401 ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Lazy-import avoids circular dependency (authStore → api → authStore)
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

export default api;
