# Plan: Home + Music Fixes + Navigation (Top 3 + Hamburger)

> **Goal:** Fix home/music playback reliability, restore Settings access, and make navigation scale beyond 3 primary tabs by moving everything else into a hamburger menu.

**Date:** 2026-03-22  
**Effort:** 1-2 days  
**Owners:** App UI + Audio  

---

## Problem Statement

1. **Music is broken** ("none of the music works at all"), including the Home "Now Playing" hero.
2. **Settings is missing from More**, so users can’t find it.
3. **Navigation doesn’t scale**: we need the top 3 primary tabs always visible, and everything else should be in a hamburger menu.

---

## Scope

### In scope
- Music playback works reliably on:
  - Home (NowPlayingHero)
  - Music page
  - Persistent player
- Settings is accessible from the overflow navigation.
- Bottom nav redesigned to:
  - Show **top 3** destinations as tabs
  - Use **hamburger** for all other destinations

### Out of scope
- Redesigning music discovery features
- Adding new music providers
- Major new settings features (this is about access/navigation)

---

## Success Criteria

- [ ] From Home, tapping "Start Radio" starts playback within 3 seconds in normal conditions
- [ ] Music page loads and playback works for at least one track source (radio / queue)
- [ ] When playback fails, user sees a clear error state and a retry
- [ ] Settings appears in the hamburger menu and navigates to `/settings`
- [ ] Bottom navigation shows exactly 3 main tabs + hamburger
- [ ] All non-top-3 routes remain reachable via hamburger

---

## Task 1 — Debug & Fix Music Playback (Root Cause)

**Goal:** Identify why playback is failing and fix it at the provider/player layer.

**Primary files likely involved:**
- `src/components/home/NowPlayingHero.tsx`
- `src/hooks/useRadio.ts`
- `src/providers/audio/PlayerProvider.tsx`
- `src/providers/audio/*Provider.tsx`
- `src/components/music/PersistentPlayer.tsx`
- `src/components/music/GlobalPlayer.tsx`
- `src/app/api/music/radio/route.ts`

### Steps
- [ ] Repro on Home: tap "Start Radio" and capture console errors
- [ ] Repro on Music page: try playing any track and capture console/network errors
- [ ] Verify `/api/music/radio` returns playlists with tracks containing:
  - `title`, `artist`, `artworkUrl`, `url`, `streamUrl`
- [ ] Confirm `useRadio()` calls `player.play(metadata)` and that `metadata.streamUrl` is used by the active provider
- [ ] Confirm `PlayerProvider` correctly selects a provider for the metadata type
- [ ] Add a visible user-facing error state if radio start fails (not silent `console.error`)
- [ ] Ensure `resume()` path works after initial `play()`

### Deliverables
- [ ] Playback works end-to-end from Home
- [ ] Playback works end-to-end from Music page
- [ ] User sees a clear error message + retry when playback fails

---

## Task 2 — Restore Settings in Overflow Navigation

**Goal:** Settings must be reachable from the hamburger menu.

**Primary files likely involved:**
- `src/components/navigation/BottomNav.tsx`
- `src/app/(auth)/settings/page.tsx`

### Steps
- [ ] Confirm `/settings` route exists and is accessible to authenticated users
- [ ] Add Settings entry into the hamburger menu list
- [ ] Ensure the "active" state works when on `/settings`

---

## Task 3 — Navigation Redesign: Top 3 Tabs + Hamburger Overflow

**Goal:** Only 3 primary tabs are always visible. Everything else goes into a hamburger.

**Design Rules**
- **Top 3 tabs** (proposal):
  - Home (`/home`)
  - Chat (`/chat`)
  - Music (`/music`)
- **Hamburger overflow** includes:
  - Governance (`/fractals`)
  - Social (`/social`)
  - Ecosystem (`/ecosystem`)
  - Tools (`/tools`)
  - Settings (`/settings`)
  - Contribute (`/contribute`)
  - Wavewarz (`/wavewarz`)

**Primary files likely involved:**
- `src/components/navigation/BottomNav.tsx`

### Steps
- [ ] Split navigation config into:
  - `PRIMARY_TABS` (length 3)
  - `OVERFLOW_ITEMS` (everything else)
- [ ] Implement hamburger UI for mobile bottom nav:
  - Tap hamburger opens a sheet/menu
  - Menu shows overflow items as links
  - Includes Settings
- [ ] Desktop top nav:
  - Show primary tabs inline
  - Show hamburger/overflow dropdown for the rest
- [ ] Preserve current match behavior for:
  - `/messages` mapping to Chat
  - `/governance` + `/respect` mapping to Governance

---

## Risks / Notes

- Radio is currently failing silently in `useRadio()` (it logs `Radio start failed` but doesn’t show UI error). This makes it feel like “nothing works.”
- Provider mismatches are common failure points (metadata `type`, missing `streamUrl`, CORS, autoplay restrictions).

---

## Test Plan

- [ ] Home: Start Radio -> plays audio
- [ ] Home: Pause -> Resume works
- [ ] Music page: play -> plays audio
- [ ] Simulate failure (bad `streamUrl`) -> UI shows error + retry
- [ ] Nav:
  - Primary tabs show exactly 3
  - Hamburger contains all overflow entries
  - Settings link works

---

## Rollout

- [ ] Ship behind a quick UI-only change (navigation) if needed
- [ ] Ship audio fix only after verifying at least one provider flow works reliably
