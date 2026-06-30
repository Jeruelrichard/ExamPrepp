import { useCallback, useEffect, useState } from 'react';
import { listFlashcardSets } from '../services/library';
import type { FlashcardSet } from '../services/library';

/**
 * useFlashcardSets — loads the signed-in user's saved flashcard sets for the
 * Flashcards history list. RLS scopes the rows to the current user.
 */
export function useFlashcardSets() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listFlashcardSets();
    if (error) setError(error);
    else setSets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sets, loading, error, refresh };
}
