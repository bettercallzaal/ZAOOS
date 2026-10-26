# Research by Topic

Use this to quickly find if a topic has already been researched.

**Important:** Always cross-reference research docs with the actual codebase (`src/`). Research docs may contain aspirational designs not yet implemented.

## Farcaster Protocol & Ecosystem
- `001` — Protocol architecture, Snapchain, identity
- `002` — Hub API, Neynar SDK, managed signers
- `017` — SIWF auth, FID registration, onboarding
- `019` — Ecosystem landscape (clients, tools)
- `021` — Deep dive 2026 (Neynar acquisition, DAU, future)
- `022` — Players, leaderboards, tokens (DEGEN/MOXIE/NOTES/CLANKER)
- `034` — All clients compared (18+), notification systems
- `073` — Farcaster ecosystem 2026 update (Neynar acquisition, Mini Apps, CLANKER)
- `010` — Hypersnap (incomplete)
- `250` — **Mini Apps llms-full.txt deep dive (April 2026)**: 15+ SDK actions, haptics API, back navigation, share extensions, EIP-5792 batch txns, webhook signature verification gap, manifest update, capability detection, 17 features vs ZAO OS current
- `304` — **Quilibrium, Hypersnap & free Neynar API (haatz.quilibrium.com)**: farcasterorg, Neynar acquisition, Hypersnap node specs, verified free endpoints, dual-provider integration plan
- `305` — **Channel moderation & community management**: Farcaster Client API (18 endpoints), ban/hide/pin/invite/block, Ed25519 auth, 3-phase build plan
- `306` — **Protocol features gap analysis (CANONICAL)**: 200+ Neynar endpoints mapped, 22 used/47 unused, notifications/mute/block/rewards/subscriptions/AI summaries, Farcaster Pro $120/yr
- `309` — **Snapchain vs Hypersnap protocol deep dive (CANONICAL)**: Malachite BFT, 11 validators, 10K TPS, 780ms finality, account sharding, Hypersnap fork (Tantivy search + Neynar API), Quilibrium privacy (oblivious transfer, MPC), on-chain contracts
- `317` — **Agentic Bootcamp Week 1 (CANONICAL)**: Sessions 1-6 full transcripts. Building blocks, miniapps, agents 101 (Clanker), memory/context (45% rule), Privy wallets, hands-on build
- `316` — **Agentic Bootcamp Week 2 (CANONICAL)**: Sessions 7-9. x402/MPP commerce, Emerge viral loop, ERC-8004 identity/reputation (100K+ agents)
- `318` — **Cassie Heart multi-agent coordination (CANONICAL)**: Session 10. Persona engineering, softmax selection, humanization, Quilibrium free stack

## Dev Workflows & Agent Tooling
- `212` — Vercel integrations, Airtable, custom integration console
- `164` — Skills, research workflow & autoresearch improvements (MCP servers, OSS code search, self-improvement)
- `137` — Skills audit, cleanup & security best practices
- `154` — Skills & commands master reference
- `165` — Claude Code multi-terminal management (claude-squad, ccboard, permission modes, worktrees, tmux)
- `241` — HowiAI (Gridley): narration workflows, 10x delegation test, AI habit formation, /standup upgrade, /reflect skill
- `242` — Claude 20 underused features audit: 15/20 solved, voice mode gap, artifacts opportunity, model selection
- `243` — Claude intermediate guide (@aiedge_): Skills 2.0 evals/A/B testing, Cowork Dispatch, scheduled tasks, reverse prompting
- `245` — ZOE upgrade playbook: OpenClaw v2026.3.31, Mem0 memory, Neynar webhook relay, auto-dream, Telegram keyboards, competitive monitoring, founder agent patterns
- `246` — Neynar API 130+ endpoints audit: community radar, auto-curation, channel intel, smart engagement, x402 pay-per-call, 4 agent patterns
- `253` — **AutoAgent self-optimizing agents**: meta-agent loop for harness engineering, model empathy, trace-based learning, overfitting guards, 5 emergent behaviors, comparison vs DSPy/Meta-Harness/ADAS
- `278` — **Farcaster Agentic Bootcamp vs ZAO agent squad**: gap analysis (ERC-8004, x402, mini app, notifications), 7-agent dispatch ahead of bootcamp Session 10, $16 to close all gaps
- `280` — **FID registration & x402 deep dive**: fid-forge x402 broken (empty 402 body), direct on-chain IdGateway ($7.30), x402-fetch works for Neynar hub ($0.001/call), 5 contract addresses, full agent identity flow

## Music & Audio
- `003` — Music APIs (Audius, Sound.xyz, Spotify, SoundCloud, YouTube)
- `167` — Audio APIs 2026, music players, displays, EQ, spectrum, reference implementations
- `043` — Live audio rooms (LiveKit, WebRTC, synchronized listening)
- `279` — **Audio room competitive landscape 2026**: Clubhouse (async pivot, 36.5M MAU), X Spaces ($45M creator payouts), Discord Stage (10K audio cap), Huddle01 (dRTC), Rally (dormant), Spotify/Amazon post-mortems, provider pricing (Stream/LiveKit/100ms/Daily), FISHBOWLZ next actions
- `033, 043` — Audio player architecture, waveforms, streaming
- `119` — SongJam audio spaces iframe embed, 100ms SDK, /zabal page
- `122` — SongJam screen share PR, Stream Video SDK, MyScreenShareButton
- `126` — Music player gap analysis: missing features (favorites, history, queue, presence, reactions)
- `127` — Mobile player optimization: MediaSession, swipe gestures, expanded player, crossfade, gapless, iOS PWA audio
- `128` — **Music player complete audit (CANONICAL)**: all 23 components, 23 endpoints, future roadmap
- `130` — Next music integrations (Tier 4): Spotify API, Audius SDK, Farcaster embeds, AI recs, Zora NFTs, scrobbling
- `138` — Play counting & stream attribution: which platforms count ZAO OS plays, Last.fm/ListenBrainz scrobbling
- `209` — **AI video generation for music**: Seedance 2.0, Neural Frames, Freebeat, Kling 3.0, Runway Gen-4, Sora 2 — pricing, music-specific features, API status, ZAO integration paths
- `211` — **Music player UI best practices 2026**: platform comparison, gap analysis (polish not features), quick wins (a11y, animations, glassmorphism), Motion transitions, keyboard shortcuts, WCAG audit, social features

## Events & IRL
- `213` — ZAO Stock tactical planning (venue, production, tech, artist booking)
- `224` — **ZAO Stock multi-year vision**: 5-year roadmap, conference models (Network School, Departure, NFC, Ars Electronica), Ellsworth integration, summer camp format, workshop curriculum, virtual pipeline

## On-Chain Music Distribution & NFTs
- `139` — Trustware SDK evaluation (crypto payment middleware, too early)
- `140` — BuilderOSS ecosystem (10 repos, ZOUNZ contracts, builder-template-app, @builderbot)
- `141` — On-chain distribution landscape 2026 (Zora, 0xSplits, Unchained, Audius, Catalog)
- `142` — Zora Protocol SDK for music NFTs (create1155, Base chain, code examples)
- `143` — 0xSplits revenue distribution (automated splits, Zora integration, waterfall/swapper)
- `144` — ZOUNZ + music NFTs unified (DAO-governed distribution, proposal templates)
- `145` — Simple NFT platform design (3-step UX, gas sponsorship, mobile-first)
- `146` — Open contracts multi-artist distribution (forkable trio, community.config.ts fork point)
- `147` — Full distribution pipeline (Audius + Zora + ZOUNZ, unified dashboard)
- `148` — Master integration plan (5 phases, 6-8 weeks, all docs consolidated)
- `149` — BuilderOSS deep dive: every package, hook, UI component, subgraph
- `150` — Arweave permanent music storage via Irys SDK ($0.04/track, 200+ years)
- `151` — **ZOUNZ distribution WITHOUT Zora**: Arweave + thirdweb + 0xSplits (supersedes 142/144)
- `152` — **Arweave ecosystem deep dive (CANONICAL)**: AO compute, ar.io Wayfinder CDN, ArDrive Turbo, GraphQL indexing, ArNS domains, Irys deprecated
- `153` — **BazAR & atomic assets for music**: Arweave-native marketplace, UCM orderbook, UDL licensing, fractionalization, $U token, primary distribution
- `155` — **Music NFT end-to-end implementation (THE BUILD PLAN)**: upload MP3+art → mint → buy, every file/route/component, ArDrive Turbo + Arweave Wallet Kit, 52hrs
- `156` — Pods.media podcast tokenization: Pods still active (900K mints, $1M rev), ZAO clone on Arweave atomic assets, RSS from GraphQL, ~5 days

## Respect & Governance
- `004` — Respect tokens (aspirational design — tiers/decay NOT implemented)
- `056` — ORDAO, OREC governance, Respect1155, Fibonacci scoring
- `285` — ORDAO + ORFrapps updated docs: CLI, config system, deployment, orclient, ZAO integration
- `131` — On-chain governance: ZOUNZ Governor, Snapshot, OZ Governor + Respect, hybrid architecture
- `132` — Snapshot weekly priority polls: one-click creation, approval voting, multi-project templates
- `133` — **Governance system complete audit (CANONICAL)**: all 3 tiers, 5 API routes, 6 components, Respect-weighted voting, auto-publish, future roadmap
- `058` — Respect deep dive (on-chain data, scoring math, orclient SDK)
- `031` — DAO structure, token economics, Wyoming DUNA, Safe multisig
- `029` — Artist revenue, IP rights, streaming economics
- `037` — Competitors (Sound.xyz dead, Catalog dead, Coop Records)

## Identity & Roles
- `005` — ZAO Identity / ZIDs (music profile + Respect + roles)
- `007` — Hats Protocol (on-chain role trees, ERC-1155)
- `055` — Hats Anchor App, DAO tooling landscape
- `023` — Austin Griffith, ETH Skills, ERC-8004, onchain credentials
- `059` — Hats tree integration for ZAO roles
- `075` — Hats Protocol V2 updates, new modules, HSG v2, MCP server
- `282` — **Privy auth for FISHBOWLZ**: `@privy-io/react-auth` v3.18.0, 0–499 MAU free, Farcaster FID via `user.farcaster.fid`, `PrivyClient.verifyAccessToken()` for API routes, PrivyProvider setup, Stripe acquisition, Supercast reference
- `283` — **Privy embedded wallets + token mechanics on Base**: ETH tips (TipButton.tsx already built), ERC-20 token gate (tokenGate.ts already built), in-app Uniswap V3/V4 swap, fee split (2% treasury), server wallets (`caip2: eip155:8453`), Clanker SDK v4 deployment, gas sponsorship, `@privy-io/wagmi` 1-line config change
- `284` — **Privy full feature deep-dive for FISHBOWLZ**: embedded wallet tipping (ETH+USDC), Farcaster write signers (free/sponsored), Mini App `loginToMiniApp()`, gas sponsorship (16+ chains), token gating via Viem `readContract`, Privy Earn/DeFi vaults, 12 webhook events + Supabase sync, cross-app global wallets, Privy+Neynar complementary usage, full pricing table

## AI Agent
- `024` — ZAO AI agent plan (ElizaOS + Claude + Hindsight)
- `008` — AI memory architecture (implicit, explicit, pgvector)
- `026` — Hindsight memory system (91.4%, retain/recall/reflect)
- `046` — OpenFang Agent OS (not a fit, but reference architecture)
- `161` — **Agent harness engineering (LangChain DeepAgents)**: Agent=Model+Harness, virtual filesystems, Ralph Loop, context rot, subagent orchestration, ZAO agent architecture
- `210` — **Microsoft Agent Lightning**: RL training for agents (APO/GRPO/PPO/SFT), LightningRL hierarchical RL, Python+GPU — SKIP for ZAO now, steal APO evaluate-critique-rewrite pattern
- `227` — **Agentic workflows 2026**: Vercel AI SDK 6 + Mastra + Claude Agent SDK, 5 ZAO agent designs, DAO governance agents, music AI DJ, cost analysis ($25-50/mo)
- `232` — **MCP Server development guide**: protocol architecture, 3 primitives, SDK v1.29.0, Streamable HTTP, OAuth 2.1, ZAO MCP audit (8 tools), Resources/Prompts/HTTP roadmap, registries
- `251` — **HuggingFace platform deep dive**: Write token, thezao org, ACE-Step LoRA training, community music dataset, branded Gradio Space, ZeroGPU (free H200), PRO $9/mo, GPU pricing

## OpenClaw & Agent Infrastructure
- `197` — OpenClaw agent memory & knowledge system (3-layer, QMD, $5/mo VPS)
- `202` — Multi-agent orchestration: OpenClaw → Paperclip → ElizaOS, $75/mo
- `204` — OpenClaw setup runbook (VPS, Docker, Telegram, GitHub MCP)
- `205` — OpenClaw + Paperclip + ElizaOS deployment plan (3-phase)
- `207` — ZAO VPS agent stack session log (March 28 deploy)
- `208` — OpenClaw skills & capabilities (52 skills, 82 extensions, 10 channels)
- `214` — ZAO knowledge graph (KNOWLEDGE.json, 194 docs, tags, relations)
- `226` — Paperclip + OpenClaw best practices (SOUL.md <200 lines, 4 personas, MCP)
- `234` — **OpenClaw comprehensive guide (CANONICAL)**: SOUL.md/AGENTS.md/MEMORY.md patterns, knowledge graphs (Cognee/Graphiti/12-Layer), MCP configs, context management, token optimization, multi-agent, cron, 60+ sources
- `235` — Free web search MCP alternatives: Brave dead, DuckDuckGo MCP + Jina Reader ($0), Tavily (1K free/mo), SearXNG self-hosted
- `236` — Autonomous OpenClaw operator pattern: 3-layer memory, hourly heartbeat ($1.73/mo), nightly consolidation, "Next 3 Moves", delegation
- `237` — USV agents + Tasklet + Malleable Software: named agents, "mentions" data model, skills paradigm, Build Something You Want era
- `238` — Claude tools Top 50 evaluation: Context7 (USE), claude-squad (USE), TDD Guard (USE), Claude SEO (USE), MCPHub (USE)
- `239` — Agent frameworks & infrastructure: OpenClaw stays, promptfoo for security, n8n/Task Master WATCH

## Coordination & Incentives
- `064` — Incented protocol: ZABAL campaigns, staking-based task coordination
- `065` — ZABAL partner ecosystem: MAGNETIQ, SongJam, Empire Builder, Clanker
- `249` — **Incented deep dive + new campaigns + ClawDown**: conviction voting mechanics, 3 new ZABAL campaigns (bug bounty, music curation, research docs), ClawDown.xyz poker challenge for ZOE (144 USDC), program design parameters

## Community & Growth
- `012` — Gating (allowlist → NFT → Hats → EAS)
- `287` — ZAO FAQ + Word Wall: community-driven web3 glossary, Respect-weighted voting, Urban Dictionary-style, peth Roadmapr pattern
- `289` — **ZAO Tool Box (CANONICAL)**: complete inventory of 47 tools across 8 categories, every built feature documented
- `013` — Chat messaging (Farcaster channels + XMTP)
- `074` — XMTP V3 browser SDK, MLS encryption, mainnet fees
- `015` — MVP specification
- `020` — Followers/following feed (sortable, filterable)
- `032` — Onboarding, growth 40→1000, moderation, gamification
- `035` — Notifications (Mini App push + Supabase + polling)
- `047, 048` — ZAO community ecosystem
- `169` — AI education for music creators: Learn Vibe Build, landscape gap, ZAO Builders pilot design

## WaveWarZ Integration
- `095` — Solana wallet, initial WaveWarZ + multi-wallet settings
- `096` — WaveWarZ deep dive: mechanics, economics, 3-tool ecosystem
- `097` — Artist discovery pipeline: onchain data, auto-spotlight, profile enrichment
- `099` — Prediction market music battles: parimutuel schema, settlement math
- `100` — Solana PDA reading in Next.js: web3.js, buffer-layout, Helius
- `101` — **WaveWarZ × ZAO OS Whitepaper (CANONICAL)**: full platform data (647 battles, 43 artists w/ wallets, $38K volume), Artist Discovery Pipeline architecture, governance synergy, 10-day roadmap
- `244` — **ZOUNZ treasury revenue via Polymarket**: Claude API probability bot for zero-fee geopolitics markets, 12 open-source tools (py-clob-client, polyterm, poly_data), $500 starting capital, 4-phase deployment (backtest→paper→proposal→live), CFTC-regulated, security model
- `244` — **Polymarket prediction market analysis**: 14K wallet analysis, 12 open-source tools (poly_data, polyterm, poly-maker, Polymarket/agents), Claude API probability estimator, EV/Kelly/Bayes formulas, Quarter Kelly sizing, malware security warning, WaveWarZ analytics relevance

## Social Connections & Settings
- `107` — X handle auto-import from Farcaster, settings UI redesign, multi-social connections
- `110` — Community directory CRM: replace Webflow, engagement scoring, CSV import, on-chain enrichment
- `221` — **Admin dashboard best practices**: benchmark vs Guild.xyz/Coordinape/Collab.Land/Hats/Discourse/Herocast, 8 missing features, 13.5-day roadmap
- `198` — **Social graph analytics & discovery**: Neynar v2 + OpenRank + Airstack comparison, 9 components audited, 4-phase integration plan (OpenRank, relevant followers, persistent graph, on-chain signals)
- `199` — **Advanced social graph features**: unfollower tracking, force-directed visualization (6 libs compared), growth analytics dashboards, conversation clustering, influence mapping, 9 Farcaster analytics tools surveyed

## Payments & Fiat On-Ramp
- `125` — Coinflow fiat checkout (cards, ACH, Apple Pay → USDC on EVM), React SDK, webhooks, Credits

## Cross-Platform
- `028` — Publishing to 11 platforms (fan-out architecture)
- `036` — Lens Protocol V3 (collect/monetize, Bonsai)
- `037` — Discord & Telegram bridges
- docs/HIVE_RESEARCH.md — Hive cross-posting
- `123` — DFOS (Dark Forest OS): private-first creative group infra, Ed25519 chains, did:dfos, Metalabel

## Technical Infrastructure
- `041` — Next.js 16 + React 19 patterns
- `042` — Supabase advanced (RLS, Realtime, Edge Functions, pgvector)
- `286` — Claude Cowork SEO workflow, ZAO OS SEO audit (zero JSON-LD, broken sitemap), music schema.org types, claude-seo skill
- `033` — Storage (R2/IPFS/Arweave), mobile (PWA/Capacitor), privacy (ZK)
- `014` — Project structure, file conventions
- `016` — UI reference, design tokens
- `054` — Superpowers agentic skills framework

## APIs & Services
- `009` — Public APIs landscape (Tier 1/2/3)
- `025` — 100+ APIs mapped to ZAO features
- docs/neynar-credit-optimization.md — Neynar credit optimization
- docs/XMTP_RESEARCH.md — XMTP research
- docs/MINIAPP_RESEARCH.md — Mini App research
- `162` — Open source projects directory (29 projects: Audius, Sonata, Frog/Frames, Umami, Funkwhale)

## Security & Code Quality
- `018` — Pre-build security checklist
- `040` — Codebase audit guide + results
- `038` — AI code audit, cleanup agents, CI pipeline
- `057` — March 2026 security audit (all fixes verified)
- `066` — Backend testing strategy: Vitest + NTARH + MSW, 47-route audit
- SECURITY.md in project root

## Business Model & Strategy
- `263` — **Obsidian lean team playbook**: $350M valuation, 9 employees, 3 engineers, $25M ARR bootstrapped, "file over app" philosophy, plugin ecosystem, ZAO OS parallels (protocol-native, community-owned, AI force multiplier), premium tier strategy

## Project Documentation
- `050` — The ZAO Complete Guide (CANONICAL)
- `051` — Whitepaper Draft 5
- `052` — Whitepaper critique
- `053` — Whitepaper user testing
- `039` — GitHub documentation, README, showcase
- `045` — Research organization patterns
- `027` — Comprehensive overview + gap analysis
- `030` — bettercallzaal GitHub inventory (65 repos)

## Ethereum & Alignment
- `060` — Vitalik philosophy + EF mandate alignment
- `061` — Ethereum alignment opportunities for ZAO

## Development & Operations
- `044` — Agentic development workflows (Claude Code, GitHub Actions)
- `011` — Reference repos (Sonata, Nook, Litecast)
- `062` — Autoresearch: autonomous skill/prompt improvement loops
- `063` — Autoresearch deep dive: implementations, eval loop, 7 ZAO OS use cases
- `067` — Paperclip AI: agent company orchestrator, org chart, budgets, ZAO startup guide
- `068` — Alibaba Page Agent: in-page AI copilot, DOM dehydration
- `069` — Claude Code tips: 45 best practices audited against ZAO setup
- `070` — Sub-agents vs Agent Teams: multi-agent paradigms, Claude Architect patterns
- `165` — Claude Code multi-terminal management (claude-squad, ccboard, permission modes, worktrees, tmux)
- `166` — Dev workflow improvements: git history analysis, pre-commit hooks, auto-format, GH Actions review, scheduled agents, test coverage gaps
- `168` — Community innovations March 2026: autoresearch 10x, Council of High Intelligence, Learn Vibe Build
- `170` — Autoresearch 10x: binary eval checklists for 5 ZAO skills, Lehmann vs uditgoenka, dashboard/eval-guide to steal
- `171` — Council of High Intelligence: 11-agent deliberation, CC0, polarity pairs, 3 ZAO custom triads, install guide
- `172` — Solo founder AI dev case study: 584 commits/16 days, ZAO OS build log, productivity paradox, publishable article
- `071` — Paperclip rate limits: multi-agent API management, Anthropic tiers, staggering
- `072` — Paperclip functionality deep dive: full agent lifecycle, heartbeat, adapter config
- `076` — Git branching for AI agents (trunk-based dev)
- `077` — Bluesky cross-posting (@atproto/api, custom feeds, labeler)
- `078` — Nouns Builder (daily NFT auctions, DAO suite)
- `079` — SongJam music player research
- `080` — Jitsi Meet live rooms
- `081` — Paperclip multi-company agents
- `082` — Paperclip ClipMart plugins
- `208` — Paperclip plugins ecosystem update (11 community plugins, install plan, v2026.325.0)
- `083` — ElizaOS 2026 update (v1.7.2, v2 alpha)
- `084` — Farcaster AI agents landscape
- `085` — Farcaster agent technical setup (Neynar)
- `137` — Skills audit, cleanup & prompt injection security
- `154` — **Skills & commands master reference (CANONICAL)**: every command, skill, workflow, session flows, how to ask
- docs/superpowers/plans/ — Sprint plans
- docs/superpowers/plans/2026-03-17-decisions-resolved.md — Architecture decisions

## Wallet & Connection
- `049` — Wallet connection patterns (wallet-connect)

## Farcaster Mini Apps
- `086` — Farcaster Mini Apps SDK, Quick Auth, notifications (folder 173-farcaster-miniapps-integration)

## 3D / Metaverse
- `313` — Metaverse & 3D virtual world (R3F, Drei, Rapier, Colyseus, spatial audio, 7-room HQ)
- `315` — Metaverse codebase integration & onboarding (file map, quest/XP system, 3D tour, funnel)
- `319` — **Lightweight 3D portal hub (SUPERSEDES 313)**: CSS 3D + model-viewer, 18+ domain portals, AI concierge, token-gated, worst-Android compatible
