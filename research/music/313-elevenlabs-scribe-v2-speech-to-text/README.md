# Doc 313 - ElevenLabs Scribe v2 Speech-to-Text for Community Transcription

**Date:** 2026-04-11
**Category:** Infrastructure / AI Tools
**Status:** Research Complete
**Use Case:** Auto-transcribe ZAO fractal meetings, Discord recordings, Spaces sessions

---

## 1. Scribe v2 vs v2 Realtime - Which to Use When

### Scribe v2 (Batch)
- **Optimized for:** Long, complex recordings - meetings, podcasts, multi-speaker sessions
- **Processing:** Upload file or URL, get full transcript back
- **Accuracy:** Highest accuracy available - 3.3% WER English on FLEURS, ~96.7% accuracy
- **Features:** Full feature set - diarization (up to 32 speakers), entity detection (56 categories), keyterm prompting (1,000 terms), audio event tagging, multi-channel support
- **File limits:** Up to 3GB, 10 hours max
- **Best for ZAO:** Post-session transcription of recorded fractal meetings and Spaces

### Scribe v2 Realtime
- **Optimized for:** Live transcription, voice agents, real-time captions
- **Latency:** ~150ms typical, 30-80ms in optimized conditions
- **Accuracy:** 93.5% across 30 languages on FLEURS (lower than batch but still best-in-class for real-time)
- **Protocol:** WebSocket streaming (wss://api.elevenlabs.io/)
- **Features:** Partial + committed transcripts, VAD-based auto-commit, word-level timestamps
- **Missing vs batch:** No speaker diarization, no entity detection, no keyterm prompting in realtime mode
- **Best for ZAO:** Live captions during Spaces sessions, real-time meeting notes

### Recommendation for ZAO
Use **both**:
- Scribe v2 Realtime during live Spaces for real-time captions/accessibility
- Scribe v2 Batch after meetings for the definitive transcript with speaker labels and custom terminology

---

## 2. Speaker Diarization

### Capabilities
- Supports **up to 32 speakers** (some sources say 48 - API parameter `num_speakers` accepts 1-32)
- Speakers labeled as `speaker_0`, `speaker_1`, `speaker_2`, etc.
- Labels are consistent within a transcript but are generic IDs, not names
- Works well in challenging environments - overlapping speech, varying audio quality

### API Parameters
```
diarize: true                    // Enable diarization
num_speakers: 8                  // Optional hint for expected speaker count (1-32)
diarization_threshold: 0.22     // Sensitivity for speaker boundaries (0.0-1.0, default ~0.22)
```

### Response Format
Each word in the response includes a `speaker_id`:
```json
{
  "text": "I think we should allocate more Respect",
  "start": 12.5,
  "end": 14.8,
  "type": "word",
  "speaker_id": "speaker_2"
}
```

### Accuracy with 5-10 Speakers (Fractal Meetings)
- ElevenLabs claims industry-leading diarization, analyzing long audio context
- For 5-10 speakers (typical fractal meeting), set `num_speakers` to the expected count for best results
- The `diarization_threshold` parameter lets you tune sensitivity - lower values = fewer speaker switches (good for clear turn-taking), higher = more granular (good for cross-talk)
- **Limitation:** Speaker IDs are not persistent across sessions - you'd need post-processing to map speaker_0 to "Zaal", speaker_1 to "Steve", etc.

### Post-Processing Strategy for ZAO
After transcription, map speaker IDs to real names:
1. Use the first few minutes where participants introduce themselves
2. Build a simple UI where a moderator assigns names to speaker IDs
3. Store the mapping and apply it to the full transcript

---

## 3. Keyterm Prompting for ZAO-Specific Terms

### How It Works
- Biases the model toward recognizing specific terms **when they're spoken**
- Context-aware - won't force terms where they don't belong (unlike Whisper custom vocab)
- Up to **1,000 keyterms**, each max 50 characters, max 5 words per term
- **Cost:** +20% surcharge on base transcription cost
- Minimum billable: 20 seconds when >100 keyterms

### API Parameter
```json
{
  "keyterms": [
    "Respect",
    "ZOUNZ",
    "fractal",
    "ORDAO",
    "ZAO",
    "ZOR",
    "frapps",
    "OREC",
    "Farcaster",
    "XMTP",
    "COC Concertz",
    "ZAO Stock",
    "Optimism",
    "Base",
    "Ellsworth"
  ]
}
```

### Recommended ZAO Keyterm List
Community-specific terms that standard ASR would likely misinterpret:
- **Governance:** Respect, ZOUNZ, ORDAO, OREC, fractal, frapps, governance proposal
- **Platform:** Farcaster, XMTP, Neynar, ZAO OS, Supabase
- **Events:** COC Concertz, ZAO Stock, Ellsworth, Franklin Street
- **Tokens/Chain:** Optimism, Base, ZOR, OG Respect
- **People/Orgs:** The ZAO, ZTalent, Dan Larimer, Tadas
- **Music:** binaural beats, curation weight, listening room

### Key Advantage Over Whisper
Whisper's custom vocabulary tends to insert prompted terms where they don't belong on ambiguous audio. Scribe's keyterm prompting is context-aware and only activates when the model detects the term is actually spoken.

---

## 4. Word-Level Timestamps

### Format and Precision
Timestamps are in **seconds as floating-point numbers**:
```json
{
  "words": [
    {
      "text": "The",
      "start": 0.0,
      "end": 0.12,
      "type": "word",
      "speaker_id": "speaker_0",
      "logprob": -0.05,
      "characters": [
        { "text": "T", "start": 0.0, "end": 0.04 },
        { "text": "h", "start": 0.04, "end": 0.08 },
        { "text": "e", "start": 0.08, "end": 0.12 }
      ]
    },
    {
      "text": " ",
      "start": 0.12,
      "end": 0.15,
      "type": "spacing"
    },
    {
      "text": "(laughter)",
      "start": 5.2,
      "end": 6.8,
      "type": "audio_event"
    }
  ]
}
```

### Granularity Options
- `timestamps_granularity: "word"` - Default, word-level start/end
- `timestamps_granularity: "character"` - Character-level timing within each word
- `timestamps_granularity: "none"` - No timestamps (faster, cheaper)

### Confidence Scores
Each word includes `logprob` (log probability, range negative infinity to 0):
- Values closer to 0 = higher confidence
- Useful for flagging uncertain transcriptions for human review

### Audio Event Detection
Non-speech sounds tagged with `type: "audio_event"`:
- Laughter, applause, music, footsteps, background noise
- Enabled by default (`tag_audio_events: true`)
- Useful for fractal meetings where music may play or side conversations happen

---

## 5. Transcribing Discord Recordings and Spaces Recordings

### Discord Bot Recordings
1. Record the Discord call using a bot (e.g., Craig Bot exports multi-track audio)
2. Export as a single mixed audio file (MP3, WAV, FLAC, OGG all supported)
3. Upload to Scribe v2 API:

```typescript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('model_id', 'scribe_v2');
formData.append('diarize', 'true');
formData.append('num_speakers', '8');
formData.append('keyterms', JSON.stringify([
  'Respect', 'ZOUNZ', 'fractal', 'ORDAO', 'OREC', 'ZAO'
]));
formData.append('additional_formats', JSON.stringify([
  { format: 'srt', include_speakers: true },
  { format: 'txt', include_speakers: true }
]));

const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
  method: 'POST',
  headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  body: formData
});
```

### Multi-Channel Discord (Craig Bot)
If Craig Bot exports separate tracks per speaker:
- Use `use_multi_channel: true` (max 5 channels)
- Each channel transcribed separately - automatic per-speaker attribution
- **Cost:** Each channel billed at full audio duration (5 channels = 5x cost)
- Better approach: Mix down to stereo or mono and use diarization instead

### Stream.io Spaces Recordings
ZAO OS uses Stream.io for Spaces which supports recording:
1. Webhook delivers recording URL when session ends
2. Pass the recording URL directly via `source_url` parameter:
```typescript
formData.append('source_url', streamRecordingUrl);
```
3. No need to download and re-upload

### Async Workflow for Long Recordings
For meetings over 30 minutes, use webhook mode to avoid timeout:
```typescript
formData.append('webhook', 'true');
formData.append('webhook_metadata', JSON.stringify({
  meeting_type: 'fractal',
  date: '2026-04-07',
  session: 'weekly'
}));
```

---

## 6. Cost Comparison

### ElevenLabs Scribe v2 Pricing (Per Hour of Audio)

| Tier | Batch $/hr | Realtime $/hr |
|------|-----------|---------------|
| Free | $0.48 | N/A |
| Starter ($5/mo) | $0.63 | $0.53 |
| Creator ($22/mo) | $0.07 | $0.63 |
| Pro ($99/mo) | $0.40 | $0.46 |
| Scale ($330/mo) | $0.33 | $0.39 |
| Business ($1,320/mo) | $0.22 | Custom |

**Surcharges:**
- Keyterm prompting: +20%
- Entity detection: +30%
- Entity redaction: +30%
- Multi-channel: each channel billed at full duration

### Competitor Pricing

| Provider | Per Hour | Per Minute | Notes |
|----------|---------|-----------|-------|
| **OpenAI Whisper** | ~$0.36 | $0.006 | Self-hosted = free (GPU costs only) |
| **Deepgram** | ~$0.26 | $0.0043 | Cheapest managed API |
| **AssemblyAI (Nano)** | $0.12 | $0.002 | Budget tier |
| **AssemblyAI (Best)** | $0.37 | $0.006 | With add-ons can reach $0.43+ |
| **AssemblyAI (Universal-3 Pro)** | $0.21 | $0.0035 | Batch; streaming $0.45/hr |
| **ElevenLabs (Pro tier)** | $0.40 | $0.0067 | All features included at base |
| **Google Cloud STT** | ~$0.36-0.96 | $0.006-0.016 | Varies by model |

### ZAO Cost Estimate
Weekly fractal meeting (~90 min) + occasional Spaces (~60 min/week):
- ~2.5 hours/week = ~10 hours/month
- At Pro tier ($0.40/hr): **$4/month base**
- With keyterms (+20%): **$4.80/month**
- With entity detection (+30%): **$5.20/month**
- Annual: ~$50-60/year

### Whisper (Free) Trade-offs
- Free but requires GPU infrastructure ($50-100/mo for a decent GPU server)
- No speaker diarization built in (need pyannote or similar, adds complexity)
- No keyterm prompting (custom vocab is less accurate)
- Known hallucination issues - generates text not in the audio
- No entity detection/redaction
- For ZAO's volume (~10 hrs/mo), ElevenLabs at $5/mo is cheaper than running Whisper infrastructure

---

## 7. Entity Detection - 56 Categories

### Category Groups

| Group | Code | Description |
|-------|------|-------------|
| **PII** | `pii` | Personally Identifiable Information |
| **PHI** | `phi` | Protected Health Information |
| **PCI** | `pci` | Payment Card Industry data |
| **Other** | `other` | Generic entities |
| **Offensive** | `offensive_language` | Profanity and offensive content |

### Known Entity Types Within Groups
- **PII:** person_name, email_address, phone_number, street_address, SSN, date_of_birth, driver_license, passport_number, IP_address, URL, username
- **PHI:** medical_condition, medication, medical_record_number, health_plan_number
- **PCI:** credit_card, bank_account, routing_number, CVV
- **Other:** organization_name, location, date, time, monetary_amount

The full 56-category list is not publicly itemized in documentation. You specify group-level (`pii`, `phi`, `pci`) or `all` to detect everything.

### Useful Categories for ZAO Community
- **person_name** - Identify who's being discussed in meeting transcripts
- **organization_name** - Detect mentions of labels, DAOs, projects
- **location** - Track venue mentions (Franklin Street, Ellsworth)
- **monetary_amount** - Flag budget/payment discussions
- **date/time** - Extract scheduling information from meeting notes
- **offensive_language** - Content moderation for published transcripts

### API Usage
```json
{
  "entity_detection": ["pii", "other"],
  "entity_redaction": ["pci"],
  "entity_redaction_mode": "entity_type"
}
```

Response includes:
```json
{
  "entities": [
    {
      "text": "Steve Peer",
      "entity_type": "person_name",
      "start_char": 145,
      "end_char": 155
    }
  ]
}
```

---

## 8. Webhook for Async Results

### Workflow
1. **Configure webhook** in ElevenLabs dashboard (Settings > Webhooks)
2. **Submit transcription** with `webhook: true`
3. **Receive immediate response** with `transcription_id` and `request_id`
4. **ElevenLabs processes** the audio asynchronously
5. **Webhook fires** to your endpoint with the full transcript

### Immediate Response (202-style)
```json
{
  "message": "Transcription submitted",
  "request_id": "uuid-here",
  "transcription_id": "uuid-here"
}
```

### Webhook Payload
Full `SpeechToTextChunkResponseModel` delivered to your configured endpoint, including all words, timestamps, speakers, entities, and additional format exports.

### Custom Metadata
Attach metadata for correlation:
```json
{
  "webhook": true,
  "webhook_metadata": {
    "meeting_type": "fractal",
    "date": "2026-04-07",
    "channel": "general"
  }
}
```
- Max 2-level depth
- Max 16KB
- Returned in the webhook payload for matching to your records

### Targeting Specific Webhooks
Use `webhook_id` to route to a specific endpoint (useful if you have different handlers for different meeting types).

### ZAO Integration Pattern
1. Spaces session ends -> Stream.io webhook fires with recording URL
2. ZAO OS backend receives recording URL, submits to ElevenLabs with `webhook: true`
3. ElevenLabs processes and sends transcript to ZAO OS webhook endpoint
4. ZAO OS stores transcript in Supabase, links to the Spaces session
5. Members can view transcript in the app with speaker labels and timestamps

---

## 9. Live Transcription of Ongoing Calls/Streams

### Yes - Via Scribe v2 Realtime (WebSocket)

**Connection:**
```
wss://api.elevenlabs.io/v1/speech-to-text/realtime
```

**Regional endpoints:**
- US: `wss://api.us.elevenlabs.io/`
- EU: `wss://api.eu.residency.elevenlabs.io/`
- India: `wss://api.in.residency.elevenlabs.io/`

**Authentication:** API key header or single-use token (for client-side)

### Audio Format Support
- PCM at 8000, 16000, 22050, 24000, 44100, 48000 Hz
- uLaw at 8000 Hz (telephony)
- Default: pcm_16000

### Commit Strategies
- **Manual:** Your app decides when to finalize a segment (send `commit: true`)
- **VAD (Voice Activity Detection):** Auto-commits after silence
  - `vad_silence_threshold_secs: 1.5` (default)
  - `vad_threshold: 0.4` (sensitivity)

### Message Flow
```
Client -> Server: { "type": "input_audio_chunk", "audio_base_64": "...", "commit": false }
Server -> Client: { "type": "partial_transcript", "text": "The fractal meeting..." }
Server -> Client: { "type": "committed_transcript", "text": "The fractal meeting is now open." }
```

### Limitations for Live Calls
- **No speaker diarization** in realtime mode
- **No keyterm prompting** in realtime mode
- **No entity detection** in realtime mode
- For a full-featured transcript, record the call AND run realtime for captions, then use batch for the final version

### ZAO Spaces Integration
Stream.io SDK provides audio streams. To add live captions:
1. Capture the mixed audio output from the Spaces call
2. Stream audio chunks to Scribe v2 Realtime via WebSocket
3. Display partial/committed transcripts as live captions in the Spaces UI
4. After the session, run the recording through batch Scribe v2 for the definitive transcript

---

## 10. Integration with Other ElevenLabs Products

### STT -> TTS Pipeline
Transcribe audio, then synthesize it in a different voice or language:
1. Scribe v2 transcribes meeting audio to text
2. Text fed to ElevenLabs TTS API for voice synthesis
- Use case: Generate audio summaries of meetings in a consistent narrator voice
- Use case: Create podcast-style recaps of fractal meetings

### STT -> Dubbing Pipeline
ElevenLabs Dubbing API handles the full pipeline:
1. Upload video/audio
2. Automatic transcription (uses Scribe internally)
3. Translation to target language
4. Voice synthesis maintaining original speaker characteristics
- Use case: Translate ZAO content for non-English speaking communities

### STT -> Voice Agents
Scribe v2 Realtime is integrated directly into ElevenLabs Conversational AI Agents:
- Agent hears user speech via Scribe v2 Realtime
- Processes with LLM
- Responds via TTS
- Use case: A ZAO onboarding agent that can converse naturally

### Available SDKs
- Python: `elevenlabs` package
- TypeScript/JavaScript: `@elevenlabs/elevenlabs` package
- Flutter, Swift, Kotlin (for Agents platform)

---

## 11. Output Formats

### API Response (Default)
JSON with full word-level detail, speaker IDs, entities, confidence scores.

### Additional Export Formats
Request via `additional_formats` parameter:

| Format | Extension | Use Case |
|--------|-----------|----------|
| **SRT** | .srt | Subtitles for video platforms |
| **TXT** | .txt | Plain text transcript |
| **DOCX** | .docx | Word document for sharing |
| **HTML** | .html | Web-ready formatted transcript |
| **PDF** | .pdf | Printable document |
| **Segmented JSON** | .json | Structured segments for processing |

**Note:** VTT is supported via the web UI and subtitle tools but may not be listed as an `additional_formats` API option. SRT can be trivially converted to VTT.

### Format Options
Each format accepts:
```json
{
  "format": "srt",
  "include_speakers": true,
  "include_timestamps": true,
  "segment_on_silence_longer_than_s": 0.8,
  "max_segment_duration_s": 4,
  "max_segment_chars": 84
}
```

### Response Structure
```json
{
  "additional_formats": [
    {
      "requested_format": "srt",
      "file_extension": "srt",
      "content_type": "text/plain",
      "is_base64_encoded": false,
      "content": "1\n00:00:00,000 --> 00:00:04,500\n[Speaker 0] The fractal meeting is now open.\n\n2\n..."
    }
  ]
}
```

---

## 12. Accuracy Benchmarks Across Accents and Speaking Styles

### Benchmark Results (WER = Word Error Rate, lower is better)

| Benchmark | Scribe v2 | Whisper v3 | Google Gemini | Notes |
|-----------|-----------|------------|---------------|-------|
| FLEURS (English) | 3.3% | ~5-6% | ~4% | Standard benchmark |
| FLEURS (30 languages avg) | Best in class | Higher WER | Comparable | ElevenLabs claims lowest |
| Common Voice | 5.5% | ~7-8% | N/A | Community recordings |
| Italian | 1.3% | Higher | N/A | Romance language strength |
| Indonesian | 2.4% | 7.7% | N/A | 3x better than Whisper |

### Accent Handling
- Scribe v2 is specifically designed to maintain accuracy across "diverse speakers, accents, and delivery styles"
- Internal benchmarks tested "hundreds of challenging English conversation samples featuring poor audio quality, diverse accents, and filler words"
- The `no_verbatim: true` option removes filler words (um, uh, like) for cleaner transcripts

### Major Language Accuracy
~98% accuracy (2% WER) reported for: English, French, Italian, Portuguese, Spanish, German

### Known Strengths
- Handles overlapping speech well
- Robust against background noise and music
- Does NOT hallucinate (unlike Whisper which can generate text not in the audio)
- 102 languages with previously high error rates (>40%) now transcribable

### Scribe v2 Realtime vs Batch Accuracy
- Realtime: 93.5% accuracy (6.5% WER) across 30 languages - best among real-time models
- Batch: 96.7% accuracy (3.3% WER) for English - best overall
- Gap of ~3% accuracy is the trade-off for real-time speed

---

## ZAO Implementation Recommendation

### Phase 1: Post-Session Transcripts (Quick Win)
1. Record fractal meetings via Discord bot (Craig Bot)
2. After session, upload to Scribe v2 batch API with diarization + ZAO keyterms
3. Store transcript in Supabase linked to the session
4. Display in ZAO OS with speaker labels and timestamps
5. Cost: ~$4-5/month

### Phase 2: Spaces Auto-Transcription
1. Stream.io recording webhook triggers transcription
2. Async via ElevenLabs webhook
3. Transcript appears in Spaces session history
4. SRT export for any recorded video content

### Phase 3: Live Captions
1. Scribe v2 Realtime WebSocket during live Spaces
2. Display partial transcripts as live captions
3. Accessibility win for hearing-impaired members
4. Still run batch after for definitive transcript with full features

### Phase 4: Meeting Intelligence
1. Entity detection to extract action items, names, amounts
2. Feed transcripts to LLM for summaries
3. Auto-generate meeting minutes from fractal sessions
4. Cross-reference with governance proposals mentioned in meetings

---

## Compliance Notes
- SOC 2, ISO 27001, PCI DSS Level 1, HIPAA, GDPR compliant
- EU and India data residency options available
- Zero-retention mode (enterprise only) - audio deleted immediately after processing
- Standard retention: check ElevenLabs data policy

---

## Sources
- [ElevenLabs STT API Reference](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)
- [ElevenLabs Realtime STT API](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime)
- [Introducing Scribe v2 Blog](https://elevenlabs.io/blog/introducing-scribe-v2)
- [Introducing Scribe v2 Realtime Blog](https://elevenlabs.io/blog/introducing-scribe-v2-realtime)
- [Scribe v2 Upgrade Blog](https://elevenlabs.io/blog/scribe-v2-just-got-an-upgrade)
- [ElevenLabs Models Overview](https://elevenlabs.io/docs/overview/models)
- [Latenode Scribe Accuracy Test](https://latenode.com/blog/tools-software-reviews/best-ai-tools-2025/elevenlabs-scribe-review-and-accuracy-test)
- [Toolworthy Scribe v2 Review](https://www.toolworthy.ai/tool/elevenlabs-scribe-v2)
- [Parrot Transcription API Comparison](https://www.tryparrot.app/blog/transcription-apis-compared)
- [AssemblyAI Pricing](https://www.assemblyai.com/pricing)
- [Deepgram vs ElevenLabs](https://deepgram.com/learn/deepgram-vs-elevenlabs)
