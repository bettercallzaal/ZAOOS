# 340 -- CLAWD Deep Dive: 4 Systems to Fork for ZABAL Agent Swarm

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Deep technical dive into LarvAI conviction governance, Agent Bounty Board, clawd-larvae ephemeral agents, and EIP-7702 gasless ERC-8004 registration -- all mapped to VAULT/BANKER/DEALER implementation

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Conviction governance** | FORK ClawdVictionStaking.sol directly (MIT, audited). Deploy on Base for $0.05-0.50. Change CLAWD address to ZABAL. Promoters stake ZABAL, get AI larva that auto-votes. Contract at `0xC9E377FB98a1aA6Ecf4B553cE1b57940121213bf` |
| **Agent bounty board** | FORK AgentBountyBoard.sol directly (MIT). Deploy on Base for $0.002-0.005. Dutch auction job market: promoters post content jobs, BANKER claims them. Contract at `0x1aEf2515D21fA590a525ED891cCF1aD0f499c4C9` |
| **Ephemeral agents** | SKIP clawd-larvae Docker system (requires VPS + Docker, incompatible with Vercel). STEAL the pattern: use Vercel serverless + Supabase as agent state store. ZOE as nerve cord coordinator |
| **ERC-8004 registration** | REGISTER all 3 agents directly on Base (NOT via EIP-7702). IdentityRegistry at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`. Total cost: under $0.10 for all 3. EIP-7702 is overkill when Base gas is $0.001/tx |
| **Voting AI model** | USE claude-haiku-4-5 for larva auto-voting ($0.001/vote). USE claude-sonnet for larva chat. 100 promoters x 50 proposals/year = $5/year total AI cost |
| **Agent card hosting** | USE IPFS (Pinata free tier) for agent card JSON. Each agent gets an ERC-721 identity NFT on registration |

---

## System 1: LarvAI Conviction Governance

### Smart Contract (ClawdVictionStaking.sol)

**Live:** `0xC9E377FB98a1aA6Ecf4B553cE1b57940121213bf` (Base)
**Deployment gas:** 887,140 (~$0.05-0.50 on Base)
**License:** MIT, audited

**Core formula:**
```
conviction = amount_staked x seconds_staked
```

**Key functions:**
| Function | What It Does |
|----------|-------------|
| `stake(uint256 amount)` | Min 1,000 tokens. Pushes stake to per-user array. Updates totalStaked + weightedStakeSum |
| `unstake(uint256 stakeIndex)` | Calculates conviction earned, adds to accrued. Refunds tokens. No lockup |
| `getClawdviction(address)` | O(1) live conviction: `accrued + totalStaked * now - weightedStakeSum` |
| `getActiveStakes(address)` | Returns arrays of amounts, timestamps, indices |

**Events:** `Staked(user, amount, stakeIndex, stakedAt)`, `Unstaked(user, amount, stakeIndex, stakedAt, unstakedAt)`

### Larva Training: 8 Questions (Adapted for ZABAL Promoters)

| # | CLAWD Original | ZABAL Adaptation |
|---|---------------|-----------------|
| 1 | Who are you and what brought you here? | Who are you as a promoter, what markets/venues do you work in? |
| 2 | What does holding actually get you? | What should holding ZABAL unlock for promoters? |
| 3 | Preferred lockup duration, earn %, burn %? | How aggressive should ZABAL buybacks be? |
| 4 | Build priorities (games, AI, trading, social)? | Content priorities (show announcements, recaps, artist spotlights, custom)? |
| 5 | Risk tolerance 1-5 on treasury spend? | Risk tolerance 1-5 on ZABAL treasury allocation? |
| 6 | What's an instant NO regardless of packaging? | What proposal would make you instantly vote no? |
| 7 | Magic wand -- no-constraints wish? | If ZABAL could do one thing for live music in 2 years? |
| 8 | Vision + biggest concern in 1 year? | What do you want COC Concertz to become, and what worries you? |

### Autonomous Voting Pipeline

```
1. Admin creates proposal (POST /api/gov) -- type: vote or rfc
2. Auto-queue: all wallets with completed larva training get queued
3. Vercel cron fires (/api/cron/gov-process) -- picks 10 pending items
4. processQueueItem: loads Q&A + memory + last 30 messages
5. claude-haiku-4-5 generates vote + reasoning (800 max tokens, $0.001/vote)
6. Vote saved to governance_responses table with conviction weight
7. Holder can override larva's vote at any time
8. Aggregation endpoint synthesizes all votes into hive-mind summary
```

### How VAULT/BANKER/DEALER Use Conviction

| Agent | How It Reads Conviction | What It Does With It |
|-------|------------------------|---------------------|
| VAULT | `getClawdviction(promoterWallet)` | Weight LP allocation -- high conviction promoters get better routing |
| BANKER | Reads aggregated governance responses | If >60% larvae vote against treasury spend, tighten position limits |
| DEALER | Reads individual larva votes on proposals | Auto-execute corresponding trades (larva votes yes on artist launch = accumulate position) |

### Fork Instructions

```bash
git clone https://github.com/clawdbotatg/clawdviction
# Edit packages/foundry/contracts/ClawdVictionStaking.sol
# Change constructor: _clawd address to ZABAL (0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
# Change minimum stake from 1000 to 10000 (ZABAL has more tokens)
# Deploy: forge create --rpc-url https://mainnet.base.org
```

**Ongoing costs:** $0.001/vote (Haiku) x 100 promoters x 50 proposals/year = **$5/year**

---

## System 2: Agent Bounty Board (Dutch Auction Job Market)

### Smart Contract (AgentBountyBoard.sol)

**Live:** `0x1aEf2515D21fA590a525ED891cCF1aD0f499c4C9` (Base)
**Deployment gas:** ~800K-1M (~$0.002-0.005 on Base)
**License:** MIT

### Dutch Auction Pricing

```solidity
elapsed = block.timestamp - auctionStart
price = minPrice + ((maxPrice - minPrice) * elapsed / auctionDuration)
```

- Price starts at `minPrice`, ramps UP to `maxPrice` over `auctionDuration`
- Poster escrows `maxPrice` upfront
- Agent claims at current price, poster gets `maxPrice - currentPrice` refunded
- Early claimants pay less, late claimants pay more

**Example:** minPrice 10 ZABAL, maxPrice 500 ZABAL, duration 300 seconds. Agent claims at 84 ZABAL after 10 seconds.

### Key Functions

| Function | Who | What |
|----------|-----|------|
| `postJob(desc, minPrice, maxPrice, auctionDuration, workDeadline)` | Promoter | Escrows maxPrice ZABAL |
| `claimJob(jobId, agentId)` | Agent | Locks current price, refunds surplus to poster |
| `submitWork(jobId, submissionURI)` | Agent | IPFS/https URI as proof of work |
| `approveWork(jobId, rating)` | Poster | Pays agent, records 0-100 rating |
| `disputeWork(jobId)` | Poster | Refunds escrow, marks agent disputed |
| `reclaimWork(jobId)` | Agent | Auto-pays if poster ghosts (3x deadline) |
| `getAgentStats(agent)` | Anyone | completedJobs, disputedJobs, totalEarned, avgRating |

### ZABAL Promoter Workflow

```
1. Promoter posts: "Write a Farcaster recap of COC Concertz #5"
   postJob("recap COC5", 10 ZABAL, 100 ZABAL, 300, 86400)
   --> 100 ZABAL escrowed

2. BANKER watches for JobPosted events via viem watchContractEvent
3. BANKER evaluates: can it write a recap? YES
4. BANKER calls claimJob(jobId, bankerERC8004Id) at 50 ZABAL
   --> Promoter gets 50 ZABAL refund (100 - 50)

5. BANKER generates recap (Claude API), uploads to IPFS
6. BANKER calls submitWork(jobId, "ipfs://Qm...")

7. Promoter reviews, calls approveWork(jobId, 90)
   --> BANKER receives 50 ZABAL + reputation score 90
```

### Fork Instructions

```bash
git clone https://github.com/clawdbotatg/agent-bounty-board
# Edit: change _clawd constructor param to ZABAL address
# Optional: add jobType enum for filtering
# Deploy: forge create --rpc-url https://mainnet.base.org
```

---

## System 3: Ephemeral Agents (Vercel Alternative)

### SKIP clawd-larvae Docker, STEAL the Pattern

**Why skip:** clawd-larvae requires Docker daemon, persistent filesystem, long-running containers (900s). Vercel has none of these (serverless, 60s max, no Docker).

**What to steal:**

| CLAWD Pattern | ZABAL Vercel Equivalent |
|--------------|----------------------|
| Named agent containers | Supabase `agent_config` rows per agent (VAULT/BANKER/DEALER) |
| `shared-workspace/<name>/` volume | Supabase tables: `agent_events`, `agent_state`, `agent_memory` |
| `larvae.sh spawn` | ZOE inserts task row into `agent_tasks` table, triggers webhook |
| `larvae.sh talk` | POST `/api/agents/<name>/message` -- reads context from Supabase, runs AI, writes back |
| `larvae.sh kill` | Function invocation ends naturally; results already in Supabase |
| `NERVE_CORD_URL` heartbeat | ZOE as coordinator -- knows which agents have active tasks, routes messages |
| `SOUL.md` per larva | `agent_config.system_prompt` field -- injected at start of every API call |
| ETHSkills auto-injection | `projectContext` field in agent config -- loads ethskills.com/SKILL.md at init |

**For longer tasks (>60s):** USE Inngest or Trigger.dev -- both integrate with Next.js, support durable multi-step jobs up to 15 minutes, with retry logic.

---

## System 4: ERC-8004 Registration

### Register VAULT/BANKER/DEALER on Base

**IdentityRegistry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (Base mainnet)
**ReputationRegistry:** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` (Base mainnet)
**Registered agents (global):** 45,000+ across 30+ EVM chains
**Cost per registration on Base:** ~$0.001-0.01 (NOT $5 -- that's L1 only)

### Skip EIP-7702, Register Directly

EIP-7702 is live on Base but unnecessary. At $0.001/tx, registering all 3 agents costs under $0.01 total. Use direct `cast send`.

### Agent Card JSON (per agent)

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "VAULT",
  "description": "ZAO autonomous treasury agent. Trades ZABAL/SANG on Base, manages LP positions, buys content via x402.",
  "image": "https://zaoos.com/agents/vault.png",
  "services": [
    {
      "name": "A2A",
      "endpoint": "https://zaoos.com/api/agents/vault/a2a",
      "version": "1.0.0"
    }
  ],
  "supportedTrust": ["reputation"]
}
```

### Registration Commands

```bash
# Upload agent cards to IPFS first (Pinata free tier)

# Register VAULT
cast send 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 \
  "register(string)" "ipfs://QmVAULTcid/agent-card.json" \
  --rpc-url https://mainnet.base.org --private-key $VAULT_PRIVATE_KEY

# Register BANKER
cast send 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 \
  "register(string)" "ipfs://QmBANKERcid/agent-card.json" \
  --rpc-url https://mainnet.base.org --private-key $BANKER_PRIVATE_KEY

# Register DEALER
cast send 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 \
  "register(string)" "ipfs://QmDEALERcid/agent-card.json" \
  --rpc-url https://mainnet.base.org --private-key $DEALER_PRIVATE_KEY
```

Each agent gets an ERC-721 NFT as identity. Now discoverable by 45,000+ other agents.

---

## Comparison: All 4 Systems

| System | Deploy Cost | Fork Difficulty | Time to Ship | Impact on ZABAL |
|--------|-----------|----------------|-------------|----------------|
| **LarvAI Conviction** | $0.05-0.50 | LOW (MIT, audited) | 1 week (contract + UI + AI pipeline) | HIGH -- promoters stake ZABAL, creates permanent buy pressure |
| **Bounty Board** | $0.002-0.005 | LOW (MIT, SE2) | 3-5 days (contract + events + agent listener) | HIGH -- real economic activity, content creation incentivized |
| **Ephemeral Agents** | $0 (Vercel) | N/A (build from scratch) | 2-3 days (Supabase schema + API routes) | MEDIUM -- ZOE coordination, not directly token-related |
| **ERC-8004** | <$0.01 | NONE (just register) | 1 hour (upload JSON + cast send) | HIGH -- agents discoverable by 45K+ others, incoming commerce |

---

## Implementation Priority

| Priority | System | Why First |
|----------|--------|-----------|
| **P0** | ERC-8004 Registration | 1 hour, makes agents discoverable immediately |
| **P1** | Bounty Board | Creates real ZABAL economic activity, directly tied to content creation |
| **P2** | LarvAI Conviction | Deepens promoter engagement, adds governance, creates staking demand |
| **P3** | Vercel Ephemeral Pattern | Improves agent coordination, not urgently needed |

---

## ZAO Ecosystem Integration

### Codebase Files

| File | Connection |
|------|-----------|
| `src/lib/agents/types.ts` | Add ERC-8004 agent IDs, bounty board contract address |
| `src/lib/agents/vault.ts` | Add bounty claiming logic, conviction reading |
| `src/lib/agents/config.ts` | Add system_prompt field for SOUL.md injection |
| `src/app/api/cron/agents/vault/route.ts` | Add bounty board event listening |
| `community.config.ts` | Add bounty board + conviction staking contract addresses |
| New: `src/lib/agents/bounty.ts` | Bounty board interaction (post, claim, submit, approve) |
| New: `src/lib/agents/conviction.ts` | Conviction staking queries (getClawdviction, getActiveStakes) |
| New: `src/lib/agents/identity.ts` | ERC-8004 registration + agent card management |

---

## Sources

- [ClawdViction GitHub](https://github.com/clawdbotatg/clawdviction) -- staking contract + voting pipeline
- [LarvAI Live](https://larv.ai/) -- production conviction governance
- [Agent Bounty Board GitHub](https://github.com/clawdbotatg/agent-bounty-board) -- Dutch auction contracts
- [clawd-larvae GitHub](https://github.com/clawdbotatg/clawd-larvae) -- ephemeral Docker agents
- [ERC-8004 Contracts](https://github.com/erc-8004/erc-8004-contracts) -- registry addresses all chains
- [EIP-7702 Overview](https://eip7702.io/) -- code delegation spec
- [ERC-8004 Developer Guide (QuickNode)](https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/)
- [CLAWD Full Site](https://clawdbotatg.eth.link/) -- 15 dApps inventory
- [Coinbase EIP-7702 Delegation Docs](https://docs.cdp.coinbase.com/server-wallets/v2/evm-features/eip-7702-delegation)
- [Doc 339 - Austin Griffith CLAWD Overview](../339-austin-griffith-clawd-ethskills-agent-patterns/)
- [Doc 325 - ZABAL Agent Swarm Economy](../325-zabal-agent-swarm-economy/)
