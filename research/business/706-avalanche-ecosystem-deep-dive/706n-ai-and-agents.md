---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-21
related-docs: 572, 573, 695, 706
original-query: "do research on avalanche with tons of agents [wave 2: keep researching the ecosystem]"
tier: STANDARD
parent-doc: 706
---

# 706n - AI & Agents on Avalanche

> Goal: Determine if Avalanche has meaningful AI/agent infrastructure worth ZAO's attention, given ZAO's existing agent stack (ZOE, Hermes, VAULT/BANKER/DEALER trading agents on Base). Assess gap vs Base, positioning, and community sentiment.

## Key Findings (read first)

| Area | Finding | Relevance to ZAO |
|------|---------|------------------|
| **InfraBUIDL(AI) funding** | $15M direct + Aethir $100M GPU fund; launched Jan 2025; focus on autonomous agents, DeFAI, token tooling | ZAO could apply; Base has no equivalent program |
| **Kite AI L1 mainnet** | Live since Apr 2026; 1.9B testnet agent interactions; $33M funding (PayPal, Coinbase, General Catalyst); Kite Passport for agent identity | Novel L1-native approach; different from Base settlement |
| **x402 protocol support** | Official support on Avalanche C-Chain and Fuji; 1-2 sec settlement; EVM chain-agnostic; facilitators live | Base also supports x402; parity |
| **AI projects on Avalanche** | 10+ tangible projects (Evalanche, Avalon, Agentsphere, Baseroot, PyVax, AvaxGPT); ERC-8004 identity standard; GenLayer AI engine | Good proof of concept; smaller than Base ecosystem |
| **Positioning vs marketing** | Real: $1.3B RWA TVL, institutional adoption; AI angle: serious, not thin | Genuine but secondary to RWA/TradFi narrative |
| **Community sentiment** | Reddit/GitHub: pragmatic, focused on production ops (Redis, Postgres, idempotency); agent infrastructure seen as "solved problem" | Mature conversation; no bubble |

## InfraBUIDL(AI): The $15M Program

Avalanche Foundation launched **infraBUIDL(AI)** in December 2024 with up to **$15 million in direct funding and retroactive grants**, targeting AI-driven projects that improve developer/user experience via intelligent dApps.

### Focus Areas

1. **Autonomous, Social, and Meme Agents** - agents that operate with rules, coordinate social behavior, or derive value from community
2. **Agent Token Tooling** - SDKs, frameworks, execution infrastructure for agent primitives
3. **DeFi and Trading Applications (DeFAI)** - portfolio managers, strategy builders, automated yield farming
4. **Intelligent Developer Tools** - code assistants, agent frameworks, platform productivity

### Partner: Aethir GPU Cloud ($100M Ecosystem Fund)

On Jan 21, 2025, **Aethir** (decentralized GPU-as-a-service, $91M ARR, 400k+ GPU containers including 3000+ H100s/H200s) announced strategic partnership with Avalanche Foundation.

- Aethir provides **compute grants** to infraBUIDL(AI) grantees
- Fast-track approved projects into Aethir's $100M fund
- Aethir joined the infraBUIDL(AI) committee

**Why this matters for ZAO**: ZAO's agent stack does not have access to a comparable GPU fund. If ZAO scaled inference workloads, Avalanche + Aethir could provide subsidized compute (conditional on building on Avalanche).

### Early Recipients

- **Cookie.fun** - AI agents + social
- **Lightening Forge Games** - AI-driven gaming
- **Bitte** - AI agent platform
- **Kite AI** - AI L1 (see below)

---

## Kite AI: Purpose-Built L1 for Agents (Live Apr 2026)

**Kite AI** launched as an **Avalanche L1** (sovereign subnet) dedicated to autonomous agent settlement and identity, backed by PayPal Ventures, General Catalyst, Coinbase Ventures, Samsung Next, and the Avalanche Foundation. Total raised: **$33 million**.

### Testnet Results (early 2025)

- **1.9 billion agent interactions** over 1 year
- **300 million daily transactions** at peak
- **30 million API calls**
- **20 million users, 51 million active addresses**

### Mainnet Features (Live Apr 2026)

1. **Kite Passport**: Cryptographic identity for AI agents
   - Persistent agent identity (not ephemeral)
   - Programmable permissions and spending limits
   - Real-time payment authority

2. **Agent Settlement Layer**
   - Native stablecoin settlement (USDC/USDT)
   - Pay-per-API-call, per-data-access, per-task workflows
   - ~1 second finality (Avalanche L1 properties)

3. **Ecosystem Integration**
   - PayPal integrating Kite for agent-native commerce
   - Shopify building Kite agent-driven payments into e-commerce
   - Designed for continuous, programmatic agent-to-service txns

### How It Differs from Base x402

| Dimension | Kite AI | x402 on Base |
|-----------|---------|------------|
| **Execution** | Dedicated L1 (own validator set) | C-Chain shared sequencer |
| **Identity** | Kite Passport (on-chain agent identity) | x402 (HTTP header + signature) |
| **Settlement** | Native stablecoin on L1 | EVM gasless (EIP-3009) |
| **UX** | Agent-first (constraints, delegation) | API-first (HTTP 402) |

**Honest read**: Kite is an alternative approach (L1-native) vs. Base's x402 (protocol-native). Both work. Kite's advantage: dedicated validator set means no congestion from non-agent users. Disadvantage: smaller TVL, fewer integrations. Not a technical replacement for x402; more a design choice.

---

## AI Projects on Avalanche

### 1. Evalanche (Agent Wallet SDK)
- **GitHub**: iJaack/evalanche (27 releases as of Apr 2026)
- **Focus**: Avalanche-first agent wallet with ERC-8004 identity + x402 payments
- **Features**:
  - `Evalanche.boot()` for agent wallet initialization
  - Holdings discovery (DeFi, prediction markets, perpetuals)
  - Bridge/swap/cross-chain flows
  - Li.Fi SDK integration, dYdX perpetuals, Polymarket
  - **69 MCP tools** exposed for agent frameworks
- **Multi-EVM**: Works on Base, Ethereum, Arbitrum, Optimism, etc. (Avalanche primary)
- **Status**: Production (v1.9.0 released Apr 8, 2026)

### 2. Avalon (DeFAI with ERC-8004 + x402)
- **GitHub**: barolivera/avalon
- **Built for**: Aleph Hackathon 2026 (Buenos Aires, March)
- **Features**:
  - Visual strategy builder (React Flow drag-and-drop)
  - Autonomous trading agents with on-chain identity (ERC-8004)
  - Pay-only-if-you-win fee model via x402 (10% of profit, USDC)
  - Non-custodial: funds in StrategyVault (user controls, agent constrained)
  - GenLayer AI engine
  - Trader Joe Liquidity Book integration
  - Chainlink price feeds (AVAX/USD, ETH/USD, BTC/USD)
- **Security**: maxBudget, maxSlippage, maxTradesPerDay enforced on-chain

### 3. Agentsphere (Multi-Agent Orchestration + x402)
- **GitHub**: robertocarlous/Agentsphere
- **Focus**: Decentralized agent marketplace with pipeline orchestration
- **Architecture**:
  - Multiple agents run off-chain (research, sentiment, analysis pipeline)
  - Orchestrator settles outcomes on Avalanche Fuji
  - Optional X402PaymentRegistry (records x402-style payment refs)
- **Contracts** (Fuji):
  - AgentRegistry (metadata, pricing, reputation)
  - TaskManager (orchestrator settlement)
  - X402PaymentRegistry (optional payment attestation)

### 4. Baseroot (AI Agent Dataset Licensing)
- **Built for**: Avalanche Build Games (Stage 2 MVP)
- **Focus**: Decentralized dataset licensing + revenue distribution
- **Model**: 50% DAO / 40% AI Creator / 10% Platform
- **Contracts** (Fuji): Dataset registry, agent registration, license purchase, auto-distribution
- **Why Avalanche**: Fast finality, low fees, EVM compatibility for high-frequency licensing

### 5. PyVax (Python-to-EVM Transpiler for Agents)
- **GitHub**: ShahiTechnovation/pyvax-rebrand
- **Innovation**: Write pure Python, deploy verified smart contracts (no Solidity required)
- **Agent-Specific**:
  - `@action` - all users (humans + agents)
  - `@agent_action` - verified autonomous wallets only
  - `@human_action` - non-agent EOAs only
  - Hybrid contracts where agents and humans have segregated permissions
- **Includes**: AgentWallet SDK, Chainlink VRF, CLI tooling

### 6. AvaxGPT (Agentic API for Onchain Data)
- **Rust-based agentic API** for real-time Avalanche data
- **Integrations**: blockchain explorers, social bots (Twitter, Discord, Telegram)
- **Use**: Natural language queries on wallet/token/contract/NFT addresses
- **Status**: API launched as of Jan 2026

### 7. Eliza Avalanche (Eliza Framework Fork for C-Chain)
- Autonomous agent (Yorquant) built on Eliza for DeFi + social
- Implements: token swaps, yield farming (Yield Yak), Arena social engagement
- **Status**: Avalanche Bounty9000 submission

### 8. Ava Portfolio Manager (LangChain + Brian AI)
- **Integrations**: Brian AI, LangChain, GPT-4, Eigenlayer AVS, The Graph
- **Features**: Multi-protocol DeFi portfolio management with decentralized validation
- **Status**: Archived Jan 2025 (moved to Hedera branch)

---

## x402 Protocol: Official Support on Avalanche

### x402 is Chain-Agnostic

x402 (HTTP 402 Payment Required standard) was designed to work across EVM, Solana, Aptos, Stellar, and others. **Avalanche support was added May 2025** via PR #157 (coinbase/x402).

### Avalanche-Specific Advantages for x402

| Property | Value | Note |
|----------|-------|------|
| **Finality** | ~1 second | Instant confirmation for payment settlement |
| **Full x402 cycle** | 1.5-2 seconds | Request -> 402 -> signature -> settle -> response |
| **Gas cost** | ~$0.001 | Sub-cent micropayment settlements |
| **Gasless for user** | Yes | Facilitator sponsors gas; user signs only |
| **ERC-20 support** | USDC, any ERC-20 | Permit2 or EIP-2612 for gasless transfers |

### Facilitators Available on Avalanche

- **x402.org** (Coinbase) - testnet only (base-sepolia)
- **Production facilitators** - various providers (check x402 ecosystem docs)
- **Custom facilitators** - run your own (Rust implementation available)

**Why Avalanche shines here**: Sub-1-second finality means x402 cycle is 1.5-2 sec vs 2-2.5 sec on Base. Small but measurable for high-frequency agent ops.

---

## Agentic Payments: x402 vs Kite Passport

### x402 Flow (Protocol-Level)
```
Agent Request -> Server Returns 402 -> Agent Signs Payload -> Facilitator Settles -> Done
```
- Works over HTTP, MCP, A2A (Agent-to-Agent)
- No on-chain agent identity needed
- Facilitator is optional; you can settle directly

### Kite Passport Flow (L1-Level)
```
Agent Authenticates (Passport) -> Operates Within Constraints -> Transacts Autonomously
```
- On-chain identity (Kite Passport)
- Native agent permissions/delegation
- Designed for long-lived agent relationships

**For ZAO's agents**: ZOE, Hermes, VAULT/BANKER/DEALER would work fine with both. x402 is more "instant" and protocol-agnostic. Kite Passport is more "persistent identity + constraints" for long-running agents. Not mutually exclusive.

---

## AI Positioning: Is It Real or Marketing?

### The Honest Assessment

**Real signals:**
- **$15M infraBUIDL(AI) funding** is not a token allocation; it's committed capital
- **Aethir partnership** brings actual GPU resources (400k containers, not hypothetical)
- **Kite mainnet** processed 1.9B interactions on testnet; not vaporware
- **10+ production projects** (Evalanche, Avalon, Baseroot, etc.) with live code, contracts, users
- **ERC-8004 standard** for agent identity is cross-project (used in Avalon, Baseroot, Evalanche)

**Thin signals:**
- No breakthrough agent application (like OpenAI for LLMs)
- Most projects are infrastructure/primitives, not end-user apps
- Kite's 20M testnet users includes noise (bot activity, game loops)
- x402 works equally well on Base, Ethereum, Polygon

**Verdict**: Avalanche's AI focus is **real but secondary**. The primary story is RWA tokenization, institutional adoption, and TradFi integration. AI is a supported vertical, not the hero narrative.

---

## Comparison: Avalanche vs Base for ZAO Agents

| Factor | Avalanche | Base | Winner |
|--------|-----------|------|--------|
| **x402 support** | Yes (official) | Yes (official) | Tie |
| **Finality** | ~1 sec | ~2 sec | Avalanche |
| **Gas cost** | ~$0.001 | ~$0.0005 | Base |
| **Agent grants** | $15M (infraBUIDL AI) | None | Avalanche |
| **Compute subsidy** | Aethir $100M | None | Avalanche |
| **Agent identity** | ERC-8004 + Kite Passport | x402 passport only | Avalanche |
| **Agent SDKs** | Evalanche (69 tools) | None | Avalanche |
| **Validator flexibility** | Avalanche L1s (own set) | Single chain | Avalanche |
| **Production agents** | 10+ projects | VAULT/BANKER/DEALER on ZAO | ZAO leading |
| **Community size** | 188 (The ZAO) | Larger | Base |

**For ZAO specifically**: Base is sufficient for existing agents (x402 works fine, fees are lower). Avalanche offers better GPU subsidies + agent-focused grants if ZAO wanted to expand inference workloads or apply for funding.

---

## Community Sentiment: Reddit/GitHub Deep Dive

### Reddit Threads (r/AI_Agents, r/buildinpublic, r/Avax)

**Emerging pattern**: Conversation has matured beyond "are agents the future?" to operational questions:

1. **Production Stack Reality** - Redis streams, Postgres, cron/queue triggers, structured output validation, idempotency, observability. Agents treated as **distributed systems**, not prompt tricks.

2. **Corporate Deployments** - 38% of agents in companies run in "narrow, governed, exception-heavy workflows." Not full automation; not "replace half the company." **Pragmatic deployment**, not revolutionary.

3. **Distribution Bottleneck** - Open-source agent creation exploding; **99% fail rate on discovery/usage**. Distribution is becoming the moat, not raw capability.

4. **Cost Leakage** - More costly failures are loop detection, replay, and cost overruns (not memory issues). Agents are failing because they cost money, not because they forget things.

**Sentiment**: Mature, not hyped. Community is focused on supervision, evaluation, and workflow integration.

### GitHub Projects on Avalanche

- **Evalanche** (27 releases, last Apr 8 2026) - active maintenance
- **Avalon, Agentsphere, Baseroot** - recent builds (Mar-Apr 2026)
- **PyVax** - niche but focused
- **AvaxGPT, Eliza Avalanche** - completed hackathon submissions

**Engagement**: Low to moderate stars (1-10), but code is real and committed.

---

## Does Avalanche Offer ZAO Anything Base Does Not?

### Yes: Three Specific Offerings

1. **GPU Compute Subsidy (Aethir)**
   - If ZAO expanded inference (e.g., running multi-turn conversations for agents), subsidized GPU costs on Avalanche could reduce burn
   - Requires building on Avalanche, but is available to Base builders with extra effort

2. **Agent Grants ($15M infraBUIDL AI)**
   - ZAO could apply for funding to scale ZOE, Hermes, or new agent initiatives
   - Base has no equivalent program from the foundation

3. **Sovereign L1 Option (Avalanche L1 Architecture)**
   - If ZAO wanted its own validator set + custom gas rules (e.g., agent-specific pricing), Avalanche L1 is easier than launching own L1 on EVM
   - Kite is proof of concept

### No: What Base Still Excels At

- **Lower gas costs** ($0.0005 vs $0.001 per x402 settlement)
- **Larger ecosystem** (more liquidity, more integrations)
- **Proven agent production** (VAULT/BANKER/DEALER live on Base, no issues reported)
- **Coinbase relationship** (Base is Coinbase native; Avalanche is neutral)

---

## Next Actions

| Action | Owner | Timeline | Reasoning |
|--------|-------|----------|-----------|
| **Apply for infraBUIDL(AI) grant** | ZAO strategy | Ongoing acceptance | $15M fund; requires written proposal on agent roadmap |
| **Explore Aethir compute credits** | ZAO infrastructure | Q2-Q3 2026 | Validate if GPU subsidy applies to ZAO's inference needs |
| **Monitor Kite Passport adoption** | Research | Quarterly | Track if mainstream agents adopt Kite identity; replicate pattern if relevant |
| **Evalanche SDK evaluation** | ZAO engineering | Q2 2026 | Compare against existing agent tooling; 69 MCP tools could be useful |
| **Skip Avalanche L1 for now** | Product | - | Complexity not justified until ZAO scales 10x+ agents |

---

## Recommendation: CONDITIONAL INTEREST

**Verdict**: Avalanche's AI/agent ecosystem is **real, well-funded, and worth monitoring**. For ZAO specifically:

- **Continue on Base for production agents** (VAULT, BANKER, DEALER, ZOE). No technical reason to migrate.
- **Apply for infraBUIDL(AI) grant** if expanding agent headcount or inference workloads. $15M available; low barrier.
- **Evaluate Avalanche L1 if** ZAO reaches 50+ concurrent agents (need dedicated validator set for custom gas pricing).
- **Do NOT** bet the product on Avalanche. It is a strong secondary option, not a primary platform.

**Why conditional?** Avalanche's AI narrative is real (funding, projects, protocols), but secondary to RWA/TradFi. If ZAO stays Base-native, you miss GPU subsidies but keep lower gas + larger ecosystem. Risk/reward is balanced.

---

## Sources

[FULL] https://blog.aethir.com/blog-posts/aethirs-100m-ecosystem-fund-supports-avalanche-foundations-infrabuidl-ai-program - Aethir-Avalanche partnership announcement

[FULL] https://www.team1.blog/p/infrabuidlai-pioneering-the-future - infraBUIDL(AI) program details

[FULL] https://grants.avax.network/ - Official Avalanche grants portal

[FULL] https://ethnews.com/avalanche-expands-ai-push-as-kite-mainnet-goes-live/ - Kite mainnet launch (Apr 29, 2026)

[FULL] https://www.timesofblockchain.com/news/kite-unveils-avalanche-l1-mainnet-with-ai-payment-passport/ - Kite Passport details

[FULL] https://github.com/iJaack/evalanche - Evalanche SDK (production)

[FULL] https://github.com/barolivera/avalon - Avalon DeFAI platform

[FULL] https://github.com/robertocarlous/Agentsphere - Agentsphere agent orchestration

[FULL] https://github.com/seyitgrbzpng/new-baserootv2.0-main - Baseroot dataset licensing

[FULL] https://github.com/ShahiTechnovation/pyvax-rebrand - PyVax Python-to-EVM

[FULL] https://build.avax.network/academy/blockchain/x402-payment-infrastructure - x402 official documentation

[FULL] https://docs.x402.org/core-concepts/network-and-token-support - x402 network support (Avalanche listed)

[FULL] https://github.com/coinbase/x402/pull/157 - x402 Avalanche C-Chain support PR

[FULL] https://github.com/google-agentic-commerce/a2a-x402 - A2A x402 extension for agent-to-agent payments

[FULL] https://support.avax.network/en/articles/4064861-what-is-an-avalanche-l1 - Avalanche L1 documentation

[FULL] https://cogitus.io/use-cases/avalanche-l1-for-web3-x-ai/ - Avalanche L1 for AI use cases

[FULL] https://www.avax.network/about/blog/kite-ai-to-launch-the-first-avalanche-l1-artificial-intelligence-platform - Kite AI announcement (Feb 2025)

[FULL] https://dev.to/saraann_campbell_d46acd2/ten-reddit-threads-that-show-where-ai-agents-are-actually-headed-5069 - Reddit sentiment analysis (community source)

[FULL] https://cryptolinks.com/2958/ravax - r/Avax subreddit guide (community source)

[PARTIAL] https://theagenttimes.com/articles/kite-ai-launches-agent-native-l1-on-avalanche-with-35m-backi-7773047b - The Agent Times coverage (AI-native publication)

[FULL] https://outposts.io/article/avalanche-positions-itself-as-the-blockchain-for-real-world-95f95f31-f17d-4400-973f-6a4ec75044f3 - Avalanche positioning as RWA-first

[FULL] https://crunchupdates.com/quack-ai-q402-avalanche-agent-workflows/ - Quack AI Q402 (alternative agent execution layer)
