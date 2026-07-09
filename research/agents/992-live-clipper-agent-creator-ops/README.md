---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-08
superseded-by:
related-docs: 837, 629, 627, 954
original-query: "/zao-research this https://x.com/techfrenAJ/status/2074825834976711075"
tier: STANDARD
---

# 992 - Live clipper agent for ZAO streams (creator ops as agent workflows)

> **Goal:** techfrenAJ shipped a live clipper agent for his stream and framed the real insight as "creator ops are becoming agent workflows." Decide whether ZAO should build one, and how it plugs into what ZAO already has (Livepeer/Twitch clip endpoints, the ZABAL Games recordings pipeline, POIDH clip bounties, the ZAO Clipperz idea).

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Build a ZAO live clipper agent? | **YES, human-in-the-loop version.** The pattern is proven (6 shipped implementations found, Feb-Jul 2026) and ZAO already has clip endpoints + a transcription pipeline. Build the "review dashboard + one-button copy" flavor (techfren, my-clip-factory), NOT the fully-autonomous auto-poster - it matches ZAO's approval-gated ethos and feeds human-curated bounties. |
| Reuse or greenfield? | **REUSE.** Wire it onto existing assets: `src/app/api/livepeer/clip`, `src/app/api/twitch/clip`, and the ZABAL Games recordings pipeline (`docs/recordings-workflow.md`, `scripts/fix-transcript.mjs`) rather than a new stack. |
| Ingest path | **HLS/Livepeer first** (ZAO already streams there), RTMP as the general fallback (techfren + ClipDaddy use a private RTMP duplicate feed). Do NOT stand up new infra if Livepeer's clip API covers it. |
| Trigger for "clip candidate" | **Transcript + moment scoring, not chat-velocity.** ZAO streams (COC, WaveWarZ, ZABAL Finals, fireside spaces) are talk/music-heavy with small live chat, so chat-MPS triggers (agentclipz) misfire. Use rolling Whisper transcript + LLM candidate selection (my-clip-factory pattern). |
| Where the clips go | **Feed the existing surfaces:** ZAO Clipperz (Whop B), POIDH clip-up bounties (community members clip + earn), the ZABAL Games recordings/recaps pages, and the newsletter. The agent proposes; a human approves and routes. |
| Auto-post? | **NO for now.** Keep posting human-gated (consistent with the ZOE/Paragraph posting model). The agent drafts + one-button-copies; a human fires via Firefly. |

## Findings

### The source (techfrenAJ, 2026-07-08, 211 views)
His live clipper agent: **private RTMP ingest, rolling transcripts, clip candidates, review dashboard, one button to copy the latest draft.** His stated thesis: *"The interesting part is not the clipping. It is that creator ops are becoming agent workflows."* This is the load-bearing idea for ZAO - the assistant/ZOE stack is already this pattern applied to ops; clipping is the next surface.

### The pattern is a real 2026 category (6 implementations found)
| Tool | Stack / trigger | Human review? | Note |
|------|-----------------|---------------|------|
| techfrenAJ (the tweet) | RTMP + rolling transcript -> candidates -> dashboard | Yes (review + copy latest) | closest to ZAO's ethos |
| jainam-ranka/my-clip-factory | Next.js + Remotion + SQLite + faster-whisper + OpenAI | Yes (approve before render) | local-first, human-approval - the model to copy |
| epicgdog/agentclipz | streamlink + ffmpeg rolling buffer, chat MPS trigger, Modulate transcription, Reka captions | No (auto IG Reels) | chat-velocity trigger; wrong fit for talk streams |
| lxgicstudios/lxgic-clipper | yt-dlp + FFmpeg + Whisper + Postiz, OpenClaw cron | No (auto all platforms) | detection-to-upload ~3 min |
| ClipDaddy (Devpost) | JS RTMP server + rolling buffer + Python facial-expression AI | No | clips while stream still live = cross-promo |
| danieldotwav/LBIP | FastAPI + Kafka + 6-agent orchestrator + Whisper, ~1.2-2s latency | Operator console | multi-agent transcript intelligence |

Common spine across all six: **rolling buffer -> continuous transcription (Whisper) -> LLM/AI moment scoring -> format vertical + burn captions -> publish or review.** The differentiator is autonomy (auto-post vs human-review) and trigger (chat velocity vs transcript scoring).

### What ZAO already has (ground truth, code)
- `src/app/api/livepeer/clip/` - Livepeer clip endpoint (ZAO's primary stream path).
- `src/app/api/twitch/clip/` - Twitch clip endpoint.
- `src/app/overlay/zabal-games/` + `overlay/now-playing/` - branded stream overlays (browser source), shipped 2026-07-08.
- ZABAL Games recordings pipeline: `docs/recordings-workflow.md`, `data/transcript-corrections.json`, `scripts/fix-transcript.mjs` (safe auto-fix of transcripts), `/recordings` + `/recaps` pages, `api/clips.mjs` (ZAODEVZ/zabalgames).
- POIDH clip-up bounties (community members clip content + earn) - doc 533; the ZAO Clipperz "Whop B" idea on the personal board.
- The local transcription stack the /meeting skill already uses (mlx-whisper turbo + anti-hallucination flags) - reusable for stream transcripts.

So ZAO is ~70% of the way to a live clipper: it has ingest (Livepeer), clip endpoints, transcription, overlays, and two distribution surfaces (Clipperz, POIDH). The missing 30% is the glue: rolling transcript on the live feed + candidate scoring + a review dashboard.

## Also See

- [Doc 837](../../infrastructure/837-zao-video-editor-livestream-distribution/) - ZAO video editor + livestream distribution.
- [Doc 629](../../infrastructure/629-streaming-as-main-media-source-flywheel/) - streaming-as-media-source flywheel.
- [Doc 627](../../cross-platform/627-twitch-streaming-streamelements-integration/) - Twitch + StreamElements overlay layer.
- POIDH clip-up bounty format (doc 533) - the human-curated clip surface a clipper agent feeds.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spike a rolling-transcript + LLM-candidate script on one recorded COC/WaveWarZ stream (shipped = a script that outputs ranked clip candidates from a stream file) | @Zaal | PR | 2026-07-20 |
| Add a "clip candidates" review view to the ZABAL Games recordings pipeline (shipped = a page listing proposed clips with approve/copy) | @Zaal | PR | 2026-07-31 |
| Route approved clips to POIDH clip-up bounties + ZAO Clipperz (shipped = one approved clip posted through each) | @Zaal | Task | 2026-08-15 |
| Decide clipper as a ZABAL Games August build submission (a builder builds it) vs in-house (shipped = decision noted on the board) | @Zaal | Decision | 2026-07-18 |

## Sources

- [FULL] techfrenAJ tweet (2026-07-08, via fxtwitter) - https://x.com/techfrenAJ/status/2074825834976711075 - the live clipper agent + "creator ops are becoming agent workflows" thesis.
- [FULL] jainam-ranka/my-clip-factory (GitHub, exa) - https://github.com/jainam-ranka/my-clip-factory - local-first, human-approval clipper (Next.js/Remotion/Whisper/OpenAI).
- [FULL] epicgdog/agentclipz (GitHub, exa) - https://github.com/epicgdog/agentclipz - chat-MPS-triggered autonomous Twitch clipper.
- [FULL] lxgicstudios/lxgic-clipper (GitHub, exa) - https://github.com/lxgicstudios/lxgic-clipper - multi-platform auto-clip + post, ~3 min detection-to-upload.
- [FULL] MediaCopilot Live Clipping (exa) - https://www.mediacopilot.io/features/live-clipping - commercial RTMP/SRT/HLS live-clipping reference.
- [FULL] ClipDaddy (Devpost, exa) - https://devpost.com/software/clipdaddy - JS RTMP server + rolling buffer + AI.
- [FULL] danieldotwav/Live-Broadcast-Intelligence-Platform (GitHub, exa) - https://github.com/danieldotwav/Live-Broadcast-Intelligence-Platform - multi-agent transcript-intelligence pipeline.
- [FULL] ZAO codebase - `src/app/api/livepeer/clip`, `src/app/api/twitch/clip`, `src/app/overlay/*`; ZAODEVZ/zabalgames `api/clips.mjs`, `docs/recordings-workflow.md`.
