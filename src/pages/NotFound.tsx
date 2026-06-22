import { Link } from 'react-router-dom';

/** NotFound — 404 fallback. */
export default function NotFound({ className = '' }: { className?: string }) {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center ${className}`}
    >
      <p className="font-display text-5xl font-bold text-indigo">404</p>
      <p className="text-ink/60">This page doesn’t exist.</p>
      <Link to="/" className="font-display text-sm font-semibold text-indigo underline">
        Back to home
      </Link>
    </main>
  );
}
