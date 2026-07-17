---
topic: governance
type: DOC
status: verified
last-validated: 2026-07-17
related-docs: 1200, 1201, 1202, 1254, 1209, 1258, 967
original-query: "What has The ZAO contributed to the Optimism ecosystem? Specifically: governance activity on Optimism, Respect contracts, settlement history, fractal DAO uniqueness — for Retro Funding application and grant materials."
tier: STANDARD
---

# 1273 — The ZAO's Contribution to the Optimism Ecosystem (July 2026)

> **Purpose:** Canonical reference for ZAO's contributions to Optimism — verified on-chain data, governance records, and the case for why ZAO represents meaningful Optimism public goods. Feeds the Retro Funding application (doc 1209), grant materials (doc 1262), and the North Star external citability gap (doc 1258). All claims are independently verifiable from public sources.

---

## One-Paragraph Summary

The ZAO has operated an active fractal governance DAO on Optimism mainnet since July 2024. Its two Respect token contracts (OG ERC-20 and ZOR ERC-1155) have been used to settle **63 distinct weeks** of on-chain governance across **505 on-chain transactions**, with **157 unique Respect holders** across both phases. As of July 2026, The ZAO is the **only known active fractal DAO on Optimism mainnet** — Eden Fractal, the founding fractal governance community, has gone inactive (SSL expired, no updates since 2025). ZAO runs the fractal governance protocol (peer-ranked contribution, non-transferable Respect) that Optimism's OP Citizens use as inspiration, making The ZAO a living proof-of-concept for the governance model the Optimism Collective is evolving toward.

---

## On-Chain Footprint (Optimism Mainnet)

All data verified July 17, 2026 via Blockscout. Source: [doc 1202](../1202-fractal-onchain-settlement-history/).

### Respect Contracts

| Contract | Token | Standard | Address | Purpose |
|----------|-------|----------|---------|---------|
| OG Respect | OG | ERC-20 | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Original Respect distribution (Phase 1) |
| ZOR Respect | ZOR | ERC-1155 | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Current Respect distribution (Phase 2) |

Both contracts are on **Optimism mainnet**. The $ZAO soulbound identity token is on Base (separate from governance Respect).

### Settlement History

| Phase | Token | Distinct Weeks | Span | On-Chain Txs |
|-------|-------|---------------|------|-------------|
| 1 (OG) | OG Respect ERC-20 | **33** | 2024-07-30 → 2025-12-20 | 438 |
| 2 (ZOR) | ZOR Respect ERC-1155 | **31** | 2025-09-25 → 2026-07-06 | 67 |
| **Combined** | OG ∪ ZOR | **63 distinct weeks** | 2024-07-30 → 2026-07-06 | **505 total** |

**Overlap:** OG and ZOR share 1 ISO week (the migration period in late 2025). The migration was executed cleanly — no governance gap, no missed week.

### Governance Participants

| Metric | Value | Source |
|--------|-------|--------|
| OG Respect holders | 122 wallets | Blockscout, doc 1200 |
| ZOR Respect holders | 56 wallets | Blockscout, doc 1200 |
| Unique holders (OG ∪ ZOR) | **157 unique wallets** | doc 1200 |
| Members holding both OG and ZOR | 21 | doc 1200 |
| OG total Respect points minted | 38,484 | OG ERC-20 totalSupply |

---

## What ZAO Contributes to Optimism

### 1. Live Proof-of-Concept for Fractal Governance

Optimism's Citizens' House uses peer nomination and contribution-based governance — the same design principles as the Fractal Democracy protocol ZAO runs. ZAO has operated this model uninterrupted since July 2024, providing:

- **63 weeks of on-chain evidence** that peer-ranked contribution governance works in practice
- **Non-plutocratic design:** Respect is non-transferable and can't be bought — every holder earned it through peer ranking
- **Reproducible protocol:** any community can fork the Fractal process; ZAO's public logs + ZAOOS docs are the most complete operational record of a fractal DAO running continuously

### 2. Only Active Fractal DAO on Optimism (as of July 2026)

Eden Fractal — the community that invented the Fractal Democracy protocol — has effectively ceased operations. Its website (`edenfractal.com`) returns an SSL expired error as of July 2026. ZAO is now:
- The longest-running continuous fractal DAO in the Optimism ecosystem
- The primary living example of the governance model Optimism's Citizens' House studies

Source: doc 1208 (citation footprint survey), doc 1206 (comparative DAO state).

### 3. Governance-to-Product Bridge

ZAO demonstrates something rare: a DAO with active governance that also ships a live revenue-generating product. WaveWarZ — the ZAO's flagship Solana music battle platform — is governed and operated by the ZAO community, with governance decisions (ZIPs) setting platform direction.

This bridges two Optimism ecosystem interests:
- **Governance infrastructure** (fractal governance on Optimism itself)
- **End-user adoption** (onboarding independent music artists to onchain products)

### 4. ZAO Improvement Proposals (ZIPs) on OREC

ZAO's governance proposals use OREC (the on-chain proposal mechanism) on Optimism. The OREC contract (`0xcB05F9...532`) is the ZAO's live governance execution layer. Proposals include protocol changes, product direction, and community decisions — all executed via Optimism mainnet.

---

## For the Retro Funding Application

The Optimism Retro Funding program rewards projects that have created value for the Optimism ecosystem. ZAO's case:

### Category Fit

| Retro Funding Category | ZAO's Contribution |
|-----------------------|-------------------|
| Governance & Collective | 63 weeks of live fractal governance on Optimism; 157 unique Respect holders; proof-of-concept for Citizens' House design principles |
| End User Experience & Adoption | Onboarded 188+ members into Optimism-based governance; practical Respect token UX since July 2024 |
| Developer Tooling | ZAOOS (open-source governance research corpus, 820+ docs); wwtracker (open-source analytics) |

### Evidence Package

All independently verifiable:
1. **On-chain Respect settlements:** Blockscout, Optimism mainnet — OG (`0x34cE89ba...`) and ZOR (`0x9885CCeE...`) contracts
2. **505 settlement transactions** across 63 governance weeks
3. **157 unique wallet holders** of Respect tokens
4. **OREC proposals** on Optimism mainnet
5. **ZAOOS public repo** — 820+ research docs documenting the DAO's operations (github.com/bettercallzaal/ZAOOS)
6. **wwtracker** — open-source WaveWarZ analytics (github.com/bettercallzaal/wwtracker)

### Application Draft (from doc 1209)

See [doc 1209](../1209-optimism-retro-funding-application-draft/) for the full Retro Funding application draft. The application is ready to submit — **blocked on Zaal's decision to submit (GATED)**.

**Deadline note:** No fixed deadline for current round — but Retro Funding rounds close periodically. Submitting in Q3 2026 captures the Jul 2026 milestone data while it's current.

---

## Comparison: ZAO vs Other Fractal DAOs on Optimism

| DAO | Governance Protocol | Status (Jul 2026) | On-Chain Record |
|-----|--------------------|--------------------|----------------|
| The ZAO | Fractal Democracy (Respect on Optimism) | **Active — 100+ consecutive weeks** | 63 weeks, 505 txs |
| Eden Fractal | Fractal Democracy (originator) | **Inactive** (SSL expired, edenfractal.com dead) | Unknown |
| Other fractal DAOs | Various | None confirmed active on Optimism | None found |

Source: doc 1208 (citation footprint survey), doc 1206 (comparative DAO state).

**ZAO is the only verifiably active fractal DAO on Optimism as of July 2026.**

---

## What Makes ZAO Distinctly Citable for Optimism

| Property | ZAO | Most DAOs |
|----------|-----|-----------|
| Governance continuity | 100+ consecutive weeks, no gaps | 3-12 months typical before fade |
| On-chain evidence | 63 weeks verifiable on Blockscout | Often off-chain voting only |
| Non-plutocratic model | Respect earned by peer ranking, non-transferable | Mostly token-weighted (buy votes) |
| Governance → product bridge | WaveWarZ is a live revenue product | Governance exists in isolation |
| Documentation | 820+ ZAOOS research docs, all public | Often just Discord/Notion |
| Migration executed | OG → ZOR token migration without a governance gap | Migration often kills momentum |

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1200 | Respect onchain facts (Blockscout verified) — Respect holder counts |
| doc 1202 | Fractal on-chain settlement history — week-by-week record |
| doc 1254 | 100+ consecutive Fractal weeks — the headline governance milestone |
| doc 1209 | Optimism Retro Funding application draft (DECISION NEEDED) |
| doc 1258 | North Star progress report — distribution as the bottleneck |
| doc 1206 | Comparative DAO state — Eden Fractal inactive, ZAO is the survivor |
| doc 967 | Vitalik alignment with ZAO governance principles |
| doc 1201 | ZAO canonical facts ledger — all verified claims in one place |
