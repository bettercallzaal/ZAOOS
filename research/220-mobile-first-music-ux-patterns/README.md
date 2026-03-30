# 220 — Mobile-First Music App UX Patterns for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Catalog mobile UX patterns across music players, audio rooms, live streaming, wallet connection, notifications, and PWA limitations — with specific recommendations for ZAO OS
> **Builds on:** Doc 189 (Mobile Player Optimization), Doc 211 (Music Player UI Best Practices), Doc 218 (Mobile App Strategy: PWA to Native)

---

## Executive Summary

ZAO OS already has solid mobile foundations: bottom nav in the thumb zone, PersistentPlayer with swipe-to-skip and haptic feedback, safe area CSS, MediaSession lock screen controls, and PWA install prompt. The gaps are in **gesture discoverability**, **bottom sheet patterns for secondary flows**, **audio room mobile UX**, **notification granularity**, and **iOS PWA workarounds**. This doc catalogs 10 research areas and distills them into a prioritized implementation plan.

**Top 3 takeaways:**
1. ZAO OS's mini player swipe gesture (60px threshold, `navigator.vibrate(10)`) matches the pattern Apple Music just shipped in iOS 26.1 — validate and extend it
2. Bottom sheets should replace modals for every secondary flow on mobile (queue, playlists, settings, wallet connect)
3. iOS PWA background audio remains the single biggest limitation; Capacitor wrapper (Doc 218) is the only real fix

---

## Part 1: Thumb Zone & Gesture Navigation

### The Thumb Zone Model (2026)

| Zone | Screen Area | Reachability | Where to Place |
|------|-------------|--------------|----------------|
| **Easy** | Bottom 45% | Natural thumb arc | Primary actions: play/pause, nav tabs, queue |
| **Stretch** | Middle 30% | Comfortable reach | Content: track lists, chat messages, feed |
| **Hard** | Top 25% | Requires hand shift | Status info, search, profile (infrequent) |

### ZAO OS Current State

| Element | Placement | Thumb-Friendly? | Notes |
|---------|-----------|-----------------|-------|
| BottomNav | Fixed bottom, h-14 | Yes | 5 tabs (Home, Chat, Music, Governance, More) — ideal count |
| PersistentPlayer | Fixed `bottom-14` | Yes | Sits directly above nav, in easy zone |
| Play/Pause button | Right side of player bar | Yes | w-11 h-11 rounded-full, good size |
| More menu | Bottom sheet, slides up | Yes | Grid of 10 items, rounded-t-2xl |
| Expanded player | Full screen overlay | Mixed | Opens from compact — good, but dismiss is top-positioned |
| Search | Lazy-loaded global | Unclear | Check if trigger is thumb-accessible |

### Patterns to Adopt

1. **Swipe down to dismiss expanded player** — already uses motion/react animation (y: 100 exit), but needs a drag-down gesture not just a button tap
2. **Long-press context menus** on track cards (add to queue, like, share, go to artist) — standard in Spotify/Apple Music
3. **Edge swipe for back navigation** — common in iOS apps, useful for nested pages (artist detail, playlist detail)
4. **Bottom-positioned search trigger** — if search is top-bar only, consider a FAB or bottom sheet trigger

### Key Design Rules

- Touch targets: minimum 44x44px (Apple HIG). ZAO's buttons are w-10 h-10 (40px) to w-11 h-11 (44px) — borderline, bump smaller ones to 44px
- Spacing between interactive elements: minimum 8px to prevent misfire
- Gesture + visible control: never make a gesture the only path. ZAO does this right (swipe skips, but prev/next buttons exist)

---

## Part 2: Spotify & Apple Music Design Patterns

### Mini Player Pattern

| Aspect | Spotify | Apple Music | ZAO OS |
|--------|---------|-------------|--------|
| Position | Fixed bottom, above tab bar | Fixed bottom, above tab bar | Fixed `bottom-14`, above BottomNav |
| Height | ~64px | ~64px | ~56px (py-1.5 + content) |
| Artwork | Left, square | Left, square | Left, 40x40 rounded-lg with progress ring |
| Expand trigger | Tap anywhere on bar | Tap anywhere on bar | Tap artwork or track info |
| Swipe skip | Left/right on bar | Left/right on mini player (iOS 26.1) | Left/right, 60px threshold |
| Haptic on skip | Yes (subtle) | Yes (iOS 26.1) | Yes, `navigator.vibrate(10)` |
| Progress indicator | Thin bar at top | Thin bar at top | Thin bar at top (h-1.5) |
| Dismiss | Swipe down mini player | No dismiss (always present) | X button (explicit) |

### Bottom Sheet Pattern (Spotify Model)

Spotify uses bottom sheets extensively for:
- Queue management (swipe right to add, swipe left to remove)
- Playlist selection
- Share options
- Audio quality settings
- Sleep timer

**ZAO OS opportunity:** The "More" menu already uses a bottom sheet. Extend this pattern to:
- Queue panel (currently sidebar on desktop — needs mobile bottom sheet)
- Playlist add flow
- Track context menu (long press)
- Audio filter/EQ settings
- Share to Farcaster/Bluesky/X

### Expanded Player Transition

| App | Animation | Duration | Style |
|-----|-----------|----------|-------|
| Spotify | Spring with shared element (artwork morphs) | ~400ms | Shared layout animation |
| Apple Music | Liquid Glass morph (iOS 26) | ~350ms | Material blur + scale |
| Tidal | Slide up | ~300ms | Simple translate |
| ZAO OS | Spring (damping 25, stiffness 300) | ~300ms | motion/react + layoutId on artwork |

ZAO OS already has the `layoutId="player-artwork"` shared animation via motion/react — this is the correct modern approach. The spring config (damping 25, stiffness 300) produces a snappy, natural-feeling transition.

---

## Part 3: Mobile Audio Room UX

### Platform Comparison

| Feature | Clubhouse (legacy) | X Spaces | Discord Stage | ZAO Spaces |
|---------|-------------------|----------|---------------|------------|
| Entry point | Hallway feed | Timeline pill | Server channel list | /spaces page |
| Minimize behavior | Shrinks to pill at top | Minimizes to bottom bar | Overlay at bottom | Unknown |
| Speaker grid | Circles, animated rings | Circles with wave indicator | List with role badges | Stream.io/100ms UI |
| Hand raise | Explicit button | Explicit button | Explicit button | Should implement |
| Reactions | Heart + emoji | Heart + clap + fire | Stage emoji | Should implement |
| Chat alongside | No (audio only) | Yes (tweets in space) | Yes (text chat) | Should implement |
| Mobile-first? | Yes (born mobile) | Yes | No (desktop-first) | Web (both) |

### Audio Room Mobile UX Best Practices

1. **Persistent mini indicator** when room is active but user navigates away — show a floating pill with room status and quick mute/leave
2. **Large mute button** in thumb zone — the single most-tapped control in any audio room
3. **Speaker stage** at top, listeners below with scroll — visual hierarchy matches audio hierarchy
4. **Reaction animations** float up from bottom, auto-dismiss after 2s
5. **Swipe down to minimize** room to a floating pill, swipe up to expand
6. **Background audio** must continue when app is backgrounded (PWA limitation on iOS)

### ZAO Spaces Recommendations

- Add a floating "Spaces active" pill to PersistentPlayer area when user is in a room but navigates to other pages
- Implement hand-raise queue visible to moderators
- Add emoji reactions that float up (heart, fire, clap, 100)
- Ensure mute button is at least 56x56px and always in bottom center

---

## Part 4: Mobile-First Web App Best Practices

### Touch Targets & Safe Areas

| Standard | Minimum Size | Recommended |
|----------|-------------|-------------|
| Apple HIG | 44x44pt | 48x48pt |
| Material Design 3 | 48x48dp | 56x48dp |
| WCAG 2.2 AAA | 44x44 CSS px | — |
| ZAO OS current | 32-44px (varies) | Audit needed |

### ZAO OS Safe Area Implementation

Current in `globals.css`:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

Also: BottomNav uses `safe-area-bottom` class on the flex container.

**Gap:** The PersistentPlayer at `bottom-14` does not account for safe area insets on devices with home indicators (iPhone X+). Should be `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]` or use the same safe-area utility.

### Orientation Handling

- Lock to portrait for music player expanded view (prevents layout jank)
- Allow landscape for video/streaming content
- Test all views in both orientations
- Use `screen.orientation.lock('portrait')` API where supported

### Performance Thresholds

| Metric | Target | Why |
|--------|--------|-----|
| FCP | <1.8s | Users abandon after 3s |
| LCP | <2.5s | Core Web Vitals |
| INP | <200ms | Touch responsiveness |
| TTI | <3.5s | Interactive on mobile networks |

---

## Part 5: PWA iOS Limitations (2026)

### What Does NOT Work on iOS Safari PWA

| Feature | iOS Status | Workaround |
|---------|-----------|------------|
| **Background audio** | Stops when backgrounded/locked | Capacitor native plugin (Doc 218) |
| **Push notifications** | iOS 16.4+ only, home screen required | Show install instructions, detect capability |
| **Background Sync** | Not supported, no timeline | Retry on next foreground, IndexedDB queue |
| **Periodic Background Sync** | Not supported | Re-fetch on app open |
| **Background Fetch** | Not supported | Service worker fetch on visibility change |
| **Storage quota** | ~50MB (vs Chrome's hundreds of MB) | Aggressive cache pruning, prioritize audio metadata over artwork |
| **Cache persistence** | 7-day expiry if unopened | Re-cache critical assets on every launch |
| **EU PWA support** | Removed in iOS 17.4 (DMA) | Opens in Safari tab, no standalone mode |
| **Web Bluetooth/NFC/USB** | Not supported | N/A for music app |
| **Badging API** | Not supported | Use push notification badge instead |
| **Contact Picker** | Not supported | Manual entry |

### iOS-Specific Fixes for ZAO OS

1. **Viewport height:** Use `height: -webkit-fill-available` or `dvh` units to fix the 100vh layout jump caused by Safari's collapsing address bar
2. **Overscroll:** `overscroll-behavior: none` on the main container to prevent rubber-banding interfering with player swipe gestures
3. **Standalone detection:** `window.matchMedia('(display-mode: standalone)')` to adjust UI when installed
4. **Audio policy:** iOS requires user gesture to start audio. ZAO's "Tap to play" idle state handles this correctly
5. **Service worker:** Re-register on every app open to handle iOS's aggressive cleanup

### Recommendation

Stay PWA for now, plan Capacitor wrapper (Doc 218 recommendation). The critical gap is background audio — everything else is workable with the listed workarounds.

---

## Part 6: Mobile Live Streaming UI Patterns

### Platform Comparison (2026)

| Feature | TikTok Live | Instagram Live | Twitch Mobile | YouTube Live | ZAO Spaces |
|---------|-------------|----------------|---------------|--------------|------------|
| Orientation | Portrait-first | Portrait-first | Landscape + portrait | Landscape | Responsive |
| Chat overlay | Full-screen overlay | Bottom half | Resizable (March 2026) | Right rail or overlay | TBD |
| Reactions | Gift animations | Hearts floating | Emotes | Super Chat | TBD |
| PiP when backgrounded | Yes | Yes | Yes (March 2026) | Yes | No (PWA limitation) |
| Go-live flow | 1 tap + title | 1 tap | 2-3 taps | 3-4 taps | Multi-step (complex) |
| Viewer count | Prominent, top | Top left | Top left | Top | Should add |

### Key Mobile Live Streaming Patterns

1. **Vertical-first video** — TikTok and Instagram default to portrait. ZAO should support both but default to portrait on mobile
2. **Floating chat** — transparent overlay on top of video, auto-fades when inactive. Bottom 40% of screen
3. **Gift/reaction animations** — full-screen animations triggered by viewer actions. Creates engagement loop
4. **One-tap go-live** — reduce friction to start streaming. ZAO's current multi-step RTMP flow is too complex for mobile
5. **Disconnect protection** — Twitch's 90-second BRB screen. ZAO should auto-reconnect and show placeholder
6. **Resizable elements** — Twitch's new resizable chat overlay. Let users adjust chat size

### ZAO Spaces Mobile Simplification

- Default to audio-only rooms (simpler, less bandwidth, PWA-friendly)
- One-tap "Start Room" with title auto-generated from context
- Minimize to floating pill (like X Spaces bottom bar)
- Chat as transparent overlay, not separate panel

---

## Part 7: Music Player Gesture Controls

### Gesture Inventory Across Platforms

| Gesture | Spotify | Apple Music (iOS 26.1) | ZAO OS | Recommendation |
|---------|---------|----------------------|--------|----------------|
| Swipe left on mini player | Next track | Next track | Next track (60px threshold) | Keep, add visual hint |
| Swipe right on mini player | Previous track | Previous track | Previous track | Keep |
| Swipe up on mini player | Expand | Expand | N/A (tap to expand) | Add swipe-up expand |
| Swipe down on expanded | Collapse | Collapse | N/A (button only) | Add drag-down dismiss |
| Swipe right on track card | Add to queue | — | N/A | Add (high value) |
| Long press on track | Context menu | Context menu | N/A | Add |
| Shake device | — | Shuffle (opt-in) | N/A | Skip (unreliable on web) |
| Double-tap artwork | — | Like | N/A | Consider |
| Pinch on expanded | — | — | N/A | Skip |

### Haptic Feedback Patterns

| Interaction | Pattern | Duration | ZAO OS Status |
|-------------|---------|----------|---------------|
| Track skip (swipe) | Single tap | 10ms | Implemented: `navigator.vibrate(10)` |
| Play/Pause | Single tap | 10ms | Not implemented |
| Like/unlike | Double tap | [10, 30, 10]ms | Not implemented |
| Error/failure | Triple tap | [50, 30, 50, 30, 50]ms | Not implemented |
| Long press menu | Soft pulse | 15ms | Not implemented |
| Queue add | Success | [10, 50, 10]ms | Not implemented |

### Haptic API Status

| Platform | API | Status |
|----------|-----|--------|
| Android Chrome | `navigator.vibrate()` | Full support |
| iOS Safari | `navigator.vibrate()` | Not supported (no timeline) |
| iOS Safari 17.4+ | Checkbox switch hack | Workaround via `web-haptics` npm package |
| Desktop | N/A | Silent fallback |

**Recommendation:** Use the `web-haptics` npm package for cross-platform haptic feedback. It handles the iOS workaround automatically. Feature-detect and fail silently.

---

## Part 8: Mobile Notification Patterns

### When to Notify ZAO OS Users

| Event | Urgency | Channel | Frequency Cap |
|-------|---------|---------|---------------|
| New track in queue you follow | Low | In-app badge | 1/hour max |
| Someone joined your listening room | Medium | Push + in-app | Every occurrence |
| New governance proposal | Medium | Push | 1/day digest |
| Voting deadline approaching (24h) | High | Push | Once per proposal |
| New message in XMTP DM | High | Push | Per message, throttle to 1/min |
| Channel mention (@you) | High | Push | Per mention |
| Fractal meeting starting | High | Push (15min before) | Once |
| New music from followed artist | Low | In-app | 1/day digest |
| Respect received | Low | In-app | Batched daily |
| Radio playing your submission | Medium | Push | Per occurrence |

### Notification UX Rules for ZAO OS

1. **Granular opt-in:** Let users control per-category (Music, Chat, Governance, Spaces). A single toggle is not acceptable in 2026
2. **Mute/snooze:** Offer 1hr, 4hr, 24hr, 1 week mute options
3. **Digest mode:** Batch low-urgency notifications into a daily or weekly digest
4. **Deep link to context:** Every notification must open the relevant screen, not the app home
5. **No guilt copy:** Never use "You're missing out!" or "Your community needs you!" patterns
6. **Frequency awareness:** If a user dismisses 3+ notifications in a row, auto-reduce frequency
7. **Quiet hours:** Respect device Do Not Disturb, and offer in-app quiet hours (e.g., 10pm-8am)
8. **Progressive permission:** Don't ask for push permission on first visit. Wait until user has engaged with a feature that benefits from notifications

### iOS PWA Push Limitations

- Only works when installed to home screen (iOS 16.4+)
- Not available in EU (iOS 17.4+)
- No silent push (can't update in background)
- ~70-85% delivery rate (vs 90-95% Android)
- Subscription cleared if SW receives push but doesn't display notification

---

## Part 9: Mobile Web3 Wallet UX

### Connection Flow Comparison

| Method | UX Quality | Steps | ZAO OS Status |
|--------|-----------|-------|---------------|
| WalletConnect QR (desktop) | Good | 3 (scan, approve, connected) | Implemented via Wagmi |
| WalletConnect deep link (mobile) | Good | 2 (tap, approve) | Should verify |
| Injected wallet (MetaMask browser) | Excellent | 1 (approve) | Implemented via Wagmi |
| Coinbase Smart Wallet | Excellent | 1-2 (passkey) | Should add |
| Social login (Privy/Dynamic) | Excellent | 1 (email/social) | Not implemented |

### Mobile Wallet UX Best Practices

1. **Deep links over QR codes on mobile** — detect mobile and show "Open in Wallet" button instead of QR
2. **WYSIWYS (What You See Is What You Sign)** — show transaction details clearly before signing
3. **Large touch targets** for approve/reject (56x56px minimum)
4. **Auto-redirect back** — use WalletConnect's mobile linking to return to dapp after signing
5. **Error recovery** — if wallet connection fails, show clear retry path, not cryptic error
6. **Network switching** — auto-prompt to switch to correct chain (Optimism for Respect tokens, Base for ZOUNZ)
7. **Persistent connection** — don't make users reconnect on every session. Store session in iron-session alongside Farcaster auth

### ZAO OS Wallet Flow

Current: Wagmi + Viem with Sign In With Ethereum (SIWE). The wallet connection is secondary to Farcaster auth (SIWF is primary). For mobile:
- Ensure WalletConnect v2 deep linking is configured correctly
- Test the full flow: mobile browser -> wallet app -> approve -> redirect back
- Consider adding Coinbase Smart Wallet (passkey-based, no app switch needed)

---

## Part 10: Haptic Feedback Web API

### API Overview

```
navigator.vibrate(200)              // Single vibration, 200ms
navigator.vibrate([100, 50, 100])   // Pattern: vibrate 100ms, pause 50ms, vibrate 100ms
navigator.vibrate(0)                // Cancel
```

### Browser Support Matrix

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome Android | Full | Reliable since Chrome 32 |
| Firefox Android | Full | Reliable |
| Samsung Internet | Full | Reliable |
| Safari iOS | None | Not supported, no timeline |
| Chrome Desktop | Partial | Some devices with haptic trackpads |
| Firefox Desktop | No | — |

### Web Haptics NPM Package

The `web-haptics` package (trending in 2026) provides:
- Cross-platform abstraction with iOS workaround (Safari 17.4+ checkbox switch hack)
- React hook: `useWebHaptics()` returns `{ trigger }`
- Configurable intensity (0-1), patterns, presets
- Feature detection via `WebHaptics.isSupported`
- Requires user activation (click/tap handler)

### ZAO OS Implementation Plan

ZAO already uses `navigator.vibrate(10)` in PersistentPlayer for swipe skip. Extend to:

| Interaction | Pattern | Priority |
|-------------|---------|----------|
| Play/pause tap | `vibrate(8)` | P1 |
| Track skip (swipe) | `vibrate(10)` | Done |
| Like/heart | `vibrate([8, 40, 8])` | P1 |
| Add to queue | `vibrate([8, 30, 8])` | P2 |
| Error feedback | `vibrate([40, 20, 40, 20, 40])` | P2 |
| Long press menu open | `vibrate(12)` | P2 |
| Expanded player open | `vibrate(6)` | P3 |
| Notification received | `vibrate([10, 50, 10, 50, 10])` | P3 |

**Important:** Always wrap in feature detection: `navigator.vibrate?.(pattern)`. Fail silently. Consider migrating to `web-haptics` package for iOS coverage.

---

## ZAO OS Mobile Audit Summary

### What's Already Good

| Feature | Implementation | Quality |
|---------|---------------|---------|
| Bottom navigation | 5 tabs in thumb zone, More menu as bottom sheet | Excellent |
| Mini player position | `bottom-14` above nav | Good |
| Swipe to skip | Touch handlers with 60px threshold | Good |
| Haptic on skip | `navigator.vibrate(10)` | Good (Android only) |
| Expanded player | motion/react spring with shared layout animation | Excellent |
| Progress ring on artwork | SVG circle with stroke-dasharray | Unique, good |
| Safe area CSS | `env(safe-area-inset-*)` in globals.css | Good |
| Safe area bottom nav | `safe-area-bottom` class on nav container | Good |
| MediaSession | All 8 actions (play, pause, next, prev, seek forward/back, seek to, stop) | Excellent |
| Wake Lock | Prevents screen dimming during playback | Good |
| PWA install prompt | iOS detection, deferred prompt | Good |
| Dark theme | Navy #0a1628 + gold #f5a623 | Consistent |

### Gaps to Address

| Gap | Severity | Effort | Priority |
|-----|----------|--------|----------|
| No swipe-up to expand mini player | Medium | Low | P1 |
| No drag-down to dismiss expanded player | Medium | Low | P1 |
| No long-press context menu on tracks | Medium | Medium | P1 |
| No bottom sheet for queue on mobile | High | Medium | P1 |
| Haptics only on swipe (not play/like/etc.) | Low | Low | P2 |
| iOS has no haptic feedback at all | Medium | Low | P2 (web-haptics pkg) |
| Touch targets some <44px (w-8, w-10) | Medium | Low | P2 |
| PersistentPlayer ignores safe area inset | Medium | Low | P2 |
| No floating pill for active Spaces room | Medium | Medium | P2 |
| No notification granularity UI | High | Medium | P2 |
| No drag-to-reorder in queue (mobile) | Low | Medium | P3 |
| No offline indicator | Low | Low | P3 |
| iOS PWA background audio broken | Critical | High | Deferred (Capacitor) |

---

## Implementation Priority Matrix

### Phase 1: Quick Wins (1-2 days)

| Task | Files to Change | Effort |
|------|----------------|--------|
| Add swipe-up gesture to expand mini player | `PersistentPlayer.tsx` | 2 hrs |
| Add drag-down gesture to dismiss expanded player | `ExpandedPlayer.tsx` | 2 hrs |
| Bump all touch targets to min 44px | Multiple music components | 2 hrs |
| Add haptic feedback to play/pause and like | `PersistentPlayer.tsx`, `LikeButton.tsx` | 1 hr |
| Fix PersistentPlayer safe area bottom offset | `PersistentPlayer.tsx` | 30 min |
| Add `overscroll-behavior: none` to player areas | `globals.css` | 15 min |

### Phase 2: Bottom Sheet & Context Menus (3-5 days)

| Task | Files to Change | Effort |
|------|----------------|--------|
| Create reusable BottomSheet component | New: `src/components/ui/BottomSheet.tsx` | 4 hrs |
| Mobile queue as bottom sheet (not sidebar) | `QueuePanel.tsx`, `MusicPage.tsx` | 4 hrs |
| Long-press context menu on track cards | `MusicQueueTrackCard.tsx`, `FarcasterTrackCard.tsx` | 6 hrs |
| Track share bottom sheet (Farcaster/Bluesky/X) | New: `src/components/music/ShareSheet.tsx` | 4 hrs |
| Playlist add via bottom sheet | `AddToPlaylistButton.tsx` | 3 hrs |

### Phase 3: Audio Rooms & Notifications (1-2 weeks)

| Task | Files to Change | Effort |
|------|----------------|--------|
| Floating "room active" pill in player area | New: `src/components/spaces/ActiveRoomPill.tsx` | 6 hrs |
| Notification preferences UI (per-category) | New: `src/components/settings/NotificationPrefs.tsx` | 8 hrs |
| Push notification deep links to context | API routes + notification handlers | 6 hrs |
| Emoji reactions in Spaces | Spaces components | 8 hrs |
| Hand-raise queue for moderators | Spaces components | 6 hrs |

### Phase 4: Advanced (Deferred)

| Task | Dependency | Effort |
|------|-----------|--------|
| Capacitor wrapper for iOS background audio | Doc 218 plan | 2-4 weeks |
| Install `web-haptics` for iOS haptic support | Package addition | 2 hrs |
| Drag-to-reorder queue on mobile | BottomSheet first | 8 hrs |
| Offline mode indicator + cached playback | Service worker work | 1 week |

---

## Comparison Table: ZAO OS vs Industry Standards

| Dimension | Industry Standard (2026) | ZAO OS Current | Gap | Priority |
|-----------|------------------------|----------------|-----|----------|
| Bottom navigation | 4-5 tabs, thumb zone | 5 tabs (4 primary + More) | None | Done |
| Mini player | Swipe skip, swipe expand | Swipe skip, tap expand | Swipe-up expand | P1 |
| Expanded player | Drag-down dismiss | Button dismiss | Drag gesture | P1 |
| Touch targets | 44-48px minimum | 32-44px (mixed) | Audit + bump | P2 |
| Bottom sheets | All secondary flows | Only "More" menu | Extend everywhere | P1 |
| Long-press menus | Standard on track cards | Not implemented | Add | P1 |
| Haptic feedback | Every primary interaction | Swipe skip only | Extend | P2 |
| iOS haptics | web-haptics package | navigator.vibrate only | Package migration | P2 |
| Safe areas | All fixed elements respect | BottomNav yes, Player partial | Fix player | P2 |
| Audio room minimize | Floating pill/bar | Not implemented | Build | P2 |
| Notification control | Per-category granular | Not built | Build preferences | P2 |
| Wallet connect mobile | Deep links, auto-redirect | WalletConnect v2 (verify) | Test flow | P2 |
| Background audio (iOS) | Native/Capacitor | PWA (stops on background) | Capacitor | Deferred |
| Offline support | Service worker caching | Not implemented | Build | P3 |
| Orientation lock | Portrait for player | Not implemented | Add | P3 |

---

## Sources

### Mobile UX & Thumb Zones
- [Mobile Navigation UX Best Practices 2026](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [Mobile App UX: Thumb Zones and Gestures](https://elaris.software/blog/mobile-ux-thumb-zones-2025/)
- [7 Mobile UX/UI Design Patterns Dominating 2026](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/)
- [Mobile-First UX Patterns Driving Engagement 2026](https://tensorblue.com/blog/mobile-first-ux-patterns-driving-engagement-design-strategies-for-2026)
- [Mobile-First UX 2026: Thumb-Driven Design Wins](https://www.revivalpixel.com/blog/mobile-first-ux-2026-thumb-driven-design-wins)
- [The Thumb Zone: Designing For Mobile Users (Smashing Magazine)](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)

### Spotify & Music Player Patterns
- [Spotify Android Gesture Friction](https://www.findarticles.com/spotify-android-app-draws-ire-for-rigid-gestures/)
- [Evolution of Spotify's Design](https://rausr.com/blog/the-evolution-of-spotify-design/)
- [Apple Music iOS 26.1 Swipe Gesture](https://applemagazine.com/swipe-gesture-in-apple-music-miniplayer-ios-26/)
- [iOS 26.1 Apple Music Gesture (9to5Mac)](https://9to5mac.com/2025/11/04/ios-26-1-gave-apple-music-convenient-new-trick/)

### Audio Room UX
- [Social Audio Apps and Clubhouse Alternatives 2026](https://gauravtiwari.org/best-apps-like-clubhouse-for-android-and-ios/)
- [Clubhouse vs Twitter Spaces](https://www.clearvoice.com/resources/clubhouse-vs-twitter-spaces/)
- [7 Social Audio Room Apps](https://www.bandwagon.asia/articles/7-social-audio-room-apps-guide-clubhouse-spotify-greenroom-twitter-spaces-discord-stages-spoon-radio-stationhead-slack-huddles-guide-what-you-need-to-know)

### Mobile-First Best Practices
- [Top 10 Mobile App Design Best Practices 2026](https://uiuxdesigning.com/mobile-app-design-best-practices/)
- [Mobile First Design UX Strategy 2026](https://wpbrigade.com/mobile-first-design-strategy/)
- [Mobile-First UX Design Best Practices 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026)

### PWA iOS Limitations
- [PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Progressive Web Apps on iOS Complete Guide 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Safari PWA Limitations on iOS](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/)
- [PWA Push Notifications iOS 2026](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en)

### Live Streaming UI
- [Twitch Mobile Streaming Update March 2026](https://streamer.guide/blog/twitch-mobile-streaming-update-march-2026)
- [Twitch vs YouTube vs Kick vs TikTok Live 2026](https://www.streamups.com/blog/platform-comparison-2026)
- [Twitch Mobile Updates 2026 (Streams Charts)](https://streamscharts.com/news/twitch-mobile-livestreaming-updates-explained)

### Notifications
- [Notification UX Design Guidelines (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/)
- [Push Notification Best Practices 2026](https://appbot.co/blog/app-push-notifications-2026-best-practices/)
- [OneSignal Push Notification Best Practices 2026](https://onesignal.com/blog/onesignal-guide-push-notification-best-practices-2026/)

### Web3 Wallet UX
- [WalletConnect Mobile Linking Docs](https://alpha-docs.walletconnect.com/web3wallet/mobileLinking)
- [Web3 on Mobile: WalletConnect and In-App Browsers](https://medium.com/@ancilartech/web3-on-mobile-bridging-the-gap-with-walletconnect-and-in-app-browsers-3c86cba2f942)
- [Wagmi Connect Wallet Guide](https://wagmi.sh/react/guides/connect-wallet)

### Haptic Feedback
- [Vibration API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Web Haptics NPM Package](https://medium.com/@springmusk/web-haptics-the-npm-package-everyones-adding-for-haptic-feedback-4c774f10caaa)
- [Haptic Feedback for Web Apps (OpenReplay)](https://blog.openreplay.com/haptic-feedback-for-web-apps-with-the-vibration-api/)

---

## Related ZAO OS Research

| Doc | Topic | Relevance |
|-----|-------|-----------|
| [189](../189-mobile-player-optimization/) | Mobile Player Optimization | Detailed mobile player gap analysis (many items now shipped) |
| [211](../211-music-player-ui-best-practices/) | Music Player UI Best Practices | Platform comparison, a11y, animation patterns |
| [218](../218-mobile-app-strategy-pwa-native/) | Mobile App Strategy: PWA to Native | Capacitor recommendation for iOS background audio |
| [126](../126-music-player-gap-analysis/) | Music Player Gap Analysis | Original competitive analysis |
| [167](../167-audio-apis-music-players-displays/) | Audio APIs & Players | iOS PWA audio limits, EQ patterns |
| [035](../035-notifications-complete-guide/) | Notifications Complete Guide | Notification system architecture |
