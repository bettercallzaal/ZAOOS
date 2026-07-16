---
topic: business
type: design
status: research-complete
last-validated: 2026-07-16
related-docs: 1096, 1097, 1098, 222, 628
original-query: "design a multi-musician revenue-split mechanism for Sparkz music collaborations using 0xSplits protocol, covering split config, revenue routing, open decisions, and minimal first-collab path"
tier: STANDARD
---

# 1140 - Sparkz Music Collaborations: Multi-Musician Revenue Splits via 0xSplits

> **Goal:** Design a trustless, multi-musician revenue-split mechanism for Sparkz music collaborations using 0xSplits protocol on Base/EVM. Spec the split contract configuration, revenue routing, and first-collab workflow without deploying on-chain or gating actions to specific users.

> **What this solves:** When 2+ musicians collaborate on a track/release inside Sparkz, revenue must split fairly and transparently—without any single artist custodying others' funds. 0xSplits provides the immutable contract primitive; this doc specifies how to map Sparkz collaboration data to split recipients, how each revenue stream routes, and what decisions Zaal must make.

---

## Executive Summary

### The Problem

Sparkz enables creators to launch tokens and crowdfund projects via on-chain revenue. Music collaborations are a natural next step—two musicians release a joint track, collect payments from Tortoise, tips, token-trading fees, and mints. But splitting revenue fairly creates custody risk: who holds the funds? If Artist A receives tips and owes Artist B 40%, Artist A might delay payment or disappear.

### The Solution: 0xSplits

[0xSplits](https://splits.org) is an immutable, non-custodial payment-splitting protocol on Base and other EVM chains. A Split contract:
- **Accepts funds** from any source (direct transfers, payment processors, smart contracts)
- **Stores recipient addresses + basis-point allocations** (immutable unless the split has a "controller")
- **Allows anyone to push funds through** (e.g., "distribute these USDC to the split recipients")
- **Recipients withdraw their own share** anytime via `withdraw()`

**Key property:** No middleman custody. No owner can rug the split. Transparent and composable.

### Sparkz Music Collab Architecture

1. **At collab creation:** Sparkz collects musician addresses + contribution weights (e.g., lead artist 50%, feature artist 30%, producer 20%). Creates a Split contract with these recipients and basis points (in 1M units per 0xSplits standard).
2. **Revenue streams route to the Split:**
   - On-chain (token trading fees, mints, tips in crypto) → split address directly
   - Off-chain (Tortoise streaming payouts, which are fiat) → Sparkz treasury first, then disbursed to split address in stablecoin
3. **Funds pool in the Split** until distributed.
4. **Musicians withdraw independently** — each recipient calls `withdraw()` to claim their share.

---

## Part 1: How 0xSplits Works (Accurate to Spec)

### Core Concepts

**Split Contract** (deployed on-chain, immutable by default):
- **Recipients**: array of Ethereum addresses
- **Allocations**: array of basis points (bps), summing to 1,000,000 = 100%
- **Controller** (optional): an address that can mutate the split (add/remove recipients, reweight allocations)
- **Payer**: anyone who sends funds to the split (direct transfer or via `payoutETH()` / `payoutERC20()` functions)

**Distribution Mechanics**:
1. Funds arrive in the split contract (WETH, ERC-20, or ETH via payable function)
2. Anyone can call `distributeETH()` or `distributeERC20(tokenAddress, tokenRecipients)` to push funds to a batch of recipient wallets
3. Each recipient's share is calculated: `(their_bps / 1_000_000) * total_funds`
4. Funds are transferred; each recipient sees their balance update instantly

**Immutable vs Mutable**:
- **Immutable (recommended for music collabs)**: Controller is set to `address(0)` or a timelock. No one can change recipients or weights after creation. Trust is math, not a middleman.
- **Mutable (for future adjustments)**: Controller is a multisig or Zaal's address. Allows tweaking the split if the collab dynamics change (e.g., a feature artist's contribution increases).

**No Custody Risk**: Funds in the split are split-owned, not artist-owned. Artist A can't redirect funds; Artist B doesn't have to trust Artist A.

### 0xSplits on Base

- **Deployment**: Live on Base since 2024
- **Contracts**: `SplitsMain` (registry + factory), `Split` (recipient contract)
- **Transaction cost**: ~$2-5 per split creation (gas on Base is cheap)
- **Documentation**: [splits.org docs](https://docs.0xsplits.xyz/) — API reference, contract ABI, SDK

---

## Part 2: Sparkz Music Collab Split Configuration

### Data Inputs: How Collaboration Energy Translates to Split Weights

When musicians set up a collab in Sparkz, the system collects:

1. **Collab metadata:**
   - Collab name (e.g., "Luna & Zaal - Midnight Anthem")
   - Description (release notes, creative intent)
   - Release date + type (single, EP, album, remix)

2. **Collaborator roster:**
   - Each collaborator: FID, Farcaster username, Ethereum wallet address, role (lead, feature, producer, mixer, etc.)
   - Each collaborator: Contribution weight (relative importance to the collab)

3. **Role-based contribution model (proposed default):**
   - **Lead artist / Primary creator**: 45-50% (drove the creative direction, owns the master)
   - **Feature artist / Guest vocalist**: 20-30% (wrote/performed a section)
   - **Producer / Beat creator**: 15-25% (produced/arranged the backing)
   - **Engineer / Mixer**: 5-10% (mixed/mastered the track)
   - **Bonus allocation** (optional): 0-5% reserved for tips/community (fan tips to collab pool)

   **Flexibility:** Collaborators can negotiate custom weights. E.g., two equal lead artists → 50% each. E.g., producer-led collab → producer 50%, feature 30%, lead 20%.

### Example: Sparkz Music Collab Split Config

**Collab:** "Midnight Anthem" (Luna & Zaal remix)

**Collaborators & Weights:**
```json
{
  "collab_name": "Midnight Anthem",
  "collab_type": "single",
  "sparkz_collab_id": "collab_midnight_2026",
  "description": "Indie pop remix feat. Luna vocals, Zaal production",
  "created_at": "2026-07-16T14:00:00Z",
  "split_recipients": [
    {
      "farcaster_fid": 12345,
      "farcaster_username": "luna",
      "wallet_address": "0x1234...abcd",
      "role": "lead_artist",
      "contribution_weight": 50,
      "basis_points": 500_000
    },
    {
      "farcaster_fid": 54321,
      "farcaster_username": "zaal",
      "wallet_address": "0x5678...efgh",
      "role": "producer",
      "contribution_weight": 40,
      "basis_points": 400_000
    },
    {
      "farcaster_fid": 99999,
      "farcaster_username": "mixmaster_v",
      "wallet_address": "0x9abc...ijkl",
      "role": "engineer",
      "contribution_weight": 10,
      "basis_points": 100_000
    }
  ],
  "total_basis_points": 1_000_000,
  "split_address_reserved": "TBD (after deploy)",
  "mutable": false,
  "controller_address": null,
  "revenue_sources": ["clanker_trades", "tortoise_collections", "tips", "mints"],
  "status": "split_created"
}
```

**Key Notes:**
- `basis_points` = `(contribution_weight / sum_of_weights) * 1_000_000`
- In this example: 50+40+10=100 total weight. Luna: 50/100 * 1M = 500k bps. Zaal: 40/100 * 1M = 400k bps. Mixmaster: 10/100 * 1M = 100k bps.
- **Immutable** split (no controller) means these weights are locked forever—no one can change them without a new split.

---

## Part 3: Where Revenue Streams Route

### On-Chain Revenue (Direct to Split)

**Clanker Token Trading Fees:**
- **Source:** Uniswap V3 pool for the collab's token (if a token is created for the project)
- **Fee structure:** 1% Sparkz fee + 0.2% Clanker fee + Uniswap LP fee (0.01% to 1% depending on tier)
- **Route:** Sparkz 1% fee → Sparkz treasury. **Remaining fees (Clanker 0.2%) → split address directly** (if collab opts into revenue split)
- **Frequency:** Every trade; accumulated and distributed by anyone calling `distributeERC20()`

**Mints & On-Chain Tips (Crypto):**
- **Source:** Direct WETH, USDC, or ETH transfers to the collab's Farcaster channel or designated mint contract
- **Route:** Tips sent to split address directly (no custody step)
- **Frequency:** Real-time

**Tortoise Collections (Music NFT Mints):**
- **Source:** Tortoise protocol revenue when fans collect a collab's song
- **Route:** **Tortoise pays Sparkz first** (off-chain or via stablecoin). Sparkz converts to USDC and pushes to split address in one tx.
- **Frequency:** Weekly or monthly batch (depends on Tortoise's payout schedule)

### Off-Chain Revenue (Treasury Mediation)

**Streaming Payouts (Spotify, Apple Music, etc.):**
- **Source:** Aggregator services (RouteNote, AWAL, etc.) that handle DSP payouts
- **Route:** Aggregator → **Sparkz treasury wallet** → Sparkz converts to stablecoin (USDC on Base) → **pushes to split address**
- **Why treasury step:** Streaming aggregators don't know about 0xSplits; they pay the copyright claimant (usually Sparkz or the lead artist). Sparkz acts as a pass-through.
- **Frequency:** Monthly (most DSP settlements are monthly)

**Tip Jar (Fiat Entry, Coinflow):**
- **Source:** Coinflow or Stripe checkout for "tip this collab"
- **Route:** Fiat → Coinflow converts to USDC → **Sparkz treasury** → **split address**
- **Frequency:** Real-time or batched daily

### Summary Table: Revenue → Split Routing

| Revenue Source | Type | On-Chain Route | Frequency | Custody Step |
|---|---|---|---|---|
| Clanker token trades | On-chain | 0.2% fee → split address | Every trade | None |
| Tortoise collections | Off-chain (crypto settled) | Tortoise → Sparkz → split address | Weekly/monthly | Sparkz treasury (stablecoin conversion) |
| Direct WETH/USDC tips | On-chain | Tip address → split address | Real-time | None |
| Streaming payouts (DSP) | Off-chain (fiat) | Aggregator → Sparkz → USDC → split | Monthly | Sparkz treasury |
| Fiat tips (Coinflow) | Off-chain | Coinflow → Sparkz → USDC → split | Daily batch | Sparkz treasury |

---

## Part 4: Split Distribution Workflow

### Once Funds Arrive in Split

The split contract accumulates revenue. Any of the three outcomes below can happen:

#### Flow 1: Automatic Distribution (Recommended for Sparkz)

Sparkz runs a backend job (e.g., daily cron) that:
1. Checks the split's balance (how much WETH, USDC, etc. is pending)
2. If balance > threshold (e.g., $10), calls `distributeERC20(token, recipients)` to push funds to each collaborator
3. Records the distribution event in Supabase (for tracking/transparency)

**Pros:** Frictionless for musicians; they wake up to money in their wallet.
**Cons:** Costs gas (~$2-5 per distribution); Sparkz bears the cost or takes a small fee (~0.5%).

#### Flow 2: Manual Withdrawal (Fallback)

Each musician can call `withdraw()` on the split contract anytime:
1. `split.withdraw(recipient, tokens)` — musician's wallet triggers the tx
2. Musician's share of each token is sent to their address
3. Zero cost to Sparkz (musician pays gas)

**Pros:** Zero Sparkz cost.
**Cons:** Requires each musician to understand blockchain UX (gas, wallet sig, etc.).

#### Flow 3: Hybrid (Recommended)

- Sparkz does auto-distribution for small amounts ($10-$100) to save friction
- Musician can manually withdraw anytime for large amounts

### Example Withdrawal Scenario

**Monday 10am:** "Midnight Anthem" split has accumulated $500 USDC + 2 WETH from trading + tips.

**Sparkz cron job runs:**
- `distributeERC20(USDC_address, [luna, zaal, mixmaster])` → Luna receives 250 USDC, Zaal 200 USDC, Mixmaster 50 USDC (50/40/10 split)
- `distributeETH()` → Luna receives 1 WETH, Zaal 0.8 WETH, Mixmaster 0.2 WETH (same split)

**Result:** Each musician sees their split arrive in their wallet within minutes. No action needed. Transparent on-chain (anyone can verify the split allocation on Etherscan).

---

## Part 5: Open Questions & Decisions for Zaal

These decisions affect the split design and implementation. Propose defaults; Zaal picks the final call.

### Decision 1: Immutable vs Mutable Splits

**Options:**
- **Immutable (recommended):** Controller = `address(0)`. Weights locked forever. Trust is math. No one can rug or change the deal.
- **Mutable:** Controller = multisig or Zaal's address. Can adjust recipients/weights if collab dynamics change (e.g., feature artist's contribution increases post-launch).

**Proposal:** **Immutable** for first collab. Simpler, stronger trust model. If adjustments needed later, create a new split and migrate (manual step).

**Implication:** If a collaborator's role evolves (e.g., mixer becomes co-producer), collab can't be amended—only new projects have new weights.

---

### Decision 2: Who Controls the Split? (If Mutable)

**Options:**
- **Zaal (single sig):** Zaal approves/rejects weight changes. Fastest but requires Zaal to evaluate disputes.
- **Multisig (2-of-3):** Multisig of lead artist + Zaal + Sparkz community vote. Slower, more trustless.
- **DAO vote (if Sparkz has governance token):** Defer to community. Overkill for Phase 1.

**Proposal (if split is mutable):** Zaal single-sig for Phase 1. Multisig (2-of-3) in Phase 2 if Sparkz governance emerges.

---

### Decision 3: Contribution Weight Model — Fixed or Dynamic?

**Options:**
- **Fixed (proposed):** Weights set at collab creation, locked in split contract. Static.
- **Dynamic:** Weights adjust based on real-time contribution signals (e.g., "each artist gets points for a cast, remix, or collection in the collab's channel, points determine split %"). More complex but fairer.

**Proposal:** **Fixed at creation** for Phase 1. Requires up-front negotiation but no smart contract complexity. Dynamic splits can wait for Phase 2 if needed.

---

### Decision 4: Automatic Distribution Cost — Who Pays Gas?

**Options:**
- **Sparkz pays:** Automatic distributions every day or on threshold ($10+). Cost: ~$2-5 per day in gas. Adds ~1-2% overhead to small payouts.
- **Musicians pay:** Each musician calls `withdraw()` manually. Zero Sparkz cost. Friction: musicians must understand blockchain UX.
- **Hybrid:** Sparkz auto-distributes for amounts <$50, musicians manually withdraw for >$50 or if they want to batch multiple tokens.

**Proposal:** **Hybrid**. Sparkz bears gas for small auto-distributions (good UX, low cost). Musicians can withdraw manually anytime if they prefer (0 Sparkz cost).

---

### Decision 5: Revenue Sources — Which Streams Use the Split?

**Options:**
- **All streams:** Clanker trades, Tortoise, tips, mints, streaming payouts all → split.
- **On-chain only:** Only Clanker + tips + mints → split. Streaming payouts stay with Sparkz treasury (off-chain accounting).
- **Opt-in per stream:** Each revenue source is toggleable. Collab can say "split Clanker fees but not Tortoise" if one artist handles streaming rights.

**Proposal:** **All streams into split** (simplest, most transparent). But allow opt-out via a flag if a collab has special licensing/rights concerns.

---

### Decision 6: Per-Track or Per-Collab Splits?

**Scope:** Does a split represent:
- **Per-track:** One song (e.g., "Midnight Anthem" single) gets a split. If Luna & Zaal release 3 songs, they have 3 splits.
- **Per-collab:** A creative partnership (Luna & Zaal as a duo) gets one split. All their songs share the revenue pool.

**Proposal:** **Per-track** for Phase 1. Clearer boundaries, easier to track. If two artists release 10 tracks together, they have 10 splits (or one mega-split if they want). Sparkz can recommend per-track as best practice.

---

### Decision 7: Minimum Number of Collaborators

**Question:** Can a collab have just one artist in the split (i.e., no actual collaboration)?

**Proposal:** Yes, but treat it as a **royalty split for an unrelated contributor** (e.g., producer paid a flat 20%). This opens up use cases like "Artist A pays Producer B from track revenue" without creating a full collab channel.

---

### Decision 8: Dispute Handling

**Scenario:** Luna says "Zaal promised 50% but only gave 40% after launch."

**Options:**
- **Trust + social:** Handled off-chain via Discord/DMs. If collab sours, create a new split.
- **On-chain escrow:** Funds sit in a timelock; any party can contest within 7 days. Adds complexity.
- **Sparkz mediation:** Zaal reviews disputes; if justified, splits are amended (requires mutable split). Requires trust in Zaal as arbitrator.

**Proposal:** **Trust + social** for Phase 1. If dispute emerges, Zaal can arbitrate by creating an amended split (manual process). Escrow overcomplicates Phase 1.

**Note:** Immutable splits prevent post-hoc arbitration, so weights **must** be right at creation. Collab setup should include a review step where both parties sign off.

---

### Decision 9: Tax & Accounting Integration

**Question:** How do we help musicians report their split earnings to tax authorities?

**Options:**
- **DIY:** Musicians track their withdrawals from the split contract themselves (on-chain is transparent).
- **Sparkz export:** Sparkz exports a CSV of all split distributions per musician per tax year.
- **Integration:** Partner with tax software (e.g., Rotki, CoinTracker) to auto-import split distributions.

**Proposal:** **Sparkz CSV export** (simple). Per-musician, per-split, CSV format: Date, Amount, Token, Recipient. Musicians import into tax software of choice.

---

## Part 6: Minimal Path to First Collab

This section outlines the **design-only** steps to run one real multi-musician split, without deploying or gating actions.

### Step 1: Collab Creation UI (Design)

**What creators see:**
1. "Start a collab" button in Sparkz
2. Form: collab name, description, release date, media/art
3. Roster section: "Add collaborators"
   - Input: Farcaster username → autocomplete
   - Input: Wallet address (for split)
   - Dropdown: Role (lead artist, feature, producer, engineer, other)
   - Slider: Contribution weight (1-100 relative)
4. Preview split allocation: "Luna 50%, Zaal 40%, Mixmaster 10%"
5. Review & confirm: "Create split contract" button
6. Status: "Split contract pending..." → "Split address: 0x1234..." (after deploy)

**Design note:** This is UI design only. No on-chain action. No real wallet sig yet.

---

### Step 2: Split Contract Deployment (Gated — NOT done here)

**When Zaal approves the collab:**
1. Sparkz backend calls 0xSplits SDK: `createSplit(recipients, allocations, controller, distribute)`
2. Deploy on Base mainnet
3. Store split address in Supabase: `sparkz_collabs` table
4. Return split address to UI
5. Collab page now shows: "Split address: 0x..." + "Copy address" button

**Who deploys:** Zaal only (or Sparkz backend service account). First collab is a manual approval + deploy step.

**Cost:** ~$2-5 in Base gas. Sparkz eats this for now.

---

### Step 3: Collab Channel Setup (Design)

**Sparkz provisions:**
1. Farcaster channel: `/sparkz-midnight-anthem` or `/midnight-anthem` (auto-created)
2. Channel description: Pulls from collab metadata
3. Pinned posts:
   - Collab details: name, artists, release date, description
   - Split info: "Revenue splits via 0xSplits. [Luna] 50%, [Zaal] 40%, [Mixmaster] 10%."
   - Split address: QR code + copyable link for transparency
   - How to contribute: "Share this release, collect on Tortoise, trade the token (if launched)"

**Design only.** No smart contract here. Just Farcaster channel structure.

---

### Step 4: Revenue Flow Setup (Design + Partial Implementation)

**On-chain revenue** (Clanker trades, tips):
- Proposal: When the collab launches a token, Sparkz configures the fee receiver to be the split address (no code change; just a config parameter).
- Result: 0.2% Clanker fee → split automatically for every trade.

**Off-chain revenue** (Tortoise, streaming):
- Proposal: Sparkz treasury receives payouts. Backend job (daily) checks Tortoise API for the collab's collections revenue, converts to USDC, sends to split address via `distributeERC20()`.
- Implementation note: Requires Tortoise API integration (doc 1096 says "if Tortoise has public API; fallback: manual data entry"). **For Phase 1, assume Tortoise exposes API or we call it manually.**

---

### Step 5: Distribution Workflow (Design)

**Daily auto-distribution (Sparkz backend):**
```
Every 24h (or on threshold):
  1. Query split contract balance (getETHBalance, getERC20Balance)
  2. If balance > $10 USD equivalent:
    3. Call distributeERC20(token, recipients) for each token
    4. Log to Supabase: split_distributions table
       - timestamp, split_address, token, recipients, amounts
    5. Notify each musician in app/Telegram: "Your split earned $X from [collab_name]"
```

**Manual withdrawal fallback:**
- Musicians can anytime visit the split contract on Etherscan (0xsplits.xyz link), call `withdraw()`, and claim their balance.
- Sparkz can provide a UI button: "Claim my balance" → Links to split contract on Etherscan with pre-filled recipient address.

---

### Step 6: First Collab Workflow (Full E2E, Design Only)

**Timeline for one real collab (not deployed):**

**Day 1: Setup**
- Luna & Zaal create collab in Sparkz UI
- Fill form: name="Midnight Anthem", release="2026-08-15", roles (Luna: lead 50%, Zaal: producer 40%, Mixmaster: engineer 10%)
- Submit. Sparkz shows: "Waiting for approval..."

**Day 1: Zaal Approval (Gated)**
- Zaal reviews collab in Sparkz admin panel
- Checks: all wallets valid, weights sum to 100%, no abuse (red flags?)
- Clicks "Deploy split contract"
- 0xSplits SDK deploys on Base. Split address: `0x1234...abcd`
- Sparkz stores in DB. Collab status: "live"
- Email/Telegram to Luna & Zaal: "Your split is live: 0x1234...abcd"

**Days 1-30: Promotion**
- Luna & Zaal post in `/sparkz-midnight-anthem` channel: behind-the-scenes, release countdown, etc.
- Tortoise integration: if they have a Tortoise track, collections go into energy score and feed collab page
- Fans tip the split address directly (WETH, USDC) — goes straight to split
- Energy score reflects collab momentum

**Day 30: Token Launch (Optional)**
- Luna & Zaal decide to launch a token for "Midnight Anthem" (tokenize the collab)
- Sparkz formats Clanker cast, they approve & broadcast
- Token deploys on Base, Uniswap pool created
- **Sparkz configures fee receiver to split address** → all 0.2% Clanker fees now flow to split

**Days 30-60: Trading + Revenue**
- Community buys token, trades happen
- Revenue accumulates:
  - Clanker fees: 0.2% per trade → split
  - Tortoise collections: weekly payout → Sparkz → split address in USDC
  - Tips: direct transfers → split
- **Sparkz cron runs daily:**
  - Checks split balance
  - If >$10, distributes: Luna gets 50%, Zaal 40%, Mixmaster 10%
  - Logs distribution to DB
  - Musicians receive notifications

**Result:** After 30 days, Luna's wallet has $50, Zaal's has $40, Mixmaster's has $10. All from the split contract. No custody. Completely transparent. Each can verify on Etherscan.

---

## Part 7: Technical Architecture (Implementation Sketch, NOT Built)

### Sparkz Backend Changes (Future Implementation)

**New Supabase Tables:**

```sql
-- Collaborative projects
CREATE TABLE sparkz_collabs (
  id UUID PRIMARY KEY,
  collab_name TEXT,
  description TEXT,
  release_date TIMESTAMP,
  image_url TEXT,
  channel_name TEXT, -- Farcaster channel
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Collaborator roster per collab
CREATE TABLE sparkz_collab_members (
  id UUID PRIMARY KEY,
  collab_id UUID REFERENCES sparkz_collabs(id),
  farcaster_fid INTEGER,
  wallet_address TEXT,
  role TEXT, -- "lead_artist", "feature", "producer", "engineer", etc.
  contribution_weight INTEGER, -- 1-100 relative
  basis_points INTEGER, -- computed: (weight / total_weight) * 1_000_000
  created_at TIMESTAMP
);

-- Split contract records
CREATE TABLE sparkz_split_contracts (
  id UUID PRIMARY KEY,
  collab_id UUID REFERENCES sparkz_collabs(id),
  split_address TEXT UNIQUE, -- on-chain Split contract address
  chain_id INTEGER, -- 8453 for Base
  mutable BOOLEAN DEFAULT FALSE,
  controller_address TEXT, -- null if immutable
  created_at TIMESTAMP,
  status TEXT -- "pending_deploy", "live", "archived"
);

-- Revenue distributions from splits
CREATE TABLE sparkz_split_distributions (
  id UUID PRIMARY KEY,
  split_address TEXT,
  token_address TEXT, -- WETH, USDC, etc.
  total_amount NUMERIC(20, 6),
  distributor_address TEXT, -- who called distribute()
  recipient_count INTEGER,
  tx_hash TEXT,
  distributed_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Per-recipient share of distribution
CREATE TABLE sparkz_distribution_shares (
  id UUID PRIMARY KEY,
  distribution_id UUID REFERENCES sparkz_split_distributions(id),
  recipient_address TEXT,
  basis_points INTEGER,
  share_amount NUMERIC(20, 6),
  created_at TIMESTAMP
);
```

**Backend API Routes (Sketch):**

```
POST   /api/sparkz/collabs
       Create collab (pre-split, UI only)
       Input: collab_name, description, members[], weights[]
       Output: collab_id, status="pending_approval"

GET    /api/sparkz/collabs/:collab_id
       Fetch collab details + member roster

POST   /api/sparkz/collabs/:collab_id/deploy
       [GATED: Zaal only] Deploy 0xSplits contract
       Input: collab_id
       Output: split_address, tx_hash, status="live"

GET    /api/sparkz/splits/:split_address
       Fetch split details (recipients, allocations, balance)
       Output: { recipients: [], allocations: [], balance: {...} }

POST   /api/sparkz/splits/:split_address/distribute
       [GATED: Sparkz backend only] Distribute funds to recipients
       Cron job calls this daily
       Input: split_address, token_list (WETH, USDC, etc.)
       Output: tx_hash, amounts per recipient

GET    /api/sparkz/collabs/:collab_id/distributions
       Fetch distribution history for collab
       Output: [ { timestamp, token, amounts: {...} } ]
```

**Agent/Cron Job (Backend):**

```
Every 24 hours (or configurable):
  1. Query all live splits in sparkz_split_contracts
  2. For each split:
    3. Fetch on-chain balance (ETH, WETH, USDC, etc.)
    4. If balance > $10 equivalent:
      5. Call distributeERC20(token, recipients) for each token
      6. Log to sparkz_split_distributions
      7. Send notifications to each recipient (Telegram, in-app)
```

**0xSplits SDK Integration (TypeScript):**

```typescript
import { splitClient } from "0xsplits/client";

// Deploy a new split
async function deployCollab(collab: Collab, members: Member[]) {
  const recipients = members.map(m => m.wallet_address);
  const allocations = members.map(m => m.basis_points);

  const split = await splitClient.createSplit({
    recipients,
    allocations,
    distributorFeePercent: 0, // Sparkz bears gas cost, no fee
    controller: null, // Immutable
  });

  return split.splitAddress;
}

// Distribute funds from split
async function distributeSplitFunds(splitAddress: string, token: string) {
  const balance = await splitClient.getERC20Balance(splitAddress, token);
  if (balance.gt(10e6)) { // $10 in USDC
    const tx = await splitClient.distributeERC20({
      splitAddress,
      token,
      recipients: [...], // auto-fetched from split contract
    });
    return tx;
  }
}
```

---

## Part 8: Sparkz Integration Points

### Where Splits Plug In

| Sparkz Component | Integration | Notes |
|---|---|---|
| **Collab creation UI** | Routes to split-member form (wallet, role, weight) | No change to existing energy-score UI; split is a collab-specific feature |
| **Channel provisioning** | Auto-create `/sparkz-[collab-name]` with split info pinned | Reuses existing channel logic; adds split address to pinned post |
| **Token launch flow** | If collab launches token, set fee receiver to split address | No code change; config parameter when calling Clanker |
| **Tortoise integration** | Collab page shows "collections on Tortoise → split address" | Mirrors existing Tortoise integration; redirects revenue to split |
| **Energy score** | Collab participation (members' posts, collections, trades) feed into energy; split enable/disable independent | Split is not energy-gated; can exist without launching token |
| **Notification system** | Notify all split members of distributions daily/weekly | Reuses existing notification infrastructure (Telegram, in-app) |
| **Analytics dashboard** | Show collab creator: revenue per member, split history, distribution frequency | New dashboard; reuses existing charting components |

### Revenue Routing Diagram (Simplified)

```
Tortoise collections
    ↓
Sparkz treasury (weekly settle)
    ↓
Convert to USDC
    ↓
0xSplits contract (split_address)
    ↓
Members withdraw independently

---

Clanker token trades (0.2% fee)
    ↓
0xSplits contract (split_address directly)
    ↓
Members withdraw independently

---

Direct WETH/USDC tips
    ↓
0xSplits contract (split_address directly)
    ↓
Members withdraw independently

---

Sparkz backend (daily cron)
    ↓
distributeERC20(split_address, tokens)
    ↓
Each member's wallet balance increases
    ↓
Notification: "You earned $X from [collab_name]"
```

---

## Part 9: Security & Audit Considerations

### Risks & Mitigations

| Risk | Mitigation | Owner |
|---|---|---|
| **Split immutability lock-in** | Allow mutable-on-demand (expensive manual amendment). Recommend test deployment first on testnet. | Zaal (before deployment) |
| **Recipient wallet compromise** | Members use hardware wallets for long-term splits. Sparkz doesn't custody. | Members |
| **Off-chain revenue source fraud** | Sparkz audits Tortoise/streaming payout receipts before sending to split. Log everything. | Sparkz ops |
| **Gas cost overhead** | Sparkz bears cost for Phase 1 (<$5/day). If overhead >5% of revenue, revisit (Phase 2 decision). | Sparkz |
| **Split address not found** | Unlikely; 0xSplits is audited (2021 + 2023). Use official SDK + contracts. | Engineering |
| **Taxation unclear** | CSV export per musician shows all distributions. Musicians file with tax professionals. Sparkz does not provide tax advice. | Musicians + their accountants |

### Audit Checklist (Before First Collab Deploy)

- [ ] 0xSplits contracts on Base verified (etherscan.io/base)
- [ ] Sparkz backend can call SDK without errors (testnet deploy first)
- [ ] All split members confirm wallet addresses 2x (typos = lost funds)
- [ ] Zaal reviews collab members (no red flags, no known disputes)
- [ ] Tortoise/streaming API integration tested with mock data
- [ ] Notifications sent to all members (test run)
- [ ] Etherscan link provided to all members for transparency

---

## Part 10: Future Phases

### Phase 2 (If Sparkz Succeeds)

- **Dynamic contribution scoring:** Collaborators earn points for casts, collections, engagement in the channel. Points auto-adjust split weights (requires mutable split contract + governance).
- **Multi-collab portfolios:** Artist A has 10 collabs; one dashboard shows aggregated earnings + split history across all 10.
- **Escrow + dispute resolution:** Funds can be held in timelock; any member can challenge allocation within 7 days. Requires smart contract.
- **Tax software integration:** Auto-export to TurboTax, CoinTracker, Rotki.
- **Secondary splits:** Producer's 20% can itself split into engineer (5%) + mixer (15%) via nested 0xSplits contracts.

### Phase 3 (Long-term)

- **Governance tokens for splits:** If collab is large enough, issue a governance token to split members + community. Token holders vote on future changes (dissolve split, merge splits, etc.).
- **Automated royalty tracking:** On-chain provenance linking every Tortoise collection/Clanker trade back to the collab + split for transparent audit trails.
- **Splits marketplace:** Creators can browse & copy "split templates" (e.g., "standard 50/40/10 producer/feature/engineer") for faster setup.

---

## Part 11: Open Questions (Summary for Zaal)

1. **Immutable or mutable splits?** Recommend: immutable (stronger trust).
2. **Who controls if mutable?** Recommend: Zaal single-sig (Phase 1).
3. **Contribution model: fixed or dynamic?** Recommend: fixed at creation (simpler).
4. **Auto-distribution gas cost: who pays?** Recommend: hybrid (Sparkz for <$50, musicians manual for >$50).
5. **Which revenue streams use split?** Recommend: all streams (max transparency).
6. **Per-track or per-collab splits?** Recommend: per-track (clearer).
7. **Dispute handling process?** Recommend: trust + social (Phase 1), arbitration in Phase 2.
8. **Tax reporting export?** Recommend: CSV per musician, per-split.
9. **First collab: real or beta?** Recommend: real (deploy on mainnet after Zaal approval).
10. **Launch window: when?** Recommend: pair with Sparkz Phase 1 launch (late Aug 2026).

---

## Part 12: Conclusion

**0xSplits + Sparkz = Non-Custodial Music Collabs**

This design spec shows how Sparkz can enable multi-musician collabs to share revenue transparently, without custody risk. By mapping Sparkz collab metadata to 0xSplits recipient contracts, every revenue stream (on-chain and off-chain) routes to a transparent, immutable, and composable split.

Key decisions (immutable vs mutable, auto-distribution, revenue sources) are left to Zaal. The minimal first-collab path is: create split → point revenue → auto-distribute → scale.

**Next Step:** Zaal reviews open decisions, picks defaults, and signals go/no-go for Phase 1 implementation.

---

## Sources & References

- **0xSplits Docs:** https://docs.0xsplits.xyz/
- **0xSplits on Base:** https://splits.org (live deployment)
- **Doc 1096 - Sparkz Design:** Full architecture, Tortoise integration, energy-score
- **Doc 1097 - Sparkz Competitive:** Market validation for energy-first positioning
- **Doc 1098 - Sparkz Brief:** Consolidated decisions, locked-in thesis
- **Doc 222 - Payment Infrastructure:** Mentions 0xSplits + Stripe + Coinbase payment stack for ZAO
- **Doc 628 - Web3 Streaming + ZABAL:** Revenue routing patterns for creator economy

---

## Next Actions

| Owner | Action | Type | Deadline | Success |
|---|---|---|---|---|
| Zaal | Review open decisions (section 11) | Decision | 2026-07-20 | 10 questions answered; defaults set |
| Zaal | Confirm Tortoise API readiness (Doc 1096) | Confirm | 2026-07-18 | API docs or "manual only" decision |
| Dev | Testnet deploy: create split for 2-person collab | Code | 2026-08-01 | Split address + all members can withdraw |
| Dev | Wire Tortoise → split revenue routing | Integration | 2026-08-05 | Mock data flows to split address in USDC |
| Dev | Build collab creation UI (member roster, weight form) | UI | 2026-08-10 | UI ready for Zaal's own Midnight Anthem collab test |
| Zaal | Approve first collab for mainnet deploy | Gate | 2026-08-12 | Split lives on Base mainnet; revenue flows |
| Zaal | Launch first collab token (if applicable) | Ship | 2026-08-20 | Trading begins; fees route to split |
| Zaal | Distribute first split earnings to members | Ops | 2026-08-25 | All members receive their share; verify on Etherscan |
