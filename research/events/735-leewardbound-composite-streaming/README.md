---
topic: events
type: decision
status: draft
last-validated: 2026-05-23
related-docs: 695, 710, 712, 640, 647
original-query: "leewardbound (Twitch) WIP poker plugin context. 1 face per player rendered over HTML poker game widget. 3 players running = 6 feeds (3 faces + 3 game streams). 'Room orchestrator' switches which feed is enlarged. Built it as: HTML video chatroom (Google Meet style), participants joined the chat, OBS could stream in as a participant or screen-share, then nurdism/neko (github.com/nurdism/neko) renders the composite into one video feed and streams it to Twitch."
tier: STANDARD
---

# 735 - leewardbound composite-streaming spec (WIP, for collab post-2026-06-02)

> **Goal:** Capture leewardbound's prior art on browser-orchestrated composite video streaming so ZAO can pick it up the moment Zaal is back from vacation (2026-06-02). One spec, one repo, one week.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Stack | LiveKit (or fork) + nurdism/neko headless browser + RTMP push to Twitch | leewardbound proven end-to-end. Do not reinvent. |
| Build window | One week, starting 2026-06-02 | leewardbound: "we could probably pump this out in a week." |
| Repo home | New repo (zao-orchestrator), NOT inside ZAOOS | Stream/composite/RTMP infra has its own ops shape; keep out of monorepo-as-lab. |
| First proof | A 3-person ZAO room (3 webcams + 1 screen share) composed into one Twitch stream with a "show me" orchestrator | Matches leewardbound's poker plugin shape; shippable in a week. |
| MVP target audience | WaveWarZ live event OR a ZAO fractal call recap stream | Real ZAO events that already happen. |
| Auth | Reuse SIWN. Host token = admin session. | No new identity system. |

## Reference architecture (leewardbound's prior art)

```
+--------------+        +---------------+        +-------------+        +--------+
| Participants | -----> | HTML video    | -----> | nurdism/neko| -----> | Twitch |
| (webcam +    |  LK    | chatroom      | DOM    | (headless   | RTMP   |        |
|  OBS feed +  |        | (Google-Meet  | render | browser ->  |        |        |
|  screen      |        | shape)        |        | one video)  |        |        |
|  share)      |        |               |        |             |        |        |
+--------------+        +---------------+        +-------------+        +--------+
                              ^
                              |
                       +----------------+
                       | Room           |
                       | Orchestrator   |
                       | (which feed is |
                       |  enlarged?)    |
                       +----------------+
```

Concrete details from leewardbound:

- **1 face per player rendered over an HTML poker game widget.** The game canvas was the "stage" and the faces overlaid it - COMPOSITION layer was an HTML page, not a live mixer like vMix.
- **3 players = 6 feeds** (3 webcam + 3 game streams). 6 streams in one browser tab.
- **Room orchestrator** picked which feed got the big-tile slot.
- **Participants** could be a human in video chat, an OBS broadcaster joining "as a participant," or a screen-share capturing the game widget.
- **nurdism/neko** = self-hosted virtual browser. Runs headless on a server, renders the HTML room, captures the composite, RTMP-pushes to Twitch. ZAO does not write a video mixer - the browser IS the mixer.
- **Old examples** live on `leewardbound`'s Twitch.

## What ZAO inherits

- **The browser is the mixer.** Less new infra than rolling vMix / OBS Studio.
- Layout changes = DOM rearrangement; renderer picks up automatically.
- Obvious place for ZAO overlays (lower thirds, "powered by Juke" badges, fractal Respect leaderboards) - same HTML page.

## What ZAO needs to add

| Surface | Build |
|---|---|
| Room transport | LiveKit (Juke uses it; we know the SFU model). Self-hosted first. |
| HTML room | Next.js app with 1-N participant tiles + a "stage" slot. Listens to orchestrator state via WebSocket / pgvector. |
| Orchestrator | Single host decides who is on stage. State in Supabase. |
| Headless renderer | nurdism/neko on VPS 1 (Hostinger KVM 2, 31.97.148.88). One neko per stream. |
| RTMP push | Neko's encoder -> Twitch (or YouTube/Kick via existing ZAO broadcast presets). |
| Auth | SIWN for participants. Host token = admin session. |

## Open questions for leewardbound

1. **What pinned vs un-pinned the orchestrator?** Touch face -> become big, or host clicks?
2. **How did OBS join the room?** Virtual camera into browser, or RTMP-to-LiveKit bridge?
3. **What did the audio mix look like?** All participants mixed, or only on-stage?
4. **What broke at scale?** 6 feeds in one tab - GPU + bandwidth ceiling?
5. **What was the recording flow?** Neko local + upload, Twitch VOD, both?
6. **Single-tenant per stream?** Or one renderer for multiple events?

## Sprint plan (rough, lock once leewardbound is back)

- **Day 1-2**: Self-host LiveKit + stub HTML room with 3 hardcoded tiles. Two browsers see each other.
- **Day 3**: Orchestrator state + Supabase persistence. "Promote-to-stage" survives reload.
- **Day 4**: Deploy nurdism/neko on VPS 1, point at room URL, RTMP-push to private Twitch. Composite shows up.
- **Day 5**: SIWN auth + host-only orchestrator gate.
- **Day 6**: First ZAO test (3 members + screen share, push to Zaal's Twitch).
- **Day 7**: Polish + first public event.

## Findings

| # | Finding | Source |
|---|---|---|
| 1 | Browser-as-mixer is the same pattern modern web-meet products use - no exotic infra | leewardbound, prior chat |
| 2 | nurdism/neko is actively maintained as a self-hostable virtual-browser project | https://github.com/nurdism/neko |
| 3 | LiveKit is the consensus open SFU and Juke uses it - ZAO already knows the model | juke.audio/llms.txt |
| 4 | leewardbound is willing to collab post-2026-06-02 with a 1-week target | Pasted chat 2026-05-23 |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Watch leewardbound's Twitch examples for layout + orchestrator UX | Zaal | Research | Before 2026-06-02 |
| Open zao-orchestrator repo | Zaal | Repo | 2026-06-02 |
| Send leewardbound this spec URL | Zaal | DM | Before 2026-06-02 |
| Audit LiveKit self-host vs Cloud cost | Claude | Research | Pre-sprint |
| Audit nurdism/neko deployment on Hostinger KVM 2 (RAM/GPU?) | Claude | Research | Pre-sprint |
| Resolve the six open questions with leewardbound | Both | Sync | First call back |

## Sources

- Pasted chat from leewardbound, 2026-05-23 (paste-in-chat via /meeting skill) [FULL]
- github.com/nurdism/neko - project README [PARTIAL - referenced, not deep-read in this draft]
- LiveKit docs (livekit.io) [PARTIAL - already grokked via Juke integration]
- Twitch channel: `leewardbound` (old composite stream examples) [FAILED - not viewed in this draft; Zaal to review before sprint]
