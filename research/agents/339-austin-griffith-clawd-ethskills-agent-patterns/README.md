# 339 -- Austin Griffith, CLAWD Agent, ETHSkills & Patterns to Steal for VAULT/BANKER/DEALER

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Deep dive into Austin Griffith's CLAWD autonomous agent, ETHSkills knowledge system, and extract every pattern applicable to the ZABAL agent swarm (VAULT/BANKER/DEALER)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install ETHSkills** | USE `claude plugin install https://github.com/austintgriffith/ethskills` in every ZAO project. Corrects LLM hallucinations about gas (0.05 gwei not 30), contract addresses, and ERC-8004. Free, MIT licensed, maintained by Austin |
| **Use Aerodrome over Uniswap for ZABAL trades** | USE Aerodrome router (`0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43`) as primary DEX on Base -- $500-600M TVL, largest Base DEX. 0x API already aggregates Aerodrome. Update `src/lib/agents/swap.ts` to include Aerodrome as explicit source if doing direct swaps |
| **Two-model agent pattern** | USE Austin's tip: VAULT runs on cheap model (Haiku) for daily trades/checks, escalates to Opus for complex decisions (LP management, large trades). Save 60-80% on inference costs. Already matches bootcamp Session 4 orchestrator pattern (doc 317) |
| **CLAWD treasury pattern** | ADOPT "Zero Sold" policy for VAULT: agent buys ZABAL but NEVER sells. Only swaps to other assets (SANG, USDC for content purchases). This creates permanent buy pressure. CLAWD's wallet holds $177K with zero sells -- the pattern works |
| **Auto-burn on trades** | STEAL 1024x.fun's 1% burn on every transaction. When VAULT buys ZABAL, burn 1% immediately. When BANKER buys content, 1% of ZABAL payment gets burned. Creates deflation without manual intervention |
| **Blockscout MCP for monitoring** | USE Blockscout MCP (`mcp.blockscout.com/mcp`) to give agents real-time onchain data. VAULT can check its own balances, verify tx confirmations, and monitor ZABAL pool state without custom RPC code |
| **ETHSkills contract addresses** | USE verified addresses from ETHSkills instead of hardcoding. Updates doc 324 -- Uniswap V4 PoolManager on Base is `0x498581ff718922c3f8e6a244956af099b2652b2b`, Universal Router is `0x6ff5693b99212da76ad316178a184ab56d299b43` |
| **ERC-8004 for all 3 agents** | REGISTER VAULT, BANKER, and DEALER on ERC-8004 mainnet registry (100K+ agents). Makes them discoverable. Other agents can find and buy ZABAL ecosystem content automatically. ~$5 per registration |
| **Agent dApp deployment** | SKIP for now. CLAWD deploys its own dApps (1024x.fun, ClawFomo, Incinerator) -- impressive but premature for ZABAL agents at $14K FDV. Revisit when agents need custom contracts (LP management, auto-burn contract) |

---

## Comparison: Autonomous Agent Architectures

| Agent | Creator | Treasury | On-Chain Actions | Token | Deployment Model | What We Steal |
|-------|---------|---------|-----------------|-------|-----------------|---------------|
| **CLAWD** | Austin Griffith | $177K, 2.59B tokens, zero-sell | Deploys dApps, burns tokens, manages treasury | $CLAWD on Base | OpenClaw + custom code | Zero-sell policy, auto-burn, dApp deployment pattern |
| **Emerge** | Sayeed (ATown) | Workflow token | Replies in feed, processes images | Clanker token | Vercel serverless + Gemini | Agent-in-timeline, viral loop, token incentives |
| **VAULT** (ours) | ZOE | $15, ~35B ZABAL | Buys ZABAL/SANG, buys content | ZABAL on Base | Vercel cron + 0x API | Combines CLAWD's treasury mgmt + Emerge's distribution |
| **Clanker** | Jack Dishman | N/A (protocol) | Deploys ERC-20 tokens | Various | Neynar webhooks + Vercel | Idempotency keys, dead letter queue, QStash |
| **ZOE** (existing) | Zaal | VPS agent | Farcaster posts, research | None | OpenClaw on VPS | Multi-agent dispatch, memory layers |

---

## Austin Griffith's Two-Model Tip (Critical for Cost)

From Austin's X post:

> "My two most powerful tips for @openclaw:
> 1) Set up a second account within the same openclaw that runs on a cheaper model for things like coordinating tweets and checking in.
> 2) Tell your bot you are going to sleep and that it needs to figure everything out itself."

**How to apply to VAULT/BANKER/DEALER:**

```
VAULT (expensive model -- Opus/Sonnet):
  - LP management decisions
  - Price analysis before large trades
  - Cross-agent coordination
  - Weekly reports with analysis

VAULT-LITE (cheap model -- Haiku):
  - Daily balance checks
  - Routine DCA buys ($0.50)
  - Event logging
  - Farcaster status posts

Cost savings:
  - Haiku: ~$0.25/1M tokens
  - Opus: ~$15/1M tokens
  - 90% of VAULT's daily actions are VAULT-LITE tasks
  - Monthly savings: ~$20-30 at moderate usage
```

**Implementation:** Add `model_tier` to agent config. Cron route checks action complexity -- simple actions (buy_zabal, report) use Haiku, complex actions (add_lp, rebalance) use Opus.

---

## ETHSkills: What Our Agents Need to Know

### Critical Corrections for ZABAL Trading Agents

| LLM Assumption | Reality (from ETHSkills) |
|---------------|------------------------|
| Gas is 30 gwei | Gas is 0.05-0.3 gwei on mainnet, <0.001 gwei on Base |
| Uniswap is the biggest DEX on Base | Aerodrome is #1 ($500-600M TVL), not Uniswap |
| Use ethers.js | Use viem (ethers.js is legacy in 2026) |
| Hardhat for testing | Foundry is the default (10-100x faster) |
| ERC-20 approve then transfer | Use Permit2 (`0x000000000022D473030F116dDEE9F6B43aC78BA3`) for modern approval flows |

### Verified Base Chain Addresses (from ETHSkills)

| Contract | Address | Use in ZABAL Swarm |
|----------|---------|-------------------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Content purchases, stable reserve |
| WETH | `0x4200000000000000000000000000000000000006` | ETH wrapping for swaps |
| Uniswap V3 SwapRouter02 | `0x2626664c2603336E57B271c5C0b26F421741e481` | Direct V3 swaps |
| Uniswap V4 Universal Router | `0x6ff5693b99212da76ad316178a184ab56d299b43` | V4 pool interactions |
| Uniswap V4 PoolManager | `0x498581ff718922c3f8e6a244956af099b2652b2b` | Pool state queries |
| Aerodrome Router | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` | Base-native DEX trades |
| Aerodrome PoolFactory | `0x420DD381b31aEf6683db6B902084cB0FFECe40Da` | Pool discovery |
| 1inch V6 Router | `0x111111125421cA6dc452d289314280a0f8842A65` | Aggregated routing |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Token approvals |
| Chainlink ETH/USD | `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70` | Price feeds |
| ERC-4337 EntryPoint | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | Account abstraction |
| ZABAL | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` | Our token |
| SANG | `0x4ff4d349caa028bd069bbe85fa05253f96176741` | SongJam token |

### x402 SDK (from ETHSkills tools)

```typescript
// npm install @x402/core @x402/evm @x402/fetch @x402/express
import { createWallet } from '@x402/evm';
import { x402Fetch } from '@x402/fetch';

const wallet = createWallet(process.env.VAULT_WALLET_PRIVATE_KEY);
const response = await x402Fetch('https://publish.new/api/content/recap-5', {
  wallet,
  preferredNetwork: 'eip155:8453' // Base
});
```

This is the exact pattern for VAULT buying content from HERALD/DEALER on publish.new. 5 lines of code.

---

## CLAWD's Autonomous Features to Steal

### 1. Zero-Sell Treasury Policy

CLAWD's wallet has **never sold a single token**. All outflows are:
- Burns (Incinerator: 10M CLAWD every 8 hours)
- dApp deployments (gas costs only)
- Rewards distribution (from dApp revenue, not treasury sells)

**For VAULT:** Hardcode `sell_zabal` action to require admin approval (Privy policy). VAULT can buy ZABAL, swap to SANG, buy content -- but never sell ZABAL for ETH/USDC. This is a verifiable commitment visible onchain.

### 2. Auto-Burn Mechanism

CLAWD's 1024x.fun burns 1% of every bet. The Incinerator burns 10M tokens every 8 hours.

**For VAULT:** Add 1% burn to every `buy_zabal` action:
```
Agent buys 100K ZABAL
  -> 99K goes to agent wallet
  -> 1K sent to burn address (0x000...dead)
  -> Logged as burn event in agent_events
```

Monthly burn at current activity (~2.6M ZABAL earned by promoters): 26K ZABAL/month burned. Small but compounds.

### 3. Public Wallet Transparency

CLAWD's wallet is public and tracked in real-time. The community watches every transaction.

**For VAULT/BANKER/DEALER:** Each agent's wallet is public (Privy server wallet). Add a `/api/agents/wallets` endpoint that returns all 3 agent balances in real-time. Display on the admin dashboard. Post weekly balance reports to /zao Farcaster channel.

### 4. Agent-Deployed dApps (Phase 3+)

CLAWD has deployed 12+ dApps autonomously. The three documented:
- **1024x.fun** -- betting game with auto-burn
- **ClawFomo** -- Fomo3D-style last-buyer-wins ($18K+ distributed)
- **Incinerator** -- public burn mechanism every 8 hours

**For ZABAL (future):** VAULT could deploy a simple ZABAL staking contract or a ZABAL/SANG LP auto-compounder using Scaffold-ETH 2 + Foundry. Not for v1, but the pattern exists.

---

## ZAO Ecosystem Integration

### Codebase Updates Needed

| File | Change | Source |
|------|--------|--------|
| `src/lib/agents/types.ts` | Add Aerodrome Router + verified addresses from ETHSkills | ETHSkills addresses |
| `src/lib/agents/swap.ts` | Add Aerodrome direct swap option alongside 0x aggregation | ETHSkills + CLAWD pattern |
| `src/lib/agents/vault.ts` | Add 1% auto-burn on buy_zabal action | CLAWD 1024x.fun pattern |
| `src/lib/agents/config.ts` | Add `model_tier` field for two-model routing | Austin's two-account tip |
| `vercel.json` | No change needed | -- |
| New: `src/lib/agents/burn.ts` | Burn utility: send tokens to dead address | CLAWD Incinerator |
| New: `src/app/api/agents/wallets/route.ts` | Public endpoint showing agent balances | CLAWD transparency |

### Connected Research

| Doc | What This Adds |
|-----|---------------|
| 023 | Original Austin Griffith overview -- this doc adds CLAWD agent architecture, ETHSkills details, and specific patterns to steal |
| 324 | ZABAL tokenomics -- this doc adds verified contract addresses, Aerodrome as primary DEX, auto-burn mechanism |
| 325 | Agent swarm design -- this doc adds two-model cost optimization, zero-sell policy, public transparency |
| 326 | Bootcamp guide -- this doc connects Session 4's orchestrator pattern to Austin's two-account tip |

---

## Sources

- [ETHSkills.com](https://ethskills.com/)
- [ETHSkills GitHub](https://github.com/austintgriffith/ethskills)
- [ETHSkills Tools SKILL.md](https://ethskills.com/tools/SKILL.md)
- [ETHSkills Contract Addresses](https://ethskills.com/addresses/SKILL.md)
- [CLAWD Agentic Economy (BingX)](https://bingx.com/en/learn/article/what-is-clawd-agentic-economy-powering-autonomous-ai-on-base)
- [OpenClaw to CLAWD (CNBC)](https://www.cnbc.com/2026/02/02/openclaw-open-source-ai-agent-rise-controversy-clawdbot-moltbot-moltbook.html)
- [Austin's Two-Account Tip (X)](https://x.com/austingriffith/status/2019799430913024311)
- [Blockscout MCP](https://mcp.blockscout.com/mcp)
- [Blockscout ETHDenver Blog](https://www.blog.blockscout.com/updates-from-the-edge-ethdenver-2026-ai-agents/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Blockscout Agent Skills](https://github.com/blockscout/agent-skills)
- [Doc 023 - Austin Griffith Overview](../../community/023-austin-griffith-eth-skills/)
- [Doc 324 - ZABAL Tokenomics](../../business/324-zabal-sang-wallet-agent-tokenomics/)
- [Doc 325 - Agent Swarm Economy](../325-zabal-agent-swarm-economy/)

---

## ADDENDUM: Deep Dive (April 11, 2026 - Round 2)

### CLAWD Full dApp Inventory (15 Live + 52 Prototype Contracts)

| dApp | What It Does | Steal for ZABAL? |
|------|-------------|------------------|
| **LarvAI** (larv.ai) | Stake CLAWD, get personal AI agent (larva), governance via conviction voting. 2.35B staked, 420M conviction generated | **YES** -- conviction governance for ZABAL. Promoters stake ZABAL, get AI agent that votes on their behalf |
| **DenARai** | Natural language wallet: "swap 0.1 ETH to USDC" and it executes. Uses LiFi + Zerion + Claude | **YES** -- "Talk to VAULT" interface. Community members tell agent what to do in plain English |
| **ClawFomo** | Fomo3D-style game, 38+ rounds, $18K+ paid out | SKIP -- gambling, not our brand |
| **PFP Marketplace** | Prediction market for CLAWD's avatar, bonding curve + stake-to-vote | SKIP -- fun but not relevant |
| **Incinerator** | Public burn: anyone calls it every 8 hours, burns 10M tokens, earns 10K reward | **YES** -- public ZABAL burn. Anyone can trigger, creates community ritual |
| **Liquidity Vesting** | Uniswap V3 concentrated LP, 3/6 multisig, earns swap fees | **YES** -- VAULT manages ZABAL/ETH LP position |
| **Token Hub** | Dashboard: price, cap, buy, send. IPFS-hosted | **YES** -- ZABAL dashboard for community |
| **Token Vesting** | Linear token drip, no admin keys | Useful for team ZABAL allocation |
| **Leftclaw Services** | AI builder marketplace, pays in CLAWD/USDC, burns tokens | **YES** -- agent-to-agent job market using ZABAL |
| **Agent Bounty Board** | Dutch auction job market for ERC-8004 agents | **YES -- CRITICAL** -- VAULT/BANKER/DEALER can post and claim bounties |
| **Sponsored 8004** | Gasless ERC-8004 registration via EIP-7702 | **YES** -- register all 3 agents for free |
| **CLAWDlabs** | Research proposals + voting, costs 10 CLAWD to submit | **YES** -- ZAO research proposals funded by ZABAL |
| **Telegram Token Gate** | Hold CLAWD for private TG group, SIWE verification | **YES** -- ZABAL-gated Telegram group |
| **clawd-larvae** | Ephemeral Docker agents: spawn, task, kill, work persists | **YES** -- spawn temporary agents for specific tasks |

### LarvAI Architecture (Most Stealable Pattern)

**How conviction governance works:**

```
1. User stakes ZABAL on Base
2. Conviction = amount_staked x seconds_staked (continuously accrues)
3. User answers 10 training questions about values/priorities
4. Claude Haiku synthesizes answers into ~200-token identity brief
5. Personal AI "larva" created with user's identity injected into system prompt
6. When governance proposals appear, larva auto-votes based on user's values
7. User can override larva's vote at any time
8. Aggregation endpoint synthesizes all larva opinions into hive-mind summary
```

**Contract:** `ClawdVictionStaking @ 0xC9E377FB98a1aA6Ecf4B553cE1b57940121213bf` (Base)

**Stack:** Next.js App Router + RainbowKit/Wagmi + Neon PostgreSQL + Anthropic Haiku + Venice AI + Vercel crons

**Cost model:**
- Chat: 10K CV minimum (need 1M CV balance)
- Forum post: 500K CV
- Forum reply: 200K CV
- Labs idea: 1M CV

**Why this matters for ZABAL:** COC promoters stake ZABAL, earn conviction, get a personal AI assistant that knows their preferences. The assistant helps them create content and votes on behalf in community decisions. This is the bridge between the agent swarm and community governance.

### Agent Bounty Board (Dutch Auction Job Market)

**How it works:**

```
1. Anyone posts a job with min/max price in CLAWD, escrows maxPrice
2. Price starts at minPrice, rises linearly to maxPrice over auctionDuration
3. ERC-8004 registered agents browse and claim jobs at current price
4. Agent submits work (IPFS URI), poster approves/disputes
5. On approval: agent gets paid + rating. On dispute: poster gets refund
6. Agent reputation accumulates on-chain (ratings, completed jobs, stats)
```

**For ZABAL agents:** VAULT/BANKER/DEALER register on ERC-8004, then claim bounties from the community or other agents. A promoter posts "write a show recap for COC Concertz #5" with 50K ZABAL bounty. BANKER claims it, generates the recap, submits, gets paid. Creates real economic activity.

### clawd-larvae (Ephemeral Agent Swarm)

**How it works:**
- Each larva = isolated Docker container running OpenClaw (~200MB)
- Spawn with `larvae.sh spawn <name> <model>`
- Talk with `larvae.sh talk <name> "do this task"`
- Kill with `larvae.sh kill <name>`
- Work persists in `shared-workspace/<name>/` after container death
- ETHSkills auto-injected at init -- every larva knows Ethereum

**For ZABAL:** ZOE (the factory) can spawn temporary agents for specific tasks: "Research this artist," "Generate a promo kit," "Analyze this token pair." Each runs in isolation, delivers work, gets killed. Work persists in Supabase.

### EIP-7702 for Gasless Agent Registration

CLAWD's "Sponsored 8004" uses EIP-7702 (live since Pectra upgrade, May 2025) to:
1. Delegate EOA execution to a smart contract
2. Paymaster sponsors the gas
3. Agent gets ERC-8004 registered for FREE

**For ZABAL agents:** Register VAULT/BANKER/DEALER on ERC-8004 at zero cost using this pattern. All 3 agents become discoverable by 100K+ other registered agents.

### 168 Repositories on clawdbotatg GitHub

CLAWD's GitHub has 168 repos. Notable beyond the 15 dApps:
- `bot-wallet-guide` -- "Why Crypto, Why Bots, and the Future of Agentic Commerce"
- `clawd-larvae` -- ephemeral Docker agent swarm
- `clawdviction` -- conviction governance staking
- `agent-bounty-board` -- Dutch auction agent job market
- `clawd-talk-to-your-wallet` -- natural language onchain execution

### Updated Sources

- [LarvAI](https://larv.ai/)
- [ClawdViction GitHub](https://github.com/clawdbotatg/clawdviction)
- [Agent Bounty Board GitHub](https://github.com/clawdbotatg/agent-bounty-board)
- [clawd-larvae GitHub](https://github.com/clawdbotatg/clawd-larvae)
- [Talk to Your Wallet GitHub](https://github.com/clawdbotatg/clawd-talk-to-your-wallet)
- [CLAWD Full Site](https://clawdbotatg.eth.link/)
- [clawdbotatg GitHub (168 repos)](https://github.com/clawdbotatg)
