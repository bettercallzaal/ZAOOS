# 277 — FISHBOWLZ Audio Providers & Architecture

> **Status:** Research complete
> **Date:** 2026-04-04
> **Goal:** Evaluate audio providers for persistent fishbowl rooms and document what ZOE built

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Audio provider (MVP)** | KEEP 100ms HMS — already integrated, ZAO uses it for Spaces, works for MVP |
| **Audio provider (future)** | SWITCH to Daily.co — rooms persist by default, $0.00099/min audio, 25 active mics |
| **Room persistence** | Database problem, not audio problem — room record lives in Supabase, audio sessions are ephemeral |
| **Transcription (MVP)** | KEEP Web Speech API — Chrome/Edge only, good enough for prototype |
| **Transcription (future)** | USE Deepgram Nova-3 — $0.0077/min, <300ms latency, multi-speaker diarization, $200 free credits |
| **Token** | USE Clanker — tag @clanker on Farcaster, auto-deploy ERC-20 on Base, LP locked until 2100 |
| **Fishbowl logic** | Custom app layer — timer rotation, queue, empty chair all in Supabase + React state |

## Comparison of Audio Providers

| Provider | Persistent Rooms? | Audio $/min | Free Tier | Fishbowl Primitives | Already in ZAO |
|----------|-------------------|-------------|-----------|---------------------|----------------|
| **Daily.co** | **YES (default)** | $0.00099 | 2K min/day | Basic (build your own) | No |
| LiveKit | No (workaround) | $0.004 | 10K min/mo | Basic | No |
| Stream.io | No (15 min max) | Contact sales | 500 min/mo | Best (backstage, hand-raise) | Yes (Spaces) |
| 100ms HMS | No (session-based) | ~$0.004 | 10K min/mo | Good (stage/audience) | Yes (Spaces alt) |

**Why Daily.co wins long-term:** Rooms stay alive forever by default. Host leaves, comes back next day, same room URL works. Cheapest audio-only pricing. 100,000 participants in audio-only, 25 active mics.

**Why 100ms is fine for MVP:** Already integrated in ZAO Spaces. Room persistence is handled at database layer — Supabase room record persists, audio sessions are ephemeral.

## ZAO OS Integration

### What ZOE Built (16 files, 3,081 lines)

**API Routes** (`src/app/api/fishbowlz/`):
- `rooms/route.ts` — POST creates rooms with slug, GET lists active rooms
- `rooms/[id]/route.ts` — GET room, PATCH for join/leave/rotate actions
- `sessions/route.ts` — POST creates session tied to room, GET lists sessions
- `events/route.ts` — Append-only JSONL event log via Supabase RPC
- `transcribe/route.ts` — POST accepts transcript segments, GET is Whisper proxy (needs OPENAI_API_KEY)
- `transcripts/route.ts` — POST with SHA256 dedup, GET retrieves by room/session

**Pages** (`src/app/fishbowlz/`):
- `page.tsx` — Landing page with room list + create modal (hot seat slider 2-12)
- `[id]/page.tsx` — Room detail: hot seat grid, listeners, transcript panel, polling every 5s/10s

**Components** (`src/components/spaces/`):
- `HMSFishbowlRoom.tsx` — 100ms HMS wrapper with Web Speech API transcription
- `TranscriptInput.tsx` — Manual transcript input (max 2000 chars)
- `TranscriptionControls.tsx` — TODO stubs (start/stop are no-ops)

**Hooks**: `src/hooks/useLiveTranscript.ts` — Web Speech API continuous transcription
**Lib**: `src/lib/fishbowlz/logger.ts` — Dual persistence (Supabase + localStorage fallback)
**DB**: `supabase/migrations/20260404_fishbowlz.sql` — 4 tables + RLS + log_fishbowl_event RPC

### Known Issues
1. TranscriptionControls.tsx has TODO stubs (no-ops)
2. listener_count_snapshots never populated
3. Web Speech API only works in Chrome/Edge
4. No nav link to /fishbowlz
5. DB migration needs manual run in Supabase SQL editor

## Fishbowl Rotation Mechanics

Standard fishbowl format ([Wikipedia](https://en.wikipedia.org/wiki/Fishbowl_(conversation))):
- **Inner circle (3-6 people):** Active speakers, mics on
- **Outer circle (audience):** Listening only
- **Open fishbowl:** One empty chair — anyone from audience takes it, existing speaker must leave
- **Closed fishbowl:** Timed rotation every 15-20 min

ZOE's implementation: `rooms/[id]/route.ts` handles join_speaker, leave_speaker, join_listener, rotate_in actions. rotate_in ejects first speaker if at capacity. No timer-based auto-rotation yet.

## Open-Source References

| Project | License | What We Can Learn |
|---------|---------|-------------------|
| [Jam](https://github.com/jam-systems/jam) | ISC | P2P audio, stage/audience model, `jam-core` npm package |
| [Resonate](https://github.com/AOSSIE-Org/Resonate) | Flutter | Room creation, speaker moderation |
| [NESHouse](https://github.com/bestony/neshouse) | ISC | Clubhouse clone on Agora |

## Clanker Token Process

1. Tag @clanker in a Farcaster cast with token name/ticker/description/image
2. Clanker auto-deploys ERC-20 on Base (100B supply, non-mintable)
3. Uniswap V4 pool auto-created with WETH pair, LP locked until 2100
4. 1% swap fee — 40% to creator, 60% to Clanker treasury
5. Page at `clanker.world/clanker/[address]` with swap widget
6. Platform: 17,242+ tokens deployed, $50M+ cumulative protocol fees

## Web Speech API Limitations

- Chrome/Edge: Full support (cloud-based)
- Safari: Partial (iOS 14.5+)
- Firefox: No SpeechRecognition support
- Single user only — captures local mic, cannot transcribe remote participants
- No speaker diarization
- Sessions can time out mid-sentence

## Sources

- [Daily.co Room API](https://docs.daily.co/reference/rest-api/rooms/create-room)
- [Daily.co Audio-Only Guide](https://docs.daily.co/guides/products/audio-only)
- [LiveKit Room Management](https://docs.livekit.io/home/server/managing-rooms/)
- [100ms Audio Room](https://www.100ms.live/solutions/audioroom)
- [Deepgram Pricing](https://deepgram.com/pricing)
- [Clanker Docs](https://clanker.gitbook.io/clanker-documentation/general/token-deployments/farcaster-bot-deployments)
- [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
- [Fishbowl Conversation (Wikipedia)](https://en.wikipedia.org/wiki/Fishbowl_(conversation))
- [Jam P2P Audio](https://github.com/jam-systems/jam)
