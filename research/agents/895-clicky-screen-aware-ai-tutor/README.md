---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-24
superseded-by:
related-docs: 889, 888, 891
original-query: "https://github.com/farzaa/clicky and also research /inbox"
tier: STANDARD
---

# 895 - Clicky: Farza's Screen-Aware AI Tutor (and what ZAO steals from it)

> **Goal:** Understand farzaa/clicky - a viral open-source macOS AI tutor that sees your screen, talks, and points - and decide what the pattern means for ZAO builder-onboarding and ZABAL Games.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | STEAL the `[POINT:x,y:label:screenN]` overlay pattern, not the whole app | The novel bit is making Claude emit coordinate+label tags that a transparent overlay turns into an on-screen pointer. That is a ~50-line idea reusable for any ZAO "watch me onboard you" surface. The rest (menu bar, push-to-talk) is standard. |
| 2 | USE Clicky's proxy architecture as the reference for any screen-sharing ZAO agent | Cloudflare Worker holds the keys; the client never sees `ANTHROPIC_API_KEY` / `ASSEMBLYAI` / `ELEVENLABS`. Same rule as ZAOOS `.claude/rules/secret-hygiene.md` - keys server-side only. Clean precedent. |
| 3 | TRACK as a ZABAL Games workshop demo candidate, do NOT fork into ZAOOS | It is Swift/macOS-native (95.2% Swift) - off ZAO's Next.js/TS stack. Value is the teaching pattern for builders, not the codebase. Fits the "builder focus" pivot (see [Doc 888](../888-zoe-improvements-reliability-memory-routing/)). |
| 4 | NOTE the licensing split before recommending it publicly | Existing code = MIT (fork/commercial OK). New features after 2026-04-27 = proprietary, closed. So "open source Clicky" is a frozen snapshot, not a living OSS project. Forks (openclicky, danpeg, skilly) are where community work continues. |

## What It Is

Farza Majeed (founder of buildspace, now shut down) shipped Clicky: a macOS menu-bar app described in the README as -

> "It's an AI teacher that lives as a buddy next to your cursor. It can see your screen, talk to you, and even point at stuff. Kinda like having a real teacher next to you."

He posted a ~30s demo on X. It went viral - **~15,000 likes, ~3,000,000 views** at time of writing - then a day later he open-sourced the whole thing on GitHub under MIT.

## How It Works (architecture)

Three pieces:

1. **Swift menu-bar app** (no dock icon). Two `NSPanel` windows - one control-panel dropdown, one full-screen transparent cursor overlay that spans monitors.
2. **Cloudflare Worker proxy** (`worker/src/index.ts`) - holds all API keys, exposes 3 routes: `/chat`, `/tts`, `/transcribe-token`. The Swift app calls the worker, never the vendors directly.
3. **External APIs** - Anthropic Claude (vision + responses), AssemblyAI (streaming speech-to-text), ElevenLabs (TTS).

The interaction loop:

- **Push-to-talk** (global shortcut **Control + Option**) streams mic audio over a websocket to AssemblyAI.
- The transcript **plus a screenshot** (ScreenCaptureKit, macOS 14.2+) is sent to Claude via streaming SSE.
- Claude's reply streams back; ElevenLabs speaks it.
- **The trick:** Claude can embed `[POINT:x,y:label:screenN]` tags inline in its response. The overlay parses these and flies the cursor to that coordinate on that monitor with a label. That is how it "points at stuff."

Key files: `CompanionManager.swift` (state), `ClaudeAPI.swift` (streaming client), `ElevenLabsTTSClient.swift` (audio), `worker/src/index.ts` (proxy).

Permissions it requests: Microphone, Accessibility (for the global shortcut), Screen Recording / ScreenCaptureKit.

## Setup (from README)

Prereqs: macOS 14.2+, Xcode 15+, Node 18+, a Cloudflare account (free tier fine), and API keys for Anthropic + AssemblyAI + ElevenLabs. README recommends just pointing Claude Code at the repo + `CLAUDE.md` for fastest setup, or manually: deploy the Worker with keys, paste the worker URL into the Swift proxy constants, open `leanring-buddy.xcodeproj` (sic) in Xcode, run.

## Findings

- **The pattern is the product, not the code.** "LLM emits structured action tags -> a client renders them as on-screen action" generalizes far past tutoring: guided product onboarding, live QA narration, accessibility. ZAO already does a softer version of this idea in text (ZOE drafting structured posts); Clicky is the visual-action version.
- **Cost shape:** three metered vendors stack per session - Claude tokens (vision = pricier) + AssemblyAI streaming STT (per-minute) + ElevenLabs TTS (per-character). A screen-watching always-on tutor is materially more expensive than a chat bot. Budget before any ZAO build copies it. (No published per-call numbers in the README - vendor pricing as of 2026-06: verify current.)
- **It is a frozen OSS snapshot.** Farza split it 2026-04-27: shipped MIT code stays forkable, new features go proprietary. Live community momentum is in the forks: `jasonkneen/openclicky` (OSS continuation), `danpeg/clicky` (proactive-tutor mode that nudges without push-to-talk), `tryskilly/skilly` (voice-first screen tutor reimplementation). Watch the forks, not the original, for evolving ideas.
- **Mac-native = off ZAO's stack.** 95.2% Swift. ZAO is Next.js 16 / React 19 / TS. A web reimplementation (screen-share API + canvas overlay in the browser) is the ZAO-shaped version if this ever becomes a build, not a fork of the Swift app.

## ZAO Application

The session pivoted to "help builders build better, especially in the ZAO ecosystem" (see [Doc 888](../888-zoe-improvements-reliability-memory-routing/), [Doc 891](../891-farcaster-agentic-bootcamp-zol/)). Clicky lands directly on that:

- **ZABAL Games workshops** teach builders live. A screen-aware tutor that points is the ideal demo of "AI as a teaching co-pilot." Use Clicky itself as a show-and-tell, then teach the `[POINT]`-tag pattern as a buildable.
- **Builder onboarding:** a browser-based "watch me set up your ZAO dev env" overlay using the same tag-render loop would cut onboarding friction for new ZAO Devz.
- **Boundary check:** this is NOT a new bot. It is a pattern reference + workshop asset. Per CLAUDE.md "no new bots without doc" - if it ever becomes a ZAO agent, it gets its own numbered doc + Zaal approval first.

## Also See

- [Doc 889](../889-tryharness-ai-screen-assistant/) - tryharness.ai screen-context AI assistant (same "AI sees your screen" category; Clicky is the open, voice+point version)
- [Doc 888](../888-proof-531-claude-cron-loop-app/) - Claude agent shipping an app on a /loop cron (builder-loop pattern)
- [Doc 891](../891-farcaster-agentic-bootcamp-zol/) - Farcaster agentic bootcamp / ZOL (builder-focus pivot)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add Clicky as a ZABAL Games workshop demo + teach the `[POINT:x,y]` tag pattern | @Zaal | Workshop | Next workshop slate |
| Spike a browser-native overlay (screen-share + canvas) rendering LLM action-tags, for ZAO builder onboarding | @Zaal | Spike | Backlog |
| Watch `jasonkneen/openclicky` + `danpeg/clicky` forks for proactive-tutor ideas | @Zaal | Monitor | Ongoing |

## Sources

- [farzaa/clicky GitHub repo](https://github.com/farzaa/clicky) - `[FULL]` - repo overview + README fetched and read
- [clicky README.md (raw)](https://raw.githubusercontent.com/farzaa/clicky/main/README.md) - `[FULL]` - setup, architecture, file names, MIT/proprietary split, permissions
- [XDA: "Someone built a tiny AI that lives next to your cursor..."](https://www.xda-developers.com/someone-built-tiny-ai-that-lives-next-to-your-cursor-the-most-useful-thing-ive-tried-this-year/) - `[PARTIAL - reception/virality numbers via search synthesis, full article not deep-fetched]` - 15k likes / 3M views, buildspace context, [POINT] tag mechanism
- [jasonkneen/openclicky](https://github.com/jasonkneen/openclicky) - `[PARTIAL - listing only]` - OSS continuation fork
- [danpeg/clicky](https://github.com/danpeg/clicky) - `[PARTIAL - listing only]` - proactive-tutor mode fork
- [tryskilly/skilly](https://github.com/tryskilly/skilly) - `[PARTIAL - listing only]` - voice-first screen-tutor reimplementation
