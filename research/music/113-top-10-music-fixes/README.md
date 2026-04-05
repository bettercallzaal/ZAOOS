# 113 — Top 10 Music Fixes for ZAO OS

> **Status:** Research complete
> **Date:** March 22, 2026
> **Goal:** Identify and prioritize the 10 highest-impact music fixes after radio started working

## Priority Fixes

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **Audius CDN not in next/image remotePatterns** — album art fails | Album art glitchy/broken | S |
| 2 | **No onError fallback on any artwork Image** — blank gray boxes | Broken UX for failed images | M |
| 3 | **Trending section is hardcoded placeholder data** | Fake content misleads users | M |
| 4 | **Radio auto-advance not wired on /music page** — stops after 1 song | Radio unusable on music page | S |
| 5 | **Submission cards have no artwork, play with empty art** | Submissions look bare | M |
| 6 | **ShuffleButton dot indicator mispositioned** — missing `relative` class | Visual bug | S |
| 7 | **Playlist click starts wrong station** — always plays index 0 | Wrong station plays | S |
| 8 | **usePlayer() creates new object every render** — unnecessary re-renders | Performance jank on mobile | M |
| 9 | **SoundCloud volume not wired** — slider moves but volume doesn't change | Volume broken for SC | S |
| 10 | **WaveformPlayer double-downloads audio per queue card** — bandwidth waste | Memory/bandwidth on mobile | M |

## Fix #1 — Album Art (Root Cause of Glitchy Images)

Audius artwork URLs use CDN subdomains like `audius-content-12.figment.io` and `creatornode2.audius.co` which are NOT in `next.config.ts` remotePatterns. When `next/image` can't optimize them, it fails silently.

**Fix:** Add wildcard patterns to `next.config.ts`, or use `unoptimized` on all artwork `<Image>` tags.

## Fix #4 — Radio Auto-Advance

`setOnEnded` callback for radio next-track is only wired in ChatRoom and ListeningRoom. The MusicPage doesn't register it, so radio stops after one song.

**Fix:** Add `useEffect` in MusicPage that calls `player.setOnEnded(() => radio.nextRadioTrack())` when radio is active.

## Recommended Build Order

**Sprint 1 (S effort, do first):** #1, #4, #6, #7, #9
**Sprint 2 (M effort):** #2, #3, #5
**Sprint 3 (M effort):** #8, #10
