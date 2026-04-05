# 261 — AI Agent Music Pipeline

**Date:** 2026-04-05
**Source:** https://x.com/eng_khairallah1/status/2040353492846755982

---

## What It Does

AI agent creates music and autonomously distributes it to Spotify, Apple Music, Amazon Music, TikTok, YouTube, Tidal, Deezer, Pandora, and 100+ platforms. Covers everything: metadata, cover art, ISRC codes, royalty collection.

## Stack

| Component | Service | Role |
|-----------|---------|------|
| Music Generation | Suno | Generate tracks from prompts |
| Stem Separation | VoiceHub | Isolate vocals/instruments |
| Distribution | Tuneboto (or equiv) | Push to 100+ DSPs |
| Royalty Collection | ISRC + dist service | Sync rights + collect |

## Agent Workflow

```
1. Prompt: "create a lo-fi jazz track"
2. Suno generates full track
3. VoiceHub separates stems
4. Agent creates cover art (image gen)
5. Tuneboto uploads: audio + art + metadata + ISRC
6. DSPs approve in 1-5 days
7. Royalties auto-collected
8. Agent monitors streams + adjusts strategy
```

## ZAO Relevance

### Artist Agent Template
ZAO's artist agent (P1 in TASKS.md) is described as "everything but the music" — lead gen, booking, career intelligence. This thread shows **the agent CAN do the music too.**

Options:
- **Option A:** ZAO artist agent only handles non-music (career, booking, distribution) — leave music generation to specialists
- **Option B:** ZAO artist agent integrates with Suno + VoiceHub + Tuneboto for full pipeline

### ZAO Revenue Model
If ZAO agents handle full music pipeline:
- **Transaction fee:** 5-10% on DistroKid-style distribution
- **Subscription:** monthly retainer for artists wanting full-service management
- **Token-gated:** $ZOA token holders get priority distribution slots

### FISHBOWLZ Connection
Fishbowl sessions → AI-generated music from discussions → agent uploads to DSPs → royalties flow back to FISHBOWLZ treasury. The fishbowl as a music ideation engine.

### Competitive
This is already being done. ZAO needs to either:
1. Build it faster and better than this individual developer
2. Partner with existing infrastructure (Suno API, TuneGen, etc.)
3. Focus on the curation/community layer — not the pipe

## Technical Notes

- Suno API access is limited/closed. Unofficial APIs exist but may break.
- VoiceHub has a free tier but rate-limited.
- Tuneboto: ~$19/year for unlimited uploads to all DSPs.
- ISRC codes: free via USISPC.org or paid via distributor.

## Action Items
- [ ] Evaluate: should ZAO's artist agent include music generation?
- [ ] Research Suno API status (official vs unofficial)
- [ ] Research VoiceHub API access
- [ ] Compare Tuneboto vs DistroKid vs Soundstr
