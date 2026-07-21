---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-07-21
related-docs: "163, 213, 1453"
original-query: "How to build streamer tools for a web3 music community - foundation for the ZAO Streamer Kit"
tier: STANDARD
---

# 1773 — Building Streamer Tools for Web3 Music Communities

> **Goal:** Map the open-source streamer toolkit landscape (overlays, multistreaming, web3 tipping) and recommend a lean MVP + 2 forkable OSS repos for the ZAO Streamer Kit.

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|---|---|
| **Overlay engine** | Fork `bensblueprints/overlayr` (MIT) or `vladiantio/chat-overlay` (MIT) | Both are MIT-licensed, require zero SaaS fees, ship as single self-hosted server. Overlayr supports webhooks + server-authoritative timers; chat-overlay is lighter for Twitch/YouTube chat only. |
| **Multistreaming** | Evaluate `datarhei/Restreamer` (Apache-2.0) for self-hosted; use Restream SaaS ($19/mo) only if operational overhead is unacceptable | Restreamer saves 70-90% vs. SaaS on recurring cost, includes REST API, supports RTMP/SRT to YouTube/Twitch/Vimeo. Self-hosting requires 1 VPS ($5-10/mo) + basic Docker. ZAO already uses Restream for ZABAL Games; keep it as fallback. |
| **Web3 tipping** | Build a thin integration with `phessophissy/tip-jar-frames` (MIT) for Farcaster + Base tipping | Tip Jar Frames is Farcaster-native, Base-settled, 2% fee, sender/recipient wallets only (no intermediary). Respect could reward tippers with on-chain reputation points on Optimism in a Phase 2. |
| **Chat overlay** | Use `vladiantio/chat-overlay` (MIT, React+Vite) as starting point; fork it for Farcaster channel integration | Supports Twitch + YouTube chat simultaneously; API quota is 3.6k units/hour on free tier (2.7 hrs/day YouTube, unlimited Twitch). For ZAO, primary use is Farcaster channel visibility during streams. |
| **Alerts + tipping combine** | Self-host `cdutson/streamerbot-alerts` (GPL-3.0) on top of Streamer.bot WebSocket for follow/sub/cheer, then trigger web3 tip contract when certain thresholds cross | Streamer.bot is industry-standard for Twitch; its WebSocket emits all events. Layer web3 on top (new MVP work) to mint on-chain tip records tied to Respect. |
| **MVP ship target** | OBS browser source (URL) for Farcaster channel chat display + static web3 tip button | Simplest thing: StreamHelper already exists in codebase (src/lib/spaces/streamHelpers.ts); build a chat overlay that pulls live messages from ZAO channel (via Neynar API) and shows them in OBS. Wire a "Support this Stream" button that opens a Farcaster Frame for one-click tips on Base. No backend work needed; client-side React + Frame. Ship in 1-2 weeks. |

## The Streaming Stack: What Exists, What's Forkable, What to Build

### 1. Overlay Tooling (OBS Browser Sources)

**Status in ZAO OS:** ZAOOS has Stream.io + 100ms for voice rooms (community.config.ts). No overlay tooling exists yet.

#### Forkable: `bensblueprints/overlayr` (MIT)

- **What it is:** Self-hosted countdown + goal bar + rotating message ticker + alert box, all as OBS Browser Source URLs. No subscription, one-time $24 or self-host free.
- **Stack:** Node.js + Express, SQLite, React (admin UI), plain HTML/CSS/JS (overlay pages), WebSocket for live updates.
- **Strengths:** Server-authoritative timers (never desync on reload), webhook-triggered alerts, 5 themes, Electron desktop wrapper included.
- **Cost:** $0/month if self-hosted; $5-10/mo VPS fee only.
- **License:** MIT — fork freely.
- **For ZAO:** Tier countdown for ZABAL Games tournament battles; goal bar for stream tip milestones; rotating messages for event announcements.
- **GitHub:** https://github.com/bensblueprints/overlayr [FULL]

#### Forkable: `vladiantio/chat-overlay` (MIT)

- **What it is:** Sleek Twitch + YouTube Live chat overlay for OBS. Transparent background, multi-platform simultaneous support.
- **Stack:** React + TypeScript + Vite, TMI.js for Twitch (WebSocket, unlimited), YouTube Data API v3 (quota: 10k units/day, ~2.7 hrs streaming/day on free tier).
- **For ZAO:** Fork to pull Farcaster `/zao` channel messages via Neynar API instead of YouTube. Chat overlay in OBS showing live cast activity during streams.
- **GitHub:** https://github.com/vladiantio/chat-overlay [FULL]

#### Alternative: `w0rxbend/obs-effects` (MIT)

- GPU-accelerated PixiJS 8 overlays (webcam borders, backgrounds, particles). Beautiful but heavier (GPU load). Best for visual polish, not core functionality.

#### Not recommended for fork:

- `abhayraghuwanshi/cool-stream-overlay` (local AI co-host) — requires node-llama-cpp, overkill for MVP.

### 2. Multistreaming: Restream vs Self-Hosted

**Status in ZAO OS:** ZABAL Games workshops already use Restream (restream.io) to broadcast to YouTube/Twitch. ZAO can extend that or self-host for cost savings.

#### SaaS: Restream (restream.io)

| Tier | Cost/mo | Channels | Recording | When to use |
|------|---------|----------|-----------|-------------|
| Basic | Free | 2 | None | Testing, low frequency |
| Standard | $19 | 5 | 6 hrs | ZAO tournaments (3 platforms: YouTube, Twitch, custom) |
| Professional | $49 | 8 | 10 hrs | COC Concertz live shows (5+ platforms) |

- **Strengths:** UI wizard, team features, scheduled broadcasts, cloud recording.
- **ZAO context:** Already integrated; ZABAL Games uses it. Keep as fallback for non-technical hosts.

#### Self-Hosted: `datarhei/Restreamer` (Apache-2.0)

- **What it is:** Accept RTMP from OBS, restream simultaneously to YouTube Live + Twitch + Vimeo + any RTMP endpoint. FFmpeg-based, hardware-accelerated (Pi, NVIDIA CUDA, Intel VAAPI).
- **Cost:** $5-10/mo VPS + zero per-channel overhead.
- **Annual savings vs SaaS:** $19/mo Standard tier = $228/year. Self-hosted = $72-120/year (6-10x cheaper).
- **REST API:** 100% Swagger-documented. Programmatically start/stop streams, monitor bandwidth, configure destinations.
- **Weakness:** Slow maintenance cadence (docs last updated ~3 years ago), sparse community reviews.
- **For ZAO:** Worthwhile if streaming 2+ times per week. Setup: Docker on a $5/mo Hetzner/DigitalOcean VPS (~2 hours). Supports adaptive bitrate to handle viewer fluctuations.
- **GitHub:** https://github.com/datarhei/restreamer [FULL]

#### Self-Hosted: `owncast/owncast` (MIT)

- **What it is:** Full Twitch-like platform (RTMP ingest, HLS playback, web chat, Fediverse integration). One streamer, one stream.
- **Cost:** $5-20/mo VPS.
- **Weakness:** No multistreaming to external platforms; built-in chat only (can't cross-post to Farcaster). No monetization or mobile app.
- **For ZAO:** Less suitable than Restreamer for multi-platform strategy. Good if hosting a private listening room, not for artist battles.
- **GitHub:** https://github.com/owncast/owncast [FULL]

#### Self-Hosted: `nginx-rtmp` (OSS)

- **What it is:** Bare RTMP relay using NGINX + RTMP module. Lightweight, no UI, maximum customization.
- **Cost:** Minimal VPS ($5/mo).
- **Complexity:** Very High. Requires manual nginx.conf tuning, no dashboard, scripting for stream state.
- **For ZAO:** Only if a developer wants to build a custom wrapper. Not recommended for rapid MVP.

**Recommendation:** Start with Restream SaaS (already integrated) or upgrade to self-hosted Restreamer if COC Concertz streams 3+ times/week. Decision point: if annual stream revenue > $200, self-hosting pays for itself.

### 3. Web3 Tipping + Respect Integration

**Status in ZAO OS:** Respect is live on Optimism (156 holders, Gini 0.73). No on-chain tip mechanism yet.

#### Forkable: `phessophissy/tip-jar-frames` (MIT)

- **What it is:** Farcaster Frames for seamless Base-settled tipping. Creators embed a Frame URL in a cast; viewers click "Tip $0.10" and it executes immediately via Base Account Sub-Accounts (no wallet popup).
- **Stack:** Next.js 14 + React + wagmi v2 (wallet), Solidity smart contract (Base), Farcaster Frames.
- **Economics:** 2% protocol fee, instant settlement, creator sees tips in their wallet immediately.
- **For ZAO:** Fork the contract + Frame app to tie tips to on-stream events (WaveWarZ battles, artist performances). Mint Respect points to tippers (Phase 2: reputation rewards).
- **Contract:** Simple `tip(address recipient)` + `tipWithMessage(address recipient, message)`.
- **GitHub:** https://github.com/phessophissy/tip-jar-frames [FULL]

#### Reference: `officialcmg/attention-rush` (MIT)

- Base Account Sub-Accounts for "attention tipping" — automatic micro-tips as viewer watches. Shows the tech stack well.
- **For ZAO:** Not forkable (too specific to Farcaster feed), but pattern is solid: Sub-Account auto-spend = zero friction.

#### Reference: `sumionochi/tipstream` (Chrome extension)

- Real USDt tipping via on-chain WDK wallet, hype detection, viewer spike detection, milestone tracking.
- **For ZAO:** Architecture pattern (LLM reasoning + event triggers) maps to ZOE. Not a direct fork candidate (Rumble-specific), but idea: ZOE could trigger tips on WaveWarZ battle outcomes.

#### Reference: `mchekin/tipcurrent` (MIT)

- Production Java backend for tips + reactions + webhooks + OLTP/OLAP analytics. Overkill for MVP, but good reference if scaling analytics.

#### Building the Phase 1 Piece: Web3 Tipping Frame

```
User watches WaveWarZ artist stream in OBS overlay.
Artist wins a battle or reaches a milestone.
OBS overlay shows "Support Artist [Name]" button → links to Farcaster tip Frame.
Viewer clicks → Frame opens, enters tip amount.
Base smart contract executes tip.
ZOE indexer watches for tip events, mints Respect points to tippers (Phase 2).
```

**Stack:** Next.js Frame (hosting on Vercel), Base contract (Hardhat), indexer hooks into Respect subgraph.

### 4. Alerts (Sub/Follow/Cheer/Tip)

#### Reference: `cdutson/streamerbot-alerts` (GPL-3.0)

- Streamlabs + Streamer.bot WebSocket integration for Twitch alerts (follow, sub, cheer, raid, KoFi donations).
- **Stack:** WebSocket client (browser), config.js JSON, HTML+CSS overlay.
- **For ZAO:** Minimal value on Twitch (ZAO is Farcaster-first). Pattern is useful: Streamer.bot → WebSocket → overlay. Could adapt to Farcaster event stream if a bot mirrors Farcaster events to WebSocket.

#### Reference: `Ainz974/ainz-alerts-releases` (Free)

- Self-hosted Twitch + Kick alerts. Electron app runs locally, connects to Twitch EventSub, serves overlay to OBS. Zero SaaS, full quality.
- **For ZAO:** Good if Zaal ever streams on Twitch; low priority for MVP.

#### Do NOT fork:

- `ugeebee/tip-root` (AGPLv3): Full tipping backend (Go + NATS + Next.js). Overkill, and AGPLv3 complicates commercial embedding.
- `tipxmr/tipxmr` (OSS): Monero-specific, not Base/Optimism.

### 5. What's Already in ZAOOS Codebase

- **Stream.io + 100ms:** Voice/video rooms configured in community.config.ts. Audio provider = 'stream'.
- **Broadcast helpers:** src/lib/publish/broadcast.ts sends to Telegram + Discord (no web3 integration).
- **Stream utilities:** src/lib/spaces/streamHelpers.ts generates slugs, call IDs, user objects. No RTMP/overlay logic.
- **No existing:** OBS overlay, on-chain tipping, multistreaming, Restream integration, chat-pulling.

## Lean MVP: The Single Thing That Helps an Artist Stream Better This Month

### "Farcaster Chat Overlay + Support Button"

**What it is:** An OBS browser source (URL) that pulls live messages from the ZAO `/zao` Farcaster channel and displays them in a styled overlay, plus a "Support This Stream" button linking to a Farcaster Tip Jar Frame (one-click Base tips).

**Why this:** 
- Zero infrastructure (client-side React, hosted on Vercel).
- Solves the "artist wants to see community engagement during a live stream" problem.
- Ties directly to Farcaster (ZAO's native platform).
- Web3 tip button works on Base immediately (no Respect integration needed, but infrastructure is there for Phase 2).
- Zaal can stream from Mac, add one OBS browser source, and have live chat + tip button visible. Ship in 1-2 weeks.

**Scope:**
1. React component that fetches messages from `/zao` channel (Neynar API, free tier). [3 hours]
2. OBS overlay styling (transparent bg, fade animations, max 10 messages). [3 hours]
3. Farcaster Frame for Base tips (fork phessophissy/tip-jar-frames, customize to ZAO). [5 hours]
4. Vercel deploy + env setup. [1 hour]
5. Testing in OBS. [1 hour]

**Total effort:** ~13 hours solo, 1-2 weeks calendar (Zaal + 1 developer).

**Then iterate:**
- Phase 1.5: Wire Restream for multi-platform broadcast (add environment variables, test flow).
- Phase 2: Index tip events, mint Respect to tippers.
- Phase 2.5: Overlay countdown for COC Concertz ticket sales / ZAOstock RSVP countdown (fork Overlayr).
- Phase 3: Streamer.bot integration for Twitch if CoC/WaveWarZ onboards Twitch audiences.

## Sources

- **vladiantio/chat-overlay** — React Twitch/YouTube chat overlay. https://github.com/vladiantio/chat-overlay [FULL — repo README, features list, config docs]
- **bensblueprints/overlayr** — Self-hosted countdowns + alerts. https://github.com/bensblueprints/overlayr [FULL — repo README, feature matrix, cost comparison]
- **datarhei/Restreamer** — Self-hosted RTMP multistreaming. https://unsubbed.co/tools/restreamer/ [FULL — independent review 2026-05-07, cost analysis]
- **owncast/owncast** — Self-hosted Twitch-like platform. https://unsubbed.co/tools/owncast/ [FULL — independent review 2026-05-07, limitations]
- **phessophissy/tip-jar-frames** — Farcaster Frame tipping on Base. https://github.com/phessophissy/tip-jar-frames [FULL — repo README, contract source, feature set]
- **cracked.ai streaming guide** — Comparison of OBS, Owncast, Restreamer, Ant Media Server, nginx-rtmp. https://cracked.ai/guide/general/live-streaming-open-source [FULL — Feb 2026, setup walkthrough, cost math]
- **cdutson/streamerbot-alerts** — Twitch alerts via Streamer.bot WebSocket. https://github.com/cdutson/streamerbot-alerts [FULL — GPL-3.0, integration pattern]

## Also See

- [Doc 163](../163-multistreaming-platforms-integration/) — Archive: multistreaming services evaluation (Restream, StreamYard, Meld, Livepeer).
- [Doc 213](../213-spaces-streaming-architecture-debug-guide/) — Archive: Spaces + Stream.io architecture, RTMP debug notes.
- [Doc 1453](../1453-summary-livestream-command-spec-jul2026/) — Active: livestream command spec for ZOE (!summary + Bonfire episode).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve MVP scope (Farcaster chat overlay + Tip Jar Frame fork) | @Zaal | Review | 2026-07-25 |
| Fork phessophissy/tip-jar-frames to bettercallzaal/zao-streamer-kit | @Zaal | Repo setup | 2026-07-26 |
| Build Farcaster channel chat fetch (Neynar API) + OBS overlay styling | @Developer | Code | 2026-07-30 |
| Deploy to Vercel + wire env vars (NEXT_PUBLIC_NEYNAR_KEY, WALLET_CONNECT_ID) | @Zaal | Infra | 2026-08-01 |
| Test OBS browser source, collect user feedback from Zaal | @Zaal | Test | 2026-08-02 |
| Evaluate Restreamer for COC Concertz production deployment (cost/benefit decision) | @Zaal | Decision | 2026-08-07 |
| Plan Phase 2: Tip event indexing + Respect minting | @Zaal | Planning | 2026-08-15 |
