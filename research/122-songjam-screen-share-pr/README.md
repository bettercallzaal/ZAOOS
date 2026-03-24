# 122 — SongJam Screen Share PR: Stream Video SDK Integration

> **Status:** Research complete
> **Date:** March 24, 2026
> **Goal:** Add screen sharing to SongJam's `/spaces` audio rooms, contribute as a PR to SongjamSpace/songjam-site

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SDK** | Stream Video React SDK (`@stream-io/video-react-sdk`) — already in SongJam's stack, NOT 100ms |
| **Method** | `call.screenShare.toggle()` / `useScreenShareState()` hook — 5 lines to start/stop |
| **UI** | New `MyScreenShareButton.tsx` in `src/app/spaces/` following existing button pattern |
| **Display** | New `ScreenShareView.tsx` component above participants panel when someone shares |
| **Permissions** | Requires `screenshare` capability on the Stream call type (SongJam must enable in their Stream dashboard) |
| **Daily.co** | NOT NEEDED — SongJam's `/spaces` already uses Stream.io which has built-in screen share support |
| **PR scope** | 3 new files + 2 modified files, ~200 lines of code |

## Critical Finding: SongJam Has Two Audio Systems

SongJam runs **two separate audio/video SDKs** for different features:

| Feature | SDK | Route |
|---------|-----|-------|
| **LiveAudioRoom** (legacy) | 100ms (`@100mslive/react-sdk`) | Used in `/zabal`, `/adam`, etc. via `LiveAudioRoom.tsx` component |
| **Spaces** (new) | Stream.io (`@stream-io/video-react-sdk`) | Used in `/spaces/[id]` route |

The `/spaces` route is the newer, cleaner implementation. Screen share should target THIS system, not the legacy 100ms LiveAudioRoom.

## SongJam /spaces Architecture (Stream.io)

### Current Components
```
src/app/spaces/
├── [id]/                        # Dynamic route per space
├── HostRoomModal.tsx            # Room creation dialog
├── MyControlsPanel.tsx          # Container: MyMicButton + MyLiveButton
├── MyDiscriptionPanel.tsx       # Room info header
├── MyLiveButton.tsx             # Go live / end live toggle
├── MyMicButton.tsx              # Mic mute/unmute + permission request
├── MyParticipant.tsx            # Avatar + speaking indicator
├── MyParticipantsPanel.tsx      # Grid of speakers + listeners
├── MyPermissionRequestsPanel.tsx # Speaker request approvals
├── MyUILayout.tsx               # 3-panel layout
├── RoomList.tsx                 # Available rooms
└── page.tsx                     # Spaces landing
```

### Stream.io Hooks Pattern (from MyMicButton.tsx)
```tsx
import { useCallStateHooks, useCall, OwnCapability } from '@stream-io/video-react-sdk';

const { useMicrophoneState, useHasPermissions } = useCallStateHooks();
const { microphone, isMute } = useMicrophoneState();
const hasPermission = useHasPermissions(OwnCapability.SEND_AUDIO);
const call = useCall();

// Toggle: await microphone.enable() / microphone.disable()
// Request permission: await call?.requestPermissions({ permissions: [OwnCapability.SEND_AUDIO] })
```

## Screen Share Implementation Plan (PR Scope)

### File 1: `src/app/spaces/MyScreenShareButton.tsx` (NEW — ~50 lines)

```tsx
'use client';

import { useCallStateHooks, useCall, OwnCapability } from '@stream-io/video-react-sdk';
import { useState } from 'react';

export const MyScreenShareButton = () => {
  const { useScreenShareState, useHasPermissions } = useCallStateHooks();
  const { screenShare, isMute: isScreenShareOff } = useScreenShareState();
  const hasPermission = useHasPermissions(OwnCapability.SCREENSHARE);
  const call = useCall();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleClick = async () => {
    if (hasPermission) {
      await screenShare.toggle();
    } else {
      if (isRequesting) return;
      setIsRequesting(true);
      try {
        await call?.requestPermissions({ permissions: [OwnCapability.SCREENSHARE] });
      } catch (err) {
        console.error('Failed to request screen share permission', err);
        setIsRequesting(false);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRequesting && !hasPermission}
      className={`
        flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200
        ${!isScreenShareOff
          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
          : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
        }
      `}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <span>{!isScreenShareOff ? 'Stop Sharing' : 'Share Screen'}</span>
    </button>
  );
};
```

### File 2: `src/app/spaces/ScreenShareView.tsx` (NEW — ~60 lines)

```tsx
'use client';

import { useCallStateHooks, ParticipantView } from '@stream-io/video-react-sdk';

export const ScreenShareView = () => {
  const { useCallState } = useCallStateHooks();
  // Find participant who is screen sharing
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const screenSharer = participants.find(
    (p) => p.publishedTracks.includes('screenShareTrack')
          || p.screenShareStream
  );

  if (!screenSharer) return null;

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-sm text-blue-400 font-medium">
            {screenSharer.name} is sharing their screen
          </span>
        </div>
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <ParticipantView
            participant={screenSharer}
            trackType="screenShareTrack"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
```

### File 3: Modify `src/app/spaces/MyControlsPanel.tsx`

Add screen share button to the controls:

```tsx
'use client';

import { MyLiveButton } from "./MyLiveButton";
import { MyMicButton } from "./MyMicButton";
import { MyScreenShareButton } from "./MyScreenShareButton";

export const MyControlsPanel = () => {
  return (
    <div className="px-6 py-5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4">
          <MyMicButton />
          <MyScreenShareButton />
          <MyLiveButton />
        </div>
      </div>
    </div>
  );
};
```

### File 4: Modify `src/app/spaces/MyUILayout.tsx`

Add screen share view above participants:

```tsx
'use client';

import { MyControlsPanel } from "./MyControlsPanel";
import { MyDescriptionPanel } from "./MyDiscriptionPanel";
import { MyParticipantsPanel } from "./MyParticipantsPanel";
import { ScreenShareView } from "./ScreenShareView";

export const MyUILayout = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <MyDescriptionPanel />
      </div>

      {/* Screen share view — only renders when someone is sharing */}
      <ScreenShareView />

      <div className="flex-1 overflow-y-auto">
        <MyParticipantsPanel />
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-xl">
        <MyControlsPanel />
      </div>
    </div>
  );
};
```

## Stream Dashboard Requirement

The SongJam team MUST enable the `screenshare` capability on their Stream call type in the [Stream Dashboard](https://dashboard.getstream.io/). Without this, `useHasPermissions(OwnCapability.SCREENSHARE)` will always return false.

Specifically:
1. Go to Stream Dashboard → Video & Audio → Call Types
2. Find the call type used for spaces (likely `audio_room` or `livestream`)
3. Under Permissions, enable `screenshare` for `host` and `speaker` roles

## Why NOT Daily.co

The original request mentioned Daily, but it's not needed:

| Factor | Daily.co | Stream.io (already in SongJam) |
|--------|----------|-------------------------------|
| Already installed | No — would add new dependency | Yes — `@stream-io/video-react-sdk@1.27.2` |
| Screen share API | `callObject.startScreenShare()` | `call.screenShare.toggle()` |
| Integration effort | Major — new auth, new rooms, new UI | Minimal — follows existing hook patterns |
| Cost | Separate billing | Already covered by SongJam's Stream plan |
| Participant sync | Separate system | Same participants already in the room |

**Using Daily would mean running THREE audio/video SDKs** (100ms + Stream + Daily). Using Stream's built-in screen share requires ZERO new dependencies.

## Screen Share Settings (Optional Optimization)

For music producers sharing DAWs or artists sharing visual content:

```tsx
// Before enabling screen share:
call.screenShare.setSettings({
  maxFramerate: 30,          // Higher for visual content
  maxBitrate: 2500000,       // 2.5 Mbps for crisp DAW view
  contentHint: 'detail',     // Optimize for static content (DAW, slides)
});

// Enable screen share audio (for DAW/music sharing):
call.screenShare.enableScreenShareAudio();
await call.screenShare.enable();
```

**Note:** Screen share audio capture varies by OS:
- **Windows:** Captures system audio
- **macOS/Linux:** Captures browser tab audio only

## PR Strategy

### Fork + Branch
```bash
gh repo fork SongjamSpace/songjam-site --clone
cd songjam-site
git checkout -b feat/screen-share-spaces
```

### Files to Create
1. `src/app/spaces/MyScreenShareButton.tsx`
2. `src/app/spaces/ScreenShareView.tsx`

### Files to Modify
1. `src/app/spaces/MyControlsPanel.tsx` — add MyScreenShareButton import + JSX
2. `src/app/spaces/MyUILayout.tsx` — add ScreenShareView import + JSX

### PR Description Template
```
## Summary
Add screen sharing to /spaces audio rooms using Stream Video SDK's built-in screenshare capability.

## Changes
- New: MyScreenShareButton — toggle screen share with permission request flow
- New: ScreenShareView — displays shared screen above participants panel
- Modified: MyControlsPanel — added screen share button between mic and live
- Modified: MyUILayout — added ScreenShareView slot

## Requirements
- Enable `screenshare` capability on the Stream call type in Stream Dashboard
- Desktop browsers only (mobile does not support getDisplayMedia)

## Use Cases
- Music producers sharing DAW sessions during listening parties
- Visual artists sharing screens during creative sessions
- Presenters sharing slides during community calls

## Screenshots
[Add before/after of controls panel and screen share view]
```

## Cross-Reference with ZAO OS

| ZAO OS File | Relevance |
|-------------|-----------|
| `src/app/(auth)/spaces/page.tsx` | Embeds songjam.space/zabal — screen share will be visible in ZAO OS iframe automatically |
| `src/middleware.ts` | CSP already allows `www.songjam.space` in `frame-src` |
| `research/119-songjam-audio-spaces-embed/` | Previous research on embedding SongJam |
| `research/43-webrtc-audio-rooms-streaming/` | Original WebRTC research — this PR adds video/screen to audio-only rooms |

## Sources

- [Stream Video React SDK — Screen Sharing](https://getstream.io/video/docs/react/guides/screensharing/)
- [SongjamSpace/songjam-site](https://github.com/SongjamSpace/songjam-site) — Main repo
- [Stream Dashboard](https://dashboard.getstream.io/) — Call type configuration
- [100ms Screen Share docs](https://www.100ms.live/docs/javascript/v2/how-to-guides/set-up-video-conferencing/screenshare) — For reference (not used)
- [Daily.co startScreenShare()](https://docs.daily.co/reference/daily-js/instance-methods/start-screen-share) — For reference (not needed)
