# 420 — HyperFrames: HTML-as-Video for AI Agents

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Evaluate HeyGen's HyperFrames (open-sourced 2026-04-16) as the agent-native video toolchain for ZAO OS content production, newsletter visuals, ZAO Stock promos, WaveWarZ clips, and socials.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Install HyperFrames | **ADOPT IMMEDIATELY** via `npx skills add heygen-com/hyperframes` — Apache 2.0, 2.1k stars, v0.4.3 (Apr 2026), runs local with Puppeteer + FFmpeg. Zero API keys. |
| Primary video stack for ZAO OS | **USE HyperFrames for template-based / branded / motion-graphics videos** (ZAO Stock promos, newsletter headers, WaveWarZ intros, artist lower-thirds, socials ticker cards). Keep Neural Frames + Seedance for beat-synced music videos (see doc 209/331). |
| Agent integration | **WIRE into ZOE + OpenClaw** — HyperFrames explicitly credits **OpenClaw** as inspiration. Add `hyperframes` as a capability in `src/lib/agents/` so ZOE can produce MP4 output from a prompt. |
| Build-in-public pipeline | **USE HyperFrames for every newsletter post** — generate 9:16 short + 1920×1080 header from Year-of-ZABAL copy. Hook into `socials` skill output. |
| Skills skill | **COPY HyperFrames' `data-*` attribute pattern for ZAO internal templates** — `data-composition-id`, `data-width`, `data-height`, `data-start`, `data-duration`, `data-track-index`. Standardize on GSAP 3.14.2. |
| Outreach | **REACH OUT to HeyGen team** — Bin Liu (@liu8in, VP Product+Agent Eng) + Abhay (@AbhayZala7). HyperFrames credits OpenClaw publicly. Open door for ZAO ↔ HeyGen partnership (HeyGen avatars for ZAO artists, ZAO as reference deployment). |
| Hardware | **SKIP local render on laptops** — use Docker render mode on VPS 2 (DigitalOcean 64.225.53.24) or Paperclip VPS (31.97.148.88). HyperFrames supports Docker natively. |
| Timing | **SHIP first HyperFrames-generated ZAO Stock teaser by 2026-05-15** to ride HyperFrames launch hype (323.2K views in < 24 hrs on launch tweet). |

---

## What HyperFrames Is

HTML-based video toolchain. Agents write HTML + CSS + JS (their training-data native tongue), HyperFrames adds a thin layer of `data-*` attributes to define timelines, then renders deterministic MP4/MOV/WebM via Puppeteer + FFmpeg.

Stated thesis (Bin Liu, 2026-04-16):
> "What the symphony was to Beethoven, play was to Shakespeare — HTML is to agents."

HeyGen internally uses Claude Code as their in-house video editor via HyperFrames.

---

## Technical Facts

| Dimension | Detail |
|-----------|--------|
| License | Apache 2.0 |
| Repo | https://github.com/heygen-com/hyperframes |
| Stars / Forks | 2,100 / 162 |
| Releases | 32 (latest v0.4.3, Apr 2026) |
| Runtime | Node ≥ 22 + FFmpeg |
| Render engine | Puppeteer (headless Chrome) |
| Animation | GSAP 3.14.2 (other libs work too: Lottie, Three.js, D3, CSS animations) |
| Export | MP4 (primary), MOV, WebM |
| Render modes | Local or Docker |
| Audio | Music + narration + **built-in TTS + transcribe** |
| Dimensions | Anything. Shown: 1920×1080, 9:16 portrait |
| Install | `npx skills add heygen-com/hyperframes` or `npx hyperframes init <project>` |
| CLI | `init`, `lint`, `preview` (live-reload), `render`, `transcribe`, `tts`, `doctor` |

### Packages

- `hyperframes` — CLI
- `@hyperframes/core` — runtime, types, parsers
- `@hyperframes/engine` — page-to-video capture
- `@hyperframes/producer` — full pipeline
- `@hyperframes/studio` — browser editor
- `@hyperframes/player` — web component
- `@hyperframes/shader-transitions` — WebGL effects

### Data Attributes (Timeline DSL)

```
data-composition-id="name"
data-width="1920"
data-height="1080"
data-start="0"
data-duration="5"
data-track-index="1"
```

Rest is pure HTML/CSS/JS. GSAP drives motion.

---

## Comparison — Agent-Native Video Toolchains

| Tool | License | Agent-native? | Beat sync | Audio/TTS | Render target | Fit for ZAO |
|------|---------|---------------|-----------|-----------|---------------|-------------|
| **HyperFrames** (HeyGen) | Apache 2.0 | **Yes — primary design** | No (animation only) | Yes (TTS + transcribe) | MP4/MOV/WebM local or Docker | **Primary** — templates, socials, branded content |
| **Remotion** | Apache 2.0 (commercial license above $10k) | Partial — React-based | No | Yes | MP4 local/Lambda | Secondary — if team prefers React. HyperFrames credits it. |
| **Motion Canvas** | MIT | No — human-first | No | Limited | MP4 | Skip — too manual |
| **Neural Frames** | Proprietary SaaS | No — GUI-first | Yes (8-stem) | Yes | Cloud only | **Keep for music videos** (doc 209) |
| **Seedance 2.0** | Proprietary API | No — prompt-only | Partial | Yes | Cloud only | Keep for b-roll gen (doc 209) |
| **FFmpeg + custom** | GPL | Manual | Manual | Manual | Any | Only for niche edits |

**Verdict:** HyperFrames wins for ZAO OS branded / agent-driven content. Keep Neural Frames + Seedance for music-video use cases.

---

## ZAO Ecosystem Integration

### Direct hooks in ZAO OS

- `src/lib/agents/runner.ts` — add `hyperframes` capability so VAULT/BANKER/DEALER/ZOE can request a video
- `src/lib/agents/types.ts` — define a `VideoRenderRequest` type (compositionId, props, dimensions, duration)
- `src/lib/publish/broadcast.ts` — after render, push MP4 to Farcaster + X + Bluesky via existing broadcast targets (see doc 419 cross-platform publish)
- `src/app/api/` — new `/api/video/render` route that dispatches to a Docker worker on Paperclip VPS
- `community.config.ts` — add brand tokens (navy `#0a1628`, gold `#f5a623`) that HyperFrames compositions read as CSS vars
- Co-lives with existing Livepeer clip pipeline (`src/lib/livepeer/client.ts`) — HyperFrames for composed content, Livepeer for live capture

### Infra targets

- **VPS 2 (DigitalOcean 64.225.53.24, 2GB/25GB — ZAAL ASSISTANT box)** — too small for renders
- **Paperclip VPS (31.97.148.88, Hostinger KVM 2)** — Docker ready, primary render host
- **OpenClaw (31.97.148.88 containers)** — HyperFrames credits OpenClaw. Natural co-deployment.

### Skills / automation surface

- **`/newsletter` skill** — auto-generate 16:9 header + 9:16 short
- **`/socials` skill** — render platform-specific variants (Firefly combined X+FC, LinkedIn square, Telegram/Discord GC)
- **`/big-win` skill** — render a Big Win stinger
- **`/zao-research` skill** — generate a "research digest" video from doc summaries
- **ZOE dashboard** — "render video" button backed by HyperFrames worker
- **COC Concertz** — artist introduction videos from profile JSON
- **FISHBOWLZ partner (Juke)** — show intros, recap videos for audio rooms
- **WaveWarZ** — prediction card reveal animations, episode cold-opens
- **ZAOstock 2026-10-03** — 8+ month promo video cycle for the Ellsworth festival

### Content templates to seed (first 10)

1. ZABAL Top-N ticker
2. Newsletter daily header (Year of the ZABAL)
3. ZAO Stock Oct-3 countdown
4. Artist spotlight lower-third
5. Big Win stinger
6. WaveWarZ prediction reveal
7. COC Concertz show promo
8. Fractal shoutout card
9. Research-digest motion card
10. 9:16 short from any long post

---

## Strategic Upside

| Angle | Upside |
|-------|--------|
| OpenClaw credit | HeyGen publicly credited OpenClaw in v1.0.0 launch. ZAO is adjacent. **Intro opportunity.** |
| 323.2K views in < 24 hrs on launch tweet | Ride the hype — post ZAO-branded HyperFrames output on Farcaster + X this week. |
| 2.1k stars in < 24 hrs | This is the new standard for agent video. Early adopters get onboarding + grant attention. |
| Claude Code native | ZAO already runs Claude Code + Claude Agent SDK. Drop-in fit. |
| Deterministic render | Same input → same MP4. Lets us cache + regenerate with confidence. |
| Zero API keys | Fits build-in-public ethos, no vendor lock. |

---

## Open Questions / Next Experiments

1. Test `npx hyperframes init` on a spare dir, render the 70-line "HTML is Video" example, measure cold render time on Paperclip VPS.
2. Dockerize a render worker; put behind `/api/video/render` with Zod-validated input.
3. Build ZAO brand-token HTML template with navy `#0a1628` + gold `#f5a623` + LeagueSpartan (or chosen ZAO font).
4. Wire to ZOE's Telegram dispatcher so "ZOE make a video about X" → MP4 in chat.
5. Reach out to Bin Liu (@liu8in) — frame as "ZAO OS is a gated Farcaster music community that credits OpenClaw too; we'd love to be an early HyperFrames reference integration."

---

## Sources

- [HeyGen launch tweet — Bin Liu (@liu8in), Apr 16 2026 1:17 PM, 323.2K views](https://x.com/liu8in/)
- [HyperFrames GitHub repo (Apache 2.0)](https://github.com/heygen-com/hyperframes)
- [Companion docs — existing ZAO video research doc 209](../../music/209-ai-video-generation-tools/README.md)
- [Companion docs — doc 331 AI music video generation 2026](../../music/331-ai-music-video-generation-deep-dive-2026/README.md)
- [Companion docs — doc 234 OpenClaw comprehensive guide](../234-openclaw-comprehensive-guide/README.md)
- [Companion docs — doc 202 OpenClaw + Paperclip orchestration](../202-multi-agent-orchestration-openclaw-paperclip/README.md)
- [Companion docs — doc 267 OpenClaw skills + capabilities](../267-openclaw-skills-capabilities/README.md)
- [Companion docs — doc 245 ZOE upgrade autonomous workflow](../245-zoe-upgrade-autonomous-workflow-2026/README.md)
- [Related open-source inspirations — GSAP](https://greensock.com/gsap/), [Remotion](https://www.remotion.dev/), [OpenClaw](https://github.com/paperclip-labs/openclaw)
