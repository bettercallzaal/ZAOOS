# 30 — bettercallzaal GitHub Projects Inventory

> **Status:** Research complete
> **Source:** github.com/bettercallzaal (65 public repos)
> **Goal:** Map all existing projects, identify reusable code and patterns for ZAO OS
> **Date:** March 2026

---

## Profile Summary

- **Repos:** 65 public
- **Account created:** January 7, 2025 (~14 months, ~1 new repo every 6 days)
- **Primary languages:** TypeScript (43 repos), Python (11), JavaScript, HTML
- **Core framework:** Next.js (versions 14-16)
- **Deployment:** Vercel (nearly everything)
- **Database:** Supabase (primary), Vercel Postgres, Airtable
- **Activity:** 93 push events in recent window — very active

---

## Tier 1: ZAO Ecosystem Core

### ZAOOS — The Main Project
- **Stack:** Next.js, React, TypeScript, Tailwind, Supabase, Neynar
- **What:** Music-first gated Farcaster client. Discord-style chat, inline music players, quote casts, reactions, music queue sidebar
- **Status:** Active primary project (pushed today)

### ZOUNZ — Farcaster Music NFT Mini App
- **Stack:** React 19, Vite, Express, mint.club API, Farcaster SDK
- **What:** AI music generation, Audius discovery, Zora NFT minting on Base, Attention Markets on Solana
- **ZAO OS use:** Could be embedded as a mini app for music NFT minting

### zaomusicbot — Discord Music Bot
- **Stack:** discord.js v14, Lavalink 4.2.2, Next.js (playlist UI)
- **What:** Full-featured bot supporting YouTube, Spotify, SoundCloud, Audius, Bandcamp, Twitch, Vimeo. Audio filters, radio mode, lofi mode, DAVE E2EE
- **Stars:** 1 (only starred repo!)
- **ZAO OS use:** Multi-platform music search + queue management patterns directly reusable. Audius integration code extractable.

### ZAO-Leaderboard — Respect Token Leaderboard
- **Stack:** Next.js 14, TypeScript, Tailwind, ethers.js v6, Airtable API, Alchemy RPC
- **What:** Real-time leaderboard tracking ERC-20 + ERC-1155 Respect tokens on Optimism. Maps wallets to identities via Airtable.
- **ZAO OS use:** Embeddable as a page/sidebar. Onchain balance checking pattern directly applicable.

### zao-stock — ZAO-Stock Event Platform
- **Stack:** Next.js 16, React 19, TypeScript, Tailwind, Supabase, Neynar
- **What:** Mobile-first event platform for ZAO-Stock music gathering (October 3, Ellsworth Maine). Farcaster-native.
- **ZAO OS use:** Event coordination features, same tech stack.

### CoCConcertZ — Metaverse Concert Mini App
- **Stack:** HTML/CSS/JS, Farcaster Mini App SDK
- **What:** Landing page + Mini App for COC Concertz (live metaverse concerts in StiloWorld/Spatial.io). Twitch streaming, YouTube embeds, RSVP system.
- **ZAO OS use:** Reference for Farcaster Mini App patterns (manifest, SDK ready/context, composeCast).

### ZAO-Video-Editor — Content Processing Tool
- **Stack:** Python, faster-whisper, WhisperX, stable-ts, pyannote, ffmpeg, React frontend
- **What:** Local-first video editor for podcasts/livestreams. Transcription, speaker diarization, caption burning, highlight detection, vertical clip export, YouTube SEO.
- **ZAO OS use:** Content creation pipeline for community recordings.

### ZAONEXUS — Links Hub
- **Stack:** Next.js 14, React, TypeScript, Tailwind
- **What:** Curated link directory (200+ resources) for ZAO ecosystem.

---

## Tier 2: NEXUS Series (Token-Gated Portal — 20+ iterations)

**NEXUSV1 through NEXUSV5.8.5** (20 repos, June-July 2025)

- **What:** ZAO Nexus portal with 5000+ curated links, wallet connection, multi-chain token gating ($ZAO on Optimism, $LOANZ on Base), AI features, fuzzy search (Fuse.js)
- **Stack:** Next.js 14, TypeScript, Tailwind, Radix UI, Zustand, ethers.js, Fuse.js
- **Key patterns:**
  - Multi-chain token balance checking
  - Virtualized lists for 5000+ items
  - State persistence with Zustand
  - Mobile-optimized filtering
- **ZAO OS use:** Token gating logic directly applicable. ethers.js multi-chain balance checking reusable.

---

## Tier 3: AI Agents & Bots

### zabalbot — ZABAL Coordination Agent
- **Stack:** ElizaOS v1.7.2, TypeScript, discord.js, DexScreener, Neynar
- **What:** Discord bot + web chat. Token tracking, Empire Builder game, Farcaster monitoring, community recaps, cross-platform activity.
- **Vision:** Unified livestream community hub bridging den.show, X Spaces, YouTube Live, Farcaster, Discord
- **ZAO OS use:** HIGH — ElizaOS agent patterns, Farcaster monitoring via Neynar, cross-platform bridging all applicable to ZAO agent.

### WARZAI — WaveWarZ AI Bot
- **Stack:** ElizaOS, OpenAI, discord.js, Helius API
- **What:** ElizaOS agent for WaveWarZ (live-traded music-battle arena on Solana). Shows Solana onchain integration.

### eliza1 — ElizaOS Fork
- **What:** Fork of elizaOS/eliza. Foundation for zabalbot and WARZAI.

### zaloraV1 — Zalora Character Agent
- **What:** ElizaOS agent with custom character ("Zalora"). Character-based AI experimentation.

### ZAIV1, ZAIV2 — ZAO AI Assistants
- **What:** AI assistants for ZAO ecosystem (July 2025).

---

## Tier 4: Fractal Governance Bots (Critical for ZAO)

**7 repos:** fractalbotV3June2025, fractalbotnov2025, fractalbotdec2025, fractalbotv1old, fractalbotfeb2026, fractalbotmarch2026, ZAO-FRACTAL-BOTV2

- **Stack:** Python, discord.py, ethers (onchain submission)
- **What:** Discord bots running ZAO Fractal — a fractal democracy system:
  - Meeting setup and group randomization
  - Timed presentations
  - Structured multi-round voting
  - **Onchain Respect token submission on Optimism**
  - Governance proposals with Respect-weighted voting
  - ENS resolution
  - Leaderboards
- **Monthly iterations** show active governance use
- **ZAO OS use:** VERY HIGH — this IS the governance backbone of ZAO. Fractal voting + Respect mechanics are core to ZAO OS's community layer. Should be ported to web UI.

---

## Tier 5: Community & Content Tools

### zabalnewsletter — Newsletter Bot
- **Stack:** Python, OpenAI API
- **What:** Automated daily newsletter + social content generator. Outputs for Twitter/X, Farcaster, Telegram, Discord, TikTok, YouTube.
- **ZAO OS use:** Cross-platform content generation patterns.

### zabalartsubmission — ZABAL Live Hub
- **Stack:** HTML/JS, Supabase, Farcaster Auth Kit
- **What:** Farcaster miniapp for community voting on stream direction. Real-time vote counts, friend tagging, Farcaster sharing.

### ethboulderjournal — Knowledge Graph Explorer
- **Stack:** Next.js, Sigma.js, D3, Supabase, x402 protocol
- **What:** Interactive force-directed knowledge graph for ETH Boulder 2026. AI-generated blog posts, x402 micropayments, data room marketplace.
- **ZAO OS use:** Knowledge graph and x402 micropayment patterns for future phases.

### zabalsocials — Social Links Hub
- **Stack:** JavaScript
- **What:** Centralized hub for all social links across Zaal ecosystem.

---

## Tier 6: Music & Creative Tools

### Aurdour — Browser DJ Platform
- **Stack:** Vanilla JS, WaveSurfer.js, Web Audio API, Audius API
- **What:** Full browser DJ platform. Two decks, waveforms, effects rack, stem separation, Audius integration, Flow Mode auto-DJ, MIDI support, recording, PWA.
- **ZAO OS use:** Music playback and Audius integration patterns. Could complement ZAO OS music features.

### SidebySidev2 — ZAO Cypher Visualizer
- **Stack:** Next.js 14, WaveSurfer.js, ethers.js, Supabase Realtime, Farcaster Auth Kit, PostHog
- **What:** Farcaster Mini App for ZAO Cypher track. Audio waveform visualization, token-gated playback ($ZAO), timestamp comments, wallet connection, share to Farcaster.
- **ZAO OS use:** Token-gated music content pattern + waveform visualization directly applicable.

---

## Tier 7: Client & Community Websites

| Repo | What |
|------|------|
| **cedartide** | Stonework business website (Next.js 14, Tailwind) |
| **16statestreet** | Makerspace platform for Ellsworth, Maine |
| **farmdrop** | Online farmers market (65+ farmers, 1000+ customers, 6 regional hubs) |
| **bettercallzaal-coding-hub** | Personal project hub aggregating all 71 projects |
| **zski** | Ski trip photo app (Next.js 16, Vercel Blob, Leaflet) |
| **CustomPDFCreator** | PDF generation tool |
| **RESUMEV1** | Online resume |

---

## Starred Repos (Key Interests)

| Repo | Relevance to ZAO |
|------|------------------|
| **farcasterorg/hypersnap** | Farcaster Snapchain (protocol) |
| **builders-garden/farclaw** | Farcaster developer tool |
| **QuilibriumNetwork/klearu** | E2EE ML (Quilibrium — planned integration) |
| **elizaOS agents** (agency-agents, agency-os) | AI agent frameworks |
| **atenger/gmfc101** | RAG-based Farcaster podcast Q&A bot |
| **RegenHub-Boulder/schellingpointapp-new** | Fractal governance tooling |
| **ourzora/nouns-protocol** | NFT protocol |
| **spotify2tidal/spotify_to_tidal** | Music platform migration |
| **thedotmack/claude-mem** | Claude Code memory plugin |
| **public-apis/public-apis** | API discovery |
| **latentcollapse/Tether** | LLM-to-LLM messaging |

---

## Key Patterns to Extract for ZAO OS

### 1. Multi-Chain Token Gating (from NEXUS series)
```
ethers.js → Alchemy RPC → check $ZAO balance on Optimism
                         → check $LOANZ balance on Base
                         → gate access based on combined holdings
```

### 2. Fractal Governance (from fractalbot series)
```
Random group assignment → Timed presentations → Multi-round voting
→ Respect token distribution → Onchain submission (Optimism)
→ Respect-weighted governance proposals
```

### 3. ElizaOS Agent (from zabalbot)
```
ElizaOS v1.7.2 → Discord + Web Chat
→ Farcaster monitoring (Neynar)
→ Token tracking (DexScreener)
→ Cross-platform bridging (den.show, X Spaces, YouTube, Farcaster)
```

### 4. Music Playback (from zaomusicbot + Aurdour)
```
Lavalink → Multi-platform search (YouTube, Spotify, SoundCloud, Audius, Bandcamp)
→ Queue management → Audio filters → Radio/lofi modes
WaveSurfer.js → Waveform visualization → Token-gated playback
```

### 5. Farcaster Mini App (from CoCConcertZ + SidebySidev2)
```
.well-known/farcaster.json manifest → SDK ready/context
→ composeCast() → Share to Farcaster
→ Token-gated content → Wallet connection
```

---

## Projects That Should Be Integrated Into ZAO OS

| Priority | Project | What to Extract |
|----------|---------|----------------|
| **1** | ZAO-Leaderboard | Respect token onchain balance UI |
| **2** | zaomusicbot | Audius API integration, multi-platform music search |
| **3** | fractalbot (latest) | Fractal governance web UI, Respect-weighted voting |
| **4** | zabalbot | ElizaOS agent patterns for ZAO agent |
| **5** | SidebySidev2 | Token-gated music + WaveSurfer.js waveforms |
| **6** | NEXUS series | Multi-chain token balance checking |
| **7** | CoCConcertZ | Mini App SDK patterns |
| **8** | ZOUNZ | Music NFT minting from Farcaster |
| **9** | Aurdour | DJ platform Audius patterns |
| **10** | ZAO-Video-Editor | Content processing pipeline |

---

## Developer Profile Summary

- **Build velocity:** ~1 new repo every 6 days for 14 months
- **Style:** Rapid iterative prototyping (version-per-repo)
- **Strengths:** Next.js/TypeScript, Farcaster integration, ElizaOS agents, music tech, community governance
- **Web3 experience:** Optimism, Base, Solana, ethers.js, token gating, onchain governance
- **AI experience:** 3 ElizaOS agent implementations, OpenAI API, RAG patterns
- **Music tech:** WaveSurfer.js, Lavalink, Audius API, Web Audio API, stem separation
- **Community focus:** Fractal democracy, Respect tokens, event platforms, newsletter automation
- **Local roots:** Ellsworth, Maine (16statestreet, farmdrop, zao-stock)

---

## Dual Ecosystem

| Ecosystem | Focus | Key Projects |
|-----------|-------|-------------|
| **ZAO** | Music DAO, Farcaster, fractal governance, Respect tokens | ZAOOS, ZAO-Leaderboard, fractalbot series, SidebySidev2, zao-stock |
| **ZABAL** | Livestreaming, den.show, WaveWarZ, Empire Builder | zabalbot, WARZAI, zabalnewsletter, zabalartsubmission |

Both ecosystems share: ElizaOS agents, Farcaster integration, community governance, music focus.

---

## Sources

- [github.com/bettercallzaal](https://github.com/bettercallzaal)
- All 65 public repositories analyzed
