---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-07-16
related-docs: 743, 968
original-query: "WaveWarZ financials - consolidate the current on-chain volume, battle count, artist payouts, platform revenue, and sponsorship state into one snapshot (reconstructed)"
tier: STANDARD
---

# 974 - WaveWarZ financials snapshot (2026-07)

> **Goal:** One consolidated, honestly-sourced view of WaveWarZ's money - volume, battles, artist payouts, platform revenue, and sponsorship - so the "artists earn" claim can be checked against the actual numbers.

## Headline

**Live-reconciled 2026-07-16.** The figures below are pulled directly from `wavewarz.info/api/public/stats` (public API, no auth, 60 s cache), which is the canonical source for self-reported WaveWarZ stats. The prior discrepancies (Intelligence vs testimonial) are now explained and resolved.

The one hard tension that survives: **the platform has taken ~1.93x what artists have earned in aggregate**, largely via launch/queue fees. For a product whose pitch is "the artist earns," that ratio is the single thing to watch. It has widened slightly from the July 6 estimate (~1.8x).

---

## Reconciled figures (live pull 2026-07-16, SOL at $75.13)

| Metric | Live figure | USD equiv | Prior (Jul 6) | Delta |
|---|---|---|---|---|
| Total volume | **522.09 SOL** | ~$39,241 | ~491 SOL | +31 SOL |
| Total battles | **1,244** | — | ~1,125 | +119 |
| Quick battles | 1,046 | — | — | — |
| Main-event battles | 162 (across 50 events) | — | — | — |
| Community battles | 36 | — | — | — |
| Artist payouts | **9.05 SOL** | ~$680 | ~8.7 SOL | +0.35 SOL |
| Platform revenue | **17.42 SOL** | ~$1,309 | ~15.9 SOL | +1.52 SOL |
| Trader claims (manual) | **127.34 SOL** | ~$9,568 | (not tracked) | — |

**Platform vs artist ratio:** 17.42 ÷ 9.05 = **1.93×** (platform captures ~1.93x what artists have earned, up from ~1.8× on Jul 6).

Source: `GET https://wavewarz.info/api/public/stats`, live pull 2026-07-16.

---

## Reconciliation: prior discrepancies resolved

**"$60k+ volume" vs ~$33K (Intelligence site):** The testimonial figure (~$60k+) appears to be historical USD calculated at prices-at-time-of-trade — WaveWarZ traded through a higher-SOL-price period. The Intelligence site reports current SOL value, which at $75.13 today = ~$39K on 522 SOL. Neither figure is wrong; they use different price reference points. The "$60k+" was SOL priced at the time of each trade (some trades occurred when SOL was $150-200+); the site figure is current SOL market value. Both descriptions are technically defensible; the one to cite going forward is the live-API figure.

**"~1,125 battles" (Intelligence) vs "~950" (BCZ context):** Partially explained by (a) the Jul 6 Intelligence read being newer than the BCZ testimonial, and (b) the battle definition: on-chain `initializeBattle` calls total ~1,127 (Dune, as of Jun 2026), but the Intelligence site groups multi-song main events and excludes test battles, yielding a lower "official" count. The live count is now **1,244** across three types.

**"~8.7 SOL vs ~7.8 SOL" payouts:** Both figures were stale snapshots taken at different times. Live is **9.05 SOL**.

---

## The ratio (load-bearing finding, updated)

Platform: **17.42 SOL** cumulative revenue.
Artists: **9.05 SOL** cumulative payouts.
Ratio: **1.93× in platform's favor**, up slightly from the ~1.8× on July 6.

Why: the 0.5% per-trade platform fee + 3% of every losing pool at settlement + launch/queue fees. The launch and queue fees are the structural driver — they accrue at battle creation, before any trading. Until the artist-side fees (1% of volume per side, plus the 5%/2% settlement split) compound on higher volumes, the platform ratio will likely stay above 1.5× at current scale.

What this means: the "artists earn" narrative is real but still early-stage. At 522 SOL of lifetime volume and 9 SOL of lifetime artist payouts, the platform has paid out 1.73% of volume to artists. The structural mechanism works; the absolute scale is small.

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
- `wavewarz.info/api/public/stats` - live pull 2026-07-16 (authoritative, supersedes all prior figures)
- WaveWarZ Intelligence site / wavewarz.com - read via research agent 2026-07-06 (SUPERSEDED by live pull)
- Dune on-chain analytics (wwtracker, Jun 2026 snapshot) - confirms program ID `9TUf...g2fYo`, 1,127 on-chain `initializeBattle` calls as of Jun 14 2026
- BetterCallZaal brand research 2026-07-06 (testimonial + profitability claim; self-reported; "$60k+" explained above)
- WaveWarz HQ Airtable audit, base appR0UyV9hG8o9D0Z, via doc 968 (2026-07-05)
