# 119 — SongJam Audio Spaces Embed for ZAO OS

> **Status:** Research complete
> **Date:** March 23, 2026
> **Goal:** Embed SongJam's `/zabal` audio spaces as a bigger iframe in ZAO OS for live audio rooms

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Embed method** | Dedicated full-page SongJam view (not collapsed accordion) — iframe at near-fullscreen height |
| **URL** | `https://songjam.space/zabal` — ZABAL Empire page with leaderboard + audio room access |
| **iframe permissions** | MUST add `microphone`, `camera` to `allow` attribute — current iframe only allows `clipboard-write` |
| **Sandbox** | Keep current sandbox but consider adding `allow-modals` for 100ms device preview |
| **Navigation** | Add as a dedicated nav item or prominent card in Ecosystem, not buried in accordion |

## What SongJam /zabal Actually Is

The `/zabal` route on songjam.space is a **community empire page** (not a standalone audio room). It includes:

- **$ZABAL Empire leaderboard** — 24H/7D/ALL timeframes with rank, singer, staking multiplier, empire multiplier, total points
- **Audio room access** — `audioRoomEnabled: true` flag on the MindshareLeaderboard component
- **Staking multiplier** — requires 250,000 $ZABAL minimum stake
- **Space points** — earned by participating in live audio spaces
- **Login to Host** — button to start hosting a live space

The page is a Next.js 15 server-rendered page that fetches audio discussion counts and user mention counts from Firestore.

## SongJam Audio Spaces Architecture (from GitHub)

### Tech Stack (songjam-site)
- **Next.js 15.5.7** + React 19
- **@100mslive/react-sdk 0.10.39** — WebRTC audio rooms
- **@100mslive/hms-video-store 0.12.39** — state management for rooms
- **@stream-io/video-react-sdk 1.27.2** — video calls
- **@elevenlabs/react 0.11.0** — voice synthesis
- **Firebase 12.6.0** — room state, participants, Firestore
- **@privy-io/react-auth 3.3.0** — authentication
- **@supabase/supabase-js 2.55.0** — data layer
- **@neynar/react 1.2.22** — Farcaster integration (same as ZAO OS)
- **Solana stack** — $SANG token staking/rewards

### LiveAudioRoom Component
- Accepts `projectId: string` prop (identifies the space/campaign)
- Creates rooms via `createMSRoom()` → stores state in Firestore
- Joins rooms via `hmsActions.join()` with auth tokens from `/api/100ms/token`
- Renders: animated participant bubbles, MiniSpaceBanner controls, captions, reactions
- Roles: host, speaker, listener with request-to-speak workflow
- DJ playlist management with audio streaming
- Real-time transcription/captions
- Points/reward system per-second participation tracking

### Spaces Route Structure
```
src/app/spaces/
├── [id]/                    # Dynamic route per space
├── HostRoomModal.tsx        # Room creation dialog
├── MyControlsPanel.tsx      # Mic, live, controls
├── MyDiscriptionPanel.tsx   # Room info header
├── MyLiveButton.tsx         # Go-live toggle
├── MyMicButton.tsx          # Mute/unmute
├── MyParticipant.tsx        # Single participant card
├── MyParticipantsPanel.tsx  # Participant list
├── MyPermissionRequestsPanel.tsx  # Speaker requests
├── MyUILayout.tsx           # 3-panel layout (info/participants/controls)
├── RoomList.tsx             # Available rooms
└── page.tsx                 # Spaces landing
```

### UI Layout Pattern
3-section vertical layout:
1. **Top:** Room description/info (fixed)
2. **Middle:** Participants panel (scrollable, animated bubbles)
3. **Bottom:** Controls — mic, live, hand raise, reactions (fixed)

## What Needs to Change in ZAO OS

### Current State
The EcosystemPanel (`src/components/ecosystem/EcosystemPanel.tsx`) already embeds SongJam at `https://songjam.space/zabal` but:
- It's in a **collapsible accordion** — users must tap to expand
- The iframe is `70vh` height which is decent but buried under other partners
- **Missing `allow="microphone; camera"`** — audio spaces won't work without mic permission
- sandbox has `allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation` but no `allow-modals`

### Required Changes

#### 1. Fix iframe permissions (critical for audio)
```tsx
// Current (broken for audio):
allow="clipboard-write"

// Required:
allow="clipboard-write; microphone; camera; autoplay"
```

Without `microphone` permission, users CANNOT join audio spaces from within ZAO OS.

#### 2. Add sandbox permissions
```tsx
// Add allow-modals for 100ms device preview dialog:
sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation allow-modals"
```

#### 3. Make SongJam bigger / more prominent
Options (pick one):
- **Option A:** Dedicated `/spaces` or `/songjam` route — full-page iframe, `calc(100dvh - 120px)` height
- **Option B:** Make SongJam the first/featured item in Ecosystem with auto-expand and larger iframe
- **Option C:** Add SongJam to the main bottom nav as its own pillar

#### 4. Consider X-Frame-Options
SongJam must allow iframe embedding from zaoos.com. If they set `X-Frame-Options: DENY` or restrictive CSP, the iframe will be blocked. Currently it works (tested via existing EcosystemPanel), so this is fine.

## Cross-Reference with Existing Research

| Doc | Relevance |
|-----|-----------|
| **79 (SongJam Music Player)** | Previous research focused on their Electron music player (irrelevant). This doc covers their actual product: live audio spaces |
| **43 (WebRTC Audio Rooms)** | Evaluated building our own with LiveKit/Daily. SongJam iframe is faster to ship — use their product instead of building |
| **109 (Synchronized Listening)** | Our useListeningRoom hook uses Supabase Realtime for DJ sync. SongJam spaces are different — multi-speaker voice rooms, not synchronized playback |
| **82 (Music Redesign Phase 4)** | Phase 4 planned "Listening Rooms" via 100ms SDK. SongJam already built this — iframe it instead of building from scratch |

## Implementation Recommendation

**USE the SongJam iframe** for live audio spaces instead of building with 100ms SDK directly. Reasons:

1. **Already built** — SongJam has the full room lifecycle: create, join, speak, moderate, reward
2. **ZABAL integration exists** — `/zabal` page is specifically built for the ZAO community
3. **Points system** — per-second participation tracking aligns with ZAO's Respect model
4. **Zero maintenance** — SongJam team maintains the infrastructure, 100ms billing, etc.
5. **Ship today** — just fix the iframe permissions and make it bigger

**Future:** If ZAO OS needs deeper integration (e.g., Respect-weighted speaker priority, cast-from-space, in-app notifications for live spaces), then consider building native 100ms integration using SongJam's patterns as reference.

## Sources

- [SongjamSpace/songjam-site](https://github.com/SongjamSpace/songjam-site) — Main repo, Next.js 15 + 100ms + Firebase
- [songjam.space/zabal](https://www.songjam.space/zabal) — ZABAL Empire page (live)
- [SongjamSpace GitHub Org](https://github.com/SongjamSpace) — 80+ repos
- [100ms React SDK docs](https://www.100ms.live/docs/javascript/v2/quickstart/react-quickstart)
- ZAO OS code: `src/components/ecosystem/EcosystemPanel.tsx` (current iframe embed)
- ZAO OS research: Doc 79, Doc 43, Doc 82, Doc 109
