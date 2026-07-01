/**
 * ExamPrepp — POST /api/mint-badge  (Vercel Serverless Function, devnet)
 *
 * Mints a soulbound (non-transferable) Metaplex Core badge for a completed prep,
 * backend-pays-and-custodies. This is an ADDITIVE credential — a failure here
 * must never block the core flow; the client surfaces a soft "credential pending".
 *
 * Security (all enforced below):
 *   1. AUTH-GATE      — requires a valid Supabase JWT (Bearer token); no anon minting.
 *   2. VERIFY         — the caller must OWN the study_sessions row being claimed.
 *   3. IDEMPOTENCY    — one badge per (user_id, session_id); UNIQUE constraint +
 *                       pending-row-before-mint; retries return the existing asset.
 *   4. KEY HYGIENE    — the mint keypair loads ONLY from MINT_AUTHORITY_SECRET_KEY;
 *                       never logged, never returned.
 *
 * Env (server-only, never VITE_): SOLANA_RPC_URL, MINT_AUTHORITY_SECRET_KEY (base58),
 * SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_APP_URL (for the metadata URI).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { create, mplCore } from '@metaplex-foundation/mpl-core';
import {
  generateSigner,
  keypairIdentity,
  publicKey as toPublicKey,
  type Umi,
} from '@metaplex-foundation/umi';
import bs58 from 'bs58';

/**
 * Decode a Solana secret key from either format:
 *  - a JSON byte array `[12,34,...]` (Solana CLI / solana-keygen), or
 *  - a base58 string (Phantom export).
 */
function decodeSecretKey(secret: string): Uint8Array {
  const s = secret.trim();
  if (s.startsWith('[')) return Uint8Array.from(JSON.parse(s) as number[]);
  return bs58.decode(s);
}

// ── Umi (mint authority) — built once per cold start ──────────────
let _umi: Umi | null = null;

function getUmi(): Umi {
  if (_umi) return _umi;
  const rpc = process.env.SOLANA_RPC_URL;
  const secret = process.env.MINT_AUTHORITY_SECRET_KEY;
  if (!rpc) throw new Error('missing_rpc');
  if (!secret) throw new Error('missing_mint_key');

  const umi = createUmi(rpc).use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(decodeSecretKey(secret));
  umi.use(keypairIdentity(keypair));
  _umi = umi;
  return umi;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('missing_supabase_admin');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  // ── 1. AUTH-GATE ───────────────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ message: 'Sign in to claim a badge.' });

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return res.status(500).json({ message: 'Badge service is not configured.' });
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return res.status(401).json({ message: 'Your session has expired.' });

  // ── validate input ─────────────────────────────────────────────
  const body = (req.body ?? {}) as { sessionId?: unknown; ownerAddress?: unknown };
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  if (!sessionId) return res.status(400).json({ message: 'sessionId is required.' });

  let ownerAddressParam: string | null = null;
  if (typeof body.ownerAddress === 'string' && body.ownerAddress.trim()) {
    try {
      toPublicKey(body.ownerAddress.trim()); // throws on invalid base58 pubkey
      ownerAddressParam = body.ownerAddress.trim();
    } catch {
      return res.status(400).json({ message: 'Invalid wallet address.' });
    }
  }

  // ── 2. VERIFY COMPLETION (must own this prep) ──────────────────
  const { data: session } = await supabase
    .from('study_sessions')
    .select('id, course, title')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!session) {
    return res.status(403).json({ message: 'No completed prep found for this badge.' });
  }

  // ── 3. IDEMPOTENCY ─────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('badge_mints')
    .select('status, asset_address, tx_signature')
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existing?.status === 'minted' && existing.tx_signature) {
    return res.status(200).json({
      assetAddress: existing.asset_address,
      txSignature: existing.tx_signature,
      explorerUrl: explorerUrl(existing.tx_signature),
      alreadyMinted: true,
    });
  }
  if (existing?.status === 'pending') {
    return res.status(202).json({ message: 'Your badge is already being minted.' });
  }
  if (existing?.status === 'failed') {
    // Clear the failed attempt so this claim can retry cleanly.
    await supabase.from('badge_mints').delete().eq('user_id', user.id).eq('session_id', sessionId);
  }

  // Reserve the (user, session) slot BEFORE minting. The UNIQUE constraint makes
  // this the concurrency backstop: a racing request hits 23505 and bails.
  const ownerAddressToStore = ownerAddressParam; // null = custody (filled in after mint)
  const { error: insErr } = await supabase.from('badge_mints').insert({
    user_id: user.id,
    session_id: sessionId,
    course: session.course,
    title: session.title,
    status: 'pending',
    owner_address: ownerAddressToStore,
  });
  if (insErr) {
    // 23505 = unique_violation → another request already reserved/minted it.
    return res.status(202).json({ message: 'Your badge is already being minted.' });
  }

  // ── 4. MINT (key hygiene: secret only via env, never logged) ───
  try {
    const umi = getUmi();
    const asset = generateSigner(umi);
    const custodyOwner = umi.identity.publicKey.toString();
    const owner = ownerAddressParam ? toPublicKey(ownerAddressParam) : umi.identity.publicKey;
    const name = `ExamPrepp — ${session.course || session.title || 'Study Credential'}`.slice(0, 32);
    const uri = `${process.env.VITE_APP_URL || 'https://examprepp-app.vercel.app'}/badge-metadata.json`;

    const { signature } = await create(umi, {
      asset,
      name,
      uri,
      owner,
      plugins: [{ type: 'PermanentFreezeDelegate', frozen: true, authority: { type: 'None' } }],
    }).sendAndConfirm(umi);

    const txSignature = bs58.encode(signature);
    const assetAddress = asset.publicKey.toString();

    await supabase
      .from('badge_mints')
      .update({
        status: 'minted',
        asset_address: assetAddress,
        tx_signature: txSignature,
        owner_address: ownerAddressParam || custodyOwner,
      })
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    return res.status(200).json({ assetAddress, txSignature, explorerUrl: explorerUrl(txSignature) });
  } catch (err) {
    // Roll back the reservation so the student can retry later. Never leak details.
    await supabase.from('badge_mints').delete().eq('user_id', user.id).eq('session_id', sessionId);
    console.error('[ExamPrepp] mint failed:', (err as Error).message);
    return res.status(500).json({ message: 'Minting is temporarily unavailable. Please try again.' });
  }
}
