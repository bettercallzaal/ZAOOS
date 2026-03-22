# 107 — Music Page Layout & Design for ZAO OS

> **Status:** Research complete
> **Date:** March 22, 2026
> **Goal:** Design a standalone /music page for ZAO OS — currently music is buried in the chat sidebar

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Layout model** | Vertical scroll with sticky quick-jump tab bar (Spotify sections + SoundCloud social context) |
| **Sections (in order)** | 1. Now Playing Hero, 2. Community Submissions, 3. Trending, 4. Playlists, 5. Recently Played, 6. Artists |
| **Mobile tabs** | Horizontal scrollable pills as scroll anchors (not segmented control) |
| **Queue drag-and-drop** | `@dnd-kit/sortable` (react-beautiful-dnd is deprecated) |
| **Search** | Debounced input + genre pills + platform filter pills |
| **Responsive** | Single column mobile → 2-col tablet → 3-col desktop (main + queue sidebar) |

---

## Platform Analysis

**Spotify** — Algorithm-driven carousels. Hero banner → horizontal scroll rows (Made For You, Recently Played, New Releases). Square cards. Bottom nav: Home, Search, Library.

**SoundCloud** — Community-oriented. Chronological feed of uploads/reposts with waveform players. Vertical feed, not grids. The social context (who shared what) is the differentiator.

**Apple Music** — Editorial curation. Large hero card (editorial pick) → carousels for Top Picks, New Music. Bottom nav: Listen Now, Browse, Radio, Library.

**Audius** — Decentralized streaming. Trending tracks, curated playlists, artist-uploaded content. Open API. 90/10 revenue split.

**Key insight for ZAO:** Blend SoundCloud's social feed model (community submissions with context about who shared) with Spotify's carousel-based discovery. The community angle — knowing *who* shared *what* — differentiates ZAO from pure streaming apps.

---

## Recommended /music Page Sections

### 1. Now Playing / Community Radio (Hero)
Full-width hero card. Current track with large artwork, waveform scrubber, play/pause. Station picker pills underneath. If nothing playing → "Start ZAO Radio" CTA.

### 2. Community Submissions
Vertical list from `/api/music/submissions`. Each card: artwork, track name, artist, submitter avatar + username, platform badge, time ago. "Submit a Track" FAB.

### 3. Trending in Community
Horizontal carousel of most-played/liked tracks. Square cards with artwork, play count overlay. Requires play count tracking in `song_submissions` table.

### 4. Curated Playlists
Grid of playlist cards (2 cols mobile, 3 tablet, 4 desktop). Cover art mosaic, playlist name, track count, curator.

### 5. Recently Played
Compact horizontal scroll of small rounded-square artwork thumbnails.

### 6. ZAO Artists
Mini artist cards: avatar (linked to Farcaster profile), display name, track count, genre tags, latest release.

---

## Mobile Tab Pattern

Use **horizontal scrollable pills as quick-jump anchors**:

```
[ Radio ] [ Submissions ] [ Trending ] [ Playlists ] [ Artists ]
```

Tapping smooth-scrolls to that section. Active tab updates via IntersectionObserver as user scrolls. Sticky at top with backdrop blur.

```tsx
<div className="sticky top-0 z-10 bg-[#0a1628]/95 backdrop-blur-sm border-b border-gray-800/50">
  <div className="flex overflow-x-auto gap-1 px-4 py-2 scrollbar-hide">
    <button className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium
      bg-[#f5a623] text-[#0a1628]">Radio</button>
    <button className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium
      text-gray-400 hover:text-white hover:bg-white/5">Submissions</button>
  </div>
</div>
```

---

## Queue & Playlist Management

**USE `@dnd-kit/sortable`** — most modern, accessible, touch+keyboard support.

| Library | Status | Verdict |
|---------|--------|---------|
| `react-beautiful-dnd` | Deprecated (2022) | Do not use |
| `@hello-pangea/dnd` | Active fork | OK but limited |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Actively maintained | Best choice |

Interactions: drag handle (grip icon), swipe-to-remove, long-press "..." menu with "Play Next" / "Add to Queue".

---

## Search & Filtering

**Genre pills:** Horizontal scrollable row. First pill "All" (default). Active = gold background.
**Platform pills:** Same pattern — All, Spotify, SoundCloud, Audius, YouTube, Apple Music.
**Debounced search:** React 19 `useDeferredValue` or `useEffect` + `setTimeout(400ms)`.

---

## Responsive Layout

| Breakpoint | Layout |
|-----------|--------|
| Mobile `<640px` | Single column, sticky tab bar, queue via bottom sheet |
| Tablet `640-1023px` | Two columns: main (65%) + collapsible queue sidebar |
| Desktop `>=1024px` | Three columns: nav sidebar (64/240px) + main + queue panel (320px) |

---

## Immediate Action Items

1. Create `/src/app/(auth)/music/page.tsx`
2. Update BottomNav Music tab href from `/chat` to `/music`
3. Build section components: `MusicHero.tsx`, `SubmissionsFeed.tsx`, `TrendingCarousel.tsx`, `PlaylistGrid.tsx`, `ArtistCard.tsx`, `MusicSearch.tsx`
4. Install `@dnd-kit/core` + `@dnd-kit/sortable` for queue reordering
5. Add play count tracking to `song_submissions` table

---

## Sources

- [Tubik Studio — UI Design for Music Streaming](https://blog.tubikstudio.com/feel-the-beat-ui-design-for-music-streaming-services/)
- [Spotify vs Apple Music UX Audit — Snappymob](https://blog.snappymob.com/ui-ux-audit-spotify-vs-apple-music)
- [Tabs UX Best Practices — Eleken](https://www.eleken.co/blog-posts/tabs-ux)
- [Top 5 Drag-and-Drop Libraries for React 2026 — Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [Drag and Drop UI Examples — Eleken](https://www.eleken.co/blog-posts/drag-and-drop-ui)
- [Tailwind CSS Music Player Components — Creative Tim](https://www.creative-tim.com/twcomponents/components/music-player)
