import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRoute, ROUTES } from '@/lib/constants';

// Layouts
import { RootLayout } from '@/components/layout/RootLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Public pages
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';

// Admin pages
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage';
import { AdminKpiConfigPage } from '@/pages/admin/AdminKpiConfigPage';

// Department (manager) pages
import { DepartmentDashboardPage } from '@/pages/department/DepartmentDashboardPage';
import { SubKpiManagementPage } from '@/pages/department/SubKpiManagementPage';
import { SubKpiDetailPage } from '@/pages/department/SubKpiDetailPage';
import { TeamCheckinsPage } from '@/pages/department/TeamCheckinsPage';

// Employee pages
import { EmployeeDashboardPage } from '@/pages/employee/EmployeeDashboardPage';
import { DataInputPage } from '@/pages/employee/DataInputPage';
import { WeekPlanPage } from '@/pages/employee/WeekPlanPage';
import { WeekReviewPage } from '@/pages/employee/WeekReviewPage';

function RootRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-slate-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Navigate to={getDefaultRoute(profile.rol)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root layout wraps everything */}
        <Route element={<RootLayout />}>
          {/* Root redirect based on role */}
          <Route index element={<RootRedirect />} />

          {/* Public routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

          {/* Admin routes - admin only */}
          <Route element={<ProtectedRoute allowedRoles="admin" />}>
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
              <Route
                path={ROUTES.ADMIN_DEPARTMENTS}
                element={<AdminDepartmentsPage />}
              />
              <Route path={ROUTES.ADMIN_KPIS} element={<AdminKpiConfigPage />} />
            </Route>
          </Route>

          {/* Department routes - admin and manager */}
          <Route
            element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}
          >
            <Route element={<AuthLayout />}>
              <Route
                path={ROUTES.DEPARTMENT}
                element={<DepartmentDashboardPage />}
              />
              <Route
                path={ROUTES.DEPARTMENT_SUB_KPIS}
                element={<SubKpiManagementPage />}
              />
              <Route
                path={ROUTES.DEPARTMENT_SUB_KPI_DETAIL}
                element={<SubKpiDetailPage />}
              />
              <Route
                path={ROUTES.DEPARTMENT_CHECKINS}
                element={<TeamCheckinsPage />}
              />
            </Route>
          </Route>

          {/* Employee routes - all authenticated users */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['admin', 'manager', 'medewerker']}
              />
            }
          >
            <Route element={<AuthLayout />}>
              <Route
                path={ROUTES.DASHBOARD}
                element={<EmployeeDashboardPage />}
              />
              <Route
                path={ROUTES.DASHBOARD_INPUT}
                element={<DataInputPage />}
              />
              <Route
                path={ROUTES.DASHBOARD_PLAN}
                element={<WeekPlanPage />}
              />
              <Route
                path={ROUTES.DASHBOARD_REVIEW}
                element={<WeekReviewPage />}
              />
            </Route>
          </Route>

          {/* Catch-all: redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
