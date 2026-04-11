# Doc 323 - ElevenLabs Music Dubbing & Song Translation (2026)

**Date:** 2026-04-11
**Status:** Research Complete
**Use Case:** Translating original English songs into multiple languages while preserving the original artist's voice

---

## TL;DR

ElevenLabs Dubbing API is designed for **speech, not singing**. It will not dub a song - it separates vocals from instrumentals and translates the speech portion, but the output is spoken, not sung. For music translation, you need a **multi-step workflow** combining several ElevenLabs tools (or alternatives like Wavel AI or Kits.AI). No single tool does "song translation with original voice preservation" end-to-end in production quality as of April 2026.

---

## 1. Can You Dub a SONG? (Singing, Melody, Rhythm)

**No - the Dubbing API is speech-only.**

The ElevenLabs Dubbing model "separates each speaker's dialogue from the soundtrack" and translates the **dialogue** portion. It is explicitly designed for "podcasts, interviews, lectures, and more." The system treats singing vocals the same way it treats background music - as non-dialogue audio that gets preserved but not translated.

Key limitation from the docs: "If you upload a non-voiced track such as SFX, music or background track, and voices are present in this track, they won't be detected so it will not be possible to translate or correct them."

The dubbing system:
- Detects **speakers** (up to 9 recommended)
- Separates dialogue from soundtrack
- Translates and re-synthesizes the **speech** in the target language
- Preserves background audio (music, SFX) untouched

It does NOT:
- Detect singing as translatable content
- Preserve melody or rhythm in translations
- Generate singing output

## 2. How It Handles Music vs Speech

The dubbing pipeline has built-in **source separation**:
1. Analyzes audio/video input
2. Identifies individual speakers and their dialogue
3. Separates dialogue from background audio (music, effects, ambient)
4. Translates dialogue text
5. Re-synthesizes speech in target language with original speaker's voice characteristics
6. Mixes translated speech back with original background audio

For music content, the instrumental/backing track would be preserved, but vocals would either be:
- Ignored (treated as background music)
- Poorly transcribed if detected as speech (losing melody entirely)

## 3. Language Support (29-32 Languages)

ElevenLabs supports these languages across dubbing and TTS:

**Tier 1 (Best quality, most natural):** English (US, UK, AU, CA), Spanish (Spain, Mexico), French (France, Canada), German, Portuguese (Brazil, Portugal), Italian

**Tier 2 (Good quality):** Japanese, Chinese, Korean, Hindi, Arabic (Saudi Arabia, UAE), Dutch, Polish, Swedish, Turkish

**Tier 3 (Functional):** Indonesian, Filipino, Bulgarian, Romanian, Czech, Greek, Finnish, Croatian, Malay, Slovak, Danish, Tamil, Ukrainian, Russian

For **music specifically** (via Eleven Music, not dubbing): English, Spanish, German, Japanese confirmed. French and others likely supported but less documented.

**Best ROI for music translation:** Spanish and French have the largest addressable audiences with the highest voice quality. Japanese and Korean have strong cultural appetite for translated music.

## 4. Does the Dubbed Version Sing or Speak?

**It speaks.** The dubbing output is always speech. There is no singing synthesis in the dubbing pipeline. If you fed a song through dubbing, you would get either:
- Nothing (vocals not detected)
- A spoken translation over the instrumental (destroying the musical quality)

For **actual singing output**, you need Eleven Music or the Voice Changer, not the Dubbing API.

## 5. Voice Preservation with Professional Voice Clone

**Professional Voice Cloning (PVC) works for speech and has partial music support:**

- Requires 30+ minutes of audio samples
- Captures pitch, tone, accent, rhythm
- Nearly indistinguishable from original voice for speech
- Available on Creator plan ($22/mo) and above, up to 30 voice clones
- The cloned voice CAN be used with the Voice Changer tool for singing conversion

**For Dubbing Studio specifically:** You can assign voices at the track level or clip level:
- Clip-level clones (unique per clip from source audio)
- Track-level clones (single voice for entire speaker)
- Library voices (thousands available)

**Critical gap:** Professional Voice Clones are optimized for speech. Using them for singing via the Voice Changer is possible but quality varies significantly.

## 6. Real Examples of Music Dubbing with ElevenLabs

**Very few documented examples exist.** The community and documentation focus almost entirely on:
- Podcast/interview dubbing
- YouTube video translation
- Course/lecture localization
- Film/TV dialogue dubbing

No prominent examples of successful song dubbing were found on Reddit, YouTube, or the ElevenLabs community forums. This absence itself is telling - if it worked well for music, creators would be showcasing it.

**Dubformer** (a competitor) has demonstrated dubbing a 1964 classic song into Spanish, French, Portuguese, German, and Italian, but specifics on quality were vague.

**Wavel AI** explicitly markets "AI Music Dubbing" and claims to handle singing with voice cloning, rhythm matching, and syllable-count-aware lyric translation in 100+ languages.

## 7. Dubbing Studio UI vs API

| Feature | Dubbing Studio (UI) | Dubbing API |
|---------|-------------------|-------------|
| File size limit | 500 MB | 1 GB |
| Duration limit | 45 minutes | 2.5 hours |
| Edit translations | Yes - click and type | No direct editing |
| Speaker reassignment | Yes - drag on timeline | No |
| Voice selection | Visual (clip/track/library) | Programmatic |
| SFX track upload | Yes | Yes |
| Preview before export | Yes | No |
| Batch processing | No | Yes |

**For music use case:** The Studio UI is significantly better because you can:
- Edit the translated lyrics before dubbing
- Reassign voice clips
- Preview and iterate
- Adjust timing manually

The API gives no editorial control - it's fire-and-forget.

## 8. Cost Breakdown

### Dubbing Credits (Per Source Minute, Per Language)

| Plan | Monthly Cost | Dubbing Minutes | Overage Rate |
|------|-------------|-----------------|--------------|
| Free | $0 | ~10 min | N/A |
| Starter | $5 | ~15 min | N/A |
| Creator | $22 | ~50 min | $0.60/min |
| Pro | $99 | ~250 min | $0.24/min |
| Scale | $330 | ~1,000 min | Lower |
| Business | $1,320 | ~5,500 min | $0.12/min |

**Critical: Each target language is billed separately.** A 4-minute song dubbed into 5 languages = 20 minutes consumed.

### Music Generation (Eleven Music)
- Free: 7 songs/day
- Paid plans: falls under unified credit pool
- Duration: 3 seconds to 5 minutes per generation
- Export: MP3 only (currently)
- High-fidelity: Pro plan and above

### For a typical album translation project:
- 10 songs x 4 min avg = 40 min source
- 5 target languages = 200 dubbing minutes
- Creator plan: 50 included + 150 overage x $0.60 = $90 overage + $22 = **$112/month**
- Pro plan: 250 included, no overage = **$99/month** (better value)

## 9. Can You Edit Translated Lyrics Before Dubbing?

**Yes, in Dubbing Studio (UI).** You can:
- Click inside any speaker card and edit the text freely
- Retranscribe audio if the initial transcription is wrong
- Re-translate from corrected transcriptions
- The translations are fully editable before generating the dubbed audio

**No, via the API.** The API does not expose an intermediate editing step. It's a single call: input audio + target language = dubbed output.

**For music translation, this is crucial.** Machine-translated lyrics rarely fit a melody. You would need to:
1. Get the initial translation
2. Adapt lyrics for syllable count, rhythm, and rhyme
3. Then generate the dubbed audio

Only the Studio UI supports this workflow.

## 10. Quality Across Languages

Based on the multilingual model characteristics:

**Highest quality (speech dubbing):**
- Spanish - natural rhythm, large training data, excellent voice quality
- French - strong model, good emotional range
- German - precise, well-modeled
- Portuguese (Brazilian) - very natural

**Good quality:**
- Italian, Dutch, Polish, Japanese, Korean

**More variable:**
- Arabic, Hindi, Chinese - tonal/script differences create more artifacts
- Smaller languages (Croatian, Slovak, Tamil) - less training data, more robotic

**For music specifically:** No language has been validated for singing dubbing quality because the dubbing tool doesn't sing.

## 11. Alternative Approach: Translate Lyrics + Regenerate with Music API

**This is the most viable path within ElevenLabs.** Here's the workflow:

### Option A: Full Regeneration (Eleven Music)
1. Translate lyrics manually (or with AI) into target language
2. Adapt translated lyrics to fit the desired melody/rhythm
3. Use Eleven Music to generate a new version of the song with the translated lyrics
4. Specify genre, style, tempo in the prompt to match original

**Pros:** Full singing output, multiple languages supported, lyrics can be perfected
**Cons:** Voice will NOT be the original artist's voice (Eleven Music uses its own AI voices, no custom voice clone support for music generation as of April 2026). Song will be a new interpretation, not a translation of the original performance.

### Option B: Voice Changer Pipeline
1. Translate and adapt lyrics
2. Record yourself singing the translated lyrics (matching original melody)
3. Use ElevenLabs Voice Changer to transform your voice into the original artist's cloned voice
4. Mix with original instrumental

**Pros:** Preserves melody exactly, uses artist's voice characteristics
**Cons:** Requires someone who can sing in each target language, 5-min file limit, quality varies, Voice Changer is optimized for speech not singing

### Option C: Hybrid with Kits.AI
1. Translate and adapt lyrics
2. Have a singer record in each target language
3. Use Kits.AI voice cloning (singing-optimized) to convert to original artist's voice
4. Mix with original instrumental (from stem separation)

**Pros:** Kits.AI is specifically built for singing voice conversion, better quality for musical content
**Cons:** Requires Kits.AI subscription separately, still needs human singers per language

### Option D: Wavel AI (Purpose-Built for Music Dubbing)
1. Upload song
2. Select target language
3. Wavel claims to handle vocal separation, lyric translation, rhythm matching, and voice cloning automatically

**Pros:** Purpose-built for music, claims 100+ languages, automated workflow
**Cons:** Newer platform, less proven, quality claims unverified, mixed reviews on naturalness

---

## Recommendation for ZAO Use Case

For translating original English songs by ZAO artists into multiple languages:

**Best approach today (April 2026):**
1. **Stem separation** - Use any tool (ElevenLabs, Lalal.ai, etc.) to isolate vocals from instrumentals
2. **Lyric translation** - Use AI (Claude, GPT) to translate lyrics, then manually adapt for rhythm/melody/rhyme
3. **Re-record or synthesize** - Either:
   - Have singers record in target languages, then use Kits.AI voice clone to match original artist
   - Use Eleven Music to generate new vocal tracks with translated lyrics (loses original voice)
4. **Mix** - Combine translated vocals with original instrumental

**Cost estimate (ElevenLabs ecosystem only):**
- Creator plan: $22/mo (Music generation + Voice Changer)
- Kits.AI Converter plan: $10/mo (if using for voice conversion)
- Total: ~$32/mo for the tooling

**What to watch for:**
- ElevenLabs may add custom voice support to Eleven Music (would be a game-changer)
- Dubformer is specifically building song dubbing AI
- Wavel AI claims to already do end-to-end music dubbing

---

## Sources

- [ElevenLabs Dubbing Overview](https://elevenlabs.io/docs/eleven-creative/products/dubbing)
- [ElevenLabs Dubbing Studio Docs](https://elevenlabs.io/docs/eleven-creative/products/dubbing/dubbing-studio)
- [ElevenLabs Dubbing Landing Page](https://elevenlabs.io/dubbing-studio)
- [ElevenLabs Music Overview](https://elevenlabs.io/docs/eleven-creative/products/music)
- [Eleven Music New Tools Blog](https://elevenlabs.io/blog/eleven-music-new-tools-for-exploring-editing-and-producing-music-with-ai)
- [ElevenLabs Voice Changer - Singing](https://elevenlabs.io/voice-changer/singing)
- [ElevenLabs Voice Changer Docs](https://elevenlabs.io/docs/eleven-creative/playground/voice-changer)
- [ElevenLabs Professional Voice Cloning](https://elevenlabs.io/docs/creative-platform/voices/voice-cloning/professional-voice-cloning)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs Pricing Breakdown (GeckoDub)](https://blog.geckodub.com/elevenlabs-ai-dubbing-pricing)
- [ElevenLabs Pricing Breakdown (Cekura)](https://www.cekura.ai/blogs/elevenlabs-pricing)
- [Kits.AI - ElevenLabs for Music](https://www.kits.ai/blog/elevenlabs)
- [Wavel AI Music Dubbing](https://wavel.ai/solutions/dubbing/ai-music-dubbing)
- [Dubformer - AI Song Dubbing](https://www.dubformer.ai/blog/ai-powered-song-dubbing-we-pioneer-multilingual-singing-with-artificial-intelligence)
- [ElevenLabs Language Support](https://help.elevenlabs.io/hc/en-us/articles/13313366263441-What-languages-do-you-support)
- [ElevenLabs Voice Remixing](https://elevenlabs.io/docs/overview/capabilities/voice-remixing)
