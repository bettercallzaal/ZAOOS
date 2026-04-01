<div align="center">

# ZAO OS

**A gated, music-first Farcaster social client. Fork it, make it yours.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Farcaster](https://img.shields.io/badge/Built_on-Farcaster-8B5CF6)](https://farcaster.xyz)
[![XMTP](https://img.shields.io/badge/XMTP-Encrypted_DMs-FC4F37)](https://xmtp.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Live App](https://zaoos.com) · [Fork Guide](./FORK.md) · [Research Library](./research/) · [Report Bug](https://github.com/bettercallzaal/zaoos/issues) · [Discord](https://discord.thezao.com)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bettercallzaal/zaoos&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEYNAR_API_KEY,SESSION_SECRET,APP_FID,APP_SIGNER_PRIVATE_KEY,NEXT_PUBLIC_SIWF_DOMAIN)

</div>

---

ZAO OS is a gated social platform for **The ZAO** — a decentralized music community where artists keep their revenue, curators earn reputation, and the community governs itself. Built on [Farcaster](https://farcaster.xyz) with encrypted messaging via [XMTP](https://xmtp.org), on-chain governance via [ORDAO](https://zao.frapps.xyz/), and inline music from 9 platforms.

### Fork it for your community

Everything community-specific lives in **one file** — [`community.config.ts`](./community.config.ts). Change it and you have your own gated community hub.

| Doc | What It's For |
|-----|---------------|
| **[FORK.md](./FORK.md)** | Step-by-step fork guide — clone, configure, deploy in under an hour |
| **[AGENTS.md](./AGENTS.md)** | AI coding agent context — works with Claude Code, Cursor, Copilot, Windsurf |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Code conventions, PR process, testing standards |
| **[community.config.ts](./community.config.ts)** | The one file to change — branding, channels, contracts, admin, nav |
| **[.env.example](./.env.example)** | All env vars with descriptions, organized by priority |

---

## Quick Start

```bash
git clone https://github.com/bettercallzaal/zaoos.git
cd zaoos
npm install
cp .env.example .env.local    # fill in env vars
npm run dev                    # starts on localhost:3000
```

See **[FORK.md](./FORK.md)** for the complete setup guide including database scripts, app wallet generation, and deployment.

**Key services:**
- **Supabase** — database (required)
- **Neynar** — Farcaster API (required)
- **Stream.io** — live audio/video rooms, Spaces (required for `/spaces`)
- **Alchemy** — ENS resolution, NFT discovery, respect sync webhooks (free tier)
- Everything else is optional — see `.env.example` for the full list

---

## Feature Checklist

> Every feature with a checked box is built and working. Unchecked = planned.
> **Code primitives** are listed under each feature so forkers know exactly what to grab.

### Platform Core

- [x] **Sign In With Farcaster (SIWF)** — Neynar managed signers, EIP-712 app wallet, server nonce validation
  - `src/app/api/auth/` (6 routes: register, session, logout, verify, signer, siwe)
  - `src/lib/auth/session.ts` · `src/lib/farcaster/neynar.ts`
  - `src/hooks/useAuth.ts`
  - SignInButton waits for server nonce (fixes first-attempt failures), remounts on retry
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
- [x] **Admin panel** — 13-tab admin dashboard (users, ZIDs, allowlist, respect, moderation, import, polls, discord, engagement, audit, funnel, dormant, spaces)
  - `src/app/(auth)/admin/`
  - `src/components/admin/` (UsersTable, ZidManager, AllowlistTable, RespectOverview, HiddenMessages, CsvUpload, SyncRespectButton, ImportRespectButton, PollConfigEditor)
- [x] **Member CRM** — unified directory + data health dashboard at `/admin/members`
  - `src/app/(auth)/admin/members/page.tsx`
  - `src/app/api/members/directory/route.ts` — unified member view (identity, wallets, platforms, respect, activity)
  - `src/app/api/admin/member-health/route.ts` — data quality report (missing fields, tier mismatches, unlinked records)
  - Member tiers: `respect_holder` (governance) vs `community` (view only)
  - Activity tracking via `src/lib/db/activity.ts`
- [x] **ENS resolution** — server-side via Alchemy RPC with forward verification, text records, avatar
  - `src/lib/ens/resolve.ts` — shared module (resolveENSNames, getENSTextRecords, getENSAvatar)
  - `src/app/api/ens/route.ts` — public server-side API (protects Alchemy key)
  - `src/hooks/useENS.ts` — client hooks call API route (no browser-side RPC)
  - ENS Profile section on member pages: description, twitter, github, discord from on-chain records
  - Requires: `ALCHEMY_API_KEY` env var (free tier: 30M CU/month)
- [x] **Preferred wallet** — users choose which wallet displays on their profile
- [ ] **Admin confirmation modals** — replace native confirm() with styled ConfirmDialog for destructive actions
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
- [ ] **Compose character count** — visible X/1024 counter, gold at 900, red at 1000
- [ ] **Scroll-to-bottom button** — floating "New messages" pill when scrolled up in active chat
- [x] **Cast search** — full-text search across channel casts
  - `src/app/api/chat/search/route.ts`
  - `src/components/chat/SearchDialog.tsx`
- [ ] **Search scope clarity** — label "Searching channel messages", DM search indicator
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

- [x] **9-platform inline player** — Spotify, SoundCloud, YouTube, Audius, Sound.xyz, Apple Music, Tidal, Bandcamp, generic audio
  - `src/components/music/MusicEmbed.tsx` · `src/components/music/UniversalLinkCard.tsx`
  - `src/providers/audio/` (9 platform-specific providers + PlayerProvider orchestrator)
  - `src/lib/music/` (isMusicUrl, findMusicEmbed, songlink, formatDuration, curationWeight)
  - `src/app/api/music/metadata/route.ts`
- [x] **Unified persistent player** — one player on ALL pages, idle "ZAO Radio" bar, sidebar drawer
  - `src/components/music/PersistentPlayer.tsx` — volume, like, playlist, prev/play/next, expand
  - `src/components/music/PersistentPlayerWithRadio.tsx` — global wrapper
  - `src/components/music/MusicSidebar.tsx` — right-side drawer with user queue + channel queue
- [x] **Expanded full-screen player** — tap compact bar to expand with large artwork, full scrubber, all controls
  - `src/components/music/ExpandedPlayer.tsx` — shuffle, repeat, like, playlist, share, crossfade toggle, lyrics, waveform comments
- [x] **Swipe to skip** — horizontal swipe on compact bar and expanded artwork to skip tracks, haptic feedback
- [x] **Crossfade engine** — dual audio element system for smooth transitions (0-12s configurable)
  - `src/providers/audio/HTMLAudioProvider.tsx` — dual `<audio>` elements with fade in/out
  - `src/components/music/CrossfadeSettings.tsx` — settings UI (off / 1s / 2s / 3s / 5s / 8s / 12s)
  - Configurable in Settings page (Music & Playback section) + quick toggle in expanded player
- [x] **Complete MediaSession API** — all 8 lock screen actions + progress bar
  - play, pause, nexttrack, previoustrack, seekbackward, seekforward, seekto, stop
  - `setPositionState()` for lock screen scrubber + time display
- [x] **Wake Lock** — `navigator.wakeLock.request('screen')` keeps screen on during playback
- [x] **Haptic feedback** — `navigator.vibrate(10)` on play, pause, resume, stop, skip
- [x] **Player state persists across refresh** — localStorage save/restore, resume at saved position
- [x] **Queue management** — add-next, add-to-queue, remove, reorder
  - `src/hooks/usePlayerQueue.ts` · `src/contexts/QueueContext.tsx`
  - `src/components/music/QueueActions.tsx` — "Play Next" / "Add to Queue" popover on all track cards
  - User queue section at top of MusicSidebar with remove buttons
- [x] **Liked/Favorite songs** — heart button with optimistic toggle, like count, social proof
  - `src/app/api/music/library/like/route.ts` · `src/components/music/LikeButton.tsx`
  - "Liked by DanSingJoy + 4 others" social proof on track cards
- [x] **Add to playlist** — popover with user playlists + inline "New playlist" creation
  - `src/components/music/AddToPlaylistButton.tsx`
- [x] **Collaborative playlists** — multi-user playlists with "collab" badge
  - `collaborative` column on playlists table, API updated for shared adding
- [x] **Track reactions** — 6 emoji reactions (🔥 ❤️ 🎵 💎 👏 🤯) with counts
  - `src/app/api/music/library/react/route.ts` · `src/components/music/TrackReactions.tsx`
- [x] **Now Playing presence** — Supabase Realtime broadcast of current track
  - `src/hooks/useNowPlaying.ts` · `src/components/music/NowPlayingBar.tsx`
- [x] **Share track to chat** — one-tap share music URL to /zao channel
  - `src/components/music/ShareToChatButton.tsx`
- [x] **Community radio** — 3 Audius stations with continuous playback, station switching
  - `src/app/api/music/radio/route.ts` · `src/providers/audio/RadioProvider.tsx`
- [x] **Song submissions + voting** — community curation per channel with admin review
  - `src/app/api/music/submissions/route.ts` · `src/app/api/music/submissions/vote/route.ts`
- [x] **Music library** — persistent song database, search/filter/sort, auto-save from chat
  - `src/lib/music/library.ts` · `src/app/api/music/library/route.ts`
- [x] **Playlists** — personal + community + collaborative + TOTD Archive
  - `src/app/api/music/playlists/` — CRUD + track management
- [x] **Listening history** — "History" tab on Music page sorted by last_played_at
- [x] **Sleep timer** — 15m / 30m / 1hr / end-of-track with countdown badge (desktop)
  - `src/components/music/SleepTimerButton.tsx`
- [x] **Lyrics display** — lyrics.ovh + lyrist fallback with in-memory cache, toggle in expanded player
  - `src/app/api/music/lyrics/route.ts` · `src/components/music/LyricsPanel.tsx`
- [x] **Waveform comments** — SoundCloud-style timestamped comments on tracks
  - `src/app/api/music/comments/route.ts` · `src/components/music/WaveformComments.tsx`
- [x] **Artist profiles** — aggregated stats (tracks, plays, likes) with top tracks
  - `src/app/api/music/artists/route.ts` · `src/components/music/ArtistCard.tsx`
- [x] **Respect-weighted curation** — high-Respect members' likes surface tracks higher (ZAO exclusive)
  - `src/lib/music/curationWeight.ts` — `log2(respect + 1)` weighting formula
  - `src/app/api/music/trending-weighted/route.ts` · `src/components/music/RespectTrending.tsx`
- [x] **Top Curators leaderboard** — ranked by total likes received on shared tracks
  - `src/app/api/music/curators/route.ts` · `src/components/music/TopCurators.tsx`
- [x] **Binaural beats** — 5 presets (Delta/Theta/Alpha/Beta/Schumann) + custom frequencies
  - Web Audio API dual oscillators with true stereo channel separation
  - `src/components/music/BinauralBeats.tsx` — presets, timer, volume, custom carrier/beat sliders
  - `src/components/music/AmbientMixer.tsx` — white/pink/brown noise layers
  - Save custom presets to localStorage
- [x] **Music NFT discovery** — multi-chain via Alchemy NFT API (ETH, Optimism, Base)
  - `src/app/api/music/wallet/route.ts`
- [x] **Waveform visualization** — Wavesurfer.js for Audius tracks
  - `src/components/music/WaveformPlayer.tsx`
- [x] **Listening rooms** — shared music playback via Supabase Realtime
  - `src/hooks/useListeningRoom.ts`
- [x] **Track of the Day** — daily nomination, voting, admin selection, countdown
  - `src/app/api/music/track-of-day/` (3 routes)
- [x] **Music page** — 10 tabs: Radio, TOTD, Submissions, Trending, Playlists, Binaural, Liked, History, Curators
  - `src/components/music/MusicPage.tsx` (39KB)
- [x] **Volume control** — desktop inline slider + mobile popover on persistent player + full slider in expanded player
- [x] **Cross-platform links** — Songlink/Odesli "Also on:" row on embeds
- [ ] **AI taste profiles** — pgvector embeddings for personalized recommendations (researched, doc 130)

#### Social Graph

- [x] **Followers/following** — 4 sort modes (recent, popular, mutual, ZAO members)
  - `src/app/api/users/[fid]/followers/route.ts` · `src/app/api/users/[fid]/following/route.ts`
  - `src/components/social/SocialPage.tsx` · `src/components/social/FollowerCard.tsx`
- [x] **Follow/unfollow** — via Neynar signer
  - `src/app/api/users/follow/route.ts`
- [x] **User profiles** — slide-out profile drawer with activity stats, ZID badge, follow state
  - `src/app/api/users/[fid]/route.ts` · `src/app/api/users/profile/route.ts`
  - `src/components/chat/ProfileDrawer.tsx`
- [ ] **Profile DM shortcut** — "Message" button in ProfileDrawer to start XMTP DM
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

#### Three-Tier Governance System

**Governance tab has three distinct sections with visual separation:**

##### 1. ZOUNZ On-Chain Proposals (Nouns Builder on Base)

- [x] **ZOUNZ Governor** — reads from deployed Nouns Builder Governor contract on Base
  - `src/lib/zounz/contracts.ts` — Token, Auction, Governor, Treasury addresses + ABIs
  - `src/app/api/zounz/proposals/route.ts` — reads proposalCount, threshold, quorum
  - `src/components/zounz/ZounzProposals.tsx` — proposal count, user voting power (wagmi), links to nouns.build
  - NFT = 1 vote, trustless on-chain execution via timelock
- [x] **ZOUNZ Auction** — daily NFT auctions with bid UI
  - `src/components/zounz/ZounzAuction.tsx`

##### 2. Snapshot Gasless Polls

- [x] **Snapshot weekly priority polls** — one-click creation via `@snapshot-labs/snapshot.js`
  - `src/lib/snapshot/client.ts` — GraphQL client for active/recent polls
  - `src/app/api/snapshot/polls/route.ts` — public endpoint for poll data
  - `src/components/governance/SnapshotPolls.tsx` — active polls with score bar charts, "Vote on Snapshot" links
  - `src/components/governance/CreateWeeklyPoll.tsx` — admin one-click creator (10 workstream choices, 7-day period)
  - Approval voting (multi-select), snapshot.js Client712 with viem-to-ethers wallet shim
- [x] **Admin poll config** — customize choices, templates, duration from admin panel
  - `src/app/api/admin/poll-config/route.ts` — GET (public) / PUT (admin)
  - `src/components/admin/PollConfigEditor.tsx` — add/remove/reorder/edit choices, save to DB

##### 3. Community Proposals (Supabase + Respect-Weighted)

- [x] **Proposals CRUD** — create, list, update status. Proposals tab is default on governance page.
  - `src/app/api/proposals/route.ts` (GET, POST, PATCH)
  - `src/app/(auth)/fractals/ProposalsTab.tsx`
- [x] **Social posts** — quick-create, auto-categorized "social", pink accent
- [x] **Respect-weighted voting** — on-chain OG + ZOR balance via multicall, optimistic update
  - `src/app/api/proposals/vote/route.ts` — with upsert fallback + error revert
- [x] **7-day voting period** — default closes_at auto-set, deferred publishing until deadline
- [x] **Auto-publish after deadline** — proposals publish to Farcaster + Bluesky + X only AFTER voting period ends AND 1000R threshold met
  - Auto-approve check runs on GET /api/proposals for expired proposals
- [x] **Proposal comments** — threaded with notifications
  - `src/components/governance/ProposalComments.tsx`
- [x] **Status transitions** — open → approved → rejected → completed → published
- [x] **Zero-weight vote handling** — vote recorded with warning
- [ ] **Vote breakdown view** — see who voted, vote weight per voter

#### Respect System

- [x] **Respect leaderboard** — ranked by on-chain + off-chain respect with expandable details
  - `src/app/api/respect/leaderboard/route.ts`
  - `src/components/chat/RespectPanel.tsx`
- [x] **On-chain balance sync** — OG Respect (ERC-20) + ZOR (ERC-1155) on Optimism via Alchemy RPC
  - `src/app/api/respect/sync/route.ts` — manual admin sync (fallback)
  - `src/app/api/webhooks/alchemy/route.ts` — **auto-sync via Alchemy webhooks** (real-time on mint)
  - Dual HMAC signature validation (ZOR + OG separate webhook keys)
  - `src/components/admin/SyncRespectButton.tsx`
- [x] **On-chain transfer history** — historical respect token transfers with timestamps
  - `src/app/api/respect/transfers/route.ts` — query + backfill from Alchemy getAssetTransfers
  - `scripts/create-respect-transfers.sql` — transfers table
  - On-chain transfers appear in the unified respect ledger on member profiles
- [x] **Member respect breakdown** — full history per member with unified ledger
  - `src/app/api/respect/member/route.ts` — returns `ledger[]` (every point earned: date, source, amount, detail)
  - `src/app/api/fractals/member/[wallet]/route.ts` — fractal history + events + ledger
- [x] **Respect Ledger** — transparent timeline in Analytics tab drill-down: date, source (fractal/event), amount, detail
  - Fractal scores sorted by session number (newest first), with date + participant count + era
- [x] **Fractal session recording** — admin records weekly fractal results with 2x Fibonacci scoring
  - `src/app/api/respect/fractal/route.ts`
- [x] **Non-fractal respect events** — 7 event types (introduction, camera, article, hosting, bonus, etc.)
  - `src/app/api/respect/event/route.ts`
- [x] **Airtable import** — bulk import historical fractal data from CSV
  - `src/app/api/admin/respect-import/route.ts`
  - `src/components/admin/ImportRespectButton.tsx`
- [x] **Airtable full history import** — idempotent CLI script handles all 6 CSV types, both Fibonacci eras, recalculates totals
  - `scripts/import-fractal-history.ts` (run: `npx tsx scripts/import-fractal-history.ts --dir ./data`)
- [x] **Engagement streaks** — daily activity tracking, flame icon, longest streak, freeze mechanics
  - `src/app/api/streaks/` (2 routes: get streak, record activity)
  - `src/components/streaks/StreakBadge.tsx`
  - `scripts/create-streaks-tables.sql`
- [ ] **Streaks wired to all activities** — record streaks from posts, votes, reactions, comments, submissions (not just login)
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
- [x] **Direct OREC contract read** — viem multicall fallback reads proposals from OREC on Optimism when ornode is down
  - `src/lib/ordao/client.ts` (fetchProposalsOnChain, fetchRespectBalance, fetchZorBalance)
  - Wired as automatic fallback in `src/app/api/fractals/proposals/route.ts`
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
- [ ] **Notification type filters** — filter pills: All, Proposals, Votes, Comments, Members, Music

#### Cross-Platform Publishing

Compose once in ZAO OS, publish to multiple platforms simultaneously. Farcaster is always primary; other platforms receive fire-and-forget copies with content normalization per platform.

- [x] **Bluesky cross-posting** — sync posts, member mapping, feed display
  - `src/app/api/bluesky/` (sync, members, feed)
  - `src/lib/bluesky/` (client.ts, feed.ts, labeler.ts)
- [x] **Discord sync** — webhook receiver for wallet registry + fractal session imports from Discord bot
  - `src/app/api/discord/sync/route.ts` (GET: read members, POST: receive bot data)
- [x] **Content normalization** — per-platform text/image/embed adaptation
  - `src/lib/publish/normalize.ts`
- [x] **Publish status tracking** — cross-post results with error tracking per platform
  - `src/app/api/publish/status/route.ts`
- [x] **X / Twitter publishing** — governance-only auto-publish, @thezaodao account, 280-char truncation + link-back
  - `src/app/api/publish/x/route.ts` · `src/lib/publish/x.ts`
- [x] **Connected Platforms settings** — unified ACCOUNTS section (Wallet, Farcaster, Bluesky, Solana, X), FEATURES section, SOCIALS section
  - Per-user cross-posting toggles removed (governance-only publishing now)
- [ ] **Lens Protocol** — OAuth connect, SDK posting (deferred: wallet mismatch blocker, see research/121)
  - Scaffolded: `src/app/api/publish/lens/route.ts` · `src/lib/publish/lens.ts` · `src/lib/publish/lens-client.ts`
- [ ] **Bluesky enhancements** — thread splitting (>300 chars), proper embed cards, image cross-posting
- [ ] **Hive / InLeo** — posting key encrypted at rest (AES-256-GCM), markdown-native, tag-based InLeo visibility (deferred)
  - Scaffolded: `src/app/api/publish/hive/route.ts` · `src/lib/publish/hive.ts`
- [ ] **Multi-platform compose UI** — toggle pills per platform in ComposeBar, "Publish (N)" button
  - Planned: `src/components/compose/PlatformToggles.tsx` · `src/components/compose/PublishButton.tsx`

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
- [x] **Live audio/video rooms (Spaces)** — Stream.io Video SDK with backstage, RTMP multistream (Twitch/YouTube/Kick/Facebook), screen share, recording, transcription/CC, noise cancellation, hand raise, room chat, emoji reactions, slug URLs, admin controls, webhook-driven participant counts
  - `src/app/spaces/` — room pages with slug routing
  - `src/components/spaces/` — 40+ components (RoomView, ControlsPanel, BroadcastModal, ParticipantsPanel, ClosedCaptions, ConnectionQuality, etc.)
  - `src/app/api/stream/` — token, rooms CRUD, webhook handler
  - `src/app/api/admin/spaces/` — admin list/delete endpoints
  - `src/lib/spaces/roomsDb.ts` · `src/lib/spaces/rtmpManager.ts`
  - `scripts/configure-stream-grants.ts` — call type permission setup

#### Other Tools

- [x] **Ecosystem partner page** — showcase partner projects
  - `src/app/(auth)/ecosystem/`
- [x] **Public member directory** — unified grid at `/members` with PFP, name, ZID, tier, respect, category, cover images
  - `src/app/members/page.tsx` (public) · `src/app/api/members/directory/route.ts`
  - Merges users + respect_members + community_profiles
  - Search, tier filter (Respect Holders / Community), sort by respect/name/recent
  - `/directory` redirects here
- [x] **Public member profiles** — shareable at `/members/[username]` (no login required)
  - `src/app/members/[username]/page.tsx` · `src/app/api/members/[username]/route.ts`
  - Shows: respect scores, fractal history, platforms, ENS names, profile completeness
  - Lookup by username, FID, or wallet address
  - Server-side ENS resolution for all wallets
- [x] **Profile cover image hero** — full-width banner from artist profile with gradient overlay
- [x] **Respect breakdown** — 6-card grid: Total, Fractal, Events, Hosting, OG Chain, ZOR Chain
- [x] **Profile badges** — category (musician/producer/etc), featured, admin, moderator, power badge
- [x] **ENS Profile section** — on-chain identity from ENS text records (twitter, github, discord, website)
- [x] **Profile completeness indicator** — progress bar showing what's missing
- [ ] **WaveWarZ stats on profile** — wins, losses, volume from wavewarz_artists
- [ ] **OG image generation** — dynamic social sharing cards for member profiles
- [ ] **Self-edit profile** — members edit their own bio, category, links, cover image
- [x] **Settings page** — unified ACCOUNTS (Wallet, Farcaster, Bluesky, Solana, X), FEATURES (Messaging, Push), SOCIALS
  - `src/app/api/users/messaging-prefs/route.ts` · `src/app/api/users/wallet-visibility/route.ts`
  - `src/app/api/platforms/` (Lens, Hive connection endpoints)
- [x] **Home dashboard** — now playing hero, quick actions, activity feed, pillar cards
  - `src/components/home/` (HomePage, NowPlayingHero, QuickActions, ActivityFeed, PillarCard)
- [x] **Activity feed** — recent community activity
  - `src/app/api/activity/feed/route.ts`
- [ ] **Activity feed complete coverage** — ensure all 8 content types populate and deep-link correctly
- [x] **Onboarding tutorial + FAQ** — guided first-run experience
  - `src/components/chat/TutorialPanel.tsx` · `src/components/chat/FaqPanel.tsx`
- [x] **Minimax LLM proxy** — alternative LLM for content generation
  - `src/app/api/chat/minimax/route.ts`
- [ ] **AI agent** — ElizaOS + Claude + pgvector for welcome DMs, music recs, moderation
- [x] **AI moderation** — Perspective API for content safety scoring
  - `src/app/api/moderation/queue/route.ts`
  - `src/lib/moderation/moderate.ts`
- [x] **Full-text search** — Supabase tsvector/tsquery across all content

---

### Pillar 4: Contribute

- [x] **Contribute page** — how to contribute, issue submission
  - `src/app/(auth)/contribute/`
- [x] **Issue submission form** — file bugs/features from inside the app
  - `src/app/api/community-issues/route.ts`
- [x] **Neynar webhooks** — receive cast reactions and follow events
  - `src/app/api/webhooks/neynar/route.ts`
- [x] **Nouns Builder / ZOUNZ integration** — on-chain Governor proposals, NFT auction UI, voting power display
  - `src/components/zounz/ZounzProposals.tsx` · `src/components/zounz/ZounzAuction.tsx`
- [x] **Music approval queue** — curator-reviewed submission pipeline
  - `src/app/api/moderation/queue/route.ts`

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
| **Music** | 9 platform providers + Wavesurfer.js + Web Audio (binaural) | — |
| **Governance** | Nouns Builder Governor + Snapshot.js + Supabase | — |
| **State** | React Query (@tanstack/react-query) | 5.x |
| **Analytics** | PostHog + Vercel Analytics | — |
| **Testing** | Vitest | 3.x |
| **Video** | Jitsi React SDK | — |
| **Cross-posting** | @atproto/api (Bluesky), twitter-api-v2 (X), @lens-protocol/client (scaffolded), @hiveio/dhive (scaffolded) | — |
| **Moderation** | Perspective API (Google Jigsaw) | — |
| **Deployment** | Vercel | — |

### On-Chain Contracts

**Optimism:**

| Contract | Address |
|----------|---------|
| OG Respect (ERC-20) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| ZOR Respect (ERC-1155) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Hats Protocol v1 | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

**Base (ZOUNZ Nouns Builder DAO):**

| Contract | Address |
|----------|---------|
| ZOUNZ Token (ERC-721) | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` |
| ZOUNZ Auction | `0xb2d43035c1d8b84bc816a5044335340dbf214bfb` |
| ZOUNZ Governor | `0x9d98ec4ba9f10c942932cbde7747a3448e56817f` |
| ZOUNZ Treasury | `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` |

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
| `src/providers/audio/` | 9 audio platform providers + PlayerProvider (crossfade, MediaSession, Wake Lock) |
| `src/lib/zounz/contracts.ts` | ZOUNZ DAO contract addresses + ABIs (Token, Auction, Governor, Treasury) |
| `src/lib/snapshot/client.ts` | Snapshot GraphQL client for reading polls |
| `src/lib/music/curationWeight.ts` | Respect-weighted curation formula: `log2(respect + 1)` |
| `src/lib/ordao/client.ts` | Direct OREC contract reader via viem — on-chain fallback for proposals + respect |
| `src/lib/format/timeAgo.ts` | Relative time, deadline countdown, wallet shortener, number formatter |
| `src/lib/publish/` | Cross-platform publishing (Farcaster, X, normalize, Lens/Hive scaffolds) |
| `src/lib/moderation/moderate.ts` | AI moderation via Perspective API |
| `src/hooks/` | 16+ custom hooks (auth, chat, radio, playerQueue, nowPlaying, listeningRoom, ENS, etc.) |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Protected routes (chat, messages, governance, fractals, social, admin, etc.)
│   ├── api/              # 121 route handlers: /api/[feature]/[action]/route.ts
│   └── page.tsx          # Landing / login
├── components/           # React components by feature (chat, messages, music, admin, social, etc.)
├── hooks/                # 16+ custom hooks (useAuth, useChat, useRadio, usePlayerQueue, useNowPlaying, useListeningRoom, useENS, etc.)
├── contexts/             # React contexts (XMTPContext, QueueContext)
├── providers/            # Provider wrappers (8 audio providers, PostHog)
├── lib/                  # Utilities by domain (auth, db, farcaster, gates, music, xmtp, hats, publish, moderation, etc.)
└── types/                # TypeScript type definitions
community.config.ts       # All community config — fork-friendly
research/                 # 155+ research docs (see research/README.md)
scripts/                  # DB setup, wallet generation, webhook registration, data import
docs/                     # Internal plans, QA checklists, architecture decisions
```

---

## Research Library

**155+ research documents** covering every aspect of building a decentralized music platform — protocol, identity, music, AI agents, governance, revenue, cross-platform publishing, on-chain distribution, Arweave, NFTs, reputation, security, and developer tooling.

Start with:
- [research/50 — The ZAO Complete Guide](./research/50-the-zao-complete-guide/) — canonical ecosystem reference
- [research/51 — ZAO Whitepaper 2026](./research/51-zao-whitepaper-2026/) — Draft 4.5
- [research/56 — ORDAO Respect System](./research/56-ordao-respect-system/) — on-chain governance
- [research/154 — Skills & Commands Master Reference](./research/154-skills-commands-master-reference/) — all 48 dev commands/skills
- [research/155 — Music NFT End-to-End](./research/155-music-nft-end-to-end-implementation/) — upload → mint → buy implementation plan
- [research/README.md](./research/) — full index organized by topic

---

## Sprint Roadmap

Detailed execution plans live in `docs/superpowers/plans/`. This is the high-level view:

| Sprint | Focus | Status |
|--------|-------|--------|
| **1** | Quick wins — ZID badges, OG badges, notification triggers | Done |
| **2** | Governance fixes — proposal categories, status transitions, deadline countdown, rate limits, security audit | Done |
| **3** | Engagement — streaks, badges, Track of the Day, activity feed, OG badge, referral system | Done |
| **4** | Moderation & search — AI moderation (Perspective API), full-text search (tsvector), music approval queue | Done |
| **Cross-platform** | Approved proposals auto-publish to Farcaster + Bluesky + X at 1000 Respect | Done |
| **Settings** | Unified accounts section (Wallet, Farcaster, Bluesky, Solana, X), features, socials | Done |
| **Music Player** | 30+ components: liked songs, queue, reactions, crossfade, binaural beats, lyrics, waveform comments, artist profiles, respect-weighted curation, curators leaderboard | Done |
| **Mobile Polish** | Complete MediaSession (8 actions), expanded player, swipe gestures, haptics, Wake Lock | Done |
| **Governance** | Three-tier system: ZOUNZ on-chain + Snapshot weekly polls + Community proposals. Admin poll config. 7-day voting + deferred publishing. | Done |
| **Member Profiles** | Public directory + profiles, ENS resolution, cover images, respect breakdown, badges, completeness indicator | Done |
| **On-Chain Distribution** | Music NFTs via Arweave atomic assets + BazAR/UCM + 0xSplits. Upload → mint → buy. (see docs 150-155) | Planned |
| **5** | Hats & Treasury — Hats tree deployment on Optimism, Safe multisig, HSG v2 | Planned (Q3 2026) |
| **6** | AI Agent — ElizaOS + Claude + pgvector, welcome DMs, music recs | Planned (Q4 2026) |
| **7** | Music Tier 4 — Farcaster embeds, Audius SDK, AI recs, Last.fm scrobbling | Planned (see doc 130) |

---

## Contributing

ZAO OS is open source (MIT). Fork it, build on it, make it yours.

- **[FORK.md](./FORK.md)** — fork it for your own community
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — code conventions, PR process, how to contribute
- **[AGENTS.md](./AGENTS.md)** — AI agent context for Claude Code, Cursor, Copilot, Windsurf
- [GitHub Issues](https://github.com/bettercallzaal/zaoos/issues) — bugs and feature requests
- [Research Library](./research/) — 155+ docs of context
- [QA Test Checklist](./docs/QA-TEST-CHECKLIST.md) — testing procedures

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
