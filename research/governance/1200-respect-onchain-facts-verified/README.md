# 1200 - ZAO Respect: verified on-chain holder facts (Optimism)

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Verified from chain state
**Owner:** builder loop (facts), Zaal (whether to bump cited figures)

## Why this doc exists

The ZAO's public materials (whitepaper [942](../942-zao-fractal-whitepaper-outline-v2/),
the [ICM context boxes](../../identity/icm-boxes/), member pages, GEO surfaces) cite
Respect holder counts. Two numbers were circulating and looked like a contradiction:

- **"122 holders"** (facts note, board task, stale ~2026-07-10)
- **"156 Respect holders"** (ICM `thezao.llm.txt` + whitepaper 942, verified 2026-07-05)

A soulbound holder count can't *drop* from 156 to 122, so one of them had to mean
something different. This doc reads the live chain and resolves it — because the
North Star is *ZAO as the documented, **cited** DAO case study*, and a cited number
that doesn't reconcile is worse than no number.

## The resolution (both figures are correct, in different contexts)

Verified 2026-07-17 (block 154329202, 02:59 UTC) via the free Blockscout Optimism
explorer, enumerating the **full holder list** of each token (so the enumerated count
cross-checks the explorer's reported count — they matched exactly):

| Metric | Value | What it is |
|--------|-------|-----------|
| **OG holders** | **122** | Holders of the OG ERC-20 (`0x34cE…6957`), the soulbound governance token, alone |
| **ZOR holders** | **56** | Holders of the ZOR ERC-1155 (`0x9885…445c`), "ZAO Fractal Respect" |
| **Unique holders (OG ∪ ZOR)** | **157** | Distinct addresses holding *either* token — de-duplicated |
| Hold both OG **and** ZOR | 21 | Intersection |
| Naïve sum (OG + ZOR) | 178 | NOT a real holder count — double-counts the 21 |
| OG total Respect points | 38,484 | ERC-20 `totalSupply` (18 decimals) |

**So:**
- **"122"** = OG holders alone. Still 122 today — accurate.
- **"156"** = **unique holders across OG or ZOR** (de-duplicated). Now **157** (as of
  2026-07-17; it was ~156 on the 2026-07-05 snapshot — grew by one, did not shrink).
  This validates the 942 / ICM figure: it was never wrong, it's the union metric.
- The OG **Gini ≈ 0.73** cited alongside "156" is an OG-ERC-20-specific distribution stat.

**Cite discipline going forward:** when a doc says "N Respect holders," say *which* N —
"122 OG governance-token holders" vs "157 unique Respect holders (OG or ZOR)."

## Canonical source (single source, drift-proof)

- **`respect-facts.json`** — the machine-readable facts, with `verified_at_block` +
  `verified_at_timestamp` provenance. Any doc/box/whitepaper quoting a Respect number
  should trace to this file, the same single-source discipline used for the GEO
  llms.txt generation (research/identity/icm-boxes/build-llms-txt.py).
- **`verify-respect.py`** — re-runnable verifier (free Blockscout API, no key, read-only).
  Run it before quoting a Respect number to refresh the facts and catch drift.

```bash
python3 verify-respect.py                    # print reconciled facts
python3 verify-respect.py > respect-facts.json   # refresh the canonical file
```

## Reconciliation actions (for Zaal — cited numbers)

Non-gated (a loop may PR these once Zaal confirms the framing):

1. **ICM `thezao.llm.txt`** currently says "156 Respect holders." Options: (a) bump to
   "157 unique Respect holders (OG or ZOR)" for precision, or (b) leave as a rounded
   "~156" and add the OG-specific "122 governance-token holders." Recommend (a) + note
   the OG figure, since precision + reconciliation *is* the citability win.
2. **Whitepaper 942** Ch on membership/Respect: same — state both numbers with their
   definitions so a reader (or an LLM) can't find a contradiction.
3. Keep this doc's `respect-facts.json` as the number every other surface points to.

Numbers move slowly (soulbound, weekly mints) — a monthly re-run of `verify-respect.py`
keeps every citing surface fresh without re-deriving.

## Sources

- OG ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Optimism) — [explorer](https://explorer.optimism.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957)
- ZOR ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism) — [explorer](https://explorer.optimism.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)
- Method: Blockscout `/api/v2/tokens/{addr}/holders`, full pagination, enumerated 2026-07-17
- Cross-refs: [ICM boxes](../../identity/icm-boxes/), whitepaper [942](../942-zao-fractal-whitepaper-outline-v2/), [doc 1107 GEO](../../identity/1107-seo-social-profiles/)
