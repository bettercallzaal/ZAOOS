# 319 - AI Music Creation Platforms: Multi-Output Song Production

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Compare AI music platforms for maximum customizability when creating original songs (like "The Summer of 26"), each producing a different output that gets uploaded to ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary vocal track** | USE Suno v5 ($10/mo Pro) - best vocals, lyrics control, full song in 30-60 seconds, stems export, commercial rights on paid plan |
| **Production/instrumental version** | USE Udio ($10/mo Standard) - superior instrumental layering, inpainting to fix sections, remix to shift genres, stem separation, 320kbps output |
| **Open-source / self-hosted** | USE ACE-Step v1.5 XL (already integrated in ZAO OS) - MIT licensed, LoRA fine-tuning for personal style, runs on <4GB VRAM, free forever |
| **Orchestral/cinematic remix** | USE AIVA ($15/mo Standard) - MIDI export for DAW editing, emotional presets, best classical/orchestral AI, copyright ownership on $49/mo Pro |
| **Voice cloning / custom vocals** | USE ElevenLabs ElevenMusic (free, 7 songs/day) - voice cloning from seconds of audio, 32+ languages, commercially safe model |
| **Background/mood version** | USE Soundraw ($16.99/mo) - granular tempo/instrument/length control, royalty-free, unlimited generation, no attribution needed |
| **Stem separation** | USE LALAL.AI ($7.50/mo Lite) - 6-stem isolation (vocals, drums, bass, guitar, synth, strings), DAW plugin available |
| **Distribution** | USE existing SongSubmit flow at `src/components/music/SongSubmit.tsx` - each platform's output becomes a separate submission with genre tags |
| **Don't bother with** | SKIP Boomy (3-min cap, limited control), SKIP Mubert (no vocals, ambient-only), SKIP Google MusicFX (experimental, no export control) |

## The "Summer of 26" Multi-Platform Strategy

The idea: write ONE song concept, feed it to 5-6 platforms, get radically different outputs. Each platform interprets the same lyrics/prompt differently. Upload all versions to ZAO OS as a collection.

### Workflow

```
1. Write lyrics + concept for "The Summer of 26"
2. Generate on each platform with the SAME lyrics but platform-tuned prompts
3. Separate stems with LALAL.AI where needed
4. Upload each version to ZAO OS via SongSubmit (tag: "Summer of 26 Collection")
5. Let the community vote with Respect on their favorite version
6. Optionally: combine best stems from different platforms in a DAW for a "super cut"
```

### Per-Platform Prompt Strategy

| Platform | Prompt Approach | Expected Output |
|----------|----------------|-----------------|
| **Suno** | Full lyrics with [Verse]/[Chorus] tags + "summer anthem, uplifting, 120 BPM, warm synths" | Complete vocal track, radio-ready |
| **Udio** | Same lyrics + "electronic production, layered pads, crisp drums, festival energy" | Production-forward version, cleaner instrumentals |
| **ACE-Step** (ZAO OS) | Same lyrics + genre tags via existing UI at `/api/music/generate` | Raw/indie version, unique character |
| **AIVA** | Instrumental prompt: "orchestral summer theme, hopeful, building crescendo" | Cinematic instrumental, MIDI exportable |
| **ElevenMusic** | Same lyrics + voice style description | Custom vocal character version |
| **Soundraw** | Mood: uplifting, Genre: pop/electronic, Tempo: 120 BPM | Clean background/instrumental version |

## Comparison of All Platforms

| Platform | Price/mo | Vocals | Lyrics Input | Stems | Max Duration | Commercial Rights | API | Customization Level |
|----------|----------|--------|-------------|-------|-------------|-------------------|-----|-------------------|
| **Suno v5** | $0/10/30 | Yes (best) | Yes, structured tags | Yes | 8 min | Paid plans | No (3rd party ~$19/mo) | High - genre, mood, tempo, instruments, vocal style |
| **Udio** | $0/10/30 | Yes (good) | Yes | Yes (downloads paused?) | 4 min | Paid plans | No | Very high - inpainting, remix, 30s extensions |
| **ACE-Step 1.5** | Free | Yes | Yes | Via LALAL.AI | 10 min | MIT license (you own it) | Yes (HuggingFace Gradio) | Highest - LoRA training, local model, full control |
| **ElevenMusic** | Free (7/day) | Yes (clone) | Yes | No | ~4 min | Yes (licensed data) | Coming | High - voice cloning, multilingual |
| **AIVA** | $0/15/49 | No | No | MIDI export | Unlimited | Pro plan ($49) | Yes | Medium - emotional presets, MIDI editing |
| **Soundraw** | $16.99 | No | No | Limited | Unlimited | All plans | No | High - tempo, instruments, length, energy curve |
| **Loudly** | $5.99 | No | No | Yes | Unlimited | All plans | Limited | Medium - genre, mood, 30+ genres |
| **Boomy** | $0/9.99/29.99 | Limited | No | No | 3 min | All plans | No | Low - one-click generation |
| **Beatoven.ai** | $0/20/50 | No | No | Limited | Unlimited | All plans | Yes (higher tiers) | High - emotion-based, video sync |
| **Stable Audio** | Free/paid | No | No | Premium only | 3 min | Premium only | Yes | Medium - text prompt, audio-to-audio |

## Platform Deep Dives

### Suno v5 (Primary Recommendation)

**Why it wins for "Summer of 26":**
- Write full lyrics with `[Verse 1]`, `[Chorus]`, `[Bridge]` structure tags
- v5 vocals sound human - convey tone, emotion, depth
- Studio-grade production across every genre
- Stem export lets you pull just the vocals or just the beat
- 8-minute max means full song, not just a clip
- Settled copyright lawsuit with Warner Music (late 2025) - building licensed models

**Pricing (2026):**
- Free: 50 credits/day (~5 songs), non-commercial, watermarked
- Pro: $10/mo (2,500 credits/mo), commercial rights
- Premier: $30/mo (10,000 credits/mo), commercial rights
- Credits don't roll over month-to-month; top-up credits don't expire but need active sub

**Limitations:** No official public API (3rd-party wrappers exist at ~$19/mo via Apiframe). Downloads paused during some licensing transitions.

### Udio (Best for Production Quality)

**Why it complements Suno:**
- Timeline-style editing (more DAW-like)
- Inpainting: re-generate specific sections without starting over
- 30-second incremental extensions for precise structure
- Remix: change genre while keeping melody intact
- 320kbps high-fidelity output
- Strong on electronic, experimental, and layered arrangements

**Pricing (2026):**
- Free: 10 credits/day + 100/mo
- Standard: $10/mo
- Pro: $30/mo, full commercial rights

**Warning:** Udio temporarily disabled all downloads (audio, video, stems) during a 2025-2026 licensing transition. Check current status before paying.

### ACE-Step 1.5 XL (Already in ZAO OS)

**Why it's the wild card:**
- Already integrated at `src/app/api/music/generate/route.ts` using `@gradio/client`
- MIT licensed - you own everything generated, no licensing concerns ever
- LoRA fine-tuning: train on a few of YOUR songs to capture your style
- Runs locally on <4GB VRAM (RTX 3090: <10 seconds, A100: <2 seconds)
- Text-to-music, cover generation, audio repainting, vocal-to-BGM
- Released April 2, 2026 (v1.5 XL) - actively developed

**Current ZAO OS integration:**
- UI: `src/components/music/AiMusicGenerator.tsx` - prompt, lyrics, genre pills, duration slider
- API: `src/app/api/music/generate/route.ts` - Gradio client to HuggingFace Space
- Requires `HF_TOKEN` env var (falls back to mock mode without it)
- Turbo mode: 8 inference steps, euler scheduler, APG cfg
- Duration: 10-120 seconds currently (model supports up to 10 min)

**Upgrade opportunity:** The current integration uses the hosted HuggingFace Space. For "Summer of 26", upgrade to local or dedicated hosting for:
- No queue wait times
- LoRA fine-tuning with Zaal's style
- Full 10-minute generation
- Batch generation of multiple versions

### ElevenLabs ElevenMusic (Voice Cloning Edge)

**Why it's unique:**
- Launched April 1, 2026 as standalone music app
- Free: 7 songs/day (generous)
- Voice cloning from seconds of sample audio
- Commercially safe - trained on licensed data (Merlin + Kobalt deals)
- 32+ language support for multilingual versions
- Part of the $11B ElevenLabs ecosystem (Series C, Feb 2026)

**"Summer of 26" use case:** Clone your own voice (or a specific vocal style) and have ElevenMusic sing your lyrics in that voice. No other platform offers this level of vocal identity control for free.

### AIVA (Cinematic Version)

**Why it exists in this lineup:**
- Best orchestral/classical AI - deep structural understanding of symphonic composition
- MIDI export means you can edit every note in a DAW
- Emotional presets (happy, sad, epic, tender) for quick mood setting
- Full DAW integration
- Pro plan ($49/mo) gives you actual copyright ownership

**"Summer of 26" use case:** Generate an orchestral arrangement of the song's chord progression. Export MIDI. Layer under the Suno/Udio vocal version for a cinematic remix.

## Stem Separation for Post-Production

After generating on each platform, use stem separation to mix and match:

| Tool | Price | Stems | Quality | Best For |
|------|-------|-------|---------|----------|
| **LALAL.AI** | $7.50/mo | 6 (vocal, drum, bass, guitar, synth, strings) | Best in class | Production-grade separation |
| **Moises.ai** | $3.99/mo | 5 | Good | Musicians, practice tool |
| **Spleeter** (Deezer) | Free (open source) | 2-5 | Decent | Developers, batch processing |
| **Splitter.ai** | Free tier | 4 | Good | Quick one-off separations |

**Strategy:** Generate vocal track on Suno, instrumental on Udio, orchestral on AIVA. Separate stems. Combine best vocals + best production + orchestral accents in a DAW for a "Frankenstein" master version.

## ZAO OS Integration

### Current State

- AI generation: `src/components/music/AiMusicGenerator.tsx` + `src/app/api/music/generate/route.ts` (ACE-Step only)
- Song submission: `src/components/music/SongSubmit.tsx` - URL-based submission with genre tags
- Music player: 9-platform support in `src/providers/audio/PlayerProvider.tsx`
- Upload flow: submit URL + title + artist + note + tags via `POST /api/music/submissions`

### How Multi-Platform Outputs Get Into ZAO OS

Each platform generates a downloadable file. The flow:

1. Generate on Suno/Udio/ElevenMusic/etc (external platforms)
2. Download the output (MP3/WAV)
3. Host the file (Arweave for permanence per Doc 152, or IPFS, or simple CDN)
4. Submit the hosted URL via SongSubmit with metadata:
   - Title: "The Summer of 26 (Suno Version)"
   - Tags: `["Summer of 26", "AI Generated", "Suno"]`
   - Note: "Suno v5 vocal version - full lyrics"
5. For ACE-Step: already generates in-app, just needs a "save to library" button

### Future Enhancement: Multi-Platform Generator UI

Extend `AiMusicGenerator.tsx` to support multiple backends:

```typescript
const BACKENDS = [
  { id: 'ace-step', name: 'ACE-Step v1.5', type: 'internal', endpoint: '/api/music/generate' },
  { id: 'suno', name: 'Suno v5', type: 'external', url: 'https://suno.com' },
  { id: 'udio', name: 'Udio', type: 'external', url: 'https://udio.com' },
  { id: 'elevenlabs', name: 'ElevenMusic', type: 'external', url: 'https://elevenlabs.io' },
] as const;
```

Internal backends generate via API. External backends open in a new tab with pre-filled prompt copied to clipboard. All outputs converge back into the SongSubmit flow.

## Cost Analysis for "The Summer of 26" Project

| Platform | Plan Needed | Monthly Cost | Songs for the Project |
|----------|-------------|-------------|----------------------|
| Suno Pro | Pro | $10 | ~250 songs (plenty of iterations) |
| Udio Standard | Standard | $10 | ~100 songs |
| ACE-Step | Free (HF Space) | $0 | Unlimited |
| ElevenMusic | Free | $0 | 7/day = ~210/month |
| AIVA Standard | Standard | $15 | 15 downloads |
| Soundraw Personal | Personal | $16.99 | Unlimited |
| LALAL.AI Lite | Lite | $7.50 | Sufficient for stems |
| **Total** | | **$59.49/mo** | More than enough |

**Budget option ($10/mo):** Suno Pro only + ACE-Step (free) + ElevenMusic (free) = 3 distinct versions for $10.

**Full creative exploration ($59.49/mo):** All 6 platforms + stem separation = maximum variety.

## Action Items

- [ ] Set `HF_TOKEN` env var to activate ACE-Step generation in ZAO OS
- [ ] Write "The Summer of 26" lyrics with [Verse]/[Chorus]/[Bridge] structure
- [ ] Sign up for Suno Pro ($10/mo) - generate the primary vocal version
- [ ] Test Udio download status before paying (downloads were paused)
- [ ] Generate ElevenMusic version with voice cloning (free, 7/day)
- [ ] Generate ACE-Step version through ZAO OS UI (already built)
- [ ] Optionally: AIVA orchestral arrangement for cinematic remix
- [ ] Upload all versions to ZAO OS via SongSubmit with "Summer of 26 Collection" tag
- [ ] Future: extend AiMusicGenerator.tsx to support multi-backend generation

## Sources

- [Suno - Official](https://suno.com/)
- [Suno Pricing](https://suno.com/pricing)
- [Udio - Official](https://www.udio.com/)
- [Udio Pricing](https://www.udio.com/pricing)
- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [ACE-Step 1.5 Complete Guide](https://dev.to/czmilo/ace-step-15-the-complete-2026-guide-to-open-source-ai-music-generation-522e)
- [ElevenLabs ElevenMusic Launch (TechCrunch)](https://techcrunch.com/2026/04/02/elevenlabs-releases-a-new-ai-powered-music-generation-app/)
- [ElevenLabs Music Docs](https://elevenlabs.io/docs/creative-platform/products/music)
- [AIVA - Official](https://aiva.ai/)
- [Soundraw - Official](https://soundraw.io/)
- [LALAL.AI - Stem Separation](https://www.lalal.ai/)
- [Best AI Music Generators 2026 (WaveSpeed)](https://wavespeed.ai/blog/posts/best-ai-music-generators-2026/)
- [Best AI Music Generators 2026 (SoundGuys)](https://www.soundguys.com/best-ai-music-generators-134781/)
- [AI Music Generators Comparison 2026 (360ia)](https://www.360ia.online/en/post/ai-music-generators-complete-comparison-guide-2026)
- [Suno API Review (AIML API)](https://aimlapi.com/blog/suno-api-review)
