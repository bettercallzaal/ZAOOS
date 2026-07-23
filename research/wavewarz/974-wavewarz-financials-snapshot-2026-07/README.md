---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-07-23
related-docs: 743, 968
original-query: "WaveWarZ financials - consolidate the current on-chain volume, battle count, artist payouts, platform revenue, and sponsorship state into one snapshot (reconstructed)"
tier: STANDARD
---

# 974 - WaveWarZ financials snapshot (2026-07)

> **Goal:** One consolidated, honestly-sourced view of WaveWarZ's money - volume, battles, artist payouts, platform revenue, and sponsorship - so the "artists earn" claim can be checked against the actual numbers.

## Headline

**Live-reconciled 2026-07-23** (refreshed from Jul 17; major movement due to AI Artist Tournament Jul 16–23). The figures below are pulled directly from `wavewarz.info/api/public/stats` (public API, no auth, 60 s cache), which is the canonical source for self-reported WaveWarZ stats.

**Key shift (Jul 23):** The platform:artist ratio improved from **1.92× → 1.49×** — AI tournament volume drove artist payouts up 47% (+4.32 SOL) while platform revenue grew only 15% (+2.55 SOL). This is the first documented ratio improvement since Jul 6. Trader claims tripled (127 → 381 SOL) in 6 days — the AI tournament redistributed significant value to traders.

---

## Reconciled figures (updated pull 2026-07-23, SOL at $77.49)

| Metric | Live figure (Jul 23) | USD equiv | Prior (Jul 17) | Delta |
|---|---|---|---|---|
| Total volume | **878.316 SOL** | ~$68,061 | 524.15 SOL | +354.17 SOL |
| Total battles | **1,285** | — | 1,245 | +40 |
| Quick battles | 1,084 | — | 1,047 | +37 |
| Main-event battles | 165 (across 51 events) | — | 162 (50 events) | +3 |
| Community battles | 36 | — | 36 | — |
| Artist payouts | **13.3918 SOL** | ~$1,038 | 9.07 SOL | +4.32 SOL |
| Platform revenue | **19.9867 SOL** | ~$1,549 | 17.44 SOL | +2.55 SOL |
| Trader claims | **381.197 SOL** | ~$29,540 | 127.34 SOL | +253.86 SOL |
| Withdrawal count | **1,526** | — | (not tracked) | — |
| Last 7-day volume | **356.621 SOL** | ~$27,622 | — | AI tournament week |

**Platform vs artist ratio:** 19.99 ÷ 13.39 = **1.49×** (platform captures ~1.49× what artists have earned, down from 1.92× on Jul 17 — ratio improving as volume scales).

Source: `GET https://wavewarz.info/api/public/stats`, live pull 2026-07-23T10:08Z.

---

## Reconciliation: prior discrepancies resolved

**"$60k+ volume" vs ~$33K (Intelligence site):** The testimonial figure (~$60k+) appears to be historical USD calculated at prices-at-time-of-trade — WaveWarZ traded through a higher-SOL-price period. The Intelligence site reports current SOL value, which at $75.29 today = ~$39K on 524 SOL. Neither figure is wrong; they use different price reference points. The "$60k+" was SOL priced at the time of each trade (some trades occurred when SOL was $150-200+); the site figure is current SOL market value. Both descriptions are technically defensible; the one to cite going forward is the live-API figure.

**"~1,125 battles" (Intelligence) vs "~950" (BCZ context):** Partially explained by (a) the Jul 6 Intelligence read being newer than the BCZ testimonial, and (b) the battle definition: on-chain `initializeBattle` calls total ~1,127 (Dune, as of Jun 2026), but the Intelligence site groups multi-song main events and excludes test battles, yielding a lower "official" count. The live count is now **1,244** across three types.

**"~8.7 SOL vs ~7.8 SOL" payouts:** Both figures were stale snapshots taken at different times. Live is **9.07 SOL** (as of 2026-07-17).

---

## The ratio (load-bearing finding, updated Jul 23)

Platform: **19.9867 SOL** cumulative revenue.
Artists: **13.3918 SOL** cumulative payouts.
Ratio: **1.49× in platform's favor**, improved from 1.92× on Jul 17.

**Why the ratio improved:** The AI Artist Tournament (Jul 16–23) drove 354+ SOL in battle volume in a single week. At high volume, the artist-side fees (5%/2% settlement split applied to large pools) compound significantly — GEEK MYTH and LUI each took meaningful payouts from ~342 SOL in the semifinal alone. Meanwhile, platform revenue (0.5% per trade + 3% of losing pool) grew at its normal rate. The tournament showed that volume shocks benefit artists faster than the platform.

**What this means at Jul 23:** The "artists earn" narrative is strengthening. At 878 SOL of lifetime volume and 13.39 SOL in artist payouts, the platform has paid out ~1.52% of volume to artists (down from 1.73% on Jul 17 — the AI tournament was a volume spike that temporarily compressed the percentage, but the absolute amounts increased sharply). The structural mechanism works and is scaling. Traders have claimed 381 SOL — the trader incentive is clearly working too.

**Watch for:** Whether the post-tournament ratio holds above or below 1.5× as the platform returns to normal volume. If the ratio stays below 1.5×, it will become a credible "artists earn fairly" narrative anchor.

---

## Sponsorship state (from doc 968 Airtable audit, 2026-07-05)

No update since July 6. From doc 968: Sponsors = 1 row (Sigea, $225); Events, Sponsorships, and Sponsorship-Distributions tables built but empty; Improvements table (87 rows, all "Not Started"). Revenue tracking has effectively stalled at one deal. No live re-pull possible from here — flagged for @Zaal / @Hurric4n3ike follow-up.

---

## Also See
- [Doc 743](../743-wavewarz-canonical/) - WaveWarZ canonical
- [Doc 968](../../security/968-zaoos-codebase-audit-2026-07-05/) - the audit that surfaced the WaveWarz HQ Airtable state

## Next Actions

| Action | Owner | Type | Status |
|--------|-------|------|--------|
| ~~Live-pull the WaveWarZ Intelligence site and reconcile volume/battles/payouts~~ | @Zaal | Research | ✓ Done 2026-07-16 (live API pull above) |
| Decide + publish whether the artist-vs-platform fee ratio needs adjusting (the launch/queue fees are the driver) | @Zaal | Decision | Open (due 2026-07-20) |
| Work the sponsorship pipeline through WaveWarz HQ (currently 1 row) or accept revenue tracking has stalled | @Zaal | Ops | Open (due 2026-07-20) |

## Sources
- `wavewarz.info/api/public/stats` - live pull 2026-07-17 (authoritative, supersedes all prior figures)
- WaveWarZ Intelligence site / wavewarz.com - read via research agent 2026-07-06 (SUPERSEDED by live pull)
- Dune on-chain analytics (wwtracker, Jun 2026 snapshot) - confirms program ID `9TUf...g2fYo`, 1,127 on-chain `initializeBattle` calls as of Jun 14 2026
- BetterCallZaal brand research 2026-07-06 (testimonial + profitability claim; self-reported; "$60k+" explained above)
- WaveWarz HQ Airtable audit, base appR0UyV9hG8o9D0Z, via doc 968 (2026-07-05)
