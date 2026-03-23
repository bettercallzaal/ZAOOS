# ZAO OS — Full Project Status & Roadmap

> **Date:** March 22, 2026 (updated March 23, 2026)
> **Author:** Compiled from full codebase + research library audit (91 research docs, 82 API routes, 75+ components)
>
> **March 23 Session:** 20 implementation tasks completed across Sprint 1-3 (see changelog below)

---

## Table of Contents

0. [March 23 Changelog](#0-march-23-changelog)
1. [Project Overview](#1-project-overview)
2. [What's Built (Production-Ready)](#2-whats-built-production-ready)
3. [What's In Progress](#3-whats-in-progress)
4. [What's Researched But Not Built](#4-whats-researched-but-not-built)
5. [What's Conceptual / Not Yet Researched](#5-whats-conceptual--not-yet-researched)
6. [Sprint Roadmap & Timeline](#6-sprint-roadmap--timeline)
7. [Feature-by-Feature Breakdown](#7-feature-by-feature-breakdown)
8. [Architecture & Infrastructure](#8-architecture--infrastructure)
9. [Key Decisions (Resolved)](#9-key-decisions-resolved)
10. [Key Decisions (Open)](#10-key-decisions-open)
11. [Research Library Summary](#11-research-library-summary)

---

## 0. March 23 Changelog

**20 tasks completed in a single session** across Sprint 1, 2, and 3:

### Sprint 1 — Quick Wins (All Complete)
| Task | Files Changed | Notes |
|------|--------------|-------|
| ZID badge in ProfileDrawer | `ProfileDrawer.tsx` | Gold pill badge "ZID #N" next to username |
| Missing notification triggers | — | Already existed (votes, comments, member joins) |

### Sprint 2 — Governance & Security (All Complete)
| Task | Files Changed | Notes |
|------|--------------|-------|
| Fix proposal category mismatch | `schemas.ts`, `create-proposals.sql`, `governance/page.tsx`, `ProposalsTab.tsx`, 2 test files | 7 canonical categories as single source of truth |
| Proposal status transitions | `proposals/route.ts`, `timeAgo.ts`, `governance/page.tsx`, `ProposalsTab.tsx` | Valid transitions map, countdown helpers, server-side expiry check |
| Proposal deadline countdown | Same as above | `formatTimeRemaining()` + `isDeadlinePassed()` shared helpers |
| Zero-weight vote handling | `proposals/vote/route.ts`, `governance/page.tsx`, `ProposalsTab.tsx`, test file | Warning in API + amber toast in UI |
| ProposalsTab UI overhaul | `ProposalsTab.tsx`, `proposals/route.ts` | Category badges, status filters, voting buttons, expand/collapse, comments wired in, threshold vote bar |
| Notifications RLS policy | `scripts/add-notifications-rls.sql` | Per-user SELECT/UPDATE, blocked INSERT/DELETE for anon |
| Missing rate limits | `middleware.ts` | Added wavewarz + directory (6 others already existed) |
| Fix scheduled_casts RLS | `scripts/fix-scheduled-casts-rls.sql` | Atomic swap to FID-scoped policies |
| Remove unsafe-eval from CSP | `middleware.ts` | Removed from script-src directive |
| Fix Neynar error leakage | `chat/react/route.ts` | Returns fixed 502 instead of upstream status |
| Console.log cleanup | 5 files | 7 console.log → console.info, 0 remaining |
| Airtable CSV import script | `scripts/import-fractal-history.ts`, `package.json` | 5-step idempotent import, both Fibonacci eras |
| Zod on auth/notifications routes | — | Already existed on all routes |
| @pigment-css/react CVE check | — | Not installed, no action needed |

### Sprint 3 — Engagement & Features (New)
| Task | Files Changed | Notes |
|------|--------------|-------|
| Engagement streaks system | `scripts/create-streaks-tables.sql`, `api/streaks/route.ts`, `api/streaks/record/route.ts`, `StreakBadge.tsx` | Full schema + API + flame badge component |
| Streaks in HomePage | `HomePage.tsx`, `QuickActions.tsx` | Badge in header, daily activity card, auto-login recording |
| Track of the Day | `scripts/create-track-of-day.sql`, 3 API routes, `TrackOfTheDay.tsx` | Nominate/vote/select with auto-select after 6pm EST |
| Activity feed improvements | `api/activity/feed/route.ts`, `ActivityFeed.tsx` | Added fractal + WaveWarZ sources, parallel queries, color-coded badges, clickable cards |
| OG badge for founding members | `OGBadge.tsx`, `Message.tsx`, `FollowerCard.tsx`, `ProfileDrawer.tsx`, `types/index.ts`, 3 API routes | Gold-bordered "OG" pill for ZID 1-40, server-side ZID enrichment |

### Security Audit Summary
| Finding | Severity | Status |
|---------|----------|--------|
| scheduled_casts RLS too permissive | Critical | **Fixed** |
| @pigment-css/react CVE | Critical | **Not affected** (not installed) |
| unsafe-eval in CSP | High | **Fixed** |
| Neynar error leakage | Medium | **Fixed** |
| Search wildcard injection | Medium | **Already fixed** |
| HMAC timing attack | Low | **Already fixed** |
| Zod missing on auth routes | Medium | **Already fixed** |
| Console.log in production | Medium | **Fixed** |
| Notifications RLS missing | Medium | **Fixed** |
| Missing rate limits | Medium | **Fixed** |

### New Files Created This Session
- `src/components/badges/OGBadge.tsx`
- `src/components/streaks/StreakBadge.tsx`
- `src/components/music/TrackOfTheDay.tsx`
- `src/app/api/streaks/route.ts`
- `src/app/api/streaks/record/route.ts`
- `src/app/api/music/track-of-day/route.ts`
- `src/app/api/music/track-of-day/vote/route.ts`
- `src/app/api/music/track-of-day/select/route.ts`
- `scripts/create-streaks-tables.sql`
- `scripts/create-track-of-day.sql`
- `scripts/fix-scheduled-casts-rls.sql`
- `scripts/import-fractal-history.ts`

### SQL Migrations to Run
1. `scripts/fix-scheduled-casts-rls.sql` — Fix critical RLS gap
2. `scripts/add-notifications-rls.sql` — Add notifications RLS
3. `scripts/create-streaks-tables.sql` — New streaks system
4. `scripts/create-track-of-day.sql` — New Track of the Day
5. ALTER TABLE proposals — Update category CHECK constraint to include `wavewarz`, `social`

---

## 1. Project Overview

**ZAO OS** is a gated Farcaster social client for The ZAO (ZTalent Artist Organization) — a decentralized music community with 40+ founding members and 90+ weeks of fractal governance.

**Stack:** Next.js 16 + React 19, Supabase (PostgreSQL + RLS), Neynar (Farcaster), XMTP (E2E encrypted messaging), Wagmi + Viem (blockchain), Tailwind CSS v4

**4 Pillars (visible app sections):**
1. **Social** (Artist Org) — Chat, music, social graph
2. **Governance** (Autonomous Org) — Respect, voting, roles, treasury
3. **Tools** (Operating System) — Profile, cross-post, AI agent, taste profiles
4. **Contribute** (Open Source) — GitHub, bounties, docs, fork guide

---

## 2. What's Built (Production-Ready)

### Core Platform
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Auth (Farcaster SIWF + SIWE wallet)** | 8 routes | LoginButton, WalletLoginButton | Complete |
| **Gated allowlist** | admin/allowlist | AllowlistTable, CsvUpload | Complete |
| **Session management** | iron-session, 7-day TTL | — | Complete |
| **Rate limiting** | middleware.ts | — | Complete |
| **Admin panel** | 6+ routes | AdminPanel (6 tabs) | Complete |

### Chat & Messaging
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Farcaster channel feed** | chat/messages, chat/send | ChatRoom, MessageList, Message, ComposeBar | Complete |
| **Thread replies** | chat/thread/[hash] | ThreadDrawer | Complete |
| **Reactions (like/recast)** | chat/react | — | Complete |
| **Search casts** | chat/search | SearchDialog | Complete |
| **Scheduled posts** | chat/schedule (CRUD) | SchedulePanel | Complete |
| **Feed filters (content type + sort)** | — | FeedFilters | Complete |
| **Admin hide messages** | chat/hide | HiddenMessages | Complete |
| **Mention autocomplete** | — | MentionAutocomplete | Complete |
| **XMTP encrypted DMs** | — | MessagesRoom, ConversationList, MessageThread | Complete |
| **XMTP group chats** | — | GroupInfoDrawer, NewConversationDialog | Complete |
| **Multi-wallet XMTP** | — | ConnectXMTP, useWalletXMTP | Complete |

### Music
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **8-platform player** (Spotify, SoundCloud, YouTube, Audius, Sound.xyz, Apple, Tidal, Bandcamp) | music/metadata | MusicEmbed, UniversalLinkCard, GlobalPlayer | Complete |
| **Persistent player bar** | — | PersistentPlayer, GlobalPlayer, Scrubber | Complete |
| **Music queue from feed** | — | MusicSidebar, MusicQueueTrackCard, useMusicQueue | Complete |
| **Community radio** (Audius playlists) | music/radio | RadioButton, useRadio | Complete |
| **Song submissions + voting** | music/submissions, music/submissions/vote | SongSubmit | Complete |
| **Music link resolver** | music/resolve (Songlink API) | — | Complete |
| **Music NFT discovery** | music/wallet (Sound.xyz + Zora) | — | Complete |
| **Waveform visualization** | — | WaveformPlayer | Complete |

### Social
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Followers/following** | users/[fid]/followers, users/[fid]/following | SocialPage, FollowerCard | Complete |
| **4 sort modes** (recent/popular/mutual/ZAO) | — | — | Complete |
| **Follow/unfollow** | users/follow | — | Complete |
| **User profiles** | users/[fid], users/profile | ProfileDrawer | Complete |
| **Follow suggestions** | social/suggestions | DiscoverPanel | Complete |
| **User search** | search/users | — | Complete |
| **Community graph** | social/community-graph | CommunityGraph | Complete |
| **Share to Farcaster** | — | ShareToFarcaster | Complete |

### Governance
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Proposals (CRUD)** | proposals (GET/POST/PATCH) | ProposalsTab | Complete |
| **Voting (weighted by Respect)** | proposals/vote | — | Complete |
| **Comments on proposals** | proposals/comment | ProposalComments | Complete |
| **Respect leaderboard** | respect/leaderboard | RespectLeaderboard, FractalLeaderboardTab | Complete |
| **On-chain balance sync** (OG + ZOR via multicall) | respect/sync | SyncRespectButton | Complete |
| **Member respect breakdown** | respect/member | — | Complete |
| **Fractal session recording** | respect/fractal | — | Complete |
| **Respect events** (non-fractal) | respect/event | — | Complete |

### Fractals
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Sessions list** | fractals/sessions | SessionsTab | Complete |
| **Member profile + history** | fractals/member/[wallet] | — | Complete |
| **OREC proposals proxy** | fractals/proposals | ProposalsTab | Complete |
| **Discord bot webhook** | fractals/webhook | — | Complete |
| **Fractals page (5 tabs)** | /fractals | FractalsClient (Sessions, Leaderboard, Analytics, Proposals, About) | Complete |

### Integrations
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Bluesky cross-posting** | bluesky/sync, bluesky/members, bluesky/feed | — | Complete |
| **Discord sync** | discord/sync | — | Complete |
| **WaveWarZ data sync** | wavewarz/sync, wavewarz/artists | WaveWarzPage, GeneratePostButton | Complete |
| **Neynar webhooks** | webhooks/neynar | — | Complete |
| **Push notifications** | notifications (3 routes) | NotificationBell | Complete |

### Other
| Feature | Routes | Components | Status |
|---------|--------|------------|--------|
| **Ecosystem partner page** | — | EcosystemPage | Complete |
| **Voice/video calls** (Jitsi) | — | CallsPage, JitsiRoom, ListeningRoom | Complete |
| **Listening rooms** (shared music) | — | useListeningRoom (Supabase Realtime) | Complete |
| **Contribute page** | — | ContributePage, IssueSubmitForm | Complete |
| **Settings page** | — | SettingsPage, SettingsClient | Complete |
| **Directory** | directory | — | Complete |
| **Home dashboard** | — | HomePage, NowPlayingHero, QuickActions, ActivityFeed, PillarCard | Complete |
| **Error boundaries + loading states** | — | ErrorBoundary, per-route error.tsx/loading.tsx | Complete |
| **Mini app SDK support** | miniapp/auth, miniapp/webhook | MiniAppGate, useMiniApp | Complete |
| **Image upload** | upload, admin/upload | — | Complete |
| **PostHog analytics** | — | PostHogProvider, PostHogPageview | Complete |
| **Minimax LLM proxy** | chat/minimax | — | Complete |

---

## 3. What's In Progress

### Currently Modified Files (unstaged)
- `src/app/api/discord/sync/route.ts` — Discord bot integration updates
- `src/app/api/fractals/member/[wallet]/route.ts` — Member data improvements
- `src/app/api/fractals/proposals/route.ts` — Proposal fetch refinements
- `src/app/api/fractals/sessions/route.ts` — Session tracking updates
- `src/app/api/fractals/webhook/route.ts` — Webhook handler updates
- `src/middleware.ts` — Rate limiting updates
- `research/111-proposal-ui-best-practices/` — New research doc

### Active Work Areas
| Feature | What's Done | What Remains |
|---------|-------------|--------------|
| **Fractals page polish** | 5-tab UI, API routes, search/filter, About tab | Data import from Airtable (130 members, 100+ sessions), ornode fallback (ornode is down — read directly from OREC contract) |
| **WaveWarZ social publisher** | Sync cron, artist list, random stat | Native battle display (currently iframe), proposal generation from battle stats |
| **Discord bot integration** | Webhook receiver, member sync | Full bidirectional sync, fractal session bridging |
| **Proposal UI improvements** | Research doc 111 started | Category alignment, status transitions, auto-close on deadline |

---

## 4. What's Researched But Not Built

These have detailed research docs and/or sprint plans but no code yet:

| Feature | Research Docs | Sprint | Priority |
|---------|--------------|--------|----------|
| **Hats Protocol roles** | Docs 23, 31 | Sprint 5 (Q3 2026) | Medium |
| **Community treasury** (Safe multisig) | Doc 31 | Sprint 5 (Q3 2026) | Medium |
| **AI agent** (ElizaOS + Claude + pgvector) | Docs 24, 26, 08 | Sprint 6 (Q4 2026) | Medium |
| **Engagement streaks & badges** | — | Sprint 3 | High |
| **Track of the Day** | — | Sprint 3 | High |
| **AI moderation** | — | Sprint 4 | Medium |
| **Full-text search** | — | Sprint 4 | Medium |
| **Music approval queue** | — | Sprint 4 | Low |
| **Cross-platform publishing** (Lens, Bluesky native, Nostr, X, Hive) | Docs 28, 36, 77, 96 | Sprint 7 (2027) | Low |
| **Nouns Builder / ZABAL integration** | — | Sprint 8 | Low |
| **Taste profiles** (AI music preference) | — | Future | Low |
| **EAS attestations** | — | Deferred | Low |
| **Redis rate limiting** | — | Sprint 2 | High |
| **Sync licensing collective** | Doc 100 | Future | Low |

---

## 5. What's Conceptual / Not Yet Researched

| Idea | Notes |
|------|-------|
| **ZAO OS as fractal session host** | Currently Discord-only; long-term goal to run sessions in-app |
| **On-chain proposal execution** | Proposals exist but don't trigger treasury actions |
| **Member reputation decay** | Research says NO decay — Respect accumulates permanently |
| **PWA / native mobile app** | Research doc 33 covers PWA → Capacitor → React Native path |
| **Live streaming integration** | LiveKit researched (Doc 43) but not in sprint plan |
| **Token-gated content** | Beyond current allowlist gating |
| **Multi-community federation** | Fork model exists but no federation protocol |

---

## 6. Sprint Roadmap & Timeline

> **Feature checklist with status is tracked in the root [README.md](../README.md).**
> Detailed execution plans are in `docs/superpowers/plans/`.

```
                        2026                                    2027
         Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec    Jan+
         ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────
Sprint 1 │██████│      │      │      │      │      │      │      │      │      │
  Quick  │1-2d  │      │      │      │      │      │      │      │      │      │
  Wins   │      │      │      │      │      │      │      │      │      │      │
         │      │      │      │      │      │      │      │      │      │      │
Sprint 2 │██████│██████│      │      │      │      │      │      │      │      │
  Govern │1-2wk │      │      │      │      │      │      │      │      │      │
         │      │      │      │      │      │      │      │      │      │      │
Sprint 3 │      │██████│██████│      │      │      │      │      │      │      │
  Engage │      │1-2wk │      │      │      │      │      │      │      │      │
         │      │      │      │      │      │      │      │      │      │      │
Sprint 4 │      │      │██████│██████│      │      │      │      │      │      │
  Mod/   │      │      │1-2wk │      │      │      │      │      │      │      │
  Search │      │      │      │      │      │      │      │      │      │      │
         │      │      │      │      │      │      │      │      │      │      │
Sprint 5 │      │      │      │      │██████│██████│██████│      │      │      │
  Hats + │      │      │      │      │    2-3 weeks     │      │      │      │
  Treas. │      │      │      │      │      │      │      │      │      │      │
         │      │      │      │      │      │      │      │      │      │      │
Sprint 6 │      │      │      │      │      │      │██████│██████│██████│██████│
  AI     │      │      │      │      │      │      │        3-4 weeks        │
  Agent  │      │      │      │      │      │      │      │      │      │      │
         │      │      │      │      │      │      │      │      │      │      │
Sprint 7 │      │      │      │      │      │      │      │      │      │      │██████
  Cross- │      │      │      │      │      │      │      │      │      │      │ ongoing
  Plat.  │      │      │      │      │      │      │      │      │      │      │
         └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────
```

See the root [README.md](../README.md) for the complete feature checklist with code primitives.
See `docs/superpowers/plans/` for detailed sprint execution plans.

---

## 8. Architecture & Infrastructure

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.0 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | v4 |
| Database | Supabase (PostgreSQL + RLS) | 2.99.1 |
| Auth | iron-session | 8.0.4 |
| Farcaster | Neynar SDK | 3.137.0 |
| Messaging | XMTP Browser SDK | 7.0.0 |
| Blockchain | Wagmi + Viem | 2.19.5 / 2.47.2 |
| Wallet UI | RainbowKit | 2.2.10 |
| Validation | Zod | 4.3.6 |
| Testing | Vitest | 3.2.4 |
| Audio | Wavesurfer.js | 7.12.4 |
| State | React Query | 5.90.21 |
| Analytics | PostHog + Vercel Analytics | — |
| Error tracking | Sentry | — |
| Video calls | Jitsi React SDK | — |
| Solana | Solana wallet adapter | — |

### Key Files
| File | Purpose |
|------|---------|
| `community.config.ts` | All branding, channels, admin FIDs, contracts, nav — fork this to rebrand |
| `src/middleware.ts` | Rate limiting, CORS headers |
| `src/lib/auth/session.ts` | iron-session config |
| `src/lib/db/supabase.ts` | Supabase client (service + anon) |
| `src/lib/farcaster/neynar.ts` | Neynar SDK wrapper |
| `src/lib/env.ts` | Centralized env var validation |
| `src/contexts/XMTPContext.tsx` | 500+ line XMTP state management |
| `src/providers/audio/` | 8 audio platform providers |

### Database Tables (Known)
- `users`, `allowlist`, `respect_members`, `fractal_sessions`, `fractal_scores`
- `respect_events`, `proposals`, `proposal_votes`, `proposal_comments`
- `notifications`, `notification_tokens`, `hidden_messages`
- `music_submissions`, `music_link_cache`, `song_votes`
- `security_audit_log`, `scheduled_casts`
- `bluesky_members`, `bluesky_feed_posts`
- `wavewarz_artists`, `wavewarz_battles`

### Blockchain Contracts
| Contract | Chain | Address |
|----------|-------|---------|
| OG Respect (ERC-20) | Optimism | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| ZOR Respect (ERC-1155) | Optimism | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Hats Protocol | Optimism | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` |
| Multicall3 | Optimism | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| ZOUNZ Token | Base | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` |

---

## 9. Key Decisions (Resolved)

| Decision | Choice | Why |
|----------|--------|-----|
| Agent framework | ElizaOS | Has Farcaster + XMTP plugins |
| Agent memory | pgvector in Supabase | No extra infra, already using Supabase |
| Cross-platform publishing | Custom integrations | Ayrshare too expensive, control needed |
| On-chain attestation (EAS) | Deferred | Focus on Respect + governance first |
| Non-crypto login (Privy) | No — wallet required | ZAO is for token holders |
| Redis rate limiting | Yes, add it | Replace in-memory limiter |
| Respect decay | No decay | Respect accumulates permanently |
| Respect tiers | No tiers | Just raw balance |
| Decent DAO vs Custom Hats | TBD before Sprint 5 | Needs evaluation |

---

## 10. Key Decisions (Open)

| Decision | Options | Deadline |
|----------|---------|----------|
| Decent DAO vs custom Hats tree | Decent (turnkey) vs custom (flexible) | Before Sprint 5 (Q3 2026) |
| Treasury structure | Safe 3-of-5 vs Hats-gated | Before Sprint 5 |
| Fractal hosting platform | Discord-only vs ZAO OS hybrid | No deadline |
| Mobile app approach | PWA vs Capacitor vs React Native | Future |
| Live audio provider | LiveKit vs Daily vs 100ms | Future |
| Federation protocol | Forkable-only vs federated | Future |

---

## 11. Research Library Summary

**91 research documents** organized by topic:

| Category | Docs | Key Docs |
|----------|------|----------|
| Farcaster Protocol | 8 | 01, 02, 17, 19, 21, 22, 34, 73 |
| Music & Artist Revenue | 7 | 03, 04, 29, 37, 43, 80, 88 |
| Community & Social | 7 | 12, 13, 20, 32, 35, 47, 48 |
| Identity & Governance | 11 | 05, 07, 23, 31, 56, 58, 102-109 |
| AI Agent & Intelligence | 3 | 24, 26, 08 |
| Cross-Platform Publishing | 5 | 28, 36, 77, 96 |
| Technical Infrastructure | 6 | 14, 16, 33, 41, 42, 93 |
| WaveWarZ | 5 | 95-101 |
| Security & Code Quality | 5 | 18, 38, 40, 57, 66 |
| Dev Workflows & AI Tooling | 11 | 44-46, 54, 62-65, 67-73, 76, 81-85 |
| Documentation & Presentation | 4 | 39, 50, 51, 52 |
| Reference & Internal | 4 | 11, 27, 30, 50 |

**Canonical references:**
- `research/50-the-zao-complete-guide/` — ecosystem overview
- `research/51-zao-whitepaper-2026/` — Draft 4.5 whitepaper
- `research/113-zao-fractal-bot-process/` — fractal governance process
- `research/101-wavewarz-zao-whitepaper/` — WaveWarZ integration strategy

---

## Stats Summary

| Metric | Count |
|--------|-------|
| API routes | 82 |
| Components | 75+ |
| Hooks | 11 |
| Lib modules | 21+ subdirectories |
| Type files | 3 |
| Research docs | 91 |
| Sprint plans | 8 |
| Farcaster channels | 4 |
| Audio platforms | 8 |
| Ecosystem partners | 7 |
| Blockchain contracts | 5 |
| Community members | 40+ founding, 130+ total tracked |
| Fractal sessions | 90+ weeks |
| Git commits | 400+ |
| TODO/FIXME in code | 0 |
