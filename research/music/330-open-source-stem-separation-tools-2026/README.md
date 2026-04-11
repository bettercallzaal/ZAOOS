# Doc 330 - Open Source Stem Separation Tools 2026: Deep Dive

**Created:** 2026-04-11
**Category:** Music / Production / Stem Separation
**Use Case:** Splitting AI-generated tracks into stems (vocals, drums, bass, instruments) for remixing in a DAW

---

## Table of Contents

1. [Demucs v4 (Meta) - Architecture, Models, Installation](#1-demucs-v4-meta)
2. [UVR5 (Ultimate Vocal Remover) - GUI, Models, Ensemble Mode](#2-uvr5-ultimate-vocal-remover)
3. [Quality Comparison with SDR Benchmarks](#3-quality-comparison-with-sdr-benchmarks)
4. [Stem Counts by Tool](#4-stem-counts-by-tool)
5. [Mac M-Series Performance (No Discrete GPU)](#5-mac-m-series-performance)
6. [Best Model Configs by Use Case](#6-best-model-configs-by-use-case)
7. [Architecture Deep Dive: Open-Unmix, Band-Split RNN, HTDemucs, Mel-Roformer](#7-architecture-deep-dive)
8. [Chaining Stem Separation with Voice Conversion (RVC/Kits.AI)](#8-chaining-with-voice-conversion)
9. [Quality Degradation - Separate and Recombine](#9-quality-degradation)
10. [Batch Processing and Automation](#10-batch-processing)
11. [Free Alternatives to LALAL.AI](#11-free-alternatives-to-lalalai)
12. [Python API for Programmatic Use / Web App Integration](#12-python-api)
13. [The Ensemble Trick - Multi-Model Combination](#13-the-ensemble-trick)
14. [Audio Format Requirements and Best Practices](#14-audio-format-requirements)

---

## 1. Demucs v4 (Meta)

### What It Is

Demucs is Meta's open-source music source separation model. Version 4 introduced the **Hybrid Transformer Demucs (HTDemucs)** architecture - dual U-Nets operating in time and frequency domains with cross-domain transformer attention. Released December 2022, it remains one of the top-performing open-source models.

**Important status note:** The original `facebookresearch/demucs` repo was archived January 1, 2025. The original author maintains a fork at `github.com/adefossez/demucs` with limited bug fixes only. The models themselves still work perfectly.

### Available Models

| Model | Stems | SDR (MUSDB HQ) | Training Data | Notes |
|-------|-------|-----------------|---------------|-------|
| `htdemucs` | 4 (vocals, drums, bass, other) | 9.0 dB | MusDB + 800 songs | Default model, best all-rounder |
| `htdemucs_ft` | 4 | 9.0 dB (marginally better per-source) | Same | Fine-tuned, **4x slower** but slightly better |
| `htdemucs_6s` | 6 (+ guitar, piano) | ~9.0 dB avg | Same | Piano quality is poor; guitar is acceptable |
| `hdemucs_mmi` | 4 | 7.7 dB | MusDB + 800 songs | v3 retrained, legacy |
| `mdx_extra` | 4 | ~7.5 dB | Extra training data | Older MDX architecture |
| `mdx_extra_q` | 4 | Slightly below mdx_extra | Same | Quantized, smaller download |

**The 6-stem model (`htdemucs_6s`)** adds guitar and piano separation but the piano source has significant bleeding and artifacts. Guitar separation is acceptable. For production use, 4-stem separation remains more reliable.

### Installation on Mac (Including M-Series)

**Standard install (works on all Macs):**
```bash
pip install -U demucs
```

**Usage:**
```bash
# Default 4-stem separation
demucs song.mp3

# Vocals only (karaoke mode)
demucs --two-stems=vocals song.mp3

# Fine-tuned model (slower, slightly better)
demucs -n htdemucs_ft song.mp3

# 6-stem model
demucs -n htdemucs_6s song.mp3

# Force CPU (if MPS causes issues)
demucs -d cpu song.mp3

# Output as MP3 instead of WAV
demucs --mp3 --mp3-bitrate 320 song.mp3

# 24-bit output
demucs --int24 song.mp3
```

Output goes to `separated/htdemucs/TRACKNAME/` with one file per stem.

**MLX-optimized version for Apple Silicon (February 2026):**
```bash
git clone https://github.com/andrade0/demucs-mlx.git
cd demucs-mlx
make install
demucs-mlx song.mp3
```

This port achieves **34x faster than realtime on M4 Max** - a 7-minute song in 12 seconds. Quality is identical to PyTorch (max absolute difference < 1 ppm - literally inaudible).

### Memory Requirements

- Minimum 3 GB VRAM (or system RAM on Mac)
- Recommended 7 GB with default settings
- For constrained systems: `demucs --segment 8 song.mp3`
- Environment variable: `PYTORCH_NO_CUDA_MEMORY_CACHING=1` reduces memory

---

## 2. UVR5 (Ultimate Vocal Remover)

### What It Is

UVR5 is a free, open-source GUI application that supports **multiple AI architectures** - MDX-Net, Demucs v4, VR Arch, MDXC, and (in beta) RoFormer models. It is the Swiss Army knife of stem separation. Think of it as a frontend that can run many different separation models.

**GitHub:** `github.com/Anjok07/ultimatevocalremovergui`
**Latest:** v5.6 available on SourceForge

### Supported Model Architectures

| Architecture | Strengths | Best For |
|---|---|---|
| **RoFormer** (BS-RoFormer, Mel-Band RoFormer) | Highest quality vocals, natural sound | Vocal isolation, vocals + drums |
| **MDX-Net** (Kim Vocal 2, Inst HQ 3, Voc_FT) | Excellent vocal separation, fast | Quick vocal/instrumental splits |
| **Demucs v4** (htdemucs, htdemucs_ft) | Best multi-stem, musical bass/drums | 4-stem or 6-stem separation |
| **VR Arch** | Good speed/quality compromise | Quick processing, lower resource use |
| **MDXC** (MDX23C) | Newer architecture, competitive | Alternative to MDX-Net |

### Ensemble Mode Explained

Ensemble Mode is UVR5's killer feature. It runs **multiple models on the same track** and combines results using algorithms like:

- **Max Spec** - takes the maximum spectral value from each model (best for preserving detail)
- **Min Spec** - takes the minimum (best for removing artifacts)
- **Average** - averages all model outputs
- **Median** - takes median values (good artifact reduction)

**How to set up:**
1. Select "Ensemble Mode" in UVR5
2. Choose "MAIN STEM PAIR" > "Vocals/Instrumental"
3. Choose "ENSEMBLE ALGORITHM" > "Max Spec/Max Spec"
4. Select 2-3 models (e.g., Kim Vocal 2 + MDX-NET Inst HQ 3)
5. Save as a named preset
6. Process

**Trade-off:** Processing time roughly multiplies by the number of models selected (2 models = 2x time, 3 models = 3x time).

### Download Center

UVR5 includes a built-in Download Center where you can grab 100+ pre-trained models across all architectures. Models auto-download on first use.

---

## 3. Quality Comparison with SDR Benchmarks

SDR (Signal-to-Distortion Ratio) measures the power ratio between intended source and artifacts. Higher = better. Measured in dB on the MUSDB18-HQ test set (47 songs with ground-truth stems).

### Open-Source Model SDR Scores (MUSDB18-HQ)

| Model | Vocals | Drums | Bass | Other | Average |
|-------|--------|-------|------|-------|---------|
| **BS-RoFormer** (+ 500 extra songs) | ~11.0 | ~10.5 | ~14.0 | ~8.5 | **11.99** |
| **Mel-RoFormer** (L=6) | 11.21 | 9.91 | 9.64 | 7.79 | **9.64** |
| **BS-RoFormer** (MUSDB only, L=6) | 10.78 | 9.61 | 11.43 | 7.84 | **9.92** |
| **HTDemucs ft** (fine-tuned) | ~9.5 | ~9.0 | ~9.0 | ~8.0 | **~9.0** |
| **HTDemucs** (default) | ~9.0 | ~8.5 | ~8.5 | ~7.5 | **~9.0** |
| **HDemucs v3** (+ extra data) | ~8.5 | ~7.5 | 8.76 | 5.59 | **7.68** |
| **Spleeter** (Deezer, 2019) | ~6.5 | ~5.5 | ~5.0 | ~4.0 | **~5.3** |

### Commercial vs Open-Source

| Tool | Vocal SDR | Notes |
|------|-----------|-------|
| **Music.AI** | 11.9 | Proprietary, 18 stems, highest published scores |
| **AudioShake** | 13.5 (vocals) | Proprietary, ~2 dB above best open-source on vocals |
| **LALAL.AI Andromeda** | 16.0 (internal set) | Proprietary internal benchmark, not MUSDB |
| **LALAL.AI Orion** | ~0.9 dB behind HTDemucs on vocals (MUSDB) | Older model, good on pop/rock |
| **BS-RoFormer** (open) | 11.0 | Free, matches many paid tools |
| **Mel-RoFormer** (open) | 11.2 | Free, best open-source vocals |

**Key insight:** LALAL.AI's 16 dB claim is on their internal evaluation set (5 person-years to build), not MUSDB. On MUSDB, open-source models are competitive or ahead. AudioShake legitimately leads on vocals at 13.5 dB on MUSDB, but charges enterprise pricing.

**The practical reality:** Open-source (Mel-RoFormer, BS-RoFormer, HTDemucs, UVR5 ensembles) now matches or exceeds most paid tools for the majority of tracks. Results vary song-to-song - having 2-3 tools available and comparing is the best practice.

---

## 4. Stem Counts by Tool

| Tool | Max Stems | What You Get |
|------|-----------|--------------|
| **Suno Studio** | 12 | Vocals, backing vocals, drums, bass, electric guitar, acoustic guitar, synths, pads, strings, brass/horns, keys/piano, percussion/effects |
| **LALAL.AI** | 10 | Vocals, instrumental, drums, bass, electric guitar, acoustic guitar, piano, synthesizer, wind, strings |
| **Music.AI** | 18 | Broadest separation available |
| **Fadr** | 16 | Vocals, drums, bass, guitar, piano, synth, strings, wind, + more |
| **UVR5** | 6 (via Demucs 6s) | Vocals, drums, bass, guitar, piano, other |
| **HTDemucs** | 4 (default) / 6 | Vocals, drums, bass, other (+ guitar, piano on 6s) |
| **Moises** | 5+ | Vocals, drums, bass, other, + instrument-specific |
| **BandLab** | 4 free / 6 paid | Vocals, drums, bass, other (+ guitar, keys paid) |
| **Spleeter** | 2 or 5 | Vocals/accompaniment or vocals/drums/bass/piano/other |
| **Vocali.se** | 2 | Vocals/instrumental only |

**Practical guidance:** 4-stem separation (vocals, drums, bass, other) is the sweet spot for quality. Going beyond 4 stems increases bleeding between sources. The 12-16 stem tools achieve this through multi-pass or specialized models, but each additional stem degrades individual stem quality. For DAW remixing, 4 clean stems > 8 artifact-laden stems.

---

## 5. Mac M-Series Performance

### Can You Run Stem Separation Without a Discrete GPU?

Yes. All major tools work on Mac M-series chips. Apple Silicon's unified memory architecture means GPU and CPU share the same RAM pool, which helps with large models.

### Speed Benchmarks

| Tool / Backend | Chip | 4-min Song | Notes |
|---|---|---|---|
| **Demucs-MLX** | M4 Max | ~7 sec | 34x realtime, best option |
| **Demucs-MLX** | M1/M2/M3 | ~15-30 sec (est.) | MLX optimized for all Apple Silicon |
| **Demucs (PyTorch CPU)** | M4 Max | ~1.5 min | 11x slower than MLX on same hardware |
| **Demucs (PyTorch MPS)** | M-series | Varies | MPS can be 5x faster for HTDemucs but 2x SLOWER for some models |
| **UVR5 (no GPU)** | Any Mac | 5-10+ min | CPU-only, depends on model |
| **StemRoller** | Older hardware | ~15 min | Desktop GUI wrapper |

### MPS (Metal Performance Shaders) Gotchas

- PyTorch's MPS backend has known issues with Demucs: complex tensors, custom ops, and incompatibilities
- For HTDemucs specifically, MPS can speed up ~5x
- For older Demucs/HDemucs models, MPS can actually be **slower than CPU by 2x**
- The MLX framework bypass all these issues by being native to Apple Silicon

### Recommendation for Mac Users

1. **Best speed:** Install `demucs-mlx` - native Apple Silicon, 34x realtime on M4 Max
2. **Best GUI:** UVR5 - slower but gives you ensemble mode and 100+ models
3. **Best compatibility:** Standard `demucs` with `-d cpu` flag - works everywhere, 2-3 min per song

---

## 6. Best Model Configs by Use Case

### Extracting Clean Vocals

**Primary:** RoFormer (BS-RoFormer or Mel-Band RoFormer)
- Mel-RoFormer leads on vocal SDR (11.21 dB) with the most natural-sounding separation
- BS-RoFormer close behind at 10.78 dB

**Refinement pass:** MDX-Net Voc_FT to trim residual backing vocal leaks

**Ensemble workflow:**
```
Pass 1: RoFormer vocal extraction
Pass 2: MDX-Net Voc_FT on the same track
Combine: Ensemble > Max Spec algorithm
```

### Extracting Drums

**Primary:** Demucs v4 (`htdemucs` or `htdemucs_ft`)
- Demucs is the strongest for discrete multi-stem separation (drums, bass)
- HTDemucs delivers the most "musical" drum separation

**Refinement:** MDX-Net afterward to clean up vocal bleed in the drum stem

### Extracting Bass

**Primary:** BS-RoFormer - dominates bass SDR at 11.43-14.0 dB depending on training data
**Secondary:** Demucs v4 for more "musical" sounding bass with natural transients

### Full 4-Stem Separation (Most Common)

**Quickest good result:** `demucs -n htdemucs song.mp3`
**Best quality, patience required:** `demucs -n htdemucs_ft song.mp3` (4x slower)
**Best quality, technical setup:** BS-RoFormer via UVR5 or audio-separator

### Isolating Guitar or Piano

**Only viable option:** `demucs -n htdemucs_6s song.mp3`
- Guitar quality: acceptable
- Piano quality: poor (significant bleeding and artifacts)
- For better piano isolation, use a 4-stem split, then apply a second pass on the "other" stem

---

## 7. Architecture Deep Dive

### Open-Unmix (UMX)

- **Architecture:** Bi-directional LSTM on spectrograms
- **Status:** Largely obsolete for production (2019 era). SDR ~5-6 dB average
- **Still relevant?** No. Surpassed by everything listed below. Useful only as a reference implementation for researchers

### HTDemucs (Hybrid Transformer Demucs)

- **Architecture:** Dual U-Nets (time-domain + frequency-domain) with cross-domain transformer attention
- **Key innovation:** Processes both waveform and spectrogram simultaneously, using transformer layers to share information between the two representations
- **SDR:** 9.0-9.2 dB on MUSDB HQ
- **Strengths:** Best balanced multi-stem separation, handles complex mixes well, robust default
- **Weaknesses:** Not the absolute best at any single stem type

### Band-Split RNN (BSRNN)

- **Architecture:** Splits input spectrogram into non-overlapping frequency bands, processes each band independently with RNNs, then models cross-band relationships
- **Key innovation:** Band-level processing captures instrument-specific frequency patterns
- **Origin:** ByteDance AI Labs
- **SDR:** Competitive with HTDemucs, formed the basis for RoFormer models

### BS-RoFormer (Band-Split Rotary Transformer)

- **Architecture:** Replaces BSRNN's RNN layers with Rotary Position Embedding (RoPE) Transformers. Non-overlapping band-split with hierarchical inner-band + inter-band attention
- **SDR:** 9.92 dB average (MUSDB only), **11.99 dB** with extra training data
- **Won:** 1st place in Sound Demixing Challenge (SDX23) MSS track
- **Strengths:** Best bass separation (11.43-14.0 dB), excellent overall, 6-stem variant available
- **Weaknesses:** Band boundaries are heuristic-based, non-overlapping splits can miss cross-band information

### Mel-Band RoFormer

- **Architecture:** Similar to BS-RoFormer but uses **overlapping mel-scale frequency bands** instead of non-overlapping heuristic bands. Mel scale matches human auditory perception
- **SDR:** 9.64 dB average (MUSDB), but **best vocals at 11.21 dB** and best drums at 9.91 dB
- **Key innovation:** Overlapping bands reduce boundary artifacts; mel-scale alignment captures vocal harmonics better
- **Strengths:** Best vocal and drum quality, most natural-sounding separation
- **Weaknesses:** Weaker bass than BS-RoFormer (9.64 vs 11.43 dB)

### Which Architecture Is Best?

| Use Case | Best Architecture | Why |
|----------|-------------------|-----|
| **Overall quality** | BS-RoFormer (extra data) | Highest average SDR at 11.99 dB |
| **Vocal isolation** | Mel-RoFormer | 11.21 dB vocal SDR, most natural |
| **Bass isolation** | BS-RoFormer | 11.43-14.0 dB bass SDR |
| **Balanced 4-stem** | HTDemucs ft | Most consistent across all stems |
| **Speed** | HTDemucs (MLX) | 34x realtime on M4 Max |
| **Ease of use** | HTDemucs via Demucs CLI | One command, no config needed |

---

## 8. Chaining Stem Separation with Voice Conversion

### The AI Cover Pipeline (Stem Sep + RVC/Kits.AI)

This is the standard workflow for creating AI covers or swapping vocals:

```
Step 1: Stem Separation
   Input: Full mixed song (MP3/WAV)
   Tool: UVR5 or Demucs
   Output: Isolated vocals + instrumental stems

Step 2: Vocal Cleanup
   Input: Isolated vocal stem
   Tool: UVR5 second pass (remove reverb, echo, backing vocals)
   Output: Clean dry lead vocals

Step 3: Voice Conversion
   Input: Clean vocals
   Tool: RVC v2 or Kits.AI
   Settings: Select target voice model, adjust pitch (+/- semitones),
             set index rate (0.5-0.8 for natural sound)
   Output: Vocals in the target voice

Step 4: Post-Processing
   Input: Converted vocals
   Tool: DAW (Logic Pro, GarageBand, Reaper)
   Actions: EQ, compression, de-essing, reverb matching
   Goal: Make converted vocals sit naturally in the mix

Step 5: Recombination
   Input: Converted vocals + original instrumental stems
   Tool: DAW
   Output: Final AI cover
```

### Tools for Each Step

**Stem Separation:**
- Best free: UVR5 with RoFormer or MDX-Net
- Best CLI: `demucs --two-stems=vocals song.mp3`
- Best paid: LALAL.AI (cleanest vocal isolation for reverb-heavy tracks)

**Voice Conversion:**
- **RVC v2** (open source) - most popular, real-time capable, huge model library, free
- **Kits.AI** (commercial) - ethically licensed artist models, revenue sharing, includes pitch correction + stem separation + mastering in one platform
- **ElevenLabs Voice Changer** (commercial) - industry-leading voice cloning, requires you to sing the melody
- **Ultimate RVC** (`github.com/JackismyShephard/ultimate-rvc`) - all-in-one app wrapping UVR5 + RVC with caching between steps

### Key Tips

- **Always separate to dry vocals first** - reverb on vocals before conversion causes artifacts
- UVR5 has dedicated de-reverb and de-echo models in the Download Center
- Run a de-reverb pass after vocal isolation, before RVC
- RVC `index_rate` of 0.5-0.7 balances voice similarity vs. naturalness
- Pitch shift in RVC is in semitones - stay within +/- 5 for best quality
- **Never** feed a full mix into RVC - always isolate vocals first

---

## 9. Quality Degradation

### Does Separating and Recombining Lose Quality?

**Yes, always.** No AI model achieves perfect separation. When you sum all stems back together, you do NOT get a bit-perfect copy of the original. Here is what happens:

### Types of Degradation

1. **Spectral bleeding / leakage** - traces of other instruments in each stem. Most noticeable: kick drum ghost in vocal stems, vocal whisper in drum stems
2. **Phase artifacts** - phasing and cancellation when stems are recombined, especially at frequency boundaries where instruments overlap
3. **High-frequency loss** - subtle dulling of transients and air, more noticeable on cymbals and vocal sibilance
4. **Stereo image narrowing** - separation algorithms can collapse stereo width, especially on "other" and reverb-heavy stems

### How Much Quality Loss?

- Best case (HTDemucs on clean pop): **0.5-1.5 dB SDR loss** on recombined mix vs original
- Typical case: the recombined stems are audibly "close" but not identical - most listeners would not notice in a remix context
- Worst case (dense orchestral, heavy reverb): significant phase artifacts, noticeable quality loss

### Mitigation Strategies

1. **Use the highest quality source** - WAV/FLAC, never MP3 below 192 kbps
2. **4 stems, not 6+** - fewer stems = less cumulative error
3. **Only replace what you need** - if you only need vocals, use `--two-stems=vocals` and keep the original instrumental
4. **Ensemble processing** - reduces artifacts at the cost of processing time
5. **Post-processing in DAW** - EQ out ghost frequencies, apply gentle gating
6. **Accept the imperfection** - for remixing purposes, the quality is more than sufficient. You are adding your own processing anyway

---

## 10. Batch Processing

### Demucs CLI - Built-in Batch Processing

```bash
# Process all files in a directory
demucs *.mp3

# Process specific files
demucs track1.mp3 track2.wav track3.flac

# With specific model and output format
demucs -n htdemucs_ft --mp3 --mp3-bitrate 320 *.wav
```

Demucs natively accepts multiple input files and processes them sequentially. Output goes to `separated/MODEL_NAME/TRACK_NAME/`.

### Audio-Separator - Programmatic Batch Processing

```python
from audio_separator.separator import Separator
import glob

separator = Separator(output_dir='output/')
separator.load_model(model_filename='UVR-MDX-NET-Voc_FT.onnx')

for audio_file in glob.glob('input/*.mp3'):
    output_files = separator.separate(audio_file)
    print(f"Processed: {audio_file} -> {output_files}")
```

### UVR5 GUI - Manual Batch

UVR5 supports selecting multiple files in the input field. Not true automation, but functional for small batches.

### Large-Scale Automation

For processing hundreds/thousands of files:
- Use `audio-separator` in a Docker container
- Queue with Celery/Redis for web app backends
- Chunk files over 1 hour: `--chunk_duration 600` (10-minute segments)

---

## 11. Free Alternatives to LALAL.AI

LALAL.AI's strength is vocal isolation quality (especially on reverb-heavy material) and a polished UI. Here are free alternatives that match or exceed its quality:

| Tool | Quality vs LALAL.AI | Strengths | Weaknesses |
|------|---------------------|-----------|------------|
| **UVR5** (RoFormer models) | Equal or better | More models, ensemble mode, fully offline | Steeper learning curve, ugly UI |
| **UVR5** (MDX-Net Kim Vocal 2) | Equal | Fast, clean vocals | Single-model, no ensemble |
| **Demucs htdemucs_ft** | Equal for 4-stem | Best balanced multi-stem, CLI-friendly | Slower (4x), no GUI by default |
| **Demucs-MLX** | Equal quality, vastly faster | 34x realtime on Apple Silicon | Mac-only, CLI-only |
| **MVSEP.com** | Competitive | Web-based, free tier, multiple models | Upload limits, slower |
| **Moseca** | Good | Open-source web app, easy to self-host | Fewer models than UVR5 |
| **audio-separator** (Python) | Equal (uses same models) | Programmatic, Docker support | No GUI, developer-oriented |

**The honest answer:** UVR5 with Mel-Band RoFormer or BS-RoFormer models matches or beats LALAL.AI on the majority of tracks. LALAL.AI's Perseus/Andromeda models may edge ahead on specific difficult material (dense reverb tails, heavy vocal layering), but the gap is small and shrinking.

---

## 12. Python API for Programmatic Use

### Option A: Demucs Python API

```python
import demucs.separate

# Basic separation
demucs.separate.main([
    "--mp3",
    "--two-stems", "vocals",
    "-n", "htdemucs",
    "input_track.mp3"
])

# Full 4-stem, 24-bit WAV output
demucs.separate.main([
    "--int24",
    "-n", "htdemucs_ft",
    "-o", "/output/directory",
    "input_track.mp3"
])
```

**Limitation:** Demucs's Python API is essentially a wrapper around CLI args. It is functional but not a clean programmatic interface.

### Option B: audio-separator (Recommended for Web Apps)

```python
from audio_separator.separator import Separator

# Initialize
separator = Separator(
    output_dir='output/',
    model_file_dir='models/',  # cache downloaded models
    output_format='WAV',
)

# Load any model (MDX-Net, Demucs, VR Arch, MDXC, RoFormer)
separator.load_model(model_filename='UVR-MDX-NET-Voc_FT.onnx')

# Separate
primary_stem, secondary_stem = separator.separate('song.wav')

# Ensemble: run multiple models and combine
separator.load_model('Kim_Vocal_2.onnx')
result1 = separator.separate('song.wav')

separator.load_model('UVR-MDX-NET-Inst_HQ_3.onnx')
result2 = separator.separate('song.wav')

# Combine using ensemble algorithms: avg_wave, median_wave, max_fft
```

**Docker deployment:**
```bash
docker pull beveradb/audio-separator
docker run -v ./input:/input -v ./output:/output \
  beveradb/audio-separator /input/song.mp3
```

### Option C: Cloud APIs (If Self-Hosting Is Not Desired)

| API | Model | Pricing | Notes |
|-----|-------|---------|-------|
| **StemSplit** | HTDemucs | Free 10 min, then paid | REST API, returns BPM/key too |
| **LALAL.AI** | Proprietary | Per-stem charges | Separates one stem per API call (3 calls for 3 stems) |
| **Moises** | Proprietary | Limited free tier | Requires publicly accessible URLs, GraphQL API |

### Web App Integration Pattern

```python
# FastAPI example
from fastapi import FastAPI, UploadFile
from audio_separator.separator import Separator

app = FastAPI()
separator = Separator(output_dir='/tmp/stems/')
separator.load_model('htdemucs_ft')

@app.post("/separate")
async def separate_track(file: UploadFile):
    # Save upload
    input_path = f"/tmp/uploads/{file.filename}"
    with open(input_path, "wb") as f:
        f.write(await file.read())

    # Separate
    stems = separator.separate(input_path)

    return {"stems": stems}
```

---

## 13. The Ensemble Trick

### What It Is

Running the same track through 2-3 different models and mathematically combining the results. Each model has different strengths and weaknesses - combining them averages out individual flaws.

### Why It Works

- Model A might leave drum ghosts in the vocal stem but handle reverb tails well
- Model B might have clean drums but smear vocal transients
- Combining with Max Spec or averaging yields a result better than either alone

### Recommended Ensemble Combos

**For vocals:**
```
Model 1: RoFormer (Mel-Band or BS-RoFormer) - natural tone
Model 2: MDX-Net Voc_FT - removes backing vocal leaks
Algorithm: Max Spec
```

**For instrumentals:**
```
Model 1: MDX-Net Inst HQ 3 - clean instrumentals
Model 2: htdemucs_ft - fixes drum bleed
Algorithm: Max Spec
```

**For full 4-stem:**
```
Run 1: htdemucs_ft for all 4 stems
Run 2: BS-RoFormer for vocals + bass
Combine: Use htdemucs drums/other + BS-RoFormer vocals/bass
```

### How to Do It

**In UVR5:**
1. Ensemble Mode tab
2. Select models
3. Choose algorithm (Max Spec recommended)
4. Process

**Programmatically with audio-separator:**
```python
from audio_separator.separator import Separator

sep = Separator(output_dir='output/')

# Run model 1
sep.load_model('mel_band_roformer.ckpt')
vocals_1, inst_1 = sep.separate('song.wav')

# Run model 2
sep.load_model('UVR-MDX-NET-Voc_FT.onnx')
vocals_2, inst_2 = sep.separate('song.wav')

# Combine using ensemble algorithms
# audio-separator supports: avg_wave, median_wave, max_fft
```

**Manually in a DAW:**
1. Run each model separately
2. Import all vocal stems into DAW
3. Layer them, adjust levels
4. Use phase alignment if needed
5. Export the combined result

### Performance Cost

- 2 models = 2x processing time
- 3 models = 3x processing time
- Typical quality improvement: 0.5-1.5 dB SDR over single model
- Diminishing returns beyond 3 models

---

## 14. Audio Format Requirements

### Input Format Best Practices

| Factor | Recommendation | Why |
|--------|---------------|-----|
| **Format** | WAV or FLAC | Lossless preserves all information for the model |
| **Sample rate** | 44.1 kHz (native) | Most models trained on 44.1 kHz. Higher rates get downsampled internally |
| **Bit depth** | 24-bit or 32-bit float | More dynamic range = cleaner separation |
| **Channels** | Stereo | Models expect stereo input. Mono works but stereo gives better spatial separation |
| **Minimum quality** | 192 kbps MP3 | Below this, compression artifacts degrade separation quality |

### What Demucs Accepts

- MP3, WAV, FLAC, OGG, M4A, and most common audio formats
- Automatically resamples to 44.1 kHz internally
- Stereo or mono input (mono is converted to dual-mono)

### Output Formats

| Tool | Default Output | Options |
|------|---------------|---------|
| **Demucs** | WAV, 44.1 kHz, int16 | `--int24`, `--float32`, `--mp3` with bitrate control |
| **UVR5** | WAV, matches input sample rate | WAV, FLAC configurable |
| **audio-separator** | WAV | WAV, MP3, FLAC, configurable |

### Critical Rules

1. **Match sample rates throughout your chain.** If your AI generator outputs 48 kHz, either keep everything at 48 kHz or resample once at the start
2. **Never upsample MP3 to WAV and expect better separation.** The lossy compression damage is already done
3. **Export stems at 24-bit minimum** for DAW import - gives headroom for mixing
4. **Keep dithering OFF** on stem exports if you plan further processing
5. **Do not normalize** individual stems before import - normalize only on the master bus

### Optimal Pipeline for AI-Generated Tracks

```
AI Generator (Suno/ACE-Step/ElevenLabs)
  -> Export WAV 44.1kHz/24-bit
    -> Stem Separation (htdemucs_ft or RoFormer)
      -> Output WAV 44.1kHz/24-bit
        -> Import to DAW at 44.1kHz/24-bit project settings
          -> Mix, process, add vocals
            -> Export master WAV 44.1kHz/24-bit
              -> Final mastering (LANDR/Ozone)
                -> Distribution format (usually 44.1kHz/16-bit WAV or 320kbps MP3)
```

---

## Quick Decision Guide

| Situation | Tool | Command/Action |
|-----------|------|----------------|
| "I just need vocals out, fast" | Demucs CLI | `demucs --two-stems=vocals song.mp3` |
| "I need the best possible vocal isolation" | UVR5 | RoFormer + MDX-Net Voc_FT ensemble |
| "I need 4 clean stems for DAW remixing" | Demucs CLI | `demucs -n htdemucs_ft song.mp3` |
| "I want a GUI with lots of options" | UVR5 | Download from SourceForge, install models |
| "I need to process 100 songs automatically" | audio-separator | Python script with batch loop |
| "I'm building a web app with stem separation" | audio-separator | Docker + FastAPI wrapper |
| "I'm on Mac and want maximum speed" | Demucs-MLX | `demucs-mlx song.mp3` |
| "I need guitar/piano stems" | Demucs | `demucs -n htdemucs_6s song.mp3` (quality caveat) |
| "I want to make an AI cover" | Ultimate RVC | Full pipeline: UVR5 -> RVC v2 -> DAW |

---

## Sources

- [Demucs GitHub (Meta)](https://github.com/facebookresearch/demucs)
- [Demucs MLX Port - 12 Seconds on M4 Max](https://medium.com/@andradeolivier/i-ported-demucs-to-apple-silicon-it-separates-a-7-minute-song-in-12-seconds-6c4e5cffb5c3)
- [UVR5 GitHub](https://github.com/Anjok07/ultimatevocalremovergui)
- [audio-separator GitHub](https://github.com/nomadkaraoke/python-audio-separator)
- [BS-RoFormer GitHub](https://github.com/lucidrains/BS-RoFormer)
- [Mel-Band RoFormer Paper](https://arxiv.org/abs/2310.01809)
- [Mel-RoFormer for Vocal Separation Paper](https://arxiv.org/abs/2409.04702)
- [Music.AI Source Separation Benchmarks](https://music.ai/blog/research/source-separation-benchmarks/)
- [AudioShake Latest Models](https://www.audioshake.ai/post/latest-models-higher-quality-stems)
- [UVR Best Model Guide (Aug 2025)](https://vocalremover.cloud/blog/uvr-best-model-aug-2025)
- [Best Free Stem Separators 2026](https://rysupaudio.com/blogs/news/best-free-stem-separators-2026)
- [LALAL.AI Orion Architecture](https://www.lalal.ai/blog/orion-new-neural-network/)
- [AI Stem Splitter API Comparison 2026](https://dev.to/stevecase430/ai-stem-splitter-api-comparison-2026-stemsplit-vs-lalalai-vs-moises-with-benchmarks-372l)
- [DJ Software Stem Separation Benchmark 2026](https://dj.studio/blog/dj-software-stem-separation-benchmark)
- [Ultimate RVC GitHub](https://github.com/JackismyShephard/ultimate-rvc)
- [Kits.AI](https://www.kits.ai/)
- [MVSEP.com](https://mvsep.com/en)
- [11 Best LALAL.AI Alternatives 2026](https://aisongcreator.pro/blog/lalal-ai-alternatives)
- [LANDR AI Stem Splitters Guide](https://blog.landr.com/ai-stem-splitters/)
- [MusicTech Stem Separation Tools Test](https://musictech.com/guides/buyers-guide/best-stem-separation-tools/)
