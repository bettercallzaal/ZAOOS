# 328 - Open Source Music Generation Landscape 2026: Complete Model Directory

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Map every viable open-source alternative to Suno/ElevenLabs Music for music generation, with quality rankings, hardware requirements, licensing, and feature comparison

---

## Table of Contents

1. [Executive Summary & Rankings](#1-executive-summary--rankings)
2. [Tier 1: Production-Ready Models](#2-tier-1-production-ready-models)
3. [Tier 2: Usable but Limited](#3-tier-2-usable-but-limited)
4. [Tier 3: Research/Legacy](#4-tier-3-researchlegacy)
5. [Closed/Not-Open Models](#5-closednot-open-models)
6. [Feature Comparison Matrix](#6-feature-comparison-matrix)
7. [Hardware Requirements](#7-hardware-requirements)
8. [Mac M-Series Compatibility](#8-mac-m-series-compatibility)
9. [Licensing Deep Dive](#9-licensing-deep-dive)
10. [LoRA/Fine-Tuning Support](#10-lorafine-tuning-support)
11. [Inpainting & Section Editing](#11-inpainting--section-editing)
12. [Community Activity & Maintenance](#12-community-activity--maintenance)
13. [Recommendation for ZAO OS](#13-recommendation-for-zao-os)

---

## 1. Executive Summary & Rankings

### Quality Ranking (April 2026)

| Rank | Model | Vocals | Instrumentals | Overall | License | Active? |
|------|-------|--------|---------------|---------|---------|---------|
| 1 | **LeVo 2 (SongGeneration 2)** | 9/10 | 9/10 | 9/10 | Apache 2.0 | Yes |
| 2 | **ACE-Step 1.5 XL** | 7.5/10 | 8.5/10 | 8.5/10 | Apache 2.0 | Yes (very) |
| 3 | **HeartMuLa 3B** | 8/10 | 8/10 | 8/10 | Apache 2.0 | Yes |
| 4 | **DiffRhythm 2** | 7.5/10 | 8/10 | 7.5/10 | Apache 2.0 | Yes |
| 5 | **YuE** | 7/10 | 7/10 | 7/10 | Apache 2.0 | Moderate |
| 6 | **MusicGen (AudioCraft)** | No vocals | 7/10 | 6.5/10 | MIT | Stagnant |
| 7 | **Stable Audio Open** | No vocals | 6.5/10 | 6/10 | CC-BY-SA 4.0 | Low |
| 8 | **SongComposer** | Symbolic only | Symbolic only | 5/10 | Research | Low |
| 9 | **Riffusion** | No vocals | 5/10 | 4.5/10 | MIT | Dead |
| 10 | **Jukebox (OpenAI)** | 4/10 | 5/10 | 3.5/10 | MIT | Abandoned |

### The Headline

The open-source music generation landscape has exploded since late 2025. **Six models now generate full songs with vocals and lyrics.** The gap between open-source and commercial (Suno v5.5) has narrowed dramatically - LeVo 2 claims parity on several dimensions, and ACE-Step 1.5 XL beats Suno on standardized eval metrics while being free and local. The old guard (MusicGen, Jukebox, Riffusion) is largely irrelevant for full-song production.

---

## 2. Tier 1: Production-Ready Models

### ACE-Step 1.5 XL (ACE Studio + StepFun)

**The current king for local music generation.**

- **Released:** v1.5 Jan 28, 2026 / v1.5 XL Apr 2, 2026
- **Architecture:** Diffusion Transformer (DiT) + Language Model
- **Parameters:** 2B (standard) / 4B (XL)
- **License:** Apache 2.0 - full commercial use
- **GitHub:** [ace-step/ACE-Step-1.5](https://github.com/ace-step/ACE-Step-1.5) - 9,000+ stars, 1,000+ forks
- **Discord:** 12,000+ members

**Capabilities:**
- Full song with vocals + lyrics (50+ languages)
- Instrumental generation
- Cover generation (restyle existing tracks)
- Audio repainting (regenerate specific sections)
- Vocal-to-BGM conversion
- Up to 10 minutes per generation

**Quality:** Beats Suno on 11 standardized benchmark metrics. Vocals rated ~7.5/10 (good but not Suno-level emotionality). Instrumentals are strong at 8.5/10. Community consensus: "musicality is slightly lower than commercial for complex arrangements" but the gap is small and closing.

**Speed:** Under 2 seconds per song on A100, under 10 seconds on RTX 3090, 30-60 seconds on Apple M2 Pro.

**LoRA/Fine-Tuning:** Yes - LoRA and LoKr supported. Train on 8-20 songs. LoKr trains in ~15 minutes vs 2.5 hours for LoRA. This is a major differentiator.

**Inpainting:** Yes - "repaint" mode regenerates specific time windows.

**Mac M-Series:** Native support via MLX backend. Runs on M1 8GB (slow, INT8 quantized). Comfortable on M1/M2 Pro 16GB+. XL needs 20GB+.

**Ecosystem:** Largest community. VST3 plugin, ComfyUI nodes, Docker images, 8+ alternative UIs, DAW integration. See Doc 324 for full community project list.

**Why it matters for ZAO OS:** Already integrated (`src/app/api/music/generate/route.ts`). Apache 2.0 means zero IP risk. LoRA training lets artists develop personal styles.

---

### LeVo 2 / SongGeneration 2 (Tencent AI Lab)

**The highest quality open-source model - rivals commercial tools.**

- **Released:** March 1, 2026
- **Architecture:** Hybrid LLM-Diffusion (4B parameters)
- **License:** Apache 2.0
- **GitHub:** [tencent-ailab/SongGeneration](https://github.com/tencent-ailab/SongGeneration)
- **HuggingFace:** [tencent/SongGeneration](https://huggingface.co/tencent/SongGeneration)

**Capabilities:**
- Full song with vocals and lyrics
- Text-to-song and audio-prompted generation
- Multi-preference alignment (melody, arrangement, sound quality, structure)
- Fast variant available (full song in under 1 minute)

**Quality:** Evaluated by 20 music professionals across 6 dimensions (Overall Quality, Melody, Arrangement, Sound Quality-Instrument, Sound Quality-Vocal, Structure). "Comprehensively outperforms all existing open-source baselines and achieves generation quality that directly rivals top-tier closed-source commercial models." Phoneme Error Rate of 8.55% beats Suno v5 (12.4%) - meaning lyrics are more accurately rendered.

**Speed:** Standard model is slower. Fast variant generates a full song in under 1 minute.

**GPU:** Minimum 10GB VRAM for inference. Fast variant more accessible.

**Fine-Tuning:** Fine-tuning scripts included in the repo. Supports preference-based fine-tuning for specific dimensions (melody vs arrangement vs vocal quality).

**Mac M-Series:** Not explicitly documented. Likely works via PyTorch MPS but untested by community.

**Inpainting:** Not documented as a standalone feature.

**Why it matters:** Highest overall quality. If you need the best-sounding output and have a CUDA GPU, this is it. But ACE-Step wins on ecosystem, Mac support, and LoRA flexibility.

---

### HeartMuLa 3B (HeartMuLa Team)

**Best lyrics controllability of any open-source model.**

- **Released:** January 14, 2026
- **Architecture:** LLM-based music language model + HeartCodec (12.5 Hz)
- **Parameters:** 3B (open source) / 7B (internal, Suno-competitive)
- **License:** Apache 2.0
- **GitHub:** [HeartMuLa/heartlib](https://github.com/HeartMuLa/heartlib)
- **Paper:** [arXiv 2601.10547](https://arxiv.org/abs/2601.10547)

**Capabilities:**
- Lyrics-conditioned music generation (multilingual: EN, CN, JP, KR, ES)
- Fine-grained musical attribute control per section (intro, verse, chorus each get separate style prompts)
- Short-form background music for videos
- Lyric transcription (HeartTranscriptor)
- Audio-text alignment (HeartCLAP)

**Quality:** "Currently the best open-sourced model in terms of lyrics controllability and music quality" per their benchmarks. The internal 7B version "achieves comparable performance with Suno in terms of musicality, fidelity, and controllability" but only the 3B is publicly released.

**Speed:** Not prominently documented. Expect moderate generation times given the 3B size.

**Fine-Tuning:** Not yet documented for community use.

**Mac M-Series:** Not explicitly tested. Should work via PyTorch MPS.

**Why it matters:** If per-section style control and lyrics accuracy are your priority, HeartMuLa leads. The 7B model reportedly matches Suno but isn't public yet.

---

### DiffRhythm / DiffRhythm 2 (ASLP Lab)

**Fastest full-song generation. Non-autoregressive architecture.**

- **Released:** DiffRhythm early 2026 / DiffRhythm 2 mid-2026
- **Architecture:** Latent Diffusion (VAE + Diffusion Transformer)
- **License:** Apache 2.0
- **GitHub:** [ASLP-lab/DiffRhythm](https://github.com/ASLP-lab/DiffRhythm)

**Capabilities:**
- End-to-end full-song generation with vocals and instrumentals
- Sentence-level lyrics alignment
- Up to 4m45s (DiffRhythm 1) / 210 seconds (DiffRhythm 2)
- English and Chinese lyrics
- Non-autoregressive = generates entire song at once (not token-by-token)

**Quality:** "First open-source latent diffusion-based song generator." Vocals have good intelligibility. Perfect sync between vocals and accompaniment. DiffRhythm 2 "consistently outperforms existing open-source models in both subjective and objective evaluations."

**Speed:** Full song in ~10 seconds. This is dramatically faster than any other model.

**Training Data:** Trained on 1 million songs.

**Fine-Tuning:** Not documented for LoRA/community use.

**Mac M-Series:** Not explicitly documented. Diffusion models generally work on MPS.

**Why it matters:** If speed is critical (batch generation, real-time workflows), DiffRhythm is unmatched. 10 seconds per full song vs 2 seconds for ACE-Step's shorter clips.

---

## 3. Tier 2: Usable but Limited

### YuE (Multimodal Art Projection / MAP)

**First open-source lyrics-to-song model. Pioneer, now surpassed.**

- **Released:** January 28, 2025
- **Architecture:** Autoregressive LLM (7B s1 + 1B s2 stages)
- **License:** Apache 2.0
- **GitHub:** [multimodal-art-projection/YuE](https://github.com/multimodal-art-projection/YuE) - active community
- **Paper:** [arXiv 2503.08638](https://arxiv.org/abs/2503.08638)

**Capabilities:**
- Lyrics-to-song (full songs up to 5 minutes)
- Diverse genres, languages, vocal techniques
- Track-decoupled prediction (separate vocal + accompaniment tracks)
- Structural progressive conditioning for lyric alignment

**Quality:** "Matches or surpasses some proprietary systems in musicality and vocal agility" as of its Jan 2025 release. However, it has been surpassed by ACE-Step 1.5, LeVo 2, and HeartMuLa in 2026. Still produces respectable output.

**Speed:** Very slow. 30s of audio takes ~150 seconds on H800, ~360 seconds on RTX 4090. This is the model's biggest weakness.

**GPU Requirements:**
- Minimum: 24GB VRAM (generates up to 2 sessions)
- Full song (4+ sessions): 80GB VRAM (H800/A100) or multiple RTX 4090s
- Optimized "YuEGP" version: runs on <10GB VRAM GPUs

**Mac M-Series:** No official Apple Silicon support. The GPU-poor fork (YuEGP) might work on high-memory Macs but is untested.

**Fine-Tuning:** No LoRA support documented.

**Inpainting:** No.

**Why it matters:** Historical significance as the first open Suno alternative. Still usable if you have big GPUs. But for most users, ACE-Step or LeVo 2 are better choices in 2026.

---

### MusicGen / AudioCraft (Meta)

**The establishment player. Instrumental only, no vocals.**

- **Released:** MusicGen June 2023 / AudioCraft suite 2023-2024
- **Architecture:** Single-stage autoregressive transformer over EnCodec tokens
- **Parameters:** 300M (small), 1.5B (medium), 3.3B (large)
- **License:** MIT (code) / CC-BY-NC 4.0 (some model weights)
- **GitHub:** [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) - 22,000+ stars
- **Docs:** [facebookresearch.github.io/audiocraft](https://facebookresearch.github.io/audiocraft/)

**What's in the AudioCraft suite:**
- **MusicGen** - text/melody-conditioned music generation
- **AudioGen** - text-to-sound effects
- **EnCodec** - neural audio codec (used by many other models)
- **Multi-Band Diffusion** - audio enhancement decoder

**Capabilities:**
- Text-to-music (instrumental only - NO vocals/lyrics)
- Melody conditioning (hum/whistle a melody, get a full arrangement)
- Up to 30 seconds per generation (can be extended with tricks)
- Multi-Band Diffusion for higher quality decoding

**Quality:** Was state-of-the-art in 2023-2024. Still produces good instrumentals (7/10). But the lack of vocals makes it irrelevant for full-song production. "MusicGen hasn't had a significant update since 2024. The open-source gap is widening."

**Speed:** MusicGen-small is faster than realtime on A100. MusicGen-large is slower but better quality.

**GPU Requirements:**
- Small (300M): 4GB VRAM, runs on CPU
- Medium (1.5B): 8GB VRAM
- Large (3.3B): 16GB VRAM recommended

**Mac M-Series:** Community MLX port exists. Small model is faster than realtime on Apple Silicon. Large model is slower but produces notably better music. Works via PyTorch MPS natively.

**LoRA/Fine-Tuning:** Yes - [musicgen-dreamboothing](https://github.com/ylacombe/musicgen-dreamboothing) provides LoRA fine-tuning. 10GB VRAM, under 15 minutes on A100. Well-documented.

**Inpainting:** Via AIRGen (Parameter-Efficient Fine-Tuning of MusicGen). Research-grade, not plug-and-play.

**Licensing gotcha:** The MIT license covers code. Some model weights use CC-BY-NC 4.0 (non-commercial). Check each specific checkpoint.

**Why it matters:** Best option if you ONLY need instrumentals and want something battle-tested with a huge community. EnCodec is used as a building block by many newer models. But for full songs with vocals, look elsewhere.

---

### Stable Audio Open (Stability AI)

**Short-form audio/SFX, not full songs.**

- **Released:** Stable Audio Open 1.0 (June 2024) / Open Small (November 2025)
- **Architecture:** Diffusion-based latent model
- **Parameters:** 1.21B (standard) / 341M (Small)
- **License:** CC-BY-SA 4.0 (model) - ShareAlike clause restricts some commercial uses
- **GitHub:** Available on HuggingFace: [stabilityai/stable-audio-open-1.0](https://huggingface.co/stabilityai/stable-audio-open-1.0)

**Capabilities:**
- Text-to-audio (up to 47 seconds stereo at 44.1kHz)
- Best for: drum beats, instrument riffs, ambient sounds, foley, SFX, production elements
- Stable Audio Open Small: 11 seconds, runs on smartphones (Arm CPUs)

**What it CANNOT do:**
- No vocals or lyrics
- Not designed for full songs
- "Modest capabilities for instrumental music generation" vs strong SFX

**Quality:** 6.5/10 for music. Strong for sound design and production elements. Trained on 7,300 hours of CC-licensed audio. Cannot compete with ACE-Step or MusicGen for music.

**GPU Requirements:**
- Standard: 16GB VRAM
- Small: Runs on ARM CPUs (smartphones, Raspberry Pi)

**Mac M-Series:** Should work via PyTorch MPS. Small model runs on any device.

**Fine-Tuning:** Possible via standard diffusion fine-tuning techniques. Not as well-documented as MusicGen or ACE-Step.

**Commercial note:** CC-BY-SA 4.0 requires derivative works to use the same license (ShareAlike). This is more restrictive than Apache 2.0 or MIT.

**Why it matters:** Niche use case - sound design and production elements, not full songs. The Small variant running on phones is technically impressive but limited.

---

## 4. Tier 3: Research/Legacy

### Riffusion

**The OG spectrogram hack. Historically interesting, practically dead.**

- **Released:** December 2022 (viral moment)
- **Architecture:** Fine-tuned Stable Diffusion generating spectrograms converted to audio
- **License:** MIT
- **GitHub:** [riffusion/riffusion-hobby](https://github.com/riffusion/riffusion-hobby) (archived)

**Status in 2026:** Not actively developed. The team pivoted to a commercial platform (Producer.ai rebrand) which also failed. "Search data falling back toward 2023 lows by early 2026." Community says "the latest update killed what made the original tool work."

**Quality:** 4.5/10. No vocals. The spectrogram approach produces audio with inherent artifacts. Was impressive in 2022, completely outclassed now.

**Still relevant?** Only as a curiosity or educational tool demonstrating how image diffusion can generate audio. Not for production use.

---

### Jukebox (OpenAI)

**Ambitious 2020 research. Impractical for any real use.**

- **Released:** April 2020
- **Architecture:** VQ-VAE + autoregressive transformers (multi-scale)
- **Parameters:** 5B (largest)
- **License:** MIT
- **GitHub:** [openai/jukebox](https://github.com/openai/jukebox)

**The brutal reality:**
- **9 hours to render 1 minute of audio.** Not a typo.
- Vocals are "often hard to understand or slightly distorted"
- No larger musical structure (no repeating choruses)
- "Discernable noise" from downsampling/upsampling
- OpenAI abandoned it completely - no updates since 2020
- Requires massive GPU resources

**Quality:** 3.5/10. Was groundbreaking for 2020. Showed that neural nets could generate music with vocals. But the output quality and speed make it entirely impractical.

**Why it still matters:** Historical significance only. It proved the concept that led to Suno, ACE-Step, and the current generation of models.

---

### SongComposer (Shanghai AI Lab / InternLM)

**Symbolic music generation (MIDI-like), not audio.**

- **Released:** 2024
- **Architecture:** LLM based on InternLM2
- **License:** Free for academic research + commercial use
- **GitHub/HuggingFace:** [Mar2Ding/songcomposer_sft](https://huggingface.co/Mar2Ding/songcomposer_sft)
- **Paper:** [arXiv 2402.17645](https://arxiv.org/abs/2402.17645)

**What it does:** Generates symbolic lyrics AND melodies (as notation/MIDI, not audio). Lyric-to-melody, melody-to-lyric, song continuation, text-to-song. Outperforms GPT-4 on these symbolic tasks.

**What it doesn't do:** Does NOT generate audio. You need a separate synthesizer/renderer to hear anything. This is a composition tool, not a production tool.

**Dataset:** 280K songs with lyrics, 20K melodies, 8K paired lyrics+melodies (Chinese + English).

**Why it matters:** Useful as a songwriting aid (generate melody ideas, lyrics). Not a competitor to ACE-Step/Suno for audio output. Could be paired with other models - use SongComposer for composition, feed output to ACE-Step for rendering.

---

## 5. Closed/Not-Open Models

### MusicLM / MusicFX / Lyria (Google DeepMind)

**NOT open source. API-only or demo-only.**

- MusicLM (2023) was a research paper - weights never released
- Rebranded to **MusicFX** with a web UI via Google Labs
- **Lyria 2** is the latest iteration, currently in private beta
- **Lyria RealTime** announced for interactive music generation
- Community created unofficial PyTorch implementations ([lucidrains/musiclm-pytorch](https://github.com/lucidrains/musiclm-pytorch)) but these are reimplementations, not the actual Google model
- Free to use through Google Labs when available, but no downloadable weights, no local deployment, no API

**Bottom line:** Cannot self-host. Cannot fine-tune. Not open source. Ignore for ZAO OS purposes.

### Seed-Music (ByteDance)

**NOT fully open source. Platform-only.**

- Impressive technical paper with multimodal inputs (text, audio, scores)
- Vocal generation, singing voice synthesis, voice conversion
- Zero-shot singing voice conversion from 10 seconds of audio
- Available through ByteDance's platforms (seedmusic.app) but NOT as downloadable weights for local use
- The technical architecture (auto-regressive LM + diffusion rendering) influenced open-source models

**Bottom line:** Platform-only. Cannot self-host. Not a viable open-source option.

### Udio

**No open-source alternatives or reverse-engineered models exist.**

Udio is entirely proprietary. No leaked weights, no reverse-engineered clones. The UMG settlement (Oct 2025) made it a walled garden - you cannot even download your own creations. There are no Udio-specific open-source alternatives beyond the general-purpose models listed above.

---

## 6. Feature Comparison Matrix

| Feature | ACE-Step 1.5 XL | LeVo 2 | HeartMuLa 3B | DiffRhythm 2 | YuE | MusicGen | Stable Audio |
|---------|-----------------|--------|--------------|--------------|-----|----------|-------------|
| **Vocals/Lyrics** | Yes (50+ langs) | Yes | Yes (5 langs) | Yes (EN/CN) | Yes (multi) | No | No |
| **Instrumental** | Yes | Yes | Yes | Yes | Yes | Yes | SFX only |
| **Max Duration** | 10 min | Unknown | Unknown | 3.5 min | 5 min | 30 sec | 47 sec |
| **Generation Speed** | 2s (A100) | ~1 min (fast) | Moderate | ~10s | 150-360s | Real-time | Moderate |
| **LoRA/Fine-Tune** | Yes (LoRA+LoKr) | Yes (scripts) | Not yet | No | No | Yes (LoRA) | Limited |
| **Inpainting** | Yes (repaint) | No | No | No | No | Research | No |
| **Cover/Remix** | Yes | No | No | No | No | Melody cond. | No |
| **Voice Cloning** | Via LoRA | No | No | No | No | No | No |
| **Stem Export** | External | No | No | No | Dual track | No | No |
| **API** | Gradio + REST | HF Space | HF Space | HF Space | CLI | Transformers | HF diffusers |
| **VST3 Plugin** | Yes | No | No | No | No | No | No |
| **ComfyUI** | Yes (5+ packs) | No | No | No | No | Yes | Yes |
| **Docker** | Yes | No | No | No | Yes | Yes | Yes |

---

## 7. Hardware Requirements

### Minimum VRAM for Inference

| Model | Min VRAM | Recommended | Speed at Min | Speed at Rec |
|-------|----------|-------------|-------------|-------------|
| ACE-Step 1.5 (standard) | 4GB | 8-12GB | Slow, quantized | 10-30s/song |
| ACE-Step 1.5 XL | 16GB (offload) | 20-24GB | Slow | 2-10s/song |
| LeVo 2 | 10GB | 16-24GB | Moderate | <1 min/song |
| LeVo 2 Fast | 10GB | 16GB | Fast | <1 min/song |
| HeartMuLa 3B | ~8GB (est.) | 16GB | Moderate | Moderate |
| DiffRhythm | ~8GB (est.) | 12-16GB | Fast (~10s) | Very fast |
| YuE | 24GB | 80GB (H800/A100) | Very slow | Slow |
| YuE (YuEGP) | <10GB | 16GB | Slow | Slow |
| MusicGen Small | 4GB / CPU | 8GB | Real-time+ | Fast |
| MusicGen Large | 12GB | 16GB | Slow | Moderate |
| Stable Audio Open | 16GB | 16GB | Moderate | Moderate |
| Stable Audio Small | CPU (ARM) | Any | 8s for 11s audio | Fast |
| Jukebox | 16GB+ | Multiple GPUs | 9 hours/min | 9 hours/min |

### Training/Fine-Tuning VRAM

| Model | Min VRAM for Training | Training Time |
|-------|----------------------|---------------|
| ACE-Step LoKr | 12GB | ~15 min (23 songs) |
| ACE-Step LoRA | 20GB+ | ~2.5 hours (23 songs) |
| MusicGen LoRA | 10GB | ~15 min (A100) |
| LeVo 2 | 16GB+ | Scripts provided, times undocumented |

---

## 8. Mac M-Series Compatibility

| Model | Mac Support | Backend | Min Mac | Comfortable Mac | Notes |
|-------|------------|---------|---------|----------------|-------|
| **ACE-Step 1.5** | Native (official) | MLX | M1 8GB | M2 Pro 16GB+ | Auto-detects Apple Silicon, scripts provided |
| **ACE-Step 1.5 XL** | Yes (with offload) | MLX | M2 Max 32GB | M2 Ultra 64GB+ | XL needs more memory |
| **MusicGen** | Yes (community MLX port) | MLX/MPS | M1 8GB | M1 Pro 16GB+ | Small model faster than realtime |
| **Stable Audio Open** | Should work | MPS | M1 16GB | M2 Pro 16GB+ | Small variant runs on any ARM |
| **LeVo 2** | Untested | MPS (likely) | M2 Pro 16GB+ (est.) | M2 Max 32GB+ | No official Mac docs |
| **HeartMuLa** | Untested | MPS (likely) | M1 Pro 16GB (est.) | M2 Pro 16GB+ | No official Mac docs |
| **DiffRhythm** | Untested | MPS (likely) | M1 Pro 16GB (est.) | M2 Pro 16GB+ | No official Mac docs |
| **YuE** | Not supported | N/A | N/A | N/A | NVIDIA-focused, massive VRAM needs |
| **Jukebox** | No | N/A | N/A | N/A | Impractical on any hardware |

**Key takeaway:** ACE-Step is the only model with official, tested Mac M-series support including native MLX acceleration. MusicGen has a working community port. Everything else is "probably works via MPS but nobody's tested it."

---

## 9. Licensing Deep Dive

| Model | License | Commercial Use | Derivative Works | Patent Grant | Key Restriction |
|-------|---------|---------------|-----------------|-------------|----------------|
| **ACE-Step 1.5** | Apache 2.0 | Yes, full | Yes | Yes | None - own everything |
| **LeVo 2** | Apache 2.0 | Yes, full | Yes | Yes | None |
| **HeartMuLa** | Apache 2.0 | Yes, full | Yes | Yes | None |
| **DiffRhythm** | Apache 2.0 | Yes, full | Yes | Yes | None |
| **YuE** | Apache 2.0 | Yes, full | Yes | Yes | None |
| **MusicGen (code)** | MIT | Yes | Yes | No | No patent grant |
| **MusicGen (some weights)** | CC-BY-NC 4.0 | **NO** | Yes w/ attribution | No | Non-commercial only |
| **Stable Audio Open** | CC-BY-SA 4.0 | Yes, but ShareAlike | Must use same license | No | Derivatives must be CC-BY-SA |
| **Riffusion** | MIT | Yes | Yes | No | No patent grant |
| **Jukebox** | MIT | Yes | Yes | No | No patent grant |
| **SongComposer** | Research + Commercial | Yes | Yes | Unknown | Check specific terms |

**Safest for commercial music production:** Apache 2.0 models (ACE-Step, LeVo 2, HeartMuLa, DiffRhythm, YuE). These give you full ownership of generated output with explicit patent protection.

**Watch out for:** MusicGen's weight-specific licenses. Some checkpoints are CC-BY-NC (non-commercial only). Always check the specific model card on HuggingFace.

**Training data ethics:**
- ACE-Step: "Legally compliant data" - licensed, royalty-free, synthetic
- LeVo 2: Not explicitly documented
- MusicGen: 20,000 hours of Meta-owned or specifically licensed music
- Stable Audio Open: Creative Commons-licensed data only (7,300 hours)
- YuE: Scaled to trillions of tokens, training data composition not fully disclosed

---

## 10. LoRA/Fine-Tuning Support

### Models with Production-Ready Fine-Tuning

**ACE-Step 1.5** - The gold standard for open-source music fine-tuning:
- LoRA and LoKr supported (LoKr recommended - 10x faster)
- 8-20 reference tracks needed
- LoKr: ~15 minutes training on H200
- LoRA: ~2.5 hours on H200
- LoRA scale is adjustable (0-100%, sweet spot 30-60%)
- Community toolkit Side-Step offers CLI workflow
- ComfyUI training pipeline available
- Detailed documentation and tutorials
- Works on 12GB+ VRAM for training

**MusicGen** - Well-documented LoRA via dreamboothing:
- [musicgen-dreamboothing](https://github.com/ylacombe/musicgen-dreamboothing)
- 10-16GB VRAM for training
- Under 15 minutes on A100
- Optimizations: LoRA + half-precision + gradient checkpointing

**LeVo 2** - Fine-tuning scripts included:
- Preference-based fine-tuning (tune for melody vs arrangement vs vocals)
- GPU requirements for training not well documented
- Less community documentation than ACE-Step

### Models Without Fine-Tuning Support

- HeartMuLa: Not yet documented
- DiffRhythm: No
- YuE: No
- Stable Audio Open: Theoretically possible via standard diffusion techniques, poorly documented
- Riffusion/Jukebox: N/A

---

## 11. Inpainting & Section Editing

**Which models can regenerate specific sections without starting over?**

| Model | Inpainting | How It Works |
|-------|-----------|-------------|
| **ACE-Step 1.5** | Yes - "Repaint" mode | Specify time window to regenerate. Maintains context from surrounding audio. |
| **MusicGen (AIRGen)** | Research-grade | Academic paper showing arrangement, inpainting, refinement via PEFT. Not plug-and-play. |
| **All others** | No | Must regenerate entire track. |

ACE-Step's repaint feature is the only production-ready inpainting in the open-source world. This is a significant advantage for iterative music production workflows.

For reference, commercial tools with inpainting: Suno Studio, Udio (disabled), ElevenLabs Music API.

---

## 12. Community Activity & Maintenance

### Most Active (April 2026)

1. **ACE-Step** - 9,000+ stars, 143 open issues (actively triaged), 12,000+ Discord members, weekly updates, massive third-party ecosystem (8+ UIs, VST3, ComfyUI, Docker). The clear community leader.

2. **LeVo 2 / SongGeneration** - Active development by Tencent AI Lab. Regular releases. Growing HuggingFace community. Less third-party ecosystem than ACE-Step.

3. **HeartMuLa** - Active releases (latest: January 2026). Growing community. Less mature ecosystem.

4. **DiffRhythm** - Active research with DiffRhythm 2 and DiffRhythm+ papers. Academic-oriented.

### Moderate

5. **YuE** - Community forks active (YuEGP for GPU-poor). Main repo maintained but slower cadence.

6. **MusicGen/AudioCraft** - 22,000+ stars but **stagnant since 2024**. No significant updates. Meta appears to have moved on. Community maintains forks and tools.

### Dead/Abandoned

7. **Stable Audio Open** - Last significant release Nov 2025 (Small variant). Stability AI's focus is on commercial Stable Audio 2.5.

8. **Riffusion** - Archived. Team pivoted to commercial platform.

9. **Jukebox** - Abandoned since 2020.

10. **SongComposer** - Academic project, minimal ongoing development.

---

## 13. Recommendation for ZAO OS

### Current State

ZAO OS already has ACE-Step integrated. This was the right choice. The April 2026 landscape confirms it.

### Upgrade Priority

1. **Keep ACE-Step as primary** - Upgrade from HuggingFace Space to local/dedicated hosting when ready. Extend duration cap from 120s to 600s. Add XL model option. Enable LoRA training for ZAO artists.

2. **Watch LeVo 2** - Highest quality output. Consider adding as a second backend when Mac support is confirmed or for server-side generation. The quality delta on vocals is real.

3. **Ignore MusicGen, Stable Audio, Riffusion, Jukebox** - These are the past. The vocal-capable models have leapfrogged them.

4. **Monitor HeartMuLa's 7B release** - If/when the 7B model drops publicly, it could be the quality leader.

5. **DiffRhythm for batch workflows** - 10 seconds per full song makes it ideal for AI radio, background generation, or "generate 50 versions and pick the best" workflows.

### The Stack for Maximum Quality (Zero Cost)

```
Composition:    SongComposer (lyrics + melody ideas)
Generation:     ACE-Step 1.5 XL (primary) + LeVo 2 (when highest quality needed)
Voice Cloning:  ACE-Step LoRA (train on your voice) + RVC/GPT-SoVITS (free)
Stem Separation: Demucs v4 or UVR5 (free, open source)
Mastering:      Match EQ in DAW (Logic Pro built-in AI tools)
Total cost:     $0
```

### What Changed Since Doc 319/324

- LeVo 2 emerged as the quality leader (March 2026)
- HeartMuLa proved per-section style control is possible in open source
- DiffRhythm showed non-autoregressive generation is viable and fast
- MusicGen confirmed stagnant - Meta isn't investing
- Stable Audio confirmed niche (SFX only)
- The "open source can't do vocals" era is definitively over

---

## Sources

- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [ACE-Step 1.5 XL Release (GIGAZINE)](https://gigazine.net/gsc_news/en/20260409-ace-step-1-5-xl/)
- [LeVo 2 / SongGeneration GitHub](https://github.com/tencent-ailab/SongGeneration)
- [LeVo 2 HuggingFace](https://huggingface.co/tencent/SongGeneration)
- [LeVo 2 First Open-Source Model Rivaling Commercial (CyberNative)](https://cybernative.ai/t/levo-2-the-first-open-source-model-that-actually-rivals-commercial-song-generation/36220)
- [HeartMuLa GitHub](https://github.com/HeartMuLa/heartlib)
- [HeartMuLa Paper (arXiv 2601.10547)](https://arxiv.org/abs/2601.10547)
- [HeartMuLa 2026 Overview (AIBit)](https://aibit.im/blog/post/heartmula-open-source-music-generation-models-2026)
- [DiffRhythm GitHub](https://github.com/ASLP-lab/DiffRhythm)
- [DiffRhythm HuggingFace Blog](https://huggingface.co/blog/Dzkaka/diffrhythm-open-source-ai-music-generator)
- [DiffRhythm 2 Paper (OpenReview)](https://openreview.net/forum?id=EzHOmjg3R6)
- [YuE GitHub](https://github.com/multimodal-art-projection/YuE)
- [YuE Paper (arXiv 2503.08638)](https://arxiv.org/abs/2503.08638)
- [YuE GPU-Poor Fork (YuEGP)](https://github.com/deepbeepmeep/YuEGP)
- [AudioCraft / MusicGen GitHub](https://github.com/facebookresearch/audiocraft)
- [MusicGen Documentation](https://facebookresearch.github.io/audiocraft/docs/MUSICGEN.html)
- [MusicGen LoRA Fine-Tuning](https://github.com/ylacombe/musicgen-dreamboothing)
- [MusicGen MLX Port (Medium)](https://medium.com/@andradeolivier/i-ported-musicgen-to-apple-silicon-generate-music-from-text-on-your-macbook-9eaf95992053)
- [Stable Audio Open (HuggingFace)](https://huggingface.co/stabilityai/stable-audio-open-1.0)
- [Stable Audio Open Small (TechCrunch)](https://techcrunch.com/2025/05/14/stability-ai-releases-an-audio-generating-model-that-can-run-on-smartphones/)
- [Riffusion GitHub (archived)](https://github.com/riffusion/riffusion-hobby)
- [Riffusion Review 2026 (Tools for Humans)](https://www.toolsforhumans.ai/ai-tools/riffusion)
- [Jukebox (OpenAI)](https://openai.com/index/jukebox/)
- [SongComposer Paper (arXiv 2402.17645)](https://arxiv.org/abs/2402.17645)
- [SongComposer HuggingFace](https://huggingface.co/Mar2Ding/songcomposer_sft)
- [Seed-Music (ByteDance)](https://seed.bytedance.com/en/seed-music)
- [Google Lyria RealTime](https://magenta.withgoogle.com/lyria-realtime)
- [MusicLM PyTorch Reimplementation](https://github.com/lucidrains/musiclm-pytorch)
- [Best Open Source Music Generation Models 2026 (SiliconFlow)](https://www.siliconflow.com/articles/en/best-open-source-music-generation-models)
- [Best AI Music Models Ranked 2026 (Apiframe)](https://apiframe.ai/rankings/best-ai-music-model)
- [Best Offline AI Music Makers 2026 (MusicMaker.IM)](https://musicmaker.im/blog/detail/Best-Offline-AI-Music-Makers-2026-What-Runs-Locally-What-Doesn-t-and-Easier-Alternatives-d0a83d140e9f/)
- [10 Open Source AI Music Generators (EaseUS)](https://vocalremover.easeus.com/ai-article/open-source-ai-music-generator.html)
- [AIRGen - MusicGen Inpainting (arXiv)](https://arxiv.org/abs/2402.09508)
- [Go-Compose macOS Music Generation](https://www.macosaudio.com/2026/04/solidersound-releases-go-compose-ai-music-generation-app/)
