import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { signOut } from '../services/auth';
import { ChevronLeft } from '../components/icons';

/**
 * Settings — Jennifer's Figma (moreScreens iPhone 16-26).
 *
 * Grouped list: "Billings and Plans" (placeholder) and a "Dark mode" toggle
 * wired to the app-wide theme (persisted to Supabase via ThemeProvider). A
 * lavender "Log Out" button opens a confirmation dialog (16-29).
 */
export default function Settings({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <section className={`flex min-h-[70vh] flex-col ${className}`}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 font-display text-2xl font-bold text-ink transition hover:text-indigo"
      >
        <ChevronLeft className="h-7 w-7" />
        Settings
      </button>

      {/* Grouped list */}
      <div className="mt-8 divide-y divide-ink/10 overflow-hidden rounded-[16px] border border-ink/10 bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-ink/5"
        >
          <span className="font-display text-base text-ink">Billings and Plans</span>
        </button>

        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-display text-base text-ink">Dark mode</span>
          <Toggle on={theme === 'dark'} onToggle={toggleTheme} label="Dark mode" />
        </div>
      </div>

      {/* Log out */}
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="mt-auto w-full rounded-full bg-lavender px-6 py-4 font-display text-base font-bold text-ink transition hover:brightness-95"
      >
        Log Out
      </button>

      {confirmOpen && (
        <LogoutConfirm onYes={handleLogout} onNo={() => setConfirmOpen(false)} />
      )}
    </section>
  );
}

/* ── Toggle switch ─────────────────────────────── */
function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? 'bg-indigo' : 'bg-ink/20'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ── Log out confirmation (16-29) ──────────────── */
function LogoutConfirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      onClick={onNo}
      role="dialog"
      aria-label="Confirm log out"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[20px] bg-gradient-to-br from-lavender to-card p-6 shadow-2xl"
      >
        <p className="text-center font-display text-lg font-bold text-ink">
          Do you want to log out?
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onNo}
            className="rounded-full bg-lavender px-5 py-3 font-display font-bold text-ink transition hover:brightness-95"
          >
            No
          </button>
          <button
            type="button"
            onClick={onYes}
            className="rounded-full border border-ink/15 bg-card px-5 py-3 font-display font-bold text-ink transition hover:bg-ink/5"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
