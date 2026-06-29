import { useCallback, useEffect, useState } from 'react';
import { listStudySessions } from '../services/library';
import type { StudySession } from '../services/library';

/**
 * useStudySessions — loads the signed-in user's saved Preps for the Workspace
 * history list. RLS scopes the rows to the current user.
 */
export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listStudySessions();
    if (error) setError(error);
    else setSessions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, error, refresh };
}
