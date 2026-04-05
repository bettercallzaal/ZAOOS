# 157 — Cross-Project Asset Audit: Reusable Code from Sibling ZAO Projects

> **Status:** Research complete
> **Date:** 2026-03-27
> **Goal:** Catalog all reusable code, patterns, and components from Zaal's 15+ sibling projects that can be integrated into ZAO OS V1

---

## Key Decisions / Recommendations

| Priority | Source Project | Asset to Port | ZAO OS Gap It Fills | Effort |
|----------|---------------|---------------|---------------------|--------|
| **P0** | ZAOUNZ | `useAudius.ts` hook (trending, underground, search, streaming) | No Audius SDK hooks yet — only URL detection in `isMusicUrl.ts` | 1 day |
| **P0** | ZAOUNZ | HuggingFace ACE-Step music generation route | No AI music generation — referenced in research but not built | 2 days |
| **P0** | ZAOUNZ | Farcaster Mini App provider + wallet provider patterns | ZAO OS has `useMiniApp` + `MiniAppGate` but ZAOUNZ has cleaner Wagmi 3.5 setup | 1 day |
| **P1** | ZAOMusicBot | Audius service (`services/audius.js`) — playlist resolution, track search | Bot has artist/playlist/track resolution ZAO OS lacks | 1 day |
| **P1** | ZAOMusicBot | Audio filter definitions (bass boost, nightcore, vaporwave, etc.) | ZAO OS player has no EQ/filter system | 2 days |
| **P1** | fractalbotmarch2026 | Fractal governance bot webhook events + voting flow | Doc 114 maps this; bot code is the implementation reference | 2 days |
| **P2** | ZAOVideoEditor | NLP metadata generation (`metadata_gen.py`) — TF-IDF, entity extraction | Could auto-generate cast descriptions, hashtags without LLM calls | 3 days |
| **P2** | Aurdour | WaveSurfer.js waveform visualization + DJ mixing UI | ZAO OS player has no waveform visualization | 3 days |
| **P2** | WWMiniapp | Solana wallet adapters + real-time WebSocket patterns | ZAO OS is EVM-only; Solana needed for WaveWarZ | 3 days |
| **P3** | ZAO Leaderboard | Embeddable leaderboard (`/embed` route with iframe headers) | ZAO OS leaderboard exists but isn't embeddable | 1 day |
| **P3** | NEXUS V2 | Links data hierarchy (100+ ZAO ecosystem resources) | Could power a "Resources" or "Nexus" tab in ZAO OS | 1 day |
| **P3** | COCConcertZ | Farcaster Mini App meta tag pattern + JSON-LD structured data | ZAO OS has miniapp but COCConcertZ has cleaner `fc:miniapp` meta | 0.5 day |
| **P3** | ZABALNewsletterBot | Multi-platform content distribution (X/Farcaster/Telegram/Discord) | ZAO OS has cross-posting to Farcaster/Bluesky/X — bot adds Telegram + Discord | 2 days |

---

## Project-by-Project Breakdown

### 1. ZAOUNZ (Farcaster Mini App for Music NFTs) — HIGHEST VALUE

**Path:** `/Users/zaalpanthaki/Documents/ZAOUNZ/`
**Stack:** React 19, Vite 7, Tailwind CSS 4, Wagmi 3.5, Farcaster Frame SDK, Audius SDK, Zora Coins SDK, Pinata

Key files: `src/hooks/useAudius.ts`, `server/routes/generate.ts`, `server/routes/upload.ts`, `src/views/Mint.tsx`, `src/views/Discover.tsx`, `src/providers/FarcasterProvider.tsx`, `src/providers/WalletProvider.tsx`

### 2. ZAOMusicBot (Discord Music Bot + Playlist Web UI) — HIGH VALUE

**Path:** `/Users/zaalpanthaki/Documents/ZAOMusicBot/`
**Stack:** discord.js v14, Lavalink 4.2.2, Next.js 15, Express

Key files: `bot/src/services/audius.js`, `bot/src/commands/filter.js`, `bot/src/commands/radio.js`, `bot/src/commands/lofi.js`, `bot/src/utils/djPerms.js`

### 3. ZAO Leaderboard — LOW VALUE (ALREADY SUPERSEDED)

ZAO OS's `src/lib/respect/leaderboard.ts` uses Viem multicall (better than ethers.js + Airtable). Only reusable piece: the `/embed` route pattern.

### 4. ZAO NEXUS V2 — LOW-MEDIUM VALUE

`src/linksData.js` has 100+ curated ZAO ecosystem links with categories and tags.

### 5. ZAOVideoEditor — MEDIUM VALUE (PATTERNS)

NLP metadata generator (`backend/services/metadata_gen.py`) — TF-IDF + entity extraction without external APIs.

### 6. Other Documents Projects

**High:** Zabal Squares (Base USDC payments), WWMiniapp (Solana + Audius + WebSockets), fractalbotmarch2026 (fractal voting)
**Medium:** Aurdour (WaveSurfer.js), BandZBuilds (Prisma + NextAuth), ZABALNewsletterBot (multi-platform distribution)
**Low:** COCConcertZ, BetterCallZaal, textsplitter, FarmDrop, zski, PDF BUILDER

---

## Implementation Status

### Phase 1: Quick Wins (DONE)
- [x] Ported `useAudius.ts` from ZAOUNZ to `src/hooks/useAudius.ts` (react-query)
- [x] Ported AI music generation to `/api/music/generate/route.ts`
- [x] Added embeddable leaderboard at `/api/respect/leaderboard/embed/route.ts`

### Phase 2: Next Up
- [ ] Port Audius service from ZAOMusicBot (playlist/artist resolution)
- [ ] Port audio filter presets as Web Audio API nodes
- [ ] Fractal bot webhook integration

---

## Sources

All paths verified against local filesystem as of 2026-03-27. Cross-referenced with existing research: docs 112, 114, 128, 130, 155.
