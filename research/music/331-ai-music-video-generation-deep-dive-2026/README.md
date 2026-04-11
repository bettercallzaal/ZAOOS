# 331 - AI Music Video Generation Tools Deep Dive (April 2026)

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Comprehensive evaluation of every AI video generation tool relevant to a musician making AI-generated songs who needs visuals for TikTok, YouTube, and live performances
> **Updates:** Supersedes Doc 209 (March 29, 2026) with expanded coverage of 17 specific areas

---

## TL;DR - Decision Matrix

| Need | Best Tool | Price | Why |
|------|-----------|-------|-----|
| **Beat-synced music video** | Neural Frames | $19-39/mo | Only tool with 8-stem audio analysis, maps each stem to visual params, 10-min 4K output |
| **Budget beat-synced video** | Freebeat | $9.99/mo | BPM/beat/bar/structure analysis, 70+ effects, wraps Veo3/Runway/Luma |
| **Highest visual quality** | Runway Gen-4 / Gen-4.5 | $28/mo (Standard) | Best temporal consistency, Motion Brush 2.0, Camera Director - but no audio sync |
| **Cheapest bulk clips** | Kling 3.0 | $6.99/mo | 66 free credits/day, 4K/60fps, $0.029/sec API |
| **Best value general** | Seedance 2.0 | ~$9.60/mo (Dreamina) | $0.05/5s at 720p, 9 ref images + 3 video clips + 3 audio tracks |
| **Open source / local** | Wan 2.6 + ComfyUI | Free | First open-source model with native audio+video generation, runs on Mac via MPS |
| **Lip sync (singing)** | Freebeat (>90% accuracy) or Pika Pikaformance | $9.99 / $8/mo | Freebeat for AI characters, Pika for animating real photos |
| **Lyric videos** | LyricEdits or Neural Frames | Varies / $19/mo | Auto-sync lyrics to beat, animated text |
| **Live performance visuals** | REACT by Compeller | TBD | Real-time audio-reactive, no rendering, MIDI support, NDI output |
| **Live + AI generation** | TouchDesigner + Sora 2 plugin | Free (non-commercial) | AIMods_Sora2 plugin for real-time AI generation in TouchDesigner |
| **3-min music video, lowest cost** | Kling 3.0 | ~$10-13 | $3.60-4.20/min at standard quality |
| **3-min music video, best quality** | Veo 3.1 | ~$72-90 | $24-30/min, cinema-grade color science |

---

## 1. Wan 2.5 / 2.6 (Alibaba)

### Current State
Wan has moved fast. The lineage: Wan 2.1 -> 2.2 (MoE architecture) -> 2.5 (audio-visual sync) -> **Wan 2.6** (current, April 2026).

### Key Specs
- **Max duration:** 15 seconds
- **Resolution:** 1080p, 24fps
- **Audio:** Native audio+video generation in a single pass - first open-source model to do this
- **Open source:** Yes, fully open-source (Apache 2.0 for most variants)
- **Audio-reactive:** Not audio-reactive in the Neural Frames sense (it doesn't analyze YOUR music). It generates its own synchronized audio (voices, sound effects, music) to match the video content

### Running on Mac M-Series
- Runs in ComfyUI via MPS (Metal Performance Shaders) on Apple Silicon
- ComfyUI-MLX extension gives 70% faster model loading, 35% faster generation, 30% less memory
- Wan 2.2 confirmed working on MacBook/Mac Mini with Apple Silicon
- Realistic expectation: a 5-second 720p clip takes 3-8 minutes on M2 Max with 64GB RAM
- 16GB minimum, 32GB+ recommended for usable generation times

### Verdict
Best open-source option. The audio generation is impressive but you can't feed it your own track and have it react - you'd use it to generate visual clips, then sync manually in a DAW/editor. For musicians, it's a clip factory, not a music video maker.

---

## 2. Kling 3.0 (Kuaishou)

### Current State
Released February 5, 2026. Currently the cheapest way to generate high volumes of quality video clips.

### Key Specs
- **Max duration:** 15 seconds (up from 10s in Kling 2.6)
- **Resolution:** 4K / 60fps
- **Audio:** Multi-language native audio with lip-sync (Chinese, Japanese, Spanish, English)
- **Architecture:** Multi-modal Visual Language (MVL) - processes text, images, audio, video in one system
- **Chain-of-Thought:** Built-in reasoning for better scene coherence
- **Multi-shot:** Consistent characters across cuts without manual reference management

### Pricing
- **Subscription:** $6.99/mo (66 free credits/day)
- **API:** $0.084/sec (standard) to $0.168/sec (Pro with video input)
- **Third-party:** 30% cheaper via Atlas Cloud, also on Replicate
- **3-min video cost:** ~$10-15 using standard mode

### API Access
- Direct registration at klingai.com/global/dev/pricing
- Also available through PiAPI, Replicate, Atlas Cloud, fal.ai
- Documentation can be rough for non-Chinese developers

### Kling O3 (Omni)
The premium variant supports custom subjects and voice clones from video/image inputs - you could theoretically create a consistent AI band member.

### Verdict
Best for volume. Generate 50+ clips/month for under $7. The 4K output is genuinely impressive. No beat-sync or audio-reactive features though - it's a raw clip generator.

---

## 3. Sora 2 (OpenAI)

### Current State
Released September 30, 2025. Available through ChatGPT Plus/Pro subscriptions.

### Key Specs
- **Max duration:** 25 seconds
- **Resolution:** Up to 1080p (Pro), 480p unlimited (Plus)
- **Audio:** Native audio+video generation (dialogue, sound effects, music in sync)
- **Physics:** Best-in-class physics simulation and realistic motion

### Pricing
- **ChatGPT Plus:** $20/mo - unlimited 480p access
- **ChatGPT Pro:** $200/mo - 10,000 credits, up to 1080p
- **API:** $0.10/sec (720p standard) to $0.50/sec (1024p Pro)
- **Free access:** Removed January 10, 2026

### Music Video Capabilities
- Generates synchronized audio but you can't feed it your own track
- Good for generating visually stunning clips to edit together
- No beat-sync or audio-reactive features
- Excellent at "impossible cinematography" - surreal transitions, infinite zooms, morphing

### Verdict
The $20/mo Plus tier is reasonable for generating lots of 480p clips for social media. For 1080p music video work, $200/mo Pro is steep unless you're a full-time creator. Physics and motion quality are top-tier but no music-specific features.

---

## 4. Veo 3.1 (Google)

### Current State
Current model in the Veo series. Available through Google AI subscriptions and Vertex AI API.

### Key Specs
- **Max duration:** 30-40 seconds (longest of any platform)
- **Resolution:** Up to 1080p (Ultra subscribers), 720p (Pro)
- **Audio:** Native dialogue, sound effects, ambient sound generation
- **Color science:** Cinema-grade, widely considered the best color output

### Pricing
- **Free:** 10 generations/month with any Google account
- **Google AI Pro:** $19.99/mo - up to 90 Veo 3.1 Fast videos/month
- **Google AI Ultra:** $249.99/mo - up to 1,000 videos/month, 1080p
- **Gemini API:** $0.35/sec
- **Vertex AI:** $0.50/sec
- **3-min video cost:** ~$63 (Gemini API) to ~$90 (Vertex AI)

### Verdict
Longest clips (30-40s vs everyone else's 10-25s) and best color science. The free tier (10 clips/month) is useful for testing. But the per-second cost is the highest of any platform - a 3-minute video at $0.50/sec = $90. Best for hero shots you'll use as centerpieces, not for bulk generation.

---

## 5. Runway Gen-4 / Gen-4.5

### Current State
The professional standard for AI video. Gen-4.5 is the latest with Motion Brush 2.0 and Camera Director.

### Key Specs
- **Max duration:** ~10 seconds
- **Resolution:** 1080p
- **Audio:** NONE - silent output only, audio added in post
- **Character consistency:** Best-in-class single-reference-image character consistency
- **Motion control:** Text-described camera movements, Motion Brush for per-element control
- **Camera Director:** Slider-based camera movement (new in Gen-4.5)

### Pricing
- **Free:** 125 one-time credits
- **Basic:** $12/mo
- **Standard:** $28/mo (2,250 credits = ~45 five-second clips at 1080p = ~3.75 min total)
- **Pro:** $76/mo
- **Unlimited:** $188/mo
- **Fancy (Pika equivalent):** $76/mo
- **No public API** as of April 2026

### Music Video Use
- No audio awareness whatsoever - you generate clips and manually cut to beat in post
- But the visual quality and temporal consistency are the best in the industry
- Character consistency means your "AI artist" looks the same across every shot
- The "shots not videos" workflow (from Seedance playbook) works perfectly here too

### Verdict
If visual quality is the priority and you're willing to do beat-sync manually in DaVinci Resolve or CapCut, Runway is still the gold standard. The lack of audio is a real limitation for musicians who want an end-to-end workflow.

---

## 6. Pika 2.2 / 2.5 + Pikaformance

### Current State
Pika has differentiated with creative motion effects and a strong lip-sync model called Pikaformance.

### Key Specs
- **Max resolution:** 480p (free) to full quality (paid)
- **Pikaformance:** Makes any portrait sing, speak, rap - animates lips, eyes, expressions from audio input
- **Lip sync accuracy:** Handles complex facial expressions, competitive with HeyGen
- **Motion styles:** Unique "Pika effects" (inflate, crush, melt, explode, etc.)

### Pricing
- **Free:** 80 credits/month, 480p only, watermarked, no commercial use
- **Standard:** $8/mo (annual) - 700 credits, Pika 2.5 + 2.2, commercial use
- **Pro:** $28/mo (annual) - 2,300 credits
- **Fancy:** $76/mo (annual) - 6,000 credits

### Music Video Use
- Pikaformance is excellent for making a character/avatar sing your lyrics
- Upload a face image + your audio track = animated singing performance
- Near real-time generation speed
- The creative motion effects (inflate, crush, etc.) make interesting music video transitions
- No beat-sync or audio-reactive features

### Verdict
Best value for lip-sync specifically at $8/mo. Pikaformance turns any portrait into a singing character convincingly. The creative motion effects are unique and great for music video transitions. Limited by lower resolution compared to Runway/Kling.

---

## 7. Hailuo / MiniMax

### Current State
Hailuo 02 ranks #2 globally on the Artificial Analysis benchmark, surpassing Veo 3. Hailuo 2.3 is the latest.

### Key Specs
- **Resolution:** 1080p (Pro tier)
- **Physics:** Ultra-realistic physics simulation
- **Character:** Advanced micro-expressions, facial detail
- **Hailuo 2.3:** Improved physical actions, stylization, character micro-expressions

### Pricing
- **Standard Plan:** $9.99/mo (1,000 credits)
- **Unlimited Plan:** $94.99/mo
- **API (fal.ai):** $0.045/sec at 768p, $0.017/sec at 512p
- **Per video:** ~$0.25-0.52 for a 6-10 second clip

### API Access
Available through fal.ai, Atlas Cloud, and direct from MiniMax. Developer-friendly with SDKs, analytics, and fine-tuning tools.

### Verdict
Underrated. The quality benchmarks put it above Veo 3, and the API pricing is very competitive. Good option for developers building video generation into apps. No music-specific features.

---

## 8. LTX Video 2.3 (Lightricks)

### Current State
Released March 5, 2026. Open-source, 22 billion parameters.

### Key Specs
- **Resolution:** Up to 4K at 50fps (only model offering true 4K generation)
- **Architecture:** Diffusion Transformer (DiT)
- **Audio:** Synchronized audio+video generation
- **Open source:** Yes, fully open
- **No censorship:** No content restrictions (unlike closed platforms)
- **Quality:** Claimed "on par with Veo 3" but independent reviews say noticeably below in detail and temporal coherence

### Mac M-Series Performance
- Metal (MPS) acceleration on M2/M3/M4
- 10-second 1080p video: ~4-6 minutes on M3 Max
- Native macOS app available (ltx-video-mac on GitHub)
- CUDA is primary platform; Mac support is secondary and slower
- GGUF/FP8/NVF4/BF16 quantization options for lower memory usage

### Verdict
The most capable open-source option for raw specs (4K/50fps), but real-world quality trails behind Wan 2.6 for cinematic output and behind commercial tools for detail/coherence. Best for creators who need no content restrictions or want to run fully local without cloud costs.

---

## 9. Audio-Reactive Visuals - Which Tools Actually Sync to Music?

This is the critical question for musicians. Most "AI video generators" don't understand music at all. Here's who actually does:

### Tier 1: True Audio Analysis (Beat-Level Sync)

| Tool | Audio Analysis | What It Maps | Price |
|------|---------------|-------------|-------|
| **Neural Frames** | 8-stem separation (drums, bass, vocals, etc.) | Each stem maps to independent visual parameters | $19-299/mo |
| **Freebeat** | 4-level analysis (BPM, beats, bars, song structure) | Shot sequence planned from audio map before any generation | $9.99/mo |
| **REACT by Compeller** | Real-time frequency analysis | Instant visual response, patent-pending harmonic math | TBD |
| **Kaiber** | BPM detection | Auto-aligns transitions to beats | ~$10/mo |

### Tier 2: Basic Beat Awareness

| Tool | How It Works |
|------|-------------|
| **BeatViz** | BPM + mood detection, auto-sync ($18/mo) |
| **Revid** | Pulls audio from Spotify/Suno links, detects rhythm, generates matched visuals |
| **OneMoreShot** | Mood-based visual matching ($8.25/mo) |

### Tier 3: No Audio Awareness (Manual Sync Required)

Sora 2, Veo 3.1, Runway Gen-4, Kling 3.0, Pika, Hailuo, Wan 2.6, LTX Video, Seedance 2.0 - all generate clips independently of your music. You sync in post.

### Bottom Line
If you want the AI to understand your music: Neural Frames or Freebeat. Everything else requires manual editing to sync visuals to beats.

---

## 10. Deforum / Stable Diffusion for Music Visualizers

### Still Relevant?
Yes, but increasingly niche. Deforum occupies a specific lane: psychedelic, morphing, trippy visualizer aesthetics that newer tools don't replicate well.

### Current State
- Deforum Music Visualizer uses Stable Diffusion + Spotify API for audio-synced generation
- Available as: AUTOMATIC1111 WebUI extension, standalone Colab notebook, Discord bot
- **Parseq** plugin adds advanced audio sync and keyframe control
- 77 prompt modifiers, 25 motion presets
- Active community, still maintained

### When to Use Deforum vs Newer Tools
- **Use Deforum when:** You want morphing/flowing abstract visuals, psychedelic aesthetics, or Spotify Canvas-style loops. The look is distinctly "AI art" in a way that's become its own genre
- **Skip Deforum when:** You want cinematic, photorealistic, or narrative video. Neural Frames, Freebeat, and the general-purpose generators all produce far more polished output
- **Hardware:** Runs on Mac via ComfyUI + MPS, but generation is slow. Best with an NVIDIA GPU

### Verdict
Deforum is the OG of AI music visualizers and still produces a unique aesthetic that newer tools haven't replaced. For artists whose brand is psychedelic/electronic/experimental, it's still the right tool. For everyone else, Neural Frames or Freebeat are better.

---

## 11. TouchDesigner + AI for Live Performance

### What It Is
TouchDesigner is the industry standard for real-time interactive visuals at concerts, festivals, and installations. Free for non-commercial use.

### AI Integration (2026)
- **AIMods_Sora2:** Plugin that brings Sora 2 API calls directly into TouchDesigner workflows (text-to-video and image-to-video)
- **DepthAnything for TouchDesigner:** Real-time depth maps from any webcam or video feed, no extra hardware
- **Stable Diffusion nodes:** Community plugins for real-time SD generation within TD

### Audio-Reactive Features (Native)
- Analyzes audio input in real-time (frequency bands, amplitude, BPM)
- Maps audio parameters to 3D geometry, particle systems, materials, lighting
- Supports MIDI, OSC, DMX for hardware integration
- Can receive audio from Ableton Live, CDJs, or any audio source

### Learning Curve
- Steep. Node-based visual programming. Berklee College of Music offers a full course on it
- Not a "generate and post" tool - it's a live performance instrument
- Expect 20-40 hours to build your first usable performance patch

### Verdict
If you're performing live and want visuals that react to your music in real-time, TouchDesigner is the only serious option. The AI plugins (especially AIMods_Sora2) add generative capabilities to an already powerful real-time engine. But it's a commitment to learn - this is not a casual tool.

### Alternative: REACT by Compeller
For musicians who want real-time audio-reactive visuals WITHOUT learning TouchDesigner:
- Patent-pending harmonic math drives visuals from audio
- No coding, no node graphs - works immediately
- MIDI support, NDI output, system audio capture
- Requires Apple Silicon Mac with 32GB+ RAM
- Much simpler than TouchDesigner but less customizable

### Alternative: Synesthesia Live
- Real-time music visualizer / VJ software
- Simpler than TouchDesigner, more customizable than REACT
- Good middle ground for live performance

---

## 12. Lyrics Video Generation

### Dedicated Lyric Video Tools

| Tool | Key Feature | Price |
|------|------------|-------|
| **LyricEdits** | AI lyric video maker, no editing experience needed | Freemium |
| **Capify** | Upload audio, AI transcribes + creates synced animated video | Freemium |
| **Pollo AI** | Input lyrics or upload music, generates visuals + animated text + synced subtitles | Freemium |
| **ReVid** | Composes original visuals from lyrics, auto-animates captions | Freemium |
| **MakeSong** | Turn any song into lyric/dance/music video, auto-synced | Freemium |
| **Neural Frames** | Full lyric video maker with beat-sync, 4K upscale, stem-aware timing | $19/mo+ |
| **VEED.IO** | Template-based lyric video maker | Freemium |

### Best Workflow
1. Upload your track to **Neural Frames** or **Capify**
2. AI auto-transcribes lyrics and detects timing
3. Choose visual style / generate AI backgrounds
4. Export at target resolution
5. Fine-tune in CapCut if needed (add effects, transitions)

### Verdict
For quick lyric videos for social media, Capify or LyricEdits are free and fast. For production-quality lyric videos that sync to the actual beats of your music, Neural Frames is worth the $19/mo.

---

## 13. Cost Comparison - 3-Minute Music Video

### Budget Approach ($10-20)

| Platform | Cost for 3 min | Quality | Audio Sync |
|----------|---------------|---------|------------|
| Kling 3.0 (subscription) | ~$7-13 | 4K, good | Manual |
| Freebeat Standard | $9.99/mo flat | 1080p | Auto (beat-synced) |
| Seedance 2.0 (Dreamina) | ~$10 | 720-1080p | Manual |

### Mid-Range ($20-50)

| Platform | Cost for 3 min | Quality | Audio Sync |
|----------|---------------|---------|------------|
| Neural Frames Navigator | $19/mo flat | 4K (upscaled) | Auto (8-stem) |
| Sora 2 (Plus tier, 480p) | $20/mo flat | 480p | Manual |
| Runway Standard | $28/mo flat | 1080p | Manual |

### Premium ($50-200)

| Platform | Cost for 3 min | Quality | Audio Sync |
|----------|---------------|---------|------------|
| Runway Pro | $76/mo flat | 1080p | Manual |
| Veo 3.1 (Gemini API) | ~$63 per video | 1080p | Manual |
| Veo 3.1 (Vertex AI) | ~$90 per video | 1080p | Manual |
| Sora 2 Pro | $200/mo flat | 1080p | Manual |

### Free / Open Source

| Platform | Cost | Quality | Limitation |
|----------|------|---------|------------|
| Wan 2.6 (local) | $0 (your hardware) | 1080p | Slow on Mac, no beat-sync |
| LTX 2.3 (local) | $0 (your hardware) | Up to 4K | Quality below commercial, slow on Mac |
| Deforum + SD (local) | $0 (your hardware) | Variable | Psychedelic aesthetic only |
| Veo 3.1 (free tier) | $0 | 720p | 10 clips/month |

### Recommended Budget for a Serious 3-Minute Music Video
- **Minimum viable:** $10-20/mo (Freebeat or Kling + free editor)
- **Good quality:** $40-60/mo (Neural Frames + DaVinci Resolve free)
- **Professional:** $80-130 total (mix of tools per the workflow below)

---

## 14. Best Workflow: Generate Clips + Edit

### Recommended Stack

**Generation:** Neural Frames ($19/mo) for beat-synced hero shots + Kling 3.0 ($6.99/mo) for bulk supplementary clips
**Editing:** DaVinci Resolve (free) for final assembly, color grading, audio mixing
**Quick social cuts:** CapCut (free) for TikTok/Reels/Shorts edits

### Why This Stack

- **Neural Frames** handles the hard part (beat-sync, stem analysis, character consistency) automatically
- **Kling 3.0** fills in with cheap, high-res supplementary shots
- **DaVinci Resolve** is genuinely professional-grade and free (Fairlight audio workstation included)
- **CapCut** is the fastest path to social media formats

### Step-by-Step Workflow

1. **Upload track** to Neural Frames, let it analyze stems
2. **Generate 15-30 beat-synced clips** (Neural Frames autopilot mode, or manual prompt per scene)
3. **Generate supplementary clips** on Kling 3.0 for transitions, B-roll, abstract shots
4. **Import all clips** into DaVinci Resolve
5. **Arrange on timeline** - Neural Frames clips are already beat-synced, Kling clips need manual placement
6. **Color grade** in DaVinci Resolve's Color page (match all clips to a consistent look)
7. **Mix audio** in Fairlight (adjust track, add effects)
8. **Export master** at 1080p or 4K
9. **Quick-cut versions** in CapCut for TikTok (9:16), YouTube Shorts, Instagram Reels

### DaVinci Resolve vs CapCut

| Feature | DaVinci Resolve (Free) | CapCut (Free) |
|---------|----------------------|---------------|
| Color grading | Professional (best in class) | Basic filters |
| Audio mixing | Full DAW (Fairlight) | Basic |
| AI features | Smart Reframe, Magic Mask, Voice Isolation | Auto-edit, beat-match cuts, Seedance 2.0 integration |
| Export quality | Up to 4K, no watermark | Up to 4K, no watermark |
| Best for | Final music video assembly | Quick social media cuts |
| Learning curve | Medium-steep | Easy |

---

## 15. AI Lip Sync Tools - Make a Character Sing

### For AI/Animated Characters Singing

| Tool | Accuracy | Character Consistency | Price | Best For |
|------|----------|----------------------|-------|----------|
| **Freebeat** | >90% for singing | Stable across scenes | $9.99/mo | Full music video with singing character |
| **Hedra Character-3** | High | Single portrait animation | Freemium | Animating a still image to sing |
| **Pika Pikaformance** | High | Single portrait | $8/mo | Making any portrait sing/rap/speak |

### For Real Footage Lip Sync (Dubbing/Replacement)

| Tool | Best For | Price |
|------|----------|-------|
| **Magic Hour** | Most complete production-ready platform | Freemium |
| **Vozo** | Multilingual, tested for realism | Freemium |
| **LipSync.video** | Free, no sign-up required | Free |

### Workflow for "AI Artist" Singing

1. Create your AI artist's face using FLUX.1-schnell or Midjourney
2. Upload the face image + your audio track to **Freebeat** or **Pika Pikaformance**
3. Generate singing performance video
4. Use as hero shot in your music video, or as the basis for a full video
5. For consistency across multiple videos, use **Neural Frames** character persistence

### 2026 Trend: Avatar-Based Music Artists
AI-generated singing voices + AI-animated facial expressions = virtual artists that don't need a physical performer. Multiple artists are already releasing music this way, with some achieving viral success.

---

## 16. Real Examples of AI Music Videos That Performed Well

### Viral Successes

- **"Was It Real?"** - AI-generated track mimicking Drake and The Weeknd. Garnered millions of views, primarily due to controversial vocal realism. The AI video component amplified virality
- **Linkin Park "Lost" visualizer** - Official release used AI generation techniques for the visual component
- **Numerous TikTok creators** using Freebeat and Neural Frames to generate beat-synced videos that regularly hit 100K+ views

### Why AI Music Videos Go Viral

1. **Cost efficiency:** What used to cost $10,000+ and weeks of filming can be generated for $20-100 in minutes
2. **Impossible cinematography:** Surreal transitions, infinite zooms, morphing effects that cameras can't capture
3. **Retention boost:** Tracks with dynamic visuals see 40% higher retention than static audio uploads
4. **Optimal format:** The most viral tracks include a catchy 10-20 second segment with matching visuals
5. **First mover advantage:** Generate visuals for trending topics within hours (Seedance playbook: monitor Polymarket for spikes)

### What Works on Each Platform

| Platform | Optimal Format | Duration | Resolution |
|----------|---------------|----------|------------|
| TikTok | 9:16 vertical | 15-60 sec | 1080x1920 |
| YouTube Shorts | 9:16 vertical | 15-60 sec | 1080x1920 |
| YouTube (full) | 16:9 horizontal | Full song | 1920x1080+ |
| Instagram Reels | 9:16 vertical | 15-90 sec | 1080x1920 |
| Instagram Feed | 1:1 or 4:5 | 15-60 sec | 1080x1350 |
| Farcaster | 16:9 or 1:1 | 15-30 sec | 1080p |

---

## 17. Open Source Options That Run on Mac M-Series

### Practical Local Generation Stack (April 2026)

| Tool | What It Does | Mac Performance | Min RAM | Setup Difficulty |
|------|-------------|----------------|---------|-----------------|
| **Wan 2.6** | Text/image-to-video + audio | 3-8 min per 5s clip on M2 Max | 32GB | Medium (ComfyUI) |
| **LTX 2.3** | Text/image-to-video + audio, 4K capable | 4-6 min per 10s 1080p on M3 Max | 32GB | Medium (ComfyUI or native app) |
| **Deforum + SDXL** | Morphing visualizers, audio-reactive | 1-3 min per 5s clip | 16GB | Medium (AUTOMATIC1111) |
| **ComfyUI** | Node-based workflow engine for all above | Native on Apple Silicon | 16GB | Medium |
| **Wan 2.2** | Older but lighter, cinematic output | Faster than 2.6 | 16GB | Medium |

### Setup Path for Mac Users

1. Install **ComfyUI Desktop** (Apple Silicon DMG from official site)
2. Choose **MPS** when asked about graphics
3. Install **ComfyUI-MLX** extension for speed boost
4. Browse Templates -> Video for pre-built Wan/LTX workflows
5. Download model weights (Wan 2.6 is ~10-15GB, LTX 2.3 is ~22GB)

### Honest Assessment
Local generation on Mac is possible but slow. A 3-minute music video would take hours to generate locally vs minutes on cloud platforms. The value is:
- **$0 ongoing cost** (after hardware)
- **No content restrictions** (LTX 2.3 explicitly has no censorship)
- **Full control** over the generation pipeline
- **Privacy** - nothing leaves your machine

The realistic approach: generate test clips locally, then use a cloud tool (Kling at $6.99/mo) for the final production run.

---

## Recommended Approach for a Musician (April 2026)

### If You Have $0/Month
1. Use **Veo 3.1 free tier** (10 clips/month) for hero shots
2. Run **Wan 2.6 locally** via ComfyUI for bulk clips (if you have 32GB+ RAM Mac)
3. Use **Deforum** for visualizer loops
4. Edit in **DaVinci Resolve** (free)
5. Cut social versions in **CapCut** (free)

### If You Have $10-20/Month
1. **Freebeat** ($9.99/mo) for beat-synced music videos - this is the sweet spot for musicians
2. **Kling 3.0** ($6.99/mo) for supplementary high-res clips
3. Edit in **DaVinci Resolve** (free)

### If You Have $40-60/Month
1. **Neural Frames** ($19-39/mo) for professional beat-synced, stem-analyzed music videos
2. **Kling 3.0** ($6.99/mo) for B-roll
3. **Pika Standard** ($8/mo) for lip-sync performances
4. Edit in **DaVinci Resolve** (free)

### If You Perform Live
1. **REACT by Compeller** for instant audio-reactive visuals (simplest)
2. OR **TouchDesigner** for maximum customization (steepest learning curve)
3. Generate AI video loops using any tool above, import into your live visual rig

---

## Sources

### AI Video Generators (General)
- [Wan 2.5 Open-Source Video with Audio - MindStudio](https://www.mindstudio.ai/blog/what-is-wan-2-5-video-open-source)
- [Wan 2.6 First Open-Source Audio+Video Model](https://blockchain.news/ainews/alibaba-wan-2-6-first-open-source-ai-model-for-generating-video-and-audio-simultaneously-up-to-15-seconds)
- [Kling 3.0 Review: Features, Pricing & Alternatives - Atlas Cloud](https://www.atlascloud.ai/blog/guides/kling-3.0-review-features-pricing-ai-alternatives)
- [Kling 3.0 Complete Guide - InVideo](https://invideo.io/blog/kling-3-0-complete-guide/)
- [Sora 2 Complete Guide 2026 - WaveSpeed](https://wavespeed.ai/blog/posts/openai-sora-2-complete-guide-2026/)
- [Sora Pricing 2026 - MagicHour](https://magichour.ai/blog/sora-pricing)
- [Google Veo Pricing Calculator Apr 2026 - CostGoat](https://costgoat.com/pricing/google-veo)
- [Google Veo 2 Pricing $0.50/sec - eWeek](https://www.eweek.com/news/google-veo-2-pricing/)
- [Runway Gen-4 Guide 2026 - AIToolsDevPro](https://aitoolsdevpro.com/ai-tools/runway-guide/)
- [Runway Gen-4.5 Review 2026](https://aitoolssmarthub.com/runway-gen-4-5-review/)
- [Pika AI Review 2026 - SeedanceVideo](https://seedancevideo.app/blog/pika-ai)
- [Pika AI Review 2026 - WeShop](https://www.weshop.ai/blog/pika-ai-review-2026-still-the-king-of-creative-ai-video-generation/)
- [MiniMax Hailuo 2.3 - MiniMax](https://www.minimax.io/news/minimax-hailuo-23)
- [Hailuo 02 vs Veo 3 - APIDog](https://apidog.com/blog/hailuo-02/)

### Open Source / Local
- [LTX 2.3 Open Source 4K Video Guide - Apatero](https://apatero.com/blog/ltx-2-3-open-source-4k-video-generation-guide-2026)
- [LTX 2.3 Open Source Guide - Zen Van Riel](https://zenvanriel.com/ai-engineer-blog/ltx-2-3-open-source-video-generation-guide/)
- [LTX Video Mac - GitHub](https://github.com/james-see/ltx-video-mac)
- [Best Open Source AI Video Models 2026 - Pixazo](https://www.pixazo.ai/blog/best-open-source-ai-video-generation-models)
- [Wan 2.2 on MacBook/Mac Mini - Medium](https://medium.com/@ttio2tech_28094/macbook-macmini-run-wan-2-2-generating-videos-dd0e32eb91b3)

### Music-Specific Tools
- [Neural Frames AI Music Video Generator](https://www.neuralframes.com/ai-music-video-generator)
- [Neural Frames Pricing](https://www.neuralframes.com/pricing)
- [Neural Frames Product Overview](https://www.neuralframes.com/product)
- [Freebeat AI Music Video Generator](https://freebeat.ai/)
- [6 Best AI Music Video Creation Tools 2026 - AI Journal](https://aijourn.com/6-best-ai-music-video-creation-tools-in-2026/)
- [5 Best AI Music Video Creators 2026 - New Wave Magazine](https://www.newwavemagazine.com/single-post/5-best-ai-music-video-creators-for-musicians-in-2026)
- [Audio-Reactive: Freebeat Ahead - AiToolsBee](https://aitoolsbee.com/news/ai-music-video-creator-review-finds-freebeat-ahead-with-audio-reactive-sync/)

### Lip Sync
- [Best AI Lip Sync Tools 2026 - Barchart](https://www.barchart.com/story/news/37179827/best-ai-lip-sync-tools-for-2026-how-to-choose-the-right-tool)
- [AI Lip-Sync for Music Videos - Soundverse](https://www.soundverse.ai/blog/article/ai-lip-sync-for-music-videos)
- [6 Best AI Lip Sync Tools 2026 - MagicHour](https://magichour.ai/blog/best-ai-lip-sync-tools)
- [Best AI Lip Sync Software 2026 - Vozo](https://www.vozo.ai/blogs/best-lip-sync-software)

### Live Performance
- [TouchDesigner AI Plugins - Derivative](https://derivative.ca/tags/ai)
- [TouchDesigner Audio-Reactive Beginner Guide](https://interactiveimmersive.io/blog/touchdesigner-3d/audio-reactive-visuals-a-beginner-guide/)
- [TouchDesigner for Audio-Visual Performance - Berklee](https://college.berklee.edu/courses/ep-426)
- [REACT by Compeller](https://compeller.ai/react)
- [Audio Reactive Visuals Software Guide](https://audioreactivevisuals.com/audio-reactive-software-guide.html)

### Lyric Videos
- [LyricEdits AI Lyric Video Generator](https://lyricedits.ai)
- [Capify Lyric Video Maker](https://capify.ai/)
- [Neural Frames Lyric Video Maker](https://www.neuralframes.com/lyric-video-maker)

### Workflow & Costs
- [AI Video Generation Cost 2026 - LTX Studio](https://ltx.studio/blog/ai-video-generation-cost)
- [AI Filmmaking Cost Breakdown 2026 - MindStudio](https://www.mindstudio.ai/blog/ai-filmmaking-cost-breakdown-2026)
- [AI Video Costs: Sora vs Veo 3 - VidPros](https://vidpros.com/breaking-down-the-costs-creating-1-minute-videos-with-ai-tools/)
- [CapCut vs DaVinci Resolve 2026 - Flowith](https://flowith.io/blog/capcut-vs-davinci-resolve-tiktok-youtube-shorts-2026/)
- [DaVinci Resolve vs CapCut - MiraCamp](https://www.miracamp.com/learn/davinci-resolve/vs-capcut)

### Viral Examples
- [How Creators Use AI Music Videos to Go Viral 2026 - Soundverse](https://www.soundverse.ai/blog/article/how-creators-are-using-ai-music-videos-to-go-viral-0237)
- [Rise of TikTok-Style AI Music Videos 2026 - Soundverse](https://www.soundverse.ai/blog/article/the-rise-of-tiktok-style-ai-music-videos)
- [I Tested the Best AI Music Video Generators 2026 - FindArticles](https://www.findarticles.com/i-tested-the-best-ai-music-video-generators-in-2026/)

### Deforum
- [Deforum Music Visualizer](https://nickpadd.github.io/DeforumMusicVisualizer/intro.html)
- [Deforum Art](https://deforum.art/)
- [Making a Music Video with SD and Deforum Tutorial](https://plainenglish.io/blog/making-a-music-video-with-stable-diffusion-and-deforum-an-in-depth-tutorial)
