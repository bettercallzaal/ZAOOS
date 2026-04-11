# Doc 321: Suno AI Music Platform - Deep Dive (April 2026)

> Research date: 2026-04-11
> Status: Complete
> Related: Doc 320 (ElevenLabs Music API), Doc 313 (ElevenLabs Voice Changer)

## TL;DR

Suno is the dominant AI music generation platform with 2M paid subscribers and $300M ARR as of February 2026. The latest model (v5.5, March 2026) adds voice cloning ("Voices"), Custom Models, and taste personalization. The platform now functions as a browser-based DAW with 12-stem separation, MIDI export, inpainting, and section replacement. Warner Music settled and partnered; UMG/Sony litigation ongoing. No official public API exists - only third-party wrappers. For musicians, the optimal workflow chains Suno instrumentals with ElevenLabs vocals in a traditional DAW.

---

## 1. Suno v5 and v5.5 - What's New

### v5 (Late 2025)
- 4-minute single-pass generation (up from ~2 min in v4)
- Studio-grade audio at 44.1kHz stereo
- Dramatically improved vocal clarity, instrument separation, reduced artifacts
- Introduced Suno Studio (browser-based DAW)
- ELO benchmark: 1,293 - top of AI music generators

### v5.5 (March 25, 2026)
Three headline features:

1. **Voices** (Pro/Premier only) - Clone your own singing voice. Record or upload 30 seconds to 4 minutes of clean, dry vocals. Live verification step (speak a random phrase) prevents cloning others' voices. Your voice becomes a selectable option when generating. Pairs with delivery tags like [Whispered], [Belted], [Falsetto].

2. **Custom Models** (Pro/Premier only) - Upload 6+ original tracks to fine-tune a private v5.5 model on your harmonic preferences, arrangement habits, instrumentation, and production aesthetic. Up to 3 custom models per subscriber.

3. **My Taste** (All users) - Passive learning system that observes your genre preferences, moods, and activity. Automatically personalizes recommendations and generation defaults over time.

### Quality Assessment
- Virtually eliminated background noise
- More nuanced vocal phrasing and emotional expression
- Stronger dynamic range
- Better instrument separation than v5
- Still struggles with irregular time signatures (5/4, 7/8) - defaults to 4/4

---

## 2. API Access

### Official API
**Suno does NOT have a public, self-serve API.** No API keys in settings, no official developer documentation from Suno itself. This is a significant gap compared to ElevenLabs, which has a full production-grade API with SDKs for Python, JavaScript, React, Swift, and Kotlin.

### Third-Party API Solutions
The gap has spawned a market of third-party API providers:
- **sunoapi.org** - Third-party REST API wrapping Suno's web interface
- **gcui-art/suno-api** (GitHub) - Open-source reverse-engineered API
- **APIPASS** - Managed API service for independent producers
- **AI/ML API** (aimlapi.com) - Aggregator including Suno access

These work by managing pools of authenticated Suno accounts and exposing clean REST endpoints. Performance: ~10-15 seconds for first audio chunk, ~20-30 seconds for complete clip.

### Risks
- Reverse-engineered APIs can break when Suno changes their web app
- Some require handing over your Suno login credentials (security risk)
- Best practice: use providers that issue their own API keys with clear SLAs
- Suno could shut these down at any time

---

## 3. Stem Separation

### Capabilities
- **2-stem mode**: Vocals + Instrumental
- **12-stem mode**: Vocals, Backing Vocals, Drums, Bass, Guitar, Keys, Strings, Brass, Woodwinds, Percussion, Synth, FX

### Quality
- "Surprisingly clean for AI-generated audio" per multiple reviewers
- WAV or MP3 export formats
- Accessible from Library or Workspace via More Actions (...) > Get Stems

### Access
- Available to Pro and Premier subscribers
- Stems from any generated track can be extracted
- Can also be used on uploaded audio (vocal remover functionality)

---

## 4. Voice Cloning - Suno vs ElevenLabs

### Suno Voices (v5.5)
- **Purpose**: Singing voice only (not speech)
- **Input**: 30 seconds to 4 minutes of clean dry vocals, no reverb/effects
- **Best with**: 3-5 minutes total audio
- **Verification**: Live spoken phrase to prevent unauthorized cloning
- **Output**: Your voice singing AI-generated melodies in any genre/style
- **Access**: Pro ($10/mo) or Premier ($30/mo) only
- **Limitation**: Cannot share voices with others (sharing planned for future)

### ElevenLabs Professional Voice Cloning (PVC)
- **Purpose**: Speech synthesis and spoken content
- **Input**: Longer training samples recommended for best quality
- **Quality**: Industry-leading naturalness - captures tone, pacing, emotion, speaking patterns
- **API**: Full programmatic access via production-grade API
- **Use cases**: Narration, podcasts, audiobooks, voiceovers, character voices
- **Licensing**: Commercial use included in paid plans

### Key Difference
Suno clones your voice FOR MUSIC PRODUCTION - it becomes the singer on generated tracks. ElevenLabs clones your voice FOR SPEECH - narration, podcasts, etc. They serve fundamentally different purposes and are complementary, not competitive.

### Best Hybrid Workflow
1. Generate instrumental track in Suno (or use Suno Voices for a rough vocal guide)
2. Extract stems from Suno
3. Generate polished vocal track with ElevenLabs (if speech/narration needed)
4. Combine in a DAW (Ableton, Logic, etc.) for final mix

---

## 5. Suno Studio - The Browser DAW

### Core Editing Features (Pro/Premier)
- **Stem Editor**: View, solo, mute, and edit individual stems
- **6-Band EQ**: Per-stem equalization
- **Warp Markers**: Time-stretch and warp audio (added February 2026)
- **Remove FX**: Strip effects from stems
- **Time Signature Support**: Added February 2026
- **Replace Section (Inpainting)**: Select any section of a song and regenerate just that part while keeping the rest intact. Can tweak lyrics, add new instrumentals, or enhance specific sections.
- **Alternates (Repainting)**: Generate 2-4 alternate versions of a specific verse, chorus, or bridge, audition each, and pick the best one.

### Export Options
- Full track: MP3, WAV
- Individual stems: MP3, WAV, WAV Tempo Locked
- MIDI export per stem (Premier only, costs 10 credits per stem)
- Export range: full track or selected time range

---

## 6. MIDI Export

### How It Works
- Available in Suno Studio (Premier plan only)
- Select a stem > click "Get MIDI" > costs 10 credits
- Studio analyzes the audio and generates a standard MIDI file
- Works for melodic stems (keys, guitar, bass, synth) and rhythmic stems (drums)
- Standard MIDI format - imports into any DAW (Ableton Live, Logic Pro, FL Studio, etc.)

### Use Cases
- Pull chord progressions from AI-generated tracks into your DAW
- Extract drum patterns for editing/customization
- Use AI-generated melodies as starting points for human arrangement
- Build on Suno ideas with real instruments and production

### Limitations
- MIDI is transcribed from audio, not from the model's internal representation
- Accuracy depends on stem complexity - simpler parts transcribe better
- Polyphonic parts may lose some detail

---

## 7. Song Extension

### Extend Feature
- Available on ALL plans (Free, Pro, Premier)
- Extends clips by up to 1 minute per extension
- AI analyzes tempo, tonality, rhythm for stylistically aligned continuation
- Click EXTEND on any clip to create Part 2, then Part 2 to create Part 3, etc.

### Maximum Length
- Premier: chain extensions to 12+ minutes of fully AI-generated content
- Community has pushed to 30+ minutes using extension chains + external editing
- Practical sweet spot: 4-8 minutes for cohesive results

### Stitching
- "Get Whole Song" button stitches all parts into one seamless audio file
- No credits charged for stitching

### Tips
- Extend from points where the song builds momentum, not after natural endings
- Extending from mid-verse produces better continuations than extending from final chorus
- Include structural cues in lyrics: [Bridge], [Outro], [Instrumental Break]

---

## 8. Pricing Breakdown (April 2026)

| Feature | Free | Pro ($10/mo) | Premier ($30/mo) |
|---------|------|-------------|-------------------|
| Credits | 50/day (no rollover) | 2,500/month | 10,000/month |
| Songs (approx) | ~10/day | ~500/month | ~2,000/month |
| Model | v4.5-All | v5, v5.5 | v5, v5.5 |
| Commercial Rights | No | Yes | Yes |
| Download | No (2026 change) | Yes | Yes |
| Voices (clone) | No | Yes | Yes |
| Custom Models | No | Yes (3 max) | Yes (3 max) |
| My Taste | Yes | Yes | Yes |
| Studio | No | Yes | Yes (priority) |
| Stem Separation | No | Yes | Yes |
| MIDI Export | No | No | Yes (10 credits/stem) |
| Replace Section | No | Yes | Yes |
| Annual pricing | N/A | $8/mo ($96/yr) | $24/mo ($288/yr) |
| Cost per song | N/A | ~$0.016 | ~$0.012 |

**2026 change**: Free tier songs are no longer downloadable - playable and shareable only.

---

## 9. Commercial Rights and Legal Landscape

### What Paid Subscribers Get
- Full commercial rights to sell, stream, distribute, and license generated music
- Can upload to Spotify, Apple Music, YouTube, and all platforms
- No revenue share with Suno
- Rights apply only to music made WHILE subscribed

### What You Don't Get
- Suno retains a "worldwide, non-exclusive, royalty-free, sublicensable license" to use outputs for service improvement and promotion
- No indemnification - you bear all legal defense costs if copyright claims arise
- No guarantee outputs won't infringe third-party rights

### Copyright Status (US Law)
- AI-generated music **cannot be registered for copyright** under current US Copyright Office position
- Only "material that is the product of human creativity" qualifies
- Workaround: add substantial human creative contribution (original lyrics, arrangement, remixing in a DAW) to make the work eligible

### Distribution Requirements (2026)
- **DDEX AI Disclosure Standard**: Spotify and Apple Music require flagging AI-generated audio as "Synthetic Content" during upload
- Failure to disclose can result in permanent demonetization
- DistroKid and other distributors have varying AI policies - check before uploading

### Lawsuit Status

| Label | Status | Details |
|-------|--------|---------|
| **Warner Music Group** | SETTLED (late 2025) | Settled lawsuit + signed "landmark" licensing deal. Partnering on "next-generation licensed AI music." |
| **UMG/Concord/ABKCO** | ONGOING | $3B+ lawsuit filed January 2026, targeting 20,000+ songs. Seeking massive damages. |
| **Sony** | UNRESOLVED | Has not settled with Suno or Udio. |

### Post-Warner Deal Changes
- New licensed models coming later in 2026
- Current models will be deprecated when new ones launch
- Free tier loses download capability
- Existing functionality (prompts, uploads, generation) continues unchanged

---

## 10. Best Practices for Prompting

### The 5-Part Formula
1. **Specific genre + subgenre** (e.g., "synth-pop" not just "pop")
2. **Mood + energy level** (e.g., "melancholic, low energy")
3. **Vocal style + character** (e.g., "raspy male vocals, whispered delivery")
4. **Key instruments + production quality** (e.g., "Rhodes piano, 808 drums, lo-fi production")
5. **Tempo/BPM** (e.g., "90 BPM")

### Rules of Thumb
- **8-15 tags total**, sweet spot is 5-8
- **Front-load**: genre and mood first, secondary details after
- **Genre + subgenre determines 60-70% of output**
- **Mood tags are the #2 lever** after genre
- **"Cinematic" is the most versatile modifier**
- **Era + genre combos** produce unique results: "70s funk, modern production"
- Avoid conflicting tags - they create generic compromises, not interesting blends
- Production tags are massively underused - try them

### Structural Tags in Lyrics
Use metatags to control song structure:
- `[Verse]`, `[Chorus]`, `[Bridge]`, `[Outro]`, `[Instrumental Break]`
- `[Whispered]`, `[Belted]`, `[Falsetto]`, `[Spoken Word]` for delivery
- `[Guitar Solo]`, `[Drum Fill]`, `[Build]`, `[Drop]` for instrumental direction

### Common Mistakes (from r/SunoAI)
- Vague prompts cause 70% of tracks to need 3+ regenerations
- Not specifying BPM, key, or genre leads to poor results
- Using prompts that are too long - clarity > length
- Forgetting production tags entirely
- Trying to get irregular time signatures (Suno defaults to 4/4)

---

## 11. Content Policy

### Prohibited Content
- Sexually explicit content (platform is 13+)
- Content targeting minors
- Using other people's songs/lyrics without permission
- Impersonation of specific famous artists (can result in account strikes)
- Content that infringes intellectual property
- Malware, spam, or unlawful content
- Privacy-violating content

### What's Allowed
- Original compositions in any genre
- Your own voice cloned via Voices feature
- Covers/remixes of public domain works
- Genre-inspired prompts (e.g., "in the style of 90s grunge" is fine; "in the style of Kurt Cobain" may get flagged)

---

## 12. Community Tips (r/SunoAI, Discord, Power Users)

### r/SunoAI Community (100,000+ members)
- Generate multiple versions and cherry-pick the best - don't try to get perfection on first try
- Use the Extend feature from momentum points, not endings
- v5.5 Voices + delivery tags = best vocal control available
- For irregular time signatures, use Udio instead
- Keep a prompt library of what works for your preferred genres
- "Treat prompting like producing: listen, tweak, re-run"

### Power User Workflows
1. **Iterative refinement**: Generate > listen > tweak prompt > regenerate. Small changes make big differences.
2. **Section replacement**: Generate full song, then use Replace Section to fix weak parts individually.
3. **Stem extraction for remixing**: Generate in Suno, extract stems, import to DAW, add real instruments/vocals.
4. **MIDI mining**: Generate interesting progressions in Suno, export MIDI, build on them in your DAW with real instruments.
5. **Voice + Custom Model combo**: Clone your voice AND train a custom model on your catalog for most personalized results.

### Distribution Tips
- Always disclose AI generation when uploading to streaming platforms
- Add human elements (lyrics, arrangement, mixing) to strengthen copyright claims
- Use a proper distributor (DistroKid, TuneCore, etc.) - check their AI policies first
- Register with BMI/ASCAP if you add substantial human authorship

---

## 13. Suno + ElevenLabs Integration Workflow

### The Hybrid Production Pipeline

**Step 1: Composition in Suno**
- Generate instrumental arrangement with detailed prompt (genre, mood, instruments, BPM)
- Use Suno Studio to refine - replace weak sections, try alternates
- Export stems (WAV) and MIDI

**Step 2: Vocals via ElevenLabs**
- Use ElevenLabs PVC to clone your voice or create a character voice
- Generate vocal tracks with precise emotional control
- ElevenLabs excels at speech-like delivery, narration, spoken word sections

**Step 3: DAW Assembly**
- Import Suno stems + ElevenLabs vocals into Ableton/Logic/FL Studio
- Mix, master, add effects
- Add human performance elements (real guitar, piano, etc.)
- This human contribution strengthens copyright eligibility

**Step 4: Distribution**
- Export final master
- Upload via distributor with AI disclosure
- Register human-authored elements for copyright

### Why This Works
- Suno's strength: Full song composition, arrangement, instrumental diversity (9 instrument categories)
- ElevenLabs' strength: Voice quality, emotional control, API access, speech synthesis
- DAW's strength: Professional mixing, mastering, human creative control
- Combined: highest quality output with strongest copyright position

---

## 14. Viral and Commercial Success Stories

### Chart Hits
- **"A Million Colors" by Vinih Pray** - Made the TikTok Viral 50 chart
- **"We Are Charlie Kirk" by Splaxema** - Hit #1 on Spotify Viral 50 U.S. (meme song)
- **"I Run" by HAVEN.** - Made Spotify U.S. and Global 50 (used AI for vocal processing only)

### Major Deals
- **Telisha Jones (Mississippi)** - Used Suno to turn poetry into R&B song "How Was I Supposed to Know." Signed $3M record deal with Hallwood Media. Her AI persona "Xania Monet" debuted on Adult R&B Airplay Chart and Hot Gospel Songs chart.

### Platform Scale
- 100 million total signups
- 10 million active users
- 2 million paid subscribers
- $300 million ARR (as of February 2026)
- Dominant market position in AI music generation

### Monetization Models People Are Using
1. **Faceless YouTube music channels** - Generate with Suno, add visualizer, monetize with ads
2. **Sync licensing** - Place AI-generated tracks in videos, games, podcasts
3. **Streaming distribution** - Upload to Spotify/Apple Music via DistroKid
4. **Client work** - Custom jingles, background music for businesses
5. **Sample packs** - Extract stems and sell as production elements
6. **Teaching/courses** - Tutorials on AI music production

---

## Key Takeaways for a Musician Using Suno + ElevenLabs

1. **Subscribe to Suno Pro ($10/mo minimum)** for commercial rights, v5.5 access, Voices, and Studio. Premier ($30/mo) adds MIDI export.
2. **Clone your voice** in Suno Voices for singing, use ElevenLabs PVC for any spoken/narration elements.
3. **Use the 5-part prompt formula** and iterate - don't expect perfection on first generation.
4. **Export stems and MIDI** to your DAW for final production - this also strengthens your copyright position.
5. **Always disclose AI generation** when distributing to streaming platforms.
6. **Add human creative elements** (original lyrics, arrangement, mixing) to improve copyright eligibility.
7. **No official API** - if you need programmatic access, ElevenLabs is the better platform for that.
8. **Watch the legal landscape** - UMG lawsuit ongoing, new licensed models coming later in 2026.

---

## Sources

- [Suno v5.5 Official Blog Post](https://suno.com/blog/v5-5)
- [Suno v5 Complete Guide - HookGenius](https://hookgenius.app/learn/suno-v5-complete-guide/)
- [Suno v5.5 Guide: Voices, Custom Models & My Taste - HookGenius](https://hookgenius.app/learn/suno-v5-5-guide/)
- [Suno v5.5 - What's New - TrackWasher](https://www.trackwasher.com/suno-v5-5)
- [Suno v5.5 Voice Cloning Tutorial - MindStudio](https://www.mindstudio.ai/blog/suno-5-5-voice-cloning-ai-music)
- [Suno v5.5 Launch - MusicTech](https://musictech.com/news/gear/suno-v5-5/)
- [Suno v5.5 Launch - Music Business Worldwide](https://www.musicbusinessworldwide.com/suno-launches-v5-5-ai-model-with-voice-capture-and-personalization-features/)
- [Suno Pricing - CostBench](https://costbench.com/software/ai-music-generators/suno/)
- [Suno Pricing Guide - MargaBagus](https://margabagus.com/suno-pricing/)
- [Suno Commercial Rights Guide - Terms.Law](https://terms.law/ai-output-rights/suno/)
- [Suno Stem Separation - Help Center](https://help.suno.com/en/articles/6141441)
- [Suno Studio Guide - TLDL](https://www.tldl.io/blog/suno-v5-studio-guide-2026)
- [Suno MIDI Export Guide - Genx Notes](https://blog.genxnotes.com/en/suno-midi-export/)
- [Suno API Review - AI/ML API](https://aimlapi.com/blog/suno-api-review)
- [Suno Prompt Guide 2026 - HookGenius](https://hookgenius.app/learn/suno-prompt-guide-2026/)
- [Suno Style Tag Research - HookGenius](https://hookgenius.app/learn/suno-style-tag-research/)
- [Warner Music + Suno Settlement - Rolling Stone](https://www.rollingstone.com/music/music-features/suno-warner-music-group-ai-music-settlement-lawsuit-1235472868/)
- [Warner Music + Suno Settlement - Billboard](https://www.billboard.com/pro/suno-warner-music-sign-ai-licensing-deal-settle-lawsuit/)
- [Suno Lawsuits 2026 Overview - Undetectr](https://undetectr.com/blog/suno-udio-lawsuits-2026)
- [Suno 2M Subscribers, $300M ARR - TechCrunch](https://techcrunch.com/2026/02/27/ai-music-generator-suno-hits-2-million-paid-subscribers-and-300m-in-annual-recurring-revenue/)
- [Suno vs ElevenLabs Comparison - AIRadarTools](https://airadartools.com/comparisons/suno-vs-elevenlabs/)
- [Suno vs ElevenLabs Music - Undetectr](https://undetectr.com/blog/suno-vs-elevenlabs-music)
- [r/SunoAI Community Advice - AIToolDiscovery](https://www.aitooldiscovery.com/guides/suno-ai-reddit)
- [Suno Community Guidelines](https://suno.com/community-guidelines)
- [Suno Song Extension Guide - Soundverse](https://www.soundverse.ai/blog/article/how-to-extend-songs-using-suno-ai-1059)
