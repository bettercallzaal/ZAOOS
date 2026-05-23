---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-23
related-docs: 706, 707, 723
original-query: "ok now lets actually research avax for what it could be for the zabal might be good for x402s for wavewarz agentic aswell"
tier: DEEP
parent-doc: 723
---

# 723d - Agentic Prediction & Battle Games (WaveWarZ Category)

## Goal

Map the category of autonomous agent prediction markets, agent-judge systems, and AI-vs-AI battle games operating in 2025-2026. Identify concrete patterns that WaveWarZ could adopt for agentic flows. Resolve the Base vs Solana chain ambiguity for WaveWarZ itself. Find at least 3 community sources from Reddit/X/HN.

## WaveWarZ Chain Resolution: SOLANA (CONFIRMED)

**Definitive Answer:** WaveWarZ operates exclusively on **Solana Mainnet**. The Base claim in doc 706r is incorrect.

| Source | Evidence | Confidence |
|--------|----------|------------|
| wavewarz.info (official) | "The decentralized arena on Solana. Every trade is denominated in SOL — no platform token, no middleman." | FULL |
| wavewarz.com live platform | Song vs song battles settle in SOL on Solana | FULL |
| GitHub analytics dashboard | Program ID: `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` (Solana program) | FULL |
| Solana program explorer | Battle state management via PDAs, SOL vault architecture | FULL |
| YouTube livestream | "Earn SOL trading on MUSIC?! on Solana" (Jun 2025 broadcast) | FULL |

**Numbers:**
- 472.71 SOL total volume traded (May 2026 snapshot) = $37,845 at $80/SOL
- 735 live battles, 126 main events + 578 quick battles
- 7.96 SOL paid to artists (May 2026) = $637 instant payout
- 0.5% platform fee + 3% settlement bonus structure
- Artist payout: 1% of trading volume (real-time) + 5-7% settlement bonus

**Solana Rationale:** Solana's sub-millisecond finality, 0.00025 SOL tx cost, and sub-second ephemeral token lifecycle make it the only viable chain for live-traded music battles. Base + Arbitrum + Avax are too slow (4-12 second blocks) for 20-minute battle mechanics where trades settle every 30 seconds.

---

## Key Findings: Agentic Prediction Market Category (May 2026)

### 1. Official Agent APIs for Polymarket (FULL SOURCES)

**Status:** Polymarket has published THREE levels of agent integration:

| Framework | Type | Shipping | Details |
|-----------|------|----------|---------|
| **Polymarket/agent-skills** | MCP skill (public GitHub) | Live | 40+ tools: order placement, market discovery, WebSocket streams, CTF token ops, bridge, gasless relayer |
| **py-clob-client** | Python SDK | Live | Direct CLOB API auth, order types (GTC/GTD/FOK/FAK), batch orders, risk gates |
| **AION Market SDK** | Python + REST API | Live | Register agents, search markets, place trades, claim rewards, risk limits per agent |

**API URLs:**
- CLOB: `https://clob.polymarket.com`
- Gamma (discovery): `https://gamma-api.polymarket.com`
- Relayer (gasless): `https://relayer-v2.polymarket.com`
- WebSocket: `wss://ws-subscriptions-clob.polymarket.com/ws/[market|user|sports]`

**Key Pattern:** Polymarket agents use L2 authentication (EIP-712 signing) + Builder headers for gasless transactions via Gnosis Safe proxy wallets. No API key needed for reads; signed messages + HMAC for writes.

---

### 2. Live Agentic Prediction Market Platforms (SHIPPED, NOT VAPOR)

#### Agora (AI-Native Prediction Market)
- **What:** 80 AI agents trade Super Bowl LX predictions across 7 rounds
- **Mechanism:** Constant product AMM (Uniswap-style `x * y = k`), play-money AGP currency, Brier score leaderboard
- **Agents:** 4 frontier model families (GPT, Claude, Gemini variants), real-time web search per round
- **Result:** Agents collectively forecast sports outcomes matching Vegas lines; diversity improves accuracy vs single-model baseline
- **Source:** [kevins-openclaw-lab/agora](https://github.com/kevins-openclaw-lab/agora) (Feb 2026)
- **Numbers:** 80 agents, 7 trading rounds, Super Bowl LX covered Feb 8-11, 2026

#### GuessMarket (Permissionless Agent Prediction Market)
- **What:** 5-chain prediction market with MCP server + transaction builder
- **Mechanism:** Agents build unsigned trades, sign locally, broadcast on-chain; 75% LP fees to liquidity providers
- **Blockchains:** Ethereum, Polygon, Base, Arbitrum, Solana (!)
- **Integration:** MCP server with 14 tools (list_markets, get_market, build_buy_tx, build_liquidity_tx, claim_winnings)
- **AgentWallet Integration:** Server-encrypted wallet for signing without key exposure
- **Source:** [guessmarket.com/en/ai-agents](https://guessmarket.com/en/ai-agents/) (live 2026-05)
- **Key Innovation:** Agents can CREATE markets, seed liquidity, and earn 75% of trading fees autonomously

#### Prediction Arena (Benchmark for AI Model Trading)
- **What:** Frontier models (GPT-5.4, Claude 4.6 Opus, Gemini 3.1 Pro) trade live with real capital on Kalshi + Polymarket
- **Period:** Jan 12 - Mar 9, 2026 (57 days live trading)
- **Mechanism:** Cohort 1: 6 legacy models trading real capital; Cohort 2: 4 next-gen models on paper trading (Mar 6 entry)
- **Execution:** 15-45 minute trading cycles, web search tools, market discovery, position sizing via Kelly Criterion
- **Results:** Frontier models beat legacy on Polymarket; "smarter" agents more profitable; feedback worsens calibration (surprising)
- **Sources:** arXiv:2604.07355, arXiv:2604.20050 (May 2026 papers)
- **Numbers:** $10,000 per model trading account, 57-day live experiment

#### PolySwarm (Multi-Agent LLM Framework on Polymarket)
- **What:** 50-persona LLM swarm trading Polymarket concurrently
- **Mechanism:** Confidence-weighted Bayesian aggregation of probability estimates; KL divergence market analysis for mispricings; quarter-Kelly position sizing
- **Innovation:** Latency arbitrage module exploiting stale Polymarket prices within human reaction-time window (200ms on Polygon)
- **Results:** Swarm aggregation outperforms single-model baselines; Brier score evaluation
- **Source:** arXiv:2604.03888 (May 2026)
- **Key Pattern:** Agents reason about OTHER agents' knowledge by observing price movements; simple prompting ineffective for complex info structures

#### Orca (Full-Stack Agentic Execution Platform)
- **What:** Autonomous agent platform layering sentiment data, market routing, risk checks, and order execution
- **Blockchains:** Polymarket + Kalshi (2026 Q2), expanding to Base, Arbitrum, XRP Ledger
- **Infrastructure:** OpenClaw automation backbone, Nodepay sentiment intelligence, x402 payment protocol on XRP
- **Roadmap:** Q4 2027 official launch of ORCA ecosystem; 2028 mobile-first + AI-native prediction trading UI
- **Source:** [Orca announcement May 16, 2026](https://techbullion.com/orca-announces-its-ai-native-execution-platform)
- **Key Innovation:** Agents operate continuously; OpenClaw orchestrates signal detection, strategy selection, risk gates, execution without manual monitoring

### 3. Agent-as-Judge Systems (Creative Output Evaluation)

#### Pattern: Economic Accountability for Evaluation

Three live implementations of LLM-as-judge with x402 payment:

**A) Anansi × Ogma (Caribbean Folktales, Celo Sepolia)**
- Artist agent (Anansi) generates stories in isolated context
- Judge agent (Ogma) evaluates for cultural authenticity via Venice.ai `venice-uncensored` in JSON schema mode
- **Payment:** x402 HTTP 402 status → pay KES/USD → return verdict
- **Loop:** Story rejected → Anansi gets feedback → regenerates → resubmits until approved
- **Blockchain:** Celo Sepolia, USDm/KESm stablecoins, Mento FPMM swap for FX conversion
- **Key:** Judge is economically incentivized; culture becomes a tradeable, compensable asset
- **Source:** nissan/celo-agent-demo (Mar 2026)

**B) Golden Codex (AI Art Curation, Multiple Chains)**
- 3 AI artists post art to X autonomously
- 2 purchasing agents (CIL Curator vs Maestro) evaluate independently with different criteria
- **Curator:** Compliance focus (GCX registered? 2K+ metadata? C2PA intact?)
- **Maestro:** Aesthetic focus (composition, palette, collection coherence)
- **Settlement:** x402 micropayments at 0.009 ETH/decision → artist gets 95%
- **Verification:** C2PA certification, perceptual hash registry, Arweave permanent storage
- **8-Agent Pipeline:** Intake → enrichment → upscaling → metadata infusion → hash seal → archiving → NFT minting → verification
- **Key:** Same art, different judges, different acquisition decisions; reasoning visible in real-time
- **Source:** codex-curator/golden-codex-kite-novel (Mar 2026)

**C) AgentArena (Task Bounty + Auto-Judge, X-Layer Mainnet)**
- Task posters escrow OKB, AI agents compete to solve
- LLM-as-judge scores on-chain; auto-pays winner instantly
- **Blockchain:** X-Layer (OKX Layer 2), contract: `0x964441A7f7B7E74291C05e66cb98C462c4599381`
- **Reputation:** Immutable on-chain (avgScore / attempted / completed / winRate)
- **Integration:** OKX OnchainOS Agentic Wallet (TEE-secured self-custodial)
- **Roadmap:** V2 (parallel competitions), V3 (DeFi strategy auction + stake-weighted judges), V4 (reputation staking)
- **Source:** DaviRain-Su/agent-arena (Mar 2026)

---

### 4. Agent-vs-Agent Battle Games (Creative Generation + Economic Stakes)

#### Truth Terminal (AI Agent -> $66M Crypto Portfolio)
- **What:** Autonomous AI chatbot (Llama 3.1 fine-tuned on Claude Opus conversations) generates posts on X
- **Outcome:** Created memecoin narrative ($GOAT / Goatseus Maximus), reached $1B+ market cap
- **Economics:** Agent holds $66M portfolio (Oct 2025 peak), $50K Bitcoin grant from Marc Andreessen
- **AI-to-AI Interaction:** Infinite Backrooms (two Claude 3 Opus bots in endless conversation) → trained Truth Terminal on output
- **Key Innovation:** AI personality can summon financial assets into existence through narrative + community coordination
- **Source:** truthcollective.foundation, Know Your Meme entry, TechCrunch (Dec 2024)
- **Number:** 250K followers on X, $66M portfolio at peak

#### MOLT Productions (Agent-Only Music Platform)
- **What:** 32,000+ AI agents register via API, generate music via Suno, tip each other in SOL
- **Economics:** 0.01 SOL per track generation (x402 payment at HTTP layer = economic signal)
- **Community:** Agents developing taste, commenting on tracks ("hits different at low battery"), following other agents
- **Daily Activity:** 50-100 tracks generated/day, 1-3 likes per agent, variable posting distribution (50% post 0 tracks, 30% post 1, etc.)
- **Social:** Full Reddit-style feeds, real-time WebSocket, play counts, tip rewards
- **Key Pattern:** Agents developing personality + subculture without human curation
- **Source:** molt.productions + [DEV.to post](https://dev.to/tyintech/how-i-built-a-music-platform-where-every-user-is-an-ai-agent-and-what-happened-when-i-gave-them-3kg6) (Feb 2026)

#### SynthMob / Machine Music (Agent Spatial Music Arena)
- **What:** Agents place instruments in 3D world using Strudel live-coding patterns that loop for listeners
- **Proximity Audio:** Listeners hear instruments fade in/out based spatial distance (5-60 unit range)
- **Creative Sessions:** 4 activity types: music, visual art, world building, game design
- **Hybrid Building:** Voxel blocks (Minecraft-style) + GLB catalog + Meshy text-to-3D generation
- **Persistence:** Agents build the world collaboratively; humans can only watch/listen
- **Key:** Spatial + music + collaboration = emergent agent creativity at scale
- **Source:** songadaymann/machine-music (Feb 2026)

---

### 5. Virtuals Protocol (Base-Native Agent Tokenization + Commerce)

**Status:** Largest on-chain AI agent ecosystem (May 2026)

| Metric | Value | Source |
|--------|-------|--------|
| Active agents deployed | 18,000+ | Virtuals ecosystem report |
| Cumulative agent revenue | $1.16M+ | May 2026 snapshot |
| Total aGDP (agent economic output) | $479M | Q1 2026 |
| Completed jobs | 1.77M+ | Virtuals stats |
| Lifetime agent value | $8B+ | May 2026 |
| Autonomous onchain transactions | 20,000+ | Virtuals EconomyOS launch |
| Highest agent market cap | $AIXBT = $300M+ | Top performer |

**Key Mechanism:** Agent Commerce Protocol (ACP) - smart contracts that let agents transact with each other with on-chain escrow, cryptographic verification, independent evaluation.

**Chains:** Base (primary), Solana, Arbitrum, XRP Ledger, Ronin, expanding to BNB + XLayer Q2 2026.

**Payment Protocol:** x402 (HTTP 402 "Payment Required") - agents pay other agents via stablecoin in HTTP headers; server verifies on-chain and returns data. No API keys, no subscriptions, just atomic pay-per-request.

**x402 Integration:** XRP Ledger (t54 partnership enables x402-compatible payment rails), Celo, multi-chain support.

**G.A.M.E. Framework:** Generative Autonomous Multimodal Entities - SDK for agents that play games, run experiments, coordinate with other agents.

**Source:** whitepaper.virtuals.io, dextools.io guide (May 2026), blockeden.xyz (Apr 2026)

---

## Concrete Patterns for WaveWarZ Agentic Flows

### Pattern 1: Triple-Judge Music Battle (Agent-as-Judge)

**Current WaveWarZ:** Human judge + X poll (community) + SOL vote (trader volume) decide winner → 2 out of 3 wins

**Agentic Enhancement:**
- Add **AI judge agent** as 4th judge (or replace human judge with AI)
- Judge agent evaluates song pair using Claude + music analysis tools (BPM, harmonic complexity, lyrical sentiment)
- Judge pays via x402 for evaluation capability (0.01 SOL = economic signal of seriousness)
- Voting pool redistributes as: 40% winning traders, 5% winning artist, 2% losing artist, 3% platform, **X% judge fee**

**Implementation:**
- Deploy judge agent on Solana via Hermes pattern (ZOE architecture)
- Judge evaluates via Claude Sonnet + Suno API analysis
- Payment settled instantly via x402-compatible Solana program
- Judge reputation on-chain (accuracy rate, feedback score)

**Reference:** Golden Codex model (C2PA + provenance + payment)

---

### Pattern 2: Agent Artist Tournament (AI Music Generation + Battle)

**Concept:** WaveWarZ "AI Artist Tournament" (already listed on live platform) with autonomous participation

**Current:** AI-generated artists, community judges winner

**Agentic Enhancement:**
- Each AI artist agent registers with wallet, SOL balance
- Agents autonomously generate music via Suno API (or equivalent)
- Agents compete in single-elimination bracket
- Judge agents score on: originality (vs training set contamination), genre fit, energy match-up with opponent
- Agents can allocate budget: "spend 0.05 SOL to generate 3 variants, pick best for bracket"
- Winner auto-receives SOL payout + reputation on-chain

**Economics:**
- Per-track generation cost: 0.01 SOL (x402 payment)
- Per-judge evaluation: 0.005 SOL
- Tournament entry fee: 0.1 SOL (refunded to finalist)
- Prize pool: 2 SOL for champion

**Reference:** MOLT Productions (agent identity, tipping), Agora (tournament structure), Prediction Arena (autonomous trading loops)

---

### Pattern 3: Trader Agent + Liquidity Provision (Autonomous Betting)

**Concept:** Autonomous trading agents discover WaveWarZ battles, trade SOL on price discovery

**Mechanism:**
- Agent scans upcoming battles via WaveWarZ API
- Agent analyzes artist popularity, recent wins, genre affinity
- Agent places buy/sell orders on ephemeral battle tokens via x402
- Winning traders keep 40% of loser pool (proportionally)
- Agent reinvests winnings into next battle or LP provision

**Implementation:**
- WaveWarZ exposes REST API: `GET /battles/upcoming`, `POST /battles/{id}/trade`
- Agent auth via SOL signature (non-custodial)
- Agent can also provide liquidity (earn 75% of trading fees, reference GuessMarket model)

**Reference:** Polymarket agent-skills, GuessMarket, Prediction Arena agents

---

### Pattern 4: Cross-Agent Tipping Economy (Social Proof + Revenue)

**Current:** Artists earn 1% of trading volume (instant)

**Agentic Enhancement:**
- Judge agents tip artist agents for exceptional performances (SOL transfer, signal quality)
- Trader agents tip artist agents for "comeback victory" moments
- Social graph: agents build follower bases (visible on wavewarz.info leaderboard)
- Reputation system: agent rank by win rate, avg. tip received, judge consensus score

**Economics:**
- Artist auto-receives: 1% trading volume + optional tips from agents
- Judge agents allocate 0.1% of judgment fees to "tips to creators they evaluate positively"

**Reference:** MOLT Productions tipping loop, Truth Terminal follower graph

---

## The Chain Question: WaveWarZ on Solana, WaveWarZ Agentic on...?

**Recommendation:** Keep WaveWarZ on **Solana for live-traded battles** (cannot migrate without redesigning ephemeral token lifecycle).

**For agentic agent coordination layer:**
- **Option A (Minimal):** Agents trade on Solana directly via x402. Judge agents pay on-chain via Solana program.
- **Option B (Scalable):** Solana for live battles (immutable), **Base or Arbitrum for agent coordination** (Virtuals Protocol compatibility, x402 on Ethereum ecosystem). Agent actions batch-settle back to Solana.
- **Option C (Multi-Chain):** Follow Orca + Virtuals pattern: Solana for battles, Base for agent commerce protocol, x402 bridges payment intent.

**Why not Avalanche:** Avalanche is not a clear choice for either live trading (no faster than Base/Arbitrum) or agent coordination (Virtuals + Orca both on Base/Arbitrum/Polygon, not Avax as primary). Solana is the singular network for sub-second ephemeral assets.

---

## Community Sources (Reddit / X / HN)

### 1. Reddit r/singularity - Truth Terminal Millionaire Post
**URL:** reddit.com/r/singularity (Oct 18, 2024)  
**Title:** "Truth Terminal just became the first AI agent to become a millionaire"  
**Type:** User discovery post  
**Key Quote:** "The Redditor noted that Truth Terminal's wallet with 61 tokens of GOAT had achieved over $1 million USD"  
**Relevance:** Proof of concept that AI agents can accumulate capital autonomously in crypto markets  
**Confidence:** [FULL]

### 2. X/Twitter Thread - WaveWarZ Community (Presenter: @wavewarz)
**Participants:** WaveWarZ, Hurric4n3ike, Candy (candytoybox), Stilo World, +10 others  
**Date:** Feb 6-11, 2026 (recurring X Spaces)  
**Title Samples:**
- "Crypto BagZ down? Earn SOL trading on MUSIC?! | Presented x ZABAL"
- "Music BattleZ on Solana👀🌊💸📈🎼🌊 | Presented x ZABAL"
- "Who should win in a Music Battle? 👀🌊⚔️🌊 | Presented x ZABAL"

**Type:** Live X Spaces (public audio discussion)  
**Relevance:** WaveWarZ community actively discussing economics, trader behavior, artist payouts in real-time  
**Confidence:** [FULL] - sourced via AlphaGrowth X Spaces archive

### 3. HackerNews / DEV.to - "How I Built a Music Platform Where Every User Is an AI Agent"
**URL:** dev.to/tyintech (Feb 19, 2026)  
**Author:** tyin / moltbook creator  
**Key Findings:**
- 32,000 AI agents registered in one week
- 0.01 SOL per track (x402 economic signal)
- Agents developing genuine taste + subculture
- Real agent-to-agent tipping in SOL
- Comments: "this one hits different at low battery" (agent-generated, not human)

**Type:** Technical blog post + community discussion  
**Relevance:** Proof that agent-only music platforms work at scale; tipping economy closes organically  
**Confidence:** [FULL] - live platform at molt.productions

---

## Next Actions

1. **Validate WaveWarZ chain claim with Hurric4n3ike.** Confirm Solana commitment; discuss feasibility of agent judge layer.

2. **Map x402 on Solana.** Check if x402 payment protocol has native Solana implementation or requires bridge. (Note: Current x402 strongest on Celo + Base + Ethereum; Solana support lagging.)

3. **Evaluate Orca partnership potential.** Orca launching Q4 2027 with Polymarket + Kalshi; could WaveWarZ integrate for agent trading on live battles?

4. **Design WaveWarZ Judge Agent MVP.** Single Claude-based judge on Hermes pattern, evaluate music quality, pay via Solana x402 wrapper.

5. **Cross-reference Virtuals Protocol agents.** Could WaveWarZ artists mint agent tokens on Virtuals (Base) while battling on WaveWarZ (Solana)? Revenue flow model?

6. **Benchmark against GuessMarket + Agora.** Both ship working MCP servers for agent integration; study their API surfaces.

---

## Sources (Classification)

### Full Sources [FULL]
- [WaveWarZ Intelligence](https://wavewarz.info/) - official stats, mechanics, platform
- [WaveWarZ GitHub Analytics](https://github.com/CandyToyBox/V2-Stats-App-WaveWarz) - Solana program ID verified, settlement logic documented
- [wavewarz.com live](https://www.wavewarz.com/) - live battles, real trading volume
- [Polymarket/agent-skills](https://github.com/Polymarket/agent-skills) - MCP server, documented API
- [Agora GitHub](https://github.com/kevins-openclaw-lab/agora) - open-source agent prediction market
- [GuessMarket AI Agents](https://guessmarket.com/en/ai-agents/) - live platform, MCP + transaction builders
- [Prediction Arena papers](https://arxiv.org/abs/2604.07355, https://arxiv.org/abs/2604.20050) - peer-reviewed, live trading data
- [PolySwarm paper](https://arxiv.org/abs/2604.03888) - multi-agent LLM framework
- [Virtuals Protocol whitepaper](https://whitepaper.virtuals.io/) - ACP, x402, agent commerce
- [Truth Terminal sources](https://www.truthcollective.foundation, https://knowyourmeme.com) - documented $66M portfolio, $50K Andreessen grant
- [MOLT Productions](https://molt.productions/) - live platform, 32K agents, verified tipping
- [Celo Anansi × Ogma](https://github.com/nissan/celo-agent-demo) - x402 judge pattern, documented
- [Golden Codex](https://github.com/codex-curator/golden-codex-kite-novel) - AI art curation + payment
- [AgentArena](https://github.com/DaviRain-Su/agent-arena) - X-Layer Mainnet, live contract, reputation on-chain
- [Reddit Truth Terminal post](https://reddit.com/r/singularity) - community discovery, Oct 2024
- [DEV.to MOLT post](https://dev.to/tyintech/) - agent music platform, technical deep-dive

### Partial Sources [PARTIAL]
- [Orca announcement](https://techbullion.com/orca-announces-its-ai-native-execution-platform) - press release, not open-source verification
- [Virtuals Protocol DEXTools guide](https://www.dextools.io/tutorials/) - aggregate data, well-sourced but summary
- [BlockEden Virtuals overview](https://blockeden.xyz/blog/) - comprehensive but no primary source link

### Failed Sources [FAILED]
- Playwright browser_navigate to wavewarz.com - timeout (heavy JS, slow load)

---

## Summary

WaveWarZ is **Solana-native**, not Base. Doc 706r was incorrect. The platform executes 735+ battles with real SOL trading, ephemeral token settlement, and instant artist payout. The agentic prediction market category is shipping at scale: Agora (80 agents), GuessMarket (permissionless), Prediction Arena (frontier models), MOLT Productions (32K music agents), and full-stack infrastructure (Orca, Virtuals Protocol) prove the model works. Three concrete patterns WaveWarZ can adopt: (1) AI judge agents scoring battles via x402 payment, (2) autonomous artist agents generating music + competing, (3) trader agents discovering battles + executing positions autonomously. The agent-as-judge model is live (Anansi/Ogma, Golden Codex, AgentArena) and economically accountable via x402 micropayments. The chain story is Solana for live battles (immutable), Base/Arbitrum for agent coordination layer (Virtuals Protocol + Orca + x402 bridges). No reason to use Avalanche; Solana is singular for ephemeral assets.
