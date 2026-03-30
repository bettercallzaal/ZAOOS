# 217 -- Audio/Video Quality Optimization for Live Streaming

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Optimize audio and video quality for ZAO OS live streaming -- Stream.io settings, adaptive bitrate, audio-only music rooms, WebRTC vs RTMP, noise suppression, low-latency DJ audio, browser system audio capture
> **Updates:** Doc 43 (WebRTC research), Doc 160 (audio spaces landscape), Doc 192 (RTMP multistreaming), Doc 213 (spaces architecture)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Music rooms audio** | Enable Stream.io HiFi mode -- disables echo cancellation/noise suppression/AGC, switches to stereo 128 kbps Opus |
| **Voice rooms audio** | Keep default WebRTC processing ON (echo cancellation, noise suppression, AGC) |
| **Video codec** | Let Stream.io Dynascale handle codec selection (AV1 > VP9 > H.264 adaptive) |
| **Adaptive bitrate** | Already handled by Stream.io Simulcast + SVC -- no custom work needed |
| **Noise suppression** | Add Krisp SDK as optional toggle for voice rooms (superior to built-in WebRTC NS) |
| **DJ mode audio capture** | Use `getDisplayMedia({ video: true, audio: { systemAudio: 'include' } })` + discard video track |
| **Low-latency DJ sets** | WebRTC (sub-500ms) for interactive rooms; RTMP relay via Livepeer for broadcast to YouTube/Twitch |
| **Priority implementation** | 1) HiFi toggle for music rooms, 2) System audio capture for DJ mode, 3) Krisp noise cancellation |

---

## Part 1: Stream.io Video SDK Quality Settings

### Current ZAO OS Configuration

ZAO OS uses Stream.io's `audio_room` call type for `/spaces`. Key files:

| File | Role |
|------|------|
| `src/app/spaces/[id]/page.tsx` | Initializes `StreamVideoClient`, joins `audio_room` call |
| `src/components/spaces/RoomView.tsx` | Main room layout, broadcast controls, music sidebar |
| `src/components/spaces/MicButton.tsx` | Mic toggle, permission request for `SEND_AUDIO` |
| `src/components/spaces/ScreenShareButton.tsx` | Screen share via `call.screenShare.toggle()` |
| `src/lib/spaces/rtmpManager.ts` | RTMP broadcast orchestration (direct + Livepeer relay) |
| `src/lib/livepeer/client.ts` | Livepeer multistream API client |
| `src/components/spaces/HMSRoom.tsx` | Alternative 100ms provider for audio rooms |

### Stream.io Quality Features (Available Now)

**Dynascale (Automatic):**
- Automatically selects codec per device: AV1 on powerful devices, H.264/VP9 on older ones
- Adjusts resolution based on display size (thumbnail = low quality, fullscreen = high quality)
- No configuration needed -- works out of the box

**Codec Priority (Server-Managed):**

| Codec | Quality/Bitrate Efficiency | Browser Support |
|-------|---------------------------|-----------------|
| AV1 | Best (50% less bitrate than H.264) | Chrome 94+, Firefox 98+, Safari 17+ |
| VP9 | Very good | Chrome, Firefox, Edge |
| H.264 | Good (widest support) | All browsers |
| VP8 | Legacy fallback | All browsers |

**Resolution Targets (Dashboard Configurable):**

| Preset | Resolution | Bitrate (30fps) | Bitrate (60fps) | Use Case |
|--------|-----------|-----------------|-----------------|----------|
| Low | 360p | 400-600 kbps | N/A | Mobile, poor connections |
| Medium | 720p | 1.5-2.5 Mbps | 2.5-4 Mbps | Default for most calls |
| High | 1080p | 3-5 Mbps | 5-8 Mbps | Screen share, presentations |
| 4K | 2160p | 13-20 Mbps | 20-35 Mbps | Professional streaming (rare) |

**Frame Rate:**
- 30fps default for video calls
- 60fps available but requires 1.5-2x higher bitrate
- Screen share can use lower frame rate (15fps) with higher resolution

### High-Fidelity (HiFi) Audio Mode

Stream.io has a dedicated HiFi audio mode specifically designed for music. This is the single most important optimization for ZAO OS music rooms.

**What HiFi mode does:**
1. Disables echo cancellation
2. Disables noise suppression
3. Disables automatic gain control (AGC)
4. Enables stereo capture (2 channels instead of mono)
5. Switches to high-quality music bitrate profile

**How to enable:**
- Dashboard: Toggle "Allow HiFi audio" on the `audio_room` call type
- Code: Use `MUSIC_HIGH_QUALITY` audio bitrate profile before joining

**When to use:**
- Music listening rooms (DJ mode, listening parties)
- Live performance streaming
- Podcast recording where natural sound matters

**When NOT to use:**
- Voice-only discussion rooms (echo cancellation needed)
- Rooms with background noise (noise suppression needed)

---

## Part 2: Adaptive Bitrate Streaming

### How It Works in ZAO OS (Already Handled)

Stream.io handles adaptive bitrate automatically using two techniques:

**Simulcast (Default for Video):**
- Sender publishes 2-3 quality layers simultaneously (e.g., 360p + 720p + 1080p)
- SFU selects the appropriate layer per receiver based on bandwidth
- Receivers with poor connections get the lowest layer automatically
- No buffering or quality negotiation needed

**Scalable Video Coding (SVC):**
- Single stream with embedded quality layers (base + enhancement)
- Receiver decodes only the layers their connection supports
- More bandwidth-efficient than Simulcast
- Used with AV1 and VP9 codecs

### What ZAO OS Gets for Free

| Feature | How It Works |
|---------|-------------|
| Per-viewer quality | Each participant receives the quality their connection can handle |
| Dynamic switching | Quality adjusts in real-time as network conditions change |
| No rebuffering | Graceful degradation -- drops quality before dropping frames |
| CPU awareness | Adjusts encoding complexity based on device capability |

### What Could Be Configured (Optional)

**Minimum quality floor:**
- Set a minimum bitrate/resolution so quality never drops below a threshold
- Useful for music rooms where audio quality must stay high
- Risk: participants with very poor connections may experience drops

**Preferred codec override:**
- Force AV1 for maximum quality-per-bit (excludes older devices)
- Not recommended -- let Dynascale handle this automatically

### Recommendation

No custom adaptive bitrate work is needed. Stream.io's built-in Simulcast + SVC + Dynascale is production-grade. The only optimization is enabling HiFi audio mode for music rooms.

---

## Part 3: Audio-Only Optimization for Music Rooms

### The Problem

WebRTC audio processing (echo cancellation, noise suppression, AGC) is designed for speech:
- Optimized for 300-3400 Hz (voice frequency range)
- Compresses dynamic range (destroys music dynamics)
- Mono encoding at 24-48 kbps
- Aggressively removes "noise" that includes musical instruments

### Voice vs Music Audio Settings

| Parameter | Voice (Default) | Music (HiFi) | Difference |
|-----------|----------------|---------------|------------|
| Echo cancellation | ON | OFF | Music sounds natural |
| Noise suppression | ON | OFF | Preserves full frequency range |
| Auto gain control | ON | OFF | Preserves dynamics |
| Channels | Mono | Stereo | Spatial audio preserved |
| Bitrate | 24-48 kbps | 96-128 kbps | 3-5x more audio data |
| Sample rate | 16-24 kHz | 48 kHz | Full frequency range |
| Frequency range | 300-3400 Hz | 20-20,000 Hz | Full audible spectrum |
| Codec | Opus (speech) | Opus (music) | Same codec, different mode |

### Opus Codec for Music

Opus is already the WebRTC standard and is excellent for music at proper bitrates:

| Bitrate | Quality | Use Case |
|---------|---------|----------|
| 24-48 kbps mono | Voice-quality | Chat rooms, discussions |
| 64 kbps stereo | Good music | Acceptable for casual listening |
| 96 kbps stereo | Very good music | Recommended minimum for music rooms |
| 128 kbps stereo | Transparent | Indistinguishable from uncompressed for most listeners |
| 256 kbps stereo | Overkill | No audible benefit over 128 kbps |

**Recommendation:** 128 kbps stereo Opus is the sweet spot. Listening tests by Xiph.Org Foundation confirmed trained listeners cannot reliably distinguish 128 kbps Opus from uncompressed originals.

### Implementation: Dual Audio Mode for ZAO Rooms

ZAO rooms should support two audio profiles switchable by the host:

| Mode | When | Settings |
|------|------|----------|
| **Talk Mode** | Discussions, meetings, fractal calls | Default WebRTC processing ON, mono, 48 kbps |
| **Music Mode** | DJ sets, listening parties, live performance | HiFi ON, stereo, 128 kbps, all processing OFF |

The host toggles between modes. When switching to Music Mode, all participants' audio processing is disabled server-side via the Stream.io call settings.

---

## Part 4: WebRTC vs RTMP Quality Comparison

### Head-to-Head

| Dimension | WebRTC | RTMP |
|-----------|--------|------|
| **Latency** | 200-500 ms | 3-5 seconds |
| **Direction** | Bidirectional (talk + listen) | Unidirectional (broadcast only) |
| **Audio quality** | 128 kbps Opus stereo (HiFi) | 128-320 kbps AAC stereo |
| **Video quality** | AV1/VP9/H.264, adaptive | H.264 fixed bitrate |
| **Adaptive bitrate** | Real-time per-viewer | Server-side transcoding |
| **Max viewers** | ~50 (needs SFU beyond P2P) | Unlimited (CDN delivery) |
| **Interaction** | Two-way audio/video | One-way (chat overlay only) |
| **Browser support** | All modern browsers | Requires player (HLS/DASH) |
| **Server cost** | SFU per-participant | Transcoder + CDN |
| **Best for** | Interactive rooms (<50 people) | Broadcast to large audiences |

### ZAO OS Streaming Architecture (Current)

```
ZAO Audio Room (WebRTC via Stream.io)
  |
  +-- Participants talk (bidirectional, <500ms latency)
  |
  +-- RTMP Out (Stream.io native)
  |     +-- YouTube Live (3-5s latency)
  |     +-- Twitch (3-5s latency)
  |     +-- Facebook Live (3-5s latency)
  |
  +-- RTMP Out via Livepeer Relay
        +-- Multiple targets (fan-out)
        +-- Transcoding to adaptive HLS
```

### Quality Impact of RTMP Re-encoding

When Stream.io sends RTMP to YouTube/Twitch, there is a quality loss from re-encoding:
1. WebRTC Opus audio -> RTMP AAC (transcoding loss)
2. WebRTC VP9/AV1 video -> RTMP H.264 (transcoding loss)
3. Each platform re-encodes again for their adaptive streams

**Mitigation:**
- Use highest source quality in the room (HiFi audio, 1080p video)
- Stream.io handles the WebRTC-to-RTMP transcoding at their edge
- Livepeer relay provides better quality than double-transcoding through two services

### Emerging Protocol: Media over QUIC (MOQ)

MOQ combines the best of both worlds:
- Sub-second latency (like WebRTC)
- CDN-scalable (like HLS)
- Built on QUIC/WebTransport
- Still early (2025-2026 adoption phase)

**Recommendation:** Monitor MOQ adoption. For now, WebRTC for interactive rooms + RTMP for broadcast is the correct architecture.

---

## Part 5: Noise Suppression / Echo Cancellation

### Three Tiers of Noise Suppression

| Tier | Technology | Quality | CPU Cost | Implementation |
|------|-----------|---------|----------|----------------|
| **Built-in WebRTC** | Browser native | Basic (removes obvious noise) | Negligible | Already enabled by default |
| **RNNoise** | Mozilla RNN (WASM) | Good (deep learning, handles more noise types) | Low | Open source, self-hosted WASM |
| **Krisp SDK** | Commercial neural network (WASM) | Excellent (best-in-class, handles music vs noise) | Medium | Licensed SDK, pay per usage |

### WebRTC Built-in (Current in ZAO OS)

```typescript
// These are ON by default when getting user media
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
};
```

**Limitations:**
- Suppresses some musical content as "noise"
- Echo cancellation can create artifacts during music playback
- No distinction between unwanted noise and musical instruments
- Quality varies significantly across browsers

### RNNoise (Free, Open Source)

- Mozilla project, compiled to WASM via Emscripten
- 48 kHz sample rate, processes in 10ms frames
- Small model size (~100 KB WASM)
- Low CPU usage -- runs on smartphones
- Works as a Web Audio API AudioWorklet node

**Pros:** Free, self-hosted, no API keys, decent quality
**Cons:** No echo cancellation, voice-focused (not music-aware)

### Krisp SDK (Commercial, Best Quality)

- Browser SDK with WASM-based neural network
- Processes audio in a dedicated Worker thread (no main thread blocking)
- Supports both noise cancellation AND echo cancellation
- Music-aware -- distinguishes between speech, music, and noise
- Integrated with WebRTC and Web Audio API

**Pricing:** Per-minute usage, enterprise licensing
**Integration:** Drop-in audio filter node between mic input and WebRTC track

### Recommendation for ZAO OS

| Room Type | Noise Suppression Strategy |
|-----------|---------------------------|
| **Voice rooms** (discussions, fractal calls) | WebRTC built-in (free, already working) + optional Krisp toggle for noisy environments |
| **Music rooms** (DJ sets, listening parties) | ALL processing OFF (HiFi mode) -- noise suppression destroys music |
| **Hybrid rooms** (voice + music playback) | Voice tracks: WebRTC NS ON. Music track: separate channel, no processing |

**Priority:** Krisp is a nice-to-have, not a must-have. The built-in WebRTC noise suppression is sufficient for most ZAO use cases. Focus on HiFi mode first.

---

## Part 6: Low-Latency Audio for DJ Sets

### Latency Budget for DJ Sets

| Component | Typical Latency | Optimized |
|-----------|----------------|-----------|
| Audio capture (mic/system) | 10-30 ms | 10 ms |
| Encoding (Opus) | 20-60 ms | 20 ms (frame size) |
| Network (WebRTC UDP) | 20-100 ms | 20 ms (same region) |
| Jitter buffer | 40-100 ms | 40 ms (minimum) |
| Decoding | 10-20 ms | 10 ms |
| Audio playback | 10-30 ms | 10 ms |
| **Total** | **110-340 ms** | **~110 ms** |

### DJ Set Requirements

For DJ sets, the critical latency paths are:

1. **DJ's system audio -> listeners:** Must be under 500ms for the audience to feel "live"
2. **DJ's voice -> listeners:** Same path, mixed with music
3. **Listener reaction -> DJ:** Less critical (chat/reactions can have 1-2s delay)

### Optimization Strategies

**Reduce Opus frame size:**
- Default: 20ms frames (good balance)
- Aggressive: 10ms frames (lower latency, slightly higher bitrate)
- Stream.io manages this server-side

**Reduce jitter buffer:**
- Default: 40-100ms adaptive
- For DJ sets: fixed 40ms minimum
- Trade-off: more audio glitches on poor connections

**Regional SFU selection:**
- Stream.io automatically selects nearest edge server
- For planned events, pre-warm the SFU in the target region

**Disable video when audio-only:**
- Reduces bandwidth competition
- Allows more bitrate allocated to audio
- ZAO rooms are primarily audio -- video is optional

### Comparison with Specialized Tools

| Tool | Latency | Use Case |
|------|---------|----------|
| **FarPlay** | <10 ms | Remote musical performance (requires dedicated app) |
| **JackTrip** | <10 ms | Uncompressed audio over dedicated networks |
| **ZAO OS (WebRTC)** | 200-500 ms | Social DJ rooms (sufficient for audience listening) |
| **OBS + RTMP** | 3-5 seconds | Broadcast to YouTube/Twitch |

**Key insight:** ZAO does not need sub-10ms latency. DJ sets in ZAO rooms are social listening experiences, not remote collaborative performances. 200-500ms WebRTC latency is perfectly acceptable for an audience hearing the DJ's mix.

---

## Part 7: Browser Audio Capture for DJ Mode

### The Challenge

DJ mode requires capturing system audio (music from Spotify, Ableton, browser tabs, etc.) and sharing it with room participants. Browsers sandbox audio -- you cannot directly access system audio output.

### Solution: getDisplayMedia with System Audio

```typescript
// Request screen share WITH system audio
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: true,  // Required -- cannot be false
  audio: {
    systemAudio: 'include',  // Request system audio capture
  }
});

// Extract just the audio track
const audioTrack = stream.getAudioTracks()[0];

// Discard the video track (we only want audio for DJ mode)
const videoTrack = stream.getVideoTracks()[0];
videoTrack.stop();

// Publish the audio track to the WebRTC room
// (Stream.io SDK handles this via custom tracks)
```

### Browser Support Matrix

| Browser | System Audio | Tab Audio | Notes |
|---------|-------------|-----------|-------|
| Chrome 141+ | Yes (macOS 14.2+) | Yes | Best support, user must check "Share audio" |
| Edge | Yes | Yes | Same Chromium engine as Chrome |
| Firefox | No | No | `getDisplayMedia` ignores `audio` parameter entirely |
| Safari | Partial | No | API exists but audio does not work |
| Mobile browsers | No | No | Not supported on any mobile browser |

### Workaround: Tab Audio (More Reliable)

If the DJ plays music from a browser tab (e.g., Audius, SoundCloud, YouTube in another tab):

```typescript
// Share a specific browser tab -- audio capture works more reliably
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: true,
  // Chrome shows tab picker with "Share tab audio" checkbox
});
```

This works on Chrome/Edge when the user selects "Chrome Tab" and checks "Share tab audio."

### Combining Mic + System Audio (Web Audio API)

For DJs who want to talk over music:

```
System Audio (getDisplayMedia) ---> Web Audio API mixer ---> Single output track
Microphone (getUserMedia)      --->                    ---> Published to room
```

```typescript
// Conceptual flow (not production code)
const audioCtx = new AudioContext();
const systemSource = audioCtx.createMediaStreamSource(systemStream);
const micSource = audioCtx.createMediaStreamSource(micStream);
const destination = audioCtx.createMediaStreamDestination();

// Optional: gain nodes for volume control
const systemGain = audioCtx.createGain();
const micGain = audioCtx.createGain();

systemSource.connect(systemGain).connect(destination);
micSource.connect(micGain).connect(destination);

// destination.stream is the mixed output to publish
```

### Limitations and Workarounds

| Limitation | Workaround |
|-----------|------------|
| Video track required | Capture then immediately `stop()` the video track |
| User must manually check "Share audio" | UI prompt explaining the step |
| Firefox/Safari no support | Show "Use Chrome for DJ mode" message |
| Mobile not supported | DJ mode is desktop-only (acceptable for ZAO) |
| Echo if DJ hears room audio | DJ should use headphones (standard practice) |
| System audio includes all sounds | DJ should close notification sounds, other apps |

### Current ZAO OS Screen Share Code

`src/components/spaces/ScreenShareButton.tsx` uses `call.screenShare.toggle()` which delegates to Stream.io's SDK. To add DJ audio mode, a separate audio-only capture flow is needed that:

1. Calls `getDisplayMedia` with `audio: { systemAudio: 'include' }`
2. Extracts the audio track
3. Stops the video track
4. Publishes the audio track as a custom track to the Stream.io call

This is a **new component** (`DJAudioButton.tsx`), not a modification to `ScreenShareButton.tsx`.

---

## Part 8: Implementation Priority

### Phase 1: HiFi Audio Toggle (Highest Impact, Lowest Effort)

**What:** Enable Stream.io HiFi mode for music rooms.
**Where:** Stream.io dashboard (toggle "Allow HiFi audio" on `audio_room` call type) + code to activate per-room.
**Impact:** Dramatically improves music quality in listening parties and DJ sets.
**Effort:** ~2 hours (dashboard config + toggle in room creation).

### Phase 2: DJ System Audio Capture (High Impact, Medium Effort)

**What:** New `DJAudioButton.tsx` component using `getDisplayMedia` to capture system audio.
**Where:** `src/components/spaces/DJAudioButton.tsx` + integration in `ControlsPanel.tsx`.
**Impact:** Enables true DJ mode where DJs share audio from any source app.
**Effort:** ~4-6 hours (component, Web Audio mixing, Chrome-only guard).

### Phase 3: Krisp Noise Cancellation (Medium Impact, Medium Effort)

**What:** Optional Krisp SDK toggle for voice rooms.
**Where:** New audio filter node between mic input and published track.
**Impact:** Better voice quality in noisy environments.
**Effort:** ~4 hours (SDK integration, UI toggle, licensing).

### Phase 4: Talk/Music Mode Toggle (Medium Impact, Low Effort)

**What:** Host can switch room between Talk Mode (voice processing ON) and Music Mode (HiFi, all processing OFF).
**Where:** `ControlsPanel.tsx` + call settings update via Stream.io API.
**Impact:** Rooms adapt to their use case dynamically.
**Effort:** ~3 hours.

### Phase 5: RTMP Quality Presets (Low Impact, Low Effort)

**What:** Pre-configured RTMP output quality presets (720p30, 1080p30, 1080p60).
**Where:** `BroadcastModal.tsx` quality selector.
**Impact:** Better quality when broadcasting to YouTube/Twitch.
**Effort:** ~2 hours.

---

## Part 9: File Inventory -- What Exists vs What to Build

### Existing Files (No Changes Needed)

| File | Why No Change |
|------|---------------|
| `src/lib/spaces/rtmpManager.ts` | RTMP orchestration is solid -- direct + relay modes work |
| `src/lib/livepeer/client.ts` | Livepeer client is complete |
| `src/components/spaces/ScreenShareButton.tsx` | Screen share is separate from DJ audio capture |

### Existing Files (Modify)

| File | Change |
|------|--------|
| `src/app/spaces/[id]/page.tsx` | Pass HiFi audio config when joining music rooms |
| `src/components/spaces/ControlsPanel.tsx` | Add DJ Audio button, Talk/Music mode toggle |
| `src/components/spaces/BroadcastModal.tsx` | Add quality preset selector for RTMP output |
| `src/components/spaces/RoomView.tsx` | Wire up new DJ audio and mode toggle state |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/spaces/DJAudioButton.tsx` | System audio capture via getDisplayMedia |
| `src/components/spaces/AudioModeToggle.tsx` | Talk Mode / Music Mode switch for hosts |
| `src/components/spaces/NoiseCancellation.tsx` | Optional Krisp/RNNoise toggle (Phase 3) |

---

## Sources

### Stream.io Documentation
- [Quality and Latency Guide](https://getstream.io/video/docs/api/quality/introduction/)
- [High Fidelity and Stereo Audio (JavaScript)](https://getstream.io/video/docs/javascript/guides/hifi-stereo-audio/)
- [High Fidelity Audio (Android)](https://getstream.io/video/docs/android/guides/high-fidelity-audio/)
- [Call Types](https://getstream.io/video/docs/react/guides/configuring-call-types/)
- [Camera and Microphone](https://getstream.io/video/docs/react/guides/camera-and-microphone/)
- [Noise Cancellation (React)](https://getstream.io/video/docs/react/guides/noise-cancellation/)
- [RTMP Ingress](https://getstream.io/video/docs/api/streaming/rtmp/)
- [WebRTC Codecs](https://getstream.io/resources/projects/webrtc/advanced/codecs/)
- [WebRTC Bitrates and Traffic](https://getstream.io/resources/projects/webrtc/advanced/bitrates-traffic/)
- [getDisplayMedia Screensharing](https://getstream.io/resources/projects/webrtc/basics/screensharing/)
- [HLS, MPEG-DASH, RTMP, and WebRTC Protocol Comparison](https://getstream.io/blog/protocol-comparison/)

### WebRTC and Streaming
- [Softvelum WebRTC Adaptive Bitrate Algorithm](https://softvelum.com/2024/12/webrtc-adaptive-bitrate-algorithm/)
- [WebRTC Video Optimization: Bitrate vs Frame Rate (WebRTC.ventures)](https://webrtc.ventures/2024/08/webrtc-video-optimization-the-crucial-balance-between-bitrate-and-frame-rate/)
- [WebRTC Latency Comparison 2026 (nanocosmos)](https://www.nanocosmos.net/blog/webrtc-latency/)
- [WebRTC vs RTMP (Ant Media)](https://antmedia.io/webrtc-vs-rtmp/)
- [RTMP vs HLS vs WebRTC (Dacast)](https://www.dacast.com/blog/rtmp-vs-hls-vs-webrtc/)
- [Low-Latency WebRTC Streaming (Flussonic)](https://flussonic.com/blog/article/low-latency-webrtc-streaming)
- [Best Audio Codec for Streaming 2026 (Ant Media)](https://antmedia.io/best-audio-codec/)

### Opus Codec
- [Opus Hydrogenaudio Knowledgebase](https://wiki.hydrogenaudio.org/index.php?title=Opus)
- [Opus Codec Explained (Wowza)](https://www.wowza.com/blog/opus-codec-the-audio-format-explained)
- [Codecs Used by WebRTC (MDN)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/WebRTC_codecs)

### Browser Audio Capture
- [getDisplayMedia Demo (AddPipe)](https://addpipe.com/getdisplaymedia-demo/)
- [getDisplayMedia MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
- [System Sounds on Chrome macOS (AddPipe Blog)](https://blog.addpipe.com/getdisplaymedia-allows-capturing-the-screen-with-system-sounds-on-chrome-on-macos/)
- [Browser System Audio Capture Learnings (DEV)](https://dev.to/flo152121063061/i-tried-to-capture-system-audio-in-the-browser-heres-what-i-learned-1f99)
- [getDisplayMedia for Recording with Audio on Jitsi (webrtcHacks)](https://webrtchacks.com/jitsi-recording-getdisplaymedia-audio/)

### Noise Suppression
- [Krisp Web Browser SDK](https://sdk-docs.krisp.ai/docs/introduction)
- [Krisp JS SDK Blog Post](https://krisp.ai/blog/breaking-the-audio-processing-barrier-on-the-web-with-krisp-js-sdk/)
- [Noise Reduction in WebRTC (Gcore)](https://gcore.com/blog/noise-reduction-webrtc)
- [RNNoise: Deep Learning Noise Suppression (Mozilla Hacks)](https://hacks.mozilla.org/2017/09/rnnoise-deep-learning-noise-suppression/)
- [LiveKit Enhanced Noise Cancellation](https://docs.livekit.io/transport/media/enhanced-noise-cancellation/)

### Low-Latency Music
- [Stream Music over WebRTC with React and WebAudio (LiveKit Blog)](https://blog.livekit.io/stream-music-over-webrtc-using-react-and-webaudio/)
- [FarPlay -- Ultra-Low-Latency Music Performance](https://farplay.io/)
- [3LAS -- Low Latency Live Audio Streaming (GitHub)](https://github.com/JoJoBond/3LAS)
- [Streaming Bitrate Guide (VideoSDK)](https://videosdk.live/developer-hub/hls/streaming-bitrate)

### Related ZAO OS Research
- [Doc 43 -- WebRTC Audio Rooms & Streaming](../043-webrtc-audio-rooms-streaming/)
- [Doc 160 -- Audio Spaces Landscape Comparison](../160-audio-spaces-landscape-comparison/)
- [Doc 192 -- Multi-Platform Streaming RTMP](../192-multiplatform-streaming-rtmp/)
- [Doc 213 -- Spaces & Streaming Architecture Debug Guide](../213-spaces-streaming-architecture-debug-guide/)
- [Doc 122 -- SongJam Screen Share PR](../122-songjam-screen-share-pr/)
