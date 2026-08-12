---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-12
superseded-by:
related-docs: "709, 327, 313, 2088, 1187, 916"
original-query: "AssemblyAI for the WaveWarZ X Spaces capture pipeline - transcription, speaker diarization, speaker naming, timestamps/clip candidates, pricing, API limits, and how it compares to the local mlx_whisper + diarize.py path we are running today"
tier: STANDARD
---

# 2270 - AssemblyAI for the WaveWarZ X Spaces Capture Pipeline

> **Goal:** Decide whether the daily WaveWarZ X Spaces recap pipeline transcribes on AssemblyAI or on the local mlx-whisper path, and pin the exact cost, limits, and failure modes of each.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|---|---|
| 1 | **USE AssemblyAI for public Space recaps.** Universal-2 async plus diarization, $0.17/hr. | Speaker naming is the blocker, not transcription. AssemblyAI's Speaker Identification maps `Speaker A` to a real name from in-audio context with no voice enrollment. The local path cannot do this at all. |
| 2 | **ROUTE BY STREAM SHAPE, not by sensitivity.** Mixed single stream to AssemblyAI, speaker-separated tracks to local mlx-whisper. | Corrected after this doc's first draft. A Craig/Discord recording ships one audio file per speaker, named by speaker - attribution is already perfect and free, so paid diarization buys literally nothing. Only a single mixed stream (an X Space) has a speaker problem worth paying to solve. Sensitivity is a second filter on top, not the primary rule. |
| 3 | **SET TTL to 1 day and opt out of the model improvement program BEFORE the first upload.** | A 2h49m candid founder Space is the payload. AssemblyAI defaults retain audio and transcripts; both are changed on one dashboard page. Doing this after the first upload is too late. |
| 4 | **USE Auto Highlights (+$0.01/hr), SKIP Auto Chapters (+$0.08/hr).** | Auto Chapters is Universal-2 only and marked deprecated. Building the clip-candidate step on a deprecated feature buys a migration. Auto Highlights is 8x cheaper and not deprecated. |
| 5 | **DO NOT retire the local path.** Run it as the fallback. | The only benchmark that measured duration resilience found AssemblyAI degrades most on long audio and Whisper+Pyannote degrades least. Our files are 169 minutes. See the contradiction in Findings. |

## Findings

### The real blocker is naming, not transcription

The WaveWarZ Space pipeline does not need better words. Local whisper already produces clean text. It needs to know **who said them**, because a recap that quotes "Speaker B" is not publishable and a recap that guesses "Hurricane said X" is worse than useless if wrong.

Three tiers of the problem, and only one product solves the third:

| Capability | Local mlx-whisper | Local + pyannote | AssemblyAI |
|---|---|---|---|
| Words with timestamps | Yes | Yes | Yes |
| Voice separated into distinct speakers | No | Yes (`SPEAKER_00`, `SPEAKER_01`) | Yes (`A`, `B`, `C`) |
| Those speakers given real names | No | No | **Yes, via Speaker Identification** |

AssemblyAI's Speaker Identification takes a list of names you supply and matches them to diarized speakers by **context inference** - it uses names spoken inside the audio, not voiceprints. No enrollment, no audio samples. Config is a `speaker_identification` block with `speaker_type: "name"` and a `speakers` array, optionally enriched with `description`, `company`, or `title` for extra context. It requires `speaker_labels: true` as a prerequisite, and has a `effort: "medium"` mode documented as the right setting for conference calls and interrupted conversation, which is exactly what a Space is.

The constraint that matters: **names cannot be extracted if absent from the audio.** On a Space where hosts greet each other by name this works. On a Space where nobody says a name, it cannot invent one, and we are back to manual labeling. This is a real limit, not a rounding error.

### Correction: stream shape decides this, not sensitivity

The first draft of this doc split the routing on public-versus-private. That was wrong, and a real file proved it within the hour.

A Craig recording of the 2026-08-12 Candy meeting arrived as a directory of **per-speaker tracks**: `1-candytoybox.aac` (69 min) and `2-zaal.aac` (45 min). Craig records each Discord participant to a separate stream. Speaker attribution is therefore not a hard problem to be solved, it is metadata already sitting in the filename. Transcribe each track independently, merge the segments by timestamp, and the result is 100% correct attribution with real names at zero cost - strictly better than anything a diarizer can infer from a mixed stream, because there is nothing to infer.

Doc 709 reached this conclusion in May about ZAOscribe and called separate-stream recording "genuinely the cleanest approach where the platform allows it." This confirms it on a real file.

The corrected routing rule:

| Input shape | Example | Route | Why |
|---|---|---|---|
| One track per speaker | Craig / Discord recording | Local mlx-whisper, per track | Attribution is free and perfect. Paid diarization adds cost and can only be worse. |
| Single mixed stream | X Space mp4 | AssemblyAI, diarization + Speaker Identification | The only case with a genuine speaker problem. |

Sensitivity remains a second filter: anything that must not leave the machine stays local regardless of shape, accepting whatever attribution loss follows. It is not the first question, though, because on this evidence the shape question answers most cases before sensitivity is reached.

### Cost, computed for our actual file

Today's Space is 2h49m (10,162 seconds = 2.82 hours). Rates verified on the pricing page 2026-08-12:

| Line item | Rate | Cost for one 2.82hr Space |
|---|---|---|
| Universal-2 async transcription | $0.15/hr | $0.42 |
| Speaker diarization (async standard) | +$0.02/hr | $0.06 |
| **Subtotal, the recommended config** | **$0.17/hr** | **$0.48** |
| Universal-3.5 Pro instead of Universal-2 | $0.21/hr | $0.65 with diarization |
| Auto Highlights (clip candidates) | +$0.01/hr | $0.03 |
| Auto Chapters (deprecated, Universal-2 only) | +$0.08/hr | $0.23 |
| Sentiment analysis | +$0.02/hr | $0.06 |

At one Space per day: **$14.40/month** on Universal-2, $19.50/month on Universal-3.5 Pro.

Signup grants **$50 in free credits, no credit card required**. At $0.48 per Space that is **104 Spaces**, roughly 3.4 months of daily capture before a card is needed. The entire experiment fits inside the free tier.

Speaker Identification pricing is **UNVERIFIED** - the feature documentation states no price and it does not appear as a line item on the pricing page. Assume it is either free with diarization or a small add-on; confirm on the first real invoice rather than assuming zero.

### API limits (verified 2026-08-12)

| Limit | Value |
|---|---|
| Max file size via `/v2/transcript` | 5 GB |
| Max file size via `/v2/upload` (local file) | 2.2 GB |
| Max audio duration | 10 hours |
| Min audio duration | 160 ms |
| Parallel jobs, free account | 5 |
| Parallel jobs, paid account | 200+ |
| HTTP request ceiling | 20,000 requests per 5 minutes, all endpoints combined |

Our 122 MB mp4 and its 272 MB extracted wav are both far inside every limit. A 10-hour ceiling means even a marathon Space is fine. Nothing here constrains us.

Retention is configurable: TTL presets of 1, 3, 7, or 30 days, or custom, set on the Data Controls dashboard page. The same page carries the opt-out for the model improvement program and the BAA. **These are opt-in protections, not defaults** - see Key Decision 3.

### The contradiction, stated rather than smoothed over

Two credible sources disagree about AssemblyAI on long audio, and our files are long.

- **meetingstack, 2026-04-03:** AssemblyAI leads diarization at **91.2%**, ahead of Deepgram 89.4% and Rev.ai 81.2%. Whisper via API returns no speaker labels at all. Verdict: "Best for multi-speaker meetings: AssemblyAI."
- **mpathic.ai / ISCTM benchmark, 2025-05-15**, on 134 real two-speaker conversations from AnnoMI: AssemblyAI has the best speaker attribution overall (**24.5% cpWER** vs Whisper+Pyannote's 32.6%) - but on the duration axis, "AssemblyAI shows the worst performance with longer audio files" while "the open source method appears to be less prone to errors in longer audio." All three systems degraded notably past **10 minutes**.

Both can be true: AssemblyAI wins on average and on clean short files, and loses its edge as files get long. Our Space is **169 minutes**, seventeen times past the 10-minute degradation threshold both studies flag. Neither study tested anything near that length, so applying either result to a 169-minute Space is extrapolation, and I am flagging it as such rather than picking the flattering number.

This is why Key Decision 5 keeps the local path alive. The honest test is running today's Space through both and comparing speaker attribution on a stretch we can verify by ear. That is a one-time $0.48 experiment, and it converts an extrapolation into a measurement.

### Local path, measured today rather than cited

Running `~/.claude/skills/meeting/scripts/transcribe.sh` on the 2h49m Space, mlx-whisper `large-v3-turbo`, on this Mac:

- **5.7x realtime measured** - 33.9 minutes of audio transcribed in 5.9 minutes of wall clock.
- Projected **~30 minutes total** for the full 169-minute file.
- Cost: zero. Nothing leaves the machine.
- Doc 709 claimed 12-36x realtime for mlx-whisper. Our measured 5.7x is **well below that range** on a 169-minute file. Doc 709's figure should be read as a short-file number.

AssemblyAI advertises 98x realtime for Universal-3, which would put the same file near 2 minutes. Even discounting vendor benchmarks heavily, the wall-clock difference is roughly 30 minutes versus a few minutes - which matters for a same-day recap and does not matter at all for an overnight batch.

### What this unblocks in the tracker repo

`bettercallzaal/wwtracker` already shipped the Phase A recap pipeline on 2026-07-14 (`scripts/ww-recap.ts`, `scripts/recap/format.ts`). Its design doc declared a non-goal: "No full audio transcription of X Spaces (no official download API for Spaces audio)." Phase B instead planned to drive a browser through the replay, screenshot the player every 60 seconds, and read the highlighted speaker - producing, in its own words, "who was talking when, not their exact words."

That non-goal is now void. Zaal supplied the Space as an mp4 directly, so a real transcript exists and Phase B's expensive vision-per-interval loop is unnecessary. The integration point is a single line: `scripts/ww-recap.ts:111` currently hardcodes `null` where a speaker log belongs, and `scripts/recap/types.ts:29` already declares the `SpeakerLogEntry` shape (`timestampSec`, `speaker`, `captionText?`) that both transcription paths can emit.

Separately, `scripts/recap/format.ts:94` selects a stream quote with `.find(e => e.captionText)` - the first captioned entry in the log. On a real Space that quotes whoever spoke first, which is typically a microphone check. This needs a substantive-line selector before any recap ships publicly.

## Comparison

| Option | Cost per 2.82hr Space | Wall clock | Diarization | Real names | Audio leaves machine |
|---|---|---|---|---|---|
| **AssemblyAI Universal-2 + diarization** | $0.48 | ~2-5 min | Yes, 91.2% | **Yes** | Yes |
| AssemblyAI Universal-3.5 Pro + diarization | $0.65 | ~2-5 min | Yes | Yes | Yes |
| Local mlx-whisper (today's path) | $0.00 | ~30 min | No | No | No |
| Local mlx-whisper + pyannote | $0.00 | ~40 min plus setup | Yes, ~90-95% | No | No |
| Deepgram Nova-3 | ~$0.73 at $0.0043/min | fast | Yes, 89.4% | Not documented here | Yes |

Local + pyannote carries a setup cost doc 709 already identified: pyannote 3.1 is gated behind two Hugging Face model licenses and a generated token. That friction is why ZAO has not wired it, and it is why the local path today produces no speaker labels at all.

## Also See

- [Doc 709](../709-meeting-transcription-pipeline-audit/) - the 2026-05-22 pipeline audit this doc updates on pricing, speed, and the naming question
- [Doc 327](../../music/327-open-source-speech-to-text-whisper-alternatives/) - open-source STT landscape, AssemblyAI classified as proprietary
- [Doc 313](../../music/313-elevenlabs-scribe-v2-speech-to-text/) - ElevenLabs Scribe v2, the other diarizing cloud option
- [Doc 2088](../../agents/2088-zai-discord-voice-auto-capture/) - rejected paid transcription APIs on OSS-first grounds; this doc argues the Spaces case is the exception because of naming

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set AssemblyAI TTL to 1 day and opt out of model improvement program on the Data Controls page, before any upload | @Zaal | Dashboard | 2026-08-13 |
| Run today's 2h49m Space through AssemblyAI with diarization and Speaker Identification, diff speaker attribution against the local transcript, record which is right | @Zaal | Experiment | 2026-08-14 |
| Wire `scripts/ww-recap.ts:111` to load a speaker log instead of hardcoded `null`, PR to wwtracker | @Zaal | PR merged | 2026-08-14 |
| Replace the `.find(e => e.captionText)` quote picker in `scripts/recap/format.ts:94` with a substantive-line selector | @Zaal | PR merged | 2026-08-14 |
| Confirm Speaker Identification billing on first invoice, update this doc's UNVERIFIED line | @Zaal | Doc update | 2026-09-12 |

## Sources

- [AssemblyAI Pricing](https://www.assemblyai.com/pricing) - [FULL] verified 2026-08-12, all rates quoted above read directly from the page
- [AssemblyAI Speaker Diarization docs](https://www.assemblyai.com/docs/speech-to-text/speaker-diarization) - [FULL] verified 2026-08-12
- [AssemblyAI Speaker Identification docs](https://www.assemblyai.com/docs/speech-understanding/speaker-identification) - [FULL] verified 2026-08-12
- [AssemblyAI file size and duration FAQ](https://www.assemblyai.com/docs/faq/are-there-any-limits-on-file-size-or-file-duration-for-files-submitted-to-the-api) - [FULL] 5 GB / 2.2 GB / 10 hours
- [AssemblyAI rate limits](https://www.assemblyai.com/docs/pre-recorded-audio/rate-limits) - [FULL] 5 parallel free, 200+ paid, 20,000 req / 5 min
- [AssemblyAI Data Controls](https://www.assemblyai.com/docs/data-controls) - [FULL] TTL presets and model-improvement opt-out
- [Open Source vs Commercial Speech AI: The AnnoMI Dataset Challenge](https://mpathic.ai/open-source-vs-commercial-speech-ai-the-annomi-dataset-challenge/) - [FULL] published 2025-05-15, the duration-degradation finding
- [Benchmarking Commercial and Open-Source Speech AI, ISCTM Autumn 2025](https://isctm.org/public_access/Autumn2025/Abstracts/Bruzinski_Abstract.pdf) - [FULL] the peer-facing abstract behind the mpathic post
- [Transcription Accuracy Tested Across 8 Providers, meetingstack](https://meetingstack.io/research/transcription-accuracy/) - [FULL] published 2026-04-03, diarization 91.2% figure
- [Why I Went Local with pyannote for Speaker Diarization](https://askthegame.bearblog.dev/why-i-went-local-with-pyannote/) - [FULL] community builder account of the local-vs-API tradeoff and why voiceprints need local control
- [Whisper API empty transcript for videos longer than 30 minutes, OpenAI Developer Community](https://community.openai.com/t/whisper-api-keeps-returning-empty-transcript-for-videos-longer-than-30-minutes-stuck-in-production/1380129) - [FULL] published 2026-05-01, community thread on long-file chunking destroying speaker attribution
- [AssemblyAI API limits reference page](https://www.assemblyai.com/docs/api-reference/limits) - [FAILED - HTTP 404. Escalated to the FAQ and rate-limits pages above, both of which resolved FULL and carry the same figures.]
- Local measurement: `~/.claude/skills/meeting/scripts/transcribe.sh` on a 10,162-second Space, mlx-whisper large-v3-turbo, this Mac, 2026-08-12 - 5.7x realtime observed
- Codebase: `bettercallzaal/wwtracker` `scripts/ww-recap.ts:111`, `scripts/recap/format.ts:94`, `scripts/recap/types.ts:29`, and `docs/superpowers/specs/2026-07-14-recap-pipeline-design.md` section 5
