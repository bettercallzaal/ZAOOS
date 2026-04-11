# Doc 327 - Open Source Speech-to-Text: Whisper & Alternatives Deep Dive

**Date:** 2026-04-11
**Category:** Infrastructure / AI Tools
**Status:** Research Complete
**Use Case:** Transcribe ZAO meetings, live audio rooms, podcasts - self-hosted alternatives to ElevenLabs Scribe

---

## 1. Whisper v3 / v3-turbo (OpenAI)

### Model Variants

| Model | Parameters | VRAM | Languages | WER (Open ASR) |
|-------|-----------|------|-----------|----------------|
| Whisper Large v3 | 1.55B | ~10 GB | 99+ | 7.4% |
| Whisper Large v3 Turbo | ~809M | ~6 GB | 99+ | 7.75% |
| Whisper Medium | 769M | ~5 GB | 99+ | ~10% |
| Whisper Small | 244M | ~2 GB | 99+ | ~13% |
| Whisper Base | 74M | ~1 GB | 99+ | ~18% |
| Whisper Tiny | 39M | ~1 GB | 99+ | ~25% |

### v3 Turbo Key Facts
- 5-6x faster than Large v3, only 0.35% WER increase
- Reduced from 32 decoder layers to 4 (hence the speed)
- Same encoder as Large v3 - accuracy loss is minimal
- Released October 2024, still the go-to Whisper variant in 2026
- On M2 Mac: 10 minutes of audio transcribes in ~63 seconds
- WhisperKit (Apple Neural Engine optimized) achieves 2.2% WER at 0.46s latency

### Apple Silicon Performance (Medium Model, 10-min Audio)

| Chip | Processing Time | Real-Time Factor |
|------|----------------|-----------------|
| M1 (8 GB) | ~3 min | 0.3x |
| M1 Pro (16 GB) | ~2 min | 0.2x |
| M2 (8 GB) | ~2.5 min | 0.25x |
| M3 Pro (18 GB) | ~1.5 min | 0.15x |
| M3 Max (36 GB) | ~1 min | 0.1x |
| M4 (16 GB) | ~1.2 min | 0.12x |
| M4 Pro (24 GB) | ~50 sec | 0.08x |

**Takeaway:** Any Apple Silicon Mac transcribes faster than real-time. M3 Pro or later is the sweet spot for daily use. The Medium model offers the best accuracy/speed balance on Mac.

### Output Formats
- SRT (SubRip subtitles)
- VTT (WebVTT for web players)
- JSON (word-level timestamps, segments)
- TSV (tab-separated values)
- Plain text

---

## 2. whisper.cpp - C++ Port for Mac

**Repo:** github.com/ggml-org/whisper.cpp
**License:** MIT

### What It Is
Pure C/C++ re-implementation of Whisper using the ggml tensor library. No Python, no PyTorch. Runs natively on Apple Silicon with Metal and Core ML acceleration.

### Performance on Mac

| Acceleration | Speed vs CPU-only |
|-------------|-------------------|
| Metal (GPU) | ~2x faster |
| Core ML (ANE) | ~3x faster |
| Metal + Core ML | ~3.5x faster |

- M4 Tiny model: 27x real-time (10 seconds of audio in 0.37s)
- M4 Medium model: ~5x real-time
- Memory efficient - can run Large model on 8 GB RAM Macs

### Setup (Mac)

```bash
# Clone and build
git clone https://github.com/ggml-org/whisper.cpp
cd whisper.cpp
make

# Download model
bash ./models/download-ggml-model.sh large-v3-turbo

# Transcribe
./main -m models/ggml-large-v3-turbo.bin -f audio.wav -otxt -osrt -ojf

# With Core ML (faster on Apple Silicon)
make clean
WHISPER_COREML=1 make -j
```

### Best For
- CLI-based batch processing on Mac
- Embedding in native Mac/iOS apps
- Minimal dependencies, easy to compile
- Foundation for many Mac GUI apps (MacWhisper, Aiko)

---

## 3. WhisperX - Word Timestamps + Speaker Diarization

**Repo:** github.com/m-bain/whisperX
**License:** BSD-4

### What It Adds Over Vanilla Whisper
1. **Word-level timestamps** via wav2vec2 forced alignment (+/- 50ms vs +/- 500ms in vanilla Whisper)
2. **Speaker diarization** via pyannote.audio (who said what)
3. **Batched inference** via faster-whisper (up to 70x real-time)
4. **Voice Activity Detection** to skip silence

### Setup

```bash
pip install whisperx

# Requires HuggingFace token for pyannote models
# Accept user agreement at: https://huggingface.co/pyannote/speaker-diarization-3.1

# Basic transcription with diarization
whisperx audio.mp3 --model large-v3-turbo --diarize --hf_token hf_YOUR_TOKEN

# Python API
import whisperx

model = whisperx.load_model("large-v3-turbo", device="cpu", compute_type="int8")
audio = whisperx.load_audio("meeting.mp3")
result = model.transcribe(audio, batch_size=16)

# Align word-level timestamps
model_a, metadata = whisperx.load_align_model(language_code=result["language"], device="cpu")
result = whisperx.align(result["segments"], model_a, metadata, audio, device="cpu")

# Speaker diarization
diarize_model = whisperx.DiarizationPipeline(use_auth_token="hf_YOUR_TOKEN")
diarize_segments = diarize_model(audio)
result = whisperx.assign_word_speakers(diarize_segments, result)
```

### Output Example
```json
{
  "segments": [
    {
      "start": 0.5, "end": 3.2,
      "text": "Welcome to the ZAO fractal meeting",
      "speaker": "SPEAKER_00",
      "words": [
        {"word": "Welcome", "start": 0.5, "end": 0.8},
        {"word": "to", "start": 0.85, "end": 0.95}
      ]
    }
  ]
}
```

### Diarization Accuracy
- Uses pyannote under the hood
- Word-level speaker assignment (not just segment-level)
- Slightly lower diarization accuracy than standalone pyannote due to integration overhead
- Best end-to-end pipeline for "who said what, when"

### ZAO Relevance
**This is the recommended tool for ZAO meeting transcription.** Single pipeline gives you transcription + timestamps + speaker IDs. Ideal for fractal meeting minutes and Spaces session archives.

---

## 4. faster-whisper (CTranslate2)

**Repo:** github.com/SYSTRAN/faster-whisper
**License:** MIT

### Speed Comparison vs Original Whisper

| Metric | Original Whisper (PyTorch) | faster-whisper |
|--------|---------------------------|----------------|
| Speed | 1x baseline | 3-6x faster |
| Memory | Full FP32 | 2-4x less (INT8/FP16) |
| Accuracy | Baseline | Same (identical model weights) |
| GPU required | Yes (practical) | Works well on CPU too |

### How It Works
- Converts Whisper model to CTranslate2 format (optimized C++ inference)
- Supports INT8 quantization (8-bit) for massive speed + memory savings
- Drop-in replacement for Whisper's Python API

### Setup

```bash
pip install faster-whisper

# Python usage
from faster_whisper import WhisperModel

model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
segments, info = model.transcribe("meeting.mp3", beam_size=5)

for segment in segments:
    print(f"[{segment.start:.2f} -> {segment.end:.2f}] {segment.text}")
```

### Best For
- Backend processing where you need speed without GPU
- Basis for WhisperX (uses faster-whisper internally)
- Server-side batch transcription pipelines
- INT8 on CPU makes it practical for Mac without GPU compute

---

## 5. Distil-Whisper

**Repo:** github.com/huggingface/distil-whisper
**License:** MIT

### The Tradeoff

| Model | Parameters | Speed vs Large v3 | WER Increase | English Only? |
|-------|-----------|-------------------|-------------|---------------|
| distil-large-v3 | 756M | 6x faster | <1% | Yes |
| distil-medium.en | 394M | 8x faster | ~2% | Yes |
| distil-small.en | 166M | 12x faster | ~4% | Yes |

### Key Facts
- Knowledge distillation: trained on Whisper Large v3's outputs
- 49% smaller, 6x faster, within 1% WER
- 1.3x fewer repeated word duplicates (a known Whisper problem)
- **English only** - for multilingual, use Whisper Turbo instead
- Recommended checkpoint: `distil-whisper/distil-large-v3`

### When to Use
- English-only transcription where speed matters
- Resource-constrained environments (phones, IoT)
- Batch processing large backlogs quickly
- Not suitable for ZAO if multilingual support needed

---

## 6. NVIDIA Canary - Top Accuracy

### Models

| Model | Parameters | WER (Open ASR) | Speed (RTFx) | Languages |
|-------|-----------|----------------|-------------|-----------|
| Canary Qwen 2.5B | 2.5B | 5.63% | 418x | English |
| Canary 1B | 1B | 6.67% | ~300x | 4 languages |
| Parakeet TDT 0.6B v3 | 600M | ~8% | >2,000x | 25 languages |
| Parakeet TDT 1.1B | 1.1B | ~8% | >2,000x | English |

### Canary Qwen 2.5B Key Facts
- **Currently #1 on HuggingFace Open ASR Leaderboard** (5.63% WER)
- 1.6% WER on LibriSpeech test-clean (best in class)
- Hybrid architecture: FastConformer encoder + Qwen3-1.7B LLM decoder
- Trained on less data than Whisper but outperforms it
- Requires NVIDIA GPU - not practical for Mac-native use
- CC-BY-4.0 license (truly open source)

### Parakeet v3 Key Facts
- 600M parameters, 98% accuracy on long audio (up to 24 min)
- 6.5x faster than Canary Qwen while slightly less accurate
- Supports 25 European languages (v3 expanded from English-only)
- Auto-detects language
- CC-BY-4.0 license
- Also requires NVIDIA GPU

### ZAO Relevance
Canary/Parakeet are the accuracy kings but require NVIDIA GPUs. If running a server-side pipeline (e.g., on a VPS with GPU), Canary Qwen would be the most accurate choice. For Mac-local use, Whisper variants remain the practical option.

---

## 7. AssemblyAI Universal - NOT Open Source

AssemblyAI's Universal models (Universal-1, Universal-2, Universal-3 Pro) are **proprietary commercial APIs**, not open source.

- Universal-1: Trained on 12.5M hours, 4 languages
- Universal-2: Improved proper nouns, formatting, alphanumerics
- Universal-3 Pro: Prompt-based customization for industry terms
- Pricing: $0.01/min for async, $0.015/min for streaming
- Good accuracy but comparable to ElevenLabs Scribe at similar pricing

**Verdict:** Not an alternative to self-hosting. Skip for the open-source evaluation.

---

## 8. Accuracy Comparison Table

### WER Benchmarks (Lower = Better)

| Model/Service | English WER | Multilingual WER | Open Source? | Self-Hostable? |
|---------------|-------------|-------------------|-------------|----------------|
| NVIDIA Canary Qwen 2.5B | 5.63% | N/A (English only) | Yes (CC-BY-4.0) | Yes (NVIDIA GPU) |
| IBM Granite Speech 3.3 8B | 5.85% | Yes | Yes | Yes (GPU) |
| Deepgram Nova-3 | 5.26% | 6.8% | No | No |
| ElevenLabs Scribe v2 | 6.5% | 8.1% | No | No |
| OpenAI Whisper Large v3 | 6.5% | 7.4% | Yes (MIT) | Yes |
| Whisper Large v3 Turbo | 7.75% | ~8% | Yes (MIT) | Yes |
| Distil-Whisper Large v3 | ~8% | N/A (English only) | Yes (MIT) | Yes |
| Parakeet TDT 1.1B | ~8% | N/A | Yes (CC-BY-4.0) | Yes (NVIDIA GPU) |

### Real-World Performance Note
Under optimal conditions, best models achieve sub-5% WER. In real-world production with mixed audio quality (meetings with background noise, multiple speakers, music), expect 7-10% WER even from the best models.

---

## 9. Speaker Diarization Options

### Comparison

| Framework | DER (Diarization Error Rate) | GPU Required? | Best For |
|-----------|------------------------------|---------------|----------|
| pyannote 3.1 / Community-1 | 11-19% | Strongly recommended | General purpose, best community |
| pyannote 4.0 (Community-1) | Improved over 3.1 | Strongly recommended | Noisy real-world audio |
| NVIDIA NeMo | Competitive with pyannote | NVIDIA GPU required | Enterprise, long recordings |
| WhisperX (uses pyannote) | Slightly below standalone pyannote | Recommended | End-to-end transcription + diarization |

### pyannote 3.1 / 4.0 (Recommended)

**Strengths:**
- Most widely adopted open-source diarization
- Handles overlapping speech reasonably well
- MIT licensed, excellent documentation
- pyannote 4.0 (Community-1) improves on noisy, real-world audio

**Weaknesses:**
- Slow on CPU (GPU strongly recommended)
- Occasional speaker label switches mid-recording
- Memory intensive for long audio files
- Requires HuggingFace auth token

### NVIDIA NeMo

**Strengths:**
- Better on recordings over 1 hour (multiscale spectral clustering)
- Production-ready with enterprise support
- Scales for high-volume processing

**Weaknesses:**
- Requires NVIDIA GPU (not usable on Mac natively)
- Complex setup, steep learning curve
- Smaller community

### Recommendation for ZAO
Use **WhisperX** (which bundles pyannote) for the all-in-one pipeline. If diarization accuracy is critical for a specific recording, run standalone pyannote 4.0 as a post-processing step.

---

## 10. Real-Time Live Transcription on Mac

### Can Whisper Run Real-Time on Mac?

**Yes, with caveats.** True real-time (streaming word-by-word as you speak) requires chunked processing.

| Solution | Real-Time? | Latency | Mac Native? |
|----------|-----------|---------|-------------|
| WhisperKit (Argmax) | Yes | ~460ms | Yes (ANE optimized) |
| WhisperLive (Collabora) | Yes | ~1-2s chunks | Yes (Python) |
| MacWhisper | Near real-time | ~2-3s | Yes (native app) |
| whisper.cpp stream mode | Yes | ~1-2s | Yes (C++) |
| Superwhisper | Yes | Sub-second | Yes (native app) |

### WhisperKit (Best Mac Real-Time Option)
- Built by Argmax specifically for Apple Silicon
- Compiles Whisper to Core ML for Neural Engine
- 2.2% WER at 460ms latency (best accuracy + speed combo on Mac)
- Swift framework for iOS/macOS integration
- Open source: github.com/argmaxinc/WhisperKit

### whisper.cpp Stream Mode
```bash
# Real-time mic transcription
./stream -m models/ggml-base.en.bin -t 8 --step 500 --length 5000
```
- Processes audio in 500ms chunks with 5-second context window
- Use base or small model for real-time (large too slow for streaming)
- Functional but rough - occasional word cutoffs at chunk boundaries

### ZAO Relevance
For live Spaces transcription, WhisperKit or whisper.cpp stream mode could provide real-time captions locally. However, for production live captioning, ElevenLabs Scribe v2 Realtime (150ms latency, WebSocket API) remains more reliable. A hybrid approach - live captions via Scribe Realtime during the session, then batch re-transcription via WhisperX after - gives the best of both worlds.

---

## 11. Cost Comparison

### Monthly Cost at Different Volumes

| Volume | Self-Hosted Whisper | ElevenLabs Scribe | Deepgram Nova-3 | OpenAI Whisper API |
|--------|--------------------|--------------------|-----------------|-------------------|
| 10 hrs/mo | $0 (Mac local) | $6.30 | $2.58 | $3.60 |
| 50 hrs/mo | $0 (Mac local) | $31.50 | $12.90 | $18.00 |
| 100 hrs/mo | $0 (Mac local) | $63.00 | $25.80 | $36.00 |
| 500 hrs/mo | $0 (Mac local) | $315.00 | $129.00 | $180.00 |

### Per-Minute Pricing (Cloud APIs)

| Service | Batch (per min) | Streaming (per min) |
|---------|----------------|---------------------|
| Deepgram Nova-3 | $0.0043 | $0.0059 |
| OpenAI Whisper API | $0.006 | N/A |
| ElevenLabs Scribe v2 | $0.0105 | $0.0105 |
| AssemblyAI Universal | $0.01 | $0.015 |
| Google Cloud STT | $0.016 | $0.024 |

### Break-Even Analysis
- Self-hosting on Mac is free for compute (you already own the hardware)
- Self-hosting on cloud GPU becomes cost-effective above **25-65 hours/month**
- At 100+ hours/month consistently, self-hosting saves 40-50% vs APIs
- For ZAO (estimate: 4-8 hours of meetings/week = 16-32 hrs/month), **self-hosted on Mac is the clear winner**

### Hidden Costs of Self-Hosting
- Setup time (1-2 hours initial)
- No built-in diarization (need WhisperX pipeline)
- No real-time streaming without extra work
- Maintenance/updates on you
- Quality may trail Scribe v2 by ~1-2% WER

---

## 12. Custom Vocabulary / Fine-Tuning for Music Community

### Problem
Whisper may misrecognize music-specific terms: "fractal meeting", "ZOUNZ", "Respect tokens", artist names, genre terms, DAW terminology, etc.

### Three Approaches

#### A. Prompt Engineering (No Training Required)
```python
# Whisper supports an initial_prompt parameter
model.transcribe("audio.mp3", initial_prompt="ZAO, ZOUNZ, Respect tokens, fractal meeting, Farcaster, onchain, NFT, DAO")
```
- Provide key terms in the `initial_prompt` - Whisper biases toward these spellings
- Free, instant, no training needed
- Limited to ~224 tokens of prompt space
- ElevenLabs Scribe supports this too (up to 1,000 keyterms)

#### B. Contextual Biasing (No Fine-Tuning)
- Recent research (arxiv.org/abs/2410.18363) shows neural-symbolic prefix trees can guide Whisper output toward specific vocabulary without changing model weights
- More sophisticated than prompting, but requires implementation work
- No model retraining needed

#### C. Full Fine-Tuning (Best Results, Most Work)
```python
# Using HuggingFace Transformers + LoRA
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora_config = LoraConfig(r=32, lora_alpha=64, target_modules=["q_proj", "v_proj"])
model = get_peft_model(model, lora_config)

# Fine-tune on your audio + transcript pairs
# ~7,000 samples or ~10 hours of annotated audio is a good starting point
# Training takes ~1.5 hours on a single GPU
```

- LoRA fine-tuning is efficient (only trains adapter layers)
- Need transcribed ZAO meeting audio as training data
- Can dramatically improve recognition of community-specific terms
- Model stays general-purpose with a small domain-specific adapter

### Recommendation for ZAO
Start with **prompt engineering** (approach A) - it's free and instant. If WER on ZAO-specific terms is still too high, collect 10+ hours of transcribed meeting audio and do a **LoRA fine-tune** (approach C). Skip contextual biasing unless you have ML engineering bandwidth.

---

## 13. Output Formats

All Whisper variants support these output formats:

| Format | Extension | Use Case |
|--------|-----------|----------|
| Plain text | .txt | Reading, searching |
| SRT | .srt | Video subtitles (YouTube, Premiere) |
| VTT | .vtt | Web video player captions (HTML5) |
| JSON | .json | Programmatic access, word timestamps |
| TSV | .tsv | Spreadsheet import |

### WhisperX Enhanced Output
WhisperX adds to JSON output:
- Word-level timestamps (not just segment-level)
- Speaker labels per word
- Confidence scores
- Language detection

### Converting Between Formats
```bash
# whisper.cpp outputs all formats simultaneously
./main -m model.bin -f audio.wav -otxt -osrt -ovtt -ojf

# Python: whisper/faster-whisper output segments, convert with libraries
# Use pysrt or webvtt-py for SRT/VTT generation from JSON
```

---

## 14. Batch Processing Pipeline

### For ZAO: Processing Hours of Meeting Recordings

#### Option A: MacWhisper Watch Folder (Easiest)
- Designate a folder on Mac
- MacWhisper watches it and auto-transcribes any new audio/video files
- Outputs .txt, .srt, .vtt automatically
- Batch export for processing dozens of files at once
- $29 for Pro version (one-time)

#### Option B: Custom Pipeline with faster-whisper (Most Flexible)

```python
#!/usr/bin/env python3
"""Batch transcription pipeline for ZAO meetings."""
import os
import json
from pathlib import Path
from faster_whisper import WhisperModel

INPUT_DIR = Path("./recordings")
OUTPUT_DIR = Path("./transcripts")
OUTPUT_DIR.mkdir(exist_ok=True)

model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")

for audio_file in sorted(INPUT_DIR.glob("*.mp3")):
    print(f"Transcribing: {audio_file.name}")
    segments, info = model.transcribe(
        str(audio_file),
        beam_size=5,
        initial_prompt="ZAO, ZOUNZ, fractal meeting, Respect tokens, Farcaster"
    )

    transcript = []
    for seg in segments:
        transcript.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip()
        })

    output_path = OUTPUT_DIR / f"{audio_file.stem}.json"
    with open(output_path, "w") as f:
        json.dump({"file": audio_file.name, "language": info.language, "segments": transcript}, f, indent=2)

    print(f"  -> {output_path} ({len(transcript)} segments)")
```

#### Option C: WhisperX Pipeline with Diarization (Best for Meetings)

```bash
# Process all MP3s in a directory with speaker diarization
for f in recordings/*.mp3; do
  whisperx "$f" \
    --model large-v3-turbo \
    --diarize \
    --hf_token hf_YOUR_TOKEN \
    --output_dir transcripts/ \
    --output_format all \
    --initial_prompt "ZAO, ZOUNZ, fractal, Respect, Farcaster"
done
```

#### Performance Estimates (M3 Pro Mac)

| Recording Length | Processing Time (Turbo, INT8) | With Diarization |
|-----------------|-------------------------------|-------------------|
| 1 hour | ~6-8 minutes | ~10-12 minutes |
| 2 hours | ~12-16 minutes | ~20-24 minutes |
| 8 hours (weekly backlog) | ~48-64 minutes | ~80-96 minutes |

---

## 15. Best Mac-Native Apps

### MacWhisper (Recommended for Non-Technical Users)

- **Price:** Free (basic) / $29 Pro (one-time) / $49 Business
- **Models:** All Whisper models including Large v3 Turbo
- **Features:**
  - Batch processing + watch folder automation
  - System-wide dictation replacement
  - Auto-record Zoom/Teams/Discord meetings
  - Export: TXT, SRT, VTT, CSV, JSON
  - Translate to 100+ languages
- **Download:** goodsnooze.gumroad.com/l/macwhisper

### Aiko (Best Free Option)

- **Price:** Free (App Store)
- **Models:** Large v3 on Mac, Medium/Small on iOS
- **Features:**
  - Completely local, no data leaves device
  - macOS + iOS + iPadOS
  - Simple, read-only interface
  - Good for quick one-off transcriptions
- **Download:** App Store

### Superwhisper (Best for Real-Time Dictation)

- **Price:** $10/month or $100/year
- **Models:** Multiple Whisper variants + cloud options
- **Features:**
  - Sub-second voice-to-text
  - Works in any text field (system-wide)
  - Offline + cloud modes
  - AI formatting/cleaning of output
- **Download:** superwhisper.com

### Buzz (Best Cross-Platform)

- **Price:** Free and open source
- **Models:** All Whisper models
- **Features:**
  - macOS + Windows + Linux
  - Live mic transcription
  - Speaker identification (2026 update)
  - YouTube URL transcription
  - Batch processing
- **Repo:** github.com/chidiwilliams/buzz

### WhisperKit (Best for Developers)

- **Price:** Free, open source (MIT)
- **Built by:** Argmax
- **Features:**
  - Swift framework for macOS/iOS
  - Core ML optimized for Apple Neural Engine
  - 2.2% WER, 460ms latency
  - Real-time streaming API
  - Best for building custom apps
- **Repo:** github.com/argmaxinc/WhisperKit

---

## 16. New Contender: IBM Granite Speech 3.3 8B

Worth noting: IBM released Granite Speech 3.3 8B in early 2026.
- 5.85% WER on Open ASR Leaderboard (second only to Canary Qwen)
- Supports 4 languages + translation
- Fully open source (Apache 2.0)
- Larger model (8B+ params) so heavier on resources
- Enterprise-grade but community-accessible

---

## 17. Recommendations for ZAO

### Immediate Setup (Zero Cost)

1. **Install MacWhisper Pro** ($29 one-time) on the Mac used for ZAO work
2. **Set up a watch folder** - drop meeting recordings in, get transcripts out
3. **Use `initial_prompt`** with ZAO terminology for better accuracy
4. **Model:** Large v3 Turbo for best speed/accuracy balance

### Meeting Transcription Pipeline

1. Record fractal meetings / Spaces sessions (already happening)
2. Drop recordings into watch folder OR run WhisperX batch script
3. WhisperX with `--diarize` for speaker-labeled transcripts
4. Store transcripts alongside recordings in the research library

### Live Transcription (Spaces Captions)

**Short-term:** ElevenLabs Scribe v2 Realtime (150ms, WebSocket, already researched in Doc 313)
**Medium-term:** WhisperKit integration for fully local live captions in ZAO OS Spaces

### Cost Projection

| Scenario | Monthly Hours | Cost |
|----------|--------------|------|
| Current (no transcription) | 0 | $0 |
| Self-hosted Whisper on Mac | 20-30 hrs | $0 |
| ElevenLabs Scribe equivalent | 20-30 hrs | $12.60-$18.90 |
| Savings | - | $150-$225/year |

### Quality Expectations

- Self-hosted Whisper: ~7-8% WER on meeting audio
- ElevenLabs Scribe: ~6.5% WER (slightly better)
- With ZAO-specific prompt engineering: both improve ~0.5-1%
- With LoRA fine-tuning: could reach ~4-5% WER on ZAO content

### Decision Matrix

| Need | Best Tool |
|------|-----------|
| Quick one-off transcription | MacWhisper or Aiko |
| Batch processing meetings | faster-whisper script or MacWhisper watch folder |
| Who said what (diarization) | WhisperX with pyannote |
| Live captions in Spaces | ElevenLabs Scribe Realtime (now) / WhisperKit (future) |
| Maximum accuracy (server) | NVIDIA Canary Qwen 2.5B |
| Real-time dictation | Superwhisper |
| Building into ZAO OS | WhisperKit (Swift/Apple native) |
| Custom vocabulary | Prompt engineering first, LoRA fine-tune if needed |

---

## Sources

- [Northflank - Best Open Source STT in 2026](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [Voicci - Apple Silicon Whisper Performance](https://www.voicci.com/blog/apple-silicon-whisper-performance.html)
- [FutureAGI - STT APIs 2026 Benchmarks & Pricing](https://futureagi.com/blog/speech-to-text-apis-in-2026-benchmarks-pricing-developer-s-decision-guide)
- [BrassTranscripts - Speaker Diarization Models Comparison](https://brasstranscripts.com/blog/speaker-diarization-models-comparison)
- [BrassTranscripts - Whisper Speaker Diarization Tutorial](https://brasstranscripts.com/blog/whisper-speaker-diarization-guide)
- [Modal - Choosing Whisper Variants](https://modal.com/blog/choosing-whisper-variants)
- [HuggingFace - Whisper Large V3 Turbo](https://huggingface.co/openai/whisper-large-v3-turbo)
- [HuggingFace - Distil-Whisper](https://github.com/huggingface/distil-whisper)
- [NVIDIA - Canary Model Blog](https://developer.nvidia.com/blog/new-standard-for-speech-recognition-and-translation-from-the-nvidia-nemo-canary-model/)
- [NVIDIA - Parakeet TDT v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)
- [HuggingFace - Faster-Whisper vs Canary](https://huggingface.co/blog/norwooodsystems/faster-whisper-vs-canary-qwen-2-5b)
- [WhisperKit by Argmax](https://github.com/argmaxinc/WhisperKit)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
- [WhisperX](https://github.com/m-bain/whisperx)
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
- [Contextual Biasing for Whisper (arxiv)](https://arxiv.org/abs/2410.18363)
- [MacWhisper](https://goodsnooze.gumroad.com/l/macwhisper)
- [Superwhisper](https://superwhisper.com/)
- [WhisperLive](https://github.com/collabora/WhisperLive)
- [MacParakeet - Whisper to Parakeet on Apple Silicon](https://macparakeet.com/blog/whisper-to-parakeet-neural-engine/)
- [AssemblyAI Benchmarks](https://www.assemblyai.com/benchmarks)
- [Deepgram - STT Pricing 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [SayToWords - Whisper Turbo Benchmark March 2026](https://www.saytowords.com/blogs/whisper-large-v3-turbo-english-interview-benchmark-2026-03-28/)
