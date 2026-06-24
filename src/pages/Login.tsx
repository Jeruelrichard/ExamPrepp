import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { signInWithEmail } from '../services/auth';

const labelCls = 'mb-2 block text-sm font-semibold text-ink';
const inputCls =
  'w-full rounded-full bg-lavender px-5 py-4 text-ink placeholder:text-ink/40 outline-none transition focus:ring-2 focus:ring-indigo';
const submitCls =
  'w-full rounded-full bg-navy px-6 py-4 font-display text-lg font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60';

/** Login — "Welcome Back". Email + password, plus Google OAuth. */
export default function Login({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate(from, { replace: true });
  }

  // Already signed in? Skip the form.
  if (session) return <Navigate to={from} replace />;

  return (
    <AuthLayout>
      <div className={className}>
        <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">Welcome Back</h1>
        <p className="mt-2 text-lg text-ink/60">Sign in and get started</p>

        {error && (
          <p className="mt-6 rounded-2xl bg-[#e63838]/10 px-4 py-3 text-sm text-[#c92a2a]">
            {error}
          </p>
        )}

        <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          <button type="submit" disabled={loading} className={`mt-2 ${submitCls}`}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/60">
          No account?{' '}
          <Link to="/signup" className="font-semibold text-indigo">
            Sign up
          </Link>
        </p>

        <div className="my-8 flex items-center justify-center rounded-full bg-lavender-soft py-2.5">
          <span className="text-sm font-medium text-ink/45">or</span>
        </div>

        <GoogleButton onError={setError} />
      </div>
    </AuthLayout>
  );
}
