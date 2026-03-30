# 215 — OBS + Restream + StreamYard Feature Analysis: What ZAO OS Spaces Should Have

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Comprehensive feature inventory of OBS Studio, Restream, and StreamYard — map every capability, identify what ZAO OS already has, what we should build, and integration opportunities
> **Updates:** Doc 160 (Audio Spaces Landscape), Doc 163 (Multistreaming Platforms), Doc 213 (Streaming Architecture), Doc 214 (Twitch API Deep Integration)

---

## Recommendations Table (Start Here)

| # | Recommendation | Priority | Effort | Why |
|---|---------------|----------|--------|-----|
| 1 | **Stream overlays via browser source pattern** — render ZAO-branded overlays (now playing, speaker names, room title, Respect badges) as compositable layers | P0 | Medium | Every streamer wants branded overlays. OBS does this with browser sources; we can render them natively in our video compositor or as OBS-compatible overlay URLs |
| 2 | **OBS WebSocket integration** — let hosts connect OBS to ZAO, remote-control scene switches, go live/stop from ZAO UI | P1 | Medium | Power users already use OBS. Controlling it from ZAO makes us a "mission control" not just a room |
| 3 | **Chat aggregation** — pull Twitch + YouTube + Kick chat into ZAO room feed | P1 | Medium | Restream's #1 differentiator. Doc 214 already covers Twitch chat bridge. Extend to YouTube Live Chat API + Kick |
| 4 | **Stream scheduling** — schedule rooms in advance with countdown, auto-notify members | P1 | Low | Both Restream and StreamYard have this. We have Supabase + cron. Missing feature from Doc 160 |
| 5 | **Recording + replay** — record room audio/video, save to cloud, allow replay | P1 | Low | Stream.io supports call recording natively. StreamYard/Restream both have this. We just need to enable it |
| 6 | **Guest invite links** — shareable URL that lets non-members join as speakers | P1 | Low | StreamYard's killer feature. We have public listener access; extend to guest speaker links |
| 7 | **Stream analytics dashboard** — viewer counts, peak viewers, duration, chat activity across all platforms | P2 | Medium | Restream analytics. We already poll viewer counts in BroadcastPanel; extend to post-stream summary |
| 8 | **Overlay templates library** — pre-built ZAO-branded overlay templates (now playing, starting soon, BRB, end screen) | P2 | Medium | OBS/StreamYard both have template ecosystems. Music community needs album art + track info overlays |
| 9 | **Scene management** — switchable layouts (speakers-first, content-first, music visualizer, gallery) with transitions | P2 | Medium | OBS scenes concept. We have 2 layouts already. Extend to 4-6 with smooth transitions |
| 10 | **Restream OAuth integration** — connect Restream account for 30+ platform multistreaming | P2 | Medium | Power users who already pay for Restream. Doc 163 recommended this as Tier 3 |
| 11 | **Clip creation** — highlight moments during stream, save as clips | P2 | Low | OBS replay buffer, Restream clips, Twitch clips (Doc 214). Livepeer already has clip API |
| 12 | **Virtual camera output** — expose ZAO room as virtual webcam for use in Zoom/Meet/Discord | P3 | High | OBS virtual camera concept. Would require desktop app or browser extension. Defer |
| 13 | **Plugin/extension system** — allow community to build custom overlays, bots, integrations | P3 | High | OBS has 303+ plugins. Future goal, not near-term |

---

## Part 1 — What ZAO OS Already Has (Current State)

Based on the codebase audit of `/spaces`, broadcast components, and API routes:

### Broadcasting & Multistreaming
- **BroadcastModal** — multi-platform RTMP setup with connected platforms (Twitch, YouTube, Kick, Facebook) + custom RTMP targets
- **BroadcastPanel** — live dashboard with per-target status, uptime timer, viewer count polling (10s interval), stop/retry per target
- **BroadcastSettings** — save stream keys for one-click future broadcasts (YouTube, Twitch, TikTok, Facebook, Kick, Custom RTMP)
- **Direct mode** — Stream.io `startRTMPBroadcasts()` pushes directly to each RTMP endpoint
- **Relay mode** — Livepeer multistream relay: single RTMP to Livepeer, Livepeer fans out to all targets
- **rtmpManager.ts** — full state machine for broadcast lifecycle (start, stop, retry, per-target management)

### Audio Room Features
- **Dual provider support** — Stream.io (primary) + 100ms (secondary)
- **ControlsPanel** — mic, camera, screen share, go live, broadcast, music toggle, raise hand, layout toggle
- **Two layouts** — speakers-first (avatar grid) + content-first (dominant speaker + PiP)
- **Twitch interactive panel** — polls, predictions, clips from ZAO dashboard (Doc 214)
- **Music in rooms** — RoomMusicPanel for shared listening
- **Public listener access** — guest users can listen without auth
- **Session tracking** — leaderboard by time spent in spaces

### Platform Connections
- **Twitch** — OAuth, stream key, RTMP URL, chat (3 scopes, expansion planned per Doc 214)
- **YouTube** — OAuth, auto-create broadcast, get RTMP + stream key
- **Facebook** — OAuth, auto-create live video, get RTMP + stream key
- **Kick** — manual stream key entry
- **Custom RTMP** — any endpoint

### What's NOT Built Yet
- No overlays or branding layer on streams
- No chat aggregation from external platforms into ZAO
- No recording/replay
- No stream scheduling
- No guest invite links for speakers
- No post-stream analytics summary
- No scene transitions or visual effects
- No OBS integration
- No Restream API integration (only manual RTMP)

---

## Part 2 — OBS Studio: Complete Feature Inventory

**Version:** OBS Studio 32.1.0 (March 2026)
**Platform:** Desktop (Windows, macOS, Linux) — free and open source
**Architecture:** Local encoding, local scene composition, RTMP/SRT output

### 2A. Core Features

| Category | Feature | Details |
|----------|---------|---------|
| **Scenes** | Unlimited scenes | Named scene collections, instant switching via click or hotkey |
| **Scenes** | Scene collections | Save/load entire scene sets, switch between projects |
| **Scenes** | Scene nesting | Embed one scene as source inside another |
| **Sources** | Display capture | Capture entire monitor or window |
| **Sources** | Window capture | Capture specific application window |
| **Sources** | Browser source | Embed any URL as an overlay — the key to all web-based integrations |
| **Sources** | Image/media source | Static images, video files, image slideshows |
| **Sources** | Text (FreeType 2) | Custom text overlays with fonts, colors, scrolling |
| **Sources** | Audio input/output | Mic, desktop audio, virtual audio cables |
| **Sources** | NDI source | Network video input from other computers |
| **Sources** | Color source | Solid color backgrounds |
| **Sources** | Game capture | Direct GPU capture for games (Windows) |
| **Transitions** | Cut, Fade, Swipe, Slide, Stinger | Built-in transition effects between scenes |
| **Transitions** | Custom stinger | Video-based transitions (logo animation wipes) |
| **Transitions** | Scene-specific overrides | Different transition per scene pair |
| **Audio** | Per-source volume control | Individual faders per audio source |
| **Audio** | Audio filters | Noise gate, noise suppression, compressor, limiter, gain, VST plugins |
| **Audio** | Audio monitoring | Monitor audio through headphones while streaming |
| **Audio** | Audio tracks | Up to 6 separate audio tracks for recording |
| **Encoding** | Software (x264) | CPU-based encoding |
| **Encoding** | Hardware (NVENC, QSV, AMF) | GPU-accelerated encoding (NVIDIA, Intel, AMD) |
| **Encoding** | AV1 support | Next-gen codec support on RTX 40/50 series |
| **Output** | RTMP streaming | Standard streaming protocol to any platform |
| **Output** | SRT streaming | Low-latency alternative to RTMP |
| **Output** | Virtual camera | Output scene as webcam to Zoom/Meet/Discord |
| **Output** | Recording | Local recording in MKV/MP4/MOV |
| **Output** | Replay buffer | Save last N seconds as clip on demand |
| **Output** | Multiple outputs | Stream + record simultaneously at different quality |
| **Hotkeys** | Global hotkeys | System-wide keyboard shortcuts for any action |
| **Hotkeys** | Per-scene hotkeys | Switch to specific scene with one keypress |
| **Studio mode** | Preview/Program | See next scene before switching — like a TV production switcher |

### 2B. OBS WebSocket API v5 (Built-in since OBS 28+)

The WebSocket API allows full remote control of OBS from any application. This is the key integration point for ZAO OS.

**Connection:** WebSocket on port 4455 (default), password authentication, optional SSL/TLS

**Request Categories (120+ requests):**

| Category | Key Requests | ZAO OS Relevance |
|----------|-------------|------------------|
| **General** | GetVersion, GetStats, TriggerHotkeyByName | Monitor OBS health, trigger scene switches remotely |
| **Scenes** | GetSceneList, SetCurrentProgramScene, CreateScene | Switch scenes from ZAO UI — "Starting Soon" / "Live" / "BRB" |
| **Inputs** | GetInputList, SetInputMute, SetInputVolume, CreateInput | Mute/unmute OBS sources from ZAO, add new sources |
| **Sources** | GetSourceScreenshot, SaveSourceScreenshot | Capture OBS output as thumbnail for ZAO room card |
| **Scene Items** | SetSceneItemEnabled, SetSceneItemTransform | Show/hide overlays, move/resize elements |
| **Transitions** | SetCurrentSceneTransition, TriggerStudioModeTransition | Trigger scene transitions from ZAO |
| **Stream** | GetStreamStatus, StartStream, StopStream | Start/stop OBS streaming from ZAO dashboard |
| **Record** | StartRecord, StopRecord, PauseRecord, SplitRecordFile | Control recording from ZAO |
| **Outputs** | StartVirtualCam, StopVirtualCam, SaveReplayBuffer | Save replay clips, toggle virtual cam |
| **Filters** | SetSourceFilterEnabled, SetSourceFilterSettings | Toggle audio filters, adjust effects |
| **Media** | SetMediaInputCursor, TriggerMediaInputAction | Control media playback in OBS |
| **Config** | SetStreamServiceSettings | Change stream destination from ZAO |

**Integration pattern for ZAO OS:**
```
ZAO OS /spaces host UI
  |
  ├── "Connect OBS" button → user enters OBS WebSocket URL + password
  ├── ZAO polls OBS status (streaming? recording? current scene?)
  ├── Scene switcher panel in ZAO → sends SetCurrentProgramScene
  ├── Go Live button → sends StartStream to OBS + starts RTMP in ZAO
  └── Auto-update browser source in OBS with ZAO overlay URL
```

### 2C. OBS Plugin Ecosystem (303+ plugins)

| Plugin | Downloads | What It Does | ZAO Relevance |
|--------|-----------|-------------|---------------|
| **Move Transition** | Top plugin | Smooth animated transitions with keyframes | Inspiration for our scene transitions |
| **StreamFX** | Very popular | 3D effects, blur, cinematic transitions | Not applicable (desktop-only) |
| **Tuna** | Popular | Now-playing display (Spotify, YouTube, VLC, etc.) | We should build this natively — "Now Playing" overlay |
| **Advanced Scene Switching** | Popular | Auto-switch scenes based on audio, media, hotkeys | Inspiration: auto-switch to "Music" scene when DJ mode active |
| **SE.Live** | Popular | StreamElements integration — alerts, chat, media requests | We build our own equivalent in-app |
| **NDI** | Popular | Network video between computers | Not applicable (desktop only) |
| **ReaPlugs VST** | Popular | Professional audio processing | We have Web Audio API for audio effects |
| **obs-browser** | Built-in | Embed web pages as sources | Key: our overlays can be browser sources in OBS |

### 2D. Browser Source Pattern (Critical for ZAO)

OBS browser source is the bridge between web apps and OBS. Any URL can be embedded as a transparent overlay in OBS.

**How ZAO should use this:**
1. Create overlay URLs at `/overlays/now-playing`, `/overlays/speakers`, `/overlays/room-title`
2. These render transparent HTML with the current room state
3. Hosts add these as browser sources in OBS
4. Real-time updates via WebSocket or SSE — OBS re-renders automatically

**This means ZAO OS can provide OBS-compatible overlays without any plugin development.**

---

## Part 3 — Restream: Complete Feature Inventory

**Platform:** Cloud-based SaaS (browser + RTMP ingest)
**Pricing:** Free (2 channels) / Standard $16/mo (3 channels) / Professional $39/mo (5 channels, 1080p) / Business $199/mo (8 channels, SRT)

### 3A. Core Features

| Category | Feature | Details |
|----------|---------|---------|
| **Multistreaming** | 30+ platform support | YouTube, Twitch, Facebook, LinkedIn, TikTok, X, Kick, Dailymotion, Telegram, Vimeo, Trovo, Amazon, Instagram, custom RTMP |
| **Multistreaming** | Simultaneous destinations | Free: 2, Standard: 3, Pro: 5, Business: 8 |
| **Multistreaming** | Custom RTMP/SRT/HLS/WHIP | Stream to any endpoint |
| **Restream Studio** | Browser-based streaming | Go live from browser, no software needed |
| **Restream Studio** | Guest links | Invite guests via shareable link — up to 10 on screen |
| **Restream Studio** | Screen sharing | Share screen directly from browser |
| **Restream Studio** | Custom overlays | Upload logo watermarks, overlays, lower thirds |
| **Restream Studio** | QR codes | Generate and display QR codes on stream |
| **Restream Studio** | Backgrounds | Custom background images/videos |
| **Restream Studio** | Captions | Live captions on stream |
| **Chat** | Cross-platform chat | See messages from ALL platforms in one feed |
| **Chat** | Chat-on-screen | Display chat messages as overlay on stream |
| **Chat** | Chat moderation | Moderate across all platforms from one place |
| **Chat** | Highlight messages | Pin messages to display on screen |
| **Analytics** | Stream metrics | Total streams, average duration, viewer counts |
| **Analytics** | Audience metrics | Max viewers, peak time, watched minutes |
| **Analytics** | Chat metrics | Messages sent, unique chatters |
| **Analytics** | Growth metrics | Followers gained/lost per stream |
| **Analytics** | Per-platform breakdown | See metrics for each destination separately |
| **Scheduling** | Schedule streams | Set future stream times, auto-notify |
| **Clips** | Clip creation | Create clips during or after stream |
| **Clips** | Clip download | Download clips for social media |
| **Recording** | Cloud recording | Record streams to cloud storage |
| **Recording** | Split recordings | Separate recordings per platform |
| **Alerts** | Automated alerts | Follower alerts, donation alerts, etc. |
| **Alerts** | Text-to-speech | TTS for alerts |
| **Bots** | Chat bots | Automated chat responses |
| **Translation** | Live voiceovers | AI-powered live translations |
| **Branding** | Custom graphics | Logos, overlays, lower thirds, tickers |
| **Branding** | Sentiment analysis | Audience sentiment from chat |

### 3B. Restream API (REST + WebSocket)

**Authentication:** OAuth 2.0

| API Section | Endpoints | What It Does |
|------------|-----------|-------------|
| **Channel** | Channel operations | Manage connected streaming channels |
| **Stream Key** | Get/set stream key | Read RTMP ingest credentials |
| **Events** | Upcoming, In Progress, History | Create/manage streaming events |
| **Event Stream Key** | Per-event keys | Get RTMP credentials for specific events |
| **Event SRT Stream Keys** | SRT keys | Low-latency SRT ingest keys |
| **Event Recordings** | List recordings | Access recorded streams |
| **Recording Download** | Download URL | Get download links for recordings |
| **Clips** | Clip Projects, Details, Download | Create and manage clips |
| **Chat** | WebSocket events | Real-time cross-platform chat aggregation |
| **Chat Actions** | Send, ban, timeout | Moderate chat across platforms |
| **Chat Connections** | Platform sources | Which platforms are feeding chat |
| **Chat Relay** | Forward messages | Relay messages between platforms |
| **Storage** | File management | Upload/manage stream assets |
| **Studio** | Brands, Captions | Manage studio branding and captions |
| **Streaming Updates** | WebSocket | Real-time stream status updates |

**Integration pattern for ZAO OS:**
```
ZAO OS Settings → "Connect Restream" → OAuth flow
  |
  ├── Fetch connected channels → show in BroadcastModal
  ├── One-click "Go Live Everywhere" → single RTMP to Restream ingest
  ├── Chat aggregation WebSocket → pipe into ZAO room cast feed
  └── Post-stream analytics → ZAO dashboard
```

---

## Part 4 — StreamYard: Complete Feature Inventory

**Platform:** Browser-based SaaS
**Pricing:** Free (branded) / Core $35-45/mo / Advanced $69-89/mo / Business $299/mo / Enterprise (custom)

### 4A. Core Features

| Category | Feature | Details |
|----------|---------|---------|
| **Browser-based** | No download required | Everything runs in Chrome/Edge/Firefox |
| **Multistreaming** | Up to 8 destinations | YouTube, Facebook, Twitch, LinkedIn, X, TikTok, custom RTMP (9 platforms) |
| **Guests** | Invite via link | Share link, guest joins in browser — up to 10 on-screen |
| **Guests** | One-click switching | Switch between 10 participants instantly |
| **Guests** | Green room | Guests wait in green room before being added to stream |
| **Recording** | Cloud recording | Automatic cloud recording (5h free, 50h+ paid) |
| **Recording** | Local 4K multi-track | Studio-quality per-participant recording at 4K UHD (paid) |
| **Recording** | Multi-track audio | 48kHz WAV per participant for post-production |
| **Overlays** | Custom overlays | Upload up to 100 overlays per brand folder |
| **Overlays** | Overlay switching | Click to switch overlays during stream — like "slides" |
| **Overlays** | Lower thirds | Auto-generated name cards for speakers |
| **Overlays** | Logos and watermarks | Persistent brand elements |
| **Backgrounds** | Custom backgrounds | Upload images/videos as backgrounds |
| **Layouts** | Multiple layouts | Side-by-side, solo, gallery, screen share + speakers |
| **Screen share** | Browser-based | Share screen, window, or tab directly |
| **Comments** | On-screen comments | Pull comments from platforms and display on stream |
| **Comments** | Comment banner | Highlight a comment as full-screen banner |
| **Banners** | Custom text banners | Scrolling or static text banners |
| **Banners** | Ticker | Scrolling news ticker |
| **Countdown** | Starting soon timer | Countdown overlay before going live |
| **Brand kit** | Reusable brand folders | Save colors, logos, overlays as reusable kit |
| **Webinars** | StreamYard On-Air | Registration, auto-recording, embeddable watch page, on-demand replays |
| **AI features** | AI tools | AI-powered features on Core plan and above |
| **Destinations** | 9 platforms | YouTube, Facebook, Twitch, LinkedIn, X, TikTok, Twitch, custom RTMP, and a few others |

### 4B. StreamYard API

StreamYard has **no public REST API** for stream management. Integration options:

| Method | What It Does | Limitation |
|--------|-------------|------------|
| **Zapier integration** | Send webinar registration data to other apps | Advanced plan only, one-way (out of StreamYard), webinar registrations only |
| **Appy Pie / no-code** | Connect to 1000+ apps via no-code platforms | Same Zapier-level automation only |
| **Custom RTMP** | Receive RTMP from external sources | Manual setup, no programmatic control |

**Verdict: StreamYard cannot be integrated programmatically into ZAO OS.** No API for starting/stopping streams, managing guests, or controlling overlays. This confirms Doc 163's recommendation to skip StreamYard for integration.

---

## Part 5 — Feature Comparison Matrix

### 5A. Complete Comparison: OBS vs Restream vs StreamYard vs ZAO OS

| Feature | OBS Studio | Restream | StreamYard | ZAO OS (Current) | ZAO OS (Buildable) |
|---------|-----------|----------|------------|-------------------|---------------------|
| **Free to use** | Yes (100%) | Yes (limited) | Yes (branded) | Yes | -- |
| **Browser-based** | No (desktop) | Yes | Yes | Yes | -- |
| **Multistream** | No (needs plugin/service) | Yes (30+ platforms) | Yes (9 platforms) | Yes (5 platforms + custom) | Add Restream for 30+ |
| **RTMP output** | Yes | Yes (ingest) | Yes (ingest) | Yes (direct + Livepeer relay) | -- |
| **SRT output** | Yes | Yes (Business) | No | No | Add via Livepeer |
| **Custom RTMP** | Yes | Yes | Yes | Yes | -- |
| **Scenes/layouts** | Unlimited | Limited (studio) | 6+ layouts | 2 layouts | Extend to 6+ |
| **Scene switching** | Hotkeys + mouse | Click | Click | Click | Add hotkeys + transitions |
| **Scene transitions** | Fade, swipe, stinger, custom | Basic | Basic | None | Add fade/swipe |
| **Browser source overlays** | Yes (key feature) | Upload-based | Upload-based | No | Build overlay URLs |
| **Custom overlays** | Unlimited (any web URL) | Yes (upload) | Yes (100 per folder) | No | Build overlay system |
| **Now playing display** | Via Tuna plugin | No | No | No (player exists separately) | Build — unique advantage |
| **Audio mixing** | Per-source faders + VST | Basic | Basic | Per-user via WebRTC | Sufficient |
| **Noise suppression** | Built-in + plugins | Browser-based | Browser-based | Browser-based (WebRTC) | Sufficient |
| **Screen sharing** | Display/window capture | Yes | Yes | Yes | -- |
| **Camera** | Any connected camera | Webcam | Webcam | Webcam | -- |
| **Virtual camera** | Yes (output) | No | No | No | Needs desktop app |
| **Guest management** | No | Yes (studio) | Yes (10 guests, links) | Yes (public listeners, speakers) | Add invite links |
| **Green room** | No | No | Yes | No | Build speaker queue |
| **Chat aggregation** | No (needs plugin) | Yes (30+ platforms) | Yes (on-screen) | No | Build (Twitch + YT + Kick) |
| **Chat on screen** | Via browser source | Yes | Yes (comments banner) | No | Build as overlay |
| **Recording** | Local (MKV/MP4) | Cloud | Cloud + local 4K | No | Enable Stream.io recording |
| **Replay buffer** | Yes (save last N sec) | No | No | No | Build with Livepeer clips |
| **Clip creation** | Replay buffer | Yes | No | Livepeer clip API exists | Wire up clip UI |
| **Stream scheduling** | No | Yes | Yes (On-Air) | No | Build (Supabase + cron) |
| **Analytics** | No | Yes (4 metric categories) | Basic | Viewer count polling only | Build post-stream dashboard |
| **Alerts (follow/sub)** | Via StreamElements/Streamlabs | Yes | No | No | Build with EventSub (Doc 214) |
| **Polls** | No | No | No | Twitch polls (via TwitchInteractivePanel) | Extend to in-room polls |
| **Lower thirds** | Via browser source | Yes | Yes (auto-generated) | No | Build speaker name cards |
| **Countdown timer** | Via browser source | No | Yes | No | Build "Starting Soon" scene |
| **Ticker/banner** | Via browser source | No | Yes | No | Build scrolling banner |
| **Branding kit** | Manual setup | Basic | Yes (folders) | Community config only | Build brand presets |
| **Remote control API** | WebSocket (120+ requests) | REST + WebSocket | No API | No | Integrate OBS WebSocket |
| **Plugin system** | 303+ plugins | No | No | No | Future |
| **Hotkeys** | Global + per-scene | No | No | No | Build keyboard shortcuts |
| **Studio mode (preview)** | Yes | No | No | No | Future |
| **Webinars** | No | No | Yes (On-Air) | No | Not needed |
| **AI captions** | No | Yes | Yes | No | Future (100ms has built-in) |
| **Sentiment analysis** | No | Yes | No | No | Future |

### 5B. Features Unique to Each Platform

**Only OBS has:**
- Virtual camera output
- 303+ plugin ecosystem
- Unlimited local scenes with nesting
- Hardware encoding (NVENC, QSV, AMF)
- Global hotkeys
- Studio mode (preview/program)
- Replay buffer (save last N seconds)
- Full WebSocket remote control API (120+ requests)

**Only Restream has:**
- 30+ platform distribution
- Cross-platform chat aggregation (the killer feature for multistreaming)
- Sentiment analysis on chat
- Live voiceover translations
- Chat bots built-in
- 4-category analytics dashboard (stream, chat, audience, growth)

**Only StreamYard has:**
- Green room for guests
- One-click 10-person switching (best guest UX)
- 4K multi-track local recording per participant
- 100 overlays per brand folder with "slide-like" switching
- Webinar platform (On-Air) with registration + on-demand replay

**Only ZAO OS has (or can have):**
- Music-first audio rooms with shared listening
- Respect-weighted participation and curation
- Farcaster-native casting from rooms
- Web3 token-gated access
- Livepeer decentralized relay
- Binaural beats in rooms
- Community governance integration

---

## Part 6 — Gap Analysis: What ZAO OS is Missing

### Critical Gaps (Hurting the streaming experience today)

| Gap | What Users Expect | Impact | Fix |
|-----|-------------------|--------|-----|
| **No overlays** | Branded stream with room title, speaker names, now playing | Streams look unprofessional | Build overlay URL system |
| **No recording** | Save room for later, share highlights | Content is lost after stream | Enable Stream.io call recording |
| **No chat aggregation** | See Twitch + YouTube chat in ZAO | Hosts must monitor multiple tabs | Build chat bridge (Doc 214 has Twitch plan) |
| **No scheduling** | Plan streams in advance, notify community | Can't build anticipation | Add to Supabase rooms table + notifications |

### Important Gaps (Expected by regular streamers)

| Gap | What Users Expect | Impact | Fix |
|-----|-------------------|--------|-----|
| **No scene transitions** | Smooth visual change between layouts | Jarring layout switches | Add CSS transitions between layouts |
| **No guest invite links** | Share link for speakers to join | Friction for external guests | Generate temporary guest tokens |
| **No post-stream analytics** | See how the stream performed | No feedback loop | Build analytics page from broadcast data |
| **No lower thirds** | Speaker name + title cards | Viewers don't know who's talking | Build auto-generated name cards |
| **No "Starting Soon" scene** | Countdown before going live | Abrupt start | Build countdown overlay + pre-stream scene |

### Nice-to-Have Gaps (Differentiators if built)

| Gap | Source | Why It Matters for Music Community |
|-----|--------|-----------------------------------|
| **Now Playing overlay** | OBS Tuna plugin pattern | ZAO's unique advantage — show album art + track info on stream |
| **OBS remote control** | OBS WebSocket API | Power users can control OBS from ZAO dashboard |
| **Keyboard shortcuts** | OBS hotkeys | Fast scene/mute/layout control during live streams |
| **Clip creation UI** | OBS replay buffer, Restream clips | Capture best moments, share to Farcaster |
| **Restream OAuth** | Restream API | 30+ platforms for power users without managing individual keys |

---

## Part 7 — Buildable Features (Browser-Based, No Desktop App)

Everything below can be built in ZAO OS's Next.js web app without requiring users to install desktop software.

### 7A. Overlay System (Inspired by OBS Browser Source)

**Concept:** Create web pages at `/overlays/[type]` that render transparent, real-time overlays. These work two ways:
1. **In-app:** Composite overlays on top of the room video feed in ZAO
2. **OBS-compatible:** Hosts add the URL as a browser source in OBS for their local stream

| Overlay | URL | What It Shows | Update Mechanism |
|---------|-----|---------------|-----------------|
| Now Playing | `/overlays/now-playing?room=X` | Album art, track title, artist, progress bar | SSE from player state |
| Speakers | `/overlays/speakers?room=X` | Current speakers with names + Respect badges | WebSocket from room state |
| Room Title | `/overlays/title?room=X` | Room name, host name, participant count | SSE from room metadata |
| Chat Feed | `/overlays/chat?room=X` | Scrolling chat messages | WebSocket from room chat |
| Starting Soon | `/overlays/countdown?room=X&start=ISO` | Countdown timer with ZAO branding | Client-side timer |
| Lower Third | `/overlays/lower-third?room=X&user=Y` | Speaker name card with Respect level | SSE trigger |

**Effort:** Medium (2-3 days). Each overlay is a standalone page with transparent background, real-time data subscription, and ZAO dark theme + gold accent styling.

### 7B. OBS WebSocket Bridge

**Concept:** ZAO connects to the host's OBS instance via WebSocket. The host enters their OBS WebSocket URL and password. ZAO can then remote-control OBS.

| Control | OBS Request | ZAO UI |
|---------|------------|--------|
| Switch scene | `SetCurrentProgramScene` | Scene selector dropdown in host panel |
| Toggle source | `SetSceneItemEnabled` | Checkbox list of OBS sources |
| Start/stop stream | `StartStream` / `StopStream` | Sync with ZAO broadcast button |
| Mute source | `SetInputMute` | Audio control panel |
| Save replay | `SaveReplayBuffer` | "Clip it!" button |
| Screenshot | `GetSourceScreenshot` | Auto-thumbnail for room card |

**Important constraint:** OBS WebSocket runs on localhost. The browser can connect to `ws://localhost:4455` from a page on any origin. This means:
- Works when ZAO is open in the same machine as OBS (typical streamer setup)
- Does NOT work when ZAO is on a phone controlling OBS on a desktop (would need a relay server)

**Effort:** Medium (2-3 days for basic controls). Could start with just scene switching + start/stop.

### 7C. Chat Aggregation

**Concept:** Pull chat from Twitch, YouTube, and Kick into the ZAO room feed. Display cross-platform messages alongside Farcaster casts.

| Platform | Method | API |
|----------|--------|-----|
| Twitch | EventSub WebSocket or IRC | `chat:read` scope (already have) |
| YouTube | YouTube Live Streaming API — liveChatMessages.list | Polling every 5-10s |
| Kick | Pusher WebSocket (unofficial) | No official API, reverse-engineered |
| Restream | Restream Chat WebSocket API | OAuth, aggregates all platforms |

**Two approaches:**
1. **DIY:** Build individual platform chat bridges (Twitch + YouTube first). More control, no extra cost.
2. **Restream API:** If user has Restream, use their chat WebSocket to get all platforms in one feed. Simpler but requires Restream subscription.

**Effort:** Medium (3-5 days for Twitch + YouTube). Kick is harder due to unofficial API.

### 7D. Stream Scheduling

**Concept:** Hosts can schedule rooms in advance. Scheduled rooms appear on `/spaces` with countdown. Members get notified.

**Implementation:**
- Add `scheduled_at` column to `rooms` table
- Add "Schedule" option to HostRoomModal
- Show scheduled rooms with countdown on `/spaces`
- `pg_cron` job or Supabase Edge Function to send notifications before start
- Auto-create room at scheduled time

**Effort:** Low (1-2 days). Most infrastructure exists.

### 7E. Scene/Layout Expansion

**Current:** 2 layouts (speakers-first, content-first)
**Target:** 6+ layouts with transitions

| Scene | Layout | When to Use |
|-------|--------|-------------|
| Starting Soon | Countdown + room info + branding | Before going live |
| Speakers Grid | Avatar circles (existing) | Voice conversations |
| Content First | Screen share + PiP (existing) | Presentations, demos |
| Gallery | Equal-sized tiles for all speakers | Panel discussions |
| Music Visualizer | Album art + waveform + track info | DJ mode, listening parties |
| BRB | "Be Right Back" screen with timer | Breaks |

**Transitions:** CSS `transition` on layout container, crossfade between layouts over 300-500ms.

**Effort:** Medium (2-3 days for 4 new layouts + transitions).

---

## Part 8 — Integration Opportunities

### 8A. OBS Integration Path

| Phase | What | Effort | Value |
|-------|------|--------|-------|
| **Phase 1** | OBS-compatible overlay URLs (`/overlays/*`) | 2-3 days | High — any OBS user can add ZAO overlays |
| **Phase 2** | OBS WebSocket connection from ZAO | 2-3 days | High — remote control OBS from ZAO |
| **Phase 3** | Auto-configure OBS scenes via WebSocket | 1-2 days | Medium — set up ZAO scenes in OBS automatically |
| **Phase 4** | OBS → ZAO audio bridge (virtual cable) | Research | Low priority — complex, niche use case |

### 8B. Restream Integration Path

| Phase | What | Effort | Value |
|-------|------|--------|-------|
| **Phase 1** | Restream OAuth flow + channel fetch | 2-3 days | High — one-click 30+ platform streaming |
| **Phase 2** | Chat aggregation via Restream WebSocket | 2-3 days | High — unified chat across all platforms |
| **Phase 3** | Restream analytics pull | 1-2 days | Medium — cross-platform metrics |
| **Phase 4** | Restream clip creation | 1 day | Low — Livepeer clips may suffice |

### 8C. StreamYard Considerations

StreamYard has no public API. Integration is not feasible. However, we can learn from StreamYard's UX:

| StreamYard Feature | ZAO OS Equivalent We Should Build |
|-------------------|-----------------------------------|
| Guest invite links | Shareable speaker invitation URLs |
| One-click participant switching | Smooth speaker grid management |
| Overlay "slides" | Overlay preset switching |
| Green room | Speaker queue / waiting room |
| Brand kit folders | Community branding presets |
| Lower thirds auto-generation | Auto speaker name cards from Farcaster profile |

---

## Part 9 — Priority Matrix

### P0 — Build Next (High impact, low-medium effort)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Enable Stream.io call recording | 1 day | High | Just enable the `record: true` option |
| Stream scheduling | 2 days | High | `scheduled_at` column + countdown UI |
| Guest speaker invite links | 1-2 days | High | Temporary token with speaker permissions |
| OBS overlay URLs (now playing, speakers, title) | 2-3 days | High | Standalone pages, SSE updates, works with any OBS |

### P1 — Build Soon (High impact, medium effort)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Chat aggregation (Twitch + YouTube) | 3-5 days | High | Doc 214 has Twitch plan. Add YouTube Live Chat API |
| OBS WebSocket bridge (scene switch + start/stop) | 2-3 days | High | Power user feature, unique differentiator |
| Scene transitions (CSS crossfade) | 1-2 days | Medium | Simple CSS transitions between layout changes |
| Lower thirds / speaker name cards | 1-2 days | Medium | Auto-generate from Farcaster profile data |
| Post-stream analytics summary | 2-3 days | Medium | Aggregate viewer counts + duration + chat metrics |

### P2 — Build Later (Medium impact, medium effort)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Restream OAuth integration | 3-5 days | Medium | Power user feature for 30+ platforms |
| Expanded layout library (6 scenes) | 2-3 days | Medium | Gallery, music visualizer, starting soon, BRB |
| Clip creation UI | 2 days | Medium | Wire up existing Livepeer clip API |
| Overlay template library | 3-5 days | Medium | Pre-built branded overlay designs |
| Keyboard shortcuts for hosts | 1-2 days | Medium | Scene switch, mute, layout toggle via keyboard |

### P3 — Future (Nice to have)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Virtual camera output | High | Low | Requires desktop app or browser extension |
| Plugin/extension system | High | Medium | Community-built overlays, bots, integrations |
| AI captions | Medium | Medium | 100ms has built-in transcription |
| Sentiment analysis | Medium | Low | Analyze chat mood during stream |

---

## Part 10 — What Makes ZAO Unique (Competitive Advantage)

None of these platforms can do what ZAO OS can do:

| ZAO Advantage | Why It Matters |
|---------------|----------------|
| **Music-first rooms** | Listen to music together while streaming. No streaming tool has this. The "Now Playing" overlay is something streamers currently hack together with OBS plugins. We have it native. |
| **Farcaster-native** | Cast highlights to Farcaster from the room. Cross-post to Bluesky/X. Social distribution built in. |
| **Respect-weighted** | Speaker priority based on community contribution, not just hand-raising. Unique governance layer. |
| **Web3 token-gating** | Access control via on-chain membership. Restream/StreamYard/OBS have no concept of this. |
| **Decentralized relay** | Livepeer for video transcoding/distribution. No centralized vendor lock-in for multistreaming. |
| **Community-owned** | Open source, community-governed. OBS is open source but not community-governed in the same way. |
| **All-in-one social** | Chat (Farcaster casts), messaging (XMTP), audio rooms, music, governance — one app. |

**The strategic position:** ZAO OS is not competing with OBS/Restream/StreamYard. It integrates with them while providing capabilities none of them have. OBS is the encoder, Restream is the distributor, StreamYard is the browser studio. **ZAO OS is the community layer that ties them together with music, governance, and social.**

---

## Sources

- [OBS Studio Official Site](https://obsproject.com/)
- [OBS Studio 32.0 Release Notes](https://obsproject.com/blog/obs-studio-32-0-release-notes)
- [OBS WebSocket Protocol v5 (GitHub)](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [OBS WebSocket Remote Control Guide](https://obsproject.com/kb/remote-control-guide)
- [OBS Browser Source Documentation](https://obsproject.com/kb/browser-source)
- [OBS Virtual Camera Guide](https://obsproject.com/kb/virtual-camera-guide)
- [OBS Plugin List (303+ plugins)](https://obsproject.com/forum/plugins/)
- [Best OBS Plugins 2026 (Gumlet)](https://www.gumlet.com/learn/best-obs-plugins/)
- [Top 10 OBS Plugins 2026 (MediaEquipt)](https://www.mediaequipt.com/obs-studio-plugins/)
- [OBS Studio Guide & Tutorial (Ant Media)](https://antmedia.io/obs-studio-guide-streaming-tutorial/)
- [Restream Pricing Plans](https://restream.io/pricing)
- [Restream API Developer Docs](https://developers.restream.io/docs)
- [Restream API Getting Started](https://developers.restream.io/guide/getting-started)
- [Restream Studio Guide (Blog)](https://restream.io/blog/restream-studio-everything-you-need-to-know/)
- [Restream Tools and Features Guide](https://restream.io/blog/restream-tools-and-features/)
- [Restream Analytics Guide](https://restream.io/blog/restream-analytics-everything-you-need-to-know/)
- [Restream Supported Platforms](https://support.restream.io/en/articles/872029-supported-social-platforms)
- [Restream Chat Documentation](https://support.restream.io/en/articles/2379624-restream-chat)
- [StreamYard Pricing Plans](https://streamyard.com/pricing)
- [StreamYard Review 2026 (Learning Revolution)](https://www.learningrevolution.net/streamyard-review/)
- [StreamYard vs Restream Comparison 2026](https://www.learningrevolution.net/restream-vs-streamyard/)
- [StreamYard Streaming Software 2026 Comparison](https://streamyard.com/blog/streaming-software-2026-comparison)
- [StreamYard Cloud Recording Guide](https://streamyard.com/blog/cloud-recording-software-guide)
- [StreamYard On-Air Webinars](https://streamyard.com/streamyard-on-air)
- [StreamYard Zapier Integration](https://support.streamyard.com/hc/en-us/articles/21211769916308-How-to-Integrate-StreamYard-On-Air-with-Zapier)
- [Restream.io Review 2026 (Learning Revolution)](https://www.learningrevolution.net/restream-review/)
- [Comparing StreamYard, Restream, OBS (Pheedloop)](https://pheedloop.com/blog/comparing-streamyard-restream-and-obs-for-your-next-virtual-or-hybrid-event)
- [OBS RTMP Server Setup (VideoSDK)](https://www.videosdk.live/developer-hub/rtmp/obs-rtmp-server)
- [StreamElements OBS Overlays](https://support.streamelements.com/hc/en-us/articles/10474479981074-Adding-Overlays-to-OBS-Studio)
