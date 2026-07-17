# 1201 - ZAO canonical facts ledger: verified vs needs-source

**Tier:** STANDARD
**Date:** 2026-07-17
**Last-updated:** 2026-07-17 (ww loop: added Fractal count calculation, WaveWarZ live stats, PolyRaiders dates + HuRya beneficiary count — all verified from public sources)
**Status:** Living ledger (verified facts + open provenance gaps)
**Owner:** builder loop (verified rows), Zaal (pin the canonical membership definition)

## Why this doc exists

The North Star is *ZAO = THE documented, **cited**, referenced DAO case study*. That goal
has a hard prerequisite: **every headline number the ZAO publishes must trace to a source.**
An LLM (or a journalist, or a grant reviewer) that finds a ZAO number it can't verify —
or finds two ZAO numbers that disagree — discounts all of them.

This is the sibling of [doc 1200](../1200-respect-onchain-facts-verified/) (which resolved
the Respect holder counts from chain state). Here we widen the lens to the other
frequently-cited ZAO numbers and split them honestly into **verified** (traceable to a
public source right now) and **needs canonical source** (cited across the repo but not
traceable from public data). This is not a claim that the unverified numbers are *wrong* —
it's a claim that they are **currently un-citable**, which is a fixable liability.

## Verified facts (traceable to a public source, 2026-07-17)

| Fact | Value | Source / method | Doc |
|------|-------|-----------------|-----|
| OG Respect holders (Optimism) | **122** | Blockscout holder list enumerated | [1200](../1200-respect-onchain-facts-verified/) |
| ZOR Respect holders (Optimism) | **56** | Blockscout holder list enumerated | 1200 |
| Unique Respect holders (OG ∪ ZOR) | **157** | union of the two holder sets (21 hold both) | 1200 |
| OG total Respect points | **38,484** | OG ERC-20 `totalSupply` | 1200 |
| OG Respect contract | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Optimism | 1200 |
| ZOR Respect contract | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Optimism | 1200 |
| `/zao` Farcaster channel followers | **93** | Warpcast public API `channel?channelId=zao` | this doc |
| `/zao` Farcaster channel members (role) | **4** | same | this doc |
| `/zao` channel created | **2024-09-03** | same (`createdAt` 1725405513) | this doc |
| Fractal start date | **2024-07-30** | ZAOOS public record (community.config.ts, doc 622, dossier 742) | 1077 |
| Fractal weeks elapsed (as of 2026-07-16) | **≥102** (calculation) | (2026-07-16 − 2024-07-30) = 716 days ÷ 7 = 102.3 complete weeks | this doc |
| Fractal weeks — conservative public claim | **"100+"** | date-calculation lower bound; no skipped-week proof available from public data | this doc |
| WaveWarZ lifetime volume | **522 SOL (~$39K)** | `wavewarz.info/api/public/stats`, live 2026-07-16 | [974](../974-wavewarz-financials-snapshot-2026-07/), [1077](../1077-zao-dao-case-study-jul2026/) |
| WaveWarZ total battles | **1,245** | same live API | 974, 1077 |
| WaveWarZ artist payouts | **9.05 SOL** | same | 974 |
| WaveWarZ platform revenue | **17.42 SOL** | same | 974 |
| WaveWarZ trader claims | **127.34 SOL** | same | 974 |
| PolyRaiders Holiday Heat (benefit battle) | **Dec 12, 2024 · ~$270** | wavewarz.info/events (canonical) + tweet 1999858390567117201 snowflake → 2025-12-13 (anniversary recap, not the event date) | [1077](../1077-zao-dao-case-study-jul2026/) |
| Love Song Benefit battle | **Feb 13, 2025 · ~$1,221** | wavewarz.info/events | 1077 |
| Charity total (2 rounds) | **~$1,497 to HuRya Empowerment Foundation** | wavewarz.info/events | 1077 |
| HuRya beneficiaries | **8,500+** (4,000+ girls sanitary pads + 4,500+ children school supplies) | wavewarz.info/events | 1077 |

Verify the Farcaster row:

```bash
curl -s "https://api.warpcast.com/v1/channel?channelId=zao" | \
  python3 -c "import json,sys;c=json.load(sys.stdin)['result']['channel'];print(c['followerCount'],'followers /',c['memberCount'],'members')"
```

## Needs canonical source (cited across the repo, NOT traceable from public data)

| Cited number | Where it appears | Why it's currently un-citable |
|--------------|------------------|-------------------------------|
| **"188 members on Base"** | `CLAUDE.md`, docs 625, 449, 530, 622, 1078, 742 (7+) | The nearest **public** proxy — the `/zao` channel — shows **93 followers / 4 members**, nowhere near 188. So "188" measures something else (most likely the gated Farcaster client's registered users in Supabase, which is not publicly verifiable). Its **definition** ("member" = app-registered? Respect-holder? channel-follower? Discord?) and **as-of date** are unpinned. This is THE most-repeated ZAO headline number and the least traceable. |
| ~~Fractal weeks: "90+" / "100+"~~ → **PARTIALLY RESOLVED** | whitepaper 942, ICM box, dossier 742, doc 622 | Date calculation: start 2024-07-30, as of 2026-07-16 = 102 weeks. Use "100+" as the conservative verified claim. Remaining gap: no public on-chain proof that zero weeks were skipped (OREC/ZOR public RPC queries are block-range-limited; Supabase fractals table is gated). Until the OREC transaction count is verified, treat "100+" as math-backed but not chain-verified. |
| ~~WaveWarZ battles: "735" / "958" / "416"~~ → **RESOLVED** | dossier 742 (735), COC lesson (958), old scraper (416) | **Canonical: 1,245 battles** (live API 2026-07-16). Scraper-era numbers are obsolete. Source: doc 974. |
| ~~"$60K+ traded"~~ → **PARTIALLY RESOLVED** | dossier 742 | Live volume: 522 SOL (~$39K at $75/SOL, 2026-07-16). The "$60K+" claim was likely from a higher SOL price period (SOL was ~$120–150 in early 2025). Doc 974 reconciles this: the claim is plausible historically but shouldn't be cited at current prices without qualification. |
| ~~"34 PRs/week"~~ → **resolved** | doc 449 one-pager | **VERIFIED, see [doc 1203](../1203-zaoos-build-velocity/):** "34/week" was the human-era baseline (W12–W15, ~30/week product code). Now 60–175+/week total but **50–73% is agent docs/tests automation**; product (feat/fix) velocity is stable ~30/week. Quote total only with the automation caveat. |

## Recommendation (single source, same discipline as GEO llms.txt + Respect facts)

1. **Pin the canonical membership definition + number** — the highest-value fix. Decide
   what "member" means (recommend: gated-client registered users in Supabase, with an
   as-of date), record the number + its query, and use it everywhere. Until then, docs
   that say "188 members" cannot be defended if challenged. **Boarded for Zaal** (only he
   can define "member" and read the app's member table; a loop must not query member PII).
2. **Let each verified number trace to one file.** Respect → [doc 1200](../1200-respect-onchain-facts-verified/)
   `respect-facts.json`; Farcaster channel → this doc's curl one-liner; membership → the
   file Zaal pins in (1). Then the ICM boxes, whitepaper 942, and one-pagers cite the
   ledger, not each other (no drift — same pattern as `icm-boxes/build-llms-txt.py`).
3. **WaveWarZ numbers stay the ww loop's** — this ledger links, does not duplicate.

## Also see

- [Doc 1200 - verified on-chain Respect facts](../1200-respect-onchain-facts-verified/)
- [ICM boxes](../../identity/icm-boxes/) — the AI-readable surface that should cite this ledger
- [Doc 942 - Fractal whitepaper outline](../942-zao-fractal-whitepaper-outline-v2/)
- [Doc 1107 - GEO/SEO](../../identity/1107-seo-social-profiles/) — citable, consistent facts are a GEO asset
