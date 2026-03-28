# 126 — Music Player Gap Analysis: What ZAO OS Is Missing

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Audit ZAO OS music player against top social music platforms (Spotify, Audius, SoundCloud, Sonata) to identify high-impact missing features
> **Builds on:** Doc 105 (Music Player UI), Doc 88 (Music-First Redesign), Doc 03 (Music Integration)

---

## Key Decisions / Recommendations

### Priority 1 — Ship This Week (High Impact, Low Effort)

| Feature | Why | Effort |
|---------|-----|--------|
| **Liked/Favorite Songs** | Every music app has this. Heart icon on tracks → personal "Liked Songs" collection. Audius, Spotify, SoundCloud all center around this. ZAO has zero favorites system. | ~4 hrs |
| **Listening History** | `songs` table already has `play_count` and `last_played_at`. Just need a "Recently Played" view on the Music page. Already tracked server-side — just no UI. | ~2 hrs |
| **Queue Reordering** | Current queue is read-only. Users can't reorder, remove, or add-next. Spotify, SoundCloud, every player allows this. | ~4 hrs |
| **Share Track to Chat** | One-tap "share to /zao channel" from any track card. MusicEmbed already renders beautifully — just need the send flow. | ~2 hrs |

### Priority 2 — Ship This Sprint (High Impact, Medium Effort)

| Feature | Why | Effort |
|---------|-----|--------|
| **Now Playing Presence** | Spotify's biggest 2026 feature (Jan 7, 2026). Show what members are listening to in real-time via Supabase Realtime presence. "🎵 Zaal is listening to..." in sidebar/members list. | ~6 hrs |
| **Collaborative Playlists** | Spotify Jam has 32-person collab playlists. ZAO playlists exist but are single-user. Add `collaborative` flag + multi-user add permissions. | ~4 hrs |
| **Sleep Timer** | Standard feature in every music player. "Stop playing in 15m / 30m / 1hr / end of track." Pure client-side — zero backend. | ~1 hr |
| **Crossfade** | Smooth transitions between tracks. 1-12 second configurable overlap. Enhances radio mode especially. Client-side only. | ~3 hrs |

### Priority 3 — Ship Next Sprint (Medium Impact, Higher Effort)

| Feature | Why | Effort |
|---------|-----|--------|
| **Reactions on Tracks** | Emoji reactions on songs (🔥 ❤️ 🎵 💎). Social signal for curation. Sonata uses NOTES token; ZAO could weight by Respect. | ~6 hrs |
| **"Friends Collected" Social Proof** | Show which ZAO members saved/liked a track: "Liked by DanSingJoy + 4 others." Zora pioneered this — powerful discovery signal. | ~4 hrs |
| **Lyrics Display** | Musixmatch API (free tier: 30% of lyrics, 2000 req/day) or Genius API. Show in expanded player. | ~6 hrs |
| **Waveform Comments** | SoundCloud-style timestamped comments on tracks. "This beat switch at 2:14 🔥." Requires new `song_comments` table. | ~8 hrs |
| **Respect-Weighted Curation** | High-Respect members' likes/shares surface tracks higher in discovery. Not just popularity — taste authority. ZAO's unique differentiator. | ~8 hrs |

### Not Worth Building (Yet)

| Feature | Why Skip |
|---------|----------|
| AI DJ / Personalized Radio | Need more listening data first. <100 members means cold-start problem. |
| Offline Playback | PWA limitation. Not possible for Spotify/YouTube embeds. Only works for Audius direct streams. |
| Equalizer | Browser Audio API limitations. Works poorly across platforms. |
| Spatial Audio | Requires platform support (Apple/Tidal only). Not relevant for a web player. |
| Voice Control | Gimmick for a 100-member community app. |

---

## What's Built vs What's Missing

### Currently Built (19 components, 15 API routes)

| Feature | Status | Components |
|---------|--------|------------|
| Multi-platform playback | ✅ Built | 9 platforms: Spotify, SoundCloud, YouTube, Audius, Apple Music, Tidal, Bandcamp, Sound.xyz, generic |
| Persistent bottom player | ✅ Built | `GlobalPlayer.tsx`, `PersistentPlayer.tsx` — desktop + mobile |
| Play/pause/prev/next | ✅ Built | Full transport controls |
| Shuffle & repeat | ✅ Built | Off/all/one repeat modes |
| Volume control | ✅ Built | Slider + mute toggle |
| Progress scrubber | ✅ Built | `Scrubber.tsx` with seeking |
| Waveform visualization | ✅ Built | `WaveformPlayer.tsx` (Audius tracks only, via wavesurfer.js) |
| Music queue | ✅ Built | `useMusicQueue.ts` + `MusicSidebar.tsx` |
| Song library | ✅ Built | `songs` table + `/api/music/library` (search, filter, sort) |
| Playlists (CRUD) | ✅ Built | `playlists` + `playlist_tracks` tables, full API |
| Add to playlist | ✅ Built | `AddToPlaylistButton.tsx` (just shipped!) |
| Radio stations | ✅ Built | 3 Audius stations via `community.config.ts` |
| Track of the Day | ✅ Built | Nominations, voting, admin selection |
| Song submissions | ✅ Built | Submit → admin review → approve/reject |
| Cross-platform links | ✅ Built | Songlink "Also on:" row in embeds |
| Share to Farcaster | ✅ Built | `ShareToFarcaster` on embeds |
| Quick-add floating button | ✅ Built | `QuickAddSong.tsx` |
| Metadata resolution | ✅ Built | oEmbed + Audius API + Sound.xyz GraphQL |
| Play count tracking | ✅ Built | Server-side `play_count` + `last_played_at` |

### NOT Built (Gaps)

| Feature | Impact | All competitors have it? | Codebase readiness |
|---------|--------|-------------------------|-------------------|
| **Liked/Favorite songs** | 🔴 Critical | Yes — Spotify, Audius, SoundCloud, Apple Music | Need `user_song_likes` table + heart button |
| **Listening history UI** | 🔴 Critical | Yes | Data exists (`last_played_at`). Just needs UI. |
| **Queue management** | 🟠 High | Yes | Queue is read-only. Need add/remove/reorder. |
| **Now playing presence** | 🟠 High | Spotify (Jan 2026), Discord | Supabase Realtime presence channel exists for listening rooms — extend it |
| **Collaborative playlists** | 🟠 High | Spotify Jam (32 users), SoundCloud | `playlists` table needs `collaborative` boolean |
| **Sleep timer** | 🟡 Medium | Spotify, Apple Music, most players | Pure client-side `setTimeout` |
| **Crossfade** | 🟡 Medium | Spotify, Poweramp, BlackPlayer | HTMLAudioProvider needs dual-audio-element pattern |
| **Track reactions** | 🟡 Medium | Audius (reposts/favorites), Sonata (NOTES) | New `song_reactions` table |
| **Social proof ("Liked by...")** | 🟡 Medium | Zora, Instagram | Query `user_song_likes` grouped by song |
| **Lyrics** | 🟡 Medium | Spotify, Apple Music, Musixmatch | External API integration |
| **Waveform comments** | 🟢 Low (unique) | SoundCloud only | New `song_comments` table with `timestamp_ms` |
| **Respect-weighted curation** | 🟢 Low (unique) | Nobody — ZAO exclusive | Multiply like weight by user's Respect score |

---

## Feature Deep Dives

### 1. Liked/Favorite Songs (Critical Gap)

**What every platform does:**
- Spotify: Heart icon → Liked Songs playlist (auto-generated, always first)
- Audius: Heart icon → Favorites page, also tracked on-chain as engagement signal
- SoundCloud: Heart icon → Likes tab on profile, visible to others

**ZAO OS implementation:**

```sql
-- New table
CREATE TABLE user_song_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid INTEGER NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_fid, song_id)
);
CREATE INDEX idx_user_song_likes_user ON user_song_likes(user_fid);
CREATE INDEX idx_user_song_likes_song ON user_song_likes(song_id);
```

**API routes needed:**
- `POST /api/music/library/like` — toggle like (upsert song first if needed)
- `GET /api/music/library?filter=liked` — extend existing library endpoint

**UI:** Heart icon on `MusicEmbed`, `MusicQueueTrackCard`, `GlobalPlayer` (same pattern as `AddToPlaylistButton`)

---

### 2. Now Playing Presence (Spotify's 2026 Headline Feature)

Spotify launched "Listening Activity" on January 7, 2026 — real-time display of what friends are streaming, visible in Messages. This was their biggest social feature launch of the year.

**ZAO OS already has the infrastructure:**
- `useListeningRoom.ts` uses Supabase Realtime for synchronized playback
- Supabase Realtime presence API tracks who's online

**Implementation:**
- When a user plays a track, broadcast to a `now-playing` Supabase Realtime channel
- Other users see "🎵 [Name] is listening to [Track]" in the member sidebar
- Tap to play the same track (one-tap social discovery)
- Privacy toggle in settings

This is ZAO's version of Spotify's Listening Activity, but better — because ZAO is a 100-member community where you actually know the people.

---

### 3. Queue Management

**Current state:** Queue is derived from `useMusicQueue.ts` which extracts music URLs from chat messages. It's read-only — users can't add, remove, or reorder tracks.

**What's needed:**
- User-controlled queue (separate from auto-generated chat queue)
- "Play Next" — insert track after current
- "Add to Queue" — append to end
- Remove track from queue
- Drag-to-reorder (mobile: long-press + drag)

**Implementation:** Lift queue state into `PlayerProvider` as a mutable array. Current chat-derived queue becomes the "auto-queue" that feeds into the user queue.

---

### 4. Respect-Weighted Curation (ZAO's Unique Edge)

No other platform has this. Spotify uses engagement metrics. Audius uses play counts. SoundCloud uses reposts.

ZAO can weight music discovery by **Respect score** — a member who has earned 500 Respect over 90 weeks of fractal participation has their likes/shares weighted higher than a new member. This creates a taste-authority system unique to ZAO.

**How it works:**
- Each like/share has a weight = `log2(user_respect + 1)`
- Trending = sum of weighted likes over time window
- "Top Curators" leaderboard based on how often their shared tracks get liked by others
- Feeds Sonata's insight: curation should be economically rewarded

---

## Competitive Comparison Matrix

| Feature | Spotify | Audius | SoundCloud | Sonata | ZAO OS |
|---------|---------|--------|------------|--------|--------|
| Multi-platform playback | Own only | Own only | Own only | None (links only) | ✅ **9 platforms** |
| Persistent player | ✅ | ✅ | ✅ | ❌ | ✅ |
| Liked/Favorites | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| Listening history | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** (data exists) |
| Playlists | ✅ | ✅ | ✅ | ❌ | ✅ |
| Add to playlist | ✅ | ✅ | ✅ | ❌ | ✅ |
| Queue management | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| Radio / auto-play | ✅ | ✅ | ✅ | ❌ | ✅ |
| Now playing presence | ✅ (Jan 2026) | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Collaborative playlists | ✅ (Jam, 32 ppl) | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Track reactions | ❌ | ✅ (repost/fav) | ✅ (repost/like) | ✅ (NOTES) | ❌ **MISSING** |
| Social proof | ❌ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Lyrics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Waveform player | ❌ | ✅ | ✅ | ❌ | ✅ (Audius only) |
| Cross-platform links | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Track of the Day | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Respect-weighted curation | ❌ | ❌ | ❌ | ❌ | Planned — **Unique** |
| Song submissions + review | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Sleep timer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crossfade | ✅ | ❌ | ❌ | ❌ | ❌ |
| Share to Farcaster | ❌ | ❌ | ❌ | ✅ | ✅ |

**ZAO OS strengths:** Multi-platform playback (nobody else does this), cross-platform links, TOTD, submissions/curation, Farcaster native.

**ZAO OS gaps:** No favorites, no history UI, no queue control, no social presence, no reactions.

---

## Recommended Build Order

```
Week 1: Liked Songs + Listening History UI + Sleep Timer
Week 2: Queue Management + Share Track to Chat
Week 3: Now Playing Presence + Collaborative Playlists
Week 4: Track Reactions + Social Proof ("Liked by...")
Future: Waveform Comments, Lyrics, Respect-Weighted Curation
```

---

## Sources

- [Spotify Listening Activity & Request to Jam (Jan 7, 2026)](https://newsroom.spotify.com/2026-01-07/listening-activity-request-to-jam-messages-updates/)
- [Spotify Real-Time Listening Features — TechCrunch](https://techcrunch.com/2026/01/07/spotify-now-lets-you-share-what-youre-streaming-in-real-time-with-friends/)
- [Spotify Music Discovery Features (Jan 28, 2026)](https://newsroom.spotify.com/2026-01-28/music-discovery-features/)
- [Top Music Streaming Trends 2026](https://www.nimbleappgenie.com/blogs/music-streaming-app-trends/)
- [Music Discovery Platforms 2026](https://resources.onestowatch.com/best-new-music-discovery-platforms/)
- [Audius Social Features](https://www.makeuseof.com/how-to-navigate-audius/)
- [Music Presence App](https://musicpresence.app)
- [Best Music Player Apps 2026 — Android Authority](https://www.androidauthority.com/best-music-player-apps-android-208990/)
- [Doc 105 — Music Player UI Patterns](../181-music-player-ui-showcase/)
- [Doc 88 — Music-First Platform Redesign](../082-music-social-platform-redesign/)
- [Doc 03 — Music Integration](../003-music-integration/)
