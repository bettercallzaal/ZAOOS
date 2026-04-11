# 324 -- ZABAL/SANG Wallet Agent System: Tokenomics, Autonomous Swaps & Promoter Incentives

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Design the autonomous wallet agent system for ZABAL<>SANG trading, COC Concertz promoter incentives, gas sponsorship, and x402 agent commerce payment flows

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Swap aggregator** | USE 0x Swap API v2 -- aggregates 150+ liquidity sources (including Uniswap, Aerodrome, Curve), smart order routing on Base, better pricing than direct Uniswap SDK for thin pools like ZABAL/SANG. Free Dev tier: 100K calls/month. 1inch is equivalent but 0x has deeper Base integration |
| **Agent wallet provider** | USE Privy Agentic Wallets -- TEE-secured server wallets with policy controls (transfer limits, allowlisted contracts, time windows). Already integrated in FISHBOWLZ (doc 282-284). Coinbase AgentKit is the free alternative but Privy gives us wallet + auth + gas sponsorship in one SDK |
| **Gas sponsorship** | USE Coinbase Base Paymaster -- $15K free gas credits via Base Gasless Campaign, 0.25 ETH auto on activation. ERC-20 gas payment supported (pay gas in USDC instead of ETH). For agent wallets, this means ZERO gas costs for months |
| **Swap execution path** | USE 0x API quote --> Privy server wallet signs --> Base paymaster sponsors gas. Flow: agent calls 0x `/swap/v1/quote` on Base (chainId 8453), gets calldata, Privy wallet executes with gas sponsorship. Total cost per swap: $0 gas + ~0.1% 0x affiliate fee |
| **ZABAL<>SANG routing** | USE multi-hop: ZABAL --> ETH --> SANG. Direct ZABAL/SANG pair unlikely to have liquidity. ZABAL/ETH pool exists on Uniswap V4 ($552 liquidity), SANG/VIRTUAL on Uniswap V2. 0x aggregator handles multi-hop routing automatically |
| **Tokenomics model** | USE tiered earn-and-burn: promoters earn ZABAL for content creation (fixed amounts per action), ZABAL buys SANG via agent, SANG accumulates in treasury. Burn mechanism: 10% of earned ZABAL burned on each content action to create deflation |
| **Content rewards** | USE fixed ZABAL rewards: 50K ZABAL per newsletter (~$0.007), 10K per social post (~$0.001), 100K per show recap (~$0.014). At current price ($0.0000001429/ZABAL) these are micro-amounts but establish the habit. Value grows with ZABAL price |
| **x402 integration** | USE x402 for publish.new content sales -- promoters list show recaps/promo kits on publish.new, agents pay USDC via x402, USDC converts to ZABAL via agent swap. Closes the loop: create content --> sell to agents --> earn ZABAL |
| **Smart wallet upgrade** | SKIP for v1 -- use Privy embedded EOA (already deployed in FISHBOWLZ). ADD Coinbase Smart Wallet later for batched txs (approve + swap in 1 click) and ERC-20 paymaster (pay gas in ZABAL itself) |

---

## Comparison: Swap Aggregator APIs for ZABAL/SANG Agent

| Aggregator | Liquidity Sources | Base Support | Free Tier | Gas Optimization | Agent-Friendly | ZAO Fit |
|-----------|-------------------|-------------|-----------|-----------------|----------------|---------|
| **0x Swap API v2** | 150+ (Uniswap, Aerodrome, Curve, PMMs) | YES (native) | 100K calls/mo (Dev) | Smart order routing, MEV protection | YES -- REST API, calldata output | **BEST** |
| **1inch API v6** | 100+ DEXs | YES | 100K calls/mo (Dev) | Pathfinder routing, Fusion gasless mode | YES -- REST API | Good alternative |
| **Uniswap V3 SDK** | Uniswap pools only | YES | Unlimited (on-chain) | AlphaRouter multi-hop | MEDIUM -- more code, SDK-heavy | Direct but limited routing |
| **Uniswap V4 SDK** | Uniswap V4 pools only | YES | Unlimited | V4Planner actions | HIGH complexity | ZABAL/ETH pool is V4 |
| **Paraswap** | 100+ DEXs | YES | Public API | Augustus router | YES -- REST API | Less Base-specific |

**Winner:** 0x Swap API v2. For thin-liquidity tokens like ZABAL ($552 liquidity) and SANG ($17/day volume), aggregator routing across multiple sources finds the best price. Direct Uniswap SDK limits you to one protocol's pools.

---

## Comparison: Agent Wallet Providers

| Provider | Policy Controls | Gas Sponsorship | Base Native | Swap Support | Price | ZAO Ecosystem Fit |
|----------|----------------|-----------------|-------------|-------------|-------|-------------------|
| **Privy Agentic Wallets** | YES (transfer limits, allowlists, time windows) | YES (native + Base paymaster) | YES | Via 0x/1inch integration | Free 0-499 MAU, 50K sigs/mo | **BEST** -- already in FISHBOWLZ |
| **Coinbase AgentKit** | YES (CDP policies) | YES (Base paymaster built-in) | YES (Base-native) | Via Uniswap integration | Free (CDP free tier) | Good -- x402 native |
| **Turnkey** | YES (key policies) | No native | YES | Via external DEX | $0.02/wallet/mo | Good signing, no DeFi |
| **Crossmint** | YES (TEE dual-key) | Partial | YES | Via external DEX | Usage-based | Card payments unique |
| **thirdweb** | YES (account abstraction) | YES (60+ chains) | YES | Via external DEX | 1M GU/mo free | Good AA but heavier |

**Winner:** Privy. Already integrated (docs 282-284), TEE-secured, policy controls for autonomous agents, and Privy's gas sponsorship + Base paymaster means zero gas costs.

---

## Architecture: ZABAL/SANG Wallet Agent

### System Overview

```
COC Concertz Promoter creates content (newsletter, social post, recap)
  |
  v
Newsletter Builder (COC Concertz /portal/newsletter)
  |
  v
Content published to Paragraph via API
  |
  v
API route triggers ZABAL reward:
  POST /api/rewards/earn --> mints/transfers ZABAL to promoter's Privy wallet
  |
  v
Promoter can:
  A) HOLD ZABAL (speculate on price appreciation)
  B) TRADE ZABAL --> SANG (via agent swap)
  C) TRADE ZABAL --> ETH/USDC (cash out)
  D) LIST content on publish.new (earn USDC from agents via x402)
```

### Agent Swap Flow (ZABAL --> SANG)

```
1. Promoter triggers swap in UI (or agent auto-swaps on schedule)
2. Backend calls 0x Swap API:
   GET https://api.0x.org/swap/v1/quote
     ?chainId=8453
     &sellToken=0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07  (ZABAL)
     &buyToken=0x4ff4d349caa028bd069bbe85fa05253f96176741   (SANG)
     &sellAmount=50000000000000000000000  (50K ZABAL)
     &takerAddress=<privy-wallet-address>
3. 0x returns: { data, to, value, gas, gasPrice, route[] }
4. Backend sends tx via Privy server wallet:
   privy.wallets().ethereum().sendTransaction({
     to: route.to,
     data: route.data,
     value: route.value,
     chainId: 8453,
     gasless: true  // Base paymaster sponsors
   })
5. SANG arrives in promoter's wallet
```

### Treasury Management Agent

```
Automated daily (cron job):
  1. Check ZABAL treasury balance
  2. If > 1M ZABAL accumulated from burns:
     - Swap 50% ZABAL --> SANG (buyback pressure)
     - Hold 50% ZABAL (treasury reserve)
  3. Report balances to admin dashboard
  4. If SANG treasury > threshold:
     - Add to ZABAL/SANG LP (deepen liquidity)
```

---

## Tokenomics Design: ZABAL Promoter Incentive System

### Token Fundamentals

| Parameter | Value |
|-----------|-------|
| Token | ZABAL |
| Contract | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Base) |
| Total Supply | 100,000,000,000 (100B) |
| Current Price | $0.0000001429 |
| FDV | $14,257 |
| Liquidity | $552 (Uniswap V4 ZABAL/ETH) |
| Paired With | SANG (`0x4ff4d349caa028bd069bbe85fa05253f96176741`) |
| SANG Price | $0.00001458 |
| SANG FDV | $14,581 |

### Reward Schedule (COC Concertz Promoters)

| Action | ZABAL Earned | USD Value (current) | Burn (10%) | Net to Promoter |
|--------|-------------|--------------------:|------------|-----------------|
| **Newsletter published** | 50,000 | $0.007 | 5,000 burned | 45,000 ZABAL |
| **Social post (X/Farcaster/Bluesky)** | 10,000 | $0.001 | 1,000 burned | 9,000 ZABAL |
| **Show recap** | 100,000 | $0.014 | 10,000 burned | 90,000 ZABAL |
| **Artist spotlight** | 25,000 | $0.004 | 2,500 burned | 22,500 ZABAL |
| **Custom content** | 15,000 | $0.002 | 1,500 burned | 13,500 ZABAL |
| **Weekly bonus (3+ posts)** | 50,000 | $0.007 | 5,000 burned | 45,000 ZABAL |

**Monthly budget for 13 promoters (2 posts/week each):** ~2.6M ZABAL/month (~$0.37/month at current price). This is sustainable even from a small treasury allocation.

### Incentive Flywheel

```
Create Content --> Earn ZABAL --> [Choice]
  |                                  |
  |    A) Hold (price appreciation)  |
  |    B) Swap to SANG (SongJam)     |
  |    C) Swap to ETH/USDC           |
  |    D) Sell content on publish.new |
  v                                  v
10% burned -----> Deflation -----> Higher ZABAL price
                                       |
                                       v
                              More incentive to create
```

### Vesting & Anti-Dump

| Mechanism | Design |
|-----------|--------|
| **No vesting on earned ZABAL** | Promoters get instant access -- low friction is critical for adoption |
| **10% burn on earn** | Creates deflation without restricting promoter behavior |
| **Weekly bonus** | Encourages consistency (3+ posts/week earns bonus) |
| **Leaderboard multiplier** | Top 3 promoters each month get 2x rewards next month |
| **SANG buyback** | Treasury auto-buys SANG with burned ZABAL, deepening the LP |

### Why No Vesting

Vesting makes sense for team allocations and investors. For promoters earning micro-amounts ($0.001-$0.014 per action), vesting adds friction that kills adoption. The 10% burn achieves the same deflationary effect without restricting promoters.

---

## x402 Agent Commerce Integration

### How Promoters Earn from AI Agents

```
1. Promoter creates show recap on COC Concertz
2. Newsletter builder publishes to Paragraph (free)
3. Same content listed on publish.new (free listing)
4. AI agent discovers content via publish.new search
5. Agent pays via x402:
   - Agent sends GET request to content URL
   - Gets HTTP 402 Payment Required response
   - Response includes: { x402Version: 2, accepts: [{ scheme: "exact", network: "base", maxAmountRequired: "1000000", payTo: "0x..." }] }
   - Agent signs USDC payment on Base
   - Content delivered
6. Promoter receives USDC in Privy wallet
7. Optional: auto-swap USDC --> ZABAL via agent (buyback)
```

### x402 Payment Flow (Technical)

| Step | Actor | Action | Protocol |
|------|-------|--------|----------|
| 1 | AI Agent | `GET /content/recap-5` | HTTP |
| 2 | Server | Return `402 Payment Required` with x402 body | x402 v2 |
| 3 | AI Agent | Sign USDC transfer on Base | EIP-712 |
| 4 | AI Agent | `GET /content/recap-5` with `X-PAYMENT` header | x402 |
| 5 | Server | Verify payment, deliver content | x402 |
| 6 | Server | USDC arrives in promoter's wallet | Base L2 |

### Pricing for Agent Purchases

| Content Type | Human Price | Agent Price (x402) | Notes |
|-------------|------------|-------------------|-------|
| Show recap | Free (Paragraph) | $0.10 USDC | Agents pay for structured data |
| Artist data pack | Free (COC site) | $0.05 USDC | Social handles, bio, links |
| Promo kit (images + copy) | Free | $0.25 USDC | Full promotional package |
| Historical data (all shows) | Free | $1.00 USDC | Bulk data for analysis |

**Zero protocol fees** on x402 -- 100% goes to the promoter/COC treasury.

---

## Gas Sponsorship Strategy

### Coinbase Base Paymaster

| Feature | Details |
|---------|---------|
| Free credits | $15,000 gas credits via Base Gasless Campaign |
| Auto credit | 0.25 ETH on activation |
| ERC-20 gas | Pay gas in USDC or custom tokens (not just ETH) |
| Smart accounts | ERC-4337 account abstraction required |
| RPC method | `wallet_sendCalls` with paymaster capabilities |
| SDK | `@base-org/account` |

### Gas Cost Estimate (Base L2)

| Operation | Estimated Gas | Base L2 Cost | With Paymaster |
|-----------|-------------|-------------|----------------|
| ERC-20 transfer (ZABAL) | ~65,000 gas | ~$0.001 | $0 (sponsored) |
| Uniswap swap (via 0x) | ~150,000 gas | ~$0.003 | $0 (sponsored) |
| Approve + swap | ~250,000 gas | ~$0.005 | $0 (sponsored) |
| LP add liquidity | ~200,000 gas | ~$0.004 | $0 (sponsored) |

At $0.003/swap, $15K in credits = **5,000,000 sponsored swaps**. More than enough for years.

### Privy Gas Sponsorship (Alternative)

Privy offers native gas sponsorship toggle in dashboard -- `"sponsor": true` flag on transactions. Free during beta, usage-based after. Use as backup if Base paymaster requires smart accounts (AA) that complicate the v1 agent.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

| Task | Details |
|------|---------|
| Set up Privy agentic wallet | Create server wallet for WALLET agent, fund with small ETH on Base |
| 0x API integration | `/api/rewards/swap` route: quote + execute ZABAL<>SANG swaps |
| ZABAL reward endpoint | `/api/rewards/earn` route: transfer ZABAL to promoter wallet on content creation |
| Base paymaster setup | Activate Coinbase paymaster, get gas credits, configure allowlist |

### Phase 2: Promoter Flow (Week 2)

| Task | Details |
|------|---------|
| Wire newsletter builder to rewards | On successful Paragraph publish, call `/api/rewards/earn` |
| Promoter wallet UI | Show ZABAL balance, swap button, transaction history in portal |
| Leaderboard | Track promoter content creation, display ZABAL earned rankings |
| Auto-swap option | Toggle: auto-convert earned ZABAL to SANG/ETH/USDC |

### Phase 3: Agent Commerce (Week 3)

| Task | Details |
|------|---------|
| publish.new listings | Auto-list show recaps and promo kits on publish.new |
| x402 payment endpoint | Serve content behind x402 paywall for AI agents |
| Treasury management | Daily cron: check balances, execute buybacks, report |
| LP management | Add ZABAL/SANG liquidity when treasury thresholds met |

### Phase 4: Optimization (Week 4)

| Task | Details |
|------|---------|
| Smart wallet upgrade | Migrate to Coinbase Smart Wallet for batched txs |
| ERC-20 paymaster | Pay gas in ZABAL (requires smart wallet) |
| Analytics dashboard | ZABAL velocity, burn rate, promoter activity, agent purchases |
| Multi-brand support | Extend to ZAO OS and FISHBOWLZ promoter rewards |

---

## ZAO Ecosystem Integration

### Codebase References

| File | Relevance |
|------|-----------|
| `src/app/(auth)/ecosystem/page.tsx:573` | ZABAL token contract address already displayed |
| `src/components/fishbowlz/TipButton.tsx` | Privy wallet tip flow (adapt for ZABAL rewards) |
| `src/app/api/fishbowlz/webhook/privy/route.ts` | Privy webhook handler pattern |
| `src/components/respect/SongjamLeaderboard.tsx:14` | `zabalBalance` field already in leaderboard type |
| `src/lib/portal/destinations.ts:70` | Clanker ZABAL reference |
| `community.config.ts:36` | ZABAL channel in Farcaster config |
| `concertz.config.ts` (COC Concertz) | Brand config for newsletter builder integration |

### Cross-Project Token Flow

```
COC Concertz (promoters earn ZABAL)
     |
     v
ZAO OS (ZABAL used for governance weight, SongJam leaderboard)
     |
     v
FISHBOWLZ (ZABAL for room access, speaker tips, buyback mechanism from doc 258)
     |
     v
publish.new (sell content to agents, earn USDC, convert to ZABAL)
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Thin ZABAL liquidity ($552) | HIGH | Start with micro-rewards. Don't dump large amounts. Build LP over time with treasury |
| SANG volume ($17/day) | HIGH | Use 0x aggregator for best routing. Limit daily buyback to $5-10 to avoid moving price |
| Privy rate limits | LOW | 50K sigs/month free, 13 promoters doing 2 posts/week = ~260 reward txs/month |
| 0x API downtime | LOW | Fallback to 1inch API or direct Uniswap V3 SDK |
| Base paymaster credit depletion | LOW | $15K credits = millions of swaps at Base L2 gas prices |
| Regulatory (token rewards) | MEDIUM | ZABAL rewards are community incentives, not securities. No promises of profit. Document as utility rewards |

---

## Sources

- [0x Swap API Documentation](https://0x.org/docs/api)
- [Privy Agentic Wallets](https://docs.privy.io/recipes/agent-integrations/agentic-wallets)
- [Coinbase Base Paymaster](https://docs.base.org/use-cases/go-gasless)
- [Coinbase Agentic Wallets Launch](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets)
- [x402 Protocol](https://www.x402.org/)
- [Agent Wallets Compared (Crossmint)](https://www.crossmint.com/learn/agent-wallets-compared)
- [Uniswap V3 SDK Routing](https://docs.uniswap.org/sdk/v3/guides/swaps/routing)
- [1inch Swap API](https://business.1inch.com/products/swap)
- [Token Economy Design (arxiv 2602.09608)](https://arxiv.org/abs/2602.09608)
- [Doc 258 - ZABAL + SANG Buyback](../258-zabal-sang-buyback/)
- [Doc 283 - Privy Embedded Wallets](../../283-privy-embedded-wallets-fishbowlz-token-mechanics/)
- [Doc 322 - Paragraph + publish.new](../322-paragraph-publishnew-newsletter-agent-commerce/)
