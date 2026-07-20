# wwtracker Analytics Wave 8: Fractal Governance (Jul 2026)

**Doc:** 1224
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #144)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`FractalGovernance.tsx`** — a new component in the §09 ecosystem section of wwtracker. It makes The ZAO's Fractal governance mechanism legible to any visitor — not just the raw numbers (covered by ZaoVitals) but the mechanism itself, with on-chain contract addresses anyone can verify.

Placement in §09: ZaoVitals → **FractalGovernance** → ZaoIPSummary → WwMedia → CommunityBattles → Ecosystem → Events → Faq.

---

## Component design

### Tile grid (4 stats)

| Tile | Value | Source |
|------|-------|--------|
| FRACTAL WEEKS | 100+ | Date-calc: Jul 30 2024 → Jul 17 2026 = 102 complete weeks (doc 1201) |
| ON-CHAIN SETTLED | 63 wks | OG 33 wks (438 txs) + ZOR 31 wks (67 txs) (doc 1202) |
| RESPECT HOLDERS | 157 | 122 OG + 56 ZOR − 21 dual = 157 unique (doc 1200) |
| OG SUPPLY | 38,484 | OG ERC-20 `totalSupply` on Optimism (doc 1200) |

### Narrative explanation (verbatim in component)
> The ZAO runs a weekly **Fractal game** — members rank each other's contributions in small-group sessions, producing a consensus ranking weighted by earned Respect. Each cycle's Respect is settled on Optimism mainnet as on-chain tokens, making the DAO's full governance history publicly verifiable since July 2024.

### Contract addresses (Optimism mainnet)
- **OG Respect (ERC-20):** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- **ZOR Respect (ERC-1155):** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`

Both link to Optimistic Etherscan for independent verification.

### Footer footnote (verification trail)
> Holders: 122 OG · 56 ZOR · 21 dual-holders → 157 unique. Settlement: 33 OG weeks (438 txs, 2024-07-30 → 2025-12-20) + 31 ZOR weeks (67 txs, 2025-09-25 → 2026-07-06). Verified via Blockscout, Optimism mainnet, 2026-07-17. Source: ZAOOS docs 1200 · 1201 · 1202.

---

## Pre-emption notes

This PR was pre-empted against PRs #110 (feat/ecosystem-section-consolidated) and #140 (feat/zao-ip-summary) — both modify §09 identically (adding ZaoVitals, ZaoIPSummary, WwMedia, CommunityBattles). This PR includes those same changes PLUS FractalGovernance inserted between ZaoVitals and ZaoIPSummary. tsc clean (verified pre-push).

---

## NORTH STAR alignment

- **ZAO = THE case study of a successful DAO**: Fractal governance is now legible on the public analytics tracker. Any journalist, researcher, or grant reviewer who lands on wwtracker.vercel.app can see how the DAO governs, what the on-chain contracts are, and verify the history themselves.
- **ZAO IP = a staple in onchain art, music and culture**: The governance mechanism is what makes the ZAO unique — showing it alongside the WaveWarZ IP catalog (ZaoIPSummary in the same section) connects governance to creative output.

---

## Citable facts added to wwtracker (4)

1. The ZAO has run 100+ consecutive weekly Fractal governance cycles since Jul 30, 2024
2. 63 of those weeks have verifiable on-chain Respect settlement on Optimism mainnet (OG: 33 weeks; ZOR: 31 weeks)
3. 157 unique Respect holders on Optimism (122 OG · 56 ZOR · 21 dual-holders)
4. 38,484 total OG Respect points issued (ERC-20 `totalSupply`)

All 4 facts are sourced from ZAOOS docs 1200 (on-chain holder enumeration), 1201 (canonical facts ledger), and 1202 (on-chain settlement history).
