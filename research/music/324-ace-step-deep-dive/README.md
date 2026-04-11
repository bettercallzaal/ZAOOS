# 324 - ACE-Step Deep Dive: Getting the Most Out of AI Music Generation

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Comprehensive reference for ACE-Step AI music generation - versions, LoRA training, local deployment, prompting, quality optimization, community ecosystem

---

## 1. Version History: v1.0 -> v1.5 -> v1.5 XL

| Version | Release Date | DiT Size | Key Changes |
|---------|-------------|----------|-------------|
| **v1.0** | Late 2025 | 3.5B | Original release. Text-to-music foundation model. Apache 2.0 license. |
| **v1.5** | 2026-01-28 | 2B (standard) | Rebuilt architecture. Faster inference (under 2s on A100). LoRA/LoKr training. 50+ language support. Cover generation, repainting, vocal-to-BGM. |
| **v1.5 XL** | 2026-04-02 | 4B | Higher audio quality. Best scores across all 11 benchmark metrics. Surpasses all commercial and open-source models on standardized evals. Requires more VRAM. |

### Model Variants (v1.5)

**Standard (2B DiT):**
- `acestep-v15-base` - pre-training checkpoint
- `acestep-v15-sft` - supervised fine-tuned (best quality)
- `acestep-v15-turbo` - 8 diffusion steps (fastest, slight quality trade-off)

**XL (4B DiT):**
- `acestep-v15-xl-base`
- `acestep-v15-xl-sft` - highest quality available
- `acestep-v15-xl-turbo` - fast XL variant

**Language Models (separate from DiT):**
- `acestep-5Hz-lm-0.6B` - lightweight, runs on low VRAM
- `acestep-5Hz-lm-1.7B` - balanced
- `acestep-5Hz-lm-4B` - best prompt understanding, needs 20GB+ VRAM

**No v2 announced.** The XL series is the latest evolution. The team (ACE Studio + StepFun) appears focused on improving v1.5 rather than a major version bump.

### GitHub Stats (April 2026)
- 9,000+ stars, 1,000+ forks
- 143 open issues, very active development
- Discord: 12,000+ members

---

## 2. LoRA Fine-Tuning: Train Your Own Style

### How Much Audio Do You Need?

- **Minimum:** 8 songs (the guide says "a few songs")
- **Recommended:** 8-20 reference tracks for best style capture
- **Sweet spot:** ~13-23 songs for a well-defined style
- **Training time:** ~2.5 hours on H200 for 23 songs. LoKr reduces this to ~15 minutes.

### Data Preparation

Each song needs:
```
dataset/
  song1.mp3          # Audio file (mp3/wav/flac/ogg/opus)
  song1.lyrics.txt   # Timestamped or plain lyrics
  song1.json         # Optional: BPM, key, caption, language
  song2.mp3
  song2.lyrics.txt
  ...
```

**Getting lyrics:**
- `acestep-transcriber` (self-hosted, free, may have errors)
- Whisper (OpenAI ASR)
- ElevenLabs Scribe API (generous free tier)
- Gemini (paid API, accurate)

**Critical:** Transcribed lyrics MUST be manually reviewed and corrected. Errors degrade training quality significantly.

**BPM/Key detection:** Use [Key-BPM-Finder](https://vocalremover.org/key-bpm-finder) - upload audio, export CSV. Do NOT use the LM model for BPM/key - it hallucinates these values.

### Annotation Format

```json
{
  "caption": "A high-energy J-pop track with synthesizer leads and fast tempo",
  "bpm": 190,
  "keyscale": "D major",
  "timesignature": "4",
  "language": "ja"
}
```

### Training: LoRA vs LoKr

**LoKr is recommended - 10x faster with no quality loss.**

| Parameter | LoRA | LoKr (recommended) |
|-----------|------|---------------------|
| Learning rate | 1e-4 | 0.03 |
| Epochs | 10 | 500 |
| Training time (23 songs) | ~2.5 hours | ~15 minutes |
| lokr_linear_dim | N/A | 64 |
| lokr_linear_alpha | N/A | 128 (2x dim) |
| lokr_factor | N/A | -1 (auto) |
| lokr_weight_decompose | N/A | true (DoRA mode) |
| Batch size | 1 | 1 |
| Gradient accumulation | 4 | 4 |

### Training via CLI (LoKr)

```bash
curl -X POST http://localhost:8001/v1/training/start_lokr \
  -H 'Content-Type: application/json' \
  -d '{
    "tensor_dir": "/path/to/preprocessed/tensors",
    "output_dir": "./lokr_output",
    "lokr_linear_dim": 64,
    "lokr_linear_alpha": 128,
    "lokr_factor": -1,
    "lokr_weight_decompose": true,
    "learning_rate": 0.03,
    "train_epochs": 500,
    "train_batch_size": 1,
    "gradient_accumulation": 4,
    "save_every_n_epochs": 5
  }'
```

### Training Workflow

1. Launch Gradio UI (or use CLI)
2. Scan dataset directory
3. Review entries - check lyrics, duration, labels
4. Auto-label if captions are missing (use LM for captions only, NOT BPM/key)
5. Generate tensors (preprocessing step)
6. **Restart Gradio to free VRAM** - do not load LM model
7. Start training (LoKr recommended)
8. Monitor loss curve
9. Load trained weights in Gradio UI, set LoRA scale 0-100%

### Gotchas

- Restart Gradio multiple times during preprocessing to free VRAM
- Never use LM to generate BPM/key values (hallucinations)
- Manual lyrics review is non-negotiable
- For LoKr, set `lokr_weight_decompose: true` for best results
- Community toolkit [Side-Step](https://github.com/koda-dernet/Side-Step) offers CLI workflow with corrected timestep sampling

---

## 3. Running ACE-Step Locally on Mac (M-series)

### Yes, it works natively on Apple Silicon.

The macOS launch scripts automatically configure:
- `ACESTEP_LM_BACKEND=mlx` (Apple's Metal-optimized ML framework)
- `--backend mlx` flag for native acceleration

### VRAM Requirements by Model

| Your Mac | Unified Memory | What You Can Run | Max Duration |
|----------|---------------|-----------------|-------------|
| M1/M2 (8GB) | 8GB | Standard DiT only, no LM, INT8 quantized | 6 min |
| M1/M2 Pro (16GB) | 16GB | Standard DiT + 0.6B or 1.7B LM | 10 min |
| M1/M2 Max (32GB) | 32GB | Standard DiT + any LM, XL with offload | 10 min |
| M2/M3 Ultra (64GB+) | 64GB+ | Everything, including XL without offload | 10 min |

### Tier System

| VRAM | Tier | XL Support | Available LMs |
|------|------|-----------|---------------|
| 4GB or less | Tier 1 | No | None |
| 4-6GB | Tier 2 | No | None |
| 6-8GB | Tier 3 | No | 0.6B |
| 8-12GB | Tier 4 | No | 0.6B |
| 12-16GB | Tier 5 | Marginal | 0.6B, 1.7B |
| 16-20GB | Tier 6a | With offload | 0.6B, 1.7B |
| 20-24GB | Tier 6b | Full | 0.6B, 1.7B, 4B |
| 24GB+ | Unlimited | Full | All |

### Performance on Apple Silicon

Generation speed is slower than NVIDIA GPUs but perfectly usable:
- NVIDIA A100: under 2 seconds per song
- NVIDIA RTX 3090: under 10 seconds
- Apple M2 Pro (16GB): ~30-60 seconds (estimated, community reports vary)
- Apple M1 (8GB): ~2-3 minutes with INT8 quantization

### Installation on Mac

```bash
git clone https://github.com/ace-step/ACE-Step-1.5
cd ACE-Step-1.5
# macOS scripts auto-detect Apple Silicon
./scripts/run_macos.sh
```

Models download on first run. The Gradio UI adapts to detected VRAM tier automatically.

---

## 4. Complete Tag System

### Structure Tags (Meta Tags in Lyrics)

These go in the **lyrics field**, not the prompt/tags field:

| Tag | Purpose | Energy Level |
|-----|---------|-------------|
| `[Intro]` | Opening, establish atmosphere | Low-Medium |
| `[Verse]` / `[Verse 1]` | Narrative progression | Medium |
| `[Pre-Chorus]` | Build tension before chorus | Rising |
| `[Chorus]` | Emotional climax, hook | High |
| `[Bridge]` | Contrast, different melody/feel | Variable |
| `[Outro]` | Wind-down, conclusion | Falling |
| `[Instrumental]` | No vocals, instruments only | Variable |
| `[Build]` | Energy gradually rising | Rising |
| `[Drop]` | Electronic music energy release | Peak |
| `[Breakdown]` | Reduced instrumentation, space | Low |

### Performance Modifiers

Combine with structure tags for finer control:

- `[Chorus - anthemic]` - big, singalong energy
- `[Verse - whispered]` - intimate, quiet delivery
- `[Bridge - soaring]` - building, epic feel
- `[Verse - spoken word]` - rap/spoken delivery
- `[Chorus - harmonized]` - layered vocal harmonies

### Vocal Notation in Lyrics

- **UPPERCASE** words = shouted/emphasized
- **(parentheses)** = background vocals or echoes
- `[instrumental]` or `[inst]` as sole lyrics content = fully instrumental track

### Example Structured Lyrics

```
[Intro]

[Verse 1]
Walking through the city lights tonight
Every sound becomes a melody
The rhythm of the streets beneath my feet
Is calling out to me

[Pre-Chorus]
Can you feel it rising?
Can you hear the sound?

[Chorus - anthemic]
WE ARE the music makers
We are the dreamers of dreams
(dreamers of dreams)

[Instrumental]

[Bridge - whispered]
In the silence between the notes
That's where the magic lives

[Chorus - anthemic]
WE ARE the music makers

[Outro]
```

---

## 5. Style/Genre Prompting Best Practices

### Prompt Structure (Tags Field)

Use 3-7 comma-separated descriptors in this order:
1. **Primary genre** (required)
2. **Secondary influence** (optional, for fusion)
3. **Mood/emotion** (1-2 descriptors)
4. **Key instruments** (2-3 specific instruments)
5. **Tempo** (BPM or descriptive)
6. **Production style** (optional)

### Genre Keywords That Work Well

**Electronic:** electronic, EDM, house, techno, trance, dubstep, drum and bass, synthwave, 80s synth pop, ambient electronic, chillwave, vaporwave, lo-fi electronic

**Hip-Hop/Rap:** hip-hop, trap, boom bap, lo-fi hip hop, cloud rap, drill, conscious hip-hop, old school hip-hop

**Rock:** rock, indie rock, alternative rock, punk rock, post-punk, grunge, psychedelic rock, classic rock, progressive rock, shoegaze, math rock

**Pop:** pop, indie pop, dream pop, synth pop, K-pop, J-pop, art pop, bedroom pop, electropop

**Jazz:** jazz, jazz ballad, smooth jazz, bebop, jazz fusion, nu jazz, acid jazz

**Classical/Orchestral:** cinematic orchestral, classical, neo-classical, chamber music, symphonic

**R&B/Soul:** R&B, neo soul, contemporary R&B, soul, funk, 70s funk

**Other:** lo-fi, ambient, folk, country, blues, reggae, bossa nova, Latin, Afrobeat, world music

### Mood Descriptors

**Positive:** uplifting, hopeful, warm, nostalgic, euphoric, dreamy, peaceful, joyful, playful
**Dark:** melancholic, brooding, dark, haunting, aggressive, intense, ominous
**Neutral:** ethereal, atmospheric, cinematic, intimate, mysterious, reflective, contemplative

### Instrument Keywords

acoustic guitar, electric guitar, distorted guitars, piano, synth pads, synth bass, 808 drums, drum machine, strings, soft strings, brass, saxophone, clavinet, organ, bass guitar, fingerpicked guitar, harpsichord, flute, violin, cello

### Production Style Tags

lo-fi, polished, live recording, bedroom pop, orchestral, studio quality, vintage, modern production, analog warmth, crisp drums, heavy reverb, dry mix

### Example Prompts

**Chill lo-fi:**
`lo-fi hip hop, nostalgic, warm, piano, vinyl crackle, mellow drums, 85 BPM`

**Epic cinematic:**
`cinematic orchestral, epic, slow tempo, strings, brass, emotional, building crescendo`

**Summer anthem:**
`pop, electronic, uplifting, warm synths, crisp drums, festival energy, 120 BPM`

**Jazz fusion:**
`jazz, electronic elements, smooth, late night, saxophone, synth pads`

**Indie rock:**
`indie rock, dreamy, reverb-heavy guitars, driving drums, melancholic, 130 BPM`

### Common Mistakes

- Contradictory genres: "ambient, metal" - pick one primary, one secondary
- Too many tags: more than 7 creates incoherent output
- Vague descriptions: "good music" - be specific about genre, mood, instruments
- Missing tempo: always include BPM or tempo descriptor for consistent results

### Lyrics-to-Duration Ratio

- **2-3 words per second** is the sweet spot
- ~90-140 words for a 47-second track
- Keep lines to 6-10 syllables for natural vocal fitting
- Add `[Instrumental]` sections to create breathing room and variety

---

## 6. ACE-Step vs Suno v5 vs ElevenLabs Music

### Quality Comparison

| Dimension | ACE-Step 1.5 XL | Suno v5 | ElevenLabs Music |
|-----------|----------------|---------|-----------------|
| **Overall quality** | 85/100 (beats Suno on eval metrics) | 90/100 (best vocals) | 80/100 (voice cloning edge) |
| **Vocals** | Good, improving | Best in class | Great with cloning |
| **Instrumentals** | Strong | Strong | Moderate |
| **Style adherence** | Good | Best | Good |
| **Lyric alignment** | Good (50+ languages) | Best | Good (32+ languages) |
| **Speed** | Under 2s (A100) / 10s (3090) | 30-60 seconds (cloud) | Cloud-dependent |
| **Max duration** | 10 minutes | 8 minutes | ~4 minutes |
| **Cost** | Free forever | $10-30/mo | Free (7 songs/day) |
| **Commercial rights** | Apache 2.0 (own everything) | Paid plans only | Licensed data model |
| **Local/offline** | Yes | No (cloud only) | No (cloud only) |
| **Fine-tuning** | LoRA/LoKr training | No | Voice cloning only |
| **Stems export** | Via LALAL.AI | Built-in | No |
| **API** | Yes (Gradio + REST) | No official (3rd party ~$19/mo) | Coming |

### Where ACE-Step Wins

1. **Freedom:** Apache 2.0 = own everything, no licensing concerns, no monthly fees
2. **Customization:** LoRA fine-tuning captures YOUR specific style from 8-20 songs
3. **Speed:** Under 2 seconds per song on good hardware
4. **Privacy:** Runs entirely locally, no data leaves your machine
5. **Duration:** 10-minute songs vs 4-8 minutes elsewhere
6. **Unlimited:** No credits, no daily limits, no subscription
7. **Developer-friendly:** Full API, ComfyUI nodes, VST3 plugin, Docker images

### Where ACE-Step Loses

1. **Vocal quality:** Suno v5 vocals still sound more human and emotionally nuanced
2. **Ease of use:** Suno/ElevenLabs are one-click; ACE-Step requires setup
3. **Voice cloning:** ElevenLabs clones from seconds of audio; ACE-Step requires LoRA training with multiple songs
4. **Musicality:** Community consensus is "musicality is much lower than commercial" for complex arrangements
5. **Polish:** Commercial services have better post-processing and mastering

### Verdict for ZAO OS

ACE-Step is the right choice for the built-in generator because:
- No per-generation cost at scale
- Apache 2.0 means no IP concerns for community-generated music
- LoRA training lets artists develop personal AI styles
- Can upgrade from HuggingFace Space to local/dedicated hosting for better experience

Use Suno v5 for "hero" tracks that need maximum vocal quality. Use ACE-Step for experimentation, iteration, and community creation.

---

## 7. Maximum Song Length and Extension

### Duration Limits

- **Supported range:** 10 seconds to 10 minutes (600 seconds)
- **GPU memory dependent:** 4GB = up to 6 min, 6GB+ = up to 10 min
- **Current ZAO OS integration:** 10-120 seconds (artificially limited in code)

### Extending Songs

ACE-Step has a "complete" task type that extends partial tracks:
- Specify instruments and style for the extension
- Known issue: continuity artifacts with unnatural transitions at extension points
- Best practice: generate full-length in one pass when possible

### ZAO OS Upgrade Opportunity

The current integration caps at 120 seconds. The model supports 600 seconds. To extend:

```typescript
// Current (route.ts line 13)
duration: z.number().min(10).max(120).default(30),

// Could be upgraded to:
duration: z.number().min(10).max(600).default(60),
```

This would require moving from the HuggingFace Space (which may have its own limits) to local/dedicated hosting.

---

## 8. Output Quality

### Technical Specifications

| Spec | Value |
|------|-------|
| **Sample rate** | 48,000 Hz (48kHz) |
| **Channels** | Stereo |
| **Primary format** | FLAC (lossless) |
| **Bit depth** | Float32 internally |
| **Tensor format** | `[channels, samples]` on CPU |

### Quality Settings

| Parameter | Default | Effect |
|-----------|---------|--------|
| `inference_steps` | 8 (turbo) / 50+ (base) | More steps = better quality, slower |
| `guidance_scale` | 7.0 | Higher = stronger prompt adherence |
| `shift` | 1.0 | Timestep shift for turbo acceleration |
| `lm_temperature` | 0.85 | LM reasoning variability |

### Quality Tiers

- **Turbo (8 steps):** Fastest, good for iteration. Used in current ZAO OS integration.
- **SFT (50 steps):** Best quality, slower. Use for final renders.
- **XL SFT:** Highest quality available. Requires 20GB+ VRAM.

---

## 9. Community Projects Built on ACE-Step

### Alternative UIs (Suno-killers)

| Project | Description | URL |
|---------|-------------|-----|
| **ace-step-ui** | Spotify-inspired interface with audio editing | [GitHub](https://github.com/fspecii/ace-step-ui) |
| **ace-step-studio** | Suno-style studio with lyrics generation | [GitHub](https://github.com/roblaughter/ace-step-studio) |
| **Tadpole Studio** | AI DJ, Radio, Library, Playlists | [GitHub](https://github.com/proximasan/tadpole-studio) |
| **Ace-Step-Wrangler** | DAW-inspired interface for musicians | [GitHub](https://github.com/tsondo/Ace-Step-Wrangler) |
| **Majik's Music Studio** | Native macOS/Linux desktop app with MLX | [GitHub](https://github.com/Majiks-Studio/majiks-music-studio) |
| **ProdIA-MAX** | Enhanced fork with AI chat + voice recording | [GitHub](https://github.com/ElWalki/ProdIA_Max-Ace-Step-UI_Ace-Step-v1.5) |
| **ACE-Step-RADIO** | Continuous streaming music generation | [GitHub](https://github.com/PasiKoodaa/ACE-Step-RADIO) |
| **Boppy** | Free web service, no install needed | [boppy.me](https://boppy.me) |

### DAW/Plugin Integration

| Project | Description | URL |
|---------|-------------|-----|
| **acestep.vst3** | Official VST3 plugin (JUCE 8 + GGML) | [GitHub](https://github.com/ace-step/acestep.vst3) |
| **acestep.cpp** | C++17 portable implementation (CPU/CUDA/Metal) | [GitHub](https://github.com/ServeurpersoCom/acestep.cpp) |
| **gary4juce** | VST3/AU supporting multiple music models | [GitHub](https://github.com/betweentwomidnights/gary4juce) |

### ComfyUI Nodes

| Project | Description |
|---------|-------------|
| **ACE-Step-ComfyUI** (official) | Text-to-music, cover/remix, repaint, LLM-powered |
| **ComfyUI-AceMusic** | 15-node workflow integration |
| **scromfyUI-AceStep** | 30+ specialized nodes with multi-API support |
| **ComfyUI-FL-AceStep-Training** | LoRA training pipeline in ComfyUI |

### Training Tools

| Project | Description |
|---------|-------------|
| **Side-Step** | Standalone LoRA/LoKr toolkit with interactive wizard |
| **Ace-Step-1.5-Dataset-Manager** | Qt/C++ dataset editor |

### Advanced

| Project | Description |
|---------|-------------|
| **StemForge** | Integrated workstation with stem separation + voice conversion |
| **Generative Radio** | Local AI radio with prompt generation |
| **TTS-WebUI** | Unified UI: ACE-Step + RVC + GPT-SoVITS + 20+ other models |
| **ace-step-1.5 Docker** | Pre-configured Docker image with REST API |

---

## 10. HuggingFace Space vs Local Deployment

### Current ZAO OS Setup: HuggingFace Space

```typescript
// Uses @gradio/client to connect to hosted Space
const client = await Client.connect('ACE-Step/Ace-Step-v1.5', { token: hfToken });
```

**Pros:** Zero infrastructure, no GPU costs, works immediately
**Cons:** Queue wait times (30s-2min), limited to Space's GPU, can't train LoRA, duration may be capped

### Local Deployment

**Pros:** No queue, full control, LoRA training, 10-min songs, batch generation, privacy
**Cons:** Requires GPU hardware, setup time, maintenance

### Quality Differences

The model weights are identical - same quality whether hosted or local. The differences are:
- **Speed:** Local is instant (no queue). Space can have 30s-2min queue.
- **Duration:** Local supports full 10 min. Space may cap lower.
- **Parameters:** Local gives full control over inference_steps, guidance_scale, etc.
- **Training:** Only possible locally.

### Recommended Migration Path for ZAO OS

1. **Now:** Keep HuggingFace Space for zero-cost experimentation
2. **When serious:** Deploy on a dedicated GPU server (DigitalOcean GPU droplet, Vast.ai, or RunPod)
3. **For LoRA training:** Need a machine with 20GB+ VRAM (RTX 3090/4090 or A100)

---

## 11. Combining ACE-Step with Voice Cloning

### The Pipeline

ACE-Step generates music with generic vocals. Voice cloning tools replace those vocals with a specific voice:

```
ACE-Step (generate song with vocals)
    -> Stem separation (LALAL.AI or Demucs) - isolate vocals + instrumentals
    -> Voice conversion (RVC or GPT-SoVITS) - convert vocals to target voice
    -> Remix (combine converted vocals + original instrumentals)
```

### Tools for Each Step

**Stem Separation:**
- LALAL.AI ($7.50/mo) - 6-stem, best quality
- Demucs (free, open source) - good quality
- Spleeter (free, Deezer) - decent, fast

**Voice Conversion:**
- RVC (Retrieval-based Voice Conversion) - open source, realistic
- GPT-SoVITS - 1 minute of voice data = good TTS/singing model
- OpenVoice - zero-shot voice cloning

**Unified Interface:**
[TTS-WebUI](https://github.com/rsxdalv/TTS-WebUI) combines ACE-Step, RVC, GPT-SoVITS, and 20+ other tools in one Gradio interface. This is the easiest way to build a voice cloning pipeline.

### Quality Expectations

- RVC voice conversion on ACE-Step vocals: 7/10 (artifacts present but usable)
- GPT-SoVITS on ACE-Step vocals: 7.5/10 (better for singing)
- ElevenLabs voice cloning (native): 9/10 (but separate platform, not ACE-Step)

---

## 12. License: Apache 2.0 - Full Commercial Use Confirmed

### The License

ACE-Step is licensed under **Apache License 2.0** (not MIT as Doc 319 incorrectly stated in some places - the confusion is because the original v1.0 used Apache 2.0, and v1.5 continues with Apache 2.0).

### What Apache 2.0 Allows

- **Commercial use:** Yes, fully. Sell generated music, use in products, monetize.
- **Modification:** Yes. Fork, modify, redistribute.
- **Distribution:** Yes. Include in proprietary software.
- **Patent grant:** Yes. Apache 2.0 includes explicit patent protection.
- **Sublicensing:** Allowed through distribution.

### What You Must Do

- Include the copyright notice and license text in distributions
- State any modifications you made to the code
- Include a NOTICE file if one exists

### What This Means for ZAO OS

- All music generated through the ACE-Step integration belongs to the creator
- No licensing fees or attribution required on generated audio
- The integration code itself must maintain the Apache 2.0 notice
- Community members can freely sell/distribute their AI-generated music
- No risk of takedowns or licensing disputes (unlike Suno/Udio which had copyright lawsuits)

### Training Data Ethics

ACE-Step is trained on "legally compliant data" - licensed, royalty-free, and synthetic music. This is a significant differentiator from Suno and Udio, which faced copyright lawsuits from major labels.

---

## 13. Community and Power User Tips

### Official Channels

- **Discord:** [discord.gg/PeWDxrkdj7](https://discord.gg/PeWDxrkdj7) (12,000+ members)
- **GitHub Discussions:** [ace-step/ACE-Step-1.5/discussions](https://github.com/ace-step/ACE-Step-1.5/discussions)
- **Technical Paper:** [arxiv.org/abs/2602.00744](https://arxiv.org/abs/2602.00744)
- **Awesome list:** [github.com/ace-step/awesome-ace-step](https://github.com/ace-step/awesome-ace-step)

### Power User Tips (from Discord, HN, GitHub)

1. **Tags = global control, structure tags = local control.** Think of tags as the "album style" and structure tags as the "track list."

2. **Generate 2-4 versions simultaneously.** Picking the best from batch is faster than perfecting one generation.

3. **Iterate on tags first, lyrics second.** Tags have more impact on overall sound than lyrics do.

4. **Short rhythmic phrases > long prose** for lyrics. The model fits vocals better to punchy 6-10 syllable lines.

5. **Use the SFT model for final renders, turbo for iteration.** The turbo model (8 steps) is for exploring ideas. Switch to SFT (50+ steps) for the keeper.

6. **LoRA scale is a slider, not a switch.** Start at 50% and adjust. Too high (>80%) can create artifacts. 30-60% often sounds most natural.

7. **Repaint > regenerate.** If only one section sounds off, repaint that 10-second window rather than regenerating the whole song.

8. **The 0.6B LM is usually sufficient.** Unless your prompts are complex multi-language compositions, the 1.7B and 4B LMs don't dramatically improve output.

9. **BPM in tags matters more than you think.** Always specify it. "120 BPM" gives radically different results than leaving it unspecified.

10. **For covers/remixes:** Audio Cover Strength slider - 0.3-0.5 for dramatic genre shifts, 0.5-0.7 for moderate changes, 0.7-0.9 for subtle adjustments.

11. **Vocals drowning out instruments?** Add "rich instrumentation" or list specific instruments in your tags to rebalance.

12. **The VST3 plugin (acestep.vst3) is real.** You can generate music directly inside your DAW. Built with JUCE 8 and GGML.

13. **ACE-Step-RADIO exists.** If you just want continuous AI-generated background music, this project streams infinitely.

---

## ZAO OS Integration Upgrade Roadmap

### Current State

- Route: `src/app/api/music/generate/route.ts` - Gradio client to HF Space
- UI: `src/components/music/AiMusicGenerator.tsx` - prompt, lyrics, genre pills, duration
- Config: Turbo mode (8 steps), euler scheduler, APG cfg, 10-120s duration
- Requires: `HF_TOKEN` env var

### Potential Improvements

1. **Extend duration cap** from 120s to 600s (requires dedicated hosting)
2. **Add model selector** - turbo vs SFT vs XL for quality tiers
3. **Add inference_steps slider** - let users trade speed for quality
4. **LoRA support** - load community or custom LoRA weights
5. **Batch generation** - generate 2-4 versions at once
6. **Save to library** - direct path from generation to SongSubmit
7. **Repaint mode** - regenerate specific sections of a generated track
8. **Cover mode** - upload a reference track and restyle it

---

## Sources

- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [ACE-Step v1.0 GitHub](https://github.com/ace-step/ACE-Step)
- [ACE-Step 1.5 Technical Paper (arXiv)](https://arxiv.org/abs/2602.00744)
- [ACE-Step 1.5 Complete Guide (DEV.to)](https://dev.to/czmilo/ace-step-15-the-complete-2026-guide-to-open-source-ai-music-generation-522e)
- [ACE-Step Musicians Guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)
- [ACE-Step LoRA Training Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/LoRA_Training_Tutorial.md)
- [ACE-Step GPU Compatibility](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/GPU_COMPATIBILITY.md)
- [ACE-Step Inference Docs](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INFERENCE.md)
- [Awesome ACE-Step](https://github.com/ace-step/awesome-ace-step)
- [ACE-Step Prompt Guide (Ambience AI)](https://www.ambienceai.com/tutorials/ace-step-music-prompting-guide)
- [ACE-Step vs Suno Benchmarks (Medium)](https://medium.com/@acemusic/meet-ace-step-1-5-an-on-device-music-model-that-beats-suno-on-common-eval-metrics-67ee61a1ce09)
- [ACE-Step 1.5 XL Release (GIGAZINE)](https://gigazine.net/gsc_news/en/20260409-ace-step-1-5-xl/)
- [ACE-Step HN Discussion](https://news.ycombinator.com/item?id=46948483)
- [TTS-WebUI (unified voice tools)](https://github.com/rsxdalv/TTS-WebUI)
- [ACE-Step ComfyUI](https://docs.comfy.org/tutorials/audio/ace-step/ace-step-v1)
- [DigitalOcean ACE-Step Tutorial](https://www.digitalocean.com/community/tutorials/ace-step-music-ai)
- [ACE-Step Discord](https://discord.gg/PeWDxrkdj7)
