# 127 — Mobile Music Player Optimization & Advanced Features

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Audit ZAO OS music player for mobile UX gaps, MediaSession completeness, PWA audio reliability, gesture support, and advanced playback features
> **Builds on:** Doc 105 (Music Player UI), Doc 126 (Gap Analysis), Doc 33 (Infrastructure/Mobile)

---

## Key Decisions / Recommendations

### Priority 1 — Quick Wins (High Impact, Low Effort)

| Feature | Why | Effort | Status |
|---------|-----|--------|--------|
| **Complete MediaSession API** | ZAO only implements play/pause/next. Missing: `seekbackward`, `seekforward`, `seekto`, `stop`, `setPositionState()`. Lock screen shows no progress bar without position state. | ~2 hrs | Missing |
| **Swipe to skip (mobile player)** | Spotify, Apple Music both support swipe left/right on artwork to skip. Standard mobile music UX. ZAO's mobile player has no gesture support at all. | ~3 hrs | Missing |
| **Expanded mobile player** | Tap compact player to expand full-screen with artwork, scrubber, all controls. Every music app has this. ZAO only has compact bar on mobile. | ~6 hrs | Missing |
| **Haptic feedback** | `navigator.vibrate(10)` on play/pause/skip/like. Subtle, makes the app feel native. One line per action. | ~30 min | Missing |

### Priority 2 — Medium Effort, High Polish

| Feature | Why | Effort | Status |
|---------|-----|--------|--------|
| **Crossfade between tracks** | Smooth transitions, especially for radio mode. Use dual `<audio>` elements — fade out current while fading in next. `@regosen/gapless-5` library handles this natively with WebAudio. | ~4 hrs | Missing |
| **Gapless playback** | Eliminate silence between tracks. `@regosen/gapless-5` (npm) handles HTML5→WebAudio handoff. 339 commits, Safari/Chrome/Firefox support. | ~4 hrs | Missing |
| **Mini-player ↔ expanded player animation** | Smooth spring transition between compact bar and full-screen player. Use CSS `transform` + `transition` or `framer-motion`. | ~4 hrs | Missing |
| **Persistent scrubber on mobile** | Mobile player has a thin progress bar but no seekable scrubber. Desktop has the full waveform Scrubber component. Add a touch-friendly scrubber to expanded view. | ~2 hrs | Missing |

### Priority 3 — PWA & Platform Hardening

| Feature | Why | Effort | Status |
|---------|-----|--------|--------|
| **iOS PWA background audio workaround** | iOS PWAs pause audio when backgrounded (WebKit bug #198277, still open). Workaround: keep a silent audio stream running or use "Don't install as PWA on iOS — use Safari directly" messaging. iOS 26 made it worse. | ~2 hrs | Not addressed |
| **Wake Lock API** | Prevent screen from dimming during playback. `navigator.wakeLock.request('screen')` — supported on Chrome Android, Safari 16.4+. | ~1 hr | Missing |
| **Service worker audio caching** | Cache Audius stream URLs for faster repeat plays. Only works for direct audio URLs (not Spotify/YouTube embeds). | ~4 hrs | Not built |
| **Offline indicator** | Show "Offline — cached tracks only" when `navigator.onLine` is false. Non-critical for 100-member community. | ~1 hr | Missing |

### Skip These (Not Worth It)

| Feature | Why Skip |
|---------|----------|
| **Web Audio API equalizer** | Browser EQ is unreliable cross-platform. Safari's WebAudio has bugs. Native apps do this better. |
| **Visualizer/spectrum analyzer** | Cool but distracting. Waveform bars already serve this purpose. |
| **Pip (Picture-in-Picture)** | Only works for video elements. Audio PiP not standardized. |
| **Download for offline** | DRM/licensing nightmare for Spotify/YouTube. Only possible for Audius (open streams). Not worth the legal risk. |

---

## What's Built vs What's Missing (Mobile Focus)

### Built (Good Foundation)

| Feature | Implementation | File |
|---------|---------------|------|
| MediaSession metadata | Title, artist, album, artwork (512x512) | `PlayerProvider.tsx:182-189` |
| MediaSession play/pause/next | Registered action handlers | `PlayerProvider.tsx:202-213` |
| Module-level audio singleton | Survives re-mounts, React strict mode | `HTMLAudioProvider.tsx:7` |
| Background play attempt | `audio.play()` called on load for mobile background | `HTMLAudioProvider.tsx:74-79` |
| Autoplay error handling | Shows "Tap play again" on browser block | `HTMLAudioProvider.tsx:32-34` |
| PWA manifest | `display: standalone`, icons, categories | `public/manifest.json` |
| Apple mobile meta tags | `apple-mobile-web-app-capable`, status bar | `layout.tsx:79-81` |
| Farcaster safe area insets | Bottom padding for mini app context | `GlobalPlayer.tsx:38-47` |
| Volume button (mobile) | Popover with slider + mute toggle | `GlobalPlayer.tsx` (VolumeButton) |
| Compact mobile player | Track info, prev/next, play/pause | `GlobalPlayer.tsx:278-361` |

### NOT Built (Gaps)

| Feature | Impact | Difficulty |
|---------|--------|-----------|
| **MediaSession seekbackward/seekforward** | 🔴 Lock screen has no skip-back/forward buttons | Easy |
| **MediaSession seekto** | 🔴 Lock screen scrubber doesn't work on Android | Easy |
| **MediaSession setPositionState** | 🔴 Lock screen shows no progress bar at all | Easy |
| **MediaSession previoustrack** | 🟠 Currently set to `null` — no previous track on lock screen | Easy |
| **Swipe gestures on player** | 🟠 No swipe-to-skip on mobile artwork/player bar | Medium |
| **Expanded/full-screen player** | 🔴 No way to see large artwork, full scrubber, or all controls on mobile | Medium |
| **Haptic feedback** | 🟡 No tactile response on any action | Trivial |
| **Crossfade** | 🟡 Jarring cuts between tracks, especially on radio | Medium |
| **Gapless playback** | 🟡 Silence gaps between tracks | Medium |
| **Wake Lock** | 🟡 Screen dims during playback | Easy |
| **iOS PWA audio fix** | 🟠 Audio stops when PWA is backgrounded on iOS | Hard (platform bug) |

---

## Feature Deep Dives

### 1. Complete MediaSession API (Critical — 2 hours)

ZAO's current implementation at `PlayerProvider.tsx:178-220` only handles 3 of 7 relevant actions.

**What to add:**

```typescript
// In PlayerProvider.tsx, add to the existing mediaSession effect:

// Seek backward (lock screen rewind button — 10s default)
navigator.mediaSession.setActionHandler('seekbackward', (details) => {
  const skipTime = details.seekOffset || 10;
  const ctrl = getCtrl();
  if (ctrl) ctrl.seek(Math.max(0, (stateRef.current.position - skipTime * 1000)));
});

// Seek forward (lock screen fast-forward button — 10s default)
navigator.mediaSession.setActionHandler('seekforward', (details) => {
  const skipTime = details.seekOffset || 10;
  const ctrl = getCtrl();
  if (ctrl) ctrl.seek(stateRef.current.position + skipTime * 1000);
});

// Seek to specific position (lock screen scrubber drag)
navigator.mediaSession.setActionHandler('seekto', (details) => {
  if (details.seekTime != null) {
    const ctrl = getCtrl();
    if (ctrl) ctrl.seek(details.seekTime * 1000);
  }
});

// Stop (some lock screens show a stop button)
navigator.mediaSession.setActionHandler('stop', () => {
  dispatch({ type: 'STOP' });
});

// Previous track (wire to onPrev callback)
navigator.mediaSession.setActionHandler('previoustrack', () => {
  // need to expose onPrev through context
});
```

**Position state (shows progress bar on lock screen):**

```typescript
// Add to the position update effect:
if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
  try {
    navigator.mediaSession.setPositionState({
      duration: state.duration / 1000,
      playbackRate: 1,
      position: Math.min(state.position / 1000, state.duration / 1000),
    });
  } catch { /* ignore invalid state */ }
}
```

**Impact:** Lock screen on Android/iOS will show progress bar, rewind/forward buttons, and a draggable scrubber. This is the single highest-impact mobile improvement.

---

### 2. Swipe to Skip (Mobile Player)

Add horizontal swipe detection on the mobile player's artwork/track-info area.

**Implementation pattern:**

```typescript
const touchStartX = useRef(0);
const touchStartY = useRef(0);

const onTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
};

const onTouchEnd = (e: React.TouchEvent) => {
  const dx = e.changedTouches[0].clientX - touchStartX.current;
  const dy = e.changedTouches[0].clientY - touchStartY.current;

  // Only trigger if horizontal swipe > 50px and more horizontal than vertical
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx > 0) onPrev?.();   // swipe right = previous
    else onNext?.();           // swipe left = next
    navigator.vibrate?.(10);   // haptic
  }
};
```

Attach to the mobile player's outer `<div>` wrapping artwork + track info.

---

### 3. Expanded Mobile Player

The most impactful UX improvement. Current mobile player is a 56px compact bar. Tapping should expand to a full-screen view.

**Layout:**

```
┌─────────────────────────┐
│        ← Minimize       │  ← Drag handle or chevron
│                         │
│     ┌───────────────┐   │
│     │               │   │
│     │   Artwork     │   │  ← 280x280 rounded
│     │   (large)     │   │
│     │               │   │
│     └───────────────┘   │
│                         │
│   Track Name            │
│   Artist Name           │
│                         │
│   ═══════●══════════    │  ← Full scrubber (seekable)
│   1:23          3:45    │
│                         │
│   ⟨⟨  ▶/❚❚  ⟩⟩         │  ← Transport controls (large)
│   🔀          🔁         │  ← Shuffle + Repeat
│                         │
│   ♥  ＋  📤  ⏰          │  ← Like, Playlist, Share, Sleep
│                         │
│   Volume ═══●═══════    │  ← Volume slider (horizontal)
│                         │
└─────────────────────────┘
```

**Implementation approach:**
- Add `expanded` state to `GlobalPlayer`
- Compact bar: tap artwork or track info → `setExpanded(true)`
- Expanded view: full-screen overlay with `position: fixed, inset: 0`
- Drag down to dismiss (or tap chevron)
- Reuse existing `Scrubber` component
- Show all controls that are hidden on compact mobile

---

### 4. Crossfade with @regosen/gapless-5

**npm:** `@regosen/gapless-5`
**Browser support:** Safari (incl. iOS), Chrome (incl. Android), Firefox
**How it works:** Starts with HTML5 Audio (instant), seamlessly switches to WebAudio (gapless). Built-in crossfade with configurable duration and curves (None, Linear, EqualPower).

**Integration plan:**
1. Install: `npm install @regosen/gapless-5`
2. Replace `HTMLAudioProvider`'s singleton `new Audio()` with Gapless5 player
3. Configure: `crossfade: 3000` (3s), `crossfadeCurve: 'EqualPower'`
4. Gapless5 handles track queue internally — wire to player state via callbacks

**Risk:** Bundle size unknown. Test with radio mode first since that's where crossfade matters most.

---

### 5. iOS PWA Background Audio (Platform Bug)

**Status:** WebKit Bug #198277 (filed 2019, still open as of March 2026).

**The problem:** Audio plays fine in Safari browser. But when the site is installed as a PWA (Add to Home Screen), backgrounding the app or locking the screen **pauses audio**. iOS 26 made it even worse — audio context crashes randomly.

**Workarounds (limited):**
1. **Don't recommend PWA install on iOS** — add messaging: "For best audio experience on iPhone, use Safari browser directly"
2. **Silent audio keepalive** — play a silent 1-second audio loop to keep the audio context alive (unreliable on iOS 26)
3. **MediaSession API** — properly implemented, it *helps* iOS keep the audio session alive, but doesn't fully fix it
4. **Service worker fetch handler** — keeps the service worker alive, which indirectly helps audio (limited evidence)

**Recommendation:** Focus MediaSession implementation (Priority 1) which partially mitigates this. Don't invest in workarounds — Apple needs to fix this. Tell iOS users to use Safari, not PWA install.

---

### 6. Wake Lock API

Prevents screen from dimming while music is playing. Simple and effective.

```typescript
// In PlayerProvider.tsx
useEffect(() => {
  if (state.status !== 'playing' || !('wakeLock' in navigator)) return;

  let lock: WakeLockSentinel | null = null;
  navigator.wakeLock.request('screen')
    .then(l => { lock = l; })
    .catch(() => {}); // Not critical

  return () => { lock?.release(); };
}, [state.status]);
```

**Support:** Chrome Android (full), Safari 16.4+ (full), Firefox (not supported).

---

## Recommended Build Order

```
Session 1 (2-3 hrs): Complete MediaSession API + setPositionState + haptic feedback
Session 2 (3-4 hrs): Swipe to skip + Wake Lock
Session 3 (6-8 hrs): Expanded mobile player (full-screen view)
Session 4 (4-6 hrs): Crossfade + gapless via @regosen/gapless-5
Future:              iOS PWA messaging, service worker caching
```

---

## Competitive Comparison (Mobile Focus)

| Feature | Spotify | Apple Music | SoundCloud | Audius | ZAO OS |
|---------|---------|-------------|------------|--------|--------|
| Lock screen controls | Full (all actions) | Full | Play/pause/skip | Play/pause | Play/pause/next only |
| Lock screen progress | Scrubber + time | Scrubber + time | None | None | **None** (no setPositionState) |
| Swipe to skip | Yes | Yes (iOS 18+) | No | No | **No** |
| Expanded player | Full-screen | Full-screen | Full-screen | Full-screen | **No** (compact bar only) |
| Haptic feedback | Yes | Yes | No | No | **No** |
| Crossfade | Yes (configurable) | Yes | No | No | **No** |
| Gapless playback | Yes | Yes | Yes | No | **No** |
| Background audio (PWA) | N/A (native) | N/A (native) | N/A (native) | Web app | Works in Safari, broken in PWA |
| Wake Lock | N/A (native) | N/A (native) | N/A (native) | No | **No** |
| Gesture controls | Swipe, long-press | Swipe, 3D Touch | Limited | No | **No** |

---

## Sources

- [MediaSession API — web.dev](https://web.dev/articles/media-session)
- [MediaSession API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)
- [iOS Safari PWA Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [WebKit Bug #198277 — Audio stops in standalone PWA](https://bugs.webkit.org/show_bug.cgi?id=198277)
- [iOS 26 PWA Audio Issues — MacRumors](https://forums.macrumors.com/threads/ios-26-audio-issues-in-pwa-web-apps-not-fixed-in-26-1-or-26-2-but-much-better.2466839/)
- [PWA Audio Playback Lessons — Prototyp Digital](https://prototyp.digital/blog/what-we-learned-about-pwas-and-audio-playback)
- [Gapless-5 — GitHub](https://github.com/regosen/Gapless-5)
- [HTML5 Audio Crossfade — GitHub](https://github.com/lietu/html5-audio-crossfade)
- [Material Design Gestures](https://m3.material.io/foundations/interaction/gestures)
- [Apple Music Swipe Gesture — Macworld](https://www.macworld.com/article/2918525/apple-music-finally-gets-a-swipe-gesture-to-change-tracks-and-ive-never-been-happier.html)
- [Audio Player PWA Demo — Progressier](https://progressier.com/pwa-capabilities/audio-player-pwa)
- [Doc 105 — Music Player UI Patterns](../105-music-player-ui-showcase/)
- [Doc 126 — Music Player Gap Analysis](../126-music-player-gap-analysis/)
