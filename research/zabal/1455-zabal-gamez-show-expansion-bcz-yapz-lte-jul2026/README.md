# 1455 — ZABAL Gamez Show Expansion: BCZ YapZ + Let's Talk ETH + ZABAL GAMEZ (Jul 2026)

> **Type:** DECISION
> **Status:** READY TO EXECUTE
> **Owner:** Zaal
> **Created:** 2026-07-18

---

## What This Doc Covers

Spec for expanding ZABAL Gamez to formally incorporate three shows as source material tracks: **BCZ YapZ**, **Let's Talk ETH** (formerly Let's Talk About Web3), and **ZABAL GAMEZ** itself as a self-referential show format. Covers what "adding" each show means, the clip-bounty and Empire Builder leaderboard integration for each, and the phased rollout plan.

---

## Why Expand Beyond Workshop-Only

ZABAL Gamez originally launched as a live build-along workshop (July 2026, zabalgamez.com). The POIDH clip-bounty pipeline (docs 533, 625, 786, 994) proved a model: record session → spark POIDH bounty → community clips it → distribution flywheel.

BCZ YapZ and Let's Talk ETH are both **existing show archives** with 15–19+ hours of content sitting unclipped. Adding them to ZABAL Gamez means:
1. They gain the clip-bounty treatment and community distribution
2. ZABAL Gamez gains variety and recurring content supply independent of live workshops
3. The ZABAL Gamez brand expands from "build event" to "ZAO builder content ecosystem"

---

## The Three Shows

### 1. BCZ YapZ

| Field | Value |
|-------|-------|
| Type | Conversation/interview show |
| Host | Zaal (BetterCallZaal) |
| Archive | bczyapz.com + youtube.com/@bettercallzaal |
| Episodes | 17+ (Episodes 1–17 documented; ongoing) |
| Notable eps | Ep 17 Hannah/Farm Drop, multiple web3 builder interviews |
| Status | Active; graduated to own repo (github.com/bettercallzaal/bcz-yapz) |

**What "adding to ZABAL Gamez" means:**
- Each new BCZ YapZ episode spawns a ZABAL Gamez clip bounty within 48 hours of publish
- Historical episodes (Ep 1–17) get a batch clip-bounty sprint: 3–5 eps per week, POIDH bounties pre-populated via the workshop-page integration (doc 994)
- BCZ YapZ becomes a "track" in the Empire Builder leaderboard (contributors who clip BCZ YapZ content earn Empire points)

**First action:** Launch POIDH clip bounty for the highest-engagement recent episode (use YouTube analytics to pick). Pre-populate using the ZABAL Gamez bounty template.

---

### 2. Let's Talk ETH

| Field | Value |
|-------|-------|
| Type | Live podcast / Twitter Spaces / Twitch |
| Host | Zaal, Ohnahji B, EZinCrypto |
| Archive | pods.media/lets-talk-about-web3 + YouTube |
| Episodes | 19 (Ep 0–18, April–September 2025) |
| Status | Completed run; archive unclipped |
| Notable guests | Will T (Ep 7), DuoDoMusica (Ep 11), Pichi (Ep 14), HURRIC4N3IKE (Ep 16), GESD1 (Ep 17) |

**What "adding to ZABAL Gamez" means:**
- The 19-episode archive gets a dedicated clip-bounty sprint: 2–3 bounties per week, targeting the highest-engagement episodes first
- Ohnahji and EZinCrypto are co-hosts — loop them in as co-judges for clip bounties (provides social amplification from their networks)
- Create a "Let's Talk ETH Vault" page on zabalgamez.com linking all episodes with pre-populated POIDH bounty buttons
- Potential: revive Let's Talk ETH as a ZABAL Gamez-hosted show (quarterly specials vs full re-launch — decision needed, see below)

**First action:** Contact Ohnahji + EZ about participating as co-judges for the archive clip sprint (Zaal-gated outreach). Start clip bounties without waiting for their reply.

---

### 3. ZABAL GAMEZ (self-referential show format)

| Field | Value |
|-------|-------|
| Type | Live build-along + gaming sessions |
| Archive | zabalgamez.com/recordings + YouTube |
| Episodes | July 2026 sessions (Empire Builder live builds, POIDH fireside, etc.) |
| Status | Active and recording |

**What "adding ZABAL GAMEZ to ZABAL Gamez" means:**
- ZABAL Gamez workshop recordings need the same clip-bounty treatment as the other shows
- Create a standardized post-session workflow: within 24 hours of each session, spark a POIDH clip bounty from the recording (use `ziballgames.com/recordings` spark tool — doc 994 action item)
- Add a "ZABAL GAMEZ Highlights" section on the site that surfaces the top-clipped moments from each session
- These become Empire Builder leaderboard contributions: clippers earn points, driving retention between sessions

**First action:** Test the spark tool on the Jul 8 fireside recording at `ziballgames.com/recordings` (board task `058537b1`). If it works, create the post-session automation.

---

## Empire Builder Integration

Each show track gets a named "track" or "activity source" in the ZABAL Gamez Empire:

| Track | Action that earns points | Points |
|-------|--------------------------|--------|
| BCZ YapZ clips | Post a clip from any BCZ YapZ episode with @bettercallzaal tag | 10 pts |
| Let's Talk ETH clips | Post a clip from any Let's Talk ETH episode with archive link | 10 pts |
| ZABAL GAMEZ clips | Post a highlight from any ZABAL Gamez session | 10 pts |
| POIDH bounty won | Win any ZABAL Gamez-affiliated clip bounty | 25 pts |
| Episode watch + comment | React to a ZABAL Gamez Farcaster episode post | 2 pts |

Empire config update: add these 5 new activities to the existing ZABAL Gamez tokenless empire (board task `42058d27` — empire creation already in_progress).

---

## Rollout Plan

### Week 1 (Jul 18–25) — Seed

- [ ] Pick top 3 BCZ YapZ episodes by watch time; create POIDH clip bounties for each
- [ ] Pick top 3 Let's Talk ETH episodes; create POIDH clip bounties for each
- [ ] Test spark tool on Jul 8 ZABAL Gamez fireside
- [ ] Update Empire leaderboard config with the 5 new activities above

### Week 2 (Jul 25–Aug 1) — Volume

- [ ] Continue weekly cadence: 2–3 new clip bounties per week across all 3 shows
- [ ] Add "Vault" pages to zabalgamez.com for BCZ YapZ and Let's Talk ETH archives
- [ ] Contact Ohnahji + EZ about co-judge role (Zaal-gated)
- [ ] Add ZOE automation: after each ZABAL Gamez session, ZOE pings Zaal to spark clip bounty

### Aug 2026 — Steady State

- [ ] All 3 tracks producing at least 1 clip bounty per week
- [ ] POIDH pipeline fully automated: spark → bounty → community clips → ZOL distributes
- [ ] Decide on Let's Talk ETH revival (quarterly specials vs archive-only)

---

## Open Decisions

| Decision | Options | Recommended | Deadline |
|----------|---------|------------|----------|
| Revive Let's Talk ETH as live show? | A) Archive-only clip sprint | **A — archive first, decide revival Sep 1** | Sep 1 |
| | B) Quarterly ZABAL Gamez specials | | |
| | C) Full weekly revival | | |
| BCZ YapZ clip bounty frequency? | Every episode (weekly) vs every 2nd episode | Every episode — matches posting cadence | Immediately |
| POIDH bounty pool per show? | $5 each (minimum) vs $25 for featured episodes | $5 default, $25 for top-viewed episodes | Week 1 |

---

## Related Docs

- [533 — POIDH Clip-Up Bounty: BCZ YapZ Ep 17](../community/533-poidh-clipup-bounty-bcz-yapz-hannah/)
- [786 — ZABAL Gamez Brand Kit Rebuild](../business/786-zabal-gamez-brand-kit-rebuild/)
- [948 — Empire Builder x ZABAL Gamez Build Sesh](../events/948-empire-builder-zabal-gamez-build-sesh/)
- [961 — Agent Droids for ZABAL Gamez](../agents/961-agent-droids-zabalgamez-exponential/)
- [994 — ZABAL Gamez x POIDH Fireside (Jul 8)](../events/994-zabal-gamez-poidh-fireside-unlock-jul8/)
- [1141 — Boostr x Sparkz Campaign Config](../farcaster/1141-boostr-sparkz-campaign-config/)
