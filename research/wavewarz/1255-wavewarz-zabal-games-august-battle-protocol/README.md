# 1255 — WaveWarZ Battle Protocol for ZABAL Games August Final Month

**Type:** STANDALONE  
**Date:** 2026-07-17  
**Status:** Draft — for Zaal + Iman August planning call  
**Board tasks:** d8e31f3b, c993bb9c  

---

## What this is

A concrete battle-protocol proposal for using WaveWarZ as the competitive engine for the August final stretch of ZABAL Games. ZABAL Games is a 3-month build-a-thon ending August 31 — this doc proposes how to integrate WaveWarZ battles to make the final month the most engaging, on-chain, and memorable stretch. Built from the 1,108-battle WaveWarZ dataset (doc 1079), the ZABAL Games builder-submissions.json v2 (9 intake-ready projects), and the existing WaveWarZ growth playbook (doc 1075).

---

## The Core Opportunity

WaveWarZ has 1,108 battles, 524 SOL volume, and a proven community engagement loop: battles → votes → winner advances → more battles. ZABAL Games has 9+ builder projects building tools for the ZAO ecosystem. The final month bridges both: **builders battle each other live on WaveWarZ**, the community votes onchain, and the results feed directly into the final ZABAL Games scoring.

Key mechanic: in WaveWarZ, every battle is a head-to-head vote between two "songs" (in this case: two builder demos or pitches). The existing community — 27 tagged artist handles, daily active traders — becomes the voter base for ZABAL builder competition.

---

## The 3-Track Format (Proposed)

### Track A: Builder Showcase Battle

**Format:** Each of the 9 intake-ready builders gets a 3–5 minute WaveWarZ-style showcase slot. Two builders go head-to-head in a live or async battle. Community votes for the builder who shipped more, explained better, or sparked more community energy.

**WaveWarZ mechanics:**
- Battle type: `MAIN` (premium placement — 3.6% of battles but 70% of volume per doc 1079)
- Vote window: 24h async per round (matches existing Mon–Fri 8:30 PM EST daily battle cadence)
- 3 rounds → quarterfinals → semifinals → final (for 8 builders); or round-robin for smaller cohort

**Scoring for ZABAL Games:**
- Win: +3 points
- Loss: +1 point (entered a battle — shows confidence)
- Audience vote total: used as tiebreaker in final ZABAL scoring

**Builder ask:** 2–3 min loom/video of what they shipped. This becomes their "song" in the battle.

---

### Track B: Artist + Builder Collab Battle

**Format:** Pair one ZABAL builder with one active WaveWarZ artist. They create a joint demo or track together (the builder makes a tool, the artist makes music with/about it). The pair enters a WaveWarZ battle as a team.

**WaveWarZ mechanics:**
- Battle type: `COMMUNITY` (already proven for charity battles — $1,497 raised via benefit battles in doc 1080)
- Vote window: 48h for community battles
- Prize: split between artist + builder from ZAO Fund or sponsor pool

**Why this matters:**
- Pairs ZABAL builders with WaveWarZ artists → cross-community discovery
- Converts isolated builder wins into shared ecosystem moments
- "Build a tool, battle with an artist" is a uniquely ZAO narrative

**Builder ask:** 1 deliverable that an artist can use or respond to. Artist records something using/about that tool.

---

### Track C: Leaderboard Sprint (Volume + Engagement)

**Format:** Not head-to-head battles. Instead, a 4-week leaderboard where ZABAL participants earn points for: entering battles, winning, volume generated, and community engagement (comments, shares, social posts about their build).

**Leaderboard scoring (suggested):**
| Activity | Points |
|----------|--------|
| Enter a WaveWarZ battle | +2 |
| Win a WaveWarZ battle | +5 |
| Volume generated per battle (≥0.5 SOL) | +3 |
| Cross-post battle outcome to X or Farcaster | +1 |
| Another builder votes on your showcase | +1 per vote |
| Pair up for a collab battle (Track B) | +4 |

**Winner:** Highest point total at Aug 31 EOD. Winner gets featured in the ZABAL Games recap + ZAO newsletter + WaveWarZ platform highlight.

**No battle required** — Track C runs alongside A and B. All ZABAL participants auto-enroll. This ensures everyone can engage even if they lose in the head-to-head.

---

## Battle Schedule (Proposed — August 2026)

| Week | Event |
|------|-------|
| Aug 4–8 | Onboarding week: all builders enter at least 1 battle (can be any existing WaveWarZ slot). Track C scoring starts. |
| Aug 11–15 | Track A Round 1: 4 head-to-head builder showcase battles (Mon/Wed/Fri format). Track B collab pairs announced. |
| Aug 18–22 | Track A Semifinals + Track B battles live. Leaderboard update posted to ZAO Telegram + Discord. |
| Aug 25–29 | Track A Final + Track B final. Track C closes Aug 29 EOD. Winners announced Aug 30. |
| Aug 31 | ZABAL Games close: final recap post, winner NFT mint, WaveWarZ platform spotlight. |

---

## Citable Facts (for pitching this format)

1. WaveWarZ has run 1,108 battles since May 2025 with 524 SOL (~$39k) in total volume — the community knows how to vote.
2. MAIN event battles (the 3.6% premium slot) drive 70% of all WaveWarZ volume — placing builder battles here maximizes visibility.
3. WaveWarZ `COMMUNITY` benefit battles have raised $1,497 for charity — the collab track (Track B) uses the same proven format.
4. The existing daily battle cadence (Mon–Fri 8:30 PM EST) means builder battles can slot into an established audience without new scheduling.
5. 27 tagged artist handles means 27 potential collab partners for Track B pairings.

---

## What Zaal + Iman Need to Decide

1. **Which tracks to run?** All 3 is ambitious for a 4-week stretch. A+C is the minimum viable version. B is the most innovative.
2. **Who runs the battle logistics?** Someone needs to create each battle on the WaveWarZ platform per round. Iman can do this in <30 min/week.
3. **Prize pool?** Track A winner and Track B winners need a defined prize. ZAO Fund sponsorship or ZAO treasury allocation.
4. **How does WaveWarZ battle scoring weight in final ZABAL Games scoring?** 10%? 25%? A tiebreaker only?
5. **Do we need Magnetiq's buy-in?** The growth doc (1075) mentions a Magnetiq-WaveWarZ ZABAL Games league — aligning the two would amplify reach.

---

## Minimal Viable Version (for week of Jul 18 decision)

If Zaal + Iman want to move fast: **Track C only**. Add a leaderboard sprint to all August ZABAL participants with zero new battle infrastructure. Every builder who enters an existing WaveWarZ battle earns points. The leaderboard lives in the ZABAL board or a simple Google Sheet. Winner announced Aug 31.

This requires:
- Zaal announces the sprint in ZAO Telegram + ZABAL Discord (1 post)
- Iman tracks points weekly (15 min/week)
- No new code needed (uses existing WaveWarZ platform + leaderboard)

**Track A + C together** adds the showcase head-to-head element and is the recommended version. Track B is the stretch goal.
