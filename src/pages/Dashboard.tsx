import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

/**
 * Dashboard — the post-login home (Jennifer's Figma, iPhone screen 2).
 *
 * Greeting + three indigo stat squares (number above label, white text) + a
 * "Recent Activity" section that's empty for a new user. Stats are hardcoded to
 * zero for now: study-session persistence is a P1 feature (PRD §8.2), so a fresh
 * account genuinely has none. Wire to Supabase once sessions are stored.
 */
const STATS = [
  { label: 'Topics Studied', value: '0' },
  { label: 'Saved Preps', value: '0' },
  { label: 'Last Quiz Score', value: '0%' },
];

export default function Dashboard({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const firstName =
    (user?.user_metadata?.first_name as string | undefined)?.trim() || 'there';

  return (
    <section className={className}>
      <h1 className="font-display text-3xl font-bold">Hi, {firstName}</h1>

      {/* Stat squares — indigo fill, number over label (matches Figma) */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[14px] bg-indigo px-3 py-4 text-white shadow-sm"
          >
            <p className="font-display text-2xl font-bold leading-none">{stat.value}</p>
            <p className="mt-2 text-xs leading-tight text-white/80 sm:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity — empty for a fresh account */}
      <h2 className="mt-10 font-display text-lg font-semibold">Recent Activity</h2>
      <EmptyState className="mt-2" message="Nothing here yet!" />
    </section>
  );
}
