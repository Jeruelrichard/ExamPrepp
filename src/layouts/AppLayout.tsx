import type { ComponentType } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ExamPreppProvider } from '../context/ExamPreppContext';
import { signOut } from '../services/auth';
import Logo from '../components/Logo';
import { Grid, Briefcase, Award, Cards, Settings, LogOut } from '../components/icons';

/**
 * AppLayout — chrome for the authenticated app.
 * Rendered by the /app layout route; child routes appear in <Outlet />.
 *
 * Responsive shell:
 *  - Desktop (lg+): a left sidebar — logo, vertical nav, then Settings + Log out
 *    pinned to the bottom.
 *  - Mobile/tablet: a top bar — logo + a Settings (gear) icon, with the nav as a
 *    horizontal tab row beneath it. Log out lives inside Settings here.
 *
 * "Workspace" maps to the existing /app/prep flow.
 */
type Tab = { to: string; label: string; end: boolean; icon: ComponentType<{ className?: string }> };

const TABS: Tab[] = [
  { to: '/app', label: 'Dashboard', end: true, icon: Grid },
  { to: '/app/prep', label: 'Workspace', end: false, icon: Briefcase },
  { to: '/app/badges', label: 'Badges', end: false, icon: Award },
  { to: '/app/flashcards', label: 'Flashcards', end: false, icon: Cards },
];

export default function AppLayout({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <ExamPreppProvider>
    <div className={`min-h-screen bg-surface text-ink lg:grid lg:grid-cols-[15rem_1fr] ${className}`}>
      {/* ── Sidebar (desktop) ───────────────────── */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-ink/5 bg-card px-4 py-6 lg:flex">
        <Link to="/app" aria-label="ExamPrepp home" className="px-2">
          <Logo />
        </Link>

        <nav className="mt-8 flex-1">
          <ul className="flex flex-col gap-1">
            {TABS.map(({ to, label, end, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={sideItemClass}>
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Pinned to bottom */}
        <div className="flex flex-col gap-1 border-t border-ink/5 pt-3">
          {user?.email && (
            <p className="truncate px-3 pb-1 text-xs text-ink/40" title={user.email}>
              {user.email}
            </p>
          )}
          <NavLink to="/app/settings" className={sideItemClass}>
            <Settings className="h-5 w-5" />
            Settings
          </NavLink>
          <button type="button" onClick={handleSignOut} className={logoutClass}>
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────── */}
      <div className="flex min-w-0 flex-col">
        {/* Top bar (mobile / tablet) */}
        <header className="border-b border-ink/5 bg-card lg:hidden">
          <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6">
            <Link to="/app" aria-label="ExamPrepp home">
              <Logo />
            </Link>
            <NavLink
              to="/app/settings"
              aria-label="Settings"
              className="rounded-lg border border-ink/10 p-2 text-ink/70 transition hover:border-ink/25 hover:text-ink"
            >
              <Settings className="h-5 w-5" />
            </NavLink>
          </div>

          <nav className="px-4 sm:px-6">
            <ul className="-mb-px flex items-center gap-5 overflow-x-auto font-display text-sm sm:gap-8">
              {TABS.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={topTabClass}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
    </ExamPreppProvider>
  );
}

/* ── className helpers ─────────────────────────── */

function sideItemClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 font-display text-sm transition-colors ${
    isActive ? 'bg-indigo/10 font-semibold text-indigo' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
  }`;
}

const logoutClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 font-display text-sm text-red-500 transition-colors hover:bg-red-500/10';

function topTabClass({ isActive }: { isActive: boolean }) {
  return `relative block whitespace-nowrap py-3 transition-colors ${
    isActive
      ? 'font-semibold text-indigo after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-indigo'
      : 'text-ink/60 hover:text-ink'
  }`;
}
