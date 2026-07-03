---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-29
related-docs: 299, 420, 474, 673, 674
original-query: "Improving the Juke Space-to-recap-video pipeline (juke-space-recap, Remotion). What else can make an audio-Space/AMA recap video better - speaker identification automation, captions/chapters, visual design, shareability, audiograms best practices, accessibility, and the drop-a-link get-a-video flow. Tier: DEEP."
tier: DEEP
---

# 916 - Recap Video Pipeline: making Juke Spaces into great, repeatable recap videos

> **Goal:** Concrete upgrades to turn juke-space-recap (Deepgram + Remotion) from a manual one-off
> into a polished, shareable, near-hands-off "drop a Juke link, get a recap video" flow for the
> weekly ZABAL Gamez workshops. Grounded in the live pipeline at `~/Documents/juke-space-recap`.

## Context: what we run today
`~/Documents/juke-space-recap` - Deepgram Nova-3 transcribe + diarize -> map anonymous diarized
speakers to Farcaster @handles -> Neynar pfps -> Remotion render (per-speaker PFP cards, sentence
captions, FFT waveform) -> 1920x1080 MP4. Proven on the 64-min Farcaster Intern AMA. Pain points
found in that run: host auto-detection mis-picks the loudest voice (wrong for AMAs), speaker->handle
mapping is manual, one pfp host (seadn.io) refused fetch, a 550MB/64-min file, and the full render
took ~1hr on a laptop and died on session restart.

## Key Decisions (do these)

| # | Decision | Why | Phase |
|---|----------|-----|-------|
| 1 | KEEP manual/name-drop speaker mapping as the source of truth; build an auto-suggest helper, do NOT chase blind auto-ID | Farcaster has NO native Spaces API - there is no protocol speaker roster to pull. Manual roster = 100% accuracy, ~1-2 of effort per Space; blind diarization-to-identity has a 37% name-miss rate | Now |
| 2 | ADD word-level karaoke captions via `@remotion/captions` + `createTikTokStyleCaptions()` | We already get Deepgram `words[]` with per-word timestamps; word highlighting is the single biggest "feels pro" upgrade and is required for autoplay-muted feeds | Now |
| 3 | PRODUCE a 30-60s highlight clip with a 3-second best-quote cold-open, not just the 64-min archive | The shareable unit on Farcaster/X is the short clip; first 3s at >70% retention is a ~5x reach multiplier. The hour is the archive | Now |
| 4 | RENDER one 16:9 master, then ffmpeg crop/pad to 1:1 and 9:16; encode h265 CRF 26 | Render-once-crop-many is faster than re-rendering per aspect; h265 CRF 26 cuts 550MB to ~300MB at equal perceived quality | Now |
| 5 | FIX host detection to honor HOST_USERNAME over max-duration; ship the pfp unavatar fallback (DONE) and a neutral default avatar | The loudest-speaker heuristic mislabels the host in an AMA; a flaky avatar host should self-heal, not drop to a monster default | Now |
| 6 | AUTOMATE as a queue (Upstash Redis + BullMQ -> Remotion Lambda) for "drop a Juke link, get a video", with ffprobe validation + resumable renders | We already run Upstash for the activity backend; Lambda renders a 60-min video in ~90s for ~$1.08; durable jobs survive a worker crash (our session-death problem) | July |
| 7 | ADD LLM auto-chapters (8-10 per hour) -> on-screen lower-third + YouTube chapter export; dual burned-in MP4 + SRT/VTT sidecar | Chapters make a long recap scannable and feed our existing /recordings chapters work; SRT gives accessibility + YouTube SEO that burned-in cannot | July |
| 8 | ASK Juke (Nicky) for per-recording speaker metadata (FIDs + speaking timestamps) | Juke is the recorder and may hold the roster the Farcaster protocol does not expose; if it does, speaker mapping becomes fully automatic | Now (sent) |

## Findings by dimension

### 1. Speaker identification - automation ceiling is real
- **No Farcaster Spaces API.** Farcaster has no native Spaces feature; third-party Spaces (FarHouse, Soundcaster) run on external SDKs (daily.co). Neynar/Warpcast/protocol expose no speaker roster. Confirmed against the protocol spec. So you cannot pull "who was on stage" from Farcaster itself.
- **Diarization is identity-blind.** Deepgram Nova-3 ($0.0065-0.0077/min) and pyannote (free, 7.4-39% DER) only emit `speaker:0/1/2`. AssemblyAI ($0.0003/min) hits 96-98% diarization for 2-5 speakers, 90-94% for 6-10, and supports voice enrollment (NeMo TitaNet embeddings, EER 0.66%) if you pre-record 10-30s samples per panelist.
- **Realistic path:** manual roster (100%) + name-drop mining. Our AMA proved name-drops exist ("what up, Benny" host hand-off; "this is X" self-intros) but resolve ambiguously on Neynar (4 Bennys), so they ASSIST, not replace. Entity-span miss rate in conversational speech is ~37%.
- **Our tooling is already correct:** `build-speaker-intros.ts` (hosted-Space variant, speaker->handle map) is the right script, not `2-detect-intros` (roving-host "who are you" detection that returns 0 on an AMA).

### 2. Captions and chapters - concrete Remotion path
- `@remotion/captions` v4.0.216+ (`npx remotion add @remotion/captions`) provides `createTikTokStyleCaptions()`. Word-by-word highlight via `combineTokensWithinMilliseconds: 200-500`. Active word in brand gold; `whiteSpace: 'pre'` is mandatory or spaces collapse and sync breaks.
- **Deepgram seconds -> Remotion milliseconds**: `startMs = word.start * 1000`. Off-by-1000x breaks all timing.
- Animation: `spring({config:{damping:10, mass:0.5}})` for the "snappy not bouncy" pop. Fade-in 100-200ms beats bounce/glitch (those read amateur).
- Caption design consensus (Opus Clip / Submagic / CapCut): 48-60px sans-serif bold, 5-7 words/line, 2 lines max (14-16 words), 1-7s on screen, white-on-dark, 4.5:1 contrast (WCAG AA; large text only needs 3:1).
- **Auto-chapters**: no off-the-shelf plugin. LLM (Claude/GPT-4o-mini) over the transcript -> `[{startTime,endTime,title}]`, ~1 chapter/min (8-10 per hour). YouTube chapter format is strict: first must be `00:00`, min 3 chapters, min 10s spacing, `mm:ss Title`.

### 3. Visual design and shareability
- **Aspect**: render 16:9 master (X-safe, Farcaster standard), crop to 1:1 (feed) and 9:16 (vertical). 
- **Length**: 30-45s clips for feeds; the full session is archive. Optimal hook is a best-moment pull-quote cold-open, NOT chronological.
- **Autoplay is muted everywhere** -> burned-in captions are non-negotiable for the social clip.
- **Motion** that keeps audio from feeling dead: animated waveform (1.2-1.4x sensitivity, 0.85+ smoothing), speaker lower-third (name + org), 2-3px brand-color progress bar, ZABAL arcade frame. We already have the waveform; add the lower-third + progress bar + hook card.
- **Farcaster embed** wants HLS (.m3u8), not raw MP4, for reliable mobile playback.

### 4. Highlights and distribution
- **Auto-highlight**: Vizard ($0.14/min, speaker-insight scoring, REST API, free 300min/mo) or Klap ($0.23/min, direct social posting) score the best 30-90s moments; or a DIY LLM pass over our transcript (we already have it) scoring "most quotable/insightful." Opus Clip is cheapest ($0.10/min) but more manual.
- **Multi-format** via `fluent-ffmpeg`: `scale=...:force_original_aspect_ratio=decrease,pad=...` to 1:1 and 9:16 in parallel (~3 min for all three) - cheaper than Remotion re-render per aspect.
- **SRT/VTT sidecar** (WebVTT preferred for HTML5) for YouTube SEO + screen readers; burned-in for social. We already publish transcripts at /recordings, so the sidecar + a "Download captions" link is a small add.

### 5. Pipeline automation and cost
- **Render infra**: Remotion Lambda renders 60-min 1080p in ~90s for ~$0.65 compute; Cloud Run is ~$0.52 total but ~5 min (single vCPU). 
- **Cost per 60-min video** (Lambda + Deepgram Growth + Neynar): ~**$1.08**; Cloud Run ~**$0.52**; add Vizard $0.84 if auto-highlighting.
- **File size**: switch h264 CRF 23 -> h265 CRF 26: 550MB -> ~300MB, identical perceived quality.
- **Orchestration**: Upstash Redis + BullMQ (we already run Upstash via `KV_REST_API_URL`). Worker crash re-queues the job (fixes our session-death problem); store `{job_id, remotion_render_id, status}` so a restarted worker resumes by polling the render. Validate output with ffprobe `format.duration` within 1% before declaring done (fixes the moov-atom "invalid until exit" trap we hit).

## Comparison: speaker-ID approaches

| Approach | Accuracy | Per-min | Setup | Use when |
|----------|----------|---------|-------|----------|
| Manual roster + name-drop assist | 100% | $0 | none | Now - we control the Space, can list speakers |
| Deepgram Nova-3 diarize only | segments only, no identity | $0.0065-0.0077 | none | We already do this for timing |
| AssemblyAI + voice enrollment | 90-95% | $0.0003 + samples | 10-30s sample/speaker | Later, if volume justifies auto-ID |
| pyannote (self-host) | 7.4-39% DER | free | infra | Budget, willing to tune |

## Comparison: render infra

| Option | 60-min render | Cost/video | Notes |
|--------|---------------|-----------|-------|
| Remotion Lambda | ~90s | ~$1.08 | Fastest, distributed, webhook callbacks, needs S3 |
| Google Cloud Run | ~5 min | ~$0.52 | Cheapest serverless, single vCPU, 60-min timeout |
| Self-hosted (Railway/Render) | ~5 min | ~$0.54 amortized | Cheapest if >2-3/week, fixed monthly |
| Local laptop (today) | ~1 hr | $0 compute | Dies on session restart, no parallelism |

## Sources

Speaker ID:
- AssemblyAI diarization benchmarks - https://www.assemblyai.com/benchmarks [FULL]
- Deepgram diarization docs - https://developers.deepgram.com/docs/diarization [FULL]
- pyannote.audio - https://github.com/pyannote/pyannote-audio [FULL]
- Farcaster protocol spec (no native Spaces) - https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md [FULL]
- Neynar API docs (user search; no Spaces roster) - https://docs.neynar.com [PARTIAL - Spaces roster not documented; lookup pricing not public]
- NER for voice transcripts - https://voxcloneai.com/blog/named-entity-recognition-for-voice-turning-speech-transcripts-into-structured-data [FULL]

Captions and chapters:
- Remotion captions API - https://www.remotion.dev/docs/captions/api [FULL]
- TikTok-style captions in Remotion (spring damping:10 mass:0.5) - https://crepal.ai/blog/aivideo/blog-how-to-create-tiktok-style-captions-remotion/ [FULL]
- Deepgram timestamps/utterances/diarization - https://deepgram.com/learn/working-with-timestamps-utterances-and-speaker-diarization-in-deepgram [FULL]
- YouTube chapters spec - https://support.google.com/youtube/answer/9884579 [FULL]
- Opus Clip caption best practices - https://www.opus.pro/blog/instagram-reels-caption-subtitle-best-practices [FULL]
- WCAG 2.2 contrast - https://www.w3.org/TR/WCAG22/ [FULL]

Design, shareability, distribution:
- Podcast audiogram tools 2026 - https://www.thepodosphere.com/blog/podcast-audiogram-tools-2026 [FULL]
- X video specs - https://socialrails.com/sizes/x/video [FULL]
- 3-second hook rule - https://cloudixdigital.com/short-form-video-mastery-how-the-3-second-hook-rule-drives-social-discovery-and-roi/ [FULL]
- Waveform animation settings - https://audio-visualizer.com/blogs/how-to-make-audio-waveform-animation [FULL]
- Farcaster Mini Apps spec - https://miniapps.farcaster.xyz/docs/specification [PARTIAL - video embed dimensions/sizes not documented; HLS recommended]
- Vizard pricing/API - https://vizard.ai/pricing [FULL]
- Klap pricing - https://klap.app/pricing [FULL]
- fluent-ffmpeg - https://github.com/fluent-ffmpeg/node-fluent-ffmpeg [FULL]
- Whisper API pricing - https://openai.com/api/pricing [FULL]

Infra and cost:
- Remotion Lambda cost example - https://www.remotion.dev/docs/lambda/cost-example [FULL]
- Remotion SSR comparison - https://www.remotion.dev/docs/compare-ssr [FULL]
- AWS Lambda pricing - https://aws.amazon.com/lambda/pricing/ [FULL]
- Google Cloud Run pricing - https://cloud.google.com/run/pricing [FULL]
- Deepgram pricing - https://deepgram.com/pricing [FULL]
- CRF / h265 guide - https://slhck.info/video/2017/02/24/crf-guide.html [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship pfp unavatar fallback in 3-resolve-pfps.ts | @Zaal | PR (juke fork) | DONE |
| Fix findHostSpeaker to honor HOST_USERNAME over max-duration | @Zaal | PR (juke fork) | This week |
| Add word-level karaoke captions via @remotion/captions (wire Deepgram words seconds->ms) | @Zaal | PR (juke fork) | This week |
| Add LLM auto-chapters + on-screen lower-third + YouTube chapter export | @Zaal | PR (juke fork) | July |
| Produce a 30-60s highlight clip (LLM-scored best moment) with 3s cold-open | @Zaal | PR (juke fork) | July |
| Multi-format export (16:9 master -> ffmpeg 1:1 + 9:16) + h265 CRF 26 | @Zaal | PR (juke fork) | July |
| Build the queue: Upstash + BullMQ worker -> Remotion Lambda, ffprobe-validate, resumable | @Zaal | Build | July |
| Write docs/space-recap-workflow.md in zabalgamez with these learnings (use build-speaker-intros, set real HOST handle, speaker-map config) | @Zaal | PR (zabalgames) | This week |
| Send the Juke speaker-metadata question to Nicky | @Zaal | DM | Sent (clipboard) |

## Also See
- [Doc 299](../../business/299-audio-room-best-practices/) - audio room best practices
- [Doc 420](../../agents/420-hyperframes-html-video-agents/) - HTML/video agents
- [Doc 474](../../agents/474-bcz101-bot-transcript-rag/) - transcript RAG
- [Doc 673](../../agents/673-zao-craig-spec-live-audio-todo/) - live audio capture spec
- [Doc 674](../../agents/674-zaoscribe-discord-best-plan/) - transcription pipeline
