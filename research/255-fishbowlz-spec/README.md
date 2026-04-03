# 255 — FISHBOWLZ: Persistent Async Audio Spaces

**Category:** Product / Miniapp
**Status:** Pre-launch (Clanker token Apr 4 2026)
**Priority:** P0

---

## One-Liner

Persistent fishbowl audio rooms where the host can leave and come back the next day — and it's still going.

## Core Concept

Rotating fishbowl format: small group discusses in the hot seat, larger group listens, people rotate in/out. Rooms persist across sessions. Full transcripts. Agents can join as participants via skill.

## Token: $FISHBOWLZ (Clanker)

- Launch: April 4 2026 via Clanker
- Mechanism: tip speakers/rooms with the token
- Simple: join room → listen → tip what you like
- Agent opportunity: agents can tip, agents can host, agents can curate
- All tipping logged for future tokenomics iteration

## MVP Features

1. **Create room** — name, topic, optional schedule
2. **Join as listener or speaker** — hot seat rotation
3. **Rotate in/out** — fishbowl mechanic (small group active, audience watches)
4. **Host persistence** — host leaves, room stays live, host returns next day
5. **Full transcript** — every session transcribed and searchable
6. **JSONL logging** — all actions append-only (tips, joins, rotations, speaks)
7. **Tipping** — $FISHBOWLZ token tips to speakers and rooms

## Post-MVP

- Agent skill: `fishbowlz.join()` — any OpenClaw agent can join a room
- Cross-platform pull: Farcaster spaces audio (native API)
- Cross-platform pull: X Spaces audio (via yt-dlp, one-way capture)
- Whisper transcription for pulled audio
- Room themes / categories
- Leaderboards (most tipped, most active)
- Recording archive with AI summaries

## Technical Notes

- Farcaster miniapp (FC ecosystem native)
- Separate repo under ZAOOS folder
- Own agent: FISHBOWLZ agent (managed by ZOE)
- Audio: WebRTC for live rooms, yt-dlp for X Spaces capture
- Transcription: Whisper (local or API)
- Links: farcaster.xyz format
- X Spaces: yt-dlp extracts live audio stream (free, no API key), can't inject back
- All data logged as JSONL for tokenomics analysis later

## Why Now

- Farcaster Agentic Bootcamp running through Apr 10 — perfect timing
- Apr 7 session on "Embedded Capital & Agentic Commerce" directly relevant
- Apr 10 session on "Multi-Agent Systems" — FISHBOWLZ is exactly this
- Agent + token + social = the wave right now
- Clanker makes token launch frictionless

## Competitive Gap

Nothing combines: persistent rooms + fishbowl rotation + agent participation + token tipping + cross-platform audio pull. Each piece exists somewhere, but the combination is novel.
