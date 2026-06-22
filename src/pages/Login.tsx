import { Link } from 'react-router-dom';

/** Login — email + password. Shell only (Supabase auth wires in later). */
export default function Login({ className = '' }: { className?: string }) {
  return (
    <main
      className={`flex min-h-screen items-center justify-center bg-surface px-6 ${className}`}
    >
      <div className="w-full max-w-sm rounded-[14px] bg-white p-8 shadow-sm">
        <Link to="/" className="font-wordmark text-3xl text-indigo">
          ExamPrepp
        </Link>
        <h1 className="mt-6 font-display text-xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-ink/60">Log in to your account.</p>

        <form className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="rounded-[14px] border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-indigo"
          />
          <input
            type="password"
            placeholder="Password"
            className="rounded-[14px] border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-indigo"
          />
          <button
            type="button"
            className="mt-2 rounded-[14px] bg-indigo px-4 py-2.5 font-display text-sm font-semibold text-white"
          >
            Log in
          </button>
        </form>

        <p className="mt-4 text-sm text-ink/60">
          No account?{' '}
          <Link to="/signup" className="font-semibold text-indigo">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
