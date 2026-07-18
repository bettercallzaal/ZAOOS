# 1565 — ZAO Fractal Democracy: Session Facilitator Guide (Jul 2026)

**Type:** OPERATIONS-GUIDE  
**Topic:** Governance  
**Status:** ACTIVE — Zaal uses this to run every Thursday session. ZOE handles pre-session posts, attendance check, and OREC submission confirmation. Distinct from doc 1475 (participant guide) and doc 1553 (ZOR holder battle voting guide).

---

## The Role of Facilitator

The Fractal Democracy facilitator does three things:
1. Opens the voice session (Juke, Spatial.io, or Discord Stage)
2. Runs the Respect Game rounds (breakout groups, timer, result collection)
3. Submits the round results to OREC on Optimism Mainnet

Zaal facilitates every session unless delegated to a ZOR holder with ≥3 sessions attended. Facilitation is not content creation — the facilitator does NOT need to lead discussion. The format runs itself once launched.

---

## Pre-Session (Tuesday–Wednesday before Thursday)

**ZOE tasks (triggered by Thursday governance reminder):**
- Post to Telegram ZAO channel: "Thursday governance session — 7PM EST. Voice channel link: [LINK]"
- Post to X @bettercallzaal: "ZAO Fractal Democracy this Thursday 7PM EST. ZOR holders: you're distributing Respect tonight." 
- Post to Farcaster /zao: same as X post
- DM to all ZOR holders on Telegram (doc 1499 ZOE has ZOR holder list)

**Zaal tasks (day of):**
- Confirm Juke link or Spatial.io room is active (ZOE can check if link was posted last session)
- Confirm ZOR token distribution amount for this session (default: 500 ZOR per session, split by Respect scores)
- Open OREC admin interface (Optimism Mainnet, contract `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`)

---

## Session Flow (60 Minutes)

### Opening (0:00–0:05)
Zaal opens voice room. Welcome script:

```
Welcome to ZAO Fractal Democracy — Session #[N] of [ongoing total].

Tonight:
• We're using the Fractal Respect Game
• You'll be placed in a group of 3-5 people
• Your group will nominate who contributed most to ZAO this week
• Top contributions → Respect points → ZOR distribution tonight

One rule: you can't nominate yourself.
Let's start. Groups form now.
```

ZOE announces session open in Telegram while Zaal speaks.

### Group Formation (0:05–0:10)
- If ≤8 attendees: 2 groups of 3-4
- If 9–12 attendees: 3 groups of 3-4
- If 13+ attendees: 4+ groups of 3-4

Zaal manually assigns groups (say names out loud). Groups go to breakout rooms or separate voice channels.

**Breakout facilitators:** each group picks a scribe (someone to report results back). Zaal rotates groups so the same people aren't always together.

### Group Discussion Rounds (0:10–0:35)
Each group has 12 minutes:
1. Each person shares one thing they contributed to ZAO this week (2 min each)
2. Group nominates the person who contributed most (5 min discussion)
3. Scribe notes: [Person A] nominated by [Person B] and [Person C]

Timer: ZOE posts a "5 minutes remaining" message to voice-channel text at 0:22, "Time's up" at 0:35.

### Report Back (0:35–0:45)
Each group scribe shares result in main channel:
- Group 1: "[Name A] nominated for [contribution]"
- Group 2: "[Name B] nominated for [contribution]"
- Group 3: "[Name C] nominated for [contribution]"

Zaal records (or ZOE records if audio transcription available): name, contribution cited, group number.

**Tie-breaking:** if two names tied for most nominations across groups, Zaal casts a deciding vote or calls a 2-minute re-vote.

### Respect Score Calculation (0:45–0:50)
Points are proportional to nominations received:
- 1st place (most nominations): 40% of session Respect pool
- 2nd place: 30%
- 3rd place: 20%
- Participation: remaining 10% split among all attendees

Example (500 ZOR session, 8 attendees, 3 nominees):
- 1st place: 200 ZOR
- 2nd place: 150 ZOR
- 3rd place: 100 ZOR
- Each of 8 attendees: 6.25 ZOR (50 ZOR ÷ 8)

Zaal announces scores out loud. Any disputes: majority voice vote.

### OREC Submission (0:50–0:58)
Zaal submits session results to OREC (Optimism Mainnet):

1. Open OREC admin at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
2. Call `recordSession(sessionId, [addresses], [respectScores])`
3. Confirm tx on Phantom/Metamask
4. Paste tx hash in Telegram: "Session #[N] on-chain ✅ — [tx hash]"

**If OREC is unavailable:** record scores in doc 1540 archive template, submit to OREC at next available opportunity. Never skip archiving.

ZOE reads tx hash from Telegram and logs it to the session archive (doc 1540 template).

### Close (0:58–1:00)
```
That's a wrap — Session #[N] complete.

[Name A] topped tonight with [contribution].
ZOR distribution: on-chain via OREC. Check your Phantom wallet in 10 minutes.

Next Thursday: same time, same place.
[ZAOstock angle if within 8 weeks]: Only [N] sessions before ZAOstock Oct 3.
```

---

## Special Sessions

### ZAOstock Preview Session (Sep 25 — Last Thursday Before Oct 3)
This session is also the final governance event before ZAOstock. Modified format:
- Round 1 (0:10–0:22): standard Fractal groups
- Round 2 (0:22–0:35): ZAOstock MAIN battle artist nomination vote (ZOR holders nominate who performs the ZAOstock MAIN battle)
- OREC submission includes both Respect scores AND artist nomination result
- ZOE posts ZAOstock artist announcement immediately after session

### COC Show Sessions (Thursday before or after COC show)
When COC Concertz falls within 1 week of Thursday session:
- Opening remarks mention COC show date
- One group discussion topic: "What artist should be in the next COC MAIN battle?"
- Nominations from this session feed into COC artist selection (doc 1559 Phase 1)

### ZABAL S2 Launch Session (Sep 4 — Week 1 of ZABAL S2)
- All 15+ cohort members join as observers
- Zaal explains Fractal Democracy as the governance backbone of ZABAL S2
- New cohort members not yet ZOR holders: observe only, no Respect this session
- ZOR distribution to holders is reduced by 20% to fund ZABAL S2 welcome ZOR grants (if approved by existing holders)

---

## Edge Cases

| Situation | Resolution |
|---|---|
| Fewer than 4 attendees | Run as single group; everyone nominates 1 other person |
| No OREC submission (Optimism congestion) | Archive in doc 1540 → submit to OREC next session |
| Tie between 3+ people | Zaal casts deciding vote (role of facilitator, not ruler) |
| ZOR holder misses session | No makeup Respect — attend next week |
| Technical voice failure | Reschedule to same time next day or skip; ZOE announces |
| Controversial nomination | Read the nomination aloud; 60-second Q&A; majority group vote overrides facilitator |

---

## ZAOOS Archive (Every Session)

After each session, ZOE logs to the doc 1540 template:

```
| [DATE] | [SESSION #] | [ATTENDEE COUNT] | [TOP CONTRIBUTOR] | [CONTRIBUTION] | [OREC TX HASH] | [ZOR DISTRIBUTED] |
```

ZOE fills from:
- Date, session number: tracked counter (ZOE increments +1)
- Attendee count: voice room count at session open
- Top contributor + contribution: from Telegram report-back messages
- OREC tx hash: from Telegram post-submission message
- ZOR distributed: from Zaal's announcement

After each session, ZOE updates: "ZAO has completed [N] consecutive weekly governance sessions" — canonical claim for grants + press.

---

## ZOE Automation Table

| Trigger | ZOE Action |
|---|---|
| Every Tuesday 9AM | Post Thursday session reminder to Telegram + X + Farcaster |
| Every Tuesday 9AM | DM all ZOR holders on Telegram (session reminder) |
| Thursday 7PM | Post "Session starting now" to Telegram + Farcaster |
| Thursday 7:22PM | Post "5 minutes remaining" to voice-channel text |
| Thursday 7:35PM | Post "Time's up — reporting round" to text channel |
| OREC tx detected in Telegram | Log tx hash + session result to doc 1540 archive |
| Thursday 8:05PM | Post session wrap summary to Telegram (top contributor + ZOR amounts) |
| Friday 9AM | Update governance session counter in ZAOOS canonical stats |

---

## Citable Governance Facts (Update After Each Session)

Post-session, ZOE appends to the canonical claim (doc 1469 and press kit doc 1296):

> "ZAO has held [N] consecutive Fractal Democracy governance sessions, averaging [N] participants per session, distributing [total ZOR] ZOR tokens via on-chain OREC records on Optimism Mainnet."

Current count: 100+ sessions (from session archive). ZOE updates after each session.

---

## Related Docs

- 1475 — Fractal Democracy Session Guide (participant-facing — what attendees should know)
- 1553 — ZOR Holder Voting Guide (WaveWarZ battle voting, distinct from Fractal governance)
- 1540 — Governance Session Archive Template (ZOE fills after each session)
- 1468 — ZOE Daily Operations Manual (ZOE governance reminder tasks)
- 1559 — COC Concertz Artist Management Guide (MAIN battle artist selection via governance vote)
- 1553 — ZOR Holder Battle Voting Guide (IRL vote at ZAOstock Oct 3)
- OREC contract: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` (Optimism Mainnet)
