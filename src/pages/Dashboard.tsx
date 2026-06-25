import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus } from '../components/icons';

/**
 * Dashboard — the post-login home (Jennifer's Figma, iPhone screen 2).
 *
 * Greeting + three at-a-glance stat cards + a "Recent Activity" list that is
 * empty for a brand-new user. Stats are hardcoded to zero for now: study-session
 * persistence is a P1 feature (see PRD §8.2), so a fresh account genuinely has
 * none. Wire these to real Supabase data once sessions are stored.
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

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm"
          >
            <p className="font-display text-2xl font-bold text-indigo">{stat.value}</p>
            <p className="mt-1 text-xs text-ink/60 sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <h2 className="mt-10 font-display text-lg font-semibold">Recent Activity</h2>
      <div className="mt-4 flex flex-col items-center justify-center rounded-[14px] border border-dashed border-black/10 bg-white px-6 py-14 text-center">
        <RecentEmptyMark className="h-28 w-auto" />
        <p className="mt-5 font-display text-base text-ink/70">Nothing here yet!</p>
        <Link
          to="/app/prep"
          className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-indigo/90"
        >
          <Plus className="h-4 w-4" />
          New Prep
        </Link>
      </div>
    </section>
  );
}

/** Decorative placeholder mark for the empty Recent Activity panel. */
function RecentEmptyMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 90" fill="none" aria-hidden="true">
      <rect x="22" y="16" width="76" height="58" rx="10" fill="var(--color-lavender)" opacity="0.5" />
      <rect x="34" y="32" width="52" height="6" rx="3" fill="var(--color-indigo)" opacity="0.5" />
      <rect x="34" y="46" width="38" height="6" rx="3" fill="var(--color-indigo)" opacity="0.3" />
    </svg>
  );
}
