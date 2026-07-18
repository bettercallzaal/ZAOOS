# 1564 — ZAO Community Spotlight Program

**Type:** PROGRAM-GUIDE  
**Topic:** Community  
**Status:** ACTIVE — ZOE executes weekly starting Aug 1 (same day as ZAOstock invitations + Mirror Article 1 + ZABAL S2 applications open). Each spotlight is a standalone ZAO community-building touchpoint.

---

## Purpose

One weekly spotlight of a ZAO community member: WaveWarZ artist, ZABAL builder, ZOR holder, or ZAOstock attendee. ZOE DMs 3 questions, Zaal approves the draft in 5 minutes, ZOE posts Monday morning.

**Why this matters:**
- Every spotlight is a citation — the person's name, Audius/Farcaster handle, and ZAO connection becomes a ZAOOS record
- ZAOstock Aug 15–Oct 3: 7 spotlight posts build "who's going" anticipation without paid ads
- ZABAL S2 recruitment: spotlights of S1 alumni = social proof for S2 applications
- North Star: community +0.1 per month (recurring human citations = GEO entity links)

---

## Rotation Priority

| Priority | Who | Trigger |
|---|---|---|
| 1 | ZOR holders | Have on-chain governance stake — most citeable |
| 2 | ZABAL S1 graduates / S2 applicants | Aug 1–Sep 1 window = recruitment social proof |
| 3 | WaveWarZ leaderboard artists (doc 1469) | Volume leader = strongest stats angle |
| 4 | ZAOstock confirmed attendees | Aug 15–Oct 3 window = "who's coming" anticipation |
| 5 | Active Telegram members (3+ posts/week) | Community loyalty |
| 6 | New members (<30 days, welcome sequence complete) | Retention |

ZOE maintains a rolling rotation queue in the daily ops sheet (doc 1499). No person is spotlighted more than once per 3 months.

---

## ZOE DM: 3-Question Template

ZOE sends via Telegram DM (or X DM if Telegram unavailable):

```
Hey [Name] 👋

You've been active in ZAO and I'd love to feature you in the ZAO Community Spotlight this Monday.

3 quick questions (reply however you'd like — short is fine):

1. What are you building or creating right now?
2. How did you first connect with ZAO or WaveWarZ?
3. What's your ZAOstock take — are you planning to be there Oct 3?

I'll write a short post from your answers. Takes you 2 minutes, posts Monday.

— ZOE (ZAO Operations Engine)
```

ZOE sends Thursday evening → deadline for reply Friday midnight → Zaal approves Saturday → ZOE posts Monday 9AM EST.

If no reply by Friday midnight: ZOE moves to next person in queue. No chasing.

---

## Spotlight Post Format

**Length:** 180–220 words  
**Platforms:** X @bettercallzaal (thread reply or standalone), Farcaster /zao, Telegram ZAO channel

**Structure:**
1. Opening hook (what they do — 1 sentence from question 1)
2. ZAO connection (how they found us — from question 2)
3. Quote (verbatim from their reply — 1 sentence max)
4. ZAOstock plug (from question 3 if applicable)
5. Link to their Audius/Farcaster/GitHub/site

**Template (ZOE fills from their replies):**
```
ZAO Community Spotlight 🎵

[NAME] is [WHAT THEY DO].

They found ZAO [HOW THEY CONNECTED] — and they've been [WHAT THEY'VE DONE IN ZAO: battled/built/governed/all three].

"[QUOTE FROM THEIR REPLY]"

[ZAOstock angle if applicable: "You'll find them at ZAOstock Oct 3 in Ellsworth, ME."]

🎵 [Audius link]
🐸 [Farcaster handle]
🛠️ [GitHub or site if builder]

One of [N] builders and artists in the ZAO ecosystem.
```

---

## ZAOstock Window (Aug 15 – Oct 3)

7 spotlights leading into ZAOstock — each one a "who's coming" signal:

| Date | Spotlight Priority | ZAOstock Angle |
|---|---|---|
| Aug 18 | ZAOstock confirmed artist #1 | "Performing Oct 3" |
| Aug 25 | ZOR holder / active governance | "Voting IRL Oct 3" |
| Sep 1 | ZABAL S2 cohort member | "Building at ZAOstock" |
| Sep 8 | WaveWarZ leaderboard artist | "Battling at ZAOstock" |
| Sep 15 | ZAOstock volunteer | "Running the show Oct 3" |
| Sep 22 | Africa Battle Week participant | "Going global then ZAOstock" |
| Sep 29 | New member who bought ticket | "First ZAO event" |

These 7 spotlight posts replace paid advertising for ZAOstock — each one reaches the spotlight subject's audience organically.

---

## ZAOOS Archive Protocol

After each spotlight is posted:
- ZOE adds a row to `research/community/spotlight-log.md` (ZOE creates this file on first spotlight)
- Format: `| [Date] | [Name] | [Handle] | [Track: artist/builder/holder] | [Post link] |`
- Each spotlight row = a ZAOOS citation of that person as a ZAO community entity
- After 10 spotlights: ZOE generates a "ZAO Community Members" block for ZAOOS README update (citeable: "ZAO community includes [N] builders and artists featured in weekly spotlights")

---

## Cross-Platform Coordination

| Platform | Post | Timing |
|---|---|---|
| X @bettercallzaal | Full spotlight post | Monday 9AM EST |
| Farcaster /zao | Same post (slightly shorter, remove Twitter-specific formatting) | Monday 9:05AM EST |
| Telegram ZAO | Short version: "This week's spotlight: [Name] — [1-line bio]. What they said about ZAO: '[quote]'" | Monday 9:10AM EST |

**@wavewarz cross-post rule:** ONLY if the spotlight subject is an active WaveWarZ artist. If so, ZOE also posts a shorter version to @wavewarz tagging their Audius profile. Never double-post a non-WW-artist to @wavewarz.

---

## ZOE Automation Table

| Trigger | ZOE Action |
|---|---|
| Every Thursday 6PM EST | Pull next name from rotation queue, send 3-question DM |
| Friday midnight | If no reply: flag to Zaal, move to backup name |
| Saturday | ZOE drafts full spotlight post, sends to Zaal for approval |
| Monday 9AM | Post to X, Farcaster, Telegram (simultaneous) |
| Monday 10AM | ZOE adds spotlight log row to research/community/spotlight-log.md |
| After 10 spotlights | ZOE flags for ZAOOS README community citation update |

---

## Metrics (ZOE tracks in 7PM EOD report)

- Impressions per spotlight (X analytics via ZOE — see if format improves over time)
- Spotlight subject's Telegram/Farcaster follow-through (did they engage with the post?)
- ZAOstock ticket conversions from spotlight window (Aug 18–Sep 29: compare ticket pace to spotlight cadence)
- Target: ≥500 impressions per spotlight on X @bettercallzaal by ZAOstock (7 posts × 500 = 3,500 combined impressions)

---

## Related Docs

- 1552 — ZAO Telegram Welcome Sequence (spotlight = post-welcome Phase 2 engagement)
- 1535 — ZAO Artist Community Activation Pack (artist-specific activation; spotlight = Phase 1 of artist activation)
- 1469 — WaveWarZ Platform Snapshot (top 4 artists by volume = first WW spotlight candidates)
- 1383 — ZAOstock Artist Experience Guide (confirmed artists = ZAOstock window spotlight subjects)
- 1453 — ZAO Community Map (who's in the ZAO ecosystem — spotlight draws from this)
- 1499 — ZOE Daily Ops Report (spotlight queue maintained in daily ops sheet)
- 1385 — WaveWarZ @wavewarz X Content Strategy (artist spotlight cadence on @wavewarz — distinct from this program)
