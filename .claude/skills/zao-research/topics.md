# Research by Topic

Use this to quickly find if a topic has already been researched.

**Important:** Always cross-reference research docs with the actual codebase (`src/`). Research docs may contain aspirational designs not yet implemented.

## Farcaster Protocol & Ecosystem
- Protocol architecture, Snapchain, identity → `01`
- Hub API, Neynar SDK, managed signers → `02`
- SIWF auth, FID registration, onboarding → `17`
- Ecosystem landscape (clients, tools) → `19`
- Deep dive 2026 (Neynar acquisition, DAU, future) → `21`
- Players, leaderboards, tokens (DEGEN/MOXIE/NOTES/CLANKER) → `22`
- All clients compared (18+), notification systems → `34`
- Farcaster ecosystem 2026 update (Neynar acquisition, Mini Apps, CLANKER) → `73`
- Hypersnap (incomplete) → `10`

## Music & Audio
- Music APIs (Audius, Sound.xyz, Spotify, SoundCloud, YouTube) → `03`
- Live audio rooms (LiveKit, WebRTC, synchronized listening) → `43`
- Audio player architecture, waveforms, streaming → `33`, `43`
- SongJam audio spaces iframe embed, 100ms SDK, /zabal page → `119`
- SongJam screen share PR, Stream Video SDK, MyScreenShareButton → `122`
- Music player gap analysis: missing features (favorites, history, queue, presence, reactions) → `126`
- Mobile player optimization: MediaSession, swipe gestures, expanded player, crossfade, gapless, iOS PWA audio → `127`
- **Music player complete audit (CANONICAL)**: all 23 components, 23 endpoints, future roadmap → `128`
- Next music integrations (Tier 4): Spotify API, Audius SDK, Farcaster embeds, AI recs, Zora NFTs, scrobbling → `130`
- Play counting & stream attribution: which platforms count ZAO OS plays, Last.fm/ListenBrainz scrobbling → `138`

## On-Chain Music Distribution & NFTs
- Trustware SDK evaluation (crypto payment middleware, too early) → `139`
- BuilderOSS ecosystem (10 repos, ZOUNZ contracts, builder-template-app, @builderbot) → `140`
- On-chain distribution landscape 2026 (Zora, 0xSplits, Unchained, Audius, Catalog) → `141`
- Zora Protocol SDK for music NFTs (create1155, Base chain, code examples) → `142`
- 0xSplits revenue distribution (automated splits, Zora integration, waterfall/swapper) → `143`
- ZOUNZ + music NFTs unified (DAO-governed distribution, proposal templates) → `144`
- Simple NFT platform design (3-step UX, gas sponsorship, mobile-first) → `145`
- Open contracts multi-artist distribution (forkable trio, community.config.ts fork point) → `146`
- Full distribution pipeline (Audius + Zora + ZOUNZ, unified dashboard) → `147`
- Master integration plan (5 phases, 6-8 weeks, all docs consolidated) → `148`
- BuilderOSS deep dive: every package, hook, UI component, subgraph → `149`
- Arweave permanent music storage via Irys SDK ($0.04/track, 200+ years) → `150`
- **ZOUNZ distribution WITHOUT Zora**: Arweave + thirdweb + 0xSplits (supersedes 142/144) → `151`
- **Arweave ecosystem deep dive (CANONICAL)**: AO compute, ar.io Wayfinder CDN, ArDrive Turbo, GraphQL indexing, ArNS domains, Irys deprecated → `152`
- **BazAR & atomic assets for music**: Arweave-native marketplace, UCM orderbook, UDL licensing, fractionalization, $U token, primary distribution → `153`
- **Music NFT end-to-end implementation (THE BUILD PLAN)**: upload MP3+art → mint → buy, every file/route/component, ArDrive Turbo + Arweave Wallet Kit, 52hrs → `155`
- Pods.media podcast tokenization: Pods still active (900K mints, $1M rev), ZAO clone on Arweave atomic assets, RSS from GraphQL, ~5 days → `156`

## Respect & Governance
- Respect tokens (aspirational design — tiers/decay NOT implemented) → `04`
- ORDAO, OREC governance, Respect1155, Fibonacci scoring → `56`
- On-chain governance: ZOUNZ Governor, Snapshot, OZ Governor + Respect, hybrid architecture → `131`
- Snapshot weekly priority polls: one-click creation, approval voting, multi-project templates → `132`
- **Governance system complete audit (CANONICAL)**: all 3 tiers, 5 API routes, 6 components, Respect-weighted voting, auto-publish, future roadmap → `133`
- Respect deep dive (on-chain data, scoring math, orclient SDK) → `58`
- DAO structure, token economics, Wyoming DUNA, Safe multisig → `31`
- Artist revenue, IP rights, streaming economics → `29`
- Competitors (Sound.xyz dead, Catalog dead, Coop Records) → `37`

## Identity & Roles
- ZAO Identity / ZIDs (music profile + Respect + roles) → `05`
- Hats Protocol (on-chain role trees, ERC-1155) → `07`
- Hats Anchor App, DAO tooling landscape → `55`
- Austin Griffith, ETH Skills, ERC-8004, onchain credentials → `23`

## AI Agent
- ZAO AI agent plan (ElizaOS + Claude + Hindsight) → `24`
- AI memory architecture (implicit, explicit, pgvector) → `08`
- Hindsight memory system (91.4%, retain/recall/reflect) → `26`
- OpenFang Agent OS (not a fit, but reference architecture) → `46`

## Coordination & Incentives
- Incented protocol: ZABAL campaigns, staking-based task coordination → `64`
- ZABAL partner ecosystem: MAGNETIQ, SongJam, Empire Builder, Clanker → `65`

## Community & Growth
- Gating (allowlist → NFT → Hats → EAS) → `12`
- Chat messaging (Farcaster channels + XMTP) → `13`
- XMTP V3 browser SDK, MLS encryption, mainnet fees → `74`
- MVP specification → `15`
- Followers/following feed (sortable, filterable) → `20`
- Onboarding, growth 40→1000, moderation, gamification → `32`
- Notifications (Mini App push + Supabase + polling) → `35`
- ZAO community ecosystem → `47`, `48`

## WaveWarZ Integration
- Solana wallet, initial WaveWarZ + multi-wallet settings → `95`
- WaveWarZ deep dive: mechanics, economics, 3-tool ecosystem → `96`
- Artist discovery pipeline: onchain data, auto-spotlight, profile enrichment → `97`
- Prediction market music battles: parimutuel schema, settlement math → `99`
- Solana PDA reading in Next.js: web3.js, buffer-layout, Helius → `100`
- **WaveWarZ × ZAO OS Whitepaper (CANONICAL)**: full platform data (647 battles, 43 artists w/ wallets, $38K volume), Artist Discovery Pipeline architecture, governance synergy, 10-day roadmap → `101`

## Social Connections & Settings
- X handle auto-import from Farcaster, settings UI redesign, multi-social connections -> `107`
- Community directory CRM: replace Webflow, engagement scoring, CSV import, on-chain enrichment -> `110`

## Payments & Fiat On-Ramp
- Coinflow fiat checkout (cards, ACH, Apple Pay → USDC on EVM), React SDK, webhooks, Credits → `125`

## Cross-Platform
- Publishing to 11 platforms (fan-out architecture) → `28`
- Lens Protocol V3 (collect/monetize, Bonsai) → `36`
- Discord & Telegram bridges → `37`
- Hive cross-posting → docs/HIVE_RESEARCH.md
- DFOS (Dark Forest OS): private-first creative group infra, Ed25519 chains, did:dfos, Metalabel → `123`

## Technical Infrastructure
- Next.js 16 + React 19 patterns → `41`
- Supabase advanced (RLS, Realtime, Edge Functions, pgvector) → `42`
- Storage (R2/IPFS/Arweave), mobile (PWA/Capacitor), privacy (ZK) → `33`
- Project structure, file conventions → `14`
- UI reference, design tokens → `16`
- Superpowers agentic skills framework → `54`

## APIs & Services
- Public APIs landscape (Tier 1/2/3) → `09`
- 100+ APIs mapped to ZAO features → `25`
- Neynar credit optimization → docs/neynar-credit-optimization.md
- XMTP research → docs/XMTP_RESEARCH.md
- Mini App research → docs/MINIAPP_RESEARCH.md

## Security & Code Quality
- Pre-build security checklist → `18`
- Codebase audit guide + results → `40`
- AI code audit, cleanup agents, CI pipeline → `38`
- March 2026 security audit (all fixes verified) → `57`
- Backend testing strategy: Vitest + NTARH + MSW, 47-route audit → `66`
- SECURITY.md in project root

## Project Documentation
- The ZAO Complete Guide (CANONICAL) → `50`
- Whitepaper Draft 5 → `51`
- Whitepaper critique → `52`
- Whitepaper user testing → `53`
- GitHub documentation, README, showcase → `39`
- Research organization patterns → `45`
- Comprehensive overview + gap analysis → `27`
- bettercallzaal GitHub inventory (65 repos) → `30`

## Identity & Roles (additions)
- Hats tree integration for ZAO roles → `59`
- Hats Protocol V2 updates, new modules, HSG v2, MCP server → `75`

## Ethereum & Alignment
- Vitalik philosophy + EF mandate alignment → `60`
- Ethereum alignment opportunities for ZAO → `61`

## Development & Operations
- Agentic development workflows (Claude Code, GitHub Actions) → `44`
- Reference repos (Sonata, Nook, Litecast) → `11`
- Autoresearch: autonomous skill/prompt improvement loops → `62`
- Autoresearch deep dive: implementations, eval loop, 7 ZAO OS use cases → `63`
- Paperclip AI: agent company orchestrator, org chart, budgets, ZAO startup guide → `67`
- Alibaba Page Agent: in-page AI copilot, DOM dehydration → `68`
- Claude Code tips: 45 best practices audited against ZAO setup → `69`
- Sub-agents vs Agent Teams: multi-agent paradigms, Claude Architect patterns → `70`
- Paperclip rate limits: multi-agent API management, Anthropic tiers, staggering → `71`
- Paperclip functionality deep dive: full agent lifecycle, heartbeat, adapter config → `72`
- Sprint plans → `docs/superpowers/plans/`
- Architecture decisions → `docs/superpowers/plans/2026-03-17-decisions-resolved.md`

## Wallet & Connection
- Wallet connection patterns → `49` (wallet-connect)

## Farcaster Mini Apps
- Farcaster Mini Apps SDK, Quick Auth, notifications → `86` (folder 68-farcaster-miniapps-integration)

## Recent Additions (76-88)
- Git branching for AI agents (trunk-based dev) → `76`
- Bluesky cross-posting (@atproto/api, custom feeds, labeler) → `77`
- Nouns Builder (daily NFT auctions, DAO suite) → `78`
- SongJam music player research → `79`
- Jitsi Meet live rooms → `80`
- Paperclip multi-company agents → `81`
- Paperclip ClipMart plugins → `82`
- ElizaOS 2026 update (v1.7.2, v2 alpha) → `83`
- Farcaster AI agents landscape → `84`
- Farcaster agent technical setup (Neynar) → `85`
- Farcaster Mini Apps (SDK, Quick Auth) → `86` (folder 68-)
- Farcaster social graph & sharing APIs → `87` (folder 81-)
- Music-first platform redesign → `88` (folder 82-)
- Skills audit, cleanup & prompt injection security → `137`
- **Skills & commands master reference (CANONICAL)**: every command, skill, workflow, session flows, how to ask → `154`
