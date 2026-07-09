---
topic: governance
type: audit
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 718b
original-query: "Respect-game number - what is the single honest headline number for the ZAO Respect / Fractal game, grounded in on-chain truth, so we stop citing conflicting figures across the site, the whitepaper, and decks"
tier: STANDARD
---

# 975 - ZAO Respect: the live numbers (one honest set)

> **Goal:** Fix the "Respect-game number" problem - every surface (site, whitepaper, decks, casts) cites a slightly different member/week/distribution figure. This doc pins ONE set of numbers to on-chain ground truth so we cite the same thing everywhere, and flags the ones still modeled rather than measured.

## The one-line answer

**156 people hold ZAO Respect. The game has run ~101 unbroken weeks. Governance is real but its execution is concentrated in one relayer wallet (94% of proposals).** Everything else is detail under those three.

## The headline numbers (use these, drop the rest)

| What | Number | Source status |
|------|--------|---------------|
| Members (unique Respect holders) | **156** (122 OG + 55 ZOR, 21 hold both) | MEASURED on-chain 2026-07-05 |
| Weeks of unbroken Fractals | **~101** (since 2024-07-30) | MEASURED (mint history) |
| OG Respect total supply | **38,484** (frozen, last mint 2025-12-09) | MEASURED |
| OG distribution Gini | **~0.73** (top 10 = 53%, top holder = 8%) | MEASURED (OG-only) |
| OREC proposal threshold | **1,000 Respect** (~2.6% of OG supply) | MEASURED (`minWeight` on-chain) |
| OREC vote / veto windows | **72h each** (`voteLen`=`vetoLen`=259,200s) | MEASURED |
| Total OREC proposals ever | **130**, from only **4 wallets** | MEASURED |
| Proposal concentration | one relayer = **94%** (122/130); top-3 = 99% | MEASURED |

## What this CORRECTS (stop citing these)

These are the wrong numbers that have been floating across surfaces. They came from doc 718b, which **modeled** the system rather than measuring it:

- "~200 members" -> **wrong.** That conflated Discord/community size with actual Respect holders. The on-chain holder count is **156**.
- "Gini ~0.23" (looked egalitarian) -> **wrong.** That was a modeled single-round figure. The actual cumulative OG distribution Gini is **~0.73** (a single 6-person Fibonacci round alone computes to 0.41). The distribution is meaningfully concentrated - own that honestly rather than claiming near-perfect equality.
- "48h/48h OREC windows" -> **wrong.** On-chain `voteLen` and `vetoLen` are both **72h**.
- "proposal threshold ~10% of supply" -> **wrong.** `minWeight` = 1,000 Respect = **~2.6%** of OG supply.
- "90+ weeks" -> **understated.** It is **~101** ("100+ weeks" is the correct claim).

## The honest caveat (say it out loud)

The strongest limitation and the one most worth stating plainly: **governance execution is effectively one wallet.** Of 130 OREC proposals ever submitted, a single relayer (the OG first-mint operator) submitted 122 - 94%. The system is genuinely on-chain and the vote/veto mechanics are real, but "decentralized proposing" is aspirational, not current. This is the operating-core concentration limitation. Cite it before someone else finds it.

## Two numbers we deliberately do NOT publish yet

1. **Combined OG+ZOR Gini.** Not cleanly computable. ZOR (ERC-1155) holder values are a mix of "1" (215 of 270 rows), Fibonacci amounts (110/68/42/16), and sums (136/330/726). Whether `amount` = Respect or `tokenId` encodes Respect is ambiguous without the mint semantics. Publish the **OG-only 0.73, labeled as OG-only** - do not invent a combined figure.
2. **Precise "active governance participants."** 156 hold Respect; 4 wallets have ever proposed. "Active voters" sits somewhere between and needs a getLogs pass on the vote events to state honestly. Left open below.

## Contracts (for anyone re-pulling)

- OREC executor: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` (OP Mainnet)
- OG Respect ERC-20: `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Fractals 1-73)
- ZOR Respect ERC-1155: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Fractals 74+)

## Also See

- [Doc 718b](../718b-zao-respect-onchain-analysis/) - the earlier MODELED analysis this doc corrects. 718b's estimates should be treated as superseded by the 2026-07-05 on-chain pull for every number above.
- Whitepaper PRs #1083-#1087 (ws/zao-whitepaper) already carry these corrected numbers into the Technical Whitepaper - this doc is the citable source behind those edits.
- Papers site = ZAODEVZ/ZAOfractal (Astro, zaofractal.vercel.app).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Replace any "~200 members / Gini 0.23 / 48h windows" copy on thezao.xyz + decks with the headline table above | @Zaal | Edit | 2026-07-13 |
| Add a live on-chain pull (getLogs on vote events) to state "active voters" honestly, closing open #2 | @Zaal | PR | 2026-07-20 |
| Resolve ZOR ERC-1155 mint semantics so a combined OG+ZOR Gini can be published, closing open #1 | @Zaal | Research | 2026-07-27 |
| Mark doc 718b `superseded-by: 975` in its frontmatter | @Zaal | Edit | 2026-07-13 |

## Sources

- [FULL] `reference_zao_respect_onchain_facts` - on-chain pull 2026-07-05 (Optimism Blockscout v2 + mainnet.optimism.io RPC eth_call/getLogs). Every MEASURED number above traces to this pull.
- [FULL] `src/lib/respect/voteWeight.ts` `computeRespectWeight` (in ZAOOS) - confirms combined OG+ZOR weight is computed off-chain via viem multicall, so the OREC contract referencing OG natively is not a contradiction.
- [PARTIAL] Doc 718b - read for its modeled estimates, all of which are corrected here; not re-fetched because it is the thing being superseded.
