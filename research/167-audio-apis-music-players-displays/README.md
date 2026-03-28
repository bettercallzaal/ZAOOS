# 167 — Audio APIs, Music Players & Display Patterns

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Comprehensive audit of audio API landscape, music player implementations, and display/visualization patterns — cross-referenced with ZAO OS's existing 42-component music system

## Key Decisions / Recommendations

| Decision | Recommendation | Priority |
|----------|----------------|----------|
| **Primary music API** | KEEP Audius — free, no Premium gate, v15 SDK, best web3 fit. Spotify is now hostile to indie devs (5-user dev mode limit, gutted metadata endpoints) | Confirmed |
| **Crossfade engine** | KEEP current dual-element approach — matches Koel (17K stars, MIT) gold standard using `requestAnimationFrame` for smooth ramps | Confirmed |
| **Equalizer** | ADD 5-band EQ using `BiquadFilterNode` chain. Adapt jellyamp-pwa pattern (60Hz/230Hz/910Hz/3.6kHz/14kHz). Critical: `createMediaElementSource()` can only be called once per element | Next |
| **Spectrum visualizer** | ADD audioMotion-analyzer (v4.5.4, zero deps, small bundle) for real-time spectrum display alongside existing wavesurfer.js waveforms | Next |
| **Gapless playback** | KEEP dual-element preload-and-swap — ZAO OS already does this. Consider gapless.js (MIT, 56 stars) only if Web Audio API decode is needed | Confirmed |
| **TIDAL integration** | UPGRADE from external-redirect to SDK playback — TIDAL now has a public developer portal (developer.tidal.com) with web Player module | Future |
| **Last.fm scrobbling** | ADD — 3-hour build. Internal play counting exists (`/api/music/library/play`) but no external scrobbling. Artists want attribution | Next |
| **Apple MusicKit JS** | SKIP full playback — requires $99/year Apple Developer Program + user must have Apple Music subscription. Keep 30s preview + external redirect | Skip |
| **SoundCloud** | KEEP widget embed — rate-limit-free (15K req/day limit does NOT apply to widget). New API keys require manual review | Confirmed |
| **iOS PWA background audio** | ACCEPT limitation — Apple has not fixed this. Use Wake Lock (Safari 18.4+) + MediaSession. Background audio still interrupts on iOS | Accepted |
| **Web Audio API 1.1** | MONITOR — Configurable Render Quantum (lower latency for binaural engine) landing in Chrome M145-M150. Safari 26 adds WebCodecs audio | Monitor |

---

## Part 1: What ZAO OS Already Has (Codebase Ground Truth)

### Architecture Overview

```
src/components/music/   → 42 files (players, queue, embeds, visualization, submissions)
src/providers/audio/    → 10 providers (9 platforms + base PlayerProvider)
src/app/api/music/      → 16 route groups, 23+ endpoints
src/hooks/              → 7 music hooks (usePlayer, useRadio, useNowPlaying, etc.)
src/lib/music/          → 7 utility modules (library, audius, songlink, filters, etc.)
```

### Platform Integration Status

| Platform | Playback | Metadata | Discovery | Method | Notes |
|----------|:--------:|:--------:|:---------:|--------|-------|
| **Audius** | YES | YES | YES | HTML5 Audio direct stream | Primary. Trending, underground, radio, search. `@audius/sdk` v15 |
| **Spotify** | YES | YES | NO | IFrame Web Playback SDK | Requires Premium. Feb 2026 API gutted metadata endpoints |
| **YouTube** | YES | YES | NO | IFrame API | 500ms progress polling. Supports youtube.com, youtu.be, music.youtube.com |
| **SoundCloud** | YES | YES | NO | Widget API (iframe) | Rate-limit-free widget. New API keys require manual review |
| **Sound.xyz** | YES | YES | NO | HTML5 Audio + GraphQL | IPFS support. Web3 native |
| **Apple Music** | NO | YES | NO | External redirect | 30s preview only unless user has Apple Music subscription |
| **Tidal** | NO | YES | NO | External redirect | NEW: Public developer portal exists now. SDK has Player module |
| **Bandcamp** | NO | YES | NO | External redirect | iframe limitations |
| **Audio Files** | YES | NO | NO | HTML5 Audio | .mp3/.wav/.ogg/.flac/.aac/.m4a/.opus |
| **Songlink/Odesli** | N/A | N/A | YES | REST API | Universal cross-platform resolver |

### Component Inventory (42 files in `src/components/music/`)

**Core Players:**
- `GlobalPlayer.tsx` — Main playback UI (play/pause, seek, volume, repeat, shuffle, queue)
- `ExpandedPlayer.tsx` — Full-screen player with enhanced controls
- `PersistentPlayer.tsx` — Sticky bar persisting across navigation
- `PersistentPlayerWithRadio.tsx` — Extended with radio station switching
- `NowPlayingBar.tsx` — Compact now-playing display

**Visualization:**
- `WaveformPlayer.tsx` — Wavesurfer.js integration (click-to-seek, real-time progress)
- `WaveformPlayerWrapper.tsx` — Context wrapper
- `WaveformComments.tsx` — Timeline-overlaid comments

**Audio Processing:**
- `AudioFiltersPanel.tsx` — 43+ presets (nightcore, vaporwave, lo-fi, trap, demon, angel) via `playbackRate`
- `CrossfadeSettings.tsx` — 0-12s crossfade with dual-element fade routing
- `SleepTimer.tsx` / `SleepTimerButton.tsx` — Auto-stop (10m/15m/30m/1h)
- `BinauralBeats.tsx` — Web Audio API oscillators (delta/theta/alpha/beta, Schumann 7.83Hz)
- `AmbientMixer.tsx` — White/pink/brown noise (Voss-McCartney algorithm) + file-based loops

**Metadata & Social:**
- `ArtworkImage.tsx` — Album art with fallback
- `LyricsPanel.tsx` — Synchronized lyrics
- `TrackReactions.tsx` — Emoji reactions
- `MusicEmbed.tsx` — Universal platform embed handler
- `UniversalLinkCard.tsx` — Songlink/Odesli multi-platform card
- `ShareMenu.tsx` / `ShareToChatButton.tsx` — Social sharing

**Queue & Playlists:**
- `QueuePanel.tsx` — Queue display/management
- `QueueActions.tsx` — Bulk operations
- `MusicQueueTrackCard.tsx` — Track card with drag-reorder
- `AddToPlaylistButton.tsx` — Playlist addition

**Discovery & Curation:**
- `AudiusDiscover.tsx` — Audius trending/underground browser
- `SongSubmit.tsx` — Community song submission
- `SubmissionReviewQueue.tsx` — Moderation interface
- `TrackOfTheDay.tsx` — Daily featured track
- `TopCurators.tsx` — Curator showcase
- `RespectTrending.tsx` — Respect-weighted trending

### Dual-Engine Audio Provider (`src/providers/audio/`)

**PlayerProvider.tsx** — Central state manager:
- Full MediaSession API (all 8 actions + position state)
- Wake Lock API (keeps screen on during playback)
- localStorage persistence (resume from exact position)
- Controller registration pattern for multi-platform support

**HTMLAudioProvider.tsx** — Dual HTML5 Audio engine:
- Module-level singleton elements (`audioA`, `audioB`) survive re-mounts
- Linear volume ramping: 20 steps/second, 0-12s configurable
- Exposed as `__zao_audio_a` / `__zao_audio_b` for Web Audio API hooks
- Supports: `audio`, `soundxyz`, `audius` content types

### API Routes (16 groups, 23+ endpoints)

Core: `/api/music/radio`, `/metadata`, `/resolve`, `/library/play`, `/library/like`, `/library/react`
Playlists: `/playlists`, `/playlists/[id]`, `/playlists/[id]/tracks`
Community: `/submissions`, `/submissions/review`, `/submissions/vote`, `/track-of-day`, `/track-of-day/vote`
Discovery: `/trending-weighted`, `/curators`, `/artists`, `/lyrics`
Social: `/comments`, `/share-card`, `/frame`, `/generate`

---

## Part 2: Audio API Landscape (March 2026)

### Spotify — Hostile to Indie Devs

**February 2026 breaking changes:**
- Dev Mode now requires app owner to have active Spotify Premium
- Limited to 1 Client ID per developer, 5 authorized users per app
- **Removed endpoints:** `/artists/{id}/top-tracks`, `/browse/new-releases`, `/browse/categories`, all bulk fetch endpoints
- **Removed fields:** `popularity`, `available_markets`, `followers` (from artists), `label` (from albums)
- Search `limit` reduced from 50 to 10, default from 20 to 5
- Rationale: Spotify explicitly cited "AI-aided automation" as reason

**Impact on ZAO OS:** Spotify embed still works for playback (Premium users), but metadata fetching is severely limited. Extended Quota Mode requires application + approval. **Audius remains the correct primary API choice.**

Sources: [Spotify Feb 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [TechCrunch](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)

### Audius — Best Fit for Web3 Music

- **SDK:** `@audius/sdk` v15.0.1 (March 2026, 331 versions)
- **Pricing:** Free, unlimited. Contact api@audius.co for higher limits
- **Rate limits:** ~3,000 req/hour for streaming (node config defaults)
- **Auth:** Optional API key via `audius.co/settings` for higher limits
- **All content free to stream** — no Premium gate
- **API:** REST at `https://api.audius.co/v1` + GraphQL subgraph via The Graph

Source: [@audius/sdk on npm](https://www.npmjs.com/package/@audius/sdk)

### TIDAL — New Public API (Upgrade Opportunity)

- **NEW:** Public developer portal at [developer.tidal.com](https://developer.tidal.com/)
- REST API for catalog metadata (search, tracks, albums, artists)
- **Playback via SDK only** — Player module is required (cannot use raw streams)
- Auth: OAuth 2.1
- Dev mode is restrictive; production requires "Application Review"
- **Worth investigating** for HiFi content access

Source: [TIDAL Developer Portal](https://developer.tidal.com/)

### SoundCloud — Widget is Rate-Limit-Free

- **Widget API:** Rate limits do NOT apply to embedded widget player
- **API access:** New keys require manual review via chatbot "Otto"
- **Rate limits (API only):** 15,000 req/24hrs, 50 tokens/12hrs/app
- **Commercial use:** Generally prohibited (exception: uploaders on own site)

Source: [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget)

### Apple MusicKit JS v3

- Requires Apple Developer Program ($99/year)
- Non-subscribers: 30-second preview only
- Subscribers: Full playback via Music User Token
- **No iOS PWA background playback** — MusicKit relies on single `MediaElement`
- **Verdict:** Not worth the cost for a 100-member community. Keep external redirect.

Source: [MusicKit JS v3 Docs](https://js-cdn.music.apple.com/musickit/v3/docs/)

### YouTube IFrame API

- Active, no 2026 deprecation. Listed as "Subject API Service" with extended maintenance
- Removed: `clearVideo()`, `modestbranding`, `showinfo`
- New: `onAutoplayBlocked` event for browser autoplay policies
- Standard ToS: no audio-only extraction, no hiding the player

Source: [YouTube IFrame API Reference](https://developers.google.com/youtube/iframe_api_reference)

---

## Part 3: Web Audio API & Browser Updates

### Web Audio API 1.1 (W3C Working Draft, target Q4 2026)

| Feature | Status | Impact on ZAO |
|---------|--------|--------------|
| **Configurable Render Quantum** | Chrome M145-M150 experimental | Lower latency for binaural beats engine (custom buffer size instead of fixed 128 frames) |
| **`performance.now()` in AudioWorklet** | Finalizing | High-res timer in audio thread for precise scheduling |
| **Output Buffer Bypass** | Shipped in Chrome | Removes one buffer of latency, prevents latency growth |
| **`AudioContext` interrupted state** | Origin Trial (Chromium) | Better handling of audio interruptions |

### Safari 26 (Fall 2026)

| Feature | Relevance |
|---------|-----------|
| `AudioEncoder` / `AudioDecoder` (WebCodecs) | Raw audio frame manipulation for advanced processing |
| ALAC + PCM in `MediaRecorder` | High-quality recording if we add user audio features |
| Speaker Selection API (iOS/iPadOS) | Users can choose output device |
| Detachable `MediaSource` objects (MSE) | Better streaming buffer management |

### iOS PWA Background Audio — Still Broken

- Apple has NOT fixed PWA background audio as of iOS 26 beta
- **Mitigations in ZAO OS:** Wake Lock API (Safari 18.4+) + MediaSession (iOS 15+)
- Service Worker audio caching: 7-day expiry, 50MB cap
- **Accepted limitation** — native wrapper (Capacitor/Expo) is the only fix

Sources: [Safari 26 Beta](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/), [WebKit Bug 198277](https://bugs.webkit.org/show_bug.cgi?id=198277)

---

## Part 4: Reference Implementations

| Project | Stars | License | Key Pattern | Adaptable for ZAO? |
|---------|-------|---------|-------------|:-------------------:|
| **koel/koel** | 17,101 | MIT | Crossfade via `requestAnimationFrame` volume ramp. `CrossfadeState` object tracks incoming audio + rafId. | YES — ZAO already uses dual-element, but rAF is smoother than setInterval |
| **wavesurfer.js** | 10,161 | BSD-3-Clause | v7.12.5, TypeScript-native, Shadow DOM, plugin architecture (regions, timeline, spectrogram, minimap). ~20KB gzipped. | Already using |
| **audioMotion-analyzer** | N/A | MIT | Real-time spectrum analyzer. 240 frequency bands, dual-channel, logarithmic/linear/perceptual scales, custom gradients. Zero deps. | YES — add for visual spectrum |
| **Peaks.js** (BBC) | Maintained | BSD-3-Clause | Server-side pre-computed waveform data + modular zoom/scroll display. ~30KB. | Alternative to wavesurfer for large files |
| **jellyamp-pwa** | Small | N/A | 5-band EQ (60Hz/230Hz/910Hz/3.6kHz/14kHz). `BiquadFilterNode` chain. Handles `createMediaElementSource` once-per-element constraint. | YES — cleanest EQ implementation found |
| **gapless.js** | 56 | MIT | Three modes: `GAPLESS` (Web Audio decode), `NATIVE` (browser), `HTML5_ONLY` (fallback). | Optional — ZAO already does dual-element gapless |
| **tidal-sdk-web** | 195 | Apache-2.0 | Gapless E2E tests (Cypress), play log tracking. | Reference for testing patterns |
| **Audius apps** | 607 | Apache-2.0 | Official mono-repo. Auto-generated TypeScript SDK types. | Reference for Audius SDK upgrade |
| **dingyi222666/aura-music** | N/A | N/A | `usePlayer` hook with `PlayState` enum, `PlayMode` (shuffle/repeat), playback snapshot persistence, `audioRef`. Most complete React music player hook found. | Reference pattern |

### Code Pattern: 5-Band Equalizer (from jellyamp-pwa)

```typescript
// Adapted from jellyamp-pwa/src/lib/equalizer.ts
class AudioEqualizer {
  private context: AudioContext;
  private filters: BiquadFilterNode[];
  private source: MediaElementAudioSourceNode | null = null;

  // Bands: 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
  private readonly FREQUENCIES = [60, 230, 910, 3600, 14000];

  constructor() {
    this.context = new AudioContext();
    this.filters = this.FREQUENCIES.map((freq, i) => {
      const filter = this.context.createBiquadFilter();
      filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = 0; // -12dB to +12dB range
      if (filter.type === 'peaking') filter.Q.value = 1;
      return filter;
    });
    // Chain filters together
    this.filters.reduce((prev, curr) => { prev.connect(curr); return curr; });
  }

  connect(element: HTMLAudioElement) {
    // CRITICAL: createMediaElementSource can only be called ONCE per element
    if (!this.source) {
      this.source = this.context.createMediaElementSource(element);
      this.source.connect(this.filters[0]);
      this.filters[this.filters.length - 1].connect(this.context.destination);
    }
  }

  setGain(bandIndex: number, gainDb: number) {
    this.filters[bandIndex].gain.value = Math.max(-12, Math.min(12, gainDb));
  }
}
```

### Code Pattern: Spectrum Visualizer (Web Audio API native)

```typescript
// Using AnalyserNode + requestAnimationFrame
function createVisualizer(audioElement: HTMLAudioElement, canvas: HTMLCanvasElement) {
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256; // 128 frequency bars

  const source = ctx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(ctx.destination);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const canvasCtx = canvas.getContext('2d')!;

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / bufferLength;

    dataArray.forEach((value, i) => {
      const barHeight = (value / 255) * canvas.height;
      canvasCtx.fillStyle = `hsl(${(i / bufferLength) * 45 + 30}, 80%, 50%)`; // gold gradient
      canvasCtx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    });
  }
  draw();
}
```

---

## Part 5: Display & Visualization Patterns

### Current ZAO OS Display Features

| Feature | Status | Component |
|---------|--------|-----------|
| Album art (multi-res fallback) | Built | `ArtworkImage.tsx` |
| Waveform (wavesurfer.js) | Built | `WaveformPlayer.tsx` |
| Binaural beats oscillators | Built | `BinauralBeats.tsx` |
| Ambient noise synthesis | Built | `AmbientMixer.tsx` |
| Now playing bar (compact) | Built | `NowPlayingBar.tsx` |
| Expanded full-screen player | Built | `ExpandedPlayer.tsx` |
| Persistent mini player | Built | `PersistentPlayer.tsx` |
| Scrubber/progress + seek | Built | `Scrubber.tsx` |
| Queue display with drag-reorder | Built | `QueuePanel.tsx`, `MusicQueueTrackCard.tsx` |

### Missing Display Features (Build Next)

| Feature | Effort | Library | Description |
|---------|--------|---------|-------------|
| **Spectrum analyzer** | 4 hrs | audioMotion-analyzer (MIT, zero deps) | Real-time frequency bars in ExpandedPlayer. 240 bands, custom gold gradient matching ZAO theme |
| **5-band equalizer UI** | 6 hrs | Web Audio API native | EQ panel with 5 sliders (60Hz-14kHz) + presets (Flat, Bass Boost, Vocal, Rock). Connect via `createMediaElementSource` |
| **Listening history page** | 4 hrs | None (data exists) | UI for `play_count` + `last_played_at` already tracked in DB. Just needs a `/music/history` page |
| **Glassmorphism album art** | 2 hrs | CSS only | Full-bleed album art background with blur overlay in ExpandedPlayer (Spotify/Apple pattern) |
| **Social listening indicators** | 3 hrs | Supabase Realtime | Show who else is listening to the same track (useNowPlaying already broadcasts presence) |

### Modern Player UI Patterns (2026 Landscape)

| Pattern | Used By | ZAO Status |
|---------|---------|------------|
| Dark mode default | Spotify, Tidal, YouTube Music | YES (navy #0a1628) |
| Persistent mini-player bar | All major players | YES |
| Swipe-up expansion | Spotify, Apple Music | YES (ExpandedPlayer) |
| Full-bleed album art + glassmorphism | Spotify, Apple Music | Partial (art exists, no blur overlay) |
| Social listening queue (Jam) | Spotify Jam (32 users) | YES (useListeningRoom, DJ mode) |
| Spatial audio toggle | Apple Music, Tidal | NO (not applicable for web) |
| Lyrics sync | Spotify, Apple Music | YES (LyricsPanel.tsx) |
| Waveform seek | SoundCloud | YES (WaveformPlayer.tsx) |
| Spectrum visualizer | WinAmp, Tidal HiFi | NO — add with audioMotion-analyzer |

---

## Part 6: React Audio Player Libraries Comparison

| Library | Version | Bundle | React 19 | Use Case |
|---------|---------|--------|----------|----------|
| **react-player** | 3.4.0 | ~40KB | Likely (Mux maintaining) | Multi-source (YT, SC, Vimeo, files). v3 is full rewrite |
| **react-h5-audio-player** | 3.10.1 | ~15KB | Untested | Customizable, mobile-friendly, HTML5 only |
| **howler.js** | 2.2.4 | 7KB gzipped | N/A (vanilla) | Stable but unmaintained (3+ years). Web Audio + HTML5 fallback |
| **Tone.js** | 15.1.22 | ~150KB | N/A (vanilla) | Full DAW framework. Good for binaural beats, generative audio |
| **wavesurfer.js** | 7.12.5 | ~20KB | Works | Waveform display. v7.12 reactive state refactor |
| **audioMotion-analyzer** | 4.5.4 | Small | N/A (vanilla) | Spectrum analyzer. Zero deps, highly customizable |

**ZAO OS verdict:** No library change needed. Custom `PlayerProvider` + `HTMLAudioProvider` is already more capable than any wrapper library. Add `audioMotion-analyzer` for spectrum visualization only.

---

## Part 7: What to Build Next (Prioritized)

### Tier 1: Quick Wins (< 1 day each)

1. **Listening History page** — Data already tracked. Build `/music/history` with sorted `last_played_at` list. 4 hrs.
2. **Glassmorphism album art** — CSS-only enhancement to ExpandedPlayer. Full-bleed background + `backdrop-filter: blur(40px)`. 2 hrs.
3. **Last.fm scrobbling** — POST to `last.fm/2.0/?method=track.scrobble` after 50% play or 4 minutes. Internal `play` API already fires. 3 hrs.

### Tier 2: Meaningful Features (1-2 days each)

4. **5-band Equalizer** — `BiquadFilterNode` chain + UI panel. 5 presets. Must handle `createMediaElementSource` once-per-element. 6 hrs.
5. **Spectrum Analyzer** — audioMotion-analyzer in ExpandedPlayer. Gold gradient theme. Toggle on/off. 4 hrs.
6. **TIDAL SDK integration** — Upgrade from external redirect to SDK playback. Register at developer.tidal.com, implement Player module. 8 hrs.

### Tier 3: Future Investment

7. **ListenBrainz integration** — Open alternative to Last.fm. POST to `api.listenbrainz.org/1/submit-listens`. 2 hrs.
8. **Configurable Render Quantum** — When Chrome M145+ ships, reduce binaural beats latency. Monitor.
9. **Apple MusicKit upgrade** — Only if ZAO grows beyond 100 members and many use Apple Music. $99/year cost.

---

## Cross-References

| Doc | Relationship |
|-----|-------------|
| **03** | Original music integration research. 9 APIs identified, most now built |
| **126** | Gap analysis. 11 gaps identified, most now shipped (likes, reactions, social proof) |
| **127** | Mobile optimization. MediaSession complete (8/8), swipe gestures built, haptics built |
| **128** | **CANONICAL audit.** 23 components (now 42), 16 API routes, 10 providers. Most accurate pre-existing doc |
| **130** | Tier 4 integrations roadmap. Partially built (frame, comments, artists, trending-weighted) |
| **138** | Play counting. Internal tracking exists. Last.fm/ListenBrainz not yet built |
| **160** | Audio spaces landscape. Separate concern (live rooms vs player) |

### Research vs Reality Discrepancies Found

| Claim (Research) | Reality (Code) |
|-----------------|----------------|
| Doc 127: MediaSession incomplete | **WRONG** — Doc 128 confirms 100% complete. Code has all 8 actions |
| Doc 126: Liked songs missing | **FIXED** — `LikeButton.tsx` + `user_song_likes` table now exist |
| Doc 126: Queue read-only | **PARTIALLY FIXED** — `QueuePanel.tsx` has drag-reorder via `MusicQueueTrackCard.tsx` |
| Doc 128: 23 components | **OUTDATED** — Now 42 files in `src/components/music/` |
| Doc 130: Zora collectibles | **NOT BUILT** — No evidence in code |
| Doc 130: pgvector AI recs | **NOT BUILT** — No evidence in code |

## Sources

### Platform APIs
- [Audius SDK v15 (npm)](https://www.npmjs.com/package/@audius/sdk) — Apache-2.0
- [Spotify Feb 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [TIDAL Developer Portal](https://developer.tidal.com/) — NEW public API
- [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget) — rate-limit-free
- [Apple MusicKit JS v3](https://js-cdn.music.apple.com/musickit/v3/docs/)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)

### Browser APIs
- [Web Audio API 1.1 Spec](https://www.w3.org/TR/webaudio-1.1/) — W3C Working Draft
- [Safari 26 Beta](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)
- [Chrome Configurable Render Quantum](https://chromestatus.com/feature/5078190552907776)

### Open-Source References
- [koel/koel](https://github.com/koel/koel) — 17,101 stars, MIT. Crossfade via rAF
- [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js) — 10,161 stars, BSD-3-Clause. v7.12.5
- [audioMotion-analyzer](https://audiomotion.dev/) — MIT. Spectrum analyzer, zero deps
- [gapless.js](https://github.com/RelistenNet/gapless.js) — 56 stars, MIT. Three-mode gapless
- [jellyamp-pwa](https://github.com/Bender21m/jellyamp-pwa) — 5-band EQ implementation
- [tidal-sdk-web](https://github.com/tidal-music/tidal-sdk-web) — 195 stars, Apache-2.0
- [Audius apps](https://github.com/AudiusProject/apps) — 607 stars, Apache-2.0

### Industry Analysis
- [TechCrunch: Spotify API restrictions](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
- [PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Spotify Jam Updates](https://newsroom.spotify.com/2026-01-07/listening-activity-request-to-jam-messages-updates/)
