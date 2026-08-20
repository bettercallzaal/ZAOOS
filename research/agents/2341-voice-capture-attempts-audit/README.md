---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "673, 674, 709, 1187, 1587, 2088, 2230, 2270"
original-query: "can u /zao-research all of our attempts at this tho - every attempt ZAO has made at a voice/meeting capture bot: Craig replacement, ZAOscribe, ZAI, the /meeting pipeline. Why did each stall, what shipped, what is the real blocker."
tier: STANDARD
---

# 2341 - Every attempt at a ZAO capture bot, and why none of them replaced Craig

> **Goal:** Name all six attempts at owning meeting capture, establish which parts actually shipped, and identify the single blocker - so the seventh attempt is a token, not a rewrite.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **DO NOT design a seventh architecture. The design is finished and the code exists.** | Six attempts produced one merged, typechecking implementation (`bot/src/zai/`, 942 lines). Every remaining gap is operational, not architectural. A new spec would be the fourth document describing the same bot. |
| 2 | **The blocker is one file: `~/.zao/private/discord.env`, which does not exist.** | `bot/src/zai/index.ts:20` loads env from that path. `config.ts` Zod-validates five values and throws without them. Creating a Discord application and minting its token is a Zaal action no lane can perform. |
| 3 | **KEEP Craig running until ZAI has produced a transcript that has been read.** | ZAI has never processed real audio (see Finding 3). Craig demonstrably works - it produced five recordings and four research docs in August 2026 alone. Retire the incumbent on evidence, not on a merge. |
| 4 | **ROUTE BY STREAM SHAPE, and note this already invalidates part of the plan.** Speaker-separated tracks transcribe locally; only a single mixed stream needs paid diarization. | Doc 2270 decision 2. Both Craig and ZAI produce one file per speaker, so attribution is free in both and the diarization work in docs 674/709 buys nothing for this path. |
| 5 | **ADD a first-real-run log line before deploying, not after.** | Nothing in `bot/src/zai/` calls `featureRan()`. Its only logs are `ZAI ready` and `Slash commands registered`, both of which fire at boot regardless of whether capture ever runs (`state-claims.md`, Silence is not evidence). |

## The six attempts

| # | Attempt | Doc | Date | Shipped? | Why it stopped |
|---|---------|-----|------|----------|----------------|
| 1 | `/meeting` skill - manual Craig URL to transcript | [673](../../dev-workflows/673-meeting-capture-skill/) | 2026-05-18 | **YES, and still in daily use** | Nothing stopped it. It works; a human is the glue. |
| 2 | ZAOscribe as a **Telegram** bot | [673](../673-zao-craig-spec-live-audio-todo/) | 2026-05-20 | No | Superseded 2 days later. Telegram Bot API cannot read voice-chat audio at all. |
| 3 | ZAOscribe as a **Discord** bot | [674](../674-zaoscribe-discord-best-plan/) | 2026-05-21 | No | Repo `bettercallzaal/zaoscribe` was never created. Doc 709 recorded it a day later as "Planned, spec locked, build not started." |
| 4 | Invite **Craig itself** to the ZAO Discord | [1587](../../technology/1587-craig-bot-fractal-democracy-recording/) | 2026-07-20 | Partly - Craig is in use | The archive goal (64+ Fractal sessions) has no completion record. |
| 5 | **ZAI** live capture + Q&A bot | [1187](../1187-zai-discord-live-capture/) | 2026-07-17 | **Code merged** (PR #1760) | Never deployed. No token, no npm script until 2026-08-20. |
| 6 | ZAI **auto**-capture, terminal step removed | [2088](../2088-zai-discord-voice-auto-capture/) | 2026-07-27 | No | Decision doc only. Restates the build already merged ten days earlier. |

Two adjacent docs inform the same problem without being attempts: [2230](../../dev-workflows/2230-clawd-scribe-meeting-capture-adopt/) (what to adopt from `clawdbotatg/clawd-scribe`, MIT) and [2270](../../dev-workflows/2270-assemblyai-spaces-capture-pipeline/) (when to pay for diarization).

## Findings

### 1. The pattern is a decision loop, not a build failure

Attempts 2, 3 and 6 are all decision documents. Each re-derives an architecture, locks it, and stops. Doc 674 "supersedes 673" two days after 673 locked "all 8 decisions." Doc 2088 was written on 2026-07-27 to decide whether to build a Discord voice recorder - **ten days after that recorder was merged to main** on 2026-07-17.

Doc 2088's `original-query` is nearly verbatim what Zaal asked again on 2026-08-20: *"Instead of Craig bot use a ZAO bot to capture Discord voice... see if it is easy or we can copy something open-source."* The same question has now been researched three times across three months.

This is `agent-loops.md` rule 3 exactly - "docs overstate what's missing; usually 'build X' is really 'X exists, wire the last 10%'" - and the loop persisted because no document ever recorded that the code had landed.

### 2. What shipped is more than any single doc claims

Ground truth from the repo, not from the docs:

- `bot/src/zai/` - **942 lines** across six modules (`index.ts` 388, `voice-capture.ts` 207, `llm-handler.ts` 189, `wav.ts` 57, `config.ts` 49, `types.ts` 52), merged in PR #1760.
- `@discordjs/voice` ^0.17.0, `@discordjs/opus` ^0.9.0, `discord.js` ^14.14.0, `prism-media` ^1.3.5 - all in `bot/package.json` dependencies.
- `.claude/skills/meeting/scripts/` - `fetch-craig.sh`, `transcribe.sh`, `trim-loops.sh`, `diarize.sh`, `diarize.py`, all present and executable (verified 2026-08-20).
- `mlx_whisper` v0.4.3 at `~/.local/bin/mlx_whisper`, local Apple Silicon transcription.
- `npx tsc --noEmit` in `bot/`: **exit 0, 0 errors** (with `node_modules` confirmed populated at 239 entries first).

The back half has worked for months. Doc 2088 said so: "the whole back half already exists... Only the recorder is new." The recorder then got built, and the doc was never updated.

### 3. ZAI has never processed real audio - and there is hard evidence

PR **#2966** (2026-08-08) is titled *"Discord transcription was never decoding Opus - and the WAV header lied."* Its body: **"ZAI's Discord voice capture has been writing transcripts the entire time. They were transcripts of noise."**

Two defects, either fatal alone:

1. `connection.receiver.subscribe()` yields **Opus** packets. The original code collected those bytes and passed them straight to Whisper, with a comment saying the decoder happens elsewhere - and no decoder was ever written. Both `prism-media` and `@discordjs/opus` were already declared and pinned, and neither was imported anywhere in `bot/src`.
2. `constructWav` treated each **byte** as a 16-bit sample, declaring `dataLength = bytes.length * 2`. A 1000-byte payload produced a header promising 2000 bytes, every sample in 0..255 - roughly -60 dBFS, silence to any decoder - and declared mono while Discord decodes to stereo.

That bug survived **22 days** on main, from 2026-07-17 to 2026-08-08, and was found by code review rather than by output. Nobody noticed because nobody ran it: a `/join` would have produced visibly garbled transcripts within a minute. Its survival is the proof that attempt 5 was merged and never operated.

The commit itself names the shape: *"Nothing errors. Nothing logs... a green path producing nothing real"* - `silent-failure-guard.md`.

### 4. The blocker is a credential, not a codebase

`bot/src/zai/index.ts:20` loads env from `~/.zao/private/discord.env` (overridable via `ZAI_ENV_FILE`). **That file does not exist on this machine** - verified 2026-08-20; the directory holds `tg.env`, `neynar.env`, `farcaster-zaal.env`, and `cowork-bot-tokens-20260607.env`, and no Discord env.

`bot/src/zai/config.ts` Zod-validates five values and throws without all of them: a Discord token (`DISCORD_CAPTURE_TOKEN` or `ZAI_DISCORD_TOKEN`), `ZAAL_GUILD_ID`, `ZAAL_USER_ID`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`.

A second, smaller gap was closed today: `bot/package.json` had `start` and `start:devz` but **no `start:zai`**, so the bot could only be launched by hand-typing the `tsx` invocation. PR **#3190** adds `start:zai` and `dev:zai`.

Board card `e6145a0d` - "TOP BUILD: deploy the ZAI Discord voice-capture bot" - has carried this since **2026-07-21**, 30 days.

### 5. Craig is not actually the bottleneck it is framed as

The stated friction (doc 2088) is two manual steps: fetch Craig's URL, invoke the skill. Measured against August 2026 output, that friction has not blocked anything - five Craig recordings were captured and four became research docs (2316, 2338, 2339, and 2340 in flight).

What Craig genuinely costs:

- **A 5-day expiry.** Recordings are deleted; the download is the only durable copy.
- **Disk.** Five recordings totalled roughly **3.5GB** as multitrack WAV.
- **A silent gap.** Doc **2186** (Zaal x Jose x Jim, 27 minutes) has a merged 4.4KB README and **no `transcript.md`** - found during this audit. The recap survived, the record did not, which is `recap-followthrough.md`'s exact warning.

That last one is the strongest argument for owning capture: an in-house bot writes the transcript on the same path that writes the recap, so a doc cannot exist without one.

### Contradiction, flagged not resolved

Docs 674 and 709 both invest in diarization (sherpa-onnx, pyannote) as core to the build. Doc 2270 decision 2 later concluded that speaker-separated tracks make paid or modelled diarization pointless, since attribution is already perfect. **Both Craig and ZAI produce per-speaker streams.** So the diarization work in the 674/709 lineage does not apply to this path at all - it applies only to single mixed streams such as X Spaces. Doc 2270 corrected this in its own second draft. The earlier docs were never updated, and a reader starting at 674 would still build the wrong thing.

### What multitrack does not fix

Per-speaker audio guarantees **who** spoke, never **what it meant**. Doc **2316** was built from a clean Craig multitrack and still recorded the Aziz spec/plugin exchange backwards, leaving both parties waiting on each other with a test due 2026-08-22. Perfect attribution, inverted obligation. Any capture bot inherits this: the extraction step needs a direction check on every exchange where something is owed.

## Also See

- [Doc 673 - meeting capture skill](../../dev-workflows/673-meeting-capture-skill/) (the one that shipped)
- [Doc 674 - ZAOscribe Discord plan](../674-zaoscribe-discord-best-plan/)
- [Doc 709 - transcription pipeline audit](../../dev-workflows/709-meeting-transcription-pipeline-audit/)
- [Doc 1187 - ZAI live capture](../1187-zai-discord-live-capture/)
- [Doc 1587 - Craig bot for Fractal](../../technology/1587-craig-bot-fractal-democracy-recording/)
- [Doc 2088 - ZAI auto-capture decision](../2088-zai-discord-voice-auto-capture/)
- [Doc 2230 - clawd-scribe adopt spec](../../dev-workflows/2230-clawd-scribe-meeting-capture-adopt/)
- [Doc 2270 - AssemblyAI vs local](../../dev-workflows/2270-assemblyai-spaces-capture-pipeline/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create the Discord application, mint its token, write `~/.zao/private/discord.env` (chmod 600, never committed), invite the bot with voice permissions | @Zaal | Credential | 2026-08-22 |
| Merge PR #3190 so `npm run start:zai` exists | @Zaal | PR | 2026-08-22 |
| Add a `featureRan('zai-capture')` line on the success path of `voice-capture.ts`, so a first real run is provable | @Zaal | PR | 2026-08-24 |
| Run ZAI in one live voice channel, read the transcript end to end, and confirm it is speech and not noise (the #2966 regression check) | @Zaal | Verification | 2026-08-25 |
| Backfill `transcript.md` into doc 2186 from `craig-3JJlYvlHZhYg` before that recording expires | @Zaal | PR | 2026-08-22 |
| Update docs 674 and 709 with a pointer to doc 2270 decision 2, so the diarization contradiction stops propagating | @Zaal | PR | 2026-08-27 |
| Close board card `e6145a0d` when a ZAI transcript has been read | @Zaal | Board | 2026-08-25 |

## Sources

All sources are this repository and this machine; no external fetches were needed or made.

- [FULL - read on disk] `bot/src/zai/` - all six modules, line counts via `wc -l`
- [FULL - `git show 89aa48c9`] PR #2966 commit message, quoted verbatim
- [FULL - `git log --follow`] `bot/src/zai/` history: 0a55e5a3 (2026-07-17), e975954b (2026-08-07), 89aa48c9 (2026-08-08)
- [FULL - read on disk] `bot/src/zai/config.ts`, `bot/src/zai/index.ts:20`, `bot/package.json`
- [FULL - read on disk] Docs 673 (both), 674, 709, 1187, 1587, 2088, 2230, 2270 frontmatter and status sections
- [FULL - `npx tsc --noEmit` in `bot/`] exit 0, 0 errors, `node_modules` at 239 entries
- [FULL - `ls ~/.zao/private/`] four env files present, `discord.env` absent
- [FULL - `ls` on merged doc dirs] 2186 has README.md and no transcript.md; 2316, 2338, 2339 each have both
- [FULL - PostgREST query] board card `e6145a0d`, open since 2026-07-21
