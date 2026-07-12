---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-12
superseded-by:
related-docs:
original-query: "https://docs.unlock-protocol.com/"
tier: STANDARD
---

# 1039 - ZOE research

> Drafted by ZOE's research-worker from "https://docs.unlock-protocol.com/". Auto-committed to main for durability; review + deepen as needed.

I have enough data. Composing the structured research document now.

---

```markdown
---
topic: Unlock Protocol - Onchain Membership and Subscription NFT Infrastructure
type: infrastructure-evaluation
status: draft
last-validated: 2026-07-12
related-docs: []
original-query: https://docs.unlock-protocol.com/
---

## Key Decisions / Recommendations

| Decision Point | Recommendation | Confidence | Rationale |
|----------------|---------------|------------|-----------|
| Adopt Unlock for ZAO membership gating | Yes - prototype on Base | Medium | Native Base support, DAO-governed, open source, no vendor lock-in, fits 188-member scale |
| Integration path | Checkout widget + Unlock.js SDK first | High | No backend required for basic gating; dashboard handles Lock management without new infra |
| Network | Base mainnet | High | ZAO is native to Base; DAO-controlled on Base; lower gas vs Ethereum mainnet |
| Membership token model | ERC-721 Key with on-chain expiration | Medium | Recurring subscription model fits ZAO annual/monthly renewal; expiry enforced automatically |
| Before committing | Evaluate Guild.xyz in parallel | High | Guild.xyz simpler for Farcaster/Discord gating from existing tokens; no payment needed |

---

## Findings

### Protocol Summary

| Dimension | Detail |
|-----------|--------|
| Core concept | Onchain memberships and subscriptions deployed as NFTs on any supported EVM chain |
| Primary objects | Lock = smart contract minting NFTs; Key = the NFT, carries expiration date and metadata |
| Smart contracts | Two contracts: Unlock.sol + PublicLock.sol; audited by 3 independent teams |
| npm package | @unlock-protocol/contracts - compiled artifacts + interfaces; @unlock-protocol/networks for RPC config |
| Governance | UDT token; DAO controls protocol parameters on 8 major networks |
| Open source | Full monorepo on GitHub; retroactive contributor funding via grants program |
| Protocol fees | Defined per-network in the DAO; exact amounts not surfaced in fetched docs (TBD - see Next Actions) |

### Supported Networks (12 Mainnets)

| Network | DAO-Controlled | ZAO Relevant |
|---------|---------------|-------------|
| Base | Yes | Primary - ZAO native chain |
| Ethereum | Yes | High value / legacy |
| Optimism | Yes | OP Stack ecosystem |
| Arbitrum | Yes | L2 ecosystem |
| Polygon | Yes | High activity |
| BNB Chain, Gnosis, Linea | Yes | Secondary |
| zkSync Era, Polygon zkEVM, Celo, Avalanche | No | Tertiary |
| Base Sepolia, Sepolia, Scroll | Testnets | Dev/testing |

### Developer Tool Stack

| Tool | Purpose | Integration Complexity |
|------|---------|----------------------|
| Dashboard | No-code UI to create Locks, manage Keys | None - web UI |
| Checkout | Embeddable purchase and mint flow | Low - drop-in widget |
| Unlock.js | JavaScript SDK for protocol interaction | Medium - npm install |
| Sign in with Ethereum (SIWE) | Wallet-based auth + gating | Medium - SIWE standard |
| Locksmith | Backend service for metadata + webhooks | Medium - self-host or use hosted |
| Subgraph | On-chain data indexing, query membership state | Low - GraphQL queries |
| Hardhat Plugin | Smart contract dev/test environment | Low - Hardhat project add-on |

### Comparison: Onchain Membership / Access Control Tools (4 Options)

| Tool | Payment Collection | Token Model | Chains | No-Code Option | Best Fit | Weak Spot |
|------|-------------------|-------------|--------|---------------|---------|-----------|
| **Unlock Protocol** | Yes - native via Lock | ERC-721 NFT Key with expiry | 12 mainnets incl. Base | Yes (dashboard) | Recurring subscriptions, event ticketing, new memberships with payment | Protocol fee TBD; complex if you only need token gating |
| **Guild.xyz** | No - reads existing tokens | Uses existing ERC-20/721 | EVM + multi-chain | Yes - no-code | Gating Discord/Telegram/GitHub from tokens ZAO already holds | Cannot collect payment; no new token issuance |
| **Thirdweb** | Yes - via NFT sales | Flexible: ERC-721/1155, editions | 900+ chains | Partial (dashboard) | Full NFT commerce, custom drops, edition logic | Verbose for simple recurring subscriptions |
| **Lit Protocol** | No - access control only | Condition-based crypto access | EVM + Solana | No - code required | Encrypted content, programmatic signing conditions | No payment flow; no subscription billing |

**Key differentiator for ZAO:** Unlock is the only option that handles payment collection, token issuance, and on-chain expiry in a single protocol. Guild.xyz wins for zero-friction Farcaster/Discord gating if ZAO already has tokens in members' wallets.

---

## Next Actions

| Action | Owner | By When | Depends On |
|--------|-------|---------|-----------|
| Deploy test Lock on Base Sepolia for ZAO membership prototype | Dev / ZOE | +1 week | @unlock-protocol/contracts npm, Base Sepolia wallet with test ETH |
| Embed Checkout widget on one gated ZAO content page | Dev | +2 weeks | Test Lock deployed, Unlock.js in next.js app |
| Fetch exact protocol fee amounts per network from Unlock DAO governance docs | ZOE research | +3 days | https://docs.unlock-protocol.com/governance/ (not yet fetched) |
| Run parallel Guild.xyz evaluation for Farcaster channel gating (no-payment path) | ZOE research | +3 days | Guild.xyz docs + ZAO token contract addresses |
| Confirm UDT governance alignment with ZAO DAO strategy | Zaal | TBD | ZAO DAO priorities conversation |

---

## Sources

- [FULL - liveness verified 2026-07-12] Unlock Protocol Docs Homepage - https://docs.unlock-protocol.com/
- [FULL - liveness verified 2026-07-12] Core Protocol Overview (smart contracts, audit status) - https://docs.unlock-protocol.com/core-protocol/
- [FULL - liveness verified 2026-07-12] Supported Networks (12 mainnets, DAO governance flags) - https://docs.unlock-protocol.com/core-protocol/unlock/networks
- [FULL - liveness verified 2026-07-12] Developer Tools Overview (Dashboard, Checkout, Unlock.js, Locksmith, Subgraph) - https://docs.unlock-protocol.com/tools/
- [PARTIAL - blog themes and use-case signals only; deep post content not read] Unlock Protocol Blog (32 pages; confirmed: NFT ticketing at Lagos blockchain event, concert ticket case study, DAO monthly newsletters) - https://unlock-protocol.com/blog
- [FAILED - HTTP 404; URL may require auth or org settings block public access] GitHub Discussions - https://github.com/unlock-protocol/unlock/discussions
- [FAILED - HTTP 404] Getting Started / New to Unlock page - https://docs.unlock-protocol.com/getting-started/new-to-unlock
- [FAILED - HTTP 429 rate limited on first try] HN discussion on Unlock Protocol - https://news.ycombinator.com/item?id=38734443
- [FAILED - tool cannot fetch reddit.com] Reddit community discussion - https://www.reddit.com/r/ethereum/search/?q=unlock+protocol

**Community source note:** No Reddit, HN, or GitHub Discussions source was successfully retrieved within the 5-fetch hard cap. The Unlock Protocol blog (PARTIAL above) contains community use-case stories. A DEEP tier redispatch with targeted X/fxtwitter post IDs or cached HN threads would surface practitioner opinion.
```

---

**ESCALATION NOTE:** Community discussion sources (Reddit, HN, GitHub Discussions) all failed to load within constraints. If practitioner sentiment is needed before committing to a prototype, redispatch as DEEP tier with specific post IDs or loosen the fetch cap.
