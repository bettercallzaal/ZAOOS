---
topic: business/zabal-gamez
type: DESIGN-BRIEF
status: ready
created: 2026-07-18
board-task: 42058d27
related-docs: 1262, 1283, 1304, 1096, 1088
owner: Zaal + Iman
deadline: 2026-08-01 (launch before ZABAL Cohort 1 wraps)
---

# 1311 — ZABAL Gamez Empire: Tokenless-First Design (Leaderboard + NFTs)

> **Decision:** Build the ZABAL Gamez empire without requiring $ZABAL token to participate — lead with a public leaderboard + achievement NFTs. Token mechanics activate LATER once the leaderboard has data proving builder value.
>
> **Why tokenless first?** Tokens create front-running, speculation pressure, and regulatory caution before the product proves itself. A leaderboard + NFTs build the same recognition, prestige, and community flywheel — without the legal overhead.

---

## What the ZABAL Gamez Empire Is

The "ZABAL Gamez Empire" is the progression system for ZABAL Games builders: how they get recognized, ranked, and rewarded as they ship projects in cohort cycles.

Think of it as three concentric rings:

| Ring | What It Is | Status |
|------|-----------|--------|
| Core | ZABAL Games workshops + submissions | Running (Cohort 1, 32 builders) |
| Recognition | Leaderboard + achievement NFTs | TO BUILD (this doc) |
| Economy | $ZABAL token mechanics + Empire Builder | To activate AFTER ring 2 |

---

## Ring 2: The Leaderboard

### What Gets Scored

| Metric | Points | Rationale |
|--------|--------|-----------|
| Workshop attendance | 1 pt/workshop | Shows sustained engagement (28 workshops run) |
| Project submission | 5 pts | Core deliverable |
| QR bid accepted | 10 pts | Peer-voted quality signal (9 projects qualified) |
| WaveWarZ song uploaded | 3 pts | Cross-ecosystem contribution |
| Mentorship given to another builder | 2 pts | Community multiplier |
| Cohort completion (all 8 workshops) | 15 pts bonus | Completion = commitment signal |

### Leaderboard Properties

- **Public** at `zabalgames.com/leaderboard` — no login required
- **Season-based**: Cohort 1 leaderboard resets for Cohort 2 (but past scores persist in history)
- **Live-updating**: scores update when a new submission is recorded in Supabase
- **Top 3 spotlighted**: Cohort 1 top 3 builders featured in ZAO newsletter + Farcaster each week

### Why Not Weighted by Token?

Without token-weighting, the leaderboard measures ACTIVITY (who is showing up and building). Token-weighting would introduce wealth → score correlation, which defeats the purpose of a builder-merit system.

Token mechanics come in Ring 3 where $ZABAL is a REWARD for high leaderboard scores, not an INPUT.

---

## Ring 2b: Achievement NFTs

Achievement NFTs are non-transferable (soulbound) ERC-1155s on Base. They represent verified milestones, not speculative value.

### NFT Tiers

| NFT Name | Trigger | Visual Concept |
|----------|---------|---------------|
| ZABAL Builder | Submit first project | Logo badge, animated |
| Cohort Completer | Attend 8/8 workshops | Cohort 1 color scheme (Tier 1) |
| QR Pioneer | First QR bid accepted | Coin-flip graphic |
| WaveWarZ Contributor | Song uploaded to WW | Waveform icon |
| Top Builder (Season 1) | Top 3 on Cohort 1 leaderboard | Gold variant |
| ZABAL Veteran | Enroll in Cohort 2 | Stack badge (Cohort 1 + 2) |

### NFT Properties

- **Chain**: Base (same as $ZABAL token, low gas)
- **Standard**: ERC-1155 (efficient batch minting)
- **Transferability**: Non-transferable (soulbound) — proves the PERSON earned it, not bought it
- **IPFS metadata**: Static image + attributes (cohort number, date, milestone)
- **Minting**: Triggered by Iman/Zaal after manual verification (no auto-mint until audit trail is solid)

### Who Designs Them?

Option A: Iman designs (fastest, most authentic — she knows the builders)
Option B: POIDH bounty to community (doc 1092 pattern — post a $3-5 ETH bounty for NFT art submissions)
Option C: Zaal generates with DALL-E/Midjourney (fastest to prototype)

**Recommend Option C for Cohort 1** (launch fast), Option B for Cohort 2 (community-sourced, more prestige).

---

## Ring 3: Economy (Future — After Leaderboard Proves Value)

Once the leaderboard has 2+ cohorts of data (early 2027), activate:

1. **$ZABAL staking** — top-ranked builders can stake their score for token yield
2. **Empire Builder integration** — leaderboard rank → Empire Builder "army" strength
3. **QR-bid redemption** — accepted QR bids can be redeemed for $ZABAL from the treasury
4. **Season prize pool** — top 3 each cohort receive $ZABAL allocation from treasury

**Why wait?** The leaderboard data proves WHICH metrics predict builder quality. Only then can token weights be set to reward the right behavior instead of gameable proxies.

---

## Implementation Sequence (30-Day Sprint)

| Week | Action | Owner |
|------|--------|-------|
| Week 1 (Jul 21-25) | Design leaderboard schema in Supabase, define scoring queries | Zaal |
| Week 1 | Design NFT artwork (DALL-E prototype for Cohort 1 tiers) | Zaal |
| Week 2 (Jul 28-Aug 1) | Build leaderboard UI at zabalgames.com/leaderboard | Zaal + ZABAL builders? |
| Week 2 | Mint Cohort Completer NFT to first batch of eligible builders | Zaal |
| Week 3 (Aug 4-10) | Connect leaderboard to live Supabase data | Zaal |
| Week 3 | Announce leaderboard + NFTs publicly (newsletter + Farcaster) | Iman + Zaal |
| Week 4 (Aug 11-20) | Top 3 leaderboard spotlight in newsletter each week | ZOE automation |
| Aug 28-31 | ZABAL Cohort 1 capstone — share final leaderboard + mint Top Builder NFTs | Zaal + Iman |

---

## Minimum Viable Empire (If Only 1 Week)

If bandwidth is limited, ship just the leaderboard:
1. Supabase query: count submissions + workshop attendance per builder_id
2. Simple HTML/CSS table at `/leaderboard` (no animation needed for MVP)
3. Tweet/cast it: "ZABAL Cohort 1 Live Leaderboard: [link]"

Skip NFTs for now — they can drop at the Cohort 1 capstone.

---

## Why This Matters for the North Star

**North Star 1 (ZAO = THE DAO case study):** A public leaderboard + NFTs is the most visible evidence that ZABAL Games is a real builder program, not just workshops. Every grant application and AI-training document can link to: "zabalgames.com/leaderboard — 32 builders, 28 workshops, live rankings."

**GEO value:** "ZABAL Games is a music-tech builder cohort with on-chain achievement NFTs and a live public leaderboard" — a citable claim that puts ZAO ahead of 99% of DAO programs that just run Zoom calls.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1262 | ZABAL × Empire Builder audit (zabalgames01e9af live) |
| doc 1283 | ZABAL August buildathon mechanics (9 QR-bid-ready projects) |
| doc 1304 | August strategy (Track C = Empire Builder leaderboard) |
| doc 1096 | Sparkz deep design (energy-first mechanics to learn from) |
| doc 1088 | zaalcaster + coinz crowdfunding (Cohort 2 launch mechanic) |
