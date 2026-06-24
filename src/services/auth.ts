/**
 * Auth service — thin wrapper over supabase.auth.
 * Every function returns { data, error } and never throws to the UI layer,
 * matching the service-layer contract in CLAUDE.md.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const NOT_CONFIGURED =
  'Authentication isn’t set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.';

/** Where Google sends the user back to after the OAuth round-trip. */
const oauthRedirectTo = () => `${window.location.origin}/app`;

export async function signUpWithEmail(
  email: string,
  password: string,
  meta?: { firstName?: string; lastName?: string },
) {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Stored on the user as user_metadata (first_name / last_name).
      options: { data: { first_name: meta?.firstName, last_name: meta?.lastName } },
    });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    // Redirects the browser to Google; supabase-js parses the returning session
    // from the URL automatically (detectSessionInUrl defaults to true).
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: oauthRedirectTo() },
    });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function signOut() {
  if (!isSupabaseConfigured) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
