# Unified Music Controls — Design Spec

> **Date:** March 23, 2026
> **Status:** Approved
> **Goal:** Single persistent music control surface across all pages with one-tap radio start

---

## 1. Problem

Music controls are scattered across 5 different surfaces:
- RadioButton in ChatRoom header (compact icon)
- MusicSidebar right panel (chat-only)
- GlobalPlayer inside ChatRoom (full player)
- PersistentPlayer bottom bar (all pages except chat)
- NowPlayingHero on home page

Radio requires 2+ taps (open sidebar, click radio card). The music note button in chat header just toggles a sidebar — doesn't play anything. Navigating to chat hides the PersistentPlayer, replacing it with a completely different player (GlobalPlayer). Inconsistent and confusing.

## 2. Solution

**PersistentPlayer becomes THE music control, visible on every page including chat.** MusicSidebar becomes a global slide-out accessible from any page. All other player surfaces are removed.

## 3. PersistentPlayer Changes

### 3.1 Remove chat page exclusion

Current: `if (pathname.startsWith('/chat') || !player.metadata) return null;`
New: `if (!player.metadata && !showIdleState) return null;`

The player shows on ALL pages. On chat, it replaces GlobalPlayer.

### 3.2 Idle state (nothing playing)

When no track is loaded, show a thin bar:

```
┌──────────────────────────────────────────────────┐
│  📻 ZAO Radio — tap to play           [▶]  [≡]  │
└──────────────────────────────────────────────────┘
```

- Gold radio icon + "ZAO Radio" text + "tap to play" subtitle
- [▶] button starts radio immediately (calls `radio.startRadio()`)
- [≡] button opens MusicSidebar for queue/station selection
- Thin bar: ~44px height, same position as active player

### 3.3 Active state (track playing)

Same as current PersistentPlayer plus:
- Add [≡] sidebar toggle button after the close (X) button
- Remove close (X) button? Or keep both — X stops playback, ≡ opens sidebar

### 3.4 Props changes

PersistentPlayer needs new props from PersistentPlayerWithRadio:
- `onRadioStart: () => void` — start radio
- `isRadioMode: boolean` — show radio indicator
- `radioLoading: boolean` — show loading on radio button
- `onToggleSidebar: () => void` — open/close MusicSidebar
- `sidebarOpen: boolean` — sidebar state for button highlight

## 4. MusicSidebar Goes Global

### 4.1 Move to auth layout

Currently rendered inside ChatRoom. Move to `src/app/(auth)/layout.tsx` alongside PersistentPlayerWithRadio.

### 4.2 State management

`PersistentPlayerWithRadio` already wraps the player. Extend it to also manage:
- `sidebarOpen` state
- Pass `onToggleSidebar` down to PersistentPlayer
- Render MusicSidebar as a sibling

### 4.3 Queue behavior by page

- **On /chat:** Queue builds from channel messages (current behavior)
- **On other pages:** Queue shows only tracks that have been played in this session
- **Radio mode:** Queue shows radio station tracks regardless of page

The sidebar needs to work without `messages` prop when not on chat. MusicSidebar currently requires `messages: Cast[]` — make it optional. When no messages provided, show radio + now-playing only, queue section shows "Visit chat to discover tracks."

## 5. Remove Redundant Components

### 5.1 GlobalPlayer — remove from ChatRoom

`src/components/music/GlobalPlayer.tsx` — full-featured player rendered inside chat. No longer needed because PersistentPlayer is now visible on chat pages.

Remove:
- `const GlobalPlayer = dynamic(...)` import in ChatRoom
- `<GlobalPlayer ... />` render in ChatRoom
- The file itself can stay (not deleted) but is no longer imported

### 5.2 RadioButton — remove from ChatRoom header

The compact RadioButton in the chat header bar. No longer needed — radio starts from PersistentPlayer idle state or MusicSidebar.

Remove from ChatRoom:
- `import { RadioButton }`
- `<RadioButton ... />` in the header

### 5.3 Music note toggle — remove from ChatRoom header

The button that toggles `musicSidebarOpen`. No longer needed — sidebar opens from PersistentPlayer [≡] button.

Remove from ChatRoom:
- The music queue toggle `<button onClick={() => setMusicSidebarOpen(...)}>` in the header

### 5.4 Keep in ChatRoom header

- Search button (Cmd+K)
- Scheduled posts button
- Song submit button (+)
- Notification bell

## 6. File Changes

### Modify

| File | Change |
|------|--------|
| `src/components/music/PersistentPlayer.tsx` | Remove chat exclusion, add idle state, add sidebar toggle button, accept new props |
| `src/components/music/PersistentPlayerWithRadio.tsx` | Add sidebar state management, render MusicSidebar, pass props to PersistentPlayer |
| `src/components/music/MusicSidebar.tsx` | Make `messages` prop optional, handle no-messages gracefully |
| `src/components/chat/ChatRoom.tsx` | Remove GlobalPlayer, RadioButton, music toggle button from header. Remove `musicSidebarOpen` state (moved to layout). Remove `useMusicQueue` (moved to sidebar). Keep song submit button. |
| `src/app/(auth)/layout.tsx` | No change needed — PersistentPlayerWithRadio already renders here |

### No new files needed

Everything is a modification of existing components.

## 7. Mobile Considerations

- PersistentPlayer idle bar sits above BottomNav (same position as active player)
- MusicSidebar on mobile: stays as bottom sheet overlay (current behavior)
- Idle state is compact enough (~44px) to not crowd mobile viewport

## 8. Implementation Order

1. **PersistentPlayer** — remove chat exclusion, add idle state with radio start + sidebar toggle
2. **PersistentPlayerWithRadio** — add sidebar state, render MusicSidebar
3. **MusicSidebar** — make messages optional, handle empty state
4. **ChatRoom** — remove GlobalPlayer, RadioButton, music toggle from header
5. **Test** — verify on all pages: idle state, radio start, sidebar open, track playing, navigation persistence

## 9. Success Criteria

- [ ] PersistentPlayer visible on ALL pages including chat
- [ ] "ZAO Radio — tap to play" shown when nothing is playing
- [ ] One tap on play button starts radio from any page
- [ ] Sidebar toggle button opens MusicSidebar from any page
- [ ] MusicSidebar works on non-chat pages (radio + now playing, no queue)
- [ ] Chat header is cleaner (no radio button, no music toggle, no queue badge)
- [ ] GlobalPlayer no longer rendered anywhere
- [ ] Music persists across all page navigation (already fixed)
- [ ] Mobile: sidebar still works as bottom sheet
