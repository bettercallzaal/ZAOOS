# 1201 - ZAO canonical facts ledger: verified vs needs-source

**Tier:** STANDARD
**Date:** 2026-07-17
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

Verify the Farcaster row:

```bash
curl -s "https://api.warpcast.com/v1/channel?channelId=zao" | \
  python3 -c "import json,sys;c=json.load(sys.stdin)['result']['channel'];print(c['followerCount'],'followers /',c['memberCount'],'members')"
```

## Needs canonical source (cited across the repo, NOT traceable from public data)

| Cited number | Where it appears | Why it's currently un-citable |
|--------------|------------------|-------------------------------|
| **"188 members on Base"** | `CLAUDE.md`, docs 625, 449, 530, 622, 1078, 742 (7+) | The nearest **public** proxy — the `/zao` channel — shows **93 followers / 4 members**, nowhere near 188. So "188" measures something else (most likely the gated Farcaster client's registered users in Supabase, which is not publicly verifiable). Its **definition** ("member" = app-registered? Respect-holder? channel-follower? Discord?) and **as-of date** are unpinned. This is THE most-repeated ZAO headline number and the least traceable. |
| Fractal weeks: "90+" / "100+" / "ninety consecutive" | whitepaper 942, ICM box, dossier 742, doc 622 | Varies by doc (90 vs 100+). Needs the canonical meeting count — the Fractal/Respect Game record (Optimystics respectgame or the on-chain OREC history). |
| WaveWarZ battles: "735" / "958" / "416" | dossier 742 (735), COC lesson (958), old scraper (416) | Known scraper drift (COC lesson: scraper was 5× off). The **ww loop owns reconciliation** (ref PRs #1609 / doc 974) — this ledger defers to it; do not re-derive here. |
| "$60K+ traded" (WaveWarZ) | dossier 742 | Needs the settlement/volume source; ww-loop lane. |
| "34 PRs/week" | doc 449 one-pager | Needs a defined window + `gh` query to substantiate. |

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
