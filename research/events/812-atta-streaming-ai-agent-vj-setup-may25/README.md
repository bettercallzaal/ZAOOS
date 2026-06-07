# 812 - ATTA x Zaal: VJ streaming setup + AI "out-of-body" performance agent (2026-05-25)

> **Goal:** Help ATTA - a Rochester-area VJ / musician in the COC Concertz orbit - build out his live-streaming rig (OBS / Resolume / Restream) and scope an AI "out-of-body" chat agent that can host his stream and answer viewers while he performs.

| Field | Value |
|-------|-------|
| Date | 2026-05-25 |
| Duration | ~40 min |
| Attendees | Zaal, attabotty (+ William briefly) |
| Platform | Video call (recorded) |
| Project | ZAO Devz / COC Concertz / tooling |
| Recap doc | this file |

Identity: the artist's handle is **attabotty** (the recording was labeled "ATTA"). A Rochester-area VJ / musician. The AI-agent idea below is a play on his name - an "attabotty" that hosts his stream. Backfilled from a 2026-05-25 recording on 2026-06-06.

## Who ATTA is

A Rochester-area visual + music artist building a full-stack live performance rig:
- **Projection mapping** via Resolume, driven from a second laptop and controlled over Parsec; OBS for the camera/AR layer; AR skin overlay with a QR code.
- **Music:** Pioneer DJ board (controller), concert flute (all 12 pitches) + Native American flute, and beats **Iman is producing for him**.
- **3D printing** (new printer, dryer box, multi-filament) - wants to print his own handheld game console parts.
- Learned the live-VJ trade from **Phil**; realized **video editing translates directly to live/Resolume editing**, so he now runs the full stack himself - "I'm the artist that can also be the technician."
- **COC Concertz connection:** shot a "Day in the Life of God Cloud" concert two weeks prior with his camera (lots of drone shots), and connected **God Cloud** with **Smoke Wavy** (both in Rochester).
- Helper **William** (younger, into Raspberry Pi / Batocera retro-gaming builds) was on the call briefly.

## The big idea - an AI "out-of-body" performance agent

The headline thread: build an AI agent that hosts ATTA's stream chat so he can focus on performing.
- Concept ("atabody"): the agent answers viewer questions live, runs an AMA at the end, summarizes what was said during the set, with **Whisper integration** so ATTA (or viewers) can talk to it. A real chat agent, not the "shitty 24/7 avatar" AI streams people already do.
- Build order: **get the LLM working/trained first**, then layer it onto OBS with Whisper.
- Zaal is connecting this to a dev already working on **OBS + LLM + LiveKit** streaming (the dev is on vacation until 6/2, call expected soon) - ties into the LiveKit thread ([[project_741_livekit_endorsed]]).

## Streaming-tooling notes (reusable)

- **Meld Studio** - free OBS alternative, supports many/infinite outputs + custom RTMP. Recommended to ATTA.
- **Restream** - what ZAO/WaveWarZ uses: multi-stream to YouTube / X (paid) / Twitch / Instagram, all comments land in one place, multiple hosts via the same email (add guests + alt accounts to beat the free 1-2 destination cap), recently added portrait/landscape (paid), graphics/overlays/captions/ticker/QR/live-sales-button tabs.
- **Sample** (Chrome extension) - high-quality capture of any audio playing in Chrome (Geek put ATTA onto it).
- Rig advice: dual monitor (or one wide), a second screen facing ATTA so he can see himself + interact with OBS without awkwardly turning around - a ~$60-100 portable screen on a long cable works.
- ATTA currently uses Instagram Live (easiest); exploring StreamYard (admin add via shared email) vs Restream for two-way audience feedback.

## Decisions / actions

| Title | Owner | Due | Confidence |
|-------|-------|-----|-----------|
| Talk to the OBS+LLM dev (Edward?) today, jump on a call, report back to Zaal | ATTA | - | high |
| Build the AI streaming chat agent (LLM first, then OBS + Whisper) | Both | - | medium |
| Zaal does his own OBS+LLM streaming research + shares notes | Zaal | - | medium |
| ATTA sends Zaal the recording of this session (his transcribe failed) | ATTA | - | low |
| ATTA gets a second screen (~$60-100) to face him while streaming | ATTA | - | low |
| Canon (ZAO Cards) + ATTA collaborate on card designs | Both | - | low |
| ATTA visits Maine; Zaal explores a small gig (talk to Steve re: the bar) | Both | - | low |

## Also See

- [[project_741_livekit_endorsed]] - the LiveKit streaming pick the AI-agent build ties into
- [[project_cannon_jones]] - Canon / ZAO Cards (design collab mentioned)
- [[project_steve_peer]] - Steve (the Maine bar gig)
- [Doc 735](../735-leewardbound-composite-streaming/) - composite-streaming / WebRTC thread (adjacent tooling)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Sync after attabotty's call with the OBS+LLM dev; decide the agent build plan | Both | Tech | After the dev is back (post 6/2) |
| Spec the "out-of-body" streaming agent (LLM + Whisper + OBS) | Both | Build | When the dev engages |

## Transcript

Full transcript: [transcript-raw.txt](transcript-raw.txt)
