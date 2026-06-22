import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

/**
 * AuthProvider — holds the current Supabase session and keeps it in sync.
 *
 * `loading` is true until the initial session check resolves, so guards like
 * ProtectedRoute can avoid flashing the login page before we know who's signed in.
 */
type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // onAuthStateChange fires INITIAL_SESSION once the client finishes
    // initializing — crucially, AFTER it exchanges an OAuth redirect's code for
    // a session. Driving state from here (rather than a separate getSession call)
    // avoids a race where getSession resolves null mid-OAuth-callback and a guard
    // bounces the user to /login while they're actually being signed in. It also
    // keeps us in sync on later sign-in / sign-out / token-refresh events.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
