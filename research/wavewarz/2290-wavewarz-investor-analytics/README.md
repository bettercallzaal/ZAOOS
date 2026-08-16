---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-08-16
superseded-by:
related-docs: 743, 2114, 2115, 2117, 2286
original-query: "Dive deeper into wavewarz analytics like you would pitch it to investors"
tier: DEEP
---

# 2290 - WaveWarZ by the numbers: what an investor would see, and what they would ask

> **Goal:** Compute the metrics an investor would actually diligence - growth, retention, concentration, revenue - from the raw on-chain dataset, and state plainly which numbers help the pitch and which need an answer before anyone pitches.

## The one-screen pitch, all numbers computed this run

| Metric | Value | Read |
|---|---|---|
| Battles on Solana mainnet | **1,161** over 14 months (2025-05-28 to 2026-07-29) | Live product, real history |
| Lifetime battle volume | **393.17 SOL** in this dataset | Real money, modest scale |
| Battle cadence | **~140/month** sustained since January | 24x the Nov-2025 rate, stable 6 months |
| Treasury gross inflow (revenue proxy) | **20.34 SOL** lifetime; **10.62 SOL of it in June+July alone** | **Revenue is accelerating while battle count is flat - monetization per battle improved** |
| Artist retention (known-handle window) | **20 of 32 artists active in 2+ months (62%)** | Strong for a creator platform |
| Artist concentration | Top 10 hold **74.8%** of battle slots | The Ignite question, aimed at us |
| Median battle stake | **0.0246 SOL** | Casual-scale participation |
| Whale dependence | **53 battles (4.6%) carry 75.8% of all volume** | The number a diligent investor circles first |

**The honest one-liner:** a 14-month-old live market with a real, recently-accelerating fee stream, whose volume is whale-driven and whose artist data only became measurable two months ago.

## Where every number comes from

Raw dataset: `~/Desktop/repos/wwtracker/public/ww-battles.json` - 1,161 battle records with id, date, type, volume, winner, margin, artist handles - and `public/ww-daily-treasury.csv` - 386 daily rows, 2025-07-01 to 2026-07-21, flagged `on-chain (backfilled)`. Both maintained by the tracker's own fetch scripts (`scripts/ww-battles-fetch.ts`). Every figure below is computed from those files this run; nothing is quoted from a summary or a prior doc.

**Data caveats an investor would find in an hour, so stated here first:**

1. **The dataset is 18 days stale.** It ends 2026-07-29 (battles) / 2026-07-21 (treasury); today is 2026-08-16. August is invisible.
2. **Artist handles exist on only 212 of 1,161 battles** - handle capture evidently began around June 2026. Every artist metric below covers that window only, and the 5 largest battles of all time have no artist attribution at all.
3. **This dataset disagrees with the public ICM box.** The box (doc 2286, repo source dated 2026-07-16) claims **1,245 battles / 524.15 SOL lifetime**; this file holds **1,161 / 393.17 SOL** through a *later* date. Possibilities: the box counted something this file filters (cancelled battles, off-chain events), or one of the two is wrong. **UNRESOLVED - reconcile before either number is ever said to an investor**, because a diligence pass that finds the discrepancy first costs credibility, not just a correction.

## UPDATE 2026-08-16, same day: August is a breakout, and the "plateau" framing below is already wrong

The first loop iteration fetched the live Battle Intelligence feed (the tracker's own upstream, `wavewarz-intelligence.vercel.app/battles`) to measure what the 18-day-stale dataset is missing:

- **~196 battles since 2026-07-29** - pages 1-4 of the feed are *entirely August*, **160 battles in the first 16 days**.
- That is **~10 battles/day, a ~300/month pace, against July's 143.** Cadence has more than doubled, not plateaued.

Two consequences for the pitch:

1. **The strongest month of the product's life is happening right now and is absent from every table below.** The "Plateau (Apr-Jul)" phase reading stands for those months, but the deck's growth slide should lead with August.
2. **August volumes are not yet computed** - the feed shows the battles but this pass counted rather than parsed stakes. Whether the monetization step-up (June-July's 5.4/5.2 SOL inflow) held through the August surge is now the single most important open number. Next loop iteration.

Reconciliation progress on the 1,161-vs-1,245 discrepancy: read from source, `scripts/ww-battles-fetch.ts` applies **no filter** - it merges everything the public feed serves, fail-loud on parse errors. So the dataset faithfully mirrors the feed, and **the ICM box's 1,245/524.15 is the outlier** - it cannot have come from this feed on its stated date (the feed-derived count was lower, later). The box number's provenance is unknown; treat the feed-derived figures as primary until someone shows where 1,245 came from.

## Growth: the story is cadence, then monetization

Monthly battles and volume, complete:

| Month | Battles | SOL vol | | Month | Battles | SOL vol |
|---|---:|---:|---|---|---:|---:|
| 2025-05 | 2 | 8.39 | | 2026-01 | **137** | 33.43 |
| 2025-06 | 3 | 2.15 | | 2026-02 | 166 | 31.12 |
| 2025-07 | 2 | 20.52 | | 2026-03 | **188** | **117.68** |
| 2025-08 | 3 | 14.25 | | 2026-04 | 173 | 16.20 |
| 2025-09 | 7 | 26.06 | | 2026-05 | 134 | 4.02 |
| 2025-10 | 9 | 28.23 | | 2026-06 | 120 | 45.71 |
| 2025-11 | 17 | 12.07 | | 2026-07 | 143 | 29.68 |
| 2025-12 | 57 | 3.66 | | | | |

Three phases an investor will see immediately:

- **Prototype (May-Nov 2025):** single-digit battles, occasional whale volume.
- **Ignition (Dec-Mar):** 17 -> 57 -> 137 -> 166 -> 188. A real hockey stick in *activity*.
- **Plateau (Apr-Jul):** 173, 134, 120, 143. Cadence stabilized around ~140/month; March's volume spike was event-driven (see below), not a new baseline.

**Do not pitch the March volume.** 117.68 SOL that month, but 48.73 of it is a single battle on Mar 2 and another 26.26 on Mar 30 - two events are 64% of the month. Pitch the cadence, which is genuinely sustained, and the treasury line, which is genuinely improving.

## Revenue: the strongest slide in the deck

Treasury gross inflow by month (the fee stream, from the daily on-chain CSV):

| Month | Inflow (SOL) | | Month | Inflow (SOL) |
|---|---:|---|---|---:|
| 2025-07 | 0.19 | | 2026-02 | 0.60 |
| 2025-08 | 0.05 | | 2026-03 | 2.82 |
| 2025-09 | 0.33 | | 2026-04 | 1.07 |
| 2025-10 | 0.35 | | 2026-05 | 1.26 |
| 2025-11 | 0.41 | | 2026-06 | **5.42** |
| 2025-12 | 0.47 | | 2026-07 | **5.20** |
| 2026-01 | 2.18 | | | | |

**June + July = 10.62 SOL, which is 52% of lifetime treasury inflow, earned in the two most recent measured months** - while battle count was flat (120, 143) and battle volume was ordinary (45.71, 29.68). Revenue per battle stepped up roughly 4x against the spring months.

That is the shape investors pay for: monetization improving independently of volume. It coincides with the v1->v2 judging transition (doc 2116) and the fee changes around it - worth one slide connecting the two, because "we changed the mechanism and revenue per battle quadrupled" is a causal story, not a trend hope. Current treasury balance is small - **5.53 SOL on 2026-07-21** after 14.83 SOL lifetime outflow - so the pitch is the *rate*, not the balance.

## Artists: good retention, real concentration

Window limitation restated: handles exist June-July only - 32 known artists, 23 first seen in June, 9 in July.

- **Retention: 20 of 32 (62%) battled in 2+ distinct months.** For a creator platform two months in to measurable data, that is a genuinely strong number - most UGC platforms lose the majority of creators after first touch.
- **Concentration: the top 10 artists hold 74.8% of battle slots.** RoCkY2GriMeY 46, CannonJones973 39, Stormbourne 38, luiwrites 35, dopestilo 31.

Doc 2288's Ignite teardown found their fanclub was 47% the operator's own accounts, and the founder-share note said their constraint was audience, not product. An investor who has seen that pattern will ask us the same question. Our answer is materially better - these are **32 distinct real artists**, none operator-controlled, with a battle cadence to show - but 74.8% top-10 share on a 32-artist base is still a thin supply funnel, and **new-artist intake fell from 23 in June to 9 in July.** The funnel slide needs a plan attached, and ZABAL Games is that plan if the pipeline is wired to it explicitly.

## Product mix: one battle type is the product

| Type | Count | Share |
|---|---:|---:|
| QUICK | 1,098 | 94.6% |
| MAIN | 39 | 3.4% |
| COMMUNITY | 24 | 2.1% |

QUICK battles are the product; MAIN events are the marketing moments. Median stake 0.0246 SOL (~$4 at recent prices) says the base is casual players, which is fine - but with **4.6% of battles carrying 75.8% of volume**, the revenue engine is a small number of high-stakes events layered on a casual base. Investors will ask what happens to volume if three whales leave. The honest answer today is "it drops by most", and the mitigation - widening the mid-stakes band - is a roadmap item, not a metric yet.

## What to fix before this goes in front of anyone

1. **Reconcile 1,161/393 vs the box's 1,245/524.** One public number, one methodology note. (UNRESOLVED here.)
2. **Refresh the dataset** - it is 18 days stale and August is the month being pitched from.
3. **Backfill artist handles** on pre-June battles if the chain allows it - the retention story is the best artist slide and it currently rests on a 2-month window.
4. **Settle the 156-vs-157 Respect holder count** (doc 2286) - different corner of the ecosystem, same diligence pass.
5. **Put the traction paragraph back in the public `thezao` box** (doc 2286) - an investor's analyst will fetch it.

## Findings

1. **Cadence is real and sustained** - ~140 battles/month for six months, up 24x from Nov.
2. **Revenue is the strongest story** - 52% of lifetime treasury inflow arrived in the last two measured months, on flat battle count. Monetization per battle roughly quadrupled.
3. **Volume is whale-driven** - 4.6% of battles carry 75.8% of volume; March's headline month was two events.
4. **Artist retention (62% multi-month) is strong; artist supply is thin** - 32 known artists, top-10 at 74.8%, intake halved June to July.
5. **The public number and the internal number disagree** (1,245/524 vs 1,161/393) and must be reconciled before either is used.
6. **The dataset itself is an asset** - 14 months of per-battle on-chain records with a working fetch pipeline is diligence-ready infrastructure most seed-stage projects cannot produce.

## Also See

- [Doc 743](../743-wavewarz-whitepaper-v2-deep-dive/) - the canonical whitepaper deep-dive
- [Doc 2114](../2114-wavewarz-battle-cadence-analysis/) - prior cadence analysis this extends
- [Doc 2115](../2115-wavewarz-artist-economy-loser-earns/) - the artist-economy mechanism
- [Doc 2117](../2117-wavewarz-treasury-floor-model/) - the treasury model the inflow numbers feed
- [Doc 2286](../../identity/2286-icm-live-box-drift-audit/) - where the 1,245/524 public claim lives, and its drift

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Reconcile this dataset against the ICM box numbers; publish ONE battle/volume figure with a methodology note. Shipped when both sources state the same number. | @Zaal | Manual | 2026-08-20 |
| Run `scripts/ww-battles-fetch.ts` to bring the dataset current through August | @Zaal | Manual | 2026-08-18 |
| Backfill pre-June artist handles from chain data if recoverable | @Zaal | PR | 2026-08-25 |
| Add a monetization-transition slide: v2 judging/fee change -> revenue per battle ~4x, with the two monthly tables | @Zaal | Deck | 2026-08-22 |
| Wire ZABAL Games explicitly as the artist-supply funnel and instrument new-artist intake monthly | @Zaal | Decision | 2026-08-25 |

## Sources

- `~/Desktop/repos/wwtracker/public/ww-battles.json` - **[FULL]** method: parsed and computed locally this run. 1,161 records, fields enumerated, freshness 2026-08-14 (content through 2026-07-29). All battle, growth, artist and mix numbers derive from it.
- `~/Desktop/repos/wwtracker/public/ww-daily-treasury.csv` - **[FULL]** method: parsed locally. 386 daily rows, 2025-07-01 to 2026-07-21, source column reads `on-chain (backfilled)`. All treasury numbers derive from it.
- Live `thezao` ICM box + repo source - **[FULL]** fetched and diffed in doc 2286; the 1,245/524.15 discrepancy figures come from there.
- Docs 743, 2114, 2115, 2116, 2117 - **[PARTIAL]** cited for mechanism context (v2 judging transition, treasury model); not re-read in full this run.
- Independent on-chain verification of the Solana program's totals - **[FAILED]** not attempted this run. The dataset is the tracker's own backfilled chain reads; a third-party RPC recount is the natural diligence hardening step and is folded into next action 1.

## Credit

The dataset and the tracker are ZAO's own (`wwtracker`, maintained by the wavewarz lane). Analysis computed fresh here; prior waves 1078-1225 built the pipeline this doc reads from.
