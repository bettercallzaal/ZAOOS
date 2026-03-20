# 88 — Music-First Social Platform Redesign Research

> **Note:** Folder is named `82-music-social-platform-redesign` due to numbering collision. Canonical number is **88**.

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Research the best music-focused social platforms in 2026. Redesign ZAO OS from "chat client with music features" into "THE social media platform for music communities."
> **Builds on:** Doc 03 (Music Integration), Doc 79 (SongJam Research), Doc 73 (Farcaster Ecosystem 2026)

## Key Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Core identity shift** | Music feed becomes the HOME screen, not chat. Every screen should have music context. |
| **Feed redesign** | Borrow Sonata's music-card-in-feed + SoundCloud's waveform comments + Zora's "Friends collected" social proof |
| **Discovery model** | Hybrid: curated channels (Are.na model) + social graph (Sonata/SoundCloud reposts) + trending (algorithmic) |
| **Social listening** | Build "Listening Rooms" (Spotify Jam meets Farcaster) + "Now Playing" presence across the app |
| **Curation economy** | Respect-weighted curation (not just upvotes). High-Respect curators shape what surfaces. |
| **Content-as-value** | Borrow Zora's "every post is tradeable" concept for music shares — collecting = supporting |

---

## Platform-by-Platform Analysis

### 1. Sonata / Coop Records (Farcaster Music Client)

**What it is:** A Farcaster client that aggregates all music links shared across Farcaster into a single trending feed. Built by Coopahtroopa's Coop Records. Open source, Next.js + Supabase (same stack as ZAO OS).

**How music is DISPLAYED:**
- Music links (Spotify, SoundCloud, Sound.xyz) shared in any Farcaster cast appear as **music cards** in a ranked feed
- Cards show: album art, track name, artist, platform badge, upvote count
- No inline playback in the feed itself — clicking opens the source platform
- The feed IS the product. No chat, no profiles, no DMs. Pure music curation.

**How people DISCOVER:**
- **Trending feed** ranked by Farcaster likes (likes on any Farcaster client count as upvotes on Sonata)
- **Channel-based** discovery (e.g., /music, /salsa — each Farcaster channel has its own trending view)
- Cross-client interop is the killer feature: a like on Warpcast = an upvote on Sonata. The music social graph spans all of Farcaster.

**How listening is SOCIAL:**
- **NOTES token** — every upvote = 10 NOTES to the curator who shared the track
- Daily allowance model (like DEGEN): curators earn NOTES for sharing, calculated by post frequency, timing, and engagement
- Tipping: users can tip NOTES or DEGEN directly to curators in real-time (L3 on Base via Stack)
- 1B total supply, 150M genesis airdrop. Curators are economically rewarded for taste.

**What makes it 2026:**
- Token-incentivized curation (not just vibes — your taste earns you tokens)
- Cross-client social graph (not siloed to one app)
- Sonata Pro subscription via Hypersub (onchain recurring payments)

**Design patterns to steal:**
1. **Music card as the atomic unit** — not a text post with a link, but a proper music card with art, metadata, play affordance
2. **Cross-client like aggregation** — any Farcaster like counts. The social graph is the protocol, not the app.
3. **Daily curation allowance** — gamifies sharing without being spammy. You have limited "votes" per day.
4. **Channel-as-genre** — Farcaster channels become genre rooms

**Limitations to avoid:**
- No inline playback (ZAO OS already has this — major advantage)
- No persistent player (ZAO OS already has this)
- No social features beyond upvoting (no profiles, comments, DMs)
- No discovery beyond trending (no recommendations, no "because you liked X")

---

### 2. Sound.xyz (Shut Down January 16, 2026)

**What it was:** The premier music NFT platform. Artists dropped songs as limited-edition NFTs with "listening parties" — live drop events where fans raced to collect.

**How music was DISPLAYED:**
- **Full-page artist drop pages** — hero artwork, waveform player, countdown timer
- Comments pinned to specific timestamps on the waveform (like SoundCloud)
- "Audience" section showing NFT holders as profile pics, ordered by who collected first
- The visual metaphor: a concert audience. First collectors = front row. Late = back.

**How people DISCOVERED:**
- **Drop schedule** — curated calendar of upcoming releases
- **Social proof** — "Collected by [notable person]" badges
- **Listening parties** — live events with countdown timers creating urgency

**How listening was SOCIAL:**
- **Gamified collecting** — earlier you buy = more prominent your profile pic in the "audience"
- **Timestamp comments** — annotate specific moments in the track (the only feature the founder insisted on for MVP)
- **Story behind the song** — artists wrote liner notes explaining the track (also an MVP requirement)
- **Audience visualization** — profile pics arranged like a concert crowd, creating visual proof of community

**What worked (lessons from shutdown):**
- The **listening party format** created real-time social moments around music (not just passive consumption)
- **Timestamp comments** made engagement feel music-specific, not generic social media
- **Visual audience** made collecting feel like attending — not just buying a token
- **Artist story/liner notes** gave context that streaming platforms never provide

**What failed:**
- NFT-only model limited audience to crypto-native users
- No free listening tier — you had to collect (pay) to engage
- Market dependency — when NFT market cooled, the platform had no fallback
- Team pivoted to Vault.fm (subscription-based artist-fan platform, direct messaging + exclusive content)

**Design patterns to steal:**
1. **Timestamp reactions** — let users drop emoji/reactions at specific moments in a track's waveform. Not just comments — lightweight "this part goes hard" markers.
2. **Audience visualization** — show who's listened/collected as a visual crowd, not a number. Profile pics > "423 plays"
3. **Artist liner notes** — every shared track should have space for "why I'm sharing this" context
4. **Drop/premiere events** — scheduled listening moments with countdown, not just passive feed

---

### 3. Audius (Decentralized Streaming Platform)

**What it is:** The largest decentralized music streaming platform. Free to use, artist-owned, with $AUDIO token governance.

**How music is DISPLAYED:**
- **Full streaming player** with waveform visualization
- Track pages with play count, favorites, reposts, comments
- Artist pages with discography, playlists, supporter lists
- Explore page: featured playlists, trending tracks, genre categories

**How people DISCOVER:**
- **Trending** algorithm based on plays, favorites, reposts, follows
- **Explore page** redesigned (2025) with featured contests, curated playlists, spotlighted artists and labels
- **Advanced search filters** for power users across full catalog
- **Remix contests** — artists upload stems, community creates remixes, up to 5 winners selected

**How listening is SOCIAL:**
- **Artist Coins** (launched October 2025) — verified artists launch their own Solana-based coins. Fans who hold coins get: exclusive music, private Discord access, app-wide badges, leaderboards, private messages from artists
- **Fan Recognition** (launched February 2025) — spotlights early supporters and top listeners directly on track pages. Early commenters get recognized, creating a feedback loop.
- **Pinned comments** — artists can pin fan comments, pinned commenter earns 10 $AUDIO
- **Playlists as social objects** — collaborative playlists, playlist sharing

**What makes it 2026:**
- Artist Coins turn fandom into economic participation (hold coins = get access)
- Fan Recognition creates visible social proof on tracks
- DDEX standard support means real music industry interop
- Remix contests turn listening into creating

**Design patterns to steal:**
1. **Fan Recognition on tracks** — show early listeners/supporters prominently. "First 10 to listen" badges.
2. **Artist Coins as access gates** — holding a token = access to exclusive content/rooms (maps perfectly to ZAO's Respect token gating)
3. **Remix contests** — community co-creation, not just consumption
4. **Pinned comments with rewards** — artists reward the best fan engagement with tokens

---

### 4. Spotify Social Features

**Key features analyzed:** Blend, Jam, Collaborative Playlists, Listening Activity

**Blend:**
- Generates a shared playlist for two users based on overlapping taste
- Updates daily with new shared favorites
- 45+ million Blends created — proof that "taste compatibility" is a compelling social mechanic
- Shows a "taste match score" percentage

**Jam (Real-Time Collaborative Listening):**
- Up to 32 users listen together in real-time
- Everyone can add to the queue from their own device
- Host controls order, can remove songs
- Join via share link or QR code
- Crossed **100 million monthly listening hours**
- Now integrated into Android Auto (2025)
- "Request to Jam" — invite friends directly from their listening activity

**Collaborative Playlists:**
- 200+ million hours of collaborative playlist listening
- Multiple contributors, visible who added what
- Social proof: "Added by [friend name]"

**Listening Activity (January 2026):**
- Real-time "Now Playing" status visible to friends in Messages section
- Entirely opt-in
- "Request to Jam" button on friends' listening activity — see what they're playing, join instantly

**Design patterns to steal:**
1. **Taste Match Score** — show members how compatible their music taste is (using listening/sharing data). "You and @user have 73% taste overlap"
2. **Shared Queue** — multiple people adding to the same playing queue, live. This IS a community listening room.
3. **"Now Playing" presence** — ambient awareness of what community members are listening to, throughout the app. Not a separate page — everywhere.
4. **Request to Join** — see someone listening to something interesting? One tap to join their session.
5. **"Added by"** attribution on every track in shared contexts — makes curation feel personal

---

### 5. SoundCloud

**How music is DISPLAYED:**
- **Waveform player** — the iconic orange waveform IS the brand. Visual audio representation that shows the shape of a track.
- **Timed comments overlaid on the waveform** — praise a beat drop at 1:32, react to a lyric at 2:15. Comments appear as speech bubbles at their timestamp.
- Track cards in feed with: waveform, play count, likes, reposts, comment count

**How people DISCOVER:**
- **Reposts** — the single most important action. Artists and fans repost tracks to their followers' feeds. Organic viral loop.
- **"Liked By" pathways** — when listeners discover a track via another user's likes, they're dramatically more likely to engage themselves
- **Fan Recognition** (February 2025) — spotlights early supporters and top listeners on track pages
- Algorithm is community-first: embeds, reposts, playlist adds, and plays all feed the recommendation engine

**How listening is SOCIAL:**
- **Timed comments on waveform** — the defining social feature. Turns passive listening into a conversation anchored to specific moments.
- **Reposts as social currency** — reposting isn't just sharing; it's endorsement. Your repost feed IS your taste profile.
- **Scene formation through interaction** — SoundCloud's 2026 Music Intelligence Report found that scenes form through reposts, comments, and mutual influence BEFORE genres are defined. Interaction defines community, not labels.

**What makes it 2026 (from Music Intelligence Report 2026):**
- Scenes are forming through interaction rather than classification
- Reposts and comments reveal momentum before artists reach scale elsewhere
- Community formation is bottom-up: local energy, cross-pollination between styles, niche communities
- The platform where music trends START (before TikTok, before Spotify)

**Design patterns to steal:**
1. **Waveform with timed reactions** — THE music-native social interaction. Not generic likes — reactions anchored to specific moments in audio.
2. **Repost as core social action** — sharing someone's track to your followers should be as prominent as liking it. Reposts build the social graph.
3. **"Liked By" discovery chains** — show WHO liked a track, let users explore taste through people, not algorithms
4. **Scene-over-genre** — organize community around scenes/vibes/moments, not rigid genre categories

---

### 6. TikTok Music Integration

**How music drives content:**
- Music is not an add-on — it's the **content driver**. The sound comes first, the video is built around it.
- "Trending sounds" are the primary discovery mechanism. A sound goes viral, then thousands of creators make content with it.
- When you upload a video, TikTok **suggests music that matches your content** — the algorithm treats sound as a first-class content axis.

**The virality mechanic:**
- Using a trending sound increases For You Page visibility (algorithmic boost)
- Early adoption of rising sounds gives creators an advantage (same dynamic as Sonata's "early curator" NOTES multiplier)
- Music + format + timing = virality. The sound is the template; creators iterate on the visual.

**Social patterns:**
- Sounds create **implicit communities** — everyone using the same sound is in a conversation, even without direct interaction
- Dance challenges, emotional moments, comedy bits — all organized by their soundtrack
- The sound page shows ALL content using that track — creating a visual/social tapestry around one song

**Design patterns to steal:**
1. **Sound as organizing principle** — a track page should show ALL community activity around that song (who shared it, who reacted, what they said, who played it). The track is the social object.
2. **Trending sounds feed** — what music is rising in the community RIGHT NOW, not just what's popular
3. **Early adopter advantage** — reward people who share tracks before they trend (maps to Sonata's timing-based NOTES allocation)
4. **Music-first content creation** — when someone posts, suggest "add a track to this post" as a primary action, not an afterthought

---

### 7. Are.na (Visual Curation Platform)

**What it is:** A distraction-free curation platform. No likes, no followers count, no algorithmic feed. Just blocks (content) organized into channels (collections). Ad-free, subscription-supported.

**Core concepts:**
- **Blocks** — atomic content units (images, text, links, files, embeds)
- **Channels** — curated collections of blocks. Can be public, closed, or private.
- **Blocks can exist in multiple channels** — the same piece of content can be curated into different contexts
- **Channels can contain other channels** — nested organization, like playlists within playlists
- **Collaboration** — any channel can have invited collaborators who can add/remove content

**What makes it special:**
- No algorithmic feed. Discovery is through people and connections, not engagement metrics.
- No likes/shares/follower counts. Value comes from the quality of curation, not popularity signals.
- Minimalist UI that forces focus on content, not social performance.
- "Connecting things is elemental to Are.na" — the platform is about relationships between content, not between people.

**Design patterns to steal:**
1. **Channels as curated music collections** — not playlists (sequential), but COLLECTIONS (thematic). "Rainy day bass music," "Tracks that changed my life," "Underground Lagos producers." Channels have personality.
2. **Multi-channel content** — a single track can be in multiple collections simultaneously. It lives in "ZAO Radio Picks" AND "Late Night Vibes" AND "Member Favorites."
3. **Collaborative curation** — invite members to co-curate a channel. The channel becomes a shared taste object.
4. **No vanity metrics** — consider hiding play counts and like numbers in some views. Focus on the music, not the numbers. Let Respect tokens handle reputation, not engagement metrics.
5. **Blocks-and-channels mental model** — every piece of music content is a "block" that can be organized into themed "channels" by any member

---

### 8. Zora (Onchain Social Network)

**What it is (2026):** Evolved from NFT marketplace into a full social network where every post is an instantly tradeable coin. Recently expanded to Solana with "Attention Markets."

**How content is DISPLAYED:**
- Every post is a coin with 1B supply. Creator gets 10M instantly; 990M available on open market.
- **Market cap charts appear directly on posts** in the mobile app
- **"Friends Bought" tab** — see what coins your friends have traded (social proof of taste)
- **Carousel posts** — up to 12 images in one post
- **"Vidz" feed** — dedicated video-only feed
- Swap preview shows estimated amounts with hover/tap to toggle details

**How people DISCOVER:**
- **Friends Bought** — social discovery through your network's economic activity
- **Trending coins** — what's being traded right now
- **Attention Markets** — users take positions on trends, memes, cultural moments

**How it's SOCIAL:**
- Buying someone's coin IS the social interaction. No empty likes — put money behind your taste.
- Every profile is a Creator Coin (ERC20). Following someone economically = holding their coin.
- Posts' coins are automatically paired with the creator's coin — your content success lifts your personal token.

**What makes it 2026:**
- Financial skin-in-the-game replaces engagement metrics
- Content has real-time market value visible in the feed
- "Friends Bought" makes economic activity social and visible
- Attention Markets turn cultural taste into a tradeable position

**Design patterns to steal:**
1. **"Friends collected" social proof** — show which community members have collected/supported a track. Not a number — faces.
2. **Collecting as the primary interaction** — make "collect" (mint/support) more prominent than "like." It's a stronger signal and creates economic value.
3. **Creator coins for artists** — artists in the ZAO community could have their own tradeable tokens (maps to Audius Artist Coins too)
4. **Market cap as quality signal** — for music NFTs/collectibles, show market activity as a proxy for community consensus on quality

---

## Cross-Platform Design Patterns for ZAO OS

### Pattern 1: The Music Card (Atomic Unit of the Feed)

Every platform that handles music well has a **purpose-built music card**, not a generic post with a link. The ZAO OS music card should combine:

```
┌─────────────────────────────────────────────┐
│ ┌──────┐  Track Name                    ▶   │
│ │      │  Artist Name                       │
│ │ ART  │  Platform Badge  ·  3:42           │
│ │      │  ░░░░░░░░░░▓▓░░░░░░░░░░ waveform  │
│ └──────┘                                    │
│                                             │
│  💬 12 reactions  ·  🔄 5 reposts           │
│  "why I shared this" — @curator             │
│                                             │
│  👤👤👤 @user1, @user2 +8 listened          │
│  ⭐ Collect  ·  🎵 Add to Channel           │
└─────────────────────────────────────────────┘
```

**Sources:** Sonata (music card), Sound.xyz (audience), SoundCloud (waveform), Zora (collect action), Are.na (add to channel)

### Pattern 2: Waveform with Timed Reactions

The track detail page should show a waveform where community members have dropped reactions at specific timestamps:

```
┌─────────────────────────────────────────────┐
│  ░░░░🔥░░░░░░░💀░░░░░░🔥🔥░░░░░░░░░░░░░░  │
│       ↑              ↑        ↑              │
│    0:32           1:45     2:12              │
│  "beat drop"   "flow!"  "hardest bar"       │
│   @user1       @user2    @user3             │
└─────────────────────────────────────────────┘
```

**Sources:** SoundCloud (timed comments), Sound.xyz (timestamp comments on waveform)

### Pattern 3: Now Playing Presence (Ambient Awareness)

Throughout the app — in the member list, in chat, in profiles — show what people are currently listening to:

```
Member Card:
┌────────────────────────────────────┐
│  👤 @beatmaker.eth                 │
│  🎵 Now playing: "Midnight Bass"  │
│     by Stilo World                │
│  [Join Listening]                 │
└────────────────────────────────────┘
```

**Sources:** Spotify (Listening Activity + Request to Jam), Discord (Spotify integration in status)

### Pattern 4: Curated Channels (Not Just Playlists)

Channels are thematic, collaborative music collections with personality:

```
Channel: "3AM Beats" — curated by @zaal + 4 others
├── 23 tracks
├── "The tracks that play when the studio session goes too late"
├── Collaborators: 👤👤👤👤👤
└── Last updated: 2 hours ago
```

**Sources:** Are.na (channels), Spotify (Collaborative Playlists), SoundCloud (repost feeds as taste profiles)

### Pattern 5: Respect-Weighted Curation

ZAO OS's unique advantage: Respect tokens as curation weight. Higher Respect = more influence on what surfaces:

```
Feed Ranking:
- Track shared by member with 500 Respect = higher feed position
- Track shared by member with 50 Respect = standard position
- Multiple high-Respect members sharing same track = "Community Pick" badge
```

**Sources:** Unique to ZAO OS (no other platform has Respect-weighted curation). Combines Sonata's NOTES with SoundCloud's repost weighting.

### Pattern 6: Listening Rooms (Synchronous Social Listening)

Real-time group listening sessions with chat:

```
┌─────────────────────────────────────────────┐
│  🔴 LIVE  "Friday Night Vibes"              │
│  Hosted by @zaal  ·  12 listening           │
│                                              │
│  Now Playing: "Ambition" — Stilo World       │
│  ░░░░░░░░░░▓▓▓░░░░░░░░░░░░  2:34 / 4:12   │
│                                              │
│  Queue: 8 tracks                             │
│  👤👤👤👤👤👤👤👤👤👤👤👤                    │
│                                              │
│  💬 Chat:                                    │
│  @user1: this track is fire                  │
│  @user2: who produced this??                 │
│  @user3: 🔥🔥🔥                              │
│                                              │
│  [Add to Queue]  [Share Room]  [Leave]       │
└─────────────────────────────────────────────┘
```

**Sources:** Spotify Jam (shared queue), Sound.xyz (listening parties), SongJam (100ms live audio)

### Pattern 7: Track as Social Object (TikTok Model)

Every track has its own page showing ALL community activity:

```
Track Page: "Midnight Bass" by Stilo World
├── Waveform Player with timed reactions
├── "Shared by" — all members who posted this track
├── "In Channels" — all curated collections containing this track
├── "Reactions" — timestamped emoji reactions on the waveform
├── "Conversations" — Farcaster casts mentioning this track
├── "Collected by" — members who minted/collected this track
└── "Similar" — tracks shared by the same curators
```

**Sources:** TikTok (sound page), SoundCloud (track page), Sound.xyz (audience + comments)

---

## The Redesign: ZAO OS as a Music-First Social Platform

### Current State (Chat Client with Music Features)
```
HOME → Chat Room (with music embeds in messages)
       Music is embedded in chat messages
       GlobalPlayer at bottom of chat
       SongSubmit panel for adding tracks
       Radio mode plays Audius playlists
```

### Proposed State (Music Social Platform)
```
HOME → Music Feed (trending + following + channels)
       ├── Trending: Respect-weighted hot tracks
       ├── Following: Music from people you follow
       ├── Channels: Curated collections
       └── Now Playing: What the community is listening to

LISTEN → Listening Rooms
         ├── Active rooms (join live sessions)
         ├── Create room (host a listening party)
         └── Schedule (upcoming premieres/drops)

CHANNELS → Are.na-style music curation
           ├── Browse community channels
           ├── Create your own channel
           └── Collaborative curation

COMMUNITY → Social features
            ├── Member profiles with listening history
            ├── Taste matching (Spotify Blend concept)
            ├── Respect leaderboard
            └── Chat / DMs (XMTP)

GOVERNANCE → (existing)
```

### Navigation Shift

**Current pillars:** Social | Governance | Tools | Contribute

**Proposed pillars:** Feed | Listen | Channels | Community | Govern

The music feed replaces the generic social page. Chat moves into Community. Tools get absorbed into relevant sections.

### What ZAO OS Already Has (Advantages Over Competitors)

| Feature | ZAO OS | Sonata | Audius | SoundCloud |
|---------|--------|--------|--------|------------|
| Multi-platform playback | Spotify, SC, YT, Audius, Apple, Tidal, Bandcamp | Links only | Own catalog only | Own catalog only |
| Persistent player | Yes (GlobalPlayer + PersistentPlayer) | No | Yes | Yes |
| Inline feed playback | Yes (MusicEmbed) | No | N/A | N/A |
| Queue management | Yes | No | Basic | Basic |
| Community gating | Respect tokens | NOTES | $AUDIO | None |
| Private messaging | XMTP (E2E encrypted) | None | None | Basic |
| Governance | Hats Protocol + Respect | None | $AUDIO voting | None |
| Cross-client social graph | Farcaster protocol | Farcaster protocol | Own | Own |

**ZAO OS's unique position:** It's the only platform that combines multi-platform music playback + onchain community governance + Farcaster social graph + private messaging. No one else has this combination.

---

## Implementation Priority

### Phase 1: Music Feed as Home (Redesign the Core)
1. Build the Music Card component (replace generic cast rendering for music posts)
2. Create a dedicated Music Feed page with Trending/Following/Channels tabs
3. Make Music Feed the home screen (move chat to Community section)
4. Add "Now Playing" presence indicator across the app
5. Add "Repost" action to music cards (cast with music embed to your profile)

### Phase 2: Enhanced Track Experience
6. Add waveform visualization to track detail pages (wavesurfer.js)
7. Add timed reactions on waveforms (emoji at timestamps)
8. Add "Audience" visualization (who's listened — profile pics, not just a count)
9. Add curator notes ("why I'm sharing this") to music shares
10. Add "Collect" action for onchain music (Sound.xyz, Zora)

### Phase 3: Channels + Curation
11. Build Are.na-style Channels — themed, collaborative music collections
12. "Add to Channel" action on every music card
13. Channel discovery page (browse community channels)
14. Respect-weighted feed ranking (high-Respect curators' shares rank higher)
15. "Community Pick" badge when multiple high-Respect members share the same track

### Phase 4: Social Listening
16. Listening Rooms (real-time shared listening with chat)
17. "Join Listening" from Now Playing indicators
18. Taste Match scores between members
19. Scheduled listening parties (premieres, album drops)
20. Live audio rooms integration (100ms SDK, from SongJam patterns)

---

## Technical Notes

### What ZAO OS Already Has That Supports This
- `PlayerProvider` + `GlobalPlayer` + `PersistentPlayer` — full multi-platform playback infrastructure
- `MusicEmbed` component — already renders music cards in chat messages
- `SongSubmit` — song submission system with URL validation across 8 platforms
- `MusicQueueTrackCard` — queue management UI
- `Scrubber` — progress bar with seek functionality
- Audio providers for: Spotify, SoundCloud, YouTube, Audius, Apple Music, Tidal, Bandcamp, HTML Audio
- Farcaster integration (Neynar) — casts, likes, follows, channels
- Respect tokens on Optimism — curation weight infrastructure
- XMTP — private messaging for listening room chat

### New Components Needed
- `MusicFeedCard` — purpose-built card for the music feed (not just MusicEmbed adapted)
- `WaveformReactions` — wavesurfer.js + timed emoji reactions
- `NowPlayingBadge` — small indicator showing what a user is listening to
- `ChannelCard` / `ChannelView` — Are.na-style collection components
- `ListeningRoom` — real-time shared listening with chat
- `TasteMatch` — taste compatibility calculation between users
- `TrackPage` — dedicated track detail page with all social activity
- `AudienceVisualization` — profile pic grid of listeners/collectors

### APIs to Leverage
- **Audius API** (free, no auth) — full streaming, search, trending, user profiles
- **Sonata API** — trending music on Farcaster, channel-level music data
- **Spinamp API** — aggregated onchain music index
- **Zora API** — onchain music collectibles
- **Neynar API** — Farcaster social graph, casts, reactions, channels

---

## Sources

- [Sonata — Coop Records GitHub](https://github.com/Coop-Records/sonata)
- [Introducing Sonata — Paragraph](https://paragraph.com/@sonata/introducing-sonata)
- [Sonata Tips](https://www.sonata.tips/)
- [Our Next Chapter — Coopahtroopa / Invest in Music](https://investinmusic.substack.com/p/our-next-chapter)
- [Sound.xyz Sunsetting — Paragraph](https://paragraph.com/@soundxyz/sunsetting-sound)
- [Sound.xyz Visual Identity — Studio Herrstrom](https://www.studioherrstrom.com/work/sound-xyz)
- [Sound.xyz — The Syllabus / Jake Steffens](https://invisiblecollege.substack.com/p/issue-9-soundxyz)
- [Vault.fm](https://vault.fm/)
- [Sound.xyz Maintenance Mode — Outposts](https://outposts.io/article/soundxyz-enters-maintenance-mode-shifts-focus-to-vault-cfe72744-b90b-49aa-b526-46bf324469ea)
- [Audius — A New Era](https://blog.audius.co/posts/a-new-era-for-audius)
- [Audius Artist Coins Launch — GlobeNewsWire](https://www.globenewswire.com/news-release/2025/10/08/3163597/0/en/Audius-Launches-Artist-Coins-Empowering-Artists-to-Create-Their-Own-Crypto-Coins-and-Build-the-Fan-Clubs-of-the-Future.html)
- [Audius May 2025 Updates](https://blog.audius.co/article/whats-new-on-audius-news-rewards-trending-tracks-may-2025)
- [Spotify Jam — Newsroom](https://newsroom.spotify.com/2023-09-26/spotify-jam-personalized-collaborative-listening-session-free-premium-users/)
- [Spotify Real-Time Listening Activity — TechCrunch](https://techcrunch.com/2026/01/07/spotify-now-lets-you-share-what-youre-streaming-in-real-time-with-friends/)
- [SoundCloud Social Discovery 2026 — AudiArtist](https://www.audiartist.com/soundcloud-social-discovery-music-intelligence-2026/)
- [SoundCloud Music Intelligence Report 2026 — iEDM](https://iedm.com/blogs/onblast-edm-blog/soundcloud-2026-music-intelligence-report)
- [SoundCloud Music Intelligence Report 2026 — Magnetic Magazine](https://magneticmag.com/2026/02/soundcloud-2026-music-intelligence-report/)
- [Are.na — Channels Help](https://help.are.na/docs/getting-started/channels)
- [Are.na — About](https://www.are.na/about)
- [Are.na Design Critique — IXD@Pratt](https://ixd.prattsi.org/2025/02/design-critique-are-na-ios-app/)
- [Zora Review 2026 — CryptoAdventure](https://cryptoadventure.com/zora-review-2026-attention-markets-creator-coins-and-the-shift-beyond-nfts/)
- [Zora — What Has Changed — Support](https://support.zora.co/en/articles/4641857)
- [Zora Coins Protocol — Docs](https://docs.zora.co/coins)
- [Zora Attention Markets — CoinDesk](https://www.coindesk.com/tech/2026/02/18/zora-moves-onto-solana-with-attention-markets-for-trading-internet-trends/)
- [Web3 Music Tools for Artists — Water & Music](https://www.waterandmusic.com/the-state-of-music-web3-tools-for-artists/)
- [Web3 UX Design Trends 2026 — BricxLabs](https://bricxlabs.com/blogs/web-3-ux-design-trends)
- [Social Listening Sessions — Soundverse AI](https://www.soundverse.ai/blog/article/social-listening-sessions-real-time-shared-music-0024)
- [Music-First Social Media Platforms 2026 — Promoly](https://promoly.com/best-social-media-platforms-music-artists/)
- [Streaming Audio Platforms and Discovery 2026 — AudiArtist](https://www.audiartist.com/streaming-audio-platforms-music-discovery-2026/)
