import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudyGuideView from '../components/StudyGuideView';
import { generateFlashcards } from '../services/gemini';
import { getStudySession, saveFlashcardSet } from '../services/library';
import type { Flashcard, StudySession } from '../services/library';

/**
 * StudyGuide — a saved Prep's study-guide reader (route /app/prep/:id).
 * Loads the session, then renders the focused StudyGuideView (16-13).
 *
 * "Turn into Flashcards" generates 20 cards from the stored guide, saves them as
 * a flashcard set, and opens the viewer. "Turn into Quiz" is deferred — it routes
 * to the Quiz coming-soon placeholder for now.
 */
export default function StudyGuide() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await getStudySession(id);
      if (!active) return;
      if (error) setLoadError(error);
      else setSession(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleTurnFlashcards() {
    if (!session?.guide) return;
    setCardsError(null);
    setCardsLoading(true);

    const { data, error } = await generateFlashcards(session.guide);
    if (error || !data) {
      setCardsError(error ?? 'Could not generate flashcards. Please try again.');
      setCardsLoading(false);
      return;
    }

    const base = session.course || session.topicsCovered[0] || session.title || 'Study';
    const saved = await saveFlashcardSet({
      sessionId: session.id,
      title: `${base} Flashcards`,
      cards: data.flashcards as Flashcard[],
    });
    setCardsLoading(false);

    if (saved.error || !saved.data) {
      setCardsError(saved.error ?? 'Could not save flashcards. Please try again.');
      return;
    }
    navigate(`/app/flashcards/${saved.data.id}`);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface text-sm text-ink/50">
        Loading your study guide…
      </div>
    );
  }

  if (loadError || !session || !session.guide) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="text-sm text-ink/60">
          {loadError ?? 'This study guide could not be found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/prep')}
          className="rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <StudyGuideView
      title={session.course || session.title || 'Study Guide'}
      guide={session.guide}
      onBack={() => navigate('/app/prep')}
      onTurnFlashcards={handleTurnFlashcards}
      onTurnQuiz={() => navigate('/app/quiz')}
      flashcardsLoading={cardsLoading}
      flashcardsError={cardsError}
    />
  );
}
