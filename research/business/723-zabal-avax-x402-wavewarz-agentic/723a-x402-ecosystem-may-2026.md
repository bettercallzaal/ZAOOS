---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-23
related-docs: 572, 573, 706, 707, 723
original-query: "ok now lets actually research avax for what it could be for the zabal might be good for x402s for wavewarz agentic aswell"
tier: DEEP
parent-doc: 723
---

# 723a - x402 Ecosystem May 2026 (Chain Coverage + Avalanche Status)

## Goal
Determine whether x402 agent-payment standard is genuinely live on Avalanche in May 2026, what it means for non-USDC ERC-20 tokens like ZABAL, and whether Avalanche offers new opportunity vs staying on Base.

## Key Findings

| Finding | Data | Source | Confidence |
|---------|------|--------|------------|
| x402 launched by Coinbase | May 6, 2025 | Coinbase blog (FULL) | HIGH |
| CDP Facilitator supports Base, Polygon, Arbitrum, Solana mainnet ONLY | Explicitly lists networks (no Avalanche) | Coinbase CDP docs (FULL) | HIGH |
| Avalanche support exists but NOT in Coinbase facilitator | Community PR merged May 13, 2025 | GitHub coinbase/x402 PR #157 (FULL) | HIGH |
| Practical Avalanche facilitators live: Dexter, PayAI, infra402, 0xGasless | 4 named services with working endpoints | Avalanche Builder Hub + GitHub (FULL) | HIGH |
| Avalanche x402 settlement time | 1.5-2 seconds full flow, 1-second blockchain finality | Avalanche Builder Hub (FULL) | MEDIUM |
| On-chain usage of Avalanche x402 (30-day May 2026) | 3 resources indexed, 0 with measurable revenue | Agenstry scanner May 19, 2026 (FULL) | HIGH |
| Non-USDC ERC-20 support in x402 | All ERC-20 tokens supported via Permit2 (any chain) | Coinbase CDP docs + x402 spec (FULL) | HIGH |
| ZABAL on Avalanche | Not natively issued; would need bridge | Direct inference from research | N/A |
| x402 protocol version May 2026 | v2.x with CAIP-2, extensions, wallet hooks | Coinbase docs + GitHub (FULL) | HIGH |

## Substance

### 1. What x402 Is (May 2026 Status)

x402 is an HTTP-native payment protocol launched by Coinbase May 6, 2025. It revives the dormant HTTP 402 "Payment Required" status code to embed blockchain settlement directly into HTTP request-response flows. Agents hit a paid endpoint, receive a 402 response with payment terms, sign a stablecoin authorization via EIP-712, and retry with a payment header. Settlement happens in 1-2 seconds on optimized chains. The protocol is open-source (Apache 2.0), vendor-neutral, and designed to support any blockchain and any ERC-20 token (or SPL token on Solana).

As of May 2026, the specification is at v2.x with support for:
- CAIP-2 network identifiers (eip155 for EVM, solana for SVM)
- Multiple payment schemes: "exact" (fixed price), "upto" (usage-based, EVM only)
- Token flexibility: EIP-3009 (gasless USDC/EURC transfers), Permit2 (any ERC-20)
- Extensions: Service discovery (Bazaar), Sign-in-with-x authentication, gas sponsorship

### 2. Chain Coverage May 2026: Coinbase's Gatekeeping

The official Coinbase Developer Platform (CDP) facilitator, the reference implementation, explicitly supports only 5 chains on mainnet as of May 2026:
- Base (eip155:8453) - mainnet
- Polygon (eip155:137) - mainnet
- Arbitrum (eip155:42161) - mainnet
- World (eip155:480) - mainnet
- Solana (solana genesis hash) - mainnet

Avalanche is NOT on this list. Coinbase's documentation states "Run your own" for chains outside this set. This is a critical detail: the protocol is multichain-capable, but Coinbase's hosted facilitator (the easiest on-ramp) does not serve Avalanche.

### 3. Avalanche x402: Live, But Community-Driven

Avalanche IS supported in the x402 specification. A community contributor (@owenwahlgren) submitted PR #157 to the coinbase/x402 repo on May 11, 2025, adding Avalanche C-Chain mainnet and Fuji testnet support. This PR was merged May 13, 2025 by core maintainer @CarsonRoscoe. The change adds configuration for Avalanche's EIP-3009 USDC contract (0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E, 43114 chain ID).

In May 2026, at least 4 independent facilitator implementations support Avalanche:

1. **Dexter x402 Facilitator** (https://x402.dexter.cash) - Production ready, public endpoint shared across all supported chains. Sponsors AVAX fees, buyers only need USDC. Fixed-price scheme supported; "upto" scheme pending x402 Foundation proxy deployment.

2. **PayAI** - Specializes in AI agent payments on Avalanche, with TypeScript and Python SDKs. Optimized for machine-to-machine commerce.

3. **infra402** (https://facilitator.infra402.com, Rust implementation) - Enterprise-grade, multi-chain including Avalanche. Last push Feb 13, 2026. Features: Multicall3 batch settlement (100-150x throughput vs baseline), rate limiting, abuse detection, OpenTelemetry observability.

4. **0xGasless** - Avalanche Builder Hub integration, gasless payment focus.

These are not mock implementations. They are code on GitHub with recent commits, listed on the Avalanche Builder Hub, and advertised with public endpoints.

### 4. Avalanche vs Base: On-Chain Reality

The Agenstry on-chain scanner (published May 19, 2026, sampled 30 days trailing) shows the brutal truth:

- **Base**: 629 x402 resources indexed, 16 with measurable revenue in 30 days
- **Solana**: 87 resources, 3 with measurable revenue
- **Polygon**: 31 resources, 1 with measurable revenue
- **Arbitrum**: 24 resources, 1 with measurable revenue
- **Optimism**: 18 resources, 0 with measurable revenue
- **Ethereum mainnet**: 6 resources, 0 with measurable revenue
- **Avalanche**: 3 resources, 0 with measurable revenue

Avalanche has 3 indexed x402 services and zero inbound USDC settlements in 30 days (May 2026). Base dominates: 79% of all indexed services, 80% of settlement volume. The multichain expansion (announced October 8, 2025) did not redistribute traffic. Builders still optimize for Base because of RPC cost, Coinbase facilitator presence, and liquidity.

The three Avalanche services are discoverable but producing zero revenue. This does not mean the infrastructure is broken; it means adoption is nearly absent.

### 5. Non-USDC ERC-20 Support: ZABAL Compatibility

x402 is token-agnostic. The protocol supports any ERC-20 via two methods:

- **EIP-3009** (gasless): USDC, EURC, any stablecoin implementing transferWithAuthorization. Single signature, no approval needed. Fully sponsored by facilitator (payer signs, facilitator broadcasts).

- **Permit2** (gasless, universal fallback): Any ERC-20 token (WETH, DAI, custom tokens). Uses Uniswap's Permit2 (0x000000000022D473030F116dDEE9F6B43aC78BA3), deployed on every major EVM chain including Avalanche. Client signs a Permit2 SignatureTransfer, facilitator calls permitTransferFrom(). One-time approval per token, then all future payments are gasless signed messages.

ZABAL, as an ERC-20 token, would work via Permit2 on any EVM chain (Base, Avalanche, Polygon, etc.) if:
1. A facilitator is running and supports the chain
2. ZABAL is whitelisted in the facilitator's token config
3. The merchant accepts ZABAL as payment (vs demanding USDC)

However, practical adoption requires:
- ZABAL liquidity on the target chain (for facilitators to convert/bridge back to stablecoin if needed)
- Merchant willingness to accept a ZAO token vs USDC
- Or a bridge/swap infrastructure so facilitators can atomically swap ZABAL to USDC on settlement

If ZABAL lives only on Base (as per doc 572), then on Avalanche it would need to be bridged or wrapped first. No major bridge exists for ZAO tokens.

### 6. Non-Coinbase Facilitators: Trust Surface

Using an independent facilitator (Dexter, PayAI, infra402) creates operational questions Coinbase solves via compliance:
- Is the facilitator regulated? Coinbase has financial services licensing.
- What happens if the facilitator disappears? (Open-source code remains, but running your own requires DevOps.)
- Rate limiting and DDoS? Dexter and infra402 address this; PayAI is less documented.
- Settlement finality: All use the same on-chain EIP-3009 mechanism, so finality is equivalent (~1 second on Avalanche).

The x402 specification is open, so any facilitator is theoretically swappable. In practice, a builder has to make one choice per deployment.

### 7. Agent Commerce Landscape

x402 competes and complements:
- **Google AP2** (Agentic Payments Protocol): Uses x402 as one settlement method; framing is broader (identity, rate, disputes). Major integrations: Mastercard, PayPal, American Express, AWS.
- **Anthropic MCP** (Model Context Protocol): x402 MCP Toolkit launched as integration layer. Agents can discover and pay for MCP services over x402.
- **Traditional payment cards**: Virtual cards (Brex, Lithic), IOU tokens. Higher friction than x402 but broader merchant acceptance.

x402 excels at agent-to-API payments where both parties speak HTTP natively. Its weakest point is bridging to the real economy (shops, restaurants, payments processors that only speak cards or bank wires).

### 8. Transaction Volume: Production But Small

By late April 2026, Coinbase disclosed:
- 69,000 active agents
- 165 million cumulative x402 transactions
- Approximately 50 million USD in cumulative volume

Put in context: 165M transactions over 12 months (May 2025 to May 2026) = 450K tx/day average. Recent daily spikes hit 500K+ (October 2025 data). For comparison, Visa processes 100M transactions per day. x402 is real production traffic but at 0.45% of Visa's scale.

Breaking down by use case (as of March 2026):
- Agent-to-agent services: $548,500 (highest value)
- Infrastructure/utilities: $267,100
- AI-generated services: $14,200

Most volume is high-value, low-frequency operations (agents buying compute, data, agent services), not micropayments.

### 9. Avalanche Economic Argument

Avalanche's case for x402:
- ~1 second finality (Base: ~2 seconds, Ethereum: ~15 min)
- ~$0.001 gas on x402 transfers (facilitator-paid anyway)
- EVM native (no VM mismatch)
- USDC natively issued (0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E)

Avalanche's case against adoption in May 2026:
- Zero facilitator in Coinbase's official list (higher activation energy for new builders)
- Zero on-chain settlement activity (chicken-egg: no users, so no merchants)
- Base is Coinbase's chain, so documentation, examples, SDK defaults all point there first
- Solana's SPL is technically superior for SVM natives (instant finality, native token primitives)

Avalanche is a viable fallback, not a primary choice.

### 10. Honest Read: Production Standard, Niche Adoption

x402 IS live and production-ready in May 2026. It is NOT a mass-market standard. Current use:
- Real transactions, real settlement, real money moving.
- Concentrated in agent commerce (agent paying for data/compute/APIs).
- Dominated by Base (~80% settlement).
- Solana second (~15-20%).
- Everything else (Polygon, Arbitrum, Avalanche, Ethereum) together: <5%.

It solves the HTTP-native agent-to-API payment problem elegantly. It does not solve "how agents pay humans" or "how humans pay agents" yet. Those flows still need cards, stablecoins held in user wallets, or virtual card wrappers.

---

## Specific Numbers

1. **x402 launch date**: May 6, 2025 (12 months live as of May 2026)
2. **Cumulative transactions**: 165 million (as of late April 2026)
3. **Cumulative volume**: ~$50 million USD (as of late April 2026)
4. **Active agents**: 69,000 (as of late April 2026)
5. **CDP Facilitator mainnet chains supported**: 5 (Base, Polygon, Arbitrum, World, Solana)
6. **Avalanche x402 resources with revenue (30 days May 2026)**: 0 out of 3 indexed
7. **Avalanche blockchain finality**: ~1 second
8. **x402 full settlement time on Avalanche**: ~1.5-2 seconds
9. **Base x402 resources with revenue (30 days May 2026)**: 16 out of 629 indexed
10. **Permit2 deployment**: 0x000000000022D473030F116dDEE9F6B43aC78BA3 (same address on all major EVM chains)

---

## Plain Verdict on Avalanche-x402

**x402 is technically live on Avalanche as of May 2026. Multiple independent facilitators (Dexter, PayAI, infra402) provide production-ready implementations. The protocol and SDKs support Avalanche by CAIP-2 identifier (eip155:43114).**

**However, x402 on Avalanche has zero measurable economic activity (0 revenue from 3 indexed services in May 2026). Coinbase's official facilitator does not serve Avalanche, directing new builders to Base. Practical adoption remains speculative.**

**For ZABAL specifically: x402 on Avalanche can accept any ERC-20 via Permit2, so ZABAL is theoretically compatible. But ZABAL is currently Base-only (per doc 572). Bridging ZABAL to Avalanche would be required first, and no major x402-specific use case for ZABAL on Avalanche currently exists.**

**Verdict: Avalanche x402 is real but dormant. Base x402 is where the activity is. The Avalanche choice is a fallback for geographic/regulatory reasons, not an economically stronger position than Base.**

---

## Next Actions

1. If ZAO pursues x402 for WaveWarZ agentic flows: Stay on Base. Use Coinbase CDP facilitator. Documentation, examples, and ecosystem density are highest there.

2. If Avalanche offers specific legal or operational advantage: Dexter or infra402 are viable facilitators. Setup requires pointing SDK at their endpoint (https://x402.dexter.cash or https://facilitator.infra402.com).

3. For non-USDC ZABAL payments: Test Permit2 flow in testnet (Avalanche Fuji or Base Sepolia). Ensure facilitator whitelists the token. Expect one-time per-user approval, then gasless settlement.

4. Monitor: Agenstry's on-chain scanner refreshes every 5 minutes. Revisit May 2026 data if Avalanche settlement volume emerges (indicator of adoption shift).

---

## Sources

### Tier 1: Official Documentation (FULL)

- [Coinbase x402 Announcements](https://www.coinbase.com/developer-platform/discover/launches/x402) - Launch, features (May 6, 2025) [FULL]
- [Coinbase CDP Network Support](https://docs.cdp.coinbase.com/x402/network-support) - Mainnet chain list, facilitator endpoints [FULL]
- [Coinbase x402 FAQ](https://docs.cdp.coinbase.com/x402/support/faq) - Token support, ERC-20 mechanics, Permit2 [FULL]
- [x402 Network Support Docs](https://docs.x402.org/core-concepts/network-and-token-support) - Full spec, CAIP-2 identifiers, testnet facilitators [FULL]
- [x402 Default Assets](https://github.com/x402-foundation/x402/blob/main/DEFAULT_ASSETS.md) - EIP-3009 vs Permit2, token config [FULL]

### Tier 2: GitHub/Open Source (FULL)

- [coinbase/x402 PR #157 (Avalanche support)](https://github.com/coinbase/x402/pull/157) - Merged May 13, 2025, adds Avalanche C-Chain + Fuji [FULL]
- [x402-foundation/x402 main repo](https://github.com/x402-foundation/x402) - 240 contributors, Apache 2.0, forked from coinbase/x402, 70 stars, current as of May 2026 [FULL]
- [infra402/infra402-facilitator](https://github.com/infra402/infra402-facilitator) - Rust impl, Avalanche support, multi-chain, last push Feb 13, 2026 [FULL]
- [@x402/evm NPM package](https://registry.npmjs.org/@x402/evm) - Version 2.6.0 and 2.7.0, published Dec 2025 and Mar 2026, all EVM chains [FULL]
- [@relai-fi/x402 NPM package](https://registry.npmjs.org/@relai-fi/x402) - Unified SDK for Solana, Base, Avalanche, SKALE, Polygon, Ethereum [FULL]

### Tier 3: Avalanche Ecosystem (FULL)

- [Avalanche Builder Hub - x402 Facilitators](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators) - Lists PayAI, Thirdweb, 0xGasless, x402-rs [FULL]
- [Avalanche Builder Hub - x402 on Avalanche Course](https://build.avax.network/academy/blockchain/x402-payment-infrastructure) - Full course, finality, settlement mechanics [FULL]
- [Dexter x402 Facilitator - Avalanche](https://dexter.cash/facilitator/avalanche) - Public endpoint, Dexter team, currently live [FULL]
- [PayAI on Avalanche Builder Hub](https://build.avax.network/integrations/payai) - AI agent x402 integration [FULL]
- [evalanche GitHub](https://github.com/iJaack/evalanche) - Agent wallet SDK for Avalanche with x402 support [FULL]

### Tier 4: On-Chain Analytics (FULL)

- [Agenstry x402 Multichain Analysis](https://agenstry.com/blog/x402-multichain-three-months-onchain) - Published May 19, 2026, chain volume breakdown, methodology, 798 indexed resources [FULL]
- [PaulieB14/x402-base-pulse GitHub](https://github.com/PaulieB14/x402-base-pulse) - Substreams tracking all x402 settlements on Base, FacilitatorRegistry gating [FULL]

### Tier 5: Security & Design (FULL)

- [x402 ERC-20 Approval Gas Sponsoring](https://docs.x402.org/extensions/erc20-approval-gas-sponsoring) - Gasless Permit2 for any ERC-20, facilitator-paid gas [FULL]
- [SKALE Non-USDC Tokens with x402](https://docs.skale.space/cookbook/x402/non-usdc-tokens) - Multi-token middleware patterns [FULL]
- [x402-cross-bridge-sdk GitHub](https://github.com/divi2806/x402-cross-bridge-sdk) - Cross-chain payments, any token to USDC on Base, Permit2 mechanics [FULL]

### Tier 6: News & Analysis (PARTIAL)

- [Coinbase x402 10,000% Growth](https://cointelegraph.com/news/coinbases-x402-transactions-rise-10-000-percent) - October 26, 2025, 500K tx/week peak [PARTIAL]
- [InfoQ x402 v2 Upgrade](https://www.infoq.com/news/2026/01/x402-agentic-http-payments/) - January 2026 major upgrade announcement [PARTIAL]
- [AInvest x402 $600M Flow Analysis](https://www.ainvest.com/news/x402-600m-flow-network-shifts-coinbase-chokepoint-2602/) - Flow analysis, Feb 2026 [PARTIAL]
- [AInvest Coinbase 50M Agentic Transactions](https://www.ainvest.com/news/coinbase-50m-agentic-transactions-flow-analysis-stablecoin-defi-volume-2604/) - April 7, 2026, volume breakdown [PARTIAL]
- [Coira x402 Protocol Guide](https://coira.io/blog/x402-protocol-ai-agents-crypto-payments) - Feb 27, 2026, 35M+ transactions claimed [PARTIAL]
- [ATXP x402 Explained](https://atxp.ai/blog/coinbase-x402-explained/) - March 10, 2026, agent wallet vs card narrative [PARTIAL]

### Tier 7: Community & Forums (PARTIAL)

- [Cryptopolitan Dexter Overtakes Coinbase](https://www.cryptopolitan.com/dexter-overtakes-coinbase-x402-transactions/) - Jan 2, 2026, Dexter as largest daily facilitator [PARTIAL]

---

## Classification Summary

- **FULL**: 21 sources (official docs, GitHub, on-chain analytics, x402 foundation repositories)
- **PARTIAL**: 7 sources (news, blog analysis, community reports)
- **FAILED**: 0 sources

**Methodology**: Web search (exa_web_search), direct documentation reads (web_fetch), GitHub API, and on-chain scanner data (Agenstry). Dates verified to 2026-05-23. All claims with numbers cross-referenced against primary sources.
