# Doc 328 - Open Source Singing Voice Synthesis & Conversion Tools (April 2026)

**Context:** A musician wants an open source alternative to Kits.AI (now acquired by Splice, Jan 2026) for converting raw singing into a cloned voice. This doc surveys every major open source tool as of April 2026.

---

## Table of Contents

1. [GPT-SoVITS v4](#1-gpt-sovits-v4)
2. [RVC (Retrieval-based Voice Conversion)](#2-rvc-retrieval-based-voice-conversion)
3. [GPT-SoVITS vs RVC for Singing](#3-gpt-sovits-vs-rvc-head-to-head-for-singing)
4. [Training Requirements](#4-training-requirements)
5. [Mac M-Series / GPU Requirements](#5-hardware-requirements)
6. [DiffSinger](#6-diffsinger)
7. [DDSP-SVC](#7-ddsp-svc)
8. [So-VITS-SVC v4](#8-so-vits-svc-v4)
9. [OpenUtau](#9-openutau)
10. [NeuCoSVC](#10-neucosvc)
11. [Seed-VC](#11-seed-vc)
12. [SaMoye-SVC](#12-samoye-svc)
13. [Quality Ranking](#13-quality-ranking-of-all-tools)
14. [TTS-WebUI - Unified Interface](#14-tts-webui-unified-interface)
15. [Chaining with ACE-Step](#15-chaining-with-ace-step)
16. [Real-Time Singing Conversion](#16-real-time-singing-conversion)
17. [Voice Blending](#17-voice-blending)
18. [Commercial Use Licensing](#18-commercial-use-licensing)
19. [Recommendation for a Kits.AI Replacement](#19-recommendation)

---

## 1. GPT-SoVITS v4

**Repo:** https://github.com/RVC-Boss/GPT-SoVITS
**Stars:** 56,565 | **Forks:** 6,176 | **License:** MIT
**Last push:** Feb 2026 | **Status:** Actively maintained

### What It Is

GPT-SoVITS is a few-shot voice cloning and text-to-speech system created by RVC-Boss (the same developer behind RVC). It combines GPT-style language modeling with SoVITS (Variational Inference with adversarial learning for end-to-end Text-to-Speech) to achieve high-quality voice cloning with minimal data.

### How It Works

- **Zero-shot mode:** 5 seconds of reference audio for instant TTS
- **Few-shot mode:** Fine-tune with 1 minute of training data for much better similarity
- **Architecture (v3/v4):** Uses shortcut Conditional Flow Matching Diffusion Transformers (shortcut-CFM-DiT) with reference audio diffusion outpainting for timbre matching

### v4 Improvements Over v3

- Custom-trained vocoder replacing BigVGANv2 - fixes metallic artifacts from non-integer upsampling
- Native 48kHz output (v3 was 24kHz, needed post-processing super-resolution)
- WER (pronunciation accuracy): 0.017 (v2) -> 0.013 (v4)
- SIM (timbre similarity): 0.549 (v2) -> 0.735 (v4), approaching ground truth of 0.750
- Training data expanded to 7,000 hours with MOS-based quality filtering
- Best quality at 32 diffusion steps; zero-shot viable at 4-8 steps

### Singing Quality

**Important caveat:** GPT-SoVITS is primarily a TTS (text-to-speech) system, not a singing voice conversion system. The v3/v4 documentation makes no specific mention of singing support. It excels at cloning a speaking voice with incredible fidelity, but it is NOT designed for "input singing audio -> output in cloned voice" the way RVC or So-VITS-SVC are. For singing conversion specifically, RVC remains the better choice.

### Integrated Tools

- Voice/accompaniment separation (UVR5)
- Automatic training set segmentation
- Chinese ASR + text labeling
- WebUI for the full pipeline

---

## 2. RVC (Retrieval-based Voice Conversion)

**Repo:** https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
**Stars:** 35,177 | **Forks:** 4,972 | **License:** MIT
**Last push:** Nov 2024 | **Status:** Stable/maintenance mode (no major updates since late 2024, but works well)

### What It Is

RVC is the most popular open source voice conversion tool. It converts any voice input (singing or speaking) into a target voice while preserving the original pitch, timing, and expression. This is the closest direct replacement for Kits.AI.

### How It Works

1. Extracts HuBERT features from input audio (content representation)
2. Looks up nearest neighbors in an index built from training data (the "retrieval" part)
3. Mixes retrieved features back in during synthesis - this preserves the target singer's style
4. Uses a VITS-based vocoder to generate final audio

The retrieval step is what makes RVC special for singing - it pulls in the nuances and timbre details of the target voice from actual training examples rather than purely generating them.

### Why It Dominates for Singing

- Purpose-built for voice conversion (not TTS)
- Pitch tracking preserves melody perfectly
- The retrieval index captures vocal texture/timbre that pure neural models miss
- Huge community: 27,900+ pre-trained voice models available at voice-models.com
- Very fast inference
- Real-time conversion supported

---

## 3. GPT-SoVITS vs RVC Head-to-Head for Singing

| Aspect | GPT-SoVITS | RVC |
|--------|-----------|-----|
| **Primary purpose** | Text-to-speech / voice cloning | Voice-to-voice conversion |
| **Singing conversion** | Not its strength (TTS-focused) | Purpose-built for this |
| **Input** | Text + reference audio | Audio (singing/speaking) |
| **Output quality** | Excellent for speech | Excellent for singing |
| **Training data needed** | 1 min (few-shot) or 5 sec (zero-shot) | 3-10 minutes |
| **Real-time** | Yes (for TTS) | Yes |
| **Community models** | Growing | 27,900+ on voice-models.com |
| **Best for musician** | Generating spoken content in cloned voice | Converting raw singing to cloned voice |

**Bottom line:** For converting raw singing into a cloned voice (the Kits.AI use case), RVC is the right tool. GPT-SoVITS is for when you want to generate speech from text in someone's voice.

---

## 4. Training Requirements

### RVC

- **Minimum:** 3-5 minutes of clean audio
- **Recommended:** 10+ minutes for best quality
- **Format:** Mono WAV, 44.1kHz, 16-bit
- **Content:** Mix of singing AND speaking recommended to cover full vocal range
- **Quality:** Clean recordings, no background music/noise, varied pitch and dynamics
- **Training time:** ~20 min on RTX 3080 for 10 min of audio

### GPT-SoVITS

- **Zero-shot:** 3-10 seconds reference audio (WAV/MP3)
- **Few-shot:** 1 minute minimum, 5-30 minutes recommended
- **Training time:** ~78 sec (SoVITS, 8 epochs) + ~60 sec (GPT, 15 epochs) for 1 min audio on RTX 3080

### DiffSinger

- **Minimum:** 1-2 hours of singing with phoneme-level annotations
- **Recommended:** 3-5 hours for production quality
- **Format:** WAV + MIDI + phoneme labels (much more complex pipeline)

### DDSP-SVC

- **Minimum:** 5-10 minutes of clean singing
- **Format:** WAV, mono, 44.1kHz

### General Tips for Singing Data

- **Singing vs speaking:** For voice conversion (RVC, DDSP-SVC, So-VITS-SVC), singing audio produces better singing models. Speaking audio works but loses some vocal texture
- **Range coverage:** Record across the full singing range (low to high), varying dynamics (quiet to loud), different vowel sounds
- **Isolation:** Use Demucs or UVR5 to separate vocals from existing recordings if you don't have isolated vocals

---

## 5. Hardware Requirements

### GPU Requirements by Tool

| Tool | Minimum GPU | Recommended | Mac M-Series |
|------|------------|-------------|--------------|
| **RVC** | 4GB VRAM (GTX 1060) | 8GB+ (RTX 3070) | CPU only, slower |
| **GPT-SoVITS** | 4GB VRAM | 8GB+ | Inference works (RTF 0.526 on M4 CPU), training not recommended |
| **DiffSinger** | 6GB VRAM | 8GB+ | Not officially supported |
| **DDSP-SVC** | 4GB VRAM | 6GB+ | CPU possible |
| **So-VITS-SVC** | 6GB VRAM | 8GB+ | CPU possible, very slow |
| **Seed-VC** | 4GB VRAM | T4 or better | Not tested |
| **ACE-Step 1.5** | RTX 3090 | A100 | Supports Mac/AMD/Intel |

### Mac M-Series Specifics

- **GPT-SoVITS:** Inference on Mac CPU works. RTF (real-time factor) of 0.526 on M4 CPU, meaning it takes about half as long as the audio duration to generate. Training is NOT recommended on Mac - do preprocessing and inference only.
- **RVC:** Can run on Mac via CPU mode. Slower than GPU but usable for inference. Training is painful on CPU.
- **Recommendation:** For a Mac-based musician, use a cloud GPU (Google Colab, RunPod, Vast.ai) for training, then run inference locally on Mac. Or use the TTS-WebUI Docker image.

---

## 6. DiffSinger

**Repo:** https://github.com/openvpi/DiffSinger (OpenVPI community fork, actively maintained)
**Original:** https://github.com/MoonInTheRiver/DiffSinger (academic, less active)
**Stars:** 3,099 | **Forks:** 330 | **License:** Apache-2.0
**Last push:** March 2026 | **Status:** Actively maintained by OpenVPI

### What It Is

DiffSinger is a singing voice SYNTHESIS system (not conversion). It generates singing from scratch given a music score (lyrics + MIDI + timing), using diffusion-based generation. Think of it as an open source Vocaloid/Synthesizer V alternative.

### How It Works

Views mel-spectrogram generation as a diffusion process: starts from noise, iteratively denoises conditioned on the music score. Avoids over-smoothing and unstable GAN training issues.

### Quality

- 44.1kHz output (upgraded from original 24kHz)
- Variance models for pitch, energy, breathiness control
- High expressiveness and naturalness
- Outperforms prior SVS systems in MOS evaluations

### Key Difference from RVC

DiffSinger is NOT voice conversion. You don't feed it a singing recording - you feed it a score (notes, lyrics, timing) and it generates singing. It's for creating new vocal performances from notation, not converting existing performances.

### Relevance to the Kits.AI Use Case

Low relevance unless the musician wants to compose vocal parts from MIDI rather than convert their own singing. However, DiffSinger models trained on a specific voice can produce that voice singing from notation.

---

## 7. DDSP-SVC

**Repo:** https://github.com/yxlllc/DDSP-SVC
**Stars:** 2,527 | **Forks:** 282 | **License:** MIT
**Last push:** Feb 2026 | **Status:** Maintained but slow development

### What It Is

Real-time end-to-end singing voice conversion using Differentiable Digital Signal Processing. A lighter-weight alternative to RVC/So-VITS-SVC.

### Strengths

- Very lightweight - runs on lower-end hardware
- Real-time capable
- Good pitch tracking
- Clean output with fewer artifacts than So-VITS-SVC

### Weaknesses

- Less natural timbre than RVC
- Smaller community, fewer pre-trained models
- Quality ceiling lower than RVC for complex vocal timbres

### Still Relevant?

Yes, specifically for users with limited hardware. If you have a weaker GPU (4GB VRAM or less) or want real-time conversion with low latency, DDSP-SVC is a solid choice. For maximum quality, RVC is better.

---

## 8. So-VITS-SVC v4

**Repo:** https://github.com/svc-develop-team/so-vits-svc
**Stars:** 28,040 | **Forks:** 5,075 | **License:** AGPL-3.0
**Last push:** Nov 2023 | **Status:** ARCHIVED/DISCONTINUED

### What It Was

The predecessor to GPT-SoVITS and a contemporary of RVC. SoftVC VITS Singing Voice Conversion was one of the first high-quality open source singing voice converters.

### Why It Matters

- Historical significance - spawned the entire open source SVC ecosystem
- Many existing tutorials and models still reference it
- The fork at https://github.com/voicepaw/so-vits-svc-fork adds real-time support and a better interface

### Comparison to RVC

| Aspect | So-VITS-SVC | RVC |
|--------|------------|-----|
| **Quality** | Good | Better (retrieval index adds texture) |
| **Speed** | Slower | Faster |
| **GPU support** | Works on AMD | Nvidia preferred |
| **Ease of use** | Moderate | Easier |
| **Status** | Archived | Stable |
| **License** | AGPL-3.0 (copyleft!) | MIT (permissive) |

### Recommendation

Don't start new projects with So-VITS-SVC. Use RVC instead - it's better in every way and actively maintained.

---

## 9. OpenUtau

**Repo:** https://github.com/stakira/OpenUtau
**Stars:** 3,728 | **Forks:** 470 | **License:** MIT
**Last push:** March 2026 | **Status:** Actively maintained

### What It Is

An open source singing synthesis EDITOR - the successor to UTAU. It's a desktop application (Windows/Mac/Linux) where you compose vocal parts using a piano-roll interface, similar to Vocaloid or Synthesizer V.

### DiffSinger Integration

OpenUtau integrates DiffSinger as a rendering backend, meaning you can use DiffSinger AI voices within the OpenUtau editor. Features include:
- Voice color curves for gradual transitions between voice modes
- 50x rendering speedup by default (adjustable for quality)
- DirectML GPU acceleration on Windows

### Relevance to the Kits.AI Use Case

Low for voice conversion. OpenUtau is for COMPOSING vocal parts from notation, not converting existing singing. However, it's excellent if the musician wants to create vocal arrangements from scratch using AI voices.

---

## 10. NeuCoSVC

**Repo:** https://github.com/thuhcsi/NeuCoSVC
**Stars:** 296 | **Forks:** 43 | **License:** Not specified
**Last push:** May 2024 | **Status:** Academic project, not actively maintained

### What It Is

Neural Concatenative Singing Voice Conversion from Tsinghua University. Uses a novel approach: instead of pure neural generation, it concatenates segments from the reference audio based on nearest-neighbor matching of SSL (self-supervised learning) features.

### How It Works

1. SSL extractor condenses audio into fixed-dimensional features
2. Neural harmonic signal generator produces pitch information via linear time-varying filters
3. During inference, source SSL features are swapped with nearest matches from the reference audio pool
4. Waveform synthesizer reconstructs from SSL features + harmonic signals + loudness

### Upgraded to NeuCoSVC2

Includes expanded training data and a "Phoneme Hallucinator" for better results.

### Quality

Outperforms speaker-embedding approaches in one-shot SVC across intra-language, cross-language, and cross-domain tests. However, limited community adoption and no WebUI makes it impractical for musicians.

---

## 11. Seed-VC

**Repo:** https://github.com/Plachtaa/seed-vc
**Stars:** 3,673 | **Forks:** 464 | **License:** GPL-3.0
**Last push:** April 2025 | **Status:** ARCHIVED (Nov 2025)

### What It Is

Zero-shot voice conversion AND singing voice conversion with real-time support. No training needed - just provide a 1-30 second reference clip.

### Key Innovation

Despite being zero-shot (no training on the target voice), Seed-VC outperforms speaker-specific RVC v2 models in speaker similarity (SECS) and intelligibility (CER) in benchmarks. This is remarkable.

### Features

- Zero-shot: no training, just a reference clip
- Real-time: ~300ms algorithm delay + ~100ms device delay
- Singing SVC: F0 conditioning + gender-dependent pitch-shift
- Fine-tuning: minimum 1 utterance, 100 steps, 2 min on T4

### Why It Was Archived

The original repo was archived Nov 2025. Community forks exist (seed-vc2, seed-vc-custom) but development has slowed.

### Relevance

Very high if you want zero-shot (no training) singing conversion. The quality is impressive. But the archived status means no bug fixes or improvements going forward. Worth trying before committing to RVC's training pipeline.

---

## 12. SaMoye-SVC

**Repo:** https://github.com/CarlWangChina/SaMoye-SVC
**License:** Not specified
**Status:** Academic release

### What It Is

The first open source high-quality zero-shot SVC model. Can convert singing to human AND non-human timbres (e.g., animal voices). Trained on 1,815 hours of pure singing voice data across 6,367 speakers.

### Technical Approach

Disentangles singing features into content, timbre, and pitch. Uses multiple ASR models and compresses content features to reduce timbre leakage. Enhances timbre by mixing speaker embedding with top-3 similar speakers.

### Quality

Outperforms other models in zero-shot SVC tasks even under extreme conditions. However, limited practical documentation and setup guides compared to RVC.

---

## 13. Quality Ranking of All Tools

### For Singing Voice Conversion (the Kits.AI use case)

| Rank | Tool | Quality | Ease of Use | Training Needed | Best For |
|------|------|---------|-------------|-----------------|----------|
| 1 | **RVC v2** | 9/10 | 9/10 | 3-10 min audio | Best all-around for singing conversion |
| 2 | **Seed-VC** | 8.5/10 | 8/10 | None (zero-shot) | Quick conversion, no training |
| 3 | **SaMoye-SVC** | 8/10 | 4/10 | None (zero-shot) | Research-quality zero-shot |
| 4 | **DDSP-SVC** | 7/10 | 6/10 | 5-10 min audio | Low-end hardware, real-time |
| 5 | **So-VITS-SVC** | 7/10 | 5/10 | 10-30 min audio | Legacy, don't start new |
| 6 | **NeuCoSVC** | 7/10 | 3/10 | None (zero-shot) | Academic research only |
| 7 | **GPT-SoVITS v4** | 9.5/10 for speech | 7/10 | 1 min audio | TTS, not singing conversion |

### For Singing Voice Synthesis (from notation/MIDI)

| Rank | Tool | Quality | Ease of Use |
|------|------|---------|-------------|
| 1 | **DiffSinger + OpenUtau** | 9/10 | 7/10 |
| 2 | **ACE-Step 1.5** | 9/10 | 6/10 |

---

## 14. TTS-WebUI - Unified Interface

**Repo:** https://github.com/rsxdalv/TTS-WebUI
**Stars:** 3,078 | **Forks:** 311 | **License:** MIT
**Last push:** April 2026 | **Status:** Actively maintained

### What It Is

A single Gradio + React web interface that integrates 25+ audio AI models, including:
- **Voice:** GPT-SoVITS, RVC, CosyVoice, XTTSv2, Kokoro, OpenVoice, Bark, Tortoise, Piper TTS, DIA, Kimi Audio
- **Music:** ACE-Step, MusicGen, MAGNeT, Stable Audio, Riffusion
- **Audio tools:** Demucs (stem separation), Vocos, Whisper, Audio Separator

### Installation

Three methods:
1. **Installer (recommended):** Download package, run startup script (.bat Windows / .sh Mac/Linux)
2. **Manual:** Python 3.10-3.11, PyTorch, ffmpeg, optional NodeJS 22.9
3. **Docker:** `ghcr.io/rsxdalv/tts-webui:main`

### System Requirements

- Base install: ~10.7 GB
- Additional 2-8 GB per model loaded
- Python 3.10 or 3.11
- PyTorch + ffmpeg

### Why It Matters

One install gives you access to RVC for singing conversion, GPT-SoVITS for voice cloning, Demucs for stem separation, and ACE-Step for music generation. This is the closest thing to a unified open source audio AI workstation.

---

## 15. Chaining with ACE-Step

**ACE-Step 1.5 Repo:** https://github.com/ace-step/ACE-Step-1.5
**Stars:** 8,990 | **Forks:** 1,030 | **License:** MIT
**Last push:** April 2026 | **Status:** Very actively maintained

### What ACE-Step Does

ACE-Step is an open source music generation foundation model that generates full songs (vocals + instruments) from text prompts, with:
- Up to 4 minutes of music in <2 seconds on A100, <10 seconds on RTX 3090
- Voice cloning via speaker encoder (feed unaccompanied vocals)
- LoRA fine-tuning for specific vocal styles
- lyric2vocal, singing2accompaniment modes

### The Full Open Source Pipeline

You can chain these tools for a complete production pipeline:

1. **ACE-Step 1.5** - Generate the base track (instrumental + vocal melody) from a text prompt
2. **Demucs** - Separate the generated vocals from instruments
3. **RVC** - Convert the generated vocals to your target voice
4. **Merge** - Combine the voice-converted vocals back with the instrumental

Or starting from your own singing:

1. **Demucs** - Separate your raw recording into vocals + instruments
2. **RVC** - Convert your vocals to the target voice
3. **Merge** - Recombine

TTS-WebUI has both ACE-Step and RVC integrated, making this pipeline accessible from a single interface.

---

## 16. Real-Time Singing Conversion

### Available Options

| Tool | Latency | Quality | Status |
|------|---------|---------|--------|
| **RVC** | Low (~50-100ms with proper setup) | High | Active, most popular |
| **Seed-VC** | ~400ms (300 algorithm + 100 device) | High | Archived but works |
| **DDSP-SVC** | Very low | Medium | Maintained |
| **So-VITS-SVC Fork** | Medium | Good | Community maintained |

### RVC for Real-Time

RVC is the best option for real-time singing conversion. It's used by streamers, live performers, and in gaming. With a decent GPU (RTX 3060+), latency is under 100ms - imperceptible for most use cases.

### Practical Use Cases

- Live performance with voice transformation
- Streaming with a different voice
- Real-time monitoring while recording (hear the target voice while singing)

---

## 17. Voice Blending

### RVC Voice Blending

RVC has a built-in model merging feature in the "checkpoint processing" tab:

1. Select two voice model files (.pth)
2. Set weights (default 50/50, adjustable - e.g., 75/25)
3. Generate a merged model

**Male + female blending:** Works. Use pitch shift (+12 semitones male-to-female, -12 female-to-male) in combination with weight blending.

**Use cases:**
- Create unique hybrid voices that don't exist in real life
- Avoid copyright issues by blending multiple voices
- Create androgynous or otherworldly vocal textures

### Other Tools

- **So-VITS-SVC:** Model merging supported but more complex
- **GPT-SoVITS:** Not designed for model blending
- **Seed-VC:** Zero-shot, so you could blend by mixing reference audio clips

---

## 18. Commercial Use Licensing

| Tool | License | Commercial OK? | Notes |
|------|---------|---------------|-------|
| **RVC** | MIT | Yes | Most permissive |
| **GPT-SoVITS** | MIT | Yes | Most permissive |
| **DDSP-SVC** | MIT | Yes | Most permissive |
| **ACE-Step 1.5** | MIT | Yes | Most permissive |
| **DiffSinger** | Apache-2.0 | Yes | Permissive |
| **OpenUtau** | MIT | Yes | Most permissive |
| **TTS-WebUI** | MIT | Yes | Most permissive |
| **So-VITS-SVC** | AGPL-3.0 | Copyleft - risky | Must open source derivative works |
| **Seed-VC** | GPL-3.0 | Copyleft - risky | Must open source derivative works |
| **NeuCoSVC** | Unlicensed | Unclear | Contact authors |
| **SaMoye-SVC** | Unknown | Unclear | Contact authors |

### Important Legal Notes

- The software license is separate from the content rights. Even with MIT-licensed tools, you are responsible for:
  - Having rights to the voice you're cloning (consent of the voice owner)
  - Having rights to the input audio (cover songs, samples, etc.)
  - Complying with platform terms where you publish
- When posting AI-converted vocal content, best practice is to disclose the tools and source material used

---

## 19. Recommendation

### For a musician replacing Kits.AI:

**Primary tool: RVC v2**
- Closest equivalent to what Kits.AI offered
- MIT license, commercial use OK
- Train a model with 5-10 minutes of clean singing
- Huge community, tons of tutorials, 27,900+ pre-trained models
- Real-time conversion possible
- Voice blending built in

**Setup path:**
1. Install TTS-WebUI (gets you RVC + Demucs + ACE-Step in one package)
2. Separate vocals with Demucs
3. Train an RVC model on 5-10 min of target singing
4. Convert your singing to the target voice
5. Recombine with instrumental

**For zero-shot (no training):**
Try Seed-VC first - no training needed, just a reference clip. If quality isn't sufficient, fall back to RVC with training.

**For Mac M-series users:**
- Use cloud GPU (Colab/RunPod) for training
- Run inference locally - RVC and GPT-SoVITS both work on Mac CPU
- TTS-WebUI has a Docker option that simplifies Mac setup

**For the full pipeline (generation + conversion):**
ACE-Step 1.5 (generate music) -> Demucs (separate) -> RVC (convert voice) -> merge. All MIT-licensed, all integrated in TTS-WebUI.

---

## Sources

- [GPT-SoVITS GitHub](https://github.com/RVC-Boss/GPT-SoVITS)
- [GPT-SoVITS v3/v4 Features Wiki](https://github.com/RVC-Boss/GPT-SoVITS/wiki/GPT%E2%80%90SoVITS%E2%80%90v3v4%E2%80%90features-(%E6%96%B0%E7%89%B9%E6%80%A7))
- [RVC GitHub](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI)
- [DiffSinger (OpenVPI) GitHub](https://github.com/openvpi/DiffSinger)
- [DDSP-SVC GitHub](https://github.com/yxlllc/DDSP-SVC)
- [So-VITS-SVC GitHub](https://github.com/svc-develop-team/so-vits-svc)
- [OpenUtau GitHub](https://github.com/stakira/OpenUtau)
- [NeuCoSVC GitHub](https://github.com/thuhcsi/NeuCoSVC)
- [Seed-VC GitHub](https://github.com/Plachtaa/seed-vc)
- [SaMoye-SVC Paper](https://arxiv.org/html/2407.07728v4)
- [TTS-WebUI GitHub](https://github.com/rsxdalv/TTS-WebUI)
- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [GPT-SoVITS Mac Setup Guide](https://closex.medium.com/gpt-sovits-for-local-inference-on-intel-or-apple-silicon-mac-bc4c949dab55)
- [RVC Training Instructions Wiki](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/wiki/Instructions-and-tips-for-RVC-training)
- [SiliconFlow - Best Open Source Models for Singing Voice Synthesis 2026](https://www.siliconflow.com/articles/en/best-open-source-models-for-singing-voice-synthesis)
- [Sonarworks - Best AI Vocal Tools 2026](https://www.sonarworks.com/blog/learn/best-ai-vocal-tools-2025)
- [Voice Models Database](https://voice-models.com/)
- [State-of-the-art SVC Methods (Medium)](https://medium.com/qosmo-lab/state-of-the-art-singing-voice-conversion-methods-12f01b35405b)
- [RVC Voice Conversion Explained 2025](https://www.apatero.com/blog/rvc-retrieval-based-voice-conversion-explained-2025)
- [Seed-VC Real-Time Framework Analysis](https://www.blog.brightcoding.dev/2025/09/28/real-time-zero-shot-voice-conversion-and-cloning-inside-the-seed-vc-framework/)
