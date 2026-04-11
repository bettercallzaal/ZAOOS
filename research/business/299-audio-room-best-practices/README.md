# 299 - Audio Room Best Practices: UX, Retention, Moderation, and Accessibility for FISHBOWLZ

> **Status:** Research complete
> **Date:** 2026-04-07
> **Goal:** Synthesize best practices from Clubhouse, X Spaces, Discord Stage Channels, and open-source implementations into actionable recommendations for FISHBOWLZ - persistent audio rooms with hot seat rotation, transcription, and chat
> **Updates:** Doc 255 (FISHBOWLZ spec), Doc 280 (MVP to SaaS roadmap), Doc 281 (competitive landscape), Doc 290 (agentic participants), Doc 298 (tokenization)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Reconnection handling** | IMPLEMENT ICE restart + automatic republish on disconnect. Monitor `iceConnectionState` for "failed"/"disconnected", trigger `createOffer(RestartIce)`, then unpublish/republish streams. 100ms handles this internally but add a visible "Reconnecting..." banner with 15s timeout before fallback to rejoin. Users on mobile lose connection constantly - this is P0 for retention. |
| **Onboarding time** | TARGET sub-3-minute activation. Apps that activate users within 3 minutes see 2x higher D1 retention. FISHBOWLZ should: (1) show a live room on the landing page, (2) allow listening with zero auth, (3) require auth only to speak/chat. Currently requires Privy auth before any room interaction - add anonymous listen mode. |
| **Hot seat timer** | USE 5-minute default rotation with configurable 2-10 minute range. Fishbowl best practice is 5-10 minute rotations. Add a visible countdown timer, audible chime at 30s warning, and auto-rotate to next in queue. The "hot seat pop-in" pattern (2-min guest slot for audience members) is proven in educational fishbowls. |
| **Moderation MVP** | SHIP host-only kick/mute first (confirmed by doc 280), then add: (1) audience-initiated hand-lower (withdraw from queue), (2) word-based auto-mute via Perspective API (already in ZAO OS at `src/lib/moderation/moderate.ts`), (3) community flagging for recorded transcripts. Skip real-time audio AI moderation - too expensive at current scale. |
| **Live transcription provider** | USE Deepgram Streaming API ($0.0043/min, 99%+ accuracy, WebSocket-native). Deepgram's streaming endpoint accepts raw PCM audio over WebSocket and returns JSON transcripts in real-time. Current 100ms transcription is functional but Deepgram provides speaker diarization, punctuation, and 30+ language support. Budget: ~$2.58/month at 10 hrs/week usage. |
| **Accessibility** | ADD live captions as a first-class feature, not an afterthought. Display real-time transcript text below the speaker list (already have transcript infrastructure). Add speaker identification labels. Support screen readers with ARIA live regions for speaker changes. This is also a competitive differentiator - no social audio app does captions well. |
| **Retention mechanics** | IMPLEMENT three proven patterns: (1) Room schedules with push notifications ("Your weekly fishbowl starts in 15 min"), (2) Streak tracking for hosts/speakers (visible profile badges), (3) AI-generated room summaries sent to members who missed the session. Average social app D30 retention is 4.4% - community apps with schedules hit 15-25%. |
| **Persistent room UX** | SHOW room state clearly: "Live now (3 speakers)" vs "Scheduled: Tomorrow 6pm" vs "Last active: 2 hours ago (transcript available)". Discord's always-on voice channels work because users see who's there before joining. Add a "lobby" state where users can see participants without joining audio. |
| **Open source reference** | USE Jam (github.com/jam-systems/jam) as the primary open-source reference implementation. MIT-adjacent, WebRTC-based, supports custom UI, closest to FISHBOWLZ's persistent room model. LiveKit (Go SFU, MIT) is the best open-source infrastructure if migrating from 100ms. |
| **Broadcast integration** | PRIORITIZE Farcaster Mini App frame over RTMP broadcast. In-feed room joining via Mini App metadata is the highest-leverage growth channel for ZAO's community. RTMP to X/YouTube is post-MVP (doc 255 already scopes this). |

---

## Comparison: Audio Room Platforms and What They Got Right/Wrong

| Platform | Peak Scale | What Worked | What Failed | FISHBOWLZ Lesson |
|----------|-----------|-------------|-------------|-------------------|
| **Clubhouse** | 10M downloads, $4B valuation (Feb 2021) | Audio-only (no video pressure), speaker/audience split, invite-only FOMO | Synchronous-only format killed retention post-pandemic. 50%+ layoffs Apr 2023. Pivoted to async voice messages. | Persistent rooms + transcripts = async-first by design. Already solved. |
| **X Spaces** | 300M+ user distribution | Built on existing social graph. Celebrity adoption. No new app install. | Mute Bug causes silent recordings. Ghost Spaces after 30-60 days. Opus codec compression artifacts. Ticketed Spaces underperforming. | Recording reliability is critical. FISHBOWLZ transcripts are text-first (no audio codec issues). |
| **Discord Stage** | 10,000 participants per stage, 500M registered users | Speaker/audience split. Text chat alongside audio. Always-on voice channels create "ambient presence". | Not standalone - buried inside Discord servers. 50-person video cap. No transcript/search. | Ambient presence model is the goal. "Room exists whether anyone is in it." |
| **Spotify Greenroom** | 275,000 iOS downloads before shutdown Apr 2023 | Professional audio quality (Spotify infrastructure). Creator tools. | Launched into dying synchronous trend. Only 275K downloads despite Spotify's 600M+ users. | Don't build synchronous-only. FISHBOWLZ's transcript archive makes every room valuable post-session. |
| **Amazon Amp** | ~700,000 MAU at peak before shutdown Oct 2023 | Celebrity hosts (Nicki Minaj, Pusha T). Licensed music integration. | Creator fund couldn't substitute for product-market fit. Shut down 14 months after launch. | Product-market fit before monetization. Token launch deferred until 50+ weekly active rooms (doc 280). |
| **Jam (open source)** | 1,200+ GitHub stars | WebRTC rooms, custom UI, self-hostable, persistent room URLs. Mini-conference format. | Small community, limited maintenance. No mobile app. | Best open-source reference for FISHBOWLZ's persistent room model. |
| **LiveKit** | 12,500+ GitHub stars, Go SFU | Open-source SFU with agent SDK. Speaker detection, simulcast, E2EE. Client SDKs for 9 platforms. | Self-hosted requires infrastructure. Cloud pricing ($4/1000 min audio) higher than Stream.io. | Best migration target if 100ms becomes limiting. Agent SDK aligns with doc 290 agent participants. |

---

## UX Patterns That Work

### 1. Speaker/Audience Separation (Universal Pattern)

Every successful audio room implements a clear visual split between speakers (top, larger avatars, speaking indicators) and audience (bottom, smaller, grid layout). FISHBOWLZ already has this via the hot seat mechanic, but should add:
- **Speaking indicator**: Pulsing ring around avatar when audio is detected (100ms provides `selectIsSpeaking` selector)
- **Hand raise queue**: Numbered queue visible to everyone, not just the host
- **"Next up" preview**: Show who rotates in next so audience can prepare

### 2. Ambient Presence (Discord Model)

Discord's always-on voice channels succeed because:
- Users see who's in the channel without joining
- Joining is one click, no "room creation" step
- Background audio while doing other things

**FISHBOWLZ implementation**: Show a persistent mini-player/banner on the room list page showing "3 people in Jazz Theory Room right now" with a one-tap join button.

### 3. Fishbowl Rotation Protocol

Based on proven fishbowl discussion formats:
- **Inner circle (hot seat)**: 3-5 speakers, timed rotation (5 min default)
- **Outer circle (audience)**: Can raise hand, join queue
- **Hot seat pop-in**: 2-minute guest slot for quick questions/reactions
- **Auto-rotation**: Timer expires, current speaker moves to audience, next in queue enters
- **Host override**: Host can extend time, skip, or invite specific audience members

### 4. Room States and Lifecycle

| State | Visual | Audio | Actions Available |
|-------|--------|-------|-------------------|
| **Scheduled** | Calendar icon, countdown timer | None | RSVP, share, set reminder |
| **Live** | Green dot, speaker count, waveform | Active | Join, listen, raise hand, chat |
| **Paused** | Yellow dot, "Host away" | None | Browse transcript, chat (async) |
| **Ended** | Gray, "Session ended" | Playback (if recorded) | Read transcript, share highlights |
| **Persistent idle** | Dim, "No one here" | None | Join to restart, read past transcripts |

---

## Reconnection and Error Handling

### WebRTC Reconnection Strategy

```
User disconnects (mobile switch, WiFi drop, background tab)
  |
  v
Monitor iceConnectionState === "disconnected" or "failed"
  |
  v
Show "Reconnecting..." banner (no disruptive modal)
  |
  v
Attempt ICE restart: createOffer({ iceRestart: true })
  |
  v
If reconnected within 15s: restore state silently, log event
  |
  v
If failed after 15s: unpublish streams, attempt full rejoin
  |
  v
If rejoin fails after 30s: show "Connection lost" with manual retry button
  |
  v
Preserve chat history and queue position across reconnects
```

### 100ms-Specific Handling

100ms SDK handles most reconnection internally via `onReconnecting` and `onReconnected` callbacks. Key additions for FISHBOWLZ:
- **Queue position preservation**: Store hot seat queue in Supabase (not just client state) so reconnecting users keep their place
- **Transcript continuity**: Transcription runs server-side, so no gaps during client reconnects
- **Mobile background**: Use `keepScreenAwake` (Wake Lock API) for active speakers. Listeners can background the app - audio continues via `HTMLAudioElement`.
- **Rate limit reconnection attempts**: Max 3 auto-retries in 60 seconds to avoid server hammering

---

## Retention and Engagement

### The Numbers

| Metric | Industry Average | Target for FISHBOWLZ |
|--------|-----------------|---------------------|
| D1 retention (social apps) | 26.3% | 35%+ (community depth advantage) |
| D7 retention (social apps) | 12.1% | 20%+ |
| D30 retention (social apps) | 4.4% | 15%+ (scheduled rooms create habit) |
| Sub-3-min activation | 2x higher retention | Required - anonymous listen mode |
| First-session abandonment | 25% abandon after one use | Target <15% with immediate live room |
| DAU/MAU stickiness (top social) | 50%+ (WhatsApp/Facebook) | 25%+ (niche community target) |

### Proven Retention Mechanics for Audio Rooms

1. **Scheduled rooms with notifications**: "Jazz Theory Fishbowl - Every Tuesday 7pm EST" with push/email 15 min before. This is the single highest-impact retention feature for social audio.

2. **Post-session summaries**: AI-generated "You missed this fishbowl" digest with key quotes, topics, and a link to the full transcript. Delivered via Farcaster cast or XMTP message. Brings back users who couldn't attend live.

3. **Speaker streaks and badges**: "Spoke in 5 consecutive sessions" badge on Farcaster profile. Gamification works - apps with visible progress see 30%+ higher retention.

4. **Ambient presence indicators**: Show room activity on the main feed. "Steve is in the Jazz Fishbowl right now" creates social pull.

5. **Personalized room recommendations**: AI recommends rooms based on past participation, topics, and social graph. "Your friend Alex just joined a room about vinyl production."

6. **Replay with highlights**: Mark key moments in transcripts. "Most-reacted segment" becomes a shareable clip. Extends room value beyond the live session.

---

## Moderation Essentials

### Tier 1: Ship Now (Host Controls)

- **Mute speaker**: Host can mute any speaker instantly
- **Remove from hot seat**: Move speaker back to audience
- **Kick from room**: Remove user entirely (with optional ban)
- **Lock room**: Prevent new joins during sensitive discussions
- **Slow mode chat**: Rate limit chat messages (1 per 30s)

### Tier 2: Ship Next (Automated)

- **Perspective API for chat**: Already in ZAO OS (`src/lib/moderation/moderate.ts`). Score chat messages, auto-hide if toxicity > 0.8
- **Transcript keyword alerts**: Flag transcript segments containing slurs or threats for host review
- **Auto-mute on rejoining after kick**: Prevent kicked users from immediately returning to speak

### Tier 3: Future (AI-Powered)

- **Real-time audio moderation**: Services like Modulate.ai analyze tone and content in real-time. Cost: ~$0.02-0.05/min. Only viable at 500+ concurrent rooms.
- **Community flagging**: Users flag transcript segments, community votes on violations (aligns with ZAO's governance model)
- **EU DSA compliance**: Notice-and-action workflows for audio content. Trusted flagger integration. Required if serving EU users.

---

## Accessibility

### Must-Have (Ship with MVP)

1. **Live captions display**: Show real-time transcript text below the speaker list. FISHBOWLZ already has transcript infrastructure - surface it as live captions. This serves deaf/hard-of-hearing users AND anyone in a noisy/quiet environment.

2. **Speaker identification in captions**: Label each transcript line with the speaker's name. "Steve: I think the chord progression should..." Essential for following multi-speaker conversations via text.

3. **ARIA live regions**: Use `aria-live="polite"` for speaker changes and `aria-live="assertive"` for moderation actions (mute, kick). Screen readers announce these automatically.

4. **Keyboard navigation**: Tab through speakers, Enter to raise hand, Escape to leave room. All controls must be keyboard-accessible.

5. **High contrast mode**: Speaker/audience indicators must meet WCAG 2.1 AA contrast ratios (4.5:1 for text, 3:1 for UI components). ZAO's gold-on-navy (#f5a623 on #0a1628) passes AA for large text but fails for small text - add a white text alternative.

### Nice-to-Have (Post-MVP)

6. **Playback speed for transcripts**: 1x, 1.5x, 2x playback of recorded audio (Clubhouse's async pivot added 2x speed as a key feature)
7. **Sign language interpreter slot**: Dedicated video slot for ASL interpreter (no audio, camera-only participant role)
8. **Haptic feedback**: Vibration when it's your turn in the hot seat queue (already scaffolded in ZAO's PlayerProvider)

---

## Real-Time Transcription: Provider Comparison

| Provider | Price/Min | Latency | Accuracy | Speaker Diarization | WebSocket Streaming | Languages |
|----------|-----------|---------|----------|---------------------|--------------------|-----------| 
| **Deepgram Nova-2** | $0.0043 | <300ms | 99%+ | Yes | Yes (native) | 30+ |
| **OpenAI Whisper API** | $0.006 | Batch only | 97%+ | No | No (REST only) | 99 |
| **OpenAI Realtime API** | ~$0.06 (input+output) | Real-time | 98%+ | No | Yes (WebSocket) | Limited |
| **AssemblyAI** | $0.0065 | <500ms | 98%+ | Yes | Yes | 12 |
| **WhisperLiveKit (self-hosted)** | Free (GPU cost) | <500ms | 97%+ | Via plugin | Yes (Deepgram-compatible) | 99 |
| **100ms Built-in** | Included in plan | ~1-2s | 95%+ | Yes (per-peer) | Via SDK events | 10+ |

**Recommendation**: Start with 100ms built-in transcription (zero additional cost, already integrated). Migrate to Deepgram Nova-2 when you need better accuracy, more languages, or the transcript archive becomes a key product surface. At 10 hrs/week, Deepgram costs ~$2.58/month.

---

## Open Source Reference Implementations

### Jam (github.com/jam-systems/jam)

- **Stars**: 1,200+ | **License**: AGPL-3.0 | **Last active**: 2024
- WebRTC-based, persistent room URLs, custom theming
- Best match for FISHBOWLZ's "rooms that persist" model
- Lacks: hot seat rotation, transcription, mobile app

### LiveKit (github.com/livekit/livekit)

- **Stars**: 12,500+ | **License**: Apache-2.0 | **Last active**: Active (2026)
- Go-based SFU with agent SDK, speaker detection, simulcast, E2EE
- Client SDKs for JS, iOS, Android, Flutter, React Native, Unity, Go, Rust
- Agent framework for AI participants (aligns with doc 290)
- Egress (recording/streaming) and Ingress (RTMP/WHIP) built-in
- Best migration path if outgrowing 100ms

### Resonate (github.com/AOSSIE-Org/Resonate)

- **Stars**: 300+ | **License**: Apache-2.0
- Social voice platform, Clubhouse-style, open-source
- Flutter-based (cross-platform mobile)
- Less active than LiveKit but closer to social audio product

### 100ms Official Examples

- **Clubhouse clone**: 100ms.live/blog/clubhouse-clone-react (full tutorial)
- **Discord Stage clone**: 100ms.live/blog/discord-stage-clone (Next.js)
- **Architecture**: Global store (HMS Store) + Actions (HMS Actions), similar to Redux pattern

---

## ZAO OS Integration

### Existing Files (FISHBOWLZ)

| Area | Files | Notes |
|------|-------|-------|
| Pages | `src/app/fishbowlz/page.tsx`, `src/app/fishbowlz/[id]/page.tsx` | Room list + room detail |
| API Routes | `src/app/api/fishbowlz/{rooms,chat,events,sessions,transcribe,transcripts}/route.ts` | 7 endpoints |
| Components | `src/components/spaces/{HMSFishbowlRoom,FishbowlChat,TranscriptInput}.tsx` | 5 components |
| Lib | `src/lib/fishbowlz/{logger,castRoom}.ts` | Event logging + Farcaster cast |
| Moderation | `src/lib/moderation/moderate.ts` | Perspective API (reuse for chat moderation) |
| Player | `src/providers/audio/PlayerProvider.tsx` | Wake Lock, MediaSession, haptics (reuse for audio rooms) |
| DB | `supabase/migrations/20260404_fishbowlz.sql`, `20260405_fishbowl_chat.sql`, `20260405_fishbowl_scheduled.sql` | 5 tables |

### New Files Needed

| File | Purpose |
|------|---------|
| `src/components/fishbowlz/ReconnectionBanner.tsx` | "Reconnecting..." UI with retry logic |
| `src/components/fishbowlz/HotSeatTimer.tsx` | Countdown timer with rotation queue |
| `src/components/fishbowlz/LiveCaptions.tsx` | Real-time transcript display for accessibility |
| `src/components/fishbowlz/RoomStateIndicator.tsx` | Live/Scheduled/Paused/Ended visual states |
| `src/components/fishbowlz/AmbientPresence.tsx` | "3 people in room" banner for room list |
| `src/hooks/useReconnection.ts` | ICE restart + auto-rejoin logic |
| `src/hooks/useHotSeatRotation.ts` | Timer, queue management, auto-rotation |
| `src/app/api/fishbowlz/schedule/route.ts` | Scheduled rooms + notification triggers |
| `src/lib/fishbowlz/deepgramStream.ts` | Deepgram WebSocket integration (when upgrading from 100ms transcription) |

### Priority Implementation Order

1. **ReconnectionBanner + useReconnection** - P0, retention killer if users drop and can't rejoin
2. **HotSeatTimer + useHotSeatRotation** - P0, core fishbowl mechanic needs visible timer
3. **RoomStateIndicator + AmbientPresence** - P1, drives discovery and "ambient presence"
4. **LiveCaptions** - P1, accessibility + competitive differentiator
5. **Schedule API + notifications** - P1, highest-impact retention feature
6. **Deepgram migration** - P2, when transcript quality needs improvement

---

## What FISHBOWLZ Should Implement Next (Competitive Priorities)

### Immediate (This Week)

1. **Anonymous listen mode** - Let anyone hear a live room without auth. Auth required only to speak/chat. This alone could 2x activation rate.
2. **Reconnection handling** - Mobile users will rage-quit if dropped audio means losing queue position. Store queue in Supabase, show "Reconnecting..." banner.
3. **Hot seat countdown timer** - Visual timer with audible chime. Without this, rotation feels arbitrary.

### Next Sprint

4. **Scheduled rooms with reminders** - "Every Tuesday 7pm" with push notification 15 min before. Single highest-impact retention feature.
5. **Post-session AI summaries** - Agent generates 3-paragraph summary + key quotes, casts to Farcaster. Drives async engagement.
6. **Live captions** - Surface existing transcript as real-time captions. Accessibility win + unique differentiator.

### Next Month

7. **Speaker streaks/badges** - Gamification on Farcaster profile
8. **Farcaster Mini App frame** - In-feed room joining without leaving the client
9. **Deepgram transcription upgrade** - Better accuracy, speaker diarization, 30+ languages
10. **Community moderation** - Transcript flagging, community voting on violations

---

## Sources

- [Voice UI Design Guide 2026](https://fuselabcreative.com/voice-user-interface-design-guide-2026/)
- [Social Audio Apps 2026 - Product Hunt](https://www.producthunt.com/categories/social-audio)
- [How to Build a Social Audio App](https://www.biz4group.com/blog/build-social-audio-app)
- [6 Social Audio Apps in 2026](https://trio-media.co.uk/6-social-audio-platforms-you-need-to-be-aware-of/)
- [100ms React Quickstart](https://www.100ms.live/docs/javascript/v2/quickstart/react-quickstart)
- [Building a Clubhouse Clone in React (100ms)](https://www.100ms.live/blog/clubhouse-clone-react)
- [Build a Discord Stage Clone with 100ms](https://www.100ms.live/blog/discord-stage-clone)
- [Handling WebRTC Session Disconnections](https://bloggeek.me/handling-session-disconnections-in-webrtc/)
- [Implementing Reconnection for WebRTC Mobile Apps](https://webrtc.ventures/2023/06/implementing-a-reconnection-mechanism-for-webrtc-mobile-applications/)
- [App Retention Benchmarks 2026](https://enable3.io/blog/app-retention-benchmarks-2025)
- [Mobile App Retention Statistics 2025](https://www.amraandelma.com/mobile-app-retention-statistics/)
- [App Engagement Strategies 2025](https://www.businessofapps.com/marketplace/app-engagement/research/app-engagement-strategies/)
- [Audio Voice Moderation Guide 2025 (Stream.io)](https://getstream.io/blog/audio-voice-moderation/)
- [Modern Moderation for Audio Networks](https://followers-twitter.com/en/voice-network-ethics/)
- [Community-Driven Content Moderation](https://www.audiorista.com/trends/rise-of-community-driven-content-moderation)
- [Modulate.ai - Voice Intelligence](https://www.modulate.ai/solutions/gaming)
- [Clubhouse Statistics 2025](https://electroiq.com/stats/clubhouse-statistics/)
- [X Spaces vs Clubhouse Evolution](https://www.sunrisegeek.com/comparison/x-spaces-vs-clubhouse-examining-the-evolution-of-social-audio-platforms)
- [Fishbowl Conversation (Wikipedia)](https://en.wikipedia.org/wiki/Fishbowl_(conversation))
- [How to Facilitate a Virtual Fishbowl](https://guides.pipdecks.com/workshop-tactics/how-to-facilitate-a-remote-virtual-fishbowl-discussion/)
- [Deepgram Speech-to-Text API](https://deepgram.com/product/speech-to-text)
- [Best Speech-to-Text APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [Real-Time Audio Transcription (Fishjam)](https://fishjam.swmansion.com/blog/real-time-audio-transcription-api-how-to-turn-speech-to-text-during-live-conferencing-f77e2ff3f4de)
- [LiveKit - Open Source WebRTC](https://github.com/livekit/livekit)
- [LiveKit Docs](https://docs.livekit.io/intro/overview/)
- [Jam - Open Source Audio Rooms](https://github.com/jam-systems/jam)
- [Resonate - Open Source Social Voice](https://github.com/AOSSIE-Org/Resonate)
- [Discord Stage Channels FAQ](https://support.discord.com/hc/en-us/articles/1500005513722-Stage-Channels-FAQ)
- [Ava - Live Captions Accessibility](https://www.ava.me)
- [Digital Accessibility for Deaf/HoH (AudioEye)](https://www.audioeye.com/post/digital-accessibility-deaf-hard-of-hearing/)
