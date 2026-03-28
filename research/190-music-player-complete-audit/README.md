# 128 — ZAO OS Music Player: Complete Audit & Future Roadmap

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Catalog every music feature built in ZAO OS, verified against actual codebase, then map all remaining future features
> **Builds on:** Doc 126 (Gap Analysis), Doc 127 (Mobile Optimization), Doc 105 (Player UI), Doc 88 (Music-First Redesign)

---

## Summary Stats

| Metric | Count |
|--------|-------|
| **Components** | 23 files in `src/components/music/` |
| **API Routes** | 16 files, 23 endpoints in `src/app/api/music/` |
| **Audio Providers** | 10 files in `src/providers/audio/` (8 platform-specific + PlayerProvider + RadioProvider) |
| **Hooks** | 3 (`useMusicQueue`, `useRadio`, `useListeningRoom`) |
| **Lib utilities** | 5 files in `src/lib/music/` |
| **Database tables** | 4 (`songs`, `playlists`, `playlist_tracks`, `user_song_likes`) |
| **SQL migrations** | 2 (`create-music-library.sql`, `add-song-likes.sql`) |
| **Supported platforms** | 9 (Spotify, SoundCloud, YouTube, Audius, Sound.xyz, Apple Music, Tidal, Bandcamp, generic audio) |

---

## Part 1: Every Feature Currently Built (Verified in Code)

### 1.1 Playback Engine

| Feature | File(s) | Details |
|---------|---------|---------|
| **Multi-platform playback** | `providers/audio/*.tsx` | 9 platform providers: HTML5 Audio (direct streams), Spotify, SoundCloud, YouTube, Audius, Apple Music, Tidal, Bandcamp |
| **Module-level audio singleton** | `HTMLAudioProvider.tsx:7` | `let globalAudio: HTMLAudioElement` — survives React re-mounts and strict mode |
| **Play / pause / resume** | `PlayerProvider.tsx:346-365` | Dispatches to active platform controller + Redux-style state |
| **Seek** | `PlayerProvider.tsx:367-370` | Millisecond-precision seeking via controller |
| **Stop** | `PlayerProvider.tsx:372-375` | Pauses controller + clears state |
| **Volume control** | `PlayerProvider.tsx:377-383` | 0-1 float, clamped, dispatches to controller `setVolume()` |
| **Shuffle** | `PlayerProvider.tsx:385` | Toggle boolean, used by RadioProvider for queue randomization |
| **Repeat modes** | `PlayerProvider.tsx:386` | Three modes: off → all → one (cycle) |
| **State persistence** | `PlayerProvider.tsx:159-172` | Saves to `localStorage` key `zao-player-state`: metadata, position, duration, volume, shuffle, repeat |
| **State restoration** | `PlayerProvider.tsx:327-345` | Restores track on page reload, shows as paused until user taps play, seeks to saved position |
| **Autoplay error handling** | `HTMLAudioProvider.tsx:32-34` | Catches browser autoplay block, shows "Tap play again" message |
| **Background play attempt** | `HTMLAudioProvider.tsx:74-79` | Calls `audio.play()` on load for mobile background continuity |

### 1.2 MediaSession API (Lock Screen Controls)

| Feature | File | Line(s) |
|---------|------|---------|
| **Metadata** (title, artist, album, artwork 512x512) | `PlayerProvider.tsx` | 182-189 |
| **Playback state sync** (playing/paused) | `PlayerProvider.tsx` | 191 |
| **Position state** (progress bar + scrubber on lock screen) | `PlayerProvider.tsx` | 194-200 |
| **play** handler | `PlayerProvider.tsx` | 213 |
| **pause** handler | `PlayerProvider.tsx` | 217 |
| **nexttrack** handler | `PlayerProvider.tsx` | 221 |
| **previoustrack** handler (restart if >3s) | `PlayerProvider.tsx` | 224-230 |
| **seekbackward** (10s default) | `PlayerProvider.tsx` | 236-242 |
| **seekforward** (10s default) | `PlayerProvider.tsx` | 247-253 |
| **seekto** (lock screen scrubber drag) | `PlayerProvider.tsx` | 258-265 |
| **stop** handler | `PlayerProvider.tsx` | 270-273 |

**Status: 100% complete** — all 8 relevant MediaSession actions implemented.

### 1.3 Mobile Experience

| Feature | File | Details |
|---------|------|---------|
| **Persistent compact player** | `PersistentPlayer.tsx` | Fixed bottom bar on ALL authenticated pages (above mobile nav) |
| **Expanded full-screen player** | `ExpandedPlayer.tsx` | Tap artwork/track info → full-screen with large artwork, scrubber, all controls |
| **Swipe to skip (compact bar)** | `PersistentPlayer.tsx` | Horizontal swipe >60px on compact bar skips prev/next |
| **Swipe to skip (expanded)** | `ExpandedPlayer.tsx` | Swipe left/right on artwork to skip tracks |
| **Swipe down to dismiss** | `ExpandedPlayer.tsx` | Swipe down >80px on expanded player → back to compact |
| **Haptic feedback** | `PlayerProvider.tsx` | `navigator.vibrate(10)` on play, pause, resume, stop |
| **Wake Lock** | `PlayerProvider.tsx:290-293` | `navigator.wakeLock.request('screen')` keeps screen on during playback |
| **Farcaster safe area insets** | `GlobalPlayer.tsx:38-47` | Bottom padding for Mini App context |
| **Volume popover (persistent)** | `PersistentPlayer.tsx` | Speaker icon → horizontal slider popover with mute toggle |
| **Volume popover (expanded)** | `ExpandedPlayer.tsx` | Full horizontal volume slider with mute/unmute + percentage |

### 1.4 Desktop Player

| Feature | File | Details |
|---------|------|---------|
| **Full desktop bar** | `GlobalPlayer.tsx` | Three-section layout: artwork+info / controls+scrubber / volume+actions |
| **Waveform scrubber** | `Scrubber.tsx` | 60-bar pseudo-waveform (seeded random), gold fill for played, range input overlay |
| **Inline volume slider** | `GlobalPlayer.tsx:199-228` | Speaker icon + 16px range slider + mute toggle |
| **Queue toggle** | `GlobalPlayer.tsx:246-264` | Queue icon with badge count, toggles MusicSidebar |
| **Sleep timer** | `SleepTimerButton.tsx` | 15m/30m/1hr/end-of-track with countdown badge (desktop only) |
| **Radio mode badge** | `GlobalPlayer.tsx:234-240` | "RADIO" badge when in radio mode |
| **Platform badge** | `GlobalPlayer.tsx:242-243` | Shows current platform (Spotify/SoundCloud/etc.) |
| **Close button** | `GlobalPlayer.tsx:266-273` | X to stop and dismiss player |
| **Artwork glow effect** | `GlobalPlayer.tsx:67-75` | Subtle color bleed behind player from artwork |
| **Error banner** | `GlobalPlayer.tsx:80-84` | Red banner with error message + dismiss button |

### 1.5 Track Actions (on Every Track)

| Feature | Components where it appears | Details |
|---------|---------------------------|---------|
| **Like (heart)** | MusicEmbed, MusicQueueTrackCard, GlobalPlayer, PersistentPlayer, ExpandedPlayer | Toggle via `POST /api/music/library/like`, optimistic update, gold fill when liked |
| **Add to playlist** | MusicEmbed, MusicQueueTrackCard, GlobalPlayer, PersistentPlayer, ExpandedPlayer | Popover with user playlists, "New playlist" inline create, upserts song to library first |
| **Share to Farcaster** | MusicEmbed | `ShareToFarcaster` component with song template |
| **Cross-platform links** | MusicEmbed | Songlink API "Also on:" row (other platforms where track exists) |

### 1.6 Music Page Tabs

| Tab | Component | What it shows |
|-----|-----------|---------------|
| **Radio** | `RadioHero` (in MusicPage) | Now-playing hero with large artwork, transport controls, station switcher pills |
| **Track of the Day** | `TrackOfTheDay` (dynamic import) | Daily nomination window, voting, admin selection, banner at top of page |
| **Submissions** | `SubmissionsSection` | User-submitted tracks with artwork, play, vote (🔥), status |
| **Trending** | `TrendingSection` | Horizontal scroll of Audius trending tracks (8 cards) from Audius API |
| **Playlists** | `PlaylistsSection` | Radio station playlist cards with play/active state |
| **Binaural** | `BinauralBeats` (dynamic import) | 5 presets (Delta/Theta/Alpha/Beta/Schumann), Web Audio oscillators, timer, volume |
| **Liked** | `LikedSongsSection` | User's liked tracks from `/api/music/library/like?list=true` |
| **History** | `HistorySection` | Recently played tracks sorted by `last_played_at` |

### 1.7 Radio System

| Feature | File | Details |
|---------|------|---------|
| **3 Audius stations** | `community.config.ts:49-68` | Ambition (Stilo World), Lofi Chill, Electronic |
| **Station switching** | `RadioProvider.tsx` | Switch between stations, auto-shuffle on load |
| **Auto-advance** | `PersistentPlayerWithRadio.tsx` | Auto-plays next track when current ends (works on ALL pages) |
| **Radio button in header** | `RadioButton.tsx` | Quick toggle to start/stop radio from any page |
| **One-tap start** | `PersistentPlayer.tsx:42-79` | Idle state shows "ZAO Radio — Tap to play" |

### 1.8 Song Library & Curation

| Feature | API Route | Details |
|---------|-----------|---------|
| **Song library** | `GET /api/music/library` | Search (full-text), filter by platform, sort (recent/popular/played), pagination |
| **Add song by URL** | `POST /api/music/library` | Auto-resolves metadata via oEmbed, upserts to `songs` table |
| **Play count tracking** | `POST /api/music/library/play` | Increments `play_count` + updates `last_played_at` |
| **Like/unlike** | `POST /api/music/library/like` | Toggle like, returns `{ liked, likeCount }` |
| **Check like status** | `GET /api/music/library/like` | Returns `{ liked, likeCount }` for a URL |
| **Playlists CRUD** | `GET/POST /api/music/playlists` | List (personal/community/all), create personal playlists |
| **Playlist tracks** | `POST/DELETE /api/music/playlists/[id]/tracks` | Add/remove songs, auto-position |
| **Song submissions** | `GET/POST /api/music/submissions` | Submit songs with title/artist/genre, list pending/approved |
| **Submission voting** | `POST /api/music/submissions/vote` | Upvote/downvote submissions |
| **Submission review** | `POST /api/music/submissions/review` | Admin approve/reject |
| **Track of the Day** | `GET/POST /api/music/track-of-day` | Nominate, vote, admin select winner |
| **Metadata resolution** | `GET /api/music/metadata` | oEmbed for Spotify/SoundCloud/YouTube, GraphQL for Sound.xyz, Audius API |
| **Songlink resolution** | `GET /api/music/resolve` | Cross-platform links via Songlink/Odesli |
| **Quick-add floating button** | `QuickAddSong.tsx` | "+" button for quick submission from any page, auto-fetches metadata |

### 1.9 Binaural Beats

| Feature | Details |
|---------|---------|
| **5 presets** | Deep Sleep (2.5Hz delta), Meditation (6Hz theta), Calm Focus (10Hz alpha), Deep Focus (15Hz beta), Schumann Resonance (7.83Hz theta) |
| **Web Audio API engine** | Dual `OscillatorNode` + `ChannelMerger` for true L/R stereo separation |
| **Volume control** | Independent volume slider (0-100) |
| **Session timer** | 10min / 15min / 30min / 1hr / unlimited, auto-stop on expiry |
| **Headphone notice** | Explains stereo requirement for binaural effect |

### 1.10 Additional Components

| Component | Purpose |
|-----------|---------|
| `WaveformPlayer.tsx` | Wavesurfer.js integration for visual waveform (Audius tracks) |
| `WaveformPlayerWrapper.tsx` | Lazy wrapper for WaveformPlayer |
| `MusicSidebar.tsx` | Slide-out queue sidebar with track cards, mobile bottom-sheet variant |
| `MusicQueueTrackCard.tsx` | Individual track card in queue: artwork, title, artist, platform badge, like, playlist |
| `MusicEmbed.tsx` | Inline song card in chat: artwork, metadata, play overlay, platform colors, cross-platform links |
| `UniversalLinkCard.tsx` | Generic link card for non-music URLs |
| `ArtworkImage.tsx` | Safe Image wrapper with fallback for missing artwork |
| `SubmissionReviewQueue.tsx` | Admin-only queue for reviewing pending submissions |
| `MusicSkeletons.tsx` | Loading skeleton components (TrackCard, NowPlayingHero, PillarCard, MusicGrid) |

### 1.11 Database Schema

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `songs` | id, url (unique), platform, title, artist, artwork_url, stream_url, duration, play_count, last_played_at, search_vector | Single source of truth for all music |
| `playlists` | id, name, created_by_fid, type (personal/community/totd_archive/auto), is_public | User and community playlists |
| `playlist_tracks` | playlist_id, song_id, position, added_by_fid | Join table with ordering |
| `user_song_likes` | user_fid, song_id (unique together) | Per-user favorites |
| `song_submissions` | url, title, artist, track_type, submitted_by_fid, status, vote_count | Submission pipeline |

---

## Part 2: Feature Comparison vs Competitors (Updated)

| Feature | Spotify | Audius | SoundCloud | Sonata | ZAO OS |
|---------|---------|--------|------------|--------|--------|
| Multi-platform playback | Own only | Own only | Own only | None | ✅ **9 platforms** |
| Persistent player | ✅ | ✅ | ✅ | ❌ | ✅ |
| Expanded full-screen player | ✅ | ✅ | ✅ | ❌ | ✅ |
| Lock screen controls (full) | ✅ | ✅ | ✅ | ❌ | ✅ **All 8 actions** |
| Lock screen progress bar | ✅ | ❌ | ❌ | ❌ | ✅ |
| Swipe to skip | ✅ | ❌ | ❌ | ❌ | ✅ |
| Haptic feedback | ✅ | ❌ | ❌ | ❌ | ✅ |
| Wake Lock | N/A | ❌ | ❌ | ❌ | ✅ |
| Liked/Favorites | ✅ | ✅ | ✅ | ❌ | ✅ |
| Listening history | ✅ | ✅ | ✅ | ❌ | ✅ |
| Playlists | ✅ | ✅ | ✅ | ❌ | ✅ |
| Add to playlist | ✅ | ✅ | ✅ | ❌ | ✅ |
| Radio / auto-play | ✅ | ✅ | ✅ | ❌ | ✅ (3 Audius stations) |
| Track of the Day | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Song submissions + review | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Cross-platform links | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Binaural beats | ❌ | ❌ | ❌ | ❌ | ✅ **Unique** |
| Share to Farcaster | ❌ | ❌ | ❌ | ✅ | ✅ |
| Waveform visualization | ❌ | ✅ | ✅ | ❌ | ✅ (Audius) |
| Sleep timer | ✅ | ❌ | ❌ | ❌ | ✅ |
| Volume control | ✅ | ✅ | ✅ | ❌ | ✅ (desktop + mobile popover) |
| Queue management | ✅ | ✅ | ✅ | ❌ | ❌ **MISSING** |
| Now playing presence | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Collaborative playlists | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Track reactions | ❌ | ✅ | ✅ | ✅ | ❌ **MISSING** |
| Social proof ("Liked by...") | ❌ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Crossfade | ✅ | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Gapless playback | ✅ | ❌ | ✅ | ❌ | ❌ **MISSING** |
| Lyrics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Waveform comments | ❌ | ❌ | ✅ | ❌ | ❌ |
| Respect-weighted curation | ❌ | ❌ | ❌ | ❌ | ❌ (Planned — **Unique**) |

---

## Part 3: Future Features Roadmap (Prioritized)

### Tier 1 — Next Sprint (High Impact, Code-Ready)

| # | Feature | Effort | Why Now |
|---|---------|--------|---------|
| 1 | **Queue Management** | ~6 hrs | Queue is read-only. Need: add-next, add-to-queue, remove, reorder. Lift queue into PlayerProvider as mutable array. Every competitor has this. |
| 2 | **Now Playing Presence** | ~6 hrs | Spotify's biggest 2026 feature. Broadcast current track via Supabase Realtime presence. "🎵 Zaal is listening to..." in member sidebar. Infrastructure already exists (`useListeningRoom.ts`). |
| 3 | **Collaborative Playlists** | ~4 hrs | Add `collaborative` boolean to `playlists` table. Allow multiple users to add tracks. Spotify Jam does 32 users. |
| 4 | **Share Track to Chat** | ~2 hrs | One-tap share from any track card to /zao channel. MusicEmbed already renders beautifully in chat. Just need the send flow. |
| 5 | **Crossfade + Gapless** | ~6 hrs | `@regosen/gapless-5` (npm) handles both — HTML5 Audio for instant start, WebAudio for gapless transitions. Configurable crossfade curves. Most impactful for radio mode. |

### Tier 2 — Next Month (Social Features)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 6 | **Track Reactions** | ~6 hrs | Emoji reactions on songs (🔥 ❤️ 🎵 💎). Social signal for curation. New `song_reactions` table. |
| 7 | **Social Proof ("Liked by...")** | ~4 hrs | Show which ZAO members liked a track. Query `user_song_likes` grouped by song. "Liked by DanSingJoy + 4 others." |
| 8 | **Respect-Weighted Curation** | ~8 hrs | High-Respect members' likes surface tracks higher. `weight = log2(user_respect + 1)`. ZAO's unique differentiator. Nobody else has this. |
| 9 | **Top Curators Leaderboard** | ~4 hrs | Who shares the most-liked tracks? Track curation quality over time. |

### Tier 3 — Future (Content & Discovery)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 10 | **Lyrics Display** | ~6 hrs | Musixmatch API (free: 30% lyrics, 2K req/day) or Genius API. Show in expanded player. |
| 11 | **Waveform Comments** | ~8 hrs | SoundCloud-style timestamped comments. New `song_comments` table with `timestamp_ms`. |
| 12 | **Ambient Sound Mixer** | ~6 hrs | Layer rain/ocean/forest over binaural beats. `AudioBufferSourceNode` with looped audio files, per-layer gain. |
| 13 | **Custom Binaural Presets** | ~3 hrs | Carrier Hz + beat Hz sliders for custom frequencies. Save favorites. |
| 14 | **Artist Profiles (Music-First)** | ~8 hrs | Dedicated artist pages aggregating all their tracks, play counts, likes across the community. |

### Tier 4 — Infrastructure

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 15 | **iOS PWA Audio Messaging** | ~2 hrs | "For best audio on iPhone, use Safari" banner. iOS PWA background audio is broken (WebKit bug #198277). |
| 16 | **Service Worker Audio Caching** | ~4 hrs | Cache Audius stream URLs for faster repeat plays. Only for direct streams. |
| 17 | **Offline Indicator** | ~1 hr | Show "Offline — cached tracks only" when disconnected. |

### Not Worth Building

| Feature | Reason |
|---------|--------|
| Web Audio equalizer | Unreliable cross-browser, Safari WebAudio bugs |
| Visualizer/spectrum | Cool but distracting, waveform bars already serve this |
| Picture-in-Picture | Only for video elements, audio PiP not standardized |
| Download for offline | DRM nightmare for Spotify/YouTube. Only Audius is open. |
| AI DJ / personalized radio | Need more listening data first. <100 members = cold-start problem. |
| Voice control | Gimmick for a 100-member community app |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Music Page (8 tabs)                     │
│  Radio │ TOTD │ Submissions │ Trending │ Playlists │ ...     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  MusicEmbed      │  │  MusicSidebar   │  │ BinauralBeats││
│  │  (in chat feed)  │  │  (queue panel)  │  │ (Web Audio)  ││
│  │  Like│+Playlist  │  │  TrackCards     │  │ 5 presets    ││
│  │  Share│Songlink  │  │  Like│+Playlist │  │ Timer+Volume ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                              │
├──────────────────────────────────────────────────────────────┤
│               PersistentPlayer (ALL pages)                   │
│  [Artwork] [Info] [Vol] [♥] [+] [⟨⟨] [▶] [⟩⟩] [✕] [☰]    │
│  Tap artwork/info → ExpandedPlayer (full-screen)             │
│  Swipe left/right → skip tracks                              │
├──────────────────────────────────────────────────────────────┤
│                 GlobalPlayer (Music page)                     │
│  Desktop: full scrubber, shuffle, repeat, sleep timer        │
├──────────────────────────────────────────────────────────────┤
│                    PlayerProvider                             │
│  State (Redux-style) │ MediaSession (8 actions) │ Wake Lock  │
│  Haptics │ localStorage persistence │ onEnded callback       │
├──────────────────────────────────────────────────────────────┤
│              Platform Controllers (9)                         │
│  HTML5Audio │ Spotify │ SoundCloud │ YouTube │ Audius │ ...  │
├──────────────────────────────────────────────────────────────┤
│                RadioProvider                                  │
│  3 Audius stations │ Shuffle │ Auto-advance │ Station switch  │
├──────────────────────────────────────────────────────────────┤
│                    Supabase                                   │
│  songs │ playlists │ playlist_tracks │ user_song_likes        │
│  song_submissions │ Full-text search │ RLS                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Sources

- Codebase audit: `src/components/music/` (23 files), `src/app/api/music/` (16 files), `src/providers/audio/` (10 files)
- [Doc 126 — Music Player Gap Analysis](../126-music-player-gap-analysis/)
- [Doc 127 — Mobile Player Optimization](../189-mobile-player-optimization/)
- [Doc 105 — Music Player UI Patterns](../181-music-player-ui-showcase/)
- [Doc 88 — Music-First Platform Redesign](../082-music-social-platform-redesign/)
- [Spotify Listening Activity (Jan 2026)](https://newsroom.spotify.com/2026-01-07/listening-activity-request-to-jam-messages-updates/)
- [MediaSession API — web.dev](https://web.dev/articles/media-session)
- [Gapless-5 — GitHub](https://github.com/regosen/Gapless-5)
