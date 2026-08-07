---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2225, 2228, 673, 709
original-query: "gh repo clone clawdbotatg/clawd-scribe - read the actual code, write a grounded adopt-spec: what clawd-scribe's local meeting capture does that ZAO's /meeting skill doesn't"
tier: STANDARD
---

# 2230 - clawd-scribe: what to adopt for ZAO's /meeting (grounded, file:line)

> **Goal:** Read clawd's local meeting-notes tool and name what it structurally does
> better than ZAO's `/meeting` skill - specifically the speaker-attribution problem
> `/meeting`'s own docs document as having burned a real ZAO recap.

## Grounding (real clone, this run)

`gh repo clone clawdbotatg/clawd-scribe --depth 1` succeeded 2026-08-06. **MIT**
(`LICENSE`). Read FULL: `README.md`, `native/AudioCapture.swift`, `native/MeetWatch.swift`,
`server/diarize.js`, `server/summarize.js`. Credit: **clawdbotatg / Austin Griffith,
clawd-scribe (MIT)**. Same local diarization stack as `/meeting` (sherpa-onnx + pyannote
segmentation - `diarize.js:1-3`), so the diarization isn't the news; three capture ideas are.

## The problem this solves for us (named in our own skill)

The `/meeting` skill's docstring documents "**the 2-person attribution trap**": whisper
emits ONE unlabeled block, and content-based guessing mis-attributes constantly - "a
guest's idea gets logged as Zaal's decision." It cites a real burned recap (Nounish Prof
x Zaal, 2026-07-22: "many of the things Nounish Prof said you have down for me"). `/meeting`
is POST-hoc (transcribe a file) and patches this with diarization + a VERIFY block.

clawd-scribe solves it STRUCTURALLY at capture time. That is the adopt.

## Adopt list (ranked, grounded file:line)

### 1. DUAL-CHANNEL capture: your mic separate from system audio. STRUCTURAL FIX.

`native/AudioCapture.swift:1-5`: "captures system audio (the meeting) + microphone
(you)... **left channel = microphone (you), right channel = system audio (everyone
else). Keeping the sources separate is what lets the daemon attribute speech.**"
`server/diarize.js:19`: the diarizer runs on `channel: "right"` = "everyone who isn't
you" - so YOU are attributed with 100% certainty (you're the only thing on the left
channel) and only the remote voices need clustering.

This is the exact structural answer to the 2-person trap: the human who owns the recap
is never mis-attributed, because their audio is physically a separate channel. `/meeting`
can't fully get this from a single mixed file - it's a LIVE-CAPTURE capability.
**Concrete adopt:** a `/meeting` **live-capture mode** (macOS 15+ ScreenCaptureKit
`captureMicrophone`) that records mic + system as 2 channels, so Zaal is always "Me" and
only counterparties get diarized. This is the highest-value adopt - it removes the single
worst `/meeting` failure mode. (Build is a Swift helper + capture path; SPEC here.)

### 2. Meeting-WINDOW vision auto-naming (not your camera). FIXES our frame-reading.

`native/MeetWatch.swift:1-9`: watches the Meet/Zoom WINDOW with Apple Vision OCR (local,
~1fps) for "all on-screen text with positions" + "bounding rects of the active-speaker
highlight (Meet blue / Zoom green tile border)", then "matches names to highlight rects
to learn who is speaking when, and fuses that with voice diarization to auto-name
speakers." `/meeting`'s frame-reading points at Zaal's OWN camera (single-feed) and its
skill says that "yields zero attendee-identity value" - so it gives up. clawd-scribe
points at the MEETING window's participant grid instead - reading the name tiles is
exactly the identity `/meeting` currently can't get. **Concrete adopt:** when a live
capture watches the call window, OCR the participant tiles + active-speaker border to
auto-name the diarized clusters. SPEC (macOS Vision, live-capture only).

### 3. Echo gate for laptop-speaker setups. SMALL, real.

`README.md`: "if you're on laptop speakers, mic chunks that are just the meeting audio
leaking back in are detected by envelope cross-correlation and dropped." `/meeting` has
no echo handling. Minor but real quality win for the live-capture path. CONSIDER.

### Corroboration (no build)

`server/summarize.js:21` - the notes prompt says "**Do not invent content that is not
supported by the transcript or notes.**" Same anti-fabrication floor `/meeting`'s
extraction passes + VERIFY block already enforce. Validates our design.

## What we do NOT adopt

- The whole Node server / web UI / MCP server - `/meeting` is a Claude Code skill, not a
  standing daemon. We take the CAPTURE ideas (1-3), not the app.
- whisper.cpp swap - `/meeting` already transcribes locally with mlx-whisper
  (`whisper-large-v3-turbo`), which is fine; no reason to switch engines.

## Decision

The one high-value adopt is **#1: a `/meeting` live dual-channel capture mode** - it
structurally eliminates the 2-person attribution trap our own skill documents as having
burned a real recap. #2 (window-OCR auto-naming) rides on the same live-capture path.
#3 (echo gate) is a small quality add. All three are macOS-15 live-capture features -
a Swift audio/vision helper + a capture path in `/meeting`, PR-only when built.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spec + build a `/meeting` live dual-channel capture helper (mic + system audio as 2 channels; Zaal = "Me" always) mirroring clawd-scribe AudioCapture.swift | @Zaal (Claude) | Spec-then-PR | 2026-08-10 |
| Add meeting-window OCR auto-naming to the live-capture path (Vision, participant tiles) | @Zaal | PR | 2026-08-12 |
| Review this adopt-spec in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **clawdbotatg/clawd-scribe (MIT)** - cloned `--depth 1` 2026-08-06, read FULL:
  `native/AudioCapture.swift` (dual-channel 1-5), `native/MeetWatch.swift` (Vision OCR
  auto-naming 1-9), `server/diarize.js` (channel:"right" 19), `server/summarize.js`
  (no-invent 21), `README.md`, `LICENSE`. [FULL]
- ZAO `/meeting` skill (the 2-person attribution trap docstring; frame single-feed check);
  doc 673 (/meeting design), doc 709 (whisper loop bug). [FULL, in-repo]

## Also See

- [Doc 2228](../../agents/2228-clawd-claude-p-agent-adopt-spec/) - the claude-p-agent adopt-spec.
