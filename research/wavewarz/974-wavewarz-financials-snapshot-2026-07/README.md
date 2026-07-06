---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-07-06
related-docs: 743, 968
original-query: "WaveWarZ financials - consolidate the current on-chain volume, battle count, artist payouts, platform revenue, and sponsorship state into one snapshot (reconstructed)"
tier: STANDARD
---

# 974 - WaveWarZ financials snapshot (2026-07)

> **Goal:** One consolidated, honestly-sourced view of WaveWarZ's money - volume, battles, artist payouts, platform revenue, and sponsorship - so the "artists earn" claim can be checked against the actual numbers.

## Headline

The numbers are **real but early, self-reported, and internally inconsistent across surfaces** - treat every figure below as directional until reconciled against a live pull from the WaveWarZ Intelligence site. The one hard tension that survives every version of the numbers: **the platform has taken more in aggregate than artists have earned**, driven by launch/queue fees. For a product whose entire pitch is "the artist earns," that ratio is the single thing to watch.

## Findings (all figures self-reported / agent-gathered 2026-07-06, not independently re-verified)

**Traction (Solana mainnet, all-time):**
- Volume: ~491 SOL (~$33K) per the WaveWarZ Intelligence read; a client testimonial cites "$60k+ volume." These disagree - reconcile.
- Battles: ~1,125 (Intelligence) vs ~950 (BCZ testimonial context). Disagree.
- Cumulative artist payouts: ~8.7 SOL (~$590) vs ~7.8 SOL in another read. Disagree, same order of magnitude.
- Platform revenue: ~15.9 SOL cumulative.
- Profitability: a "just turned profitable" claim exists; unverified here.

**The ratio (the load-bearing finding):** platform ~15.9 SOL vs artists ~8.7 SOL cumulative. The platform is capturing roughly 1.8x what artists have, largely via launch + queue fees. This is the number that undercuts the "artists earn" story at current scale.

**Published economics (Solana):** artist takes 1% of trading volume per side per trade, +5% of the loser's pool on a win / +2% on a loss (all automatic). Platform takes 0.5% per trade + 3% of the losing pool at settlement + launch and queue fees. Operational nuance: artist payouts are automatic; **trader winnings must be claimed manually**.

**Sponsorship / revenue tracking (from the WaveWarz HQ Airtable audit, base appR0UyV9hG8o9D0Z, doc 968):** Artists table is live (112 rows, signups to 2026-06-27). But **Sponsors = 1 row (Sigea, $225)**; the Events, Sponsorships, and Sponsorship-Distributions tables are built but empty; the Improvements table (87 rows) is all "Not Started." Revenue tracking has effectively stalled at one deal.

**Base vs Solana:** Solana is the live human product. WaveWarZ Base is the AI-agent proving ground (AI musicians generate SUNO tracks, AI traders speculate) intended to funnel adoption into the human Solana product - not a second revenue line today.

## Also See
- [Doc 743](../743-wavewarz-canonical/) - WaveWarZ canonical
- [Doc 968](../../security/968-zaoos-codebase-audit-2026-07-05/) - the audit that surfaced the WaveWarz HQ Airtable state

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Live-pull the WaveWarZ Intelligence site and reconcile volume/battles/payouts into one authoritative set of figures | @Zaal | Research | 2026-07-13 |
| Decide + publish whether the artist-vs-platform fee ratio needs adjusting (the launch/queue fees are the driver) | @Zaal | Decision | 2026-07-20 |
| Work the sponsorship pipeline through WaveWarz HQ (currently 1 row) or accept revenue tracking has stalled | @Zaal | Ops | 2026-07-20 |

## Sources
- WaveWarZ Intelligence site / wavewarz.com - read via research agent 2026-07-06 (PARTIAL - not re-verified live in this doc; the Next Actions live-pull is required to promote these to FULL).
- BetterCallZaal brand research 2026-07-06 (testimonial + profitability claim; self-reported).
- WaveWarz HQ Airtable audit, base appR0UyV9hG8o9D0Z, via doc 968 (2026-07-05).
