---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-27
superseded-by:
related-docs: "2341, 2088, 2270, 673, 160, 281, 1587, 2426, 2230, 695, 710, 712"
original-query: "One easy way for Zaal (and an agent) to be present and communicate in live audio rooms across Discord voice, Google Meet, X Spaces and Farcaster spaces - joining, listening, transcribing live, speaking or posting on his behalf, capturing to Bonfire and the vault. What exists open-source (Craig is already used for Discord recording; ZAI voice-capture code exists undeployed in ZAO OS V1/bot/src/zai; the telecast pattern is noted in doc 2426), what each platform's API allows for bots today, what is platform-native, and a glue-first verdict per platform (~/zao-vault/notes/glue-first-standard.md; run ~/.claude/skills/glue-first/bin/glue-check on every candidate repo)."
tier: DEEP
---

# 2427 - Agent presence in live audio rooms: Discord, Google Meet, X Spaces, Farcaster - the glue-first verdict per platform

> **Goal:** Give Zaal one entry point for being present in a live audio room on any of four platforms - with an agent that listens, transcribes, captures to Bonfire and the vault, and (where the platform allows) speaks or posts - built from what already runs plus configured open-source, per the glue-first ladder, with every candidate repo measured by `glue-check`.

Zaal, 2026-08-27, verbatim: "we should prep at some point an easy way to communicate in audio rooms with discord, google meet, x spaces, farcaster spaces would be really valuable".

**The short version.** The "easy way" already has a front door: the `/meeting` skill at `.claude/skills/meeting/SKILL.md` routes a Craig URL, an X Space URL, a Fathom URL, or an audio file into transcribe -> extract -> distribute (cowork tracker, `research/events/`, Bonfire, Telegram, vault). Three of the four platforms plug into that door at rung 1-3 of the glue ladder with zero new runtime code. The one place a live, in-room agent is both possible and ours is Discord, where ZAI (`bot/src/zai/`, 942 lines) exists - and this doc finds a second, verified reason it has never worked: it pins `@discordjs/voice` 0.17.0 from 2024, two majors behind the release that added Discord's now-required DAVE encryption. "Speaking on his behalf" is possible on exactly two platforms (Discord via discord.js playback, Meet via joinly) and is recommended on neither today - outbound stays gated and Zaal is in the room himself.

## Key Decisions

Recommendations first. Rung numbers are the glue-first ladder (1 platform-native, 2 OSS configured, 3 skill/config glue, 4 thin adapter, 5 new code).

| # | Decision | Rung | Rationale |
|---|----------|------|-----------|
| 1 | **The one entry point is `/meeting`. Extend its router, do not build a new surface.** Add `meet.google.com` (Meet's own transcript, read from Drive via the Google Drive MCP already on this Mac) and `juke.audio` (Juke recordings) to the URL router that already handles `craig.horse`, `x.com/i/spaces`, `fathom.video`, and file paths. | 3 | `SKILL.md:42-48` already classifies input by URL shape and dispatches per mode; `scripts/` holds `fetch-craig.sh`, `fetch-space.sh`, `space-pipeline.sh`, `transcribe.sh`, `diarize.sh`, `voiceprints.sh`, `bonfire-episode.sh`. Every distribution target the query names (Bonfire, vault, tracker) is already a phase of this skill. Doc 2341 decision 1 applies across the board: the design is finished; wire the last 10%. |
| 2 | **Discord: KEEP Craig for recording; DEPLOY ZAI for live presence, after bumping `@discordjs/voice` to `^0.19.2` and adding `@snazzah/davey`.** | 2 (Craig) + 4 (ZAI) | Craig: `glue-check` passes every measurable line (ISC LICENSE from file, pushed 2026-08-21, 14 contributors, Dockerfile, `.env.example`, 548 stars). ZAI: the lockfile pins `@discordjs/voice` **0.17.0** (2024-05-04). Upstream `CHANGELOG.md`: 0.19.0 (2025-08-17) "Implement DAVE end-to-end encryption (#10921)"; 0.19.1 (2026-03-09) "Always install Davey as DAVE is becoming required (#11385)". Pycord's tracking issue #3139 (open, 2026-03-04) exists because voice receive broke under DAVE. ZAI as pinned is expected to receive nothing - a third silent-failure on top of the two doc 2341 found. The credential blocker (`~/.zao/private/discord.env` missing) still stands. |
| 3 | **Google Meet: capture is platform-native (rung 1). Turn on Meet's own recording + transcript; the artifact lands in Drive; `/meeting` reads it.** For a LIVE agent in the room, USE **Vexa** (Apache-2.0, self-host) if listening is enough; USE **joinly** (MIT) only if the agent must speak. Do NOT wait on the Meet Media API. | 1, then 2 | Meet REST API v2: "Fetch conference artifacts, such as the recording and transcription" - after the call, read-only. Meet Media API: real-time streams, but "the Google Cloud project, OAuth principal, and all participants in the conference must be enrolled in the Developer Preview Program", and it only lists "Consume audio streams" - no sending. Vexa: pushed 2026-08-26, 30 contributors, "A bot joins your Google Meet, Microsoft Teams, and Zoom calls and streams speaker-attributed transcripts live"; joinly: "Join Google Meet, Zoom, and Microsoft Teams", "Whisper/Deepgram for STT and Kokoro/ElevenLabs/Deepgram for TTS", one 2.3 GB Docker image, MCP server - but 5 contributors with one author at 767 of 793 commits and last push 2026-03-19. |
| 4 | **X Spaces: capture-after is SHIPPED (`space-pipeline.sh`); there is no agent join, listen-live, or speak path we can adopt. Zaal is the presence; the agent posts text afterward if at all.** | 3 (shipped) | X API v2 Spaces endpoints: "look up live or scheduled audio Spaces, search by keyword, and inspect creators, hosts, speakers, and listener details" - metadata only, $0.005 per Space read on the 2026 pay-per-use plan. Every join/speak tool is browser automation with Zaal's session cookies: `danis5789/xspace-agent` has a LICENSE file reading "All Rights Reserved" (1 star, 2 contributors), which fails the licence line outright; `twspace-crawler` has no LICENSE file at all; `twspace-dl` is GPL-2 and last pushed 2024-11-21. Our pipeline is yt-dlp -> local mlx-whisper -> forced-count diarize -> voiceprints, and it ran on a 9-person Space on 2026-08-24. |
| 5 | **Farcaster: there is no native audio surface to be present in. Farcaster audio = Juke (LiveKit) and House/FarHouse (Huddle01, app-only). For Juke, the agent path is `livekit/agents` with a room token from Juke's own backend - ask Nick, do not fork.** | 2 | `miniapps.farcaster.xyz/llms.txt` (78 lines, fetched 2026-08-27): zero hits for audio, voice, spaces, rooms; `docs.farcaster.xyz/llms.txt` and `/sitemap.xml` both 404, so the protocol docs could not be grepped this run. Juke README: "Open-source Farcaster client with built-in audio spaces. A reference implementation other developers can fork for Farcaster + LiveKit-based audio projects", backend "owns ... LiveKit token issuance ... and recording orchestration", `livekit-api>=0.7.0` in `requirements.txt`. `livekit/agents`: Apache-2.0 from file, 13,193 stars, 100+ contributors, pushed 2026-08-27. Nick is a live collaborator (doc 2426: PR #1 open on his `juke-space-recap`). House/FarHouse: doc 160 records it app-only with no public bot docs; the scout found none either. |
| 6 | **Do NOT build agent-speak on any platform this quarter.** Listen + capture + post-text-after is the deliverable. | - | Outbound is human-gated (`agent-loops.md` rule 8). Where speaking is technically possible (Discord playback via `@discordjs/voice` `createAudioPlayer`, Meet via joinly), the room already has Zaal in it. The agent's value is the transcript nobody else writes and the follow-through that doc `recap-followthrough.md` says recaps lose. Revisit when a room is one Zaal is NOT in. |
| 7 | **Bonfire capture is blocked by the VPS outage, not by this design.** | - | The `/bonfire` skill posts through the VPS at `/root/cowork-zaodevz/agent/.env`; daily note 2026-08-27 line 652: "VPS 187.77.3.104 DOWN (port 22 timeout)". Recall runs locally. Until the VPS is back, `/meeting` writes the vault + tracker rows and queues the Bonfire episode. |

## What can a bot actually do on each platform (August 2026)

Evidence for each cell is in Findings. "Zaal" means the human does it natively; "agent" means unattended software.

| Capability | Discord voice | Google Meet | X Spaces | Farcaster (Juke) | Farcaster (House) |
|---|---|---|---|---|---|
| Join as participant | agent: YES (`joinVoiceChannel`, ZAI does this) | agent: YES via headless browser (Vexa, joinly); official API: NO | agent: NO official path; browser automation with cookies only | agent: YES if Juke issues a LiveKit token (`livekit/agents`) | UNVERIFIED - app-only, no bot docs found |
| Listen, per speaker | YES - Craig multitrack; `receiver.subscribe(userId)` in ZAI; needs DAVE-capable voice lib | YES - Vexa "speaker-attributed transcripts"; Meet Media API preview: receive-only, all participants enrolled | NO live path adopted; recording after via yt-dlp (`TwitterSpacesIE`) | YES - LiveKit per-track | UNVERIFIED |
| Transcribe live | agent: ZAI -> Groq Whisper (`bot/src/zoe/transcribe.ts`); OSS: `discord-voice-transcript`, `whisper-scribe`, `hammock` | agent: Vexa, joinly; Zaal: Meet's native transcript (Workspace) | Zaal: X's own captions/recording (help.x.com 403'd this run - UNVERIFIED); agent: post-hoc `space-pipeline.sh` | agent: LiveKit agents STT plugins | UNVERIFIED |
| Speak | possible (`createAudioPlayer`), not in ZAI | joinly only | NO adoptable path | possible (LiveKit agents TTS) | NO |
| Post text | YES - ZAI posts to the text channel | UNVERIFIED for in-call chat; Google Chat API separate | YES - X API write, $0.015 per Post: Create | YES - Neynar `POST /v2/farcaster/cast/` (ZOL already does) | via Farcaster cast |
| Recording after | Craig (`craig.horse`) -> `/meeting` | native Workspace recording -> Drive -> `/meeting` (new router row) | `fetch-space.sh` -> `/meeting` (shipped) | Juke "recording orchestration" -> `/meeting` (new router row) | House records (doc 160) - export UNVERIFIED |
| Capture to Bonfire + vault | `/meeting` Phase 4 | same | same | same | manual |

## Candidate repos, measured

Every line 1-3 below is `glue-check` output from 2026-08-27 (licence read from the LICENSE FILE, never the API field - Hard Requirement 13). Lines 4-8 are hand-verified from READMEs where stated.

| Repo | Licence (file) | Last push | Contributors (top / total) | Stars | Runs where we run | Verdict |
|---|---|---|---|---|---|---|
| CraigChat/craig | ISC ("Copyright (c) 2017-2021 Yahweasel, 2022-present TechBS LLC") | 2026-08-21 | Snazzah 571 / 14 | 548 | Dockerfile, `.env.example`, `SELFHOST.md` | **KEEP** (rung 2, in use) |
| meanwebuser/discord-voice-transcript | MIT | 2026-07-23 | 0 listed (API), commits by megamen32 | - | "built on Craig", Docker-first, "DAVE / MLS voice receive", "One recording track per speaker" | Watch. Single author, three commits in 180d. If ZAI's DAVE bump fails, this is the rung-2 fallback: Craig self-host + Whisper |
| merklejerk/whisper-scribe | MIT | 2025-12-14 | 1 / 1 | - | Node + Python Whisper WebSocket | Pattern reference only - single author, 0 commits in 180d |
| mbround18/hammock | AGPL-3.0 (glue-check read the file; the scout's "GPLv3" was wrong) | 2026-08-26 | 3, of which renovate[bot] | - | Rust, Docker | Skip - 0 human commits in 180d, AGPL |
| discordjs/discord.js (`packages/voice` 0.19.2) | Apache-2.0 | 2026-08-27 | 100+ | 26,802 | node | **KEEP, BUMP** - ZAI's dependency; DAVE via `@snazzah/davey ^0.1.11` |
| Vexa-ai/vexa | Apache-2.0 | 2026-08-26 | DmitriyG228 1973 / 30 | 2,721 | "Linux (Ubuntu 24.04) is the production target; a Mac with Docker Desktop works fine", Docker engine >= 26 | **USE for live Meet listening** (rung 2). Open issues 417 is the maintenance signal to watch; #883 (Jitsi transcript empty) closed 2026-07-21 |
| joinly-ai/joinly | MIT (Brockmann, Dittrich, Aurand) | 2026-03-19 | dbrockmann 767 / 5 | 564 | `docker pull ghcr.io/joinly-ai/joinly:latest` (~2.3 GB) | USE only if the agent must speak in Meet. Single-maintainer risk, 5 months since last push |
| Zackriya-Solutions/meeting-minutes (Meetily) | MIT | 2026-08-27 | 11 | 29,974 | desktop app, arm64 mention in README | Not a bot - local capture of whatever Zaal's Mac hears. Rung-2 alternative for Meet/House when no bot can join |
| mediar-ai/screenpipe | "Screenpipe Commercial License" (LICENSE.md; API says NOASSERTION) | 2026-08-27 | 100+ | 21,266 | - | **SKIP** - not open source by the file |
| livekit/agents | Apache-2.0 | 2026-08-27 | theomonnom 997 / 100+ | 13,193 | Python | **USE for Juke** (rung 2) |
| pipecat-ai/pipecat | BSD-2-Clause (Daily) | 2026-08-27 | 100+ | 14,817 | Python | Alternative agent framework; no Discord or Meet transport of its own found this run |
| 99darwin/farcaster-audio (Juke) | MIT | 2026-05-21 | 99darwin 467 / 1 | - | FastAPI + LiveKit + Expo; Dockerfile per doc 2426 | Collaborator's repo; agent joins through its token endpoint, we do not fork the room service |
| 99darwin/juke-space-recap, bettercallzaal/juke-space-recap | NO LICENSE FILE | 2026-06-08 / 2026-08-25 | 1 | - | Deepgram Nova-3 + Remotion | Our fork already exists; licence ask pairs with the telecast one (doc 2426) |
| yt-dlp/yt-dlp | Unlicense (public domain) | 2026-08-27 | 100+ | 187,378 | brew, arm64 x6 in README | **KEEP** - `fetch-space.sh` depends on it |
| HitomaruKonpaku/twspace-crawler | NO LICENSE FILE | 2026-07-29 | 7 | 260 | node >= 22 | SKIP - all rights reserved |
| Ryu1845/twspace-dl | GPL-2.0 | 2024-11-21 | 14 | 569 | python + ffmpeg | SKIP - dead 21 months, and yt-dlp covers it |
| robbie-wasabi/xspacecadet | MIT | 2024-12-18 | 1 | - | python | Skip - dead; our pipeline already does record + diarize + name |
| danis5789/xspace-agent | "All Rights Reserved" (LICENSE file) | 2026-08-27 | nirholas 1006 / 2 | 1 | Chromium + X cookies + Deepgram + ElevenLabs | **SKIP** - fails the licence line; also runs on Zaal's login cookies |
| imayhaveborkedit/discord-ext-voice-recv | MIT | 2025-06-18 | 3 | - | python (discord.py ext) | Skip - we are on discord.js; 0 commits in 180d |

## Findings

### 1. The front door exists and three platforms already walk through it

`.claude/skills/meeting/SKILL.md` line 42-48 classifies input as `craig_url`, `x_space`, Fathom, audio path, paste, or "unclear - ask one question". Line 45: "**x_space** - the input is an X / Twitter Space URL ... Route it through `space-pipeline.sh`". Line 909: "Transcription is local-first: mlx-whisper on Zaal's Apple Silicon mac (fast, offline)". `mlx_whisper` resolves at `~/.local/bin/mlx_whisper`; `ffmpeg` and `yt-dlp` at `/opt/homebrew/bin`. Phase 4 distributes to the tracker, `research/events/`, Bonfire (`scripts/bonfire-episode.sh`), Telegram, and memory.

What the query calls "an easy way" is therefore two router rows away for Meet and Juke, and already true for Discord (Craig) and X Spaces. That is rung 3 - skill glue, no runtime code - and it is the whole recommendation for capture.

### 2. Discord: the third silent failure in ZAI

Doc 2341 established two: Opus never decoded and a WAV header that lied (fixed in PR #2966), and the missing `~/.zao/private/discord.env`. This run adds one that survives both fixes.

- `bot/package.json`: `"@discordjs/voice": "^0.17.0"`. `bot/package-lock.json` pins **0.17.0** exactly. discord.js is pinned 14.14.0.
- Upstream `packages/voice/package.json` today: version **0.19.2**, dependency `"@snazzah/davey": "^0.1.11"`.
- Upstream `packages/voice/CHANGELOG.md`: 0.18.0 dated 2024-11-17; 0.19.0 dated 2025-08-17 with "Implement DAVE end-to-end encryption (#10921) ... by @Snazzah"; 0.19.1 dated 2026-03-09 with "Always install Davey as DAVE is becoming required (#11385)".
- `packages/voice/README.md` line 33: "Audio receive is not documented by Discord so stable support is not guaranteed" and line 68: "At this time, `@snazzah/davey` is the only supported DAVE protocol library in this package, and comes pre-installed."
- Pycord issue #3139 (open, created 2026-03-04): "This issue tracks all voice reception related bug reports ... This includes reworking voice reception to work with DAVE."

So the Python ecosystem's receive path is broken by DAVE and the Node path fixed it in 0.19.0 - a release ZAI's lockfile predates by fifteen months. The `@snazzah` who wrote the DAVE implementation is the same Snazzah with 571 commits on Craig, which is why Craig keeps working and why `discord-voice-transcript` ("DAVE receive ... built on Craig") is the natural fallback if the bump misbehaves.

The recommended bump touches `bot/package.json` only (`@discordjs/voice ^0.19.2`, add `@snazzah/davey`), then `npm install`, `tsc`, esbuild, and the first real `/join` with a transcript a human reads (doc 2341 decision 3). `voice-capture.ts` calls `connection.receiver.subscribe` and `receiver.speaking.on('start')`, both still present in 0.19 per the README; whether the `SpeakingMap` typing workaround at `voice-capture.ts:150-176` survives the bump is a typecheck question, not a research one.

### 3. Google Meet: two official APIs, neither is an agent in the room

**Meet REST API v2** (overview page, fetched raw): "Get meeting artifacts (recordings, transcripts, and transcript entries)"; "After a conference: Fetch conference artifacts, such as the recording and transcription"; artifacts "are saved to the meeting organizer's Google Drive. They're usually ready to be fetched soon after a conference ends." This is the rung-1 capture path: Zaal turns on recording/transcript, the transcript appears in Drive, and the Google Drive MCP connector already on this Mac (`mcp__claude_ai_Google_Drive__*`, `mcp__gdocs__*`) reads it into `/meeting`. No polling service needed - the Workspace Events API can notify, but a `/meeting <drive-url>` after the call is the glue-first answer.

**Meet Media API** (overview page, fetched raw): "To use the Meet Media API to access real-time media from a conference, the Google Cloud project, OAuth principal, and all participants in the conference must be enrolled in the Developer Preview Program." Capabilities listed: "Consume video streams. Consume audio streams. Consume participant metadata." Constraints: "cannot be connected when a meeting has encryption or a watermark"; "If the meeting owner has a consumer account (an account ending with @gmail.com), then the initiator must be present for the meeting to give consent". Receive-only, preview-gated, every guest enrolled - unusable for a ZAO call with outside guests.

**Headless-browser bots** are how every product does live Meet presence. Vexa README: "A bot joins your Google Meet, Microsoft Teams, and Zoom calls and streams speaker-attributed transcripts live"; self-host is `make all` on Docker engine >= 26 with a free transcription token from vexa.ai or a self-hosted GPU transcription unit. joinly README: "connector middleware designed to enable AI agents to join and actively participate in video calls. Through its MCP server ... " and "Built-in logic that ensures natural conversations by handling interruptions and multi-speaker interactions". joinly is the only one that speaks; it is also the one with the weaker maintenance line.

**Cost line** (recall.ai/pricing, fetched raw): "$0.50/hr of recording", "built-in transcription for $0.15/h", "7 days of free storage ... Afterwards, $0.05 per hour of recording retained for 30 days". That is the commercial ceiling; Vexa self-hosted is $0 plus a Mac or VPS with Docker.

### 4. X Spaces: the API is a directory, not a door

`docs.x.com/x-api/spaces/introduction` (fetched raw, HTTP 200): "Use the X API v2 Spaces endpoints to look up live or scheduled audio Spaces, search by keyword, and inspect creators, hosts, speakers, and listener details." "What's currently available: Spaces lookup ... Lookup by their creator ID, Lookup list of user who purchased a ticket, Search". Nothing returns audio; nothing joins; nothing speaks.

`docs.x.com/x-api/getting-started/pricing` (fetched raw): the 2026 model is pay-per-use credits - "No contracts, subscriptions, or minimum spend"; reads "Charged per resource returned in the response": "Posts: Read $0.005 per resource", "User: Read $0.010", "Space: Read $0.005 per resource"; writes "Post: Create $0.015 per request"; "Pay-per-usage plans are capped at 3 million Post reads per monthly billing cycle". An agent that discovers Zaal's scheduled Spaces and posts the recap afterward costs cents. The doc 2270 pipeline (AssemblyAI vs local, $0.17/hr diarized) and `space-pipeline.sh` remain the capture path; doc 2270 decision 2 (route by stream shape) is why a Space - one mixed stream - is the case that may justify paid diarization while Craig and ZAI never do.

`help.x.com/en/using-x/spaces` returned 403 to curl and SOURCE_NOT_AVAILABLE to exa, so X's native recording and caption features are **UNVERIFIED this run** (doc 160's table records "Recording: Yes, Transcription: Yes" for X Spaces as of 2026-05; treat as stale until re-fetched).

Every "agent joins a Space" tool is a Chromium session on the user's cookies. That is the pattern Zaal's own account would be risking, and the one repo pushed today has a LICENSE file that says "All Rights Reserved". The verdict is not close.

### 5. Farcaster: no protocol-level audio; Juke is the room, LiveKit is the door

Searched this run: `miniapps.farcaster.xyz/llms.txt` (200, 78 lines) - zero hits for `audio|voice|spaces`; `docs.farcaster.xyz/llms.txt` 404; `docs.farcaster.xyz/sitemap.xml` 404. The protocol docs were not grep-able this run; the absence claim rests on the mini-apps index, doc 160, and the scout sweep. The Farcaster scout's WebSearch sweep ("Farcaster audio rooms", "farcaster mini app voice chat", "Warpcast audio") surfaced only third-party apps, matching doc 160's May 2026 table (FarHouse/House, FC Audio Chat, Tavern, Huddle01, Soundcaster; the SongJam row in that table is retired and not re-cited here).

Juke is the one with source and a collaborator. README: "Farcaster Audio Client ... built-in audio spaces ... reference implementation other developers can fork for Farcaster + LiveKit-based audio projects"; the backend "Owns auth (JWT + SIWF/Quick Auth), audio room lifecycle, LiveKit token issuance, Farcaster feed proxying via Neynar, miniapp webhooks, and recording orchestration"; dependency table: "LiveKit | Real-time audio SFU. Required." A LiveKit room accepts any participant holding a token for it, and `livekit/agents` is the maintained, Apache-2.0 way to be that participant with STT and TTS plugins. The agent path is therefore: Nick's backend mints an agent token for a ZAO room -> a `livekit/agents` worker joins, listens per track, transcribes -> `/meeting`. No fork of `room_service.py` (2,414 lines, doc 2426) is involved. The ask to Nick is one sentence and rides on the telecast licence message doc 2426 already drafted (`drafts/ask-nick-telecast-license.md`).

House/FarHouse runs on Huddle01 (doc 160: "5,500+ spaces, 120K+ meetings", app-only, invite-gated). The scout found no bot or agent documentation in Huddle01's public docs and marked its infra claim "inferred". Nothing to glue today; Meetily-style local capture of what Zaal's phone plays is the only route, and it is not worth setting up for an app ZAO does not host on.

Posting a cast on Zaal's behalf is solved: ZOL on the Pi already posts via Neynar, and doc 2426's telecast is the Telegram-side pattern for the same signer flow.

### 6. Where the scouts were wrong, so the next lane does not repeat it

Four platform scouts ran (17, 20, 16, 36 tool calls). Corrections made after re-fetching:

- Discord scout: called `hammock` "GPLv3" - the LICENSE file is AGPL-3.0. Called `discord-ext-voice-recv` a discord.js patch - it is a discord.py extension. Its capability matrix line "Pipecat (LiveKit transport) - Discord JOIN YES" conflates two things; no Pipecat Discord transport was found.
- Meet scout: every Google API sentence came from WebFetch paraphrase. Re-fetched raw; the quotes above are from the page text. Recall.ai numbers re-fetched raw and match.
- X scout: reported X API pricing "UNVERIFIED - unreadable JavaScript" from developer.x.com. `docs.x.com` answers plain curl with the full page; the numbers above are from it. Called `twspace-crawler` and `xspace-agent` licences "UNVERIFIED" - `glue-check` read both files.
- Farcaster scout: 18 of 19 calls were WebSearch/WebFetch; it never opened Juke, the one Farcaster audio codebase we already fork. Its FarHouse figures are doc 160's figures re-found, not new measurement.

The convergent lesson is `research-grounding.md`: a summary tool's answer is recall, and `gh api` + `curl` cost the same turn and return the page.

### 7. Staleness and contradictions

- `@discordjs/voice` 0.19.2 is dated 2026-03-13; a 0.20 could change the receive API. Re-run `gh api repos/discordjs/discord.js/contents/packages/voice/package.json` before the bump PR.
- X pricing is the pay-per-use page as of 2026-08-27; X has changed developer pricing repeatedly. Stamp any figure quoted onward.
- Doc 160 (2026-05) says X Spaces has native recording + transcription; this run could not reach `help.x.com`. Not a contradiction, an unrefreshed claim.
- Vexa's 417 open issues against 100 commits in 180 days is a live project under load, not a dead one; joinly's 10 open issues against a 5-month push gap is the quieter and riskier line. Contributor counts, not stars, are the signal (glue-first checklist line 3).

## Also See

- [Doc 2341](../2341-voice-capture-attempts-audit/) - the six capture attempts; this doc adds the DAVE finding to its decision 2
- [Doc 2088](../2088-zai-discord-voice-auto-capture/) - the copy-not-build path that became ZAI
- [Doc 2270](../../dev-workflows/2270-assemblyai-spaces-capture-pipeline/) - X Space transcription cost and the route-by-stream-shape rule
- [Doc 673](../../dev-workflows/673-meeting-capture-skill/) - the `/meeting` skill spec this doc extends
- [Doc 160](../../music/160-audio-spaces-landscape-comparison/) - every Farcaster audio app as of 2026-05
- [Doc 281](../../music/281-audio-room-competitive-landscape/) - why FISHBOWLZ paused for the Juke partnership
- [Doc 1587](../../technology/1587-craig-bot-fractal-democracy-recording/) - Craig setup
- [Doc 2426](../../dev-workflows/2426-99darwin-code-adoption/) - Juke and telecast read as source; the Nick messages this doc piggybacks on (on branch `ws/research-2426-99darwin-code-adoption` at time of writing)
- [Doc 2230](../../dev-workflows/2230-clawd-scribe-meeting-capture-adopt/) - clawd-scribe adoption notes
- Docs [695](../../music/695-juke-integration-zao/), [710](../../music/710-juke-path-b-architecture/), [712](../../music/712-juke-integration-remaining-gaps/) - Juke integration history
- `~/zao-vault/notes/glue-first-standard.md` - the ladder and checklist applied above
- `~/zao-vault/notes/adoption-candidates.md` - add rows for Vexa and livekit/agents (Next Actions)
- Tracker rows found by Step 2.6: `handoff:audos-bcz-spaces` "BCZ Otto brief + X Spaces pipeline shipped" (todo, due 2026-08-23); `onenote:zaal-todos-2026-08-16` "Build a data stream of past Zaal X spaces / past shows"

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Bump `@discordjs/voice` to `^0.19.2` and add `@snazzah/davey` in `bot/package.json`; `npm install`, `tsc`, esbuild green; PR merged | Zaal | PR | 2026-09-03 |
| Create the Discord application, mint the bot token, write `~/.zao/private/discord.env` (5 keys per `bot/src/zai/config.ts`); first real `/join` produces a transcript Zaal has read - doc 2341 decision 3 closes | Zaal | Manual + verify | 2026-09-05 |
| Extend `/meeting` router with `meet.google.com` (Drive transcript via the Google Drive MCP) and `juke.audio` (Juke recording) modes; SKILL.md diff merged, one real Meet transcript processed end to end | Zaal | PR | 2026-09-10 |
| Turn on Meet recording + transcript as the default for ZAO calendar invites (Workspace admin setting); first artifact appears in Drive after a real call | Zaal | Config | 2026-09-05 |
| Add to the Nick message already drafted at `drafts/ask-nick-telecast-license.md`: "can Juke's backend mint a LiveKit token for a ZAO agent participant, and export a room recording"; message sent | Zaal | DM | 2026-08-29 |
| Append Vexa (Apache-2.0, live Meet listener) and livekit/agents (Apache-2.0, Juke agent) rows to `~/zao-vault/notes/adoption-candidates.md` | Zaal | Vault edit | 2026-08-29 |
| Decide whether a live listener in Meet is wanted at all before the ZAOstock Oct 3 run of calls; if yes, `make all` Vexa on the Mac (Docker Desktop) and run it on one internal call | Zaal | Decision, then config | 2026-09-12 |
| Re-fetch `help.x.com/en/using-x/spaces` from a browser session and refresh doc 160's X native recording/caption row | Zaal | Doc edit | 2026-09-05 |
| Bonfire episodes for meetings stay queued until the VPS (187.77.3.104) is back; Bonfire posting resumes and the queue drains | Zaal / Iman | Infra | 2026-09-01 |

## Sources

Method is stated per source so a reader can tell a verbatim quote from a reconstruction (`research-grounding.md`). Raw fetches are on disk under the session scratchpad `scouts/` and `raw/` for the life of the session only.

**Our own ground truth (all FULL - read from disk 2026-08-27)**
- `bot/src/zai/{index,voice-capture,config,types,llm-handler,wav}.ts` - read in full; `bot/package.json` and `bot/package-lock.json` for the `@discordjs/voice` 0.17.0 pin
- `bot/src/zoe/transcribe.ts` - Groq Whisper path
- `.claude/skills/meeting/SKILL.md` lines 28-48, 107-120, 235-252, 908-909; `.claude/skills/meeting/scripts/` listing; `space-pipeline.sh` and `fetch-space.sh` headers
- `~/zao-vault/notes/glue-first-standard.md`, `~/zao-vault/notes/adoption-candidates.md`, `~/zao-vault/daily/2026-08-27.md` (VPS down, telecast draft), `~/zao-vault/handoffs/bcz-spaces.md`
- Doc 2426 README from branch `origin/ws/research-2426-99darwin-code-adoption`; docs 2341, 2088, 2270, 673, 160, 281, 1587 from `research/`
- `zao-tracker search "audio"` and `"spaces"` (Step 2.6)

**glue-check runs (FULL - `gh api`, LICENSE read from the file)**
- 22 repos listed in the candidates table, run 2026-08-27 via `~/.claude/skills/glue-first/bin/glue-check`; `attendee-dev/attendee` returned "cannot read" and `gh search repos "attendee meeting bot"` returned nothing - **FAILED, not adopted**

**Platform docs (raw text)**
- [Google Meet Media API overview](https://developers.google.com/workspace/meet/media-api/guides/overview) - **[FULL - curl + HTML strip, 14,032 chars]**
- [Google Meet REST API overview](https://developers.google.com/workspace/meet/api/guides/overview) - **[FULL - exa web_fetch, page text]**
- [X API v2 Spaces introduction](https://docs.x.com/x-api/spaces/introduction) - **[FULL - curl 200 + HTML strip]**; [Spaces search](https://docs.x.com/x-api/spaces/search/introduction) **[FULL - curl]**
- [X API pay-per-use pricing](https://docs.x.com/x-api/getting-started/pricing) - **[FULL - curl 200 + HTML strip, 10,226 chars]**
- [help.x.com Spaces](https://help.x.com/en/using-x/spaces) - **[FAILED - curl 403, exa SOURCE_NOT_AVAILABLE; Wayback not attempted for a help page]**
- [developer.x.com/en/products/x-api](https://developer.x.com/en/products/x-api) - **[FAILED - 404]**
- [miniapps.farcaster.xyz/llms.txt](https://miniapps.farcaster.xyz/llms.txt) - **[FULL - curl 200, 78 lines, grep]**; [docs.farcaster.xyz/llms.txt](https://docs.farcaster.xyz/llms.txt) **[FAILED - 404]**; [docs.farcaster.xyz/sitemap.xml](https://docs.farcaster.xyz/sitemap.xml) **[FAILED - 404]**
- [recall.ai/pricing](https://www.recall.ai/pricing) - **[FULL - curl 200 + HTML strip]**

**GitHub (raw via `gh api`, FULL)**
- [discordjs/discord.js packages/voice README, CHANGELOG, package.json](https://github.com/discordjs/discord.js/tree/main/packages/voice) - DAVE lines quoted verbatim
- [Pycord-Development/pycord#3139](https://github.com/Pycord-Development/pycord/issues/3139) - open, created 2026-03-04, body quoted
- [Vexa-ai/vexa README](https://github.com/Vexa-ai/vexa), [#883](https://github.com/Vexa-ai/vexa/issues/883) closed 2026-07-21
- [joinly-ai/joinly README](https://github.com/joinly-ai/joinly)
- [meanwebuser/discord-voice-transcript README](https://github.com/meanwebuser/discord-voice-transcript)
- [99darwin/farcaster-audio README + backend/requirements.txt](https://github.com/99darwin/farcaster-audio); [bettercallzaal/juke-space-recap README](https://github.com/bettercallzaal/juke-space-recap)
- [yt-dlp/yt-dlp yt_dlp/extractor/twitter.py](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/twitter.py) - `TwitterSpacesIE` present; whether it handles a still-live Space is **UNVERIFIED** (grep for live-state handling was inconclusive)
- [CraigChat/craig README](https://github.com/CraigChat/craig) - points to `SELFHOST.md`; no transcription feature in the README

**Community**
- HN Algolia (keyless JSON), queries "meeting bot transcription" and "discord voice transcription", 2026-08-27 - **[FULL - thin]**: top hits are 1-5 point Show HNs (43749577 "Ask HN: Any way to not use meeting bots to get real time transcription in gmeet?", 2 points; 47235326 "Show HN: NoteCat - Record, Transcribe, Summarize Discord Voice Channels", 4 points). No substantive thread exists; the GitHub issue threads above (Pycord #3139, Vexa #883) are the community signal this doc leans on.
- Reddit: **[FAILED - not attempted; reddit is walled from this machine per doc 2282]**

**Scout reports (PARTIAL by construction - subagent prose, used for leads only, every retained claim re-fetched above)**
- Four platform scouts, 2026-08-27, raw saves under scratchpad `scouts/{discord,meet,xspaces,farcaster}/`
