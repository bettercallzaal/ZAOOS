# Music Player Upgrade — Design Spec

> **Date:** March 28, 2026
> **Status:** Approved
> **Scope:** 7 features upgrading ZAO OS music player experience

## Overview

Upgrade ZAO OS's 42-component music system with visual enhancements, audio processing, universal song discovery, listening analytics, external scrobbling, and TIDAL SDK integration.

## Features

### 1. ExpandedPlayer Overhaul (Glassmorphism + Spectrum + EQ)

**Layout: Compact + Spectrum Below**

The ExpandedPlayer gets a complete visual refresh with three integrated features:

```
┌─────────────────────────────┐
│ ← (back)          ⚙ (menu) │  glassmorphism background
│                             │  (album art dominant color, blur 40px)
│   ┌─────────┐               │
│   │ Album   │  Track Name   │  compact art + info side-by-side
│   │  Art    │  Artist Name  │
│   │ 100x100 │  ⏮  ▶  ⏭     │  controls inline
│   └─────────┘               │
│ ─────────●──────────── 2:34 │  scrubber
│                             │
│ ┌─────────────────────────┐ │
│ │ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ │ │  spectrum analyzer (hero visual)
│ │ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ │ │  audioMotion-analyzer, gold gradient
│ └─────────────────────────┘ │
│                             │
│  🎤 EQ  │ 🎵 Lyrics │ 📝 Queue │ 🔗 Share │  icon bar (panels)
└─────────────────────────────┘
```

#### 1a. Glassmorphism Background

- Extract dominant color from album art using canvas `getImageData()` sampling
- Set as `background: radial-gradient(circle at 50% 30%, rgba(dominant, 0.15), transparent 70%)`
- Apply `backdrop-filter: blur(40px)` on an overlay layer
- Fallback: navy `#0a1628` when no album art available
- Color updates on track change with CSS transition (500ms ease)

**New file:** `src/lib/music/colorExtractor.ts`
- `extractDominantColor(imageUrl: string): Promise<{ r, g, b }>` — loads image into offscreen canvas, samples center region, returns dominant RGB
- Cache results by URL to avoid re-extraction on revisit

**Modified file:** `src/components/music/ExpandedPlayer.tsx`
- Add glassmorphism background layer behind all content
- Use `colorExtractor` to set dynamic gradient on track change

#### 1b. Spectrum Analyzer

Real-time frequency visualization as the hero visual element below controls.

**Library:** `audioMotion-analyzer` (MIT, zero dependencies)
- Connect to existing global audio elements: `window.__zao_audio_a` / `window.__zao_audio_b`
- Configuration: 128 frequency bars, gold-to-amber gradient (`#f5a623` to `#e8941a`), logarithmic scale
- Toggle visibility via tap on the visualizer area
- Fallback: static waveform bars when audio context unavailable (iOS restrictions)

**New file:** `src/components/music/SpectrumVisualizer.tsx`
- Props: `audioElement: HTMLAudioElement | null`, `isPlaying: boolean`, `theme: 'gold' | 'white'`
- Uses `useRef` for canvas container, initializes `audioMotion-analyzer` on mount
- Cleans up analyzer on unmount
- Handles audio element switching during crossfade (listens to active element changes from PlayerProvider)

**npm dependency:** `audiomotion-analyzer` (add to package.json)

#### 1c. 5-Band Equalizer

Audio processing via Web Audio API `BiquadFilterNode` chain.

**Bands:**

| Band | Frequency | Type | Default Gain |
|------|-----------|------|-------------|
| Sub Bass | 60 Hz | lowshelf | 0 dB |
| Bass | 230 Hz | peaking (Q=1) | 0 dB |
| Mid | 910 Hz | peaking (Q=1) | 0 dB |
| Treble | 3,600 Hz | peaking (Q=1) | 0 dB |
| Brilliance | 14,000 Hz | highshelf | 0 dB |

**Presets:**

| Preset | 60Hz | 230Hz | 910Hz | 3.6kHz | 14kHz |
|--------|------|-------|-------|--------|-------|
| Flat | 0 | 0 | 0 | 0 | 0 |
| Bass Boost | +8 | +4 | 0 | 0 | 0 |
| Treble Boost | 0 | 0 | 0 | +4 | +8 |
| Vocal | -2 | 0 | +4 | +3 | -1 |
| Rock | +4 | +2 | -1 | +3 | +5 |
| Lo-Fi | +3 | +1 | -2 | -3 | -4 |

**Critical constraint:** `AudioContext.createMediaElementSource()` can only be called ONCE per `HTMLAudioElement`. The `AudioEqualizer` class must track which elements are connected and reuse existing `MediaElementAudioSourceNode` instances.

**New file:** `src/lib/music/equalizer.ts`
- `AudioEqualizer` class: creates `AudioContext`, 5 `BiquadFilterNode` filters chained together
- `connect(element: HTMLAudioElement)` — creates `MediaElementAudioSourceNode` once, routes through filter chain to `context.destination`
- `setGain(bandIndex: number, gainDb: number)` — sets gain on individual band (-12 to +12 dB)
- `applyPreset(name: string)` — applies all 5 gains from preset map
- `getGains(): number[]` — returns current gain values
- Persist user's EQ settings to `localStorage`

**New file:** `src/components/music/EqualizerPanel.tsx`
- 5 vertical sliders (range -12 to +12 dB) with band labels
- Preset selector dropdown/chips
- "Reset" button (applies Flat preset)
- Renders inside ExpandedPlayer icon bar panel

**Modified file:** `src/providers/audio/HTMLAudioProvider.tsx`
- Expose a method to get the current active `HTMLAudioElement` for EQ connection
- Coordinate with equalizer when crossfading (reconnect to new active element)

---

### 2. Smart Omnibar — Universal Song Adding

Single input component that auto-detects intent: URL paste, text search, or browse.

#### Input Behavior

```
User input → detect type:
├── URL pattern (spotify.com, audius.co, soundcloud.com, youtube.com, etc.)
│   → Resolve via existing /api/music/resolve (Songlink/Odesli)
│   → Fetch metadata via /api/music/metadata
│   → Show preview card: art + title + artist + platform
│   → Actions: [▶ Play Now] [+ Add to Queue] [♡ Like]
│
├── Text query (not a URL)
│   → Debounce 300ms
│   → POST /api/music/search (new endpoint)
│   → Searches: Audius API + Supabase songs table + SoundCloud resolve
│   → Merged results, deduped, platform badge on each
│   → Each result row: art + title + artist + platform + [▶] [+]
│
└── Empty (browsing mode)
    → Genre filter chips: All | Trending | Hip-Hop | Electronic | Lo-Fi | R&B
    → Audius trending tracks for selected genre
    → Community picks: Track of the Day, recent submissions
```

#### URL Detection

Use existing `src/lib/music/isMusicUrl.ts` (40+ regex patterns) to detect music URLs. If `isMusicUrl(input)` returns true, treat as URL resolve flow. Otherwise treat as text search.

#### Placement

The `<MusicOmnibar />` component is reusable across contexts:

| Location | Variant | Behavior |
|----------|---------|----------|
| `/music` page | Full width, always visible at top | Full browse + search + URL |
| ExpandedPlayer Queue tab | Compact, inline | Search + URL only (no browse) |
| Chat `/music` command | Inline overlay | Search + URL, result shares to chat |

#### New Files

**`src/components/music/MusicOmnibar.tsx`**
- Props: `variant: 'full' | 'compact' | 'inline'`, `onTrackSelect: (track, action) => void`
- State: `query`, `results`, `isLoading`, `activeGenre`, `inputType: 'url' | 'search' | 'browse'`
- Uses `@tanstack/react-query` for search results caching
- Keyboard accessible: arrow keys navigate results, Enter plays, Shift+Enter queues

**`src/app/api/music/search/route.ts`**
- GET endpoint: `?q=query&genre=hip-hop&limit=20`
- Searches in parallel: Audius trending/search + Supabase `songs` table (ILIKE) + SoundCloud resolve
- Uses `Promise.allSettled` for fault tolerance (if SoundCloud is down, Audius results still return)
- Returns unified response: `{ results: Track[], sources: string[] }`
- Validates input with Zod, checks session, returns `NextResponse.json`

---

### 3. Listening History Page

UI for play data already tracked in the database.

**Route:** `/music/history` (inside `(auth)` group — requires login)

**Data source:** `songs` table — `play_count` and `last_played_at` columns already populated by existing `/api/music/library/play` endpoint.

**UI:**
- Page header: "Listening History" with total play count
- Filter bar: Today | This Week | This Month | All Time (default: This Week)
- Track rows: album art (48x48) + title + artist + play count badge + relative time ("2h ago")
- Sorted by `last_played_at` DESC
- Paginated (20 per page, infinite scroll)
- Tap row → plays track. Long-press → context menu (Queue, Playlist, Share)

**New files:**
- `src/app/(auth)/music/history/page.tsx` — the page component
- `src/app/api/music/history/route.ts` — GET endpoint with date filtering + pagination

---

### 4. Last.fm Scrobbling

External play attribution via Last.fm API.

#### Scrobble Trigger

Standard Last.fm rules: scrobble after track plays for >50% of duration OR >4 minutes, whichever comes first. Track must be >30 seconds long.

#### Authentication Flow

1. User navigates to Settings > Connected Services
2. Clicks "Connect Last.fm" → redirects to Last.fm OAuth
3. Last.fm callback stores `lastfm_session_key` in Supabase `user_settings` table
4. Session key used for all subsequent API calls

#### Scrobble Flow

1. `PlayerProvider.tsx` already tracks `currentTime` and `duration`
2. Add scrobble threshold check: when `currentTime / duration > 0.5 || currentTime > 240`
3. Fire once per track (flag resets on track change)
4. POST to `/api/music/scrobble` with track metadata
5. Server calls Last.fm `track.scrobble` + `track.updateNowPlaying` (on play start)

#### New Files

**`src/lib/music/lastfm.ts`**
- `scrobble(params: { artist, track, album?, timestamp, sk })` — POST to `ws.audioscrobbler.com/2.0/`
- `updateNowPlaying(params: { artist, track, album?, sk })` — tells Last.fm what's playing
- `getAuthUrl()` — returns Last.fm OAuth redirect URL
- `getSession(token: string)` — exchanges token for session key
- Signs all requests with API secret (server-side only)

**`src/app/api/music/scrobble/route.ts`**
- POST endpoint, session-protected
- Validates: artist + track required, timestamp within 2 weeks
- Fetches user's `lastfm_session_key` from Supabase
- Calls Last.fm API, returns success/failure

**Modified:** `src/providers/audio/PlayerProvider.tsx`
- Add scrobble threshold tracking in `timeupdate` handler
- Fire scrobble event (calls `/api/music/scrobble`) when threshold met

**Modified:** Settings page — add Last.fm connect/disconnect UI

**Environment variables:** `LASTFM_API_KEY`, `LASTFM_API_SECRET` (server-only)

---

### 5. TIDAL SDK Integration

Upgrade from external redirect to in-app playback via TIDAL's new public developer portal.

#### Current State

`TidalProvider.tsx` is a passthrough — opens TIDAL URLs in new tab. No playback control.

#### Upgrade

1. Register app at `developer.tidal.com`, obtain Client ID
2. Implement TIDAL OAuth 2.1 in settings (similar to Last.fm flow)
3. Replace `TidalProvider.tsx` with TIDAL Web Player SDK integration
4. Add catalog search to `MusicOmnibar` search pipeline

#### New/Modified Files

**`src/lib/music/tidal.ts`**
- TIDAL API client: search, getTrack, getAlbum
- OAuth helpers: getAuthUrl, exchangeCode, refreshToken
- Token storage in Supabase `user_settings`

**`src/providers/audio/TidalProvider.tsx`** (rewrite)
- Initialize TIDAL Player SDK module
- Register as controller with PlayerProvider (play/pause/seek/volume)
- Handle auth state (if user not connected, fall back to external redirect)

**Modified:** `src/app/api/music/search/route.ts` — add TIDAL as search source (if user has TIDAL connected)

**Environment variables:** `TIDAL_CLIENT_ID`, `TIDAL_CLIENT_SECRET` (server-only)

---

## Dependencies

| Package | Version | License | Size | Purpose |
|---------|---------|---------|------|---------|
| `audiomotion-analyzer` | ^4.5 | MIT | Small, zero deps | Spectrum visualization |

No other new packages. Web Audio API, Last.fm REST, TIDAL SDK, and Songlink are all vanilla HTTP/JS.

## Build Order

Features are grouped by dependency, with independent work parallelizable:

```
Phase 1 (Visual Foundation):
  ├── 1a. Glassmorphism (colorExtractor + ExpandedPlayer background)
  └── 1b. Spectrum Analyzer (audioMotion-analyzer + SpectrumVisualizer)

Phase 2 (Audio Processing):
  └── 1c. 5-Band Equalizer (equalizer.ts + EqualizerPanel + HTMLAudioProvider changes)
       ↑ depends on Phase 1 (ExpandedPlayer layout must be in place)

Phase 3 (Parallel — all independent):
  ├── 2. Smart Omnibar (MusicOmnibar + /api/music/search)
  ├── 3. Listening History (/music/history page + API)
  └── 4. Last.fm Scrobbling (lastfm.ts + /api/music/scrobble + PlayerProvider)

Phase 4:
  └── 5. TIDAL SDK (tidal.ts + TidalProvider rewrite)
       ↑ depends on Phase 3 Omnibar (adds TIDAL to search pipeline)
```

## File Inventory

### New Files (14)

| File | Feature |
|------|---------|
| `src/lib/music/colorExtractor.ts` | Glassmorphism |
| `src/components/music/SpectrumVisualizer.tsx` | Spectrum |
| `src/components/music/EqualizerPanel.tsx` | EQ UI |
| `src/lib/music/equalizer.ts` | EQ audio processing |
| `src/components/music/MusicOmnibar.tsx` | Universal song adding |
| `src/app/api/music/search/route.ts` | Unified search API |
| `src/app/(auth)/music/history/page.tsx` | History page |
| `src/app/api/music/history/route.ts` | History API |
| `src/lib/music/lastfm.ts` | Last.fm client |
| `src/app/api/music/scrobble/route.ts` | Scrobble API |
| `src/lib/music/tidal.ts` | TIDAL client |
| `src/app/api/music/scrobble/auth/route.ts` | Last.fm OAuth callback |
| `src/app/api/tidal/auth/route.ts` | TIDAL OAuth callback |
| `src/app/api/tidal/callback/route.ts` | TIDAL OAuth redirect handler |

### Modified Files (6)

| File | Changes |
|------|---------|
| `src/components/music/ExpandedPlayer.tsx` | New layout: compact+spectrum, glassmorphism bg, icon bar panels |
| `src/providers/audio/HTMLAudioProvider.tsx` | Expose active element for EQ, coordinate crossfade+EQ |
| `src/providers/audio/PlayerProvider.tsx` | Scrobble threshold tracking, fire scrobble events |
| `src/providers/audio/TidalProvider.tsx` | Rewrite: passthrough → SDK playback |
| `src/app/api/music/search/route.ts` | Add TIDAL as search source (Phase 4) |
| Settings page component | Last.fm + TIDAL connect/disconnect UI |

## Success Criteria

- ExpandedPlayer shows glassmorphism background that changes with each track
- Spectrum analyzer renders real-time frequency bars during playback
- EQ panel adjusts audio with audible effect, presets apply correctly
- Omnibar: paste any music URL → resolves and plays within 2 seconds
- Omnibar: type search query → results from multiple platforms within 1 second
- History page shows all played tracks with accurate play counts
- Last.fm scrobbles appear on user's Last.fm profile after threshold
- TIDAL tracks play in-app instead of external redirect (for connected users)
