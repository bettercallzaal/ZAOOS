---
topic: governance, fractal, zoe
type: ops-guide
status: ACTIVE — ZOE follows this guide every week for ZAO Fractal sessions. Season 9 is current (through ~Oct 2026). Season 10 starts Nov 2026 (adds CR submission window — see doc 1691). Update if session format or timing changes.
last-validated: 2026-07-18
related-docs: 1619-fractal-democracy-session-guide, 1691-fractal-contribution-request-protocol, 1699-session97-africa-kickoff-runbook, 1587-craig-bot-fractal-audio-archive, 1677-zabal-s2-zoe-weekly-ops-guide
action-owner: ZOE (all automation tasks below); Zaal (facilitates session, confirms topic, sends Respect scores after session)
---

# 1706 — ZOE Fractal Weekly Operations Guide

> **What this is:** ZOE's standing weekly routine for ZAO Fractal Democracy sessions. Analogous to doc 1677 (ZABAL S2 ZOE ops) but for Fractal — the governance backbone that runs 52 times per year. This doc covers what ZOE does each week: pre-session reminders, post-session recap, audio archive handoff, and Season 10 CR protocol integration (starting Nov 2026).
>
> **Session frequency:** Weekly, typically Thursday. Exact day varies — Zaal confirms each week in ZAO Telegram.
>
> **ZOE access needed:** ZAO Telegram (post/monitor), Neynar signer for /zao Farcaster casts, ZAO Fractal audio archive path (Craig bot output), OREC monitoring (Optimism Mainnet), Season 10: Supabase `fractal_cr_submissions` table (doc 1691).

---

## Standing Weekly Rhythm

### Monday (Session Planning)
**Time:** 10:00 AM ET

**ZOE action: Session topic check**
Query Zaal via Telegram:
```
Fractal session this week: what's the topic?
Reply with: (1) session topic, (2) confirm Thursday [date] [time] ET, (3) any special guests or proposals this week?
```

If Zaal doesn't reply by Tuesday noon: ZOE sends a second prompt. If no reply by Wednesday noon: ZOE posts the session reminder with "topic TBD" and fills in the date/time from pattern (last week + 7 days, same time).

### Tuesday (Pre-Session Post)
**Time:** 12:00 PM ET

**ZOE action: Telegram reminder**
Post to ZAO Telegram group:
```
ZAO Fractal this Thursday — [date] at [time] ET.

Topic: [from Zaal reply, or "open session — bring your updates"]

Fractal Democracy: show up, reach consensus, earn Respect.
[Join link — confirm with Zaal or use recurring link]

Respect score leaderboard: [Zaal or ZOE posts if available]
```

**ZOE action: Farcaster /zao cast**
```
ZAO Fractal Democracy: [date].

[Session topic if known]

Weekly governance. 100+ consecutive sessions. Zero quorum failures.

[time] ET — join ZAO Telegram for the link.
```

### Thursday (Session Day)

**Time:** 1 hour before session (typically 4:00 PM ET if 5PM session)

**ZOE action: Final reminder**
Post to ZAO Telegram:
```
ZAO Fractal starts in 1 hour.

[topic]

[Join link]
```

**Time:** During session (typically 5-6:30 PM ET)

ZOE does NOT post during the session. Craig bot (doc 1587) records audio automatically.

ZOE monitors Telegram for technical issues (broken link, audio failure) and DMs Zaal immediately if someone reports a problem.

**Time:** Within 2 hours of session end

**ZOE action: Session recap**

Zaal sends ZOE a brief recap via Telegram: `@zaoclaw_bot recap: Session [N] — [topic] — [attendee count] — [key outcome or decision]`

ZOE posts to Farcaster /zao:
```
ZAO Fractal Session [N] — [date].

[N] participants. [topic covered].

[Key outcome or decision if any]

Running streak: [N] consecutive weekly sessions.
On-chain governance via Fractal Democracy. Every week.
```

ZOE posts to ZAO Telegram:
```
Session [N] recap:
[Same content]

Respect scores will be issued by Zaal via OREC. Check your wallet.
```

If Zaal doesn't send a recap within 2 hours of session end: ZOE DMs Zaal: "Session recap needed for /zao post. Reply: @zaoclaw_bot recap: [your recap]"

**Time:** Same evening (within 4 hours of session end)

**ZOE action: Audio archive handoff**
Per doc 1587 (Craig bot Fractal archive):
1. Craig bot saves session audio to ZAO Fractal archive path
2. ZOE checks that the recording is in the expected location
3. ZOE logs the session to `~/.zao/zoe/fractal-sessions.jsonl`:
   ```json
   {"session": N, "date": "2026-09-[DD]", "topic": "...", "attendees": N, "audio_archived": true}
   ```
4. If audio file is missing or incomplete: ZOE DMs Zaal: "Craig bot recording for Session [N] not found. Did the recording succeed? Check [path]."

### Friday (Post-Session)

**Time:** 10:00 AM ET

**ZOE action: Respect score monitoring**

If Zaal issued Respect scores after the session (OREC transaction on Optimism Mainnet):
1. ZOE monitors Optimism for new OG Respect token mints (`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`)
2. If new mints detected: ZOE posts to ZAO Telegram: "Respect scores issued for Session [N]. Check your wallet."
3. ZOE posts to Farcaster /zao: `ZAO Fractal Respect issued — Session [N]. [N] participants ranked. On-chain via Optimism.`

**ZOE action: Weekly Fractal streak update**
ZOE updates the running session counter in the ZAO canonical facts doc (doc 1201 or equivalent). The "100+ consecutive sessions" claim is updated here.

---

## Season 10 Addition: CR Protocol (Starting Nov 2026)

Starting Season 10 (~Nov 2026, per doc 1691), Contribution Requests (CRs) add a monthly cycle on top of the weekly session rhythm.

### Week 1 of Each Month (CR Submission Window)
**ZOE action: CR submission announcement**

Post to ZAO Telegram (first Monday of each month, 10AM ET):
```
ZAO Fractal CR window is open.

Submit a Contribution Request by [last day of Week 1].
Template: [link to ZAOOS doc 1691 submission form or GitHub template]

A CR = proposing specific work + USDC bounty.
The community votes at this week's session.
```

ZOE collects CR submissions via Telegram (`@zaoclaw_bot cr-submit: [title] | [problem] | [deliverable] | [timeline] | [USDC ask]`) and logs to Supabase `fractal_cr_submissions` table:
```sql
INSERT INTO fractal_cr_submissions (title, problem, deliverable, timeline, usdc_ask, submitter_fid, submitted_at, status)
VALUES (...)
```

### CR Review Session (Week 1 Thursday session)
**ZOE action: CR summary for session facilitator**

1 hour before the Week 1 session, ZOE sends Zaal:
```
CR submissions for this month:

[N] CRs submitted.

[For each CR:]
- [Title] — [Submitter] — $[USDC] — [Timeline]
  Deliverable: [one sentence]

Prepare to present each CR to the group for community review.
```

### CR Voting (During Week 1 session)
ZOE does not participate in the session. ZOE records the outcome Zaal sends after:
`@zaoclaw_bot cr-vote: [CR title] approved/rejected [vote count] [details]`

ZOE updates Supabase `fractal_cr_submissions.status` to `APPROVED` or `REJECTED`.

### CR Completion and Payout (End of Month)
When a submitter completes their CR, they post:
`@zaoclaw_bot cr-complete: [CR title] [evidence URL]`

ZOE updates status to `COMPLETED`, logs evidence URL, and DMs Zaal:
```
CR completion submitted: [title]
Submitter: [handle]
Evidence: [URL]
USDC requested: $[amount]

Approve payout? Reply: @zaoclaw_bot cr-pay: [title] yes/no
```

If Zaal approves: ZOE logs `payout_approved = true` and sends Zaal the wallet address to pay to.

---

## ZABAL S2 Fractal Crossover Weeks

ZABAL S2 sessions in Weeks 5 (Sep 29) and 10 (Nov 2) align with Fractal Democracy governance sessions. On these weeks, ZOE adds to the Fractal reminder:

```
Note for ZABAL S2 participants: this week's Fractal session is part of your Week [5/10] curriculum requirement. Attendance is encouraged and counts toward your ZOR session record. Join by [time].
```

Per doc 1677 (ZABAL S2 ops), ZOE also adds a Fractal reminder to the ZABAL S2 Telegram on the Thursday of W5 and W10 at 5PM ET.

---

## ZOE Telegram Commands (Fractal)

| Command | What ZOE does |
|---------|--------------|
| `@zaoclaw_bot recap: Session [N] — [topic] — [count] — [outcome]` | Records recap, posts to /zao + Telegram |
| `@zaoclaw_bot cr-submit: [title] \| [problem] \| [deliverable] \| [timeline] \| [USDC]` | Logs CR to Supabase `fractal_cr_submissions` |
| `@zaoclaw_bot cr-vote: [title] approved/rejected [details]` | Updates CR status in Supabase |
| `@zaoclaw_bot cr-complete: [title] [evidence-URL]` | Updates CR to COMPLETED, prompts Zaal for payout approval |
| `@zaoclaw_bot cr-pay: [title] yes` | Records payout approval; sends submitter wallet address to Zaal |
| `@zaoclaw_bot fractal-streak` | ZOE replies with current consecutive session count |

---

## What ZOE Does NOT Do for Fractal

- **Facilitate the session:** Zaal runs all governance sessions
- **Issue Respect tokens:** Only Zaal (via OREC) submits Respect score transactions
- **Vote on CRs:** ZOE records votes but does not vote or advocate
- **Approve or reject CRs:** Community decides; ZOE records
- **Execute OREC proposals:** Zaal executes; ZOE monitors for new transactions

---

## Escalation Triggers

1. Session audio (Craig bot) not found within 3 hours of session end
2. Less than 4 participants attend (quorum risk — first session this has happened in 100+ weeks)
3. Zaal doesn't send a recap within 3 hours of session end (ZOE DMs escalation reminder)
4. OREC transaction detected without a corresponding session recap (ZOE asks Zaal what was executed)
5. CR payout not confirmed within 48h of Zaal approval (ZOE sends reminder)

---

## Sources

- `research/governance/1619-fractal-democracy-session-guide/` — canonical reference for session format, Respect token contracts, OREC
- `research/governance/1691-fractal-contribution-request-protocol/` — Season 10 CR submission, review, and payout protocol
- `research/governance/1699-session97-africa-kickoff-runbook/` — Session 97 kickoff (most recent session runbook)
- `research/technology/1587-craig-bot-fractal-audio-archive/` — Craig bot audio recording spec
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Thursday Fractal reminder additions for ZABAL S2 W5 + W10
