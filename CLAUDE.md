# ExamPrepp — Hackathon MVP

## What this is
AI-powered exam prep web app for Nigerian university students.
Students upload past questions and lecture notes. The AI predicts high-probability
exam topics then generates a grounded study guide from the student's own materials.

## Stack
- **TypeScript** — all files are .ts / .tsx, no plain JS
- **React + Vite** — frontend
- **React Router v6** — client-side routing
- **Supabase** — auth + database + file storage
- **Vercel Functions** — serverless backend (API routes, proxying Gemini calls, signing Solana transactions)
- **Gemini 2.5 Flash (free tier)** — AI engine
- **Solana** — blockchain layer for soulbound credential badges
  - Metaplex Core + Umi — minting non-transferable badge assets
  - @solana/wallet-adapter-react — wallet connection in the browser
  - Helius — free RPC provider (devnet + mainnet)
  - Solana Devnet — testnet environment (replaces Polygon Amoy entirely)
- **thirdweb: DO NOT USE on Solana** — discontinued October 2023, unmaintained
- Shared GitHub repo, team of 4

---

## Core user flow — TWO PHASES (critical, never collapse into one)

### Phase 1 — Past questions analysis
1. User uploads past question PDFs/images
   - No hard file limit
   - Recommended: 3–5 years of past papers
   - Minimum for reliable results: 3 files
   - If fewer than 3 files → service layer returns a quality warning (do not block the user)
2. Gemini analyzes question patterns across all uploaded files
3. Returns ranked list of high-probability topics with confidence scores
4. UI displays predictions — user reviews before proceeding

### Phase 2 — Study guide generation
5. App prompts user to upload their lecture notes and course materials
   - This is a SECOND upload event, separate from Phase 1
   - No file limit
6. User uploads notes/materials (PDFs, images)
7. Gemini receives BOTH the past question files AND the lecture note files
   — past questions = context for what is likely to be tested
   — lecture notes = source of truth for all factual content
8. Gemini generates a comprehensive markdown study guide grounded in the notes
   — EXCEPTION: if a predicted topic is absent from the lecture notes, that
     section is explicitly flagged AND filled from Gemini's general knowledge
     (clearly labeled as "based on my internal training data") so the guide
     has no dead sections — see prompts.js PROMPT_GENERATE_STUDY_GUIDE rule 6
9. UI displays study guide with options:
   - Download as PDF/doc
   - Generate flashcards
   - Generate quiz
   - Share

### Post-study (blockchain layer)
10. On quiz completion → mint soulbound Metaplex Core asset on Solana Devnet (mainnet later)
    — non-transferable via PermanentFreezeDelegate plugin (frozen: true, authority: None)
    — metadata: course name, topics covered, timestamp, issued by ExamPrepp
    — backend wallet (Vercel Function) pays all fees and mints directly to the student's wallet
    — student never signs or pays; they only need to provide a Phantom wallet address
    — this is an ADDITIVE feature; it must NEVER block or delay the core AI flow
    — if minting fails, log the error silently and let the user continue

---

## File upload advisory (enforce in service layer, not UI)
- < 3 past question files → return warning: "Fewer than 3 years of past questions uploaded. Predictions may be less accurate. Upload at least 3 years for best results."
- 3–5 past question files → optimal, no warning
- > 5 files → accepted without warning (more data is fine)
- Lecture notes → no threshold, no warning

---

## Build order (strict — do not skip layers)
1. `/src/services/prompts.ts` — all prompt strings as named constants
2. `/src/services/gemini.ts` — Gemini 2.5 Flash client (four functions)
3. `/src/services/solana.ts` — Metaplex Core + Umi + wallet-adapter mint function
4. `/src/hooks/useExamPrepp.ts` — phase state machine wiring the two phases
5. `/src/hooks/useFlashcards.ts` — flashcard generation hook
6. `/src/hooks/useQuiz.ts` — quiz generation hook
7. `/src/components/` — naked shell components (.tsx, semantic classNames, zero CSS)
8. Jennifer's CSS/design system slots in last — do not add styling until Layer 7

---

## Critical constraints
- All files are TypeScript (.ts / .tsx) — no plain .js files
- Never put business logic inside component files
- All Gemini prompts live in prompts.ts only — never inline a prompt in gemini.ts or a component
- All service functions return `{ data, error, warning }` — never throw to the UI layer
- All components accept a `className` prop for the design system to slot in
- Past question files and lecture note files are ALWAYS kept as separate arrays in state
- Phase 2 always sends BOTH arrays to Gemini — do not drop the past question context
- Solana minting ALWAYS goes through a Vercel Function — never from the frontend directly
- `MINTING_WALLET_PRIVATE_KEY` must NEVER appear in any VITE_ prefixed variable
- Blockchain failures must NEVER surface as blocking errors in the UI — catch and log only

---

## Gemini API details
- Model: `gemini-2.5-flash`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Auth: `?key=${import.meta.env.VITE_GEMINI_API_KEY}` (query param, not header)
- Files: send as `inlineData` base64 parts (supports PDF and images)
- Structured outputs (flashcards, quiz): use `responseMimeType: "application/json"` in generationConfig
- Phase 1 (predictions): NOT JSON mode — returns mixed prose + a `===JSON===`/`===END===` delimited JSON block + a follow-up prompt; parsed by `extractMixedResponse()` then `safeParseJSON()`
- Study guide: plain text response (markdown), no JSON mode
- Temperature: 0.2 for analysis/structured outputs, 0.5 for study guide prose
- Always wrap every Gemini call in try/catch — network failures and rate limits are common

---

## Output shapes (enforce strictly — these are the contracts between layers)

### Phase 1 — analyzePastQuestions() returns:
Phase 1 is NOT pure JSON mode. The model returns a mixed response: a human-readable
summary, then a JSON block (between `===JSON===` / `===END===` markers), then a
follow-up "now upload your lecture notes" prompt. `extractMixedResponse()` splits
the three pieces; the JSON block is parsed with `safeParseJSON()`.
```
{
  data: {
    course: string,
    predictions: [
      {
        topic: string,
        probability: number,   // integer 50–95
        reasoning: string      // one sentence citing evidence from the papers
      }
    ],
    summary: string,           // human-readable analysis prose (Part 1, shown above predictions)
    followUp: string           // "now upload your lecture notes" prompt (shown after predictions)
  },
  error: string | null,
  warning: string | null       // quality warning if < 3 files
}
```

### Phase 2 — generateStudyGuide() returns:
```
{
  data: {
    guide: string,             // full markdown document
    topicsCovered: string[]    // array of topic names covered in the guide
  },
  error: string | null,
  warning: string | null
}
```

### On-demand — generateFlashcards() returns:
```
{
  data: {
    flashcards: [{ front: string, back: string }]
  },
  error: string | null,
  warning: null
}
```

### On-demand — generateQuiz() returns:
```
{
  data: {
    quiz: [
      {
        question: string,
        options: string[],    // always exactly 4 options
        answerIndex: number,  // 0–3
        explanation: string   // why right is right AND why the main wrong answer is wrong
      }
    ]
  },
  error: string | null,
  warning: null
}
```

---

## Environment variables (.env)
```
# AI
VITE_GEMINI_API_KEY=

# Solana / Metaplex
VITE_HELIUS_RPC_URL=          # e.g. https://devnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_SOLANA_NETWORK=          # "devnet" | "mainnet-beta"

# Minting wallet — NEVER expose in frontend; use only in Vercel Functions
MINTING_WALLET_PRIVATE_KEY=   # base58 keypair that pays mint fees and signs transactions

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # server-side only (Vercel Functions)
```

---

## Solana / blockchain service details

### Stack
```
@solana/wallet-adapter-react          // ConnectionProvider, WalletProvider, useWallet()
@solana/wallet-adapter-react-ui       // WalletMultiButton + modal
@solana/web3.js                       // Connection primitive
@metaplex-foundation/umi-bundle-defaults
@metaplex-foundation/mpl-core        // createAsset(), PermanentFreezeDelegate plugin
@metaplex-foundation/umi-signer-wallet-adapters  // walletAdapterIdentity()
```

### How minting works
- Minting is done server-side in a **Vercel Function** (`/api/mint-badge.ts`)
- The Vercel Function holds `MINTING_WALLET_PRIVATE_KEY` — the backend wallet that pays
- The frontend calls the Vercel Function with `{ studentWalletAddress, course, topicsCovered }`
- The function mints the Core asset directly to `studentWalletAddress` — student never signs
- This means students with empty wallets can still receive badges — they only need a Phantom address

### Soulbound enforcement
Use **PermanentFreezeDelegate** plugin at creation time:
```ts
plugins: [
  {
    type: 'PermanentFreezeDelegate',
    frozen: true,
    authority: { type: 'None' },  // no one can unfreeze — permanently soulbound
  }
]
```
This makes the asset non-transferable AND non-burnable. It cannot be moved from the student's wallet by anyone.

### Minting cost (real numbers)
- Devnet: free (use the Helius devnet faucet or `solana airdrop 2` via CLI)
- Mainnet: ~0.0044 SOL per badge (~$0.70 at $160/SOL)
  - 0.0015 SOL — Metaplex Core protocol fee (charged per mint)
  - ~0.0029 SOL — account rent for the asset
  - ~0.000005 SOL — base transaction fee
- Budget: fund the minting wallet with ~0.05 SOL to cover ~10 mainnet demo mints

### RPC — Helius
- Public Solana RPC is heavily rate-limited; never use it in production or demos
- Sign up at helius.dev for a free key (1M credits/month, 10 req/s, no credit card required)
- Use the Helius devnet endpoint for development, mainnet endpoint for production
- Format: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`

### Wallet — expect Phantom
- ~92.5% of Nigerian Solana users use Phantom (per Dune 2025 data)
- WalletMultiButton + Wallet Standard auto-detects Phantom, Backpack, Solflare
- For MVP: a student can paste their wallet address without connecting; connection only needed to view badges in-app

### Devnet gotchas
- Devnet can reset without notice — badges minted on devnet are not permanent
- Never reuse devnet keypairs on mainnet; load from separate env vars
- When switching to mainnet, add a priority fee + compute-unit limit instruction to transactions

### DO NOT
- Do not put `MINTING_WALLET_PRIVATE_KEY` in any VITE_ variable — it would be exposed in the browser bundle
- Do not use thirdweb for Solana — support was discontinued October 9, 2023
- Do not use Polygon Amoy — we are on Solana only
- Do not mint from the frontend — always go through the Vercel Function

---


- Primary: #4F46E5 (Deep Indigo)
- Text: #111827
- Background: #FFFFFF / #F9FAFB
- Verified/success: #10B981
- No amber anywhere
- Logo: Radiant Book mark (static + animated SVGs in /src/assets/)
- Wordmark font: Dancing Script 700 (Google Fonts)
- Body font: Inter, Display font: Space Grotesk

---

## Prompt engineering notes (read before touching prompts.js)
The prediction prompt is the highest-risk component. It is intentionally NOT JSON mode:
it returns a human summary, then a JSON block between `===JSON===` / `===END===`
markers, then a follow-up upload prompt. The markers (not markdown fences — they
break JS template literals) are what make the embedded JSON reliably extractable.
- Flashcards/quiz use `responseMimeType: "application/json"`; Phase 1 does NOT
- Always include an explicit JSON shape example in the prompt
- Phase 1: keep the `===JSON===` / `===END===` markers around the JSON block so `extractMixedResponse()` can split it
- Always parse with safeParseJSON() which strips markdown fences before JSON.parse()
- If JSON.parse fails, return an error — do not try to salvage malformed output
- The grounding instruction ("use only the uploaded documents") is non-negotiable
  and must appear in every prompt that touches student materials
- Phase 2 EXCEPTION (intentional, decided 2026-06-15): for predicted topics absent
  from the lecture notes, the study guide flags this AND fills that section from
  Gemini's general knowledge, clearly labeled "based on my internal training data".
  This trades strict grounding for no dead sections in the guide — do not silently
  revert this to flag-only without re-confirming with the team
