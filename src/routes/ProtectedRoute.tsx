import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — real Supabase session gate.
 *
 * While the initial session check is in flight we render nothing (avoids a
 * flash of the login page). If there's no session, redirect to /login and
 * remember where the user was headed (location state) so we can send them
 * back after a successful login.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-ink/50">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
