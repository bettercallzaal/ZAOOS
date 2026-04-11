# Doc 320 - ElevenLabs Music API Deep Dive (2026)

**Created:** 2026-04-11
**Category:** Music / API / Integration
**Status:** Research Complete

---

## 1. Composition Plan JSON Schema - Complete Reference

The composition plan is the structured alternative to text prompts. Use it when you need precise section control, lyrics timing, or complex arrangements.

### Top-Level Request Body (`POST /v1/music/detailed`)

```json
{
  "prompt": "string | null",
  "composition_plan": {
    "positive_global_styles": ["string"],
    "negative_global_styles": ["string"],
    "sections": [
      {
        "section_name": "string (1-100 chars)",
        "positive_local_styles": ["string (max 50 items)"],
        "negative_local_styles": ["string (max 50 items)"],
        "duration_ms": 15000,
        "lines": ["string (max 30 lines, 200 chars each)"],
        "source_from": {
          "song_id": "string",
          "range": {
            "start_ms": 0,
            "end_ms": 30000
          },
          "negative_ranges": [
            { "start_ms": 5000, "end_ms": 10000 }
          ]
        }
      }
    ]
  },
  "music_length_ms": 180000,
  "model_id": "music_v1",
  "seed": 42,
  "force_instrumental": false,
  "respect_sections_durations": true,
  "store_for_inpainting": false,
  "with_timestamps": false,
  "sign_with_c2pa": false,
  "use_phonetic_names": false
}
```

### Constraints

| Field | Constraint |
|-------|-----------|
| `prompt` vs `composition_plan` | **Mutually exclusive** - use one or the other |
| `music_length_ms` | 3,000-600,000 ms (3s to 10min). Only with `prompt` |
| `seed` | Integer. Only with `composition_plan` (not `prompt`) |
| `force_instrumental` | Only with `prompt` |
| `respect_sections_durations` | Only with `composition_plan` |
| Section `duration_ms` | 3,000-120,000 ms per section |
| Max sections | 30 |
| Total duration | 3 seconds to 10 minutes |
| Section lines | Max 30 lines, 200 chars each |
| Style arrays | Max 50 items each |

### Output Format Options (query param `output_format`)

**MP3:** `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_32`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_128`, `mp3_44100_192`
**PCM (raw):** `pcm_8000`, `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_32000`, `pcm_44100`, `pcm_48000`
**Telephony:** `ulaw_8000`, `alaw_8000`
**Opus:** `opus_48000_32`, `opus_48000_64`, `opus_48000_96`, `opus_48000_128`, `opus_48000_192`

19 total format options.

### Auto-Generate Composition Plan Endpoint

`POST /v1/music/plan` - **Free** (no credits, rate-limited). Send a text prompt, get back a structured composition plan you can edit before generating.

```json
// Request
{
  "prompt": "upbeat indie rock anthem about summer",
  "music_length_ms": 180000,
  "source_composition_plan": null,
  "model_id": "music_v1"
}

// Response: a MusicPrompt object with sections, styles, lyrics
```

---

## 2. Style Keywords - What Actually Works

Styles must be in **English** (lyrics can be any language). These go in `positive_global_styles`, `negative_global_styles`, `positive_local_styles`, and `negative_local_styles`.

### Confirmed Working Style Categories

**Genres:** pop, rock, indie rock, punk rock, hip-hop, trap, lo-fi hip hop, jazz fusion, synthwave, electronic, ambient, reggaeton, afro house, nu-metal, symphonic metal, industrial, R&B, classical, folk, country, Brazilian funk

**Mood/Energy:** upbeat, melancholic, energetic, contemplative, eerie, foreboding, aggressive, triumphant, heroic, emotional, uplifting, mysterious, driving, intense, soft, raw, high adrenaline

**Instruments:** acoustic guitar, piano, solo electric guitar, synthesizers, drum machines, retro keys, phased guitars, distorted bass, punchy drums

**Vocal Descriptors:** male vocals, female vocals, a cappella, screaming male vocals, breathy, glitching, two singers harmonizing in C

**Technical Specs:** 120 BPM, slow tempo, uptempo, A minor, A major, 90 BPM

**Production Style:** lo-fi, fast-paced, guitar-driven, full band, driving synth arpeggios, glitch effects, aggressive rhythmic textures

**Section-Specific (local styles):** building, drums only, rising synth arpeggio, filtered noise sweep, full punchy drums, distorted bass stab, rapid arpeggio sequences, glitch stutter, snare rolls, building anticipation

### Real Example from Docs

```json
{
  "positive_global_styles": [
    "electronic", "fast-paced", "driving synth arpeggios",
    "punchy drums", "distorted bass", "glitch effects",
    "aggressive rhythmic textures", "high adrenaline"
  ],
  "negative_global_styles": [
    "acoustic", "slow", "minimalist", "ambient", "lo-fi"
  ]
}
```

### Tips for Styles

- Use negative styles **liberally** to prevent unwanted sounds
- "solo" before instruments isolates them (e.g., "solo electric guitar")
- "a cappella" before vocals isolates them
- Include key + tempo + emotional tone for best results: "a cappella vocals in A major, 90 BPM, soulful and raw"
- Both abstract ("eerie") and detailed musical language ("dissonant violin screeches over pulsing sub-bass") work
- Shorter prompts sometimes outperform long ones - the model interprets high-level intent well
- Use-case descriptions work: "background music for a tech product demo"
- Copyright check: if you include copyrighted band/artist names, API returns `bad_composition_plan` error with a `prompt_suggestion` alternative

### Curated Finetunes (Pre-built Styles)

11 official finetunes: Afro House Beats, Reggaeton, Arabic Groove, 70s Cambodian Rock, 80s Nu-Disco Revival, 1970s Rock Francais, Golden Hour Indie Guitar, Wooden Slit Drum, Brazilian Funk, Baile Beats, Mozart-Style Symphony

You can also create custom finetunes by uploading your own non-copyrighted tracks (trains in 5-10 minutes).

---

## 3. Lyrics and Vocal Control

### How Lyrics Work

Lyrics go in the `lines` array within each section. Each section can have up to 30 lines, each up to 200 characters.

```json
{
  "section_name": "Verse 1",
  "duration_ms": 30000,
  "positive_local_styles": ["male vocals", "raw", "breathy"],
  "lines": [
    "Walking down the empty street",
    "Neon lights beneath my feet",
    "Every shadow tells a story",
    "Of the dreams we left behind"
  ]
}
```

### Vocal Style Per Section

**Yes, you can specify different vocal styles per section.** Use `positive_local_styles` at the section level:

- Section 1: `["male vocals", "aggressive", "screaming"]`
- Section 2: `["female vocals", "soft", "breathy"]`
- Section 3: `["two singers harmonizing"]`

### Male vs Female

Specify in styles, not lyrics:
- `"male vocals"` in positive_local_styles
- `"female vocals"` in positive_local_styles
- For duets, use separate sections with different vocal styles

### Rap vs Sing

Control via style descriptors:
- Rap: `["male vocals", "aggressive", "fast-paced", "rhythmic spoken"]`
- Sing: `["female vocals", "melodic", "soulful"]`

### Key Rules

- Lyrics contain ONLY "singable or speakable content"
- Performance directions (e.g., "sing softly here") go in `positive_local_styles`, NOT in lyrics
- Phonetic sounds like "(hmmm)", "(ooh)", "(yeah)" ARE acceptable in lyrics
- For multiple vocalists, use **separate sections** with different style descriptors rather than inline annotations
- Supported languages: English, Spanish, German, Japanese, and more
- Timing cues work in prompts: "lyrics begin at 15 seconds" or "instrumental only after 1:45"
- Remove vocals entirely: `force_instrumental: true` (prompt mode) or `"instrumental only"` in styles

---

## 4. Inpainting (Enterprise Feature)

### What It Is

Inpainting lets you **regenerate a specific section** of a generated track without affecting the rest. Fix a weak chorus, replace a bridge, change an instrument in one section, modify lyrics in one verse - all while keeping the surrounding audio intact.

### How It Works

1. Generate a song with `store_for_inpainting: true`
2. The response includes a `song_id`
3. In a subsequent generation, use the `source_from` field in a section to reference that song_id and specify time ranges
4. The API regenerates just that section, blending with the original

### The `source_from` Schema

```json
{
  "source_from": {
    "song_id": "abc123-def456",
    "range": {
      "start_ms": 30000,
      "end_ms": 60000
    },
    "negative_ranges": [
      { "start_ms": 40000, "end_ms": 45000 }
    ]
  }
}
```

- `song_id`: References a previously stored song
- `range`: The time range from the source to use as context
- `negative_ranges`: Sub-ranges within the range to exclude/regenerate

### Availability

- **Enterprise only** - not available on Free, Starter, Creator, or Pro plans
- Must have explicit inpainting API access granted
- The `store_for_inpainting` parameter exists on all compose endpoints but only functions for enterprise clients

### Capabilities

- Modify specific sections of a track
- Extend or trim passages
- Change lyrics in one section
- Create loops
- Transform style/structure of specific parts
- Regenerate sections instead of the full track

---

## 5. Music v1 Model - Capabilities and Limitations

### What Works Well

- **Electronic/synth genres:** Synthwave, EDM, electronic, ambient - consistently strong
- **Lo-fi/ambient/background:** Excellent for content creator background music
- **Instrumentals:** Generally stronger than vocal tracks
- **Punk/metal with detailed prompts:** Works when you specify BPM, key, instrumentation explicitly
- **Vocal realism:** ElevenLabs' vocal synthesis expertise gives it an edge over Suno/Udio in voice naturalness
- **Commercial licensing:** Cleared from day one, trained on licensed stems

### What Struggles

- **Complex jazz and classical:** Dynamic range and nuanced arrangements fall short
- **Replicating specific artist sounds:** Copyright filters block it, and style mimicry is inconsistent
- **Rock with nuance:** "Nothing really clicked" for industrial nu-metal per real user testing
- **Consistency across identical prompts:** Results vary significantly even with same genre
- **Vocal tracks at scale:** One tester found only 3 of 20 vocal song requests were usable, rest sounded "robotic and emotionally flat"
- **Orchestral work requiring dynamic range:** Lags behind competitors

### Competitive Position (2026)

| Dimension | Leader |
|-----------|--------|
| Vocal realism | **ElevenLabs** |
| Raw audio fidelity | Udio |
| Features & speed | Suno |
| Instrumentals | **ElevenLabs** |
| Songs with vocals | Suno |
| Commercial licensing | **ElevenLabs** (cleanest from launch) |

### Technical Limits

- Duration: 10,000 ms to 300,000 ms (10s to 5min) per generation
- Only `music_v1` model available
- Text prompt only - no audio upload/remix (except via finetunes and inpainting)
- No real-time streaming of generation progress

---

## 6. Seed Parameter - Reproducibility

### How It Works

- Pass an integer `seed` value with your composition plan
- Same seed + same parameters = more consistent results
- **Only works with `composition_plan`**, NOT with `prompt`

### Reproducibility Reality

**Not guaranteed.** From the official docs: "Providing the same seed with the same parameters can help achieve more consistent results, but exact reproducibility is not guaranteed and outputs may change across system updates."

This means:
- Same seed + same plan = **similar** output, not identical
- Model updates can break reproducibility entirely
- Useful for iterating on a composition (change one section's styles, keep seed) but not for deterministic replay
- No versioned model snapshots to pin reproducibility

---

## 7. Output Quality Comparison

### Format Tiers by Subscription

| Format | Quality | Tier Required |
|--------|---------|---------------|
| `mp3_44100_128` | Standard, recommended default | Free/Starter |
| `mp3_44100_192` | Higher bitrate, noticeable on headphones | Creator+ |
| `pcm_44100` | Uncompressed, lossless, ~10x file size | Pro+ |
| `pcm_48000` | Studio-quality uncompressed | Pro+ |
| `opus_48000_192` | Best compressed quality | Creator+ |

### Practical Comparison

- **mp3_44100_128 vs mp3_44100_192:** 128kbps is the documented recommended default. 192kbps adds clarity in high frequencies and stereo imaging. For background/content use, 128 is fine. For music distribution or production, use 192.
- **PCM 44100/48000:** Lossless. Use for post-production workflows where you'll process/master the audio further. Large files (10x MP3).
- **Opus 48000_192:** Best quality-to-size ratio. Ideal for web streaming applications.
- **Low bitrate options** (`mp3_22050_32`, `mp3_44100_32`): Telephony and voice-assistant use cases only. Not for music.

### The generation model produces at a fixed internal quality. Output format is just the encoding of that output - you cannot get "better" generation by choosing PCM, but you preserve more of the original quality.

---

## 8. Real User Experiences

### Medium: "I Spent 30,000 Credits" (Bogdan Minko)

- Spent $5 for 30,000 credits, made 13 tracks (0:30-4:20 each)
- Cost: ~$0.40/track, ~2,000 credits for a 3-minute song
- Generation time: under 60 seconds per track
- Rock/punk/metal: detailed prompts with BPM + key + instrumentation worked best
- "Screaming male vocals" + "devastating power chords" outperformed generic "upbeat rock anthem"
- Industrial nu-metal: "nothing really clicked" despite technical specs
- Tip: use Claude/GPT to generate optimized prompts instead of manual trial-and-error

### HumAI Blog: 6-Month Comparison Test

- ElevenLabs wins for instrumentals
- Suno wins for songs with vocals
- ElevenLabs vocal realism is best when it works, but inconsistent
- Only 3/20 vocal requests were usable in batch testing
- Best for: content creators needing custom background music

### Competitive Reviews (2026)

- Positioned as "the specialist you bring in when vocal performance is the priority"
- Clean commercial licensing is a major differentiator
- Pop and electronic genres produce best results
- Complex arrangements (jazz, orchestral) still weak vs competitors
- Quality has improved steadily since Aug 2025 launch

### Community Consensus

- Great value at $0.40-0.80/track for content creators
- Not yet a replacement for professional production
- Best workflow: generate many variations, cherry-pick the best
- Finetunes (custom models from your own tracks) dramatically improve consistency

---

## 9. Undocumented / Lesser-Known Parameters and Tricks

### `source_from` (Section-Level)

Partially documented but rarely discussed. Each section in a composition plan can include a `source_from` object that references a previously generated song by `song_id`, with `range` and `negative_ranges` for inpainting. This is the mechanism behind section-level regeneration.

### `source_composition_plan` (Plan Endpoint)

The `/v1/music/plan` endpoint accepts a `source_composition_plan` parameter - an existing MusicPrompt to use as a foundation when generating a new plan. Useful for iterative refinement: generate a plan, tweak it, generate a new plan based on the tweaked version.

### `use_phonetic_names` (Added March 2026)

Boolean parameter on compose/stream endpoints. Controls phonetic name handling in generated vocals. Useful when lyrics contain names that the model mispronounces.

### `with_timestamps`

Returns timing metadata alongside audio. Useful for building synchronized visualizations, karaoke-style lyric display, or precise section-boundary detection.

### `sign_with_c2pa`

Adds C2PA (Coalition for Content Provenance and Authenticity) cryptographic signing to MP3 output. Proves the audio was AI-generated. Only works with MP3 format.

### `song_id` in Response

Since March 2026, all generation responses surface the `song_id` field. Essential for inpainting workflows and referencing generated songs.

### Upload Endpoint

`POST /v1/music/upload` - Upload an audio file and optionally extract a composition plan from it. Returns a `MusicUploadResponse` with a `song_id`. This enables workflows like: upload a reference track, extract its plan, modify the plan, generate a new song.

### Stem Separation

`POST /v1/music/stem-separation` - Split any audio into separate instrument/vocal stems. Independent of generation. Has its own output format options and algorithm variants via `stem_variation_id`.

### Tricks

1. **Use the plan endpoint first** (`/v1/music/plan`) to auto-generate a composition plan from a prompt, then manually edit the plan before generating. Free, no credits.
2. **Negative styles are more impactful than positive** - explicitly excluding what you don't want produces cleaner results than adding more positive styles.
3. **`respect_sections_durations: false`** improves quality and latency at the cost of exact section timing. Use `true` only when sync matters (video scoring).
4. **Batch prompt generation with AI:** Use Claude/GPT to generate 10 optimized prompts, generate all 10, pick the best. Cheaper than manual iteration.
5. **Finetune on 3-5 reference tracks** that capture your target style. 5-10 minute training. Dramatically improves genre consistency.
6. **Use "solo" and "a cappella" prefixes** to isolate instruments/vocals in a section.
7. **Copyright workaround:** Instead of naming artists, describe their sound - "distorted guitar riffs with palm muting, fast double-bass drumming, growled male vocals" instead of naming a metal band.

---

## 10. Generation Latency

### Typical Times

- **Short tracks (30s):** Under 60 seconds
- **Standard tracks (2-3 min):** 1-3 minutes
- **Long tracks (5 min):** 3-5+ minutes

### Factors Affecting Latency

- Track length (primary factor)
- `respect_sections_durations: true` adds latency vs `false`
- Complexity of composition plan (more sections = more processing)
- Server load / time of day
- Output format does NOT significantly affect generation time

### Comparison

- Much slower than ElevenLabs TTS (75ms for Flash v2.5)
- Comparable to Suno and Udio generation times
- No real-time streaming of generation - you wait for the full track
- The `/v1/music/stream` endpoint streams the **completed audio** in chunks, not progressive generation

### API Response Format

- `/v1/music` returns `Iterator[bytes]` (binary audio stream)
- `/v1/music/detailed` returns multipart response with audio + metadata (song_id, timestamps if requested)
- Both sync and async clients available in Python SDK

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Credits |
|----------|--------|---------|---------|
| `/v1/music` | POST | Simple composition from prompt or plan | Yes |
| `/v1/music/detailed` | POST | Composition with metadata (song_id, timestamps) | Yes |
| `/v1/music/stream` | POST | Stream completed audio in chunks | Yes |
| `/v1/music/plan` | POST | Auto-generate composition plan from prompt | **Free** |
| `/v1/music/upload` | POST | Upload audio, extract composition plan | Varies |
| `/v1/music/stem-separation` | POST | Split audio into stems | Yes |

---

## Pricing

- ~2,000 credits per 3-minute song
- ~$0.40-0.80 per track depending on length
- $0.80/minute of generated audio (via third-party providers like fal.ai)
- Plan generation is free
- Enterprise pricing for inpainting access

---

## Sources

- [ElevenLabs Composition Plans Guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans)
- [Compose Detailed API Reference](https://elevenlabs.io/docs/api-reference/music/compose-detailed)
- [Compose API Reference](https://elevenlabs.io/docs/api-reference/music/compose)
- [Create Composition Plan API](https://elevenlabs.io/docs/api-reference/music/create-composition-plan)
- [Music Best Practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices)
- [Music Capabilities Overview](https://elevenlabs.io/docs/overview/capabilities/music)
- [ElevenLabs Python SDK - DeepWiki](https://deepwiki.com/elevenlabs/elevenlabs-python/7.1-music-generation)
- [fal.ai ElevenLabs Music Guide](https://fal.ai/learn/devs/elevenlabs-music-user-guide)
- [30,000 Credits Experience - Medium](https://medium.com/@minkobogdan2001/i-spent-30-000-credits-on-elevenlabs-music-was-it-worth-it-21584139c0ad)
- [Suno vs Udio vs ElevenLabs - AI Magicx](https://www.aimagicx.com/blog/suno-vs-udio-vs-elevenlabs-music-comparison-2026)
- [Music Finetunes Blog](https://elevenlabs.io/blog/introducing-music-finetunes-in-elevencreative)
- [New Music Editing Tools Blog](https://elevenlabs.io/blog/eleven-music-new-tools-for-exploring-editing-and-producing-music-with-ai)
- [March 2026 Changelog](https://elevenlabs.io/docs/changelog/2026/3/2)
- [Audio Formats Support](https://help.elevenlabs.io/hc/en-us/articles/15754340124305-What-audio-formats-do-you-support)
