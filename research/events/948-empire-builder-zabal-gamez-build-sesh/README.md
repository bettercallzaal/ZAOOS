---
topic: events
type: recap
status: research-complete
last-validated: 2026-07-03
related-docs:
original-query: "meeting recap: Empire Builder x ZABAL Gamez build sesh (2026-07-03)"
tier: STANDARD
meeting-date: 2026-07-03
platform: recording (mp4, local mlx-whisper transcription)
---

# 948 - Empire Builder x ZABAL Gamez build sesh (recap, 2026-07-03)

> **Goal:** A ~62-min working session between the Empire Builder team and ZAO on token strategy, Empire Builder integration, and async governance - ending with a plan to co-build a game live and submit it to ZABAL Gamez.

> **Transcript note:** Whisper single-block, heavy padding. Speaker attribution is medium-confidence (no name tags); owners on softer items are marked low.

## Attendees

Attributed from content: **Person A** (primary; on vacation in Greece, returning to Australia Monday), **Adrian** (Empire Builder dev), **Zaal**, **Jordan** (Empire Builder workflows), **Divi Fly** (demo player). "George" mentioned as possibly joining.

## Summary

Three interleaved threads: (1) token strategy - Person A will wait for Clanker v5 before any zavall migration and will airdrop existing holders if it happens; (2) Empire Builder integration - tokenless empires for rapid prototyping, droids on existing tokens, Farcaster agents (ZOL), the Glonky vibe-coin launcher; (3) community + governance - Adrian's "Empire Labs" curated builder network, and Zaal's async Respect Game (Farcaster mini-app, peer-voted contribution, no weekly meeting). A territory-conquest minigame was demoed live (playable, needs speed work) with a plan to port it onto Empire Builder's leaderboard and submit to ZABAL Gamez.

## Decisions

| Decision | Owner | Confidence |
|----------|-------|------------|
| Create a second Empire API key for Person A (manual, no self-serve yet) | Adrian | High |
| Wait for Clanker v5 before any zavall token migration | Person A | High |
| Airdrop existing zavall holders if a migration happens | Person A | High |
| Tokenless empire as the default for rapid game prototyping | Adrian/Person A | Medium-High |
| Build "Empire Labs" - a curated service-provider network in Discord | Adrian | Medium |
| Async Respect Game (Farcaster mini-app, peer voting, no weekly meeting) | Zaal | Medium |
| Schedule a live-build stream (Zaal + Person A, screen share) | Both | Medium |

## Action Items

| Action | Owner | Due | Confidence |
|--------|-------|-----|------------|
| Rotate + issue the second Empire API key | Adrian | Same call | High |
| Person A to message Zaal timezone when back (Monday); book Tue 9pm ET / 11am Melbourne live-build | Both | This week | High |
| Create an Empire (leaderboard) for the demo game, then submit to ZABAL Gamez | Person A | Next session | Medium |
| Fix Glonky vibe-coin image-generation (front-end specialist, crew split not bounty) | Person A + collaborators | This month | Low-Medium |
| Add a 30-min open call after the weekly Empire Builder meeting | Adrian/Zaal | Ongoing | Medium |
| Iterate ZOL bot as a Farcaster agent under the ZOE orchestrator | Zaal | Ongoing | Low-Medium |

## Quotes

- "with empire builder you can just use the existing infrastructure that uses splits, audited contracts, uses our leaderboard system... so you don't have to build all that out." - Adrian
- "if you're just creating a mini game... just create a tokenless empire to start with." - Adrian
- "I want to create it in an asynchronous fashion such that we don't have to meet weekly, and what we put in the mini app is what we've contributed... vote on it asynchronously." - Zaal (async Respect Game)
- "one of the things that I want to bring together is kind of like empire labs... the curated people that we know we trust offering services." - Adrian

## Research Seeds

- Clanker v5 migration mechanics (holder support); droids on legacy tokens (does not exist yet); Empire Builder self-serve API-key portal; Farcaster mini-app async-voting UX; ZOL bot agent iteration loop; Wave Wars eth-Seoul bridge (audit/liquidity); Glonky image-gen blocker; Empire Labs trust/curation model.

## Memory-Worthy

- **Glonky bot** - personality-driven vibe-coin launcher (separate from Clanker); image-gen blocker.
- **Empire Labs** - Adrian's planned curated builder/artist network in the Empire Discord; crew economics (splits) over bounties.
- **Tokenless empires** - new best practice: prototype mechanics first, add token/rewards later.
- **Phased ZABAL Gamez submission** - tokenless empire -> leaderboard -> optional NFT -> optional token -> airdrop -> Farcaster button.
- **Async Respect Game** - Zaal's governance experiment (Farcaster mini-app, agentic tally) to solve weekly-meeting fatigue.

## Sources

- Local recording transcribed via mlx-whisper (whisper-large-v3-turbo), 2026-07-03. Full transcript in transcript.md. [PARTIAL - Whisper single-block with heavy padding; speaker attribution medium-confidence, softer-item owners marked low]

## Re-verify pass 2026-08-20 (full 817-line transcript re-read)

All four quotes verified verbatim at their cited lines; every technical claim
(splits, audited contracts, leaderboard, boosters, droids-on-legacy-tokens,
self-serve API-key portal, ZOL under ZOE) traced to source. No fabricated
numbers. Four corrections.

### "zavall" should be ZABAL

The brand appears as `zavall` three times here. The transcript says "Zabal"; the
canonical form is **ZABAL** (all caps - `CLAUDE.md` brand glossary). Left in
place rather than silently rewritten, because a doc's own text is evidence of
what a transcript produced - but any copy taken from this doc should use ZABAL.

### "eth-Seoul bridge" is almost certainly eth-SOLANA

The transcript renders it "eth to soul" (385). WaveWarZ runs on **Solana + Base**
(memory `project_wavewarz_canonical`, doc 743), and no Seoul/Korea context
appears anywhere in the call. "Seoul" looks like a plausible-sounding cleanup of
a phonetic transcription, which is the more dangerous kind of error - it reads as
a fact. Treat as **Solana**, unverified against the audio.

### A ~90-line legal/regulatory block is missing entirely

Transcript ~440-530 carries a substantial discussion of WaveWarZ smart-contract
decentralisation, enforcement risk and liability structure. It is absent from
this recap - not summarised, not seeded, not flagged. That matters more than
usual because it is the same subject as **doc 951** (the Greg/Autonomous legal
call), and a future decision that reads only one of the two gets half the
picture. Anyone re-opening the WaveWarZ legal question should read both.

Two other under-covered blocks: the live Iceberg territory-game demo (~111-260)
and the game/point/leaderboard mechanics (~260-353). The recap represents roughly
a tenth of the transcript, which is fine for decisions and thin for mechanics.

### Confidence inconsistency

The live-build stream is Medium in the decisions table and High in the action
items, for the same commitment - and the transcript settles a concrete slot
("tuesday 9 00 p.m", with the Melbourne conversion). The action item has it
right.

### Status 2026-08-20

Every dated action here has passed: the API-key rotation (same-day), the Tuesday
live-build, the Glonky image-gen fix (June), and the create-Empire step. None
carries a completion record. Read them as history unless separately revived.
