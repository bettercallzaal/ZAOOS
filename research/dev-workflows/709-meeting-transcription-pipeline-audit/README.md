---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: "673, 674, 670, 676, 680, 313, 327"
original-query: "Audit and research better/more ways to do meeting transcription and capture for the /meeting skill (diarization, video understanding, transcription engines, capture surfaces). Also check in on the ZAOscribe bot - what it is, its status, how it relates to the /meeting skill and the ZAO Craig bot."
tier: STANDARD
---

# 709 - Meeting Transcription Pipeline Audit + ZAOscribe Status Check

> **Goal:** Audit the `/meeting` skill's transcription and capture pipeline against the 2026 landscape, record what shipped this session, and pin the exact status of ZAOscribe.

## Key Decisions

Recommendations first. Items marked SHIPPED were implemented in this session (2026-05-22) and are live in `.claude/skills/meeting/`.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **`/meeting` transcription = mlx-whisper `large-v3-turbo`, local-first. SHIPPED.** Supersedes doc 673's "Whisper.cpp local OR paste". | mlx-whisper runs native on Apple Silicon (12-36x real-time), free, offline, no HF token. Validated this session: a 29-min 252MB mp4 transcribed to a 5648-word transcript locally. VPS Whisper kept as a non-Mac fallback. |
| 2 | **Video meetings get ffmpeg scene-change frame extraction. SHIPPED.** | The doc-673/680 design was audio-only. A meeting mp4 carries slides, screenshares, and call-UI name tags that audio drops. `extract-frames.sh` pulls up to 24 frames; the vision passes read them. Validated: 23 frames from the test mp4. |
| 3 | **Diarization for `/meeting`: add `sherpa-onnx` (no HF token, local) for 3+ speaker meetings; skip for 1-2 person calls.** whisperx + pyannote stays opt-in only. | pyannote 3.1 needs a HuggingFace gated-model token; sherpa-onnx uses pre-converted ONNX models with no token. For 1-2 person calls the LLM attributes speakers from content - diarization adds nothing. NOT YET BUILT - see Next Actions. |
| 4 | **ZAOscribe: keep Whisper.cpp on VPS 1, keep Discord per-user-stream diarization.** Evaluate `ggml-large-v3-turbo` in place of `ggml-medium`. | Discord's `@discordjs/voice` exposes a separate Opus stream per speaker - free, exact diarization with zero pyannote. That is the right call; do not change it. `large-v3-turbo` is faster and more accurate than `medium` on the same CPU - worth a benchmark before ZAOscribe build. |
| 5 | **Default upstream capture surface for non-Discord meetings = Fathom.** | Free, unlimited recordings + storage, and a bot-free capture mode since April 2026. The skill already detects `fathom.video` URLs. No spend, no new tooling. |
| 6 | **Quality-bump fallback = ElevenLabs Scribe v2 ($0.22/hr batch), used only when a local transcript is bad.** | 2.2% WER batch and built-in diarization for up to 48 speakers. Reserve for hard audio; do not make it the default - local mlx-whisper is free and good enough for clean calls. See doc 313. |

## ZAOscribe - Status Check

**ZAOscribe is not the `/meeting` skill.** It is a separate, not-yet-built Discord bot.

| Field | Value |
|-------|-------|
| What | Discord audio-capture-to-todo bot (`@ZAOscribeBot`) |
| Spec doc | Doc 674 (`research/agents/674-zaoscribe-discord-best-plan`), locked 2026-05-18 |
| Status | **Planned, spec locked, build not started.** 7-phase plan in doc 674's Next Actions. |
| Repo | `bettercallzaal/zaoscribe` (planned) |
| Runtime | systemd user unit on VPS 1, autonomous |
| Transcription | Whisper.cpp `ggml-medium.bin`, local on VPS |
| Diarization | Free - Discord exposes a per-user audio stream natively |
| Extraction | Cascade LLM: Haiku 4.5 -> Opus 4.7 on low confidence (~$1/mo at 10 captures/day) |
| Former name | "ZAO Craig" (doc 670). Renamed per Zaal 2026-05-18 to avoid confusion with the upstream Craig OSS recording bot. ZAO Craig = ZAOscribe; same product. |

**How the three pieces relate** (resolved, per the 2026-05-21 briefing - no conflict, three layers of one pipeline):

- **ZAOscribe** - live audio-in layer. Discord voice channel -> per-speaker Opus -> Whisper -> todos. Autonomous bot. NOT BUILT.
- **`/meeting` skill** - post-hoc dispatch layer. A finished recording/transcript -> recap doc + actions + Bonfire. Runs inside Claude Code. LIVE, and upgraded this session.
- **Bonfire** - persistence/recall layer. Both of the above flow into the ZABAL knowledge graph (doc 680 bridge).

## Findings

### Current `/meeting` pipeline (post-2026-05-22 upgrade)

`.claude/skills/meeting/scripts/transcribe.sh` is now local-first: it uses `mlx_whisper` if present, falls back to VPS Whisper otherwise. `extract-frames.sh` is new - ffmpeg scene-change detection with a fixed-interval fallback, capped at 24 frames, returns `NO_VIDEO` for audio-only input. `SKILL.md` Phase 1 runs both; Phase 2 reads the frames as vision context. This replaces the doc-673 "transcribe on Iman's VPS" decision - the VPS is CPU-only (no GPU), so local Apple Silicon is both faster and removes the upload step.

### Transcription engines (2026)

| Engine | Accuracy (WER) | Speed | Cost | Local/Cloud | Diarization |
|--------|----------------|-------|------|-------------|-------------|
| mlx-whisper (Apple Silicon) | 2-3% clean | 12-36x RT | Free | Local | No |
| whisper.cpp (Metal) | 2-3% | 2-4x RT | Free | Local | No |
| faster-whisper | 2-3% | 4-17x RT | Free | Local | No |
| NVIDIA Parakeet-TDT v3 | 5.4-6.3% | 155-210x RT | Free | Local (Apple) | No |
| OpenAI Whisper API | 6-8% | - | $0.006/min | Cloud | No |
| ElevenLabs Scribe v2 | 2.2% batch | 32x RT | $0.22/hr batch | Cloud | Yes (48 spk) |
| AssemblyAI Universal-3 | 3.3-5.9% | 98x RT | $0.15/hr streaming | Cloud | Yes (best) |
| Deepgram Nova-3 | 5.26% | 200-400ms | $0.0043/min batch | Cloud | Yes |

Takeaway: local Apple Silicon Whisper is accuracy-competitive with cloud and free. Parakeet is far faster but English/EU-only and a single deployment path - Whisper's four mature runtimes win on deployability. Cloud only earns its cost when you need built-in diarization or you have hard audio.

### Speaker diarization (2026)

| Approach | HF token? | Local/Cloud | Accuracy | Setup |
|----------|-----------|-------------|----------|-------|
| whisperx + pyannote 3.1 | YES (gated) | Local | 90-95% (2-3 spk) | High |
| sherpa-onnx diarization | NO | Local | 85-92% clean | Medium |
| NVIDIA NeMo | NO | Local | 88-92% | High |
| AssemblyAI | NO | Cloud | 94% turn acc | Low |
| Deepgram Nova-3 | NO | Cloud | ~91% | Low |
| ElevenLabs Scribe v2 | NO | Cloud | ~90%+ | Low |

The pyannote gated-token requirement (accept 2 HF model licenses, generate a token) is the friction point. `sherpa-onnx` is the no-token local answer for ZAO's privacy-first stance. ZAOscribe sidesteps diarization entirely by recording each Discord speaker on a separate stream - genuinely the cleanest approach where the platform allows it.

### Video-meeting understanding

No production-grade open-source "meeting video understanding" tool exists in 2026 - the field is research prototypes (AURA streaming VideoLLM, PreMind slide segmentation) or proprietary omni-models (NVIDIA Nemotron 3 Nano Omni, 24GB+ VRAM). The pragmatic path for a solo builder is what shipped this session: ffmpeg frame extraction + a general vision LLM (Claude) reading the frames. Cheap, local for the extraction, no special model.

### Capture surfaces

| Tool | Platform | Free tier | Clean transcript |
|------|----------|-----------|------------------|
| Fathom | Zoom/Meet/Teams | Unlimited recordings + storage | Yes (SRT/VTT/JSON) |
| Granola | System audio, Mac | Limited history | Yes, bot-free |
| Otter.ai | Zoom/Meet/Teams | 300 min/mo | Yes |
| tl;dv | Zoom/Meet/Teams | 10 lifetime AI notes | Yes + clips |
| Craig | Discord | Free + paid | Yes (JSON/SRT) |

Fathom is the strongest free option and the skill already supports its URLs. Craig is the Discord-native capture (the upstream tool ZAOscribe is patterned on).

### Staleness flags

- Docs 673 and 680 still state transcription = "Whisper.cpp local OR paste". As of 2026-05-22 the `/meeting` skill SKILL.md uses mlx-whisper local-first. Those docs are stale on this one point - see Next Actions.
- Doc 673's "what we are NOT building" lists "real-time speaker diarization in v1". Still accurate - diarization remains deferred for `/meeting`; Decision 3 above is the post-v1 plan.
- Pricing is current as of May 2026; cloud STT vendors reprice quarterly - re-validate before any volume commitment.

## Also See

- [Doc 673 - Meeting Capture Skill Design](../673-meeting-capture-skill/) - the `/meeting` skill spec this audit updates
- [Doc 674 - ZAOscribe Discord Best Plan](../../agents/674-zaoscribe-discord-best-plan/) - the ZAOscribe spec
- [Doc 670 - Iman Call: Craig + PizzaDAO](../../events/670-iman-call-may18-craig-pizzadao/) - origin of "ZAO Craig"
- [Doc 680 - Meeting Skill Bonfire Bridge](../../agents/680-meeting-skill-bonfire-bridge/) - the persistence layer
- [Doc 313 - ElevenLabs Scribe v2](../../music/313-elevenlabs-scribe-v2-speech-to-text/) - the cloud quality-bump fallback
- [Doc 327 - Open Source Speech-to-Text: Whisper & Alternatives](../../music/327-open-source-speech-to-text-whisper-alternatives/) - prior engine deep-dive

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `sherpa-onnx` diarization step into `transcribe.sh` (3+ speaker meetings only) | @Zaal | PR | Next `/meeting` skill iteration |
| Update docs 673 + 680 transcription line: Whisper.cpp -> mlx-whisper local-first | @Zaal | PR | With this doc's PR |
| Benchmark `ggml-large-v3-turbo` vs `ggml-medium` on VPS 1 CPU before ZAOscribe build | @Zaal | Todo | Before doc-674 Phase 1 |
| Set Fathom as the default non-Discord capture surface; confirm `fathom.video` URL parsing in the skill | @Zaal | Todo | Next meeting capture |
| Decide whether `/meeting` mp4 runs should also post frames to Bonfire as image episodes | @Zaal | Decision | After doc 680 read-side unblocks |

## Sources

- [Mac speech-to-text: Whisper / MLX / whisper.cpp](https://macgpu.com/en/blog/2026-0410-mac-speech-to-text-whisper-mlx-whispercpp-remote-split.html) - [FULL]
- [Whisper vs Parakeet ASR decision](https://www.arunbaby.com/speech-tech/0073-whisper-vs-parakeet-asr-decision/) - [FULL]
- [ElevenLabs Speech-to-Text API](https://elevenlabs.io/speech-to-text-api) - [FULL]
- [Deepgram vs AssemblyAI vs Whisper 2026](https://supermia.ai/blog/deepgram-vs-assemblyai-vs-whisper/) - [FULL]
- [WhisperX + pyannote guide](https://localaimaster.com/blog/whisperx-guide) - [FULL]
- [sherpa-onnx speaker diarization models](https://k2-fsa.github.io/sherpa/onnx/speaker-diarization/models.html) - [FULL]
- [pyannote speaker-diarization-3.1 (HuggingFace)](https://github.com/pyannote/hf-speaker-diarization-3.1) - [FULL]
- [whisper.cpp performance scaling issue (GitHub, community source)](https://github.com/ggml-org/whisper.cpp/issues/3682) - [FULL]
- [Granola vs Otter vs Fathom comparison](https://mundobytes.com/en/Granola-vs-Otter-vs-Fathom%3A-Which-to-choose-as-an-AI-meeting-assistant/) - [FULL]
- [NVIDIA Nemotron 3 Nano Omni](https://huggingface.co/blog/nvidia/nemotron-3-nano-omni-multimodal-intelligence) - [FULL]
- r/LocalLLaMA - whisper.cpp + faster-whisper benchmark threads (community source) - [PARTIAL - subagent synthesized thread consensus; individual thread URLs not pinned]

Research conducted via parallel subagents (internal-doc digest + STANDARD-tier web scan), 2026-05-22.
