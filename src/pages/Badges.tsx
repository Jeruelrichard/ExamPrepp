import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../components/HistoryCard';
import { ShieldCheck } from '../components/icons';
import { listBadges, explorerUrl } from '../services/badges';
import type { BadgeMint } from '../services/badges';

/**
 * Badges — the "Badges" tab. Gallery of the user's soulbound credentials.
 *
 * Badges are minted to server custody (devnet), so this reads from the
 * badge_mints table (RLS-scoped), not a student wallet. Each minted badge links
 * to the Solana Explorer. Empty → the shared empty state.
 */
export default function Badges({ className = '' }: { className?: string }) {
  const [badges, setBadges] = useState<BadgeMint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await listBadges();
      if (!active) return;
      setBadges(data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className={className}>
        <p className="py-16 text-center text-sm text-ink/50">Loading your badges…</p>
      </section>
    );
  }

  if (badges.length === 0) {
    return (
      <EmptyState className={className} message="Upload your past questions to earn badges" />
    );
  }

  return (
    <section className={className}>
      <ul className="space-y-4">
        {badges.map((b) => (
          <li
            key={b.id}
            className="flex items-center gap-4 rounded-[14px] border border-ink/10 bg-card p-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender text-indigo">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold">
                {b.title || b.course || 'Study credential'}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">
                {formatDate(b.createdAt)} · Soulbound · Devnet
              </p>
            </div>
            {b.status === 'minted' && b.txSignature ? (
              <a
                href={explorerUrl(b.txSignature)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg border border-indigo/40 px-3 py-1.5 text-sm font-semibold text-indigo transition hover:bg-indigo/5"
              >
                View ↗
              </a>
            ) : (
              <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/50">
                {b.status === 'pending' ? 'Pending' : 'Unavailable'}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
