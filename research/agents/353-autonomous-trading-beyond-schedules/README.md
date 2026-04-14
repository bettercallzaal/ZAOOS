# 353 -- Autonomous Agent Trading: Beyond Fixed Schedules

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Replace fixed day-of-week schedules with intelligent, autonomous trading triggers for VAULT/BANKER/DEALER

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Replace fixed schedules** | USE multi-signal decision engine. Agent evaluates 5 signals each cron run, picks the best action based on current conditions instead of day-of-week. Keep the cron as a heartbeat (check every 4-8 hours) but let the AGENT decide what to do |
| **TWAP with randomized timing** | USE randomized execution windows. Instead of always trading at 6:00 AM exactly, add random offset of 0-4 hours. Agent cron runs every 4 hours, but only executes when random threshold + signal alignment says "now" |
| **Liquidity-aware trading** | CHECK ZABAL pool liquidity before every trade. If liquidity < $500, reduce trade size. If < $100, skip. Don't move the market more than 1% per trade. Use 0x API's price impact estimation |
| **Price-triggered buys** | BUY MORE when ZABAL dips (buy the dip). If price is 20%+ below 7-day average, double the trade size. If price is 20%+ above, reduce to minimum. Simple mean-reversion |
| **Event-driven triggers** | ADD community event triggers: when a new COC Concertz show is announced, BANKER buys extra ZABAL for post-show content economy. When Farcaster engagement spikes, VAULT increases buying |
| **Vercel cron frequency** | INCREASE from 1x/day to every 4 hours (6x/day). Each run, agent evaluates conditions and decides: trade, skip, or wait. Vercel Pro: unlimited crons. Hobby: 1/day (keep 1/day for Hobby, upgrade for multi-run) |
| **Staking: always autonomous** | Auto-stake is purely autonomous. No notification needed. Every 14 days, if balance >= 100M ZABAL, stake. Silent. Zaal sees it in the dashboard/events log |

---

## Comparison: Trading Trigger Approaches

| Approach | Intelligence | Predictability Risk | Market Impact | Gas Efficiency | ZAO Fit |
|----------|-------------|--------------------|--------------|--------------| --------|
| **Fixed schedule** (current) | NONE -- always 6 AM Monday = buy_zabal | HIGH -- anyone can front-run | HIGH -- same time = same liquidity conditions | LOW -- trades even when gas is expensive | **WORST** |
| **Randomized DCA** | LOW -- same actions, random timing | LOW -- unpredictable execution time | MEDIUM -- spread across time | MEDIUM | Good starter upgrade |
| **TWAP sliced** | MEDIUM -- splits order across hours | LOW | LOW -- small slices over time | MEDIUM | Good for larger trades |
| **Signal-based** | HIGH -- evaluates multiple inputs | LOW | LOW -- trades when conditions align | HIGH -- skips bad conditions | **BEST** for v2 |
| **LLM-driven** | HIGHEST -- AI reasons about market | LOW | LOW | MEDIUM -- inference cost per decision | Future -- expensive at scale |

---

## The Multi-Signal Decision Engine

### How It Works

```
Agent cron fires (every 4-8 hours)
    │
    ▼
┌─────────────────────────────────────┐
│  EVALUATE 5 SIGNALS (parallel)      │
│                                     │
│  1. Price signal: ZABAL vs 7d avg   │
│  2. Liquidity signal: pool depth    │
│  3. Time signal: hours since last   │
│  4. Balance signal: ETH available   │
│  5. Random signal: noise threshold  │
│                                     │
│  Each signal returns: score 0-100   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  DECIDE ACTION                      │
│                                     │
│  composite = weighted avg of scores │
│                                     │
│  if composite > 70 → TRADE          │
│    (pick: buy_zabal or buy_sang     │
│     based on which has better price)│
│                                     │
│  if composite 40-70 → SMALL TRADE   │
│    (reduce amount by 50%)           │
│                                     │
│  if composite < 40 → SKIP           │
│    (log "conditions unfavorable")   │
└──────────────┬──────────────────────┘
               │
               ▼
         Execute or wait
```

### The 5 Signals

| Signal | What It Measures | Score 0-100 | How |
|--------|-----------------|-------------|-----|
| **Price** | ZABAL price vs 7-day moving average | 100 if 20%+ below avg (buy the dip), 50 if at avg, 20 if 20%+ above | `getZabalPrice()` vs rolling avg from `agent_events` history |
| **Liquidity** | ZABAL/ETH pool depth | 100 if >$1000, 50 if $500-1000, 0 if <$100 | 0x API price impact check |
| **Time** | Hours since last successful trade | 100 if >24h, 70 if 12-24h, 30 if 6-12h, 0 if <6h | Query last `agent_events` timestamp |
| **Balance** | ETH available for trading | 100 if >0.01 ETH, 50 if 0.005-0.01, 0 if <0.001 | Privy balance check |
| **Random** | Noise to prevent predictability | Random 0-100 each run | `Math.random() * 100` |

### Weights

```typescript
const SIGNAL_WEIGHTS = {
  price: 0.30,     // Price is most important -- buy dips
  liquidity: 0.25, // Don't trade into thin pools
  time: 0.20,      // Space out trades
  balance: 0.15,   // Don't trade with dust
  random: 0.10,    // Unpredictability
};

const composite = 
  priceScore * 0.30 +
  liquidityScore * 0.25 +
  timeScore * 0.20 +
  balanceScore * 0.15 +
  randomScore * 0.10;
```

### Trade Sizing (Dynamic)

```typescript
// Base: $0.50, but scaled by price signal
if (priceScore > 80) tradeUsd = 1.00;     // Price way below avg -- buy more
if (priceScore > 60) tradeUsd = 0.70;     // Price below avg
if (priceScore > 40) tradeUsd = 0.50;     // Price at avg
if (priceScore < 40) tradeUsd = 0.30;     // Price above avg -- buy less

// Cap at config.max_single_trade_usd
tradeUsd = Math.min(tradeUsd, config.max_single_trade_usd);

// Add noise (+/- 20%)
tradeUsd *= 0.8 + Math.random() * 0.4;
```

---

## What Changes in the Code

### Current Flow (vault.ts)

```
cron fires → dayOfWeek → VAULT_SCHEDULE[day] → execute fixed action
```

### New Flow (vault.ts v2)

```
cron fires → evaluateSignals() → decide(composite score) → execute or skip
```

### New File: `src/lib/agents/signals.ts`

```typescript
export interface SignalResult {
  price: number;     // 0-100
  liquidity: number; // 0-100
  time: number;      // 0-100
  balance: number;   // 0-100
  random: number;    // 0-100
  composite: number; // weighted average
  recommendation: 'trade' | 'small_trade' | 'skip';
  tradeSize: number; // USD amount
  tradeAction: 'buy_zabal' | 'buy_sang'; // which to buy
}

export async function evaluateSignals(agentName: AgentName): Promise<SignalResult> {
  // 1. Price signal
  const currentPrice = await getZabalPrice();
  const avgPrice = await get7DayAvgPrice(agentName); // from agent_events history
  const priceRatio = currentPrice / avgPrice;
  const priceScore = priceRatio < 0.8 ? 100 : priceRatio < 0.9 ? 80 : priceRatio < 1.1 ? 50 : priceRatio < 1.2 ? 30 : 20;

  // 2. Liquidity signal
  const liquidity = await getPoolLiquidity(); // 0x API
  const liquidityScore = liquidity > 1000 ? 100 : liquidity > 500 ? 70 : liquidity > 100 ? 40 : 0;

  // 3. Time signal
  const hoursSinceLast = await getHoursSinceLastTrade(agentName);
  const timeScore = hoursSinceLast > 24 ? 100 : hoursSinceLast > 12 ? 70 : hoursSinceLast > 6 ? 30 : 0;

  // 4. Balance signal
  const balance = await getAgentEthBalance(agentName);
  const balanceScore = balance > 0.01 ? 100 : balance > 0.005 ? 70 : balance > 0.001 ? 30 : 0;

  // 5. Random signal
  const randomScore = Math.random() * 100;

  const composite = priceScore * 0.30 + liquidityScore * 0.25 + timeScore * 0.20 + balanceScore * 0.15 + randomScore * 0.10;

  return {
    price: priceScore,
    liquidity: liquidityScore,
    time: timeScore,
    balance: balanceScore,
    random: randomScore,
    composite,
    recommendation: composite > 70 ? 'trade' : composite > 40 ? 'small_trade' : 'skip',
    tradeSize: calculateTradeSize(priceScore, composite),
    tradeAction: shouldBuySang(agentName) ? 'buy_sang' : 'buy_zabal',
  };
}
```

### Updated Cron Frequency

```json
// vercel.json -- every 4 hours instead of once daily
{
  "crons": [
    { "path": "/api/cron/agents/vault", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/agents/banker", "schedule": "0 2,6,10,14,18,22 * * *" },
    { "path": "/api/cron/agents/dealer", "schedule": "0 1,5,9,13,17,21 * * *" }
  ]
}
```

Staggered: VAULT at hours 0,4,8,12,16,20. BANKER at 2,6,10,14,18,22. DEALER at 1,5,9,13,17,21. Never at the same time. 18 total evaluations per day across 3 agents.

**Note:** Vercel Hobby plan allows only 1 cron per day. This requires Pro ($20/mo) or using an external cron service (cron-job.org is free for up to 5 jobs).

---

## Staking: Fully Autonomous, Silent

| Behavior | Implementation |
|----------|---------------|
| Check every cron run | `maybeAutoStake()` already called in vault.ts |
| 14-day cooldown | Checks last `add_lp` event timestamp |
| Balance threshold | 100M ZABAL minimum |
| No notification | Silent -- appears in agent_events and dashboard |
| No approval needed | Privy policy allows staking contract interactions |

Zaal sees staking activity in:
- `/respect` → Staking tab (conviction leaderboard)
- `/admin` → Agent events log
- Farcaster → agent posts "Staked 100M ZABAL" (optional)

---

## Example: What VAULT Does Over a Week (Signal-Based)

| Day | Cron Run | Price Signal | Liquidity | Time | Composite | Decision | Result |
|-----|----------|-------------|-----------|------|-----------|----------|--------|
| Mon 00:00 | 1 | 80 (dip) | 70 ($600) | 100 (>24h) | 78 | TRADE $0.90 | Bought 6.3B ZABAL |
| Mon 04:00 | 2 | 75 | 70 | 30 (4h) | 55 | SMALL $0.35 | Bought 2.4B ZABAL |
| Mon 08:00 | 3 | 60 | 65 | 30 | 49 | SMALL $0.30 | Bought 2.1B ZABAL |
| Mon 12:00 | 4 | 50 | 60 | 30 | 42 | SKIP | -- |
| Mon 16:00 | 5 | 45 | 55 | 30 | 38 | SKIP | -- |
| Mon 20:00 | 6 | 40 | 50 | 70 (8h) | 44 | SMALL $0.25 | Bought 1.7B ZABAL |
| Tue 00:00 | 7 | 30 (above avg) | 50 | 30 | 34 | SKIP | -- |
| Tue 04:00 | 8 | 25 | 45 | 30 | 29 | SKIP | -- |
| ... | ... | ... | ... | ... | ... | ... | ... |
| Wed 12:00 | 15 | 90 (big dip!) | 80 | 100 | 87 | TRADE $1.20 | Bought 8.4B ZABAL! |

**vs fixed schedule:** Old VAULT would buy exactly $0.50 at 6 AM every Monday/Thursday regardless of conditions. New VAULT buys MORE when prices dip, LESS when prices are high, and SKIPS when conditions are bad.

---

## ZAO Ecosystem Integration

### Files to Change

| File | Current | New |
|------|---------|-----|
| `src/lib/agents/vault.ts` | `VAULT_SCHEDULE[dayOfWeek]` | `evaluateSignals('VAULT')` → decide |
| `src/lib/agents/banker.ts` | `BANKER_SCHEDULE[dayOfWeek]` | `evaluateSignals('BANKER')` → decide |
| `src/lib/agents/dealer.ts` | `DEALER_SCHEDULE[dayOfWeek]` | `evaluateSignals('DEALER')` → decide |
| `src/lib/agents/types.ts` | VAULT/BANKER/DEALER_SCHEDULE exports | Keep as fallback, add SIGNAL_WEIGHTS |
| `vercel.json` | 3 daily crons | 3 crons every 4 hours (requires Pro or external) |
| New: `src/lib/agents/signals.ts` | N/A | Multi-signal evaluation engine |

### Migration Path

```
Phase 1 (now): Keep schedules but add randomized timing offset
  - cron fires at fixed time but agent adds random 0-4 hour delay
  - Simple: setTimeout or skip if random > threshold

Phase 2 (next): Add signal evaluation
  - Price signal from 0x API (already have getZabalPrice)
  - Time signal from agent_events (already have getDailySpend)
  - Replace schedule lookup with signal-based decision

Phase 3 (later): Multi-run crons
  - Upgrade to Vercel Pro or external cron
  - 6 evaluations per day per agent
  - Full autonomous behavior
```

---

## Sources

- [AI-Trader: Agent-Native Trading](https://github.com/HKUDS/AI-Trader)
- [Uniswap DCA Simulation](https://github.com/Uniswap/dca-simulation)
- [Agentic AI in DeFi (Medium)](https://medium.com/@trentice.bolar/agentic-ai-in-defi-the-dawn-of-autonomous-on-chain-finance-584652364d08)
- [AI Agents in DeFi (Smart Liquidity)](https://smartliquidity.info/2026/03/16/ai-agents-are-about-to-change-defi-trading-forever/)
- [TWAP vs VWAP (TradingView)](https://www.tradingview.com/news/cointelegraph:4e659b29e094b:0-twap-vs-vwap-in-crypto-trading-what-s-the-difference/)
- [DCA Bot Strategy (Zignaly)](https://zignaly.com/crypto-trading/long-term-strategies/dca-bot-strategy)
- [Orbs Agentic Execution Layer](https://dailyhodl.com/2026/03/17/orbs-launches-agentic-execution-layer-for-defi-automation/)
- [Agentic DeFi (1inch)](https://blog.1inch.com/agentic-defi/)
- [Doc 345 - Master Blueprint](../345-zabal-agent-swarm-master-blueprint/)
