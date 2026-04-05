# 105 — Music Player UI Patterns & Showcase Design

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Best practices for displaying and showcasing music on web platforms — UI patterns, waveform visualization, embed strategies, radio UX, and discovery feeds for ZAO OS's 6-provider music player

---

## Table of Contents

1. [Top Music Platform UI Analysis](#1-top-music-platform-ui-analysis)
2. [Waveform Visualization Libraries](#2-waveform-visualization-libraries)
3. [Music Embed Patterns](#3-music-embed-patterns)
4. [Radio / Continuous Play UX Patterns](#4-radio--continuous-play-ux-patterns)
5. [Album Art & Track Card Design Patterns](#5-album-art--track-card-design-patterns)
6. [Music Discovery Feed Designs](#6-music-discovery-feed-designs)
7. [Recommendations for ZAO OS](#7-recommendations-for-zao-os)
8. [Sources](#8-sources)

---

## 1. Top Music Platform UI Analysis

### Spotify Web Player

**Layout:** Three-column structure — left sidebar (navigation + playlists), center content area, right panel (now-playing detail). The 2025 redesign expanded the now-playing panel to roughly one-third of the screen, drawing criticism for taking too much space without a collapse option.

**Now-Playing Bar:** Fixed bottom bar spanning full width. Contains: album art thumbnail (left), track info + progress scrubber (center), volume + queue + device controls (right). Premium users see recommended tracks after their queue ends.

**Queue:** Accessible via three-line icon in the now-playing bar. Shows current track, manually queued songs, and "Playing Next" auto-suggestions. Shuffle, Smart Shuffle, Repeat, and Sleep Timer controls are integrated into the queue panel.

**Album Art:** Large album art (up to 640x640) in the now-playing detail panel. Homepage uses mixed-size content cards (recently played, recommendations, new releases) in a responsive grid.

**Key Takeaway for ZAO OS:** The fixed bottom player bar is the industry standard. ZAO OS's existing `PersistentPlayer.tsx` and `GlobalPlayer.tsx` follow this pattern correctly.

---

### SoundCloud

**Waveform Visualization:** The defining UI feature. Each track displays a horizontal waveform where played portions are colored (typically orange) and unplayed portions are gray. Waveforms are pre-computed as 1800x280px PNG images stored server-side and rendered using CSS `webkit-mask-box-image`.

**Stream View:** Vertical feed of track cards, each containing: artist avatar, track title, waveform player, play count, like count, repost count, comment markers along the waveform, and timestamp.

**Track Cards:** Full-width cards in the stream. Compact cards in playlists/sets. The waveform doubles as the seek bar — click anywhere to jump to that position.

**Mobile:** The Android app features a smooth horizontal-scrolling waveform gliding under a fixed playhead, with separate views for "past" (played) and "future" (unplayed) segments.

**Key Takeaway for ZAO OS:** SoundCloud's waveform-as-seek-bar is the gold standard for audio-centric platforms. Consider adding waveform visualization to `MusicQueueTrackCard.tsx` using wavesurfer.js.

---

### Bandcamp

**Album-Centric Layout:** Each release gets a dedicated page with large square album art (minimum 1400x1400px required — releases without art are excluded from search and discovery). Track listing below the art with play buttons, durations, and optional lyrics links.

**Discography:** Auto-sorted newest-to-oldest, with drag-and-drop reordering. Sidebar shows artist image, bio, external links, and show dates.

**Fan Collection:** Purchasers get a customizable public collection page. Items can be rearranged via drag-and-drop. Fans can mark favorite tracks and leave comments explaining why they love them — comments appear on the album page.

**Design System:** Minimal, artist-customizable colors (text, links, page background, outer background). Typography-forward with no visual clutter. The album art dominates the visual hierarchy.

**Key Takeaway for ZAO OS:** Bandcamp's album-centric approach is ideal for ZAO's artist-first philosophy. The fan collection page concept maps well to a "My Saved Tracks" feature.

---

### Apple Music Web (MusicKit JS)

**Spatial Audio Indicators:** Dolby Atmos tracks display a "Dolby Atmos" badge. Spatial Audio tracks show a wave-like icon indicating immersive audio availability.

**Animated Album Art:** Apple Music uses animated/motion album artwork for select releases — short looping videos that play on hover or when the track is active.

**MusicKit JS Integration:** Apple provides `MusicKit JS` (loaded via `<script>` from their CDN) for embedding playback in third-party sites. Requires Apple Developer Program membership and a developer token. Supports full catalog access, user library access, and playlist creation.

**Key Takeaway for ZAO OS:** Animated album art on hover is a premium interaction pattern worth considering for featured releases. MusicKit JS requires developer credentials and an Apple subscription — lower priority for ZAO OS.

---

### Audius

**Decentralized Streaming:** Entirely free, open-source API. Tracks are streamed from decentralized content nodes. The Stream Track endpoint supports the `Range` header for progressive streaming.

**Embed Player:** The official embed player is called "Bedtime" (open-source on GitHub). Supports oEmbed via Embedly for easy iframe embedding.

**Trending Feed:** Discovery page with trending tracks, playlists, and underground picks. Genre tabs along the top. Community-driven curation rather than algorithmic.

**UI Style:** Clean, modern dark theme. Track cards show waveform previews, play counts, reposts, and favorites. Artist profiles include a banner image, avatar, bio, and discography grid.

**Key Takeaway for ZAO OS:** Audius is the most aligned platform philosophically (decentralized, artist-first). Its free API and embed player make it the easiest to integrate. The `MusicEmbed.tsx` component should support Audius embeds.

---

### Sound.xyz

**NFT Music Cards:** Each release is a "drop" with: large album art, edition count (e.g., "1 of 25"), mint price, collector count, and a "Collect" CTA button. The card doubles as a player — clicking play streams the full track.

**Collector Editions:** Visual distinction between open editions and limited editions. Collector avatars appear stacked below the release. "Golden Egg" system — one random minter gets a special 1/1 edition.

**Mint UI:** Credit card payments (Visa, Mastercard, Apple Pay, Google Pay) alongside crypto wallet connections (MetaMask, Coinbase, WalletConnect, Rainbow). 200+ wallets supported.

**Listening Parties:** New releases launch as live listening events where fans can comment in real-time while listening together.

**Key Takeaway for ZAO OS:** The "collector edition" card design is directly applicable to ZAO's music NFT features. The stacked collector avatars pattern creates social proof and community visibility.

---

### Tidal

**Hi-Fi Indicators:** Explicit quality badges — "HiFi" (CD quality, 1411 kbps), "HiFi Plus" (up to 9216 kbps), and "Dolby Atmos" spatial audio. Badges appear on track listings, album pages, and the now-playing bar.

**Credits:** Detailed songwriter, producer, engineer, and studio credits accessible from the now-playing view. This is a unique differentiator — most platforms hide credits.

**Lyrics Integration:** Synced lyrics scroll alongside playback. Available to all HiFi and HiFi Plus subscribers across desktop, web, and mobile.

**Design:** Dark theme with blue accents. Five-section navigation: Home, Explore, Videos, My Collection, Playlists. Clean typography with generous whitespace.

**Key Takeaway for ZAO OS:** Credits display is especially relevant for ZAO — a music artist community should showcase the full creative team. Consider adding a credits section to track detail views.

---

## 2. Waveform Visualization Libraries

### wavesurfer.js (Recommended)

| Attribute | Value |
|-----------|-------|
| **Version** | 7.12.4 (March 16, 2026) |
| **GitHub Stars** | 10,200+ |
| **npm Weekly Downloads** | ~269 dependent projects |
| **Bundle Size** | ~30 KB minified + gzipped (core only) |
| **License** | BSD-3-Clause |
| **TypeScript** | Yes (87.3% of codebase) |
| **Used By** | 15,600+ projects |

**Architecture:** Renders into Shadow DOM. Uses Web Audio API for audio processing and HTML Canvas for waveform rendering. CSS styling via `::part()` pseudo-selector.

**Official Plugins:**
- **Regions** — segment selection and loop markers
- **Timeline** — time ruler below the waveform
- **Minimap** — overview waveform for long audio
- **Envelope** — volume envelope editing
- **Record** — microphone recording with live waveform
- **Spectrogram** — frequency spectrogram view
- **Hover** — cursor position indicator

**React Wrapper — `@wavesurfer/react`:**

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.12 |
| **Downloads** | 130,914 total |
| **Install** | `npm install @wavesurfer/react` |

All wavesurfer options become React props. Provides both a component and a custom hook interface.

**SSR Compatibility:** Requires `dynamic(() => import(...), { ssr: false })` in Next.js since it depends on `window` and Web Audio API.

```tsx
// Example usage in Next.js with dynamic import
import dynamic from 'next/dynamic';

const WaveformPlayer = dynamic(
  () => import('@/components/music/WaveformPlayer'),
  { ssr: false }
);
```

---

### Peaks.js (BBC)

| Attribute | Value |
|-----------|-------|
| **GitHub Stars** | 3,400+ |
| **Peer Dependencies** | `konva`, `waveform-data` |
| **License** | LGPL-2.0 |
| **Best For** | Long-form audio (podcasts, radio shows) |

**Strengths:**
- Server-side waveform pre-computation (avoids client decode time)
- Multi-channel audio display
- Zoomable waveform views at multiple resolutions
- Point and segment marker annotations
- Built for BBC radio content — handles hour-long audio well

**Weaknesses:**
- LGPL license is more restrictive than wavesurfer's BSD
- Heavier dependency chain (Konva canvas library)
- No official React wrapper — requires manual integration
- Designed for editing/annotation use cases more than playback

**SSR Compatibility:** Same constraints as wavesurfer — needs client-only rendering.

---

### howler.js (Audio Engine — No Visualization)

| Attribute | Value |
|-----------|-------|
| **Version** | 2.2.3 |
| **GitHub Stars** | 19,000+ |
| **Bundle Size** | ~7 KB gzipped |
| **npm Weekly Downloads** | 145,000+ |
| **License** | MIT |

**What It Is:** Pure audio playback engine — no waveform visualization. Uses Web Audio API with HTML5 Audio fallback. Handles codec detection, sprite sheets, spatial audio, and cross-browser quirks.

**React Wrappers:**
- `react-howler` — component wrapper, no built-in UI
- `react-howler-player` — full UI component with controls
- `react-use-audio-player` — hooks-based API (most modern)

**Best For:** When you need reliable audio playback without waveform visualization. Extremely lightweight. Good complement to a custom UI.

---

### Comparison Matrix

| Library | Stars | Size (gzip) | Visualization | React Wrapper | License | SSR Safe |
|---------|-------|-------------|---------------|---------------|---------|----------|
| wavesurfer.js | 10.2K | ~30 KB | Waveform + Spectrogram | Official (`@wavesurfer/react`) | BSD-3 | No (dynamic import) |
| Peaks.js | 3.4K | ~50 KB + deps | Waveform (zoomable) | None (manual) | LGPL-2.0 | No |
| howler.js | 19K | ~7 KB | None | 3 community wrappers | MIT | Partial |

**Recommendation for ZAO OS:** Use **wavesurfer.js** with `@wavesurfer/react` for track cards with waveform visualization. Use **howler.js** (or native HTML5 Audio via the existing `GlobalPlayer.tsx`) for the persistent bottom player where waveform is not needed.

---

## 3. Music Embed Patterns

### Spotify Embed

**oEmbed API:** `GET https://open.spotify.com/oembed?url={spotify_url}`
- Returns HTML iframe snippet, thumbnail URL, title, artist
- No authentication required for oEmbed endpoint
- Embed iframe dimensions: 352x152 (track), 352x352 (album), 352x380 (playlist)

**iFrame API:** Interactive embeds with JS control
- `IFrameAPI.createController()` — programmatic playback control
- Events: `ready`, `playback_update`, `player_state_changed`
- 30-second preview for non-Premium users

**Embed URL Pattern:**
```
https://open.spotify.com/embed/track/{id}?utm_source=generator&theme=0
```
- `theme=0` = dark mode (ideal for ZAO OS)

---

### SoundCloud Widget API

**Embed URL Pattern:**
```
https://w.soundcloud.com/player/?url={track_url}&color=%23f5a623&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false
```
- Customizable accent color (use ZAO gold `#f5a623`)
- `hide_related=true` prevents navigation away from your app
- Widget API provides JS methods: `play()`, `pause()`, `seekTo()`, `bind(event, callback)`

**oEmbed:** `GET https://soundcloud.com/oembed?url={url}&format=json`

---

### Apple Music (MusicKit JS)

**Prerequisites:** Apple Developer Program membership + MusicKit Identifier + Developer Token (JWT, 6-month expiry)

**Integration:**
```html
<script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
```
- Full catalog streaming for Apple Music subscribers
- Non-subscribers hear 30-second previews
- Supports playlists, albums, stations, and user libraries

**Verdict:** High integration cost (Apple Developer account, token management). Best suited for apps with significant Apple Music user overlap.

---

### YouTube Music / YouTube Embed

**Embed URL Pattern:**
```
https://www.youtube.com/embed/{video_id}?autoplay=0&rel=0
```
- `rel=0` prevents related video suggestions
- YouTube IFrame API provides full JS control
- No authentication required for basic embeds
- Supports playlists: `https://www.youtube.com/embed/videoseries?list={playlist_id}`

---

### Audius Embed

**Embed Player ("Bedtime"):**
```
https://audius.co/embed/track/{track_id}
```
- Fully free, no API key required
- oEmbed supported via Embedly
- Dark theme available
- Open-source embed player

**Streaming API:**
```
GET https://{discovery_node}/v1/tracks/{track_id}/stream
```
- Supports `Range` header for progressive streaming
- Select discovery node dynamically from `https://api.audius.co`
- Rate limits are generous (public API)

**Best Integration for ZAO OS:** Audius is the most natural fit — decentralized, free, no API keys, artist-aligned values.

---

### Unified Embed UX Best Practices

1. **Consistent container:** Wrap all embeds in a uniform card with consistent border radius, padding, and shadow regardless of provider.
2. **Provider badge:** Small icon (Spotify green, SoundCloud orange, Audius purple) in the corner to indicate source.
3. **Fallback:** If an embed fails to load, show the track title, artist, and a "Listen on [Platform]" link.
4. **Lazy loading:** Use `loading="lazy"` on iframes and `IntersectionObserver` to defer off-screen embeds.
5. **Dark theme:** Force dark mode on all embeds where supported (Spotify `theme=0`, SoundCloud custom colors, Audius dark).
6. **Single active player:** When a user plays one embed, pause all others. Use a global audio context or message channel.

ZAO OS's existing `MusicEmbed.tsx` should implement these patterns.

---

## 4. Radio / Continuous Play UX Patterns

### Infinite Scroll + Autoplay

**Pattern:** As the user scrolls through a feed of tracks, the player auto-advances to the next track when the current one ends. New tracks are fetched as the user approaches the bottom of the feed.

**Implementation:**
- Use `IntersectionObserver` to detect when the user is near the bottom
- Prefetch the next batch of tracks (typically 20-50)
- Auto-advance uses a queue managed in React context (ZAO OS already has `useRadio.ts`)
- Provide a clear "Stop auto-play" toggle

---

### Station Switching UI

**Pattern:** Horizontal pill/chip selector at the top of the radio view. Each "station" represents a different queue source (genre, mood, curator, community picks).

**Design:**
```
[ All ] [ Community Picks ] [ New Releases ] [ Lo-Fi ] [ Hip Hop ] [ Electronic ]
```
- Active station gets the accent color fill (ZAO gold)
- Inactive stations are outlined or ghost-styled
- Switching stations clears the queue and starts a new stream
- ZAO OS's `RadioButton.tsx` already provides a foundation for this

---

### Now Playing + Up Next

**Standard Layout:**
```
┌─────────────────────────────────────────────┐
│  NOW PLAYING                                │
│  ┌──────┐  Track Title                      │
│  │ Art  │  Artist Name                      │
│  │      │  ▶ ──●──────────── 2:34 / 4:12   │
│  └──────┘                                   │
├─────────────────────────────────────────────┤
│  UP NEXT                                    │
│  1. Track Name — Artist          3:45       │
│  2. Track Name — Artist          4:12       │
│  3. Track Name — Artist          2:58       │
│  ...                                        │
└─────────────────────────────────────────────┘
```

- "Now Playing" section is always visible with large album art
- "Up Next" is a scrollable list below
- Drag-and-drop reordering of upcoming tracks
- Swipe-to-remove on mobile
- ZAO OS's `MusicQueueTrackCard.tsx` handles the queue card rendering

---

### Background / Mini Player Patterns

**Desktop — Collapsed Bottom Bar:**
- Full-width bar fixed to viewport bottom
- Height: 72-90px
- Contains: album art thumbnail (48-56px), track info, play/pause, next/prev, progress bar, volume
- Expanding click/tap reveals full now-playing view

**Mobile — Mini Player:**
- Sits just above the bottom navigation bar
- Height: 56-64px
- Shows: album art, truncated title, play/pause button only
- Swipe up to reveal full player
- Swipe down (or tap outside) to collapse

**Implementation Pattern:**
```tsx
// Layout structure for persistent player
<main className="pb-[72px] md:pb-[90px]">
  {/* Page content with bottom padding for player */}
  {children}
</main>
<PersistentPlayer /> {/* Fixed to bottom */}
```

ZAO OS's `PersistentPlayer.tsx` and `GlobalPlayer.tsx` already implement this pattern.

---

## 5. Album Art & Track Card Design Patterns

### Grid vs List vs Carousel

**Grid Layout (Discovery / Browse):**
- `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
- Square cards with album art, title below, artist below title
- Gap: 16-24px
- Best for browsing large collections
- Use CSS `aspect-ratio: 1/1` for consistent squares

**List Layout (Queue / Playlist):**
- Full-width rows, 56-72px height
- Left: small album art (48px square), Center: title + artist, Right: duration + actions
- Alternating row backgrounds for readability
- Best for ordered sequences (playlists, queue, track listings)

**Carousel Layout (Featured / Highlights):**
- Horizontal scroll with snap points (`scroll-snap-type: x mandatory`)
- Larger cards (200-280px wide) with album art + overlay text
- Left/right navigation arrows on desktop
- Touch-swipe on mobile
- Best for curated selections, new releases, featured artists

**Recommended for ZAO OS:**
- Grid for the music discovery/browse page
- List for queue and playlist views (current `MusicQueueTrackCard.tsx`)
- Carousel for featured releases on the home/radio page

---

### Hover Interactions

**Preview on Hover:**
- Play button overlay appears on album art on hover
- Optional: 15-30 second audio preview starts on hover (with 500ms delay to prevent accidental triggers)
- Progress ring around the play button during preview

**Visual Feedback:**
- Album art scales to 1.02-1.05x on hover (`transform: scale(1.03)` with `transition: 200ms ease`)
- Subtle shadow elevation increase
- Background color shift on track rows

**Implementation:**
```tsx
<div className="group relative cursor-pointer">
  <img
    src={albumArt}
    className="transition-transform duration-200 group-hover:scale-[1.03]"
  />
  <div className="absolute inset-0 flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity
                  bg-black/40 rounded-lg">
    <PlayIcon className="w-12 h-12 text-white" />
  </div>
</div>
```

---

### Skeleton Loading States

**Library:** `react-loading-skeleton` (most popular)
- Adaptive: automatically matches the dimensions of the content it replaces
- Circular variant for album art: `<Skeleton circle width={200} height={200} />`
- Pulse animation built-in
- Lightweight

**Pattern for Music Cards:**
```tsx
function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton width={48} height={48} className="rounded-lg" />
      <div className="flex-1">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} className="mt-1" />
      </div>
      <Skeleton width={32} height={14} />
    </div>
  );
}
```

**Best Practice:** Show 5-8 skeleton cards to match the expected viewport fill. Animate with a shimmer effect (left-to-right gradient sweep).

---

### Responsive Album Art Grids

**Approach:** Use CSS Grid with `auto-fill` + `minmax()` for automatic responsive columns:

```css
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
```

**With Tailwind:**
```html
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
```

**Image Optimization:**
- Use `next/image` with `sizes` prop for responsive loading
- Serve 160px, 320px, and 640px variants
- Blur placeholder with `placeholder="blur"` and a tiny base64 preview
- `aspect-ratio: 1/1` with `object-fit: cover`

---

## 6. Music Discovery Feed Designs

### Daily Mix / Personalized Cards

**Pattern:** Large horizontal cards (hero-style) at the top of the feed. Each "mix" has:
- Gradient background derived from album art colors (use a color extraction library like `colorthief`)
- 4-6 small album art thumbnails in a collage
- Mix title ("Your Daily Mix", "Chill Vibes", "New for You")
- Play button overlay

**For ZAO OS:** Could be "Community Radio", "New from ZAO Artists", "Your Saved Tracks"

---

### Genre / Mood Filtering

**Pattern:** Horizontal scrolling chip/pill bar below the page header.

```
[ All ] [ Hip Hop ] [ R&B ] [ Electronic ] [ Lo-Fi ] [ Jazz ] [ Afrobeats ]
```

- Single-select (radio behavior) or multi-select (checkbox behavior)
- Active state: filled with accent color, white text
- Inactive: border only, muted text
- Smooth filter transitions with `layout` animation (Framer Motion)

**For ZAO OS:** Genre tags should come from the community config or from track metadata in Supabase.

---

### Community Picks / Curated Sections

**Pattern:** Horizontal carousel sections with a section header.

```
Community Picks                          See All →
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│  Art   │  │  Art   │  │  Art   │  │  Art   │
│        │  │        │  │        │  │        │
└────────┘  └────────┘  └────────┘  └────────┘
 Title       Title       Title       Title
 Artist      Artist      Artist      Artist
```

- Curated by admins or community vote
- "See All" links to a full grid view
- Cards are 160-200px wide with horizontal scroll

**For ZAO OS:** Admin FIDs from `community.config.ts` can curate picks. Community voting via Farcaster reactions (likes/recasts) can surface popular tracks.

---

### Artist Spotlight Cards

**Pattern:** Wider cards (2-column span in grid, or full-width on mobile) featuring:
- Artist profile photo (circular, 80-120px)
- Banner/cover image
- Bio excerpt (2-3 lines, truncated)
- Latest release with play button
- "View Profile" CTA

**For ZAO OS:** Map to Farcaster profiles via Neynar. Pull artist bio from Farcaster profile data. Link to their casts in the ZAO channel.

---

## 7. Recommendations for ZAO OS

Based on this research and ZAO OS's existing architecture (`PersistentPlayer.tsx`, `GlobalPlayer.tsx`, `MusicEmbed.tsx`, `MusicQueueTrackCard.tsx`, `RadioButton.tsx`, `Scrubber.tsx`, `MusicSidebar.tsx`, `useRadio.ts`):

### Priority 1 — Quick Wins

1. **Add waveform to track cards:** Install `wavesurfer.js` + `@wavesurfer/react`. Create a `WaveformPlayer.tsx` component loaded via `next/dynamic`. Use it in `MusicQueueTrackCard.tsx` for SoundCloud-style inline waveforms.

2. **Skeleton loading states:** Add `react-loading-skeleton` for track cards, album grids, and the queue. Improves perceived performance significantly.

3. **Unified embed dark theme:** Update `MusicEmbed.tsx` to force dark mode on all provider embeds (Spotify `theme=0`, SoundCloud custom color `#f5a623`).

### Priority 2 — Enhanced UX

4. **Station switching UI:** Extend `RadioButton.tsx` into a horizontal pill bar for genre/mood stations. Source station data from `community.config.ts`.

5. **Album art grid for browse:** Create a responsive grid component using `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` for the music discovery page.

6. **Hover preview on track cards:** Add play button overlay on album art hover with `group`/`group-hover` Tailwind pattern. Optional 15-second audio preview on desktop.

### Priority 3 — Advanced Features

7. **Audius integration:** Add Audius as an embed provider in `MusicEmbed.tsx`. The free API with no authentication requirements makes it the easiest integration.

8. **Credits display:** Add songwriter/producer credits to track detail views. Store in Supabase alongside track metadata.

9. **Community picks carousel:** Horizontal scroll section on the music page curated by admin FIDs or sorted by Farcaster engagement.

### Package Recommendations

| Package | Version | Purpose | Size (gzip) |
|---------|---------|---------|-------------|
| `wavesurfer.js` | 7.12.4 | Waveform visualization | ~30 KB |
| `@wavesurfer/react` | 1.0.12 | React wrapper for wavesurfer | ~3 KB |
| `howler` | 2.2.3 | Audio playback engine (if needed) | ~7 KB |
| `react-loading-skeleton` | latest | Skeleton loading states | ~3 KB |

---

## 8. Sources

### Platform Documentation
- [Spotify Embeds Documentation](https://developer.spotify.com/documentation/embeds)
- [Spotify iFrame API Tutorial](https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api)
- [Spotify oEmbed API](https://developer.spotify.com/documentation/embeds/tutorials/using-the-oembed-api)
- [Spotify Design — New Homepage Experience](https://spotify.design/article/from-web-page-to-web-player-how-spotify-designed-a-new-homepage-experience)
- [Spotify 2025 Discovery Controls Announcement](https://newsroom.spotify.com/2025-05-07/experience-a-new-dimension-of-music-discovery-with-more-controls-and-enhanced-tools/)
- [SoundCloud Waveform Rendering (iOS)](https://developers.soundcloud.com/blog/ios-waveform-rendering/)
- [SoundCloud Waveform Technical Blog](https://developers.soundcloud.com/blog/waveforms-let-s-talk-about-them/)
- [SoundCloud UI Component (Aug 2025)](https://f-prieto-moyano.medium.com/a-ui-component-inspired-by-soundcloud-5e698f79573e)
- [Bandcamp Design Tutorial](https://get.bandcamp.help/hc/en-us/articles/23020690818199-Bandcamp-design-tutorial)
- [Apple MusicKit JS Documentation](https://developer.apple.com/documentation/musickitjs)
- [MusicKit on the Web](https://developer.apple.com/musickit/web/)
- [Audius API Documentation](https://docs.audius.org/api/)
- [Audius Stream Track API](https://docs.audius.org/developers/api/stream-track/)
- [Audius Embed Player (Bedtime)](https://github.com/AudiusProject/bedtime)
- [Sound.xyz Overview](https://nftplazas.com/sound-xyz-music-nft-marketplace/)
- [Sound.xyz Open Accessibility Announcement](https://nftnow.com/news/web3-music-platform-sound-xyz-announces-new-era-of-open-accessibility/)
- [Tidal Web Player Guide 2026](https://www.viwizard.com/tidal-music-tips/tidal-web-player.html)
- [Tidal Web API Reference](https://tidal-music.github.io/tidal-api-reference/)

### Libraries & Packages
- [wavesurfer.js GitHub](https://github.com/katspaugh/wavesurfer.js/)
- [wavesurfer.js npm](https://www.npmjs.com/package/wavesurfer.js)
- [@wavesurfer/react npm](https://www.npmjs.com/package/@wavesurfer/react)
- [Peaks.js GitHub (BBC)](https://github.com/bbc/peaks.js/)
- [howler.js GitHub](https://github.com/goldfire/howler.js/)
- [howler npm](https://www.npmjs.com/package/howler)
- [react-howler npm](https://www.npmjs.com/package/react-howler)
- [react-use-audio-player npm](https://www.npmjs.com/package/react-use-audio-player)
- [react-loading-skeleton GitHub](https://github.com/dvtng/react-loading-skeleton)
- [react-modern-audio-player GitHub](https://github.com/slash9494/react-modern-audio-player)

### Design Inspiration
- [Dribbble — Music Player UI](https://dribbble.com/tags/music-player-ui)
- [Behance — Music App UI](https://www.behance.net/search/projects/music%20app%20ui)
- [Tubik Studio — UI for Music Streaming](https://blog.tubikstudio.com/feel-the-beat-ui-design-for-music-streaming-services/)
- [uiCookies — HTML Music Players 2026](https://uicookies.com/html-music-player/)
- [Bandcamp Redesign Case Study](https://medium.com/@alice_moore/ui-challenge-redesign-of-an-app-e0c2637b5b77)

### Technical Guides
- [Building Audio Player React (2025)](https://digitalthriveai.com/en-us/resources/web-development/building-audio-player-react/)
- [LogRocket — Building Audio Player in React](https://blog.logrocket.com/building-audio-player-react/)
- [React Loading Skeleton Guide](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/)
- [Smashing Magazine — Skeleton Screens in React](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/)
- [Modern React Layout Patterns 2025](https://dev.to/er-raj-aryan/modern-layout-design-techniques-in-reactjs-2025-guide-3868)
- [AI Music Recommendation Systems (Cyanite, 2026)](https://cyanite.ai/2026/03/01/how-do-ai-music-recommendation-systems-work/)
- [Best Music Recommendation Engines 2026](https://resources.onestowatch.com/best-new-music-recommendation-engines/)
