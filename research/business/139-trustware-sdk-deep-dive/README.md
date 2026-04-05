# 139 — Trustware SDK: Secure Crypto Payments & Asset Infrastructure

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Evaluate Trustware as infrastructure for ZAO OS on-chain music payments and asset management

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use for ZAO payments?** | NOT YET — Trustware is early-stage (Techstars '23, $120K pre-seed). SDK exists but docs redirect to HackMD. Monitor but don't depend on. |
| **What it does** | Non-custodial crypto vault middleware — hardware wallet security with software wallet UX, multi-chain deposits |
| **ZAO fit** | Could power "pay with any token" for music NFT purchases, but 0xSplits + Zora are more mature for music-specific flows |
| **Alternative** | USE Zora Protocol SDK + 0xSplits for music NFT distribution. Use Trustware as optional payment layer later. |

## What Trustware Is

[Trustware](https://www.trustware.io/) is a blockchain middleware company founded in 2022 by Norma Carty and Jonathan Frazier (Wilmington, DE). Techstars '23 cohort with $120K pre-seed ([Tracxn](https://tracxn.com/d/companies/trustware/__Qm_DcTeTxOh8Mf83UAPp3yd4ObrH2hRitCV8KhILVNE), [Crunchbase](https://www.crunchbase.com/organization/trustware)).

**Core product:** A secure, recoverable, non-custodial crypto vault that:
- Accepts deposits from any blockchain with zero integration complexity
- Lets users pay with any token on any chain
- Delivers preferred asset instantly (cross-chain swaps)
- Hardware wallet-level security with software wallet usability
- Decentralized key management + multi-sig authentication
- Social network layer for peer-to-peer value transfer

**SDK components** (from docs.trustware.io, now redirecting to HackMD):
- Vault SDK — asset storage and management
- Adapters — chain-specific connectors
- Smart Contracts — vault logic
- Decentralized Data — off-chain storage
- Decentralized Keys — key management

**Demo:** [sdk.trustware.io/home](https://sdk.trustware.io/home) — shows the user experience for crypto payments

## How It Could Fit ZAO OS

### Potential Use Cases
1. **Universal payment for music NFTs** — "Pay with any token on any chain" removes friction for collectors
2. **Artist payout vault** — Non-custodial vault where royalties accumulate across chains
3. **Cross-chain deposits** — ZAO members on different chains (Base, Optimism, Ethereum) can all participate

### Why NOT to Use It Now
- **Early stage** — $120K funding, small team, SDK docs incomplete (redirect to HackMD login)
- **No music-specific features** — Generic payment middleware, not optimized for music/NFT flows
- **Zora + 0xSplits are production-ready** — Battle-tested, $500M+ processed through Splits alone
- **No Base chain confirmation** — Unclear if Trustware supports Base (ZOUNZ chain)

### When to Revisit
- When Trustware launches public SDK v1 with documented APIs
- When they add Base chain support
- When ZAO needs cross-chain payment abstraction beyond what Zora provides

## Competitive Comparison

| Feature | Trustware | Zora + 0xSplits | Coinbase Commerce |
|---------|-----------|-----------------|-------------------|
| Multi-chain payments | Yes (core feature) | Base/Zora/ETH/OP | ETH/Base/Polygon |
| Music-specific | No | Yes (1155 editions, audio metadata) | No |
| Revenue splits | Unknown | Yes (automated) | No |
| Self-custody | Yes (vault) | Yes (contracts) | No (custodial) |
| Maturity | Pre-seed | Production ($500M+) | Production |
| Open source | Unknown | Yes (MIT) | Partial |

## ZAO OS Integration Point

If Trustware matures, the integration point would be:
- `src/lib/payments/trustware.ts` — payment abstraction layer
- Used alongside existing `src/lib/zounz/contracts.ts` (ZOUNZ auction bids)
- Would NOT replace Zora minting or 0xSplits distribution

## Sources

- [Trustware Website](https://www.trustware.io/)
- [Trustware SDK Demo](https://sdk.trustware.io/home)
- [Tracxn Profile](https://tracxn.com/d/companies/trustware/__Qm_DcTeTxOh8Mf83UAPp3yd4ObrH2hRitCV8KhILVNE)
- [Crunchbase Profile](https://www.crunchbase.com/organization/trustware)
- [Trustware LinkedIn](https://www.linkedin.com/company/trustwareio)
- [HackMD Docs](https://hackmd.io/@trustware)
