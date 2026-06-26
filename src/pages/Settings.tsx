import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { LogOut } from '../components/icons';

/**
 * Settings — placeholder for now (Jennifer is designing the real screen:
 * theme toggle (light/dark), billing, and log out).
 *
 * Log out lives here so it stays reachable on mobile, where it's no longer a
 * top-level button. Theme + Billing are shown as disabled "coming soon" rows.
 */
const COMING_SOON = [
  { label: 'Appearance', detail: 'Light / dark mode' },
  { label: 'Billing', detail: 'Plan & payments (Paystack)' },
];

export default function Settings({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <section className={className}>
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      {user?.email && <p className="mt-1 text-sm text-ink/50">{user.email}</p>}

      <div className="mt-6 divide-y divide-black/5 overflow-hidden rounded-[14px] border border-black/5 bg-white">
        {COMING_SOON.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-display text-sm font-semibold">{row.label}</p>
              <p className="text-xs text-ink/50">{row.detail}</p>
            </div>
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs text-ink/50">
              Coming soon
            </span>
          </div>
        ))}

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-5 py-4 text-left font-display text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/5"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </div>
    </section>
  );
}
