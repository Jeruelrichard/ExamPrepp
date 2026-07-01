/**
 * ExamPrepp — pre-mint demo script (devnet).
 *
 * Mints ONE sample soulbound badge to the mint-authority's own wallet (custody)
 * and prints the Solana Explorer devnet links. Run this once before a demo so you
 * have a known-good cached result to show if a live mint hangs on stage.
 *
 * Prereq: fund the mint-authority wallet with a little devnet SOL (e.g.
 *   `solana airdrop 1 <PUBKEY> --url devnet`). This script does NOT airdrop.
 *
 * Run (Node 20+):
 *   node --env-file=.env scripts/mint-sample-badge.mjs
 */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { create, mplCore } from '@metaplex-foundation/mpl-core';
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import bs58 from 'bs58';

const rpc = process.env.SOLANA_RPC_URL;
const secret = process.env.MINT_AUTHORITY_SECRET_KEY;
const appUrl = process.env.VITE_APP_URL || 'https://examprepp-app.vercel.app';

if (!rpc || !secret) {
  console.error('Missing env. Set SOLANA_RPC_URL and MINT_AUTHORITY_SECRET_KEY (e.g. run with `node --env-file=.env`).');
  process.exit(1);
}

const umi = createUmi(rpc).use(mplCore());
umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(bs58.decode(secret))));

console.log('Mint authority (custody owner):', umi.identity.publicKey.toString());
console.log('Minting sample soulbound badge on devnet…');

const asset = generateSigner(umi);
const { signature } = await create(umi, {
  asset,
  name: 'ExamPrepp — Sample Badge',
  uri: `${appUrl}/badge-metadata.json`,
  plugins: [{ type: 'PermanentFreezeDelegate', frozen: true, authority: { type: 'None' } }],
}).sendAndConfirm(umi);

const tx = bs58.encode(signature);
console.log('\n✅ Minted.');
console.log('Asset address :', asset.publicKey.toString());
console.log('Tx signature  :', tx);
console.log('Explorer (tx) :', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
console.log('Explorer (nft):', `https://explorer.solana.com/address/${asset.publicKey.toString()}?cluster=devnet`);
