# 1205 - ZAO onchain contract registry (verified)

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Verified from chain state
**Owner:** builder loop

## Why this doc exists

The ZAO's contract addresses are cited in 30+ research docs but scattered and never
consolidated or verified in one place. For the North Star - *the documented, **cited**
DAO* (#1) whose *IP is a staple in onchain art, music, and culture* (#2) - the single
most basic citable artifact is **"here are the ZAO's onchain contracts, verified."**
This is that registry. Sibling of [doc 1200](../1200-respect-onchain-facts-verified/)
(Respect holder facts) and [doc 1202](../1202-fractal-onchain-settlement-history/)
(Fractal on-chain history).

## The registry (verified 2026-07-17, Blockscout, no key)

| Contract | Address | Chain | Type | Live state | Role |
|----------|---------|-------|------|-----------|------|
| **OG Respect** | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Optimism | ERC-20 | "ZAO RESPECT TOKEN", 122 holders, 38,484 supply | Soulbound governance Respect, phase 1 (2024-25) |
| **ZOR Respect** | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Optimism | ERC-1155 | "ZAO Fractal Respect", 56 holders | Governance Respect, phase 2 (2025-present) |
| **OREC** | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | Optimism | contract (source-verified) | on-chain name "Orec" | Optimistic Respect-based Executive Contract - settles Fractal outcomes (72h+72h window) |
| **ZOUNZ** | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` | Base | ERC-721 | "ZOUNZ", 15 minted, 3 holders | ZABAL Nouns-style DAO - daily NFT auction, treasury funds music releases (north-star #2) |
| **ZABAL** | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` | Base | ERC-20 | "ZABAL", **351 holders**, 100B supply | ZABAL Gamez / leaderboard token - the ecosystem's largest onchain holder base |
| Hats Protocol | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` | Base + Optimism | ERC-1155 | shared protocol (deterministic address) | Not ZAO-deployed; the ZAO uses it for roles / the Hats tree. Listed for completeness. |

Notes:
- **157 unique Respect holders** across OG (122) + ZOR (56); 21 hold both (see [doc 1200](../1200-respect-onchain-facts-verified/)).
- Two Respect **chains of record**: OG + ZOR + OREC live on **Optimism**; ZOUNZ + ZABAL live on **Base**. The ZAO's onchain estate spans both.
- **ZABAL (351 holders)** is a larger holder base than Respect (157) - worth noting when describing ZAO reach; it is a Gamez/leaderboard token, distinct from the soulbound Respect governance line.
- Standard predeploys (`0x4200...0006` WETH, `0x4200...0021`), USDC (`0x8335...2913`), Farcaster registries (`0x0000...59b7e`), and wallet addresses (e.g. `0x7234...E9Af` = zaal.eth) appear in the research corpus but are **not** ZAO contracts and are excluded here.

## Verifier

- **`verify-contracts.py`** - re-runnable (Blockscout `/api/v2`, read-only, no key). Prints the live type/name/holders for each ZAO contract on its chain.

```bash
python3 verify-contracts.py
```

## Reconciliation / cite discipline

- When citing "the ZAO onchain," name the **chain** - Respect governance is **Optimism**;
  ZOUNZ + ZABAL are **Base**. A single "ZAO is on X" is wrong; it is multi-chain.
- ZABAL's 351 holders is a real reach metric but is **not** governance weight - Respect
  (soulbound, peer-earned) is the governance currency, ZABAL is a Gamez/utility token.
- This registry is the single source for ZAO contract addresses; other docs should link
  here rather than re-pasting addresses (same single-source discipline as the facts ledger
  [1201](../1201-zao-canonical-facts-ledger/)).

## Also see

- [Doc 1200 - verified Respect holder facts](../1200-respect-onchain-facts-verified/)
- [Doc 1202 - Fractal on-chain settlement history](../1202-fractal-onchain-settlement-history/)
- [Doc 1201 - ZAO canonical facts ledger](../1201-zao-canonical-facts-ledger/)
- [ICM boxes](../../identity/icm-boxes/) (fractal box carries OG/ZOR/OREC addresses)
