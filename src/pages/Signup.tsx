import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { signUpWithEmail } from '../services/auth';

const labelCls = 'mb-2 block text-sm font-semibold text-ink';
const inputCls =
  'w-full rounded-full bg-lavender px-5 py-4 text-ink placeholder:text-ink/40 outline-none transition focus:ring-2 focus:ring-indigo';
const submitCls =
  'w-full rounded-full bg-navy px-6 py-4 font-display text-lg font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60';

/** Signup — "Sign up". First/last name + email + password, plus Google OAuth. */
export default function Signup({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const res = await signUpWithEmail(email, password, { firstName, lastName });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // Email confirmation OFF → live session → into the app.
    // Email confirmation ON → no session yet → tell them to check their inbox.
    if (res.data?.session) {
      navigate('/app', { replace: true });
    } else {
      setNotice('Check your email to confirm your account, then log in.');
    }
  }

  // Already signed in? Skip the form.
  if (session) return <Navigate to="/app" replace />;

  return (
    <AuthLayout>
      <div className={className}>
        <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">Sign up</h1>

        {error && (
          <p className="mt-6 rounded-2xl bg-[#e63838]/10 px-4 py-3 text-sm text-[#c92a2a]">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-6 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
            {notice}
          </p>
        )}

        <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className={labelCls}>
              First name
            </label>
            <input
              id="firstName"
              type="text"
              required
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelCls}>
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              required
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
            />
          </div>
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
              minLength={6}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          <button type="submit" disabled={loading} className={`mt-2 ${submitCls}`}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/60">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo">
            Log In
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
