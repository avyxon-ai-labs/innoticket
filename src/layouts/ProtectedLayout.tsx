import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from './MainLayout';

/**
 * Route guard for all authenticated pages.
 *
 * Behaviour:
 *  - On mount: validate token expiry (jwt-decode). If expired → logout.
 *  - If not authenticated → redirect to /login.
 *  - If authenticated → render MainLayout with nested routes via <Outlet />.
 */
export function ProtectedLayout() {
  const { isAuthenticated, validate } = useAuthStore();

  // Validate token on every mount (e.g. tab focus, page refresh)
  useEffect(() => {
    validate();
  }, [validate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}
