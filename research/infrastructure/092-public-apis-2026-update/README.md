# 92 — Public APIs 2026 Update: Best Free APIs for ZAO OS

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Re-evaluate the public-apis repo (412K stars, 1,436 APIs) against what ZAO OS has actually built, identify high-value APIs not yet integrated
> **Updates:** Docs 9 and 25 mapped APIs early in the project. This doc cross-references with the 64 API routes actually built.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Songlink/Odesli** | INSTALL — free, no auth needed for basic, CORS-enabled. Converts any music URL to universal links across all platforms. Solves "my friend uses Apple Music" problem. One API call replaces manual platform detection in `src/lib/music/isMusicUrl.ts` |
| **MusicBrainz** | INSTALL — free, no auth, open database. Artist metadata, release info, recordings. Better than scraping oEmbed for song details |
| **Last.fm** | INSTALL — free apiKey, scrobbling + taste profiling. Powers the AI taste graph (doc 90, Approach C deferred). Essential for the self-improving music curation agent |
| **CoinGecko** | INSTALL — free, no auth, CORS-enabled. Show $RESPECT token price if it ever launches. Show ETH/OP prices for governance context |
| **Perspective API** | INSTALL — free from Google. Toxicity detection for AI-generated casts (doc 90 content moderation). Scores text 0-1 for toxic/obscene/threatening |
| **Bandsintown** | INSTALL — free, no auth. Concert discovery for ZAO artists. Enhances music profiles |
| **Radio Browser** | ALREADY SIMILAR — ZAO has community radio via Audius playlists in `community.config.ts`. Radio Browser adds 30K+ internet stations but may be scope creep |
| **Skip Spotify API** | Already have Spotify embed player. Full API needs OAuth which adds complexity for users |
| **Skip exchange APIs** | ZAO doesn't need Binance/Coinbase/Kraken. Only need CoinGecko for price display |

---

## What's Already Integrated (Built in Code)

| API/Service | Where in Code | Status |
|-------------|--------------|--------|
| **Neynar** (Farcaster) | `src/lib/farcaster/neynar.ts` | Fully integrated — casts, feeds, channels, signers, search |
| **Supabase** | `src/lib/db/supabase.ts` | Fully integrated — 14+ tables, RLS |
| **XMTP** | `src/lib/xmtp/client.ts` | Fully integrated — E2E encrypted DMs + groups |
| **Spotify** (embed) | `src/providers/audio/SpotifyProvider.tsx` | Embed player only (iframe API, no OAuth) |
| **SoundCloud** (embed) | `src/providers/audio/SoundcloudProvider.tsx` | Widget API embed |
| **YouTube** (embed) | `src/providers/audio/YoutubeProvider.tsx` | IFrame API + polling |
| **Audius** | `src/app/api/music/metadata/route.ts` | oEmbed metadata + streaming |
| **Sound.xyz** | `src/app/api/music/metadata/route.ts` | GraphQL metadata |
| **Apple Music** | `src/lib/music/isMusicUrl.ts` | URL detection only (no API) |
| **Tidal** | `src/lib/music/isMusicUrl.ts` | URL detection only (no API) |
| **Bandcamp** | `src/lib/music/isMusicUrl.ts` | URL detection only (no API) |
| **Bluesky** (@atproto) | `src/lib/bluesky/` | Cross-posting, feed sync, member discovery |
| **Hats Protocol** | `src/lib/hats/` | Role tree, gating, ERC-1155 |
| **Jitsi** | `src/components/calls/JitsiRoom.tsx` | Video calls |
| **Wagmi/Viem** | `src/lib/wagmi/config.ts` | Optimism + Base blockchain |
| **Vercel Analytics** | `src/app/layout.tsx` | Basic analytics |

**Not integrated but researched:** Audius full API (doc 3), LiveKit (doc 43), PostHog (doc 9), Privy (doc 9), Hive (docs folder)

---

## Tier 1: Install Now (High Value, Free, Easy)

### Songlink / Odesli
**What:** Universal music link converter. Give it any Spotify/Apple Music/YouTube/SoundCloud URL → get links for ALL platforms.

| Stat | Value |
|------|-------|
| Auth | apiKey (free tier available) |
| HTTPS | Yes |
| CORS | Yes |
| URL | [odesli.co](https://odesli.co/) / [API docs](https://www.notion.so/API-d0ebe08a5e304a55928405eb682f6741) |

**Why for ZAO OS:** Members share music from different platforms. Songlink gives every shared track a universal link. Replace the manual regex matching in `src/lib/music/isMusicUrl.ts` with one API call that returns all platform URLs + metadata.

**Integration point:** `src/app/api/music/metadata/route.ts` — add Songlink as a metadata source. One call returns: title, artist, thumbnail, and links for Spotify, Apple Music, YouTube, SoundCloud, Tidal, Deezer, etc.

**Example:** `GET https://api.song.link/v1-alpha.1/links?url=https://open.spotify.com/track/...` → returns all platform links

### MusicBrainz
**What:** Open music database — 30M+ recordings, 1.5M+ artists, 2.5M+ releases. No auth required. Community-maintained.

| Stat | Value |
|------|-------|
| Auth | None |
| HTTPS | Yes |
| CORS | Unknown (server-side calls from API routes work fine) |
| URL | [musicbrainz.org/doc/Development](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2) |

**Why for ZAO OS:** Free, accurate metadata for any song. Better than scraping oEmbed pages. Use for: artist bios, discography, genre tags, release dates. Feeds the music curation agent (doc 90).

**Integration point:** `src/app/api/music/metadata/route.ts` — add as fallback metadata source when oEmbed fails or returns limited data. Also useful for the `song_submissions` table enrichment.

### Last.fm
**What:** Music scrobbling + social listening. Track what members listen to, get similar artist recommendations, taste compatibility scores.

| Stat | Value |
|------|-------|
| Auth | apiKey (free) |
| HTTPS | Yes |
| CORS | Unknown |
| URL | [last.fm/api](https://www.last.fm/api) |

**Why for ZAO OS:** This is the backbone of the AI taste graph (doc 90, Approach C). Last.fm tracks listening history, computes taste compatibility between users, and provides "similar artist" recommendations. Perfect for the Community Manager agent's daily digest music picks.

**Integration point:** New — `src/lib/music/lastfm.ts`. Key endpoints:
- `user.getRecentTracks` — what a member just listened to
- `user.getTopArtists` — member's taste profile
- `user.getTasteometer` — taste compatibility between two members
- `artist.getSimilar` — "if you like X, try Y" recommendations

### CoinGecko
**What:** Crypto prices, market data, token info. Free, no auth, CORS-enabled.

| Stat | Value |
|------|-------|
| Auth | None |
| HTTPS | Yes |
| CORS | Yes |
| URL | [coingecko.com/api](http://www.coingecko.com/api) |

**Why for ZAO OS:** Display ETH/OP prices in the governance context (proposals have on-chain costs). If $RESPECT ever becomes a tradeable token, show its price. Also useful for the ZOUNZ auction widget (show current bid in USD).

**Integration point:** `src/app/api/crypto/prices/route.ts` (new) — cache prices in Supabase, refresh every 5 min. Display in governance and ZOUNZ components.

### Perspective API (Google)
**What:** AI content moderation. Scores text 0.0-1.0 for toxicity, obscenity, insult, threat, identity attack.

| Stat | Value |
|------|-------|
| Auth | apiKey (free from Google) |
| HTTPS | Yes |
| CORS | Unknown |
| URL | [perspectiveapi.com](https://perspectiveapi.com) |

**Why for ZAO OS:** The Community Manager agent (doc 90) needs content moderation for AI-generated casts. Perspective API scores draft casts before posting — if toxicity > 0.7, don't post. Also useful for moderating user-submitted governance proposals.

**Integration point:** `src/lib/moderation/perspective.ts` (new). Call before any agent-generated cast or user-submitted proposal.

### Bandsintown
**What:** Concert and event discovery by artist. Free, no auth required.

| Stat | Value |
|------|-------|
| Auth | None |
| HTTPS | Yes |
| CORS | Unknown |
| URL | [Bandsintown API docs](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0) |

**Why for ZAO OS:** ZAO members are music artists. Show upcoming concerts in their profile. The Community Manager agent could include "upcoming shows" in the daily digest.

**Integration point:** `src/app/api/music/events/route.ts` (new) — fetch events by artist name. Display in ProfileDrawer and daily digest.

---

## Tier 2: Install When Needed

### Music Discovery & Metadata

| API | Auth | Free? | Why | When to Add |
|-----|------|-------|-----|-------------|
| **TasteDive** | apiKey | Yes | "If you like X, try Y" recommendations | When building AI taste graph |
| **TheAudioDB** | apiKey | Yes | Artist images, album art, music videos | When enhancing music profiles |
| **Genius** | OAuth | Yes | Lyrics, song annotations, artist bios | When adding lyrics display to player |
| **Discogs** | OAuth | Yes | Vinyl/physical music database, marketplace data | When adding collection tracking |
| **Musixmatch** | apiKey | Free tier | Lyrics database (largest) | Alternative to Genius for lyrics |
| **iTunes Search** | None | Yes | Apple Music catalog search (free, no auth!) | When adding Apple Music metadata |
| **Freesound** | apiKey | Yes | CC audio samples for music creation | When adding sample sharing |

### Events & Community

| API | Auth | Free? | Why | When to Add |
|-----|------|-------|-----|-------------|
| **Songkick** | apiKey | Yes | Concert/event discovery (larger database than Bandsintown) | If Bandsintown coverage is insufficient |
| **Eventbrite** | OAuth | Yes | Find/create community events | When adding IRL meetup coordination |
| **Discord** | OAuth | Yes | Community bridge — sync channels | When adding Discord integration (doc 37) |
| **Telegram Bot** | apiKey | Yes | Bot for cross-posting to Telegram groups | When adding Telegram integration |

### Blockchain & Web3

| API | Auth | Free? | Why | When to Add |
|-----|------|-------|-----|-------------|
| **Alchemy** | apiKey | Free tier | Alternative Ethereum node provider | If current Viem RPC gets rate-limited |
| **The Graph** | apiKey | Free tier | Custom subgraphs for Respect/Hats contracts | When building advanced on-chain analytics |
| **Etherscan** | apiKey | Free tier | Transaction history, contract verification | When adding on-chain explorer features |
| **Blockfrost** | apiKey | Free tier | Cardano integration (if ZAO expands chains) | Not soon — ZAO is Optimism/Base focused |

### AI & Moderation

| API | Auth | Free? | Why | When to Add |
|-----|------|-------|-----|-------------|
| **NLP Cloud** | apiKey | Free tier | Sentiment analysis, NER, classification | When analyzing community sentiment |
| **Clarifai** | OAuth | Free tier | Image recognition, NSFW detection | When adding image upload moderation |
| **Irisnet** | apiKey | Yes | Real-time image moderation (block/blur) | When adding profile picture moderation |

### Media & Content

| API | Auth | Free? | Why | When to Add |
|-----|------|-------|-----|-------------|
| **Giphy** | apiKey | Yes | GIF search for chat reactions | When adding GIF picker to compose bar |
| **Archive.org** | None | Yes | Internet Archive audio/video | When adding historic music content |
| **Wikidata/Wikipedia** | None | Yes | Artist bios, factual data | When enriching artist profiles automatically |
| **Vimeo** | OAuth | Yes | Music video hosting | When adding video content to feeds |
| **JSON2Video** | apiKey | Paid | Programmatic video creation | When making music recap videos |

---

## Tier 3: Skip (Not Relevant to ZAO OS)

| Category | Why Skip |
|----------|---------|
| **All crypto exchange APIs** (Binance, Coinbase, Kraken, etc. — 50+ APIs) | ZAO is not a trading platform. CoinGecko covers price display |
| **Video category** (Star Wars, Game of Thrones, etc.) | Entertainment trivia APIs, not relevant |
| **Most social APIs** (Facebook, Instagram, LinkedIn, Pinterest) | ZAO is Farcaster-native. Already has Bluesky cross-posting |
| **Regional music APIs** (Gaana, JioSaavn, KKBOX, Vagalume) | ZAO community is global/English-focused |
| **Art museum APIs** (Met, Rijksmuseum, etc.) | Not relevant to music community |
| **Weather, Sports, Animals, Food** | Not relevant |

---

## Integration Priority Matrix

| Priority | API | Effort | Impact | Dependencies |
|----------|-----|--------|--------|-------------|
| 1 | **Songlink/Odesli** | ~30 min | High — universal music links | None |
| 2 | **MusicBrainz** | ~30 min | High — free metadata | None |
| 3 | **Perspective API** | ~30 min | High — content moderation | Needed before doc 90 agents ship |
| 4 | **CoinGecko** | ~20 min | Medium — price context | None |
| 5 | **Last.fm** | ~1 hour | High — taste profiling | Needs user opt-in for scrobbling |
| 6 | **Bandsintown** | ~30 min | Medium — event discovery | None |
| 7 | **Giphy** | ~30 min | Medium — chat UX | None |
| 8 | **TasteDive** | ~30 min | Medium — recommendations | Pairs with Last.fm |

**Total for top 6:** ~3 hours CC time. All free. All have ZAO-specific use cases.

---

## Cross-Reference with Existing Research

| Doc | Relationship |
|-----|-------------|
| **9** — Public APIs | Original API mapping. This doc is the 2026 update with what's actually built |
| **25** — Public APIs Index | 100+ APIs mapped by use case. Many still unintegrated. This doc prioritizes |
| **3** — Music Integration | Audius, Sound.xyz, Spotify detailed. This doc adds Songlink, MusicBrainz, Last.fm |
| **90** — AI-Run Community Agent OS | Perspective API needed for content moderation. Last.fm powers taste profiling |
| **43** — WebRTC Audio Rooms | LiveKit for live rooms. Separate from these REST APIs |
| **37** — Bridges & Competitors | Discord/Telegram bridges. APIs for those listed in Tier 2 here |

---

## Sources

- [public-apis/public-apis](https://github.com/public-apis/public-apis) — 412K stars, 1,436 APIs, MIT license
- [Songlink/Odesli API](https://www.notion.so/API-d0ebe08a5e304a55928405eb682f6741)
- [MusicBrainz API](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2)
- [Last.fm API](https://www.last.fm/api)
- [CoinGecko API](http://www.coingecko.com/api)
- [Perspective API](https://perspectiveapi.com)
- [Bandsintown API](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0)
- [Doc 9 — Public APIs](../../_archive/009-public-apis/)
- [Doc 25 — Public APIs Index](../../_archive/025-public-apis-index/)
