---
topic: zabal, zoe, operations
type: activation-playbook
status: EXECUTE SEP 1 — ZOE runs this playbook on Sep 1. All tasks from 9AM ET onwards. GATED items require Zaal approval before ZOE posts. Synthesizes docs 1677 (ZABAL S2 ops), 1693 (Newsletter Issue 2), 1675 (Sep content calendar) into a single sequenced activation checklist.
last-validated: 2026-07-18
related-docs: 1677-zabal-s2-zoe-weekly-ops-guide, 1693-zao-newsletter-issue-2-aug2026, 1675-farcaster-content-calendar-sep2026, 1626-zabal-s2-curriculum-spec, 1567-zabal-s2-participant-tracker-spec
action-owner: ZOE (all posts and tasks below); Zaal (approves gated items, sends newsletter, opens first session)
send-date: 2026-09-01
---

# 1704 — Sep 1, 2026: ZABAL S2 Launch Day Operations

> **What this is:** The complete ZOE activation playbook for Sep 1 — the single most event-dense day in ZAO's 2026 calendar. On this day, three things happen simultaneously: Newsletter Issue 2 sends (doc 1693), ZABAL S2 Week 1 kicks off (doc 1677), and the September Farcaster content calendar activates (doc 1675). This doc sequences all of it so ZOE knows what to do and when.
>
> **What ZOE is doing on Sep 1:** Sending newsletter → posting to Farcaster → posting to Telegram → running pre-session reminder for ZABAL S2 Week 1 → monitoring session → recording attendance → posting session recap.
>
> **What Zaal is doing on Sep 1:** Approving newsletter (by 9AM) → running ZABAL S2 Week 1 session (2PM) → sending attendance list to ZOE (by 4PM) → attending Fractal session (if Thursday).

---

## Pre-Day: Aug 31 Checklist (ZOE)

Before Sep 1, ZOE must complete:

- [ ] Newsletter Issue 2 draft complete and sent to Zaal by 10PM (doc 1693)
- [ ] All brackets in Newsletter Issue 2 filled: WaveWarZ battle count, SOL stats, ZAOstock ticket count, ZABAL S2 cohort size, ZAOstock artist list, charity name
- [ ] ZABAL S2 Supabase `zabal_s2_participants` count confirmed (the [N] in "N builders and musicians")
- [ ] Pre-session reminder drafted for Sep 1 Week 1 (doc 1677 template — Sunday reminder but Sep 1 is Monday so this is the go-live reminder instead)
- [ ] Sep 1 Farcaster posts staged in ZOL / ZOE queue: cohort announcement to /zabal + /zao (doc 1675)
- [ ] ZABAL S2 Telegram group active and all accepted participants added
- [ ] Session join link confirmed with Zaal (Zoom/Juke/TG voice — needed for Week 1 post)

---

## Sep 1 Timetable

All times ET.

### 8:00 AM — Status Check

ZOE sends Zaal Telegram:
```
Sep 1 launch checklist:
- Newsletter Issue 2: ready, awaiting your approval
- ZABAL S2 Week 1 session: [confirm join link]
- Cohort size confirmed: [N] participants in Supabase
- ZAOstock ticket count: [N] tickets sold to date

Reply 'send newsletter' when ready. Then approve the session join link.
```

### 9:00 AM — Zaal Approval Window

**GATED:** ZOE holds all sends until Zaal replies.

If no reply by 9:00 AM: ZOE sends reminder.
If no reply by 9:30 AM: ZOE sends "Holding all Sep 1 posts. Reply 'go' when ready."

### 9:30 AM — ZABAL S2 Cohort Announcement (if Zaal approved by now)

ZOE posts to Farcaster /zabal + /zao (doc 1675 Sep 1 template):
```
ZABAL Season 2 is here.

[N] builders and musicians confirmed.
12 weeks, Sep 1 - Nov 21.

Track A (Artists): 5+ WaveWarZ battles, an on-chain release, a governance vote.
Track B (Builders): 2+ PRs, ZOE/Hurricane architecture, 3 ZAOOS docs.

The cohort decides what ZAO builds next.

Season 1 had 32 participants. We built more than we expected.

S2 starts today.
```

ZOL posts to Farcaster /wavewarz (battle-context companion):
```
WaveWarZ activity about to spike.

ZABAL S2 musicians start their battle requirements today. 
Each Track A participant must complete 5+ battles by Nov 21.

New artists incoming.
```

### 10:00 AM — Newsletter Issue 2 Send

**GATED:** Zaal must have approved (replied 'send newsletter' or equivalent) before ZOE sends.

ZOE sends Newsletter Issue 2 via Paragraph to full list.

Immediately after send:
- ZOE posts to Farcaster /zao: `ZAO Brief Issue 2 is out. ZAOstock lineup revealed. ZABAL S2 starts now. Africa Battle Week in 21 days. [Paragraph link]`
- ZOE posts to ZAO Telegram: `Newsletter Issue 2 is live — [Paragraph link]`
- ZOE logs send to `~/.zao/zoe/newsletter-log.jsonl`: `{"issue": 2, "sent_at": "[timestamp]", "subscribers": [N]}`

### 10:30 AM — ZABAL S2 Individual Welcome DMs

For each accepted participant who hasn't received their welcome DM (check `zabal_s2_participants.welcome_dm_sent` field):

ZOE sends via Farcaster XMTP or Telegram (whichever the participant registered with):
```
Welcome to ZABAL Season 2.

You're in. Here's what Week 1 looks like:

Today (Sep 1): ZABAL S2 official launch — see the /zabal announcement cast.
First session: [Sep 1 or Sep 4 — confirm with Zaal before sending] at 2:00 PM ET.
Join link: [confirm with Zaal]

What to do before the first session:
- Follow /zabal and /wavewarz on Farcaster
- Join the ZABAL S2 Telegram group (link below if not already in)
- Track A (Artists): create a WaveWarZ account at wavewarz.info
- Track B (Builders): request access to the ZAOOS GitHub repo from @bettercallzaal

Telegram group: [ZABAL S2 group invite link]

Questions? Reply here or in the Telegram group.

Looking forward to what you build.
```

ZOE marks each sent DM in Supabase:
```sql
UPDATE zabal_s2_participants 
SET welcome_dm_sent = true, welcome_dm_sent_at = NOW()
WHERE id = [participant_id]
```

### 11:00 AM — ZABAL S2 /zao Announcement

ZOE posts to /zao Farcaster (community-wide):
```
ZABAL S2 is now in session.

[N] builders and musicians. Sep 1 – Nov 21.
12 weeks. WaveWarZ battles. ZAOOS docs. ZAOstock.

Follow /zabal for weekly updates.
```

### 1:45 PM — Session Go-Live Post

ZOE posts to ZABAL S2 Telegram:
```
ZABAL S2 Week 1 starts in 15 minutes.
[Join link]
```

ZOE posts to Farcaster /zabal:
```
ZABAL S2 Week 1 starting in 15 minutes.

Orientation: ZAO overview, WaveWarZ mechanics, what the 12 weeks look like.

Join: [link]
```

### 2:00 PM — Session Active (Monitor Only)

ZOE monitors ZABAL S2 Telegram for technical issues but does NOT post during the session.

If someone reports a broken join link: ZOE alerts Zaal immediately via Telegram.

### ~3:30 PM — Attendance Recording

Zaal sends attendance list via Telegram: `@zaoclaw_bot attended: handle1, handle2, handle3...`

ZOE writes to Supabase `zabal_s2_attendance`:
```sql
INSERT INTO zabal_s2_attendance (participant_id, session_date, session_number, module, attended)
VALUES (..., '2026-09-01', 1, 'orientation', true)
ON CONFLICT (participant_id, session_number) DO UPDATE SET attended = EXCLUDED.attended
```

Participants NOT in the attended list: ZOE marks `attended = false` for session 1.

If attendance list not received by 4:00 PM: ZOE DMs Zaal: "Week 1 attendance not logged yet. Reply with attended list."

### 4:30 PM — Session Recap Post

ZOE posts to Farcaster /zabal (doc 1677 Monday post-session template):
```
ZABAL S2 Week 1 done.

[N]/[Total] participants showed up for orientation.
ZAO overview. WaveWarZ economics. What the 12 weeks look like.

First WaveWarZ battles happen next week (Track A).
First ZAOOS doc assignment next week (Track B).

Follow /zabal to watch this cohort build.
```

ZOE posts to ZABAL S2 Telegram:
```
Week 1 recap:

[N] showed up for orientation.
[Same content as Farcaster cast]

Week 2: [one sentence from curriculum — first battle week / first ZAOOS research week].
```

### 5:00 PM — End-of-Day Summary to Zaal

ZOE sends Zaal a Telegram:
```
Sep 1 launch summary:

Newsletter sent: yes / [time]
  Subscriber count at send: [N]

ZABAL S2 Week 1:
  Participants who attended: [N]/[Total]
  Welcome DMs sent: [N]
  
Farcaster posts live:
  /zabal cohort announcement: yes
  /zao community post: yes
  /wavewarz WW spike preview: yes

All Sep 1 tasks complete.
Next action: Tuesday 9AM at-risk check (none expected for Week 1, but ZOE runs it anyway).
```

---

## Failure Protocols

### Newsletter fails to send
ZOE waits 15 minutes, retries once. If still failing: ZOE DMs Zaal with the full newsletter text as a Telegram message and asks "Paragraph is down — should I post the text to /zao directly as a long-form cast?"

### Zaal doesn't approve newsletter by 10:30 AM
ZOE delays newsletter send until Zaal approves. Posts cohort announcement to Farcaster at 9:30 AM as scheduled (this is not gated). Notes in 5PM summary that newsletter send was delayed.

### ZABAL S2 session fails to start (no join link, platform down)
ZOE posts to ZABAL S2 Telegram at 1:50 PM: "Week 1 session delayed — join link issue. Zaal is working on it. Hold on."
ZOE DMs Zaal: "Session join link not confirmed. Post the link in Telegram and I'll share it."

### Fewer than 50% attend Week 1
ZOE escalation trigger: sends Zaal alert within 30 minutes of session end. Does NOT post a negative attendance number publicly. Posts recap with "[N] showed up" — no percentage mentioned if it would look bad. Zaal decides whether to post publicly.

### Welcome DM delivery fails for any participant
ZOE retries once (1-hour delay). If retry fails: logs to `~/.zao/zoe/errors.jsonl` and alerts Zaal with the participant's name and preferred contact method.

---

## Task Checklist (Print/Screenshot for Zaal)

| Time | Task | Owner | Done |
|------|------|-------|------|
| Aug 31 10PM | Newsletter Issue 2 draft → Zaal | ZOE | [ ] |
| Sep 1 8AM | Status check DM to Zaal | ZOE | [ ] |
| Sep 1 9AM | Zaal approves newsletter | Zaal | [ ] |
| Sep 1 9:30AM | Cohort announcement → /zabal + /zao + /wavewarz | ZOE | [ ] |
| Sep 1 10AM | Newsletter Issue 2 send via Paragraph | ZOE | [ ] |
| Sep 1 10AM | Newsletter cross-posts to /zao Farcaster + Telegram | ZOE | [ ] |
| Sep 1 10:30AM | Welcome DMs to all accepted participants | ZOE | [ ] |
| Sep 1 11AM | /zao community announcement post | ZOE | [ ] |
| Sep 1 1:45PM | Session go-live post → Telegram + /zabal | ZOE | [ ] |
| Sep 1 2PM | Week 1 session runs | Zaal facilitates | [ ] |
| Sep 1 ~3:30PM | Attendance list → ZOE (attend: handle1...) | Zaal | [ ] |
| Sep 1 ~3:30PM | Write attendance to Supabase | ZOE | [ ] |
| Sep 1 4:30PM | Session recap → /zabal + ZABAL S2 Telegram | ZOE | [ ] |
| Sep 1 5PM | End-of-day summary → Zaal Telegram | ZOE | [ ] |

---

## Sources

- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — standing weekly rhythm + all templates used in this doc
- `research/community/1693-zao-newsletter-issue-2-aug2026/` — Newsletter Issue 2 full content spec + ZOE send protocol
- `research/farcaster/1675-farcaster-content-calendar-sep2026/` — Sep 1 Farcaster post templates
- `research/zabal/1626-zabal-s2-curriculum-spec/` — Track A/B requirements + Week 1 curriculum
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase table schema + write patterns
