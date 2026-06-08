---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-06-08
related-docs: "241, 736"
original-query: "/meeting logeshxzaalcraig - testing X Space audio: streaming computer audio into the Space"
tier: STANDARD
---

# 818 - Logesh x Zaal: X Space audio extension test (SongJam)

> **Goal:** Test Logesh's Chrome extension that streams computer/tab audio (music) into an X Space, and decide the UI/feature direction.

- **Date:** 2026-06-08
- **Duration:** ~10 min
- **Attendees:** Zaal, Logesh ([SongJam](../241-q1-2026-big-wins/) - Adam & Logesh; merged Zaal's SongJam PR #21)
- **Platform:** Discord/Craig recording (screen-share working session)
- **Project:** ZAO Devz / general

## What happened

Logesh shipped Zaal a Chrome extension (loaded unpacked via developer mode -> unzip -> "load whole folder") that injects audio controls into X Spaces. In the session they:

- Loaded the extension, launched a fresh Space (it auto-connected), confirmed the mic button detected + active, and enabled "share tab audio."
- Played music ("fractalgram") from a browser tab into the Space. Audio came through clean once mic was set to 0 and tab audio to 100%.
- Found the built-in audio **mixer** unnecessary and decided to remove it in favor of a simpler tab-audio passthrough plus a **soundboard** (load short SFX clips, click-to-play).
- Logesh framed the build philosophy: free small tools for the community drive goodwill + future connections; paid pricing is reserved for a genuinely higher-value service (auto X-Spaces transcription).

Zaal can now load/test the extension on his own, asynchronously.

## Decisions

| # | Decision | Owner | Confidence |
|---|----------|-------|-----------|
| 1 | Remove the audio mixer; keep mic at 0% + tab audio at 100% (mixer is unnecessary) | Logesh | high |
| 2 | Add a soundboard (load short SFX clips, click-to-play) - "soundboard is a lot better than a mixer" | Logesh | high |
| 3 | Add in-extension play/pause controls + a repositionable icon | Logesh | high |
| 4 | Ship the tool free to the community; reserve paid pricing for a higher-value auto-transcription service | Logesh | medium |

## Actions

| Title | Owner | Category | Confidence |
|-------|-------|----------|-----------|
| Remove mixer, simplify audio routing (tab 100 / mic 0), add an SFX soundboard | Logesh | Site/Tech | high |
| Add play/pause controls + repositionable icon to the extension UI | Logesh | Site/Tech | high |
| Test the extension asynchronously now that loading works | Zaal | Site/Tech | high |
| Scope an auto X-Spaces transcription -> email-to-WaveWarZ tool as a paid product (~$10-15/mo) | Zaal | Other | medium |

(Logesh's three tool-build actions are external/SongJam and live here only; Zaal's two went to the cowork tracker.)

## The transcription opportunity

The most commercially interesting thread: WaveWarZ currently loses data because X Spaces are not being captured. Logesh would pay ~$10-15/month for a tool that **automatically** pulls each Space's transcript and emails it to the WaveWarZ account ("Wave Wars Afterspace is done, transcribe it and send that in an email") - zero manual steps. He is unsure of the broader market but believes some would pay. This is a concrete, self-funding wedge product distinct from the free audio extension.

## Key quotes

- Logesh: "Soundboard is a lot better than a mixer."
- Logesh: "build small tools like this, give it out for free... teach them how to use it themselves... that leads to a lot more goodwill down the line."
- Logesh: "the WaveWarZ team would be willing to pay 10-15 a month for a tool that automatically pulled all of our transcriptions from the X spaces."
- Logesh: "we're losing a lot in data loss... we're not capturing a lot of the spaces."

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Test the SongJam X-Space audio extension async | Zaal | Tracker | This week |
| Scope the auto X-Spaces transcription -> WaveWarZ-email tool (paid ~$10-15/mo) | Zaal | Tracker | Next |
| Ship extension v2 (no mixer, soundboard, play/pause, movable icon) | Logesh | External | Logesh's call |

## Also See

- [Doc 241](../241-q1-2026-big-wins/) - SongJam collaboration (Adam & Logesh), Zaal's SongJam PR #21
- [Doc 736](../../events/736-shriyash-soni-apnacoding-jun/) - adjacent X Spaces / dev-tooling collaborators

## Transcript

Full transcript: [transcript.md](transcript.md)
