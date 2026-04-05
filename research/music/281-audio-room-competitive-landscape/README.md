# 281 — Audio Room Competitive Landscape 2026

> **Status:** Research complete
> **Date:** 2026-04-04
> **Goal:** Map the full competitive landscape for audio room products — what worked, what died, and what ZAO FISHBOWLZ can learn from each

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Clubhouse lesson** | DO NOT build around synchronous drop-in as the core loop — Clubhouse's pivot to async "Chats" in 2023 confirms that ephemeral synchronous audio fails to retain users long-term. FISHBOWLZ's persistent room model is the right call. |
| **X Spaces lesson** | SKIP trying to compete on audience reach/discovery — X Spaces wins because Twitter's 300M+ user distribution is the moat, not the audio feature. ZAO wins on community depth, not breadth. |
| **Discord Stage lesson** | BORROW the speaker/audience separation pattern (stage + audience split) and text chat alongside audio — Discord added text chat to Stage Channels because audio-only rooms needed it. ZAO already has FishbowlChat. |
| **Huddle01 lesson** | MONITOR but don't integrate yet — dRTC at 95% cheaper than AWS is compelling, but last node sale was October 2024 and SDK maturity is unclear for production. Revisit in 6 months. |
| **Rally lesson** | DO NOT treat Rally as competition — last commit was June 2023, 47 stars, project is dormant. It's a reference implementation (MIT-adjacent GPL-3.0), not a live competitor. |
| **Farcaster native audio** | INTEGRATE as a Mini App — FC Audio Chat mini app already exists on Farcaster (Clubhouse-style). ZAO should build FISHBOWLZ as a Farcaster Mini App to enable in-feed room joining without leaving the client. |
| **Spotify/Amazon lesson** | SHIP async-first, not sync-first — both failed because synchronous audio requires users to be available at a specific time. FISHBOWLZ's persistent rooms + transcript archive solves this. |
| **Pricing provider** | KEEP Stream.io for production (333,000 free participant minutes/month = 5,550 hours free), switch to Daily.co when FISHBOWLZ scales beyond Stream's free tier. |

## Platform Status Table

| Platform | Status (Apr 2026) | Peak | Key Failure | Lesson for ZAO |
|----------|-------------------|------|-------------|----------------|
| **Clubhouse** | Alive, pivoted to async | $4B valuation, 10M downloads (early 2021) | Couldn't retain post-pandemic; 50%+ layoffs April 2023 | Async voice outlasts synchronous drop-in |
| **X Spaces** | Alive, growing | 350M+ user distribution advantage | Monetization unclear; ticketed spaces underused | Distribution moat beats product quality |
| **Discord Stage** | Alive, feature of Discord | 500M registered users (2025) | Not standalone; 50-person video cap even at Tier 3 | Stage + audience split is the right UX pattern |
| **Huddle01** | Alive, web3 infra play | 46,900 node sale Oct 2024 | Complex token model; unclear SDK production maturity | dRTC is future, not ready today |
| **Rally (letsrally.fm)** | Dead (dormant since June 2023) | 47 GitHub stars | No traction, complex web3 stack, no marketing | Open-source reference only |
| **Spotify Greenroom / Live** | Dead (April 30, 2023) | 275,000 iOS downloads | Entered market as pandemic-era hype was dying; only 275K downloads | Don't launch synchronous audio into a dying trend |
| **Amazon Amp** | Dead (October 2023) | ~700,000 MAU at peak | Couldn't sustain growth despite Nicki Minaj, Pusha T launch | Creator funds don't substitute for product-market fit |
| **Farcaster Mini Apps** | Alive, growing | FC Audio Chat mini app live 2025 | No ZAO-specific audio room yet | FISHBOWLZ should be a Mini App |

## Provider Pricing Comparison

| Provider | Free Tier | Audio $/1000 min | Participant Limit | Persistent Rooms | Already in ZAO |
|----------|-----------|-----------------|-------------------|-----------------|----------------|
| **Stream.io** | 333,000 min/mo (~5,550 hrs free) | $0.30 | Millions (audio broadcast mode) | No (15-min session timeout) | YES — Spaces + FISHBOWLZ |
| **LiveKit Cloud** | 5,000 WebRTC min/mo, 100 concurrent | $4.00 (audio track) | 5,000 concurrent (Scale plan) | No (workaround needed) | No |
| **100ms HMS** | 10,000 min/mo | ~$4.00 | 10,000 participants | No (session-based) | YES — Spaces alt, FISHBOWLZ MVP |
| **Daily.co** | 2,000 min/day (~60K/mo) | $0.99 | 100,000 audio-only, 25 active mics | YES (default, rooms persist forever) | No |
| **Huddle01 dRTC** | $250 credit (new accounts) | ~$0.05 (95% cheaper than AWS claim) | 10,000 peers (SDK 2.0) | Unknown | No |

**Note:** Stream.io's 333,000 free minutes/month is by far the most generous free tier for ZAO's scale (100-member community). At 2 hrs/week average room time with 10 participants, ZAO would use ~87 hrs/month = 52,200 participant minutes — well under the free tier.

## Clubhouse Deep Dive

| Metric | Data |
|--------|------|
| Peak valuation | $4 billion (2021) |
| Peak downloads | 10 million (Feb 2021) |
| Funding raised | $310 million |
| Weekly active users (2025) | ~15 million (sources vary) |
| Monthly active users (2025) | ~36.5 million (sources vary) |
| Avg session length | 12.4 minutes |
| April 2023 layoffs | >50% of staff cut |
| Current product direction | Async "Chats" (voice messages, push-to-talk, 2x speed playback) |

**What worked:** Audio-only (no video pressure), speaker/audience separation, invite-only exclusivity drove FOMO, Android launch in May 2021.

**What failed:** Synchronous format required all participants online simultaneously. Post-pandemic, "long conversations" stopped fitting daily life. Competitors (Twitter, LinkedIn, Spotify) shipped audio rooms within months of Clubhouse's rise.

**The pivot:** "Clubhouse 2.0" = voice messaging app. Asynchronous by design. Users push-to-talk, others listen at 2x speed, tap to skip. This is the "voice Discord" model — closer to WhatsApp voice notes than live audio rooms.

**ZAO takeaway:** FISHBOWLZ's transcript archive + persistent room record is the right move. The room exists whether or not anyone is in it.

## X Spaces Deep Dive

| Metric | Data |
|--------|------|
| Monetization: ticket price range | $1–$999 per ticket |
| X Subscriptions pricing | $2.99, $4.99, or $9.99/month |
| Total creator payouts to date | $45 million+ |
| Revenue pool growth | 2x+ in 2025 due to X Premium subscriptions |
| Spaces: max speakers | 11 (1 host + 10 co-hosts) |
| Spaces: max listeners | Unlimited |

**What works:** Existing 300M+ user base means discoverability is solved. Celebrity/journalist adoption was organic. No separate app install required.

**What failed:** Ticketed Spaces had paused testing in some regions. Monetization is inconsistent. Audio quality complaints. No persistent room concept — Spaces end when the host ends them.

**ZAO takeaway:** ZAO's gating model (Respect-weighted, community members only) creates the intimacy that X Spaces can't — 100 members know each other. Discovery is not the problem; depth is the differentiator.

## Discord Stage Channels Deep Dive

| Metric | Data |
|--------|------|
| Discord MAU (2025) | 500+ million registered users |
| Stage Channel audio-only capacity | 10,000 participants |
| Stage Channel video capacity | 50 people (base), 150 (Tier 2), 300 (Tier 3) |
| Avg user daily time on Discord | 94 minutes |
| College-age daily time | 117 minutes |
| Voice activity growth in non-gaming servers | 19% increase |

**What works:** Speaker/audience split with moderator control. Text chat alongside audio. Scheduled events with discovery. Video + screen share in same channel.

**Limitations:** Not standalone — requires a Discord server. Video severely capped at lower tiers. No persistent room transcript. No async fallback. No token gating.

**ZAO takeaway:** BORROW the dual-pane layout (speakers grid + audience row + chat panel). ZAO's `FishbowlChat.tsx` + `HMSFishbowlRoom.tsx` already implements this correctly. Add scheduled room display to match Discord's event visibility.

## Huddle01 Web3 Audio Deep Dive

| Metric | Data |
|--------|------|
| Node sale size | 46,900 Media Nodes |
| Node price | Starting at $320 each |
| SDK max peers | 10,000 (SDK 2.0) |
| Cost vs AWS | Claims 95% cheaper |
| HUDL token | Native dRTC network token; staking, node rewards, payments |

**Architecture:** DePIN (Decentralized Physical Infrastructure Network) — users run Media Nodes instead of AWS/GCP servers. HUDL token pays node operators. Multi-streaming to X, YouTube, Twitch built in. Token-gating and wallet login native.

**Current status:** Active as of 2025. Phala Network partnership for privacy-preserving RTC. But production SDK maturity and reliability are unproven at scale.

**ZAO takeaway:** The wallet-login + token-gating native integration aligns with ZAO's architecture. INVESTIGATE Huddle01 SDK v2.0 for FISHBOWLZ v2 — but only after FISHBOWLZ v1 ships and proves demand.

## Rally (letsrally.fm) Deep Dive

| Metric | Data |
|--------|------|
| GitHub stars | 47 |
| Last commit | June 23, 2023 |
| Total commits | 24 |
| License | GPL-3.0 |
| Stack | Next.js, LiveKit, Lens Protocol, Lit Protocol, Guild SDK, IPFS |

**Status:** Dormant. 2 open issues, 1 PR, no maintainer activity since mid-2023. Alpha still accessible at `alpha.letsrally.fm` but effectively abandoned.

**ZAO takeaway:** Rally's architecture is a reference for "what a web3 audio room looks like with Lens + LiveKit," but GPL-3.0 license means code cannot be copied directly. Study the patterns, don't fork it.

## Farcaster Native Audio

**FC Audio Chat Mini App:** A Clubhouse/Spaces-style mini app exists within Farcaster (accessible at warpcast.com/~/mini-apps). Users can create or join audio chats without leaving the Farcaster client.

**Mini Apps as the delivery mechanism:** Frames v2 rebranded to Mini Apps in early 2025. Mini Apps are full web apps embedded in the Farcaster feed — wallet-aware, context-aware, persistent (users can save + get notified).

**ZAO opportunity:** SHIP FISHBOWLZ as a Farcaster Mini App. This means:
1. Users see a live fishbowl room in their ZAO feed as a cast
2. They tap to join without navigating to zaoos.com
3. Room state updates live in the Mini App frame
4. Cast the room URL automatically creates a joinable embed

The relevant file to modify is `src/lib/fishbowlz/castRoom.ts` — this already handles casting rooms to Farcaster. Adding Mini App metadata to the room cast URL is the missing piece.

## Spotify Greenroom / Live — Post-Mortem

| Metric | Data |
|--------|------|
| Acquisition | Betty Labs acquired for $50 million (March 2021) |
| Launch as Spotify Greenroom | June 16, 2021 |
| Renamed | Spotify Live (April 2022) |
| Shutdown | April 30, 2023 |
| Total iOS downloads | 275,000 globally |
| Creator fund | Shut down April 2022 (before the app itself) |

**Root cause of failure:** Synchronous audio requires the audience to be available at a specific time. Spotify's strength is async — playlists, podcasts, algorithmic discovery. Live audio was a different consumption pattern their users didn't want from Spotify.

**Key quote from Spotify:** *"We believe there is a future for live fan-creator interactions in the Spotify ecosystem; however, based on our learnings, it no longer makes sense as a standalone app."* They identified "listening parties" as the promising format before shutting down.

**ZAO takeaway:** Listening parties (async + scheduled) are the validated Spotify insight. FISHBOWLZ's fishbowl-format conversation rooms combine this with structured discussion. The "listening party" mini-format should be a room type option in FISHBOWLZ.

## Amazon Amp — Post-Mortem

| Metric | Data |
|--------|------|
| Launch | March 2022 |
| Shutdown | October 2023 |
| Lifetime | ~18 months |
| MAU at peak | ~700,000 (Amazon disputed this) |
| Creator fund size | "Millions of dollars" (September 2022) |

**Root cause of failure:** DJ/radio format (host plays music + commentary) failed to differentiate from Spotify, Apple Music, and Twitch. Creator fund couldn't substitute for organic demand. Post-pandemic live audio fatigue.

**Notable launch partners:** Nicki Minaj, Pusha T, Travis Barker. Star power didn't drive retention.

**ZAO takeaway:** Creator funds are table stakes, not differentiators. The fishbowl format is more interesting than "DJ with commentary" because it forces rotation, democratic participation, and structured conversation — not just passive listening.

## Persistent Audio Room Concept

The "persistent audio room" model (async audio that outlives the session) is not a mainstream product category yet — most platforms treat audio as ephemeral. The key products that approximate it:

| Approach | Product | How Persistent | ZAO Analog |
|----------|---------|----------------|------------|
| Async voice messages | Clubhouse Chats (2023) | Messages stay; async playback | Not yet built |
| Permanent room URL | Daily.co rooms | Room lives forever, can be rejoined | FISHBOWLZ room record in Supabase |
| Recorded archive | Discord Stage + Stream.io | Recording stays, live session ends | `transcripts/route.ts` + future recordings |
| Transcript-first | FISHBOWLZ (ZAO) | Transcript persists; audio session ephemeral | `src/app/api/fishbowlz/transcripts/route.ts` |

**ZAO's differentiator:** FISHBOWLZ is the only product in this landscape that stores a conversation transcript tied to a persistent room record that can be rejoined. The room is always "alive" even when no one is in it.

## Audio Room UI Patterns (Best Practices)

| Pattern | Example | ZAO Implementation |
|---------|---------|-------------------|
| Speaker grid (avatars + mic indicator) | Clubhouse, X Spaces | `HMSFishbowlRoom.tsx` — hot seat grid |
| Audience row (smaller, below stage) | Discord Stage, Clubhouse | Listeners section in fishbowl room |
| Hand raise queue | X Spaces, Discord Stage, Stream.io | `src/components/spaces/HandRaiseQueue.tsx` |
| Emoji reactions (floating, ephemeral) | Clubhouse, X Spaces | `src/components/spaces/RoomChat.tsx` |
| Inline text chat | Discord Stage (added 2022) | `src/components/spaces/FishbowlChat.tsx` |
| Topic display / title bar | X Spaces | Room title + description in FISHBOWLZ |
| Speaker speaking indicator (waveform ring) | All platforms | 100ms HMS SDK provides this natively |
| Rotation indicator / timer | Unique to fishbowl format | TODO — not yet built in FISHBOWLZ |
| Schedule/upcoming display | Discord Events, X Spaces | `src/components/spaces/ScheduledRooms.tsx` |
| One-tap join from feed | Farcaster Mini Apps | `src/lib/fishbowlz/castRoom.ts` — needs Mini App metadata |

## ZAO OS Integration

FISHBOWLZ is built. The competitive research surfaces 4 actionable next steps:

1. **Mini App metadata** — modify `src/lib/fishbowlz/castRoom.ts` to add Farcaster Mini App embed metadata to room casts, enabling one-tap join from the Farcaster feed
2. **Rotation timer** — add timer-based auto-rotation to `src/app/api/fishbowlz/rooms/[id]/route.ts` (rotate_in action already exists, needs a cron trigger)
3. **Listening party room type** — add a "listening party" mode alongside fishbowl in `src/app/fishbowlz/page.tsx` room creation modal (validated by Spotify's post-mortem)
4. **Nav link** — add FISHBOWLZ to `src/components/navigation/BottomNav.tsx` (known issue #4 from Doc 277)

The existing Stream.io integration in `src/app/api/stream/` provides 333,000 free participant minutes/month — enough to run FISHBOWLZ at ZAO's scale indefinitely on the free tier.

## Sources

- [Clubhouse Statistics 2026 — Business of Apps](https://www.businessofapps.com/data/clubhouse-statistics/)
- [Clubhouse Layoffs & Reset — TechCrunch](https://techcrunch.com/2023/04/27/clubhouse-needs-to-fix-things-and-today-it-cut-more-than-half-of-staff/)
- [The New Clubhouse — Clubhouse Blog](https://blog.clubhouse.com/the-new-clubhouse/)
- [X Declares 2026 Year of the Creator](https://quasa.io/media/x-declares-2026-the-year-of-the-creator-revamped-monetization-and-ongoing-experiments)
- [Twitter Ticketed Spaces & Super Follows — TechCrunch](https://techcrunch.com/2021/06/22/twitter-super-follows-and-ticketed-spaces/)
- [Discord Stage Channels FAQ](https://support.discord.com/hc/en-us/articles/1500005513722-Stage-Channels-FAQ)
- [Discord Statistics 2026 — The Social Shepherd](https://thesocialshepherd.com/blog/discord-statistics)
- [Huddle01 Node Sale — DePIN Scan](https://depinscan.io/news/2024-10-24/huddle01-launches-node-sale-to-transform-decentralized-communications)
- [Huddle01 Homepage](https://huddle01.com/)
- [Rally GitHub — rallydotfm/rally](https://github.com/rallydotfm/rally)
- [Spotify Live Shutdown — TechCrunch](https://techcrunch.com/2023/04/03/spotify-is-shutting-down-its-live-audio-app-spotify-live/)
- [Spotify Greenroom Creator Fund — TechCrunch](https://techcrunch.com/2022/04/19/spotify-closed-down-its-greenroom-creator-fund-with-shift-in-live-audio-strategy/)
- [Amazon Amp Shutdown — TechCrunch](https://techcrunch.com/2023/10/05/amazon-shutters-its-live-radio-app-amp/)
- [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
- [LiveKit Pricing](https://livekit.com/pricing)
- [Stream.io Audio & Video Pricing](https://getstream.io/video/pricing/)
- [Stream.io Audio Room API](https://getstream.io/video/audio-rooms/)
- [Doc 277 — FISHBOWLZ Audio Providers & Architecture](../../music/277-fishbowlz-audio-providers/)
