---
topic: wavewarz/tokenomics
type: DESIGN-BRIEF
status: decision-ready
created: 2026-07-17
board-task: 8f6cc660
related-docs: 1283, 1312, 258, 572
owner: Zaal
deadline: 2026-08-15 (before ZABAL Cohort 1 capstone)
---

# 1321 — WaveWarZ Protocol Fees → $ZABAL Treasury: Integration Design

> **Problem:** WaveWarZ earns 3% protocol fees in SOL on every battle. Today that SOL sits in the WaveWarZ protocol wallet with no connection to $ZABAL token or the ZAO treasury. Feeding even 50% of those fees toward $ZABAL creates an automatic buyback loop — every battle generates demand for $ZABAL.
>
> **Options:** Three paths, each with a different cost/speed/complexity tradeoff. This doc recommends one and outlines the Zaal-gated steps to ship it.

---

## Current Protocol Fee Flow

```
Battle opens (SOL bet)
    │
    ▼ battle closes
Winner receives ~97% SOL
    │
    ▼
WaveWarZ protocol wallet receives ~3% SOL
    │
    ▼
Nothing happens (fee sits in wallet)
```

At 524 SOL total volume (per doc 1278), the 3% fee pool is ~15.7 SOL (~$2,000 at $125/SOL). Future: at 1,000 SOL/month run rate, fee pool is 30 SOL/month (~$3,750/month).

---

## Three Integration Options

### Option A: Manual Monthly Sweep (Do Now — No Code)

**What:** Zaal manually converts WaveWarZ fee wallet SOL to USDC each month, bridges to Base, buys $ZABAL, sends to ZAO treasury.

**Cadence:** 1st of each month, ~20 minutes.

**Pros:** Zero code, zero bridge risk, starts immediately.

**Cons:** Manual, depends on Zaal. Doesn't scale past ~$5K/month sweep before gas/slippage matters.

**Verdict:** Start here. Ship Option B once monthly SOL volume exceeds 200 SOL/month (threshold where automation pays off vs. gas).

---

### Option B: ZOE-Automated Monthly Sweep (2-4 weeks to build)

**What:** ZOE bot (on VPS) runs a monthly cron:
1. Reads WaveWarZ fee wallet SOL balance via Solana RPC
2. If balance > threshold (e.g., 5 SOL), swaps SOL → USDC via Jupiter Aggregator (best Solana DEX route)
3. Bridges USDC via Wormhole or deBridge to Base
4. Swaps USDC → $ZABAL via Uniswap V3 on Base
5. Sends $ZABAL to ZAO treasury address
6. Posts Telegram notification: "treasury sweep: X SOL → Y $ZABAL"

**Dependencies:**
- WaveWarZ fee wallet private key in VPS `.env` (Zaal-gated, onchain = STOP + DECISION NEEDED)
- Jupiter API (free, no key needed)
- Bridge API key (Wormhole: free tier; deBridge: free tier)
- Uniswap V3 Router address on Base
- Treasury address (where to send $ZABAL)

**Pros:** Fully automated, Telegram receipt per sweep, auditble on both chains.

**Cons:** Multi-chain complexity (Solana + EVM), bridge risk (~0.1% bridge fee), ~10-15 LOC of risk surface (private key on VPS).

**Security note:** Fee wallet should be a DEDICATED wallet (not the main WaveWarZ operational wallet). Only the fee accumulation goes here.

---

### Option C: Protocol-Level Split at Settlement (1-2 weeks to build)

**What:** Modify WaveWarZ settlement contract to split the 3% fee at battle close: 1.5% stays in WW treasury (SOL), 1.5% is auto-converted to USDC and held in a "ZABAL-earmark" wallet.

**Pros:** Fee splitting happens at protocol level, not a cron job. The ZABAL-earmark accumulates without ZOE needing to know WaveWarZ is running.

**Cons:** Requires modifying the WaveWarZ Solana smart contract. Most risk, most dev time.

**Verdict:** Don't do this until Option B is running well and the monthly SOL volume justifies the contract change.

---

## Recommendation

**Start with Option A (manual sweep), build toward Option B.**

| Phase | When | What | Zaal Action |
|-------|------|------|-------------|
| Phase 1 (now) | This month | Manual sweep: sell WW fee wallet SOL, buy $ZABAL, send to treasury | Zaal does the first sweep |
| Phase 2 (Aug 2026) | After pilot data | Design ZOE sweep bot + get treasury address from Adrian | Zaal provides fee wallet key to ZOE |
| Phase 3 (Q4 2026) | After 200 SOL/month | Evaluate contract-level split | Zaal + developer |

---

## What "Treasury" Means Here

The $ZABAL "treasury" is the ZAO governance wallet that holds $ZABAL for:
- Cohort 1 capstone prize (top 3 builders, doc 1311)
- QR-bid redemptions (doc 1222)
- Future token-weighted governance

If no formal treasury wallet exists yet, Phase 1 simply means Zaal buys $ZABAL and holds it in his personal wallet labeled "ZAO treasury — WW fees." Formalize the wallet address before Phase 2.

---

## Citable Mechanics (For Grant Applications + GEO)

Once Phase 1 is running, ZAO can cite:

> "WaveWarZ protocol fees (3% of all battle volume) auto-convert to $ZABAL and flow to the ZAO treasury, creating a direct connection between protocol activity and token value. At 524+ SOL in cumulative volume, the first treasury tranche represents a fully on-chain revenue-to-token feedback loop."

This is a strong differentiator for:
- Artizen grant narrative (proving ZAO has on-chain economics)
- OP Retro Funding (cross-chain protocol with Solana → Base treasury)
- COC #8 announcement ("every WaveWarZ battle now funds the next show")

---

## What Needs Zaal Decision (GATED)

1. **DECISION: Which wallet receives the 3% fees today?** Confirm the WW fee wallet address.
2. **DECISION: What is the ZAO/ZABAL treasury address?** Where does swept $ZABAL go?
3. **DECISION: Adrian's role?** Adrian holds the Empire Builder private endpoint (doc board task 3009dec9). Does the treasury address route through him?
4. **SPEND: Phase 1 sweep is ~$2K of existing SOL** → not a new spend, it's converting already-earned fees. Confirm Zaal is comfortable with Jupiter + deBridge fees (~0.3%).

These 4 items are the only blockers to Phase 1.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1283 | ZABAL August buildathon mechanics (9 QR-bid projects, buyback loop design) |
| doc 1312 | ZABAL+WaveWarZ August strategy — Track B (monetize) is where this lands |
| doc 258 | ZABAL + SANG buyback mechanics (broader tokenomics context) |
| doc 572 | $ZABAL on Base decision — confirms Base is the treasury chain, not Avalanche |
