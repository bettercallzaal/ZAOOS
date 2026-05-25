---
topic: infrastructure
type: comparison
status: research-complete
last-validated: 2026-05-25
related-docs: 043, 080, 119, 163, 161
original-query: "https://github.com/pion/webrtc https://github.com/livekit https://livekit.com/"
tier: STANDARD
---

# 741 - Pion + LiveKit: open-source WebRTC stack for ZAO voice/video + AI agents

> **Goal:** Decide where Pion (Go WebRTC library) and LiveKit (SFU + Cloud + Agents framework) belong in the ZAO stack now that 100ms already runs `/spaces`, Juke owns user-facing live audio, and ZOE / Hermes voice agents are on the horizon.

## TL;DR

Pion is not a competitor to LiveKit. Pion is the Go library that implements the WebRTC protocol. LiveKit Server is a production SFU written in Go that uses Pion (`"the awesome Pion WebRTC implementation"` per the LiveKit README). They are layers, not alternatives.

For ZAO:

- **Do NOT migrate `/spaces`** off 100ms / Stream.io to LiveKit. No payoff, breaks shipped surfaces, contradicts doc 591 audit. Doc 043's "LiveKit recommended" call from March 2026 was never adopted; the in-flight stack works.
- **Do NOT touch raw Pion** for product code. Pion is a library, not a server. Building an SFU from Pion is a 6-month project even with the library handling the protocol mountain.
- **USE LiveKit Agents** as the candidate framework when ZOE / Hermes gets a voice-call interface (Telegram voice notes, ZAO phone number, real-time voice agent on `/zoe`). Build tier ($0/mo, 1,000 agent-session min) is free; OpenAI itself uses LiveKit for ChatGPT Advanced Voice.
- **Juke iframe stays the user-facing live audio surface.** LiveKit Agents is for the agent leg (ZOE talking to a user), not the community leg (members talking to members in a room).

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| `/spaces` SFU provider | KEEP 100ms + Stream.io | Shipped, in-prod, audited doc 591. Migration cost outweighs LiveKit's cheaper-at-scale unit cost given ZAO's 188-member scale. |
| Raw Pion in product code | SKIP | Library, not server. Use it only if forced into a single-purpose minimal Go binary (none in current roadmap). |
| Voice-agent framework for ZOE / Hermes | USE LiveKit Agents | OpenAI ChatGPT Advanced Voice runs on it; Python + Node SDKs; STT/LLM/TTS plug-in (Deepgram / OpenAI / ElevenLabs / Cartesia); 10.7k GitHub stars; free tier covers prototyping. |
| LiveKit hosting model | LiveKit Cloud Build ($0/mo) for prototype, Ship ($50/mo) if it ships | 1,000 agent-min free is enough to build/demo. Self-host only if monthly minutes pass ~200K (we are nowhere near). |
| Juke vs LiveKit for live rooms | Juke for users, LiveKit for agents | Juke partnership already owns user-facing live audio per docs 695/696/669-673. LiveKit fills the gap Juke does NOT cover: programmable server-side voice participants. |

## Findings

### 1. Pion is the WebRTC engine, not a server

| Fact | Value | Source |
|---|---|---|
| What | Pure Go implementation of the WebRTC API | pion.ly + github.com/pion/webrtc README |
| Version | v4.2.13 (2026-05-22) | github.com/pion/webrtc Releases |
| License | MIT | pion/webrtc LICENSE |
| Stars | 16.5k, 1.8k forks, 266 watchers, 159 releases | pion/webrtc GitHub |
| Use case | Build your own SFU, custom RTC service, single-purpose Go media tool | github.com/ionorg/ion-sfu README (`"For batteries-included, end-to-end solutions ... check out LiveKit"`) |
| Built on Pion | LiveKit Server, ion-sfu, pion/ion, Gryt-chat/sfu, OpenAI's Advanced Voice infra | HN #41746066, livekit/livekit README |

The HN community has a clean read on Pion: it removes the WebRTC protocol mountain (ICE, DTLS, SRTP, simulcast, NACK, congestion control) but you still build everything above it. Sean DuBois (Pion creator) was fractional CTO of LiveKit, which is why LiveKit's Go SFU sits cleanly on top of Pion.

For ZAO: there is no scenario in the current roadmap where we write our own Go SFU. Every voice/video need maps to either (a) a hosted product (100ms, Stream.io, Juke, LiveKit Cloud) or (b) a framework that wraps a hosted product (LiveKit Agents). Pion goes on the "good to know exists, would not import" shelf.

### 2. LiveKit is three products in one

| Layer | What | Where |
|---|---|---|
| LiveKit Server | Open-source SFU in Go, Apache 2.0, v1.12.0 (2026-05-16), 18.9k stars, 99.9% Go | github.com/livekit/livekit |
| LiveKit Cloud | Managed SaaS on top of LiveKit Server. Pricing: Build $0, Ship $50/mo, Scale $500/mo, Enterprise custom | livekit.com/pricing |
| LiveKit Agents | Python (and Node) framework for realtime voice AI agents. 10.7k stars, 3.2k forks. STT/LLM/TTS pipeline + turn detection + interruption handling | github.com/livekit/agents |

LiveKit Cloud's pricing now leads with agent-session minutes, not WebRTC minutes — the company has clearly bet on voice AI as the primary use case. Build tier headline: 1,000 agent-session min + 5,000 WebRTC min + 50 inbound min + 1 free US local phone number, no credit card. Ship: 5,000 agent min then $0.01/min overage, 150,000 WebRTC min. Scale: 50,000 agent min, 1.5M WebRTC min. Custom voices gated behind Ship; role-based access / metrics API / region pinning gated behind Scale; HIPAA + SSO Enterprise-only.

### 3. Cost vs scale (where the LiveKit Cloud math actually wins)

Per the Forasoft 2026 flip-point analysis and the trtc.io pricing comparison:

| Monthly participant-minutes | Daily.co bill | LiveKit Cloud bill | Self-hosted LiveKit (Hetzner) | Recommendation |
|---|---|---|---|---|
| 100K | ~$360 | ~$50 (Ship) | ~$300 + ops | Stay on incumbent; LiveKit Cloud only if you want optionality |
| 500K | ~$1,960 | ~$200-$250 | ~$1.0-1.5K + 0.5 FTE | Move to LiveKit Cloud |
| 2M | ~$7,960 | ~$800-$1,000 | ~$3-4K + 1 FTE DevOps | LiveKit Cloud or self-host (payback < 18 months) |
| 10M+ | ~$39,960+ | ~$4-5K | ~$8-15K + 1-2 FTE | Self-host (payback < 6 months) |

ZAO context: 188 active members + 2-5 weekly spaces of ~10 people = ~5K-10K monthly minutes. We are 20-40x below the threshold where LiveKit Cloud beats incumbents on cost. The argument for LiveKit at ZAO scale is feature fit (Agents framework), not unit economics.

### 4. ZAO codebase reality (what is actually shipped)

Local grep confirms the in-prod stack:

- 100ms (HMS-prefixed): `src/components/spaces/HMSRoom.tsx`, `HMSFishbowlRoom.tsx`, `src/app/api/100ms/token/route.ts`, `src/app/api/100ms/rooms/route.ts` - audio room SFU.
- Stream.io: `src/app/api/stream/token/route.ts`, `src/app/api/stream/rooms/route.ts`, `src/components/spaces/StreamWrapper.tsx`, `src/components/spaces/NoiseCancelButton.tsx` - parallel surface for streaming-grade rooms.
- Juke: `src/app/live/[spaceId]/page.tsx`, `src/lib/spaces/jukeIntegrationManifest.ts`, `src/lib/spaces/jukeWebhookHandlers.ts`, `src/app/api/juke/admin/*` - keyless iframe + webhook handlers (PR #598, PR #673, doc 695 ecosystem map, doc 673 Juke consumer).
- LiveKit: zero references.
- Pion: zero references.

Cross-repo search across the 30+ bettercallzaal public org repos (via `mcp__grep__searchGitHub`) returned zero hits for `livekit` and zero hits for `pion/webrtc`. Greenfield in the ZAO ecosystem.

### 5. Where LiveKit Agents earns its slot in the ZAO roadmap

The clear unmet need is a programmable server-side voice participant - an agent that can be on a call, listen, and respond in real time. Use cases in the current ZAO surface inventory:

| Surface | Today | LiveKit Agents would add |
|---|---|---|
| ZOE (`@zaoclaw_bot`) | Telegram text + voice-note transcription | Real two-way voice. User dials a number, ZOE answers, books a meeting, captures a task. |
| Hermes (`@zoe_hermes_bot`) | Autonomous fix-PR pipeline (text) | Voice "what's the PR status?" without opening Telegram. |
| ZAO Devz (`@zaodevz_bot`) | Group dispatch + hourly tip | Voice standup summary on a phone number. |
| ZABAL Games workshops | Restream + Magnetiq + Cal.com | AI co-host that summarizes the workshop in real time. |
| ZAOstock support | Manual | Inbound phone number that triages festival questions to the right human. |

Per the May 2026 Jahanzaib Ahmed Medium postmortem (real-estate brokerage voice agent on LiveKit Agents + Deepgram Nova-3 + GPT-4o-mini + ElevenLabs + Twilio SIP): 9 days to ship a demo, 14 more days to fight production. Two config knobs that mattered most: turn on LiveKit's noise reduction in turn-handling, and tune `false_interruption_timeout` to ~1.2s (not the doc default 2.0s) using real production audio recordings. The agent handles ~38% of after-hours calls and books 14-22 callbacks/week. These are the real numbers - production voice agents are a UX/integration problem, not a model-selection problem.

This is the right shape for a ZAO pilot: start at Build tier ($0), use ZOE as the dial target, run shadow mode for a week before going live (the postmortem's biggest regret was skipping shadow mode).

### 6. Why we are NOT migrating `/spaces`

Doc 043 (March 2026) recommended LiveKit and ZAO never adopted it. The actual stack settled on Stream.io + 100ms because:

1. 100ms ships pre-built audio room components - speaker detection, hand raising, role management - that LiveKit forces you to build (per the codeline.co 2025 review: `"there are no prebuilt UI components"`).
2. Stream.io covers the higher-quality streaming-grade rooms.
3. Juke now owns the user-facing live audio leg via the keyless iframe at `/live/[spaceId]`.
4. The 100ms cost at ZAO scale is ~$1/1k pm for audio - 75% audio discount per trtc.io. Effectively free for our minute volume.

Migrating off this would burn engineering on a re-platform that produces zero new capability for members. Doc 591 (miniapp production-ready audit, 2026-05-02) and the Juke integration manifest treat the current stack as the shipped surface. Re-platforming is the wrong tax to pay.

## Also See

- [Doc 043](../../_archive/043-webrtc-audio-rooms-streaming/) - the original WebRTC/LiveKit recommendation (March 2026) that ZAO did not adopt. This doc supersedes 043's "USE LiveKit for `/spaces`" call.
- [Doc 080](../../_archive/080-jitsi-meet-live-rooms/) - Jitsi for fractal calls (still the right call for fractals, free + zero-account-needed).
- [Doc 119](../../_archive/119-songjam-audio-spaces-embed/) - SongJam embed pattern; same shape as Juke iframe.
- [Doc 163](../../_archive/163-multistreaming-platforms-integration/) - Restream / StreamYard / Livepeer multistream layer; orthogonal to SFU choice.
- [Doc 161](../) - RTMP streaming (referenced by 163).
- [Doc 591](../../) - miniapp production-ready audit (2026-05-02).
- [Doc 695](../../) - ZAO + Juke ecosystem map.
- [Doc 673](../../) - Juke consumer (PR #673) - 4 endpoints Nicky shipped.
- [Doc 738](../../events/738-vlad-singularity-fractal-call-may24/) - Vlad / Singularity fractal call (audio room context).
- [Project memory: project_juke_consumer_2026_05_24](../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_juke_consumer_2026_05_24.md).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Open `~/.zao/private/livekit-agents-prototype.md` scratch doc for ZOE voice-agent pilot (Build tier, Telegram + phone number leg) | @Zaal | Local note | Before next ZOE iteration |
| If ZOE voice pilot greenlit: spin LiveKit Cloud Build account (`cloud.livekit.io`), wire Deepgram + OpenAI + Cartesia keys via `zao-secrets`, stub a `bot/src/zoe/voice/` directory mirroring the Hermes pattern | @Zaal | Spike | After greenlight |
| Add `livekit-agents` and `pion/webrtc` to the "skip without an explicit ask" list in `community.config.ts` `audio.providers` section comment - future agents may otherwise propose them for `/spaces` | @Zaal | PR | Next config touch |
| Cross-link doc 043 with `superseded-by` pointer to this doc for the `/spaces` SFU recommendation only (keep 043's Livepeer + listening-party content live) | Claude | Edit | Same PR as this doc |
| ZABAL Games workshop pitch: explore LiveKit Agents demo as a workshop topic (community-built voice agent) | @Zaal | Workshop slot | June-August 2026 build-a-thon |

## Sources

- [pion/webrtc README](https://github.com/pion/webrtc) - [FULL] - v4.2.13, MIT, 16.5k stars, key features verbatim.
- [livekit/livekit README](https://github.com/livekit/livekit) - [FULL] - v1.12.0, Apache 2.0, 18.9k stars, confirms `"leverages the awesome Pion WebRTC implementation"`.
- [livekit.com](https://livekit.com/) - [PARTIAL - pricing page returned separately; SDK list not on landing] - hits primary product positioning as voice/video/physical-AI agent platform.
- [livekit.com/pricing](https://livekit.com/pricing) - [FULL] - Build $0 / Ship $50 / Scale $500 / Enterprise tier values verbatim.
- [livekit/agents README](https://github.com/livekit/agents) - [FULL] - 10.7k stars, 3.2k forks, Python primary + Node alt, AI provider list (Deepgram, OpenAI, Google, Cartesia, ElevenLabs).
- [LiveKit self-hosting VM guide](https://docs.livekit.io/home/self-hosting/vm/) - [FULL] - ports 443/80/7881/3478-UDP/50000-60000-UDP, Caddy + Let's Encrypt automation.
- [HN #41746066 - "Open source framework OpenAI uses for Advanced Voice"](https://news.ycombinator.com/item?id=41746066) - [FULL] - confirms OpenAI ChatGPT Advanced Voice = LiveKit + Pion lineage (Sean DuBois ex-fractional-CTO).
- [HN #42936345 / 42936101 - LiveKit Agents production thread](https://news.ycombinator.com/item?id=42936345) - [FULL] - agent-per-process model + Celery-like autoscaling, GPU caveat.
- [HN #31447046 - LiveKit launch thread](https://news.ycombinator.com/item?id=31447046) - [FULL] - Sean DuBois (Pion) endorsement, drone live-streaming customer story.
- [codeline.co - LiveKit production WebRTC SFU repo review (Nov 2025)](https://www.codeline.co/thoughts/repo-review/2025/livekit-webrtc-sfu-server) - [FULL] - architecture deep-dive (`pkg/sfu`, `pkg/rtc`, Redis routing, StreamAllocator), test-coverage caveats.
- [pkgpulse.com - LiveKit vs Agora vs 100ms 2026](https://www.pkgpulse.com/guides/livekit-vs-agora-vs-100ms-real-time-video-audio-sdks-2026) - [FULL] - feature matrix + use-case mapping. LiveKit Agents called out as only `"self-serve framework"` for voice AI in 2025-2026.
- [apiscout.dev - Ably vs LiveKit vs Daily 2026](https://apiscout.dev/guides/ably-vs-livekit-vs-daily-realtime-api-2026) - [FULL] - billing-model divergence + 100M+ Docker Hub downloads stat.
- [getstream.io blog - Top 8 WebRTC Companies 2026](https://getstream.io/blog/webrtc-companies/) - [FULL] - same-API-self-host-or-cloud LiveKit position.
- [trtc.io blog - Video SDK Pricing 2026](https://trtc.io/blog/details/video-sdk-pricing-comparison-2026) - [FULL] - $0.33/1k pm Scale tier math; 100ms audio discount structure.
- [forasoft.com - Daily.Co alternative 2026 flip points](https://www.forasoft.com/blog/article/daily-co-alternative) - [FULL] - ~200K / ~2M / ~10M minute flip-point table verbatim.
- [Jahanzaib Ahmed - Voice Agent for Real Estate Brokerage, May 2026](https://medium.com/@jahanzaibai/i-built-a-voice-agent-for-a-real-estate-brokerage-and-here-is-what-broke-720f9786451c) - [FULL] - production postmortem: 9-day demo / 14-day production fight, `false_interruption_timeout` 1.2s tuning, 38% after-hours coverage.
- [ionorg/ion-sfu README](https://github.com/ionorg/ion-sfu) - [FULL] - explicitly defers to LiveKit for batteries-included case.
- [pion.ly](https://pion.ly/) - [PARTIAL - sub-project list not on landing; supplemented from HN + GitHub] - positioning + Go cross-platform pitch.
