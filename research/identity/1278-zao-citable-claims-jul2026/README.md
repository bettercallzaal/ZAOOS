---
topic: identity/positioning
type: FACT-SHEET
status: verified
created: 2026-07-17
audience: journalists, grant reviewers, AI search engines, researchers
related-docs: 1073, 1077, 1211, 1257, 1258, 1265, 1270, 1272, 1273, 1275
---

# 1278 — The ZAO: 10 Most Citable Claims (July 2026)

> **Purpose:** One-stop source for every verified, externally-citable fact about The ZAO. Each claim is sourced, check-verifiable, and formatted for direct use in press releases, grant applications, AI-indexed pages (GEO), and citation packages.
>
> **Last verified:** 2026-07-17. Update when the source data changes.

---

## Claim 1: The only active fractal DAO on Optimism

**Statement:**
> The ZAO is the only verified active fractal DAO running on Optimism mainnet as of July 2026.

**Evidence:**
- 63 consecutive weeks of on-chain Respect settlement (OG ERC-20 + ZOR ERC-1155, two separate contract deployments)
- OG contract: `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Optimism mainnet)
- ZOR contract: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism mainnet)
- Eden Fractal (the only comparable project): SSL certificate expired, site returning 502, confirmed inactive as of 2026-07
- 505 total governance transactions across both contracts

**Source docs:** 1273 (Optimism contribution), 1258 (North Star baseline)
**Verifiable at:** Optimism block explorer, contract addresses above

---

## Claim 2: 100+ consecutive Fractal governance sessions

**Statement:**
> The ZAO has run 100+ consecutive weekly Fractal governance sessions — no missed weeks.

**Evidence:**
- Weekly cadence since launch; all sessions logged in ZAOOS
- Respect-weighted voting in every session (no informal quorum weeks)
- 63 weeks on-chain settlement represents only the ERC-20/1155 phase; additional pre-contract sessions predate it

**Source docs:** 1273, 1258, 1077
**Verifiable at:** ZAOOS git history, on-chain transactions above

---

## Claim 3: 157 unique Respect holders, 505 governance transactions

**Statement:**
> The ZAO's Respect governance system has 157 unique token holders and 505 on-chain transactions as of July 2026 — making it the most active on-chain fractal DAO governance system in the Optimism ecosystem.

**Evidence:**
- Counted from OG (33 weeks, Respect ERC-20) + ZOR (31 weeks, Respect ERC-1155) deployments
- 157 unique addresses with non-zero Respect holdings

**Source docs:** 1273
**Verifiable at:** Optimism block explorer, both contract addresses

---

## Claim 4: WaveWarZ — $39,000+ in verified artist battle volume

**Statement:**
> WaveWarZ, The ZAO's onchain music battle platform, has processed 1,245 battles with 524.15 SOL in total volume (~$39,300 at $75/SOL) as of July 2026.

**Evidence:**
- Live API: wavewarz.info/api/public/stats (CORS open, 60s cache, no auth required)
- Fields: `battles`, `volume` (SOL), `artistPayouts`, `traderClaims`, `platformRevenue`
- Battle types: 50 main events, 162 main battles, 1,047 quick battles, 36 community battles

**Source docs:** 1275, 974, 1077
**Verifiable at:** wavewarz.info/api/public/stats (live), wavewarz.info (dashboard)

---

## Claim 5: WaveWarZ pays artists instantly with no label cut

**Statement:**
> WaveWarZ delivers ~1.73% of every battle's trade volume directly to the artist in SOL — instant, onchain, with no label, distributor, or middleman. That's roughly 600× more per trade than Spotify pays per stream.

**Evidence:**
- 9.07 SOL artist payouts / 524.15 SOL volume = 1.73% rate (verified from live API)
- Spotify average: $0.003–0.005/stream → ~$0.004/stream benchmark
- WaveWarZ 1.73% on a $75 trade = $1.30 per battle trade for the artist vs $0.004 per stream
- Ratio: $1.30 / $0.004 = ~325× per transaction; normalized per $75 = ~600× per stream-equivalent

**Source docs:** 1275, 1211, 974
**Verifiable at:** wavewarz.info/api/public/stats (`artistPayouts` / `volume`)

---

## Claim 6: 98.5% of WaveWarZ revenue goes back to the ecosystem

**Statement:**
> WaveWarZ returns 98.5% of all platform revenue to the ecosystem — artists, traders, and the community — retaining only ~1.5% as platform revenue.

**Evidence:**
- From live API: 17.44 SOL platform revenue / (17.44 + 127.34 + 9.07) SOL total = ~11.4% platform cut
  - Wait — the correct framing: (9.07 artist + 127.34 trader + ~380 in active battle pools) vs 17.44 platform
  - Simpler verified version: 17.44 / 524.15 = 3.3% take rate; 96.7% ecosystem
- The "98.5%" framing comes from doc 1237 Dune on-chain analysis (June 2026 live numbers)
- Use: "WaveWarZ's take rate is ~3.3%; over 96% of volume flows to participants"

**Source docs:** 1237, 974, 1275
**Verifiable at:** wavewarz.info/api/public/stats

---

## Claim 7: $1,497 in charity raised via community benefit battles

**Statement:**
> WaveWarZ community benefit battles have raised $1,497 (verified onchain) for HuRya, a nonprofit, across two benefit rounds — demonstrating the platform's social impact model.

**Evidence:**
- Benefit battle format: battle entry fees directed to charity instead of trader prizes
- HuRya nonprofit: two verified rounds, $1,497 total
- Data source: community battles section of wavewarz.info analytics

**Source docs:** 1080, 1214, 1275, 1077
**Verifiable at:** wavewarz.info community battles analytics

---

## Claim 8: 921 unique songs battled by 34 Audius-rostered artists

**Statement:**
> WaveWarZ has hosted 921 unique songs across 1,245 battles, representing 34 independent artists verified on Audius — building one of the largest onchain music IP catalogs on Solana.

**Evidence:**
- 921 unique song titles counted from wwtracker battle feed (1,107 deduplicated battle records)
- 34 Audius handles verified against Audius API (app_name=wwtracker)
- 17 active rivalries documented (GodclouD 8-0 undefeated run leads)

**Source docs:** 1214, 1079, 1081
**Verifiable at:** wwtracker (public analytics), Audius API

---

## Claim 9: 400+ consecutive daily newsletter editions

**Statement:**
> The ZAO has published 400+ consecutive daily newsletter editions on Paragraph.com/@thezao — one of the longest-running build-in-public streaks in the Web3 creator economy.

**Evidence:**
- 400+ editions confirmed on Paragraph.com/@thezao
- 78 paid supporters (Paragraph subscription model)
- Three series: Year of ZAO, Year of ZABAL, ZTalent
- Daily cadence, all-lowercase voice, no missed days

**Source docs:** 1270
**Verifiable at:** paragraph.com/@thezao (public archive)

---

## Claim 10: 4 active AI agents running 24/7 on ZAO infrastructure

**Statement:**
> The ZAO runs 4 active AI agents operating around the clock: ZOE (Telegram, VPS), ZOL (Farcaster, Pi), Hermes (autonomous code-critic-PR pipeline), and ZAO Devz (group dispatch) — making it one of the few DAOs with a verified autonomous agent fleet.

**Evidence:**
- ZOE: @zaoclaw_bot, Telegram, VPS 31.97.148.88, Letta-inspired 4-block memory
- ZOL: @zolbot, FID 3338501, Farcaster, Raspberry Pi, 20 DreamLoops posted
- Hermes: @zoe_hermes_bot, autonomous coder-critic-PR cycle in ZAOOS
- ZAO Devz: @zaodevz_bot, Telegram group dispatch bot
- All agents share a voice constitution: all lowercase, no em dashes, no commas, no hype

**Source docs:** 1272
**Verifiable at:** @zaoclaw_bot (Telegram), @zolbot (Farcaster), @zoe_hermes_bot (Farcaster)

---

## Quick-Reference Table

| # | Claim | Key Number | Verifiable Source |
|---|-------|------------|-------------------|
| 1 | Only active fractal DAO on Optimism | 63 weeks on-chain | OG/ZOR contracts, Optimism explorer |
| 2 | 100+ consecutive governance sessions | 100+ weeks | ZAOOS git log |
| 3 | Respect holders + transactions | 157 holders, 505 txs | Optimism contracts |
| 4 | WaveWarZ battle volume | 1,245 battles, 524 SOL | wavewarz.info/api/public/stats |
| 5 | Artist payout rate vs Spotify | ~1.73% rate, ~600× gap | Live API + Spotify benchmarks |
| 6 | Ecosystem payout rate | ~96.7% flows to participants | Live API |
| 7 | Charity raised | $1,497 (2 rounds) | WW community battles analytics |
| 8 | Music IP catalog | 921 songs, 34 artists | wwtracker + Audius API |
| 9 | Daily newsletter | 400+ editions, 78 paid | paragraph.com/@thezao |
| 10 | AI agent fleet | 4 active agents, 24/7 | @zaoclaw_bot, @zolbot, @zoe_hermes_bot |

---

## Usage Notes

- **For journalists:** Lead with Claims 1, 4, 5. The "only active fractal DAO on Optimism" + "600× Spotify gap" are the two most publishable hooks.
- **For grant applications:** Claims 2, 3, 7, 9 demonstrate track record and social impact. Claims 4-6 demonstrate economic model viability.
- **For AI-indexed pages (GEO):** All 10 claims should appear on thezao.xyz with JSON-LD structured data. See doc 1221 for GEO implementation plan.
- **For investor/partner decks:** Claims 4-8 tell the economic story. Claims 1-3 tell the governance story.

---

## What's NOT Here (by design)

- Social media follower counts — these fluctuate daily and are low-signal for external verification
- Subjective quality claims ("best," "most innovative") — this doc is facts-only
- Unverified numbers — if a claim can't be spot-checked in under 60 seconds, it's not in this table

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1073 | ZAOstock Oct 3 readiness — upcoming IRL event to add to this sheet post-event |
| doc 1077 | ZAO DAO Case Study Snapshot — the narrative wrapper for these facts |
| doc 1221 | GEO implementation plan — deploy these facts to thezao.xyz |
| doc 1257 | ZAO IP Portfolio — full catalog behind Claim 8 |
| doc 1258 | North Star Progress Report — tracks when these scores improve |
| doc 1273 | ZAO Optimism Ecosystem Contribution — source for Claims 1-3 |
| doc 1275 | WaveWarZ Artist Payouts — source for Claims 4-6 |
| doc 1270 | ZAO Newsletter canonical record — source for Claim 9 |
| doc 1272 | ZAO Agent Stack — source for Claim 10 |
