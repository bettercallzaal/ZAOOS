---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-27
related-docs: 670, 673, 1587
original-query: "Instead of Craig bot use a ZAO bot to capture Discord voice and not even need to input it into a terminal - it auto grabs the transcript, adds to ZAOOS and cowork. Learn more about the ZAO-owned-bot path, see if it is easy or we can copy something open-source, and first look online for a more efficient way."
tier: DEEP
---

# 2088 - ZAI Discord Voice Auto-Capture (the copy-not-build path)

> **Goal:** Kill the manual terminal step in meeting capture for Discord calls. A ZAO-owned bot joins the voice channel, records each speaker separately, and auto-runs the existing transcribe -> extract -> write pipeline into ZAOOS + the cowork tracker. Zero terminal input.

## The decision

**Build it DIY by copying an open-source `@discordjs/voice` recorder, not by adopting a SaaS meeting-bot and not by forking Craig.** Scope is **Discord voice only** (Zaal confirmed 2026-07-27 he does not need Zoom/Meet right now). This becomes **ZAI's first capability - Discord voice-capture** (already reserved in the surface taxonomy).

Three things make this the right call:

1. **No efficient shortcut exists for Discord + speaker attribution.** The polished "one API joins any call" products (Recall.ai) do NOT support Discord. Every tool that does Discord *and* diarizes is a paid per-minute API, which conflicts with the OSS-first / zero-marginal-cost preference.
2. **The whole back half already exists** - `transcribe.sh` (local Whisper), the extraction schema (just hardened, doc-less fixes 2026-07-27), `append-actions.sh` (writes the cowork Supabase `tasks` table), and the recap-doc writer. Only the recorder is new.
3. **Per-user recording removes the hard part.** Because `@discordjs/voice` subscribes to each speaker as a separate Opus stream, one audio file per user *is* the speaker separation. Transcribe each file on its own and you get a speaker-labeled transcript with **no diarization model at all** - no pyannote, no sherpa-onnx, none of the "who said what" risk the /meeting workflow otherwise fights. This is the same multitrack advantage Craig gives, obtained for free.

## Current state and the friction

Today (the `/meeting` skill, doc 673 lineage): Zaal records a Discord call with Craig (third-party bot), waits for Craig to finish, grabs the recording URL, and runs `/meeting <url>` **in a terminal**. The skill then transcribes, extracts, and writes. The friction is the two manual steps: fetch Craig's URL, and invoke the skill by hand. The recording and the pipeline both already work; the human is the glue.

## Prior art in the repo

| Doc | What | Status |
|---|---|---|
| **670** | Seed: "build a ZAO Craig bot" - live audio in, todos out | Idea only; spawned 673 |
| **673** | ZAOscribe spec - Telegram-voice -> Whisper -> extract -> tracker, no terminal | Spec locked, ~zero code. Telegram-only; live Discord voice was deferred (P6) |
| **1587** | Using Craig (third-party) to archive Fractal Democracy sessions; multitrack FLAC | Implementation-ready but Craig is third-party and needs a manual transcript fetch |

None proposed a ZAO-owned Discord recorder feeding the existing pipeline. That is this doc.

## Options evaluated (verified 2026-07-27)

| Option | Discord? | OSS / self-host | Diarized output | Integrate effort | Verdict |
|---|---|---|---|---|---|
| Recall.ai (commercial "joins any call") | **No** | No | Yes | n/a | MISS - no Discord |
| Gladia / Deepgram / AssemblyAI API + Discord | Yes | Paid API | Yes (pyannote-backed) | ~2-3 hrs | Rejected - per-minute SaaS cost, against OSS-first |
| Scripty (OSS, Codeberg) | Yes | Yes | No | ~2-3 hrs | Fast but plain transcript, no per-speaker |
| Discorder (OSS, TS) - records per-user -> local Whisper | Yes | Yes | Per-user files | ~3-4 hrs | Strong copy target - already wires record -> file -> Whisper |
| `discordjs/voice-examples/recorder` (official, Unlicense) | Yes | Yes | Per-user files | ~7-10 hrs full | Cleanest base to copy |
| Fork Craig (`CraigChat/craig`, ISC) | Yes | Yes (heavy) | Multitrack | high | Rejected - Postgres+Redis+web UI+cook servers; delete 70% |
| DIY from scratch | Yes | Yes | Per-user | ~10-12 hrs | Unnecessary - copy instead |

**Bottom line:** for Discord specifically, there is no path that is both OSS and gives speaker attribution *other than* recording per-user yourself. The efficient version of that is to copy an existing per-user recorder rather than write one.

## Recommended architecture (reuse map)

```
Discord voice channel
   |  (new) ZAI recorder: @discordjs/voice, subscribe(userId) per speaker
   v
per-user WAV files  (one file = one speaker = attribution, free)
   |  (reuse) transcribe.sh  - local Whisper per file
   v
speaker-labeled transcript
   |  (reuse) the /meeting extraction schema - decisions/actions/quotes,
   |          owner=Open default, why/done_when/quote required
   v
   +--> (reuse) append-actions.sh  -> cowork Supabase `tasks`
   +--> (reuse) recap-doc writer   -> ZAOOS research/events/NNN
   +--> (reuse) bonfire-episode.sh -> knowledge graph
```

New code is only the top box. Everything below the per-user WAV is already built and just got hardened.

### What to copy
- **Base:** `discordjs/voice-examples/recorder` (official, Unlicense, ~300 lines TS) for the join + `receiver.subscribe(userId)` + per-user file pattern.
- **Reference:** `JacobLinCool/discorder` for the "collect users, save files, hand to local Whisper" loop if the example's gaps bite.
- **Decode:** replace the example's prism-media Opus->OGG with a shell-out to `ffmpeg` for Opus->WAV (ffmpeg is already in the pipeline; simpler to debug than the prism-media dependency). This is the one genuinely fiddly step.

### Trigger
Slash command in the channel: `/record start` -> ZAI joins + announces recording; `/record stop` -> saves per-user WAVs and fires the pipeline. (Auto-join on channel activity is a later nicety, not v1.)

## Consent / TOS design (non-negotiable)

Discord voice *receive* is not officially documented by Discord and recording sits in a grey area of their TOS. The library docs say stable support is not guaranteed. Craig navigates this with explicit in-channel consent. ZAI does the same: on join, the bot posts a visible "recording started" message in the channel, and stops on `/record stop` or when it leaves. No silent recording, ever.

## Honest effort

~7-10 hours, and the per-user insight removes the riskiest sub-task (no diarization model to tune):
- Bot scaffolding + join/leave voice: ~1-2 hrs (copy)
- Per-user Opus -> WAV via ffmpeg subprocess: ~2-3 hrs (the one fiddly bit - verify audio quality on a real call)
- Handoff to `transcribe.sh` + existing pipeline: ~1 hr (shell wrapper)
- `/record start|stop` slash commands + consent message: ~1 hr
- Test on 1-2 real ZAO calls: ~2-3 hrs

## Risks

1. **Opus->WAV audio quality** (medium) - the only real unknown. Mitigation: ffmpeg subprocess path, verified against a real call before shipping.
2. **Discord voice-receive reliability** (low-medium) - the documented "bot sending audio can break receive" quirk (`discord.js#4161`); the bot only receives, so low exposure, but test reconnection on a dropped call.
3. **Grey-area TOS** (low, policy) - mitigated by mandatory consent message; do not remove it.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Zaal approves building ZAI Discord voice-capture v1 per this doc (gate: no new bot without approval) | zaal | Decision | 2026-07-29 |
| Prototype the recorder: copy the official example, ffmpeg Opus->WAV, per-user WAV out (branch, PR to ZAOOS) | zaal | PR | 2026-08-05 |
| Wire the per-user WAVs to `transcribe.sh` + `append-actions.sh` + recap writer; test on one real call | zaal | PR | 2026-08-12 |

## Sources

- discord.js Voice receive API - https://discord.js.org/docs/packages/voice/main/VoiceReceiver:Class
- Official recorder example - https://github.com/discordjs/voice-examples
- Craig (fork-target, rejected as too heavy) - https://github.com/CraigChat/craig and its SELFHOST.md
- Discorder (per-user record + local Whisper) - https://github.com/JacobLinCool/discorder
- Scripty (OSS Discord transcribe, no diarization) - https://codeberg.org/scripty-bot/scripty
- Recall.ai (confirmed no Discord) - https://www.recall.ai/
- Gladia Discord tutorial (paid, multi-platform future option) - https://www.gladia.io/blog/how-to-build-a-voice-to-text-discord-bot-with-gladia-real-time-transcription-api
- discord.js voice send/receive conflict - https://github.com/discordjs/discord.js/issues/4161
