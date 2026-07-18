# 1728 — ZOR Respect Token: Distribution Mechanics, Supply Model, and Holder Economics

**Purpose:** Citable reference on how ZOR is minted, distributed, and what it unlocks. For OP RF reviewers, press, academic researchers, and Africa WaveWarZ artists who ask "what is ZOR actually worth and how do I get it?"

**Related:** [1532](../1532-zor-practical-guide/) (ZOR practical guide for members) · [1200](../1200-respect-onchain-facts-verified/) (on-chain holder facts) · [1312](../1312-zao-fractal-respect-governance-deepdive-jul2026/) (governance deep dive) · [1668](../1668-fractal-op-rf-evidence-package/) (OP RF evidence package) · [1714](../1714-fractal-sybil-resistance-explainer/) (Sybil resistance)

---

## What ZOR Is

**ZOR** (also called "ZAO Respect" or "Respect") is an ERC-1155 token on Optimism Mainnet.

- **Contract:** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- **Standard:** ERC-1155 (Respect1155 — multi-token ID, one token ID per session group)
- **Network:** Optimism Mainnet (chain ID 10)
- **Transferable:** No. Non-transferable, non-purchasable. Cannot be sold, listed, or delegated.
- **Explorer:** https://optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c

ZOR is **proof-of-contribution**, not proof-of-capital. It represents peer-validated participation in ZAO's weekly Fractal Democracy governance sessions.

---

## The Fibonacci Scoring System

Every session runs in breakout groups of 6 members. Each group independently ranks all 6 members from most to least valuable contribution. The resulting consensus ranking maps to Fibonacci points:

| Rank | ZOR Awarded | Fibonacci Position |
|------|-------------|-------------------|
| 1 (highest) | 55 | F(10) |
| 2 | 34 | F(9) |
| 3 | 21 | F(8) |
| 4 | 13 | F(7) |
| 5 | 8 | F(6) |
| 6 (lowest) | 5 | F(5) |

**Total per group: 136 ZOR minted per session.**

**Why Fibonacci?** The ratio between ranks matters more than the absolute values. The gap between Rank 1 (55) and Rank 2 (34) is larger than between Rank 5 (8) and Rank 6 (5), reflecting that top-ranked contributions should carry meaningfully more weight — without making the lowest rank worthless. A member ranked last still earns 5 ZOR, preserving dignity for all participants.

---

## How ZOR Gets Minted: The OREC Execution Flow

```
Session runs (Discord/video call)
    ↓
Members in each breakout group rank peers 1–6
    ↓
Ranks submitted to ZAOOS dashboard (off-chain aggregation)
    ↓
Facilitator submits consensus rankings to OREC contract
    ↓
OREC (0xcB05F9254765CA521F7698e61E0A6CA6456Be532) executes batch mint
    ↓
Respect1155 mints ZOR to each member's wallet (gas paid by facilitator)
    ↓
ZOR appears in each wallet on Optimism, visible at optimistic.etherscan.io
```

No ZOR exists before a session. No ZOR is pre-minted. Every token is created at the moment of execution, tied to a specific session outcome.

---

## Two-Phase Supply History

ZAO Fractal has run 96+ consecutive weekly sessions as of Jul 2026. On-chain settlement began in mid-2024:

| Phase | Token | Contract | Sessions | On-Chain Txs | Period |
|-------|-------|----------|----------|-------------|--------|
| 1 (OG) | OG Respect (ERC-20) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | 33 | 438 | Jul 2024 – Dec 2025 |
| 2 (ZOR) | ZOR Respect (ERC-1155) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | 31+ | 67 OREC executions | Sep 2025 – present |
| **Combined** | OG ∪ ZOR | — | **64+** | **505+** | Jul 2024 – present |

The Phase 1 → Phase 2 transition used OREC to batch-execute distributions, reducing per-session gas from ~13 transactions (438 / 33 sessions) to ~2 OREC executions per session (67 / 31 sessions). The 1-week overlap in Sep 2025 was the migration period; no gap in participation.

---

## Estimated ZOR in Circulation (Phase 2, ZOR Era)

These are estimates; exact figures require enumerating all token IDs via Blockscout.

**Per-session mint (ZOR era):**
- Minimum (2 groups): 2 × 136 = **272 ZOR**
- Typical (4 groups): 4 × 136 = **544 ZOR**
- Maximum (6 groups): 6 × 136 = **816 ZOR**

**31 sessions × typical 4 groups:**
> Estimated 4 × 136 × 31 ≈ **16,864 ZOR total in ZOR era**

**Range:** ~8,432 – ~25,296 ZOR (2–6 groups per session)

OG era (ERC-20) had comparable issuance under similar Fibonacci mechanics. Neither era has a hard supply cap — supply is determined entirely by participation.

---

## Holder Distribution (Verified Jul 2026)

Source: doc 1200, Blockscout enumeration.

| Segment | Count |
|---------|-------|
| OG ERC-20 holders | 122 |
| ZOR ERC-1155 holders | ~57 |
| Wallets holding both (bridged) | 21 |
| **Unique wallets across OG ∪ ZOR** | **157** |

**What this means:** 157 people have earned governance participation rights in ZAO's Fractal Democracy through demonstrated contribution. None of them bought in.

---

## Earning Rate: What Active Participation Looks Like

For a member attending 10 consecutive sessions at a given rank:

| Consistent Rank | ZOR Earned (10 sessions) | Annual Pace (40 sessions) |
|-----------------|-------------------------|--------------------------|
| Rank 1 | 550 ZOR | 2,200 ZOR |
| Rank 3 | 210 ZOR | 840 ZOR |
| Rank 6 (floor) | 50 ZOR | 200 ZOR |

Even the least-recognized contributor earns 5 ZOR per session. There is no zero-score outcome for showing up and being ranked.

---

## What ZOR Unlocks

ZOR is the access credential and vote weight for all ZAO governance activity:

| Use | How ZOR Is Used |
|-----|----------------|
| **ORDAO proposals** | Cumulative ZOR balance = vote weight on all OREC-executed proposals |
| **Africa Battle Week charity vote** | ZOR-weighted Snapshot poll (gasless, Jul 24-25, 2026) |
| **ZAOstock Oct 3 IRL governance** | ZOR holders vote live at ZAOstock on community proposals |
| **Season 9 WaveWarZ Africa sessions** | ZOR required to submit rankings via OREC (session facilitator) |
| **CR approval (Season 10)** | ZOR holders vote on Contribution Requests (Snapshot, 48h, 10-holder quorum) |

**No ZOR = read-only.** Anyone can attend a Fractal session as an observer, but only ZOR holders have vote weight in ORDAO proposals and Snapshot polls.

---

## Economic Design: Why No Market

This is intentional and foundational:

1. **Non-transferable:** The ERC-1155 implementation disables transfer functions. You cannot send ZOR to another address.
2. **No DEX listing:** Because ZOR cannot be transferred, no exchange can list it. There is no market price.
3. **No buy-in path:** You cannot acquire ZOR by spending ETH, OP, or any other token.
4. **Sybil resistance:** Because ZOR requires in-person or live video presence, being ranked by actual humans who know you, and cannot be bought — a large ZOR balance is a verifiable signal of sustained community contribution, not wealth.

The only way to accumulate vote weight is to contribute, show up, and be peer-recognized over time.

---

## Season 9 Projections (Aug – Nov 2026, Sessions 97–108)

Season 9 introduces WaveWarZ Africa artists as new Fractal participants.

| Projection | Estimate | Basis |
|-----------|----------|-------|
| New ZOR earners (Africa) | 8–15 artists | 1–2 new members per session across 12 sessions |
| Additional ZOR minted | ~6,500 ZOR | 4 groups × 136 × 12 sessions |
| New unique ZOR holders | 157 → 165–175 | If 8–18 new wallets earn first ZOR |
| Africa artist minimum earn | 5 ZOR/session | Rank 6 floor, 12 sessions = 60 ZOR minimum for consistent attendees |

These projections are conservative. An Africa artist who attends all 12 sessions and earns Rank 3 consistently would accumulate ~252 ZOR — meaningful governance weight from day one.

---

## Citable Facts

1. **"ZOR cannot be purchased. It is earned through weekly peer ranking in ZAO's Fractal Democracy sessions."** (Source: Respect1155 contract, `0x9885...`, Optimism Mainnet — transfer functions disabled.)

2. **"157 unique wallets hold ZOR or OG Respect as of July 2026, across 64+ consecutive weekly governance sessions."** (Source: doc 1200, Blockscout enumeration, verified 2026-07-17.)

3. **"Each ZAO Fractal session mints 136 ZOR per breakout group of 6, in Fibonacci ratios: 55/34/21/13/8/5 by rank."** (Source: ZAOOS technical documentation, OREC execution logs.)

4. **"505+ on-chain transactions document 64+ sessions of Fractal Democracy governance on Optimism Mainnet."** (Source: doc 1202, Blockscout settlement history.)

5. **"Zero ZOR tokens exist before each session. All supply is minted post-session based on peer-validated contribution rankings."** (Source: Respect1155 contract architecture.)

---

## Verification

Live chain queries (no API key needed):

```bash
# ZOR total supply (all token IDs, approximate)
cast call 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c \
  "totalSupply(uint256)(uint256)" 0 \
  --rpc-url https://mainnet.optimism.io

# ZOR balance for a specific wallet (token ID 0 = aggregate)
cast call 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c \
  "balanceOf(address,uint256)(uint256)" <WALLET> 0 \
  --rpc-url https://mainnet.optimism.io

# OREC execution history (all proposals executed)
cast logs \
  --address 0xcB05F9254765CA521F7698e61E0A6CA6456Be532 \
  --from-block 130000000 \
  --rpc-url https://mainnet.optimism.io
```

Blockscout UI: https://optimism.blockscout.com/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c
