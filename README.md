<div align="center">

# ZAO OS

**A gated, music-first Farcaster social client. Fork it, make it yours.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Farcaster](https://img.shields.io/badge/Built_on-Farcaster-8B5CF6)](https://farcaster.xyz)
[![XMTP](https://img.shields.io/badge/XMTP-Encrypted_DMs-FC4F37)](https://xmtp.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Live App](https://zaoos.com) · [Research Library](./research/) · [Report Bug](https://github.com/bettercallzaal/zaoos/issues) · [Discord](https://discord.thezao.com)

</div>

---

ZAO OS is a gated social platform for **The ZAO** — a decentralized music community where artists keep their revenue, curators earn reputation, and the community governs itself. Built on [Farcaster](https://farcaster.xyz) with encrypted messaging via [XMTP](https://xmtp.org), on-chain governance via [ORDAO](https://zao.frapps.xyz/), and inline music from 8 platforms.

**Forking?** Everything community-specific lives in [`community.config.ts`](./community.config.ts) — branding, channels, contracts, admin FIDs, nav structure. Change that one file and you have your own gated community.

---

## Quick Start

```bash
git clone https://github.com/bettercallzaal/zaoos.git
cd zaoos
npm install
cp .env.example .env.local    # fill in env vars
npm run dev                    # starts on localhost:3000
```

**Database:** Run these SQL scripts in Supabase SQL Editor (in order):

```
scripts/setup-database.sql
scripts/create-users-table.sql
scripts/add-channel-casts-table.sql
scripts/create-proposals.sql
scripts/create-notifications.sql
scripts/create-respect-tables.sql
scripts/create-streaks-tables.sql
scripts/create-track-of-day.sql
scripts/fix-scheduled-casts-rls.sql
scripts/add-notifications-rls.sql
```

**App wallet:** Generate a dedicated signing wallet (never use personal keys):

```bash
npx tsx scripts/generate-wallet.ts
```

See `.env.example` for all required environment variables.

---

## Feature Checklist

> Every feature with a checked box is built and working. Unchecked = planned.
> **Code primitives** are listed under each feature so forkers know exactly what to grab.

### Platform Core

- [x] **Sign In With Farcaster (SIWF)** — Neynar managed signers, EIP-712 app wallet
  - `src/app/api/auth/` (6 routes: register, session, logout, verify, signer, siwe)
  - `src/lib/auth/session.ts` · `src/lib/farcaster/neynar.ts`
  - `src/hooks/useAuth.ts`
- [x] **Sign In With Ethereum (SIWE)** — wallet-first auth for token holders
  - `src/app/api/auth/siwe/route.ts`
  - Wagmi + Viem + RainbowKit integration in app providers
- [x] **Gated allowlist** — wallet + Farcaster allowlist, CSV import, admin management
  - `src/lib/gates/allowlist.ts`
  - `src/app/api/admin/allowlist/route.ts`
  - `src/components/admin/AllowlistTable.tsx` · `src/components/admin/CsvUpload.tsx`
- [x] **Session management** — iron-session encrypted httpOnly cookies, 7-day TTL
  - `src/lib/auth/session.ts`
- [x] **Rate limiting** — per-IP middleware-based limits on all API route families
  - `src/middleware.ts`
- [x] **Zod validation** — every API route validates input with Zod safeParse
  - `src/lib/validation/schemas.ts`
- [x] **Admin panel** — 6-tab admin dashboard (users, ZIDs, allowlist, respect, moderation, import)
  - `src/app/(auth)/admin/`
  - `src/components/admin/` (UsersTable, ZidManager, AllowlistTable, RespectOverview, HiddenMessages, CsvUpload, SyncRespectButton, ImportRespectButton)
- [x] **Security hardening** — server-side nonce validation, HMAC-SHA512 webhook verification, CSP headers, RLS on all tables, error sanitization, signer ownership checks, scheduled casts RLS fix
  - `src/middleware.ts` · `src/lib/validation/schemas.ts` · `src/lib/db/audit-log.ts`
  - `scripts/fix-scheduled-casts-rls.sql` · `scripts/add-notifications-rls.sql`
- [x] **PostHog analytics** — pageview tracking, identified users
  - `src/providers/posthog/` (PostHogProvider, PostHogPageview)
- [x] **Farcaster Mini App SDK** — auth + webhook for embedding in Farcaster clients
  - `src/app/api/miniapp/` (auth, webhook)
  - `src/hooks/useMiniApp.ts`
- [x] **Image upload** — drag-drop with 5MB limit
  - `src/app/api/upload/route.ts` · `src/app/api/admin/upload/route.ts`
- [x] **Error boundaries + loading states** — per-route error.tsx and loading.tsx
- [x] **Keyboard shortcuts** — Cmd+K (search), / (focus compose), Esc (close), Cmd+B (sidebar), M (music)
  - `src/hooks/useKeyboardShortcuts.ts` · `src/hooks/useEscapeClose.ts` · `src/hooks/useFocusTrap.ts`
- [x] **Community config** — all branding, channels, contracts, admin FIDs, nav in one file
  - `community.config.ts`

---

### Pillar 1: Social

#### Chat (Farcaster Channel Feed)

- [x] **Channel feed** — Discord-style chat on Farcaster channels with infinite scroll
  - `src/app/api/chat/messages/route.ts` · `src/app/api/chat/send/route.ts`
  - `src/components/chat/ChatRoom.tsx` · `src/components/chat/MessageList.tsx` · `src/components/chat/Message.tsx`
  - `src/hooks/useChat.ts`
- [x] **Thread replies** — recursive thread unwinding in a slide-out drawer
  - `src/app/api/chat/thread/[hash]/route.ts`
  - `src/components/chat/ThreadDrawer.tsx`
- [x] **Reactions** — like and recast via Neynar signer
  - `src/app/api/chat/react/route.ts`
- [x] **Rich compose** — replies, quotes, cross-channel posting, image upload, @mentions
  - `src/components/chat/ComposeBar.tsx` · `src/components/chat/MentionAutocomplete.tsx`
- [x] **Cast search** — full-text search across channel casts
  - `src/app/api/chat/search/route.ts`
  - `src/components/chat/SearchDialog.tsx`
- [x] **Scheduled posts** — full CRUD for future publishing
  - `src/app/api/chat/schedule/route.ts`
  - `src/components/chat/SchedulePanel.tsx`
- [x] **Feed filters** — filter by content type (all/music/images/video/links/text) + sort
  - `src/components/chat/FeedFilters.tsx`
- [x] **Admin moderation** — hide messages with audit logging
  - `src/app/api/chat/hide/route.ts`
  - `src/components/admin/HiddenMessages.tsx`
- [x] **Sidebar navigation** — channels list, pages, messages (desktop)
  - `src/components/chat/Sidebar.tsx`

#### Encrypted Messaging (XMTP)

- [x] **1-on-1 encrypted DMs** — E2E encrypted via XMTP MLS protocol
  - `src/contexts/XMTPContext.tsx` (500+ line state manager)
  - `src/lib/xmtp/client.ts`
  - `src/components/messages/MessagesRoom.tsx` · `src/components/messages/MessageThread.tsx`
- [x] **Group conversations** — create, manage members, leave groups
  - `src/components/messages/GroupInfoDrawer.tsx` · `src/components/messages/NewConversationDialog.tsx`
- [x] **Multi-wallet support** — connect Farcaster wallet + external wallets for XMTP
  - `src/hooks/useWalletXMTP.ts`
  - `src/components/messages/ConnectXMTP.tsx`
- [x] **Conversation list** — all DMs and groups with unread indicators
  - `src/components/messages/ConversationList.tsx`
- [x] **Tab lock** — prevents concurrent XMTP connections via BroadcastChannel
- [x] **Stream reconnection** — exponential backoff with 5 retries
- [x] **Consent filtering** — XMTP consent protocol for spam prevention
- [x] **Messaging preferences** — auto-join settings, allow non-member DMs

#### Music

- [x] **8-platform inline player** — Spotify, SoundCloud, YouTube, Audius, Sound.xyz, Apple Music, Tidal, Bandcamp
  - `src/components/music/MusicEmbed.tsx` · `src/components/music/UniversalLinkCard.tsx`
  - `src/providers/audio/` (8 platform-specific providers + PlayerProvider orchestrator)
  - `src/lib/music/` (isMusicUrl, findMusicEmbed, songlink, formatDuration)
  - `src/app/api/music/metadata/route.ts`
- [x] **Persistent player bar** — survives page navigation, scrubber, controls
  - `src/components/music/PersistentPlayer.tsx` · `src/components/music/PersistentPlayerWithRadio.tsx`
  - `src/components/music/GlobalPlayer.tsx` · `src/components/music/Scrubber.tsx`
- [x] **Music queue** — auto-advance, shuffle, repeat, queue from feed
  - `src/hooks/useMusicQueue.ts`
  - `src/components/music/MusicSidebar.tsx` · `src/components/music/MusicQueueTrackCard.tsx`
- [x] **Community radio** — Audius playlist stations with continuous playback
  - `src/app/api/music/radio/route.ts`
  - `src/components/music/RadioButton.tsx` · `src/providers/audio/RadioProvider.tsx`
  - `src/hooks/useRadio.ts`
- [x] **Song submissions + voting** — community curation per channel
  - `src/app/api/music/submissions/route.ts` · `src/app/api/music/submissions/vote/route.ts`
  - `src/components/music/SongSubmit.tsx` · `src/components/music/QuickAddSong.tsx`
- [x] **Music link resolver** — Songlink/Odesli API with 7-day cache
  - `src/app/api/music/resolve/route.ts`
  - `src/lib/music/songlink.ts`
- [x] **Music NFT discovery** — scan wallets for Sound.xyz + Zora music NFTs
  - `src/app/api/music/wallet/route.ts`
- [x] **Waveform visualization** — Wavesurfer.js audio waveforms
  - `src/components/music/WaveformPlayer.tsx` · `src/components/music/WaveformPlayerWrapper.tsx`
- [x] **Listening rooms** — shared music playback via Supabase Realtime
  - `src/hooks/useListeningRoom.ts`
  - `src/components/calls/ListeningRoom.tsx`
- [x] **Track of the Day** — daily community-curated highlight with nomination, voting, countdown timer
  - `src/app/api/music/track-of-day/` (3 routes: list/vote/select)
  - `src/components/music/TrackOfTheDay.tsx`
  - `scripts/create-track-of-day.sql`
- [ ] **AI taste profiles** — personalized music recommendations from listening history

#### Social Graph

- [x] **Followers/following** — 4 sort modes (recent, popular, mutual, ZAO members)
  - `src/app/api/users/[fid]/followers/route.ts` · `src/app/api/users/[fid]/following/route.ts`
  - `src/components/social/SocialPage.tsx` · `src/components/social/FollowerCard.tsx`
- [x] **Follow/unfollow** — via Neynar signer
  - `src/app/api/users/follow/route.ts`
- [x] **User profiles** — slide-out profile drawer with activity stats, ZID badge, follow state
  - `src/app/api/users/[fid]/route.ts` · `src/app/api/users/profile/route.ts`
  - `src/components/chat/ProfileDrawer.tsx`
- [x] **Follow suggestions** — discover panel with recommendation algorithm
  - `src/app/api/social/suggestions/route.ts`
  - `src/components/social/DiscoverPanel.tsx`
- [x] **User search** — search by username or display name
  - `src/app/api/search/users/route.ts`
- [x] **Community graph** — visual network of member connections
  - `src/app/api/social/community-graph/route.ts`
  - `src/components/social/CommunityGraph.tsx`
- [x] **Share to Farcaster** — share content natively
  - `src/components/social/ShareToFarcaster.tsx`
- [x] **Virtualized lists** — react-virtual for large member lists
  - Used in `src/components/social/SocialPage.tsx`

---

### Pillar 2: Governance

#### Proposals

- [x] **Proposals CRUD** — create, list, update status
  - `src/app/api/proposals/route.ts` (GET, POST, PATCH)
  - `src/app/(auth)/governance/`
- [x] **Respect-weighted voting** — on-chain OG + ZOR balance queried at vote time via multicall
  - `src/app/api/proposals/vote/route.ts`
- [x] **Proposal comments** — threaded comments with notifications
  - `src/app/api/proposals/comment/route.ts`
  - `src/components/governance/ProposalComments.tsx`
- [x] **Auto-publish threshold** — proposals auto-publish to Farcaster at 1000 Respect votes
  - `src/app/api/publish/farcaster/route.ts`
- [x] **Proposal status transitions** — admin PATCH endpoint: open -> approved -> rejected -> completed
  - `src/app/api/proposals/route.ts` (PATCH handler)
- [x] **Auto-close on deadline** — countdown display via `formatTimeRemaining`, blocks voting after expiry
  - `src/app/(auth)/governance/page.tsx` · `src/lib/format/timeAgo.ts`
- [x] **Zero-weight vote handling** — vote recorded with warning, weight displayed transparently
  - `src/app/api/proposals/vote/route.ts`

#### Respect System

- [x] **Respect leaderboard** — ranked by on-chain + off-chain respect with expandable details
  - `src/app/api/respect/leaderboard/route.ts`
  - `src/components/chat/RespectPanel.tsx`
- [x] **On-chain balance sync** — OG Respect (ERC-20) + ZOR (ERC-1155) on Optimism via multicall
  - `src/app/api/respect/sync/route.ts`
  - `src/components/admin/SyncRespectButton.tsx`
- [x] **Member respect breakdown** — full history per member
  - `src/app/api/respect/member/route.ts`
- [x] **Fractal session recording** — admin records weekly fractal results with 2x Fibonacci scoring
  - `src/app/api/respect/fractal/route.ts`
- [x] **Non-fractal respect events** — 7 event types (introduction, camera, article, hosting, bonus, etc.)
  - `src/app/api/respect/event/route.ts`
- [x] **Airtable import** — bulk import historical fractal data from CSV
  - `src/app/api/admin/respect-import/route.ts`
  - `src/components/admin/ImportRespectButton.tsx`
- [ ] **Airtable full history import** — 130 members, 100+ sessions from 6 CSVs
- [x] **Engagement streaks** — daily activity tracking, flame icon, longest streak, freeze mechanics
  - `src/app/api/streaks/` (2 routes: get streak, record activity)
  - `src/components/streaks/StreakBadge.tsx`
  - `scripts/create-streaks-tables.sql`
- [x] **OG Badge** — founding member badge for ZIDs 1-40
  - `src/components/badges/OGBadge.tsx`

#### Fractals (ORDAO Governance)

- [x] **Fractals page** — 5-tab dashboard (Sessions, Leaderboard, Analytics, Proposals, About)
  - `src/app/(auth)/fractals/` (page, FractalsClient, SessionsTab, FractalLeaderboardTab, AnalyticsTab, ProposalsTab, AboutTab)
- [x] **Sessions list** — historical fractal sessions with participant details
  - `src/app/api/fractals/sessions/route.ts`
- [x] **Member profiles** — per-wallet fractal history and respect breakdown
  - `src/app/api/fractals/member/[wallet]/route.ts`
- [x] **OREC proposals proxy** — reads proposals from ORDAO ornode
  - `src/app/api/fractals/proposals/route.ts`
- [x] **Analytics dashboard** — aggregated stats, participation charts, member drill-down
  - `src/app/api/fractals/analytics/route.ts`
- [x] **Discord bot webhook** — real-time fractal events from Discord bot, HMAC auth
  - `src/app/api/fractals/webhook/route.ts`
- [ ] **Direct OREC contract read** — fallback when ornode is down (read directly from Optimism)
- [ ] **In-app fractal sessions** — run fractal sessions inside ZAO OS (currently Discord-only)

#### Roles (Hats Protocol)

- [x] **Hats SDK integration** — client, tree builder, eligibility checking
  - `src/lib/hats/` (client.ts, tree.ts, gating.ts, constants.ts)
- [x] **Hat tree visualization** — visual role hierarchy
  - `src/app/api/hats/tree/route.ts`
- [x] **Hat eligibility check** — verify if address wears a hat
  - `src/app/api/hats/check/route.ts`
- [ ] **Hats tree deployment** — deploy role hierarchy on Optimism
- [ ] **Safe multisig treasury** — 3-of-5 signer treasury gated by Hats
- [ ] **HSG v2** — Hats Signer Gate for role-controlled treasury signing

---

### Pillar 3: Tools

#### Notifications

- [x] **In-app notifications** — bell icon, dropdown, mark read, unread count
  - `src/app/api/notifications/route.ts` · `src/app/api/notifications/status/route.ts` · `src/app/api/notifications/send/route.ts`
- [x] **Push notifications** — via Farcaster Mini App protocol
- [x] **Notification triggers** — posts, reactions, proposals, votes, comments, new members

#### Cross-Posting

- [x] **Bluesky cross-posting** — sync posts, member mapping, feed display
  - `src/app/api/bluesky/` (sync, members, feed)
  - `src/lib/bluesky/` (client.ts, feed.ts, labeler.ts)
- [x] **Discord sync** — webhook receiver for wallet registry + fractal session imports from Discord bot
  - `src/app/api/discord/sync/route.ts` (GET: read members, POST: receive bot data)
- [ ] **Lens Protocol** — cross-post to Lens with collect/monetize
- [ ] **Nostr** — cross-post with keypair auth, Wavlake music integration
- [ ] **Hive / InLeo** — cross-post with on-chain monetization
- [ ] **X / Twitter** — cross-post (free tier: 1,500 tweets/mo)

#### WaveWarZ Integration

- [x] **Battle display** — embedded battles, intelligence, analytics tabs
  - `src/app/(auth)/wavewarz/page.tsx`
- [x] **Data sync cron** — scrapes WaveWarZ Intelligence dashboard nightly
  - `src/app/api/wavewarz/sync/route.ts`
  - `src/lib/wavewarz/scraper.ts`
- [x] **Artist roster** — 43 wallets, sorted by wins/volume
  - `src/app/api/wavewarz/artists/route.ts`
  - `src/lib/wavewarz/constants.ts`
- [x] **Random stat generator** — generate shareable stats from battle data
  - `src/app/api/wavewarz/random-stat/route.ts`
  - `src/lib/wavewarz/random-stats.ts`
- [x] **Spotlight proposals** — auto-generate proposals from battle milestones
  - `src/lib/wavewarz/proposals.ts`
- [x] **Generate post button** — share battle stats to Farcaster
  - `src/components/wavewarz/GeneratePostButton.tsx`
- [ ] **Native battle display** — replace iframes with native components

#### Voice & Video

- [x] **Voice/video calls** — Jitsi-based rooms
  - `src/components/calls/JitsiRoom.tsx`
- [x] **Listening rooms** — synchronized shared music playback via Supabase Realtime
  - `src/components/calls/ListeningRoom.tsx`
  - `src/hooks/useListeningRoom.ts`
- [ ] **Live audio rooms** — LiveKit-based live streaming (researched, not in sprint)

#### Other Tools

- [x] **Ecosystem partner page** — showcase partner projects
  - `src/app/(auth)/ecosystem/`
- [x] **Directory** — member directory with search
  - `src/app/api/directory/route.ts` · `src/app/api/directory/[slug]/route.ts`
- [x] **Settings page** — user preferences, messaging settings, wallet visibility
  - `src/app/api/users/messaging-prefs/route.ts` · `src/app/api/users/wallet-visibility/route.ts`
- [x] **Home dashboard** — now playing hero, quick actions, activity feed, pillar cards
  - `src/components/home/` (HomePage, NowPlayingHero, QuickActions, ActivityFeed, PillarCard)
- [x] **Activity feed** — recent community activity
  - `src/app/api/activity/feed/route.ts`
- [x] **Onboarding tutorial + FAQ** — guided first-run experience
  - `src/components/chat/TutorialPanel.tsx` · `src/components/chat/FaqPanel.tsx`
- [x] **Minimax LLM proxy** — alternative LLM for content generation
  - `src/app/api/chat/minimax/route.ts`
- [ ] **AI agent** — ElizaOS + Claude + pgvector for welcome DMs, music recs, moderation
- [ ] **AI moderation** — Perspective API + OpenAI Moderation + Claude for content safety
- [ ] **Full-text search** — Supabase tsvector/tsquery across all content
- [ ] **Referral system** — invite codes, referrer rewards, accountability

---

### Pillar 4: Contribute

- [x] **Contribute page** — how to contribute, issue submission
  - `src/app/(auth)/contribute/`
- [x] **Issue submission form** — file bugs/features from inside the app
  - `src/app/api/community-issues/route.ts`
- [x] **Neynar webhooks** — receive cast reactions and follow events
  - `src/app/api/webhooks/neynar/route.ts`
- [ ] **Nouns Builder / ZABAL integration** — native auction UI, governance integration
- [ ] **Music approval queue** — curator-reviewed submission pipeline

---

### UI & Accessibility

- [x] **Mobile-first responsive** — Tailwind breakpoints, bottom nav (mobile), sidebar (desktop)
  - `src/hooks/useMobile.ts`
- [x] **Dark theme** — navy `#0a1628` background, gold `#f5a623` primary
- [x] **Code-split heavy components** — 15+ lazy-loaded via `next/dynamic`
- [x] **Focus trap** — accessible tab cycling in modals and drawers
  - `src/hooks/useFocusTrap.ts`
- [x] **Signer connect flow** — guided Farcaster signer setup
  - `src/components/chat/SignerConnect.tsx`

---

## Architecture

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16 |
| **UI** | React | 19 |
| **Styling** | Tailwind CSS v4 | Dark theme: navy + gold |
| **Auth** | iron-session (encrypted httpOnly cookies) | 8.x |
| **Social** | Neynar SDK (Farcaster) | 3.x |
| **Messaging** | XMTP Browser SDK (MLS protocol) | 7.x |
| **Database** | Supabase PostgreSQL + RLS + Realtime | 2.x |
| **Blockchain** | Wagmi + Viem (Optimism) | 2.x |
| **Wallet UI** | RainbowKit | 2.x |
| **Validation** | Zod | 4.x |
| **Music** | 8 platform providers + Wavesurfer.js | — |
| **State** | React Query (@tanstack/react-query) | 5.x |
| **Analytics** | PostHog + Vercel Analytics | — |
| **Testing** | Vitest | 3.x |
| **Video** | Jitsi React SDK | — |
| **Deployment** | Vercel | — |

### On-Chain Contracts (Optimism)

| Contract | Address |
|----------|---------|
| OG Respect (ERC-20) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| ZOR Respect (ERC-1155) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Hats Protocol v1 | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

### Key Files

| File | What It Does |
|------|-------------|
| `community.config.ts` | All branding, channels, contracts, admin FIDs, nav — **change this to fork** |
| `src/middleware.ts` | Rate limiting + CORS headers |
| `src/lib/auth/session.ts` | iron-session config |
| `src/lib/db/supabase.ts` | Supabase client (service role + anon) |
| `src/lib/farcaster/neynar.ts` | Neynar SDK wrapper |
| `src/lib/validation/schemas.ts` | All Zod schemas |
| `src/contexts/XMTPContext.tsx` | XMTP state management (500+ lines) |
| `src/providers/audio/` | 8 audio platform providers |
| `src/lib/format/timeAgo.ts` | Relative time, deadline countdown, wallet shortener, number formatter |
| `src/hooks/` | 11 custom hooks (auth, chat, radio, music queue, etc.) |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Protected routes (chat, messages, governance, fractals, social, admin, etc.)
│   ├── api/              # 85+ route handlers: /api/[feature]/[action]/route.ts
│   └── page.tsx          # Landing / login
├── components/           # React components by feature (chat, messages, music, admin, social, etc.)
├── hooks/                # 11 custom hooks (useAuth, useChat, useRadio, useMusicQueue, etc.)
├── contexts/             # React contexts (XMTPContext)
├── providers/            # Provider wrappers (8 audio providers, PostHog)
├── lib/                  # Utilities by domain (auth, db, farcaster, gates, music, xmtp, hats, etc.)
└── types/                # TypeScript type definitions
community.config.ts       # All community config — fork-friendly
research/                 # 91 research docs (see research/README.md)
scripts/                  # DB setup, wallet generation, webhook registration, data import
docs/                     # Internal plans, QA checklists, architecture decisions
```

---

## Research Library

**91 research documents** covering every aspect of building a decentralized music platform.

Start with:
- [research/50 — The ZAO Complete Guide](./research/50-the-zao-complete-guide/) — canonical ecosystem reference
- [research/51 — ZAO Whitepaper 2026](./research/51-zao-whitepaper-2026/) — Draft 4.5
- [research/56 — ORDAO Respect System](./research/56-ordao-respect-system/) — on-chain governance
- [research/README.md](./research/) — full index organized by topic

---

## Sprint Roadmap

Detailed execution plans live in `docs/superpowers/plans/`. This is the high-level view:

| Sprint | Focus | Status |
|--------|-------|--------|
| **1** | Quick wins — PostHog analytics, ZID badges, notification triggers | Planned |
| **2** | Governance fixes — proposal categories, status transitions, deadline countdown, rate limits | Done |
| **3** | Engagement — streaks, badges, Track of the Day, referrals | Partially Done |
| **4** | Moderation & search — AI moderation, full-text search, music approval queue | Planned |
| **5** | Hats & Treasury — Hats tree deployment on Optimism, Safe multisig, HSG v2 | Planned (Q3 2026) |
| **6** | AI Agent — ElizaOS + Claude + pgvector, welcome DMs, music recs | Planned (Q4 2026) |
| **7** | Cross-platform — Lens, Bluesky native, Nostr, X, Hive | Planned (2027) |
| **8** | Nouns Builder / ZABAL — native auction UI, governance integration | Planned (2027) |

---

## Contributing

ZAO OS is open source. Fork it, build on it, make it yours.

- [GitHub Issues](https://github.com/bettercallzaal/zaoos/issues) — bugs and feature requests
- [Research Library](./research/) — 91 docs of context
- [QA Test Checklist](./docs/QA-TEST-CHECKLIST.md) — testing procedures
- [Internal Plans](./docs/superpowers/plans/) — execution plans for upcoming sprints

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
