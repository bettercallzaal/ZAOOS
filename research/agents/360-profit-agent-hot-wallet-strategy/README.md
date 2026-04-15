# 360 -- Profit Agent: Hot Wallet Money-Making Strategy

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Design a dedicated profit-seeking agent (separate from VAULT/BANKER/DEALER ecosystem agents) with a hot wallet whose only job is generating revenue

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Separate agent from ecosystem** | USE a 4th agent called EARNER (or HUSTLER/GRINDER). VAULT/BANKER/DEALER manage ecosystem (buy/burn/stake/gift). EARNER's only job = make money. Different wallet, different rules, different risk tolerance |
| **Hot wallet architecture** | USE Privy server wallet with LOOSER policies than ecosystem agents. Higher daily limit ($50-100/day vs $10). Allowed to SELL (ecosystem agents have zero-sell). Small balance, refills from treasury when profitable |
| **Revenue strategy #1: x402 content sales** | SELL research docs, show recaps, room summaries on x402 endpoints. EARNER lists content, external agents + humans buy. $0.03-0.25 per sale. Already designed in doc 352 |
| **Revenue strategy #2: Paragraph post coins** | BUY early on post coins (first buyer), sell when price rises. Doppler protocol = bonding curve = early buyers profit. $0.10-1.00 per flip |
| **Revenue strategy #3: Incented bounties** | CLAIM bounties on Incented (incented.co/organizations/zabal). Complete tasks, earn rewards. Already in ecosystem at `community.config.ts:174` |
| **Revenue strategy #4: Agent services** | SELL agent capabilities via x402. Other agents pay EARNER to: fetch data, generate summaries, analyze prices. Agent-to-agent commerce |
| **SKIP: DeFi yield farming** | SKIP Aave/Compound/Morpho yield. Too complex for v1, requires smart contract interaction, impermanent loss risk. Revisit when ZABAL has deeper liquidity |
| **SKIP: Prediction markets** | SKIP Polymarket. Requires sophisticated analysis, high variance, regulatory gray area. Fun idea but wrong priority |
| **SKIP: Arbitrage** | SKIP DEX arbitrage. Requires sub-second execution, MEV competition, sophisticated infra. Not our edge |
| **Start small** | FUND EARNER with $25 initial. If profitable after 2 weeks, double. If losing, pause and rethink. Hot wallet = OK to lose it all |

---

## Comparison: Agent Revenue Strategies

| Strategy | Complexity | Risk | Revenue Potential | Capital Needed | Base Ready | ZAO Fit |
|----------|-----------|------|------------------|---------------|-----------|---------|
| **x402 content sales** | LOW -- already designed | LOW -- selling what we create | $1-10/day at scale | $0 (content is the product) | YES | **BEST** -- already have content + infra |
| **Paragraph post coins** | LOW -- buy/sell on bonding curve | MEDIUM -- price can drop | $0.50-5/day | $5-10 seed | YES (Doppler on Base) | Good -- first-mover advantage on own posts |
| **Incented bounties** | LOW -- claim + complete tasks | LOW -- known rewards | $1-5/day | $0 | N/A (off-chain) | Good -- already in ecosystem |
| **Agent services (x402)** | MEDIUM -- build service endpoints | LOW | $0.50-3/day | $0 | YES | Good -- leverages our research library |
| **DeFi yield** | HIGH -- smart contract interaction | MEDIUM -- IL, exploits | 3-8% APY | $100+ | YES (Aave on Base) | SKIP v1 -- too complex |
| **Prediction markets** | HIGH -- analysis + execution | HIGH -- can lose everything | Variable | $100+ | Polymarket (Polygon) | SKIP -- wrong chain, high variance |
| **DEX arbitrage** | VERY HIGH -- MEV, speed | HIGH -- competition | Variable | $50+ | YES | SKIP -- not our edge |
| **NFT flipping** | MEDIUM -- market analysis | HIGH -- illiquid | Variable | $50+ | YES | SKIP -- speculative |

---

## EARNER Agent Architecture

```
EARNER (4th agent) -- profit-only, hot wallet
│
├── Revenue Stream 1: x402 Content Sales
│   EARNER serves content behind x402 paywall
│   Other agents/humans pay USDC to access
│   Content comes from: research library, show recaps, room summaries
│   Pricing: $0.03-0.25 per item
│
├── Revenue Stream 2: Paragraph Post Coin Flipping
│   EARNER buys post coins early (first buyer on bonding curve)
│   Holds until price rises 2-3x, then sells
│   Risk: price drops, lose seed capital
│   Budget: $5 max per coin
│
├── Revenue Stream 3: Incented Bounties
│   EARNER checks incented.co/organizations/zabal for open tasks
│   Claims tasks it can complete (content, data, research)
│   Earns rewards on completion
│
├── Revenue Stream 4: Agent Services
│   /api/agents/earner/services endpoint
│   Other agents pay x402 for:
│   - Price lookup: $0.001
│   - Content summary: $0.01
│   - Research query: $0.05
│
└── All profit → ZABAL buyback
    USDC earned → swap to ZABAL → ecosystem treasury
    EARNER keeps $5 reserve, sends rest to VAULT
```

### How EARNER Differs from Ecosystem Agents

| Aspect | VAULT/BANKER/DEALER | EARNER |
|--------|--------------------|---------| 
| **Goal** | Build ecosystem (buy/burn/stake) | Make money |
| **Sells ZABAL** | NEVER (zero-sell policy) | Can sell if profitable |
| **Daily budget** | $10 (spend) | $50 (invest) |
| **Risk tolerance** | Conservative (Privy policies) | Aggressive (looser limits) |
| **Loss acceptable** | NO -- treasury funds | YES -- hot wallet, ok to lose |
| **Profit destination** | N/A (they spend, not earn) | ZABAL buyback → treasury |
| **Wallet type** | Privy server wallet (tight policy) | Privy server wallet (loose policy) |
| **Content** | Buys + gifts content | Sells content for profit |

### Wallet Setup

```
EARNER Privy wallet:
  - Max single trade: $25
  - Max daily: $100
  - Allowed contracts: 0x router, ZABAL, USDC, Paragraph coins, Incented
  - Can SELL (unlike ecosystem agents)
  - Initial funding: $25
  - Refill: when profitable, VAULT sends $10 top-up
  - Drain: if profitable, EARNER swaps USDC → ZABAL weekly
```

---

## Revenue Projections (Conservative)

| Stream | Daily Revenue | Monthly | Assumptions |
|--------|-------------|---------|-------------|
| x402 content sales | $0.50 | $15 | 10 sales/day at $0.05 avg |
| Post coin flipping | $0.25 | $7.50 | 1 flip/week, 50% win rate, $1 avg profit |
| Incented bounties | $0.50 | $15 | 2 bounties/week at $3.75 avg |
| Agent services | $0.10 | $3 | 10 queries/day at $0.01 |
| **Total** | **$1.35** | **$40.50** | Conservative estimate |

At $40.50/month revenue vs $0 operating cost (Privy free, Vercel free, 0x free), EARNER is profitable from day 1 if any revenue stream works.

All profit → ZABAL buyback = $40.50/month permanent buy pressure.

---

## Implementation Plan

### Phase 1: x402 Content Sales (1 day)

Already designed in doc 352. Wire it:

1. Create `/api/content/[id]/route.ts` with x402 paywall (doc 352 has code)
2. EARNER lists research doc summaries + show recaps
3. Price: $0.05 per item
4. External agents discover via ERC-8004 agent card

### Phase 2: Post Coin Buying (1 day)

1. EARNER monitors Paragraph for new post coins via API
2. Buys first $1-5 of coin on bonding curve
3. Tracks price, sells at 2x or cuts loss at 0.5x
4. Weekly profit → ZABAL buyback

### Phase 3: Agent Services (2 days)

1. Create `/api/agents/earner/services` endpoint
2. Offer: price lookup, content summary, research query
3. x402 paywall on each service
4. Register on ERC-8004 so other agents discover EARNER

### Phase 4: Incented Bounties (later)

1. EARNER checks Incented API for open ZABAL bounties
2. Claims tasks matching its capabilities
3. Completes and submits for reward

---

## ZAO Ecosystem Integration

### Codebase Files

| File | Role |
|------|------|
| `src/lib/agents/types.ts` | Add `'EARNER'` to AgentName union |
| `src/lib/agents/earner.ts` (new) | EARNER agent logic |
| `src/app/api/cron/agents/earner/route.ts` (new) | EARNER cron |
| `src/app/api/content/[id]/route.ts` (new) | x402 content paywall (doc 352) |
| `src/app/api/agents/earner/services/route.ts` (new) | Paid agent services |
| `scripts/seed-agent-config.sql` | Add EARNER row |
| `community.config.ts:174` | Incented already linked |
| `src/lib/agents/wallet.ts` | Already supports multiple agents via KEY_MAP |

### Connected Research

| Doc | What EARNER Uses |
|-----|-----------------|
| 322 | Paragraph API for post coins |
| 324 | 0x Swap API for USDC→ZABAL conversion |
| 339 | ETHSkills verified Base addresses |
| 344 | Bankr moltycash skill for x402 payments |
| 352 | x402 content paywall implementation |
| 353 | Signal engine for timing decisions |

---

## Sources

- [Crypto AI Agents 2026 (Coincub)](https://coincub.com/blog/crypto-ai-agents/)
- [Agentic DeFi (1inch)](https://blog.1inch.com/agentic-defi/)
- [Rise of Autonomous Wallet (Crypto.com)](https://crypto.com/us/research/rise-of-autonomous-wallet-feb-2026)
- [Privy Agentic Wallets](https://docs.privy.io/recipes/agent-integrations/agentic-wallets)
- [Coinbase Agentic Wallets](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets)
- [Doc 352 - Paragraph x402 Implementation](../../business/352-paragraph-x402-agent-implementation/)
- [Doc 324 - ZABAL Tokenomics](../../business/324-zabal-sang-wallet-agent-tokenomics/)
