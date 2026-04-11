# 323 - ElevenLabs API: Full Capabilities & What We Can Build

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Map every ElevenLabs API capability available on the Creator plan with Zaal's Professional Voice Clone, and identify what we can build in ZAO OS

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Music generation | USE the Music API (`POST /v1/music`) - full composition plans with lyrics, sections, style control. Zaal's PVC clone (1hr 21min training data) is ideal for singing |
| Voice agent | USE ElevenAgents - Zaal's voice clone as the voice of ZAO OS (welcome messages, announcements, AI host for Spaces) |
| Speech-to-Speech | USE Voice Changer (`POST /v1/speech-to-speech/{voice_id}`) - record raw vocals, transform to polished clone output while keeping emotion/timing |
| Dubbing | USE Dubbing API for translating ZAO content to Spanish, French, Portuguese, Japanese (29 languages). 50 min/mo included on Creator |
| Speech-to-Text | USE Scribe v2 (`POST /v1/speech-to-text`) - transcribe Spaces recordings, fractal meetings, podcasts. 90+ languages, $0.40/hr |
| Text-to-Speech | USE for generating spoken intros/outros, announcements, newsletter audio versions |
| Sound Effects | SKIP for now - not core to music production workflow |
| Audio Isolation | USE for cleaning up raw recordings before voice cloning or music production |

## The 7 API Endpoints

### 1. Music Generation (the main event)

**Endpoint:** `POST https://api.elevenlabs.io/v1/music`
**Detailed:** `POST https://api.elevenlabs.io/v1/music/detailed`

Two modes:
- **Simple prompt:** "An upbeat summer anthem with male vocals about coming to Maine"
- **Composition plan:** Full control over sections, lyrics, style per section

```json
{
  "composition_plan": {
    "positive_global_styles": ["summer anthem", "hip-hop", "upbeat", "festival"],
    "negative_global_styles": ["melancholic", "slow", "acoustic"],
    "sections": [
      {
        "section_name": "Verse 1",
        "positive_local_styles": ["rhythmic", "storytelling"],
        "duration_ms": 20000,
        "lines": ["Line 1 of lyrics", "Line 2 of lyrics"]
      },
      {
        "section_name": "Chorus",
        "positive_local_styles": ["anthemic", "catchy hook", "singalong"],
        "duration_ms": 15000,
        "lines": ["Summer of 26!", "We coming to Maine!"]
      }
    ]
  },
  "model_id": "music_v1",
  "output_format": "mp3_44100_128"
}
```

**Limits:**
- Song length: 3,000ms - 600,000ms (up to 10 minutes)
- Section length: 3,000ms - 120,000ms (up to 2 minutes per section)
- Lyrics: max 200 characters per line
- Output: MP3, PCM, Opus, WAV formats
- Seed parameter for reproducibility (not guaranteed)
- `force_instrumental: true` for beats-only versions

**Cost:** Billed per generation, varies by track length. Credits deducted from monthly allowance.

### 2. Text-to-Speech (TTS)

**Endpoint:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
**Streaming:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`

Use Zaal's PVC voice for:
- Spoken intros/outros on tracks
- Audio versions of newsletters
- In-app announcements and notifications
- Narration for content

**Models:**
- `eleven_flash_v2_5` - 75ms latency, real-time (32 languages)
- `eleven_multilingual_v2` - premium quality (29 languages)
- `eleven_v3` - emotional/expressive (70+ languages)

**Cost:** 1 character = 1 credit. Creator plan: 100,000 chars/mo ($0.30/1k overage)

### 3. Speech-to-Speech (Voice Changer)

**Endpoint:** `POST https://api.elevenlabs.io/v1/speech-to-speech/{voice_id}`

Record yourself rapping/singing raw, then transform it into the polished Bettercallzaal clone while keeping your emotion, timing, and delivery. This is huge for music production:

1. Record raw vocals on your phone
2. Upload to Voice Changer API with Bettercallzaal voice_id
3. Get back polished vocals that sound like a studio recording

**Parameters:**
- `audio` (required): your raw recording
- `model_id`: `eleven_english_sts_v2`
- `remove_background_noise`: true (cleans up phone recordings)
- Latency optimization: 0-4 levels

**Cost:** Same character-based billing as TTS

### 4. Speech-to-Text (Transcription)

**Endpoint:** `POST https://api.elevenlabs.io/v1/speech-to-text`

**Model:** Scribe v2 - 90+ languages, ~150ms real-time latency

**Features:**
- Word-level timestamps
- Speaker diarization (up to 32 speakers)
- Keyterm prompting (up to 1,000 terms - perfect for ZAO-specific vocabulary)
- Entity detection (56 categories)
- Max file: 3 GB / 10 hours

**Use cases for ZAO:**
- Transcribe Spaces recordings automatically
- Transcribe fractal meeting discussions
- Generate subtitles for video content
- Search through audio content by text

**Cost:** $0.40/hour on Creator plan

### 5. Dubbing (Translation)

**Endpoint:** `POST https://api.elevenlabs.io/v1/dubbing`

Translate audio/video to 29-32 languages while preserving Zaal's voice identity and emotion.

**Languages include:** English, Spanish, French, German, Japanese, Chinese, Arabic, Korean, Portuguese, and 20+ more

**Features:**
- Auto speaker detection (up to 9 speakers)
- Preserves original voice tone and emotion
- Keeps background audio/music intact
- Editable transcripts before finalizing
- API: up to 1 GB / 2.5 hours per file

**Use cases:**
- "Summer of 26" in Spanish, Japanese, French
- Translate ZAO announcements for global community
- Dub podcast/video content

**Cost:** 50 minutes/month included on Creator. $0.60/min overage.

### 6. Audio Isolation

**Endpoint:** Available via API

Strips background noise from recordings. Use before:
- Feeding raw vocals into Voice Changer
- Cleaning up phone recordings for voice cloning training
- Isolating vocals from existing tracks

### 7. ElevenAgents (Conversational AI)

**Platform:** elevenlabs.io/agents or via API

Build voice agents that speak with Zaal's voice:
- Custom tools (webhooks to ZAO OS API)
- Knowledge base integration
- Phone number deployment
- Web widget embed

**Already configured agents on the account:**
- bettercallzaal
- Farcaster
- Buddo
- Songam Host
- Pet App
- ADAM

## Zaal's Setup Summary

| Asset | Detail |
|-------|--------|
| Voice Clone | "Bettercallzaal" - Professional Voice Clone |
| Training Data | 1 hour 21 minutes (8 audio files, 842.9 MB) |
| Quality Tier | "Better" (Good=30min, Better=1hr, Best=2hr) |
| Language | English / American |
| Plan | Creator ($22/mo or $11/mo annual) |
| Monthly Allowance | 100,000 characters TTS, 50 min dubbing |
| Account | On Logesh's workspace (logesh@songam.space) |

## What We Can Build in ZAO OS

### Phase 1: Music Production (NOW)
1. **AI Music Generator v2** - Add ElevenLabs alongside existing ACE-Step
   - Route: `POST /api/music/generate-eleven/route.ts`
   - Component: Update `src/components/music/AiMusicGenerator.tsx`
   - Composition plan builder UI for section-by-section control
   - Practice songs first, then "Summer of 26"

### Phase 2: Voice Features
2. **Voice Changer for raw vocals** - Record on phone, polish with API
3. **Audio newsletter** - Convert "Year of the ZABAL" posts to audio
4. **Spaces transcription** - Auto-transcribe recordings with Scribe v2

### Phase 3: Agent & Translation
5. **ZAO Voice Agent** - Zaal's voice as the community greeter/helper
6. **Multi-language content** - Dub key announcements to Spanish/Portuguese/Japanese

## Comparison: ElevenLabs Music vs ACE-Step (already in ZAO OS)

| Feature | ElevenLabs Music API | ACE-Step v1.5 (current) |
|---------|---------------------|------------------------|
| Voice quality | Professional clone, studio-grade | Generic AI vocals |
| Lyrics control | Per-section with style directions | Tags-based ([Verse], [Chorus]) |
| Customization | Composition plans, positive/negative styles | Prompt + tags |
| Your voice | YES - Bettercallzaal PVC | No |
| Cost | Credits from $22/mo plan | Free (HuggingFace) |
| License | Commercial use on Creator+ | MIT, full ownership |
| Max length | 10 minutes | Varies |
| API | REST, well-documented | HuggingFace Inference |
| Integration | Need to build | Already built in ZAO OS |

## API Key Setup Required

```bash
# Add to .env.local
ELEVENLABS_API_KEY=sk_...        # From API Keys page
ELEVENLABS_VOICE_ID=...          # Bettercallzaal voice ID (copy from Voices page)
```

**File paths in ZAO OS:**
- Existing AI music: `src/components/music/AiMusicGenerator.tsx`
- Music API route: `src/app/api/music/generate/route.ts`
- Env example: `.env.example` (add ELEVENLABS vars)

## Sources

- [ElevenLabs Music API - Compose](https://elevenlabs.io/docs/api-reference/music/compose)
- [ElevenLabs Music API - Detailed](https://elevenlabs.io/docs/api-reference/music/compose-detailed)
- [ElevenLabs Voice Changer API](https://elevenlabs.io/docs/api-reference/speech-to-speech/convert)
- [ElevenLabs Speech-to-Text / Scribe](https://elevenlabs.io/docs/overview/capabilities/speech-to-text)
- [ElevenLabs Dubbing](https://elevenlabs.io/docs/overview/capabilities/dubbing)
- [ElevenLabs Agents Platform](https://elevenlabs.io/docs/agents-platform/overview)
- [ElevenLabs Pricing Breakdown (Flexprice)](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- [ElevenLabs Cheat Sheet 2026 (Webfuse)](https://www.webfuse.com/elevenlabs-cheat-sheet)
