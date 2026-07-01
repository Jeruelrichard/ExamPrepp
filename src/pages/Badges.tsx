import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../components/HistoryCard';
import { ShieldCheck } from '../components/icons';
import { listStudySessions } from '../services/library';
import type { StudySession } from '../services/library';
import { listBadges, claimBadge, explorerUrl } from '../services/badges';
import type { BadgeMint } from '../services/badges';

/**
 * Badges — the "Badges" tab, and the claim hub.
 *
 * Lists the user's completed preps: each shows its minted soulbound badge (with
 * a Solana Explorer link) or a "Claim badge" button. Badges are minted to server
 * custody (devnet), so state is read from the badge_mints table, not a wallet.
 * Claiming is additive — a failure never blocks anything (soft "retry").
 *
 * NOTE: claiming calls /api/mint-badge, which only runs on a Vercel deploy (not
 * the Vite dev server) — under `npm run dev` a claim will soft-fail to "Retry".
 */
type RowState = 'idle' | 'minting' | 'minted' | 'pending' | 'error';

export default function Badges({ className = '' }: { className?: string }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [badgeBySession, setBadgeBySession] = useState<Record<string, BadgeMint>>({});
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: sess }, { data: badges }] = await Promise.all([
        listStudySessions(),
        listBadges(),
      ]);
      if (!active) return;
      const map: Record<string, BadgeMint> = {};
      for (const b of badges ?? []) map[b.sessionId] = b;
      setBadgeBySession(map);
      setSessions(sess ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleClaim(sessionId: string) {
    setRowState((s) => ({ ...s, [sessionId]: 'minting' }));
    const { data, pending, error } = await claimBadge(sessionId);
    if (data) {
      setBadgeBySession((m) => ({
        ...m,
        [sessionId]: {
          ...(m[sessionId] ?? ({} as BadgeMint)),
          status: 'minted',
          txSignature: data.txSignature,
          assetAddress: data.assetAddress,
        } as BadgeMint,
      }));
      setRowState((s) => ({ ...s, [sessionId]: 'minted' }));
    } else if (pending) {
      setRowState((s) => ({ ...s, [sessionId]: 'pending' }));
    } else {
      console.warn('[ExamPrepp] badge claim:', error);
      setRowState((s) => ({ ...s, [sessionId]: 'error' }));
    }
  }

  function stateFor(sessionId: string): RowState {
    const override = rowState[sessionId];
    if (override) return override;
    const badge = badgeBySession[sessionId];
    if (badge?.status === 'minted') return 'minted';
    if (badge?.status === 'pending') return 'pending';
    return 'idle';
  }

  if (loading) {
    return (
      <section className={className}>
        <p className="py-16 text-center text-sm text-ink/50">Loading your badges…</p>
      </section>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState className={className} message="Upload your past questions to earn badges" />
    );
  }

  return (
    <section className={className}>
      <ul className="space-y-4">
        {sessions.map((s) => {
          const state = stateFor(s.id);
          const badge = badgeBySession[s.id];
          return (
            <li
              key={s.id}
              className="flex items-center gap-4 rounded-[14px] border border-ink/10 bg-card p-5"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  state === 'minted' ? 'bg-success/10 text-success' : 'bg-lavender text-indigo'
                }`}
              >
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold">
                  {s.course || s.title || 'Study credential'}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {formatDate(s.createdAt)} · Soulbound · Devnet
                </p>
              </div>
              {state === 'minted' && badge?.txSignature ? (
                <a
                  href={explorerUrl(badge.txSignature)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg border border-success/40 px-3 py-1.5 text-sm font-semibold text-success transition hover:bg-success/5"
                >
                  View ↗
                </a>
              ) : state === 'pending' ? (
                <span className="shrink-0 rounded-full bg-ink/5 px-3 py-1.5 text-xs text-ink/50">
                  Pending
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleClaim(s.id)}
                  disabled={state === 'minting'}
                  className="shrink-0 rounded-lg bg-indigo px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state === 'minting' ? 'Minting…' : state === 'error' ? 'Retry' : 'Claim badge'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
