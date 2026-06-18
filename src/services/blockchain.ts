/**
 * ExamPrepp — Solana service (frontend)
 *
 * This file handles the CLIENT SIDE of the blockchain layer:
 *   - Solana connection config (Helius RPC)
 *   - Wallet adapter setup for WalletProvider in the app root
 *   - mintCredential() — calls the Vercel Function; never touches the private key
 *   - getStudentBadges() — reads the student's earned badges via Helius DAS API
 *
 * The ACTUAL MINTING lives in /api/mint-badge.js (Vercel Function).
 * The private key (MINTING_WALLET_PRIVATE_KEY) lives there and ONLY there.
 *
 * ─── npm packages required ────────────────────────────────────────────────
 * npm install @solana/web3.js \
 *             @solana/wallet-adapter-react \
 *             @solana/wallet-adapter-react-ui \
 *             @solana/wallet-adapter-wallets
 * ──────────────────────────────────────────────────────────────────────────
 *
 * ─── App root wiring (main.tsx or App.tsx) ────────────────────────────────
 * import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
 * import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
 * import { HELIUS_RPC_URL, SUPPORTED_WALLETS } from './services/blockchain';
 * import '@solana/wallet-adapter-react-ui/styles.css';
 *
 * <ConnectionProvider endpoint={HELIUS_RPC_URL}>
 *   <WalletProvider wallets={SUPPORTED_WALLETS} autoConnect>
 *     <WalletModalProvider>
 *       <App />
 *     </WalletModalProvider>
 *   </WalletProvider>
 * </ConnectionProvider>
 * ──────────────────────────────────────────────────────────────────────────
 *
 * ─── Component usage ─────────────────────────────────────────────────────
 * import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
 * import { useWallet } from '@solana/wallet-adapter-react';
 *
 * const { publicKey, connected } = useWallet();
 * // Pass publicKey.toBase58() to mintCredential() as studentWalletAddress
 * ──────────────────────────────────────────────────────────────────────────
 */

import { Connection } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from '@solana/wallet-adapter-wallets';


// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

/**
 * Helius RPC endpoint.
 * Set VITE_HELIUS_RPC_URL in .env:
 *   devnet:  https://devnet.helius-rpc.com/?api-key=YOUR_KEY
 *   mainnet: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
 *
 * Never use the public Solana RPC in production or demos — it is
 * heavily rate-limited and will fail under any real load.
 */
export const HELIUS_RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL;

export const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';

/**
 * Supported wallets — Phantom first because ~92.5% of Nigerian
 * Solana users use Phantom (Dune 2025 data).
 * Wallet Standard auto-detects any installed wallet on top of this list.
 */
export const SUPPORTED_WALLETS = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
];

/**
 * Get a Solana Connection instance for direct RPC use (e.g. confirming tx).
 * For most UI work, use the useConnection() hook from wallet-adapter instead.
 */
export function getConnection() {
  if (!HELIUS_RPC_URL) {
    throw new Error('VITE_HELIUS_RPC_URL is not set in environment variables.');
  }
  return new Connection(HELIUS_RPC_URL, 'confirmed');
}


// ─────────────────────────────────────────────
// Badge metadata builder
// ─────────────────────────────────────────────

/**
 * Build the metadata JSON for a soulbound badge.
 *
 * For the hackathon, host this as a static file in /public/badge-metadata.json
 * and point the `uri` to `https://yourdomain.com/badge-metadata.json`.
 *
 * Post-hackathon: upload per-badge JSON to Irys/Arweave via Umi's uploadJson()
 * for true permanence. For a devnet demo, a static URL is fine.
 */
export function buildBadgeMetadata({ course, topicsCovered, completedAt }) {
  return {
    name: `ExamPrepp — ${course}`,
    description:
      `Soulbound study credential issued by ExamPrepp. ` +
      `This badge certifies completion of an AI-guided exam prep session for ${course}. ` +
      `Non-transferable — permanently tied to this wallet.`,
    image: `${import.meta.env.VITE_APP_URL || 'https://examprepp.vercel.app'}/badge.png`,
    external_url: `${import.meta.env.VITE_APP_URL || 'https://examprepp.vercel.app'}`,
    attributes: [
      { trait_type: 'Course',          value: course },
      { trait_type: 'Topics Covered',  value: topicsCovered.join(', ') },
      { trait_type: 'Completed At',    value: completedAt },
      { trait_type: 'Issued By',       value: 'ExamPrepp' },
      { trait_type: 'Network',         value: SOLANA_NETWORK === 'mainnet-beta' ? 'Solana Mainnet' : 'Solana Devnet' },
      { trait_type: 'Standard',        value: 'Metaplex Core' },
    ],
  };
}


// ─────────────────────────────────────────────
// mintCredential — calls the Vercel Function
// ─────────────────────────────────────────────

/**
 * Mint a soulbound Metaplex Core badge for a student who completed a quiz.
 *
 * This function calls /api/mint-badge (a Vercel serverless function).
 * The Vercel Function holds the private key and does the actual on-chain work.
 * The student never signs or pays — the backend wallet covers everything.
 *
 * IMPORTANT: This is an ADDITIVE feature. The caller must handle errors
 * silently — a mint failure must never block the student from downloading
 * their study guide or viewing their results.
 *
 * @param {object}   params
 * @param {string}   params.studentWalletAddress  - Student's base58 public key
 * @param {string}   params.course                - From analyzePastQuestions()
 * @param {string[]} params.topicsCovered         - From generateStudyGuide()
 *
 * @returns {{ data: { txSignature: string, explorerUrl: string } | null, error: string | null }}
 */
export async function mintCredential({ studentWalletAddress, course, topicsCovered }) {
  try {
    if (!studentWalletAddress) {
      throw new Error('No wallet address provided. Student must connect a wallet to receive a badge.');
    }

    const metadata = buildBadgeMetadata({
      course,
      topicsCovered,
      completedAt: new Date().toISOString(),
    });

    const response = await fetch('/api/mint-badge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentWalletAddress,
        metadata,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Mint API returned status ${response.status}`);
    }

    const data = await response.json();

    console.log('[ExamPrepp] Badge minted.', data.txSignature);

    return {
      data: {
        txSignature: data.txSignature,
        explorerUrl: buildExplorerUrl(data.txSignature),
      },
      error: null,
    };
  } catch (err) {
    // Log but do not rethrow — this feature must never crash the core flow
    console.error('[ExamPrepp] mintCredential failed (non-blocking):', err.message);
    return { data: null, error: err.message };
  }
}


// ─────────────────────────────────────────────
// getStudentBadges — reads via Helius DAS API
// ─────────────────────────────────────────────

/**
 * Fetch all ExamPrepp soulbound badges owned by a student wallet.
 * Uses the Helius Digital Asset Standard (DAS) API — getAssetsByOwner.
 *
 * Filters by badge name prefix "ExamPrepp" for the hackathon.
 * Post-hackathon: filter by a dedicated ExamPrepp collection address instead
 * (more reliable and doesn't conflict with other projects using the same prefix).
 *
 * @param {string} walletAddress - Base58 public key of the student
 * @returns {{ data: { badges: object[] } | null, error: string | null }}
 */
export async function getStudentBadges(walletAddress) {
  try {
    if (!walletAddress) {
      throw new Error('No wallet address provided.');
    }

    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'examprepp-get-badges',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius DAS API error: ${response.status}`);
    }

    const { result } = await response.json();
    const allAssets = result?.items || [];

    // Filter for ExamPrepp badges by name prefix
    // TODO (post-hackathon): filter by collection address for reliability
    const badges = allAssets.filter(
      (asset) =>
        asset?.content?.metadata?.name?.startsWith('ExamPrepp') &&
        asset?.ownership?.owner === walletAddress,
    );

    return { data: { badges }, error: null };
  } catch (err) {
    console.error('[ExamPrepp] getStudentBadges failed:', err.message);
    return { data: null, error: err.message };
  }
}


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Build a Solana explorer URL for a transaction signature.
 * Uses Solana Explorer — devnet and mainnet both supported.
 */
function buildExplorerUrl(txSignature) {
  const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${txSignature}${cluster}`;
}