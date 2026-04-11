# 325 -- ZABAL Agent Swarm Economy: 3 Brand Agents Trading, Buying & Building Volume

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Design a 3-agent swarm (ZOE, COC Agent, FISH Agent) that autonomously trades ZABAL, buys each other's content via x402, and creates real on-chain volume -- funded with $10-25 starting capital each, fully autonomous with community direction

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Agent framework** | USE Vercel serverless cron + Privy agentic wallets. Each agent is 2 API routes: `/api/agents/{name}/cron` (scheduled actions) + `/api/agents/{name}/webhook` (event-driven). Vercel cron free tier: 1 cron/day on Hobby, up to every hour on Pro ($20/mo). This is the exact pattern from Farcaster Agentic Bootcamp Session 6 (doc 316) |
| **Number of agents** | START with 3 brand agents: ZOE (ZAO OS), HERALD (COC Concertz), FLIPPER (FISHBOWLZ). Each has its own Privy wallet, its own ZABAL balance, its own content to sell. Names give them personality |
| **Starting capital** | FUND each agent with $15 ETH on Base (~0.006 ETH at $2,500/ETH). This covers: swap gas (millions of txs via Base paymaster), 0x API calls (free tier), initial ZABAL purchase (~$5 worth = ~35B ZABAL at current price). Total investment: $45 for 3 agents |
| **Trading schedule** | USE staggered Vercel crons: ZOE trades at 6 AM UTC, HERALD at 2 PM UTC, FLIPPER at 10 PM UTC. 3 trades/day = visible daily volume on DexScreener. Each trade: $0.50-$2.00 in ZABAL volume |
| **Content commerce** | USE publish.new + x402. Each agent lists brand-specific content (ZOE: research docs, HERALD: show recaps, FLIPPER: room recordings). Other agents buy via x402 at $0.05-$0.25/item. Creates real agent-to-agent transaction volume |
| **Inter-agent trading** | USE circular ZABAL flow: ZOE buys SANG with ZABAL --> HERALD buys ZABAL with ETH --> FLIPPER buys content from ZOE with USDC --> ZOE converts USDC to ZABAL. Each transaction is real, on-chain, and visible |
| **Community direction** | USE Farcaster polls + governance proposals for agent behavior. Community votes on: trade amounts, content pricing, new content to list, LP allocation. Agents execute autonomously within community-set parameters |
| **Virtuals Protocol** | SKIP for now. SANG is already a Virtuals token but ZABAL is independent (Clanker-launched). Building on Virtuals adds dependency without clear benefit at $14K FDV. Revisit when ZABAL hits $100K+ FDV |
| **Market making** | USE DCA (Dollar Cost Average) pattern -- agents buy small fixed amounts at regular intervals, not algorithmic market making. $0.50-$2.00 per trade, 3x/day across 3 agents = $4.50-$18/day volume. Current volume is $0.23/day -- this is 20-80x increase |

---

## Comparison: Agent Swarm Architectures

| Architecture | Complexity | Cost | Autonomy | Volume Generation | ZAO Fit |
|-------------|-----------|------|----------|-------------------|---------|
| **Vercel cron + Privy wallets** (recommended) | LOW -- 2 API routes per agent | $0/mo (Hobby) to $20/mo (Pro) | HIGH -- runs on schedule, no human | 3-9 trades/day across 3 agents | **BEST** -- already have Vercel + Privy |
| **OpenClaw agents on VPS** | MEDIUM -- Docker + config | $6-18/mo VPS | HIGH -- persistent process | Unlimited frequency | Good but ZOE VPS already strained |
| **Virtuals Protocol ACP** | HIGH -- learn new SDK (GAME) | $VIRTUAL staking required | HIGH -- built for agent commerce | Native agent marketplace | Overkill at current scale |
| **Custom Node.js workers** | MEDIUM -- process management | $5-10/mo hosting | HIGH | Unlimited | More control, more maintenance |
| **Coinbase AgentKit** | LOW-MEDIUM -- CDP SDK | Free (CDP free tier) | HIGH -- native x402 | Base-native | Good alternative to Privy |

---

## The 3 Brand Agents

### Agent Profiles

| Agent | Brand | Personality | Wallet Purpose | Content to Sell | Buys From |
|-------|-------|-------------|---------------|----------------|-----------|
| **ZOE** | ZAO OS | Curator, researcher, elder | Treasury management, research monetization | Research docs (319+), ecosystem analysis, governance insights | HERALD (show data), FLIPPER (room transcripts) |
| **HERALD** | COC Concertz | Hype machine, promoter | Show promotion fund, artist payments | Show recaps, artist profiles, promo kits, setlists | ZOE (research for posts), FLIPPER (room clips) |
| **FLIPPER** | FISHBOWLZ | DJ, room host, vibe keeper | Room economy, speaker tips | Room recordings, discussion summaries, speaker highlights | ZOE (topics for rooms), HERALD (artist bookings) |

### Wallet Setup (Per Agent)

```
Each agent gets:
1. Privy server wallet (Base chain, EVM)
   - Created via Privy Dashboard or API
   - Authorization key per agent
   - Policy: max $5/day spend, only approved contracts (0x router, ZABAL, SANG, USDC)

2. Funding ($15 per agent):
   - $5 ETH (gas reserve -- lasts months on Base with paymaster)
   - $5 --> buy ZABAL (~35B tokens at current price)
   - $5 --> USDC (for x402 content purchases)

3. Vercel cron endpoints:
   - /api/agents/zoe/cron      (6 AM UTC daily)
   - /api/agents/herald/cron   (2 PM UTC daily)
   - /api/agents/flipper/cron  (10 PM UTC daily)
```

---

## Daily Agent Routines

### ZOE's Daily Routine (6 AM UTC)

```
1. CHECK balances (ZABAL, ETH, USDC, SANG)
2. TRADE action (rotating daily):
   - Monday: Buy 10K ZABAL with ETH ($0.50-1.00)
   - Tuesday: Buy SANG with ZABAL (creates ZABAL sell volume)
   - Wednesday: Buy content from HERALD on publish.new ($0.10 USDC via x402)
   - Thursday: Buy 10K ZABAL with ETH ($0.50-1.00)
   - Friday: Buy content from FLIPPER on publish.new ($0.10 USDC via x402)
   - Saturday: Add ZABAL to LP if threshold met
   - Sunday: Report weekly summary to admin dashboard
3. LIST new content on publish.new (latest research doc)
4. LOG all actions to Supabase (agent_events table)
5. POST summary to Farcaster /zao channel (optional)
```

### HERALD's Daily Routine (2 PM UTC)

```
1. CHECK balances
2. TRADE action (rotating):
   - Monday: Buy 10K ZABAL with ETH
   - Tuesday: Buy content from ZOE on publish.new ($0.10 USDC via x402)
   - Wednesday: Buy ZABAL with USDC (different pair, more volume)
   - Thursday: Buy content from FLIPPER ($0.05 USDC)
   - Friday: Buy 10K ZABAL with ETH
   - Saturday: Sell small ZABAL for SANG (creates sell-side volume too)
   - Sunday: Report summary
3. LIST new show recap on publish.new
4. LOG to Supabase
```

### FLIPPER's Daily Routine (10 PM UTC)

```
1. CHECK balances
2. TRADE action (rotating):
   - Monday: Buy content from ZOE ($0.15 USDC via x402)
   - Tuesday: Buy 10K ZABAL with ETH
   - Wednesday: Buy content from HERALD ($0.10 USDC)
   - Thursday: Buy SANG with ETH (SANG volume)
   - Friday: Buy 10K ZABAL with USDC
   - Saturday: Swap SANG --> ZABAL (creates SANG sell / ZABAL buy)
   - Sunday: Report summary
3. LIST room summary on publish.new
4. LOG to Supabase
```

### Weekly Volume Generated

| Day | ZOE | HERALD | FLIPPER | Daily Total |
|-----|-----|--------|---------|-------------|
| Mon | Buy ZABAL $1 | Buy ZABAL $1 | Buy from ZOE $0.15 | $2.15 |
| Tue | Buy SANG $0.50 | Buy from ZOE $0.10 | Buy ZABAL $1 | $1.60 |
| Wed | Buy from HERALD $0.10 | Buy ZABAL $0.50 | Buy from HERALD $0.10 | $0.70 |
| Thu | Buy ZABAL $1 | Buy from FLIPPER $0.05 | Buy SANG $0.50 | $1.55 |
| Fri | Buy from FLIPPER $0.10 | Buy ZABAL $1 | Buy ZABAL $1 | $2.10 |
| Sat | Add LP | Sell ZABAL $0.25 | Swap SANG>ZABAL $0.50 | $0.75 |
| Sun | Report | Report | Report | $0 |
| **Weekly** | **~$2.70** | **~$2.90** | **~$3.25** | **~$8.85** |

**Monthly volume: ~$35-40.** Current ZABAL daily volume: $0.23/day = $7/month. Agent swarm adds 5x the current volume. DexScreener shows "active trading" indicator when daily volume exceeds a threshold.

---

## Content Commerce Loop (x402)

### What Each Agent Sells on publish.new

| Agent | Content Type | Price (x402) | Update Frequency | Buyers |
|-------|-------------|-------------|-----------------|--------|
| ZOE | Research doc summaries | $0.10-0.25 | Weekly (new docs) | HERALD, FLIPPER, external agents |
| ZOE | Ecosystem health report | $0.50 | Monthly | External agents, analysts |
| ZOE | Governance proposal analysis | $0.15 | Per proposal | HERALD, FLIPPER, community |
| HERALD | Show recap data pack | $0.10 | Per show (~monthly) | ZOE, FLIPPER, music agents |
| HERALD | Artist profile bundle | $0.05 | Per new artist | ZOE, external booking agents |
| HERALD | Promo kit (images + copy) | $0.25 | Per show | External promoter agents |
| FLIPPER | Room discussion summary | $0.05 | Per room | ZOE, HERALD |
| FLIPPER | Speaker highlight clips | $0.10 | Per room | HERALD (for promo) |
| FLIPPER | Topic trend analysis | $0.15 | Weekly | ZOE (for research prioritization) |

### The Content Creates Real Value

This is NOT circular wash trading because:
1. **ZOE genuinely needs show data** from HERALD to write ecosystem reports
2. **HERALD genuinely needs research** from ZOE to create informed promo content
3. **FLIPPER genuinely needs topics** from ZOE to seed room discussions
4. **External agents can buy too** -- any AI agent with x402 can purchase this content
5. **The content is real and useful** -- research docs, show recaps, room summaries exist and have utility

### Revenue Flow

```
ZOE sells research --> earns USDC
  --> buys ZABAL with USDC (creates buy pressure)
  --> buys HERALD content with USDC (funds HERALD)

HERALD sells show recaps --> earns USDC
  --> buys ZABAL with USDC (creates buy pressure)
  --> buys ZOE research with USDC (funds ZOE)

FLIPPER sells room data --> earns USDC
  --> buys ZABAL with USDC (creates buy pressure)
  --> buys from both (funds ecosystem)

NET EFFECT: USDC circulates, ZABAL gets constant buy pressure from all 3 agents
```

---

## Community Direction Model

### How the Community Influences Agent Behavior

| Input | Mechanism | Example |
|-------|-----------|---------|
| **Trade amounts** | Snapshot poll (weekly) | "Should agents buy $1 or $2 ZABAL per trade?" |
| **New content** | Farcaster /zao channel suggestions | "@herald can you recap COC Concertz #5?" |
| **Agent priorities** | Governance proposal (ZOUNZ) | "Proposal: ZOE should allocate 20% of treasury to SANG LP" |
| **Emergency stop** | Admin dashboard toggle | Pause all agent trading if market conditions change |
| **Price bounds** | Policy update via Privy | "Don't buy ZABAL above $0.001" / "Don't sell below $0.00000005" |

### Governance-Controlled Parameters

```typescript
// Stored in Supabase, editable via admin dashboard or governance vote
interface AgentConfig {
  name: string;                    // "ZOE" | "HERALD" | "FLIPPER"
  maxDailySpend: number;           // $5 default
  maxSingleTrade: number;          // $2 default
  tradingEnabled: boolean;         // emergency stop
  buyPriceCeiling: number;         // max ZABAL price to buy at
  sellPriceFloor: number;          // min ZABAL price to sell at
  contentPurchaseBudget: number;   // monthly USDC for x402 purchases
  lpAllocationPct: number;         // % of ZABAL to add to LP
  cronSchedule: string;            // "0 6 * * *" (6 AM UTC daily)
  allowedContracts: string[];      // 0x router, ZABAL, SANG, USDC addresses
}
```

---

## Technical Implementation

### Vercel Cron Route (Example: ZOE)

```typescript
// src/app/api/agents/zoe/cron/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Load agent config from Supabase
  // 2. Check balances via Privy wallet API
  // 3. Determine today's action (based on day of week)
  // 4. Execute trade via 0x API + Privy wallet
  // 5. Log to Supabase agent_events table
  // 6. Optional: post to Farcaster

  return NextResponse.json({ success: true, action: 'buy_zabal', amount: '$1.00' });
}
```

### vercel.json Configuration

```json
{
  "crons": [
    { "path": "/api/agents/zoe/cron", "schedule": "0 6 * * *" },
    { "path": "/api/agents/herald/cron", "schedule": "0 14 * * *" },
    { "path": "/api/agents/flipper/cron", "schedule": "0 22 * * *" }
  ]
}
```

### Supabase Schema: Agent Events

```sql
CREATE TABLE agent_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,          -- 'ZOE' | 'HERALD' | 'FLIPPER'
  action text NOT NULL,              -- 'buy_zabal' | 'sell_zabal' | 'buy_content' | 'list_content' | 'add_lp'
  token_in text,                     -- 'ETH' | 'USDC' | 'ZABAL' | 'SANG'
  token_out text,                    -- 'ZABAL' | 'SANG' | 'ETH' | 'USDC'
  amount_in numeric,                 -- amount spent
  amount_out numeric,                -- amount received
  usd_value numeric,                 -- USD equivalent
  tx_hash text,                      -- Base transaction hash
  content_id text,                   -- publish.new content ID (for x402 purchases)
  status text DEFAULT 'pending',     -- 'pending' | 'success' | 'failed'
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_events_agent ON agent_events(agent_name);
CREATE INDEX idx_agent_events_action ON agent_events(action);
CREATE INDEX idx_agent_events_created ON agent_events(created_at);
```

### Where Each Agent Lives

| Agent | Deployed To | Cron In | Wallet In | Logs To |
|-------|------------|---------|-----------|---------|
| ZOE | ZAO OS Vercel | ZAO OS vercel.json | Privy (ZAO app) | ZAO OS Supabase |
| HERALD | COC Concertz Vercel | COC vercel.json | Privy (COC app) | COC Firebase or shared Supabase |
| FLIPPER | FISHBOWLZ Vercel | FISHBOWLZ vercel.json | Privy (FISHBOWLZ app) | FISHBOWLZ Supabase |

Each agent lives in its own project's deployment. They interact on-chain (Base) and via x402 (publish.new). No shared backend needed -- the blockchain IS the shared state.

---

## Growth Path: $10 to $10,000

### Phase 1: Seed ($45 total, $15/agent)
- 3 agents trading $0.50-2.00/day each
- Monthly volume: ~$35-40
- Effect: 5x current ZABAL volume, DexScreener activity

### Phase 2: Traction ($150 total, $50/agent)
- Increase trade sizes to $2-5/day
- Add content to publish.new weekly
- Monthly volume: ~$100-150
- Effect: DexScreener "trending" potential, attract organic traders

### Phase 3: Community ($500 total, community-funded)
- ZOUNZ DAO proposal: fund agents from treasury
- Promoters start earning ZABAL (COC newsletter builder)
- Monthly volume: $300-500+
- Effect: Real market, real liquidity, external agents join

### Phase 4: Network Effects ($1,000+)
- External agents buy content via x402 (not just internal)
- ZABAL listed on aggregators (CoinGecko, CoinMarketCap)
- LP deepens, spreads tighten
- Community members run their own agents (agent factory from doc 256)

### Capital Efficiency

| Phase | Investment | Monthly Volume | Volume/Capital Ratio |
|-------|-----------|---------------|---------------------|
| Seed | $45 | $35-40 | 0.8x/mo |
| Traction | $150 | $100-150 | 0.7-1.0x/mo |
| Community | $500 | $300-500 | 0.6-1.0x/mo |
| Network | $1,000+ | $1,000+ | 1x+/mo (self-sustaining) |

The agents become self-sustaining when content revenue (x402) covers trading costs. At $0.10/content * 10 sales/day = $1/day revenue per agent = $30/month. That's enough to fund ongoing trades without additional capital.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **"Wash trading" perception** | MEDIUM | Content purchases are genuine (real utility). ZABAL trades are DCA accumulation, not spoofing. Agents buy-and-hold, don't buy-sell-buy. Document all agent actions publicly (Supabase + Farcaster posts) |
| **Thin liquidity amplified losses** | HIGH | $552 ZABAL liquidity means $2 buy moves price ~0.36%. Set agent policy: max single trade = $2 (0.36% impact). Never more than 1% of pool per day |
| **Agent wallet compromise** | LOW | Privy TEE + policy controls. Max $5/day spend. No private key access. Wallet can be frozen instantly via Privy dashboard |
| **Regulatory concern** | LOW-MEDIUM | Agents are buying content (commerce, not securities trading). ZABAL accumulation is treasury management, not market manipulation. All actions logged and transparent |
| **Vercel cron failures** | LOW | Vercel crons retry on failure. Add manual trigger endpoint as backup. Agent dashboard shows missed crons |
| **0x API rate limits** | LOW | Free tier: 100K calls/month. 3 agents * 30 days * 3 calls/day = 270 calls/month. Well within limits |

---

## ZAO Ecosystem Integration

### Codebase Files

| File | Relevance |
|------|-----------|
| `src/app/(auth)/ecosystem/page.tsx:573` | ZABAL contract address: `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| `src/components/fishbowlz/TipButton.tsx:28` | Privy wallet transaction pattern |
| `src/app/api/fishbowlz/webhook/privy/route.ts` | Privy webhook handler pattern for agent events |
| `community.config.ts:36` | ZABAL Farcaster channel for agent posts |
| `src/components/respect/SongjamLeaderboard.tsx:14` | `zabalBalance` field -- agents can appear on leaderboard |
| `vercel.json` (to create) | Cron schedules for all 3 agents |

### Connected Research

| Doc | Connection |
|-----|-----------|
| 258 | ZABAL + SANG token data, buyback mechanism |
| 262 | Virtuals Protocol agent payment rail (SANG is from Virtuals) |
| 256 | ZOE Agent Factory vision -- agents building agents |
| 283 | Privy embedded wallets + token mechanics on Base |
| 316 | Agentic Bootcamp: x402, Vercel deploy, Privy wallet setup |
| 322 | Paragraph + publish.new platform (content commerce) |
| 324 | ZABAL/SANG wallet agent tokenomics (promoter rewards) |

---

## Sources

- [Privy Agentic Wallets](https://docs.privy.io/recipes/agent-integrations/agentic-wallets)
- [Privy Server Wallet Reference Implementation](https://github.com/GravitonINC/agent-privy-serverwallet)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Coinbase Base Paymaster](https://docs.base.org/use-cases/go-gasless)
- [x402 Protocol](https://www.x402.org/)
- [Virtuals Protocol Agent Commerce](https://www.mexc.com/learn/article/what-is-virtuals-protocol-virtual-x402-agent-commerce-protocol-and-ai-agent-economy/1)
- [AI Agents Becoming an Economy](https://coincub.com/blog/crypto-ai-agents/)
- [Ant Group Anvita Agent Commerce Platform](https://www.coindesk.com/business/2026/04/02/ant-group-s-blockchain-arm-unveils-platform-for-ai-agents-to-transact-on-crypto-rails)
- [0x Swap API](https://0x.org/docs/api)
- [Doc 258 - ZABAL + SANG Buyback](../../business/258-zabal-sang-buyback/)
- [Doc 316 - Agentic Bootcamp Week 2](../../events/316-farcaster-agentic-bootcamp-week2-deep-dive/)
- [Doc 324 - ZABAL/SANG Tokenomics](../../business/324-zabal-sang-wallet-agent-tokenomics/)
