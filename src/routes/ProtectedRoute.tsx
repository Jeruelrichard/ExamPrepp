import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute — auth gate STUB.
 *
 * TODO(auth): replace PLACEHOLDER_IS_AUTHENTICATED with a real Supabase
 * session check (e.g. a useAuth() hook reading supabase.auth.getSession()).
 * Until auth is wired, this intentionally lets everything through so the
 * team can build and review the /app screens without logging in.
 *
 * When auth lands: if the user is unauthenticated, redirect to /login and
 * remember where they were headed via location state so we can send them
 * back after a successful login.
 */
const PLACEHOLDER_IS_AUTHENTICATED = true;

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthenticated = PLACEHOLDER_IS_AUTHENTICATED;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
