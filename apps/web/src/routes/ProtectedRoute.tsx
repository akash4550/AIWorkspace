import { Navigate, Outlet, useLocation } from 'react-router-dom';

import type { Role } from '../config/navigation';
import { useAuth } from '../providers/AuthProvider';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'initializing') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-700 dark:bg-slate-900 dark:text-gray-200" role="status">
        Restoring your session…
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
