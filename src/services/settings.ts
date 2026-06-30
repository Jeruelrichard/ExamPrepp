/**
 * ExamPrepp — user settings service (Supabase).
 *
 * Currently just the theme preference, stored on the user's profile row so it
 * syncs across devices. Follows the { data, error } contract and guards
 * isSupabaseConfigured. RLS scopes the row to the owner (id = auth.uid()).
 */
import { supabase, isSupabaseConfigured } from './supabase';

export type Theme = 'light' | 'dark';

export async function getTheme(): Promise<{ data: Theme | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: 'Supabase is not configured.' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('theme')
      .maybeSingle();
    if (error) throw error;
    const theme = data?.theme === 'dark' ? 'dark' : data?.theme === 'light' ? 'light' : null;
    return { data: theme, error: null };
  } catch (err) {
    console.error('[ExamPrepp] getTheme failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

export async function saveTheme(theme: Theme): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured.' };
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ theme, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[ExamPrepp] saveTheme failed:', err);
    return { error: (err as Error).message };
  }
}
