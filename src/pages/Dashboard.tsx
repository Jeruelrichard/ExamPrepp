import { useAuth } from '../context/AuthContext';
import { useStudySessions } from '../hooks/useStudySessions';
import EmptyState from '../components/EmptyState';
import HistoryCard, { formatDate } from '../components/HistoryCard';

/**
 * Dashboard — the post-login home (Jennifer's Figma, iPhone screen 2).
 *
 * Greeting + three indigo stat squares + Recent Activity. Saved Preps and Topics
 * Studied are derived from the user's persisted study sessions; Last Quiz Score
 * stays 0% until the quiz feature ships.
 */
export default function Dashboard({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const { sessions } = useStudySessions();

  const firstName =
    (user?.user_metadata?.first_name as string | undefined)?.trim() || 'there';

  const topicsStudied = new Set(sessions.flatMap((s) => s.topicsCovered)).size;
  const stats = [
    { label: 'Topics Studied', value: String(topicsStudied) },
    { label: 'Saved Preps', value: String(sessions.length) },
    { label: 'Last Quiz Score', value: '0%' },
  ];
  const recent = sessions.slice(0, 4);

  return (
    <section className={className}>
      <h1 className="font-display text-3xl font-bold">Hi, {firstName}</h1>

      {/* Stat squares — lavender fill, dark text, number over label (matches Figma) */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[14px] bg-lavender px-3 py-5 sm:px-4">
            <p className="font-display text-2xl font-bold leading-none text-ink">{stat.value}</p>
            <p className="mt-3 whitespace-nowrap text-[11px] leading-tight text-ink/70 sm:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <h2 className="mt-10 font-display text-lg font-semibold">Recent Activity</h2>
      {recent.length === 0 ? (
        <EmptyState className="mt-2" message="Nothing here yet!" />
      ) : (
        <ul className="mt-4 space-y-4">
          {recent.map((s) => (
            <li key={s.id}>
              <HistoryCard
                to={`/app/prep/${s.id}`}
                title={s.title || s.course || 'Study guide'}
                date={formatDate(s.createdAt)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
