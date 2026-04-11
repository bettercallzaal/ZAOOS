# Doc 322: Kits.AI - Singing Voice Conversion Platform

**Date:** 2026-04-11
**Category:** AI Music Production
**Status:** Research Complete
**Context:** Evaluating Kits.AI as a singing-specific voice conversion tool for a musician who has an ElevenLabs Professional Voice Clone (1hr 21min training data) but needs better singing conversion than ElevenLabs Voice Changer provides.

---

## 1. What Kits.AI Does

Kits.AI is a web-based AI music platform purpose-built for **singing voice conversion** (SVC). Unlike ElevenLabs, which focuses on speech/narration, Kits is designed specifically for music production workflows.

**Core capabilities:**
- **Voice Conversion (KVC):** Upload a vocal recording, convert it to sound like a different voice while preserving words, phrasing, rhythm, tone, and emotional delivery
- **Voice Cloning:** Train a custom AI voice model from your own vocal recordings (3 methods: Instant, Guided, Professional)
- **Vocal Isolation:** Separate vocals from instrumentals (stem splitting)
- **AI Mastering:** Master vocal outputs directly in-browser
- **Pitch Editing:** MIDI-style pitch editor for fine-tuning converted vocals
- **Voice Blending:** Fuse two voice models to create hybrid tones
- **Instrumental Voices:** Convert sung/hummed melodies into guitar, bass, saxophone, cello
- **Multi-Model Conversion:** Apply up to 5 different voices to the same vocal simultaneously
- **150+ royalty-free stock voices** across genres (R&B, Pop Punk, Jazz, Broadway, Lo-fi, Cloud Rap, etc.)

**What makes it music-specific:**
- Accepts mixed audio with instruments and backing vocals (can auto-isolate)
- Pre-processing: noise reduction, EQ before conversion
- Post-processing: compressor, chorus, reverb, delay
- 24-semitone pitch shifting
- Conversion strength and volume blend controls
- Stock voices named by genre/timbre ("Male Gritty Rock," "Female Jazz")

---

## 2. The Hybrid Pitch Algorithm

Kits developed a proprietary pitch detection algorithm called **Kits Hybrid Pitch** that is central to why it handles singing better than alternatives.

**How it works:**
- Custom F0 (fundamental frequency) detection algorithm
- Outperforms standard pitch detection systems: Crepe, RMVPE, and Mangio-Crepe
- Results in cleaner note transitions and more stable pitch handling across a singer's full range
- Critical for singing because pitch detection accuracy directly determines conversion quality - if the system misreads a note, the output sounds off-key

**Why this matters vs ElevenLabs:**
ElevenLabs Voice Changer was designed for speech, where pitch variation is relatively narrow and predictable. Singing involves rapid pitch changes across a wide range, vibrato, melisma, belting, falsetto - all of which demand specialized pitch tracking. Kits Hybrid Pitch was built specifically for these singing characteristics.

---

## 3. KVC (Kits Voice Conversion) - Technical Architecture

KVC is Kits' flagship voice conversion model, distinct from open-source alternatives:

**Content Encoding:**
- Integrates ContentVec plus advanced encoders like Xeus and hybrid systems
- Improves pronunciation quality over standard HuBERT-based approaches

**Adaptive Content Feature Retrieval:**
- Unlike RVC which uses fixed retrieval strength, KVC applies retrieval strength **adaptively** based on feature alignment
- Results in higher speaker similarity while preserving phonemic content
- This is the key technical differentiator from RVC

**Training Data:**
- Base weights trained on a **proprietary singing-optimized dataset** (not speech data like open-source alternatives)
- Dataset sourced from individual vocalists who are compensated for rights (Fairly Trained certified)
- Produces fuller, clearer notes across and even beyond the range of a singer

**Inference Pipeline:**
- Automatic EQ adjustment during both training and inference
- Automatic pitch correction (Auto-Tune-inspired, optional)
- Stylistic effects: stereo widening, reverb built into the pipeline
- Intelligent slicing: trains on longer phrases without cutting words mid-sentence
- Adaptive noise removal for breath/noise artifacts
- Post-processing for vocal energy, volume stability, sonic clarity

---

## 4. Training a Voice Model on Kits.AI

Three cloning methods available:

### Instant Voice Cloning (IVC)
- **Audio needed:** 15-30 seconds of dry vocal audio
- **Training time:** Seconds (near-instant)
- **Quality:** Good for quick demos, lower quality than Professional
- **Available on:** Starter plan and above

### Guided Voice Cloning
- **Process:** 5-minute guided recording session directly on the website
- **Training time:** Minutes
- **Quality:** Better than Instant, good for quick custom voices

### Professional Voice Cloning
- **Audio needed:** 10-60 minutes (30 minutes recommended)
- **File format:** 16-bit lossless WAV preferred, mono, consistent -12dB level, peaks no higher than -6dB
- **File size limit:** 200 MB maximum training data
- **Training time:** 30 minutes to multiple hours depending on dataset size
- **Available on:** Producer plan ($30/mo) and above

### Training Data Best Practices
- Use **dry vocals only** - no reverb, delay, modulation, or effects
- Monophonic (one note at a time) - no harmonies, layering, double-tracking, stereo effects
- Span a **wide range of pitches, dynamics, and delivery styles** - soft passages to full-energy belts
- Do NOT apply pitch correction to training data - it locks the model into processed styles
- Minimize background noise (fans, AC, room reflections)
- Include diverse vocal delivery: breathy, powerful, staccato, legato

### Singing Samples vs Speaking Samples
The platform is optimized for singing. Training data should be **singing samples**, not speaking. The KVC base weights are trained on singing data, so feeding it singing samples will produce the best results. Speaking samples would be suboptimal for a singing voice model.

### Relevance for ElevenLabs User
With 1hr 21min of training data already recorded for ElevenLabs, this could potentially be repurposed for Kits.AI Professional Voice Cloning IF:
- The audio is dry (no effects/processing baked in)
- It's singing, not speaking
- It's monophonic
- It can be exported as mono WAV

If the ElevenLabs training data was speaking samples, new singing-specific recordings would be needed for optimal Kits results.

---

## 5. Quality Comparison: Kits.AI vs ElevenLabs for Singing

### Where Kits.AI Wins for Singing
- **Purpose-built for singing** - ElevenLabs is fundamentally a speech tool
- **Hybrid Pitch algorithm** handles note transitions, vibrato, and range far better
- **Pre/post-processing** designed for music production (EQ, compressor, reverb, delay)
- **Pitch shifting** up to 24 semitones - ElevenLabs has no equivalent
- **Mixed audio support** - can process vocals within a full mix
- **Vocal isolation** built in - strip instrumentals before conversion
- **Genre-specific voices** - stock library organized by musical genre

### Where ElevenLabs Wins
- **Speaking/narration** quality is superior for non-singing use cases
- **Multilingual support** - 70+ languages for speech
- **Real-time streaming** API for speech applications
- **Text-to-speech** is more mature and higher quality
- **Larger ecosystem** for developer integrations

### Honest Quality Assessment (User Reports)
Mixed reviews exist. Common praise:
- Voice conversion preserves phrasing and rhythm well
- Quick turnaround for AI covers
- Instrumental voices are a unique creative tool

Common complaints:
- Some users report robotic/unnatural outputs lacking emotional depth
- Voice cracking and distortion on certain notes
- Inconsistent quality across different voice models
- Platform has removed community features and added paywalls over time
- Download failures and mastering tool outages reported

**Bottom line:** For singing specifically, Kits.AI is the better tool compared to ElevenLabs Voice Changer. But it's not magic - results depend heavily on input quality, model quality, and settings optimization.

---

## 6. API Access

Kits.AI offers a developer API for integration into web apps and products.

### Available API Endpoints
| Endpoint | Methods | Description |
|----------|---------|-------------|
| Voice Conversion | POST, GET | Create and fetch voice conversion jobs |
| Voice Model | GET | Fetch available voice models |
| Voice Blender | POST, GET | Create and fetch voice blending jobs |
| Vocal Separation | POST, GET | Create and fetch vocal separation jobs |
| Stem Splitter | POST, GET | Create and fetch stem splitting jobs |

### API Details
- **Authentication:** API key in request headers (generate at app.kits.ai/api-access)
- **Architecture:** Async job-based - submit a job, poll for completion
- **Deprecated:** Text-to-speech API removed as of September 22, 2025
- **Rate limits:** Exist but not publicly documented; contact support to increase
- **Pricing:** Starts at $14.99/month for API access (separate from consumer plans)
- **Documentation:** https://docs.kits.ai/api-reference/introduction/getting-started

### Unofficial Python Package
An unofficial Python wrapper exists on GitHub (blaisewf/kitsai) though the repo may not be actively maintained.

### Integration Feasibility
The API is job-based (not real-time streaming), so it's suitable for:
- Upload vocal file, get converted file back
- Batch processing workflows
- Background conversion in a web app

NOT suitable for:
- Real-time voice changing during live performance
- Low-latency interactive applications

---

## 7. Pricing (as of April 2026)

| Plan | Price/mo | Annual | Conversions | Voice Slots | Download Min/mo |
|------|----------|--------|-------------|-------------|-----------------|
| **Free** | $0 | - | 15 min | 0 custom | 0 |
| **Starter** | $10 | $8/mo | Unlimited | 2 | 15 |
| **Producer** | $30 | $24/mo | Unlimited | Unlimited | 60 |
| **Professional** | $60 | $48/mo | Unlimited | Unlimited | Unlimited |

**Key details:**
- Free tier: Can convert but cannot download results
- "Download minutes" = the actual currency - conversions are unlimited on paid plans, but downloading costs minutes
- Unused download minutes roll over to next month
- Unlimited plans operate under fair use principles
- Custom voices freeze (not delete) if subscription lapses - accessible on renewal
- Vocal Remover, Stem Splitter, AI Mastering tools are free to use (but no downloads on free tier)
- API access starts at $14.99/month (separate pricing)

**For the use case described:** Producer plan ($30/mo) is the sweet spot - unlimited voice slots for Professional Voice Cloning, 60 download minutes/month. Professional ($60/mo) only if download volume is high.

---

## 8. 24-Semitone Pitch Shifting

Kits allows raising or lowering pitch by up to **24 semitones** (2 full octaves up or down).

**What this enables:**
- **Gender-swap vocals:** Shift male vocals up ~5-7 semitones for female range (or vice versa)
- **Key matching:** Adjust converted vocals to match a different instrumental key without re-recording
- **Creative effects:** Extreme pitch shifts for stylistic purposes (chipmunk, deep bass, etc.)
- **Range extension:** A baritone can be shifted to tenor range, or a soprano to alto
- **Harmony generation:** Shift the same vocal to create harmonies at different intervals

**In the production chain:** After voice conversion, pitch shift lets you place the converted vocal in any key. This is especially useful when converting a vocal recorded in one key to match an instrumental in a different key.

---

## 9. Conversion Strength Control

**What it is:** A slider that determines how much the output sounds like the target AI voice vs the original input voice.

**Settings guidance:**
- **Low conversion strength:** More of the original voice characteristics bleed through. Sounds more "natural" but less like the target voice.
- **Medium (recommended starting point):** Good balance between target voice similarity and natural sound.
- **High conversion strength:** More accent, articulation, and character of the AI voice. Can increase mispronunciations and artifacts.

**Volume Blend** (companion control):
- Lower blend = preserves dynamics of original recording (more natural feel)
- Higher blend = smoother, more polished output (more processed feel)

**Optimization for natural results:**
1. Start at medium conversion strength
2. Use high-quality, dry input vocals
3. Adjust volume blend to match the dynamic style you want
4. If artifacts appear, lower conversion strength
5. Use post-processing effects (subtle reverb, compression) to smooth remaining artifacts

---

## 10. Production Chain: Raw Vocals to Finished Track

**Yes, you can chain: Record raw vocals -> Kits.AI conversion -> mix with AI instrumental.**

### Recommended Workflow

1. **Record raw vocals** - dry, no effects, good mic technique, -12dB level
2. **Upload to Kits.AI** - or paste YouTube link if working from existing material
3. **Vocal isolation** (if needed) - use Kits' built-in Vocal Remover to strip instrumentals
4. **Voice conversion** - select target voice model, adjust pitch shift, conversion strength, volume blend
5. **Pitch editing** - fine-tune specific notes with the MIDI-style pitch editor
6. **Post-processing** - apply compressor, chorus, reverb, delay within Kits
7. **Download** converted vocal file
8. **Mix in DAW** - import converted vocal into your DAW alongside AI instrumental (from Suno, Udio, etc.)
9. **Final mastering** - either in DAW or use Kits' AI Mastering tool

### Multi-voice workflow
You can convert the same vocal through up to 5 different voice models simultaneously, then layer them for harmonies or pick the best result.

### Instrumental conversion trick
Sing/hum a melody, then convert it to guitar, bass, sax, or cello using Kits' instrumental voice models. This creates instant instrumentals from vocal input.

---

## 11. How AI Cover Creators Use Kits.AI

The YouTube AI covers community uses Kits.AI in a standard pipeline:

### Typical Workflow
1. **Find source song** on YouTube
2. **Paste YouTube URL** into Kits Studio - it auto-downloads and extracts vocals
3. **Select target voice** from library or use a trained clone
4. **Convert vocals** with optimized settings
5. **Download converted vocal** and original instrumental (from stem split)
6. **Mix in DAW** - align converted vocal with instrumental
7. **Upload to YouTube** as "AI Cover - [Artist] sings [Song]"

### Why Kits.AI is Popular for This
- YouTube URL input makes it frictionless
- Built-in vocal isolation means no need for separate tools (like LALAL.AI or Demucs)
- 150+ stock voices cover popular genres
- Multi-model conversion lets creators try multiple voices quickly
- Royalty-free stock voices avoid licensing issues (for non-commercial/fair use content)

### Limitations for Cover Creators
- Download minute limits on lower tiers restrict volume
- Artist-licensed voices require approval for commercial use
- Quality varies significantly by voice model

---

## 12. Latency and File Size Limits

### File Size
- **Training data:** 200 MB maximum
- **Conversion input:** No publicly documented hard limit, but large files take longer to upload and process
- **Output format:** Standard audio files (WAV, MP3)

### Processing Time
- **Instant Voice Clone:** Seconds
- **Professional Voice Clone training:** 30 minutes to several hours
- **Voice conversion:** Minutes for a typical song-length file (varies by server load)
- **Vocal separation:** Minutes

### Latency Considerations
- All processing is **cloud-based and asynchronous** - not real-time
- No progress indicators for training (user complaint)
- Processing speed varies by time of day (server load)
- API is job-based: submit, poll, retrieve - not streaming
- Multi-file conversion (up to 5 simultaneous) speeds up batch workflows

---

## 13. Commercial Rights

### Custom Voice Clones (Your Own Voice)
- **Full ownership:** You retain 100% ownership and usage rights over all outputs
- **Royalty-free:** No royalties owed to Kits.AI
- **Commercial use:** Yes, you can sell music made with your own voice clone

### Stock Voice Library (150+ voices)
- **Royalty-free:** Cleared for commercial use
- **No approval needed:** Use freely in commercial releases
- **No attribution required**

### Official Artist Licensed Library
- **Requires artist approval** for commercial use
- Must register your output on the Artist's AI Model page
- Artist receives revenue share
- Non-commercial/personal use is fine without approval

### Bottom Line for the Use Case
If you clone your own voice on Kits.AI and use it for voice conversion, you can sell the resulting music with no restrictions. This is the cleanest path for commercial music production.

---

## 14. Alternatives to Kits.AI for Singing Voice Conversion

### RVC (Retrieval-based Voice Conversion) - Open Source
- **Pros:** Free, 4GB VRAM minimum, large community, many pre-trained models available, user-friendly
- **Cons:** Requires local GPU, no cloud option, less polished than Kits, fixed retrieval strength
- **Best for:** Budget-conscious producers with a decent GPU who want full control
- **Quality:** Very good for singing, large community of model trainers
- **Status:** Actively maintained, most popular open-source SVC tool

### SoVITS (SoftVC VITS) - Open Source
- **Pros:** Different architecture from RVC, some users prefer its tonal quality
- **Cons:** Officially discontinued/archived, 10GB VRAM minimum, community forks vary in quality
- **Best for:** Users who want an alternative to RVC's sound character
- **Status:** Archived, community forks still maintained

### Diff-SVC - Open Source
- **Pros:** Diffusion-based approach can produce high-quality results
- **Cons:** Slower inference than RVC, less community support, more complex setup
- **Status:** Less actively developed than RVC

### Respeecher - Enterprise
- **Pros:** Highest quality voice cloning available, used in Hollywood film/TV
- **Cons:** Enterprise pricing ($5,000-50,000+), project-based pricing, overkill for indie music
- **Best for:** Film/TV/gaming studios, not practical for everyday music production
- **Has singing support:** Yes, with dedicated music production features

### Voice-Swap - Music-Focused
- **Pros:** Purpose-built for musicians, similar concept to Kits
- **Cons:** Smaller voice library, less market presence
- **Website:** voice-swap.ai

### Jammable - Consumer AI Covers
- **Pros:** Easy-to-use AI cover generator, quick results
- **Cons:** Less control than Kits, more consumer-oriented than producer-oriented

### Revocalize AI - Studio-Level
- **Pros:** Studio-level AI voice generation and music tools
- **Cons:** Newer entrant, less established

### Comparison Matrix

| Tool | Type | Singing Focus | Price | Ease of Use | Quality |
|------|------|--------------|-------|-------------|---------|
| **Kits.AI** | Cloud SaaS | Yes | $10-60/mo | High | Good |
| **RVC** | Local/Open Source | Yes | Free | Medium | Very Good |
| **SoVITS** | Local/Open Source | Yes | Free | Low | Good |
| **Diff-SVC** | Local/Open Source | Yes | Free | Low | Good |
| **Respeecher** | Enterprise | Yes | $5K+ | Medium | Excellent |
| **Voice-Swap** | Cloud SaaS | Yes | Varies | High | Good |
| **Jammable** | Cloud Consumer | Yes | Free/Paid | Very High | Moderate |
| **ElevenLabs** | Cloud SaaS | No (speech) | $5-99/mo | High | Poor for singing |

---

## Recommendation for the Use Case

Given: A musician with a Professional Voice Clone on ElevenLabs (1hr 21min training data) who needs singing voice conversion.

### Best Path Forward

1. **Start with Kits.AI Producer plan ($30/mo)** - Professional Voice Cloning + unlimited voice slots + 60 download min/mo
2. **Train a new model with singing samples** - The ElevenLabs training data is likely speaking samples, which won't produce optimal results on Kits. Record 30 minutes of diverse singing (different pitches, dynamics, styles) as dry mono WAV files.
3. **If the ElevenLabs data IS singing and dry**, export it as mono WAV and upload to Kits for Professional Voice Cloning - saves re-recording time
4. **Test with the free tier first** - Upload a vocal recording and convert with a stock voice to evaluate quality before committing to paid plan
5. **Keep ElevenLabs for speaking applications** - It remains superior for narration, podcasts, spoken content
6. **Consider RVC as a free alternative** - If you have an NVIDIA GPU with 4GB+ VRAM, RVC is free and produces excellent singing conversions, though with more setup work

### Production Chain
Record raw vocals -> Kits.AI voice conversion (with pitch shift if needed) -> Download converted WAV -> Mix with AI instrumental (Suno/Udio) in DAW -> Master (in DAW or Kits AI Mastering)

---

## Sources

- [Kits.AI Official Site](https://www.kits.ai/)
- [KVC Research Page](https://www.kits.ai/research/kits-voice-conversion-kvc)
- [Kits.AI Pricing](https://www.kits.ai/pricing)
- [Kits.AI API](https://www.kits.ai/api)
- [Kits.AI API Docs](https://docs.kits.ai/api-reference/introduction/getting-started)
- [Kits.AI Blog: ElevenLabs Comparison](https://www.kits.ai/blog/elevenlabs)
- [Kits.AI Blog: Optimize Training](https://www.kits.ai/blog/optimize-ai-voice-model-training)
- [Kits.AI Blog: API for Developers](https://www.kits.ai/blog/kits-ai-api)
- [Kits.AI Blog: Voice Model Creation Guide](https://www.kits.ai/blog/voice-model-creation-guide)
- [Kits.AI Blog: Multi-Model Conversions](https://www.kits.ai/blog/multi-model-conversions-on-kits-ai)
- [Kits.AI Help Center](https://help.kits.ai/)
- [QCall.ai Review](https://qcall.ai/kits-ai-review)
- [Sonarworks: Best AI Vocal Tools 2026](https://www.sonarworks.com/blog/learn/best-ai-vocal-tools-2025)
- [Sonarworks: AI Cover Songs Guide](https://www.sonarworks.com/blog/learn/ai-cover-songs-producer-guide)
- [Voice-Swap.ai](https://www.voice-swap.ai/)
- [Respeecher Music Production](https://www.respeecher.com/music-production)
- [RVC Wikipedia](https://en.wikipedia.org/wiki/Retrieval-based_Voice_Conversion)
- [SoVITS GitHub](https://github.com/svc-develop-team/so-vits-svc)
