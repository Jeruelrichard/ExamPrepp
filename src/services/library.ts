/**
 * ExamPrepp — library service (Supabase persistence).
 *
 * Saves and lists the user's Preps (study_sessions) and flashcard sets.
 * Follows the service contract: every function returns { data, error } and
 * never throws to the UI. Row ownership is enforced by RLS (user_id = auth.uid),
 * and user_id defaults to auth.uid() on insert, so callers don't pass it.
 *
 * We persist generated text/JSON only (predictions, guide markdown, flashcards)
 * — not the raw uploaded files. See prep-flow-design notes.
 */
import { supabase, isSupabaseConfigured } from './supabase';

export type Prediction = { topic: string; probability: number; reasoning: string };
export type Flashcard = { front: string; back: string };

export type StudySession = {
  id: string;
  course: string | null;
  title: string | null;
  predictions: Prediction[];
  summary: string | null;
  guide: string | null;
  topicsCovered: string[];
  createdAt: string;
};

export type FlashcardSet = {
  id: string;
  sessionId: string | null;
  title: string | null;
  cards: Flashcard[];
  createdAt: string;
};

type Result<T> = { data: T | null; error: string | null };

const NOT_CONFIGURED = 'Supabase is not configured.';

// ─────────────────────────────────────────────
// Study sessions (Preps)
// ─────────────────────────────────────────────

export async function saveStudySession(input: {
  course: string;
  title: string;
  predictions: Prediction[];
  summary: string;
  guide: string;
  topicsCovered: string[];
}): Promise<Result<{ id: string }>> {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        course: input.course,
        title: input.title,
        predictions: input.predictions,
        summary: input.summary,
        guide: input.guide,
        topics_covered: input.topicsCovered,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { data: { id: data.id }, error: null };
  } catch (err) {
    console.error('[ExamPrepp] saveStudySession failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

export async function listStudySessions(): Promise<Result<StudySession[]>> {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('id, course, title, predictions, summary, guide, topics_covered, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data ?? []).map(toStudySession), error: null };
  } catch (err) {
    console.error('[ExamPrepp] listStudySessions failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

export async function getStudySession(id: string): Promise<Result<StudySession>> {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('id, course, title, predictions, summary, guide, topics_covered, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: toStudySession(data), error: null };
  } catch (err) {
    console.error('[ExamPrepp] getStudySession failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

// ─────────────────────────────────────────────
// Flashcard sets
// ─────────────────────────────────────────────

export async function saveFlashcardSet(input: {
  sessionId: string | null;
  title: string;
  cards: Flashcard[];
}): Promise<Result<{ id: string }>> {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .insert({ session_id: input.sessionId, title: input.title, cards: input.cards })
      .select('id')
      .single();

    if (error) throw error;
    return { data: { id: data.id }, error: null };
  } catch (err) {
    console.error('[ExamPrepp] saveFlashcardSet failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

export async function listFlashcardSets(): Promise<Result<FlashcardSet[]>> {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('id, session_id, title, cards, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data ?? []).map(toFlashcardSet), error: null };
  } catch (err) {
    console.error('[ExamPrepp] listFlashcardSets failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

export async function getFlashcardSet(id: string): Promise<Result<FlashcardSet>> {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('id, session_id, title, cards, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: toFlashcardSet(data), error: null };
  } catch (err) {
    console.error('[ExamPrepp] getFlashcardSet failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

// ─────────────────────────────────────────────
// Row → domain mappers (jsonb columns are typed as Json)
// ─────────────────────────────────────────────

function toStudySession(row: {
  id: string;
  course: string | null;
  title: string | null;
  predictions: unknown;
  summary: string | null;
  guide: string | null;
  topics_covered: string[];
  created_at: string;
}): StudySession {
  return {
    id: row.id,
    course: row.course,
    title: row.title,
    predictions: (row.predictions as Prediction[]) ?? [],
    summary: row.summary,
    guide: row.guide,
    topicsCovered: row.topics_covered ?? [],
    createdAt: row.created_at,
  };
}

function toFlashcardSet(row: {
  id: string;
  session_id: string | null;
  title: string | null;
  cards: unknown;
  created_at: string;
}): FlashcardSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    cards: (row.cards as Flashcard[]) ?? [],
    createdAt: row.created_at,
  };
}
