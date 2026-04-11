# 345 -- ZABAL Agent Swarm: Master Blueprint (CANONICAL)

> **Status:** Research complete -- definitive build plan
> **Date:** April 11, 2026
> **Goal:** Single source of truth for the entire ZABAL agent swarm: what to build, in what order, with what tools, referencing all 8 prior research docs

---

## Key Decisions / Recommendations (Final)

| Decision | Recommendation | Source Doc |
|----------|----------------|-----------|
| **Wallet security** | USE Privy Agentic Wallets (TEE + Shamir sharding). NEVER raw private keys in env vars | 343 |
| **Treasury** | USE Safe 2-of-3 multisig on Base for main ZABAL treasury. Agents draw from Safe, never access directly | 343 |
| **Swap routing** | USE 0x Swap API v2 (150+ sources) for quotes. USE Bankr `symbiosis` skill for cross-chain execution | 324, 344 |
| **Farcaster posting** | USE Bankr `neynar` skill for full Farcaster API (post, like, follow, search) | 344 |
| **Agent payments** | USE Bankr `moltycash` skill for x402 USDC payments on Base | 344 |
| **Portfolio tracking** | USE Bankr `zerion` skill (41+ chains, PnL, DeFi positions) | 344 |
| **Agent identity** | USE Bankr `erc-8004` skill + our `identity.ts` for registration on Base. Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | 340, 344 |
| **Content commerce** | USE Paragraph API/SDK/MCP for newsletters + publish.new for digital goods. x402 for agent purchases | 322 |
| **Auto-burn** | USE 1% burn on every ZABAL buy (CLAWD pattern). Send to `0x...dEaD` | 339 |
| **Zero-sell policy** | Agents NEVER sell ZABAL for ETH/USDC. Only buy ZABAL, swap to SANG, buy content. Hardcode via Privy policy | 339 |
| **Conviction governance** | FORK ClawdVictionStaking.sol (MIT, audited) -- promoters stake ZABAL, train AI larva, auto-vote | 340 |
| **Bounty board** | FORK AgentBountyBoard.sol (MIT) -- Dutch auction job market for content creation | 340 |
| **Two-model routing** | Haiku for daily trades ($0.001/call), Opus for complex decisions. 60-80% cost savings | 339 |
| **Staking vaults** | USE Bankr `stakr` skill (ERC-4626 vaults) for ZABAL staking | 344 |
| **Monitoring** | Blockscout MCP for on-chain data + Supabase `agent_events` for logging + circuit breakers | 339, 343 |
| **OWASP controls** | Input validation, tool scoping, inter-agent auth (SIWA), kill switches, behavioral alerts | 343 |
| **ETHSkills** | INSTALL in every project: `claude plugin install https://github.com/austintgriffith/ethskills` | 339 |

---

## The 3 Agents

| Agent | Brand | Schedule | Role | Buys From |
|-------|-------|----------|------|-----------|
| **VAULT** | ZAO OS | 6 AM UTC | Treasury management, research monetization, LP management | BANKER (show data), DEALER (room data) |
| **BANKER** | COC Concertz | 2 PM UTC | Content creation bounties, show promo, artist payments | VAULT (research), DEALER (room clips) |
| **DEALER** | FISHBOWLZ | 10 PM UTC | Room economy, speaker tips, discussion summaries | VAULT (topics), BANKER (artist bookings) |

---

## Architecture Stack

```
┌─────────────────────────────────────────────────────────┐
│                    COMMUNITY LAYER                       │
│  Farcaster /zao channel  |  COC Promoters  |  Governance │
│  Snapshot polls          |  Bounty Board   |  LarvAI     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    AGENT LAYER                           │
│  VAULT (6AM)  |  BANKER (2PM)  |  DEALER (10PM)         │
│  Vercel crons  |  Supabase state  |  ZOE coordinator     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  SKILLS LAYER (Bankr)                    │
│  symbiosis (swaps)  |  zerion (portfolio)                │
│  neynar (Farcaster)  |  moltycash (x402)                 │
│  erc-8004 (identity)  |  stakr (vaults)                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                     │
│  Privy TEE wallets  |  0x Swap API  |  Base paymaster    │
│  Supabase DB        |  Paragraph API  |  Blockscout MCP  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    ON-CHAIN LAYER (Base)                  │
│  ZABAL: 0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07     │
│  SANG:  0x4ff4d349caa028bd069bbe85fa05253f96176741      │
│  USDC:  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913     │
│  Safe Treasury (2/3 multisig)                            │
│  ClawdViction Staking (forked)                           │
│  AgentBountyBoard (forked)                               │
│  ERC-8004 Identity Registry                              │
└─────────────────────────────────────────────────────────┘
```

---

## Build Order (10 Phases)

### Phase 0: Foundation (DONE)
**Status: COMPLETE**

| What | File | Status |
|------|------|--------|
| Agent types + schedules | `src/lib/agents/types.ts` | DONE |
| Config loader | `src/lib/agents/config.ts` | DONE |
| Event logging | `src/lib/agents/events.ts` | DONE |
| 0x Swap API | `src/lib/agents/swap.ts` | DONE |
| Privy wallet signing | `src/lib/agents/wallet.ts` | DONE |
| Auto-burn | `src/lib/agents/burn.ts` | DONE |
| Farcaster posting | `src/lib/agents/cast.ts` | DONE |
| VAULT agent | `src/lib/agents/vault.ts` | DONE |
| BANKER agent | `src/lib/agents/banker.ts` | DONE |
| DEALER agent | `src/lib/agents/dealer.ts` | DONE |
| Cron routes (3) | `src/app/api/cron/agents/*/route.ts` | DONE |
| Admin API | `src/app/api/admin/agents/route.ts` | DONE |
| SQL schema | `scripts/seed-agent-config.sql` | DONE |
| ERC-8004 identity | `src/lib/agents/identity.ts` | DONE (lost in merge, recreate) |
| Registration script | `scripts/register-agents-erc8004.ts` | DONE (lost in merge, recreate) |

### Phase 1: Activate (1 hour, $0.05)
**Prerequisites: Privy account + 0x API key**

| Step | Action | Cost |
|------|--------|------|
| 1 | Sign up at privy.io, create ZAO app | Free |
| 2 | Create 3 server wallets in Privy dashboard (VAULT, BANKER, DEALER) | Free |
| 3 | Set policies per wallet: $5/day max, approved contracts only, time windows | Free |
| 4 | Get 0x API key at dashboard.0x.org | Free |
| 5 | Add env vars to Vercel: `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `VAULT_WALLET_ID`, `BANKER_WALLET_ID`, `DEALER_WALLET_ID`, `ZX_API_KEY` | Free |
| 6 | Run `scripts/seed-agent-config.sql` in Supabase | Free |
| 7 | Fund each Privy wallet with ~$15 ETH on Base | $45 |
| 8 | Enable trading: `UPDATE agent_config SET trading_enabled=true, wallet_address='0x...' WHERE name='VAULT'` (repeat for BANKER, DEALER) | Free |
| 9 | Deploy to Vercel -- crons fire at 6AM/2PM/10PM UTC | Free |
| 10 | Test: `curl -H "Authorization: Bearer $CRON_SECRET" https://zaoos.com/api/cron/agents/vault` | Free |

### Phase 2: Register Agents (1 hour, <$0.10)
**Make agents discoverable by 45K+ other agents**

| Step | Action | Cost |
|------|--------|------|
| 1 | Recreate `src/lib/agents/identity.ts` + `scripts/register-agents-erc8004.ts` | Free |
| 2 | `npx tsx scripts/register-agents-erc8004.ts --generate-cards` | Free |
| 3 | Upload 3 JSON files to Pinata (free tier IPFS) | Free |
| 4 | Register each agent on ERC-8004: `--agent VAULT --uri ipfs://Qm...` | <$0.01 each |
| 5 | Verify at 8004scan.org | Free |

### Phase 3: Install Bankr Skills (2 hours, $0)
**Plug-and-play DeFi infrastructure**

| Skill | What It Replaces | Install Command |
|-------|-----------------|-----------------|
| `symbiosis` | Manual 0x swap execution | `install symbiosis from github.com/BankrBot/skills/symbiosis` |
| `zerion` | Manual balance checks | `install zerion skill` |
| `neynar` | Our `cast.ts` autoCastToZao | `install neynar skill` |
| `moltycash` | Custom x402 payment code | `install moltycash skill` |
| `erc-8004` | Our registration script | `install erc-8004 skill` |
| `stakr` | Not built yet | `install stakr skill` |

### Phase 4: Safe Treasury (1 day, ~$5)
**Multi-signature protection for the main ZABAL pool**

| Step | Action |
|------|--------|
| 1 | Go to safe.global, connect Zaal's wallet on Base |
| 2 | Create 2-of-3 Safe: Zaal + 2 trusted ZAO members |
| 3 | Transfer ZABAL treasury to Safe |
| 4 | Fund agent Privy wallets FROM Safe (2-of-3 approval) |
| 5 | Add Guard module: reject tx >$50 without 24h timelock |
| 6 | Add Safe address to `community.config.ts` |

### Phase 5: Admin Dashboard UI (2 days)
**Visual control panel for all 3 agents**

| Component | What It Shows |
|-----------|-------------|
| Agent cards (3) | Name, brand, status, wallet, daily spend, last trade |
| Event log table | Last 50 events across all agents with tx links |
| Toggle switches | Enable/disable each agent's trading |
| Balance view | ETH, ZABAL, SANG, USDC per agent via Zerion |
| Kill switch | Emergency disable all agents |

Files: `src/components/admin/AgentDashboard.tsx`, wired into `AdminPanel.tsx`

### Phase 6: Content Commerce (3 days)
**Agents buy and sell real content via x402**

| Step | Action |
|------|--------|
| 1 | Install `@x402/fetch` + `@x402/express` |
| 2 | VAULT lists research docs on publish.new via Paragraph API |
| 3 | BANKER lists show recaps on publish.new |
| 4 | DEALER lists room summaries on publish.new |
| 5 | Wire `buy_content` action: agent calls publish.new via x402, pays USDC |
| 6 | Install `builders-garden/servex-rs` for x402 reverse proxy (optional) |

### Phase 7: Conviction Governance (1 week)
**Promoters stake ZABAL, get AI larva, auto-governance**

| Step | Action |
|------|--------|
| 1 | Fork `clawdbotatg/clawdviction` (MIT, audited) |
| 2 | Change CLAWD address to ZABAL in constructor |
| 3 | Deploy ClawdVictionStaking on Base (~$0.50) |
| 4 | Build staking UI at `/governance/conviction` |
| 5 | Build 8-question onboarding for promoter larva training |
| 6 | Wire governance cron: `/api/cron/gov-process` (Haiku auto-votes, $0.001/vote) |
| 7 | Wire VAULT/BANKER/DEALER to read conviction scores for trade weighting |

### Phase 8: Agent Bounty Board (1 week)
**Dutch auction job market for content creation**

| Step | Action |
|------|--------|
| 1 | Fork `clawdbotatg/agent-bounty-board` (MIT) |
| 2 | Change CLAWD token to ZABAL in constructor |
| 3 | Deploy AgentBountyBoard on Base (~$0.005) |
| 4 | Build job posting UI at `/bounties` |
| 5 | Wire BANKER to listen for `JobPosted` events and auto-claim content jobs |
| 6 | Wire DEALER to auto-claim room summary jobs |
| 7 | Add reputation display from `getAgentStats()` |

### Phase 9: Newsletter Builder (COC Concertz) (1 week)
**13+ promoters create content, earn ZABAL**

| Step | Action |
|------|--------|
| 1 | Finish COC Concertz `/portal/newsletter` page (brainstorming mid-spec in other terminal) |
| 2 | Wire to Paragraph API for publishing |
| 3 | Wire @mention resolver for cross-platform handles |
| 4 | On publish: call `/api/rewards/earn` to mint ZABAL to promoter |
| 5 | Promoter earns 50K ZABAL/newsletter, 10K/social post, 100K/recap |
| 6 | 10% auto-burned on each earn event |

### Phase 10: Network Effects (Ongoing)
**Self-sustaining agent economy**

| Milestone | Trigger |
|-----------|---------|
| External agents discover ZABAL agents via ERC-8004 | After Phase 2 |
| Agent content sales cover trading costs ($0.10/sale x 10/day = $1/day) | After Phase 6 |
| DexScreener shows "active trading" for ZABAL | After Phase 1 (3 trades/day) |
| Community members run their own agents via Bankr | After Phase 3 |
| ZABAL listed on CoinGecko/CoinMarketCap | After sustained volume |
| Conviction staking creates permanent buy pressure | After Phase 7 |

---

## Comparison: Full Stack Costs

| Component | Tool | Monthly Cost | Annual |
|-----------|------|-------------|--------|
| Agent wallets | Privy (free tier) | $0 | $0 |
| Swap routing | 0x API (free tier, 100K/mo) | $0 | $0 |
| Gas sponsorship | Base paymaster ($15K credits) | $0 | $0 |
| Agent hosting | Vercel (Hobby) | $0 | $0 |
| Database | Supabase (free tier) | $0 | $0 |
| Farcaster posting | Neynar (x402, $0.001/cast) | ~$0.09 | ~$1 |
| AI voting | Haiku ($0.001/vote) | ~$0.42 | ~$5 |
| Content commerce | publish.new (free listing) | $0 | $0 |
| Portfolio data | Zerion (Bankr skill) | $0 | $0 |
| **Starting capital** | 3 agent wallets | **$45 one-time** | -- |
| **Contract deploys** | Staking + Bounty Board | **$0.55 one-time** | -- |
| **Total ongoing** | | **~$0.51/mo** | **~$6/yr** |

**Total to launch the entire system: $45.55**

---

## Key Numbers

| Metric | Value | Source |
|--------|-------|-------|
| ZABAL contract | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Base) | Codebase |
| ZABAL price | $0.0000001429 | Doc 324 |
| ZABAL liquidity | $552 (Uniswap V4) | Doc 324 |
| SANG contract | `0x4ff4d349caa028bd069bbe85fa05253f96176741` (Base) | Codebase |
| Current daily volume | $0.23 | Doc 325 |
| Target daily volume | $4.50-$18 (3 agents) | Doc 325 |
| Volume multiplier | 20-80x | Doc 325 |
| ERC-8004 agents registered | 45,000+ | Doc 340 |
| Privy free tier | 499 MAU, 50K sigs/mo | Doc 343 |
| Base paymaster credits | $15,000 | Doc 324 |
| 0x free tier | 100K calls/mo | Doc 324 |
| Conviction formula | amount x seconds staked | Doc 340 |
| Staking deploy cost | $0.05-$0.50 | Doc 340 |
| Bounty board deploy cost | $0.002-$0.005 | Doc 340 |
| Bankr skills available | 34 | Doc 344 |
| Paragraph MCP tools | 18 | Doc 322 |
| CLAWD treasury | $177K (zero sells) | Doc 339 |
| CLAWD deployed contracts | 52+ | Doc 339 |
| OWASP agentic risks | 10 (all mapped) | Doc 343 |

---

## Codebase Reference

### What's Built (on main)

| File | Status |
|------|--------|
| `src/lib/agents/types.ts` | LIVE -- types, tokens, schedules, burn config |
| `src/lib/agents/config.ts` | LIVE -- Supabase config loader |
| `src/lib/agents/events.ts` | LIVE -- event logging |
| `src/lib/agents/swap.ts` | LIVE -- 0x Swap API |
| `src/lib/agents/wallet.ts` | LIVE -- Privy TEE signing |
| `src/lib/agents/burn.ts` | LIVE -- 1% auto-burn |
| `src/lib/agents/cast.ts` | LIVE -- Farcaster posting |
| `src/lib/agents/vault.ts` | LIVE -- VAULT daily routine |
| `src/lib/agents/banker.ts` | LIVE -- BANKER daily routine |
| `src/lib/agents/dealer.ts` | LIVE -- DEALER daily routine |
| `src/app/api/cron/agents/vault/route.ts` | LIVE -- 6 AM UTC |
| `src/app/api/cron/agents/banker/route.ts` | LIVE -- 2 PM UTC |
| `src/app/api/cron/agents/dealer/route.ts` | LIVE -- 10 PM UTC |
| `src/app/api/admin/agents/route.ts` | LIVE -- admin GET/PATCH |
| `scripts/seed-agent-config.sql` | READY -- run in Supabase |
| `vercel.json` | LIVE -- 3 cron schedules |

### What Needs Recreating (lost in merge)

| File | Priority |
|------|----------|
| `src/lib/agents/identity.ts` | Phase 2 |
| `scripts/register-agents-erc8004.ts` | Phase 2 |
| `src/components/admin/AgentDashboard.tsx` | Phase 5 |

### What Needs Building (new)

| File | Phase |
|------|-------|
| Bankr skill integrations | Phase 3 |
| Safe treasury setup | Phase 4 |
| x402 content purchase wiring | Phase 6 |
| Conviction staking contract + UI | Phase 7 |
| Bounty board contract + UI | Phase 8 |
| COC Concertz newsletter builder | Phase 9 |

---

## Research Doc Cross-Reference

| Doc | What It Covers | Use When |
|-----|---------------|----------|
| **322** | Paragraph platform (API/SDK/MCP/coins), publish.new, x402 | Building content commerce (Phase 6) |
| **324** | ZABAL/SANG tokenomics, 0x API, Privy wallets, Base paymaster, reward schedule | Setting up agents (Phase 1), tuning rewards (Phase 9) |
| **325** | Agent swarm design, 3 agents, schedules, inter-agent trading, community governance | Architecture reference, agent behavior design |
| **326** | Bootcamp sessions, repos to fork, techniques to steal | Implementation patterns, debugging agent behavior |
| **339** | CLAWD agent, ETHSkills, verified addresses, two-model routing, zero-sell, auto-burn | Contract addresses, cost optimization, burn logic |
| **340** | 4 forkable systems: LarvAI, Bounty Board, ephemeral agents, ERC-8004 | Phases 7 + 8 (smart contract forks) |
| **343** | Security: Privy TEE, Safe multisig, OWASP agentic, policy engine, monitoring | Phase 1 (Privy), Phase 4 (Safe), ongoing (security) |
| **344** | Bankr Bot skills marketplace, 34 skills, DeFi primitives | Phase 3 (skill installation) |

---

## Sources

All sources documented in individual research docs. This master blueprint references:
- [Doc 322](../../business/322-paragraph-publishnew-newsletter-agent-commerce/)
- [Doc 324](../../business/324-zabal-sang-wallet-agent-tokenomics/)
- [Doc 325](../325-zabal-agent-swarm-economy/)
- [Doc 326](../../events/326-agentic-bootcamp-complete-session-guide/)
- [Doc 339](../339-austin-griffith-clawd-ethskills-agent-patterns/)
- [Doc 340](../340-clawd-patterns-deep-dive-4-systems/)
- [Doc 343](../../security/343-agent-wallet-security-zabal-swarm/)
- [Doc 344](../344-bankr-bot-agent-trading-skills/)
