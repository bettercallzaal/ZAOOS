---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-31
related-docs: "676, 709, 739, 781"
original-query: "Improving the /meeting capture skill - research best practices and tooling for meeting transcription/diarization/extraction pipelines, speaker ID, hallucination/loop mitigation, structured extraction quality, and any 2026 tools/patterns we could adopt. Goal: a concrete improvement roadmap for our local-first mlx-whisper + sherpa-onnx + multi-pass-extraction skill."
tier: DEEP
---

# 789 - /meeting skill improvement roadmap (2026 tooling research)

> **Goal:** A prioritized, concrete upgrade path for the `/meeting` skill, grounded in 2026 tooling research and 9 meetings processed this session. The skill works; this is how it gets quieter, more accurate, and less reliant on asking Zaal "who is this?" every call.

## Key Decisions (do these in order)

| Priority | Change | Why | Effort |
|----------|--------|-----|--------|
| **P0** | Add `condition_on_previous_text=False`, `compression_ratio_threshold=1.35`, `no_speech_threshold=0.3` to the mlx-whisper call in `transcribe.sh` | PREVENTS 70-80% of repetition loops at the source - we only fix them after the fact today (doc 781 `trim-loops.sh`). Zero added latency. | 1 line |
| **P0** | Add Silero VAD pre-filter (strip silence before Whisper) | Kills the remaining loops AND cuts compute 2-3x on silence-heavy audio. Directly fixes our worst case (the iman 30-min recording that was ~95% silence transcribed as "Okay" loops, doc 787). | ~30 min |
| **P1** | Build a voice-enrollment speaker-ID library for the ~10 recurring collaborators | THE highest-value win. Auto-labels "Speaker 2 = Tyler" instead of asking Zaal who each audio-only person is on every single call - the #1 recurring friction this session (asked on Duo Do, Telamon, Shawn, Ven, JC). | ~half day |
| **P1** | Enum-constrain the `owner` field + add `source_span` (speaker+timestamp+quote) citations to each decision/action | Stops hallucinated owners/actions; makes Phase 3 verification trivial (every item points at the transcript span that backs it). | ~1-2 hr |
| **P2** | Evaluate `pyannote.audio 3.1` to replace sherpa-onnx for 3+ person calls only | Better diarization accuracy (DER 11-19% vs sherpa over-clustering), but heavier (HF token + PyTorch MPS). Only matters on 3+ calls; we skip diarization on 1-2 person calls already (doc 781). | spike |
| **P2 / skip** | Parakeet TDT 0.6B (CTC, cannot hallucinate, 155x realtime) | Zero-hallucination ASR, but drops punctuation - not worth it for meeting notes. Revisit only if loops survive P0+P1. | skip for now |

## Current pipeline (ground truth)

- `scripts/transcribe.sh` - mlx-whisper `whisper-large-v3-turbo`, then `trim-loops.sh` (doc 781) collapses loops post-hoc.
- `scripts/diarize.sh` + `diarize.py` - sherpa-onnx (segmentation + embedding ONNX), forced `num_speakers` when known. Skipped on 1-2 person calls (doc 781).
- `SKILL.md` - multi-pass extraction (metadata / decisions / actions / quotes / entity-cross-check), `confidence` field per item, human-verify for low-confidence, entity cross-check against `research/` + `MEMORY.md`.

## Findings

### Transcription - prevent loops at the source, don't just trim them

Our `trim-loops.sh` (doc 781) is corrective - it collapses "Cheers" x100 after the fact. The 2026 fix is preventive, and it's a parameter change we are not currently passing:

- **`condition_on_previous_text=False`** - Whisper's default `True` carries a hallucinated phrase from one chunk into the next, which is what seeds the loop. Disabling it costs ~5-15% cross-segment coherence (fine for meeting notes). (openai/whisper #1253, #2052)
- **`compression_ratio_threshold=1.35`** - OpenAI's default 2.4 is too high to catch repetition; 1.35 triggers a retry on repetitive output early.
- **`no_speech_threshold=0.3`** - more aggressive silence gating (default 0.6 misses silence).
- **Silero VAD preprocessing** - the bigger lever: detect speech segments and strip silence BEFORE Whisper ever sees it. On our worst case (30-min recording, ~4 min of speech) this feeds Whisper ~4 min instead of 30, removing the hallucination opportunity entirely and cutting runtime from ~30-60s to ~6-9s. `pip install silero-vad`, ONNX mode for CPU speed.

These stack with `trim-loops.sh` (keep it as belt-and-suspenders). Mostly-silence audio: VAD + the three params together get loops to near-zero.

Tooling landscape (Apple Silicon, 2026): mlx-whisper (current, ~1x RT) is a fine baseline. `whisper.cpp` PR #3744 (`context_max_vad_gap_ms`, in review Q2 2026) would prevent loops without disabling all context - watch it. **Parakeet TDT 0.6B v3** (FluidAudio CoreML / `parakeet-mlx`, ~155x realtime, CTC architecture that *cannot* hallucinate, ~2.5% WER) is the nuclear option but drops punctuation - not worth it for readable notes unless P0+P1 fail.

### Diarization + speaker ID - the enrollment win

The recurring friction this session was not "who spoke when" (sherpa handles that) - it was **"which real person is Speaker 2"**, asked on nearly every call because guests are audio-only (no name tag in Zaal's single-feed recordings).

This is solvable and production-ready in 2026: **voice enrollment + matching.**
1. Diarize -> anonymous `SPEAKER_00/01`.
2. Extract a voice embedding per speaker with **SpeechBrain ECAPA-TDNN** (192-dim) or **Resemblyzer** (256-dim) - both run locally on M-series CPU, ~100-300ms each.
3. Keep a small enrolled library (~200 bytes/person) for the ~10 recurring collaborators (Tyler, Iman, Adrian, Plat0x, kmac, etc.), built once from past recordings.
4. Cosine-similarity match each segment's embedding to the library (threshold ~0.75-0.85). Match -> auto-label "Tyler"; no match -> fall back to the Phase 2.5 question.

Working references exist: `audio-voice-id-plugin` (a Claude Code plugin wrapping SpeechBrain, library at `~/.local/share/audio-voice-id/`), `speaker-detector` (CLI, enrollments in `~/.speaker-detector/enrollments/`), `voicetag` (pyannote + Resemblyzer), `mac-meeting-transcriber` (MLX Whisper + diarization + LLM speaker ID on M4).

On forcing speaker count: a 2025 finding (whisperX #1208, pyannote 3.3+) is that forcing `min/max_speakers=2` on pyannote can *worsen* 2-person calls (assigns ~99.9% to one speaker). Our sherpa setup over-clusters instead, which is why we force the count. Since we now skip diarization entirely on 1-2 person calls (doc 781), this only matters for 3+ calls - where **pyannote.audio 3.1** (DER 11-19%, good auto speaker-count) is worth a spike to replace sherpa, accepting the heavier PyTorch-MPS + HF-token footprint.

### Structured extraction - we're already on the 2026 pattern, two upgrades

Our multi-pass extraction with per-item `confidence` and human-verify-low IS current best practice (confirmed against `transcript-analysis-pipeline`, `meeting-to-action`, Zylos 2026). Two concrete upgrades:

1. **Schema-constrained output with enum fields.** We already keep an owner allowlist (Zaal/Iman/Both/ThyRev/Samantha). Make it a JSON-schema `enum` via Claude's `output_config.format` / structured outputs - grammar-level token masking gives 100% syntactic compliance and prevents an invented owner. Keep a post-parse semantic check (a schema-valid string can still name someone who never spoke; enums prevent that for owners).
2. **`source_span` citations.** Add `{speaker, timestamp, quote}` to each decision/action, drawn from the `.json` timestamp sidecar we already produce. Every item then points at the transcript span that backs it - the single best anti-hallucination move (a fabricated action has no real span) and it makes the Phase 3 VERIFY block self-evident. Also add refusal-detection (scan free-text fields for "I cannot"/"not mentioned" and treat as null).

Entity resolution (cross-checking names against `research/` + `MEMORY.md` so known people get linked not re-created) is already what we do and matches the 2026 two-pass pattern - keep it.

## Also See

- [Doc 781](../781-meeting-skill-friction-fixes/) - the 4 fixes shipped this session (trim-loops, diarize-skip, single-feed frames, tracker fallback)
- [Doc 709](../709-meeting-transcription-pipeline-audit/) - the original transcription pipeline audit (Whisper loop first documented)
- [Doc 739](../739-claude-code-efficiency-native-mcps/) - efficiency patterns incl. the ffmpeg silenceremove idea (superseded here by Silero VAD)
- [Doc 676](../676-skill-engineering-best-practices/) - the skill-engineering basis (multi-pass extraction)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the 3 anti-loop params to `transcribe.sh` mlx-whisper call (P0) | @Zaal | PR | This week |
| Add Silero VAD pre-filter to `transcribe.sh` (P0) | @Zaal | PR | This week |
| Build the voice-enrollment speaker-ID library for ~10 recurring collaborators (P1) | @Zaal | Build | Next sprint |
| Enum-constrain `owner` + add `source_span` citations to extraction (P1) | @Zaal | Skill edit | Next sprint |
| Spike pyannote.audio 3.1 vs sherpa-onnx for 3+ person calls (P2) | @Zaal | Spike | When a 3+ call needs it |

## Sources

- openai/whisper issues #1253, #2052, #29, #1059 - repetition root cause + `condition_on_previous_text` fix [FULL]
- ggml-org/whisper.cpp #3744 - `context_max_vad_gap_ms` + `retry_on_repeat` proposal (2026-04-05) [FULL]
- snakers4/silero-vad - VAD API + ONNX mode [FULL]
- anvanvan/mac-whisper-speedtest (2025-04-19) - 8 ASR impls benchmarked on M-series [FULL]
- MacParakeet / senstella/parakeet-mlx - Parakeet TDT 0.6B v3 on Apple Silicon, CTC no-hallucination claim [FULL]
- pyannote/speaker-diarization-3.1 (HuggingFace) - DER benchmarks (VoxConverse 11.2%, AMI 18.8%) [FULL]
- m-bain/whisperX #1208 (2025-08) - forcing num_speakers worsens 2-person calls [FULL]
- speechbrain/spkrec-ecapa-voxceleb - ECAPA-TDNN speaker embeddings [FULL]
- GitHub: audio-voice-id-plugin, speaker-detector, voicetag, mac-meeting-transcriber - working local speaker-ID enrollment impls (2025-2026) [PARTIAL - READMEs read, not run]
- williamgieng/transcript-analysis-pipeline (2026-04-30) - 3-stage extract/synthesize/audit + evidence grounding [FULL]
- Zylos Research, "Structured Output and Constrained Decoding for Production AI Agents" (2026-04-11) [FULL]
- Anthropic Structured Outputs GA (2026) - `output_config.format` json_schema, grammar-constrained decoding [FULL]
- GitHub: meeting-to-action (2026-05-16), MeetingMind (2026-03-24), recap (2026-04-03) - production extraction patterns [PARTIAL - highlights]
