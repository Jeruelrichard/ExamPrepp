/**
 * ExamPrepp — badges client service.
 *
 * `claimBadge` calls the /api/mint-badge Vercel Function with the user's Supabase
 * JWT; `listBadges` / `getSessionBadge` read the badge_mints table (RLS-scoped).
 * Badges are minted to server custody, so the gallery reads from the DB (not a
 * student wallet). Every function returns { ... , error } and never throws to UI —
 * the credential layer is additive and must never block the core flow.
 */
import { supabase, isSupabaseConfigured } from './supabase';

export type BadgeStatus = 'pending' | 'minted' | 'failed';

export type BadgeMint = {
  id: string;
  sessionId: string;
  course: string | null;
  title: string | null;
  status: BadgeStatus;
  assetAddress: string | null;
  txSignature: string | null;
  ownerAddress: string | null;
  createdAt: string;
};

export function explorerUrl(txSignature: string) {
  return `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
}

type ClaimResult = {
  data: { assetAddress: string | null; txSignature: string; explorerUrl: string } | null;
  pending: boolean;
  error: string | null;
};

export async function claimBadge(sessionId: string): Promise<ClaimResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { data: null, pending: false, error: 'Please sign in to claim your badge.' };

    const res = await fetch('/api/mint-badge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    });

    // 202 = mint already in progress (idempotent) — treat as a soft pending state.
    if (res.status === 202) return { data: null, pending: true, error: null };

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, pending: false, error: body.message || 'Could not mint your badge.' };
    }

    return {
      data: {
        assetAddress: body.assetAddress ?? null,
        txSignature: body.txSignature,
        explorerUrl: body.explorerUrl ?? explorerUrl(body.txSignature),
      },
      pending: false,
      error: null,
    };
  } catch (err) {
    console.error('[ExamPrepp] claimBadge failed (non-blocking):', err);
    return { data: null, pending: false, error: (err as Error).message };
  }
}

export async function listBadges(): Promise<{ data: BadgeMint[] | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: 'Supabase is not configured.' };
  try {
    const { data, error } = await supabase
      .from('badge_mints')
      .select('id, session_id, course, title, status, asset_address, tx_signature, owner_address, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: (data ?? []).map(toBadge), error: null };
  } catch (err) {
    console.error('[ExamPrepp] listBadges failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

export async function getSessionBadge(
  sessionId: string,
): Promise<{ data: BadgeMint | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: 'Supabase is not configured.' };
  try {
    const { data, error } = await supabase
      .from('badge_mints')
      .select('id, session_id, course, title, status, asset_address, tx_signature, owner_address, created_at')
      .eq('session_id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return { data: data ? toBadge(data) : null, error: null };
  } catch (err) {
    console.error('[ExamPrepp] getSessionBadge failed:', err);
    return { data: null, error: (err as Error).message };
  }
}

function toBadge(row: {
  id: string;
  session_id: string;
  course: string | null;
  title: string | null;
  status: string;
  asset_address: string | null;
  tx_signature: string | null;
  owner_address: string | null;
  created_at: string;
}): BadgeMint {
  return {
    id: row.id,
    sessionId: row.session_id,
    course: row.course,
    title: row.title,
    status: (row.status as BadgeStatus) ?? 'pending',
    assetAddress: row.asset_address,
    txSignature: row.tx_signature,
    ownerAddress: row.owner_address,
    createdAt: row.created_at,
  };
}
