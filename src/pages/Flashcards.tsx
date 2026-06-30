import { useFlashcardSets } from '../hooks/useFlashcardSets';
import EmptyState from '../components/EmptyState';
import HistoryCard, { formatDate } from '../components/HistoryCard';

/**
 * Flashcards — the "Flashcards" tab.
 *
 * Shows the user's saved flashcard sets as a history list (Jennifer's Figma,
 * iPhone 16-21); each opens the flip viewer at /app/flashcards/:id. With none
 * yet, shows the empty state. Sets are created via "Turn into Flashcards" on a
 * study guide.
 */
export default function Flashcards({ className = '' }: { className?: string }) {
  const { sets, loading } = useFlashcardSets();

  if (loading) {
    return (
      <section className={className}>
        <p className="py-16 text-center text-sm text-ink/50">Loading your flashcards…</p>
      </section>
    );
  }

  if (sets.length === 0) {
    return (
      <EmptyState
        className={className}
        message="Upload your past questions to create flashcards"
      />
    );
  }

  return (
    <section className={className}>
      <ul className="space-y-4">
        {sets.map((s) => (
          <li key={s.id}>
            <HistoryCard
              to={`/app/flashcards/${s.id}`}
              title={s.title || 'Flashcards'}
              date={formatDate(s.createdAt)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
