# Music Discovery Feed — Research & Implementation Plan

**Date:** 2026-03-22
**Scope:** ZAO OS (Next.js 16 + Supabase + Neynar/Farcaster), ~100-member gated community

---

## 1. What Makes Great Music Discovery UX?

### Platform Analysis

**Spotify Discover Weekly** uses three pillars:
- **Collaborative filtering** — "users who liked X also liked Y" across 600M+ users
- **Audio analysis** — BPM, energy, valence, danceability, instrumentalness (via their Audio Features API)
- **NLP / cultural context** — scraping blogs, reviews, and playlists for artist association

Key signals ranked by weight (per Chartlex 2026 campaign data):
1. **Save rate** (>20% triggers algorithmic placement) — 3x more important than raw streams
2. **Repeat-listen ratio** (stream-to-listener ratio >2.0)
3. **Skip rate** (skipping within 10-15s is a strong negative signal)
4. **Track completion percentage**
5. **Playlist adds**

**SoundCloud** uses "Discorank" algorithm:
- Engagement velocity (likes/reposts shortly after upload) matters most
- Listener retention (how far into the track people listen)
- Comment density as a quality signal
- "First Fans" system: new releases go to ~100 matched listeners, top performers get surfaced to ~1,000
- "Buzzing Playlists" are genre-specific, driven entirely by fan engagement, not editorial picks
- AI trained on *sound*, not popularity — detects patterns, genres, moods from audio

**YouTube Music "New Release Mix":**
- Leverages Google's watch/listen history across YouTube + YouTube Music
- Subscription-based signals (channels you follow)
- Engagement on similar content (likes, shares, watch time)

**Audius Trending:**
- Open protocol — trending is computed from plays, reposts, favorites, and playlist adds
- Fully transparent algorithm (open source)
- Genre-filtered trending via API: `GET /v1/tracks/trending?genre=Electronic&time=week`

### What ZAO Should Borrow

For a 100-member community, Spotify-style ML is overkill. The winning signals for ZAO are:

| Signal | Weight | Source |
|--------|--------|--------|
| Respects given to a song post | 3x | `respect_actions` table |
| Reactions (fire, heart, etc.) | 2x | cast reactions via Neynar |
| Play completions (>75%) | 2x | Client-side audio events |
| Submissions by multiple members | 1.5x | `song_submissions` duplicates across channels |
| Recency | 1x decay | Exponential decay over 7 days |
| Admin/curator boost | 2x manual | Admin picks |

---

## 2. Community-Driven Curation Models

### Sound.xyz
- 5% curator reward: collectors who create playlists and share referral links earn commission when others mint
- Curators collectively earned >$29,500 — economic incentive drives curation quality
- Transitioned toward "Vault.fm" for deeper artist-fan relationships
- Key lesson: **financial skin-in-the-game improves curation quality**

### Catalog
- 1/1 music NFTs — scarcity model where each track is unique
- Collectors curate by purchasing — their collection *is* their curation
- "Catalog Weekly" editorial picks highlight community favorites

### Music DAO Patterns (2025-2026)
- **Token-weighted voting** — vote power proportional to governance token holdings
- **Quadratic voting** — square root of tokens, reduces whale dominance (ideal for ZAO's size)
- **Delegated curation** — trusted members get curator roles (maps to ZAO's Hats Protocol roles)
- **SubDAOs / working groups** — small curation committees with specific genre expertise

### Recommended ZAO Model: Respect-Weighted Curation

Since ZAO already has Respect tokens (OG Respect + ZOR on Optimism), use them:

```
curation_weight = base_vote * (1 + log2(respect_balance + 1))
```

- Every member gets 1 base vote per song per day
- Respect holders get logarithmically scaled influence (prevents whale dominance)
- Admin picks get a 2x multiplier (configurable in `community.config.ts`)
- Weekly "ZAO Picks" playlist = top 10 by weighted score

**Curation tiers:**
| Tier | Respect Balance | Weight Multiplier |
|------|----------------|-------------------|
| Listener | 0 | 1.0x |
| Contributor | 1-5 | 1.0-2.6x |
| Curator | 6-20 | 2.8-4.4x |
| Elder | 21+ | 4.5x+ |

---

## 3. Building "ZAO Daily" Playlist

### Data Sources

**Source 1: Member song submissions** (already exists)
- Table: `song_submissions` (see `supabase/migrations/20260313_song_submissions.sql`)
- API: `GET /api/music/submissions?channel=zao&limit=50`
- Fields: `url`, `title`, `artist`, `track_type`, `submitted_by_fid`, `created_at`

**Source 2: Music links from chat**
- Extract URLs from Farcaster casts using the existing `isMusicUrl()` function in `src/lib/music/isMusicUrl.ts`
- Already supports: Spotify, SoundCloud, Sound.xyz, YouTube, Audius, Apple Music, Tidal, Bandcamp, IPFS audio
- Cron job or webhook listener scans new casts, extracts music URLs, stores in `discovered_tracks` table

**Source 3: Audius trending (genre-filtered)**
```typescript
// Audius API — free, no API key needed for basic access
const res = await fetch(
  'https://api.audius.co/v1/tracks/trending?genre=Electronic&time=week',
  { headers: { Authorization: `Bearer ${AUDIUS_API_KEY}` } }
);
const { data } = await res.json();
// Returns: id, title, user.name, artwork, play_count, favorite_count, repost_count
```
- Filter by genres relevant to ZAO community
- Pull top 5 trending per day
- Cross-reference against community submissions to avoid duplicates

**Source 4: Community engagement signals**
- Track reactions on casts containing music links (via Neynar API)
- Count respects given to song submission posts
- Client-side play tracking (play starts, >75% completion, skips)

### Scoring Algorithm

```typescript
function calculateDailyScore(track: TrackCandidate): number {
  const hoursSinceSubmission = (Date.now() - track.createdAt) / 3600000;
  const recencyDecay = Math.exp(-hoursSinceSubmission / 168); // 7-day half-life

  const engagementScore =
    (track.respectCount * 3) +
    (track.reactionCount * 2) +
    (track.playCompletions * 2) +
    (track.submissionCount * 1.5) +
    (track.isAdminPick ? 5 : 0);

  // Boost tracks from less-heard submitters (diversity)
  const diversityBonus = track.submitterPreviousFeatures < 3 ? 1.5 : 1.0;

  return engagementScore * recencyDecay * diversityBonus;
}
```

### Proposed Database Schema

```sql
-- Daily playlist generation
CREATE TABLE IF NOT EXISTS daily_playlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  track_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES daily_playlist(id) ON DELETE CASCADE,
  track_url TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  track_type TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'submission', 'chat', 'audius_trending', 'admin_pick'
  score NUMERIC(10,2) NOT NULL DEFAULT 0,
  position INT NOT NULL,
  submitted_by_fid BIGINT,
  metadata JSONB,  -- artwork_url, duration, genre, bpm, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_playlist_date ON daily_playlist(playlist_date DESC);
CREATE INDEX idx_daily_tracks_playlist ON daily_playlist_tracks(playlist_id, position);

-- Track engagement tracking
CREATE TABLE IF NOT EXISTS track_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_url TEXT NOT NULL,
  fid BIGINT NOT NULL,
  action TEXT NOT NULL,  -- 'play_start', 'play_complete', 'skip', 'respect', 'reaction', 'save'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(track_url, fid, action, created_at)
);

CREATE INDEX idx_track_engagement_url ON track_engagement(track_url, action);

-- Discovered tracks from chat (music links extracted from casts)
CREATE TABLE IF NOT EXISTS discovered_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT NOT NULL UNIQUE,
  track_url TEXT NOT NULL,
  track_type TEXT NOT NULL,
  shared_by_fid BIGINT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'zao',
  title TEXT,
  artist TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discovered_tracks_url ON discovered_tracks(track_url);
CREATE INDEX idx_discovered_tracks_channel ON discovered_tracks(channel, created_at DESC);
```

### API Route: `/api/music/daily/route.ts`

```typescript
// GET — returns today's ZAO Daily playlist
// Generates on first request each day, caches until midnight UTC
// Query params: ?date=2026-03-22 (optional, defaults to today)

// POST — admin endpoint to regenerate / override
// Body: { date?: string, adminPicks?: string[] }
```

### Cron Job: Daily Playlist Generation

Run via Vercel Cron or Supabase pg_cron at 00:00 UTC:

1. Query `song_submissions` from last 7 days
2. Query `discovered_tracks` from last 7 days
3. Fetch Audius trending (top 5 per configured genre)
4. Score all candidates using `calculateDailyScore()`
5. Select top 15-20 tracks (configurable)
6. Insert into `daily_playlist` + `daily_playlist_tracks`
7. Optionally post to Farcaster channel as a daily cast

---

## 4. Music Metadata Enrichment

### Tier 1: Link Resolution (Implement First)

**Odesli / song.link API** — free, resolves any music link to all platforms + basic metadata
```typescript
// GET https://api.song.link/v1-alpha.1/links?url={encodedUrl}
// Returns: title, artist, thumbnail, links to all platforms
// Rate limit: 10 req/min without key (email developers@song.link for key)
// Node.js wrapper: odesli.js (npm)
```

This is the highest-value, lowest-effort integration. For every song submitted or shared:
1. Resolve via Odesli to get cross-platform links
2. Store title, artist, artwork in `metadata` JSONB column
3. Display universal "Listen on..." buttons

### Tier 2: Spotify Audio Features (If Track Is on Spotify)

```typescript
// GET https://api.spotify.com/v1/audio-features/{trackId}
// Requires: Spotify Developer App (free), OAuth client credentials flow
// Returns per track:
//   tempo (BPM), key, mode, time_signature,
//   energy (0-1), valence (0-1), danceability (0-1),
//   acousticness, instrumentalness, speechiness, liveness, loudness
```

Store these as a vector for taste matching (see section 6):
```typescript
const audioFeatureVector = [
  track.energy,
  track.valence,
  track.danceability,
  track.acousticness,
  track.instrumentalness,
  track.speechiness,
  track.tempo / 200, // normalize BPM to 0-1 range
];
```

### Tier 3: Cyanite.ai (AI Music Tagging)

For tracks not on Spotify (SoundCloud, Audius, Bandcamp, direct audio):
- **What it does:** Genre, mood (happy/sad/aggressive/relaxed), mood waves (15-second segments), BPM, key, instruments, energy levels
- **API:** GraphQL-based, analyze by URL or upload
- **Pricing:** Free tier exists; paid plans for volume
- **Best for:** Tagging community-uploaded tracks that lack metadata

### Tier 4: Essentia.js (Client-Side Analysis)

For real-time or offline audio analysis without sending data to external APIs:
- **What it is:** WebAssembly port of Essentia C++ library, runs in browser
- **Capabilities:** BPM detection, beat tracking, key detection, genre autotagging, mood classification (happy/sad/aggressive/relaxed), MFCC extraction
- **Pre-trained TensorFlow.js models** included for genre and mood
- **License:** AGPLv3 (copyleft — fine for ZAO OS which is already gated)
- **Use case:** Analyze audio playing in the in-app radio player, no server round-trip needed

```typescript
import { EssentiaWASM } from 'essentia.js';
const essentia = new EssentiaWASM();
// Analyze audio buffer from Web Audio API
const features = essentia.KeyExtractor(audioBuffer);
// features.key, features.scale, features.strength
```

### Tier 5: AcousticBrainz / MusicBrainz

- AcousticBrainz was **shut down in 2022** — data dumps available but no live API
- MusicBrainz is still active for metadata (artist, album, release dates, ISRCs) but does NOT provide audio features
- Use MusicBrainz for metadata normalization, not audio analysis

### Recommended Enrichment Pipeline

```
Track URL submitted
  → Odesli API (resolve to all platforms + basic metadata)        [always]
  → If Spotify link found → Spotify Audio Features API            [free]
  → If no Spotify → Cyanite.ai API (genre, mood, BPM)            [fallback]
  → Store enriched metadata in JSONB column
  → Generate feature vector for taste matching
```

---

## 5. Collaborative Playlists

### How Major Platforms Handle It

**Spotify:**
- Any playlist can be made collaborative via `collaborative: true`
- Collaborative playlists CANNOT be public (API enforces this)
- Snapshot IDs handle concurrency — each edit creates a new snapshot
- API: `PUT /v1/playlists/{id}` with `{ collaborative: true }`
- Anyone with the link can add/remove tracks

**Apple Music:**
- No native collaborative playlist feature at the API level
- Workaround: shared "Shared Playlist" but no real-time collaboration

**Audius:**
- Playlists are on-chain, user-owned
- No native collaborative feature, but the protocol is open — theoretically possible

### ZAO Community Playlist Design

Since ZAO already controls the full stack, build collaborative playlists natively:

```sql
CREATE TABLE IF NOT EXISTS community_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_fid BIGINT NOT NULL,
  is_collaborative BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  max_tracks INT DEFAULT 100,
  allow_duplicates BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES community_playlists(id) ON DELETE CASCADE,
  track_url TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  track_type TEXT NOT NULL,
  added_by_fid BIGINT NOT NULL,
  added_by_username TEXT,
  position INT NOT NULL,
  metadata JSONB,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, track_url)  -- no duplicate tracks per playlist
);

CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position);
```

### Feature Design

- **Any member** can add songs to collaborative playlists (gated by ZAO membership)
- **Drag-and-drop reordering** (store `position` column, use fractional indexing for insert-between)
- **"Upvote" tracks** within playlist to surface community favorites to the top
- **Max 100 tracks** per playlist (configurable) — keeps playlists focused
- **Activity feed** shows "Alice added Track X to Playlist Y" events
- **Admin playlists** — admins can create non-collaborative "official" playlists (ZAO Picks, Genre Spotlights)

### API Routes

```
GET    /api/music/playlists                    — list all community playlists
POST   /api/music/playlists                    — create new playlist
GET    /api/music/playlists/[id]               — get playlist with tracks
POST   /api/music/playlists/[id]/tracks        — add track to playlist
DELETE /api/music/playlists/[id]/tracks/[trackId] — remove track
PATCH  /api/music/playlists/[id]/tracks/reorder — reorder tracks
```

---

## 6. Music Taste Matching

### The Approach for 100 Members

Enterprise-scale embedding models (Word2Vec, BERT, neural collaborative filtering) are overkill for 100 members. Instead, use **explicit feature vectors** stored in pgvector.

### Building Taste Profiles

**Step 1: Track Feature Vectors**

For each track with Spotify Audio Features:
```typescript
// 7-dimensional feature vector (all 0-1 normalized)
const trackVector = [
  energy,           // 0-1
  valence,          // 0-1 (happy vs sad)
  danceability,     // 0-1
  acousticness,     // 0-1
  instrumentalness, // 0-1
  speechiness,      // 0-1
  tempo / 200,      // normalized BPM
];
```

For tracks without Spotify data (via Cyanite or Essentia.js), map their outputs to the same 7 dimensions.

**Step 2: User Taste Vectors**

A user's taste profile = weighted average of all tracks they engaged with:

```typescript
function buildTasteProfile(engagements: TrackEngagement[]): number[] {
  const weights = {
    play_complete: 3,
    save: 3,
    respect: 2,
    reaction: 1.5,
    play_start: 0.5,
    skip: -1,
  };

  let weightedSum = new Array(7).fill(0);
  let totalWeight = 0;

  for (const e of engagements) {
    const w = weights[e.action] || 1;
    const trackVec = e.trackFeatureVector;
    for (let i = 0; i < 7; i++) {
      weightedSum[i] += trackVec[i] * w;
    }
    totalWeight += Math.abs(w);
  }

  return weightedSum.map(v => v / totalWeight);
}
```

**Step 3: Store in pgvector**

```sql
-- Enable pgvector extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add taste vector columns
ALTER TABLE song_submissions ADD COLUMN IF NOT EXISTS
  feature_vector vector(7);

-- User taste profiles
CREATE TABLE IF NOT EXISTS user_taste_profiles (
  fid BIGINT PRIMARY KEY,
  taste_vector vector(7) NOT NULL,
  track_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Find similar users (taste twins)
CREATE INDEX idx_taste_vector ON user_taste_profiles
  USING ivfflat (taste_vector vector_cosine_ops) WITH (lists = 10);
```

**Step 4: Query Similar Users**

```sql
-- Find the 5 members with the most similar music taste
SELECT fid, 1 - (taste_vector <=> $1) AS similarity
FROM user_taste_profiles
WHERE fid != $2
ORDER BY taste_vector <=> $1
LIMIT 5;
```

**Step 5: "Taste Twin" Feature**

```typescript
// API: GET /api/music/taste-matches?fid=12345
// Returns: [{ fid, username, similarity: 0.92, sharedTracks: 7 }, ...]
```

Display in the member profile:
> "Your Taste Twin: @alice (92% match) — you both love high-energy electronic with chill vibes"

### Scaling Considerations

- 100 users with 7-dim vectors = trivial for pgvector (no need for approximate nearest neighbor)
- Recalculate taste profiles nightly via cron job
- IVFFlat index with `lists = 10` is fine up to ~10K users
- If the community grows beyond 1K members, consider upgrading to HNSW index

### Alternative: Genre-Tag Based Matching (Simpler)

If audio feature enrichment is too complex initially, use genre tags:

```typescript
// Each user's taste = set of genres they engage with, weighted by frequency
const aliceTaste = { electronic: 0.4, hiphop: 0.3, ambient: 0.2, jazz: 0.1 };
const bobTaste   = { electronic: 0.5, ambient: 0.3, classical: 0.2 };

// Cosine similarity on genre vectors
// Similarity = 0.82 (high overlap on electronic + ambient)
```

This requires only genre tagging (from Cyanite, Spotify, or manual tags) — no audio feature extraction needed.

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Add `discovered_tracks` table (extract music links from casts)
- [ ] Integrate Odesli API for metadata resolution
- [ ] Add `track_engagement` table (play tracking)
- [ ] Build engagement tracking hooks in the audio player

### Phase 2: ZAO Daily (Week 3-4)
- [ ] Add `daily_playlist` + `daily_playlist_tracks` tables
- [ ] Implement scoring algorithm
- [ ] Build daily playlist generation cron job
- [ ] Build ZAO Daily UI component (card-based, mobile-first)
- [ ] Auto-post daily playlist to Farcaster channel

### Phase 3: Collaborative Playlists (Week 5-6)
- [ ] Add `community_playlists` + `playlist_tracks` tables
- [ ] Build playlist CRUD API routes
- [ ] Build playlist UI (add/remove/reorder tracks)
- [ ] Activity feed integration

### Phase 4: Metadata Enrichment (Week 7-8)
- [ ] Spotify Audio Features integration (for Spotify links)
- [ ] Cyanite.ai integration (for non-Spotify tracks)
- [ ] Store feature vectors in pgvector
- [ ] Genre/mood display in track cards

### Phase 5: Taste Matching (Week 9-10)
- [ ] Build user taste profile generation
- [ ] pgvector similarity queries
- [ ] "Taste Twin" UI in member profiles
- [ ] "Because you liked X" recommendations on the daily playlist

---

## Sources

- [Inside Spotify's Recommendation System (2025)](https://www.music-tomorrow.com/blog/how-spotify-recommendation-system-works-complete-guide)
- [How Spotify Algorithm Works 2026 | Chartlex](https://www.chartlex.com/blog/streaming/how-spotify-algorithm-works-2026-complete-guide)
- [Spotify Prompted Playlists (Dec 2025)](https://newsroom.spotify.com/2025-12-10/spotify-prompted-playlists-algorithm-gustav-soderstrom/)
- [SoundCloud Buzzing Playlists (Hypebot)](https://www.hypebot.com/hypebot/2024/05/soundcloud-enhances-music-discovery-with-fan-driven-buzzing-playlists.html)
- [SoundCloud Algorithm Explained](https://promosoundgroup.net/blogs/news/how-the-soundcloud-algorithm-works)
- [Sound.xyz NFT Marketplace](https://nftplazas.com/sound-xyz-music-nft-marketplace/)
- [Audius Developer Docs — REST API](https://docs.audius.org/api/)
- [Audius SDK (npm)](https://www.npmjs.com/package/@audius/sdk)
- [Spotify Audio Features API](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)
- [Spotify Audio Analysis API](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis)
- [Cyanite.ai Music Analysis API](https://cyanite.ai/2025/10/06/music-analysis-api-integration/)
- [Cyanite Audio Analysis V6 Classifier](https://api-docs.cyanite.ai/docs/audio-analysis-v6-classifier/)
- [Essentia.js — Browser Audio Analysis](https://mtg.github.io/essentia.js/)
- [Essentia.js GitHub](https://github.com/mtg/essentia.js/)
- [Essentia.js ML Inference Tutorial](https://mtg.github.io/essentia.js/docs/api/tutorial-3.%20Machine%20learning%20inference%20with%20Essentia.js.html)
- [Songlink / Odesli API](https://publicapi.dev/songlink-odesli-api)
- [odesli.js Node.js wrapper](https://github.com/MattrAus/odesli.js/)
- [Spotify Playlists API (Collaborative)](https://developer.spotify.com/documentation/web-api/concepts/playlists)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase AI & Vectors Guide](https://supabase.com/docs/guides/ai)
- [Spotify Contextual User Embeddings (Research)](https://research.atspotify.com/2021/04/contextual-and-sequential-user-embeddings-for-music-recommendation)
- [Cosine Similarity for Music Recommendations](https://beckernick.github.io/music_recommender/)
- [DAO Governance Best Practices 2025](https://tokenvitals.com/blog/dao-governance-evolution-best-practices)
