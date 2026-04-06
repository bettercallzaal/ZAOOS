# 289 — ZAO Tool Box

> **Status:** Research complete
> **Date:** April 6, 2026
> **Goal:** Catalog every usable product, feature, and tool in ZAO OS with clear documentation for each

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Organization** | Group tools into 8 product categories matching the app's nav pillars + infrastructure |
| **What counts as a "tool"** | Built, deployed, and usable today — 41 pages, 269 API endpoints, 258 components |
| **Documentation home** | USE this doc as the canonical toolkit reference; link from `/tools` page in the app |
| **Recyclable for other communities** | Every tool below works for ANY Farcaster community — change `community.config.ts` and go |
| **Newest builds (April 2026)** | FISHBOWLZ live rooms, scheduled spaces, speaker tipping, token-gated rooms, issue reporter |

---

## What Is the ZAO Tool Box?

The ZAO Tool Box is the complete inventory of products built inside ZAO OS. Each tool is a usable feature — not a concept, not a plan. Everything listed here has code in `src/`, API endpoints, and UI components.

**Tech stack:** Next.js 16 + React 19, Supabase PostgreSQL, Neynar (Farcaster), XMTP, Stream.io, 100ms, Wagmi/Viem, Tailwind CSS v4.

**Fork point:** Change `community.config.ts` to rebrand the entire OS for a different community.

---

## Tool Box Categories

| # | Category | Tools | Status |
|---|----------|-------|--------|
| 1 | **Social & Chat** | 6 tools | Live |
| 2 | **Music Platform** | 8 tools | Live |
| 3 | **Live Audio/Video Spaces** | 7 tools | Live |
| 4 | **Governance & Reputation** | 6 tools | Live |
| 5 | **Publishing & Distribution** | 4 tools | Live |
| 6 | **Member Directory & Identity** | 5 tools | Live |
| 7 | **Admin & Moderation** | 6 tools | Live |
| 8 | **Developer & AI Tools** | 5 tools | Live |

**Total: 47 documented tools across 8 categories.**

---

## 1. Social & Chat

### 1.1 Farcaster Channel Chat

| Field | Detail |
|-------|--------|
| **Name** | Channel Chat |
| **What it does** | Real-time public chat rooms powered by Farcaster channels. Send casts, react, reply in threads, search messages, mention members. Cached in Supabase for fast loading. |
| **How you could use it** | Primary community communication. Each channel (`/zao`, `/zabal`, `/cocconcertz`, `/wavewarz`) is a themed room. Pin important messages. Use trending feed to surface hot discussions. |
| **Key files** | `src/app/(auth)/chat/page.tsx`, `src/components/chat/ChatRoom.tsx`, `src/components/chat/ComposeBar.tsx`, `src/app/api/chat/send/route.ts` |
| **API endpoints** | 10 — send, messages, search, react, thread, hide, schedule, trending, assistant, minimax |
| **Components** | 16 — ChatRoom, Message, ComposeBar, SearchDialog, ThreadDrawer, ProfileDrawer, MentionAutocomplete, TrendingFeed, TutorialPanel, FAQ |

### 1.2 XMTP Private Messaging

| Field | Detail |
|-------|--------|
| **Name** | Encrypted DMs & Group Chats |
| **What it does** | End-to-end encrypted direct messages and private group chats via XMTP MLS protocol. No server can read messages. App-specific burner keys (not personal wallet keys). |
| **How you could use it** | Private 1-on-1 conversations between members. Create private group chats for task forces or working groups. All messages are E2E encrypted. |
| **Key files** | `src/app/(auth)/messages/page.tsx`, `src/components/messages/MessagesRoom.tsx`, `src/contexts/XMTPContext.tsx`, `src/lib/xmtp/client.ts` |
| **Components** | 7 — MessagesRoom, ConversationList, MessageCompose, GroupInfo, NewConversation, MessageThread, ConnectXMTP |

### 1.3 Notifications System

| Field | Detail |
|-------|--------|
| **Name** | Push Notifications |
| **What it does** | Web push notifications via VAPID. Subscribe to activity alerts — mentions, replies, governance votes, music submissions. In-app notification bell with unread count. |
| **How you could use it** | Members opt-in to push notifications for the activity types they care about. Admins can broadcast announcements to all subscribers. |
| **Key files** | `src/app/(auth)/notifications/page.tsx`, `src/components/navigation/NotificationBell.tsx`, `src/app/api/notifications/push-subscribe/route.ts`, `src/lib/push/vapid.ts` |
| **API endpoints** | 5 — push-subscribe, push-send, notifications, send, status |

### 1.4 Social Analytics Dashboard

| Field | Detail |
|-------|--------|
| **Name** | Social Analytics |
| **What it does** | Community engagement metrics: growth trends, engagement heatmaps, conversation clusters, taste matching between members, community graph visualization, trending topics, spotlight members, unfollower tracking. |
| **How you could use it** | Track community health. Find your most engaged members. Discover who shares music taste. See conversation clusters form. Spot members who are drifting away. |
| **Key files** | `src/app/(auth)/social/page.tsx`, `src/components/social/EngagementHeatmap.tsx`, `src/components/social/CommunityGraph.tsx`, `src/components/social/TasteMatch.tsx` |
| **API endpoints** | 11 — engagement, growth, clusters, heatmap, trending, suggestions, unfollowers, compare, taste-match, community-graph, spotlight |
| **Components** | 22 — analytics cards, leaderboards, heatmap, member map, taste match, conversation clusters, community graph, activity feed, spotlight, trending |

### 1.5 Global Search

| Field | Detail |
|-------|--------|
| **Name** | Global Search |
| **What it does** | Search across members, messages, music, and channels from a single search bar. Lazy-loaded for performance. |
| **How you could use it** | Quick access to anything in the app. Search by member name, song title, message content, or channel name. |
| **Key files** | `src/components/search/GlobalSearch.tsx`, `src/components/search/LazyGlobalSearch.tsx`, `src/components/search/GlobalSearchProvider.tsx` |

### 1.6 Issue Reporter

| Field | Detail |
|-------|--------|
| **Name** | In-App Bug Reporter |
| **What it does** | Floating feedback button on every page. Members report bugs or suggest features directly from the app. Creates GitHub issues automatically. |
| **How you could use it** | Community-driven QA. Members tap the button, describe the issue, and it lands in GitHub Issues with page context attached. |
| **Key files** | `src/components/feedback/IssueReporter.tsx`, `src/app/api/community/issues/route.ts` |

---

## 2. Music Platform

### 2.1 Multi-Platform Music Player

| Field | Detail |
|-------|--------|
| **Name** | Global Music Player |
| **What it does** | Plays music from 9 providers (YouTube, Spotify, Apple Music, Tidal, SoundCloud, Bandcamp, Audius, direct audio, Arweave). Dual-audio crossfade engine. MediaSession API integration (lock screen controls on all 8 actions). Wake Lock prevents screen sleep. Haptic feedback on mobile. |
| **How you could use it** | Paste any music link and it plays. Queue songs, crossfade between tracks, use the equalizer and waveform visualizer. Works from lock screen on mobile. |
| **Key files** | `src/providers/audio/PlayerProvider.tsx`, `src/providers/audio/HTMLAudioProvider.tsx`, `src/components/music/GlobalPlayer.tsx`, `src/components/music/QueuePanel.tsx` |
| **Components** | 66 total — GlobalPlayer, MusicPage, Playlists, Radio, Queue, Equalizer, Waveform, Trending, Submissions, Track-of-Day, Mint, Lyrics, Sparkline, Spectrum Visualizer, Top Curators, Collector, Ambient Mixer, Binaural Beats |
| **API endpoints** | 39 — playlists, radio, feed, search, submissions, track-of-day, collect, library, comments, metadata, mint, permaweb, curators, history, digest, resolve, scrobble, artists, listening-parties, frame |

### 2.2 ZAO Radio

| Field | Detail |
|-------|--------|
| **Name** | Community Radio Stations |
| **What it does** | Curated radio stations with community-submitted playlists. 3 default stations configured. Respect-weighted curation — members with more Respect have their submissions weighted higher in the rotation. |
| **How you could use it** | Listen to community-curated music on autopilot. Submit songs for rotation. Higher Respect = more influence on what plays. |
| **Key files** | `src/hooks/useRadio.ts`, `src/lib/music/curationWeight.ts`, `community.config.ts` (radio config) |

### 2.3 Song Submissions & Track of the Day

| Field | Detail |
|-------|--------|
| **Name** | Song Submit + Track of the Day |
| **What it does** | Members submit songs with context (why they're sharing). Community votes. Top-voted song becomes Track of the Day. Daily digest emails/notifications. |
| **How you could use it** | Daily music discovery ritual. Submit a track, write why it matters, vote on others' picks. The winner gets spotlighted for 24 hours. |
| **Key files** | `src/app/api/music/submissions/route.ts`, `src/app/api/music/track-of-day/route.ts`, `src/app/api/cron/daily-digest/route.ts` |

### 2.4 Playlists

| Field | Detail |
|-------|--------|
| **Name** | Community Playlists |
| **What it does** | Create, edit, and share playlists. Collaborative playlists where multiple members can add tracks. Playlist follows and likes. |
| **How you could use it** | Curate themed playlists (genre, mood, event). Share with the community. Collaborate on a playlist for a fractal call or event. |
| **Key files** | `src/app/api/music/playlists/route.ts`, `src/components/music/Playlists.tsx` |

### 2.5 Binaural Beats & Ambient Mixer

| Field | Detail |
|-------|--------|
| **Name** | Binaural Beats Generator |
| **What it does** | Web Audio API oscillators generate binaural beats at configurable frequencies. Ambient sound mixer layers nature sounds (rain, ocean, forest) over beats. Focus, relaxation, and meditation presets. |
| **How you could use it** | Focus mode during work sessions. Layer ambient sounds while listening to music. Use during coworking spaces for shared focus. |
| **Key files** | `src/components/music/BinauralBeats.tsx`, `src/components/music/AmbientMixer.tsx` |

### 2.6 Listening History & Scrobbling

| Field | Detail |
|-------|--------|
| **Name** | Listening History + Last.fm/ListenBrainz Scrobbling |
| **What it does** | Tracks every song played in ZAO OS. Scrobbles to Last.fm and ListenBrainz for cross-platform stats. View personal listening history with filters. |
| **How you could use it** | See what you've been listening to. Get your plays counted on Last.fm/ListenBrainz. Compare listening habits with other members. |
| **Key files** | `src/app/(auth)/music/history/page.tsx`, `src/app/api/music/scrobble/route.ts`, `src/lib/music/lastfm.ts`, `src/lib/music/listenbrainz.ts` |

### 2.7 Arweave Permanent Storage

| Field | Detail |
|-------|--------|
| **Name** | Permaweb Music Upload |
| **What it does** | Upload music (MP3, max 50MB) and artwork (max 5MB) to Arweave for permanent, censorship-resistant storage. UDL (Universal Data License) support. Atomic asset minting. |
| **How you could use it** | Store your music permanently on the permaweb. No hosting fees ever again. Attach licensing terms via UDL. Mint as collectible atomic assets. |
| **Key files** | `src/app/api/music/permaweb/route.ts`, `src/app/api/music/mint/route.ts`, `src/lib/music/arweave.ts` |

### 2.8 Music NFT Minting

| Field | Detail |
|-------|--------|
| **Name** | Music NFT Collector |
| **What it does** | Mint and collect music NFTs. Browse collectible tracks. Integration with on-chain music distribution. |
| **How you could use it** | Artists mint their tracks as NFTs. Fans collect them. Revenue splits via smart contracts. |
| **Key files** | `src/app/api/music/mint/route.ts`, `src/app/api/music/collect/route.ts`, `src/components/music/Collector.tsx` |

---

## 3. Live Audio/Video Spaces

### 3.1 Voice Rooms (Stream.io)

| Field | Detail |
|-------|--------|
| **Name** | Live Voice Rooms |
| **What it does** | Real-time voice rooms powered by Stream.io Video SDK (`audio_room` call type). Backstage mode for pre-show prep. Up to 100 participants. Noise cancellation. Emoji reactions. Room chat. Hand raise queue with numbered positions. |
| **How you could use it** | Host community calls, listening sessions, AMAs, workshops. 5 preconfigured rooms (General Hangout, Fractal Call, Music Lounge, Tech Talk, Coworking). Create custom rooms with slugs. |
| **Key files** | `src/app/spaces/[id]/page.tsx`, `src/components/spaces/RoomView.tsx`, `src/app/api/stream/rooms/route.ts`, `src/lib/spaces/roomsDb.ts` |
| **Components** | 51 — Room adapters (Stream, HMS, Audio), audio controls (Mic, Camera, Noise cancel), Transcription, Chat, Music panel, Participants, Broadcast, Hand-raise queue |
| **API endpoints** | 11 — rooms, token, sessions, leaderboard, chat, gate-check, hand-raise, song-requests, stats, tips, scheduled |

### 3.2 FISHBOWLZ (100ms)

| Field | Detail |
|-------|--------|
| **Name** | FISHBOWLZ Live Discussions |
| **What it does** | Fishbowl-style live discussions powered by 100ms SDK. Token-gated rooms (require ERC-20 balance on Base to join). Speaker tipping (send ETH during live rooms). Transcription and closed captions. Separate standalone deployment at fishbowlz.com. |
| **How you could use it** | Host focused discussions with a small group of speakers while a larger audience listens. Gate rooms to token holders. Tip speakers in real-time. Export transcripts after. |
| **Key files** | `src/app/fishbowlz/[id]/page.tsx`, `src/components/spaces/HMSFishbowlRoom.tsx`, `src/lib/fishbowlz/tokenGate.ts`, `src/app/api/fishbowlz/rooms/route.ts` |
| **API endpoints** | 11 — rooms, chat, events, gate-check, export, sessions, transcribe, transcripts, users, webhooks |

### 3.3 Scheduled Rooms

| Field | Detail |
|-------|--------|
| **Name** | Room Scheduling |
| **What it does** | Schedule rooms for future times. Countdown timer shows time until start. "Start Now" button for the host. RSVP system so members can indicate attendance. |
| **How you could use it** | Schedule your weekly fractal call, listening party, or AMA. Members RSVP and get notified when it starts. |
| **Key files** | `src/app/api/stream/rooms/route.ts` (start_room action), `src/components/events/CountdownTimer.tsx`, `src/app/api/spaces/rsvp/route.ts` |

### 3.4 RTMP Multistream Broadcast

| Field | Detail |
|-------|--------|
| **Name** | Multistream Broadcasting |
| **What it does** | Broadcast your ZAO space simultaneously to Twitch, YouTube, Kick, and Facebook via RTMP. OAuth-connected accounts. Start/stop broadcast from room controls. |
| **How you could use it** | Go live in ZAO and automatically stream to all your platforms. Reach your audience wherever they are. Manage targets from settings. |
| **Key files** | `src/lib/spaces/rtmpManager.ts`, `src/app/api/broadcast/start/route.ts`, `src/app/api/broadcast/targets/route.ts`, `src/components/settings/BroadcastSettings.tsx` |
| **API endpoints** | 3 — start, status, targets |

### 3.5 Screen Share & Recording

| Field | Detail |
|-------|--------|
| **Name** | Screen Share + Recording |
| **What it does** | Share your screen in any room. Record sessions for later playback. Recording URLs saved via webhook. |
| **How you could use it** | Share demos, presentations, or your DAW during music production sessions. Record fractal calls for members who couldn't attend. |
| **Key files** | `src/components/spaces/` (screen share controls), `src/app/api/stream/webhook/route.ts` (recording URL capture) |

### 3.6 Song Requests

| Field | Detail |
|-------|--------|
| **Name** | Live Song Requests |
| **What it does** | Listeners can request songs during a live room. Queue visible to the DJ/host. Integrated with the music player. |
| **How you could use it** | During a listening party, members request tracks. The host sees the queue and can play them in order. |
| **Key files** | `src/app/api/spaces/song-requests/route.ts`, `src/components/spaces/MusicPanel.tsx` |

### 3.7 Live Transcription

| Field | Detail |
|-------|--------|
| **Name** | Room Transcription & Captions |
| **What it does** | Real-time speech-to-text transcription in live rooms. Closed captions overlay. Export transcripts after the session ends. |
| **How you could use it** | Accessibility for hearing-impaired members. Create written summaries of discussions. Search past conversations by text. |
| **Key files** | `src/hooks/useLiveTranscript.ts`, `src/components/spaces/Transcription.tsx`, `src/app/api/fishbowlz/transcribe/route.ts` |

---

## 4. Governance & Reputation

### 4.1 Respect Leaderboard

| Field | Detail |
|-------|--------|
| **Name** | Respect Reputation System |
| **What it does** | On-chain reputation tokens (OG Respect on Optimism + ZOR). Leaderboard with multiple views: standard, mindshare, SongJam. Treemap visualization. Stats bar with total Respect, active members, recent events. |
| **How you could use it** | Track community standing. Members earn Respect through fractal participation. Higher Respect = more influence on curation, governance, and publishing thresholds. |
| **Key files** | `src/app/(auth)/respect/page.tsx`, `src/components/respect/Leaderboard.tsx`, `src/components/respect/Treemap.tsx`, `src/lib/respect/leaderboard.ts` |
| **On-chain** | OG Respect token + ZOR token on Optimism (addresses in `community.config.ts`) |

### 4.2 Snapshot Polls

| Field | Detail |
|-------|--------|
| **Name** | Weekly Priority Polls |
| **What it does** | Gasless voting via Snapshot (`zaal.eth` space). One-click poll creation with 10 preconfigured choices. Approval voting. Results displayed in governance dashboard. |
| **How you could use it** | Run weekly polls to prioritize community direction. Members vote without paying gas. Results are transparent and verifiable. |
| **Key files** | `src/components/governance/CreateWeeklyPoll.tsx`, `src/lib/snapshot/client.ts`, `src/app/(auth)/governance/page.tsx` |

### 4.3 ZOUNZ DAO (Nouns Builder)

| Field | Detail |
|-------|--------|
| **Name** | ZOUNZ On-Chain Governance |
| **What it does** | Nouns Builder DAO on Base chain. Daily NFT auctions fund the treasury. NFT holders create and vote on on-chain proposals. Governor, Token, Auction, Treasury contracts. |
| **How you could use it** | Bid on daily ZOUNZ NFTs. Submit proposals for treasury spending. Vote on community proposals. All fully on-chain. |
| **Key files** | `src/components/zounz/ZounzProposals.tsx`, `src/components/zounz/ZounzAuction.tsx`, `src/lib/zounz/contracts.ts`, `src/app/api/zounz/proposals/route.ts` |

### 4.4 Community Proposals

| Field | Detail |
|-------|--------|
| **Name** | Respect-Weighted Community Proposals |
| **What it does** | Members submit proposals in Supabase. Community votes weighted by Respect. After 7-day voting period, proposals passing 1000R threshold auto-publish to Farcaster + Bluesky + X. Comments and discussion on each proposal. |
| **How you could use it** | Propose changes, events, partnerships, or spending. Community weighs in with Respect-weighted votes. Approved proposals automatically broadcast to social platforms. |
| **Key files** | `src/app/api/governance/proposals/route.ts`, `src/app/api/governance/vote/route.ts`, `src/app/api/governance/comments/route.ts` |

### 4.5 Fractal Meetings

| Field | Detail |
|-------|--------|
| **Name** | Fractal Dashboard |
| **What it does** | Weekly governance meetings (Mondays 6pm EST, 90+ weeks running). Fibonacci-scored consensus process. Session tracking, member analytics, proposal submissions (frapps). Integrated with Discord bot (Python, existing infrastructure). |
| **How you could use it** | Participate in weekly fractals to earn Respect. Submit frapps (fractal apps/proposals). Track your contribution history and analytics. |
| **Key files** | `src/app/(auth)/fractals/page.tsx`, `src/app/api/fractals/sessions/route.ts`, `src/app/api/fractals/proposals/route.ts`, `src/app/api/fractals/member-analytics/route.ts` |
| **API endpoints** | 5 — proposals, sessions, member-analytics, webhooks |

### 4.6 Hats Protocol Roles

| Field | Detail |
|-------|--------|
| **Name** | On-Chain Role Management |
| **What it does** | Hats Protocol tree (ID 226 on Optimism) for on-chain role assignment. ERC-1155 role tokens. Visual hat tree, badge display, and hat manager. Role-based access control. |
| **How you could use it** | Assign community roles on-chain (Admin, Moderator, Curator, etc.). Roles are transferable, revocable, and composable. Use for gating access to features. |
| **Key files** | `src/components/hats/HatTree.tsx`, `src/components/hats/HatManager.tsx`, `src/components/hats/HatBadge.tsx`, `src/lib/hats/client.ts` |

---

## 5. Publishing & Distribution

### 5.1 Cross-Platform Publisher

| Field | Detail |
|-------|--------|
| **Name** | Multi-Platform Publishing Engine |
| **What it does** | Publish content to 8 platforms from one compose action: Farcaster, X (Twitter), Bluesky, Discord, Telegram, Threads, Lens, Hive. Content auto-normalized per platform (character limits, image handling, hashtags). Platform toggles let you pick targets. |
| **How you could use it** | Write once, publish everywhere. Approved governance proposals auto-publish. Manual broadcasts from admin. Per-platform content optimization handled automatically. |
| **Key files** | `src/lib/publish/broadcast.ts`, `src/lib/publish/normalize.ts`, `src/lib/publish/x.ts`, `src/lib/publish/bluesky.ts`, `src/lib/publish/discord.ts`, `src/lib/publish/telegram.ts`, `src/components/compose/PublishButton.tsx` |
| **API endpoints** | 10 — farcaster, discord, telegram, x, bluesky, threads, lens, hive, broadcast, status |

### 5.2 Farcaster Actions

| Field | Detail |
|-------|--------|
| **Name** | Farcaster Cast/Like/Recast/Follow |
| **What it does** | Direct Farcaster protocol actions via Neynar managed signers. Cast to any channel, like casts, recast, follow/unfollow users. All via API routes with session auth. |
| **How you could use it** | All social actions happen natively in ZAO OS. No need to switch to Warpcast or other clients. Cast from chat, react from feed. |
| **Key files** | `src/app/api/neynar/cast/route.ts`, `src/app/api/neynar/like/route.ts`, `src/app/api/neynar/recast/route.ts`, `src/app/api/neynar/follow/route.ts`, `src/lib/farcaster/neynarActions.ts` |

### 5.3 Bluesky Integration

| Field | Detail |
|-------|--------|
| **Name** | Bluesky Sync & Custom Feed |
| **What it does** | Cross-post to Bluesky via AT Protocol. Sync member Bluesky accounts. Custom feed generator. Labeler integration for content moderation. |
| **How you could use it** | Reach the Bluesky audience. Auto-mirror approved proposals. Build a ZAO-specific Bluesky feed. |
| **Key files** | `src/lib/bluesky/client.ts`, `src/lib/bluesky/feed.ts`, `src/lib/bluesky/labeler.ts`, `src/app/api/bluesky/` (4 endpoints) |

### 5.4 Twitch Integration

| Field | Detail |
|-------|--------|
| **Name** | Twitch Stream Controls |
| **What it does** | Control Twitch from ZAO OS: read chat, set stream markers, create clips, run polls and predictions, get stream info. OAuth-connected. |
| **How you could use it** | When broadcasting a ZAO space to Twitch, manage the Twitch side without leaving ZAO. Clip moments, run audience polls, mark highlights. |
| **Key files** | `src/app/api/twitch/chat/route.ts`, `src/app/api/twitch/clip/route.ts`, `src/app/api/twitch/poll/route.ts`, `src/app/api/twitch/prediction/route.ts`, `src/lib/twitch/client.ts` |
| **API endpoints** | 6 — chat, marker, clip, poll, prediction, stream-info |

---

## 6. Member Directory & Identity

### 6.1 Member Directory

| Field | Detail |
|-------|--------|
| **Name** | Community Directory |
| **What it does** | Browsable member directory with profiles. Slug-based profile URLs (`/members/username`). Search, filter, sort. Public view (no auth required) + authenticated view with more detail. |
| **How you could use it** | Find members by name, role, or interest. Public profiles for sharing outside ZAO. Internal profiles show Respect, roles, activity. |
| **Key files** | `src/app/(auth)/directory/page.tsx`, `src/app/(auth)/directory/[slug]/page.tsx`, `src/app/members/page.tsx`, `src/app/members/[username]/page.tsx` |
| **API endpoints** | 6 — profile, directory, nfts, info, messaging-prefs, wallet |

### 6.2 NFT Gallery

| Field | Detail |
|-------|--------|
| **Name** | Member NFT Gallery |
| **What it does** | Display a member's NFT collection on their profile. Pulls from connected wallets. |
| **How you could use it** | Showcase your music NFTs, ZOUNZ, and other collectibles on your ZAO profile. |
| **Key files** | `src/components/members/NFTGallery.tsx`, `src/app/api/members/nfts/route.ts` |

### 6.3 ENS Integration

| Field | Detail |
|-------|--------|
| **Name** | ENS Resolution & Subnames |
| **What it does** | Resolve ENS names. Request and assign ZAO ENS subnames (e.g., `member.zaal.eth`). |
| **How you could use it** | Use your ENS name as your ZAO identity. Claim a `*.zaal.eth` subname as a member perk. |
| **Key files** | `src/hooks/useENS.ts`, `src/lib/ens/resolve.ts`, `src/lib/ens/subnames.ts`, `src/app/api/ens/` (2 endpoints) |

### 6.4 Wallet Connection

| Field | Detail |
|-------|--------|
| **Name** | Multi-Chain Wallet Connect |
| **What it does** | Connect Ethereum wallets (RainbowKit/Wagmi) and Solana wallets. Used for auth (SIWE), governance voting, NFT minting, token gating. |
| **How you could use it** | Sign in with your wallet. Vote on proposals. Mint music NFTs. Tip speakers. All wallet actions in one connection. |
| **Key files** | `src/components/wallet/ConnectWalletButton.tsx`, `src/components/providers/RainbowKitWrapper.tsx`, `src/components/solana/SolanaWalletConnect.tsx`, `src/lib/wagmi/config.ts` |

### 6.5 Connected Platforms

| Field | Detail |
|-------|--------|
| **Name** | Platform Connections |
| **What it does** | Connect external accounts: Facebook, Twitch, YouTube, Kick, Last.fm, ListenBrainz, Lens. OAuth flows for each. Used for broadcasting, scrobbling, and cross-platform features. |
| **How you could use it** | Link your streaming accounts for scrobbling. Connect broadcast targets for multistreaming. Link Lens for cross-posting. |
| **Key files** | `src/app/(auth)/settings/page.tsx`, `src/components/settings/ConnectedPlatforms.tsx`, `src/app/api/auth/` (platform-specific OAuth routes) |

---

## 7. Admin & Moderation

### 7.1 Admin Dashboard

| Field | Detail |
|-------|--------|
| **Name** | Admin Control Panel |
| **What it does** | Full admin dashboard: user management, allowlist control, audit log, quick stats, dormant member detection, export data. Protected by FID-based admin check (`adminFids` in `community.config.ts`). |
| **How you could use it** | Manage community membership. Review audit logs. Export member data. Monitor community health metrics. |
| **Key files** | `src/app/(auth)/admin/page.tsx`, `src/app/(auth)/admin/members/page.tsx`, `src/components/admin/` (20 components) |
| **API endpoints** | 25 — users, allowlist, audit-log, broadcast, ens-subnames, dormant, discord-link, export, hidden-messages, poll-config, spaces-admin, quick-stats, respect-sync |

### 7.2 Allowlist Gating

| Field | Detail |
|-------|--------|
| **Name** | Community Access Gate |
| **What it does** | Allowlist-based access control. Members must be on the allowlist (CSV import: name + wallet) to access protected routes. Progressive auth: wallet first, then Farcaster, then XMTP. |
| **How you could use it** | Control who can access your community. Import members from CSV. Gate by wallet address, FID, or NFT ownership. |
| **Key files** | `src/lib/gates/allowlist.ts`, `src/middleware.ts`, `src/app/not-allowed/page.tsx` |

### 7.3 AI Content Moderation

| Field | Detail |
|-------|--------|
| **Name** | Perspective API Moderation |
| **What it does** | Automatic content safety scoring via Google's Perspective API. Scores messages for toxicity, threats, profanity, identity attacks. Moderation queue for flagged content. |
| **How you could use it** | Auto-flag harmful content before it appears. Review flagged messages in the moderation queue. Adjust sensitivity thresholds. |
| **Key files** | `src/lib/moderation/moderate.ts`, `src/app/api/moderation/queue/route.ts` |

### 7.4 Rate Limiting

| Field | Detail |
|-------|--------|
| **Name** | API Rate Limiter |
| **What it does** | Middleware-based per-IP rate limiting on all API routes. Prevents abuse and protects external API budgets (Neynar credits, etc.). |
| **How you could use it** | Automatic — protects all endpoints. Configure limits in middleware. |
| **Key files** | `src/middleware.ts`, `src/lib/rate-limit/` |

### 7.5 Audit Log

| Field | Detail |
|-------|--------|
| **Name** | Activity Audit Trail |
| **What it does** | Logs admin and sensitive actions: user changes, moderation decisions, config updates. Searchable and exportable. |
| **How you could use it** | Accountability and transparency. Review who did what and when. Export for governance reporting. |
| **Key files** | `src/lib/db/audit-log.ts`, `src/app/api/admin/audit-log/route.ts` |

### 7.6 Discord Integration

| Field | Detail |
|-------|--------|
| **Name** | Discord Bridge |
| **What it does** | Sync members between ZAO OS and Discord. Mirror events, proposals, voting, and intros. Fractal-live updates. Member stats cross-referenced. |
| **How you could use it** | Bridge your existing Discord community to ZAO OS. Members linked across platforms. Activity synced both ways. |
| **Key files** | `src/lib/discord/client.ts`, `src/app/api/discord/` (8 endpoints — sync, events, proposals, voting, intros, member-stats, fractal-live, link) |

---

## 8. Developer & AI Tools

### 8.1 AI Assistant (APO)

| Field | Detail |
|-------|--------|
| **Name** | Community AI Assistant |
| **What it does** | AI-powered assistant using Minimax LLM. Context-aware — recalls community context, member history, and past conversations. Memory system with retain/recall/reflect cycle (Hindsight-inspired). |
| **How you could use it** | Ask questions about the community, get help navigating features, summarize discussions, get music recommendations based on community taste. |
| **Key files** | `src/app/(auth)/assistant/page.tsx`, `src/lib/apo/engine.ts`, `src/lib/apo/minimax.ts`, `src/app/api/memory/` (4 endpoints — recall-user, recall-community, reflect, retain) |

### 8.2 Farcaster Mini App

| Field | Detail |
|-------|--------|
| **Name** | Farcaster Mini App |
| **What it does** | ZAO OS as a Farcaster Mini App. Quick Auth login. Embedded in Farcaster clients. Webhook for notifications. |
| **How you could use it** | Access ZAO OS directly inside Warpcast and other Farcaster clients without leaving the app. |
| **Key files** | `src/app/miniapp/page.tsx`, `src/hooks/useMiniApp.ts`, `src/components/miniapp/MiniAppGate.tsx`, `src/app/api/miniapp/` (auth + webhook) |

### 8.3 Now Playing Overlay

| Field | Detail |
|-------|--------|
| **Name** | OBS/Stream Overlay |
| **What it does** | Real-time "Now Playing" overlay for streamers. Shows current track, album art, and progress. Syncs via custom hook. |
| **How you could use it** | Add to OBS or streaming software. Shows what you're listening to in ZAO OS on your stream. |
| **Key files** | `src/app/overlay/now-playing/page.tsx`, `src/hooks/useOverlaySync.ts` |

### 8.4 Cron Jobs

| Field | Detail |
|-------|--------|
| **Name** | Automated Tasks |
| **What it does** | 6 scheduled jobs: daily music digest, engagement collection, follower snapshots, health monitoring, weekly reflection, ZOUNZ event tracking. |
| **How you could use it** | Runs automatically. Daily digest sends music highlights. Engagement data collected for analytics. Health snapshots track community metrics over time. |
| **Key files** | `src/app/api/cron/daily-digest/route.ts`, `src/app/api/cron/engagement-collect/route.ts`, `src/app/api/cron/follower-snapshot/route.ts`, `src/app/api/cron/health-snapshot/route.ts`, `src/app/api/cron/weekly-reflection/route.ts`, `src/app/api/cron/zounz-events/route.ts` |

### 8.5 PWA (Progressive Web App)

| Field | Detail |
|-------|--------|
| **Name** | Installable PWA |
| **What it does** | ZAO OS installs as a native-feeling app on mobile and desktop. Offline page. Service worker registration. Install prompt. Pull-to-refresh. |
| **How you could use it** | "Add to Home Screen" on mobile for app-like experience. Works offline (basic pages). Push notifications. |
| **Key files** | `src/components/pwa/ServiceWorkerRegistration.tsx`, `src/components/navigation/PWAInstallPrompt.tsx`, `src/app/offline/page.tsx` |

---

## Comparison: ZAO Tool Box vs Other Community Platforms

| Feature | ZAO OS | Discord | Farcaster (Warpcast) | Guild.xyz | Lens Orb |
|---------|--------|---------|---------------------|-----------|----------|
| **Chat channels** | Farcaster-native + XMTP encrypted | Native voice/text | Cast-based | No chat | Lens posts |
| **Music player** | 9-provider, crossfade, radio, scrobbling | Spotify bot | None | None | None |
| **Live audio rooms** | Stream.io + 100ms, RTMP multistream | Stage Channels | None | None | None |
| **On-chain governance** | 3-tier (ZOUNZ + Snapshot + Respect-weighted) | None | None | Snapshot only | None |
| **Cross-platform publishing** | 8 platforms from 1 compose | None | Farcaster only | None | Lens only |
| **Reputation system** | On-chain Respect tokens | Role-based | None | XP points | None |
| **Token gating** | Allowlist + NFT + ERC-20 + Hats | Guild.xyz plugin | None | Native | None |
| **Open source / forkable** | Yes — change `community.config.ts` | No | Partially (Neynar) | No | Yes |
| **Self-hosted** | Next.js on Vercel | No | No | No | Partially |

---

## ZAO OS Integration

This document catalogs the entire built surface area of ZAO OS:

- **Entry point:** `community.config.ts` — all branding, channels, contracts, nav
- **App pages:** `src/app/` — 41 pages across 5 nav pillars + public routes
- **API surface:** `src/app/api/` — 269 endpoints across 27+ feature clusters
- **Component library:** `src/components/` — 258 components across 30+ feature folders
- **Hooks:** `src/hooks/` — 18 custom hooks for auth, chat, music, rooms, mobile
- **Libraries:** `src/lib/` — 94 modules across 35+ domain folders
- **Providers:** `src/providers/` — 8 audio providers + analytics + wallet/auth

**Fork-friendly architecture:** A new community can clone ZAO OS, edit `community.config.ts` (name, colors, channels, contracts, admin FIDs), and have a fully functional community OS with all 47 tools operational.

---

## What's Being Built Right Now (April 2026)

| Feature | Status | Last Commit |
|---------|--------|-------------|
| **FISHBOWLZ polish** | Active — push 2 of 4 complete | `64126ed` (Apr 6) |
| **In-app issue reporter** | Shipped | `b47ea01` (Apr 6) |
| **Scheduled rooms** | Shipped | `45283ea` (Apr 5) |
| **Token-gated rooms (Base ERC-20)** | Shipped | `be3c031` (Apr 4) |
| **Speaker tipping (ETH)** | Shipped | `3cb4600` (Apr 4) |
| **Performance optimizations** | Shipped | `538720c` (Apr 5) — lazy loading, next/image, staleTimes |
| **FISHBOWLZ standalone deploy** | Active | fishbowlz.com, Privy auth |

---

## Sources

- [ZAO OS GitHub Repository](https://github.com/bettercallzaal/zao-os) — source code
- [Next.js 16 Documentation](https://nextjs.org/docs) — framework
- [Stream.io Video SDK](https://getstream.io/video/docs/) — voice/video rooms
- [100ms Documentation](https://www.100ms.live/docs) — FISHBOWLZ rooms
- [Neynar Documentation](https://docs.neynar.com) — Farcaster API
- [Supabase Documentation](https://supabase.com/docs) — database
- [Snapshot Documentation](https://docs.snapshot.org) — gasless voting
- [Hats Protocol](https://docs.hatsprotocol.xyz) — on-chain roles
- [XMTP Documentation](https://xmtp.org/docs) — encrypted messaging
- [Arweave Documentation](https://arwiki.wiki) — permanent storage
