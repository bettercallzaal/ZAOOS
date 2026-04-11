# 329 - The $0 Music Production Stack: Idea to Distributed Song (April 2026)

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Every tool needed for an independent musician on Mac to go from idea to finished, distributed song spending $0 in software costs. Best open-source/free tool for each step.

---

## TL;DR - The Stack at a Glance

| Step | Recommended Tool | Mac M-series | Quality vs Paid | Setup |
|------|-----------------|-------------|----------------|-------|
| 1. Lyric Writing | Llama 3.1 (via Ollama) | Native | 80-90% of ChatGPT | Easy |
| 2. Music Generation | ACE-Step v1.5 XL | Native (MLX) | 85/100, beats Suno on eval metrics | Medium |
| 3. Singing Voice Synthesis | OpenUTAU + DiffSinger | Native (CoreML) | 75% of commercial VOCALOID | Medium |
| 4. Voice Cloning/Conversion | RVC (singing) / GPT-SoVITS (TTS) | Via Docker/Python | 70-75% of ElevenLabs | Hard |
| 5. Stem Separation | Demucs v4 (HTDemucs) | Native (MLX, 12s/song) | Matches or beats paid tools | Easy |
| 6. DAW | Ardour 9 (full DAW) / GarageBand (easy) | Both native | Ardour rivals pro DAWs now | Easy-Medium |
| 7. Mixing Plugins | TDR Nova + Kotelnikov + LoudMax | All AU native | 90% of paid equivalents | Easy |
| 8. Mastering | Matchering 2.0 | Via Docker/Python | 70% of LANDR (reference-based) | Medium |
| 9. Album Art | FLUX.1-schnell (Apache 2.0) | Via MLX/ComfyUI | 85% of Midjourney | Medium |
| 10. Distribution | RouteNote (free tier) | N/A (web) | Same stores, 85% royalties | Easy |
| 11. Music Video | Wan 2.5 | Via Python/CUDA | 60-70% of commercial (early) | Hard |
| 12. Hosting/Streaming | Navidrome | Any server | Excellent Spotify-like experience | Medium |

**Total software cost: $0.** Hardware cost: a Mac with 16GB+ unified memory gets you through 90% of this stack.

---

## 1. Lyric Writing - Local LLMs

### Recommended: Llama 3.1 8B via Ollama

**What it is:** Run Meta's Llama 3.1 (or Mistral, Qwen3, Gemma 2) locally on your Mac for lyric brainstorming, rhyme schemes, verse structure, concept development.

**Mac M-series compatibility:** Native. Ollama runs natively on Apple Silicon. The 8B model runs comfortably on 8GB RAM, 70B on 64GB+.

**Quality vs paid:** 80-90% of ChatGPT for creative writing tasks. Llama 3.1 excels at structured lyrics. Mistral generates more experimental/avant-garde content. For lyrics specifically, the gap to GPT-4 is smaller than for code or reasoning - creative writing is a strength of local models.

**Setup difficulty:** Easy. `brew install ollama && ollama pull llama3.1` and you're running.

**Dealbreaker limitations:** None for lyrics. Local models are excellent at creative text. They won't write a hit chorus on the first try, but neither will ChatGPT - lyrics are iterative.

**Alternatives:**
- **SongComposer** (research model) - specialized LLM for lyrics + melody simultaneously, outperforms GPT-4 on lyric-to-melody tasks
- **Qwen3 14B** - strong multilingual creative writing
- **Gemma 2 9B** - Google's model, surprisingly good at poetry/lyrics

**Pro tip:** Use Ollama with a system prompt like: "You are a songwriter specializing in [genre]. Write lyrics with [verse/chorus/bridge] structure, 6-10 syllables per line, with internal rhyme schemes." This constrains the output to be ACE-Step-compatible.

---

## 2. Music Generation - ACE-Step v1.5 XL

### Recommended: ACE-Step v1.5 XL (4B DiT)

**What it is:** The most powerful open-source music generation model. Text + lyrics in, full song (vocals + instrumentals) out. Apache 2.0 license - you own everything.

**Mac M-series compatibility:** Native. Uses MLX backend on Apple Silicon. Auto-detected by the macOS launch script.

| Your Mac | What You Can Run | Speed |
|----------|-----------------|-------|
| 8GB unified | Standard DiT, INT8 quantized, no LM | ~2-3 min/song |
| 16GB unified | Standard DiT + 1.7B LM | ~30-60 sec/song |
| 32GB unified | XL DiT with offload + any LM | ~30-60 sec/song |
| 64GB+ unified | Everything, XL without offload | ~15-30 sec/song |

**Quality vs paid:** Scores 85/100 on standardized evals. Beats Suno on 11 benchmark metrics. Instrumentals are strong. Vocals are good but not as emotionally nuanced as Suno v5 (which scores ~90/100 for vocals). For most genres, the difference is "demo+" vs "near-release" quality.

**Setup difficulty:** Medium.
```bash
git clone https://github.com/ace-step/ACE-Step-1.5
cd ACE-Step-1.5
./scripts/run_macos.sh
# Models download on first run. Gradio UI opens.
```

**Dealbreaker limitations:**
- Vocal quality is the weak point - good but not human-indistinguishable
- Complex arrangements (orchestral, jazz) still sound "AI"
- No built-in stem export (need Demucs separately)
- XL model needs 20GB+ VRAM for best quality

**Key features:**
- 10-minute max song length
- 50+ languages
- LoRA/LoKr fine-tuning from 8-20 songs of your style
- Cover generation, repainting, vocal-to-BGM conversion
- ComfyUI nodes, VST3 plugin, REST API
- Active community: 9,000+ GitHub stars, 12,000+ Discord members

**Alternatives considered:**
- **MusicGen (Meta)** - simpler, lower quality, no vocals
- **Stable Audio Open** - good instrumentals, no vocals, shorter duration
- **YuE** - newer contender but less mature ecosystem
- None match ACE-Step's combination of quality + features + license

**See also:** Doc 324 (ACE-Step deep dive) for full prompting guide, LoRA training, tag system.

---

## 3. Singing Voice Synthesis - OpenUTAU + DiffSinger

### Recommended: OpenUTAU with DiffSinger engine

**What it is:** OpenUTAU is a free, open-source singing synthesizer (like a free VOCALOID). DiffSinger is a diffusion-based neural backend that produces realistic singing from MIDI notes + lyrics. You type lyrics, draw a melody on a piano roll, and it sings.

**Mac M-series compatibility:** Native. OpenUTAU has macOS ARM64 builds. DiffSinger uses CoreML acceleration on Mac for fast inference.

**Quality vs paid:** ~75% of VOCALOID 6 or Synthesizer V Pro. DiffSinger voices sound natural but have a characteristic "softness." For pop/electronic genres where the vocal is processed anyway, the gap narrows significantly. Quality depends heavily on the voicebank used.

**Setup difficulty:** Medium. Download OpenUTAU from openutau.com. Install DiffSinger voicebanks from the community. Requires understanding MIDI/piano-roll editing.

**Dealbreaker limitations:**
- English voicebanks are fewer and lower quality than Japanese/Chinese ones
- Requires musical knowledge (you need to compose the melody, not just type lyrics)
- Not a replacement for a real singer for emotional delivery
- Community voicebanks vary wildly in quality

**Why use this instead of ACE-Step vocals?** When you need precise control over melody, timing, and pronunciation that ACE-Step's text-to-music approach can't give you. OpenUTAU lets you compose note-by-note.

**Alternatives:**
- **UTAU** (legacy) - the original freeware singing synthesizer, huge voicebank library but dated interface
- **NNSVS** (Neural Network-based Singing Voice Synthesis) - research-quality, harder to set up
- **LUNAI Project** - OpenUTAU fork specifically optimized for DiffSinger

---

## 4. Voice Cloning & Conversion

### For Singing: RVC (Retrieval-based Voice Conversion)

**What it is:** Record yourself singing (or use ACE-Step vocals), then RVC converts the voice timbre to sound like a trained voice model while preserving your melody, timing, and expression.

**Mac M-series compatibility:** Runs via Python. CPU inference works on Mac (slower). GPU acceleration via MPS is experimental. Best results on NVIDIA GPU, but usable on Mac.

**Quality vs paid:** 70% of ElevenLabs voice cloning for singing. Artifacts are present but usable, especially after mixing. Training a custom voice model requires ~10 minutes of clean vocal audio.

**Setup difficulty:** Hard. Python environment, model downloads, audio preprocessing. The learning curve is steep but the community has good tutorials.

### For Speech/TTS: GPT-SoVITS

**What it is:** 1 minute of voice data trains a TTS model that can speak in that voice. Best for spoken word, narration, podcast intros - not optimized for singing.

**Mac M-series compatibility:** Runs via Python/PyTorch. CPU inference on Mac. MPS support is partial.

**Quality vs paid:** 75% of ElevenLabs for speech. Impressive for just 1 minute of training data. Supports Chinese, English, Japanese, Korean, Spanish, French.

**Setup difficulty:** Hard. Similar to RVC - Python environment, manual setup.

### For Zero-Shot Cloning: OpenVoice V2

**What it is:** Clone any voice from a short reference clip (no training needed). MIT license. Best for quick experiments.

**Mac M-series compatibility:** Via Docker (recommended for Mac). Native Python install is problematic on macOS.

**Quality vs paid:** 60% of ElevenLabs. Good for prototyping, not release quality.

**Dealbreaker limitations across all voice tools:**
- None of these match ElevenLabs quality for singing voice cloning
- Mac performance is significantly slower than NVIDIA GPU
- Real-time voice conversion is not practical on Mac (CPU-bound)
- Ethical consideration: never clone someone else's voice without permission

**Unified option:** [TTS-WebUI](https://github.com/rsxdalv/TTS-WebUI) combines ACE-Step + RVC + GPT-SoVITS + OpenVoice + 20+ other tools in one Gradio interface.

---

## 5. Stem Separation - Demucs v4

### Recommended: HTDemucs (via Demucs v4)

**What it is:** Meta's Hybrid Transformer Demucs splits any song into clean stems: vocals, drums, bass, and other instruments. The htdemucs_6s model adds guitar and piano as separate stems.

**Mac M-series compatibility:** Excellent. A community MLX port separates a 7-minute song in 12 seconds on M4 Max. Native MPS acceleration available via Demucs-GUI.

**Quality vs paid:** Matches or exceeds paid tools. HTDemucs scores 10.8 SDR on vocals (htdemucs_ft model) - this is competitive with LALAL.AI's Perseus model. Open-source stem separation has caught up to and in many cases surpassed paid alternatives.

**Setup difficulty:** Easy.
```bash
pip install demucs
demucs --two-stems=vocals song.mp3
# Or for 4 stems:
demucs -n htdemucs_ft song.mp3
```
GUI option: Demucs-GUI has macOS ARM64 builds with point-and-click interface.

**Dealbreaker limitations:** None. This is genuinely best-in-class.

### Also recommended: UVR5 (Ultimate Vocal Remover)

**What it is:** GUI application that supports Demucs v4, MDX-Net, MDX23C, and Mel-Roformer models. Its Ensemble mode combines multiple algorithms for the best possible separation.

**Mac M-series compatibility:** Available on macOS. GPU recommended (NVIDIA GTX 1060+ ideal, but CPU works - slower at 5-10 min/song).

**Quality vs paid:** With Ensemble mode, matches or beats every paid service tested.

**When to use which:**
- **Demucs CLI** for quick batch processing
- **UVR5** when you need to experiment with different models per track
- **Both are free and excellent**

---

## 6. DAW (Digital Audio Workstation)

### Option A (Recommended for Serious Production): Ardour 9

**What it is:** Free, open-source, professional DAW. Ardour 9.0 (released February 2026) was a major leap - native Apple Silicon, redesigned macOS UI, RF64 engine, StaffPad notation algorithm.

**Mac M-series compatibility:** Native Apple Silicon support since Ardour 9.0. Faster UI on macOS, smoother interactions, better load times.

**Quality vs paid:** Reviews say Ardour 9 "rivals the big names" and is "starting to match the comfort of Logic Pro, Cubase, or Ableton Live." Full multitrack recording, MIDI, automation, AU/VST plugin support. The gap to commercial DAWs has narrowed dramatically.

**Setup difficulty:** Medium. Download from ardour.org. Free if you build from source, or pay-what-you-want for pre-built binaries ($1 minimum).

**Dealbreaker limitations:**
- UI, while improved, is still less polished than Logic Pro
- Smaller community means fewer tutorials
- No built-in virtual instruments or loop library (bring your own)
- Some AU plugins may have compatibility issues

### Option B (Easiest): GarageBand (Free, pre-installed)

**What it is:** Apple's free DAW, pre-installed on every Mac. Deceptively powerful.

**Mac M-series compatibility:** Native, obviously.

**Quality vs paid:** Solid for beat-making, stacking tracks, basic mixing. Has a loop library, virtual instruments, AU plugin support. Not suitable for professional mastering or complex mixing.

**Setup difficulty:** Easy. Already on your Mac.

**Dealbreaker limitations:**
- No advanced MIDI editing
- Limited mixing/mastering tools
- No surround sound, fewer automation options
- Projects open directly in Logic Pro when you outgrow it

### Option C (MIDI/Electronic focus): LMMS

**What it is:** Free, open-source DAW focused on electronic music production. Built-in synthesizers, pattern-based workflow.

**Mac M-series compatibility:** Available but historically had macOS issues. Check current release.

**Quality vs paid:** Good for electronic/beat-making. Not a full recording DAW. Think of it as a free FL Studio lite.

**Recommendation:** Start with **GarageBand** (zero friction), graduate to **Ardour 9** when you need more control. Both are $0.

---

## 7. Mixing Plugins - Free AU/VST

### The Essential Free Plugin Chain (all Mac AU compatible)

**EQ:**
| Plugin | What It Does | Why It's Great |
|--------|-------------|---------------|
| **TDR Nova** | Parallel dynamic EQ | Go-to EQ for mixing AND mastering. Free FabFilter Pro-Q alternative. |
| **TDR VOS SlickEQ** | Semi-parametric mastering EQ | Classic Low/Mid/High EQ designed for ease of use |
| **Marvel GEQ** (Voxengo) | 16-band linear-phase graphic EQ | Mid/side processing, transparent sound, perfect for mastering |
| **ZL Equalizer 2** | Dynamic EQ | Best free dynamic EQ available |

**Compression & Limiting:**
| Plugin | What It Does | Why It's Great |
|--------|-------------|---------------|
| **TDR Kotelnikov** | Wideband dynamics (mastering compressor) | "Most transparent mastering compressor available" - rivals hardware |
| **LoudMax** | Brick wall loudness maximizer | Transparent limiting for final output |
| **Limiter No6** (Vladg) | 5-stage mastering limiter | Compressor + peak limiter + HF limiter + clipper + protection |
| **TDR Molotok** | General compressor | Clean, versatile compression |

**Saturation & Character:**
| Plugin | What It Does | Why It's Great |
|--------|-------------|---------------|
| **IVGI** | Subtle saturation | Perfect for master bus warmth |
| **FerricTDS** | Tape dynamics simulator | Analog tape character |
| **Fresh Air** (Slate Digital) | High-frequency air | Mastering brightness without harshness |

**Metering & Analysis:**
| Plugin | What It Does | Why It's Great |
|--------|-------------|---------------|
| **Span** (Voxengo) | FFT spectrum analyzer | Industry-standard free analyzer |
| **dpMeter5** | Loudness meter | LUFS metering for streaming targets |
| **ISOL8** | Mix monitoring | Solo/mute frequency bands for analysis |

**Stereo & Utility:**
| Plugin | What It Does | Why It's Great |
|--------|-------------|---------------|
| **A1 Stereo Control** | Stereo width | Zero-latency stereo expansion |
| **Bertom Denoiser** | Noise reduction | Clean up vocal recordings |

**Quality vs paid:** ~90% of paid equivalents. TDR Kotelnikov genuinely competes with hardware mastering compressors. The TDR suite alone covers most professional needs.

**Setup difficulty:** Easy. Download, install, they appear in your DAW's plugin list.

---

## 8. Mastering - Matchering 2.0

### Recommended: Matchering 2.0

**What it is:** Open-source reference-based mastering. Give it your track + a reference track (a commercially mastered song you want to match), and it matches the RMS, frequency response, peak amplitude, and stereo width.

**Mac M-series compatibility:** Runs via Docker (recommended) or as a Python library. Docker works natively on Apple Silicon.

**Quality vs paid:** ~70% of LANDR or eMastered. It's a "smart EQ + limiter" rather than a full mastering chain. Works well when your mix is already clean. The reference-based approach means your master will sound "in the ballpark" of your reference.

**Setup difficulty:** Medium.
```bash
# Via Docker (recommended)
docker run -dp 8360:8360 sergree/matchering-web
# Open http://localhost:8360
# Upload your track + reference track
# Download mastered output
```

Or as a Python library:
```python
import matchering as mg
mg.process(
    target="my_song.wav",
    reference="reference_song.wav",
    results=[mg.pcm24("mastered.wav")]
)
```

**Dealbreaker limitations:**
- Reference-dependent - quality of output depends on choosing a good reference
- No multiband compression, dynamic EQ, or surgical processing
- Won't fix a bad mix
- Doesn't replace understanding mastering fundamentals

**Alternative approach: DIY mastering chain (free plugins)**

For better results than Matchering, use the free plugin chain in your DAW:
1. **TDR Nova** (gentle broad EQ)
2. **TDR Kotelnikov** (multiband compression)
3. **A1 Stereo Control** (subtle widening)
4. **LoudMax** (limiter, ceiling at -1.0 dBTP)
5. **dpMeter5** (check -14 LUFS for Spotify)

This manual approach gives better results than Matchering but requires learning what each step does.

**Also notable:**
- **BandLab** has free basic mastering built in (cloud-based)
- **Songmastr** - free online reference-based mastering (similar to Matchering but web-based)

---

## 9. Album Art - FLUX.1 / Stable Diffusion

### Recommended: FLUX.1-schnell (for commercial use) or FLUX.1-dev (for quality)

**What it is:** FLUX is the leading open-source image generation model family in 2026, created by Black Forest Labs (founded by the original Stable Diffusion creators). FLUX.1-schnell is Apache 2.0 licensed (commercial use), FLUX.1-dev is higher quality but non-commercial license.

**Mac M-series compatibility:** Runs via:
- **ComfyUI** with MLX backend (recommended, full workflow control)
- **Draw Things** (native macOS app, free, optimized for Apple Silicon)
- **Diffusion Bee** (native macOS app, free)
- **AUTOMATIC1111 / Forge** via Python

16GB unified memory minimum for FLUX. 32GB+ recommended for XL variants.

**Quality vs paid:** ~85% of Midjourney for album art. FLUX outperforms SDXL in prompt adherence, text rendering (great for typography on covers), and anatomical accuracy. The remaining gap is in "artistic polish" - Midjourney has a distinctive look that some prefer.

**Setup difficulty:** Medium. ComfyUI requires Python setup. Draw Things is download-and-run.

**Dealbreaker limitations:**
- FLUX.1-schnell (Apache 2.0, commercial) is lower quality than dev/pro
- FLUX.1-dev (better quality) has non-commercial license
- 16GB minimum memory is tight for some Macs
- Generating consistently great album art still requires prompt engineering skill

**For album art specifically:**
- Generate at 1024x1024 minimum, upscale to 3000x3000 (streaming platform requirement)
- Use a prompt structure like: "Album cover art for [genre] music, [mood], [visual style], no text, high detail, square format"
- Generate 10-20 variants, pick the best, refine with inpainting

**Alternatives:**
- **Stable Diffusion XL** - larger community, more LoRAs for specific art styles, but FLUX is better raw quality
- **Stable Diffusion 3.5** - latest SD version, competitive but smaller ecosystem than SDXL
- **Ideogram** - has a free tier, excellent at text rendering for cover typography

---

## 10. Distribution - RouteNote (Free Tier)

### Recommended: RouteNote Free

**What it is:** Music distribution to Spotify, Apple Music, TikTok, Amazon Music, YouTube Music, and 95+ platforms. Free tier takes 15% of royalties (you keep 85%).

**Mac M-series compatibility:** N/A - web-based service.

**Quality vs paid:** Same platforms, same stores. You're getting identical distribution to what DistroKid ($22.99/yr) provides. The trade-off is 15% royalty commission vs annual fee.

**Setup difficulty:** Easy. Sign up, upload WAV + artwork + metadata, wait 1-5 days for approval.

**Dealbreaker limitations:**
- 15% royalty take (vs 0% on paid services like DistroKid)
- Slower support than paid services
- Fewer analytics tools
- No Spotify for Artists claim assistance

**Free alternatives:**
| Service | Royalty Split | Stores | Notes |
|---------|-------------|--------|-------|
| **RouteNote Free** | 85% to you | 95+ | Most feature-complete free option |
| **Amuse** | 100% to you (if free tier still exists) | Major platforms | Free tier status uncertain in 2026, check current policy |
| **Soundrop** | Commission-based | Major platforms | Especially good for cover songs ($0.99/cover) |
| **BandLab** | Free distribution option | Limited stores | Integrated with BandLab DAW |

**The math:** If you earn $100/month in streaming royalties, RouteNote takes $15. DistroKid costs $22.99/year flat. Below ~$153/year in royalties, RouteNote free is cheaper. Above that, DistroKid is cheaper.

**Important for AI music:** DistroKid is most lenient on AI content (no special disclosure required). RouteNote, TuneCore, and CD Baby all require AI disclosure. All platforms accept AI-generated music as of April 2026.

---

## 11. Music Video - Wan 2.5

### Recommended: Wan 2.5 (Alibaba DAMO Academy)

**What it is:** Open-source video generation model that creates synchronized video + audio together. The 14B parameter model generates video with voice/dialogue (lip-synced), environmental sounds, and background music matching the visual mood. Lighter 1.3B variant available.

**Mac M-series compatibility:** Via Python/PyTorch. The 1.3B model may run on 32GB+ Macs via MPS. The full 14B model realistically needs an NVIDIA GPU with 24GB+ VRAM or cloud GPU.

**Quality vs paid:** 60-70% of commercial video generation (Runway Gen-4, Pika). Open-source video generation is the least mature category in this stack. Results are impressive for short clips (5-10 seconds) but inconsistent for longer sequences.

**Setup difficulty:** Hard. Large model downloads, GPU requirements, Python environment. Cloud GPU (RunPod, Vast.ai) recommended for the full model.

**Dealbreaker limitations:**
- Full model doesn't run locally on most Macs
- Coherent music videos require generating many short clips and editing together
- No "input song, output music video" workflow yet - you describe scenes
- Quality is noticeably AI-generated for complex scenes

**Alternatives:**
| Model | Strength | License | Notes |
|-------|----------|---------|-------|
| **Wan 2.5** | Audio+video sync | Open source | Best for music content |
| **CogVideoX 1.5** | 10-second clips | Open source | Good quality, no audio sync |
| **LTX-2.3** (Lightricks) | Audio+video unified | Open source | Newer, promising |
| **HunyuanVideo** (Tencent) | Long-form video | Open source | Good coherence |
| **Open-Sora** | Text-to-video | Apache 2.0 | Community-driven |

**Practical music video workflow (2026):**
1. Generate 10-20 short video clips (5-10s each) with different scene prompts
2. Edit together in DaVinci Resolve (free) or iMovie (free)
3. Sync to your finished song
4. Add transitions, text overlays, effects

This is more "AI-assisted music video" than "AI-generated music video." Full automation is not yet viable for quality results.

---

## 12. Self-Hosted Streaming - Navidrome

### Recommended: Navidrome

**What it is:** Lightweight, open-source music streaming server. Point it at your music folder, it indexes everything, and you get a Spotify-like web UI plus mobile app support via Subsonic API.

**Mac M-series compatibility:** Written in Go, runs natively on any platform. Uses 30-50 MB of RAM idle.

**Quality vs paid:** Excellent. Modern web UI, smart playlists, multi-user support, scrobbling. Supports FLAC, MP3, AAC, OGG, OPUS, WMA. Use Symfonium, play:Sub, or Ultrasonic as mobile clients.

**Setup difficulty:** Medium.
```bash
# Via Docker
docker run -d --name navidrome \
  -p 4533:4533 \
  -v /path/to/music:/music:ro \
  -v /path/to/data:/data \
  deluan/navidrome
# Open http://localhost:4533
```

Or install the binary directly. Runs on a Raspberry Pi.

**Dealbreaker limitations:**
- You host it yourself (need a server or always-on Mac)
- No social features (no followers, shared playlists with non-users)
- Mobile apps are third-party (Subsonic clients)

**Alternative: Funkwhale**
- Social/federated music platform (like Mastodon for music)
- Heavier (Django/PostgreSQL, needs 500MB-1GB RAM)
- Better for community/sharing features
- Overkill for personal streaming

**When to use which:**
- **Navidrome** for personal music library streaming (lightweight, fast)
- **Funkwhale** for community music sharing with federation

---

## The Complete $0 Pipeline: Step by Step

```
1. WRITE LYRICS
   Ollama + Llama 3.1 locally
   -> Iterate on verses, chorus, bridge structure
   -> Format with ACE-Step structure tags [Verse], [Chorus], etc.

2. GENERATE MUSIC
   ACE-Step v1.5 XL
   -> Input: tags (genre, mood, instruments, BPM) + structured lyrics
   -> Output: full song with vocals + instrumentals (up to 10 min)
   -> Generate 2-4 versions, pick the best

3. (OPTIONAL) SYNTHESIZE SPECIFIC VOCALS
   OpenUTAU + DiffSinger
   -> Only if you need note-level vocal control
   -> Piano roll melody + typed lyrics -> singing voice

4. (OPTIONAL) CLONE YOUR VOICE
   RVC voice conversion
   -> Separate ACE-Step vocals with Demucs
   -> Convert vocal timbre to your trained voice model
   -> Recombine with instrumentals

5. SEPARATE STEMS
   Demucs v4 (HTDemucs)
   -> Split the full mix into vocals, drums, bass, other
   -> 12 seconds on M4 Max, ~2-5 min on M1/M2

6. MIX IN DAW
   GarageBand (easy) or Ardour 9 (pro)
   -> Import stems on separate tracks
   -> EQ chain: TDR Nova for vocals, Marvel GEQ for instruments
   -> Compress: TDR Kotelnikov for bus, TDR Molotok for vocals
   -> Effects: reverb + delay on aux sends
   -> Humanize: micro-timing shifts, subtle saturation (IVGI)

7. MASTER
   Option A: Matchering 2.0 (quick, reference-based)
   Option B: DIY chain (TDR Nova -> Kotelnikov -> LoudMax)
   -> Target: -14 LUFS, -1.0 dBTP true peak

8. GENERATE COVER ART
   FLUX.1-schnell via ComfyUI or Draw Things
   -> 1024x1024, upscale to 3000x3000
   -> Square format, no text (add text in image editor)

9. DISTRIBUTE
   RouteNote Free
   -> Upload WAV + artwork + metadata
   -> Live on Spotify/Apple Music in 1-5 days
   -> Keep 85% of royalties

10. (OPTIONAL) MUSIC VIDEO
    Wan 2.5 short clips -> edit in DaVinci Resolve/iMovie
    -> Sync to finished song

11. (OPTIONAL) SELF-HOST
    Navidrome for personal streaming server
    -> Share direct links, no platform dependency
```

---

## Hardware Reality Check

### Minimum Viable Mac for This Stack

**Mac with 16GB unified memory (M1/M2/M3 Pro):**
- ACE-Step standard model: Yes (30-60 sec/song)
- Demucs: Yes (fast with MLX)
- FLUX.1-schnell: Tight but works
- OpenUTAU: Yes
- RVC: CPU-only, slow but functional
- Ardour/GarageBand: Yes
- All plugins: Yes
- Wan 2.5: No (need cloud GPU or 1.3B model only)

**Ideal: Mac with 32GB+ unified memory (M2/M3/M4 Pro/Max):**
- Everything above runs comfortably
- ACE-Step XL with offload
- FLUX.1-dev quality
- Faster everything

**What you genuinely cannot do on Mac (any config):**
- Run Wan 2.5 14B at full quality (need NVIDIA 24GB+ GPU)
- Real-time RVC voice conversion (need NVIDIA GPU)
- LoRA training for ACE-Step at reasonable speed (need NVIDIA 20GB+)

For these three tasks, rent cloud GPU time (RunPod: ~$0.40/hr for A100, Vast.ai: ~$0.20/hr for RTX 4090).

---

## Quality Honest Assessment

**What sounds genuinely professional with this stack:**
- Electronic/EDM/lo-fi (ACE-Step excels here)
- Hip-hop beats + your recorded vocals
- Ambient/atmospheric music
- Simple pop structures

**What still sounds noticeably AI:**
- Complex vocal harmonies
- Jazz/classical arrangements
- Emotional ballads (vocal nuance is the bottleneck)
- Dense rock/metal (instrument separation in generation)

**The "80% rule":** This $0 stack gets you to ~80% of what a $500/month professional setup (Suno + ElevenLabs + Logic Pro + LANDR + DistroKid + Midjourney) delivers. That remaining 20% is mostly vocal quality and mastering polish. For an independent artist building an audience, 80% is more than enough.

---

## Sources

- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [ACE-Step 1.5 XL Release (GIGAZINE)](https://gigazine.net/gsc_news/en/20260409-ace-step-1-5-xl/)
- [Awesome ACE-Step](https://github.com/ace-step/awesome-ace-step)
- [OpenUTAU](https://www.openutau.com/)
- [DiffSinger + OpenUTAU Wiki](https://github.com/stakira/OpenUtau/wiki/DiffSinger-support)
- [RVC GitHub](https://github.com/RVC-Boss/GPT-SoVITS)
- [GPT-SoVITS GitHub](https://github.com/RVC-Boss/GPT-SoVITS)
- [OpenVoice V2 GitHub](https://github.com/myshell-ai/OpenVoice)
- [TTS-WebUI (unified voice tools)](https://github.com/rsxdalv/TTS-WebUI)
- [Demucs GitHub](https://github.com/facebookresearch/demucs)
- [Demucs MLX Port (Apple Silicon)](https://medium.com/@andradeolivier/i-ported-demucs-to-apple-silicon-it-separates-a-7-minute-song-in-12-seconds-6c4e5cffb5c3)
- [Demucs-GUI Releases](https://github.com/CarlGao4/Demucs-Gui/releases)
- [UVR5 (python-audio-separator)](https://github.com/nomadkaraoke/python-audio-separator)
- [Ardour 9 Review (Digital Mixing)](https://digital-mixing.com/en/studio-en/7070-ardour-9-0-the-free-daw-thats-starting-to-rival-the-big-names-03-03-2026/)
- [Ardour 9 Release (Synthtopia)](https://www.synthtopia.com/content/2026/02/13/ardour-9-now-available-for-linux-mac-windows/)
- [Ardour 9 Review (Gearnews)](https://www.gearnews.com/ardour-9-freeware-daw-studio/)
- [Matchering 2.0 GitHub](https://github.com/sergree/matchering)
- [FLUX vs Stable Diffusion 2026](https://zsky.ai/blog/flux-vs-stable-diffusion-2026)
- [FLUX.2 and the Future (Ropewalk AI)](https://ropewalk.ai/blog/flux-2-ai-image-generation-2026)
- [Best Open-Source Image Models 2026 (Pixazo)](https://www.pixazo.ai/blog/top-open-source-image-generation-models)
- [RouteNote Free Distribution](https://routenote.com/free-music-distribution)
- [Best Music Distribution 2026 (Aristake)](https://aristake.com/digital-distribution-comparison/)
- [Best Free Music Distribution 2026 (SongRocket)](https://www.songrocket.com/blog/best-free-music-distribution-in-2026/)
- [Wan 2.5 Overview (MindStudio)](https://www.mindstudio.ai/blog/what-is-wan-2-5-video-open-source)
- [Best Open Source Video Models 2026 (Pixazo)](https://www.pixazo.ai/blog/best-open-source-ai-video-generation-models)
- [Best Open Source Video Models 2026 (Hyperstack)](https://www.hyperstack.cloud/blog/case-study/best-open-source-video-generation-models)
- [Navidrome + Funkwhale (Linux Magazine)](https://www.linux-magazine.com/Issues/2026/304/Navidrome-and-Funkwhale)
- [Self-Hosted Music Streaming (selfhosting.sh)](https://selfhosting.sh/best/music-streaming/)
- [Ollama Lyrics Generator](https://markaicode.com/ollama-lyrics-song-description-generator/)
- [SongComposer LLM](https://pjlab-songcomposer.github.io/)
- [Best Local LLM Models 2026](https://www.aitooldiscovery.com/how-to/best-local-llm-models)
- [Best Open Source Voice Cloning 2026 (Resemble AI)](https://www.resemble.ai/best-open-source-ai-voice-cloning-tools/)
- [Best Open Source Voice Cloning 2026 (SiliconFlow)](https://www.siliconflow.com/articles/en/best-open-source-models-for-voice-cloning)
- [Free EQ Plugins 2026 (Pluginerds)](https://pluginerds.net/19-best-free-eq-plugins/)
- [Free Mastering Plugins 2026 (Pluginoise)](https://pluginoise.com/13-best-free-mastering-plugins/)
- [Free VST Plugins 2026 (Bedroom Producers Blog)](https://bedroomproducersblog.com/free-vst-plugins/)
- [Best Free DAWs (LANDR)](https://blog.landr.com/best-free-daw/)
- Doc 313 (AI Music Production Workflows 2026)
- Doc 323 (Mixing & Mastering AI Music DAW Guide)
- Doc 324 (ACE-Step Deep Dive)
