# Doc 216 — AI Features for ZAO OS Live Rooms & Music

> **Date:** 2026-03-28
> **Status:** Research Complete
> **Category:** Music, Curation & Artist Revenue / AI Agent & Intelligence

---

## Summary

Research into six AI feature categories for ZAO OS live rooms and music: auto-transcription, song identification, real-time audio moderation, AI DJ assistant, sentiment analysis, and auto-highlights. Includes provider comparisons, pricing, and integration paths with existing ZAO OS infrastructure (Perspective API moderation, Minimax LLM, Livepeer streaming, 100ms rooms, Supabase Realtime listening rooms).

---

## Table of Contents

1. [Auto-Transcription (Live Captions)](#1-auto-transcription-live-captions)
2. [Song Identification](#2-song-identification)
3. [AI Content Moderation (Audio)](#3-ai-content-moderation-audio)
4. [AI DJ Assistant](#4-ai-dj-assistant)
5. [Sentiment Analysis](#5-sentiment-analysis)
6. [Auto-Highlights](#6-auto-highlights)
7. [Existing ZAO OS AI Infrastructure](#7-existing-zao-os-ai-infrastructure)
8. [Pricing Comparison Matrix](#8-pricing-comparison-matrix)
9. [Implementation Plan](#9-implementation-plan)
10. [Sources](#10-sources)

---

## 1. Auto-Transcription (Live Captions)

Real-time speech-to-text for live room conversations, enabling captions, searchable archives, and accessibility.

### Provider Comparison

| Provider | Latency | Streaming | Languages | Free Tier | Price (Streaming) | Key Differentiator |
|----------|---------|-----------|-----------|-----------|-------------------|-------------------|
| **Deepgram** | <300ms | WebSocket | 36+ | $200 credit | $0.0077/min ($0.46/hr) | Fastest, best accuracy, audio intelligence bundled |
| **AssemblyAI** | ~400ms | WebSocket | 99 | $50 credit | ~$0.15/hr connection | Content safety built-in, topic detection |
| **Gladia** | 103ms partial | WebSocket | 100+ | 10 hrs/mo free | $0.25-0.55/hr | All features bundled (diarization, sentiment), Whisper-based |
| **Whisper (self-hosted)** | 380-520ms | Custom WebSocket | 99 | Free (compute cost) | $0 API / ~$0.10-0.50/hr GPU | Full control, no API dependency |

### Recommendation: Deepgram (Primary) + Whisper (Fallback)

**Why Deepgram:**
- Sub-300ms latency is critical for live captions in rooms
- WebSocket streaming API maps directly to ZAO OS real-time architecture
- $200 free credit covers ~430 hours of streaming — enough for months of rooms
- Audio intelligence (sentiment, topics, intent) included at minimal extra cost
- Speaker diarization identifies who is speaking in multi-person rooms

**Why Whisper as fallback:**
- Self-hosted via WhisperLive or VoiceStreamAI for zero ongoing API cost
- Can run on a modest GPU ($0.10-0.50/hr on Modal, Replicate, or own VPS)
- Useful for batch transcription of recorded rooms (post-session archiving)
- Projects: [WhisperLive](https://github.com/collabora/WhisperLive), [VoiceStreamAI](https://github.com/alesaccoia/VoiceStreamAI)

### Integration Path

1. Capture room audio via 100ms server-side recording or WebRTC audio track
2. Stream audio chunks to Deepgram WebSocket endpoint
3. Receive partial + final transcripts in real-time
4. Broadcast captions via Supabase Realtime to all room participants
5. Store final transcript in Supabase for search/archive

---

## 2. Song Identification

Shazam-like detection of what is playing in a room or on the radio — auto-populate "now playing" metadata.

### Provider Comparison

| Provider | Database Size | Detection Speed | Streaming | Free Tier | Pricing | Best For |
|----------|--------------|-----------------|-----------|-----------|---------|----------|
| **ACRCloud** | 150M+ tracks | 1-3 seconds | Yes (continuous monitoring) | 14-day trial | ~$32/10K requests | Continuous monitoring, broadcast |
| **AudD** | Large (undisclosed) | 1-5 seconds | Yes ($45/stream/mo) | 300 requests | $5/1K requests, $45/stream/mo | Simple API, stream monitoring |

### Recommendation: ACRCloud

**Why ACRCloud:**
- 150M+ track database covers nearly everything members will play
- Continuous stream monitoring mode — feed room audio and get automatic "now playing" updates
- Supports both snippet identification (user-triggered) and always-on monitoring
- 14-day free trial with full API access
- Established industry standard (used by Shazam-scale apps)

**Why not AudD:**
- $45/stream/month adds up quickly with multiple rooms
- Smaller documented database
- Better for one-off identification, not continuous monitoring

### Integration Path

1. Route room audio (or music player audio) to ACRCloud identification endpoint
2. Send 10-15 second audio snippets every 30 seconds during playback
3. On match: update room "now playing" metadata in Supabase
4. Display track info (title, artist, album art) in room UI
5. Optional: link to Songlink/Odesli (already researched in Doc 111) for cross-platform links

---

## 3. AI Content Moderation (Audio)

Real-time moderation of spoken content in rooms for toxicity, hate speech, threats.

### Current State in ZAO OS

ZAO OS already has text moderation via **Perspective API** (`src/lib/moderation/moderate.ts`):
- Scores text for TOXICITY, SEVERE_TOXICITY, IDENTITY_ATTACK, INSULT, THREAT
- Flag threshold: 0.8, auto-hide threshold: 0.9 (SEVERE_TOXICITY)
- Fail-open design (content passes if API errors)
- Rate limit: 1 QPS on free tier

### Audio Moderation Options

| Approach | Provider | Latency | Cost | Accuracy |
|----------|----------|---------|------|----------|
| **Transcribe + Perspective** | Deepgram + Perspective API | ~500ms total | $0.46/hr + free | Good for text toxicity, misses tone |
| **Native audio moderation** | Mediafirewall AI | Real-time | Enterprise pricing | Detects tone, aggression, slurs directly from audio |
| **Transcribe + classify** | Deepgram + Minimax/Claude | ~800ms total | $0.46/hr + LLM cost | Most flexible, custom categories |
| **AssemblyAI content safety** | AssemblyAI | ~500ms | $0.15/hr base | Built-in sensitive topic detection |

### Recommendation: Deepgram Transcription + Perspective API (Phase 1)

**Rationale:** ZAO OS already has Perspective API integrated. The simplest path is:
1. Transcribe room audio in real-time (Deepgram)
2. Feed transcript segments through existing `moderateContent()` function
3. Flag/mute speakers when SEVERE_TOXICITY threshold is hit

**Phase 2:** Add Mediafirewall AI or custom tone analysis for detecting aggression/harassment that text-only analysis misses (sarcasm, threatening tone with "clean" words).

### Integration Path

1. Deepgram streams transcript of each speaker (with diarization)
2. Every sentence/utterance runs through `moderateContent()` from `src/lib/moderation/moderate.ts`
3. If flagged: emit warning to room admins via Supabase Realtime
4. If auto-hide threshold: auto-mute speaker, notify admins
5. Log moderation events for review

---

## 4. AI DJ Assistant

Auto-suggest next tracks based on current mood, genre, energy level, and audience preferences.

### Provider/Approach Comparison

| Approach | Provider | What It Does | Cost | Integration Complexity |
|----------|----------|-------------|------|----------------------|
| **Music tagging API** | Cyanite | Tags tracks with mood, genre, energy, instruments (15s segments) | ~290EUR/mo | Medium — tag library, then match |
| **LLM-based recommendations** | Minimax (existing) | Prompt with current track + mood + history, get suggestions | Already integrated | Low — extend existing Minimax integration |
| **Audio feature analysis** | Spotify Web API | Audio features (valence, energy, danceability, tempo) | Free (rate limited) | Medium — need Spotify track matching |
| **Collaborative filtering** | Custom (Supabase) | "Listeners who liked X also liked Y" from play/respect data | $0 (compute only) | High — needs play history data |
| **Open-source ML** | Deej-AI | Deep learning playlist generation from audio features | Free (self-hosted) | High — model hosting needed |

### Recommendation: Minimax LLM + Cyanite Tags (Hybrid)

**Phase 1 — Minimax (already integrated):**
ZAO OS already has Minimax at `src/lib/apo/minimax.ts` and `src/app/api/chat/minimax/route.ts`. Extend the existing integration:

```
Prompt: "You are a DJ assistant for a music community. The current room mood
is [energetic/chill/dark/uplifting]. The last 5 tracks played were:
[track list with genres]. The audience reaction is [positive/mixed/low engagement].
Suggest 5 tracks that would flow well next, considering genre transitions
and energy arc. Prefer tracks from our community library: [track IDs]."
```

This is the fastest path to a working AI DJ since the LLM integration already exists.

**Phase 2 — Cyanite for precision:**
- Tag the community music library with Cyanite (mood, genre, energy per 15s segment)
- Store tags in Supabase alongside track metadata
- Use tags for programmatic matching (find tracks with similar energy/mood profile)
- Feed Cyanite tags into Minimax prompts for more accurate suggestions

**Phase 3 — Collaborative filtering:**
- Use existing respect-weighted curation (`src/lib/music/curationWeight.ts`) as signal
- Track co-listening patterns from Supabase Realtime rooms
- Build "listeners who respected X also respected Y" recommendations

### Integration Path

1. Extend Minimax API route with a `/api/chat/dj-suggest` endpoint
2. Feed current track metadata + room mood + recent play history
3. Return ranked suggestions from community library
4. DJ or auto-queue picks from suggestions
5. Display "AI suggests..." card in room UI

---

## 5. Sentiment Analysis

Analyze chat messages and reactions to gauge audience mood in real-time.

### Provider/Approach Comparison

| Approach | Provider | What It Analyses | Latency | Cost |
|----------|----------|-----------------|---------|------|
| **Speech sentiment** | Deepgram Audio Intelligence | Spoken words (positive/neutral/negative per utterance) | Real-time | $0.0003/1K input tokens |
| **Chat text sentiment** | Perspective API (existing) | Text toxicity (not sentiment per se) | ~200ms | Free (1 QPS) |
| **Chat text sentiment** | Minimax LLM (existing) | Full sentiment + emotion classification | ~500ms | Per-token |
| **Reaction aggregation** | Custom (Supabase) | Emoji reactions, respect actions, hand raises | Instant | $0 |
| **NLP keywords** | textAnalysis.ts (existing) | Topic extraction, entity detection, hashtags | Instant | $0 |

### Recommendation: Multi-Signal Mood Score (Custom)

ZAO OS already has the building blocks. Combine them:

**Signal 1 — Chat sentiment:** Run chat messages through a lightweight classifier. The existing `textAnalysis.ts` (`src/lib/ai/textAnalysis.ts`) already has TF-IDF keyword extraction and entity detection. Add a simple sentiment lexicon (positive/negative word lists) or use Minimax for batch classification.

**Signal 2 — Reaction velocity:** Track emoji reactions per minute, respect actions, and hand raises from existing Supabase Realtime data. High reaction velocity = high engagement.

**Signal 3 — Speech sentiment (Phase 2):** When Deepgram transcription is integrated, add their sentiment analysis ($0.0003/1K tokens) for spoken content.

**Signal 4 — Listener retention:** Track join/leave events from Supabase Presence (already used in `useListeningRoom.ts`). Rising listener count = positive mood.

**Composite mood score:**
```
mood_score = (chat_sentiment * 0.3) + (reaction_velocity * 0.3) +
             (speech_sentiment * 0.2) + (listener_retention * 0.2)
```

### Integration Path

1. Aggregate chat sentiment from existing room chat messages
2. Track reaction counts per 60-second window via Supabase
3. Compute mood score server-side, broadcast to room
4. Display mood indicator in room UI (e.g., energy meter, mood emoji)
5. Feed mood score into AI DJ assistant for adaptive track selection

---

## 6. Auto-Highlights

Detect exciting moments in rooms for automatic clip creation.

### Signal Detection

Exciting moments in a live music room correlate with:

| Signal | How to Detect | Source |
|--------|--------------|--------|
| **Audience reaction spike** | Sudden increase in chat messages, emojis, respect actions | Supabase Realtime |
| **Energy peak in audio** | Volume/energy spike in room audio (applause, cheering) | Web Audio API AnalyserNode |
| **Speaker emphasis** | Raised voice, exclamation marks in transcript | Deepgram transcript + sentiment |
| **Song drop/transition** | BPM change, energy shift in music | Cyanite segment analysis or Web Audio API |
| **New speaker joins** | Notable member takes the stage | 100ms / room events |
| **Chat keyword spikes** | "fire", "amazing", "wow" clusters | TF-IDF from existing textAnalysis.ts |

### Tools for Clip Creation

| Tool | What It Does | Cost | API Available |
|------|-------------|------|---------------|
| **Livepeer Clip API** | Create clips from live streams | Existing integration | Yes (`/api/livepeer/clip/route.ts`) |
| **Lighthouse (LINE)** | Open-source highlight detection from audio/video | Free | Library, not API |
| **OpusClip** | AI clip extraction from long-form video | $15-50/mo | Limited API |
| **Custom (Web Audio API)** | Detect energy peaks client-side | $0 | N/A |

### Recommendation: Custom Signal Detection + Livepeer Clips

**ZAO OS already has Livepeer clip creation** at `src/app/api/livepeer/clip/route.ts`. The missing piece is automated moment detection.

**Phase 1 — Reaction-based highlights:**
1. Track chat message rate + reaction rate per 30-second window
2. When rate exceeds 2x the rolling average, mark as "highlight candidate"
3. Buffer 30 seconds before and 60 seconds after the spike
4. Create clip via existing Livepeer clip API
5. Store highlight metadata in Supabase with timestamp + trigger reason

**Phase 2 — Audio energy detection:**
1. Use Web Audio API `AnalyserNode` to monitor room audio energy levels
2. Detect sudden energy spikes (applause, crowd reaction, drop)
3. Combine with reaction signals for higher-confidence detection

**Phase 3 — AI-powered selection:**
1. Feed Deepgram transcript + mood scores + energy data to Minimax
2. Ask: "Which moments in this room session would make the best 60-second highlights?"
3. Auto-generate highlight reels for post-session sharing

---

## 7. Existing ZAO OS AI Infrastructure

### Already Integrated

| Component | Location | Status |
|-----------|----------|--------|
| **Perspective API** (text moderation) | `src/lib/moderation/moderate.ts` | Active — TOXICITY, SEVERE_TOXICITY, IDENTITY_ATTACK, INSULT, THREAT |
| **Minimax LLM** | `src/lib/apo/minimax.ts`, `src/app/api/chat/minimax/route.ts` | Active — general AI assistant |
| **Text analysis (TF-IDF, entities, topics, hashtags)** | `src/lib/ai/textAnalysis.ts` | Active — keyword extraction, entity detection, topic segmentation |
| **Respect-weighted curation** | `src/lib/music/curationWeight.ts` | Active — reputation-based track ranking |
| **Livepeer streaming + clips** | `src/lib/livepeer/client.ts`, `src/app/api/livepeer/clip/route.ts` | Active — stream creation, clip extraction |
| **100ms rooms** | `src/app/api/100ms/` | Active — audio rooms with stage management |
| **Supabase Realtime** | `src/hooks/useListeningRoom.ts` | Active — DJ commands, presence, sync |

### Key Insight

ZAO OS already has significant AI infrastructure. Four of six features can be built primarily by extending existing integrations rather than adding entirely new services. Only Deepgram (transcription) and ACRCloud (song ID) require new API integrations.

---

## 8. Pricing Comparison Matrix

### New API Costs (Monthly Estimates)

Estimated for ~100 hours/month of live room activity:

| Service | Use Case | Monthly Estimate | Notes |
|---------|----------|-----------------|-------|
| **Deepgram** (streaming STT) | Transcription + captions | ~$46/mo (100 hrs) | $200 free credit covers first 4+ months |
| **Deepgram** (audio intelligence) | Sentiment, topics | ~$3/mo | Minimal token cost on top of STT |
| **ACRCloud** | Song identification | ~$32-96/mo | Depends on request volume (10K-30K/mo) |
| **Cyanite** | Music tagging (Phase 2) | ~290EUR/mo | Only if precision DJ is needed |
| **Perspective API** | Text moderation | $0 | Already integrated, free tier |
| **Minimax** | DJ suggestions, analysis | Existing cost | Already integrated |
| **Livepeer** | Clip creation | Existing cost | Already integrated |

### Total New Cost: ~$50-150/month

With Deepgram's $200 free credit, effective cost is **$0 for the first 4+ months**, then ~$50-80/month for core features (transcription + song ID). Cyanite adds ~$290/month if precision music tagging is needed.

### Cost Optimization

- **Deepgram free credit:** $200 covers ~430 hours of streaming transcription
- **ACRCloud trial:** 14-day free trial for song identification testing
- **Whisper fallback:** Self-hosted for batch/archive transcription at GPU cost only
- **Selective transcription:** Only transcribe when rooms are active with 3+ participants
- **Caching:** Cache ACRCloud results in Supabase to avoid duplicate lookups

---

## 9. Implementation Plan

### Phase 1 — Foundation (2-3 days)

**Priority: Auto-Transcription + Audio Moderation**

These share the same dependency (Deepgram) and provide the highest value:
- Live captions improve accessibility
- Audio moderation extends existing Perspective API coverage to spoken content
- Transcripts enable all downstream features (search, highlights, sentiment)

| Task | Effort | Dependency |
|------|--------|------------|
| Deepgram account + API key setup | 30 min | None |
| Create `/api/transcription/stream` WebSocket proxy route | 2 hrs | Deepgram key |
| Integrate with 100ms server-side recording / audio capture | 3 hrs | 100ms |
| Broadcast captions via Supabase Realtime | 1 hr | Transcription route |
| Feed transcript to existing `moderateContent()` | 1 hr | Transcription route |
| Captions UI overlay in room view | 2 hrs | Broadcast working |
| Store transcripts in Supabase for archive/search | 1 hr | Transcription route |

### Phase 2 — Intelligence (2-3 days)

**Priority: Song ID + AI DJ + Sentiment**

| Task | Effort | Dependency |
|------|--------|------------|
| ACRCloud account + integration | 3 hrs | None |
| "Now Playing" auto-detection in rooms | 2 hrs | ACRCloud |
| Minimax DJ suggestion endpoint (`/api/chat/dj-suggest`) | 2 hrs | Existing Minimax |
| Composite mood score (chat + reactions + retention) | 3 hrs | Supabase data |
| Mood indicator UI in room view | 1 hr | Mood score |
| Feed mood into DJ suggestions | 1 hr | Both above |

### Phase 3 — Highlights (1-2 days)

**Priority: Auto-Highlight Detection + Clip Creation**

| Task | Effort | Dependency |
|------|--------|------------|
| Reaction spike detector (chat rate + emoji rate) | 2 hrs | Supabase Realtime |
| Auto-clip trigger via existing Livepeer clip API | 2 hrs | Spike detector + Livepeer |
| Highlight gallery UI (per-room and global) | 3 hrs | Clips stored |
| Audio energy detection via Web Audio API | 2 hrs | Room audio access |

### Phase 4 — Polish (Ongoing)

| Task | Effort | Dependency |
|------|--------|------------|
| Cyanite music tagging for precision DJ | 3 hrs | Library tracks |
| Collaborative filtering from play/respect history | 5 hrs | Sufficient data |
| Mediafirewall AI for tone-based moderation | 3 hrs | Enterprise pricing |
| Transcript search across all past rooms | 3 hrs | Stored transcripts |
| AI highlight reel generation (Minimax) | 3 hrs | Phase 3 complete |

### Total Estimated Effort

- **Phase 1:** 2-3 days (transcription + moderation)
- **Phase 2:** 2-3 days (song ID + DJ + sentiment)
- **Phase 3:** 1-2 days (highlights)
- **Phase 4:** Ongoing polish

**New env vars needed:**
- `DEEPGRAM_API_KEY` — streaming transcription + audio intelligence
- `ACRCLOUD_ACCESS_KEY` + `ACRCLOUD_ACCESS_SECRET` — song identification
- `CYANITE_API_KEY` — music tagging (Phase 4 only)

---

## 10. Sources

### Auto-Transcription
- [Deepgram Pricing](https://deepgram.com/pricing)
- [Deepgram Best Speech-to-Text APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [AssemblyAI Pricing](https://www.assemblyai.com/pricing)
- [AssemblyAI Real-Time Transcription](https://www.assemblyai.com/products/streaming-speech-to-text)
- [Gladia Pricing](https://www.gladia.io/pricing)
- [Gladia Real-Time Transcription](https://www.gladia.io/product/real-time)
- [WhisperLive (GitHub)](https://github.com/collabora/WhisperLive)
- [VoiceStreamAI (GitHub)](https://github.com/alesaccoia/VoiceStreamAI)

### Song Identification
- [ACRCloud Music Recognition](https://www.acrcloud.com/music-recognition/)
- [ACRCloud API Docs](https://docs.acrcloud.com/reference/identification-api)
- [AudD Music Recognition API](https://audd.io/)
- [AudD Stream Monitoring Docs](https://docs.audd.io/streams/)

### Audio Moderation
- [Mediafirewall AI Audio Moderation](https://mediafirewall.ai/moderations/AUDIO)
- [AssemblyAI Content Moderation](https://www.assemblyai.com/blog/content-moderation-what-it-is-how-it-works-best-apis-2)
- [Amazon Transcribe Toxicity Detection](https://docs.aws.amazon.com/pdfs/ai/responsible-ai/transcribe-toxicity-detection/transcribe-toxicity-detection.pdf)

### AI DJ / Music Recommendation
- [Cyanite Music Analysis API](https://cyanite.ai/2025/10/06/music-analysis-api-integration/)
- [Cyanite API Documentation](https://api-docs.cyanite.ai/)
- [Deej-AI Deep Learning Playlists (GitHub)](https://github.com/teticio/Deej-AI)
- [AI Music Curation with LangGraph + Spotify](https://medium.com/@astropomeai/ai-music-curation-creating-an-ai-dj-assistant-with-langgraph-studio-and-spotify-api-560a492b7c2b)

### Sentiment Analysis
- [Deepgram Audio Intelligence](https://deepgram.com/product/audio-intelligence)
- [Deepgram Sentiment Analysis Docs](https://developers.deepgram.com/docs/sentiment-analysis)
- [Deepgram Real-Time Sentiment Analysis Guide](https://deepgram.com/learn/real-time-sentiment-analysis-streaming-audio)

### Auto-Highlights
- [Lighthouse Highlight Detection (GitHub)](https://github.com/line/lighthouse)
- [Livepeer Studio](https://livepeer.studio/)
- [Livepeer AI Phase 4 Retrospective](https://forum.livepeer.org/t/ai-spe-phase-4-retrospective/3208)

### Existing ZAO OS Research
- [Doc 43 — Live Audio Rooms & Streaming](../../_archive/043-webrtc-audio-rooms-streaming/)
- [Doc 100 — Synchronized Listening Rooms v1](../../music/185-synchronized-listening-rooms/)
- [Doc 109 — Synchronized Listening Rooms v2](../../music/185-synchronized-listening-rooms/)
- [Doc 111 — Songlink/Odesli API](../../music/187-songlink-odesli-api/)
- [Doc 128 — Music Player Complete Audit](../../music/190-music-player-complete-audit/)
- [Doc 213 — Spaces Streaming Architecture](../../_archive/213-spaces-streaming-architecture-debug-guide/)
