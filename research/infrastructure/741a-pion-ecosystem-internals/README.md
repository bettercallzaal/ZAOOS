---
type: guide
topic: infrastructure
status: research-complete
last-validated: 2026-05-25
related-docs: 741, 043, 080
tier: STANDARD
original-query: "DISPATCH sub-doc of 741: Pion ecosystem internals (parent prompt: keep researching these more its super important)"
---

# Pion Ecosystem + Internals (Doc 741a)

**TL;DR:** Pion is the pure-Go WebRTC foundation behind OpenAI's Realtime API, LiveKit, and ion-sfu. It's MIT-licensed, production-hardened (v4.2.12 as of May 2026), and the right call when you need custom WebRTC routing or voice-agent signaling. Drop down to raw Pion when a managed service (LiveKit/100ms) adds friction; stay on managed services if you need conference scaling or per-platform SDKs.

---

## 1. Pion WebRTC Proper: The Foundation

### What It Is

**Pion WebRTC** (`github.com/pion/webrtc/v4`) is a pure-Go implementation of the WebRTC specification (webrtc-pc and webrtc-stats). It is **not** a server, not an SFU, not a media server. It's a library that implements the WebRTC protocol stack—the part that runs inside Chromium, Firefox, and Safari, now available as a Go package.

**Key architecture layers:**
- **PeerConnection**: Manages ICE, DTLS, SRTP, DataChannels, media tracks
- **ICE Agent**: Gathers candidates (STUN/TURN), selects best path
- **DTLS/SRTP**: Encrypts both signaling (DTLS) and media (SRTP)
- **RTP/RTCP**: Media packet serialization + congestion control
- **SCTP DataChannels**: Ordered/unordered message delivery
- **Codec Abstraction**: H.264, VP8, VP9, Opus, PCM packetizers (no actual encoding)

### Core Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Current version | v4.2.12 (May 1, 2026) | Released 5 days ago; active maintenance |
| GitHub stars | 14,800+ | Top-tier WebRTC project |
| Contributors | 236 total; 23 active | Strong community |
| Test suite | 77 seconds full run | v4 now uses 1:16.69 total (up from 25.60s user time) |
| Build time (examples) | 0.279 seconds | Pure Go, no cgo; cross-compiles trivially |
| License | MIT | Free to commercial use, fork, embed |
| v4 release | Dec 2023 | ~18 months of v4 maturity; v3 still supported |

### Version History: v2 → v3 → v4

**v2.x** (2019-2020): The original, API-heavy, single Track struct for send/receive.
- Breaking change: Unified Plan became default (vs Plan-B)
- Removed RTC prefix from struct names (RTCPeerConnection → PeerConnection)
- SetLocalDescription now explicit (not implicit in CreateOffer)

**v3.x** (2020-2023): Clean slate on media API.
- Trickle ICE enabled by default (massive latency win)
- Tracks split into TrackLocal (send) and TrackRemote (receive)
- SSRC/PayloadType removed from public API (automatic)
- Interceptors for custom media processing (NACK, FEC, TWCC)
- ICE Restarts now supported

**v4.x** (2023-2026, current): Quality of life + spec compliance.
- DTLS close handling (no more 5-second disconnect delay)
- Simulcast extension headers on by default
- RFC 4588: Retransmissions use distinct SSRC
- RFC 8260: SCTP interleaving (fixes DataChannel head-of-line blocking)
- NewAPI() auto-registers codecs/interceptors (less boilerplate)
- 205 commits, 42 authors, major CPU + latency reductions

**Migration path:** Code using v3 API mostly works in v4 with minor adjustments. v2→v3 required more work (media API redesign). Pion maintains v3 releases for those not ready to upgrade.

### MIT License Implications for ZAO

Pion is MIT-licensed. You may:
- Use it commercially without restrictions
- Fork and modify without publishing changes
- Embed in proprietary products
- Sell services built on Pion

You do not need to:
- Contribute changes back
- Disclose your use
- Open-source derivative works

This is the most permissive license in practice. No friction for ZAO OS or ZABAL Games.

---

## 2. Pion Sister Projects: The Ecosystem

### Comparison Matrix

| Project | Purpose | Maturity | License | Use Case | Latest |
|---------|---------|----------|---------|----------|--------|
| **pion/webrtc** | Protocol stack library | Stable (v4.2.12) | MIT | Embedding in custom apps, custom signaling | May 2026 |
| **pion/ion** | Distributed RTC system | WIP (v1.0, 21 stars) | MIT | Full-stack RTC platform; low priority | Apr 2026 |
| **ionorg/ion-sfu** | SFU lib (Go only) | Stable (v1.11) | MIT | Router; embed in custom server | Nov 2021 |
| **pion/mediadevices** | Camera/mic/screen capture | Stable (v0.9.4) | MIT | Hardware input on non-browser platforms | Feb 2026 |
| **pion/turn** | TURN server library | Stable (v5.0.3) | MIT | NAT traversal relay; embed or run standalone | Mar 2026 |
| **webrtc-for-the-curious** | WebRTC book + protocols | Stable | CC0 | Learning ICE/DTLS/SRTP internals | Sean DuBois + community |

### Detailed Breakdown

#### **pion/ion** (Distributed RTC System)
- **Status**: Work-in-progress remake (low activity; 3 contributors; 21 stars)
- **What it is**: A from-scratch distributed RTC platform using Pion
- **When to use**: Only if you want a batteries-included Pion-based platform; otherwise prefer LiveKit or ion-sfu
- **Not ready for production**: Actively being redesigned; avoid

#### **ionorg/ion-sfu** (Selective Forwarding Unit)
- **Status**: Stable; 903 stars; 50 contributors; last push Nov 2021 (technically archived but widely used)
- **What it is**: A pure-Go SFU library that sits on top of Pion/webrtc. Routes media without mixing.
- **Architecture**: 
  - Pub/sub peer model (one publisher, N subscribers, each gets their own peer connection)
  - O(n) port usage (each peer gets a socket)
  - TWCC, REMB, RR/SR congestion control
  - gRPC or JSON-RPC signaling interfaces
- **When to use**: Custom SFU where you control all the signaling, want minimal dependencies, and need Go-native routing
- **Not when**: You need scalable conference servers (use LiveKit), or cross-browser SDKs (use LiveKit)
- **ZAO context**: If `/spaces` ever migrates off 100ms and you want in-house SFU, ion-sfu is the drop-in (but requires signaling layer rebuild)

#### **pion/mediadevices** (Hardware Input)
- **Status**: Stable (v0.9.4, Feb 2026); 633 stars; 40 contributors
- **What it is**: Go bindings for camera, microphone, screen capture (via system APIs or cgo)
- **Codecs supported**: x264 (H.264), vpx (VP8/VP9), opus, svtav1 (AV1), mmal (Raspberry Pi hardware), vaapi (Linux GPU)
- **When to use**: Building Pion apps that need to capture from real hardware (non-browser environments)
- **Build tags**: `nomicrophone` for cross-compilation without audio
- **ZAO context**: Needed if ZOE voice-agent ever switches from browser WebRTC to raw Pion + local hardware capture

#### **pion/turn** (TURN Server Toolkit)
- **Status**: Stable (v5.0.3, Mar 2026); 500+ stars
- **What it is**: An API (not a binary) for building TURN/STUN servers in Go
- **RFCs**: 5389 (STUN), 5766 (TURN), 6062 (TCP), 6156 (IPv6)
- **When to use**: Embedded NAT relay in custom infrastructure; or spawn one per SFU region for low-latency candidates
- **Not when**: You can use public STUN/TURN (Google's, Twilio's, Cloudflare's)
- **ZAO context**: If you run your own SFU, you may run your own TURN server on the same VPS (Pion handles both)

#### **webrtc-for-the-curious** (Educational)
- **Status**: Stable; CC0 license; maintained by Sean DuBois + community
- **What it is**: An in-depth book on WebRTC protocols: ICE (candidate gathering), DTLS (encryption), SRTP (media), SCTP (data channels), congestion control
- **Why important**: The mental model for debugging Pion issues. "Why is my connection slow?" → Read the DTLS section and understand the handshake
- **ZAO context**: If anyone on the team builds a voice-agent signaling layer, they should read the ICE/DTLS chapters first

---

## 3. Production Users: Who Actually Uses Raw Pion?

### Verified Production Deployments

**OpenAI (ChatGPT voice + Realtime API):**
- Uses Pion WebRTC for all real-time voice sessions
- Shipped May 2026 architecture rebuild using custom Pion transceiver
- **Why**: Custom routing (stateless relay pattern), GeoDNS steering, 900M+ weekly active user scale
- **Details**: Sean DuBois (Pion creator) is an engineer at OpenAI working on this
- **Citation**: [OpenAI Engineering, May 4 2026](https://awesomeagents.ai/news/openai-voice-ai-webrtc-kubernetes/)

**LiveKit (livekit-server):**
- Pion/webrtc is the core protocol layer (not the full SFU—LiveKit adds management, clustering, persistence on top)
- **Why**: Pure-Go foundation; scalable clustering; WebRTC compliance
- **Status**: Open-source; production-hardened; 4000+ stars

**100ms (hms-webrtc):**
- **Status**: Proprietary, not verified open-source; but documented as Pion-based in some demos
- **Note**: Less clear than LiveKit; treat as "likely uses Pion" rather than "confirmed"

**CallSphere (AI voice gateways):**
- Pion-based custom gateway for AI agents + voice routing
- **Architecture**: Browser peer ↔ Pion transceiver ↔ Protobuf agents (37 agents across 6 verticals as of May 2026)
- **Why**: Go concurrency model maps to thousands of long-lived connections; no libwebrtc cgo dependency
- **Citation**: [CallSphere Blog, May 2026](https://callsphere.ai/blog/vw1e-pion-go-sfu-ai-gateway.md)

**Twitch (OBS WHIP output):**
- OBS Studio integrates Pion for WHIP (WebRTC-HTTP Ingestion Protocol) output to Twitch ingest
- **Why**: Standardized low-latency ingestion; WHIP is now RFC 9725 (March 2025)
- **Citation**: Sean DuBois authored WHIP support in OBS; he worked at Twitch

**Awesome-Pion Companies List (GitHub):**
- 27+ public companies listed: Decentraland, IPFS, RingCentral, Muxable, Tandem, Yous, Piepacker, Kerberos.io, RemoteMonster, Neverinstall, Carnegie Robotics
- Most use Pion for specific layers (not full stack): RTSP→WebRTC bridges, robotics streaming, embedded media servers

**Drone/Robotics (implicit):**
- Hacker News thread 31447046 (LiveKit launch) mentions Pion use in drone camera streams, embedded device media
- No single company named, but pattern is clear: on-device WebRTC without browser overhead

---

## 4. When Raw Pion Is The Right Call vs Managed Services

### Decision Rubric

| Dimension | Raw Pion | LiveKit / 100ms |
|-----------|----------|-----------------|
| **Scale** | <100 concurrent peers per server; or custom routing | 100+ peers, need auto-scaling, multi-region |
| **Signaling** | You own it (custom HTTP, gRPC, or WebSocket) | Managed (REST API, client SDKs handle it) |
| **Codec control** | Full freedom (custom RTP, SSRC, bandwidth) | Preset (Opus, VP8, H.264) |
| **NAT/TURN** | You run TURN relays or integrate your own | Managed globally |
| **Monitoring** | DIY (Prometheus, custom dashboards) | Built-in metrics + alerts |
| **Deployment** | Single binary (or embedded in app) | Managed cloud or orchestrate containers |
| **Team effort** | High (protocol expertise needed) | Low (plug & play SDKs) |
| **Cost** | Infrastructure + ops | Per-minute billing + egress |

### Three Scenarios Where Raw Pion Wins

#### **Scenario 1: Custom WHIP/WHEP Endpoint (Broadcast Ingest)**
You want OBS, GStreamer, and browsers to send media to your server using standard RFC 9725 (WHIP) signaling.

- **Setup**: Pion WebRTC + WHIP HTTP handler (POST offer → answer)
- **Why Pion**: WHIP is a one-time SDP exchange; no persistent connection needed. Pion handles ICE/DTLS, you handle HTTP
- **Example**: 
  ```go
  // POST /whip receives SDP offer
  // Return SDP answer + Location header
  // Media flows over WebRTC
  // DELETE /whip/{sessionId} tears down
  ```
- **Production example**: mpisat/whip2wowza (WHIP gateway to Wowza) — built on Pion
- **Effort**: ~500 lines of Go
- **ZAO fit**: If ZAOstock needs RTMP→WebRTC ingest or an RTMP→WHIP bridge, use raw Pion + custom WHIP handler

#### **Scenario 2: AI Voice Agent (1:1 Signaling)**
You want sub-100ms latency voice from browser → Go backend (LLM + TTS) → browser.

- **Setup**: Pion WebRTC peer per browser session; DataChannel for transcript; custom WHIP or gRPC signaling
- **Why Pion**: 
  - Go's concurrency (goroutines handle 1000s of long-lived peers efficiently)
  - No heavyweight managed service overhead
  - Custom audio pipeline: capture → STT → LLM → TTS → Opus encode → send
- **Example**: jason-shen/pion-voiceAgent (GitHub, March 2026)
  - Browser → WHIP POST with SDP offer
  - Server (Go) decodes Opus → streams to Deepgram (STT)
  - Deepgram → OpenAI (LLM) → Cartesia (TTS)
  - TTS output → Opus encode → WebRTC back to browser
  - Transcript + response delivered via DataChannel
- **Production**: Sub-100ms round-trip verified
- **ZAO fit**: If ZOE ever moves voice off Telegram/Discord and adds real-time voice inference, use Pion + WHIP + custom signaling

#### **Scenario 3: Custom SFU or Router (Media Relay)**
You need per-stream control: selective forwarding, video quality adaptation, per-peer encryption, or circuit breaking.

- **Setup**: Pion + ion-sfu lib (or custom routing logic on TrackLocal/TrackRemote)
- **Why Pion**: 
  - Direct access to RTP packets (inspect, rewrite, drop)
  - Simulcast/SVC support out of the box
  - No manager paying for inactive peers
- **Example**: peer-calls (GitHub) — open-source conference using ion-sfu + Pion
- **Not for**: Mass conferences (>50 peers in one room). Use LiveKit for that.
- **ZAO fit**: If `/spaces` ever moves off 100ms and you want a custom relay for DJ mode or screen-share routing, drop down to Pion + ion-sfu

### Three Scenarios Where Managed Services Win

#### **Scenario 1: Conference Scaling (20+ peers, N rooms)**
- **Why LiveKit/100ms**: Auto-scale servers, handle reconnections, cross-browser SDKs, one-click deployment
- **Raw Pion cost**: Operator must monitor peer counts, decide when to spawn new servers, handle failover
- **ZAO fit**: `/spaces` current use case (100ms is the right choice)

#### **Scenario 2: Mobile + Web + Desktop Parity**
- **Why managed**: Native SDKs for iOS (Swift), Android (Kotlin), Web (JS), Desktop (Electron)
- **Raw Pion**: You write your own client SDKs (expensive)
- **ZAO fit**: Not relevant (ZAO OS is web-first; no mobile app yet)

#### **Scenario 3: Turnkey Multi-Region**
- **Why managed**: CDN-like edge presence, automatic region failover, GeoDNS
- **Raw Pion**: You manage relay servers in each region, integrate with DNS
- **ZAO fit**: Not relevant (ZAO is currently US-focused; no global footprint)

---

## 5. Pion Internals: How It Works

### The ICE-DTLS-SRTP Stack (5-Minute Primer)

**ICE (Interactive Connectivity Establishment):**
- Gathers candidate addresses (host, server-reflexive via STUN, peer-reflexive, relay via TURN)
- Runs connectivity checks (STUN binding requests)
- Selects best candidate pair based on latency + type
- Provides trickle-ice: emit candidates as they arrive, don't wait for all

**DTLS (Datagram TLS):**
- Encrypts everything: SDP exchange (via WebSocket/HTTP), ICE candidates, RTP/RTCP, DataChannel
- Handshake: ClientHello → ServerHello → Certificate → Finished (1 RTT if cached)
- In Pion: `dtls/v2` package; Pion v4.0 added DTLS close event handling (no more 5-sec delay)

**SRTP (Secure RTP):**
- Encrypts + authenticates each media packet
- Key derivation: DTLS PRF generates SRTP master key
- Per-packet: authentication tag (20 bytes) + optional encryption
- Handles out-of-order packets (jitter buffer)

**DataChannel (SCTP over DTLS):**
- Reliable, ordered message delivery (like WebSocket, but inside DTLS)
- RFC 8260 (v4.2.13+): Interleaving fixes head-of-line blocking (large messages no longer stall small ones)
- Pion default: Weighted fair queuing scheduler (can prioritize streams)

### Pion Code Structure

```
pion/webrtc/
├── api.go              # Entry point: NewAPI()
├── peerconnection.go   # Core PeerConnection state machine
├── mediaengine.go      # Codec registry (H.264, VP8, Opus)
├── settingengine.go    # Options: TURN, ICE pool, timeout
├── transceiver.go      # Send/receive track pair
│
├── datachannel/        # SCTP + Pion DataChannel impl
├── dtls/               # DTLS 1.2 (TLS over UDP)
├── ice/                # ICE agent, candidate gathering
├── rtp/                # RTP packet serialization
├── rtcp/               # RTCP sender/receiver reports
├── sctp/               # SCTP stream reassembly
├── srtp/               # SRTP encryption/auth
│
├── examples/           # 40+ examples: data-channels, save-to-disk, broadcast, sfu-ws, whip-whep, etc.
└── stats/              # GetStats() API: bandwidth, latency, codec info
```

Key observation: Pion is a **library**, not a service. It exports:
- `PeerConnection`: The main object you interact with
- `Track` interface: Send/receive media
- `DataChannel`: Ordered messages
- Callbacks: `OnTrack`, `OnDataChannel`, `OnICECandidate`, etc.

You must implement:
- Signaling (WebSocket, HTTP, gRPC)
- Session management (which peer connected, who should receive video, etc.)
- Media sources (camera, file, network stream)
- Media sinks (file, display, network stream)

### Threading Model

Pion uses **goroutines** extensively:
- Each PeerConnection spawns goroutines for ICE, DTLS, media processing
- **Thread-safe API**: All callbacks are serialized; you can call methods from any goroutine
- **No locks exposed**: Pion handles internal synchronization
- **Advantage over C/C++**: Go's lightweight goroutines (100k+ per machine) vs libwebrtc threads (few per peer)

### Performance: Key Metrics

**Test suite (Pion v4.2.12):**
- Full test suite: 77 seconds
- All tests pass on CI
- Code coverage: 60%+ for core modules

**Example performance (Raspberry Pi 3):**
- 720p, 30fps H.264 video: <500ms latency (capture → encode → send → decode → display)
- Codec: mmal (hardware H.264)
- Measured Nov 2020; v4 is faster

**Latency reductions in v4:**
- DTLS close handling: 5 seconds → immediate
- Disconnect detection: 5 seconds → 0.5 seconds (ICE timeout tuning)
- Trickle ICE: full candidate gathering delayed → candidates arrive in <100ms

---

## 6. Sean DuBois: Pion Creator + OpenAI

**Who:** Sean DuBois, @Sean-Der on GitHub, @_pion on X/Bluesky

**Career arc:**
- 2018: Started Pion as a side project (frustration with Chromium's WebRTC build system)
- 2018-2022: Maintained Pion full-time (worked at Twitch, then LiveKit as Field CTO)
- 2022-present: Full-time at OpenAI on WebRTC infrastructure (ChatGPT voice, Realtime API)

**Current role at OpenAI:**
- Co-authored the May 2026 voice AI infrastructure post (with Justin Uberti, WebRTC's original architect at Google)
- Works on stateless relay patterns, GeoDNS steering, 900M+ user scale
- Still maintains Pion in his spare time (50% commits, 9% code review as of Mar 2026)

**Contact:**
- Public profile + scheduling: siobud.com (available for consulting); reach via the contact links on his site rather than direct email here
- Recent talks:
  - "Your realtime AI is ngmi" (with Kwindla Kramer, Daily.co) — Dec 2025
  - "OpenAI and WebRTC" (Kranky Geek, Apr 2025)
  - "WebRTC and AI in 2025" (with Kwindla, Daily.co)

**Pion's future (per interviews):**
- Video mixer is next open project (in-progress, may become product)
- RTP/RTCP maturity improvements (distinct SSRC for retransmissions — done in v4)
- Community contributions remain critical (Pion is not a one-person project)
- Funding model: OpenCollective + sponsorships (need ~$150k/yr for dedicated dev to clear tech debt)

**Why he matters for ZAO:** If you need WebRTC expertise (voice agent, SFU, protocol debugging), Sean is the authoritative voice and available for consulting.

---

## 7. ZAO Context: Is Raw Pion Right For Us?

### Current Surface Analysis

| Surface | Current | Pion Fit | Recommendation |
|---------|---------|----------|-----------------|
| **ZOE concierge** | Telegram (text) | No | Stay on managed platform (Discord, Telegram) |
| **/spaces** | 100ms SFU | No | 100ms scales better; we don't control signaling |
| **ZAOstock** | RTMP ingest (TBD) | Possibly | WHIP endpoint would work; assess if worth custom code |
| **Juke integration** | WebRTC iframe | Already handled | Juke is pre-integrated |
| **Future voice-agent** | Not started | Potentially yes | See below |

### Voice-Agent Case Study: Should ZOE Get WebRTC?

**Scenario:** ZOE moves voice inference off Telegram to a web voice endpoint (browser → LLM → TTS).

**Architecture option A: Managed (recommended)**
- Use Daily.co or Twilio WebRTC API
- Browser SDK handles signaling
- Costs: ~$0.02/minute or subscription
- Pro: Works immediately; no ops
- Con: Less custom control

**Architecture option B: Raw Pion (if custom control matters)**
- Browser → WHIP POST with SDP offer
- Go backend: Pion WebRTC + custom pipeline (Deepgram STT, OpenAI LLM, Cartesia TTS)
- Backend forwards Opus to agents via gRPC
- Pro: Sub-100ms latency; custom voice routing
- Con: ~2000 lines of Go; ops overhead; need TURN relays

**Honest assessment:** 
- If ZOE voice is a low-priority feature, use managed service (Daily, 100ms voice API)
- If ZOE voice is a competitive advantage (fast inference, custom voice cloning, per-user model), drop to Pion
- Current ZOE is text-first + Telegram; voice is a future ask, not urgent

### ZAOstock RTMP Ingest: WHIP Endpoint Worth It?

**Current assumption:** Broadcast from OBS → StreamYard / Restream (managed)

**Pion path:**
- OBS outputs WHIP to `rtmp.zaostock.live/whip`
- Custom WHIP handler ingests via Pion
- Relay to RTMP service or direct to streaming CDN
- Costs: ~500 lines of Go + 1 server (VPS)
- Benefit: Sub-second latency, custom SFU routing, no third-party dependency

**Honest assessment:**
- Restream/StreamYard is a one-click solution (not a technical bottleneck)
- WHIP path adds ~200k/month egress if you run your own RTMP server
- **Skip for now.** If broadcast becomes a ZAO product (not just ZAOstock), revisit.

---

## 8. Decision Table: When To Build vs Buy

| Question | Answer | Implication |
|----------|--------|-------------|
| Do you need <100ms latency? | No (most ZAO surfaces don't) | Use managed service |
| Do you own the signaling? | No (100ms/LiveKit own it) | Use managed service |
| Do you have ops bandwidth? | Limited (Iman's VPS is maxed) | Use managed service |
| Is this a core differentiator? | No (voice is nice-to-have for ZOE) | Use managed service |
| Do you need custom RTP routing? | Maybe (future `/spaces` migration) | **Evaluate Pion + ion-sfu** |
| Is there existing Pion example code? | Yes (WHIP agent examples exist) | **Pion becomes viable** |

**Decision: Pion is a "future unlock", not a current need.**

---

## 9. Next Actions (ZAO-Specific)

| Action | Owner | Timeline | Priority |
|--------|-------|----------|----------|
| **1. Evaluate Daily.co for ZOE voice** | Zaal | 1 week | P1 (if voice is next) |
| **2. Prototype WHIP endpoint (optional)** | Claude (if requested) | 2 days | P3 (ZAOstock backlog) |
| **3. Attend Sean DuBois talk / workshop** | Zaal | Ad-hoc | P2 (learning) |
| **4. Document `/spaces` migration path (Pion + ion-sfu)** | Claude | 2 days | P4 (future, >6mo) |
| **5. Keep Pion on radar for agent stack refresh** | Claude | Ongoing | P2 (doc 741 family) |

---

## Sources

| Source | Type | Status |
|--------|------|--------|
| github.com/pion/webrtc README | GitHub | FULL |
| Pion WebRTC v4.2.12 GoDoc | Official | FULL |
| OpenAI Engineering: "How OpenAI Delivers Low-Latency Voice AI at Scale" (May 4, 2026) | Blog | FULL |
| CallSphere: "Pion WebRTC Quietly Powering 2026 AI Voice Gateways" (May 2026) | Blog | FULL |
| Kranky Geek: "OpenAI and WebRTC with OpenAI dev Sean DuBois" (Apr 22, 2025) | Video interview | FULL |
| jason-shen/pion-voiceAgent (GitHub) | Example repo | FULL |
| github.com/pion/ion README | GitHub | FULL |
| github.com/pion/mediadevices README | GitHub | FULL |
| github.com/pion/turn README | GitHub | FULL |
| pion/awesome-pion (GitHub curated list) | GitHub | FULL |
| Release Notes: Pion v4.0.0, v3.0.0, v2.0.0 (Wiki) | GitHub | FULL |
| RFC 9725: WebRTC-HTTP Ingestion Protocol (WHIP) | Standard | FULL |
| mpisat/whip2wowza (GitHub) | Example repo | FULL |
| webrtc-for-the-curious book | Educational | FULL |
| Pion Discord + GitHub discussions | Community | PARTIAL |

---

## Also See

- **Doc 741** (parent hub): Pion + LiveKit WebRTC stack
- **Doc 741b** (sibling): LiveKit Agents production playbook
- **Doc 741c** (sibling): Voice-agent stack comparison
- **Doc 741d** (sibling): ZOE voice-agent integration blueprint
- **Doc 043**: Infrastructure as Code patterns
- **Doc 080**: Voice agent architecture (if exists)

---

**Last validated:** May 25, 2026  
**Next review:** Q3 2026 (when voice-agent feature is prioritized)
