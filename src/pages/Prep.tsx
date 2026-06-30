import { Link } from 'react-router-dom';
import { useStudySessions } from '../hooks/useStudySessions';
import EmptyState from '../components/EmptyState';
import HistoryCard, { formatDate } from '../components/HistoryCard';
import { Plus } from '../components/icons';

/**
 * Prep — the "Workspace" tab.
 *
 * Shows the user's saved Preps as a history list (Jennifer's Figma, iPhone
 * 16-19); each opens its study guide at /app/prep/:id. With no saved Preps yet,
 * shows the empty state inviting a New Prep. The in-progress upload/analyze flow
 * lives at /app/prep/new.
 */
export default function Prep({ className = '' }: { className?: string }) {
  const { sessions, loading } = useStudySessions();

  if (loading) {
    return (
      <section className={className}>
        <p className="py-16 text-center text-sm text-ink/50">Loading your Preps…</p>
      </section>
    );
  }

  if (sessions.length === 0) {
    return <EmptyState className={className} message="Upload your past questions" />;
  }

  return (
    <section className={className}>
      <div className="mb-4 flex justify-end">
        <Link
          to="/app/prep/new"
          className="inline-flex items-center gap-2 rounded-[12px] bg-indigo px-4 py-2 font-display text-sm font-semibold text-white transition hover:bg-indigo/90"
        >
          <Plus className="h-4 w-4" />
          New Prep
        </Link>
      </div>

      <ul className="space-y-4">
        {sessions.map((s) => (
          <li key={s.id}>
            <HistoryCard
              to={`/app/prep/${s.id}`}
              title={s.title || s.course || 'Study guide'}
              date={formatDate(s.createdAt)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
