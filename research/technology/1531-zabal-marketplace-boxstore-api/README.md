---
topic: technology, zabal, marketplace
type: api-spec
status: DO NOW — v1 is 3 routes + 2 Supabase tables, ~1 day build
last-validated: 2026-07-18
related-docs: 1528-zabal-s2-workshop-calendar, 1476-viniapp-sparkz-evaluation, 1269-zol-farcaster-music-scout, 1055-icm-boxes-advanced-usage
board-task: Build: ZABAL marketplace $1 box-store API
action-owner: Zaal (review spec) → Hurricane or ZABAL Games builder (implement)
---

# 1531 — ZABAL Marketplace: $1 Box-Store API Spec

> **Concept:** A lightweight peer-to-peer storefront inside ZAOOS where community members list and sell "boxes" — a fixed-price digital unit — paid for in ZABAL tokens on Base. No escrow contract needed for v1: the API verifies on-chain transfers. First seller: ZABAL Games participants listing their July build outputs. First buyer: anyone holding ZABAL.

---

## What Is a "Box"?

A box is a $1-equivalent digital unit. The name comes from ICM context boxes (useicm.com — ZAO's AI-discoverability infrastructure, doc 1055), where each box costs $1 to mint. The marketplace generalizes this:

| Box type | What it contains | Who sells it | Example |
|----------|-----------------|-------------|---------|
| **Context box** | An ICM box URL + description — buyer gets the AI context box | Creator | "My WaveWarZ artist context box — AI agents will know my music" |
| **Work output** | A ZABAL Games build artifact (repo, design, doc) | ZABAL Games builder | "My ZAOOS PR write-up for the Builder track" |
| **Community service** | A ZAO member service from doc 1522 | Community member | "30-min Fractal onboarding call" |
| **Knowledge** | A research doc, how-to guide, or template | Anyone | "My ZAO governance voting guide" |

Price convention: **1 box = 100 ZABAL** (v1 hardcoded; ZOR holders can vote to adjust; v2 adds oracle).

The 100 ZABAL = "$1" anchor is a starting point, not a binding peg. If ZABAL trades at $0.01/token, 100 ZABAL ≈ $1. The governance-adjustable rate lets the community keep the anchor meaningful over time without requiring a price oracle in v1.

---

## ZABAL Token Facts

| Field | Value |
|-------|-------|
| Contract (Base) | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| Empire address | `0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` |
| Standard | ERC-20 (launched via Clanker on Base) |
| Decimals | 18 |
| Staking contract | Live (`getConviction`, `totalStaked` — see `src/lib/staking/conviction.ts`) |

ZAOOS already uses viem for Base reads (`src/lib/staking/conviction.ts`). The marketplace verifies payments using the same pattern.

---

## Payment Flow (tx-hash verification, no custody)

Keeps v1 simple: no escrow contract, no approval flow, no custodial risk.

```
1. Buyer sees a box listing → gets seller wallet + ZABAL price
2. Buyer sends ZABAL from their wallet to the seller's wallet directly
3. Buyer submits the tx hash to POST /api/zabal/marketplace/boxes/[id]/purchase
4. API verifies on-chain:
   - tx exists on Base
   - tx.to == seller wallet
   - ZABAL transfer amount >= box.price_zabal
   - tx.blockNumber confirmed (≥1 confirmation)
5. If valid: box status → "sold", buyer address stored, seller notified (Telegram + Farcaster)
6. If invalid: API returns 402 with reason
```

**Why no escrow contract for v1:**
- Eliminates a smart contract audit requirement
- Buyer transfers directly to seller — no ZAO custody
- On-chain verification is as trustworthy as a contract in this trust model (seller doesn't ship until verified; buyer can verify tx before claiming)
- V2 can add an escrow contract when volume justifies the audit cost

---

## API Surface (3 Routes)

All routes live in `src/app/api/zabal/marketplace/`.

### GET /api/zabal/marketplace/boxes

List available boxes.

**Query params:**
- `type` (optional): filter by `context_box | work_output | service | knowledge`
- `seller` (optional): filter by seller wallet address
- `limit` (default 20, max 100)
- `status` (default `available`): `available | sold | all`

**Response:**
```json
{
  "boxes": [
    {
      "id": "box_abc123",
      "title": "My WaveWarZ artist context box",
      "description": "ICM box at useicm.com/... — lets AI agents know my music history and WaveWarZ performance",
      "type": "context_box",
      "seller_wallet": "0x...",
      "price_zabal": 100,
      "status": "available",
      "delivery_type": "url",
      "delivery_preview": "useicm.com/...",
      "created_at": "2026-07-18T00:00:00Z"
    }
  ],
  "total": 12
}
```

### POST /api/zabal/marketplace/boxes

Create a new box listing. Requires SIWE auth (wallet-signed session).

**Body:**
```json
{
  "title": "My WaveWarZ artist context box",
  "description": "...",
  "type": "context_box",
  "price_zabal": 100,
  "delivery_type": "url | text | file_url",
  "delivery_content": "https://useicm.com/...",
  "seller_wallet": "0x..."
}
```

**Response:** `201 { "id": "box_abc123", "status": "available" }`

**Validation:**
- `price_zabal` minimum: 1 (enforced; seller cannot list for free — use a bounty system for that)
- `delivery_content` must be non-empty (buyer needs to receive something)
- `seller_wallet` must match the authenticated SIWE session

### POST /api/zabal/marketplace/boxes/[id]/purchase

Submit a completed ZABAL transfer for verification and mark box sold.

**Body:**
```json
{
  "tx_hash": "0xabc...",
  "buyer_wallet": "0x..."
}
```

**Response:** `200 { "status": "sold", "delivery": { "type": "url", "content": "https://..." } }`

**On-chain verification (using viem):**
```typescript
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { parseAbiItem } from 'viem';

const client = createPublicClient({ chain: base, transport: http() });

// Verify a ZABAL transfer in a given tx
async function verifyZabalTransfer(
  txHash: `0x${string}`,
  expectedTo: string,
  minAmount: bigint
): Promise<{ ok: boolean; reason?: string }> {
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (!receipt || receipt.status !== 'success') return { ok: false, reason: 'tx failed or pending' };
  
  // Parse Transfer(address from, address to, uint256 value) logs
  const transferLogs = receipt.logs.filter(
    log => log.address.toLowerCase() === ZABAL_TOKEN_ADDRESS.toLowerCase()
  );
  
  for (const log of transferLogs) {
    const [, to, value] = log.topics; // Transfer(from, to, value)
    const toAddr = '0x' + to.slice(26);
    const transferAmount = BigInt(log.data);
    
    if (toAddr.toLowerCase() === expectedTo.toLowerCase() && transferAmount >= minAmount) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'no matching ZABAL transfer found in tx' };
}
```

---

## Supabase Schema

Two new tables in the public schema:

```sql
-- Listings
CREATE TABLE zabal_boxes (
  id              TEXT PRIMARY KEY DEFAULT 'box_' || substr(gen_random_uuid()::text, 1, 8),
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL CHECK (type IN ('context_box','work_output','service','knowledge')),
  seller_wallet   TEXT NOT NULL,
  price_zabal     INTEGER NOT NULL DEFAULT 100 CHECK (price_zabal >= 1),
  status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold','removed')),
  delivery_type   TEXT NOT NULL CHECK (delivery_type IN ('url','text','file_url')),
  delivery_content TEXT NOT NULL,  -- only revealed to buyer after purchase verified
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at         TIMESTAMPTZ,
  buyer_wallet    TEXT,
  purchase_tx     TEXT            -- on-chain tx hash of the verified ZABAL transfer
);

-- Activity log (one row per purchase attempt — useful for disputes)
CREATE TABLE zabal_box_purchases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id      TEXT NOT NULL REFERENCES zabal_boxes(id),
  tx_hash     TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','failed')),
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: boxes are public read; write requires authenticated session matching seller_wallet
ALTER TABLE zabal_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY boxes_public_read ON zabal_boxes FOR SELECT USING (status != 'removed');
CREATE POLICY boxes_seller_insert ON zabal_boxes FOR INSERT WITH CHECK (seller_wallet = current_user);
```

---

## Env Vars

Add to `ZAOOS/.env.example`:
```
ZABAL_TOKEN_ADDRESS=0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07
ZABAL_MARKETPLACE_PRICE_ZABAL=100      # ZABAL per box (governance-adjustable)
ZABAL_MARKETPLACE_MIN_CONFIRMATIONS=1  # blocks before verifying tx
```

---

## ZABAL Games Integration

The board task arrives at the same time as ZABAL S2 (Sep–Nov, doc 1528) and ZABAL Games (July open build month). This isn't coincidental: the box-store is where July build outputs go to market.

**Flow for ZABAL Games builders:**
1. Builder completes a July build output (PR to ZAOOS, a script, a research doc)
2. Builder creates a box listing: type `work_output`, delivery = GitHub link + summary
3. Other ZAO members discover it in the marketplace
4. A buyer sends 100 ZABAL → builder earns; buyer gets the work output + attribution credit
5. Box purchase = on-chain evidence of community value (feeds ZABAL Games score)

**Score multiplier suggestion (for ZABAL Games coordinators):** A box sale counts as a "community validation" event in the leaderboard. One confirmed purchase = +1 community validation point.

---

## ZOE Integration

After a box is sold, ZOE posts a compact notification:

**Telegram (Zaal DM):**
> Box sold: "[title]" by 0x1234... → 0x5678... (100 ZABAL). Tx: 0xabc... [basescan.org/tx/0xabc]

**Farcaster (optional, human-approved):**
> .box sold on the ZABAL marketplace — 100 ZABAL. by @[seller-fid] → @[buyer-fid]
> [link to box store]

ZOE checks the `zabal_boxes` table via Supabase subscription or polling (every 15 min).

---

## V1 Scope (Build Now)

| Item | Estimate |
|------|----------|
| 2 Supabase tables + RLS | 30 min |
| GET /boxes route | 30 min |
| POST /boxes route (SIWE auth) | 45 min |
| POST /boxes/[id]/purchase route + viem verification | 60 min |
| Basic frontend list page (read-only) | 45 min |
| ZOE purchase notification | 30 min |
| **Total** | **~4 hours** |

---

## V2 Scope (After v1 Ships)

- Oracle pricing: query ZABAL/USDC pool on Uniswap v4 (Base) for live exchange rate → $1 = dynamic ZABAL amount
- Escrow contract: atomic swap so buyer can't pay and seller can't deliver without both sides completing
- Search + filters: full-text search on title/description
- Reputation: seller rating from past buyers (stored in Supabase)
- ZABAL Games leaderboard hook: auto-submit a "community validation" event when a box sells

---

## Immediate Next Actions

| Task | Owner | Time |
|------|-------|------|
| Review this spec (price anchor + payment flow) | Zaal | 10 min |
| Create 2 Supabase tables in production | Zaal or Hurricane | 30 min |
| Implement 3 routes + basic frontend | Hurricane or ZABAL Games builder | ~4 hrs |
| Add ZABAL_MARKETPLACE_PRICE_ZABAL to Vercel env | Zaal | 2 min |
| Announce in /zao + ZABAL Games channels when live | ZOE draft → Zaal approve | 10 min |

---

## Related Docs

- [Doc 1528 — ZABAL S2 workshop calendar](../../zabal/1528-zabal-s2-workshop-calendar/) — first cohort (Sep–Nov) are natural first sellers
- [Doc 1522 — ZAO member services directory](../../community/1522-zao-member-services-directory/) — community services are natural box listings
- [Doc 1055 — ICM boxes advanced usage](../../identity/1055-icm-boxes-advanced-usage-citation-measurement/) — context box use case
- [Doc 1476 — Viniapp × Sparkz evaluation](../../business/1476-viniapp-sparkz-sparkz-evaluation/) — Sparkz collectables (adjacent product)

## Sources

- ZAOOS codebase: `src/lib/empire-builder/config.ts` (ZABAL_TOKEN_ADDRESS confirmed)
- ZAOOS codebase: `src/lib/staking/conviction.ts` (viem Base client pattern)
- Research doc 621 — ZAO context canon (ZABAL = Base ERC-20, `0xbB48f19B0...`)
- Research doc 1055 — ICM boxes ($1 per box anchor)
- Research doc 1528 — ZABAL S2 calendar (Sep–Nov cohort = first sellers)
- Board task `bda4caf2` — "Build: ZABAL marketplace $1 box-store API"
