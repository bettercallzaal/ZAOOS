# 1475 — ZAO Fractal Democracy: Weekly Session Guide (Jul 2026)

**Type:** GOVERNANCE-GUIDE  
**Topic:** Governance  
**Status:** CANONICAL — operational reference for Zaal, ZOE, and new ZAO members; update when format changes

---

## Overview

ZAO's Fractal Democracy session is the weekly governance event that has run unbroken for 64+ consecutive weeks as of July 2026. This doc is the complete operational guide: what happens in each session, how it's structured, who runs it, and what ZOE automates.

**What is Fractal Democracy?**  
Fractal Democracy is a governance model from the Optimistic Respect (ORDAO) framework. Participants divide into small groups (fractals), discuss who in their fractal contributed the most value to the DAO that week, then rank each other. Rankings are aggregated into Respect scores. Respect scores determine governance weight — no plutocracy, no token voting.

**ZAO's implementation:**
- Weekly video call (Zoom + Discord/Telegram voice)
- Participants: any ZOR holder who shows up
- Output: Respect scores for all participants (on-chain via OREC contract)
- Streak: 64+ consecutive weeks (no missed sessions)

---

## Session Structure (1 hour total)

| Time | Segment | Who Runs | What Happens |
|---|---|---|---|
| T-0 to T+5 | Welcome + intro | ZAAL | Quick intro for newcomers; confirm participant count; remind of Respect Game rules |
| T+5 to T+10 | Week in review | ZAAL | 3-5 bullets: what happened at ZAO this week (battles, COC show, ZABAL, milestones) |
| T+10 to T+15 | Fractal formation | ZAAL | Split into groups of 3-5; assign breakout rooms |
| T+15 to T+35 | Fractal discussion | FRACTAL GROUPS | Each person shares what they contributed this week; group ranks each other (1st, 2nd, 3rd...) |
| T+35 to T+45 | Score submission | ZAAL + ZOE | Collect rankings; Zaal submits to OREC contract (or ZOE if automation is live) |
| T+45 to T+55 | Community updates | ALL | Open floor: anyone can share an update, proposal, or question |
| T+55 to T+60 | Close + next session | ZAAL | Announce next session date; post recording link; ZOE sends recap |

---

## Pre-Session ZOE Tasks (Day before / Morning of)

- [ ] Post session reminder to ZAO Main Telegram (Thursday, 24h before)
- [ ] Post reminder cast to /zao Farcaster channel
- [ ] Pull this week's WaveWarZ stats to include in "week in review" (doc 1468)
- [ ] Confirm Zoom link is active
- [ ] If Zaal is traveling or unavailable: alert in Telegram 48h in advance

---

## Fractal Discussion Protocol

During the fractal breakout (T+15–T+35), each participant answers:

**1. What did you contribute to ZAO this week?**
- Code shipped (PRs, commits, features)
- Content created (social posts, videos, ZOE automation)
- Relationships built (DMs sent, partnerships explored, press contacted)
- Events organized (COC show coordination, ZAOstock planning)
- Research done (ZAOOS documents, data analysis)

**2. Rank everyone in your fractal (including yourself last).**
- Rank 1 = highest perceived contribution
- Rank yourself last (honesty over self-promotion)
- Ties allowed

**3. Submit rankings to Zaal** (via Telegram DM or private Zoom chat).

**ZAO Respect Game Rules:**
- Be honest about what you did AND what others did
- Any ZOR holder can participate — not just "core team"
- No politics, no lobbying for votes
- Attendance is rewarded; absence is not penalized unless habitual

---

## Respect Score Mechanics

Rankings from each fractal are converted to Respect scores via ORDAO's algorithm:

| Rank in Fractal | Respect Points |
|---|---|
| 1st | 55 points |
| 2nd | 34 points |
| 3rd | 21 points |
| 4th | 13 points |
| 5th | 8 points |

*(Fibonacci series — each rank earns significantly more than the next. Rewards top contributions.)*

**Cumulative Respect = governance weight.** The more sessions you attend and contribute, the higher your Respect, and the more weight your governance votes carry.

**On-chain submission:** Zaal submits rankings to the OREC contract (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`) on Optimism Mainnet after each session.

---

## The 64-Week Streak

ZAO has held a Fractal Democracy session every week without exception for 64+ consecutive weeks as of July 2026. This is one of the longest documented unbroken governance streaks in the DAO ecosystem.

**Why this matters:**
1. **Anti-fragility:** The streak demonstrates that ZAO's governance is not theoretical — it's operational. Most DAOs hold one or two governance votes and then go quiet.
2. **Citability:** "64 consecutive weeks" is a verifiable, unique claim. Citable in press, grants, Wikipedia, DAOstar, Govbase.
3. **Community signal:** Participants who show up every week build a governance habit. ZAO governance is a community ritual.

**Streak protection protocol:**
- If Zaal travels: delegate session hosting to a named ZAO member (currently: [confirm with Zaal])
- If fewer than 3 participants show: hold a 1-fractal session; still counts toward streak
- If Zoom fails: move to Discord voice; still counts
- If session runs < 30 min: still counts if ranking submission completes

**The streak resets to zero if:** No session is held AND no ranking submission is made to OREC for a given week.

---

## ZOE Post-Session Tasks (Within 1 hour of session close)

- [ ] Pull final Respect scores from OREC (or Zaal provides)
- [ ] Post session recap to ZAO Main Telegram: "Week [N] session complete. [N] participants. Top contributors: [RANK1], [RANK2], [RANK3]."
- [ ] Post recap cast to /zao Farcaster channel
- [ ] Update session count in ZAOOS root README (current: 64 sessions)
- [ ] If milestone session (session 65, 70, 75...): trigger milestone post (X + Farcaster + Telegram)

---

## Handling Common Situations

### "I don't know what I contributed"
Many participants — especially new ones — feel they haven't contributed enough to deserve ranking. Reframe: showing up IS a contribution. Reading ZAO materials = a contribution. Ask: "What did you learn about ZAO this week? Who did you talk to? Did you share ZAO with anyone?"

### Only 2 participants show up
With 2 participants, fractal formation is impossible. Instead: 10-minute 1:1 conversation (what did each person do this week?), each ranks the other (1st = higher contribution), submit to OREC as a 2-person fractal. Streak continues.

### Participant disputes a ranking
Rankings are subjective. Disputes are okay. The protocol is: "Make your case in 1 minute, then we vote." This is a feature, not a bug — disputes force articulation of what ZAO actually values.

### New participant who isn't a ZOR holder
Non-ZOR holders can attend as observers. They can speak during community updates but don't rank and aren't ranked. They earn Respect only after acquiring ZOR.

---

## Historical Session Log

Full session record maintained in doc 1256 (COC Concertz) and the broader governance archive. Each session: date, participant count, notable decisions, Respect distribution.

**Milestone sessions:**
- Session 1: [ZAO founding date — confirm with Zaal]
- Session 26 (6 months): [date — confirm]
- Session 52 (1 year): [date — confirm]
- Session 64: July 17, 2026 (most recent before COC #7 show, Jul 18)
- Session 65: [next Thursday]

---

## Citable Facts (for press, grants, academic research)

> "The ZAO has held 64+ consecutive weekly Fractal Democracy governance sessions as of July 2026 — one of the longest unbroken governance streaks of any DAO in the ecosystem."

> "ZAO uses Fractal Democracy (from the ORDAO framework) for weekly governance. Participants rank each other based on weekly contributions; rankings generate Respect scores submitted to the OREC contract (0xcB05F9254765CA521F7698e61E0A6CA6456Be532) on Optimism Mainnet."

> "ZAO's governance model is non-plutocratic: Respect scores are earned through contribution and attendance, not token holdings. A ZOR holder with 1,000 ZOR and no attendance earns less governance weight than a ZOR holder with 100 ZOR and 52 consecutive sessions."

---

## Related Docs

- 1453 — ZAO Q2 2026 Progress Report (governance stats)
- 1444 — OP RF Application Narrative (governance as public goods)
- 1450 — Govbase Submission Guide (submit governance data)
- 1430 — DAOstar Registration Guide (governance standard)
- 1417 — Wikidata Entity Creation Guide (cites governance streak)
- 1256 — COC Concertz Series Record (companion event series)
