---
topic: technology
type: decision
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 2271, 2275, 601
original-query: "what if its while im doing work so that i can send a just out loud me talking to the bot so it knows how i was thinking and can improve being part of my workflow... i wanna do like back and forth but not just macOS dictation."
tier: DEEP
---

# 2278 - Ambient voice: build capture, not command

> **Goal:** Decide what thin thing ZAO can wire from `mlx_whisper` + `transcribe.ts` + `lane-send` to get thinking-aloud into the agent loop, without building an always-on mic that can execute what you mutter.

## The recommendation, up front

**Build ambient CAPTURE. Do not build ambient COMMAND.**

A rolling local transcriber writes what you say to a file. ZOE reads that file as context. **Nothing you say reaches a lane unless you say a wake phrase.** Default is capture; delivery is explicit and rare.

Say yes or no to exactly this:

> A `zao-listen` daemon records the mic in 30-second chunks, runs each through the already-installed `mlx_whisper` with the existing ZAO glossary as `--initial-prompt`, and appends the text to `~/.zao/voice/YYYY-MM-DD.md`. ZOE reads that file the way it reads a topic file. A line containing "hey zoe" (and only such a line) is additionally routed through `lane-send` to the named lane. Push-to-talk hotkey to pause. One afternoon of work, no new paid service, nothing leaves the machine.

## Key Decisions

| # | Decision | Grounding |
|---|---|---|
| 1 | **Capture by default, command only on a wake phrase** | `lane-send` types text into a tmux pane and presses Enter. Its own header records the fleet relay delivering a URL into `cowork`'s **zsh prompt**, where only zsh's globbing stopped it executing. Ambient audio into that path is a shell-injection vector spoken aloud |
| 2 | **Use `mlx_whisper` in a chunk loop, not a streaming engine** | `mlx_whisper --help` confirms it is file-in/text-out with no mic or stream flag. The canonical streaming project (`ufal/whisper_streaming`, MIT, 3,662 stars) recommends **faster-whisper on CUDA** - wrong hardware for a Mac - and was last pushed **2025-11-12**, nine months stale |
| 3 | **Reuse the glossary that already exists** | `bot/src/zoe/transcribe.ts` already ships a ZAO proper-noun glossary with a `whisperPrompt` and a corrections map. `mlx_whisper` accepts `--initial-prompt`. Same fix, local |
| 4 | **Do NOT adopt voicebridge, despite it being the closest fit** | Its LICENSE is **PolyForm Noncommercial 1.0.0** ("Copyright (c) 2026 Berkay Turancı"). GitHub's API reports `NOASSERTION`, which hides this. Noncommercial-only is disqualifying for ZAO |
| 5 | **Do not buy a pendant for this** | Every Limitless integration found is **retrieval-after-the-fact** - an MCP that searches past recordings. That is the batch model already ruled out. Also: the company was reportedly acquired by Meta |
| 6 | **Expect the transcript to be mostly noise, and design for that** | Thinking-aloud is self-correcting and fragmentary. The value is a searchable record of reasoning, not a clean instruction stream |

## Why this is not a solved problem

The field is far smaller than the announcements suggest. GitHub repository search, run today:

| Query | Total repos | Top result |
|---|---:|---|
| `voice+claude+code+agent+speech` | **16** | `berkayturanci/voicebridge` - **8 stars** |
| `whisper+streaming+realtime` | 39 | `ufal/whisper_streaming` - 3,662 stars, **pushed 2025-11-12** |
| `parakeet-mlx` | 27 | `senstella/parakeet-mlx` - 972 stars, pushed 2026-06-05 |
| `limitless+pendant` | 34 | `panguin6010/awesome-limitless` - 74 stars |
| `whisper.cpp+stream+microphone` | **0** | - |

**Sixteen repositories exist for voice-plus-coding-agent, and the best has eight stars and was created two months ago.** Nobody has shipped this. Anything we do here is building, not adopting - which is worth knowing before estimating.

### The closest existing tool, and why we still cannot use it

`berkayturanci/voicebridge` (8 stars, created 2026-06-13, pushed 2026-08-10, JavaScript) is genuinely well made. From its README:

> **Hands-free, two-way voice for your coding agent from your phone** [...] You speak **or type** on your phone, a coding agent (running on your Mac, Windows PC, or Linux box) does the work, and the reply streams back as chat **and** spoken audio - like a phone call with your agent.

It has the pieces we would want: local Whisper STT (`STT_MODE=whisper`) or a streaming WebSocket transcriber (`STT_MODE=whisper-stream`), browser TTS with no per-minute cost, sentence-by-sentence streamed speech with a Stop button, a one-dependency Node bridge, and Tailscale transport. The Claude backend is the fully-implemented one.

**Two reasons it is not the answer:**

1. **License.** PolyForm Noncommercial 1.0.0, read from the LICENSE file directly. Not usable for ZAO.
2. **It is turn-based by design.** Its own metaphor is *"like a phone call with your agent."* A phone call is push-to-talk with extra steps. It solves hands-free; it does not solve ambient.

That second point is the important one, and it generalises: **every tool in this space is turn-based.** The ambient case has no implementation to copy.

## The hard problem is segmentation, not transcription

Transcription is solved. `mlx_whisper` already did a 23-minute call locally today. The unsolved part is deciding which words were meant for the agent.

This is `first-handler-wins.md` in a new place. That rule was written after `build:` was swallowed by a batch-answer guard because both matched the same input. Ambient voice is the same shape with a worse blast radius: the "handlers" are *muttering*, *dictating a note*, *instructing an agent*, and *talking to another human in the room*, and they are acoustically identical.

Three failure modes, in ascending cost:

1. **Self-correction pollutes the record.** "So the fix is in the dedupe - no wait, it's the scheduler" is one thought with a retraction. A transcript keeps both. Any consumer must treat later statements as superseding earlier ones, which is exactly `zao-topic`'s rewrite-don't-append rule applied to speech.
2. **Whisper hallucinates on silence.** `mlx_whisper` exposes `--hallucination-silence-threshold` precisely because this is a known failure. An always-on mic in a quiet room generates confident text from nothing. Under ambient-command that text would be *delivered somewhere*.
3. **Delivery to a non-Claude pane executes.** `lane-send`'s header documents this happening for real. Its guard - refuse unless a live `claude` process runs in the pane - is already the right defence, and it is the reason ambient-command must not be built before ambient-capture has been lived with.

**A wake phrase collapses all three.** Muttering has no consequence; only an explicit "hey zoe" crosses into delivery. That is the specific-before-generic ordering `first-handler-wins.md` rule 1 requires, and it fails safe: a missed wake phrase means nothing happens, which is recoverable. The inverse is not.

## What is already on this Mac

Verified today, not assumed:

| Piece | Path | State |
|---|---|---|
| `mlx_whisper` CLI | `~/.local/bin/mlx_whisper` | Installed. Batch only - no `--stream`, no mic input. Exposes `--initial-prompt` and `--hallucination-silence-threshold` |
| Groq Whisper transcription | `bot/src/zoe/transcribe.ts` (7,656 b) | Exports `transcribeAudio`, `transcribeTelegramFile`, `downloadTelegramFile`, `transcriptionConfigured`, `GLOSSARY_PATH`. Carries a ZAO proper-noun glossary + corrections map |
| Lane delivery | `~/bin/lane-send` (2,674 b) | Types into a tmux pane. Already guards: refuses unless a live `claude` runs there. Has `--check` to test deliverability without acting |
| Lane spawn/resolve | `~/bin/zao-lane` (7,753 b) | The lane layer doc 2275 covers |

So three of four pieces exist. **The missing piece is the loop: record -> chunk -> transcribe -> append.** That is the thin thing.

Worth noting `transcribe.ts`'s own header, because it explains why the glossary matters and why it silently failed before:

> TWO THINGS WERE WRONG HERE, and both were invisible because the only reader swallowed every error and returned null. [...] `../../../../` from here resolves ABOVE the repository root - the glossary was never at the path being read, on any machine.

A voice pipeline that loses proper nouns produces "Wave Wars" and "the Zao", which is a `feedback_zao_voice` problem arriving through a microphone. Wire the glossary in from the start.

## Streaming engines, honestly assessed

| Option | Reality |
|---|---|
| `ufal/whisper_streaming` (MIT, 3,662 stars) | The reference implementation. Its paper abstract reports **3.3 seconds latency** on unsegmented long-form speech using a **local agreement policy with self-adaptive latency**. But: recommended backend is **faster-whisper with CUDA/CUDNN** - NVIDIA, not Apple Silicon - and last push was **2025-11-12** |
| `senstella/parakeet-mlx` (972 stars, pushed 2026-06-05) | Nvidia Parakeet on Apple Silicon. The liveliest MLX speech project found, and the natural upgrade path if chunked `mlx_whisper` latency proves too slow |
| `fluxions-ai/vui` (743 stars, pushed 2026-07-30) | Real-time voice assistant, WebRTC + faster-whisper. Whole-assistant, not a component |
| `whisper.cpp` mic streaming | GitHub search for `whisper.cpp+stream+microphone` returned **0 repos**. The upstream `stream` example exists in whisper.cpp itself; no ecosystem around it |

**3.3 seconds is the number to hold.** Ambient back-and-forth at 3.3s round-trip is usable for "answer me while I work"; it is not conversational. Chunked `mlx_whisper` at 30s windows is far slower than that, which is fine for capture and unusable for dialogue - another reason to separate the two modes rather than build one system that does both badly.

## Hardware: the pendant ecosystem is the batch model

`limitless+pendant` returns 34 repos. The substantive ones are all MCP servers:

| Repo | Stars | What it does |
|---|---:|---|
| `panguin6010/awesome-limitless` | 74 | Curated list |
| `boyleryan/mcp-limitless-server` | 22 | MCP connecting to Limitless |
| `ericbuess/limitless-ai-mcp-server` | 14 | MCP for Pendant **recordings** |
| `maplehilllabs/mcp-limitless` | 9 | MCP: **search, retrieve, analyse** |
| `sdelcore/pendant-cli` | 9 | CLI for the pendant |
| `shade-familiar/limitless-libre` | 9 | Open-source firmware (nRF5340) |

Every one is retrieval: *search past recordings*. Nobody found piping a pendant live into a coding agent. So a pendant buys the thing already ruled out - record now, process later - at the cost of a second always-on microphone.

There is also a corporate-control question. An HN story dated **2025-12-05** carries the FT headline *"Meta buys AI pendant startup Limitless to expand hardware push"*. **I could not read the article - ft.com returned 403** - so treat the acquisition as reported-not-verified. If true, it makes an always-on household mic a Meta-operated one, which is a decision about the house, not about the workflow.

## Privacy and cost, stated plainly

**Privacy.** An always-on mic in a home records people who did not consent - that is `pii-hygiene.md`'s threat model with a microphone attached. Two properties make the local design defensible: audio never leaves the Mac (`mlx_whisper` is local), and the transcript lands in `~/.zao/voice/`, which is off-repo like `~/.zao/private/`. Neither is optional. A cloud STT path (Groq, as `transcribe.ts` uses for Telegram) is fine for a deliberate voice note and **not** fine for ambient capture, because the consent model is different.

**Cost.** Local inference is electricity, not tokens - the real ceiling is that continuous transcription competes with the machine's other work. But the downstream cost is the one to watch: `agent-spend.md` prices a turn at about **$1.01**, so a pipeline that turns muttering into agent turns is a meter that runs while you think. Capture-to-file has no per-turn cost at all; only the wake phrase spends.

## Findings

1. **Nobody has built this.** 16 repos, best is 8 stars and two months old.
2. **The closest tool is unusable twice over** - PolyForm Noncommercial, and turn-based by design.
3. **Transcription is solved; segmentation is not**, and segmentation is where the danger lives.
4. **Three of four pieces already exist on this Mac.** The gap is a record-chunk-append loop.
5. **The pendant ecosystem is retrieval**, i.e. the batch model already rejected.
6. **3.3 seconds is the state of the art latency** for streaming Whisper, on the wrong hardware, from a nine-month-stale repo.
7. **`lane-send`'s existing guard is the reason ambient-command is dangerous** - it documents a real incident of text reaching a shell prompt.

## Also See

- [Doc 2275](../../dev-workflows/2275-merging-terminals-topic-consolidation/) - the lane layer this would deliver into
- [Doc 2271](../../agents/2271-peter-skill-graph-loop-adoption/) - bars-before-work, the same discipline applied to spoken intent
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - no new bots without a doc; this is a daemon, and this is that doc

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Say yes or no to the `zao-listen` capture daemon described at the top | @Zaal | Decision | 2026-08-16 |
| If yes: build `zao-listen` - `sox`/`ffmpeg` 30s chunks -> `mlx_whisper --initial-prompt <glossary>` -> append to `~/.zao/voice/YYYY-MM-DD.md`. Shipped when a day's thinking-aloud is greppable and no lane received anything. | @Zaal | PR | 2026-08-20 |
| Extract the glossary from `bot/src/zoe/transcribe.ts` into a file both the TS path and the CLI path read, so corrections live once | @Zaal | PR | 2026-08-20 |
| Only after a week of capture-only: add the wake-phrase route through `lane-send --check` then `lane-send` | @Zaal | PR | 2026-08-27 |
| Re-evaluate `senstella/parakeet-mlx` for sub-second latency if capture proves useful and dialogue is wanted | @Zaal | Research | 2026-09-05 |

## Sources

- `~/.local/bin/mlx_whisper --help` - **[FULL]** method: ran locally. Confirms batch-only, `--initial-prompt`, `--hallucination-silence-threshold`.
- `bot/src/zoe/transcribe.ts`, `~/bin/lane-send`, `~/bin/zao-lane` - **[FULL]** method: read from disk; sizes and exported functions enumerated.
- GitHub repository search, 5 queries - **[FULL]** method: `api.github.com/search/repositories` via curl with a bearer token. Totals and star counts verbatim from the JSON.
- [github.com/berkayturanci/voicebridge](https://github.com/berkayturanci/voicebridge) - **[FULL]** method: `gh api` for metadata, README and LICENSE fetched and base64-decoded. License is PolyForm Noncommercial 1.0.0 from the file, not from the API field.
- [github.com/ufal/whisper_streaming](https://github.com/ufal/whisper_streaming) - **[FULL]** method: `gh api` metadata + README. MIT, 3,662 stars, pushed 2025-11-12, 3.3s latency and local-agreement policy quoted from its README abstract.
- [github.com/senstella/parakeet-mlx](https://github.com/senstella/parakeet-mlx) and the Limitless MCP repos - **[PARTIAL]** method: search-API metadata only (stars, dates, descriptions). READMEs not read.
- HN Algolia API - **[FULL]** method: keyless JSON via curl. Story titles, points and dates verbatim.
- ft.com Limitless/Meta article - **[FAILED]** method: curl with browser UA, HTTP 403 paywall. The headline and date come from HN's record; the acquisition is reported, not verified here.
- Reddit - **[FAILED]** method: every path 403 from this machine as of today; see doc 2277.

## Credit

`voicebridge` is **Berkay Turancı**'s (PolyForm Noncommercial). `whisper_streaming` is the **ÚFAL** group's (MIT). `parakeet-mlx` is **senstella**'s. The Limitless MCP servers are their respective authors'. Parakeet is NVIDIA's model.
