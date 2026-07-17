---
topic: farcaster
type: design
status: research-complete
last-validated: 2026-07-16
related-docs: 1132, 1098, 1097
original-query: "Design a 25/25/50 reward-split configuration for a Boostr × Sparkz campaign, including mechanics, guardrails mapping, example config, and open decisions for Zaal."
tier: STANDARD
---

# 1141 - Boostr × Sparkz Campaign Config: 25/25/50 Reward Split Design

> **Goal:** Define a concrete, reusable 25/25/50 reward-split configuration for campaigns run on Boostr that drive Sparkz energy validation. Map guardrails, mechanics, and first-campaign pathway.

## Executive Summary

This doc designs a three-way reward split for Boostr×Sparkz campaigns:
- **25% to the booster** (the user who liked/recast — rewards the energy/signal)
- **25% to the builder** (creator of the cast being amplified — rewards the work)
- **50% to the ZABAL/Sparkz shared pool** (leaderboard prizes, matching, small-builder inclusion, treasury — maintains crew framing, prevents pay-for-likes pyramid)

The 25/25/50 split is positioned as a **PROPOSAL** (see Decisions section for alternatives). The configuration ties directly to doc-1132 guardrails (participation cap, disclosure, small-builder inclusion, anti-astroturf checks) and doc-1098's energy-first Sparkz thesis.

## What This Doc Covers

1. **The three buckets** — justified assignment + alternatives
2. **Campaign mechanics** — how campaigns are configured (duration, pool, per-action cap, eligibility)
3. **Guardrail wiring** — mapping each doc-1132 guardrail to a config knob
4. **Example configuration** — labeled JSON structure for illustration
5. **Minimal path to first campaign** — smallest design steps before Zaal decides on spend/deploy
6. **Open decisions** — bucket assignment, pool funding, accounting model, config home

---

## Part 1: The 25/25/50 Bucket Assignment (Proposal)

### Proposed Split

| Bucket | Percentage | Recipient | Purpose |
|--------|-----------|-----------|---------|
| **Booster Reward** | 25% | User who gave the like/recast | Direct energy-score signal; rewards participation + crew membership |
| **Builder Reward** | 25% | Creator of the boosted cast | Rewards the work being amplified; ties to Sparkz energy-first (work + amplification = score) |
| **Shared Pool** | 50% | ZABAL/Sparkz treasury/matching | Leaderboard prizes, matches small builders, inclusion mechanics, anti-astroturf checks, crew framing |

### Rationale

**Energy-first alignment:** Doc-1098 positions Sparkz as tokenless-first with energy validation before coin launch. The 25/25/50 split embeds energy scoring directly:
- **Booster (25%):** Measures *who showed up and participated*. Participation cost (earning USDC, opting in) signals intention.
- **Builder (25%):** Measures *whose work got amplified*. This is doc-1132's insight: "rank by participation, not follower count." A creator whose cast earned 25 likes earns both from Boostr (per-like payout) AND from the shared pool (eligibility for prizes/matches).
- **Shared Pool (50%):** Sustains the *crew framing* (doc-1132 "crew support, not growth hack"). The pool funds:
  - **Leaderboard prizes** (e.g., top-5 booster = USDC bonus; top-3 builder = early Sparkz access)
  - **Small-builder inclusion matches** (e.g., if a builder with <500 followers gets boosted, shared pool covers 50% of their reward to level the field)
  - **Quality-signal layer** (paired Neynar score + follower growth checks, as guardrail #4 in doc-1132)
  - **Crew treasury** (reserves to fund future campaigns, sustain Zooster leaderboard)

### Why This Split Prevents Astroturf

Doc-1132 named three failure modes. The 25/25/50 addresses them:

1. **Clawdchat incident (pooled USDC, transactional collapse):** The shared pool is *transparent* (not hidden fees), and it funds *crew-visible* benefits (leaderboard, inclusion mechanics, promo). Participants see "50% of campaign rewards go to leaderboard prizes and small-builder support," not "platform keeps a margin."

2. **Pay-to-win slide:** A creator can't just spend USDC and expect coin launch. The 25% builder reward is *scaled by energy signals* (see Guardrail Wiring, below). A whale creator with 100K followers but zero actual engagement gets boosted by Boostr but does NOT get the builder reward multiplier. The shared pool's inclusion mechanics favor *new builders with growing follower-intent*.

3. **Signal collapse (every post gets 25 likes, loses credibility):** The campaign is *time-bound* and *pool-bound*. Once the shared-pool budget is spent or the campaign ends, the automatic boost ends. Zooster leaderboard is transparent about "this is active Sept 1-15" or "this is a $5K campaign." Scarcity = credibility.

### Alternatives Considered

| Alternative | Split | Notes | Trade-off |
|-------------|-------|-------|-----------|
| **Proposed (above)** | 25/25/50 | Crew framing, energy-scoring. | Requires shared-pool governance; needs leaderboard/inclusion UX. |
| **Creator-heavy** | 10/60/30 | Rewards builders most (Sparkz is about creator growth). | May feel like platform favors builders; boosters feel under-rewarded; weaker crew framing. |
| **Booster-heavy** | 50/25/25 | Rewards participation most (incentivize max joiners). | Undermines builder energy signal; risk of pure engagement-farming; hard to scale sustainably (50% payout burn). |
| **No shared pool** | 40/40/20 | Minimal platform overhead, max direct payout. | Loses leaderboard prizes, inclusion mechanics, quality-signal layer; reverts to pay-per-like. |
| **Symmetric** | 33/33/33 | Simplicity; three equal signals. | Loses crew framing; doesn't scale inclusion; 33% platform take feels opaque compared to 50% *named shared pool*. |

**Recommendation:** Use 25/25/50 as the default. If Zaal wants to experiment with Creator-heavy (10/60/30) to prioritize builder growth early, the mechanics below still apply — just adjust the pool percentages in the config.

---

## Part 2: Campaign Mechanics

### Campaign Lifecycle

A campaign is a **bounded, transparent engagement event** that drives Sparkz energy scoring. Structure:

```
Campaign Lifecycle:
├─ Config phase (Zaal sets params)
├─ Live phase (users boost, earn, pool drains)
├─ Close phase (leaderboard locked, prizes paid, analysis saved)
└─ Wrap phase (publish results, plan Phase 2)
```

### Configuration Model

A campaign is defined by:

```json
{
  "campaign": {
    "id": "boostr-sparkz-001",
    "name": "Boostr × Sparkz: ZABAL Builder Energy Trial",
    "status": "draft|live|closed|archived",
    
    // Bounds
    "start_date": "2026-08-01T00:00:00Z",
    "end_date": "2026-08-15T23:59:59Z",
    "total_pool_usd": 5000,
    "per_cast_reward_cap": null,
    "per_booster_daily_cap": 100,
    
    // Reward split
    "reward_split": {
      "booster_pct": 25,
      "builder_pct": 25,
      "shared_pool_pct": 50
    },
    
    // Eligibility
    "eligibility": {
      "booster_min_followers": 0,
      "booster_account_age_days": 30,
      "builder_min_followers": 0,
      "builder_channel_allowlist": ["zabal", "thezao"],
      "builder_fid_blocklist": []
    },
    
    // Energy scoring (leaderboard)
    "leaderboard": {
      "metric": "boosts_count|energy_score",
      "include_neynar_score": true,
      "neynar_score_weight": 0.2,
      "include_follower_growth": true,
      "growth_window_days": 7
    },
    
    // Shared pool allocations
    "shared_pool": {
      "leaderboard_prizes_pct": 40,
      "small_builder_matching_pct": 30,
      "quality_signal_checks_pct": 20,
      "crew_treasury_pct": 10
    },
    
    // Accounting
    "accounting": {
      "frequency": "per-action|daily-settlement|campaign-end",
      "source_of_truth": "boostr_api|zaoos_db",
      "manual_approval_required": false
    },
    
    // Transparency
    "public": true,
    "promo_text": "ZABAL crew boosts builder casts via Boostr. You earn USDC + leaderboard entry. 25% to boosters, 25% to builders, 50% to crew prizes & matching.",
    "disclosure_url": "zaoos.com/research/1141"
  }
}
```

### Field Explanations

**Bounds:**
- `total_pool_usd`: Campaign budget (e.g., $5K = ~500 likes at $10/like on Boostr).
- `per_booster_daily_cap`: Max USDC a single booster can earn per day (e.g., $100/day prevents single whale from capturing all rewards).
- `per_cast_reward_cap`: If set, a single cast's total reward (all three buckets) is capped (e.g., $50 max per cast). Prevents outlier engagement from draining pool.

**Eligibility:**
- `booster_min_followers`: Gate participation by follower count (e.g., 100+ to reduce sybil). Default: 0 (open to all).
- `booster_account_age_days`: Account must be this old to participate (e.g., 30 days). Default: 30 (moderate sybil check).
- `builder_channel_allowlist`: Only casts in these channels count (e.g., ["zabal", "thezao"]). Empty = all channels.
- `builder_fid_blocklist`: Exclude specific builders (e.g., known astroturf accounts). Empty = no blocklist.

**Leaderboard:**
- `metric`: Track boosters by count or energy-score (which includes booster participation + builder engagement).
- `include_neynar_score`: If true, blend Neynar user score (0-1) into the metric (guardrail #4).
- `include_follower_growth`: If true, penalize low-growth accounts; reward high-growth (quality signal).

**Shared Pool Allocations:**
- `leaderboard_prizes_pct` (40%): Top-5 booster + top-3 builder bonuses.
- `small_builder_matching_pct` (30%): If a builder has <500 followers, shared pool covers 50% of their builder reward.
- `quality_signal_checks_pct` (20%): Reserved for Neynar score checks + follower growth validation.
- `crew_treasury_pct` (10%): Accumulates for future campaigns + Zooster maintenance.

**Accounting:**
- `frequency`: When rewards are calculated and paid.
  - `per-action`: Every like/recast is instantly calculated and queued for payout (real-time, highest cost).
  - `daily-settlement`: Once per day at UTC midnight, all actions from the prior day are totaled and paid (simpler, lower cost).
  - `campaign-end`: All actions are summed at campaign close, then paid in bulk (lowest cost, highest batch size, delays earning).
- `source_of_truth`: Whether to read event data from Boostr API (authoritative, live) or cache in ZAOOS DB (offline, batch-safe).

---

## Part 3: Guardrail Wiring (Doc-1132 Mapping)

Doc-1132 defined four guardrails. Here's how the 25/25/50 config implements them:

| Guardrail | Doc-1132 Statement | Config Implementation | Config Knob |
|-----------|-------------------|----------------------|-------------|
| **1. Disclosure** | "Every leaderboard post / promo says this is opt-in, users earn USDC via Boostr." | Campaign sets `public: true` and `promo_text` (above). Config must include link to this doc (1141) in promo. Boosts are tagged "via Boostr, opt-in." | `public`, `promo_text`, `disclosure_url` |
| **2. Growth cap** | "Soft cap of 50 contributors. When hit 50, default changes to apply+approve." | Config tracks booster count; triggers alert at 45 contributors. Zaal/Iman manually gate entry above 50. | `max_booster_count`, `approval_gate` (future) |
| **3. Signal decay** | "After a builder earns a coin via Sparkz, they leave leaderboard. They graduated." | Leaderboard view filters out FIDs in `builder_fid_blocklist` (auto-populated after coin launch). Campaign config can mark status: `graduated|active`. | `leaderboard_filter`, `builder_fid_blocklist` |
| **4. Quality signal** | "Pair Boostr metric with Neynar score + follower growth. Show that boosted builders are actually building." | Config enables `include_neynar_score`, `include_follower_growth`. Leaderboard displays triple metric: (boosts_count, neynar_score, week_follower_delta). Shared pool reserves 20% for validation checks. | `leaderboard.include_neynar_score`, `.include_follower_growth`, `shared_pool.quality_signal_checks_pct` |

### Guardrail Enforcement Checklist

Before a campaign goes live, audit:

- [ ] `promo_text` includes the phrase "Boostr opt-in USDC earn" and links to doc-1141.
- [ ] `builder_channel_allowlist` is non-empty and reviewed (prevents arbitrary channels).
- [ ] `booster_account_age_days >= 30` (sybil baseline).
- [ ] `leaderboard.include_neynar_score` is `true` OR `include_follower_growth` is `true` (quality signal required).
- [ ] `shared_pool.leaderboard_prizes_pct + .small_builder_matching_pct >= 60%` (crew framing holds).
- [ ] `max_booster_count <= 50` (cap is set).

---

## Part 4: Example Configuration (Illustration)

Here's a concrete example for **"Boostr × Sparkz: ZABAL Builder Energy Trial"** (first campaign):

```json
{
  "campaign": {
    "id": "boostr-sparkz-001-aug2026",
    "name": "Boostr × Sparkz: ZABAL Builder Energy Trial",
    "description": "Two-week pilot: ZABAL crew boosts builder casts on Boostr, earning USDC. Transparent 25/25/50 split drives Sparkz energy scoring before Phase 2 token launch.",
    "status": "draft",
    
    "start_date": "2026-08-01T00:00:00Z",
    "end_date": "2026-08-15T23:59:59Z",
    "total_pool_usd": 5000,
    "per_cast_reward_cap": 50,
    "per_booster_daily_cap": 100,
    
    "reward_split": {
      "booster_pct": 25,
      "builder_pct": 25,
      "shared_pool_pct": 50
    },
    
    "eligibility": {
      "booster_min_followers": 0,
      "booster_account_age_days": 30,
      "builder_min_followers": 0,
      "builder_channel_allowlist": ["zabal", "thezao"],
      "builder_fid_blocklist": []
    },
    
    "leaderboard": {
      "metric": "energy_score",
      "include_neynar_score": true,
      "neynar_score_weight": 0.2,
      "include_follower_growth": true,
      "growth_window_days": 7
    },
    
    "shared_pool": {
      "leaderboard_prizes_pct": 40,
      "small_builder_matching_pct": 30,
      "quality_signal_checks_pct": 20,
      "crew_treasury_pct": 10,
      "breakdown": {
        "leaderboard_prizes_usd": 1000,
        "small_builder_matching_usd": 750,
        "quality_signal_checks_usd": 500,
        "crew_treasury_usd": 250
      }
    },
    
    "accounting": {
      "frequency": "daily-settlement",
      "source_of_truth": "boostr_api_with_zaoos_cache",
      "manual_approval_required": false,
      "settlement_time": "2026-08-16T12:00:00Z"
    },
    
    "public": true,
    "promo_text": "ZABAL crew boosts builder casts via Boostr (Aug 1-15). You opt-in, boost, and earn USDC. 25% to you, 25% to the builder, 50% to crew leaderboard prizes + small-builder matching. No platform fee. Transparent crew support. Join at [link]. Mechanism: [research/1141].",
    "disclosure_url": "zaoos.com/research/1141"
  }
}
```

**Arithmetic check:**
- Total pool: $5,000
- Booster reward (25% of total): $1,250
- Builder reward (25% of total): $1,250
- Shared pool (50% of total): $2,500
  - Leaderboard prizes (40% of pool): $1,000
  - Small-builder matching (30% of pool): $750
  - Quality checks (20% of pool): $500
  - Crew treasury (10% of pool): $250

---

## Part 5: Minimal Path to First Campaign

**Design-only steps (this doc):**
1. Define 25/25/50 split + rationale ✓
2. Map guardrails to config knobs ✓
3. Provide example config ✓

**Pre-launch steps (Zaal decision):**
1. **Fund & pool source:** Where does the $5K come from? (ZABAL treasury, Zaal personal, grant, sponsor).
2. **Boostr integration:** Confirm Cashlessman's API returns daily stats on boosted casts + earnings. Verify webhook for real-time update.
3. **Leaderboard UX:** Build or design the Zooster leaderboard HTML (see doc-1132 next-actions for shipping HTML).
4. **Payout mechanics:** Implement reward calculation (per-action or daily-settlement), then queue payouts to user wallets on Arbitrum.
5. **Promo & disclosure:** Write cast promo (see doc-1132 drafts) + link to this doc.

**Launch steps (Zaal-gated, on-chain/spend):**
1. Set `status: live` on the config.
2. Fund the campaign pool contract with $5K USDC on Arbitrum.
3. Publish promo casts + leaderboard link.
4. Monitor Zooster leaderboard daily.
5. At campaign end (Aug 15), settle earnings + pay out wallets.
6. Publish wrap-up post ("here's who earned, here's what we learned").

**Phase 2 (post-campaign):**
- Analyze energy signals (which boosters stayed consistent? which builders actually grew followers?).
- Feed results into Sparkz energy-score engine (doc-1098 Phase 2).
- Decide which builders are "ready to launch" a Sparkz coin.

---

## Part 6: Open Decisions for Zaal

These decisions are explicitly **unresolved** and need Zaal approval before first campaign ships:

| Decision | Options | Notes |
|----------|---------|-------|
| **Bucket assignment** | Use 25/25/50 (proposed) OR Creator-heavy 10/60/30 OR Booster-heavy 50/25/25 OR alternative. | See Part 1 Alternatives. 25/25/50 is the default; justify if you choose different. |
| **Pool funding source** | ZABAL treasury / Zaal personal / grant / sponsor / ZAO treasury. | $5K is a placeholder; could be $1K pilot or $10K scaled. |
| **Shared pool governance** | Who decides how the 50% (leaderboard prizes, matching, quality checks) is allocated? Zaal solo / Zaal+Iman / open voting. | Affects transparency + crew framing. |
| **Pool mechanics** | Is the shared pool *disclosed explicitly* (cast promo says "50% funds leaderboard prizes") OR *opaque* (cast says "platform keeps 50%")? | Transparent = higher crew buy-in; opaque = simplifies accounting. Doc-1132 recommends transparent. |
| **Accounting frequency** | Per-action (real-time) / daily-settlement (once/day) / campaign-end (bulk). | Real-time is best UX but highest infra cost. Campaign-end is lowest cost but delays earning. Daily is the middle ground. |
| **Config storage** | Where does the campaign config JSON live? (ZAOOS repo research/farcaster/1141/ / ZAOOS DB / Supabase / Boostr API). | For first campaign, hardcoding in repo is fine. For scaling, move to DB. |
| **Multiple campaigns** | Can we run overlapping campaigns (e.g., Aug 1-15 AND Aug 10-20)? | No: would split the pool + confuse leaderboard. One campaign at a time, minimum 48h gap between campaigns. |
| **Token launch trigger** | After this campaign, what energy score = "ready to launch a Sparkz coin"? (60/100? 70/100? Zaal gut call?). | Doc-1098 left this open. Use campaign data to backfill. |

---

## Part 7: Why This Design Matters (Connection to Sparkz Vision)

Doc-1098 positioning: **Sparkz is energy-first + AI-judged launch timing.**

This campaign config operationalizes that:

1. **Tokenless validation:** Campaigns run on real USDC earn (not fake tokens) for 2+ weeks. Proves the energy is real.

2. **Energy scoring:** The 25/25/50 split embeds energy *directly* — participation (booster reward), work amplification (builder reward), and crew sustainability (shared pool). The leaderboard measures this transparently.

3. **AI launch gate** (future): Once we have 3+ campaigns' data, the Sparkz engine can say "Zaal's energy_score = 78/100, ready to launch." That confidence comes from *transparent, auditable participation* in these campaigns.

4. **Astroturf prevention:** By design, you can't game it with money alone. The shared pool's quality signal (Neynar score, follower growth) ensures that boosted creators are *actually building*, not just buying likes.

5. **Crew framing over pyramid:** The 50% shared pool is the innovation. It says "50% of campaign rewards go back to the crew," not "platform keeps a margin." This is what makes it anti-astroturf compared to Clawdchat or a pure pay-per-like marketplace.

---

## Part 7: Pilot ZERO - the on-chain 0xSplits recipient config + dynamic leaderboard reallocation

> Added 2026-07-17 for the `boostr-sparkz-campaign` board task: "split 25% Zaal wallet / 25% cashlessman wallet / 50% to the leaderboard people (currently Zaal + cashlessman). Prep the 0xSplits config + how leaderboard-share updates as the board grows." **Design-only - nothing deploys without Zaal, and the exact split awaits the m-boostr confirmation.**

### Two different 25/25/50s - do not confuse them

- **The reward model** (Parts 1-4 above): how *campaign participants* earn - 25% booster / 25% builder / 50% shared pool. This governs payouts to the people who boost and build.
- **Pilot ZERO's revenue split** (this Part): where the *pilot's own proceeds/fees* route on-chain, via one 0xSplits contract - 25% Zaal / 25% cashlessman / 50% to the current leaderboard members. This is the "founders + the crew that showed up" split for the very first live run.

They are two layers of the same campaign; this Part specifies only the second (the on-chain contract), which the board task asks for and which Parts 1-6 do not cover.

### The recipient config

One 0xSplits v2 contract on the campaign's chain (Boostr settles USDC on Arbitrum - confirm the Split lives on the same chain as settlement). Wallets are placeholders here; the real addresses are filled at deploy time (gated), never invented in this doc:

| Recipient | Share | Notes |
|-----------|-------|-------|
| `<ZAAL_WALLET>` | 25% (fixed) | founder |
| `<CASHLESSMAN_WALLET>` | 25% (fixed) | Boostr operator / co-founder |
| Leaderboard pool | 50% | sub-divided among the *current* leaderboard members (see below) |

### How the 50% leaderboard bucket sub-divides (the dynamic part)

0xSplits has no notion of "a bucket" - every recipient is a flat address+percentage row summing to 100. So the 50% is *materialized* into per-member rows at config time:

- **N leaderboard members** -> each gets `50 / N` percent, then those rows are concatenated with the two fixed 25% rows.
- **Today (N = 2, Zaal + cashlessman):** the 50% splits 25/25, so the flattened Split is Zaal `25 + 25 = 50%`, cashlessman `25 + 25 = 50%`. (Decision D1 below: whether founders who are *also* on the leaderboard double-dip or are excluded from the 50% bucket.)
- **As the board grows (N = 5):** each leaderboard member gets `50 / 5 = 10%`; the flattened Split becomes Zaal 25 + share, cashlessman 25 + share, plus the three new members at 10% each. Precision: 0xSplits v2 allows up to 4 decimals, so `50 / 3 = 16.6667%` is representable; assign the rounding remainder deterministically to row 1 so the rows always sum to exactly 100.
- **Equal vs energy-weighted:** equal (`50/N`) is the simple default. The Sparkz-aligned option is to weight the 50% by each member's `energy_score` (the same leaderboard metric defined in Part 2), so the crew that generated the most energy earns proportionally more. Recommend shipping equal for pilot ZERO (legible, uncontroversial) and moving to energy-weighted once the leaderboard has real spread.

### Updating on-chain as the board grows

This is exactly the mutable-controller mechanic from the [Sparkz Music Collabs draft](../../../papers/drafts/sparkz-music-collabs.md) - a growing recipient set requires a **mutable** Split:

- Deploy the Split with a **controller** (NOT the zero address, which would make it immutable). Controller = Zaal's wallet or a ZAO-operated multisig.
- On each **reallocation trigger** (recommend: once per settlement period, aligned to the campaign's `daily-settlement` / weekly cadence in Part 2), recompute the flattened recipient list from the current leaderboard and, if it changed, the controller updates the Split - no redeploy, no new token, the same contract address keeps receiving.
- Between updates the Split is static; membership changes take effect at the next scheduled update, not instantly - which is the desired behavior (a stable per-period payout, not a per-block churn).

### Guardrails specific to this split

- **Every recipient must have a resolvable wallet** before an update; a leaderboard member with no wallet is held out of that period's Split (surfaced, not silently dropped), same rule as the collab draft.
- **Min share floor:** as N grows, `50/N` shrinks; below a floor (e.g. a member's slice < 0.5%) either cap N per period (top-K leaderboard members share the 50%) or raise the floor - decide before dust-sized rows appear. Cap-to-top-K is the cleaner answer and reinforces "leaderboard = the crew that showed up most."
- **Double-dip decision (D1):** Zaal and cashlessman are both fixed 25% recipients AND currently the entire leaderboard. Decide whether founders are *excluded* from the 50% bucket (so the 50% only ever rewards non-founder crew) or *included* (they double-dip until others climb the board). Excluding founders from the 50% is the more defensible "crew framing" choice and avoids the optics of founders taking 100% at N = 2.

### Open decisions for Zaal (this Part)

1. **Confirm the split** via the m-boostr TG question (per the board task) - is it 25/25/50, and does the 50% exclude the two founders?
2. **Chain** - same chain as Boostr USDC settlement (Arbitrum) for the Split?
3. **Controller** - Zaal's wallet or a ZAO multisig (the multisig is safer; a lost controller key freezes future reallocations)?
4. **Weighting + cap** - equal `50/N` with a top-K cap for pilot ZERO, energy-weighted later?
5. **Reallocation cadence** - per settlement period (recommended) vs on-demand.

Nothing here deploys, funds, or moves on-chain value; those remain Zaal's hand.

---

## Sources

- [Doc 1132 - Zooster: Boostr/ZABAL Auto-Like Leaderboard](../1132-zooster-boostr-zabal-leaderboard/) [FULL] - guardrails, promo drafts, Clawdchat incident, 31-contributor live data
- [Doc 1098 - Sparkz Master Brief](../../../business/1098-sparkz-master-brief/) [FULL] - tokenless-energy-first sequencing, AI launch-timing thesis, MVP definition
- [Doc 1097 - Sparkz Competitive Landscape](../../../business/1097-sparkz-competitive-landscape/) [FULL] - why energy-first gates volume for sustainability
- [Boostr homepage](https://boostr.itscashless.com) [FULL] - marketplace mechanics, USDC on Arbitrum
- [Boostr /api/zabaal/stats](https://boostr.itscashless.com/api/zabaal/stats) [FULL] - live ZABAL Auto-Like data feed

## Also See

- [Doc 1132 - Zooster Leaderboard](../1132-zooster-boostr-zabal-leaderboard/) - The proof-of-concept this campaign drives
- [Doc 1098 - Sparkz Master Brief](../../../business/1098-sparkz-master-brief/) - The broader Sparkz thesis
- [Doc 1097 - Sparkz Competitive Landscape](../../../business/1097-sparkz-competitive-landscape/) - Why this design wins vs Clanker/Zora
