# ZABAL Knowledge Economy - Design Spec

**Date:** April 11, 2026
**Status:** Design complete, pending user review

---

## 1. What This Is

A token economy where the ZAO knowledge graph drives autonomous agents (VAULT/BANKER/DEALER) to trade ZABAL, fund creators, and build volume -- all funded from the ZOUNZ Nouns Builder treasury (20B ZABAL). The knowledge graph is the brain, agents are the hands, tokens are the blood.

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│              KNOWLEDGE GRAPH                     │
│  Community signals: "need recap", "research X"   │
│  Agent results: "traded $1.50", "burned 50K"     │
│  Connections: people, content, tokens, actions    │
│  Built on: /graphify + KNOWLEDGE.json + Supabase │
└──────────────┬──────────────────────────────────┘
               │ signals ↓ results ↑
┌──────────────▼──────────────────────────────────┐
│              AGENT LAYER                         │
│  VAULT (6AM) - treasury mgmt, research sales     │
│  BANKER (2PM) - content bounties, show promo      │
│  DEALER (10PM) - room economy, speaker tips       │
│  Decision: graph signals first, schedule fallback │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│              TOKEN LAYER                         │
│  ZOUNZ Treasury (20B ZABAL, NFT governance)      │
│  3 channels: Grants | Bounties | Auto-rewards    │
│  Burns: 1% per trade + 1% per bounty claim       │
│  Buybacks: agent USDC → ZABAL conversion         │
│  Conviction: stake ZABAL for governance weight    │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│              INFRASTRUCTURE                      │
│  Privy TEE wallets | 0x Swap API | Bankr skills  │
│  Vercel crons | Supabase | ERC-8004 identity     │
│  Safe 2/3 multisig | Base paymaster ($15K free)  │
└─────────────────────────────────────────────────┘
```

## 3. Knowledge Graph as Command Layer

### How signals flow

Community members create signals in the knowledge graph. Agents read signals and act on them. Agent actions write results back to the graph.

**Signal types:**

| Signal | Who Creates | Who Acts | Example |
|--------|------------|----------|---------|
| `content_request` | Community member | BANKER | "Need recap for COC Concertz #5" |
| `research_request` | Community member | VAULT | "Research Aerodrome LP strategies" |
| `trade_signal` | Community vote | VAULT | "Increase ZABAL buys this week" |
| `room_request` | Community member | DEALER | "Host a FISHBOWLZ on tokenomics" |
| `funding_proposal` | NFT holder | ZOUNZ Governor | "Fund VAULT with 500M ZABAL" |

**Signal schema (Supabase):**

```sql
CREATE TABLE agent_signals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_type text NOT NULL,
  title text NOT NULL,
  description text,
  priority integer DEFAULT 0,
  created_by text,
  assigned_agent text,
  status text DEFAULT 'open',
  result_summary text,
  result_tx_hash text,
  zabal_reward numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

**Agent decision flow:**

```
1. Cron fires (6AM/2PM/10PM UTC)
2. Agent queries: SELECT * FROM agent_signals WHERE status='open' AND assigned_agent='VAULT' ORDER BY priority DESC LIMIT 1
3. If signal found → execute signal action (content creation, trade, research)
4. If no signal → fall back to VAULT_SCHEDULE[dayOfWeek]
5. Write result back: UPDATE agent_signals SET status='completed', result_summary='...'
6. Log to agent_events table
7. Post to /zao Farcaster channel
```

## 4. Tokenomics

### Token Data

| Token | Contract | Supply | Price | Liquidity |
|-------|----------|--------|-------|-----------|
| ZABAL | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` | 100B | $0.0000001429 | $552 |
| SANG | `0x4ff4d349caa028bd069bbe85fa05253f96176741` | 1B | $0.00001458 | ~$12K mcap |

### Treasury

| Detail | Value |
|--------|-------|
| ZOUNZ DAO | Nouns Builder on Base: `0xCB80Ef04DA68667c9a4450013BDD69269842c883` |
| Treasury ZABAL | 20,000,000,000 (20% of supply) |
| Governance | 1 ZOUNZ NFT = 1 vote |
| Auction | Daily, 100% ETH proceeds to treasury |

### Three Funding Channels

**Channel 1: Grants (governance proposals)**

For large allocations. ZOUNZ NFT holders vote.

| Grant Type | Amount | Example |
|-----------|--------|---------|
| Agent funding | 500M-1B ZABAL | "Fund VAULT trading operations for Q2" |
| Creator grant | 100M-500M ZABAL | "Grant to developer building ZABAL price bot" |
| Ecosystem | 1B+ ZABAL | "Fund ZABAL/ETH LP deepening" |

**Channel 2: Bounties (Agent Bounty Board)**

For per-task work. Dutch auction pricing.

| Bounty Type | Range | Claimer |
|------------|-------|---------|
| Show recap | 25K-100K ZABAL | BANKER or promoter |
| Research doc | 50K-250K ZABAL | VAULT or community member |
| Room summary | 10K-50K ZABAL | DEALER |
| Agent tool | 100K-500K ZABAL | Any builder |
| Custom | Set by poster | Anyone |

**Channel 3: Auto-rewards (per-action)**

Automatic, no vote needed. Smart contract or API route distributes.

| Action | ZABAL Earned | Burn (1%) | Net |
|--------|-------------|-----------|-----|
| Newsletter published | 50,000 | 500 | 49,500 |
| Social post (X/FC/BS) | 10,000 | 100 | 9,900 |
| Show recap | 100,000 | 1,000 | 99,000 |
| Artist spotlight | 25,000 | 250 | 24,750 |
| Agent trade executed | 5,000 | 50 | 4,950 |
| Bounty claimed | varies | 1% | varies |
| Graph signal completed | 10,000 | 100 | 9,900 |

### Deflation Mechanics

| Mechanism | When | Rate |
|-----------|------|------|
| Trade burn | Every agent swap (ZABAL buy) | 1% of ZABAL received |
| Bounty burn | Every bounty claim from treasury | 1% of bounty amount |
| Auto-reward burn | Every auto-reward distribution | 1% of reward |
| Content buyback | Agent earns USDC from x402 sale | 100% converted to ZABAL (permanent buy) |
| Future Clanker | IF new token launched | Trading fees convert to ZABAL buys |

### Zero-Sell Policy

Agents NEVER sell ZABAL for ETH/USDC. Enforced via Privy wallet policy.

Allowed: Buy ZABAL, swap ZABAL for SANG, buy content with USDC, burn ZABAL.
Blocked: Sell ZABAL for ETH, sell ZABAL for USDC, transfer ZABAL to non-approved address.

### Conviction Governance (LarvAI Fork)

Promoters and community members can stake ZABAL for governance weight:

- **Formula:** conviction = amount_staked x seconds_staked
- **No lockup:** unstake anytime, but conviction resets to zero
- **AI larva:** answer 8 questions, get personal AI agent that votes on your behalf
- **Contract:** Fork ClawdVictionStaking.sol, deploy on Base (~$0.50)
- **AI cost:** $0.001/vote (Haiku), ~$5/year for 100 promoters x 50 proposals

### Monthly Token Flow Estimate (13 promoters, 3 agents)

| Flow | Monthly ZABAL | Monthly USD |
|------|-------------|-------------|
| Auto-rewards to promoters (2 posts/week x 13) | 2,600,000 | $0.37 |
| Auto-rewards to agents (1 trade/day x 3) | 450,000 | $0.06 |
| Bounties claimed | ~5,000,000 | $0.71 |
| Total distributed | ~8,050,000 | $1.15 |
| Burned (1% of all) | ~80,500 | $0.01 |
| Agent buybacks (USDC→ZABAL) | ~3,000,000 | $0.43 |
| Net treasury outflow | ~5,050,000 | $0.72 |

At this rate, 20B treasury lasts **~3,960 months (330 years)**. Sustainable.

## 5. Agent Behavior

### VAULT (ZAO OS, 6 AM UTC)

```
1. Check knowledge graph for open signals assigned to VAULT
2. If signal found:
   - research_request → search research library, generate doc, post to publish.new
   - trade_signal → execute specified trade via 0x API
   - funding_proposal → prepare treasury proposal data
3. If no signal, use schedule:
   - Mon/Thu: buy ZABAL with ETH ($0.30-0.70 + noise)
   - Tue: buy SANG with ETH
   - Wed/Fri: buy content from BANKER or DEALER via x402
   - Sat: evaluate LP position
   - Sun: weekly report to /zao
4. After every action: burn 1%, log event, post to Farcaster, update graph
```

### BANKER (COC Concertz, 2 PM UTC)

```
1. Check graph for content_request signals assigned to BANKER
2. If signal found:
   - Generate content (recap, spotlight, promo)
   - Publish to Paragraph via API
   - List on publish.new for x402 sales
   - Claim bounty if applicable
3. If no signal, use schedule:
   - Mon/Wed/Fri: buy ZABAL
   - Tue/Thu: buy content from VAULT or DEALER
   - Sat: sell small SANG position
   - Sun: report
4. After every action: burn 1%, log, post, update graph
```

### DEALER (FISHBOWLZ, 10 PM UTC)

```
1. Check graph for room_request signals assigned to DEALER
2. If signal found:
   - Generate room summary
   - Tip speakers
   - List summary on publish.new
3. If no signal, use schedule:
   - Mon/Wed: buy content from VAULT or BANKER
   - Tue/Fri/Sat: buy ZABAL
   - Thu: buy SANG
   - Sun: report
4. After every action: burn 1%, log, post, update graph
```

## 6. Security

Per doc 343:

| Layer | Implementation |
|-------|---------------|
| Wallet security | Privy TEE (keys never leave enclave) |
| Treasury | Safe 2/3 multisig (Zaal + 2 trusted) |
| Spending limits | Privy policy: $5/day max per agent |
| Contract allowlist | Privy policy: only 0x router + ZABAL + SANG + USDC + burn address |
| Time windows | Privy policy: 1-hour window around cron time |
| Kill switch | `trading_enabled = false` in Supabase |
| Circuit breaker | 3 consecutive failures = auto-disable |
| Zero-sell | Privy policy blocks ZABAL→ETH and ZABAL→USDC sells |
| Monitoring | Blockscout alerts + agent_events table |
| OWASP | All 10 agentic risks mapped and mitigated (doc 343) |

## 7. Infrastructure (Bankr Skills)

| Need | Bankr Skill | Replaces |
|------|------------|----------|
| Swap execution | `symbiosis` (54 chains) | Manual 0x calldata |
| Portfolio tracking | `zerion` (41 chains) | Manual balance checks |
| Farcaster posting | `neynar` | Our cast.ts |
| x402 payments | `moltycash` | Custom payment code |
| Agent identity | `erc-8004` | Our registration script |
| Staking vaults | `stakr` | Not built yet |

## 8. What Needs Building (Prioritized)

### Already Built (Phase 0)

- Agent types, config, events, swap, wallet, burn, cast modules
- VAULT, BANKER, DEALER agents with cron routes
- Admin API, vercel.json crons
- Privy wallet signing (TEE-secured)

### Next to Build

| Priority | What | Effort | Depends On |
|----------|------|--------|-----------|
| **P0** | `agent_signals` Supabase table + signal query in agent routines | 2 hours | Nothing |
| **P0** | Privy wallet setup (dashboard config, 3 wallets, policies) | 1 hour | Privy account |
| **P0** | 0x API key + fund wallets + enable trading | 30 min | Privy wallets |
| **P1** | Install Bankr skills (symbiosis, zerion, neynar, moltycash) | 2 hours | Nothing |
| **P1** | ERC-8004 registration (recreate identity.ts + script) | 1 hour | Funded wallets |
| **P1** | Admin dashboard UI (AgentDashboard.tsx) | 4 hours | Nothing |
| **P2** | Safe 2/3 multisig for treasury | 1 day | 2 trusted signers |
| **P2** | x402 content listing on publish.new | 2 days | Paragraph API key |
| **P2** | Auto-reward API route (`/api/rewards/earn`) | 4 hours | Treasury wallet |
| **P3** | Conviction staking (fork ClawdViction, deploy, UI) | 1 week | Treasury funded |
| **P3** | Agent Bounty Board (fork, deploy, UI) | 1 week | Treasury funded |
| **P3** | ZOUNZ treasury dashboard (fork iykyk-terminal) | 1 week | Nothing |
| **P4** | Knowledge graph signal UI (community creates signals) | 3 days | agent_signals table |
| **P4** | Newsletter builder (COC Concertz /portal/newsletter) | 1 week | Other terminal |
| **Future** | `/create-agent` skill for ZAO members | When needed | All above |
| **Future** | New Clanker token with fee→ZABAL buyback | When idea emerges | Volume established |

## 9. Costs

| Item | Cost | Frequency |
|------|------|-----------|
| Agent wallet funding | $45 | One-time (or ZOUNZ grant) |
| Contract deploys (staking + bounty) | $0.55 | One-time |
| ERC-8004 registration (3 agents) | <$0.10 | One-time |
| Privy | $0 | Free tier (499 MAU) |
| 0x API | $0 | Free tier (100K/mo) |
| Base gas | $0 | Paymaster ($15K credits) |
| AI voting (Haiku) | ~$0.42/mo | Ongoing |
| Neynar posts (x402) | ~$0.09/mo | Ongoing |
| **Total launch** | **$45.65** | |
| **Total ongoing** | **~$0.51/mo** | |

## 10. Success Metrics

| Metric | Now | Target (3 months) |
|--------|-----|-------------------|
| ZABAL daily volume | $0.23 | $10-50 |
| Daily active agents | 0 | 3 |
| Content listed on publish.new | 0 | 20+ items |
| ERC-8004 registered agents | 0 | 3+ |
| Knowledge graph signals completed | 0 | 10/week |
| ZABAL burned (cumulative) | 0 | 1M+ |
| Community members earning ZABAL | 0 | 13+ promoters |
| Conviction staked | 0 | 100M+ ZABAL |

---

## Research Doc References

| Doc | What It Covers | Use When |
|-----|---------------|----------|
| 322 | Paragraph + publish.new | Content commerce |
| 324 | ZABAL/SANG tokenomics | Reward amounts, swap routing |
| 325 | Agent swarm design | Schedules, inter-agent trading |
| 326 | Bootcamp techniques | Implementation patterns |
| 339 | CLAWD + ETHSkills | Auto-burn, zero-sell, addresses |
| 340 | 4 forkable systems | LarvAI, Bounty Board, ERC-8004 |
| 343 | Wallet security | Privy, Safe, OWASP |
| 344 | Bankr skills | Plug-and-play DeFi |
| 345 | Master blueprint | Build order, costs |
| 346 | IYKYK + Fractal Nouns | Treasury governance, iykyk-terminal fork |
