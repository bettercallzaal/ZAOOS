# 1202 - ZAO Fractal: on-chain Respect settlement history (two-phase, OG → ZOR)

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Verified from chain state
**Owner:** builder loop

## Why this doc exists

[Doc 1201](../1201-zao-canonical-facts-ledger/) flagged the **Fractal week count** ("90+"
vs "100+" vs "ninety consecutive" across docs) as *needs canonical source*. This doc
resolves what is resolvable **from chain state** — and in doing so uncovers a piece of
institutional history that was not written down anywhere: the Respect token is **two-phase**.

North Star #1 (the documented, *cited* DAO): the Fractal is the flagship, so its numbers
must be defensible. Sibling to [doc 1200](../1200-respect-onchain-facts-verified/) (holder counts).

## The finding: Respect settled on-chain across two token phases

Verified 2026-07-17 by enumerating the full transfer history of both Respect tokens on
Optimism (Blockscout, no key):

| Phase | Token | Distinct weeks w/ activity | Span | Distribution txs |
|-------|-------|---------------------------|------|------------------|
| **1** | OG (ERC-20) `0x34cE…6957` | **33** | 2024-07-30 → **2025-12-20** | 438 |
| **2** | ZOR (ERC-1155) `0x9885…445c` | **31** | 2025-09-25 → **2026-07-06** (active) | 67 |
| **Combined** | OG ∪ ZOR | **63 distinct weeks** | 2024-07-30 → 2026-07-06 | — |

(The two phases overlap in only **1** ISO week — OG wound down as ZOR came online in
late 2025; on-chain settlement effectively **migrated** ERC-20 → ERC-1155 rather than
running both in parallel.)

So there are **63 distinct weeks of on-chain Respect settlement** spanning ~2 years, in
two token phases. The OG ERC-20's per-week transfer count is high (438 tx / 33 wk ≈ 13/wk)
because early distribution sent individual transfers (447 of them from `zaal.eth`); ZOR
batches (67 tx / 31 wk ≈ 2/wk, mint `execute` from `0x0`). **Distinct-weeks, not tx count,
is the robust metric.**

## Reconciling with "90+ / 100+ weekly Fractal"

These do **not** contradict — they measure different things:

- **"90+ / 100+ weeks"** = the **Fractal *game* count**: weekly Respect Game sessions,
  recorded off-chain via the **Fractal Discord bot** (see [doc 1069](../1069-fractal-discord-bot-voting-mechanism/))
  and Optimystics. The game predates the on-chain token (OG's first mint is 2024-07-30,
  and the game had already run many weeks by then).
- **"63 weeks"** = the weeks whose results were **settled on-chain** (2024-07 → present).

**Cite discipline:** say which one. *"100+ weekly Respect Games (Discord-recorded), with
on-chain Respect settlement across 63 weeks on Optimism (OG ERC-20 2024–2025 → ZOR ERC-1155
2025–present)."* That sentence is fully defensible and richer than either number alone.

## Correction: OG is Optimism-only (not Base)

[Doc 051](../../community/051-zao-whitepaper-2026/) links the OG Respect contract on
**basescan.org** (twice). That is **wrong**: the OG address `0x34cE…6957` **does not exist
on Base** (0 transfers, no token record on base.blockscout.com). OG Respect is deployed on
**Optimism only**. The Base links in doc 051 should be repointed to Optimism. *(Flagged, not
edited here — doc 051 is a whitepaper doc; left for its owner / Zaal to correct.)*

## Canonical source + verifier

- **`fractal-onchain-facts.json`** — the machine-readable result (weeks, spans, tx counts).
- **`verify-fractal-onchain.py`** — re-runnable, read-only (Blockscout, no key). Enumerates
  both tokens' full transfer history and unions the ISO weeks.

```bash
python3 verify-fractal-onchain.py            # print the reconciled on-chain history
python3 verify-fractal-onchain.py > fractal-onchain-facts.json   # refresh
```

Feeds the [doc 1201 ledger](../1201-zao-canonical-facts-ledger/): the "Fractal weeks" row
moves from *needs-source* to *verified (on-chain settlement = 63 weeks; game count is the
off-chain Discord record)*.

## Also see

- [Doc 1200 - verified on-chain Respect holder facts](../1200-respect-onchain-facts-verified/)
- [Doc 1201 - ZAO canonical facts ledger](../1201-zao-canonical-facts-ledger/)
- [Doc 1069 - Fractal Discord bot voting (the off-chain game record)](../1069-fractal-discord-bot-voting-mechanism/)
- [Doc 942 - Fractal whitepaper outline](../942-zao-fractal-whitepaper-outline-v2/)
