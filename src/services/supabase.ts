/**
 * Supabase client (frontend).
 *
 * Uses the ANON key, which is safe to expose in the browser bundle — row-level
 * security on the database is what actually protects data. The SERVICE ROLE key
 * must NEVER be VITE_-prefixed (it would leak into the bundle); it belongs only
 * in Vercel Functions.
 *
 * If the env vars are missing we still create a client against a harmless
 * placeholder so the app (e.g. the public landing page) keeps booting; auth
 * calls then short-circuit with a clear "not configured" error instead of
 * crashing the whole app.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[ExamPrepp] Supabase is not configured. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY in your .env to enable authentication.',
  );
}

export const supabase = createClient<Database>(
  url || 'http://localhost:54321',
  anonKey || 'placeholder-anon-key',
);
