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

  // Validate token on every mount (e.g. tab focus, page refresh).
  // Skip fetchMe when the reset guard is active — the explicit fetchMe()
  // inside ResetPasswordPage (after a successful reset) is the only call
  // that should be allowed to clear the isTemporaryPassword flag.
  useEffect(() => {
    if (validate() && !user?.isTemporaryPassword) {
      fetchMe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Security guardrail: bypass MainLayout entirely so no sidebar is rendered.
  // Strict === true so the guard only fires when the flag is explicitly set.
  if (user?.isTemporaryPassword === true) {
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
