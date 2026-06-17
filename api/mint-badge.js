/**
 * ExamPrepp — /api/mint-badge (Vercel Serverless Function)
 *
 * This is where the actual on-chain minting happens.
 * The backend wallet (MINTING_WALLET_PRIVATE_KEY) lives HERE and ONLY HERE.
 * It is never exposed to the frontend or the browser bundle.
 *
 * What this function does:
 *   1. Receives { studentWalletAddress, metadata } from the frontend
 *   2. Creates a Umi instance signed by the backend minting wallet
 *   3. Mints a Metaplex Core asset directly to the student's wallet
 *   4. Enforces soulbound via PermanentFreezeDelegate (frozen, authority: None)
 *   5. Returns the transaction signature to the frontend
 *
 * The student never signs or pays. The backend wallet covers all fees.
 * Cost per mint: ~0.0044 SOL (~$0.70 at $160/SOL) on mainnet. Free on devnet.
 *
 * ─── npm packages required ────────────────────────────────────────────────
 * npm install @metaplex-foundation/umi-bundle-defaults \
 *             @metaplex-foundation/mpl-core \
 *             @metaplex-foundation/umi \
 *             @metaplex-foundation/umi-web3js-adapters \
 *             @solana/web3.js \
 *             bs58
 * npm install --save-dev @vercel/node
 * ──────────────────────────────────────────────────────────────────────────
 *
 * ─── Environment variables (Vercel dashboard or .env.local) ───────────────
 * MINTING_WALLET_PRIVATE_KEY=   # base58-encoded secret key — NEVER prefix with VITE_
 * VITE_HELIUS_RPC_URL=          # Helius devnet or mainnet endpoint
 * VITE_SOLANA_NETWORK=          # "devnet" | "mainnet-beta"
 * VITE_APP_URL=                 # e.g. https://examprepp.vercel.app
 * ──────────────────────────────────────────────────────────────────────────
 */

import { createUmi }              from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity,
         generateSigner,
         publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { create, mplCore }        from '@metaplex-foundation/mpl-core';
import { fromWeb3JsKeypair }      from '@metaplex-foundation/umi-web3js-adapters';
import { Keypair }                from '@solana/web3.js';
import bs58                       from 'bs58';


// ─────────────────────────────────────────────
// Umi instance (initialised once per cold start)
// ─────────────────────────────────────────────

let _umi = null;

function getUmi() {
  if (_umi) return _umi;

  const rpcUrl    = process.env.VITE_HELIUS_RPC_URL;
  const privateKey = process.env.MINTING_WALLET_PRIVATE_KEY;

  if (!rpcUrl)     throw new Error('VITE_HELIUS_RPC_URL is not set.');
  if (!privateKey) throw new Error('MINTING_WALLET_PRIVATE_KEY is not set.');

  // Decode base58 private key → Web3.js Keypair → Umi signer
  const secretKey     = bs58.decode(privateKey);
  const web3Keypair   = Keypair.fromSecretKey(secretKey);
  const umiKeypair    = fromWeb3JsKeypair(web3Keypair);

  _umi = createUmi(rpcUrl)
    .use(keypairIdentity(umiKeypair))
    .use(mplCore());

  return _umi;
}


// ─────────────────────────────────────────────
// Vercel Function handler
// ─────────────────────────────────────────────

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { studentWalletAddress, metadata } = req.body || {};

  // Validate inputs
  if (!studentWalletAddress || typeof studentWalletAddress !== 'string') {
    return res.status(400).json({ message: 'studentWalletAddress is required.' });
  }
  if (!metadata || typeof metadata.name !== 'string') {
    return res.status(400).json({ message: 'metadata object is required.' });
  }

  try {
    const umi   = getUmi();
    const asset = generateSigner(umi);

    // Resolve the student's wallet as a Umi PublicKey
    const owner = umiPublicKey(studentWalletAddress);

    // Resolve the metadata URI
    // For hackathon: serve a static JSON from /public/badge-metadata.json
    // Post-hackathon: upload per-badge JSON to Irys and use the returned URI
    const metadataUri = `${process.env.VITE_APP_URL || 'https://examprepp.vercel.app'}/badge-metadata.json`;

    // Mint the Core asset with PermanentFreezeDelegate → soulbound
    // frozen: true    = non-transferable immediately on mint
    // authority: None = no one can ever unfreeze it (permanently soulbound)
    const { signature } = await create(umi, {
      asset,
      name:  metadata.name,
      uri:   metadataUri,
      owner,
      plugins: [
        {
          type:      'PermanentFreezeDelegate',
          frozen:    true,
          authority: { type: 'None' },
        },
      ],
    }).sendAndConfirm(umi);

    // Convert signature (Uint8Array) to base58 string
    const txSignature = bs58.encode(signature);

    console.log(`[ExamPrepp] Badge minted → ${studentWalletAddress} | tx: ${txSignature}`);

    return res.status(200).json({
      txSignature,
      assetAddress: asset.publicKey.toString(),
      message:      'Badge minted successfully.',
    });

  } catch (err) {
    console.error('[ExamPrepp] Mint failed:', err.message);

    // Return 500 but never leak internal error details to the client
    return res.status(500).json({
      message: 'Minting failed. Please try again later.',
    });
  }
}