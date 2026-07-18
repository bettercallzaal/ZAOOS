---
topic: technology, wavewarz
type: setup-guide
status: DO NOW — 15 min setup, 30 min implementation
last-validated: 2026-07-18
related-docs: 101-wavewarz-zao-whitepaper, 1323-wavewarz-base-chain-expansion-jul2026, 1344-zao-ai-native-dao-narrative-jul2026
board-task: wwtracker — get a free Helius API key + build the on-chain tracker
action-owner: Zaal (API key signup at helius.dev) → then implementation in ZAOOS
---

# 1520 — wwtracker: Helius Setup Guide (Upgrade Scraper → On-Chain)

> **Status:** Helius API key not yet provisioned. Current state: ZAOOS scrapes `wavewarz-intelligence.vercel.app` for artist stats. This doc provides the exact steps to add Helius and upgrade to direct on-chain tracking.

---

## Current State vs. Target State

| | Current (Scraper) | Target (Helius) |
|--|------------------|-----------------|
| Data source | `wavewarz-intelligence.vercel.app` (3rd-party HTML scrape) | Solana blockchain via Helius RPC |
| Reliability | Fragile (HTML structure changes → scraper breaks) | Stable (on-chain data doesn't change format) |
| Latency | Depends on Intelligence site uptime | Sub-100ms (Helius RPC is fast) |
| Cost | Free (scraping) | Free (Helius free tier: 1M credits/month) |
| Data richness | Name + wins/losses from Intelligence dashboard | Full transaction history, battle vault balances, SOL flows |
| Program ID needed | No | Yes (one-time lookup) |

The current scraper in `src/lib/wavewarz/scraper.ts` calls `INTELLIGENCE_BASE = 'https://wavewarz-intelligence.vercel.app'`. Helius replaces this with `@solana/web3.js` + `Connection` pointed at Helius RPC.

---

## Step 1: Get the Helius API Key (5 min, GATED — Zaal does this)

1. Go to `helius.dev`
2. Sign up for free account
3. Create a project → copy the API key
4. Add to ZAOOS `.env.local`:
   ```
   HELIUS_API_KEY=your-key-here
   ```
5. Add to Vercel environment variables (for production cron sync)

**Free tier limits:** 1M credits/month, 10 req/sec. Each `getProgramAccounts` call costs ~1 credit. At 43 artists + nightly sync, you'll use ~50 credits/day = ~1,500/month. Well within free tier.

---

## Step 2: Find the WaveWarZ Solana Program ID (10 min, one-time)

The program ID is not yet in `src/lib/wavewarz/constants.ts`. Find it by inspecting a known transaction:

```bash
# Pick any wallet from WAVEWARZ_WALLETS — example: Hurric4n3Ike (LUI's opponent)
WALLET=62g5hYiSTqj185F26c3pT6EPx4Gs1P6gL72kGNzvkbjM

# Option 1: Solscan (browser)
# Go to: https://solscan.io/account/$WALLET
# Look at recent transactions → find one labeled "WaveWarZ" or with large SOL escrow
# Click the transaction → look for "Program" field in the instruction list
# The program address (not the wallet address) IS the WaveWarZ program ID

# Option 2: Helius Enhanced API (after you have the key)
curl "https://api.helius.xyz/v0/addresses/$WALLET/transactions?api-key=YOUR_KEY&limit=5&type=NFT_BID" \
  -H "Content-Type: application/json"
# Look for programId in the accountData array

# Option 3: @solana/web3.js (if you want to do it in code)
# connection.getSignaturesForAddress(new PublicKey(WALLET), { limit: 10 })
# connection.getParsedTransaction(sig.signature)
# → instructions[].programId is the WaveWarZ program
```

**Once found:** Add to `constants.ts`:
```typescript
export const WAVEWARZ_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
```

---

## Step 3: Create `src/lib/solana/wavewarz.ts` (30 min implementation)

The skeleton from doc 101 (WaveWarZ whitepaper) — ready to paste:

```typescript
// src/lib/solana/wavewarz.ts
// On-chain WaveWarZ data access via Helius RPC
// Replaces/supplements the HTML scraper (src/lib/wavewarz/scraper.ts)

import { Connection, PublicKey, type ParsedTransactionWithMeta } from '@solana/web3.js';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

// Lazily initialized — avoids connection at import time (Next.js edge safety)
let _connection: Connection | null = null;
function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(HELIUS_RPC, 'confirmed');
  }
  return _connection;
}

export const WAVEWARZ_PROGRAM_ID = new PublicKey(
  process.env.WAVEWARZ_PROGRAM_ID ?? 'REPLACE_AFTER_STEP_2'
);

/**
 * Get all Battle Vault PDAs for a given artist wallet.
 * Returns the raw SOL balances for each vault (= battle pool size).
 */
export async function getBattleVaults(artistWallet: string): Promise<
  Array<{ pubkey: string; lamports: number }>
> {
  const connection = getConnection();
  const accounts = await connection.getProgramAccounts(WAVEWARZ_PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 8, // After Anchor discriminator
          bytes: artistWallet, // Filter by artist wallet
        },
      },
    ],
  });
  return accounts.map(({ pubkey, account }) => ({
    pubkey: pubkey.toBase58(),
    lamports: account.lamports,
  }));
}

/**
 * Get recent battle transactions for an artist wallet.
 * Parses SOL inflows/outflows to reconstruct battle outcomes.
 */
export async function getRecentBattleTxns(
  artistWallet: string,
  limit = 20
): Promise<ParsedTransactionWithMeta[]> {
  const connection = getConnection();
  const pubkey = new PublicKey(artistWallet);
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit });
  const txns = await Promise.all(
    sigs.map(s => connection.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 }))
  );
  return txns.filter((t): t is ParsedTransactionWithMeta => t !== null);
}

/**
 * Estimate artist battle count from transaction history.
 * Cheaper than getProgramAccounts when program ID is unknown.
 */
export async function estimateBattleCount(artistWallet: string): Promise<number> {
  const connection = getConnection();
  const pubkey = new PublicKey(artistWallet);
  // Count signatures involving the WaveWarZ program
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });
  // Each battle = 2+ transactions (join + settle). Approximation:
  return Math.floor(sigs.length / 2);
}
```

---

## Step 4: Wire Helius into the Sync Route (20 min)

Update `src/app/api/wavewarz/sync/route.ts` to prefer on-chain data over scraper:

```typescript
// In the sync loop, after failing to scrape (or as primary source):
import { getRecentBattleTxns } from '@/lib/solana/wavewarz';

// Replace or fallback from:
// const stats = await scrapeArtistStats(wallet);

// With:
const txns = await getRecentBattleTxns(wallet, 50);
// Parse txns to extract wins/losses/volume
// (Full parsing logic depends on WaveWarZ program ABI — get after Step 2)
```

**Phased approach (recommended):**
1. **Phase 1** (now): Add Helius as a fallback when scraper returns null
2. **Phase 2** (after program ID): Full on-chain query for battle vaults
3. **Phase 3** (stretch): Helius webhooks for real-time battle settlement notifications

---

## Step 5: Update `.env.example` (2 min)

Add to `ZAOOS/.env.example`:
```
HELIUS_API_KEY=           # Helius free tier — 1M credits/mo, sign up at helius.dev
WAVEWARZ_PROGRAM_ID=      # WaveWarZ Solana program ID (find via Solscan — doc 1517 Step 2)
```

---

## Why This Matters for Public Release

The board task "WaveWarZ: finalize Solana bridge test before public release" is related. The current scraper has a known weakness: if `wavewarz-intelligence.vercel.app` is down or changes HTML structure, the sync cron fails silently. Before WaveWarZ goes public in ZAOOS (the doc 101 integration), the data source needs to be reliable.

Helius provides:
1. **Reliability** — on-chain data never goes down
2. **Future bridging** — when WaveWarZ deploys on Base (doc 1323 Model A), Helius can also index Base transactions via their EVM API
3. **Webhooks** — real-time battle settlement = ZOE can notify Zaal immediately when a battle settles

---

## Env Vars Checklist Before Public Release

| Env var | Where to set | Status |
|---------|-------------|--------|
| `HELIUS_API_KEY` | Vercel + `.env.local` | MISSING — get at helius.dev |
| `WAVEWARZ_PROGRAM_ID` | Vercel + `.env.local` | MISSING — find via Solscan after Step 2 |
| `CRON_SECRET` | Vercel | Check current Vercel env |
| `INTELLIGENCE_BASE` | Hardcoded in constants.ts | Live (wavewarz-intelligence.vercel.app) |

---

## Related Docs

- [Doc 101 — WaveWarZ × ZAO whitepaper](../../wavewarz/101-wavewarz-zao-whitepaper/) — original Helius code skeleton, wallet list methodology
- [Doc 1323 — WaveWarZ Base chain expansion](../../wavewarz/1323-wavewarz-base-chain-expansion-jul2026/) — bridge strategy; Helius covers Base too (EVM API)
- [Doc 1344 — ZAO AI-native DAO narrative](../../identity/1344-zao-ai-native-dao-narrative-jul2026/) — describes wwtracker as "on-chain battle parsing, stats dashboard"

## Sources

- ZAOOS codebase: `src/lib/wavewarz/constants.ts`, `src/app/api/wavewarz/sync/route.ts` (Jul 18, 2026 audit)
- Helius docs: `helius.dev` — free tier 1M credits/mo, `mainnet.helius-rpc.com` RPC endpoint
- Doc 101 — Helius RPC code snippet (Jul 2026)
