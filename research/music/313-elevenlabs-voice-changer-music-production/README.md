# Doc 313 - ElevenLabs Voice Changer for Music Production

**Date:** 2026-04-11
**Author:** Claude (research)
**Status:** Research complete
**Use case:** Musician with Professional Voice Clone (1hr 21min, "Bettercallzaal") wants to record raw rap/singing on iPhone, run through Voice Changer, get polished output in cloned voice.

---

## Executive Summary

ElevenLabs Voice Changer (Speech-to-Speech API) is **primarily designed for speech, not singing**. It preserves emotional delivery, cadence, accent, and tone - but it works on a phoneme-based voice conversion system optimized for speech patterns, not continuous pitch/melody. For singing voice conversion, **Kits.AI is the purpose-built tool**. However, the Voice Changer works well for **rapping** (which is closer to speech) and can produce interesting results for melodic content with the right settings.

---

## 1. Best Practices for Recording Raw Vocals (iPhone)

### Recording environment
- **Room treatment matters:** Minimize reflections. Even hanging blankets on walls helps. Closets with clothes work surprisingly well.
- **Distance from mic:** 6-8 inches from iPhone. Too close = plosives/proximity effect. Too far = room sound dominates.
- **NO reverb or effects:** Record completely dry. AI conversion needs clean, dry signal.
- **No backing track in recording:** Record vocals isolated. Mix later.

### Technical settings
- **Sample rate:** 44.1kHz or 48kHz (higher = better conversion accuracy)
- **Bit depth:** 24-bit preferred (wider dynamic range)
- **Target levels:** Average -12dB, peaks no higher than -6dB
- **Format:** WAV or high-bitrate MP3. WAV preferred for zero compression artifacts.

### iPhone-specific tips
- Use Voice Memos app (records M4A at 48kHz) or GarageBand (more control)
- Better: use an external iPhone mic (Shure MV88, Rode VideoMic ME) for cleaner signal
- Hold phone steady, don't move it during recording
- Record in airplane mode to prevent notification interruptions
- Do multiple takes - you can pick the best one

### For rapping specifically
- Rap vocals sit dry in a mix traditionally - this aligns perfectly with AI conversion needs
- Consonant clarity is critical - enunciate clearly, the AI needs to parse phonemes
- Light compression (3-5dB gain reduction) if your recording app supports it
- Less is more with effects - zero reverb, zero delay

---

## 2. Does Voice Changer Preserve Pitch/Melody When Singing?

### The honest answer: Partially, with caveats

**What it DOES preserve:**
- Emotional delivery (whispers, laughs, cries, sighs)
- Speaking cadence and rhythm
- Accent and language
- Dynamic range and energy
- Timing and phrasing

**What it struggles with:**
- Continuous melodic pitch (singing sustained notes)
- Vibrato reproduction
- Precise pitch intervals between notes
- Musical intonation patterns

**Why:** The Voice Changer uses phoneme-based voice conversion. The "trick in voice conversion is to render source speech content using target speech phonemes." This is fundamentally a speech technology, not a music technology. It analyzes speech patterns and reconstructs them in the target voice - singing requires preserving continuous pitch contours which is a different problem.

**For rapping:** Much better results because rapping is rhythmic speech. The cadence, flow, accent, and delivery transfer well. This is your sweet spot.

**For singing:** Results will vary. Simple melodies with clear enunciation may work. Complex melismatic runs or sustained high notes will likely produce artifacts or unexpected pitch behavior.

### The competitor advantage (Kits.AI)
Kits.AI uses a **KVC (Kits Voice Conversion)** system with a "Hybrid Pitch" custom algorithm that specifically handles:
- Pitch shifting up to 24 semitones
- Clean note transitions
- Stable pitch handling across a singer's full range
- Conversion strength control
- Volume blend (balance original vs converted dynamics)

---

## 3. Chaining Voice Changer Output into Music API

### Can you do it? Yes, but manually

There is **no native pipeline** that chains Voice Changer output directly into the Music API. You would build this yourself:

**Workflow A - Voice Changer + Your Own Beat:**
1. Record raw vocals on iPhone
2. POST to `/v1/speech-to-speech/{voice_id}` with the audio
3. Download the converted vocals (MP3/WAV)
4. Import into DAW (Logic, GarageBand, Ableton)
5. Mix with your instrumental/beat

**Workflow B - Voice Changer + Music API Instrumental:**
1. Generate an instrumental via Music API: POST `/v1/music/compose` with `force_instrumental: true`
2. Record raw vocals on iPhone
3. Run through Voice Changer API
4. Mix both in your DAW

**Workflow C - Full AI Pipeline:**
1. Record raw vocals on iPhone
2. Voice Changer converts to your PVC voice
3. Music API generates backing track from text prompt
4. Download stems from Music API (vocals, drums, bass, etc. - paid feature)
5. Mix everything in DAW

### Music API capabilities (launched March 2026)
- Generate full tracks from text prompts
- Force instrumental mode
- Sectional descriptions (Intro, Verse, Chorus, Breakdown, Outro)
- Stem separation (paid): isolate vocals, drums, bass, etc.
- In-paint/regenerate specific sections without re-rendering entire track
- Output: MP3 (44.1kHz, 128-192kbps) and WAV
- Duration: 3 seconds to 5 minutes
- Trained on licensed data, cleared for commercial use

### Python automation example

```python
from elevenlabs import ElevenLabs
import os

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

# Step 1: Voice Changer - convert raw vocals to PVC voice
with open("raw_vocals.wav", "rb") as audio_file:
    converted_audio = client.speech_to_speech.convert(
        voice_id="YOUR_BETTERCALLZAAL_VOICE_ID",
        audio=audio_file,
        model_id="eleven_multilingual_sts_v2",  # or eleven_english_sts_v2
        output_format="mp3_44100_192",
        remove_background_noise=True,
        voice_settings='{"stability": 0.3, "similarity_boost": 0.85, "style": 0.0}'
    )

# Save converted vocals
with open("converted_vocals.mp3", "wb") as f:
    for chunk in converted_audio:
        f.write(chunk)

# Step 2: Generate instrumental via Music API
instrumental = client.music.compose(
    prompt="dark trap beat, 808 bass, hi-hats, 140 BPM, minor key",
    duration_seconds=180,
    force_instrumental=True
)

with open("instrumental.mp3", "wb") as f:
    for chunk in instrumental:
        f.write(chunk)

# Step 3: Mix in DAW (Logic Pro, GarageBand, Ableton)
```

---

## 4. Best Model for Singing vs Speaking

### Available Speech-to-Speech Models

| Model ID | Languages | Best For |
|----------|-----------|----------|
| `eleven_english_sts_v2` | English only | English-only projects, slightly lower latency |
| `eleven_multilingual_sts_v2` | 29 languages | Everything else - **often outperforms English model even for English content** |

### Recommendation

**Use `eleven_multilingual_sts_v2` for everything.** ElevenLabs' own docs note it "often outperforms" the English-specific model even for English content. There is no singing-specific model.

Neither model is optimized for singing. Both are speech-to-speech models. For actual singing voice conversion, consider:
- **Kits.AI** - purpose-built for singing, has its own API
- **Audimee** - vocal conversion platform
- **Vocalist.ai** - studio-quality AI vocal conversion

---

## 5. Latency and File Size Limits

### File size limits
- **Maximum file size:** 50MB
- **Maximum duration:** 5 minutes per request
- **For longer content:** Break into segments and process separately

### Billing
- **Cost:** 1,000 characters per minute of audio processed

### Latency optimization levels

| Level | Description | Improvement | Trade-off |
|-------|-------------|-------------|-----------|
| 0 | Default mode | Baseline | Best quality |
| 1 | Normal optimizations | ~50% faster | Minimal quality loss |
| 2 | Strong optimizations | ~75% faster | Some quality loss |
| 3 | Max optimizations | Maximum speed | Noticeable quality trade-off |
| 4 | Max + text normalizer off | Fastest possible | May mispronounce numbers/dates |

### Latency reduction tips
- Use `pcm_s16le_16` input format (16-bit PCM, 16kHz, mono) - lower latency than encoded formats
- Use latency optimization level 1-2 for good balance
- Choose closest server region
- Use streaming endpoint for progressive playback: `/v1/speech-to-speech/{voice_id}/stream`

### Output format options
- **MP3:** 22050-44100 Hz, 32-192 kbps (192kbps requires Creator tier+)
- **PCM:** 8000-48000 Hz (44.1kHz requires Pro tier+)
- **Opus:** 48000 Hz, 32-192 kbps
- **ulaw/alaw:** 8000 Hz (telephony)

---

## 6. Voice Settings for Singing vs Rapping

### Parameters

| Setting | Range | What It Does |
|---------|-------|--------------|
| `stability` | 0.0 - 1.0 | Controls consistency vs expressiveness |
| `similarity_boost` | 0.0 - 1.0 | How closely to match target voice |
| `style` | 0.0 - 1.0 | Amplifies original speaker's style characteristics |
| `use_speaker_boost` | boolean | Enhances clarity, reduces artifacts (adds latency) |

### Recommended settings for RAPPING

```json
{
  "stability": 0.3,
  "similarity_boost": 0.85,
  "style": 0.15,
  "use_speaker_boost": true
}
```

**Why these values:**
- **Stability 0.3 (low):** Rapping is expressive and dynamic. Low stability allows broader emotional range and prevents monotone output. Don't go below 0.2 or you get "odd performances that are overly random and cause the character to speak too quickly."
- **Similarity 0.85 (high):** You want it to sound like YOUR PVC clone. High similarity = closer to your trained voice. Your PVC has 1hr 21min of training data - that's solid, so push similarity higher.
- **Style 0.15 (low):** Keep style low for dynamic, energetic input. ElevenLabs docs explicitly say: "If the input audio is very expressive and energetic with lots of dynamic range, keep Style all the way down to 0% and Stability all the way up to 100%." But for rap you want some expression, so slightly above 0.
- **Speaker boost ON:** Adds clarity. Worth the small latency cost for final output quality.

### Recommended settings for SINGING (if attempting)

```json
{
  "stability": 0.5,
  "similarity_boost": 0.75,
  "style": 0.0,
  "use_speaker_boost": true
}
```

**Why these values:**
- **Stability 0.5 (medium):** Need more consistency for melodic content
- **Similarity 0.75 (medium-high):** Don't push too high or artifacts from training data get amplified
- **Style 0.0 (off):** Dynamic singing input + style exaggeration = chaos. Keep it at 0.
- **Speaker boost ON:** Helps with tonal clarity

### Settings to experiment with
- Try stability between 0.2-0.5 for rap, listen to multiple outputs
- Use `seed` parameter with same value to get reproducible results while tuning
- The seed range is 0 to 4,294,967,295

---

## 7. The remove_background_noise Parameter

### How it works
- Boolean flag, defaults to `false`
- When `true`, runs the audio through ElevenLabs' Audio Isolation model before voice conversion
- Uses AI/ML trained on millions of hours of speech to separate voice from noise

### How good is it?
**For speech:** Excellent. Reviewers say it "significantly reduced unwanted sounds" while "preserving the natural qualities of the speaker's voice, avoiding the robotic or tinny sound."

**For singing/music:** Limited. The docs warn:
> "This tool is heavily optimized for spoken dialogue... if you are trying to extract a singing acapella from a fully mastered EDM track, results may vary, as the AI is looking for speech patterns."

### Recommendation for your use case
- **For iPhone recordings in quiet rooms:** Leave it OFF. Your raw recording quality matters more than post-processing.
- **For iPhone recordings with ambient noise (AC, traffic, etc.):** Turn it ON. It will clean up background noise effectively for speech/rap.
- **For singing recordings:** Test both. May introduce artifacts on sustained notes.
- **Better alternative:** Record in a quiet space and skip the parameter entirely. Prevention > cure.

---

## 8. Real Examples of People Using Voice Changer for Music

### What exists publicly

ElevenLabs markets a "Singing Voice Changer" page that claims the ability to "create unique voice transformations for songs, covers, and creative projects in seconds." However, specific user testimonials and detailed results are scarce in public forums.

**What people are actually doing:**
1. **AI covers** - Using Voice Changer to make celebrity voices sing popular songs (mainly novelty/meme content on YouTube/TikTok)
2. **Demo vocals** - Producers generating quick vocal demos before hiring real singers
3. **Voice acting** - Converting one speaker's delivery into different character voices
4. **Podcast/narration** - The primary professional use case

**Notable absence:** There are very few documented cases of professional musicians using ElevenLabs Voice Changer as part of their actual music production pipeline. The community consensus leans toward Kits.AI for serious music work.

### The music production landscape (2026)

| Tool | Best For | Singing Support | API |
|------|----------|-----------------|-----|
| ElevenLabs Voice Changer | Speech, rap, narration | Limited | Yes |
| Kits.AI | Singing, covers, vocal production | Excellent (purpose-built) | Yes |
| Audimee | Vocal conversion | Good | Yes |
| Vocalist.ai | Studio vocal conversion | Good | Limited |
| LALAL.AI | Voice changing + stem separation | Good | Yes |

### YouTube/TikTok content
- Search "ElevenLabs singing" on TikTok for numerous demos
- Most demos showcase novelty AI covers rather than production workflows
- "How to Make AI Sing in ElevenLabs" is a popular TikTok search query

---

## 9. Real-Time Streaming Voice Conversion

### What's available

**Streaming endpoint (HTTP):**
- `POST /v1/speech-to-speech/{voice_id}/stream`
- Returns `text/event-stream` with chunked audio bytes
- Processes a **pre-recorded file** and streams the output progressively
- NOT real-time microphone input - you must upload a complete audio file

**Key limitation:** There is NO WebSocket-based real-time speech-to-speech endpoint. The WebSocket API exists only for text-to-speech. Voice Changer requires uploading a complete audio file.

### What "streaming" actually means here
- You upload your audio file
- The server processes it and sends back converted audio in chunks
- You can start playing the output before the full file is processed
- This reduces perceived latency but is NOT live voice conversion

### Can you do real-time voice conversion while recording?
**Not with ElevenLabs.** The API requires a complete audio file upload. You cannot pipe a live microphone feed through the Voice Changer API.

**Workaround for near-real-time:**
1. Record short segments (10-30 seconds) on iPhone
2. Auto-upload each segment via API
3. Get converted output in near-real-time with streaming endpoint
4. Stitch segments together

**For true real-time voice conversion, look at:**
- Voice.ai (real-time, desktop app)
- Voicemod (real-time, desktop app)
- These are consumer tools, not API-based production tools

---

## 10. Quality Comparison: Raw Recording vs Voice Changer Output

### What improves
- **Voice consistency:** Your PVC clone sounds the same every time, even if your raw recordings vary in energy/quality
- **Noise floor:** With `remove_background_noise`, iPhone ambient noise gets cleaned up
- **Tonal quality:** The PVC clone was trained on high-quality audio (1hr 21min), so output inherits that quality regardless of recording conditions
- **Professional sound:** Your iPhone recording through a PVC trained on studio-quality samples = output sounds closer to studio quality

### What degrades
- **Nuance loss:** Subtle vocal characteristics from your raw performance may be smoothed out
- **Latency artifacts:** At higher optimization levels, quality drops
- **Pitch accuracy:** For singing, the AI may alter pitch in unexpected ways
- **Natural imperfections:** Sometimes raw vocal imperfections (breath, slight crack) are what make a performance feel authentic - the AI may remove these
- **Dynamic range:** Very quiet or very loud moments may get compressed

### The verdict for your use case

**For rapping:** Voice Changer will likely improve your iPhone recordings significantly. The rhythm, flow, and energy transfer well, and the output gets the tonal quality of your PVC clone. This is a viable production workflow.

**For singing:** Test it, but have realistic expectations. Simple melodic phrases may work. Complex singing will likely need Kits.AI instead.

**Recommended workflow:**
1. Record on iPhone in a quiet space, dry, 44.1kHz+
2. Do NOT apply any effects before conversion
3. Run through Voice Changer API with recommended rap settings
4. Compare raw vs converted - keep whichever sounds better for each take
5. Mix the best takes with your beat in a DAW

---

## Appendix A: API Quick Reference

### Speech-to-Speech Convert
```
POST https://api.elevenlabs.io/v1/speech-to-speech/{voice_id}
Content-Type: multipart/form-data

Parameters:
- audio (required): binary audio file
- model_id: "eleven_multilingual_sts_v2" (recommended)
- voice_settings: JSON string
- remove_background_noise: boolean
- output_format: "mp3_44100_192" (best quality)
- optimize_streaming_latency: 0 (best quality) or 1 (good balance)
- seed: integer for reproducibility
- file_format: "other" (for encoded files) or "pcm_s16le_16"
```

### Speech-to-Speech Stream
```
POST https://api.elevenlabs.io/v1/speech-to-speech/{voice_id}/stream
(Same parameters as above, returns chunked audio stream)
```

---

## Appendix B: Recommended Tool Stack for Your Workflow

| Step | Tool | Why |
|------|------|-----|
| Record | iPhone + external mic | Portability, always available |
| Rap vocal conversion | ElevenLabs Voice Changer | Good for speech-adjacent content |
| Singing vocal conversion | Kits.AI | Purpose-built for singing |
| Beat/instrumental | ElevenLabs Music API or your own production | Flexibility |
| Mixing | GarageBand / Logic Pro / Ableton | Professional output |
| Noise removal (if needed) | ElevenLabs Voice Isolator (standalone) | Better than in-line parameter |

---

## Appendix C: Your PVC Clone "Bettercallzaal" - Optimization Notes

Your PVC has 1hr 21min (81 minutes) of training data. This is above the 30-minute minimum but below the optimal 2-3 hours. Here's how to get the most out of it:

1. **If the training data was speech only:** The clone will perform best for speech/rap conversion. Singing conversion will be limited by the training data style.

2. **If you want better singing results:** Consider re-training or supplementing the PVC with singing samples. The docs say "the speaking style in the samples you provide will be replicated in the output."

3. **Quality of training data matters:** High-quality input = high-quality clone. If your 1hr 21min was recorded on good equipment in a treated room, you're in good shape.

4. **Similarity boost sweet spot:** With 81 minutes of training data, a similarity_boost of 0.80-0.90 should work well. Don't push to 1.0 or you may amplify any noise/artifacts from training samples.

---

## Sources

- [ElevenLabs Voice Changer API Reference](https://elevenlabs.io/docs/api-reference/speech-to-speech/convert)
- [Voice Changer Stream API](https://elevenlabs.io/docs/api-reference/speech-to-speech/stream)
- [Voice Changer Product Guide](https://elevenlabs.io/docs/eleven-creative/playground/voice-changer)
- [Voice Changer Capabilities](https://elevenlabs.io/docs/overview/capabilities/voice-changer)
- [Singing Voice Changer Page](https://elevenlabs.io/voice-changer/singing)
- [ElevenLabs Models](https://elevenlabs.io/docs/overview/models)
- [Professional Voice Cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning)
- [Voice Settings Reference](https://elevenlabs.io/docs/speech-synthesis/voice-settings)
- [Latency Optimization](https://elevenlabs.io/docs/best-practices/latency-optimization)
- [Music API](https://elevenlabs.io/docs/overview/capabilities/music)
- [Voice Isolator](https://elevenlabs.io/voice-isolator)
- [Max Input Length for Voice Changer](https://help.elevenlabs.io/hc/en-us/articles/23864324790289-What-is-the-max-input-length-when-using-Voice-Changer)
- [Kits.AI vs ElevenLabs Comparison](https://www.kits.ai/blog/elevenlabs)
- [ElevenLabs Cheat Sheet 2026](https://www.webfuse.com/elevenlabs-cheat-sheet)
- [Sonarworks Best AI Vocal Tools 2026](https://www.sonarworks.com/blog/learn/best-ai-vocal-tools-2025)
- [ElevenLabs Python SDK](https://github.com/elevenlabs/elevenlabs-python)
- [ElevenLabs Voice Conversion Blog](https://elevenlabs.io/blog/voice-conversion)
- [Revocalize - ElevenLabs Singing](https://www.revocalize.ai/blog/unlocking-creativity-how-elevenlabs-singing-is-revolutionizing-music-production)
