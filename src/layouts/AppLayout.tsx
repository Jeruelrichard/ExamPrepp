import { Link, NavLink, Outlet } from 'react-router-dom';

/**
 * AppLayout — chrome for the authenticated app.
 * Rendered by the /app layout route; child routes appear in <Outlet />.
 * Naked shell for now — Jennifer's design system slots in later.
 */
export default function AppLayout({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-surface text-ink ${className}`}>
      <header className="border-b border-black/5 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/app" className="font-wordmark text-2xl text-indigo">
            ExamPrepp
          </Link>
          <div className="flex items-center gap-6 font-display text-sm">
            <NavLink to="/app" end>
              Dashboard
            </NavLink>
            <NavLink to="/app/prep">New Prep</NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
