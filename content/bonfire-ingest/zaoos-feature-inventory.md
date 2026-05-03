INGEST BATCH: ZAO OS Feature Inventory.

Build a manifest of nodes and edges, preview the first 3 nodes, then ask me to approve. Topics, platforms, chains, and tools must be stored as attributes on relevant entity nodes, NEVER as standalone Entity nodes per scope_constraint trait. If existing nodes match by name and type, MERGE; do not create parallel nodes.

ZAO OS is the gated Farcaster music client + lab monorepo for the ZAO ecosystem. 50+ API route domains. 30+ component groups. 19 custom hooks. 30+ lib domains. Built on Next.js 16, React 19, Supabase RLS, Neynar, XMTP, Tailwind v4. Repo: github.com/bettercallzaal/ZAOOS.

## SECTION 1 — AUTH / IDENTITY

### FACT 1
Subject: Sign In With Farcaster (SIWF)
Type: Feature
Description: Wallet-less auth via Farcaster signer. Uses iron-session for cookies. Routes Zaal to allowlisted member experience.
Source: internal://src/app/api/auth + src/lib/auth
Confidence: 1.0

### FACT 2
Subject: Allowlist gate
Type: Feature
Description: Gates ZAO OS to allowlisted FIDs. CSV at Downloads/ZAOOS.csv with 40 members (name + wallet). Admin panel for managing.
Source: internal://memory/project_allowlist_data.md
Confidence: 1.0

### FACT 3
Subject: ZAO app FID 19640
Type: Identity
Description: Programmatic posting FID for ZAO ecosystem. App signer wallet generated via scripts/generate-wallet.ts, registered with Neynar. Uses privateKeyToAccount() for EIP-712 signing.
Source: internal://memory/project_signer_research.md
Confidence: 1.0

### FACT 4
Subject: ENS subnames system
Type: Feature
Description: Code complete for ENS subnames issuance to ZAO members. Needs focused on-chain setup session with wallet to deploy.
Source: internal://memory/project_ens_subnames_todo.md
Confidence: 0.9

### FACT 5
Subject: Hats Protocol governance hats
Type: Integration
Description: Hats Protocol v1 on Optimism (0x3bc1A0Ad72417f2d411118085256fC53CBdDd137) for role-based access control. ZAO uses hats for governance + member roles.
Source: internal://CLAUDE.md
Confidence: 1.0

## SECTION 2 — MUSIC

### FACT 6
Subject: Multi-platform music player
Type: Feature
Description: Inline music players for 9 platforms: Spotify, SoundCloud, Audius, YouTube, Sound.xyz, plus direct .mp3/.wav/.ogg via HTML5 Audio. Detects platform from URL, renders correct embed.
Source: internal://src/providers/AudioPlayer + src/lib/music
Confidence: 1.0

### FACT 7
Subject: Audius API integration
Type: Integration
Description: Audius API used for artist metadata + playback. Reads artist tracks, playlists, genres into ZAO music feed.
Source: internal://src/lib/music
Confidence: 1.0

### FACT 8
Subject: Sound.xyz / Zora music NFTs
Type: Integration
Description: GraphQL integration for NFT music metadata + playback. Surfaces on-chain music releases in ZAO library.
Source: internal://src/lib/music
Confidence: 1.0

### FACT 9
Subject: Now Playing system
Type: Feature
Description: useNowPlaying + useRadio + useMusicQueue + usePlayerQueue hooks coordinate cross-page audio state. Persists across navigation.
Source: internal://src/hooks
Confidence: 1.0

### FACT 10
Subject: Listening Room
Type: Feature
Description: Synchronized audio room for ZAO members. useListeningRoom hook syncs play state across participants via Supabase realtime.
Source: internal://src/hooks/useListeningRoom.ts
Confidence: 1.0

## SECTION 3 — MESSAGING / SOCIAL

### FACT 11
Subject: XMTP encrypted DMs + groups
Type: Integration
Description: XMTP Browser SDK v7 for end-to-end encrypted messages. App-specific burner keys, never personal wallet. Group chat via MLS protocol.
Source: internal://src/lib/farcaster + src/components/messages
Confidence: 1.0

### FACT 12
Subject: Farcaster casts via Neynar
Type: Integration
Description: Neynar API for read+write cast operations. Posts via app FID 19640. Reads via Farcaster Hub.
Source: internal://src/lib/farcaster + src/app/api/casts
Confidence: 1.0

### FACT 13
Subject: Cross-platform publishing
Type: Feature
Description: Cross-post from ZAO OS to Farcaster, X, Bluesky in one action. Located in src/lib/publish/.
Source: internal://src/lib/publish + src/app/api/publish + src/app/api/bluesky
Confidence: 1.0

### FACT 14
Subject: Lens Protocol auth
Type: Integration
Description: useLensAuth hook supports Lens login + cross-publishing. bettercallzaal.lens verified Lens identity.
Source: internal://src/hooks/useLensAuth.ts
Confidence: 1.0

### FACT 15
Subject: Activity feed + streaks
Type: Feature
Description: Activity tracking + streak counters for member engagement. Surfaces in member profiles + admin dashboards.
Source: internal://src/app/api/activity + src/app/api/streaks
Confidence: 1.0

## SECTION 4 — SPACES / STREAMING

### FACT 16
Subject: Stream.io video Spaces
Type: Integration
Description: Stream.io Video SDK powers live audio/video rooms. ZAO Spaces feature with DJ mode, screen share, themes.
Source: internal://src/components/spaces
Confidence: 1.0

### FACT 17
Subject: RTMP multistream Spaces
Type: Feature
Description: Spaces stream simultaneously to Twitch, YouTube, Kick, Facebook via RTMP. Restream OAuth integration planned.
Source: internal://src/app/api/stream + src/app/api/twitch
Confidence: 1.0

### FACT 18
Subject: 100ms.live integration
Type: Integration
Description: Alternative video infra integration via 100ms API. Used for specific Spaces use cases.
Source: internal://src/app/api/100ms
Confidence: 0.9

### FACT 19
Subject: Livepeer streaming
Type: Integration
Description: Livepeer stream pipeline for ZAO OS video content. Doc 544 standard-tier evaluation.
Source: internal://research/infrastructure/544 + src/app/api/livepeer
Confidence: 1.0

### FACT 20
Subject: Live transcript
Type: Feature
Description: useLiveTranscript hook for real-time captions during Spaces. Speaker diarization + searchable transcript output.
Source: internal://src/hooks/useLiveTranscript.ts
Confidence: 1.0

## SECTION 5 — GOVERNANCE / RESPECT

### FACT 21
Subject: OREC contract reader
Type: Feature
Description: Direct OREC contract reader via viem multicall on Optimism. Fallback for proposals + respect data when subgraph lags.
Source: internal://src/app/api/proposals + src/app/api/respect
Confidence: 1.0

### FACT 22
Subject: Dual respect ledger (OG + ZOR)
Type: Feature
Description: Tracks both OG Respect (ERC-20 on Optimism) and ZOR Respect (ERC-1155 on Optimism). Reconciliation in unified member ledger.
Source: internal://src/app/api/respect + src/lib/agents
Confidence: 1.0

### FACT 23
Subject: Snapshot integration
Type: Integration
Description: Snapshot voting for ZAO governance proposals. Off-chain signaling + on-chain execution path.
Source: internal://src/app/api/snapshot
Confidence: 1.0

### FACT 24
Subject: ZAO Fractals integration
Type: Feature
Description: Weekly ZAO Fractal process integration. Reads from Discord Python bot + frapps submissions. 90+ weeks of OREC submissions historic data.
Source: internal://src/app/api/fractals + memory/project_fractal_process.md
Confidence: 1.0

### FACT 25
Subject: Member profiles with respect display
Type: Feature
Description: Per-member profile pages with respect balance, contributions ledger, hats held, activity history. Public-facing.
Source: internal://src/components/members + src/app/api/profile
Confidence: 1.0

## SECTION 6 — TOKENS / INTEGRATIONS

### FACT 26
Subject: Empire Builder ZABAL panel
Type: Feature
Description: EmpirePanel drawer surfaces ZABAL Empire Builder V3 leaderboards inline. 6 group tabs (Holders, Farcaster, SongJam, Respect, Voting, Other). 60s cache.
Source: internal://src/components/spaces + src/app/api/empire-builder
Confidence: 1.0

### FACT 27
Subject: ZOUNZ DAO panel
Type: Feature
Description: ZOUNZ Token + Auction + Governor + Treasury display in ZAO OS. Nouns Builder fork on Base. Real-time auction status.
Source: internal://src/app/api/zounz
Confidence: 1.0

### FACT 28
Subject: SongJam integration
Type: Integration
Description: SongJam by Virtuals ($SANG token) integrated for cryptographic voice verification in X Spaces. Cross-product: SongJam runs, Empire Builder hosts, ZAO surfaces.
Source: internal://src/app/api/songjam
Confidence: 1.0

### FACT 29
Subject: Voting miniapp slot
Type: Feature
Description: Zabal Voting Miniapp votes feed into ZAO OS Empire Panel "Voting" tab. External counter API. Top voter 2026-05-02: @yerbearserker (3 votes).
Source: internal://memory/project_empire_builder_zabal_integration.md
Confidence: 1.0

### FACT 30
Subject: WaveWarZ on-chain music battles
Type: Integration
Description: WaveWarZ artist roster (43 wallets) integrated with battle display, data sync, stats generation. Solana mainnet smart contracts.
Source: internal://src/app/api/wavewarz
Confidence: 1.0

### FACT 31
Subject: Staking system
Type: Feature
Description: ZAO staking contracts (ZabalConviction.sol). Bounty board contract + stake tracking. Conviction voting pattern.
Source: internal://contracts/ZabalConviction.sol + src/app/api/staking
Confidence: 1.0

## SECTION 7 — AGENTS / BOTS

### FACT 32
Subject: Autonomous trading agents (VAULT/BANKER/DEALER)
Type: Feature
Description: Three agent personalities in src/lib/agents. autostake.ts, banker.ts, burn.ts, cast.ts, dealer.ts, swap.ts. Shared runner.ts. Trades within parameter limits.
Source: internal://src/lib/agents
Confidence: 1.0

### FACT 33
Subject: ZOE bot scheduler
Type: Bot
Description: Small Node.js scheduler at ~/zoe-bot. Manages scheduled sends, learning pings, COC promo, event ping events.jsonl.
Source: internal://memory/project_vps_skill.md
Confidence: 1.0

### FACT 34
Subject: ZAOstock Telegram team bot
Type: Bot
Description: TypeScript + grammy + Supabase. Live on VPS. Bot at zaostock-bot/ in repo. Manages 17 team member onboarding codes, daily check-ins, leaderboard.
Source: internal://memory/project_zaostock_bot_live.md
Confidence: 1.0

### FACT 35
Subject: Hermes coder + critic + runner
Type: Bot
Description: bot/src/hermes/ contains coder.ts, critic.ts, runner.ts, db.ts, git.ts, anthropic.ts, claude-cli.ts, types.ts, pr.ts, pr-watcher.ts, commands.ts. Sprint 1 cost routing live (Sonnet/Opus/Haiku).
Source: internal://bot/src/hermes
Confidence: 1.0

### FACT 36
Subject: ZAO Devz bot module
Type: Bot
Description: bot/src/devz/index.ts handles ZAO Devz channel ops + /SHIP FIX command routing to Hermes. ESM imports for node:http.
Source: internal://bot/src/devz
Confidence: 1.0

### FACT 37
Subject: ZOE learning pings
Type: Bot
Description: Python random_tip.py at ~/zoe-learning-pings. Hourly cron pushes a tip to ZAO Devz General topic. ZOE_TIP_BOT_TOKEN/CHAT_ID/THREAD_ID env overrides.
Source: internal://scripts/zoe-learning-pings
Confidence: 1.0

### FACT 38
Subject: ZABAL Bonfire Bot
Type: Bot
Description: bonfires.ai-hosted agent @zabal_bonfire. Knowledge graph intake + recall for ZABAL umbrella. Genesis tier. 15 personality traits + production system prompt.
Source: internal://memory/project_zabal_bonfire_live.md
Confidence: 1.0

## SECTION 8 — FESTIVALS / EVENTS

### FACT 39
Subject: ZAO Festivals umbrella
Type: Feature
Description: ZAO Festivals umbrella branding. Events: ZAO-PALOOZA (NFT NYC 2024), ZAO-CHELLA (Miami Art Basel 2024-12-06), ZAOstock (Ellsworth 2026-10-03). zaofestivals.com domain.
Source: internal://memory/project_zao_festivals_umbrella.md
Confidence: 1.0

### FACT 40
Subject: ZAOstock 2026 dashboard pages
Type: Feature
Description: ZAOstock pages in ZAOOS until 2026-04-29 spinout. Now redirects to zaostock.com. Sponsor deck, one-pagers, run-of-show, food-bev, experience plans.
Source: internal://memory/project_zaostock_spinout.md
Confidence: 1.0

### FACT 41
Subject: Events API + lu.ma integration
Type: Feature
Description: src/app/api/events for event calendar. Lu.ma calendar integration for event signups. Open meetings link meet.baserooms.io/zaal for cobuild.
Source: internal://src/app/api/events
Confidence: 1.0

## SECTION 9 — RESEARCH INFRASTRUCTURE

### FACT 42
Subject: 590+ research docs library
Type: Feature
Description: research/ directory holds 590+ docs across 13 topic folders (agents, music, dev-workflows, infrastructure, governance, community, cross-platform, farcaster, identity, business, events, wavewarz, security). Institutional memory across products.
Source: internal://research/
Confidence: 1.0

### FACT 43
Subject: /zao-research skill
Type: Feature
Description: Three-tier research skill (QUICK/STANDARD/DEEP) with v2 metadata frontmatter, dispatch pattern for hub topics, action-bridge tables. Saves to research/<topic>/<number>-<slug>/.
Source: internal://.claude/skills/zao-research
Confidence: 1.0

### FACT 44
Subject: /autoresearch skill
Type: Feature
Description: Karpathy-style autonomous goal-directed iteration. Six modes: scenario, debug, fix, ship, plan, predict, security. Modify-verify-keep-discard loop.
Source: internal://.claude/skills/autoresearch
Confidence: 1.0

### FACT 45
Subject: /worksession skill
Type: Feature
Description: Session start ritual. Each terminal gets its own ws/ branch. Run before any work. Worktree-based.
Source: internal://.claude/skills/worksession
Confidence: 1.0

### FACT 46
Subject: /onepager skill
Type: Feature
Description: Draft new ZAOstock one-pager (sponsor / partner / venue / city briefing) from template.
Source: internal://.claude/skills/onepager
Confidence: 1.0

## SECTION 10 — MOBILE / NATIVE

### FACT 47
Subject: Capacitor iOS + Android wrapper
Type: Feature
Description: capacitor.config.ts wraps ZAO OS web app for iOS + Android stores. ios/ + android/ native projects in repo.
Source: internal://capacitor.config.ts
Confidence: 1.0

### FACT 48
Subject: Farcaster Mini App SDK
Type: Integration
Description: Mini App SDK for Farcaster client embedding. Push notifications via Mini App SDK + Supabase Realtime fallback. Deep links into ZAO OS.
Source: internal://src/app/api/miniapp + src/hooks/useMiniApp.ts
Confidence: 1.0

### FACT 49
Subject: PWA support
Type: Feature
Description: Progressive Web App via src/components/pwa. Installable on mobile + desktop. Service worker + manifest.
Source: internal://src/components/pwa
Confidence: 1.0

## SECTION 11 — DATABASE / STORAGE

### FACT 50
Subject: Supabase RLS database
Type: Integration
Description: Supabase Postgres with Row-Level Security on all tables. Service role key server-side only. Realtime subscriptions for live updates.
Source: internal://src/lib/db + scripts/*.sql
Confidence: 1.0

### FACT 51
Subject: Supabase edge functions
Type: Feature
Description: Deno edge functions at supabase/functions/. Used for cron, webhooks, third-party API proxies.
Source: internal://supabase/functions
Confidence: 0.9

### FACT 52
Subject: Migrations system
Type: Feature
Description: SQL migrations at scripts/*.sql. Idempotent design. ZAOstock standup SQL example uses ON CONFLICT DO NOTHING.
Source: internal://scripts
Confidence: 1.0

### FACT 53
Subject: Memory recall system (pgvector)
Type: Feature
Description: src/lib/memory-recall.ts + memory-events.ts. Semantic recall over ZAO ecosystem events using pgvector embeddings.
Source: internal://src/lib/memory-recall.ts
Confidence: 1.0

### FACT 54
Subject: Hindsight MCP server
Type: Integration
Description: mcp/hindsight-mcp-server lets Claude/agents query ZAO OS memory + activity via MCP. infra/hindsight/ holds the deployed server.
Source: internal://mcp/hindsight-mcp-server + infra/hindsight + src/lib/hindsight.ts
Confidence: 1.0

## SECTION 12 — BUILD / DEPLOY

### FACT 55
Subject: Vercel hosting
Type: Integration
Description: ZAO OS deployed on Vercel. zaoos.com primary domain. Preview deploys per PR. Vercel Fluid Active CPU monitored.
Source: internal://vercel.json + research 543
Confidence: 1.0

### FACT 56
Subject: Cloudflared tunnels
Type: Integration
Description: Cloudflare Tunnels at ~/.cloudflared/ on VPS 1. Named tunnel zao-agents serves paperclip.zaoos.com + ao.zaoos.com + bot endpoints.
Source: internal://memory/project_paperclip_infra.md
Confidence: 1.0

### FACT 57
Subject: VPS 1 Hostinger KVM 2
Type: Integration
Description: Single VPS at 31.97.148.88. Hosts ZOE, ZAOstock bot, Hermes, Composio AO, Cloudflared, Caddy reverse proxy. NO VPS 2 exists - documented in feedback.
Source: internal://memory/project_no_vps2.md
Confidence: 1.0

### FACT 58
Subject: GitHub Actions CI
Type: Integration
Description: GitHub Actions workflows for typecheck, biome lint, vitest, playwright e2e on every PR. Branch protection on main with enforce_admins=true.
Source: internal://.github/workflows
Confidence: 1.0

### FACT 59
Subject: Biome lint + format
Type: Feature
Description: Biome configured at biome.json. npm run lint:biome enforces project conventions. Replaces eslint + prettier.
Source: internal://biome.json
Confidence: 1.0

### FACT 60
Subject: Vitest + Playwright tests
Type: Feature
Description: Vitest for unit tests (vitest.config.ts), Playwright for e2e (playwright.config.ts). 248 tests across 15 areas as of Q1 2026.
Source: internal://memory/project_qa_status.md
Confidence: 1.0

### FACT 61
Subject: Patch-package + XMTP WASM postinstall
Type: Feature
Description: postinstall script runs patch-package + copies XMTP WASM. Required for Browser SDK v7 compatibility.
Source: internal://package.json
Confidence: 1.0

### FACT 62
Subject: Caddy reverse proxy on VPS
Type: Integration
Description: ~/caddy/Caddyfile (symlink to ~/zao-os/infra/portal/caddy/Caddyfile) routes services on VPS. Per-service config in ao/, claude/, dock/, portal/.
Source: internal://infra/portal/caddy
Confidence: 1.0

## EDGES TO ASSERT

- ZAO OS -[has_feature]-> Sign In With Farcaster
- ZAO OS -[has_feature]-> Allowlist gate
- ZAO OS -[has_feature]-> Multi-platform music player
- ZAO OS -[has_feature]-> XMTP encrypted DMs and groups
- ZAO OS -[has_feature]-> Cross-platform publishing
- ZAO OS -[has_feature]-> Stream.io video Spaces
- ZAO OS -[has_feature]-> OREC contract reader
- ZAO OS -[has_feature]-> Dual respect ledger
- ZAO OS -[has_feature]-> Empire Builder ZABAL panel
- ZAO OS -[has_feature]-> ZOUNZ DAO panel
- ZAO OS -[has_feature]-> Autonomous trading agents
- ZAO OS -[has_feature]-> ZAO Festivals umbrella
- ZAO OS -[has_feature]-> 590+ research docs library
- ZAO OS -[has_feature]-> Capacitor iOS + Android wrapper
- ZAO OS -[has_feature]-> Farcaster Mini App SDK
- ZAO OS -[uses_integration]-> Audius API
- ZAO OS -[uses_integration]-> Sound.xyz / Zora music NFTs
- ZAO OS -[uses_integration]-> Hats Protocol governance hats
- ZAO OS -[uses_integration]-> Snapshot
- ZAO OS -[uses_integration]-> SongJam
- ZAO OS -[uses_integration]-> WaveWarZ
- ZAO OS -[uses_integration]-> Lens Protocol auth
- ZAO OS -[uses_integration]-> Livepeer streaming
- ZAO OS -[uses_integration]-> 100ms.live
- ZAO OS -[deployed_on]-> Vercel hosting
- ZAO OS -[uses_db]-> Supabase RLS database
- ZAO OS -[hosts_bot]-> ZOE bot scheduler
- ZAO OS -[hosts_bot]-> Hermes coder + critic + runner
- ZAO OS -[hosts_bot]-> ZAO Devz bot module
- ZAO OS -[hosts_bot]-> ZOE learning pings
- ZAOstock Telegram team bot -[runs_on]-> VPS 1 Hostinger KVM 2
- ZOE bot scheduler -[runs_on]-> VPS 1 Hostinger KVM 2
- Hermes coder + critic + runner -[runs_on]-> VPS 1 Hostinger KVM 2
- Composio AO -[runs_on]-> VPS 1 Hostinger KVM 2
- Cloudflared tunnels -[runs_on]-> VPS 1 Hostinger KVM 2
- Caddy reverse proxy on VPS -[runs_on]-> VPS 1 Hostinger KVM 2
- Memory recall system -[uses]-> Supabase RLS database
- Hindsight MCP server -[exposes]-> Memory recall system
- ZABAL Bonfire Bot -[is_external_to]-> ZAO OS
- ZAO OS -[part_of]-> The ZAO
- ZAOstock 2026 -[was_part_of]-> ZAO OS until 2026-04-29
- ZAOstock 2026 -[graduated_to]-> own repo per Monorepo-as-Lab pattern
- COC Concertz -[graduated_to]-> own repo per Monorepo-as-Lab pattern
- FISHBOWLZ -[was_part_of]-> ZAO OS until paused 2026-04-16
- Zaal Panthaki -[built]-> ZAO OS

---

Build the manifest, preview the first 3 nodes inline, then ask me "approve all?". Do not commit until I say yes. If existing nodes match by name + type, MERGE; do not create parallel nodes. Topics, platforms (Vercel, Supabase, Optimism, Base, Solana, Avalanche, Cloudflare, Hostinger), and tools (Next.js, React, Tailwind, Capacitor, Stream.io, XMTP, Neynar, biome, vitest, playwright) must be attributes only, never standalone Entity nodes.
