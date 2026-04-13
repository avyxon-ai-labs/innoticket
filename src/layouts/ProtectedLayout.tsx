import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from './MainLayout';
import { ResetPasswordPage } from '../modules/auth';

/**
 * Route guard for all authenticated pages.
 *
 * Behaviour:
 *  - On mount: validate token expiry (jwt-decode). If expired → logout.
 *  - If not authenticated → redirect to /login.
 *  - If isTemporaryPassword → render reset page fullscreen (no sidebar/layout).
 *  - If authenticated → render MainLayout with nested routes via <Outlet />.
 */
export function ProtectedLayout() {
  const { isAuthenticated, validate, fetchMe, user } = useAuthStore();

  // Validate token on every mount (e.g. tab focus, page refresh)
  useEffect(() => {
    if (validate()) {
      fetchMe();
    }
  }, [validate, fetchMe]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Security guardrail: bypass MainLayout entirely so no sidebar is rendered
  if (user?.isTemporaryPassword) {
    return (
      <div
        className="w-full flex-1 flex flex-col items-center justify-center min-h-screen px-4 py-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, #edf4ef 0%, var(--ghost) 70%)',
        }}
      >
        <ResetPasswordPage />
      </div>
    );
  }

  return <MainLayout />;
}
