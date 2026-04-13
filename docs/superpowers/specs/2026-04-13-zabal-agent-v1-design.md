# ZABAL Agent v1 Design Spec

**Date:** April 13, 2026
**Status:** Approved by Zaal

---

## What This Is

A fully autonomous ZABAL agent system where you set a daily budget and the agents handle everything: buying ZABAL smartly (signal-based, not scheduled), burning 1%, staking, buying content (being the first buyer), and gifting content to active community members on a rotation. ZOE dispatches everything via Telegram.

## What's In Scope (v1 only)

1. **Buy ZABAL** -- signal-based (price/liquidity/time/balance/random), not fixed schedule
2. **Burn 1%** -- automatic on every ZABAL buy
3. **Stake every 14 days** -- silent, autonomous, 100M minimum
4. **Buy Paragraph/publish.new content** -- be the first buyer of community content
5. **Gift content** -- buy 2, keep 1, gift 1 to next person in rotation
6. **Post to Farcaster** -- "[VAULT] bought ZABAL, gifted a post to @member"

## What's NOT In Scope (later)

- ZOUNZ NFT buying
- SANG buying
- Bounty board
- Conviction governance UI
- Oracle rewards
- Knowledge graph signals
- Content generation (agents only buy/distribute, YOU create via ZOE)

## Architecture

```
Zaal sets: daily_budget = $10

VAULT cron fires (every 4 hours on Pro, 1x/day on Hobby)
    │
    ▼
Evaluate 5 signals → composite score
    │
    ├─ score > 70 → full trade (70% of remaining daily budget)
    ├─ score 40-70 → small trade (35% of remaining)
    └─ score < 40 → skip
    │
    ▼
If trading:
    ├─ Buy ZABAL via 0x API + Privy wallet
    ├─ Burn 1% to 0x...dEaD
    ├─ Check: 14 days since last stake + balance >= 100M? → auto-stake
    ├─ Check: content budget remaining? → buy 2 Paragraph posts
    ├─ Gift 1 post to next person in rotation
    └─ Post summary to /zao Farcaster
    │
    ▼
Log everything to Supabase agent_events
```

## Config (all changeable via Supabase, no redeploy)

```sql
-- In agent_config table, new columns:
daily_budget_usd numeric DEFAULT 10,
zabal_allocation_pct numeric DEFAULT 70,
content_allocation_pct numeric DEFAULT 30,
gift_enabled boolean DEFAULT true,
gift_rotation_list text[] DEFAULT '{}',
gift_rotation_index integer DEFAULT 0,
min_signal_score numeric DEFAULT 40
```

## Signal Engine

5 signals evaluated each cron run:

| Signal | Weight | 0 (bad) | 50 (neutral) | 100 (good) |
|--------|--------|---------|-------------|------------|
| Price | 30% | 20%+ above 7d avg | At average | 20%+ below avg (dip) |
| Liquidity | 25% | Pool < $100 | $500 pool | Pool > $1000 |
| Time | 20% | Traded < 6h ago | 12-24h ago | > 24h since last |
| Balance | 15% | < 0.001 ETH | 0.005 ETH | > 0.01 ETH |
| Random | 10% | Low roll | Mid roll | High roll |

Composite = weighted sum. Trade if > min_signal_score (default 40).

## Content Buying + Gifting

```
1. Agent checks Paragraph API for new posts by @thezao publication
   (or any configured publication)
2. If new post found that hasn't been bought yet:
   a. Buy post coin (Base, via Doppler protocol) -- "be the first buyer"
   b. Buy a second one
   c. Gift second to next person in gift_rotation_list
   d. Increment gift_rotation_index
   e. Post to /zao: "[VAULT] First buyer of 'Show Recap #5'! Gifted a copy to @member"
3. If no new content: skip content buying, allocate more to ZABAL
```

## Gift Rotation

```
gift_rotation_list starts empty
  → Auto-populated from users who were active in last 7 days
  → "Active" = posted in /zao OR attended a SongJam space OR voted on a proposal
  → Refreshed weekly by a cron job
  → gift_rotation_index increments each gift
  → When index reaches end of list, wraps to 0
  → Everyone gets a turn before anyone gets a second
```

## Agent Roles (v1 simplified)

All 3 agents do the same thing with different timing:

| Agent | Cron | What It Does |
|-------|------|-------------|
| VAULT | Every 4h (or 1x/day) | Evaluate signals → buy ZABAL → burn → stake → buy content → gift |
| BANKER | Every 4h offset | Same but 2h offset from VAULT |
| DEALER | Every 4h offset | Same but 4h offset from VAULT |

In v1, all agents run identical logic. Differentiation (BANKER focuses on COC content, DEALER focuses on FISHBOWLZ content) comes in v2.

## Telegram Flow (via ZOE)

**Agent → ZOE → Zaal (informational, no approval needed):**

```
[VAULT] Daily summary:
  Bought 4.2B ZABAL ($3.50) across 2 trades
  Burned 42M ZABAL
  Staked: skipped (3 days until next)
  Bought post: "COC Concertz #5 Recap" on Paragraph
  Gifted to: @josephgoats (rotation #7)
  
  Budget: $6.50 / $10.00 remaining today
```

**Zaal → ZOE → Agent (content creation, approval needed):**

```
Zaal: "hey write a recap for last night's show"
ZOE: dispatches to BANKER
BANKER: generates draft via Claude API
BANKER → ZOE → Zaal: sends draft on Telegram
Zaal: "approve" or "rewrite: more energy"
ZOE: dispatches approval/rewrite to BANKER
BANKER: publishes to Paragraph (on approve)
```

## Content Amplification (auto-detect)

```
Zaal publishes newsletter on Paragraph
  → Agent detects new post (checks Paragraph API each cron run)
  → Agent buys post coin (first buyer)
  → Agent reformats for X, Bluesky, Telegram, Discord
  → Agent cross-posts to all platforms
  → Agent gifts post coin to next in rotation
  → No human intervention needed
```

## Security

- Privy TEE wallets (keys never exposed)
- Daily budget cap enforced in code (can't spend more than daily_budget_usd)
- Signal score threshold prevents panic trading
- 1% burn is hardcoded (can't be turned off without code change)
- Gift rotation is deterministic (no favoritism)
- All actions logged to Supabase (auditable)

## Files to Build/Change

| File | Change |
|------|--------|
| New: `src/lib/agents/signals.ts` | 5-signal evaluation engine |
| New: `src/lib/agents/gift.ts` | Gift rotation logic |
| New: `src/lib/agents/content-buyer.ts` | Paragraph post coin buying |
| Modify: `src/lib/agents/vault.ts` | Replace schedule with signals + content buying + gifting |
| Modify: `src/lib/agents/banker.ts` | Same |
| Modify: `src/lib/agents/dealer.ts` | Same |
| Modify: `src/lib/agents/types.ts` | Add new config fields |
| Modify: `scripts/seed-agent-config.sql` | Add new columns |
| New: `src/app/api/cron/agents/refresh-rotation/route.ts` | Weekly cron to refresh gift list |

## What Success Looks Like

After 1 week:
- 3 agents making 1-3 trades per day (when conditions are good)
- DexScreener shows daily ZABAL volume > $5
- ZABAL burned: 100M+ tokens
- Content bought: 5-10 Paragraph posts
- Gifts given: 5-10 community members received free content
- Farcaster /zao channel has daily agent activity posts
- You spent $70 total and the ecosystem is visibly alive

## Research Docs Referenced

| Doc | What |
|-----|------|
| 345 | Master blueprint |
| 349 | Staking contract + Mini App |
| 351 | Activation checklist |
| 352 | Paragraph + x402 implementation |
| 353 | Signal-based autonomous trading |
