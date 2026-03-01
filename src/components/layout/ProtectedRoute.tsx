import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/database';
import { ROUTES } from '@/lib/constants';

interface ProtectedRouteProps {
  allowedRoles?: UserRole | UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-slate-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!profile.is_actief) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(profile.rol)) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }
  }

  return <Outlet />;
}
