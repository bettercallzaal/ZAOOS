# Spaces Upgrade Phase 1 — Voice Channels + Stages + DJ Mode + Minutes Tracking

> **Date:** March 28, 2026
> **Status:** Design approved
> **Scope:** Phase 1 of 3 (Phase 2: Restreaming, Phase 3: Producer/OBS controls)

---

## Overview

Transform /spaces from a flat room list into a Discord-inspired experience with two room types (persistent voice channels + on-demand stages), fix DJ mode with in-room music browsing, add screen share controls, and track participation minutes with a leaderboard API.

---

## Room Types

### Voice Channels (Persistent)

Always-visible rooms configured in `community.config.ts`. Casual drop-in, everyone can talk.

| Channel | Emoji | Purpose |
|---------|-------|---------|
| General Hangout | 💬 | Casual conversation |
| Fractal Call | 📞 | Monday 6pm EST weekly fractal |
| Music Lounge | 🎵 | Always-on listening room / DJ |
| Tech Talk | 💻 | Technical discussions |
| Coworking | 🏢 | Silent cowork with ambient presence |

**Behavior:**
- Always appear in sidebar/channel strip regardless of activity
- Anyone can join and immediately talk (no permission request)
- Anyone can screen share
- Anyone can DJ (play music)
- Show active status: green border + avatar stack + "3 in" badge when occupied
- Show inactive status: dimmed at 50% opacity + "last active 2d ago" timestamp
- Default layout: Speakers-First (B) — circle avatars, conversation-focused
- Persist in Supabase `rooms` table with `persistent: true` flag
- Never auto-delete when empty

**Config in `community.config.ts`:**
```typescript
voiceChannels: [
  { id: 'general-hangout', name: 'General Hangout', emoji: '💬', description: 'Casual conversation' },
  { id: 'fractal-call', name: 'Fractal Call', emoji: '📞', description: 'Monday 6pm EST weekly fractal' },
  { id: 'music-lounge', name: 'Music Lounge', emoji: '🎵', description: 'Always-on listening room' },
  { id: 'tech-talk', name: 'Tech Talk', emoji: '💻', description: 'Technical discussions' },
  { id: 'coworking', name: 'Coworking', emoji: '🏢', description: 'Silent cowork' },
],
```

### Stages (On-Demand)

Created by any authenticated member. Structured, host-controlled events that disappear when ended.

**Behavior:**
- Host + invited speakers can talk
- Audience muted by default, must raise hand to request speaking
- Host approves/denies speaker requests (existing PermissionRequests component)
- Only host can screen share by default (can grant permission to others)
- DJ mode controlled by host only
- Host has "Go Live" + broadcast controls
- Default layout: Content-First (A) — big screen share / video, speaker strip below
- Host can toggle layout between Content-First (A) and Speakers-First (B) via a layout switch button in controls
- Auto-marked as ended when host leaves (with confirmation dialog)
- Cleaned up from `rooms` table after 24h of inactivity

**Creation flow (updated HostRoomModal):**
- Remove provider selector (Stream.io only for Stages — 100ms stays for legacy rooms)
- Add room type indicator: "Stage" (the only on-demand type)
- Keep theme selector (default, music, podcast, ama, chill)
- Keep title + description inputs
- Add optional "Scheduled for" datetime picker (future: for announcing upcoming stages)

---

## Spaces Page Layout

### Desktop (md+ breakpoint)

```
┌──────────────────────────────────────────────────┐
│  SPACES                                    [+ Create Stage]  │
├─────────────┬────────────────────────────────────┤
│  VOICE      │  LIVE STAGES                       │
│  CHANNELS   │                                    │
│             │  ┌──────────────────────────────┐  │
│  🟢 Music   │  │ Dan's Friday DJ Set  ● LIVE  │  │
│    Lounge   │  │ 12 watching • 🎵 Music       │  │
│    ○○○ 3    │  │ [Join Stage →]               │  │
│             │  └──────────────────────────────┘  │
│  🟢 Hangout │                                    │
│    ○ 1      │  ┌──────────────────────────────┐  │
│             │  │ ZAO Weekly AMA  ● LIVE       │  │
│  ⚫ Fractal  │  │ 8 watching • ❓ AMA          │  │
│    2d ago   │  │ [Join Stage →]               │  │
│             │  └──────────────────────────────┘  │
│  ⚫ Tech     │                                    │
│    5h ago   │  No other stages right now.        │
│             │                                    │
│  ⚫ Cowork   │                                    │
│    1d ago   │                                    │
│─────────────│                                    │
│  🎧 Connected│                                    │
│  Music Lounge│                                    │
│  12m  🔇 📴 │                                    │
└─────────────┴────────────────────────────────────┘
```

- Sidebar: ~220px fixed width
- Active channels: highlighted background, green left border, avatar stack, count badge
- Inactive channels: 50% opacity, "last active X ago" timestamp
- Connected status: green card at bottom with room name, duration, mute/leave controls
- Main area: live stage cards with theme badge, participant count, speaker avatars, join button
- "+ Create Stage" button top-right

### Mobile (< md breakpoint)

```
┌────────────────────────────────────┐
│ [🟢 Music 3] [🟢 Hangout 1] [⚫ Fractal] [⚫ Tech] [⚫ Cowork]  ← horizontal scroll
├────────────────────────────────────┤
│ 🎧 Music Lounge • 12m    🔇 📴   │  ← connected banner (if in a room)
├────────────────────────────────────┤
│ LIVE STAGES           [+ Create]  │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ Dan's DJ Set      ● LIVE   │   │
│ │ 12 watching • 🎵 Music     │   │
│ └─────────────────────────────┘   │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ ZAO Weekly AMA    ● LIVE   │   │
│ │ 8 watching • ❓ AMA        │   │
│ └─────────────────────────────┘   │
└────────────────────────────────────┘
```

- Channel strip: horizontal scroll, pill-shaped items
- Active pills: green border, count badge
- Inactive pills: dimmed, no badge (tap to see "last active" tooltip)
- Connected banner: slim green bar with room name + duration + mute/leave
- Stage cards: compact, stacked vertically

---

## In-Room Layouts

### Layout A: Content-First (Default for Stages)

```
┌──────────────────────────────────────┐
│                                      │
│     Screen Share / Speaker Video     │
│              (main area)             │
│                                      │
│  ┌──────┐              ● LIVE  12   │
│  │ Host │              watching     │
│  │ PiP  │                           │
│  └──────┘                           │
├──────────────────────────────────────┤
│ ○Dan🎤  ○Zaal🎤  ○Tadas   🎵 Now Playing: Solar System │
├──────────────────────────────────────┤
│    🎤   📹   🖥️   🎵   📡   📴    │  ← controls bar
└──────────────────────────────────────┘
```

- Main area: screen share when active, or active speaker video, or room graphic when no video
- PiP: host camera overlay in bottom-left corner
- Speaker strip: horizontal row of avatar circles + names, speaking indicator (green border pulse)
- Now Playing mini: compact track info in speaker strip (right-aligned)
- Controls bar: mic, camera, screen share, music (opens sidebar), broadcast, leave

### Layout B: Speakers-First (Default for Voice Channels, toggleable on Stages)

```
┌──────────────────────────────────────┐
│  Dan's Friday DJ Set        ● LIVE  │
│  12 listening • 🎵 Music            │
├──────────────────────────────────────┤
│                                      │
│    ┌──────┐  ┌──────┐               │
│    │ Dan  │  │ Zaal │               │
│    │  👑  │  │      │               │
│    └──────┘  └──────┘               │
│    Speaking   Speaking               │
│                                      │
│    ┌──────┐  ┌──────┐               │
│    │Tadas │  │Sarah │               │
│    └──────┘  └──────┘               │
│    Listening  Listening              │
│                                      │
├──────────────────────────────────────┤
│ 🎵 Solar System — Sub Focus  ▶ ━━━━ │  ← now playing bar
├──────────────────────────────────────┤
│    🎤   🖥️   🎵   ✋   📡   📴    │  ← controls bar
└──────────────────────────────────────┘
```

- Room header: title, live status, listener count, theme badge
- Speaker grid: large avatar circles with speaking/listening status, host crown badge
- Now playing bar: track art, title, artist, progress bar, play/pause
- Controls bar: mic, screen share, music, raise hand (audience), broadcast (host), leave

### Layout Toggle

Host sees a toggle button in the controls bar: `[📐]` — switches between A and B. Preference saved per-room in Supabase. Voice channels force layout B (no toggle).

---

## DJ Mode Fix

**Problem:** "Play a track from the music tab to start DJing" shows in RoomMusicPanel but there's no way to browse music from inside the room.

**Solution:** The 🎵 button in the controls bar opens the MusicSidebar alongside the room.

### Desktop
- MusicSidebar slides in from the right (same component already used in PersistentPlayerWithRadio)
- Room content shrinks to accommodate (flex layout)
- Full music browsing: search, Audius discover, favorites, queue, playlists
- Selecting a track adds it to the room queue
- Closing the sidebar returns to full room view

### Mobile
- 🎵 button opens MusicSidebar as a full-screen overlay (modal)
- Back button / swipe down to dismiss
- Selected track immediately plays in the room

### Implementation
- Reuse existing `MusicSidebar` component (802 lines, already dynamically imported)
- Add `showMusicSidebar` state to RoomView
- Pass `onTrackSelect` callback that bridges to the room's music player via `PlayerBroadcastBridge`
- No new music components needed

---

## Screen Share

**Already built:** `ScreenShareButton.tsx` (70 lines) exists in ControlsPanel, calls `call.screenShare.toggle()`.

**What's needed:**
- Voice channels: button visible for all authenticated users
- Stages: button visible for host only (or users host grants permission to)
- When screen share is active, Layout A automatically activates (switches from B if needed)
- When screen share stops, layout reverts to previous preference
- ParticipantsPanel already checks `hasScreenShare()` — just needs the conditional layout switching

---

## Minutes Tracking + Leaderboard API

### Database Table: `space_sessions`

```sql
CREATE TABLE space_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT NOT NULL,
  room_id UUID NOT NULL,
  room_name TEXT,
  room_type TEXT CHECK (room_type IN ('voice_channel', 'stage')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(left_at, now()) - joined_at))::INTEGER
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_space_sessions_fid ON space_sessions(fid);
CREATE INDEX idx_space_sessions_room ON space_sessions(room_id);
CREATE INDEX idx_space_sessions_joined ON space_sessions(joined_at DESC);
```

### Tracking Logic

- **On join:** Insert row with `fid`, `room_id`, `room_name`, `room_type`, `joined_at`
- **On leave:** Update row with `left_at = now()`
- **On disconnect/crash:** Cron job or middleware cleans up stale sessions (joined > 4h ago with no left_at)
- **Duration:** Computed column, always accurate

### API: GET `/api/spaces/leaderboard`

```typescript
// Query params: ?period=week|month|all&limit=20
// Response:
{
  leaderboard: [
    { fid: 12345, username: "dan", totalMinutes: 245, sessions: 12, favoriteRoom: "Music Lounge" },
    { fid: 67890, username: "zaal", totalMinutes: 189, sessions: 8, favoriteRoom: "General Hangout" },
    // ...
  ],
  period: "week",
  totalCommunityMinutes: 1420
}
```

**Public endpoint** — no auth required. SongJam can poll this to display ZAO listener rankings.

### API: GET `/api/spaces/stats`

```typescript
// Personal stats for the authenticated user
{
  totalMinutes: 189,
  totalSessions: 8,
  currentStreak: 3,  // consecutive days with at least 1 session
  favoriteRoom: "Music Lounge",
  thisWeek: 45,
  lastWeek: 62
}
```

---

## Permission Model Summary

| Capability | Voice Channel | Stage (Audience) | Stage (Speaker) | Stage (Host) |
|------------|:---:|:---:|:---:|:---:|
| Join | ✅ | ✅ | ✅ | ✅ |
| Talk | ✅ | ❌ | ✅ | ✅ |
| Raise hand | N/A | ✅ | N/A | N/A |
| Approve speakers | N/A | N/A | N/A | ✅ |
| Screen share | ✅ | ❌ | By permission | ✅ |
| DJ / play music | ✅ | ❌ | By permission | ✅ |
| Go live | N/A | N/A | N/A | ✅ |
| Broadcast | N/A | N/A | N/A | ✅ |
| Toggle layout | N/A | N/A | N/A | ✅ |
| End room | N/A | N/A | N/A | ✅ |

---

## Files to Create / Modify

### New Files
| File | Purpose |
|------|---------|
| `src/components/spaces/ChannelSidebar.tsx` | Desktop sidebar with voice channels + connected status |
| `src/components/spaces/ChannelStrip.tsx` | Mobile horizontal pill strip |
| `src/components/spaces/ConnectedBanner.tsx` | Slim green banner showing current room + controls |
| `src/components/spaces/StageCard.tsx` | Live stage card (replaces/extends RoomCard for stages) |
| `src/components/spaces/LayoutToggle.tsx` | A/B layout switch button for host |
| `src/components/spaces/SpeakersGrid.tsx` | Layout B speaker circle grid |
| `src/components/spaces/ContentView.tsx` | Layout A main content area (screen share / video) |
| `src/app/api/spaces/leaderboard/route.ts` | Public leaderboard endpoint |
| `src/app/api/spaces/stats/route.ts` | Personal stats endpoint |
| `src/app/api/spaces/session/route.ts` | POST join / PATCH leave session tracking |
| `scripts/sql/space-sessions.sql` | Table creation SQL |

### Modified Files
| File | Changes |
|------|---------|
| `community.config.ts` | Add `voiceChannels` config array |
| `src/components/spaces/HostRoomModal.tsx` | Remove provider selector, add Stage type indicator |
| `src/components/spaces/RoomView.tsx` | Add layout toggle state, music sidebar integration, layout A/B switching |
| `src/components/spaces/ControlsPanel.tsx` | Add music button (🎵), layout toggle (📐), conditional permissions |
| `src/components/spaces/RoomList.tsx` | Split into voice channels section + stages section |
| `src/components/spaces/RoomCard.tsx` | Add active/inactive status display for persistent channels |
| `src/components/spaces/RoomMusicPanel.tsx` | Wire to MusicSidebar open/close |
| `src/app/spaces/page.tsx` | New layout with ChannelSidebar + stage list |
| `src/app/spaces/SpacesLayoutClient.tsx` | Pass channel context |
| `src/app/spaces/[id]/page.tsx` | Add session tracking on join/leave |

---

## Database Changes

1. **`rooms` table** — Add columns:
   - `persistent BOOLEAN DEFAULT false` — marks voice channels
   - `channel_id TEXT` — links to community.config.ts channel ID
   - `room_type TEXT DEFAULT 'stage'` — 'voice_channel' or 'stage'
   - `layout_preference TEXT DEFAULT 'content-first'` — 'content-first' or 'speakers-first'
   - `last_active_at TIMESTAMPTZ` — updated on any join/leave, used for "last active X ago"

2. **`space_sessions` table** — New table (see Minutes Tracking section above)

---

## What's NOT in Phase 1

- Restreaming (wiring SFU → Livepeer RTMP) — Phase 2
- Producer/OBS controls (scene switching, overlays, picture-in-picture control) — Phase 3
- Scheduled stages with calendar integration — future
- Chat/text inside rooms — future
- Recording/playback of past stages — future
- SongJam iframe embed in rooms — future

---

## Success Criteria

1. Voice channels appear on /spaces with correct active/inactive status
2. Creating a Stage works with updated HostRoomModal (no provider selector)
3. Joining a voice channel gives everyone mic + screen share + DJ permissions
4. Joining a Stage as audience keeps you muted, raise hand works
5. 🎵 button opens MusicSidebar inside the room (desktop: side panel, mobile: overlay)
6. Host can toggle between Layout A and B
7. Screen share activates Layout A automatically
8. Minutes tracking logs join/leave to `space_sessions`
9. `/api/spaces/leaderboard` returns correct rankings
10. Mobile layout is usable (pill strip, connected banner, compact stage cards)
