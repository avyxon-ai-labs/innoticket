import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedLayout }          from '../layouts/ProtectedLayout';
import { AuthLayout }               from '../layouts/AuthLayout';
import { DashboardPage }            from '../pages/DashboardPage';
import { MyWorkPage }               from '../pages/MyWorkPage';
import { TicketsPage }              from '../pages/TicketsPage';
import { JobsPage }                 from '../pages/JobsPage';
import { ServiceEscalationsPage }   from '../pages/ServiceEscalationsPage';
import { ProjectsPage }             from '../pages/ProjectsPage';
import { UsersPage }                from '../pages/UsersPage';
import { CenterGridPage }           from '../pages/CenterGridPage';
import {
  LoginPage,
  ForgotPasswordPage,
  SetPasswordPage,
} from '../modules/auth';

export const router = createBrowserRouter([
  // ── Authenticated app ──────────────────────────────────────────────────────
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true,          element: <DashboardPage /> },
      { path: 'my-work',      element: <MyWorkPage /> },
      { path: 'tickets',      element: <TicketsPage /> },
      { path: 'users',        element: <UsersPage /> },
      { path: 'jobs',         element: <JobsPage /> },
      // Configurations
      { path: 'configurations/projects',    element: <ProjectsPage /> },
      { path: 'configurations/services',    element: <ServiceEscalationsPage /> },
      { path: 'configurations/centregrid',  element: <CenterGridPage /> },
    ],
  },

  // ── Auth (public) ──────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',           element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password',  element: <SetPasswordPage /> },
    ],
  },

  // ── Fallback ───────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);
