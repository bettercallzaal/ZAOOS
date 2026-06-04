# 797 — Azos Finance: Impact-Backed Stablecoin Protocol on Base

> **Status:** Research complete
> **Date:** June 4, 2026
> **Type:** STANDALONE — external protocol analysis (potential partner / reference architecture)
> **Goal:** Decide whether The ZAO should integrate, partner with, or fork Azos Finance — a Base-native over-collateralized stablecoin protocol that mints AZUSD against tokenized climate-impact assets.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Same chain = low-friction integration** | Azos runs on **Base** — the exact chain ZAO already uses (Base, 188 members, contracts in `community.config.ts`). AZUSD can be accepted as a tipping/treasury asset with zero bridging. PRIORITIZE Azos over any L1/L2-native stablecoin that would force a bridge. |
| **Fits the ReFi thread ZAO is already pulling** | Azos is regenerative finance (carbon credits, RECs, green bonds as collateral). This extends docs 791 (charity-fund token mechanism) and 794 (Tasern charity vaults / ReFi funding) — ZAO already has a regen-treasury direction. USE Azos as the stablecoin layer for that thread rather than minting a bespoke ZAO stable. |
| **Fork-able architecture (HAI lineage)** | Azos is built on the **HAI protocol** (the `hai-app` repo is **MIT**; HAI descends from Reflexer RAI / GEB). The battle-tested CDP + AMO machinery is forkable. SKIP building a stablecoin from scratch — if ZAO ever needs one, fork HAI/Azos lineage. |
| **Governance pattern maps to ZOUNZ/Respect** | AZOS is an ERC-20 governance token used for parameter votes + debt/surplus auctions. This is the same shape as ZAO's ZOUNZ Governor + Respect-weighted voting (docs 131/133). STUDY Azos's auction module before building any ZAO treasury-auction mechanism. |
| **Partner, don't rebuild** | The Azos team (7 core contributors) is in ZAO's orbit. The right move is a PARTNERSHIP — accept AZUSD, co-market the ReFi angle — NOT cloning a stablecoin protocol ZAO has no mandate to run. Flag a treasury-policy decision to Zaal before holding AZUSD. |

---

## What Azos Finance Is

Azos is a **third-generation, over-collateralized stablecoin protocol on Base** built on **AMO** ("Algorithmic Market Operations," also styled AMMO) technology. Users mint the stablecoin by depositing **tokenized impact assets** — carbon credits, renewable energy certificates (RECs), green bonds, and sustainable commodities.

### Token model (naming is mid-rebrand)
- **ZAI** — the internal stable token name in the contracts/docs (supply expanded/contracted by the Stability Module).
- **AZUSD** — the market-facing brand: "the world's first stablecoin backed by climate-positive assets." Treat ZAI and AZUSD as the same stable token at two naming layers.
- **AZOS** — ERC-20 governance token. Votes on system parameters; backstops the system via debt/surplus auctions.

### Stability Module (first AMO)
The Stability Module safely **expands and contracts ZAI supply** to keep its market price inside a target band — the same peg-defense pattern RAI/HAI use, automated as an AMO rather than relying purely on arbitrage.

### Oracle
**DIA decentralized oracles** price the impact-asset collateral on Base — a non-trivial problem, since carbon credits and RECs have no deep on-chain price feeds by default.

---

## Comparison: Stablecoin Options for a ZAO Treasury / Tipping Asset

| Option | Chain | Backing | Decentralized? | ReFi angle | Fit for ZAO |
|--------|-------|---------|----------------|------------|-------------|
| **Azos AZUSD** | Base | Tokenized impact assets (carbon/RECs) | Yes (over-collateralized CDP) | Native — capital flows to climate | HIGH — same chain, same regen thesis |
| **USDC** | Base | Fiat reserves (Circle) | No (centralized issuer) | None | Medium — liquid but no mission fit |
| **DAI / sky USDS** | Multi (bridge to Base) | Crypto + RWA | Partly | Weak | Medium — proven, but no ReFi story |
| **Bespoke ZAO stable** | Base | Would need collateral + peg infra | Yes (if built) | Whatever ZAO chooses | SKIP — no mandate, high maintenance |

AZUSD wins on **mission + chain alignment**; USDC wins on **raw liquidity**. The pragmatic stack: hold USDC for liquidity, accept/co-market AZUSD for the regen narrative tied to docs 791/794.

---

## Reference Implementation (HAI / Azos lineage)

| Repo (org `AzosFinance`) | Language | License | What it is |
|--------------------------|----------|---------|------------|
| `azos-protocol` | Solidity | Other (review before reuse) | Core CDP + AMO contracts |
| `azos-core` | Solidity | Other | Core contract library |
| `hai-app` | TypeScript | **MIT** | Upstream HAI app — safe to learn from |
| `azos-subgraph` | TypeScript | — | The Graph indexing (pattern for ZAO subgraphs) |
| `azos-hackathon-keeper` | Rust | — | Stability "keeper" bot (off-chain automation pattern) |
| `audits` | — | — | Security audit reports |

**License caution:** the two Solidity repos are licensed "Other," not a standard OSI license — per CLAUDE.md ("No license = assume proprietary"), do NOT copy contract code without explicit permission. The MIT `hai-app` and the public HAI/GEB lineage are the safe study targets.

---

## ZAO OS Integration

| Azos element | ZAO surface | File / path |
|--------------|-------------|-------------|
| AZUSD as tip/treasury asset on Base | Tip button (already built) + token gate | `src/lib/agents/types.ts` (tokens/contracts), `community.config.ts` (contracts) |
| Accept AZUSD in payments | Payment routes | `src/app/api/` payment/publish routes; cross-ref doc 406 (Coinflow ISV) |
| Governance auctions | ZOUNZ Governor + Respect voting | `src/components/zounz/`, `src/app/api/respect/` (docs 131/133) |
| Impact/charity flows | Regen treasury thread | docs 791 (charity-fund token), 794 (Tasern charity vaults) |
| Subgraph indexing pattern | On-chain data reads | mirror `azos-subgraph` approach for ZAO contract indexing |

Concrete first step: add the AZUSD token address to ZAO's known-token list in `src/lib/agents/types.ts` / `community.config.ts` so the existing tip + gate plumbing recognizes it — no new contracts required. Treasury policy (whether ZAO *holds* AZUSD) is a Zaal decision per CLAUDE.md "Ask first: changes to agent trading parameters / treasury."

---

## Open Questions to Resolve With the Azos Team

- INVESTIGATE: Is AZUSD live on Base mainnet or testnet only? (`app.azos.finance` is labeled "Launch App / Testnet" — confirm mainnet status + TVL before treasury use.)
- INVESTIGATE: Current AZUSD liquidity depth on Base DEXs — thin liquidity makes it unsafe as a primary treasury hold.
- INVESTIGATE: Are the `azos-protocol` contracts audited (the `audits` repo exists) — get the report before any integration.

---

## Sources

- [Azos Finance — website](https://www.azos.finance/)
- [Azos Docs — Protocol 101](https://docs.azos.finance/docs/intro/protocol/)
- [AzosFinance GitHub org](https://github.com/AzosFinance)
- [DIA × Azos oracle partnership](https://www.diadata.org/blog/post/partnership-with-azos-finance-stablecoin/)
- [Azos on RootData](https://www.rootdata.com/Projects/detail/Azos?k=MTQ4MTk%3D)
- [Azos on Messari](https://messari.io/project/azos-finance/profile)
- [Doc 791 — Charity Fund Token Mechanism (Regen)](../791-charity-fund-token-mechanism-regen/)
- [Doc 794 — Tasern Charity Vaults / ReFi Funding](../794-tasern-charity-vaults-refi-funding-pattern/)
