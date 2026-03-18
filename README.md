<div align="center">

# 🎵 ZAO OS

**Where music artists build onchain**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Farcaster](https://img.shields.io/badge/Built_on-Farcaster-8B5CF6)](https://farcaster.xyz)
[![XMTP](https://img.shields.io/badge/XMTP-Encrypted_DMs-FC4F37)](https://xmtp.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Live App](https://zaoos.com) · [Research Library](./research/) · [Report Bug](https://github.com/bettercallzaal/zaoos/issues) · [Discord](https://discord.thezao.com)

</div>

---

ZAO OS is a gated, music-first social platform for **The ZAO** — a decentralized music community where artists keep their revenue, curators earn reputation, and the community governs itself. Built on [Farcaster](https://farcaster.xyz) with encrypted messaging via [XMTP](https://xmtp.org), on-chain respect via [ORDAO](https://zao.frapps.xyz/), and inline music from 6 platforms.

> **Not a member yet?** Join the community at [discord.thezao.com](https://discord.thezao.com), participate in fractal calls, and earn your ZAO to unlock access.

---

## What's Built

### Community & Chat
- 🔐 **Gated access** — wallet + Farcaster allowlist
- 💬 **Discord-style chat** on 4 Farcaster channels (#zao, #zabal, #cocconcertz, #wavewarz)
- 🔒 **Encrypted DMs & groups** via XMTP (wallet-based identity)
- 📜 **Infinite scroll** with cursor-based pagination
- ✍️ **Rich compose** — replies, quotes, cross-posting, scheduling, image uploads, @mentions
- 🔍 **Search** across all casts
- 🧵 **Thread drawer** for conversation replies

### Music
- 🎵 **Inline players** for Spotify, SoundCloud, Audius, YouTube, Sound.xyz, direct audio
- 📻 **Community radio** with queue and continuous playback
- 🎤 **Song submissions** for community curation

### Governance & Respect
- ⭐ **On-chain Respect** — OG Respect (ERC-20) + ZOR (ERC-1155) on Optimism
- 📊 **Leaderboard** with on-chain balance sync
- 🗳️ **Proposals** — create, vote (respect-weighted), comment
- ⏰ **Deadline countdown** + auto-close expired proposals
- 🛡️ **Admin status controls** — approve/reject/complete proposals

### Notifications
- 🔔 **Real-time** via Supabase Realtime (polling fallback)
- 📱 **Push notifications** via Farcaster Mini App protocol
- 📄 **Full notifications page** with all/unread filter
- **Triggers** for: posts, reactions, proposals, votes, comments, new members

### Social
- 👥 **Followers/Following** with sort and search
- 🌐 **Community graph** discovery
- 🏷️ **ZID** membership numbers

### Admin Panel
- 👤 **Users** — manage roles, wallets, FIDs
- 🏷️ **ZIDs** — assign membership numbers based on respect
- 👥 **Allowlist** — Farcaster search, CSV import, wallet badges (Primary, Farcaster, Verified, ZAO)
- 🏅 **Respect** — overview dashboard, on-chain sync, Airtable import
- 🛡️ **Moderation** — hidden messages
- 📄 **Import** — bulk CSV upload

### Security (21 fixes shipped)
- Zod validation on all API routes
- Server-side nonce validation (SIWF + SIWE)
- HMAC-SHA512 webhook verification (timing-safe)
- Rate limiting on all route families
- Signer ownership verification
- Search wildcard injection prevention
- Error message sanitization
- React Error Boundaries
- Content Security Policy headers
- RLS on all database tables

---

## Architecture

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4 (navy `#0a1628`, gold `#f5a623`) |
| **Auth** | Sign In With Farcaster + SIWE + iron-session (7-day TTL) |
| **Social** | Neynar API (Farcaster) + XMTP Browser SDK v7 (wallet-based) |
| **Database** | Supabase PostgreSQL + Realtime |
| **Respect** | ORDAO on Optimism (OG ERC-20 + ZOR ERC-1155) |
| **Validation** | Zod on every API route |
| **Music** | Audius API, Spotify/SoundCloud/YouTube embeds |
| **Deployment** | Vercel |

---

## Quick Start

```bash
git clone https://github.com/bettercallzaal/zaoos.git
cd zaoos
npm install
cp .env.example .env.local
# Fill in env vars (see .env.example for details)
npm run dev
```

### Database Setup

Run in Supabase SQL Editor (in order):
```
scripts/setup-database.sql
scripts/create-users-table.sql
scripts/add-channel-casts-table.sql
scripts/create-proposals.sql
scripts/create-notifications.sql
scripts/create-respect-tables.sql
```

### Configuration

All community branding, channels, contracts, and admin FIDs are in `community.config.ts`. Change this file to fork for a different community.

---

## Research Library

> **58 research documents** covering every aspect of building a decentralized music platform.

Start with:
- [research/50 — The ZAO Complete Guide](./research/50-the-zao-complete-guide/) — canonical reference
- [research/51 — ZAO Whitepaper 2026](./research/51-zao-whitepaper-2026/) — Draft 4.5
- [research/56 — ORDAO Respect System](./research/56-ordao-respect-system/) — on-chain governance
- [research/README.md](./research/) — full index

---

## Roadmap

| Sprint | What | Status |
|--------|------|--------|
| **1** | Security fixes, feed pagination, Realtime notifications, proposal comments | ✅ Done |
| **2** | Governance fixes, respect DB, admin tools, deadline countdown | ✅ Done |
| **3** | Engagement streaks, OG badges, Track of the Day | 📋 Planned |
| **4** | Moderation queue, full-text search, music approval | 📋 Planned |
| **5** | Hats Protocol + Safe treasury on Optimism | 📋 Planned |
| **6** | AI Agent (ElizaOS) — welcome DMs, music recs | 📋 Planned |
| **7** | Cross-platform publishing (Lens, Bluesky, Nostr) | 📋 Planned |

---

## Contributing

ZAO OS is open source. Fork it, build on it, make it yours.

- [GitHub Issues](https://github.com/bettercallzaal/zaoos/issues) — bugs and feature requests
- [Research Library](./research/) — 58 docs of context
- [QA Test Bench](./docs/QA-TEST-BENCH.md) — detailed test checklist

---

## Community

- **App:** [zaoos.com](https://zaoos.com)
- **Farcaster:** [/zao channel](https://farcaster.xyz/~/channel/zao)
- **Discord:** [discord.thezao.com](https://discord.thezao.com)
- **ORDAO:** [zao.frapps.xyz](https://zao.frapps.xyz/)
- **Builder:** [@zaal](https://farcaster.xyz/zaal)

---

<div align="center">

**Built in public by [The ZAO](https://zaoos.com) · Powered by [Farcaster](https://farcaster.xyz) · Research-first development**

</div>
