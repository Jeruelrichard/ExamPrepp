import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import Logo from '../components/Logo';

/**
 * AppLayout — chrome for the authenticated app.
 * Rendered by the /app layout route; child routes appear in <Outlet />.
 *
 * Matches Jennifer's Figma (Dashscreens): logo top-left, a four-tab nav
 * (Dashboard · Workspace · Badges · Flashcards) with an underline on the active
 * tab. "Workspace" maps to the existing /app/prep flow. Log out is kept at the
 * nav's right edge (not in the mockup, but needed in the real app).
 */
const TABS = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/prep', label: 'Workspace', end: false },
  { to: '/app/badges', label: 'Badges', end: false },
  { to: '/app/flashcards', label: 'Flashcards', end: false },
];

export default function AppLayout({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className={`min-h-screen bg-surface text-ink ${className}`}>
      <header className="border-b border-black/5 bg-white">
        {/* Row 1 — brand + account */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 pt-4 sm:px-6">
          <NavLink to="/app" end aria-label="ExamPrepp home">
            <Logo />
          </NavLink>

          <div className="flex items-center gap-3 text-sm">
            {user?.email && (
              <span className="hidden text-ink/50 sm:inline">{user.email}</span>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-black/10 px-3 py-1.5 font-display font-semibold text-ink/70 transition hover:border-black/25 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Row 2 — tab bar */}
        <nav className="mx-auto max-w-5xl px-4 sm:px-6">
          <ul className="-mb-px flex items-center gap-5 overflow-x-auto font-display text-sm sm:gap-8">
            {TABS.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `relative block whitespace-nowrap py-3 transition-colors ${
                      isActive
                        ? 'font-semibold text-indigo after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-indigo'
                        : 'text-ink/60 hover:text-ink'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
