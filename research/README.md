# ZAO OS Research Library

> **155+ research documents** covering every aspect of building a decentralized social media platform for music — organized by topic for easy navigation.

---

## Farcaster Protocol & Ecosystem

Everything about the protocol ZAO OS is built on — how it works, who's building on it, and the tools available.

| # | Topic | Summary |
|---|-------|---------|
| [01](./01-farcaster-protocol/) | **Farcaster Protocol** | On-chain identity (Optimism) + off-chain messaging (Snapchain 10K+ TPS), storage units, FIDs, channels |
| [02](./02-farcaster-hub-api/) | **Hub API & Neynar** | REST + gRPC APIs, managed signers, Neynar as primary provider, SDK usage |
| [17](./17-neynar-onboarding/) | **Neynar Onboarding** | SIWF + managed signers + FID registration for wallet-only new users, EIP-712 |
| [19](./19-farcaster-ecosystem-landscape/) | **Ecosystem Landscape** | Open-source clients (Sonata, Herocast, Nook), frame frameworks, data providers |
| [21](./21-farcaster-deep-dive/) | **Farcaster Deep Dive (2026)** | Neynar acquisition, 40-60K DAU, Snapchain, developer-first pivot, what's coming next |
| [22](./22-farcaster-ecosystem-players/) | **Ecosystem Players & Leaderboards** | Top accounts, tokens (DEGEN/MOXIE/NOTES/CLANKER), mini apps, Purple DAO, analytics tools |
| [34](./34-farcaster-clients-notifications/) | **All Farcaster Clients Compared** | 18+ clients — pros/cons, features, notification systems, competitive positioning |
| [73](./73-farcaster-ecosystem-2026-update/) | **Farcaster Ecosystem Update (Mar 2026)** | Neynar acquires Farcaster, Snapchain live, 40-60K DAU, Mini Apps, CLANKER, competitive landscape |
| [86](./68-farcaster-miniapps-integration/) | **Farcaster Mini Apps Integration** | Mini Apps SDK, Quick Auth, notifications, cast composition — ZAO OS as a Mini App |
| [87](./81-farcaster-social-graph-sharing/) | **Farcaster Social Graph & Sharing** | Neynar user data APIs, social graph analysis, compose/share features for member profiles |
| [124](./124-sopha-deep-social-farcaster/) | **Sopha: Deep Social on Farcaster** | Curation client study — anti-algorithmic, long-form Farcaster client for meaningful conversations |
| [10](./10-hypersnap/) | **Hypersnap** | ⚠️ Incomplete — needs manual review |

---

## Music, Curation & Artist Revenue

The core of ZAO — how music works in the platform, how artists earn, and how curation creates value.

| # | Topic | Summary |
|---|-------|---------|
| [03](./03-music-integration/) | **Music Integration** | Audius, Sound.xyz, Spotify, SoundCloud, YouTube APIs + unified Track schema + audio player architecture |
| [04](./04-respect-tokens/) | **Respect Tokens** | Soulbound reputation: curation mining, tiers (newcomer→legend), 2% weekly decay, EAS attestation |
| [29](./29-artist-revenue-ip-rights/) | **Artist Revenue & IP Rights** | Streaming economics ($0.003/stream), music NFTs, 0xSplits, sync licensing ($650M market), fan funding |
| [37](./37-bridges-competitors-monetization/) | **Competitors & Monetization** | Sound.xyz dead, Catalog dead, Coop Records model, Hypersub pricing, revenue projections |
| [43](./43-webrtc-audio-rooms-streaming/) | **Live Audio Rooms & Streaming** | LiveKit (SFU), synchronized listening parties, Livepeer streaming, Huddle01 (web3-native) |
| [80](./80-jitsi-meet-live-rooms/) | **Jitsi Meet Live Rooms** | Embeddable Jitsi rooms for fractal calls + community meetings, zero-install, self-hostable |
| [88](./82-music-social-platform-redesign/) | **Music-First Social Platform Redesign** | Redesign ZAO OS from "chat client with music" into THE social platform for music communities |
| [100](./100-synchronized-listening-rooms/) | **Synchronized Listening Rooms (v1)** | Listening parties via Supabase Broadcast + Presence, DJ mode, chat overlay, Jitsi voice, $0 infra |
| [105](./105-music-player-ui-showcase/) | **Music Player UI Patterns** | Best practices for music display: waveform visualization, embeds, radio UX, discovery feeds |
| [107](./107-music-page-layout-design/) | **Music Page Layout & Design** | Standalone /music page: vertical scroll, sticky tabs, queue drag-and-drop |
| [109](./109-synchronized-listening-rooms/) | **Synchronized Listening Rooms (v2)** | Listening parties and DJ mode via Supabase Realtime Broadcast + Presence, no new infra needed |
| [110](./110-music-discovery-feeds/) | **Music Discovery Feeds** | Discovery feed design inspired by Spotify/SoundCloud with collaborative filtering for small communities |
| [111](./111-songlink-odesli-api/) | **Songlink/Odesli API** | Universal music link resolution across 20+ platforms, free, no auth, cache in Supabase |
| [112](./112-audius-api-deep-dive/) | **Audius API Deep Dive** | Full Audius API surface: REST v1 endpoints, SDK, embed player, deeper integration plan |
| [113](./113-top-10-music-fixes/) | **Top 10 Music Fixes** | Prioritized bug list: Audius CDN, artwork fallbacks, hardcoded trending, radio auto-advance |
| [119](./119-songjam-audio-spaces-embed/) | **SongJam Audio Spaces Embed** | Embed songjam.space/zabal iframe for live audio rooms, 100ms SDK, LiveAudioRoom component |
| [122](./122-songjam-screen-share-pr/) | **SongJam Screen Share PR** | Add screen sharing to SongJam /spaces via Stream Video SDK |
| [126](./126-music-player-gap-analysis/) | **Music Player Gap Analysis** | ZAO vs Spotify/Audius/SoundCloud/Sonata: 12 missing features, prioritized build order |
| [127](./127-mobile-player-optimization/) | **Mobile Player Optimization** | MediaSession, swipe gestures, expanded player, crossfade, gapless, Wake Lock, iOS PWA audio |
| [128](./128-music-player-complete-audit/) | **Music Player Complete Audit** | **CANONICAL** — 23 components, 23 endpoints, 9 platforms, 17 future features in 4 tiers |
| [130](./130-next-music-integrations/) | **Next Music Integrations (Tier 4)** | Spotify Web API, Audius SDK deep, Farcaster music embeds, AI recs, Zora NFTs, Last.fm |
| [138](./138-play-counting-stream-attribution/) | **Play Counting & Stream Attribution** | Do ZAO plays count? Spotify/SC/YT embeds = YES. Audius API = probably. Sound.xyz/Apple = NO |

---

## On-Chain Music Distribution & NFTs

How ZAO distributes music on-chain — minting, collecting, revenue splits, and DAO governance of releases.

| # | Topic | Summary |
|---|-------|---------|
| [108](./108-music-nft-landscape-2026/) | **Music NFT Landscape 2026** | Sound.xyz dead, Vault.fm pivot, surviving platforms, integration opportunities |
| [139](./139-trustware-sdk-deep-dive/) | **Trustware SDK** | Crypto payment middleware. Too early — monitor. Zora + 0xSplits preferred. |
| [140](./140-buildeross-nouns-protocol-ecosystem/) | **BuilderOSS Ecosystem** | All 10 repos mapped. ZOUNZ already deployed. builder-template-app + builder-farcaster key. |
| [141](./141-onchain-music-distribution-landscape/) | **On-Chain Distribution Landscape 2026** | Zora + 0xSplits + Unchained Music. Audius, OnChain Music, Catalog, Vault.fm. $4.8B market. |
| [142](./142-zora-protocol-sdk-music-nfts/) | **Zora Protocol SDK for Music NFTs** | create1155, Creator/Collector clients, audio metadata, Base chain. ~$1.05/release. |
| [143](./143-0xsplits-revenue-distribution/) | **0xSplits Revenue Distribution** | Automated splits (80/10/10), immutable contracts, Zora integration, $500M+ processed. |
| [144](./144-zounz-music-nft-unified-distribution/) | **ZOUNZ + Music NFTs Unified** | DAO-governed distribution: proposals fund releases, treasury earns from splits. |
| [145](./145-simple-nft-platform-design/) | **Simple NFT Platform Design** | 3-step mint UX for non-crypto artists. Server-side abstraction. Gas sponsorship. Mobile-first. |
| [146](./146-open-contracts-multi-artist-distribution/) | **Open Contracts Multi-Artist** | Forkable trio: Nouns Builder + Zora + 0xSplits. community.config.ts as fork point. |
| [147](./147-audius-zora-zounz-full-pipeline/) | **Full Distribution Pipeline** | Single upload → Audius (streaming) + Zora (collecting) + ZOUNZ (governance). |
| [148](./148-master-integration-plan-onchain-distribution/) | **Master Integration Plan** | 5-phase roadmap (6-8 weeks): SDK → Mint UI → Revenue → Governance → Full pipeline. |
| [149](./149-buildeross-deep-dive-everything/) | **BuilderOSS Deep Dive** | Every package: @buildeross/sdk, hooks, ipfs-service, auction-ui, proposal-ui, Goldsky subgraph. |
| [150](./150-arweave-permanent-music-storage/) | **Arweave Permanent Music Storage** | Replace IPFS with Arweave. $0.04/track, 200+ years. Cost analysis, upload code. |
| [151](./151-zounz-distribution-without-zora/) | **ZOUNZ Distribution Without Zora** | Arweave + thirdweb ERC-1155 + 0xSplits. No protocol fees. YOU own the contract. Supersedes 142/144. |
| [152](./152-arweave-ecosystem-deep-dive/) | **Arweave Ecosystem Deep Dive** | Full ecosystem: AO compute, ar.io CDN, ArDrive Turbo (NOT Irys — deprecated), GraphQL indexing. |
| [153](./153-bazar-arweave-atomic-assets-music/) | **BazAR & Atomic Assets for Music** | Atomic assets = data + contract + license in ONE tx. UCM orderbook, UDL licensing, $U token. |
| [155](./155-music-nft-end-to-end-implementation/) | **Music NFT End-to-End Implementation** | **THE BUILD PLAN** — Artist uploads MP3+art → mints atomic asset → collectors buy. Every screen, API route, DB table. ArDrive Turbo + Arweave Wallet Kit. 52 hrs / 5 weeks. |
| [156](./156-pods-media-podcast-tokenization/) | **Pods.media & Podcast Tokenization** | Pods is ACTIVE (900K mints, $1M rev, Base ERC-721 + Arweave). ZAO clone on pure Arweave atomic assets — same Doc 155 flow + podcast tags + RSS generation. ~5 days incremental. |

---

## Community, Social & Growth

How ZAO gates access, manages members, grows from 40 to 1000+, and moderates content.

| # | Topic | Summary |
|---|-------|---------|
| [12](./12-gating/) | **Gating Mechanisms** | Allowlist (MVP) → NFT → Hats → EAS progression for access control |
| [13](./13-chat-messaging/) | **Chat & Messaging** | Farcaster channels (public) + XMTP (private encrypted DMs + groups) |
| [74](./74-xmtp-v4-mls-encryption/) | **XMTP V3 Browser SDK & MLS** | V3 unified SDK, MLS encryption, mainnet fees (~$0.001/msg), history sync gap |
| [15](./15-mvp-spec/) | **MVP Specification** | Gated chat client scope, SIWF auth, allowlist, Discord-style UI, user flows |
| [20](./20-followers-following-feed/) | **Followers/Following Feed** | Sortable/filterable lists (no other Farcaster client has this), Neynar API patterns |
| [32](./32-onboarding-growth-moderation/) | **Onboarding, Growth & Moderation** | Privy embedded wallets, growth 40→1000 strategy, tiered moderation, gamification |
| [35](./35-notifications-complete-guide/) | **Notifications Complete Guide** | 3-layer hybrid: Mini App push + Supabase Realtime in-app + polling fallback |
| [47](./47-zao-community-ecosystem/) | **ZAO Community Ecosystem** | ZAO community ecosystem mapping |
| [48](./48-zao-ecosystem-deep-dive/) | **ZAO Ecosystem Deep Dive** | Deep dive into ecosystem components |
| [94](./94-moderation-onboarding-analytics/) | **Moderation, Onboarding & Analytics** | OpenAI free moderation API, OnboardJS + Driver.js tours, PostHog analytics |
| [106](./106-home-screen-dashboard-design/) | **Home Screen / Dashboard Design** | Dashboard replacing direct-to-chat, surfacing music, chat, governance, social |
| [107](./107-social-connections-x-integration/) | **Social Connections & X Integration** | Pull X handles from Neynar, X API free tier cross-posting, settings UI restructure |
| [110](./110-community-directory-crm/) | **Community Directory & CRM** | Replace Webflow CRM with native member directory: profiles, social links, on-chain stats |
| [118](./118-settings-page-redesign/) | **Settings Page Redesign** | Unify 3 overlapping settings sections into one logical layout |

---

## Identity, Governance & Tokens

On-chain identity, community roles, DAO structure, token economics, and legal compliance.

| # | Topic | Summary |
|---|-------|---------|
| [05](./05-zao-identity/) | **ZAO Identity (ZIDs)** | FID wrapper + music profile + Respect score + community roles + linked wallets |
| [07](./07-hats-protocol/) | **Hats Protocol** | On-chain role trees (curator/artist/mod) as non-transferable ERC-1155, eligibility modules |
| [23](./23-austin-griffith-eth-skills/) | **Austin Griffith & ETH Skills** | Scaffold-ETH 2, BuidlGuidl, SpeedRunEthereum, ERC-8004 trustless agents |
| [31](./31-governance-dao-tokenomics/) | **Governance, DAO & Token Economics** | Wyoming DUNA ($300), Safe multisig, ERC-1155, Coordinape, Howey Test |
| [06](./06-quilibrium/) | **Quilibrium** | Privacy-preserving storage, Proof of Meaningful Work, design-compatible |
| [55](./55-hats-anchor-app-and-tooling/) | **Hats Anchor App & Tooling** | DAO tooling landscape, Hats Anchor App, OpenFang update |
| [56](./56-ordao-respect-system/) | **ORDAO & Respect Game** | OREC consent-based governance, Fibonacci scoring (1-13), Respect1155 tokens |
| [58](./58-respect-deep-dive/) | **Respect Deep Dive** | On-chain token data, scoring math, orclient SDK integration |
| [59](./59-hats-tree-integration/) | **Hats Tree Integration** | Hats Protocol tree structure for ZAO roles |
| [75](./75-hats-protocol-v2-updates/) | **Hats Protocol V2 Updates** | New eligibility modules, HSG v2, subgraph SDK v1.0.0, MCP server for AI |
| [78](./78-nouns-builder-integration/) | **Nouns Builder Integration** | Daily NFT auctions, 5-contract DAO suite, builder-template-app (MIT/Next.js) |
| [102](./102-fractals-frapps-ordao-page/) | **Fractals Page + frapps + ORDAO** | frapps.xyz tech stack, ORDAO orclient SDK, Fibonacci scoring, /fractals page design |
| [103](./103-fractal-governance-ecosystem/) | **Fractal Governance Ecosystem** | Eden Fractal (Base, active), Optimism Fractal (paused), Fractally (dormant) |
| [104](./104-fractal-communities-directory/) | **Fractal Communities Directory** | 25+ communities mapped, ZAO as only music fractal, collaboration opportunities |
| [105](./105-fractal-key-people/) | **Fractal Key People** | Dan SingJoy, Tadas Vaitiekunas (ORDAO/OREC creator), outreach strategy |
| [106](./106-dan-singjoy-eden-fractal-deep-dive/) | **Dan SingJoy + Eden Fractal** | Epoch 2 on Base, Season 12, Cignals competition app, Fractal DJ game |
| [108](./108-superchain-ordao-crosschain-fractal/) | **Superchain ORDAO + Cross-Chain** | Hub-and-spoke, ZAO-Eden cross-chain Respect, Hats+Respect auto-gating |
| [109](./109-optimystics-tooling-ecosystem/) | **Optimystics Tooling Ecosystem** | orclient SDK, ornode API (12 endpoints), OREC ABI, Cignals alpha, FRAPPS |
| [111](./111-proposal-ui-best-practices/) | **Proposal UI Best Practices** | Governance UI redesign: expandable cards, inline voting, comments, filters |
| [113](./113-zao-fractal-bot-process/) | **ZAO Fractal Bot + Process** | Discord bot (Python, 52 commands), fractal flow, 2x Fibonacci, 90 weeks |
| [114](./114-zao-fractal-live-infrastructure/) | **ZAO Fractal Live Infrastructure** | OREC 175 txns, webhook data flow, bot history, ZAO OS integration architecture |
| [115](./115-zao-data-reconciliation/) | **ZAO Respect Data Reconciliation** | OG era (1-73.2) + ORDAO era (74-90+), 173 members + 42 on-chain, import plan |
| [116](./116-discord-integration-research/) | **Discord API Integration** | @discordjs/rest, OAuth2 account linking, webhook from bot, supabase-py sync |
| [131](./131-onchain-proposals-governance/) | **On-Chain Governance** | ZOUNZ Nouns Builder Governor (Base), Snapshot gasless voting, hybrid 3-tab architecture |
| [132](./132-snapshot-weekly-polls/) | **Snapshot Weekly Polls** | One-click polls via snapshot.js SDK, approval voting, GraphQL, multi-project templates |
| [133](./133-governance-system-audit/) | **Governance System Complete Audit** | **CANONICAL** — 3-tier governance, 5 API routes, 6 components, Respect-weighted, auto-publish |
| [133](./133-reputation-scoring-systems/) | **Reputation Scoring Systems** | Composite ZAO Score from Neynar Score, EAS attestations, OpenRank, Human Passport |
| [134](./134-external-reputation-signals-comprehensive/) | **External Reputation Signals** | Catalog of every external reputation signal from wallet, FID, or X handle |
| [135](./135-exhaustive-profile-enrichment-signals/) | **Exhaustive Profile Enrichment** | Every possible profile data point; Airstack as single API replacing 5-6 individual calls |
| [127](./127-ens-integration-deep-dive/) | **ENS Integration Deep Dive** | Fix ENS resolution, text records, evaluate zao.eth subdomains via NameStone |

---

## AI Agent & Intelligence

The ZAO AI agent — framework, memory system, and how it manages the community.

| # | Topic | Summary |
|---|-------|---------|
| [24](./24-zao-ai-agent/) | **ZAO AI Agent Plan** | ElizaOS + Claude + Hindsight, 4-phase plan (support → music discovery → moderation → autonomous) |
| [08](./08-ai-memory/) | **AI Memory Architecture** | Implicit + explicit memory patterns, pgvector, taste profiles, consolidation pipeline |
| [26](./26-hindsight-agent-memory/) | **Hindsight Memory System** | SOTA agent memory (91.4% LongMemEval), retain/recall/reflect, MCP support |
| [90](./90-ai-run-community-agent-os/) | **AI-Run Community: Agent OS** | Autonomous community agents (daily digests, onboarding, governance) via Paperclip + ElizaOS |

---

## Cross-Platform Publishing

How ZAO distributes content across every social platform from one compose bar.

| # | Topic | Summary |
|---|-------|---------|
| [28](./28-cross-platform-publishing/) | **Cross-Platform Publishing** | 11 platforms mapped (Lens, Bluesky, Nostr, X, Mastodon, Threads), fan-out architecture |
| [36](./36-lens-protocol-deep-dive/) | **Lens Protocol Deep Dive** | V3 on Lens Chain (ZKSync), collect/monetize model, Bonsai token |
| [37](./37-bridges-competitors-monetization/) | **Discord & Telegram Bridges** | discord.js v14 bridge, Telegram Bot API, no production bridge exists yet |
| [77](./77-bluesky-cross-posting-integration/) | **Bluesky Cross-Posting** | @atproto/api SDK, App Password + OAuth, 300-char posts, custom feeds, ZAO labeler |
| [96](./96-mastodon-threads-cross-posting/) | **Mastodon + Threads Cross-Posting** | Mastodon REST API + masto.js, music instances; Threads 2-step publish, Meta OAuth |
| [96](./96-cross-post-api-deep-dive/) | **Cross-Post API Deep Dive** | Platform-by-platform guide with SDKs, costs, rate limits, and code examples |
| [97](./97-nostr-cross-posting-integration/) | **Nostr Cross-Posting** | Nostr as cross-post target with Wavlake music ecosystem and Lightning micropayments |
| [97](./97-reddit-cross-posting-integration/) | **Reddit Cross-Posting** | Reddit OAuth, snoowrap SDK, music subreddits |
| [117](./117-lens-v3-cross-posting/) | **Lens V3 Cross-Posting** | Fix broken Lens integration with correct V3 API, SDK, and auth flow |
| [120](./120-lens-v3-posting-fix/) | **Lens V3 Posting Fix** | Upload to Grove storage first, then post with correct URI |
| [121](./121-lens-v3-auth-verdict/) | **Lens V3 Auth Verdict** | BLOCKER: Lens V3 requires wallet signature, no server-only posting path |
| [123](./123-dfos-dark-forest-protocol/) | **DFOS (Dark Forest OS)** | Private-first creative group infrastructure by Metalabel. No blockchain, Ed25519 chains. |

---

## Technical Infrastructure

The stack that runs ZAO OS — Next.js, Supabase, storage, mobile, real-time, and performance.

| # | Topic | Summary |
|---|-------|---------|
| [41](./41-nextjs16-react19-deep-dive/) | **Next.js 16 + React 19** | Turbopack, PPR, React Compiler, useOptimistic, "use cache", streaming SSR, Tailwind v4 |
| [42](./42-supabase-advanced-patterns/) | **Supabase Advanced** | Schema design, RLS, Realtime, Edge Functions, pgvector, pg_cron, migrations |
| [93](./93-supabase-scaling-optimization/) | **Supabase Scaling & Optimization** | Realtime primitives, pg_cron (7 jobs), pgvector, cost projections 100-1,000 members |
| [93](./93-missing-infrastructure-gaps/) | **Missing Infrastructure Gaps** | Testing strategy, CI/CD, error monitoring, design system, PWA support gaps |
| [98](./98-supabase-database-optimizations/) | **Supabase Database Optimizations** | Realtime notifications, materialized views, DB functions, RLS audit, Vault, triggers |
| [33](./33-infrastructure-mobile-storage/) | **Storage, Mobile & Privacy** | R2/IPFS/Arweave costs, PWA→Capacitor→React Native, Semaphore ZK proofs |
| [14](./14-project-structure/) | **Project Structure** | Single Next.js app, route groups, feature folders, GitHub Projects kanban |
| [16](./16-ui-reference/) | **UI Reference** | Discord-style dark theme, navy #0a1628 + gold #f5a623 |

---

## APIs & External Services

Every API mapped, prioritized, and organized by ZAO OS feature.

| # | Topic | Summary |
|---|-------|---------|
| [09](./09-public-apis/) | **Public APIs Landscape** | Tier 1/2/3 APIs for music, web3, AI, media, social, notifications |
| [25](./25-public-apis-index/) | **Public APIs Index (100+)** | Full index from github.com/public-apis — mapped by ZAO feature and priority |
| [92](./92-public-apis-2026-update/) | **Public APIs 2026 Update** | Re-evaluate 1,436 APIs against 64 built routes; Songlink and MusicBrainz top picks |
| [125](./125-coinflow-fiat-checkout/) | **Coinflow Fiat Checkout** | Fiat-to-crypto (cards, ACH, Apple Pay) → USDC on Base. React SDK, 24+ webhook events. |
| [128](./128-free-api-keys-alchemy-enhancements/) | **Free API Keys & Alchemy Enhancements** | Free APIs (Alchemy NFT, Zerion, The Graph) to enhance existing features |
| [129](./129-alchemy-apis-deep-integration/) | **Alchemy APIs Deep Integration** | Maximize free tier: webhooks for ZOR sync, transfer history, budget analysis |
| [136](./136-api-status-verification-march-2026/) | **API Status Verification (March 2026)** | Which APIs are active vs deprecated (Sound.xyz dead, Neynar acquired Farcaster) |

---

## WaveWarZ Integration

Solana prediction market for music battles — artist discovery pipeline, profile enrichment, and governance synergy.

| # | Topic | Summary |
|---|-------|---------|
| [95](./95-solana-wavewarz-multi-wallet-settings/) | **Solana + WaveWarZ Initial Research** | Solana wallet adapter, WaveWarZ partnership, multi-wallet settings redesign |
| [96](./96-wavewarz-deep-dive-integration/) | **WaveWarZ Deep Dive** | Battle mechanics (parimutuel pools), economics (98.5% in ecosystem), platform stats |
| [97](./97-wavewarz-integration-blueprints/) | **Artist Discovery Pipeline** | Sync 43 WaveWarZ artists into Supabase, spotlight auto-casts, profile enrichment |
| [99](./99-prediction-market-music-battles/) | **Prediction Market Schema** | Parimutuel pool mechanics, Supabase schema, settlement math, UI wireframes |
| [100](./100-solana-pda-reading-nextjs/) | **Solana PDA Reading in Next.js** | Battle Vault PDA reads via web3.js, buffer-layout, Helius RPC |
| [101](./101-wavewarz-zao-whitepaper/) | **WaveWarZ × ZAO OS Whitepaper** | **CANONICAL** — Full integration: 43 wallets, 647 battles, $38K volume, 10-day roadmap |

---

## Security, Auditing & Code Quality

How to keep the codebase secure, clean, and maintainable.

| # | Topic | Summary |
|---|-------|---------|
| [18](./18-security-audit/) | **Security Audit Checklist** | Pre-build security: env vars, sessions, Zod validation, rate limits, CSRF, CSP |
| [40](./40-codebase-audit-guide/) | **Codebase Audit Guide** | Step-by-step methodology + March 2026 audit results |
| [38](./38-ai-code-audit-cleanup/) | **AI Code Audit & Cleanup** | AI code problems (1.75x more bugs), cleanup agents, CI pipeline, TypeScript strict |
| [57](./57-codebase-security-audit-march-2026/) | **Security Audit (March 2026)** | Full codebase security audit results and fixes |
| [66](./66-backend-testing-strategy/) | **Backend Testing Strategy** | Vitest + NTARH + MSW stack, 47-route audit, backend testbench checklist |
| [137](./137-skills-audit-security-practices/) | **Skills Audit & Security Practices** | Skills inventory, prompt injection defense stack, OWASP LLM Top 10, red-teaming tools |

---

## Development Workflows & Agent Tooling

How to use AI agents, skills, and autonomous loops to build and maintain ZAO OS.

| # | Topic | Summary |
|---|-------|---------|
| [44](./44-agentic-development-workflows/) | **Agentic Development Workflows** | Claude Code as persistent dev partner, hooks, GitHub Actions agents, CI pipeline |
| [45](./45-research-organization-patterns/) | **Research Organization Patterns** | Research library organization and maintenance |
| [46](./46-openfang-agent-os/) | **OpenFang Agent OS** | Rust-based agent OS — reference architecture (not a fit for ZAO) |
| [54](./54-superpowers-agentic-skills/) | **Superpowers Agentic Skills** | Skill system for Claude Code — brainstorming, TDD, debugging, planning, parallel agents |
| [62](./62-autoresearch-skill-improvement/) | **Autoresearch: Skill Improvement** | Karpathy's autoresearch loop for skills — binary checklist scoring, atomic changes |
| [63](./63-autoresearch-deep-dive-zao-applications/) | **Autoresearch Deep Dive** | Eval loop mechanics, 7 ZAO OS use cases (skills, lint, security, governance, API routes) |
| [64](./64-incented-zabal-campaigns/) | **Incented + ZABAL Campaigns** | Incented coordination protocol (4-stage staking), ZABAL org campaigns |
| [65](./65-zabal-partner-ecosystem/) | **ZABAL Partner Ecosystem** | MAGNETIQ, SongJam, Empire Builder, Clanker — integration plans |
| [67](./67-paperclip-ai-agent-company/) | **Paperclip AI: ZAO Agent Company** | Open-source agent orchestrator — org chart, budgets, heartbeats. 5 ZAO agents. |
| [68](./68-alibaba-page-agent/) | **Alibaba Page Agent** | In-page AI copilot via DOM dehydration. Admin copilot potential. Phase 3. |
| [69](./69-claude-code-tips-best-practices/) | **Claude Code Tips & Best Practices** | 45 tips audited against ZAO OS. ZAO leads on research/skills. |
| [70](./70-subagents-vs-agent-teams/) | **Sub-agents vs Agent Teams** | Two multi-agent paradigms + Claude Architect patterns + Cowork starter pack |
| [71](./71-paperclip-rate-limits-multi-agent/) | **Paperclip Rate Limits** | Multi-agent API key management, Anthropic tier limits, thundering herd fix |
| [72](./72-paperclip-functionality-deep-dive/) | **Paperclip Functionality Deep Dive** | Full agent lifecycle, 9-step heartbeat, adapter config, CLI reference |
| [76](./76-git-branching-ai-agents/) | **Git Branching for AI Agents** | Trunk-based dev with Paperclip, short-lived branches, solo founder + AI |
| [81](./81-paperclip-multi-company-agents/) | **Paperclip Multi-Company** | Multi-company isolation, 5-level task hierarchy, agent delegation chains |
| [82](./82-paperclip-clipmart-plugins/) | **Paperclip ClipMart + Plugins** | Template marketplace, export/import, plugin architecture |
| [83](./83-elizaos-2026-update/) | **ElizaOS March 2026 Update** | v1.7.2 stable, v2 alpha, Farcaster/XMTP plugins, Supabase adapter |
| [84](./84-farcaster-ai-agents-landscape/) | **Farcaster AI Agents Landscape** | Full landscape of AI agents/bots on Farcaster as of March 2026 |
| [85](./85-farcaster-agent-technical-setup/) | **Farcaster AI Agent Technical Setup** | Step-by-step Neynar agent setup, FID registration, managed signers |
| [89](./89-paperclip-gstack-autoresearch-stack/) | **Paperclip + gstack + Autoresearch Stack** | AI-agent workflow tools: gstack skills, Conductor parallel sessions, autoresearch loops |
| [91](./91-top-claude-skills-mcp-repos/) | **Top Claude Skills & MCP Repos** | Evaluation of viral "Top 50 Claude Skills" list for ZAO OS (Context7, Tavily, gstack) |
| [154](./154-skills-commands-master-reference/) | **Skills & Commands Master Reference** | **CANONICAL** — All 48 commands/skills, when to use each, session flows, how to ask for features |

---

## Ethereum & Alignment

Ethereum philosophy, EF alignment, and opportunities for ZAO.

| # | Topic | Summary |
|---|-------|---------|
| [60](./60-vitalik-ethereum-philosophy/) | **Vitalik & Ethereum Philosophy** | Vitalik philosophy + EF mandate alignment analysis |
| [61](./61-ethereum-alignment-opportunities/) | **Ethereum Alignment Opportunities** | Ethereum alignment opportunities for ZAO |

---

## Documentation & Presentation

How to document, display, and showcase the project on GitHub.

| # | Topic | Summary |
|---|-------|---------|
| [39](./39-github-documentation-presentation/) | **GitHub Documentation** | README best practices, screenshots, Mermaid diagrams, docs sites, ADRs, badges |
| [51](./51-zao-whitepaper-2026/) | **ZAO Whitepaper 2026** | Whitepaper Draft 4.5 — vision, tokenomics, governance |
| [52](./52-whitepaper-presentation-critique/) | **Whitepaper Presentation Critique** | Whitepaper critique and feedback |
| [53](./53-whitepaper-user-testing/) | **Whitepaper User Testing** | User testing results for the whitepaper |

---

## Reference & Internal

Project references, existing code inventory, and strategic overviews.

| # | Topic | Summary |
|---|-------|---------|
| [11](./11-reference-repos/) | **Reference Repos** | Sonata (MIT), Herocast (AGPL), Nook (MIT), Opencast (MIT), Litecast (MIT) |
| [50](./50-the-zao-complete-guide/) | **The ZAO Complete Guide** | Canonical project reference — the definitive ZAO ecosystem guide |
| [30](./30-bettercallzaal-github/) | **bettercallzaal GitHub Inventory** | 65 repos mapped — 10 directly integratable |
| [27](./27-comprehensive-overview/) | **Comprehensive Overview** | Master index, gap analysis, vision map, flywheel, 9-layer roadmap |
| [49](./49-wallet-connect/) | **Wallet Connect** | Wallet connection patterns |
| [79](./79-songjam-music-player-research/) | **SongJam Music Player Research** | 2026-music-player is Electron torrent streamer (not useful). Borrow: 100ms, leaderboard treemap |

---

## Quick Reference by Role

### If you're building features:
Start with [41 Next.js 16](./41-nextjs16-react19-deep-dive/) + [42 Supabase](./42-supabase-advanced-patterns/) + [15 MVP Spec](./15-mvp-spec/)

### If you're adding music:
Start with [03 Music Integration](./03-music-integration/) + [128 Player Audit](./128-music-player-complete-audit/) + [130 Next Integrations](./130-next-music-integrations/)

### If you're distributing music on-chain:
Start with [151 Distribution Without Zora](./151-zounz-distribution-without-zora/) + [152 Arweave Deep Dive](./152-arweave-ecosystem-deep-dive/) + [148 Master Plan](./148-master-integration-plan-onchain-distribution/)

### If you're working on the AI agent:
Start with [24 Agent Plan](./24-zao-ai-agent/) + [26 Hindsight](./26-hindsight-agent-memory/) + [90 Agent OS](./90-ai-run-community-agent-os/)

### If you're designing governance:
Start with [133 Governance Audit](./133-governance-system-audit/) + [56 ORDAO](./56-ordao-respect-system/) + [131 On-Chain](./131-onchain-proposals-governance/)

### If you're growing the community:
Start with [32 Onboarding/Growth](./32-onboarding-growth-moderation/) + [35 Notifications](./35-notifications-complete-guide/) + [110 Community Directory](./110-community-directory-crm/)

### If you're cross-posting:
Start with [28 Cross-Platform](./28-cross-platform-publishing/) + [77 Bluesky](./77-bluesky-cross-posting-integration/) + [121 Lens Verdict](./121-lens-v3-auth-verdict/)

### If you're auditing code:
Start with [57 Security Audit](./57-codebase-security-audit-march-2026/) + [137 Skills Security](./137-skills-audit-security-practices/) + [66 Testing Strategy](./66-backend-testing-strategy/)

### If you're using Claude Code skills:
Start with [154 Skills Master Reference](./154-skills-commands-master-reference/) + [69 Claude Code Tips](./69-claude-code-tips-best-practices/) + [54 Superpowers](./54-superpowers-agentic-skills/)

---

## Research Stats

- **Total documents:** 155+
- **Total coverage:** ~500,000+ words
- **Topics:** Protocol, identity, music, AI agents, governance, revenue, cross-platform, mobile, storage, privacy, notifications, competitors, onboarding, moderation, code quality, infrastructure, live audio, documentation, fractals, WaveWarZ, music player, on-chain distribution, Arweave, NFTs, reputation, skills, security
- **Time span:** January — March 2026

---

## What's Built vs What's Next

### Built (Shipping Today)

| Feature | Status | Key Files |
|---------|--------|-----------|
| **Farcaster auth (SIWF + wallet)** | ✅ Complete | `src/lib/auth/session.ts` |
| **Gated community (allowlist + NFT)** | ✅ Complete | `src/lib/gates/` |
| **Public chat (Farcaster casts)** | ✅ Complete | `src/components/chat/` |
| **Private messaging (XMTP MLS)** | ✅ Complete | `src/contexts/XMTPContext.tsx` |
| **Music player (9 platforms)** | ✅ Complete | `src/providers/audio/`, 30+ components |
| **Crossfade engine (dual audio)** | ✅ Complete | `src/providers/audio/HTMLAudioProvider.tsx` |
| **Binaural beats + ambient mixer** | ✅ Complete | `src/components/music/BinauralBeats.tsx` |
| **MediaSession (lock screen controls)** | ✅ Complete | `src/providers/audio/PlayerProvider.tsx` |
| **Song submissions + voting** | ✅ Complete | `src/app/api/music/submissions/` |
| **Respect-weighted trending** | ✅ Complete | `src/app/api/music/trending-weighted/` |
| **Now Playing presence** | ✅ Complete | `src/hooks/useNowPlaying.ts` |
| **Playlists** | ✅ Complete | `src/app/api/music/playlists/` |
| **Track of the day** | ✅ Complete | `src/app/api/music/track-of-day/` |
| **Lyrics lookup** | ✅ Complete | `src/app/api/music/lyrics/` |
| **Songlink cross-platform links** | ✅ Complete | `src/lib/music/songlink.ts` |
| **Internal play counting** | ✅ Complete | `src/app/api/music/library/play/` |
| **Farcaster cross-posting** | ✅ Complete | `src/lib/publish/farcaster.ts` |
| **X (Twitter) cross-posting** | ✅ Complete | `src/lib/publish/x.ts` |
| **Hive/InLeo cross-posting** | ✅ Complete | `src/app/api/publish/hive/` |
| **Community proposals (Supabase)** | ✅ Complete | `src/app/api/proposals/` |
| **Snapshot polls** | ✅ Complete | `src/components/governance/CreateWeeklyPoll.tsx` |
| **ZOUNZ auction display** | ✅ Complete | `src/components/zounz/ZounzAuction.tsx` |
| **ZOUNZ governance read** | ✅ Complete | `src/components/zounz/ZounzProposals.tsx` |
| **Hats Protocol roles** | ✅ Complete | `src/components/hats/HatManager.tsx` |
| **Respect scoring (OG + ZOR)** | ✅ Complete | `src/app/api/respect/` |
| **Fractal webhook receiver** | ✅ Complete | `src/app/api/fractals/webhook/` |
| **Music NFT wallet detection** | ✅ Complete | `src/app/api/music/wallet/` |
| **AI content moderation** | ✅ Complete | `src/lib/moderation/moderate.ts` |
| **Rate limiting middleware** | ✅ Complete | `src/middleware.ts` |
| **Notifications (in-app)** | ✅ Complete | `src/app/api/notifications/` |
| **Admin panel** | ✅ Complete | `src/app/(auth)/admin/` |
| **Jitsi live rooms** | ✅ Complete | `src/app/(auth)/calls/` |
| **WaveWarZ API sync** | ✅ Complete | `src/app/api/wavewarz/` |
| **Solana wallet in settings** | ✅ Complete | Wallet adapter config |
| **Bluesky OAuth storage** | ✅ Partial | Auth works, no publish route |

### Not Yet Built (Researched, Ready to Go)

| Feature | Priority | Effort | Research Doc |
|---------|----------|--------|-------------|
| **Arweave music upload** | 🔴 High | 12 hrs | [155](./155-music-nft-end-to-end-implementation/) |
| **Music NFT mint UI** | 🔴 High | 14 hrs | [155](./155-music-nft-end-to-end-implementation/) |
| **Collect/buy button** | 🔴 High | 10 hrs | [155](./155-music-nft-end-to-end-implementation/) |
| **BazAR marketplace integration** | 🔴 High | 8 hrs | [153](./153-bazar-arweave-atomic-assets-music/) |
| **Last.fm scrobbling** | 🟠 Medium | 3 hrs | [138](./138-play-counting-stream-attribution/) |
| **ListenBrainz scrobbling** | 🟠 Medium | 2 hrs | [138](./138-play-counting-stream-attribution/) |
| **Bluesky publish route** | 🟠 Medium | 2 hrs | [77](./77-bluesky-cross-posting-integration/) |
| **In-app ZOUNZ voting** | 🟠 Medium | 8 hrs | [149](./149-buildeross-deep-dive-everything/) |
| **In-app proposal creation** | 🟠 Medium | 6 hrs | [149](./149-buildeross-deep-dive-everything/) |
| **@builderbot notifications** | 🟠 Medium | 2 hrs | [149](./149-buildeross-deep-dive-everything/) |
| **0xSplits revenue splits** | 🟠 Medium | 4 hrs | [143](./143-0xsplits-revenue-distribution/) |
| **WaveWarZ battle UI** | 🟠 Medium | 8 hrs | [99](./99-prediction-market-music-battles/) |
| **Synchronized listening rooms** | 🟡 Future | 12 hrs | [100](./100-synchronized-listening-rooms/) |
| **LiveKit audio rooms** | 🟡 Future | 16 hrs | [43](./43-webrtc-audio-rooms-streaming/) |
| **ElizaOS community agent** | 🟡 Future | 20 hrs | [83](./83-elizaos-2026-update/) |
| **AI taste recommendations** | 🟡 Future | 20 hrs | [08](./08-ai-memory/), [110](./110-music-discovery-feeds/) |
| **Apple Music (MusicKit JS)** | 🟡 Future | 8 hrs | [138](./138-play-counting-stream-attribution/) |
| **Mastodon cross-posting** | 🟡 Future | 4 hrs | [96](./96-additional-cross-posting-platforms/) |
| **Nostr cross-posting** | 🟡 Future | 6 hrs | [97](./97-nostr-reddit-cross-posting/) |
| **Cross-chain fractal governance** | 🟡 Future | 20 hrs | [108](./108-superchain-ordao-crosschain-fractal/) |
| **Mobile player optimization** | 🟡 Future | 12 hrs | [127](./127-mobile-player-optimization/) |
| **Native community directory** | 🟡 Future | 10 hrs | [110](./110-community-directory-crm/) |
| **External reputation signals** | 🟡 Future | 8 hrs | [134](./134-external-reputation-signals-comprehensive/) |
| **ArNS permanent domain** | 🟡 Future | 2 hrs | [152](./152-arweave-ecosystem-deep-dive/) |

### Scoreboard

| Category | Built | To Do | Completion |
|----------|-------|-------|------------|
| Auth & Gating | 3/3 | 0 | 100% |
| Chat & Messaging | 2/2 | 0 | 100% |
| Music Player | 10/10 | 0 | 100% |
| Music Library & Curation | 7/7 | 0 | 100% |
| Music Scrobbling & Discovery | 0/5 | 5 | 0% |
| On-Chain Music NFTs | 1/8 | 7 | 12% |
| Cross-Platform Publishing | 3/6 | 3 | 50% |
| Governance | 4/7 | 3 | 57% |
| AI Agent & Intelligence | 1/4 | 3 | 25% |
| Live Audio | 1/3 | 2 | 33% |
| Profile & Reputation | 2/4 | 2 | 50% |
| Mobile & Infrastructure | 3/5 | 2 | 60% |
| **Overall** | **37/64** | **27** | **58%** |

---

## Future Vision: Researched but Not Yet Built

Everything below has been deeply researched (with doc references) but is not yet implemented in the codebase. This is the roadmap of what ZAO OS can become.

### On-Chain Music Distribution (Arweave + BazAR)

The big one. ZAO artists should be able to upload a track + cover art and mint it as a permanently stored, purchasable music NFT — no crypto knowledge required.

- **Arweave permanent storage** — Upload MP3/MP4 + cover art via ArDrive Turbo, stored forever for ~$0.05/track (Docs: [150](./150-arweave-permanent-music-storage/), [152](./152-arweave-ecosystem-deep-dive/))
- **Atomic assets on BazAR** — Data + smart contract + license in ONE Arweave transaction. Tradeable on the UCM orderbook (Doc: [153](./153-bazar-arweave-atomic-assets-music/))
- **UDL licensing** — Artists set royalties, derivative rights, commercial terms on-chain. Enforced automatically (Doc: [153](./153-bazar-arweave-atomic-assets-music/))
- **End-to-end mint + buy flow** — 3-screen artist wizard, 1-click collector "Collect" button, ArConnect wallet integration (Doc: [155](./155-music-nft-end-to-end-implementation/))
- **0xSplits revenue distribution** — Automated 80% artist / 10% treasury / 10% curator splits on Base (Doc: [143](./143-0xsplits-revenue-distribution/))
- **ZOUNZ DAO-governed releases** — Treasury proposals fund artist releases, revenue flows back via splits (Docs: [144](./144-zounz-music-nft-unified-distribution/), [149](./149-buildeross-deep-dive-everything/))
- **ar.io Wayfinder CDN** — Decentralized gateway for streaming Arweave audio, no single point of failure (Doc: [152](./152-arweave-ecosystem-deep-dive/))
- **ArNS permanent domain** — `zao.ar.io` music portal that works even if the main site goes down (Doc: [152](./152-arweave-ecosystem-deep-dive/))

### Music Discovery & Scrobbling

- **Last.fm scrobbling** — Universal play reporting after 30s of playback. ~3 hours to implement (Doc: [138](./138-play-counting-stream-attribution/))
- **ListenBrainz** — Open-source scrobbling alternative, no API approval needed. ~2 hours (Doc: [138](./138-play-counting-stream-attribution/))
- **Apple Music via MusicKit JS** — In-app playback that pays artists ~$0.01/stream, highest royalty rate (Doc: [138](./138-play-counting-stream-attribution/))
- **AI taste graph + recommendations** — pgvector embeddings for collaborative filtering on a 100-member community (Docs: [08](./08-ai-memory/), [110](./110-music-discovery-feeds/))
- **Play completion tracking** — play_start, play_complete, skip events for better curation data (Doc: [110](./110-music-discovery-feeds/))

### AI Agent & Autonomy

- **ElizaOS community agent** — Farcaster bot for daily digests, onboarding help, governance discussion, music recommendations (Docs: [24](./24-zao-ai-agent/), [83](./83-elizaos-2026-update/))
- **pgvector memory system** — Vector embeddings for AI recall/reflect, taste profiles, personalized discovery (Doc: [08](./08-ai-memory/))
- **Hindsight agent memory** — 91.4% LongMemEval score, per-user memory banks, MCP support (Doc: [26](./26-hindsight-agent-memory/))

### Live Audio & Social Listening

- **Synchronized listening rooms** — Supabase Broadcast + Presence for DJ mode, chat overlay, $0 infrastructure cost (Doc: [100](./100-synchronized-listening-rooms/))
- **LiveKit audio rooms** — SFU-based voice rooms for fractal calls + listening parties, free tier covers 100 members (Doc: [43](./43-webrtc-audio-rooms-streaming/))

### Cross-Platform Publishing

- **Bluesky publishing** — OAuth is built, publish route is not. @atproto/api SDK ready (Doc: [77](./77-bluesky-cross-posting-integration/))
- **Mastodon / Threads** — Major platform gaps. masto.js SDK + Meta OAuth researched (Doc: [96](./96-additional-cross-posting-platforms/))
- **Nostr** — Decentralized music community overlap. Wavlake integration opportunity (Doc: [97](./97-nostr-reddit-cross-posting/))

### Governance Upgrades

- **In-app proposal creation + voting** — Currently links out to nouns.build. BuilderOSS has `create-proposal-ui` + `proposal-ui` packages (Doc: [149](./149-buildeross-deep-dive-everything/))
- **@builderbot Farcaster notifications** — Auto-notify ZOUNZ members of proposal activity via Farcaster DCs (Doc: [149](./149-buildeross-deep-dive-everything/))
- **Goldsky subgraph** — Query ZOUNZ data via GraphQL instead of slow RPC calls. Already deployed on Base (Doc: [149](./149-buildeross-deep-dive-everything/))
- **Cross-chain fractal governance** — Hub-and-spoke model with Hats + Respect across Optimism + Base (Doc: [108](./108-superchain-ordao-crosschain-fractal/))

### Profile & Reputation

- **External reputation signals** — OpenRank, Human Passport, Gitcoin Passport, DegenScore (Doc: [134](./134-external-reputation-signals-comprehensive/))
- **Airstack single API** — Replace 5-6 API calls with one unified social+wallet data source (Doc: [135](./135-exhaustive-profile-enrichment-signals/))

### WaveWarZ Integration

- **Battle visualization UI** — Artist spotlight, battle pool mechanics, prediction market betting (Docs: [96](./96-additional-cross-posting-platforms/), [99](./99-prediction-market-music-battles/))
- **API sync is built** — `/api/wavewarz/sync` exists, just needs frontend

### Mobile & Infrastructure

- **Mobile player optimization** — MediaSession completion, swipe gestures, expanded player, Wake Lock, iOS PWA audio (Doc: [127](./127-mobile-player-optimization/))
- **Music player gap analysis** — 12 features missing vs Spotify/Audius: favorites, history, queue persistence, presence (Doc: [126](./126-music-player-gap-analysis/))
- **Native community directory** — Replace Webflow CRM with in-app member directory + engagement scoring (Doc: [110](./110-community-directory-crm/))
